/**
 * debt-detector.ts
 * 
 * Agent spécialisé dans la détection de dette technique SQL
 * - Identifie les colonnes obsolètes ou non utilisées
 * - Détecte les problèmes de nommage
 * - Analyse le surusage de NULL
 */

import { MySQLSchema, TableInfo, ColumnInfo, DebtScore, FieldRenamingSuggestion } from '../models/schema';

export class DebtDetector {
  // Préfixes et suffixes problématiques
  private problematicPrefixes = ['z_', 'old_', 'tmp_', 'temp_', 'unused_', 'test_', 'obsolete_'];
  private problematicSuffixes = ['_old', '_tmp', '_temp', '_bak', '_backup', '_test', '_obsolete', '_unused'];
  
  // Noms génériques non descriptifs
  private genericNames = ['data', 'value', 'val', 'field', 'column', 'param', 'info', 'misc', 'stuff'];
  
  // Colonnes couramment obsolètes
  private potentiallyObsoleteColumns = [
    'user_modif', 'modified_by', 'created_by', 'last_seen',
    'create_time', 'update_time', 'last_update',
    'temp_id', 'tmp_value', 'old_status'
  ];
  
  /**
   * Analyse le schéma pour détecter la dette technique
   */
  async analyze(schema: MySQLSchema): Promise<{
    schema: MySQLSchema;
    debtScores: DebtScore[];
    fieldRenamingSuggestions: FieldRenamingSuggestion[];
    debtFlags: any[];
  }> {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const auditedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Scores de dette par table
    const debtScores: DebtScore[] = [];
    
    // Suggestions de renommage
    const fieldRenamingSuggestions: FieldRenamingSuggestion[] = [];
    
    // Drapeaux de dette détectés
    const debtFlags: any[] = [];
    
    // Analyser chaque table
    Object.entries(auditedSchema.tables).forEach(([tableName, table]) => {
      // Score initial (100 = parfait, 0 = terrible)
      let tableScore = 100;
      const issues: string[] = [];
      
      // 1. Vérifier le nom de la table
      const tableNameScore = this.evaluateTableName(tableName);
      if (tableNameScore < 100) {
        tableScore -= (100 - tableNameScore) * 0.2; // Pondération de 20%
        issues.push(`Problème de nommage (table): ${100 - tableNameScore}/100`);
        
        // Ajouter un drapeau
        debtFlags.push({
          tableName,
          columnName: '',
          type: 'TABLE_NAMING',
          severity: tableNameScore < 50 ? 'high' : 'medium',
          description: `Nom de table non optimal: ${tableName}`,
          impact: 'Lisibilité et maintenabilité du code réduite'
        });
      }
      
      // 2. Vérifier les colonnes NULL
      const nullPercentage = this.calculateNullPercentage(table);
      if (nullPercentage > 50) {
        const nullPenalty = (nullPercentage - 50) * 0.4; // Max 20% si 100% nullable
        tableScore -= nullPenalty;
        issues.push(`Surusage de NULL: ${nullPercentage}% des colonnes sont nullable`);
        
        debtFlags.push({
          tableName,
          columnName: '',
          type: 'NULLABLE_OVERUSE',
          severity: nullPercentage > 75 ? 'high' : 'medium',
          description: `${nullPercentage}% des colonnes sont NULL`,
          impact: 'Risque accru de bugs liés aux valeurs NULL, intégrité des données compromise'
        });
      }
      
      // 3. Vérifier chaque colonne
      let problematicColumnCount = 0;
      const totalColumns = Object.keys(table.columns).length;
      
      Object.entries(table.columns).forEach(([columnName, column]) => {
        const columnIssues = this.evaluateColumn(columnName, column, tableName);
        
        // Ajouter les problèmes détectés
        columnIssues.forEach(issue => {
          if (issue.type === 'NAMING') {
            // Suggestion de renommage
            fieldRenamingSuggestions.push({
              tableName,
              currentName: columnName,
              suggestedName: issue.suggestion,
              reason: issue.description,
              columnType: column.originalType || column.type
            });
          }
          
          // Ajouter un drapeau
          debtFlags.push({
            tableName,
            columnName,
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
            impact: issue.impact
          });
          
          // Compter cette colonne comme problématique
          problematicColumnCount++;
        });
      });
      
      // Pénaliser en fonction du pourcentage de colonnes problématiques
      if (totalColumns > 0) {
        const problematicPercentage = (problematicColumnCount / totalColumns) * 100;
        const columnsPenalty = problematicPercentage * 0.6; // Max 60% si toutes problématiques
        tableScore -= columnsPenalty;
        
        if (problematicPercentage > 0) {
          issues.push(`${problematicPercentage.toFixed(1)}% des colonnes présentent des problèmes`);
        }
      }
      
      // Ajouter le score de dette
      debtScores.push({
        tableName,
        score: Math.round(Math.max(0, Math.min(100, tableScore))), // 0-100
        mainIssues: issues.slice(0, 3) // Top 3 problèmes
      });
    });
    
    return { 
      schema: auditedSchema, 
      debtScores, 
      fieldRenamingSuggestions, 
      debtFlags 
    };
  }
  
