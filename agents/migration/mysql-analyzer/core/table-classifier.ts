/**
 * table-classifier.ts
 * 
 * Classificateur de tables qui distingue les tables métier des tables techniques
 */

import { MySQLSchema, TableInfo, TableType } from '../models/schema';

interface ClassificationRule {
  pattern: RegExp | string;
  type: TableType;
  patternType: 'name' | 'structure' | 'content';
  description: string;
}

export class TableClassifier {
  // Règles de classification des tables
  private classificationRules: ClassificationRule[] = [
    // Tables techniques courantes
    { 
      pattern: /^(log|logs|audit|history|archive|backup|cache|temp|tmp|queue|job|batch|lock|session)s?$/i,
      type: TableType.TECHNICAL,
      patternType: 'name',
      description: 'Table technique identifiée par un nom commun'
    },
    { 
      pattern: /^[a-z]{1,3}_/i, // Tables avec préfixe court (ex: wp_, tbl_, t_, etc.)
      type: TableType.TECHNICAL,
      patternType: 'name',
      description: 'Table avec préfixe court (probablement technique)'
    },
    {
      pattern: /_version$/i, // Tables de versionnement
      type: TableType.TECHNICAL,
      patternType: 'name',
      description: 'Table de versionnement'
    },
    {
      pattern: /migration/i, // Tables de migration
      type: TableType.TECHNICAL,
      patternType: 'name',
      description: 'Table liée aux migrations'
    },
    
    // Tables de jointure
    {
      pattern: /^[a-z]+_[a-z]+_(rel|relation|map|mapping|link)$/i,
      type: TableType.JUNCTION,
      patternType: 'name',
      description: 'Table de jointure identifiée par un suffixe commun'
    },
    {
      pattern: /^rel_/i,
      type: TableType.JUNCTION,
      patternType: 'name',
      description: 'Table de jointure commençant par rel_'
    },
    {
      pattern: /^map_/i,
      type: TableType.JUNCTION,
      patternType: 'name',
      description: 'Table de jointure commençant par map_'
    },
    
    // Tables de métadonnées
    {
      pattern: /^meta_/i,
      type: TableType.METADATA,
      patternType: 'name',
      description: 'Table de métadonnées'
    },
    {
      pattern: /_meta$/i,
      type: TableType.METADATA,
      patternType: 'name',
      description: 'Table de métadonnées'
    },
    {
      pattern: /metadata/i,
      type: TableType.METADATA,
      patternType: 'name',
      description: 'Table de métadonnées'
    },
    
    // Tables de paramètres
    {
      pattern: /^(param|parameter|config|configuration|setting|option)s?$/i,
      type: TableType.CONFIGURATION,
      patternType: 'name',
      description: 'Table de configuration/paramètres'
    },
    {
      pattern: /_config$/i,
      type: TableType.CONFIGURATION,
      patternType: 'name',
      description: 'Table de configuration'
    },
    
    // Tables métier principales (entités fortes)
    {
      pattern: /^(user|customer|client|product|order|invoice|account|employee|partner)s?$/i,
      type: TableType.BUSINESS_CORE,
      patternType: 'name',
      description: 'Table métier principale (entité forte)'
    },
    
    // Tables métier secondaires
    {
      pattern: /^[a-z]+_detail$/i,
      type: TableType.BUSINESS_DETAIL,
      patternType: 'name',
      description: 'Table de détail métier'
    },
    {
      pattern: /_details$/i,
      type: TableType.BUSINESS_DETAIL,
      patternType: 'name',
      description: 'Table de détails métier'
    }
  ];

  // Règles basées sur la structure des tables
  private structureRules: Array<(table: TableInfo) => { match: boolean; type: TableType; description: string }> = [
    // Tables de jointure (2-3 colonnes dont 2 sont des clés étrangères)
    (table) => {
      const columnCount = Object.keys(table.columns).length;
      const foreignKeyCount = table.foreignKeys.length;
      
      if (columnCount <= 4 && foreignKeyCount >= 2) {
        return {
          match: true,
          type: TableType.JUNCTION,
          description: 'Table de jointure identifiée par sa structure (peu de colonnes, plusieurs clés étrangères)'
        };
      }
      return { match: false, type: TableType.UNKNOWN, description: '' };
    },
    
    // Tables techniques (beaucoup de timestamps, log_, etc.)
    (table) => {
      const columns = Object.values(table.columns);
      const timestampColumns = columns.filter(column => 
        column.name.toLowerCase().includes('time') || 
        column.name.toLowerCase().includes('date') ||
        column.type.toUpperCase() === 'TIMESTAMP' ||
        column.type.toUpperCase() === 'DATETIME'
      );
      
      if (timestampColumns.length >= 3) {
        return {
          match: true,
          type: TableType.TECHNICAL,
          description: 'Table technique identifiée par la présence de nombreux champs de date/heure'
        };
      }
      
      return { match: false, type: TableType.UNKNOWN, description: '' };
    },
    
    // Tables métier core (avec beaucoup de relations entrantes)
    (table) => {
      // Cette règle sera complétée par la détection des relations
      return { match: false, type: TableType.UNKNOWN, description: '' };
    }
  ];

