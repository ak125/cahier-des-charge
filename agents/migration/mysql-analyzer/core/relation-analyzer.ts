/**
 * relation-analyzer.ts
 * 
 * Analyse les relations entre tables (explicites et implicites)
 */

import { MySQLSchema, TableInfo, RelationInfo, RelationType } from '../models/schema';

export class RelationAnalyzer {
  private analyzeJoins: boolean;

  constructor(analyzeJoins = false) {
    this.analyzeJoins = analyzeJoins;
  }

  /**
   * Analyse les relations dans le schéma
   */
  async analyze(schema: MySQLSchema, sqlContent: string): Promise<MySQLSchema> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const normalizedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Initialiser le tableau de relations pour chaque table
    Object.values(normalizedSchema.tables).forEach(table => {
      table.relations = [];
    });
    
    // Étape 1: Ajouter les relations explicites basées sur les clés étrangères
    this.addExplicitRelations(normalizedSchema);
    
    // Étape 2: Détecter les relations implicites (colonnes dont le nommage suggère une FK)
    this.detectImplicitForeignKeys(normalizedSchema);
    
    // Étape 3: Si activé, analyser le SQL pour détecter les JOINs
    if (this.analyzeJoins) {
      await this.analyzeJoinsInSql(normalizedSchema, sqlContent);
    }
    
    // Normaliser le schéma (convertir les relations one-to-many en relation bidirectionnelle)
    this.normalizeRelations(normalizedSchema);
    
