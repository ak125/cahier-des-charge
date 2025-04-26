/**
 * enhanced-php-analyzer.ts
 * 
 * Intégration d'outils d'analyse statique PHP avancés pour améliorer la qualité
 * des plans de migration. Utilise PHPStan, PHPMD, PHP_CodeSniffer et Psalm.
 * 
 * Usage: ts-node enhanced-php-analyzer.ts <chemin-fichier.php>
 * 
 * Date: 11 avril 2025
 */

import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import { execSync } from child_processstructure-agent';
import axios from axiosstructure-agent';

interface AnalysisResult {
  filePath: string;
  fileName: string;
  metrics: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    codeSmells: number;
    dependencies: string[];
    securityIssues: any[];
    styleIssues: number;
  };
  phpStan: {
    level: number;
    errors: any[];
  };
  phpMd: {
    violations: any[];
  };
  codeSniffer: {
    errors: number;
    warnings: number;
    issues: any[];
  };
  psalm: {
    level: number;
    issues: any[];
  };
  typeCoverage: number;
  riskyFunctions: string[];
  legacyCode: {
    deprecatedFunctions: string[];
    unsafeConstructs: string[];
  };
}

/**
 * Vérifie si les outils d'analyse PHP sont installés 
 * et les installe si nécessaire via Composer
 */
function ensureToolsInstalled(): void {
  try {
    // Vérifier si Composer est installé
    execSync('composer --version', { stdio: 'ignore' });
    
    // Installer les outils d'analyse si nécessaire
    const installTools = `
      if [ ! -f "$(which phpstan)" ]; then
        composer global require phpstan/phpstan
      fi
      
      if [ ! -f "$(which phpmd)" ]; then
        composer global require phpmd/phpmd
      fi
      
      if [ ! -f "$(which phpcs)" ]; then
        composer global require squizlabs/php_codesniffer
      fi
      
      if [ ! -f "$(which phpcpd)" ]; then
        composer global require sebastian/phpcpd
      fi
      
      if [ ! -f "$(which psalm)" ]; then
        composer global require vimeo/psalm
      fi
    `;
    
    execSync(installTools, { shell: '/bin/bash' });
    console.log('✅ Outils d\'analyse PHP vérifiés/installés avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation des outils:', error);
    console.error('⚠️ Certaines analyses avancées ne seront pas disponibles');
  }
}

/**
 * Analyse un fichier PHP avec PHPStan pour détecter les erreurs de type
 */
