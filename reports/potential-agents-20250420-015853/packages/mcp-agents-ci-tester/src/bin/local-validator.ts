#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { runCITester } from '../index';
import { CIReport, CITest } from '../types';

/**
 * Exécute un test local en utilisant l'interface interactive
 */
export default async function runLocalValidator(): Promise<CIReport> {
  console.log(chalk.blue('🚀 Validation locale de la CI - Mode interactif'));

  // Obtenir les tests via l'agent principal
  const initialReport = await runCITester({
    generateWorkflow: false,
    validateCurrentSetup: true,
  });

  // Si aucun test n'est détecté, on arrête
  if (initialReport.detectedTests.length === 0) {
    console.log(chalk.red("❌ Aucun test CI n'a été détecté dans le projet actuel."));
    return {
      ...initialReport,
      status: 'error',
    };
  }

  // Afficher les tests détectés
  console.log(chalk.blue('\n📋 Tests CI détectés:'));
  initialReport.detectedTests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name} ${test.required ? chalk.yellow('(requis)') : ''}`);
    console.log(`     ${chalk.dim(test.description)}`);
    console.log(`     ${chalk.green('$')} ${chalk.dim(test.command)}`);
  });

  // Demander à l'utilisateur quels tests exécuter
  const { selectedTestIndices } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedTestIndices',
      message: 'Sélectionnez les tests à exécuter:',
      choices: initialReport.detectedTests.map((test, index) => ({
        name: `${test.name} ${test.required ? '(requis)' : ''}`,
        value: index,
        checked: test.required,
      })),
    },
  ]);

  // Si aucun test n'est sélectionné, on arrête
  if (selectedTestIndices.length === 0) {
    console.log(chalk.yellow('⚠️ Aucun test sélectionné. Arrêt de la validation.'));
    return {
      ...initialReport,
      status: 'warning',
    };
  }

  // Sélectionner les tests
  const selectedTests = selectedTestIndices.map((index) => initialReport.detectedTests[index]);

  // Demander confirmation avant de lancer les tests
  const { confirmRun } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmRun',
      message: `Êtes-vous sûr de vouloir exécuter ${selectedTests.length} test(s)?`,
      default: true,
    },
  ]);

  if (!confirmRun) {
    console.log(chalk.yellow("⚠️ Validation annulée par l'utilisateur."));
    return {
      ...initialReport,
      status: 'warning',
    };
  }

  // Préparer le rapport
  const report: CIReport = {
    ...initialReport,
    status: 'success',
    localTestResults: [],
  };

  // Exécuter les tests en séquence
  console.log(chalk.blue('\n🧪 Exécution des tests:'));

  for (const test of selectedTests) {
    console.log(chalk.blue(`\n📌 Test: ${test.name}`));
    console.log(chalk.dim(`   Description: ${test.description}`));
    console.log(chalk.dim(`   Commande: ${test.command}`));

    const startTime = Date.now();

    try {
      await new Promise<void>((resolve, reject) => {
        console.log(chalk.yellow('⏳ Exécution en cours...'));

        const childProcess = exec(test.command, { maxBuffer: 1024 * 1024 * 5 }); // 5MB buffer

        let output = '';

        childProcess.stdout?.on('data', (data) => {
          process.stdout.write(data);
          output += data;
        });

        childProcess.stderr?.on('data', (data) => {
          process.stderr.write(data);
          output += data;
        });

        childProcess.on('close', (code) => {
          const duration = Date.now() - startTime;

          if (code === 0) {
            console.log(chalk.green(`✅ Test réussi en ${Math.round(duration / 1000)}s`));
            report.localTestResults?.push({
              test,
              success: true,
              output,
              duration,
            });
            resolve();
          } else {
            console.log(chalk.red(`❌ Test échoué: ${code}`));
            report.localTestResults?.push({
              test,
              success: false,
              error: `Code de sortie: ${code}`,
              output,
              duration,
            });

            if (test.required) {
              report.status = 'error';
            } else {
              report.status = report.status === 'error' ? 'error' : 'warning';
            }

            resolve(); // On continue malgré l'erreur
          }
        });

        childProcess.on('error', (error) => {
          console.log(chalk.red(`❌ Test échoué: ${error.message}`));
          report.localTestResults?.push({
            test,
            success: false,
            error: error.message,
            output: '',
          });

          if (test.required) {
            report.status = 'error';
          } else {
            report.status = report.status === 'error' ? 'error' : 'warning';
          }

          resolve(); // On continue malgré l'erreur
        });
      });
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Erreur: ${error.message}`));
      process.exit(1);
    }
  }

  // Générer un rapport JSON local
  const reportPath = path.join(process.cwd(), 'reports/ci_local_results.json');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        status: report.status,
        results: report.localTestResults,
        testsTotal: selectedTests.length,
        testsSuccess: report.localTestResults?.filter((r) => r.success).length || 0,
        testsFailed: report.localTestResults?.filter((r) => !r.success).length || 0,
      },
      null,
      2
    )
  );

  // Afficher le résumé
  console.log(chalk.blue('\n📊 Résumé des tests:'));
  console.log(`  Total: ${selectedTests.length}`);
  console.log(`  Réussis: ${report.localTestResults?.filter((r) => r.success).length || 0}`);
  console.log(`  Échoués: ${report.localTestResults?.filter((r) => !r.success).length || 0}`);
  console.log(chalk.green(`\n✅ Rapport sauvegardé: ${reportPath}`));

  if (report.status === 'success') {
    console.log(chalk.green('\n🎉 Tous les tests requis ont réussi!'));
  } else if (report.status === 'warning') {
    console.log(chalk.yellow('\n⚠️ Certains tests optionnels ont échoué.'));
  } else {
    console.log(chalk.red('\n❌ Certains tests requis ont échoué.'));
  }

  return report;
}

// Exécuter directement si appelé comme script
if (require.main === module) {
  runLocalValidator();
}
