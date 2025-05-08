/**
 * Constantes pour le mapping des types entre MySQL, PostgreSQL et Prisma
 */

/**
 * Mapping par défaut des types MySQL vers les types PostgreSQL et Prisma
 */
export const DEFAULT_TYPE_MAPPINGS = {
    // Types numériques
    'TINYINT(1)': { postgresType: 'BOOLEAN', prismaType: 'Boolean' },
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

    // Types date et heure
    'DATE': { postgresType: 'DATE', prismaType: 'DateTime' },
    'TIME': { postgresType: 'TIME', prismaType: 'DateTime' },
    'DATETIME': { postgresType: 'TIMESTAMPTZ', prismaType: 'DateTime' },
    'TIMESTAMP': { postgresType: 'TIMESTAMPTZ', prismaType: 'DateTime' },
    'YEAR': { postgresType: 'SMALLINT', prismaType: 'Int' },

    // Types spéciaux
    'JSON': { postgresType: 'JSONB', prismaType: 'Json' },
    'ENUM': { postgresType: 'TEXT', prismaType: 'String' }, // À transformer en enum Prisma
    'SET': { postgresType: 'TEXT[]', prismaType: 'String[]' },
    'BIT': { postgresType: 'BIT', prismaType: 'Int' },
    'UUID': { postgresType: 'UUID', prismaType: 'String' },
};

/**
 * Types nécessitant une attention particulière lors de la migration
 */
export const PROBLEMATIC_TYPES = [
    'ENUM',
    'SET',
    'GEOMETRY',
    'POINT',
    'LINESTRING',
    'POLYGON',
    'MULTIPOINT',
    'MULTILINESTRING',
    'MULTIPOLYGON',
    'GEOMETRYCOLLECTION'
];

/**
 * Types PostgreSQL pris en charge par Prisma
 */
export const PRISMA_SUPPORTED_POSTGRES_TYPES = [
    'BOOLEAN',
    'SMALLINT',
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'NUMERIC',
    'REAL',
    'DOUBLE PRECISION',
    'TEXT',
    'VARCHAR',
    'CHAR',
    'TIMESTAMPTZ',
    'TIMESTAMP',
    'DATE',
    'TIME',
    'BYTEA',
    'UUID',
    'JSONB',
    'JSON'
];