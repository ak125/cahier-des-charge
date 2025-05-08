#!/usr/bin/env node

/**
 * Script de compatibilité pour faciliter la transition de Taskfile vers NX
 *
 * Ce script intercepte les commandes Taskfile et les redirige vers leurs équivalents NX
 * Usage : node task-to-nx-bridge.js [taskfile_command]
 * Exemple : node task-to-nx-bridge.js agents:run -- diff-verifier
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Mapping des commandes Taskfile vers leurs équivalents NX
const taskToNxMapping = {
  // Agents
  'agents:run': 'nx run agents:run',
  'agents:ci-tester': 'nx run agents:ci-tester',
  'agents:diff-verifier': 'nx run agents:diff-verifier',
  'agents:auto-pr': 'nx run agents:auto-pr',
  'agents:orchestrator': 'nx run agents:orchestrator',
  'agents:bullmq-orchestrator': 'nx run agents:bullmq-orchestrator',
  'agents:dev-integrator': 'nx run agents:dev-integrator',
  'agents:dev-linter': 'nx run agents:dev-linter',
  'agents:list': 'nx run agents:list',
  'agents:status': 'nx run agents:status',
  'agents:register': 'nx run agents:register',
  'agents:verify': 'nx run agents:verify',

  // CI
  'ci:check': 'nx run ci:check',
  'ci:lint': 'nx run ci:lint',
  'ci:test': 'nx run ci:test',
  'ci:build': 'nx run ci:build',
  'ci:deploy': 'nx run ci:deploy',

  // SEO
  'seo:audit': 'nx run seo:audit',
  'seo:fix': 'nx run seo:fix',
  'seo:report': 'nx run seo:report',

  // Docker
  'docker:up': 'nx run docker:up',
  'docker:down': 'nx run docker:down',
  'docker:restart': 'nx run docker:restart',
  'docker:logs': 'nx run docker:logs',

  // Workflow
  'n8n:start': 'nx run workflow:n8n-start',
  'n8n:import': 'nx run workflow:n8n-import',
  'n8n:stop': 'nx run workflow:n8n-stop',
  'temporal:start': 'nx run workflow:temporal-start',
  'temporal:status': 'nx run workflow:temporal-status',
  'temporal:list': 'nx run workflow:temporal-list',

  // Audit
  audit: 'nx run audit',
  'audit:code': 'nx run audit:code',
  'audit:temporal': 'nx run audit:temporal',
  'audit:seo': 'nx run audit:seo',
  'audit:performance': 'nx run audit:performance',

  // Migrate
  migrate: 'nx run migrate',
  'migrate:analyze': 'nx run migrate:analyze',
  'migrate:batch': 'nx run migrate:batch',
  'migrate:status': 'nx run migrate:status',

  // Others
  setup: 'nx setup',
  dev: 'nx dev',
  test: 'nx test',
  'tasks:list': 'nx run tasks:list',
};

function displayHelp() {
  console.log('\n🔄 Task-to-NX Bridge - Outil de transition');
  console.log('=======================================');
  console.log('Ce script permet de convertir les commandes Taskfile en commandes NX équivalentes.');
  console.log('\nUsage: node task-to-nx-bridge.js [taskfile_command]');
  console.log('Exemple: node task-to-nx-bridge.js agents:run -- diff-verifier');
  console.log('\nCommandes disponibles:');

  const categories = {};
  Object.keys(taskToNxMapping).forEach((taskCommand) => {
    const category = taskCommand.split(':')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(taskCommand);
  });

  Object.keys(categories)
    .sort()
    .forEach((category) => {
      console.log(`\n${category.toUpperCase()}`);
      categories[category].sort().forEach((cmd) => {
        console.log(`  ${cmd} -> ${taskToNxMapping[cmd]}`);
      });
    });

  console.log(
    '\n📝 Note: Si vous utilisez des options ou des arguments supplémentaires, placez-les après -- '
  );
  console.log(
    'Exemple: node task-to-nx-bridge.js agents:run -- diff-verifier --file=src/controller/UserController.ts'
  );
  console.log(
    '\n⚠️  Ce script de compatibilité est temporaire pour faciliter la transition vers NX.'
  );
  console.log("   Il est recommandé d'utiliser directement les commandes NX à terme.");
}

function parseCommandArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    displayHelp();
    process.exit(0);
  }

  const taskCommand = args[0];

  if (!taskToNxMapping[taskCommand]) {
    console.log(`⚠️  Commande Taskfile inconnue: ${taskCommand}`);
    console.log(
      'Exécutez "node task-to-nx-bridge.js --help" pour voir la liste des commandes disponibles.'
    );
    process.exit(1);
  }

  const nxCommand = taskToNxMapping[taskCommand];
  const additionalArgs = args.slice(1);

  // Si les arguments supplémentaires commencent par --, nous les prenons à partir du deuxième élément
  let finalArgs = additionalArgs;
  if (additionalArgs.length > 0 && additionalArgs[0] === '--') {
    finalArgs = additionalArgs.slice(1);
  }

  return {
    nxCommand,
    additionalArgs: finalArgs,
  };
}

function executeNxCommand(nxCommand, additionalArgs) {
  console.log(
    `🔄 Conversion: task ${process.argv.slice(2).join(' ')} -> ${nxCommand} ${additionalArgs.join(
      ' '
    )}`
  );

  // Vérifier si NX est disponible
  try {
    const nxPath = path.join(process.cwd(), 'node_modules', '.bin', 'nx');
    if (!fs.existsSync(nxPath)) {
      console.log("⚠️  NX n'est pas installé localement. Utilisation de npx nx comme alternative.");
      nxCommand = nxCommand.replace('nx', 'npx nx');
    }
  } catch (_error) {
    console.log(
      "⚠️  Impossible de vérifier l'installation de NX. Utilisation de npx nx comme alternative."
    );
    nxCommand = nxCommand.replace('nx', 'npx nx');
  }

  const parts = nxCommand.split(' ');
  const command = parts[0];
  const args = [...parts.slice(1), ...additionalArgs];

  const result = spawnSync(command, args, { stdio: 'inherit' });

  return result.status;
}

// Point d'entrée principal
function main() {
  const { nxCommand, additionalArgs } = parseCommandArgs();
  const exitCode = executeNxCommand(nxCommand, additionalArgs);
  process.exit(exitCode);
}

main();
