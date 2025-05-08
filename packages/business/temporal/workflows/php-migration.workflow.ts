/**
 * php-migration.workflow.ts
 * 
 * Workflow Temporal pour la migration de code PHP vers NestJS
 * Ce workflow gère l'ensemble du processus de migration, avec des étapes
 * distinctes qui sont durables et reprenables en cas d'interruption.
 */

import { defineWorkflow, executeActivity, setHandler, sleep, continueAsNew, executeChild } from '@temporalio/workflow';
import type { ConsolidatedPhpAnalyzerInput, ConsolidatedPhpAnalyzerResult } from '../types/workflow-types';
import type {
    AnalyzePhpResult,
    GenerateSchemaResult,
    GenerateNestModuleResult,
    ValidateResult,
    MigrationReportResult,
    MigrationInput
} from '../types/workflow-types';

/**
 * Workflow principal pour la migration PHP vers NestJS
 * 
 * Ce workflow gère le processus complet de migration de code PHP vers NestJS,
 * en incluant l'analyse du code source, la génération de schémas, la création
 * de modules NestJS, la validation et la génération de rapports.
 * 
 * Il est conçu pour être durable et resilient, permettant de reprendre 
 * automatiquement en cas d'interruption ou d'erreur.
 */
export const PhpToNestJsMigrationWorkflow = defineWorkflow('PhpToNestJsMigration', async (input: MigrationInput) => {
    // Configurer les logs pour le monitoring du workflow
    const logger = {
        info: (message: string) => console.log(`[INFO] ${message}`),
        warn: (message: string) => console.log(`[WARN] ${message}`),
        error: (message: string) => console.log(`[ERROR] ${message}`)
    };

    logger.info(`Démarrage du workflow de migration PHP vers NestJS: ${input.projectId}`);

    try {
        // Phase 1: Analyse du code PHP source
        // Cette phase utilise le workflow d'analyse PHP consolidé
        logger.info('Phase 1: Analyse du code PHP source via le workflow consolidé');
        
        // Préparer les paramètres pour le workflow d'analyse PHP
        const phpAnalysisInput: ConsolidatedPhpAnalyzerInput = {
            projectPath: input.sourceDir,
            outputDir: `${input.projectId}/php-analysis`,
            staticAnalysis: {
                enabled: true
            },
            complexityAnalysis: {
                enabled: true,
                calculateCyclomaticComplexity: true,
                detectDuplication: true
            },
            securityAnalysis: {
                enabled: true
            },
            fileFilters: {
                exclude: input.analysisOptions?.exclude || [],
                useSmartSelection: true
            },
            reporting: {
                format: 'json',
                includeVisualizations: false
            }
        };
        
        // Exécuter le workflow d'analyse PHP consolidé
        const analysisResult = await executeChild({
            workflowType: 'consolidatedPhpAnalyzerWorkflow',
            args: [phpAnalysisInput],
            workflowId: `php-analysis-${input.projectId}-${Date.now()}`,
            taskQueue: 'analysis-queue'
        });
        
        // Adapter le résultat au format attendu par les phases suivantes
        const adaptedAnalysisResult = {
            entityCount: analysisResult.metadata.filesAnalyzed,
            entities: [],  // À remplir avec les données extraites de analysisResult
            issues: analysisResult.staticAnalysis?.syntaxErrors || [],
            complexity: analysisResult.complexityAnalysis?.stats || {},
            securityScore: analysisResult.securityAnalysis?.score || 100
        };
        
        // Stockage intermédiaire des résultats pour permettre la reprise
        await executeActivity('saveIntermediateResult', {
            projectId: input.projectId,
            phase: 'analysis',
            result: adaptedAnalysisResult
        });
        
        logger.info(`Analyse PHP terminée: ${adaptedAnalysisResult.entityCount} entités détectées`);

        // Phase 2: Génération de schémas Prisma/TypeORM à partir des modèles PHP
        logger.info('Phase 2: Génération des schémas de données');
        const schemaResult = await executeActivity('generateDatabaseSchema', {
            taskQueue: 'schema-generation',
            startToCloseTimeout: '15 minutes'
        }, {
            projectId: input.projectId,
            analysisResult,
            targetORM: input.targetORM || 'prisma',
            options: input.schemaOptions || {}
        });

        await executeActivity('saveIntermediateResult', {
            projectId: input.projectId,
            phase: 'schema',
            result: schemaResult
        });

        logger.info(`Génération de schéma terminée: ${schemaResult.modelCount} modèles générés`);

        // Phase 3: Génération des modules NestJS
        // Cette phase transforme les contrôleurs, services et modèles PHP en structure NestJS
        logger.info('Phase 3: Génération des modules NestJS');
        const nestResult = await executeActivity('generateNestModule', {
            taskQueue: 'nest-generation',
            startToCloseTimeout: '1 hour'
        }, {
            projectId: input.projectId,
            analysisResult,
            schemaResult,
            options: input.nestOptions || {}
        });

        await executeActivity('saveIntermediateResult', {
            projectId: input.projectId,
            phase: 'nest',
            result: nestResult
        });

        logger.info(`Génération NestJS terminée: ${nestResult.moduleCount} modules générés`);

        // Phase 4: Validation du code généré avec Zod et tests unitaires
        logger.info('Phase 4: Validation du code généré');
        const validationResult = await executeActivity('validateGeneratedCode', {
            taskQueue: 'validation',
            startToCloseTimeout: '20 minutes'
        }, {
            projectId: input.projectId,
            targetDir: nestResult.outputDir,
            options: input.validationOptions || {}
        });

        await executeActivity('saveIntermediateResult', {
            projectId: input.projectId,
            phase: 'validation',
            result: validationResult
        });

        logger.info(`Validation terminée: ${validationResult.success ? 'Réussie' : 'Échec'}`);

        // Vérifier si la validation a échoué
        if (!validationResult.success) {
            if (validationResult.errors.length > 10 && input.autoRetry) {
                logger.warn(`Validation échouée avec ${validationResult.errors.length} erreurs. Tentative de correction automatique...`);

                // Correction automatique des erreurs détectées
                const fixResult = await executeActivity('autoFixGeneratedCode', {
                    taskQueue: 'auto-fix',
                    startToCloseTimeout: '30 minutes'
                }, {
                    projectId: input.projectId,
                    errors: validationResult.errors,
                    targetDir: nestResult.outputDir
                });

                // Si plus de 50% des erreurs ont été corrigées, relancer la validation
                if (fixResult.fixedCount > validationResult.errors.length / 2) {
                    logger.info(`${fixResult.fixedCount}/${validationResult.errors.length} erreurs corrigées. Relance de la validation...`);

                    // Utiliser continueAsNew pour éviter d'épuiser l'historique d'événements
                    return await continueAsNew<typeof PhpToNestJsMigrationWorkflow>({
                        ...input,
                        resumeFrom: 'validation'
                    });
                }
            }

            // Si trop d'erreurs persistent, générer un rapport d'erreur et alerter l'utilisateur
            logger.error(`La validation du code généré a échoué avec ${validationResult.errors.length} erreurs!`);
            await executeActivity('notifyMigrationIssue', {
                projectId: input.projectId,
                errors: validationResult.errors,
                phase: 'validation'
            });
        }

        // Phase 5: Génération du rapport final de migration
        logger.info('Phase 5: Génération du rapport de migration');
        const reportResult = await executeActivity('generateMigrationReport', {
            taskQueue: 'reporting',
            startToCloseTimeout: '10 minutes'
        }, {
            projectId: input.projectId,
            analysisResult,
            schemaResult,
            nestResult,
            validationResult,
            options: input.reportOptions || {}
        });

        // Notification finale
        await executeActivity('notifyMigrationComplete', {
            projectId: input.projectId,
            reportUrl: reportResult.reportUrl,
            stats: reportResult.stats
        });

        logger.info('Workflow de migration terminé avec succès');

        return {
            projectId: input.projectId,
            success: validationResult.success,
            outputDir: nestResult.outputDir,
            reportUrl: reportResult.reportUrl,
            stats: reportResult.stats
        };
    } catch (error) {
        logger.error(`Erreur dans le workflow de migration: ${error}`);

        // Notification d'erreur
        await executeActivity('notifyMigrationError', {
            projectId: input.projectId,
            error: String(error),
            phase: 'workflow'
        });

        throw error;
    }
});

/**
 * Gestionnaire de signaux pour mettre en pause le workflow
 */
setHandler('pauseMigration', async () => {
    console.log('Migration mise en pause par signal externe');
    await sleep('1 day'); // Pause artificielle
    console.log('Migration reprise après pause');
});

/**
 * Gestionnaire de signaux pour annuler le workflow
 */
setHandler('cancelMigration', async () => {
    console.log('Migration annulée par signal externe');
    throw new Error('Migration cancelled by user request');
});

/**
 * Gestionnaire de requêtes pour obtenir l'état actuel du workflow
 */
setHandler('getMigrationStatus', () => {
    // Dans un vrai workflow, on pourrait avoir une variable d'état interne
    return {
        status: 'in_progress',
        currentPhase: 'analysis',
        timestamp: Date.now()
    };
});