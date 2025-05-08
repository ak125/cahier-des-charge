/**
 * Module de conversion de types entre MySQL, PostgreSQL et Prisma
 */
import { TypeSizeInfo, TypeMappingDetail, TypeAnomalies, Column, Table } from '../types';

/**
 * Classe de base pour la conversion de types de base de données
 */
export class TypeConverter {
  /**
   * Table de mapping des types par défaut
   * Contient les règles de conversion pour les types MySQL courants
   */
  private typeMappings: Record<string, TypeMappingDetail> = {
    // Types numériques
    'TINYINT': { postgres: 'SMALLINT', prisma: 'Int' },
    'TINYINT(1)': { postgres: 'BOOLEAN', prisma: 'Boolean' },
    'SMALLINT': { postgres: 'SMALLINT', prisma: 'Int' },
    'MEDIUMINT': { postgres: 'INTEGER', prisma: 'Int' },
    'INT': { postgres: 'INTEGER', prisma: 'Int' },
    'INTEGER': { postgres: 'INTEGER', prisma: 'Int' },
    'BIGINT': { postgres: 'BIGINT', prisma: 'BigInt' },
    
    // Types à virgule flottante
    'FLOAT': { 
      postgres: 'REAL', 
      prisma: 'Float',
      warning: 'La précision peut varier entre MySQL et PostgreSQL' 
    },
    'DOUBLE': { 
      postgres: 'DOUBLE PRECISION', 
      prisma: 'Float',
      warning: 'La précision peut varier entre MySQL et PostgreSQL' 
    },
    
    // Types décimaux
    'DECIMAL': { postgres: 'DECIMAL', prisma: 'Decimal' },
    'NUMERIC': { postgres: 'NUMERIC', prisma: 'Decimal' },
    
    // Types caractère
    'CHAR': { postgres: 'CHAR', prisma: 'String' },
    'VARCHAR': { postgres: 'VARCHAR', prisma: 'String' },
    'TINYTEXT': { 
      postgres: 'TEXT', 
      prisma: 'String',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour TINYTEXT' 
    },
    'TEXT': { postgres: 'TEXT', prisma: 'String' },
    'MEDIUMTEXT': { 
      postgres: 'TEXT', 
      prisma: 'String',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour MEDIUMTEXT' 
    },
    'LONGTEXT': { 
      postgres: 'TEXT', 
      prisma: 'String',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour LONGTEXT' 
    },
    
    // Types binaires
    'BINARY': { postgres: 'BYTEA', prisma: 'Bytes' },
    'VARBINARY': { postgres: 'BYTEA', prisma: 'Bytes' },
    'TINYBLOB': { 
      postgres: 'BYTEA', 
      prisma: 'Bytes',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour TINYBLOB' 
    },
    'BLOB': { postgres: 'BYTEA', prisma: 'Bytes' },
    'MEDIUMBLOB': { 
      postgres: 'BYTEA', 
      prisma: 'Bytes',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour MEDIUMBLOB' 
    },
    'LONGBLOB': { 
      postgres: 'BYTEA', 
      prisma: 'Bytes',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour LONGBLOB' 
    },
    
    // Types date et heure
    'DATE': { postgres: 'DATE', prisma: 'DateTime' },
    'TIME': { postgres: 'TIME', prisma: 'DateTime' },
    'DATETIME': { postgres: 'TIMESTAMP', prisma: 'DateTime' },
    'TIMESTAMP': { postgres: 'TIMESTAMP', prisma: 'DateTime' },
    'YEAR': { 
      postgres: 'SMALLINT', 
      prisma: 'Int',
      warning: 'PostgreSQL n\'a pas de type YEAR spécifique' 
    },
    
    // Types spéciaux
    'JSON': { postgres: 'JSONB', prisma: 'Json' },
    'ENUM': { 
      postgres: 'TEXT', 
      prisma: 'String',
      suggestion: 'Créer un type enum personnalisé dans PostgreSQL et Prisma' 
    },
    'SET': { 
      postgres: 'TEXT[]', 
      prisma: 'String[]',
      warning: 'PostgreSQL n\'a pas d\'équivalent direct pour SET, utiliser un tableau' 
    },
    'BIT': { postgres: 'BIT', prisma: 'Int' },
    'BOOL': { postgres: 'BOOLEAN', prisma: 'Boolean' },
    'BOOLEAN': { postgres: 'BOOLEAN', prisma: 'Boolean' },
    
    // Types géométriques
    'GEOMETRY': { 
      postgres: 'GEOMETRY', 
      prisma: 'Unsupported',
      warning: 'Nécessite l\'extension PostGIS',
      suggestion: 'Utiliser String avec @db.Geometry'
    }
  };

