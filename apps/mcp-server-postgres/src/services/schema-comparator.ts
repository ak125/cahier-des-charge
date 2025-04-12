/**
 * Service pour comparer deux schémas de base de données
 */

import { SchemaMap, SchemaDiff, SchemaDiffChange } from '../types';

/**
 * Comparer deux schémas et générer un rapport de différences
 * @param sourceSchema Schéma source (généralement MySQL)
 * @param targetSchema Schéma cible (généralement PostgreSQL)
 */
export function compareSchemas(
  sourceSchema: SchemaMap,
  targetSchema: SchemaMap
): SchemaDiff {
  const changes: SchemaDiffChange[] = [];
  
  // Statistiques
  const stats = {
    total: 0,
    tables: {
      added: 0,
      removed: 0,
      modified: 0
    },
    columns: {
      added: 0,
      removed: 0,
      typeChanged: 0,
      constraintChanged: 0
    },
    indexes: {
      added: 0,
      removed: 0
    },
    foreignKeys: {
      added: 0,
      removed: 0
    }
  };
  
  // Comparer les tables
  const sourceTables = Object.keys(sourceSchema.tables);
  const targetTables = Object.keys(targetSchema.tables);
  
  // Tables supprimées (présentes dans source mais pas dans target)
  const removedTables = sourceTables.filter(table => !targetTables.includes(table));
  for (const table of removedTables) {
    changes.push({
      type: 'table_removed',
      tableName: table,
      impact: 'high',
      description: `La table '${table}' a été supprimée`
    });
    stats.tables.removed++;
    stats.total++;
  }
  
  // Tables ajoutées (présentes dans target mais pas dans source)
  const addedTables = targetTables.filter(table => !sourceTables.includes(table));
  for (const table of addedTables) {
    changes.push({
      type: 'table_added',
      tableName: table,
      impact: 'medium',
      description: `La table '${table}' a été ajoutée`
    });
    stats.tables.added++;
    stats.total++;
  }
  
  // Tables modifiées (présentes dans les deux mais avec des différences)
  const commonTables = sourceTables.filter(table => targetTables.includes(table));
  for (const table of commonTables) {
    let tableModified = false;
    const sourceTable = sourceSchema.tables[table];
    const targetTable = targetSchema.tables[table];
    
    // Comparer les colonnes
    const sourceColumns = Object.keys(sourceTable.columns);
    const targetColumns = Object.keys(targetTable.columns);
    
    // Colonnes supprimées
    const removedColumns = sourceColumns.filter(col => !targetColumns.includes(col));
    for (const col of removedColumns) {
      changes.push({
        type: 'column_removed',
        tableName: table,
        columnName: col,
        impact: 'high',
        description: `La colonne '${col}' a été supprimée de la table '${table}'`
      });
      stats.columns.removed++;
      stats.total++;
      tableModified = true;
    }
    
    // Colonnes ajoutées
    const addedColumns = targetColumns.filter(col => !sourceColumns.includes(col));
    for (const col of addedColumns) {
      changes.push({
        type: 'column_added',
        tableName: table,
        columnName: col,
        impact: 'medium',
        newValue: targetTable.columns[col],
        description: `La colonne '${col}' a été ajoutée à la table '${table}'`
      });
      stats.columns.added++;
      stats.total++;
      tableModified = true;
    }
    
    // Colonnes modifiées
    const commonColumns = sourceColumns.filter(col => targetColumns.includes(col));
    for (const col of commonColumns) {
      const sourceCol = sourceTable.columns[col];
      const targetCol = targetTable.columns[col];
      
      // Vérifier les changements de type
      if (sourceCol.type !== targetCol.type) {
        changes.push({
          type: 'column_type_changed',
          tableName: table,
          columnName: col,
          oldValue: sourceCol.type,
          newValue: targetCol.type,
          impact: 'high',
          description: `Le type de la colonne '${col}' dans la table '${table}' a changé de '${sourceCol.type}' à '${targetCol.type}'`
        });
        stats.columns.typeChanged++;
        stats.total++;
        tableModified = true;
      }
      
      // Vérifier les changements de contraintes (nullable, unique, etc.)
      if (sourceCol.nullable !== targetCol.nullable ||
          sourceCol.isPrimary !== targetCol.isPrimary ||
          sourceCol.isUnique !== targetCol.isUnique) {
        changes.push({
          type: 'column_constraint_changed',
          tableName: table,
          columnName: col,
          oldValue: {
            nullable: sourceCol.nullable,
            isPrimary: sourceCol.isPrimary,
            isUnique: sourceCol.isUnique
          },
          newValue: {
            nullable: targetCol.nullable,
            isPrimary: targetCol.isPrimary,
            isUnique: targetCol.isUnique
          },
          impact: 'medium',
          description: `Les contraintes de la colonne '${col}' dans la table '${table}' ont changé`
        });
        stats.columns.constraintChanged++;
        stats.total++;
        tableModified = true;
      }
    }
    
    // Comparer les index si disponibles
    if (sourceTable.indexes && targetTable.indexes) {
      const sourceIndexes = sourceTable.indexes.map(idx => idx.name);
      const targetIndexes = targetTable.indexes.map(idx => idx.name);
      
      // Index supprimés
      const removedIndexes = sourceIndexes.filter(idx => !targetIndexes.includes(idx));
      for (const idx of removedIndexes) {
        const sourceIdx = sourceTable.indexes.find(i => i.name === idx);
        changes.push({
          type: 'index_removed',
          tableName: table,
          indexName: idx,
          oldValue: sourceIdx,
          impact: 'low',
          description: `L'index '${idx}' a été supprimé de la table '${table}'`
        });
        stats.indexes.removed++;
        stats.total++;
        tableModified = true;
      }
      
      // Index ajoutés
      const addedIndexes = targetIndexes.filter(idx => !sourceIndexes.includes(idx));
      for (const idx of addedIndexes) {
        const targetIdx = targetTable.indexes.find(i => i.name === idx);
        changes.push({
          type: 'index_added',
          tableName: table,
          indexName: idx,
          newValue: targetIdx,
          impact: 'low',
          description: `L'index '${idx}' a été ajouté à la table '${table}'`
        });
        stats.indexes.added++;
        stats.total++;
        tableModified = true;
      }
    }
    
    if (tableModified) {
      stats.tables.modified++;
    }
  }
  
  // Comparer les clés étrangères si disponibles
  if (sourceSchema.foreignKeys && targetSchema.foreignKeys) {
    const sourceFKs = sourceSchema.foreignKeys.map(fk => fk.name);
    const targetFKs = targetSchema.foreignKeys.map(fk => fk.name);
    
    // Clés étrangères supprimées
    const removedFKs = sourceFKs.filter(fk => !targetFKs.includes(fk));
    for (const fk of removedFKs) {
      const sourceFk = sourceSchema.foreignKeys.find(f => f.name === fk);
      changes.push({
        type: 'foreign_key_removed',
        tableName: sourceFk ? sourceFk.sourceTable : '',
        foreignKeyName: fk,
        oldValue: sourceFk,
        impact: 'medium',
        description: `La clé étrangère '${fk}' a été supprimée`
      });
      stats.foreignKeys.removed++;
      stats.total++;
    }
    
    // Clés étrangères ajoutées
    const addedFKs = targetFKs.filter(fk => !sourceFKs.includes(fk));
    for (const fk of addedFKs) {
      const targetFk = targetSchema.foreignKeys.find(f => f.name === fk);
      changes.push({
        type: 'foreign_key_added',
        tableName: targetFk ? targetFk.sourceTable : '',
        foreignKeyName: fk,
        newValue: targetFk,
        impact: 'medium',
        description: `La clé étrangère '${fk}' a été ajoutée`
      });
      stats.foreignKeys.added++;
      stats.total++;
    }
  }
  
  // Trier les changements par impact (high, medium, low)
  changes.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
  
  return {
    timestamp: new Date().toISOString(),
    sourceName: sourceSchema.name || 'MySQL Schema',
    targetName: targetSchema.name || 'PostgreSQL Schema',
    changes,
    statistics: stats
  };
}