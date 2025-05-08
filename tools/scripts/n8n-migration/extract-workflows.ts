/**
 * Script d'extraction des workflows n8n
 * 
 * Ce script se connecte à l'instance n8n via l'API et extrait tous les workflows
 * actifs pour les sauvegarder localement pour analyse.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { program } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

// Configurer les arguments de ligne de commande
program
    .option('-o, --output <path>', 'Chemin de sortie pour les workflows extraits', './migrations/n8n-inventory')
    .option('-u, --url <url>', 'URL de l\'API n8n', process.env.N8N_API_URL || 'http://localhost:5678/api/v1')
    .option('-t, --token <token>', 'Token d\'API n8n', process.env.N8N_API_TOKEN)
    .option('-a, --active-only', 'Extraire uniquement les workflows actifs', false)
    .parse(process.argv);

const options = program.opts();

// Vérifier les options obligatoires
if (!options.token) {
    console.error(chalk.red('Erreur : Le token API n8n est requis. Utilisez --token ou définissez N8N_API_TOKEN.'));
    process.exit(1);
}

const outputPath = path.resolve(process.cwd(), options.output);
const n8nApiUrl = options.url;
const n8nApiToken = options.token;
const activeOnly = options.activeOnly;

// Configuration Axios pour n8n API
const apiClient = axios.create({
    baseURL: n8nApiUrl,
    headers: {
        'X-N8N-API-KEY': n8nApiToken,
        'Content-Type': 'application/json',
    },
});

/**
 * Extrait tous les workflows de n8n
 */
async function extractWorkflows(): Promise<void> {
    try {
        console.log(chalk.blue('🔍 Extraction des workflows n8n...'));

        // Créer le répertoire de sortie s'il n'existe pas
        await fs.ensureDir(outputPath);

        // Récupérer tous les workflows
        const response = await apiClient.get('/workflows');
        const workflows = response.data.data;

        console.log(chalk.green(`✅ ${workflows.length} workflows trouvés.`));

        // Filtrer les workflows actifs si demandé
        const filteredWorkflows = activeOnly
            ? workflows.filter((workflow: any) => workflow.active)
            : workflows;

        if (activeOnly) {
            console.log(chalk.yellow(`ℹ️ ${filteredWorkflows.length}/${workflows.length} workflows actifs seront extraits.`));
        }

        // Récupérer les détails de chaque workflow et les sauvegarder
        let savedCount = 0;
        for (const workflow of filteredWorkflows) {
            try {
                // Récupérer les détails complets du workflow
                const detailResponse = await apiClient.get(`/workflows/${workflow.id}`);
                const workflowDetail = detailResponse.data;

                // Récupérer les exécutions récentes pour des statistiques
                const executionsResponse = await apiClient.get(`/workflows/${workflow.id}/executions`, {
                    params: { limit: 100 }
                });
                const executions = executionsResponse.data.results || [];

                // Ajouter des métadonnées utiles pour l'analyse
                const enrichedWorkflow = {
                    ...workflowDetail,
                    metadata: {
                        extractedAt: new Date().toISOString(),
                        executionStats: {
                            totalExecutions: executions.length,
                            successCount: executions.filter((e: any) => e.status === 'success').length,
                            errorCount: executions.filter((e: any) => e.status === 'error').length,
                            lastExecution: executions[0] ? executions[0].startedAt : null,
                            averageDuration: executions.length > 0
                                ? executions.reduce((sum: number, e: any) => sum + (e.stoppedAt - e.startedAt), 0) / executions.length
                                : 0,
                        }
                    }
                };

                // Sauvegarder le workflow dans un fichier JSON
                const filename = `${workflow.id}-${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                const filePath = path.join(outputPath, filename);
                await fs.writeJSON(filePath, enrichedWorkflow, { spaces: 2 });
                savedCount++;

                process.stdout.write(`${chalk.green('.')} `);
                if (savedCount % 10 === 0) process.stdout.write('\n');
            } catch (error) {
                console.error(chalk.red(`Erreur lors de l'extraction du workflow ${workflow.id} (${workflow.name})`), error.message);
            }
        }

        console.log(`\n${chalk.green(`✅ ${savedCount} workflows extraits et sauvegardés dans ${outputPath}`)}`);

        // Créer un fichier d'index pour faciliter l'analyse
        const workflowIndex = filteredWorkflows.map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
            tags: workflow.tags || []
        }));

        await fs.writeJSON(path.join(outputPath, '_index.json'), workflowIndex, { spaces: 2 });
        console.log(chalk.blue(`📋 Index des workflows créé : ${path.join(outputPath, '_index.json')}`));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors de l\'extraction des workflows :'), error.message);
        if (error.response) {
            console.error(chalk.red('Détails de l\'erreur :'), error.response.data);
        }
        process.exit(1);
    }
}

// Exécuter le script
extractWorkflows()
    .then(() => {
        console.log(chalk.green('✅ Extraction des workflows terminée avec succès.'));
    })
    .catch((error) => {
        console.error(chalk.red('❌ Erreur lors de l\'exécution du script :'), error);
        process.exit(1);
    });