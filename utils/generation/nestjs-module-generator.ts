/**
 * nestjs-module-generator.ts
 *
 * Générateur automatique de modules NestJS basé sur les plans de migration
 * Créé les fichiers controller.ts, service.ts, dto.ts, entity.ts, module.ts
 *
 * Usage: ts-node nestjs-module-generator.ts <chemin-plan-migration.md> [--dry-run]
 *
 * Date: 11 avril 2025
 */

import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';
import { execSync } from './child_processstructure-agent';

interface MigrationPlan {
  fileName: string;
  outputDir: string;
  moduleName: string;
  controllerName: string;
  serviceName: string;
  entityName: string;
  dtoName: string;
  fields: {
    name: string;
    type: string;
    isRequired: boolean;
    description?: string;
  }[];
  endpoints: {
    method: string;
    path: string;
    description: string;
    returns?: string;
    params?: string[];
  }[];
  prismaModel?: boolean;
}

/**
 * Extrait les informations du plan de migration
 */
function extractMigrationInfo(filePath: string): MigrationPlan {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.migration_plan.md');
  const phpFileName = fileName.endsWith('.php') ? fileName : `${fileName}.php`;
  const baseName = phpFileName.replace('.php', '');

  // Convertir le nom en camelCase pour les conventions NestJS
  const camelCaseName = baseName
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/[\-_]([a-z])/g, (g) => g[1].toUpperCase());

  // Convertir en PascalCase pour les noms de classes
  const pascalCaseName = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);

  // Extraire les informations sur les endpoints à partir du contenu du plan
  const endpointsRegex = /## 🧱 Plan de migration NestJS\s+([\s\S]+?)(?=##|$)/;
  const endpointsMatch = content.match(endpointsRegex);

  const endpoints = [];
  if (endpointsMatch) {
    const endpointsContent = endpointsMatch[1];
    // Analyser les informations du tableau pour extraire les endpoints
    const tableRowsRegex = /\|(.*?)\|(.*?)\|/g;
    let match;
    while ((match = tableRowsRegex.exec(endpointsContent)) !== null) {
      const source = match[1].trim();
      const target = match[2].trim();

      if (source !== 'Élément PHP' && target !== 'Cible NestJS') {
        // Déduire le type d'endpoint à partir des éléments du plan
        if (source.toLowerCase().includes('requête') || source.toLowerCase().includes('sql')) {
          endpoints.push({
            method: 'GET',
            path: `/${camelCaseName}`,
            description: `Récupérer les ${camelCaseName}`,
            returns: `${pascalCaseName}[]`,
          });

          endpoints.push({
            method: 'GET',
            path: `/${camelCaseName}/:id`,
            description: `Récupérer un ${camelCaseName} par ID`,
            returns: pascalCaseName,
            params: ['id'],
          });

          endpoints.push({
            method: 'POST',
            path: `/${camelCaseName}`,
            description: `Créer un nouveau ${camelCaseName}`,
            returns: pascalCaseName,
          });

          endpoints.push({
            method: 'PUT',
            path: `/${camelCaseName}/:id`,
            description: `Mettre à jour un ${camelCaseName}`,
            returns: pascalCaseName,
            params: ['id'],
          });

          endpoints.push({
            method: 'DELETE',
            path: `/${camelCaseName}/:id`,
            description: `Supprimer un ${camelCaseName}`,
            returns: 'void',
            params: ['id'],
          });
        }
      }
    }
  }

  // Extraire des champs potentiels depuis le contenu
  const fields = [];

  // Chercher les mentions de champs ou de propriétés dans le contenu
  const fieldsRegex =
    /(field|property|champ|propriété|colonne)\s+['"]?(\w+)['"]?\s+(is|of type|de type)\s+['"]?(\w+)['"]?/gi;
  let fieldMatch;

  while ((fieldMatch = fieldsRegex.exec(content)) !== null) {
    fields.push({
      name: fieldMatch[2],
      type: mapPhpTypeToTypescript(fieldMatch[4]),
      isRequired: true,
    });
  }

  // Si aucun champ n'a été détecté, ajouter des champs par défaut
  if (fields.length === 0) {
    fields.push(
      { name: 'id', type: 'number', isRequired: true },
      { name: 'name', type: 'string', isRequired: true },
      { name: 'description', type: 'string', isRequired: false },
      { name: 'createdAt', type: 'Date', isRequired: true },
      { name: 'updatedAt', type: 'Date', isRequired: true }
    );
  }

  // Déterminer si le module utilise Prisma (basé sur les mentions dans le plan)
  const prismaModel = content.includes('Prisma') || content.includes('prisma');

  return {
    fileName: phpFileName,
    outputDir: `dist/modules/${camelCaseName}`,
    moduleName: `${pascalCaseName}Module`,
    controllerName: `${pascalCaseName}Controller`,
    serviceName: `${pascalCaseName}Service`,
    entityName: pascalCaseName,
    dtoName: `Create${pascalCaseName}Dto`,
    fields,
    endpoints,
    prismaModel,
  };
}

