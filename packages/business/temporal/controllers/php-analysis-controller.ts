/**
 * Contrôleur REST API pour le workflow consolidé d'analyse PHP
 * 
 * Ce contrôleur fournit une API REST unifiée pour déclencher
 * et interagir avec le workflow d'analyse PHP consolidé.
 */

import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { ConsolidatedPhpAnalysisInput } from '../workflows/php-analysis/types';

// Configuration de la connexion Temporal
const temporalConfig = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default'
};

// Création du routeur Express
export const phpAnalysisRouter = express.Router();

/**
 * Endpoint pour lancer une analyse PHP consolidée
 * POST /api/php-analysis
 */
phpAnalysisRouter.post('/', async (req, res) => {
    try {
        // Récupérer les paramètres de la requête
        const input: ConsolidatedPhpAnalysisInput = req.body;

        // Validation de base
        if (!input || !input.sourcePath) {
            return res.status(400).json({
                error: 'Le chemin source (sourcePath) est requis'
            });
        }

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Générer un ID unique pour l'exécution du workflow
        const workflowId = `php-analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Démarrer le workflow
        const handle = await client.workflow.start('consolidatedPhpAnalyzerWorkflow', {
            taskQueue: 'php-analysis-queue',
            workflowId,
            args: [input],
        });

        // Répondre immédiatement (mode asynchrone)
        return res.status(202).json({
            message: 'Analyse PHP démarrée avec succès',
            workflowId,
            status: 'started',
            statusUrl: `/api/php-analysis/status/${workflowId}`,
            outputDir: input.outputDir || `/workspaces/cahier-des-charge/reports/php-analysis/${Date.now()}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'analyse PHP:', error);
        return res.status(500).json({
            error: `Échec du démarrage de l'analyse PHP: ${error.message}`
        });
    }
});

/**
 * Endpoint pour lancer une analyse PHP rapide
 * POST /api/php-analysis/quick
 */
phpAnalysisRouter.post('/quick', async (req, res) => {
    try {
        const { sourcePath, fileExtensions, exclude, outputDir } = req.body;

        // Validation de base
        if (!sourcePath) {
            return res.status(400).json({
                error: 'Le chemin source (sourcePath) est requis'
            });
        }

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Générer un ID unique pour l'exécution du workflow
        const workflowId = `quick-php-analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Démarrer le workflow rapide
        const handle = await client.workflow.start('quickPhpAnalysisWorkflow', {
            taskQueue: 'php-analysis-queue',
            workflowId,
            args: [sourcePath, { fileExtensions, exclude, outputDir }],
        });

        // Répondre immédiatement (mode asynchrone)
        return res.status(202).json({
            message: 'Analyse PHP rapide démarrée avec succès',
            workflowId,
            status: 'started',
            statusUrl: `/api/php-analysis/status/${workflowId}`,
            outputDir: outputDir || `/workspaces/cahier-des-charge/reports/php-analysis/quick-${Date.now()}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'analyse PHP rapide:', error);
        return res.status(500).json({
            error: `Échec du démarrage de l'analyse PHP rapide: ${error.message}`
        });
    }
});

/**
 * Endpoint pour vérifier le statut d'une analyse PHP
 * GET /api/php-analysis/status/:workflowId
 */
