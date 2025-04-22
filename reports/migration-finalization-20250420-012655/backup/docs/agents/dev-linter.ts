import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  remixDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/frontend'),
  nestjsDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/backend'),
  packagesDir: path.join(process.cwd(), 'packages'),
  outputReportPath: path.join(process.cwd(), 'reports/lint_report.md'),
  outputTypeCheckPath: path.join(process.cwd(), 'reports/type_check_output.log'),
  outputTailwindPath: path.join(process.cwd(), 'reports/tailwind_check.log'),
  outputFailuresPath: path.join(process.cwd(), 'reports/lint_failures.json'),
  ignoredDirs: ['node_modules', '.turbo', 'dist', 'build', '.cache', 'public/build'],
  runESLint: true,
  runBiome: true,
  runTsc: true,
  runTailwind: true,
  eslintConfig: path.join(process.cwd(), '.eslintrc.js'),
  biomeConfig: path.join(process.cwd(), 'biome.json'),
  tailwindConfig: path.join(process.cwd(), 'tailwind.config.js'),
  globalCssPath: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/frontend/app/styles/global.css'),
};

// Types pour les résultats
interface LintResult {
  success: boolean;
  errorCount: number;
  warningCount: number;
  output: string;
  files?: string[];
}

interface TypeCheckResult {
  success: boolean;
  errorCount: number;
  warningCount: number;
  output: string;
}

interface TailwindCheckResult {
  success: boolean;
  unusedClasses: string[];
  output: string;
}

interface BiomeCheckResult {
  success: boolean;
  errorCount: number;
  warningCount: number;
  output: string;
}

interface LinterReport {
  overallStatus: 'success' | 'warning' | 'error';
  eslint?: LintResult;
  biome?: BiomeCheckResult;
  typeCheck?: TypeCheckResult;
  tailwind?: TailwindCheckResult;
  logs: string[];
}

