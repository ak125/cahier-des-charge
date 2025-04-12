/**
 * table-cartographer.ts
 * Agent 2 — Cartographe Sémantique des Tables
 * 
 * Classifie automatiquement toutes les tables SQL extraites selon leur rôle fonctionnel
 * pour comprendre la structure métier, identifier les entités critiques, 
 * distinguer les tables techniques et préparer les modules correspondants en NestJS/Remix.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Types pour les structures de données
interface Table {
  name: string;
  columns: Column[];
  foreignKeys?: ForeignKey[];
  // Métadonnées optionnelles qui pourraient être définies dans schema_raw.json
  comment?: string;
  tags?: string[];
  engine?: string;
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  isForeign?: boolean;
  default?: string | null;
  comment?: string;
}

interface ForeignKey {
  column: string;
  references: {
    table: string;
    column: string;
  };
}

interface TableClassification {
  table: string;
  role: 'entité_métier' | 'liaison' | 'technique' | 'orpheline_suspecte';
  module: string | null;
  confidence: number;
  tags?: string[];
  reasons?: string[];
}

interface EntityRelation {
  source: string;
  target: string;
  junction?: string;
}

interface DomainMapping {
  [tableName: string]: string;
}

interface ConfigPattern {
  pattern: string;
  description?: string;
  category?: string;
}

interface EntityCategoryPattern {
  category: string;
  patterns: string[];
}

interface ContextRule {
  columnPresence: string[];
  suggests: string;
}

interface SemanticMapperConfig {
  enabled: boolean;
  name: string;
  description: string;
  inputFiles: string[];
  outputFiles: string[];
  parameters: {
    detectJunctionTables: boolean;
    identifyDomains: boolean;
    suggestGroupings: boolean;
  };
  skipTables: string[];
  junctionTablePatterns: ConfigPattern[];
  technicalTablePatterns: ConfigPattern[];
  orphanTablePatterns: ConfigPattern[];
  entityPatterns: EntityCategoryPattern[];
  contextRules: ContextRule[];
}

interface Config {
  baseOutputPath: string;
  agents: {
    semanticMapper: SemanticMapperConfig;
  };
  // Autres propriétés du fichier de configuration...
}

class TableCartographer {
  private config: Config;
  private tables: Table[] = [];
  private classifications: TableClassification[] = [];
  private relations: EntityRelation[] = [];
  private domainMap: DomainMapping = {};
  private logger: Console;

  constructor(configPath: string, private schemaPath: string, logger = console) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.logger = logger;

    // Charger le domain_map.json s'il existe (mappings personnalisés)
    try {
      const domainMapPath = path.join(path.dirname(configPath), 'domain_map.json');
      if (fs.existsSync(domainMapPath)) {
        this.domainMap = JSON.parse(fs.readFileSync(domainMapPath, 'utf8'));
        this.logger.info(`Domaine mappings personnalisés chargés depuis ${domainMapPath}`);
      }
    } catch (error) {
      this.logger.warn(`Impossible de charger domain_map.json: ${error}`);
    }
  }

  /**
   * Charge les données du schéma
   */
  async loadSchema(): Promise<void> {
    try {
      const schemaContent = await readFile(this.schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Adaptez cette partie selon la structure réelle de votre schema_raw.json
      if (Array.isArray(schema.tables)) {
        this.tables = schema.tables;
      } else if (schema.tables) {
        // Si c'est un objet avec des noms de table comme clés
        this.tables = Object.keys(schema.tables).map(tableName => {
          return {
            name: tableName,
            ...schema.tables[tableName]
          };
        });
      } else {
        throw new Error('Format du schema_raw.json non reconnu');
      }
      
      this.logger.info(`Chargé ${this.tables.length} tables depuis le schéma`);
    } catch (error) {
      this.logger.error(`Erreur lors du chargement du schéma: ${error}`);
      throw error;
    }
  }

  /**
   * Exécute l'analyse complète
   */
  async analyze(): Promise<void> {
    await this.loadSchema();
    
    // Filtre les tables à ignorer
    const skippedTables = this.config.agents.semanticMapper.skipTables || [];
    this.tables = this.tables.filter(table => !skippedTables.includes(table.name));
    
    // Classifie chaque table
    for (const table of this.tables) {
      const classification = this.classifyTable(table);
      this.classifications.push(classification);
    }
    
    // Identifie les relations entre les tables
    this.identifyRelations();
    
    // Génère les fichiers de sortie
    await this.generateOutputFiles();
  }

  /**
   * Classifie une table selon son rôle
   */
  private classifyTable(table: Table): TableClassification {
    const tableName = table.name;
    const classification: TableClassification = {
      table: tableName,
      role: 'entité_métier', // Par défaut
      module: null,
      confidence: 0.5,
      reasons: []
    };
    
    // 1. Vérifier si c'est une table technique
    if (this.isTechnicalTable(table)) {
      classification.role = 'technique';
      classification.confidence = 0.9;
      classification.reasons?.push('Patterns de table technique détectés');
    }
    // 2. Vérifier si c'est une table de liaison
    else if (this.isJunctionTable(table)) {
      classification.role = 'liaison';
      classification.confidence = 0.85;
      classification.reasons?.push('Structure de table de liaison identifiée');
    }
    // 3. Vérifier si c'est une table orpheline
    else if (this.isOrphanTable(table)) {
      classification.role = 'orpheline_suspecte';
      classification.confidence = 0.7;
      classification.reasons?.push('Table sans relations identifiées');
    }
    
    // Déterminer le module potentiel
    classification.module = this.determineModule(table, classification.role);
    
    // Ajuster la confiance en fonction des règles contextuelles
    classification.confidence = this.adjustConfidence(table, classification);
    
    return classification;
  }

  /**
   * Vérifie si une table est technique selon les patterns configurés
   */
  private isTechnicalTable(table: Table): boolean {
    const { technicalTablePatterns } = this.config.agents.semanticMapper;
    
    for (const pattern of technicalTablePatterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(table.name)) {
        return true;
      }
    }
    
    // Vérifier les caractéristiques communes des tables techniques
    const technicalColumns = ['created_at', 'updated_at', 'logged_at', 'session_id', 'config_key'];
    const hasManyTechnicalColumns = table.columns.filter(col => 
      technicalColumns.includes(col.name.toLowerCase())
    ).length >= 2;
    
    if (hasManyTechnicalColumns) {
      return true;
    }
    
    return false;
  }

  /**
   * Vérifie si une table est une table de liaison
   */
  private isJunctionTable(table: Table): boolean {
    const { junctionTablePatterns } = this.config.agents.semanticMapper;
    
    // Vérifier les patterns de nommage des tables de liaison
    for (const pattern of junctionTablePatterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(table.name)) {
        return true;
      }
    }
    
    // Vérifier la structure classique d'une table de liaison (2 FK, peu de colonnes supplémentaires)
    const fkCount = (table.foreignKeys?.length || 0);
    const nonFkColumns = table.columns.filter(col => 
      !table.foreignKeys?.some(fk => fk.column === col.name)
    );
    
    // Une table de liaison a généralement 2 FKs et peu d'autres colonnes
    if (fkCount >= 2 && nonFkColumns.length <= 3) {
      return true;
    }
    
    return false;
  }

  /**
   * Vérifie si une table est orpheline (sans relations)
   */
  private isOrphanTable(table: Table): boolean {
    const { orphanTablePatterns } = this.config.agents.semanticMapper;
    
    // Vérifier les patterns de nommage des tables orphelines
    for (const pattern of orphanTablePatterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(table.name)) {
        return true;
      }
    }
    
    // Vérifier si la table n'a pas de relations entrantes ou sortantes
    const hasNoForeignKeys = !table.foreignKeys || table.foreignKeys.length === 0;
    const isNotReferencedByOthers = !this.tables.some(t => 
      t.foreignKeys?.some(fk => fk.references.table === table.name)
    );
    
    if (hasNoForeignKeys && isNotReferencedByOthers) {
      return true;
    }
    
    return false;
  }

  /**
   * Détermine le module métier potentiel pour une table
   */
  private determineModule(table: Table, role: string): string | null {
    // 1. Vérifier d'abord s'il y a un mapping personnalisé
    if (this.domainMap[table.name]) {
      return this.domainMap[table.name];
    }
    
    // 2. Pour les tables techniques, pas de module par défaut
    if (role === 'technique') {
      return null;
    }
    
    // 3. Pour les tables de liaison, essayer de déduire du nom
    if (role === 'liaison') {
      const nameSegments = table.name.split(/[_-]/).filter(Boolean);
      if (nameSegments.length >= 2) {
        // Essayer de trouver des modules pour les segments
        for (const segment of nameSegments) {
          const module = this.findModuleByNamePattern(segment);
          if (module) return module;
        }
      }
    }
    
    // 4. Vérifier les patterns d'entités métier
    const { entityPatterns } = this.config.agents.semanticMapper;
    
    for (const entityCategory of entityPatterns) {
      for (const pattern of entityCategory.patterns) {
        if (table.name.toLowerCase().includes(pattern.toLowerCase())) {
          return entityCategory.category.toLowerCase();
        }
      }
    }
    
    // 5. Vérifier les colonnes pour les indices contextuels
    const moduleFromColumns = this.inferModuleFromColumns(table);
    if (moduleFromColumns) {
      return moduleFromColumns;
    }
    
    // Par défaut, utiliser le premier segment du nom en minuscules
    const firstSegment = table.name.split(/[_-]/)[0].toLowerCase();
    return firstSegment !== table.name.toLowerCase() ? firstSegment : null;
  }

  /**
   * Recherche un module en fonction d'un pattern de nom
   */
  private findModuleByNamePattern(segment: string): string | null {
    const { entityPatterns } = this.config.agents.semanticMapper;
    
    for (const entityCategory of entityPatterns) {
      for (const pattern of entityCategory.patterns) {
        if (segment.toLowerCase().includes(pattern.toLowerCase()) || 
            pattern.toLowerCase().includes(segment.toLowerCase())) {
          return entityCategory.category.toLowerCase();
        }
      }
    }
    
    return null;
  }

  /**
   * Déduit un module potentiel à partir des colonnes d'une table
   */
  private inferModuleFromColumns(table: Table): string | null {
    const { contextRules } = this.config.agents.semanticMapper;
    
    for (const rule of contextRules) {
      const columnNames = table.columns.map(col => col.name.toLowerCase());
      const matchCount = rule.columnPresence.filter(col => 
        columnNames.some(colName => colName.includes(col.toLowerCase()))
      ).length;
      
      // Si au moins 60% des colonnes correspondent à la règle
      if (matchCount / rule.columnPresence.length >= 0.6) {
        return rule.suggests.toLowerCase();
      }
    }
    
    return null;
  }

  /**
   * Ajuste le score de confiance en fonction de différents facteurs
   */
  private adjustConfidence(table: Table, classification: TableClassification): number {
    let confidence = classification.confidence;
    
    // Ajuster en fonction du mapping personnalisé
    if (this.domainMap[table.name]) {
      confidence += 0.2; // Plus de confiance si mapping personnalisé
      confidence = Math.min(confidence, 0.99); // Plafonner à 0.99
    }
    
    // Ajuster en fonction de la qualité des données
    if (classification.role === 'entité_métier') {
      // Une entité métier a généralement plusieurs colonnes
      if (table.columns.length > 5) confidence += 0.1;
      
      // Présence d'une colonne ID claire
      const hasIdColumn = table.columns.some(col => col.isPrimary);
      if (hasIdColumn) confidence += 0.05;
      
      // Présence de timestamps (indique une table bien maintenue)
      const hasTimestamps = table.columns.some(col => 
        ['created_at', 'updated_at', 'date_creation', 'date_modification'].includes(col.name)
      );
      if (hasTimestamps) confidence += 0.05;
    }
    
    // Pour les tables de liaison
    if (classification.role === 'liaison') {
      // Plus grande confiance si le nom contient des éléments reconnaissables des deux tables liées
      const nameSuggestionScore = this.evaluateJunctionNameQuality(table);
      confidence += nameSuggestionScore;
    }
    
    // Plafonner entre 0.5 et 0.99
    return Math.max(0.5, Math.min(0.99, confidence));
  }

  /**
   * Évalue la qualité du nom d'une table de liaison
   */
  private evaluateJunctionNameQuality(table: Table): number {
    if (!table.foreignKeys || table.foreignKeys.length < 2) return 0;
    
    // Récupérer les noms des tables référencées
    const referencedTables = table.foreignKeys.map(fk => fk.references.table);
    
    // Voir si des parties de ces noms sont présentes dans le nom de la table de liaison
    let nameQualityScore = 0;
    for (const refTable of referencedTables) {
      // Diviser le nom de la table référencée en segments
      const refSegments = refTable.split(/[_-]/).filter(Boolean).map(s => s.toLowerCase());
      const junctionSegments = table.name.split(/[_-]/).filter(Boolean).map(s => s.toLowerCase());
      
      // Vérifier si des segments de la table référencée apparaissent dans le nom de la table de liaison
      const hasMatchingSegment = refSegments.some(refSeg => 
        junctionSegments.some(juncSeg => juncSeg.includes(refSeg) || refSeg.includes(juncSeg))
      );
      
      if (hasMatchingSegment) {
        nameQualityScore += 0.075;
      }
    }
    
    return nameQualityScore;
  }

  /**
   * Identifie les relations entre les tables
   */
  private identifyRelations(): void {
    // Map pour suivre les relations déjà ajoutées (éviter les doublons)
    const addedRelations = new Set<string>();
    
    // Parcourir toutes les tables
    for (const table of this.tables) {
      // Si la table a des clés étrangères
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        
        // Si c'est une table de liaison
        const isJunction = this.classifications.find(c => 
          c.table === table.name && c.role === 'liaison'
        );
        
        if (isJunction && table.foreignKeys.length >= 2) {
          // Créer une relation pour chaque paire de tables liées
          for (let i = 0; i < table.foreignKeys.length - 1; i++) {
            for (let j = i + 1; j < table.foreignKeys.length; j++) {
              const sourceTable = table.foreignKeys[i].references.table;
              const targetTable = table.foreignKeys[j].references.table;
              
              // Créer un identifiant unique pour cette relation
              const relationId = [sourceTable, targetTable].sort().join('__');
              
              if (!addedRelations.has(relationId)) {
                this.relations.push({
                  source: sourceTable,
                  target: targetTable,
                  junction: table.name
                });
                addedRelations.add(relationId);
              }
            }
          }
        } else {
          // Relation directe
          for (const fk of table.foreignKeys) {
            const sourceTable = table.name;
            const targetTable = fk.references.table;
            
            // Créer un identifiant unique pour cette relation
            const relationId = [sourceTable, targetTable].sort().join('__');
            
            if (!addedRelations.has(relationId)) {
              this.relations.push({
                source: sourceTable,
                target: targetTable
              });
              addedRelations.add(relationId);
            }
          }
        }
      }
    }
    
    this.logger.info(`Identifié ${this.relations.length} relations entre les tables`);
  }

  /**
   * Génère les fichiers de sortie
   */
  private async generateOutputFiles(): Promise<void> {
    const { baseOutputPath } = this.config;
    const outputDir = baseOutputPath || './reports';
    
    // S'assurer que le répertoire de sortie existe
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Ignorer l'erreur si le répertoire existe déjà
    }
    
    // Générer table_classification.json
    const classificationPath = path.join(outputDir, 'table_classification.json');
    await writeFile(classificationPath, JSON.stringify(this.classifications, null, 2), 'utf8');
    this.logger.info(`Classification des tables écrite dans ${classificationPath}`);
    
    // Générer entity_graph.md
    const graphPath = path.join(outputDir, 'entity_graph.md');
    const graphContent = this.generateEntityGraphMarkdown();
    await writeFile(graphPath, graphContent, 'utf8');
    this.logger.info(`Graphe des entités écrit dans ${graphPath}`);
    
    // Générer optionnellement table_tags.json
    const tagsPath = path.join(outputDir, 'table_tags.json');
    const tags = this.generateTableTags();
    await writeFile(tagsPath, JSON.stringify(tags, null, 2), 'utf8');
    this.logger.info(`Tags des tables écrits dans ${tagsPath}`);
  }

  /**
   * Génère le graphe des entités au format Markdown
   */
  private generateEntityGraphMarkdown(): string {
    let markdown = `# 🧠 Cartographie Sémantique des Tables\n\n`;
    
    // Ajouter les entités métier
    markdown += `## 🧩 Entités métier détectées\n\n`;
    const businessEntities = this.classifications.filter(c => c.role === 'entité_métier');
    
    // Grouper par module
    const moduleGroups: Record<string, TableClassification[]> = {};
    for (const entity of businessEntities) {
      const module = entity.module || 'non_catégorisé';
      if (!moduleGroups[module]) {
        moduleGroups[module] = [];
      }
      moduleGroups[module].push(entity);
    }
    
    // Afficher par module
    for (const [module, entities] of Object.entries(moduleGroups)) {
      markdown += `### Module ${module}\n\n`;
      for (const entity of entities) {
        markdown += `- **${entity.table}**\n`;
      }
      markdown += `\n`;
    }
    
    // Ajouter les liaisons
    markdown += `## 🔗 Liaisons détectées\n\n`;
    
    // Liaisons avec tables de jonction
    const junctionRelations = this.relations.filter(r => r.junction);
    if (junctionRelations.length > 0) {
      markdown += `### Via tables de liaison\n\n`;
      for (const relation of junctionRelations) {
        markdown += `- **${relation.source}** <--> **${relation.target}** via *${relation.junction}*\n`;
      }
      markdown += `\n`;
    }
    
    // Liaisons directes
    const directRelations = this.relations.filter(r => !r.junction);
    if (directRelations.length > 0) {
      markdown += `### Liaisons directes\n\n`;
      for (const relation of directRelations) {
        markdown += `- **${relation.source}** --> **${relation.target}**\n`;
      }
      markdown += `\n`;
    }
    
    // Ajouter les tables techniques
    markdown += `## 🛠️ Tables techniques\n\n`;
    const technicalTables = this.classifications.filter(c => c.role === 'technique');
    for (const table of technicalTables) {
      markdown += `- **${table.table}**\n`;
    }
    markdown += `\n`;
    
    // Ajouter les tables orphelines suspectes
    markdown += `## ⚠️ Tables orphelines suspectes\n\n`;
    const orphanTables = this.classifications.filter(c => c.role === 'orpheline_suspecte');
    for (const table of orphanTables) {
      markdown += `- **${table.table}**\n`;
    }
    markdown += `\n`;
    
    // Statistiques
    markdown += `## 📊 Statistiques\n\n`;
    markdown += `- Total des tables: **${this.tables.length}**\n`;
    markdown += `- Entités métier: **${businessEntities.length}**\n`;
    markdown += `- Tables de liaison: **${this.classifications.filter(c => c.role === 'liaison').length}**\n`;
    markdown += `- Tables techniques: **${technicalTables.length}**\n`;
    markdown += `- Tables orphelines: **${orphanTables.length}**\n`;
    markdown += `- Relations identifiées: **${this.relations.length}**\n`;
    
    return markdown;
  }

  /**
   * Génère les tags pour chaque table (pour Supabase ou autre usage)
   */
  private generateTableTags(): Record<string, string[]> {
    const tableTags: Record<string, string[]> = {};
    
    for (const classification of this.classifications) {
      const tags: string[] = [
        `role:${classification.role}`,
      ];
      
      if (classification.module) {
        tags.push(`module:${classification.module}`);
      }
      
      const confidenceTag = this.getConfidenceTag(classification.confidence);
      if (confidenceTag) {
        tags.push(confidenceTag);
      }
      
      // Ajouter tags spécifiques selon le type de table
      if (classification.role === 'entité_métier') {
        tags.push('entity');
      } else if (classification.role === 'liaison') {
        tags.push('junction');
      } else if (classification.role === 'technique') {
        tags.push('technical');
      } else if (classification.role === 'orpheline_suspecte') {
        tags.push('orphan');
        tags.push('needs-review');
      }
      
      tableTags[classification.table] = tags;
    }
    
    return tableTags;
  }

  /**
   * Retourne un tag de confiance basé sur le score
   */
  private getConfidenceTag(confidence: number): string | null {
    if (confidence >= 0.9) return 'confidence:high';
    if (confidence >= 0.7) return 'confidence:medium';
    if (confidence >= 0.5) return 'confidence:low';
    return null;
  }
}

/**
 * Point d'entrée pour l'exécution à partir de la ligne de commande
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const configPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1] || './config/sql_analyzer.config.json';
    const schemaPath = args.find(arg => arg.startsWith('--schema='))?.split('=')[1] || './reports/schema_raw.json';
    
    console.log(`🧠 Démarrage du Cartographe Sémantique des Tables...`);
    console.log(`📁 Configuration: ${configPath}`);
    console.log(`📁 Schéma: ${schemaPath}`);
    
    const cartographer = new TableCartographer(configPath, schemaPath);
    await cartographer.analyze();
    
    console.log(`✅ Analyse terminée avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse: ${error}`);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé)
if (require.main === module) {
  main();
}

export { TableCartographer };