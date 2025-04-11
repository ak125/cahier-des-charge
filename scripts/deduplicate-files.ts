import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { createHash } from 'crypto';

// Charger la configuration
async function getConfig() {
  const configPath = path.resolve('./cahier_check.config.json');
  const configData = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configData);
}

// Interface pour représenter un groupe de fichiers similaires
interface SimilarFilesGroup {
  baseFileName: string;
  files: {
    path: string;
    hash: string;
    size: number;
    modified: Date;
  }[];
}

// Interface pour les résultats de déduplication
interface DeduplicationResult {
  type: string;
  duplicatesFound: number;
  filesRemoved: number;
  filesMerged: number;
  groups: SimilarFilesGroup[];
}

// Exécute la déduplication des fichiers
async function deduplicateFiles(): Promise<void> {
  console.log(chalk.blue('🔍 Démarrage de la déduplication des fichiers...'));
  
  try {
    const config = await getConfig();
    const cahierPath = path.resolve(config.paths.cahier);
    
    // Trouver et dédupliciter les fichiers par type
    const mdResult = await deduplicateFilesByType(cahierPath, '.md');
    const jsonResult = await deduplicateFilesByType(cahierPath, '.json');
    const tsResult = await deduplicateFilesByType(cahierPath, '.ts');
    
    // Afficher les résultats
    console.log(chalk.green('\n✅ Déduplication terminée!'));
    console.log(chalk.white(`📊 Résumé:`));
    
    console.log(chalk.blue(`📄 Fichiers Markdown:`));
    printResult(mdResult);
    
    console.log(chalk.blue(`🔧 Fichiers JSON:`));
    printResult(jsonResult);
    
    console.log(chalk.blue(`💻 Fichiers TypeScript:`));
    printResult(tsResult);
    
    // Créer un rapport de déduplication
    await createDeduplicationReport(cahierPath, [mdResult, jsonResult, tsResult]);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la déduplication: ${error.message}`));
    process.exit(1);
  }
}

// Affiche le résultat pour un type de fichier
function printResult(result: DeduplicationResult): void {
  console.log(chalk.white(`  - Groupes de duplicats trouvés: ${result.groups.length}`));
  console.log(chalk.white(`  - Fichiers en double: ${result.duplicatesFound}`));
  console.log(chalk.white(`  - Fichiers supprimés: ${result.filesRemoved}`));
  console.log(chalk.white(`  - Fichiers fusionnés: ${result.filesMerged}`));
}

// Déduplique les fichiers d'un type spécifique
async function deduplicateFilesByType(directoryPath: string, extension: string): Promise<DeduplicationResult> {
  console.log(`🔍 Recherche de doublons pour les fichiers ${extension}...`);
  
  try {
    // Lister tous les fichiers avec l'extension demandée
    const files = await fs.readdir(directoryPath);
    const matchingFiles = files.filter(file => file.endsWith(extension));
    
    console.log(`  Trouvé ${matchingFiles.length} fichiers ${extension}`);
    
    // Résultat initial
    const result: DeduplicationResult = {
      type: extension,
      duplicatesFound: 0,
      filesRemoved: 0,
      filesMerged: 0,
      groups: []
    };
    
    if (matchingFiles.length === 0) {
      return result;
    }
    
    // Regrouper les fichiers par nom de base
    const fileGroups: Record<string, string[]> = {};
    
    for (const file of matchingFiles) {
      // Extraction du nom de base (sans numéro de version)
      let baseFileName = file.replace(extension, '');
      
      // Enlever les numéros de version
      baseFileName = baseFileName.replace(/\.v\d+(\.\w+)/g, '$1');
      
      if (!fileGroups[baseFileName]) {
        fileGroups[baseFileName] = [];
      }
      
      fileGroups[baseFileName].push(file);
    }
    
    // Identifier les groupes avec des duplicats
    for (const [baseFileName, group] of Object.entries(fileGroups)) {
      if (group.length > 1) {
        // Il y a des doublons potentiels
        result.duplicatesFound += group.length - 1;
        
        // Collecter des informations sur chaque fichier du groupe
        const filesInfo = await Promise.all(
          group.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const hash = createHash('md5').update(content).digest('hex');
            
            return {
              path: filePath,
              hash,
              size: stat.size,
              modified: stat.mtime
            };
          })
        );
        
        // Ajouter le groupe à la liste des résultats
        result.groups.push({
          baseFileName,
          files: filesInfo
        });
      }
    }
    
    // Déduplicater les groupes identifiés
    for (const group of result.groups) {
      // Trier les fichiers par date de modification (le plus récent d'abord)
      group.files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
      
      // Vérifier s'il y a des doublons exacts (même hash)
      const uniqueHashes = new Set(group.files.map(file => file.hash));
      
      if (uniqueHashes.size < group.files.length) {
        // Il y a des doublons exacts (même contenu)
        console.log(chalk.yellow(`🔄 Traitement des doublons exacts pour ${group.baseFileName}${extension}...`));
        
        // Garder le fichier le plus récent de chaque hash unique
        const keptFiles = new Map<string, string>();
        const filesToDelete: string[] = [];
        
        for (const file of group.files) {
          if (!keptFiles.has(file.hash)) {
            // C'est le premier fichier avec ce hash, on le garde
            keptFiles.set(file.hash, file.path);
          } else {
            // C'est un doublon, on le supprime
            filesToDelete.push(file.path);
          }
        }
        
        // Supprimer les doublons
        for (const filePath of filesToDelete) {
          try {
            await fs.unlink(filePath);
            console.log(chalk.green(`  ✅ Supprimé: ${path.basename(filePath)}`));
            result.filesRemoved++;
          } catch (error) {
            console.error(chalk.red(`  ❌ Erreur lors de la suppression de ${filePath}: ${error.message}`));
          }
        }
      } else if (group.files.length > 1 && extension === '.md') {
        // Tous les fichiers ont un contenu différent, mais même nom de base
        // Pour les fichiers MD, on peut essayer de les fusionner
        console.log(chalk.blue(`🔄 Tentative de fusion pour ${group.baseFileName}${extension}...`));
        
        // Fusionner les fichiers
        try {
          const mergedPath = group.files[0].path;
          const otherPaths = group.files.slice(1).map(f => f.path);
          
          await mergeMarkdownFiles(mergedPath, otherPaths);
          
          // Supprimer les fichiers fusionnés
          for (const filePath of otherPaths) {
            await fs.unlink(filePath);
            console.log(chalk.green(`  ✅ Fusionné et supprimé: ${path.basename(filePath)}`));
            result.filesRemoved++;
          }
          
          result.filesMerged++;
        } catch (error) {
          console.error(chalk.red(`  ❌ Erreur lors de la fusion des fichiers pour ${group.baseFileName}: ${error.message}`));
        }
      } else if (group.files.length > 1 && extension === '.json') {
        // Tous les fichiers ont un contenu différent, mais même nom de base
        // Pour les fichiers JSON, on peut tenter une fusion intelligente
        console.log(chalk.blue(`🔄 Tentative de fusion pour ${group.baseFileName}${extension}...`));
        
        try {
          const mergedPath = group.files[0].path;
          const otherPaths = group.files.slice(1).map(f => f.path);
          
          await mergeJsonFiles(mergedPath, otherPaths);
          
          // Supprimer les fichiers fusionnés
          for (const filePath of otherPaths) {
            await fs.unlink(filePath);
            console.log(chalk.green(`  ✅ Fusionné et supprimé: ${path.basename(filePath)}`));
            result.filesRemoved++;
          }
          
          result.filesMerged++;
        } catch (error) {
          console.error(chalk.red(`  ❌ Erreur lors de la fusion des fichiers pour ${group.baseFileName}: ${error.message}`));
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la déduplication: ${error.message}`);
    return {
      type: extension,
      duplicatesFound: 0,
      filesRemoved: 0,
      filesMerged: 0,
      groups: []
    };
  }
}

