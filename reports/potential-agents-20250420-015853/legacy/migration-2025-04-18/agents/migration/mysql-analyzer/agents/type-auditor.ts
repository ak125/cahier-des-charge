/**
 * type-auditor.ts
 * 
 * Agent spécialisé dans l'audit des types SQL
 * - Conversion intelligente MySQL → PostgreSQL
 * - Ajustement des tailles de champs
 * - Détection et mapping automatique des énumérations
 */

import * as fs from 'fs';
import * as path from 'path';
import { MySQLSchema, TableInfo, ColumnInfo, TypeConversionMap } from '../models/schema';

export class TypeAuditor {
  // Mapping de base des types MySQL vers PostgreSQL
  private typeMapping: Record<string, { postgresType: string; prismaType: string; needsLength?: boolean }> = {
    'TINYINT': { postgresType: 'SMALLINT', prismaType: 'Int' },
    'TINYINT(1)': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'SMALLINT': { postgresType: 'SMALLINT', prismaType: 'Int' },
    'MEDIUMINT': { postgresType: 'INTEGER', prismaType: 'Int' },
    'INT': { postgresType: 'INTEGER', prismaType: 'Int' },
    'INTEGER': { postgresType: 'INTEGER', prismaType: 'Int' },
    'BIGINT': { postgresType: 'BIGINT', prismaType: 'BigInt' },
    'FLOAT': { postgresType: 'REAL', prismaType: 'Float' },
    'DOUBLE': { postgresType: 'DOUBLE PRECISION', prismaType: 'Float' },
    'DECIMAL': { postgresType: 'DECIMAL', prismaType: 'Decimal', needsLength: true },
    'NUMERIC': { postgresType: 'NUMERIC', prismaType: 'Decimal', needsLength: true },
    'DATE': { postgresType: 'DATE', prismaType: 'DateTime' },
    'DATETIME': { postgresType: 'TIMESTAMP', prismaType: 'DateTime' },
    'TIMESTAMP': { postgresType: 'TIMESTAMP', prismaType: 'DateTime' },
    'TIME': { postgresType: 'TIME', prismaType: 'DateTime' },
    'YEAR': { postgresType: 'SMALLINT', prismaType: 'Int' },
    'CHAR': { postgresType: 'CHAR', prismaType: 'String', needsLength: true },
    'VARCHAR': { postgresType: 'VARCHAR', prismaType: 'String', needsLength: true },
    'TINYTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'TEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'MEDIUMTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'LONGTEXT': { postgresType: 'TEXT', prismaType: 'String' },
    'BINARY': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'VARBINARY': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'TINYBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'BLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'MEDIUMBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'LONGBLOB': { postgresType: 'BYTEA', prismaType: 'Bytes' },
    'ENUM': { postgresType: 'TEXT', prismaType: 'Enum', needsLength: false },
    'SET': { postgresType: 'TEXT[]', prismaType: 'String[]' },
    'JSON': { postgresType: 'JSONB', prismaType: 'Json' },
    'BOOL': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'BOOLEAN': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
    'UUID': { postgresType: 'UUID', prismaType: 'String' }
  };

  /**
   * Analyse le schéma pour identifier les problèmes de typage et convertir les types
   */
  async analyze(schema: MySQLSchema): Promise<{
    schema: MySQLSchema;
    conversionMap: TypeConversionMap;
    fieldTypingIssues: any[];
  }> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const typedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Map des conversions pour trace et documentation
    const conversionMap: TypeConversionMap = {};
    
    // Problèmes détectés
    const fieldTypingIssues: any[] = [];
    
