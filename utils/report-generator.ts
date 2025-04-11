import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

/**
 * Génère un rapport de vérification au format Markdown
 */
export async function generateVerificationReport(
  results: VerificationResult[],
  config: any
): Promise<string> {
  // Créer le répertoire de logs si nécessaire
  const logsDir = resolve(config.paths.logs);
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
  
  // Préparer le chemin du fichier de rapport
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const reportPath = join(logsDir, `verification-report-${timestamp}.md`);
  
  // Générer le contenu du rapport
  let reportContent = `# Rapport de vérification du cahier des charges\n\n`;
  reportContent += `*Généré le ${now.toLocaleString()}*\n\n`;
  
  // Résumé
  const totalFiles = new Set(results.map(r => r.file)).size;
  const totalChecks = results.length;
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  reportContent += `## 📊 Résumé\n\n`;
  reportContent += `- **Fichiers vérifiés**: ${totalFiles}\n`;
  reportContent += `- **Vérifications effectuées**: ${totalChecks}\n`;
  reportContent += `- **Résultats**:\n`;
  reportContent += `  - ✅ Succès: ${successCount}\n`;
  reportContent += `  - ⚠️ Avertissements: ${warningCount}\n`;
  reportContent += `  - ❌ Erreurs: ${errorCount}\n\n`;
  
  // Regrouper les résultats par type
  const byType = {
    md: results.filter(r => r.fileType === 'md'),
    json: results.filter(r => r.fileType === 'json'),
    ts: results.filter(r => r.fileType === 'ts')
  };
  
  // Ajouter les sections par type de fichier
  reportContent += `## 📄 Fichiers Markdown\n\n`;
  reportContent += formatResultsSection(byType.md);
  
  reportContent += `## 🔧 Fichiers JSON\n\n`;
  reportContent += formatResultsSection(byType.json);
  
  reportContent += `## 💻 Fichiers TypeScript\n\n`;
  reportContent += formatResultsSection(byType.ts);
  
  // Ajouter les actions recommandées
  reportContent += `## 📋 Actions recommandées\n\n`;
  
  if (errorCount > 0) {
    reportContent += `### Erreurs critiques à corriger\n\n`;
    results.filter(r => r.status === 'error').forEach(result => {
      reportContent += `- ❌ **${result.file}**: ${result.message}\n`;
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          reportContent += `  - ${detail}\n`;
        });
      }
    });
    reportContent += `\n`;
  }
  
  if (warningCount > 0) {
    reportContent += `### Avertissements à considérer\n\n`;
    results.filter(r => r.status === 'warning').forEach(result => {
      reportContent += `- ⚠️ **${result.file}**: ${result.message}\n`;
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          reportContent += `  - ${detail}\n`;
        });
      }
    });
    reportContent += `\n`;
  }
  
  // Conclusion
  reportContent += `## 🏁 Conclusion\n\n`;
  
  if (errorCount === 0 && warningCount === 0) {
    reportContent += `✅ **Excellent!** Aucun problème détecté dans le cahier des charges.\n`;
  } else if (errorCount === 0) {
    reportContent += `⚠️ **Bien!** Le cahier des charges ne contient pas d'erreurs critiques, mais quelques avertissements à considérer.\n`;
  } else {
    reportContent += `❌ **Attention!** Le cahier des charges contient des erreurs qui doivent être corrigées avant de continuer.\n`;
  }
  
  // Écrire le rapport
  writeFileSync(reportPath, reportContent);
  
  return reportPath;
}

/**
 * Formate une section de résultats pour un type de fichier
 */
function formatResultsSection(results: VerificationResult[]): string {
  if (results.length === 0) {
    return 'Aucun fichier vérifié.\n\n';
  }
  
  let content = '';
  
  // Extraire les fichiers uniques
  const uniqueFiles = [...new Set(results.map(r => r.file))];
  
  // Regrouper les résultats par fichier
  for (const file of uniqueFiles) {
    const fileResults = results.filter(r => r.file === file);
    const fileSuccess = fileResults.every(r => r.status === 'success');
    const status = fileSuccess ? '✅' : fileResults.some(r => r.status === 'error') ? '❌' : '⚠️';
    
    content += `### ${status} ${file}\n\n`;
    
    for (const result of fileResults) {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      content += `- ${icon} ${result.message}\n`;
      
      if (result.details && result.details.length > 0) {
        for (const detail of result.details) {
          content += `  - ${detail}\n`;
        }
      }
    }
    
    content += '\n';
  }
  
  return content;
}
