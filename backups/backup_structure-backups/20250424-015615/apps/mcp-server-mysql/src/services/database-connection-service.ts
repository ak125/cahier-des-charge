/**
 * Service de gestion des connexions à MySQL
 * Fournit une interface pour gérer les pools de connexions, les connexions individuelles,
 * et les opérations sur les connexions à MySQL.
 */

import mysql from mysql2/promisestructure-agent';
import { EventEmitter } from eventsstructure-agent';

// Type pour les options de connexion
export interface MySQLConnectionOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | mysql.SslOptions;
  connectionLimit?: number;        // Nombre maximum de connexions dans le pool
  queueLimit?: number;             // Nombre maximum de requêtes en attente
  waitForConnections?: boolean;    // Attendre une connexion disponible
  idleTimeout?: number;            // Temps maximal d'inactivité d'une connexion avant d'être détruite (ms)
  connectionTimeout?: number;      // Temps maximal d'attente pour une connexion (ms)
  timezone?: string;               // Fuseau horaire pour les dates
  charset?: string;                // Jeu de caractères pour la connexion
}

// Type pour les statistiques de pool
export interface PoolStats {
  total: number;       // Nombre total de connexions créées
  free: number;        // Nombre de connexions libres
  busy: number;        // Nombre de connexions occupées
  queued: number;      // Nombre de requêtes en attente
  maxConnections: number;  // Nombre maximum de connexions configurées
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
 * Service de gestion des connexions à MySQL
 * 
 * Caractéristiques:
 * - Gestion de pools de connexions
 * - Reconnexion automatique
 * - Monitoring des connexions
 * - Statistiques sur l'utilisation des connexions
 * - Gestion des timeouts
 * - Support SSL
 */
export class DatabaseConnectionService {
  private pool: mysql.Pool | null = null;
  private connectionOptions: MySQLConnectionOptions;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 secondes
  private eventEmitter: EventEmitter = new EventEmitter();
  private poolStatsInterval: NodeJS.Timeout | null = null;

  /**
   * Crée une nouvelle instance du service de connexion à MySQL
   * @param options Options de connexion ou chaîne de connexion MySQL
   */
  constructor(options: MySQLConnectionOptions | string) {
    if (typeof options === 'string') {
      this.connectionOptions = this.parseConnectionString(options);
    } else {
      this.connectionOptions = { ...options };
    }
  }

  /**
   * Se connecte à la base de données MySQL
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
      // Configurer les options du pool de connexions
      const poolOptions: mysql.PoolOptions = {
        host: this.connectionOptions.host,
        port: this.connectionOptions.port,
        database: this.connectionOptions.database,
        user: this.connectionOptions.user,
        password: this.connectionOptions.password,
        ssl: this.connectionOptions.ssl,
        connectionLimit: this.connectionOptions.connectionLimit || 10,
        queueLimit: this.connectionOptions.queueLimit || 0,
        waitForConnections: this.connectionOptions.waitForConnections !== undefined 
          ? this.connectionOptions.waitForConnections 
          : true,
        connectTimeout: this.connectionOptions.connectionTimeout || 10000,
        timezone: this.connectionOptions.timezone || 'local',
        charset: this.connectionOptions.charset || 'utf8mb4'
      };

      // Créer le pool de connexions
      this.pool = mysql.createPool(poolOptions);

      // Tester la connexion avec une requête simple
      const [rows] = await this.pool.query('SELECT 1 AS test');
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Démarrer la collecte périodique des statistiques du pool
      this.startPoolStats();
      
      console.log(`Connexion MySQL établie: ${this.getConnectionStringForDisplay()}`);
      return;
    } catch (error) {
      this.isConnected = false;
      this.emit('error', error);
      console.error(`Erreur de connexion à MySQL: ${error.message}`);
      
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
      
      throw new Error(`Échec de connexion à MySQL: ${error.message}`);
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
        console.log('Connexion MySQL fermée');
      } catch (error) {
        console.error(`Erreur lors de la fermeture de la connexion MySQL: ${error.message}`);
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
  async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }

    if (!this.pool) {
      throw new Error('La connexion MySQL n\'est pas disponible');
    }

    const startTime = Date.now();
    try {
      const [rows] = await this.pool.query(query, params);
      
      const duration = Date.now() - startTime;
      this.emit('query', query, params, duration);
      
      return rows as T[];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('error', error);
      this.emit('query', query, params, duration);
      
      throw new Error(`Erreur d'exécution de requête: ${error.message}`);
    }
  }

  /**
   * Obtient une connexion depuis le pool
   * @returns Connexion MySQL
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }

    if (!this.pool) {
      throw new Error('La connexion MySQL n\'est pas disponible');
    }

    try {
      return await this.pool.getConnection();
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Erreur d'obtention de connexion: ${error.message}`);
    }
  }

  /**
   * Exécute une fonction dans une transaction
   * @param callback Fonction à exécuter dans la transaction
   * @returns Résultat de la fonction
   */
  async withTransaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Exécute une fonction avec une connexion dédiée du pool
   * @param callback Fonction à exécuter avec la connexion
   * @returns Résultat de la fonction
   */
  async withConnection<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    try {
      return await callback(connection);
    } finally {
      connection.release();
    }
  }

