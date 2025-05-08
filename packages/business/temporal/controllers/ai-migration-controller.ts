import { FastifyInstance } from 'fastify';
import { Connection, Client } from '@temporalio/client';
import { AiMigrationConfig, AiMigrationConfigSchema } from '../workflows/ai-migration-standard.workflow';
import fs from 'fs/promises';
import path from 'path';

// Définition des interfaces pour le typage des requêtes
interface TriggerMigrationRequest {
    Body: {
        config?: Partial<AiMigrationConfig>;
        configPath?: string;
    }
}

interface StatusRequest {
    Params: {
        executionId: string;
    }
}

interface ReportRequest {
    Params: {
        executionId: string;
    },
    Querystring: {
        format?: string;
    }
}

interface ControlRequest {
    Params: {
        executionId: string;
        action: string;
    },
    Body?: {
        config?: any;
    }
}

interface PhpAnalyzerRequest {
    Body: {
        sourcePath: string;
        fileExtensions?: string[];
        recursive?: boolean;
        exclude?: string[];
        limit?: number;
        analyzerEndpoint?: string;
        outputDir?: string;
        concurrency?: number;
        generateSummary?: boolean;
    }
}

interface CodeGeneratorRequest {
    Body: {
        phpSourcePath: string;
        outputDir?: string;
        framework?: string;
        includeTests?: boolean;
        templateDir?: string;
    }
}

interface DocsGeneratorRequest {
    Body: {
        phpSourcePath: string;
        includeGeneratedCode?: boolean;
        codeOutputDir?: string;
        framework?: string;
        docsOutputDir?: string;
        format?: string;
        projectName?: string;
        version?: string;
    }
}

// Configuration Temporal
const temporalConfig = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
};

