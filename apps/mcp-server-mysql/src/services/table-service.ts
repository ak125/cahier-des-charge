/**
 * Service de gestion des tables MySQL
 * Fournit des fonctionnalités pour lister et décrire les tables d'une base de données MySQL
 */

import { DatabaseConnectionService } from './database-connection-service';

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default: string | null;
  extra: string;
  comment: string;
  characterSet?: string;
  collation?: string;
  length?: number;
  autoIncrement: boolean;
  unsigned?: boolean;
  zerofill?: boolean;
  unique: boolean;
}

export interface TableInfo {
  name: string;
  engine: string;
  version: number;
  rowFormat: string;
  rows: number;
  avgRowLength: number;
  dataLength: number;
  maxDataLength: number;
  indexLength: number;
  dataFree: number;
  autoIncrement: number | null;
  createTime: Date;
  updateTime: Date | null;
  checkTime: Date | null;
  collation: string;
  checksum: string | null;
  createOptions: string;
  comment: string;
  columns: ColumnInfo[];
}

export interface ForeignKeyInfo {
  constraintName: string;
  sourceTable: string;
  sourceColumn: string;
  referencedTable: string;
  referencedColumn: string;
  updateRule: string;
  deleteRule: string;
}

export interface IndexInfo {
  tableName: string;
  indexName: string;
  columnName: string;
  nonUnique: boolean;
  seqInIndex: number;
  collation: string | null;
  cardinality: number | null;
  subPart: number | null;
  packed: string | null;
  nullable: boolean;
  indexType: string;
  comment: string;
  indexComment: string;
}

export class TableService {
  private dbService: DatabaseConnectionService;

  constructor(dbService: DatabaseConnectionService) {
    this.dbService = dbService;
  }

  /**
   * Liste toutes les tables de la base de données
   * @returns Liste des noms de tables
   */
  async listTables(): Promise<string[]> {
    try {
      const rows = await this.dbService.executeQuery<{ TABLE_NAME: string }>(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ?`,
        [this.dbService['connectionOptions'].database]
      );
      
      return rows.map(row => row.TABLE_NAME);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des tables: ${error.message}`);
    }
  }

  /**
   * Récupère les informations détaillées sur une table
   * @param tableName Nom de la table
   * @returns Informations sur la table
   */
  async getTableInfo(tableName: string): Promise<TableInfo> {
    try {
      // Vérifier si la table existe
      const tables = await this.listTables();
      if (!tables.includes(tableName)) {
        throw new Error(`La table '${tableName}' n'existe pas`);
      }
      
      // Récupérer les informations générales sur la table
      const [tableInfoRows] = await this.dbService.executeQuery<any>(
        `SELECT * FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [this.dbService['connectionOptions'].database, tableName]
      );
      
      if (!tableInfoRows || tableInfoRows.length === 0) {
        throw new Error(`Impossible de récupérer les informations pour la table '${tableName}'`);
      }
      
      const tableInfoRow = tableInfoRows[0];
      
      // Récupérer les informations sur les colonnes
      const columns = await this.getColumnInfo(tableName);
      
      return {
        name: tableInfoRow.TABLE_NAME,
        engine: tableInfoRow.ENGINE,
        version: tableInfoRow.VERSION,
        rowFormat: tableInfoRow.ROW_FORMAT,
        rows: tableInfoRow.TABLE_ROWS,
        avgRowLength: tableInfoRow.AVG_ROW_LENGTH,
        dataLength: tableInfoRow.DATA_LENGTH,
        maxDataLength: tableInfoRow.MAX_DATA_LENGTH,
        indexLength: tableInfoRow.INDEX_LENGTH,
        dataFree: tableInfoRow.DATA_FREE,
        autoIncrement: tableInfoRow.AUTO_INCREMENT,
        createTime: tableInfoRow.CREATE_TIME,
        updateTime: tableInfoRow.UPDATE_TIME,
        checkTime: tableInfoRow.CHECK_TIME,
        collation: tableInfoRow.TABLE_COLLATION,
        checksum: tableInfoRow.CHECKSUM,
        createOptions: tableInfoRow.CREATE_OPTIONS,
        comment: tableInfoRow.TABLE_COMMENT,
        columns
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des informations de la table '${tableName}': ${error.message}`);
    }
  }

