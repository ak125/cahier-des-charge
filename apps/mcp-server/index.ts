// apps/mcp-server/index.ts

import fs from "fs";
import path from "path";
import chalk from "chalk";
import { processFilesInParallel, FileProcessingOptions } from "./utils/file-processor";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from '../../utils/supabaseClient';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
// Import du registre centralisé d'agents MCP
import { agentRegistry, executeAgent as runMcpAgent } from '@fafa/mcp-agents';

// Convertir exec en version Promise
const execAsync = promisify(exec);

// Charger les variables d'environnement
dotenv.config();

// Créer le serveur Express
const app = express();
const PORT = process.env.MCP_SERVER_PORT || 3500;

// Configuration du middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Vérifier que les variables d'environnement requises sont définies
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'N8N_WEBHOOK_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Erreur: La variable d'environnement ${envVar} n'est pas définie`);
    process.exit(1);
  }
}

// Route de vérification de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' });
});

// Route d'information sur le serveur MCP
app.get('/info', (req, res) => {
  res.status(200).json({
    name: 'MCP Server Supabase',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    apis: [
      { path: '/health', method: 'GET', description: 'Vérification de santé du serveur' },
      { path: '/info', method: 'GET', description: 'Informations sur le serveur MCP' },
      { path: '/agents', method: 'GET', description: 'Liste des agents disponibles' },
      { path: '/events', method: 'GET', description: 'Liste des événements récents' },
      { path: '/webhook/trigger', method: 'POST', description: 'Déclencher un agent via webhook' },
      { path: '/run/:agentName', method: 'POST', description: 'Exécuter un agent spécifique' }
    ]
  });
});

// Route pour lister les agents disponibles
app.get('/agents', async (req, res) => {
  try {
    // Récupérer les agents depuis le registre centralisé
    const agents = Object.keys(agentRegistry).map(agentName => ({
      name: agentName,
      category: agentRegistry[agentName].category || 'default',
      description: agentRegistry[agentName].description || 'Aucune description disponible'
    }));
    
    // Récupérer aussi les statistiques d'exécution depuis Supabase
    const { data: agentStats, error } = await supabase
      .from('agent_runs')
      .select('agent_name, count(*), max(created_at) as last_run')
      .group('agent_name');
    
    if (error) throw error;
    
    // Combiner les informations
    const result = agents.map(agent => {
      const stats = agentStats?.find(stat => stat.agent_name === agent.name) || null;
      return {
        ...agent,
        runs: stats ? parseInt(stats.count) : 0,
        lastRun: stats ? stats.last_run : null
      };
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des agents' });
  }
});

// Route pour récupérer les événements récents
app.get('/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mcp_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// Route pour déclencher un agent via webhook
app.post('/webhook/trigger', async (req, res) => {
  try {
    const { agent, params, source, priority } = req.body;
    
    if (!agent) {
      return res.status(400).json({ error: 'Le nom de l\'agent est requis' });
    }
    
    // Créer un événement dans la base de données
    const { data: event, error } = await supabase.from('mcp_events').insert({
      event_type: 'agent_trigger',
      payload: { agent, params, source },
      source: source || 'webhook',
      status: 'received',
      priority: priority || 3,
    }).select().single();
    
    if (error) throw error;
    
    // Répondre immédiatement pour ne pas bloquer le client
    res.status(202).json({ 
      message: 'Déclenchement de l\'agent en cours',
      eventId: event.id
    });
    
    // Déclencher l'agent de façon asynchrone
    executeAgent(agent, params, event.id).catch(err => {
      console.error(`Erreur lors de l'exécution de l'agent ${agent}:`, err);
      // Mettre à jour l'événement en cas d'erreur
      supabase.from('mcp_events').update({
        status: 'failed',
        error_message: err.message,
        processed_at: new Date().toISOString(),
      }).eq('id', event.id);
    });
  } catch (error) {
    console.error('Erreur lors du déclenchement de l\'agent:', error);
    res.status(500).json({ error: 'Erreur lors du déclenchement de l\'agent' });
  }
});

// Route pour exécuter un agent spécifique
app.post('/run/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const params = req.body;
    
    // Vérifier que l'agent existe dans le registre centralisé
    if (!agentRegistry[agentName]) {
      return res.status(404).json({ error: `Agent ${agentName} introuvable dans le registre MCP` });
    }
    
    // Créer un enregistrement d'exécution d'agent
    const { data: agentRun, error } = await supabase.from('agent_runs').insert({
      agent_name: agentName,
      status: 'started',
      input_params: params,
    }).select().single();
    
    if (error) throw error;
    
    // Répondre immédiatement
    res.status(202).json({ 
      message: `Exécution de l'agent ${agentName} en cours`,
      runId: agentRun.id
    });
    
    // Exécuter l'agent de façon asynchrone via le registre centralisé
    console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
    runMcpAgent(agentName, params)
      .then(async (result) => {
        // Mettre à jour l'enregistrement d'agent en cas de succès
        await supabase.from('agent_runs').update({
          status: 'completed',
          output_result: result,
        }).eq('id', agentRun.id);
        
        console.log(`Agent ${agentName} exécuté avec succès`);
      })
      .catch(async (err) => {
        console.error(`Erreur lors de l'exécution de l'agent ${agentName}:`, err);
        // Mettre à jour l'enregistrement d'agent en cas d'erreur
        await supabase.from('agent_runs').update({
          status: 'failed',
          error_message: err.message,
        }).eq('id', agentRun.id);
      });
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'agent:', error);
    res.status(500).json({ error: 'Erreur lors de l\'exécution de l\'agent' });
  }
});

