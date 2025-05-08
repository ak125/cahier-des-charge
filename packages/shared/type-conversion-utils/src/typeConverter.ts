/**
 * Utilitaires de conversion de types entre MySQL, PostgreSQL et Prisma
 */

import { DEFAULT_TYPE_MAPPINGS, PROBLEMATIC_TYPES } from './constants';
import {
    ColumnInfo,
    TypeConversionResult,
    TypeConversionOptions,
    TypeAnomaly
} from './types';

/**
 * Convertit un type MySQL en types PostgreSQL et Prisma
 * 
 * @param column - Informations sur la colonne
 * @param tableName - Nom de la table
 * @param columnName - Nom de la colonne
 * @param options - Options de conversion
 * @returns Résultat de la conversion
 */
export function convertMySQLType(
    column: ColumnInfo,
    tableName: string,
    columnName: string,
    options: TypeConversionOptions = {}
): TypeConversionResult {
    // Options avec valeurs par défaut
    const conversionOptions: Required<TypeConversionOptions> = {
        detectOptimizations: options.detectOptimizations ?? true,
        detectProblematicTypes: options.detectProblematicTypes ?? true,
        convertTinyIntToBoolean: options.convertTinyIntToBoolean ?? true,
        optimizeFieldSizes: options.optimizeFieldSizes ?? true,
        convertEnums: options.convertEnums ?? true
    };

    // Cas spécial pour TINYINT(1) -> BOOLEAN
    if (
        conversionOptions.convertTinyIntToBoolean &&
        isTinyIntOne(column.type)
    ) {
        return {
            mysqlType: column.type,
            postgresType: 'BOOLEAN',
            prismaType: 'Boolean',
            suggestedType: 'BOOLEAN',
            isTypeIssue: true,
            problem: 'TINYINT(1) est généralement utilisé comme un booléen',
            suggestion: 'Convertir en BOOLEAN',
            reason: 'Optimisation du typage - TINYINT(1) représente généralement un booléen'
        };
    }

    // Vérifier les cas spéciaux basés sur les noms de colonnes
    if (conversionOptions.convertTinyIntToBoolean) {
        const booleanByName = detectBooleanByColumnName(column, columnName);
        if (booleanByName) {
            return booleanByName;
        }
    }

    // Extraire le type de base
    const baseType = extractBaseType(column.type);

    // Récupérer le mapping
    const mapping = DEFAULT_TYPE_MAPPINGS[baseType.toUpperCase()];

    if (mapping) {
        let postgresType = mapping.postgresType;
        const prismaType = mapping.prismaType;
        let adjustedLength: number | undefined;
        let isTypeIssue = false;
        let problem: string | undefined;
        let suggestion: string | undefined;
        let reason = 'Conversion standard de MySQL vers PostgreSQL';

        // Ajustement des longueurs pour les types qui en ont besoin
        if (mapping.needsLength && column.length) {
            // Optimisation des VARCHAR(255) excessifs
            if (
                conversionOptions.optimizeFieldSizes &&
                baseType === 'VARCHAR' &&
                column.length === 255 &&
                !column.isPrimary
            ) {
                // Suggestion d'optimisation pour VARCHAR(255)
                adjustedLength = 191;  // Taille optimale pour UTF8MB4 avec index
                postgresType = `${postgresType}(${adjustedLength})`;
                isTypeIssue = true;
                problem = 'VARCHAR(255) peut être optimisé';
                suggestion = `Réduire à VARCHAR(191) pour optimiser le stockage`;
                reason = 'Optimisation de la taille';
            } else {
                // Conserver la longueur spécifiée
                postgresType = `${postgresType}(${column.length})`;
            }
        } else if (mapping.needsPrecision && column.precision) {
            // Gérer les types avec précision/échelle
            if (column.scale !== undefined) {
                postgresType = `${postgresType}(${column.precision},${column.scale})`;
            } else {
                postgresType = `${postgresType}(${column.precision})`;
            }
        }

        // Détection des anomalies pour les types problématiques
        if (conversionOptions.detectProblematicTypes) {
            const anomaly = detectTypeAnomaly(column, tableName, columnName);
            if (anomaly) {
                isTypeIssue = true;
                problem = anomaly.issue;
                suggestion = anomaly.recommendation;
                reason = `Conversion avec avertissement: ${anomaly.issue}`;
            }
        }

        return {
            mysqlType: column.type,
            postgresType,
            prismaType,
            suggestedType: isTypeIssue ? postgresType : undefined,
            adjustedLength,
            isTypeIssue,
            problem,
            suggestion,
            reason
        };
    }

    // Type non reconnu, utiliser TEXT/String par défaut
    return {
        mysqlType: column.type,
        postgresType: 'TEXT',
        prismaType: 'String',
        isTypeIssue: true,
        problem: `Type MySQL non reconnu: ${column.type}`,
        suggestion: 'Vérifier manuellement la conversion',
        reason: 'Type non supporté dans le mapping'
    };
}

