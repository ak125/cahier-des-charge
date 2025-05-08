/**
 * smart-seo-checker-agent.ts
 * 
 * Agent SEO intelligent avec capacités de mémoire
 * Utilise l'architecture Memo pour mémoriser et apprendre des vérifications précédentes
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseMemoAgent, MemoAgentOptions } from '../../src/core/agents/base-memo-agent';
import { MemoData } from '../../src/core/memo/memo-manager';

/**
 * Configuration pour l'agent SEO intelligent
 */
export interface SmartSeoCheckerConfig {
    /**
     * URL racine du site à vérifier
     */
    baseUrl?: string;

    /**
     * Profondeur maximale pour le crawl
     */
    maxDepth?: number;

    /**
     * Nombres maximum d'URLs à vérifier
     */
    maxUrls?: number;

    /**
     * Mots-clés principaux à vérifier
     */
    keywords?: string[];

    /**
     * Limite de tentatives par URL
     */
    maxRetries?: number;

    /**
     * Activer l'apprentissage à partir des vérifications précédentes
     */
    enableLearning?: boolean;

    /**
     * Options supplémentaires
     */
    [key: string]: any;
}

/**
 * Structure pour une URL vérifiée
 */
export interface SeoUrlCheck {
    /**
     * URL vérifiée
     */
    url: string;

    /**
     * Horodatage de la vérification
     */
    timestamp: number;

    /**
     * Score SEO total (0-100)
     */
    score: number;

    /**
     * Résultats détaillés par catégorie
     */
    details: {
        /**
         * Score pour les méta-données (titre, description, etc.)
         */
        metaScore: number;

        /**
         * Score pour le contenu (mots-clés, structure, etc.)
         */
        contentScore: number;

        /**
         * Score pour la performance
         */
        performanceScore: number;

        /**
         * Score pour l'accessibilité
         */
        accessibilityScore: number;

        /**
         * Autres métriques spécifiques
         */
        [key: string]: number;
    };

    /**
     * Problèmes identifiés
     */
    issues: Array<{
        type: string;
        severity: 'high' | 'medium' | 'low';
        message: string;
        element?: string;
    }>;

    /**
     * Suggestions d'amélioration
     */
    suggestions: Array<{
        type: string;
        message: string;
        priority: number;
        implementation?: string;
    }>;
}

/**
 * Résultat complet d'une vérification SEO
 */
export interface SeoCheckResult {
    /**
     * Identifiant unique de la vérification
     */
    id: string;

    /**
     * Horodatage de début
     */
    startTime: number;

    /**
     * Horodatage de fin
     */
    endTime: number;

    /**
     * URL de base vérifiée
     */
    baseUrl: string;

    /**
     * Nombre total d'URLs vérifiées
     */
    urlsChecked: number;

    /**
     * Score moyen du site
     */
    averageScore: number;

    /**
     * Résultats par URL
     */
    urls: Record<string, SeoUrlCheck>;

    /**
     * Top problèmes identifiés (agrégés)
     */
    topIssues: Array<{
        type: string;
        count: number;
        severity: 'high' | 'medium' | 'low';
        message: string;
    }>;

    /**
     * Top suggestions d'amélioration (agrégées)
     */
    topSuggestions: Array<{
        type: string;
        count: number;
        message: string;
        priority: number;
    }>;

    /**
     * Configuration utilisée
     */
    config: SmartSeoCheckerConfig;
}

/**
 * Agent SEO intelligent avec mémoire
 * Utilise l'architecture Memo pour se souvenir des vérifications précédentes et apprendre
 */
export class SmartSeoCheckerAgent extends BaseMemoAgent {
    /**
     * Configuration par défaut
     */
    private defaultConfig: SmartSeoCheckerConfig = {
        maxDepth: 3,
        maxUrls: 100,
        maxRetries: 3,
        enableLearning: true
    };

    /**
     * Configuration actuelle
     */
    private config: SmartSeoCheckerConfig;

    /**
     * Constructeur
     */
    constructor(options: MemoAgentOptions & { config?: SmartSeoCheckerConfig }) {
        super({
            ...options,
            type: 'SeoChecker',
        });

        // Initialiser la configuration
        this.config = {
            ...this.defaultConfig,
            ...options.config
        };
    }

