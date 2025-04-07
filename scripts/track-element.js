#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Configuration des arguments
const argv = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    description: 'ID de la configuration de suivi',
    type: 'string',
    demandOption: true
  })
  .help()
  .alias('help', 'h')
  .argv;

// Fonction pour formater les logs
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '\x1b[34mINFO\x1b[0m',    // Bleu
    success: '\x1b[32mOK\x1b[0m',   // Vert
    warning: '\x1b[33mWARN\x1b[0m',  // Jaune
    error: '\x1b[31mERROR\x1b[0m'   // Rouge
  };
  
  console.log(`[${timestamp}] ${prefix[type] || prefix.info} [Tracker] ${message}`);
  
  // Écrire également dans le fichier de log
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(
    path.join(logDir, 'element-tracker.log'),
    `[${timestamp}] [${type.toUpperCase()}] [${argv.config}] ${message}\n`
  );
}

// Charger la configuration
function loadConfig(configId) {
  const configPath = path.join(process.cwd(), 'config', 'tracking', `${configId}.json`);
  
  if (!fs.existsSync(configPath)) {
    log(`Configuration non trouvée: ${configPath}`, 'error');
    process.exit(1);
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    log(`Erreur lors de la lecture de la configuration: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Mettre à jour le cahier des charges
function updateCahierDesCharges(config, changedFile) {
  log(`Mise à jour du cahier des charges suite à la modification de ${changedFile}`, 'info');
  
  try {
    // Ajouter une note de mise à jour automatique au CDC
    const cdcFile = path.join(process.cwd(), config.cdc_file);
    
    if (fs.existsSync(cdcFile)) {
      const cdcContent = fs.readFileSync(cdcFile, 'utf8');
      const updateNote = `\n\n> [!NOTE]\n> Mise à jour automatique suite à la modification de \`${changedFile}\` - ${new Date().toISOString()}`;
      
      // Trouver la section correspondante
      const sectionRegex = new RegExp(`### (Module |Stratégie |Workflow |)${config.name}`, 'i');
      const updatedContent = cdcContent.replace(
        sectionRegex,
        (match) => `${match}${updateNote}`
      );
      
      fs.writeFileSync(cdcFile, updatedContent);
      log(`Cahier des charges mis à jour: ${config.cdc_file}`, 'success');
    }
    
    // Mettre à jour le changelog
    const changelogFile = path.join(process.cwd(), 'cahier-des-charges', 'changelog.md');
    const changelogEntry = `\n## ${new Date().toLocaleDateString()} - Mise à jour ${config.type}: ${config.name}\n`;
    const changelogDetail = `- Mise à jour automatique suite à des modifications dans \`${changedFile}\`\n`;
    
    fs.appendFileSync(changelogFile, changelogEntry + changelogDetail);
    log(`Changelog mis à jour`, 'success');
    
    // Exécuter le script de mise à jour du cahier des charges si disponible
    if (fs.existsSync(path.join(process.cwd(), 'update-cahier.sh'))) {
      execSync('./update-cahier.sh');
      log(`Script update-cahier.sh exécuté`, 'success');
    }
  } catch (error) {
    log(`Erreur lors de la mise à jour du cahier des charges: ${error.message}`, 'error');
  }
}

// Mettre à jour les fichiers de suivi
function updateTrackingFile(config, changedFile) {
  try {
    const trackingFile = path.join(process.cwd(), 'logs', 'tracking-elements.json');
    
    if (fs.existsSync(trackingFile)) {
      const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
      const timestamp = new Date().toISOString();
      
      // Trouver l'élément dans le fichier de suivi
      const elementIndex = trackingData.elements.findIndex(e => 
        e.type === config.type && e.name === config.name
      );
      
      if (elementIndex >= 0) {
        // Ajouter le fichier modifié à la liste des fichiers techniques
        const technicalFiles = trackingData.elements[elementIndex].technical_files || [];
        if (!technicalFiles.includes(changedFile)) {
          technicalFiles.push(changedFile);
        }
        
        // Mettre à jour l'élément
        trackingData.elements[elementIndex] = {
          ...trackingData.elements[elementIndex],
          last_updated: timestamp,
          technical_files: technicalFiles,
          status: 'updated'
        };
        
        // Mettre à jour le fichier de suivi
        trackingData.last_updated = timestamp;
        fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
        log(`Fichier de suivi mis à jour`, 'success');
      }
    }
  } catch (error) {
    log(`Erreur lors de la mise à jour du fichier de suivi: ${error.message}`, 'error');
  }
}

// Fonction principale
async function main() {
  log(`Démarrage du suivi pour la configuration: ${argv.config}`, 'info');
  const config = loadConfig(argv.config);
  
  log(`Élément à suivre: ${config.type} "${config.name}"`, 'info');
  log(`Chemins surveillés: ${config.watch_paths.join(', ')}`, 'info');
  
  // Configurer le watcher
  const watcher = chokidar.watch(config.watch_paths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });
  
  // Gérer les événements de modification de fichiers
  watcher
    .on('add', (filepath) => {
      log(`Nouveau fichier détecté: ${filepath}`, 'info');
      updateCahierDesCharges(config, filepath);
      updateTrackingFile(config, filepath);
    })
    .on('change', (filepath) => {
      log(`Fichier modifié: ${filepath}`, 'info');
      updateCahierDesCharges(config, filepath);
      updateTrackingFile(config, filepath);
    })
    .on('unlink', (filepath) => {
      log(`Fichier supprimé: ${filepath}`, 'warning');
    })
    .on('error', (error) => {
      log(`Erreur lors du suivi: ${error.message}`, 'error');
    });
  
  log(`Suivi démarré - En attente de modifications...`, 'success');
}

// Gérer les signaux d'arrêt
process.on('SIGINT', () => {
  log('Suivi interrompu par l'utilisateur', 'warning');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Suivi terminé', 'warning');
  process.exit(0);
});

// Exécuter le script
main().catch((error) => {
  log(`Erreur fatale: ${error.message}`, 'error');
  process.exit(1);
});
