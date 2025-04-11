import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve, basename } from 'path';
import chalk from 'chalk';
import * as glob from 'glob';
import { ConsistencyVerifier } from './verifiers/consistency-verifier';
import { StructureVerifier } from './verifiers/structure-verifier';
import { SyntaxVerifier } from './verifiers/syntax-verifier';
import { LogicVerifier } from './verifiers/logic-verifier';
import { generateVerificationReport } from '../utils/report-generator';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Config {
  paths: {
    cahier: string;
    scripts: string;
    logs: string;
    htmlOutput: string;
  };
  rules: {
    maxDuplicateThreshold: number;
    minStructureScore: number;
    allowInlineJS: boolean;
    requireAuditMd: boolean;
  };
  github: {
    owner: string;
    repo: string;
    branch: string;
    autoPR: boolean;
  };
}

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

async function verifyCahier(): Promise<void> {
  console.log(chalk.blue('🔍 Démarrage de la vérification du cahier des charges...'));
  
  // Charger la configuration
  const configPath = resolve('./cahier_check.config.json');
  if (!existsSync(configPath)) {
    console.error(chalk.red('❌ Fichier de configuration non trouvé: cahier_check.config.json'));
    process.exit(1);
  }
  
  const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const cahierPath = resolve(config.paths.cahier);
  
  // Vérifier si le répertoire du cahier existe
  if (!existsSync(cahierPath)) {
    console.error(chalk.red(`❌ Répertoire du cahier des charges non trouvé: ${cahierPath}`));
    process.exit(1);
  }
  
  console.log(chalk.green(`✅ Configuration chargée, vérification du répertoire: ${cahierPath}`));
  
  // Collecter tous les fichiers à analyser
  const mdFiles = glob.sync(join(cahierPath, '**/*.md'));
  const jsonFiles = glob.sync(join(cahierPath, '**/*.json'));
  const tsFiles = glob.sync(join(cahierPath, '**/*.ts'));
  
  console.log(chalk.blue(`📁 Fichiers trouvés: ${mdFiles.length} MD, ${jsonFiles.length} JSON, ${tsFiles.length} TS`));
  
  // Initialiser les vérificateurs
  const consistencyVerifier = new ConsistencyVerifier(config);
  const structureVerifier = new StructureVerifier(config);
  const syntaxVerifier = new SyntaxVerifier(config);
  const logicVerifier = new LogicVerifier(config);
  
  // Vérifier la cohérence globale
  console.log(chalk.blue('🧩 Vérification de la cohérence globale...'));
  const consistencyResults = await consistencyVerifier.verify(mdFiles, jsonFiles, tsFiles);
  
  // Vérifier la structure
  console.log(chalk.blue('🏗️ Vérification de la structure...'));
  const structureResults = await structureVerifier.verify(mdFiles, jsonFiles, tsFiles);
  
  // Vérifier la syntaxe
  console.log(chalk.blue('📝 Vérification de la syntaxe...'));
  const syntaxResults = await syntaxVerifier.verify(mdFiles, jsonFiles, tsFiles);
  
  // Vérifier la logique métier
  console.log(chalk.blue('🧠 Vérification de la logique métier...'));
  const logicResults = await logicVerifier.verify(mdFiles, jsonFiles, tsFiles);
  
  // Vérifier la structure des fichiers .audit.md
  const auditResults = checkAuditStructure(mdFiles);

  // Agréger les résultats
  const allResults: VerificationResult[] = [
    ...consistencyResults,
    ...structureResults,
    ...syntaxResults,
    ...logicResults,
    ...auditResults
  ];
  
  // Génération du rapport
  console.log(chalk.blue('📊 Génération du rapport de vérification...'));
  const reportPath = await generateVerificationReport(allResults, config);
  
  // Afficher le résumé
  const successCount = allResults.filter(r => r.status === 'success').length;
  const warningCount = allResults.filter(r => r.status === 'warning').length;
  const errorCount = allResults.filter(r => r.status === 'error').length;
  
  console.log(chalk.green(`\n✅ Vérification terminée!`));
  console.log(chalk.white(`📊 Résumé: ${allResults.length} vérifications effectuées`));
  console.log(chalk.green(`✓ ${successCount} succès`));
  console.log(chalk.yellow(`⚠ ${warningCount} avertissements`));
  console.log(chalk.red(`✗ ${errorCount} erreurs`));
  console.log(chalk.blue(`📄 Rapport complet disponible: ${reportPath}`));
  
  // Sortir avec un code d'erreur si nécessaire
  if (errorCount > 0) {
    process.exit(1);
  }
}

function checkAuditStructure(mdFiles: string[]): VerificationResult[] {
  const results: VerificationResult[] = [];
  const auditFiles = mdFiles.filter(file => path.basename(file).includes('.audit.md'));
  
  if (auditFiles.length === 0) {
    console.log('Aucun fichier .audit.md trouvé. Vérification ignorée.');
    return results;
  }
  
  for (const auditFile of auditFiles) {
    try {
      const content = readFileSync(auditFile, 'utf-8');
      
      // Vérifier la présence des sections obligatoires
      const requiredSections = [
        /#+\s+.*[Rr]ôle.*métier/,
        /#+\s+.*[Ss]tructure/,
        /#+\s+.*[Zz]one.*fonctionnelle/,
        /#+\s+.*[Cc]omplexité/,
        /#+\s+.*[Mm]igration/
      ];
      
      const missingSections = requiredSections.filter(regex => !regex.test(content));
      
      if (missingSections.length > 0) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'warning',
          message: 'Sections obligatoires manquantes',
          details: missingSections.map(regex => regex.toString())
        });
      } else {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'success',
          message: 'Toutes les sections obligatoires sont présentes'
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${auditFile}: ${error.message}`);
      results.push({
        fileType: 'md',
        file: auditFile,
        status: 'error',
        message: `Impossible de lire le fichier: ${error.message}`
      });
    }
  }
  
  return results;
}

export default verifyCahier;

// Exécuter si appelé directement
if (require.main === module) {
  verifyCahier().catch(error => {
    console.error(`Erreur lors de la vérification: ${error.message}`);
    process.exit(1);
  });
}
