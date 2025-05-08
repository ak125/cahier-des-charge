/**
 * short-term-memo-store.ts
 * 
 * Implémentation de la mémoire à court terme pour les agents MCP
 * Stocke les données en mémoire avec Map pour l'exécution locale
 * et peut utiliser Redis pour les environnements distribués
 */

import { createHash } from 'crypto';
import { MemoEntry, MemoQueryOptions, MemoStore, MemoStoreOptions } from '../interfaces/memo-store';

/**
 * Options spécifiques pour la mémoire à court terme
 */
export interface ShortTermMemoOptions extends MemoStoreOptions {
    /**
     * Mode de stockage: mémoire ou Redis
     */
    mode?: 'memory' | 'redis';

    /**
     * Configuration Redis (si mode=redis)
     */
    redis?: {
        host: string;
        port: number;
        password?: string;
        db?: number;
        keyPrefix?: string;
    };
}

/**
 * Classe implémentant une mémoire à court terme pour les agents
 * Utilisée pendant un seul run ou tâche
 */
export class ShortTermMemoStore<T = any> implements MemoStore<T> {
    public readonly storeName: string = 'short-term';

    private options: ShortTermMemoOptions;
    private store: Map<string, { entry: MemoEntry<T>, expiry?: number }>;
    private redisClient: any = null;

    constructor(name?: string) {
        if (name) {
            this.storeName = `short-term:${name}`;
        }
        this.store = new Map();
        this.options = {
            ttl: 3600 * 1000, // 1 heure par défaut
            maxEntries: 1000,
            evictionStrategy: 'LRU',
            mode: 'memory'
        };
    }

    /**
     * Initialise le store avec des options
     */
    async initialize(options?: ShortTermMemoOptions): Promise<void> {
        this.options = { ...this.options, ...options };

        if (this.options.mode === 'redis') {
            try {
                // Dans une implémentation réelle, on importerait Redis ici
                // const { createClient } = await import('redis');
                // this.redisClient = createClient({
                //   url: `redis://${this.options.redis?.host}:${this.options.redis?.port}`,
                //   password: this.options.redis?.password,
                //   database: this.options.redis?.db || 0
                // });
                // await this.redisClient.connect();
                console.log('Redis serait initialisé ici en production');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation du client Redis', error);
                // Fallback to memory mode
                this.options.mode = 'memory';
            }
        }
    }

