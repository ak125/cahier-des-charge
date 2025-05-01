#!/usr/bin/env node
/**
 * @modelcontextprotocol/server-postgres
 * 
 * Serveur MCP pour PostgreSQL - Exploration, analyse et manipulation de bases PostgreSQL
 * Ce serveur implémente le protocole Model Context Protocol pour interagir avec des bases PostgreSQL
 */

import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createLogger, format, transports } from 'winston';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Services et utilitaires
import { DatabaseConnectionService } from './services/database-connection-service';
import {
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  MCPResult,
  MCPServerConfig,
  PrismaModel,
  SchemaDiff,
  SchemaMap,
  TableInfo
} from './types';

// Charger la configuration depuis .env si disponible
dotenv.config();

// Configuration du logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'mcp-postgres.log' })
  ]
});

/**
 * Classe principale du serveur MCP PostgreSQL
 */
class PostgresMCPServer {
  private app: express.Application;
  private dbService: DatabaseConnectionService;
  private port: number;
  private host: string;
  private connectionString: string;
  private schema: string;
  private config: MCPServerConfig;

  /**
   * Constructeur
   * @param connectionString Chaîne de connexion PostgreSQL
   * @param config Configuration supplémentaire du serveur
   */
  constructor(connectionString: string, config: Partial<MCPServerConfig> = {}) {
    this.connectionString = connectionString;

    // Configuration par défaut
    this.config = {
      port: config.port || parseInt(process.env.MCP_PORT || '3050', 10),
      host: config.host || process.env.MCP_HOST || 'localhost',
      connectionString: this.connectionString,
      verbose: config.verbose !== undefined ? config.verbose : true,
      allowedOrigins: config.allowedOrigins || ['*']
    };

    this.port = this.config.port;
    this.host = this.config.host;
    this.schema = 'public'; // Par défaut

    // Extraire le schéma de la chaîne de connexion si présent
    if (connectionString.includes('?schema=')) {
      const schemaMatch = connectionString.match(/\?schema=([^&]+)/);
      if (schemaMatch?.[1]) {
        this.schema = schemaMatch[1];
      }
    }

    // Initialiser le service de connexion à la base de données
    this.dbService = new DatabaseConnectionService(connectionString);

    // Configuration des écouteurs d'événements pour le service de connexion
    this.setupDatabaseListeners();

    // Initialiser l'application Express
    this.app = express();
    this.app.use(cors({
      origin: this.config.allowedOrigins?.includes('*')
        ? '*'
        : this.config.allowedOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    this.app.use(bodyParser.json());

    // Initialiser les routes API
    this.setupRoutes();

    logger.info(`Serveur MCP PostgreSQL initialisé avec le schéma: ${this.schema}`);
  }

  /**
   * Configure les écouteurs d'événements pour le service de base de données
   */
  private setupDatabaseListeners(): void {
    this.dbService.on('connected', () => {
      logger.info('🔌 Connexion à PostgreSQL établie');
    });

    this.dbService.on('disconnected', () => {
      logger.info('🔌 Déconnexion de PostgreSQL');
    });

    this.dbService.on('error', (error) => {
      logger.error(`❌ Erreur PostgreSQL: ${error.message}`);
    });

    this.dbService.on('warning', (message) => {
      logger.warn(`⚠️ Avertissement PostgreSQL: ${message}`);
    });

    if (this.config.verbose) {
      this.dbService.on('query', (query, _params, duration) => {
        logger.debug(`⏱️ Requête (${duration}ms): ${query.substring(0, 80)}${query.length > 80 ? '...' : ''}`);
      });

      this.dbService.on('poolStats', (stats) => {
        logger.debug(`📊 Stats pool: ${stats.active}/${stats.total} actifs, ${stats.idle} inactifs, ${stats.waiting} en attente`);
      });
    }
  }

  /**
   * Configure les routes de l'API
   */
  private setupRoutes(): void {
    // Route de base avec informations sur le serveur
    this.app.get('/', (_req, res) => {
      res.json({
        name: '@modelcontextprotocol/server-postgres',
        version: '1.0.0',
        status: 'running',
        schema: this.schema,
        endpoint: 'mcp'
      });
    });

    // Point d'entrée principal MCP
    this.app.post('/mcp', async (req, res) => {
      try {
        const { tool, params } = req.body;

        if (!tool) {
          return res.status(400).json({
            success: false,
            error: 'Un outil (tool) doit être spécifié'
          });
        }

        // Exécuter l'outil demandé
        const result = await this.executeTool(tool, params || {});
        res.json(result);
      } catch (error) {
        logger.error(`❌ Erreur lors de l'exécution de l'outil: ${error.message}`);
        res.status(500).json({
          success: false,
          error: `Erreur lors de l'exécution de l'outil: ${error.message}`
        });
      }
    });

    // Documentation des outils disponibles
    this.app.get('/tools', (_req, res) => {
      res.json({
        tools: [
          { name: 'list_tables', description: 'Récupère la liste des tables disponibles', params: {} },
          { name: 'describe_table', description: 'Renvoie les colonnes, types et contraintes d\'une table', params: { tableName: 'string' } },
          { name: 'get_foreign_keys', description: 'Liste toutes les relations entre les tables', params: { tableName: 'string'(optional) } },
          { name: 'run_query', description: 'Lance une requête SQL en lecture seule', params: { query: 'string', params: 'array'(optional) } },
          { name: 'suggest_prisma_model', description: 'Génère un bloc Prisma model à partir d\'une table', params: { tableName: 'string' } },
          { name: 'schema_migration_diff', description: 'Compare la base PostgreSQL actuelle à un ancien dump MySQL', params: { mysqlSchemaMap: 'object' } },
          { name: 'suggest_indexes', description: 'Propose des index sur les colonnes pertinentes', params: { tableName: 'string' } },
          { name: 'export_schema_map', description: 'Crée schema_map.json prêt à être utilisé dans le pipeline', params: {} },
          { name: 'generate_prisma_file', description: 'Crée un fichier schema.prisma partiel basé sur les tables', params: {} }
        ]
      });
    });
  }

  /**
   * Exécute un outil MCP avec ses paramètres
   * @param tool Nom de l'outil à exécuter
   * @param params Paramètres pour l'outil
   * @returns Résultat de l'exécution de l'outil
   */
  private async executeTool(tool: string, params: any): Promise<MCPResult<any>> {
    const startTime = Date.now();

    try {
      let result;

      // S'assurer que la connexion à la base de données est établie
      if (!this.dbService.isConnectedToDatabase()) {
        await this.dbService.connect();

        // Si un schéma spécifique est défini, le configurer
        if (this.schema !== 'public') {
          await this.dbService.setSchema(this.schema);
        }
      }

      // Exécution de l'outil demandé
      switch (tool) {
        case 'list_tables':
          result = await this.listTables();
          break;

        case 'describe_table':
          if (!params.tableName) {
            throw new Error('Le paramètre tableName est requis');
          }
          result = await this.describeTable(params.tableName);
          break;

        case 'get_foreign_keys':
          result = await this.getForeignKeys(params.tableName);
          break;

        case 'run_query':
          if (!params.query) {
            throw new Error('Le paramètre query est requis');
          }
          result = await this.runQuery(params.query, params.params || []);
          break;

        case 'suggest_prisma_model':
          if (!params.tableName) {
            throw new Error('Le paramètre tableName est requis');
          }
          result = await this.suggestPrismaModel(params.tableName);
          break;

        case 'schema_migration_diff':
          if (!params.mysqlSchemaMap) {
            throw new Error('Le paramètre mysqlSchemaMap est requis');
          }
          result = await this.schemaMigrationDiff(params.mysqlSchemaMap);
          break;

        case 'suggest_indexes':
          if (!params.tableName) {
            throw new Error('Le paramètre tableName est requis');
          }
          result = await this.suggestIndexes(params.tableName);
          break;

        case 'export_schema_map':
          result = await this.exportSchemaMap();
          break;

        case 'generate_prisma_file':
          result = await this.generatePrismaFile();
          break;

        default:
          throw new Error(`Outil inconnu: ${tool}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          tool,
          params
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          tool,
          params
        }
      };
    }
  }

  /**
   * Démarre le serveur HTTP
   * @returns Promise résolu quand le serveur est démarré
   */
  async start(): Promise<void> {
    try {
      // Tester la connexion à la base de données
      await this.dbService.connect();

      // Configurer le schéma si nécessaire
      if (this.schema !== 'public') {
        await this.dbService.setSchema(this.schema);
      }

      // Démarrer le serveur HTTP
      return new Promise((resolve) => {
        this.app.listen(this.port, this.host, () => {
          logger.info(`🚀 Serveur MCP PostgreSQL démarré sur http://${this.host}:${this.port}`);
          logger.info(`📊 Connecté à: ${this.maskConnectionString()}`);
          logger.info(`📝 Schéma: ${this.schema}`);
          logger.info(`📡 Endpoint MCP: http://${this.host}:${this.port}/mcp`);
          resolve();
        });
      });
    } catch (error) {
      logger.error(`❌ Échec du démarrage du serveur: ${error.message}`);
      throw error;
    }
  }

  /**
   * Arrête le serveur et ferme les connexions
   */
  async stop(): Promise<void> {
    try {
      // Fermer la connexion à la base de données
      await this.dbService.disconnect();
      logger.info('🛑 Serveur MCP PostgreSQL arrêté');
    } catch (error) {
      logger.error(`❌ Erreur lors de l'arrêt du serveur: ${error.message}`);
      throw error;
    }
  }

  /**
   * Masque les informations sensibles dans la chaîne de connexion
   * @returns Chaîne de connexion masquée (sans mot de passe)
   */
  private maskConnectionString(): string {
    const url = new URL(this.connectionString);
    return `${url.protocol}//${url.username}:****@${url.hostname}:${url.port}${url.pathname}`;
  }

  // ====== Implémentation des outils MCP ======

  /**
   * Liste les tables disponibles dans le schéma courant
   * @returns Liste des noms de tables
   */
  async listTables(): Promise<string[]> {
    try {
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      const result = await this.dbService.executeQuery(query, [this.schema]);
      const tables = result.rows.map(row => row.table_name);

      logger.debug(`📋 ${tables.length} tables trouvées dans le schéma ${this.schema}`);
      return tables;
    } catch (error) {
      logger.error(`❌ Échec de récupération des tables: ${error.message}`);
      throw new Error(`Échec de récupération des tables: ${error.message}`);
    }
  }

  /**
   * Décrit une table en détail (colonnes, types, contraintes)
   * @param tableName Nom de la table à décrire
   * @returns Informations détaillées sur la table
   */
  async describeTable(tableName: string): Promise<TableInfo> {
    try {
      // Récupérer les informations sur les colonnes
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length, 
          numeric_precision, 
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
        ORDER BY ordinal_position
      `;

      const columnsResult = await this.dbService.executeQuery(columnsQuery, [this.schema, tableName]);

      // Récupérer les clés primaires
      const pkQuery = `
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = $1
          AND tc.table_name = $2
          AND tc.constraint_type = 'PRIMARY KEY'
      `;

      const pkResult = await this.dbService.executeQuery(pkQuery, [this.schema, tableName]);
      const primaryKeys = pkResult.rows.map(row => row.column_name);

      // Récupérer les index
      const indexQuery = `
        SELECT
          i.relname as index_name,
          array_agg(a.attname) as column_names,
          ix.indisunique as is_unique,
          am.amname as index_type
        FROM
          pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_am am ON am.oid = i.relam
          LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE
          t.relname = $1
          AND n.nspname = $2
        GROUP BY
          i.relname, ix.indisunique, am.amname
      `;

      const indexResult = await this.dbService.executeQuery(indexQuery, [tableName, this.schema]);

      // Construire la structure de la table
      const tableInfo: TableInfo = {
        name: tableName,
        schema: this.schema,
        columns: {},
        primaryKey: primaryKeys,
        indexes: []
      };

      // Ajouter les colonnes
      columnsResult.rows.forEach(row => {
        const column: ColumnInfo = {
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          defaultValue: row.column_default,
          isPrimary: primaryKeys.includes(row.column_name),
          isUnique: false // Sera mis à jour avec les informations d'index
        };

        // Ajouter les informations spécifiques au type
        if (row.character_maximum_length) {
          column.maxLength = row.character_maximum_length;
        }

        if (row.numeric_precision) {
          column.precision = row.numeric_precision;
          if (row.numeric_scale) {
            column.scale = row.numeric_scale;
          }
        }

        tableInfo.columns[row.column_name] = column;
      });

      // Ajouter les index
      indexResult.rows.forEach(row => {
        const index: IndexInfo = {
          name: row.index_name,
          columns: row.column_names,
          isUnique: row.is_unique,
          type: row.index_type
        };

        tableInfo.indexes.push(index);

        // Mettre à jour la propriété isUnique des colonnes indexées
        if (row.is_unique) {
          row.column_names.forEach(colName => {
            if (tableInfo.columns[colName]) {
              tableInfo.columns[colName].isUnique = true;
            }
          });
        }
      });

      logger.debug(`📝 Table ${tableName} décrite: ${Object.keys(tableInfo.columns).length} colonnes`);
      return tableInfo;
    } catch (error) {
      logger.error(`❌ Échec de la description de la table ${tableName}: ${error.message}`);
      throw new Error(`Échec de la description de la table ${tableName}: ${error.message}`);
    }
  }

  /**
   * Récupère les clés étrangères
   * @param tableName Nom de la table (optionnel)
   * @returns Liste des clés étrangères
   */
  async getForeignKeys(tableName?: string): Promise<ForeignKeyInfo[]> {
    try {
      let query = `
        SELECT
          tc.table_name AS source_table,
          kcu.column_name AS source_column,
          ccu.table_name AS target_table,
          ccu.column_name AS target_column,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
      `;

      const params = [this.schema];

      // Si une table spécifique est demandée, filtrer les résultats
      if (tableName) {
        query += " AND tc.table_name = $2";
        params.push(tableName);
      }

      query += " ORDER BY tc.table_name, kcu.column_name";

      const result = await this.dbService.executeQuery(query, params);

      // Créer les objets ForeignKeyInfo
      const foreignKeys: ForeignKeyInfo[] = result.rows.map(row => ({
        name: `fk_${row.source_table}_${row.source_column}`,
        sourceTable: row.source_table,
        sourceColumns: [row.source_column],
        targetTable: row.target_table,
        targetColumns: [row.target_column],
        onDelete: row.delete_rule,
        onUpdate: row.update_rule
      }));

      logger.debug(`🔗 ${foreignKeys.length} clés étrangères trouvées`);
      return foreignKeys;
    } catch (error) {
      logger.error(`❌ Échec de récupération des clés étrangères: ${error.message}`);
      throw new Error(`Échec de récupération des clés étrangères: ${error.message}`);
    }
  }

  /**
   * Exécute une requête SQL en lecture seule
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Résultats de la requête
   */
  async runQuery(query: string, params: any[] = []): Promise<any[]> {
    // Vérifier que la requête est en lecture seule
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select') &&
      !normalizedQuery.startsWith('explain') &&
      !normalizedQuery.startsWith('show')) {
      throw new Error('Seules les requêtes SELECT, EXPLAIN ou SHOW sont autorisées');
    }

    try {
      const result = await this.dbService.executeQuery(query, params);
      logger.debug(`🔍 Requête exécutée: ${result.rowCount} lignes retournées`);
      return result.rows;
    } catch (error) {
      logger.error(`❌ Échec de l'exécution de la requête: ${error.message}`);
      throw new Error(`Échec de l'exécution de la requête: ${error.message}`);
    }
  }

  /**
   * Suggère un modèle Prisma pour une table
   * @param tableName Nom de la table
   * @returns Modèle Prisma suggéré
   */
  async suggestPrismaModel(tableName: string): Promise<PrismaModel> {
    try {
      // Récupérer les informations sur la table
      const tableInfo = await this.describeTable(tableName);

      // Récupérer les clés étrangères
      const allForeignKeys = await this.getForeignKeys();

      // Filtrer les clés étrangères pour cette table
      const relatedForeignKeys = allForeignKeys.filter(fk =>
        fk.sourceTable === tableName || fk.targetTable === tableName
      );

      // Générer le modèle Prisma
      const prismaModel = this.generatePrismaModel(tableInfo, relatedForeignKeys);

      logger.debug(`✨ Modèle Prisma généré pour la table ${tableName}`);
      return prismaModel;
    } catch (error) {
      logger.error(`❌ Échec de génération du modèle Prisma pour ${tableName}: ${error.message}`);
      throw new Error(`Échec de génération du modèle Prisma pour ${tableName}: ${error.message}`);
    }
  }

  /**
   * Compare le schéma actuel à un schéma MySQL
   * @param mysqlSchemaMap Structure du schéma MySQL
   * @returns Différences entre les schémas
   */
  async schemaMigrationDiff(mysqlSchemaMap: SchemaMap): Promise<SchemaDiff> {
    try {
      // Exporter le schéma PostgreSQL actuel
      const postgresSchemaMap = await this.exportSchemaMap();

      // Comparer les deux schémas
      const diff = this.compareSchemas(mysqlSchemaMap, postgresSchemaMap);

      logger.info(`🔄 Comparaison des schémas terminée: ${diff.changes.length} changements trouvés`);
      return diff;
    } catch (error) {
      logger.error(`❌ Échec de comparaison des schémas: ${error.message}`);
      throw new Error(`Échec de comparaison des schémas: ${error.message}`);
    }
  }

  /**
   * Suggère des index pour une table
   * @param tableName Nom de la table
   * @returns Index suggérés
   */
  async suggestIndexes(tableName: string): Promise<IndexInfo[]> {
    try {
      // Récupérer les informations sur la table
      const tableInfo = await this.describeTable(tableName);

      // Récupérer les clés étrangères
      const allForeignKeys = await this.getForeignKeys();
      const tableForeignKeys = allForeignKeys.filter(fk => fk.sourceTable === tableName);

      // Suggérer des index
      const suggestedIndexes = this.suggestTableIndexes(tableInfo, tableForeignKeys);

      logger.debug(`💡 ${suggestedIndexes.length} index suggérés pour la table ${tableName}`);
      return suggestedIndexes;
    } catch (error) {
      logger.error(`❌ Échec de suggestion d'index pour ${tableName}: ${error.message}`);
      throw new Error(`Échec de suggestion d'index pour ${tableName}: ${error.message}`);
    }
  }

  /**
   * Exporte la carte du schéma PostgreSQL
   * @returns Carte du schéma
   */
  async exportSchemaMap(): Promise<SchemaMap> {
    try {
      // Récupérer la liste des tables
      const tables = await this.listTables();

      // Récupérer les informations sur chaque table
      const tablesInfo: Record<string, TableInfo> = {};
      for (const tableName of tables) {
        tablesInfo[tableName] = await this.describeTable(tableName);
      }

      // Récupérer les clés étrangères
      const foreignKeys = await this.getForeignKeys();

      // Créer la carte du schéma
      const schemaMap: SchemaMap = {
        name: `PostgreSQL Schema (${this.schema})`,
        timestamp: new Date().toISOString(),
        tables: tablesInfo,
        foreignKeys: foreignKeys
      };

      logger.info(`📊 Carte du schéma générée avec ${tables.length} tables`);
      return schemaMap;
    } catch (error) {
      logger.error(`❌ Échec de génération de la carte du schéma: ${error.message}`);
      throw new Error(`Échec de génération de la carte du schéma: ${error.message}`);
    }
  }

  /**
   * Génère un fichier Prisma basé sur le schéma PostgreSQL
   * @returns Contenu du fichier schema.prisma
   */
  async generatePrismaFile(): Promise<string> {
    try {
      // Exporter le schéma PostgreSQL actuel
      const schemaMap = await this.exportSchemaMap();

      // Récupérer les clés étrangères
      const foreignKeys = await this.getForeignKeys();

      // Générer le fichier schema.prisma
      let prismaSchema = `// Ce fichier a été généré automatiquement par @modelcontextprotocol/server-postgres\n`;
      prismaSchema += `// Date de génération: ${new Date().toISOString()}\n\n`;

      prismaSchema += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;
      prismaSchema += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;

      // Générer un modèle Prisma pour chaque table
      for (const tableName of Object.keys(schemaMap.tables)) {
        const tableInfo = schemaMap.tables[tableName];

        // Filtrer les clés étrangères pour cette table
        const relatedForeignKeys = foreignKeys.filter(fk =>
          fk.sourceTable === tableName || fk.targetTable === tableName
        );

        // Générer le modèle Prisma
        const model = this.generatePrismaModel(tableInfo, relatedForeignKeys);

        // Ajouter le modèle au fichier
        prismaSchema += `${model.schema}\n\n`;
      }

      logger.info("📄 Fichier schema.prisma généré");
      return prismaSchema;
    } catch (error) {
      logger.error(`❌ Échec de génération du fichier schema.prisma: ${error.message}`);
      throw new Error(`Échec de génération du fichier schema.prisma: ${error.message}`);
    }
  }

  // ====== Méthodes utilitaires ======

  /**
   * Génère un modèle Prisma à partir d'une table
   * @param tableInfo Informations sur la table
   * @param foreignKeys Clés étrangères liées à la table
   * @returns Modèle Prisma
   */
  private generatePrismaModel(tableInfo: TableInfo, foreignKeys: ForeignKeyInfo[]): PrismaModel {
    // Convertir le nom de la table en PascalCase pour Prisma
    const modelName = tableInfo.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    // Créer les champs Prisma
    const fields: any[] = [];
    const schema: string[] = [`model ${modelName} {`];

    // Fonction pour convertir un type PostgreSQL en type Prisma
    const toPrismaType = (pgType: string): string => {
      const typeMap: Record<string, string> = {
        integer: 'Int',
        bigint: 'BigInt',
        smallint: 'Int',
        decimal: 'Decimal',
        numeric: 'Decimal',
        real: 'Float',
        'double precision': 'Float',
        'character varying': 'String',
        character: 'String',
        text: 'String',
        boolean: 'Boolean',
        date: 'DateTime',
        time: 'DateTime',
        timestamp: 'DateTime',
        'timestamp with time zone': 'DateTime',
        'timestamp without time zone': 'DateTime',
        uuid: 'String',
        json: 'Json',
        jsonb: 'Json',
        bytea: 'Bytes',
        citext: 'String'
      };

      return typeMap[pgType.toLowerCase()] || 'String';
    };

    // Ajouter les colonnes au modèle
    for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
      const prismaType = toPrismaType(columnInfo.type);
      let line = `  ${columnName} ${prismaType}`;

      // Ajouter les attributs
      const attributes: string[] = [];

      if (columnInfo.isPrimary) {
        attributes.push('@id');
      }

      if (columnInfo.isUnique && !columnInfo.isPrimary) {
        attributes.push('@unique');
      }

      if (columnInfo.defaultValue) {
        // Traiter les valeurs par défaut communes
        if (columnInfo.defaultValue.includes('nextval(')) {
          attributes.push('@default(autoincrement())');
        } else if (columnInfo.defaultValue.includes('now()')) {
          attributes.push('@default(now())');
        } else if (columnInfo.defaultValue.includes('gen_random_uuid()') ||
          columnInfo.defaultValue.includes('uuid_generate_v4()')) {
          attributes.push('@default(uuid())');
        } else if (columnInfo.defaultValue === 'true' || columnInfo.defaultValue === 'false') {
          attributes.push(`@default(${columnInfo.defaultValue})`);
        } else if (!Number.isNaN(Number(columnInfo.defaultValue))) {
          attributes.push(`@default(${columnInfo.defaultValue})`);
        } else {
          // Enlever les guillemets pour les chaînes
          const defaultValue = columnInfo.defaultValue.replace(/^'(.*)'$/, '$1');
          attributes.push(`@default("${defaultValue}")`);
        }
      }

      // Ajouter les attributs au champ
      if (attributes.length > 0) {
        line += ` ${attributes.join(' ')}`;
      }

      // Ajouter le point d'interrogation pour les champs nullable
      if (columnInfo.nullable) {
        line += '?';
      }

      schema.push(line);

      // Ajouter le champ à la liste des champs
      fields.push({
        name: columnName,
        type: prismaType,
        required: !columnInfo.nullable,
        unique: columnInfo.isUnique,
        id: columnInfo.isPrimary,
        default: columnInfo.defaultValue
      });
    }

    // Ajouter les relations
    const sourceRelations = foreignKeys.filter(fk => fk.sourceTable === tableInfo.name);
    const targetRelations = foreignKeys.filter(fk => fk.targetTable === tableInfo.name);

    // Ajouter les relations où cette table est la source (référence une autre table)
    for (const relation of sourceRelations) {
      const targetModelName = relation.targetTable
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

      const relationName = relation.targetTable;

      // Relation dans le modèle Prisma
      schema.push(`  ${relationName} ${targetModelName} @relation(fields: [${relation.sourceColumns.join(', ')}], references: [${relation.targetColumns.join(', ')}])`);
    }

    // Ajouter les relations inverses (où d'autres tables référencent cette table)
    for (const relation of targetRelations) {
      const sourceModelName = relation.sourceTable
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

      // Par défaut, le nom de la relation est pluriel
      const relationName = `${relation.sourceTable}s`;

      schema.push(`  ${relationName} ${sourceModelName}[]`);
    }

    // Ajouter le mapping vers le nom de la table réelle
    schema.push(`  @@map("${tableInfo.name}")`);
    schema.push("}");

    return {
      name: modelName,
      tableName: tableInfo.name,
      fields,
      schema: schema.join('\n')
    };
  }

