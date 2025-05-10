/**
 * Exemple d'intégration des technologies modernes
 * 
 * Cet exemple démontre l'utilisation conjointe de :
 * - Temporal.io pour l'orchestration de workflows complexes
 * - BullMQ pour les files d'attente rapides
 * - RedisJSON pour le stockage efficace de documents JSON
 * - OpenAPI 3.1 avec TypeBox pour la validation et documentation d'API
 */

import { standardizedOrchestrator, TaskType } from '../orchestration/standardized-orchestrator';
import { createOpenApiGenerator, Type } from '../api/openapi-generator';
import { bullmqAdapter } from '../orchestration/adapters/standardized-bullmq-adapter';
import { temporalAdapter } from '../orchestration/adapters/standardized-temporal-adapter';
import { RedisService } from '../../apps/mcp-server/src/redis/redisservice';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ModernTechIntegrationService {
    private readonly logger = new Logger(ModernTechIntegrationService.name);
    private readonly redisService: RedisService;
    private readonly apiGenerator;

    constructor() {
        // Initialiser Redis
        this.redisService = new RedisService();

        // Initialiser le générateur OpenAPI
        this.apiGenerator = createOpenApiGenerator({
            title: 'API d\'Intégration Moderne',
            version: '1.0.0',
            description: 'API démontrant l\'intégration de technologies modernes',
            servers: [{ url: 'http://localhost:3000', description: 'Serveur de développement' }]
        });

        // Définir les schémas
        this.setupApiSchemas();
    }

    /**
     * Configuration des schémas de l'API
     */
    private setupApiSchemas() {
        // Définir des schémas avec TypeBox
        const TaskSchema = Type.Object({
            id: Type.String(),
            name: Type.String(),
            status: Type.Enum({
                PENDING: 'PENDING',
                RUNNING: 'RUNNING',
                COMPLETED: 'COMPLETED',
                FAILED: 'FAILED'
            }),
            data: Type.Record(Type.String(), Type.Any())
        });

        const TaskRef = this.apiGenerator.registerSchema('Task', TaskSchema);

        // Enregistrer les endpoints
        this.apiGenerator.registerRoute('/tasks', 'post', {
            operationId: 'createTask',
            summary: 'Crée une nouvelle tâche',
            tags: ['Tasks'],
            requestBody: Type.Object({
                name: Type.String(),
                type: Type.Enum({ SIMPLE: 'SIMPLE', COMPLEX: 'COMPLEX' }),
                data: Type.Record(Type.String(), Type.Any())
            }),
            responses: {
                '201': {
                    description: 'Tâche créée',
                    content: {
                        'application/json': {
                            schema: Type.Object({
                                taskId: Type.String()
                            })
                        }
                    }
                },
                '400': {
                    description: 'Données invalides'
                }
            }
        });

        this.apiGenerator.registerRoute('/tasks/{id}', 'get', {
            operationId: 'getTaskStatus',
            summary: 'Récupère le statut d\'une tâche',
            tags: ['Tasks'],
            parameters: [
                this.apiGenerator.registerParameter('id', Type.String(), 'path')
            ],
            responses: {
                '200': {
                    description: 'Statut de la tâche',
                    content: {
                        'application/json': {
                            schema: TaskRef
                        }
                    }
                },
                '404': {
                    description: 'Tâche non trouvée'
                }
            }
        });
    }

    /**
     * Crée et démarre une tâche simple via BullMQ
     */
    async createSimpleTask(name: string, data: Record<string, any>): Promise<string> {
        this.logger.log(`Création d'une tâche simple: ${name}`);

        // Vérifier si les données sont déjà en cache
        const cacheKey = `task:${name}:template`;
        const taskTemplate = await this.redisService.getWithSWR(
            cacheKey,
            async () => {
                // Simuler la récupération du modèle de tâche depuis une source externe
                await new Promise(resolve => setTimeout(resolve, 200));
                return {
                    name,
                    template: `Template for ${name}`,
                    defaultParams: { priority: 1 }
                };
            },
            3600, // TTL 1h
            60    // Stale après 1min
        );

        // Créer la tâche avec BullMQ
        const taskId = await bullmqAdapter.addJob('process-task', {
            ...data,
            template: taskTemplate.template,
            timestamp: Date.now()
        }, {
            priority: taskTemplate.defaultParams.priority || 1,
            attempts: 3
        });

        // Sauvegarder les métadonnées dans RedisJSON
        if (this.redisService.isRedisJsonAvailable()) {
            await this.redisService.jsonSet(`task:${taskId}`, '.', {
                id: taskId,
                name,
                type: 'SIMPLE',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                data
            });
        } else {
            // Fallback pour Redis standard
            await this.redisService.set(`task:${taskId}`, JSON.stringify({
                id: taskId,
                name,
                type: 'SIMPLE',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                data
            }));
        }

        return taskId;
    }

    /**
     * Crée et démarre une tâche complexe via Temporal
     */
    async createComplexTask(name: string, data: Record<string, any>): Promise<string> {
        this.logger.log(`Création d'une tâche complexe: ${name}`);

        // Utiliser l'orchestrateur standardisé pour lancer un workflow Temporal
        const workflowId = await standardizedOrchestrator.scheduleTask(
            name,
            data,
            {
                taskType: TaskType.COMPLEX_WORKFLOW,
                temporal: {
                    workflowType: 'ComplexTaskWorkflow',
                    workflowArgs: [data],
                    taskQueue: 'complex-task-queue'
                }
            }
        );

        // Sauvegarder les métadonnées dans RedisJSON
        if (this.redisService.isRedisJsonAvailable()) {
            await this.redisService.jsonSet(`task:${workflowId}`, '.', {
                id: workflowId,
                name,
                type: 'COMPLEX',
                status: 'RUNNING',
                createdAt: new Date().toISOString(),
                data
            });
        } else {
            // Fallback pour Redis standard
            await this.redisService.set(`task:${workflowId}`, JSON.stringify({
                id: workflowId,
                name,
                type: 'COMPLEX',
                status: 'RUNNING',
                createdAt: new Date().toISOString(),
                data
            }));
        }

        return workflowId;
    }

    /**
     * Récupère l'état d'une tâche (simple ou complexe)
     */
    async getTaskStatus(taskId: string): Promise<any> {
        this.logger.log(`Récupération du statut de la tâche: ${taskId}`);

        // Récupérer les métadonnées depuis Redis
        let taskData;
        if (this.redisService.isRedisJsonAvailable()) {
            taskData = await this.redisService.jsonGet(`task:${taskId}`);
        } else {
            const rawData = await this.redisService.get(`task:${taskId}`);
            taskData = rawData ? JSON.parse(rawData) : null;
        }

        if (!taskData) {
            throw new Error(`Tâche non trouvée: ${taskId}`);
        }

        // Mettre à jour le statut en fonction du type de tâche
        if (taskData.type === 'SIMPLE') {
            // Récupérer le statut depuis BullMQ
            try {
                const jobStatus = await bullmqAdapter.getJobStatus(taskId);
                taskData.status = this.mapBullMQStatusToTaskStatus(jobStatus.status);
                taskData.result = jobStatus.result;
                taskData.error = jobStatus.error;
            } catch (error) {
                this.logger.error(`Erreur lors de la récupération du statut BullMQ: ${error.message}`);
            }
        } else if (taskData.type === 'COMPLEX') {
            // Récupérer le statut depuis Temporal
            try {
                const workflowStatus = await temporalAdapter.getWorkflowStatus(taskId);
                taskData.status = this.mapTemporalStatusToTaskStatus(workflowStatus.status);

                // Si le workflow est terminé, récupérer le résultat
                if (taskData.status === 'COMPLETED') {
                    const result = await temporalAdapter.getWorkflowResult(taskId);
                    taskData.result = result.result;
                } else if (taskData.status === 'FAILED') {
                    const result = await temporalAdapter.getWorkflowResult(taskId);
                    taskData.error = result.error;
                }
            } catch (error) {
                this.logger.error(`Erreur lors de la récupération du statut Temporal: ${error.message}`);
            }
        }

        // Mettre à jour les données en cache
        if (this.redisService.isRedisJsonAvailable()) {
            await this.redisService.jsonSet(`task:${taskId}`, '.', taskData);
        } else {
            await this.redisService.set(`task:${taskId}`, JSON.stringify(taskData));
        }

        return taskData;
    }

    /**
     * Mappe les statuts BullMQ vers notre format standardisé
     */
    private mapBullMQStatusToTaskStatus(status: string): string {
        switch (status) {
            case 'completed':
                return 'COMPLETED';
            case 'failed':
                return 'FAILED';
            case 'active':
                return 'RUNNING';
            case 'delayed':
            case 'waiting':
            case 'paused':
            default:
                return 'PENDING';
        }
    }

    /**
     * Mappe les statuts Temporal vers notre format standardisé
     */
    private mapTemporalStatusToTaskStatus(status: string): string {
        switch (status) {
            case 'COMPLETED':
                return 'COMPLETED';
            case 'FAILED':
            case 'TIMED_OUT':
                return 'FAILED';
            case 'RUNNING':
                return 'RUNNING';
            case 'CANCELED':
            case 'TERMINATED':
            default:
                return 'PENDING';
        }
    }

    /**
     * Génère la documentation OpenAPI
     */
    generateApiDocumentation() {
        return this.apiGenerator.generateOpenApiDocument();
    }

    /**
     * Enregistre un processeur de tâches BullMQ
     */
    registerTaskProcessor() {
        this.logger.log('Enregistrement du processeur de tâches BullMQ');

        bullmqAdapter.registerProcessor('process-task', async (job) => {
            this.logger.log(`Traitement de la tâche ${job.id}: ${job.name}`);

            // Simuler un traitement
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Retourner un résultat
            return {
                processed: true,
                timestamp: Date.now(),
                duration: 2000,
                input: job.data
            };
        }, {
            concurrency: 5,
            enableMetrics: true
        });
    }
}

// Usage d'exemple:
/*
const service = new ModernTechIntegrationService();

// Créer une tâche simple
const simpleTaskId = await service.createSimpleTask('analyseData', {
  source: 'database-export',
  filters: { date: '2025-05-09' }
});

// Créer une tâche complexe
const complexTaskId = await service.createComplexTask('migrationWorkflow', {
  source: 'legacy-system',
  target: 'new-system',
  entities: ['users', 'products']
});

// Vérifier l'état des tâches
const simpleStatus = await service.getTaskStatus(simpleTaskId);
const complexStatus = await service.getTaskStatus(complexTaskId);

// Générer la documentation API
const apiDoc = service.generateApiDocumentation();
console.log(JSON.stringify(apiDoc, null, 2));
*/
