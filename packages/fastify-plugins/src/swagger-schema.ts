import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

interface SwaggerSchemaOptions {
    title?: string;
    description?: string;
    version?: string;
    routePrefix?: string;
    exposeRoute?: boolean;
    openapi?: {
        info?: {
            title?: string;
            description?: string;
            version?: string;
        };
        tags?: Array<{ name: string, description?: string }>;
        servers?: Array<{ url: string, description?: string }>;
    };
    uiConfig?: {
        docExpansion?: 'full' | 'list' | 'none';
        deepLinking?: boolean;
    };
}

/**
 * Plugin Fastify pour configurer la documentation Swagger/OpenAPI et la validation de schéma
 * 
 * Ce plugin configure Swagger pour la documentation de l'API et facilite
 * la validation automatique des schémas pour les entrées/sorties.
 */
export default fp(async function (
    fastify: FastifyInstance,
    options: FastifyPluginOptions & SwaggerSchemaOptions,
    done
) {
    const {
        title = 'MCP Server API',
        description = 'Documentation API du Model Context Protocol',
        version = '1.0.0',
        routePrefix = '/documentation',
        exposeRoute = true,
        openapi = {},
        uiConfig = {
            docExpansion: 'list',
            deepLinking: true
        }
    } = options;

    // Configuration de base de Swagger
    await fastify.register(swagger, {
        swagger: {
            info: {
                title,
                description,
                version,
                ...openapi.info
            },
            externalDocs: {
                url: 'https://github.com/votre-organisation/cahier-des-charge',
                description: 'Documentation complémentaire'
            },
            tags: openapi.tags || [
                { name: 'health', description: 'Endpoints de santé du serveur' },
                { name: 'models', description: 'API pour la gestion des modèles' },
                { name: 'workflows', description: 'API pour la gestion des workflows' }
            ],
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            servers: openapi.servers || [
                { url: 'http://localhost:3030', description: 'Local Development Server' },
                { url: 'https://mcp-api.example.com', description: 'Production Server' }
            ]
        },
        exposeRoute
    });

    // Configuration de l'interface utilisateur Swagger
    await fastify.register(swaggerUI, {
        routePrefix,
        uiConfig,
        staticCSP: true,
        transformStaticCSP: (header) => header
    });

    // Ajouter des utilitaires pour faciliter la validation de schéma
    fastify.decorate('validateSchema', function (schema) {
        return {
            schema,
            validatorCompiler: ({ schema, method, url, httpPart }) => {
                return function (data) {
                    // Vérification basique que le schéma est valide
                    const valid = fastify.validateSchema(schema, data);
                    if (!valid) {
                        return { error: new Error('Validation error') };
                    }
                    return { value: data };
                };
            }
        };
    });

    fastify.log.info(`Documentation Swagger disponible à l'adresse: ${routePrefix}`);

    done();
}, {
    name: 'fastify-swagger-schema',
    fastify: '4.x'
});