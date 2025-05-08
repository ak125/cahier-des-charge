/**
 * Workflow consolidé d'analyse PHP
 * 
 * Ce workflow sert de point d'entrée unique pour l'analyse de code PHP,
 * consolidant plusieurs outils d'analyse précédemment séparés.
 */
import { proxyActivities, workflow, WorkflowResultType } from '@temporalio/workflow';
import { ConsolidatedPhpAnalyzerInput, ConsolidatedPhpAnalyzerResult, WorkflowState } from '../types/workflow-types';
import * as activities from '../activities/consolidated-activities';
import { v4 as uuidv4 } from 'uuid';

const {
    initializeAnalysis,
    prepareEnvironment,
    validateInput,
    analyzeStaticStructure,
    analyzeCodeComplexity,
    detectCodeDuplication,
    analyzeSecurityVulnerabilities,
    generateReports,
    notifyCompletion
} = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes',
    retry: {
        maximumAttempts: 3
    }
});

export async function consolidatedPhpAnalyzer(
    input: ConsolidatedPhpAnalyzerInput
): Promise<ConsolidatedPhpAnalyzerResult> {
    // Initialiser l'état du workflow avec un ID unique
    const workflowId = uuidv4();
    let state: WorkflowState = {
        config: input,
        status: 'initializing',
        progress: {
            startTime: new Date().toISOString(),
            currentStep: 'initialization',
            completedSteps: 0,
            totalSteps: calculateTotalSteps(input),
        },
        result: {
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
        }
    };

    // Validation des entrées
    try {
        // Initialiser l'analyse et valider les entrées
        state.status = 'analyzing';
        state.progress.currentStep = 'validation';

        const validatedInput = await validateInput(input);
        state.config = validatedInput;
        state.progress.completedSteps++;

        // Préparer l'environnement d'analyse
        state.progress.currentStep = 'environment_preparation';
        const environment = await prepareEnvironment(validatedInput);
        state.progress.completedSteps++;

        // Initialiser l'analyse
        state.progress.currentStep = 'analysis_initialization';
        const analysisContext = await initializeAnalysis(validatedInput, environment);
        state.progress.completedSteps++;

        // Exécuter les analyses en fonction de la configuration

        // 1. Analyse statique du code (si activée)
        if (!validatedInput.staticAnalysis?.enabled === false) {
            state.progress.currentStep = 'static_analysis';
            const staticAnalysisResult = await analyzeStaticStructure(validatedInput, analysisContext);
            state.result.staticAnalysis = staticAnalysisResult;
            state.result.metadata.filesAnalyzed = staticAnalysisResult.filesAnalyzed || 0;
            state.result.metadata.totalLinesOfCode = staticAnalysisResult.linesOfCode || 0;
            state.progress.completedSteps++;
        }

        // 2. Analyse de complexité et duplication (si activée)
        if (validatedInput.complexityAnalysis?.enabled !== false) {
            // Analyse de complexité
            state.progress.currentStep = 'complexity_analysis';
            const complexityResult = await analyzeCodeComplexity(validatedInput, analysisContext);
            state.result.complexityAnalysis = {
                passed: complexityResult.passed,
                score: complexityResult.score,
                hotspots: complexityResult.hotspots,
                stats: complexityResult.stats
            };
            state.progress.completedSteps++;

            // Détection de duplication (si activée)
            if (validatedInput.complexityAnalysis?.detectDuplication) {
                state.progress.currentStep = 'duplication_detection';
                const duplicationResult = await detectCodeDuplication(validatedInput, analysisContext);
                if (state.result.complexityAnalysis) {
                    state.result.complexityAnalysis.duplication = duplicationResult;
                }
                state.progress.completedSteps++;
            }
        }

        // 3. Analyse de sécurité (si activée)
        if (validatedInput.securityAnalysis?.enabled !== false) {
            state.progress.currentStep = 'security_analysis';
            const securityResult = await analyzeSecurityVulnerabilities(validatedInput, analysisContext);
            state.result.securityAnalysis = securityResult;
            state.progress.completedSteps++;
        }

        // 4. Génération des rapports
        state.progress.currentStep = 'report_generation';
        const reportPaths = await generateReports(validatedInput, state.result);
        state.result.reportPaths = reportPaths;
        state.progress.completedSteps++;

        // 5. Notification de fin d'analyse
        state.progress.currentStep = 'notification';
        await notifyCompletion(validatedInput, state.result);
        state.progress.completedSteps++;

        // Finaliser le workflow
        state.status = 'completed';
        state.result.endTime = new Date().toISOString();
        state.result.duration =
            new Date(state.result.endTime).getTime() -
            new Date(state.result.startTime).getTime();

        return state.result;

    } catch (error) {
        // Gestion des erreurs
        state.status = 'failed';
        state.errors = state.errors || [];
        state.errors.push(error instanceof Error ? error.message : String(error));

        // Finaliser le workflow avec erreur
        state.result.endTime = new Date().toISOString();
        state.result.duration =
            new Date(state.result.endTime).getTime() -
            new Date(state.result.startTime).getTime();

        // Remonter l'erreur pour traitement externe
        throw new Error(`Échec de l'analyse PHP consolidée: ${state.errors.join(', ')}`);
    }
}

/**
 * Fonction utilitaire pour calculer le nombre total d'étapes en fonction de la configuration
 */
function calculateTotalSteps(input: ConsolidatedPhpAnalyzerInput): number {
    // Étapes de base: validation, préparation environnement, initialisation, rapports, notification
    let steps = 5;

    // Étapes optionnelles en fonction de la configuration
    if (input.staticAnalysis?.enabled !== false) steps++;
    if (input.complexityAnalysis?.enabled !== false) steps++;
    if (input.complexityAnalysis?.detectDuplication) steps++;
    if (input.securityAnalysis?.enabled !== false) steps++;

    return steps;
}

// Définition du workflow pour Temporal
export const workflowExport = { consolidatedPhpAnalyzer };