/**
 * smart-analyzer-agent.ts
 * 
 * Exemple d'implémentation d'un agent d'analyse avec mémoire à long terme
 * Utilise la mémoire pour améliorer ses analyses en se basant sur l'historique
 */

import { BaseMemoAgent, MemoAgentOptions } from '../base-memo-agent';
import { MemoData } from '../../memo/memo-manager';

/**
 * Structure pour les résultats d'analyse
 */
export interface AnalysisResult {
    /**
     * Identifiant de l'analyse
     */
    analysisId: string;

    /**
     * Type de contenu analysé (code, texte, données, etc.)
     */
    contentType: string;

    /**
     * Résultats de l'analyse
     */
    results: {
        /**
         * Score global
         */
        score: number;

        /**
         * Métriques spécifiques
         */
        metrics: Record<string, number>;

        /**
         * Problèmes identifiés
         */
        issues: Array<{
            id: string;
            severity: 'high' | 'medium' | 'low';
            message: string;
            location?: string;
        }>;

        /**
         * Suggestions d'amélioration
         */
        suggestions: Array<{
            id: string;
            message: string;
            priority: number;
        }>;
    };

    /**
     * Horodatage de l'analyse
     */
    timestamp: number;

    /**
     * Contexte de l'analyse
     */
    context: {
        /**
         * Version des outils utilisés
         */
        toolVersion: string;

        /**
         * Configuration utilisée
         */
        config?: Record<string, any>;

        /**
         * Autres informations contextuelles
         */
        [key: string]: any;
    };
}

/**
 * Options pour l'analyse
 */
export interface AnalysisOptions {
    /**
     * Profondeur de l'analyse
     */
    depth?: 'quick' | 'standard' | 'deep';

    /**
     * Pondération des métriques
     */
    weights?: Record<string, number>;

    /**
     * Activer l'apprentissage à partir des analyses antérieures
     */
    enableLearning?: boolean;

    /**
     * Autres options spécifiques
     */
    [key: string]: any;
}

/**
 * Agent d'analyse intelligent avec mémoire
 */
export class SmartAnalyzerAgent extends BaseMemoAgent {
    /**
     * Options d'analyse par défaut
     */
    private defaultOptions: AnalysisOptions = {
        depth: 'standard',
        enableLearning: true
    };

    constructor(options: MemoAgentOptions) {
        super({
            ...options,
            // Toujours configurer le type pour les agents d'analyse
            type: 'Analyzer',
        });
    }

