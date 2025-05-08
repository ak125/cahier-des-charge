/**
 * Workflow Standard de Migration IA - Temporal
 * 
 * Ce workflow standard combine les fonctionnalités des workflows précédents:
 * - ai-migration-consolidated.workflow.ts
 * - ai-migration-pipeline.workflow.ts
 * 
 * Il orchestre le pipeline complet d'analyse de code, génération de code,
 * et documentation en utilisant des modèles IA.
 */

import {
    proxyActivities,
    defineQuery,
    defineSignal,
    setHandler,
    workflowInfo,
    continueAsNew
} from '@temporalio/workflow';
import { z } from 'zod';
import type * as phpActivities from '../activities/ai-pipeline/php-analyzer-activities';
import type * as codeActivities from '../activities/ai-pipeline/code-generator-activities';
import type * as docsActivities from '../activities/ai-pipeline/docs-updater-activities';
import type * as diagnosticsActivities from '../activities/consolidated-activities';
import type * as notificationActivities from '../activities/consolidated-activities';

// Activités supplémentaires du workflow consolidé
export interface AiPipelineActivities {
    analyzePhpCode(sourcePath: string, options: any): Promise<any>;
    analyzeJavascriptCode(sourcePath: string, options: any): Promise<any>;
    analyzeSqlStructure(connectionString: string, options: any): Promise<any>;
    generateNestjsCode(analysisResults: any, options: any): Promise<string[]>;
    generateRemixCode(analysisResults: any, options: any): Promise<string[]>;
    generatePrismaSchema(sqlAnalysis: any, options: any): Promise<string[]>;
    generateDocumentation(analysisResults: any, generatedFiles: any, options: any): Promise<string>;
    sendNotification(config: AiMigrationConfig, result: WorkflowResult): Promise<boolean>;
    updateMigrationStatus(projectName: string, status: string, progress: number): Promise<void>;
}

// Types et schémas pour la configuration
export const AiMigrationConfigSchema = z.object({
    // Configuration de l'analyse PHP
    phpAnalysis: z.object({
        enabled: z.boolean().default(true),
        sourcePath: z.string().default('/workspaces/cahier-des-charge/app/legacy'),
        fileExtensions: z.array(z.string()).default(['php']),
        recursive: z.boolean().default(true),
        exclude: z.array(z.string()).default(['vendor', 'node_modules']),
        limit: z.number().optional(),
        analyzerEndpoint: z.string().optional(),
        outputDir: z.string().default('/workspaces/cahier-des-charge/reports/analysis'),
        concurrency: z.number().default(5),
        generateSummary: z.boolean().default(true)
    }).optional(),

    // Configuration de la génération de code
    codeGeneration: z.object({
        enabled: z.boolean().default(true),
        outputDir: z.string().default('/workspaces/cahier-des-charge/app/migrated'),
        framework: z.enum(['nestjs', 'remix', 'nextjs', 'prisma']).default('nestjs'),
        includeTests: z.boolean().default(true),
        aiEndpoint: z.string().optional(),
        templateDir: z.string().optional(),
        modelMapping: z.record(z.string()).optional(),
        routeMapping: z.record(z.string()).optional(),
        concurrency: z.number().default(3),
        features: z.object({
            controllers: z.boolean().default(true),
            services: z.boolean().default(true),
            models: z.boolean().default(true),
            tests: z.boolean().default(true),
            utilities: z.boolean().default(true)
        }).optional()
    }).optional(),

    // Configuration de la mise à jour de la documentation
    docsUpdate: z.object({
        enabled: z.boolean().default(true),
        outputDir: z.string().default('/workspaces/cahier-des-charge/documentation/docs/generated'),
        format: z.enum(['markdown', 'html', 'docusaurus']).default('markdown'),
        templates: z.object({
            component: z.string().optional(),
            service: z.string().optional(),
            model: z.string().optional(),
            migration: z.string().optional()
        }).optional(),
        metadata: z.object({
            projectName: z.string().default('AI Migration Pipeline'),
            version: z.string().default('1.0.0'),
            author: z.string().optional(),
            teamId: z.string().optional()
        }).optional(),
        aiEndpoint: z.string().optional(),
        concurrency: z.number().default(3)
    }).optional(),

    // Paramètres de notification
    notifications: z.object({
        emails: z.array(z.string()).optional(),
        slack: z.string().optional(),
        teams: z.string().optional(),
        notifyOnCompletion: z.boolean().default(false),
        notifyOnError: z.boolean().default(true)
    }).optional(),

    // Métadonnées
    requestId: z.string().optional(),
    teamId: z.string().optional(),
    dryRun: z.boolean().default(false)
});

