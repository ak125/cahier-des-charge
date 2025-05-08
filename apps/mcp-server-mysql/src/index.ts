/**
 * Point d'entrée principal du serveur MCP MySQL
 * Ce fichier est le point d'entrée pour l'analyse de structure MySQL et la génération
 * de fichiers pour la migration vers PostgreSQL via Prisma
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as mysql from 'mysql2/promise';
import { SchemaMap, SchemaMigrationDiffService } from './services/schema-migration-diff-service';
import { ColumnInfo, MigrationResult, RelationInfo, TableInfo } from './services/types';

// Charger les variables d'environnement
dotenv.config();

/**
 * Classe principale pour l'analyseur MySQL
 */
class MySqlAnalyzer {
  private connection: mysql.Connection | null = null;
  private schemaMap: SchemaMap | null = null;
  private migrationDiffService: SchemaMigrationDiffService;
  private startTime = 0;
  private workingDirectory: string;
  private databaseName = '';

  constructor(workingDirectory: string = process.cwd()) {
    this.migrationDiffService = new SchemaMigrationDiffService();
    this.workingDirectory = workingDirectory;
  }

  /**
   * Initialise la connexion à la base de données MySQL
   * @param connectionString Chaîne de connexion MySQL (mysql://user:pass@host:port/database)
   */
  async connect(connectionString: string): Promise<void> {
    try {
      console.log('Connexion à la base de données MySQL...');
      this.startTime = Date.now();

      // Extraction des informations depuis la chaîne de connexion
      const match = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d*)\/(.+)/);

      if (!match) {
        throw new Error(
          'Format de chaîne de connexion invalide. Utilisez: mysql://user:pass@host:port/database'
        );
      }

      const [_, user, password, host, port, database] = match;
      this.databaseName = database;

