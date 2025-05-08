/**
 * long-term-memo-store.ts
 * 
 * Implémentation de la mémoire à long terme pour les agents MCP
 * Stocke les données dans des fichiers JSON ou bases vectorielles
 * pour une persistance et une recherche sémantique
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { MemoEntry, MemoQueryOptions, MemoStore, MemoStoreOptions } from '../interfaces/memo-store';

/**
 * Options spécifiques pour la mémoire à long terme
 */
export interface LongTermMemoOptions extends MemoStoreOptions {
    /**
     * Mode de stockage
     */
    mode: 'json' | 'sqlite' | 'qdrant' | 'supabase';

    /**
     * Chemin du dossier de stockage
     */
    storagePath?: string;

    /**
     * Configuration de la base de données
     */
    database?: {
        url?: string;
        key?: string;
        name?: string;
        connectionString?: string;
    };

    /**
     * Mode d'indexation vectorielle
     */
    vectorIndexing?: boolean;

    /**
     * Dimensions des embeddings vectoriels
     */
    embeddingDimension?: number;

    /**
     * Fréquence de sauvegarde automatique (ms)
     */
    autoSaveInterval?: number;
}

/**
 * Structure pour le cache en mémoire
 */
interface MemoryCache<T> {
    [key: string]: MemoEntry<T>;
}

/**
 * Classe implémentant une mémoire à long terme pour les agents
 */
export class LongTermMemoStore<T = any> implements MemoStore<T> {
    public readonly storeName: string = 'long-term';

    private options: LongTermMemoOptions;
    private cache: MemoryCache<T> = {};
    private isDirty = false;
    private autoSaveInterval: NodeJS.Timeout | null = null;
    private vectorClient: any = null;
    private dbClient: any = null;

    constructor(name?: string) {
        if (name) {
            this.storeName = `long-term:${name}`;
        }

        this.options = {
            mode: 'json',
            storagePath: './.memo-store',
            ttl: 30 * 24 * 60 * 60 * 1000, // 30 jours par défaut
            autoSaveInterval: 60 * 1000, // 1 minute
            vectorIndexing: false
        };
    }

    /**
     * Initialise le store avec des options
     */
    async initialize(options?: LongTermMemoOptions): Promise<void> {
        this.options = { ...this.options, ...options };

        // Assurer que le dossier de stockage existe
        if (this.options.storagePath) {
            await fs.mkdir(this.options.storagePath, { recursive: true });
        }

        // Charger les données existantes si disponibles
        await this.loadFromDisk();

        // Initialiser le client vectoriel si nécessaire
        if (this.options.vectorIndexing) {
            await this.initializeVectorStore();
        }

        // Initialiser la base de données si nécessaire
        if (this.options.mode === 'sqlite') {
            await this.initializeSQLite();
        } else if (this.options.mode === 'supabase') {
            await this.initializeSupabase();
        }

        // Configurer la sauvegarde automatique
        if (this.options.autoSaveInterval && this.options.autoSaveInterval > 0) {
            this.startAutoSave();
        }
    }

