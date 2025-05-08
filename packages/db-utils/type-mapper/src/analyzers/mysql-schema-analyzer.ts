/**
 * Module d'analyse de schéma MySQL
 */
import * as mysql from 'mysql2/promise';
import * as fs from 'fs/promises';
import { Table, Column, Index, ForeignKey } from '../types';

/**
 * Classe pour analyser un schéma MySQL depuis un fichier SQL ou une connexion directe
 */
export class MySQLSchemaAnalyzer {
    private sqlParser: any;

    constructor() {
        // Initialiser le parser SQL de manière dynamique pour éviter les dépendances inutiles
        // si on utilise uniquement l'accès direct à la base de données
        try {
            this.sqlParser = require('sql-parser-cst');
        } catch (error) {
            this.sqlParser = null;
        }
    }

    /**
     * Analyse un schéma MySQL à partir d'un fichier SQL
     * @param filePath Chemin du fichier SQL
     */
    public async analyzeFromFile(filePath: string): Promise<Table[]> {
        if (!this.sqlParser) {
            throw new Error('Module sql-parser-cst non disponible. Installez-le avec: npm install sql-parser-cst');
        }

        // Lire le contenu du fichier
        const content = await fs.readFile(filePath, 'utf8');

        return this.parseSchemaFromSQL(content);
    }

