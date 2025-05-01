#!/usr/bin/env node

/**
 * Script de migration automatique de Taskfile vers NX
 *
 * Ce script analyse les commandes Taskfile dans le projet et génère un rapport
 * qui indique quelles commandes ont été remplacées par des commandes NX et
 * lesquelles sont encore à migrer.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TASKFILE_MAIN = path.join(__dirname, '..', 'Taskfile.yaml');
const TASKFILE_DIR = path.join(__dirname, '..', 'tasks');
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');

// Fonction simplifiée pour extraire les tâches sans dépendre de js-yaml
function extractTasksFromYaml(content) {
  try {
    // Extraction simple des tâches depuis le YAML
    const tasksMatch = content.match(/tasks:([\s\S]*?)(?:\n\w|$)/);

    if (!tasksMatch) return {};

    const tasksContent = tasksMatch[1];
    const taskLines = tasksContent.split('\n');

    const tasks = {};
    let currentTask = null;
    const _description = '';

    for (const line of taskLines) {
      // Nouvelle tâche
      const taskMatch = line.match(/^\s{2}(\w+):/);
      if (taskMatch) {
        currentTask = taskMatch[1];
        tasks[currentTask] = { desc: '' };
        continue;
      }

      // Description de la tâche
      const descMatch = line.match(/^\s{4}desc:\s*(.+)/);
      if (descMatch && currentTask) {
        tasks[currentTask].desc = descMatch[1].replace(/^['"]|['"]$/g, '');
      }
    }

    return tasks;
  } catch (error) {
    console.error('Erreur lors du parsing du contenu YAML:', error.message);
    return {};
  }
}

// Fonctions d'aide
function readTaskfile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { tasks: extractTasksFromYaml(content) };
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error.message);
    return null;
  }
}

// Mapping des commandes Taskfile -> NX (déjà migrées)
const COMMAND_MAPPING = {
  setup: 'pnpm run setup',
  migrate: 'pnpm run migrate:file',
  'migrate:analyze': 'pnpm run migrate:analyze',
  'migrate:batch': 'pnpm run migrate:batch',
  audit: 'pnpm run audit',
  'audit:code': 'nx run audit --configuration=code',
  'audit:temporal': 'nx run audit --configuration=temporal',
  'audit:seo': 'nx run seo --configuration=audit',
  'audit:performance': 'nx run audit --configuration=performance',
  'docker:up': 'pnpm run docker:up',
  'docker:down': 'pnpm run docker:down',
  'docker:restart': 'pnpm run docker:restart',
  'docker:logs': 'pnpm run docker:logs',
  'ci:check': 'nx affected --base=origin/main --head=HEAD',
  test: 'pnpm run test',
  lint: 'pnpm run lint',
  'n8n:start': 'pnpm run n8n:start',
  'n8n:import': 'pnpm run n8n:setup',
  dev: 'pnpm run dev',
  build: 'pnpm run affected:build',
  'build:check': 'nx affected:build --dry-run',
  'generate:manifest': 'nx run agents --configuration=register',
  'register:agents': 'pnpm run agent:register',
  // Nouvelles commandes migrées
  default: 'pnpm run default',
  docker: 'pnpm run docker:logs',
  ci: 'pnpm run ci',
  n8n: 'pnpm run n8n',
  generate: 'pnpm run generate',
  register: 'pnpm run register',
  'agents:run': 'pnpm run agents:run',
  'agents:orchestrator': 'pnpm run agents:orchestrator',
  'agents:list': 'pnpm run agents:list',
  'agents:status': 'pnpm run agents:status',
  'ci:lint': 'pnpm run ci:lint',
  'ci:test': 'pnpm run ci:test',
  'ci:build': 'pnpm run ci:build',
  'ci:deploy': 'pnpm run ci:deploy',
  'seo:audit': 'pnpm run seo:audit',
  'seo:report': 'pnpm run seo:report',
};

function getPackageJsonScripts() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON, 'utf-8');
    const packageJson = JSON.parse(content);
    return packageJson.scripts || {};
  } catch (error) {
    console.error('Erreur lors de la lecture du package.json:', error.message);
    return {};
  }
}

function getAllTaskfileCommands() {
  const commands = {};

  // Lire le Taskfile principal
  if (fs.existsSync(TASKFILE_MAIN)) {
    const content = fs.readFileSync(TASKFILE_MAIN, 'utf-8');
    const mainTaskfile = { tasks: extractTasksFromYaml(content) };

    if (mainTaskfile?.tasks) {
      for (const [name, task] of Object.entries(mainTaskfile.tasks)) {
        commands[name] = {
          description: task.desc || '',
          source: 'Taskfile.yaml',
          migrated: COMMAND_MAPPING.hasOwnProperty(name),
          replacement: COMMAND_MAPPING[name] || null,
        };
      }
    }
  } else {
    console.log(`Le fichier ${TASKFILE_MAIN} n'existe pas.`);
  }

  // Lire les fichiers Taskfile inclus
  if (fs.existsSync(TASKFILE_DIR)) {
    const files = fs
      .readdirSync(TASKFILE_DIR)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
      const filePath = path.join(TASKFILE_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const taskfile = { tasks: extractTasksFromYaml(content) };

      if (taskfile?.tasks) {
        const namespace = file.replace(/\.ya?ml$/, '').toLowerCase();

        for (const [name, task] of Object.entries(taskfile.tasks)) {
          const fullName = `${namespace}:${name}`;
          commands[fullName] = {
            description: task.desc || '',
            source: `tasks/${file}`,
            migrated: COMMAND_MAPPING.hasOwnProperty(fullName),
            replacement: COMMAND_MAPPING[fullName] || null,
          };
        }
      }
    }
  } else {
    console.log(`Le répertoire ${TASKFILE_DIR} n'existe pas.`);
  }

  return commands;
}

// Génération du rapport de migration
function generateMigrationReport(commands) {
  let report = '# Rapport de migration de Taskfile vers NX\n\n';

  // Statistiques
  const total = Object.keys(commands).length;
  const migrated = Object.values(commands).filter((c) => c.migrated).length;
  const percentage = total > 0 ? Math.round((migrated / total) * 100) : 0;

  report += '## Progression de la migration\n\n';
  report += `- **Total des commandes Taskfile**: ${total}\n`;
  report += `- **Commandes migrées vers NX**: ${migrated}\n`;
  report += `- **Progression**: ${percentage}%\n\n`;

  // Commandes migrées
  report += '## Commandes déjà migrées\n\n';
  report += '| Commande Taskfile | Commande NX équivalente | Source |\n';
  report += '|-----------------|---------------------|--------|\n';

  for (const [name, info] of Object.entries(commands)) {
    if (info.migrated) {
      report += `| \`${name}\` | \`${info.replacement}\` | ${info.source} |\n`;
    }
  }

  // Commandes à migrer
  report += '\n## Commandes restantes à migrer\n\n';
  report += '| Commande Taskfile | Description | Source |\n';
  report += '|-----------------|-------------|--------|\n';

  for (const [name, info] of Object.entries(commands)) {
    if (!info.migrated) {
      report += `| \`${name}\` | ${info.description} | ${info.source} |\n`;
    }
  }

  // Prochaines étapes
  report += '\n## Prochaines étapes\n\n';
  report += '1. Migrer les commandes restantes vers NX\n';
  report += '2. Mettre à jour le mapping dans ce script (COMMAND_MAPPING)\n';
  report += '3. Exécuter à nouveau ce script pour générer un rapport mis à jour\n';
  report += '4. Lorsque toutes les commandes sont migrées, supprimer les fichiers Taskfile\n';

  return report;
}

// Fonction principale
function main() {
  console.log('Analyse des commandes Taskfile...');
  const commands = getAllTaskfileCommands();

  console.log(`${Object.keys(commands).length} commandes Taskfile trouvées.`);

  const report = generateMigrationReport(commands);
  const reportPath = path.join(__dirname, '..', 'taskfile-migration-report.md');

  fs.writeFileSync(reportPath, report);
  console.log(`Rapport de migration généré: ${reportPath}`);

  // Vérifier si toutes les commandes sont migrées
  const allMigrated = Object.values(commands).every((c) => c.migrated);

  if (allMigrated) {
    console.log('✅ Toutes les commandes Taskfile ont été migrées vers NX!');
    console.log('Vous pouvez maintenant supprimer en toute sécurité:');
    console.log(`- ${TASKFILE_MAIN}`);
    console.log(`- ${TASKFILE_DIR}`);
  } else {
    const remaining = Object.values(commands).filter((c) => !c.migrated).length;
    console.log(`⚠️ Il reste ${remaining} commandes Taskfile à migrer.`);
    console.log('Consultez le rapport pour plus de détails.');
  }
}

main();
