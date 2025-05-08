/**
 * Workflow Temporal pour le Pipeline de Migration IA
 * 
 * Ce workflow remplace le workflow n8n "Pipeline de Migration IA"
 * qui était utilisé pour analyser les fichiers PHP et générer du code.
 */

import { proxyActivities } from '@temporalio/workflow';
import type * as phpActivities from '../activities/ai-pipeline/php-analyzer-activities';
import type * as codeActivities from '../activities/ai-pipeline/code-generator-activities';
import type * as docsActivities from '../activities/ai-pipeline/docs-updater-activities';

// Types pour le workflow
export interface AiPipelineWorkflowInput {
    // Configuration de l'analyse PHP
    phpAnalysis?: {
        enabled: boolean;
        sourcePath: string;
        fileExtensions: string[];
        recursive?: boolean;
        exclude?: string[];
        limit?: number;
        analyzerEndpoint?: string;
        outputDir?: string;
        concurrency?: number;
        generateSummary?: boolean;
    };

    // Configuration de la génération de code
    codeGeneration?: {
        enabled: boolean;
        outputDir?: string;
        framework?: 'nestjs' | 'remix' | 'nextjs' | 'prisma';
        includeTests?: boolean;
        aiEndpoint?: string;
        templateDir?: string;
        modelMapping?: Record<string, string>;
        routeMapping?: Record<string, string>;
        concurrency?: number;
    };

    // Configuration de la mise à jour de la documentation
    docsUpdate?: {
        enabled: boolean;
        outputDir?: string;
        format?: 'markdown' | 'html' | 'docusaurus';
        templates?: {
            component?: string;
            service?: string;
            model?: string;
            migration?: string;
        };
        metadata?: {
            projectName?: string;
            version?: string;
            author?: string;
            teamId?: string;
        };
        aiEndpoint?: string;
        concurrency?: number;
    };
}

export interface AiPipelineWorkflowResult {
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

    startTime: string;
    endTime: string;
    duration: number;
    success: boolean;
}

/**
 * Workflow principal du Pipeline de Migration IA
 */
