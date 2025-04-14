import fs from 'fs';
import path from 'path';
import { PhpAnalysisResult, AgentResult, MigrationConfig, DataStructure } from '../types';
import { analyzePhpFile } from '../analysis/php-analyzer';

/**
 * Agent de génération NestJS à partir de fichiers PHP
 * Responsable de la génération de contrôleurs, services et DTOs NestJS
 */
export class NestJSGenerator {
  constructor(private config: MigrationConfig) {}

  /**
   * Génère les composants NestJS à partir d'un fichier PHP
   * @param sourceFilePath Chemin vers le fichier PHP source
   * @param destinationPath Dossier de destination pour les fichiers NestJS générés
   */
  async generateFromPhp(sourceFilePath: string, destinationPath: string): Promise<AgentResult> {
    try {
      console.log(`[NestJSGenerator] Analyse du fichier PHP : ${sourceFilePath}`);
      
      // 1. Analyser le fichier PHP
      const analysisResult = await analyzePhpFile(sourceFilePath);
      
      // 2. Extraire les structures de données
      const dataStructures = await this.extractDataStructures(sourceFilePath, analysisResult);
      
      // 3. Générer les composants NestJS
      const nestComponents = await this.generateNestJSComponents(
        path.basename(sourceFilePath, '.php'),
        dataStructures,
        analysisResult
      );
      
      // 4. Écrire les fichiers générés
      await this.writeNestJSFiles(nestComponents, destinationPath);
      
      // 5. Générer un fragment de schéma Prisma
      const prismaSchema = await this.generatePrismaSchema(dataStructures, analysisResult);
      
      // 6. Générer un rapport d'audit
      const auditReport = this.generateAuditReport(sourceFilePath, nestComponents, prismaSchema);
      
      return {
        success: true,
        sourceFile: sourceFilePath,
        generatedFiles: Object.keys(nestComponents),
        auditReport
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
   * Extrait les structures de données du fichier PHP
   */
  private async extractDataStructures(sourceFilePath: string, analysisResult: PhpAnalysisResult): Promise<DataStructure> {
    const { sqlQueries, variables } = analysisResult;
    const fileName = path.basename(sourceFilePath, '.php');
    
    // Détecter la table principale utilisée dans le fichier
    const mainTable = this.detectMainTable(sqlQueries);
    
    // Extraire les champs à partir des requêtes SQL
    const fields = this.extractFieldsFromQueries(sqlQueries);
    
    // Détecter les relations entre tables
    const relations = this.detectRelations(sqlQueries);
    
    return {
      name: this.toCamelCase(fileName),
      tableName: mainTable || this.toSnakeCase(fileName),
      fields,
      relations
    };
  }

  /**
   * Détecte la table principale utilisée dans les requêtes SQL
   */
  private detectMainTable(sqlQueries: any[]): string | null {
    // Compter les occurrences de chaque table
    const tableCounts = new Map<string, number>();
    
    sqlQueries.forEach(query => {
      query.tables.forEach((table: string) => {
        tableCounts.set(table, (tableCounts.get(table) || 0) + 1);
      });
    });
    
    // Trouver la table la plus utilisée
    let mainTable: string | null = null;
    let maxCount = 0;
    
    tableCounts.forEach((count, table) => {
      if (count > maxCount) {
        maxCount = count;
        mainTable = table;
      }
    });
    
    return mainTable;
  }

  /**
   * Extrait les champs à partir des requêtes SQL
   */
  private extractFieldsFromQueries(sqlQueries: any[]): Array<any> {
    const fields: Array<any> = [];
    const fieldMap = new Map<string, any>();
    
    // Analyser les SELECT et les WHERE pour détecter les champs
    sqlQueries.forEach(query => {
      if (query.type === 'SELECT') {
        const selectMatch = query.query.match(/SELECT\s+(.*?)\s+FROM/i);
        if (selectMatch) {
          const selectPart = selectMatch[1];
          if (selectPart !== '*') {
            selectPart.split(',').forEach((column: string) => {
              const trimmedColumn = column.trim().split(' as ')[0].split('.').pop()?.trim();
              if (trimmedColumn && !fieldMap.has(trimmedColumn)) {
                fieldMap.set(trimmedColumn, {
                  name: trimmedColumn,
                  type: this.inferFieldType(trimmedColumn),
                  required: this.isFieldRequired(trimmedColumn)
                });
              }
            });
          }
        }
      }
      
      // Extraire les champs des WHERE
      const whereMatch = query.query.match(/WHERE\s+(.*?)(?:\s+ORDER BY|\s+GROUP BY|\s+LIMIT|$)/i);
      if (whereMatch) {
        const wherePart = whereMatch[1];
        const fieldMatches = wherePart.match(/([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?\s*(?:=|<|>|LIKE|IN)/gi);
        
        if (fieldMatches) {
          fieldMatches.forEach((match: string) => {
            const fieldParts = match.split('.');
            const fieldName = fieldParts.length > 1 ? fieldParts[1].split(/\s+/)[0] : fieldParts[0].split(/\s+/)[0];
            
            if (!fieldMap.has(fieldName)) {
              fieldMap.set(fieldName, {
                name: fieldName,
                type: this.inferFieldType(fieldName),
                required: this.isFieldRequired(fieldName)
              });
            }
          });
        }
      }
    });
    
    // Convertir la map en tableau
    fieldMap.forEach(field => {
      fields.push(field);
    });
    
    // Ajouter id si non présent
    if (!fieldMap.has('id')) {
      fields.unshift({
        name: 'id',
        type: 'number',
        required: true
      });
    }
    
    return fields;
  }

  /**
   * Détecte les relations entre tables à partir des requêtes SQL
   */
  private detectRelations(sqlQueries: any[]): Array<any> {
    const relations: Array<any> = [];
    const relationMap = new Map<string, any>();
    
    // Détecter les JOIN pour trouver les relations
    sqlQueries.forEach(query => {
      const joinMatches = query.query.match(/JOIN\s+([a-zA-Z0-9_]+)\s+(?:AS\s+)?([a-zA-Z0-9_]+)?\s+ON\s+(.*?)(?:\s+(?:LEFT|RIGHT|INNER|JOIN|WHERE|ORDER|GROUP|LIMIT)|$)/gi);
      
      if (joinMatches) {
        joinMatches.forEach((match: string) => {
          const joinMatch = /JOIN\s+([a-zA-Z0-9_]+)\s+(?:AS\s+)?([a-zA-Z0-9_]+)?\s+ON\s+(.*?)(?:\s+(?:LEFT|RIGHT|INNER|JOIN|WHERE|ORDER|GROUP|LIMIT)|$)/i.exec(match);
          
          if (joinMatch) {
            const targetTable = joinMatch[1];
            const onClause = joinMatch[3];
            
            // Détecter le type de relation à partir de la clause ON
            const fkMatch = onClause.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
            
            if (fkMatch) {
              const source = { table: fkMatch[1], field: fkMatch[2] };
              const target = { table: fkMatch[3], field: fkMatch[4] };
              
              const relationType = source.field === 'id' ? 'oneToMany' : target.field === 'id' ? 'manyToOne' : 'manyToMany';
              const relationName = this.toCamelCase(targetTable);
              
              if (!relationMap.has(relationName)) {
                relationMap.set(relationName, {
                  name: relationName,
                  targetTable,
                  type: relationType,
                  joinColumn: source.field === 'id' ? target.field : source.field
                });
              }
            }
          }
        });
      }
    });
    
    // Convertir la map en tableau
    relationMap.forEach(relation => {
      relations.push(relation);
    });
    
    return relations;
  }

  /**
   * Génère les composants NestJS (controller, service, DTOs)
   */
  private async generateNestJSComponents(
    baseName: string,
    dataStructure: DataStructure,
    analysisResult: PhpAnalysisResult
  ) {
    // Créer le nom du module en camelCase pour assurer la cohérence
    const moduleName = this.toCamelCase(baseName);
    
    // Générer le controller
    const controllerContent = this.generateController(moduleName, dataStructure);
    
    // Générer le service
    const serviceContent = this.generateService(moduleName, dataStructure, analysisResult);
    
    // Générer les DTOs
    const dtoContent = this.generateDTOs(moduleName, dataStructure);
    
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
  private generateController(moduleName: string, dataStructure: DataStructure): string {
    const entityName = this.capitalize(moduleName);
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
  private generateService(moduleName: string, dataStructure: DataStructure, analysisResult: PhpAnalysisResult): string {
    const entityName = this.capitalize(moduleName);
    const resourceName = dataStructure.tableName;
    
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
  private generateDTOs(moduleName: string, dataStructure: DataStructure): string {
    const entityName = this.capitalize(moduleName);
    
    const properties = dataStructure.fields.map(field => {
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
  private generateModule(moduleName: string): string {
    const entityName = this.capitalize(moduleName);
    
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
  private async generatePrismaSchema(dataStructure: DataStructure, analysisResult: PhpAnalysisResult): Promise<string> {
    const { tableName, fields, relations } = dataStructure;
    
    const fieldDefinitions = fields.map(field => {
      const { name, type, required } = field;
      const prismaType = this.mapTypeScriptToPrisma(type);
      const constraints = required ? '' : '?';
      
      return `  ${name} ${prismaType}${constraints}`;
    }).join('\n');
    
    const relationDefinitions = relations.map(relation => {
      const { name, targetTable, type, joinColumn } = relation;
      const targetModel = this.capitalize(this.toCamelCase(targetTable));
      
      if (type === 'oneToOne') {
        return `  ${name} ${targetModel}? @relation(fields: [${joinColumn}], references: [id])
  ${joinColumn} Int? @unique`;
      } else if (type === 'oneToMany' || type === 'manyToOne') {
        return `  ${name} ${targetModel}[] @relation("${targetModel}To${this.capitalize(dataStructure.name)}")`;
      } else {
        return `  ${name} ${targetModel}[] @relation("${targetModel}To${this.capitalize(dataStructure.name)}")`;
      }
    }).join('\n\n');
    
    const modelName = this.capitalize(dataStructure.name);
    const prismaSchema = `model ${modelName} {
  id Int @id @default(autoincrement())
${fieldDefinitions}
${relations.length > 0 ? '\n' + relationDefinitions : ''}

  @@map("${tableName}")
}`;
    
    // Écrire le schéma dans un fichier temporaire pour référence
    const schemaDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const schemaPath = path.join(schemaDir, `${dataStructure.name}_${timestamp}.prisma`);
    fs.writeFileSync(schemaPath, prismaSchema);
    
    console.log(`[NestJSGenerator] Schéma Prisma généré : ${schemaPath}`);
    
    return prismaSchema;
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
   * Génère un rapport d'audit pour la migration
   */
  private generateAuditReport(sourceFilePath: string, nestComponents: Record<string, string>, prismaSchema: string) {
    const fileName = path.basename(sourceFilePath, '.php');
    const report = `# Rapport de migration PHP → NestJS pour ${fileName}

## Fichier source
- ${sourceFilePath}

## Fichiers générés
${Object.keys(nestComponents).map(file => `- ${file}`).join('\n')}

## Schéma Prisma généré
\`\`\`prisma
${prismaSchema}
\`\`\`

## Analyse
- **Endpoints générés** : ${this.extractEndpoints(nestComponents)}
- **Validations** : ${this.extractValidations(nestComponents)}
- **Transactions** : ${this.extractTransactions(nestComponents)}

## Recommandations
${this.generateRecommendations(nestComponents, prismaSchema)}
`;
    
    // Écrire le rapport d'audit
    const auditPath = path.join(process.cwd(), 'audit');
    if (!fs.existsSync(auditPath)) {
      fs.mkdirSync(auditPath, { recursive: true });
    }
    
    const auditFilePath = path.join(auditPath, `${fileName}.nestjs.audit.md`);
    fs.writeFileSync(auditFilePath, report);
    
    return {
      path: auditFilePath,
      content: report
    };
  }

  /**
   * Extrait les endpoints générés dans les composants NestJS
   */
  private extractEndpoints(components: Record<string, string>): string {
    const controllerFile = Object.entries(components).find(([name]) => name.endsWith('.controller.ts'));
    if (!controllerFile) return 'Aucun endpoint détecté';
    
    const controllerContent = controllerFile[1];
    const decoratorsMatch = controllerContent.match(/@(Get|Post|Patch|Delete)(?:\(['"](.*?)['"]?\))?/g);
    
    if (!decoratorsMatch) return 'Aucun endpoint détecté';
    
    return decoratorsMatch.map(decorator => {
      const match = decorator.match(/@(Get|Post|Patch|Delete)(?:\(['"](.*?)['"]?\))?/);
      if (match) {
        const method = match[1];
        const path = match[2] || '';
        return `${method} /${path}`;
      }
      return '';
    }).filter(Boolean).join(', ');
  }

  /**
   * Extrait les validations générées dans les composants NestJS
   */
  private extractValidations(components: Record<string, string>): string {
    const dtoFile = Object.entries(components).find(([name]) => name.endsWith('.dto.ts'));
    if (!dtoFile) return 'Aucune validation détectée';
    
    const dtoContent = dtoFile[1];
    const validationMatch = dtoContent.match(/@Is[a-zA-Z]+\(\)/g);
    
    if (!validationMatch) return 'Aucune validation détectée';
    
    const uniqueValidations = [...new Set(validationMatch)];
    return uniqueValidations.map(validation => validation.replace(/@/, '').replace(/\(\)/, '')).join(', ');
  }

  /**
   * Extrait les transactions générées dans les composants NestJS
   */
  private extractTransactions(components: Record<string, string>): string {
    const serviceFile = Object.entries(components).find(([name]) => name.endsWith('.service.ts'));
    if (!serviceFile) return 'Aucune transaction détectée';
    
    const serviceContent = serviceFile[1];
    return serviceContent.includes('$transaction') ? 'Transactions supportées' : 'Aucune transaction détectée';
  }

  /**
   * Génère des recommandations pour la migration
   */
  private generateRecommendations(components: Record<string, string>, prismaSchema: string): string {
    const recommendations = [];
    
    // Vérifier si des jointures complexes sont nécessaires
    if (prismaSchema.includes('@relation') && !prismaSchema.match(/@relation\([^)]*"[^"]*"[^)]*\)/g)) {
      recommendations.push('- Vérifier les relations entre les modèles, certaines peuvent nécessiter une configuration plus avancée');
    }
    
    // Vérifier l'utilisation des transactions
    const serviceFile = Object.entries(components).find(([name]) => name.endsWith('.service.ts'));
    if (serviceFile && !serviceFile[1].includes('$transaction') && prismaSchema.includes('@relation')) {
      recommendations.push('- Considérer l\'utilisation de transactions pour les opérations impliquant plusieurs modèles');
    }
    
    // Vérifier les validations
    const dtoFile = Object.entries(components).find(([name]) => name.endsWith('.dto.ts'));
    if (dtoFile && !dtoFile[1].match(/@(Min|Max|IsEmail|IsUrl|IsDate)\(/g)) {
      recommendations.push('- Ajouter des validations plus spécifiques dans les DTOs pour renforcer la sécurité des données');
    }
    
    return recommendations.length ? recommendations.join('\n') : '- Aucune recommandation particulière';
  }

  /**
   * Infère le type d'un champ à partir de son nom
   */
  private inferFieldType(fieldName: string): string {
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName === 'id' || lowerName.endsWith('_id') || lowerName.endsWith('id')) {
      return 'number';
    }
    
    if (lowerName.includes('date') || lowerName.includes('created_at') || lowerName.includes('updated_at')) {
      return 'date';
    }
    
    if (lowerName.includes('price') || lowerName.includes('prix') || lowerName.includes('cost') || 
        lowerName.includes('amount') || lowerName.includes('montant') || lowerName.includes('total')) {
      return 'number';
    }
    
    if (lowerName.includes('is_') || lowerName.includes('has_') || lowerName.includes('active') || 
        lowerName.includes('enabled') || lowerName.includes('visible')) {
      return 'boolean';
    }
    
    if (lowerName.includes('count') || lowerName.includes('nombre') || lowerName.includes('qty') || 
        lowerName.includes('quantity') || lowerName.includes('quantite') || lowerName.includes('stock')) {
      return 'number';
    }
    
    return 'string';
  }

  /**
   * Détermine si un champ est obligatoire en fonction de son nom
   */
  private isFieldRequired(fieldName: string): boolean {
    const nonRequiredPrefixes = ['optional_', 'opt_'];
    const nonRequiredSuffixes = ['_optional', '_opt'];
    
    for (const prefix of nonRequiredPrefixes) {
      if (fieldName.toLowerCase().startsWith(prefix)) {
        return false;
      }
    }
    
    for (const suffix of nonRequiredSuffixes) {
      if (fieldName.toLowerCase().endsWith(suffix)) {
        return false;
      }
    }
    
    // Certains champs sont généralement optionnels
    const optionalFields = ['description', 'notes', 'comment', 'image', 'photo', 'avatar', 'url', 'link'];
    for (const optField of optionalFields) {
      if (fieldName.toLowerCase().includes(optField)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Convertit camelCase en snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  /**
   * Convertit snake_case en camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^([A-Z])/, (_, char) => char.toLowerCase());
  }

  /**
   * Met en majuscule la première lettre d'une chaîne
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Mappe les types PHP/TypeScript vers Prisma
   */
  private mapTypeScriptToPrisma(type: string): string {
    switch (type.toLowerCase()) {
      case 'number':
      case 'integer':
        return 'Int';
      case 'float':
      case 'double':
      case 'decimal':
        return 'Float';
      case 'boolean':
        return 'Boolean';
      case 'date':
      case 'datetime':
        return 'DateTime';
      case 'json':
      case 'object':
        return 'Json';
      case 'string':
      default:
        return 'String';
    }
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

export default NestJSGenerator;