// Agent de Cartographie Sémantique des Tables SQL
// Cet agent analyse et classifie les tables d'une base de données selon leur rôle fonctionnel

import * as fs from 'fs';
import * as path from 'path';

interface SemanticTableDefinition {
  name: string;
  category: string;
  role: string;
  confidence: number;
  relations: string[];
  isJunction: boolean;
  isTechnical: boolean;
  isOrphan: boolean;
  tags: string[];
  metadata: {
    columnCount: number;
    hasPrimaryKey: boolean;
    hasTimestamps: boolean;
    suggestedName?: string;
    contextScore: number;
    relatedDomains: string[];
  };
}

interface SemanticMapResult {
  entityGroups: {
    [key: string]: string[];
  };
  junctionTables: string[];
  technicalTables: {
    [key: string]: string[];
  };
  orphanTables: string[];
  tablesByDomain: {
    [key: string]: string[];
  };
  entityRelationships: {
    [key: string]: string[];
  };
  metadata: {
    mappedTables: number;
    unmappedTables: number;
    analysisCoverage: number;
    identifiedRelationships: number;
    timestamp: string;
  };
  tableDefinitions: {
    [key: string]: SemanticTableDefinition;
  };
}

export class SemanticMapper {
  private schemaData: any;
  private config: any;
  private configPath: string;
  private outputPath: string;

