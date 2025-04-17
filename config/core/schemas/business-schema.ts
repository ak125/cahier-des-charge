/**
 * Schéma de validation pour la couche métier
 */
import { z } from 'zod';

// Schéma pour la configuration des migrations
const migrationsConfigSchema = z.object({
  manifestPath: z.string().default('./MCPManifest.json'),
  autoSync: z.boolean().default(true),
  sourceBasePath: z.string(),
  targetBasePath: z.string(),
  progressTracking: z.object({
    enabled: z.boolean().default(true),
    statusUpdateFrequency: z.number().int().positive().default(60), // en secondes
    detailedLogs: z.boolean().default(true)
  }).default({}),
  validation: z.object({
    requiredSteps: z.array(z.string()).default([
      'qa-analyzer', 
      'seo-analyzer', 
      'typescript-check'
    ]),
    minimumScores: z.record(z.string(), z.number().min(0).max(100)).default({
      'qa-analyzer': 80,
      'seo-analyzer': 85
    })
  }).default({})
});

// Schéma pour la configuration des domaines fonctionnels
const domainsConfigSchema = z.object({
  discoveryMapPath: z.string().default('./discovery_map.json'),
  autoDetect: z.boolean().default(true),
  prioritization: z.object({
    factors: z.array(z.enum([
      'complexity', 
      'dependencies', 
      'businessValue', 
      'effort'
    ])).default(['businessValue', 'effort']),
    customWeights: z.record(z.string(), z.number().min(0).max(10)).optional()
  }).default({})
});

// Schéma pour la configuration des règles métier
const rulesConfigSchema = z.object({
  rulesPath: z.string().default('./rules'),
  evaluationStrategy: z.enum(['strict', 'flexible', 'adaptive']).default('adaptive'),
  rulesets: z.record(z.string(), z.object({
    enabled: z.boolean().default(true),
    priority: z.number().int().min(1).max(10).default(5),
    failureAction: z.enum([
      'abort', 
      'warn', 
      'log', 
      'retry', 
      'handleGracefully'
    ]).default('warn')
  }))
});

// Schéma pour la fonctionnalité de circuit breaker spécifique au métier
const circuitBreakerSchema = z.object({
  enabled: z.boolean().default(true),
  resetTimeout: z.number().int().positive(),
  failureThreshold: z.number().int().positive(),
  strategy: z.enum(['isolateDomain', 'skipValidation', 'revertToSafeState']).default('isolateDomain')
});

// Schéma pour la traçabilité spécifique au métier
const traceabilitySchema = z.object({
  enabled: z.boolean().default(true),
  idFormat: z.string(),
  storageStrategy: z.enum(['database', 'distributed', 'hybrid']),
  layer: z.literal('business')
});

// Schéma complet pour la configuration métier
export const businessConfigSchema = z.object({
  migrations: migrationsConfigSchema,
  domains: domainsConfigSchema,
  rules: rulesConfigSchema,
  circuitBreaker: circuitBreakerSchema,
  traceability: traceabilitySchema
});

export type BusinessConfig = z.infer<typeof businessConfigSchema>;

// Valeurs par défaut pour les tests et l'initialisation
export const defaultBusinessConfig: Partial<BusinessConfig> = {
  migrations: {
    manifestPath: './MCPManifest.json',
    autoSync: true,
    sourceBasePath: '/apps/backend/src/pages',
    targetBasePath: '/apps/frontend/app/routes',
    progressTracking: {
      enabled: true,
      statusUpdateFrequency: 60,
      detailedLogs: true
    },
    validation: {
      requiredSteps: ['qa-analyzer', 'seo-analyzer', 'typescript-check'],
      minimumScores: {
        'qa-analyzer': 80,
        'seo-analyzer': 85
      }
    }
  },
  domains: {
    discoveryMapPath: './discovery_map.json',
    autoDetect: true,
    prioritization: {
      factors: ['businessValue', 'effort']
    }
  },
  rules: {
    rulesPath: './rules',
    evaluationStrategy: 'adaptive',
    rulesets: {}
  }
};