// Agent principal
export const devLinterAgent = {
  name: 'dev-linter',
  description: 'Vérifie la qualité du code (lint, typage, style) dans le monorepo',
  category: 'quality',
  
  async run(options?: { 
    eslint?: boolean;
    biome?: boolean;
    tsc?: boolean;
    tailwind?: boolean;
  }): Promise<LinterReport> {
    const logs: string[] = [];
    const report: LinterReport = {
      overallStatus: 'success',
      logs: []
    };
    
    try {
      logs.push('🚀 Lancement des vérifications de qualité de code...');
      
      // Déterminer quelles vérifications exécuter
      const runESLint = options?.eslint !== undefined ? options.eslint : CONFIG.runESLint;
      const runBiome = options?.biome !== undefined ? options.biome : CONFIG.runBiome;
      const runTsc = options?.tsc !== undefined ? options.tsc : CONFIG.runTsc;
      const runTailwind = options?.tailwind !== undefined ? options.tailwind : CONFIG.runTailwind;
      
      // 1. Exécution d'ESLint
      if (runESLint) {
        logs.push('🔍 Exécution d\'ESLint...');
        const eslintResult = await runESLintCheck();
        report.eslint = eslintResult;
        
        if (eslintResult.success) {
          logs.push(`✅ ESLint: Aucune erreur (${eslintResult.warningCount} avertissements)`);
        } else {
          report.overallStatus = 'error';
          logs.push(`❌ ESLint: ${eslintResult.errorCount} erreurs, ${eslintResult.warningCount} avertissements`);
          
          // Ajouter les 5 premières erreurs au log pour visibilité
          const errorLines = eslintResult.output.split('\n')
            .filter(line => line.includes('error'))
            .slice(0, 5);
          
          if (errorLines.length > 0) {
            logs.push('📋 Erreurs ESLint (top 5):');
            errorLines.forEach(line => {
              logs.push(`  - ${line.trim()}`);
            });
            
            if (eslintResult.errorCount > 5) {
              logs.push(`  - et ${eslintResult.errorCount - 5} autres erreurs...`);
            }
          }
        }
      }
      
      // 2. Exécution de Biome si configuré
      if (runBiome && fs.existsSync(CONFIG.biomeConfig)) {
        logs.push('🔍 Exécution de Biome...');
        const biomeResult = await runBiomeCheck();
        report.biome = biomeResult;
        
        if (biomeResult.success) {
          logs.push(`✅ Biome: Aucune erreur (${biomeResult.warningCount} avertissements)`);
        } else {
          // Ne pas changer overallStatus en erreur pour Biome car il est optionnel
          if (report.overallStatus === 'success') report.overallStatus = 'warning';
          logs.push(`⚠️ Biome: ${biomeResult.errorCount} erreurs, ${biomeResult.warningCount} avertissements`);
          
          // Ajouter les 5 premières erreurs au log pour visibilité
          const errorLines = biomeResult.output.split('\n')
            .filter(line => line.includes('error'))
            .slice(0, 5);
          
          if (errorLines.length > 0) {
            logs.push('📋 Erreurs Biome (top 5):');
            errorLines.forEach(line => {
              logs.push(`  - ${line.trim()}`);
            });
            
            if (biomeResult.errorCount > 5) {
              logs.push(`  - et ${biomeResult.errorCount - 5} autres erreurs...`);
            }
          }
        }
      } else if (runBiome) {
        logs.push('⚠️ Biome: Configuration non trouvée. Vérification ignorée.');
      }
      
      // 3. Vérification du typage TypeScript
      if (runTsc) {
        logs.push('🔍 Vérification du typage TypeScript...');
        const typeCheckResult = await runTypeCheck();
        report.typeCheck = typeCheckResult;
        
        if (typeCheckResult.success) {
          logs.push('✅ TypeScript: Compilation réussie sans erreurs');
        } else {
          report.overallStatus = 'error';
          logs.push(`❌ TypeScript: ${typeCheckResult.errorCount} erreurs de typage détectées`);
          
          // Ajouter les 5 premières erreurs au log pour visibilité
          const errorLines = typeCheckResult.output.split('\n')
            .filter(line => line.includes('error TS'))
            .slice(0, 5);
          
          if (errorLines.length > 0) {
            logs.push('📋 Erreurs TypeScript (top 5):');
            errorLines.forEach(line => {
              logs.push(`  - ${line.trim()}`);
            });
            
            if (typeCheckResult.errorCount > 5) {
              logs.push(`  - et ${typeCheckResult.errorCount - 5} autres erreurs...`);
            }
          }
        }
      }
      
      // 4. Vérification des classes Tailwind
      if (runTailwind && fs.existsSync(CONFIG.tailwindConfig)) {
        logs.push('🔍 Vérification des classes Tailwind CSS...');
        const tailwindResult = await runTailwindCheck();
        report.tailwind = tailwindResult;
        
        if (tailwindResult.success) {
          logs.push('✅ Tailwind CSS: Aucune classe inutilisée détectée');
        } else {
          // Ne pas changer overallStatus en erreur pour les classes inutilisées
          if (report.overallStatus === 'success') report.overallStatus = 'warning';
          logs.push(`⚠️ Tailwind CSS: ${tailwindResult.unusedClasses.length} classes inutilisées détectées`);
          
          if (tailwindResult.unusedClasses.length > 0) {
            logs.push('📋 Exemples de classes Tailwind inutilisées:');
            tailwindResult.unusedClasses.slice(0, 5).forEach(className => {
              logs.push(`  - ${className}`);
            });
            
            if (tailwindResult.unusedClasses.length > 5) {
              logs.push(`  - et ${tailwindResult.unusedClasses.length - 5} autres classes inutilisées...`);
            }
          }
        }
      } else if (runTailwind) {
        logs.push('⚠️ Tailwind CSS: Configuration non trouvée. Vérification ignorée.');
      }
      
      // Générer un rapport détaillé
      await generateDetailedReport(report);
      
      // Ajouter les logs au rapport final
      report.logs = logs;
      
      return report;
    } catch (error) {
      logs.push(`❌ Erreur lors de l'exécution de l'agent dev-linter: ${error.message}`);
      console.error(error);
      
      report.logs = logs;
      report.overallStatus = 'error';
      
      return report;
    }
  }
};

/**
 * Exécute ESLint sur le code source
 */