  constructor(schemaFilePath: string, configPath: string, outputPath: string) {
    try {
      this.schemaData = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
    } catch (error) {
      console.error(`Erreur lors de la lecture du schéma: ${error}`);
      throw new Error('Impossible de lire le schéma JSON');
    }

    this.configPath = configPath;
    this.outputPath = outputPath;
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      this.config = configData.agents.semanticMapper;
    } catch (error) {
      console.error(`Erreur lors de la lecture de la configuration: ${error}`);
      throw new Error('Configuration introuvable ou invalide');
    }
  }

  public async analyze(): Promise<SemanticMapResult> {
    console.log('⏳ Démarrage de l\'analyse sémantique des tables...');
    
    const tableNames = this.extractTableNames();
    console.log(`📊 ${tableNames.length} tables trouvées pour l'analyse`);

    // Initialiser le résultat
    const result: SemanticMapResult = {
      entityGroups: {},
      junctionTables: [],
      technicalTables: {},
      orphanTables: [],
      tablesByDomain: {},
      entityRelationships: {},
      metadata: {
        mappedTables: 0,
        unmappedTables: 0,
        analysisCoverage: 0,
        identifiedRelationships: 0,
        timestamp: new Date().toISOString(),
      },
      tableDefinitions: {}
    };

    // Initialiser les groupes d'entités basés sur la configuration
    this.config.entityPatterns.forEach((pattern: any) => {
      result.entityGroups[pattern.category] = [];
    });

    // Initialiser les groupes de tables techniques
    const technicalCategories = Array.from(
      new Set(
        this.config.technicalTablePatterns.map((pattern: any) => pattern.category)
      )
    );
    technicalCategories.forEach((category) => {
      result.technicalTables[category] = [];
    });

    // Classifier chaque table
    for (const tableName of tableNames) {
      if (this.config.skipTables.includes(tableName)) {
        console.log(`⏭️ Table ignorée: ${tableName}`);
        continue;
      }

      const tableDefinition = this.analyzeTable(tableName);
      result.tableDefinitions[tableName] = tableDefinition;

      // Ajouter à la catégorie appropriée
      if (tableDefinition.isJunction) {
        result.junctionTables.push(tableName);
      } else if (tableDefinition.isTechnical) {
        result.technicalTables[tableDefinition.category].push(tableName);
      } else if (tableDefinition.isOrphan) {
        result.orphanTables.push(tableName);
      } else if (tableDefinition.category) {
        if (!result.entityGroups[tableDefinition.category]) {
          result.entityGroups[tableDefinition.category] = [];
        }
        result.entityGroups[tableDefinition.category].push(tableName);
      }

      // Domaines associés
      tableDefinition.metadata.relatedDomains.forEach(domain => {
        if (!result.tablesByDomain[domain]) {
          result.tablesByDomain[domain] = [];
        }
        result.tablesByDomain[domain].push(tableName);
      });

      // Relations
      if (tableDefinition.relations.length > 0) {
        result.entityRelationships[tableName] = tableDefinition.relations;
        result.metadata.identifiedRelationships += tableDefinition.relations.length;
      }
    }

    // Calculer les métadonnées globales
    result.metadata.mappedTables = Object.keys(result.tableDefinitions).length;
    result.metadata.unmappedTables = tableNames.length - result.metadata.mappedTables;
    result.metadata.analysisCoverage = tableNames.length > 0 
      ? result.metadata.mappedTables / tableNames.length 
      : 0;

    console.log('✅ Analyse sémantique des tables terminée');
    return result;
  }

  private extractTableNames(): string[] {
    if (!this.schemaData.tables) {
      return [];
    }
    return Object.keys(this.schemaData.tables);
  }

  private analyzeTable(tableName: string): SemanticTableDefinition {
    console.log(`🔍 Analyse de la table: ${tableName}`);
    
    const table = this.schemaData.tables[tableName];
    const columns = table.columns || {};
    const columnNames = Object.keys(columns);

    // Initialiser la définition de table
    const tableDefinition: SemanticTableDefinition = {
      name: tableName,
      category: '',
      role: '',
      confidence: 0,
      relations: [],
      isJunction: false,
      isTechnical: false,
      isOrphan: false,
      tags: [],
      metadata: {
        columnCount: columnNames.length,
        hasPrimaryKey: this.hasPrimaryKey(table),
        hasTimestamps: this.hasTimestampColumns(columnNames),
        contextScore: 0,
        relatedDomains: []
      }
    };

    // Vérifier si c'est une table de jonction
    this.checkJunctionTable(tableName, tableDefinition);

    // Vérifier si c'est une table technique
    if (!tableDefinition.isJunction) {
      this.checkTechnicalTable(tableName, tableDefinition);
    }

    // Vérifier si c'est une table orpheline
    if (!tableDefinition.isJunction && !tableDefinition.isTechnical) {
      this.checkOrphanTable(tableName, tableDefinition);
    }

    // Identifier la catégorie d'entité
    if (!tableDefinition.isJunction && !tableDefinition.isTechnical && !tableDefinition.isOrphan) {
      this.identifyEntityCategory(tableName, tableDefinition);
    }

    // Analyser le contexte des colonnes
    this.analyzeColumnContext(columnNames, tableDefinition);

    // Identifier les relations avec d'autres tables
    this.identifyRelations(tableName, columnNames, tableDefinition);

    // Générer des tags descriptifs
    this.generateTags(tableDefinition, columnNames);

    return tableDefinition;
  }

  private hasPrimaryKey(table: any): boolean {
    // Vérifier s'il existe une clé primaire dans la table
    if (table.primaryKey && table.primaryKey.columns && table.primaryKey.columns.length > 0) {
      return true;
    }
    
    // Vérifier si une colonne est marquée comme étant une clé primaire
    const columns = table.columns || {};
    for (const columnName in columns) {
      if (columns[columnName].isPrimaryKey) {
        return true;
      }
    }
    
    return false;
  }

  private hasTimestampColumns(columnNames: string[]): boolean {
    const timestampColumns = ['created_at', 'updated_at', 'deleted_at', 'timestamp', 'date_creation', 'date_modification'];
    return columnNames.some(column => timestampColumns.includes(column.toLowerCase()));
  }

  private checkJunctionTable(tableName: string, tableDefinition: SemanticTableDefinition): void {
    // Caractéristiques d'une table de jonction
    // 1. Nom contenant des indicateurs comme "_has_", "_to_", "link", "rel", "map"
    // 2. Nombre limité de colonnes (généralement 2-4)
    // 3. Colonnes principalement des clés étrangères

    const junctionPatterns = this.config.junctionTablePatterns || [];
    const columnNames = Object.keys(this.schemaData.tables[tableName].columns || {});
    const hasForeignKeys = this.countForeignKeyColumns(tableName) >= 2;
    const hasLimitedColumns = columnNames.length <= 5;    
    // Vérification du nom de la table
    const nameMatchesPattern = junctionPatterns.some((pattern: string) => 
      new RegExp(pattern, 'i').test(tableName)
    );
    
    // Vérifier si le nom contient "_has_", "_to_" ou autres indicateurs communs
    const nameIndicatesJunction = /(_has_|_to_|_link|_rel|_map)/.test(tableName);
    
    // Une table est considérée comme table de jonction si elle a des clés étrangères et
    // soit son nom correspond à un motif de jonction, soit elle a un nombre limité de colonnes
    const isJunction = hasForeignKeys && (nameMatchesPattern || nameIndicatesJunction || hasLimitedColumns);
    
    // Calculer le niveau de confiance
    let confidence = 0;
    if (hasForeignKeys) confidence += 0.3;
    if (nameMatchesPattern) confidence += 0.3;
    if (nameIndicatesJunction) confidence += 0.2;
    if (hasLimitedColumns) confidence += 0.2;
    
    // Mettre à jour la définition de la table
    tableDefinition.isJunction = isJunction;
    if (isJunction) {
      tableDefinition.category = 'JUNCTION';
      tableDefinition.role = 'Relation N-N';
      tableDefinition.confidence = Math.min(confidence, 1);
    }
  }

  private countForeignKeyColumns(tableName: string): number {
    const table = this.schemaData.tables[tableName];
    const columns = table.columns || {};
    let fkCount = 0;
    
    for (const columnName in columns) {
      const column = columns[columnName];
      if (column.isForeignKey || columnName.endsWith('_id') || columnName.endsWith('_fk')) {
        fkCount++;
      }
    }
    
    return fkCount;
  }

  private checkTechnicalTable(tableName: string, tableDefinition: SemanticTableDefinition): void {
    const technicalPatterns = this.config.technicalTablePatterns || [];
    
    for (const pattern of technicalPatterns) {
      if (new RegExp(pattern.pattern, 'i').test(tableName)) {
        tableDefinition.isTechnical = true;
        tableDefinition.category = pattern.category || 'technical';
        tableDefinition.role = pattern.role || 'Support technique';
        tableDefinition.confidence = 0.85;
        tableDefinition.tags.push('technique');
        tableDefinition.tags.push(pattern.category.toLowerCase());
        break;
      }
    }
    
    // Vérification supplémentaire pour les tables techniques courantes
    const commonTechnicalPatterns = [
      /^log_/, /^audit_/, /^temp_/, /^bak_/, /^backup_/,
      /^cache/, /^config/, /^setting/, /^param/,
      /^migration/, /^version/, /^sync_/
    ];
    
    if (!tableDefinition.isTechnical) {
      for (const pattern of commonTechnicalPatterns) {
        if (pattern.test(tableName)) {
          tableDefinition.isTechnical = true;
          tableDefinition.category = 'system';
          tableDefinition.role = 'Support système';
          tableDefinition.confidence = 0.75;
          tableDefinition.tags.push('technique');
          tableDefinition.tags.push('système');
          break;
        }
      }
    }
  }

  private checkOrphanTable(tableName: string, tableDefinition: SemanticTableDefinition): void {
    // Une table orpheline n'a pas ou peu de relations avec d'autres tables
    const foreignKeyCount = this.countForeignKeyColumns(tableName);
    const isReferencedByOthers = this.isTableReferencedByOthers(tableName);
    
    // Si la table n'a pas de clés étrangères et n'est pas référencée par d'autres tables
    if (foreignKeyCount === 0 && !isReferencedByOthers) {
      tableDefinition.isOrphan = true;
      tableDefinition.category = 'orphan';
      tableDefinition.role = 'Table isolée';
      tableDefinition.confidence = 0.7;
      tableDefinition.tags.push('orpheline');
    }
  }

  private isTableReferencedByOthers(tableName: string): boolean {
    // Parcourir toutes les tables pour vérifier si elles référencent cette table
    for (const otherTableName in this.schemaData.tables) {
      if (otherTableName === tableName) continue;
      
      const foreignKeys = this.schemaData.tables[otherTableName].foreignKeys || [];
      
      for (const fk of foreignKeys) {
        if (fk.referencedTable === tableName) {
          return true;
        }
      }
    }
    
    return false;
  }

  private identifyEntityCategory(tableName: string, tableDefinition: SemanticTableDefinition): void {
    const entityPatterns = this.config.entityPatterns || [];
    let highestConfidence = 0;
    
    for (const pattern of entityPatterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(tableName)) {
        // Si la confiance est plus élevée, mettre à jour la catégorie
        if (pattern.confidence > highestConfidence) {
          tableDefinition.category = pattern.category;
          tableDefinition.role = pattern.role;
          tableDefinition.confidence = pattern.confidence;
          highestConfidence = pattern.confidence;
        }
      }
    }
    
    // Si aucune catégorie n'est identifiée, essayer de déduire à partir du nom
    if (!tableDefinition.category) {
      // Tables au singulier sont souvent des entités principales
      if (!/s$/.test(tableName)) {
        tableDefinition.category = 'core';
        tableDefinition.role = 'Entité principale';
        tableDefinition.confidence = 0.6;
      } else {
        tableDefinition.category = 'collection';
        tableDefinition.role = 'Collection d\'entités';
        tableDefinition.confidence = 0.5;
      }
    }
    
    // Ajouter la catégorie comme tag
    if (tableDefinition.category && !tableDefinition.tags.includes(tableDefinition.category)) {
      tableDefinition.tags.push(tableDefinition.category.toLowerCase());
    }
  }

  private analyzeColumnContext(columnNames: string[], tableDefinition: SemanticTableDefinition): void {
    const domainKeywords = this.config.domainKeywords || {};
    const columnContextScore: {[domain: string]: number} = {};
    
    // Parcourir chaque colonne et vérifier les mots-clés de domaine
    for (const column of columnNames) {
      for (const domain in domainKeywords) {
        const keywords = domainKeywords[domain];
        for (const keyword of keywords) {
          if (column.toLowerCase().includes(keyword.toLowerCase())) {
            if (!columnContextScore[domain]) {
              columnContextScore[domain] = 0;
            }
            columnContextScore[domain] += 1;
          }
        }
      }
    }
    
    // Déterminer les domaines liés
    const relatedDomains: string[] = [];
    let totalScore = 0;
    
    for (const domain in columnContextScore) {
      totalScore += columnContextScore[domain];
      if (columnContextScore[domain] >= 2) {
        relatedDomains.push(domain);
      }
    }
    
    tableDefinition.metadata.contextScore = totalScore;
    tableDefinition.metadata.relatedDomains = relatedDomains;
    
    // Suggérer un meilleur nom si applicable
    if (relatedDomains.length > 0 && tableDefinition.confidence < 0.7) {
      const mainDomain = relatedDomains[0];
      tableDefinition.metadata.suggestedName = `${mainDomain}_${tableDefinition.name}`;
    }
  }

  private identifyRelations(tableName: string, columnNames: string[], tableDefinition: SemanticTableDefinition): void {
    const relations: string[] = [];
    
    // Analyser les clés étrangères explicites
    const table = this.schemaData.tables[tableName];
    const foreignKeys = table.foreignKeys || [];
    
    for (const fk of foreignKeys) {
      if (fk.referencedTable) {
        relations.push(fk.referencedTable);
      }
    }
    
    // Déduire les relations à partir des noms de colonnes (convention _id)
    for (const column of columnNames) {
      if (column.endsWith('_id') && !column.startsWith('id_') && column !== 'id') {
        const possibleTableName = column.replace('_id', '');
        // Vérifier si cette table existe
        if (this.schemaData.tables[possibleTableName]) {
          if (!relations.includes(possibleTableName)) {
            relations.push(possibleTableName);
          }
        }
        // Pour les cas de pluriel
        const singularTableName = possibleTableName.endsWith('s') 
          ? possibleTableName.slice(0, -1) 
          : possibleTableName;
        if (singularTableName !== possibleTableName && this.schemaData.tables[singularTableName]) {
          if (!relations.includes(singularTableName)) {
            relations.push(singularTableName);
          }
        }
      }
    }
    
    tableDefinition.relations = relations;
  }

  private generateTags(tableDefinition: SemanticTableDefinition, columnNames: string[]): void {
    // Générer des tags en fonction des propriétés identifiées
    
    // Tag pour la taille de la table
    if (columnNames.length > 15) {
      tableDefinition.tags.push('grande-table');
    } else if (columnNames.length < 5) {
      tableDefinition.tags.push('petite-table');
    }
    
    // Tag pour les horodatages
    if (tableDefinition.metadata.hasTimestamps) {
      tableDefinition.tags.push('horodatée');
    }
    
    // Tag pour les relations
    if (tableDefinition.relations.length > 3) {
      tableDefinition.tags.push('très-connectée');
    } else if (tableDefinition.relations.length > 0) {
      tableDefinition.tags.push('connectée');
    }
    
    // Tag pour la clé primaire
    if (tableDefinition.metadata.hasPrimaryKey) {
      tableDefinition.tags.push('identifiée');
    } else {
      tableDefinition.tags.push('sans-identifiant');
    }
    
    // Tags basés sur le rôle fonctionnel
    if (tableDefinition.isJunction) {
      tableDefinition.tags.push('relation-n-n');
    }
    
    // Tags basés sur les domaines associés
    tableDefinition.metadata.relatedDomains.forEach(domain => {
      tableDefinition.tags.push(`domaine-${domain.toLowerCase()}`);
    });
    
    // Tags basés sur le contenu des colonnes
    const booleanColumns = columnNames.filter(col => 
      col.startsWith('is_') || col.startsWith('has_') || 
      col.startsWith('est_') || col.startsWith('a_')
    );
    
    if (booleanColumns.length > 2) {
      tableDefinition.tags.push('états-multiples');
    }
    
    // Détecter les tables de configuration
    const configColumns = columnNames.filter(col => 
      col.includes('config') || col.includes('setting') || 
      col.includes('param') || col.includes('option')
    );
    
    if (configColumns.length > 1) {
      tableDefinition.tags.push('configuration');
    }
    
    // Détecter les tables d'historique
    const historyColumns = columnNames.filter(col => 
      col.includes('history') || col.includes('log') || 
      col.includes('historique') || col.includes('archive') ||
      col.includes('version') || col.includes('revision')
    );
    
    if (historyColumns.length > 0) {
      tableDefinition.tags.push('historique');
    }
    
    // Détecter les tables avec données géographiques
    const geoColumns = columnNames.filter(col => 
      col.includes('lat') || col.includes('lon') || 
      col.includes('coord') || col.includes('geo') ||
      col.includes('pays') || col.includes('region') ||
      col.includes('ville') || col.includes('adresse')
    );
    
    if (geoColumns.length > 0) {
      tableDefinition.tags.push('géographique');
    }
    
    // Détecter les tables avec données temporelles
    const temporalColumns = columnNames.filter(col => 
      col.includes('date') || col.includes('time') || 
      col.includes('duration') || col.includes('période') ||
      col.includes('année') || col.includes('mois') ||
      col.includes('jour') || col.includes('heure')
    );
    
    if (temporalColumns.length > 0) {
      tableDefinition.tags.push('temporelle');
    }
    
    // Détecter les tables avec données financières
    const financialColumns = columnNames.filter(col => 
      col.includes('prix') || col.includes('montant') || 
      col.includes('coût') || col.includes('tarif') ||
      col.includes('budget') || col.includes('finance') ||
      col.includes('payment') || col.includes('transaction')
    );
    
    if (financialColumns.length > 0) {
      tableDefinition.tags.push('financière');
    }
    
    // Éliminer les doublons de tags
    tableDefinition.tags = [...new Set(tableDefinition.tags)];
  }

  public saveResults(results: SemanticMapResult): void {
    console.log('💾 Enregistrement des résultats de l\'analyse sémantique...');

    try {
      // Créer le dossier de sortie s'il n'existe pas
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Ajouter un timestamp au nom du fichier
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
      const outputFile = this.outputPath.replace('.json', `-${timestamp}.json`);

      // Écrire les résultats au format JSON
      fs.writeFileSync(
        outputFile,
        JSON.stringify(results, null, 2),
        'utf8'
      );

      console.log(`✅ Résultats enregistrés dans ${outputFile}`);

      // Générer un rapport de synthèse
      this.generateSummaryReport(results, outputDir, timestamp);
    } catch (error) {
      console.error(`❌ Erreur lors de l'enregistrement des résultats: ${error}`);
      throw new Error('Impossible d\'enregistrer les résultats');
    }
  }

  private generateSummaryReport(results: SemanticMapResult, outputDir: string, timestamp: string): void {
    const reportPath = path.join(outputDir, `rapport-tables-${timestamp}.md`);
    let reportContent = `# Rapport d'Analyse Sémantique des Tables\n\n`;
    reportContent += `Date d'analyse: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    // Statistiques générales
    reportContent += `## Statistiques Générales\n\n`;
    reportContent += `- Tables analysées: ${results.metadata.mappedTables}\n`;
    reportContent += `- Tables non cartographiées: ${results.metadata.unmappedTables}\n`;
    reportContent += `- Couverture de l'analyse: ${(results.metadata.analysisCoverage * 100).toFixed(2)}%\n`;
    reportContent += `- Relations identifiées: ${results.metadata.identifiedRelationships}\n\n`;
    
    // Groupes d'entités
    reportContent += `## Groupes d'Entités\n\n`;
    for (const category in results.entityGroups) {
      const tables = results.entityGroups[category];
      if (tables.length > 0) {
        reportContent += `### ${category} (${tables.length} tables)\n\n`;
        tables.forEach(table => {
          const tableDef = results.tableDefinitions[table];
          reportContent += `- ${table}: ${tableDef.role} (confiance: ${(tableDef.confidence * 100).toFixed(0)}%)\n`;
        });
        reportContent += `\n`;
      }
    }
    
    // Tables de jonction
    if (results.junctionTables.length > 0) {
      reportContent += `## Tables de Jonction (${results.junctionTables.length})\n\n`;
      results.junctionTables.forEach(table => {
        const tableDef = results.tableDefinitions[table];
        reportContent += `- ${table}: Relie ${tableDef.relations.join(' et ')}\n`;
      });
      reportContent += `\n`;
    }
    
    // Tables techniques
    reportContent += `## Tables Techniques\n\n`;
    for (const category in results.technicalTables) {
      const tables = results.technicalTables[category];
      if (tables.length > 0) {
        reportContent += `### ${category} (${tables.length} tables)\n\n`;
        tables.forEach(table => {
          reportContent += `- ${table}\n`;
        });
        reportContent += `\n`;
      }
    }
    
    // Tables orphelines
    if (results.orphanTables.length > 0) {
      reportContent += `## Tables Orphelines (${results.orphanTables.length})\n\n`;
      results.orphanTables.forEach(table => {
        reportContent += `- ${table}\n`;
      });
      reportContent += `\n`;
    }
    
    // Écrire le rapport
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`📋 Rapport de synthèse généré: ${reportPath}`);
  }

  public async generateVisualization(results: SemanticMapResult): Promise<void> {
    console.log('🔍 Génération de visualisations des relations entre tables...');
    
    try {
      const outputDir = path.dirname(this.outputPath);
      const dotFilePath = path.join(outputDir, 'semantic-map.dot');
      
      // Générer un fichier DOT pour Graphviz
      let dotContent = 'digraph SemanticMap {\n';
      dotContent += '  rankdir=LR;\n';
      dotContent += '  node [shape=box, style=filled, fontname="Arial"];\n';
      dotContent += '  edge [fontname="Arial", fontsize=10];\n\n';
      
      // Définir les nœuds avec des couleurs par catégorie
      for (const tableName in results.tableDefinitions) {
        const tableDef = results.tableDefinitions[tableName];
        let color = 'white';
        
        if (tableDef.isJunction) {
          color = 'gold';
        } else if (tableDef.isTechnical) {
          color = 'lightgrey';
        } else if (tableDef.isOrphan) {
          color = 'lightcoral';
        } else {
          // Couleurs par catégorie d'entité
          switch (tableDef.category) {
            case 'core': color = 'lightblue'; break;
            case 'user': color = 'lightgreen'; break;
            case 'business': color = 'lightsalmon'; break;
            case 'content': color = 'plum'; break;
            case 'settings': color = 'lightcyan'; break;
            default: color = 'white';
          }
        }
        
        dotContent += `  "${tableName}" [label="${tableName}\\n(${tableDef.role})", fillcolor="${color}"];\n`;
      }
      
      dotContent += '\n';
      
      // Définir les arêtes pour représenter les relations
      for (const tableName in results.entityRelationships) {
        const relations = results.entityRelationships[tableName];
        
        for (const relatedTable of relations) {
          dotContent += `  "${tableName}" -> "${relatedTable}";\n`;
        }
      }
      
      dotContent += '}\n';
      
      // Écrire le fichier DOT
      fs.writeFileSync(dotFilePath, dotContent, 'utf8');
      console.log(`📊 Fichier de visualisation généré: ${dotFilePath}`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de visualisations: ${error}`);
    }
  }

  // Génération du rapport Markdown
  public generateMarkdownReport(result: SemanticMapResult): string {
    let markdown = `# Rapport de Cartographie Sémantique des Tables SQL\n\n`;
    markdown += `*Date de génération: ${new Date().toLocaleDateString()}*\n\n`;

    // Résumé des catégories
    markdown += `## 📊 Résumé des catégories\n\n`;
    markdown += `| Catégorie | Nombre de tables |\n`;
    markdown += `|-----------|------------------|\n`;
    
    let entityCount = 0;
    for (const category in result.entityGroups) {
      const count = result.entityGroups[category].length;
      entityCount += count;
      markdown += `| ${category} | ${count} |\n`;
    }
    
    let technicalCount = 0;
    for (const category in result.technicalTables) {
      const count = result.technicalTables[category].length;
      technicalCount += count;
    }
    
    markdown += `| JONCTION | ${result.junctionTables.length} |\n`;
    markdown += `| TECHNIQUE | ${technicalCount} |\n`;
    markdown += `| ORPHELINE | ${result.orphanTables.length} |\n`;
    markdown += `| **TOTAL** | **${result.metadata.mappedTables}** |\n\n`;

    // Graphique descriptif (ASCII)
    markdown += `## 📈 Distribution des tables\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `Entités métier  [${this.generateBarChart(entityCount, result.metadata.mappedTables)}] ${entityCount}\n`;
    markdown += `Tables jonction [${this.generateBarChart(result.junctionTables.length, result.metadata.mappedTables)}] ${result.junctionTables.length}\n`;
    markdown += `Tables tech.    [${this.generateBarChart(technicalCount, result.metadata.mappedTables)}] ${technicalCount}\n`;
    markdown += `Tables orphel.  [${this.generateBarChart(result.orphanTables.length, result.metadata.mappedTables)}] ${result.orphanTables.length}\n`;
    markdown += `\`\`\`\n\n`;

    // Tables par catégorie
    markdown += `## 🗂️ Tables par catégorie\n\n`;
    
    for (const category in result.entityGroups) {
      if (result.entityGroups[category].length > 0) {
        markdown += `### ${category} (${result.entityGroups[category].length})\n\n`;
        for (const tableName of result.entityGroups[category]) {
          const table = result.tableDefinitions[tableName];
          markdown += `- **${tableName}** `;
          if (table.tags.length > 0) {
            markdown += `[${table.tags.join(', ')}] `;
          }
          if (table.relations.length > 0) {
            markdown += `→ Relié à: ${table.relations.join(', ')}`;
          }
          markdown += `\n`;
        }
        markdown += `\n`;
      }
    }

    // Tables de jonction
    if (result.junctionTables.length > 0) {
      markdown += `### ⚡ Tables de jonction (${result.junctionTables.length})\n\n`;
      for (const tableName of result.junctionTables) {
        const table = result.tableDefinitions[tableName];
        markdown += `- **${tableName}** → Relie: ${table.relations.join(' et ')}\n`;
      }
      markdown += `\n`;
    }

    // Tables techniques
    let totalTechTables = 0;
    for (const category in result.technicalTables) {
      totalTechTables += result.technicalTables[category].length;
    }
    
    if (totalTechTables > 0) {
      markdown += `### 🔧 Tables techniques (${totalTechTables})\n\n`;
      for (const category in result.technicalTables) {
        if (result.technicalTables[category].length > 0) {
          markdown += `#### ${category} (${result.technicalTables[category].length})\n\n`;
          for (const tableName of result.technicalTables[category]) {
            markdown += `- **${tableName}**\n`;
          }
          markdown += `\n`;
        }
      }
    }

    // Tables orphelines
    if (result.orphanTables.length > 0) {
      markdown += `### ⚠️ Tables orphelines (${result.orphanTables.length})\n\n`;
      for (const tableName of result.orphanTables) {
        const table = result.tableDefinitions[tableName];
        markdown += `- **${tableName}**`;
        if (table.metadata.suggestedName) {
          markdown += ` → Nom suggéré: \`${table.metadata.suggestedName}\``;
        }
        markdown += `\n`;
      }
      markdown += `\n`;
    }

    // Tables par domaine contextuel
    markdown += `## 🌐 Tables par domaine contextuel\n\n`;
    for (const domain in result.tablesByDomain) {
      markdown += `### ${domain} (${result.tablesByDomain[domain].length})\n\n`;
      for (const tableName of result.tablesByDomain[domain]) {
        markdown += `- **${tableName}**\n`;
      }
      markdown += `\n`;
    }

    // Métadonnées
    markdown += `## 📝 Métadonnées d'analyse\n\n`;
    markdown += `- Tables analysées: ${result.metadata.mappedTables}\n`;
    markdown += `- Couverture: ${(result.metadata.analysisCoverage * 100).toFixed(1)}%\n`;
    markdown += `- Relations identifiées: ${result.metadata.identifiedRelationships}\n`;
    markdown += `- Date d'analyse: ${result.metadata.timestamp}\n`;

    return markdown;
  }

  private generateBarChart(value: number, total: number, width: number = 20): string {
    if (total === 0) return '';
    
    const filledChars = Math.round((value / total) * width);
    return '#'.repeat(filledChars) + ' '.repeat(Math.max(0, width - filledChars));
  }

  // Sauvegarde des résultats
  public saveResults(result: SemanticMapResult): void {
    // Sauvegarder le fichier JSON
    const jsonOutputPath = path.join(this.outputPath, 'table_classification.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2));
    console.log(`✅ Résultats JSON sauvegardés dans: ${jsonOutputPath}`);

    // Sauvegarder le rapport Markdown
    const markdownReport = this.generateMarkdownReport(result);
    const mdOutputPath = path.join(this.outputPath, 'entity_graph.md');
    fs.writeFileSync(mdOutputPath, markdownReport);
    console.log(`✅ Rapport Markdown sauvegardé dans: ${mdOutputPath}`);
  }
}

// Point d'entrée du script si exécuté directement
if (require.main === module) {
  if (process.argv.length < 5) {
    console.error('Usage: ts-node semantic-table-mapper.ts <schema-json-path> <config-path> <output-path>');
    process.exit(1);
  }
  
  const schemaFilePath = process.argv[2];
  const configPath = process.argv[3];
  const outputPath = process.argv[4];
  
  const mapper = new SemanticMapper(schemaFilePath, configPath, outputPath);
  
  mapper.analyze()
    .then(result => {
      mapper.saveResults(result);
      console.log('✅ Analyse et génération des rapports terminées avec succès');
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error}`);
      process.exit(1);
    });
}