export type AiMigrationConfig = z.infer<typeof AiMigrationConfigSchema>;

// États du workflow que nous stockerons et surveillerons
export interface WorkflowState {
    status: 'initializing' | 'analyzing' | 'generating' | 'documenting' | 'completed' | 'failed';
    progress: {
        currentStep: string;
        totalSteps: number;
        completedSteps: number;
        filesAnalyzed: number;
        filesGenerated: number;
        filesDocumented: number;
        startTime: string;
        endTime?: string;
        duration?: number;
    };
    results: {
        phpAnalysis?: {
            success: boolean;
            totalFiles: number;
            analyzedFiles: number;
            failedFiles: number;
            outputDir: string;
            summaryPath?: string;
            summary?: any;
        };
        codeGeneration?: {
            success: boolean;
            totalFiles: number;
            generatedFiles: number;
            failedFiles: number;
            outputDir: string;
            reportPath?: string;
            summary?: {
                byType: Record<string, number>;
                byFramework: Record<string, number>;
            };
        };
        docsUpdate?: {
            success: boolean;
            totalFiles: number;
            generatedDocs: number;
            failedDocs: number;
            outputDir: string;
            reportPath?: string;
            indexPath?: string;
            summary?: {
                byType: {
                    api: number;
                    component: number;
                    service: number;
                    model: number;
                    migration: number;
                };
            };
        };
        error?: string;
        markdownReport?: string;
        jsonSummary?: Record<string, any>;
    };
    config: AiMigrationConfig;
}

// Définition des activités à utiliser dans ce workflow
function setupActivities() {
    const phpActivitiesProxy = proxyActivities<typeof phpActivities>({
        startToCloseTimeout: '10 minutes',
        retry: {
            maximumAttempts: 3,
            initialInterval: '1 second',
        }
    });

    const codeActivitiesProxy = proxyActivities<typeof codeActivities>({
        startToCloseTimeout: '15 minutes',
        retry: {
            maximumAttempts: 2,
            initialInterval: '1 second',
        }
    });

    const docsActivitiesProxy = proxyActivities<typeof docsActivities>({
        startToCloseTimeout: '15 minutes',
        retry: {
            maximumAttempts: 2,
            initialInterval: '1 second',
        }
    });

    const diagnosticsProxy = proxyActivities<typeof diagnosticsActivities>({
        startToCloseTimeout: '1 minute'
    });

    const notificationProxy = proxyActivities<typeof notificationActivities>({
        startToCloseTimeout: '1 minute'
    });

    return {
        phpActivitiesProxy,
        codeActivitiesProxy,
        docsActivitiesProxy,
        diagnosticsProxy,
        notificationProxy
    };
}

// Définition des queries pour consulter l'état du workflow
export const getState = defineQuery<WorkflowState>('getState');
export const getStatus = defineQuery<string>('getStatus');
export const getProgress = defineQuery<WorkflowState['progress']>('getProgress');
export const getResults = defineQuery<WorkflowState['results']>('getResults');

// Définition des signaux pour contrôler le workflow
export const cancelWorkflow = defineSignal('cancelWorkflow');
export const updateConfig = defineSignal<[Partial<AiMigrationConfig>]>('updateConfig');
export const pauseWorkflow = defineSignal('pauseWorkflow');
export const resumeWorkflow = defineSignal('resumeWorkflow');

