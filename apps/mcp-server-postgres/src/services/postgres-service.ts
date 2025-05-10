/**
 * Service principal pour gérer les connexions et opérations PostgreSQL
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ColumnInfo, ForeignKeyInfo, IndexInfo, SchemaMap, TableInfo } from '../types';
import {
  PostgresConnectionOptions,
  parseConnectionString,
} from ..@cahier-des-charge/coordination/src/utils/connection-string-parser';

export class PostgresService {
  private pool: Pool | null = null;
  private connectionOptions: PostgresConnectionOptions;
  private schema: string;

  /**
   * Constructeur
   * @param connectionString Chaîne de connexion PostgreSQL ou options de connexion
   */
  constructor(connectionString: string | PostgresConnectionOptions) {
    if (typeof connectionString === 'string') {
      this.connectionOptions = parseConnectionString(connectionString);
    } else {
      this.connectionOptions = connectionString;
    }

    this.schema = this.connectionOptions.schema || 'public';
  }

  /**
   * Initialiser la connexion à PostgreSQL
   */
  async initialize(): Promise<void> {
    try {
      const { host, port, database, user, password, ssl } = this.connectionOptions;

      this.pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
        max: 20, // Nombre maximum de clients dans le pool
        idleTimeoutMillis: 30000, // Délai d'inactivité avant fermeture d'un client
        connectionTimeoutMillis: 2000, // Délai avant échec de la connexion
      });

      // Test de connexion
      const client = await this.pool.connect();
      client.release();

      console.log(`Connexion réussie à PostgreSQL: ${host}:${port}/${database}`);
    } catch (error) {
      throw new Error(`Échec de la connexion à PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Fermer la connexion à PostgreSQL
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Connexion PostgreSQL fermée');
    }
  }

  /**
   * Exécuter une requête PostgreSQL
   * @param query Requête SQL
   * @param params Paramètres de la requête
   * @returns Résultat de la requête
   */
  async query<T = any>(query: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("La connexion PostgreSQL n'est pas initialisée");
    }

    try {
      return await this.pool.query<T>(query, params);
    } catch (error) {
      throw new Error(`Erreur d'exécution de la requête PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Obtenir un client de connexion du pool
   * @returns Client PostgreSQL
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error("La connexion PostgreSQL n'est pas initialisée");
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      throw new Error(`Échec d'obtention d'un client PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Obtenir la liste des tables du schéma actuel
   * @returns Liste des tables
   */
  async getTables(): Promise<string[]> {
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const result = await this.query(query, [this.schema]);
    return result.rows.map((row) => row.table_name);
  }

  /**
   * Obtenir les informations détaillées d'une table
   * @param tableName Nom de la table
   * @returns Informations détaillées de la table
   */
  async getTableInfo(tableName: string): Promise<TableInfo> {
    // Vérifier si la table existe
    const tableExists = await this.tableExists(tableName);
    if (!tableExists) {
      throw new Error(`La table '${tableName}' n'existe pas dans le schéma '${this.schema}'`);
    }

    // Obtenir les informations sur les colonnes
    const columns = await this.getTableColumns(tableName);

    // Obtenir les informations sur les index
    const indexes = await this.getTableIndexes(tableName);

    return {
      name: tableName,
      columns,
      indexes,
      schema: this.schema,
    };
  }

  /**
   * Vérifier si une table existe
   * @param tableName Nom de la table
   * @returns true si la table existe, false sinon
   */
  async tableExists(tableName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1
        AND table_name = $2
      ) as exists
    `;

    const result = await this.query<{ exists: boolean }>(query, [this.schema, tableName]);
    return result.rows[0].exists;
  }

  /**
   * Obtenir les informations sur les colonnes d'une table
   * @param tableName Nom de la table
   * @returns Informations sur les colonnes
   */
  async getTableColumns(tableName: string): Promise<Record<string, ColumnInfo>> {
    const query = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable = 'YES' as is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary,
        CASE WHEN uk.column_name IS NOT NULL THEN true ELSE false END as is_unique
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ) uk ON c.column_name = uk.column_name
      WHERE c.table_schema = $1
      AND c.table_name = $2
      ORDER BY c.ordinal_position
    `;

    const result = await this.query(query, [this.schema, tableName]);

    const columns: Record<string, ColumnInfo> = {};

    for (const row of result.rows) {
      columns[row.column_name] = {
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
        defaultValue: row.column_default,
        isPrimary: row.is_primary,
        isUnique: row.is_unique,
      };
    }

    return columns;
  }

  /**
   * Obtenir les informations sur les index d'une table
   * @param tableName Nom de la table
   * @returns Informations sur les index
   */
  async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT
        i.relname as index_name,
        am.amname as index_type,
        array_agg(a.attname) as column_names,
        ix.indisunique as is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a,
        pg_am am,
        pg_namespace n
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = $1
        AND n.nspname = $2
        AND t.relnamespace = n.oid
        AND i.relam = am.oid
      GROUP BY
        i.relname,
        am.amname,
        ix.indisunique
      ORDER BY
        i.relname
    `;

    const result = await this.query(query, [tableName, this.schema]);

    return result.rows.map((row) => ({
      name: row.index_name,
      type: row.index_type,
      columns: row.column_names,
      isUnique: row.is_unique,
    }));
  }

  /**
   * Obtenir les informations sur les clés étrangères liées à une table
   * @param tableName Nom de la table (optionnel: si omis, retourne toutes les clés étrangères du schéma)
   * @returns Informations sur les clés étrangères
   */
  async getForeignKeys(tableName?: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT
        tc.constraint_name,
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        ${tableName ? 'AND tc.table_name = $2' : ''}
      ORDER BY
        tc.table_name,
        tc.constraint_name
    `;

    const params = tableName ? [this.schema, tableName] : [this.schema];
    const result = await this.query(query, params);

    // Regrouper les colonnes par contrainte
    const fkMap = new Map<string, ForeignKeyInfo>();

    for (const row of result.rows) {
      const { constraint_name, source_table, source_column, target_table, target_column } = row;

      if (!fkMap.has(constraint_name)) {
        fkMap.set(constraint_name, {
          name: constraint_name,
          sourceTable: source_table,
          sourceColumns: [source_column],
          targetTable: target_table,
          targetColumns: [target_column],
        });
      } else {
        const fk = fkMap.get(constraint_name)!;
        fk.sourceColumns.push(source_column);
        fk.targetColumns.push(target_column);
      }
    }

    return Array.from(fkMap.values());
  }

  /**
   * Générer une carte complète du schéma PostgreSQL
   * @returns Carte du schéma
   */
  async generateSchemaMap(): Promise<SchemaMap> {
    try {
      // Obtenir la liste des tables
      const tableNames = await this.getTables();

      // Obtenir les informations détaillées pour chaque table
      const tables: Record<string, TableInfo> = {};
      for (const tableName of tableNames) {
        tables[tableName] = await this.getTableInfo(tableName);
      }

      // Obtenir toutes les clés étrangères
      const foreignKeys = await this.getForeignKeys();

      return {
        name: `PostgreSQL Schema (${this.connectionOptions.database})`,
        schema: this.schema,
        tables,
        foreignKeys,
      };
    } catch (error) {
      throw new Error(`Échec de la génération de la carte du schéma: ${error.message}`);
    }
  }

  /**
   * Exécuter une requête SQL arbitraire
   * @param sql Requête SQL à exécuter
   * @returns Résultats de la requête
   */
  async executeQuery(sql: string): Promise<any> {
    try {
      const result = await this.query(sql);
      return {
        rowCount: result.rowCount,
        rows: result.rows,
        fields: result.fields.map((field) => ({
          name: field.name,
          dataTypeID: field.dataTypeID,
        })),
      };
    } catch (error) {
      throw new Error(`Échec de l'exécution de la requête: ${error.message}`);
    }
  }

  /**
   * Obtenir des statistiques sur la base de données
   * @returns Statistiques de la base de données
   */
  async getDatabaseStats(): Promise<any> {
    const statsQuery = `
      SELECT
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = $1) as table_count,
        (SELECT count(*) FROM information_schema.columns WHERE table_schema = $1) as column_count,
        (
          SELECT count(*)
          FROM pg_indexes
          WHERE schemaname = $1
        ) as index_count,
        (
          SELECT count(*) 
          FROM information_schema.table_constraints 
          WHERE constraint_schema = $1 
          AND constraint_type = 'FOREIGN KEY'
        ) as foreign_key_count,
        (
          SELECT pg_size_pretty(pg_database_size(current_database()))
        ) as database_size,
        (
          SELECT current_database()
        ) as database_name,
        (
          SELECT version()
        ) as postgres_version
    `;

    const result = await this.query(statsQuery, [this.schema]);
    return result.rows[0];
  }
}
