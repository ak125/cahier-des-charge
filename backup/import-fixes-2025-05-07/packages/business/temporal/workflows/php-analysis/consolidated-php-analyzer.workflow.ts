/**
 * Workflow d'analyse PHP consolidé
 * 
 * Ce workflow intègre les fonctionnalités d'analyse PHP de plusieurs workflows n8n existants
 * en un seul point d'entrée unifié avec des capacités étendues d'analyse et de reporting.
 */

import { proxyActivities, proxySinks, setHandler, workflow } from '@temporalio/workflow';
import {
    ConsolidatedPhpAnalyzerInput,
    ConsolidatedPhpAnalyzerResult,
    WorkflowState
} from './types';
import { ApplicationFailure } from '@temporalio/common';
import * as wf from '@temporalio/workflow';

// Import des types d'activités existants
import { PhpFile, PhpAnalysisResult } from '../../activities/ai-pipeline/php-analyzer-activities';

// Activités requises pour l'analyse PHP
const {
    listPhpFiles,
    analyzePhpFile,
    batchAnalyzePhpFiles,
    generateAnalysisSummary,
    saveAnalysisResult
} = proxyActivities({
    activities: {
        listPhpFiles: wf.import('../../activities/ai-pipeline/php-analyzer-activities'),
        analyzePhpFile: wf.import('../../activities/ai-pipeline/php-analyzer-activities'),
        batchAnalyzePhpFiles: wf.import('../../activities/ai-pipeline/php-analyzer-activities'),
        generateAnalysisSummary: wf.import('../../activities/ai-pipeline/php-analyzer-activities'),
        saveAnalysisResult: wf.import('../../activities/ai-pipeline/php-analyzer-activities')
    },
    startToCloseTimeout: '30 minutes',
    retry: {
        maximumAttempts: 3
    }
});

// Activités supplémentaires pour la détection de complexité
const {
    detectDuplication,
    calculateComplexityMetrics,
    detectSecurityIssues
} = proxyActivities({
    activities: {
        detectDuplication: wf.import('../../activities/audit/complexity-activities'),
        calculateComplexityMetrics: wf.import('../../activities/audit/complexity-activities'),
        detectSecurityIssues: wf.import('../../activities/audit/security-activities')
    },
    startToCloseTimeout: '15 minutes'
});

// Activités pour la génération de rapports
const {
    generateHtmlReport,
    sendNotifications
} = proxyActivities({
    activities: {
        generateHtmlReport: wf.import('../../activities/reporting/report-activities'),
        sendNotifications: wf.import('../../activities/reporting/notification-activities')
    },
    startToCloseTimeout: '5 minutes'
});

// Logger pour les événements du workflow
const logger = proxySinks.logger;

/**
 * Workflow d'analyse PHP consolidé
 */
