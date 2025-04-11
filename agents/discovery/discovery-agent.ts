/**
 * discovery-agent.ts
 * 
 * Agent de découverte et de priorisation des fichiers PHP à analyser
 * 
 * Ce script analyse récursivement les fichiers PHP d'un répertoire source,
 * évalue leur importance via plusieurs critères et génère une carte de découverte
 * avec des scores de priorité.
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { getConfig } from '../config/config';

// Configuration
const config = getConfig('discovery');
const ROOT_DIR = config.rootDir || 'src'; 
const OUTPUT_FILE = config.outputFile || 'discovery_map.json';
const PREVIOUS_MAP_FILE = config.previousMapFile || 'discovery_map.previous.json';
const MAX_FILES_TO_PROCESS = config.maxFilesToProcess || 1000;
const MIN_SCORE_THRESHOLD = config.minScoreThreshold || 4.0;

// Types
interface DiscoveryItem {
  file: string;
  priority: number;
  type: string;
  status: string;
  lastModified: string;
  fileHash: string;
  sizeKb: number;
  complexityEstimate: number;
  keywords: string[];
  categories: string[];
}

interface KeywordDefinition {
  pattern: RegExp;
  score: number;
  type: string;
  category: string;
}

// Définitions des mots-clés critiques et leur impact sur le score
const KEYWORDS: KeywordDefinition[] = [
  // Sécurité et données
  { pattern: /\$_SESSION/g, score: 2.5, type: 'auth', category: 'security' },
  { pattern: /\$_POST/g, score: 2.0, type: 'form', category: 'security' },
  { pattern: /\$_GET/g, score: 1.5, type: 'param', category: 'security' },
  { pattern: /\$_COOKIE/g, score: 2.2, type: 'auth', category: 'security' },
  { pattern: /\$_FILES/g, score: 2.5, type: 'upload', category: 'security' },
  
  // Base de données
  { pattern: /SELECT.*FROM/i, score: 2.0, type: 'db', category: 'data' },
  { pattern: /INSERT\s+INTO/i, score: 2.2, type: 'db', category: 'data' },
  { pattern: /UPDATE.*SET/i, score: 2.5, type: 'db', category: 'data' },
  { pattern: /DELETE\s+FROM/i, score: 3.0, type: 'db', category: 'data' },
  { pattern: /JOIN/i, score: 1.8, type: 'db', category: 'data' },
  { pattern: /mysql_/i, score: 3.0, type: 'db', category: 'legacy' },
  { pattern: /mysqli_/i, score: 2.0, type: 'db', category: 'data' },
  { pattern: /PDO/i, score: 1.5, type: 'db', category: 'data' },
  
  // Contrôle de flux et sécurité
  { pattern: /header\s*\(/i, score: 2.5, type: 'redirect', category: 'flow' },
  { pattern: /Location:/i, score: 2.0, type: 'redirect', category: 'flow' },
  { pattern: /require(_once)?/i, score: 1.2, type: 'include', category: 'structure' },
  { pattern: /include(_once)?/i, score: 1.2, type: 'include', category: 'structure' },
  { pattern: /die\s*\(/i, score: 1.5, type: 'exit', category: 'flow' },
  { pattern: /exit\s*\(/i, score: 1.5, type: 'exit', category: 'flow' },
  
  // SEO
  { pattern: /<meta\s+name=["']description["']/i, score: 2.0, type: 'seo', category: 'seo' },
  { pattern: /<meta\s+name=["']keywords["']/i, score: 1.5, type: 'seo', category: 'seo' },
  { pattern: /<meta\s+name=["']robots["']/i, score: 2.2, type: 'seo', category: 'seo' },
  { pattern: /<link\s+.*rel=["']canonical["']/i, score: 2.5, type: 'seo', category: 'seo' },
  { pattern: /sitemap/i, score: 2.0, type: 'seo', category: 'seo' },
  { pattern: /slug/i, score: 1.8, type: 'seo', category: 'seo' },
  
  // Fonctionnalités métier
  { pattern: /cart|basket|panier/i, score: 2.8, type: 'cart', category: 'business' },
  { pattern: /checkout|commande/i, score: 3.0, type: 'order', category: 'business' },
  { pattern: /login|connexion/i, score: 2.5, type: 'auth', category: 'business' },
  { pattern: /register|inscription/i, score: 2.3, type: 'auth', category: 'business' },
  { pattern: /product|produit/i, score: 2.0, type: 'catalog', category: 'business' },
  { pattern: /payment|paiement/i, score: 3.0, type: 'payment', category: 'business' },
  { pattern: /admin|administration/i, score: 2.5, type: 'admin', category: 'business' },
  
  // Complexité
  { pattern: /for\s*\(/g, score: 0.3, type: 'complexity', category: 'structure' },
  { pattern: /foreach\s*\(/g, score: 0.3, type: 'complexity', category: 'structure' },
  { pattern: /while\s*\(/g, score: 0.4, type: 'complexity', category: 'structure' },
  { pattern: /if\s*\(/g, score: 0.2, type: 'complexity', category: 'structure' },
  { pattern: /switch\s*\(/g, score: 0.4, type: 'complexity', category: 'structure' },
  { pattern: /function\s+\w+\s*\(/g, score: 0.5, type: 'complexity', category: 'structure' },
  { pattern: /class\s+\w+/g, score: 0.8, type: 'complexity', category: 'structure' },
];

// Patterns de dossier et leur impact sur le score
const DIRECTORY_PATTERNS: { pattern: RegExp; score: number; type: string; }[] = [
  { pattern: /\/cart\//i, score: 1.5, type: 'cart' },
  { pattern: /\/user\//i, score: 1.2, type: 'user' },
  { pattern: /\/admin\//i, score: 1.3, type: 'admin' },
  { pattern: /\/checkout\//i, score: 1.5, type: 'checkout' },
  { pattern: /\/payment\//i, score: 1.8, type: 'payment' },
  { pattern: /\/seo\//i, score: 1.2, type: 'seo' },
  { pattern: /\/core\//i, score: 1.4, type: 'core' },
  { pattern: /\/api\//i, score: 1.5, type: 'api' },
  { pattern: /\/functions\//i, score: 1.1, type: 'functions' },
  { pattern: /\/includes\//i, score: 0.9, type: 'includes' },
];

/**
 * Calculer le score d'un fichier PHP basé sur son contenu et son chemin
 */
