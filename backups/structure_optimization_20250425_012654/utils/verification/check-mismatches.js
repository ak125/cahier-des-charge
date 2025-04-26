#!/usr/bin/env node

/**
 * Script de vérification des incohérences entre documentation et code
 */

const fs = require(fsstructure-agent').promises;
const path = require(pathstructure-agent');
const chalk = require(chalkstructure-agent');
const glob = require(globstructure-agent');
const { promisify } = require(utilstructure-agent');

const globPromise = promisify(glob);

// Configuration
const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');
const SRC_DIR = path.join(process.cwd(), 'src');
const REPORT_DIR = path.join(process.cwd(), 'reports');

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log(chalk.blue('🔍 Vérification des incohérences entre documentation et code...'));
    
    // Créer le répertoire de rapports s'il n'existe pas
    await fs.mkdir(REPORT_DIR, { recursive: true }).catch(() => {});
    
    // Analyser les fichiers de documentation et de code
    const docFiles = await globPromise(`${CDC_DIR}/**/*.md`);
    const codeFiles = await globPromise(`${SRC_DIR}/**/*.{ts,js}`);
    
    console.log(chalk.blue(`📁 Fichiers à analyser: ${docFiles.length} docs, ${codeFiles.length} code`));
    
    // Version simplifiée de la détection
    const mismatches = await detectSimpleMismatches(docFiles, codeFiles);
    
    // Générer un rapport
    const reportPath = await generateReport(mismatches);
    
    if (mismatches.length > 0) {
      console.log(chalk.yellow(`⚠️ ${mismatches.length} incohérences détectées`));
      console.log(chalk.yellow(`📊 Rapport généré: ${reportPath}`));
      
      // Afficher un résumé
      console.log(chalk.yellow('\n=== Résumé des incohérences ==='));
      
      // Regrouper par type
      const byType = mismatches.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {});
      
      for (const [type, count] of Object.entries(byType)) {
        console.log(chalk.yellow(`${type}: ${count} incohérences`));
      }
      
      // Afficher quelques exemples critiques
      const criticalMismatches = mismatches.filter(m => m.severity === 'critical');
      if (criticalMismatches.length > 0) {
        console.log(chalk.red('\n❌ Incohérences critiques:'));
        criticalMismatches.slice(0, 3).forEach(m => {
          console.log(chalk.red(`- ${m.description} (${m.details.documentPath} ↔ ${m.details.codePath})`));
        });
      }
      
      process.exit(mismatches.filter(m => m.severity === 'critical').length > 0 ? 1 : 0);
    } else {
      console.log(chalk.green('✅ Aucune incohérence détectée'));
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Détecte les incohérences simples
 */
async function detectSimpleMismatches(docFiles, codeFiles) {
  // Version simplifiée - dans un vrai système, utilisez l'analyse AST et sémantique
  const mismatches = [];
  
  // 1. Extraire des API de la documentation
  const docApis = [];
  for (const file of docFiles) {
    const content = await fs.readFile(file, 'utf8');
    
    // Rechercher des patterns d'API dans la documentation
    const apiMatches = content.matchAll(/`([a-zA-Z][a-zA-Z0-9]*)\(([^)]*)\)`/g);
    
    for (const match of apiMatches) {
      const apiName = match[1];
      const apiParams = match[2].split(',').map(p => p.trim());
      
      docApis.push({
        name: apiName,
        params: apiParams,
        file: path.relative(CDC_DIR, file),
        line: getLineNumber(content, match.index)
      });
    }
  }
  
  // 2. Extraire des API du code
  const codeApis = [];
  for (const file of codeFiles) {
    const content = await fs.readFile(file, 'utf8');
    
    // Rechercher des définitions de fonctions dans le code
    const fnMatches = content.matchAll(/(?:function|async function)\s+([a-zA-Z][a-zA-Z0-9]*)\s*\(([^)]*)\)/g);
    const methodMatches = content.matchAll(/(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*\(([^)]*)\)\s*{/g);
    
    for (const match of [...fnMatches, ...methodMatches]) {
      const fnName = match[1];
      const fnParams = match[2].split(',').map(p => {
        // Extraire juste le nom du paramètre (sans type)
        const paramParts = p.trim().split(':');
        return paramParts[0].trim();
      }).filter(Boolean);
      
      codeApis.push({
        name: fnName,
        params: fnParams,
        file: path.relative(SRC_DIR, file),
        line: getLineNumber(content, match.index)
      });
    }
  }
  
  // 3. Comparer les APIs
  for (const docApi of docApis) {
    // Trouver des correspondances potentielles
    const matchingCodeApis = codeApis.filter(api => api.name === docApi.name);
    
    if (matchingCodeApis.length === 0) {
      // API dans la doc mais pas dans le code
      mismatches.push({
        type: 'missing_implementation',
        severity: 'high',
        description: `API documentée mais non implémentée: ${docApi.name}`,
        details: {
          documentPath: path.join(CDC_DIR, docApi.file),
          documentLocation: {
            line: docApi.line,
            context: `API: ${docApi.name}(${docApi.params.join(', ')})`
          },
          codePath: 'N/A'
        }
      });
    } else {
      // Vérifier la compatibilité des paramètres
      for (const codeApi of matchingCodeApis) {
        // Comparaison simple des paramètres (dans un vrai système, analyse plus sophistiquée)
        if (docApi.params.length !== codeApi.params.length) {
          mismatches.push({
            type: 'api_signature_mismatch',
            severity: 'critical',
            description: `Signature d'API incompatible: ${docApi.name}`,
            details: {
              documentPath: path.join(CDC_DIR, docApi.file),
              documentLocation: {
                line: docApi.line,
                context: `API Doc: ${docApi.name}(${docApi.params.join(', ')})`
              },
              codePath: path.join(SRC_DIR, codeApi.file),
              codeLocation: {
                line: codeApi.line,
                context: `API Code: ${codeApi.name}(${codeApi.params.join(', ')})`
              },
              diff: {
                docParams: docApi.params,
                codeParams: codeApi.params
              }
            }
          });
        }
      }
    }
  }
  
  // Plus de détections...
  
  return mismatches;
}

/**
 * Obtient le numéro de ligne d'une position dans un texte
 */
function getLineNumber(content, position) {
  return content.substring(0, position).split('\n').length;
}

/**
 * Génère un rapport d'incohérences
 */
async function generateReport(mismatches) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `mismatches-${timestamp}.json`);
  
  const report = {
    timestamp,
    mismatches,
    summary: {
      total: mismatches.length,
      bySeverity: {
        critical: mismatches.filter(m => m.severity === 'critical').length,
        high: mismatches.filter(m => m.severity === 'high').length,
        medium: mismatches.filter(m => m.severity === 'medium').length,
        low: mismatches.filter(m => m.severity === 'low').length
      }
    }
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return reportPath;
}

// Exécuter le script
main();
