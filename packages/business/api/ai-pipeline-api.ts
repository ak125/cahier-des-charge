/**
 * API REST pour le Pipeline de Migration IA
 * 
 * Cette API permet de déclencher les workflows Temporal
 * et de consulter l'état d'avancement des migrations
 */

import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Types de workflows importés depuis le module Temporal
import {
    aiPipelineWorkflow,
    phpAnalyzerWorkflow,
    codeGeneratorWorkflow,
    docsGeneratorWorkflow,
    AiPipelineWorkflowInput
} from '../temporal/workflows/ai-pipeline-workflow';

// Configuration de l'API
const PORT = process.env.API_PORT || 3001;
const taskQueue = 'ai-pipeline-task-queue';
const statusFilePath = '/workspaces/cahier-des-charge/migrations/n8n-migration-status.json';

// Création de l'application Express
const app = express();
app.use(express.json());

// Connexion au serveur Temporal
let temporalClient: Client;

async function connectToTemporal() {
    const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });
    temporalClient = new Client({
        connection,
    });
    console.log('Connected to Temporal server');
}

// Interface pour le statut des migrations
interface MigrationStatus {
    workflows: {
        id: string;
        type: string;
        description: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        startedAt: string;
        completedAt?: string;
        workflowId: string;
        result?: any;
    }[];
}

// Charger ou initialiser le statut des migrations
function loadMigrationStatus(): MigrationStatus {
    try {
        if (fs.existsSync(statusFilePath)) {
            const statusJson = fs.readFileSync(statusFilePath, 'utf8');
            return JSON.parse(statusJson);
        }
    } catch (error) {
        console.error(`Error loading migration status: ${error}`);
    }

    // Retourner un statut vide par défaut
    return { workflows: [] };
}

