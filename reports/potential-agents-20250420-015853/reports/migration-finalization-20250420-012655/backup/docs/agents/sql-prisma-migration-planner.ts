#!/usr/bin/env node
/**
 * sql-prisma-migration-planner.ts
 * 
 * Agent 7 - Planificateur de Migration SQL + Prisma
 * 
 * Orchestrer intelligemment la migration SQL → PostgreSQL → Prisma, avec une vision claire 
 * des tâches à réaliser, des priorités, des dépendances entre tables, et une checklist post-migration exhaustive.
 * 
 * Usage: ts-node sql-prisma-migration-planner.ts [options]
 * 
 * Options:
 *   --schema-raw=<path>         Chemin vers le fichier de schéma brut JSON (default: ./reports/schema_raw.json)
 *   --prisma-schema=<path>      Chemin vers le fichier schema.prisma suggéré (default: ./reports/suggested_schema.prisma)
 *   --php-sql-links=<path>      Chemin vers le fichier de mapping PHP/SQL (default: ./reports/php_sql_links.json)
 *   --output-dir=<path>         Répertoire de sortie (default: ./reports/migration-plan)
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Types
interface SchemaRaw {
  tables: Record<string, TableInfo>;
  views: Record<string, ViewInfo>;
  procedures: Record<string, any>;
  functions: Record<string, any>;
  triggers: Record<string, any>;
  databaseInfo: any;
}

interface TableInfo {
  name: string;
  comment?: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  relations?: RelationInfo[];
  tableType?: 'TABLE' | 'VIEW' | 'JUNCTION' | 'TEMP';
}

interface ViewInfo {
  name: string;
  comment?: string;
  columns: Record<string, ColumnInfo>;
  definition: string;
}

interface ColumnInfo {
  name: string;
  position: number;
  type: string;
  originalType: string;
  suggestedPrismaType?: string;
  nullable: boolean;
  defaultValue?: any;
  comment?: string;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  isImplicitForeignKey?: boolean;
}

interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate: string;
  onDelete: string;
}

interface RelationInfo {
  type: RelationType;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  sourceField?: string;
  targetField?: string;
}

enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

interface PhpSqlLink {
  phpFile: string;
  tables: string[];
  queries: Array<{
    query: string;
    type: string;
    tables: string[];
    line: number;
  }>;
}

interface PrismaModel {
  name: string;
  originalTable: string;
  fields: PrismaField[];
  attributes?: string[];
  comment?: string;
}

interface PrismaField {
  name: string;
  type: string;
  originalColumn: string;
  required: boolean;
  isList: boolean;
  attributes?: string[];
  comment?: string;
}

interface MigrationTask {
  table: string;
  prismaModel: string;
  actions: string[];
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  blocked_by?: string[];
  category?: 'core' | 'reference' | 'junction' | 'business' | 'view';
  critical?: boolean;
  phpDependencies?: string[];
}

interface TableDependency {
  table: string;
  dependsOn: string[];
  usedBy: string[];
  weight: number; // Score calculé pour déterminer la priorité
}

interface DependencyGraph {
  nodes: string[];
  edges: Array<{
    source: string;
    target: string;
    type: 'foreignKey' | 'junction' | 'implicit';
  }>;
}

interface MigrationPlan {
  metadata: {
    version: string;
    createdAt: string;
    totalTables: number;
    totalPrismaModels: number;
    totalTasks: number;
  };
  waves: Array<{
    name: string;
    description: string;
    tables: string[];
    priority: number;
  }>;
  tasks: MigrationTask[];
  dependencyGraph: DependencyGraph;
  checklistItems: Array<{
    category: string;
    items: Array<{
      task: string;
      isManual: boolean;
      isComplete: boolean;
    }>;
  }>;
}

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Planificateur de Migration SQL + Prisma')
  .option('--schema-raw <path>', 'Chemin vers le fichier de schéma brut JSON', './reports/schema_raw.json')
  .option('--prisma-schema <path>', 'Chemin vers le fichier schema.prisma suggéré', './reports/suggested_schema.prisma')
  .option('--php-sql-links <path>', 'Chemin vers le fichier de mapping PHP/SQL', './reports/php_sql_links.json')
  .option('--output-dir <path>', 'Répertoire de sortie', './reports/migration-plan')
  .parse(process.argv);

const options = program.opts();

class SQLPrismaMigrationPlanner implements BaseAgent, BusinessAgent {
  private schemaRaw: SchemaRaw;
  private suggestedPrisma: string;
  private phpSqlLinks: PhpSqlLink[];
  private outputDir: string;
  private prismaModels: PrismaModel[] = [];
  private dependencies: Record<string, TableDependency> = {};
  private migrationTasks: MigrationTask[] = [];
  private dependencyGraph: DependencyGraph = { nodes: [], edges: [] };
  private checklistItems: Array<{
    category: string;
    items: Array<{
      task: string;
      isManual: boolean;
      isComplete: boolean;
    }>;
  }> = [];

  constructor(
    schemaRawPath: string,
    prismaSchemaPath: string,
    phpSqlLinksPath: string,
    outputDir: string
  ) {
    this.outputDir = outputDir;

    // Vérifier et charger le schéma brut
    if (!fs.existsSync(schemaRawPath)) {
      throw new Error(`Le fichier de schéma brut n'existe pas: ${schemaRawPath}`);
    }
    this.schemaRaw = JSON.parse(fs.readFileSync(schemaRawPath, 'utf8'));

    // Vérifier et charger le schéma Prisma suggéré
    if (!fs.existsSync(prismaSchemaPath)) {
      console.warn(`Le fichier schema.prisma n'existe pas: ${prismaSchemaPath}, analyse basée uniquement sur schema_raw.json`);
      this.suggestedPrisma = '';
    } else {
      this.suggestedPrisma = fs.readFileSync(prismaSchemaPath, 'utf8');
    }

    // Vérifier et charger les liens PHP/SQL
    if (!fs.existsSync(phpSqlLinksPath)) {
      console.warn(`Le fichier de mapping PHP/SQL n'existe pas: ${phpSqlLinksPath}, aucune dépendance PHP détectée`);
      this.phpSqlLinks = [];
    } else {
      this.phpSqlLinks = JSON.parse(fs.readFileSync(phpSqlLinksPath, 'utf8'));
    }

    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Exécute le processus complet de planification de migration
   */
  public generateMigrationPlan(): void {
    // Extraire les modèles Prisma du schéma suggéré
    this.extractPrismaModels();

    // Analyser les dépendances entre tables
    this.analyzeTableDependencies();

    // Créer le graphe de dépendances
    this.buildDependencyGraph();

    // Détecter les refactorings critiques
    this.detectCriticalRefactorings();

    // Générer les tâches de migration
    this.generateMigrationTasks();

    // Calculer l'ordre de migration
    this.calculateMigrationWaves();

    // Générer la checklist post-migration
    this.generateChecklist();

    // Générer et enregistrer les fichiers de sortie
    this.saveOutputFiles();
  }

  /**
   * Extrait les modèles Prisma du schéma suggéré
   */
  private extractPrismaModels(): void {
    // Si nous avons un schéma Prisma suggéré, on l'analyse
    if (this.suggestedPrisma) {
      const modelRegex = /model\s+(\w+)\s+{([^}]*)}/g;
      let match;

      while ((match = modelRegex.exec(this.suggestedPrisma)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];

        // Chercher le commentaire qui indique la table d'origine
        const originalTableMatch = modelBody.match(///\s*@map\("([^"]+)"\)/);
        const commentMatch = modelBody.match(///\/\/\s*Mapped from: ([^\n]+)/);
        
        const originalTable = originalTableMatch ? 
          originalTableMatch[1] : 
          commentMatch ? 
            commentMatch[1].trim() : 
            this.findOriginalTable(modelName);

        // Analyser les champs
        const fields: PrismaField[] = [];
        const fieldRegex = /(\w+)\s+(\w+)(\?|\[\])?\s*(?:@([^)]*))?([^\n]*)/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          const isOptional = fieldMatch[3] === '?';
          const isList = fieldMatch[3] === '[]';
          const attributes = fieldMatch[4] ? [fieldMatch[4]] : undefined;
          const comment = fieldMatch[5].trim();
          
          // Chercher le commentaire qui indique la colonne d'origine
          const originalColumnMatch = comment.match(/\/\/\s*Mapped from: ([^\n]+)/);
          const originalColumn = originalColumnMatch ? 
            originalColumnMatch[1].trim() : 
            this.snakeToCamelCase(fieldName);

          fields.push({
            name: fieldName,
            type: fieldType,
            originalColumn,
            required: !isOptional,
            isList,
            attributes,
            comment
          });
        }

        this.prismaModels.push({
          name: modelName,
          originalTable,
          fields
        });
      }
    }

    // Si aucun modèle n'a été extrait du schéma Prisma, on les crée à partir du schéma brut
    if (this.prismaModels.length === 0) {
      for (const [tableName, tableInfo] of Object.entries(this.schemaRaw.tables)) {
        const fields: PrismaField[] = [];

        for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
          fields.push({
            name: this.snakeToCamelCase(columnName),
            type: columnInfo.suggestedPrismaType || 'String',
            originalColumn: columnName,
            required: !columnInfo.nullable,
            isList: false,
            attributes: columnInfo.primaryKey ? ['id'] : undefined
          });
        }

        this.prismaModels.push({
          name: this.snakeToPascalCase(tableName),
          originalTable: tableName,
          fields
        });
      }
    }

    console.log(`Extracted ${this.prismaModels.length} Prisma models`);
  }

  /**
   * Analyse les dépendances entre tables
   */
  private analyzeTableDependencies(): void {
    const tables = Object.keys(this.schemaRaw.tables);
    
    // Initialisation des dépendances pour chaque table
    for (const table of tables) {
      this.dependencies[table] = {
        table,
        dependsOn: [],
        usedBy: [],
        weight: 0
      };
    }

    // Analyse des clés étrangères explicites
    for (const [tableName, tableInfo] of Object.entries(this.schemaRaw.tables)) {
      for (const fk of tableInfo.foreignKeys) {
        const targetTable = fk.referencedTable;
        
        // Ignorer les auto-références
        if (targetTable === tableName) continue;
        
        // Ajouter la dépendance
        if (!this.dependencies[tableName].dependsOn.includes(targetTable)) {
          this.dependencies[tableName].dependsOn.push(targetTable);
        }
        
        // Ajouter l'utilisation inverse
        if (!this.dependencies[targetTable].usedBy.includes(tableName)) {
          this.dependencies[targetTable].usedBy.push(tableName);
        }
      }
    }

    // Détecter les relations implicites (colonnes avec les mêmes noms que les clés primaires)
    for (const [tableName, tableInfo] of Object.entries(this.schemaRaw.tables)) {
      for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
        // Si la colonne est déjà impliquée dans une clé étrangère, on l'ignore
        if (tableInfo.foreignKeys.some(fk => fk.columns.includes(columnName))) continue;
        
        // On cherche une table qui pourrait être référencée implicitement
        if (columnName.endsWith('_id') || columnName.includes('_id_')) {
          const possiblePrefix = columnName.replace(/_id$|_id_/g, '');
          
          // Chercher une table qui pourrait correspondre
          for (const potentialTable of tables) {
            if (potentialTable === tableName) continue; // Ignorer l'auto-référence
            
            const simplifiedTableName = potentialTable.replace(/^tbl_|_table$/g, '').toLowerCase();
            const simplifiedPrefix = possiblePrefix.toLowerCase();
            
            if (simplifiedTableName === simplifiedPrefix || 
                (simplifiedPrefix.length > 3 && simplifiedTableName.includes(simplifiedPrefix))) {
              // Vérifier si la table cible a une clé primaire
              const targetTableInfo = this.schemaRaw.tables[potentialTable];
              const primaryKey = targetTableInfo.primaryKey && targetTableInfo.primaryKey[0];
              
              if (primaryKey) {
                // Marquer comme clé étrangère implicite
                columnInfo.isImplicitForeignKey = true;
                
                // Ajouter la dépendance implicite
                if (!this.dependencies[tableName].dependsOn.includes(potentialTable)) {
                  this.dependencies[tableName].dependsOn.push(potentialTable);
                }
                
                // Ajouter l'utilisation inverse
                if (!this.dependencies[potentialTable].usedBy.includes(tableName)) {
                  this.dependencies[potentialTable].usedBy.push(tableName);
                }
                
                // Ne détecter qu'une seule relation implicite par colonne
                break;
              }
            }
          }
        }
      }
    }

    // Détecter les tables de jonction (N-M)
    for (const [tableName, tableInfo] of Object.entries(this.schemaRaw.tables)) {
      // Une table de jonction typique a:
      // - Peu de colonnes (généralement 2-4)
      // - Au moins 2 clés étrangères
      // - Souvent une clé primaire composée des clés étrangères
      if (
        Object.keys(tableInfo.columns).length <= 5 && 
        tableInfo.foreignKeys.length >= 2 &&
        tableInfo.indexes.some(idx => idx.unique && idx.columns.length >= 2)
      ) {
        // Marquer comme table de jonction
        tableInfo.tableType = 'JUNCTION';
      }
    }

    // Calculer le poids de chaque table
    for (const [tableName, dependency] of Object.entries(this.dependencies)) {
      // Base: nombre de tables qui dépendent de celle-ci
      let weight = dependency.usedBy.length * 2;
      
      // Bonus pour les tables référencées fréquemment
      if (dependency.usedBy.length > 5) weight += 5;
      
      // Pénalité pour les tables avec beaucoup de dépendances
      weight -= dependency.dependsOn.length;
      
      // Les tables sans dépendances sont prioritaires
      if (dependency.dependsOn.length === 0) weight += 10;
      
      // Bonus pour les tables de référence (peu de colonnes, beaucoup d'utilisations)
      const tableInfo = this.schemaRaw.tables[tableName];
      if (
        Object.keys(tableInfo.columns).length < 5 && 
        dependency.usedBy.length > 2
      ) {
        weight += 5;
      }
      
      // Les tables de jonction ont une priorité intermédiaire
      if (tableInfo.tableType === 'JUNCTION') {
        weight = 0; // Réinitialiser le poids
        weight += 5; // Base pour les jonctions
        weight -= dependency.dependsOn.length; // Pénalité pour dépendances
      }
      
      // Les vues ont la priorité la plus basse
      if (tableInfo.tableType === 'VIEW') {
        weight = -10;
      }
      
      dependency.weight = weight;
    }

    console.log(`Analyzed dependencies for ${tables.length} tables`);
  }

  /**
   * Construit le graphe de dépendances
   */
  private buildDependencyGraph(): void {
    const tables = Object.keys(this.schemaRaw.tables);
    
    // Ajouter tous les nœuds
    this.dependencyGraph.nodes = tables;
    
    // Ajouter les arêtes
    for (const [tableName, dependency] of Object.entries(this.dependencies)) {
      for (const target of dependency.dependsOn) {
        // Déterminer le type de relation
        let type: 'foreignKey' | 'junction' | 'implicit' = 'foreignKey';
        
        // Vérifier si c'est une relation implicite
        const tableInfo = this.schemaRaw.tables[tableName];
        const hasFkToTarget = tableInfo.foreignKeys.some(fk => fk.referencedTable === target);
        
        if (!hasFkToTarget) {
          type = 'implicit';
        }
        
        // Si la source est une table de jonction
        if (tableInfo.tableType === 'JUNCTION') {
          type = 'junction';
        }
        
        // Ajouter l'arête
        this.dependencyGraph.edges.push({
          source: tableName,
          target,
          type
        });
      }
    }

    console.log(`Built dependency graph with ${this.dependencyGraph.nodes.length} nodes and ${this.dependencyGraph.edges.length} edges`);
  }

  /**
   * Détecte les refactorings critiques
   */
  private detectCriticalRefactorings(): void {
    const criticalIssues: Record<string, string[]> = {};
    
    // Vérifier chaque table
    for (const [tableName, tableInfo] of Object.entries(this.schemaRaw.tables)) {
      const issues: string[] = [];
      
      // Recherche de relations mal modélisées
      for (const fk of tableInfo.foreignKeys) {
        // Vérifier si les types de colonnes correspondent
        const sourceColumns = fk.columns;
        const targetColumns = fk.referencedColumns;
        const targetTable = this.schemaRaw.tables[fk.referencedTable];
        
        if (targetTable) {
          for (let i = 0; i < sourceColumns.length; i++) {
            const sourceColumn = tableInfo.columns[sourceColumns[i]];
            const targetColumn = targetTable.columns[targetColumns[i]];
            
            if (sourceColumn && targetColumn) {
              if (sourceColumn.type !== targetColumn.type) {
                issues.push(
                  `Type mismatch in foreign key: ${sourceColumns[i]} (${sourceColumn.type}) → ` +
                  `${fk.referencedTable}.${targetColumns[i]} (${targetColumn.type})`
                );
              }
            }
          }
        }
      }
      
      // Recherche de colonnes avec préfixe/suffixe incohérent
      const columnNames = Object.keys(tableInfo.columns);
      const prefixes = new Set<string>();
      
      for (const columnName of columnNames) {
        // Détecter les préfixes courants
        const prefixMatch = columnName.match(/^([a-z]+)_/);
        if (prefixMatch) {
          prefixes.add(prefixMatch[1]);
        }
      }
      
      // Si plusieurs préfixes sont utilisés, c'est une incohérence
      if (prefixes.size > 1) {
        issues.push(`Inconsistent column prefixes: ${Array.from(prefixes).join(', ')}`);
      }
      
      // Recherche de types sous-optimaux
      for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
        // VARCHAR trop grand pour des petites valeurs
        if (
          columnInfo.originalType.startsWith('varchar') && 
          columnInfo.originalType.includes('(') &&
          parseInt(columnInfo.originalType.match(/\((\d+)\)/)[1]) > 255
        ) {
          const size = columnInfo.originalType.match(/\((\d+)\)/)[1];
          issues.push(`Oversized ${columnInfo.originalType} for ${columnName} (${size} chars)`);
        }
        
        // TIMESTAMP sans fuseau horaire
        if (columnInfo.originalType === 'timestamp' && !columnInfo.originalType.includes('with time zone')) {
          issues.push(`Timestamp without timezone for ${columnName}`);
        }
      }
      
      // Si des problèmes ont été trouvés, les enregistrer
      if (issues.length > 0) {
        criticalIssues[tableName] = issues;
      }
    }

    // Stocker les problèmes critiques pour chaque modèle Prisma
    for (const model of this.prismaModels) {
      if (criticalIssues[model.originalTable]) {
        model.criticalIssues = criticalIssues[model.originalTable];
      }
    }

    console.log(`Detected critical issues in ${Object.keys(criticalIssues).length} tables`);
  }

  /**
   * Génère les tâches de migration pour chaque table
   */
  private generateMigrationTasks(): void {
    // Générer une tâche pour chaque modèle Prisma
    for (const model of this.prismaModels) {
      const tableInfo = this.schemaRaw.tables[model.originalTable];
      if (!tableInfo) continue; // Table inconnue, probablement un modèle externe
      
      // Préparer les actions de base
      const actions: string[] = [
        `Créer modèle Prisma ${model.name}`
      ];
      
      // Ajouter des actions spécifiques selon le type de table
      const dependency = this.dependencies[model.originalTable];
      
      // Relations
      if (dependency.dependsOn.length > 0) {
        const relatedModels = dependency.dependsOn.map(tableName => 
          this.findPrismaModelForTable(tableName)?.name || this.snakeToPascalCase(tableName)
        );
        actions.push(`Valider les relations (${relatedModels.join(', ')})`);
      }
      
      // Vérifier les valeurs par défaut
      if (Object.values(tableInfo.columns).some(col => col.defaultValue !== undefined)) {
        actions.push("Vérifier les valeurs par défaut");
      }
      
      // Vérifier les index
      if (tableInfo.indexes.length > 0) {
        actions.push("Appliquer les index et contraintes d'unicité");
      }
      
      // Vérifier le mapping dans le code
      actions.push("Appliquer mapping dans le code NestJS");
      
      // Détermine l'état de la tâche
      let status: 'pending' | 'in_progress' | 'done' | 'blocked' = 'pending';
      let blocked_by: string[] = [];
      
      // Si la table dépend d'autres tables, elle est bloquée par ces dépendances
      if (dependency.dependsOn.length > 0) {
        status = 'blocked';
        
        // Trouver les modèles Prisma correspondants
        blocked_by = dependency.dependsOn.map(tableName => {
          const model = this.findPrismaModelForTable(tableName);
          return model ? model.name : this.snakeToPascalCase(tableName);
        });
      }
      
      // Déterminer la catégorie de la table
      let category: 'core' | 'reference' | 'junction' | 'business' | 'view' = 'business';
      
      if (tableInfo.tableType === 'JUNCTION') {
        category = 'junction';
      } else if (tableInfo.tableType === 'VIEW') {
        category = 'view';
      } else if (
        Object.keys(tableInfo.columns).length < 5 && 
        dependency.usedBy.length > 1
      ) {
        category = 'reference';
      } else if (dependency.usedBy.length > 3) {
        category = 'core';
      }
      
      // Déterminer si la table est critique
      const isCritical = 
        dependency.usedBy.length > 3 || // Utilisée par beaucoup de tables
        (model.criticalIssues && model.criticalIssues.length > 0) || // A des problèmes critiques
        category === 'core'; // Est une table core
      
      // Trouver les dépendances PHP
      const phpDependencies = this.phpSqlLinks
        .filter(link => link.tables.includes(model.originalTable))
        .map(link => link.phpFile);
      
      // Créer la tâche
      this.migrationTasks.push({
        table: model.originalTable,
        prismaModel: model.name,
        actions,
        status,
        blocked_by: blocked_by.length > 0 ? blocked_by : undefined,
        category,
        critical: isCritical,
        phpDependencies: phpDependencies.length > 0 ? phpDependencies : undefined
      });
    }

    console.log(`Generated ${this.migrationTasks.length} migration tasks`);
  }

  /**
   * Calcule l'ordre des vagues de migration
   */
  private calculateMigrationWaves(): void {
    // Trier les tables par poids (priorité)
    const sortedTables = Object.values(this.dependencies)
      .sort((a, b) => b.weight - a.weight)
      .map(d => d.table);
    
    // Créer les vagues de migration
    const waves = [
      {
        name: "Vague 1 - Tables de référence",
        description: "Tables de référence et tables indépendantes. Ces tables n'ont pas ou peu de dépendances.",
        tables: [],
        priority: 1
      },
      {
        name: "Vague 2 - Tables principales",
        description: "Tables principales avec des relations simples. Ces tables forment le cœur du modèle de données.",
        tables: [],
        priority: 2
      },
      {
        name: "Vague 3 - Tables de jonction et relations complexes",
        description: "Tables gérant les relations many-to-many et autres relations complexes.",
        tables: [],
        priority: 3
      },
      {
        name: "Vague 4 - Vues et couche métier",
        description: "Vues, aggrégats et fonctionnalités métier avancées.",
        tables: [],
        priority: 4
      }
    ];
    
    // Répartir les tables dans les vagues
    for (const table of sortedTables) {
      const tableInfo = this.schemaRaw.tables[table];
      const dependency = this.dependencies[table];
      
      if (tableInfo.tableType === 'VIEW') {
        // Les vues vont en vague 4
        waves[3].tables.push(table);
      } else if (tableInfo.tableType === 'JUNCTION') {
        // Les tables de jonction vont en vague 3
        waves[2].tables.push(table);
      } else if (dependency.dependsOn.length === 0) {
        // Les tables sans dépendances vont en vague 1
        waves[0].tables.push(table);
      } else if (dependency.usedBy.length > 3) {
        // Les tables très utilisées vont en vague 1 ou 2 selon leurs dépendances
        const allDependenciesInWave1 = dependency.dependsOn.every(dep => 
          waves[0].tables.includes(dep)
        );
        
        if (allDependenciesInWave1) {
          waves[1].tables.push(table);
        } else {
          waves[2].tables.push(table);
        }
      } else {
        // Les autres tables vont en vague 2 ou 3 selon leurs dépendances
        const hasDependenciesInHigherWaves = dependency.dependsOn.some(dep => 
          !waves[0].tables.includes(dep) && !waves[1].tables.includes(dep)
        );
        
        if (hasDependenciesInHigherWaves) {
          waves[2].tables.push(table);
        } else {
          waves[1].tables.push(table);
        }
      }
    }
    
    // Mettre à jour les tâches avec la vague correspondante
    for (const task of this.migrationTasks) {
      // Trouver dans quelle vague se trouve la table
      let waveIndex = waves.findIndex(wave => wave.tables.includes(task.table));
      
      // Si la table n'est pas dans une vague (ce qui ne devrait pas arriver),
      // la mettre dans la vague 4
      if (waveIndex === -1) waveIndex = 3;
      
      // Mettre à jour la tâche
      task.wave = waveIndex + 1;
    }

    // Stocker les vagues pour la sortie
    this.migrationWaves = waves;

    console.log(`Calculated ${waves.length} migration waves`);
  }

  /**
   * Génère la checklist post-migration
   */
  private generateChecklist(): void {
    this.checklistItems = [
      {
        category: "Préparation",
        items: [
          {
            task: "Sauvegarder la base de données MySQL source",
            isManual: true,
            isComplete: false
          },
          {
            task: "Vérifier que la base de données PostgreSQL cible est vide",
            isManual: true,
            isComplete: false
          },
          {
            task: "Configurer l'accès à la base PostgreSQL dans le schema.prisma",
            isManual: true,
            isComplete: false
          },
          {
            task: "Exécuter prisma format pour formater le schéma Prisma",
            isManual: false,
            isComplete: false
          }
        ]
      },
      {
        category: "Migration du schéma",
        items: [
          {
            task: "Exécuter prisma db push (pour le développement) ou prisma migrate (pour la production)",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier que tous les modèles Prisma sont correctement créés en base",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier que tous les index sont présents",
            isManual: false,
            isComplete: false
          },
          {
            task: "Identifier et résoudre les erreurs de création de schéma",
            isManual: true,
            isComplete: false
          }
        ]
      },
      {
        category: "Migration des données",
        items: [
          {
            task: "Développer les scripts de migration de données pour les tables de référence",
            isManual: true,
            isComplete: false
          },
          {
            task: "Exécuter les scripts de migration pour les tables de référence (Vague 1)",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier l'intégrité des données de référence",
            isManual: false,
            isComplete: false
          },
          {
            task: "Exécuter les scripts de migration pour les tables principales (Vague 2)",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier l'intégrité des données principales",
            isManual: false,
            isComplete: false
          },
          {
            task: "Exécuter les scripts de migration pour les tables de jonction (Vague 3)",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier l'intégrité des relations N-M",
            isManual: false,
            isComplete: false
          },
          {
            task: "Migrer les vues et fonctions (Vague 4)",
            isManual: true,
            isComplete: false
          }
        ]
      },
      {
        category: "Validation des données",
        items: [
          {
            task: "Vérifier que tous les comptages de lignes correspondent entre MySQL et PostgreSQL",
            isManual: false,
            isComplete: false
          },
          {
            task: "Comparer les données critiques entre les deux bases",
            isManual: false,
            isComplete: false
          },
          {
            task: "Valider les relations clés avec des requêtes de test",
            isManual: true,
            isComplete: false
          },
          {
            task: "Tester les performances des requêtes critiques",
            isManual: true,
            isComplete: false
          }
        ]
      },
      {
        category: "Intégration applicative",
        items: [
          {
            task: "Mettre à jour le code applicatif pour utiliser Prisma",
            isManual: true,
            isComplete: false
          },
          {
            task: "Développer et tester les nouvelles API NestJS",
            isManual: true,
            isComplete: false
          },
          {
            task: "Exécuter les tests unitaires et d'intégration",
            isManual: false,
            isComplete: false
          },
          {
            task: "Vérifier la rétrocompatibilité des API existantes",
            isManual: true,
            isComplete: false
          }
        ]
      },
      {
        category: "Production",
        items: [
          {
            task: "Planifier la fenêtre de déploiement",
            isManual: true,
            isComplete: false
          },
          {
            task: "Déployer le schéma Prisma en production",
            isManual: false,
            isComplete: false
          },
          {
            task: "Exécuter les scripts de migration en production",
            isManual: false,
            isComplete: false
          },
          {
            task: "Mettre à jour l'application pour utiliser la nouvelle base",
            isManual: true,
            isComplete: false
          },
          {
            task: "Surveiller les performances et les erreurs post-migration",
            isManual: true,
            isComplete: false
          }
        ]
      }
    ];

    console.log(`Generated checklist with ${this.checklistItems.reduce((sum, cat) => sum + cat.items.length, 0)} items`);
  }

  /**
   * Sauvegarde les fichiers de sortie
   */
  private saveOutputFiles(): void {
    // Créer le plan de migration complet
    const migrationPlan: MigrationPlan = {
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        totalTables: Object.keys(this.schemaRaw.tables).length,
        totalPrismaModels: this.prismaModels.length,
        totalTasks: this.migrationTasks.length
      },
      waves: this.migrationWaves,
      tasks: this.migrationTasks,
      dependencyGraph: this.dependencyGraph,
      checklistItems: this.checklistItems
    };

    // Écrire migration_plan.md
    fs.writeFileSync(
      path.join(this.outputDir, 'migration_plan.md'),
      this.generateMigrationPlanMarkdown(migrationPlan)
    );

    // Écrire prisma_tasks.json
    fs.writeFileSync(
      path.join(this.outputDir, 'prisma_tasks.json'),
      JSON.stringify(this.migrationTasks, null, 2)
    );

    // Écrire table_migration_status.json
    const migrationStatus = this.migrationTasks.reduce((acc, task) => {
      acc[task.table] = {
        prismaModel: task.prismaModel,
        status: task.status,
        wave: task.wave,
        category: task.category,
        critical: task.critical || false
      };
      return acc;
    }, {});

    fs.writeFileSync(
      path.join(this.outputDir, 'table_migration_status.json'),
      JSON.stringify(migrationStatus, null, 2)
    );

    // Écrire migration_dependency_graph.json
    fs.writeFileSync(
      path.join(this.outputDir, 'migration_dependency_graph.json'),
      JSON.stringify(this.dependencyGraph, null, 2)
    );

    // Écrire migration_checklist.md
    fs.writeFileSync(
      path.join(this.outputDir, 'migration_checklist.md'),
      this.generateChecklistMarkdown()
    );

    console.log(`Saved all output files to ${this.outputDir}`);
  }

  /**
   * Génère le fichier markdown du plan de migration
   */
  private generateMigrationPlanMarkdown(plan: MigrationPlan): string {
    const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-dDoDoDoDotgit',
        minute: '2-dDoDoDoDotgit'
      });
    };

    let markdown = `# Plan de Migration SQL → PostgreSQL → Prisma\n\n`;
    markdown += `> Généré le ${formatDate(plan.metadata.createdAt)}\n\n`;
    
    markdown += `## 📊 Résumé\n\n`;
    markdown += `- **Tables analysées**: ${plan.metadata.totalTables}\n`;
    markdown += `- **Modèles Prisma**: ${plan.metadata.totalPrismaModels}\n`;
    markdown += `- **Tâches identifiées**: ${plan.metadata.totalTasks}\n\n`;
    
    markdown += `## 📋 Vagues de migration\n\n`;
    
    for (const wave of plan.waves) {
      markdown += `### ${wave.name}\n\n`;
      markdown += `${wave.description}\n\n`;
      markdown += `**Tables (${wave.tables.length})**: `;
      
      if (wave.tables.length > 0) {
        markdown += wave.tables.map(table => `\`${table}\``).join(', ');
      } else {
        markdown += "Aucune table identifiée pour cette vague";
      }
      
      markdown += `\n\n`;
    }
    
    markdown += `## 🔍 Tables critiques\n\n`;
    
    const criticalTasks = plan.tasks.filter(task => task.critical);
    if (criticalTasks.length > 0) {
      markdown += `| Table | Modèle Prisma | Raison | Dépendances PHP |\n`;
      markdown += `|-------|--------------|--------|----------------|\n`;
      
      for (const task of criticalTasks) {
        markdown += `| \`${task.table}\` | \`${task.prismaModel}\` | ${this.getCriticalReason(task)} | ${task.phpDependencies ? task.phpDependencies.join(', ') : '-'} |\n`;
      }
    } else {
      markdown += `Aucune table critique identifiée.\n`;
    }
    
    markdown += `\n`;
    
    markdown += `## 🗺️ Dépendances entre tables\n\n`;
    
    // Afficher les tables avec le plus de dépendances
    const topDependenciesTables = Object.values(this.dependencies)
      .sort((a, b) => b.dependsOn.length - a.dependsOn.length)
      .slice(0, 10);
    
    if (topDependenciesTables.length > 0) {
      markdown += `### Tables avec le plus de dépendances\n\n`;
      markdown += `| Table | Dépend de | Nombre |\n`;
      markdown += `|-------|-----------|--------|\n`;
      
      for (const dep of topDependenciesTables) {
        if (dep.dependsOn.length > 0) {
          markdown += `| \`${dep.table}\` | ${dep.dependsOn.map(t => `\`${t}\``).join(', ')} | ${dep.dependsOn.length} |\n`;
        }
      }
      
      markdown += `\n`;
    }
    
    // Afficher les tables les plus utilisées
    const mostUsedTables = Object.values(this.dependencies)
      .sort((a, b) => b.usedBy.length - a.usedBy.length)
      .slice(0, 10);
    
    if (mostUsedTables.length > 0) {
      markdown += `### Tables les plus utilisées\n\n`;
      markdown += `| Table | Utilisée par | Nombre |\n`;
      markdown += `|-------|-------------|--------|\n`;
      
      for (const dep of mostUsedTables) {
        if (dep.usedBy.length > 0) {
          markdown += `| \`${dep.table}\` | ${dep.usedBy.map(t => `\`${t}\``).join(', ')} | ${dep.usedBy.length} |\n`;
        }
      }
      
      markdown += `\n`;
    }
    
    markdown += `## 📝 Liste des tâches de migration\n\n`;
    
    // Grouper les tâches par vague
    const tasksByWave = plan.tasks.reduce((acc, task) => {
      const wave = task.wave || 4; // Par défaut vague 4 si non spécifié
      if (!acc[wave]) acc[wave] = [];
      acc[wave].push(task);
      return acc;
    }, {});
    
    for (let wave = 1; wave <= 4; wave++) {
      markdown += `### Vague ${wave}\n\n`;
      
      if (!tasksByWave[wave] || tasksByWave[wave].length === 0) {
        markdown += `Aucune tâche pour cette vague.\n\n`;
        continue;
      }
      
      for (const task of tasksByWave[wave]) {
        markdown += `#### ${task.prismaModel} (\`${task.table}\`)\n\n`;
        
        // Statut
        let statusIcon = '⏳'; // pending
        if (task.status === 'done') statusIcon = '✅';
        else if (task.status === 'in_progress') statusIcon = '🔄';
        else if (task.status === 'blocked') statusIcon = '🔒';
        
        markdown += `**Statut**: ${statusIcon} ${task.status}\n\n`;
        
        if (task.blocked_by) {
          markdown += `**Bloqué par**: ${task.blocked_by.map(model => `\`${model}\``).join(', ')}\n\n`;
        }
        
        // Actions
        markdown += `**Actions**:\n\n`;
        for (const action of task.actions) {
          markdown += `- [ ] ${action}\n`;
        }
        
        // Dépendances PHP
        if (task.phpDependencies && task.phpDependencies.length > 0) {
          markdown += `\n**Fichiers PHP associés**:\n\n`;
          for (const file of task.phpDependencies) {
            markdown += `- \`${file}\`\n`;
          }
        }
        
        markdown += `\n`;
      }
    }
    
    markdown += `## ⚠️ Refactorings critiques\n\n`;
    
    // Identifier les modèles avec des problèmes critiques
    const modelsWithIssues = this.prismaModels.filter(model => model.criticalIssues && model.criticalIssues.length > 0);
    
    if (modelsWithIssues.length > 0) {
      for (const model of modelsWithIssues) {
        markdown += `### ${model.name} (\`${model.originalTable}\`)\n\n`;
        
        for (const issue of model.criticalIssues) {
          markdown += `- ⚠️ ${issue}\n`;
        }
        
        markdown += `\n`;
      }
    } else {
      markdown += `Aucun refactoring critique identifié.\n\n`;
    }

    markdown += `## 📊 Statistiques\n\n`;
    
    // Compter les modèles par catégorie
    const categoryCounts = plan.tasks.reduce((acc, task) => {
      const category = task.category || 'business';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    markdown += `### Répartition des modèles\n\n`;
    markdown += `- 🧠 **Core**: ${categoryCounts.core || 0}\n`;
    markdown += `- 📚 **Reference**: ${categoryCounts.reference || 0}\n`;
    markdown += `- 🔄 **Junction**: ${categoryCounts.junction || 0}\n`;
    markdown += `- 💼 **Business**: ${categoryCounts.business || 0}\n`;
    markdown += `- 👁️ **View**: ${categoryCounts.view || 0}\n\n`;
    
    // Statut des tâches
    const statusCounts = plan.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    markdown += `### Statut des tâches\n\n`;
    markdown += `- ⏳ **En attente**: ${statusCounts.pending || 0}\n`;
    markdown += `- 🔄 **En cours**: ${statusCounts.in_progress || 0}\n`;
    markdown += `- ✅ **Terminées**: ${statusCounts.done || 0}\n`;
    markdown += `- 🔒 **Bloquées**: ${statusCounts.blocked || 0}\n\n`;
    
    return markdown;
  }

  /**
   * Génère le fichier markdown de checklist
   */
  private generateChecklistMarkdown(): string {
    let markdown = `# Checklist de Migration SQL → PostgreSQL → Prisma\n\n`;
    
    markdown += `Cette checklist vous guide à travers les étapes nécessaires pour valider votre migration de MySQL vers PostgreSQL avec Prisma.\n\n`;
    
    for (const category of this.checklistItems) {
      markdown += `## ${category.category}\n\n`;
      
      for (const item of category.items) {
        const manualIcon = item.isManual ? '👤' : '🤖';
        markdown += `- [ ] ${manualIcon} ${item.task}\n`;
      }
      
      markdown += `\n`;
    }
    
    markdown += `## Validation des modèles Prisma\n\n`;
    
    // Ajouter une section pour chaque modèle Prisma
    for (const model of this.prismaModels) {
      markdown += `### ${model.name}\n\n`;
      markdown += `- [ ] Modèle migré correctement\n`;
      markdown += `- [ ] Données importées correctement\n`;
      markdown += `- [ ] Index et contraintes vérifiés\n`;
      
      // Si le modèle a des relations, ajouter des points spécifiques
      const dependancy = this.dependencies[model.originalTable];
      if (dependancy && (dependancy.dependsOn.length > 0 || dependancy.usedBy.length > 0)) {
        markdown += `- [ ] Relations validées\n`;
      }
      
      // Si le modèle a des champs avec des valeurs par défaut
      const hasDefaultValues = model.fields.some(field => field.attributes && field.attributes.some(attr => attr.includes('@default')));
      if (hasDefaultValues) {
        markdown += `- [ ] Valeurs par défaut vérifiées\n`;
      }
      
      markdown += `\n`;
    }
    
    return markdown;
  }

  /**
   * Obtient la raison pour laquelle une tâche est critique
   */
  private getCriticalReason(task: MigrationTask): string {
    if (task.category === 'core') return "Table centrale";
    
    const dependency = this.dependencies[task.table];
    if (dependency && dependency.usedBy.length > 3) {
      return `Utilisée par ${dependency.usedBy.length} tables`;
    }
    
    const model = this.findPrismaModelForTable(task.table);
    if (model && model.criticalIssues && model.criticalIssues.length > 0) {
      return "Problèmes structurels";
    }
    
    if (task.phpDependencies && task.phpDependencies.length > 3) {
      return `Utilisée par ${task.phpDependencies.length} fichiers PHP`;
    }
    
    return "Complexité technique";
  }

  /**
   * Trouve le modèle Prisma correspondant à une table
   */
  private findPrismaModelForTable(tableName: string): PrismaModel | undefined {
    return this.prismaModels.find(model => model.originalTable === tableName);
  }

  /**
   * Trouve la table d'origine pour un modèle Prisma basé sur son nom
   */
  private findOriginalTable(modelName: string): string {
    // Chercher une table dont le nom correspond au modèle
    const tables = Object.keys(this.schemaRaw.tables);
    
    // Cas 1: Le nom du modèle est exactement le même que la table
    const exactMatch = tables.find(t => t.toLowerCase() === modelName.toLowerCase());
    if (exactMatch) return exactMatch;
    
    // Cas 2: Le nom du modèle est la version CamelCase de la table (snake_case)
    const camelMatch = tables.find(t => this.snakeToPascalCase(t) === modelName);
    if (camelMatch) return camelMatch;
    
    // Cas 3: Le nom du modèle est contenu dans le nom de la table
    const containsMatch = tables.find(t => t.toLowerCase().includes(modelName.toLowerCase()));
    if (containsMatch) return containsMatch;
    
    // Si aucune correspondance n'est trouvée, retourner le nom du modèle
    return modelName;
  }

  /**
   * Convertit une chaîne snake_case en camelCase
   */
  private snakeToCamelCase(str: string): string {
    return str.toLowerCase().replace(/([-_][a-z])/g, group =>
      group
        .toUpperCase()
        .replace('-', '')
        .replace('_', '')
    );
  }

  /**
   * Convertit une chaîne snake_case en PascalCase
   */
  private snakeToPascalCase(str: string): string {
    const camel = this.snakeToCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
}

// Fonction principale
async function main() {
  const options = program.opts();
  
  try {
    const planner = new SQLPrismaMigrationPlanner(
      options.schemaRaw,
      options.prismaSchema,
      options.phpSqlLinks,
      options.outputDir
    );
    
    console.log(`Generating migration plan...`);
    planner.generateMigrationPlan();
    console.log(`Migration plan generated successfully!`);
    console.log(`Files saved to ${options.outputDir}:`);
    console.log(`- migration_plan.md`);
    console.log(`- prisma_tasks.json`);
    console.log(`- table_migration_status.json`);
    console.log(`- migration_dependency_graph.json`);
    console.log(`- migration_checklist.md`);
  } catch (error) {
    console.error(`Erreur lors de la génération du plan de migration: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la fonction principale si le script est exécuté directement
if (require.main === module) {
  main();
}

export { SQLPrismaMigrationPlanner };




















import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';


















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































