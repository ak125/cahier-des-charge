/**
 * Types pour le workflow consolidé d'analyse PHP
 * 
 * Ce fichier contient les interfaces et types partagés entre le workflow et les activités.
 */

/**
 * Configuration d'entrée pour l'analyseur PHP consolidé
 */
export interface ConsolidatedPhpAnalyzerInput {
    /** Chemin vers le code source PHP à analyser */
    sourcePath: string;

    /** Extensions de fichiers à analyser, par défaut ['php'] */
    fileExtensions?: string[];

    /** Analyse récursive des sous-répertoires (par défaut true) */
    recursive?: boolean;

    /** Patterns de répertoires/fichiers à exclure */
    exclude?: string[];

    /** Répertoire de sortie pour les résultats d'analyse */
    outputDir?: string;

    /** Configuration pour l'analyse statique */
    staticAnalysis?: {
        /** Activer l'analyse statique (par défaut true) */
        enabled?: boolean;

        /** Point de terminaison de l'analyseur PHP */
        analyzerEndpoint?: string;

        /** Nombre maximal d'analyses concurrentes */
        concurrency?: number;

        /** Options spécifiques à l'analyseur */
        options?: Record<string, any>;
    };

    /** Configuration pour l'analyse de complexité */
    complexityAnalysis?: {
        /** Activer l'analyse de complexité (par défaut true) */
        enabled?: boolean;

        /** Seuils pour catégoriser la complexité */
        thresholds?: {
            /** Limite pour code considéré comme simple */
            simple: number;

            /** Limite pour code considéré comme moyennement complexe */
            medium: number;

            /** Au-delà de cette valeur, le code est considéré comme complexe */
            complex: number;
        };

        /** Activer la détection de duplication (par défaut true) */
        detectDuplication?: boolean;

        /** Options spécifiques à l'analyseur de complexité */
        options?: Record<string, any>;
    };

    /** Configuration pour l'analyse de sécurité */
    securityAnalysis?: {
        /** Activer l'analyse de sécurité (par défaut true) */
        enabled?: boolean;

        /** Inclure la détection de vulnérabilités (par défaut true) */
        includeVulnerabilities?: boolean;

        /** Niveau de sévérité minimal à reporter */
        severity?: 'critical' | 'high' | 'medium' | 'low' | 'all';

        /** Options spécifiques à l'analyseur de sécurité */
        options?: Record<string, any>;
    };

    /** Options pour la génération de rapports */
    reporting?: {
        /** Générer un résumé (par défaut true) */
        generateSummary?: boolean;

        /** Inclure des visualisations graphiques */
        includeVisualizations?: boolean;

        /** Format des rapports */
        format?: 'json' | 'html' | 'both';

        /** URL de notification webhook pour signaler la fin de l'analyse */
        notifyWebhook?: string;

        /** Options supplémentaires pour les rapports */
        options?: Record<string, any>;
    };
}

/**
 * État du workflow d'analyse PHP
 */
export interface WorkflowState {
    /** Configuration utilisée pour cette exécution */
    config: ConsolidatedPhpAnalyzerInput;

    /** Statut actuel du workflow */
    status: 'initializing' | 'analyzing' | 'completed' | 'failed';

    /** Informations de progression */
    progress: {
        /** Heure de début (ISO string) */
        startTime: string;

        /** Étape actuelle */
        currentStep: string;

        /** Nombre d'étapes complétées */
        completedSteps: number;

        /** Nombre total d'étapes */
        totalSteps: number;
    };

    /** Résultat d'analyse */
    result: ConsolidatedPhpAnalyzerResult;

    /** Erreurs éventuelles */
    errors?: string[];
}

/**
 * Résultat d'analyse PHP consolidé
 */
export interface ConsolidatedPhpAnalyzerResult {
    /** Heure de début (ISO string) */
    startTime: string;

    /** Heure de fin (ISO string) */
    endTime: string;

    /** Durée totale en millisecondes */
    duration: number;

    /** Métadonnées sur l'analyse */
    metadata: {
        /** Version de l'analyseur */
        version: string;

        /** Date d'analyse */
        analyzedAt: string;

        /** Configuration utilisée */
        configUsed: ConsolidatedPhpAnalyzerInput;

        /** Nombre de fichiers analysés */
        filesAnalyzed: number;

        /** Total des lignes de code analysées */
        totalLinesOfCode: number;
    };

    /** Résultats d'analyse statique */
    staticAnalysis?: {
        /** Statut global (true si réussi) */
        passed: boolean;

        /** Score d'analyse (0-100) */
        score: number;

        /** Nombre de fichiers analysés */
        filesAnalyzed: number;

        /** Nombre total de lignes de code */
        linesOfCode: number;

        /** Nombre de classes trouvées */
        classes: number;

        /** Nombre de fonctions trouvées */
        functions: number;

        /** Résultats détaillés par fichier */
        fileResults: any[];

        /** Problèmes détectés */
        issues: Array<{
            file: string;
            line: number;
            type: string;
            message: string;
            severity: string;
        }>;

        /** Résumé des résultats */
        summary: any;
    };

    /** Résultats d'analyse de complexité */
    complexityAnalysis?: {
        /** Statut global (true si réussi) */
        passed: boolean;

        /** Score de complexité (0-100, 100 étant optimal) */
        score: number;

        /** Points chauds de complexité */
        hotspots: Array<{
            file: string;
            complexity: number;
            loc: number;
            category: 'simple' | 'medium' | 'complex';
        }>;

        /** Statistiques de complexité */
        stats: {
            /** Complexité moyenne */
            average: number;

            /** Complexité maximale */
            max: number;

            /** Distribution par catégorie */
            distribution: {
                simple: number;
                medium: number;
                complex: number;
            };
        };

        /** Résultats de duplication de code (si activé) */
        duplication?: {
            /** Pourcentage de code dupliqué */
            duplicationPercentage: number;

            /** Nombre de blocs dupliqués */
            duplicatedBlocks: number;

            /** Nombre de lignes dupliquées */
            duplicatedLines: number;

            /** Détails des duplications */
            details: Array<{
                files: string[];
                lines: number;
                startLine: number;
            }>;
        };
    };

    /** Résultats d'analyse de sécurité */
    securityAnalysis?: {
        /** Statut global (true si réussi) */
        passed: boolean;

        /** Score de sécurité (0-100, 100 étant optimal) */
        score: number;

        /** Nombre total de vulnérabilités */
        vulnerabilitiesCount: number;

        /** Nombre de vulnérabilités critiques */
        criticalCount: number;

        /** Nombre de vulnérabilités élevées */
        highCount: number;

        /** Nombre de vulnérabilités moyennes */
        mediumCount: number;

        /** Nombre de vulnérabilités faibles */
        lowCount: number;

        /** Liste des vulnérabilités détectées */
        vulnerabilities: Array<{
            file: string;
            line: number;
            type: string;
            description: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
            cwe?: string;
            remediation?: string;
        }>;
    };

    /** Chemins vers les rapports générés */
    reportPaths?: {
        summary: string;
        details?: string;
        visualizations?: string;
    };
}