import { TSchema } from '@sinclair/typebox';
import { validateSchema, TypeBoxConfig } from '../../../../packages/schema-validation/src';

/**
 * Middleware de validation pour les formulaires et les données d'API
 * Utilise la configuration standardisée TypeBox
 */

/**
 * Valide un objet de données selon un schéma TypeBox
 * @param schema Le schéma TypeBox à utiliser pour la validation
 * @param data Les données à valider
 * @returns Un objet contenant les résultats de validation et les erreurs éventuelles
 */
export function validateData<T>(schema: TSchema, data: unknown): {
    isValid: boolean;
    data?: T;
    errors?: { [key: string]: string };
} {
    const result = validateSchema<T>(schema, data);

    if (result.valid) {
        return {
            isValid: true,
            data: result.value
        };
    }

    // Formater les erreurs pour une utilisation dans l'UI
    const errors: { [key: string]: string } = {};

    if (result.errors) {
        for (const error of result.errors) {
            // Convertir le chemin au format de clé: 'user/name' -> 'user.name'
            const key = error.path
                .replace(/^\//, '') // Supprimer le slash initial
                .replace(/\//g, '.'); // Convertir les slashes en points

            errors[key] = error.message;
        }
    }

    return {
        isValid: false,
        errors
    };
}

/**
 * Crée un validateur optimisé pour un schéma spécifique
 * Utile pour les validations répétées du même schéma
 */
export function createValidator<T>(schema: TSchema) {
    const compiledSchema = TypeBoxConfig.compile(schema);

    return {
        /**
         * Valide des données avec le schéma compilé
         */
        validate(data: unknown): {
            isValid: boolean;
            data?: T;
            errors?: { [key: string]: string };
        } {
            const isValid = compiledSchema.Check(data);

            if (isValid) {
                return {
                    isValid: true,
                    data: data as T
                };
            }

            const errors: { [key: string]: string } = {};
            const validationErrors = [...compiledSchema.Errors(data)];

            for (const error of validationErrors) {
                const key = error.path
                    .replace(/^\//, '')
                    .replace(/\//g, '.');

                errors[key] = error.message;
            }

            return {
                isValid: false,
                errors
            };
        }
    };
}