async function runESLintCheck(): Promise<LintResult> {
  try {
    // Vérifier si eslint est installé
    try {
      execSync('npx eslint --version', { stdio: 'ignore' });
    } catch (error) {
      return {
        success: false,
        errorCount: 1,
        warningCount: 0,
        output: 'ESLint n\'est pas installé. Exécutez `npm install eslint --save-dev` pour l\'installer.'
      };
    }
    
    // Vérifier si le fichier de configuration existe
    const configExists = fs.existsSync(CONFIG.eslintConfig);
    
    // Préparer les chemins à analyser
    const paths = [
      path.join(CONFIG.remixDir, 'app'),
      path.join(CONFIG.nestjsDir, 'src'),
      CONFIG.packagesDir
    ].filter(p => fs.existsSync(p));
    
    // Construire la commande ESLint
    const eslintCmd = [
      'npx eslint',
      '--ext .ts,.tsx,.js,.jsx',
      configExists ? '' : '--no-eslintrc',
      paths.join(' '),
      '--format json'
    ].filter(Boolean).join(' ');
    
    // Exécuter ESLint
    const eslintOutput = execSync(eslintCmd, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Analyser la sortie JSON
    const results = JSON.parse(eslintOutput);
    
    let errorCount = 0;
    let warningCount = 0;
    const filesWithIssues: string[] = [];
    
    results.forEach(result => {
      errorCount += result.errorCount || 0;
      warningCount += result.warningCount || 0;
      
      if ((result.errorCount || 0) > 0 || (result.warningCount || 0) > 0) {
        filesWithIssues.push(result.filePath);
      }
    });
    
    // Générer une sortie plus lisible pour le rapport
    const formattedOutput = generateFormattedESLintOutput(results);
    
    return {
      success: errorCount === 0,
      errorCount,
      warningCount,
      output: formattedOutput,
      files: filesWithIssues
    };
  } catch (error) {
    if (error.status === 2) { // eslint retourne 2 quand il trouve des problèmes
      try {
        // Essayer d'extraire le nombre d'erreurs et d'avertissements
        const errorMatch = error.stdout?.toString().match(/(\d+) errors?/);
        const warningMatch = error.stdout?.toString().match(/(\d+) warnings?/);
        
        const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : 0;
        const warningCount = warningMatch ? parseInt(warningMatch[1], 10) : 0;
        
        return {
          success: false,
          errorCount,
          warningCount,
          output: error.stdout?.toString() || 'Problèmes ESLint détectés'
        };
      } catch (parseError) {
        // Si on ne peut pas extraire les informations, retourner un message d'erreur générique
        return {
          success: false,
          errorCount: 1,
          warningCount: 0,
          output: error.message || 'Erreur lors de l\'exécution d\'ESLint'
        };
      }
    }
    
    // Pour toute autre erreur
    return {
      success: false,
      errorCount: 1,
      warningCount: 0,
      output: error.message || 'Erreur lors de l\'exécution d\'ESLint'
    };
  }
}

/**
 * Formatte les résultats ESLint pour une meilleure lisibilité
 */
function generateFormattedESLintOutput(results: any[]): string {
  let output = '';
  
  results.forEach(result => {
    if (result.messages && result.messages.length > 0) {
      output += `\n${result.filePath}:\n`;
      
      result.messages.forEach(msg => {
        const severity = msg.severity === 2 ? 'error' : 'warning';
        output += `  ${msg.line}:${msg.column}  ${severity}  ${msg.message}  ${msg.ruleId || ''}\n`;
      });
    }
  });
  
  return output;
}

/**
 * Exécute Biome sur le code source
 */
async function runBiomeCheck(): Promise<BiomeCheckResult> {
  try {
    // Vérifier si biome est installé
    try {
      execSync('npx @biomejs/biome --version', { stdio: 'ignore' });
    } catch (error) {
      return {
        success: false,
        errorCount: 1,
        warningCount: 0,
        output: 'Biome n\'est pas installé. Exécutez `npm install @biomejs/biome --save-dev` pour l\'installer.'
      };
    }
    
    // Préparer les chemins à analyser
    const paths = [
      path.join(CONFIG.remixDir, 'app'),
      path.join(CONFIG.nestjsDir, 'src'),
      CONFIG.packagesDir
    ].filter(p => fs.existsSync(p));
    
    // Construire la commande Biome
    const biomeCmd = [
      'npx @biomejs/biome',
      'check',
      paths.join(' '),
      '--formatter json'
    ].join(' ');
    
    // Exécuter Biome
    const biomeOutput = execSync(biomeCmd, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Analyser la sortie JSON
    const results = JSON.parse(biomeOutput);
    
    let errorCount = 0;
    let warningCount = 0;
    
    if (results.files) {
      results.files.forEach(file => {
        if (file.diagnostics) {
          file.diagnostics.forEach(diag => {
            if (diag.level === 'error') errorCount++;
            else if (diag.level === 'warning') warningCount++;
          });
        }
      });
    }
    
    // Formater la sortie pour le rapport
    const formattedOutput = generateFormattedBiomeOutput(results);
    
    return {
      success: errorCount === 0,
      errorCount,
      warningCount,
      output: formattedOutput
    };
  } catch (error) {
    // Si Biome trouve des problèmes, il peut sortir avec un code d'erreur
    if (error.status !== 0 && error.stdout) {
      try {
        const results = JSON.parse(error.stdout.toString());
        
        let errorCount = 0;
        let warningCount = 0;
        
        if (results.files) {
          results.files.forEach(file => {
            if (file.diagnostics) {
              file.diagnostics.forEach(diag => {
                if (diag.level === 'error') errorCount++;
                else if (diag.level === 'warning') warningCount++;
              });
            }
          });
        }
        
        // Formater la sortie pour le rapport
        const formattedOutput = generateFormattedBiomeOutput(results);
        
        return {
          success: false,
          errorCount,
          warningCount,
          output: formattedOutput
        };
      } catch (parseError) {
        // Si on ne peut pas analyser le JSON
        return {
          success: false,
          errorCount: 1,
          warningCount: 0,
          output: error.message || 'Erreur lors de l\'exécution de Biome'
        };
      }
    }
    
    // Pour toute autre erreur
    return {
      success: false,
      errorCount: 1,
      warningCount: 0,
      output: error.message || 'Erreur lors de l\'exécution de Biome'
    };
  }
}

/**
 * Formatte les résultats Biome pour une meilleure lisibilité
 */
function generateFormattedBiomeOutput(results: any): string {
  let output = '';
  
  if (results.files) {
    results.files.forEach(file => {
      if (file.diagnostics && file.diagnostics.length > 0) {
        output += `\n${file.path}:\n`;
        
        file.diagnostics.forEach(diag => {
          const location = diag.location;
          const startLine = location?.startLine || '?';
          const startCol = location?.startColumn || '?';
          
          output += `  ${startLine}:${startCol}  ${diag.level}  ${diag.message}`;
          if (diag.advice) output += `  (${diag.advice})`;
          output += '\n';
        });
      }
    });
  }
  
  return output;
}

/**
 * Exécute la vérification de typage TypeScript
 */
async function runTypeCheck(): Promise<TypeCheckResult> {
  try {
    // Vérifier si tsc est disponible
    try {
      execSync('npx tsc --version', { stdio: 'ignore' });
    } catch (error) {
      return {
        success: false,
        errorCount: 1,
        warningCount: 0,
        output: 'TypeScript n\'est pas installé. Exécutez `npm install typescript --save-dev` pour l\'installer.'
      };
    }
    
    // Exécuter tsc --noEmit
    const tscOutput = execSync('npx tsc --noEmit', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Si on arrive ici, aucune erreur n'a été trouvée
    return {
      success: true,
      errorCount: 0,
      warningCount: 0,
      output: tscOutput || 'Compilation TypeScript réussie sans erreurs'
    };
  } catch (error) {
    // tsc retourne une erreur si des problèmes de typage sont trouvés
    if (error.stdout || error.stderr) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      
      // Compter les erreurs
      const errorCount = (output.match(/error TS\d+/g) || []).length;
      const warningCount = (output.match(/warning TS\d+/g) || []).length;
      
      // Sauvegarder la sortie complète pour référence
      try {
        const logsDir = path.dirname(CONFIG.outputTypeCheckPath);
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        fs.writeFileSync(CONFIG.outputTypeCheckPath, output);
      } catch (writeError) {
        console.error('Erreur lors de l\'écriture du fichier de log:', writeError);
      }
      
      return {
        success: false,
        errorCount,
        warningCount,
        output
      };
    }
    
    // Pour toute autre erreur
    return {
      success: false,
      errorCount: 1,
      warningCount: 0,
      output: error.message || 'Erreur lors de la vérification TypeScript'
    };
  }
}

/**
 * Vérifie les classes Tailwind CSS
 */
async function runTailwindCheck(): Promise<TailwindCheckResult> {
  try {
    // Vérifier si tailwindcss est disponible
    try {
      execSync('npx tailwindcss --help', { stdio: 'ignore' });
    } catch (error) {
      return {
        success: false,
        unusedClasses: [],
        output: 'Tailwind CSS n\'est pas installé. Exécutez `npm install tailwindcss --save-dev` pour l\'installer.'
      };
    }
    
    // Vérifier si le fichier tailwind.config.js existe
    if (!fs.existsSync(CONFIG.tailwindConfig)) {
      return {
        success: false,
        unusedClasses: [],
        output: 'Le fichier tailwind.config.js n\'a pas été trouvé.'
      };
    }
    
    // Vérifier si le fichier CSS global existe
    if (!fs.existsSync(CONFIG.globalCssPath)) {
      return {
        success: false,
        unusedClasses: [],
        output: 'Le fichier CSS global n\'a pas été trouvé.'
      };
    }
    
    // Exécuter tailwindcss pour trouver les classes inutilisées
    const tailwindCmd = [
      'npx tailwindcss',
      `-i ${CONFIG.globalCssPath}`,
      `--config ${CONFIG.tailwindConfig}`,
      '--content "apps/**/*.{ts,tsx,js,jsx}"',
      '--content "packages/**/*.{ts,tsx,js,jsx}"',
      '--list-only'
    ].join(' ');
    
    const tailwindOutput = execSync(tailwindCmd, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Analyser la sortie pour trouver les classes inutilisées
    // La sortie est au format: "Unused classes: class1, class2, ..."
    const unusedMatch = tailwindOutput.match(/Unused classes:(.*)/);
    const unusedClasses = unusedMatch 
      ? unusedMatch[1].split(',').map(c => c.trim()).filter(Boolean)
      : [];
    
    // Sauvegarder la sortie complète pour référence
    try {
      const logsDir = path.dirname(CONFIG.outputTailwindPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      fs.writeFileSync(CONFIG.outputTailwindPath, tailwindOutput);
    } catch (writeError) {
      console.error('Erreur lors de l\'écriture du fichier de log Tailwind:', writeError);
    }
    
    return {
      success: unusedClasses.length === 0,
      unusedClasses,
      output: tailwindOutput
    };
  } catch (error) {
    return {
      success: false,
      unusedClasses: [],
      output: error.message || 'Erreur lors de la vérification Tailwind CSS'
    };
  }
}

/**
 * Génère un rapport détaillé des résultats de linting
 */
async function generateDetailedReport(report: LinterReport): Promise<void> {
  try {
    // Créer le répertoire de rapports s'il n'existe pas
    const reportsDir = path.dirname(CONFIG.outputReportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Récupérer la date pour le rapport
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Générer le contenu du rapport au format Markdown
    let reportContent = `# Rapport de linting - ${dateStr}\n\n`;
    
    // Générer un résumé
    reportContent += `## 📊 Résumé\n\n`;
    reportContent += `| Outil | Statut | Erreurs | Avertissements |\n`;
    reportContent += `|-------|--------|---------|----------------|\n`;
    
    // ESLint
    if (report.eslint) {
      const eslintStatus = report.eslint.success ? '✅ Succès' : '❌ Échec';
      reportContent += `| ESLint | ${eslintStatus} | ${report.eslint.errorCount} | ${report.eslint.warningCount} |\n`;
    }
    
    // Biome
    if (report.biome) {
      const biomeStatus = report.biome.success ? '✅ Succès' : '⚠️ Avertissement';
      reportContent += `| Biome | ${biomeStatus} | ${report.biome.errorCount} | ${report.biome.warningCount} |\n`;
    }
    
    // TypeScript
    if (report.typeCheck) {
      const tscStatus = report.typeCheck.success ? '✅ Succès' : '❌ Échec';
      reportContent += `| TypeScript | ${tscStatus} | ${report.typeCheck.errorCount} | ${report.typeCheck.warningCount} |\n`;
    }
    
    // Tailwind CSS
    if (report.tailwind) {
      const tailwindStatus = report.tailwind.success ? '✅ Succès' : '⚠️ Avertissement';
      const unusedCount = report.tailwind.unusedClasses.length;
      reportContent += `| Tailwind CSS | ${tailwindStatus} | - | ${unusedCount} classes inutilisées |\n`;
    }
    
    reportContent += `\n`;
    
    // Ajouter les détails pour chaque outil
    if (report.eslint) {
      reportContent += `## ESLint\n\n`;
      if (report.eslint.success && report.eslint.warningCount === 0) {
        reportContent += `✅ Aucun problème détecté par ESLint.\n\n`;
      } else {
        if (report.eslint.errorCount > 0) {
          reportContent += `❌ ${report.eslint.errorCount} erreurs et ${report.eslint.warningCount} avertissements détectés.\n\n`;
        } else {
          reportContent += `⚠️ ${report.eslint.warningCount} avertissements détectés.\n\n`;
        }
        
        // Ajouter un extrait des erreurs
        if (report.eslint.output) {
          reportContent += "```\n";
          
          // Limiter la sortie pour éviter des rapports trop longs
          const outputLines = report.eslint.output.split('\n');
          if (outputLines.length > 50) {
            reportContent += outputLines.slice(0, 50).join('\n');
            reportContent += `\n... et ${outputLines.length - 50} lignes supplémentaires\n`;
          } else {
            reportContent += report.eslint.output;
          }
          
          reportContent += "\n```\n\n";
        }
        
        // Ajouter la liste des fichiers problématiques
        if (report.eslint.files && report.eslint.files.length > 0) {
          reportContent += `### Fichiers avec problèmes:\n\n`;
          report.eslint.files.forEach(file => {
            reportContent += `- \`${file}\`\n`;
          });
          reportContent += `\n`;
        }
      }
    }
    
    if (report.biome) {
      reportContent += `## Biome\n\n`;
      if (report.biome.success && report.biome.warningCount === 0) {
        reportContent += `✅ Aucun problème détecté par Biome.\n\n`;
      } else {
        if (report.biome.errorCount > 0) {
          reportContent += `⚠️ ${report.biome.errorCount} erreurs et ${report.biome.warningCount} avertissements détectés.\n\n`;
        } else {
          reportContent += `⚠️ ${report.biome.warningCount} avertissements détectés.\n\n`;
        }
        
        // Ajouter un extrait des erreurs
        if (report.biome.output) {
          reportContent += "```\n";
          
          // Limiter la sortie pour éviter des rapports trop longs
          const outputLines = report.biome.output.split('\n');
          if (outputLines.length > 50) {
            reportContent += outputLines.slice(0, 50).join('\n');
            reportContent += `\n... et ${outputLines.length - 50} lignes supplémentaires\n`;
          } else {
            reportContent += report.biome.output;
          }
          
          reportContent += "\n```\n\n";
        }
      }
    }
    
    if (report.typeCheck) {
      reportContent += `## TypeScript\n\n`;
      if (report.typeCheck.success) {
        reportContent += `✅ Aucune erreur de typage détectée.\n\n`;
      } else {
        reportContent += `❌ ${report.typeCheck.errorCount} erreurs de typage détectées.\n\n`;
        
        // Ajouter un extrait des erreurs
        if (report.typeCheck.output) {
          reportContent += "```\n";
          
          // Limiter la sortie pour éviter des rapports trop longs
          const outputLines = report.typeCheck.output.split('\n');
          if (outputLines.length > 50) {
            reportContent += outputLines.slice(0, 50).join('\n');
            reportContent += `\n... et ${outputLines.length - 50} lignes supplémentaires\n`;
          } else {
            reportContent += report.typeCheck.output;
          }
          
          reportContent += "\n```\n\n";
        }
        
        reportContent += `Le rapport complet est disponible dans \`${CONFIG.outputTypeCheckPath}\`.\n\n`;
      }
    }
    
    if (report.tailwind) {
      reportContent += `## Tailwind CSS\n\n`;
      if (report.tailwind.success) {
        reportContent += `✅ Aucune classe CSS inutilisée détectée.\n\n`;
      } else {
        const unusedCount = report.tailwind.unusedClasses.length;
        reportContent += `⚠️ ${unusedCount} classes Tailwind inutilisées détectées.\n\n`;
        
        if (unusedCount > 0) {
          reportContent += `### Classes inutilisées:\n\n`;
          
          // Limiter le nombre de classes affichées
          const classesToShow = report.tailwind.unusedClasses.slice(0, 50);
          classesToShow.forEach(className => {
            reportContent += `- \`${className}\`\n`;
          });
          
          if (unusedCount > 50) {
            reportContent += `- ... et ${unusedCount - 50} autres classes\n`;
          }
          
          reportContent += `\n`;
          reportContent += `Le rapport complet est disponible dans \`${CONFIG.outputTailwindPath}\`.\n\n`;
        }
      }
    }
    
    // Ajouter des recommandations basées sur les résultats
    reportContent += `## 🧰 Recommandations\n\n`;
    
    if (report.eslint && !report.eslint.success) {
      reportContent += `### Pour corriger les erreurs ESLint:\n\n`;
      reportContent += `- Exécutez \`npx eslint --fix\` pour corriger automatiquement certains problèmes\n`;
      reportContent += `- Vérifiez les règles dans votre configuration ESLint\n`;
      reportContent += `- Utilisez les commentaires \`// eslint-disable-line\` pour les exceptions lDoDoDoDotgitimes\n\n`;
    }
    
    if (report.biome && !report.biome.success) {
      reportContent += `### Pour corriger les erreurs Biome:\n\n`;
      reportContent += `- Exécutez \`npx @biomejs/biome check --apply\` pour corriger automatiquement certains problèmes\n`;
      reportContent += `- Configurez les règles dans votre fichier biome.json\n\n`;
    }
    
    if (report.typeCheck && !report.typeCheck.success) {
      reportContent += `### Pour corriger les erreurs TypeScript:\n\n`;
      reportContent += `- Vérifiez les types dans les fichiers signalés\n`;
      reportContent += `- Assurez-vous que les importations de types sont correctes\n`;
      reportContent += `- Complétez les définitions de types manquantes\n`;
      reportContent += `- Évitez l'utilisation excessive de \`any\` ou \`ts-ignore\`\n\n`;
    }
    
    if (report.tailwind && !report.tailwind.success) {
      reportContent += `### Pour optimiser Tailwind CSS:\n\n`;
      reportContent += `- Supprimez les classes inutilisées du code\n`;
      reportContent += `- Vérifiez que votre configuration \`content\` dans tailwind.config.js inclut tous les fichiers nécessaires\n`;
      reportContent += `- Utilisez \`tailwind-merge\` pour éviter les duplications de classes\n\n`;
    }
    
    // Ajouter un pied de page
    reportContent += `\n---\n\n`;
    reportContent += `Rapport généré le ${now.toLocaleString()} par l'agent dev-linter.\n`;
    
    // Écrire le rapport dans un fichier
    fs.writeFileSync(CONFIG.outputReportPath, reportContent);
    
    // Écrire les données des échecs au format JSON pour une utilisation ultérieure
    const failures = {
      timestamp: now.toISOString(),
      eslint: report.eslint ? {
        success: report.eslint.success,
        errorCount: report.eslint.errorCount,
        warningCount: report.eslint.warningCount,
        files: report.eslint.files
      } : undefined,
      biome: report.biome ? {
        success: report.biome.success,
        errorCount: report.biome.errorCount,
        warningCount: report.biome.warningCount
      } : undefined,
      typeCheck: report.typeCheck ? {
        success: report.typeCheck.success,
        errorCount: report.typeCheck.errorCount,
        warningCount: report.typeCheck.warningCount
      } : undefined,
      tailwind: report.tailwind ? {
        success: report.tailwind.success,
        unusedClassesCount: report.tailwind.unusedClasses.length
      } : undefined,
      overallStatus: report.overallStatus
    };
    
    fs.writeFileSync(CONFIG.outputFailuresPath, JSON.stringify(failures, null, 2));
    
    console.log(`📝 Rapport généré: ${CONFIG.outputReportPath}`);
  } catch (error) {
    console.error(`Erreur lors de la génération du rapport: ${error.message}`);
  }
}

// Exporter les fonctions pour les tests et la réutilisation
export {
  runESLintCheck,
  runBiomeCheck,
  runTypeCheck,
  runTailwindCheck,
  generateDetailedReport,
  CONFIG
};

// Exécution directe si appelé comme script
if (require.main === module) {
  const options = {
    eslint: !process.argv.includes('--no-eslint'),
    biome: !process.argv.includes('--no-biome'),
    tsc: !process.argv.includes('--no-tsc'),
    tailwind: !process.argv.includes('--no-tailwind')
  };
  
  devLinterAgent.run(options)
    .then(result => {
      console.log(result.logs.join('\n'));
      process.exit(result.overallStatus === 'success' ? 0 : result.overallStatus === 'warning' ? 1 : 2);
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(2);
    });
}


import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';




















































































































































































































































































































































































































































































































































































































































































































































































































































































































































