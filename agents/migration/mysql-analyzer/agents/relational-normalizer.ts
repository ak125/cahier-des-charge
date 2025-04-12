/**
 * relational-normalizer.ts
 * 
 * Agent spécialisé dans l'analyse des relations et la normalisation
 * - Détecte les clés étrangères implicites
 * - Vérifie le respect de la 3NF
 * - Identifie les redondances entre tables
 */

import * as fs from 'fs';
import * as path from 'path';
import { MySQLSchema, TableInfo, ColumnInfo, RelationIssue, NormalizationSuggestion } from '../models/schema';

interface RelationalNormalizerOptions {
  analyzePhp: boolean;
  phpFiles: string[];
}

export class RelationalNormalizer {
  private options: RelationalNormalizerOptions;
  
  constructor(options: RelationalNormalizerOptions) {
    this.options = options;
  }
  
  /**
   * Analyse le schéma pour détecter les problèmes de relations et normalisation
   */
  async analyze(schema: MySQLSchema, sqlContent: string): Promise<{
    schema: MySQLSchema;
    relationIssues: RelationIssue[];
    normalizationSuggestions: NormalizationSuggestion[];
  }> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const normalizedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Initialiser les tableaux de résultats
    const relationIssues: RelationIssue[] = [];
    const normalizationSuggestions: NormalizationSuggestion[] = [];
    
    // 1. Détecter les clés étrangères implicites
    await this.detectImplicitForeignKeys(normalizedSchema, relationIssues);
    
    // 2. Analyser les JOINs dans le code PHP si demandé
    if (this.options.analyzePhp) {
      await this.analyzePhpJoins(normalizedSchema, relationIssues);
    }
    
    // 3. Analyser les violations de 3NF
    this.detect3NFViolations(normalizedSchema, normalizationSuggestions);
    
    // 4. Détecter les tables redondantes
    this.detectRedundantTables(normalizedSchema, normalizationSuggestions);
    
