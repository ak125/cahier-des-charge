#!/usr/bin/env node

/**
 * Script d'audit des orchestrateurs
 *
 * Ce script analyse tous les fichiers du projet pour identifier les utilisations
 * directes des orchestrateurs (BullMQ, Temporal, n8n) et générer un rapport d'audit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EOL } = require('os');

// Configurations
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(REPO_ROOT, 'orchestrator-audit-report.md');
const IGNORE_DIRS = ['node_modules', '.git', 'coverage', 'dist', 'build', 'temp', 'tmp'];

// Patterns pour identifier les orchestrateurs utilisés
const PATTERNS = {
  bullmq: [
    { regex: /import.*?['\"]bullmq['\"]/, classification: 'SIMPLE' },
    { regex: /new Queue\(/, classification: 'SIMPLE' },
    { regex: /queue\.add\(/, classification: 'SIMPLE' },
    { regex: /await queue\.add\(/, classification: 'SIMPLE' },
  ],
  temporal: [
    { regex: /import.*?['\"]@temporalio\/client['\"]/, classification: 'COMPLEX' },
    { regex: /import.*?['\"]@temporalio\/worker['\"]/, classification: 'COMPLEX' },
    { regex: /client\.workflow\.start\(/, classification: 'COMPLEX' },
    { regex: /client\.workflow\.execute\(/, classification: 'COMPLEX' },
    { regex: /defineWorkflow\(/, classification: 'COMPLEX' },
    { regex: /await workflow\.execute\(/, classification: 'COMPLEX' },
  ],
  n8n: [
    { regex: /import.*?['\"]n8n-workflow['\"]/, classification: 'INTEGRATION' },
    { regex: /n8n\.callWorkflow\(/, classification: 'INTEGRATION' },
    { regex: /n8nClient\.triggerWorkflow\(/, classification: 'INTEGRATION' },
    { regex: /webhookUrl.*?n8n/, classification: 'INTEGRATION' },
  ],
  standardized: [
    { regex: /import.*?standardizedOrchestrator/, classification: 'STANDARDIZED' },
    { regex: /scheduleTask\(/, classification: 'STANDARDIZED' },
    { regex: /StandardizedOrchestrator/, classification: 'STANDARDIZED' },
    { regex: /await orchestrator\.scheduleTask\(/, classification: 'STANDARDIZED' },
  ],
};

// Résultats globaux
const results = {
  bullmq: [],
  temporal: [],
  n8n: [],
  standardized: [],
};

/**
 * Analyse un fichier pour trouver les utilisations d'orchestrateurs
 */
