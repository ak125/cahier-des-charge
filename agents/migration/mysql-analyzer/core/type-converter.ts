/**
 * type-converter.ts
 * 
 * Convertisseur de types MySQL vers PostgreSQL et Prisma
 */

import { MySQLSchema, ColumnInfo } from '../models/schema';

interface TypeMapping {
  postgresType: string;
  prismaType: string;
  condition?: (column: ColumnInfo) => boolean;
}

export class TypeConverter {
  // Mappings de conversion des types MySQL vers PostgreSQL et Prisma
  private typeMappings: Record<string, TypeMapping | TypeMapping[]> = {
    // Types numériques
    'TINYINT': [
      {
        // TINYINT(1) est souvent utilisé comme booléen
        postgresType: 'BOOLEAN',
        prismaType: 'Boolean',
        condition: (column) => column.length === 1 || 
                               column.originalType.toUpperCase() === 'TINYINT(1)' ||
                               (column.comment && 
                                (column.comment.toLowerCase().includes('boolean') ||
                                 column.comment.toLowerCase().includes('booléen') ||
                                 column.comment.toLowerCase().includes('flag') ||
                                 column.comment.toLowerCase().includes('switch')))
      },
      {
        // Autres TINYINT
        postgresType: 'SMALLINT',
        prismaType: 'Int'
      }
    ],
    'SMALLINT': {
      postgresType: 'SMALLINT',
      prismaType: 'Int'
    },
    'MEDIUMINT': {
      postgresType: 'INTEGER',
      prismaType: 'Int'
    },
    'INT': {
      postgresType: 'INTEGER',
      prismaType: 'Int'
    },
    'INTEGER': {
      postgresType: 'INTEGER',
      prismaType: 'Int'
    },
    'BIGINT': [
      {
        // BIGINT utilisé pour les timestamp/datetime (nombre de secondes depuis epoch)
        postgresType: 'TIMESTAMP',
        prismaType: 'DateTime',
        condition: (column) => column.name.toLowerCase().includes('time') || 
                               column.name.toLowerCase().includes('date') ||
                               (column.comment && 
                                (column.comment.toLowerCase().includes('timestamp') ||
                                 column.comment.toLowerCase().includes('date')))
      },
      {
        // Autres BIGINT
        postgresType: 'BIGINT',
        prismaType: 'BigInt'
      }
    ],
    'DECIMAL': {
      postgresType: 'DECIMAL',
      prismaType: 'Decimal'
    },
    'NUMERIC': {
      postgresType: 'NUMERIC',
      prismaType: 'Decimal'
    },
    'FLOAT': {
      postgresType: 'REAL',
      prismaType: 'Float'
    },
    'DOUBLE': {
      postgresType: 'DOUBLE PRECISION',
      prismaType: 'Float'
    },
    
    // Types chaînes de caractères
    'CHAR': {
      postgresType: 'CHAR',
      prismaType: 'String'
    },
    'VARCHAR': [
      {
        // VARCHAR utilisé pour les énumérations (détection par nom ou commentaire)
        postgresType: 'TEXT',
        prismaType: 'enum', // Sera remplacé par le nom de l'enum
        condition: (column) => column.name.toLowerCase().endsWith('_type') || 
                               column.name.toLowerCase().endsWith('_status') ||
                               column.name.toLowerCase().endsWith('_state') ||
                               column.name.toLowerCase() === 'type' ||
                               column.name.toLowerCase() === 'status' ||
                               column.name.toLowerCase() === 'state' ||
                               (column.comment && 
                                (column.comment.toLowerCase().includes('enum') ||
                                 column.comment.toLowerCase().includes('valeurs possibles') ||
                                 column.comment.toLowerCase().includes('possible values')))
      },
      {
        // VARCHAR avec longueur > 255 
        postgresType: 'TEXT',
        prismaType: 'String',
        condition: (column) => column.length !== undefined && column.length > 255
      },
      {
        // VARCHAR standard
        postgresType: 'VARCHAR',
        prismaType: 'String'
      }
    ],
    'TINYTEXT': {
      postgresType: 'TEXT',
      prismaType: 'String'
    },
    'TEXT': {
      postgresType: 'TEXT',
      prismaType: 'String'
    },
    'MEDIUMTEXT': {
      postgresType: 'TEXT',
      prismaType: 'String'
    },
    'LONGTEXT': {
      postgresType: 'TEXT',
      prismaType: 'String'
    },
    
    // Types binaires
    'BINARY': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    'VARBINARY': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    'TINYBLOB': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    'BLOB': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    'MEDIUMBLOB': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    'LONGBLOB': {
      postgresType: 'BYTEA',
      prismaType: 'Bytes'
    },
    
    // Types date et heure
    'DATE': {
      postgresType: 'DATE',
      prismaType: 'DateTime'
    },
    'TIME': {
      postgresType: 'TIME',
      prismaType: 'DateTime'
    },
    'DATETIME': {
      postgresType: 'TIMESTAMP',
      prismaType: 'DateTime'
    },
    'TIMESTAMP': {
      postgresType: 'TIMESTAMP',
      prismaType: 'DateTime'
    },
    'YEAR': {
      postgresType: 'INTEGER',
      prismaType: 'Int'
    },
    
    // Types JSON (MySQL 5.7+)
    'JSON': {
      postgresType: 'JSONB',
      prismaType: 'Json'
    },
    
    // Types géométriques
    'GEOMETRY': {
      postgresType: 'GEOMETRY',
      prismaType: 'String' // Prisma ne supporte pas nativement les types géométriques
    },
    'POINT': {
      postgresType: 'POINT',
      prismaType: 'String'
    },
    'LINESTRING': {
      postgresType: 'PATH',
      prismaType: 'String'
    },
    'POLYGON': {
      postgresType: 'POLYGON',
      prismaType: 'String'
    },
    
    // Types spéciaux
    'ENUM': {
      postgresType: 'TEXT',
      prismaType: 'enum' // Sera remplacé par le nom de l'enum
    },
    'SET': {
      postgresType: 'TEXT[]',
      prismaType: 'String[]'
    },
    'BIT': [
      {
        // BIT(1) est souvent utilisé comme booléen
        postgresType: 'BOOLEAN',
        prismaType: 'Boolean',
        condition: (column) => column.length === 1
      },
      {
        // Autres BIT
        postgresType: 'BYTEA',
        prismaType: 'Bytes'
      }
    ]
  };

