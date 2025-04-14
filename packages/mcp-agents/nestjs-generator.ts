/**
 * nestjs-generator.ts
 * Agent MCP pour générer automatiquement des composants NestJS à partir d'une analyse PHP
 * et en coordination avec les routes Remix générées.
 * 
 * Usage: 
 * - Appel direct: await generateNestJSComponents('fiche.php', remixRoutePath)
 * - Via MCP API: POST /api/generate/nestjs avec { source: 'fiche.php', remixRoute: '/fiche/$id', options: {...} }
 * 
 * Date: 2025-04-13
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';
import { extractDataStructure } from './php-analyzer-v2';
import { detectDbOperations } from './sql-mapper';
import { supabaseClient } from '../utils/supabase-client';
import { PrismaClient } from '@prisma/client';
import { camelCase, pascalCase, snakeCase } from '../utils/string-utils';

// Types pour les fichiers générés
interface GeneratedNestJSComponent {
  controller: {
    path: string;
    content: string;
  };
  service: {
    path: string;
    content: string;
  };
  dto: {
    path: string;
    content: string;
  };
  entity?: {
    path: string;
    content: string;
  };
  module: {
    path: string;
    content: string;
  };
  additionalFiles: Array<{
    path: string;
    content: string;
  }>;
  routePath: string;
  originalPhpFile: string;
  auditPath: string;
}

// Options de génération
interface NestJSGeneratorOptions {
  outputDir?: string;
  dryRun?: boolean;
  withTests?: boolean;
  enableSwagger?: boolean;
  enableValidation?: boolean;
  enableCaching?: boolean;
  enableSerialization?: boolean;
  enableInterceptors?: boolean;
  enableGuards?: boolean;
  prismaIntegration?: boolean;
  apiPrefix?: string;
  forceRegenerate?: boolean;
}

// Configuration par défaut
const DEFAULT_OPTIONS: NestJSGeneratorOptions = {
  outputDir: './apps/backend/src',
  dryRun: false,
  withTests: true,
  enableSwagger: true,
  enableValidation: true,
  enableCaching: true,
  enableSerialization: true,
  enableInterceptors: true,
  enableGuards: true,
  prismaIntegration: true,
  apiPrefix: 'api',
  forceRegenerate: false,
};

// Initialisation du client Prisma
const prisma = new PrismaClient();

/**
 * Fonction principale pour générer les composants NestJS à partir d'un fichier PHP
 * et d'une route Remix associée
 */
