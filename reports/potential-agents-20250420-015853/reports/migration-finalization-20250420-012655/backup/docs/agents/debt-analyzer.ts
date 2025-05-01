/**
import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
 * debt-analyzer.ts
 * 
 * Détecte les problèmes et la dette technique dans le schéma MySQL
 */

import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';
import { ColumnInfo, DebtIssue, MySQLSchema, TableInfo } from '../models/schema';


export class DebtAnalyzer implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent{
  /**
   * Analyse le schéma pour détecter les problèmes de dette technique
   */
  async analyze(schema: MySQLSchema): Promise<{ schema: MySQLSchema; issues: DebtIssue[] }> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const analyzedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Collecter tous les problèmes détectés
    const issues: DebtIssue[] = [];
    
    // Analyser chaque table du schéma
    Object.entries(analyzedSchema.tables).forEach(([tableName, table]) => {
      // Vérifier les problèmes au niveau de la table
      this.detectTableIssues(tableName, table, issues);
      
      // Vérifier les problèmes au niveau des colonnes
      Object.entries(table.columns).forEach(([columnName, column]) => {
        this.detectColumnIssues(tableName, columnName, column, table, issues);
      });
      
      // Vérifier la normalisation et les redondances
      this.detectNormalizationIssues(tableName, table, analyzedSchema, issues);
    });
    
    // Vérifier les incohérences globales entre tables
    this.detectGlobalIssues(analyzedSchema, issues);
    
