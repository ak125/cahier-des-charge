import { Type, Static } from '@sinclair/typebox';
import { TypeBoxConfig } from './lib/typebox-config';
import { StandardSchemas } from './lib/standard-schemas';
import { ZodTypeBoxAdapter } from './lib/zod-typebox-adapter';
import { RestApiSchemas } from './lib/rest-api-schemas';
import { validateSchema } from './lib/standard-schemas';

/**
 * Configuration standardisée pour TypeBox
 * Intégration avec NX et outillage de validation de schémas
 */

// Réexporter les classes et fonctions principales
export {
    TypeBoxConfig,
    StandardSchemas,
    ZodTypeBoxAdapter,
    RestApiSchemas,
    validateSchema
};

// Réexporter Type et Static de TypeBox pour faciliter l'usage
export { Type, Static };

// Exporter des types utiles
export type ValidationResult<T> = {
    valid: boolean;
    value?: T;
    errors?: { path: string; message: string }[];
};