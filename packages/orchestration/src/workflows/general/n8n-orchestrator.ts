/**
 * n8n Orchestrator (DÉPRÉCIÉ)
 * 
 * Ce module fournit une abstraction pour utiliser n8n comme orchestrateur
 * pour les intégrations externes et les webhooks avec des systèmes tiers.
 * 
 * @deprecated Ce module est déprécié et sera progressivement remplacé par Temporal.io et BullMQ
 * selon le plan de migration décrit dans la documentation de standardisation.
 */

import axios from 'axios';
import { TaskDescription, ExternalIntegrationOptions } from '../types';

/**
 * Options de configuration pour l'orchestrateur n8n
 */
interface N8nOrchestratorOptions {
    apiBaseUrl?: string;
    apiKey?: string;
}

/**
 * Classe pour orchestrer des intégrations externes avec n8n
 * @deprecated À remplacer progressivement selon le plan de migration
 */
export class N8nOrchestrator {
    private apiBaseUrl: string;
    private apiKey: string | undefined;

    constructor(options: N8nOrchestratorOptions = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:5678/api/v1';
        this.apiKey = options.apiKey;

        console.warn(
            'AVERTISSEMENT: Vous utilisez l\'orchestrateur n8n qui est déprécié. ' +
            'Veuillez planifier une migration vers Temporal.io ou BullMQ selon le cas d\'usage.'
        );
    }

    /**
     * Configure les en-têtes d'authentification pour les requêtes API
     */
    private getAuthHeaders() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers['X-N8N-API-KEY'] = this.apiKey;
        }

        return headers;
    }

    /**
     * Déclenche un workflow n8n
     * 
     * @param workflowId - ID du workflow à déclencher
     * @param data - Données à passer au workflow
     * @returns L'ID de l'exécution du workflow
     */
    async triggerWorkflow(workflowId: string, data: any): Promise<string> {
        try {
            const response = await axios.post(
                `${this.apiBaseUrl}/workflows/${workflowId}/trigger`,
                data,
                { headers: this.getAuthHeaders() }
            );

            if (!response.data || !response.data.executionId) {
                throw new Error('Pas d\'ID d\'exécution dans la réponse');
            }

            console.log(`Workflow n8n déclenché avec succès. ID d'exécution: ${response.data.executionId}`);
            return response.data.executionId;
        } catch (error) {
            console.error(`Erreur lors du déclenchement du workflow n8n: ${error}`);
            throw error;
        }
    }

    /**
     * Récupère le statut d'une exécution de workflow
     * 
     * @param executionId - ID de l'exécution à vérifier
     * @returns Le statut de l'exécution
     */
    async getExecutionStatus(executionId: string): Promise<any> {
        try {
            const response = await axios.get(
                `${this.apiBaseUrl}/executions/${executionId}`,
                { headers: this.getAuthHeaders() }
            );

            return {
                id: executionId,
                status: response.data.status,
                startedAt: response.data.startedAt,
                finishedAt: response.data.finishedAt,
                data: response.data.data,
                source: 'N8N'
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération du statut d'exécution n8n: ${error}`);
            throw error;
        }
    }

    /**
     * Arrête l'exécution d'un workflow
     * 
     * @param executionId - ID de l'exécution à stopper
     * @returns true si l'exécution a été stoppée avec succès
     */
    async stopExecution(executionId: string): Promise<boolean> {
        try {
            await axios.post(
                `${this.apiBaseUrl}/executions/${executionId}/stop`,
                {},
                { headers: this.getAuthHeaders() }
            );

            return true;
        } catch (error) {
            console.error(`Erreur lors de l'arrêt de l'exécution n8n: ${error}`);
            return false;
        }
    }

    /**
     * Planifie une intégration externe via n8n
     * Adapte les paramètres de la tâche au format n8n
     * 
     * @param task - Description de la tâche d'intégration externe
     * @returns L'ID de la tâche planifiée
     */
    async schedule(task: TaskDescription): Promise<string> {
        try {
            if (!task.integration || !task.integration.workflowId) {
                throw new Error('ID de workflow n8n requis pour les intégrations externes');
            }

            // Prépare les données pour l'intégration
            const integrationData = {
                ...task.data,
                taskId: task.id,
                taskType: task.type,
                tags: task.tags
            };

            return this.triggerWorkflow(task.integration.workflowId, integrationData);
        } catch (error) {
            console.error(`Erreur lors de la planification de l'intégration via n8n: ${error}`);
            throw error;
        }
    }
}