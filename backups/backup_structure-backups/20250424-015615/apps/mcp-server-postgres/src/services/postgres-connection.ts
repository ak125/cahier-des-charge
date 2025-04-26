/**
 * Service principal pour les connexions PostgreSQL
 */

import { Pool, PoolClient, QueryResult } from pgstructure-agent';
import { parseConnectionString, maskConnectionString } from ../utils/connection-stringstructure-agent';
import { 
  SchemaMap,
  TableInfo, 
  ColumnInfo, 
  ForeignKeyInfo, 
  IndexInfo,
  SchemaExportOptions
} from ../typesstructure-agent';

export class PostgresConnectionService {
  private pool: Pool | null = null;
  private connectionString: string;
  private currentSchema: string = 'public';
  
  /**
   * Crée une nouvelle instance du service de connexion PostgreSQL
   * @param connectionString Chaîne de connexion PostgreSQL
   */
  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }
  
  /**
   * Initialise la connexion à la base de données PostgreSQL
   */
  async connect(): Promise<void> {
    try {
      const config = parseConnectionString(this.connectionString);
      
      // Si un schéma est spécifié dans la chaîne de connexion, on le conserve
      if (config.schema) {
        this.currentSchema = config.schema;
      }
      
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
        idleTimeoutMillis: config.idleTimeoutMillis,
        max: config.max || 10
      });
      
      // Tester la connexion
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        console.log(`Connexion établie à PostgreSQL: ${maskConnectionString(this.connectionString)}`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Erreur lors de la connexion à PostgreSQL: ${error.message}`);
      throw new Error(`Erreur de connexion à PostgreSQL: ${error.message}`);
    }
  }
  
  /**
   * Ferme la connexion à la base de données
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Connexion PostgreSQL fermée');
    }
  }
  
  /**
   * Exécute une requête SQL et renvoie le résultat
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   */
  async executeQuery<T>(query: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('La connexion PostgreSQL n\'est pas initialisée. Appelez connect() d\'abord.');
    }
    
    try {
      return await this.pool.query<T>(query, params);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la requête: ${error.message}`);
      throw new Error(`Erreur d'exécution de requête: ${error.message}`);
    }
  }
  
  /**
   * Obtient un client de connexion du pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('La connexion PostgreSQL n\'est pas initialisée. Appelez connect() d\'abord.');
    }
    
    try {
      return await this.pool.connect();
    } catch (error) {
      console.error(`Erreur lors de l'obtention d'un client: ${error.message}`);
      throw new Error(`Erreur d'obtention de client: ${error.message}`);
    }
  }
  
  /**
   * Change le schéma courant
   * @param schema Nom du schéma à utiliser
   */
  async setSchema(schema: string): Promise<void> {
    if (!this.pool) {
      throw new Error('La connexion PostgreSQL n\'est pas initialisée. Appelez connect() d\'abord.');
    }
    
    try {
      // Vérifier si le schéma existe
      const result = await this.executeQuery(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
        [schema]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Le schéma '${schema}' n'existe pas.`);
      }
      
      this.currentSchema = schema;
      console.log(`Schéma courant changé pour: ${schema}`);
    } catch (error) {
      console.error(`Erreur lors du changement de schéma: ${error.message}`);
      throw new Error(`Erreur de changement de schéma: ${error.message}`);
    }
  }
  
  /**
   * Liste tous les schémas disponibles dans la base de données
   */
  async listSchemas(): Promise<string[]> {
    try {
      const result = await this.executeQuery(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE \'pg_%\' AND schema_name != \'information_schema\' ORDER BY schema_name'
      );
      
      return result.rows.map(row => row.schema_name);
    } catch (error) {
      console.error(`Erreur lors de la récupération des schémas: ${error.message}`);
      throw new Error(`Erreur de récupération des schémas: ${error.message}`);
    }
  }
  
  /**
   * Liste toutes les tables dans le schéma courant
   */
  async listTables(): Promise<string[]> {
    try {
      const result = await this.executeQuery(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = \'BASE TABLE\' ORDER BY table_name',
        [this.currentSchema]
      );
      
      return result.rows.map(row => row.table_name);
    } catch (error) {
      console.error(`Erreur lors de la récupération des tables: ${error.message}`);
      throw new Error(`Erreur de récupération des tables: ${error.message}`);
    }
  }
  
  /**
   * Obtient les informations détaillées sur une table
   * @param tableName Nom de la table
   */
  async getTableInfo(tableName: string): Promise<TableInfo> {
    try {
      // 1. Récupérer les informations de base sur la table
      const tableQuery = await this.executeQuery(
        'SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
        [this.currentSchema, tableName]
      );
      
      if (tableQuery.rowCount === 0) {
        throw new Error(`La table '${tableName}' n'existe pas dans le schéma '${this.currentSchema}'.`);
      }
      
      // 2. Récupérer les colonnes de la table
      const columnsQuery = await this.executeQuery(`
        SELECT 
          c.column_name, 
          c.data_type, 
          c.character_maximum_length, 
          c.numeric_precision, 
          c.numeric_scale,
          c.is_nullable,
          c.column_default,
          (
            SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'PRIMARY KEY' 
              AND tc.table_schema = c.table_schema 
              AND tc.table_name = c.table_name 
              AND ccu.column_name = c.column_name
            )
          ) as is_primary,
          (
            SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'UNIQUE' 
              AND tc.table_schema = c.table_schema 
              AND tc.table_name = c.table_name 
              AND ccu.column_name = c.column_name
            )
          ) as is_unique
        FROM information_schema.columns c
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `, [this.currentSchema, tableName]);
      
      // 3. Récupérer les index
      const indexesQuery = await this.executeQuery(`
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
          i.relname,
          ix.indisunique,
          am.amname
        ORDER BY
          i.relname;
      `, [tableName, this.currentSchema]);
      
      // 4. Récupérer les statistiques
      const statsQuery = await this.executeQuery(`
        SELECT
          reltuples::bigint as row_estimate,
          pg_size_pretty(pg_total_relation_size($1)) as total_size,
          pg_size_pretty(pg_relation_size($1)) as table_size,
          pg_size_pretty(pg_total_relation_size($1) - pg_relation_size($1)) as index_size
        FROM
          pg_class
        WHERE
          oid = $1::regclass;
      `, [`${this.currentSchema}.${tableName}`]);
      
      // Construire les informations de colonnes
      const columns: Record<string, ColumnInfo> = {};
      columnsQuery.rows.forEach(row => {
        columns[row.column_name] = {
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          defaultValue: row.column_default,
          isPrimary: row.is_primary,
          isUnique: row.is_unique,
          length: row.character_maximum_length,
          precision: row.numeric_precision,
          scale: row.numeric_scale
        };
      });
      
      // Construire les informations d'index
      const indexes: IndexInfo[] = indexesQuery.rows.map(row => ({
        name: row.index_name,
        columns: row.column_names,
        isUnique: row.is_unique,
        type: row.index_type
      }));
      
      // Construire les statistiques
      const stats = statsQuery.rowCount > 0 ? {
        rowEstimate: statsQuery.rows[0].row_estimate,
        totalSize: statsQuery.rows[0].total_size,
        tableSize: statsQuery.rows[0].table_size,
        indexSize: statsQuery.rows[0].index_size
      } : null;
      
      return {
        name: tableName,
        schema: this.currentSchema,
        type: tableQuery.rows[0].table_type,
        columns,
        indexes,
        statistics: stats
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des informations de table: ${error.message}`);
      throw new Error(`Erreur de récupération des informations de table: ${error.message}`);
    }
  }
  
  /**
   * Récupère les clés étrangères d'une table
   * @param tableName Nom de la table
   */
  async getTableForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    try {
      const result = await this.executeQuery(`
        SELECT
          tc.constraint_name,
          tc.table_name as source_table,
          kcu.column_name as source_column,
          ccu.table_name AS target_table,
          ccu.column_name AS target_column,
          rc.update_rule,
          rc.delete_rule
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
            AND rc.constraint_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
        ORDER BY
          tc.constraint_name,
          kcu.ordinal_position;
      `, [this.currentSchema, tableName]);
      
      // Regrouper les clés étrangères par nom de contrainte
      const fkMap = new Map<string, ForeignKeyInfo>();
      
      for (const row of result.rows) {
        const { constraint_name, source_table, source_column, target_table, target_column, update_rule, delete_rule } = row;
        
        if (!fkMap.has(constraint_name)) {
          fkMap.set(constraint_name, {
            name: constraint_name,
            sourceTable: source_table,
            sourceColumns: [source_column],
            targetTable: target_table,
            targetColumns: [target_column],
            updateRule: update_rule,
            deleteRule: delete_rule
          });
        } else {
          const fk = fkMap.get(constraint_name)!;
          fk.sourceColumns.push(source_column);
          fk.targetColumns.push(target_column);
        }
      }
      
      return Array.from(fkMap.values());
    } catch (error) {
      console.error(`Erreur lors de la récupération des clés étrangères: ${error.message}`);
      throw new Error(`Erreur de récupération des clés étrangères: ${error.message}`);
    }
  }
  
  /**
   * Récupère une carte complète du schéma de la base de données
   * @param options Options pour l'exportation du schéma
   */
  async getSchemaMap(options: SchemaExportOptions = {}): Promise<SchemaMap> {
    try {
      const { 
        includeViews = false, 
        includeStats = true,
        includeIndexes = true,
        includeForeignKeys = true,
        tableFilter
      } = options;
      
      // 1. Obtenir la liste des tables
      let tables: string[] = await this.listTables();
      
      // Appliquer le filtre de table si spécifié
      if (tableFilter && typeof tableFilter === 'function') {
        tables = tables.filter(tableFilter);
      }
      
      // 2. Si demandé, ajouter les vues
      if (includeViews) {
        const views = await this.executeQuery(
          'SELECT table_name FROM information_schema.views WHERE table_schema = $1 ORDER BY table_name',
          [this.currentSchema]
        );
        tables = [...tables, ...views.rows.map(row => row.table_name)];
      }
      
      // 3. Récupérer les informations sur chaque table
      const tableMap: Record<string, TableInfo> = {};
      for (const tableName of tables) {
        tableMap[tableName] = await this.getTableInfo(tableName);
      }
      
      // 4. Si demandé, récupérer toutes les clés étrangères
      let foreignKeys: ForeignKeyInfo[] = [];
      if (includeForeignKeys) {
        for (const tableName of tables) {
          const fks = await this.getTableForeignKeys(tableName);
          foreignKeys = [...foreignKeys, ...fks];
        }
      }
      
      // 5. Informations sur la base de données
      const dbInfo = await this.executeQuery(`
        SELECT
          current_database() as database_name,
          current_setting('server_version') as version,
          pg_size_pretty(pg_database_size(current_database())) as database_size
      `);
      
      return {
        name: dbInfo.rows[0].database_name,
        version: dbInfo.rows[0].version,
        schema: this.currentSchema,
        size: dbInfo.rows[0].database_size,
        tables: tableMap,
        foreignKeys: includeForeignKeys ? foreignKeys : undefined,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de la carte du schéma: ${error.message}`);
      throw new Error(`Erreur de récupération de la carte du schéma: ${error.message}`);
    }
  }
  
  /**
   * Exporte la structure de la base de données au format SQL
   */
  async exportSchemaSQL(): Promise<string> {
    try {
      // Récupérer la définition SQL de toutes les tables dans le schéma courant
      const tablesQuery = await this.executeQuery(`
        SELECT
          table_name
        FROM
          information_schema.tables
        WHERE
          table_schema = $1
          AND table_type = 'BASE TABLE'
        ORDER BY
          table_name
      `, [this.currentSchema]);
      
      let sqlOutput = `-- Schéma PostgreSQL exporté le ${new Date().toLocaleString()}\n`;
      sqlOutput += `-- Schéma: ${this.currentSchema}\n\n`;
      
      // Créer le schéma s'il n'est pas 'public'
      if (this.currentSchema !== 'public') {
        sqlOutput += `CREATE SCHEMA IF NOT EXISTS ${this.currentSchema};\n\n`;
      }
      
      // Pour chaque table, récupérer sa définition complète
      for (const tableRow of tablesQuery.rows) {
        const tableName = tableRow.table_name;
        
        // Récupérer la définition de la table via pg_dump
        const client = await this.getClient();
        try {
          // Utilisez pg_dump pour obtenir la définition complète de la table
          const result = await client.query(`
            SELECT
              pg_catalog.pg_get_tabledef(c.oid) as table_def
            FROM
              pg_catalog.pg_class c
              JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE
              n.nspname = $1
              AND c.relname = $2
              AND c.relkind = 'r'
          `, [this.currentSchema, tableName]);
          
          if (result.rows.length > 0 && result.rows[0].table_def) {
            sqlOutput += `${result.rows[0].table_def}\n\n`;
          } else {
            // Fallback si pg_get_tabledef n'est pas disponible
            // Récupérer les colonnes de la table
            const columnsQuery = await client.query(`
              SELECT
                column_name,
                data_type,
                character_maximum_length,
                numeric_precision,
                numeric_scale,
                is_nullable,
                column_default
              FROM
                information_schema.columns
              WHERE
                table_schema = $1
                AND table_name = $2
              ORDER BY
                ordinal_position
            `, [this.currentSchema, tableName]);
            
            sqlOutput += `CREATE TABLE ${this.currentSchema}.${tableName} (\n`;
            
            // Générer la définition des colonnes
            const columnDefs = columnsQuery.rows.map(col => {
              let dataType = col.data_type;
              
              // Ajouter les précisions pour les types qui en ont besoin
              if (col.character_maximum_length) {
                dataType += `(${col.character_maximum_length})`;
              } else if (col.numeric_precision && col.numeric_scale) {
                dataType += `(${col.numeric_precision}, ${col.numeric_scale})`;
              }
              
              let columnDef = `  ${col.column_name} ${dataType}`;
              
              // Nullable
              columnDef += col.is_nullable === 'YES' ? '' : ' NOT NULL';
              
              // Valeur par défaut
              if (col.column_default) {
                columnDef += ` DEFAULT ${col.column_default}`;
              }
              
              return columnDef;
            });
            
            // Récupérer la clé primaire
            const pkQuery = await client.query(`
              SELECT
                kcu.column_name
              FROM
                information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
              WHERE
                tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2
              ORDER BY
                kcu.ordinal_position
            `, [this.currentSchema, tableName]);
            
            // Si on a une clé primaire, l'ajouter à la définition
            if (pkQuery.rowCount > 0) {
              const pkColumns = pkQuery.rows.map(row => row.column_name).join(', ');
              columnDefs.push(`  PRIMARY KEY (${pkColumns})`);
            }
            
            sqlOutput += columnDefs.join(',\n');
            sqlOutput += '\n);\n\n';
            
            // Ajouter les index
            const indexQuery = await client.query(`
              SELECT
                indexdef
              FROM
                pg_indexes
              WHERE
                schemaname = $1
                AND tablename = $2
                AND indexname NOT IN (
                  SELECT
                    tc.constraint_name
                  FROM
                    information_schema.table_constraints tc
                  WHERE
                    tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
                    AND tc.table_schema = $1
                    AND tc.table_name = $2
                )
            `, [this.currentSchema, tableName]);
            
            for (const idx of indexQuery.rows) {
              sqlOutput += `${idx.indexdef};\n`;
            }
            
            sqlOutput += '\n';
          }
        } finally {
          client.release();
        }
      }
      
      return sqlOutput;
    } catch (error) {
      console.error(`Erreur lors de l'exportation du schéma SQL: ${error.message}`);
      throw new Error(`Erreur d'exportation du schéma SQL: ${error.message}`);
    }
  }
  
  /**
   * Exporte le schéma au format Prisma
   */
  async exportPrismaSchema(): Promise<string> {
    try {
      const schemaMap = await this.getSchemaMap({
        includeViews: false,
        includeStats: false,
        includeIndexes: true,
        includeForeignKeys: true
      });
      
      let prismaSchema = `// Prisma Schema généré le ${new Date().toLocaleString()}\n\n`;
      prismaSchema += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;
      prismaSchema += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;
      
      // Fonction pour convertir un type PostgreSQL en type Prisma
      const toPrismaType = (pgType: string, isArray: boolean = false): string => {
        const typeMap: Record<string, string> = {
          'integer': 'Int',
          'bigint': 'BigInt',
          'smallint': 'Int',
          'decimal': 'Decimal',
          'numeric': 'Decimal',
          'real': 'Float',
          'double precision': 'Float',
          'character varying': 'String',
          'character': 'String',
          'text': 'String',
          'boolean': 'Boolean',
          'date': 'DateTime',
          'time': 'DateTime',
          'timestamp': 'DateTime',
          'timestamp with time zone': 'DateTime',
          'timestamp without time zone': 'DateTime',
          'uuid': 'String',
          'json': 'Json',
          'jsonb': 'Json',
          'bytea': 'Bytes'
        };
        
        let type = typeMap[pgType] || 'String';
        
        if (isArray) {
          type += '[]';
        }
        
        return type;
      };
      
      // Pour chaque table, générer un modèle Prisma
      for (const [tableName, tableInfo] of Object.entries(schemaMap.tables)) {
        // Convertir le nom de la table en PascalCase pour Prisma
        const modelName = tableName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
        
        prismaSchema += `model ${modelName} {\n`;
        
        // Colonnes
        for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
          const isList = columnInfo.type.endsWith('[]') || columnInfo.type.includes('ARRAY');
          const baseType = columnInfo.type.replace(/\[\]$/, '').replace(/ARRAY\[([^\]]+)\]/, '$1');
          
          let line = `  ${columnName} ${toPrismaType(baseType, isList)}`;
          
          // Ajouter les attributs
          const attributes: string[] = [];
          
          if (columnInfo.isPrimary) {
            attributes.push('@id');
          }
          
          if (columnInfo.isUnique && !columnInfo.isPrimary) {
            attributes.push('@unique');
          }
          
          if (columnInfo.defaultValue) {
            // Nettoyer la valeur par défaut
            let defaultValue = columnInfo.defaultValue;
            
            // Gérer les fonctions comme nextval et autres
            if (defaultValue.includes('nextval(')) {
              attributes.push('@default(autoincrement())');
            } else if (defaultValue.includes('now()')) {
              attributes.push('@default(now())');
            } else if (defaultValue.includes('gen_random_uuid()') || defaultValue.includes('uuid_generate_v4()')) {
              attributes.push('@default(uuid())');
            } else if (defaultValue === 'true' || defaultValue === 'false') {
              attributes.push(`@default(${defaultValue})`);
            } else if (!isNaN(Number(defaultValue))) {
              attributes.push(`@default(${defaultValue})`);
            } else {
              // Enlever les '' pour les chaînes
              defaultValue = defaultValue.replace(/^'(.*)'$/, '$1');
              attributes.push(`@default("${defaultValue}")`);
            }
          }
          
          // Ajouter les contraintes de mappage si le nom de colonne diffère de celui attendu par convention Prisma
          if (columnName !== 'id' && columnInfo.isPrimary) {
            attributes.push(`@map("${columnName}")`);
          }
          
          if (attributes.length > 0) {
            line += ' ' + attributes.join(' ');
          }
          
          // Ajouter les relations si possible
          line += columnInfo.nullable ? '?' : '';
          
          prismaSchema += `${line}\n`;
        }
        
        // Ajouter les relations basées sur les clés étrangères
        if (schemaMap.foreignKeys) {
          const relationsForThisTable = schemaMap.foreignKeys.filter(fk => fk.sourceTable === tableName);
          
          for (const fk of relationsForThisTable) {
            // Convertir le nom de la table cible en PascalCase
            const targetModelName = fk.targetTable
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
            
            // Déterminer le nom de la relation
            let relationName = fk.targetTable;
            
            // Si c'est une relation vers soi-même, ajouter un préfixe
            if (fk.targetTable === fk.sourceTable) {
              relationName = `parent${targetModelName}`;
            }
            
            // Ajouter la relation
            prismaSchema += `  ${relationName} ${targetModelName} @relation(fields: [${fk.sourceColumns.join(', ')}], references: [${fk.targetColumns.join(', ')}])\n`;
          }
          
          // Ajouter les relations inverses
          const relationsToThisTable = schemaMap.foreignKeys.filter(fk => fk.targetTable === tableName);
          
          for (const fk of relationsToThisTable) {
            // Convertir le nom de la table source en PascalCase
            const sourceModelName = fk.sourceTable
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
            
            // Déterminer le nom de la relation
            let relationName = `${fk.sourceTable}s`;
            
            // Si c'est une relation vers soi-même, ajouter un préfixe
            if (fk.targetTable === fk.sourceTable) {
              relationName = `children${sourceModelName}s`;
            }
            
            // Ajouter la relation inverse (many)
            prismaSchema += `  ${relationName} ${sourceModelName}[] @relation\n`;
          }
        }
        
        prismaSchema += `  @@map("${tableName}")\n`;
        prismaSchema += `}\n\n`;
      }
      
      return prismaSchema;
    } catch (error) {
      console.error(`Erreur lors de l'exportation du schéma Prisma: ${error.message}`);
      throw new Error(`Erreur d'exportation du schéma Prisma: ${error.message}`);
    }
  }
  
  /**
   * Exécute une requête pour obtenir les statistiques de performance
   */
  async getPerformanceStats(): Promise<any> {
    try {
      // Requête pour obtenir des informations sur les tables les plus volumineuses
      const largestTables = await this.executeQuery(`
        SELECT
          schemaname || '.' || relname as table,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size,
          pg_size_pretty(pg_relation_size(relid)) as table_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
          pg_total_relation_size(relid) as size_in_bytes
        FROM
          pg_catalog.pg_statio_user_tables
        ORDER BY
          pg_total_relation_size(relid) DESC
        LIMIT 10
      `);
      
      // Requête pour obtenir des informations sur les index les moins utilisés
      const unusedIndexes = await this.executeQuery(`
        SELECT
          schemaname || '.' || relname as table,
          indexrelname as index,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          idx_scan as index_scans
        FROM
          pg_stat_user_indexes
        WHERE
          idx_scan < 50  -- Index peu utilisés
          AND pg_relation_size(indexrelid) > 1024 * 1024  -- Plus de 1 Mo
        ORDER BY
          pg_relation_size(indexrelid) DESC
        LIMIT 10
      `);
      
      // Requête pour obtenir des informations sur les requêtes les plus lentes
      const slowQueries = await this.executeQuery(`
        SELECT
          query,
          round(total_time::numeric, 2) as total_time,
          calls,
          round(mean_time::numeric, 2) as mean_time,
          round((100 * total_time / sum(total_time) OVER ())::numeric, 2) as percentage
        FROM
          pg_stat_statements
        ORDER BY
          total_time DESC
        LIMIT 10
      `);
      
      // Requête pour obtenir des informations sur l'activité des tables
      const tableActivity = await this.executeQuery(`
        SELECT
          schemaname || '.' || relname as table,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM
          pg_stat_user_tables
        ORDER BY
          n_live_tup DESC
        LIMIT 10
      `);
      
      return {
        largestTables: largestTables.rows,
        unusedIndexes: unusedIndexes.rows,
        slowQueries: slowQueries.rows,
        tableActivity: tableActivity.rows,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques de performance: ${error.message}`);
      
      // Si l'erreur concerne pg_stat_statements, on continue avec les autres statistiques
      if (error.message.includes('pg_stat_statements')) {
        console.warn('Extension pg_stat_statements non disponible. Les statistiques de requêtes lentes ne seront pas incluses.');
        
        const largestTables = await this.executeQuery(`
          SELECT
            schemaname || '.' || relname as table,
            pg_size_pretty(pg_total_relation_size(relid)) as total_size,
            pg_size_pretty(pg_relation_size(relid)) as table_size,
            pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
            pg_total_relation_size(relid) as size_in_bytes
          FROM
            pg_catalog.pg_statio_user_tables
          ORDER BY
            pg_total_relation_size(relid) DESC
          LIMIT 10
        `);
        
        const unusedIndexes = await this.executeQuery(`
          SELECT
            schemaname || '.' || relname as table,
            indexrelname as index,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
            idx_scan as index_scans
          FROM
            pg_stat_user_indexes
          WHERE
            idx_scan < 50  -- Index peu utilisés
            AND pg_relation_size(indexrelid) > 1024 * 1024  -- Plus de 1 Mo
          ORDER BY
            pg_relation_size(indexrelid) DESC
          LIMIT 10
        `);
        
        const tableActivity = await this.executeQuery(`
          SELECT
            schemaname || '.' || relname as table,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples
          FROM
            pg_stat_user_tables
          ORDER BY
            n_live_tup DESC
          LIMIT 10
        `);
        
        return {
          largestTables: largestTables.rows,
          unusedIndexes: unusedIndexes.rows,
          tableActivity: tableActivity.rows,
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error(`Erreur de récupération des statistiques de performance: ${error.message}`);
    }
  }
}