    /**
     * Méthode principale pour vérifier un site
     */
    async checkSite(url: string, options?: Partial<SmartSeoCheckerConfig>): Promise<SeoCheckResult> {
        // Fusionner les options
        const config = {
            ...this.config,
            ...options,
            baseUrl: url
        };

        const checkId = uuidv4();
        const startTime = Date.now();

        // Log de début
        console.log(`[${this.name}] Démarrage de la vérification SEO pour ${url} (ID: ${checkId})`);

        // Si l'apprentissage est activé et que la mémoire est initialisée
        let previousPatterns: Record<string, any> = {};
        if (config.enableLearning && this.memoryInitialized) {
            // Rechercher des vérifications précédentes pour ce domaine ou des domaines similaires
            const domainName = this.extractDomain(url);
            console.log(`[${this.name}] Recherche de vérifications précédentes pour le domaine ${domainName}...`);

            const previousChecks = await this.searchMemory<SeoCheckResult>({
                type: 'seo-check-result'
            });

            if (previousChecks.length > 0) {
                console.log(`[${this.name}] ${previousChecks.length} vérifications précédentes trouvées, extraction des motifs...`);
                previousPatterns = this.extractPatternsFromPreviousChecks(previousChecks);
            }
        }

        // Simuler la vérification du site (dans un vrai cas, on utiliserait un crawler)
        const urls = await this.simulateCrawl(url, config.maxDepth || 3, config.maxUrls || 100);

        // Résultats par URL
        const urlResults: Record<string, SeoUrlCheck> = {};
        let totalScore = 0;

        // Compteurs pour agréger les problèmes et suggestions
        const issueCounter: Record<string, { count: number; severity: string; message: string }> = {};
        const suggestionCounter: Record<string, { count: number; message: string; priority: number }> = {};

        // Vérifier chaque URL
        for (const urlToCheck of urls) {
            // Avec la vraie implémentation, on ferait une vérification réelle ici
            const checkResult = await this.checkUrl(urlToCheck, config, previousPatterns);

            // Ajouter aux résultats
            urlResults[urlToCheck] = checkResult;
            totalScore += checkResult.score;

            // Agréger les problèmes
            checkResult.issues.forEach(issue => {
                if (!issueCounter[issue.type]) {
                    issueCounter[issue.type] = { count: 0, severity: issue.severity, message: issue.message };
                }
                issueCounter[issue.type].count++;
            });

            // Agréger les suggestions
            checkResult.suggestions.forEach(suggestion => {
                if (!suggestionCounter[suggestion.type]) {
                    suggestionCounter[suggestion.type] = {
                        count: 0,
                        message: suggestion.message,
                        priority: suggestion.priority
                    };
                }
                suggestionCounter[suggestion.type].count++;
            });
        }

        // Calculer le score moyen
        const averageScore = totalScore / urls.length;
        const endTime = Date.now();

        // Transformer les compteurs en tableaux triés
        const topIssues = Object.entries(issueCounter)
            .map(([type, data]) => ({
                type,
                count: data.count,
                severity: data.severity as 'high' | 'medium' | 'low',
                message: data.message
            }))
            .sort((a, b) => {
                // Trier d'abord par sévérité, puis par nombre d'occurrences
                const severityOrder = { high: 3, medium: 2, low: 1 };
                const sevA = severityOrder[a.severity] || 0;
                const sevB = severityOrder[b.severity] || 0;

                if (sevA !== sevB) return sevB - sevA;
                return b.count - a.count;
            });

        const topSuggestions = Object.entries(suggestionCounter)
            .map(([type, data]) => ({
                type,
                count: data.count,
                message: data.message,
                priority: data.priority
            }))
            .sort((a, b) => {
                // Trier d'abord par priorité, puis par nombre d'occurrences
                if (a.priority !== b.priority) return b.priority - a.priority;
                return b.count - a.count;
            });

        // Résultat final
        const result: SeoCheckResult = {
            id: checkId,
            startTime,
            endTime,
            baseUrl: url,
            urlsChecked: urls.length,
            averageScore,
            urls: urlResults,
            topIssues,
            topSuggestions,
            config
        };

        // Stocker le résultat en mémoire pour apprentissage futur
        if (this.memoryInitialized) {
            console.log(`[${this.name}] Mémorisation des résultats pour apprentissage futur...`);

            const memoData: MemoData<SeoCheckResult> = {
                type: 'seo-check-result',
                data: result,
                runId: checkId,
                metadata: {
                    domain: this.extractDomain(url),
                    timestamp: startTime,
                    score: averageScore,
                    urlsCount: urls.length,
                    issuesCount: topIssues.reduce((sum, issue) => sum + issue.count, 0)
                }
            };

            await this.remember(checkId, memoData);
        }

        console.log(`[${this.name}] Vérification SEO terminée pour ${url} avec un score moyen de ${averageScore.toFixed(2)}/100`);
        return result;
    }

