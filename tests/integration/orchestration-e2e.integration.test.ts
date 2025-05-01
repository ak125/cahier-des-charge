/**
 * Test d'intégration de bout en bout pour le processus d'orchestration
 *
 * Ce test simule un flux complet d'orchestration avec l'orchestrateur standardisé,
 * en vérifiant les interactions avec les différents composants du système.
 */

import { jest } from '@jest/globals';
import { TaskStatus } from '../../src/orchestration/orchestrator-adapter';
import {
  TaskType,
  standardizedOrchestrator,
} from '../../src/orchestration/standardized-orchestrator';

// Mock des modules externes pour éviter les connexions réelles aux services
jest.mock('../../src/orchestration/unified-orchestrator');
jest.mock('../../src/orchestration/temporal-client');

// Mocks pour les services métier qui seront utilisés dans le workflow
jest.mock('../../src/modules/php-analyzer/php-analyzer.service', () => ({
  PhpAnalyzerService: jest.fn().mockImplementation(() => ({
    analyzeCode: jest.fn().mockResolvedValue({
      fileCount: 3,
      routes: ['/api/users', '/api/products'],
      entities: ['User', 'Product'],
      analyzed: true,
    }),
  })),
}));

jest.mock('../../src/modules/migration/migration.service', () => ({
  MigrationService: jest.fn().mockImplementation(() => ({
    migratePhpToRemix: jest.fn().mockResolvedValue({
      success: true,
      migratedFiles: [
        { source: 'api/users.php', target: 'app/routes/api/users.tsx' },
        { source: 'api/products.php', target: 'app/routes/api/products.tsx' },
      ],
      duration: 1250,
    }),
  })),
}));