export async function consolidatedPhpAnalyzerWorkflow(
    input: ConsolidatedPhpAnalyzerInput
): Promise<ConsolidatedPhpAnalyzerResult> {
    // Initialiser l'état du workflow
    const state: WorkflowState = {
        config: input,
        status: 'initializing',
        progress: {
            startTime: new Date().toISOString(),
            currentStep: 'Initialisation',
            completedSteps: 0,
            totalSteps: calculateTotalSteps(input)
        },
        result: createInitialResult(input)
    };

    // Signal handler pour les pauses et reprises
    setHandler('pause', () => {
        state.status = 'paused';
        logger.info('Workflow analysis paused');
    });

    setHandler('resume', () => {
        state.status = 'analyzing';
        logger.info('Workflow analysis resumed');
    });

    // Signal handler pour la configuration
    setHandler('updateConfig', (newConfig: Partial<ConsolidatedPhpAnalyzerInput>) => {
        state.config = { ...state.config, ...newConfig };
        logger.info('Configuration updated', { newConfig });
    });

    try {
        // Phase 1: Initialisation et listing des fichiers
        logger.info('Starting PHP analysis workflow', {
            projectPath: input.projectPath,
            outputDir: input.outputDir
        });

        state.status = 'analyzing';
        state.progress.currentStep = 'Recherche des fichiers PHP';

        const fileExtensions = ['php'];
        const phpFiles = await listPhpFiles({
            path: input.projectPath,
            fileExtensions,
            recursive: true,
            exclude: input.fileFilters?.exclude || [],
            limit: input.fileFilters?.limit
        });

        await checkPaused(state);
        updateProgress(state, 'Fichiers PHP identifiés');
        logger.info('PHP files found', { count: phpFiles.length });

        // Utiliser la sélection intelligente si demandé
        let selectedFiles = phpFiles;
        if (input.fileFilters?.useSmartSelection) {
            state.progress.currentStep = 'Sélection intelligente des fichiers';
            // Application des critères de sélection intelligente
            selectedFiles = applySmartSelection(phpFiles);
            await checkPaused(state);
            updateProgress(state, 'Sélection intelligente appliquée');
            logger.info('Smart selection applied', {
                before: phpFiles.length,
                after: selectedFiles.length
            });
        }

        // Mettre à jour les méta-données
        state.result.metadata.filesAnalyzed = selectedFiles.length;

        // Phase 2: Analyse statique si demandée
        if (input.staticAnalysis?.enabled !== false) {
            state.progress.currentStep = 'Analyse statique en cours';
            state.result.staticAnalysis = {
                passed: true,
                syntaxErrors: [],
                codeStructure: {
                    classes: 0,
                    functions: 0,
                    methods: 0,
                    namespaces: 0,
                    interfaces: 0,
                    traits: 0
                },
                dependencies: {
                    nodes: [],
                    edges: []
                }
            };

            // Effectuer l'analyse par lots
            const batchResults = await batchAnalyzePhpFiles(selectedFiles, {
                analyzerEndpoint: 'http://localhost:3000/api/analyze-php',
                outputDir: input.outputDir || '/workspaces/cahier-des-charge/reports/analysis',
                concurrency: 10
            });

            await checkPaused(state);
            updateProgress(state, 'Analyse statique terminée');

            // Compiler les statistiques
            processStaticAnalysisResults(state, batchResults.results);

            // Générer le résumé
            const summary = await generateAnalysisSummary(batchResults.results);
            logger.info('Analysis summary generated', { path: summary.summaryPath });
        }

        // Phase 3: Analyse de complexité si demandée
        if (input.complexityAnalysis?.enabled !== false) {
            state.progress.currentStep = 'Analyse de complexité en cours';

            // Initialiser la section d'analyse de complexité
            state.result.complexityAnalysis = {
                passed: true,
                score: 0,
                hotspots: [],
                stats: {
                    averageComplexity: 0,
                    distribution: {
                        simple: 0,
                        moderate: 0,
                        complex: 0,
                        veryComplex: 0
                    }
                }
            };

            // Calculer les métriques de complexité
            if (input.complexityAnalysis.calculateCyclomaticComplexity !== false) {
                const complexityMetrics = await calculateComplexityMetrics({
                    files: selectedFiles.map(file => file.path),
                    thresholds: {
                        complexity: input.complexityAnalysis.complexityThreshold || 15,
                        nesting: input.complexityAnalysis.nestingThreshold || 5
                    }
                });

                // Mettre à jour les hotspots et statistiques
                updateComplexityStats(state, complexityMetrics);
            }

            // Détecter la duplication si demandée
            if (input.complexityAnalysis.detectDuplication !== false) {
                state.progress.currentStep = 'Détection de duplication';

                const duplicationResults = await detectDuplication({
                    files: selectedFiles.map(file => file.path),
                    threshold: input.complexityAnalysis.duplicationThreshold || 70,
                    minLines: 10
                });

                state.result.complexityAnalysis.duplication = {
                    percentage: duplicationResults.percentage,
                    instances: duplicationResults.instances.map(instance => ({
                        files: instance.filePaths,
                        linesOfCode: instance.linesOfCode,
                        startLines: instance.startLines,
                        endLines: instance.endLines
                    }))
                };
            }

            await checkPaused(state);
            updateProgress(state, 'Analyse de complexité terminée');
        }

        // Phase 4: Analyse de sécurité si demandée
        if (input.securityAnalysis?.enabled !== false) {
            state.progress.currentStep = 'Analyse de sécurité en cours';

            // Initialiser la section d'analyse de sécurité
            state.result.securityAnalysis = {
                passed: true,
                score: 100,
                vulnerabilities: [],
                summary: {
                    total: 0,
                    byCategory: {
                        sqlInjection: 0,
                        xss: 0,
                        fileHandling: 0,
                        permissions: 0,
                        other: 0
                    },
                    bySeverity: {
                        low: 0,
                        medium: 0,
                        high: 0,
                        critical: 0
                    }
                }
            };

            // Options d'analyse de sécurité
            const securityOptions = {
                files: selectedFiles.map(file => file.path),
                detectSqlInjection: input.securityAnalysis.detectSqlInjection !== false,
                detectXss: input.securityAnalysis.detectXss !== false,
                detectFileVulnerabilities: input.securityAnalysis.detectFileVulnerabilities !== false,
                checkPermissions: input.securityAnalysis.checkPermissions !== false
            };

            // Exécuter l'analyse de sécurité
            const securityResults = await detectSecurityIssues(securityOptions);

            // Mettre à jour les résultats
            state.result.securityAnalysis.vulnerabilities = securityResults.issues;
            state.result.securityAnalysis.score = securityResults.score;
            state.result.securityAnalysis.passed = securityResults.passed;
            state.result.securityAnalysis.summary = {
                total: securityResults.totalIssues,
                byCategory: securityResults.categoryCounts,
                bySeverity: securityResults.severityCounts
            };

            await checkPaused(state);
            updateProgress(state, 'Analyse de sécurité terminée');
        }

        // Phase 5: Génération de rapports
        if (input.reporting) {
            state.progress.currentStep = 'Génération des rapports';

            const outputDir = input.outputDir || '/workspaces/cahier-des-charge/reports/php-analysis';
            const format = input.reporting.format || 'json';

            // Répertoires pour les rapports
            const reportPaths: { summary?: string; detailed?: string; dashboard?: string } = {};

            // Générer les rapports JSON
            if (format === 'json' || format === 'both') {
                const summaryPath = `${outputDir}/summary.json`;
                const detailedPath = `${outputDir}/detailed.json`;

                await saveReport(summaryPath, {
                    metadata: state.result.metadata,
                    summary: {
                        staticAnalysis: summarizeStaticAnalysis(state.result),
                        complexityAnalysis: summarizeComplexityAnalysis(state.result),
                        securityAnalysis: summarizeSecurityAnalysis(state.result)
                    }
                });

                await saveReport(detailedPath, state.result);

                reportPaths.summary = summaryPath;
                reportPaths.detailed = detailedPath;
            }

            // Générer les rapports HTML
            if (format === 'html' || format === 'both') {
                const htmlSummaryPath = `${outputDir}/summary.html`;

                await generateHtmlReport({
                    data: state.result,
                    template: 'php-analysis-summary',
                    outputPath: htmlSummaryPath,
                    includeVisualizations: input.reporting.includeVisualizations !== false
                });

                reportPaths.summary = htmlSummaryPath;

                // Générer un tableau de bord si demandé
                if (input.reporting.generateDashboard) {
                    const dashboardPath = `${outputDir}/dashboard.html`;

                    await generateHtmlReport({
                        data: state.result,
                        template: 'php-analysis-dashboard',
                        outputPath: dashboardPath,
                        includeVisualizations: true
                    });

                    reportPaths.dashboard = dashboardPath;
                }
            }

            state.result.reportPaths = reportPaths;

            // Envoyer des notifications si configurées
            if (input.reporting.notifyWebhook || (input.reporting.email && input.reporting.email.enabled)) {
                state.progress.currentStep = 'Envoi des notifications';

                await sendNotifications({
                    subject: 'Rapport d\'analyse PHP consolidé',
                    message: `L'analyse PHP du projet ${input.projectPath} est terminée.`,
                    reportPaths: reportPaths,
                    webhookUrl: input.reporting.notifyWebhook,
                    email: input.reporting.email
                });
            }

            await checkPaused(state);
            updateProgress(state, 'Rapports générés');
        }

        // Finalisation
        state.status = 'completed';
        state.result.endTime = new Date().toISOString();
        state.result.duration = new Date(state.result.endTime).getTime() -
            new Date(state.result.startTime).getTime();

        logger.info('PHP analysis completed successfully', {
            projectPath: input.projectPath,
            filesAnalyzed: state.result.metadata.filesAnalyzed,
            duration: state.result.duration
        });

        return state.result;
    } catch (error) {
        state.status = 'failed';
        state.errors = [error instanceof Error ? error.message : String(error)];

        logger.error('PHP analysis failed', {
            projectPath: input.projectPath,
            error: error instanceof Error ? error.message : String(error)
        });

        throw new ApplicationFailure(
            `L'analyse PHP a échoué: ${error instanceof Error ? error.message : String(error)}`,
            'PHP_ANALYZER_FAILURE'
        );
    }
}

