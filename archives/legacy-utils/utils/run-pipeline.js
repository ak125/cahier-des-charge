#!/usr/bin/env node

/**
 * Script d'orchestration pour le pipeline de migration
 * Intègre l'agent de prévisualisation
 */

const { execSync } = require('child_processstructure-agent');
const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');
const chalk = require('chalkstructure-agent');

// Configuration
const config = {
  migration: {
    enablePreview: process.env.ENABLE_PREVIEW === 'true' || true,
    previewReadyStatus: 'ready',
    autoDeployPreview: true,
  },
};

// Fonctions d'utilitaires
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: chalk.blue('ℹ️'),
    success: chalk.green('✓'),
    warning: chalk.yellow('⚠️'),
    error: chalk.red('✖'),
  }[type];

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, silent = false) {
  try {
    if (!silent) {
      log(`Exécution de la commande: ${command}`);
    }
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`Erreur lors de l'exécution de la commande: ${command}`, 'error');
    log(error.message, 'error');
    return null;
  }
}

// Orchestrateur principal
async function orchestrate() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'help':
      showHelp();
      break;

    case 'pipeline':
      runPipeline();
      break;

    case 'preview': {
      const prNumber = args[1];
      const branchName = args[2] || `pr-${prNumber}`;

      if (!prNumber) {
        log('Numéro de PR requis pour la prévisualisation', 'error');
        console.log('Usage: node run-pipeline.js preview <PR_NUMBER> [BRANCH_NAME]');
        process.exit(1);
      }

      runPreview(prNumber, branchName);
      break;
    }

    case 'migration':
      runMigration();
      break;

    case 'cleanup':
      runCleanup();
      break;

    default:
      log(`Commande inconnue: ${command}`, 'error');
      showHelp();
      process.exit(1);
  }
}

// Affiche l'aide
function showHelp() {
  console.log(`
${chalk.bold('Pipeline de Migration AI')}

${chalk.bold('Usage:')}
  node run-pipeline.js <command> [options]

${chalk.bold('Commandes:')}
  ${chalk.yellow('help')}                   Affiche cette aide
  ${chalk.yellow('pipeline')}               Exécute le pipeline complet
  ${chalk.yellow('migration')}              Exécute uniquement la migration
  ${chalk.yellow('preview <PR_NUMBER>')}    Génère une prévisualisation pour une PR
  ${chalk.yellow('cleanup')}                Nettoie les ressources temporaires

${chalk.bold('Exemples:')}
  node run-pipeline.js preview 42
  node run-pipeline.js preview 42 feature-branch
  `);
}

// Exécute le pipeline complet
function runPipeline() {
  log('Démarrage du pipeline complet', 'info');

  // 1. Exécuter la migration
  runMigration();

  // 2. Si une PR a été créée et que la prévisualisation est activée
  const prInfoPath = path.join(process.cwd(), 'migration-results.json');

  if (fs.existsSync(prInfoPath)) {
    try {
      const migrationResults = JSON.parse(fs.readFileSync(prInfoPath, 'utf8'));

      if (migrationResults.pullRequest?.number && config.migration.enablePreview) {
        const prNumber = migrationResults.pullRequest.number;
        const branchName = migrationResults.pullRequest.branch || `pr-${prNumber}`;

        log(`Migration terminée, démarrage de la prévisualisation pour PR #${prNumber}`, 'success');
        runPreview(prNumber, branchName);
      }
    } catch (error) {
      log(`Erreur lors de la lecture des résultats de migration: ${error.message}`, 'error');
    }
  }

  log('Pipeline terminé', 'success');
}

// Exécute la migration
function runMigration() {
  log('Démarrage de la migration', 'info');

  try {
    // Exécuter le script de migration n8n
    runCommand('npm run n8n:migrate');
    log('Migration terminée avec succès', 'success');
  } catch (error) {
    log(`Erreur lors de la migration: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Génère une prévisualisation pour une PR
async function runPreview(prNumber, branchName) {
  log(`Génération de la prévisualisation pour PR #${prNumber} (branche: ${branchName})`, 'info');

  try {
    // Vérifier si typescript et ts-node sont installés
    try {
      runCommand('npx ts-node --version', true);
    } catch (_error) {
      log('Installation de ts-node...', 'info');
      runCommand('npm install -g ts-node typescript');
    }

    // Exécuter l'agent de prévisualisation
    const result = runCommand(`npx ts-node agents/devops-preview.ts ${prNumber} ${branchName}`);

    if (result) {
      log(`Prévisualisation générée avec succès pour PR #${prNumber}`, 'success');

      // Vérifier si une URL a été générée
      const previewUrlPath = path.join(
        process.cwd(),
        '.preview',
        `fiche-${prNumber}`,
        'preview_url.txt'
      );

      if (fs.existsSync(previewUrlPath)) {
        const previewUrl = fs.readFileSync(previewUrlPath, 'utf8').trim();
        log(`URL de prévisualisation: ${chalk.green(previewUrl)}`, 'info');
      }
    } else {
      log(`Erreur lors de la génération de la prévisualisation pour PR #${prNumber}`, 'error');
    }
  } catch (error) {
    log(`Erreur lors de la prévisualisation: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Nettoie les ressources
function runCleanup() {
  log('Nettoyage des ressources temporaires', 'info');

  // Nettoyer les environnements de prévisualisation plus vieux que 7 jours
  try {
    runCommand(
      `find .preview -type d -name "fiche-*" -mtime +7 -exec rm -rf {} \\; 2>/dev/null || true`
    );
    log('Nettoyage terminé', 'success');
  } catch (error) {
    log(`Erreur lors du nettoyage: ${error.message}`, 'warning');
  }

  // Si Docker est disponible, nettoyer les conteneurs de prévisualisation abandonnés
  try {
    runCommand(
      'docker ps -a --filter "name=preview-" --format "{{.Names}}" | xargs -r docker rm -f'
    );
    log('Conteneurs de prévisualisation nettoyés', 'success');
  } catch (error) {
    log(`Erreur lors du nettoyage des conteneurs: ${error.message}`, 'warning');
  }
}

// Point d'entrée
orchestrate().catch((error) => {
  log(`Erreur non gérée: ${error.message}`, 'error');
  process.exit(1);
});