/**
 * Workflow principal du Pipeline de Migration IA
 * Consolide les fonctionnalités des deux workflows précédents
 */
export async function aiMigrationPipelineWorkflow(
    config?: Partial<AiMigrationConfig>
): Promise<WorkflowState> {
    const startTime = Date.now();

    // Initialiser l'état du workflow
    let state: WorkflowState = {
        status: 'initializing',
        progress: {
            currentStep: 'Initialisation',
            totalSteps: 4, // Initialisation, analyse, génération de code, documentation
            completedSteps: 0,
            filesAnalyzed: 0,
            filesGenerated: 0,
            filesDocumented: 0,
            startTime: new Date(startTime).toISOString(),
        },
        results: {},
        config: AiMigrationConfigSchema.parse(config || {})
    };

    // Configuration des handlers pour les queries
    setHandler(getState, () => state);
    setHandler(getStatus, () => state.status);
    setHandler(getProgress, () => state.progress);
    setHandler(getResults, () => state.results);

    // Définir des flags pour contrôler le workflow
    let cancelled = false;
    let paused = false;

    // Configuration des handlers pour les signaux
    setHandler(cancelWorkflow, () => {
        cancelled = true;
        state.status = 'failed';
        state.results.error = 'Workflow annulé par l\'utilisateur';
    });

    setHandler(updateConfig, (partialConfig) => {
        state.config = { ...state.config, ...partialConfig };
    });

    setHandler(pauseWorkflow, () => {
        paused = true;
        state.progress.currentStep = 'Workflow en pause';
    });

    setHandler(resumeWorkflow, () => {
        paused = false;
        state.progress.currentStep = 'Workflow repris';
    });

    try {
        // Initialiser les activités
        const {
            phpActivitiesProxy,
            codeActivitiesProxy,
            docsActivitiesProxy,
            diagnosticsProxy,
            notificationProxy
        } = setupActivities();

        // Enregistrer les diagnostics au démarrage
        await diagnosticsProxy.recordDiagnostics({
            workflowId: workflowInfo().workflowId,
            workflowType: workflowInfo().workflowType,
            eventType: 'workflow_started',
            details: {
                config: state.config,
                timestamp: state.progress.startTime
            }
        });

        // 1. Exécution de l'analyse PHP si activée
        let phpAnalysisResults: any[] = [];

        if (state.config.phpAnalysis?.enabled) {
            state.status = 'analyzing';
            state.progress.currentStep = 'Analyse des fichiers PHP';
            state.progress.completedSteps = 1;

            // Vérifier si le workflow est annulé
            if (cancelled) {
                throw new Error('Workflow annulé');
            }

            // Attendre si le workflow est en pause
            while (paused) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('Starting PHP analysis workflow');

            // Configuration par défaut
            const phpConfig = state.config.phpAnalysis;

            // Lister les fichiers PHP
            const phpFiles = await phpActivitiesProxy.listPhpFiles({
                path: phpConfig.sourcePath,
                fileExtensions: phpConfig.fileExtensions,
                recursive: phpConfig.recursive,
                exclude: phpConfig.exclude,
                limit: phpConfig.limit
            });

            // Analyser les fichiers PHP
            const analysisResult = await phpActivitiesProxy.batchAnalyzePhpFiles(phpFiles, {
                analyzerEndpoint: phpConfig.analyzerEndpoint,
                outputDir: phpConfig.outputDir,
                concurrency: phpConfig.concurrency
            });

            // Sauvegarder les résultats d'analyse pour les prochaines étapes
            phpAnalysisResults = analysisResult.results;

            // Générer un résumé si demandé
            let summary;
            let summaryPath;

            if (phpConfig.generateSummary && analysisResult.results.length > 0) {
                const summaryResult = await phpActivitiesProxy.generateAnalysisSummary(
                    analysisResult.results,
                    `${phpConfig.outputDir}/summary.json`
                );
                summary = summaryResult.summary;
                summaryPath = summaryResult.summaryPath;
            }

            // Mettre à jour le résultat
            state.results.phpAnalysis = {
                success: analysisResult.successful > 0,
                totalFiles: phpFiles.length,
                analyzedFiles: analysisResult.successful,
                failedFiles: analysisResult.failed,
                outputDir: phpConfig.outputDir,
                summaryPath,
                summary
            };

            state.progress.filesAnalyzed = analysisResult.successful;
        }

        // 2. Exécution de la génération de code si activée
        let codeGenerationResults: any[] = [];

        if (state.config.codeGeneration?.enabled) {
            state.status = 'generating';
            state.progress.currentStep = 'Génération du code à partir de l\'analyse PHP';
            state.progress.completedSteps = 2;

            // Vérifier si le workflow est annulé
            if (cancelled) {
                throw new Error('Workflow annulé');
            }

            // Attendre si le workflow est en pause
            while (paused) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('Starting code generation workflow');

            // Vérifier que nous avons des analyses PHP à utiliser
            if (phpAnalysisResults.length === 0 && state.config.phpAnalysis?.enabled) {
                throw new Error('No PHP analysis results available for code generation');
            }

            // Si l'analyse PHP n'est pas activée mais qu'on veut générer du code,
            // utiliser les résultats d'analyse existants
            if (phpAnalysisResults.length === 0 && !state.config.phpAnalysis?.enabled) {
                console.log('Code generation requested without PHP analysis - skipping');

                state.results.codeGeneration = {
                    success: false,
                    totalFiles: 0,
                    generatedFiles: 0,
                    failedFiles: 0,
                    outputDir: state.config.codeGeneration.outputDir
                };
            } else {
                // Configuration par défaut
                const codeConfig = {
                    outputDir: state.config.codeGeneration.outputDir,
                    framework: state.config.codeGeneration.framework,
                    includeTests: state.config.codeGeneration.includeTests,
                    aiEndpoint: state.config.codeGeneration.aiEndpoint,
                    templateDir: state.config.codeGeneration.templateDir,
                    modelMapping: state.config.codeGeneration.modelMapping,
                    routeMapping: state.config.codeGeneration.routeMapping,
                    concurrency: state.config.codeGeneration.concurrency,
                    features: state.config.codeGeneration.features
                };

                // Générer le code à partir des analyses PHP
                const codeGenResult = await codeActivitiesProxy.batchGenerateCode(
                    phpAnalysisResults,
                    codeConfig
                );

                // Sauvegarder les résultats pour l'étape de documentation
                codeGenerationResults = codeGenResult.results;

                // Générer un rapport de génération de code
                const reportResult = await codeActivitiesProxy.createCodeGenerationReport(
                    codeGenResult,
                    `${codeConfig.outputDir}/../reports/code-generation-report.md`
                );

                // Mettre à jour le résultat
                state.results.codeGeneration = {
                    success: codeGenResult.successful > 0,
                    totalFiles: codeGenResult.results.length,
                    generatedFiles: codeGenResult.successful,
                    failedFiles: codeGenResult.failed,
                    outputDir: codeConfig.outputDir,
                    reportPath: reportResult.reportPath,
                    summary: {
                        byType: codeGenResult.summary.byType,
                        byFramework: codeGenResult.summary.byFramework
                    }
                };

                state.progress.filesGenerated = codeGenResult.successful;
            }
        }

        // 3. Exécution de la mise à jour de la documentation si activée
        if (state.config.docsUpdate?.enabled) {
            state.status = 'documenting';
            state.progress.currentStep = 'Génération de la documentation';
            state.progress.completedSteps = 3;

            // Vérifier si le workflow est annulé
            if (cancelled) {
                throw new Error('Workflow annulé');
            }

            // Attendre si le workflow est en pause
            while (paused) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('Starting documentation update workflow');

            // Configuration par défaut
            const docsConfig = {
                outputDir: state.config.docsUpdate.outputDir,
                format: state.config.docsUpdate.format,
                templates: state.config.docsUpdate.templates || {},
                metadata: state.config.docsUpdate.metadata || {
                    projectName: 'AI Migration Pipeline',
                    version: '1.0.0'
                },
                aiEndpoint: state.config.docsUpdate.aiEndpoint,
                concurrency: state.config.docsUpdate.concurrency
            };

            // Préparer la liste des items pour la génération de documentation
            const docsItems = [...phpAnalysisResults];

            // Si nous avons des résultats de génération de code, les ajouter
            // à la liste des items pour la génération de documentation
            if (codeGenerationResults.filter(r => r.successfulGeneration).length > 0) {
                docsItems.push(
                    ...codeGenerationResults.filter(r => r.successfulGeneration)
                );
            }

            if (docsItems.length === 0) {
                console.log('No items available for documentation generation - skipping');

                state.results.docsUpdate = {
                    success: false,
                    totalFiles: 0,
                    generatedDocs: 0,
                    failedDocs: 0,
                    outputDir: docsConfig.outputDir,
                    summary: {
                        byType: {
                            api: 0,
                            component: 0,
                            service: 0,
                            model: 0,
                            migration: 0
                        }
                    }
                };
            } else {
                // Générer la documentation
                const docsResult = await docsActivitiesProxy.batchGenerateDocumentation(
                    docsItems,
                    docsConfig
                );

                // Créer un rapport de documentation
                const reportResult = await docsActivitiesProxy.createDocumentationReport(
                    docsResult,
                    `/workspaces/cahier-des-charge/reports/documentation-report.md`
                );

                // Mettre à jour le résultat
                state.results.docsUpdate = {
                    success: docsResult.successful > 0,
                    totalFiles: docsResult.summary.totalFiles,
                    generatedDocs: docsResult.successful,
                    failedDocs: docsResult.failed,
                    outputDir: docsConfig.outputDir,
                    reportPath: reportResult.reportPath,
                    indexPath: docsResult.indexPath,
                    summary: {
                        byType: docsResult.summary.byType
                    }
                };

                state.progress.filesDocumented = docsResult.successful;
            }
        }

        // Workflow terminé avec succès
        state.status = 'completed';
        state.progress.currentStep = 'Terminé';
        state.progress.completedSteps = state.progress.totalSteps;
        state.progress.endTime = new Date().toISOString();
        state.progress.duration = Date.now() - startTime;

        // Générer les rapports finaux
        state = generateFinalReports(state);

        // Envoyer une notification si configuré
        if (state.config.notifications?.notifyOnCompletion) {
            await notificationProxy.sendNotification({
                channels: {
                    email: state.config.notifications.emails,
                    slack: state.config.notifications.slack,
                    teams: state.config.notifications.teams
                },
                subject: 'Pipeline de Migration IA: Traitement terminé avec succès',
                message: `
                Le pipeline de migration IA a terminé avec succès.
                
                - Fichiers PHP analysés: ${state.progress.filesAnalyzed}
                - Fichiers de code générés: ${state.progress.filesGenerated}
                - Fichiers de documentation générés: ${state.progress.filesDocumented}
                
                Rapports:
                - Rapport d'analyse: ${state.results.phpAnalysis?.summaryPath || 'N/A'}
                - Rapport de génération de code: ${state.results.codeGeneration?.reportPath || 'N/A'}
                - Rapport de documentation: ${state.results.docsUpdate?.reportPath || 'N/A'}
                `,
                metadata: {
                    requestId: state.config.requestId,
                    workflowId: workflowInfo().workflowId,
                    teamId: state.config.teamId
                }
            });
        }

        // Enregistrer les diagnostics à la fin du workflow
        await diagnosticsProxy.recordDiagnostics({
            workflowId: workflowInfo().workflowId,
            workflowType: workflowInfo().workflowType,
            eventType: 'workflow_completed',
            details: {
                state,
                duration: state.progress.duration,
                timestamp: state.progress.endTime
            }
        });

    } catch (error) {
        // Gestion des erreurs
        state.status = 'failed';
        state.results.error = error instanceof Error ? error.message : String(error);
        state.progress.endTime = new Date().toISOString();
        state.progress.duration = Date.now() - startTime;

        console.error(`Workflow failed: ${state.results.error}`);

        // Générer les rapports même en cas d'erreur
        state = generateFinalReports(state);

        // Envoyer une alerte d'erreur si configuré
        if (state.config.notifications?.notifyOnError) {
            const { notificationProxy } = setupActivities();

            await notificationProxy.sendErrorAlert({
                channels: {
                    email: state.config.notifications?.emails,
                    slack: state.config.notifications?.slack,
                    teams: state.config.notifications?.teams
                },
                subject: 'Pipeline de Migration IA: Erreur pendant le traitement',
                error: state.results.error,
                details: {
                    state,
                    workflowId: workflowInfo().workflowId,
                    requestId: state.config.requestId
                }
            });
        }

        // Enregistrer les diagnostics en cas d'erreur
        const { diagnosticsProxy } = setupActivities();

        await diagnosticsProxy.recordDiagnostics({
            workflowId: workflowInfo().workflowId,
            workflowType: workflowInfo().workflowType,
            eventType: 'workflow_failed',
            details: {
                error: state.results.error,
                state,
                timestamp: state.progress.endTime
            }
        });
    }

    return state;
}