export async function generateNestJSComponents(
  phpFilePath: string,
  remixRoutePath: string,
  options: NestJSGeneratorOptions = {}
): Promise<GeneratedNestJSComponent> {
  // Fusionner les options avec les options par défaut
  const opts = { ...DEFAULT_OPTIONS, ...options };
  logger.info(`Génération des composants NestJS pour ${phpFilePath} démarrée`);
  
  // Vérifier que le fichier PHP existe
  if (!fs.existsSync(phpFilePath)) {
    throw new Error(`Le fichier PHP ${phpFilePath} n'existe pas`);
  }
  
  // Définir le chemin de sortie en fonction du mode (dry run ou non)
  const baseOutputDir = opts.dryRun 
    ? './simulations/nestjs' 
    : opts.outputDir;
  
  // Créer les répertoires de sortie s'ils n'existent pas
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }
  
  // Analyser le fichier PHP
  logger.debug(`Analyse du fichier PHP ${phpFilePath}`);
  const phpCode = fs.readFileSync(phpFilePath, 'utf-8');
  const fileHash = createHash('md5').update(phpCode).digest('hex');
  
  // Vérifier si ce fichier a déjà été généré et si le contenu est identique
  const existingRecord = await supabaseClient
    .from('generated_nestjs_files')
    .select('*')
    .eq('source_file', phpFilePath)
    .eq('file_hash', fileHash)
    .maybeSingle();
  
  if (existingRecord.data && !opts.forceRegenerate) {
    logger.info(`Les composants NestJS pour ${phpFilePath} ont déjà été générés et n'ont pas changé. Utilisation de la version en cache.`);
    return JSON.parse(existingRecord.data.generated_content);
  }
  
  // Analyser la structure des données
  logger.debug(`Extraction de la structure de données pour ${phpFilePath}`);
  const dataStructure = await extractDataStructure(phpFilePath);
  
  // Détecter les opérations de base de données
  logger.debug(`Détection des opérations de base de données pour ${phpFilePath}`);
  const dbOperations = await detectDbOperations(phpFilePath);
  
  // Déterminer le nom de ressource à partir de la route Remix
  logger.debug(`Détermination du nom de ressource à partir de la route Remix ${remixRoutePath}`);
  const resourceName = getResourceNameFromRoute(remixRoutePath);
  
  // Générer les composants NestJS
  const result = await generateAllNestJSFiles(
    phpFilePath,
    resourceName,
    remixRoutePath,
    baseOutputDir,
    dataStructure,
    dbOperations,
    opts
  );
  
  // Sauvegarder les métadonnées dans Supabase
  await supabaseClient
    .from('generated_nestjs_files')
    .upsert({
      source_file: phpFilePath,
      file_hash: fileHash,
      remix_route: remixRoutePath,
      resource_name: resourceName,
      generated_content: JSON.stringify(result),
      db_operations: dbOperations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_file' });
  
  logger.info(`Génération des composants NestJS pour ${phpFilePath} terminée`);
  return result;
}

/**
 * Extraire le nom de ressource à partir d'une route Remix
 */
function getResourceNameFromRoute(remixRoutePath: string): string {
  // Supprimer le slash initial
  const cleanPath = remixRoutePath.startsWith('/') ? remixRoutePath.substring(1) : remixRoutePath;
  
  // Extraire le premier segment de la route
  const segments = cleanPath.split('/');
  const firstSegment = segments[0];
  
  // Si la route est racine, utiliser 'home'
  if (!firstSegment || firstSegment === '') {
    return 'home';
  }
  
  // Retourner le premier segment (sans les paramètres)
  return firstSegment.replace(/\$.*$/, '');
}

/**
 * Générer tous les fichiers NestJS pour un composant
 */
async function generateAllNestJSFiles(
  phpFilePath: string,
  resourceName: string,
  remixRoutePath: string,
  baseOutputDir: string,
  dataStructure: any,
  dbOperations: any,
  options: NestJSGeneratorOptions
): Promise<GeneratedNestJSComponent> {
  const additionalFiles = [];
  
  // Préparer les noms des ressources dans différents formats
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  const resourceSnake = snakeCase(resourceName);
  
  // Créer le dossier pour le module
  const moduleDir = path.join(baseOutputDir, 'modules', resourceCamel);
  if (!options.dryRun && !fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true });
  }
  
  // Créer les dossiers pour les DTOs
  const dtoDir = path.join(moduleDir, 'dto');
  if (!options.dryRun && !fs.existsSync(dtoDir)) {
    fs.mkdirSync(dtoDir, { recursive: true });
  }
  
  // Créer les dossiers pour les entités si nécessaire
  let entityDir = null;
  if (options.prismaIntegration) {
    entityDir = path.join(moduleDir, 'entities');
    if (!options.dryRun && !fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }
  }
  
  // Générer le contenu du contrôleur
  const controllerContent = generateController(resourceName, dataStructure, dbOperations, options);
  const controllerPath = path.join(moduleDir, `${resourceCamel}.controller.ts`);
  
  // Générer le contenu du service
  const serviceContent = generateService(resourceName, dataStructure, dbOperations, options);
  const servicePath = path.join(moduleDir, `${resourceCamel}.service.ts`);
  
  // Générer le contenu des DTOs
  const dtoContent = generateDTO(resourceName, dataStructure, options);
  const dtoPath = path.join(dtoDir, `${resourceCamel}.dto.ts`);
  
  // Générer le contenu du module
  const moduleContent = generateModule(resourceName, options);
  const modulePath = path.join(moduleDir, `${resourceCamel}.module.ts`);
  
  // Résultat de base
  const result: GeneratedNestJSComponent = {
    controller: {
      path: controllerPath,
      content: controllerContent,
    },
    service: {
      path: servicePath,
      content: serviceContent,
    },
    dto: {
      path: dtoPath,
      content: dtoContent,
    },
    module: {
      path: modulePath,
      content: moduleContent,
    },
    additionalFiles: [],
    routePath: remixRoutePath,
    originalPhpFile: phpFilePath,
    auditPath: path.join('./audit', `${resourceCamel}-nestjs.audit.md`),
  };
  
  // Générer l'entité si nécessaire
  if (options.prismaIntegration && entityDir) {
    const entityContent = generateEntity(resourceName, dataStructure, options);
    const entityPath = path.join(entityDir, `${resourceCamel}.entity.ts`);
    
    result.entity = {
      path: entityPath,
      content: entityContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      fs.writeFileSync(entityPath, entityContent);
    }
  }
  
  // Générer les tests si nécessaire
  if (options.withTests) {
    // Test du contrôleur
    const controllerTestContent = generateControllerTest(resourceName, options);
    const controllerTestPath = path.join(moduleDir, `${resourceCamel}.controller.spec.ts`);
    
    additionalFiles.push({
      path: controllerTestPath,
      content: controllerTestContent,
    });
    
    // Test du service
    const serviceTestContent = generateServiceTest(resourceName, options);
    const serviceTestPath = path.join(moduleDir, `${resourceCamel}.service.spec.ts`);
    
    additionalFiles.push({
      path: serviceTestPath,
      content: serviceTestContent,
    });
    
    // Écrire les fichiers si ce n'est pas un dry run
    if (!options.dryRun) {
      fs.writeFileSync(controllerTestPath, controllerTestContent);
      fs.writeFileSync(serviceTestPath, serviceTestContent);
    }
  }
  
  // Ajouter les fichiers supplémentaires aux résultats
  result.additionalFiles = additionalFiles;
  
  // Écrire les fichiers principaux si ce n'est pas un dry run
  if (!options.dryRun) {
    fs.writeFileSync(controllerPath, controllerContent);
    fs.writeFileSync(servicePath, serviceContent);
    fs.writeFileSync(dtoPath, dtoContent);
    fs.writeFileSync(modulePath, moduleContent);
  }
  
  return result;
}

