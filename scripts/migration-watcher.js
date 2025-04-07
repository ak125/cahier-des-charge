#!/usr/bin/env node

/**
 * Script de surveillance des fichiers migrés pour générer automatiquement les fichiers d'audit
 * 
 * Ce script surveille un répertoire pour détecter les fichiers nouvellement migrés
 * et génère automatiquement des fichiers d'audit correspondants
 */

const chokidar = require('chokidar');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs').promises;
const yaml = require('js-yaml');

// Configuration
let config;
const CONFIG_PATH = path.resolve(__dirname, '../config/audit-config.yml');

// Fonction principale
async function main() {
  try {
    console.log(chalk.blue('🔍 Démarrage de la surveillance des fichiers migrés...'));
    
    // Charger la configuration
    config = await loadConfig();
    
    // Déterminer les répertoires à surveiller
    const watchDirs = config.watch?.directories || ['src'];
    const watchPatterns = watchDirs.map(dir => path.resolve(process.cwd(), dir, '**/*.{ts,js}'));
    
    console.log(chalk.blue(`📂 Surveillance des répertoires: ${watchDirs.join(', ')}`));
    
    // Configurer le watcher
    const watcher = chokidar.watch(watchPatterns, {
      persistent: true,
      ignoreInitial: false,
      ignored: ['**/node_modules/**', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    // Événement "add" pour les nouveaux fichiers
    watcher.on('add', (filePath) => handleNewFile(filePath));
    
    // Événement "change" pour les fichiers modifiés
    watcher.on('change', (filePath) => handleFileChange(filePath));
    
    // Événement "error"
    watcher.on('error', (error) => {
      console.error(chalk.red(`❌ Erreur du watcher: ${error}`));
    });
    
    console.log(chalk.green('✅ Surveillance démarrée! En attente de fichiers migrés...'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Charge la configuration depuis un fichier YAML
 */
async function loadConfig() {
  try {
    const configFile = await fs.readFile(CONFIG_PATH, 'utf8');
    const config = yaml.load(configFile);
    
    // Ajouter les valeurs par défaut si nécessaire
    config.watch = config.watch || {};
    config.watch.directories = config.watch.directories || ['src'];
    config.watch.migrationMarkers = config.watch.migrationMarkers || [
      '@MigrationComplete',
      '// Migration complete',
      '// Generated from legacy code'
    ];
    
    return config;
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Erreur lors du chargement de la configuration: ${error.message}`));
    console.warn(chalk.yellow('Utilisation de la configuration par défaut'));
    
    return {
      watch: {
        directories: ['src'],
        migrationMarkers: [
          '@MigrationComplete',
          '// Migration complete',
          '// Generated from legacy code'
        ]
      }
    };
  }
}

/**
 * Traite un nouveau fichier
 */
async function handleNewFile(filePath) {
  try {
    // Ignorer les fichiers d'audit
    if (filePath.endsWith('.audit.md')) {
      return;
    }
    
    // Vérifier si le fichier d'audit existe déjà
    const auditPath = filePath.replace(/\.[^/.]+$/, '.audit.md');
    try {
      await fs.access(auditPath);
      // Fichier d'audit existe déjà, ignorer
      return;
    } catch (error) {
      // Fichier d'audit n'existe pas, continuer
    }
    
    // Vérifier si c'est un fichier migré
    const isMigrated = await checkIfMigratedFile(filePath);
    if (!isMigrated) {
      return;
    }
    
    console.log(chalk.blue(`📄 Fichier migré détecté: ${filePath}`));
    
    // Générer le fichier d'audit
    await generateAuditFile(filePath);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du traitement du fichier ${filePath}: ${error.message}`));
  }
}

/**
 * Traite un fichier modifié
 */
async function handleFileChange(filePath) {
  try {
    // Ignorer les fichiers d'audit
    if (filePath.endsWith('.audit.md')) {
      return;
    }
    
    // Vérifier si c'est un fichier nouvellement migré
    const isMigrated = await checkIfMigratedFile(filePath);
    if (!isMigrated) {
      return;
    }
    
    // Vérifier si le fichier d'audit existe déjà
    const auditPath = filePath.replace(/\.[^/.]+$/, '.audit.md');
    try {
      await fs.access(auditPath);
      // Fichier d'audit existe déjà, ignorer
      return;
    } catch (error) {
      // Fichier d'audit n'existe pas, continuer
    }
    
    console.log(chalk.blue(`📄 Fichier migré modifié: ${filePath}`));
    
    // Générer le fichier d'audit
    await generateAuditFile(filePath);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du traitement du fichier ${filePath}: ${error.message}`));
  }
}

/**
 * Vérifie si un fichier est un fichier migré
 */
async function checkIfMigratedFile(filePath) {
  try {
    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf8');
    
    // Vérifier si le contenu contient des marqueurs de migration
    for (const marker of config.watch.migrationMarkers) {
      if (content.includes(marker)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la vérification du fichier ${filePath}: ${error.message}`));
    return false;
  }
}

/**
 * Génère un fichier d'audit
 */
async function generateAuditFile(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'generate-audit.js');
    
    console.log(chalk.blue(`🔄 Génération du fichier d'audit pour: ${filePath}`));
    
    // Exécuter le script de génération d'audit
    const generateProcess = spawn('node', [scriptPath, '--file', filePath], {
      stdio: 'inherit'
    });
    
    generateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ Fichier d'audit généré avec succès pour: ${filePath}`));
        resolve();
      } else {
        console.error(chalk.red(`❌ Erreur lors de la génération du fichier d'audit pour: ${filePath}`));
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    generateProcess.on('error', (error) => {
      console.error(chalk.red(`❌ Erreur lors du lancement du processus: ${error.message}`));
      reject(error);
    });
  });
}

// Exécuter le script
main();
