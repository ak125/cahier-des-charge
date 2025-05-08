import { Type } from '@sinclair/typebox';
import { TypeBoxConfig } from './typebox-config';

/**
 * Collection de schémas standardisés TypeBox pour l'application
 * Ces schémas peuvent être utilisés dans tout le projet
 */
export const StandardSchemas = {
    /**
     * Types primitifs avec validation
     */
    Primitives: {
        Email: Type.String({ format: 'email' }),
        UUID: Type.String({ format: 'uuid' }),
        DateTime: Type.String({ format: 'date-time' }),
        URL: Type.String({ format: 'url' }),
        SafeString: Type.String({ minLength: 1, maxLength: 255 }),
        LongText: Type.String({ maxLength: 10000 }),
        Password: Type.String({ format: 'password', minLength: 8 }),
        PositiveNumber: Type.Number({ minimum: 0 }),
        PositiveInteger: Type.Integer({ minimum: 0 }),
        Percentage: Type.Number({ minimum: 0, maximum: 100 }),
    },

    /**
     * Structures de données communes
     */
    Common: {
        /**
         * Structure d'identification standard
         */
        Identifier: Type.Object({
            id: Type.String({ format: 'uuid' }),
        }),

        /**
         * Métadonnées temporelles standard
         */
        Timestamps: Type.Object({
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
        }),

        /**
         * Structure de pagination standard
         */
        Pagination: Type.Object({
            page: Type.Integer({ minimum: 1, default: 1 }),
            pageSize: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
        }),

        /**
         * Structure de tri standard
         */
        Sorting: Type.Object({
            sortBy: Type.String(),
            sortOrder: Type.Union([
                Type.Literal('asc'),
                Type.Literal('desc'),
            ], { default: 'asc' }),
        }),

        /**
         * Structure de réponse paginée standard
         */
        PaginatedResponse: <T extends any>(itemSchema: T) => Type.Object({
            items: Type.Array(itemSchema),
            total: Type.Integer({ minimum: 0 }),
            page: Type.Integer({ minimum: 1 }),
            pageSize: Type.Integer({ minimum: 1 }),
            totalPages: Type.Integer({ minimum: 0 }),
        }),

        /**
         * Structure de réponse API standard
         */
        ApiResponse: <T extends any>(dataSchema: T) => Type.Object({
            success: Type.Boolean(),
            data: dataSchema,
            message: Type.Optional(Type.String()),
        }),

        /**
         * Structure d'erreur API standard
         */
        ApiError: Type.Object({
            success: Type.Literal(false),
            error: Type.Object({
                code: Type.String(),
                message: Type.String(),
                details: Type.Optional(Type.Array(Type.Object({
                    path: Type.String(),
                    message: Type.String(),
                }))),
            }),
        }),
    },

    /**
     * Crée un schéma complet avec ID et timestamps
     */
    createEntitySchema: <T extends any>(entitySchema: T) => Type.Intersect([
        entitySchema,
        StandardSchemas.Common.Identifier,
        StandardSchemas.Common.Timestamps,
    ]),
};

/**
 * Valide une valeur contre un schéma et retourne le résultat formaté
 */
export function validateSchema<T>(schema: any, value: unknown): {
    valid: boolean;
    value?: T;
    errors?: { path: string; message: string }[];
} {
    const result = TypeBoxConfig.validate(schema, value);

    if (result.success) {
        return { valid: true, value: value as T };
    }

    return {
        valid: false,
        errors: result.errors ? TypeBoxConfig.formatErrors(result.errors) : undefined,
    };
}