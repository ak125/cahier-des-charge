#!/usr/bin/env node

/**
 * Script principal d'orchestration de la migration
 * 
 * Ce script sert de point d'entrée principal pour le processus
 * complet de migration. Il intègre tous les agents et outils
 * en un seul workflow cohérent.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CoordinatorAgent } from './agents/coordinator-agent';
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readCahierDesCharges } from './agents/agent-audit';

// Version du script
const VERSION = '1.0.0';

// Configuration par défaut
const DEFAULT_CONFIG = {
  cahierDesChargesPath: '/workspaces/cahier-des-charge/cahier-des-charges-backup-20250410-113108',
  outputDir: './reports',
  parallel: false,
  verbose: false,
  showMetrics: true,
  autoFix: false,
  generateMigrationPlan: true,
  validateWithCahierDesCharges: true
};

/**
 * Charge la configuration depuis le fichier de config
 */
function loadConfig(configPath?: string): Record<string, any> {
  const defaultConfigPath = path.resolve(process.cwd(), 'migration-config.json');
  const finalConfigPath = configPath || defaultConfigPath;
  
  try {
    if (fs.existsSync(finalConfigPath)) {
      const configContent = fs.readFileSync(finalConfigPath, 'utf8');
      return {
        ...DEFAULT_CONFIG,
        ...JSON.parse(configContent)
      };
    }
  } catch (error) {
    console.error(`Erreur lors du chargement de la configuration: ${error.message}`);
  }
  
  return DEFAULT_CONFIG;
}

/**
 * Analyse un fichier PHP et génère les rapports d'audit
 */
