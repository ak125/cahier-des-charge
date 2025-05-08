/**
 * Point d'entrée pour l'orchestration MCP
 * 
 * IMPORTANT: Ce fichier est le point d'entrée unique pour tous les services d'orchestration.
 * L'orchestrateur centralisé remplace désormais les anciennes implémentations fragmentées.
 * 
 * Fonctionnalités clés:
 * - Utilise Temporal pour les workflows complexes et durables
 * - Utilise BullMQ uniquement pour les jobs courts et simples
 * - Détection automatique du type de workflow basée sur le nom/durée/métadonnées
 * - Registre unifié des tâches pour faciliter le suivi
 * - Interface cohérente quelque soit l'orchestrateur sous-jacent
 */

import { centralizedOrchestrator, CentralizedOrchestrator, WorkflowType } from './centralized-orchestrator';
import { TaskDefinition, TaskResult, TaskStatus } from './orchestrator-adapter';

// Re-exporter les types pour faciliter l'utilisation
export {
    CentralizedOrchestrator,
    WorkflowType,
    TaskDefinition,
    TaskResult,
    TaskStatus
};

// Exporter l'instance singleton comme orchestrateur par défaut
export const orchestrator = centralizedOrchestrator;

// Fonction utilitaire pour planifier un workflow complexe avec Temporal
export async function scheduleWorkflow(name: string, payload: any, options?: any): Promise<string> {
    return await orchestrator.scheduleTask(
        { name, payload, options },
        WorkflowType.LONG_RUNNING
    );
}

// Fonction utilitaire pour planifier un job court avec BullMQ
export async function scheduleJob(name: string, payload: any, options?: any): Promise<string> {
    return await orchestrator.scheduleTask(
        { name, payload, options },
        WorkflowType.SHORT_RUNNING
    );
}

// Fonction utilitaire pour planifier une tâche en auto-détectant le type
export async function scheduleTask(name: string, payload: any, options?: any): Promise<string> {
    return await orchestrator.scheduleTask({ name, payload, options });
}

// Fonctions utilitaires pour manipuler les tâches
export async function getTaskStatus(taskId: string): Promise<TaskResult> {
    return await orchestrator.getTaskStatus(taskId);
}

export async function cancelTask(taskId: string): Promise<boolean> {
    return await orchestrator.cancelTask(taskId);
}

export async function listAllTasks(filter?: Record<string, any>): Promise<TaskResult[]> {
    return await orchestrator.listTasks(filter);
}

export default orchestrator;