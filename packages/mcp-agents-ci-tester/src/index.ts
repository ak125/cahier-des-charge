import fs from 'fs';
import path from 'path';
import {
  analyzePackageScripts,
  detectCITests,
  generateCIReport,
  generateGitHubWorkflow,
  validateSetup,
} from './core';
import { CIReport, CITest, CITesterConfig, CITesterOptions, PackageScripts } from './types';

/**
 * Point d'entrée principal pour exécuter l'agent CI-Tester
 */
export async function runCITester(options: CITesterOptions = {}): Promise<CIReport> {
  // Stocker les logs pour le rapport
  const logs: string[] = [];
  logs.push(`🚀 Démarrage de l'agent ci-tester - ${new Date().toISOString()}`);

  try {
    // Charger la configuration
    const config = await loadConfig(options.configPath);
    if (options.verbose) {
      logs.push(`📝 Configuration chargée: ${options.configPath || 'configuration par défaut'}`);
    }

    // Répertoire de sortie
    const outputPath = options.outputPath || config.outputPath || process.cwd();
    if (options.verbose) {
      logs.push(`📂 Répertoire de sortie: ${outputPath}`);
    }

    // Chemins de sortie des fichiers
    const outputWorkflowPath = path.join(
      outputPath,
      config.outputWorkflowPath || 'DoDoDoDoDoDotgithub/workflows/ci-migration.yml'
    );
    const outputReportPath = path.join(
      outputPath,
      config.outputReportPath || 'reports/ci_check_report.md'
    );
    const outputLastRunPath = path.join(
      outputPath,
      config.outputLastRunPath || 'reports/ci_last_run.json'
    );

    // Répertoire racine du projet
    const rootDir = config.rootDir || process.cwd();
    logs.push(`📁 Répertoire racine du projet: ${rootDir}`);

    // Chemin vers le package.json principal
    const packageJsonPath = config.packageJsonPath || path.join(rootDir, 'package.json');

    // Détecter les workspaces
    const workspacePackages = config.workspacePackages || (await detectWorkspaces(rootDir));

    // Mettre à jour la configuration
    config.rootDir = rootDir;
    config.packageJsonPath = packageJsonPath;
    config.workspacePackages = workspacePackages;
    config.outputWorkflowPath = outputWorkflowPath;
    config.outputReportPath = outputReportPath;
    config.outputLastRunPath = outputLastRunPath;

    // Liste des fichiers générés
    const generatedFiles: string[] = [];

    // Analyser les scripts dans les package.json
    logs.push('🔍 Analyse des scripts package.json...');
    const packageScripts = await analyzePackageScripts(config);
    logs.push(`📦 ${Object.keys(packageScripts).length} packages détectés avec des scripts`);

    // Détecter les tests CI
    logs.push('🧪 Détection des tests CI...');
    const detectedTests: CITest[] = detectCITests(packageScripts, config);

    // Ajouter les tests personnalisés depuis la configuration
    if (config.customTests && Array.isArray(config.customTests)) {
      logs.push(
        `⚙️ Ajout de ${config.customTests.length} tests personnalisés depuis la configuration`
      );
      detectedTests.push(...config.customTests);
    }

    logs.push(`✅ ${detectedTests.length} tests CI détectés au total`);

    // Afficher les tests détectés en mode verbose
    if (options.verbose) {
      logs.push('📋 Liste des tests détectés:');
      detectedTests.forEach((test: CITest) => {
        logs.push(`  - ${test.name}: ${test.command} (${test.required ? 'requis' : 'optionnel'})`);
      });
    }

    // Rapport initial
    const report: CIReport = {
      status: 'success',
      generatedFiles: [],
      packageScripts,
      detectedTests,
      customTests: config.customTests || [],
      timestamp: new Date().toISOString(),
      logs: [],
    };

    // Valider la configuration actuelle si demandé
    if (options.validateCurrentSetup) {
      logs.push('🔍 Validation de la configuration actuelle...');
      const validationResults = validateSetup(detectedTests, packageScripts);

      // Vérifier les tests requis manquants
      const missingRequired = validationResults.filter(
        (result: { present: boolean; test: CITest }) => !result.present && result.test.required
      );

      if (missingRequired.length > 0) {
        report.status = 'error';
        logs.push('❌ Tests requis manquants:');
        missingRequired.forEach((result: { test: CITest }) => {
          logs.push(`  - ${result.test.name}: ${result.test.command}`);
        });
      } else {
        logs.push('✅ Tous les tests requis sont configurés');

        // Vérifier les tests optionnels manquants
        const missingOptional = validationResults.filter(
          (result: { present: boolean; test: CITest }) => !result.present && !result.test.required
        );

        if (missingOptional.length > 0) {
          report.status = 'warning';
          logs.push('⚠️ Tests optionnels manquants:');
          missingOptional.forEach((result: { test: CITest }) => {
            logs.push(`  - ${result.test.name}: ${result.test.command}`);
          });
        } else {
          logs.push('✅ Tous les tests optionnels sont également configurés');
        }
      }
    }

    // Générer le fichier workflow GitHub Actions si demandé
    if (options.generateWorkflow) {
      logs.push('📝 Génération du fichier workflow GitHub Actions...');

      // Créer le répertoire parent s'il n'existe pas
      const workflowDir = path.dirname(outputWorkflowPath);
      if (!fs.existsSync(workflowDir)) {
        fs.mkdirSync(workflowDir, { recursive: true });
      }

      // Générer le contenu du workflow
      const workflowContent = generateGitHubWorkflow(detectedTests, config);

      // Écrire le fichier uniquement si ce n'est pas un dry run
      if (!options.dryRun) {
        fs.writeFileSync(outputWorkflowPath, workflowContent);
        logs.push(`✅ Fichier workflow généré: ${outputWorkflowPath}`);
        generatedFiles.push(outputWorkflowPath);
      } else {
        logs.push(`✅ [DRY RUN] Fichier workflow qui serait généré: ${outputWorkflowPath}`);
      }
    }

    // Exécuter un test local si demandé
    if (options.localTest) {
      logs.push('🧪 Exécution de tests CI locaux...');
      // Cette partie est implémentée dans local-validator.ts
      logs.push(
        'ℹ️ Utilisez plutôt la commande `npx @fafaDoDotmcp-agents-ci-tester local` pour une interface interactive'
      );
    }

    // Générer le rapport
    report.generatedFiles = generatedFiles;
    report.logs = logs;
    report.status =
      report.status === 'success'
        ? validateSetup(detectedTests, packageScripts).filter(
            (r: { test: CITest; present: boolean }) => r.test.required && r.present
          ).length
          ? 'success'
          : 'error'
        : report.status;

    if (!options.dryRun) {
      // Générer le rapport Markdown
      logs.push('📊 Génération du rapport CI...');
      await generateCIReport(report, logs, config);
      logs.push(`✅ Rapport généré: ${outputReportPath}`);
      generatedFiles.push(outputReportPath);

      // Sauvegarder les informations de la dernière exécution
      logs.push('💾 Sauvegarde des informations de dernière exécution...');
      const reportDir = path.dirname(outputLastRunPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      fs.writeFileSync(
        outputLastRunPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            status: report.status,
            filesGenerated: generatedFiles,
            testsDetected: detectedTests.length,
          },
          null,
          2
        )
      );

      logs.push(`✅ Informations sauvegardées: ${outputLastRunPath}`);
      generatedFiles.push(outputLastRunPath);
    } else {
      logs.push(`✅ [DRY RUN] Rapport qui serait généré: ${outputReportPath}`);
      logs.push(`✅ [DRY RUN] Informations qui seraient sauvegardées: ${outputLastRunPath}`);
    }

    // Mettre à jour le rapport avec la liste finale des fichiers générés
    report.generatedFiles = generatedFiles;

    // Terminer
    logs.push(`🏁 Agent ci-tester terminé - ${new Date().toISOString()}`);

    return report;
  } catch (error: any) {
    logs.push(`❌ Erreur lors de l'exécution de l'agent ci-tester: ${error.message}`);
    return {
      status: 'error',
      generatedFiles: [],
      packageScripts: {},
      detectedTests: [],
      customTests: [],
      timestamp: new Date().toISOString(),
      logs,
    };
  }
}