/**
 * Générer le contrôleur NestJS
 */
function generateController(
  resourceName: string,
  dataStructure: any,
  dbOperations: any,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Déterminer si le contrôleur a besoin d'opérations CRUD
  const hasGet = dbOperations?.select || true;
  const hasGetOne = dbOperations?.select || true;
  const hasCreate = dbOperations?.insert || false;
  const hasUpdate = dbOperations?.update || false;
  const hasDelete = dbOperations?.delete || false;
  
  // Imports
  const imports = [
    `import { Controller${options.enableInterceptors ? ', UseInterceptors' : ''}${options.enableGuards ? ', UseGuards' : ''}${options.enableCaching ? ', CacheKey, CacheTTL' : ''} } from '@nestjs/common';`,
    `import { Get, Post${hasUpdate ? ', Put, Patch' : ''}${hasDelete ? ', Delete' : ''}, Body, Param${hasGetOne || hasUpdate || hasDelete ? ', NotFoundException' : ''}${hasCreate || hasUpdate ? ', ValidationPipe' : ''} } from '@nestjs/common';`,
    `import { ${resourcePascal}Service } from './${resourceCamel}.service';`,
    `import { Create${resourcePascal}Dto${hasUpdate ? `, Update${resourcePascal}Dto` : ''} } from './dto/${resourceCamel}.dto';`,
  ];
  
  // Ajouter les imports Swagger si nécessaire
  if (options.enableSwagger) {
    imports.push(`import { ApiTags, ApiOperation, ApiResponse${hasCreate || hasUpdate ? ', ApiBody' : ''}${hasGetOne || hasUpdate || hasDelete ? ', ApiParam' : ''} } from '@nestjs/swagger';`);
  }
  
  // Ajouter les imports d'intercepteurs si nécessaire
  if (options.enableInterceptors) {
    imports.push(`import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';`);
  }
  
  // Ajouter les imports de gardes si nécessaire
  if (options.enableGuards) {
    imports.push(`import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';`);
  }
  
  // Swagger et décorateurs
  const decorators = [
    options.enableSwagger ? `@ApiTags('${resourceCamel}')` : '',
    `@Controller('${options.apiPrefix}/${resourceCamel}')`,
    options.enableInterceptors ? '@UseInterceptors(TransformInterceptor)' : '',
    options.enableGuards ? '@UseGuards(JwtAuthGuard)' : '',
    options.enableCaching ? `@CacheKey('${resourceCamel}')` : '',
    options.enableCaching ? '@CacheTTL(30)' : '',
  ].filter(Boolean);
  
  // Code du contrôleur
  const controllerTemplate = `
/**
 * Contrôleur pour la ressource ${resourcePascal}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

${decorators.join('\n')}
export class ${resourcePascal}Controller {
  constructor(private readonly ${resourceCamel}Service: ${resourcePascal}Service) {}

  ${hasGet ? generateGetAllMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasGetOne ? generateGetOneMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasCreate ? generateCreateMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasUpdate ? generateUpdateMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasDelete ? generateDeleteMethod(resourcePascal, resourceCamel, options) : ''}
}
`.trim();

  return controllerTemplate;
}