// Fusionne plusieurs fichiers Markdown
async function mergeMarkdownFiles(targetPath: string, otherPaths: string[]): Promise<void> {
  // Lire le contenu du fichier cible
  let targetContent = await fs.readFile(targetPath, 'utf8');
  
  // Pour chaque fichier à fusionner
  for (const filePath of otherPaths) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extraire les sections du fichier source
    const sections = extractMarkdownSections(content);
    const targetSections = extractMarkdownSections(targetContent);
    
    // Fusionner les sections
    for (const [heading, text] of Object.entries(sections)) {
      if (!targetSections[heading]) {
        // Section absente dans le fichier cible, l'ajouter
        targetContent += `\n\n${heading}\n\n${text}`;
      } else if (targetSections[heading].length < text.length) {
        // La section du fichier source est plus détaillée, la remplacer
        const regex = new RegExp(`${escapeRegExp(heading)}\\s*\\n[\\s\\S]*?(?=\\n##|$)`, 'g');
        targetContent = targetContent.replace(regex, `${heading}\n\n${text}`);
      }
    }
  }
  
  // Écrire le résultat dans le fichier cible
  await fs.writeFile(targetPath, targetContent, 'utf8');
}

// Extrait les sections d'un fichier Markdown
function extractMarkdownSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  
  let currentHeading: string | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // C'est un nouveau titre
      if (currentHeading) {
        // Sauvegarder la section précédente
        sections[currentHeading] = currentContent.join('\n').trim();
      }
      
      currentHeading = line;
      currentContent = [];
    } else if (currentHeading) {
      // Ajouter la ligne à la section en cours
      currentContent.push(line);
    }
  }
  
  // Sauvegarder la dernière section
  if (currentHeading) {
    sections[currentHeading] = currentContent.join('\n').trim();
  }
  
  return sections;
}