/**
 * Charge la configuration depuis un fichier
 */
async function loadConfig(configPath?: string): Promise<CITesterConfig> {
  // Configuration par défaut
  const defaultConfig: CITesterConfig = {
    rootDir: process.cwd(),
    outputWorkflowPath: 'DoDoDoDoDoDotgithub/workflows/ci-migration.yml',
    outputReportPath: 'reports/ci_check_report.md',
    outputLastRunPath: 'reports/ci_last_run.json',
    workspacePackages: [],
  };

  // Si aucun chemin de config n'est fourni, retourner la config par défaut
  if (!configPath) {
    return defaultConfig;
  }

  // Vérifier si le fichier existe
  const resolvedPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Le fichier de configuration n'existe pas: ${resolvedPath}`);
  }

  try {
    // Charger la configuration selon l'extension du fichier
    if (resolvedPath.endsWith('.js')) {
      return require(resolvedPath);
    }
    if (resolvedPath.endsWith('.ts')) {
      try {
        // Essayer de charger ts-node pour les fichiers .ts
        require('ts-node/register');
        return require(resolvedPath);
      } catch (error: any) {
        throw new Error(
          `Impossible de charger la configuration TypeScript. Assurez-vous que ts-node est installé : ${error.message}`
        );
      }
    } else if (resolvedPath.endsWith('.json')) {
      return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    }

    throw new Error(`Format de fichier de configuration non pris en charge: ${resolvedPath}`);
  } catch (error: any) {
    throw new Error(`Erreur lors du chargement de la configuration : ${error.message}`);
  }
}