    return { schema: normalizedSchema, relationIssues, normalizationSuggestions };
  }
  
  /**
   * Détecte les clés étrangères implicites basées sur les conventions de nommage
   */
  private async detectImplicitForeignKeys(
    schema: MySQLSchema, 
    issues: RelationIssue[]
  ): Promise<void> {
    // Pour chaque table du schéma
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      // Pour chaque colonne de la table
      Object.entries(table.columns).forEach(([columnName, column]) => {
        // Si la colonne n'est pas déjà une clé étrangère explicite
        if (!this.isExplicitForeignKey(table, columnName)) {
          // Vérifier si c'est potentiellement une clé étrangère implicite
          const potentialFk = this.detectPotentialForeignKey(schema, tableName, columnName, column);
          
          if (potentialFk) {
            // Ajouter une relation implicite
            if (!table.relations) {
              table.relations = [];
            }
            
            table.relations.push({
              sourceTable: tableName,
              sourceColumn: columnName,
              targetTable: potentialFk.tableName,
              targetColumn: potentialFk.columnName,
              type: 'MANY_TO_ONE', // Type par défaut
              isImplicit: true
            });
            
            // Marquer la colonne comme FK implicite
            column.isImplicitForeignKey = true;
            column.references = {
              table: potentialFk.tableName,
              column: potentialFk.columnName
            };
            
            // Ajouter un problème détecté
            issues.push({
              type: 'IMPLICIT_FOREIGN_KEY',
              sourceTable: tableName,
              sourceColumn: columnName,
              targetTable: potentialFk.tableName,
              targetColumn: potentialFk.columnName,
              severity: 'medium',
              description: `Clé étrangère implicite détectée: ${tableName}.${columnName} → ${potentialFk.tableName}.${potentialFk.columnName}`,
              recommendation: `Ajouter une contrainte FOREIGN KEY explicite sur ${tableName}.${columnName} référençant ${potentialFk.tableName}.${potentialFk.columnName}`
            });
          }
        }
      });
    });
  }
  
  /**
   * Vérifie si une colonne est déjà une clé étrangère explicite
   */
  private isExplicitForeignKey(table: TableInfo, columnName: string): boolean {
    return table.foreignKeys.some(fk => fk.columns.includes(columnName));
  }
  
  /**
   * Détecte une clé étrangère potentielle basée sur les conventions de nommage
   */
  private detectPotentialForeignKey(
    schema: MySQLSchema, 
    tableName: string, 
    columnName: string, 
    column: ColumnInfo
  ): { tableName: string; columnName: string } | null {
    // Ignorer les colonnes qui ne semblent pas être des FK
    if (!this.isPotentialForeignKeyName(columnName)) {
      return null;
    }
    
    // Règles pour les colonnes finissant par _id
    if (columnName.endsWith('_id')) {
      // Extraire le nom de la table potentielle (ex: user_id -> users ou user)
      const prefix = columnName.substring(0, columnName.length - 3);
      
      // Chercher une table au singulier ou au pluriel
      const singularTable = prefix;
      const pluralTable = this.pluralize(prefix);
      
      // Chercher dans le schéma
      if (schema.tables[pluralTable]) {
        return { tableName: pluralTable, columnName: 'id' };
      } else if (schema.tables[singularTable]) {
        return { tableName: singularTable, columnName: 'id' };
      }
    }
    
    // Règles pour les colonnes qui sont exactement "id" suivi d'un nom de table
    if (columnName.startsWith('id_')) {
      const tablePart = columnName.substring(3);
      if (schema.tables[tablePart]) {
        return { tableName: tablePart, columnName: 'id' };
      }
    }
    
    // Règles pour les colonnes dont le type et les propriétés correspondent à une clé primaire
    if (this.isCompatibleWithPrimaryKey(column)) {
      // Chercher une table correspondant au nom de la colonne sans _id
      const baseName = columnName.replace(/(_id|id_|_ref)$/i, '');
      
      // Candidates pour la table référencée
      const candidates = [
        baseName,                  // tel quel
        this.pluralize(baseName),  // version plurielle
        baseName + 's',            // version plurielle simple
        baseName + 'es'            // autre version plurielle
      ];
      
      // Chercher dans les tables existantes
      for (const candidate of candidates) {
        if (schema.tables[candidate] && 
            schema.tables[candidate].primaryKey && 
            this.areTypesCompatible(column, schema.tables[candidate].columns[schema.tables[candidate].primaryKey[0]])) {
          return { tableName: candidate, columnName: schema.tables[candidate].primaryKey[0] };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Vérifie si le nom d'une colonne semble être une clé étrangère
   */
  private isPotentialForeignKeyName(columnName: string): boolean {
    // Patterns courants pour les clés étrangères
    const fkPatterns = [
      /_id$/i,                     // se termine par _id
      /^id_/i,                     // commence par id_
      /_ref$/i,                    // se termine par _ref
      /^fk_/i,                     // commence par fk_
      /_fk$/i,                     // se termine par _fk
      /^ref_/i,                    // commence par ref_
      /^foreign_key_/i,            // commence par foreign_key_
      /_(code|key|num|no|number)$/i // se termine par _code, _key, etc.
    ];
    
    return fkPatterns.some(pattern => pattern.test(columnName));
  }
  
  /**
   * Vérifie si une colonne est compatible avec les types de clés primaires
   */
  private isCompatibleWithPrimaryKey(column: ColumnInfo): boolean {
    // Types courants pour les clés primaires/étrangères
    const pkCompatibleTypes = ['INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'VARCHAR', 'CHAR', 'UUID'];
    
    return pkCompatibleTypes.some(type => 
      column.type.toUpperCase().includes(type.toUpperCase()));
  }
  
  /**
   * Vérifie si deux colonnes ont des types compatibles pour une relation
   */
  private areTypesCompatible(column1: ColumnInfo, column2: ColumnInfo): boolean {
    const type1 = column1.type.toUpperCase();
    const type2 = column2.type.toUpperCase();
    
    // Types exactement identiques
    if (type1 === type2) return true;
    
    // Types numériques compatibles
    const numericTypes = ['INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT'];
    const isNumeric1 = numericTypes.some(t => type1.includes(t));
    const isNumeric2 = numericTypes.some(t => type2.includes(t));
    
    if (isNumeric1 && isNumeric2) return true;
    
    // Types chaînes compatibles
    const stringTypes = ['VARCHAR', 'CHAR', 'TEXT'];
    const isString1 = stringTypes.some(t => type1.includes(t));
    const isString2 = stringTypes.some(t => type2.includes(t));
    
    if (isString1 && isString2) return true;
    
    return false;
  }
  
  /**
   * Analyse les fichiers PHP pour détecter les JOINs
   */
  private async analyzePhpJoins(
    schema: MySQLSchema, 
    issues: RelationIssue[]
  ): Promise<void> {
    if (this.options.phpFiles.length === 0) return;
    
    // Map pour stocker les JOINs détectés (sourceTable.sourceColumn -> targetTable.targetColumn)
    const detectedJoins: Map<string, Set<string>> = new Map();
    
    // Analyser chaque fichier PHP
    for (const filePath of this.options.phpFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.extractJoinsFromPhpContent(content, detectedJoins);
      } catch (error) {
        console.warn(`Erreur lors de l'analyse du fichier PHP ${filePath}: ${error.message}`);
      }
    }
    
    // Convertir les JOINs détectés en relations
    this.convertJoinsToRelations(schema, detectedJoins, issues);
  }
  
  /**
   * Extrait les JOINs des requêtes SQL dans le code PHP
   */
  private extractJoinsFromPhpContent(
    content: string, 
    detectedJoins: Map<string, Set<string>>
  ): void {
    // Rechercher des requêtes SQL dans le code PHP
    // Patrons pour détecter les requêtes SQL avec JOIN
    const sqlPatterns = [
      /(?:SELECT|UPDATE|DELETE)[\s\S]*?(?:JOIN|join)\s+(\w+)\s+(?:as\s+)?(\w+)?\s+(?:ON|on)\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/g,
      /(?:INNER|LEFT|RIGHT|OUTER|CROSS|FULL)\s+(?:JOIN|join)\s+(\w+)\s+(?:as\s+)?(\w+)?\s+(?:ON|on)\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/g
    ];
    
    sqlPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let joinedTable, joinedTableAlias, leftTable, leftColumn, rightTable, rightColumn;
        
        if (pattern.source.startsWith('(?:SELECT|UPDATE|DELETE)')) {
          // Premier patron (requête complète)
          joinedTable = match[1];
          joinedTableAlias = match[2] || match[1];
          leftTable = match[3];
          leftColumn = match[4];
          rightTable = match[5];
          rightColumn = match[6];
        } else {
          // Second patron (juste la clause JOIN)
          joinedTable = match[1];
          joinedTableAlias = match[2] || match[1];
          leftTable = match[3];
          leftColumn = match[4];
          rightTable = match[5];
          rightColumn = match[6];
        }
        
        // Résoudre les alias vers les noms de tables réels
        const resolvedLeftTable = leftTable;
        const resolvedRightTable = rightTable === joinedTableAlias ? joinedTable : rightTable;
        
        // Créer des clés pour le Map
        const key1 = `${resolvedLeftTable}.${leftColumn}`;
        const value1 = `${resolvedRightTable}.${rightColumn}`;
        
        // Ajouter dans les deux sens pour capturer toutes les relations
        if (!detectedJoins.has(key1)) {
          detectedJoins.set(key1, new Set());
        }
        detectedJoins.get(key1)!.add(value1);
        
        const key2 = `${resolvedRightTable}.${rightColumn}`;
        const value2 = `${resolvedLeftTable}.${leftColumn}`;
        
        if (!detectedJoins.has(key2)) {
          detectedJoins.set(key2, new Set());
        }
        detectedJoins.get(key2)!.add(value2);
      }
    });
  }
  
  /**
   * Convertit les JOINs détectés en relations dans le schéma
   */
  private convertJoinsToRelations(
    schema: MySQLSchema, 
    detectedJoins: Map<string, Set<string>>, 
    issues: RelationIssue[]
  ): void {
    detectedJoins.forEach((targets, source) => {
      const [sourceTable, sourceColumn] = source.split('.');
      
      targets.forEach(target => {
        const [targetTable, targetColumn] = target.split('.');
        
        // Vérifier si les tables existent dans le schéma
        if (!schema.tables[sourceTable] || !schema.tables[targetTable]) {
          return;
        }
        
        // Vérifier si les colonnes existent dans les tables
        if (!schema.tables[sourceTable].columns[sourceColumn] || 
            !schema.tables[targetTable].columns[targetColumn]) {
          return;  
        }
        
        // Vérifier si cette relation n'est pas déjà explicite ou implicite
        const isAlreadyExplicit = schema.tables[sourceTable].foreignKeys.some(fk => 
          fk.columns.includes(sourceColumn) && 
          fk.referencedTable === targetTable && 
          fk.referencedColumns.includes(targetColumn)
        );
        
        const isAlreadyImplicit = schema.tables[sourceTable].relations?.some(rel => 
          rel.sourceColumn === sourceColumn && 
          rel.targetTable === targetTable && 
          rel.targetColumn === targetColumn
        );
        
        if (!isAlreadyExplicit && !isAlreadyImplicit) {
          // Déterminer le type de relation
          const relationType = this.determineRelationType(
            schema, 
            sourceTable, sourceColumn, 
            targetTable, targetColumn
          );
          
          // Ajouter la relation à la table source
          if (!schema.tables[sourceTable].relations) {
            schema.tables[sourceTable].relations = [];
          }
          
          schema.tables[sourceTable].relations.push({
            sourceTable: sourceTable,
            sourceColumn: sourceColumn,
            targetTable: targetTable,
            targetColumn: targetColumn,
            type: relationType,
            isImplicit: true,
            detectedInCode: true
          });
          
          // Marquer la colonne comme FK implicite
          schema.tables[sourceTable].columns[sourceColumn].isImplicitForeignKey = true;
          schema.tables[sourceTable].columns[sourceColumn].references = {
            table: targetTable,
            column: targetColumn
          };
          
          // Ajouter un problème détecté
          issues.push({
            type: 'JOIN_DETECTED_RELATION',
            sourceTable: sourceTable,
            sourceColumn: sourceColumn,
            targetTable: targetTable,
            targetColumn: targetColumn,
            severity: 'medium',
            description: `Relation détectée via JOIN SQL: ${sourceTable}.${sourceColumn} → ${targetTable}.${targetColumn}`,
            recommendation: `Ajouter une contrainte FOREIGN KEY explicite sur ${sourceTable}.${sourceColumn} référençant ${targetTable}.${targetColumn}`
          });
        }
      });
    });
  }
  
  /**
   * Détermine le type de relation entre deux tables
   */
  private determineRelationType(
    schema: MySQLSchema, 
    sourceTable: string, 
    sourceColumn: string, 
    targetTable: string, 
    targetColumn: string
  ): string {
    const sourceColumnObj = schema.tables[sourceTable].columns[sourceColumn];
    const targetColumnObj = schema.tables[targetTable].columns[targetColumn];
    
    // Si la colonne cible est une clé primaire et la colonne source est unique
    if (targetColumnObj.isPrimary && sourceColumnObj.isUnique) {
      return 'ONE_TO_ONE';
    }
    
    // Si la colonne cible est une clé primaire et la colonne source n'est pas unique
    if (targetColumnObj.isPrimary && !sourceColumnObj.isUnique) {
      return 'MANY_TO_ONE';
    }
    
    // Si la colonne cible n'est pas une clé primaire mais est unique
    if (!targetColumnObj.isPrimary && targetColumnObj.isUnique && sourceColumnObj.isUnique) {
      return 'ONE_TO_ONE';
    }
    
    // Cas par défaut
    return 'MANY_TO_ONE';
  }
  
  /**
   * Détecte les violations de la 3ème forme normale
   */
  private detect3NFViolations(
    schema: MySQLSchema, 
    suggestions: NormalizationSuggestion[]
  ): void {
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      // 1. Chercher les dépendances transitives (indicateur de violation 3NF)
      const transitiveGroups = this.findTransitiveDependencies(table);
      
      if (transitiveGroups.length > 0) {
        // Générer des suggestions de décomposition
        transitiveGroups.forEach(group => {
          const primaryKey = table.primaryKey || ['id'];
          
          // Créer une suggestion de normalisation
          const suggestion: NormalizationSuggestion = {
            type: '3NF_VIOLATION',
            tableName: tableName,
            description: `La table contient des dépendances transitives: ${group.join(', ')} dépendent de colonnes non-clés`,
            recommendation: `Décomposer la table en créant une nouvelle table pour les colonnes ${group.join(', ')}`,
            tables: [tableName],
            suggestedTables: [
              {
                name: tableName,
                columns: Object.keys(table.columns).filter(col => !group.includes(col)),
                primaryKey: primaryKey,
                foreignKeys: []
              },
              {
                name: `${tableName}_${group[0]}`,
                columns: [...primaryKey, ...group],
                primaryKey: primaryKey,
                foreignKeys: [{
                  columns: primaryKey,
                  referencedTable: tableName,
                  referencedColumns: primaryKey
                }]
              }
            ],
            sql: this.generateDecompositionSQL(tableName, table, primaryKey, group)
          };
          
          suggestions.push(suggestion);
        });
      }
      
      // 2. Vérifier les tables qui ont une concaténation de plusieurs entités
      if (this.isConcatenatedEntity(tableName, table)) {
        // Traiter les tables comme "user_order_address" qui devraient être décomposées
        const entities = this.identifyEntities(tableName, table);
        
        if (entities.length > 1) {
          const entityTables = this.suggestEntityDecomposition(tableName, table, entities);
          
          // Créer une suggestion
          const suggestion: NormalizationSuggestion = {
            type: '3NF_VIOLATION',
            tableName: tableName,
            description: `La table semble être une concaténation de plusieurs entités: ${entities.join(', ')}`,
            recommendation: `Décomposer la table en tables distinctes pour chaque entité`,
            tables: [tableName],
            suggestedTables: entityTables.suggestedTables,
            sql: entityTables.sql
          };
          
          suggestions.push(suggestion);
        }
      }
    });
  }
  
  /**
   * Cherche les dépendances transitives dans une table (violation 3NF)
   */
  private findTransitiveDependencies(table: TableInfo): string[][] {
    const transitiveGroups: string[][] = [];
    const primaryKey = table.primaryKey || ['id'];
    const columns = Object.keys(table.columns);
    
    // Groupes de colonnes qui pourraient être dépendantes entre elles
    const potentialGroups = this.findPotentialDependentGroups(table);
    
    potentialGroups.forEach(group => {
      // Si aucun membre du groupe n'est une clé primaire, c'est un candidat pour une dépendance transitive
      if (!group.some(col => primaryKey.includes(col))) {
        transitiveGroups.push(group);
      }
    });
    
    return transitiveGroups;
  }
  
  /**
   * Identifie des groupes de colonnes potentiellement dépendantes
   */
  private findPotentialDependentGroups(table: TableInfo): string[][] {
    const groups: string[][] = [];
    const columns = Object.keys(table.columns);
    
    // Stratégie 1: Colonnes avec préfixes communs
    const prefixGroups = this.groupByPrefix(columns);
    groups.push(...prefixGroups);
    
    // Stratégie 2: Colonnes de type enumération qui vont souvent ensemble
    const enumGroups = this.groupByEnumTypes(table);
    groups.push(...enumGroups);
    
    // Stratégie 3: Colonnes d'adresse qui vont ensemble
    const addressGroup = columns.filter(col => 
      /address|street|city|state|zip|postal|country/i.test(col));
    if (addressGroup.length > 1) {
      groups.push(addressGroup);
    }
    
    // Stratégie 4: Colonnes de coordonnées géographiques
    const geoGroup = columns.filter(col => 
      /lat|lng|latitude|longitude|coord/i.test(col));
    if (geoGroup.length > 1) {
      groups.push(geoGroup);
    }
    
    return groups;
  }
  
  /**
   * Groupe les colonnes par préfixes communs
   */
  private groupByPrefix(columns: string[]): string[][] {
    const prefixMap: Record<string, string[]> = {};
    
    columns.forEach(column => {
      // Trouver le préfixe (comme 'shipping_' dans 'shipping_address')
      const match = column.match(/^([a-z]+)_/);
      if (match && match[1].length > 2) { // Ignorer les préfixes trop courts
        const prefix = match[1];
        if (!prefixMap[prefix]) {
          prefixMap[prefix] = [];
        }
        prefixMap[prefix].push(column);
      }
    });
    
    // Ne retenir que les groupes avec plusieurs colonnes
    return Object.values(prefixMap).filter(group => group.length > 1);
  }
  
  /**
   * Groupe les colonnes par types d'énumération
   */
  private groupByEnumTypes(table: TableInfo): string[][] {
    const enumGroups: string[][] = [];
    const statusColumns = Object.keys(table.columns).filter(col => 
      /status|state|type|category|flag/i.test(col));
    
    // Stratégie simple: si plusieurs colonnes de status/type, les grouper
    if (statusColumns.length > 1) {
      enumGroups.push(statusColumns);
    }
    
    return enumGroups;
  }
  
  /**
   * Vérifie si une table semble être une concaténation de plusieurs entités
   */
  private isConcatenatedEntity(tableName: string, table: TableInfo): boolean {
    // Vérifier si le nom de la table contient des underscores (comme user_order)
    const nameParts = tableName.split('_');
    if (nameParts.length < 2) return false;
    
    // Vérifier si chaque partie du nom correspond à une entité potentielle
    return nameParts.every(part => this.isPotentialEntityName(part));
  }
  
  /**
   * Vérifie si une chaîne peut représenter une entité
   */
  private isPotentialEntityName(name: string): boolean {
    // Une entité devrait avoir un nom significatif (pas trop court)
    if (name.length < 3) return false;
    
    // Éviter les mots courants qui ne sont pas des entités
    const nonEntityWords = ['tmp', 'temp', 'bak', 'backup', 'test', 'log', 'data', 'info'];
    if (nonEntityWords.includes(name.toLowerCase())) return false;
    
    return true;
  }
  
  /**
   * Identifie les entités potentielles dans une table concat
   */
  private identifyEntities(tableName: string, table: TableInfo): string[] {
    const nameParts = tableName.split('_');
    const validParts = nameParts.filter(part => this.isPotentialEntityName(part));
    
    // Vérifier si on peut identifier des colonnes pour chaque entité
    return validParts.filter(part => {
      // Chercher des colonnes qui contiennent ce nom d'entité
      return Object.keys(table.columns).some(col => 
        col.includes(part) || 
        col === 'id_' + part || 
        col === part + '_id');
    });
  }
  
  /**
   * Suggère une décomposition pour une table multi-entités
   */
  private suggestEntityDecomposition(
    tableName: string, 
    table: TableInfo, 
    entities: string[]
  ): {
    suggestedTables: { name: string; columns: string[]; primaryKey: string[]; foreignKeys: any[] }[];
    sql: string;
  } {
    const primaryKey = table.primaryKey || ['id'];
    const suggestedTables: { name: string; columns: string[]; primaryKey: string[]; foreignKeys: any[] }[] = [];
    let sqlStatements = '';
    
    // Répartir les colonnes dans les tables d'entités
    const entityColumns: Record<string, string[]> = {};
    entities.forEach(entity => {
      entityColumns[entity] = [
        ...primaryKey, // Inclure la clé primaire dans chaque table
        ...Object.keys(table.columns).filter(col => 
          col.includes(entity) || 
          col === 'id_' + entity || 
          col === entity + '_id')
      ];
    });
    
    // Ajouter les colonnes restantes à la première entité
    const assignedColumns = new Set([...primaryKey]);
    Object.values(entityColumns).forEach(cols => 
      cols.forEach(col => assignedColumns.add(col)));
    
    const unassignedColumns = Object.keys(table.columns)
      .filter(col => !assignedColumns.has(col));
    
    if (unassignedColumns.length > 0 && entities.length > 0) {
      entityColumns[entities[0]] = [...entityColumns[entities[0]], ...unassignedColumns];
    }
    
    // Créer les tables suggérées
    entities.forEach(entity => {
      suggestedTables.push({
        name: entity,
        columns: entityColumns[entity],
        primaryKey: primaryKey,
        foreignKeys: []
      });
      
      // Ajouter SQL pour créer cette table
      sqlStatements += this.generateEntityTableSQL(entity, table, entityColumns[entity]);
    });
    
    // Ajouter des FK entre les tables d'entités
    for (let i = 1; i < entities.length; i++) {
      suggestedTables[i].foreignKeys.push({
        columns: primaryKey,
        referencedTable: entities[0],
        referencedColumns: primaryKey
      });
      
      // Ajouter SQL pour la FK
      sqlStatements += `\nALTER TABLE \`${entities[i]}\` ADD CONSTRAINT \`fk_${entities[i]}_${entities[0]}\` FOREIGN KEY (${primaryKey.map(col => '`' + col + '`').join(', ')}) REFERENCES \`${entities[0]}\`(${primaryKey.map(col => '`' + col + '`').join(', ')});\n`;
    }
    
    return { suggestedTables, sql: sqlStatements };
  }
  
  /**
   * Génère le SQL pour créer une table d'entité
   */
  private generateEntityTableSQL(
    entityName: string, 
    originalTable: TableInfo, 
    columns: string[]
  ): string {
    let sql = `CREATE TABLE \`${entityName}\` (\n`;
    
    columns.forEach((column, index) => {
      const columnInfo = originalTable.columns[column];
      sql += `  \`${column}\` ${columnInfo.originalType || columnInfo.type}`;
      
      if (columnInfo.nullable) {
        sql += ' NULL';
      } else {
        sql += ' NOT NULL';
      }
      
      if (columnInfo.defaultValue !== null && columnInfo.defaultValue !== undefined) {
        sql += ` DEFAULT ${columnInfo.defaultValue}`;
      }
      
      if (columnInfo.extra) {
        sql += ` ${columnInfo.extra}`;
      }
      
      if (index < columns.length - 1) {
        sql += ',\n';
      }
    });
    
    // Ajouter la clé primaire
    const primaryKey = originalTable.primaryKey || ['id'];
    sql += `,\n  PRIMARY KEY (${primaryKey.map(col => '`' + col + '`').join(', ')})\n`;
    
    sql += ');\n';
    return sql;
  }
  
  /**
   * Génère le SQL pour décomposer une table selon la 3NF
   */
  private generateDecompositionSQL(
    tableName: string, 
    table: TableInfo, 
    primaryKey: string[], 
    dependentGroup: string[]
  ): string {
    // SQL pour créer la table principale sans les colonnes dépendantes
    let mainTableSQL = `-- Table principale sans dépendances transitives\nCREATE TABLE \`${tableName}_new\` (\n`;
    
    const mainColumns = Object.keys(table.columns).filter(col => !dependentGroup.includes(col));
    mainColumns.forEach((column, index) => {
      const columnInfo = table.columns[column];
      mainTableSQL += `  \`${column}\` ${columnInfo.originalType || columnInfo.type}`;
      
      if (columnInfo.nullable) {
        mainTableSQL += ' NULL';
      } else {
        mainTableSQL += ' NOT NULL';
      }
      
      if (columnInfo.defaultValue !== null && columnInfo.defaultValue !== undefined) {
        mainTableSQL += ` DEFAULT ${columnInfo.defaultValue}`;
      }
      
      if (columnInfo.extra) {
        mainTableSQL += ` ${columnInfo.extra}`;
      }
      
      if (index < mainColumns.length - 1) {
        mainTableSQL += ',\n';
      }
    });
    
    // Ajouter la clé primaire
    mainTableSQL += `,\n  PRIMARY KEY (${primaryKey.map(col => '`' + col + '`').join(', ')})\n`;
    mainTableSQL += ');\n\n';
    
    // SQL pour créer la table secondaire avec les colonnes dépendantes
    const dependentTableName = `${tableName}_${dependentGroup[0]}`;
    let dependentTableSQL = `-- Table pour les dépendances transitives\nCREATE TABLE \`${dependentTableName}\` (\n`;
    
    // Ajouter d'abord les colonnes de clé primaire
    primaryKey.forEach(pkCol => {
      const columnInfo = table.columns[pkCol];
      dependentTableSQL += `  \`${pkCol}\` ${columnInfo.originalType || columnInfo.type} NOT NULL,\n`;
    });
    
    // Ajouter ensuite les colonnes dépendantes
    dependentGroup.forEach((column, index) => {
      const columnInfo = table.columns[column];
      dependentTableSQL += `  \`${column}\` ${columnInfo.originalType || columnInfo.type}`;
      
      if (columnInfo.nullable) {
        dependentTableSQL += ' NULL';
      } else {
        dependentTableSQL += ' NOT NULL';
      }
      
      if (columnInfo.defaultValue !== null && columnInfo.defaultValue !== undefined) {
        dependentTableSQL += ` DEFAULT ${columnInfo.defaultValue}`;
      }
      
      dependentTableSQL += index < dependentGroup.length - 1 ? ',\n' : '\n';
    });
    
    // Ajouter la clé primaire et la clé étrangère
    dependentTableSQL += `,  PRIMARY KEY (${primaryKey.map(col => '`' + col + '`').join(', ')}),\n`;
    dependentTableSQL += `  CONSTRAINT \`fk_${dependentTableName}_${tableName}\` FOREIGN KEY (${primaryKey.map(col => '`' + col + '`').join(', ')}) REFERENCES \`${tableName}_new\`(${primaryKey.map(col => '`' + col + '`').join(', ')}) ON DELETE CASCADE\n`;
    dependentTableSQL += ');\n\n';
    
    // SQL pour migrer les données
    let migrationSQL = `-- Migration des données\n`;
    migrationSQL += `INSERT INTO \`${tableName}_new\` SELECT ${mainColumns.map(col => '`' + col + '`').join(', ')} FROM \`${tableName}\`;\n\n`;
    migrationSQL += `INSERT INTO \`${dependentTableName}\` SELECT ${[...primaryKey, ...dependentGroup].map(col => '`' + col + '`').join(', ')} FROM \`${tableName}\`;\n\n`;
    
    // SQL pour renommer/remplacer les tables
    let cleanupSQL = `-- Nettoyage\n`;
    cleanupSQL += `-- Option 1: Renommer les tables\n`;
    cleanupSQL += `-- RENAME TABLE \`${tableName}\` TO \`${tableName}_bak\`, \`${tableName}_new\` TO \`${tableName}\`;\n\n`;
    cleanupSQL += `-- Option 2: Supprimer l'ancienne table\n`;
    cleanupSQL += `-- DROP TABLE \`${tableName}\`;\n`;
    cleanupSQL += `-- RENAME TABLE \`${tableName}_new\` TO \`${tableName}\`;\n`;
    
    return mainTableSQL + dependentTableSQL + migrationSQL + cleanupSQL;
  }
  
  /**
   * Détecte les tables redondantes (similaires)
   */
  private detectRedundantTables(
    schema: MySQLSchema, 
    suggestions: NormalizationSuggestion[]
  ): void {
    const similarityGroups = this.findSimilarTables(schema);
    
    similarityGroups.forEach(group => {
      if (group.tables.length > 1) {
        const tablesStr = group.tables.join(', ');
        
        const suggestion: NormalizationSuggestion = {
          type: 'REDUNDANT_TABLES',
          tableName: group.tables[0], // Utiliser la première table comme référence
          description: `Groupe de tables similaires détectées: ${tablesStr}`,
          recommendation: group.recommendedAction,
          tables: group.tables,
          suggestedTables: [], // Pas de décomposition dans ce cas
          sql: group.suggestedSQL
        };
        
        suggestions.push(suggestion);
      }
    });
  }
  
  /**
   * Trouve des groupes de tables similaires
   */
  private findSimilarTables(schema: MySQLSchema): Array<{
    tables: string[];
    similarity: number;
    recommendedAction: string;
    suggestedSQL: string;
  }> {
    const groups: Array<{
      tables: string[];
      similarity: number;
      recommendedAction: string;
      suggestedSQL: string;
    }> = [];
    
    // 1. Détecter les tables avec des suffixes temporels (log, history, archive, etc.)
    const temporalGroups = this.findTemporalTableGroups(schema);
    groups.push(...temporalGroups);
    
    // 2. Détecter les tables avec une structure très similaire
    const structuralGroups = this.findStructurallySimilarTables(schema);
    groups.push(...structuralGroups);
    
    return groups;
  }
  
  /**
   * Trouve des groupes de tables avec des suffixes temporels
   */
  private findTemporalTableGroups(schema: MySQLSchema): Array<{
    tables: string[];
    similarity: number;
    recommendedAction: string;
    suggestedSQL: string;
  }> {
    const groups: Array<{
      tables: string[];
      similarity: number;
      recommendedAction: string;
      suggestedSQL: string;
    }> = [];
    
    const tableNames = Object.keys(schema.tables);
    const baseTables = new Map<string, string[]>();
    
    // Suffixes temporels courants
    const temporalSuffixes = [
      '_log', '_logs', '_history', '_hist', '_archive', '_arch', 
      '_backup', '_bak', '_temp', '_tmp', '_old', '_new', '_legacy'];
    
    // Préfixes temporels courants
    const temporalPrefixes = [
      'log_', 'logs_', 'history_', 'hist_', 'archive_', 
      'arch_', 'backup_', 'bak_', 'temp_', 'tmp_', 'old_', 'new_', 'legacy_'];
    
    tableNames.forEach(tableName => {
      // Vérifier les suffixes
      for (const suffix of temporalSuffixes) {
        if (tableName.endsWith(suffix)) {
          const baseTable = tableName.slice(0, -suffix.length);
          if (!baseTables.has(baseTable)) {
            baseTables.set(baseTable, []);
          }
          baseTables.get(baseTable)!.push(tableName);
          break;
        }
      }
      
      // Vérifier les préfixes
      for (const prefix of temporalPrefixes) {
        if (tableName.startsWith(prefix)) {
          const baseTable = tableName.slice(prefix.length);
          if (!baseTables.has(baseTable)) {
            baseTables.set(baseTable, []);
          }
          baseTables.get(baseTable)!.push(tableName);
          break;
        }
      }
    });
    
    // Pour chaque groupe de tables avec une base commune
    baseTables.forEach((temporalTables, baseTable) => {
      // Vérifier si la table de base existe aussi
      if (tableNames.includes(baseTable)) {
        temporalTables.push(baseTable);
      }
      
      if (temporalTables.length > 1) {
        // Calculer la similarité structurelle entre ces tables
        const similarity = this.calculateAverageTableSimilarity(schema, temporalTables);
        
        // Si les tables sont suffisamment similaires
        if (similarity > 0.7) {
          const recommendedAction = this.generateTemporalTablesRecommendation(baseTable, temporalTables);
          const suggestedSQL = this.generateTemporalTableSQL(schema, baseTable, temporalTables);
          
          groups.push({
            tables: temporalTables,
            similarity,
            recommendedAction,
            suggestedSQL
          });
        }
      }
    });
    
    return groups;
  }
  
  /**
   * Calcule la similarité moyenne entre plusieurs tables
   */
  private calculateAverageTableSimilarity(schema: MySQLSchema, tableNames: string[]): number {
    if (tableNames.length <= 1) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    // Comparer chaque paire de tables
    for (let i = 0; i < tableNames.length; i++) {
      for (let j = i + 1; j < tableNames.length; j++) {
        const similarity = this.calculateTableSimilarity(
          schema.tables[tableNames[i]], 
          schema.tables[tableNames[j]]
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }
  
  /**
   * Calcule la similarité entre deux tables
   */
  private calculateTableSimilarity(table1: TableInfo, table2: TableInfo): number {
    const columns1 = Object.keys(table1.columns);
    const columns2 = Object.keys(table2.columns);
    
    // Calculer l'intersection des colonnes
    const commonColumns = columns1.filter(col => columns2.includes(col));
    
    // Jaccard similarity = |A ∩ B| / |A ∪ B|
    const similarity = commonColumns.length / (columns1.length + columns2.length - commonColumns.length);
    
    return similarity;
  }
  
  /**
   * Génère une recommandation pour des tables temporelles
   */
  private generateTemporalTablesRecommendation(baseTable: string, tables: string[]): string {
    const tablesStr = tables.join(', ');
    
    // Cas spécial: tables de logs/historique
    if (tables.some(t => t.includes('log') || t.includes('hist'))) {
      return `Considérer la création d'une table d'historique unique pour '${baseTable}' avec un champ 'type' ` +
             `qui distingue entre les différents types d'enregistrements actuellement répartis dans ${tablesStr}.`;
    }
    
    // Cas spécial: tables temporaires
    if (tables.some(t => t.includes('temp') || t.includes('tmp'))) {
      return `Remplacer les tables temporaires ${tablesStr} par une table unique avec un champ 'status' ` +
             `pour indiquer l'état des enregistrements.`;
    }
    
    // Cas général
    return `Considérer la fusion des tables ${tablesStr} en une seule structure avec un champ discriminant ` +
           `pour différencier les types d'enregistrements.`;
  }
  
  /**
   * Génère le SQL suggéré pour des tables temporelles
   */
  private generateTemporalTableSQL(schema: MySQLSchema, baseTable: string, tables: string[]): string {
    let sql = `-- Solution proposée pour les tables similaires: ${tables.join(', ')}\n\n`;
    
    // Déterminer les colonnes communes à toutes les tables
    const commonColumns = this.findCommonColumns(schema, tables);
    
    // Déterminer un nom pour la table unifiée
    const unifiedTableName = baseTable + '_unified';
    
    // Générer le SQL pour créer la table unifiée
    sql += `CREATE TABLE \`${unifiedTableName}\` (\n`;
    
    // Ajouter les colonnes communes
    commonColumns.forEach(column => {
      const columnInfo = schema.tables[tables[0]].columns[column];
      sql += `  \`${column}\` ${columnInfo.originalType || columnInfo.type}`;
      
      if (columnInfo.nullable) {
        sql += ' NULL';
      } else {
        sql += ' NOT NULL';
      }
      
      if (columnInfo.defaultValue !== null && columnInfo.defaultValue !== undefined) {
        sql += ` DEFAULT ${columnInfo.defaultValue}`;
      }
      
      if (columnInfo.extra) {
        sql += ` ${columnInfo.extra}`;
      }
      
      sql += ',\n';
    });
    
    // Ajouter un champ discriminant
    sql += `  \`record_type\` ENUM('${tables.join("','")}') NOT NULL,\n`;
    
    // Colonnes spécifiques à chaque table
    tables.forEach(tableName => {
      const tableColumns = Object.keys(schema.tables[tableName].columns);
      const specificColumns = tableColumns.filter(col => !commonColumns.includes(col));
      
      specificColumns.forEach(column => {
        const columnInfo = schema.tables[tableName].columns[column];
        sql += `  \`${tableName}_${column}\` ${columnInfo.originalType || columnInfo.type} NULL,\n`;
      });
    });
    
    // Clé primaire
    const primaryKey = schema.tables[tables[0]].primaryKey || ['id'];
    sql += `  PRIMARY KEY (${[...primaryKey, 'record_type'].map(col => '`' + col + '`').join(', ')})\n`;
    sql += `);\n\n`;
    
    // SQL pour migrer les données
    sql += `-- Migration des données (à adapter selon vos besoins)\n`;
    tables.forEach(tableName => {
      const tableColumns = Object.keys(schema.tables[tableName].columns);
      const specificColumns = tableColumns.filter(col => !commonColumns.includes(col));
      
      sql += `INSERT INTO \`${unifiedTableName}\` (\n`;
      sql += `  ${commonColumns.map(col => '`' + col + '`').join(',\n  ')},\n`;
      sql += `  \`record_type\`${specificColumns.length > 0 ? ',' : ''}\n`;
      sql += specificColumns.length > 0 
        ? `  ${specificColumns.map(col => '`' + tableName + '_' + col + '`').join(',\n  ')}\n` 
        : '';
      sql += `) SELECT\n`;
      sql += `  ${commonColumns.map(col => '`' + col + '`').join(',\n  ')},\n`;
      sql += `  '${tableName}'${specificColumns.length > 0 ? ',' : ''}\n`;
      sql += specificColumns.length > 0 
        ? `  ${specificColumns.map(col => '`' + col + '`').join(',\n  ')}\n` 
        : '';
      sql += `FROM \`${tableName}\`;\n\n`;
    });
    
    return sql;
  }
  
  /**
   * Trouve les colonnes communes à plusieurs tables
   */
  private findCommonColumns(schema: MySQLSchema, tableNames: string[]): string[] {
    if (tableNames.length === 0) return [];
    
    // Commencer avec toutes les colonnes de la première table
    const firstTable = tableNames[0];
    let commonColumns = Object.keys(schema.tables[firstTable].columns);
    
    // Filtrer pour ne garder que les colonnes présentes dans toutes les tables
    for (let i = 1; i < tableNames.length; i++) {
      const tableColumns = Object.keys(schema.tables[tableNames[i]].columns);
      commonColumns = commonColumns.filter(col => tableColumns.includes(col));
    }
    
    return commonColumns;
  }
  
  /**
   * Trouve les tables structurellement similaires
   */
  private findStructurallySimilarTables(schema: MySQLSchema): Array<{
    tables: string[];
    similarity: number;
    recommendedAction: string;
    suggestedSQL: string;
  }> {
    const groups: Array<{
      tables: string[];
      similarity: number;
      recommendedAction: string;
      suggestedSQL: string;
    }> = [];
    
    const tableNames = Object.keys(schema.tables);
    const processedTables = new Set<string>();
    
    // Comparer chaque paire de tables qui n'a pas déjà été traitée
    for (let i = 0; i < tableNames.length; i++) {
      if (processedTables.has(tableNames[i])) continue;
      
      const similarTables = [tableNames[i]];
      
      for (let j = i + 1; j < tableNames.length; j++) {
        if (processedTables.has(tableNames[j])) continue;
        
        const similarity = this.calculateTableSimilarity(
          schema.tables[tableNames[i]], 
          schema.tables[tableNames[j]]
        );
        
        // Si les tables sont très similaires (>85% de colonnes communes)
        if (similarity > 0.85) {
          similarTables.push(tableNames[j]);
          processedTables.add(tableNames[j]);
        }
      }
      
      if (similarTables.length > 1) {
        processedTables.add(tableNames[i]);
        
        const recommendedAction = `Considérer la fusion des tables ${similarTables.join(', ')} ` +
                                   `en utilisant un champ discriminant pour différencier les types d'enregistrements.`;
        
        const suggestedSQL = this.generateStructuralMergeSQL(schema, similarTables);
        
        groups.push({
          tables: similarTables,
          similarity: 0.85,
          recommendedAction,
          suggestedSQL
        });
      }
    }
    
    return groups;
  }
  
  /**
   * Génère le SQL pour fusionner des tables structurellement similaires
   */
  private generateStructuralMergeSQL(schema: MySQLSchema, tableNames: string[]): string {
    // Très similaire à generateTemporalTableSQL, mais avec un nom différent pour la table unifiée
    const mergedTableName = tableNames.length > 0 
      ? tableNames[0] + '_merged'
      : 'merged_table';
    
    let sql = `-- Solution proposée pour fusionner les tables similaires: ${tableNames.join(', ')}\n\n`;
    
    // Trouver les colonnes communes
    const commonColumns = this.findCommonColumns(schema, tableNames);
    
    sql += `CREATE TABLE \`${mergedTableName}\` (\n`;
    
    // Ajouter les colonnes communes
    commonColumns.forEach(column => {
      const columnInfo = schema.tables[tableNames[0]].columns[column];
      sql += `  \`${column}\` ${columnInfo.originalType || columnInfo.type}`;
      
      if (columnInfo.nullable) {
        sql += ' NULL';
      } else {
        sql += ' NOT NULL';
      }
      
      if (columnInfo.defaultValue !== null && columnInfo.defaultValue !== undefined) {
        sql += ` DEFAULT ${columnInfo.defaultValue}`;
      }
      
      if (columnInfo.extra) {
        sql += ` ${columnInfo.extra}`;
      }
      
      sql += ',\n';
    });
    
    // Ajouter un champ discriminant
    sql += `  \`entity_type\` ENUM('${tableNames.join("','")}') NOT NULL,\n`;
    
    // Colonnes spécifiques à chaque table
    tableNames.forEach(tableName => {
      const tableColumns = Object.keys(schema.tables[tableName].columns);
      const specificColumns = tableColumns.filter(col => !commonColumns.includes(col));
      
      specificColumns.forEach(column => {
        const columnInfo = schema.tables[tableName].columns[column];
        sql += `  \`${tableName}_${column}\` ${columnInfo.originalType || columnInfo.type} NULL,\n`;
      });
    });
    
    // Clé primaire - utiliser la PK de la première table ou id par défaut
    const primaryKey = schema.tables[tableNames[0]].primaryKey || ['id'];
    sql += `  PRIMARY KEY (${[...primaryKey, 'entity_type'].map(col => '`' + col + '`').join(', ')})\n`;
    sql += `);\n\n`;
    
    // Code pour migrer les données depuis chaque table
    sql += `-- Migration des données\n`;
    tableNames.forEach(tableName => {
      const tableColumns = Object.keys(schema.tables[tableName].columns);
      const specificColumns = tableColumns.filter(col => !commonColumns.includes(col));
      
      sql += `INSERT INTO \`${mergedTableName}\` (\n`;
      sql += `  ${commonColumns.map(col => '`' + col + '`').join(',\n  ')},\n`;
      sql += `  \`entity_type\`${specificColumns.length > 0 ? ',' : ''}\n`;
      sql += specificColumns.length > 0 
        ? `  ${specificColumns.map(col => '`' + tableName + '_' + col + '`').join(',\n  ')}\n` 
        : '';
      sql += `) SELECT\n`;
      sql += `  ${commonColumns.map(col => '`' + col + '`').join(',\n  ')},\n`;
      sql += `  '${tableName}'${specificColumns.length > 0 ? ',' : ''}\n`;
      sql += specificColumns.length > 0 
        ? `  ${specificColumns.map(col => '`' + col + '`').join(',\n  ')}\n` 
        : '';
      sql += `FROM \`${tableName}\`;\n\n`;
    });
    
    return sql;
  }
  
  /**
   * Met au pluriel une chaîne (simpliste, à améliorer)
   */
  private pluralize(str: string): string {
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es';
    } else if (str.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2).toLowerCase())) {
      return str.slice(0, -1) + 'ies';
    } else {
      return str + 's';
    }
  }
}