    /**
     * Génère un hash de contenu pour l'entrée
     */
    private generateContentHash(data: any): string {
        return createHash('sha256')
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Stocke une entrée mémoire
     */
    async set(key: string, entry: MemoEntry<T>): Promise<void> {
        // Calculer un hash si non fourni
        if (!entry.contentHash) {
            entry.contentHash = this.generateContentHash(entry.data);
        }

        const now = Date.now();
        const expiry = this.options.ttl ? now + this.options.ttl : undefined;

        if (this.options.mode === 'memory') {
            // Mode mémoire (Map)
            this.store.set(key, { entry, expiry });

            // Appliquer la stratégie d'éviction si nécessaire
            if (this.options.maxEntries && this.store.size > this.options.maxEntries) {
                this.enforceEvictionPolicy();
            }
        } else if (this.redisClient) {
            // Mode Redis
            const jsonEntry = JSON.stringify(entry);
            const keyWithPrefix = `${this.options.redis?.keyPrefix || 'memo'}:${key}`;

            if (expiry) {
                // Avec expiration
                await this.redisClient.set(keyWithPrefix, jsonEntry, {
                    PX: this.options.ttl
                });
            } else {
                // Sans expiration
                await this.redisClient.set(keyWithPrefix, jsonEntry);
            }
        }
    }

    /**
     * Récupère une entrée par sa clé
     */
    async get(key: string): Promise<MemoEntry<T> | null> {
        const now = Date.now();

        if (this.options.mode === 'memory') {
            const item = this.store.get(key);

            // Vérifier si l'entrée existe et n'est pas expirée
            if (!item) return null;
            if (item.expiry && item.expiry < now) {
                this.store.delete(key);
                return null;
            }

            return item.entry;
        } else if (this.redisClient) {
            const keyWithPrefix = `${this.options.redis?.keyPrefix || 'memo'}:${key}`;
            const value = await this.redisClient.get(keyWithPrefix);

            if (!value) return null;

            try {
                return JSON.parse(value) as MemoEntry<T>;
            } catch (e) {
                console.error(`Erreur lors de la désérialisation de l'entrée ${key}`, e);
                return null;
            }
        }

        return null;
    }

    /**
     * Vérifie si une entrée existe
     */
    async has(key: string): Promise<boolean> {
        const entry = await this.get(key);
        return entry !== null;
    }

    /**
     * Supprime une entrée
     */
    async delete(key: string): Promise<boolean> {
        if (this.options.mode === 'memory') {
            return this.store.delete(key);
        } else if (this.redisClient) {
            const keyWithPrefix = `${this.options.redis?.keyPrefix || 'memo'}:${key}`;
            const result = await this.redisClient.del(keyWithPrefix);
            return result > 0;
        }
        return false;
    }

    /**
     * Recherche des entrées par requête simple
     */
    async query(query: Record<string, any>, options?: MemoQueryOptions): Promise<MemoEntry<T>[]> {
        const results: MemoEntry<T>[] = [];
        const now = Date.now();

        if (this.options.mode === 'memory') {
            // Filtrer les entrées expirées et correspondant à la requête
            for (const [key, item] of this.store.entries()) {
                if (item.expiry && item.expiry < now) {
                    this.store.delete(key);
                    continue;
                }

                let match = true;
                for (const [qKey, qValue] of Object.entries(query)) {
                    // Recherche dans les données et métadonnées
                    if (qKey.includes('.')) {
                        // Chemin d'accès imbriqué (ex: metadata.source)
                        const [parent, child] = qKey.split('.');
                        if (!item.entry[parent] || item.entry[parent][child] !== qValue) {
                            match = false;
                            break;
                        }
                    } else if (item.entry[qKey] !== qValue) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    results.push(item.entry);
                }
            }
        } else if (this.redisClient) {
            // En production, on utiliserait les capacités de recherche de Redis
            // Comme Redis Search ou une recherche par pattern de clés
            console.warn('La recherche Redis complète nécessiterait Redis Search en production');

            // Version simplifiée pour l'exemple
            const keyPattern = `${this.options.redis?.keyPrefix || 'memo'}:*`;
            const keys = await this.redisClient.keys(keyPattern);

            for (const key of keys) {
                const value = await this.redisClient.get(key);
                if (!value) continue;

                try {
                    const entry = JSON.parse(value) as MemoEntry<T>;

                    // Vérifier si l'entrée correspond à la requête
                    let match = true;
                    for (const [qKey, qValue] of Object.entries(query)) {
                        if (qKey.includes('.')) {
                            const [parent, child] = qKey.split('.');
                            if (!entry[parent] || entry[parent][child] !== qValue) {
                                match = false;
                                break;
                            }
                        } else if (entry[qKey] !== qValue) {
                            match = false;
                            break;
                        }
                    }

                    if (match) {
                        results.push(entry);
                    }
                } catch (e) {
                    console.error(`Erreur lors de la désérialisation de l'entrée ${key}`, e);
                }
            }
        }

        // Appliquer tri, limite et décalage
        let finalResults = [...results];

        if (options?.sort) {
            finalResults.sort((a, b) => {
                const field = options.sort!.field;
                const aValue = field.includes('.')
                    ? a[field.split('.')[0]][field.split('.')[1]]
                    : a[field];
                const bValue = field.includes('.')
                    ? b[field.split('.')[0]][field.split('.')[1]]
                    : b[field];

                if (options.sort!.order === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }

        if (options?.offset) {
            finalResults = finalResults.slice(options.offset);
        }

        if (options?.limit) {
            finalResults = finalResults.slice(0, options.limit);
        }

        return finalResults;
    }

    /**
     * Recherche sémantique (version simple)
     * Note: Une recherche vectorielle réelle nécessiterait une base vectorielle
     */
    async findSimilar(_embeddings: number[], options?: MemoQueryOptions): Promise<MemoEntry<T>[]> {
        // Dans une implémentation réelle, on utiliserait une base vectorielle
        // comme Qdrant, Pinecone, ou Weaviate
        console.warn('La recherche vectorielle n\'est pas implémentée dans le mode mémoire simple');

        // Retourner quelques résultats récents pour simuler
        const allEntries = Array.from(this.store.values()).map(item => item.entry);
        const sortedByTime = allEntries.sort((a, b) => b.timestamp - a.timestamp);

        const limit = options?.limit || 5;
        return sortedByTime.slice(0, limit);
    }

    /**
     * Supprime toutes les entrées
     */
    async clear(): Promise<void> {
        if (this.options.mode === 'memory') {
            this.store.clear();
        } else if (this.redisClient) {
            const keyPattern = `${this.options.redis?.keyPrefix || 'memo'}:*`;
            const keys = await this.redisClient.keys(keyPattern);
            if (keys.length > 0) {
                await this.redisClient.del(keys);
            }
        }
    }

    /**
     * Supprime les entrées expirées
     */
    async cleanup(): Promise<number> {
        let removedCount = 0;
        const now = Date.now();

        if (this.options.mode === 'memory') {
            for (const [key, item] of this.store.entries()) {
                if (item.expiry && item.expiry < now) {
                    this.store.delete(key);
                    removedCount++;
                }
            }
        } else if (this.redisClient) {
            // Redis gère automatiquement l'expiration des clés
            // Rien à faire de spécial ici
        }

        return removedCount;
    }

    /**
     * Retourne le nombre d'entrées
     */
    async count(): Promise<number> {
        if (this.options.mode === 'memory') {
            return this.store.size;
        } else if (this.redisClient) {
            const keyPattern = `${this.options.redis?.keyPrefix || 'memo'}:*`;
            const keys = await this.redisClient.keys(keyPattern);
            return keys.length;
        }
        return 0;
    }

    /**
     * Ferme le store
     */
    async close(): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisClient = null;
        }
    }

    /**
     * Applique la stratégie d'éviction si le nombre d'entrées dépasse maxEntries
     */
    private enforceEvictionPolicy(): void {
        if (this.store.size <= (this.options.maxEntries || 0)) return;

        const entriesToRemove = this.store.size - (this.options.maxEntries || 0);

        if (this.options.evictionStrategy === 'LRU') {
            // Stratégie Least Recently Used
            const entries = Array.from(this.store.entries())
                .sort((a, b) => a[1].entry.timestamp - b[1].entry.timestamp);

            for (let i = 0; i < entriesToRemove; i++) {
                if (entries[i]) {
                    this.store.delete(entries[i][0]);
                }
            }
        } else if (this.options.evictionStrategy === 'LFU') {
            // Stratégie Least Frequently Used (simulée via relevanceScore)
            const entries = Array.from(this.store.entries())
                .sort((a, b) => (a[1].entry.relevanceScore || 0) - (b[1].entry.relevanceScore || 0));

            for (let i = 0; i < entriesToRemove; i++) {
                if (entries[i]) {
                    this.store.delete(entries[i][0]);
                }
            }
        } else {
            // Stratégie FIFO (First In First Out)
            const entries = Array.from(this.store.entries())
                .sort((a, b) => a[1].entry.timestamp - b[1].entry.timestamp);

            for (let i = 0; i < entriesToRemove; i++) {
                if (entries[i]) {
                    this.store.delete(entries[i][0]);
                }
            }
        }
    }
}