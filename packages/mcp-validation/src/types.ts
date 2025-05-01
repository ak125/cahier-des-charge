/**
 * Types fondamentaux pour la validation MCP 2.0
 */

import { z } from 'zod';

/**
 * Interface de base pour les métadonnées d'agent
 */
export const AgentMetadataSchema = z.object({
    id: z.string().min(3),
    type: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

/**
 * Statut possible d'un agent
 */
export const AgentStatusSchema = z.enum([
    'ready',
    'busy',
    'error',
    'stopped',
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/**
 * Contexte d'exécution pour un agent
 */
export const AgentContextSchema = z.object({
    jobId: z.string().uuid(),
    inputs: z.record(z.unknown()),
    timestamp: z.number().optional(),
}).passthrough();

export type AgentContext = z.infer<typeof AgentContextSchema>;

/**
 * Résultat d'exécution d'un agent
 */
export const AgentResultSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.instanceof(Error).optional(),
    metrics: z.object({
        startTime: z.number(),
        endTime: z.number(),
        duration: z.number(),
    }),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

/**
 * Événements émis par un agent
 */
export enum AgentEvent {
    STARTED = 'started',
    COMPLETED = 'completed',
    FAILED = 'failed',
    STATUS_CHANGED = 'statusChanged',
    PROGRESS = 'progress',
}