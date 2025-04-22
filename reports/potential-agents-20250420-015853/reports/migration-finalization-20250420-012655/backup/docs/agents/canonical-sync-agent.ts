/**
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
 * Agent de synchronisation des URLs canoniques
 * Permet de maintenir les mappings entre les anciennes URLs PHP et les nouvelles URLs Remix
 */

import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../coreDoDotmcp-agent';
import { createClient } from '@supabase/supabase-js';
import { BaseAgent, CoordinationAgent } from '../core/interfaces/BaseAgent';


interface CanonicalMapping {
  source_url: string;
  canonical_url: string;
  active: boolean;
  priority: number;
  updated_at?: string;
}

export class CanonicalSyncAgent implements BaseAgent, CoordinationAgent, MCPAgent , BusinessAgent{
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

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Vérifie la connexion avec un service
   */
  async checkConnection(serviceId: string): Promise<boolean> {
    return true;
  }
}

export default new CanonicalSyncAgent();