// Créer le plugin Fastify au lieu du routeur Express
export const aiMigrationRouter = (fastify: FastifyInstance, opts: any, done: () => void) => {
    /**
     * Endpoint pour déclencher le pipeline de migration IA
     * Remplace le webhook trigger du workflow n8n original "Pipeline de Migration IA"
     */
    fastify.post<TriggerMigrationRequest>('/ai-migration/trigger', async (request, reply) => {
        try {
            // Extraire et valider la configuration
            const reqBody = request.body;

            // Validation de base
            if (!reqBody.config && !reqBody.configPath) {
                return reply.code(400).send({
                    error: 'Vous devez spécifier soit "config" soit "configPath"'
                });
            }

            // Si un chemin de configuration est fourni, charger la configuration
            let config: Partial<AiMigrationConfig> = {};
            if (reqBody.configPath) {
                try {
                    const configContent = await fs.readFile(reqBody.configPath, 'utf-8');
                    config = JSON.parse(configContent);
                } catch (error) {
                    return reply.code(400).send({
                        error: `Impossible de lire le fichier de configuration: ${error.message}`
                    });
                }
            } else if (reqBody.config) {
                config = reqBody.config;
            }

            // Valider la configuration avec Zod
            try {
                AiMigrationConfigSchema.parse(config);
            } catch (error) {
                return reply.code(400).send({
                    error: `Configuration invalide: ${error.message}`
                });
            }

            // Déclencher le workflow Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Générer un ID unique pour le workflow
            const workflowId = `ai-migration-${Date.now()}`;

            // Démarrer le workflow avec le nom standard
            const handle = await client.workflow.start('aiMigrationStandardWorkflow', {
                taskQueue: 'ai-pipeline-queue',
                workflowId,
                args: [config],
            });

            // Retourner la réponse immédiatement (mode asynchrone)
            return reply.code(202).send({
                message: 'Pipeline de migration IA démarré avec succès',
                executionId: workflowId,
                status: 'initialized',
                startTime: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erreur lors du démarrage du pipeline de migration IA:', error);
            return reply.code(500).send({
                error: `Erreur lors du démarrage du pipeline de migration IA: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour vérifier le statut d'une exécution de migration IA
     */
    fastify.get<StatusRequest>('/ai-migration/status/:executionId', async (request, reply) => {
        try {
            const { executionId } = request.params;

            // Se connecter à Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Récupérer le handle du workflow
            const handle = client.workflow.getHandle(executionId);

            try {
                // Vérifier si le workflow est toujours en cours d'exécution
                const isRunning = await handle.isRunning();

                if (isRunning) {
                    // Si le workflow est en cours d'exécution, interroger l'état actuel
                    const status = await handle.query('getStatus');
                    const progress = await handle.query('getProgress');

                    return reply.code(200).send({
                        executionId,
                        status,
                        progress,
                        isRunning: true
                    });
                } else {
                    // Si le workflow est terminé, récupérer le résultat
                    try {
                        const result = await handle.result();
                        return reply.code(200).send({
                            executionId,
                            status: result.status,
                            progress: result.progress,
                            isRunning: false,
                            results: result.results
                        });
                    } catch (error) {
                        // Si le workflow a échoué, renvoyer l'erreur
                        return reply.code(200).send({
                            executionId,
                            status: 'failed',
                            error: error instanceof Error ? error.message : String(error),
                            isRunning: false
                        });
                    }
                }
            } catch (error) {
                // Si le workflow n'existe pas
                return reply.code(404).send({
                    error: `Exécution de migration IA non trouvée: ${executionId}`
                });
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut de la migration IA:', error);
            return reply.code(500).send({
                error: `Erreur lors de la vérification du statut de la migration IA: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour récupérer le rapport de migration IA
     */
    fastify.get<ReportRequest>('/ai-migration/report/:executionId', async (request, reply) => {
        try {
            const { executionId } = request.params;
            const format = request.query.format || 'json';

            // Se connecter à Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Récupérer le handle du workflow
            const handle = client.workflow.getHandle(executionId);

            try {
                // Vérifier si le workflow est terminé
                const isRunning = await handle.isRunning();

                if (isRunning) {
                    return reply.code(400).send({
                        error: 'La migration IA est toujours en cours d\'exécution'
                    });
                }

                // Récupérer le résultat
                const result = await handle.result();

                // Renvoyer le rapport selon le format demandé
                if (format === 'markdown') {
                    reply.header('Content-Type', 'text/markdown');
                    return reply.code(200).send(result.results.markdownReport || 'Aucun rapport disponible');
                } else {
                    // Format JSON par défaut
                    return reply.code(200).send(result.results.jsonSummary || result.results);
                }
            } catch (error) {
                // Si le workflow n'existe pas ou a échoué
                return reply.code(404).send({
                    error: `Rapport de migration IA non disponible: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du rapport de migration IA:', error);
            return reply.code(500).send({
                error: `Erreur lors de la récupération du rapport de migration IA: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour contrôler l'exécution d'un workflow en cours
     */
    fastify.post<ControlRequest>('/ai-migration/control/:executionId/:action', async (request, reply) => {
        try {
            const { executionId, action } = request.params;

            // Se connecter à Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Récupérer le handle du workflow
            const handle = client.workflow.getHandle(executionId);

            // Vérifier si le workflow existe et est en cours d'exécution
            try {
                const isRunning = await handle.isRunning();

                if (!isRunning) {
                    return reply.code(400).send({
                        error: 'Le workflow n\'est plus en cours d\'exécution'
                    });
                }

                // Exécuter l'action demandée
                switch (action) {
                    case 'pause':
                        await handle.signal('pauseWorkflow');
                        return reply.code(200).send({
                            message: 'Workflow mis en pause'
                        });
                    case 'resume':
                        await handle.signal('resumeWorkflow');
                        return reply.code(200).send({
                            message: 'Workflow repris'
                        });
                    case 'cancel':
                        await handle.signal('cancelWorkflow');
                        return reply.code(200).send({
                            message: 'Workflow annulé'
                        });
                    case 'update-config':
                        // Vérifier que la nouvelle configuration est fournie
                        if (!request.body || !request.body.config) {
                            return reply.code(400).send({
                                error: 'Vous devez fournir une nouvelle configuration'
                            });
                        }

                        await handle.signal('updateConfig', request.body.config);
                        return reply.code(200).send({
                            message: 'Configuration du workflow mise à jour'
                        });
                    default:
                        return reply.code(400).send({
                            error: `Action inconnue: ${action}. Actions supportées: pause, resume, cancel, update-config`
                        });
                }
            } catch (error) {
                // Si le workflow n'existe pas
                return reply.code(404).send({
                    error: `Exécution de migration IA non trouvée ou erreur: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        } catch (error) {
            console.error('Erreur lors du contrôle du workflow de migration IA:', error);
            return reply.code(500).send({
                error: `Erreur lors du contrôle du workflow de migration IA: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour lancer un workflow d'analyse PHP simplifié
     */
    fastify.post<PhpAnalyzerRequest>('/ai-migration/analyze-php', async (request, reply) => {
        try {
            const { sourcePath, fileExtensions, recursive, exclude, limit, analyzerEndpoint, outputDir, concurrency, generateSummary } = request.body;

            if (!sourcePath) {
                return reply.code(400).send({
                    error: 'Vous devez spécifier un chemin source (sourcePath)'
                });
            }

            // Déclencher le workflow Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Générer un ID unique pour le workflow
            const workflowId = `php-analyzer-${Date.now()}`;

            // Démarrer le workflow
            const handle = await client.workflow.start('phpAnalyzerWorkflow', {
                taskQueue: 'ai-pipeline-queue',
                workflowId,
                args: [{
                    sourcePath,
                    fileExtensions,
                    recursive,
                    exclude,
                    limit,
                    analyzerEndpoint,
                    outputDir,
                    concurrency,
                    generateSummary
                }],
            });

            // Retourner la réponse immédiatement (mode asynchrone)
            return reply.code(202).send({
                message: 'Workflow d\'analyse PHP démarré avec succès',
                executionId: workflowId,
                status: 'initialized',
                startTime: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erreur lors du démarrage du workflow d\'analyse PHP:', error);
            return reply.code(500).send({
                error: `Erreur lors du démarrage du workflow d\'analyse PHP: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour lancer un workflow de génération de code simplifié
     */
    fastify.post<CodeGeneratorRequest>('/ai-migration/generate-code', async (request, reply) => {
        try {
            const { phpSourcePath, outputDir, framework, includeTests, templateDir } = request.body;

            if (!phpSourcePath) {
                return reply.code(400).send({
                    error: 'Vous devez spécifier un chemin source PHP (phpSourcePath)'
                });
            }

            // Déclencher le workflow Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Générer un ID unique pour le workflow
            const workflowId = `code-generator-${Date.now()}`;

            // Démarrer le workflow
            const handle = await client.workflow.start('codeGeneratorWorkflow', {
                taskQueue: 'ai-pipeline-queue',
                workflowId,
                args: [{
                    phpSourcePath,
                    outputDir,
                    framework,
                    includeTests,
                    templateDir
                }],
            });

            // Retourner la réponse immédiatement (mode asynchrone)
            return reply.code(202).send({
                message: 'Workflow de génération de code démarré avec succès',
                executionId: workflowId,
                status: 'initialized',
                startTime: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erreur lors du démarrage du workflow de génération de code:', error);
            return reply.code(500).send({
                error: `Erreur lors du démarrage du workflow de génération de code: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    /**
     * Endpoint pour lancer un workflow de génération de documentation simplifié
     */
    fastify.post<DocsGeneratorRequest>('/ai-migration/generate-docs', async (request, reply) => {
        try {
            const {
                phpSourcePath,
                includeGeneratedCode,
                codeOutputDir,
                framework,
                docsOutputDir,
                format,
                projectName,
                version
            } = request.body;

            if (!phpSourcePath) {
                return reply.code(400).send({
                    error: 'Vous devez spécifier un chemin source PHP (phpSourcePath)'
                });
            }

            // Déclencher le workflow Temporal
            const connection = await Connection.connect(temporalConfig);
            const client = new Client({ connection });

            // Générer un ID unique pour le workflow
            const workflowId = `docs-generator-${Date.now()}`;

            // Démarrer le workflow
            const handle = await client.workflow.start('docsGeneratorWorkflow', {
                taskQueue: 'ai-pipeline-queue',
                workflowId,
                args: [{
                    phpSourcePath,
                    includeGeneratedCode,
                    codeOutputDir,
                    framework,
                    docsOutputDir,
                    format,
                    projectName,
                    version
                }],
            });

            // Retourner la réponse immédiatement (mode asynchrone)
            return reply.code(202).send({
                message: 'Workflow de génération de documentation démarré avec succès',
                executionId: workflowId,
                status: 'initialized',
                startTime: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Erreur lors du démarrage du workflow de génération de documentation:', error);
            return reply.code(500).send({
                error: `Erreur lors du démarrage du workflow de génération de documentation: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });

    // Terminer l'enregistrement du plugin Fastify
    done();
};