/**
 * Service de gestion des connexions à PostgreSQL
 * Fournit une interface pour gérer les pools de connexions, les connexions individuelles,
 * et les opérations sur les connexions à PostgreSQL.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { EventEmitter } from 'events';

// Type pour les options de connexion
export interface PostgresConnectionOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  schema?: string;
  ssl?: boolean;
  max?: number;                      // Nombre maximum de clients dans le pool
  idleTimeoutMillis?: number;        // Temps maximal d'inactivité d'un client avant d'être détruit
  connectionTimeoutMillis?: number;  // Temps maximal d'attente pour une connexion
  application_name?: string;         // Nom de l'application pour les logs PostgreSQL
}

// Type pour les statistiques de pool
export interface PoolStats {
  total: number;       // Nombre total de clients créés
  idle: number;        // Nombre de clients en attente
  active: number;      // Nombre de clients actifs
  waiting: number;     // Nombre de demandes en attente d'un client
  maxClients: number;  // Nombre maximum de clients configurés
}

// Type pour les événements du service
export interface DatabaseConnectionEvents {
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  warning: (message: string) => void;
  query: (query: string, params: any[], duration: number) => void;
  poolStats: (stats: PoolStats) => void;
}

/**
 * Service de gestion des connexions à PostgreSQL
 * 
 * Caractéristiques:
 * - Gestion de pools de connexions
 * - Reconnexion automatique
 * - Monitoring des connexions
 * - Statistiques sur l'utilisation des connexions
 * - Gestion des timeouts
 * - Support SSL
 * - Gestion des schémas
 */
export class DatabaseConnectionService {
  private pool: Pool | null = null;
  private connectionOptions: PostgresConnectionOptions;
  private currentSchema: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 secondes
  private eventEmitter: EventEmitter = new EventEmitter();
  private poolStatsInterval: NodeJS.Timeout | null = null;

  /**
   * Crée une nouvelle instance du service de connexion à PostgreSQL
   * @param options Options de connexion ou chaîne de connexion PostgreSQL
   */
  constructor(options: PostgresConnectionOptions | string) {
    if (typeof options === 'string') {
      this.connectionOptions = this.parseConnectionString(options);
    } else {
      this.connectionOptions = { ...options };
    }

    this.currentSchema = this.connectionOptions.schema || 'public';
  }

  /**
   * Se connecte à la base de données PostgreSQL
   * @param forceNew Force la création d'une nouvelle connexion même si une connexion existe déjà
   * @returns Promise résolu quand la connexion est établie
   */
  async connect(forceNew: boolean = false): Promise<void> {
    if (this.isConnected && this.pool && !forceNew) {
      return;
    }

    if (this.pool) {
      await this.disconnect();
    }

    try {
      this.pool = new Pool({
        host: this.connectionOptions.host,
        port: this.connectionOptions.port,
        database: this.connectionOptions.database,
        user: this.connectionOptions.user,
        password: this.connectionOptions.password,
        ssl: this.connectionOptions.ssl ? { rejectUnauthorized: false } : undefined,
        max: this.connectionOptions.max || 10,
        idleTimeoutMillis: this.connectionOptions.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.connectionOptions.connectionTimeoutMillis || 5000,
        application_name: this.connectionOptions.application_name || 'postgres-connection-service'
      });

      // Mettre en place les écouteurs d'événements du pool
      this.setupPoolListeners();

      // Tester la connexion avec une requête simple
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        
        // Si on a un schéma spécifique, essayons de le définir
        if (this.currentSchema !== 'public') {
          await client.query(`SET search_path TO ${this.currentSchema}, public`);
        }
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Démarrer la collecte périodique des statistiques du pool
        this.startPoolStats();
        
        console.log(`Connexion PostgreSQL établie: ${this.getConnectionStringForDisplay()}`);
        return;
      } finally {
        client.release();
      }
    } catch (error) {
      this.isConnected = false;
      this.emit('error', error);
      console.error(`Erreur de connexion à PostgreSQL: ${error.message}`);
      
      // Tentative de reconnexion automatique si configurée
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.emit('warning', `Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${this.reconnectInterval}ms`);
        
        setTimeout(() => {
          this.connect(true).catch(e => {
            console.error(`Échec de la tentative de reconnexion: ${e.message}`);
          });
        }, this.reconnectInterval);
      }
      
