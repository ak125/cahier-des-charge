#!/usr/bin/env node
/**
 * postgresql-validator.ts
 *
 * Agent de validation qui vérifie l'alignement entre le schéma Prisma
 * et la base de données PostgreSQL déployée.
 *
 * Cet outil permet de:
 * - Valider que le schéma PostgreSQL correspond aux modèles Prisma
 * - Détecter les dérives entre le modèle et la base déployée
 * - Identifier les incohérences de type, contraintes ou relations
 * - Générer un rapport de conformité
 *
 * Usage: ts-node postgresql-validator.ts [options]
 *
 * Options:
 *   --connection=<url>      URL de connexion à la base de données PostgreSQL
 *   --schema=<path>         Chemin vers le fichier schema.prisma
 *   --output=<path>         Chemin vers le dossier de sortie pour les rapports
 *   --fix                   Tente de corriger automatiquement les problèmes mineurs détectés
 *   --report-format         Format du rapport (json, md, html)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@prisma/sdk';
import chalk from 'chalk';
import { program } from 'commander';
import { Client } from 'pg';

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description("Valide l'alignement entre le schéma Prisma et la base de données PostgreSQL")
  .option('--connection <url>', 'URL de connexion à la base de données PostgreSQL')
  .option(
    '--schema <path>',
    'Chemin vers le fichier schema.prisma',
    './apps/backend/prisma/schema.prisma'
  )
  .option('--output <path>', 'Chemin pour les rapports de validation', './reports/validation')
  .option('--fix', 'Tente de corriger automatiquement les problèmes mineurs détectés', false)
  .option('--report-format <format>', 'Format du rapport (json, md, html)', 'md')
  .parse(process.argv);

const options = program.opts();

// Classe pour stocker les problèmes détectés
class ValidationIssue implements BaseAgent, BusinessAgent, ValidatorAgent {
  constructor(
    public type:
      | 'TYPE_MISMATCH'
      | 'MISSING_COLUMN'
      | 'MISSING_TABLE'
      | 'MISSING_INDEX'
      | 'CONSTRAINT_MISMATCH'
      | 'EXTRA_COLUMN'
      | 'EXTRA_TABLE',
    public entity: string,
    public detail: string,
    public severity: 'HIGH' | 'MEDIUM' | 'LOW',
    public fixAvailable: boolean,
    public fixCommand?: string
  ) {}
}

interface PrismaModel {
  name: string;
  fields: PrismaField[];
  isEmbedded: boolean;
  dbName?: string;
}

interface PrismaField {
  name: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
  isId: boolean;
  isList: boolean;
  isUpdatedAt: boolean;
  hasDefaultValue: boolean;
  default?: any;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  dbName?: string;
  dbType?: string;
}

interface PostgresTable {
  name: string;
  columns: PostgresColumn[];
  indices: PostgresIndex[];
  constraints: PostgresConstraint[];
}

interface PostgresColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  characterMaximumLength?: number;
  numericPrecision?: number;
  numericScale?: number;
}

interface PostgresIndex {
  name: string;
  isUnique: boolean;
  columnNames: string[];
  indexType: string;
}

interface PostgresConstraint {
  name: string;
  type: string;
  definition: string;
}

interface ValidationResult {
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  timestamp: string;
  prismaSchemaPath: string;
  databaseConnection: string;
  summary: {
    tablesChecked: number;
    columnsChecked: number;
    indicesChecked: number;
    issuesFound: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  issues: ValidationIssue[];
  tablesWithoutIssues: string[];
  recommendations: string[];
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('🚀 Démarrage de la validation PostgreSQL-Prisma'));

    // Vérifier que le fichier schema.prisma existe
    const schemaPath = path.resolve(options.schema);
    if (!fs.existsSync(schemaPath)) {
      console.error(chalk.red(`❌ Erreur: Le fichier ${schemaPath} n'existe pas`));
      process.exit(1);
    }

    // Récupérer l'URL de connexion
    const connectionString = options.connection || process.env.DATABASE_URL;
    if (!connectionString) {
      console.error(chalk.red('❌ Erreur: URL de connexion à la base de données non spécifiée'));
      console.error(
        chalk.yellow(
          "Utilisez --connection=<url> ou définissez la variable d'environnement DATABASE_URL"
        )
      );
      process.exit(1);
    }

    // Créer le dossier de sortie s'il n'existe pas
    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Connexion à la base de données PostgreSQL
    console.log(chalk.blue('📡 Connexion à la base de données PostgreSQL...'));
    const client = new Client({
      connectionString,
    });
    await client.connect();

    try {
      // Extraire les informations du schéma Prisma
      console.log(chalk.blue('📝 Analyse du schéma Prisma...'));
      const prismaModels = await extractPrismaModels(schemaPath);

      // Extraire les informations du schéma PostgreSQL
      console.log(chalk.blue('📝 Extraction du schéma PostgreSQL...'));
      const postgresTables = await extractPostgresSchema(client);

      // Valider la correspondance entre les schémas
      console.log(chalk.blue('🔍 Validation de la correspondance entre les schémas...'));
      const validationResult = await validateSchemas(prismaModels, postgresTables);

      // Appliquer des corrections si demandé
      if (options.fix && validationResult.issues.some((issue) => issue.fixAvailable)) {
        console.log(chalk.blue('🔧 Application des corrections automatiques...'));
        await applyFixes(
          client,
          validationResult.issues.filter((issue) => issue.fixAvailable)
        );
      }

      // Générer le rapport de validation
      console.log(chalk.blue('📊 Génération du rapport de validation...'));
      const reportPath = await generateReport(validationResult, outputDir, options.reportFormat);

      console.log(chalk.green(`✅ Validation terminée! Rapport disponible: ${reportPath}`));

      if (validationResult.status === 'SUCCESS') {
        console.log(chalk.green('✅ Les schémas sont parfaitement alignés !'));
      } else if (validationResult.status === 'WARNING') {
        console.log(
          chalk.yellow(
            '⚠️ Les schémas présentent des différences mineures. Voir le rapport pour les détails.'
          )
        );
      } else {
        console.log(
          chalk.red(
            '❌ Des problèmes majeurs ont été détectés entre les schémas. Voir le rapport pour les détails.'
          )
        );
      }
    } finally {
      // Fermer la connexion PostgreSQL
      await client.end();
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Extrait les modèles du schéma Prisma
 */