      // Établir la connexion
      this.connection = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port: port ? parseInt(port) : 3306,
      });

      console.log(`Connecté à la base de données ${database} sur ${host}`);
    } catch (error) {
      console.error('Erreur lors de la connexion à MySQL:', error);
      throw error;
    }
  }

  /**
   * Analyse la structure complète de la base de données
   */
  async analyzeSchema(): Promise<SchemaMap> {
    if (!this.connection) {
      throw new Error("Connexion MySQL non initialisée. Appelez d'abord connect().");
    }

    try {
      console.log('Analyse de la structure de la base de données...');

      // Récupérer toutes les tables
      const [tables] = await this.connection.query(
        `SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_COLLATION 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ?`,
        [this.databaseName]
      );

      const tableInfos: TableInfo[] = [];

      // Pour chaque table, analyser les colonnes, clés primaires, etc.
      for (const table of tables as any[]) {
        const tableName = table.TABLE_NAME;
        console.log(`Analyse de la table: ${tableName}`);

        // Récupérer les colonnes
        const [columns] = await this.connection.query(
          `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT, 
                  EXTRA, CHARACTER_SET_NAME, COLLATION_NAME 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
           ORDER BY ORDINAL_POSITION`,
          [this.databaseName, tableName]
        );

        // Récupérer la clé primaire
        const [primaryKeys] = await this.connection.query(
          `SELECT COLUMN_NAME 
           FROM information_schema.KEY_COLUMN_USAGE 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' 
           ORDER BY ORDINAL_POSITION`,
          [this.databaseName, tableName]
        );

        // Récupérer les clés étrangères
        const [foreignKeys] = await this.connection.query(
          `SELECT k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
                  r.UPDATE_RULE, r.DELETE_RULE, k.CONSTRAINT_NAME
           FROM information_schema.KEY_COLUMN_USAGE k
           JOIN information_schema.REFERENTIAL_CONSTRAINTS r
           ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND k.TABLE_SCHEMA = r.CONSTRAINT_SCHEMA
           WHERE k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? AND k.REFERENCED_TABLE_NAME IS NOT NULL
           ORDER BY k.ORDINAL_POSITION`,
          [this.databaseName, tableName]
        );

        // Récupérer les index
        const [indexes] = await this.connection.query(
          `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, INDEX_TYPE 
           FROM information_schema.STATISTICS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
           ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
          [this.databaseName, tableName]
        );

        // Traiter les colonnes
        const columnInfos: ColumnInfo[] = (columns as any[]).map((col) => ({
          name: col.COLUMN_NAME,
          type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          default: col.COLUMN_DEFAULT,
          comment: col.COLUMN_COMMENT,
          autoIncrement: col.EXTRA.includes('auto_increment'),
          unsigned: col.COLUMN_TYPE.includes('unsigned'),
        }));

        // Traiter les relations (clés étrangères)
        const relations: RelationInfo[] = [];
        const fkMap = new Map();

        (foreignKeys as any[]).forEach((fk) => {
          const constraintName = fk.CONSTRAINT_NAME;

          if (!fkMap.has(constraintName)) {
            fkMap.set(constraintName, {
              name: constraintName,
              field: fk.COLUMN_NAME,
              target: fk.REFERENCED_TABLE_NAME,
              targetField: fk.REFERENCED_COLUMN_NAME,
              type: 'n:1', // Par défaut n:1, à affiner si besoin
              onDelete: fk.DELETE_RULE,
              onUpdate: fk.UPDATE_RULE,
            });
          }
        });

        fkMap.forEach((relation) => {
          relations.push(relation);
        });

        // Traiter les index
        const indexMap = new Map();

        (indexes as any[]).forEach((idx) => {
          const indexName = idx.INDEX_NAME;
          const columnName = idx.COLUMN_NAME;
          const unique = idx.NON_UNIQUE === 0;
          const type = idx.INDEX_TYPE;

          if (!indexMap.has(indexName)) {
            indexMap.set(indexName, {
              name: indexName,
              columns: [],
              unique,
              type,
            });
          }

          indexMap.get(indexName).columns.push(columnName);
        });

        const indexInfos = Array.from(indexMap.values());

        // Construire l'information complète de la table
        const tableInfo: TableInfo = {
          name: tableName,
          columns: columnInfos,
          primaryKey: (primaryKeys as any[]).map((pk) => pk.COLUMN_NAME),
          relations: relations.length > 0 ? relations : undefined,
          indexes: indexInfos.length > 0 ? indexInfos : undefined,
          comment: table.TABLE_COMMENT,
          engine: table.ENGINE,
          collation: table.TABLE_COLLATION,
        };

        tableInfos.push(tableInfo);
      }

      // Construire la cartographie complète du schéma
      this.schemaMap = {
        tables: tableInfos,
        databaseName: this.databaseName,
        version: `1.0.0_${new Date().toISOString().split('T')[0]}`,
        exportDate: new Date().toISOString(),
        dialect: 'mysql',
      };

      console.log(`Analyse terminée: ${tableInfos.length} tables analysées`);

      return this.schemaMap;
    } catch (error) {
      console.error("Erreur lors de l'analyse du schéma:", error);
      throw error;
    }
  }

  /**
   * Génère le schéma Prisma à partir du schéma MySQL
   */
  async generatePrismaSchema(): Promise<string> {
    if (!this.schemaMap) {
      throw new Error("Schéma non analysé. Appelez d'abord analyzeSchema().");
    }

    console.log('Génération du schéma Prisma...');

    // Fonction utilitaire pour convertir en PascalCase
    const toPascalCase = (str: string) => {
      return str
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    };

    // Fonction pour convertir les types MySQL en types Prisma
    const convertToPrismaType = (column: ColumnInfo): string => {
      const type = column.type.toLowerCase();

      if (type === 'tinyint(1)') return 'Boolean';
      if (type.includes('tinyint')) return 'Int';
      if (type.includes('smallint')) return 'Int';
      if (type.includes('mediumint')) return 'Int';
      if (type.includes('int')) return 'Int';
      if (type.includes('bigint')) return 'BigInt';
      if (type.includes('decimal') || type.includes('numeric')) return 'Decimal';
      if (type.includes('float') || type.includes('double')) return 'Float';
      if (type.includes('char') || type.includes('varchar')) return 'String';
      if (type.includes('text')) return 'String';
      if (type.includes('blob')) return 'Bytes';
      if (type.includes('date') || type.includes('time')) return 'DateTime';
      if (type.includes('json')) return 'Json';
      if (type.includes('enum')) return 'String'; // Simplifié, idéalement convertir en enum Prisma

      return 'String'; // Par défaut
    };

    // Génération du schéma Prisma
    let prismaSchema = `// Schéma Prisma généré à partir de la base MySQL ${this.databaseName}
// Généré le ${new Date().toISOString()}
// Ce schéma est une suggestion et peut nécessiter des ajustements manuels

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // Générer les modèles pour chaque table
    for (const table of this.schemaMap.tables) {
      const modelName = toPascalCase(table.name);
      prismaSchema += `model ${modelName} {\n`;

      // Ajouter les champs
      for (const column of table.columns) {
        const fieldName = column.name;
        const prismaType = convertToPrismaType(column);
        let fieldLine = `  ${fieldName} ${prismaType}`;

        // Gérer la nullabilité
        if (column.nullable) {
          fieldLine += '?';
        }

        // Ajouter les attributs
        const attributes = [];

        // Clé primaire
        if (table.primaryKey?.includes(column.name)) {
          attributes.push('@id');

          // Auto-increment
          if (column.autoIncrement) {
            attributes.push('@default(autoincrement())');
          }
          // UUID
          else if (column.type.toLowerCase() === 'char(36)' || column.name.includes('uuid')) {
            attributes.push('@default(uuid())');
          }
        }

        // Valeur par défaut
        if (column.default !== null && column.default !== undefined && !column.autoIncrement) {
          if (prismaType === 'String') {
            attributes.push(`@default("${column.default}")`);
          } else if (prismaType === 'Boolean') {
            const boolValue = column.default === '1' || column.default.toLowerCase() === 'true';
            attributes.push(`@default(${boolValue})`);
          } else if (column.default.toLowerCase() === 'current_timestamp') {
            attributes.push('@default(now())');
          } else {
            attributes.push(`@default(${column.default})`);
          }
        }

        // Ajouter les attributs s'il y en a
        if (attributes.length > 0) {
          fieldLine += ` ${attributes.join(' ')}`;
        }

        prismaSchema += `${fieldLine}\n`;
      }

      // Ajouter les relations
      if (table.relations && table.relations.length > 0) {
        prismaSchema += '\n  // Relations\n';

        for (const relation of table.relations) {
          const targetModel = toPascalCase(relation.target);
          prismaSchema += `  ${relation.target} ${targetModel} @relation(fields: [${relation.field}], references: [${relation.targetField}]`;

          // Ajouter les règles onDelete/onUpdate si elles sont spécifiées
          const relationAttributes = [];
          if (relation.onDelete && relation.onDelete !== 'NO ACTION') {
            relationAttributes.push(`onDelete: ${relation.onDelete.toLowerCase()}`);
          }
          if (relation.onUpdate && relation.onUpdate !== 'NO ACTION') {
            relationAttributes.push(`onUpdate: ${relation.onUpdate.toLowerCase()}`);
          }

          if (relationAttributes.length > 0) {
            prismaSchema += `, ${relationAttributes.join(', ')}`;
          }

          prismaSchema += ')\n';
        }
      }

      // Fermer le modèle
      prismaSchema += '}\n\n';
    }

    // Enregistrer le schéma Prisma dans un fichier
    const prismaFilePath = path.join(this.workingDirectory, 'prisma_models.suggestion.prisma');
    await fs.writeFile(prismaFilePath, prismaSchema, 'utf8');

    console.log(`Schéma Prisma généré: ${prismaFilePath}`);

    return prismaSchema;
  }

  /**
   * Génère un rapport d'audit de qualité du schéma SQL
   */
  async generateQualityReport(): Promise<string> {
    if (!this.schemaMap) {
      throw new Error("Schéma non analysé. Appelez d'abord analyzeSchema().");
    }

    console.log("Génération du rapport d'audit de qualité...");

    const issues = {
      noPrimaryKey: [] as string[],
      excessiveNullables: [] as string[],
      poorColumnTypes: [] as string[],
      missingIndices: [] as string[],
      namingInconsistencies: [] as string[],
      redundantColumns: [] as string[],
    };

    // Analyser chaque table pour identifier les problèmes potentiels
    for (const table of this.schemaMap.tables) {
      // Vérifier si la table a une clé primaire
      if (!table.primaryKey || table.primaryKey.length === 0) {
        issues.noPrimaryKey.push(table.name);
      }

      // Vérifier les colonnes nullables excessives
      const nullableColumns = table.columns.filter((col) => col.nullable);
      if (nullableColumns.length > table.columns.length / 2) {
        issues.excessiveNullables.push(table.name);
      }

      // Vérifier les types de colonnes problématiques
      for (const column of table.columns) {
        const type = column.type.toLowerCase();

        // Vérifier les TEXT/BLOB pour les grandes données
        if (['text', 'mediumtext', 'longtext', 'blob', 'mediumblob', 'longblob'].includes(type)) {
          issues.poorColumnTypes.push(`${table.name}.${column.name} (${type})`);
        }

        // Vérifier les FLOAT pour les valeurs monétaires
        if (
          type.includes('float') &&
          ['price', 'amount', 'cost', 'prix', 'montant', 'cout'].some((term) =>
            column.name.toLowerCase().includes(term)
          )
        ) {
          issues.poorColumnTypes.push(
            `${table.name}.${column.name} (${type} pour valeur monétaire)`
          );
        }
      }

      // Vérifier les indices manquants sur les colonnes fréquemment utilisées
      const potentialIndexColumns = table.columns.filter(
        (col) =>
          col.name.endsWith('_id') &&
          (!table.indexes || !table.indexes.some((idx) => idx.columns.includes(col.name)))
      );

      if (potentialIndexColumns.length > 0) {
        for (const column of potentialIndexColumns) {
          issues.missingIndices.push(`${table.name}.${column.name}`);
        }
      }

      // Vérifier les incohérences de nommage
      const inconsistentNames = table.columns.filter(
        (col) =>
          col.name.includes('-') ||
          (col.name !== col.name.toLowerCase() && col.name !== col.name.toUpperCase())
      );

      if (inconsistentNames.length > 0) {
        for (const column of inconsistentNames) {
          issues.namingInconsistencies.push(`${table.name}.${column.name}`);
        }
      }

      // Détecter les colonnes potentiellement redondantes
      const columnNameCounts = new Map<string, number>();
      table.columns.forEach((col) => {
        const baseName = col.name.replace(/[0-9]+$/, '');
        columnNameCounts.set(baseName, (columnNameCounts.get(baseName) || 0) + 1);
      });

      columnNameCounts.forEach((count, baseName) => {
        if (count > 1) {
          issues.redundantColumns.push(`${table.name}.${baseName}* (${count} colonnes)`);
        }
      });
    }

    // Générer le rapport en Markdown
    let report = `# Rapport d'audit de qualité SQL - ${this.databaseName}

## Résumé

- **Base de données analysée:** ${this.databaseName}
- **Date d'analyse:** ${new Date().toISOString()}
- **Nombre de tables:** ${this.schemaMap.tables.length}
- **Dialect SQL:** MySQL

## Problèmes détectés

`;

    // Tables sans clé primaire
    if (issues.noPrimaryKey.length > 0) {
      report += `### Tables sans clé primaire (${issues.noPrimaryKey.length})

⚠️ **Critique:** Les tables suivantes n'ont pas de clé primaire définie, ce qui peut causer des problèmes de performance et d'intégrité des données:

${issues.noPrimaryKey.map((table) => `- \`${table}\``).join('\n')}

**Recommandation:** Ajouter une clé primaire à chaque table, idéalement une colonne \`id\` auto-incrémentée ou UUID.

`;
    }

    // Colonnes nullables excessives
    if (issues.excessiveNullables.length > 0) {
      report += `### Tables avec colonnes NULL excessives (${issues.excessiveNullables.length})

⚠️ **Avertissement:** Les tables suivantes ont plus de 50% de leurs colonnes définies comme NULL, ce qui pourrait indiquer un problème de conception:

${issues.excessiveNullables.map((table) => `- \`${table}\``).join('\n')}

**Recommandation:** Revoir la conception de ces tables et définir des valeurs par défaut appropriées ou NOT NULL lorsque possible.

`;
    }

    // Types de colonnes problématiques
    if (issues.poorColumnTypes.length > 0) {
      report += `### Types de colonnes sous-optimaux (${issues.poorColumnTypes.length})

⚠️ **Avertissement:** Les colonnes suivantes utilisent des types qui pourraient être sous-optimaux:

${issues.poorColumnTypes.map((col) => `- \`${col}\``).join('\n')}

**Recommandation:** Utiliser des types plus appropriés, comme VARCHAR avec une longueur définie au lieu de TEXT, ou DECIMAL au lieu de FLOAT pour les valeurs monétaires.

`;
    }

    // Indices manquants
    if (issues.missingIndices.length > 0) {
      report += `### Indices potentiellement manquants (${issues.missingIndices.length})

ℹ️ **Suggestion:** Les colonnes suivantes semblent être des clés étrangères mais n'ont pas d'index:

${issues.missingIndices.map((col) => `- \`${col}\``).join('\n')}

**Recommandation:** Ajouter des index sur ces colonnes pour améliorer les performances des jointures et des recherches.

`;
    }

    // Incohérences de nommage
    if (issues.namingInconsistencies.length > 0) {
      report += `### Incohérences de nommage (${issues.namingInconsistencies.length})

ℹ️ **Suggestion:** Les colonnes suivantes ont des noms qui ne suivent pas une convention cohérente:

${issues.namingInconsistencies.map((col) => `- \`${col}\``).join('\n')}

**Recommandation:** Adopter une convention de nommage cohérente (ex: snake_case) pour toutes les tables et colonnes.

`;
    }

    // Colonnes redondantes
    if (issues.redundantColumns.length > 0) {
      report += `### Colonnes potentiellement redondantes (${issues.redundantColumns.length})

ℹ️ **Suggestion:** Les groupes de colonnes suivants semblent être redondants ou auraient pu être normalisés:

${issues.redundantColumns.map((col) => `- \`${col}\``).join('\n')}

**Recommandation:** Envisager de normaliser ces données dans des tables séparées ou d'utiliser des structures JSON.

`;
    }

    // Recommandations générales pour la migration vers PostgreSQL
    report += `## Recommandations pour la migration vers PostgreSQL

### Types SQL à convertir

| Type MySQL | Type PostgreSQL recommandé | Remarques |
|------------|----------------------------|-----------|
| TINYINT(1) | BOOLEAN | Pour les valeurs booléennes |
| INT UNSIGNED | INTEGER ou BIGINT | PostgreSQL n'a pas de types non signés |
| DATETIME | TIMESTAMP | Pour les dates et heures |
| ENUM | TYPE personnalisé ou CHECK CONSTRAINT | PostgreSQL gère différemment les ENUMs |
| TEXT | TEXT | Similaire dans les deux systèmes |
| MEDIUMTEXT, LONGTEXT | TEXT | PostgreSQL a un seul type TEXT sans limitation de taille |

### Améliorations possibles

1. **Intégrité référentielle**: PostgreSQL applique strictement les contraintes de clé étrangère. Ajoutez des contraintes explicites.
2. **Types spécifiques**: Utilisez des types comme UUID, JSONB, ARRAY pour simplifier votre modèle.
3. **Transactions**: PostgreSQL a un meilleur support transactionnel, profitez-en pour renforcer l'intégrité des données.
4. **Indexation**: Utilisez les index GIN pour les recherches textuelles et JSONB.

### Considérations de migration

1. **Séquences**: Remplacer AUTO_INCREMENT par SERIAL ou IDENTITY.
2. **Fonctions**: Réécrire les procédures stockées et fonctions pour PostgreSQL.
3. **LIMIT/OFFSET**: La syntaxe est identique, mais certains détails de pagination peuvent différer.
4. **Case-sensitivity**: PostgreSQL est sensible à la casse des identifiants non entre guillemets.

`;

    // Enregistrer le rapport dans un fichier
    const reportPath = path.join(this.workingDirectory, 'sql_analysis.md');
    await fs.writeFile(reportPath, report, 'utf8');

    console.log(`Rapport d'audit de qualité généré: ${reportPath}`);

    return report;
  }

  /**
   * Enregistre la cartographie du schéma dans un fichier JSON
   */
  async saveSchemaMap(): Promise<string> {
    if (!this.schemaMap) {
      throw new Error("Schéma non analysé. Appelez d'abord analyzeSchema().");
    }

    const schemaMapPath = path.join(this.workingDirectory, 'mysql_schema_map.json');
    await fs.writeFile(schemaMapPath, JSON.stringify(this.schemaMap, null, 2), 'utf8');

    console.log(`Cartographie du schéma enregistrée: ${schemaMapPath}`);

    return schemaMapPath;
  }

  /**
   * Génère un rapport de différences entre le schéma MySQL et un schéma Prisma
   * @param prismaSchemaPath Chemin vers le fichier schema.prisma
   */
  async generateSchemaDiff(prismaSchemaPath: string): Promise<string> {
    if (!this.schemaMap) {
      throw new Error("Schéma non analysé. Appelez d'abord analyzeSchema().");
    }

    console.log('Génération du rapport de différences de schéma...');

    const schemaMapPath = path.join(this.workingDirectory, 'mysql_schema_map.json');
    const outputPath = path.join(this.workingDirectory, 'schema_migration_diff.json');

    await this.migrationDiffService.compareMySqlWithPrisma(
      schemaMapPath,
      prismaSchemaPath,
      outputPath
    );

    console.log(`Rapport de différences de schéma généré: ${outputPath}`);

    return outputPath;
  }

  /**
   * Exécute le processus complet d'analyse et de préparation à la migration
   */
  async runFullExport(): Promise<MigrationResult> {
    try {
      const startTime = Date.now();

      console.log("Démarrage du processus complet d'export...");

      // Analyser le schéma
      await this.analyzeSchema();

      // Sauvegarder la cartographie du schéma
      await this.saveSchemaMap();

      // Générer le schéma Prisma
      await this.generatePrismaSchema();

      // Générer le rapport d'audit de qualité
      await this.generateQualityReport();

      // Générer le rapport de différences (si un schéma Prisma existe déjà)
      const prismaSchemaPath = path.join(this.workingDirectory, 'prisma_models.suggestion.prisma');
      await this.generateSchemaDiff(prismaSchemaPath);

      const executionTimeMs = Date.now() - startTime;

      // Préparer le résultat
      const result: MigrationResult = {
        schemaName: this.databaseName,
        timestamp: new Date().toISOString(),
        tables: {
          total: this.schemaMap?.tables.length || 0,
          migrated: this.schemaMap?.tables.length || 0,
          skipped: 0,
          error: 0,
        },
        relations: {
          total:
            this.schemaMap?.tables.reduce(
              (acc, table) => acc + (table.relations?.length || 0),
              0
            ) || 0,
          migrated:
            this.schemaMap?.tables.reduce(
              (acc, table) => acc + (table.relations?.length || 0),
              0
            ) || 0,
          inferred: 0,
          error: 0,
        },
        prismaModels: this.schemaMap?.tables.map((t) => t.name) || [],
        errorMessages: [],
        warningMessages: [],
        executionTimeMs,
      };

      console.log(`Export complet terminé en ${executionTimeMs / 1000} secondes`);

      return result;
    } catch (error) {
      console.error("Erreur lors de l'export complet:", error);
      throw error;
    } finally {
      // Fermer la connexion
      if (this.connection) {
        await this.connection.end();
        this.connection = null;
      }
    }
  }

  /**
   * Ferme proprement la connexion à la base de données
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Connexion à la base de données fermée');
    }
  }
}

/**
 * Point d'entrée principal du programme
 */
