/**
 * Tests unitaires pour l'orchestrateur standardisé
 */

import { standardizedOrchestrator, StandardizedOrchestrator } from '../standardized-orchestrator';
import { temporal } from '../temporal';
import { bullmq } from '../queue';
import { n8n } from '../n8n-deprecated';
import { TaskDescription } from '../types';

// Mocks pour les orchestrateurs individuels
jest.mock('../temporal', () => ({
    temporal: {
        schedule: jest.fn().mockResolvedValue('temporal-task-id'),
        scheduleWorkflow: jest.fn().mockResolvedValue('temporal-workflow-id'),
        getWorkflowStatus: jest.fn().mockResolvedValue({
            id: 'temporal-task-id',
            status: 'RUNNING',
            source: 'TEMPORAL'
        }),
        cancelWorkflow: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../queue', () => ({
    bullmq: {
        schedule: jest.fn().mockResolvedValue('bullmq-task-id'),
        scheduleTask: jest.fn().mockResolvedValue('bullmq-job-id'),
        getTaskStatus: jest.fn().mockResolvedValue({
            id: 'bullmq-task-id',
            status: 'active',
            source: 'BULLMQ'
        }),
        cancelTask: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../n8n-deprecated', () => ({
    n8n: {
        schedule: jest.fn().mockResolvedValue('n8n-task-id'),
        triggerWorkflow: jest.fn().mockResolvedValue('n8n-execution-id'),
        getExecutionStatus: jest.fn().mockResolvedValue({
            id: 'n8n-task-id',
            status: 'running',
            source: 'N8N'
        }),
        stopExecution: jest.fn().mockResolvedValue(true)
    }
}));

describe('StandardizedOrchestrator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Sélection d\'orchestrateur', () => {
        test('devrait sélectionner Temporal pour les tâches complexes', async () => {
            // Arrangement
            const task: TaskDescription = {
                type: 'complex-workflow',
                data: { test: 'data' },
                isComplex: true
            };

            // Action
            await standardizedOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).toHaveBeenCalledWith(task);
            expect(bullmq.schedule).not.toHaveBeenCalled();
            expect(n8n.schedule).not.toHaveBeenCalled();
        });

        test('devrait sélectionner BullMQ pour les tâches simples', async () => {
            // Arrangement
            const task: TaskDescription = {
                type: 'simple-task',
                data: { test: 'data' }
            };

            // Action
            await standardizedOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).not.toHaveBeenCalled();
            expect(bullmq.schedule).toHaveBeenCalledWith(task);
            expect(n8n.schedule).not.toHaveBeenCalled();
        });

        test('devrait sélectionner n8n pour les intégrations externes si n8n est activé', async () => {
            // Arrangement
            const customOrchestrator = new StandardizedOrchestrator({
                enableN8nFallback: true
            });

            const task: TaskDescription = {
                type: 'external-integration',
                data: { test: 'data' },
                integration: {
                    workflowId: 'external-workflow-id'
                }
            };

            // Action
            await customOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).not.toHaveBeenCalled();
            expect(bullmq.schedule).not.toHaveBeenCalled();
            expect(n8n.schedule).toHaveBeenCalledWith(task);
        });

        test('devrait utiliser Temporal pour les intégrations externes si n8n est désactivé', async () => {
            // Arrangement
            const customOrchestrator = new StandardizedOrchestrator({
                enableN8nFallback: false
            });

            const task: TaskDescription = {
                type: 'external-integration',
                data: { test: 'data' },
                integration: {
                    workflowId: 'external-workflow-id'
                }
            };

            // Action
            await customOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).toHaveBeenCalled();
            expect(bullmq.schedule).not.toHaveBeenCalled();
            expect(n8n.schedule).not.toHaveBeenCalled();
        });

        test('devrait respecter l\'option preferComplexWorkflows', async () => {
            // Arrangement
            const customOrchestrator = new StandardizedOrchestrator({
                preferComplexWorkflows: true
            });

            const task: TaskDescription = {
                type: 'ambiguous-task', // Pas explicitement marquée comme complexe
                data: { test: 'data' }
            };

            // Action
            await customOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).toHaveBeenCalledWith(task);
            expect(bullmq.schedule).not.toHaveBeenCalled();
        });

        test('devrait respecter l\'option defaultOrchestrator', async () => {
            // Arrangement
            const customOrchestrator = new StandardizedOrchestrator({
                defaultOrchestrator: 'temporal'
            });

            const task: TaskDescription = {
                type: 'simple-task',
                data: { test: 'data' }
            };

            // Action
            await customOrchestrator.schedule(task);

            // Assertion
            expect(temporal.schedule).toHaveBeenCalledWith(task);
            expect(bullmq.schedule).not.toHaveBeenCalled();
        });
    });

    describe('Méthodes spécifiques', () => {
        test('scheduleWorkflow devrait appeler le Temporal.scheduleWorkflow', async () => {
            // Arrangement
            const workflowName = 'test-workflow';
            const input = { data: 'test' };
            const options = { taskQueue: 'test-queue' };

            // Action
            await standardizedOrchestrator.scheduleWorkflow(workflowName, input, options);

            // Assertion
            expect(temporal.scheduleWorkflow).toHaveBeenCalledWith(workflowName, input, options);
        });

        test('scheduleTask devrait appeler le BullMQ.scheduleTask', async () => {
            // Arrangement
            const taskType = 'test-task';
            const data = { data: 'test' };
            const options = { priority: 1 };

            // Action
            await standardizedOrchestrator.scheduleTask(taskType, data, options);

            // Assertion
            expect(bullmq.scheduleTask).toHaveBeenCalledWith(taskType, data, options);
        });

        test('getTaskStatus devrait appeler la méthode appropriée selon le type d\'orchestrateur', async () => {
            // Arrangement
            const taskId = 'test-task-id';

            // Action & Assertion
            await standardizedOrchestrator.getTaskStatus(taskId, 'temporal');
            expect(temporal.getWorkflowStatus).toHaveBeenCalledWith(taskId);

            await standardizedOrchestrator.getTaskStatus(taskId, 'bullmq', 'test-queue');
            expect(bullmq.getTaskStatus).toHaveBeenCalledWith(taskId, 'test-queue');

            await standardizedOrchestrator.getTaskStatus(taskId, 'n8n');
            expect(n8n.getExecutionStatus).toHaveBeenCalledWith(taskId);
        });

        test('cancelTask devrait appeler la méthode appropriée selon le type d\'orchestrateur', async () => {
            // Arrangement
            const taskId = 'test-task-id';

            // Action & Assertion
            await standardizedOrchestrator.cancelTask(taskId, 'temporal');
            expect(temporal.cancelWorkflow).toHaveBeenCalledWith(taskId);

            await standardizedOrchestrator.cancelTask(taskId, 'bullmq', 'test-queue');
            expect(bullmq.cancelTask).toHaveBeenCalledWith(taskId, 'test-queue');

            await standardizedOrchestrator.cancelTask(taskId, 'n8n');
            expect(n8n.stopExecution).toHaveBeenCalledWith(taskId);
        });
    });
});