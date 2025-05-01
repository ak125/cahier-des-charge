/**
 * organize-project.js - Script pour organiser et unifier la structure du projet
 * Version: 3.0 - Réécriture complète en JavaScript pour intégration avec NX
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const _util = require('util');

// Utilitaires pour le formatage des messages
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Variables globales
const startTime = Date.now();
const logFile = `logs/reorganize-${new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\..+/, '')}.log`;
let successCount = 0;
let errorCount = 0;

// Dossiers à ignorer lors des opérations
const ignoreDirs =
  /node_modules|dist|\.git|\.cache|\.vscode|coverage|build|dashboard\/node_modules|\.bak/;

// Création du dossier logs s'il n'existe pas
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Fonctions d'affichage des messages avec formatage et journalisation
function log(message, type = 'INFO', color = colors.blue) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `${color}[${type}]${colors.reset} ${message}`;
  console.log(formattedMessage);

  // Journalisation dans le fichier (sans les codes couleur)
  fs.appendFileSync(logFile, `[${timestamp}] [${type}] ${message}\n`);
}

function logInfo(message) {
  log(message, 'INFO', colors.blue);
}

function logSuccess(message) {
  log(message, 'SUCCÈS', colors.green);
  successCount++;
}

function logWarning(message) {
  log(message, 'ATTENTION', colors.yellow);
}

function logError(message) {
  log(message, 'ERREUR', colors.red);
  errorCount++;
}

// Fonction pour afficher une bannière
function showBanner() {
  console.log(`${colors.magenta}${colors.bold}`);
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                                                      ║');
  console.log('║       🚀 Réorganisation du Projet - v3.0             ║');
  console.log(`║       Date: ${new Date().toLocaleDateString()}                        ║`);
  console.log('║                                                      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  console.log(`Logs: ${logFile}`);
  console.log('');
}

// Fonction pour créer une sauvegarde avant modifications
function createBackup() {
  const backupName = `backup-${new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')}.tar.gz`;
  logInfo("Création d'une sauvegarde du projet avant réorganisation...");

  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }

  try {
    // Exécution de la commande tar pour créer une archive
    execSync(
      `tar --exclude="./node_modules" --exclude="./.git" --exclude="./backups" --exclude="./dist" --exclude="./dashboard/node_modules" -czf "backups/${backupName}" .`
    );
    logSuccess(`Sauvegarde créée avec succès: backups/${backupName}`);
    return true;
  } catch (error) {
    logError(`Échec de la création de la sauvegarde: ${error.message}`);
    return false;
  }
}

// Fonction pour vérifier l'intégrité de la structure du projet
function verifyStructure() {
  logInfo("Vérification de l'intégrité de la structure du projet...");
  let errors = 0;

  const essentialDirs = ['docs', 'agents', 'scripts', 'config'];

  for (const dir of essentialDirs) {
    if (!fs.existsSync(dir)) {
      logError(`Le dossier ${dir} n'existe pas ou n'a pas été créé correctement`);
      errors++;
    }
  }

  if (errors === 0) {
    logSuccess('La structure du projet est correcte');
    return true;
  }
  logError(`${errors} problème(s) détecté(s) dans la structure du projet`);
  return false;
}

// Fonction pour nettoyer les fichiers temporaires et dupliqués
function cleanProject() {
  logInfo('Nettoyage des fichiers temporaires et dupliqués...');

  try {
    // Recherche et suppression des fichiers temporaires
    const tempFileRegex = /\.(bak|tmp|~)$/;
    const files = getAllFiles('.');

    for (const file of files) {
      if (tempFileRegex.test(file) && !ignoreDirs.test(file)) {
        fs.unlinkSync(file);
        logInfo(`  - Suppression: ${file}`);
      }
    }

    logSuccess('Nettoyage des fichiers temporaires terminé');
  } catch (error) {
    logError(`Erreur lors du nettoyage des fichiers: ${error.message}`);
  }
}

// Fonction utilitaire pour récupérer tous les fichiers de façon récursive
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !ignoreDirs.test(filePath)) {
      getAllFiles(filePath, fileList);
    } else if (stat.isFile()) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Fonction pour générer un rapport de structure du projet
function generateStructureReport() {
  const reportFile = `docs/rapports/structure-projet-${new Date().toISOString().slice(0, 10)}.md`;

  logInfo("Génération d'un rapport de structure du projet...");

  if (!fs.existsSync('docs/rapports')) {
    fs.mkdirSync('docs/rapports', { recursive: true });
  }

  try {
    let report = '# Rapport de structure du projet\n';
    report += `Date: ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}\n\n`;
    report += '## Arborescence des dossiers\n\n```\n';

    // Génération de l'arborescence des dossiers
    function listDirs(dir, prefix = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !ignoreDirs.test(path.join(dir, entry.name))) {
          report += `${prefix}${entry.name}/\n`;
          listDirs(path.join(dir, entry.name), `${prefix}  `);
        }
      }
    }

    listDirs('.');
    report += '```\n\n';

    // Statistiques des fichiers
    report += '## Statistiques des fichiers\n\n';
    report += '| Type de fichier | Nombre |\n';
    report += '|---------------|--------|\n';

    const extensions = ['.js', '.ts', '.sh', '.json', '.md', '.html'];

    for (const ext of extensions) {
      const count = getAllFiles('.').filter(
        (file) => file.endsWith(ext) && !ignoreDirs.test(file)
      ).length;
      report += `| ${ext} | ${count} |\n`;
    }

    fs.writeFileSync(reportFile, report);
    logSuccess(`Rapport généré: ${reportFile}`);
    return true;
  } catch (error) {
    logError(`Erreur lors de la génération du rapport: ${error.message}`);
    return false;
  }
}

// Fonction pour organiser les dossiers de documentation
function organizeDocs() {
  logInfo('📚 Consolidation de la documentation...');

  const dirs = ['docs/cahier-des-charges', 'docs/specifications', 'docs/rapports', 'docs/pipeline'];

  // Création des dossiers nécessaires
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`  - Dossier créé: ${dir}`);
    }
  }

  // Copie des fichiers si les dossiers existent
  if (fs.existsSync('cahier-des-charges')) {
    copyDir('cahier-des-charges', 'docs/cahier-des-charges');
    logSuccess('  - cahier-des-charges → docs/cahier-des-charges/');
  }

  if (fs.existsSync('cahier')) {
    copyDir('cahier', 'docs/specifications');
    logSuccess('  - cahier → docs/specifications/');
  }

  // Organisation des fichiers markdown à la racine
  const markdownFiles = fs
    .readdirSync('.')
    .filter(
      (file) =>
        file.endsWith('.md') && !['README.md', 'CHANGELOG.md', 'STRUCTURE.md'].includes(file)
    );

  for (const file of markdownFiles) {
    fs.copyFileSync(file, path.join('docs', file));
    fs.unlinkSync(file);
    logSuccess(`  - ${file} → docs/`);
  }
}

// Fonction utilitaire pour copier un répertoire
function copyDir(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// Fonction pour organiser les scripts
function organizeScripts() {
  logInfo('📜 Organisation des scripts...');

  const scriptFolders = [
    'scripts/migration',
    'scripts/verification',
    'scripts/generation',
    'scripts/maintenance',
    'scripts/utility',
  ];

  // Création des dossiers nécessaires
  for (const dir of scriptFolders) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`  - Dossier créé: ${dir}`);
    }
  }

  // Liste des scripts à déplacer par catégorie
  const scriptMappings = {
    'scripts/migration': [
      'run-progressive-migration.sh',
      'run-audit.ts',
      'assembler-agent.ts',
      'import-workflows.js',
      'import-agents.js',
    ],
    'scripts/verification': [
      'verify-reorganization.sh',
      'check-consistency.sh',
      'continuous-improvement.sh',
    ],
    'scripts/generation': [
      'create-section.sh',
      'enrich-cahier.sh',
      'reorganize-cahier.sh',
      'create-pipeline.sh',
    ],
    'scripts/maintenance': ['export-files.sh', 'update-user.js'],
    'scripts/utility': ['fix-agent-imports.sh', 'complete-reorganization.sh', 'final-cleanup.sh'],
  };

  // Déplacement des scripts
  for (const [dir, files] of Object.entries(scriptMappings)) {
    for (const file of files) {
      if (fs.existsSync(file)) {
        const destPath = path.join(dir, file);
        fs.copyFileSync(file, destPath);
        fs.unlinkSync(file);
        logSuccess(`  - ${file} → ${destPath}`);
      }
    }
  }

  // Déplacement des fichiers Python générateurs
  const pythonGenerators = fs
    .readdirSync('.')
    .filter((file) => file.startsWith('generate_') && file.endsWith('.py'));

  for (const file of pythonGenerators) {
    const destPath = path.join('scripts/generation', file);
    fs.copyFileSync(file, destPath);
    fs.unlinkSync(file);
    logSuccess(`  - ${file} → scripts/generation/`);
  }

  // Déplacement des scripts update-*
  const updateScripts = fs
    .readdirSync('.')
    .filter((file) => file.startsWith('update-') && file.endsWith('.sh'));

  for (const file of updateScripts) {
    const destPath = path.join('scripts/maintenance', file);
    fs.copyFileSync(file, destPath);
    fs.unlinkSync(file);
    logSuccess(`  - ${file} → scripts/maintenance/`);
  }
}

// Fonction pour organiser les workflows n8n
function organizeWorkflows() {
  logInfo('Organisation des workflows n8n...');

  const workflowFolders = ['workflows/migration', 'workflows/analysis', 'workflows/automation'];

  // Création des dossiers nécessaires
  for (const dir of workflowFolders) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`  - Dossier créé: ${dir}`);
    }
  }

  // Déplacement des fichiers n8n.json
  const n8nFiles = fs.readdirSync('.').filter((file) => file.endsWith('.n8n.json'));

  for (const file of n8nFiles) {
    const destPath = path.join('workflows', file);
    fs.copyFileSync(file, destPath);
    fs.unlinkSync(file);
    logSuccess(`  - ${file} → workflows/`);
  }

  // Catégorisation plus fine des workflows
  if (fs.existsSync('workflows/migration_pipeline.n8n.json')) {
    fs.renameSync(
      'workflows/migration_pipeline.n8n.json',
      'workflows/migration/migration_pipeline.n8n.json'
    );
    logSuccess('  - migration_pipeline.n8n.json → workflows/migration/');
  }

  if (fs.existsSync('workflows/n8n-mysql-analyzer.json')) {
    fs.renameSync(
      'workflows/n8n-mysql-analyzer.json',
      'workflows/analysis/n8n-mysql-analyzer.json'
    );
    logSuccess('  - n8n-mysql-analyzer.json → workflows/analysis/');
  }
}

// Fonction pour configurer les agents
function setupAgents() {
  logInfo('Configuration des agents...');

  const agentFolders = ['agents/core', 'agents/analysis', 'agents/migration', 'agents/quality'];

  // Création des dossiers nécessaires
  for (const dir of agentFolders) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`  - Dossier créé: ${dir}`);
    }
  }

  // Copie des fichiers de configuration pour les agents
  if (fs.existsSync('config/audit-config.yml') && fs.existsSync('agents/analysis')) {
    fs.copyFileSync('config/audit-config.yml', 'agents/analysis/audit-config.yml');
    logSuccess('  - config/audit-config.yml → agents/analysis/');
  }

  if (fs.existsSync('config/reliability-config.md') && fs.existsSync('agents/quality')) {
    fs.copyFileSync('config/reliability-config.md', 'agents/quality/reliability-config.md');
    logSuccess('  - config/reliability-config.md → agents/quality/');
  }
}

// Fonction pour synchroniser les configurations
function syncConfigs() {
  logInfo('Synchronisation des fichiers de configuration...');

  const configFolders = ['config/env', 'config/defaults'];

  // Création des dossiers nécessaires
  for (const dir of configFolders) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`  - Dossier créé: ${dir}`);
    }
  }

  // Détection et déplacement des fichiers de configuration
  const configFiles = fs.readdirSync('.').filter((file) => file.includes('.config.'));

  for (const file of configFiles) {
    const destPath = path.join('config', file);
    fs.copyFileSync(file, destPath);
    fs.unlinkSync(file);
    logSuccess(`  - ${file} → config/`);
  }

  // Création d'un fichier de configuration par défaut si nécessaire
  if (!fs.existsSync('config/defaults/project-defaults.json')) {
    const defaultConfig = {
      projectName: 'cahier-des-charge',
      version: '1.0.0',
      organization: {
        docsFolder: 'docs',
        scriptsFolder: 'scripts',
        agentsFolder: 'agents',
        workflowsFolder: 'workflows',
      },
      settings: {
        autoBackup: true,
        backupInterval: 'daily',
        cleanupInterval: 'weekly',
      },
    };

    fs.writeFileSync(
      'config/defaults/project-defaults.json',
      JSON.stringify(defaultConfig, null, 2)
    );

    logSuccess('  - Création du fichier de configuration par défaut');
  }
}

// Fonction pour organiser les applications
function organizeApps() {
  logInfo('📱 Organisation des applications...');

  // Vérifier si le dossier apps existe déjà
  if (!fs.existsSync('apps')) {
    fs.mkdirSync('apps/frontend', { recursive: true });
    fs.mkdirSync('apps/mcp-server', { recursive: true });
    logSuccess('Structure apps/ créée');
  }

  // Déplacer le dashboard dans apps si nécessaire
  if (fs.existsSync('dashboard') && !fs.existsSync('apps/dashboard')) {
    fs.mkdirSync('apps/dashboard', { recursive: true });
    copyDir('dashboard', 'apps/dashboard');
    logSuccess('  - dashboard → apps/dashboard/ (copié)');
  }

  // Intégration des projets potentiellement indépendants
  if (fs.existsSync('projet-codespaces') && !fs.existsSync('apps/projet-codespaces')) {
    fs.mkdirSync('apps/projet-codespaces', { recursive: true });
    copyDir('projet-codespaces', 'apps/projet-codespaces');
    logSuccess('  - projet-codespaces → apps/projet-codespaces/ (copié)');
  }

  // S'assurer que tous les fichiers de configuration nécessaires sont présents
  const appDirs = fs
    .readdirSync('apps')
    .filter((dir) => fs.statSync(path.join('apps', dir)).isDirectory())
    .map((dir) => path.join('apps', dir));

  for (const appDir of appDirs) {
    if (!fs.existsSync(path.join(appDir, 'package.json')) && fs.existsSync('package.json')) {
      fs.copyFileSync('package.json', path.join(appDir, 'package.json'));
      logSuccess(`  - package.json → ${appDir} (copié)`);
    }
  }
}

// Fonction pour mettre à jour les références dans les fichiers
function updateReferences() {
  logInfo('📎 Mise à jour des références dans les fichiers...');

  let updatedCount = 0;

  // Parcourir les fichiers Markdown dans docs/
  if (fs.existsSync('docs')) {
    function processMarkdownFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          processMarkdownFiles(fullPath);
        } else if (entry.name.endsWith('.md')) {
          // Lire le contenu du fichier
          let content = fs.readFileSync(fullPath, 'utf8');
          const originalContent = content;

          // Mettre à jour les chemins relatifs
          content = content.replace(/\.\.\/cahier\//g, '../docs/specifications/');
          content = content.replace(/\.\.\/cahier-des-charges\//g, '../docs/cahier-des-charges/');
          content = content.replace(/"\.\/(?!\.)/g, '"../');

          // Écrire le contenu mis à jour si modifié
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            updatedCount++;
            logInfo(`  - Références mises à jour dans: ${fullPath}`);
          }
        }
      }
    }

    processMarkdownFiles('docs');
  }

  // Recherche de références dans les fichiers JS/TS
  ['src', 'apps'].forEach((rootDir) => {
    if (fs.existsSync(rootDir)) {
      function processCodeFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            processCodeFiles(fullPath);
          } else if (/\.(js|ts|tsx)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Vérifier s'il y a des imports relatifs
            if (content.includes("from '..") || content.includes('from "..')) {
              logWarning(`  - Vérifiez les imports relatifs dans: ${fullPath}`);
            }
          }
        }
      }

      processCodeFiles(rootDir);
    }
  });

  if (updatedCount > 0) {
    logSuccess(`  - ${updatedCount} fichiers ont eu leurs références mises à jour`);
  } else {
    logInfo("  - Aucune référence n'a été mise à jour");
  }
}

// Fonction pour générer un rapport de temps d'exécution
function reportExecutionTime() {
  const endTime = Date.now();
  const duration = endTime - startTime;

  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  console.log(`\n${colors.cyan}${colors.bold}=== Rapport d'exécution ===${colors.reset}`);
  console.log(`⏱️  Durée: ${minutes}m ${seconds}s`);
  console.log(`✅ Opérations réussies: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📝 Journal: ${logFile}`);

  // Ajouter le rapport au fichier log
  fs.appendFileSync(logFile, "\n=== Rapport d'exécution ===\n");
  fs.appendFileSync(logFile, `Durée: ${minutes}m ${seconds}s\n`);
  fs.appendFileSync(logFile, `Opérations réussies: ${successCount}\n`);
  fs.appendFileSync(logFile, `Erreurs: ${errorCount}\n`);
  fs.appendFileSync(logFile, `Terminé à: ${new Date().toISOString()}\n`);
}

// Fonction pour exécuter toutes les actions
function runAll() {
  logInfo('🚀 Démarrage de la réorganisation complète du projet cahier-des-charge');

  // Création d'une sauvegarde
  if (!createBackup()) {
    logError(
      'Échec de la sauvegarde. Arrêt de la réorganisation pour éviter les pertes de données.'
    );
    return;
  }

  // Création des dossiers principaux
  const mainFolders = [
    'backups',
    'docs/cahier-des-charges',
    'docs/specifications',
    'scripts/migration',
    'scripts/verification',
    'scripts/generation',
    'scripts/maintenance',
    'scripts/utility',
    'agents/core',
    'agents/analysis',
    'agents/migration',
    'agents/quality',
    'workflows/migration',
    'workflows/analysis',
    'workflows/automation',
    'config/env',
    'config/defaults',
  ];

  for (const dir of mainFolders) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Exécution des fonctions d'organisation
  organizeDocs();
  organizeScripts();
  organizeWorkflows();
  setupAgents();
  syncConfigs();
  organizeApps();
  cleanProject();
  generateStructureReport();
  updateReferences();

  // Vérification finale
  const structureOk = verifyStructure();

  if (structureOk) {
    logSuccess('✅ Réorganisation du projet terminée avec succès!');
  } else {
    logWarning(
      '⚠️ La réorganisation a été effectuée mais des problèmes ont été détectés dans la structure finale.'
    );
  }

  // Statistiques du projet
  if (fs.existsSync('docs')) {
    console.log(`\n${colors.green}Statistiques:${colors.reset}`);
    console.log(
      `- ${getAllFiles('docs').filter((f) => !ignoreDirs.test(f)).length} fichiers dans docs/`
    );
    console.log(
      `- ${getAllFiles('scripts').filter((f) => !ignoreDirs.test(f)).length} fichiers dans scripts/`
    );
    console.log(
      `- ${getAllFiles('agents').filter((f) => !ignoreDirs.test(f)).length} fichiers dans agents/`
    );
    console.log(
      `- ${
        getAllFiles('workflows').filter((f) => !ignoreDirs.test(f)).length
      } fichiers dans workflows/`
    );
    console.log(
      `- ${getAllFiles('config').filter((f) => !ignoreDirs.test(f)).length} fichiers dans config/`
    );
  }

  // Générer le rapport de temps d'exécution
  reportExecutionTime();
}

// Gestion des arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Sans arguments, afficher le menu interactif
    showInteractiveMenu();
    return;
  }

  switch (args[0]) {
    case '--all':
    case '-a':
      runAll();
      break;
    case '--backup':
    case '-b':
      createBackup();
      break;
    case '--docs':
    case '-d':
      organizeDocs();
      break;
    case '--scripts':
    case '-s':
      organizeScripts();
      break;
    case '--workflows':
    case '-w':
      organizeWorkflows();
      break;
    case '--agents':
      setupAgents();
      break;
    case '--clean':
    case '-c':
      cleanProject();
      break;
    case '--report':
    case '-r':
      generateStructureReport();
      break;
    case '--verify':
    case '-v':
      verifyStructure();
      break;
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      logError(`Option non reconnue: ${args[0]}`);
      showHelp();
      break;
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log('Usage: nx organize-project [OPTION]');
  console.log('Script pour organiser et unifier la structure du projet');
  console.log('');
  console.log('Options:');
  console.log('  --all, -a         Exécuter la réorganisation complète');
  console.log('  --backup, -b      Créer uniquement une sauvegarde');
  console.log('  --docs, -d        Organiser uniquement la documentation');
  console.log('  --scripts, -s     Organiser uniquement les scripts');
  console.log('  --workflows, -w   Organiser uniquement les workflows');
  console.log('  --agents          Configurer les agents');
  console.log('  --clean, -c       Nettoyer les fichiers temporaires');
  console.log('  --report, -r      Générer un rapport de structure');
  console.log("  --verify, -v      Vérifier l'intégrité de la structure");
  console.log('  --help, -h        Afficher cette aide');
}

// Fonction pour afficher un menu interactif
function showInteractiveMenu() {
  console.log(`\n${colors.blue}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║      MENU DE RÉORGANISATION DU PROJET        ║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════════╝${colors.reset}`);
  console.log('1) Exécuter la réorganisation complète');
  console.log('2) Créer uniquement une sauvegarde');
  console.log('3) Organiser uniquement la documentation');
  console.log('4) Organiser uniquement les scripts');
  console.log('5) Organiser uniquement les workflows');
  console.log('6) Configurer les agents');
  console.log('7) Nettoyer les fichiers temporaires');
  console.log('8) Générer un rapport de structure');
  console.log("9) Vérifier l'intégrité de la structure");
  console.log('0) Quitter');

  // En JavaScript Node.js, l'interface readline pourrait être utilisée ici
  // Mais pour simplifier, nous allons simplement exécuter runAll() dans ce cas
  console.log('\nMode interactif non disponible dans cette version JavaScript.');
  console.log(`Utilisation de l'option par défaut: Réorganisation complète`);
  runAll();
}

// Point d'entrée
showBanner();
parseArgs();
