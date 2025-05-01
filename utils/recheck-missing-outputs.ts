/**
 * Script de vérification et re-déclenchement des audits manquants
 *
 * Ce script:
 * 1. Utilise validate-audit-outputs.ts pour identifier les fichiers d'audit manquants
 * 2. Lance automatiquement des audits pour les fichiers manquants
 * 3. Génère un rapport de correction
 */

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { validateAuditOutputs } from './validate-audit-outputs';

// Configuration
const CONFIG = {
  generateAuditScript: '../scripts/generate-audit.js',
  sourceFilesDir: './src',
  phpSourcePattern: '**/*.php',
  outputDir: './reports/recheck',
  recheckReportFile: './reports/recheck_report.json',
};

interface RecheckReport {
  timestamp: string;
  successful: string[];
  failed: string[];
  notFound: string[];
}

/**
 * Fonction principale
 */
export async function recheckMissingOutputs(
  options: { force: boolean; verbose: boolean } = { force: false, verbose: false }
): Promise<RecheckReport> {
  console.log(chalk.blue("🔍 Vérification des fichiers d'audit manquants..."));

  // 1. Exécuter la validation des fichiers d'audit
  const validationReport = await validateAuditOutputs({ verbose: options.verbose, autoFix: false });

  // 2. Filtrer les fichiers manquants que nous pouvons re-traiter
  const missingAudits = validationReport.missingFiles.filter((item) =>
    item.missingTypes.includes('audit.md')
  );

  const missingBacklogs = validationReport.missingFiles.filter((item) =>
    item.missingTypes.includes('backlog.json')
  );

  const missingImpactGraphs = validationReport.missingFiles.filter((item) =>
    item.missingTypes.includes('impact_graph.json')
  );

  console.log(chalk.yellow(`→ Audits manquants: ${missingAudits.length}`));
  console.log(chalk.yellow(`→ Backlogs manquants: ${missingBacklogs.length}`));
  console.log(chalk.yellow(`→ Graphes d'impact manquants: ${missingImpactGraphs.length}`));

  if (
    !options.force &&
    missingAudits.length === 0 &&
    missingBacklogs.length === 0 &&
    missingImpactGraphs.length === 0
  ) {
    console.log(chalk.green('✅ Aucun fichier manquant à retraiter.'));
    return {
      timestamp: new Date().toISOString(),
      successful: [],
      failed: [],
      notFound: [],
    };
  }

  // 3. Trouver les fichiers source associés
  const sourceFiles = await findSourceFiles(validationReport.missingFiles);

  // 4. Re-exécuter les audits manquants
  const recheckReport: RecheckReport = {
    timestamp: new Date().toISOString(),
    successful: [],
    failed: [],
    notFound: [],
  };

  for (const item of validationReport.missingFiles) {
    const slug = extractSlugFromPath(item.sourcePath);
    const sourceFile = sourceFiles.find((file) => file.includes(slug));

    if (!sourceFile) {
      console.log(chalk.red(`❌ Fichier source introuvable pour: ${slug}`));
      recheckReport.notFound.push(slug);
      continue;
    }

    console.log(chalk.blue(`🔄 Re-génération des audits pour: ${sourceFile}`));

    try {
      // Exécuter le script de génération d'audit
      const result = cp.execSync(
        `node ${CONFIG.generateAuditScript} --file=${sourceFile} --no-pr`,
        { encoding: 'utf8' }
      );

      if (options.verbose) {
        console.log(chalk.gray(result));
      }

      console.log(chalk.green(`✅ Audit régénéré avec succès: ${sourceFile}`));
      recheckReport.successful.push(sourceFile);
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la régénération de l'audit: ${error.message}`));
      recheckReport.failed.push(sourceFile);
    }
  }

  // 5. Enregistrer le rapport de re-traitement
  await saveRecheckReport(recheckReport);

  // 6. Afficher un résumé
  console.log(chalk.green('\n📊 Résumé de re-traitement:'));
  console.log(chalk.yellow(`→ Audits régénérés avec succès: ${recheckReport.successful.length}`));
  console.log(chalk.yellow(`→ Audits en échec: ${recheckReport.failed.length}`));
  console.log(chalk.yellow(`→ Fichiers source introuvables: ${recheckReport.notFound.length}`));

  // 7. Valider à nouveau pour voir si tous les problèmes sont résolus
  if (recheckReport.successful.length > 0) {
    console.log(chalk.blue('\n🔍 Vérification finale après re-traitement...'));
    await validateAuditOutputs({ verbose: false, autoFix: false });
  }

  return recheckReport;
}

/**
 * Recherche les fichiers source PHP correspondant aux slugs manquants
 */
async function findSourceFiles(
  missingFiles: Array<{ sourcePath: string; missingTypes: string[] }>
): Promise<string[]> {
  const slugs = missingFiles.map((item) => extractSlugFromPath(item.sourcePath));
  const glob = require('glob');

  // Rechercher tous les fichiers PHP
  const phpFiles = glob.sync(path.join(CONFIG.sourceFilesDir, CONFIG.phpSourcePattern));

  // Filtrer ceux qui correspondent aux slugs manquants
  return phpFiles.filter((file) => {
    const fileName = path.basename(file, '.php');
    return slugs.some((slug) => fileName.includes(slug) || slug.includes(fileName));
  });
}

/**
 * Extrait le slug à partir du chemin source
 */
function extractSlugFromPath(sourcePath: string): string {
  // Format attendu: "Source: nom-du-slug"
  const match = sourcePath.match(/Source: (.*)/);
  return match ? match[1].trim() : sourcePath;
}

/**
 * Enregistre le rapport de re-traitement
 */
async function saveRecheckReport(report: RecheckReport): Promise<void> {
  // Créer le répertoire de sortie s'il n'existe pas
  const outputDir = path.dirname(CONFIG.recheckReportFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Écrire le rapport JSON
  fs.writeFileSync(CONFIG.recheckReportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(chalk.green(`📝 Rapport de re-traitement enregistré: ${CONFIG.recheckReportFile}`));
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const options = {
      force: process.argv.includes('--force') || process.argv.includes('-f'),
      verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    };

    await recheckMissingOutputs(options);
  })();
}