/**
 * Générer la méthode GET pour récupérer tous les éléments
 */
function generateGetAllMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  const swaggerDecorators = options.enableSwagger ? `
  @ApiOperation({ summary: 'Récupère tous les ${resourceCamel}s' })
  @ApiResponse({ status: 200, description: 'Liste des ${resourceCamel}s récupérée avec succès' })` : '';

  return `${swaggerDecorators}
  @Get()
  findAll() {
    return this.${resourceCamel}Service.findAll();
  }`;
}

/**
 * Générer la méthode GET pour récupérer un élément par ID
 */
function generateGetOneMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  const swaggerDecorators = options.enableSwagger ? `
  @ApiOperation({ summary: 'Récupère un ${resourceCamel} par son ID' })
  @ApiParam({ name: 'id', description: 'ID du ${resourceCamel}' })
  @ApiResponse({ status: 200, description: '${resourcePascal} récupéré avec succès' })
  @ApiResponse({ status: 404, description: '${resourcePascal} non trouvé' })` : '';

  return `${swaggerDecorators}
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ${resourceCamel} = await this.${resourceCamel}Service.findOne(+id);
    
    if (!${resourceCamel}) {
      throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
    }
    
    return ${resourceCamel};
  }`;
}

/**
 * Générer la méthode POST pour créer un élément
 */
function generateCreateMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  const swaggerDecorators = options.enableSwagger ? `
  @ApiOperation({ summary: 'Crée un nouveau ${resourceCamel}' })
  @ApiBody({ type: Create${resourcePascal}Dto })
  @ApiResponse({ status: 201, description: '${resourcePascal} créé avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })` : '';

  return `${swaggerDecorators}
  @Post()
  create(@Body(${options.enableValidation ? 'new ValidationPipe({ transform: true })' : ''}) create${resourcePascal}Dto: Create${resourcePascal}Dto) {
    return this.${resourceCamel}Service.create(create${resourcePascal}Dto);
  }`;
}

/**
 * Générer la méthode PUT/PATCH pour mettre à jour un élément
 */
function generateUpdateMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  const swaggerDecorators = options.enableSwagger ? `
  @ApiOperation({ summary: 'Met à jour un ${resourceCamel} existant' })
  @ApiParam({ name: 'id', description: 'ID du ${resourceCamel} à mettre à jour' })
  @ApiBody({ type: Update${resourcePascal}Dto })
  @ApiResponse({ status: 200, description: '${resourcePascal} mis à jour avec succès' })
  @ApiResponse({ status: 404, description: '${resourcePascal} non trouvé' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })` : '';

  return `${swaggerDecorators}
  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body(${options.enableValidation ? 'new ValidationPipe({ transform: true })' : ''}) update${resourcePascal}Dto: Update${resourcePascal}Dto
  ) {
    try {
      return await this.${resourceCamel}Service.update(+id, update${resourcePascal}Dto);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
      }
      throw error;
    }
  }`;
}

