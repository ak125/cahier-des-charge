import { createClient } from @supabase/supabase-jsstructure-agent';
import { createLogger } from ./loggerstructure-agent';
import fs from fsstructure-agent';
import path from pathstructure-agent';

const logger = createLogger('audit-saver');

// Initialisation du client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient>;

/**
 * Initialise la connexion Supabase
 */
export function initSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    logger.warn('Variables d\'environnement SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définies');
    return false;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('Connexion Supabase initialisée avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de Supabase:', error);
    return false;
  }
}

/**
 * Sauvegarde le résultat d'un audit PHP dans Supabase
 */
export async function saveAuditResult(filePath: string, result: any) {
  // Vérification de l'initialisation de Supabase
  if (!supabase) {
    if (!initSupabase()) {
      logger.error(`Impossible de sauvegarder l'audit pour ${filePath}: Supabase non initialisé`);
      return { success: false, error: 'Supabase non initialisé' };
    }
  }

  try {
    // Extraction du nom du fichier
    const fileName = path.basename(filePath);
    
    // Préparation des tags pour faciliter le filtrage
    const tags: string[] = [];
    
    // Ajouter des tags basés sur le nom du fichier et le contenu
    if (fileName.includes('Controller')) tags.push('controller');
    if (fileName.includes('Model')) tags.push('model');
    if (fileName.includes('Repository')) tags.push('repository');
    if (fileName.includes('Service')) tags.push('service');
    
    // Ajouter des tags basés sur les classes trouvées
    if (result.classes && result.classes.length > 0) {
      result.classes.forEach((cls: any) => {
        if (cls.name.includes('Controller')) tags.push('controller');
        if (cls.name.includes('Model')) tags.push('model');
        if (cls.name.includes('Repository')) tags.push('repository');
        if (cls.name.includes('Service')) tags.push('service');
      });
    }

    // Convertir le chemin en chemin relatif sans extension pour l'ID
    const relativePathNoExt = filePath.replace(/^.*[\\\/]src[\\\/]/, '').replace('.php', '');
    
    // Données à insérer dans Supabase
    const auditData = {
      id: `php:${relativePathNoExt}`,
      path: filePath,
      filename: fileName,
      result_json: result,
      analyzed_at: new Date().toISOString(),
      file_size: result.fileSize || 0,
      lines_of_code: result.linesOfCode || 0,
      classes_count: result.classes?.length || 0,
      functions_count: result.functions?.length || 0,
      complexity: result.complexity?.cyclomaticComplexity || 0,
      maintainability: result.complexity?.maintainabilityIndex || 0,
      issues_count: result.issues?.length || 0,
      tags
    };

    // Insertion ou mise à jour dans Supabase
    const { data, error } = await supabase
      .from('php_audit_results')
      .upsert(auditData, { onConflict: 'id' });

    if (error) {
      logger.error(`Erreur lors de l'insertion dans Supabase pour ${filePath}:`, error);
      return { success: false, error: error.message };
    }

    logger.info(`Audit enregistré avec succès pour ${filePath}`);
    return { success: true, data };
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde de l'audit pour ${filePath}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Sauvegarde le résultat d'un audit PHP localement
 */
export function saveAuditLocally(filePath: string, result: any, outputDir = './output') {
  try {
    // Création du répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extraction du nom du fichier
    const fileName = path.basename(filePath, '.php');
    
    // Chemin de sortie pour le fichier JSON
    const outputPath = path.join(outputDir, `${fileName}.audit.json`);
    
    // Écriture du fichier JSON
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    
    // Création d'un fichier Markdown pour une visualisation plus facile
    const mdOutputPath = path.join(outputDir, `${fileName}.audit.md`);
    const mdContent = generateMarkdownReport(filePath, result);
    fs.writeFileSync(mdOutputPath, mdContent, 'utf8');
    
    logger.info(`Audit enregistré localement dans ${outputPath} et ${mdOutputPath}`);
    return { success: true, outputPath, mdOutputPath };
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde locale de l'audit pour ${filePath}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Génère un rapport Markdown à partir des résultats d'audit
 */
function generateMarkdownReport(filePath: string, result: any): string {
  const fileName = path.basename(filePath);
  
  // En-tête du rapport
  let markdown = `# Audit PHP : ${fileName}\n\n`;
  
  // Métriques globales
  markdown += `## Métriques globales\n\n`;
  markdown += `- **Fichier:** \`${filePath}\`\n`;
  markdown += `- **Taille:** ${formatFileSize(result.fileSize || 0)}\n`;
  markdown += `- **Lignes de code:** ${result.linesOfCode || 0}\n`;
  markdown += `- **Lignes de commentaires:** ${result.commentLines || 0}\n`;
  markdown += `- **Ratio code/commentaires:** ${result.codeToCommentRatio?.toFixed(2) || 'N/A'}\n`;
  markdown += `- **Complexité cyclomatique:** ${result.complexity?.cyclomaticComplexity || 'N/A'}\n`;
  markdown += `- **Indice de maintenabilité:** ${result.complexity?.maintainabilityIndex || 'N/A'}/100\n\n`;
  
  // Résumé des classes
  if (result.classes && result.classes.length > 0) {
    markdown += `## Classes (${result.classes.length})\n\n`;
    
    result.classes.forEach((cls: any) => {
      markdown += `### ${cls.type === 'class' ? 'Classe' : cls.type === 'interface' ? 'Interface' : 'Trait'} \`${cls.name}\`\n\n`;
      
      if (cls.namespace) {
        markdown += `- **Namespace:** \`${cls.namespace}\`\n`;
      }
      
      if (cls.extends) {
        markdown += `- **Extends:** \`${cls.extends}\`\n`;
      }
      
      if (cls.implements && cls.implements.length) {
        markdown += `- **Implements:** ${cls.implements.map((i: string) => `\`${i}\``).join(', ')}\n`;
      }
      
      markdown += `- **Visibilité:** ${cls.visibility}\n`;
      markdown += `- **Propriétés:** ${cls.properties.length}\n`;
      markdown += `- **Méthodes:** ${cls.methods.length}\n\n`;
      
      if (cls.methods.length > 0) {
        markdown += `#### Méthodes\n\n`;
        markdown += `| Nom | Visibilité | Statique | Paramètres | Complexité | Lignes |\n`;
        markdown += `|-----|------------|----------|------------|------------|--------|\n`;
        
        cls.methods.forEach((method: any) => {
          markdown += `| \`${method.name}\` | ${method.visibility} | ${method.isStatic ? 'Oui' : 'Non'} | ${method.parameters.length} | ${method.complexity} | ${method.linesOfCode} |\n`;
        });
        
        markdown += `\n`;
      }
    });
  }
  
  // Résumé des fonctions
  if (result.functions && result.functions.length > 0) {
    markdown += `## Fonctions (${result.functions.length})\n\n`;
    markdown += `| Nom | Paramètres | Complexité | Lignes |\n`;
    markdown += `|-----|------------|------------|--------|\n`;
    
    result.functions.forEach((func: any) => {
      markdown += `| \`${func.name}\` | ${func.parameters.length} | ${func.complexity} | ${func.linesOfCode} |\n`;
    });
    
    markdown += `\n`;
  }
  
  // Problèmes détectés
  if (result.issues && result.issues.length > 0) {
    markdown += `## Problèmes détectés (${result.issues.length})\n\n`;
    markdown += `| Type | Message | Ligne |\n`;
    markdown += `|------|---------|-------|\n`;
    
    result.issues.forEach((issue: any) => {
      const line = issue.location?.start?.line || 'N/A';
      markdown += `| ${issue.type} | ${issue.message} | ${line} |\n`;
    });
    
    markdown += `\n`;
  } else {
    markdown += `## Problèmes détectés\n\nAucun problème détecté.\n\n`;
  }
  
  // Dépendances
  if (result.dependencies && result.dependencies.length > 0) {
    markdown += `## Dépendances (${result.dependencies.length})\n\n`;
    result.dependencies.forEach((dep: string) => {
      markdown += `- \`${dep}\`\n`;
    });
    markdown += `\n`;
  }
  
  // Pied de page
  markdown += `---\n\n`;
  markdown += `*Rapport généré par MCP PHP Analyzer le ${new Date().toISOString()}*\n`;
  
  return markdown;
}

/**
 * Formate la taille d'un fichier en unités lisibles
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}