/**
 * Utility: Calcule le nombre total d'étapes en fonction de la configuration
 */
function calculateTotalSteps(input: ConsolidatedPhpAnalyzerInput): number {
    let steps = 1; // Listing des fichiers toujours requis

    if (input.fileFilters?.useSmartSelection) steps++;
    if (input.staticAnalysis?.enabled !== false) steps++;
    if (input.complexityAnalysis?.enabled !== false) steps++;
    if (input.complexityAnalysis?.detectDuplication !== false) steps++;
    if (input.securityAnalysis?.enabled !== false) steps++;
    if (input.reporting) steps++;
    if (input.reporting?.notifyWebhook || (input.reporting?.email && input.reporting.email.enabled)) steps++;

    return steps;
}

/**
 * Utility: Crée le résultat initial
 */
function createInitialResult(input: ConsolidatedPhpAnalyzerInput): ConsolidatedPhpAnalyzerResult {
    return {
        startTime: new Date().toISOString(),
        endTime: '',
        duration: 0,
        metadata: {
            version: '1.0.0',
            analyzedAt: new Date().toISOString(),
            configUsed: input,
            filesAnalyzed: 0,
            totalLinesOfCode: 0
        }
    };
}

/**
 * Utility: Met à jour la progression
 */
function updateProgress(state: WorkflowState, step: string): void {
    state.progress.currentStep = step;
    state.progress.completedSteps++;
}