function scoreFile(content: string, filePath: string, fileSize: number): {
  score: number;
  type: string;
  complexity: number;
  keywords: string[];
  categories: string[];
} {
  let baseScore = 0;
  let complexity = 0;
  let dominantType = 'unknown';
  const typeScores: Record<string, number> = {};
  const detectedKeywords: string[] = [];
  const detectedCategories: Set<string> = new Set();
  
  // Score basé sur le contenu
  for (const keyword of KEYWORDS) {
    const matches = content.match(keyword.pattern);
    if (matches && matches.length > 0) {
      const occurrenceScore = keyword.score * Math.min(matches.length, 10) / 10;
      baseScore += occurrenceScore;
      
      // Suivi du type dominant
      typeScores[keyword.type] = (typeScores[keyword.type] || 0) + occurrenceScore;
      
      // Ajouter le mot-clé détecté
      detectedKeywords.push(keyword.pattern.toString().replace(/[\/\\^$*+?.()|[\]{}]/g, ''));
      
      // Ajouter la catégorie
      if (keyword.category) {
        detectedCategories.add(keyword.category);
      }
      
      // Ajouter à la complexité si applicable
      if (keyword.type === 'complexity') {
        complexity += occurrenceScore;
      }
    }
  }
  
  // Score basé sur le chemin du fichier
  for (const dirPattern of DIRECTORY_PATTERNS) {
    if (dirPattern.pattern.test(filePath)) {
      baseScore += dirPattern.score;
      typeScores[dirPattern.type] = (typeScores[dirPattern.type] || 0) + dirPattern.score;
    }
  }
  
  // Score basé sur la taille du fichier (kb)
  const sizeScore = Math.min(fileSize / 10, 3);
  baseScore += sizeScore;
  complexity += sizeScore / 2;
  
  // Déterminer le type dominant
  let maxTypeScore = 0;
  for (const [type, score] of Object.entries(typeScores)) {
    if (score > maxTypeScore) {
      maxTypeScore = score;
      dominantType = type;
    }
  }
  
  // Calculer le score final
  baseScore = Math.min(baseScore, 10); // Plafonner à 10
  
  return {
    score: parseFloat(baseScore.toFixed(2)),
    type: dominantType,
    complexity: parseFloat(complexity.toFixed(2)),
    keywords: [...new Set(detectedKeywords)].slice(0, 10),
    categories: [...detectedCategories]
  };
}

