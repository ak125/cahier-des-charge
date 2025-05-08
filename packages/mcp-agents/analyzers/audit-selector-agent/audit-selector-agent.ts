/**
 * audit-selector-agent.ts
 *
 * Agent de sélection des fichiers PHP à auditer basé sur la carte de découverte
 *
 * Ce script sélectionne les fichiers PHP les plus prioritaires à partir de la
 * carte de découverte générée par discovery-agent et gère leur statut
 * dans le pipeline d'analyse.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AnalyzerAgent } from '../../core/interfaces';
import { getConfig } from '../config/config';

// Configuration
const config = getConfig('audit-selector');
const DISCOVERY_MAP_FILE = config.discoveryMapFile || 'discovery_map.json';
const MAX_FILES_TO_SELECT = config.maxFilesToSelect || 5;
const LOCK_DIR = config.lockDir || 'locks';
const BATCH_ID = new Date().toISOString().replace(/[:.]/g, '-');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

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

interface SelectedFile {
  filePath: string;
  priority: number;
  type: string;
  batchId: string;
  selectionTimestamp: string;
}

/**
 * Vérifie si un fichier est verrouillé (en cours d'analyse par un autre processus)
 */
function isFileLocked(filePath: string): boolean {
  const lockFile = path.join(LOCK_DIR, `${filePath.replace(/\//g, '_')}.lock`);
  return fs.existsSync(lockFile);
}

/**
 * Verrouille un fichier pour analyse
 */
function lockFile(filePath: string): void {
  // Créer le répertoire de verrouillage s'il n'existe pas
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }

  const lockFile = path.join(LOCK_DIR, `${filePath.replace(/\//g, '_')}.lock`);
  fs.writeFileSync(lockFile, BATCH_ID);
}

/**
 * Met à jour le statut d'un fichier dans la carte de découverte
 */
function updateFileStatus(filePath: string, status: string): void {
  if (!fs.existsSync(DISCOVERY_MAP_FILE)) {
    console.error(`Fichier ${DISCOVERY_MAP_FILE} non trouvé.`);
    return;
  }

  try {
    const discoveryMap: DiscoveryItem[] = JSON.parse(fs.readFileSync(DISCOVERY_MAP_FILE, 'utf-8'));
    const updatedMap = discoveryMap.map((item) => {
      if (item.file === filePath) {
        return { ...item, status };
      }
      return item;
    });

    fs.writeFileSync(DISCOVERY_MAP_FILE, JSON.stringify(updatedMap, null, 2));
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut dans ${DISCOVERY_MAP_FILE}:`, error);
  }
}

/**
 * Met à jour Supabase avec les fichiers sélectionnés
 */
async function updateSupabase(selectedFiles: SelectedFile[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Configuration Supabase non fournie, mise à jour ignorée.');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Préparer les données pour l'insertion/mise à jour
    const supabaseData = selectedFiles.map((file) => ({
      file_path: file.filePath,
      status: 'in-progress',
      batch_id: file.batchId,
      selected_at: file.selectionTimestamp,
      priority: file.priority,
      file_type: file.type,
    }));

    // Insérer ou mettre à jour dans Supabase
    const { data, error } = await supabase
      .from('selected_files')
      .upsert(supabaseData, { onConflict: 'file_path' });

    if (error) {
      throw error;
    }

    console.log(`✅ Mise à jour Supabase réussie pour ${selectedFiles.length} fichiers`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de Supabase:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Démarrage de la sélection des fichiers à auditer...');

  // Vérifier que la carte de découverte existe
  if (!fs.existsSync(DISCOVERY_MAP_FILE)) {
    console.error(`Fichier ${DISCOVERY_MAP_FILE} non trouvé.`);
    process.exit(1);
  }

  try {
    // Charger la carte de découverte
    const discoveryMap: DiscoveryItem[] = JSON.parse(fs.readFileSync(DISCOVERY_MAP_FILE, 'utf-8'));

    // Filtrer les fichiers en attente d'analyse et les trier par priorité
    const pendingFiles = discoveryMap
      .filter((item) => item.status === 'pending')
      .sort((a, b) => b.priority - a.priority);

    console.log(`📊 ${pendingFiles.length} fichiers en attente d'analyse`);

    // Sélectionner les N fichiers les plus prioritaires qui ne sont pas verrouillés
    const selectedFiles: SelectedFile[] = [];
    let checkedCount = 0;

    for (const file of pendingFiles) {
      // Vérifier si le fichier n'est pas déjà en cours d'analyse
      if (!isFileLocked(file.file)) {
        // Verrouiller le fichier
        lockFile(file.file);

        // Mettre à jour son statut dans la carte de découverte
        updateFileStatus(file.file, 'in-progress');

        // Ajouter à la liste des fichiers sélectionnés
        selectedFiles.push({
          filePath: file.file,
          priority: file.priority,
          type: file.type,
          batchId: BATCH_ID,
          selectionTimestamp: new Date().toISOString(),
        });

        // Arrêter si on a atteint le nombre maximum de fichiers à sélectionner
        if (selectedFiles.length >= MAX_FILES_TO_SELECT) {
          break;
        }
      }

      checkedCount++;

      // Limiter le nombre de fichiers à vérifier pour éviter de parcourir toute la liste
      if (checkedCount >= pendingFiles.length || checkedCount >= MAX_FILES_TO_SELECT * 3) {
        break;
      }
    }

    // Mettre à jour Supabase avec les fichiers sélectionnés
    if (selectedFiles.length > 0) {
      await updateSupabase(selectedFiles);
    }

    console.log(
      `\n✅ Sélection terminée: ${selectedFiles.length} fichiers sélectionnés pour audit`
    );

    // Afficher les fichiers sélectionnés
    if (selectedFiles.length > 0) {
      console.log('\nFichiers sélectionnés:');
      selectedFiles.forEach((file, index) => {
        console.log(
          `${index + 1}. ${file.filePath} (priorité: ${file.priority}, type: ${file.type})`
        );
      });

      // Écrire la liste des fichiers sélectionnés dans un fichier pour référence
      const outputFile = `selected_files_${BATCH_ID}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(selectedFiles, null, 2));
      console.log(`\nListe sauvegardée dans ${outputFile}`);
    } else {
      console.log('Aucun fichier sélectionné pour cette exécution.');
    }

    // Retourner la liste des fichiers pour le workflow
    return selectedFiles.map((file) => file.filePath);
  } catch (error) {
    console.error('Erreur lors de la sélection des fichiers:', error);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé comme module)
if (require.main === module) {
  main()
    .then((selectedFiles) => {
      // Afficher les chemins de fichiers sur stdout pour que le système puisse les capturer
      console.log(JSON.stringify(selectedFiles));
    })
    .catch((error) => {
      console.error('Erreur dans le script principal:', error);
      process.exit(1);
    });
}

// Exporter les fonctions et la fonction principale pour l'utilisation comme module
export { main, updateFileStatus, isFileLocked, lockFile };