async function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx MysqlAnalyzer <connection-string> [working-directory]');
    process.exit(1);
  }

  const connectionString = args[0];
  const workingDirectory = args[1] || process.cwd();

  try {
    // Créer l'analyseur
    const analyzer = new MySqlAnalyzer(workingDirectory);

    // Connexion à la base de données
    await analyzer.connect(connectionString);

    // Exécuter l'analyse complète
    const result = await analyzer.runFullExport();

    // Afficher un résumé des résultats
    console.log('\nRésumé de la migration:');
    console.log(`Base de données: ${result.schemaName}`);
    console.log(`Tables analysées: ${result.tables.total}`);
    console.log(`Relations détectées: ${result.relations.total}`);
    console.log(`Temps d'exécution: ${result.executionTimeMs / 1000} secondes`);
    console.log('\nFichiers générés:');
    console.log('- mysql_schema_map.json: Cartographie complète du schéma MySQL');
    console.log('- prisma_models.suggestion.prisma: Schéma Prisma suggéré');
    console.log(`- sql_analysis.md: Rapport d'audit de qualité`);
    console.log('- schema_migration_diff.json: Différences entre MySQL et Prisma');

    // Fermer la connexion
    await analyzer.close();
  } catch (error) {
    console.error("Erreur lors de l'exécution:", error);
    process.exit(1);
  }
}

// Exécuter le programme principal
if (require.main === module) {
  main().catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

// Exporter la classe principale pour une utilisation programmatique
export { MySqlAnalyzer };