/**
 * Générer la méthode DELETE pour supprimer un élément
 */
function generateDeleteMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  const swaggerDecorators = options.enableSwagger ? `
  @ApiOperation({ summary: 'Supprime un ${resourceCamel}' })
  @ApiParam({ name: 'id', description: 'ID du ${resourceCamel} à supprimer' })
  @ApiResponse({ status: 200, description: '${resourcePascal} supprimé avec succès' })
  @ApiResponse({ status: 404, description: '${resourcePascal} non trouvé' })` : '';

  return `${swaggerDecorators}
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.${resourceCamel}Service.remove(+id);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
      }
      throw error;
    }
  }`;
}

/**
 * Générer le service NestJS
 */
function generateService(
  resourceName: string,
  dataStructure: any,
  dbOperations: any,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Déterminer si le service a besoin d'opérations CRUD
  const hasGet = dbOperations?.select || true;
  const hasGetOne = dbOperations?.select || true;
  const hasCreate = dbOperations?.insert || false;
  const hasUpdate = dbOperations?.update || false;
  const hasDelete = dbOperations?.delete || false;
  
  // Imports
  const imports = [
    `import { Injectable${hasGetOne || hasUpdate || hasDelete ? ', NotFoundException' : ''} } from '@nestjs/common';`,
    `import { Create${resourcePascal}Dto${hasUpdate ? `, Update${resourcePascal}Dto` : ''} } from './dto/${resourceCamel}.dto';`,
  ];
  
  // Ajouter l'import de Prisma si nécessaire
  if (options.prismaIntegration) {
    imports.push(`import { PrismaService } from '../../common/services/prisma.service';`);
  }
  
  // Service
  const serviceTemplate = `
/**
 * Service pour la ressource ${resourcePascal}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

@Injectable()
export class ${resourcePascal}Service {
  constructor(${options.prismaIntegration ? 'private prisma: PrismaService' : ''}) {}

  ${hasGet ? generateFindAllMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasGetOne ? generateFindOneMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasCreate ? generateCreateServiceMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasUpdate ? generateUpdateServiceMethod(resourcePascal, resourceCamel, options) : ''}

  ${hasDelete ? generateRemoveServiceMethod(resourcePascal, resourceCamel, options) : ''}
}
`.trim();

  return serviceTemplate;
}

/**
 * Générer la méthode findAll pour le service
 */
function generateFindAllMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  if (options.prismaIntegration) {
    return `
  /**
   * Récupère tous les ${resourceCamel}s
   */
  async findAll() {
    return this.prisma.${resourceCamel}.findMany();
  }`;
  } else {
    return `
  /**
   * Récupère tous les ${resourceCamel}s
   */
  async findAll() {
    // Implémentez la logique de récupération ici
    return []; // Remplacez par une implémentation réelle
  }`;
  }
}

/**
 * Générer la méthode findOne pour le service
 */
function generateFindOneMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  if (options.prismaIntegration) {
    return `
  /**
   * Récupère un ${resourceCamel} par son ID
   */
  async findOne(id: number) {
    const ${resourceCamel} = await this.prisma.${resourceCamel}.findUnique({
      where: { id },
    });
    
    if (!${resourceCamel}) {
      return null;
    }
    
    return ${resourceCamel};
  }`;
  } else {
    return `
  /**
   * Récupère un ${resourceCamel} par son ID
   */
  async findOne(id: number) {
    // Implémentez la logique de récupération ici
    return null; // Remplacez par une implémentation réelle
  }`;
  }
}

/**
 * Générer la méthode create pour le service
 */
function generateCreateServiceMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  if (options.prismaIntegration) {
    return `
  /**
   * Crée un nouveau ${resourceCamel}
   */
  async create(create${resourcePascal}Dto: Create${resourcePascal}Dto) {
    return this.prisma.${resourceCamel}.create({
      data: create${resourcePascal}Dto,
    });
  }`;
  } else {
    return `
  /**
   * Crée un nouveau ${resourceCamel}
   */
  async create(create${resourcePascal}Dto: Create${resourcePascal}Dto) {
    // Implémentez la logique de création ici
    return create${resourcePascal}Dto; // Remplacez par une implémentation réelle
  }`;
  }
}

