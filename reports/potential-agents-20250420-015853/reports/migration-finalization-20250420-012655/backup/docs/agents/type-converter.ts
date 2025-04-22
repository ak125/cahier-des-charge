/**
import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
 * type-converter.ts
 * 
 * Agent spécialisé dans l'audit et la conversion des types SQL
 * - Conversion intelligente MySQL vers PostgreSQL/Prisma
 * - Optimisation des tailles de champs
 * - Détection et génération d'énumérations
 */

import { MySQLSchema, TableInfo, ColumnInfo } from '../models/schema';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


interface TypeConversionMap {
  [mysqlType: string]: {
    prismaType: string;
    postgresType?: string;
    comment?: string;
  };
}

interface TypeConversionResult {
  schema: MySQLSchema;
  conversionStats: {
    totalFields: number;
    convertedFields: number;
    optimizedFields: number;
    enumsDetected: number;
  };
  typeConversionMap: Record<string, {
    from: string;
    to: string;
    postgres?: string;
    count: number;
  }>;
  fieldTypingIssues: Array<{
    tableName: string;
    columnName: string;
    originalType: string;
    suggestedType: string;
    reason: string;
  }>;
  detectedEnums: Record<string, string[]>;
}

export class TypeConverter implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent{
  // Mapping par défaut des types MySQL -> Prisma/PostgreSQL
  private defaultTypeMap: TypeConversionMap = {
    // Types numériques
    'tinyint(1)': { prismaType: 'Boolean', postgresType: 'Boolean' },
    'tinyint': { prismaType: 'Int', postgresType: 'SmallInt' },
    'smallint': { prismaType: 'Int', postgresType: 'SmallInt' },
    'mediumint': { prismaType: 'Int', postgresType: 'Integer' },
    'int': { prismaType: 'Int', postgresType: 'Integer' },
    'bigint': { prismaType: 'BigInt', postgresType: 'BigInt' },
    'decimal': { prismaType: 'Decimal', postgresType: 'Decimal' },
    'float': { prismaType: 'Float', postgresType: 'Real' },
    'double': { prismaType: 'Float', postgresType: 'DoublePrecision' },
    
    // Types chaîne
    'char': { prismaType: 'String', postgresType: 'Char' },
    'varchar': { prismaType: 'String', postgresType: 'VarChar' },
    'tinytext': { prismaType: 'String', postgresType: 'Text' },
    'text': { prismaType: 'String', postgresType: 'Text' },
    'mediumtext': { prismaType: 'String', postgresType: 'Text' },
    'longtext': { prismaType: 'String', postgresType: 'Text' },
    
    // Types binaires
    'binary': { prismaType: 'Bytes', postgresType: 'ByteA' },
    'varbinary': { prismaType: 'Bytes', postgresType: 'ByteA' },
    'tinyblob': { prismaType: 'Bytes', postgresType: 'ByteA' },
    'blob': { prismaType: 'Bytes', postgresType: 'ByteA' },
    'mediumblob': { prismaType: 'Bytes', postgresType: 'ByteA' },
    'longblob': { prismaType: 'Bytes', postgresType: 'ByteA' },
    
    // Types date/heure
    'date': { prismaType: 'DateTime', postgresType: 'Date' },
    'time': { prismaType: 'DateTime', postgresType: 'Time' },
    'datetime': { prismaType: 'DateTime', postgresType: 'Timestamp' },
    'timestamp': { prismaType: 'DateTime', postgresType: 'Timestamp' },
    'year': { prismaType: 'Int', postgresType: 'SmallInt' },
    
    // Types spéciaux
    'json': { prismaType: 'Json', postgresType: 'JsonB' },
    'enum': { prismaType: 'Enum', postgresType: 'Enum' },
    'set': { prismaType: 'String', postgresType: 'Text', comment: 'SET converti en texte' },
    'geometry': { prismaType: 'Unsupported("geometry")', postgresType: 'Unsupported', comment: 'Type géométrique non supporté directement' },
    'point': { prismaType: 'Unsupported("point")', postgresType: 'Point', comment: 'Requiert l\'extension PostGIS' },
    'linestring': { prismaType: 'Unsupported("linestring")', postgresType: 'Unsupported', comment: 'Requiert l\'extension PostGIS' },
    'polygon': { prismaType: 'Unsupported("polygon")', postgresType: 'Unsupported', comment: 'Requiert l\'extension PostGIS' },
    
    // Types par défaut (fallback)
    'unknown': { prismaType: 'String', postgresType: 'Text', comment: 'Type inconnu' }
  };
  
