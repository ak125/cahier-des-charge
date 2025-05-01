/**
 * Tests d'intégration pour l'orchestrateur standardisé
 *
 * Ces tests vérifient que l'orchestrateur standardisé fonctionne correctement
 * dans différents scénarios d'utilisation, en intégrant BullMQ et Temporal.
 */

import { jest } from '@jest/globals';
import {
  TaskType,
  standardizedOrchestrator,
} from '../../src/orchestration/standardized-orchestrator';
import { unifiedOrchestrator } from '../../src/orchestration/unified-orchestrator';

// Mocks pour éviter des dépendances externes dans les tests
jest.mock('../../src/orchestration/unified-orchestrator', () => ({
  unifiedOrchestrator: {
    scheduleTask: jest.fn().mockResolvedValue('bull-task-id-123'),
    getTaskStatus: jest.fn().mockResolvedValue({
      id: 'bull-task-id-123',
      name: 'test-task',
      status: 'COMPLETED',
      source: 'BULLMQ',
    }),
    cancelTask: jest.fn().mockResolvedValue(true),
  },
}));

// Mock dynamique pour Temporal
jest.mock('../../src/orchestration/temporal-client', () => {
  const mockTemporalClient = {
    workflow: {
      start: jest.fn().mockReturnValue({
        workflowId: 'temporal-workflow-id-123',
        firstExecutionRunId: 'run-id-123',
      }),
      getHandle: jest.fn().mockReturnValue({
        describe: jest.fn().mockResolvedValue({
          workflowType: { name: 'test-workflow' },
          status: { name: 'RUNNING' },
          startTime: new Date().toISOString(),
          closeTime: undefined,
        }),
        cancel: jest.fn().mockResolvedValue(undefined),
      }),
    },
  };

  return {
    getTemporalClient: jest.fn().mockResolvedValue(mockTemporalClient),
  };
});

