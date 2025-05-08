/**
 * Tests pour le workflow SQL Analyzer & Prisma Builder
 * 
 * Ces tests vérifient le bon fonctionnement du workflow qui remplace
 * le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 */

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities/sql-analyzer-activities';
import { sqlAnalyzerPrismaBuilderWorkflow } from '../workflows/sql-analyzer-workflow';
import { mock, spy } from 'jest-mock';

// Mock des activités
jest.mock('../activities/sql-analyzer-activities', () => ({
    prepareAnalysis: jest.fn(),
    analyzeSQL: jest.fn(),
    generatePrismaSchema: jest.fn(),
    validatePrismaSchema: jest.fn(),
    applyMigration: jest.fn(),
    verifyGeneratedFiles: jest.fn(),
    commitFilesToGit: jest.fn(),
    createArchive: jest.fn(),
    generateExecutionSummary: jest.fn(),
}));

describe('SQL Analyzer & Prisma Builder Workflow', () => {
    let testEnv: TestWorkflowEnvironment;
    let worker: Worker;

    beforeAll(async () => {
        // Créer l'environnement de test
        testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    });

    afterAll(async () => {
        await testEnv?.teardown();
    });

    beforeEach(async () => {
        // Réinitialiser les mocks
        jest.clearAllMocks();

        // Créer un worker de test
        worker = await Worker.create({
            connection: testEnv.nativeConnection,
            taskQueue: 'test-queue',
            workflowsPath: require.resolve('../workflows/sql-analyzer-workflow'),
            activities,
        });
    });

    test('doit exécuter avec succès le workflow complet', async () => {
        // Configuration des mocks
        const mockOutputDir = '/workspaces/cahier-des-charge/reports/sql-audit-test';

        // Mock des réponses des activités
        (activities.prepareAnalysis as jest.Mock).mockResolvedValue({
            config: {
                connectionString: 'mysql://user:password@localhost:3306/testdb',
                dialect: 'mysql',
                databaseName: 'testdb',
                generatePrisma: true,
            },
            outputDir: mockOutputDir,
        });

        (activities.analyzeSQL as jest.Mock).mockResolvedValue({
            tables: [{ name: 'users' }, { name: 'posts' }],
            relationships: [{ sourceTable: 'users', targetTable: 'posts' }],
            dialect: 'mysql',
            metadata: {
                analyzedAt: new Date().toISOString(),
                totalTables: 2,
                totalColumns: 10,
                totalRelationships: 1,
            }
        });

        (activities.verifyGeneratedFiles as jest.Mock).mockResolvedValue({
            success: true,
            files: ['mysql_schema_map.json', 'prisma_models.suggestion.prisma'],
            missing: [],
        });

        (activities.generatePrismaSchema as jest.Mock).mockResolvedValue({
            schema: 'model User { id Int @id }',
            models: 2,
            enums: 1,
            generatedAt: new Date().toISOString(),
        });

        (activities.generateExecutionSummary as jest.Mock).mockResolvedValue({
            summary: {
                success: true,
                timestamp: new Date().toISOString(),
                database: 'testdb',
            },
            summaryPath: `${mockOutputDir}/execution_summary.json`,
        });

        // Exécuter le workflow
        const client = testEnv.client;
        const result = await client.workflow.execute(sqlAnalyzerPrismaBuilderWorkflow, {
            taskQueue: 'test-queue',
            workflowId: 'test-workflow-id',
            args: [{
                connectionString: 'mysql://user:password@localhost:3306/testdb',
                dialect: 'mysql',
                databaseName: 'testdb',
                generatePrisma: true,
            }],
        });

        // Vérifier le résultat
        expect(result.status).toBe('completed');
        expect(result.schema).toBeDefined();
        expect(result.outputDir).toBe(mockOutputDir);
        expect(result.files).toEqual(['mysql_schema_map.json', 'prisma_models.suggestion.prisma']);

        // Vérifier que les activités ont été appelées
        expect(activities.prepareAnalysis).toHaveBeenCalledTimes(1);
        expect(activities.analyzeSQL).toHaveBeenCalledTimes(1);
        expect(activities.verifyGeneratedFiles).toHaveBeenCalledTimes(1);
        expect(activities.generatePrismaSchema).toHaveBeenCalledTimes(1);
        expect(activities.generateExecutionSummary).toHaveBeenCalledTimes(1);
    });

    test('doit gérer les erreurs lors de la vérification des fichiers', async () => {
        // Configuration des mocks
        const mockOutputDir = '/workspaces/cahier-des-charge/reports/sql-audit-test';

        // Mock des réponses des activités
        (activities.prepareAnalysis as jest.Mock).mockResolvedValue({
            config: {
                connectionString: 'mysql://user:password@localhost:3306/testdb',
                dialect: 'mysql',
                databaseName: 'testdb',
            },
            outputDir: mockOutputDir,
        });

        (activities.analyzeSQL as jest.Mock).mockResolvedValue({
            tables: [{ name: 'users' }, { name: 'posts' }],
            relationships: [],
            dialect: 'mysql',
            metadata: {
                analyzedAt: new Date().toISOString(),
                totalTables: 2,
                totalColumns: 10,
                totalRelationships: 0,
            }
        });

        // Simuler une erreur : fichiers manquants
        (activities.verifyGeneratedFiles as jest.Mock).mockResolvedValue({
            success: false,
            files: ['mysql_schema_map.json'],
            missing: ['prisma_models.suggestion.prisma'],
        });

        // Exécuter le workflow
        const client = testEnv.client;
        const result = await client.workflow.execute(sqlAnalyzerPrismaBuilderWorkflow, {
            taskQueue: 'test-queue',
            workflowId: 'test-workflow-id',
            args: [{
                connectionString: 'mysql://user:password@localhost:3306/testdb',
                dialect: 'mysql',
                databaseName: 'testdb',
                generatePrisma: true,
            }],
        });

        // Vérifier que le workflow indique une erreur
        expect(result.status).toBe('error');
        expect(result.message).toContain('prisma_models.suggestion.prisma');
        expect(result.outputDir).toBe(mockOutputDir);
        expect(result.files).toEqual(['mysql_schema_map.json']);

        // Vérifier que les activités ont été appelées
        expect(activities.prepareAnalysis).toHaveBeenCalledTimes(1);
        expect(activities.analyzeSQL).toHaveBeenCalledTimes(1);
        expect(activities.verifyGeneratedFiles).toHaveBeenCalledTimes(1);

        // L'activité generatePrismaSchema ne devrait pas être appelée car la vérification a échoué
        expect(activities.generatePrismaSchema).not.toHaveBeenCalled();
    });
});