    // Pour chaque table
    Object.entries(typedSchema.tables).forEach(([tableName, table]) => {
      conversionMap[tableName] = {};
      
      // Pour chaque colonne
      Object.entries(table.columns).forEach(([columnName, column]) => {
        const typeInfo = this.determineOptimalTypes(column, tableName, columnName);
        
        // Suggérer le type PostgreSQL
        column.suggestedPostgresType = typeInfo.postgresType;
        column.suggestedPrismaType = typeInfo.prismaType;
        
        // Ajuster les longueurs si nécessaire
        if (typeInfo.adjustedLength !== undefined && typeInfo.adjustedLength !== column.length) {
          fieldTypingIssues.push({
            tableName,
            columnName,
            originalType: column.originalType || `${column.type}(${column.length})`,
            suggestedType: `${column.type}(${typeInfo.adjustedLength})`,
            suggestedPostgresType: typeInfo.postgresType,
            suggestedPrismaType: typeInfo.prismaType,
            problem: `Longueur excessive pour ${column.type}`,
            suggestion: `Réduire la longueur de ${column.length || ''} à ${typeInfo.adjustedLength}`,
            reason: typeInfo.reason
          });
        }
        
        // Enregistrer la conversion dans le map
        conversionMap[tableName][columnName] = {
          originalType: column.originalType || column.type,
          suggestedPostgresType: typeInfo.postgresType,
          suggestedPrismaType: typeInfo.prismaType,
          reason: typeInfo.reason
        };
        
        // Marquer les problèmes de typage
        if (typeInfo.isTypeIssue) {
          fieldTypingIssues.push({
            tableName,
            columnName,
            originalType: column.originalType || column.type,
            suggestedType: typeInfo.suggestedType,
            suggestedPostgresType: typeInfo.postgresType,
            suggestedPrismaType: typeInfo.prismaType,
            problem: typeInfo.problem,
            suggestion: typeInfo.suggestion,
            reason: typeInfo.reason
          });
        }
        
        // Détecter les énumérations potentielles
        const enumInfo = this.detectPotentialEnum(column, tableName, columnName);
        if (enumInfo.isEnum) {
          column.isEnum = true;
          column.enumValues = enumInfo.values;
          column.suggestedPrismaType = enumInfo.enumName;
          
          fieldTypingIssues.push({
            tableName,
            columnName,
            originalType: column.originalType || column.type,
            suggestedType: `ENUM(${enumInfo.values.join(', ')})`,
            suggestedPostgresType: 'TEXT',
            suggestedPrismaType: enumInfo.enumName,
            problem: 'Type énuméré détecté',
            suggestion: `Utiliser un type énuméré (${enumInfo.enumName}) pour cette colonne`,
            reason: `Valeurs limitées identifiées: ${enumInfo.values.join(', ')}`
          });
          
          // Mettre à jour le map de conversion
          conversionMap[tableName][columnName].suggestedPrismaType = enumInfo.enumName;
          conversionMap[tableName][columnName].enumValues = enumInfo.values;
        }
      });
    });
    