describe("Orchestration E2E - Tests d'intégration", () => {
  let mockUnifiedOrchestrator;
  let mockTemporalClient;
  const TASK_ID = 'task-123456';
  const WORKFLOW_ID = 'workflow-987654';

  beforeAll(async () => {
    // Récupérer les mocks pour pouvoir les configurer
    const { unifiedOrchestrator } = require('../../src/orchestration/unified-orchestrator');
    mockUnifiedOrchestrator = unifiedOrchestrator;

    const { getTemporalClient } = require('../../src/orchestration/temporal-client');
    mockTemporalClient = {
      workflow: {
        start: jest.fn().mockReturnValue({
          workflowId: WORKFLOW_ID,
          firstExecutionRunId: 'run-123',
        }),
        getHandle: jest.fn().mockReturnValue({
          describe: jest.fn().mockResolvedValue({
            workflowType: { name: 'phpToRemixMigrationWorkflow' },
            status: { name: 'RUNNING' },
            startTime: new Date().toISOString(),
            closeTime: undefined,
          }),
          cancel: jest.fn().mockResolvedValue(undefined),
          result: jest.fn().mockResolvedValue({
            success: true,
            migratedFiles: 2,
            routes: 2,
          }),
        }),
      },
    };
    getTemporalClient.mockResolvedValue(mockTemporalClient);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuration par défaut des mocks pour chaque test
    mockUnifiedOrchestrator.scheduleTask.mockResolvedValue(TASK_ID);
    mockUnifiedOrchestrator.getTaskStatus.mockResolvedValue({
      id: TASK_ID,
      name: 'PhpAnalyzer',
      status: TaskStatus.COMPLETED,
      result: {
        fileCount: 3,
        routes: 2,
      },
    });
  });

  describe("Scénario E2E: Migration d'un projet PHP vers Remix", () => {
    it('devrait orchestrer avec succès le flux complet de migration PHP vers Remix', async () => {
      // 1. Simuler la soumission d'un projet pour analyse
      const projectPayload = {
        repositoryUrl: 'https://github.com/example/php-project',
        branch: 'main',
        basePath: '/src',
        options: {
          generateTests: true,
          createPullRequest: true,
        },
      };

      // 2. Planifier la tâche d'analyse PHP
      const analysisTaskId = await standardizedOrchestrator.scheduleTask(
        'PhpAnalyzer',
        projectPayload,
        { taskType: TaskType.SIMPLE }
      );

      expect(analysisTaskId).toBe(TASK_ID);
      expect(mockUnifiedOrchestrator.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PhpAnalyzer',
          payload: projectPayload,
        })
      );

      // 3. Simuler la fin de l'analyse
      mockUnifiedOrchestrator.getTaskStatus.mockResolvedValueOnce({
        id: TASK_ID,
        name: 'PhpAnalyzer',
        status: TaskStatus.COMPLETED,
        result: {
          fileCount: 12,
          routes: ['/api/users', '/api/products'],
          entities: ['User', 'Product'],
          dependencies: ['database', 'session', 'auth'],
          complexity: 'medium',
        },
      });

      // 4. Vérifier le statut de l'analyse
      const analysisStatus = await standardizedOrchestrator.getTaskStatus(TASK_ID);
      expect(analysisStatus.status).toBe(TaskStatus.COMPLETED);
      expect(analysisStatus.result.fileCount).toBe(12);

      // 5. Lancer le workflow de migration basé sur les résultats de l'analyse
      const migrationPayload = {
        ...projectPayload,
        analysis: analysisStatus.result,
        targetFramework: 'remix',
        migrationStrategy: 'progressive',
      };

      const migrationWorkflowId = await standardizedOrchestrator.scheduleTask(
        'phpToRemixMigration',
        migrationPayload,
        {
          taskType: TaskType.COMPLEX,
          temporal: {
            workflowType: 'phpToRemixMigrationWorkflow',
            workflowArgs: [migrationPayload],
            taskQueue: 'migration-queue',
            trackingQueue: 'migration-tracking',
          },
        }
      );

      expect(migrationWorkflowId).toBe(WORKFLOW_ID);
      expect(mockTemporalClient.workflow.start).toHaveBeenCalledWith(
        'phpToRemixMigrationWorkflow',
        expect.objectContaining({
          args: [migrationPayload],
          taskQueue: 'migration-queue',
        })
      );

      // 6. Vérifier que la tâche de suivi a été créée
      expect(mockUnifiedOrchestrator.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tracking-phpToRemixMigration',
          payload: expect.objectContaining({
            temporalWorkflowId: WORKFLOW_ID,
          }),
        })
      );

      // 7. Simuler la progression du workflow
      const workflowHandle = mockTemporalClient.workflow.getHandle(WORKFLOW_ID);

      // 7.1 Simuler la description du workflow en cours
      workflowHandle.describe.mockResolvedValueOnce({
        workflowType: { name: 'phpToRemixMigrationWorkflow' },
        status: { name: 'RUNNING' },
        startTime: new Date().toISOString(),
        closeTime: undefined,
      });

      // 7.2 Vérifier le statut du workflow
      const runningStatus = await standardizedOrchestrator.getTaskStatus(WORKFLOW_ID);
      expect(runningStatus.status).toBe(TaskStatus.RUNNING);

      // 8. Simuler la fin du workflow
      workflowHandle.describe.mockResolvedValueOnce({
        workflowType: { name: 'phpToRemixMigrationWorkflow' },
        status: { name: 'COMPLETED' },
        startTime: new Date().toISOString(),
        closeTime: new Date().toISOString(),
      });

      // 9. Vérifier le résultat final
      const completedStatus = await standardizedOrchestrator.getTaskStatus(WORKFLOW_ID);
      expect(completedStatus.status).toBe(TaskStatus.COMPLETED);
    });

    it("devrait gérer correctement l'annulation d'un workflow en cours", async () => {
      // 1. Soumettre une tâche de migration
      const migrationPayload = {
        repositoryUrl: 'https://github.com/example/php-project',
        targetFramework: 'remix',
      };

      const workflowId = await standardizedOrchestrator.scheduleTask(
        'phpToRemixMigration',
        migrationPayload,
        {
          taskType: TaskType.COMPLEX,
          temporal: {
            workflowType: 'phpToRemixMigrationWorkflow',
            workflowArgs: [migrationPayload],
            taskQueue: 'migration-queue',
          },
        }
      );

      expect(workflowId).toBe(WORKFLOW_ID);

      // 2. Simuler une décision d'annuler le workflow
      const cancelled = await standardizedOrchestrator.cancelTask(WORKFLOW_ID);

      expect(cancelled).toBe(true);
      const workflowHandle = mockTemporalClient.workflow.getHandle(WORKFLOW_ID);
      expect(workflowHandle.cancel).toHaveBeenCalled();
    });

    it('devrait traiter les erreurs pendant le workflow de migration', async () => {
      // 1. Soumettre une tâche de migration
      const migrationPayload = {
        repositoryUrl: 'https://github.com/example/php-project',
        targetFramework: 'remix',
      };

      // 2. Simuler une erreur dans Temporal
      mockTemporalClient.workflow.start.mockImplementationOnce(() => {
        throw new Error('Temporal service unavailable');
      });

      // 3. Vérifier que l'erreur est propagée correctement
      await expect(
        standardizedOrchestrator.scheduleTask('phpToRemixMigration', migrationPayload, {
          taskType: TaskType.COMPLEX,
          temporal: {
            workflowType: 'phpToRemixMigrationWorkflow',
            workflowArgs: [migrationPayload],
            taskQueue: 'migration-queue',
          },
        })
      ).rejects.toThrow('Temporal service unavailable');
    });
  });

  describe("Scénario E2E: Traitement d'une file d'attente de migrations", () => {
    it('devrait gérer plusieurs tâches de migration en parallèle', async () => {
      // 1. Préparer trois tâches de migration
      const tasks = [
        {
          repository: 'repo1',
          targetFramework: 'remix',
        },
        {
          repository: 'repo2',
          targetFramework: 'remix',
        },
        {
          repository: 'repo3',
          targetFramework: 'remix',
        },
      ];

      // 2. Configurer les mocks pour retourner des IDs différents
      mockUnifiedOrchestrator.scheduleTask
        .mockResolvedValueOnce('task-1')
        .mockResolvedValueOnce('task-2')
        .mockResolvedValueOnce('task-3');

      mockTemporalClient.workflow.start
        .mockReturnValueOnce({ workflowId: 'workflow-1', firstExecutionRunId: 'run-1' })
        .mockReturnValueOnce({ workflowId: 'workflow-2', firstExecutionRunId: 'run-2' })
        .mockReturnValueOnce({ workflowId: 'workflow-3', firstExecutionRunId: 'run-3' });

      // 3. Planifier toutes les tâches et collecter les IDs
      const taskIds = [];
      for (const task of tasks) {
        // a. Première tâche: Analyse
        const analysisTaskId = await standardizedOrchestrator.scheduleTask('PhpAnalyzer', task, {
          taskType: TaskType.SIMPLE,
        });

        // b. Seconde tâche: Migration (workflow)
        const migrationWorkflowId = await standardizedOrchestrator.scheduleTask(
          'phpToRemixMigration',
          { ...task, analysisId: analysisTaskId },
          {
            taskType: TaskType.COMPLEX,
            temporal: {
              workflowType: 'phpToRemixMigrationWorkflow',
              workflowArgs: [{ ...task, analysisId: analysisTaskId }],
              taskQueue: 'migration-queue',
            },
          }
        );

        taskIds.push({ analysisTaskId, migrationWorkflowId });
      }

      // 4. Vérifier que toutes les tâches ont été planifiées correctement
      expect(taskIds).toHaveLength(3);
      expect(mockUnifiedOrchestrator.scheduleTask).toHaveBeenCalledTimes(3);
      expect(mockTemporalClient.workflow.start).toHaveBeenCalledTimes(3);

      // 5. Vérifier que les tâches sont différentes
      const uniqueTaskIds = new Set(taskIds.map((item) => item.analysisTaskId));
      const uniqueWorkflowIds = new Set(taskIds.map((item) => item.migrationWorkflowId));

      expect(uniqueTaskIds.size).toBe(3);
      expect(uniqueWorkflowIds.size).toBe(3);
    });
  });
});