/**
 * Utility: Vérifie si le workflow est en pause
 */
async function checkPaused(state: WorkflowState): Promise<void> {
    while (state.status === 'paused') {
        await wf.sleep('1 second');
    }
}

/**
 * Utility: Applique la sélection intelligente des fichiers
 * (version simplifiée - à implémenter avec des algorithmes plus sophistiqués)
 */
function applySmartSelection(files: PhpFile[]): PhpFile[] {
    // Cette implémentation pourrait être améliorée avec des heuristiques
    // comme la taille des fichiers, les patterns de nommage, etc.

    // Exemple simple: exclure les fichiers de test et de vendor
    return files.filter(file => {
        const isTest = /test|spec|mock/i.test(file.path);
        const isVendor = /vendor|node_modules|third-party/i.test(file.path);
        return !isTest && !isVendor;
    });
}

/**
 * Utility: Traite les résultats d'analyse statique
 */
function processStaticAnalysisResults(state: WorkflowState, results: PhpAnalysisResult[]): void {
    if (!state.result.staticAnalysis) return;

    let totalClasses = 0;
    let totalFunctions = 0;
    let totalLoc = 0;
    const dependenciesSet = new Set<string>();
    const nodes = new Map<string, { id: string; label: string; type: string }>();
    const edges: { source: string; target: string }[] = [];

    // Parcourir tous les résultats
    for (const result of results) {
        totalClasses += result.analysis.classes.length;
        totalFunctions += result.analysis.functions.length;
        totalLoc += result.analysis.loc;

        // Collecter les erreurs de syntaxe
        result.analysis.issues.forEach(issue => {
            if (issue.type === 'syntax' || issue.severity === 'error') {
                state.result.staticAnalysis?.syntaxErrors?.push({
                    file: result.file.path,
                    line: issue.line,
                    message: issue.message
                });
            }
        });

        // Construire le graphe de dépendances
        const fileId = `file_${result.file.path}`;
        nodes.set(fileId, {
            id: fileId,
            label: result.file.filename,
            type: 'file'
        });

        // Ajouter les dépendances
        result.analysis.dependencies.forEach(dep => {
            dependenciesSet.add(dep);
            const depId = `dep_${dep}`;

            if (!nodes.has(depId)) {
                nodes.set(depId, {
                    id: depId,
                    label: dep,
                    type: 'dependency'
                });
            }

            edges.push({
                source: fileId,
                target: depId
            });
        });
    }

    // Mettre à jour la structure du code
    if (state.result.staticAnalysis.codeStructure) {
        state.result.staticAnalysis.codeStructure.classes = totalClasses;
        state.result.staticAnalysis.codeStructure.functions = totalFunctions;
        // Note: d'autres métriques comme methods, namespaces, etc. nécessiteraient une analyse plus détaillée
    }

    // Mettre à jour les dépendances
    if (state.result.staticAnalysis.dependencies) {
        state.result.staticAnalysis.dependencies.nodes = Array.from(nodes.values());
        state.result.staticAnalysis.dependencies.edges = edges;
    }

    // Mettre à jour les métadonnées
    state.result.metadata.totalLinesOfCode = totalLoc;

    // Déterminer si l'analyse est réussie (pas d'erreurs de syntaxe critiques)
    state.result.staticAnalysis.passed = state.result.staticAnalysis.syntaxErrors?.length === 0;
}

