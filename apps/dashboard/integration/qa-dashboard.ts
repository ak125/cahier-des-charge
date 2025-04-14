/**
 * Integration du QA Analyzer avec le dashboard Remix
 * 
 * Ce module fournit les fonctions nécessaires pour mettre à jour le dashboard
 * Remix avec les résultats des analyses QA.
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';
const QA_RESULTS_ENDPOINT = `${DASHBOARD_API_URL}/qa-results`;
const QA_SUMMARY_ENDPOINT = `${DASHBOARD_API_URL}/qa-summary`;
const QA_CACHE_DIR = path.join(process.cwd(), 'cache', 'qa-results');

// Types
export interface QAResultSummary {
  sourceFile: string;
  targetFiles: string[];
  status: 'OK' | 'Partial' | 'Failed';
  score: number;
  missingFieldsCount: number;
  presentFieldsCount: number;
  issuesCount: number;
  recommendations: string[];
  tags: string[];
  timestamp: string;
}

export interface QASummary {
  totalFiles: number;
  okCount: number;
  partialCount: number;
  failedCount: number;
  averageScore: number;
  recentResults: QAResultSummary[];
  topIssues: { issueType: string; count: number }[];
}

/**
 * Met à jour le dashboard Remix avec les résultats d'une analyse QA
 */
export async function updateQAResults(result: QAResultSummary): Promise<void> {
  try {
    // S'assurer que le répertoire cache existe
    await fs.ensureDir(QA_CACHE_DIR);
    
    // Sauvegarder le résultat dans le cache local
    const baseFileName = path.basename(result.sourceFile, path.extname(result.sourceFile));
    const cachePath = path.join(QA_CACHE_DIR, `${baseFileName}.json`);
    await fs.writeJson(cachePath, result, { spaces: 2 });
    
    console.log(`✅ Résultats QA mis en cache dans ${cachePath}`);
    
    // Tenter d'envoyer au dashboard API
    try {
      const response = await axios.post(QA_RESULTS_ENDPOINT, result);
      
      if (response.status === 200) {
        console.log('✅ Résultats QA envoyés au dashboard avec succès');
      } else {
        console.warn(`⚠️ Réponse inattendue du dashboard API: ${response.status}`);
      }
    } catch (apiError: any) {
      console.warn(`⚠️ Impossible d'envoyer les résultats au dashboard API: ${apiError.message}`);
      console.warn('Les résultats sont sauvegardés en cache et seront synchronisés ultérieurement');
    }
  } catch (error: any) {
    console.error(`❌ Erreur lors de la mise à jour du dashboard: ${error.message}`);
  }
}

/**
 * Obtient un résumé des résultats QA
 */
export async function getQASummary(): Promise<QASummary> {
  try {
    // Essayer d'obtenir les données depuis l'API
    try {
      const response = await axios.get(QA_SUMMARY_ENDPOINT);
      
      if (response.status === 200 && response.data) {
        return response.data;
      }
    } catch (apiError) {
      console.warn(`⚠️ Impossible d'obtenir le résumé QA depuis l'API: ${apiError.message}`);
    }
    
    // Fallback: Construire un résumé à partir du cache local
    return buildSummaryFromCache();
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'obtention du résumé QA: ${error.message}`);
    
    // Retourner un résumé vide en cas d'erreur
    return {
      totalFiles: 0,
      okCount: 0,
      partialCount: 0,
      failedCount: 0,
      averageScore: 0,
      recentResults: [],
      topIssues: []
    };
  }
}

/**
 * Construit un résumé des résultats QA à partir du cache local
 */