      throw new Error(`Échec de connexion à PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Ferme la connexion à la base de données
   * @returns Promise résolu quand la connexion est fermée
   */
  async disconnect(): Promise<void> {
    if (this.poolStatsInterval) {
      clearInterval(this.poolStatsInterval);
      this.poolStatsInterval = null;
    }

    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        this.emit('disconnected');
        console.log('Connexion PostgreSQL fermée');
      } catch (error) {
        console.error(`Erreur lors de la fermeture de la connexion PostgreSQL: ${error.message}`);
        throw new Error(`Erreur de fermeture de connexion: ${error.message}`);
      }
    }
  }

  /**
   * Exécute une requête SQL et retourne le résultat
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête (optionnel)
   * @returns Résultat de la requête
   */
  async executeQuery<T = any>(query: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }

    if (!this.pool) {
      throw new Error('La connexion PostgreSQL n\'est pas disponible');
    }

    const startTime = Date.now();
    try {
      const result = await this.pool.query<T>(query, params);
      
      const duration = Date.now() - startTime;
      this.emit('query', query, params, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('error', error);
      this.emit('query', query, params, duration);
      
      throw new Error(`Erreur d'exécution de requête: ${error.message}`);
    }
  }

  /**
   * Obtient un client de connexion depuis le pool
   * @returns Client de connexion PostgreSQL
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }

    if (!this.pool) {
      throw new Error('La connexion PostgreSQL n\'est pas disponible');
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Erreur d'obtention de client: ${error.message}`);
    }
  }

  /**
   * Exécute une fonction dans une transaction
   * @param callback Fonction à exécuter dans la transaction
   * @returns Résultat de la fonction
   */
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Exécute une fonction avec un client dédié du pool
   * @param callback Fonction à exécuter avec le client
   * @returns Résultat de la fonction
   */
  async withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  /**
   * Change le schéma courant
   * @param schema Nom du schéma à utiliser
   */
  async setSchema(schema: string): Promise<void> {
    if (!schema) {
      throw new Error('Le nom du schéma ne peut pas être vide');
    }

    try {
      // Vérifier que le schéma existe
      const result = await this.executeQuery(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
        [schema]
      );

      if (result.rowCount === 0) {
        throw new Error(`Le schéma '${schema}' n'existe pas`);
      }

      this.currentSchema = schema;
      console.log(`Schéma courant changé pour: ${schema}`);
    } catch (error) {
      throw new Error(`Erreur de changement de schéma: ${error.message}`);
    }
  }

  /**
   * Crée un nouveau schéma s'il n'existe pas déjà
   * @param schema Nom du schéma à créer
   * @param setAsCurrent Définit le nouveau schéma comme schéma courant si true
   */
  async createSchema(schema: string, setAsCurrent: boolean = false): Promise<void> {
    try {
      await this.executeQuery(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`Schéma '${schema}' créé ou déjà existant`);
      
      if (setAsCurrent) {
        await this.setSchema(schema);
      }
    } catch (error) {
      throw new Error(`Erreur de création de schéma: ${error.message}`);
    }
  }

  /**
   * Liste tous les schémas disponibles
   * @returns Liste des noms de schémas
   */
  async listSchemas(): Promise<string[]> {
    try {
      const result = await this.executeQuery(
        `SELECT schema_name 
         FROM information_schema.schemata 
         WHERE schema_name NOT LIKE 'pg_%' 
         AND schema_name != 'information_schema'
         ORDER BY schema_name`
      );
      
      return result.rows.map(row => row.schema_name);
    } catch (error) {
      throw new Error(`Erreur de listage des schémas: ${error.message}`);
    }
  }

  /**
   * Teste si la connexion à la base de données est active
   * @returns true si la connexion est active, false sinon
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool || !this.isConnected) {
        await this.connect();
      }
      
      await this.executeQuery('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les statistiques actuelles du pool de connexions
   * @returns Statistiques du pool
   */
  getPoolStats(): PoolStats | null {
    if (!this.pool) {
      return null;
    }
    
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      active: this.pool.totalCount - this.pool.idleCount,
      waiting: this.pool.waitingCount,
      maxClients: this.pool.options.max || 10
    };
  }

  /**
   * Récupère le schéma courant
   * @returns Nom du schéma courant
   */
  getCurrentSchema(): string {
    return this.currentSchema;
  }

  /**
   * Vérifie si le service est connecté à la base de données
   * @returns true si connecté, false sinon
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Enregistre un écouteur d'événements
   * @param event Nom de l'événement
   * @param listener Fonction à appeler quand l'événement se produit
   */
  on<K extends keyof DatabaseConnectionEvents>(
    event: K, 
    listener: DatabaseConnectionEvents[K]
  ): this {
    this.eventEmitter.on(event, listener as any);
    return this;
  }

  /**
   * Retire un écouteur d'événements
   * @param event Nom de l'événement
   * @param listener Fonction à retirer
   */
  off<K extends keyof DatabaseConnectionEvents>(
    event: K, 
    listener: DatabaseConnectionEvents[K]
  ): this {
    this.eventEmitter.off(event, listener as any);
    return this;
  }

  /**
   * Définit les options de reconnexion automatique
   * @param maxAttempts Nombre maximum de tentatives de reconnexion
   * @param interval Intervalle entre les tentatives en millisecondes
   */
  setReconnectOptions(maxAttempts: number, interval: number): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectInterval = interval;
  }

  // ====== Méthodes privées ======

  /**
   * Émet un événement via l'émetteur d'événements
   * @param event Nom de l'événement
   * @param args Arguments à passer à l'écouteur
   */
  private emit<K extends keyof DatabaseConnectionEvents>(
    event: K,
    ...args: Parameters<DatabaseConnectionEvents[K]>
  ): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  /**
   * Configure les écouteurs d'événements pour le pool de connexions
   */
  private setupPoolListeners(): void {
    if (!this.pool) return;

    this.pool.on('error', (err) => {
      console.error('Erreur non gérée dans le pool de connexions PostgreSQL:', err.message);
      this.emit('error', err);
      
      if (this.isConnected) {
        this.isConnected = false;
        this.emit('disconnected');
        
        // Tenter de se reconnecter
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.emit('warning', `Erreur de pool détectée. Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          setTimeout(() => {
            this.connect(true).catch(e => {
              console.error(`Échec de la tentative de reconnexion après erreur de pool: ${e.message}`);
            });
          }, this.reconnectInterval);
        }
      }
    });
  }

  /**
   * Démarre la collecte périodique des statistiques du pool
   */
  private startPoolStats(): void {
    if (this.poolStatsInterval) {
      clearInterval(this.poolStatsInterval);
    }
    
    this.poolStatsInterval = setInterval(() => {
      const stats = this.getPoolStats();
      if (stats) {
        this.emit('poolStats', stats);
      }
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Obtient la chaîne de connexion masquée pour l'affichage (sans le mot de passe)
   * @returns Chaîne de connexion masquée
   */
  private getConnectionStringForDisplay(): string {
    const options = this.connectionOptions;
    return `postgresql://${options.user}:****@${options.host}:${options.port}/${options.database}`;
  }

  /**
   * Analyse une chaîne de connexion PostgreSQL
   * @param connectionString Chaîne de connexion au format postgresql://user:password@host:port/database
   * @returns Options de connexion
   */
  private parseConnectionString(connectionString: string): PostgresConnectionOptions {
    try {
      // Vérifier que la chaîne commence par postgresql:// ou postgres://
      if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
        throw new Error('La chaîne de connexion doit commencer par postgresql:// ou postgres://');
      }
      
      const url = new URL(connectionString);
      
      // Extraire les paramètres
      const host = url.hostname;
      const port = url.port ? parseInt(url.port, 10) : 5432;
      const database = url.pathname.slice(1); // Supprimer le / initial
      const user = url.username;
      const password = url.password;
      
      // Paramètres optionnels
      const schema = url.searchParams.get('schema') || 'public';
      const ssl = url.searchParams.get('ssl') === 'true';
      const max = url.searchParams.get('max') ? parseInt(url.searchParams.get('max') as string, 10) : undefined;
      const idleTimeoutMillis = url.searchParams.get('idleTimeoutMillis') 
        ? parseInt(url.searchParams.get('idleTimeoutMillis') as string, 10) 
        : undefined;
      const connectionTimeoutMillis = url.searchParams.get('connectionTimeoutMillis')
        ? parseInt(url.searchParams.get('connectionTimeoutMillis') as string, 10)
        : undefined;
      const application_name = url.searchParams.get('application_name') || undefined;
      
      // Vérifier les paramètres obligatoires
      if (!host || !database || !user) {
        throw new Error('La chaîne de connexion doit contenir un hôte, une base de données et un utilisateur');
      }
      
      return {
        host,
        port,
        database,
        user,
        password,
        schema,
        ssl,
        max,
        idleTimeoutMillis,
        connectionTimeoutMillis,
        application_name
      };
    } catch (error) {
      throw new Error(`Erreur d'analyse de la chaîne de connexion: ${error.message}`);
    }
  }
}