import * as fs from fs/promisesstructure-agent';
import * as path from pathstructure-agent';
import { execSync } from child_processstructure-agent';

/**
 * Charger la configuration
 */
async function getConfig() {
  try {
    const configPath = path.resolve('./cahier_check.config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Erreur lors du chargement de la configuration: ${error.message}`);
    return {
      paths: { cahier: './cahier/' },
      rules: { maxDuplicateThreshold: 0.85 }
    };
  }
}

/**
 * Analyse de similarité entre les fichiers
 */
async function analyzeSimilarity(): Promise<void> {
  console.log('🔍 Démarrage de l\'analyse de similarité conceptuelle...');
  
  try {
    // Charger la configuration
    const config = await getConfig();
    const cahierPath = path.resolve(config.paths.cahier);
    const similarityThreshold = config.rules.maxDuplicateThreshold || 0.85;
    
    // Vérifier si le répertoire existe
    await fs.access(cahierPath);
    
    // Analyser les fichiers
    const mdFiles = await findFilesByExtension(cahierPath, '.md');
    const jsonFiles = await findFilesByExtension(cahierPath, '.json');
    
    console.log(`Fichiers trouvés: ${mdFiles.length} MD, ${jsonFiles.length} JSON`);
    
    // Analyser la similarité entre fichiers Markdown
    if (mdFiles.length > 1) {
      console.log('\n📄 Analyse des fichiers Markdown...');
      await analyzeFileSimilarity(mdFiles, similarityThreshold);
    }
    
    // Analyser la similarité entre fichiers JSON
    if (jsonFiles.length > 1) {
      console.log('\n🔧 Analyse des fichiers JSON...');
      await analyzeFileSimilarity(jsonFiles, similarityThreshold);
    }
    
    console.log('\n✅ Analyse de similarité terminée!');
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de similarité: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Trouve tous les fichiers avec une extension spécifique
 */
async function findFilesByExtension(dir: string, extension: string): Promise<string[]> {
  const result: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subDirFiles = await findFilesByExtension(fullPath, extension);
        result.push(...subDirFiles);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        result.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche de fichiers ${extension}: ${error.message}`);
  }
  
  return result;
}

/**
 * Analyse la similarité entre une liste de fichiers
 */
async function analyzeFileSimilarity(files: string[], threshold: number): Promise<void> {
  // Initialisation des groupes similaires
  const similarGroups: Map<string, string[]> = new Map();
  let totalComparisons = 0;
  let similarPairsFound = 0;
  
  // Comparer chaque paire de fichiers
  for (let i = 0; i < files.length - 1; i++) {
    for (let j = i + 1; j < files.length; j++) {
      totalComparisons++;
      
      const file1 = files[i];
      const file2 = files[j];
      
      // Calculer la similarité
      const similarity = await calculateFileSimilarity(file1, file2);
      
      if (similarity >= threshold) {
        similarPairsFound++;
        
        // Ajouter aux groupes
        const baseFile1 = path.basename(file1);
        const baseFile2 = path.basename(file2);
        
        console.log(`🔍 Similarité détectée (${Math.round(similarity * 100)}%): ${baseFile1} ↔ ${baseFile2}`);
        
        // Créer ou mettre à jour le groupe
        const groupKey = baseFile1.split('.')[0]; // Utiliser le nom du premier fichier comme clé
        
        if (!similarGroups.has(groupKey)) {
          similarGroups.set(groupKey, [file1, file2]);
        } else {
          const group = similarGroups.get(groupKey);
          if (!group.includes(file2)) {
            group.push(file2);
          }
        }
      }
    }
  }
  
  // Afficher les résultats
  console.log(`\n📊 Résumé: ${totalComparisons} comparaisons, ${similarPairsFound} paires similaires`);
  
  if (similarGroups.size > 0) {
    console.log(`\n🔍 Groupes de similarité trouvés:`);
    
    for (const [key, group] of similarGroups.entries()) {
      console.log(`\n  Groupe "${key}":`);
      for (const file of group) {
        console.log(`    - ${path.basename(file)}`);
      }
    }
    
    console.log('\n💡 Suggestion: Utilisez deduplicate-files.ts pour fusionner ces fichiers similaires');
  } else {
    console.log('✅ Aucun groupe de fichiers similaires détecté');
  }
}

/**
 * Calcule la similarité entre deux fichiers
 */
async function calculateFileSimilarity(file1: string, file2: string): Promise<number> {
  try {
    // Lire le contenu des fichiers
    const content1 = await fs.readFile(file1, 'utf8');
    const content2 = await fs.readFile(file2, 'utf8');
    
    // Calcul basique de similarité basé sur le coefficient de Jaccard
    return calculateJaccardSimilarity(content1, content2);
  } catch (error) {
    console.warn(`Avertissement: Impossible de comparer ${file1} et ${file2}: ${error.message}`);
    return 0;
  }
}

/**
 * Calcule le coefficient de similarité de Jaccard entre deux textes
 */
function calculateJaccardSimilarity(text1: string, text2: string): number {
  // Extraire les mots (tokens) de chaque texte
  const tokens1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const tokens2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  // Créer des ensembles pour les calculs
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  // Calculer l'intersection
  const intersection = new Set([...set1].filter(token => set2.has(token)));
  
  // Calculer l'union
  const union = new Set([...set1, ...set2]);
  
  // Coefficient de Jaccard: taille de l'intersection / taille de l'union
  return intersection.size / union.size;
}

// Exécuter la fonction principale si appelé directement
if (require.main === module) {
  analyzeSimilarity();
}

export default analyzeSimilarity;