/**
 * Générer la méthode update pour le service
 */
function generateUpdateServiceMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  if (options.prismaIntegration) {
    return `
  /**
   * Met à jour un ${resourceCamel} existant
   */
  async update(id: number, update${resourcePascal}Dto: Update${resourcePascal}Dto) {
    try {
      return await this.prisma.${resourceCamel}.update({
        where: { id },
        data: update${resourcePascal}Dto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
      }
      throw error;
    }
  }`;
  } else {
    return `
  /**
   * Met à jour un ${resourceCamel} existant
   */
  async update(id: number, update${resourcePascal}Dto: Update${resourcePascal}Dto) {
    // Implémentez la logique de mise à jour ici
    const ${resourceCamel} = await this.findOne(id);
    
    if (!${resourceCamel}) {
      throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
    }
    
    // Implémentez la mise à jour ici
    return { id, ...update${resourcePascal}Dto }; // Remplacez par une implémentation réelle
  }`;
  }
}

/**
 * Générer la méthode remove pour le service
 */
function generateRemoveServiceMethod(resourcePascal: string, resourceCamel: string, options: NestJSGeneratorOptions): string {
  if (options.prismaIntegration) {
    return `
  /**
   * Supprime un ${resourceCamel}
   */
  async remove(id: number) {
    try {
      return await this.prisma.${resourceCamel}.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
      }
      throw error;
    }
  }`;
  } else {
    return `
  /**
   * Supprime un ${resourceCamel}
   */
  async remove(id: number) {
    // Implémentez la logique de suppression ici
    const ${resourceCamel} = await this.findOne(id);
    
    if (!${resourceCamel}) {
      throw new NotFoundException(\`${resourcePascal} avec l'ID \${id} non trouvé\`);
    }
    
    // Implémentez la suppression ici
    return { id }; // Remplacez par une implémentation réelle
  }`;
  }
}

/**
 * Générer les DTOs NestJS
 */
function generateDTO(
  resourceName: string,
  dataStructure: any,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Extraire les propriétés de la structure de données
  const properties = [];
  const structure = dataStructure?.[resourceCamel] || dataStructure?.[resourcePascal] || dataStructure?.['data'] || {};
  
  // Pour chaque propriété, ajouter un champ dans le DTO
  for (const [key, value] of Object.entries(structure)) {
    // Éviter d'inclure les champs générés automatiquement dans CreateDTO
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
      continue;
    }
    
    // Déterminer le type TypeScript
    const tsType = guessTypeFromValue(value);
    
    // Ajouter des décorateurs de validation si nécessaire
    const validationDecorators = [];
    if (options.enableValidation) {
      if (tsType === 'string') {
        validationDecorators.push('@IsString()');
        if (key === 'email') {
          validationDecorators.push('@IsEmail()');
        }
      } else if (tsType === 'number') {
        validationDecorators.push('@IsNumber()');
        if (key.toLowerCase().includes('id')) {
          validationDecorators.push('@IsInt()');
        }
      } else if (tsType === 'boolean') {
        validationDecorators.push('@IsBoolean()');
      } else if (tsType === 'Date') {
        validationDecorators.push('@IsDate()');
      } else if (tsType.endsWith('[]')) {
        validationDecorators.push('@IsArray()');
      }
      
      // Ajouter @IsOptional() pour UpdateDTO
      validationDecorators.push('@IsOptional()');
    }
    
    // Ajouter des décorateurs Swagger si nécessaire
    if (options.enableSwagger) {
      validationDecorators.push(`@ApiProperty({ description: '${key}' })`);
    }
    
    // Ajouter la propriété avec ses décorateurs
    properties.push({
      key,
      type: tsType,
      validationDecorators,
    });
  }
  
  // Imports
  const imports = [];
  
  // Ajouter les imports de validation si nécessaire
  if (options.enableValidation) {
    let validationImports = ['IsOptional'];
    
    // Ajouter les décorateurs utilisés
    const validationTypes = new Set();
    properties.forEach(prop => {
      prop.validationDecorators.forEach(decorator => {
        const match = decorator.match(/@Is([A-Za-z]+)\(\)/);
        if (match && match[1] !== 'Optional') {
          validationTypes.add(match[1]);
        }
      });
    });
    
    validationImports = [...validationImports, ...Array.from(validationTypes)];
    imports.push(`import { ${validationImports.join(', ')} } from 'class-validator';`);
  }
  
  // Ajouter les imports Swagger si nécessaire
  if (options.enableSwagger) {
    imports.push(`import { ApiProperty, PartialType } from '@nestjs/swagger';`);
  } else {
    imports.push(`import { PartialType } from '@nestjs/common';`);
  }
  
  // Générer le code du DTO
  const dtoTemplate = `
/**
 * DTO pour la ressource ${resourcePascal}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

/**
 * DTO pour créer un ${resourcePascal}
 */
export class Create${resourcePascal}Dto {
${properties.map(prop => `  ${prop.validationDecorators.join('\n  ')}
  ${prop.key}: ${prop.type};
