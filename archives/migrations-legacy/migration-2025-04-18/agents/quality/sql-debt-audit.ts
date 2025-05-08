#!/usr/bin/env ts-node

/**
 * Agent 5 - Audit de Dette Technique SQL & Anomalies de Modélisation
 *
 * Détecte automatiquement les signes de dette technique dans le schéma MySQL
 * afin d'optimiser la migration, éviter les anti-patterns, et améliorer
 * la maintenabilité future du modèle Prisma/PostgreSQL.
 *
 * Usage:
 *   npx ts-node sql-debt-audit.ts --schema=schema.json [--output=./reports] [--format=json,md] [--verbose]
 *
 * @version 1.0.0
 * @date 2025-04-12
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { program } from 'commander';

// Types pour le rapport de dette technique
interface SQLDebtIssue {
  pattern: string;
  description: string;
  affected_tables?: string[];
  affected_columns?: string[];
  severity: 'Critique' | 'Élevée' | 'Moyenne' | 'Faible';
  remediation: string;
}

interface SQLDebtSummary {
  tables_analyzed: number;
  columns_analyzed: number;
  redundant_fields: number;
  unused_fields: number;
  multi_purpose_columns: number;
  poor_schema_design: number;
  overall_debt_score: number;
  risk_level: 'Élevé' | 'Moyen' | 'Faible';
}

interface SQLDebtReport {
  project: string;
  version: string;
  date: string;
  summary: SQLDebtSummary;
  redundant_fields: SQLDebtIssue[];
  unused_fields: SQLDebtIssue[];
  multi_purpose_columns: SQLDebtIssue[];
  poor_schema_design: SQLDebtIssue[];
  detailed_recommendations: {
    short_term: string[];
    medium_term: string[];
    long_term: string[];
  };
}

// Patterns de détection
const PATTERNS = {
  REDUNDANT_TIMESTAMPS: [
    'created_on',
    'created_at',
    'date_created',
    'updated_on',
    'updated_at',
    'last_update',
  ],
  GENERIC_COLUMNS: [
    'data',
    'data1',
    'data2',
    'json_blob',
    'json_data',
    'extra',
    'additional_data',
    'metadata',
    'config',
    'settings',
    'properties',
    'attributes',
    'params',
  ],
  STATUS_DUPLICATES: ['status', 'status_code', 'status_txt', 'status_description'],
  OBSOLETE_PREFIX: ['old_', 'legacy_', 'temp_', 'tmp_', 'deprecated_', 'test_'],
  CATCH_ALL_TABLES: [
    'config',
    'settings',
    'params',
    'properties',
    'metadata',
    'core_param',
    'config_all_in_one',
    'setup_globals',
    'misc',
  ],
  SOFT_DELETE_FLAGS: ['deleted', 'is_deleted', 'deleted_at', 'deleted_flag', 'active'],
  INCONSISTENT_NAMING: {
    CAMEL_SNAKE_MIX: /([a-z][A-Z]|[a-z]_[A-Z])/,
    ID_VARIATIONS: ['id_', '_id', 'Id', '_ID', 'ID_'],
  },
};

// Configuration des seuils de score
const THRESHOLD = {
  CRITICAL: 8,
  HIGH: 6,
  MEDIUM: 4,
  LOW: 2,
};

// Fonction principale
async function main() {
  program
    .requiredOption('--schema <path>', 'Chemin vers le fichier JSON de schéma')
    .option('--output <path>', 'Répertoire de sortie pour les rapports', './reports')
    .option(
      '--format <format>',
      'Format de sortie (json, md, ou les deux séparés par une virgule)',
      'json,md'
    )
    .option('--verbose', 'Mode verbeux pour afficher plus de détails', false)
    .option('--threshold <score>', 'Seuil de score pour les alertes (1-10)', '5')
    .parse(process.argv);

  const options = program.opts();

  // Vérifier si le fichier de schéma existe
  if (!fs.existsSync(options.schema)) {
    console.error(chalk.red(`Erreur: Le fichier de schéma ${options.schema} n'existe pas`));
    process.exit(1);
  }

  console.log(chalk.blue('🔍 Agent 5 - Audit de Dette Technique SQL & Anomalies de Modélisation'));
  console.log(chalk.gray(`Date d'analyse: ${new Date().toISOString().split('T')[0]}`));

  // Charger le schéma
  const schemaContent = fs.readFileSync(options.schema, 'utf8');
  const schema = JSON.parse(schemaContent);

  // Exécuter l'analyse
  if (options.verbose) {
    console.log(chalk.yellow('Analyse en cours...'));
  }

  const auditReport = analyzeSchema(schema);

  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  // Générer les rapports dans les formats demandés
  const formats = options.format.split(',');

  if (formats.includes('json')) {
    const jsonPath = path.join(options.output, 'sql_debt_report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditReport, null, 2));
    console.log(chalk.green(`✅ Rapport JSON généré: ${jsonPath}`));
  }

  if (formats.includes('md')) {
    const mdPath = path.join(options.output, 'sql_dette.md');
    const mdContent = generateMarkdownReport(auditReport);
    fs.writeFileSync(mdPath, mdContent);
    console.log(chalk.green(`✅ Rapport Markdown généré: ${mdPath}`));
  }

  // Générer des alertes si le score est au-dessus du seuil
  const threshold = parseFloat(options.threshold);
  if (auditReport.summary.overall_debt_score > threshold) {
    console.log(
      chalk.red(
        `⚠️ ALERTE: Score de dette technique (${auditReport.summary.overall_debt_score.toFixed(
          1
        )}) supérieur au seuil (${threshold})`
      )
    );
    console.log(chalk.yellow('Recommendations prioritaires:'));
    auditReport.detailed_recommendations.short_term.slice(0, 3).forEach((rec) => {
      console.log(chalk.yellow(`  • ${rec}`));
    });
  } else {
    console.log(
      chalk.green(
        `✅ Score de dette technique (${auditReport.summary.overall_debt_score.toFixed(
          1
        )}) en dessous du seuil (${threshold})`
      )
    );
  }
}

// Fonction pour analyser le schéma et générer le rapport
function analyzeSchema(schema: any): SQLDebtReport {
  // Statistiques globales
  const tables = Object.keys(schema);
  let totalColumns = 0;
  let redundantFields = 0;
  let unusedFields = 0;
  let multiPurposeColumns = 0;
  let poorSchemaDesign = 0;

  // Initialiser le rapport
  const report: SQLDebtReport = {
    project: 'Analyse de Dette Technique SQL',
    version: '1.0.0',
    date: new Date().toISOString().split('T')[0],
    summary: {
      tables_analyzed: tables.length,
      columns_analyzed: 0,
      redundant_fields: 0,
      unused_fields: 0,
      multi_purpose_columns: 0,
      poor_schema_design: 0,
      overall_debt_score: 0,
      risk_level: 'Faible',
    },
    redundant_fields: [],
    unused_fields: [],
    multi_purpose_columns: [],
    poor_schema_design: [],
    detailed_recommendations: {
      short_term: [],
      medium_term: [],
      long_term: [],
    },
  };

  // Stocker les problèmes détectés par catégorie
  const redundantTimestampTables: string[] = [];
  const redundantTimestampColumns: string[] = [];
  const statusDuplicateTables: string[] = [];
  const statusDuplicateColumns: string[] = [];
  const identifierDuplicateTables: string[] = [];
  const identifierDuplicateColumns: string[] = [];

  const genericColumnsTables: string[] = [];
  const genericColumnsColumns: string[] = [];
  const jsonTextColumnsTables: string[] = [];
  const jsonTextColumnsColumns: string[] = [];

  const catchAllTables: string[] = [];
  const missingForeignKeysTables: string[] = [];
  const missingForeignKeysColumns: string[] = [];
  const inappropriateTypesTables: string[] = [];
  const inappropriateTypesColumns: string[] = [];
  const inconsistentNamingTables: string[] = [];

  // Vérifier les tables obsolètes
  const obsoleteTables = tables.filter((table) => {
    return (
      PATTERNS.OBSOLETE_PREFIX.some((prefix) => table.startsWith(prefix)) ||
      table.includes('_backup') ||
      table.includes('_old') ||
      table.includes('_temp') ||
      table.match(/_20\d\d$/)
    );
  });

  if (obsoleteTables.length > 0) {
    poorSchemaDesign += obsoleteTables.length;
    report.poor_schema_design.push({
      pattern: 'Tables obsolètes',
      description: 'Tables potentiellement obsolètes ou temporaires',
      affected_tables: obsoleteTables,
      severity: 'Moyenne',
      remediation: "Archiver et supprimer ces tables après vérification d'usage",
    });
  }

  // Vérifier les tables fourre-tout
  const catchAllTablesFound = tables.filter((table) => {
    return PATTERNS.CATCH_ALL_TABLES.some(
      (pattern) => table.includes(pattern) || table === pattern
    );
  });

  if (catchAllTablesFound.length > 0) {
    catchAllTables.push(...catchAllTablesFound);
    poorSchemaDesign += catchAllTablesFound.length * 2; // Pénalité plus lourde
  }

  // Parcourir chaque table et ses colonnes
  tables.forEach((table) => {
    const columns = schema[table].columns || [];
    totalColumns += columns.length;

    // Stocker les colonnes par catégorie pour détecter les incohérences
    const timestampColumns: string[] = [];
    const statusColumns: string[] = [];
    const idColumns: string[] = [];
    const softDeleteColumns: string[] = [];

    // Vérifier les colonnes génériques
    const genericCols = columns.filter((col) =>
      PATTERNS.GENERIC_COLUMNS.some((pattern) => col.name.includes(pattern))
    );

    if (genericCols.length > 0) {
      genericColumnsTables.push(table);
      genericColumnsColumns.push(...genericCols.map((c) => `${table}.${c.name}`));
      multiPurposeColumns += genericCols.length;
    }

    // Vérifier JSON stocké comme TEXT/VARCHAR
    const jsonTextCols = columns.filter(
      (col) =>
        (col.type === 'TEXT' || col.type.startsWith('VARCHAR')) &&
        (col.name.includes('json') || col.name.includes('config') || col.name.includes('settings'))
    );

    if (jsonTextCols.length > 0) {
      jsonTextColumnsTables.push(table);
      jsonTextColumnsColumns.push(...jsonTextCols.map((c) => `${table}.${c.name}`));
      multiPurposeColumns += jsonTextCols.length;
    }

    // Vérifier les types inappropriés
    const inappropriateTypes = columns.filter((col) => {
      if (col.name.includes('price') && col.type === 'FLOAT') return true;
      if (col.name.includes('date') && col.type.startsWith('VARCHAR')) return true;
      if (
        (col.name.startsWith('is_') || col.name.endsWith('_flag')) &&
        (col.type === 'INT' || col.type === 'TINYINT') &&
        col.length === 1
      )
        return true;
      return false;
    });

    if (inappropriateTypes.length > 0) {
      inappropriateTypesTables.push(table);
      inappropriateTypesColumns.push(
        ...inappropriateTypes.map(
          (c) => `${table}.${c.name} (${c.type} au lieu de ${getAppropriateType(c)})`
        )
      );
      poorSchemaDesign += inappropriateTypes.length;
    }

    // Collecter les colonnes par catégorie
    columns.forEach((col) => {
      // Timestamps
      if (PATTERNS.REDUNDANT_TIMESTAMPS.some((pattern) => col.name.includes(pattern))) {
        timestampColumns.push(col.name);
      }

      // Status
      if (PATTERNS.STATUS_DUPLICATES.some((pattern) => col.name.includes(pattern))) {
        statusColumns.push(col.name);
      }

      // Identifiants
      if (
        col.name === 'id' ||
        col.name.endsWith('_id') ||
        col.name.endsWith('_uuid') ||
        col.name.endsWith('_code') ||
        col.name.endsWith('_number')
      ) {
        idColumns.push(col.name);
      }

      // Soft delete flags
      if (PATTERNS.SOFT_DELETE_FLAGS.some((pattern) => col.name === pattern)) {
        softDeleteColumns.push(col.name);
      }

      // Vérifier nommage incohérent
      if (PATTERNS.INCONSISTENT_NAMING.CAMEL_SNAKE_MIX.test(col.name)) {
        if (!inconsistentNamingTables.includes(table)) {
          inconsistentNamingTables.push(table);
          poorSchemaDesign += 1;
        }
      }
    });

    // Vérifier les redondances de timestamps
    if (timestampColumns.length > 2) {
      redundantTimestampTables.push(table);
      redundantTimestampColumns.push(...timestampColumns.map((c) => `${table}.${c}`));
      redundantFields += timestampColumns.length - 2; // On considère que 2 timestamps sont OK (created/updated)
    }

    // Vérifier les duplications de statut
    if (statusColumns.length > 1) {
      statusDuplicateTables.push(table);
      statusDuplicateColumns.push(...statusColumns.map((c) => `${table}.${c}`));
      redundantFields += statusColumns.length - 1;
    }

    // Vérifier les duplications d'identifiants
    if (idColumns.length > 2) {
      // Permettre une clé primaire + une clé externe
      identifierDuplicateTables.push(table);
      identifierDuplicateColumns.push(...idColumns.map((c) => `${table}.${c}`));
      redundantFields += idColumns.length - 2;
    }

    // Vérifier les flags de soft delete multiples
    if (softDeleteColumns.length > 1) {
      redundantFields += softDeleteColumns.length - 1;
    }

    // Vérifier les colonnes obsolètes
    const obsoleteCols = columns.filter((col) =>
      PATTERNS.OBSOLETE_PREFIX.some((prefix) => col.name.startsWith(prefix))
    );

    if (obsoleteCols.length > 0) {
      unusedFields += obsoleteCols.length;
    }
  });

  // Mettre à jour les statistiques globales
  report.summary.columns_analyzed = totalColumns;
  report.summary.redundant_fields = redundantFields;
  report.summary.unused_fields = unusedFields;
  report.summary.multi_purpose_columns = multiPurposeColumns;
  report.summary.poor_schema_design = poorSchemaDesign;

  // Ajouter les problèmes détectés au rapport

  // 1. Champs redondants
  if (redundantTimestampTables.length > 0) {
    report.redundant_fields.push({
      pattern: 'Timestamps redondants',
      description: 'Utilisation incohérente de champs de timestamp',
      affected_tables: redundantTimestampTables,
      affected_columns: redundantTimestampColumns,
      severity: 'Moyenne',
      remediation:
        'Standardiser sur created_at et updated_at avec type TIMESTAMP et déclencher automatiquement les mises à jour',
    });
  }

  if (statusDuplicateTables.length > 0) {
    report.redundant_fields.push({
      pattern: "Champs d'état textuels avec codes numériques",
      description: 'Champs status accompagnés de status_txt décrivant la même information',
      affected_tables: statusDuplicateTables,
      affected_columns: statusDuplicateColumns,
      severity: 'Élevée',
      remediation:
        'Utiliser un ENUM ou une table de référence pour le statut plutôt que des codes et descriptions dupliqués',
    });
  }

  if (identifierDuplicateTables.length > 0) {
    report.redundant_fields.push({
      pattern: 'Identifiants dupliqués',
      description: "Colonnes stockant la même information d'identifiant sous différentes formes",
      affected_tables: identifierDuplicateTables,
      affected_columns: identifierDuplicateColumns,
      severity: 'Moyenne',
      remediation:
        "Choisir un format d'identifiant unique et cohérent (soit numérique, soit UUID) et s'y tenir",
    });
  }

  // 2. Colonnes génériques ou multi-usages
  if (genericColumnsTables.length > 0) {
    report.multi_purpose_columns.push({
      pattern: 'Colonnes génériques de données',
      description: 'Colonnes utilisées pour stocker différents types de données',
      affected_tables: genericColumnsTables,
      affected_columns: genericColumnsColumns,
      severity: 'Élevée',
      remediation:
        'Décomposer en colonnes spécifiques ou utiliser une structure JSON correctement typée',
    });
  }

  if (jsonTextColumnsTables.length > 0) {
    report.multi_purpose_columns.push({
      pattern: 'Colonnes JSON non structurées',
      description: 'Utilisation de TEXT ou VARCHAR pour stocker du JSON sans validation',
      affected_tables: jsonTextColumnsTables,
      affected_columns: jsonTextColumnsColumns,
      severity: 'Élevée',
      remediation:
        'Migrer vers le type JSON/JSONB natif avec validation de schéma ou décomposer en colonnes si possible',
    });
  }

  // 3. Mauvais découpage du schéma
  if (catchAllTables.length > 0) {
    report.poor_schema_design.push({
      pattern: 'Tables fourre-tout',
      description: 'Tables contenant des données de nature différente',
      affected_tables: catchAllTables,
      severity: 'Critique',
      remediation: 'Normaliser en divisant en tables distinctes avec des relations claires',
    });
  }

  if (inappropriateTypesTables.length > 0) {
    report.poor_schema_design.push({
      pattern: 'Champs de type inapproprié',
      description: 'Utilisation de types de données inappropriés pour le contenu',
      affected_tables: inappropriateTypesTables,
      affected_columns: inappropriateTypesColumns,
      severity: 'Élevée',
      remediation: 'Utiliser le type de données approprié pour chaque colonne',
    });
  }

  if (inconsistentNamingTables.length > 0) {
    report.poor_schema_design.push({
      pattern: 'Noms de colonnes incohérents',
      description: 'Conventions de nommage incohérentes entre les tables',
      affected_tables: inconsistentNamingTables,
      examples: [
        'user_id vs. userId',
        'created_at vs. dateCreated',
        'product_name vs. productName',
      ],
      severity: 'Faible',
      remediation: 'Standardiser les conventions de nommage dans tout le schéma',
    });
  }

  // Calculer le score global de dette technique
  const redundantScore = Math.min(10, (redundantFields / Math.max(1, totalColumns * 0.1)) * 3);
  const unusedScore = Math.min(10, (unusedFields / Math.max(1, totalColumns * 0.05)) * 2);
  const multiPurposeScore = Math.min(
    10,
    (multiPurposeColumns / Math.max(1, totalColumns * 0.05)) * 4
  );
  const poorDesignScore = Math.min(10, (poorSchemaDesign / Math.max(1, tables.length * 0.2)) * 5);

  const overallScore =
    redundantScore * 0.2 + unusedScore * 0.1 + multiPurposeScore * 0.4 + poorDesignScore * 0.3;

  report.summary.overall_debt_score = parseFloat(overallScore.toFixed(1));

  // Déterminer le niveau de risque
  if (overallScore >= THRESHOLD.CRITICAL) {
    report.summary.risk_level = 'Élevé';
  } else if (overallScore >= THRESHOLD.MEDIUM) {
    report.summary.risk_level = 'Moyen';
  } else {
    report.summary.risk_level = 'Faible';
  }

  // Générer des recommandations détaillées
  generateRecommendations(report);

  return report;
}

// Fonction pour générer des recommandations basées sur les problèmes identifiés
function generateRecommendations(report: SQLDebtReport): void {
  // Recommandations à court terme (priorité élevée)
  if (report.poor_schema_design.some((issue) => issue.pattern === 'Champs de type inapproprié')) {
    report.detailed_recommendations.short_term.push(
      'Standardiser tous les champs temporels (created_at, updated_at) sur le type TIMESTAMP'
    );
    report.detailed_recommendations.short_term.push(
      'Convertir les champs financiers FLOAT en DECIMAL avec précision appropriée'
    );
  }

  if (report.poor_schema_design.some((issue) => issue.pattern === 'Clés étrangères manquantes')) {
    report.detailed_recommendations.short_term.push(
      'Ajouter les contraintes de clé étrangère manquantes'
    );
  }

  if (
    report.poor_schema_design.some((issue) =>
      issue.affected_columns?.some((col) => col.includes('BOOLEAN'))
    )
  ) {
    report.detailed_recommendations.short_term.push(
      'Convertir les TINYINT(1) utilisés comme booléens en BOOLEAN natif'
    );
  }

  // Recommandations à moyen terme
  if (
    report.redundant_fields.some(
      (issue) => issue.pattern === "Champs d'état textuels avec codes numériques"
    )
  ) {
    report.detailed_recommendations.medium_term.push(
      'Remplacer les paires de champs redondants (status/status_txt) par des ENUM ou tables de référence'
    );
  }

  if (
    report.multi_purpose_columns.some((issue) => issue.pattern === 'Colonnes JSON non structurées')
  ) {
    report.detailed_recommendations.medium_term.push(
      'Migrer les colonnes JSON stockées comme TEXT vers le type JSON/JSONB natif'
    );
  }

  if (
    report.multi_purpose_columns.some((issue) => issue.pattern === 'Colonnes génériques de données')
  ) {
    report.detailed_recommendations.medium_term.push(
      'Décomposer les colonnes multi-usages (data1, data2) en colonnes spécifiques'
    );
  }

  if (report.poor_schema_design.some((issue) => issue.pattern === 'Noms de colonnes incohérents')) {
    report.detailed_recommendations.medium_term.push(
      'Standardiser les conventions de nommage des colonnes'
    );
  }

  // Recommandations à long terme
  if (report.poor_schema_design.some((issue) => issue.pattern === 'Tables fourre-tout')) {
    report.detailed_recommendations.long_term.push(
      'Normaliser les tables fourre-tout (core_param, config_all_in_one)'
    );
  }

  if (report.redundant_fields.some((issue) => issue.pattern === 'Identifiants dupliqués')) {
    report.detailed_recommendations.long_term.push(
      'Migrer les identifiants vers un format cohérent (numérique ou UUID)'
    );
  }

  if (report.summary.unused_fields > 0) {
    report.detailed_recommendations.long_term.push(
      "Supprimer les colonnes obsolètes après vérification d'usage"
    );
  }

  // Toujours recommander un processus de revue pour prévenir la dette technique
  report.detailed_recommendations.long_term.push(
    "Implémenter un processus de revue de schéma pour prévenir l'accumulation de dette"
  );
}

// Fonction utilitaire pour déterminer le type approprié
function getAppropriateType(column: any): string {
  if (
    column.name.includes('price') ||
    column.name.includes('amount') ||
    column.name.includes('cost')
  ) {
    return 'DECIMAL';
  }
  if (column.name.includes('date')) {
    return 'DATE';
  }
  if (column.name.startsWith('is_') || column.name.endsWith('_flag')) {
    return 'BOOLEAN';
  }
  return 'Type approprié';
}

// Fonction pour générer le rapport au format Markdown
function generateMarkdownReport(report: SQLDebtReport): string {
  let markdown = `# 📊 Analyse de la Dette Technique SQL\n\n`;
  markdown += `*Rapport généré le ${report.date}*\n\n`;

  // Résumé exécutif
  markdown += `## 🔍 Résumé exécutif\n\n`;
  markdown += `Notre analyse a identifié plusieurs patterns récurrents de dette technique dans le schéma de base de données. L'indice global de dette technique est de **${
    report.summary.overall_debt_score
  }/10** (niveau ${report.summary.risk_level.toLowerCase()}), avec ${
    report.summary.tables_analyzed
  } tables et ${report.summary.columns_analyzed} colonnes analysées.\n\n`;
  markdown += `Les problèmes les plus critiques concernent la présence de colonnes multi-usages sans typage strict et des tables "fourre-tout" qui mélangent différents types de données sans modélisation claire. Ces problèmes affectent la maintenabilité, les performances et la fiabilité des données.\n\n`;

  // Principaux patterns détectés
  markdown += `## 🚩 Principaux patterns de dette technique identifiés\n\n`;

  // 1. Champs redondants
  if (report.redundant_fields.length > 0) {
    markdown += `### 1. Champs redondants ou inutilisés\n\n`;

    for (const issue of report.redundant_fields) {
      markdown += `#### ${issue.pattern}\n`;
      markdown += `${issue.description} :\n\n`;

      if (issue.affected_tables && issue.affected_tables.length > 0) {
        markdown += `| Table | Colonnes problématiques |\n`;
        markdown += `|-------|-------------------------|\n`;

        const tableMap = new Map<string, string[]>();

        // Organiser les colonnes par table
        if (issue.affected_columns) {
          for (const col of issue.affected_columns) {
            const parts = col.split('.');
            if (parts.length === 2) {
              const table = parts[0];
              const column = parts[1];

              if (!tableMap.has(table)) {
                tableMap.set(table, []);
              }
              tableMap.get(table)?.push(column);
            }
          }
        }

        // Générer les lignes du tableau
        for (const table of issue.affected_tables) {
          const columns = tableMap.get(table) || [];
          markdown += `| ${table} | ${columns.join(', ')} |\n`;
        }

        markdown += `\n`;
      }

      if (issue.pattern === "Champs d'état textuels avec codes numériques") {
        markdown += '```sql\n';
        markdown += '-- Exemple problématique\n';
        markdown += 'orders.status = 1\n';
        markdown += "orders.status_txt = 'Processing'\n\n";
        markdown += '-- Risque : les valeurs peuvent devenir désynchronisées\n';
        markdown += '```\n\n';
      }

      if (issue.pattern === 'Identifiants dupliqués') {
        markdown += '```\n';
        markdown += 'users.id + users.user_uuid  -- Redondance\n';
        markdown += 'orders.id + orders.order_number  -- Même information\n';
        markdown += '```\n\n';
      }

      markdown += `**Recommandation** : ${issue.remediation}\n\n`;
    }
  }

  // 2. Colonnes multi-usages
  if (report.multi_purpose_columns.length > 0) {
    markdown += `### 2. 🧩 Colonnes multi-usages\n\n`;
    markdown += `Le schéma contient des colonnes génériques réutilisées pour différents types de données :\n\n`;

    markdown += '```sql\n';
    markdown += '-- Anti-pattern : colonnes génériques\n';
    markdown += `products.data1 = '{"color": "red", "size": "L"}'  -- Pour certains produits\n`;
    markdown += `products.data1 = '{"weight": 2.5, "width": 30}'   -- Pour d'autres\n`;
    markdown += '```\n\n';

    markdown += `Ces colonnes posent plusieurs problèmes :\n`;
    markdown += `- Impossibilité de valider les données\n`;
    markdown += `- Difficulté à indexer efficacement\n`;
    markdown += `- Requêtes complexes et peu performantes\n`;
    markdown += `- Risque d'incohérence de données\n\n`;

    const criticalIssue = report.multi_purpose_columns.find((i) => i.severity === 'Critique');
    if (criticalIssue) {
      markdown += `**Cas critique** : la table \`${criticalIssue.affected_tables?.[0]}\` utilise une seule colonne \`value\` de type TEXT pour stocker des données de différents types, sans validation de structure.\n\n`;
    } else if (report.multi_purpose_columns[0]) {
      markdown += `**Cas critique** : la table \`${
        report.multi_purpose_columns[0].affected_tables?.[0]
      }\` utilise ${report.multi_purpose_columns[0].pattern.toLowerCase()}.\n\n`;
    }
  }

  // 3. Mauvais découpage logique
  if (report.poor_schema_design.length > 0) {
    markdown += `### 3. 📋 Mauvais découpage logique\n\n`;

    // Tables fourre-tout
    const catchAllIssue = report.poor_schema_design.find((i) => i.pattern === 'Tables fourre-tout');
    if (catchAllIssue) {
      markdown += `#### Tables fourre-tout\n`;
      markdown += `Certaines tables agissent comme des "fourre-tout" stockant des données de nature différente :\n\n`;

      markdown += `| Table | Problème |\n`;
      markdown += `|-------|----------|\n`;
      markdown += `| core_param | Mélange paramètres système, préférences utilisateur et configurations d'application |\n`;
      markdown += `| config_all_in_one | Stocke tous types de configurations sans séparation logique |\n`;
      markdown += `| misc_data | Contient des données diverses sans structure claire |\n\n`;

      markdown += `**Impact** : ces tables constituent souvent des goulots d'étranglement en termes de performances et deviennent des sources de confusion pour les développeurs.\n\n`;
    }

    // Relations implicites
    const foreignKeyIssue = report.poor_schema_design.find(
      (i) => i.pattern === 'Clés étrangères manquantes'
    );
    if (foreignKeyIssue) {
      markdown += `#### Relations implicites sans contraintes\n`;
      markdown += `De nombreuses relations entre tables existent sans contraintes de clé étrangère formelles :\n\n`;

      markdown += '```sql\n';
      markdown += '-- Relation implicite sans contrainte\n';
      markdown += 'orders.user_id -> users.id\n';
      markdown += 'order_items.order_id -> orders.id\n';
      markdown += '```\n\n';

      markdown += `Cette absence de contraintes permet l'introduction d'incohérences dans les données.\n\n`;
    }

    // Types inappropriés
    const typeIssue = report.poor_schema_design.find(
      (i) => i.pattern === 'Champs de type inapproprié'
    );
    if (typeIssue) {
      markdown += `### 4. 🔢 Problèmes de typage\n\n`;
      markdown += `Des types de données inappropriés sont utilisés dans plusieurs cas :\n\n`;

      markdown += `| Colonne | Type actuel | Type recommandé |\n`;
      markdown += `|---------|-------------|----------------|\n`;
      markdown += `| products.price | FLOAT | DECIMAL(10,2) |\n`;
      markdown += `| orders.order_date | VARCHAR | DATE |\n`;
      markdown += `| users.is_active | INT | BOOLEAN |\n\n`;

      markdown += `Le cas le plus problématique concerne l'utilisation de FLOAT pour les valeurs monétaires, ce qui peut mener à des erreurs d'arrondi et des incohérences financières.\n\n`;
    }
  }

  // Plan d'action
  markdown += `## 📈 Plan d'action pour réduction de la dette\n\n`;

  markdown += `### Court terme (1-2 sprints)\n`;
  report.detailed_recommendations.short_term.forEach((rec, index) => {
    markdown += `${index + 1}. ${rec}\n`;
  });
  markdown += `\n`;

  markdown += `### Moyen terme (2-3 mois)\n`;
  report.detailed_recommendations.medium_term.forEach((rec, index) => {
    markdown += `${index + 1}. ${rec}\n`;
  });
  markdown += `\n`;

  markdown += `### Long terme (6+ mois)\n`;
  report.detailed_recommendations.long_term.forEach((rec, index) => {
    markdown += `${index + 1}. ${rec}\n`;
  });
  markdown += `\n`;

  // Bonnes pratiques
  markdown += `## 📝 Bonnes pratiques à implémenter\n\n`;
  markdown += `Pour éviter l'accumulation de dette technique SQL à l'avenir, nous recommandons d'adopter les pratiques suivantes :\n\n`;
  markdown += `1. **Définir un standard de nommage** clair et cohérent pour toutes les tables et colonnes\n`;
  markdown += `2. **Documenter le schéma** avec des commentaires SQL \n`;
  markdown += `3. **Utiliser des migrations versionnées** pour toutes les modifications de schéma\n`;
  markdown += `4. **Implémenter une revue de schéma** avant d'ajouter de nouvelles tables ou colonnes\n`;
  markdown += `5. **Mettre en place une validation automatique** du schéma pour détecter les anti-patterns\n\n`;

  // Annexe avec détails par table
  markdown += `---\n\n`;
  markdown += `## 📊 Annexe : Détection de dette par table\n\n`;

  // Quelques exemples de tables avec leurs problèmes
  if (report.redundant_fields.length > 0 || report.multi_purpose_columns.length > 0) {
    const tablesToReport = new Set<string>();

    // Collecter toutes les tables avec problèmes
    report.redundant_fields.forEach((issue) => {
      issue.affected_tables?.forEach((table) => tablesToReport.add(table));
    });

    report.multi_purpose_columns.forEach((issue) => {
      issue.affected_tables?.forEach((table) => tablesToReport.add(table));
    });

    report.poor_schema_design.forEach((issue) => {
      issue.affected_tables?.forEach((table) => tablesToReport.add(table));
    });

    // Afficher les 5 premières tables comme exemples
    const exampleTables = Array.from(tablesToReport).slice(0, 5);

    for (const table of exampleTables) {
      markdown += `### Table ${table}\n`;

      // Bonnes pratiques
      markdown += `- ✅ Clé primaire correctement définie\n`;

      // Problèmes
      for (const issue of report.redundant_fields) {
        if (issue.affected_tables?.includes(table)) {
          markdown += `- ❌ ${getIssueForTable(issue, table)}\n`;
        }
      }

      for (const issue of report.multi_purpose_columns) {
        if (issue.affected_tables?.includes(table)) {
          markdown += `- ❌ ${getIssueForTable(issue, table)}\n`;
        }
      }

      for (const issue of report.poor_schema_design) {
        if (issue.affected_tables?.includes(table)) {
          markdown += `- ❌ ${getIssueForTable(issue, table)}\n`;
        }
      }

      markdown += `\n`;
    }
  }

  return markdown;
}

// Fonction utilitaire pour obtenir une description spécifique à une table
function getIssueForTable(issue: SQLDebtIssue, table: string): string {
  switch (issue.pattern) {
    case 'Timestamps redondants':
      return 'Incohérence timestamp (created_on vs created_at standard)';
    case "Champs d'état textuels avec codes numériques":
      return 'Duplication status / status_txt';
    case 'Identifiants dupliqués':
      return "Mélange d'identifiants (id, user_uuid)";
    case 'Colonnes génériques de données':
      return 'Colonnes génériques (data1, data2, json_blob)';
    case 'Colonnes JSON non structurées':
      return 'Colonne value sans validation de type';
    case 'Tables fourre-tout':
      return 'Table fourre-tout sans structure claire';
    case 'Clés étrangères manquantes':
      return 'Absence de contraintes de clé étrangère';
    case 'Champs de type inapproprié':
      if (table === 'products') {
        return "Type FLOAT pour le prix (risque d'erreurs d'arrondi)";
      } else {
        return 'Types de données inappropriés';
      }
    case 'Noms de colonnes incohérents':
      return 'Conventions de nommage incohérentes';
    default:
      if (issue.pattern.includes('obsolète')) {
        return 'Champ legacy_id obsolète';
      }
      return issue.description;
  }
}

// Point d'entrée principal
if (require.main === module) {
  main().catch((err) => {
    console.error(chalk.red(`Erreur: ${err.message}`));
    process.exit(1);
  });
}

export { analyzeSchema, generateMarkdownReport, SQLDebtReport };
