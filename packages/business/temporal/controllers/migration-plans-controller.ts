import express from 'express';
import { Connection, Client } from '@temporalio/client';
import { z } from 'zod';
import { MigrationPlanConfig } from '../workflows/migration-plans/generate-migration-plans.workflow';
import cron from 'node-cron';

export const migrationPlansRouter = express.Router();

// Schéma de validation pour le webhook
const WebhookSchema = z.object({
    phpDirectory: z.string().optional(),
    outputPath: z.string().optional(),
    notificationEmail: z.string().email().optional(),
    uploadToS3: z.boolean().optional(),
    storeInSupabase: z.boolean().optional(),
});

let scheduledTask: cron.ScheduledTask | null = null;
const temporalConfig = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
};

/**
 * Initialise le worker et les tâches planifiées pour les plans de migration
 */
export async function initMigrationPlansController() {
    console.log('[MigrationPlansController] Initialisation du contrôleur...');

    // Mettre en place le cron hebdomadaire (équivalent au "Schedule Trigger" de n8n)
    if (scheduledTask) {
        scheduledTask.stop();
    }

    scheduledTask = cron.schedule('0 0 * * 1', async () => { // Tous les lundis à minuit
        console.log('[MigrationPlansController] Exécution planifiée du workflow de génération des plans de migration');
        try {
            await executeWorkflow({
                phpDirectory: process.env.PHP_DIRECTORY || '/path/to/php/sources',
                outputPath: process.env.OUTPUT_PATH || 'migration-plans',
                notificationEmail: process.env.NOTIFICATION_EMAIL || 'team@fafa.com',
            });
        } catch (error) {
            console.error('[MigrationPlansController] Erreur lors de l\'exécution planifiée', error);
        }
    });

    console.log('[MigrationPlansController] Tâche planifiée créée avec succès');
}

/**
 * Exécute le workflow Temporal de génération des plans de migration
 */
async function executeWorkflow(config: Partial<MigrationPlanConfig>) {
    console.log('[MigrationPlansController] Démarrage du workflow avec la configuration', config);

    try {
        // Connexion au serveur Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Démarrer le workflow avec un ID unique
        const workflowId = `generate-migration-plans-${Date.now()}`;
        const handle = await client.workflow.start('generateMigrationPlans', {
            args: [config],
            taskQueue: 'migration-plans-queue',
            workflowId,
        });

        console.log(`[MigrationPlansController] Workflow démarré avec l'ID: ${workflowId}`);
        return { workflowId };
    } catch (error) {
        console.error('[MigrationPlansController] Erreur lors du démarrage du workflow', error);
        throw error;
    }
}

// Endpoint webhook pour déclencher la génération des plans de migration
migrationPlansRouter.post('/webhook', async (req, res) => {
    console.log('[MigrationPlansController] Requête webhook reçue', req.body);

    try {
        // Valider les données d'entrée
        const validatedData = WebhookSchema.parse(req.body);

        // Exécuter le workflow
        const result = await executeWorkflow(validatedData);

        res.status(202).json({
            message: 'Génération des plans de migration démarrée avec succès',
            workflowId: result.workflowId,
        });
    } catch (error) {
        console.error('[MigrationPlansController] Erreur dans le webhook', error);

        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: 'Données invalides',
                errors: error.errors,
            });
        } else {
            res.status(500).json({
                message: 'Erreur lors du démarrage de la génération des plans de migration',
                error: error.message,
            });
        }
    }
});

// Endpoint pour vérifier le statut d'un workflow de génération de plans de migration
migrationPlansRouter.get('/status/:workflowId', async (req, res) => {
    const { workflowId } = req.params;
    console.log(`[MigrationPlansController] Vérification du statut pour le workflow ${workflowId}`);

    try {
        // Connexion au serveur Temporal
        const connection = await Connection.connect(temporalConfig);
        const client = new Client({ connection });

        // Récupérer le handle du workflow
        const handle = client.workflow.getHandle(workflowId);

        // Vérifier si le workflow existe et son état
        const isRunning = await handle.isRunning();

        if (!isRunning) {
            try {
                // Si le workflow est terminé, récupérer le résultat
                const result = await handle.result();
                res.status(200).json({
                    status: 'completed',
                    result,
                });
            } catch (error) {
                res.status(200).json({
                    status: 'failed',
                    error: error.message,
                });
            }
        } else {
            res.status(200).json({
                status: 'running',
            });
        }
    } catch (error) {
        console.error(`[MigrationPlansController] Erreur lors de la vérification du statut pour ${workflowId}`, error);
        res.status(500).json({
            message: 'Erreur lors de la vérification du statut du workflow',
            error: error.message,
        });
    }
});

// Endpoint pour démarrer manuellement la génération des plans de migration
migrationPlansRouter.post('/start', async (req, res) => {
    console.log('[MigrationPlansController] Démarrage manuel demandé', req.body);

    try {
        // Valider les données d'entrée
        const validatedData = WebhookSchema.parse(req.body);

        // Exécuter le workflow
        const result = await executeWorkflow(validatedData);

        res.status(202).json({
            message: 'Génération des plans de migration démarrée avec succès',
            workflowId: result.workflowId,
        });
    } catch (error) {
        console.error('[MigrationPlansController] Erreur lors du démarrage manuel', error);

        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: 'Données invalides',
                errors: error.errors,
            });
        } else {
            res.status(500).json({
                message: 'Erreur lors du démarrage de la génération des plans de migration',
                error: error.message,
            });
        }
    }
});