    /**
     * Démarre la sauvegarde automatique périodique
     */
    private startAutoSave(): void {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.isDirty) {
                try {
                    await this.saveToDisk();
                    this.isDirty = false;
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde automatique :', error);
                }
            }
        }, this.options.autoSaveInterval);
    }

    /**
     * Initialise le client pour base vectorielle
     */
    private async initializeVectorStore(): Promise<void> {
        if (this.options.mode === 'qdrant') {
            try {
                // Note: En production, on importerait la bibliothèque Qdrant
                // const { QdrantClient } = await import('@qdrant/js-client-rest');
                // this.vectorClient = new QdrantClient({
                //   url: this.options.database?.url || 'http://localhost:6333'
                // });
                console.log('Client Qdrant serait initialisé ici en production');

                // Créer la collection si elle n'existe pas
                // const collectionName = this.storeName.replace(/[^a-zA-Z0-9_]/g, '_');
                // const collections = await this.vectorClient.listCollections();
                // const exists = collections.some(c => c.name === collectionName);
                // 
                // if (!exists) {
                //   await this.vectorClient.createCollection(collectionName, {
                //     vectors: {
                //       size: this.options.embeddingDimension || 1536,
                //       distance: 'Cosine'
                //     }
                //   });
                // }
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de Qdrant :', error);
                console.warn('Fallback en mode fichiers JSON');
                this.options.mode = 'json';
            }
        }
    }

    /**
     * Initialise le client SQLite
     */
    private async initializeSQLite(): Promise<void> {
        try {
            // Note: En production, on importerait la bibliothèque SQLite
            // const sqlite3 = await import('sqlite3');
            // const { Database } = await import('sqlite');
            // 
            // const dbPath = join(this.options.storagePath || '.', `${this.storeName}.sqlite`);
            // this.dbClient = await Database.open({
            //   filename: dbPath,
            //   driver: sqlite3.Database
            // });
            // 
            // await this.dbClient.exec(`
            //   CREATE TABLE IF NOT EXISTS memo_entries (
            //     key TEXT PRIMARY KEY,
            //     entry TEXT NOT NULL,
            //     timestamp INTEGER NOT NULL,
            //     expiry INTEGER
            //   )
            // `);

            console.log('Client SQLite serait initialisé ici en production');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de SQLite :', error);
            console.warn('Fallback en mode fichiers JSON');
            this.options.mode = 'json';
        }
    }

    /**
     * Initialise le client Supabase
     */
    private async initializeSupabase(): Promise<void> {
        try {
            // Note: En production, on importerait la bibliothèque Supabase
            // const { createClient } = await import('@supabase/supabase-js');
            // 
            // const supabaseUrl = this.options.database?.url || '';
            // const supabaseKey = this.options.database?.key || '';
            // 
            // this.dbClient = createClient(supabaseUrl, supabaseKey);
            // 
            // // Vérifier si la table existe déjà
            // const { error } = await this.dbClient.from('memo_entries').select('count', { count: 'exact', head: true });
            // 
            // if (error && error.code === '42P01') {
            //   // Créer la table et l'index (à travers une migration SQL)
            //   // Dans un vrai projet, cela serait fait via migrations
            //   console.log('La table memo_entries doit être créée dans Supabase');
            // }

            console.log('Client Supabase serait initialisé ici en production');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de Supabase :', error);
            console.warn('Fallback en mode fichiers JSON');
            this.options.mode = 'json';
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
     * Chemin du fichier de stockage
     */
    private get storageFilePath(): string {
        const filename = `${this.storeName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
        return join(this.options.storagePath || '.', filename);
    }

    /**
     * Charge les données depuis le disque
     */
    private async loadFromDisk(): Promise<void> {
        if (this.options.mode !== 'json') return;

        try {
            const filePath = this.storageFilePath;
            const data = await fs.readFile(filePath, 'utf-8');
            const entries = JSON.parse(data);

            // Filtrer les entrées expirées
            const now = Date.now();
            for (const [key, entry] of Object.entries(entries)) {
                const typedEntry = entry as MemoEntry<T>;
                const expiry = typedEntry.timestamp + (this.options.ttl || 0);

                if (!this.options.ttl || expiry > now) {
                    this.cache[key] = typedEntry;
                }
            }

            console.log(`Chargé ${Object.keys(this.cache).length} entrées depuis ${filePath}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Erreur lors du chargement des données :', error);
            }
            // Si le fichier n'existe pas, on commence avec un cache vide
            this.cache = {};
        }
    }

    /**
     * Sauvegarde les données sur le disque
     */
    private async saveToDisk(): Promise<void> {
        if (this.options.mode !== 'json') return;

        try {
            const filePath = this.storageFilePath;
            await fs.mkdir(dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(this.cache, null, 2));
            console.log(`Sauvegardé ${Object.keys(this.cache).length} entrées vers ${filePath}`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données :', error);
        }
    }

    /**
     * Stocke une entrée mémoire
     */
    async set(key: string, entry: MemoEntry<T>): Promise<void> {
        // Calculer un hash si non fourni
        if (!entry.contentHash) {
            entry.contentHash = this.generateContentHash(entry.data);
        }

        if (this.options.mode === 'json') {
            this.cache[key] = entry;
            this.isDirty = true;
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            const expiry = this.options.ttl ? entry.timestamp + this.options.ttl : null;
            const serializedEntry = JSON.stringify(entry);

            await this.dbClient.run(
                'INSERT OR REPLACE INTO memo_entries (key, entry, timestamp, expiry) VALUES (?, ?, ?, ?)',
                [key, serializedEntry, entry.timestamp, expiry]
            );
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            const { error } = await this.dbClient
                .from('memo_entries')
                .upsert({
                    key,
                    entry: entry,
                    timestamp: entry.timestamp,
                    expiry: this.options.ttl ? entry.timestamp + this.options.ttl : null,
                    agent_id: entry.agentId,
                    type: entry.type,
                    run_id: entry.runId || null
                });

            if (error) {
                console.error('Erreur lors de l\'insertion dans Supabase :', error);
            }
        }

        // Si l'indexation vectorielle est activée et qu'il y a des embeddings dans les métadonnées
        if (
            this.options.vectorIndexing &&
            this.vectorClient &&
            entry.metadata?.embeddings
        ) {
            try {
                const collectionName = this.storeName.replace(/[^a-zA-Z0-9_]/g, '_');

                // Exemple avec Qdrant
                // await this.vectorClient.upsert(collectionName, {
                //   wait: true,
                //   points: [
                //     {
                //       id: key,
                //       vector: entry.metadata.embeddings,
                //       payload: {
                //         entryId: entry.id,
                //         agentId: entry.agentId,
                //         type: entry.type,
                //         timestamp: entry.timestamp,
                //         summary: entry.metadata?.summary || "",
                //         runId: entry.runId || ""
                //       }
                //     }
                //   ]
                // });
            } catch (error) {
                console.error('Erreur lors de l\'indexation vectorielle :', error);
            }
        }
    }

    /**
     * Récupère une entrée par sa clé
     */
    async get(key: string): Promise<MemoEntry<T> | null> {
        if (this.options.mode === 'json') {
            const entry = this.cache[key];
            if (!entry) return null;

            // Vérifier si l'entrée est expirée
            if (this.options.ttl) {
                const expiry = entry.timestamp + this.options.ttl;
                if (expiry < Date.now()) {
                    delete this.cache[key];
                    this.isDirty = true;
                    return null;
                }
            }

            return entry;
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            const row = await this.dbClient.get(
                'SELECT * FROM memo_entries WHERE key = ? AND (expiry IS NULL OR expiry > ?)',
                [key, Date.now()]
            );

            if (!row) return null;

            try {
                return JSON.parse(row.entry);
            } catch (error) {
                console.error('Erreur lors de la désérialisation :', error);
                return null;
            }
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            const { data, error } = await this.dbClient
                .from('memo_entries')
                .select('entry')
                .eq('key', key)
                .gt('expiry', Date.now())
                .maybeSingle();

            if (error) {
                console.error('Erreur lors de la récupération depuis Supabase :', error);
                return null;
            }

            return data?.entry || null;
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
        if (this.options.mode === 'json') {
            const exists = key in this.cache;
            if (exists) {
                delete this.cache[key];
                this.isDirty = true;
            }
            return exists;
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            const result = await this.dbClient.run(
                'DELETE FROM memo_entries WHERE key = ?',
                [key]
            );
            return result.changes > 0;
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            const { error } = await this.dbClient
                .from('memo_entries')
                .delete()
                .eq('key', key);

            return !error;
        }

        // Si l'indexation vectorielle est activée, supprimer l'entrée du index vectoriel
        if (this.options.vectorIndexing && this.vectorClient) {
            try {
                const collectionName = this.storeName.replace(/[^a-zA-Z0-9_]/g, '_');

                // Exemple avec Qdrant
                // await this.vectorClient.delete(collectionName, {
                //   wait: true,
                //   points: [key]
                // });
            } catch (error) {
                console.error('Erreur lors de la suppression vectorielle :', error);
            }
        }

        return false;
    }

    /**
     * Recherche des entrées par requête
     */
    async query(query: Record<string, any>, options?: MemoQueryOptions): Promise<MemoEntry<T>[]> {
        if (this.options.mode === 'json') {
            const results: MemoEntry<T>[] = [];
            const now = Date.now();

            // Filtrer les entrées expirées et correspondant à la requête
            for (const [key, entry] of Object.entries(this.cache)) {
                // Vérifier l'expiration
                if (this.options.ttl) {
                    const expiry = entry.timestamp + this.options.ttl;
                    if (expiry < now) {
                        delete this.cache[key];
                        this.isDirty = true;
                        continue;
                    }
                }

                // Vérifier la correspondance avec la requête
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
            }

            // Appliquer le tri
            if (options?.sort) {
                results.sort((a, b) => {
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

            // Appliquer la pagination
            const offset = options?.offset || 0;
            const limit = options?.limit || results.length;

            return results.slice(offset, offset + limit);
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            let sql = 'SELECT entry FROM memo_entries WHERE (expiry IS NULL OR expiry > ?)';
            const params: any[] = [Date.now()];

            // Construire la clause WHERE
            for (const [key, value] of Object.entries(query)) {
                if (!key.includes('.')) {
                    sql += ` AND json_extract(entry, '$.${key}') = ?`;
                    params.push(value);
                } else {
                    const [parent, child] = key.split('.');
                    sql += ` AND json_extract(entry, '$.${parent}.${child}') = ?`;
                    params.push(value);
                }
            }

            // Tri
            if (options?.sort) {
                const field = options.sort.field.includes('.')
                    ? `$.${options.sort.field.split('.').join('.')}`
                    : `$.${options.sort.field}`;

                sql += ` ORDER BY json_extract(entry, '${field}') ${options.sort.order === 'asc' ? 'ASC' : 'DESC'}`;
            }

            // Pagination
            if (options?.limit) {
                sql += ' LIMIT ?';
                params.push(options.limit);

                if (options.offset) {
                    sql += ' OFFSET ?';
                    params.push(options.offset);
                }
            }

            const rows = await this.dbClient.all(sql, params);
            return rows.map(row => JSON.parse(row.entry));
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            let supaQuery = this.dbClient
                .from('memo_entries')
                .select('entry')
                .gt('expiry', Date.now());

            // Filtrage
            for (const [key, value] of Object.entries(query)) {
                if (key === 'agentId') {
                    supaQuery = supaQuery.eq('agent_id', value);
                } else if (key === 'type') {
                    supaQuery = supaQuery.eq('type', value);
                } else if (key === 'runId') {
                    supaQuery = supaQuery.eq('run_id', value);
                }
            }

            // Tri
            if (options?.sort && options.sort.field) {
                const order = options.sort.order === 'asc' ? true : false;

                if (options.sort.field === 'timestamp') {
                    supaQuery = supaQuery.order('timestamp', { ascending: order });
                } else if (options.sort.field === 'agentId') {
                    supaQuery = supaQuery.order('agent_id', { ascending: order });
                } else if (options.sort.field === 'type') {
                    supaQuery = supaQuery.order('type', { ascending: order });
                }
            }

            // Pagination
            if (options?.limit) {
                supaQuery = supaQuery.limit(options.limit);
            }

            if (options?.offset) {
                supaQuery = supaQuery.range(options.offset, options.offset + (options.limit || 20) - 1);
            }

            const { data, error } = await supaQuery;

            if (error) {
                console.error('Erreur lors de la requête Supabase :', error);
                return [];
            }

            return data.map(item => item.entry);
        }

        return [];
    }

    /**
     * Recherche sémantique dans les entrées
     */
    async findSimilar(embeddings: number[], options?: MemoQueryOptions): Promise<MemoEntry<T>[]> {
        if (!this.options.vectorIndexing || !this.vectorClient) {
            console.warn('Recherche vectorielle non disponible sans indexation activée');
            return [];
        }

        try {
            const collectionName = this.storeName.replace(/[^a-zA-Z0-9_]/g, '_');
            const limit = options?.limit || 10;
            const threshold = options?.similarityThreshold || 0.75;

            // Exemple avec Qdrant
            // const results = await this.vectorClient.search(collectionName, {
            //   vector: embeddings,
            //   limit,
            //   filter: options?.filters || undefined,
            //   with_payload: true
            // });
            // 
            // const matchingEntries: MemoEntry<T>[] = [];
            // 
            // for (const hit of results) {
            //   if (hit.score < threshold) continue;
            //   
            //   // Récupérer l'entrée complète par sa clé
            //   const entry = await this.get(hit.id);
            //   if (entry) {
            //     matchingEntries.push(entry);
            //   }
            // }
            // 
            // return matchingEntries;

            // Version simulée
            console.log('Simulation de recherche vectorielle avec', limit, 'résultats et seuil', threshold);
            return [];
        } catch (error) {
            console.error('Erreur lors de la recherche vectorielle :', error);
            return [];
        }
    }

    /**
     * Supprime toutes les entrées
     */
    async clear(): Promise<void> {
        if (this.options.mode === 'json') {
            this.cache = {};
            this.isDirty = true;
            await this.saveToDisk();
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            await this.dbClient.run('DELETE FROM memo_entries');
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            await this.dbClient.from('memo_entries').delete().neq('key', 'dummy_preserve');
        }

        // Vider aussi l'index vectoriel
        if (this.options.vectorIndexing && this.vectorClient) {
            try {
                const collectionName = this.storeName.replace(/[^a-zA-Z0-9_]/g, '_');

                // Exemple avec Qdrant
                // await this.vectorClient.deleteCollection(collectionName);
                // await this.initializeVectorStore(); // Recréer la collection vide
            } catch (error) {
                console.error('Erreur lors de la suppression de la collection vectorielle :', error);
            }
        }
    }

    /**
     * Supprime les entrées expirées
     */
    async cleanup(): Promise<number> {
        let removedCount = 0;
        const now = Date.now();

        if (this.options.mode === 'json') {
            if (!this.options.ttl) return 0;

            const keysToRemove: string[] = [];

            // Identifier les entrées expirées
            for (const [key, entry] of Object.entries(this.cache)) {
                const expiry = entry.timestamp + this.options.ttl;
                if (expiry < now) {
                    keysToRemove.push(key);
                }
            }

            // Supprimer les entrées expirées
            for (const key of keysToRemove) {
                delete this.cache[key];
                removedCount++;
            }

            if (removedCount > 0) {
                this.isDirty = true;
                await this.saveToDisk();
            }
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            const result = await this.dbClient.run(
                'DELETE FROM memo_entries WHERE expiry IS NOT NULL AND expiry < ?',
                [now]
            );
            removedCount = result.changes || 0;
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            const { error } = await this.dbClient
                .from('memo_entries')
                .delete()
                .lt('expiry', now);

            if (error) {
                console.error('Erreur lors du nettoyage Supabase :', error);
            } else {
                // Impossible de connaître le nombre exact sans requête supplémentaire
                removedCount = 1; // Juste pour indiquer un succès
            }
        }

        return removedCount;
    }

    /**
     * Retourne le nombre d'entrées
     */
    async count(): Promise<number> {
        if (this.options.mode === 'json') {
            return Object.keys(this.cache).length;
        } else if (this.options.mode === 'sqlite' && this.dbClient) {
            const result = await this.dbClient.get(
                'SELECT COUNT(*) as count FROM memo_entries WHERE expiry IS NULL OR expiry > ?',
                [Date.now()]
            );
            return result.count;
        } else if (this.options.mode === 'supabase' && this.dbClient) {
            const { count, error } = await this.dbClient
                .from('memo_entries')
                .select('*', { count: 'exact', head: true })
                .gt('expiry', Date.now());

            if (error) {
                console.error('Erreur lors du comptage Supabase :', error);
                return 0;
            }

            return count || 0;
        }

        return 0;
    }

    /**
     * Ferme le store
     */
    async close(): Promise<void> {
        // Arrêter la sauvegarde automatique
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        // Sauvegarder les changements non persistés
        if (this.isDirty && this.options.mode === 'json') {
            await this.saveToDisk();
        }

        // Fermer les connexions aux bases de données
        if (this.dbClient) {
            if (this.options.mode === 'sqlite') {
                await this.dbClient.close();
            }
            this.dbClient = null;
        }

        // Fermer le client vectoriel
        if (this.vectorClient) {
            // La plupart des clients n'ont pas besoin d'être fermés explicitement
            this.vectorClient = null;
        }
    }
}