// Route pour notifier n8n d'un événement
app.post('/notify/n8n', async (req, res) => {
  try {
    const { eventType, data } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ error: 'Le type d\'événement est requis' });
    }
    
    // Envoyer la notification à n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    const response = await axios.post(n8nUrl, {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      source: 'mcp-server'
    });
    
    res.status(200).json({ 
      message: 'Notification envoyée à n8n',
      n8nResponse: response.data
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification à n8n:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification à n8n' });
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
      await supabase.from('mcp_events').update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      }).eq('id', eventId);
    }
    
    // Mettre à jour l'enregistrement d'exécution d'agent si un ID a été fourni
    if (runId) {
      await supabase.from('agent_runs').update({
        status: 'completed',
        output_result: result,
      }).eq('id', runId);
    }
    
    console.log(`Agent ${agentName} exécuté avec succès`);
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de l'agent ${agentName}:`, error);
    
    // Mettre à jour l'événement en cas d'erreur
    if (eventId) {
      await supabase.from('mcp_events').update({
        status: 'failed',
        error_message: error.message,
        processed_at: new Date().toISOString(),
      }).eq('id', eventId);
    }
    
    // Mettre à jour l'enregistrement d'exécution d'agent en cas d'erreur
    if (runId) {
      await supabase.from('agent_runs').update({
        status: 'failed',
        error_message: error.message,
      }).eq('id', runId);
    }
    
    throw error;
  }
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur MCP Supabase démarré sur http://localhost:${PORT}`);
});

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
  const OUTPUT_DIR = path.resolve(__dirname, config.outputDir || "outputs");
  const EXTENSIONS = config.filters?.includeExtensions || [".php"];
  const MAX_WORKERS = config.performance?.maxWorkers || Math.max(1, require('os').cpus().length - 1);
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
    const phpFiles = allFiles.filter(file => 
      EXTENSIONS.some(ext => file.endsWith(ext))
    );
    
    if (phpFiles.length === 0) {
      console.info(chalk.yellow("⚠️  Aucun fichier correspondant trouvé."));
      process.exit(0);
    }
    
    console.log(chalk.green(`✅ ${phpFiles.length} fichier(s) à traiter avec ${MAX_WORKERS} workers.`));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la lecture du répertoire source : ${error.message}`));
    process.exit(1);
  }

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
        includeExtensions: EXTENSIONS
      };
      
      console.log(chalk.cyan(`🚀 Démarrage du traitement parallèle avec l'agent ${agentName}...`));
      const startTime = Date.now();
      
      // Utiliser l'agent via le registre centralisé
      console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
      const agentFunction = agentRegistry[agentName].run;
      
      // Traitement en parallèle des fichiers
      const results = await processFilesInParallel(SOURCE_DIR, agentFunction, options);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.green(`✅ Traitement terminé en ${duration}s avec ${results.length} résultats.`));
      
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
              
              fs.writeFileSync(outputPath, res.content, "utf-8");
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
          
          fs.writeFileSync(outputPath, result.content, "utf-8");
          filesWritten++;
        }
      }
      
      console.log(chalk.green(`💾 ${filesWritten} fichier(s) généré(s) dans ${OUTPUT_DIR}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du traitement avec l'agent ${agentName} : ${error.message}`));
      console.error(error.stack);
    }
  }

  console.log(chalk.green.bold(`✅ Traitement terminé ! Résultats disponibles dans ${OUTPUT_DIR}`));
}

// Exécution du programme principal
main().catch(error => {
  console.error(chalk.red(`❌ Erreur fatale : ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});