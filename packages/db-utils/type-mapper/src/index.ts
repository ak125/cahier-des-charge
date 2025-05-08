/**
 * @projet/db-utils-type-mapper
 * Bibliothèque de conversion de types entre MySQL, PostgreSQL et Prisma
 */

// Exporter la classe principale
export { TypeMapper } from './type-mapper';

// Exporter les classes spécifiques de conversion et d'analyse
export { TypeConverter } from './converters/type-converter';
export { MySQLSchemaAnalyzer } from './analyzers/mysql-schema-analyzer';
export { PrismaGenerator } from './generators/prisma-generator';
export { MarkdownGenerator } from './generators/markdown-generator';

// Exporter les types et interfaces
export * from './types';