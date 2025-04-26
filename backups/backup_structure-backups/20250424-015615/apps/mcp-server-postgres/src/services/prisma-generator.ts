/**
 * Service pour générer des modèles Prisma à partir de tables PostgreSQL
 */

import { TableInfo, ForeignKeyInfo, PrismaModel, PrismaField } from ../typesstructure-agent';

// Mapping des types PostgreSQL vers Prisma
const typeMapping: Record<string, string> = {
  // Types numériques
  'smallint': 'Int',
  'integer': 'Int',
  'bigint': 'BigInt',
  'decimal': 'Decimal',
  'numeric': 'Decimal',
  'real': 'Float',
  'double precision': 'Float',
  'serial': 'Int',
  'bigserial': 'BigInt',
  
  // Types caractère
  'character': 'String',
  'character varying': 'String',
  'varchar': 'String',
  'text': 'String',
  'char': 'String',
  
  // Types binaires
  'bytea': 'Bytes',
  
  // Types date/heure
  'timestamp': 'DateTime',
  'timestamp with time zone': 'DateTime',
  'timestamp without time zone': 'DateTime',
  'date': 'DateTime',
  'time': 'String',
  'time with time zone': 'String',
  'time without time zone': 'String',
  'interval': 'String',
  
  // Types booléens
  'boolean': 'Boolean',
  
  // Types spéciaux
  'uuid': 'String',
  'json': 'Json',
  'jsonb': 'Json',
  'xml': 'String',
  'money': 'Decimal',
  'inet': 'String',
  'cidr': 'String',
  'macaddr': 'String',
  'bit': 'String',
  'bit varying': 'String',
  'tsvector': 'String',
  'tsquery': 'String',
  'point': 'String',
  'line': 'String',
  'lseg': 'String',
  'box': 'String',
  'path': 'String',
  'polygon': 'String',
  'circle': 'String'
};

/**
 * Générer un modèle Prisma à partir d'une table PostgreSQL
 */
export function generatePrismaModel(
  tableInfo: TableInfo,
  foreignKeys: ForeignKeyInfo[]
): PrismaModel {
  // Convertir le nom de la table en un nom de modèle Prisma (PascalCase)
  const modelName = toPascalCase(tableInfo.name);
  
  // Préparer les champs du modèle
  const fields: PrismaField[] = [];
  
  // Ajouter tous les champs de la table
  for (const [columnName, column] of Object.entries(tableInfo.columns)) {
    const field: PrismaField = {
      name: toCamelCase(columnName),
      type: mapPostgresToPrismaType(column.type),
      required: !column.nullable,
      map: columnName
    };
    
    // Ajouter les attributs spéciaux
    if (column.isPrimary) {
      field.id = true;
    }
    
    if (column.isUnique) {
      field.unique = true;
    }
    
    // Traiter la valeur par défaut
    if (column.defaultValue !== undefined && column.defaultValue !== null) {
      field.default = formatDefaultValue(column.defaultValue, field.type);
    }
    
    fields.push(field);
  }
  
  // Ajouter les relations
  addRelations(tableInfo, foreignKeys, fields);
  
  // Générer le schéma Prisma
  const schema = generatePrismaSchema(modelName, tableInfo.name, fields);
  
  return {
    name: modelName,
    tableName: tableInfo.name,
    fields,
    schema
  };
}

/**
 * Ajouter les relations Prisma
 */
function addRelations(
  tableInfo: TableInfo,
  foreignKeys: ForeignKeyInfo[],
  fields: PrismaField[]
): void {
  // Relations où cette table est la source (références vers d'autres tables)
  for (const fk of foreignKeys.filter(fk => fk.sourceTable === tableInfo.name)) {
    // Vérifier si la colonne source existe déjà dans les champs
    const sourceColumnName = fk.sourceColumns[0]; // On prend la première colonne pour les relations simples
    const existingField = fields.find(field => field.map === sourceColumnName);
    const targetModel = toPascalCase(fk.targetTable);
    
    if (existingField) {
      // Modifier le champ existant pour ajouter la relation
      existingField.type = targetModel;
      existingField.relation = {
        fields: [existingField.name],
        references: [toCamelCase(fk.targetColumns[0])]
      };
    }
    
    // Ajouter le champ de relation
    const relationField: PrismaField = {
      name: toCamelCase(fk.targetTable),
      type: targetModel,
      relation: {
        fields: fk.sourceColumns.map(c => toCamelCase(c)),
        references: fk.targetColumns.map(c => toCamelCase(c))
      }
    };
    
    fields.push(relationField);
  }
  
  // Relations où cette table est la cible (références depuis d'autres tables)
  for (const fk of foreignKeys.filter(fk => fk.targetTable === tableInfo.name)) {
    const sourceModel = toPascalCase(fk.sourceTable);
    const isOneToMany = true; // Supposer une relation 1:n par défaut
    
    // Ajouter le champ de relation inverse
    const relationField: PrismaField = {
      name: isOneToMany ? 
        toCamelCase(pluralize(fk.sourceTable)) : 
        toCamelCase(fk.sourceTable),
      type: sourceModel,
      list: isOneToMany
    };
    
    fields.push(relationField);
  }
}