describe("Standardized Orchestrator - Tests d'intégration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tâches simples (BullMQ)', () => {
    it('devrait planifier une tâche simple avec succès', async () => {
      const taskName = 'test-simple-task';
      const payload = { data: 'test payload' };
      const options = {
        taskType: TaskType.SIMPLE,
        priority: 1,
        attempts: 3,
      };

      const taskId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);

      expect(taskId).toBe('bull-task-id-123');
      expect(unifiedOrchestrator.scheduleTask).toHaveBeenCalledWith({
        name: taskName,
        payload,
        options: {
          priority: options.priority,
          attempts: options.attempts,
          delay: undefined,
          timeout: undefined,
        },
      });
    });

    it("devrait récupérer le statut d'une tâche simple", async () => {
      const taskId = 'bull-task-id-123';

      const status = await standardizedOrchestrator.getTaskStatus(taskId);

      expect(status).toEqual({
        id: 'bull-task-id-123',
        name: 'test-task',
        status: 'COMPLETED',
        source: 'BULLMQ',
      });
      expect(unifiedOrchestrator.getTaskStatus).toHaveBeenCalledWith(taskId);
    });

    it('devrait annuler une tâche simple avec succès', async () => {
      const taskId = 'bull-task-id-123';

      const result = await standardizedOrchestrator.cancelTask(taskId);

      expect(result).toBe(true);
      expect(unifiedOrchestrator.cancelTask).toHaveBeenCalledWith(taskId);
    });
  });

  describe('Workflows complexes (Temporal)', () => {
    it('devrait planifier un workflow complexe avec succès', async () => {
      const taskName = 'test-complex-workflow';
      const payload = { data: 'test workflow payload' };
      const options = {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: 'test-workflow-type',
          workflowArgs: [payload],
          taskQueue: 'test-task-queue',
        },
      };

      const { getTemporalClient } = require('../../src/orchestration/temporal-client');
      const mockClient = await getTemporalClient();

      const workflowId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);

      expect(workflowId).toBe('temporal-workflow-id-123');
      expect(mockClient.workflow.start).toHaveBeenCalledWith('test-workflow-type', {
        args: [payload],
        taskQueue: 'test-task-queue',
        workflowId: expect.any(String),
      });
    });

    it('devrait planifier un workflow complexe avec tracking BullMQ', async () => {
      const taskName = 'test-complex-workflow-with-tracking';
      const payload = { data: 'test workflow payload with tracking' };
      const options = {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: 'test-workflow-type',
          workflowArgs: [payload],
          taskQueue: 'test-task-queue',
          trackingQueue: 'test-tracking-queue',
        },
      };

      const workflowId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);

      expect(workflowId).toBe('temporal-workflow-id-123');
      expect(unifiedOrchestrator.scheduleTask).toHaveBeenCalledWith({
        name: `tracking-${taskName}`,
        payload: expect.objectContaining({
          temporalWorkflowId: 'temporal-workflow-id-123',
          temporalRunId: 'run-id-123',
        }),
        options: expect.any(Object),
      });
    });

    it("devrait récupérer le statut d'un workflow complexe", async () => {
      // Simuler que la tâche n'est pas trouvée dans BullMQ
      (unifiedOrchestrator.getTaskStatus as jest.Mock).mockRejectedValueOnce(
        new Error('Task not found')
      );

      const taskId = 'temporal-workflow-id-123';

      const status = await standardizedOrchestrator.getTaskStatus(taskId);

      expect(status).toEqual({
        id: 'temporal-workflow-id-123',
        name: 'test-workflow',
        status: 'RUNNING',
        source: 'TEMPORAL',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        startedAt: expect.any(Date),
        completedAt: undefined,
      });
    });

    it('devrait annuler un workflow complexe avec succès', async () => {
      // Simuler que la tâche n'est pas trouvée dans BullMQ
      (unifiedOrchestrator.cancelTask as jest.Mock).mockRejectedValueOnce(
        new Error('Task not found')
      );

      const taskId = 'temporal-workflow-id-123';

      const result = await standardizedOrchestrator.cancelTask(taskId);

      expect(result).toBe(true);
      const { getTemporalClient } = require('../../src/orchestration/temporal-client');
      const mockClient = await getTemporalClient();
      const mockHandle = mockClient.workflow.getHandle(taskId);
      expect(mockHandle.cancel).toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait échouer correctement si les options Temporal sont manquantes', async () => {
      const taskName = 'test-error-workflow';
      const payload = { data: 'test error payload' };
      const options = {
        taskType: TaskType.COMPLEX,
      };

      await expect(
        standardizedOrchestrator.scheduleTask(taskName, payload, options)
      ).rejects.toThrow('Les options Temporal sont requises pour les workflows complexes');
    });

    it("devrait échouer correctement si la tâche n'est pas trouvée", async () => {
      // Simuler que la tâche n'est trouvée ni dans BullMQ ni dans Temporal
      (unifiedOrchestrator.getTaskStatus as jest.Mock).mockRejectedValueOnce(
        new Error('Task not found')
      );

      const { getTemporalClient } = require('../../src/orchestration/temporal-client');
      const mockClient = await getTemporalClient();
      // Faire échouer la recherche Temporal également
      mockClient.workflow.getHandle.mockImplementationOnce(() => {
        throw new Error('Workflow not found');
      });

      const taskId = 'non-existent-task-id';

      await expect(standardizedOrchestrator.getTaskStatus(taskId)).rejects.toThrow(
        `Tâche non trouvée: ${taskId}`
      );
    });
  });

  describe('Intégration avec NestJS', () => {
    it("devrait être utilisable avec l'injection de dépendances NestJS", async () => {
      const {
        StandardizedOrchestratorService,
      } = require('../../src/orchestration/standardized-orchestrator.service');

      // Instancier le service NestJS
      const service = new StandardizedOrchestratorService();

      // Vérifier que le service expose bien les mêmes méthodes que l'orchestrateur direct
      expect(typeof service.scheduleTask).toBe('function');
      expect(typeof service.getTaskStatus).toBe('function');
      expect(typeof service.cancelTask).toBe('function');

      // Vérifier que le service fonctionne comme prévu
      const taskName = 'test-service-task';
      const payload = { data: 'test service payload' };
      const options = {
        taskType: TaskType.SIMPLE,
        priority: 1,
      };

      const taskId = await service.scheduleTask(taskName, payload, options);
      expect(taskId).toBe('bull-task-id-123');
    });
  });
});
