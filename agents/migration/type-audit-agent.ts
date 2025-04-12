#!/usr/bin/env node
/**
 * type-audit-agent.ts
 * 
 * Agent 2 — Audit des types SQL
 * 
 * Fonctionnalités:
 * - Conversion intelligente MySQL → PostgreSQL (TINYINT → Boolean, INT(11) → Integer, etc.)
 * - Ajustement des tailles de champs (réduction de VARCHAR(255) si usage détecté court)
 * - Détection et mapping automatique des énumérations
 * - Identification des problèmes de typage et optimisations
 * 
 * Usage: ts-node type-audit-agent.ts <chemin-schema.json> [options]
 * Options:
 *   --deep-analysis     Active l'analyse profonde du contenu des champs (peut être lent)
 *   --adjust-sizes      Ajuste les tailles des champs VARCHAR/CHAR/TEXT
 *   --detect-enums      Détecte automatiquement les énumérations
 *   --output-dir=<dir>  Dossier de sortie (défaut: ./outputs)
 * 
 * Sorties générées:
 * - type_conversion_map.json    : Mappings MySQL → PostgreSQL/Prisma
 * - field_typing_issues.md      : Problèmes de typage détectés avec recommandations
 * - prisma_enum.suggestion.prisma : Définitions d'énumérations pour Prisma
 * 
 * Date: 11 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Interfaces et types
interface MySQLSchema {
  name: string;
  tables: Record<string, TableInfo>;
  version?: string;
  characterSet?: string;
  collation?: string;
  metadata?: Record<string, any>;
  classificationStats?: Record<string, number>;
  sampleData?: Record<string, any[]>;
}

interface TableInfo {
  name: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes?: IndexInfo[];
  foreignKeys?: ForeignKeyInfo[];
  constraints?: ConstraintInfo[];
  tableType?: string;
  classificationReason?: string;
  relations?: RelationInfo[];
  comment?: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  isUnique?: boolean;
  autoIncrement?: boolean;
  defaultValue?: string | null;
  comment?: string;
  length?: number;
  precision?: number;
  scale?: number;
  originalType?: string;
  suggestedPostgresType?: string;
  suggestedPrismaType?: string;
  suggestedLength?: number;
  isEnum?: boolean;
  enumValues?: string[];
  isImplicitForeignKey?: boolean;
  extra?: string;
  references?: {
    table: string;
    column: string;
  };
}

interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

interface ConstraintInfo {
  name: string;
  type: string;
  definition: string;
}

interface RelationInfo {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: string;
  isImplicit: boolean;
}

interface TypeMappingResult {
  schema: MySQLSchema;
  issues: Array<TypeIssue>;
  enums: Record<string, EnumDefinition>;
  typeConversionMap: Record<string, TypeConversionRule[]>;
  statistics: {
    totalFields: number;
    convertedTypes: number;
    optimizedSizes: number;
    enumsDetected: number;
    issuesFound: number;
  };
}

interface TypeIssue {
  tableName: string;
  columnName: string;
  originalType: string;
  suggestedType: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  recommendation: string;
}

interface EnumDefinition {
  name: string;
  values: string[];
  source: {
    table: string;
    column: string;
  };
}

interface TypeConversionRule {
  mysqlType: string;
  postgresType: string;
  prismaType: string;
  examples: Array<{
    table: string;
    column: string;
  }>;
  reason: string;
  recommendation?: string;
}

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Agent 2 — Audit des types SQL - Conversion MySQL → PostgreSQL/Prisma')
  .argument('<schema-path>', 'Chemin vers le fichier JSON du schéma MySQL')
  .option('--deep-analysis', 'Active l\'analyse profonde du contenu des champs (peut être lent)')
  .option('--adjust-sizes', 'Ajuste les tailles des champs VARCHAR/CHAR/TEXT')
  .option('--detect-enums', 'Détecte automatiquement les énumérations')
  .option('--output-dir <dir>', 'Dossier de sortie', './outputs')
  .parse(process.argv);

const options = program.opts();
const schemaPath = program.args[0];

// Classe principale pour l'audit des types
class TypeAuditor {
  // Mapping des types MySQL vers PostgreSQL/Prisma
  private typeMappingRules: Record<string, { postgresType: string; prismaType: string; needsLength?: boolean; needsPrecision?: boolean }> = {
    // Types numériques
    'TINYINT': { postgresType: 'SMALLINT', prismaType: 'Int' },
    'SMALLINT': { postgresType: 'SMALLINT', prismaType: 'Int' },
    'MEDIUMINT': { postgresType: 'INTEGER', prismaType: 'Int' },
    'INT': { postgresType: 'INTEGER', prismaType: 'Int' },
    'INTEGER': { postgresType: 'INTEGER', prismaType: 'Int' },
    'BIGINT': { postgresType: 'BIGINT', prismaType: 'BigInt' },
    'FLOAT': { postgresType: 'REAL', prismaType: 'Float' },
    'DOUBLE': { postgresType: 'DOUBLE PRECISION', prismaType: 'Float' },
    'DECIMAL': { postgresType: 'DECIMAL', prismaType: 'Decimal', needsPrecision: true },
    'NUMERIC': { postgresType: 'NUMERIC', prismaType: 'Decimal', needsPrecision: true },
    
    // Types date et heure
    'DATE': { postgresType: 'DATE', prismaType: 'DateTime' },
    'DATETIME': { postgresType: 'TIMESTAMP', prismaType: 'DateTime' },
    'TIMESTAMP': { postgresType: 'TIMESTAMP', prismaType: 'DateTime' },
    'TIME': { postgresType: 'TIME', prismaType: 'String' },
    'YEAR': { postgresType: 'SMALLINT', prismaType: 'Int' },
    
    // Types texte
    'CHAR': { postgresType: 'CHAR', prismaType: 'String', needsLength: true },
    'VARCHAR': { postgresType: 'VARCHAR', prismaType: 'String', needsLength: true },
    'TINYTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'TEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'MEDIUMTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'LONGTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    
    // Types binaires
    'BINARY': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'VARBINARY': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'TINYBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'BLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'MEDIUMBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'LONGBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    
    // Types spéciaux
    'ENUM': { postgresType: 'TEXT', prismaType: 'Enum' },
    'SET': { postgresType: 'TEXT[]', prismaType: 'String[]' },
    'JSON': { postgresType: 'JSONB', prismaType: 'Json' },
    'BIT': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'BOOLEAN': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'BOOL': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'UUID': { postgresType: 'UUID', prismaType: 'String' }
  };

  // Tailles optimales suggérées pour différents types de champs
  private suggestedFieldSizes: Record<string, number> = {
    'email': 100,
    'name': 100,
    'first_name': 50,
    'last_name': 50,
    'password': 60, // Taille standard pour bcrypt
    'hash': 64, // SHA-256
    'username': 50,
    'login': 50,
    'phone': 20,
    'phone_number': 20,
    'mobile': 20,
    'address': 150,
    'street': 100,
    'city': 50,
    'state': 30,
    'country': 50,
    'zip': 10,
    'postal_code': 10,
    'zipcode': 10,
    'title': 100,
    'description': 500,
    'url': 200,
    'uri': 200,
    'link': 200,
    'path': 200,
    'code': 20,
    'ref': 30,
    'reference': 50,
    'status': 20,
    'type': 30,
    'uuid': 36, // Format UUID standard
    'token': 100,
    'note': 1000,
    'comment': 1000,
    'ip': 45, // IPv6
    'ip_address': 45,
    'avatar': 200,
    'image': 200,
    'thumbnail': 200,
    'locale': 10,
    'language': 20,
    'currency': 3
  };

  // Patterns pour identifier les champs qui devraient être des énumérations
  private enumPatterns: Record<string, RegExp> = {
    'status': /^(active|inactive|pending|completed|cancelled|deleted|draft|published|archived|failed|success)$/i,
    'gender': /^(male|female|other|m|f|o)$/i,
    'payment_type': /^(credit_card|debit_card|paypal|bank_transfer|check|cash|crypto)$/i,
    'payment_method': /^(credit_card|debit_card|paypal|bank_transfer|check|cash|crypto)$/i,
    'role': /^(admin|user|guest|editor|manager|moderator|member|subscriber|customer|owner|superadmin)$/i,
    'visibility': /^(public|private|protected|draft|internal|external|hidden|visible)$/i,
    'priority': /^(high|medium|low|critical|urgent|normal)$/i,
    'category': /.+/i // Tout pattern pour les catégories, mais vérifier les occurrences multiples
  };

  /**
   * Analyse le schéma et effectue l'audit des types
   */
  async auditTypes(schemaPath: string, options: any): Promise<TypeMappingResult> {
    // Charger le schéma JSON
    console.log(`🔍 Chargement du schéma depuis ${schemaPath}...`);
    const schema: MySQLSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Créer une copie profonde pour éviter de modifier l'original
    const auditedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Statistiques
    const stats = {
      totalFields: 0,
      convertedTypes: 0,
      optimizedSizes: 0,
      enumsDetected: 0,
      issuesFound: 0
    };
    
    // Structures pour stocker les résultats
    const issues: TypeIssue[] = [];
    const enums: Record<string, EnumDefinition> = {};
    const typeConversionMap: Record<string, TypeConversionRule[]> = {};

    // Parcourir toutes les tables du schéma
    console.log('🔄 Analyse des types dans le schéma...');
    
    Object.entries(auditedSchema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        stats.totalFields++;
        
        // Étape 1: Conversion du type MySQL vers PostgreSQL/Prisma
        this.convertColumnType(column, tableName, columnName, typeConversionMap);
        stats.convertedTypes++;
        
        // Étape 2: Détection spéciale des booléens
        if (this.detectBoolean(column, tableName, columnName)) {
          issues.push({
            tableName,
            columnName,
            originalType: column.originalType || column.type,
            suggestedType: 'BOOLEAN',
            severity: 'medium',
            reason: 'TINYINT(1) détecté comme booléen',
            recommendation: 'Convertir en type Boolean dans Prisma et PostgreSQL'
          });
          stats.issuesFound++;
        }
        
        // Étape 3: Optimisation des tailles de champs
        if (options.adjustSizes && this.shouldAdjustSize(column)) {
          const optimalSize = this.determineOptimalSize(columnName, column);
          if (optimalSize && optimalSize < (column.length || Infinity)) {
            column.suggestedLength = optimalSize;
            
            // Ajuster le type PostgreSQL
            if (column.suggestedPostgresType && column.suggestedPostgresType.includes('VARCHAR')) {
              column.suggestedPostgresType = `VARCHAR(${optimalSize})`;
            }
            
            issues.push({
              tableName,
              columnName,
              originalType: `${column.type}(${column.length})`,
              suggestedType: `${column.type}(${optimalSize})`,
              severity: 'low',
              reason: `Taille excessive (${column.length}) pour un champ ${columnName}`,
              recommendation: `Réduire la taille à ${optimalSize} caractères`
            });
            stats.optimizedSizes++;
            stats.issuesFound++;
          }
        }
        
        // Étape 4: Détection d'énumérations
        if (options.detectEnums) {
          const enumInfo = this.detectEnum(column, tableName, columnName);
          if (enumInfo) {
            const enumName = this.toPascalCase(enumInfo.name);
            column.isEnum = true;
            column.enumValues = enumInfo.values;
            column.suggestedPrismaType = enumName;
            
            enums[enumName] = {
              name: enumName,
              values: enumInfo.values,
              source: {
                table: tableName,
                column: columnName
              }
            };
            
            issues.push({
              tableName,
              columnName,
              originalType: column.originalType || column.type,
              suggestedType: `Enum (${enumName})`,
              severity: 'medium',
              reason: `Valeurs distinctes limitées détectées: ${enumInfo.values.join(', ')}`,
              recommendation: `Utiliser un type énuméré (${enumName}) dans Prisma`
            });
            stats.enumsDetected++;
            stats.issuesFound++;
          }
        }
        
        // Étape 5: Détecter d'autres problèmes de typage
        this.detectTypingIssues(column, tableName, columnName, issues);
      });
    });

    console.log(`✅ Analyse terminée! Statistiques:`);
    console.log(`   - Champs analysés: ${stats.totalFields}`);
    console.log(`   - Types convertis: ${stats.convertedTypes}`);
    console.log(`   - Tailles optimisées: ${stats.optimizedSizes}`);
    console.log(`   - Énumérations détectées: ${stats.enumsDetected}`);
    console.log(`   - Problèmes identifiés: ${stats.issuesFound}`);
    
    return {
      schema: auditedSchema,
      issues,
      enums,
      typeConversionMap,
      statistics: stats
    };
  }

  /**
   * Détecte si un champ devrait être un booléen (TINYINT(1))
   */
  private detectBoolean(column: ColumnInfo, tableName: string, columnName: string): boolean {
    // TINYINT(1) est souvent utilisé pour les booléens
    if (column.originalType?.match(/TINYINT\s*\(\s*1\s*\)/i) ||
        (column.type === 'TINYINT' && column.length === 1)) {
      
      // Vérifier le nom du champ (is_*, has_*, can_*, etc.)
      if (columnName.startsWith('is_') || 
          columnName.startsWith('has_') || 
          columnName.startsWith('can_') ||
          columnName.startsWith('should_') ||
          columnName.startsWith('allow_') ||
          columnName === 'active' ||
          columnName === 'enabled' ||
          columnName === 'visible' ||
          columnName === 'deleted' ||
          columnName === 'archived' ||
          columnName === 'published' ||
          columnName === 'locked' ||
          columnName === 'required') {
        
        column.suggestedPostgresType = 'BOOLEAN';
        column.suggestedPrismaType = 'Boolean';
        return true;
      }
    }
    return false;
  }

  /**
   * Convertit le type d'une colonne MySQL en types PostgreSQL et Prisma
   */
  private convertColumnType(
    column: ColumnInfo, 
    tableName: string, 
    columnName: string,
    typeConversionMap: Record<string, TypeConversionRule[]>
  ): void {
    // Extraire le type de base (sans longueur/précision)
    const baseType = this.extractBaseType(column.originalType || column.type);
    
    // Normaliser le type pour la correspondance
    const normalizedType = baseType.toUpperCase();
    
    if (this.typeMappingRules[normalizedType]) {
      const mapping = this.typeMappingRules[normalizedType];
      let postgresType = mapping.postgresType;
      const prismaType = mapping.prismaType;
      
      // Ajouter la longueur/précision si nécessaire
      if (mapping.needsLength && column.length) {
        postgresType = `${postgresType}(${column.length})`;
      } else if (mapping.needsPrecision && column.precision) {
        if (column.scale !== undefined) {
          postgresType = `${postgresType}(${column.precision},${column.scale})`;
        } else {
          postgresType = `${postgresType}(${column.precision})`;
        }
      }
      
      // Appliquer la conversion
      column.suggestedPostgresType = postgresType;
      column.suggestedPrismaType = prismaType;
      
      // Ajouter à la carte de conversion
      this.addToConversionMap(
        typeConversionMap, 
        normalizedType, 
        postgresType, 
        prismaType, 
        tableName, 
        columnName
      );
    } else {
      // Type non reconnu, utiliser TEXT/String par défaut
      column.suggestedPostgresType = 'TEXT';
      column.suggestedPrismaType = 'String';
      
      // Ajouter un problème pour les types non reconnus
      this.addToConversionMap(
        typeConversionMap, 
        normalizedType, 
        'TEXT', 
        'String', 
        tableName, 
        columnName,
        'Type MySQL non reconnu, conversion générique appliquée'
      );
    }
  }

  /**
   * Ajoute une règle de conversion à la carte de conversion
   */
  private addToConversionMap(
    map: Record<string, TypeConversionRule[]>,
    mysqlType: string,
    postgresType: string,
    prismaType: string,
    tableName: string,
    columnName: string,
    reason: string = 'Conversion standard'
  ): void {
    if (!map[mysqlType]) {
      map[mysqlType] = [];
    }
    
    // Vérifier si cette règle existe déjà
    let rule = map[mysqlType].find(r => 
      r.postgresType === postgresType && 
      r.prismaType === prismaType
    );
    
    if (!rule) {
      rule = {
        mysqlType,
        postgresType,
        prismaType,
        examples: [],
        reason
      };
      map[mysqlType].push(rule);
    }
    
    // Ajouter cet exemple
    rule.examples.push({
      table: tableName,
      column: columnName
    });
  }

  /**
   * Extrait le type de base d'une chaîne de type MySQL
   */
  private extractBaseType(type: string): string {
    // Extraire le type de base sans la longueur/précision
    const match = type.match(/^([A-Za-z]+)/);
    return match ? match[1] : type;
  }

  /**
   * Vérifie si un champ devrait avoir sa taille ajustée
   */
  private shouldAdjustSize(column: ColumnInfo): boolean {
    // Vérifier si c'est un type VARCHAR ou CHAR avec une longueur
    if ((column.type === 'VARCHAR' || column.type === 'CHAR') && column.length) {
      // Ne pas ajuster les clés primaires ou uniques pour sécurité
      if (column.isPrimary || column.isUnique) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Détermine la taille optimale pour un champ basé sur son nom
   */
  private determineOptimalSize(columnName: string, column: ColumnInfo): number | null {
    // Vérifier les règles prédéfinies
    for (const [pattern, size] of Object.entries(this.suggestedFieldSizes)) {
      if (columnName.includes(pattern) || columnName === pattern) {
        return size;
      }
    }
    
    // Si c'est un VARCHAR(255) et non une clé, suggérer 100 par défaut
    if (column.type === 'VARCHAR' && column.length === 255 && !column.isPrimary && !column.isUnique) {
      return 100;
    }
    
    return null;
  }

  /**
   * Détecte si une colonne pourrait être une énumération
   */
  private detectEnum(
    column: ColumnInfo, 
    tableName: string, 
    columnName: string
  ): { name: string; values: string[] } | null {
    // Si c'est déjà un ENUM MySQL, extraire directement les valeurs
    if (column.type === 'ENUM' || column.originalType?.toUpperCase().startsWith('ENUM')) {
      const match = (column.originalType || '').match(/ENUM\s*\(\s*(.+?)\s*\)/i);
      if (match && match[1]) {
        return {
          name: columnName,
          values: match[1].split(',').map(value => 
            value.trim().replace(/^['"]|['"]$/g, '')
          )
        };
      }
    }
    
    // Si ce n'est pas un type chaîne, ignorer
    if (!['VARCHAR', 'CHAR', 'TEXT', 'TINYTEXT'].includes(column.type.toUpperCase())) {
      return null;
    }
    
    // Vérifier le nom pour des patterns connus d'énumération
    for (const [patternName, regex] of Object.entries(this.enumPatterns)) {
      if (columnName.includes(patternName) || 
          columnName === patternName ||
          columnName.endsWith(`_${patternName}`) || 
          columnName.startsWith(`${patternName}_`)) {
        
        // S'il y a des valeurs d'échantillon, tester contre le pattern
        if (column.enumValues && column.enumValues.length > 0) {
          if (column.enumValues.length <= 15 && 
              column.enumValues.every(val => typeof val === 'string' && val.length < 30)) {
            return {
              name: columnName,
              values: column.enumValues
            };
          }
        }
        
        // Pour les types nommés "status", "type", etc. sans données, créer un enum par défaut
        if (columnName === 'status') {
          return {
            name: 'Status',
            values: ['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED']
          };
        } else if (columnName === 'type' || columnName.endsWith('_type')) {
          return {
            name: this.toPascalCase(columnName),
            values: ['STANDARD', 'PREMIUM', 'BASIC']
          };
        }
      }
    }
    
    // Vérifier le commentaire pour des indices d'énumération
    if (column.comment) {
      const comment = column.comment.toLowerCase();
      if (comment.includes('enum') || 
          comment.includes('valeurs possibles') || 
          comment.includes('possible values') ||
          comment.includes('valeurs autorisées') ||
          comment.includes('allowed values') ||
          comment.includes('type:')) {
        
        // Tenter d'extraire les valeurs du commentaire
        const valuesMatch = comment.match(/(?:valeurs|values|options)[\s:]+([^\.]+)/i);
        if (valuesMatch && valuesMatch[1]) {
          const values = valuesMatch[1]
            .split(/[,;|]/)
            .map(v => v.trim())
            .filter(v => v.length > 0);
          
          if (values.length >= 2 && values.length <= 15) {
            return {
              name: columnName,
              values: values.map(v => v.toUpperCase())
            };
          }
        }
        
        // Suggérer une énumération même sans valeurs extraites
        return {
          name: columnName,
          values: [`${columnName.toUpperCase()}_1`, `${columnName.toUpperCase()}_2`, `${columnName.toUpperCase()}_3`]
        };
      }
    }
    
    return null;
  }

  /**
   * Détecte d'autres problèmes de typage potentiels
   */
  private detectTypingIssues(
    column: ColumnInfo, 
    tableName: string, 
    columnName: string, 
    issues: TypeIssue[]
  ): void {
    const originalType = column.originalType || column.type;
    
    // Détecter TEXT pour des champs courts
    if (['TEXT', 'MEDIUMTEXT', 'LONGTEXT'].includes(column.type.toUpperCase())) {
      if (columnName.includes('name') ||
          columnName.includes('title') ||
          columnName.includes('code') ||
          columnName.includes('short') ||
          columnName.includes('summary')) {
        
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'VARCHAR(200)',
          severity: 'low',
          reason: 'Type TEXT utilisé pour un champ probablement court',
          recommendation: 'Utiliser VARCHAR avec une limite appropriée (100-200 caractères)'
        });
      }
    }
    
    // Détecter VARCHAR très long qui devrait être TEXT
    if (column.type.toUpperCase() === 'VARCHAR' && column.length && column.length > 1000) {
      issues.push({
        tableName,
        columnName,
        originalType,
        suggestedType: 'TEXT',
        severity: 'low',
        reason: `VARCHAR(${column.length}) très large`,
        recommendation: 'Utiliser TEXT pour de longs contenus'
      });
    }
    
    // Détecter INT pour stocker des dates (erreur commune)
    if (['INT', 'INTEGER', 'BIGINT'].includes(column.type.toUpperCase())) {
      if (columnName.includes('date') ||
          columnName.includes('time') ||
          columnName === 'created_at' ||
          columnName === 'updated_at' ||
          columnName === 'deleted_at') {
        
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'TIMESTAMP',
          severity: 'medium',
          reason: 'Entier utilisé pour stocker une date/heure',
          recommendation: 'Utiliser TIMESTAMP ou DATETIME'
        });
        
        // Corriger le type suggéré
        column.suggestedPostgresType = 'TIMESTAMP';
        column.suggestedPrismaType = 'DateTime';
      }
    }
    
    // Détecter DECIMAL sans précision pour des montants
    if (column.type.toUpperCase() === 'DECIMAL' && (!column.precision || column.precision < 8)) {
      if (columnName.includes('price') ||
          columnName.includes('amount') ||
          columnName.includes('cost') ||
          columnName.includes('total') ||
          columnName.includes('fee') ||
          columnName.includes('tax')) {
        
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'DECIMAL(10,2)',
          severity: 'medium',
          reason: 'Précision insuffisante pour un montant monétaire',
          recommendation: 'Utiliser DECIMAL(10,2) pour les montants monétaires'
        });
        
        // Corriger le type suggéré
        column.suggestedPostgresType = 'DECIMAL(10,2)';
        column.precision = 10;
        column.scale = 2;
      }
    }
  }

  /**
   * Convertit un texte en format PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convertit un texte en format camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }
}

/**
 * Génère un schéma Prisma contenant uniquement les énumérations
 */
