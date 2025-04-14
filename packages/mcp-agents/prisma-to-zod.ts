#!/usr/bin/env ts-node
/**
 * 🧠 prisma-to-zod.ts — Générateur automatique de schémas Zod à partir de Prisma
 * 
 * Cet outil analyse votre schéma Prisma et génère automatiquement les schémas
 * Zod correspondants pour la validation côté client et serveur.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import * as minimist from 'minimist';
import * as prettier from 'prettier';

interface CliOptions {
  /**
   * Chemin vers le schéma Prisma
   */
  schemaPath: string;

  /**
   * Dossier de sortie pour les schémas Zod
   */
  outputDir: string;

  /**
   * Préfixe pour les imports Zod
   */
  importPrefix?: string;

  /**
   * Génération ou non de schémas pour les relations
   */
  withRelations?: boolean;

  /**
   * Séparation des schémas par modèle
   */
  splitByModel?: boolean;
}

/**
 * Type de champ Prisma
 */
interface PrismaField {
  name: string;
  type: string;
  isRequired: boolean;
  isArray: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  isReadonly: boolean;
  isRelation: boolean;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  relationType?: 'object' | 'array';
  documentation?: string;
}

/**
 * Modèle Prisma
 */
interface PrismaModel {
  name: string;
  fields: PrismaField[];
  documentation?: string;
  isEnum?: boolean;
  enumValues?: string[];
}

/**
 * Schéma Prisma
 */
interface PrismaSchema {
  models: PrismaModel[];
  enums: PrismaModel[];
}

/**
 * Configuration pour la génération
 */
interface GeneratorConfig {
  /**
   * Les champs qui devraient avoir un type spécifique dans Zod
   */
  customTypes: {
    [key: string]: {
      type: string;
      imports?: string[];
    }
  };

  /**
   * Les champs qui devraient avoir une validation spécifique
   */
  customValidations: {
    [modelName: string]: {
      [fieldName: string]: string[];
    }
  };

  /**
   * Les transformations à appliquer
   */
  transforms: {
    [modelName: string]: {
      [fieldName: string]: string;
    }
  };

  /**
   * Les erreurs à personnaliser
   */
  customErrors: {
    [modelName: string]: {
      [fieldName: string]: {
        [validationType: string]: string;
      }
    }
  };
}

/**
 * Classe principale pour la génération de schémas Zod à partir de Prisma
 */
class PrismaToZodGenerator {
  private schema: PrismaSchema = { models: [], enums: [] };
  private config: GeneratorConfig = {
    customTypes: {},
    customValidations: {},
    transforms: {},
    customErrors: {}
  };
  private logger: Console = console;

  constructor(private options: CliOptions) {}

  /**
   * Point d'entrée principal
   */
  public async generate(): Promise<void> {
    this.logger.info('🔍 Analyse du schéma Prisma...');

    try {
      // Vérifier si le schéma Prisma existe
      await fs.access(this.options.schemaPath);

      // Lire le schéma Prisma
      await this.readPrismaSchema();

      // Charger la configuration (si elle existe)
      await this.loadConfig();

      // Créer le dossier de sortie s'il n'existe pas
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Générer les schémas Zod
      await this.generateZodSchemas();

      this.logger.info('✅ Génération des schémas Zod terminée avec succès!');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération des schémas Zod:', error);
      throw error;
    }
  }

