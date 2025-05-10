/**
 * Module de validation MCP 2.0
 */

// Exporter les types de base
export * from './types';

// Exporter les validateurs
export { McpValidator } from './validators/mcp-validator';

// Exporter les utilitaires
export {
    createZodSchemaFromPrisma,
    createZodSchemaFromPrismaFunction,
    validateForPrisma
} from .@cahier-des-charge/coordination/src/utils/prisma-zod';

// Exporter les générateurs
export { SchemaGenerator } from './generators/schema-generator';

// Exporter les scripts
export { generateSchemasFromPrisma } from './scripts/generate-schemas';

// Réexporter Zod pour faciliter l'utilisation
export { z } from 'zod';
