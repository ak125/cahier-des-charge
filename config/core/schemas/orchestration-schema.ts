/**
 * Schéma de validation pour la couche d'orchestration
 */
import { z } from 'zod';

// Schéma pour la configuration n8n
const n8nConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  webhookPath: z.string().default('/webhook/'),
  workflows: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    active: z.boolean().default(true),
    priority: z.number().int().min(1).max(10).default(5),
    retryOnFail: z.boolean().default(true),
    maxRetries: z.number().int().min(0).max(10).default(3)
  }))
});

// Schéma pour la configuration BullMQ
const bullMQConfigSchema = z.object({
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().positive().default(6379),
    password: z.string().optional()
  }),
  queues: z.record(z.string(), z.object({
    name: z.string(),
    options: z.object({
      attempts: z.number().int().min(1).default(3),
      backoff: z.object({
        type: z.enum(['fixed', 'exponential']).default('exponential'),
        delay: z.number().int().positive().default(1000)
      }).default({}),
      removeOnComplete: z.boolean().default(false),
      removeOnFail: z.boolean().default(false)
    }).default({})
  }))
});

// Schéma pour la configuration des scripts shell
const shellScriptsConfigSchema = z.object({
  basePath: z.string().default('/scripts'),
  environment: z.record(z.string(), z.string()).optional(),
  scripts: z.record(z.string(), z.object({
    path: z.string(),
    description: z.string().optional(),
    args: z.array(z.string()).optional(),
    timeout: z.number().int().positive().default(300),
    autoRetry: z.boolean().default(false),
    maxRetries: z.number().int().min(0).max(5).default(2)
  }))
});

// Schéma pour la fonctionnalité de circuit breaker spécifique à l'orchestration
const circuitBreakerSchema = z.object({
  enabled: z.boolean().default(true),
  resetTimeout: z.number().int().positive(),
  failureThreshold: z.number().int().positive(),
  strategy: z.enum(['isolateWorkflow', 'pauseQueue', 'redirectToBackup']).default('isolateWorkflow')
});

// Schéma pour la traçabilité spécifique à l'orchestration
const traceabilitySchema = z.object({
  enabled: z.boolean().default(true),
  idFormat: z.string(),
  storageStrategy: z.enum(['database', 'distributed', 'hybrid']),
  layer: z.literal('orchestration')
});

// Schéma complet pour la configuration d'orchestration
export const orchestrationConfigSchema = z.object({
  n8n: n8nConfigSchema,
  bullMQ: bullMQConfigSchema,
  shellScripts: shellScriptsConfigSchema,
  circuitBreaker: circuitBreakerSchema,
  traceability: traceabilitySchema
});

export type OrchestrationConfig = z.infer<typeof orchestrationConfigSchema>;

// Valeurs par défaut pour les tests et l'initialisation
export const defaultOrchestrationConfig: Partial<OrchestrationConfig> = {
  n8n: {
    baseUrl: 'http://localhost:5678',
    webhookPath: '/webhook/',
    workflows: {}
  },
  bullMQ: {
    redis: {
      host: 'localhost',
      port: 6379
    },
    queues: {}
  },
  shellScripts: {
    basePath: '/scripts',
    scripts: {}
  }
};