    /**
     * Exécute une analyse sur le contenu donné
     */
    async analyze<T>(
        content: T,
        contentType: string,
        options?: AnalysisOptions
    ): Promise<AnalysisResult> {
        // Fusion avec les options par défaut
        const analysisOptions = { ...this.defaultOptions, ...options };

        // Générer un ID unique pour cette analyse
        const analysisId = `analysis-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const timestamp = Date.now();

        // Utiliser l'apprentissage passé si activé
        if (analysisOptions.enableLearning && this.memoryInitialized) {
            // Rechercher des analyses similaires dans la mémoire
            const previousAnalyses = await this.searchMemory<AnalysisResult>({
                contentType,
            });

            // Ajuster les options en fonction des analyses précédentes
            if (previousAnalyses.length > 0) {
                console.log(`Utilisation de ${previousAnalyses.length} analyses précédentes pour améliorer les résultats`);

                // Adapter les pondérations en fonction des analyses précédentes réussies
                const relevantMetrics = this.extractRelevantMetrics(previousAnalyses);
                if (Object.keys(relevantMetrics).length > 0) {
                    analysisOptions.weights = {
                        ...(analysisOptions.weights || {}),
                        ...relevantMetrics
                    };
                }
            }
        }

        // Effectuer l'analyse réelle (implémentation simulée ici)
        const result = await this.performAnalysis(content, contentType, analysisOptions);

        // Construire le résultat final
        const analysisResult: AnalysisResult = {
            analysisId,
            contentType,
            results: result,
            timestamp,
            context: {
                toolVersion: this.version,
                config: analysisOptions,
            }
        };

        // Stocker le résultat en mémoire pour apprentissage futur
        if (this.memoryInitialized) {
            const memoData: MemoData<AnalysisResult> = {
                type: 'analysis-result',
                data: analysisResult,
                metadata: {
                    contentType,
                    score: result.score,
                    issuesCount: result.issues.length,
                    timestamp,
                    runId: analysisId,
                }
            };

            await this.remember(analysisId, memoData);
        }

        return analysisResult;
    }

    /**
     * Extrait les métriques pertinentes des analyses précédentes
     */
    private extractRelevantMetrics(previousAnalyses: any[]): Record<string, number> {
        const metrics: Record<string, number> = {};
        let totalWeight = 0;

        // Accumuler les métriques des analyses précédentes
        previousAnalyses.forEach(analysis => {
            const data = analysis.data as AnalysisResult;
            if (!data || !data.results || !data.results.metrics) return;

            // Donner plus d'importance aux analyses récentes et avec meilleurs scores
            const recencyFactor = Math.max(0, 1 - (Date.now() - data.timestamp) / (30 * 24 * 60 * 60 * 1000));
            const scoreFactor = data.results.score / 100;
            const weight = recencyFactor * 0.7 + scoreFactor * 0.3;

            Object.entries(data.results.metrics).forEach(([key, value]) => {
                if (!metrics[key]) {
                    metrics[key] = 0;
                }
                metrics[key] += value * weight;
            });

            totalWeight += weight;
        });

        // Normaliser les métriques par le poids total
        if (totalWeight > 0) {
            Object.keys(metrics).forEach(key => {
                metrics[key] = metrics[key] / totalWeight;
            });
        }

        return metrics;
    }

    /**
     * Récupère l'historique des analyses pour un type de contenu
     */
    async getAnalysisHistory(
        contentType: string,
        limit: number = 10
    ): Promise<AnalysisResult[]> {
        if (!this.memoryInitialized) {
            return [];
        }

        const results = await this.searchMemory<AnalysisResult>({
            type: 'analysis-result',
            'metadata.contentType': contentType
        }, {
            limit,
            sort: {
                field: 'timestamp',
                order: 'desc'
            }
        });

        return results
            .filter(result => result.found && result.data !== null)
            .map(result => result.data as AnalysisResult);
    }

    /**
     * Génère un rapport d'apprentissage basé sur les analyses passées
     */
    async generateLearningReport(): Promise<string> {
        if (!this.memoryInitialized) {
            return "Mémoire non initialisée. Impossible de générer un rapport d'apprentissage.";
        }

        // Récupérer toutes les analyses mémorisées
        const allAnalyses = await this.searchMemory<AnalysisResult>({
            type: 'analysis-result'
        });

        if (allAnalyses.length === 0) {
            return "Aucune analyse en mémoire. Impossible de générer un rapport d'apprentissage.";
        }

        // Regrouper par type de contenu
        const byContentType: Record<string, AnalysisResult[]> = {};

        allAnalyses.forEach(result => {
            if (!result.found || !result.data) return;

            const analysis = result.data;
            if (!byContentType[analysis.contentType]) {
                byContentType[analysis.contentType] = [];
            }

            byContentType[analysis.contentType].push(analysis);
        });

        // Générer le rapport
        let report = `# Rapport d'apprentissage de l'agent ${this.name}\n\n`;
        report += `Date du rapport: ${new Date().toISOString()}\n`;
        report += `Nombre total d'analyses en mémoire: ${allAnalyses.length}\n\n`;

        // Pour chaque type de contenu
        for (const [contentType, analyses] of Object.entries(byContentType)) {
            report += `## Analyses de type "${contentType}"\n\n`;
            report += `Nombre d'analyses: ${analyses.length}\n`;

            // Calculer les statistiques
            const scores = analyses.map(a => a.results.score);
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

            report += `Score moyen: ${avgScore.toFixed(2)}/100\n\n`;

            // Problèmes les plus fréquents
            const issueCounter: Record<string, number> = {};
            analyses.forEach(analysis => {
                analysis.results.issues.forEach(issue => {
                    if (!issueCounter[issue.id]) {
                        issueCounter[issue.id] = 0;
                    }
                    issueCounter[issue.id]++;
                });
            });

            report += `### Problèmes les plus fréquents\n\n`;

            const topIssues = Object.entries(issueCounter)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (topIssues.length > 0) {
                topIssues.forEach(([issueId, count], index) => {
                    // Trouver un exemple de ce problème
                    const example = analyses.find(a => a.results.issues.some(i => i.id === issueId));
                    const message = example?.results.issues.find(i => i.id === issueId)?.message || issueId;

                    report += `${index + 1}. "${message}" (${count} occurrences)\n`;
                });
            } else {
                report += "Aucun problème identifié\n";
            }

            report += `\n`;
        }

        report += `## Évolution dans le temps\n\n`;

        // Trier toutes les analyses par date
        const sortedByDate = allAnalyses
            .filter(result => result.found && result.data)
            .map(result => result.data as AnalysisResult)
            .sort((a, b) => a.timestamp - b.timestamp);

        if (sortedByDate.length >= 2) {
            const first = sortedByDate[0];
            const last = sortedByDate[sortedByDate.length - 1];

            const scoreDiff = last.results.score - first.results.score;
            const issuesDiff = last.results.issues.length - first.results.issues.length;

            report += `Évolution du score: ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)} points\n`;
            report += `Évolution du nombre de problèmes: ${issuesDiff > 0 ? '+' : ''}${issuesDiff}\n`;

            // Calculer la tendance générale
            if (sortedByDate.length >= 5) {
                let trend = 'stable';

                const scoresByMonth: Record<string, number[]> = {};
                sortedByDate.forEach(analysis => {
                    const month = new Date(analysis.timestamp).toISOString().substring(0, 7); // YYYY-MM
                    if (!scoresByMonth[month]) {
                        scoresByMonth[month] = [];
                    }
                    scoresByMonth[month].push(analysis.results.score);
                });

                const monthlyAvg = Object.entries(scoresByMonth)
                    .map(([month, scores]) => ({
                        month,
                        avg: scores.reduce((sum, score) => sum + score, 0) / scores.length
                    }))
                    .sort((a, b) => a.month.localeCompare(b.month));

                if (monthlyAvg.length >= 2) {
                    const firstAvg = monthlyAvg[0].avg;
                    const lastAvg = monthlyAvg[monthlyAvg.length - 1].avg;

                    if (lastAvg > firstAvg * 1.1) {
                        trend = 'en amélioration';
                    } else if (lastAvg < firstAvg * 0.9) {
                        trend = 'en détérioration';
                    }
                }

                report += `Tendance générale: ${trend}\n`;
            }
        }

        return report;
    }