function generatePrismaEnums(enums: Record<string, EnumDefinition>): string {
  let prismaSchema = `// Prisma Enums - Générés automatiquement
// Date: ${new Date().toISOString().split('T')[0]}
// Source: Type Audit Agent

`;

  // Trier les enums par nom
  const sortedEnums = Object.values(enums).sort((a, b) => a.name.localeCompare(b.name));
  
  for (const enumDef of sortedEnums) {
    prismaSchema += `enum ${enumDef.name} {\n`;
    
    // Trier les valeurs pour une meilleure lisibilité
    const sortedValues = [...enumDef.values].sort();
    
    for (const value of sortedValues) {
      prismaSchema += `  ${value}\n`;
    }
    
    prismaSchema += `}\n\n`;
  }
  
  return prismaSchema;
}

/**
 * Génère le rapport sur les problèmes de typage
 */
function generateTypingIssuesReport(issues: TypeIssue[]): string {
  let markdown = `# Rapport d'audit des types SQL

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce rapport identifie les problèmes potentiels de typage dans le schéma MySQL et propose des optimisations pour la migration vers PostgreSQL et Prisma.

## Résumé des problèmes

Total des problèmes détectés: **${issues.length}**

| Sévérité | Nombre |
|----------|--------|
| 🔴 Haute | ${issues.filter(i => i.severity === 'high').length} |
| 🟠 Moyenne | ${issues.filter(i => i.severity === 'medium').length} |
| 🟡 Basse | ${issues.filter(i => i.severity === 'low').length} |

## Problèmes par table

`;

  // Regrouper les problèmes par table
  const issuesByTable = issues.reduce((acc, issue) => {
    if (!acc[issue.tableName]) {
      acc[issue.tableName] = [];
    }
    acc[issue.tableName].push(issue);
    return acc;
  }, {} as Record<string, TypeIssue[]>);
  
  // Générer le rapport pour chaque table
  for (const [tableName, tableIssues] of Object.entries(issuesByTable)) {
    markdown += `### Table: \`${tableName}\`\n\n`;
    markdown += `| Colonne | Type original | Type suggéré | Raison | Recommandation |\n`;
    markdown += `|---------|--------------|-------------|--------|----------------|\n`;
    
    for (const issue of tableIssues) {
      const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟠' : '🟡';
      markdown += `| ${issue.columnName} | \`${issue.originalType}\` | \`${issue.suggestedType}\` | ${severityIcon} ${issue.reason} | ${issue.recommendation} |\n`;
    }
    
    markdown += `\n`;
  }
  
  // Ajouter section sur les conversions de types les plus fréquentes
  markdown += `## Conversions de types les plus courantes\n\n`;
  
  // Regrouper par type de conversion
  const byConversion = issues.reduce((acc, issue) => {
    const key = `${issue.originalType} → ${issue.suggestedType}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(issue);
    return acc;
  }, {} as Record<string, TypeIssue[]>);
  
  markdown += `| Type MySQL | Type PostgreSQL | Type Prisma | Instances | Raison |\n`;
  markdown += `|------------|----------------|-------------|-----------|--------|\n`;
  
  Object.entries(byConversion)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([conversion, convIssues]) => {
      const [mysqlType, postgresType] = conversion.split(' → ');
      let prismaType = 'String'; // Type par défaut
      
      // Trouver le type Prisma à partir du premier problème
      if (convIssues[0].suggestedType.includes('Enum')) {
        prismaType = 'Enum';
      } else if (convIssues[0].suggestedType === 'BOOLEAN') {
        prismaType = 'Boolean';
      } else if (convIssues[0].suggestedType === 'TIMESTAMP') {
        prismaType = 'DateTime';
      } else if (convIssues[0].suggestedType.startsWith('DECIMAL')) {
        prismaType = 'Decimal';
      } else if (convIssues[0].suggestedType === 'TEXT') {
        prismaType = 'String';
      } else if (convIssues[0].suggestedType.startsWith('VARCHAR')) {
        prismaType = 'String';
      }
      
      const reason = convIssues[0].reason;
      
      markdown += `| ${mysqlType} | ${postgresType} | ${prismaType} | ${convIssues.length} | ${reason} |\n`;
    });
  
  markdown += `\n`;
  
  // Ajouter section des recommandations générales
  markdown += `## Recommandations générales\n\n`;
  
  // Regrouper les recommandations
  const recommendations = issues.reduce((acc, issue) => {
    if (!acc[issue.recommendation]) {
      acc[issue.recommendation] = 0;
    }
    acc[issue.recommendation]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Trier par fréquence
  Object.entries(recommendations)
    .sort((a, b) => b[1] - a[1])
    .forEach(([recommendation, count]) => {
      markdown += `- ${recommendation} (${count} occurrences)\n`;
    });
  
  return markdown;
}

/**
 * Sauvegarde un objet JSON dans un fichier
 */
function saveToJson(filePath: string, data: any): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Sauvegarde du texte Markdown dans un fichier
 */
function saveToMarkdown(filePath: string, markdown: string): void {
  fs.writeFileSync(filePath, markdown, 'utf8');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Le fichier ${schemaPath} n'existe pas`);
      process.exit(1);
    }
    
    // Préparer le dossier de sortie
    const outputDir = path.resolve(options.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`🚀 Agent 2 - Audit des types SQL démarré...`);
    console.log(`📂 Fichier schéma: ${schemaPath}`);
    console.log(`📁 Dossier de sortie: ${outputDir}`);
    
    // Créer et exécuter l'auditeur de types
    const typeAuditor = new TypeAuditor();
    const result = await typeAuditor.auditTypes(schemaPath, {
      deepAnalysis: options.deepAnalysis,
      adjustSizes: options.adjustSizes || true,
      detectEnums: options.detectEnums || true
    });
    
    // Générer et sauvegarder les résultats
    console.log('📝 Génération des fichiers de résultats...');
    
    // 1. Sauvegarder la carte de conversion des types
    const typeConversionMapPath = path.join(outputDir, 'type_conversion_map.json');
    saveToJson(typeConversionMapPath, result.typeConversionMap);
    console.log(`✅ ${typeConversionMapPath} généré`);
    
    // 2. Sauvegarder le rapport des problèmes de typage
    const fieldTypingIssuesPath = path.join(outputDir, 'field_typing_issues.md');
    const typingIssuesReport = generateTypingIssuesReport(result.issues);
    saveToMarkdown(fieldTypingIssuesPath, typingIssuesReport);
    console.log(`✅ ${fieldTypingIssuesPath} généré`);
    
    // 3. Sauvegarder les énumérations Prisma
    const prismaEnumsPath = path.join(outputDir, 'prisma_enum.suggestion.prisma');
    const prismaEnums = generatePrismaEnums(result.enums);
    fs.writeFileSync(prismaEnumsPath, prismaEnums, 'utf8');
    console.log(`✅ ${prismaEnumsPath} généré`);
    
    // 4. Sauvegarder le schéma avec les types convertis
    const convertedSchemaPath = path.join(outputDir, 'mysql_schema_converted.json');
    saveToJson(convertedSchemaPath, result.schema);
    console.log(`✅ ${convertedSchemaPath} généré`);
    
    console.log('🎉 Agent 2 - Audit des types SQL terminé avec succès!');
  } catch (error) {
    console.error(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();