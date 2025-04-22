/**
 * Service de traçabilité trans-couche
 * Permet le suivi de bout en bout des opérations à travers l'architecture à 3 couches
 */
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Options du service de traçabilité
export interface TraceabilityOptions {
  layer: 'orchestration' | 'agents' | 'business';
  enabled: boolean;
  idFormat: string;
  storageStrategy: 'database' | 'distributed' | 'hybrid';
  supabaseUrl?: string;
  supabaseKey?: string;
  databaseTable?: string;
}

// Structure d'un événement de trace
export interface TraceEvent {
  traceId: string;
  parentTraceId?: string;
  rootTraceId?: string;
  event: string;
  layer: 'orchestration' | 'agents' | 'business';
  context?: Record<string, any>;
  timestamp: Date;
  duration?: number;
  success?: boolean;
  error?: string;
}

export class TraceabilityService {
  private logger: Logger;
  private options: TraceabilityOptions;
  private supabase: any | null = null;

  constructor(options: TraceabilityOptions) {
    this.options = {
      databaseTable: 'trace_events',
      ...options
    };
    this.logger = new Logger(`Traceability-${options.layer}`);

    // Initialiser Supabase si le stockage en base est activé et que les informations sont fournies
    if (
      (this.options.storageStrategy === 'database' || 
       this.options.storageStrategy === 'hybrid') && 
      this.options.supabaseUrl && 
      this.options.supabaseKey
    ) {
      try {
        this.supabase = createClient(
          this.options.supabaseUrl,
          this.options.supabaseKey
        );
        this.logger.log('Supabase client initialized for traceability');
      } catch (error: any) {
        this.logger.error(`Failed to initialize Supabase: ${error.message}`);
      }
    }
  }