/**
 * Génère les rapports finaux pour le workflow
 */
function generateFinalReports(state: WorkflowState): WorkflowState {
    // Générer le rapport Markdown
    state.results.markdownReport = generateMarkdownReport(state);

    // Générer le résumé JSON
    state.results.jsonSummary = {
        status: state.status,
        startTime: state.progress.startTime,
        endTime: state.progress.endTime,
        duration: `${Math.floor(state.progress.duration / 60000)}m ${Math.floor((state.progress.duration % 60000) / 1000)}s`,
        stats: {
            filesAnalyzed: state.progress.filesAnalyzed,
            filesGenerated: state.progress.filesGenerated,
            filesDocumented: state.progress.filesDocumented
        },
        results: {
            phpAnalysis: state.results.phpAnalysis ? {
                success: state.results.phpAnalysis.success,
                totalFiles: state.results.phpAnalysis.totalFiles,
                analyzedFiles: state.results.phpAnalysis.analyzedFiles,
                failedFiles: state.results.phpAnalysis.failedFiles
            } : null,
            codeGeneration: state.results.codeGeneration ? {
                success: state.results.codeGeneration.success,
                totalFiles: state.results.codeGeneration.totalFiles,
                generatedFiles: state.results.codeGeneration.generatedFiles,
                failedFiles: state.results.codeGeneration.failedFiles,
                summary: state.results.codeGeneration.summary
            } : null,
            docsUpdate: state.results.docsUpdate ? {
                success: state.results.docsUpdate.success,
                totalFiles: state.results.docsUpdate.totalFiles,
                generatedDocs: state.results.docsUpdate.generatedDocs,
                failedDocs: state.results.docsUpdate.failedDocs,
                summary: state.results.docsUpdate.summary
            } : null
        },
        error: state.results.error
    };

    return state;
}