  /**
   * Constructeur avec possibilité d'étendre ou remplacer les mappings par défaut
   */
  constructor(customMappings?: Record<string, TypeMappingDetail>) {
    if (customMappings) {
      this.typeMappings = { ...this.typeMappings, ...customMappings };
    }
  }

  /**
   * Extrait les informations détaillées d'un type MySQL
   * @param mysqlType Type MySQL (ex: VARCHAR(255), DECIMAL(10,2), etc.)
   */
  public extractTypeSizeInfo(mysqlType: string): TypeSizeInfo {
    // Normaliser le type en majuscules pour la cohérence
    const normalizedType = mysqlType.toUpperCase().trim();
    
    // Types avec valeurs énumérées (ENUM, SET)
    if (normalizedType.startsWith('ENUM(') || normalizedType.startsWith('SET(')) {
      const baseType = normalizedType.startsWith('ENUM(') ? 'ENUM' : 'SET';
      const valuesMatch = normalizedType.match(/\((.*)\)/);
      
      if (valuesMatch && valuesMatch[1]) {
        // Extraire et nettoyer les valeurs
        const valuesStr = valuesMatch[1];
        const values = valuesStr
          .split(',')
          .map(val => val.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, ''));
        
        return { baseType, values };
      }
      
      return { baseType };
    }
    
    // Types avec précision et échelle (DECIMAL, NUMERIC)
    if (normalizedType.includes('DECIMAL(') || normalizedType.includes('NUMERIC(')) {
      const precisionMatch = normalizedType.match(/\((\d+),\s*(\d+)\)/);
      
      if (precisionMatch) {
        const baseType = normalizedType.startsWith('DECIMAL') ? 'DECIMAL' : 'NUMERIC';
        const precision = parseInt(precisionMatch[1], 10);
        const scale = parseInt(precisionMatch[2], 10);
        
        return { baseType, precision, scale };
      }
    }
    
    // Types avec taille (VARCHAR, CHAR, etc.)
    const sizeMatch = normalizedType.match(/^([A-Z]+)\((\d+)\)/);
    
    if (sizeMatch) {
      const baseType = sizeMatch[1];
      const size = parseInt(sizeMatch[2], 10);
      
      return { baseType, size };
    }
    
    // Types spéciaux comme UNSIGNED
    if (normalizedType.includes('UNSIGNED')) {
      const baseType = normalizedType.replace('UNSIGNED', '').trim();
      return { baseType: baseType || normalizedType };
    }
    
