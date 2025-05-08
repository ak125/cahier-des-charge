#!/usr/bin/env ts-node

/**
 * Script pour tester l'agent QA-Analyzer dans la nouvelle architecture
 *
 * Ce script permet de vérifier si l'agent QA-Analyzer implémente correctement
 * l'interface AbstractAnalyzerAgent et s'intègre dans la pipeline CI/CD.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
// Correction du chemin d'importation pour utiliser le chemin relatif correct
import { QAAnalyzer } from '../../agents/qa-analyzer';

// CI integration imports
import { execSync } from 'child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Interface de contexte minimale pour les tests
 */
interface MinimalAgentContext {
  getConfig: () => Record<string, any>;
  logger: Console;
}

// Arguments pour le mode CI et les options de test
const argv = yargs(hideBin(process.argv))
  .option('ci', {
    type: 'boolean',
    default: false,
    description: 'Exécuter en mode CI'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: 'test-results/qa-analyzer',
    description: 'Répertoire de sortie pour les résultats'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    description: 'Mode verbeux'
  })
  .option('coverage', {
    type: 'boolean',
    default: true,
    description: 'Générer un rapport de couverture'
  })
  .help()
  .argv;

/**
 * Fonction pour tester un agent QA-Analyzer
 */
async function testQAAnalyzer() {
  // Utiliser le répertoire de sortie spécifié ou un temporaire si on est en mode CI
  const outputDir = argv.ci
    ? path.join(process.cwd(), argv.output)
    : '/tmp';

  // Créer le répertoire de sortie s'il n'existe pas
  await fs.ensureDir(outputDir);

  const sourcePhpPath = path.join(outputDir, 'example.php');
  const generatedFiles = {
    component: path.join(outputDir, 'example.tsx'),
    loader: path.join(outputDir, 'example.loader.ts'),
  };

  // Créer des fichiers temporaires pour le test
  await fs.writeFile(
    sourcePhpPath,
    `<?php\n// Example PHP file\n$name = $_GET['name'];\necho "Hello, $name";\n?>`
  );
  await fs.writeFile(
    generatedFiles.component,
    'export default function Example() { return <div>Hello</div>; }'
  );
  await fs.writeFile(
    generatedFiles.loader,
    'export async function loader() { return { name: "World" }; }'
  );

  console.log('Fichiers de test créés dans', outputDir);

  // Créer une instance de l'agent
  const analyzer = new QAAnalyzer(sourcePhpPath, generatedFiles, {
    outputDir,
    verbose: argv.verbose,
  });

  console.log('Agent créé. Propriétés requises:');
  console.log(`- id: ${analyzer.id}`);
  console.log(`- name: ${analyzer.name}`);
  console.log(`- version: ${analyzer.version}`);
  console.log(`- description: ${analyzer.description}`);

  // Créer un contexte minimal
  const context: MinimalAgentContext = {
    getConfig: () => ({ outputDir }),
    logger: console,
  };

  const results = {
    initialization: false,
    execution: false,
    cleanup: false,
    overall: false,
  };

  // Tester l'initialisation
  console.log("\nInitialisation de l'agent...");
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    await analyzer.initialize(context);
    console.log('✅ Initialisation réussie!');
    results.initialization = true;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    if (argv.ci) {
      // En mode CI, on écrit les erreurs dans un fichier pour analyse ultérieure
      await fs.writeFile(
        path.join(outputDir, 'initialization-error.log'),
        `${error.message}\n${error.stack}`
      );
    }
  }

  // Tester l'exécution
  console.log("\nExécution de l'agent...");
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    const executionResult = await analyzer.execute(context);
    console.log('✅ Exécution réussie!');
    results.execution = true;

    // En mode CI, on enregistre les résultats d'exécution
    if (argv.ci) {
      await fs.writeJSON(
        path.join(outputDir, 'execution-result.json'),
        executionResult || { status: 'success', timestamp: new Date().toISOString() }
      );
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de l'exécution:", error.message);
    if (argv.ci) {
      await fs.writeFile(
        path.join(outputDir, 'execution-error.log'),
        `${error.message}\n${error.stack}`
      );
    }
  }

  // Tester le nettoyage
  console.log("\nNettoyage de l'agent...");
  try {
    await analyzer.cleanup();
    console.log('✅ Nettoyage réussi!');
    results.cleanup = true;
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    if (argv.ci) {
      await fs.writeFile(
        path.join(outputDir, 'cleanup-error.log'),
        `${error.message}\n${error.stack}`
      );
    }
  }

  // Si on n'est pas en mode CI, supprimer les fichiers temporaires
  if (!argv.ci) {
    await fs.remove(sourcePhpPath);
    await fs.remove(generatedFiles.component);
    await fs.remove(generatedFiles.loader);
    console.log('\nFichiers temporaires supprimés.');
  } else {
    console.log('\nFichiers de test conservés dans', outputDir);
  }

  // Calculer le résultat global
  results.overall = results.initialization && results.execution && results.cleanup;

  // En mode CI, générer un rapport de résultat
  if (argv.ci) {
    const reportPath = path.join(outputDir, 'test-report.json');
    await fs.writeJSON(reportPath, {
      agent: 'qa-analyzer',
      version: analyzer.version,
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: true
      }
    });

    console.log(`Rapport de test écrit dans ${reportPath}`);

    // Générer un badge de statut pour GitHub
    const badgeColor = results.overall ? 'success' : 'critical';
    const badgeText = results.overall ? 'passing' : 'failing';
    const badgeUrl = `https://img.shields.io/badge/qa--analyzer-${badgeText}-${badgeColor}`;

    await fs.writeFile(
      path.join(outputDir, 'badge.txt'),
      badgeUrl
    );

    // Si option coverage activée, générer un rapport de couverture
    if (argv.coverage) {
      try {
        console.log('\nGénération du rapport de couverture...');
        execSync(`npx istanbul cover --report=json-summary --report=html --dir=${outputDir}/coverage ${process.argv[1]}`, {
          stdio: 'inherit'
        });
      } catch (error) {
        console.warn('⚠️ Impossible de générer le rapport de couverture');
      }
    }
  }

  return results.overall;
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log("=== Test de l'agent QA-Analyzer ===\n");

  // Si en mode CI, afficher plus d'informations
  if (argv.ci) {
    console.log(`📊 Mode: CI`);
    console.log(`📂 Répertoire de sortie: ${argv.output}`);
    console.log(`🔍 Mode verbeux: ${argv.verbose ? 'Oui' : 'Non'}`);
    console.log(`🧪 Couverture: ${argv.coverage ? 'Activée' : 'Désactivée'}`);
    console.log(`🔄 Node version: ${process.version}`);
    console.log(`💻 Plateforme: ${process.platform}`);
    console.log(`\n---\n`);
  }

  try {
    const success = await testQAAnalyzer();

    if (argv.ci) {
      // En mode CI, on sort avec un code d'erreur approprié
      process.exit(success ? 0 : 1);
    }
  } catch (error: any) {
    console.error('Erreur critique lors du test:', error.message);

    if (argv.ci) {
      // En mode CI, on écrit l'erreur et on sort avec un code d'erreur
      fs.writeFileSync(
        path.join(argv.output, 'critical-error.log'),
        `${error.message}\n${error.stack}`
      );
      process.exit(1);
    }
  }
}

// Exécuter le script
main()
  .then(() => console.log('\nTest terminé.'))
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