/**
 * Génère un rapport Markdown pour les résultats du workflow
 */
function generateMarkdownReport(state: WorkflowState): string {
    const durationMs = state.progress.duration || 0;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    let report = `# Rapport du Pipeline de Migration IA

## Résumé

- **Statut:** ${formatStatus(state.status)}
- **Date de début:** ${formatDate(state.progress.startTime)}
- **Date de fin:** ${formatDate(state.progress.endTime || new Date().toISOString())}
- **Durée:** ${minutes}m ${seconds}s
- **Mode simulation:** ${state.config.dryRun ? 'Oui' : 'Non'}

## Statistiques globales

- **Fichiers PHP analysés:** ${state.progress.filesAnalyzed}
- **Fichiers de code générés:** ${state.progress.filesGenerated}
- **Fichiers de documentation générés:** ${state.progress.filesDocumented}

`;

    // Ajouter la section d'analyse PHP si disponible
    if (state.results.phpAnalysis) {
        report += `## Analyse PHP

- **Statut:** ${state.results.phpAnalysis.success ? '✅ Succès' : '❌ Échec'}
- **Total des fichiers:** ${state.results.phpAnalysis.totalFiles}
- **Fichiers analysés avec succès:** ${state.results.phpAnalysis.analyzedFiles}
- **Fichiers avec erreurs:** ${state.results.phpAnalysis.failedFiles}
- **Répertoire de sortie:** \`${state.results.phpAnalysis.outputDir}\`
${state.results.phpAnalysis.summaryPath ? `- **Chemin du résumé:** \`${state.results.phpAnalysis.summaryPath}\`\n` : ''}

`;
    }

    // Ajouter la section de génération de code si disponible
    if (state.results.codeGeneration) {
        report += `## Génération de code

- **Statut:** ${state.results.codeGeneration.success ? '✅ Succès' : '❌ Échec'}
- **Total des fichiers:** ${state.results.codeGeneration.totalFiles}
- **Fichiers générés avec succès:** ${state.results.codeGeneration.generatedFiles}
- **Fichiers avec erreurs:** ${state.results.codeGeneration.failedFiles}
- **Répertoire de sortie:** \`${state.results.codeGeneration.outputDir}\`
${state.results.codeGeneration.reportPath ? `- **Chemin du rapport:** \`${state.results.codeGeneration.reportPath}\`\n` : ''}