    // Types simples sans paramètres
    return { baseType: normalizedType };
  }

  /**
   * Mappe un type MySQL vers PostgreSQL et Prisma
   * @param mysqlType Type MySQL à convertir
   */
  public mapType(mysqlType: string): TypeMappingDetail {
    const typeInfo = this.extractTypeSizeInfo(mysqlType);
    const baseType = typeInfo.baseType;
    
    // Cas spécial pour TINYINT(1) qui est souvent utilisé comme booléen
    if (baseType === 'TINYINT' && typeInfo.size === 1) {
      return this.typeMappings['TINYINT(1)'];
    }
    
    // Chercher une correspondance exacte
    if (this.typeMappings[mysqlType]) {
      return this.typeMappings[mysqlType];
    }
    
    // Chercher une correspondance sur le type de base
    if (this.typeMappings[baseType]) {
      const mapping = { ...this.typeMappings[baseType] };
      
      // Ajuster la taille si nécessaire
      if (typeInfo.size) {
        // Vérifier si le type PostgreSQL supporte la taille
        if (['VARCHAR', 'CHAR', 'BIT'].includes(baseType)) {
          mapping.postgres = `${mapping.postgres}(${typeInfo.size})`;
        }
      }
      
      // Ajuster la précision et l'échelle pour les types décimaux
      if (typeInfo.precision !== undefined && typeInfo.scale !== undefined) {
        mapping.postgres = `${mapping.postgres}(${typeInfo.precision},${typeInfo.scale})`;
        mapping.prisma = 'Decimal';
      }
      
      return mapping;
    }
    
    // Type non reconnu, retourner un type TEXT par défaut avec avertissement
    return {
      postgres: 'TEXT',
      prisma: 'String',
      warning: `Type MySQL non reconnu: ${mysqlType}`,
      suggestion: 'Vérifier manuellement la conversion de ce type'
    };
  }

  /**
   * Génère la définition d'un champ Prisma à partir d'une colonne
   * @param column Colonne à convertir
   * @param table Table parente
   */
  public getPrismaFieldDefinition(column: Column, table: Table): string {
    const mapping = this.mapType(column.type);
    const { prisma: prismaType } = mapping;
    
    let definition = `  ${this.toCamelCase(column.name)} ${prismaType}`;
    
    // Ajouter les attributs Prisma
    const attributes: string[] = [];
    
    // Gérer les clés primaires
    if (column.primaryKey) {
      attributes.push('@id');
      
      // Ajouter l'auto-incrément pour les clés primaires numériques
      if (column.autoIncrement) {
        attributes.push('@default(autoincrement())');
      }
    }
    
    // Gérer la nullabilité
    if (!column.nullable) {
      // Ne rien ajouter car non-nullable est le comportement par défaut
    } else {
      definition += '?'; // Ajoute ? pour les champs nullables
    }
    
    // Gérer les valeurs par défaut
    if (column.defaultValue !== undefined && column.defaultValue !== null) {
      const defaultValue = this.formatPrismaDefaultValue(column.defaultValue, prismaType);
      if (defaultValue) {
        attributes.push(`@default(${defaultValue})`);
      }
    }
    
    // Ajouter l'annotation db pour le type PostgreSQL
    const postgresType = this.mapType(column.type).postgres;
    if (postgresType) {
      attributes.push(`@db.${postgresType}`);
    }
    
    // Ajouter les attributs s'il y en a
    if (attributes.length > 0) {
      definition += ` ${attributes.join(' ')}`;
    }
    
    return definition;
  }
  
  /**
   * Formate une valeur par défaut pour Prisma
   * @param defaultValue Valeur par défaut MySQL
   * @param prismaType Type Prisma
   */
  private formatPrismaDefaultValue(defaultValue: string, prismaType: string): string | null {
    // Gérer les valeurs NULL
    if (defaultValue === 'NULL' || defaultValue === null) {
      return null;
    }
    
    // Gérer les fonctions
    if (defaultValue.toUpperCase().includes('CURRENT_TIMESTAMP')) {
      return 'now()';
    }
    
    // Gérer les types selon leur format Prisma
    switch (prismaType) {
      case 'String':
        return `"${defaultValue.replace(/"/g, '\\"')}"`;
      case 'Int':
      case 'Float':
        return defaultValue;
      case 'Boolean':
        return defaultValue === '1' || defaultValue.toLowerCase() === 'true' ? 'true' : 'false';
      case 'DateTime':
        if (defaultValue === '0000-00-00 00:00:00') {
          // Valeur par défaut invalide pour DateTime dans Prisma
          return null;
        }
        return `"${defaultValue}"`;
      default:
        return `dbgenerated("${defaultValue}")`;
    }
  }

  /**
   * Détecte les anomalies potentielles dans les types de données
   * @param column Colonne à analyser
   * @param table Table parente
   */
  public detectTypeAnomaly(column: Column, table: Table): TypeAnomalies | null {
    const typeInfo = this.extractTypeSizeInfo(column.type);
    const baseType = typeInfo.baseType;
    
    // Vérifier les types ENUM (conversion complexe en PostgreSQL)
    if (baseType === 'ENUM') {
      return {
        type: 'enum',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les ENUM MySQL ne sont pas nativement supportés par PostgreSQL',
        recommendation: 'Créer un type ENUM en Prisma ou utiliser une table de référence',
        severity: 'medium',
      };
    }
    
    // Vérifier les types SET (non supportés en PostgreSQL)
    if (baseType === 'SET') {
      return {
        type: 'set',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les types SET MySQL ne sont pas supportés par PostgreSQL',
        recommendation: 'Utiliser un tableau (TEXT[]) ou une table de jointure',
        severity: 'high',
      };
    }
    
    // Vérifier les UNSIGNED (non supportés en PostgreSQL)
    if (column.type.toUpperCase().includes('UNSIGNED')) {
      return {
        type: 'unsigned',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les types non signés (UNSIGNED) ne sont pas supportés par PostgreSQL',
        recommendation: `Utiliser un type de taille supérieure ou une contrainte CHECK`,
        severity: 'medium',
      };
    }
    
    // Vérifier les problèmes de précision
    if (['FLOAT', 'DOUBLE'].includes(baseType)) {
      return {
        type: 'precision',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les types à virgule flottante peuvent avoir des comportements différents',
        recommendation: 'Considérer DECIMAL/NUMERIC pour les valeurs financières',
        severity: 'low',
      };
    }
    
    // Pas d'anomalie détectée
    return null;
  }

  /**
   * Convertit une chaîne en format camelCase
   * @param str Chaîne à convertir
   */
  private toCamelCase(str: string): string {
    // Remplacer les underscores et espaces par des espaces
    return str
      .replace(/[_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      // Assurer que le premier caractère est en minuscule
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  }
}