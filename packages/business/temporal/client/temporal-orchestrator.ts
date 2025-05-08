/**
 * Temporal Orchestrator
 * 
 * Ce module fournit une abstraction pour utiliser Temporal.io comme orchestrateur
 * pour les workflows complexes à état long, comme les migrations, refactors d'IA,
 * et autres tâches nécessitant de la durabilité et de la résilience.
 */

import { Connection, Client, WorkflowClient } from '@temporalio/client';
import { ComplexWorkflowOptions, TaskDescription } from '../../types';

/**
 * Options de configuration pour l'orchestrateur Temporal
 */
interface TemporalOrchestratorOptions {
    address?: string;
    namespace?: string;
}

/**
 * Classe pour orchestrer des workflows complexes avec Temporal.io
 */
export class TemporalOrchestrator {
    private client: WorkflowClient;

    constructor(options: TemporalOrchestratorOptions = {}) {
        const connection = new Connection({
            address: options.address || 'localhost:7233',
        });

        this.client = new Client({
            connection,
            namespace: options.namespace || 'default',
        });
    }

    /**
     * Planifie un workflow complexe via Temporal.io
     * 
     * @param workflowName - Le nom du workflow à exécuter
     * @param input - Les données d'entrée du workflow
     * @param options - Options spécifiques à Temporal
     * @returns L'ID du workflow planifié
     */
    async scheduleWorkflow(workflowName: string, input: any, options: ComplexWorkflowOptions = {}): Promise<string> {
        try {
            const handle = await this.client.workflow.start(workflowName, {
                taskQueue: options.taskQueue || 'default',
                workflowId: options.workflowId || `${workflowName}-${Date.now()}`,
                args: [input],
                searchAttributes: options.tags ? { tags: options.tags } : undefined,
                retry: options.retry ? { maximumAttempts: options.retry.maxAttempts || 3 } : undefined,
            });

            console.log(`Workflow started. WorkflowID: ${handle.workflowId}`);
            return handle.workflowId;
        } catch (error) {
            console.error(`Erreur lors de la planification du workflow Temporal: ${error}`);
            throw error;
        }
    }

    /**
     * Récupère le statut d'un workflow en cours d'exécution
     * 
     * @param workflowId - L'ID du workflow à vérifier
     * @returns Le statut actuel du workflow
     */
    async getWorkflowStatus(workflowId: string): Promise<any> {
        try {
            const handle = this.client.workflow.getHandle(workflowId);
            const description = await handle.describe();

            return {
                id: workflowId,
                status: description.status.name,
                startTime: description.startTime,
                executionTime: description.executionTime,
                historyLength: description.historyLength,
                source: 'TEMPORAL'
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération du statut du workflow: ${error}`);
            throw error;
        }
    }

    /**
     * Annule un workflow en cours d'exécution
     * 
     * @param workflowId - L'ID du workflow à annuler
     * @returns true si le workflow a été annulé avec succès
     */
    async cancelWorkflow(workflowId: string): Promise<boolean> {
        try {
            const handle = this.client.workflow.getHandle(workflowId);
            await handle.cancel();
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'annulation du workflow: ${error}`);
            return false;
        }
    }

    /**
     * Planifie une tâche complexe selon la description fournie
     * Adapte les paramètres de la tâche au format Temporal
     * 
     * @param task - Description de la tâche à planifier
     * @returns L'ID de la tâche planifiée
     */
    async schedule(task: TaskDescription): Promise<string> {
        try {
            // Configurer les options de workflow en fonction des attributs de la tâche
            const options: ComplexWorkflowOptions = {
                workflowId: task.id || undefined,
                taskQueue: task.queue || 'default',
                tags: task.tags || [],
                retry: task.retry ? {
                    maxAttempts: task.retry.maxAttempts || 3
                } : undefined
            };

            return this.scheduleWorkflow(
                task.type,
                task.data || {},
                options
            );
        } catch (error) {
            console.error(`Erreur lors de la planification de la tâche via Temporal: ${error}`);
            throw error;
        }
    }
}