  // Tailles suggérées pour l'optimisation
  private suggestedFieldSizes: Record<string, number> = {
    'email': 100,
    'name': 100,
    'first_name': 50,
    'last_name': 50,
    'password': 60, // Taille standard pour bcrypt
    'hash': 64, // SHA-256
    'phone': 20,
    'address': 150,
    'title': 100,
    'description': 500,
    'url': 200,
    'code': 20,
    'type': 30,
    'status': 30,
    'uuid': 36, // Format UUID standard
    'zip': 10,
    'postal_code': 10,
    'city': 50,
    'country': 50
  };
  
  // Valeurs possibles pour certains champs communs
  private potentialEnumFields: Record<string, RegExp> = {
    'status': /^(active|inactive|pending|completed|cancelled|deleted|draft|published|archived|failed|success)$/i,
    'gender': /^(male|female|other|m|f|o)$/i,
    'payment_type': /^(credit_card|debit_card|paypal|bank_transfer|check|cash|crypto)$/i,
    'role': /^(admin|user|guest|editor|manager|moderator|member|subscriber|customer|owner|superadmin)$/i,
    'visibility': /^(public|private|protected|draft|internal|external|hidden|visible)$/i,
    'priority': /^(high|medium|low|critical|urgent|normal)$/i,
    'category': /.+/i // Tout pattern pour les catégories, mais vérifier les occurrences multiples
  };
  
  /**
   * Convertit et optimise les types dans le schéma MySQL
   */
  async convert(schema: MySQLSchema): Promise<TypeConversionResult> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const convertedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Statistiques de conversion
    const stats = {
      totalFields: 0,
      convertedFields: 0,
      optimizedFields: 0,
      enumsDetected: 0
    };
    
    // Mapping de conversion effectuée
    const conversionMap: Record<string, {
      from: string;
      to: string;
      postgres?: string;
      count: number;
    }> = {};
    
    // Problèmes de typage détectés
    const typingIssues: Array<{
      tableName: string;
      columnName: string;
      originalType: string;
      suggestedType: string;
      reason: string;
    }> = [];
    
    // Énumérations détectées
    const detectedEnums: Record<string, string[]> = {};
    
    // Analyser les valeurs distinctes pour détecter les énumérations potentielles
    const potentialEnumColumns: Record<string, Set<string>> = {};
    