// Fusionne plusieurs fichiers JSON
async function mergeJsonFiles(targetPath: string, otherPaths: string[]): Promise<void> {
  // Lire le contenu du fichier cible
  const targetContent = JSON.parse(await fs.readFile(targetPath, 'utf8'));
  
  // Pour chaque fichier à fusionner
  for (const filePath of otherPaths) {
    try {
      const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Fusionner les objets selon le type de fichier
      if (path.basename(targetPath).includes('.backlog.json')) {
        // Fusion spécifique pour les backlogs
        mergeBacklogs(targetContent, content);
      } else if (path.basename(targetPath).includes('.impact_graph.json')) {
        // Fusion spécifique pour les graphes d'impact
        mergeImpactGraphs(targetContent, content);
      } else {
        // Fusion générique pour les autres JSON
        deepMerge(targetContent, content);
      }
    } catch (error) {
      console.warn(chalk.yellow(`  ⚠️ Erreur lors de la lecture/parsing de ${filePath}, ignoré: ${error.message}`));
    }
  }
  
  // Écrire le résultat dans le fichier cible
  await fs.writeFile(targetPath, JSON.stringify(targetContent, null, 2), 'utf8');
}

// Fusionne deux objets backlog
function mergeBacklogs(target: any, source: any): void {
  // Conserver les métadonnées du backlog le plus récent (target)
  // Fusionner les tâches
  if (Array.isArray(target.tasks) && Array.isArray(source.tasks)) {
    // Créer un ensemble des types de tâches existantes
    const existingTaskTypes = new Set(target.tasks.map(t => t.type));
    
    // Ajouter uniquement les tâches qui n'existent pas déjà
    for (const task of source.tasks) {
      if (!existingTaskTypes.has(task.type)) {
        target.tasks.push(task);
        existingTaskTypes.add(task.type);
      }
    }
    
    // Mettre à jour la priorité si nécessaire
    if (target.priority === undefined && source.priority !== undefined) {
      target.priority = source.priority;
    }
  }
}