    /**
     * Analyse un schéma MySQL depuis une connexion directe
     * @param config Configuration de connexion
     */
    public async analyzeFromDatabase(config: {
        host: string;
        port?: number;
        user: string;
        password: string;
        database: string;
    }): Promise<Table[]> {
        // Créer la connexion à la base de données
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port || 3306,
            user: config.user,
            password: config.password,
            database: config.database
        });

        try {
            // Récupérer les tables
            const tables = await this.fetchTables(connection, config.database);

            // Pour chaque table, récupérer les colonnes, les index et les clés étrangères
            for (const table of tables) {
                table.columns = await this.fetchColumns(connection, config.database, table.name);
                table.indexes = await this.fetchIndexes(connection, config.database, table.name);
                table.foreignKeys = await this.fetchForeignKeys(connection, config.database, table.name);
            }

            return tables;
        } finally {
            // Fermer la connexion
            await connection.end();
        }
    }

    /**
     * Analyse un schéma à partir d'un contenu SQL
     * @param sql Contenu SQL
     */
    public parseSchemaFromSQL(sql: string): Table[] {
        if (!this.sqlParser) {
            throw new Error('Module sql-parser-cst non disponible. Installez-le avec: npm install sql-parser-cst');
        }

        // Analyser le SQL
        const ast = this.sqlParser.parse(sql);

        // Initialiser le résultat
        const tables: Table[] = [];

        // Parcourir toutes les instructions
        for (const statement of ast.statements) {
            // Ignorer les instructions qui ne sont pas CREATE TABLE
            if (statement.type !== 'create table') {
                continue;
            }

            // Extraire le nom de la table
            const tableName = this.getIdentifierValue(statement.table);

            // Initialiser la table
            const table: Table = {
                name: tableName,
                columns: [],
                primaryKey: [],
                foreignKeys: [],
                indexes: []
            };

            // Parcourir les définitions des colonnes et les contraintes
            for (const definition of statement.definitions) {
                if (definition.type === 'column definition') {
                    // Extraire les informations sur la colonne
                    const column = this.extractColumnFromSQL(definition, table);
                    table.columns.push(column);
                } else if (definition.type === 'constraint') {
                    // Extraire les contraintes (clé primaire, clés étrangères, index)
                    this.extractConstraintFromSQL(definition, table);
                }
            }

            tables.push(table);
        }

        return tables;
    }

    /**
     * Récupère la liste des tables dans la base de données
     * @param connection Connexion MySQL
     * @param database Nom de la base de données
     */
    private async fetchTables(connection: mysql.Connection, database: string): Promise<Table[]> {
        const [rows] = await connection.query(`
      SELECT 
        TABLE_NAME as name,
        TABLE_COMMENT as comment
      FROM 
        INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = ?
      AND 
        TABLE_TYPE = 'BASE TABLE'
      ORDER BY 
        TABLE_NAME
    `, [database]);

        // Convertir les résultats en types Table
        return (rows as any[]).map(row => ({
            name: row.name,
            columns: [],
            comment: row.comment || undefined
        }));
    }

    /**
     * Récupère les colonnes d'une table
     * @param connection Connexion MySQL
     * @param database Nom de la base de données
     * @param tableName Nom de la table
     */
    private async fetchColumns(connection: mysql.Connection, database: string, tableName: string): Promise<Column[]> {
        const [rows] = await connection.query(`
      SELECT 
        COLUMN_NAME as name,
        COLUMN_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        EXTRA as extra,
        COLUMN_COMMENT as comment
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = ?
      AND 
        TABLE_NAME = ?
      ORDER BY 
        ORDINAL_POSITION
    `, [database, tableName]);

        // Convertir les résultats en types Column
        return (rows as any[]).map(row => ({
            name: row.name,
            type: row.type,
            nullable: row.nullable === 'YES',
            defaultValue: row.defaultValue,
            autoIncrement: row.extra?.includes('auto_increment') || false,
            comment: row.comment || undefined,
            extra: row.extra
        }));
    }

    /**
     * Récupère les index d'une table
     * @param connection Connexion MySQL
     * @param database Nom de la base de données
     * @param tableName Nom de la table
     */
    private async fetchIndexes(connection: mysql.Connection, database: string, tableName: string): Promise<Index[]> {
        const [rows] = await connection.query(`
      SELECT 
        INDEX_NAME as name,
        COLUMN_NAME as column_name,
        NON_UNIQUE as non_unique,
        INDEX_TYPE as type
      FROM 
        INFORMATION_SCHEMA.STATISTICS 
      WHERE 
        TABLE_SCHEMA = ?
      AND 
        TABLE_NAME = ?
      ORDER BY 
        INDEX_NAME, SEQ_IN_INDEX
    `, [database, tableName]);

        // Regrouper les colonnes par index
        const indexMap = new Map<string, Index>();

        (rows as any[]).forEach(row => {
            const indexName = row.name;

            if (!indexMap.has(indexName)) {
                indexMap.set(indexName, {
                    name: indexName,
                    columns: [],
                    unique: row.non_unique === 0,
                    type: row.type
                });
            }

            const index = indexMap.get(indexName)!;
            index.columns.push(row.column_name);
        });

        // Ignorer l'index de la clé primaire (sera géré séparément)
        return Array.from(indexMap.values())
            .filter(index => index.name !== 'PRIMARY');
    }

    /**
     * Récupère les clés étrangères d'une table
     * @param connection Connexion MySQL
     * @param database Nom de la base de données
     * @param tableName Nom de la table
     */
    private async fetchForeignKeys(connection: mysql.Connection, database: string, tableName: string): Promise<ForeignKey[]> {
        const [rows] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME as name,
        COLUMN_NAME as column_name,
        REFERENCED_TABLE_NAME as referenced_table,
        REFERENCED_COLUMN_NAME as referenced_column,
        POSITION_IN_UNIQUE_CONSTRAINT as position,
        UPDATE_RULE as update_rule,
        DELETE_RULE as delete_rule
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      JOIN 
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
      ON 
        k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND
        k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
      WHERE 
        k.TABLE_SCHEMA = ?
      AND 
        k.TABLE_NAME = ?
      AND 
        k.REFERENCED_TABLE_SCHEMA IS NOT NULL
      ORDER BY 
        k.CONSTRAINT_NAME, k.POSITION_IN_UNIQUE_CONSTRAINT
    `, [database, tableName]);

        // Regrouper les colonnes par contrainte
        const fkMap = new Map<string, ForeignKey>();

        (rows as any[]).forEach(row => {
            const fkName = row.name;

            if (!fkMap.has(fkName)) {
                fkMap.set(fkName, {
                    name: fkName,
                    columns: [],
                    referencedTable: row.referenced_table,
                    referencedColumns: [],
                    onUpdate: row.update_rule,
                    onDelete: row.delete_rule
                });
            }

            const fk = fkMap.get(fkName)!;
            fk.columns.push(row.column_name);
            fk.referencedColumns.push(row.referenced_column);
        });

        return Array.from(fkMap.values());
    }

    /**
     * Extrait les informations d'une colonne à partir d'une définition SQL
     */
    private extractColumnFromSQL(columnDef: any, table: Table): Column {
        const name = this.getIdentifierValue(columnDef.name);
        const dataType = this.getDataTypeFromSQL(columnDef.dataType);

        // Analyser les options de la colonne
        let nullable = true; // Par défaut, les colonnes sont nullables
        let defaultValue = null;
        let autoIncrement = false;
        let comment = undefined;

        // Parcourir les options de la colonne
        if (columnDef.options) {
            for (const option of columnDef.options) {
                if (option.type === 'not null') {
                    nullable = false;
                } else if (option.type === 'default') {
                    defaultValue = this.getDefaultValueFromSQL(option);
                } else if (option.type === 'auto_increment') {
                    autoIncrement = true;
                } else if (option.type === 'comment') {
                    comment = this.getStringLiteralValue(option.value);
                }
            }
        }

        return {
            name,
            type: dataType,
            nullable,
            defaultValue,
            autoIncrement,
            comment
        };
    }

    /**
     * Extrait les informations d'une contrainte à partir d'une définition SQL
     */
    private extractConstraintFromSQL(constraintDef: any, table: Table): void {
        // Vérifier le type de contrainte
        if (constraintDef.constraint && constraintDef.constraint.type === 'primary key') {
            // Extraire la clé primaire
            table.primaryKey = constraintDef.constraint.columns.map(
                (col: any) => this.getIdentifierValue(col)
            );

            // Marquer les colonnes comme étant des clés primaires
            if (table.primaryKey) { // Vérification de table.primaryKey
                table.primaryKey.forEach(columnName => {
                    const column = table.columns.find(c => c.name === columnName);
                    if (column) {
                        column.primaryKey = true;
                    }
                });
            }
        } else if (constraintDef.constraint && constraintDef.constraint.type === 'foreign key') {
            // Extraire la clé étrangère
            const columns = constraintDef.constraint.columns.map(
                (col: any) => this.getIdentifierValue(col)
            );
            const referencedTable = this.getIdentifierValue(constraintDef.constraint.reference.table);
            const referencedColumns = constraintDef.constraint.reference.columns.map(
                (col: any) => this.getIdentifierValue(col)
            );

            // Extraire les règles ON UPDATE et ON DELETE
            let onUpdate = 'RESTRICT';
            let onDelete = 'RESTRICT';

            if (constraintDef.constraint.reference.actions) {
                constraintDef.constraint.reference.actions.forEach((action: any) => {
                    if (action.type === 'on update') {
                        onUpdate = action.action.toUpperCase();
                    } else if (action.type === 'on delete') {
                        onDelete = action.action.toUpperCase();
                    }
                });
            }

            // Construire la clé étrangère
            const foreignKey: ForeignKey = {
                name: constraintDef.name ? this.getIdentifierValue(constraintDef.name) : `fk_${table.name}_${referencedTable}`,
                columns,
                referencedTable,
                referencedColumns,
                onUpdate,
                onDelete
            };

            table.foreignKeys!.push(foreignKey);
        } else if (constraintDef.type === 'index' || constraintDef.type === 'unique index' || constraintDef.type === 'unique key') {
            // Extraire l'index
            const indexName = constraintDef.name
                ? this.getIdentifierValue(constraintDef.name)
                : `idx_${table.name}_${constraintDef.columns.map((c: any) => this.getIdentifierValue(c)).join('_')}`;

            const columns = constraintDef.columns.map(
                (col: any) => this.getIdentifierValue(col)
            );

            const index: Index = {
                name: indexName,
                columns,
                unique: constraintDef.type === 'unique index' || constraintDef.type === 'unique key',
                type: constraintDef.method || 'BTREE'
            };

            table.indexes!.push(index);
        }
    }

    /**
     * Extrait le type de données à partir d'une définition SQL
     */
    private getDataTypeFromSQL(dataType: any): string {
        let type = dataType.dataType.toUpperCase();

        // Ajouter les paramètres si disponibles
        if (dataType.parameters && dataType.parameters.length > 0) {
            const params = dataType.parameters.map((param: any) => {
                if (param.type === 'number') {
                    return param.value;
                } else if (param.type === 'string') {
                    return `'${param.value}'`;
                }
                return param.value;
            });

            type = `${type}(${params.join(',')})`;
        }

        // Ajouter les modificateurs (UNSIGNED, ZEROFILL, etc.)
        if (dataType.modifiers) {
            dataType.modifiers.forEach((modifier: any) => {
                type = `${type} ${modifier.toUpperCase()}`;
            });
        }

        return type;
    }

    /**
     * Extrait la valeur par défaut à partir d'une définition SQL
     */
    private getDefaultValueFromSQL(defaultOption: any): string | null {
        if (!defaultOption.value) return null;

        if (defaultOption.value.type === 'string') {
            return this.getStringLiteralValue(defaultOption.value);
        } else if (defaultOption.value.type === 'number') {
            return defaultOption.value.value.toString();
        } else if (defaultOption.value.type === 'boolean') {
            return defaultOption.value.value ? '1' : '0';
        } else if (defaultOption.value.type === 'null') {
            return 'NULL';
        } else if (defaultOption.value.type === 'function call') {
            // Gérer les appels de fonction comme CURRENT_TIMESTAMP
            const functionName = this.getIdentifierValue(defaultOption.value.name);
            return functionName.toUpperCase();
        }

        return String(defaultOption.value);
    }

    /**
     * Récupère la valeur d'un identifiant (enlève les backticks si présents)
     */
    private getIdentifierValue(identifier: any): string {
        if (!identifier) return '';

        if (identifier.type === 'identifier') {
            const value = identifier.value;
            // Enlever les backticks si présents
            return value.startsWith('`') && value.endsWith('`')
                ? value.substring(1, value.length - 1)
                : value;
        } else if (typeof identifier === 'string') {
            return identifier;
        }

        return String(identifier);
    }

    /**
     * Récupère la valeur d'une chaîne de caractères (enlève les quotes)
     */
    private getStringLiteralValue(literal: any): string {
        if (!literal) return '';

        if (literal.type === 'string') {
            const value = literal.value;
            // Enlever les quotes si présentes
            return value.startsWith("'") && value.endsWith("'")
                ? value.substring(1, value.length - 1)
                : value;
        } else if (typeof literal === 'string') {
            return literal;
        }

        return String(literal);
    }
}