/**
 * Vérifie si le type est TINYINT(1)
 */
function isTinyIntOne(type: string): boolean {
    return /^tinyint\(1\)$/i.test(type);
}

/**
 * Essaie de détecter si une colonne devrait être un booléen basé sur son nom
 */
function detectBooleanByColumnName(
    column: ColumnInfo,
    columnName: string
): TypeConversionResult | null {
    // Vérifier les préfixes et noms communs pour les colonnes booléennes
    if (
        /^(is|has|can|should|allow)_/i.test(columnName) ||
        /^(active|enabled|visible|deleted|archived|published|locked|required)$/i.test(columnName)
    ) {
        return {
            mysqlType: column.type,
            postgresType: 'BOOLEAN',
            prismaType: 'Boolean',
            suggestedType: 'BOOLEAN',
            isTypeIssue: true,
            problem: `Le nom de la colonne "${columnName}" suggère un type booléen`,
            suggestion: 'Convertir en BOOLEAN',
            reason: 'Optimisation basée sur la convention de nommage'
        };
    }

    return null;
}

/**
 * Extrait le type de base d'un type MySQL (sans la longueur/précision)
 */
export function extractBaseType(type: string): string {
    // Extraire le type de base sans les paramètres
    const match = type.match(/^([A-Za-z]+)/i);
    return match ? match[1].toUpperCase() : type.toUpperCase();
}

/**
 * Détecte les anomalies potentielles dans la conversion des types
 */
function detectTypeAnomaly(
    column: ColumnInfo,
    tableName: string,
    columnName: string
): TypeAnomaly | null {
    const type = column.type.toUpperCase();
    const baseType = extractBaseType(type);

    // Vérifier les types ENUM (conversion complexe en PostgreSQL)
    if (baseType === 'ENUM') {
        return {
            type: 'enum',
            table: tableName,
            column: columnName,
            mysqlType: column.type,
            issue: 'Les ENUM MySQL ne sont pas nativement supportés par PostgreSQL',
            recommendation: 'Créer un type ENUM dans Prisma ou utiliser une table de référence',
            severity: 'medium'
        };
    }

    // Vérifier les types SET (non supportés en PostgreSQL)
    if (baseType === 'SET') {
        return {
            type: 'set',
            table: tableName,
            column: columnName,
            mysqlType: column.type,
            issue: 'Les types SET MySQL ne sont pas supportés par PostgreSQL',
            recommendation: 'Utiliser un tableau (TEXT[]) ou une table de jointure',
            severity: 'high'
        };
    }

    // Vérifier les UNSIGNED (non supportés en PostgreSQL)
    if (type.includes('UNSIGNED')) {
        return {
            type: 'unsigned',
            table: tableName,
            column: columnName,
            mysqlType: column.type,
            issue: 'PostgreSQL ne supporte pas les types UNSIGNED',
            recommendation: 'Utiliser un type numérique de taille supérieure ou une contrainte CHECK',
            severity: 'medium'
        };
    }

    // Vérifier les types spatiaux
    if (PROBLEMATIC_TYPES.includes(baseType)) {
        return {
            type: 'other',
            table: tableName,
            column: columnName,
            mysqlType: column.type,
            issue: `Le type ${baseType} nécessite une attention particulière`,
            recommendation: baseType === 'GEOMETRY'
                ? 'Utiliser l\'extension PostGIS'
                : 'Vérifier la compatibilité avec PostgreSQL',
            severity: 'high'
        };
    }

    // Aucune anomalie détectée
    return null;
}

/**
 * Extrait les valeurs d'énumération d'un type ENUM MySQL
 */
export function extractEnumValues(enumType: string): string[] {
    const enumMatch = enumType.match(/ENUM\(([^)]+)\)/i);
    if (enumMatch) {
        // Extraire les valeurs entre parenthèses et les nettoyer
        return enumMatch[1]
            .split(',')
            .map(val => val.trim().replace(/^'|'$/g, ''));
    }
    return [];
}

/**
 * Génère une définition d'énumération Prisma à partir d'un type ENUM MySQL
 */
export function generatePrismaEnum(
    tableName: string,
    columnName: string,
    enumType: string
): string | null {
    const values = extractEnumValues(enumType);
    if (values.length === 0) return null;

    // Générer un nom d'énumération basé sur la table et la colonne
    const enumName = formatEnumName(tableName, columnName);

    // Générer la définition de l'énumération
    return `enum ${enumName} {\n  ${values.join('\n  ')}\n}`;
}

/**
 * Formate un nom d'énumération à partir du nom de table et de colonne
 */
export function formatEnumName(tableName: string, columnName: string): string {
    // Convertir snake_case en PascalCase
    const formatPart = (part: string) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();

    const tableNameFormatted = tableName
        .split('_')
        .map(formatPart)
        .join('');

    const columnNameFormatted = columnName
        .split('_')
        .map(formatPart)
        .join('');

    return `${tableNameFormatted}${columnNameFormatted}Enum`;
}