/**
 * Calculer le hash MD5 d'un contenu
 */
function calculateFileHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Déterminer le statut d'un fichier (pending, audited, in-progress, migrated)
 */
function determineFileStatus(filePath: string, previousMap: DiscoveryItem[] | null): string {
  const auditFilePath = filePath + '.audit.md';
  const backlogFilePath = filePath.replace('.php', '.backlog.json');
  
  // Vérifier si le fichier a déjà été migré
  const migratedFlagPath = path.join(
    'migration',
    'status',
    filePath.replace(/\//g, '_').replace('.php', '.migrated')
  );
  
  if (fs.existsSync(migratedFlagPath)) {
    return 'migrated';
  }
  
  // Vérifier s'il est en cours d'analyse
  if (previousMap) {
    const previousItem = previousMap.find(item => item.file === filePath);
    if (previousItem && previousItem.status === 'in-progress') {
      return 'in-progress';
    }
  }
  
  // Vérifier s'il a déjà été audité
  if (fs.existsSync(auditFilePath) || fs.existsSync(backlogFilePath)) {
    return 'audited';
  }
  
  return 'pending';
}

/**
 * Parcourir récursivement un répertoire et retourner la liste des fichiers
 */
function walkDirectory(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Le répertoire ${dir} n'existe pas.`);
    return [];
  }
  
  try {
    return fs.readdirSync(dir).flatMap((file) => {
      const fullPath = path.join(dir, file);
      return fs.statSync(fullPath).isDirectory() 
        ? walkDirectory(fullPath) 
        : fullPath;
    });
  } catch (error) {
    console.error(`Erreur lors du parcours du répertoire ${dir}:`, error);
    return [];
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`🔍 Démarrage de l'analyse des fichiers PHP dans ${ROOT_DIR}...`);
  
  // Charger la carte précédente si elle existe
  let previousMap: DiscoveryItem[] | null = null;
  if (fs.existsSync(PREVIOUS_MAP_FILE)) {
    try {
      previousMap = JSON.parse(fs.readFileSync(PREVIOUS_MAP_FILE, 'utf-8'));
      console.log(`📊 Carte précédente chargée: ${previousMap.length} fichiers`);
    } catch (error) {
      console.error(`Erreur lors du chargement de la carte précédente:`, error);
    }
  }
  
  // Rechercher tous les fichiers PHP
  const phpFiles = walkDirectory(ROOT_DIR)
    .filter(file => file.endsWith('.php'))
    .slice(0, MAX_FILES_TO_PROCESS);
  
  console.log(`📂 ${phpFiles.length} fichiers PHP trouvés`);
  
  // Analyser chaque fichier
  const discoveryMap: DiscoveryItem[] = [];
  let processedCount = 0;
  
  for (const filePath of phpFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);
      const fileSize = stats.size / 1024; // KB
      const lastModified = stats.mtime.toISOString();
      
      // Calculer le score et le type
      const { score, type, complexity, keywords, categories } = scoreFile(content, filePath, fileSize);
      
      // Calculer le hash du fichier
      const fileHash = calculateFileHash(content);
      
      // Déterminer le statut
      const status = determineFileStatus(filePath, previousMap);
      
      // Ajouter à la carte si le score dépasse le seuil
      if (score >= MIN_SCORE_THRESHOLD) {
        discoveryMap.push({
          file: filePath,
          priority: score,
          type,
          status,
          lastModified,
          fileHash,
          sizeKb: parseFloat(fileSize.toFixed(2)),
          complexityEstimate: complexity,
          keywords,
          categories
        });
      }
      
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`⏳ ${processedCount}/${phpFiles.length} fichiers traités...`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
    }
  }
  
  // Trier par priorité (du plus prioritaire au moins prioritaire)
  discoveryMap.sort((a, b) => b.priority - a.priority);
  
  // Sauvegarder la carte précédente
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.copyFileSync(OUTPUT_FILE, PREVIOUS_MAP_FILE);
  }
  
  // Sauvegarder la nouvelle carte
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(discoveryMap, null, 2));
  
  // Générer des statistiques
  const pendingCount = discoveryMap.filter(item => item.status === 'pending').length;
  const auditedCount = discoveryMap.filter(item => item.status === 'audited').length;
  const inProgressCount = discoveryMap.filter(item => item.status === 'in-progress').length;
  const migratedCount = discoveryMap.filter(item => item.status === 'migrated').length;
  
  console.log('\n📊 Statistiques de découverte:');
  console.log(`Total de fichiers PHP analysés: ${phpFiles.length}`);
  console.log(`Fichiers prioritaires (score >= ${MIN_SCORE_THRESHOLD}): ${discoveryMap.length}`);
  console.log(`  - En attente d'audit: ${pendingCount}`);
  console.log(`  - Audités: ${auditedCount}`);
  console.log(`  - En cours d'analyse: ${inProgressCount}`);
  console.log(`  - Migrés: ${migratedCount}`);
  
  // Générer delta_map.json si une carte précédente existe
  if (previousMap) {
    generateDeltaMap(discoveryMap, previousMap);
  }
  
  console.log(`\n✅ Carte de découverte générée: ${OUTPUT_FILE}`);
}