/**
 * Utility: Met à jour les statistiques de complexité
 */
function updateComplexityStats(state: WorkflowState, metrics: any): void {
    if (!state.result.complexityAnalysis) return;

    // Mettre à jour les hotspots
    state.result.complexityAnalysis.hotspots = metrics.hotspots.map((h: any) => ({
        file: h.file,
        function: h.function,
        line: h.line,
        complexity: h.complexity,
        nestingDepth: h.nestingDepth,
        linesOfCode: h.linesOfCode
    }));

    // Mettre à jour les statistiques
    state.result.complexityAnalysis.stats.averageComplexity = metrics.averageComplexity;
    state.result.complexityAnalysis.stats.averageNestingDepth = metrics.averageNestingDepth;

    // Distribution de complexité
    state.result.complexityAnalysis.stats.distribution = {
        simple: metrics.distribution.simple || 0,
        moderate: metrics.distribution.moderate || 0,
        complex: metrics.distribution.complex || 0,
        veryComplex: metrics.distribution.veryComplex || 0
    };

    // Score global basé sur la distribution
    const totalFiles = state.result.metadata.filesAnalyzed;
    if (totalFiles > 0) {
        const complexityRatio = (
            (metrics.distribution.complex || 0) +
            (metrics.distribution.veryComplex || 0)
        ) / totalFiles;

        // Score de 0 à 100, où 100 est le meilleur (pas de fichiers complexes)
        state.result.complexityAnalysis.score = Math.max(0, Math.min(100, 100 - Math.round(complexityRatio * 100)));

        // L'analyse est considérée comme réussie si moins de 20% des fichiers sont complexes
        state.result.complexityAnalysis.passed = complexityRatio < 0.2;
    }
}

/**
 * Utility: Sauvegarde un rapport JSON
 */
async function saveReport(path: string, data: any): Promise<void> {
    await wf.executeChild({
        workflowType: 'saveJsonReport',
        args: [{ path, data }],
        workflowId: `save-report-${Date.now()}`
    });
}

/**
 * Utility: Résume l'analyse statique
 */
function summarizeStaticAnalysis(result: ConsolidatedPhpAnalyzerResult): any {
    if (!result.staticAnalysis) return null;

    return {
        passed: result.staticAnalysis.passed,
        syntaxErrorCount: result.staticAnalysis.syntaxErrors?.length || 0,
        codeStructure: result.staticAnalysis.codeStructure,
        dependenciesCount: result.staticAnalysis.dependencies?.nodes.length || 0
    };
}

/**
 * Utility: Résume l'analyse de complexité
 */
function summarizeComplexityAnalysis(result: ConsolidatedPhpAnalyzerResult): any {
    if (!result.complexityAnalysis) return null;

    return {
        passed: result.complexityAnalysis.passed,
        score: result.complexityAnalysis.score,
        averageComplexity: result.complexityAnalysis.stats.averageComplexity,
        distribution: result.complexityAnalysis.stats.distribution,
        hotspotsCount: result.complexityAnalysis.hotspots.length,
        duplicationPercentage: result.complexityAnalysis.duplication?.percentage || 0
    };
}

/**
 * Utility: Résume l'analyse de sécurité
 */
function summarizeSecurityAnalysis(result: ConsolidatedPhpAnalyzerResult): any {
    if (!result.securityAnalysis) return null;

    return {
        passed: result.securityAnalysis.passed,
        score: result.securityAnalysis.score,
        vulnerabilitiesCount: result.securityAnalysis.vulnerabilities.length,
        bySeverity: result.securityAnalysis.summary.bySeverity,
        byCategory: result.securityAnalysis.summary.byCategory
    };
}

// Exporter le workflow
export default consolidatedPhpAnalyzerWorkflow;