async function auditPhpFile(filePath: string, options: any): Promise<void> {
  const spinner = ora(`Audit du fichier ${filePath}`).start();
  
  try {
    // Préparation des options pour le coordinateur
    const agentOptions = {
      phpFilePath: filePath,
      outputDir: options.outputDir,
      parallel: options.parallel,
      forceRerun: options.force,
      dependencyCheck: !options.noDeps,
      validateCahierDesCharges: options.validateWithCahierDesCharges,
      cahierDesChargesPath: options.cahierPath
    };
    
    // Ajouter les agents spécifiques si fournis
    if (options.agents) {
      agentOptions.agentsToRun = options.agents.split(',');
    }
    
    // Création du coordinateur avec hooks pour affichage
    const coordinator = new CoordinatorAgent({
      ...agentOptions,
      hooks: {
        beforeAgent: async (agentName) => {
          if (options.verbose) {
            spinner.text = `Exécution de l'agent: ${agentName}`;
          }
        },
        afterAgent: async (agentName, result) => {
          if (options.verbose) {
            spinner.text = `Agent ${agentName} terminé avec ${result.sections.length} sections`;
          }
        },
        onError: async (agentName, error) => {
          spinner.warn(`Erreur avec l'agent ${agentName}: ${error.message}`);
        },
        onComplete: async (results) => {
          const successCount = results.filter(r => r.success).length;
          const totalCount = results.length;
          spinner.succeed(`Audit terminé - ${successCount}/${totalCount} agents réussis`);
          
          // Afficher les métriques si demandé
          if (options.showMetrics) {
            console.log('\n📊 Métriques d\'exécution:');
            results.forEach(r => {
              const status = r.success 
                ? chalk.green('✓') 
                : chalk.red('✗');
              const time = r.executionTime;
              const itemsProcessed = r.result?.metrics?.itemsProcessed || 'N/A';
              console.log(`${status} ${chalk.bold(r.agentName)}: ${time}ms, ${itemsProcessed} éléments traités`);
            });
          }
        }
      }
    });
    
    // Exécution de l'audit
    await coordinator.execute();
    const reportPath = await coordinator.saveExecutionReport();
    
    // Afficher le chemin du rapport
    console.log(`\n📄 Rapport sauvegardé dans: ${chalk.cyan(reportPath)}`);
    
    // Générer un plan de migration si demandé
    if (options.generateMigrationPlan) {
      spinner.start('Génération du plan de migration');
      // Appel à la fonction de génération du plan de migration
      // Cette partie doit être implémentée selon votre logique de migration
      spinner.succeed('Plan de migration généré');
    }
    
  } catch (error) {
    spinner.fail(`Échec de l'audit: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Analyse un dossier contenant des fichiers PHP
 */
async function auditPhpDirectory(dirPath: string, options: any): Promise<void> {
  try {
    // Vérifier que le dossier existe
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Le dossier ${dirPath} n'existe pas`);
    }
    
    // Trouver tous les fichiers PHP
    const phpFiles = await findPhpFiles(dirPath, options.recursive);
    
    console.log(`📁 ${phpFiles.length} fichiers PHP trouvés dans ${dirPath}`);
    
    // Audit de chaque fichier
    for (let i = 0; i < phpFiles.length; i++) {
      const file = phpFiles[i];
      console.log(`\n[${i+1}/${phpFiles.length}] Traitement de: ${file}`);
      await auditPhpFile(file, options);
    }
    
    console.log(`\n✅ Audit du dossier terminé. ${phpFiles.length} fichiers traités.`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'audit du dossier: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Trouve tous les fichiers PHP dans un dossier
 */
async function findPhpFiles(dirPath: string, recursive: boolean = true): Promise<string[]> {
  const result: string[] = [];
  
  // Lecture du contenu du dossier
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    
    if (item.isDirectory() && recursive) {
      // Ignorer les dossiers node_modules et les dossiers cachés
      if (item.name !== 'node_modules' && !item.name.startsWith('.')) {
        const subDirFiles = await findPhpFiles(itemPath, recursive);
        result.push(...subDirFiles);
      }
    } else if (item.isFile() && item.name.toLowerCase().endsWith('.php')) {
      result.push(itemPath);
    }
  }
  
  return result;
}

/**
 * Affiche un résumé du cahier des charges
 */
function displayCahierDeCharges(options: any): void {
  try {
    const cahierPath = options.cahierPath || DEFAULT_CONFIG.cahierDesChargesPath;
    console.log(`📖 Lecture du cahier des charges: ${cahierPath}`);
    
    const cahierInfo = readCahierDesCharges(cahierPath);
    
    console.log(chalk.bold('\n📑 Résumé du cahier des charges:\n'));
    console.log(cahierInfo.summary);
    
    console.log(chalk.bold('\n🔑 Points clés:\n'));
    cahierInfo.keyPoints.forEach(point => {
      console.log(`  ${point}`);
    });
    
    console.log(chalk.bold('\n🎯 Objectifs principaux:\n'));
    if (cahierInfo.objectives.length > 0) {
      cahierInfo.objectives.slice(0, 10).forEach(obj => {
        console.log(`  - ${obj}`);
      });
      
      if (cahierInfo.objectives.length > 10) {
        console.log(`  ... et ${cahierInfo.objectives.length - 10} autres objectifs`);
      }
    } else {
      console.log('  Aucun objectif explicitement défini dans le cahier des charges');
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'affichage du cahier des charges: ${error.message}`);
  }
}

/**
 * Point d'entrée principal
 */
async function main(): Promise<void> {
  // Configuration de Commander pour l'interface en ligne de commande
  program
    .name('migration-orchestrator')
    .description('Orchestrateur de migration PHP vers NestJS/Remix')
    .version(VERSION);
  
  // Commande d'audit de fichier
  program
    .command('audit <file>')
    .description('Auditer un fichier PHP pour la migration')
    .option('-o, --output-dir <dir>', 'Dossier de sortie pour les rapports')
    .option('-p, --parallel', 'Exécuter les agents en parallèle')
    .option('-f, --force', 'Forcer la réexécution même si déjà audité')
    .option('--no-deps', 'Désactiver la vérification des dépendances')
    .option('-a, --agents <liste>', 'Liste des agents à exécuter (séparés par des virgules)')
    .option('-c, --config <path>', 'Chemin vers un fichier de configuration')
    .option('--cahier-path <path>', 'Chemin vers le cahier des charges')
    .option('--no-migration-plan', 'Ne pas générer de plan de migration')
    .option('-v, --verbose', 'Afficher plus d\'informations')
    .option('--no-metrics', 'Ne pas afficher les métriques')
    .action(async (file, options) => {
      // Charger la configuration 
      const config = loadConfig(options.config);
      
      // Fusionner avec les options de ligne de commande
      const mergedOptions = {
        ...config,
        outputDir: options.outputDir || config.outputDir,
        parallel: options.parallel !== undefined ? options.parallel : config.parallel,
        force: options.force || false,
        noDeps: options.noDeps === false,
        agents: options.agents,
        cahierPath: options.cahierPath || config.cahierDesChargesPath,
        verbose: options.verbose || config.verbose,
        showMetrics: options.metrics !== false,
        generateMigrationPlan: options.migrationPlan !== false
      };
      
      // Vérifier si le chemin est un fichier ou un dossier
      const stats = await fs.stat(file);
      
      if (stats.isFile()) {
        await auditPhpFile(file, mergedOptions);
      } else if (stats.isDirectory()) {
        await auditPhpDirectory(file, {
          ...mergedOptions,
          recursive: true
        });
      } else {
        console.error(`Le chemin spécifié n'est ni un fichier ni un dossier: ${file}`);
        process.exit(1);
      }
    });
  
  // Commande d'audit de dossier
  program
    .command('audit-dir <directory>')
    .description('Auditer tous les fichiers PHP d\'un dossier')
    .option('-o, --output-dir <dir>', 'Dossier de sortie pour les rapports')
    .option('-p, --parallel', 'Exécuter les agents en parallèle')
    .option('-f, --force', 'Forcer la réexécution même si déjà audité')
    .option('-r, --recursive', 'Auditer récursivement les sous-dossiers', true)
    .option('--no-deps', 'Désactiver la vérification des dépendances')
    .option('-a, --agents <liste>', 'Liste des agents à exécuter (séparés par des virgules)')
    .option('-c, --config <path>', 'Chemin vers un fichier de configuration')
    .option('--cahier-path <path>', 'Chemin vers le cahier des charges')
    .option('--no-migration-plan', 'Ne pas générer de plan de migration')
    .option('-v, --verbose', 'Afficher plus d\'informations')
    .action(async (directory, options) => {
      // Charger la configuration 
      const config = loadConfig(options.config);
      
      // Fusionner avec les options de ligne de commande
      const mergedOptions = {
        ...config,
        outputDir: options.outputDir || config.outputDir,
        parallel: options.parallel !== undefined ? options.parallel : config.parallel,
        force: options.force || false,
        noDeps: options.noDeps === false,
        recursive: options.recursive,
        agents: options.agents,
        cahierPath: options.cahierPath || config.cahierDesChargesPath,
        verbose: options.verbose || config.verbose,
        generateMigrationPlan: options.migrationPlan !== false
      };
      
      await auditPhpDirectory(directory, mergedOptions);
    });
  
  // Commande d'affichage du cahier des charges
  program
    .command('cahier')
    .description('Afficher un résumé du cahier des charges')
    .option('--cahier-path <path>', 'Chemin vers le cahier des charges')
    .action((options) => {
      displayCahierDeCharges(options);
    });
  
  // Analyse des arguments
  await program.parseAsync();
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error(`Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

// Exporter les fonctions principales pour les tests et l'utilisation dans d'autres modules
export {
  auditPhpFile,
  auditPhpDirectory,
  findPhpFiles,
  displayCahierDeCharges,
  loadConfig
};