function analyzePHPStan(filePath: string): any {
  try {
    // Niveaux PHPStan: 0 (basique) à 9 (très strict)
    const level = 5;
    
    const result = execSync(
      `phpstan analyze ${filePath} --level=${level} --no-progress --error-format=json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    return {
      level,
      errors: JSON.parse(result).files || []
    };
  } catch (error: any) {
    // PHPStan renvoie une erreur si des problèmes sont trouvés
    try {
      const jsonOutput = JSON.parse(error.stdout);
      return {
        level: 5,
        errors: jsonOutput.files || []
      };
    } catch {
      return {
        level: 5,
        errors: []
      };
    }
  }
}

/**
 * Analyse un fichier PHP avec PHPMD pour détecter les problèmes de code
 */
function analyzePHPMD(filePath: string): any {
  try {
    const result = execSync(
      `phpmd ${filePath} json cleancode,codesize,controversial,design,naming,unusedcode`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    return {
      violations: JSON.parse(result) || []
    };
  } catch (error: any) {
    // PHPMD renvoie une erreur si des problèmes sont trouvés
    try {
      const jsonOutput = JSON.parse(error.stdout);
      return {
        violations: jsonOutput || []
      };
    } catch {
      return {
        violations: []
      };
    }
  }
}

/**
 * Analyse un fichier PHP avec PHP_CodeSniffer pour vérifier les standards de code
 */
function analyzeCodeSniffer(filePath: string): any {
  try {
    const result = execSync(
      `phpcs --standard=PSR12 --report=json ${filePath}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    const parsedResult = JSON.parse(result);
    return {
      errors: parsedResult.totals.errors || 0,
      warnings: parsedResult.totals.warnings || 0,
      issues: parsedResult.files[filePath]?.messages || []
    };
  } catch (error: any) {
    // CodeSniffer renvoie une erreur si des problèmes sont trouvés
    try {
      const jsonOutput = JSON.parse(error.stdout);
      return {
        errors: jsonOutput.totals.errors || 0,
        warnings: jsonOutput.totals.warnings || 0,
        issues: jsonOutput.files[filePath]?.messages || []
      };
    } catch {
      return {
        errors: 0,
        warnings: 0,
        issues: []
      };
    }
  }
}

/**
 * Analyse un fichier PHP avec Psalm pour détecter les erreurs de type
 */
function analyzePsalm(filePath: string): any {
  try {
    // Niveaux Psalm: 1 (basique) à 8 (très strict)
    const level = 3;
    
    const result = execSync(
      `psalm --output-format=json --show-info=true --level=${level} ${filePath}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    return {
      level,
      issues: JSON.parse(result).issues || []
    };
  } catch (error: any) {
    // Psalm renvoie une erreur si des problèmes sont trouvés
    try {
      const jsonOutput = JSON.parse(error.stdout);
      return {
        level: 3,
        issues: jsonOutput.issues || []
      };
    } catch {
      return {
        level: 3,
        issues: []
      };
    }
  }
}

/**
 * Détecte les fonctions risquées et les constructions obsolètes dans le code PHP
 */
function detectRiskyFunctions(fileContent: string): string[] {
  const riskyPatterns = [
    'eval\\s*\\(', // eval()
    'exec\\s*\\(', // exec()
    'system\\s*\\(', // system()
    'shell_exec\\s*\\(', // shell_exec()
    'passthru\\s*\\(', // passthru()
    'include\\s*\\(.*\\$', // include dynamique
    'require\\s*\\(.*\\$', // require dynamique
    'include_once\\s*\\(.*\\$', // include_once dynamique
    'require_once\\s*\\(.*\\$', // require_once dynamique
    'mysql_', // Fonctions mysql_ obsolètes
    'ereg\\s*\\(', // ereg() obsolète
    'split\\s*\\(', // split() obsolète
    'create_function\\s*\\(' // create_function() obsolète
  ];
  
  const riskyFunctions: string[] = [];
  
  for (const pattern of riskyPatterns) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(fileContent)) {
      riskyFunctions.push(pattern.replace('\\s*\\(.*\\$', '').replace('\\s*\\(', '').replace('_', ''));
    }
  }
  
  return riskyFunctions;
}

/**
 * Analyse un fichier PHP avec des outils statiques avancés
 */
async function analyzeWithAdvancedTools(filePath: string): Promise<AnalysisResult> {
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // S'assurer que les outils sont installés
  ensureToolsInstalled();
  
  // Calculer les métriques de base
  const lineCount = fileContent.split('\n').length;
  const functionCount = (fileContent.match(/function\s+\w+\s*\(/g) || []).length;
  const classCount = (fileContent.match(/class\s+\w+/g) || []).length;
  
  // Extraire les dépendances (include, require)
  const dependencyRegex = /(?:include|require|include_once|require_once)\s*(?:\(?\s*['"]([^'"]+)['"]\s*\)?)/g;
  const dependencies: string[] = [];
  let match;
  
  while ((match = dependencyRegex.exec(fileContent)) !== null) {
    dependencies.push(match[1]);
  }
  
  // Détecter les fonctions risquées et le code obsolète
  const riskyFunctions = detectRiskyFunctions(fileContent);
  
  // Analyser avec PHPStan
  const phpStanResult = analyzePHPStan(filePath);
  
  // Analyser avec PHPMD
  const phpMdResult = analyzePHPMD(filePath);
  
  // Analyser avec PHP_CodeSniffer
  const codeSnifferResult = analyzeCodeSniffer(filePath);
  
  // Analyser avec Psalm
  const psalmResult = analyzePsalm(filePath);
  
  // Calculer un score approximatif de couverture de type
  // Basé sur le nombre d'erreurs PHPStan divisé par le nombre de lignes
  const estimatedTypeCoverage = Math.max(0, 100 - (phpStanResult.errors.length / lineCount * 100));
  
  // Calculer le nombre estimé de "code smells"
  const codeSmells = phpMdResult.violations.length + Math.floor(codeSnifferResult.errors / 2);
  
  // Calculer un indice de maintenabilité approximatif (0-100)
  // Plus le score est élevé, plus le code est maintenable
  const maintainabilityIndex = Math.max(0, Math.min(100, 
    100 - (codeSmells * 2) - (riskyFunctions.length * 5) - (phpStanResult.errors.length / 2)
  ));
  
  // Estimer la complexité cyclomatique
  // En l'absence d'analyse précise, on fait une estimation basée sur les structures de contrôle
  const ifCount = (fileContent.match(/\sif\s*\(/g) || []).length;
  const forCount = (fileContent.match(/\sfor\s*\(/g) || []).length;
  const foreachCount = (fileContent.match(/\sforeach\s*\(/g) || []).length;
  const whileCount = (fileContent.match(/\swhile\s*\(/g) || []).length;
  const switchCount = (fileContent.match(/\sswitch\s*\(/g) || []).length * 2; // Un switch compte plus
  
  const estimatedCyclomaticComplexity = 1 + ifCount + forCount + foreachCount + whileCount + switchCount;
  
  return {
    filePath,
    fileName,
    metrics: {
      cyclomaticComplexity: estimatedCyclomaticComplexity,
      maintainabilityIndex: maintainabilityIndex,
      codeSmells: codeSmells,
      dependencies: dependencies,
      securityIssues: riskyFunctions.map(func => ({ type: 'riskyFunction', name: func })),
      styleIssues: codeSnifferResult.errors + codeSnifferResult.warnings
    },
    phpStan: phpStanResult,
    phpMd: phpMdResult,
    codeSniffer: codeSnifferResult,
    psalm: psalmResult,
    typeCoverage: estimatedTypeCoverage,
    riskyFunctions: riskyFunctions,
    legacyCode: {
      deprecatedFunctions: riskyFunctions.filter(f => ['mysql', 'ereg', 'split', 'create_function'].includes(f)),
      unsafeConstructs: riskyFunctions.filter(f => ['eval', 'exec', 'system', 'shell_exec', 'passthru'].includes(f))
    }
  };
}

/**
 * Génère un rapport d'analyse au format JSON
 */
function generateAnalysisReport(analysis: AnalysisResult): string {
  return JSON.stringify(analysis, null, 2);
}

/**
 * Fonction principale
 */
async function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
    Usage: ts-node enhanced-php-analyzer.ts <chemin-fichier.php>
    `);
    process.exit(0);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Le fichier ${filePath} n'existe pas`);
    process.exit(1);
  }
  
  console.log(`📊 Analyse avancée du fichier ${filePath}...`);
  
  try {
    // Analyser le fichier PHP avec des outils avancés
    const analysisResult = await analyzeWithAdvancedTools(filePath);
    
    // Générer et sauvegarder le rapport d'analyse
    const outputDir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.php');
    const reportPath = path.join(outputDir, `${baseName}.analysis.json`);
    
    fs.writeFileSync(reportPath, generateAnalysisReport(analysisResult), 'utf8');
    console.log(`✅ Rapport d'analyse généré: ${reportPath}`);
    
    // Afficher un résumé de l'analyse
    console.log('\n📋 Résumé de l\'analyse:');
    console.log(`📏 Complexité cyclomatique: ${analysisResult.metrics.cyclomaticComplexity}`);
    console.log(`🧹 Code smells: ${analysisResult.metrics.codeSmells}`);
    console.log(`🔒 Problèmes de sécurité: ${analysisResult.metrics.securityIssues.length}`);
    console.log(`📐 Couverture de type: ${analysisResult.typeCoverage.toFixed(2)}%`);
    console.log(`🔧 Indice de maintenabilité: ${analysisResult.metrics.maintainabilityIndex.toFixed(2)}/100`);
    
    if (analysisResult.riskyFunctions.length > 0) {
      console.log(`\n⚠️ Fonctions risquées détectées: ${analysisResult.riskyFunctions.join(', ')}`);
    }
    
    console.log('\n🚀 Analyse terminée avec succès!');
    
    // Retourner l'analyse pour une utilisation potentielle par d'autres scripts
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

// Exporter la fonction pour une utilisation par d'autres modules
export { analyzeWithAdvancedTools };