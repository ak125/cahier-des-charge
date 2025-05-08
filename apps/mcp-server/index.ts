import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
// Import du registre centralisé d'agents MCP
import { agentRegistry, executeAgent as runMcpAgent } from '@fafa/mcp-agents';
import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import { supabase } from '../../utils/supabase-client';
import { FileProcessingOptions, processFilesInParallel } from './utils/file-processor';

// Convertir exec en version Promise
const _execAsync = promisify(exec);

// Charger les variables d'environnement
dotenv.config();

// Créer le serveur Fastify
const app: FastifyInstance = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  }
});
const PORT = Number(process.env.MCP_SERVER_PORT) || 3500;

// Configuration du middleware
app.register(fastifyCors);

// Configuration des parsers de corps de requête
app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body as string);
    done(null, json);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Vérifier que les variables d'environnement requises sont définies
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'N8N_WEBHOOK_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Erreur: La variable d'environnement ${envVar} n'est pas définie`);
    process.exit(1);
  }
}

// Route de vérification de santé
app.get('/health', async (_req, reply) => {
  reply.code(200).send({ status: 'ok', version: '1.0.0' });
});

// Route d'information sur le serveur MCP
app.get('/info', async (_req, reply) => {
  reply.code(200).send({
    name: 'MCP Server Supabase',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    apis: [
      { path: '/health', method: 'GET', description: 'Vérification de santé du serveur' },
      { path: '/info', method: 'GET', description: 'Informations sur le serveur MCP' },
      { path: '/agents', method: 'GET', description: 'Liste des agents disponibles' },
      { path: '/events', method: 'GET', description: 'Liste des événements récents' },
      { path: '/webhook/trigger', method: 'POST', description: 'Déclencher un agent via webhook' },
      { path: '/run/:agentName', method: 'POST', description: 'Exécuter un agent spécifique' },
    ],
  });
});

// Route pour lister les agents disponibles
app.get('/agents', async (_req, reply) => {
  try {
    // Récupérer les agents depuis le registre centralisé
    const agents = Object.keys(agentRegistry).map((agentName) => ({
      name: agentName,
      category: agentRegistry[agentName].category || 'default',
      description: agentRegistry[agentName].description || 'Aucune description disponible',
    }));

    // Récupérer aussi les statistiques d'exécution depuis Supabase
    const { data: agentStats, error } = await supabase
      .from('agent_runs')
      .select('agent_name, count(*), max(created_at) as last_run')
      .group('agent_name');

    if (error) throw error;

    // Combiner les informations
    const result = agents.map((agent) => {
      const stats = agentStats?.find((stat) => stat.agent_name === agent.name) || null;
      return {
        ...agent,
        runs: stats ? parseInt(stats.count) : 0,
        lastRun: stats ? stats.last_run : null,
      };
    });

    reply.code(200).send(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error);
    reply.code(500).send({ error: 'Erreur lors de la récupération des agents' });
  }
});