    /**
     * Vérifier une URL spécifique
     * Dans un cas réel, cette méthode ferait une vérification complète de l'URL
     */
    private async checkUrl(
        url: string,
        config: SmartSeoCheckerConfig,
        patterns: Record<string, any>
    ): Promise<SeoUrlCheck> {
        // Simuler un délai pour l'analyse
        await new Promise(r => setTimeout(r, 50));

        // Score de base simulé (entre 60 et 90)
        let baseScore = 60 + Math.random() * 30;

        // Simuler l'utilisation des motifs précédents pour améliorer l'analyse
        if (Object.keys(patterns).length > 0) {
            // Bonus de score si nous avons des motifs précédents (jusqu'à +5%)
            baseScore = Math.min(100, baseScore * (1 + (Math.random() * 0.05)));
        }

        // Générer des scores détaillés basés sur le score global
        const metaScore = Math.min(100, baseScore + (Math.random() * 10 - 5));
        const contentScore = Math.min(100, baseScore + (Math.random() * 10 - 5));
        const performanceScore = Math.min(100, baseScore + (Math.random() * 10 - 5));
        const accessibilityScore = Math.min(100, baseScore + (Math.random() * 10 - 5));

        // Générer un nombre variable de problèmes basé sur le score (moins de problèmes = meilleur score)
        const issuesCount = Math.max(0, Math.floor((100 - baseScore) / 10));

        // Types de problèmes possibles
        const issueTypes = [
            { type: 'missing-title', severity: 'high', message: 'Balise title manquante' },
            { type: 'missing-meta-desc', severity: 'high', message: 'Meta description manquante' },
            { type: 'duplicate-title', severity: 'medium', message: 'Titre dupliqué' },
            { type: 'low-word-count', severity: 'medium', message: 'Contenu trop court' },
            { type: 'keyword-density', severity: 'medium', message: 'Densité de mots-clés insuffisante' },
            { type: 'missing-alt', severity: 'medium', message: 'Images sans attribut alt' },
            { type: 'slow-page', severity: 'high', message: 'Page trop lente' },
            { type: 'mobile-unfriendly', severity: 'high', message: 'Non optimisé pour mobile' },
            { type: 'broken-links', severity: 'medium', message: 'Liens cassés détectés' },
            { type: 'shallow-content', severity: 'low', message: 'Contenu superficiel' }
        ];

        // Sélectionner des problèmes aléatoires
        const issues = Array.from({ length: issuesCount }).map(() => {
            const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
            return {
                type: issue.type,
                severity: issue.severity as 'high' | 'medium' | 'low',
                message: issue.message,
                element: `sample-element-${Math.floor(Math.random() * 100)}`
            };
        });

        // Générer des suggestions basées sur les problèmes
        const suggestions = issues.map(issue => {
            let suggestion;

            switch (issue.type) {
                case 'missing-title':
                    suggestion = {
                        type: 'add-title',
                        message: 'Ajouter une balise title descriptive',
                        priority: 10,
                        implementation: '<title>Titre descriptif avec mots-clés</title>'
                    };
                    break;
                case 'missing-meta-desc':
                    suggestion = {
                        type: 'add-meta-desc',
                        message: 'Ajouter une meta description informative',
                        priority: 9,
                        implementation: '<meta name="description" content="Description informative avec mots-clés">'
                    };
                    break;
                case 'low-word-count':
                    suggestion = {
                        type: 'expand-content',
                        message: 'Enrichir le contenu à au moins 500 mots',
                        priority: 7
                    };
                    break;
                default:
                    suggestion = {
                        type: `fix-${issue.type}`,
                        message: `Corriger le problème: ${issue.message}`,
                        priority: issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3
                    };
            }

            return suggestion;
        });

        // Résultat final pour cette URL
        return {
            url,
            timestamp: Date.now(),
            score: baseScore,
            details: {
                metaScore,
                contentScore,
                performanceScore,
                accessibilityScore
            },
            issues,
            suggestions
        };
    }

