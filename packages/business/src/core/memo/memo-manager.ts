/**
 * memo-manager.ts
 * 
 * Gestionnaire centralisé de mémoire pour les agents MCP
 * Coordonne les différents niveaux de stockage (court terme, long terme, traçabilité)
 */

import { v4 as uuidv4 } from 'uuid';
import { MemoEntry, MemoStore, MemoQueryOptions, MemoTracer } from '../interfaces/memo-store';
import { ShortTermMemoStore } from './short-term-memo-store';
import { LongTermMemoStore } from './long-term-memo-store';
import { MemoTracerImpl } from './memo-tracer';

/**
 * Options pour initialiser le gestionnaire de mémoire
 */
export interface MemoManagerOptions {
    /**
     * Préfixe pour les noms de stockage
     */
    storeNamePrefix?: string;

    /**
     * Configuration pour la mémoire à court terme
     */
    shortTerm?: {
        enabled: boolean;
        ttl?: number;
        mode?: 'memory' | 'redis';
        redis?: {
            host: string;
            port: number;
            password?: string;
        }
    };

    /**
     * Configuration pour la mémoire à long terme
     */
    longTerm?: {
        enabled: boolean;
        mode?: 'json' | 'sqlite' | 'qdrant' | 'supabase';
        storagePath?: string;
        vectorIndexing?: boolean;
        database?: {
            url?: string;
            key?: string;
            name?: string;
        }
    };

    /**
     * Configuration pour la traçabilité
     */
    tracing?: {
        enabled: boolean;
        detailLevel?: 'minimal' | 'standard' | 'verbose';
        tracesDir?: string;
        secretKey?: string;
        autoSave?: boolean;
    };
}

/**
 * Structure d'une mémoire à stocker
 */
export interface MemoData<T = any> {
    /**
     * Type spécifique de l'entrée mémoire
     */
    type: string;

    /**
     * Données à stocker
     */
    data: T;

    /**
     * Métadonnées supplémentaires
     */
    metadata?: Record<string, any>;

    /**
     * ID de l'exécution/run (optionnel)
     */
    runId?: string;

    /**
     * Score de pertinence (pour la priorisation)
     */
    relevanceScore?: number;
}

/**
 * Résultat d'une opération d'accès à la mémoire
 */
export interface MemoResult<T = any> {
    /**
     * Données récupérées
     */
    data: T | null;

    /**
     * Identifiant de l'entrée mémoire
     */
    id: string;

    /**
     * Horodatage de l'entrée
     */
    timestamp: number;

    /**
     * Identifiant de la trace générée (si traçabilité activée)
     */
    traceId?: string;

    /**
     * Indique si l'entrée a été trouvée
     */
    found: boolean;

    /**
     * Depuis quel niveau de stockage l'entrée a été récupérée
     */
    source?: 'short-term' | 'long-term';

    /**
     * Métadonnées associées à l'entrée
     */
    metadata?: Record<string, any>;
}

/**
 * Gestionnaire centralisé de mémoire pour les agents
 */
export class MemoManager {
    private agentId: string;
    private options: MemoManagerOptions;
    private shortTermStore: ShortTermMemoStore | null = null;
    private longTermStore: LongTermMemoStore | null = null;
    private tracer: MemoTracerImpl | null = null;
    private initialized = false;

    constructor(agentId: string, options?: MemoManagerOptions) {
        this.agentId = agentId;

        // Options par défaut
        this.options = {
            storeNamePrefix: 'mcp',
            shortTerm: {
                enabled: true,
                ttl: 3600 * 1000 // 1 heure
            },
            longTerm: {
                enabled: true,
                mode: 'json',
                storagePath: './.memo-store'
            },
            tracing: {
                enabled: true,
                detailLevel: 'standard'
            },
            ...options
        };
    }

