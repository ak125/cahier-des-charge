/**
 * Générateur OpenAPI 3.1 avec TypeBox
 * 
 * Ce module fournit des utilitaires pour générer des spécifications OpenAPI 3.1
 * en utilisant TypeBox pour la validation des schémas.
 */

import { Type, Static } from '@sinclair/typebox';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { OpenAPIRegistry } from '@asteasolutions/openapi3-ts';
import { OpenApiGeneratorV31 } from '@asteasolutions/openapi3-ts/dist/openapi31';

/**
 * Options pour la génération de documentation OpenAPI
 */
export interface OpenApiOptions {
    title: string;
    version: string;
    description?: string;
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    tags?: Array<{
        name: string;
        description?: string;
    }>;
    securitySchemes?: Record<string, any>;
}

/**
 * Générateur de documentation OpenAPI 3.1 basé sur TypeBox
 */
export class OpenApiGenerator {
    private readonly registry: OpenAPIRegistry;
    private readonly options: OpenApiOptions;
    private readonly ajv: Ajv;

    /**
     * Constructeur du générateur OpenAPI
     * @param options Options de configuration
     */
    constructor(options: OpenApiOptions) {
        this.options = options;
        this.registry = new OpenAPIRegistry();
        this.ajv = new Ajv({ strict: true });
        addFormats(this.ajv);
    }

    /**
     * Enregistre un schéma dans le registre OpenAPI
     * @param name Nom du schéma
     * @param schema Schéma TypeBox
     * @returns Le schéma enregistré
     */
    registerSchema<T>(name: string, schema: T) {
        return this.registry.register(name, schema as any);
    }

    /**
     * Enregistre un modèle de paramètre
     * @param name Nom du modèle de paramètre
     * @param schema Schéma TypeBox
     * @param location Emplacement du paramètre (query, path, header, cookie)
     * @returns Le paramètre enregistré
     */
    registerParameter(name: string, schema: any, location: 'query' | 'path' | 'header' | 'cookie') {
        return this.registry.registerParameter({
            name,
            in: location,
            required: location === 'path' ? true : false,
            schema: schema as any
        });
    }

    /**
     * Enregistre un tag pour regrouper les opérations
     * @param name Nom du tag
     * @param description Description du tag
     */
    registerTag(name: string, description?: string) {
        this.registry.registerTag({
            name,
            description
        });
    }

    /**
     * Enregistre une route API complète
     * @param path Chemin de la route
     * @param method Méthode HTTP
     * @param options Options de la route
     * @returns L'opération enregistrée
     */
    registerRoute(path: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options',
        options: {
            operationId: string;
            summary: string;
            description?: string;
            tags?: string[];
            requestBody?: any;
            requestContentType?: string;
            responses: Record<string, {
                description: string;
                content?: Record<string, {
                    schema: any;
                }>;
            }>;
            parameters?: any[];
            security?: Array<Record<string, string[]>>;
        }) {

        const operation = this.registry.registerPath({
            method,
            path,
            operationId: options.operationId,
            summary: options.summary,
            description: options.description,
            tags: options.tags,
            parameters: options.parameters,
            security: options.security,
            requestBody: options.requestBody ? {
                content: {
                    [options.requestContentType || 'application/json']: {
                        schema: options.requestBody
                    }
                },
                required: true
            } : undefined,
            responses: Object.entries(options.responses).reduce((acc, [code, response]) => {
                acc[code] = {
                    description: response.description,
                    content: response.content
                };
                return acc;
            }, {} as any)
        });

        return operation;
    }

    /**
     * Génère un validateur pour un schéma TypeBox
     * @param schema Schéma TypeBox
     * @returns Fonction de validation
     */
    createValidator<T>(schema: T) {
        const validate = this.ajv.compile(schema as any);

        return (data: any): { valid: boolean; errors?: string[] } => {
            const isValid = validate(data);
            if (isValid) {
                return { valid: true };
            }

            const errors = validate.errors?.map(err =>
                `${err.instancePath} ${err.message}`
            ) || [];

            return {
                valid: false,
                errors
            };
        };
    }

    /**
     * Génère la documentation OpenAPI complète
     * @returns Document OpenAPI 3.1
     */
    generateOpenApiDocument() {
        const generator = new OpenApiGeneratorV31(this.registry.definitions);

        return generator.generateDocument({
            openapi: '3.1.0',
            info: {
                title: this.options.title,
                version: this.options.version,
                description: this.options.description
            },
            servers: this.options.servers,
            tags: this.options.tags,
            components: {
                securitySchemes: this.options.securitySchemes
            }
        });
    }
}

/**
 * Crée une instance du générateur OpenAPI avec les options par défaut
 * @param options Options de configuration OpenAPI
 * @returns Instance du générateur OpenAPI
 */
export function createOpenApiGenerator(options: OpenApiOptions) {
    return new OpenApiGenerator(options);
}

/**
 * Exemple d'utilisation:
 * 
 * ```typescript
 * // Définition des schémas avec TypeBox
 * const UserSchema = Type.Object({
 *   id: Type.String({ format: 'uuid' }),
 *   name: Type.String(),
 *   email: Type.String({ format: 'email' }),
 *   age: Type.Optional(Type.Number({ minimum: 18 }))
 * });
 * 
 * // Création du générateur
 * const generator = createOpenApiGenerator({
 *   title: 'API Utilisateurs',
 *   version: '1.0.0',
 *   description: 'API pour gérer les utilisateurs',
 *   servers: [{ url: 'http://localhost:3000', description: 'Serveur de développement' }]
 * });
 * 
 * // Enregistrement des schémas
 * const UserRef = generator.registerSchema('User', UserSchema);
 * 
 * // Enregistrement d'un endpoint
 * generator.registerRoute('/users/{id}', 'get', {
 *   operationId: 'getUser',
 *   summary: 'Récupère un utilisateur par son ID',
 *   tags: ['Users'],
 *   parameters: [
 *     generator.registerParameter('id', Type.String({ format: 'uuid' }), 'path')
 *   ],
 *   responses: {
 *     '200': {
 *       description: 'Utilisateur trouvé',
 *       content: {
 *         'application/json': {
 *           schema: UserRef
 *         }
 *       }
 *     },
 *     '404': {
 *       description: 'Utilisateur non trouvé'
 *     }
 *   }
 * });
 * 
 * // Génération du document OpenAPI
 * const openApiDoc = generator.generateOpenApiDocument();
 * ```
 */

// Types exportés
export { Type } from '@sinclair/typebox';
export type { Static } from '@sinclair/typebox';