    /**
     * Méthode simulée pour l'analyse du contenu
     * Dans un cas réel, cette méthode contiendrait la logique d'analyse
     */
    private async performAnalysis(
        content: any,
        contentType: string,
        options: AnalysisOptions
    ): Promise<AnalysisResult['results']> {
        // Simuler un délai d'analyse
        await new Promise(resolve => setTimeout(resolve, 100));

        // Générer des résultats simulés
        const baseScore = 70 + Math.floor(Math.random() * 20);
        const issuesCount = Math.floor(Math.random() * 5);
        const suggestionsCount = Math.floor(Math.random() * 3);

        // Simuler des métriques selon le type de contenu
        const metrics: Record<string, number> = {};

        switch (contentType) {
            case 'code':
                metrics.complexity = Math.random() * 10;
                metrics.maintainability = 50 + Math.random() * 50;
                metrics.testCoverage = Math.random() * 100;
                break;
            case 'text':
                metrics.readability = 50 + Math.random() * 50;
                metrics.grammarScore = 60 + Math.random() * 40;
                metrics.sentimentScore = Math.random();
                break;
            case 'database':
                metrics.queryPerformance = Math.random() * 100;
                metrics.indexUsage = Math.random() * 100;
                metrics.structureQuality = 50 + Math.random() * 50;
                break;
            default:
                metrics.qualityScore = Math.random() * 100;
        }

        // Appliquer les pondérations si définies
        if (options.weights) {
            Object.entries(options.weights).forEach(([key, weight]) => {
                if (metrics[key] !== undefined) {
                    metrics[key] = metrics[key] * weight;
                }
            });
        }

        // Générer des problèmes simulés
        const issues = Array.from({ length: issuesCount }).map((_, index) => ({
            id: `issue-${contentType}-${index}`,
            severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
            message: `Problème simulé #${index + 1} pour type ${contentType}`,
            location: `line:${Math.floor(Math.random() * 100)}`,
        }));

        // Générer des suggestions simulées
        const suggestions = Array.from({ length: suggestionsCount }).map((_, index) => ({
            id: `suggestion-${contentType}-${index}`,
            message: `Suggestion simulée #${index + 1} pour type ${contentType}`,
            priority: Math.floor(Math.random() * 10) + 1,
        }));

        return {
            score: baseScore,
            metrics,
            issues,
            suggestions,
        };
    }
}