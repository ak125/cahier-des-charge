import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  remixDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/frontend'),
  nestjsDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/backend'),
  prismaDir: path.join(process.cwd(), 'prisma'),
  aliasPatterns: ['@/', '@backend/', '@frontend/', '~/', 'app/'],
  outputReportPath: path.join(process.cwd(), 'reports/dev_check_report.md'),
  outputFailuresPath: path.join(process.cwd(), 'reports/dev_check_failures.json'),
  outputLogsPath: path.join(process.cwd(), 'logs/dev_check_logs.txt'),
  ignorePatterns: ['node_modules', '.git', 'dist', 'build', '.cache'],
  criticalFiles: ['schema.prisma', 'controller.ts', 'routes.ts', 'app.module.ts'],
  autoFixImports: true,
  autoFixRoutes: true,
};

// Adaptation pour le format d'agent MCP
export const devCheckerAgent = {
  name: 'dev-checker',
  description: 'Valide les intégrations frontend/backend/orm dans le monorepo',
  category: 'quality',
  
  async run(options?: { autoFix?: boolean }): Promise<{ status: string; logs: string[]; fixes?: any[] }> {
    const logs: string[] = [];
    const fixes: any[] = [];
    const autoFix = options?.autoFix || CONFIG.autoFixImports || CONFIG.autoFixRoutes;

    try {
      logs.push('🚀 Lancement du contrôle d'intégration MCP...');
      
      if (autoFix) {
        logs.push('🛠️ Mode correction automatique activé');
      }

      // 1. Vérification des imports alias @/
      logs.push('🔍 Vérification des imports avec alias @/...');
      try {
        const aliasScan = execSync(`grep -r "from '@/" --include="*.ts" --include="*.tsx" apps/ packages/`, {
          stdio: 'pipe',
        }).toString();
        logs.push('✅ Imports avec alias @/ détectés et analysés');
        
        // Vérifier la validité des imports en analysant le résultat
        const invalidImports = validateAliasImports(aliasScan);
        if (invalidImports.length > 0) {
          for (const invalidImport of invalidImports) {
            logs.push(`⚠️ Import suspect : ${invalidImport.file}:${invalidImport.line} - ${invalidImport.import}`);
            
            if (autoFix && CONFIG.autoFixImports) {
              const fixResult = await fixImportAlias(invalidImport.file, invalidImport.line, invalidImport.import);
              if (fixResult.fixed) {
                logs.push(`🛠️ Correction automatique appliquée : ${fixResult.message}`);
                fixes.push(fixResult);
              } else {
                logs.push(`❌ Impossible de corriger automatiquement : ${fixResult.message}`);
              }
            }
          }
        } else {
          logs.push('✅ Tous les imports avec alias semblent valides');
        }
      } catch (error) {
        if (error.status === 1 && !error.stdout.length) {
          logs.push('✅ Aucun import avec alias @/ anormal détecté');
        } else {
          logs.push(`❌ Erreur lors de la vérification des imports : ${error.message}`);
        }
      }

      // 2. Validation des routes Remix
      logs.push('🔍 Vérification des routes Remix...');
      try {
        const remixFiles = execSync(`find apps/frontend/app/routes -name "*.tsx"`, {
          stdio: 'pipe',
        }).toString();
        
        const routeFiles = remixFiles.split('\n').filter(Boolean);
        logs.push(`✅ ${routeFiles.length} routes Remix détectées`);
        
        // Vérifier que les routes sont correctement structurées
        if (routeFiles.length > 0) {
          let validRoutesCount = 0;
          let fixedRoutesCount = 0;
          for (const routeFile of routeFiles) {
            const validationResult = validateRemixRoute(routeFile);
            if (validationResult.valid) {
              validRoutesCount++;
            } else {
              logs.push(`⚠️ Route mal structurée : ${routeFile} - ${validationResult.reason}`);
              
              if (autoFix && CONFIG.autoFixRoutes) {
                const fixResult = await fixRemixRoute(routeFile, validationResult.reason);
                if (fixResult.fixed) {
                  logs.push(`🛠️ Correction automatique de route : ${fixResult.message}`);
                  fixes.push(fixResult);
                  fixedRoutesCount++;
                } else {
                  logs.push(`❌ Impossible de corriger la route : ${fixResult.message}`);
                }
              }
            }
          }
          logs.push(`✅ ${validRoutesCount}/${routeFiles.length} routes correctement structurées`);
          if (fixedRoutesCount > 0) {
            logs.push(`🛠️ ${fixedRoutesCount} routes corrigées automatiquement`);
          }
        }
      } catch (error) {
        logs.push(`❌ Erreur lors de la vérification des routes Remix : ${error.message}`);
      }

      // 3. Validation du fichier Prisma
      logs.push('🔍 Vérification du fichier schema.prisma...');
      try {
        execSync(`npx prisma validate --schema=prisma/schema.prisma`);
        logs.push('✅ schema.prisma valide');
      } catch (error) {
        logs.push(`❌ Erreur schema.prisma : ${error.message}`);
        
        // Pas de correction automatique pour Prisma car trop complexe et risqué
        logs.push('⚠️ Les erreurs du schéma Prisma nécessitent une correction manuelle');
      }

      // 4. Compilation TypeScript à sec
      logs.push('🔍 Vérification compilation TypeScript...');
      try {
        execSync(`tsc --noEmit`, { stdio: 'pipe' });
        logs.push('✅ Compilation TypeScript réussie');
      } catch (error) {
        // Extraire les erreurs de compilation importantes
        const errorOutput = error.message || error.stdout;
        const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
        logs.push(`❌ Compilation TypeScript : ${errorCount} erreurs détectées`);
        
        // Ajouter les 5 premières erreurs pour plus de visibilité
        const errorLines = errorOutput.split('\n')
          .filter(line => line.includes('error TS'))
          .slice(0, 5);
        
        for (const errorLine of errorLines) {
          logs.push(`  - ${errorLine.trim()}`);
        }
        
        if (errorCount > 5) {
          logs.push(`  - et ${errorCount - 5} autres erreurs...`);
        }
      }

      // Générer un rapport détaillé
      generateDetailedReport(logs, fixes);
      
      return { 
        status: 'success', 
        logs,
        fixes: fixes.length > 0 ? fixes : undefined
      };
    } catch (error) {
      logs.push('❌ Erreur détectée : ' + error.message);
      return { status: 'error', logs };
    }
  },
};

// Nouvelles interfaces pour le support d'auto-correction
interface ImportIssue {
  file: string;
  line: number;
  import: string;
}

interface FixResult {
  fixed: boolean;
  message: string;
  file?: string;
  type?: 'import' | 'route' | 'other';
  originalContent?: string;
  newContent?: string;
}

interface RouteValidationResult {
  valid: boolean;
  reason?: string; 
}

// Fonctions auxiliaires améliorées
function validateAliasImports(scanOutput: string): ImportIssue[] {
  const invalidImports: ImportIssue[] = [];
  const lines = scanOutput.split('\n').filter(Boolean);
  
  for (const line of lines) {
    // Format typique: "file.ts:10:import X from '@/path'"
    const parts = line.split(':');
    if (parts.length >= 2) {
      const file = parts[0];
      const lineNumber = parseInt(parts[1], 10);
      const importStatement = parts.slice(2).join(':').trim();
      
      // Vérifier si l'import est bien formé et pointe vers un fichier existant
      if (!hasValidTsConfigPath() || !isValidImport(file, importStatement)) {
        invalidImports.push({
          file,
          line: lineNumber,
          import: importStatement
        });
      }
    }
  }
  
  return invalidImports;
}

function hasValidTsConfigPath(): boolean {
  try {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) return false;
    
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    return !!tsConfig.compilerOptions?.paths?.['@/*'];
  } catch (error) {
    return false;
  }
}

