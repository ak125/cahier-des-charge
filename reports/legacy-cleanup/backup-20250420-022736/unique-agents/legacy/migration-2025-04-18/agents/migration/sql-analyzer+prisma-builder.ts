#!/usr/bin/env node
/**
 * sql-analyzer+prisma-builder.ts
 *
 * Outil complet d'analyse SQL et de génération de modèles Prisma
 *
 * Ce script analyse une base de données MySQL, génère un rapport d'audit complet
 * et prépare tous les fichiers nécessaires à la migration vers Prisma/PostgreSQL.
 *
 * Usage: ts-node sql-analyzer+prisma-builder.ts [options]
 *
 * Options:
 *   --connection=<url>      URL de connexion à la base de données MySQL (ou variable d'env DATABASE_URL)
 *   --database=<nom>        Nom de la base de données à analyser
 *   --output-dir=<dossier>  Dossier de sortie (défaut: ./reports/sql-audit-{timestamp})
 *   --schema-only=<bool>    Analyser uniquement la structure, sans les données (défaut: true)
 *   --generate-prisma=<bool> Générer les modèles Prisma (défaut: true)
 *   --analyze-performance=<bool> Inclure l'analyse de performance et suggestions d'index (défaut: true)
 *   --include-tables=<liste> Liste des tables à inclure (séparées par des virgules)
 *   --exclude-tables=<liste> Liste des tables à exclure (séparées par des virgules)
 *
 * Fichiers générés:
 *   - mysql_schema_map.json : Carte détaillée des tables et colonnes
 *   - sql_analysis.md : Rapport d'audit technique des problèmes SQL
 *   - prisma_models.suggestion.prisma : Modèles Prisma proposés
 *   - schema_migration_diff.json : Différences entre MySQL et le schéma Prisma proposé
 *   - migration_plan.md : Liste des actions à réaliser pour la migration
 *   - entity_graph.json : Graphe des relations entre entités
 *   - sql_index_suggestions.sql : Suggestions d'index pour optimisation
 *   - sql_backlog.json : Liste priorisée des tâches techniques SQL
 *
 * Date: 12 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { program } from 'commander';
import mysql from 'mysql2/promise';

import { DebtAnalyzer } from '../analysis/core/DebtAnalyzer';
import { PrismaGenerator } from '../analysis/core/PrismaGenerator';
import { RelationAnalyzer } from '../analysis/core/RelationAnalyzer';
import { SchemaAnalyzer } from '../analysis/core/SchemaAnalyzer';
import { TypeConverter } from '../analysis/core/TypeConverter';
import { BacklogGenerator } from '../analysis/core/backlog-generator';
import { EntityGraphBuilder } from '../analysis/core/entity-graph-builder';
import { IndexOptimizer } from '../analysis/core/index-optimizer';
import { MigrationPlanGenerator } from '../analysis/core/migration-plan-generator';
// Importation des composants d'analyse
import { SQLParser } from '../analysis/core/parser';
import { PerformanceAnalyzer } from '../analysis/core/performance-analyzer';
import { SchemaExtractor } from '../analysis/core/schema-extractor';
import { TableAnalyzer } from '../analysis/core/table-analyzer';

// Interfaces et modèles
import {
  BacklogItem,
  ColumnInfo,
  DebtIssue,
  EntityGraph,
  IndexInfo,
  IndexSuggestion,
  MigrationTask,
  MySQLSchema,
  PrismaMapping,
  RelationInfo,
  SchemaStats,
  TableInfo,
} from '../analysis/models/schema';

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description("Outil complet d'analyse SQL et de génération de modèles Prisma")
  .option('--connection <url>', 'URL de connexion à la base de données MySQL')
  .option('--database <name>', 'Nom de la base de données à analyser')
  .option(
    '--output-dir <dir>',
    'Dossier de sortie',
    `./reports/sql-audit-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}`
  )
  .option('--schema-only <bool>', 'Analyser uniquement la structure, sans les données', true)
  .option('--generate-prisma <bool>', 'Générer les modèles Prisma', true)
  .option('--analyze-performance <bool>', "Inclure l'analyse de performance", true)
  .option('--include-tables <list>', 'Liste des tables à inclure (séparées par des virgules)')
  .option('--exclude-tables <list>', 'Liste des tables à exclure (séparées par des virgules)')
  .parse(process.argv);

const options = program.opts();

// Extraction des options
const connectionString = options.connection || process.env.DATABASE_URL;
const databaseName = options.database;
const outputDir = path.resolve(options.outputDir);
const schemaOnly = options.schemaOnly === 'true' || options.schemaOnly === true;
const generatePrisma = options.generatePrisma === 'true' || options.generatePrisma === true;
const analyzePerformance =
  options.analyzePerformance === 'true' || options.analyzePerformance === true;
const includeTables = options.includeTables ? options.includeTables.split(',') : [];
const excludeTables = options.excludeTables
  ? options.excludeTables.split(',')
  : ['migrations', 'schema_migrations', 'ar_internal_metadata'];

/**
 * Fonction principale d'exécution
 */
