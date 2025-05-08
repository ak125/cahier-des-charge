/**
 * Activités Temporal pour SQL Analyzer & Prisma Builder
 * 
 * Ces activités remplacent le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 * qui était utilisé pour analyser les structures SQL et générer des modèles Prisma.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';

// Utilitaires
const execPromise = promisify(exec);
const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);

// Types pour les activités
export interface SQLAnalysisResult {
    tables: TableAnalysis[];
    relationships: RelationshipAnalysis[];
    dialect: string;
    metadata: {
        analyzedAt: string;
        databaseName?: string;
        schemaName?: string;
        totalTables: number;
        totalColumns: number;
        totalRelationships: number;
    };
}

export interface TableAnalysis {
    name: string;
    columns: ColumnAnalysis[];
    primaryKey?: string[];
    uniqueConstraints?: { name: string, columns: string[] }[];
    indices?: { name: string, columns: string[], unique: boolean }[];
    comment?: string;
}

export interface ColumnAnalysis {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    comment?: string;
    autoIncrement?: boolean;
    enumValues?: string[];
}

export interface RelationshipAnalysis {
    name?: string;
    sourceTable: string;
    sourceColumns: string[];
    targetTable: string;
    targetColumns: string[];
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    onDelete?: string;
    onUpdate?: string;
}

export interface PrismaGenerationOptions {
    modelNaming?: 'camelCase' | 'PascalCase' | 'snake_case';
    includeComments?: boolean;
    includeIndexes?: boolean;
    datasourceProvider?: string;
    datasourceName?: string;
    outputFormat?: 'prisma' | 'json';
    relationshipNaming?: 'explicit' | 'derived';
}

export interface PrismaSchemaResult {
    schema: string;
    models: number;
    enums: number;
    generatedAt: string;
    metadata?: any;
}

export interface ValidationResult {
    success: boolean;
    error?: string;
    warnings?: string[];
    details?: any;
}

export interface MigrationOptions {
    mode: 'dev' | 'deploy' | 'reset' | 'push';
    force?: boolean;
    skipSeed?: boolean;
    createOnly?: boolean;
}

export interface MigrationResult {
    success: boolean;
    migrationId?: string;
    appliedSteps?: number;
    warnings?: string[];
    error?: string;
    details?: any;
}

export interface SQLAnalysisConfig {
    connectionString: string;
    dialect: 'mysql' | 'postgres' | 'mssql';
    databaseName: string;
    tables?: string[];
    schema?: string;
    outputDir?: string;
    schemaOnly?: boolean;
    generatePrisma?: boolean;
    analyzePerformance?: boolean;
    excludeTables?: string[];
}

/**
 * Prépare la configuration et crée le répertoire de sortie
 */
export async function prepareAnalysis(
    input: SQLAnalysisConfig
): Promise<{ config: SQLAnalysisConfig; outputDir: string }> {
    // Configuration par défaut et validation
    const config: SQLAnalysisConfig = {
        ...input,
        databaseName: input.databaseName || 'application_db',
        outputDir: input.outputDir || `/workspaces/cahier-des-charge/reports/sql-audit-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}`,
        schemaOnly: input.schemaOnly !== false,
        generatePrisma: input.generatePrisma !== false,
        analyzePerformance: input.analyzePerformance !== false,
        excludeTables: input.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata']
    };

    // Vérification de la connexion
    if (!config.connectionString) {
        throw new Error("URL de connexion à la base de données non spécifiée");
    }

    if (!config.databaseName) {
        throw new Error("Nom de la base de données non spécifié");
    }

    // Créer le répertoire de sortie
    try {
        await mkdirPromise(config.outputDir, { recursive: true });
        console.log(`Répertoire de sortie créé: ${config.outputDir}`);
    } catch (error) {
        throw new Error(`Erreur lors de la création du répertoire de sortie: ${error.message}`);
    }

    return { config, outputDir: config.outputDir };
}

/**
 * Analyse les structures de tables SQL
 */