/**
 * Mappe les types PHP vers TypeScript
 */
function mapPhpTypeToTypescript(phpType: string): string {
  const typeMap: { [key: string]: string } = {
    int: 'number',
    integer: 'number',
    float: 'number',
    double: 'number',
    string: 'string',
    bool: 'boolean',
    boolean: 'boolean',
    array: 'any[]',
    object: 'Record<string, any>',
    mixed: 'any',
    null: 'null',
    resource: 'any',
    callable: 'Function',
    iterable: 'any[]',
    void: 'void',
    date: 'Date',
    datetime: 'Date',
  };

  return typeMap[phpType.toLowerCase()] || 'any';
}

/**
 * Génère le fichier du contrôleur NestJS
 */
function generateController(plan: MigrationPlan): string {
  const { controllerName, serviceName, moduleName, dtoName, entityName, endpoints } = plan;

  let methods = '';

  endpoints.forEach((endpoint) => {
    const params =
      endpoint.params?.map((param) => `@Param('${param}') ${param}: string`).join(', ') || '';
    const bodyParam =
      endpoint.method === 'POST' || endpoint.method === 'PUT'
        ? `@Body() dto: ${endpoint.method === 'POST' ? dtoName : `Update${entityName}Dto`}`
        : '';
    const allParams = [params, bodyParam].filter(Boolean).join(', ');

    const methodName =
      endpoint.method === 'GET' && endpoint.path.includes(':id')
        ? 'findOne'
        : endpoint.method === 'GET'
          ? 'findAll'
          : endpoint.method === 'POST'
            ? 'create'
            : endpoint.method === 'PUT'
              ? 'update'
              : endpoint.method === 'DELETE'
                ? 'remove'
                : 'unknown';

    const returnType = endpoint.returns
      ? endpoint.returns === 'void'
        ? 'Promise<void>'
        : `Promise<${endpoint.returns}>`
      : 'Promise<any>';

    methods += `
  /**
   * ${endpoint.description}
   */
  @${endpoint.method}('${endpoint.path}')
  ${methodName}(${allParams}): ${returnType} {
    ${
      endpoint.method === 'GET' && endpoint.path.includes(':id')
        ? `return this.${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.findOne(+id);`
        : endpoint.method === 'GET'
          ? `return this.${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.findAll();`
          : endpoint.method === 'POST'
            ? `return this.${
                serviceName.charAt(0).toLowerCase() + serviceName.slice(1)
              }.create(dto);`
            : endpoint.method === 'PUT'
              ? `return this.${
                  serviceName.charAt(0).toLowerCase() + serviceName.slice(1)
                }.update(+id, dto);`
              : endpoint.method === 'DELETE'
                ? `return this.${
                    serviceName.charAt(0).toLowerCase() + serviceName.slice(1)
                  }.remove(+id);`
                : ''
    }
  }`;
  });

  return `import { Controller, Get, Post, Body, Put, Param, Delete  } from './@nestjs/commonstructure-agent'
import { ${serviceName} } from './${entityName.toLowerCase()}.servicestructure-agent'
import { ${dtoName} } from './dto/create-${entityName.toLowerCase()}.dtostructure-agent'
import { Update${entityName}Dto } from './dto/update-${entityName.toLowerCase()}.dtostructure-agent'

@Controller('${entityName.toLowerCase()}')
export class ${controllerName} {
  constructor(private readonly ${
    serviceName.charAt(0).toLowerCase() + serviceName.slice(1)
  }: ${serviceName}) {}
${methods}
}
`;
}

/**
 * Génère le fichier du service NestJS
 */
function generateService(plan: MigrationPlan): string {
  const { serviceName, entityName, dtoName, prismaModel } = plan;

  const serviceContent = prismaModel ? generatePrismaService(plan) : generateStandardService(plan);

  return serviceContent;
}

/**
 * Génère un service NestJS standard
 */
function generateStandardService(plan: MigrationPlan): string {
  const { serviceName, entityName, dtoName } = plan;

  return `import { Injectable } from './@nestjs/commonstructure-agent'
import { ${dtoName} } from './dto/create-${entityName.toLowerCase()}.dtostructure-agent'
import { Update${entityName}Dto } from './dto/update-${entityName.toLowerCase()}.dtostructure-agent'
import { ${entityName} } from './${entityName.toLowerCase()}.entitystructure-agent'

@Injectable()
export class ${serviceName} {
  private readonly ${entityName.toLowerCase()}s: ${entityName}[] = [];

  create(create${entityName}Dto: ${dtoName}): Promise<${entityName}> {
    const ${entityName.toLowerCase()} = new ${entityName}();
    Object.assign(${entityName.toLowerCase()}, create${entityName}Dto);
    ${entityName.toLowerCase()}.id = this.${entityName.toLowerCase()}s.length + 1;
    ${entityName.toLowerCase()}.createdAt = new Date();
    ${entityName.toLowerCase()}.updatedAt = new Date();
    this.${entityName.toLowerCase()}s.push(${entityName.toLowerCase()});
    return Promise.resolve(${entityName.toLowerCase()});
  }

  findAll(): Promise<${entityName}[]> {
    return Promise.resolve(this.${entityName.toLowerCase()}s);
  }

  findOne(id: number): Promise<${entityName}> {
    const ${entityName.toLowerCase()} = this.${entityName.toLowerCase()}s.find(item => item.id === id);
    if (!${entityName.toLowerCase()}) {
      throw new Error('${entityName} not found');
    }
    return Promise.resolve(${entityName.toLowerCase()});
  }

  update(id: number, update${entityName}Dto: Update${entityName}Dto): Promise<${entityName}> {
    const ${entityName.toLowerCase()} = this.${entityName.toLowerCase()}s.find(item => item.id === id);
    if (!${entityName.toLowerCase()}) {
      throw new Error('${entityName} not found');
    }
    Object.assign(${entityName.toLowerCase()}, update${entityName}Dto);
    ${entityName.toLowerCase()}.updatedAt = new Date();
    return Promise.resolve(${entityName.toLowerCase()});
  }

  remove(id: number): Promise<void> {
    const index = this.${entityName.toLowerCase()}s.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('${entityName} not found');
    }
    this.${entityName.toLowerCase()}s.splice(index, 1);
    return Promise.resolve();
  }
}
`;
}

/**
 * Génère un service NestJS utilisant Prisma
 */
function generatePrismaService(plan: MigrationPlan): string {
  const { serviceName, entityName, dtoName } = plan;

  return `import { Injectable } from './@nestjs/commonstructure-agent'
import { PrismaService } from './src/prisma/prisma.servicestructure-agent'
import { ${dtoName} } from './dto/create-${entityName.toLowerCase()}.dtostructure-agent'
import { Update${entityName}Dto } from './dto/update-${entityName.toLowerCase()}.dtostructure-agent'

@Injectable()
export class ${serviceName} {
  constructor(private prisma: PrismaService) {}

  async create(create${entityName}Dto: ${dtoName}) {
    return this.prisma.${entityName.toLowerCase()}.create({
      data: create${entityName}Dto,
    });
  }

  async findAll() {
    return this.prisma.${entityName.toLowerCase()}.findMany();
  }

  async findOne(id: number) {
    return this.prisma.${entityName.toLowerCase()}.findUnique({
      where: { id },
    });
  }

  async update(id: number, update${entityName}Dto: Update${entityName}Dto) {
    return this.prisma.${entityName.toLowerCase()}.update({
      where: { id },
      data: update${entityName}Dto,
    });
  }

  async remove(id: number) {
    await this.prisma.${entityName.toLowerCase()}.delete({
      where: { id },
    });
  }
}
`;
}

/**
 * Génère le fichier d'entité NestJS
 */
function generateEntity(plan: MigrationPlan): string {
  const { entityName, fields } = plan;

  const fieldDefinitions = fields
    .map((field) => {
      return `
  ${field.description ? `/**\n   * ${field.description}\n   */\n  ` : ''}${field.name}${
    field.isRequired ? '' : '?'
  }: ${field.type};`;
    })
    .join('');

  return `export class ${entityName} {${fieldDefinitions}
}
`;
}

/**
 * Génère le fichier DTO pour la création
 */
function generateCreateDto(plan: MigrationPlan): string {
  const { dtoName, fields, entityName } = plan;

  const fieldDefinitions = fields
    .filter(
      (field) => field.name !== 'id' && field.name !== 'createdAt' && field.name !== 'updatedAt'
    )
    .map((field) => {
      return `
  ${field.description ? `/**\n   * ${field.description}\n   */\n  ` : ''}${field.name}${
    field.isRequired ? '' : '?'
  }: ${field.type};`;
    })
    .join('');

  return `import { IsNotEmpty, IsOptional, IsString, IsNumber  } from './class-validatorstructure-agent'

export class ${dtoName} {${fieldDefinitions}
}
`;
}

/**
 * Génère le fichier DTO pour la mise à jour
 */
function generateUpdateDto(plan: MigrationPlan): string {
  const { dtoName, entityName } = plan;

  return `import { PartialType } from './@nestjs/mapped-typesstructure-agent'
import { ${dtoName} } from './create-${entityName.toLowerCase()}.dtostructure-agent'

export class Update${entityName}Dto extends PartialType(${dtoName}) {}
`;
}

/**
 * Génère le fichier de module NestJS
 */
function generateModule(plan: MigrationPlan): string {
  const { moduleName, controllerName, serviceName, prismaModel, entityName } = plan;

  return `import { Module } from './@nestjs/commonstructure-agent'
import { ${controllerName} } from './${entityName.toLowerCase()}.controllerstructure-agent'
import { ${serviceName} } from './${entityName.toLowerCase()}.servicestructure-agent'
${prismaModel ? "import { PrismaModule } from './src/prisma/prisma.module';" : 'structure-agent'}

@Module({
  imports: [${prismaModel ? 'PrismaModule' : ''}],
  controllers: [${controllerName}],
  providers: [${serviceName}],
  exports: [${serviceName}]
})
export class ${moduleName} {}
`;
}

/**
 * Génère tous les fichiers du module NestJS
 */
function generateNestJSModule(plan: MigrationPlan, dryRun = false): void {
  const { outputDir, entityName, fileName } = plan;

  console.log(`📦 Génération du module NestJS pour ${fileName}...`);

  // Créer les fichiers
  const files = [
    {
      name: `${entityName.toLowerCase()}.controller.ts`,
      content: generateController(plan),
    },
    {
      name: `${entityName.toLowerCase()}.service.ts`,
      content: generateService(plan),
    },
    {
      name: `${entityName.toLowerCase()}.entity.ts`,
      content: generateEntity(plan),
    },
    {
      name: `${entityName.toLowerCase()}.module.ts`,
      content: generateModule(plan),
    },
    {
      name: `dto/create-${entityName.toLowerCase()}.dto.ts`,
      content: generateCreateDto(plan),
    },
    {
      name: `dto/update-${entityName.toLowerCase()}.dto.ts`,
      content: generateUpdateDto(plan),
    },
  ];

  if (dryRun) {
    console.log('🔍 Mode dry-run: les fichiers ne seront pas créés');

    files.forEach((file) => {
      console.log(`\n📄 ${file.name}:`);
      console.log('-'.repeat(50));
      console.log(file.content);
      console.log('-'.repeat(50));
    });

    return;
  }

  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Créer le répertoire DTO s'il n'existe pas
  if (!fs.existsSync(`${outputDir}/dto`)) {
    fs.mkdirSync(`${outputDir}/dto`, { recursive: true });
  }

  // Écrire les fichiers
  files.forEach((file) => {
    fs.writeFileSync(`${outputDir}/${file.name}`, file.content);
    console.log(`✅ Fichier généré: ${outputDir}/${file.name}`);
  });

  console.log(`\n🚀 Module NestJS généré avec succès pour ${fileName}!`);
}

/**
 * Fonction principale
 */
function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
    Usage: ts-node nestjs-module-generator.ts <chemin-plan-migration.md> [--dry-run]
    Options:
      --dry-run: Affiche les fichiers qui seraient générés sans les créer réellement
    `);
    process.exit(0);
  }

  const filePath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Le fichier ${filePath} n'existe pas`);
    process.exit(1);
  }

  // Extraire les informations du plan de migration
  const plan = extractMigrationInfo(filePath);

  // Générer le module NestJS
  generateNestJSModule(plan, dryRun);
}

// Exécuter la fonction principale
if (require.main === module) {
  main();
}

// Exporter les fonctions pour une utilisation par d'autres modules
export { extractMigrationInfo, generateNestJSModule };