/**
 * Générer le schéma Prisma pour un modèle
 */
function generatePrismaSchema(
  modelName: string,
  tableName: string,
  fields: PrismaField[]
): string {
  let schema = `model ${modelName} {\n`;
  
  // Ajouter les champs
  for (const field of fields) {
    // Commencer par le nom et le type
    let fieldSchema = `  ${field.name} ${field.type}`;
    
    // Ajouter le marqueur de liste si nécessaire
    if (field.list) {
      fieldSchema += '[]';
    }
    
    // Ajouter les attributs
    const attributes: string[] = [];
    
    if (field.id) {
      attributes.push('@id');
    }
    
    if (field.unique) {
      attributes.push('@unique');
    }
    
    if (field.default !== undefined) {
      attributes.push(`@default(${field.default})`);
    }
    
    // Ajouter l'attribut map si le nom du champ est différent du nom de la colonne
    if (field.map && field.map !== field.name) {
      attributes.push(`@map("${field.map}")`);
    }
    
    // Ajouter les attributs de relation
    if (field.relation) {
      attributes.push(`@relation(fields: [${field.relation.fields.join(', ')}], references: [${field.relation.references.join(', ')}])`);
    }
    
    // Ajouter les attributs à la ligne
    if (attributes.length > 0) {
      fieldSchema += ' ' + attributes.join(' ');
    }
    
    // Ajouter la ligne du champ au schéma
    schema += `${fieldSchema}\n`;
  }
  
  // Ajouter l'attribut de mappage de table si nécessaire
  if (tableName !== camelToSnakeCase(modelName)) {
    schema += `\n  @@map("${tableName}")\n`;
  }
  
  // Fermer le modèle
  schema += '}';
  
  return schema;
}

/**
 * Convertir un nom en PascalCase
 */
function toPascalCase(name: string): string {
  // Gérer les noms qui contiennent des underscores
  if (name.includes('_')) {
    return name
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  // Gérer les noms simples
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Convertir un nom en camelCase
 */
function toCamelCase(name: string): string {
  // Gérer les noms qui contiennent des underscores
  if (name.includes('_')) {
    const parts = name.split('_');
    return parts[0] + parts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
  
  // Gérer les noms simples
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Convertir camelCase en snake_case
 */
function camelToSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convertir un type PostgreSQL en type Prisma
 */
function mapPostgresToPrismaType(postgresType: string): string {
  // Normaliser le type PostgreSQL (enlever les parenthèses, etc.)
  const normalizedType = postgresType.toLowerCase().split('(')[0].trim();
  
  // Utiliser le mapping ou revenir à String par défaut
  return typeMapping[normalizedType] || 'String';
}

/**
 * Formater une valeur par défaut pour Prisma
 */
function formatDefaultValue(defaultValue: string, prismaType: string): string {
  // Traiter les séquences (autoincrement)
  if (defaultValue.includes('nextval')) {
    return 'autoincrement()';
  }
  
  // Traiter les valeurs booléennes
  if (defaultValue === 'true' || defaultValue === 'false') {
    return defaultValue;
  }
  
  // Traiter les valeurs numériques
  if (!isNaN(Number(defaultValue))) {
    return defaultValue;
  }
  
  // Traiter les fonctions comme NOW()
  if (defaultValue.toLowerCase().includes('now()')) {
    return 'now()';
  }
  
  // Traiter uuid_generate_v4()
  if (defaultValue.includes('uuid_generate_v4()')) {
    return 'uuid()';
  }
  
  // Traiter les chaînes de caractères (enlever les guillemets simples qui entourent la valeur)
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
    const valueWithoutQuotes = defaultValue.slice(1, -1);
    return `"${valueWithoutQuotes}"`;
  }
  
  // Pour les autres types, retourner la valeur telle quelle
  return defaultValue;
}

/**
 * Convertir un nom au pluriel (simpliste)
 */
function pluralize(word: string): string {
  // Règles de pluralisation simplifiées
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  
  return word + 's';
}