/**
 * Tests d'intégration pour l'orchestrateur standardisé
 * 
 * Ces tests vérifient l'intégration avec les composants externes et
 * le bon fonctionnement du pont de compatibilité.
 */

import { standardizedOrchestrator } from '../../standardized-orchestrator';
import { orchestratorBridge } from '../../orchestrator-bridge';

// Import depuis l'ancien chemin pour vérifier la compatibilité
import * as oldOrchestration from '../../../orchestration';

// Mock pour les composants externes qui utilisent l'orchestrateur
class MockAgent {
    async executeTask(type: string, data: any) {
        return await orchestratorBridge.scheduleTask(type, data, { isComplex: type.includes('complex') });
    }

    async checkTaskStatus(taskId: string) {
        return await orchestratorBridge.getTaskStatus(taskId);
    }
}

// Mock pour les intégrations legacy qui utilisent l'ancien système
class LegacySystem {
    async runWorkflow(type: string, data: any) {
        return await oldOrchestration.standardizedOrchestrator.schedule({
            type,
            data,
            isComplex: type.includes('complex')
        });
    }
}

// Mocks pour les orchestrateurs
jest.mock('../../temporal', () => ({
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

jest.mock('../../queue', () => ({
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

describe('Tests d\'intégration de l\'orchestrateur', () => {
    // Espionner les méthodes de standardizedOrchestrator pour vérifier les appels
    const originalGetTaskStatus = standardizedOrchestrator.getTaskStatus;

    beforeEach(() => {
        jest.clearAllMocks();

        // Réinitialisation du spy console.warn à chaque test
        jest.spyOn(console, 'warn').mockImplementation(() => { });

        // Espionner la méthode getTaskStatus de standardizedOrchestrator
        standardizedOrchestrator.getTaskStatus = jest.fn().mockImplementation(originalGetTaskStatus);
    });

    afterEach(() => {
        // Restaurer la méthode originale après les tests
        standardizedOrchestrator.getTaskStatus = originalGetTaskStatus;
        jest.restoreAllMocks();
    });

    describe('Intégration avec les agents', () => {
        test('Un agent devrait pouvoir planifier une tâche via le pont d\'orchestrateur', async () => {
            // Arrangement
            const agent = new MockAgent();

            // Action
            const taskId = await agent.executeTask('process-document', { docId: '123' });

            // Assertion
            expect(taskId).toBe('bullmq-task-id'); // Tâche simple par défaut
        });

        test('Un agent devrait pouvoir planifier une tâche complexe via le pont d\'orchestrateur', async () => {
            // Arrangement
            const agent = new MockAgent();

            // Action
            const taskId = await agent.executeTask('complex-migration', { sourceId: '456' });

            // Assertion
            // Le pont devrait détecter que c'est une tâche complexe (via le nom) et utiliser Temporal
            expect(taskId).toBe('temporal-task-id');
        });

        test('Un agent devrait pouvoir vérifier le statut d\'une tâche', async () => {
            // Arrangement
            const agent = new MockAgent();
            const mockTaskId = 'test-task-id';

            // Action
            await agent.checkTaskStatus(mockTaskId);

            // Assertion
            // Le pont va essayer les différents orchestrateurs jusqu'à trouver le bon
            expect(standardizedOrchestrator.getTaskStatus).toHaveBeenCalled();
        });
    });

    describe('Compatibilité avec l\'ancien système', () => {
        test('Le système legacy devrait pouvoir utiliser l\'orchestrateur via le pont de compatibilité', async () => {
            // Arrangement
            const legacySystem = new LegacySystem();

            // Nous ne testons pas l'appel à console.warn mais plutôt la fonctionnalité
            // car les avertissements sont émis lors de l'importation du module

            // Action
            const taskId = await legacySystem.runWorkflow('legacy-process', { data: 'test' });

            // Assertion
            // La redirection depuis l'ancien module devrait fonctionner
            expect(taskId).toBe('bullmq-task-id');

            // Vérifier que le module utilise bien l'orchestrateur standardisé
            expect(oldOrchestration.standardizedOrchestrator).toBe(standardizedOrchestrator);
        });

        test('Les imports depuis l\'ancien chemin devraient être redirigés vers la nouvelle implémentation', () => {
            // Assertion
            // Vérifier que l'ancien module redirige vers la nouvelle implémentation
            expect(oldOrchestration.standardizedOrchestrator).toBe(standardizedOrchestrator);
        });
    });
});