/**
 * classifier.ts
 * 
 * Classification des tables MySQL par type (métier, technique, etc.)
 */

import { MySQLSchema, TableInfo, TableType } from '../models/schema';

export class TableClassifier {
  // Patterns pour identifier les types de tables
  private readonly businessPatterns = [
    /^(client|customer)s?$/i,
    /^(user|utilisateur)s?$/i,
    /^(product|produit)s?$/i,
    /^(order|commande)s?$/i,
    /^(categor|cart|panier)/i,
    /^(address|adresse)s?$/i,
    /^(payment|paiement)s?$/i,
    /^(invoice|facture)s?$/i,
    /^(shipment|livraison)s?$/i,
    /^(blog|article)s?$/i,
    /^(comment|commentaire)s?$/i,
    /^(tag)s?$/i,
  ];

  private readonly junctionPatterns = [
    /_has_/i,
    /_to_/i,
    /(_map|_mapping)$/i,
    /^map_/i,
    /^rel_/i,
    /^link_/i,
    /^assoc_/i,
    /^relation/i,
  ];

  private readonly auditPatterns = [
    /^(log|logs|audit|history)_/i,
    /_(log|logs|audit|history)$/i,
    /^(change|version)s?_/i,
    /_(change|version)s?$/i,
  ];

  private readonly cachePatterns = [
    /^cache_/i,
    /_cache$/i,
    /^temp_/i,
    /_temp$/i,
    /^tmp_/i,
    /_tmp$/i,
    /^sess(ion)?s?$/i,
  ];

  private readonly configPatterns = [
    /^(config|configuration|setting|param|parameter)s?$/i,
    /^(option|variable)s?$/i,
    /^(const|constant)s?$/i,
    /^(preference|pref)s?$/i,
  ];

  private readonly referencePatterns = [
    /^ref_/i,
    /^enum_/i,
    /^type_/i,
    /^status_/i,
    /^country$/i,
    /^region$/i,
    /^(state|province)$/i,
    /^city$/i,
    /^currency$/i,
    /^language$/i,
  ];

  /**
   * Classifie les tables du schéma
   */
  classify(schema: MySQLSchema): MySQLSchema {
    // Créer une copie profonde du schéma pour ne pas modifier l'original
    const classifiedSchema: MySQLSchema = JSON.parse(JSON.stringify(schema));
    
    // Classifier chaque table
    Object.values(classifiedSchema.tables).forEach(table => {
      table.tableType = this.determineTableType(table);
    });
    
    return classifiedSchema;
  }

  /**
   * Détermine le type d'une table
   */
  private determineTableType(table: TableInfo): TableType {
    const tableName = table.name.toLowerCase();
    
    // Vérifier s'il s'agit d'une table de jonction (généralement quelques colonnes et des clés étrangères)
    if (this.isJunctionTable(table)) {
      return TableType.JUNCTION;
    }
    
    // Utiliser les patterns de nommage pour déterminer le type
    if (this.matchesAnyPattern(tableName, this.businessPatterns)) {
      return TableType.BUSINESS;
    }
    
    if (this.matchesAnyPattern(tableName, this.auditPatterns)) {
      return TableType.AUDIT;
    }
    
    if (this.matchesAnyPattern(tableName, this.cachePatterns)) {
      return TableType.CACHE;
    }
    
    if (this.matchesAnyPattern(tableName, this.configPatterns)) {
      return TableType.CONFIG;
    }
    
    if (this.matchesAnyPattern(tableName, this.referencePatterns)) {
      return TableType.REFERENCE;
    }
    
    // Analyse approfondie de la structure
    if (this.isBusinessTableByStructure(table)) {
      return TableType.BUSINESS;
    }
    
    // Déterminer s'il s'agit d'une table technique basée sur d'autres critères
    if (this.isTechnicalTable(table)) {
      return TableType.TECHNICAL;
    }
    
    // Par défaut, une table est considérée comme inconnue
    return TableType.UNKNOWN;
  }

  /**
   * Vérifie si le nom correspond à l'un des patterns fournis
   */
  private matchesAnyPattern(name: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(name));
  }

  /**
   * Détermine si une table est une table de jonction
   */
  private isJunctionTable(table: TableInfo): boolean {
    const tableName = table.name.toLowerCase();
    
    // Vérifier le nom de la table
    if (this.matchesAnyPattern(tableName, this.junctionPatterns)) {
      return true;
    }
    
    // Vérifier la structure : généralement 2-3 colonnes, principalement des clés étrangères
    const columnCount = Object.keys(table.columns).length;
    const foreignKeyCount = table.foreignKeys.length;
    
    // Si la table a peu de colonnes et au moins deux clés étrangères
    if (columnCount <= 4 && foreignKeyCount >= 2) {
      // Vérifier si la majorité des colonnes font partie des clés étrangères
      const fkColumnsCount = table.foreignKeys.reduce((count, fk) => count + fk.columns.length, 0);
      if (fkColumnsCount / columnCount >= 0.5) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Détermine si une table est une table métier basée sur sa structure
   */
  private isBusinessTableByStructure(table: TableInfo): boolean {
    // Les tables métier ont généralement plusieurs colonnes
    const columnCount = Object.keys(table.columns).length;
    if (columnCount < 4) {
      return false;
    }
    
    // Vérifier la présence de colonnes typiques des tables métier
    const hasTimestampColumns = Object.values(table.columns).some(col => 
      ['created_at', 'updated_at', 'deleted_at', 'date_created', 'date_updated'].includes(col.name.toLowerCase())
    );
    
    const hasNameColumn = Object.values(table.columns).some(col => 
      ['name', 'title', 'label', 'nom', 'libelle'].includes(col.name.toLowerCase())
    );
    
    const hasStatusColumn = Object.values(table.columns).some(col => 
      ['status', 'state', 'active', 'enabled', 'published'].includes(col.name.toLowerCase())
    );
    
    // Si la table a des colonnes de timestamp ET soit un nom, soit un statut
    if (hasTimestampColumns && (hasNameColumn || hasStatusColumn)) {
      return true;
    }
    
    return false;
  }

  /**
   * Détermine si une table est une table technique
   */
  private isTechnicalTable(table: TableInfo): boolean {
    // Vérifier s'il y a des indices dans les commentaires
    if (table.comment) {
      const comment = table.comment.toLowerCase();
      if (comment.includes('technical') || 
          comment.includes('internal') || 
          comment.includes('system') ||
          comment.includes('technique') ||
          comment.includes('interne') ||
          comment.includes('système')) {
        return true;
      }
    }
    
    // Certains noms de colonnes techniques courants
    const technicalColumnNames = [
      'session_id', 'token', 'hash', 'cache_key', 'lock_', 'checksum', 'sync_',
      'batch_id', 'queue_', 'job_id', 'process_id', 'worker_', 'task_id'
    ];
    
    // Si la table contient principalement des colonnes techniques
    const columnNames = Object.keys(table.columns).map(name => name.toLowerCase());
    const technicalColumnCount = columnNames.filter(name => 
      technicalColumnNames.some(pattern => name.includes(pattern))
    ).length;
    
    if (technicalColumnCount / columnNames.length >= 0.4) {
      return true;
    }
    
    return false;
  }
}