    // Première passe : rassembler les informations sur les valeurs pour détecter les énums
    if (schema.sampleData) {
      Object.entries(schema.sampleData).forEach(([tableName, data]) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        
        // Obtenir les noms de colonnes à partir des données
        const columnNames = Object.keys(data[0]);
        
        // Pour chaque colonne, collecter les valeurs distinctes
        columnNames.forEach(columnName => {
          // Ignorer les colonnes numériques, les IDs, etc.
          if (
            columnName === 'id' || 
            columnName.endsWith('_id') || 
            columnName.startsWith('id_')
          ) return;
          
          // Collection de valeurs distinctes
          const distinctValues = new Set<string>();
          
          // Compter les valeurs distinctes
          data.forEach(row => {
            if (row[columnName] !== null && row[columnName] !== undefined) {
              distinctValues.add(String(row[columnName]));
            }
          });
          
          // Si nous avons entre 2 et 20 valeurs distinctes, c'est un candidat potentiel pour une énumération
          if (distinctValues.size >= 2 && distinctValues.size <= 20) {
            const key = `${tableName}.${columnName}`;
            potentialEnumColumns[key] = distinctValues;
          }
        });
      });
    }
    
    // Fonction pour détecter les énumérations en fonction du nom et des valeurs
    const detectEnum = (columnName: string, tableName: string, columnType: string): string[] | null => {
      // Vérifier si le type est déjà une énumération MySQL
      if (columnType.toLowerCase().startsWith('enum(')) {
        // Extraire les valeurs entre parenthèses
        const match = columnType.match(/enum\((.*)\)/i);
        if (match && match[1]) {
          // Diviser les valeurs et supprimer les guillemets
          return match[1].split(',').map(value => 
            value.trim().replace(/^['"]|['"]$/g, '')
          );
        }
      }
      
      // Vérifier si nous avons des échantillons de données pour cette colonne
      const key = `${tableName}.${columnName}`;
      if (potentialEnumColumns[key]) {
        const values = Array.from(potentialEnumColumns[key]);
        
        // Vérifier si les valeurs correspondent à un pattern connu
        for (const [fieldType, pattern] of Object.entries(this.potentialEnumFields)) {
          // Si le nom contient le type de champ (status, role, etc.)
          if (
            columnName.includes(fieldType) || 
            columnName === fieldType ||
            // Pour les champs comme "is_active", "user_status", etc.
            columnName.endsWith(`_${fieldType}`) || 
            columnName.startsWith(`${fieldType}_`)
          ) {
            // Vérifier si toutes les valeurs correspondent au pattern
            if (values.every(val => pattern.test(val))) {
              return values;
            }
          }
        }
        
        // Même si aucun pattern ne correspond, si nous avons peu de valeurs et qu'elles sont courtes
        // c'est probablement une énumération
        const isAllShortStrings = values.every(val => val.length < 30);
        if (isAllShortStrings && values.length <= 10) {
          return values;
        }
      }
      
      return null;
    };
    
    // Parcourir toutes les tables et colonnes
    Object.entries(convertedSchema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        stats.totalFields++;
        
        // Extraire le type de base et la taille si disponible
        const { baseType, length } = this.extractTypeInfo(column.originalType || column.type);
        
        // Vérifier si c'est une énumération
        const enumValues = detectEnum(columnName, tableName, column.originalType || column.type);
        if (enumValues) {
          column.isEnum = true;
          column.enumValues = enumValues;
          column.suggestedPrismaType = this.toPascalCase(columnName);
          
          // Ajouter aux énumérations détectées
          detectedEnums[column.suggestedPrismaType] = enumValues;
          
          stats.enumsDetected++;
        } else {
          // Conversion normale de type
          const conversion = this.convertType(baseType);
          
          column.suggestedPrismaType = conversion.prismaType;
          if (conversion.postgresType) {
            column.suggestedPostgresType = conversion.postgresType;
          }
          
          // Ajouter à la statistique
          stats.convertedFields++;
          
          // Ajouter au mapping de conversion
          const mapKey = baseType.toLowerCase();
          if (!conversionMap[mapKey]) {
            conversionMap[mapKey] = {
              from: baseType,
              to: conversion.prismaType,
              postgres: conversion.postgresType,
              count: 0
            };
          }
          conversionMap[mapKey].count++;
          
          // Optimiser la taille des champs VARCHAR si pertinent
          if (baseType.toLowerCase() === 'varchar' && length) {
            const optimizedLength = this.optimizeFieldSize(columnName, length);
            if (optimizedLength < length) {
              column.suggestedLength = optimizedLength;
              column.suggestedPostgresType = `VarChar(${optimizedLength})`;
              
              stats.optimizedFields++;
              
              // Ajouter un problème de typage pour signaler l'optimisation
              typingIssues.push({
                tableName,
                columnName,
                originalType: `VARCHAR(${length})`,
                suggestedType: `VARCHAR(${optimizedLength})`,
                reason: `Taille optimisée de ${length} à ${optimizedLength} caractères`
              });
            }
          }
          
          // Détecter les problèmes de typage spécifiques
          this.detectTypingIssues(
            tableName,
            columnName,
            baseType,
            length,
            column,
            typingIssues
          );
        }
      });
    });
    
    return {
      schema: convertedSchema,
      conversionStats: stats,
      typeConversionMap: conversionMap,
      fieldTypingIssues: typingIssues,
      detectedEnums: detectedEnums
    };
  }
  
  /**
   * Extrait le type de base et la taille d'un type MySQL
   */
  private extractTypeInfo(type: string): { baseType: string; length?: number } {
    // Matcher VARCHAR(255), INT(11), etc.
    const match = type.match(/^([a-z]+)(?:\((\d+)(?:,(\d+))?\))?/i);
    
    if (match) {
      const baseType = match[1];
      const length = match[2] ? parseInt(match[2]) : undefined;
      
      return { baseType, length };
    }
    
    return { baseType: type };
  }
  
  /**
   * Convertit un type MySQL en type Prisma/PostgreSQL
   */
  private convertType(mysqlType: string): { prismaType: string; postgresType?: string; comment?: string } {
    // Normaliser le type pour la recherche
    const normalizedType = mysqlType.toLowerCase().replace(/\(\d+(?:,\d+)?\)$/, '');
    
    // Chercher une correspondance exacte
    if (this.defaultTypeMap[normalizedType]) {
      return this.defaultTypeMap[normalizedType];
    }
    
    // Chercher une correspondance partielle
    for (const [key, conversion] of Object.entries(this.defaultTypeMap)) {
      if (normalizedType.startsWith(key)) {
        return conversion;
      }
    }
    
    // Type inconnu, utiliser le fallback
    return this.defaultTypeMap.unknown;

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';
  }
  
  /**
   * Optimise la taille d'un champ en fonction de son nom et usage
   */
  private optimizeFieldSize(columnName: string, currentSize: number): number {
    // Chercher une taille suggérée exacte
    for (const [pattern, suggestedSize] of Object.entries(this.suggestedFieldSizes)) {
      // Vérifier si le nom de colonne est égal ou contient le pattern
      if (
        columnName === pattern ||
        columnName.includes(pattern) ||
        columnName.endsWith(`_${pattern}`) ||
        columnName.startsWith(`${pattern}_`)
      ) {
        // Ne pas augmenter la taille, seulement la réduire
        return Math.min(currentSize, suggestedSize);
      }
    }
    
    // Si pas de correspondance spécifique
    if (currentSize === 255) {
      // Réduire les VARCHAR(255) standard à 200 par défaut
      return 200;
    }
    
    // Arrondir les tailles non standard au multiple de 5 ou 10 le plus proche
    if (currentSize > 20) {
      if (currentSize < 100) {
        // Arrondir au multiple de 5 le plus proche
        return Math.ceil(currentSize / 5) * 5;
      } else {
        // Arrondir au multiple de 10 le plus proche
        return Math.ceil(currentSize / 10) * 10;
      }
    }
    
    // Conserver la taille actuelle
    return currentSize;
  }
  
  /**
   * Détecte les problèmes potentiels de typage
   */
  private detectTypingIssues(
    tableName: string,
    columnName: string,
    baseType: string,
    length: number | undefined,
    column: ColumnInfo,
    issues: Array<{
      tableName: string;
      columnName: string;
      originalType: string;
      suggestedType: string;
      reason: string;
    }>
  ): void {
    const originalType = column.originalType || column.type;
    
    // Détecter les INT(1) qui devraient être des booléens
    if (baseType.toLowerCase() === 'tinyint' && length === 1) {
      // Vérifier si le nom suggère un booléen
      if (
        columnName.startsWith('is_') ||
        columnName.startsWith('has_') ||
        ['active', 'enabled', 'visible', 'deleted', 'archived', 'published'].includes(columnName)
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'BOOLEAN',
          reason: 'TINYINT(1) utilisé pour un champ booléen'
        });
        
        // Mettre à jour le type suggéré
        column.suggestedPrismaType = 'Boolean';
        column.suggestedPostgresType = 'Boolean';
      }
    }
    
    // Détecter les VARCHAR trop grands pour des ID/codes
    if (baseType.toLowerCase() === 'varchar' && length && length > 50) {
      if (
        columnName.endsWith('_id') ||
        columnName.endsWith('_code') ||
        columnName.endsWith('_key')
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: `VARCHAR(${Math.min(50, length)})`,
          reason: 'Taille excessive pour un identifiant'
        });
        
        // Mettre à jour la taille suggérée
        column.suggestedLength = Math.min(50, length);
        column.suggestedPostgresType = `VarChar(${Math.min(50, length)})`;
      }
    }
    
    // Détecter les TEXT pour des champs courts
    if (['text', 'mediumtext', 'longtext'].includes(baseType.toLowerCase())) {
      if (
        columnName.includes('name') ||
        columnName.includes('title') ||
        columnName.includes('summary') ||
        columnName.includes('code')
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'VARCHAR(200)',
          reason: 'Type TEXT utilisé pour un champ probablement court'
        });
        
        // Mettre à jour le type suggéré
        column.suggestedPostgresType = 'VarChar(200)';
      }
    }
    
    // Détecter les CHAR de taille fixe pour des champs qui devraient être VARCHAR
    if (baseType.toLowerCase() === 'char' && length && length > 1) {
      // Sauf pour certains codes comme les codes pays ISO, codes postaux, etc.
      if (
        !columnName.includes('iso') &&
        !columnName.includes('code') &&
        !columnName.includes('postal') &&
        !columnName.includes('zip')
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: `VARCHAR(${length})`,
          reason: 'CHAR de taille fixe pour un champ à longueur variable'
        });
        
        // Mettre à jour le type suggéré
        column.suggestedPostgresType = `VarChar(${length})`;
      }
    }
    
    // Détecter INTEGER pour stocker des dates (erreur commune)
    if (['int', 'integer', 'bigint'].includes(baseType.toLowerCase())) {
      if (
        columnName.includes('date') ||
        columnName.includes('time') ||
        columnName === 'created_at' ||
        columnName === 'updated_at'
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'TIMESTAMP',
          reason: 'Utilisation d\'un entier pour stocker une date/heure'
        });
        
        // Mettre à jour le type suggéré
        column.suggestedPrismaType = 'DateTime';
        column.suggestedPostgresType = 'Timestamp';
      }
    }
    
    // Détecter DECIMAL sans précision pour des champs monétaires
    if (baseType.toLowerCase() === 'decimal' && (!length || length === 10)) {
      if (
        columnName.includes('price') ||
        columnName.includes('amount') ||
        columnName.includes('cost') ||
        columnName.includes('total')
      ) {
        issues.push({
          tableName,
          columnName,
          originalType,
          suggestedType: 'DECIMAL(10,2)',
          reason: 'Précision décimale recommandée pour un champ monétaire'
        });
        
        // Mettre à jour le type suggéré
        column.suggestedPostgresType = 'Decimal(10,2)';
      }
    }
  }
  
  /**
   * Convertit un nom snake_case en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
}