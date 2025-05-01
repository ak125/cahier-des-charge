
/**
 * Script de configuration de l'orchestrateur standardisé
 * 
 * Ce script configure BullMQ comme orchestrateur principal et 
 * met en place les redirections pour Temporal et n8n pendant la migration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Vérifier si les dépendances sont installées
console.log('📦 Vérification des dépendances...');

// Fonction pour vérifier si un package est installé
function isPackageInstalled(packageName) {
  try {
    require(packageName);
    return true;
  } catch (_err) {
    return false;
  }
}

// Installer les dépendances nécessaires
const requiredPackages = ['bullmq', '@temporalio/client', 'axios', 'fs-extra'];

for (const pkg of requiredPackages) {
  if (!isPackageInstalled(pkg)) {
    console.log(`Installation du package ${pkg}...`);
    try {
      execSync(`npm install ${pkg}`);
      console.log(`✓ ${pkg} installé`);
    } catch (error) {
      console.log(`⚠️ Impossible d'installer ${pkg}: ${error.message}`);
    }
  }
}

// Chemin vers le dossier d'orchestration
const orchestrationDir = path.join(__dirname, '..', 'src', 'orchestration');

// Création du dossier s'il n'existe pas
if (!fs.existsSync(orchestrationDir)) {
  fs.mkdirSync(orchestrationDir, { recursive: true });
}

// Chemin vers le dossier de monitoring
const monitoringDir = path.join(orchestrationDir, 'monitoring');
if (!fs.existsSync(monitoringDir)) {
  fs.mkdirSync(monitoringDir, { recursive: true });
}

// Création du système de logging pour la migration
console.log('📝 Mise en place du système de logging pour la migration...');

const migrationLoggerCode = `
/**
 * Logger spécialisé pour la migration des orchestrateurs
 * 
 * Ce module ajoute une couche de journalisation pour suivre l'avancement
 * de la migration vers l'orchestrateur standardisé.
 */

import * as fs from 'fs';
import * as path from 'path';

// Niveaux de log
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

// Configuration du logger
interface LoggerConfig {
  enabled: boolean;
  filePath: string;
  consoleOutput: boolean;
  minLevel: LogLevel;
}

// Configuration par défaut
const defaultConfig: LoggerConfig = {
  enabled: true,
  filePath: path.join(process.cwd(), 'logs', 'orchestrator-migration.log'),
  consoleOutput: true,
  minLevel: LogLevel.INFO
};

// Chargement de la configuration depuis les variables d'environnement
function loadConfigFromEnv(): LoggerConfig {
  return {
    enabled: process.env.ORCHESTRATOR_MIGRATION_MODE === 'true',
    filePath: process.env.MIGRATION_LOG_FILE || defaultConfig.filePath,
    consoleOutput: process.env.MIGRATION_CONSOLE_OUTPUT !== 'false',
    minLevel: (process.env.STANDARDIZED_ORCHESTRATOR_LOG_LEVEL as LogLevel) || defaultConfig.minLevel
  };
}

class MigrationLogger {
  private config: LoggerConfig;