  /**
   * Génère un ID de traçabilité unique pour une opération
   * @param context Contexte optionnel pour enrichir l'ID
   */
  public async generateTraceId(context?: Record<string, any>): Promise<string> {
    if (!this.options.enabled) {
      return '';
    }

    try {
      let id = this.options.idFormat;
      
      // Remplacer les paramètres dans le format
      id = id.replace('{timestamp}', Date.now().toString());
      id = id.replace('{layer}', this.options.layer);
      id = id.replace('{random}', randomUUID().split('-')[0]);
      
      // Ajouter des éléments de contexte si fournis
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            id = id.replace(`{${key}}`, String(value));
          }
        });
      }
      
      return id;
    } catch (error: any) {
      this.logger.error(`Error generating trace ID: ${error.message}`);
      // Fallback à un UUID simple
      return `${this.options.layer}-${randomUUID()}`;
    }
  }

  /**
   * Crée un ID de trace enfant lié à un ID parent
   * @param parentTraceId ID de trace parent
   * @param context Contexte optionnel
   */
  public async createChildTraceId(
    parentTraceId: string, 
    context?: Record<string, any>
  ): Promise<{childTraceId: string; rootTraceId: string}> {
    const traceId = await this.generateTraceId(context);
    
    // Extraire l'ID racine du parent si présent
    const parentParts = parentTraceId.split('-');
    const rootTraceId = parentParts.length > 2 && parentParts[1] === 'root' 
      ? parentParts[2]  // Utiliser l'ID root existant
      : parentTraceId;  // Le parent est la racine
    
    return {
      childTraceId: `${traceId}-child-${randomUUID().split('-')[0]}-from-${this.options.layer}`,
      rootTraceId
    };
  }

  /**
   * Journalise un événement de trace
   * @param trace Événement de trace à journaliser
   */
  public async logTrace(trace: Omit<TraceEvent, 'layer'>): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    const fullTrace: TraceEvent = {
      ...trace,
      layer: this.options.layer
    };

    try {
      // Stratégie de stockage en base de données
      if (this.options.storageStrategy === 'database' || this.options.storageStrategy === 'hybrid') {
        await this.storeTraceInDatabase(fullTrace);
      }

      // Log local (toujours actif pour le débogage)
      const traceInfo = `TraceID: ${fullTrace.traceId} | Event: ${fullTrace.event}`;
      const contextInfo = fullTrace.context ? ` | Context: ${JSON.stringify(fullTrace.context)}` : '';
      this.logger.debug(`${traceInfo}${contextInfo}`);

      // Stratégie distribuée (publication sur un bus d'événements)
      if (this.options.storageStrategy === 'distributed' || this.options.storageStrategy === 'hybrid') {
        await this.publishTraceEvent(fullTrace);
      }
    } catch (error: any) {
      this.logger.error(`Failed to log trace: ${error.message}`);
    }
  }

  /**
   * Stocke un événement de trace dans la base de données
   * @param trace Événement de trace à stocker
   */
  private async storeTraceInDatabase(trace: TraceEvent): Promise<void> {
    if (!this.supabase) {
      this.logger.warn('Supabase client not initialized, cannot store trace');
      return;
    }

    try {
      const { error } = await this.supabase
        .from(this.options.databaseTable!)
        .insert([{
          trace_id: trace.traceId,
          parent_trace_id: trace.parentTraceId,
          root_trace_id: trace.rootTraceId,
          event: trace.event,
          layer: trace.layer,
          context: trace.context,
          timestamp: trace.timestamp.toISOString(),
          duration: trace.duration,
          success: trace.success,
          error: trace.error
        }]);

      if (error) {
        this.logger.error(`Error storing trace in database: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Exception storing trace in database: ${error.message}`);
    }
  }

  /**
   * Publie un événement de trace sur un bus d'événements
   * @param trace Événement de trace à publier
   */
  private async publishTraceEvent(trace: TraceEvent): Promise<void> {
    // Cette implémentation dépend du système de messaging utilisé
    // (par exemple, Redis, Kafka, RabbitMQ, etc.)
    // Pour l'instant, nous simulons juste la publication
    try {
      this.logger.debug(`[EVENT BUS] Published trace event: ${trace.traceId}`);
      
      // Code à implémenter selon le système de messaging choisi
      // Exemple avec Redis Pub/Sub:
      // await redisClient.publish('trace_events', JSON.stringify(trace));
    } catch (error: any) {
      this.logger.error(`Error publishing trace event: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique des traces pour un ID de trace
   * @param traceId ID de trace à rechercher
   */
  public async getTraceHistory(traceId: string): Promise<TraceEvent[]> {
    if (!this.options.enabled || !this.supabase) {
      return [];
    }

    try {
      // Rechercher la trace et ses enfants
      const { data, error } = await this.supabase
        .from(this.options.databaseTable!)
        .select('*')
        .or(`trace_id.eq.${traceId},parent_trace_id.eq.${traceId},root_trace_id.eq.${traceId}`)
        .order('timestamp', { ascending: true });

      if (error) {
        this.logger.error(`Error retrieving trace history: ${error.message}`);
        return [];
      }

      return data.map((item: any) => ({
        traceId: item.trace_id,
        parentTraceId: item.parent_trace_id,
        rootTraceId: item.root_trace_id,
        event: item.event,
        layer: item.layer,
        context: item.context,
        timestamp: new Date(item.timestamp),
        duration: item.duration,
        success: item.success,
        error: item.error
      }));
    } catch (error: any) {
      this.logger.error(`Exception retrieving trace history: ${error.message}`);
      return [];
    }
  }

  /**
   * Recherche les traces par critères
   * @param criteria Critères de recherche
   * @param limit Nombre maximum de résultats
   */
  public async searchTraces(
    criteria: {
      event?: string;
      layer?: 'orchestration' | 'agents' | 'business';
      startTime?: Date;
      endTime?: Date;
      success?: boolean;
    },
    limit: number = 100
  ): Promise<TraceEvent[]> {
    if (!this.options.enabled || !this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from(this.options.databaseTable!)
        .select('*');

      // Appliquer les filtres
      if (criteria.event) {
        query = query.eq('event', criteria.event);
      }
      if (criteria.layer) {
        query = query.eq('layer', criteria.layer);
      }
      if (criteria.success !== undefined) {
        query = query.eq('success', criteria.success);
      }
      if (criteria.startTime) {
        query = query.gte('timestamp', criteria.startTime.toISOString());
      }
      if (criteria.endTime) {
        query = query.lte('timestamp', criteria.endTime.toISOString());
      }

      // Trier et limiter les résultats
      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error(`Error searching traces: ${error.message}`);
        return [];
      }

      return data.map((item: any) => ({
        traceId: item.trace_id,
        parentTraceId: item.parent_trace_id,
        rootTraceId: item.root_trace_id,
        event: item.event,
        layer: item.layer,
        context: item.context,
        timestamp: new Date(item.timestamp),
        duration: item.duration,
        success: item.success,
        error: item.error
      }));
    } catch (error: any) {
      this.logger.error(`Exception searching traces: ${error.message}`);
      return [];
    }
  }
}

// Aide à l'instanciation avec les paramètres par défaut
export function createTraceabilityService(
  layer: 'orchestration' | 'agents' | 'business',
  options?: Partial<Omit<TraceabilityOptions, 'layer'>>
): TraceabilityService {
  return new TraceabilityService({
    layer,
    enabled: true,
    idFormat: DoDotmcp-{timestamp}-${layer}-{random}`,
    storageStrategy: 'hybrid',
    ...options
  });
}