`;

        // Ajouter des détails sur les types de fichiers si disponible
        if (state.results.codeGeneration.summary?.byType) {
            report += "### Types de fichiers générés\n\n";

            for (const [type, count] of Object.entries(state.results.codeGeneration.summary.byType)) {
                report += `- **${type}:** ${count}\n`;
            }

            report += "\n";
        }

        // Ajouter des détails sur les frameworks si disponible
        if (state.results.codeGeneration.summary?.byFramework) {
            report += "### Fichiers par framework\n\n";

            for (const [framework, count] of Object.entries(state.results.codeGeneration.summary.byFramework)) {
                report += `- **${framework}:** ${count}\n`;
            }

            report += "\n";
        }
    }

    // Ajouter la section de documentation si disponible
    if (state.results.docsUpdate) {
        report += `## Documentation

- **Statut:** ${state.results.docsUpdate.success ? '✅ Succès' : '❌ Échec'}
- **Total des fichiers:** ${state.results.docsUpdate.totalFiles}
- **Documents générés avec succès:** ${state.results.docsUpdate.generatedDocs}
- **Documents avec erreurs:** ${state.results.docsUpdate.failedDocs}
- **Répertoire de sortie:** \`${state.results.docsUpdate.outputDir}\`
${state.results.docsUpdate.reportPath ? `- **Chemin du rapport:** \`${state.results.docsUpdate.reportPath}\`\n` : ''}
${state.results.docsUpdate.indexPath ? `- **Page d'index:** \`${state.results.docsUpdate.indexPath}\`\n` : ''}