`).join('\n')}
}

/**
 * DTO pour mettre à jour un ${resourcePascal}
 * Hérite de Create${resourcePascal}Dto avec toutes les propriétés optionnelles
 */
export class Update${resourcePascal}Dto extends PartialType(Create${resourcePascal}Dto) {}
`.trim();

  return dtoTemplate;
}

/**
 * Générer l'entité NestJS (pour Prisma)
 */
function generateEntity(
  resourceName: string,
  dataStructure: any,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Extraire les propriétés de la structure de données
  const properties = [];
  const structure = dataStructure?.[resourceCamel] || dataStructure?.[resourcePascal] || dataStructure?.['data'] || {};
  
  // Pour chaque propriété, ajouter un champ dans l'entité
  for (const [key, value] of Object.entries(structure)) {
    // Déterminer le type TypeScript
    const tsType = guessTypeFromValue(value);
    
    // Ajouter des décorateurs Swagger si nécessaire
    const swaggerDecorator = options.enableSwagger ? `  @ApiProperty({ description: '${key}' })\n` : '';
    
    // Ajouter la propriété
    properties.push({
      key,
      type: tsType,
      swaggerDecorator,
    });
  }
  
  // Imports
  const imports = [];
  
  // Ajouter les imports Swagger si nécessaire
  if (options.enableSwagger) {
    imports.push(`import { ApiProperty } from '@nestjs/swagger';`);
  }
  
  // Générer le code de l'entité
  const entityTemplate = `
/**
 * Entité pour la ressource ${resourcePascal}
 * Générée automatiquement pour correspondre au modèle Prisma
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

/**
 * Entité ${resourcePascal} - Mapped Prisma Model
 */
export class ${resourcePascal} {
${properties.map(prop => `${prop.swaggerDecorator}  ${prop.key}: ${prop.type};
`).join('\n')}
}
`.trim();

  return entityTemplate;
}

/**
 * Générer le module NestJS
 */
function generateModule(
  resourceName: string,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Imports
  const imports = [
    `import { Module } from '@nestjs/common';`,
    `import { ${resourcePascal}Service } from './${resourceCamel}.service';`,
    `import { ${resourcePascal}Controller } from './${resourceCamel}.controller';`,
  ];
  
  // Ajouter l'import de Prisma si nécessaire
  if (options.prismaIntegration) {
    imports.push(`import { PrismaService } from '../../common/services/prisma.service';`);
  }
  
  // Générer le code du module
  const moduleTemplate = `
/**
 * Module pour la ressource ${resourcePascal}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

@Module({
  controllers: [${resourcePascal}Controller],
  providers: [${resourcePascal}Service${options.prismaIntegration ? ', PrismaService' : ''}],
  exports: [${resourcePascal}Service],
})
export class ${resourcePascal}Module {}
`.trim();

  return moduleTemplate;
}

/**
 * Générer les tests du contrôleur
 */