export async function analyzeSQL(input: {
    connectionString: string,
    dialect: 'mysql' | 'postgres' | 'mssql',
    databaseName: string,
    tables?: string[],
    schema?: string,
    excludeTables?: string[],
    outputDir: string,
    schemaOnly?: boolean
}): Promise<SQLAnalysisResult> {
    console.log(`Analyzing SQL structure for ${input.dialect} database: ${input.databaseName}`);

    try {
        // Exécuter le script d'analyse SQL
        const cmd = `cd /workspaces/cahier-des-charge && ts-node migrations/legacy/migration-2025-04-18/agents/migration/sql-analyzer+prisma-builder.ts --connection="${input.connectionString}" --database="${input.databaseName}" --output-dir="${input.outputDir}" --schema-only=${input.schemaOnly === false ? 'false' : 'true'} ${input.excludeTables ? `--exclude-tables="${input.excludeTables.join(',')}"` : ''}`;

        console.log(`Exécution de la commande: ${cmd}`);
        const { stdout, stderr } = await execPromise(cmd, { timeout: 600000 });

        if (stderr) {
            console.warn(`Avertissements lors de l'analyse SQL: ${stderr}`);
        }

        // Vérifier que l'analyse a généré le fichier de schéma
        const schemaFilePath = path.join(input.outputDir, 'mysql_schema_map.json');

        if (!fs.existsSync(schemaFilePath)) {
            throw new Error(`L'analyse n'a pas généré le fichier de schéma: ${schemaFilePath}`);
        }

        // Lire le fichier de schéma généré
        const schemaContent = await readFilePromise(schemaFilePath, 'utf8');
        const schemaData = JSON.parse(schemaContent);

        // Construire le résultat de l'analyse
        return {
            tables: schemaData.tables || [],
            relationships: schemaData.relationships || [],
            dialect: input.dialect,
            metadata: {
                analyzedAt: new Date().toISOString(),
                databaseName: input.databaseName,
                schemaName: input.schema,
                totalTables: Object.keys(schemaData.tables || {}).length,
                totalColumns: Object.values(schemaData.tables || {}).reduce((count: number, table: any) =>
                    count + Object.keys(table.columns || {}).length, 0),
                totalRelationships: (schemaData.relationships || []).length
            }
        };
    } catch (error) {
        console.error(`Erreur lors de l'analyse SQL: ${error}`);
        throw new Error(`Erreur lors de l'analyse SQL: ${error.message}`);
    }
}

/**
 * Génère un schéma Prisma à partir d'une analyse SQL
 */