// Route pour récupérer les événements récents
app.get('/events', async (_req, reply) => {
  try {
    const { data, error } = await supabase
      .from('mcp_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    reply.code(200).send(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    reply.code(500).send({ error: 'Erreur lors de la récupération des événements' });
  }
});

// Type pour le corps de la requête
interface WebhookTriggerBody {
  agent: string;
  params: any;
  source?: string;
  priority?: number;
}

// Route pour déclencher un agent via webhook
app.post<{
  Body: WebhookTriggerBody;
}>('/webhook/trigger', async (req, reply) => {
  try {
    const { agent, params, source, priority } = req.body;

    if (!agent) {
      return reply.code(400).send({ error: "Le nom de l'agent est requis" });
    }

    // Créer un événement dans la base de données
    const { data: event, error } = await supabase
      .from('mcp_events')
      .insert({
        event_type: 'agent_trigger',
        payload: { agent, params, source },
        source: source || 'webhook',
        status: 'received',
        priority: priority || 3,
      })
      .select()
      .single();

    if (error) throw error;

    // Répondre immédiatement pour ne pas bloquer le client
    reply.code(202).send({
      message: "Déclenchement de l'agent en cours",
      eventId: event.id,
    });

    // Déclencher l'agent de façon asynchrone
    executeAgent(agent, params, event.id).catch((err) => {
      console.error(`Erreur lors de l'exécution de l'agent ${agent}:`, err);
      // Mettre à jour l'événement en cas d'erreur
      supabase
        .from('mcp_events')
        .update({
          status: 'failed',
          error_message: err.message,
          processed_at: new Date().toISOString(),
        })
        .eq('id', event.id);
    });
  } catch (error) {
    console.error("Erreur lors du déclenchement de l'agent:", error);
    reply.code(500).send({ error: "Erreur lors du déclenchement de l'agent" });
  }
});

// Route pour exécuter un agent spécifique
interface RunAgentParams {
  agentName: string;
}

app.post<{
  Params: RunAgentParams;
  Body: any;
}>('/run/:agentName', async (req, reply) => {
  try {
    const { agentName } = req.params;
    const params = req.body;

    // Vérifier que l'agent existe dans le registre centralisé
    if (!agentRegistry[agentName]) {
      return reply.code(404).send({ error: `Agent ${agentName} introuvable dans le registre MCP` });
    }

    // Créer un enregistrement d'exécution d'agent
    const { data: agentRun, error } = await supabase
      .from('agent_runs')
      .insert({
        agent_name: agentName,
        status: 'started',
        input_params: params,
      })
      .select()
      .single();

    if (error) throw error;

    // Répondre immédiatement
    reply.code(202).send({
      message: `Exécution de l'agent ${agentName} en cours`,
      runId: agentRun.id,
    });

    // Exécuter l'agent de façon asynchrone via le registre centralisé
    console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
    runMcpAgent(agentName, params)
      .then(async (result) => {
        // Mettre à jour l'enregistrement d'agent en cas de succès
        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            output_result: result,
          })
          .eq('id', agentRun.id);

        console.log(`Agent ${agentName} exécuté avec succès`);
      })
      .catch(async (err) => {
        console.error(`Erreur lors de l'exécution de l'agent ${agentName}:`, err);
        // Mettre à jour l'enregistrement d'agent en cas d'erreur
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            error_message: err.message,
          })
          .eq('id', agentRun.id);
      });
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'agent:", error);
    reply.code(500).send({ error: "Erreur lors de l'exécution de l'agent" });
  }
});

// Route pour notifier n8n d'un événement
interface N8nNotifyBody {
  eventType: string;
  data: any;
}

app.post<{
  Body: N8nNotifyBody;
}>('/notify/n8n', async (req, reply) => {
  try {
    const { eventType, data } = req.body;

    if (!eventType) {
      return reply.code(400).send({ error: "Le type d'événement est requis" });
    }

    // Envoyer la notification à n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    const response = await axios.post(n8nUrl, {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      source: 'mcp-server',
    });

    reply.code(200).send({
      message: 'Notification envoyée à n8n',
      n8nResponse: response.data,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification à n8n:", error);
    reply.code(500).send({ error: "Erreur lors de l'envoi de la notification à n8n" });
  }
});

// Fonction pour exécuter un agent
async function executeAgent(agentName: string, params: any, eventId?: number, runId?: number) {
  try {
    console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);

    // Vérifier que l'agent existe dans le registre centralisé
    if (!agentRegistry[agentName]) {
      throw new Error(`Agent ${agentName} introuvable dans le registre MCP`);
    }

    // Exécuter l'agent via le registre centralisé
    const result = await runMcpAgent(agentName, params);

    // Mettre à jour l'événement si un ID a été fourni
    if (eventId) {
      await supabase
        .from('mcp_events')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    }

    // Mettre à jour l'enregistrement d'exécution d'agent si un ID a été fourni
    if (runId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          output_result: result,
        })
        .eq('id', runId);
    }

    console.log(`Agent ${agentName} exécuté avec succès`);
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de l'agent ${agentName}:`, error);

    // Mettre à jour l'événement en cas d'erreur
    if (eventId) {
      await supabase
        .from('mcp_events')
        .update({
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    }

    // Mettre à jour l'enregistrement d'exécution d'agent en cas d'erreur
    if (runId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', runId);
    }

    throw error;
  }
}

// Démarrer le serveur
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Serveur MCP Supabase démarré sur http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Type pour la configuration MCP
interface MCPConfig {
  agents: string[];
  sourceDir: string;
  outputDir: string;
  filters?: {
    includeExtensions?: string[];
  };
  performance?: {
    maxWorkers?: number;
    chunkSize?: number;
  };
}

