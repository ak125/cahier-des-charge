import { Type, Static, StandardSchemas, RestApiSchemas } from '../../../packages/schema-validation/src';

/**
 * Schémas de validation pour les agents MCP
 * Utilise la configuration standardisée TypeBox
 */

// Définition du schéma de base pour un Agent
export const AgentSchema = Type.Object({
    name: Type.String({ minLength: 3, maxLength: 100 }),
    description: StandardSchemas.Primitives.LongText,
    version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    type: Type.Union([
        Type.Literal('analyzer'),
        Type.Literal('generator'),
        Type.Literal('transformer'),
        Type.Literal('validator')
    ]),
    status: Type.Union([
        Type.Literal('active'),
        Type.Literal('inactive'),
        Type.Literal('deprecated')
    ], { default: 'active' }),
    configuration: Type.Record(Type.String(), Type.Unknown()),
    capabilities: Type.Array(Type.String()),
    lastExecution: Type.Optional(StandardSchemas.Primitives.DateTime),
    executionCount: StandardSchemas.Primitives.PositiveInteger,
    averageExecutionTimeMs: Type.Optional(StandardSchemas.Primitives.PositiveNumber),
}, {
    $id: 'Agent'
});

// Types TypeScript générés automatiquement
export type Agent = Static<typeof AgentSchema>;

// Création des schémas CRUD pour l'API
export const AgentApiSchemas = RestApiSchemas.createCrudSchemas(AgentSchema, 'Agent');

// Schéma spécifique pour l'exécution d'un agent
export const ExecuteAgentRequestSchema = Type.Object({
    agentId: StandardSchemas.Primitives.UUID,
    input: Type.Record(Type.String(), Type.Unknown()),
    options: Type.Optional(Type.Object({
        timeout: Type.Optional(Type.Number({ minimum: 1000, maximum: 300000, default: 60000 })),
        priority: Type.Optional(Type.Number({ minimum: 1, maximum: 10, default: 5 })),
        synchronous: Type.Optional(Type.Boolean({ default: false })),
    })),
}, {
    $id: 'ExecuteAgentRequest'
});

export const ExecuteAgentResponseSchema = Type.Object({
    executionId: StandardSchemas.Primitives.UUID,
    status: Type.Union([
        Type.Literal('pending'),
        Type.Literal('processing'),
        Type.Literal('completed'),
        Type.Literal('failed')
    ]),
    result: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    startTime: StandardSchemas.Primitives.DateTime,
    endTime: Type.Optional(StandardSchemas.Primitives.DateTime),
    executionTimeMs: Type.Optional(Type.Number()),
    error: Type.Optional(Type.String()),
}, {
    $id: 'ExecuteAgentResponse'
});