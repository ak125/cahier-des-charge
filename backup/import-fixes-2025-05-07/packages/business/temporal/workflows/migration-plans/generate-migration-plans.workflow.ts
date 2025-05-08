import { defineWorkflow } from '@temporalio/workflow';
import { z } from 'zod';
import type * as activities from '../activities/migration-plans';
import { executeActivity } from '../../utils/workflow-helpers';

// Schéma de validation pour les options de configuration
const ConfigSchema = z.object({
    phpDirectory: z.string().default('/path/to/php/sources'),
    outputPath: z.string().default('migration-plans'),
    includePatterns: z.array(z.string()).default(['**/*.php']),
    excludePatterns: z.array(z.string()).default(['**/vendor/**', '**/node_modules/**']),
    scriptsPath: z.string().default('/workspaces/cahier-des-charge/scripts/migration'),
    notificationEmail: z.string().email().default('admin@fafa.com'),
    uploadToS3: z.boolean().default(true),
    storeInSupabase: z.boolean().default(true),
});

export type MigrationPlanConfig = z.infer<typeof ConfigSchema>;

export interface MigrationPlanResult {
    fileName: string;
    wave: number;
    score: number;
    type: string;
    priority: string;
    success: boolean;
    timestamp: string;
    outputPath: string;
}

export interface MigrationPlanSummary {
    totalFiles: number;
    successCount: number;
    errorCount: number;
    outputDir: string;
    timestamp: string;
}

/**
 * Workflow Temporal pour générer des plans de migration PHP vers NestJS/Remix
 * Remplace le workflow n8n "Generate Migration Plans Workflow"
 */
export const generateMigrationPlansWorkflow = defineWorkflow(
    'generateMigrationPlans',
    async (config?: Partial<MigrationPlanConfig>) => {
        const logger = {
            info: (message: string, meta?: object) => console.log(`[INFO] ${message}`, meta || ''),
            error: (message: string, meta?: object) => console.error(`[ERROR] ${message}`, meta || ''),
        };

        try {
            // Validation de la configuration
            const validConfig = ConfigSchema.parse(config || {});
            logger.info('Démarrage du workflow de génération des plans de migration', { config: validConfig });

            // 1. Rechercher les fichiers PHP
            logger.info(`Recherche de fichiers PHP dans ${validConfig.phpDirectory}`);
            const phpFiles = await executeActivity<typeof activities.findPhpFiles>(
                'findPhpFiles',
                {
                    taskQueue: 'migration-plans-queue',
                    startToCloseTimeout: '5 minutes',
                },
                {
                    directory: validConfig.phpDirectory,
                    includePatterns: validConfig.includePatterns,
                    excludePatterns: validConfig.excludePatterns,
                }
            );

            logger.info(`${phpFiles.length} fichiers PHP trouvés`);
            if (phpFiles.length === 0) {
                return {
                    totalFiles: 0,
                    successCount: 0,
                    errorCount: 0,
                    outputDir: validConfig.outputPath,
                    timestamp: new Date().toISOString(),
                    results: [],
                };
            }

            // 2. Préparer et exécuter les commandes de génération pour chaque fichier
            const results: MigrationPlanResult[] = [];

            for (const file of phpFiles) {
                try {
                    logger.info(`Génération du plan de migration pour: ${file.path}`);

                    // 3. Exécuter la commande de génération
                    const generationResult = await executeActivity<typeof activities.generateMigrationPlan>(
                        'generateMigrationPlan',
                        {
                            taskQueue: 'migration-plans-queue',
                            startToCloseTimeout: '3 minutes',
                        },
                        {
                            filePath: file.path,
                            fileName: file.fileName,
                            scriptsPath: validConfig.scriptsPath,
                            outputDir: validConfig.outputPath,
                        }
                    );

                    // 4. Traiter les résultats
                    const processedResult = await executeActivity<typeof activities.processMigrationResult>(
                        'processMigrationResult',
                        {
                            taskQueue: 'migration-plans-queue',
                            startToCloseTimeout: '1 minute',
                        },
                        {
                            fileName: file.fileName,
                            outputPath: generationResult.outputPath,
                            output: generationResult.output,
                            timestamp: generationResult.timestamp,
                        }
                    );

                    results.push(processedResult);
                } catch (error) {
                    logger.error(`Erreur lors de la génération du plan pour ${file.path}`, { error });
                    results.push({
                        fileName: file.fileName,
                        wave: 0,
                        score: 0,
                        type: 'Erreur',
                        priority: 'Inconnue',
                        success: false,
                        timestamp: new Date().toISOString(),
                        outputPath: `${validConfig.outputPath}/${file.fileName.replace('.php', '.error.log')}`,
                    });
                }
            }

            // 5. Stocker les résultats dans Supabase si demandé
            if (validConfig.storeInSupabase) {
                await executeActivity<typeof activities.storeResultsInSupabase>(
                    'storeResultsInSupabase',
                    {
                        taskQueue: 'migration-plans-queue',
                        startToCloseTimeout: '2 minutes',
                    },
                    { results }
                );
            }

            // 6. Générer un résumé
            const successCount = results.filter((r) => r.success).length;
            const summary: MigrationPlanSummary = {
                totalFiles: results.length,
                successCount,
                errorCount: results.length - successCount,
                outputDir: validConfig.outputPath,
                timestamp: new Date().toISOString(),
            };

            // 7. Upload les résultats vers S3 si demandé
            if (validConfig.uploadToS3) {
                await executeActivity<typeof activities.uploadResultsToS3>(
                    'uploadResultsToS3',
                    {
                        taskQueue: 'migration-plans-queue',
                        startToCloseTimeout: '5 minutes',
                    },
                    {
                        outputDir: validConfig.outputPath,
                        bucketName: validConfig.outputPath.split('/').pop() || 'migration-plans',
                    }
                );
            }

            // 8. Envoyer une notification par email
            await executeActivity<typeof activities.sendNotificationEmail>(
                'sendNotificationEmail',
                {
                    taskQueue: 'migration-plans-queue',
                    startToCloseTimeout: '1 minute',
                },
                {
                    summary,
                    toEmail: validConfig.notificationEmail,
                }
            );

            // 9. Retourner le résultat final
            return {
                ...summary,
                results,
            };
        } catch (error) {
            logger.error('Erreur dans le workflow de génération des plans de migration', { error });
            throw error;
        }
    }
);