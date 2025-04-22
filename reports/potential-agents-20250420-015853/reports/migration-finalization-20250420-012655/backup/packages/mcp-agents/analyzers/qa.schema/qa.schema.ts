/**
 * Schéma ZOD pour le format .qa.json
 * Ce schéma définit la structure du fichier de sortie de l'agent QA-Analyzer
 */

import { z } from 'zod';

/**
 * Schéma pour les détails des champs d'un fichier
 */
export const FileFieldsDetailsSchema = z.object({
  php: z.object({
    formFields: z.array(z.string()).optional(),
    displayFields: z.array(z.string()).optional(),
    hiddenFields: z.array(z.string()).optional(),
  }).optional(),
  tsx: z.object({
    formFields: z.array(z.string()).optional(),
    displayFields: z.array(z.string()).optional(),
    hiddenFields: z.array(z.string()).optional(),
  }).optional(),
  prisma: z.object({
    modelFields: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Schéma pour les résultats d'un fichier analysé
 */
export const FileAnalysisResultSchema = z.object({
  matchedFields: z.array(z.string()),
  missingFields: z.array(z.string()),
  unexpectedFields: z.array(z.string()),
  score: z.number().min(0).max(100),
  status: z.enum(['success', 'partial', 'failed']),
  details: FileFieldsDetailsSchema.optional(),
});

/**
 * Schéma pour l'ensemble des résultats QA
 */
export const QaResultSchema = z.record(z.string(), FileAnalysisResultSchema);

/**
 * Type pour les résultats QA basé sur le schéma ZOD
 */
export type QaResult = z.infer<typeof QaResultSchema>;

/**
 * Type pour les résultats d'analyse de chaque fichier
 */
export type FileAnalysisResult = z.infer<typeof FileAnalysisResultSchema>;

/**
 * Configuration pour la validation QA
 */
export const QaConfigSchema = z.object({
  minScore: z.number().min(0).max(100).default(80),
  strict: z.boolean().default(true),
  generateTests: z.boolean().default(true),
  autofixMissing: z.boolean().default(false),
  checkPrisma: z.boolean().default(true),
  outputDir: z.string().default('./qa-reports'),
  prismaSchemaPath: z.string().optional(),
});

export type QaConfig = z.infer<typeof QaConfigSchema>;

/**
 * Options pour l'exécution de l'analyse QA
 */
export const QaRunOptionsSchema = z.object({
  target: z.string(),
  options: z.object({
    recursive: z.boolean().optional(),
    modelName: z.string().optional(),
    generateTests: z.boolean().optional(),
  }).optional(),
});

export type QaRunOptions = z.infer<typeof QaRunOptionsSchema>;