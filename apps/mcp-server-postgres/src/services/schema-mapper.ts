/**
 * Service pour créer une carte du schéma PostgreSQL
 */

import { SchemaMap, TableInfo, ForeignKeyInfo, RelationInfo } from '../types';

/**
 * Créer une carte du schéma à partir des informations sur les tables et les clés étrangères
 */
export function createSchemaMap(
  tables: Record<string, TableInfo>,
  foreignKeys: ForeignKeyInfo[]
): SchemaMap {
  // Créer la structure de base de la carte du schéma
  const schemaMap: SchemaMap = {
    name: 'PostgreSQL Schema',
    version: new Date().toISOString(),
    tables: {},
    foreignKeys: foreignKeys
  };
  
  // Copier les informations de tables
  Object.keys(tables).forEach(tableName => {
    schemaMap.tables[tableName] = {
      ...tables[tableName]
    };
  });
  
  // Détecter et ajouter les relations
  const relations = detectRelations(foreignKeys);
  
  // Ajouter les relations aux tables correspondantes
  relations.forEach(relation => {
    const { sourceTable, targetTable } = relation;
    
    // Ajouter la relation à la table source
    if (schemaMap.tables[sourceTable]) {
      if (!schemaMap.tables[sourceTable].relations) {
        schemaMap.tables[sourceTable].relations = [];
      }
      schemaMap.tables[sourceTable].relations!.push(relation);
    }
    
    // Ajouter la relation inverse à la table cible (sauf pour les relations n:m qui ont déjà deux entrées)
    if (relation.type !== 'n:m' && schemaMap.tables[targetTable]) {
      if (!schemaMap.tables[targetTable].relations) {
        schemaMap.tables[targetTable].relations = [];
      }
      
      // Créer la relation inverse
      const inverseRelation: RelationInfo = {
        ...relation,
        type: invertRelationType(relation.type),
        sourceTable: relation.targetTable,
        sourceColumns: relation.targetColumns,
        targetTable: relation.sourceTable,
        targetColumns: relation.sourceColumns
      };
      
      schemaMap.tables[targetTable].relations!.push(inverseRelation);
    }
  });
  
  return schemaMap;
}

/**
 * Détecter les relations à partir des clés étrangères
 */
function detectRelations(foreignKeys: ForeignKeyInfo[]): RelationInfo[] {
  const relations: RelationInfo[] = [];
  
  // Analyser chaque clé étrangère pour déterminer le type de relation
  foreignKeys.forEach(fk => {
    // Par défaut, on considère une relation n:1 (plusieurs lignes de la table source peuvent référencer une ligne de la table cible)
    let relationType: '1:1' | '1:n' | 'n:1' | 'n:m' = 'n:1';
    
    // Si la colonne source est une clé primaire ou une contrainte unique, c'est une relation 1:1 ou 1:n
    const isSourceUnique = fk.sourceColumns.length === 1; // Simplification, à affiner avec les informations réelles de contraintes
    
    if (isSourceUnique) {
      relationType = '1:1'; // On suppose 1:1 par défaut si la source est unique
    }
    
    // Créer la relation
    const relation: RelationInfo = {
      type: relationType,
      sourceTable: fk.sourceTable,
      sourceColumns: fk.sourceColumns,
      targetTable: fk.targetTable,
      targetColumns: fk.targetColumns,
      name: `${fk.sourceTable}_${fk.targetTable}`
    };
    
    relations.push(relation);
  });
  
  // Détecter les relations n:m (tables de jointure)
  // Une table de jointure a typiquement seulement des clés étrangères et peu ou pas d'autres colonnes
  const potentialJoinTables = findPotentialJoinTables(foreignKeys);
  
  potentialJoinTables.forEach(joinTable => {
    const joinTableFKs = foreignKeys.filter(fk => fk.sourceTable === joinTable);
    
    if (joinTableFKs.length >= 2) {
      // Prendre les deux premières FKs pour créer une relation n:m
      const fk1 = joinTableFKs[0];
      const fk2 = joinTableFKs[1];
      
      const relation: RelationInfo = {
        type: 'n:m',
        sourceTable: fk1.targetTable,
        sourceColumns: fk1.targetColumns,
        targetTable: fk2.targetTable,
        targetColumns: fk2.targetColumns,
        joinTable: joinTable,
        name: `${fk1.targetTable}_${fk2.targetTable}`
      };
      
      relations.push(relation);
    }
  });
  
  return relations;
}

/**
 * Trouver les tables potentielles de jointure
 */
function findPotentialJoinTables(foreignKeys: ForeignKeyInfo[]): string[] {
  // Compter le nombre de clés étrangères sortantes par table
  const fkCountByTable: Record<string, number> = {};
  
  foreignKeys.forEach(fk => {
    if (!fkCountByTable[fk.sourceTable]) {
      fkCountByTable[fk.sourceTable] = 0;
    }
    fkCountByTable[fk.sourceTable]++;
  });
  
  // Retourner les tables qui ont au moins 2 clés étrangères sortantes
  return Object.entries(fkCountByTable)
    .filter(([_, count]) => count >= 2)
    .map(([tableName, _]) => tableName);
}

/**
 * Inverser le type de relation
 */
function invertRelationType(type: '1:1' | '1:n' | 'n:1' | 'n:m'): '1:1' | '1:n' | 'n:1' | 'n:m' {
  switch (type) {
    case '1:1':
      return '1:1'; // La relation 1:1 reste 1:1 dans les deux sens
    case '1:n':
      return 'n:1'; // La relation 1:n devient n:1 dans l'autre sens
    case 'n:1':
      return '1:n'; // La relation n:1 devient 1:n dans l'autre sens
    case 'n:m':
      return 'n:m'; // La relation n:m reste n:m dans les deux sens
    default:
      return 'n:1'; // Par défaut, on considère n:1
  }
}