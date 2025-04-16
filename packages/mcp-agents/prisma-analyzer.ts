// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

#!/usr/bin/env ts-node
/**
 * 🧠 prisma-analyzer.ts — Analyseur de schéma Prisma et générateur de DTO/Zod
 * 
 * Cet outil analyse les modèles Prisma de votre projet et génère automatiquement:
 * 1. Des DTO NestJS pour la validation côté backend
 * 2. Des schémas Zod pour la validation côté frontend (Remix)
 * 3. Des mappers entre les anciens modèles et les nouveaux
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { promisify } from 'util';
import * as minimist from 'minimist';
import { camelCase, pascalCase, paramCase } from 'change-case';

// Conversion de glob en Promise
const globAsync = promisify(glob);

// Interface pour les options en ligne de commande
interface CliOptions {
  schemaPath: string;
  outputDir?: string;
  nestjsDir?: string;
  remixDir?: string;
  generateTypes?: boolean;
  generateDtos?: boolean;
  generateZod?: boolean;
  generateMappers?: boolean;
}

// Types de données Prisma
enum PrismaScalarType {
  String = 'String',
  Int = 'Int',
  Float = 'Float',
  Boolean = 'Boolean',
  DateTime = 'DateTime',
  Json = 'Json',
  BigInt = 'BigInt',
  Decimal = 'Decimal',
  Bytes = 'Bytes',
}

// Types de relations Prisma
enum RelationType {
  OneToOne = 'OneToOne',
  OneToMany = 'OneToMany',
  ManyToOne = 'ManyToOne',
  ManyToMany = 'ManyToMany',
}

// Modèle Prisma
interface PrismaModel {
  name: string;
  dbName?: string;
  documentation?: string;
  fields: PrismaField[];
}

// Champ d'un modèle Prisma
interface PrismaField {
  name: string;
  type: string;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  relationType?: RelationType;
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefaultValue: boolean;
  defaultValue?: any;
  documentation?: string;
  dbName?: string;
  attributes?: Record<string, any>[];
}

// Énumération Prisma
interface PrismaEnum {
  name: string;
  values: string[];
  documentation?: string;
}

// Structure du schéma Prisma
interface PrismaSchema {
  models: PrismaModel[];
  enums: PrismaEnum[];
  datasource: {
    provider: string;
    url: string;
  };
}

/**
 * Classe principale d'analyse du schéma Prisma
 */
class PrismaAnalyzer {
  private schema: PrismaSchema;
  private logger: Console;

  constructor(private options: CliOptions) {
    this.schema = {
      models: [],
      enums: [],
      datasource: {
        provider: 'unknown',
        url: ''
      }
    };
    this.logger = console;
  }