async function extractPrismaModels(schemaPath: string): Promise<PrismaModel[]> {
  const prismaSchema = fs.readFileSync(schemaPath, 'utf8');

  // Utiliser l'API Prisma pour parser le schéma
  // Note: ceci est une implémentation simplifiée
  const models: PrismaModel[] = [];

  try {
    // Parser le schéma Prisma
    const schemaContent = prismaSchema.toString();
    const modelBlocks = schemaContent.match(/model\s+\w+\s*{[\s\S]*?}/g) || [];

    for (const modelBlock of modelBlocks) {
      // Extraire le nom du modèle
      const modelNameMatch = modelBlock.match(/model\s+(\w+)/);
      if (!modelNameMatch) continue;

      const modelName = modelNameMatch[1];

      // Extraire les annotations de table
      const dbNameMatch = modelBlock.match(/@map\(\s*["']([^"']*)["']\s*\)/);
      const dbName = dbNameMatch ? dbNameMatch[1] : modelName.toLowerCase();

      // Extraire les champs
      const fields: PrismaField[] = [];
      const fieldMatches = modelBlock.matchAll(
        /^\s*(\w+)\s+(\w+(?:\[\])?)\s*(?:@\s*([^{}]*))?(?:{([^}]*)})?/gm
      );

      for (const fieldMatch of fieldMatches) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const fieldAttributes = fieldMatch[3] || '';
        const fieldConfig = fieldMatch[4] || '';

        const isRequired = !fieldType.includes('?');
        const isList = fieldType.includes('[]');
        const isId = fieldAttributes.includes('@id');
        const isUnique = fieldAttributes.includes('@unique');
        const isUpdatedAt = fieldAttributes.includes('@updatedAt');
        const hasDefaultValue = fieldAttributes.includes('@default');

        // Extraire les attributs de relation si présents
        let relationName: string | undefined;
        let relationFromFields: string[] | undefined;
        let relationToFields: string[] | undefined;

        if (fieldAttributes.includes('@relation')) {
          const relationMatch = fieldAttributes.match(
            /@relation\(\s*["']?([^"',)]+)["']?(?:,\s*(?:fields:\s*\[(.*?)\],\s*references:\s*\[(.*?)\]))?/
          );
          if (relationMatch) {
            relationName = relationMatch[1];
            relationFromFields = relationMatch[2]
              ?.split(',')
              .map((f) => f.trim().replace(/["']/g, ''));
            relationToFields = relationMatch[3]
              ?.split(',')
              .map((f) => f.trim().replace(/["']/g, ''));
          }
        }

        // Extraire les attributs de type de base de données si présents
        let dbName: string | undefined;
        let dbType: string | undefined;

        const dbNameMatch = fieldAttributes.match(/@map\(\s*["']([^"']*)["']\s*\)/);
        if (dbNameMatch) {
          dbName = dbNameMatch[1];
        }

        const dbTypeMatch = fieldAttributes.match(/@db\.(\w+)(?:\(([^)]*)\))?/);
        if (dbTypeMatch) {
          dbType = dbTypeMatch[1] + (dbTypeMatch[2] ? `(${dbTypeMatch[2]})` : '');
        }

        // Extraire la valeur par défaut si présente
        let defaultValue: any = undefined;
        const defaultMatch = fieldAttributes.match(/@default\(\s*(.*?)\s*\)/);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }

        fields.push({
          name: fieldName,
          type: fieldType.replace('?', '').replace('[]', ''),
          isRequired,
          isUnique,
          isId,
          isList,
          isUpdatedAt,
          hasDefaultValue,
          default: defaultValue,
          relationName,
          relationFromFields,
          relationToFields,
          dbName,
          dbType,
        });
      }

      models.push({
        name: modelName,
        fields,
        isEmbedded: false,
        dbName,
      });
    }

    return models;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'analyse du schéma Prisma: ${error.message}`));
    throw error;
  }
}

/**
 * Extrait le schéma de la base de données PostgreSQL
 */
async function extractPostgresSchema(client: Client): Promise<PostgresTable[]> {
  const tables: PostgresTable[] = [];

  try {
    // Récupérer la liste des tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    const tablesResult = await client.query(tablesQuery);

    // Pour chaque table, récupérer les colonnes, les indices et les contraintes
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;

      // Récupérer les colonnes
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable = 'YES' as is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `;
      const columnsResult = await client.query(columnsQuery, [tableName]);

      // Récupérer les clés primaires
      const pkQuery = `
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
      `;
      const pksResult = await client.query(pkQuery, [tableName]);
      const primaryKeys = pksResult.rows.map((row) => row.column_name);

      // Récupérer les indices
      const indicesQuery = `
        SELECT
          i.relname as index_name,
          ix.indisunique as is_unique,
          array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as column_names,
          am.amname as index_type
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a,
          pg_am am
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = $1
          AND i.relam = am.oid
        GROUP BY
          i.relname,
          ix.indisunique,
          am.amname
      `;
      const indicesResult = await client.query(indicesQuery, [tableName]);

      // Récupérer les contraintes
      const constraintsQuery = `
        SELECT
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as definition
        FROM
          pg_constraint
        WHERE
          conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
      `;
      const constraintsResult = await client.query(constraintsQuery, [tableName]);

      // Construire l'objet table
      const columns = columnsResult.rows.map((col) => {
        return {
          name: col.column_name,
          dataType: col.data_type,
          isNullable: col.is_nullable,
          defaultValue: col.column_default,
          isPrimaryKey: primaryKeys.includes(col.column_name),
          characterMaximumLength: col.character_maximum_length,
          numericPrecision: col.numeric_precision,
          numericScale: col.numeric_scale,
        } as PostgresColumn;
      });

      const indices = indicesResult.rows.map((idx) => {
        return {
          name: idx.index_name,
          isUnique: idx.is_unique,
          columnNames: idx.column_names,
          indexType: idx.index_type,
        } as PostgresIndex;
      });

      const constraints = constraintsResult.rows.map((con) => {
        return {
          name: con.constraint_name,
          type: con.constraint_type,
          definition: con.definition,
        } as PostgresConstraint;
      });

      tables.push({
        name: tableName,
        columns,
        indices,
        constraints,
      });
    }

    return tables;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'extraction du schéma PostgreSQL: ${error.message}`));
    throw error;
  }
}

/**
 * Valide la correspondance entre les schémas Prisma et PostgreSQL
 */
async function validateSchemas(
  prismaModels: PrismaModel[],
  postgresTables: PostgresTable[]
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const tablesWithoutIssues: string[] = [];
  const recommendations: string[] = [];

  // Map pour une recherche plus facile
  const tablesMap = new Map<string, PostgresTable>();
  postgresTables.forEach((table) => {
    tablesMap.set(table.name, table);
  });

  // Vérifier chaque modèle Prisma
  for (const model of prismaModels) {
    const tableName = model.dbName || model.name.toLowerCase();
    const postgresTable = tablesMap.get(tableName);

    // Vérifier si la table existe
    if (!postgresTable) {
      issues.push(
        new ValidationIssue(
          'MISSING_TABLE',
          model.name,
          `La table "${tableName}" définie dans le modèle Prisma "${model.name}" n'existe pas dans la base de données`,
          'HIGH',
          false
        )
      );
      continue;
    }

    let tableHasIssue = false;

    // Map pour une recherche plus facile
    const columnsMap = new Map<string, PostgresColumn>();
    postgresTable.columns.forEach((column) => {
      columnsMap.set(column.name, column);
    });

    // Vérifier chaque champ du modèle
    for (const field of model.fields) {
      // Ignorer les champs de relation qui n'ont pas de correspondance directe en colonne
      if (field.relationName && !field.relationFromFields) {
        continue;
      }

      const columnName = field.dbName || field.name;
      const postgresColumn = columnsMap.get(columnName);

      // Vérifier si la colonne existe
      if (!postgresColumn) {
        // Si c'est un champ de relation, la colonne peut ne pas exister directement
        if (field.relationFromFields && field.relationFromFields.length > 0) {
          // Vérifier si toutes les colonnes de relation existent
          const missingColumns = field.relationFromFields.filter(
            (relField) => !columnsMap.has(relField)
          );
          if (missingColumns.length > 0) {
            issues.push(
              new ValidationIssue(
                'MISSING_COLUMN',
                `${model.name}.${field.name}`,
                `Les colonnes de relation ${missingColumns.join(
                  ', '
                )} définies dans le modèle Prisma n'existent pas dans la table "${tableName}"`,
                'HIGH',
                false
              )
            );
            tableHasIssue = true;
          }
        } else {
          issues.push(
            new ValidationIssue(
              'MISSING_COLUMN',
              `${model.name}.${field.name}`,
              `La colonne "${columnName}" définie dans le modèle Prisma n'existe pas dans la table "${tableName}"`,
              'HIGH',
              field.isRequired ? false : true,
              field.isRequired
                ? undefined
                : `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${mapPrismaTypeToPostgres(
                    field
                  )};`
            )
          );
          tableHasIssue = true;
        }
        continue;
      }

      // Vérifier la cohérence des types
      const expectedType = mapPrismaFieldToPostgresType(field);
      const actualType = mapPostgresColumnType(postgresColumn);

      if (!areTypesCompatible(expectedType, actualType)) {
        issues.push(
          new ValidationIssue(
            'TYPE_MISMATCH',
            `${model.name}.${field.name}`,
            `Type incompatible pour "${columnName}": attendu "${expectedType}", trouvé "${actualType}"`,
            'MEDIUM',
            true,
            `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${expectedType} USING "${columnName}"::${expectedType};`
          )
        );
        tableHasIssue = true;
      }

      // Vérifier la contrainte NOT NULL
      if (field.isRequired && postgresColumn.isNullable) {
        issues.push(
          new ValidationIssue(
            'CONSTRAINT_MISMATCH',
            `${model.name}.${field.name}`,
            `La colonne "${columnName}" devrait être NOT NULL`,
            'MEDIUM',
            true,
            `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`
          )
        );
        tableHasIssue = true;
      }

      // Vérifier si la colonne est une clé primaire
      if (field.isId && !postgresColumn.isPrimaryKey) {
        issues.push(
          new ValidationIssue(
            'CONSTRAINT_MISMATCH',
            `${model.name}.${field.name}`,
            `La colonne "${columnName}" devrait être une clé primaire`,
            'HIGH',
            false
          )
        );
        tableHasIssue = true;
      }
    }

    // Vérifier les colonnes en trop dans la base de données
    const modelColumnNames = new Set(model.fields.map((f) => f.dbName || f.name));
    const extraColumns = postgresTable.columns.filter(
      (col) =>
        !modelColumnNames.has(col.name) &&
        !col.name.endsWith('_id') && // Ignorer les potentielles clés étrangères
        !['created_at', 'updated_at'].includes(col.name)
    ); // Ignorer les timestamps standard

    if (extraColumns.length > 0) {
      extraColumns.forEach((col) => {
        issues.push(
          new ValidationIssue(
            'EXTRA_COLUMN',
            `${tableName}.${col.name}`,
            `La colonne "${col.name}" existe dans la base de données mais pas dans le modèle Prisma "${model.name}"`,
            'LOW',
            true,
            `ALTER TABLE "${tableName}" DROP COLUMN "${col.name}";`
          )
        );
      });
      tableHasIssue = true;
    }

    // Vérifier les indices définis dans Prisma
    // Cette partie est simplifiée et nécessiterait une implémentation plus complète
    // pour tenir compte de tous les types d'indices Prisma

    if (!tableHasIssue) {
      tablesWithoutIssues.push(tableName);
    }
  }

  // Vérifier les tables en trop dans la base de données
  const prismaTableNames = new Set(prismaModels.map((m) => m.dbName || m.name.toLowerCase()));
  const extraTables = postgresTables.filter(
    (table) =>
      !prismaTableNames.has(table.name) &&
      !table.name.includes('_prisma_') && // Ignorer les tables internes de Prisma
      !['migrations', 'schema_migrations', '_prisma_migrations'].includes(table.name)
  ); // Ignorer les tables de migration

  if (extraTables.length > 0) {
    extraTables.forEach((table) => {
      issues.push(
        new ValidationIssue(
          'EXTRA_TABLE',
          table.name,
          `La table "${table.name}" existe dans la base de données mais n'est définie dans aucun modèle Prisma`,
          'LOW',
          true,
          `DROP TABLE "${table.name}";`
        )
      );
    });
  }

  // Générer des recommandations
  if (issues.some((i) => i.type === 'TYPE_MISMATCH')) {
    recommendations.push(
      'Exécutez une migration Prisma pour mettre à jour les types de données incompatibles.'
    );
  }

  if (issues.some((i) => i.type === 'MISSING_COLUMN' && i.fixAvailable)) {
    recommendations.push(
      "Des colonnes manquantes non obligatoires peuvent être ajoutées en utilisant l'option --fix."
    );
  }

  if (issues.some((i) => i.type === 'MISSING_TABLE')) {
    recommendations.push(
      'Exécutez une migration Prisma complète pour créer les tables manquantes.'
    );
  }

  // Calculer le statut global et les statistiques
  const errorCount = issues.filter((i) => i.severity === 'HIGH').length;
  const warningCount = issues.filter((i) => i.severity === 'MEDIUM').length;
  const infoCount = issues.filter((i) => i.severity === 'LOW').length;

  let status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS';
  if (errorCount > 0) {
    status = 'ERROR';
  } else if (warningCount > 0) {
    status = 'WARNING';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    prismaSchemaPath: options.schema,
    databaseConnection: options.connection.replace(/:[^:]*@/, ':****@'),
    summary: {
      tablesChecked: prismaModels.length,
      columnsChecked: prismaModels.reduce((sum, model) => sum + model.fields.length, 0),
      indicesChecked: 0, // Simplifié, implémentation complète nécessaire
      issuesFound: issues.length,
      errorCount,
      warningCount,
      infoCount,
    },
    issues,
    tablesWithoutIssues,
    recommendations,
  };
}

/**
 * Applique les corrections automatiques pour les problèmes détectés
 */
async function applyFixes(client: Client, issues: ValidationIssue[]): Promise<void> {
  console.log(chalk.yellow(`🔧 Application de ${issues.length} correction(s) automatique(s)...`));

  // Trier les issues par type pour assurer un ordre logique d'exécution
  const sortedIssues = [...issues].sort((a, b) => {
    // Définir l'ordre de priorité des types de correction
    const order: Record<string, number> = {
      TYPE_MISMATCH: 1,
      CONSTRAINT_MISMATCH: 2,
      MISSING_COLUMN: 3,
      EXTRA_COLUMN: 4,
      EXTRA_TABLE: 5,
    };

    return order[a.type] - order[b.type];
  });

  // Grouper les corrections par table pour les exécuter ensemble
  const correctionsByTable = new Map<string, string[]>();

  for (const issue of sortedIssues) {
    if (!issue.fixCommand) continue;

    // Extraire le nom de la table à partir de la commande SQL
    const tableMatch = issue.fixCommand.match(/TABLE\s+"([^"]+)"/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      if (!correctionsByTable.has(tableName)) {
        correctionsByTable.set(tableName, []);
      }
      correctionsByTable.get(tableName)!.push(issue.fixCommand);
    } else {
      // Si on ne peut pas extraire le nom de la table, exécuter la commande individuellement
      try {
        console.log(chalk.blue(`Exécution de: ${issue.fixCommand}`));
        await client.query(issue.fixCommand);
        console.log(chalk.green(`✅ Correction appliquée pour: ${issue.entity}`));
      } catch (error) {
        console.error(
          chalk.red(
            `❌ Erreur lors de l'application de la correction pour ${issue.entity}: ${error.message}`
          )
        );
      }
    }
  }

  // Exécuter les corrections groupées par table
  for (const [tableName, commands] of correctionsByTable.entries()) {
    try {
      // Commencer une transaction
      await client.query('BEGIN');

      for (const command of commands) {
        console.log(chalk.blue(`Exécution de: ${command}`));
        await client.query(command);
      }

      // Valider la transaction
      await client.query('COMMIT');
      console.log(chalk.green(`✅ Corrections appliquées pour la table: ${tableName}`));
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      console.error(
        chalk.red(
          `❌ Erreur lors de l'application des corrections pour la table ${tableName}: ${error.message}`
        )
      );
    }
  }
}

