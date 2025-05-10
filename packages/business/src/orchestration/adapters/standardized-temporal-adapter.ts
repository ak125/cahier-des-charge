/**
 * Adaptateur Temporal standardisé pour l'orchestrateur unifié
 * 
 * Cette implémentation fournit une interface standardisée pour utiliser Temporal
 * avec des configurations optimisées et des patrons de conception communs.
 */

import {
    Client,
    Connection,
    WorkflowClient,
    WorkflowHandle,
    ConnectionOptions,
    WorkflowIdReusePolicy,
    WorkflowExecutionInfo,
    SearchAttributes,
    WorkflowExecutionStatus
} from '@temporalio/client';
import {
    RetryOptions,
    WorkflowExecutionDescription
} from '@temporalio/common';
import { WorkflowNotFoundError } from '@temporalio/client';

/**
 * Options pour la configuration de l'adaptateur Temporal
 */
export interface TemporalAdapterOptions {
    /** Configuration de la connexion */
    connectionOptions?: ConnectionOptions;
    /** Namespace Temporal par défaut */
    namespace?: string;
    /** File d'attente Temporal par défaut */
    defaultTaskQueue?: string;
    /** Configuration de retry par défaut */
    defaultRetryOptions?: RetryOptions;
}

/**
 * Options pour démarrer un workflow Temporal
 */
export interface StartWorkflowOptions {
    /** ID du workflow (généré automatiquement si non fourni) */
    workflowId?: string;
    /** Nom de la file d'attente des tâches */
    taskQueue?: string;
    /** Options de retry */
    retryOptions?: RetryOptions;
    /** Durée de conservation de l'historique d'exécution */
    workflowExecutionTimeout?: string;
    /** Politique de réutilisation de workflowId */
    workflowIdReusePolicy?: WorkflowIdReusePolicy;
    /** Attributs de recherche personnalisés */
    searchAttributes?: SearchAttributes;
    /** Jeton de contexte parent pour les sous-workflows */
    parentWorkflowInfo?: {
        workflowId: string;
        runId?: string;
    };
    /** Mémos associés au workflow (données non indexées) */
    memo?: Record<string, any>;
}

/**
 * Résultat de l'exécution d'un workflow
 */
export interface WorkflowResult<T = unknown> {
    workflowId: string;
    runId: string;
    result?: T;
    status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'CANCELED' | 'TERMINATED' | 'CONTINUED_AS_NEW' | 'TIMED_OUT';
    error?: Error;
}

/**
 * Adaptateur standardisé pour Temporal
 */
export class StandardizedTemporalAdapter {
    private client: Client | null = null;
    private connection: Connection | null = null;
    private readonly options: TemporalAdapterOptions;
    private readonly logger: Console;

    /**
     * Constructeur de l'adaptateur Temporal standardisé
     * @param options Options de configuration
     * @param logger Logger (console par défaut)
     */
    constructor(options: TemporalAdapterOptions = {}, logger: Console = console) {
        this.options = {
            namespace: options.namespace || 'default',
            defaultTaskQueue: options.defaultTaskQueue || 'default-task-queue',
            defaultRetryOptions: options.defaultRetryOptions || {
                maximumAttempts: 3,
                initialInterval: '1s',
                maximumInterval: '1m',
                backoffCoefficient: 2
            },
            connectionOptions: options.connectionOptions || {
                address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
            }
        };

        this.logger = logger;
    }