    return normalizedSchema;
  }

  /**
   * Ajoute les relations explicites basées sur les clés étrangères
   */
  private addExplicitRelations(schema: MySQLSchema): void {
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      table.foreignKeys.forEach(fk => {
        // Vérifier que la table référencée existe
        if (!schema.tables[fk.referencedTable]) {
          console.warn(`Table référencée '${fk.referencedTable}' non trouvée dans le schéma`);
          return;
        }
        
        // Déterminer le type de relation
        let relationType = RelationType.MANY_TO_ONE;
        
        // Vérifier si la colonne source est unique ou PK
        const isSourceUnique = this.isColumnUnique(table, fk.columns[0]);
        
        if (isSourceUnique) {
          relationType = RelationType.ONE_TO_ONE;
        }
        
        // Ajouter la relation à la table source
        const relation: RelationInfo = {
          sourceTable: tableName,
          sourceColumn: fk.columns[0], // Simplification: on considère la première colonne
          targetTable: fk.referencedTable,
          targetColumn: fk.referencedColumns[0], // Simplification: on considère la première colonne
          type: relationType,
          name: fk.name
        };
        
        table.relations.push(relation);
      });
    });
  }

  /**
   * Détecte les clés étrangères implicites (colonnes nommées comme id_table, table_id, etc.)
   */
  private detectImplicitForeignKeys(schema: MySQLSchema): void {
    const tableNames = Object.keys(schema.tables);
    
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        // Ignorer les colonnes qui font déjà partie de clés étrangères explicites
        const isExplicitFK = table.foreignKeys.some(fk => 
          fk.columns.includes(columnName)
        );
        
        if (isExplicitFK) return;
        
        // Rechercher les colonnes qui suivent les patterns de nommage de FK
        let matchedTable: string | null = null;
        let targetColumn = 'id'; // Par défaut, on suppose que la colonne cible est 'id'
        
        // Pattern: id_table
        const idPrefixMatch = columnName.match(/^id_(\w+)$/i);
        if (idPrefixMatch) {
          const candidateTable = idPrefixMatch[1];
          matchedTable = this.findMatchingTable(candidateTable, tableNames);
        }
        
        // Pattern: table_id
        if (!matchedTable) {
          const idSuffixMatch = columnName.match(/^(\w+)_id$/i);
          if (idSuffixMatch) {
            const candidateTable = idSuffixMatch[1];
            matchedTable = this.findMatchingTable(candidateTable, tableNames);
          }
        }
        
        // Si on a trouvé une table correspondante
        if (matchedTable) {
          const targetTable = schema.tables[matchedTable];
          
          // Vérifier que la colonne cible existe
          if (!targetTable.columns[targetColumn]) {
            // Chercher une colonne qui ressemble à un ID
            const idColumn = Object.keys(targetTable.columns).find(col => 
              col === 'id' || col.endsWith('_id') || col === targetTable.name + '_id'
            );
            
            if (idColumn) {
              targetColumn = idColumn;
            } else {
              // Si aucune colonne ID n'est trouvée, ignorer cette relation
              return;
            }
          }
          
          // Déterminer le type de relation
          const relationType = this.isColumnUnique(table, columnName) 
            ? RelationType.ONE_TO_ONE 
            : RelationType.MANY_TO_ONE;
          
          // Ajouter la relation à la table source
          const relation: RelationInfo = {
            sourceTable: tableName,
            sourceColumn: columnName,
            targetTable: matchedTable,
            targetColumn: targetColumn,
            type: relationType,
            isImplicit: true
          };
          
          // Marquer la colonne comme FK implicite
          column.isImplicitForeignKey = true;
          column.references = {
            table: matchedTable,
            column: targetColumn
          };
          
          table.relations.push(relation);
        }
      });
    });
  }

  /**
   * Analyse les requêtes JOIN dans le SQL pour détecter des relations implicites
   */
  private async analyzeJoinsInSql(schema: MySQLSchema, sqlContent: string): Promise<void> {
    // Extraire les requêtes JOIN
    const joinRegex = /\bFROM\s+[`"]?(\w+)[`"]?(?:\s+(?:AS\s+)?[`"]?(\w+)[`"]?)?\s+(?:INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+[`"]?(\w+)[`"]?(?:\s+(?:AS\s+)?[`"]?(\w+)[`"]?)?\s+ON\s+([^;]+?)(?:WHERE|GROUP|ORDER|LIMIT|HAVING|;|\))/gims;
    
    let match;
    while ((match = joinRegex.exec(sqlContent)) !== null) {
      const sourceTable = match[1];
      const sourceAlias = match[2] || sourceTable;
      const targetTable = match[3];
      const targetAlias = match[4] || targetTable;
      const joinCondition = match[5];
      
      // Analyser la condition de jointure
      this.analyzeJoinCondition(schema, sourceTable, sourceAlias, targetTable, targetAlias, joinCondition);
    }
  }

  /**
   * Analyse une condition de jointure pour extraire les colonnes de jointure
   */
  private analyzeJoinCondition(
    schema: MySQLSchema, 
    sourceTable: string, 
    sourceAlias: string, 
    targetTable: string, 
    targetAlias: string, 
    joinCondition: string
  ): void {
    // Vérifier que les tables existent dans le schéma
    if (!schema.tables[sourceTable] || !schema.tables[targetTable]) {
      return;
    }
    
    // Pattern pour les conditions de jointure: alias.colonne = alias.colonne
    const conditionRegex = new RegExp(`(${sourceAlias}|${targetAlias})[.][`"']?(\\w+)[`"']?\\s*=\\s*(${sourceAlias}|${targetAlias})[.][`"']?(\\w+)[`"']?`, 'gi');
    
    let condMatch;
    while ((condMatch = conditionRegex.exec(joinCondition)) !== null) {
      const leftAlias = condMatch[1];
      const leftColumn = condMatch[2];
      const rightAlias = condMatch[3];
      const rightColumn = condMatch[4];
      
      // Déterminer quelle table est la source et quelle table est la cible
      let srcTable, srcColumn, tgtTable, tgtColumn;
      
      if (leftAlias === sourceAlias) {
        srcTable = sourceTable;
        srcColumn = leftColumn;
        tgtTable = targetTable;
        tgtColumn = rightColumn;
      } else {
        srcTable = targetTable;
        srcColumn = leftColumn;
        tgtTable = sourceTable;
        tgtColumn = rightColumn;
      }
      
      // Vérifier que les colonnes existent
      if (!schema.tables[srcTable].columns[srcColumn] || !schema.tables[tgtTable].columns[tgtColumn]) {
        continue;
      }
      
      // Vérifier si cette relation existe déjà (explicite ou implicite)
      const existingRelation = schema.tables[srcTable].relations?.some(rel => 
        rel.sourceColumn === srcColumn && rel.targetTable === tgtTable && rel.targetColumn === tgtColumn
      );
      
      if (!existingRelation) {
        // Déterminer le type de relation (simplifié)
        const relationType = this.isColumnUnique(schema.tables[srcTable], srcColumn) 
          ? RelationType.ONE_TO_ONE 
          : RelationType.MANY_TO_ONE;
        
        // Ajouter la relation à la table source
        const relation: RelationInfo = {
          sourceTable: srcTable,
          sourceColumn: srcColumn,
          targetTable: tgtTable,
          targetColumn: tgtColumn,
          type: relationType,
          isImplicit: true
        };
        
        if (!schema.tables[srcTable].relations) {
          schema.tables[srcTable].relations = [];
        }
        
        schema.tables[srcTable].relations.push(relation);
        
        // Marquer la colonne comme FK implicite
        schema.tables[srcTable].columns[srcColumn].isImplicitForeignKey = true;
        schema.tables[srcTable].columns[srcColumn].references = {
          table: tgtTable,
          column: tgtColumn
        };
      }
    }
  }

  /**
   * Normalise les relations (ajoute les relations inverses pour obtenir un graphe bidirectionnel)
   */
  private normalizeRelations(schema: MySQLSchema): void {
    // Pour chaque table et chaque relation
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      if (!table.relations) return;
      
      table.relations.forEach(relation => {
        // Ignorer les relations déjà bidirectionnelles
        if (relation.type === RelationType.ONE_TO_ONE) return;
        
        // Déterminer le type de la relation inverse
        let inverseType: RelationType;
        if (relation.type === RelationType.ONE_TO_MANY) {
          inverseType = RelationType.MANY_TO_ONE;
        } else if (relation.type === RelationType.MANY_TO_ONE) {
          inverseType = RelationType.ONE_TO_MANY;
        } else {
          return;
        }
        
        // Vérifier que la table cible existe
        const targetTable = schema.tables[relation.targetTable];
        if (!targetTable) return;
        
        // Initialiser le tableau de relations si nécessaire
        if (!targetTable.relations) {
          targetTable.relations = [];
        }
        
        // Vérifier si la relation inverse existe déjà
        const inverseExists = targetTable.relations.some(rel => 
          rel.sourceTable === relation.targetTable && 
          rel.sourceColumn === relation.targetColumn && 
          rel.targetTable === relation.sourceTable && 
          rel.targetColumn === relation.sourceColumn &&
          rel.type === inverseType
        );
        
        // Si la relation inverse n'existe pas, l'ajouter
        if (!inverseExists) {
          const inverseRelation: RelationInfo = {
            sourceTable: relation.targetTable,
            sourceColumn: relation.targetColumn,
            targetTable: relation.sourceTable,
            targetColumn: relation.sourceColumn,
            type: inverseType,
            isImplicit: relation.isImplicit
          };
          
          targetTable.relations.push(inverseRelation);
        }
      });
    });
  }

  /**
   * Vérifie si une colonne est unique (PK ou avec un index unique)
   */
  private isColumnUnique(table: TableInfo, columnName: string): boolean {
    // Vérifier si c'est une PK
    if (typeof table.primaryKey === 'string' && table.primaryKey === columnName) {
      return true;
    }
    
    if (Array.isArray(table.primaryKey) && table.primaryKey.includes(columnName)) {
      // Si la PK est composée de plusieurs colonnes, on considère que ce n'est pas unique
      // pour une relation one-to-one, sauf si c'est la seule colonne
      return table.primaryKey.length === 1;
    }
    
    // Vérifier les index uniques
    return table.indexes.some(index => 
      index.unique && index.columns.length === 1 && index.columns[0] === columnName
    );
  }

  /**
   * Trouve une table qui correspond au nom candidat (singulier/pluriel, etc.)
   */
  private findMatchingTable(candidateTable: string, tableNames: string[]): string | null {
    // Vérifier correspondance exacte
    if (tableNames.includes(candidateTable)) {
      return candidateTable;
    }
    
    // Vérifier pluriel (ajouter un 's')
    if (tableNames.includes(candidateTable + 's')) {
      return candidateTable + 's';
    }
    
    // Vérifier singulier (supprimer le 's' final)
    if (candidateTable.endsWith('s') && tableNames.includes(candidateTable.slice(0, -1))) {
      return candidateTable.slice(0, -1);
    }
    
    // Recherche insensible à la casse
    const lowerCandidate = candidateTable.toLowerCase();
    const match = tableNames.find(name => name.toLowerCase() === lowerCandidate);
    if (match) return match;
    
    // Pluriel insensible à la casse
    const pluralMatch = tableNames.find(name => name.toLowerCase() === lowerCandidate + 's');
    if (pluralMatch) return pluralMatch;
    
    // Singulier insensible à la casse
    if (lowerCandidate.endsWith('s')) {
      const singularMatch = tableNames.find(name => 
        name.toLowerCase() === lowerCandidate.slice(0, -1)
      );
      if (singularMatch) return singularMatch;
    }
    
    return null;
  }
}