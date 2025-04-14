import fs from 'fs';
import path from 'path';
import { PhpAnalysisResult } from '../types';
import { analyzePhpFile } from '../analysis/php-analyzer';
import { extractDataStructures } from '../core/data-extractor';
import { generatePrismaSchema } from '../core/prisma-generator';

/**
 * Agent de génération NestJS à partir de fichiers PHP
 * Responsable de la génération de contrôleurs, services et DTOs NestJS
 */
export class NestJSGenerator {
  /**
   * Génère les composants NestJS à partir d'un fichier PHP
   * @param sourceFilePath Chemin vers le fichier PHP source
   * @param destinationPath Dossier de destination pour les fichiers NestJS générés
   */
  async generateFromPhp(sourceFilePath: string, destinationPath: string) {
    try {
      console.log(`[NestJSGenerator] Analyse du fichier PHP : ${sourceFilePath}`);
      
      // 1. Analyser le fichier PHP
      const analysisResult = await analyzePhpFile(sourceFilePath);
      
      // 2. Extraire les structures de données
      const dataStructures = await extractDataStructures(sourceFilePath, analysisResult);
      
      // 3. Générer les composants NestJS
      const nestComponents = await this.generateNestJSComponents(
        path.basename(sourceFilePath, '.php'),
        dataStructures,
        analysisResult
      );
      
      // 4. Écrire les fichiers générés
      await this.writeNestJSFiles(nestComponents, destinationPath);
      
      // 5. Générer un fragment de schéma Prisma
      await this.generatePrismaSchema(dataStructures, analysisResult);
      
      return {
        success: true,
        sourceFile: sourceFilePath,
        generatedFiles: Object.keys(nestComponents)
      };
    } catch (error) {
      console.error(`[NestJSGenerator] Erreur lors de la génération NestJS pour ${sourceFilePath}:`, error);
      return {
        success: false,
        sourceFile: sourceFilePath,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Génère les composants NestJS (controller, service, DTOs)
   */
  private async generateNestJSComponents(
    baseName: string,
    dataStructures: any,
    analysisResult: PhpAnalysisResult
  ) {
    // Créer le nom du module en camelCase pour assurer la cohérence
    const moduleName = this.toCamelCase(baseName);
    
    // Générer le controller
    const controllerContent = this.generateController(moduleName, dataStructures);
    
    // Générer le service
    const serviceContent = this.generateService(moduleName, dataStructures, analysisResult);
    
    // Générer les DTOs
    const dtoContent = this.generateDTOs(moduleName, dataStructures);
    
    // Générer le module
    const moduleContent = this.generateModule(moduleName);
    
    return {
      [`${moduleName}.controller.ts`]: controllerContent,
      [`${moduleName}.service.ts`]: serviceContent,
      [`${moduleName}.dto.ts`]: dtoContent,
      [`${moduleName}.module.ts`]: moduleContent
    };
  }

  /**
   * Génère le contrôleur NestJS
   */
  private generateController(moduleName: string, dataStructures: any) {
    const entityName = this.capitalizeFirst(moduleName);
    const resourceName = moduleName.toLowerCase();
    
    return `import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${entityName}Service } from './${moduleName}.service';
import { Create${entityName}Dto, Update${entityName}Dto, Find${entityName}Dto } from './${moduleName}.dto';

@ApiTags('${resourceName}')
@Controller('${resourceName}')
export class ${entityName}Controller {
  constructor(private readonly ${moduleName}Service: ${entityName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau ${resourceName}' })
  @ApiResponse({ status: 201, description: '${resourceName} créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() create${entityName}Dto: Create${entityName}Dto) {
    return this.${moduleName}Service.create(create${entityName}Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les ${resourceName}s' })
  @ApiResponse({ status: 200, description: 'Liste des ${resourceName}s.' })
  findAll(@Query() query: Find${entityName}Dto) {
    return this.${moduleName}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un ${resourceName} par son ID' })
  @ApiResponse({ status: 200, description: '${resourceName} trouvé.' })
  @ApiResponse({ status: 404, description: '${resourceName} non trouvé.' })
  findOne(@Param('id') id: string) {
    return this.${moduleName}Service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un ${resourceName}' })
  @ApiResponse({ status: 200, description: '${resourceName} mis à jour.' })
  @ApiResponse({ status: 404, description: '${resourceName} non trouvé.' })
  update(@Param('id') id: string, @Body() update${entityName}Dto: Update${entityName}Dto) {
    return this.${moduleName}Service.update(+id, update${entityName}Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un ${resourceName}' })
  @ApiResponse({ status: 200, description: '${resourceName} supprimé.' })
  @ApiResponse({ status: 404, description: '${resourceName} non trouvé.' })
  remove(@Param('id') id: string) {
    return this.${moduleName}Service.remove(+id);
  }
}`;
  }

  /**
   * Génère le service NestJS
   */
  private generateService(moduleName: string, dataStructures: any, analysisResult: PhpAnalysisResult) {
    const entityName = this.capitalizeFirst(moduleName);
    const resourceName = moduleName.toLowerCase();
    
    // Déterminer si le code PHP source contient des transactions
    const hasTransactions = analysisResult.transactions && analysisResult.transactions.length > 0;
    
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Create${entityName}Dto, Update${entityName}Dto, Find${entityName}Dto } from './${moduleName}.dto';

@Injectable()
export class ${entityName}Service {
  constructor(private prisma: PrismaService) {}

  async create(create${entityName}Dto: Create${entityName}Dto) {
    return this.prisma.${resourceName}.create({
      data: create${entityName}Dto,
    });
  }

  async findAll(query: Find${entityName}Dto) {
    const { skip, take = 10, orderBy = 'id', sortOrder = 'asc', ...filters } = query;
    
    return this.prisma.${resourceName}.findMany({
      skip: skip ? +skip : undefined,
      take: +take,
      orderBy: {
        [orderBy]: sortOrder,
      },
      where: filters,
    });
  }

  async findOne(id: number) {
    const ${resourceName} = await this.prisma.${resourceName}.findUnique({
      where: { id },
    });

    if (!${resourceName}) {
      throw new NotFoundException(\`${entityName} avec l'ID \${id} non trouvé\`);
    }

    return ${resourceName};
  }

  async update(id: number, update${entityName}Dto: Update${entityName}Dto) {
    try {
      return await this.prisma.${resourceName}.update({
        where: { id },
        data: update${entityName}Dto,
      });
    } catch (error) {
      throw new NotFoundException(\`${entityName} avec l'ID \${id} non trouvé\`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.${resourceName}.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(\`${entityName} avec l'ID \${id} non trouvé\`);
    }
  }${hasTransactions ? `

  async processWithTransaction(data: any) {
    return this.prisma.$transaction(async (prisma) => {
      // Logique de transaction similaire à celle détectée dans le code PHP
      const ${resourceName} = await prisma.${resourceName}.create({
        data: {
          // Données basées sur l'analyse du code source
        },
      });
      
      // Autres opérations dans la transaction
      
      return ${resourceName};
    });
  }` : ''}
}`;
  }

  /**
   * Génère les DTOs NestJS
   */
  private generateDTOs(moduleName: string, dataStructures: any) {
    const entityName = this.capitalizeFirst(moduleName);
    
    const properties = dataStructures.fields.map(field => {
      const { name, type, required } = field;
      const decorators = [];
      
      // Ajouter des décorateurs de validation selon le type
      switch (type.toLowerCase()) {
        case 'string':
          decorators.push('@IsString()');
          if (!required) decorators.push('@IsOptional()');
          break;
        case 'number':
        case 'integer':
          decorators.push('@IsNumber()');
          if (!required) decorators.push('@IsOptional()');
          break;
        case 'boolean':
          decorators.push('@IsBoolean()');
          if (!required) decorators.push('@IsOptional()');
          break;
        case 'date':
          decorators.push('@IsDate()');
          if (!required) decorators.push('@IsOptional()');
          break;
        default:
          if (!required) decorators.push('@IsOptional()');
      }
      
      return `  ${decorators.join('\n  ')}
  ${name}${required ? '' : '?'}: ${this.mapPhpTypeToTypeScript(type)};`;
    }).join('\n\n');
    
    return `import { IsString, IsNumber, IsBoolean, IsDate, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Create${entityName}Dto {
${properties}
}

export class Update${entityName}Dto {
  @IsOptional()
${properties.replace(/^  /gm, '  @IsOptional()\n  ')}
}

export class Find${entityName}Dto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  take?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
  
  // Ajouter les filtres spécifiques au besoin
}`;
  }

  /**
   * Génère le module NestJS
   */
  private generateModule(moduleName: string) {
    const entityName = this.capitalizeFirst(moduleName);
    
    return `import { Module } from '@nestjs/common';
import { ${entityName}Service } from './${moduleName}.service';
import { ${entityName}Controller } from './${moduleName}.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [${entityName}Controller],
  providers: [${entityName}Service, PrismaService],
  exports: [${entityName}Service],
})
export class ${entityName}Module {}`;
  }

  /**
   * Génère un fragment de schéma Prisma basé sur l'analyse
   */
  private async generatePrismaSchema(dataStructures: any, analysisResult: PhpAnalysisResult) {
    const prismaSchema = await generatePrismaSchema(dataStructures);
    
    // Écrire le schéma dans un fichier temporaire pour référence
    const schemaDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const schemaPath = path.join(schemaDir, `${dataStructures.name}_${timestamp}.prisma`);
    fs.writeFileSync(schemaPath, prismaSchema);
    
    console.log(`[NestJSGenerator] Schéma Prisma généré : ${schemaPath}`);
    
    return {
      path: schemaPath,
      content: prismaSchema
    };
  }

  /**
   * Écrit les fichiers NestJS générés dans le dossier de destination
   */
  private async writeNestJSFiles(files: Record<string, string>, destinationPath: string) {
    // Créer le dossier de destination s'il n'existe pas
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    // Écrire chaque fichier généré
    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(destinationPath, fileName);
      fs.writeFileSync(filePath, content);
      console.log(`[NestJSGenerator] Fichier généré : ${filePath}`);
    }
  }

  /**
   * Convertit une chaîne en camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[\W_]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toLowerCase());
  }

  /**
   * Met en majuscule la première lettre d'une chaîne
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Mappe les types PHP vers les types TypeScript
   */
  private mapPhpTypeToTypeScript(phpType: string): string {
    switch (phpType.toLowerCase()) {
      case 'int':
      case 'float':
      case 'double':
      case 'integer':
        return 'number';
      case 'bool':
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'any[]';
      case 'object':
        return 'Record<string, any>';
      case 'datetime':
      case 'date':
        return 'Date';
      case 'null':
        return 'null';
      case 'string':
      default:
        return 'string';
    }
  }
}

// Export pour utilisation dans la CLI ou l'API
export default NestJSGenerator;