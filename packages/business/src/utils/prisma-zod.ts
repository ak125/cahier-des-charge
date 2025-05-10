import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Type d'extension Prisma avec validation Zod
 */
export type PrismaZodExtension = {
    // Extensions pour chaque modèle (User, Post, etc.)
    $extensions: {
        validateCreate: <T>(schema: z.ZodSchema<T>, data: any) => Promise<T>;
        validateUpdate: <T>(schema: z.ZodSchema<T>, data: any) => Promise<T>;
        validateRead: <T>(schema: z.ZodSchema<T>, data: any) => Promise<T>;
    };
    // Extensions pour chaque opération (create, update, etc.)
    $allExtensions: {
        validateInput: <T>(schema: z.ZodSchema<T>, data: any) => Promise<T>;
        validateOutput: <T>(schema: z.ZodSchema<T>, data: any) => Promise<T>;
    };
};

/**
 * Configuration de l'extension PrismaZod
 */
export type PrismaZodOptions = {
    /** Activer la validation des entrées */
    validateInput?: boolean;
    /** Activer la validation des sorties */
    validateOutput?: boolean;
    /** Logger les erreurs de validation au lieu de les lever */
    logErrors?: boolean;
    /** Fonction de journalisation pour les erreurs */
    logger?: (message: string, metadata?: any) => void;
};

/**
 * Crée une instance PrismaClient étendue avec la validation Zod
 * 
 * @param prisma - Instance de PrismaClient à étendre
 * @param options - Options de configuration
 * @returns Instance de PrismaClient étendue
 * 
 * @example
 * ```typescript
 * // Dans prisma.service.ts
 * import { PrismaClient } from '@prisma/client';
 * import { Injectable, OnModuleInit } from '@nestjs/common';
 * import { extendPrismaWithZod } from ..@cahier-des-charge/coordination/src/utils/prisma-zod';
 * 
 * @Injectable()
 * export class PrismaService extends PrismaClient implements OnModuleInit {
 *   constructor() {
 *     super();
 *     extendPrismaWithZod(this);
 *   }
 *   
 *   async onModuleInit() {
 *     await this.$connect();
 *   }
 * }
 * ```
 * 
 * // Dans un service
 * ```typescript
 * async createUser(data: CreateUserDto) {
 *   // Valide automatiquement par rapport au schéma Zod
 *   return this.prisma.user.create({
 *     data: await this.prisma.$extensions.validateCreate(CreateUserSchema, data),
 *   });
 * }
 * ```
 */
export function extendPrismaWithZod(
    prisma: PrismaClient,
    options: PrismaZodOptions = {}
) {
    const {
        validateInput = true,
        validateOutput = true,
        logErrors = false,
        logger = console.error,
    } = options;

    // Extension globale pour valider les entrées et sorties
    return prisma.$extends({
        name: 'prismaZod',
        query: {
            $allOperations: async ({ args, query, model, operation }) => {
                let validatedArgs = args;

                // Validation d'entrée pour les opérations de création/mise à jour
                if (validateInput && ['create', 'update', 'upsert'].includes(operation)) {
                    try {
                        const schema = await getSchemaForModel(model, operation);
                        if (schema) {
                            // Pour l'opération upsert, valider à la fois create et update
                            if (operation === 'upsert') {
                                if (args.create) {
                                    const createSchema = await getSchemaForModel(model, 'create');
                                    if (createSchema) {
                                        args.create = await validateData(createSchema, args.create, logErrors, logger);
                                    }
                                }
                                if (args.update) {
                                    const updateSchema = await getSchemaForModel(model, 'update');
                                    if (updateSchema) {
                                        args.update = await validateData(updateSchema, args.update, logErrors, logger);
                                    }
                                }
                            } else {
                                // Valider les données pour create et update
                                if (args.data) {
                                    args.data = await validateData(schema, args.data, logErrors, logger);
                                }
                            }
                        }
                    } catch (error) {
                        logger(`Erreur de validation ${model}.${operation}:`, error);
                        if (!logErrors) {
                            throw error;
                        }
                    }
                }

                // Exécuter la requête avec les arguments validés
                const result = await query(validatedArgs);

                // Validation de sortie
                if (validateOutput && result) {
                    try {
                        const schema = await getSchemaForModel(model, 'read');
                        if (schema) {
                            // Valider le résultat (singleton ou array)
                            if (Array.isArray(result)) {
                                for (const item of result) {
                                    await validateData(schema, item, logErrors, logger);
                                }
                            } else {
                                await validateData(schema, result, logErrors, logger);
                            }
                        }
                    } catch (error) {
                        logger(`Erreur de validation de la sortie ${model}.${operation}:`, error);
                        if (!logErrors) {
                            throw error;
                        }
                    }
                }

                return result;
            },
        },
        // Extensions de client pour les validations manuelles
        client: {
            $extensions: {
                validateCreate: async <T>(schema: z.ZodSchema<T>, data: any): Promise<T> => {
                    return validateData(schema, data, logErrors, logger);
                },
                validateUpdate: async <T>(schema: z.ZodSchema<T>, data: any): Promise<T> => {
                    return validateData(schema, data, logErrors, logger);
                },
                validateRead: async <T>(schema: z.ZodSchema<T>, data: any): Promise<T> => {
                    return validateData(schema, data, logErrors, logger);
                },
            },
        },
    });
}

/**
 * Charge dynamiquement un schéma Zod pour un modèle et une opération
 */
async function getSchemaForModel(
    model: string | undefined,
    operation: string
): Promise<z.ZodSchema | null> {
    if (!model) return null;

    try {
        // Tentative de chargement dynamique du schéma
        const modelSchemas = await import(`../../src/generated/zod/models/${model}`);

        switch (operation) {
            case 'create':
                return modelSchemas[`Create${model}Schema`] || null;
            case 'update':
                return modelSchemas[`Update${model}Schema`] || null;
            case 'read':
            default:
                return modelSchemas[`${model}Schema`] || null;
        }
    } catch (error) {
        console.warn(`Schéma non trouvé pour ${model}.${operation}`);
        return null;
    }
}

/**
 * Valide les données avec un schéma Zod
 */
async function validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    logErrors: boolean,
    logger: (message: string, metadata?: any) => void
): Promise<T> {
    try {
        return await schema.parseAsync(data);
    } catch (error) {
        logger('Erreur de validation:', error);
        if (!logErrors) {
            throw error;
        }
        return data as T;
    }
}