    return { schema: typedSchema, conversionMap, fieldTypingIssues };
  }
  
  /**
   * Détermine les types PostgreSQL et Prisma optimaux pour une colonne MySQL
   */
  private determineOptimalTypes(
    column: ColumnInfo, 
    tableName: string, 
    columnName: string
  ): {
    postgresType: string;
    prismaType: string;
    suggestedType?: string;
    adjustedLength?: number;
    isTypeIssue: boolean;
    problem?: string;
    suggestion?: string;
    reason: string;
  } {
    // Extraire le type de base (sans la longueur)
    const baseType = this.extractBaseType(column.type);
    const originalLength = column.length;
    
    // Type spécial pour les booléens
    if (baseType === 'TINYINT' && column.length === 1) {
      return {
        postgresType: 'BOOLEAN',
        prismaType: 'Boolean',
        suggestedType: 'BOOLEAN',
        isTypeIssue: true,
        problem: 'TINYINT(1) est généralement utilisé comme un booléen',
        suggestion: 'Convertir en BOOLEAN',
        reason: 'Optimisation du typage - TINYINT(1) représente généralement un booléen'
      };
    }
    
    // Vérifier si le type est dans notre mapping
    if (this.typeMapping[baseType]) {
      const mapping = this.typeMapping[baseType];
      let postgresType = mapping.postgresType;
      let prismaType = mapping.prismaType;
      let adjustedLength: number | undefined = undefined;
      let isTypeIssue = false;
      let reason = `Conversion standard de MySQL vers PostgreSQL`;
      
      // Ajustement des longueurs pour les types qui en ont besoin
      if (mapping.needsLength && originalLength) {
        // Vérifier si la longueur est excessive pour VARCHAR
        if (baseType === 'VARCHAR' && originalLength === 255) {
          // Suggestion d'optimisation seulement si la colonne n'est pas une clé primaire
          if (!column.isPrimary) {
            adjustedLength = 100; // Valeur suggérée par défaut
            isTypeIssue = true;
            reason = `VARCHAR(255) est souvent une valeur par défaut excessive, 100 est généralement suffisant pour la plupart des cas`;
          } else {
            // Garder la longueur originale pour les clés primaires
            adjustedLength = originalLength;
          }
        }
        
        // Inclure la longueur dans le type PostgreSQL
        if (baseType === 'DECIMAL' || baseType === 'NUMERIC') {
          const precision = column.precision || 10;
          const scale = column.scale || 0;
          postgresType = `${postgresType}(${precision},${scale})`;
        } else if (originalLength) {
          postgresType = `${postgresType}(${adjustedLength || originalLength})`;
        }
      }
      
      return {
        postgresType,
        prismaType,
        adjustedLength,
        isTypeIssue,
        suggestedType: isTypeIssue ? `${baseType}(${adjustedLength})` : undefined,
        problem: isTypeIssue ? `Longueur potentiellement excessive` : undefined,
        suggestion: isTypeIssue ? `Réduire la longueur à ${adjustedLength}` : undefined,
        reason
      };
    }
    
    // Cas spécial pour les types non reconnus
    return {
      postgresType: 'TEXT',
      prismaType: 'String',
      isTypeIssue: true,
      problem: `Type MySQL non reconnu: ${column.type}`,
      suggestion: 'Convertir en type TEXT générique',
      reason: 'Type MySQL non standard ou personnalisé'
    };
  }
  
  /**
   * Extrait le type de base d'une chaîne de type MySQL
   */
  private extractBaseType(type: string): string {
    // Si c'est déjà TINYINT(1), le préserver car il a un traitement spécial
    if (type.toUpperCase() === 'TINYINT(1)') {
      return 'TINYINT(1)';
    }
    
    // Sinon extraire juste le nom du type sans paramètres
    return type.split('(')[0].toUpperCase();
  }
  
  /**
   * Détecte si une colonne pourrait être une énumération
   */
  private detectPotentialEnum(
    column: ColumnInfo, 
    tableName: string, 
    columnName: string
  ): {
    isEnum: boolean;
    enumName: string;
    values: string[];
  } {
    const baseType = this.extractBaseType(column.type);
    let isEnum = false;
    let enumName = '';
    let values: string[] = [];
    
    // Si c'est déjà un ENUM MySQL, extraire les valeurs
    if (baseType === 'ENUM' && column.originalType) {
      isEnum = true;
      
      // Extraire les valeurs de l'énumération
      const match = column.originalType.match(/ENUM\s*\((.*)\)/i);
      if (match && match[1]) {
        values = match[1]
          .split(',')
          .map(v => v.trim().replace(/^['"]|['"]$/g, ''));
      }
    } 
    // Détecter un VARCHAR qui pourrait être une énumération basée sur le nom
    else if ((baseType === 'VARCHAR' || baseType === 'CHAR') && 
             /status|type|state|category|flag|mode/i.test(columnName)) {
      isEnum = true;
      
      // Valeurs par défaut pour certains noms courants
      if (/status/i.test(columnName)) {
        values = ['ACTIVE', 'INACTIVE', 'PENDING', 'DELETED'];
      } else if (/type/i.test(columnName)) {
        values = ['STANDARD', 'PREMIUM', 'BASIC'];
      } else if (/state/i.test(columnName)) {
        values = ['NEW', 'PROCESSING', 'COMPLETED', 'FAILED'];
      } else if (/flag/i.test(columnName)) {
        values = ['ON', 'OFF'];
      } else {
        // Si on ne peut pas deviner, on utilise des valeurs génériques
        values = ['OPTION_1', 'OPTION_2', 'OPTION_3'];
      }
    }
    
    // Si c'est un enum, générer un nom approprié
    if (isEnum) {
      // Convertir snake_case ou kebab-case en PascalCase
      const parts = columnName.split(/[_-]/);
      enumName = parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('');
    }
    
    return { isEnum, enumName, values };
  }
}