    return { schema: analyzedSchema, issues };

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';
  }

  /**
   * Détecte les problèmes au niveau de la table
   */
  private detectTableIssues(tableName: string, table: TableInfo, issues: DebtIssue[]): void {
    // Vérifier si la table a une clé primaire
    if (!table.primaryKey) {
      issues.push({
        type: 'MISSING_PRIMARY_KEY',
        tableName,
        severity: 'high',
        message: 'Table sans clé primaire',
        recommendation: 'Ajouter une clé primaire à la table pour garantir l\'intégrité des données',
        impact: 'Difficultés pour les mises à jour/suppressions, performances dégradées'
      });
    }
    
    // Vérifier si la table a un commentaire
    if (!table.comment || table.comment.trim() === '') {
      issues.push({
        type: 'MISSING_COMMENT',
        tableName,
        severity: 'low',
        message: 'Table sans commentaire explicatif',
        recommendation: 'Ajouter un commentaire décrivant le rôle et l\'usage de la table'
      });
    }
    
    // Vérifier si la table a un nom dans le format snake_case ou similaire
    if (!/^[a-z][a-z0-9_]*$/.test(tableName) && !/^[A-Z][a-zA-Z0-9]*$/.test(tableName)) {
      issues.push({
        type: 'INCONSISTENT_NAMING',
        tableName,
        severity: 'medium',
        message: 'Nom de table ne suivant pas une convention de nommage standard',
        recommendation: 'Renommer la table en snake_case (pour PostgreSQL) ou PascalCase (pour Prisma)'
      });
    }
    
    // Vérifier les index manquants sur les FK
    table.foreignKeys.forEach(fk => {
      const hasIndex = table.indexes.some(idx => 
        idx.columns.length === fk.columns.length && 
        fk.columns.every(col => idx.columns.includes(col))
      );
      
      if (!hasIndex) {
        issues.push({
          type: 'MISSING_FK_INDEX',
          tableName,
          severity: 'medium',
          message: `Clé étrangère '${fk.name}' (${fk.columns.join(', ')}) sans index`,
          recommendation: `Créer un index sur la colonne ${fk.columns.length > 1 ? 's' : ''} ${fk.columns.join(', ')}`,
          impact: 'Performance dégradée pour les requêtes JOIN'
        });
      }
    });
    
    // Vérifier les tables avec beaucoup de colonnes (potentiellement non normalisées)
    const columnCount = Object.keys(table.columns).length;
    if (columnCount > 20) {
      issues.push({
        type: 'TOO_MANY_COLUMNS',
        tableName,
        severity: 'medium',
        message: `Table avec un nombre élevé de colonnes (${columnCount})`,
        recommendation: 'Évaluer si certains champs pourraient être extraits vers des tables liées',
        impact: 'Maintenance plus difficile, risque de non-normalisation'
      });
    }
  }

  /**
   * Détecte les problèmes au niveau des colonnes
   */
  private detectColumnIssues(
    tableName: string, 
    columnName: string, 
    column: ColumnInfo, 
    table: TableInfo, 
    issues: DebtIssue[]
  ): void {
    // Vérifier les types de colonnes potentiellement incorrects
    this.detectIncorrectTypes(tableName, columnName, column, issues);
    
    // Vérifier les colonnes potentiellement obsolètes
    this.detectObsoleteColumns(tableName, columnName, column, issues);
    
    // Vérifier les champs TEXT ou BLOB sans contrainte de taille
    if (['TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB'].includes(column.type.toUpperCase()) && 
        column.nullable) {
      issues.push({
        type: 'UNBOUNDED_TEXT',
        tableName,
        columnName,
        severity: 'medium',
        message: `Colonne ${columnName} de type ${column.type} sans limite de taille et nullable`,
        recommendation: 'Ajouter NOT NULL ou utiliser une contrainte CHECK pour limiter la taille'
      });
    }
    
    // Vérifier les champs CHAR à longueur fixe
    if (column.type.toUpperCase() === 'CHAR' && column.length && column.length > 10) {
      issues.push({
        type: 'INEFFICIENT_CHAR',
        tableName,
        columnName,
        severity: 'low',
        message: `Utilisation de CHAR(${column.length}) pour une colonne à longueur fixe potentiellement grande`,
        recommendation: 'Utiliser VARCHAR pour les chaînes de caractères de grande taille'
      });
    }
    
    // Vérifier les colonnes sans commentaire
    if (!column.comment || column.comment.trim() === '') {
      // Ignorer les colonnes courantes comme id, created_at, etc.
      const commonColumns = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by'];
      if (!commonColumns.includes(columnName.toLowerCase())) {
        issues.push({
          type: 'MISSING_COLUMN_COMMENT',
          tableName,
          columnName,
          severity: 'low',
          message: `Colonne ${columnName} sans commentaire explicatif`,
          recommendation: 'Ajouter un commentaire décrivant le rôle et l\'usage de la colonne'
        });
      }
    }
    
    // Vérifier les noms de colonnes peu clairs ou génériques
    const genericNames = ['data', 'info', 'value', 'values', 'type', 'types', 'status', 'content'];
    if (genericNames.includes(columnName.toLowerCase()) && !column.comment) {
      issues.push({
        type: 'AMBIGUOUS_COLUMN_NAME',
        tableName,
        columnName,
        severity: 'medium',
        message: `Nom de colonne générique '${columnName}' sans commentaire explicatif`,
        recommendation: 'Renommer avec un nom plus descriptif ou ajouter un commentaire'
      });
    }
    
    // Vérifier les tables avec des colonnes duplicant l'information d'autres tables
    if (column.isImplicitForeignKey && !table.foreignKeys.some(fk => fk.columns.includes(columnName))) {
      issues.push({
        type: 'IMPLICIT_FOREIGN_KEY',
        tableName,
        columnName,
        severity: 'medium',
        message: `Colonne ${columnName} semble être une clé étrangère implicite vers ${column.references?.table || '?'}.${column.references?.column || '?'}`,
        recommendation: 'Ajouter une contrainte FOREIGN KEY explicite'
      });
    }
  }

  /**
   * Détecte les problèmes de types incorrects
   */
  private detectIncorrectTypes(
    tableName: string, 
    columnName: string, 
    column: ColumnInfo, 
    issues: DebtIssue[]
  ): void {
    const type = column.type.toUpperCase();
    
    // TINYINT(1) devrait être BOOLEAN dans PostgreSQL
    if (type === 'TINYINT' && column.length === 1) {
      const booleanNames = ['is_', 'has_', 'can_', 'allow_', 'enable_', 'active', 'visible', 'hidden', 'deleted', 'flag'];
      const nameMatches = booleanNames.some(pattern => columnName.toLowerCase().includes(pattern));
      
      if (nameMatches && column.suggestedPostgresType !== 'BOOLEAN') {
        issues.push({
          type: 'INCORRECT_BOOLEAN_TYPE',
          tableName,
          columnName,
          severity: 'medium',
          message: `Colonne ${columnName} utilise TINYINT(1) mais semble être un booléen`,
          recommendation: 'Convertir en type BOOLEAN dans PostgreSQL'
        });
      }
    }
    
    // VARCHAR avec une longueur très grande devrait être TEXT
    if (type === 'VARCHAR' && column.length && column.length > 1000) {
      issues.push({
        type: 'INEFFICIENT_VARCHAR',
        tableName,
        columnName,
        severity: 'low',
        message: `Colonne ${columnName} utilise VARCHAR(${column.length}) avec une longueur très grande`,
        recommendation: 'Utiliser TEXT dans PostgreSQL pour les chaînes de grande taille'
      });
    }
    
    // INT pour les timestamps devrait être TIMESTAMP
    if (['INT', 'INTEGER', 'BIGINT'].includes(type) && 
        (columnName.includes('_at') || columnName.includes('date') || columnName.includes('time'))) {
      issues.push({
        type: 'INCORRECT_TIMESTAMP_TYPE',
        tableName,
        columnName,
        severity: 'medium',
        message: `Colonne ${columnName} utilise ${type} mais semble être un timestamp`,
        recommendation: 'Convertir en type TIMESTAMP dans PostgreSQL'
      });
    }
  }

  /**
   * Détecte les colonnes potentiellement obsolètes
   */
  private detectObsoleteColumns(
    tableName: string, 
    columnName: string, 
    column: ColumnInfo, 
    issues: DebtIssue[]
  ): void {
    // Patterns de noms de colonnes potentiellement obsolètes
    const obsoletePatterns = [
      { pattern: /^old_/i, reason: 'Préfixe "old_" suggère une colonne conservée après refactoring' },
      { pattern: /^temp_/i, reason: 'Préfixe "temp_" suggère une colonne temporaire' },
      { pattern: /_old$/i, reason: 'Suffixe "_old" suggère une colonne conservée après refactoring' },
      { pattern: /_tmp$/i, reason: 'Suffixe "_tmp" suggère une colonne temporaire' },
      { pattern: /_bak$/i, reason: 'Suffixe "_bak" suggère une colonne de sauvegarde' },
      { pattern: /_backup$/i, reason: 'Suffixe "_backup" suggère une colonne de sauvegarde' },
      { pattern: /_deprecated$/i, reason: 'Suffixe "_deprecated" indique une colonne obsolète' },
      { pattern: /^unused_/i, reason: 'Préfixe "unused_" indique une colonne non utilisée' },
      { pattern: /_unused$/i, reason: 'Suffixe "_unused" indique une colonne non utilisée' },
      { pattern: /^legacy_/i, reason: 'Préfixe "legacy_" suggère un héritage technique' }
    ];
    
    // Vérifier si le nom de la colonne correspond à un pattern obsolète
    for (const { pattern, reason } of obsoletePatterns) {
      if (pattern.test(columnName)) {
        column.isObsolete = true;
        column.obsoleteReason = reason;
        
        issues.push({
          type: 'OBSOLETE_COLUMN',
          tableName,
          columnName,
          severity: 'medium',
          message: `Colonne potentiellement obsolète: ${reason}`,
          recommendation: 'Vérifier l\'usage et envisager de supprimer la colonne'
        });
        
        break;
      }
    }
  }

  /**
   * Détecte les problèmes de normalisation
   */
  private detectNormalizationIssues(
    tableName: string, 
    table: TableInfo, 
    schema: MySQLSchema, 
    issues: DebtIssue[]
  ): void {
    // Vérifier les colonnes JSON qui pourraient être normalisées
    Object.entries(table.columns).forEach(([columnName, column]) => {
      if (column.type.toUpperCase() === 'JSON' || column.type.toUpperCase() === 'LONGTEXT') {
        issues.push({
          type: 'POTENTIAL_DENORMALIZATION',
          tableName,
          columnName,
          severity: 'medium',
          message: `Colonne ${columnName} de type ${column.type} peut contenir des données structurées`,
          recommendation: 'Envisager de normaliser les données en créant des tables liées'
        });
      }
    });
    
    // Vérifier les colonnes avec des préfixes ou suffixes communs qui pourraient être extraites
    const columnGroups = this.groupSimilarColumns(table.columns);
    
    Object.entries(columnGroups).forEach(([prefix, columns]) => {
      if (columns.length > 3) {
        issues.push({
          type: 'REPEATING_COLUMN_PATTERN',
          tableName,
          severity: 'medium',
          message: `${columns.length} colonnes avec le préfixe/suffixe '${prefix}': ${columns.join(', ')}`,
          recommendation: 'Envisager de créer une table liée pour ces données'
        });
      }
    });
  }

  /**
   * Regroupe les colonnes avec des préfixes ou suffixes communs
   */
  private groupSimilarColumns(columns: Record<string, ColumnInfo>): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    Object.keys(columns).forEach(columnName => {
      // Vérifier les préfixes communs (ex: address_street, address_city, address_country)
      const prefixMatch = columnName.match(/^([a-z]+)_(.+)$/i);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        if (!groups[prefix]) {
          groups[prefix] = [];
        }
        groups[prefix].push(columnName);
      }
      
      // Vérifier les suffixes communs (ex: shipping_address, billing_address)
      const suffixMatch = columnName.match(/^(.+)_([a-z]+)$/i);
      if (suffixMatch) {
        const suffix = suffixMatch[2];
        if (!groups[suffix]) {
          groups[suffix] = [];
        }
        groups[suffix].push(columnName);
      }
    });
    
    // Nettoyer les groupes avec moins de 2 colonnes
    return Object.fromEntries(
      Object.entries(groups).filter(([_, cols]) => cols.length >= 2)
    );
  }

  /**
   * Détecte les problèmes globaux du schéma
   */
  private detectGlobalIssues(schema: MySQLSchema, issues: DebtIssue[]): void {
    // Vérifier les incohérences de nommage entre tables liées
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      // Vérifier les clés étrangères
      table.foreignKeys.forEach(fk => {
        const targetTable = schema.tables[fk.referencedTable];
        if (!targetTable) return;
        
        fk.columns.forEach((column, index) => {
          const targetColumn = fk.referencedColumns[index];
          
          // Vérifier les incohérences de types entre FK et PK
          const sourceColumn = table.columns[column];
          const refColumn = targetTable.columns[targetColumn];
          
          if (sourceColumn && refColumn && sourceColumn.type !== refColumn.type) {
            issues.push({
              type: 'FK_TYPE_MISMATCH',
              tableName,
              columnName: column,
              severity: 'high',
              message: `Type de la clé étrangère (${sourceColumn.type}) ne correspond pas à la colonne référencée ${fk.referencedTable}.${targetColumn} (${refColumn.type})`,
              recommendation: 'Unifier les types entre la FK et la colonne référencée'
            });
          }
        });
      });
    });
    
    // Vérifier les tables sans relations (îlots)
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      if (table.tableType === 'BUSINESS' && 
          table.foreignKeys.length === 0 && 
          !Object.values(schema.tables).some(t => 
            t.foreignKeys.some(fk => fk.referencedTable === tableName)
          )) {
        issues.push({
          type: 'ISOLATED_TABLE',
          tableName,
          severity: 'low',
          message: `Table métier sans relations entrantes ou sortantes`,
          recommendation: 'Vérifier si cette table devrait être reliée à d\'autres tables du modèle'
        });
      }
    });
    
    // Vérifier les schémas incohérents (ex: certaines tables avec timestamp, d'autres sans)
    const tablesWithTimestamps = Object.entries(schema.tables)
      .filter(([_, table]) => 
        Object.keys(table.columns).some(col => 
          ['created_at', 'updated_at', 'created_by', 'updated_by'].includes(col)
        )
      )
      .map(([name, _]) => name);
    
    const tablesWithoutTimestamps = Object.entries(schema.tables)
      .filter(([_, table]) => 
        table.tableType === 'BUSINESS' && 
        !Object.keys(table.columns).some(col => 
          ['created_at', 'updated_at', 'created_by', 'updated_by'].includes(col)
        )
      )
      .map(([name, _]) => name);
    
    if (tablesWithTimestamps.length > 0 && tablesWithoutTimestamps.length > 0) {
      issues.push({
        type: 'INCONSISTENT_TIMESTAMPS',
        tableName: 'ALL',
        severity: 'medium',
        message: `Certaines tables ont des colonnes d'audit (created_at, updated_at) et d'autres non`,
        recommendation: 'Standardiser l\'usage des colonnes d\'audit sur toutes les tables métier'
      });
    }
  }
}