    /**
     * Extrait les motifs des vérifications précédentes pour améliorer l'analyse
     */
    private extractPatternsFromPreviousChecks(previousChecks: any[]): Record<string, any> {
        const patterns: Record<string, any> = {
            commonIssues: {},
            highSeverityIssues: {},
            effectiveSuggestions: {}
        };

        previousChecks.forEach(check => {
            if (!check.data) return;

            const result = check.data as SeoCheckResult;

            // Extraire les problèmes les plus courants
            result.topIssues.forEach(issue => {
                if (!patterns.commonIssues[issue.type]) {
                    patterns.commonIssues[issue.type] = { count: 0, severity: issue.severity, message: issue.message };
                }
                patterns.commonIssues[issue.type].count += issue.count;

                // Collecter les problèmes à haute sévérité
                if (issue.severity === 'high') {
                    if (!patterns.highSeverityIssues[issue.type]) {
                        patterns.highSeverityIssues[issue.type] = { count: 0, message: issue.message };
                    }
                    patterns.highSeverityIssues[issue.type].count += issue.count;
                }
            });

            // Extraire les suggestions les plus utiles
            result.topSuggestions.forEach(suggestion => {
                if (!patterns.effectiveSuggestions[suggestion.type]) {
                    patterns.effectiveSuggestions[suggestion.type] = {
                        count: 0,
                        priority: suggestion.priority,
                        message: suggestion.message
                    };
                }
                patterns.effectiveSuggestions[suggestion.type].count += suggestion.count;
            });
        });

        return patterns;
    }