export async function generatePrismaSchema(input: {
    analysis: SQLAnalysisResult,
    options: PrismaGenerationOptions,
    outputDir: string
}): Promise<PrismaSchemaResult> {
    console.log(`Generating Prisma schema with ${input.analysis.tables.length} tables`);

    try {
        // Vérifier si le fichier Prisma a été généré par l'analyse
        const prismaFilePath = path.join(input.outputDir, 'prisma_models.suggestion.prisma');

        if (!fs.existsSync(prismaFilePath)) {
            throw new Error(`Le fichier Prisma n'a pas été généré: ${prismaFilePath}`);
        }

        // Lire le schéma Prisma généré
        const prismaSchema = await readFilePromise(prismaFilePath, 'utf8');

        // Compter les modèles et les énumérations
        const modelCount = (prismaSchema.match(/model\s+\w+\s+{/g) || []).length;
        const enumCount = (prismaSchema.match(/enum\s+\w+\s+{/g) || []).length;

        return {
            schema: prismaSchema,
            models: modelCount,
            enums: enumCount,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Erreur lors de la génération du schéma Prisma: ${error}`);
        throw new Error(`Erreur lors de la génération du schéma Prisma: ${error.message}`);
    }
}

/**
 * Valide un schéma Prisma généré
 */
export async function validatePrismaSchema(input: {
    schema: string,
    connectionString: string,
    outputDir: string
}): Promise<ValidationResult> {
    console.log(`Validating Prisma schema`);

    try {
        // Créer un fichier temporaire pour valider le schéma Prisma
        const tempSchemaPath = path.join(input.outputDir, 'temp_schema_for_validation.prisma');
        await writeFilePromise(tempSchemaPath, input.schema);

        // Exécuter la validation du schéma avec Prisma CLI
        const cmd = `cd ${input.outputDir} && npx prisma validate --schema=${tempSchemaPath}`;
        await execPromise(cmd);

        // Si aucune erreur n'est lancée, la validation est réussie
        return {
            success: true,
            warnings: []
        };
    } catch (error) {
        // Erreur de validation du schéma
        return {
            success: false,
            error: error.message,
            warnings: [error.stdout]
        };
    }
}

/**
 * Applique une migration Prisma
 */
export async function applyMigration(input: {
    schema: string,
    connectionString: string,
    options: MigrationOptions,
    outputDir: string
}): Promise<MigrationResult> {
    console.log(`Applying Prisma migration in ${input.options.mode} mode`);

    try {
        // Créer un dossier de projet Prisma temporaire
        const prismaTempDir = path.join(input.outputDir, 'prisma-migration-temp');
        await mkdirPromise(prismaTempDir, { recursive: true });

        // Créer les fichiers nécessaires
        const schemaPath = path.join(prismaTempDir, 'schema.prisma');
        const envPath = path.join(prismaTempDir, '.env');

        // Écrire le schéma Prisma
        await writeFilePromise(schemaPath, input.schema);

        // Écrire le fichier .env avec la connexion à la base de données
        await writeFilePromise(envPath, `DATABASE_URL="${input.connectionString}"`);

        // Exécuter la commande de migration Prisma
        let cmd = `cd ${prismaTempDir} && npx prisma`;

        switch (input.options.mode) {
            case 'dev':
                cmd += ` migrate dev --name migration_${Date.now()}`;
                break;
            case 'deploy':
                cmd += ' migrate deploy';
                break;
            case 'reset':
                cmd += ' migrate reset';
                break;
            case 'push':
                cmd += ' db push';
                break;
            default:
                throw new Error(`Mode de migration non supporté: ${input.options.mode}`);
        }

        if (input.options.force) {
            cmd += ' --force';
        }

        if (input.options.skipSeed) {
            cmd += ' --skip-seed';
        }

        const { stdout, stderr } = await execPromise(cmd);

        // Vérifier s'il y a des avertissements
        const warnings = stderr ? [stderr] : [];

        return {
            success: true,
            migrationId: `migration_${Date.now()}`,
            appliedSteps: 1,
            warnings: warnings,
            details: { stdout, stderr }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            warnings: [error.stderr],
            details: { error: error.toString() }
        };
    }
}

/**
 * Vérifie que tous les fichiers attendus ont été générés
 */
export async function verifyGeneratedFiles(input: {
    outputDir: string,
    expectedFiles?: string[]
}): Promise<{
    success: boolean,
    files: string[],
    missing: string[]
}> {
    console.log(`Vérification des fichiers générés dans: ${input.outputDir}`);

    // Liste des fichiers attendus par défaut
    const expectedFiles = input.expectedFiles || [
        'mysql_schema_map.json',
        'sql_analysis.md',
        'prisma_models.suggestion.prisma',
        'schema_migration_diff.json',
        'migration_plan.md',
        'entity_graph.json',
        'sql_index_suggestions.sql',
        'sql_backlog.json'
    ];

    // Vérifier l'existence des fichiers
    const existingFiles: string[] = [];
    const missingFiles: string[] = [];

    for (const file of expectedFiles) {
        const filePath = path.join(input.outputDir, file);
        if (fs.existsSync(filePath)) {
            existingFiles.push(file);
        } else {
            missingFiles.push(file);
        }
    }

    const success = missingFiles.length === 0;

    return {
        success,
        files: existingFiles,
        missing: missingFiles
    };
}

/**
 * Commit les fichiers générés dans Git
 */
export async function commitFilesToGit(input: {
    outputDir: string,
    branchName?: string,
    commitMessage?: string,
    author?: string
}): Promise<{ success: boolean, branchName: string, message?: string }> {
    console.log(`Commit des fichiers générés dans Git`);

    const timestamp = new Date().toISOString().slice(0, 10);
    const branchName = input.branchName || `audit-sql-${timestamp}`;
    const commitMessage = input.commitMessage || 'Audit SQL et génération de modèles Prisma automatisés';

    try {
        // Séquence de commandes Git
        const commands = [
            `cd /workspaces/cahier-des-charge`,
            `git checkout -b ${branchName}`,
            `git add ${input.outputDir}/*`,
            `git commit -m "${commitMessage}"`
        ];

        // Exécuter les commandes
        await execPromise(commands.join(' && '));

        return {
            success: true,
            branchName
        };
    } catch (error) {
        return {
            success: false,
            branchName,
            message: error.message
        };
    }
}

/**
 * Créer une archive des fichiers générés
 */
export async function createArchive(input: {
    outputDir: string
}): Promise<{ success: boolean, archivePath: string }> {
    console.log(`Création d'une archive des fichiers générés`);

    const archivePath = `${input.outputDir}.zip`;

    try {
        // Créer l'archive
        await execPromise(`cd /workspaces/cahier-des-charge && zip -r ${archivePath} ${input.outputDir}/*`);

        return {
            success: true,
            archivePath
        };
    } catch (error) {
        return {
            success: false,
            archivePath,
            error: error.message
        };
    }
}

/**
 * Créer un résumé de l'exécution
 */
export async function generateExecutionSummary(input: {
    config: SQLAnalysisConfig,
    outputDir: string,
    files: string[],
    branchName?: string
}): Promise<{
    summary: {
        success: boolean,
        timestamp: string,
        database: string,
        outputDirectory: string,
        filesGenerated: string[],
        gitBranch?: string
    },
    summaryPath: string
}> {
    console.log(`Génération du résumé d'exécution`);

    const summary = {
        success: true,
        timestamp: new Date().toISOString(),
        database: input.config.databaseName,
        outputDirectory: input.outputDir,
        filesGenerated: input.files,
        gitBranch: input.branchName
    };

    // Chemin du fichier de résumé
    const summaryPath = path.join(input.outputDir, 'execution_summary.json');

    // Sauvegarder le résumé
    await writeFilePromise(summaryPath, JSON.stringify(summary, null, 2));

    return {
        summary,
        summaryPath
    };
}