async function buildSummaryFromCache(): Promise<QASummary> {
  try {
    // S'assurer que le répertoire cache existe
    await fs.ensureDir(QA_CACHE_DIR);
    
    // Lire tous les fichiers du cache
    const files = await fs.readdir(QA_CACHE_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Charger tous les résultats
    const results: QAResultSummary[] = [];
    
    for (const file of jsonFiles) {
      try {
        const result = await fs.readJson(path.join(QA_CACHE_DIR, file));
        results.push(result);
      } catch (error) {
        console.warn(`⚠️ Impossible de lire le fichier de cache ${file}`);
      }
    }
    
    // Calculer les statistiques
    const totalFiles = results.length;
    const okCount = results.filter(r => r.status === 'OK').length;
    const partialCount = results.filter(r => r.status === 'Partial').length;
    const failedCount = results.filter(r => r.status === 'Failed').length;
    
    // Calculer le score moyen
    const averageScore = totalFiles > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / totalFiles 
      : 0;
    
    // Trier par date (plus récent en premier)
    const sortedResults = [...results].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Récupérer les 10 résultats les plus récents
    const recentResults = sortedResults.slice(0, 10);
    
    // Collecter les types de problèmes pour trouver les plus courants
    const issueTypes = new Map<string, number>();
    
    for (const result of results) {
      // Examiner les tags pour trouver les types de problèmes
      for (const tag of result.tags) {
        // Les tags de problèmes ont généralement le format "type:severity"
        if (tag.includes(':') && !tag.startsWith('qa:') && !tag.startsWith('fields:')) {
          const count = issueTypes.get(tag) || 0;
          issueTypes.set(tag, count + 1);
        }
      }
    }
    
    // Convertir la Map en tableau et trier par nombre d'occurrences
    const topIssues = Array.from(issueTypes.entries())
      .map(([issueType, count]) => ({ issueType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 problèmes
    
    return {
      totalFiles,
      okCount,
      partialCount,
      failedCount,
      averageScore,
      recentResults,
      topIssues
    };
  } catch (error: any) {
    console.error(`❌ Erreur lors de la construction du résumé QA: ${error.message}`);
    
    // Retourner un résumé vide en cas d'erreur
    return {
      totalFiles: 0,
      okCount: 0,
      partialCount: 0,
      failedCount: 0,
      averageScore: 0,
      recentResults: [],
      topIssues: []
    };
  }
}

/**
 * Synchronise les résultats QA en cache avec le dashboard API
 */
export async function syncCachedResults(): Promise<void> {
  try {
    // S'assurer que le répertoire cache existe
    await fs.ensureDir(QA_CACHE_DIR);
    
    // Lire tous les fichiers du cache
    const files = await fs.readdir(QA_CACHE_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('✅ Aucun résultat QA en cache à synchroniser');
      return;
    }
    
    console.log(`📤 Synchronisation de ${jsonFiles.length} résultats QA avec le dashboard...`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Essayer de synchroniser chaque fichier
    for (const file of jsonFiles) {
      try {
        const result = await fs.readJson(path.join(QA_CACHE_DIR, file));
        
        // Tenter d'envoyer au dashboard API
        const response = await axios.post(QA_RESULTS_ENDPOINT, result);
        
        if (response.status === 200) {
          successCount++;
          
          // Supprimer le fichier du cache après synchronisation réussie
          await fs.remove(path.join(QA_CACHE_DIR, file));
        } else {
          failCount++;
          console.warn(`⚠️ Échec de synchronisation pour ${file}: ${response.status}`);
        }
      } catch (error: any) {
        failCount++;
        console.warn(`⚠️ Impossible de synchroniser ${file}: ${error.message}`);
      }
    }
    
    console.log(`✅ Synchronisation terminée: ${successCount} réussis, ${failCount} échoués`);
  } catch (error: any) {
    console.error(`❌ Erreur lors de la synchronisation des résultats QA: ${error.message}`);
  }
}

// Exécution autonome si appelé directement (pour synchroniser les résultats en cache)
if (require.main === module) {
  syncCachedResults()
    .then(() => console.log('✅ Synchronisation terminée'))
    .catch(error => console.error(`❌ Erreur: ${error.message}`));
}