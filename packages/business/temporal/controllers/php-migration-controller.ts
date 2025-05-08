import { FastifyInstance } from 'fastify';
import { Connection, Client } from '@temporalio/client';
import { MigrationConfig, MigrationConfigSchema } from '../workflows/php-migration-pipeline/migration-pipeline.workflow';
import fs from 'fs/promises';
import path from 'path';

// Définition des interfaces pour le typage des requêtes
interface TriggerMigrationRequest {
  Body: {
    config?: Partial<MigrationConfig>;
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

// Configuration Temporal
const temporalConfig = {
  address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
};

// Création du plugin Fastify au lieu du routeur Express
export const phpMigrationRouter = (fastify: FastifyInstance, opts: any, done: () => void) => {
  /**
   * Endpoint pour déclencher le pipeline de migration PHP → NestJS/Remix
   * Remplace le webhook trigger du workflow n8n original
   */
  fastify.post<TriggerMigrationRequest>('/migration/trigger', async (request, reply) => {
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
      let config: Partial<MigrationConfig> = {};
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
        MigrationConfigSchema.parse(config);
      } catch (error) {
        return reply.code(400).send({
          error: `Configuration invalide: ${error.message}`
        });
      }

      // Déclencher le workflow Temporal
      const connection = await Connection.connect(temporalConfig);
      const client = new Client({ connection });

      // Générer un ID unique pour le workflow
      const workflowId = `php-migration-${Date.now()}`;

      // Démarrer le workflow
      const handle = await client.workflow.start('phpToNestjsRemixMigrationWorkflow', {
        taskQueue: 'php-migration-queue',
        workflowId,
        args: [config],
      });

      // Retourner la réponse immédiatement (mode asynchrone)
      return reply.code(202).send({
        message: 'Pipeline de migration démarré avec succès',
        executionId: workflowId,
        status: 'initialized',
        startTime: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Erreur lors du démarrage du pipeline de migration:', error);
      return reply.code(500).send({
        error: `Erreur lors du démarrage du pipeline de migration: ${error.message}`
      });
    }
  });

  /**
   * Endpoint pour vérifier le statut d'une exécution de migration
   */
  fastify.get<StatusRequest>('/migration/status/:executionId', async (request, reply) => {
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
          // Si le workflow est en cours d'exécution, renvoyer le statut "running"
          return reply.code(200).send({
            executionId,
            status: 'running',
          });
        } else {
          // Si le workflow est terminé, récupérer le résultat
          try {
            const result = await handle.result();
            return reply.code(200).send({
              executionId,
              status: 'completed',
              result,
            });
          } catch (error) {
            // Si le workflow a échoué, renvoyer l'erreur
            return reply.code(200).send({
              executionId,
              status: 'failed',
              error: error.message,
            });
          }
        }
      } catch (error) {
        // Si le workflow n'existe pas
        return reply.code(404).send({
          error: `Exécution de migration non trouvée: ${executionId}`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de la migration:', error);
      return reply.code(500).send({
        error: `Erreur lors de la vérification du statut de la migration: ${error.message}`
      });
    }
  });

  /**
   * Endpoint pour récupérer le rapport de migration
   */
  fastify.get<ReportRequest>('/migration/report/:executionId', async (request, reply) => {
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
            error: 'La migration est toujours en cours d\'exécution'
          });
        }

        // Récupérer le résultat
        const result = await handle.result();

        // Renvoyer le rapport selon le format demandé
        if (format === 'markdown') {
          reply.header('Content-Type', 'text/markdown');
          return reply.code(200).send(result.markdownReport);
        } else {
          // Format JSON par défaut
          return reply.code(200).send(result.jsonSummary || result);
        }
      } catch (error) {
        // Si le workflow n'existe pas ou a échoué
        return reply.code(404).send({
          error: `Rapport de migration non disponible: ${error.message}`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport de migration:', error);
      return reply.code(500).send({
        error: `Erreur lors de la récupération du rapport de migration: ${error.message}`
      });
    }
  });

  // Terminer l'enregistrement du plugin Fastify
  done();
};