function isValidImport(filePath: string, importStatement: string): boolean {
  try {
    // Extraire le chemin d'import
    const match = importStatement.match(/from\s+['"](@\/.+?)['"]/);
    if (!match) return true; // Pas un import avec alias @/
    
    const importPath = match[1];
    
    // Vérifier dans tsconfig.json comment l'alias @/ est mappé
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    const aliasMapping = tsConfig.compilerOptions?.paths?.['@/*']?.[0];
    
    if (!aliasMapping) return false;
    
    // Convertir l'import en chemin relatif au système de fichiers
    const relativePath = importPath.replace('@/', '');
    const targetPath = path.join(process.cwd(), aliasMapping.replace('*', ''), relativePath);
    
    // Vérifier si le fichier existe avec différentes extensions
    return fs.existsSync(targetPath) || 
           fs.existsSync(targetPath + '.ts') || 
           fs.existsSync(targetPath + '.tsx') || 
           fs.existsSync(targetPath + '.js') || 
           fs.existsSync(targetPath + '.jsx') || 
           fs.existsSync(path.join(targetPath, 'index.ts')) || 
           fs.existsSync(path.join(targetPath, 'index.tsx')) || 
           fs.existsSync(path.join(targetPath, 'index.js')) || 
           fs.existsSync(path.join(targetPath, 'index.jsx'));
  } catch (error) {
    return false;
  }
}

async function fixImportAlias(filePath: string, lineNumber: number, importStatement: string): Promise<FixResult> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    if (lineNumber < 0 || lineNumber >= lines.length) {
      return { 
        fixed: false, 
        message: `Numéro de ligne ${lineNumber} invalide pour le fichier ${filePath}` 
      };
    }
    
    const line = lines[lineNumber];
    
    // Extraire le chemin d'import
    const match = line.match(/from\s+['"](@\/.+?)['"]/);
    if (!match) {
      return { 
        fixed: false, 
        message: 'Format d\'import non reconnu' 
      };
    }
    
    const importPath = match[1];
    
    // Essayer de trouver le bon chemin pour l'import
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    const aliasMapping = tsConfig.compilerOptions?.paths?.['@/*']?.[0];
    
    if (!aliasMapping) {
      return { 
        fixed: false, 
        message: 'Alias @/ non défini dans tsconfig.json' 
      };
    }
    
    // Convertir l'import en chemin relatif au système de fichiers
    const relativePath = importPath.replace('@/', '');
    const basePath = path.join(process.cwd(), aliasMapping.replace('*', ''));
    
    // Rechercher le fichier avec différentes extensions
    const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    let correctPath = null;
    let isDirectory = false;
    
    for (const ext of possibleExtensions) {
      const targetPath = path.join(basePath, relativePath + ext);
      if (fs.existsSync(targetPath)) {
        correctPath = relativePath + ext;
        isDirectory = fs.statSync(targetPath).isDirectory();
        break;
      }
    }
    
    // Vérifier s'il s'agit d'un répertoire avec un fichier index
    if (isDirectory || !correctPath) {
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const indexPath = path.join(basePath, relativePath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          correctPath = path.join(relativePath, 'index' + ext);
          break;
        }
      }
    }
    
    if (!correctPath) {
      return { 
        fixed: false, 
        message: `Impossible de trouver un chemin valide pour l'import ${importPath}` 
      };
    }
    
    // Corriger l'import
    const correctedImport = line.replace(importPath, '@/' + correctPath.replace(/\\/g, '/'));
    lines[lineNumber] = correctedImport;
    
    // Écrire les modifications dans le fichier
    fs.writeFileSync(filePath, lines.join('\n'));
    
    return { 
      fixed: true, 
      message: `Import corrigé dans ${filePath}:${lineNumber}`, 
      file: filePath,
      type: 'import',
      originalContent: line,
      newContent: correctedImport
    };
  } catch (error) {
    return { 
      fixed: false, 
      message: `Erreur lors de la correction de l'import: ${error.message}` 
    };
  }
}

function validateRemixRoute(routePath: string): RouteValidationResult {
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Vérifier la présence d'un export par défaut (nécessaire pour les routes Remix)
    if (!content.includes('export default') && 
        !content.includes('export { default }')) {
      return { 
        valid: false, 
        reason: 'missing_default_export' 
      };
    }
    
    // Vérifier si les exports nécessaires pour les actions/loaders sont présents
    const needsLoader = content.includes('useLoaderData') && !content.includes('export const loader');
    if (needsLoader) {
      return { 
        valid: false, 
        reason: 'missing_loader' 
      };
    }
    
    const needsAction = content.includes('useActionData') && !content.includes('export const action');
    if (needsAction) {
      return { 
        valid: false, 
        reason: 'missing_action' 
      };
    }
    
    // Vérifier la convention de nommage des fichiers de route
    const fileName = path.basename(routePath);
    const validPattern = /^(\$.+|_?.+|index)\.tsx$/;
    
    if (!validPattern.test(fileName)) {
      return { 
        valid: false, 
        reason: 'invalid_filename' 
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      reason: `error_reading_file: ${error.message}` 
    };
  }
}

async function fixRemixRoute(routePath: string, reason: string): Promise<FixResult> {
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    let newContent = content;
    let fixed = false;
    let message = '';
    
    switch(reason) {
      case 'missing_default_export':
        // Ajouter un export par défaut si le composant existe mais n'est pas exporté
        const componentNameMatch = content.match(/function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/);
        if (componentNameMatch) {
          const componentName = componentNameMatch[1];
          if (!content.includes(`export default ${componentName}`)) {
            newContent = content + `\n\nexport default ${componentName};\n`;
            message = `Ajout de 'export default ${componentName}' à la route ${routePath}`;
            fixed = true;
          }
        } else {
          message = 'Impossible de trouver le nom du composant pour ajouter export default';
        }
        break;
        
      case 'missing_loader':
        // Ajouter un loader minimal
        if (!content.includes('export const loader')) {
          const loaderCode = `
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // TODO: Implémentez le loader correctement
  return json({});
};
`;
          // Ajouter les imports nécessaires s'ils n'existent pas
          if (!content.includes('import { json }')) {
            newContent = content.replace(/import.*?from.*?;/, (match) => 
              match + '\nimport { json, type LoaderFunctionArgs } from "@remix-run/node";'
            );
          }
          
          // Ajouter le loader avant le composant
          newContent = newContent.replace(/function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/, (match) => 
            loaderCode + '\n' + match
          );
          
          message = `Ajout d'un loader minimal à la route ${routePath}`;
          fixed = true;
        }
        break;
        
      case 'missing_action':
        // Ajouter une action minimale
        if (!content.includes('export const action')) {
          const actionCode = `
export const action = async ({ request, params }: ActionFunctionArgs) => {
  // TODO: Implémentez l'action correctement
  return json({});
};
`;
          // Ajouter les imports nécessaires s'ils n'existent pas
          if (!content.includes('import { json }')) {
            newContent = content.replace(/import.*?from.*?;/, (match) => 
              match + '\nimport { json, type ActionFunctionArgs } from "@remix-run/node";'
            );
          }
          
          // Ajouter l'action avant le composant
          newContent = newContent.replace(/function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/, (match) => 
            actionCode + '\n' + match
          );
          
          message = `Ajout d'une action minimale à la route ${routePath}`;
          fixed = true;
        }
        break;
        
      case 'invalid_filename':
        // Renommer le fichier selon les conventions Remix
        const dirName = path.dirname(routePath);
        const fileName = path.basename(routePath);
        
        // Appliquer la convention de nommage correcte
        let newFileName = fileName;
        
        // Si c'est une route dynamique mais sans $
        if (fileName.includes('[') && fileName.includes(']') && !fileName.startsWith('$')) {
          newFileName = '$' + fileName.replace(/\[([^\]]+)\]/g, '$1');
        }
        
        // Si c'est une route de présentation sans _
        if (!fileName.startsWith('_') && 
            !fileName.startsWith('$') && 
            !fileName.startsWith('index') && 
            content.includes('Outlet')) {
          newFileName = '_' + fileName;
        }
        
        if (newFileName !== fileName) {
          const newPath = path.join(dirName, newFileName);
          fs.renameSync(routePath, newPath);
          message = `Fichier renommé de ${fileName} vers ${newFileName}`;
          fixed = true;
        } else {
          message = 'Impossible de déterminer le bon format de nom pour le fichier';
        }
        break;
        
      default:
        message = `Type d'erreur non pris en charge: ${reason}`;
    }
    
    if (fixed && newContent !== content) {
      fs.writeFileSync(routePath, newContent);
    }
    
    return { 
      fixed, 
      message, 
      file: routePath,
      type: 'route',
      originalContent: content,
      newContent: newContent
    };
  } catch (error) {
    return { 
      fixed: false, 
      message: `Erreur lors de la correction de la route: ${error.message}` 
    };
  }
}