    /**
     * Extrait le nom de domaine d'une URL
     */
    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            // Si l'URL est invalide, retourner la chaîne originale
            return url;
        }
    }

    /**
     * Simuler un crawl du site (dans un vrai cas, on utiliserait un crawler comme Puppeteer ou Cheerio)
     */
    private async simulateCrawl(baseUrl: string, depth: number, maxUrls: number): Promise<string[]> {
        // Dans un cas réel, cette méthode ferait un vrai crawl du site
        // Ici, nous simulons juste une liste d'URLs pour l'exemple

        const urlCount = Math.min(maxUrls, 5 + Math.floor(Math.random() * 10));
        const urls: string[] = [baseUrl];

        // Générer quelques URLs fictives
        for (let i = 1; i < urlCount; i++) {
            const path = this.getRandomPath(depth);
            try {
                const urlObj = new URL(baseUrl);
                const fullUrl = `${urlObj.protocol}//${urlObj.hostname}${path}`;
                urls.push(fullUrl);
            } catch {
                // Si l'URL de base est invalide, utiliser comme chaîne simple
                urls.push(`${baseUrl}${path}`);
            }
        }

        return urls;
    }

    /**
     * Générer un chemin aléatoire pour les URLs simulées
     */
    private getRandomPath(maxDepth: number): string {
        const depth = 1 + Math.floor(Math.random() * maxDepth);
        const pathParts: string[] = [];

        const commonPaths = [
            'about', 'contact', 'services', 'products', 'blog',
            'news', 'team', 'faq', 'pricing', 'support'
        ];

        for (let i = 0; i < depth; i++) {
            if (i === 0) {
                // Utiliser un chemin commun pour le premier niveau
                pathParts.push(commonPaths[Math.floor(Math.random() * commonPaths.length)]);
            } else {
                // Ajouter des segments aléatoires pour les niveaux suivants
                pathParts.push(`section-${Math.floor(Math.random() * 100)}`);
            }
        }

        // Ajouter une extension de fichier pour certains chemins
        if (Math.random() > 0.7) {
            return `/${pathParts.join('/')}.html`;
        }

        return `/${pathParts.join('/')}`;
    }

    /**
     * Génère un rapport d'apprentissage basé sur les vérifications précédentes
     */
    async generateLearningReport(): Promise<string> {
        if (!this.memoryInitialized) {
            return "Mémoire non initialisée. Impossible de générer un rapport d'apprentissage.";
        }

        // Récupérer toutes les vérifications mémorisées
        const allChecks = await this.searchMemory<SeoCheckResult>({
            type: 'seo-check-result'
        });

        if (allChecks.length === 0) {
            return "Aucune vérification en mémoire. Impossible de générer un rapport d'apprentissage.";
        }

        // Regrouper par domaine
        const byDomain: Record<string, SeoCheckResult[]> = {};

        allChecks.forEach(result => {
            if (!result.found || !result.data) return;

            const check = result.data;
            const domain = this.extractDomain(check.baseUrl);

            if (!byDomain[domain]) {
                byDomain[domain] = [];
            }

            byDomain[domain].push(check);
        });

        // Générer le rapport
        let report = `# Rapport d'apprentissage SEO de l'agent ${this.name}\n\n`;
        report += `Date du rapport: ${new Date().toISOString()}\n`;
        report += `Nombre total de vérifications en mémoire: ${allChecks.length}\n\n`;

        // Pour chaque domaine
        for (const [domain, checks] of Object.entries(byDomain)) {
            report += `## Domaine "${domain}"\n\n`;
            report += `Nombre de vérifications: ${checks.length}\n`;

            // Calculer les statistiques
            const scores = checks.map(check => check.averageScore);
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

            report += `Score SEO moyen: ${avgScore.toFixed(2)}/100\n\n`;

            // Problèmes les plus fréquents sur ce domaine
            const issueCounter: Record<string, { count: number; severity: string; message: string }> = {};

            checks.forEach(check => {
                check.topIssues.forEach(issue => {
                    if (!issueCounter[issue.type]) {
                        issueCounter[issue.type] = { count: 0, severity: issue.severity, message: issue.message };
                    }
                    issueCounter[issue.type].count += issue.count;
                });
            });

            report += `### Problèmes les plus fréquents\n\n`;

            const topIssues = Object.entries(issueCounter)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5);

            if (topIssues.length > 0) {
                topIssues.forEach(([issueType, data], index) => {
                    report += `${index + 1}. "${data.message}" (${data.count} occurrences, sévérité: ${data.severity})\n`;
                });
            } else {
                report += "Aucun problème identifié\n";
            }

            report += `\n`;
        }

        report += `## Évolution dans le temps\n\n`;

        // Trier toutes les vérifications par date
        const sortedByDate = allChecks
            .filter(result => result.found && result.data)
            .map(result => result.data as SeoCheckResult)
            .sort((a, b) => a.startTime - b.startTime);

        if (sortedByDate.length >= 2) {
            const first = sortedByDate[0];
            const last = sortedByDate[sortedByDate.length - 1];

            const scoreDiff = last.averageScore - first.averageScore;
            const issuesDiff = this.getTotalIssueCount(last) - this.getTotalIssueCount(first);

            report += `Évolution du score: ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)} points\n`;
            report += `Évolution du nombre de problèmes: ${issuesDiff > 0 ? '+' : ''}${issuesDiff}\n`;

            // Calculer la tendance générale
            if (sortedByDate.length >= 5) {
                let trend = 'stable';

                const scoresByMonth: Record<string, number[]> = {};
                sortedByDate.forEach(check => {
                    const month = new Date(check.startTime).toISOString().substring(0, 7); // YYYY-MM
                    if (!scoresByMonth[month]) {
                        scoresByMonth[month] = [];
                    }
                    scoresByMonth[month].push(check.averageScore);
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

                    if (lastAvg > firstAvg * 1.05) {
                        trend = 'en amélioration';
                    } else if (lastAvg < firstAvg * 0.95) {
                        trend = 'en détérioration';
                    }
                }

                report += `Tendance générale: ${trend}\n`;
            }
        }

        return report;
    }

    /**
     * Compter le nombre total de problèmes dans une vérification
     */
    private getTotalIssueCount(check: SeoCheckResult): number {
        return check.topIssues.reduce((sum, issue) => sum + issue.count, 0);
    }
}