phpAnalysisRouter.get('/status/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Obtenir le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow est toujours en cours d'exécution
        const isRunning = await handle.isRunning();

        if (isRunning) {
            try {
                // Récupérer l'état actuel du workflow en utilisant une requête
                const status = await handle.query('getStatus');
                return res.status(200).json({
                    workflowId,
                    status: 'running',
                    details: status,
                    checkAgainIn: '30 seconds',
                });
            } catch (queryError) {
                // La requête n'est pas définie, retourner simplement "en cours d'exécution"
                return res.status(200).json({
                    workflowId,
                    status: 'running',
                    message: 'Workflow en cours d\'exécution',
                    checkAgainIn: '30 seconds',
                });
            }
        }

        // Si le workflow est terminé, récupérer le résultat
        try {
            const result = await handle.result();
            return res.status(200).json({
                workflowId,
                status: 'completed',
                message: 'Analyse PHP terminée avec succès',
                result,
            });
        } catch (resultError) {
            return res.status(200).json({
                workflowId,
                status: 'failed',
                message: `L'analyse PHP a échoué: ${resultError.message}`,
                error: resultError.message,
            });
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération du statut du workflow ${req.params.workflowId}:`, error);
        return res.status(500).json({
            error: `Échec de la récupération du statut: ${error.message}`
        });
    }
});

/**
 * Endpoint pour interrompre une analyse PHP en cours
 * POST /api/php-analysis/:workflowId/cancel
 */
phpAnalysisRouter.post('/:workflowId/cancel', async (req, res) => {
    try {
        const { workflowId } = req.params;

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Obtenir le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow est toujours en cours d'exécution
        const isRunning = await handle.isRunning();

        if (!isRunning) {
            return res.status(400).json({
                error: `Le workflow ${workflowId} n'est pas en cours d'exécution`
            });
        }

        // Envoyer le signal d'annulation
        await handle.signal('cancel');

        // Répondre avec succès
        return res.status(200).json({
            message: `Demande d'annulation envoyée pour le workflow ${workflowId}`,
            workflowId,
            status: 'cancelling',
        });
    } catch (error) {
        console.error(`Erreur lors de l'annulation du workflow ${req.params.workflowId}:`, error);
        return res.status(500).json({
            error: `Échec de l'annulation du workflow: ${error.message}`
        });
    }
});

/**
 * Endpoint pour mettre en pause une analyse PHP en cours
 * POST /api/php-analysis/:workflowId/pause
 */
phpAnalysisRouter.post('/:workflowId/pause', async (req, res) => {
    try {
        const { workflowId } = req.params;

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Obtenir le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow est toujours en cours d'exécution
        const isRunning = await handle.isRunning();

        if (!isRunning) {
            return res.status(400).json({
                error: `Le workflow ${workflowId} n'est pas en cours d'exécution`
            });
        }

        // Envoyer le signal de pause
        await handle.signal('pause');

        // Répondre avec succès
        return res.status(200).json({
            message: `Workflow ${workflowId} mis en pause`,
            workflowId,
            status: 'paused',
        });
    } catch (error) {
        console.error(`Erreur lors de la mise en pause du workflow ${req.params.workflowId}:`, error);
        return res.status(500).json({
            error: `Échec de la mise en pause du workflow: ${error.message}`
        });
    }
});

/**
 * Endpoint pour reprendre une analyse PHP en pause
 * POST /api/php-analysis/:workflowId/resume
 */
phpAnalysisRouter.post('/:workflowId/resume', async (req, res) => {
    try {
        const { workflowId } = req.params;

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Obtenir le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow est toujours en cours d'exécution
        const isRunning = await handle.isRunning();

        if (!isRunning) {
            return res.status(400).json({
                error: `Le workflow ${workflowId} n'est pas en cours d'exécution`
            });
        }

        // Envoyer le signal de reprise
        await handle.signal('resume');

        // Répondre avec succès
        return res.status(200).json({
            message: `Workflow ${workflowId} repris`,
            workflowId,
            status: 'running',
        });
    } catch (error) {
        console.error(`Erreur lors de la reprise du workflow ${req.params.workflowId}:`, error);
        return res.status(500).json({
            error: `Échec de la reprise du workflow: ${error.message}`
        });
    }
});

/**
 * Endpoint pour mettre à jour la configuration d'une analyse PHP en cours
 * PUT /api/php-analysis/:workflowId/config
 */
phpAnalysisRouter.put('/:workflowId/config', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const updatedConfig = req.body;

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Obtenir le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow est toujours en cours d'exécution
        const isRunning = await handle.isRunning();

        if (!isRunning) {
            return res.status(400).json({
                error: `Le workflow ${workflowId} n'est pas en cours d'exécution`
            });
        }

        // Envoyer le signal avec la nouvelle configuration
        await handle.signal('updateConfig', updatedConfig);

        // Répondre avec succès
        return res.status(200).json({
            message: `Configuration mise à jour pour le workflow ${workflowId}`,
            workflowId,
            updatedConfig,
        });
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de la configuration du workflow ${req.params.workflowId}:`, error);
        return res.status(500).json({
            error: `Échec de la mise à jour de la configuration: ${error.message}`
        });
    }
});