/**
 * Détecte les workspaces npm dans un projet
 */
async function detectWorkspaces(rootDir: string): Promise<string[]> {
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const workspacePackages: string[] = [];

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Vérifier si le projet utilise des workspaces npm
      if (packageJson.workspaces) {
        // Gestion des patterns simples ou de l'objet complexe workspaces
        const patterns = Array.isArray(packageJson.workspaces)
          ? packageJson.workspaces
          : packageJson.workspaces.packages || [];

        // Pour chaque pattern, trouver les packages
        for (const pattern of patterns) {
          // Simplification: on considère seulement les patterns simples comme "packages/*"
          if (pattern.includes('*')) {
            const baseDir = pattern.split('*')[0];
            const subDirsPath = path.join(rootDir, baseDir);

            if (fs.existsSync(subDirsPath)) {
              const subDirs = fs
                .readdirSync(subDirsPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .map((dirent) => path.join(baseDir, dirent.name));

              // Vérifier si chaque répertoire a un package.json
              for (const subDir of subDirs) {
                const subPackageJsonPath = path.join(rootDir, subDir, 'package.json');
                if (fs.existsSync(subPackageJsonPath)) {
                  workspacePackages.push(path.join(subDir, 'package.json'));
                }
              }
            }
          } else {
            // C'est un chemin direct
            const packageJsonFilePath = path.join(rootDir, pattern, 'package.json');
            if (fs.existsSync(packageJsonFilePath)) {
              workspacePackages.push(path.join(pattern, 'package.json'));
            }
          }
        }
      }
    }

    return workspacePackages;
  } catch (error: any) {
    console.error(`Erreur lors de la détection des workspaces : ${error.message}`);
    return [];
  }
}

/**
 * Exporte l'API pour MCP
 */
export function createCITesterServerAPI() {
  return {
    runCITester,
    validateTest: async (test: CITest) => {
      try {
        // Vérifier si la commande est exécutable
        const { execSync } = require('child_process');

        // Adapter la commande pour un test non destructif
        let command = test.command;
        if (command.includes('npm ci') || command.includes('npm install')) {
          command = 'npm -v';
        } else if (command.startsWith('npx ')) {
          const packageName = command.split(' ')[1];
          command = `npx ${packageName} --version || npx ${packageName} -v || npx ${packageName} help`;
        } else if (command.includes('npm run ')) {
          command = command.replace('npm run ', 'npm run --dry-run ');
        }

        execSync(command, { stdio: 'ignore' });

        return {
          valid: true,
          test,
        };
      } catch (error: any) {
        return {
          valid: false,
          error: error.message,
          test,
        };
      }
    },
  };
}

// Exports pour faciliter l'importation
export { CITest, CIReport, PackageScripts, CITesterOptions };
