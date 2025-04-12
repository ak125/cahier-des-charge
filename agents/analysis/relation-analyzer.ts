/**
 * relation-analyzer.ts
 * Agent 3 – Analyse Relationnelle & Cohérence Référentielle
 * 
 * Assure l'intégrité relationnelle de la future base PostgreSQL et identifie 
 * les relations manquantes, floues, cascades dangereuses, et traduit les 
 * polymorphismes SQL en modèles Prisma typés.
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
  comment?: string;
  engine?: string;
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  default?: string | null;
  comment?: string;
}

interface ForeignKey {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

interface Relation {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  on_delete?: string;
  on_update?: string;
  confidence: number;
  is_polymorphic?: boolean;
  polymorphic_type_column?: string;
  warning?: string;
  prisma_relation: PrismaRelation;
}

interface PrismaRelation {
  relation_name: string;
  onDelete?: string;
  relation_type?: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  optional?: boolean;
}

interface PolymorphicCandidate {
  table: string;
  id_column: string;
  type_column: string;
  references: string[];
  warning: string;
  suggestion: string;
}

interface NodeInGraph {
  id: string;
  label: string;
  type: "entity" | "junction" | "technical" | "polymorphic";
  relations_in: number;
  relations_out: number;
  centrality: number;
}

interface EdgeInGraph {
  source: string;
  target: string;
  label?: string;
  type: "direct" | "polymorphic" | "implicit";
  warning?: boolean;
}

interface RelationalGraph {
  nodes: NodeInGraph[];
  edges: EdgeInGraph[];
}

interface AnalysisConfig {
  baseOutputPath: string;
  agents: {
    analyseRelationnelle: {
      enabled: boolean;
      inputFiles: string[];
      outputFiles: string[];
      options: {
        detectImplicitJoins: boolean;
        detectPolymorphism: boolean;
        checkCascadeRisks: boolean;
        generateVisualization: boolean;
      };
    };
  };
}

class RelationAnalyzer {
  private config: AnalysisConfig;
  private tables: Table[] = [];
  private relations: Relation[] = [];
  private polymorphicCandidates: PolymorphicCandidate[] = [];
  private graph: RelationalGraph = { nodes: [], edges: [] };
  private logger: Console;

  constructor(configPath: string, private schemaPath: string, logger = console) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.logger = logger;
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
    
    // Étape 1: Extraire toutes les relations explicites (clés étrangères)
    this.extractExplicitRelations();
    
    // Étape 2: Détecter les relations implicites
    if (this.config.agents.analyseRelationnelle.options.detectImplicitJoins) {
      this.detectImplicitRelations();
    }
    
    // Étape 3: Détecter les polymorphismes
    if (this.config.agents.analyseRelationnelle.options.detectPolymorphism) {
      this.detectPolymorphism();
    }
    
    // Étape 4: Vérifier les risques de cascade
    if (this.config.agents.analyseRelationnelle.options.checkCascadeRisks) {
      this.checkCascadeRisks();
    }
    
    // Étape 5: Construire le graphe relationnel
    this.buildRelationalGraph();
    
    // Étape 6: Calculer les métriques de centralité
    this.calculateCentrality();
    
    // Étape 7: Générer les suggestions Prisma
    this.generatePrismaRecommendations();
    
    // Étape 8: Générer les fichiers de sortie
    await this.generateOutputFiles();
  }

  /**
   * Extrait les relations explicites à partir des clés étrangères
   */
  private extractExplicitRelations(): void {
    for (const table of this.tables) {
      if (!table.foreignKeys || table.foreignKeys.length === 0) continue;
      
      for (const fk of table.foreignKeys) {
        // Trouver la table cible pour obtenir plus d'informations
        const targetTable = this.tables.find(t => t.name === fk.references.table);
        if (!targetTable) {
          this.logger.warn(`Table référencée ${fk.references.table} introuvable pour FK ${table.name}.${fk.column}`);
          continue;
        }
        
        // Créer une relation
        const relation: Relation = {
          from_table: table.name,
          from_column: fk.column,
          to_table: fk.references.table,
          to_column: fk.references.column,
          on_delete: fk.onDelete || 'NO ACTION',
          on_update: fk.onUpdate || 'NO ACTION',
          confidence: 1.0, // Confiance maximale pour les relations explicites
          prisma_relation: {
            relation_name: this.suggestRelationName(table.name, fk.column),
            onDelete: this.mapOnDeleteToPrisma(fk.onDelete)
          }
        };
        
        this.relations.push(relation);
      }
    }
    
    this.logger.info(`Identifié ${this.relations.length} relations explicites`);
  }

  /**
   * Détecte les relations implicites basées sur les conventions de nommage
   */
  private detectImplicitRelations(): void {
    const initialRelationCount = this.relations.length;
    
    // Rechercher des colonnes qui ressemblent à des clés étrangères
    for (const table of this.tables) {
      for (const column of table.columns) {
        // Ignorer les colonnes déjà impliquées dans des FK explicites
        const isAlreadyFK = table.foreignKeys?.some(fk => fk.column === column.name);
        if (isAlreadyFK) continue;
        
        // Vérifier si le nom de la colonne suit une convention _id ou se termine par Id
        if (column.name.endsWith('_id') || 
            column.name.endsWith('Id') || 
            column.name === 'parent_id' || 
            column.name === 'parentId') {
          
          // Déduire le nom de la table potentiellement référencée
          let refTableName: string | null = null;
          
          if (column.name.endsWith('_id')) {
            refTableName = column.name.replace(/_id$/, '').toUpperCase();
          } else if (column.name.endsWith('Id')) {
            refTableName = column.name.replace(/Id$/, '').toUpperCase();
          } else if (column.name === 'parent_id' || column.name === 'parentId') {
            refTableName = table.name; // Potentiellement auto-référence
          }
          
          if (refTableName) {
            // Rechercher la table correspondante
            const targetTable = this.tables.find(t => 
              t.name.toUpperCase() === refTableName || 
              t.name.toUpperCase() === refTableName + 'S'
            );
            
            if (targetTable) {
              // Trouver la colonne id dans la table cible
              const targetIdColumn = targetTable.columns.find(c => 
                c.isPrimary || c.name === 'id' || c.name === 'ID'
              );
              
              if (targetIdColumn) {
                const relation: Relation = {
                  from_table: table.name,
                  from_column: column.name,
                  to_table: targetTable.name,
                  to_column: targetIdColumn.name,
                  confidence: 0.7, // Confiance réduite car implicite
                  warning: 'Relation implicite détectée, non définié comme FK dans le schéma',
                  prisma_relation: {
                    relation_name: this.suggestRelationName(table.name, column.name),
                    onDelete: 'SetNull'
                  }
                };
                
                this.relations.push(relation);
              }
            }
          }
        }
      }
    }
    
    this.logger.info(`Identifié ${this.relations.length - initialRelationCount} relations implicites additionnelles`);
  }

  /**
   * Détecte les polymorphismes dans le schéma
   */
  private detectPolymorphism(): void {
    // Chercher les paires de colonnes {entity_id, entity_type} typiques du polymorphisme
    for (const table of this.tables) {
      // Chercher des colonnes comme entity_id, parent_id, ref_id
      const idColumns = table.columns.filter(col => 
        col.name.endsWith('_id') && 
        !table.foreignKeys?.some(fk => fk.column === col.name)
      );
      
      for (const idColumn of idColumns) {
        // Chercher le type correspondant (entity_type, parent_type, etc.)
        const baseColumnName = idColumn.name.replace(/_id$/, '');
        const typeColumn = table.columns.find(col => 
          col.name === `${baseColumnName}_type` || 
          col.name === `${baseColumnName}Type`
        );
        
        if (typeColumn) {
          // Nous avons probablement trouvé un polymorphisme!
          const polymorphicCandidate: PolymorphicCandidate = {
            table: table.name,
            id_column: idColumn.name,
            type_column: typeColumn.name,
            references: [], // Sera rempli plus tard si possible
            warning: 'Polymorphisme SQL détecté - difficile à modéliser en Prisma',
            suggestion: 'Considérer une restructuration en relations explicites par type'
          };
          
          // Ajouter aux candidats polymorphiques
          this.polymorphicCandidates.push(polymorphicCandidate);
          
          // Créer des relations polymorphiques estimées
          // Nous faisons des suppositions basées sur les conventions
          const possibleReferences = this.getPossiblePolymorphicReferences(baseColumnName);
          
          if (possibleReferences.length > 0) {
            polymorphicCandidate.references = possibleReferences.map(ref => ref.name);
            
            for (const refTable of possibleReferences) {
              // Trouver la colonne id dans la table de référence
              const refIdColumn = refTable.columns.find(c => c.isPrimary || c.name === 'id');
              
              if (refIdColumn) {
                const relation: Relation = {
                  from_table: table.name,
                  from_column: idColumn.name,
                  to_table: refTable.name,
                  to_column: refIdColumn.name,
                  confidence: 0.5, // Confiance basse pour le polymorphisme
                  is_polymorphic: true,
                  polymorphic_type_column: typeColumn.name,
                  warning: 'Relation polymorphique (via type_column) - limitée en Prisma',
                  prisma_relation: {
                    relation_name: `${this.suggestRelationName(table.name, idColumn.name)}On${refTable.name}`,
                    onDelete: 'SetNull',
                    optional: true
                  }
                };
                
                this.relations.push(relation);
              }
            }
          }
        }
      }
    }
    
    this.logger.info(`Détecté ${this.polymorphicCandidates.length} candidats polymorphiques`);
  }

  /**
   * Trouve des tables qui pourraient être référencées par un polymorphisme
   */
  private getPossiblePolymorphicReferences(baseColumnName: string): Table[] {
    // Si baseColumnName = "parent", chercher des tables qui pourraient être "parentes"
    // Si baseColumnName est trop générique (entity, item), chercher toutes les tables principales
    
    if (baseColumnName === 'entity' || baseColumnName === 'item' || baseColumnName === 'ref') {
      // Retourner toutes les tables qui ont une structure d'entité métier
      return this.tables.filter(table => {
        const hasIdColumn = table.columns.some(c => c.isPrimary || c.name === 'id');
        const hasForeignKeys = this.relations.some(r => r.to_table === table.name);
        
        return hasIdColumn && hasForeignKeys;
      });
    } else {
      // Chercher des tables spécifiques qui correspondent au nom de base
      const singularName = baseColumnName.endsWith('s') 
        ? baseColumnName.substring(0, baseColumnName.length - 1) 
        : baseColumnName;
      
      return this.tables.filter(table => {
        const tableName = table.name.toLowerCase();
        const singularBaseName = singularName.toLowerCase();
        
        return tableName === singularBaseName || 
               tableName === singularBaseName + 's' ||
               tableName.includes(singularBaseName);
      });
    }
  }

  /**
   * Vérifie les risques liés aux cascades de suppression
   */
  private checkCascadeRisks(): void {
    for (const relation of this.relations) {
      // Vérifier les cascades à risque
      if (relation.on_delete === 'CASCADE') {
        // Calculer le nombre de tables dépendantes
        const dependentTableCount = this.relations.filter(r => 
          r.to_table === relation.to_table
        ).length;
        
        // Vérifier si cette table est centrale (beaucoup de dépendances)
        if (dependentTableCount > 3) {
          relation.warning = `⚠️ Cascade DELETE risquée: ${relation.to_table} a ${dependentTableCount} tables dépendantes`;
        }
      }
      
      // Vérifier les relations sans gestion explicite de suppression
      if (!relation.on_delete || relation.on_delete === 'NO ACTION' || relation.on_delete === 'RESTRICT') {
        // Vérifier si la colonne source est NOT NULL
        const sourceTable = this.tables.find(t => t.name === relation.from_table);
        const sourceColumn = sourceTable?.columns.find(c => c.name === relation.from_column);
        
        if (sourceColumn && !sourceColumn.nullable) {
          relation.warning = `⚠️ FK ${relation.from_column} NOT NULL sans ON DELETE SET NULL/CASCADE`;
        }
      }
    }
  }

  /**
   * Construit le graphe relationnel
   */
  private buildRelationalGraph(): void {
    // Créer les noeuds (tables)
    for (const table of this.tables) {
      // Déterminer le type de la table
      let nodeType: NodeInGraph['type'] = 'entity';
      
      // Vérifier si c'est une table de jonction (table de liaison)
      const isJunction = this.isJunctionTable(table);
      if (isJunction) {
        nodeType = 'junction';
      }
      
      // Vérifier si c'est une table avec polymorphisme
      const isPolymorphic = this.polymorphicCandidates.some(pc => pc.table === table.name);
      if (isPolymorphic) {
        nodeType = 'polymorphic';
      }
      
      // Ajouter le noeud
      this.graph.nodes.push({
        id: table.name,
        label: table.name,
        type: nodeType,
        relations_in: 0,  // Sera calculé plus tard
        relations_out: 0, // Sera calculé plus tard
        centrality: 0     // Sera calculé plus tard
      });
    }
    
    // Créer les arêtes (relations)
    for (const relation of this.relations) {
      const edgeType = relation.is_polymorphic 
        ? 'polymorphic' 
        : (relation.confidence < 0.8 ? 'implicit' : 'direct');
      
      const edge: EdgeInGraph = {
        source: relation.from_table,
        target: relation.to_table,
        label: `${relation.from_column} → ${relation.to_column}`,
        type: edgeType,
        warning: !!relation.warning
      };
      
      this.graph.edges.push(edge);
      
      // Incrémenter les compteurs de relations entrantes/sortantes
      const sourceNode = this.graph.nodes.find(n => n.id === relation.from_table);
      const targetNode = this.graph.nodes.find(n => n.id === relation.to_table);
      
      if (sourceNode) sourceNode.relations_out++;
      if (targetNode) targetNode.relations_in++;
    }
  }

  /**
   * Vérifie si une table est une table de jonction
   */
  private isJunctionTable(table: Table): boolean {
    // Une table de jonction a typiquement 2+ FK et peu d'autres colonnes
    const fkCount = table.foreignKeys?.length || 0;
    if (fkCount < 2) return false;
    
    // Calculer le pourcentage de colonnes qui sont des FK
    const totalColumns = table.columns.length;
    const fkPercentage = fkCount / totalColumns;
    
    return fkPercentage > 0.5;
  }

  /**
   * Calcule la centralité des tables dans le graphe
   */
  private calculateCentrality(): void {
    // Calculer une forme simple de centralité basée sur le nombre de dépendances
    for (const node of this.graph.nodes) {
      // Centralité = (relations entrantes + relations sortantes) / total des relations
      const totalRelations = this.graph.edges.length || 1; // Éviter division par zéro
      node.centrality = (node.relations_in + node.relations_out) / totalRelations;
    }
    
    // Trier les noeuds par centralité pour faciliter l'identification des tables centrales
    this.graph.nodes.sort((a, b) => b.centrality - a.centrality);
  }

  /**
   * Génère des recommandations Prisma pour chaque relation
   */
  private generatePrismaRecommendations(): void {
    for (const relation of this.relations) {
      // Déterminer le type de relation
      const relationType = this.determinePrismaRelationType(relation);
      relation.prisma_relation.relation_type = relationType;
      
      // Déterminer si la relation est optionnelle
      const fromTable = this.tables.find(t => t.name === relation.from_table);
      const fromColumn = fromTable?.columns.find(c => c.name === relation.from_column);
      relation.prisma_relation.optional = fromColumn?.nullable ?? true;
      
      // Mappages spécifiques à Prisma pour les contraintes d'intégrité
      if (!relation.prisma_relation.onDelete) {
        relation.prisma_relation.onDelete = relation.prisma_relation.optional 
          ? 'SetNull' 
          : 'Cascade';
      }
    }
  }

  /**
   * Détermine le type de relation Prisma
   */
  private determinePrismaRelationType(relation: Relation): PrismaRelation['relation_type'] {
    // Vérifier si la table source pourrait être une table de jonction
    const sourceTable = this.tables.find(t => t.name === relation.from_table);
    const isSourceJunction = sourceTable && this.isJunctionTable(sourceTable);
    
    // Vérifier si la colonne cible est une clé primaire
    const targetTable = this.tables.find(t => t.name === relation.to_table);
    const targetColumn = targetTable?.columns.find(c => c.name === relation.to_column);
    const isTargetPrimaryKey = targetColumn?.isPrimary || targetColumn?.name === 'id';
    
    // Vérifier si d'autres tables pointent vers la même table cible
    const hasMultipleReferencesToTarget = this.relations.filter(r => 
      r.to_table === relation.to_table && 
      r.from_table !== relation.from_table
    ).length > 0;
    
    // Règles de déduction du type de relation
    if (isSourceJunction) {
      return 'many-to-many';
    } else if (isTargetPrimaryKey && hasMultipleReferencesToTarget) {
      return 'many-to-one';
    } else if (isTargetPrimaryKey) {
      // Vérifier si la clé étrangère est unique dans la table source
      const isSourceColumnUnique = sourceTable?.columns.find(c => 
        c.name === relation.from_column
      )?.isPrimary;
      
      return isSourceColumnUnique ? 'one-to-one' : 'many-to-one';
    } else {
      return 'one-to-many';
    }
  }

  /**
   * Suggère un nom pour une relation Prisma
   */
  private suggestRelationName(tableName: string, columnName: string): string {
    // Enlever les suffixes communs
    let relationName = columnName
      .replace(/_id$/, '')
      .replace(/Id$/, '')
      .replace(/ID$/, '');
    
    // Si le nom est vide, utiliser le nom de la table cible
    if (!relationName) {
      const targetTableName = tableName.toLowerCase();
      relationName = targetTableName.endsWith('s') 
        ? targetTableName.substring(0, targetTableName.length - 1) 
        : targetTableName;
    }
    
    // Convertir en camelCase si nécessaire
    if (relationName.includes('_')) {
      relationName = relationName.split('_')
        .map((word, index) => 
          index === 0 
            ? word.toLowerCase() 
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');
    }
    
    return relationName;
  }

  /**
   * Mappe les valeurs MySQL ON DELETE vers la syntaxe Prisma
   */
  private mapOnDeleteToPrisma(onDelete?: string): string {
    if (!onDelete) return 'SetNull';
    
    switch (onDelete.toUpperCase()) {
      case 'CASCADE': return 'Cascade';
      case 'SET NULL': return 'SetNull';
      case 'RESTRICT': return 'Restrict';
      case 'NO ACTION': return 'NoAction';
      default: return 'SetNull';
    }
  }

  /**
   * Génère les fichiers de sortie
   */
  async generateOutputFiles(): Promise<void> {
    const { baseOutputPath } = this.config;
    const outputDir = baseOutputPath || './reports';
    
    // S'assurer que le répertoire de sortie existe
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Ignorer l'erreur si le répertoire existe déjà
    }
    
    // Générer relation_graph.json
    const relationGraphPath = path.join(outputDir, 'relation_graph.json');
    await writeFile(relationGraphPath, JSON.stringify(
      {
        relations: this.relations,
        graph: this.graph
      }, 
      null, 
      2
    ), 'utf8');
    this.logger.info(`Graphe relationnel écrit dans ${relationGraphPath}`);
    
    // Générer relation_audit.md
    const auditPath = path.join(outputDir, 'relation_audit.md');
    const auditContent = this.generateRelationAuditMarkdown();
    await writeFile(auditPath, auditContent, 'utf8');
    this.logger.info(`Audit relationnel écrit dans ${auditPath}`);
    
    // Générer optionnellement polymorphic_candidates.json
    if (this.polymorphicCandidates.length > 0) {
      const polymorphicPath = path.join(outputDir, 'polymorphic_candidates.json');
      await writeFile(polymorphicPath, JSON.stringify(this.polymorphicCandidates, null, 2), 'utf8');
      this.logger.info(`Candidats polymorphiques écrits dans ${polymorphicPath}`);
    }
  }

  /**
   * Génère le rapport d'audit au format Markdown
   */
  private generateRelationAuditMarkdown(): string {
    let markdown = `# 🔗 Analyse Relationnelle & Cohérence Référentielle\n\n`;
    
    // Statistiques générales
    markdown += `## 📊 Statistiques\n\n`;
    markdown += `- Tables analysées: **${this.tables.length}**\n`;
    markdown += `- Relations détectées: **${this.relations.length}**\n`;
    markdown += `- Relations explicites: **${this.relations.filter(r => r.confidence === 1.0).length}**\n`;
    markdown += `- Relations implicites: **${this.relations.filter(r => r.confidence < 1.0 && !r.is_polymorphic).length}**\n`;
    markdown += `- Relations polymorphiques: **${this.relations.filter(r => r.is_polymorphic).length}**\n`;
    markdown += `- Tables avec risques de cascade: **${this.relations.filter(r => r.warning && r.warning.includes('Cascade')).length}**\n\n`;
    
    // Tables centrales
    const centralTables = this.graph.nodes
      .filter(n => n.centrality > 0.1)
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 5);
    
    if (centralTables.length > 0) {
      markdown += `## 🌟 Tables centrales\n\n`;
      for (const table of centralTables) {
        markdown += `- **${table.label}** - Score de centralité: ${table.centrality.toFixed(2)} (${table.relations_in} entrantes, ${table.relations_out} sortantes)\n`;
      }
      markdown += `\n`;
    }
    
    // Relations explicites
    markdown += `## 🔐 Relations explicites\n\n`;
    const explicitRelations = this.relations.filter(r => r.confidence === 1.0);
    
    for (const relation of explicitRelations) {
      markdown += `### ${relation.from_table} → ${relation.to_table}\n\n`;
      markdown += `- Colonne: \`${relation.from_column}\` référence \`${relation.to_table}.${relation.to_column}\`\n`;
      
      if (relation.on_delete) {
        markdown += `- ON DELETE: \`${relation.on_delete}\`\n`;
      }
      
      if (relation.on_update) {
        markdown += `- ON UPDATE: \`${relation.on_update}\`\n`;
      }
      
      if (relation.warning) {
        markdown += `- ⚠️ **Avertissement**: ${relation.warning}\n`;
      }
      
      // Suggestion Prisma
      markdown += `- **Suggestion Prisma**:\n`;
      markdown += `  \`\`\`prisma\n`;
      markdown += `  ${relation.prisma_relation.relation_name}: ${relation.to_table} @relation(fields: [${relation.from_column}], references: [${relation.to_column}]`;
      
      if (relation.prisma_relation.onDelete) {
        markdown += `, onDelete: ${relation.prisma_relation.onDelete}`;
      }
      
      markdown += `)\n`;
      markdown += `  \`\`\`\n\n`;
    }
    
    // Relations implicites
    const implicitRelations = this.relations.filter(r => r.confidence < 1.0 && !r.is_polymorphic);
    if (implicitRelations.length > 0) {
      markdown += `## 🔎 Relations implicites détectées\n\n`;
      markdown += `Ces relations ne sont pas déclarées explicitement comme clés étrangères mais semblent être des relations basées sur les conventions de nommage ou la structure.\n\n`;
      
      for (const relation of implicitRelations) {
        markdown += `### ${relation.from_table} → ${relation.to_table} (confiance: ${relation.confidence.toFixed(2)})\n\n`;
        markdown += `- Colonne: \`${relation.from_column}\` semble référencer \`${relation.to_table}.${relation.to_column}\`\n`;
        
        if (relation.warning) {
          markdown += `- ⚠️ **Avertissement**: ${relation.warning}\n`;
        }
        
        // Suggestion d'amélioration
        markdown += `- **Suggestion**: Ajouter une contrainte de clé étrangère pour renforcer l'intégrité relationnelle\n`;
        markdown += `  \`\`\`sql\n`;
        markdown += `  ALTER TABLE ${relation.from_table} ADD CONSTRAINT fk_${relation.from_table.toLowerCase()}_${relation.from_column}\n`;
        markdown += `  FOREIGN KEY (${relation.from_column}) REFERENCES ${relation.to_table}(${relation.to_column});\n`;
        markdown += `  \`\`\`\n\n`;
        
        // Suggestion Prisma
        markdown += `- **Suggestion Prisma**:\n`;
        markdown += `  \`\`\`prisma\n`;
        markdown += `  ${relation.prisma_relation.relation_name}: ${relation.to_table} @relation(fields: [${relation.from_column}], references: [${relation.to_column}]`;
        
        if (relation.prisma_relation.onDelete) {
          markdown += `, onDelete: ${relation.prisma_relation.onDelete}`;
        }
        
        markdown += `)\n`;
        markdown += `  \`\`\`\n\n`;
      }
    }
    
    // Relations polymorphiques
    if (this.polymorphicCandidates.length > 0) {
      markdown += `## ⚠️ Relations polymorphiques\n\n`;
      markdown += `Les relations polymorphiques sont difficiles à modéliser en Prisma. Voici les candidats détectés et les suggestions de restructuration:\n\n`;
      
      for (const candidate of this.polymorphicCandidates) {
        markdown += `### Table ${candidate.table} - Polymorphisme via ${candidate.type_column}\n\n`;
        markdown += `- ID Column: \`${candidate.id_column}\`\n`;
        markdown += `- Type Column: \`${candidate.type_column}\`\n`;
        
        if (candidate.references.length > 0) {
          markdown += `- Références probables: ${candidate.references.join(', ')}\n`;
        }
        
        markdown += `- **Problème**: ${candidate.warning}\n`;
        markdown += `- **Suggestion**: ${candidate.suggestion}\n\n`;
        
        // Exemple de restructuration
        markdown += `#### Option 1: Relations explicites séparées\n\n`;
        markdown += `\`\`\`prisma\n`;
        for (const refTable of candidate.references) {
          const camelCaseRefTable = refTable.charAt(0).toLowerCase() + refTable.slice(1);
          markdown += `${camelCaseRefTable}: ${refTable}? @relation(fields: [${camelCaseRefTable}Id], references: [id])\n`;
          markdown += `${camelCaseRefTable}Id: Int?\n`;
        }
        markdown += `\`\`\`\n\n`;
        
        markdown += `#### Option 2: Tables de relation séparées\n\n`;
        markdown += `Créer des tables de jonction séparées pour chaque type de relation.\n\n`;
      }
    }
    
    // Risques de cascade
    const cascadeRisks = this.relations.filter(r => r.warning && r.warning.includes('Cascade'));
    if (cascadeRisks.length > 0) {
      markdown += `## 🔥 Risques de cascade\n\n`;
      
      for (const risk of cascadeRisks) {
        markdown += `### ${risk.from_table} → ${risk.to_table}\n\n`;
        markdown += `- **Avertissement**: ${risk.warning}\n`;
        markdown += `- **Impact**: Supprimer des données de \`${risk.to_table}\` pourrait entraîner la suppression en cascade de données dans plusieurs tables dépendantes\n`;
        markdown += `- **Suggestion**: Considérer SET NULL au lieu de CASCADE, ou mettre en place des sauvegardes avant suppression\n\n`;
      }
    }
    
    return markdown;
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
    
    console.log(`🔗 Démarrage de l'Analyse Relationnelle...`);
    console.log(`📁 Configuration: ${configPath}`);
    console.log(`📁 Schéma: ${schemaPath}`);
    
    const analyzer = new RelationAnalyzer(configPath, schemaPath);
    await analyzer.analyze();
    
    console.log(`✅ Analyse relationnelle terminée avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse: ${error}`);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé)
if (require.main === module) {
  main();
}

export { RelationAnalyzer };