  constructor() {
    this.config = loadConfigFromEnv();

    // Créer le dossier de logs si nécessaire
    const logDir = path.dirname(this.config.filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Écrit un message de log
   */
  private log(level: LogLevel, message: string, metadata?: any): void {
    if (!this.config.enabled) return;

    // Vérifier le niveau minimal de log
    const levels = Object.values(LogLevel);
    if (levels.indexOf(level) < levels.indexOf(this.config.minLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;

    // Ajouter les métadonnées si présentes
    if (metadata) {
      logMessage += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    // Écrire dans le fichier
    fs.appendFileSync(this.config.filePath, logMessage + '\n');

    // Afficher dans la console si activé
    if (this.config.consoleOutput) {
      const consoleMethod = level === LogLevel.ERROR ? console.error :
                            level === LogLevel.WARNING ? console.warn :
                            level === LogLevel.DEBUG ? console.debug :
                            console.log;
      
      consoleMethod(`[Migration] ${message}`);
      if (metadata) {
        consoleMethod(metadata);
      }
    }
  }

  /**
   * Log de niveau DEBUG
   */
  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log de niveau INFO
   */
  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log de niveau WARNING
   */
  warning(message: string, metadata?: any): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  /**
   * Log de niveau ERROR
   */
  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Journalisation d'une migration spécifique
   * Utilise pour suivre chaque cas de migration d'orchestrateur
   */
  logMigration(
    source: string, 
    fromOrchestrator: string, 
    toOrchestrator: string, 
    details: any
  ): void {
    this.info(
      `Migration from ${fromOrchestrator} to ${toOrchestrator} in ${source}`,
      {
        source,
        fromOrchestrator,
        toOrchestrator,
        timestamp: new Date().toISOString(),
        details
      }
    );
  }
}

// Singleton du logger de migration
export const migrationLogger = new MigrationLogger();
`;

fs.writeFileSync(path.join(monitoringDir, 'migration-logger.ts'), migrationLoggerCode);
console.log('✓ Système de logging créé');

// Création du POC de migration
console.log('🔬 Création du POC d\'agent avec orchestrateur standardisé...');

const _pocAgentCode = `
/**
 * Exemple d'agent utilisant l'orchestrateur standardisé
 * 
 * Ce fichier montre un exemple d'implémentation d'un agent qui utilise
 * l'orchestrateur standardisé, servant de POC pour la migration.
 */

import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
import { migrationLogger } from '../src/orchestration/monitoring/migration-logger';

/**
 * MigrationPocAgent
 * 
 * Agent de démonstration pour la migration des orchestrateurs
 */
export class MigrationPocAgent {
  private agentName: string;

  constructor(name: string = 'migration-poc-agent') {
    this.agentName = name;
    migrationLogger.info(`Initialisation de ${this.agentName}`);
  }

  /**
   * Soumet une tâche simple (BullMQ)
   */
  async submitSimpleTask(taskName: string, payload: any, options: any = {}) {
    migrationLogger.debug(`Soumission d'une tâche simple: ${taskName}`, { payload });

    return standardizedOrchestrator.scheduleTask(
      taskName,
      payload,
      {
        taskType: TaskType.SIMPLE,
        priority: options.priority,
        delay: options.delay,
        attempts: options.attempts
      }
    );
  }

  /**
   * Soumet un workflow complexe (Temporal)
   */
  async submitComplexWorkflow(
    workflowName: string, 
    payload: any, 
    workflowOptions: any = {}
  ) {
    migrationLogger.debug(`Soumission d'un workflow complexe: ${workflowName}`, { payload });

    return standardizedOrchestrator.scheduleTask(
      workflowName,
      payload,
      {
        taskType: TaskType.COMPLEX,
        temporal: {
          workflowType: workflowName,
          workflowArgs: [payload],
          taskQueue: workflowOptions.taskQueue || 'default',
          trackingQueue: workflowOptions.trackingQueue,
          workflowId: workflowOptions.workflowId
        }
      }
    );
  }

  /**
   * Soumet une intégration externe (n8n)
   */
  async submitIntegration(
    integrationName: string,
    payload: any,
    integrationOptions: any = {}
  ) {
    migrationLogger.debug(`Soumission d'une intégration externe: ${integrationName}`, { payload });

    return standardizedOrchestrator.scheduleTask(
      integrationName,
      payload,
      {
        taskType: TaskType.INTEGRATION,
        n8n: {
          workflowId: integrationOptions.workflowId || integrationName,
          webhookUrl: integrationOptions.webhookUrl,
          credentials: integrationOptions.credentials,
          integrationSource: integrationOptions.source || 'mcp'
        }
      }
    );
  }

  /**
   * Obtient le statut d'une tâche
   */
  async getTaskStatus(taskId: string) {
    return standardizedOrchestrator.getTaskStatus(taskId);
  }

  /**
   * Annule une tâche
   */
  async cancelTask(taskId: string) {
    return standardizedOrchestrator.cancelTask(taskId);
  }
}

// Exporter l'agent
export const migrationPocAgent = new MigrationPocAgent();
`;

fs.writeFileSync(path.join(__dirname, '..', 'agents', 'migration-poc-agent.ts'), pocAgentCode);
console.log('✓ Agent POC créé avec succès');

// Création du fichier de migration 
console.log('📑 Création du guide de migration technique...');

const migrationGuideCode = `
# Guide technique de migration vers l'orchestrateur standardisé

Ce document fournit des instructions détaillées pour migrer vos orchestrations existantes
vers l'orchestrateur standardisé.

## Table des matières

1. [Prérequis](#prérequis)
2. [Migration depuis BullMQ](#migration-depuis-bullmq)
3. [Migration depuis Temporal](#migration-depuis-temporal)
4. [Migration depuis n8n](#migration-depuis-n8n)
5. [Bonnes pratiques](#bonnes-pratiques)
6. [Dépannage](#dépannage)

## Prérequis

Avant de commencer la migration, assurez-vous que :

1. L'orchestrateur standardisé est correctement configuré
2. Les adaptateurs nécessaires sont en place
3. L'audit des orchestrateurs a été effectué

## Migration depuis BullMQ

### Exemple original avec BullMQ direct

\`\`\`typescript
import { Queue } from 'bullmq';

const queue = new Queue('processing-queue', {
  connection: {
    host: 'redis-server',
    port: 6379
  }
});

await queue.add('process-item', {
  itemId: 123,
  userId: 456
}, {
  priority: 10,
  delay: 5000,
  attempts: 3
});
\`\`\`

### Version migrée avec l'orchestrateur standardisé

\`\`\`typescript
import { TaskType, standardizedOrchestrator } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'processing-queue',  // Nom de la file original
  {  // Payload original
    itemId: 123,
    userId: 456
  },
  {  // Options
    taskType: TaskType.SIMPLE,
    priority: 10,
    delay: 5000,
    attempts: 3
  }
);
\`\`\`

## Migration depuis Temporal

### Exemple original avec Temporal direct

\`\`\`typescript
import { Client, Connection } from '@temporalio/client';

const connection = await Connection.connect({
  address: 'temporal-server:7233'
});

const client = new Client({
  connection
});

const _handle = await client.workflow.start('analyzeCode', {
  taskQueue: 'analysis-queue',
  workflowId: 'analysis-123',
  args: [{
    repository: 'https://github.com/organization/repo',
    branch: 'main',
    languages: ['typescript', 'javascript']
  }]
});
\`\`\`

### Version migrée avec l'orchestrateur standardisé

\`\`\`typescript
import { TaskType, standardizedOrchestrator } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'analyzeCode',  // Nom du workflow Temporal
  {  // Payload original
    repository: 'https://github.com/organization/repo',
    branch: 'main',
    languages: ['typescript', 'javascript']
  },
  {  // Options
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'analyzeCode',
      workflowArgs: [{
        repository: 'https://github.com/organization/repo',
        branch: 'main',
        languages: ['typescript', 'javascript']
      }],
      taskQueue: 'analysis-queue',
      workflowId: 'analysis-123',
      trackingQueue: 'analysis-tracking'  // Optionnel: pour suivre avec BullMQ
    }
  }
);
\`\`\`

## Migration depuis n8n

### Exemple original avec n8n direct

\`\`\`typescript
import axios from 'axios';

const _response = await axios.post(
  'https://n8n-server.example.com/api/v1/workflows/trigger',
  {
    workflowId: 'integration-workflow-123',
    data: {
      event: 'pullRequestClosed',
      repository: 'main-repo',
      pr: {
        id: 456,
        author: 'developer'
      }
    }
  },
  {
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY
    }
  }
);
\`\`\`

### Version migrée avec l'orchestrateur standardisé

\`\`\`typescript
import { TaskType, standardizedOrchestrator } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'integration-workflow',  // Nom lisible pour l'intégration
  {  // Payload original
    event: 'pullRequestClosed',
    repository: 'main-repo',
    pr: {
      id: 456,
      author: 'developer'
    }
  },
  {  // Options
    taskType: TaskType.INTEGRATION,
    n8n: {
      workflowId: 'integration-workflow-123',
      webhookUrl: 'https://n8n-server.example.com/webhook/...',
      credentials: {
        apiKey: process.env.N8N_API_KEY
      },
      integrationSource: 'github'
    }
  }
);
\`\`\`

## Bonnes pratiques

1. **Migration progressive** : Commencez par les flux de travail non critiques
2. **Exécution en parallèle** : Utilisez le mode double exécution pendant la transition
3. **Tests** : Validez chaque migration par des tests complets
4. **Journalisation** : Activez les logs détaillés pendant la migration avec `STANDARDIZED_ORCHESTRATOR_LOG_LEVEL=DEBUG`

## Dépannage

### Problème : Tâche introuvable après migration

**Solution** : Vérifiez que vous utilisez le même nom de tâche/file d'attente dans l'orchestrateur standardisé.

### Problème : Options spécifiques à un orchestrateur non disponibles

**Solution** : Utilisez les champs spécifiques dans les objets d'options (`temporal`, `n8n`, etc.)

### Problème : Performances dégradées

**Solution** : Vérifiez la configuration de Redis pour BullMQ et ajustez les paramètres selon la charge.

### Problème : L'annulation d'une tâche ne fonctionne pas

**Solution** : Vérifiez que l'ID de tâche est correctement retourné et stocké après la planification.
`;

fs.writeFileSync(path.join(__dirname, '..', 'guides', 'migration-orchestrateur.md'), migrationGuideCode);
console.log('✓ Guide de migration créé avec succès');

// Lancer l'audit des orchestrateurs
log('🔍 Exécution de l'audit des orchestrateurs...');
runCommand('node scripts/audit-orchestrators.js', 'Auditer les orchestrateurs');

log('✅ Configuration de la migration terminée !');
log('');
log('📋 Prochaines étapes :');
log('1. Consultez le rapport d'audit dans orchestrator-audit-report.md');
log('2. Consultez le guide de migration dans guides/migration-orchestrateur.md');
log('3. Testez le POC avec l'agent migration-poc-agent.ts');
log('');
log('🚀 Bonne migration !');
