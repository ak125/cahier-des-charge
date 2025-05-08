/**
 * Utilitaires de conversion de types entre PostgreSQL et Prisma
 */
import { PRISMA_SUPPORTED_POSTGRES_TYPES } from './constants';

/**
 * Convertit un type PostgreSQL en type Prisma
 * 
 * @param pgType - Type PostgreSQL
 * @returns Type Prisma correspondant
 */
export function mapPostgresToPrismaType(pgType: string): string {
  // Extraire le type de base sans les paramètres
  const baseType = pgType.split('(')[0].trim().toUpperCase();

  switch (baseType) {
    // Types numériques
    case 'SMALLINT':
    case 'INTEGER':
    case 'INT':
    case 'INT2':
    case 'INT4':
    case 'INT8':
    case 'SERIAL':
    case 'SMALLSERIAL':
      return 'Int';
    case 'BIGSERIAL':
    case 'BIGINT':
      return 'BigInt';
    case 'DECIMAL':
    case 'NUMERIC':
      return 'Decimal';
    case 'REAL':
    case 'FLOAT4':
    case 'FLOAT8':
    case 'DOUBLE PRECISION':
      return 'Float';

    // Types booléens
    case 'BOOLEAN':
    case 'BOOL':
      return 'Boolean';

    // Types texte
    case 'CHAR':
    case 'VARCHAR':
    case 'CHARACTER VARYING':
    case 'TEXT':
    case 'CITEXT':
    case 'NAME':
    case 'UUID':
      return 'String';

    // Types date/heure
    case 'DATE':
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
    case 'TIMESTAMP WITH TIME ZONE':
    case 'TIMESTAMP WITHOUT TIME ZONE':
    case 'TIME':
    case 'TIMETZ':
    case 'TIME WITH TIME ZONE':
      return 'DateTime';

    // Types binaires
    case 'BYTEA':
      return 'Bytes';

    // Types JSON
    case 'JSON':
    case 'JSONB':
      return 'Json';

    default:
      // Par défaut on retourne String
      return 'String';
  }
}

/**
 * Formate un type PostgreSQL complet à partir des métadonnées de colonne
 * 
 * @param column - Métadonnées de la colonne
 * @returns Type PostgreSQL formaté
 */
export function formatPostgresType(column: {
  data_type: string;
  character_maximum_length?: number | null;
  numeric_precision?: number | null;
  numeric_scale?: number | null;
}): string {
  let type = column.data_type.toUpperCase();

  // Ajouter la taille pour les types qui le supportent
  if (
    column.character_maximum_length &&
    ['CHARACTER', 'CHARACTER VARYING', 'VARCHAR', 'CHAR'].includes(type)
  ) {
    type += `(${column.character_maximum_length})`;
  }

  // Ajouter la précision/échelle pour les types numériques
  if (
    column.numeric_precision &&
    column.numeric_scale !== null &&
    ['NUMERIC', 'DECIMAL'].includes(type)
  ) {
    type += `(${column.numeric_precision},${column.numeric_scale})`;
  }

  return type;
}

/**
 * Génère une définition de champ Prisma complète
 * 
 * @param fieldName - Nom du champ
 * @param prismaType - Type Prisma
 * @param isRequired - Si le champ est requis
 * @param isPrimary - Si le champ est une clé primaire
 * @param isAutoIncrement - Si le champ est auto-incrémenté
 * @param defaultValue - Valeur par défaut
 * @returns Définition complète du champ Prisma
 */
export function generatePrismaFieldDefinition(
  fieldName: string,
  prismaType: string,
  isRequired: boolean = true,
  isPrimary: boolean = false,
  isAutoIncrement: boolean = false,
  defaultValue?: string | null
): string {
  // Base field definition
  let definition = `${fieldName} ${prismaType}`;

  // Ajouter le modificateur de nullabilité
  if (!isRequired) {
    definition += '?';
  }

  // Ajouter les attributs Prisma
  const attributes = [];

  if (isPrimary) {
    attributes.push('@id');

    if (isAutoIncrement) {
      attributes.push('@default(autoincrement())');
    }
  }

  // Gérer les valeurs par défaut
  if (defaultValue !== undefined && defaultValue !== null && !isPrimary) {
    // Ajuster le format de la valeur par défaut selon le type
    if (prismaType === 'String') {
      attributes.push(`@default("${defaultValue}")`);
    } else if (prismaType === 'Boolean') {
      const boolValue = defaultValue.toLowerCase() === 'true' || defaultValue === '1';
      attributes.push(`@default(${boolValue})`);
    } else if (['Int', 'Float', 'BigInt', 'Decimal'].includes(prismaType)) {
      attributes.push(`@default(${defaultValue})`);
    } else if (prismaType === 'DateTime') {
      if (defaultValue.toLowerCase() === 'now()' || defaultValue.toLowerCase() === 'current_timestamp') {
        attributes.push('@default(now())');
      } else {
        attributes.push(`@default("${defaultValue}")`);
      }
    } else if (prismaType === 'Json') {
      attributes.push(`@default("${JSON.stringify(defaultValue)}")`);
    }
  }

  // Ajouter les attributs s'il y en a
  if (attributes.length > 0) {
    definition += ` ${attributes.join(' ')}`;
  }

  return definition;
}

/**
 * Vérifie si un type PostgreSQL est pris en charge par Prisma
 * 
 * @param pgType - Type PostgreSQL à vérifier
 * @returns Vrai si le type est pris en charge
 */
export function isPrismaSupportedType(pgType: string): boolean {
  const baseType = pgType.split('(')[0].trim().toUpperCase();
  return PRISMA_SUPPORTED_POSTGRES_TYPES.includes(baseType);
}