  /**
   * Liste toutes les bases de données accessibles
   * @returns Liste des noms de bases de données
   */
  async listDatabases(): Promise<string[]> {
    try {
      const rows = await this.executeQuery<{Database: string}>('SHOW DATABASES');
      return rows.map(row => row.Database);
    } catch (error) {
      throw new Error(`Erreur de listage des bases de données: ${error.message}`);
    }
  }

  /**
   * Change la base de données courante
   * @param database Nom de la base de données à utiliser
   */
  async useDatabase(database: string): Promise<void> {
    if (!database) {
      throw new Error('Le nom de la base de données ne peut pas être vide');
    }

    try {
      await this.executeQuery(`USE \`${database}\``);
      this.connectionOptions.database = database;
      console.log(`Base de données courante changée pour: ${database}`);
    } catch (error) {
      throw new Error(`Erreur de changement de base de données: ${error.message}`);
    }
  }

  /**
   * Crée une nouvelle base de données si elle n'existe pas déjà
   * @param database Nom de la base de données à créer
   * @param setAsCurrent Définit la nouvelle base de données comme base de données courante si true
   */
  async createDatabase(database: string, setAsCurrent: boolean = false): Promise<void> {
    try {
      await this.executeQuery(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
      console.log(`Base de données '${database}' créée ou déjà existante`);
      
      if (setAsCurrent) {
        await this.useDatabase(database);
      }
    } catch (error) {
      throw new Error(`Erreur de création de base de données: ${error.message}`);
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
    
    // MySQL2 ne fournit pas directement les statistiques du pool
    // Nous utilisons les propriétés internes pour les estimer
    // Ces propriétés peuvent changer dans les futures versions
    const pool = this.pool as any;
    
    return {
      total: pool._allConnections?.length || 0,
      free: pool._freeConnections?.length || 0,
      busy: (pool._allConnections?.length || 0) - (pool._freeConnections?.length || 0),
      queued: pool._connectionQueue?.length || 0,
      maxConnections: this.connectionOptions.connectionLimit || 10
    };
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
    return `mysql://${options.user}:****@${options.host}:${options.port}/${options.database}`;
  }

  /**
   * Analyse une chaîne de connexion MySQL
   * @param connectionString Chaîne de connexion au format mysql://user:password@host:port/database
   * @returns Options de connexion
   */
  private parseConnectionString(connectionString: string): MySQLConnectionOptions {
    try {
      // Vérifier que la chaîne commence par mysql://
      if (!connectionString.startsWith('mysql://')) {
        throw new Error('La chaîne de connexion doit commencer par mysql://');
      }
      
      const url = new URL(connectionString);
      
      // Extraire les paramètres
      const host = url.hostname;
      const port = url.port ? parseInt(url.port, 10) : 3306;
      const database = url.pathname.slice(1); // Supprimer le / initial
      const user = url.username;
      const password = url.password;
      
      // Paramètres optionnels
      const ssl = url.searchParams.get('ssl') === 'true';
      const connectionLimit = url.searchParams.get('connectionLimit') 
        ? parseInt(url.searchParams.get('connectionLimit') as string, 10) 
        : undefined;
      const queueLimit = url.searchParams.get('queueLimit') 
        ? parseInt(url.searchParams.get('queueLimit') as string, 10) 
        : undefined;
      const waitForConnections = url.searchParams.get('waitForConnections') === 'true';
      const idleTimeout = url.searchParams.get('idleTimeout') 
        ? parseInt(url.searchParams.get('idleTimeout') as string, 10) 
        : undefined;
      const connectionTimeout = url.searchParams.get('connectionTimeout') 
        ? parseInt(url.searchParams.get('connectionTimeout') as string, 10) 
        : undefined;
      const timezone = url.searchParams.get('timezone') || undefined;
      const charset = url.searchParams.get('charset') || undefined;
      
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
        ssl,
        connectionLimit,
        queueLimit,
        waitForConnections,
        idleTimeout,
        connectionTimeout,
        timezone,
        charset
      };
    } catch (error) {
      throw new Error(`Erreur d'analyse de la chaîne de connexion: ${error.message}`);
    }
  }
}