  /**
   * Convertit les types MySQL en types PostgreSQL/Prisma
   */
  convert(schema: MySQLSchema): MySQLSchema {
    // Clone profond du schéma pour éviter de modifier l'original
    const convertedSchema = JSON.parse(JSON.stringify(schema)) as MySQLSchema;
    
    // Pour chaque table
    Object.values(convertedSchema.tables).forEach(table => {
      // Pour chaque colonne
      Object.values(table.columns).forEach(column => {
        // Convertir le type
        this.convertColumnType(column);
      });
    });
    
    return convertedSchema;
  }

  /**
   * Convertit le type d'une colonne MySQL en type PostgreSQL/Prisma
   */
  private convertColumnType(column: ColumnInfo): void {
    const mysqlType = column.type.toUpperCase();
    
    // Vérifier si on a une conversion pour ce type
    if (mysqlType in this.typeMappings) {
      const mapping = this.typeMappings[mysqlType];
      
      if (Array.isArray(mapping)) {
        // Si c'est un tableau de mappings, trouver celui qui correspond à la condition
        for (const m of mapping) {
          if (!m.condition || m.condition(column)) {
            column.suggestedPostgresType = m.postgresType;
            column.suggestedPrismaType = m.prismaType;
            break;
          }
        }
      } else {
        // Sinon, utiliser directement le mapping
        column.suggestedPostgresType = mapping.postgresType;
        column.suggestedPrismaType = mapping.prismaType;
      }
    } else {
      // Type inconnu, conserver tel quel
      column.suggestedPostgresType = column.type;
      column.suggestedPrismaType = 'String'; // Fallback sûr
    }
    
    // Ajustements pour les types avec longueur ou précision
    this.adjustTypeWithDetails(column);
  }

  /**
   * Ajuste le type PostgreSQL avec la longueur/précision si nécessaire
   */
  private adjustTypeWithDetails(column: ColumnInfo): void {
    if (!column.suggestedPostgresType) return;
    
    const baseType = column.suggestedPostgresType;
    
    // Ajuster pour VARCHAR avec longueur
    if (baseType === 'VARCHAR' && column.length !== undefined) {
      column.suggestedPostgresType = `VARCHAR(${column.length})`;
    }
    // Ajuster pour CHAR avec longueur
    else if (baseType === 'CHAR' && column.length !== undefined) {
      column.suggestedPostgresType = `CHAR(${column.length})`;
    }
    // Ajuster pour DECIMAL avec précision et échelle
    else if ((baseType === 'DECIMAL' || baseType === 'NUMERIC') && 
             column.precision !== undefined) {
      if (column.scale !== undefined) {
        column.suggestedPostgresType = `${baseType}(${column.precision},${column.scale})`;
      } else {
        column.suggestedPostgresType = `${baseType}(${column.precision})`;
      }
    }
  }
}