    /**
     * Initialise la connexion à Temporal et crée un client
     */
    async initialize(): Promise<void> {
        if (this.client) {
            return;
        }

        try {
            this.logger.info('Initialisation de la connexion Temporal...');

            this.connection = await Connection.connect(this.options.connectionOptions);

            this.client = new Client({
                connection: this.connection,
                namespace: this.options.namespace
            });

            this.logger.info(`Connexion Temporal établie avec succès (namespace: ${this.options.namespace})`);
        } catch (error) {
            this.logger.error('Échec de l\'initialisation de Temporal:', error);
            throw new Error(`Impossible d'initialiser la connexion Temporal: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Ferme la connexion Temporal
     */
    async close(): Promise<void> {
        if (this.connection) {
            this.logger.info('Fermeture de la connexion Temporal...');
            await this.connection.close();
            this.connection = null;
            this.client = null;
            this.logger.info('Connexion Temporal fermée');
        }
    }

    /**
     * Démarre un workflow Temporal
     * 
     * @param workflowType Type de workflow à exécuter
     * @param args Arguments du workflow
     * @param options Options d'exécution
     * @returns Identifiants du workflow démarré
     */
    async startWorkflow<T extends unknown[]>(
        workflowType: string,
        args: T,
        options: StartWorkflowOptions = {}
    ): Promise<{ workflowId: string; runId: string }> {
        if (!this.client) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Client Temporal non initialisé');
        }

        try {
            const workflowId = options.workflowId || `${workflowType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const taskQueue = options.taskQueue || this.options.defaultTaskQueue;

            this.logger.info(`Démarrage du workflow "${workflowType}" avec ID: ${workflowId}`);

            const handle = await this.client.workflow.start(workflowType, {
                args,
                taskQueue,
                workflowId,
                retry: options.retryOptions || this.options.defaultRetryOptions,
                workflowExecutionTimeout: options.workflowExecutionTimeout,
                workflowIdReusePolicy: options.workflowIdReusePolicy,
                searchAttributes: options.searchAttributes,
                memo: options.memo
            });

            this.logger.info(`Workflow "${workflowType}" démarré avec succès (ID: ${handle.workflowId}, RunID: ${handle.firstExecutionRunId})`);

            return {
                workflowId: handle.workflowId,
                runId: handle.firstExecutionRunId
            };
        } catch (error) {
            this.logger.error(`Échec du démarrage du workflow "${workflowType}":`, error);
            throw new Error(`Impossible de démarrer le workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Obtient une référence vers un workflow existant
     * 
     * @param workflowId ID du workflow
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns Handle du workflow
     */
    async getWorkflowHandle(workflowId: string, runId?: string): Promise<WorkflowHandle> {
        if (!this.client) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Client Temporal non initialisé');
        }

        return this.client.workflow.getHandle(workflowId, runId);
    }

    /**
     * Attends la fin d'un workflow et récupère son résultat
     * 
     * @param workflowId ID du workflow
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns Résultat du workflow
     */
    async getWorkflowResult<T>(workflowId: string, runId?: string): Promise<WorkflowResult<T>> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);

            this.logger.info(`Attente du résultat du workflow ${workflowId}...`);

            const result = await handle.result() as T;

            return {
                workflowId,
                runId: handle.runId,
                result,
                status: 'COMPLETED'
            };
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                throw new Error(`Workflow ${workflowId} non trouvé`);
            }

            this.logger.error(`Erreur lors de la récupération du résultat du workflow ${workflowId}:`, error);

            return {
                workflowId,
                runId: '',
                status: 'FAILED',
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    /**
     * Récupère le statut d'un workflow
     * 
     * @param workflowId ID du workflow
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns Informations sur le statut du workflow
     */
    async getWorkflowStatus(workflowId: string, runId?: string): Promise<WorkflowResult> {
        if (!this.client) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Client Temporal non initialisé');
        }

        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            const description = await handle.describe();

            const statusMap: Record<WorkflowExecutionStatus, 'COMPLETED' | 'RUNNING' | 'FAILED' | 'CANCELED' | 'TERMINATED' | 'CONTINUED_AS_NEW' | 'TIMED_OUT'> = {
                [WorkflowExecutionStatus.COMPLETED]: 'COMPLETED',
                [WorkflowExecutionStatus.RUNNING]: 'RUNNING',
                [WorkflowExecutionStatus.FAILED]: 'FAILED',
                [WorkflowExecutionStatus.CANCELED]: 'CANCELED',
                [WorkflowExecutionStatus.TERMINATED]: 'TERMINATED',
                [WorkflowExecutionStatus.CONTINUED_AS_NEW]: 'CONTINUED_AS_NEW',
                [WorkflowExecutionStatus.TIMED_OUT]: 'TIMED_OUT'
            };

            return {
                workflowId,
                runId: description.runId,
                status: statusMap[description.status]
            };
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                throw new Error(`Workflow ${workflowId} non trouvé`);
            }

            this.logger.error(`Erreur lors de la récupération du statut du workflow ${workflowId}:`, error);

            throw error;
        }
    }

    /**
     * Annule un workflow en cours d'exécution
     * 
     * @param workflowId ID du workflow
     * @param reason Raison de l'annulation
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns true si l'annulation a réussi
     */
    async cancelWorkflow(workflowId: string, reason?: string, runId?: string): Promise<boolean> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);

            this.logger.info(`Annulation du workflow ${workflowId}${reason ? ` pour la raison: ${reason}` : ''}`);

            await handle.cancel();

            return true;
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                this.logger.warn(`Tentative d'annulation d'un workflow inexistant: ${workflowId}`);
                return false;
            }

            this.logger.error(`Erreur lors de l'annulation du workflow ${workflowId}:`, error);

            return false;
        }
    }

    /**
     * Termine un workflow de force
     * 
     * @param workflowId ID du workflow
     * @param reason Raison de la terminaison
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns true si la terminaison a réussi
     */
    async terminateWorkflow(workflowId: string, reason: string, runId?: string): Promise<boolean> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);

            this.logger.info(`Terminaison forcée du workflow ${workflowId} pour la raison: ${reason}`);

            await handle.terminate(reason);

            return true;
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                this.logger.warn(`Tentative de terminaison d'un workflow inexistant: ${workflowId}`);
                return false;
            }

            this.logger.error(`Erreur lors de la terminaison du workflow ${workflowId}:`, error);

            return false;
        }
    }

    /**
     * Envoie un signal à un workflow en cours d'exécution
     * 
     * @param workflowId ID du workflow
     * @param signalName Nom du signal
     * @param signalArgs Arguments du signal
     * @param runId ID d'exécution spécifique (optionnel)
     * @returns true si le signal a été envoyé avec succès
     */
    async signalWorkflow<T extends unknown[]>(
        workflowId: string,
        signalName: string,
        signalArgs: T,
        runId?: string
    ): Promise<boolean> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);

            this.logger.info(`Envoi du signal "${signalName}" au workflow ${workflowId}`);

            await handle.signal(signalName, ...signalArgs);

            return true;
        } catch (error) {
            if (error instanceof WorkflowNotFoundError) {
                this.logger.warn(`Tentative d'envoi d'un signal à un workflow inexistant: ${workflowId}`);
                return false;
            }

            this.logger.error(`Erreur lors de l'envoi du signal "${signalName}" au workflow ${workflowId}:`, error);

            return false;
        }
    }

    /**
     * Recherche des workflows selon des critères
     * 
     * @param query Critères de recherche
     * @returns Liste des workflows correspondants
     */
    async searchWorkflows(query: string): Promise<WorkflowExecutionInfo[]> {
        if (!this.client) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Client Temporal non initialisé');
        }

        try {
            const result = await this.client.workflow.list({
                query
            });

            return result;
        } catch (error) {
            this.logger.error(`Erreur lors de la recherche de workflows avec la requête "${query}":`, error);
            throw error;
        }
    }
}

// Export d'une instance singleton
const defaultTemporalAdapter = new StandardizedTemporalAdapter({
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    defaultTaskQueue: process.env.TEMPORAL_DEFAULT_TASK_QUEUE || 'default',
    connectionOptions: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    }
});

export { defaultTemporalAdapter as temporalAdapter, StandardizedTemporalAdapter };