`;

        // Ajouter des détails sur les types de documentation si disponible
        if (state.results.docsUpdate.summary?.byType) {
            report += "### Types de documentation générés\n\n";

            for (const [type, count] of Object.entries(state.results.docsUpdate.summary.byType)) {
                report += `- **${type}:** ${count}\n`;
            }

            report += "\n";
        }
    }

    // Ajouter la section d'erreur si applicable
    if (state.results.error) {
        report += `## Erreur

\`\`\`
${state.results.error}
\`\`\`

`;
    }

    return report;
}

// Fonction pour formater une date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Fonction pour formater le statut
function formatStatus(status: string): string {
    switch (status) {
        case 'completed': return '✅ Terminé';
        case 'failed': return '❌ Échoué';
        case 'analyzing': return '🔍 Analyse en cours';
        case 'generating': return '⚙️ Génération en cours';
        case 'documenting': return '📝 Documentation en cours';
        case 'initializing': return '🚀 Initialisation';
        default: return status;
    }
}

/**
 * Version simplifiée du workflow qui n'effectue que l'analyse PHP
 */
export async function phpAnalyzerWorkflow(
    input: {
        sourcePath: string;
        fileExtensions?: string[];
        recursive?: boolean;
        exclude?: string[];
        limit?: number;
        analyzerEndpoint?: string;
        outputDir?: string;
        concurrency?: number;
        generateSummary?: boolean;
    }
): Promise<WorkflowState['results']['phpAnalysis']> {
    // Utiliser le workflow principal avec uniquement l'analyse PHP activée
    const result = await aiMigrationPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            ...input
        },
        codeGeneration: {
            enabled: false
        },
        docsUpdate: {
            enabled: false
        }
    });

    return result.results.phpAnalysis;
}