function generateControllerTest(
  resourceName: string,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  const controllerTestTemplate = `
/**
 * Tests pour le contrôleur ${resourcePascal}
 * Générés automatiquement
 * Date: ${new Date().toISOString()}
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ${resourcePascal}Controller } from './${resourceCamel}.controller';
import { ${resourcePascal}Service } from './${resourceCamel}.service';

describe('${resourcePascal}Controller', () => {
  let controller: ${resourcePascal}Controller;
  let service: ${resourcePascal}Service;

  // Mock du service
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${resourcePascal}Controller],
      providers: [
        {
          provide: ${resourcePascal}Service,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<${resourcePascal}Controller>(${resourcePascal}Controller);
    service = module.get<${resourcePascal}Service>(${resourcePascal}Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of ${resourceCamel}s', async () => {
      const result = [{ id: 1, name: 'Test' }];
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single ${resourceCamel}', async () => {
      const result = { id: 1, name: 'Test' };
      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  // Ajoutez d'autres tests pour create, update et remove selon les besoins
});
`.trim();

  return controllerTestTemplate;
}

/**
 * Générer les tests du service
 */
function generateServiceTest(
  resourceName: string,
  options: NestJSGeneratorOptions
): string {
  const resourceCamel = camelCase(resourceName);
  const resourcePascal = pascalCase(resourceName);
  
  // Imports additionnels pour Prisma
  const prismaImports = options.prismaIntegration ? `
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundException } from '@nestjs/common';` : '';

  // Mock du client Prisma
  const prismaMock = options.prismaIntegration ? `
  // Mock du service Prisma
  const mockPrismaService = {
    ${resourceCamel}: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };` : '';
  
  const prismaProviders = options.prismaIntegration ? `
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },` : '';
  
  const serviceTestTemplate = `
/**
 * Tests pour le service ${resourcePascal}
 * Générés automatiquement
 * Date: ${new Date().toISOString()}
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ${resourcePascal}Service } from './${resourceCamel}.service';${prismaImports}

describe('${resourcePascal}Service', () => {
  let service: ${resourcePascal}Service;
  ${options.prismaIntegration ? `let prisma: PrismaService;` : ''}
${prismaMock}
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${resourcePascal}Service,${prismaProviders}
      ],
    }).compile();

    service = module.get<${resourcePascal}Service>(${resourcePascal}Service);
    ${options.prismaIntegration ? `prisma = module.get<PrismaService>(PrismaService);` : ''}
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of ${resourceCamel}s', async () => {
      const result = [{ id: 1, name: 'Test' }];
      ${options.prismaIntegration ? `mockPrismaService.${resourceCamel}.findMany.mockResolvedValue(result);` : ''}

      ${options.prismaIntegration ? `expect(await service.findAll()).toBe(result);
      expect(prisma.${resourceCamel}.findMany).toHaveBeenCalled();` : `// Implémentez ce test selon la logique de votre service`}
    });
  });

  describe('findOne', () => {
    it('should return a single ${resourceCamel}', async () => {
      const result = { id: 1, name: 'Test' };
      ${options.prismaIntegration ? `mockPrismaService.${resourceCamel}.findUnique.mockResolvedValue(result);` : ''}

      ${options.prismaIntegration ? `expect(await service.findOne(1)).toBe(result);
      expect(prisma.${resourceCamel}.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });` : `// Implémentez ce test selon la logique de votre service`}
    });
    
    ${options.prismaIntegration ? `it('should return null when no ${resourceCamel} is found', async () => {
      mockPrismaService.${resourceCamel}.findUnique.mockResolvedValue(null);

      expect(await service.findOne(999)).toBeNull();
      expect(prisma.${resourceCamel}.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });` : ''}
  });

  // Ajoutez d'autres tests pour create, update et remove selon les besoins
});
`.trim();

  return serviceTestTemplate;
}

/**
 * Deviner le type TypeScript à partir d'une valeur
 */
function guessTypeFromValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      // Détecter les formats de date
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'Date';
      }
      return 'string';
    case 'number':
      return Number.isInteger(value) ? 'number' : 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        return `${guessTypeFromValue(value[0])}[]`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

// Export des fonctions principales
export default {
  generateNestJSComponents,
};