function generateDetailedReport(logs: string[], fixes: any[] = []): void {
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
    let reportContent = `# Rapport de vérification du code - ${dateStr}\n\n`;
    
    // Ajouter un résumé
    const errorCount = logs.filter(log => log.includes('❌')).length;
    const warningCount = logs.filter(log => log.includes('⚠️')).length;
    const successCount = logs.filter(log => log.includes('✅')).length;
    const fixCount = fixes.length;
    
    reportContent += `## 📊 Résumé\n\n`;
    reportContent += `| Catégorie | Nombre |\n`;
    reportContent += `|-----------|--------|\n`;
    reportContent += `| ✅ Succès | ${successCount} |\n`;
    reportContent += `| ⚠️ Avertissements | ${warningCount} |\n`;
    reportContent += `| ❌ Erreurs | ${errorCount} |\n`;
    
    if (fixCount > 0) {
      reportContent += `| 🛠️ Corrections automatiques | ${fixCount} |\n`;
    }
    
    reportContent += `\n`;
    
    // Ajouter les détails
    reportContent += `## 🔍 Détails\n\n`;
    
    let currentSection = '';
    for (const log of logs) {
      let formattedLog = log;
      
      if (log.startsWith('🔍') || log.startsWith('🚀')) {
        currentSection = log.replace('🔍 ', '').replace('🚀 ', '');
        formattedLog = `### ${log}\n`;
      } else if (log.startsWith('✅')) {
        formattedLog = `- ${log}\n`;
      } else if (log.startsWith('❌')) {
        formattedLog = `- **${log}**\n`;
      } else if (log.startsWith('⚠️')) {
        formattedLog = `- _${log}_\n`;
      } else if (log.startsWith('🛠️')) {
        formattedLog = `- ${log}\n`;
      } else if (log.startsWith('  -')) {
        formattedLog = `  ${log}\n`;
      } else {
        formattedLog = `- ${log}\n`;
      }
      
      reportContent += formattedLog;
    }
    
    // Ajouter les détails des corrections automatiques
    if (fixes.length > 0) {
      reportContent += `\n## 🛠️ Corrections automatiques\n\n`;
      
      fixes.forEach((fix, index) => {
        reportContent += `### ${index + 1}. ${fix.message}\n\n`;
        reportContent += `- **Fichier**: \`${fix.file}\`\n`;
        reportContent += `- **Type**: ${fix.type === 'import' ? 'Import' : fix.type === 'route' ? 'Route Remix' : 'Autre'}\n`;
        
        if (fix.originalContent && fix.newContent) {
          reportContent += `\n**Avant**:\n\`\`\`typescript\n${fix.originalContent}\n\`\`\`\n\n`;
          reportContent += `**Après**:\n\`\`\`typescript\n${fix.newContent}\n\`\`\`\n\n`;
        }
      });
    }
    
    // Ajouter des recommandations
    const hasPrismaErrors = logs.some(log => log.includes('schema.prisma') && log.includes('❌'));
    const hasTypeScriptErrors = logs.some(log => log.includes('Compilation TypeScript') && log.includes('❌'));
    
    if (hasPrismaErrors || hasTypeScriptErrors) {
      reportContent += `\n## 🧰 Recommandations\n\n`;
      
      if (hasPrismaErrors) {
        reportContent += `### Erreurs Prisma\n\n`;
        reportContent += `- Exécutez \`npx prisma validate\` pour voir les détails complets des erreurs\n`;
        reportContent += `- Utilisez \`npx prisma format\` pour formatter automatiquement votre schéma\n`;
        reportContent += `- Vérifiez la cohérence des relations entre les modèles\n\n`;
      }
      
      if (hasTypeScriptErrors) {
        reportContent += `### Erreurs TypeScript\n\n`;
        reportContent += `- Exécutez \`tsc --noEmit\` pour voir toutes les erreurs TypeScript\n`;
        reportContent += `- Utilisez votre IDE pour naviguer facilement entre les erreurs\n`;
        reportContent += `- Vérifiez les types importés depuis les bibliothèques externes\n\n`;
      }
    }
    
    // Ajouter un pied de page
    reportContent += `\n---\n\n`;
    reportContent += `Rapport généré le ${now.toLocaleString()} par l'agent dev-checker.\n`;
    
    // Écrire le rapport dans un fichier
    fs.writeFileSync(CONFIG.outputReportPath, reportContent);
    
    // Écrire les données des échecs au format JSON pour une utilisation ultérieure
    const failures = {
      timestamp: now.toISOString(),
      errors: logs.filter(log => log.includes('❌')),
      warnings: logs.filter(log => log.includes('⚠️')),
      fixes: fixes,
      summary: {
        errorCount,
        warningCount,
        successCount,
        fixCount
      }
    };
    
    fs.writeFileSync(CONFIG.outputFailuresPath, JSON.stringify(failures, null, 2));
    
    console.log(`📝 Rapport généré: ${CONFIG.outputReportPath}`);
  } catch (error) {
    console.error(`Erreur lors de la génération du rapport: ${error.message}`);
  }
}

// Exporter les fonctions pour les tests et la réutilisation
export {
  validateAliasImports,
  validateRemixRoute,
  fixImportAlias,
  fixRemixRoute,
  generateDetailedReport,
  CONFIG,
};

// Exécution directe si appelé comme script
if (require.main === module) {
  devCheckerAgent.run({ autoFix: process.argv.includes('--fix') })
    .then(result => {
      console.log(result.logs.join('\n'));
      if (result.fixes && result.fixes.length > 0) {
        console.log(`\n🛠️ ${result.fixes.length} corrections automatiques appliquées`);
      }
      process.exit(result.status === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}