// Sauvegarder le statut des migrations
function saveMigrationStatus(status: MigrationStatus): void {
    const dir = path.dirname(statusFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
}

// Routes de l'API

// Route pour lister le statut des migrations
app.get('/api/migrations/status', (req, res) => {
    const status = loadMigrationStatus();
    res.json(status);
});

// Route pour démarrer une analyse PHP
app.post('/api/migrations/php-analysis', async (req, res) => {
    try {
        // Paramètres de l'analyse
        const params = {
            sourcePath: req.body.sourcePath || '/workspaces/cahier-des-charge/app/legacy',
            fileExtensions: req.body.fileExtensions || ['php'],
            recursive: req.body.recursive !== false,
            exclude: req.body.exclude || ['vendor', 'node_modules'],
            limit: req.body.limit,
            outputDir: req.body.outputDir || '/workspaces/cahier-des-charge/reports/analysis',
            generateSummary: req.body.generateSummary !== false
        };

        // Identifiant unique pour le workflow
        const id = uuidv4();
        const workflowId = `php-analysis-${id}`;

        // Lancer le workflow
        const handle = await temporalClient.workflow.start(phpAnalyzerWorkflow, {
            args: [params],
            taskQueue,
            workflowId,
        });

        // Mettre à jour le statut
        const status = loadMigrationStatus();
        status.workflows.push({
            id,
            type: 'php-analysis',
            description: `Analyse PHP de ${params.sourcePath}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            workflowId,
        });
        saveMigrationStatus(status);

        // Répondre avec l'ID du workflow
        res.json({
            id,
            workflowId,
            status: 'running',
            message: 'PHP analysis started successfully'
        });
    } catch (error) {
        console.error(`Error starting PHP analysis: ${error}`);
        res.status(500).json({
            error: 'Failed to start PHP analysis',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route pour démarrer une génération de code
app.post('/api/migrations/code-generation', async (req, res) => {
    try {
        // Paramètres de la génération de code
        const params = {
            phpSourcePath: req.body.phpSourcePath || '/workspaces/cahier-des-charge/app/legacy',
            outputDir: req.body.outputDir || '/workspaces/cahier-des-charge/app/migrated',
            framework: req.body.framework || 'nestjs',
            includeTests: req.body.includeTests !== false,
            templateDir: req.body.templateDir
        };

        // Identifiant unique pour le workflow
        const id = uuidv4();
        const workflowId = `code-generation-${id}`;

        // Lancer le workflow
        const handle = await temporalClient.workflow.start(codeGeneratorWorkflow, {
            args: [params],
            taskQueue,
            workflowId,
        });

        // Mettre à jour le statut
        const status = loadMigrationStatus();
        status.workflows.push({
            id,
            type: 'code-generation',
            description: `Génération de code pour ${params.phpSourcePath} vers ${params.framework}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            workflowId,
        });
        saveMigrationStatus(status);

        // Répondre avec l'ID du workflow
        res.json({
            id,
            workflowId,
            status: 'running',
            message: 'Code generation started successfully'
        });
    } catch (error) {
        console.error(`Error starting code generation: ${error}`);
        res.status(500).json({
            error: 'Failed to start code generation',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route pour démarrer une génération de documentation
app.post('/api/migrations/docs-generation', async (req, res) => {
    try {
        // Paramètres de la génération de documentation
        const params = {
            phpSourcePath: req.body.phpSourcePath || '/workspaces/cahier-des-charge/app/legacy',
            includeGeneratedCode: req.body.includeGeneratedCode !== false,
            codeOutputDir: req.body.codeOutputDir || '/workspaces/cahier-des-charge/app/migrated',
            framework: req.body.framework || 'nestjs',
            docsOutputDir: req.body.docsOutputDir || '/workspaces/cahier-des-charge/documentation/docs/generated',
            format: req.body.format || 'markdown',
            projectName: req.body.projectName || 'Projet de Migration',
            version: req.body.version || '1.0.0'
        };

        // Identifiant unique pour le workflow
        const id = uuidv4();
        const workflowId = `docs-generation-${id}`;

        // Lancer le workflow
        const handle = await temporalClient.workflow.start(docsGeneratorWorkflow, {
            args: [params],
            taskQueue,
            workflowId,
        });

        // Mettre à jour le statut
        const status = loadMigrationStatus();
        status.workflows.push({
            id,
            type: 'docs-generation',
            description: `Génération de documentation pour ${params.phpSourcePath} au format ${params.format}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            workflowId,
        });
        saveMigrationStatus(status);

        // Répondre avec l'ID du workflow
        res.json({
            id,
            workflowId,
            status: 'running',
            message: 'Documentation generation started successfully'
        });
    } catch (error) {
        console.error(`Error starting documentation generation: ${error}`);
        res.status(500).json({
            error: 'Failed to start documentation generation',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route pour démarrer le workflow complet
app.post('/api/migrations/full-pipeline', async (req, res) => {
    try {
        // Paramètres du workflow complet
        const params: AiPipelineWorkflowInput = {
            phpAnalysis: {
                enabled: req.body.phpAnalysis?.enabled !== false,
                sourcePath: req.body.phpAnalysis?.sourcePath || '/workspaces/cahier-des-charge/app/legacy',
                fileExtensions: req.body.phpAnalysis?.fileExtensions || ['php'],
                recursive: req.body.phpAnalysis?.recursive !== false,
                exclude: req.body.phpAnalysis?.exclude || ['vendor', 'node_modules'],
                limit: req.body.phpAnalysis?.limit,
                outputDir: req.body.phpAnalysis?.outputDir || '/workspaces/cahier-des-charge/reports/analysis',
                concurrency: req.body.phpAnalysis?.concurrency || 5
            },
            codeGeneration: {
                enabled: req.body.codeGeneration?.enabled !== false,
                outputDir: req.body.codeGeneration?.outputDir || '/workspaces/cahier-des-charge/app/migrated',
                framework: req.body.codeGeneration?.framework || 'nestjs',
                includeTests: req.body.codeGeneration?.includeTests !== false,
                concurrency: req.body.codeGeneration?.concurrency || 3
            },
            docsUpdate: {
                enabled: req.body.docsUpdate?.enabled !== false,
                outputDir: req.body.docsUpdate?.outputDir || '/workspaces/cahier-des-charge/documentation/docs/generated',
                format: req.body.docsUpdate?.format || 'markdown',
                metadata: {
                    projectName: req.body.docsUpdate?.metadata?.projectName || 'Projet de Migration',
                    version: req.body.docsUpdate?.metadata?.version || '1.0.0',
                    author: req.body.docsUpdate?.metadata?.author,
                    teamId: req.body.docsUpdate?.metadata?.teamId
                },
                concurrency: req.body.docsUpdate?.concurrency || 3
            }
        };

        // Identifiant unique pour le workflow
        const id = uuidv4();
        const workflowId = `full-pipeline-${id}`;

        // Lancer le workflow
        const handle = await temporalClient.workflow.start(aiPipelineWorkflow, {
            args: [params],
            taskQueue,
            workflowId,
        });

        // Mettre à jour le statut
        const status = loadMigrationStatus();
        status.workflows.push({
            id,
            type: 'full-pipeline',
            description: `Pipeline complet pour ${params.phpAnalysis.sourcePath}`,
            status: 'running',
            startedAt: new Date().toISOString(),
            workflowId,
        });
        saveMigrationStatus(status);

        // Répondre avec l'ID du workflow
        res.json({
            id,
            workflowId,
            status: 'running',
            message: 'Full migration pipeline started successfully'
        });
    } catch (error) {
        console.error(`Error starting full pipeline: ${error}`);
        res.status(500).json({
            error: 'Failed to start full pipeline',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route pour obtenir le statut d'un workflow spécifique
app.get('/api/migrations/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Charger le statut des migrations
        const status = loadMigrationStatus();
        const workflow = status.workflows.find(w => w.id === id);

        if (!workflow) {
            return res.status(404).json({
                error: 'Workflow not found',
                message: `No workflow with id ${id} was found`
            });
        }

        // Si le workflow est toujours en cours d'exécution, vérifier son état
        if (workflow.status === 'running') {
            try {
                const handle = temporalClient.workflow.getHandle(workflow.workflowId);
                const description = await handle.describe();

                // Vérifier si le workflow est terminé
                if (description.status.name === 'COMPLETED') {
                    // Récupérer le résultat
                    const result = await handle.result();
                    workflow.status = 'completed';
                    workflow.completedAt = new Date().toISOString();
                    workflow.result = result;
                    saveMigrationStatus(status);
                } else if (description.status.name === 'FAILED') {
                    workflow.status = 'failed';
                    workflow.completedAt = new Date().toISOString();
                    saveMigrationStatus(status);
                }
            } catch (error) {
                console.error(`Error checking workflow status: ${error}`);
            }
        }

        res.json(workflow);
    } catch (error) {
        console.error(`Error getting workflow status: ${error}`);
        res.status(500).json({
            error: 'Failed to get workflow status',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route pour mettre à jour le statut d'un workflow
app.put('/api/migrations/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        if (!['pending', 'running', 'completed', 'failed'].includes(newStatus)) {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'Status must be one of: pending, running, completed, failed'
            });
        }

        // Charger le statut des migrations
        const status = loadMigrationStatus();
        const workflow = status.workflows.find(w => w.id === id);

        if (!workflow) {
            return res.status(404).json({
                error: 'Workflow not found',
                message: `No workflow with id ${id} was found`
            });
        }

        // Mettre à jour le statut
        workflow.status = newStatus;
        if (newStatus === 'completed' || newStatus === 'failed') {
            workflow.completedAt = new Date().toISOString();
        }

        saveMigrationStatus(status);

        res.json(workflow);
    } catch (error) {
        console.error(`Error updating workflow status: ${error}`);
        res.status(500).json({
            error: 'Failed to update workflow status',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Démarrer le serveur API
async function startServer() {
    try {
        await connectToTemporal();

        app.listen(PORT, () => {
            console.log(`AI Pipeline API running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(`Failed to start API server: ${error}`);
        process.exit(1);
    }
}

// Exécuter le serveur
if (require.main === module) {
    startServer();
}

// Exporter l'application pour les tests
export { app };