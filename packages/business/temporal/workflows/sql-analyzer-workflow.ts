/**
 * Workflow Temporal pour SQL Analyzer & Prisma Builder
 * 
 * Ce workflow remplace le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 * qui était utilisé pour analyser les structures SQL et générer des modèles Prisma.
 */

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/sql-analyzer-activities';

// Types pour le workflow
export interface WorkflowInput {
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
    validateSchema?: boolean;
    applyMigration?: boolean;
    commitToGit?: boolean;
    createArchive?: boolean;
    prismaOptions?: activities.PrismaGenerationOptions;
    migrationOptions?: activities.MigrationOptions;
    gitOptions?: {
        branchName?: string;
        commitMessage?: string;
        author?: string;
    };
}

export interface WorkflowResult {
    status: 'completed' | 'error';
    message?: string;
    schema?: string;
    analysisDetails?: activities.SQLAnalysisResult;
    tables?: string[];
    outputDir?: string;
    files?: string[];
    gitBranch?: string;
    archivePath?: string;
    validationResult?: activities.ValidationResult;
    migrationResult?: activities.MigrationResult;
    completedAt?: string;
    executionSummary?: any;
}

// Configuration par défaut pour la génération de schéma Prisma
const defaultPrismaOptions: activities.PrismaGenerationOptions = {
    modelNaming: 'PascalCase',
    includeComments: true,
    includeIndexes: true,
    datasourceProvider: 'postgresql',
    datasourceName: 'db',
    outputFormat: 'prisma',
    relationshipNaming: 'explicit',
};

// Configuration par défaut pour les migrations
const defaultMigrationOptions: activities.MigrationOptions = {
    mode: 'dev',
    force: false,
    skipSeed: true,
    createOnly: false,
};

// Définition du workflow principal
export async function sqlAnalyzerPrismaBuilderWorkflow(
    input: WorkflowInput
): Promise<WorkflowResult> {
    // Initialisation des proxies pour les activités
    const {
        prepareAnalysis,
        analyzeSQL,
        generatePrismaSchema,
        validatePrismaSchema,
        applyMigration,
        verifyGeneratedFiles,
        commitFilesToGit,
        createArchive,
        generateExecutionSummary
    } = proxyActivities<typeof activities>({
        startToCloseTimeout: '30 minutes',
        retry: {
            maximumAttempts: 3,
            initialInterval: '1 second',
        },
    });

    try {
        // Étape 1: Préparation de l'analyse
        const { config, outputDir } = await prepareAnalysis({
            connectionString: input.connectionString,
            dialect: input.dialect,
            databaseName: input.databaseName,
            tables: input.tables,
            schema: input.schema,
            outputDir: input.outputDir,
            schemaOnly: input.schemaOnly,
            generatePrisma: input.generatePrisma,
            analyzePerformance: input.analyzePerformance,
            excludeTables: input.excludeTables
        });

        // Étape 2: Analyse des structures SQL
        const analysisResult = await analyzeSQL({
            connectionString: config.connectionString,
            dialect: config.dialect,
            databaseName: config.databaseName,
            tables: config.tables,
            schema: config.schema,
            excludeTables: config.excludeTables,
            outputDir,
            schemaOnly: config.schemaOnly
        });

        // Étape 3: Vérifier les fichiers générés
        const fileVerification = await verifyGeneratedFiles({
            outputDir
        });

        if (!fileVerification.success) {
            return {
                status: 'error',
                message: `Certains fichiers attendus n'ont pas été générés: ${fileVerification.missing.join(', ')}`,
                outputDir,
                files: fileVerification.files,
                completedAt: new Date().toISOString(),
            };
        }

        // Étape 4: Génération du schéma Prisma (si demandé et non déjà généré)
        let prismaSchema: activities.PrismaSchemaResult;
        if (config.generatePrisma) {
            prismaSchema = await generatePrismaSchema({
                analysis: analysisResult,
                options: input.prismaOptions || defaultPrismaOptions,
                outputDir
            });
        } else {
            // Si generatePrisma est false, on crée un résultat vide pour continuer le workflow
            prismaSchema = {
                schema: '',
                models: 0,
                enums: 0,
                generatedAt: new Date().toISOString()
            };
        }

        // Étape 5: Validation du schéma (si demandé et si un schéma a été généré)
        let validationResult;
        if (input.validateSchema && prismaSchema.schema) {
            validationResult = await validatePrismaSchema({
                schema: prismaSchema.schema,
                connectionString: input.connectionString,
                outputDir
            });

            // Vérifier si la validation a échoué
            if (!validationResult.success) {
                return {
                    status: 'error',
                    message: `Schema validation failed: ${validationResult.error}`,
                    schema: prismaSchema.schema,
                    analysisDetails: analysisResult,
                    outputDir,
                    files: fileVerification.files,
                    validationResult,
                    completedAt: new Date().toISOString(),
                };
            }
        }

        // Étape 6: Application de la migration (si demandé)
        let migrationResult;
        if (input.applyMigration && prismaSchema.schema) {
            migrationResult = await applyMigration({
                schema: prismaSchema.schema,
                connectionString: input.connectionString,
                options: input.migrationOptions || defaultMigrationOptions,
                outputDir
            });

            // Vérifier si la migration a échoué
            if (!migrationResult.success) {
                return {
                    status: 'error',
                    message: `Migration failed: ${migrationResult.error}`,
                    schema: prismaSchema.schema,
                    analysisDetails: analysisResult,
                    outputDir,
                    files: fileVerification.files,
                    validationResult,
                    migrationResult,
                    completedAt: new Date().toISOString(),
                };
            }
        }

        // Étape 7: Commit dans Git (si demandé)
        let gitResult;
        if (input.commitToGit) {
            gitResult = await commitFilesToGit({
                outputDir,
                branchName: input.gitOptions?.branchName,
                commitMessage: input.gitOptions?.commitMessage,
                author: input.gitOptions?.author
            });
        }

        // Étape 8: Création d'archive (si demandé)
        let archiveResult;
        if (input.createArchive) {
            archiveResult = await createArchive({
                outputDir
            });
        }

        // Étape 9: Génération du résumé d'exécution
        const executionSummary = await generateExecutionSummary({
            config,
            outputDir,
            files: fileVerification.files,
            branchName: gitResult?.branchName
        });

        // Résultat final
        return {
            status: 'completed',
            schema: prismaSchema.schema,
            analysisDetails: analysisResult,
            tables: Object.keys(analysisResult.tables || {}),
            outputDir,
            files: fileVerification.files,
            gitBranch: gitResult?.branchName,
            archivePath: archiveResult?.archivePath,
            validationResult,
            migrationResult,
            executionSummary: executionSummary.summary,
            completedAt: new Date().toISOString(),
        };
    } catch (error) {
        // Gestion des erreurs générales
        return {
            status: 'error',
            message: `Workflow failed with error: ${error instanceof Error ? error.message : String(error)}`,
            completedAt: new Date().toISOString(),
        };
    }
}