  /**
   * Lecture du schéma Prisma en utilisant la CLI Prisma
   */
  private async readPrismaSchema(): Promise<void> {
    try {
      // Utiliser prisma-json-schema-generator pour obtenir une représentation JSON du schéma
      // Cette commande nécessite l'installation de prisma-json-schema-generator
      const tempJsonPath = path.join(path.dirname(this.options.outputDir), 'prisma-schema-temp.json');
      
      try {
        execSync(`npx prisma-json-schema-generator --schemaPath ${this.options.schemaPath} --outputPath ${tempJsonPath}`, { 
          stdio: 'inherit' 
        });
        
        const jsonSchema = await fs.readFile(tempJsonPath, 'utf8');
        const parsedSchema = JSON.parse(jsonSchema);
        
        // Extraction des modèles
        this.extractModelsFromJsonSchema(parsedSchema);
        
        // Nettoyage
        await fs.unlink(tempJsonPath).catch(() => {});
      } catch (error) {
        // Fallback: Analyser le fichier schema.prisma directement
        this.logger.warn('⚠️ Impossible d'utiliser prisma-json-schema-generator, analyse manuelle du schéma...');
        const content = await fs.readFile(this.options.schemaPath, 'utf8');
        await this.parseSchemaContent(content);
      }
      
      this.logger.info(`✅ Schéma Prisma analysé: ${this.schema.models.length} modèles, ${this.schema.enums.length} enums`);
    } catch (error) {
      this.logger.error('❌ Erreur lors de la lecture du schéma Prisma:', error);
      throw error;
    }
  }

  /**
   * Extraction des modèles à partir du schéma JSON
   */
  private extractModelsFromJsonSchema(jsonSchema: any): void {
    const definitions = jsonSchema.definitions || {};
    
    // Parcourir les définitions
    for (const [name, definition] of Object.entries(definitions)) {
      const def = definition as any;
      
      if (def.enum) {
        // C'est une énumération
        this.schema.enums.push({
          name,
          fields: [],
          isEnum: true,
          enumValues: def.enum,
          documentation: def.description
        });
      } else if (def.properties) {
        // C'est un modèle
        const fields: PrismaField[] = [];
        
        // Parcourir les propriétés
        for (const [fieldName, fieldDef] of Object.entries(def.properties || {})) {
          const field = fieldDef as any;
          const required = (def.required || []).includes(fieldName);
          
          // Détecter si c'est une relation
          const isRelation = field.$ref || (field.items && field.items.$ref);
          let relationType: 'object' | 'array' | undefined;
          let relationName: string | undefined;
          
          if (isRelation) {
            if (field.$ref) {
              relationType = 'object';
              relationName = field.$ref.replace('#/definitions/', '');
            } else if (field.items && field.items.$ref) {
              relationType = 'array';
              relationName = field.items.$ref.replace('#/definitions/', '');
            }
          }
          
          fields.push({
            name: fieldName,
            type: this.getFieldType(field),
            isRequired: required,
            isArray: field.type === 'array',
            isId: field['x-id'] === true,
            isUnique: field['x-unique'] === true,
            hasDefault: field.default !== undefined,
            isReadonly: field.readOnly === true,
            isRelation,
            relationName,
            relationType,
            documentation: field.description
          });
        }
        
        this.schema.models.push({
          name,
          fields,
          documentation: def.description
        });
      }
    }
  }

  /**
   * Obtenir le type d'un champ à partir de sa définition JSON
   */
  private getFieldType(field: any): string {
    if (field.$ref) {
      return field.$ref.replace('#/definitions/', '');
    } else if (field.type === 'array' && field.items) {
      if (field.items.$ref) {
        return `${field.items.$ref.replace('#/definitions/', '')}[]`;
      } else {
        return `${field.items.type}[]`;
      }
    } else if (field.type) {
      return field.type;
    } else {
      return 'string';
    }
  }

  /**
   * Analyse manuelle du contenu du schéma Prisma
   */
  private async parseSchemaContent(content: string): Promise<void> {
    // Expression régulière pour extraire les modèles
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
    let modelMatch;
    
    while ((modelMatch = modelRegex.exec(content)) !== null) {
      const modelName = modelMatch[1];
      const modelBody = modelMatch[2];
      const fields: PrismaField[] = [];
      
      // Expression régulière pour extraire les champs
      const fieldLines = modelBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
      
      for (const line of fieldLines) {
        const fieldMatch = line.match(/(\w+)\s+(\w+)(\?)?(\[\])?(.+)?/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          const isRequired = !fieldMatch[3];
          const isArray = !!fieldMatch[4];
          const rest = fieldMatch[5] || '';
          
          // Vérifier les attributs supplémentaires
          const isId = rest.includes('@id');
          const isUnique = rest.includes('@unique');
          const hasDefault = rest.includes('@default');
          
          // Vérifier si c'est une relation
          const isRelation = rest.includes('@relation');
          let relationName: string | undefined;
          let relationType: 'object' | 'array' | undefined;
          
          if (isRelation) {
            // Extraire le nom de la relation
            const relationMatch = rest.match(/@relation\([^)]*name:\s*["']([^"']+)["']/);
            relationName = relationMatch ? relationMatch[1] : undefined;
            
            // Déterminer le type de relation
            relationType = isArray ? 'array' : 'object';
          }
          
          fields.push({
            name: fieldName,
            type: fieldType,
            isRequired,
            isArray,
            isId,
            isUnique,
            hasDefault,
            isReadonly: false,
            isRelation,
            relationName,
            relationType
          });
        }
      }
      
      this.schema.models.push({
        name: modelName,
        fields
      });
    }
    
    // Expression régulière pour extraire les enums
    const enumRegex = /enum\s+(\w+)\s*{([^}]*)}/g;
    let enumMatch;
    
    while ((enumMatch = enumRegex.exec(content)) !== null) {
      const enumName = enumMatch[1];
      const enumBody = enumMatch[2];
      
      // Extraire les valeurs de l'enum
      const enumValues = enumBody.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => line.replace(/,$/, ''));
      
      this.schema.enums.push({
        name: enumName,
        fields: [],
        isEnum: true,
        enumValues
      });
    }
  }

  /**
   * Charger la configuration pour la génération
   */
  private async loadConfig(): Promise<void> {
    const configPath = path.join(path.dirname(this.options.outputDir), 'prisma-to-zod.config.json');
    
    try {
      await fs.access(configPath);
      const content = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(content);
      this.logger.info('✅ Configuration chargée avec succès');
    } catch (error) {
      this.logger.warn('⚠️ Pas de fichier de configuration trouvé, utilisation des paramètres par défaut');
      // Créer une configuration par défaut
      this.config = {
        customTypes: {
          DateTime: {
            type: 'z.string().datetime()',
            imports: []
          },
          Json: {
            type: 'z.record(z.any())',
            imports: []
          },
          Decimal: {
            type: 'z.number()',
            imports: []
          },
          BigInt: {
            type: 'z.bigint()',
            imports: []
          },
          Bytes: {
            type: 'z.instanceof(Buffer)',
            imports: []
          }
        },
        customValidations: {},
        transforms: {},
        customErrors: {}
      };
    }
  }

  /**
   * Générer les schémas Zod
   */
  private async generateZodSchemas(): Promise<void> {
    if (this.options.splitByModel) {
      // Générer un fichier par modèle
      await this.generateSplitSchemas();
    } else {
      // Générer un seul fichier pour tous les modèles
      await this.generateCombinedSchema();
    }
  }

  /**
   * Générer un fichier de schéma pour chaque modèle
   */
  private async generateSplitSchemas(): Promise<void> {
    // Créer le dossier pour les schémas
    const schemasDir = path.join(this.options.outputDir, 'schemas');
    await fs.mkdir(schemasDir, { recursive: true });
    
    // Créer un fichier d'index pour exporter tous les schémas
    let indexContent = `// Généré automatiquement par prisma-to-zod.ts - ne pas modifier manuellement\n\n`;
    
    // Générer les schémas pour les enums
    for (const enumModel of this.schema.enums) {
      const { name } = enumModel;
      const fileName = `${this.camelToKebab(name)}.schema.ts`;
      const filePath = path.join(schemasDir, fileName);
      
      // Générer le contenu du schéma
      const content = this.generateEnumSchema(enumModel);
      
      // Écrire le fichier
      await this.writeFormattedFile(filePath, content);
      
      // Mettre à jour le fichier d'index
      indexContent += `export * from './schemas/${this.camelToKebab(name)}.schema';\n`;
      
      this.logger.info(`✅ Schéma Zod généré pour l'enum ${name}`);
    }
    
    // Générer les schémas pour les modèles
    for (const model of this.schema.models) {
      const { name } = model;
      const fileName = `${this.camelToKebab(name)}.schema.ts`;
      const filePath = path.join(schemasDir, fileName);
      
      // Générer le contenu du schéma
      const content = this.generateModelSchema(model);
      
      // Écrire le fichier
      await this.writeFormattedFile(filePath, content);
      
      // Mettre à jour le fichier d'index
      indexContent += `export * from './schemas/${this.camelToKebab(name)}.schema';\n`;
      
      this.logger.info(`✅ Schéma Zod généré pour le modèle ${name}`);
    }
    
    // Écrire le fichier d'index
    const indexPath = path.join(this.options.outputDir, 'index.ts');
    await this.writeFormattedFile(indexPath, indexContent);
    
    this.logger.info(`✅ Fichier d'index généré`);
  }

  /**
   * Générer un fichier combiné pour tous les schémas
   */
  private async generateCombinedSchema(): Promise<void> {
    let content = `// Généré automatiquement par prisma-to-zod.ts - ne pas modifier manuellement
import { z } from 'zod';\n\n`;
    
    // Imports personnalisés
    const customImports = new Set<string>();
    
    // Ajouter les imports personnalisés des types
    for (const customType of Object.values(this.config.customTypes)) {
      if (customType.imports && customType.imports.length > 0) {
        for (const importStatement of customType.imports) {
          customImports.add(importStatement);
        }
      }
    }
    
    // Ajouter les imports personnalisés
    if (customImports.size > 0) {
      customImports.forEach(importStatement => {
        content += `${importStatement}\n`;
      });
      content += '\n';
    }
    
    // Générer les schémas pour les enums
    for (const enumModel of this.schema.enums) {
      content += this.generateEnumSchema(enumModel, false);
      content += '\n\n';
    }
    
    // Générer les schémas pour les modèles
    for (const model of this.schema.models) {
      content += this.generateModelSchema(model, false);
      content += '\n\n';
    }
    
    // Écrire le fichier
    const filePath = path.join(this.options.outputDir, 'zod-schemas.ts');
    await this.writeFormattedFile(filePath, content);
    
    this.logger.info(`✅ Schémas Zod combinés générés à ${filePath}`);
  }

  /**
   * Générer le schéma Zod pour un enum
   */
  private generateEnumSchema(enumModel: PrismaModel, withImports: boolean = true): string {
    const { name, enumValues = [] } = enumModel;
    
    let content = '';
    
    // Ajouter les imports si nécessaire
    if (withImports) {
      content += `// Généré automatiquement par prisma-to-zod.ts - ne pas modifier manuellement
import { z } from 'zod';\n\n`;
    }
    
    // Documentation
    if (enumModel.documentation) {
      content += `/**\n * ${enumModel.documentation}\n */\n`;
    }
    
    // Générer le schéma enum
    content += `export const ${name}Schema = z.enum([\n`;
    enumValues.forEach(value => {
      content += `  '${value}',\n`;
    });
    content += `]);\n\n`;
    
    // Export du type
    content += `export type ${name} = z.infer<typeof ${name}Schema>;\n`;
    
    return content;
  }

  /**
   * Générer le schéma Zod pour un modèle
   */
  private generateModelSchema(model: PrismaModel, withImports: boolean = true): string {
    const { name, fields } = model;
    
    let content = '';
    
    // Ajouter les imports si nécessaire
    if (withImports) {
      content += `// Généré automatiquement par prisma-to-zod.ts - ne pas modifier manuellement
import { z } from 'zod';\n`;
      
      // Ajouter les imports pour les relations si nécessaire
      if (this.options.withRelations) {
        const relationImports = new Set<string>();
        
        fields.forEach(field => {
          if (field.isRelation && field.relationName) {
            // Vérifier si c'est un modèle ou un enum
            const isEnum = this.schema.enums.some(e => e.name === field.relationName);
            
            if (!isEnum) {
              relationImports.add(field.relationName!);
            }
          }
        });
        
        if (relationImports.size > 0) {
          // Ajouter les imports
          if (this.options.importPrefix) {
            // Avec préfixe (ex: import { UserSchema } from './user.schema')
            relationImports.forEach(relationName => {
              const fileName = this.camelToKebab(relationName);
              content += `import { ${relationName}Schema } from '${this.options.importPrefix}${fileName}.schema';\n`;
            });
          } else {
            // Sans préfixe (import relatif)
            relationImports.forEach(relationName => {
              const fileName = this.camelToKebab(relationName);
              content += `import { ${relationName}Schema } from './${fileName}.schema';\n`;
            });
          }
          content += '\n';
        }
      }
      
      // Imports personnalisés
      const customImports = new Set<string>();
      
      // Parcourir les champs pour trouver les types personnalisés
      fields.forEach(field => {
        const customType = this.config.customTypes[field.type];
        if (customType && customType.imports) {
          customType.imports.forEach(importStatement => {
            customImports.add(importStatement);
          });
        }
      });
      
      if (customImports.size > 0) {
        customImports.forEach(importStatement => {
          content += `${importStatement}\n`;
        });
        content += '\n';
      }
    }
    
    // Documentation
    if (model.documentation) {
      content += `/**\n * ${model.documentation}\n */\n`;
    }
    
    // Générer le schéma pour la création (tous les champs sauf ceux générés automatiquement)
    content += `export const ${name}CreateSchema = z.object({\n`;
    
    fields.forEach(field => {
      // Ignorer les champs générés automatiquement pour le schéma de création
      const isGenerated = field.hasDefault || field.isReadonly || (field.isId && field.hasDefault);
      
      if (!isGenerated || !field.isRequired) {
        content += this.generateFieldSchema(field, model.name, true);
      }
    });
    
    content += `});\n\n`;
    
    // Générer le schéma pour la mise à jour (tous les champs optionnels)
    content += `export const ${name}UpdateSchema = z.object({\n`;
    
    fields.forEach(field => {
      // Ignorer les champs générés automatiquement ou en lecture seule pour le schéma de mise à jour
      const isReadOnly = field.isReadonly || (field.isId && !field.hasDefault);
      
      if (!isReadOnly) {
        content += this.generateFieldSchema(field, model.name, false, true);
      }
    });
    
    content += `});\n\n`;
    
    // Générer le schéma complet
    content += `export const ${name}Schema = z.object({\n`;
    
    fields.forEach(field => {
      content += this.generateFieldSchema(field, model.name);
    });
    
    content += `});\n\n`;
    
    // Export des types
    content += `export type ${name}Create = z.infer<typeof ${name}CreateSchema>;\n`;
    content += `export type ${name}Update = z.infer<typeof ${name}UpdateSchema>;\n`;
    content += `export type ${name} = z.infer<typeof ${name}Schema>;\n`;
    
    return content;
  }

  /**
   * Générer le schéma Zod pour un champ
   */
  private generateFieldSchema(
    field: PrismaField, 
    modelName: string, 
    isCreateSchema: boolean = false, 
    isUpdateSchema: boolean = false
  ): string {
    const { name, type, isRequired, isArray, isRelation, relationName, relationType } = field;
    
    let fieldSchema = '';
    
    // Documentation
    if (field.documentation) {
      fieldSchema += `  /** ${field.documentation} */\n`;
    }
    
    fieldSchema += `  ${name}: `;
    
    // Gérer les relations si elles sont activées
    if (isRelation && this.options.withRelations && relationName) {
      // Vérifier si c'est un enum
      const isEnum = this.schema.enums.some(e => e.name === relationName);
      
      if (isEnum) {
        fieldSchema += `${relationName}Schema`;
      } else if (relationType === 'array') {
        fieldSchema += `z.array(${relationName}Schema)`;
      } else {
        fieldSchema += `${relationName}Schema`;
      }
    } else {
      // Gérer les types standards
      fieldSchema += this.getZodTypeForField(field, modelName);
    }
    
    // Rendre optionnel si nécessaire pour le schéma de création et le champ n'est pas requis
    if (isCreateSchema && !isRequired) {
      fieldSchema += '.optional()';
    }
    
    // Rendre optionnel pour le schéma de mise à jour
    if (isUpdateSchema) {
      fieldSchema += '.optional()';
    }
    
    // Ajouter les validations personnalisées
    const customValidations = this.config.customValidations[modelName]?.[name];
    if (customValidations) {
      customValidations.forEach(validation => {
        fieldSchema += `.${validation}`;
      });
    }
    
    // Ajouter les transformations personnalisées
    const transform = this.config.transforms[modelName]?.[name];
    if (transform) {
      fieldSchema += `.transform(${transform})`;
    }
    
    // Ajouter les erreurs personnalisées
    const customErrors = this.config.customErrors[modelName]?.[name];
    if (customErrors) {
      for (const [validationType, errorMessage] of Object.entries(customErrors)) {
        fieldSchema += `.${validationType}({ message: "${errorMessage}" })`;
      }
    }
    
    fieldSchema += ',\n';
    
    return fieldSchema;
  }

  /**
   * Obtenir le type Zod correspondant à un type Prisma
   */
  private getZodTypeForField(field: PrismaField, modelName: string): string {
    const { type, isArray, isRequired } = field;
    
    // Vérifier si c'est un type personnalisé
    const customType = this.config.customTypes[type];
    if (customType) {
      if (isArray) {
        return `z.array(${customType.type})`;
      }
      return customType.type;
    }
    
    // Types standards
    let zodType: string;
    
    switch (type.toLowerCase()) {
      case 'string':
        zodType = 'z.string()';
        break;
      case 'boolean':
        zodType = 'z.boolean()';
        break;
      case 'int':
      case 'float':
      case 'decimal':
        zodType = 'z.number()';
        break;
      case 'datetime':
        zodType = 'z.date()';
        break;
      case 'json':
        zodType = 'z.record(z.any())';
        break;
      case 'bytes':
        zodType = 'z.instanceof(Buffer)';
        break;
      case 'bigint':
        zodType = 'z.bigint()';
        break;
      default:
        // Si c'est probablement un enum
        const isEnum = this.schema.enums.some(e => e.name === type);
        if (isEnum) {
          zodType = `${type}Schema`;
        } else {
          // Type inconnu, utiliser any
          zodType = 'z.any()';
        }
    }
    
    // Gérer les arrays
    if (isArray) {
      zodType = `z.array(${zodType})`;
    }
    
    // Gérer les champs optionnels pour le schéma principal
    if (!isRequired) {
      zodType = `${zodType}.nullable()`;
    }
    
    return zodType;
  }

  /**
   * Écrire un fichier avec formatage
   */
  private async writeFormattedFile(filePath: string, content: string): Promise<void> {
    try {
      // Formater avec Prettier
      const formattedContent = await prettier.format(content, {
        parser: 'typescript',
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2,
        printWidth: 100,
        semi: true,
      });
      
      // Écrire le fichier
      await fs.writeFile(filePath, formattedContent, 'utf8');
    } catch (error) {
      // En cas d'erreur de formatage, écrire le contenu brut
      this.logger.warn(`⚠️ Erreur lors du formatage de ${filePath}, écriture du contenu brut`);
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  /**
   * Convertir camelCase en kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  // Analyser les arguments de ligne de commande
  const args = minimist(process.argv.slice(2));
  
  if (!args.schemaPath) {
    console.error('❌ Erreur: Le paramètre --schemaPath est requis');
    console.log('Utilisation: node prisma-to-zod.ts --schemaPath=/chemin/vers/schema.prisma --outputDir=/chemin/sortie [--importPrefix=@schemas/] [--withRelations=true] [--splitByModel=true]');
    process.exit(1);
  }
  
  if (!args.outputDir) {
    console.error('❌ Erreur: Le paramètre --outputDir est requis');
    console.log('Utilisation: node prisma-to-zod.ts --schemaPath=/chemin/vers/schema.prisma --outputDir=/chemin/sortie [--importPrefix=@schemas/] [--withRelations=true] [--splitByModel=true]');
    process.exit(1);
  }
  
  const options: CliOptions = {
    schemaPath: args.schemaPath,
    outputDir: args.outputDir,
    importPrefix: args.importPrefix,
    withRelations: args.withRelations === 'true' || args.withRelations === true,
    splitByModel: args.splitByModel === 'true' || args.splitByModel === true
  };
  
  console.log(`🔍 Génération des schémas Zod à partir du schéma Prisma: ${options.schemaPath}`);
  
  try {
    const generator = new PrismaToZodGenerator(options);
    await generator.generate();
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

// Exécution de la fonction principale
if (require.main === module) {
  main();
}

// Export pour les tests et l'utilisation comme module
export { PrismaToZodGenerator };