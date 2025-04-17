/**
 * pipeline-activity-tracker.ts
 * 
 * Script pour suivre l'activité des pipelines dans MCP OS
 * 
 * Ce script analyse les logs et les fichiers de configuration pour:
 * 1. Mettre à jour status.json avec les dernières exécutions
 * 2. Enregistrer les erreurs et les succès
 * 3. Identifier les dépendances entre pipelines
 * 4. Calculer les métriques d'utilisation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// Types pour le suivi des pipelines
interface PipelineStatus {
  id: string;
  name: string;
  type: 'n8n' | 'bullmq' | 'temporal' | 'script' | 'unknown';
  lastRun: string | null;
  lastSuccess: string | null;
  lastError: string | null;
  runCount: number;
  successCount: number;
  errorCount: number;
  errorRate: number;
  avgDuration: number; // en millisecondes
  usedBy: string[]; // IDs d'autres pipelines ou agents qui utilisent ce pipeline
  dependsOn: string[]; // IDs d'autres pipelines dont ce pipeline dépend
  configuration: string; // Chemin vers le fichier de configuration
  status: 'active' | 'inactive' | 'error' | 'deprecated';
  tags: string[];
}

interface AgentActivity {
  id: string;
  name: string;
  type: string;
  lastRun: string | null;
  executionCount: number;
  successRate: number;
  usedBy: string[];
  usedPipelines: string[];
}

interface StatusFile {
  generated: string;
  version: string;
  pipelines: PipelineStatus[];
  agents: AgentActivity[];
  summary: {
    totalPipelines: number;
    activePipelines: number;
    inactivePipelines: number;
    errorPipelines: number;
    totalRuns: number;
    globalSuccessRate: number;
    lastActivity: string | null;
  };
}

// Configuration
const BASE_DIR = process.cwd();
const STATUS_FILE_PATH = path.join(BASE_DIR, 'status.json');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const N8N_CONFIGS_PATTERN = 'n8n.*.json';
const WORKFLOW_IDS_FILE = path.join(BASE_DIR, 'workflow-ids.json');

// Formats de log pour chaque type de pipeline
const LOG_PATTERNS = {
  n8n: /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\]\s+(\w+)\s+(.+?):\s+(.+)$/,
  bullmq: /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\]\s+(\w+)\s+\[(.+?)\]\s+(.+)$/,
  temporal: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\s+(\w+)\s+(.+?)\s+(.+)$/
};

// Utilitaire pour créer un objet PipelineStatus vide
function createEmptyPipelineStatus(id: string, name: string, type: PipelineStatus['type'], configPath: string): PipelineStatus {
  return {
    id,
    name,
    type,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    runCount: 0,
    successCount: 0,
    errorCount: 0,
    errorRate: 0,
    avgDuration: 0,
    usedBy: [],
    dependsOn: [],
    configuration: configPath,
    status: 'inactive',
    tags: []
  };
}

// Charger ou initialiser le fichier de statut
function loadOrInitStatusFile(): StatusFile {
  if (fs.existsSync(STATUS_FILE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATUS_FILE_PATH, 'utf8'));
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier status.json: ${error}`);
    }
  }

  // Initialiser un nouveau fichier de statut
  return {
    generated: new Date().toISOString(),
    version: '1.0.0',
    pipelines: [],
    agents: [],
    summary: {
      totalPipelines: 0,
      activePipelines: 0,
      inactivePipelines: 0,
      errorPipelines: 0,
      totalRuns: 0,
      globalSuccessRate: 0,
      lastActivity: null
    }
  };
}

// Découvrir les pipelines N8N
async function discoverN8NPipelines(statusFile: StatusFile): Promise<void> {
  console.log('Découverte des pipelines N8N...');
  
  // Trouver tous les fichiers de configuration N8N
  const n8nConfigFiles = await glob(N8N_CONFIGS_PATTERN, { cwd: BASE_DIR, absolute: true });
  
  // Charger le fichier workflow-ids.json s'il existe
  let workflowIdsMap: Record<string, string> = {};
  if (fs.existsSync(WORKFLOW_IDS_FILE)) {
    try {
      workflowIdsMap = JSON.parse(fs.readFileSync(WORKFLOW_IDS_FILE, 'utf8'));
    } catch (error) {
      console.warn(`Avertissement: Impossible de charger le fichier workflow-ids.json: ${error}`);
    }
  }
  
  for (const configFile of n8nConfigFiles) {
    try {
      const configContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const fileName = path.basename(configFile);
      const pipelineId = fileName.replace(/^n8n\./, '').replace(/\.json$/, '');
      const pipelineName = configContent.name || pipelineId;
      
      // Vérifier si le pipeline existe déjà dans le fichier de statut
      let pipeline = statusFile.pipelines.find(p => p.id === pipelineId);
      
      if (!pipeline) {
        // Créer une nouvelle entrée pour ce pipeline
        pipeline = createEmptyPipelineStatus(pipelineId, pipelineName, 'n8n', configFile);
        statusFile.pipelines.push(pipeline);
      } else {
        // Mettre à jour les informations de base
        pipeline.name = pipelineName;
        pipeline.configuration = configFile;
        pipeline.type = 'n8n';
      }
      
      // Déterminer les dépendances à partir de la configuration
      const dependencies: string[] = [];
      
      // Analyser la configuration pour trouver les dépendances
      if (configContent.nodes) {
        for (const node of configContent.nodes) {
          if (node.type === 'n8n-nodes-base.executeWorkflow' && node.parameters?.workflowId) {
            const depId = workflowIdsMap[node.parameters.workflowId] || node.parameters.workflowId;
            if (!dependencies.includes(depId)) {
              dependencies.push(depId);
            }
          }
        }
      }
      
      pipeline.dependsOn = dependencies;
      
      // Mettre à jour le statut
      if (pipeline.lastRun) {
        pipeline.status = pipeline.lastError && new Date(pipeline.lastError) > new Date(pipeline.lastSuccess || 0) 
          ? 'error' 
          : 'active';
      }
      
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${configFile}: ${error}`);
    }
  }
  
  console.log(`${n8nConfigFiles.length} pipelines N8N découverts.`);
}

// Découvrir les pipelines BullMQ à partir des fichiers docker-compose
async function discoverBullMQPipelines(statusFile: StatusFile): Promise<void> {
  console.log('Découverte des pipelines BullMQ...');
  
  // Trouver tous les fichiers docker-compose avec BullMQ
  const dockerComposeFiles = await glob('**/docker-compose*.{yml,yaml}', { cwd: BASE_DIR, absolute: true });
  let bullMQCount = 0;
  
  for (const composeFile of dockerComposeFiles) {
    try {
      const content = fs.readFileSync(composeFile, 'utf8');
      
      // Vérifier si le fichier contient des références à BullMQ
      if (content.includes('bullmq') || content.includes('bull-board') || content.includes('bull-arena')) {
        // Extraire les noms de queues à partir du fichier
        const queueMatches = content.match(/queue(?:s|Name|_name)?['":\s]+([^'"}\s,]+)/gi) || [];
        
        for (const queueMatch of queueMatches) {
          const queueName = queueMatch.replace(/queue(?:s|Name|_name)?['":\s]+/i, '').trim();
          
          if (queueName && !queueName.includes('$') && !queueName.includes('{')) {
            const pipelineId = `bullmq-${queueName}`;
            
            // Vérifier si le pipeline existe déjà
            let pipeline = statusFile.pipelines.find(p => p.id === pipelineId);
            
            if (!pipeline) {
              // Créer une nouvelle entrée pour ce pipeline
              pipeline = createEmptyPipelineStatus(pipelineId, `BullMQ Queue: ${queueName}`, 'bullmq', composeFile);
              statusFile.pipelines.push(pipeline);
              bullMQCount++;
            } else {
              // Mettre à jour les informations de base
              pipeline.configuration = composeFile;
              pipeline.type = 'bullmq';
            }
            
            // Tagguer avec le nom du fichier docker-compose
            const composeFileName = path.basename(composeFile);
            if (!pipeline.tags.includes(composeFileName)) {
              pipeline.tags.push(composeFileName);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${composeFile}: ${error}`);
    }
  }
  
  console.log(`${bullMQCount} pipelines BullMQ découverts.`);
}

// Découvrir les pipelines Temporal
async function discoverTemporalPipelines(statusFile: StatusFile): Promise<void> {
  console.log('Découverte des pipelines Temporal...');
  
  // Rechercher les fichiers de workflows Temporal
  const temporalFiles = await glob('**/temporal/**/*.ts', { cwd: BASE_DIR, absolute: true });
  let temporalCount = 0;
  
  for (const temporalFile of temporalFiles) {
    try {
      const content = fs.readFileSync(temporalFile, 'utf8');
      
      // Rechercher les définitions de workflow
      const workflowMatches = content.match(/workflow\s*\.\s*createWorkflow\s*\(\s*['"]([\w-]+)['"]/g) || [];
      const activityMatches = content.match(/activity\s*\.\s*createActivity\s*\(\s*['"]([\w-]+)['"]/g) || [];
      
      // Traiter les workflows
      for (const workflowMatch of workflowMatches) {
        const match = workflowMatch.match(/workflow\s*\.\s*createWorkflow\s*\(\s*['"]([\w-]+)['"]/);
        if (match && match[1]) {
          const workflowName = match[1];
          const pipelineId = `temporal-workflow-${workflowName}`;
          
          // Vérifier si le pipeline existe déjà
          let pipeline = statusFile.pipelines.find(p => p.id === pipelineId);
          
          if (!pipeline) {
            // Créer une nouvelle entrée pour ce pipeline
            pipeline = createEmptyPipelineStatus(pipelineId, `Temporal Workflow: ${workflowName}`, 'temporal', temporalFile);
            statusFile.pipelines.push(pipeline);
            temporalCount++;
          } else {
            // Mettre à jour les informations de base
            pipeline.configuration = temporalFile;
            pipeline.type = 'temporal';
          }
          
          // Tagguer comme workflow
          if (!pipeline.tags.includes('workflow')) {
            pipeline.tags.push('workflow');
          }
        }
      }
      
      // Traiter les activities
      for (const activityMatch of activityMatches) {
        const match = activityMatch.match(/activity\s*\.\s*createActivity\s*\(\s*['"]([\w-]+)['"]/);
        if (match && match[1]) {
          const activityName = match[1];
          const pipelineId = `temporal-activity-${activityName}`;
          
          // Vérifier si le pipeline existe déjà
          let pipeline = statusFile.pipelines.find(p => p.id === pipelineId);
          
          if (!pipeline) {
            // Créer une nouvelle entrée pour ce pipeline
            pipeline = createEmptyPipelineStatus(pipelineId, `Temporal Activity: ${activityName}`, 'temporal', temporalFile);
            statusFile.pipelines.push(pipeline);
            temporalCount++;
          } else {
            // Mettre à jour les informations de base
            pipeline.configuration = temporalFile;
            pipeline.type = 'temporal';
          }
          
          // Tagguer comme activity
          if (!pipeline.tags.includes('activity')) {
            pipeline.tags.push('activity');
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${temporalFile}: ${error}`);
    }
  }
  
  console.log(`${temporalCount} pipelines Temporal découverts.`);
}

// Analyser les logs et mettre à jour les statistiques
async function analyzeLogs(statusFile: StatusFile): Promise<void> {
  console.log('Analyse des logs des pipelines...');
  
  if (!fs.existsSync(LOGS_DIR)) {
    console.warn(`Répertoire de logs non trouvé: ${LOGS_DIR}`);
    return;
  }
  
  const logFiles = await glob('**/*.log', { cwd: LOGS_DIR, absolute: true });
  console.log(`${logFiles.length} fichiers de logs trouvés.`);
  
  let totalLogEntries = 0;
  
  for (const logFile of logFiles) {
    try {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const logLines = logContent.split('\n');
      
      for (const line of logLines) {
        if (!line.trim()) continue;
        
        // Déterminer le type de log
        let match: RegExpMatchArray | null = null;
        let logType: 'n8n' | 'bullmq' | 'temporal' | null = null;
        
        for (const [type, pattern] of Object.entries(LOG_PATTERNS)) {
          match = line.match(pattern as RegExp);
          if (match) {
            logType = type as 'n8n' | 'bullmq' | 'temporal';
            break;
          }
        }
        
        if (!match || !logType) continue;
        
        // Extraire les informations des logs
        const [_, timestamp, logLevel, pipelineId, message] = match;
        totalLogEntries++;
        
        // Trouver le pipeline correspondant
        let typePrefix = '';
        switch (logType) {
          case 'n8n':
            typePrefix = '';
            break;
          case 'bullmq':
            typePrefix = 'bullmq-';
            break;
          case 'temporal':
            typePrefix = 'temporal-';
            break;
        }
        
        const normalizedId = pipelineId.toLowerCase().replace(/\s+/g, '-');
        const fullPipelineId = `${typePrefix}${normalizedId}`;
        
        let pipeline = statusFile.pipelines.find(p => p.id === fullPipelineId);
        
        // Si non trouvé, essayer une correspondance partielle
        if (!pipeline) {
          pipeline = statusFile.pipelines.find(p => p.id.includes(normalizedId) || normalizedId.includes(p.id));
        }
        
        // Si toujours pas trouvé et que ce n'est pas un message système, créer un nouveau pipeline
        if (!pipeline && !normalizedId.includes('system') && !normalizedId.includes('general')) {
          pipeline = createEmptyPipelineStatus(
            fullPipelineId,
            pipelineId,
            logType,
            logFile
          );
          statusFile.pipelines.push(pipeline);
        }
        
        if (pipeline) {
          // Mettre à jour les statistiques du pipeline
          if (!pipeline.lastRun || new Date(timestamp) > new Date(pipeline.lastRun)) {
            pipeline.lastRun = timestamp;
          }
          
          pipeline.runCount++;
          
          // Détecter les succès et les erreurs
          const isSuccess = message.includes('success') || 
                           logLevel.toLowerCase() === 'info' || 
                           message.includes('completed');
                           
          const isError = message.includes('error') || 
                         message.includes('fail') || 
                         message.includes('exception') ||
                         logLevel.toLowerCase() === 'error';
                         
          if (isSuccess) {
            pipeline.successCount++;
            if (!pipeline.lastSuccess || new Date(timestamp) > new Date(pipeline.lastSuccess)) {
              pipeline.lastSuccess = timestamp;
            }
          }
          
          if (isError) {
            pipeline.errorCount++;
            if (!pipeline.lastError || new Date(timestamp) > new Date(pipeline.lastError)) {
              pipeline.lastError = timestamp;
            }
          }
          
          // Mettre à jour le taux d'erreur
          pipeline.errorRate = pipeline.runCount > 0 ? (pipeline.errorCount / pipeline.runCount) * 100 : 0;
          
          // Déterminer le statut actuel du pipeline
          if (pipeline.lastRun) {
            const lastDate = new Date(pipeline.lastRun);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            if (lastDate > threeDaysAgo) {
              // Actif récemment
              pipeline.status = pipeline.lastError && new Date(pipeline.lastError) > new Date(pipeline.lastSuccess || 0)
                ? 'error'
                : 'active';
            } else {
              // Inactif (pas d'activité récente)
              pipeline.status = 'inactive';
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier de logs ${logFile}: ${error}`);
    }
  }
  
  console.log(`${totalLogEntries} entrées de logs analysées.`);
}

// Détecter les relations usedBy
function detectPipelineRelationships(statusFile: StatusFile): void {
  console.log('Détection des relations entre pipelines...');
  
  // Réinitialiser les relations usedBy
  for (const pipeline of statusFile.pipelines) {
    pipeline.usedBy = [];
  }
  
  // Reconstruire les relations usedBy à partir des dépendances
  for (const pipeline of statusFile.pipelines) {
    for (const depId of pipeline.dependsOn) {
      const dependency = statusFile.pipelines.find(p => p.id === depId);
      if (dependency && !dependency.usedBy.includes(pipeline.id)) {
        dependency.usedBy.push(pipeline.id);
      }
    }
  }
  
  console.log('Relations entre pipelines mises à jour.');
}

// Mettre à jour les statistiques globales
function updateGlobalStats(statusFile: StatusFile): void {
  console.log('Mise à jour des statistiques globales...');
  
  const totalPipelines = statusFile.pipelines.length;
  const activePipelines = statusFile.pipelines.filter(p => p.status === 'active').length;
  const inactivePipelines = statusFile.pipelines.filter(p => p.status === 'inactive').length;
  const errorPipelines = statusFile.pipelines.filter(p => p.status === 'error').length;
  
  const totalRuns = statusFile.pipelines.reduce((sum, p) => sum + p.runCount, 0);
  const totalSuccesses = statusFile.pipelines.reduce((sum, p) => sum + p.successCount, 0);
  
  // Trouver la dernière activité globale
  let lastActivity: string | null = null;
  for (const pipeline of statusFile.pipelines) {
    if (pipeline.lastRun && (!lastActivity || new Date(pipeline.lastRun) > new Date(lastActivity))) {
      lastActivity = pipeline.lastRun;
    }
  }
  
  statusFile.summary = {
    totalPipelines,
    activePipelines,
    inactivePipelines,
    errorPipelines,
    totalRuns,
    globalSuccessRate: totalRuns > 0 ? (totalSuccesses / totalRuns) * 100 : 0,
    lastActivity
  };
  
  console.log('Statistiques globales mises à jour.');
}

// Point d'entrée principal
(async function main() {
  try {
    console.log('=== Suivi d\'activité des pipelines MCP OS ===');
    
    // Charger ou initialiser le fichier de statut
    const statusFile = loadOrInitStatusFile();
    
    // Découvrir les pipelines
    await discoverN8NPipelines(statusFile);
    await discoverBullMQPipelines(statusFile);
    await discoverTemporalPipelines(statusFile);
    
    // Analyser les logs
    await analyzeLogs(statusFile);
    
    // Détecter les relations entre pipelines
    detectPipelineRelationships(statusFile);
    
    // Mettre à jour les statistiques globales
    updateGlobalStats(statusFile);
    
    // Mettre à jour le timestamp de génération
    statusFile.generated = new Date().toISOString();
    
    // Enregistrer le fichier de statut
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(statusFile, null, 2));
    
    console.log(`\n✅ Mise à jour du fichier de statut terminée: ${STATUS_FILE_PATH}`);
    console.log(`   ${statusFile.pipelines.length} pipelines suivis.`);
    console.log(`   Dernière activité: ${statusFile.summary.lastActivity || 'Aucune'}`);
    console.log(`   Taux de succès global: ${statusFile.summary.globalSuccessRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error(`Erreur lors du suivi d'activité des pipelines: ${error}`);
    process.exit(1);
  }
})();