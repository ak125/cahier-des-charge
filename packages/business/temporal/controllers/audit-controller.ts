/**
 * Contrôleur REST API pour le workflow consolidé d'audit
 * 
 * Ce contrôleur fournit une API REST unifiée pour déclencher
 * et interagir avec le workflow d'audit consolidé.
 */

import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { ConsolidatedAuditInput } from '../workflows/audit/types';

// Configuration de la connexion Temporal
const temporalConfig = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default'
};

// Création du routeur Express
export const auditRouter = express.Router();

/**
 * Endpoint pour lancer un audit consolidé
 * POST /api/audit
 */
auditRouter.post('/', async (req, res) => {
    try {
        // Récupérer les paramètres de la requête
        const input: ConsolidatedAuditInput = req.body;

        // Validation de base
        if (!input || !input.projectPath) {
            return res.status(400).json({
                error: 'Le chemin du projet (projectPath) est requis'
            });
        }

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Générer un ID unique pour l'exécution du workflow
        const workflowId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Démarrer le workflow
        const handle = await client.workflow.start('consolidatedAuditWorkflow', {
            taskQueue: 'audit-queue',
            workflowId,
            args: [input],
        });

        // Répondre immédiatement (mode asynchrone)
        return res.status(202).json({
            message: 'Audit démarré avec succès',
            workflowId,
            status: 'started',
            statusUrl: `/api/audit/status/${workflowId}`,
            outputDir: input.outputDir || `/workspaces/cahier-des-charge/reports/audit/${Date.now()}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'audit:', error);
        return res.status(500).json({
            error: `Échec du démarrage de l'audit: ${error.message}`
        });
    }
});

/**
 * Endpoint pour lancer un audit rapide
 * POST /api/audit/quick
 */
auditRouter.post('/quick', async (req, res) => {
    try {
        const { projectPath, outputDir, enabledAudits } = req.body;

        // Validation de base
        if (!projectPath) {
            return res.status(400).json({
                error: 'Le chemin du projet (projectPath) est requis'
            });
        }

        // Se connecter au client Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Générer un ID unique pour l'exécution du workflow
        const workflowId = `quick-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Démarrer le workflow rapide
        const handle = await client.workflow.start('quickAuditWorkflow', {
            taskQueue: 'audit-queue',
            workflowId,
            args: [projectPath, { outputDir, enabledAudits }],
        });

        // Répondre immédiatement (mode asynchrone)
        return res.status(202).json({
            message: 'Audit rapide démarré avec succès',
            workflowId,
            status: 'started',
            statusUrl: `/api/audit/status/${workflowId}`,
            outputDir: outputDir || `/workspaces/cahier-des-charge/reports/audit/quick-${Date.now()}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'audit rapide:', error);
        return res.status(500).json({
            error: `Échec du démarrage de l'audit rapide: ${error.message}`
        });
    }
});

/**
 * Endpoint pour vérifier le statut d'un audit
 * GET /api/audit/status/:workflowId
 */
auditRouter.get('/status/:workflowId', async (req, res) => {
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
                // Récupérer l'état actuel du workflow en utilisant la requête définie
                const status = await handle.query('getStatus');
                return res.status(200).json({
                    workflowId,
                    status: 'running',
                    details: status,
                    checkAgainIn: '30 seconds',
                });
            } catch (queryError) {
                // La requête n'est pas définie ou a échoué
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
                message: 'Audit terminé avec succès',
                result,
            });
        } catch (resultError) {
            return res.status(200).json({
                workflowId,
                status: 'failed',
                message: `L'audit a échoué: ${resultError.message}`,
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
 * Endpoint pour annuler un audit en cours
 * POST /api/audit/:workflowId/cancel
 */
auditRouter.post('/:workflowId/cancel', async (req, res) => {
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
 * Endpoint pour mettre en pause un audit en cours
 * POST /api/audit/:workflowId/pause
 */
auditRouter.post('/:workflowId/pause', async (req, res) => {
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
 * Endpoint pour reprendre un audit en pause
 * POST /api/audit/:workflowId/resume
 */
auditRouter.post('/:workflowId/resume', async (req, res) => {
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
 * Endpoint pour mettre à jour la configuration d'un audit en cours
 * PUT /api/audit/:workflowId/config
 */
auditRouter.put('/:workflowId/config', async (req, res) => {
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