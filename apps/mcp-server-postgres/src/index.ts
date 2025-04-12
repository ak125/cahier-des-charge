#!/usr/bin/env node
/**
 * @modelcontextprotocol/server-postgres
 * 
 * Serveur MCP pour PostgreSQL - Exploration, analyse et manipulation de bases PostgreSQL
 * Ce serveur implémente le protocole Model Context Protocol pour interagir avec des bases PostgreSQL
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { pgStructure } from 'pg-structure';

// Types et interfaces
import { 
  SchemaMap, 
  TableInfo, 
  ColumnInfo, 
  ForeignKeyInfo,
  IndexInfo,
  SchemaDiff,
  PrismaModel
} from './types';

// Configuration et services
import { parseConnectionString } from './utils/connection';
import { createSchemaMap } from './services/schema-mapper';
import { generatePrismaModel } from './services/prisma-generator';
import { compareSchemas } from './services/schema-comparator';
import { suggestIndexes } from './services/index-suggester';
import { initializeRoutes } from './routes';

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

// Classe principale du serveur MCP PostgreSQL
export class PostgresMCPServer {
  private app: express.Application;
  private pool: Pool;
  private port: number;
  private connectionString: string;
  private schema: string;
  
  constructor(connectionString: string, port: number = 3050, schema: string = 'public') {
    this.connectionString = connectionString;
    this.port = port;
    this.schema = schema;
    
    // Initialiser la connexion PostgreSQL
    this.pool = new Pool({
      connectionString: this.connectionString
    });
    
    // Initialiser l'application Express
    this.app = express();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    
    // Initialiser les routes
    initializeRoutes(this.app, this);
    
    logger.info(`Serveur MCP PostgreSQL initialisé (${this.schema})`);
  }
  
  // Démarrer le serveur HTTP
  public async start(): Promise<void> {
    try {
      // Tester la connexion à la base de données
      await this.testConnection();
      
      // Démarrer le serveur HTTP
      this.app.listen(this.port, () => {
        logger.info(`🚀 Serveur MCP PostgreSQL démarré sur le port ${this.port}`);
        logger.info(`📊 Connecté à: ${this.maskConnectionString(this.connectionString)}`);
        logger.info(`📝 Schéma: ${this.schema}`);
        logger.info(`📡 Endpoint MCP: http://localhost:${this.port}/mcp`);
      });
    } catch (error) {
      logger.error(`❌ Échec du démarrage du serveur: ${error}`);
      throw error;
    }
  }
  
  // Tester la connexion à la base de données
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      logger.info(`✅ Connexion à PostgreSQL établie: ${result.rows[0].now}`);
      return true;
    } catch (error) {
      logger.error(`❌ Échec de connexion à PostgreSQL: ${error}`);
      throw error;
    }
  }
  
  // Récupérer la liste des tables
  public async listTables(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      const result = await client.query(query, [this.schema]);
      const tables = result.rows.map(row => row.table_name);
      
      logger.debug(`📋 ${tables.length} tables trouvées dans le schéma ${this.schema}`);
      return tables;
    } catch (error) {
      logger.error(`❌ Échec de récupération des tables: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Décrire une table (colonnes, types, etc.)
  public async describeTable(tableName: string): Promise<TableInfo> {
    const client = await this.pool.connect();
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
      
      const columnsResult = await client.query(columnsQuery, [this.schema, tableName]);
      
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
      
      const pkResult = await client.query(pkQuery, [this.schema, tableName]);
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
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE
          t.relname = $1
          AND n.nspname = $2
        GROUP BY
          i.relname, ix.indisunique, am.amname
      `;
      
      const indexResult = await client.query(indexQuery, [tableName, this.schema]);
      
      // Construire la structure de la table
      const tableInfo: TableInfo = {
        name: tableName,
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
          column.length = row.character_maximum_length;
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
          row.column_names.forEach((colName: string) => {
            if (tableInfo.columns[colName]) {
              tableInfo.columns[colName].isUnique = true;
            }
          });
        }
      });
      
      logger.debug(`📝 Table ${tableName} décrite: ${Object.keys(tableInfo.columns).length} colonnes`);
      return tableInfo;
    } catch (error) {
      logger.error(`❌ Échec de la description de la table ${tableName}: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Récupérer les clés étrangères
  public async getForeignKeys(): Promise<ForeignKeyInfo[]> {
    const client = await this.pool.connect();
    try {
      const query = `
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
        ORDER BY tc.table_name, kcu.column_name
      `;
      
      const result = await client.query(query, [this.schema]);
      
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
      logger.error(`❌ Échec de récupération des clés étrangères: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Exécuter une requête SQL en lecture seule
  public async runQuery(query: string, params: any[] = []): Promise<any[]> {
    // Vérifier que la requête est en lecture seule
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select') && 
        !normalizedQuery.startsWith('explain') && 
        !normalizedQuery.startsWith('show')) {
      throw new Error('Seules les requêtes SELECT, EXPLAIN ou SHOW sont autorisées');
    }
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      logger.debug(`🔍 Requête exécutée: ${result.rowCount} lignes retournées`);
      return result.rows;
    } catch (error) {
      logger.error(`❌ Échec de l'exécution de la requête: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Générer un schéma Prisma pour une table
  public async suggestPrismaModel(tableName: string): Promise<PrismaModel> {
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
      const prismaModel = generatePrismaModel(tableInfo, relatedForeignKeys);
      
      logger.debug(`✨ Modèle Prisma généré pour la table ${tableName}`);
      return prismaModel;
    } catch (error) {
      logger.error(`❌ Échec de génération du modèle Prisma pour ${tableName}: ${error}`);
      throw error;
    }
  }
  
  // Générer la carte complète du schéma PostgreSQL
  public async exportSchemaMap(): Promise<SchemaMap> {
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
      const schemaMap = createSchemaMap(tablesInfo, foreignKeys);
      
      logger.info(`📊 Carte du schéma générée avec ${tables.length} tables`);
      return schemaMap;
    } catch (error) {
      logger.error(`❌ Échec de génération de la carte du schéma: ${error}`);
      throw error;
    }
  }
  
  // Comparer le schéma actuel à un schéma MySQL (pour la migration)
  public async schemaMigrationDiff(mysqlSchemaMap: SchemaMap): Promise<SchemaDiff> {
    try {
      // Exporter le schéma PostgreSQL actuel
      const postgresSchemaMap = await this.exportSchemaMap();
      
      // Comparer les deux schémas
      const diff = compareSchemas(mysqlSchemaMap, postgresSchemaMap);
      
      logger.info(`🔄 Comparaison des schémas terminée: ${diff.changes.length} changements trouvés`);
      return diff;
    } catch (error) {
      logger.error(`❌ Échec de comparaison des schémas: ${error}`);
      throw error;
    }
  }
  
  // Suggérer des index pour améliorer les performances
  public async suggestIndexes(tableName: string): Promise<IndexInfo[]> {
    try {
      // Récupérer les informations sur la table
      const tableInfo = await this.describeTable(tableName);
      
      // Récupérer les clés étrangères
      const allForeignKeys = await this.getForeignKeys();
      const tableForeignKeys = allForeignKeys.filter(fk => fk.sourceTable === tableName);
      
      // Suggérer des index
      const suggestedIndexes = suggestIndexes(tableInfo, tableForeignKeys);
      
      logger.debug(`💡 ${suggestedIndexes.length} index suggérés pour la table ${tableName}`);
      return suggestedIndexes;
    } catch (error) {
      logger.error(`❌ Échec de suggestion d'index pour ${tableName}: ${error}`);
      throw error;
    }
  }
  
  // Générer le fichier schema.prisma complet
  public async generatePrismaFile(): Promise<string> {
    try {
      // Exporter le schéma PostgreSQL actuel
      const schemaMap = await this.exportSchemaMap();
      
      // Récupérer les clés étrangères
      const foreignKeys = await this.getForeignKeys();
      
      // Générer le fichier schema.prisma
      const prismaSchema = await generatePrismaFile(schemaMap, foreignKeys);
      
      logger.info(`📄 Fichier schema.prisma généré`);
      return prismaSchema;
    } catch (error) {
      logger.error(`❌ Échec de génération du fichier schema.prisma: ${error}`);
      throw error;
    }
  }
  
  // Masquer les informations sensibles dans la chaîne de connexion
  private maskConnectionString(connectionString: string): string {
    try {
      const connInfo = parseConnectionString(connectionString);
      return `postgresql://${connInfo.user}:****@${connInfo.host}:${connInfo.port}/${connInfo.database}`;
    } catch (error) {
      return 'postgresql://****';
    }
  }
}

// Fonction pour générer le fichier schema.prisma complet
async function generatePrismaFile(schemaMap: SchemaMap, foreignKeys: ForeignKeyInfo[]): Promise<string> {
  // En-tête du fichier Prisma
  let prismaSchema = `// Ce fichier a été généré automatiquement par @modelcontextprotocol/server-postgres
// Date de génération: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  // Générer un modèle Prisma pour chaque table
  for (const [tableName, tableInfo] of Object.entries(schemaMap.tables)) {
    // Filtrer les clés étrangères pour cette table
    const relatedForeignKeys = foreignKeys.filter(fk => 
      fk.sourceTable === tableName || fk.targetTable === tableName
    );
    
    // Générer le modèle Prisma
    const model = generatePrismaModel({ 
      name: tableName, 
      columns: tableInfo.columns, 
      primaryKey: tableInfo.primaryKey,
      indexes: tableInfo.indexes || []
    }, relatedForeignKeys);
    
    // Ajouter le modèle au fichier
    prismaSchema += model.schema + '\n\n';
  }
  
  return prismaSchema;
}

// Exporter les fonctions utiles
export default PostgresMCPServer;