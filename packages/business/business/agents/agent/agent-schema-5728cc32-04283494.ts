/**
 * Schéma de validation pour la couche des agents
 */
import { z } from './zodstructure-agent';

// Schéma pour la configuration du registre des agents
const registryConfigSchema = z.object({
  manifestPath: z.string().default('./agent-manifest.json'),
  autoReloadOnChange: z.boolean().default(true),
  validateDependencies: z.boolean().default(true),
  agents: z.record(
    z.string(),
    z.object({
      enabled: z.boolean().default(true),
      priority: z.number().int().min(1).max(10).default(5),
      overrideConfig: z.record(z.string(), z.any()).optional(),
    })
  ),
});

// Schéma pour la configuration des manifestes d'agents
const manifestsConfigSchema = z.object({
  validateOnStartup: z.boolean().default(true),
  autoBackup: z.boolean().default(true),
  backupFrequency: z.number().int().positive().default(86400), // en secondes, 1 jour par défaut
  versionStrategy: z.enum(['semantic', 'timestamp', 'incremental']).default('semantic'),
});

// Schéma pour la configuration du monitoring des agents
const monitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  interval: z.number().int().positive().default(30), // en secondes
  metrics: z
    .array(z.enum(['status', 'memory', 'cpu', 'errors', 'executionTime', 'successRate']))
    .default(['status', 'errors', 'successRate']),
  alertThresholds: z
    .object({
      errorRate: z.number().min(0).max(100).default(10), // pourcentage
      executionTime: z.number().int().positive().default(10000), // en ms
      memoryUsage: z.number().int().positive().default(500), // en MB
    })
    .default({}),
  storageStrategy: z.enum(['database', 'files', 'prometheus']).default('database'),
});

// Schéma pour la fonctionnalité de circuit breaker spécifique aux agents
const circuitBreakerSchema = z.object({
  enabled: z.boolean().default(true),
  resetTimeout: z.number().int().positive(),
  failureThreshold: z.number().int().positive(),
  strategy: z
    .enum(['disableTemporarily', 'substituteAgent', 'fallbackToSimpler'])
    .default('disableTemporarily'),
});

// Schéma pour la traçabilité spécifique aux agents
const traceabilitySchema = z.object({
  enabled: z.boolean().default(true),
  idFormat: z.string(),
  storageStrategy: z.enum(['database', 'distributed', 'hybrid']),
  layer: z.literal('agents'),
});

// Schéma complet pour la configuration des agents
export const agentConfigSchema = z.object({
  registry: registryConfigSchema,
  manifests: manifestsConfigSchema,
  monitoring: monitoringConfigSchema,
  circuitBreaker: circuitBreakerSchema,
  traceability: traceabilitySchema,
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

// Valeurs par défaut pour les tests et l'initialisation
export const defaultAgentConfig: Partial<AgentConfig> = {
  registry: {
    manifestPath: './agent-manifest.json',
    autoReloadOnChange: true,
    validateDependencies: true,
    agents: {},
  },
  manifests: {
    validateOnStartup: true,
    autoBackup: true,
    backupFrequency: 86400,
    versionStrategy: 'semantic',
  },
  monitoring: {
    enabled: true,
    interval: 30,
    metrics: ['status', 'errors', 'successRate'],
    alertThresholds: {
      errorRate: 10,
      executionTime: 10000,
      memoryUsage: 500,
    },
    storageStrategy: 'database',
  },
};