  /**
   * Compare deux schémas pour générer un rapport de différences
   * @param sourceSchema Schéma source (ex: MySQL)
   * @param targetSchema Schéma cible (ex: PostgreSQL)
   * @returns Différences entre les schémas
   */
  private compareSchemas(sourceSchema: SchemaMap, targetSchema: SchemaMap): SchemaDiff {
    const changes: any[] = [];

    // Statistiques
    const statistics = {
      total: 0,
      tables: {
        added: 0,
        removed: 0,
        modified: 0
      },
      columns: {
        added: 0,
        removed: 0,
        typeChanged: 0,
        constraintChanged: 0
      },
      indexes: {
        added: 0,
        removed: 0
      },
      foreignKeys: {
        added: 0,
        removed: 0
      }
    };

    // Tables existantes dans la source mais pas dans la cible
    const sourceTables = Object.keys(sourceSchema.tables);
    const targetTables = Object.keys(targetSchema.tables);

    for (const tableName of sourceTables) {
      if (!targetTables.includes(tableName)) {
        changes.push({
          type: 'table_removed',
          tableName,
          impact: 'high',
          description: `La table ${tableName} n'existe pas dans le schéma cible`
        });
        statistics.tables.removed++;
        statistics.total++;
      }
    }

    // Tables existantes dans la cible mais pas dans la source
    for (const tableName of targetTables) {
      if (!sourceTables.includes(tableName)) {
        changes.push({
          type: 'table_added',
          tableName,
          impact: 'medium',
          description: `La table ${tableName} existe dans le schéma cible mais pas dans la source`
        });
        statistics.tables.added++;
        statistics.total++;
      }
    }

    // Pour les tables existantes dans les deux schémas, comparer les colonnes et contraintes
    for (const tableName of sourceTables) {
      if (targetTables.includes(tableName)) {
        const sourceTable = sourceSchema.tables[tableName];
        const targetTable = targetSchema.tables[tableName];

        let tableModified = false;

        // Colonnes existantes dans la source mais pas dans la cible
        const sourceColumns = Object.keys(sourceTable.columns);
        const targetColumns = Object.keys(targetTable.columns);

        for (const columnName of sourceColumns) {
          if (!targetColumns.includes(columnName)) {
            changes.push({
              type: 'column_removed',
              tableName,
              columnName,
              impact: 'high',
              description: `La colonne ${tableName}.${columnName} n'existe pas dans le schéma cible`
            });
            statistics.columns.removed++;
            statistics.total++;
            tableModified = true;
          }
        }

        // Colonnes existantes dans la cible mais pas dans la source
        for (const columnName of targetColumns) {
          if (!sourceColumns.includes(columnName)) {
            changes.push({
              type: 'column_added',
              tableName,
              columnName,
              impact: 'medium',
              description: `La colonne ${tableName}.${columnName} existe dans le schéma cible mais pas dans la source`
            });
            statistics.columns.added++;
            statistics.total++;
            tableModified = true;
          }
        }

        // Pour les colonnes existantes dans les deux schémas, comparer les types et contraintes
        for (const columnName of sourceColumns) {
          if (targetColumns.includes(columnName)) {
            const sourceColumn = sourceTable.columns[columnName];
            const targetColumn = targetTable.columns[columnName];

            // Vérifier les différences de type
            if (sourceColumn.type !== targetColumn.type) {
              changes.push({
                type: 'column_type_changed',
                tableName,
                columnName,
                oldValue: sourceColumn.type,
                newValue: targetColumn.type,
                impact: 'high',
                description: `Le type de la colonne ${tableName}.${columnName} a changé: ${sourceColumn.type} -> ${targetColumn.type}`
              });
              statistics.columns.typeChanged++;
              statistics.total++;
              tableModified = true;
            }

            // Vérifier les différences de nullabilité
            if (sourceColumn.nullable !== targetColumn.nullable) {
              changes.push({
                type: 'column_constraint_changed',
                tableName,
                columnName,
                oldValue: sourceColumn.nullable ? 'NULL' : 'NOT NULL',
                newValue: targetColumn.nullable ? 'NULL' : 'NOT NULL',
                impact: 'medium',
                description: `La contrainte de nullabilité de ${tableName}.${columnName} a changé: ${sourceColumn.nullable ? 'NULL' : 'NOT NULL'} -> ${targetColumn.nullable ? 'NULL' : 'NOT NULL'}`
              });
              statistics.columns.constraintChanged++;
              statistics.total++;
              tableModified = true;
            }

            // Vérifier les différences de clé primaire
            if (sourceColumn.isPrimary !== targetColumn.isPrimary) {
              changes.push({
                type: 'column_constraint_changed',
                tableName,
                columnName,
                oldValue: sourceColumn.isPrimary ? 'PRIMARY KEY' : 'NOT PRIMARY KEY',
                newValue: targetColumn.isPrimary ? 'PRIMARY KEY' : 'NOT PRIMARY KEY',
                impact: 'high',
                description: `La contrainte de clé primaire de ${tableName}.${columnName} a changé: ${sourceColumn.isPrimary ? 'PK' : 'non-PK'} -> ${targetColumn.isPrimary ? 'PK' : 'non-PK'}`
              });
              statistics.columns.constraintChanged++;
              statistics.total++;
              tableModified = true;
            }

            // Vérifier les différences d'unicité
            if (sourceColumn.isUnique !== targetColumn.isUnique) {
              changes.push({
                type: 'column_constraint_changed',
                tableName,
                columnName,
                oldValue: sourceColumn.isUnique ? 'UNIQUE' : 'NOT UNIQUE',
                newValue: targetColumn.isUnique ? 'UNIQUE' : 'NOT UNIQUE',
                impact: 'medium',
                description: `La contrainte d'unicité de ${tableName}.${columnName} a changé: ${sourceColumn.isUnique ? 'UNIQUE' : 'non-UNIQUE'} -> ${targetColumn.isUnique ? 'UNIQUE' : 'non-UNIQUE'}`
              });
              statistics.columns.constraintChanged++;
              statistics.total++;
              tableModified = true;
            }
          }
        }

        if (tableModified) {
          statistics.tables.modified++;
        }
      }
    }

    // Comparer les clés étrangères
    const sourceFKs = sourceSchema.foreignKeys || [];
    const targetFKs = targetSchema.foreignKeys || [];

    // Fonction pour créer une clé de comparaison pour les FK
    const createFKKey = (fk: ForeignKeyInfo) =>
      `${fk.sourceTable}.${fk.sourceColumns.join(',')}=>${fk.targetTable}.${fk.targetColumns.join(',')}`;

    const sourceFKMap = new Map<string, ForeignKeyInfo>();
    for (const fk of sourceFKs) {
      sourceFKMap.set(createFKKey(fk), fk);
    }

    const targetFKMap = new Map<string, ForeignKeyInfo>();
    for (const fk of targetFKs) {
      targetFKMap.set(createFKKey(fk), fk);
    }

    // FK existantes dans la source mais pas dans la cible
    for (const [key, fk] of sourceFKMap.entries()) {
      if (!targetFKMap.has(key)) {
        changes.push({
          type: 'foreign_key_removed',
          tableName: fk.sourceTable,
          foreignKeyName: fk.name,
          impact: 'medium',
          description: `La clé étrangère ${fk.name} (${fk.sourceTable}.${fk.sourceColumns.join(',')} -> ${fk.targetTable}.${fk.targetColumns.join(',')}) n'existe pas dans le schéma cible`
        });
        statistics.foreignKeys.removed++;
        statistics.total++;
      }
    }

    // FK existantes dans la cible mais pas dans la source
    for (const [key, fk] of targetFKMap.entries()) {
      if (!sourceFKMap.has(key)) {
        changes.push({
          type: 'foreign_key_added',
          tableName: fk.sourceTable,
          foreignKeyName: fk.name,
          impact: 'low',
          description: `La clé étrangère ${fk.name} (${fk.sourceTable}.${fk.sourceColumns.join(',')} -> ${fk.targetTable}.${fk.targetColumns.join(',')}) existe dans le schéma cible mais pas dans la source`
        });
        statistics.foreignKeys.added++;
        statistics.total++;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      sourceName: sourceSchema.name,
      targetName: targetSchema.name,
      changes,
      statistics
    };
  }

  /**
   * Suggère des index pour une table
   * @param tableInfo Informations sur la table
   * @param foreignKeys Clés étrangères de la table
   * @returns Index suggérés
   */
  private suggestTableIndexes(tableInfo: TableInfo, foreignKeys: ForeignKeyInfo[]): IndexInfo[] {
    const suggestedIndexes: IndexInfo[] = [];
    const existingIndexColumns = new Set<string>();

    // Collecter les colonnes déjà indexées
    for (const index of tableInfo.indexes) {
      for (const column of index.columns) {
        existingIndexColumns.add(column);
      }
    }

    // Suggérer des index pour les clés étrangères non indexées
    for (const fk of foreignKeys) {
      for (const column of fk.sourceColumns) {
        if (!existingIndexColumns.has(column)) {
          suggestedIndexes.push({
            name: `idx_${tableInfo.name}_${column}`,
            columns: [column],
            isUnique: false,
            type: 'btree'
          });
          existingIndexColumns.add(column);
        }
      }
    }

    // Suggérer des index pour les colonnes fréquemment utilisées dans les clauses WHERE
    const commonWhereColumns = ['status', 'type', 'category', 'active', 'enabled', 'visible', 'deleted', 'created_at', 'updated_at'];

    for (const column in tableInfo.columns) {
      if (commonWhereColumns.some(c => column.toLowerCase().includes(c)) &&
        !existingIndexColumns.has(column) &&
        // Éviter d'indexer les colonnes de texte long
        !(tableInfo.columns[column].type.toLowerCase() === 'text')) {
        suggestedIndexes.push({
          name: `idx_${tableInfo.name}_${column}`,
          columns: [column],
          isUnique: false,
          type: 'btree'
        });
      }
    }

    return suggestedIndexes;
  }
}

// Fonction principale pour exécuter le serveur MCP PostgreSQL en ligne de commande
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <connectionString> [options]')
    .example('$0 postgresql://user:pass@localhost:5432/mydb', 'Démarrer le serveur MCP avec la chaîne de connexion spécifiée')
    .example('$0 postgresql://user:pass@localhost:5432/mydb -p 4000', 'Démarrer le serveur sur le port 4000')
    .positional('connectionString', {
      describe: 'Chaîne de connexion PostgreSQL',
      type: 'string',
      demandOption: true
    })
    .option('p', {
      alias: 'port',
      describe: 'Port du serveur MCP',
      type: 'number',
      default: 3050
    })
    .option('h', {
      alias: 'host',
      describe: 'Hôte du serveur MCP',
      type: 'string',
      default: 'localhost'
    })
    .option('v', {
      alias: 'verbose',
      describe: 'Activer le mode verbeux',
      type: 'boolean',
      default: false
    })
    .option('o', {
      alias: 'output',
      describe: 'Chemin pour enregistrer le schema_map.json généré',
      type: 'string'
    })
    .option('generate-prisma', {
      describe: 'Générer un fichier schema.prisma et quitter',
      type: 'string',
      nargs: 1,
      conflicts: 'output'
    })
    .option('export-schema', {
      describe: 'Exporter la carte du schéma (schema_map.json) et quitter',
      type: 'string',
      nargs: 1,
      conflicts: ['output', 'generate-prisma']
    })
    .help()
    .alias('help', '?')
    .version()
    .parse();