async function main() {
  try {
    // Vérifier les paramètres obligatoires
    if (!connectionString) {
      console.error(chalk.red('❌ Erreur: URL de connexion à la base de données non spécifiée'));
      console.error(
        chalk.yellow(
          "Utilisez --connection=<url> ou définissez la variable d'environnement DATABASE_URL"
        )
      );
      process.exit(1);
    }

    if (!databaseName) {
      console.error(chalk.red('❌ Erreur: Nom de la base de données non spécifié'));
      console.error(chalk.yellow('Utilisez --database=<nom>'));
      process.exit(1);
    }

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(chalk.blue("🚀 Démarrage de l'analyse SQL et de la génération Prisma"));
    console.log(chalk.blue(`📊 Base de données: ${databaseName}`));
    console.log(chalk.blue(`📁 Dossier de sortie: ${outputDir}`));

    // Connexion à la base de données
    console.log(chalk.blue('🔌 Connexion à la base de données...'));
    const connection = await mysql.createConnection(connectionString);

    try {
      // Extraction du schéma
      console.log(chalk.blue('1️⃣ Extraction du schéma de la base de données...'));
      const schemaExtractor = new SchemaExtractor(includeTables, excludeTables);
      const schema = await schemaExtractor.extract(connection, databaseName);

      // Analyse des tables et colonnes
      console.log(chalk.blue('2️⃣ Analyse des tables et colonnes...'));
      const tableAnalyzer = new TableAnalyzer();
      const analyzedSchema = tableAnalyzer.analyze(schema);

      // Analyse des relations
      console.log(chalk.blue('3️⃣ Détection et analyse des relations...'));
      const relationAnalyzer = new RelationAnalyzer();
      const schemaWithRelations = await relationAnalyzer.analyze(
        analyzedSchema,
        connection,
        databaseName
      );

      // Conversion des types pour Prisma/PostgreSQL
      console.log(chalk.blue('4️⃣ Conversion des types MySQL → PostgreSQL/Prisma...'));
      const typeConverter = new TypeConverter();
      const convertedSchema = typeConverter.convert(schemaWithRelations);

      // Analyse de la dette technique SQL
      console.log(chalk.blue('5️⃣ Analyse de la dette technique SQL...'));
      const debtAnalyzer = new DebtAnalyzer();
      const { schema: analyzedSchemaWithDebt, issues: debtIssues } =
        await debtAnalyzer.analyze(convertedSchema);

      // Analyse des performances et suggestions d'index
      let performanceResults = { indexSuggestions: [] as IndexSuggestion[] };
      if (analyzePerformance) {
        console.log(chalk.blue("6️⃣ Analyse des performances et suggestions d'index..."));
        const performanceAnalyzer = new PerformanceAnalyzer();
        performanceResults = await performanceAnalyzer.analyze(
          connection,
          databaseName,
          analyzedSchemaWithDebt
        );
      }

      // Génération du schéma Prisma
      let prismaSchema = '';
      let migrationDiff = {};
      if (generatePrisma) {
        console.log(chalk.blue('7️⃣ Génération du schéma Prisma...'));
        const prismaGenerator = new PrismaGenerator();
        prismaSchema = prismaGenerator.generate(analyzedSchemaWithDebt);

        // Génération des différences de migration
        console.log(chalk.blue('8️⃣ Génération du plan de différences pour la migration...'));
        const migrationPlanGenerator = new MigrationPlanGenerator();
        migrationDiff = migrationPlanGenerator.generateDiff(analyzedSchemaWithDebt, prismaSchema);
      }

      // Génération du graphe d'entités
      console.log(chalk.blue("9️⃣ Génération du graphe d'entités..."));
      const entityGraphBuilder = new EntityGraphBuilder();
      const entityGraph = entityGraphBuilder.build(analyzedSchemaWithDebt);

      // Génération du backlog technique
      console.log(chalk.blue('🔟 Génération du backlog technique SQL...'));
      const backlogGenerator = new BacklogGenerator();
      const backlog = backlogGenerator.generate(debtIssues, performanceResults.indexSuggestions);

      // Calcul des statistiques générales
      console.log(chalk.blue('📊 Calcul des statistiques...'));
      const schemaAnalyzer = new SchemaAnalyzer();
      const stats = schemaAnalyzer.generateStats(analyzedSchemaWithDebt);

      // Génération des fichiers de sortie
      console.log(chalk.blue('💾 Génération des fichiers de sortie...'));

      // 1. mysql_schema_map.json
      saveToJson(path.join(outputDir, 'mysql_schema_map.json'), {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        databaseInfo: {
          name: databaseName,
          engine: 'MySQL',
          version: await getDatabaseVersion(connection),
          charset: await getDatabaseCharset(connection, databaseName),
          collation: await getDatabaseCollation(connection, databaseName),
        },
        tables: analyzedSchemaWithDebt.tables,
        relationships: analyzedSchemaWithDebt.relationships,
        analyses: {
          dataTypes: {
            inconsistencies: debtIssues.filter((issue) => issue.type === 'DATA_TYPE_INCONSISTENCY'),
            optimizationPotential: debtIssues.filter(
              (issue) => issue.type === 'DATA_TYPE_OPTIMIZATION'
            ),
          },
          indexes: {
            missing: performanceResults.indexSuggestions.filter(
              (suggestion) => suggestion.type === 'MISSING'
            ),
            redundant: performanceResults.indexSuggestions.filter(
              (suggestion) => suggestion.type === 'REDUNDANT'
            ),
          },
          constraints: {
            missing: debtIssues.filter((issue) => issue.type === 'MISSING_CONSTRAINT'),
          },
          namingConventions: {
            comment: analyzedSchemaWithDebt.namingConvention || 'Mixte',
            recommendation:
              'Utiliser @map dans Prisma pour supporter snake_case en base de données et camelCase en code',
          },
        },
        stats,
      });
      console.log(chalk.green('✅ mysql_schema_map.json généré'));

      // 2. sql_analysis.md
      const sqlAnalysisMd = generateSqlAnalysisMarkdown(analyzedSchemaWithDebt, debtIssues, stats);
      saveToMarkdown(path.join(outputDir, 'sql_analysis.md'), sqlAnalysisMd);
      console.log(chalk.green('✅ sql_analysis.md généré'));

      // 3. prisma_models.suggestion.prisma
      if (generatePrisma) {
        fs.writeFileSync(path.join(outputDir, 'prisma_models.suggestion.prisma'), prismaSchema);
        console.log(chalk.green('✅ prisma_models.suggestion.prisma généré'));
      }

      // 4. schema_migration_diff.json
      if (generatePrisma) {
        saveToJson(path.join(outputDir, 'schema_migration_diff.json'), migrationDiff);
        console.log(chalk.green('✅ schema_migration_diff.json généré'));
      }

      // 5. migration_plan.md
      if (generatePrisma) {
        const migrationPlanMd = generateMigrationPlanMarkdown(
          migrationDiff,
          analyzedSchemaWithDebt
        );
        saveToMarkdown(path.join(outputDir, 'migration_plan.md'), migrationPlanMd);
        console.log(chalk.green('✅ migration_plan.md généré'));
      }

      // 6. entity_graph.json
      saveToJson(path.join(outputDir, 'entity_graph.json'), entityGraph);
      console.log(chalk.green('✅ entity_graph.json généré'));

      // 7. sql_index_suggestions.sql
      if (analyzePerformance) {
        const indexSuggestionsSql = generateIndexSuggestionsSQL(
          performanceResults.indexSuggestions
        );
        fs.writeFileSync(path.join(outputDir, 'sql_index_suggestions.sql'), indexSuggestionsSql);
        console.log(chalk.green('✅ sql_index_suggestions.sql généré'));
      }

      // 8. sql_backlog.json
      saveToJson(path.join(outputDir, 'sql_backlog.json'), backlog);
      console.log(chalk.green('✅ sql_backlog.json généré'));

      // Ajout d'un fichier php_sql_links.json si mentionné dans les métadonnées
      if (
        analyzedSchemaWithDebt.phpMappings &&
        Object.keys(analyzedSchemaWithDebt.phpMappings).length > 0
      ) {
        saveToJson(path.join(outputDir, 'php_sql_links.json'), analyzedSchemaWithDebt.phpMappings);
        console.log(chalk.green('✅ php_sql_links.json généré'));
      }

      // Synthèse finale
      console.log(chalk.green('\n🎉 Analyse et génération terminées avec succès !'));
      console.log(chalk.green(`📂 Tous les fichiers ont été générés dans: ${outputDir}`));
      printSummary(
        analyzedSchemaWithDebt,
        stats,
        debtIssues.length,
        performanceResults.indexSuggestions.length
      );
    } finally {
      // Fermeture de la connexion
      await connection.end();
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Sauvegarde des données au format JSON
 */
function saveToJson(filePath: string, data: any): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Sauvegarde du contenu au format Markdown
 */
function saveToMarkdown(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Récupère la version de la base de données MySQL
 */
async function getDatabaseVersion(connection: mysql.Connection): Promise<string> {
  const [rows] = await connection.query('SELECT VERSION() as version');
  return (rows as any[])[0].version;
}

/**
 * Récupère le jeu de caractères par défaut de la base de données
 */
async function getDatabaseCharset(connection: mysql.Connection, database: string): Promise<string> {
  const [rows] = await connection.query(
    `
    SELECT DEFAULT_CHARACTER_SET_NAME as charset
    FROM information_schema.SCHEMATA
    WHERE SCHEMA_NAME = ?`,
    [database]
  );
  return (rows as any[])[0].charset;
}

/**
 * Récupère la collation par défaut de la base de données
 */
async function getDatabaseCollation(
  connection: mysql.Connection,
  database: string
): Promise<string> {
  const [rows] = await connection.query(
    `
    SELECT DEFAULT_COLLATION_NAME as collation
    FROM information_schema.SCHEMATA
    WHERE SCHEMA_NAME = ?`,
    [database]
  );
  return (rows as any[])[0].collation;
}

/**
 * Génère le rapport d'analyse SQL au format Markdown
 */
function generateSqlAnalysisMarkdown(
  schema: MySQLSchema,
  issues: DebtIssue[],
  stats: SchemaStats
): string {
  let markdown = `# Rapport d'audit technique SQL\n\n`;
  markdown += `*Généré le ${new Date().toLocaleDateString(
    'fr-FR'
  )} à ${new Date().toLocaleTimeString('fr-FR')}*\n\n`;

  // Résumé global
  markdown += `## 📊 Résumé global\n\n`;
  markdown += `- **Base de données**: ${schema.database}\n`;
  markdown += `- **Nombre de tables**: ${stats.tableCount}\n`;
  markdown += `- **Nombre de colonnes**: ${stats.columnCount}\n`;
  markdown += `- **Nombre d'index**: ${stats.indexCount}\n`;
  markdown += `- **Nombre de clés étrangères**: ${stats.foreignKeyCount}\n`;
  markdown += `- **Taille totale des données**: ${stats.totalDataSizeMB} MB\n`;
  markdown += `- **Taille totale des index**: ${stats.totalIndexSizeMB} MB\n`;
  markdown += `- **Problèmes techniques identifiés**: ${issues.length}\n\n`;

  // Table la plus volumineuse
  if (stats.largestTable) {
    markdown += `- **Table la plus volumineuse**: \`${stats.largestTable.name}\` (${stats.largestTable.sizeInMB} MB)\n`;
  }

  // Table la plus référencée
  if (stats.mostReferencedTable) {
    markdown += `- **Table la plus référencée**: \`${stats.mostReferencedTable.name}\` (${stats.mostReferencedTable.referencesCount} références)\n\n`;
  }

  // Problèmes identifiés
  markdown += `## 🚨 Problèmes techniques identifiés\n\n`;

  // Grouper les problèmes par type et sévérité
  const issuesByType = issues.reduce(
    (acc, issue) => {
      const key = `${issue.severity}:${issue.type}`;
      if (!acc[key]) {
        acc[key] = {
          severity: issue.severity,
          type: issue.type,
          issues: [],
        };
      }
      acc[key].issues.push(issue);
      return acc;
    },
    {} as Record<string, { severity: string; type: string; issues: DebtIssue[] }>
  );

  // Trier par sévérité (high, medium, low)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedIssueTypes = Object.values(issuesByType).sort((a, b) => {
    return (
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
    );
  });

  for (const issueType of sortedIssueTypes) {
    const severityIcon =
      issueType.severity === 'high' ? '🔴' : issueType.severity === 'medium' ? '🟠' : '🟡';
    markdown += `### ${severityIcon} ${issueType.type} (${issueType.issues.length})\n\n`;

    // Regrouper par table pour une meilleure lisibilité
    const issuesByTable = issueType.issues.reduce(
      (acc, issue) => {
        if (!acc[issue.tableName]) {
          acc[issue.tableName] = [];
        }
        acc[issue.tableName].push(issue);
        return acc;
      },
      {} as Record<string, DebtIssue[]>
    );

    for (const [tableName, tableIssues] of Object.entries(issuesByTable)) {
      markdown += `#### Table: \`${tableName}\`\n\n`;

      for (const issue of tableIssues) {
        markdown += `- **${issue.columnName ? `Colonne \`${issue.columnName}\`` : 'Table'}**: ${
          issue.message
        }\n`;
        if (issue.recommendation) {
          markdown += `  - *Recommandation*: ${issue.recommendation}\n`;
        }
      }

      markdown += `\n`;
    }
  }

  // Incohérences de types de données
  markdown += `## 🔄 Incohérences de types de données\n\n`;

  const typeIssues = issues.filter(
    (issue) => issue.type === 'DATA_TYPE_INCONSISTENCY' || issue.type === 'DATA_TYPE_OPTIMIZATION'
  );

  if (typeIssues.length > 0) {
    markdown += `| Table | Colonne | Type actuel | Problème | Recommandation |\n`;
    markdown += `|-------|---------|-------------|----------|----------------|\n`;

    for (const issue of typeIssues) {
      const currentType =
        schema.tables[issue.tableName]?.columns[issue.columnName as string]?.type || 'N/A';
      markdown += `| ${issue.tableName} | ${issue.columnName} | \`${currentType}\` | ${
        issue.message
      } | ${issue.recommendation || 'N/A'} |\n`;
    }
  } else {
    markdown += `Aucune incohérence de type de données détectée.\n`;
  }

  markdown += `\n`;

  // Colonnes ambiguës ou à renommer
  markdown += `## 🏷️ Colonnes ambiguës ou à renommer\n\n`;

  const namingIssues = issues.filter((issue) => issue.type === 'NAMING_ISSUE');

  if (namingIssues.length > 0) {
    markdown += `| Table | Colonne actuelle | Problème | Suggestion |\n`;
    markdown += `|-------|-----------------|----------|------------|\n`;

    for (const issue of namingIssues) {
      markdown += `| ${issue.tableName} | ${issue.columnName} | ${issue.message} | ${
        issue.recommendation || 'N/A'
      } |\n`;
    }
  } else {
    markdown += `Aucune colonne ambiguë ou à renommer détectée.\n`;
  }

  markdown += `\n`;

  // Relations détectées
  markdown += `## 🔗 Relations entre tables\n\n`;

  if (schema.relationships && schema.relationships.length > 0) {
    markdown += `| Relation | Type | Table source | Colonne source | Table cible | Colonne cible | Mandatory |\n`;
    markdown += `|----------|------|--------------|----------------|-------------|---------------|----------|\n`;

    for (const relation of schema.relationships) {
      markdown += `| ${relation.name || 'N/A'} | ${relation.type} | ${relation.sourceTable} | ${
        relation.sourceColumn
      } | ${relation.targetTable} | ${relation.targetColumn} | ${
        relation.isMandatory ? 'Oui' : 'Non'
      } |\n`;
    }
  } else {
    markdown += `Aucune relation explicite détectée.\n`;
  }

  markdown += `\n`;

  // Énumérations détectées
  markdown += `## 📋 Énumérations détectées\n\n`;

  const enumColumns = Object.entries(schema.tables).flatMap(([tableName, table]) =>
    Object.entries(table.columns)
      .filter(([, column]) => column.type.toLowerCase().includes('enum') || column.enumValues)
      .map(([columnName, column]) => ({ tableName, columnName, column }))
  );

  if (enumColumns.length > 0) {
    markdown += `| Table | Colonne | Valeurs |\n`;
    markdown += `|-------|---------|--------|\n`;

    for (const { tableName, columnName, column } of enumColumns) {
      const values = column.enumValues ? column.enumValues.join(', ') : 'Non spécifiées';
      markdown += `| ${tableName} | ${columnName} | ${values} |\n`;
    }
  } else {
    markdown += `Aucune énumération détectée.\n`;
  }

  return markdown;
}

/**
 * Génère le plan de migration au format Markdown
 */
function generateMigrationPlanMarkdown(migrationDiff: any, schema: MySQLSchema): string {
  let markdown = `# Plan de migration MySQL vers Prisma\n\n`;
  markdown += `*Généré le ${new Date().toLocaleDateString(
    'fr-FR'
  )} à ${new Date().toLocaleTimeString('fr-FR')}*\n\n`;

  // Résumé des modifications
  markdown += `## 📋 Résumé des modifications\n\n`;

  const changesCount = {
    tablesRenamed: migrationDiff.tablesRenamed?.length || 0,
    tablesAdded: migrationDiff.tablesAdded?.length || 0,
    tablesRemoved: migrationDiff.tablesRemoved?.length || 0,
    columnsModified: Object.values(migrationDiff.columnsModified || {}).flat().length,
    columnsRenamed: Object.values(migrationDiff.columnsRenamed || {}).flat().length,
    columnsAdded: Object.values(migrationDiff.columnsAdded || {}).flat().length,
    columnsRemoved: Object.values(migrationDiff.columnsRemoved || {}).flat().length,
    typesChanged: Object.values(migrationDiff.typesChanged || {}).flat().length,
    relationsModified: migrationDiff.relationsModified?.length || 0,
    enumsCreated: migrationDiff.enumsCreated?.length || 0,
  };

  markdown += `- **Tables renommées**: ${changesCount.tablesRenamed}\n`;
  markdown += `- **Tables ajoutées**: ${changesCount.tablesAdded}\n`;
  markdown += `- **Tables supprimées**: ${changesCount.tablesRemoved}\n`;
  markdown += `- **Colonnes modifiées**: ${changesCount.columnsModified}\n`;
  markdown += `- **Colonnes renommées**: ${changesCount.columnsRenamed}\n`;
  markdown += `- **Colonnes ajoutées**: ${changesCount.columnsAdded}\n`;
  markdown += `- **Colonnes supprimées**: ${changesCount.columnsRemoved}\n`;
  markdown += `- **Types de données modifiés**: ${changesCount.typesChanged}\n`;
  markdown += `- **Relations modifiées**: ${changesCount.relationsModified}\n`;
  markdown += `- **Énumérations créées**: ${changesCount.enumsCreated}\n\n`;

  // Détail des tables renommées
  if (migrationDiff.tablesRenamed && migrationDiff.tablesRenamed.length > 0) {
    markdown += `## 🔄 Tables renommées\n\n`;
    markdown += `| Ancien nom | Nouveau nom |\n`;
    markdown += `|------------|------------|\n`;

    for (const renaming of migrationDiff.tablesRenamed) {
      markdown += `| ${renaming.oldName} | ${renaming.newName} |\n`;
    }

    markdown += `\n`;
  }

  // Détail des colonnes renommées
  if (migrationDiff.columnsRenamed && Object.keys(migrationDiff.columnsRenamed).length > 0) {
    markdown += `## 🔄 Colonnes renommées\n\n`;
    markdown += `| Table | Ancien nom | Nouveau nom |\n`;
    markdown += `|-------|------------|------------|\n`;

    for (const [tableName, renamings] of Object.entries(migrationDiff.columnsRenamed)) {
      for (const renaming of renamings as { oldName: string; newName: string }[]) {
        markdown += `| ${tableName} | ${renaming.oldName} | ${renaming.newName} |\n`;
      }
    }

    markdown += `\n`;
  }

  // Détail des types modifiés
  if (migrationDiff.typesChanged && Object.keys(migrationDiff.typesChanged).length > 0) {
    markdown += `## 🔄 Types de données modifiés\n\n`;
    markdown += `| Table | Colonne | Type MySQL | Type Prisma |\n`;
    markdown += `|-------|---------|------------|-------------|\n`;

    for (const [tableName, changes] of Object.entries(migrationDiff.typesChanged)) {
      for (const change of changes as { column: string; oldType: string; newType: string }[]) {
        markdown += `| ${tableName} | ${change.column} | ${change.oldType} | ${change.newType} |\n`;
      }
    }

    markdown += `\n`;
  }

  // Énumérations créées
  if (migrationDiff.enumsCreated && migrationDiff.enumsCreated.length > 0) {
    markdown += `## 📋 Énumérations Prisma créées\n\n`;

    for (const enumInfo of migrationDiff.enumsCreated) {
      markdown += `### ${enumInfo.name}\n\n`;
      markdown += `\`\`\`prisma\nenum ${enumInfo.name} {\n`;

      for (const value of enumInfo.values) {
        markdown += `  ${value}\n`;
      }

      markdown += `}\n\`\`\`\n\n`;

      if (enumInfo.usedIn && enumInfo.usedIn.length > 0) {
        markdown += `Utilisé dans:\n`;

        for (const usage of enumInfo.usedIn) {
          markdown += `- Table \`${usage.table}\`, colonne \`${usage.column}\`\n`;
        }

        markdown += `\n`;
      }
    }
  }

  // Liste des tâches à effectuer
  markdown += `## ✅ Tâches à réaliser\n\n`;

  markdown += `### 1. Configuration du projet Prisma\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `# Installation de Prisma CLI\nnpm install prisma --save-dev\n\n`;
  markdown += `# Initialisation du projet Prisma\nnpx prisma init\n\`\`\`\n\n`;

  markdown += `### 2. Configuration de la base de données\n\n`;
  markdown += `Modifier le fichier \`.env\` pour configurer la connexion à PostgreSQL:\n\n`;
  markdown += `\`\`\`\nDATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"\n\`\`\`\n\n`;

  markdown += `### 3. Adaptation des modèles Prisma\n\n`;
  markdown += `Copier le contenu du fichier \`prisma_models.suggestion.prisma\` dans votre fichier \`schema.prisma\`.\n\n`;

  markdown += `### 4. Exécution de la migration initiale\n\n`;
  markdown += `\`\`\`bash\n# Créer la migration initiale\nnpx prisma migrate dev --name init\n\`\`\`\n\n`;

  markdown += `### 5. Adaptation des DTO et des services\n\n`;
  markdown += `Convertir vos DTO et services pour utiliser les nouveaux noms et types:\n\n`;

  if (
    (migrationDiff.tablesRenamed && migrationDiff.tablesRenamed.length > 0) ||
    (migrationDiff.columnsRenamed && Object.keys(migrationDiff.columnsRenamed).length > 0)
  ) {
    markdown += `#### Mises à jour des imports et noms de modèles:\n\n`;
    markdown += `\`\`\`typescript\n`;

    // Exemple pour les tables renommées
    if (migrationDiff.tablesRenamed && migrationDiff.tablesRenamed.length > 0) {
      for (const renaming of migrationDiff.tablesRenamed) {
        markdown += `// Remplacer\nimport { ${renaming.oldName} } from '@prisma/client';\n`;
        markdown += `// Par\nimport { ${renaming.newName} } from '@prisma/client';\n\n`;
      }
    }

    markdown += `\`\`\`\n\n`;
  }

  markdown += `#### Mises à jour des requêtes Prisma:\n\n`;

  markdown += `\`\`\`typescript\n`;
  markdown += `// Exemple de mise à jour d'une requête avec les nouveaux noms de colonnes\nconst user = await prisma.user.findUnique({\n`;
  markdown += `  where: { id },\n`;
  markdown += `  select: {\n`;

  // Si nous avons des colonnes renommées dans la table "user", on les montre
  const userColumnsRenamed = migrationDiff.columnsRenamed?.user || [];

  if (userColumnsRenamed.length > 0) {
    for (const renaming of userColumnsRenamed) {
      markdown += `    ${renaming.newName}: true, // anciennement ${renaming.oldName}\n`;
    }
  } else {
    markdown += `    id: true,\n    email: true,\n    // autres champs...\n`;
  }

  markdown += `  }\n});\n\`\`\`\n\n`;

  markdown += `### 6. Tests de compatibilité\n\n`;
  markdown += `Vérifier que les requêtes et les opérations fonctionnent correctement avec le nouveau schéma.\n\n`;

  markdown += `### 7. Migration des données\n\n`;
  markdown += `Il est recommandé d'utiliser des outils comme Airbyte ou une solution personnalisée pour migrer les données de MySQL vers PostgreSQL.\n\n`;

  markdown += `## 📚 Ressources utiles\n\n`;
  markdown += `- [Documentation Prisma](https://www.prisma.io/docs/)\n`;
  markdown += `- [Guide de migration MySQL vers PostgreSQL](https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL#MySQL)\n`;
  markdown += `- [Outil pgloader pour la migration de données](https:/DoDoDoDoDoDotgithub.com/dimitri/pgloader)\n`;

  return markdown;
}

/**
 * Génère les suggestions d'index au format SQL
 */
function generateIndexSuggestionsSQL(indexSuggestions: IndexSuggestion[]): string {
  let sql = `-- Suggestions d'index pour optimisation des performances\n`;
  sql += `-- Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString(
    'fr-FR'
  )}\n\n`;

  // Grouper les suggestions par table
  const suggestionsByTable = indexSuggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.tableName]) {
        acc[suggestion.tableName] = [];
      }
      acc[suggestion.tableName].push(suggestion);
      return acc;
    },
    {} as Record<string, IndexSuggestion[]>
  );

  // Suggestions pour les index manquants
  sql += `-- ===== AJOUT D'INDEX MANQUANTS =====\n\n`;

  let missingCount = 0;

  for (const [tableName, suggestions] of Object.entries(suggestionsByTable)) {
    const missingIndexes = suggestions.filter((s) => s.type === 'MISSING');

    if (missingIndexes.length > 0) {
      sql += `-- Table: ${tableName}\n`;

      for (const suggestion of missingIndexes) {
        missingCount++;

        const indexType = suggestion.unique ? 'UNIQUE' : '';
        const indexName = `idx_${tableName}_${suggestion.columns.join('_')}`;
        const columnList = suggestion.columns.join('`, `');

        sql += `-- Raison: ${suggestion.reason}\n`;
        sql += `ALTER TABLE \`${tableName}\` ADD ${indexType} INDEX \`${indexName}\` (\`${columnList}\`);\n\n`;
      }
    }
  }

  if (missingCount === 0) {
    sql += `-- Aucun index manquant n'a été identifié.\n\n`;
  }

  // Suggestions pour les index redondants
  sql += `\n-- ===== SUPPRESSION D'INDEX REDONDANTS =====\n\n`;

  let redundantCount = 0;

  for (const [tableName, suggestions] of Object.entries(suggestionsByTable)) {
    const redundantIndexes = suggestions.filter((s) => s.type === 'REDUNDANT');

    if (redundantIndexes.length > 0) {
      sql += `-- Table: ${tableName}\n`;

      for (const suggestion of redundantIndexes) {
        redundantCount++;

        sql += `-- Raison: ${suggestion.reason}\n`;
        sql += `ALTER TABLE \`${tableName}\` DROP INDEX \`${suggestion.name}\`;\n\n`;
      }
    }
  }

  if (redundantCount === 0) {
    sql += `-- Aucun index redondant n'a été identifié.\n\n`;
  }

  // Instructions pour PostgreSQL
  if (missingCount > 0 || redundantCount > 0) {
    sql += `\n-- ===== ÉQUIVALENT POSTGRESQL =====\n\n`;
    sql += `-- Lors de la migration vers PostgreSQL, utilisez la syntaxe suivante pour les index:\n\n`;

    if (missingCount > 0) {
      sql += `-- Création d'index:\n`;
      sql += `-- CREATE INDEX idx_nom_table_colonne ON nom_table(colonne);\n`;
      sql += `-- CREATE UNIQUE INDEX idx_nom_table_colonne ON nom_table(colonne);\n\n`;
    }

    if (redundantCount > 0) {
      sql += `-- Suppression d'index:\n`;
      sql += `-- DROP INDEX idx_nom_table_colonne;\n\n`;
    }

    sql += `-- Note: Prisma créera automatiquement des index pour les relations et les champs uniques\n`;
    sql += `-- définis dans votre schéma Prisma.\n`;
  }

  return sql;
}