  /**
   * Récupère les informations sur les colonnes d'une table
   * @param tableName Nom de la table
   * @returns Liste des informations sur les colonnes
   */
  async getColumnInfo(tableName: string): Promise<ColumnInfo[]> {
    try {
      // Récupérer les informations de base sur les colonnes
      const rows = await this.dbService.executeQuery<any>(
        `SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [this.dbService['connectionOptions'].database, tableName]
      );
      
      // Récupérer les informations sur les clés uniques
      const uniqueIndexes = await this.getUniqueIndexes(tableName);
      
      return rows.map(row => {
        const typeParts = row.COLUMN_TYPE.match(/^(\w+)(?:\((\d+)(?:,(\d+))?\))?(?:\s+(unsigned|zerofill))?/i);
        const baseType = typeParts ? typeParts[1] : row.COLUMN_TYPE;
        const length = typeParts && typeParts[2] ? parseInt(typeParts[2], 10) : undefined;
        const unsigned = row.COLUMN_TYPE.toLowerCase().includes('unsigned');
        const zerofill = row.COLUMN_TYPE.toLowerCase().includes('zerofill');
        
        // Vérifier si la colonne fait partie d'un index unique
        const isUnique = uniqueIndexes.some(idx => 
          idx.columnName === row.COLUMN_NAME && !idx.nonUnique
        );
        
        return {
          name: row.COLUMN_NAME,
          type: row.COLUMN_TYPE,
          nullable: row.IS_NULLABLE === 'YES',
          key: row.COLUMN_KEY,
          default: row.COLUMN_DEFAULT,
          extra: row.EXTRA,
          comment: row.COLUMN_COMMENT,
          characterSet: row.CHARACTER_SET_NAME,
          collation: row.COLLATION_NAME,
          length,
          autoIncrement: row.EXTRA.toLowerCase().includes('auto_increment'),
          unsigned,
          zerofill,
          unique: isUnique || row.COLUMN_KEY === 'UNI'
        };
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des informations des colonnes pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Récupère les informations sur les clés étrangères d'une table
   * @param tableName Nom de la table
   * @returns Liste des informations sur les clés étrangères
   */
  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    try {
      const rows = await this.dbService.executeQuery<any>(
        `SELECT
           CONSTRAINT_NAME as constraintName,
           TABLE_NAME as sourceTable,
           COLUMN_NAME as sourceColumn,
           REFERENCED_TABLE_NAME as referencedTable,
           REFERENCED_COLUMN_NAME as referencedColumn,
           UPDATE_RULE as updateRule,
           DELETE_RULE as deleteRule
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
         JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
           ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
           AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
         WHERE k.TABLE_SCHEMA = ?
           AND k.TABLE_NAME = ?
           AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
        [this.dbService['connectionOptions'].database, tableName]
      );
      
      return rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des clés étrangères pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Récupère les informations sur tous les index d'une table
   * @param tableName Nom de la table
   * @returns Liste des informations sur les index
   */
  async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    try {
      const rows = await this.dbService.executeQuery<any>(
        `SELECT
           TABLE_NAME as tableName,
           INDEX_NAME as indexName,
           COLUMN_NAME as columnName,
           NON_UNIQUE as nonUnique,
           SEQ_IN_INDEX as seqInIndex,
           COLLATION as collation,
           CARDINALITY as cardinality,
           SUB_PART as subPart,
           PACKED as packed,
           NULLABLE as nullable,
           INDEX_TYPE as indexType,
           COMMENT as comment,
           INDEX_COMMENT as indexComment
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = ?
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [this.dbService['connectionOptions'].database, tableName]
      );
      
      return rows.map(row => ({
        ...row,
        nonUnique: row.nonUnique === 1,
        nullable: row.nullable === 'YES'
      }));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des index pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Récupère uniquement les index uniques d'une table
   * @param tableName Nom de la table
   * @returns Liste des informations sur les index uniques
   */
  async getUniqueIndexes(tableName: string): Promise<IndexInfo[]> {
    const indexes = await this.getTableIndexes(tableName);
    return indexes.filter(index => !index.nonUnique);
  }

  /**
   * Récupère les relations entre les tables (toutes les clés étrangères de la base)
   * @returns Liste des informations sur les relations entre tables
   */
  async getAllRelations(): Promise<ForeignKeyInfo[]> {
    try {
      const rows = await this.dbService.executeQuery<any>(
        `SELECT
           CONSTRAINT_NAME as constraintName,
           TABLE_NAME as sourceTable,
           COLUMN_NAME as sourceColumn,
           REFERENCED_TABLE_NAME as referencedTable,
           REFERENCED_COLUMN_NAME as referencedColumn,
           UPDATE_RULE as updateRule,
           DELETE_RULE as deleteRule
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
         JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
           ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
           AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
         WHERE k.TABLE_SCHEMA = ?
           AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
        [this.dbService['connectionOptions'].database]
      );
      
      return rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des relations entre tables: ${error.message}`);
    }
  }

  /**
   * Compte le nombre de lignes dans une table
   * @param tableName Nom de la table
   * @returns Nombre de lignes
   */
  async countRows(tableName: string): Promise<number> {
    try {
      const [result] = await this.dbService.executeQuery<{count: number}>(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      return result.count;
    } catch (error) {
      throw new Error(`Erreur lors du comptage des lignes pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Récupère les premières N lignes d'une table
   * @param tableName Nom de la table
   * @param limit Nombre maximum de lignes à récupérer
   * @returns Lignes de la table
   */
  async getSampleRows(tableName: string, limit: number = 10): Promise<any[]> {
    try {
      return await this.dbService.executeQuery(
        `SELECT * FROM \`${tableName}\` LIMIT ?`,
        [limit]
      );
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des lignes pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Vérifie si une table a au moins une clé primaire
   * @param tableName Nom de la table
   * @returns true si la table a une clé primaire, false sinon
   */
  async hasPrimaryKey(tableName: string): Promise<boolean> {
    try {
      const columns = await this.getColumnInfo(tableName);
      return columns.some(column => column.key === 'PRI');
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de la clé primaire pour '${tableName}': ${error.message}`);
    }
  }
}