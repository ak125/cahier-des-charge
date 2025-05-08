/**
 * Schémas et types MCP avec validation Zod
 * Suivant les standards définis dans le document de standardisation des technologies
 */
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schéma d'outil MCP
export const MCPToolSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    returns: z.any().optional(),
});

// Schéma d'agent MCP
export const MCPAgentSchema = z.object({
    id: z.string(),
    name: z.string(),
    capabilities: z.array(z.string()).optional(),
    version: z.string().optional(),
});

// Schéma de session MCP
export const MCPSessionSchema = z.object({
    id: z.string().uuid(),
    history: z.array(z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// Schéma d'entrée MCP
export const MCPInputSchema = z.object({
    query: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
    format: z.enum(['text', 'json', 'markdown', 'html']).default('text'),
});

// Schéma de sécurité MCP
export const MCPSecuritySchema = z.object({
    accessToken: z.string().optional(),
    permissions: z.array(z.string()).optional(),
}).optional();

// Schéma de traçage MCP
export const MCPTracingSchema = z.object({
    traceId: z.string().optional(),
    spanId: z.string().optional(),
    parentId: z.string().optional(),
    sampled: z.boolean().default(true),
}).optional();

// Schéma principal du contexte MCP
export const MCPContextSchema = z.object({
    requestId: z.string().uuid(),
    timestamp: z.string().datetime(),
    version: z.string().default('2.0'),
    agent: MCPAgentSchema,
    session: MCPSessionSchema,
    input: MCPInputSchema,
    tools: z.array(MCPToolSchema).optional(),
    contextData: z.record(z.string(), z.any()).optional(),
    security: MCPSecuritySchema,
    tracing: MCPTracingSchema,
});

// Types inférés à partir des schémas Zod
export type MCPTool = z.infer<typeof MCPToolSchema>;
export type MCPAgent = z.infer<typeof MCPAgentSchema>;
export type MCPSession = z.infer<typeof MCPSessionSchema>;
export type MCPInput = z.infer<typeof MCPInputSchema>;
export type MCPSecurity = z.infer<typeof MCPSecuritySchema>;
export type MCPTracing = z.infer<typeof MCPTracingSchema>;
export type MCPContext = z.infer<typeof MCPContextSchema>;

// Types pour les réponses MCP
export interface MCPResponse {
    requestId: string;
    timestamp: string;
    agent: {
        id: string;
        name: string;
        version?: string;
    };
    session: string;
    result: any;
    status: 'success';
    tracing?: MCPTracing;
}

export interface MCPErrorResponse {
    requestId: string;
    timestamp: string;
    agent: {
        id: string;
        name: string;
        version?: string;
    };
    session: string;
    error: {
        message: string;
        code: string;
    };
    status: 'error';
    tracing?: MCPTracing;
}

// Fonction utilitaire pour créer un contexte MCP vide
export function createEmptyMCPContext(): MCPContext {
    const now = new Date();
    const requestId = uuidv4();
    const sessionId = uuidv4();

    return {
        requestId,
        timestamp: now.toISOString(),
        version: '2.0',
        agent: {
            id: 'unknown',
            name: 'unknown'
        },
        session: {
            id: sessionId
        },
        input: {
            query: '',
            format: 'text'
        }
    };
}

// Fonction utilitaire pour valider un contexte MCP
export function validateMCPContext(context: unknown): { valid: boolean; errors?: string[] } {
    const result = MCPContextSchema.safeParse(context);

    if (result.success) {
        return { valid: true };
    } else {
        return {
            valid: false,
            errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
    }
}