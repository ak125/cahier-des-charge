/**
 * Types utilisés par le module de validation sécurisée
 */

/**
 * Types de fichiers supportés pour la validation
 */
export type FileType = 'ts' | 'js' | 'json' | 'prisma' | 'wasm' | 'graphql' | 'yaml' | 'unknown';

/**
 * Niveaux de sévérité pour les problèmes détectés
 */
export enum SeverityLevel {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

/**
 * Représentation d'un problème détecté dans le code
 */
export interface CodeIssue {
    /** Niveau de sévérité du problème */
    severity: SeverityLevel;

    /** Message décrivant le problème */
    message: string;

    /** Position de début du problème */
    position?: {
        line: number;
        column?: number;
    };

    /** Code concerné */
    code?: string;

    /** Catégorie du problème */
    category: 'security' | 'compliance' | 'semantic' | 'general';

    /** Règle ou test ayant détecté le problème */
    rule: string;

    /** Suggestions pour résoudre le problème */
    suggestions?: string[];
}

/**
 * Résultat d'une validation de code
 */
export interface ValidationResult {
    /** Validation réussie ou échouée */
    success: boolean;

    /** Liste des problèmes détectés */
    issues: CodeIssue[];

    /** Type de fichier validé */
    fileType: FileType;

    /** Chemin du fichier validé (s'il existe) */
    filePath?: string;

    /** Méta-données supplémentaires sur le résultat */
    metadata?: Record<string, any>;
}

/**
 * Options pour les scanners de sécurité
 */
export interface SecurityScanOptions {
    /** Active ou désactive certaines règles */
    rules?: {
        disableRules?: string[];
        enabledRules?: string[];
    };

    /** Niveau de sévérité minimum à signaler */
    minSeverity?: SeverityLevel;

    /** Règles personnalisées */
    customRules?: Array<{
        pattern: RegExp | string;
        message: string;
        severity: SeverityLevel;
    }>;
}

/**
 * Options pour les vérificateurs de conformité 
 */
export interface ComplianceOptions {
    /** Standards de conformité à vérifier */
    standards?: ('nestjs' | 'typescript' | 'prisma' | 'react' | 'vue' | 'angular')[];

    /** Chemins vers des schémas de validation personnalisés */
    schemasPaths?: string[];

    /** Types d'architecture à respecter */
    architecture?: {
        type: 'mvc' | 'layered' | 'microservices' | 'ddd' | 'custom';
        customRules?: Record<string, any>;
    };
}

/**
 * Options pour les validateurs sémantiques
 */
export interface SemanticValidationOptions {
    /** Active la vérification de type TypeScript */
    typeCheck?: boolean;

    /** Valide les schémas Zod */
    validateZodSchemas?: boolean;

    /** Vérifie les DTOs */
    validateDTOs?: {
        requireValidation: boolean;
        requireTypes: boolean;
    };

    /** Utilise l'IA pour vérifier la sémantique du code */
    useAI?: boolean;
}

/**
 * Options générales pour la validation sécurisée
 */
export interface SafeValidationOptions {
    security?: SecurityScanOptions;
    compliance?: ComplianceOptions;
    semantic?: SemanticValidationOptions;

    /** Chemin du fichier ou du répertoire à valider */
    path?: string;

    /** Contenu du code à valider (si pas de fichier) */
    content?: string;

    /** Type de fichier (si pas automatiquement déterminé) */
    fileType?: FileType;
}