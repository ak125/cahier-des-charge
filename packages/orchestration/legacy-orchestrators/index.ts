/**
 * Orchestrateur Standardisé Intelligent
 * 
 * Ce module fournit une abstraction unifiée pour l'orchestration des tâches, 
 * en sélectionnant automatiquement le meilleur orchestrateur (Temporal, BullMQ, n8n)
 * en fonction de la nature de chaque tâche.
 */

import { temporal } from './temporal';
import { bullmq } from './bullmq';
import { n8n } from './n8n';
import { TaskDescription, TaskStatus } from './types';

export * from './types';
export { temporal, bullmq, n8n };

/**
 * Interface pour l'orchestrateur intelligent standardisé
 */
export interface StandardizedOrchestrator {
    scheduleTask(task: TaskDescription): Promise<string>;
    scheduleSimpleTask(type: string, data: any, options?: any): Promise<string>;
    scheduleComplexWorkflow(workflowName: string, input: any, options?: any): Promise<string>;
    scheduleExternalIntegration(workflowId: string, data: any, options?: any): Promise<string>;
    getTaskStatus(taskId: string, source?: 'TEMPORAL' | 'BULLMQ' | 'N8N'): Promise<TaskStatus>;
    cancelTask(taskId: string, source?: 'TEMPORAL' | 'BULLMQ' | 'N8N'): Promise<boolean>;
}

/**
 * Service d'orchestration standardisé qui détermine dynamiquement
 * quel orchestrateur utiliser en fonction de la nature de la tâche
 */
export class StandardizedOrchestratorService implements StandardizedOrchestrator {
    /**
     * Analyse la tâche et détermine si elle doit être considérée comme complexe
     * (et donc traitée par Temporal plutôt que BullMQ)
     */
    private isComplexTask(task: TaskDescription): boolean {
        // Si isComplex est explicitement défini, utiliser cette valeur
        if (task.isComplex !== undefined) {
            return task.isComplex;
        }

        // Si la tâche a besoin d'une intégration externe, utiliser n8n
        if (task.integration && task.integration.workflowId) {
            return false; // Pas complexe mais externe (n8n)
        }

        // Types de tâches connus comme complexes
        const complexTaskTypes = [
            'migration',
            'refactor',
            'analyze',
            'audit',
            'generate',
            'workflow',
            'agent',
            'validation'
        ];

        // Vérifier si le type contient un mot-clé complexe
        for (const complexType of complexTaskTypes) {
            if (task.type.toLowerCase().includes(complexType)) {
                return true;
            }
        }

        // Si la tâche a besoin de plus de 3 tentatives, considérer comme complexe
        if (task.retry && task.retry.maxAttempts > 3) {
            return true;
        }

        // Si la tâche a des tags spécifiques qui indiquent la complexité
        if (task.tags) {
            const complexTags = ['stateful', 'complex', 'long-running', 'critical', 'ia', 'ai'];
            if (task.tags.some(tag => complexTags.includes(tag.toLowerCase()))) {
                return true;
            }
        }

        // Par défaut, considérer comme simple
        return false;
    }

    /**
     * Analyse la tâche et détermine si elle nécessite une intégration externe
     */
    private isExternalIntegrationTask(task: TaskDescription): boolean {
        return !!(task.integration && task.integration.workflowId);
    }

    /**
     * Planifie une tâche en utilisant l'orchestrateur approprié
     * en fonction de sa nature (complexe, externe ou simple)
     */
    async scheduleTask(task: TaskDescription): Promise<string> {
        try {
            // Déterminer quel orchestrateur utiliser
            if (this.isExternalIntegrationTask(task)) {
                console.log(`Planification d'une intégration externe via n8n: ${task.type}`);
                return await n8n.schedule(task);
            } else if (this.isComplexTask(task)) {
                console.log(`Planification d'un workflow complexe via Temporal: ${task.type}`);
                return await temporal.schedule(task);
            } else {
                console.log(`Planification d'une tâche simple via BullMQ: ${task.type}`);
                return await bullmq.schedule(task);
            }
        } catch (error) {
            console.error(`Erreur lors de la planification de la tâche: ${error}`);
            throw error;
        }
    }

