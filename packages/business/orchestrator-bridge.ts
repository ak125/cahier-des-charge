/**
 * Pont d'orchestrateur (Orchestrator Bridge)
 * 
 * Ce module fournit une interface simplifiée pour permettre aux composants externes
 * d'utiliser l'orchestrateur standardisé. Il sert de couche d'adaptation entre
 * l'ancien système d'orchestration et la nouvelle implémentation standardisée.
 */

import { standardizedOrchestrator } from './standardized-orchestrator';
import { TaskDescription } from './types';

/**
 * Options pour le pont d'orchestrateur
 */
export interface OrchestratorBridgeOptions {
    /** Type d'orchestrateur préféré pour les tâches sans spécification explicite */
    preferredOrchestrator?: 'temporal' | 'bullmq';
    /** Activer l'utilisation de n8n pour la compatibilité avec l'existant */
    enableN8nLegacy?: boolean;
    /** Forcer l'utilisation de workflows complexes pour toutes les tâches */
    alwaysUseComplexWorkflows?: boolean;
}

/**
 * Classe servant de pont entre les systèmes externes et l'orchestrateur standardisé
 */
export class OrchestratorBridge {
    private options: OrchestratorBridgeOptions;

    constructor(options: OrchestratorBridgeOptions = {}) {
        this.options = {
            preferredOrchestrator: options.preferredOrchestrator || 'bullmq',
            enableN8nLegacy: options.enableN8nLegacy || false,
            alwaysUseComplexWorkflows: options.alwaysUseComplexWorkflows || false
        };
    }

    /**
     * Planifie une tâche via l'orchestrateur standardisé
     * 
     * @param type Type de la tâche à exécuter
     * @param data Données pour la tâche
     * @param options Options supplémentaires
     * @returns L'ID de la tâche planifiée
     */
    async scheduleTask(
        type: string,
        data: any,
        options: {
            id?: string;
            queue?: string;
            tags?: string[];
            isComplex?: boolean;
            integration?: { workflowId: string };
        } = {}
    ): Promise<string> {
        // Créer une description de tâche standardisée
        const task: TaskDescription = {
            id: options.id,
            type,
            data,
            queue: options.queue,
            tags: options.tags,
            isComplex: options.isComplex || this.options.alwaysUseComplexWorkflows,
            integration: options.integration
        };

        // Si n8n legacy n'est pas activé, supprimer les informations d'intégration
        if (!this.options.enableN8nLegacy && task.integration) {
            console.warn(
                `L'intégration n8n est désactivée. La tâche sera exécutée via ${this.options.preferredOrchestrator === 'temporal' ? 'Temporal.io' : 'BullMQ'
                }.`
            );
            delete task.integration;
            task.isComplex = this.options.preferredOrchestrator === 'temporal';
        }

        return standardizedOrchestrator.schedule(task);
    }

    /**
     * Récupère le statut d'une tâche
     * 
     * @param taskId ID de la tâche
     * @param orchestratorType Type d'orchestrateur (si connu)
     * @param queueName Nom de la queue (pour BullMQ)
     */
    async getTaskStatus(
        taskId: string,
        orchestratorType?: 'temporal' | 'bullmq' | 'n8n',
        queueName?: string
    ): Promise<any> {
        // Si le type d'orchestrateur n'est pas spécifié, essayer les trois
        if (!orchestratorType) {
            try {
                // Essayer d'abord l'orchestrateur préféré
                return await standardizedOrchestrator.getTaskStatus(
                    taskId,
                    this.options.preferredOrchestrator as 'temporal' | 'bullmq',
                    queueName
                );
            } catch (error) {
                // Si cela échoue, essayer les autres orchestrateurs
                try {
                    return await standardizedOrchestrator.getTaskStatus(
                        taskId,
                        this.options.preferredOrchestrator === 'temporal' ? 'bullmq' : 'temporal',
                        queueName
                    );
                } catch (error) {
                    // En dernier recours, essayer n8n si activé
                    if (this.options.enableN8nLegacy) {
                        return await standardizedOrchestrator.getTaskStatus(taskId, 'n8n');
                    }
                    throw new Error(`Tâche non trouvée: ${taskId}`);
                }
            }
        }

        // Si le type d'orchestrateur est spécifié, l'utiliser directement
        return standardizedOrchestrator.getTaskStatus(taskId, orchestratorType, queueName);
    }

    /**
     * Annule une tâche en cours d'exécution
     * 
     * @param taskId ID de la tâche
     * @param orchestratorType Type d'orchestrateur (si connu)
     * @param queueName Nom de la queue (pour BullMQ)
     */
    async cancelTask(
        taskId: string,
        orchestratorType?: 'temporal' | 'bullmq' | 'n8n',
        queueName?: string
    ): Promise<boolean> {
        // Si le type d'orchestrateur n'est pas spécifié, essayer les trois
        if (!orchestratorType) {
            try {
                // Essayer d'abord l'orchestrateur préféré
                return await standardizedOrchestrator.cancelTask(
                    taskId,
                    this.options.preferredOrchestrator as 'temporal' | 'bullmq',
                    queueName
                );
            } catch (error) {
                // Si cela échoue, essayer les autres orchestrateurs
                try {
                    return await standardizedOrchestrator.cancelTask(
                        taskId,
                        this.options.preferredOrchestrator === 'temporal' ? 'bullmq' : 'temporal',
                        queueName
                    );
                } catch (error) {
                    // En dernier recours, essayer n8n si activé
                    if (this.options.enableN8nLegacy) {
                        return await standardizedOrchestrator.cancelTask(taskId, 'n8n');
                    }
                    return false;
                }
            }
        }

        // Si le type d'orchestrateur est spécifié, l'utiliser directement
        return standardizedOrchestrator.cancelTask(taskId, orchestratorType, queueName);
    }
}

// Export d'une instance singleton par défaut
export const orchestratorBridge = new OrchestratorBridge();

// Export par défaut pour faciliter l'importation
export default orchestratorBridge;