/**
 * Génère un rapport de validation
 */
async function generateReport(
  result: ValidationResult,
  outputDir: string,
  format: string
): Promise<string> {
  const timestamp = result.timestamp.replace(/:/g, '-').slice(0, 19);
  let reportPath = '';

  switch (format.toLowerCase()) {
    case 'json':
      reportPath = path.join(outputDir, `validation-report-${timestamp}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
      break;

    case 'html':
      reportPath = path.join(outputDir, `validation-report-${timestamp}.html`);
      const htmlContent = generateHtmlReport(result);
      fs.writeFileSync(reportPath, htmlContent);
      break;

    case 'md':
    default:
      reportPath = path.join(outputDir, `validation-report-${timestamp}.md`);
      const mdContent = generateMarkdownReport(result);
      fs.writeFileSync(reportPath, mdContent);
      break;
  }

  return reportPath;
}

/**
 * Génère un rapport au format Markdown
 */
function generateMarkdownReport(result: ValidationResult): string {
  let markdown = `# Rapport de validation PostgreSQL-Prisma\n\n`;
  markdown += `*Généré le ${new Date(result.timestamp).toLocaleDateString('fr-FR')} à ${new Date(
    result.timestamp
  ).toLocaleTimeString('fr-FR')}*\n\n`;

  // En-tête et résumé
  markdown += `## 📊 Résumé\n\n`;

  const statusIcon = result.status === 'SUCCESS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
  markdown += `**Statut global:** ${statusIcon} ${result.status}\n\n`;
  markdown += `- **Fichier schema.prisma:** \`${result.prismaSchemaPath}\`\n`;
  markdown += `- **Connexion à la base de données:** \`${result.databaseConnection}\`\n`;
  markdown += `- **Tables vérifiées:** ${result.summary.tablesChecked}\n`;
  markdown += `- **Colonnes vérifiées:** ${result.summary.columnsChecked}\n`;
  markdown += `- **Problèmes trouvés:** ${result.summary.issuesFound}\n`;
  markdown += `  - Erreurs: ${result.summary.errorCount}\n`;
  markdown += `  - Avertissements: ${result.summary.warningCount}\n`;
  markdown += `  - Informations: ${result.summary.infoCount}\n\n`;

  // Tables sans problèmes
  if (result.tablesWithoutIssues.length > 0) {
    markdown += `## ✅ Tables sans problèmes\n\n`;
    result.tablesWithoutIssues.forEach((table) => {
      markdown += `- \`${table}\`\n`;
    });
    markdown += `\n`;
  }

  // Problèmes détectés
  if (result.issues.length > 0) {
    markdown += `## 🚨 Problèmes détectés\n\n`;

    // Groupe par sévérité
    const highIssues = result.issues.filter((i) => i.severity === 'HIGH');
    const mediumIssues = result.issues.filter((i) => i.severity === 'MEDIUM');
    const lowIssues = result.issues.filter((i) => i.severity === 'LOW');

    if (highIssues.length > 0) {
      markdown += `### 🔴 Problèmes critiques\n\n`;
      markdown += `| Entité | Problème | Correction disponible |\n`;
      markdown += `|--------|----------|----------------------|\n`;

      highIssues.forEach((issue) => {
        markdown += `| ${issue.entity} | ${issue.detail} | ${
          issue.fixAvailable ? 'Oui' : 'Non'
        } |\n`;
      });

      markdown += `\n`;
    }

    if (mediumIssues.length > 0) {
      markdown += `### 🟠 Avertissements\n\n`;
      markdown += `| Entité | Problème | Correction disponible |\n`;
      markdown += `|--------|----------|----------------------|\n`;

      mediumIssues.forEach((issue) => {
        markdown += `| ${issue.entity} | ${issue.detail} | ${
          issue.fixAvailable ? 'Oui' : 'Non'
        } |\n`;
      });

      markdown += `\n`;
    }

    if (lowIssues.length > 0) {
      markdown += `### 🟡 Informations\n\n`;
      markdown += `| Entité | Problème | Correction disponible |\n`;
      markdown += `|--------|----------|----------------------|\n`;

      lowIssues.forEach((issue) => {
        markdown += `| ${issue.entity} | ${issue.detail} | ${
          issue.fixAvailable ? 'Oui' : 'Non'
        } |\n`;
      });

      markdown += `\n`;
    }
  }

  // Scripts de correction
  const fixableIssues = result.issues.filter((i) => i.fixAvailable && i.fixCommand);
  if (fixableIssues.length > 0) {
    markdown += `## 🔧 Scripts de correction\n\n`;
    markdown += `Les commandes suivantes peuvent être utilisées pour corriger automatiquement certains problèmes:\n\n`;
    markdown += '```sql\n';

    fixableIssues.forEach((issue) => {
      markdown += `-- Correction pour ${issue.entity}: ${issue.detail}\n`;
      markdown += `${issue.fixCommand}\n\n`;
    });

    markdown += '```\n\n';
    markdown += `Pour appliquer ces corrections automatiquement, utilisez l'option \`--fix\`.\n\n`;
  }

  // Recommandations
  if (result.recommendations.length > 0) {
    markdown += `## 💡 Recommandations\n\n`;

    result.recommendations.forEach((recommendation) => {
      markdown += `- ${recommendation}\n`;
    });

    markdown += `\n`;
  }

  return markdown;
}

/**
 * Génère un rapport au format HTML
 */
function generateHtmlReport(result: ValidationResult): string {
  // Implémentation simplifiée du rapport HTML
  // Une version complète pourrait utiliser un moteur de templates plus sophistiqué

  const statusColor =
    result.status === 'SUCCESS' ? 'green' : result.status === 'WARNING' ? 'orange' : 'red';
  const statusIcon = result.status === 'SUCCESS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de validation PostgreSQL-Prisma</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .status {
      font-weight: bold;
      color: ${statusColor};
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .high { color: #e74c3c; }
    .medium { color: #e67e22; }
    .low { color: #f1c40f; }
    .code {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 10px;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>Rapport de validation PostgreSQL-Prisma</h1>
  <p><em>Généré le ${new Date(result.timestamp).toLocaleDateString('fr-FR')} à ${new Date(
    result.timestamp
  ).toLocaleTimeString('fr-FR')}</em></p>
  
  <h2>📊 Résumé</h2>
  <p><strong>Statut global:</strong> <span class="status">${statusIcon} ${result.status}</span></p>
  <ul>
    <li><strong>Fichier schema.prisma:</strong> <code>${result.prismaSchemaPath}</code></li>
    <li><strong>Connexion à la base de données:</strong> <code>${result.databaseConnection}</code></li>
    <li><strong>Tables vérifiées:</strong> ${result.summary.tablesChecked}</li>
    <li><strong>Colonnes vérifiées:</strong> ${result.summary.columnsChecked}</li>
    <li><strong>Problèmes trouvés:</strong> ${result.summary.issuesFound}
      <ul>
        <li>Erreurs: ${result.summary.errorCount}</li>
        <li>Avertissements: ${result.summary.warningCount}</li>
        <li>Informations: ${result.summary.infoCount}</li>
      </ul>
    </li>
  </ul>`;

  // Tables sans problèmes
  if (result.tablesWithoutIssues.length > 0) {
    html += `
  <h2>✅ Tables sans problèmes</h2>
  <ul>`;

    result.tablesWithoutIssues.forEach((table) => {
      html += `
    <li><code>${table}</code></li>`;
    });

    html += `
  </ul>`;
  }

  // Problèmes détectés
  if (result.issues.length > 0) {
    html += `
  <h2>🚨 Problèmes détectés</h2>`;

    // Groupe par sévérité
    const highIssues = result.issues.filter((i) => i.severity === 'HIGH');
    const mediumIssues = result.issues.filter((i) => i.severity === 'MEDIUM');
    const lowIssues = result.issues.filter((i) => i.severity === 'LOW');

    if (highIssues.length > 0) {
      html += `
  <h3 class="high">🔴 Problèmes critiques</h3>
  <table>
    <tr>
      <th>Entité</th>
      <th>Problème</th>
      <th>Correction disponible</th>
    </tr>`;

      highIssues.forEach((issue) => {
        html += `
    <tr>
      <td><code>${issue.entity}</code></td>
      <td>${issue.detail}</td>
      <td>${issue.fixAvailable ? 'Oui' : 'Non'}</td>
    </tr>`;
      });

      html += `
  </table>`;
    }

    if (mediumIssues.length > 0) {
      html += `
  <h3 class="medium">🟠 Avertissements</h3>
  <table>
    <tr>
      <th>Entité</th>
      <th>Problème</th>
      <th>Correction disponible</th>
    </tr>`;

      mediumIssues.forEach((issue) => {
        html += `
    <tr>
      <td><code>${issue.entity}</code></td>
      <td>${issue.detail}</td>
      <td>${issue.fixAvailable ? 'Oui' : 'Non'}</td>
    </tr>`;
      });

      html += `
  </table>`;
    }

    if (lowIssues.length > 0) {
      html += `
  <h3 class="low">🟡 Informations</h3>
  <table>
    <tr>
      <th>Entité</th>
      <th>Problème</th>
      <th>Correction disponible</th>
    </tr>`;

      lowIssues.forEach((issue) => {
        html += `
    <tr>
      <td><code>${issue.entity}</code></td>
      <td>${issue.detail}</td>
      <td>${issue.fixAvailable ? 'Oui' : 'Non'}</td>
    </tr>`;
      });

      html += `
  </table>`;
    }
  }

  // Scripts de correction
  const fixableIssues = result.issues.filter((i) => i.fixAvailable && i.fixCommand);
  if (fixableIssues.length > 0) {
    html += `
  <h2>🔧 Scripts de correction</h2>
  <p>Les commandes suivantes peuvent être utilisées pour corriger automatiquement certains problèmes:</p>
  <div class="code">`;

    fixableIssues.forEach((issue) => {
      html += `-- Correction pour ${issue.entity}: ${issue.detail}\n${issue.fixCommand}\n\n`;
    });

    html += `</div>
  <p>Pour appliquer ces corrections automatiquement, utilisez l'option <code>--fix</code>.</p>`;
  }

  // Recommandations
  if (result.recommendations.length > 0) {
    html += `
  <h2>💡 Recommandations</h2>
  <ul>`;

    result.recommendations.forEach((recommendation) => {
      html += `
    <li>${recommendation}</li>`;
    });

    html += `
  </ul>`;
  }

  html += `
</body>
</html>`;

  return html;
}

/**
 * Mappe un type de champ Prisma vers un type PostgreSQL
 */
function mapPrismaFieldToPostgresType(field: PrismaField): string {
  // Si un dbType est spécifié, l'utiliser directement
  if (field.dbType) {
    return field.dbType;
  }

  // Sinon, se baser sur le type Prisma
  switch (field.type) {
    case 'String':
      if (field.isId) return 'varchar(255)';
      return 'text';
    case 'Int':
      return 'integer';
    case 'BigInt':
      return 'bigint';
    case 'Float':
      return 'double precision';
    case 'Decimal':
      return 'decimal(65,30)';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return 'timestamp with time zone';
    case 'Date':
      return 'date';
    case 'Time':
      return 'time';
    case 'Json':
      return 'jsonb';
    case 'Bytes':
      return 'bytea';
    default:
      // Pour les types enum ou autres types personnalisés
      return 'text';
  }
}

/**
 * Mappe un type Prisma vers un type PostgreSQL
 */
function mapPrismaTypeToPostgres(field: PrismaField): string {
  const postgresType = mapPrismaFieldToPostgresType(field);

  // Ajouter les contraintes supplémentaires
  let result = postgresType;

  if (field.default !== undefined) {
    result += ` DEFAULT ${field.default}`;
  }

  if (field.isId && field.hasDefaultValue && field.default === 'autoincrement()') {
    // Pour les clés primaires auto-incrémentées
    return 'SERIAL PRIMARY KEY';
  }

  if (field.isId) {
    result += ' PRIMARY KEY';
  }

  if (field.isUnique) {
    result += ' UNIQUE';
  }

  if (!field.isRequired) {
    result += ' NULL';
  } else {
    result += ' NOT NULL';
  }

  return result;
}

/**
 * Mappe un type de colonne PostgreSQL vers un format standardisé
 */
function mapPostgresColumnType(column: PostgresColumn): string {
  let type = column.dataType.toLowerCase();

  // Ajouter la précision pour certains types
  if (
    column.characterMaximumLength &&
    ['character varying', 'varchar', 'char', 'character'].includes(type)
  ) {
    type = `${type}(${column.characterMaximumLength})`;
  }

  if (
    column.numericPrecision &&
    column.numericScale !== undefined &&
    ['numeric', 'decimal'].includes(type)
  ) {
    type = `${type}(${column.numericPrecision},${column.numericScale})`;
  }

  return type;
}

/**
 * Vérifie si deux types sont compatibles
 */
function areTypesCompatible(expectedType: string, actualType: string): boolean {
  // Normalisation des types pour comparaison
  expectedType = expectedType.toLowerCase();
  actualType = actualType.toLowerCase();

  // Cas de compatibilité directe
  if (expectedType === actualType) {
    return true;
  }

  // Cas de compatibilité entre types similaires
  const compatibilityMap: Record<string, string[]> = {
    integer: ['int', 'int4', 'serial'],
    bigint: ['int8', 'bigserial'],
    smallint: ['int2'],
    'double precision': ['float8', 'double'],
    real: ['float4', 'float'],
    text: ['varchar', 'character varying', 'char', 'character'],
    'timestamp with time zone': ['timestamptz'],
    'timestamp without time zone': ['timestamp'],
    jsonb: ['json'],
    boolean: ['bool'],
  };

  // Vérifier les compatibilités basées sur la normalisation
  for (const [baseType, compatibleTypes] of Object.entries(compatibilityMap)) {
    if (
      expectedType.startsWith(baseType) &&
      (actualType.startsWith(baseType) || compatibleTypes.some((t) => actualType.startsWith(t)))
    ) {
      return true;
    }

    if (
      actualType.startsWith(baseType) &&
      (expectedType.startsWith(baseType) || compatibleTypes.some((t) => expectedType.startsWith(t)))
    ) {
      return true;
    }
  }

  // Cas spécial pour varchar/text
  if (
    (expectedType.startsWith('varchar') || expectedType.startsWith('character varying')) &&
    actualType === 'text'
  ) {
    return true;
  }

  if (
    expectedType === 'text' &&
    (actualType.startsWith('varchar') || actualType.startsWith('character varying'))
  ) {
    return true;
  }

  return false;
}

// Exécuter la fonction principale
main().catch((error) => {
  console.error(chalk.red('Erreur inattendue:'), error);
  process.exit(1);
});

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import {
  BusinessAgent,
  ValidatorAgent,
} from '@workspaces/cahier-des-charge/src/core/interfaces/business';