// Fusionne deux graphes d'impact
function mergeImpactGraphs(target: any, source: any): void {
  // Fusionner les nœuds
  if (Array.isArray(target.nodes) && Array.isArray(source.nodes)) {
    // Créer un ensemble des nœuds existants
    const existingNodes = new Set(target.nodes);
    
    // Ajouter uniquement les nœuds qui n'existent pas déjà
    for (const node of source.nodes) {
      if (!existingNodes.has(node)) {
        target.nodes.push(node);
        existingNodes.add(node);
      }
    }
  }
  
  // Fusionner les arêtes
  if (Array.isArray(target.edges) && Array.isArray(source.edges)) {
    // Convertir les arêtes en chaînes pour la comparaison
    const existingEdges = new Set(
      target.edges.map(edge => Array.isArray(edge) ? edge.join(',') : JSON.stringify(edge))
    );
    
    // Ajouter uniquement les arêtes qui n'existent pas déjà
    for (const edge of source.edges) {
      const edgeStr = Array.isArray(edge) ? edge.join(',') : JSON.stringify(edge);
      
      if (!existingEdges.has(edgeStr)) {
        target.edges.push(edge);
        existingEdges.add(edgeStr);
      }
    }
  }
}

// Fusionne profondément deux objets
function deepMerge(target: any, source: any): void {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // C'est un objet, fusion récursive
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        // C'est un tableau, fusionner en évitant les doublons
        if (!target[key]) target[key] = [];
        
        for (const item of source[key]) {
          // Vérifier si l'élément existe déjà dans le tableau cible
          const itemStr = typeof item === 'object' ? JSON.stringify(item) : item;
          const exists = target[key].some(targetItem => {
            const targetItemStr = typeof targetItem === 'object' ? JSON.stringify(targetItem) : targetItem;
            return targetItemStr === itemStr;
          });
          
          if (!exists) {
            target[key].push(item);
          }
        }
      } else {
        // C'est une valeur simple, la conserver si elle n'existe pas déjà
        if (target[key] === undefined) {
          target[key] = source[key];
        }
      }
    }
  }
}

// Crée un rapport de déduplication
async function createDeduplicationReport(cahierPath: string, results: DeduplicationResult[]): Promise<void> {
  const logsDir = path.join(cahierPath, '../logs');
  
  // Créer le répertoire de logs si nécessaire
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    // Ignorer les erreurs si le répertoire existe déjà
  }
  
  // Générer le nom du fichier de rapport
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const reportPath = path.join(logsDir, `deduplication-report-${timestamp}.md`);
  
  // Générer le contenu du rapport
  let content = `# Rapport de déduplication des fichiers\n\n`;
  content += `*Généré le ${new Date().toLocaleString()}*\n\n`;
  
  // Ajouter un résumé global
  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicatesFound, 0);
  const totalRemoved = results.reduce((sum, r) => sum + r.filesRemoved, 0);
  const totalMerged = results.reduce((sum, r) => sum + r.filesMerged, 0);
  
  content += `## 📊 Résumé\n\n`;
  content += `- **Fichiers en double détectés**: ${totalDuplicates}\n`;
  content += `- **Fichiers supprimés**: ${totalRemoved}\n`;
  content += `- **Fichiers fusionnés**: ${totalMerged}\n\n`;
  
  // Ajouter le détail par type de fichier
  for (const result of results) {
    content += `## Fichiers ${result.type}\n\n`;
    
    if (result.groups.length === 0) {
      content += `Aucun doublon détecté.\n\n`;
      continue;
    }
    
    content += `### Groupes de fichiers similaires\n\n`;
    
    for (const group of result.groups) {
      content += `#### ${group.baseFileName}${result.type}\n\n`;
      content += `| Fichier | Taille | Date de modification | Action |\n`;
      content += `|---------|--------|---------------------|--------|\n`;
      
      for (const file of group.files) {
        const fileName = path.basename(file.path);
        const fileSizeKB = (file.size / 1024).toFixed(2);
        const fileDate = file.modified.toLocaleString();
        const action = file === group.files[0] ? "Conservé" : "Supprimé/Fusionné";
        
        content += `| ${fileName} | ${fileSizeKB} KB | ${fileDate} | ${action} |\n`;
      }
      
      content += `\n`;
    }
  }
  
  // Écrire le rapport
  await fs.writeFile(reportPath, content, 'utf8');
  console.log(chalk.green(`✅ Rapport de déduplication créé: ${reportPath}`));
}

// Échappe les caractères spéciaux pour RegExp
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default deduplicateFiles;

// Exécuter si appelé directement
if (require.main === module) {
  deduplicateFiles().catch(error => {
    console.error(`Erreur lors de la déduplication: ${error.message}`);
    process.exit(1);
  });
}