/**
 * Affiche un résumé de l'analyse
 */
function printSummary(
  schema: MySQLSchema,
  stats: SchemaStats,
  issuesCount: number,
  indexSuggestionsCount: number
): void {
  console.log(chalk.cyan("\n📊 Résumé de l'analyse:"));
  console.log(chalk.cyan(`- Base de données: ${schema.database}`));
  console.log(chalk.cyan(`- Tables analysées: ${Object.keys(schema.tables).length}`));
  console.log(chalk.cyan(`- Problèmes techniques détectés: ${issuesCount}`));
  console.log(chalk.cyan(`- Suggestions d'optimisation d'index: ${indexSuggestionsCount}`));

  if (stats.largestTable) {
    console.log(
      chalk.cyan(
        `- Table la plus volumineuse: ${stats.largestTable.name} (${stats.largestTable.sizeInMB} MB)`
      )
    );
  }

  console.log(chalk.cyan('\n🚀 Prochaines étapes:'));
  console.log(chalk.cyan("1. Examiner le rapport d'audit SQL (sql_analysis.md)"));
  console.log(
    chalk.cyan('2. Vérifier les modèles Prisma générés (prisma_models.suggestion.prisma)')
  );
  console.log(chalk.cyan('3. Suivre le plan de migration (migration_plan.md)'));
  console.log(
    chalk.cyan("4. Appliquer les suggestions d'optimisation (sql_index_suggestions.sql)")
  );
}

// Exécuter la fonction principale
main().catch((error) => {
  console.error(chalk.red('Erreur inattendue:'), error);
  process.exit(1);
});