/**
 * Version simplifiée du workflow qui n'effectue que la génération de code
 */
export async function codeGeneratorWorkflow(
    input: {
        // Source PHP à utiliser
        phpSourcePath: string;
        // Configuration de génération
        outputDir?: string;
        framework?: 'nestjs' | 'remix' | 'nextjs' | 'prisma';
        includeTests?: boolean;
        templateDir?: string;
    }
): Promise<WorkflowState['results']['codeGeneration']> {
    // Utiliser le workflow principal avec analyse PHP et génération de code activées
    const result = await aiMigrationPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            sourcePath: input.phpSourcePath
        },
        codeGeneration: {
            enabled: true,
            outputDir: input.outputDir,
            framework: input.framework as any,
            includeTests: input.includeTests,
            templateDir: input.templateDir
        },
        docsUpdate: {
            enabled: false
        }
    });

    return result.results.codeGeneration;
}

/**
 * Version simplifiée du workflow qui n'effectue que la génération de documentation
 */
export async function docsGeneratorWorkflow(
    input: {
        // Source PHP à utiliser
        phpSourcePath: string;
        // Génération de code à inclure
        includeGeneratedCode?: boolean;
        codeOutputDir?: string;
        framework?: 'nestjs' | 'remix' | 'nextjs' | 'prisma';
        // Configuration de documentation
        docsOutputDir?: string;
        format?: 'markdown' | 'html' | 'docusaurus';
        projectName?: string;
        version?: string;
    }
): Promise<WorkflowState['results']['docsUpdate']> {
    // Utiliser le workflow principal avec toutes les étapes
    const result = await aiMigrationPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            sourcePath: input.phpSourcePath
        },
        codeGeneration: {
            enabled: input.includeGeneratedCode !== false,
            outputDir: input.codeOutputDir,
            framework: input.framework as any
        },
        docsUpdate: {
            enabled: true,
            outputDir: input.docsOutputDir,
            format: input.format as any,
            metadata: {
                projectName: input.projectName || 'AI Migration Pipeline',
                version: input.version || '1.0.0'
            }
        }
    });

    return result.results.docsUpdate;
}

// Exportations pour la compatibilité avec l'ancien workflow
export const aiMigrationConsolidatedWorkflow = aiMigrationPipelineWorkflow;

/**
 * Note de consolidation:
 * Ce workflow est le résultat de la consolidation des workflows suivants:
 * - ai-migration-consolidated.workflow.ts (simplifié)
 * - ai-migration-pipeline.workflow.ts (complet)
 * 
 * Il est recommandé d'utiliser ce workflow pour toutes les nouvelles intégrations.
 * Les exportations pour la compatibilité garantissent que les intégrations existantes
 * continueront de fonctionner.
 */