// Chargement de la configuration
const configPath = path.resolve(__dirname, 'mcp.config.json');
const config: MCPConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function main() {
  const AGENTS = config.agents;
  const SOURCE_DIR = path.resolve(__dirname, config.sourceDir);
  const OUTPUT_DIR = path.resolve(__dirname, config.outputDir || 'outputs');
  const EXTENSIONS = config.filters?.includeExtensions || ['.php'];
  const MAX_WORKERS =
    config.performance?.maxWorkers || Math.max(1, require('os').cpus().length - 1);
  const CHUNK_SIZE = config.performance?.chunkSize || 1024 * 1024; // 1MB par défaut

  console.log(chalk.blue(`📂 Dossier analysé : ${SOURCE_DIR}`));
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(chalk.red(`❌ Dossier source introuvable : ${SOURCE_DIR}`));
    process.exit(1);
  }

  // Création du répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(chalk.green(`✅ Répertoire de sortie créé : ${OUTPUT_DIR}`));
  }

  // Vérification que des fichiers existent dans le répertoire source
  try {
    const allFiles = fs.readdirSync(SOURCE_DIR);
    const phpFiles = allFiles.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext)));

    if (phpFiles.length === 0) {
      console.info(chalk.yellow('⚠️  Aucun fichier correspondant trouvé.'));
      process.exit(0);
    }

    console.log(
      chalk.green(`✅ ${phpFiles.length} fichier(s) à traiter avec ${MAX_WORKERS} workers.`)
    );
  } catch (error) {
    console.error(
      chalk.red(`❌ Erreur lors de la lecture du répertoire source : ${error.message}`)
    );
    process.exit(1);
  }

  // Démarrer le serveur
  await start();

  // Traitement des fichiers par chaque agent, en parallèle
  for (const agentName of AGENTS) {
    console.log(chalk.cyan(`🔄 Chargement de l'agent ${agentName}...`));

    try {
      // Vérifier que l'agent existe dans le registre centralisé
      if (!agentRegistry[agentName]) {
        console.error(chalk.red(`❌ Agent ${agentName} introuvable dans le registre MCP`));
        continue;
      }

      // Options de traitement
      const options: FileProcessingOptions = {
        maxWorkers: MAX_WORKERS,
        chunkSize: CHUNK_SIZE,
        includeExtensions: EXTENSIONS,
      };

      console.log(chalk.cyan(`🚀 Démarrage du traitement parallèle avec l'agent ${agentName}...`));
      const startTime = Date.now();

      // Utiliser l'agent via le registre centralisé
      console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
      const agentFunction = agentRegistry[agentName].run;

      // Traitement en parallèle des fichiers
      const results = await processFilesInParallel(SOURCE_DIR, agentFunction, options);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        chalk.green(`✅ Traitement terminé en ${duration}s avec ${results.length} résultats.`)
      );

      // Écriture des résultats
      let filesWritten = 0;

      for (const result of results) {
        if (Array.isArray(result)) {
          for (const res of result) {
            if (res?.path && res?.content) {
              const outputPath = path.join(OUTPUT_DIR, path.basename(res.path));
              const outputDir = path.dirname(outputPath);

              // S'assurer que le répertoire de sortie existe
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }

              fs.writeFileSync(outputPath, res.content, 'utf-8');
              filesWritten++;
            }
          }
        } else if (result?.path && result?.content) {
          const outputPath = path.join(OUTPUT_DIR, path.basename(result.path));
          const outputDir = path.dirname(outputPath);

          // S'assurer que le répertoire de sortie existe
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          fs.writeFileSync(outputPath, result.content, 'utf-8');
          filesWritten++;
        }
      }

      console.log(chalk.green(`💾 ${filesWritten} fichier(s) généré(s) dans ${OUTPUT_DIR}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Erreur lors du traitement avec l'agent ${agentName} : ${error.message}`)
      );
      console.error(error.stack);
    }
  }

  console.log(chalk.green.bold(`✅ Traitement terminé ! Résultats disponibles dans ${OUTPUT_DIR}`));
}

// Exécution du programme principal
main().catch((error) => {
  console.error(chalk.red(`❌ Erreur fatale : ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});
