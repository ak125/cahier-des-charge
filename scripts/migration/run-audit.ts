#!/usr/bin/env ts-node
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { BusinessAgent } from './agents/AgentBusiness';
import { StructureAgent } from './agents/AgentStructure';
import { QualityAgent } from './agents/AgentQuality';
import { AssemblerAgent } from './assembler-agent';

interface AuditOptions {
  filePath: string;
  outputDir?: string;
  agents?: ('business' | 'structure' | 'quality' | 'assembler')[];
  saveToGit?: boolean;
  createPR?: boolean;
}

/**
 * Exécute un audit complet d'un fichier PHP
 */
async function runAudit(options: AuditOptions): Promise<void> {
  const {
    filePath,
    outputDir = path.dirname(filePath),
    agents = ['business', 'structure', 'quality', 'assembler'],
    saveToGit = false,
    createPR = false
  } = options;

  console.log(`🔍 Démarrage de l'audit pour ${filePath}`);

  // Vérifier si le fichier existe
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Le fichier ${filePath} n'existe pas.`);
  }

  // Créer le répertoire de sortie s'il n'existe pas
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.warn(`⚠️ Impossible de créer le répertoire ${outputDir}: ${error.message}`);
  }

  // Exécuter chaque agent
  for (const agent of agents) {
    console.log(`⏳ Exécution de l'agent ${agent}...`);

    try {
      switch (agent) {
        case 'business':
          const businessAgent = new BusinessAgent(filePath);
          await businessAgent.process(path.join(outputDir, `${path.basename(filePath)}.business.md`));
          break;

        case 'structure':
          const structureAgent = new StructureAgent(filePath);
          await structureAgent.process(path.join(outputDir, `${path.basename(filePath)}.structure.md`));
          break;

        case 'quality':
          const qualityAgent = new QualityAgent(filePath);
          await qualityAgent.process(path.join(outputDir, `${path.basename(filePath)}.quality.md`));
          break;

        case 'assembler':
          const assemblerAgent = new AssemblerAgent(filePath);
          await assemblerAgent.process();
          break;

        default:
          console.warn(`⚠️ Agent inconnu: ${agent}`);
      }

      console.log(`✅ Agent ${agent} exécuté avec succès.`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de l'agent ${agent}: ${error.message}`);
    }
  }

  console.log(`✅ Audit terminé pour ${filePath}`);

  // Sauvegarder les résultats dans Git si demandé
  if (saveToGit) {
    try {
      console.log('📝 Enregistrement des résultats dans Git...');

      // Créer une branche pour l'audit
      const branchName = `audit/${path.basename(filePath)}-${Date.now()}`;
      execSync(`git checkout -b ${branchName}`);

      // Ajouter tous les fichiers générés
      execSync(`git add "${outputDir}/${path.basename(filePath)}."*.md`);
      execSync(`git add "${outputDir}/${path.basename(filePath)}."*.json`);

      // Créer un commit
      execSync(`git commit -m "Audit: ${path.basename(filePath)}"`);

      // Pousser la branche
      execSync(`git push -u origin ${branchName}`);

      console.log(`✅ Résultats enregistrés sur la branche ${branchName}`);

      // Créer une PR si demandé
      if (createPR) {
        console.log('🔄 Création d\'une Pull Request...');

        execSync(`gh pr create --title "Audit: ${path.basename(filePath)}" --body "Audit automatique du fichier ${path.basename(filePath)}" --label "audit,migration"`);

        console.log('✅ Pull Request créée avec succès.');
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'enregistrement dans Git: ${error.message}`);
    }
  }
}

/**
 * Point d'entrée en ligne de commande
 */
async function main() {
  // Récupérer les arguments
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: ./run-audit.ts <fichier-php> [options]');
    console.error('Options:');
    console.error('  --output-dir <dir>    Répertoire de sortie');
    console.error('  --agents <agents>     Agents à exécuter (business,structure,quality,assembler)');
    console.error('  --save-to-git         Enregistrer les résultats dans Git');
    console.error('  --create-pr           Créer une Pull Request');
    process.exit(1);
  }

  const filePath = args[0];

  // Analyser les options
  const options: AuditOptions = { filePath };

  const outputDirIndex = args.indexOf('--output-dir');
  if (outputDirIndex !== -1 && outputDirIndex < args.length - 1) {
    options.outputDir = args[outputDirIndex + 1];
  }

  const agentsIndex = args.indexOf('--agents');
  if (agentsIndex !== -1 && agentsIndex < args.length - 1) {
    options.agents = args[agentsIndex + 1].split(',') as AuditOptions['agents'];
  }

  options.saveToGit = args.includes('--save-to-git');
  options.createPR = args.includes('--create-pr');

  try {
    await runAudit(options);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