function analyzeFile(filePath) {
  try {
    // Ignorer les fichiers binaires ou trop gros
    const stats = fs.statSync(filePath);
    if (stats.size > 1000000) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Vérifier chaque pattern pour chaque ligne
    for (const [orchestratorType, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum];
          if (pattern.regex.test(line)) {
            results[orchestratorType].push({
              file: filePath,
              line: lineNum + 1, // Les numéros de ligne commencent à 1
              match: line.trim(),
              classification: pattern.classification,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error.message);
  }
}

/**
 * Parcourt récursivement un répertoire pour analyser tous les fichiers
 */
function analyzeDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);

      // Ignorer les répertoires de la liste d'exclusion
      if (IGNORE_DIRS.includes(entry)) {
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        analyzeDirectory(fullPath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry)) {
        analyzeFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse du répertoire ${dir}:`, error.message);
  }
}

/**
 * Génère le rapport d'audit au format Markdown
 */
function generateReport() {
  const now = new Date();
  const formattedDate = now
    .toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '/');

  let report = `# Rapport d'audit des orchestrateurs
  
> Généré le : ${formattedDate}

Ce rapport identifie toutes les utilisations directes des orchestrateurs BullMQ, Temporal et n8n dans le projet,
et propose un plan de migration vers l'orchestrateur standardisé.

## Résumé

- **Utilisations directes détectées** : ${
    results.bullmq.length + results.temporal.length + results.n8n.length
  }
- **BullMQ** : ${results.bullmq.length} utilisations directes
- **Temporal** : ${results.temporal.length} utilisations directes
- **n8n** : ${results.n8n.length} utilisations directes
- **Orchestrateur standardisé** : ${results.standardized.length} utilisations

## Utilisations directes de BullMQ

Les tâches suivantes utilisent BullMQ directement et devraient être migrées vers \`standardizedOrchestrator.scheduleTask\` avec \`TaskType.SIMPLE\`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|\n`;

  // Ajouter les résultats BullMQ
  for (const result of results.bullmq) {
    report += `| \`${result.file}\` | ${result.line} | \`${result.match.replace(
      /\|/g,
      '\\|'
    )}\` | ${result.classification} |\n`;
  }

  report += `\n## Utilisations directes de Temporal

Les workflows suivants utilisent Temporal directement et devraient être migrés vers \`standardizedOrchestrator.scheduleTask\` avec \`TaskType.COMPLEX\`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|\n`;

  // Ajouter les résultats Temporal
  for (const result of results.temporal) {
    report += `| \`${result.file}\` | ${result.line} | \`${result.match.replace(
      /\|/g,
      '\\|'
    )}\` | ${result.classification} |\n`;
  }

  report += `\n## Utilisations directes de n8n

Les intégrations suivantes utilisent n8n directement et devraient être migrées vers \`standardizedOrchestrator.scheduleTask\` avec \`TaskType.INTEGRATION\`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|\n`;

  // Ajouter les résultats n8n
  for (const result of results.n8n) {
    report += `| \`${result.file}\` | ${result.line} | \`${result.match.replace(
      /\|/g,
      '\\|'
    )}\` | ${result.classification} |\n`;
  }

  report += `\n## Utilisations existantes de l'orchestrateur standardisé

Ces services utilisent déjà l'orchestrateur standardisé et peuvent servir d'exemples pour la migration.

| Fichier | Ligne | Utilisation détectée |
|---------|-------|---------------------|
`;

  // Ajouter les résultats de l'orchestrateur standardisé
  for (const result of results.standardized) {
    report += `| \`${result.file}\` | ${result.line} | \`${result.match.replace(
      /\|/g,
      '\\|'
    )}\` |\n`;
  }

  report += `\n## Recommandations pour la migration

1. **Étape 1**: Commencer par migrer les cas d'utilisation BullMQ simples vers l'orchestrateur standardisé
2. **Étape 2**: Migrer ensuite les workflows Temporal complexes
3. **Étape 3**: Finaliser avec les intégrations n8n

### Exemple de migration pour BullMQ

\`\`\`typescript
// Avant
import { Queue } from 'bullmq';
const queue = new Queue('my-queue');
await queue.add('my-job', { data: 'value' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('my-queue', { data: 'value' }, { taskType: TaskType.SIMPLE });
\`\`\`

### Exemple de migration pour Temporal

\`\`\`typescript
// Avant
import { Client } from '@temporalio/client';
const client = new Client();
await client.workflow.start('MyWorkflow', { args: [arg1, arg2], taskQueue: 'my-queue' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('MyWorkflow', { arg1, arg2 }, { 
  taskType: TaskType.COMPLEX,
  temporal: {
    workflowType: 'MyWorkflow',
    workflowArgs: [arg1, arg2],
    taskQueue: 'my-queue'
  }
});
\`\`\`

### Exemple de migration pour n8n

\`\`\`typescript
// Avant
import { n8nClient } from '../integration/n8n-client';
await n8nClient.triggerWorkflow({ workflowId: 'abc123', payload: data });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('integration-workflow', data, { 
  taskType: TaskType.INTEGRATION,
  n8n: {
    workflowId: 'abc123'
  }
});
\`\`\`
`;

  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Rapport d'audit généré avec succès dans ${OUTPUT_FILE}`);
}

/**
 * Fonction principale
 */
function main() {
  console.log("Démarrage de l'audit des orchestrateurs...");

  // Analyser tous les fichiers dans le répertoire du projet
  analyzeDirectory(REPO_ROOT);

  // Générer le rapport
  generateReport();

  console.log('Audit terminé !');
  console.log(`BullMQ: ${results.bullmq.length} utilisations directes`);
  console.log(`Temporal: ${results.temporal.length} utilisations directes`);
  console.log(`n8n: ${results.n8n.length} utilisations directes`);
  console.log(`Orchestrateur standardisé: ${results.standardized.length} utilisations`);
}

// Exécuter le script
main();
