/**
 * memo-store.ts
 *
 * Interface pour le système de mémoire des agents MCP
 * Définit le contrat pour implémenter différentes stratégies de stockage
 */

/**
 * Interface générique pour les entrées de mémoire
 */
export interface MemoEntry<T = any> {
    /**
     * Identifiant unique de l'entrée
     */
    id: string;

    /**
     * Horodatage de création de l'entrée
     */
    timestamp: number;

    /**
     * Type de l'entrée (utilisé pour la catégorisation)
     */
    type: string;

    /**
     * Identifiant de l'agent associé à cette entrée
     */
    agentId: string;

    /**
     * Identifiant de l'exécution/run (permet de grouper des entrées liées)
     */
    runId?: string;

    /**
     * Données associées à cette entrée mémoire
     */
    data: T;

    /**
     * Métadonnées supplémentaires pour le filtrage et la recherche
     */
    metadata?: Record<string, any>;

    /**
     * Score de pertinence (utilisé pour la priorisation)
     */
    relevanceScore?: number;

    /**
     * Hash de l'entrée pour l'intégrité des données
     */
    contentHash?: string;
}

/**
 * Options pour les opérations de stockage
 */
export interface MemoStoreOptions {
    /**
     * Durée de vie en millisecondes (pour mémoire temporaire)
     */
    ttl?: number;

    /**
     * Nombre maximum d'entrées à garder
     */
    maxEntries?: number;

    /**
     * Stratégie pour éviction des entrées (LRU, LFU, FIFO)
     */
    evictionStrategy?: 'LRU' | 'LFU' | 'FIFO';

    /**
     * Compression des données (true/false)
     */
    compress?: boolean;

    /**
     * Chiffrement des données (true/false)
     */
    encrypt?: boolean;

    /**
     * Index supplémentaires pour la recherche
     */
    indexes?: string[];
}

/**
 * Options pour les requêtes
 */
export interface MemoQueryOptions {
    /**
     * Limite de résultats
     */
    limit?: number;

    /**
     * Décalage pour la pagination
     */
    offset?: number;

    /**
     * Tri des résultats
     */
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };

    /**
     * Filtres supplémentaires
     */
    filters?: Record<string, any>;

    /**
     * Seuil de similarité pour la recherche sémantique
     */
    similarityThreshold?: number;
}

/**
 * Interface pour toutes les implémentations de mémoire d'agent
 */
export interface MemoStore<T = any> {
    /**
     * Nom unique de ce store
     */
    readonly storeName: string;

    /**
     * Initialise le store avec des options
     */
    initialize(options?: MemoStoreOptions): Promise<void>;

    /**
     * Stocke une entrée mémoire
     */
    set(key: string, entry: MemoEntry<T>): Promise<void>;

    /**
     * Récupère une entrée par sa clé
     */
    get(key: string): Promise<MemoEntry<T> | null>;

    /**
     * Vérifie si une entrée existe
     */
    has(key: string): Promise<boolean>;

    /**
     * Supprime une entrée
     */
    delete(key: string): Promise<boolean>;

    /**
     * Recherche des entrées par requête
     */
    query(query: Record<string, any>, options?: MemoQueryOptions): Promise<MemoEntry<T>[]>;

    /**
     * Recherche sémantique dans les entrées
     */
    findSimilar(embeddings: number[], options?: MemoQueryOptions): Promise<MemoEntry<T>[]>;

    /**
     * Supprime toutes les entrées
     */
    clear(): Promise<void>;

    /**
     * Supprime les entrées expirées (selon TTL)
     */
    cleanup(): Promise<number>;

    /**
     * Retourne le nombre d'entrées
     */
    count(): Promise<number>;

    /**
     * Ferme le store et libère les ressources
     */
    close(): Promise<void>;
}

/**
 * Interface pour la stratégie de persistance des mémoires
 */
export interface MemoPersistenceStrategy {
    /**
     * Sauvegarde des entrées dans un stockage persistant
     */
    save<T>(entries: MemoEntry<T>[], options?: Record<string, any>): Promise<void>;

    /**
     * Charge des entrées depuis un stockage persistant
     */
    load<T>(filter?: Record<string, any>): Promise<MemoEntry<T>[]>;

    /**
     * Supprime des entrées du stockage persistant
     */
    remove(filter: Record<string, any>): Promise<number>;
}

/**
 * Interface pour la traçabilité des mémoires
 */
export interface MemoTraceOptions {
    /**
     * Signer cryptographiquement la trace (pour auditabilité)
     */
    signed?: boolean;

    /**
     * Format de sortie (JSON, protobuf, etc.)
     */
    format?: 'json' | 'protobuf' | 'binary';

    /**
     * Informations contextuelles à ajouter
     */
    context?: Record<string, any>;
}

export interface MemoTracer {
    /**
     * Crée une trace à partir d'une entrée mémoire
     */
    createTrace<T>(entry: MemoEntry<T>, options?: MemoTraceOptions): Promise<string>;

    /**
     * Vérifie l'intégrité d'une trace
     */
    verifyTrace(traceData: string): Promise<boolean>;

    /**
     * Enregistre une trace dans le système de fichiers
     */
    saveTrace(traceId: string, traceData: string): Promise<void>;

    /**
     * Récupère une trace par son ID
     */
    getTrace(traceId: string): Promise<string | null>;
}