  /**
   * Évalue la qualité du nom d'une table (0-100)
   */
  private evaluateTableName(tableName: string): number {
    let score = 100;
    
    // Vérifier la longueur du nom
    if (tableName.length < 3) {
      score -= 30; // Noms trop courts
    } else if (tableName.length > 30) {
      score -= 20; // Noms trop longs
    }
    
    // Vérifier les préfixes et suffixes problématiques
    if (this.problematicPrefixes.some(prefix => tableName.startsWith(prefix))) {
      score -= 40;
    }
    
    if (this.problematicSuffixes.some(suffix => tableName.endsWith(suffix))) {
      score -= 40;
    }
    
    // Vérifier si le nom est trop générique
    if (this.genericNames.includes(tableName)) {
      score -= 50;
    }
    
    // Vérifier si le nom contient des chiffres (souvent problématique)
    if (/\d/.test(tableName)) {
      score -= 20;
    }
    
    // Vérifier la convention de nommage
    if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
      score -= 15; // Pas snake_case
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Calcule le pourcentage de colonnes NULL dans une table
   */
  private calculateNullPercentage(table: TableInfo): number {
    const columns = Object.values(table.columns);
    const nullableColumns = columns.filter(col => col.nullable);
    
    return columns.length > 0 ? (nullableColumns.length / columns.length) * 100 : 0;
  }
  
  /**
   * Évalue une colonne pour détecter les problèmes potentiels
   */
  private evaluateColumn(
    columnName: string, 
    column: ColumnInfo, 
    tableName: string
  ): Array<{
    type: string;
    severity: string;
    description: string;
    suggestion?: string;
    impact: string;
  }> {
    const issues: Array<{
      type: string;
      severity: string;
      description: string;
      suggestion?: string;
      impact: string;
    }> = [];
    
    // 1. Vérifier le problème de nommage
    const namingIssue = this.checkColumnNaming(columnName);
    if (namingIssue) {
      issues.push({
        type: 'NAMING',
        severity: 'medium',
        description: `Nom de colonne problématique: ${namingIssue.reason}`,
        suggestion: namingIssue.suggestion,
        impact: 'Réduit la lisibilité et la maintenabilité du code'
      });
    }
    
    // 2. Vérifier les colonnes potentiellement obsolètes
    if (this.potentiallyObsoleteColumns.includes(columnName)) {
      issues.push({
        type: 'OBSOLETE_COLUMN',
        severity: 'medium',
        description: `Colonne potentiellement obsolète ou superflue`,
        impact: 'Augmente la complexité et le volume de données sans nécessité'
      });
    }
    
    // 3. Vérifier les colonnes de type TEXT/BLOB sans index
    const isLargeType = /text|blob/i.test(column.type);
    if (isLargeType && !column.isIndexed) {
      issues.push({
        type: 'LARGE_UNINDEXED',
        severity: 'low',
        description: `Type volumineux (${column.type}) sans index`,
        impact: 'Peut entraîner des problèmes de performance en cas de requêtes fréquentes'
      });
    }
    
    // 4. Vérifier les colonnes de date/heure sans index
    const isDateType = /date|time|timestamp/i.test(column.type);
    if (isDateType && !column.isIndexed && 
       (columnName.includes('date') || columnName.includes('time'))) {
      issues.push({
        type: 'DATE_UNINDEXED',
        severity: 'low',
        description: `Colonne de date/heure sans index`,
        impact: 'Peut ralentir les requêtes temporelles ou les tris chronologiques'
      });
    }
    
    // 5. Vérifier les chaînes de caractères trop longues
    if (column.type.toUpperCase().includes('VARCHAR') && column.length && column.length > 255) {
      issues.push({
        type: 'EXCESSIVE_LENGTH',
        severity: 'medium',
        description: `Longueur excessive pour VARCHAR(${column.length})`,
        impact: 'Gaspillage d\'espace et potentiellement des performances réduites'
      });
    }
    
    // 6. Vérifier les colonnes d'énumération avec peu de valeurs
    if (column.type.toUpperCase().includes('ENUM') && column.enumValues && column.enumValues.length <= 2) {
      issues.push({
        type: 'SMALL_ENUM',
        severity: 'low',
        description: `Énumération avec seulement ${column.enumValues.length} valeurs`,
        impact: 'Un type booléen ou un flag pourrait être plus approprié'
      });
    }
    
    // 7. Vérifier les colonnes NULL qui semblent être obligatoires
    if (column.nullable && this.shouldBeNonNullable(columnName)) {
      issues.push({
        type: 'UNNECESSARY_NULL',
        severity: 'medium',
        description: `Cette colonne devrait probablement être NOT NULL`,
        impact: 'Risque d\'incohérence des données et de bugs'
      });
    }
    
    return issues;
  }
  
  /**
   * Vérifie si le nom d'une colonne est problématique
   */
  private checkColumnNaming(columnName: string): { reason: string; suggestion: string } | null {
    // Noms trop courts ou non descriptifs
    if (columnName.length <= 1) {
      return {
        reason: 'Nom trop court',
        suggestion: `${columnName}_value`
      };
    }
    
    // Variables temporaires ou de débogage
    if (this.problematicPrefixes.some(prefix => columnName.startsWith(prefix))) {
      return {
        reason: 'Préfixe suggérant une colonne temporaire',
        suggestion: columnName.replace(/^(z_|old_|tmp_|temp_|unused_|test_|obsolete_)/, '')
      };
    }
    
    if (this.problematicSuffixes.some(suffix => columnName.endsWith(suffix))) {
      return {
        reason: 'Suffixe suggérant une colonne temporaire',
        suggestion: columnName.replace(/(\_old|\_tmp|\_temp|\_bak|\_backup|\_test|\_obsolete|\_unused)$/, '')
      };
    }
    
    // Noms trop génériques
    if (this.genericNames.includes(columnName)) {
      return {
        reason: 'Nom trop générique',
        suggestion: `specific_${columnName}`
      };
    }
    
    // Noms numériques (data1, data2, etc.)
    const numericMatch = columnName.match(/^([a-z_]+)(\d+)$/);
    if (numericMatch) {
      return {
        reason: 'Nom avec suffixe numérique',
        suggestion: `${numericMatch[1]}_item_${numericMatch[2]}`
      };
    }
    
    // Abréviations obscures
    if (/^[a-z]{1,2}\d*$/.test(columnName)) {
      return {
        reason: 'Abréviation trop courte ou obscure',
        suggestion: `expanded_${columnName}`
      };
    }
    
    // Convention de nommage incohérente
    if (!/^[a-z][a-z0-9_]*$/.test(columnName)) {
      // Conversion CamelCase en snake_case
      if (/[A-Z]/.test(columnName)) {
        const snakeCase = columnName.replace(/([A-Z])/g, '_$1').toLowerCase();
        return {
          reason: 'Utilisation de CamelCase au lieu de snake_case',
          suggestion: snakeCase.startsWith('_') ? snakeCase.substring(1) : snakeCase
        };
      }
      
      return {
        reason: 'Convention de nommage incohérente',
        suggestion: columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      };
    }
    
    return null;
  }
  
  /**
   * Détermine si une colonne devrait probablement être NOT NULL
   */
  private shouldBeNonNullable(columnName: string): boolean {
    // Colonnes qui devraient généralement être NOT NULL
    const nonNullablePatterns = [
      /^is_/, // champs booléens (is_active, is_deleted, etc.)
      /status$/, // statuts (order_status, user_status, etc.)
      /type$/, // types (content_type, user_type, etc.)
      /^(created|updated|modified)_(at|on|date)$/, // horodatages
      /^date_/, // dates diverses
      /^(active|deleted|enabled|visible)$/ // flags booléens
    ];
    
    return nonNullablePatterns.some(pattern => pattern.test(columnName));
  }
}