/**
 * Client pour le workflow Pipeline de Migration IA
 * 
 * Cette classe fournit une interface pour utiliser le workflow Temporal
 * qui remplace le workflow n8n "Pipeline de Migration IA"
 */

import { Connection, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import type { AiPipelineWorkflowInput, AiPipelineWorkflowResult } from '../workflows/ai-pipeline-workflow';

/**
 * Client API pour le Pipeline de Migration IA
 */
export class AiPipelineClient {
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
     * Lance le pipeline complet de migration IA
     */
    async runPipeline(options: AiPipelineWorkflowInput): Promise<string> {
        const workflowId = `ai-pipeline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        await this.client.start('aiPipelineWorkflow', {
            taskQueue: 'ai-pipeline-queue',
            workflowId,
            args: [options],
        });

        return workflowId;
    }

    /**
     * Lance uniquement l'analyse PHP
     * Cette méthode fournit une interface simplifiée pour l'analyse PHP
     */
    async analyzePhp(options: {
        sourcePath: string;
        fileExtensions?: string[];
        recursive?: boolean;
        exclude?: string[];
        limit?: number;
        analyzerEndpoint?: string;
        outputDir?: string;
        concurrency?: number;
        generateSummary?: boolean;
    }): Promise<string> {
        const workflowId = `php-analyzer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        await this.client.start('phpAnalyzerWorkflow', {
            taskQueue: 'ai-pipeline-queue',
            workflowId,
            args: [options],
        });

        return workflowId;
    }

    /**
     * Vérifie le statut d'une exécution en cours
     */
    async getStatus(workflowId: string): Promise<AiPipelineWorkflowResult | { status: string; message: string }> {
        const handle: WorkflowHandle<unknown> = this.client.getHandle(workflowId);

        try {
            // Vérifier si le workflow est terminé
            const result = await handle.result() as AiPipelineWorkflowResult;
            return result;
        } catch (error) {
            // Workflow en cours ou erreur
            const description = await handle.describe();

            return {
                status: description.status.name.toLowerCase(),
                message: `Workflow is ${description.status.name.toLowerCase()}`
            };
        }
    }

    /**
     * Annule une exécution en cours
     */
    async cancelPipeline(workflowId: string): Promise<boolean> {
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
     * Récupère les résultats d'analyse PHP
     */
    async getPhpAnalysisResults(workflowId: string): Promise<AiPipelineWorkflowResult['phpAnalysis'] | null> {
        try {
            const result = await this.getStatus(workflowId);

            if ('phpAnalysis' in result) {
                return result.phpAnalysis || null;
            }

            return null;
        } catch (error) {
            console.error(`Error getting PHP analysis results for workflow ${workflowId}:`, error);
            return null;
        }
    }
}

// Factory pour créer une instance du client
export async function createAiPipelineClient(): Promise<AiPipelineClient> {
    // Se connecter au serveur Temporal
    const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    return new AiPipelineClient(connection);
}

// Exporter une instance par défaut pour une utilisation simplifiée
let defaultClient: AiPipelineClient | null = null;

export async function getAiPipelineClient(): Promise<AiPipelineClient> {
    if (!defaultClient) {
        defaultClient = await createAiPipelineClient();
    }

    return defaultClient;
}