    /**
     * Planifie une tâche simple (rapide, sans état) via BullMQ
     */
    async scheduleSimpleTask(type: string, data: any, options: any = {}): Promise<string> {
        const task: TaskDescription = {
            type,
            data,
            isComplex: false,
            ...options
        };

        return this.scheduleTask(task);
    }

    /**
     * Planifie un workflow complexe (avec état, durable) via Temporal
     */
    async scheduleComplexWorkflow(workflowName: string, input: any, options: any = {}): Promise<string> {
        const task: TaskDescription = {
            type: workflowName,
            data: input,
            isComplex: true,
            ...options
        };

        return this.scheduleTask(task);
    }

    /**
     * Planifie une intégration externe (webhook, API) via n8n
     */
    async scheduleExternalIntegration(workflowId: string, data: any, options: any = {}): Promise<string> {
        const task: TaskDescription = {
            type: 'external-integration',
            data,
            integration: {
                workflowId,
                ...(options.webhook ? { webhook: options.webhook } : {})
            },
            ...options
        };

        return this.scheduleTask(task);
    }

    /**
     * Récupère le statut d'une tâche, quelle que soit sa source
     * Si la source n'est pas spécifiée, essaie de déterminer automatiquement
     */
    async getTaskStatus(taskId: string, source?: 'TEMPORAL' | 'BULLMQ' | 'N8N'): Promise<TaskStatus> {
        try {
            // Si la source est spécifiée, interroger directement l'orchestrateur correspondant
            if (source) {
                switch (source) {
                    case 'TEMPORAL':
                        return await temporal.getWorkflowStatus(taskId);
                    case 'BULLMQ':
                        return await bullmq.getTaskStatus(taskId);
                    case 'N8N':
                        return await n8n.getExecutionStatus(taskId);
                }
            }

            // Sinon, essayer chaque orchestrateur jusqu'à trouver la tâche
            try {
                return await temporal.getWorkflowStatus(taskId);
            } catch (e) {
                try {
                    return await bullmq.getTaskStatus(taskId);
                } catch (e) {
                    return await n8n.getExecutionStatus(taskId);
                }
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération du statut de la tâche: ${error}`);
            throw error;
        }
    }

    /**
     * Annule une tâche, quel que soit son orchestrateur source
     */
    async cancelTask(taskId: string, source?: 'TEMPORAL' | 'BULLMQ' | 'N8N'): Promise<boolean> {
        try {
            // Si la source est spécifiée, annuler directement via l'orchestrateur correspondant
            if (source) {
                switch (source) {
                    case 'TEMPORAL':
                        return await temporal.cancelWorkflow(taskId);
                    case 'BULLMQ':
                        return await bullmq.cancelTask(taskId);
                    case 'N8N':
                        return await n8n.stopExecution(taskId);
                }
            }

            // Sinon, essayer chaque orchestrateur jusqu'à annuler la tâche
            try {
                return await temporal.cancelWorkflow(taskId);
            } catch (e) {
                try {
                    return await bullmq.cancelTask(taskId);
                } catch (e) {
                    return await n8n.stopExecution(taskId);
                }
            }
        } catch (error) {
            console.error(`Erreur lors de l'annulation de la tâche: ${error}`);
            return false;
        }
    }
}

// Export l'instance singleton de l'orchestrateur standardisé
export const standardizedOrchestrator = new StandardizedOrchestratorService();

/**
 * Fonction utilitaire pour planifier une tâche
 * Utilise l'intelligence de l'orchestrateur pour choisir le moteur approprié
 */
export async function scheduleTask(task: TaskDescription): Promise<string> {
    return standardizedOrchestrator.scheduleTask(task);
}