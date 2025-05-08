/**
 * Script de nettoyage final des fichiers de workflows obsolètes
 * 
 * Ce script vérifie que tous les workflows standardisés fonctionnent correctement,
 * puis supprime les fichiers obsolètes si la vérification réussit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des dossiers et fichiers
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backup/obsolete-files-20250505');
const REPORT_DIR = path.join(PROJECT_ROOT, 'cleanup-report');

const OBSOLETE_FILES = [
  // Structure obsolète de workflows
  path.join(PROJECT_ROOT, 'packages/business/workflows/temporal'),

  // Anciens workflows AI maintenant consolidés
  path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-consolidated.workflow.ts'),
  path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-pipeline.workflow.ts'),

  // Fichiers d'analyse PHP obsolètes (ajoutés depuis cleanup_obsolete_workflows.sh)
  path.join(PROJECT_ROOT, 'packages/business/workflows/01-php-analyzer.json'),
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/php-analyzer.json'),
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/s-lection-intelligente-des-fichiers-php.json'),
  path.join(PROJECT_ROOT, 'packages/business/config/n8n-php-analyzer-webhook.json'),
  path.join(PROJECT_ROOT, 'packages/business/config/n8n-php-complexity-alerts.json'),
  path.join(PROJECT_ROOT, 'packages/business/config/php-analyzer-pipelinen8n.json'),

  // Fichiers d'audit obsolètes (ajoutés depuis cleanup_obsolete_workflows.sh)
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/v-rification-qualit--du-code.json'),
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/pipeline-d-audit-multi-agents.json'),
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/audit-validator.json'),
  path.join(PROJECT_ROOT, 'packages/business/workflows/extracted/audit-quality-metrics.json'),
  path.join(PROJECT_ROOT, 'packages/business/templates/n8n-audit-workflow.json'),
  path.join(PROJECT_ROOT, 'packages/business/config/n8n-audit-analyzer-workflow.json')
];

// Vérifiez que les nouveaux workflows standards existent
const STANDARD_WORKFLOWS = [
  path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/php-migration.workflow.ts'),
  path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-standard.workflow.ts')
];

// Dossiers à exclure lors de la recherche de références
const EXCLUDE_DIRS = [
  'node_modules',
  'backup',
  'cleanup-scripts',  // Ignorer les références dans les scripts de nettoyage
];

// Modèles à rechercher dans les fichiers pour vérifier les références résiduelles
const PATTERNS_TO_CHECK = [
  // Rechercher des imports ou des références explicites, en excluant les commentaires
  'import.*from [\'"].*ai-migration-consolidated\\.workflow[\'"]',
  'import.*from [\'"].*ai-migration-pipeline\\.workflow[\'"]',
  'import.*from [\'"].*workflows/temporal/php-migration\\.workflow[\'"]',
  'import.*from [\'"].*business/workflows/temporal/',
  'client\\.workflow\\.start\\([\'"]aiMigrationPipelineWorkflow[\'"]',
  'client\\.workflow\\.start\\([\'"]aiMigrationConsolidatedWorkflow[\'"]',
  'client\\.workflow\\.start\\([\'"]PhpToNestJsMigrationWorkflow[\'"]',
  'workflowType: [\'"]aiMigrationPipelineWorkflow[\'"]',
  'workflowType: [\'"]aiMigrationConsolidatedWorkflow[\'"]',
  'workflowType: [\'"]PhpToNestJsMigrationWorkflow[\'"]',
];

// Patterns à ignorer car ce sont des faux positifs (noms d'API, variables, etc.)
const IGNORE_PATTERNS = [
  '/ai-migration/',
  'router.post',
  'router.get',
  'aiMigrationRouter',
  'const workflowId = `ai-migration-',
  'const workflowId = `php-',
  'pipelineType',
  ': \'ai-migration\''  // Spécifique à la variable pipelineType
];

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Fonction pour rechercher des motifs dans les fichiers avec une expression régulière
function searchPatternsInFiles() {
  console.log('Recherche de références résiduelles aux workflows obsolètes...');

  let found = false;
  const excludeDirsArg = EXCLUDE_DIRS.map(dir => `--exclude-dir="${dir}"`).join(' ');

  // Utiliser grep avec des expressions régulières pour rechercher les modèles
  for (const pattern of PATTERNS_TO_CHECK) {
    try {
      const result = execSync(
        `grep -r -E "${pattern}" --include="*.ts" --include="*.js" ${excludeDirsArg} ${PROJECT_ROOT}`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      ).toString();

      if (result.trim()) {
        console.log(`⚠️ Références trouvées à "${pattern}":`);
        console.log(result);
        found = true;
      }
    } catch (error) {
      // grep renvoie un code d'erreur si aucune correspondance n'est trouvée
      // Nous ignorons cette erreur car c'est le comportement attendu
    }
  }

  // Vérifier spécifiquement les références dynamiques qui pourraient être manquées
  try {
    const result = execSync(
      `grep -r "ai-migration" --include="*.ts" --include="*.js" ${excludeDirsArg} ${PROJECT_ROOT} | grep -v "ai-migration-standard"`,
      { stdio: ['pipe', 'pipe', 'ignore'] }
    ).toString();

    // Filtrer les résultats pour exclure les commentaires et les faux positifs
    const lines = result.split('\n').filter(line => {
      // Ignorer les lignes vides ou les commentaires
      if (!line.trim() || line.includes('//') || line.includes('*') || line.includes('cleanup')) {
        return false;
      }

      // Ignorer les faux positifs (noms d'API, variables, etc.)
      return !IGNORE_PATTERNS.some(pattern => line.includes(pattern));
    });

    if (lines.length > 0) {
      console.log(`⚠️ Références potentielles à d'anciens workflows trouvées:`);
      console.log(lines.join('\n'));
      found = true;
    }
  } catch (error) {
    // Ignorer les erreurs de grep
  }

  return found;
}

// Fonction pour vérifier les importations statiques
function verifyStandardWorkflows() {
  console.log('Vérification des workflows standards...');

  // Vérifier que tous les workflows standards existent
  for (const workflow of STANDARD_WORKFLOWS) {
    if (!fileExists(workflow)) {
      console.error(`❌ Workflow standard manquant: ${workflow}`);
      return false;
    }
  }

  return true;
}

// Fonction pour créer une copie de sauvegarde des fichiers
function backupFile(filePath) {
  // Ne pas sauvegarder si le fichier n'existe pas
  if (!fileExists(filePath)) {
    return;
  }

  // Créer le chemin de sauvegarde
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);

  // Créer les dossiers parents si nécessaire
  const backupDir = path.dirname(backupPath);
  if (!fileExists(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Si c'est un dossier, on utilise cp -r
  if (fs.lstatSync(filePath).isDirectory()) {
    try {
      execSync(`cp -r "${filePath}" "${backupPath}"`);
      console.log(`📦 Dossier sauvegardé: ${relativePath}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde du dossier ${relativePath}:`, error.message);
    }
  } else {
    // Si c'est un fichier, on utilise fs.copyFileSync
    try {
      fs.copyFileSync(filePath, backupPath);
      console.log(`📦 Fichier sauvegardé: ${relativePath}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde du fichier ${relativePath}:`, error.message);
    }
  }
}

// Fonction pour supprimer un fichier ou un dossier
function removeFileOrDir(filePath) {
  // Ne pas supprimer si le fichier n'existe pas
  if (!fileExists(filePath)) {
    return;
  }

  const relativePath = path.relative(PROJECT_ROOT, filePath);

  try {
    // Si c'est un dossier, on utilise rm -rf
    if (fs.lstatSync(filePath).isDirectory()) {
      execSync(`rm -rf "${filePath}"`);
      console.log(`🗑️ Dossier supprimé: ${relativePath}`);
    } else {
      // Si c'est un fichier, on utilise fs.unlinkSync
      fs.unlinkSync(filePath);
      console.log(`🗑️ Fichier supprimé: ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de ${relativePath}:`, error.message);
  }
}

// Fonction principale
async function main() {
  console.log('=== Script de nettoyage final des workflows obsolètes ===');
  console.log('Date: ' + new Date().toISOString());
  console.log('\n1. Vérification des prérequis...');

  // Vérifier que les dossiers existent
  if (!fileExists(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Dossier de sauvegarde créé: ${path.relative(PROJECT_ROOT, BACKUP_DIR)}`);
  }

  if (!fileExists(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    console.log(`📁 Dossier de rapport créé: ${path.relative(PROJECT_ROOT, REPORT_DIR)}`);
  }

  // Vérifier que les workflows standards existent
  const workflowsExist = verifyStandardWorkflows();
  if (!workflowsExist) {
    console.error('\n❌ Les workflows standards n\'existent pas ou sont incomplets.');
    console.error('Veuillez exécuter les scripts de standardisation et consolidation d\'abord.');
    process.exit(1);
  }

  console.log('✅ Les workflows standards existent.');

  // Vérifier s'il reste des références aux anciens workflows
  console.log('\n2. Vérification des références aux anciens workflows...');
  const referencesFound = searchPatternsInFiles();

  if (referencesFound) {
    console.error('\n⚠️ Des références aux anciens workflows ont été trouvées.');
    console.error('Veuillez mettre à jour ces références avant de continuer.');

    // Écrire un rapport des références trouvées
    const reportPath = path.join(REPORT_DIR, 'references-obsoletes.md');
    fs.writeFileSync(reportPath, `# Références obsolètes trouvées\n\nDate: ${new Date().toISOString()}\n\nDes références aux anciens workflows ont été trouvées. Veuillez les mettre à jour avant de continuer.\n\n`);

    console.log(`Rapport de références obsolètes créé: ${path.relative(PROJECT_ROOT, reportPath)}`);
    process.exit(1);
  }

  console.log('✅ Aucune référence importante aux anciens workflows n\'a été trouvée.');

  // Demander confirmation avant de continuer
  console.log('\n3. Sauvegarde des fichiers obsolètes...');

  // Sauvegarder tous les fichiers obsolètes
  for (const file of OBSOLETE_FILES) {
    backupFile(file);
  }

  console.log('\n4. Suppression des fichiers obsolètes...');

  // Mode simulation par défaut sauf si --force est spécifié
  const isForced = process.argv.includes('--force');

  if (!isForced) {
    console.log('\n⚠️ Mode simulation activé: aucun fichier ne sera supprimé.');
    console.log('Pour supprimer réellement les fichiers, exécutez avec l\'option --force');
    console.log('Exemple: node cleanup-scripts/clean-obsolete-workflow-files.js --force');

    // Liste des fichiers qui seraient supprimés
    console.log('\nFichiers qui seraient supprimés:');
    for (const file of OBSOLETE_FILES) {
      if (fileExists(file)) {
        console.log(`- ${path.relative(PROJECT_ROOT, file)}`);
      }
    }
  } else {
    // Supprimer tous les fichiers obsolètes
    for (const file of OBSOLETE_FILES) {
      removeFileOrDir(file);
    }

    console.log('\n✅ Nettoyage terminé avec succès!');
    console.log('Les fichiers obsolètes ont été supprimés et sauvegardés dans le dossier backup.');

    // Créer un rapport de nettoyage
    const reportPath = path.join(REPORT_DIR, 'rapport-nettoyage-workflows.md');
    fs.writeFileSync(reportPath, `# Rapport de nettoyage des workflows obsolètes\n\nDate: ${new Date().toISOString()}\n\nLe nettoyage des workflows a été effectué avec succès. Les fichiers suivants ont été supprimés et sauvegardés dans le dossier backup:\n\n${OBSOLETE_FILES.map(f => `- ${path.relative(PROJECT_ROOT, f)}`).join('\n')}\n\n`);

    console.log(`Rapport de nettoyage créé: ${path.relative(PROJECT_ROOT, reportPath)}`);
  }
}

main().catch(error => {
  console.error('Une erreur est survenue:', error);
  process.exit(1);
});