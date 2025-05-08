#!/usr/bin/env node
/**
 * Script de migration vers l'orchestrateur standardisé
 *
 * Ce script analyse le code existant pour détecter les utilisations des orchestrateurs
 * (BullMQ, Temporal, OrchestratorBridge) et propose des remplacements adaptés
 * vers le nouvel orchestrateur standardisé.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(WORKSPACE_ROOT, 'orchestration-migration-report.md');
const NX_CONFIG_PATH = path.join(WORKSPACE_ROOT, 'nx.json');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Expressions régulières pour détecter les orchestrateurs
const patterns = {
  bullmq: /new\s+Queue\(['"]([^'"]+)['"]/g,
  temporal: /workflow\.start\(['"]([^'"]+)['"],/g,
  orchestratorBridge: /startTemporalWorkflowWithBullMQTracking|startVersionedWorkflow/g,
};

// Statistiques de migration
const stats = {
  bullmqOccurrences: 0,
  temporalOccurrences: 0,
  bridgeOccurrences: 0,
  filesAnalyzed: 0,
  filesWithOccurrences: 0,
  filesUpdated: 0,
};

// Génère le guide de migration pour un fichier
function generateMigrationGuide(filePath, _content, matches) {
  if (!matches || matches.length === 0) return null;

  const relativeFilePath = path.relative(WORKSPACE_ROOT, filePath);
  const guide = [`## ${relativeFilePath}\n`];

  // Suggestions de migration spécifiques à chaque type d'orchestrateur
  if (matches.bullmq && matches.bullmq.length > 0) {
    guide.push('### BullMQ → Orchestrateur standardisé\n');
    matches.bullmq.forEach((queue) => {
      guide.push(`Remplacer l'utilisation de la file d'attente BullMQ '${queue}' par :\n`);
      guide.push('```typescript');
      guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  '${queue}',
  payload,
  {
    taskType: TaskType.SIMPLE,
    // Copier les options existantes ici
  }
);`);
      guide.push('```\n');
    });
  }

  if (matches.temporal && matches.temporal.length > 0) {
    guide.push('### Temporal → Orchestrateur standardisé\n');
    matches.temporal.forEach((workflowType) => {
      guide.push(`Remplacer l'appel au workflow Temporal '${workflowType}' par :\n`);
      guide.push('```typescript');
      guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  '${workflowType}',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: '${workflowType}',
      workflowArgs: args,
      taskQueue: 'task-queue-name'
      // Copier les options existantes ici
    }
  }
);`);
      guide.push('```\n');
    });
  }

  if (matches.bridge && matches.bridge > 0) {
    guide.push('### OrchestratorBridge → Orchestrateur standardisé\n');
    guide.push("Remplacer l'utilisation de l'OrchestratorBridge par :\n");
    guide.push('```typescript');
    guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

// Pour les tâches complexes avec suivi
await standardizedOrchestrator.scheduleTask(
  'workflow-name',
  payload,
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: args,
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Pour suivre avec BullMQ
    }
  }
);`);
    guide.push('```\n');
  }

  return guide.join('\n');
}

// Recherche les occurrences des orchestrateurs dans un fichier
function findOccurrences(_filePath, content) {
  const matches = {
    bullmq: [],
    temporal: [],
    bridge: 0,
  };

  let match;
  // Rechercher les occurrences BullMQ
  while ((match = patterns.bullmq.exec(content)) !== null) {
    matches.bullmq.push(match[1]);
    stats.bullmqOccurrences++;
  }

  // Rechercher les occurrences Temporal
  while ((match = patterns.temporal.exec(content)) !== null) {
    matches.temporal.push(match[1]);
    stats.temporalOccurrences++;
  }

  // Rechercher les occurrences OrchestratorBridge
  const bridgeMatches = content.match(patterns.orchestratorBridge);
  if (bridgeMatches) {
    matches.bridge = bridgeMatches.length;
    stats.bridgeOccurrences += bridgeMatches.length;
  }

  return matches;
}

// Analyse un fichier pour les occurrences d'orchestrateurs
function analyzeFile(filePath) {
  try {
    // Ignorer les fichiers de node_modules, dist, etc.
    if (
      filePath.includes('node_modules') ||
      filePath.includes('dist') ||
      filePath.includes('.git')
    ) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    stats.filesAnalyzed++;

    // Seulement pour les fichiers .ts, .js
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
      return null;
    }

    const matches = findOccurrences(filePath, content);

    // Si aucune occurrence, retourner null
    if (matches.bullmq.length === 0 && matches.temporal.length === 0 && matches.bridge === 0) {
      return null;
    }

    stats.filesWithOccurrences++;
    return generateMigrationGuide(filePath, content, matches);
  } catch (error) {
    console.error(
      `${colors.red}Erreur lors de l'analyse de ${filePath}:${colors.reset}`,
      error.message
    );
    return null;
  }
}

// Analyse récursivement un répertoire
function analyzeDirectory(dirPath, fileGuides = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      analyzeDirectory(fullPath, fileGuides);
    } else if (entry.isFile()) {
      const guide = analyzeFile(fullPath);
      if (guide) {
        fileGuides.push(guide);
      }
    }
  }

  return fileGuides;
}

// Génère le rapport de migration
function generateReport(fileGuides) {
  const nxTargets = loadNxTargets();

  const report = [
    "# Rapport de Migration vers l'Orchestrateur Standardisé",
    '',
    'Ce rapport a été généré automatiquement pour faciliter la migration des orchestrateurs existants vers le nouvel orchestrateur standardisé.',
    '',
    '## Résumé',
    '',
    `- Fichiers analysés: ${stats.filesAnalyzed}`,
    `- Fichiers avec occurrences: ${stats.filesWithOccurrences}`,
    `- Occurrences BullMQ: ${stats.bullmqOccurrences}`,
    `- Occurrences Temporal: ${stats.temporalOccurrences}`,
    `- Occurrences OrchestratorBridge: ${stats.bridgeOccurrences}`,
    '',
    '## Tâches NX configurées',
    '',
  ];

  // Ajouter les tâches NX
  if (nxTargets && Object.keys(nxTargets).length > 0) {
    Object.keys(nxTargets).forEach((target) => {
      report.push(`- \`nx run ${target}\``);
    });
  } else {
    report.push('Aucune tâche NX configurée trouvée.');
  }

  report.push('');
  report.push('## Guides de Migration par Fichier');
  report.push('');

  // Ajouter les guides de migration
  fileGuides.forEach((guide) => {
    report.push(guide);
  });

  report.push('');
  report.push("## Guide d'utilisation de l'orchestrateur standardisé");
  report.push('');
  report.push(
    "Voir `examples/standardized-orchestrator-example.ts` pour des exemples complets d'utilisation."
  );
  report.push('');
  report.push('### Tâche simple (BullMQ)');
  report.push('');
  report.push('```typescript');
  report.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'nom-de-la-tache',
  {
    // Données de la tâche
  },
  {
    taskType: TaskType.SIMPLE,
    priority: 1,
    attempts: 3
  }
);`);
  report.push('```');
  report.push('');
  report.push('### Workflow complexe (Temporal)');
  report.push('');
  report.push('```typescript');
  report.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';

await standardizedOrchestrator.scheduleTask(
  'nom-du-workflow',
  {
    // Données du workflow
  },
  {
    taskType: TaskType.COMPLEX,
    temporal: {
      workflowType: 'workflowType',
      workflowArgs: [arg1, arg2],
      taskQueue: 'task-queue-name',
      trackingQueue: 'tracking-queue-name'  // Optionnel: pour suivre avec BullMQ
    }
  }
);`);
  report.push('```');

  return report.join('\n');
}

// Charge les tâches configurées dans nx.json
function loadNxTargets() {
  try {
    if (fs.existsSync(NX_CONFIG_PATH)) {
      const nxConfig = JSON.parse(fs.readFileSync(NX_CONFIG_PATH, 'utf8'));
      return nxConfig.targetDefaults || {};
    }
    return {};
  } catch (error) {
    console.error(
      `${colors.red}Erreur lors de la lecture du fichier nx.json:${colors.reset}`,
      error.message
    );
    return {};
  }
}

// Fonction principale
async function main() {
  console.log(
    `${colors.bright}${colors.blue}=== Migration vers l'Orchestrateur Standardisé ===${colors.reset}`
  );
  console.log(`${colors.cyan}Analyse du workspace...${colors.reset}`);

  const fileGuides = analyzeDirectory(WORKSPACE_ROOT);
  const report = generateReport(fileGuides);

  fs.writeFileSync(REPORT_PATH, report);

  console.log(`\n${colors.bright}${colors.green}✓ Analyse terminée${colors.reset}`);
  console.log(`${colors.cyan}Statistiques:${colors.reset}`);
  console.log(`  - Fichiers analysés: ${stats.filesAnalyzed}`);
  console.log(`  - Fichiers avec occurrences: ${stats.filesWithOccurrences}`);
  console.log(`  - Occurrences BullMQ: ${stats.bullmqOccurrences}`);
  console.log(`  - Occurrences Temporal: ${stats.temporalOccurrences}`);
  console.log(`  - Occurrences OrchestratorBridge: ${stats.bridgeOccurrences}`);
  console.log(`\n${colors.green}Rapport de migration généré:${colors.reset} ${REPORT_PATH}`);
}

// Exécuter le script
main().catch((error) => {
  console.error(`${colors.red}Erreur:${colors.reset}`, error);
  process.exit(1);
});
