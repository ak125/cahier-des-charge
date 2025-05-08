/**
 * Orchestrateur Standardisé Intelligent
 * 
 * Ce module fournit une interface unifiée pour tous les types d'orchestrateurs,
 * et sélectionne automatiquement l'orchestrateur le plus approprié en fonction
 * du type de tâche à exécuter.
 * 
 * - Temporal.io pour les workflows complexes avec état
 * - BullMQ pour les tâches simples et les jobs rapides
 * - n8n pour les intégrations externes (déprécié, migration en cours)
 */

import { temporal } from './temporal';
import { bullmq } from './queue';
import { n8n } from './n8n-deprecated';
import { TaskDescription, Orchestrator, TaskStatus } from './types';

/**
 * Options pour l'orchestrateur standardisé
 */
export interface StandardizedOrchestratorOptions {
    defaultOrchestrator?: 'temporal' | 'bullmq' | 'n8n';
    preferComplexWorkflows?: boolean;
    enableN8nFallback?: boolean;
}

/**
 * Orchestrateur standardisé qui détecte automatiquement le meilleur
 * orchestrateur à utiliser en fonction du type de tâche
 */
export class StandardizedOrchestrator implements Orchestrator {
    private defaultOrchestrator: 'temporal' | 'bullmq' | 'n8n';
    private preferComplexWorkflows: boolean;
    private enableN8nFallback: boolean;

    constructor(options: StandardizedOrchestratorOptions = {}) {
        this.defaultOrchestrator = options.defaultOrchestrator || 'bullmq';
        this.preferComplexWorkflows = options.preferComplexWorkflows || false;
        this.enableN8nFallback = options.enableN8nFallback || false;
    }

    /**
     * Détermine l'orchestrateur le plus approprié pour une tâche donnée
     * 
     * @param task Description de la tâche à planifier
     * @returns L'identifiant de l'orchestrateur à utiliser
     */
    private determineOrchestrator(task: TaskDescription): 'temporal' | 'bullmq' | 'n8n' {
        // Si la tâche a une intégration externe spécifiée, utiliser n8n (déprécié)
        if (task.integration && task.integration.workflowId) {
            if (this.enableN8nFallback) {
                console.warn('Utilisation de l\'orchestrateur n8n déprécié pour une intégration externe.');
                return 'n8n';
            } else {
                console.warn('Les intégrations n8n sont désactivées. Vous devez migrer vers Temporal.');
                return 'temporal';
            }
        }

        // Si la tâche est complexe ou contient des états, utiliser Temporal
        if (task.isComplex === true || this.preferComplexWorkflows) {
            return 'temporal';
        }

        // Utiliser l'orchestrateur par défaut pour les cas simples
        return this.defaultOrchestrator;
    }

    /**
     * Planifie une tâche en utilisant l'orchestrateur le plus approprié
     * 
     * @param task Description de la tâche à planifier
     * @returns L'ID de la tâche planifiée
     */
    async schedule(task: TaskDescription): Promise<string> {
        const orchestrator = this.determineOrchestrator(task);

        console.log(`Planification de tâche "${task.type}" via l'orchestrateur: ${orchestrator}`);

        switch (orchestrator) {
            case 'temporal':
                return temporal.schedule(task);
            case 'bullmq':
                return bullmq.schedule(task);
            case 'n8n':
                return n8n.schedule(task);
            default:
                throw new Error(`Orchestrateur non supporté: ${orchestrator}`);
        }
    }

    /**
     * Planifie un workflow complexe via Temporal
     * 
     * @param workflowName Nom du workflow à exécuter
     * @param input Données d'entrée du workflow
     * @param options Options spécifiques à Temporal
     * @returns L'ID du workflow planifié
     */
    async scheduleWorkflow(workflowName: string, input: any, options: any = {}): Promise<string> {
        return temporal.scheduleWorkflow(workflowName, input, options);
    }

    /**
     * Planifie une tâche simple via BullMQ
     * 
     * @param taskType Type de tâche à exécuter
     * @param data Données pour la tâche
     * @param options Options pour la tâche
     * @returns L'ID du job planifié
     */
    async scheduleTask(taskType: string, data: any, options: any = {}): Promise<string> {
        return bullmq.scheduleTask(taskType, data, options);
    }

    /**
     * Récupère le statut d'une tâche en cours d'exécution
     * 
     * @param taskId ID de la tâche à vérifier
     * @param orchestratorType Type d'orchestrateur qui gère cette tâche
     * @returns Le statut actuel de la tâche
     */
    async getTaskStatus(taskId: string, orchestratorType: 'temporal' | 'bullmq' | 'n8n', queueName?: string): Promise<TaskStatus> {
        switch (orchestratorType) {
            case 'temporal':
                return temporal.getWorkflowStatus(taskId);
            case 'bullmq':
                return bullmq.getTaskStatus(taskId, queueName);
            case 'n8n':
                return n8n.getExecutionStatus(taskId);
            default:
                throw new Error(`Type d'orchestrateur non supporté: ${orchestratorType}`);
        }
    }

    /**
     * Annule une tâche en cours d'exécution
     * 
     * @param taskId ID de la tâche à annuler
     * @param orchestratorType Type d'orchestrateur qui gère cette tâche
     * @returns true si la tâche a été annulée avec succès
     */
    async cancelTask(taskId: string, orchestratorType: 'temporal' | 'bullmq' | 'n8n', queueName?: string): Promise<boolean> {
        switch (orchestratorType) {
            case 'temporal':
                return temporal.cancelWorkflow(taskId);
            case 'bullmq':
                return bullmq.cancelTask(taskId, queueName);
            case 'n8n':
                return n8n.stopExecution(taskId);
            default:
                throw new Error(`Type d'orchestrateur non supporté: ${orchestratorType}`);
        }
    }
}

// Export de l'instance singleton par défaut
export const standardizedOrchestrator = new StandardizedOrchestrator();

// Export par défaut pour faciliter l'importation
export default standardizedOrchestrator;