  /**
   * Classifie les tables dans le schéma
   */
  classify(schema: MySQLSchema): MySQLSchema {
    // Clone profond du schéma pour éviter de modifier l'original
    const classifiedSchema = JSON.parse(JSON.stringify(schema)) as MySQLSchema;
    
    // Appliquer les règles de classification par nom
    Object.values(classifiedSchema.tables).forEach(table => {
      // Classification initiale basée sur le nom
      this.classifyByName(table);
      
      // Si aucune correspondance trouvée, essayer par la structure
      if (table.tableType === TableType.UNKNOWN) {
        this.classifyByStructure(table);
      }
      
      // Si toujours inconnu, considérer comme métier (par défaut)
      if (table.tableType === TableType.UNKNOWN) {
        table.tableType = TableType.BUSINESS_CORE;
        table.classificationReason = 'Classification par défaut (non catégorisée)';
      }
    });
    
    // Ajuster la classification en fonction des relations entre tables
    this.adjustClassificationBasedOnRelations(classifiedSchema);
    
    return classifiedSchema;
  }

  /**
   * Classifie une table par son nom
   */
  private classifyByName(table: TableInfo): void {
    for (const rule of this.classificationRules) {
      if (rule.patternType !== 'name') continue;
      
      let matches = false;
      
      if (rule.pattern instanceof RegExp) {
        matches = rule.pattern.test(table.name);
      } else {
        matches = table.name.toLowerCase().includes(rule.pattern.toLowerCase());
      }
      
      if (matches) {
        table.tableType = rule.type;
        table.classificationReason = rule.description;
        return;
      }
    }
  }

  /**
   * Classifie une table par sa structure
   */
  private classifyByStructure(table: TableInfo): void {
    for (const rule of this.structureRules) {
      const result = rule(table);
      
      if (result.match) {
        table.tableType = result.type;
        table.classificationReason = result.description;
        return;
      }
    }
  }

  /**
   * Ajuste la classification en fonction des relations entre tables
   */
  private adjustClassificationBasedOnRelations(schema: MySQLSchema): void {
    // Calculer le nombre de relations entrantes pour chaque table
    const incomingRelationsCount: Record<string, number> = {};
    
    // Initialiser le compteur pour chaque table
    Object.keys(schema.tables).forEach(tableName => {
      incomingRelationsCount[tableName] = 0;
    });
    
    // Compter les relations entrantes
    Object.values(schema.tables).forEach(table => {
      table.foreignKeys.forEach(fk => {
        if (incomingRelationsCount[fk.referencedTable] !== undefined) {
          incomingRelationsCount[fk.referencedTable]++;
        }
      });
    });
    
    // Ajuster la classification en fonction du nombre de relations entrantes
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      const incomingCount = incomingRelationsCount[tableName] || 0;
      
      // Si beaucoup de relations entrantes et type encore inconnu ou déjà business
      if (incomingCount >= 3 && 
          (table.tableType === TableType.UNKNOWN || 
           table.tableType === TableType.BUSINESS_CORE ||
           table.tableType === TableType.BUSINESS_DETAIL)) {
        table.tableType = TableType.BUSINESS_CORE;
        table.classificationReason = `Table métier principale identifiée par ${incomingCount} relations entrantes`;
      }
      
      // Si la table a une relation avec une table de métadonnées
      if (table.tableType === TableType.UNKNOWN || table.tableType === TableType.BUSINESS_DETAIL) {
        const hasFkToMetadata = table.foreignKeys.some(fk => {
          const referencedTable = schema.tables[fk.referencedTable];
          return referencedTable && referencedTable.tableType === TableType.METADATA;
        });
        
        if (hasFkToMetadata) {
          table.tableType = TableType.BUSINESS_DETAIL;
          table.classificationReason = 'Table de détail métier identifiée par relation avec table de métadonnées';
        }
      }
    });
  }

  /**
   * Retourne les statistiques de classification
   */
  getClassificationStats(schema: MySQLSchema): Record<TableType, number> {
    const stats: Record<TableType, number> = {
      [TableType.BUSINESS_CORE]: 0,
      [TableType.BUSINESS_DETAIL]: 0,
      [TableType.TECHNICAL]: 0,
      [TableType.JUNCTION]: 0,
      [TableType.METADATA]: 0,
      [TableType.CONFIGURATION]: 0,
      [TableType.UNKNOWN]: 0
    };
    
    Object.values(schema.tables).forEach(table => {
      if (table.tableType in stats) {
        stats[table.tableType]++;
      }
    });
    
    return stats;
  }
}