/**
 * Service pour suggérer des index sur les tables PostgreSQL
 */

import { TableInfo, ForeignKeyInfo, IndexInfo } from '../types';

/**
 * Suggérer des index pour améliorer les performances d'une table
 */
export function suggestIndexes(
  tableInfo: TableInfo,
  foreignKeys: ForeignKeyInfo[]
): IndexInfo[] {
  const suggestedIndexes: IndexInfo[] = [];
  const existingIndexes = tableInfo.indexes || [];
  
  // Fonction pour vérifier si un index existe déjà
  const indexExists = (columns: string[]): boolean => {
    return existingIndexes.some(idx => {
      // Vérifier si les colonnes sont les mêmes (sans tenir compte de l'ordre)
      const indexColumns = idx.columns.sort();
      const checkColumns = [...columns].sort();
      
      if (indexColumns.length !== checkColumns.length) {
        return false;
      }
      
      return indexColumns.every((col, i) => col === checkColumns[i]);
    });
  };
  
  // 1. Suggérer des index pour les clés étrangères qui n'en ont pas encore
  for (const fk of foreignKeys) {
    const fkColumns = fk.sourceColumns;
    
    // Vérifier si un index existe déjà pour cette clé étrangère
    if (!indexExists(fkColumns)) {
      suggestedIndexes.push({
        name: `idx_${tableInfo.name}_${fkColumns.join('_')}`,
        columns: fkColumns,
        isUnique: false,
        type: 'btree'
      });
    }
  }
  
  // 2. Suggérer des index pour les colonnes souvent utilisées dans les clauses WHERE
  // (basé sur des heuristiques communes)
  const commonWhereColumns = [
    'status',
    'type',
    'is_active',
    'is_deleted',
    'created_at',
    'updated_at',
    'published_at',
    'expired_at',
    'category_id',
    'user_id',
    'email',
    'username'
  ];
  
  for (const colName of commonWhereColumns) {
    if (tableInfo.columns[colName] && !indexExists([colName])) {
      // Vérifier si la colonne est déjà indexée via une clé primaire ou une contrainte unique
      const isAlreadyIndexed = tableInfo.columns[colName].isPrimary || tableInfo.columns[colName].isUnique;
      
      if (!isAlreadyIndexed) {
        suggestedIndexes.push({
          name: `idx_${tableInfo.name}_${colName}`,
          columns: [colName],
          isUnique: false,
          type: 'btree'
        });
      }
    }
  }
  
  // 3. Suggérer des index spéciaux pour certains types de données
  // 3.1. Index GIN pour les colonnes JSON
  for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
    if ((colInfo.type === 'json' || colInfo.type === 'jsonb') && !indexExists([colName])) {
      suggestedIndexes.push({
        name: `idx_gin_${tableInfo.name}_${colName}`,
        columns: [colName],
        isUnique: false,
        type: 'gin'
      });
    }
  }
  
  // 3.2. Index GiST pour les colonnes géométriques
  for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
    if (['point', 'line', 'polygon', 'circle'].includes(colInfo.type) && !indexExists([colName])) {
      suggestedIndexes.push({
        name: `idx_gist_${tableInfo.name}_${colName}`,
        columns: [colName],
        isUnique: false,
        type: 'gist'
      });
    }
  }
  
  // 3.3. Index texte pour les colonnes de texte longues
  for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
    if (colInfo.type === 'text' && !indexExists([colName])) {
      // Pour les recherches de texte, un index trigram peut être utile
      suggestedIndexes.push({
        name: `idx_trgm_${tableInfo.name}_${colName}`,
        columns: [colName],
        isUnique: false,
        type: 'gin'
      });
    }
  }
  
  // 4. Suggérer des index composites pour les combinaisons de colonnes couramment utilisées ensemble
  // 4.1. Si la table a created_at et type, suggérer un index composite
  if (tableInfo.columns['created_at'] && tableInfo.columns['type'] && !indexExists(['created_at', 'type'])) {
    suggestedIndexes.push({
      name: `idx_${tableInfo.name}_created_at_type`,
      columns: ['created_at', 'type'],
      isUnique: false,
      type: 'btree'
    });
  }
  
  // 4.2. Si la table a user_id et created_at, suggérer un index composite
  if (tableInfo.columns['user_id'] && tableInfo.columns['created_at'] && !indexExists(['user_id', 'created_at'])) {
    suggestedIndexes.push({
      name: `idx_${tableInfo.name}_user_id_created_at`,
      columns: ['user_id', 'created_at'],
      isUnique: false,
      type: 'btree'
    });
  }
  
  return suggestedIndexes;
}