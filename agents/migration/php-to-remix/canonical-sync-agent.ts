/**
 * Agent de synchronisation des URLs canoniques
 * Permet de maintenir les mappings entre les anciennes URLs PHP et les nouvelles URLs Remix
 */

import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../core/mcp-agent';
import { createClient } from '@supabase/supabase-js';

interface CanonicalMapping {
  source_url: string;
  canonical_url: string;
  active: boolean;
  priority: number;
  updated_at?: string;
}

export class CanonicalSyncAgent implements MCPAgent {
  name = 'canonical-sync-agent';
  description = 'Synchronise les URLs canoniques entre le fichier JSON et Supabase';

  async process(context: MCPContext): Promise<any> {
    const { 
      canonicalFilePath = path.join(process.cwd(), 'app/config/seo-canonicals.json'),
      supabaseUrl,
      supabaseKey,
      direction = 'both',
      forceUpdate = false
    } = context.inputs;

    try {
      // Vérifier que le fichier JSON existe
      if (!fs.existsSync(canonicalFilePath)) {
        return {
          success: false,
          error: `Le fichier de mappings canoniques n'existe pas: ${canonicalFilePath}`
        };
      }

      // Charger les mappings depuis le fichier JSON
      const canonicalConfig = JSON.parse(fs.readFileSync(canonicalFilePath, 'utf8'));
      const localMappings = canonicalConfig.mappings || {};
      
      // Convertir en format d'entrée pour Supabase
      const localEntries: CanonicalMapping[] = Object.entries(localMappings).map(([source, canonical], index) => ({
        source_url: source,
        canonical_url: canonical as string,
        active: true,
        priority: index + 1,
        updated_at: new Date().toISOString()
      }));
      
      // Si Supabase n'est pas configuré, sauvegarder uniquement localement
      if (!supabaseUrl || !supabaseKey) {
        return {
          success: true,
          message: 'Supabase non configuré, mappings sauvegardés localement uniquement',
          data: {
            totalMappings: localEntries.length,
            mappings: localEntries
          }
        };
      }
      
      // Initialiser le client Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Synchronisation dans les deux sens ou unidirectionnelle
      let remoteMappings: CanonicalMapping[] = [];
      
      if (direction === 'both' || direction === 'pull') {
        // Récupérer les mappings depuis Supabase
        const { data, error } = await supabase
          .from('seo_canonicals')
          .select('*')
          .eq('active', true);
        
        if (error) {
          throw new Error(`Erreur lors de la récupération des mappings depuis Supabase: ${error.message}`);
        }
        
        remoteMappings = data || [];
        
        // Si on fait un pull, mettre à jour le fichier local avec les données de Supabase
        if (direction === 'pull' || forceUpdate) {
          // Convertir les entrées Supabase en format pour le fichier JSON
          const remoteObject: Record<string, string> = {};
          remoteMappings.forEach(item => {
            remoteObject[item.source_url] = item.canonical_url;
          });
          
          // Mettre à jour le fichier JSON
          canonicalConfig.mappings = remoteObject;
          canonicalConfig.meta.lastUpdated = new Date().toISOString();
          canonicalConfig.meta.totalMappings = Object.keys(remoteObject).length;
          
          fs.writeFileSync(canonicalFilePath, JSON.stringify(canonicalConfig, null, 2), 'utf8');
        }
      }
      
      // Push vers Supabase
      if (direction === 'both' || direction === 'push') {
        // Mettre à jour Supabase avec les mappings locaux
        
        // Option 1: Mettre à jour de manière atomique
        const { error } = await supabase.from('seo_canonicals').upsert(
          localEntries,
          { onConflict: 'source_url' }
        );
        
        if (error) {
          throw new Error(`Erreur lors de la mise à jour des mappings dans Supabase: ${error.message}`);
        }
      }
      
      // Résultat final
      return {
        success: true,
        data: {
          direction,
          localMappings: localEntries.length,
          remoteMappings: remoteMappings.length,
          filePath: canonicalFilePath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de la synchronisation des mappings canoniques: ${error.message}`
      };
    }
  }
}

export default new CanonicalSyncAgent();