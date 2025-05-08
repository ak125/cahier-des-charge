/**
 * Interfaces pour la conversion de types entre MySQL, PostgreSQL et Prisma
 */

/**
 * Représente une entrée dans la carte de correspondance des types
 */
export interface TypeMappingEntry {
    /** Type MySQL d'origine */
    mysql: string;
    /** Type PostgreSQL correspondant */
    postgres: string;
    /** Type Prisma correspondant */
    prisma: string;
    /** Indication si le type nécessite une longueur/précision */
    needsLength?: boolean;
    /** Indication si le type nécessite une précision et une échelle */
    needsPrecision?: boolean;
    /** Avertissement concernant la conversion */
    warning?: string;
    /** Suggestion pour améliorer le type */
    suggestion?: string;
}

/**
 * Carte complète des correspondances de types
 */
export type TypeMapping = Record<string, TypeMappingEntry>;

/**
 * Résultat de conversion d'un type
 */
export interface TypeConversionResult {
    /** Type MySQL d'origine */
    mysqlType: string;
    /** Type PostgreSQL généré */
    postgresType: string;
    /** Type Prisma généré */
    prismaType: string;
    /** Type suggéré pour optimisation, si applicable */
    suggestedType?: string;
    /** Longueur ajustée, si applicable */
    adjustedLength?: number;
    /** Indique s'il y a un problème de typage */
    isTypeIssue: boolean;
    /** Description du problème, si applicable */
    problem?: string;
    /** Suggestion de résolution, si applicable */
    suggestion?: string;
    /** Raison de la conversion */
    reason: string;
}

/**
 * Règle de conversion de type avec exemples d'utilisation
 */
export interface TypeConversionRule {
    /** Type MySQL d'origine */
    mysqlType: string;
    /** Type PostgreSQL correspondant */
    postgresType: string;
    /** Type Prisma correspondant */
    prismaType: string;
    /** Exemples d'utilisation de cette règle */
    examples: Array<{ table: string; column: string }>;
    /** Raison de cette conversion */
    reason: string;
}

/**
 * Carte des règles de conversion par type MySQL
 */
export type TypeConversionMap = Record<string, TypeConversionRule[]>;

/**
 * Anomalie détectée lors de la conversion
 */
export interface TypeAnomaly {
    /** Type d'anomalie */
    type: 'enum' | 'set' | 'unsigned' | 'time_precision' | 'other';
    /** Nom de la table concernée */
    table: string;
    /** Nom de la colonne concernée */
    column: string;
    /** Type MySQL d'origine */
    mysqlType: string;
    /** Description du problème */
    issue: string;
    /** Recommandation pour résoudre le problème */
    recommendation: string;
    /** Niveau de gravité de l'anomalie */
    severity: 'low' | 'medium' | 'high';
}

/**
 * Informations sur une colonne de base de données
 */
export interface ColumnInfo {
    /** Nom de la colonne */
    name: string;
    /** Type SQL de la colonne */
    type: string;
    /** Type original (avant normalisation) */
    originalType?: string;
    /** Indication si la valeur NULL est autorisée */
    nullable: boolean;
    /** Valeur par défaut */
    defaultValue?: string | null;
    /** Longueur du champ (pour les types char, varchar, etc.) */
    length?: number;
    /** Précision (pour les types numériques) */
    precision?: number;
    /** Échelle (pour les types numériques) */
    scale?: number;
    /** Indique si c'est une clé primaire */
    isPrimary?: boolean;
    /** Informations complémentaires (auto_increment, etc.) */
    extra?: string;
    /** Type PostgreSQL suggéré */
    suggestedPostgresType?: string;
    /** Type Prisma suggéré */
    suggestedPrismaType?: string;
}

/**
 * Options pour la conversion de types
 */
export interface TypeConversionOptions {
    /** Détecte et suggère les optimisations de types */
    detectOptimizations?: boolean;
    /** Détecte les types qui peuvent poser problème */
    detectProblematicTypes?: boolean;
    /** Convertit TINYINT(1) en BOOLEAN */
    convertTinyIntToBoolean?: boolean;
    /** Ajuste automatiquement les tailles de champ trop grandes */
    optimizeFieldSizes?: boolean;
    /** Détecte et crée des énumérations à partir des types ENUM */
    convertEnums?: boolean;
}