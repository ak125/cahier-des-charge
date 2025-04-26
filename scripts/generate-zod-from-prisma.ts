#!/usr/bin/env ts-node
/**
 * Générateur de schémas Zod à partir des modèles Prisma
 */
import { getDMMF } from '@prisma/internals';
import fs from 'fs/promises';
import path from 'path';

// Chemins
const PRISMA_SCHEMA_PATH = path.resolve(process.cwd(), 'prisma/schema.prisma');
const OUTPUT_DIR = path.resolve(process.cwd(), 'src/schemas');

async function generateZodSchemas() {
  console.log('Génération des schémas Zod à partir de Prisma...');
  
  // Lecture du schéma Prisma
  const prismaSchema = await fs.readFile(PRISMA_SCHEMA_PATH, 'utf-8');
  
  // Extraction du modèle de données
  const dmmf = await getDMMF({ datamodel: prismaSchema });
  
  // Création du répertoire cible
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Génération des fichiers pour chaque modèle
  for (const model of dmmf.datamodel.models) {
    const { name, fields } = model;
    
    let schemaContent = `import { z } from 'zod';\n`;
    schemaContent += `import { ${name} } from '@prisma/client';\n\n`;
    
    // Schéma complet
    schemaContent += `export const ${name}Schema = z.object({\n`;
    for (const field of fields) {
      const fieldType = mapPrismaTypeToZod(field);
      schemaContent += `  ${field.name}: ${fieldType},\n`;
    }
    schemaContent += `});\n\n`;
    
    // Schéma pour CREATE (sans ID et timestamps)
    schemaContent += `export const Create${name}Schema = ${name}Schema.omit({\n`;
    const omitFields = fields
      .filter(f => f.isId || f.name === 'createdAt' || f.name === 'updatedAt')
      .map(f => `  ${f.name}: true`).join(',\n');
    schemaContent += `${omitFields || '  // Pas de champs à omettre'}\n});\n\n`;
    
    // Schéma pour UPDATE (tout optionnel)
    schemaContent += `export const Update${name}Schema = Create${name}Schema.partial();\n\n`;
    
    // Types
    schemaContent += `export type ${name}Type = z.infer<typeof ${name}Schema>;\n`;
    schemaContent += `export type Create${name}Type = z.infer<typeof Create${name}Schema>;\n`;
    schemaContent += `export type Update${name}Type = z.infer<typeof Update${name}Schema>;\n`;
    
    // Écriture du fichier
    await fs.writeFile(
      path.join(OUTPUT_DIR, `${name.toLowerCase()}.schema.ts`), 
      schemaContent
    );
    
    console.log(`✅ Schéma généré pour ${name}`);
  }
  
  // Génération de l'index pour exporter tous les schémas
  const indexContent = dmmf.datamodel.models
    .map(m => `export * from './${m.name.toLowerCase()}.schema';`)
    .join('\n');
    
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.ts'), indexContent + '\n');
  
  console.log('✅ Génération terminée');
}

function mapPrismaTypeToZod(field: any): string {
  const { type, isRequired, isList } = field;
  
  let zodType = '';
  switch (type.toLowerCase()) {
    case 'string': zodType = 'z.string()'; break;
    case 'int': case 'bigint': zodType = 'z.number().int()'; break;
    case 'float': case 'decimal': zodType = 'z.number()'; break;
    case 'boolean': zodType = 'z.boolean()'; break;
    case 'datetime': zodType = 'z.date()'; break;
    case 'json': zodType = 'z.record(z.unknown())'; break;
    default: 
      if (field.kind === 'enum') {
        zodType = `z.nativeEnum(${type})`;
      } else {
        zodType = 'z.unknown()';
      }
  }
  
  if (isList) zodType = `z.array(${zodType})`;
  if (!isRequired) zodType += '.optional()';
  
  return zodType;
}

generateZodSchemas().catch(console.error);