    /**
     * Initialise le gestionnaire de mémoire
     */
    async initialize(): Promise<boolean> {
        try {
            // Initialiser la mémoire à court terme si activée
            if (this.options.shortTerm?.enabled) {
                this.shortTermStore = new ShortTermMemoStore(`${this.options.storeNamePrefix}-${this.agentId}`);
                await this.shortTermStore.initialize({
                    ttl: this.options.shortTerm.ttl,
                    mode: this.options.shortTerm.mode,
                    redis: this.options.shortTerm.redis
                });
            }

            // Initialiser la mémoire à long terme si activée
            if (this.options.longTerm?.enabled) {
                this.longTermStore = new LongTermMemoStore(`${this.options.storeNamePrefix}-${this.agentId}`);
                await this.longTermStore.initialize({
                    mode: this.options.longTerm.mode as any,
                    storagePath: this.options.longTerm.storagePath,
                    vectorIndexing: this.options.longTerm.vectorIndexing,
                    database: this.options.longTerm.database
                });
            }

            // Initialiser le traceur si activé
            if (this.options.tracing?.enabled) {
                this.tracer = new MemoTracerImpl({
                    tracesDir: this.options.tracing.tracesDir,
                    detailLevel: this.options.tracing.detailLevel,
                    secretKey: this.options.tracing.secretKey,
                    autoSave: this.options.tracing.autoSave
                });
                await this.tracer.initialize();
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du gestionnaire de mémoire :', error);
            return false;
        }
    }

    /**
     * Vérifie si le gestionnaire est initialisé
     */
    private checkInitialized(): void {
        if (!this.initialized) {
            throw new Error('Le gestionnaire de mémoire n\'a pas été initialisé. Appelez initialize() d\'abord.');
        }
    }

    /**
     * Crée une entrée mémoire à partir des données
     */
    private createMemoEntry<T>(id: string, memoData: MemoData<T>): MemoEntry<T> {
        return {
            id,
            timestamp: Date.now(),
            type: memoData.type,
            agentId: this.agentId,
            runId: memoData.runId,
            data: memoData.data,
            metadata: memoData.metadata,
            relevanceScore: memoData.relevanceScore
        };
    }

    /**
     * Stocke une entrée en mémoire
     */
    async remember<T>(key: string, memoData: MemoData<T>): Promise<string> {
        this.checkInitialized();

        const id = key || uuidv4();
        const entry = this.createMemoEntry(id, memoData);

        // Stocker dans la mémoire à court terme si activée
        if (this.shortTermStore) {
            await this.shortTermStore.set(id, entry);
        }

        // Stocker dans la mémoire à long terme si activée
        if (this.longTermStore) {
            await this.longTermStore.set(id, entry);
        }

        // Créer une trace si traçabilité activée
        let traceId: string | undefined;
        if (this.tracer) {
            traceId = await this.tracer.createTrace(entry, {
                context: { operation: 'store' }
            });
        }

        return id;
    }

    /**
     * Récupère une entrée mémoire par sa clé
     */
    async recall<T>(key: string): Promise<MemoResult<T>> {
        this.checkInitialized();

        const result: MemoResult<T> = {
            data: null,
            id: key,
            timestamp: Date.now(),
            found: false
        };

        // Essayer d'abord dans la mémoire à court terme
        if (this.shortTermStore) {
            const entry = await this.shortTermStore.get(key) as MemoEntry<T> | null;

            if (entry) {
                result.data = entry.data;
                result.timestamp = entry.timestamp;
                result.metadata = entry.metadata;
                result.found = true;
                result.source = 'short-term';

                // Créer une trace si traçabilité activée
                if (this.tracer) {
                    result.traceId = await this.tracer.createTrace(entry, {
                        context: { operation: 'recall', source: 'short-term' }
                    });
                }

                return result;
            }
        }

        // Si non trouvé, essayer dans la mémoire à long terme
        if (this.longTermStore) {
            const entry = await this.longTermStore.get(key) as MemoEntry<T> | null;

            if (entry) {
                result.data = entry.data;
                result.timestamp = entry.timestamp;
                result.metadata = entry.metadata;
                result.found = true;
                result.source = 'long-term';

                // Stocker également dans la mémoire à court terme pour accès futurs
                if (this.shortTermStore) {
                    await this.shortTermStore.set(key, entry);
                }

                // Créer une trace si traçabilité activée
                if (this.tracer) {
                    result.traceId = await this.tracer.createTrace(entry, {
                        context: { operation: 'recall', source: 'long-term' }
                    });
                }

                return result;
            }
        }

        // Non trouvé
        return result;
    }

    /**
     * Vérifie si une entrée existe en mémoire
     */
    async exists(key: string): Promise<boolean> {
        this.checkInitialized();

        // Vérifier d'abord dans la mémoire à court terme
        if (this.shortTermStore && await this.shortTermStore.has(key)) {
            return true;
        }

        // Sinon vérifier dans la mémoire à long terme
        if (this.longTermStore && await this.longTermStore.has(key)) {
            return true;
        }

        return false;
    }

    /**
     * Supprime une entrée mémoire
     */
    async forget(key: string): Promise<boolean> {
        this.checkInitialized();

        let deleted = false;

        // Supprimer de la mémoire à court terme
        if (this.shortTermStore) {
            const shortTermDeleted = await this.shortTermStore.delete(key);
            deleted = deleted || shortTermDeleted;
        }

        // Supprimer de la mémoire à long terme
        if (this.longTermStore) {
            const longTermDeleted = await this.longTermStore.delete(key);
            deleted = deleted || longTermDeleted;
        }

        return deleted;
    }

    /**
     * Recherche des entrées correspondant à une requête
     */
    async search<T>(
        query: Record<string, any>,
        options?: MemoQueryOptions & { searchLongTerm?: boolean }
    ): Promise<MemoResult<T>[]> {
        this.checkInitialized();

        const results: MemoResult<T>[] = [];
        const searchLongTerm = options?.searchLongTerm !== false;

        // Rechercher dans la mémoire à court terme
        if (this.shortTermStore) {
            const shortTermEntries = await this.shortTermStore.query(query, options) as MemoEntry<T>[];

            for (const entry of shortTermEntries) {
                results.push({
                    data: entry.data,
                    id: entry.id,
                    timestamp: entry.timestamp,
                    metadata: entry.metadata,
                    found: true,
                    source: 'short-term'
                });
            }
        }

        // Rechercher dans la mémoire à long terme si demandé
        if (searchLongTerm && this.longTermStore) {
            const longTermEntries = await this.longTermStore.query(query, options) as MemoEntry<T>[];

            for (const entry of longTermEntries) {
                // Éviter les doublons
                if (!results.some(r => r.id === entry.id)) {
                    results.push({
                        data: entry.data,
                        id: entry.id,
                        timestamp: entry.timestamp,
                        metadata: entry.metadata,
                        found: true,
                        source: 'long-term'
                    });
                }
            }
        }

        return results;
    }

    /**
     * Recherche sémantique dans les entrées mémoire
     */
    async findSimilar<T>(
        embeddings: number[],
        options?: MemoQueryOptions
    ): Promise<MemoResult<T>[]> {
        this.checkInitialized();

        // Vérifier si la mémoire à long terme est disponible et que l'indexation vectorielle est activée
        if (!this.longTermStore || !this.options.longTerm?.vectorIndexing) {
            console.warn('La recherche vectorielle n\'est pas disponible : mémoire à long terme non configurée ou indexation vectorielle non activée');
            return [];
        }

        const longTermEntries = await this.longTermStore.findSimilar(embeddings, options) as MemoEntry<T>[];

        // Convertir les entrées en résultats
        const results: MemoResult<T>[] = longTermEntries.map(entry => ({
            data: entry.data,
            id: entry.id,
            timestamp: entry.timestamp,
            metadata: entry.metadata,
            found: true,
            source: 'long-term'
        }));

        return results;
    }

    /**
     * Nettoie les entrées expirées
     */
    async cleanup(): Promise<{ shortTerm: number; longTerm: number }> {
        this.checkInitialized();

        const result = { shortTerm: 0, longTerm: 0 };

        // Nettoyer la mémoire à court terme
        if (this.shortTermStore) {
            result.shortTerm = await this.shortTermStore.cleanup();
        }

        // Nettoyer la mémoire à long terme
        if (this.longTermStore) {
            result.longTerm = await this.longTermStore.cleanup();
        }

        return result;
    }

    /**
     * Génère un rapport des traces pour une exécution spécifique
     */
    async getRunReport(runId: string): Promise<string | null> {
        this.checkInitialized();

        if (!this.tracer) {
            return null;
        }

        return await this.tracer.generateRunReport(runId);
    }

    /**
     * Nettoie les anciennes traces
     */
    async cleanupOldTraces(maxAgeDays: number): Promise<number> {
        this.checkInitialized();

        if (!this.tracer) {
            return 0;
        }

        return await this.tracer.cleanupOldTraces(maxAgeDays);
    }

    /**
     * Ferme le gestionnaire et libère les ressources
     */
    async close(): Promise<void> {
        if (this.shortTermStore) {
            await this.shortTermStore.close();
        }

        if (this.longTermStore) {
            await this.longTermStore.close();
        }

        this.initialized = false;
    }
}