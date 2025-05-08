#!/usr/bin/env node

/**
 * Script de versionnement programmé
 *
 * Ce script est conçu pour être exécuté via cron ou une autre tâche planifiée
 * afin de créer automatiquement des versions du cahier des charges selon un calendrier.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');

// Configuration
const CONFIG_PATH = path.join(process.cwd(), 'config', 'versioning.yml');
const LOG_PATH = path.join(process.cwd(), 'logs', 'versioning.log');

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('⏰ Versionnement programmé du cahier des charges'));

    // Vérifier si le versionnement programmé est activé
    const config = await loadConfig();

    if (!config.triggers || !config.triggers.scheduled) {
      console.log(chalk.yellow('⚠️ Versionnement programmé désactivé dans la configuration'));
      await appendToLog('Versionnement programmé désactivé dans la configuration');
      process.exit(0);
    }

    // Exécuter le gestionnaire de versions avec les options appropriées
    console.log(chalk.blue("🔄 Création d'une version programmée..."));

    const cmdOptions = [
      '--message "Version programmée automatique"',
      '--increment patch',
      '--trigger scheduled',
    ].join(' ');

    try {
      execSync(`node scripts/version-manager.js ${cmdOptions}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      console.log(chalk.green('✅ Version programmée créée avec succès'));
      await appendToLog('Version programmée créée avec succès');
    } catch (error) {
      // Si aucune version n'est créée (pas assez de changements), ce n'est pas une erreur
      if (error.stdout?.includes('Pas assez de changements')) {
        console.log(chalk.yellow('ℹ️ Pas assez de changements pour créer une version programmée'));
        await appendToLog('Pas assez de changements pour créer une version programmée');
      } else {
        console.error(chalk.red(`❌ Erreur lors de la création de la version: ${error.message}`));
        await appendToLog(`Erreur: ${error.message}`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    await appendToLog(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Charge la configuration
 */
async function loadConfig() {
  try {
    const yaml = require('js-yaml');
    const configFile = await fs.readFile(CONFIG_PATH, 'utf8');
    return yaml.load(configFile);
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Erreur lors du chargement de la configuration: ${error.message}`));
    return {};
  }
}

/**
 * Ajoute une entrée au journal
 */
async function appendToLog(message) {
  try {
    // Créer le répertoire de logs s'il n'existe pas
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });

    // Ajouter l'entrée au journal
    const timestamp = new Date().toISOString();
    await fs.appendFile(LOG_PATH, `[${timestamp}] ${message}\n`, 'utf8');
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'écriture dans le journal: ${error.message}`));
  }
}

// Exécuter le script
main();