/**
 * Générer une carte delta pour identifier les changements
 */
function generateDeltaMap(currentMap: DiscoveryItem[], previousMap: DiscoveryItem[]) {
  const deltaMap = {
    new: [] as DiscoveryItem[],
    modified: [] as DiscoveryItem[],
    statusChanged: [] as DiscoveryItem[],
    priorityChanged: [] as DiscoveryItem[]
  };
  
  // Identifier les nouveaux fichiers et les fichiers modifiés
  for (const currentItem of currentMap) {
    const previousItem = previousMap.find(item => item.file === currentItem.file);
    
    if (!previousItem) {
      // Nouveau fichier
      deltaMap.new.push(currentItem);
    } else if (previousItem.fileHash !== currentItem.fileHash) {
      // Fichier modifié
      deltaMap.modified.push(currentItem);
    } else if (previousItem.status !== currentItem.status) {
      // Statut changé
      deltaMap.statusChanged.push(currentItem);
    } else if (Math.abs(previousItem.priority - currentItem.priority) > 0.5) {
      // Priorité changée significativement
      deltaMap.priorityChanged.push(currentItem);
    }
  }
  
  // Sauvegarder la carte delta
  fs.writeFileSync('delta_map.json', JSON.stringify(deltaMap, null, 2));
  
  console.log('\n🔄 Changements détectés:');
  console.log(`  - Nouveaux fichiers: ${deltaMap.new.length}`);
  console.log(`  - Fichiers modifiés: ${deltaMap.modified.length}`);
  console.log(`  - Changements de statut: ${deltaMap.statusChanged.length}`);
  console.log(`  - Changements de priorité: ${deltaMap.priorityChanged.length}`);
  console.log(`  - Carte delta générée: delta_map.json`);
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur dans le traitement principal:', error);
  process.exit(1);
});