  /**
   * Point d'entrée principal de l'analyse
   */
  public async analyze(): Promise<void> {
    this.logger.info('🔍 Analyse du schéma Prisma...');
    
    try {
      // Lecture du schéma Prisma
      await this.parsePrismaSchema();
      
      // Création des dossiers de sortie si nécessaire
      if (this.options.outputDir) {
        await fs.mkdir(this.options.outputDir, { recursive: true });
      }

      if (this.options.nestjsDir) {
        await fs.mkdir(this.options.nestjsDir, { recursive: true });
      }

      if (this.options.remixDir) {
        await fs.mkdir(this.options.remixDir, { recursive: true });
      }
      
      // Génération des fichiers
      if (this.options.generateTypes !== false) {
        await this.generateTypeDefinitions();
      }
      
      if (this.options.generateDtos !== false) {
        await this.generateNestJSDtos();
      }
      
      if (this.options.generateZod !== false) {
        await this.generateZodSchemas();
      }
      
      if (this.options.generateMappers !== false) {
        await this.generateEntityMappers();
      }
      
      this.logger.info('✅ Analyse et génération terminées avec succès!');
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'analyse:', error);
      throw error;
    }
  }

  /**
   * Analyse le schéma Prisma et extrait les modèles et énumérations
   */
  private async parsePrismaSchema(): Promise<void> {
    this.logger.info(`📄 Lecture du schéma Prisma: ${this.options.schemaPath}`);
    
    try {
      const schemaContent = await fs.readFile(this.options.schemaPath, 'utf8');
      
      // Extraction du fournisseur de données
      const datasourceMatch = schemaContent.match(/datasource\s+\w+\s*{[^}]*provider\s*=\s*["']([^"']+)["'][^}]*}/s);
      if (datasourceMatch) {
        this.schema.datasource.provider = datasourceMatch[1];
      }
      
      const urlMatch = schemaContent.match(/datasource\s+\w+\s*{[^}]*url\s*=\s*["']([^"']+)["'][^}]*}/s);
      if (urlMatch) {
        this.schema.datasource.url = urlMatch[1];
      }
      
      // Extraction des énumérations
      const enumRegex = /enum\s+(\w+)\s*{([^}]*)}/g;
      let enumMatch;
      
      while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
        const enumName = enumMatch[1];
        const enumContent = enumMatch[2].trim();
        const enumValues = enumContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('//'))
          .map(line => {
            // Extraire juste le nom de l'énumération, sans les commentaires ou attributs
            const valueName = line.split(/\s+/)[0];
            return valueName;
          });
        
        // Recherche de documentation
        const enumDocMatch = schemaContent.substring(0, enumMatch.index).match(/\/\/\/.*\n$/);
        const documentation = enumDocMatch ? enumDocMatch[0].replace('///', '').trim() : undefined;
        
        this.schema.enums.push({
          name: enumName,
          values: enumValues,
          documentation
        });
      }
      
      // Extraction des modèles
      const modelRegex = /model\s+(\w+)\s*(?:\/\/\s*(.*?)\s*\n)?{([^}]*)}/g;
      let modelMatch;
      
      while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
        const modelName = modelMatch[1];
        const inlineComment = modelMatch[2] || '';
        const modelContent = modelMatch[3].trim();
        
        // Recherche de documentation
        const modelDocMatch = schemaContent.substring(0, modelMatch.index).match(/\/\/\/.*\n$/);
        const documentation = modelDocMatch 
          ? modelDocMatch[0].replace('///', '').trim() 
          : inlineComment;
        
        // Recherche du nom de table personnalisé
        const dbNameMatch = modelContent.match(/@map\(['"](.*?)['"]\)/);
        const dbName = dbNameMatch ? dbNameMatch[1] : undefined;
        
        // Analyse des champs du modèle
        const fields = this.parseModelFields(modelContent, modelName);
        
        this.schema.models.push({
          name: modelName,
          dbName,
          documentation,
          fields
        });
      }
      
      this.logger.info(`✅ Schéma analysé: ${this.schema.models.length} modèles, ${this.schema.enums.length} énumérations`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la lecture du schéma: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyse les champs d'un modèle Prisma
   */
  private parseModelFields(modelContent: string, modelName: string): PrismaField[] {
    const fields: PrismaField[] = [];
    const fieldLines = modelContent.split('\n');
    
    for (let i = 0; i < fieldLines.length; i++) {
      const line = fieldLines[i].trim();
      
      // Ignorer les lignes vides ou les commentaires
      if (!line || line.startsWith('//') || line.startsWith('@@')) {
        continue;
      }
      
      // Documentation du champ dans les commentaires précédents
      let documentation: string | undefined;
      if (i > 0 && fieldLines[i - 1].trim().startsWith('///')) {
        documentation = fieldLines[i - 1].trim().replace('///', '').trim();
      }
      
      // Analyse du champ
      const fieldMatch = line.match(/(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
      if (fieldMatch) {
        const name = fieldMatch[1];
        const type = fieldMatch[2];
        const isList = !!fieldMatch[3];
        const isRequired = !fieldMatch[4];
        const attributes = fieldMatch[5] || '';
        
        // Vérification si c'est un champ ID
        const isId = attributes.includes('@id');
        
        // Vérification si c'est un champ unique
        const isUnique = attributes.includes('@unique');
        
        // Vérification si le champ a une valeur par défaut
        const hasDefaultValue = attributes.includes('@default');
        let defaultValue: any = undefined;
        
        const defaultMatch = attributes.match(/@default\((.*?)\)/);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        
        // Nom personnalisé pour la colonne de la base de données
        let dbName: string | undefined;
        const mapMatch = attributes.match(/@map\(['"](.*?)['"]\)/);
        if (mapMatch) {
          dbName = mapMatch[1];
        }
        
        // Détection des relations
        let relationName: string | undefined;
        let relationFromFields: string[] | undefined;
        let relationToFields: string[] | undefined;
        let relationType: RelationType | undefined;
        
        const relationMatch = attributes.match(/@relation\((.*?)\)/);
        if (relationMatch) {
          const relationAttrs = relationMatch[1];
          
          // Nom de la relation
          const nameMatch = relationAttrs.match(/name:\s*["']([^"']+)["']/);
          if (nameMatch) {
            relationName = nameMatch[1];
          }
          
          // Champs de la relation
          const fieldsMatch = relationAttrs.match(/fields:\s*\[(.*?)\]/);
          if (fieldsMatch) {
            relationFromFields = fieldsMatch[1].split(',').map(f => f.trim());
          }
          
          // Champs cibles de la relation
          const referencesMatch = relationAttrs.match(/references:\s*\[(.*?)\]/);
          if (referencesMatch) {
            relationToFields = referencesMatch[1].split(',').map(f => f.trim());
          }
          
          // Détermination du type de relation
          if (isList && relationFromFields && relationToFields) {
            relationType = RelationType.ManyToMany;
          } else if (isList) {
            relationType = RelationType.OneToMany;
          } else if (relationFromFields && relationToFields) {
            relationType = RelationType.ManyToOne;
          } else {
            relationType = RelationType.OneToOne;
          }
        }
        
        fields.push({
          name,
          type,
          relationName,
          relationFromFields,
          relationToFields,
          relationType,
          isRequired,
          isList,
          isId,
          isUnique,
          hasDefaultValue,
          defaultValue,
          documentation,
          dbName
        });
      }
    }
    
    return fields;
  }

  /**
   * Génère les définitions de types TypeScript
   */
  private async generateTypeDefinitions(): Promise<void> {
    this.logger.info('📦 Génération des définitions de types TypeScript...');
    
    const outputPath = path.join(this.options.outputDir || '.', 'prisma-types.ts');
    let content = `/**
 * Types générés automatiquement à partir du schéma Prisma
 * Ne pas modifier manuellement - utilisez prisma-analyzer.ts pour régénérer
 */

import { Prisma } from '@prisma/client';\n\n`;
    
    // Génération des types pour les énumérations
    if (this.schema.enums.length > 0) {
      content += '// Énumérations\n';
      
      for (const enumObj of this.schema.enums) {
        if (enumObj.documentation) {
          content += `/**\n * ${enumObj.documentation}\n */\n`;
        }
        
        content += `export enum ${enumObj.name} {\n`;
        
        for (const value of enumObj.values) {
          content += `  ${value} = '${value}',\n`;
        }
        
        content += '}\n\n';
      }
    }
    
    // Génération des interfaces pour les modèles
    content += '// Interfaces\n';
    
    for (const model of this.schema.models) {
      if (model.documentation) {
        content += `/**\n * ${model.documentation}\n */\n`;
      }
      
      content += `export interface ${model.name} {\n`;
      
      for (const field of model.fields) {
        // Ajouter la documentation si elle existe
        if (field.documentation) {
          content += `  /**\n   * ${field.documentation}\n   */\n`;
        }
        
        // Déterminer le type TypeScript correspondant
        let typeScriptType = this.getPrismaToTypeScriptType(field.type);
        
        // Gérer les listes et les optionnels
        if (field.isList) {
          typeScriptType = `${typeScriptType}[]`;
        }
        
        content += `  ${field.name}${field.isRequired ? '' : '?'}: ${typeScriptType};\n`;
      }
      
      content += '}\n\n';
    }
    
    // Génération des types d'entrée pour les opérations de création et de mise à jour
    for (const model of this.schema.models) {
      content += `export type ${model.name}CreateInput = Prisma.${model.name}CreateInput;\n`;
      content += `export type ${model.name}UpdateInput = Prisma.${model.name}UpdateInput;\n`;
      content += `export type ${model.name}WhereInput = Prisma.${model.name}WhereInput;\n`;
      content += `export type ${model.name}WhereUniqueInput = Prisma.${model.name}WhereUniqueInput;\n\n`;
    }
    
    await fs.writeFile(outputPath, content, 'utf8');
    this.logger.info(`✅ Types générés: ${outputPath}`);
  }

  /**
   * Génère les DTO NestJS pour chaque modèle
   */
  private async generateNestJSDtos(): Promise<void> {
    if (!this.options.nestjsDir) {
      this.logger.warn('⚠️ Pas de dossier NestJS spécifié pour les DTOs - génération ignorée');
      return;
    }
    
    this.logger.info('📦 Génération des DTOs NestJS...');
    
    // Générer un DTO pour chaque modèle
    for (const model of this.schema.models) {
      const modelDir = path.join(this.options.nestjsDir, paramCase(model.name));
      await fs.mkdir(modelDir, { recursive: true });
      
      // Dossier pour les DTOs
      const dtoDir = path.join(modelDir, 'dto');
      await fs.mkdir(dtoDir, { recursive: true });
      
      // Génération des DTOs
      await this.generateCreateDto(model, dtoDir);
      await this.generateUpdateDto(model, dtoDir);
      await this.generateResponseDto(model, dtoDir);
      await this.generateFindAllDto(model, dtoDir);
      await this.generateFindOneDto(model, dtoDir);
    }
    
    this.logger.info(`✅ DTOs NestJS générés dans: ${this.options.nestjsDir}`);
  }

  /**
   * Génère le DTO de création pour un modèle
   */
  private async generateCreateDto(model: PrismaModel, dtoDir: string): Promise<void> {
    const className = `Create${model.name}Dto`;
    const filePath = path.join(dtoDir, `create-${paramCase(model.name)}.dto.ts`);
    
    let content = `import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, IsNumber, IsBoolean, IsDate, IsOptional, 
  IsEnum, ValidateNested, IsArray, IsUUID, 
  IsEmail, MinLength, MaxLength, Min, Max
} from 'class-validator';\n`;
    
    // Importer les énumérations si nécessaire
    const enumsUsed = new Set<string>();
    
    for (const field of model.fields) {
      if (this.isEnum(field.type)) {
        enumsUsed.add(field.type);
      }
    }
    
    if (enumsUsed.size > 0) {
      content += `import { ${Array.from(enumsUsed).join(', ')} } from '../../prisma/prisma-types';\n`;
    }
    
    content += `\n/**
 * DTO pour la création d'un(e) ${model.name}
 */
export class ${className} {\n`;
    
    for (const field of model.fields) {
      // Ignorer les champs ID autogénérés, les champs de relation et les champs avec valeur par défaut
      if (field.isId && field.hasDefaultValue) {
        continue;
      }
      
      // Ignorer les objets de relation complexes
      if (!this.isPrimitiveType(field.type) && !this.isEnum(field.type) && !field.relationName) {
        continue;
      }
      
      // Documentation
      if (field.documentation) {
        content += `  /**\n   * ${field.documentation}\n   */\n`;
      }
      
      // Décorateur Swagger
      content += `  @ApiProperty({\n`;
      content += `    description: '${field.documentation || `Le champ ${field.name}`}',\n`;
      content += `    required: ${field.isRequired},\n`;
      
      if (field.isList) {
        content += `    type: [${this.getSwaggerType(field.type)}],\n`;
        content += `    isArray: true,\n`;
      } else {
        content += `    type: ${this.getSwaggerType(field.type)},\n`;
      }
      
      content += `  })\n`;
      
      // Décorateurs de validation
      const validationDecorators = this.getValidationDecorators(field);
      for (const decorator of validationDecorators) {
        content += `  ${decorator}\n`;
      }
      
      // Définition du champ
      const typeScriptType = this.getPrismaToTypeScriptType(field.type);
      const fieldType = field.isList ? `${typeScriptType}[]` : typeScriptType;
      
      content += `  ${field.name}${field.isRequired ? '' : '?'}: ${fieldType};\n\n`;
    }
    
    content += `}\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère le DTO de mise à jour pour un modèle
   */
  private async generateUpdateDto(model: PrismaModel, dtoDir: string): Promise<void> {
    const className = `Update${model.name}Dto`;
    const filePath = path.join(dtoDir, `update-${paramCase(model.name)}.dto.ts`);
    
    let content = `import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Create${model.name}Dto } from './create-${paramCase(model.name)}.dto';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * DTO pour la mise à jour d'un(e) ${model.name}
 */
export class ${className} extends PartialType(Create${model.name}Dto) {
  @ApiProperty({
    description: 'Identifiant unique',
    required: true,
  })
  @IsUUID(4)
  id: string;
}\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère le DTO de réponse pour un modèle
   */
  private async generateResponseDto(model: PrismaModel, dtoDir: string): Promise<void> {
    const className = `${model.name}ResponseDto`;
    const filePath = path.join(dtoDir, `${paramCase(model.name)}-response.dto.ts`);
    
    let content = `import { ApiProperty } from '@nestjs/swagger';
`;
    
    // Importer les énumérations si nécessaire
    const enumsUsed = new Set<string>();
    
    for (const field of model.fields) {
      if (this.isEnum(field.type)) {
        enumsUsed.add(field.type);
      }
    }
    
    if (enumsUsed.size > 0) {
      content += `import { ${Array.from(enumsUsed).join(', ')} } from '../../prisma/prisma-types';\n`;
    }
    
    content += `\n/**
 * DTO pour la réponse d'un(e) ${model.name}
 */
export class ${className} {\n`;
    
    // Ajouter un champ pour chaque propriété du modèle
    for (const field of model.fields) {
      // Documentation
      if (field.documentation) {
        content += `  /**\n   * ${field.documentation}\n   */\n`;
      }
      
      // Décorateur Swagger
      content += `  @ApiProperty({\n`;
      content += `    description: '${field.documentation || `Le champ ${field.name}`}',\n`;
      
      if (field.isList) {
        content += `    type: [${this.getSwaggerType(field.type)}],\n`;
        content += `    isArray: true,\n`;
      } else {
        content += `    type: ${this.getSwaggerType(field.type)},\n`;
      }
      
      content += `  })\n`;
      
      // Définition du champ
      const typeScriptType = this.getPrismaToTypeScriptType(field.type);
      const fieldType = field.isList ? `${typeScriptType}[]` : typeScriptType;
      
      content += `  ${field.name}: ${fieldType};\n\n`;
    }
    
    content += `}\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère le DTO pour la recherche d'un modèle
   */
  private async generateFindAllDto(model: PrismaModel, dtoDir: string): Promise<void> {
    const className = `Find${model.name}Dto`;
    const filePath = path.join(dtoDir, `find-${paramCase(model.name)}.dto.ts`);
    
    let content = `import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';

/**
 * DTO pour la recherche de ${model.name}
 */
export class ${className} {
  @ApiProperty({
    description: 'Numéro de page',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number = 10;

  @ApiProperty({
    description: 'Champ de tri',
    required: false,
    default: 'createdAt',
    enum: [${model.fields.map(f => `'${f.name}'`).join(', ')}],
  })
  @IsOptional()
  @IsEnum([${model.fields.map(f => `'${f.name}'`).join(', ')}])
  orderBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Direction du tri',
    required: false,
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Terme de recherche',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

`;
    
    // Ajouter des filtres pour les champs pertinents
    for (const field of model.fields) {
      // Ignorer les champs de relation complexes
      if (!this.isPrimitiveType(field.type) && !this.isEnum(field.type)) {
        continue;
      }
      
      // Ajouter un filtre pour les champs pertinents (énumérations, booléens, etc.)
      if (this.isEnum(field.type) || field.type === PrismaScalarType.Boolean) {
        // Documentation
        if (field.documentation) {
          content += `  /**\n   * Filtre par ${field.documentation.toLowerCase()}\n   */\n`;
        }
        
        // Décorateur Swagger
        content += `  @ApiProperty({\n`;
        content += `    description: 'Filtre par ${field.name}',\n`;
        content += `    required: false,\n`;
        
        if (this.isEnum(field.type)) {
          content += `    enum: ${field.type},\n`;
        } else if (field.type === PrismaScalarType.Boolean) {
          content += `    type: Boolean,\n`;
        }
        
        content += `  })\n`;
        content += `  @IsOptional()\n`;
        
        if (this.isEnum(field.type)) {
          content += `  @IsEnum(${field.type})\n`;
        }
        
        const typeScriptType = this.getPrismaToTypeScriptType(field.type);
        content += `  ${field.name}?: ${typeScriptType};\n\n`;
      }
    }
    
    content += `}\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère le DTO pour la recherche d'un modèle par identifiant
   */
  private async generateFindOneDto(model: PrismaModel, dtoDir: string): Promise<void> {
    const className = `${model.name}IdDto`;
    const filePath = path.join(dtoDir, `${paramCase(model.name)}-id.dto.ts`);
    
    const idField = model.fields.find(f => f.isId);
    const idType = idField ? this.getPrismaToTypeScriptType(idField.type) : 'string';
    const isUuid = idType === 'string' && (idField?.defaultValue?.includes('uuid') || idField?.defaultValue?.includes('cuid'));
    
    let content = `import { ApiProperty } from '@nestjs/swagger';\n`;
    
    if (isUuid) {
      content += `import { IsUUID } from 'class-validator';\n`;
    } else if (idType === 'number') {
      content += `import { Type } from 'class-transformer';\n`;
      content += `import { IsInt } from 'class-validator';\n`;
    }
    
    content += `\n/**
 * DTO pour l'identifiant d'un(e) ${model.name}
 */
export class ${className} {\n`;
    
    content += `  @ApiProperty({\n`;
    content += `    description: 'Identifiant unique',\n`;
    content += `    required: true,\n`;
    
    if (idType === 'string') {
      content += `    type: String,\n`;
    } else if (idType === 'number') {
      content += `    type: Number,\n`;
    }
    
    content += `  })\n`;
    
    if (isUuid) {
      content += `  @IsUUID(4)\n`;
    } else if (idType === 'number') {
      content += `  @IsInt()\n`;
      content += `  @Type(() => Number)\n`;
    }
    
    content += `  id: ${idType};\n`;
    content += `}\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère les schémas Zod pour chaque modèle
   */
  private async generateZodSchemas(): Promise<void> {
    if (!this.options.remixDir) {
      this.logger.warn('⚠️ Pas de dossier Remix spécifié pour les schémas Zod - génération ignorée');
      return;
    }
    
    this.logger.info('📦 Génération des schémas Zod...');
    
    // Dossier pour les schémas Zod
    const zodDir = path.join(this.options.remixDir, 'schemas');
    await fs.mkdir(zodDir, { recursive: true });
    
    // Génération d'un fichier pour les énumérations
    if (this.schema.enums.length > 0) {
      await this.generateZodEnums(zodDir);
    }
    
    // Génération d'un schéma pour chaque modèle
    for (const model of this.schema.models) {
      await this.generateZodSchema(model, zodDir);
    }
    
    this.logger.info(`✅ Schémas Zod générés dans: ${zodDir}`);
  }

  /**
   * Génère les énumérations Zod
   */
  private async generateZodEnums(zodDir: string): Promise<void> {
    const filePath = path.join(zodDir, 'enums.ts');
    
    let content = `import { z } from 'zod';\n\n`;
    
    for (const enumObj of this.schema.enums) {
      if (enumObj.documentation) {
        content += `/**\n * ${enumObj.documentation}\n */\n`;
      }
      
      const enumValues = enumObj.values.map(val => `'${val}'`).join(', ');
      content += `export const ${camelCase(enumObj.name)}Schema = z.enum([${enumValues}]);\n`;
      content += `export type ${enumObj.name} = z.infer<typeof ${camelCase(enumObj.name)}Schema>;\n\n`;
    }
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère un schéma Zod pour un modèle
   */
  private async generateZodSchema(model: PrismaModel, zodDir: string): Promise<void> {
    const filePath = path.join(zodDir, `${paramCase(model.name)}.ts`);
    
    let content = `import { z } from 'zod';\n`;
    
    // Importer les énumérations si nécessaire
    const enumsUsed = new Set<string>();
    
    for (const field of model.fields) {
      if (this.isEnum(field.type)) {
        enumsUsed.add(field.type);
      }
    }
    
    if (enumsUsed.size > 0) {
      content += `import { ${Array.from(enumsUsed).map(e => `${camelCase(e)}Schema`).join(', ')} } from './enums';\n`;
    }
    
    content += `\n/**
 * Schéma Zod pour ${model.name}
 */\n`;
    
    // Base schema
    content += `export const ${camelCase(model.name)}Schema = z.object({\n`;
    
    for (const field of model.fields) {
      const zodType = this.getPrismaToZodType(field);
      
      // Documentation
      if (field.documentation) {
        content += `  /** ${field.documentation} */\n`;
      }
      
      content += `  ${field.name}: ${zodType},\n`;
    }
    
    content += `});\n\n`;
    
    // Create schema
    content += `/**\n * Schéma de création pour ${model.name}\n */\n`;
    content += `export const ${camelCase(model.name)}CreateSchema = ${camelCase(model.name)}Schema`;
    
    // Omettre les champs qui ne sont pas nécessaires à la création
    const createOmitFields = model.fields
      .filter(f => (f.isId && f.hasDefaultValue) || 
                   f.hasDefaultValue || 
                   (f.relationType && f.relationType !== RelationType.ManyToOne))
      .map(f => `'${f.name}'`);
    
    if (createOmitFields.length > 0) {
      content += `.omit({\n  ${createOmitFields.join(', ')}\n})`;
    }
    
    // Omettre les champs requis qui ne sont pas obligatoires à la création
    const partialFields = model.fields
      .filter(f => (!f.isRequired || f.hasDefaultValue || f.isId) && 
                   !createOmitFields.includes(`'${f.name}'`))
      .map(f => `'${f.name}'`);
    
    if (partialFields.length > 0) {
      content += `.partial({\n  ${partialFields.join(', ')}\n})`;
    }
    
    content += `;\n\n`;
    
    // Update schema
    content += `/**\n * Schéma de mise à jour pour ${model.name}\n */\n`;
    content += `export const ${camelCase(model.name)}UpdateSchema = ${camelCase(model.name)}CreateSchema.partial();\n\n`;
    
    // Response schema
    content += `/**\n * Schéma de réponse pour ${model.name}\n */\n`;
    content += `export const ${camelCase(model.name)}ResponseSchema = ${camelCase(model.name)}Schema;\n\n`;
    
    // Type exports
    content += `// Types dérivés des schémas\n`;
    content += `export type ${model.name} = z.infer<typeof ${camelCase(model.name)}Schema>;\n`;
    content += `export type ${model.name}Create = z.infer<typeof ${camelCase(model.name)}CreateSchema>;\n`;
    content += `export type ${model.name}Update = z.infer<typeof ${camelCase(model.name)}UpdateSchema>;\n`;
    content += `export type ${model.name}Response = z.infer<typeof ${camelCase(model.name)}ResponseSchema>;\n`;
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Génère les mappers pour la conversion des anciens modèles vers les nouveaux
   */
  private async generateEntityMappers(): Promise<void> {
    if (!this.options.nestjsDir) {
      this.logger.warn('⚠️ Pas de dossier NestJS spécifié pour les mappers - génération ignorée');
      return;
    }
    
    this.logger.info('📦 Génération des mappers d\'entités...');
    
    // Générer les mappers pour chaque modèle
    for (const model of this.schema.models) {
      // Nom de fichier basé sur le nom du modèle
      const fileName = `${paramCase(model.name)}.mapper.ts`;
      const modelDir = path.join(this.options.nestjsDir, paramCase(model.name));
      await fs.mkdir(modelDir, { recursive: true });
      
      // Chemin complet du fichier
      const filePath = path.join(modelDir, fileName);
      
      // Contenu du mapper
      let content = `import { Injectable } from '@nestjs/common';
import { ${model.name} } from '@prisma/client';
import { ${model.name}ResponseDto } from './dto/${paramCase(model.name)}-response.dto';

/**
 * Service de mapping pour l'entité ${model.name}
 */
@Injectable()
export class ${model.name}Mapper {
  /**
   * Convertit une entité ${model.name} en DTO de réponse
   */
  toDto(entity: ${model.name}): ${model.name}ResponseDto {
    const dto = new ${model.name}ResponseDto();
    
`;
      
      // Mapper chaque champ
      for (const field of model.fields) {
        content += `    dto.${field.name} = entity.${field.name};\n`;
      }
      
      content += `    
    return dto;
  }

  /**
   * Convertit une liste d'entités ${model.name} en DTOs de réponse
   */
  toDtoList(entities: ${model.name}[]): ${model.name}ResponseDto[] {
    return entities.map(entity => this.toDto(entity));
  }

  /**
   * Convertit un ancien format (MySQL) vers le nouveau format (Prisma)
   * À adapter selon votre ancien modèle de données
   */
  fromLegacy(legacyData: any): Partial<${model.name}> {
    // TODO: Implémenter la conversion de l'ancien modèle
    const entity: Partial<${model.name}> = {
`;
      
      // Suggérer des mappings pour les champs
      for (const field of model.fields) {
        // Si le champ a un dbName, suggérer un mapping avec l'ancien nom
        if (field.dbName) {
          content += `      // Mapping suggéré: ancien '${field.dbName}' -> nouveau '${field.name}'\n`;
          content += `      ${field.name}: legacyData.${field.dbName},\n`;
        } else {
          // Sinon, suggérer un mapping avec le même nom
          content += `      ${field.name}: legacyData.${field.name},\n`;
        }
      }
      
      content += `    };
    
    return entity;
  }
}\n`;
      
      await fs.writeFile(filePath, content, 'utf8');
    }
    
    this.logger.info(`✅ Mappers d'entités générés`);
  }

  /**
   * Convertit un type Prisma en type TypeScript
   */
  private getPrismaToTypeScriptType(prismaType: string): string {
    switch (prismaType) {
      case PrismaScalarType.String:
        return 'string';
      case PrismaScalarType.Int:
      case PrismaScalarType.Float:
      case PrismaScalarType.Decimal:
        return 'number';
      case PrismaScalarType.Boolean:
        return 'boolean';
      case PrismaScalarType.DateTime:
        return 'Date';
      case PrismaScalarType.Json:
        return 'any';
      case PrismaScalarType.BigInt:
        return 'bigint';
      case PrismaScalarType.Bytes:
        return 'Buffer';
      default:
        // Si ce n'est pas un type scalaire, c'est probablement un type personnalisé ou une énumération
        return prismaType;
    }
  }

  /**
   * Retourne le type Swagger correspondant à un type Prisma
   */
  private getSwaggerType(prismaType: string): string {
    switch (prismaType) {
      case PrismaScalarType.String:
        return 'String';
      case PrismaScalarType.Int:
      case PrismaScalarType.Float:
      case PrismaScalarType.Decimal:
        return 'Number';
      case PrismaScalarType.Boolean:
        return 'Boolean';
      case PrismaScalarType.DateTime:
        return 'Date';
      case PrismaScalarType.Json:
        return 'Object';
      case PrismaScalarType.BigInt:
        return 'String';
      case PrismaScalarType.Bytes:
        return 'String';
      default:
        // Si c'est une énumération, utiliser String
        if (this.isEnum(prismaType)) {
          return 'String';
        }
        // Sinon c'est un type personnalisé
        return prismaType;
    }
  }

  /**
   * Obtient les décorateurs de validation pour un champ
   */
  private getValidationDecorators(field: PrismaField): string[] {
    const decorators: string[] = [];
    
    // Décorateur pour les champs optionnels
    if (!field.isRequired) {
      decorators.push('@IsOptional()');
    }
    
    // Décorateurs spécifiques au type
    switch (field.type) {
      case PrismaScalarType.String:
        decorators.push('@IsString()');
        break;
      case PrismaScalarType.Int:
        decorators.push('@IsInt()');
        break;
      case PrismaScalarType.Float:
      case PrismaScalarType.Decimal:
        decorators.push('@IsNumber()');
        break;
      case PrismaScalarType.Boolean:
        decorators.push('@IsBoolean()');
        break;
      case PrismaScalarType.DateTime:
        decorators.push('@IsDate()');
        decorators.push('@Type(() => Date)');
        break;
      case PrismaScalarType.Json:
        // Pas de validation spécifique pour JSON
        break;
      default:
        // Vérifier si c'est une énumération
        if (this.isEnum(field.type)) {
          decorators.push(`@IsEnum(${field.type})`);
        }
        break;
    }
    
    // Décorateurs pour les listes
    if (field.isList) {
      decorators.push('@IsArray()');
    }
    
    return decorators;
  }

  /**
   * Transforme un champ Prisma en type Zod
   */
  private getPrismaToZodType(field: PrismaField): string {
    let zodType = '';
    
    // Type de base selon le type Prisma
    switch (field.type) {
      case PrismaScalarType.String:
        zodType = 'z.string()';
        break;
      case PrismaScalarType.Int:
        zodType = 'z.number().int()';
        break;
      case PrismaScalarType.Float:
      case PrismaScalarType.Decimal:
        zodType = 'z.number()';
        break;
      case PrismaScalarType.Boolean:
        zodType = 'z.boolean()';
        break;
      case PrismaScalarType.DateTime:
        zodType = 'z.date()';
        break;
      case PrismaScalarType.Json:
        zodType = 'z.any()';
        break;
      case PrismaScalarType.BigInt:
        zodType = 'z.bigint()';
        break;
      default:
        // Vérifier si c'est une énumération
        if (this.isEnum(field.type)) {
          zodType = `${camelCase(field.type)}Schema`;
        } else {
          // Supposer que c'est un type personnalisé ou une relation
          zodType = `z.any()`;
        }
        break;
    }
    
    // Gérer les listes
    if (field.isList) {
      zodType = `z.array(${zodType})`;
    }
    
    // Gérer les champs optionnels
    if (!field.isRequired) {
      zodType = `${zodType}.optional()`;
    }
    
    // Gérer les valeurs par défaut
    if (field.hasDefaultValue) {
      const defaultValue = field.defaultValue;
      if (defaultValue !== undefined) {
        // Ne pas ajouter la valeur par défaut si c'est une fonction comme uuid()
        if (!defaultValue.includes('(')) {
          zodType = `${zodType}.default(${defaultValue})`;
        }
      }
    }
    
    return zodType;
  }

  /**
   * Vérifie si un type est une énumération
   */
  private isEnum(typeName: string): boolean {
    return this.schema.enums.some(e => e.name === typeName);
  }

  /**
   * Vérifie si un type est primitif
   */
  private isPrimitiveType(typeName: string): boolean {
    return Object.values(PrismaScalarType).includes(typeName as PrismaScalarType) || this.isEnum(typeName);
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Analyse des arguments de ligne de commande
  const args = minimist(process.argv.slice(2));
  
  if (!args.schemaPath) {
    console.error('❌ Erreur: Le paramètre --schemaPath est requis.');
    console.log('Utilisation: node prisma-analyzer.ts --schemaPath=/chemin/vers/schema.prisma [--outputDir=./] [--nestjsDir=./] [--remixDir=./]');
    process.exit(1);
  }
  
  const options: CliOptions = {
    schemaPath: args.schemaPath,
    outputDir: args.outputDir,
    nestjsDir: args.nestjsDir,
    remixDir: args.remixDir,
    generateTypes: args.generateTypes !== 'false',
    generateDtos: args.generateDtos !== 'false',
    generateZod: args.generateZod !== 'false',
    generateMappers: args.generateMappers !== 'false'
  };
  
  console.log(`🔍 Analyse du schéma Prisma: ${options.schemaPath}`);
  
  try {
    const analyzer = new PrismaAnalyzer(options);
    await analyzer.analyze();
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  }
}

// Exécution de la fonction principale
if (require.main === module) {
  main();
}

// Export pour les tests et l'utilisation comme module
export { PrismaAnalyzer };