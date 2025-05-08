/**
 * types.ts
 * 
 * Types pour le workflow de migration PHP vers NestJS
 */

/**
 * Options d'entrée pour le workflow de migration
 */
export interface MigrationInput {
    // Identifiant unique du projet de migration
    projectId: string;

    // Chemin du répertoire source contenant le code PHP
    sourceDir: string;

    // ORM cible (prisma ou typeorm)
    targetORM?: 'prisma' | 'typeorm';

    // Options pour la phase d'analyse PHP
    analysisOptions?: {
        // Inclure ou exclure certains fichiers
        include?: string[];
        exclude?: string[];
        // Niveau d'analyse profonde
        analysisDepth?: 'basic' | 'medium' | 'deep';
        // Frameworks PHP à détecter
        detectFrameworks?: boolean;
        // Analyse des dépendances
        analyzeDependencies?: boolean;
    };

    // Options pour la génération de schéma
    schemaOptions?: {
        // Format de sortie
        format?: 'prisma' | 'typeorm' | 'mongoose';
        // Génération de relations
        includeRelations?: boolean;
        // Génération d'index
        includeIndexes?: boolean;
        // Support des migrations
        migrations?: boolean;
    };

    // Options pour la génération NestJS
    nestOptions?: {
        // Architecture NestJS
        architecture?: 'standard' | 'ddd' | 'modular';
        // Inclure des tests
        includeTests?: boolean;
        // Génération de documentation
        includeSwagger?: boolean;
        // Ajouter des gardes d'authentification
        includeAuth?: boolean;
    };

    // Options de validation
    validationOptions?: {
        // Niveau de validation
        level?: 'basic' | 'strict';
        // Types de validation
        types?: ('syntax' | 'lint' | 'build' | 'test')[];
    };

    // Options pour le rapport
    reportOptions?: {
        // Format du rapport
        format?: 'html' | 'json' | 'md';
        // Inclure des métriques de qualité
        includeMetrics?: boolean;
    };

    // Tentative automatique de correction
    autoRetry?: boolean;

    // Point de reprise pour continueAsNew
    resumeFrom?: 'analysis' | 'schema' | 'nest' | 'validation' | 'report';
}

/**
 * Résultat de l'analyse PHP
 */
export interface AnalyzePhpResult {
    // Nombre d'entités détectées
    entityCount: number;

    // Modèles détectés
    models: Array<{
        name: string;
        tableName?: string;
        fields: Array<{
            name: string;
            type: string;
            nullable: boolean;
            references?: {
                model: string;
                field: string;
            }
        }>;
    }>;

    // Contrôleurs détectés
    controllers: Array<{
        name: string;
        endpoints: Array<{
            path: string;
            method: string;
            handler: string;
        }>;
    }>;

    // Services/Logique métier détectés
    services: Array<{
        name: string;
        methods: string[];
        dependencies: string[];
    }>;

    // Dépendances externes
    dependencies: Record<string, string>;

    // Framework PHP détecté
    detectedFramework?: string;
}

/**
 * Résultat de la génération de schéma
 */
export interface GenerateSchemaResult {
    // Nombre de modèles générés
    modelCount: number;

    // Chemins des fichiers de schéma générés
    schemaFiles: string[];

    // Mappings entre modèles PHP et schémas générés
    modelMappings: Record<string, string>;

    // ORM utilisé
    orm: 'prisma' | 'typeorm' | 'mongoose';
}

/**
 * Résultat de la génération de module NestJS
 */
export interface GenerateNestModuleResult {
    // Nombre de modules générés
    moduleCount: number;

    // Nombre de contrôleurs générés
    controllerCount: number;

    // Nombre de services générés
    serviceCount: number;

    // Nombre d'entités/DTOs générés
    entityCount: number;

    // Répertoire de sortie
    outputDir: string;

    // Structure du projet généré
    structure: {
        modules: string[];
        controllers: string[];
        services: string[];
        entities: string[];
        dtos: string[];
    };
}

/**
 * Résultat de la validation du code généré
 */
export interface ValidateResult {
    // Validation réussie ou échouée
    success: boolean;

    // Erreurs détectées
    errors: Array<{
        file: string;
        line: number;
        message: string;
        severity: 'error' | 'warning' | 'info';
        code?: string;
    }>;

    // Métriques de qualité
    metrics?: {
        coverage?: number;
        complexity?: number;
        duplication?: number;
        maintainability?: number;
    };
}

/**
 * Résultat de la génération du rapport de migration
 */
export interface MigrationReportResult {
    // URL du rapport généré
    reportUrl: string;

    // Statistiques de la migration
    stats: {
        totalFiles: number;
        migratedFiles: number;
        modelsCount: number;
        endpointsCount: number;
        linesOfCode: number;
        completionPercentage: number;
        timeElapsed: number;
    };

    // Éléments non migrés ou avec avertissements
    warnings?: Array<{
        type: string;
        message: string;
        file?: string;
        suggestion?: string;
    }>;
}

/**
 * Résultat de la correction automatique
 */
export interface AutoFixResult {
    // Nombre d'erreurs corrigées
    fixedCount: number;

    // Erreurs restantes
    remainingErrors: Array<{
        file: string;
        line: number;
        message: string;
        severity: 'error' | 'warning' | 'info';
        code?: string;
    }>;

    // Fichiers modifiés
    modifiedFiles: string[];
}