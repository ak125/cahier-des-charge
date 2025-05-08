/**
 * Client pour le workflow SQL Analyzer & Prisma Builder
 * 
 * Cette classe fournit une interface pour utiliser le workflow Temporal
 * qui remplace le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 */

import { Connection, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import type { WorkflowInput, WorkflowResult } from '../workflows/sql-analyzer-workflow';
import type * as activities from '../activities/sql-analyzer-activities';

/**
 * Client API pour SQL Analyzer & Prisma Builder
 */
export class SQLAnalyzerPrismaBuilder {
    private client: WorkflowClient;

    /**
     * Constructeur 
     * @param connection Connexion Temporal
     */
    constructor(connection: Connection) {
        this.client = new WorkflowClient({
            connection,
        });
    }

    /**
     * Analyse une base de données et génère un schéma Prisma
     */
    async analyze(options: WorkflowInput): Promise<string> {
        const workflowId = `sql-analyzer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        await this.client.start('sqlAnalyzerPrismaBuilderWorkflow', {
            taskQueue: 'sql-analyzer-queue',
            workflowId,
            args: [options],
        });

        return workflowId;
    }

    /**
     * Version simplifiée pour l'analyse rapide
     * Cette méthode fournit une interface simple pour les cas d'utilisation courants
     */
    async quickAnalyze(options: {
        connectionString: string;
        databaseName: string;
        dialect?: 'mysql' | 'postgres' | 'mssql';
        outputDir?: string;
        commitToGit?: boolean;
        excludeTables?: string[];
    }): Promise<string> {
        return this.analyze({
            connectionString: options.connectionString,
            dialect: options.dialect || 'mysql',
            databaseName: options.databaseName,
            outputDir: options.outputDir,
            schemaOnly: true,
            generatePrisma: true,
            analyzePerformance: true,
            validateSchema: false,
            applyMigration: false,
            commitToGit: options.commitToGit || false,
            createArchive: true,
            excludeTables: options.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata'],
        });
    }

    /**
     * Vérifie le statut d'une analyse en cours
     */
    async getStatus(workflowId: string): Promise<WorkflowResult> {
        const handle: WorkflowHandle<unknown> = this.client.getHandle(workflowId);

        try {
            // Vérifier si le workflow est terminé
            const result = await handle.result() as WorkflowResult;
            return result;
        } catch (error) {
            // Workflow en cours ou erreur
            const description = await handle.describe();

            return {
                status: description.status.name === 'RUNNING' ? 'completed' : 'error',
                message: `Workflow is ${description.status.name.toLowerCase()}`,
                completedAt: description.status.name === 'COMPLETED' ?
                    new Date(description.status.endTime!).toISOString() : undefined
            };
        }
    }

    /**
     * Annule une analyse en cours
     */
    async cancelAnalysis(workflowId: string): Promise<boolean> {
        const handle = this.client.getHandle(workflowId);

        try {
            await handle.cancel();
            return true;
        } catch (error) {
            console.error(`Failed to cancel workflow ${workflowId}:`, error);
            return false;
        }
    }

    /**
     * Récupère le résultat du schéma généré
     */
    async getGeneratedSchema(workflowId: string): Promise<string | null> {
        try {
            const result = await this.getStatus(workflowId);

            if (result.status === 'completed' && result.schema) {
                return result.schema;
            }

            return null;
        } catch (error) {
            console.error(`Error getting schema for workflow ${workflowId}:`, error);
            return null;
        }
    }

    /**
     * Récupère les fichiers générés par l'analyse
     */
    async getGeneratedFiles(workflowId: string): Promise<string[] | null> {
        try {
            const result = await this.getStatus(workflowId);

            if (result.status === 'completed' && result.files) {
                return result.files;
            }

            return null;
        } catch (error) {
            console.error(`Error getting files for workflow ${workflowId}:`, error);
            return null;
        }
    }

    /**
     * Récupère le chemin du répertoire de sortie
     */
    async getOutputDirectory(workflowId: string): Promise<string | null> {
        try {
            const result = await this.getStatus(workflowId);

            if (result.status === 'completed' && result.outputDir) {
                return result.outputDir;
            }

            return null;
        } catch (error) {
            console.error(`Error getting output directory for workflow ${workflowId}:`, error);
            return null;
        }
    }

    /**
     * Récupère le résumé de l'exécution
     */
    async getExecutionSummary(workflowId: string): Promise<any | null> {
        try {
            const result = await this.getStatus(workflowId);

            if (result.status === 'completed' && result.executionSummary) {
                return result.executionSummary;
            }

            return null;
        } catch (error) {
            console.error(`Error getting execution summary for workflow ${workflowId}:`, error);
            return null;
        }
    }
}

// Factory pour créer une instance du client
export async function createSQLAnalyzerClient(): Promise<SQLAnalyzerPrismaBuilder> {
    // Se connecter au serveur Temporal
    const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    return new SQLAnalyzerPrismaBuilder(connection);
}

// Exporter une instance par défaut pour une utilisation simplifiée
let defaultClient: SQLAnalyzerPrismaBuilder | null = null;

export async function getSQLAnalyzer(): Promise<SQLAnalyzerPrismaBuilder> {
    if (!defaultClient) {
        defaultClient = await createSQLAnalyzerClient();
    }

    return defaultClient;
}