export async function aiPipelineWorkflow(
    input: AiPipelineWorkflowInput
): Promise<AiPipelineWorkflowResult> {
    const startTime = Date.now();

    // Initialisation des activités PHP Analyzer
    const phpActivitiesProxy = proxyActivities<typeof phpActivities>({
        startToCloseTimeout: '10 minutes',
        retry: {
            maximumAttempts: 3,
            initialInterval: '1 second',
        },
    });

    // Initialisation des activités Code Generator
    const codeActivitiesProxy = proxyActivities<typeof codeActivities>({
        startToCloseTimeout: '10 minutes',
        retry: {
            maximumAttempts: 2,
            initialInterval: '1 second',
        },
    });

    // Initialisation des activités Documentation Updater
    const docsActivitiesProxy = proxyActivities<typeof docsActivities>({
        startToCloseTimeout: '10 minutes',
        retry: {
            maximumAttempts: 2,
            initialInterval: '1 second',
        },
    });

    // Résultat par défaut
    const result: AiPipelineWorkflowResult = {
        startTime: new Date(startTime).toISOString(),
        endTime: '',
        duration: 0,
        success: true
    };

    try {
        // 1. Exécution de l'analyse PHP si activée
        let phpAnalysisResults: ReturnType<typeof phpActivities.batchAnalyzePhpFiles>['results'] = [];

        if (input.phpAnalysis?.enabled) {
            console.log('Starting PHP analysis workflow');

            // Configuration par défaut
            const phpConfig = {
                sourcePath: input.phpAnalysis.sourcePath || '/workspaces/cahier-des-charge/app/legacy',
                fileExtensions: input.phpAnalysis.fileExtensions || ['php'],
                recursive: input.phpAnalysis.recursive !== false,
                exclude: input.phpAnalysis.exclude || ['vendor', 'node_modules'],
                limit: input.phpAnalysis.limit,
                analyzerEndpoint: input.phpAnalysis.analyzerEndpoint,
                outputDir: input.phpAnalysis.outputDir || '/workspaces/cahier-des-charge/reports/analysis',
                concurrency: input.phpAnalysis.concurrency || 5,
                generateSummary: input.phpAnalysis.generateSummary !== false
            };

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
            result.phpAnalysis = {
                success: analysisResult.successful > 0,
                totalFiles: phpFiles.length,
                analyzedFiles: analysisResult.successful,
                failedFiles: analysisResult.failed,
                outputDir: phpConfig.outputDir,
                summaryPath,
                summary
            };
        }

        // 2. Exécution de la génération de code si activée
        let codeGenerationResults: ReturnType<typeof codeActivities.batchGenerateCode>['results'] = [];

        if (input.codeGeneration?.enabled) {
            console.log('Starting code generation workflow');

            // Vérifier que nous avons des analyses PHP à utiliser
            if (phpAnalysisResults.length === 0 && input.phpAnalysis?.enabled) {
                throw new Error('No PHP analysis results available for code generation');
            }

            // Si l'analyse PHP n'est pas activée mais qu'on veut générer du code,
            // utiliser les résultats d'analyse existants
            if (phpAnalysisResults.length === 0 && !input.phpAnalysis?.enabled) {
                // Utiliser la configuration de base pour charger les analyses existantes
                // (Cette fonctionnalité pourrait être implémentée plus tard)
                console.log('Code generation requested without PHP analysis - skipping');

                result.codeGeneration = {
                    success: false,
                    totalFiles: 0,
                    generatedFiles: 0,
                    failedFiles: 0,
                    outputDir: input.codeGeneration.outputDir || '/workspaces/cahier-des-charge/app/migrated'
                };
            } else {
                // Configuration par défaut
                const codeConfig = {
                    outputDir: input.codeGeneration.outputDir || '/workspaces/cahier-des-charge/app/migrated',
                    framework: input.codeGeneration.framework || 'nestjs',
                    includeTests: input.codeGeneration.includeTests !== false,
                    aiEndpoint: input.codeGeneration.aiEndpoint,
                    templateDir: input.codeGeneration.templateDir,
                    modelMapping: input.codeGeneration.modelMapping,
                    routeMapping: input.codeGeneration.routeMapping,
                    concurrency: input.codeGeneration.concurrency || 3
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
                result.codeGeneration = {
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
            }
        }

        // 3. Exécution de la mise à jour de la documentation si activée
        if (input.docsUpdate?.enabled) {
            console.log('Starting documentation update workflow');

            // Configuration par défaut
            const docsConfig = {
                outputDir: input.docsUpdate.outputDir || '/workspaces/cahier-des-charge/documentation/docs/generated',
                format: input.docsUpdate.format || 'markdown',
                templates: input.docsUpdate.templates || {},
                metadata: input.docsUpdate.metadata || {
                    projectName: 'AI Migration Pipeline',
                    version: '1.0.0'
                },
                aiEndpoint: input.docsUpdate.aiEndpoint,
                concurrency: input.docsUpdate.concurrency || 3
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

                result.docsUpdate = {
                    success: false,
                    totalFiles: 0,
                    generatedDocs: 0,
                    failedDocs: 0,
                    outputDir: docsConfig.outputDir
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
                result.docsUpdate = {
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
            }
        }
    } catch (error) {
        // En cas d'erreur, marquer le workflow comme échoué
        console.error(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`);
        result.success = false;
    }

    // Calculer la durée et finaliser le résultat
    const endTime = Date.now();
    result.endTime = new Date(endTime).toISOString();
    result.duration = endTime - startTime;

    return result;
}

/**
 * Workflow simplifié pour l'analyse PHP
 * Version plus simple qui se concentre uniquement sur l'analyse PHP
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
): Promise<AiPipelineWorkflowResult['phpAnalysis']> {
    // Utiliser le workflow principal avec uniquement l'analyse PHP activée
    const result = await aiPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            ...input
        }
    });

    return result.phpAnalysis;
}

/**
 * Workflow simplifié pour la génération de code
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
): Promise<AiPipelineWorkflowResult['codeGeneration']> {
    // Utiliser le workflow principal avec analyse PHP et génération de code activées
    const result = await aiPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            sourcePath: input.phpSourcePath
        },
        codeGeneration: {
            enabled: true,
            outputDir: input.outputDir,
            framework: input.framework,
            includeTests: input.includeTests,
            templateDir: input.templateDir
        }
    });

    return result.codeGeneration;
}

/**
 * Workflow simplifié pour la génération de documentation
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
): Promise<AiPipelineWorkflowResult['docsUpdate']> {
    // Utiliser le workflow principal avec toutes les étapes
    const result = await aiPipelineWorkflow({
        phpAnalysis: {
            enabled: true,
            sourcePath: input.phpSourcePath
        },
        codeGeneration: {
            enabled: input.includeGeneratedCode !== false,
            outputDir: input.codeOutputDir,
            framework: input.framework
        },
        docsUpdate: {
            enabled: true,
            outputDir: input.docsOutputDir,
            format: input.format,
            metadata: {
                projectName: input.projectName || 'AI Migration Pipeline',
                version: input.version || '1.0.0'
            }
        }
    });

    return result.docsUpdate;
}