  // Mode exécution unique si un des paramètres de génération est spécifié
  if (argv.output || argv['generate-prisma'] || argv['export-schema']) {
    try {
      const server = new PostgresMCPServer(argv.connectionString as string, {
        port: argv.port,
        host: argv.host,
        verbose: argv.verbose
      });

      // Se connecter à la base de données
      await server.dbService.connect();

      // Générer et enregistrer le schema.prisma si demandé
      if (argv['generate-prisma']) {
        const prismaSchema = await server.generatePrismaFile();
        const outputPath = typeof argv['generate-prisma'] === 'string'
          ? argv['generate-prisma']
          : 'schema.prisma';

        fs.writeFileSync(outputPath, prismaSchema);
        console.log(`✅ Fichier Prisma généré et enregistré dans: ${outputPath}`);
      }

      // Exporter le schéma si demandé
      if (argv['export-schema'] || argv.output) {
        const schemaMap = await server.exportSchemaMap();
        const outputPath = argv['export-schema'] || argv.output || 'schema_map.json';

        fs.writeFileSync(outputPath, JSON.stringify(schemaMap, null, 2));
        console.log(`✅ Carte du schéma exportée et enregistrée dans: ${outputPath}`);
      }

      // Fermer la connexion
      await server.dbService.disconnect();

      return;
    } catch (error) {
      console.error(`❌ Erreur: ${error.message}`);
      process.exit(1);
    }
  }

  // Mode serveur normal
  try {
    const server = new PostgresMCPServer(argv.connectionString as string, {
      port: argv.port,
      host: argv.host,
      verbose: argv.verbose
    });

    // Démarrer le serveur
    await server.start();

    // Gérer la fermeture propre en cas de signal d'arrêt
    const shutdown = async () => {
      console.log('\n🛑 Arrêt du serveur MCP PostgreSQL...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le programme principal si ce fichier est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Erreur non gérée: ${error}`);
    process.exit(1);
  });
}

// Exporter les classes et fonctions importantes
export { PostgresMCPServer, main };
