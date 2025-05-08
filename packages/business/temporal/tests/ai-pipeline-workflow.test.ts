/**
 * Tests pour le workflow Pipeline de Migration IA
 * 
 * Ces tests vérifient le bon fonctionnement du workflow qui remplace
 * le workflow n8n "Pipeline de Migration IA"
 */

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities/ai-pipeline/php-analyzer-activities';
import { aiPipelineWorkflow, phpAnalyzerWorkflow } from '../workflows/ai-pipeline-workflow';
import { mock } from 'jest-mock';

// Mock des activités
jest.mock('../activities/ai-pipeline/php-analyzer-activities', () => ({
    listPhpFiles: jest.fn(),
    analyzePhpFile: jest.fn(),
    saveAnalysisResult: jest.fn(),
    batchAnalyzePhpFiles: jest.fn(),
    generateAnalysisSummary: jest.fn(),
}));

describe('Pipeline de Migration IA Workflow', () => {
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
            workflowsPath: require.resolve('../workflows/ai-pipeline-workflow'),
            activities,
        });
    });

    test('doit exécuter le workflow PHP Analyzer avec succès', async () => {
        // Configuration des mocks
        const mockPhpFiles = [
            {
                path: '/workspaces/cahier-des-charge/app/legacy/file1.php',
                filename: 'file1.php',
                basename: 'file1',
                extension: 'php',
                directory: '/workspaces/cahier-des-charge/app/legacy'
            },
            {
                path: '/workspaces/cahier-des-charge/app/legacy/file2.php',
                filename: 'file2.php',
                basename: 'file2',
                extension: 'php',
                directory: '/workspaces/cahier-des-charge/app/legacy'
            }
        ];

        const mockAnalysisResults = {
            successful: 2,
            failed: 0,
            results: [
                {
                    file: mockPhpFiles[0],
                    analysis: {
                        classes: ['Class1'],
                        functions: ['function1', 'function2'],
                        dependencies: ['dependency1'],
                        complexity: 5,
                        loc: 100,
                        issues: [],
                        migrationEstimate: {
                            difficulty: 'simple',
                            timeEstimate: 1,
                            potentialIssues: []
                        }
                    },
                    metadata: {
                        analyzedAt: new Date().toISOString(),
                        analysisVersion: '1.0.0',
                        duration: 120
                    }
                },
                {
                    file: mockPhpFiles[1],
                    analysis: {
                        classes: ['Class2'],
                        functions: ['function3'],
                        dependencies: ['dependency2'],
                        complexity: 8,
                        loc: 150,
                        issues: [],
                        migrationEstimate: {
                            difficulty: 'medium',
                            timeEstimate: 2,
                            potentialIssues: []
                        }
                    },
                    metadata: {
                        analyzedAt: new Date().toISOString(),
                        analysisVersion: '1.0.0',
                        duration: 150
                    }
                }
            ]
        };

        const mockSummary = {
            summary: {
                totalFiles: 2,
                totalIssues: 0,
                complexityStats: {
                    average: 6.5,
                    max: 8,
                    min: 5,
                    filesAboveThreshold: 0
                },
                difficultyDistribution: {
                    simple: 1,
                    medium: 1,
                    complex: 0
                },
                commonIssues: [],
                estimatedMigrationTime: 3,
                dependencies: [
                    { name: 'dependency1', count: 1 },
                    { name: 'dependency2', count: 1 }
                ]
            },
            summaryPath: '/workspaces/cahier-des-charge/reports/analysis/summary.json'
        };

        // Mock des réponses des activités
        (activities.listPhpFiles as jest.Mock).mockResolvedValue(mockPhpFiles);
        (activities.batchAnalyzePhpFiles as jest.Mock).mockResolvedValue(mockAnalysisResults);
        (activities.generateAnalysisSummary as jest.Mock).mockResolvedValue(mockSummary);

        // Exécuter le workflow
        const client = testEnv.client;
        const result = await client.workflow.execute(phpAnalyzerWorkflow, {
            taskQueue: 'test-queue',
            workflowId: 'test-workflow-id',
            args: [{
                sourcePath: '/workspaces/cahier-des-charge/app/legacy',
                fileExtensions: ['php'],
                outputDir: '/workspaces/cahier-des-charge/reports/analysis'
            }],
        });

        // Vérifier le résultat
        expect(result).toBeDefined();
        expect(result?.success).toBe(true);
        expect(result?.totalFiles).toBe(2);
        expect(result?.analyzedFiles).toBe(2);
        expect(result?.failedFiles).toBe(0);
        expect(result?.summaryPath).toBeDefined();
        expect(result?.summary).toBeDefined();

        // Vérifier que les activités ont été appelées
        expect(activities.listPhpFiles).toHaveBeenCalledTimes(1);
        expect(activities.batchAnalyzePhpFiles).toHaveBeenCalledTimes(1);
        expect(activities.generateAnalysisSummary).toHaveBeenCalledTimes(1);
    });

    test('doit exécuter le workflow complet avec succès', async () => {
        // Configuration des mocks comme dans le test précédent
        const mockPhpFiles = [
            {
                path: '/workspaces/cahier-des-charge/app/legacy/file1.php',
                filename: 'file1.php',
                basename: 'file1',
                extension: 'php',
                directory: '/workspaces/cahier-des-charge/app/legacy'
            }
        ];

        const mockAnalysisResults = {
            successful: 1,
            failed: 0,
            results: [
                {
                    file: mockPhpFiles[0],
                    analysis: {
                        classes: ['Class1'],
                        functions: ['function1'],
                        dependencies: ['dependency1'],
                        complexity: 5,
                        loc: 100,
                        issues: [],
                        migrationEstimate: {
                            difficulty: 'simple',
                            timeEstimate: 1,
                            potentialIssues: []
                        }
                    },
                    metadata: {
                        analyzedAt: new Date().toISOString(),
                        analysisVersion: '1.0.0',
                        duration: 120
                    }
                }
            ]
        };

        const mockSummary = {
            summary: {
                totalFiles: 1,
                totalIssues: 0,
                complexityStats: {
                    average: 5,
                    max: 5,
                    min: 5,
                    filesAboveThreshold: 0
                },
                difficultyDistribution: {
                    simple: 1,
                    medium: 0,
                    complex: 0
                },
                commonIssues: [],
                estimatedMigrationTime: 1,
                dependencies: [
                    { name: 'dependency1', count: 1 }
                ]
            },
            summaryPath: '/workspaces/cahier-des-charge/reports/analysis/summary.json'
        };

        // Mock des réponses des activités
        (activities.listPhpFiles as jest.Mock).mockResolvedValue(mockPhpFiles);
        (activities.batchAnalyzePhpFiles as jest.Mock).mockResolvedValue(mockAnalysisResults);
        (activities.generateAnalysisSummary as jest.Mock).mockResolvedValue(mockSummary);

        // Exécuter le workflow complet
        const client = testEnv.client;
        const result = await client.workflow.execute(aiPipelineWorkflow, {
            taskQueue: 'test-queue',
            workflowId: 'test-workflow-id',
            args: [{
                phpAnalysis: {
                    enabled: true,
                    sourcePath: '/workspaces/cahier-des-charge/app/legacy',
                    fileExtensions: ['php']
                },
                codeGeneration: {
                    enabled: false
                },
                docsUpdate: {
                    enabled: false
                }
            }],
        });

        // Vérifier le résultat global
        expect(result).toBeDefined();
        expect(result?.success).toBe(true);
        expect(result?.startTime).toBeDefined();
        expect(result?.endTime).toBeDefined();
        expect(result?.duration).toBeGreaterThan(0);

        // Vérifier le résultat de l'analyse PHP
        expect(result?.phpAnalysis).toBeDefined();
        expect(result?.phpAnalysis?.success).toBe(true);
        expect(result?.phpAnalysis?.totalFiles).toBe(1);
        expect(result?.phpAnalysis?.analyzedFiles).toBe(1);
        expect(result?.phpAnalysis?.summaryPath).toBeDefined();

        // Vérifier que les activités ont été appelées
        expect(activities.listPhpFiles).toHaveBeenCalledTimes(1);
        expect(activities.batchAnalyzePhpFiles).toHaveBeenCalledTimes(1);
        expect(activities.generateAnalysisSummary).toHaveBeenCalledTimes(1);
    });

    test('doit gérer les erreurs dans l\'analyse PHP', async () => {
        // Mock d'une erreur pendant l'analyse
        (activities.listPhpFiles as jest.Mock).mockResolvedValue([]);
        (activities.batchAnalyzePhpFiles as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

        // Exécuter le workflow
        const client = testEnv.client;
        const result = await client.workflow.execute(aiPipelineWorkflow, {
            taskQueue: 'test-queue',
            workflowId: 'test-workflow-id',
            args: [{
                phpAnalysis: {
                    enabled: true,
                    sourcePath: '/workspaces/cahier-des-charge/app/legacy',
                    fileExtensions: ['php']
                }
            }],
        });

        // Vérifier que le workflow indique une erreur
        expect(result.success).toBe(false);
        expect(result.startTime).toBeDefined();
        expect(result.endTime).toBeDefined();

        // Vérifier que les activités ont été appelées dans le bon ordre
        expect(activities.listPhpFiles).toHaveBeenCalledTimes(1);
        expect(activities.batchAnalyzePhpFiles).toHaveBeenCalledTimes(1);
        // generateAnalysisSummary ne devrait pas être appelé en cas d'erreur
        expect(activities.generateAnalysisSummary).not.toHaveBeenCalled();
    });
});