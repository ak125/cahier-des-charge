/**
 * Service d'exportation du schéma MySQL
 * Fournit des fonctionnalités pour exporter le schéma d'une base de données MySQL
 * dans un format JSON compatible avec les besoins de migration
 */

import fs from 'fs/promises';
import path from 'path';
import { DatabaseConnectionService } from './database-connection-service';
import { TableService, TableInfo, ColumnInfo, ForeignKeyInfo } from './table-service';

export interface RelationInfo {
  source: {
    table: string;
    column: string;
  };
  target: {
    table: string;
    column: string;
  };
  type: '1:1' | '1:n' | 'n:m';
  name: string;
  onUpdate: string;
  onDelete: string;
}

export interface TableSchemaInfo {
  name: string;
  columns: {
    name: string;
    type: string;
    autoIncrement: boolean;
    nullable: boolean;
    unique: boolean;
    default?: string;
    comment?: string;
  }[];
  primaryKey?: string[];
  indexes: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  relations: {
    target: string;
    type: '1:1' | '1:n' | 'n:m';
    field: string;
    onUpdate?: string;
    onDelete?: string;
  }[];
  comment?: string;
}

export interface SchemaMap {
  tables: TableSchemaInfo[];
  databaseName: string;
  version: string;
  exportDate: string;
  dialect: 'mysql';
}

export class SchemaExportService {
  private dbService: DatabaseConnectionService;
  private tableService: TableService;

  constructor(dbService: DatabaseConnectionService) {
    this.dbService = dbService;
    this.tableService = new TableService(dbService);
  }

  /**
   * Exporte la structure complète de la base de données dans un fichier JSON
   * @param outputPath Chemin où exporter le fichier (default: mysql_schema_map.json)
   */
  async exportSchemaMap(outputPath: string = 'mysql_schema_map.json'): Promise<SchemaMap> {
    try {
      if (!this.dbService.isConnectedToDatabase()) {
        await this.dbService.connect();
      }

      const databaseName = this.dbService['connectionOptions'].database;
      const tables = await this.tableService.listTables();
      
      console.log(`Exportation du schéma de ${tables.length} tables...`);
      
      const tablesInfo: TableSchemaInfo[] = [];
      
      // Récupérer les informations pour chaque table
      for (const tableName of tables) {
        console.log(`Traitement de la table ${tableName}...`);
        const tableInfo = await this.tableService.getTableInfo(tableName);
        const foreignKeys = await this.tableService.getForeignKeys(tableName);
        const indexes = await this.tableService.getTableIndexes(tableName);
        
        const tableSchema = this.convertTableToSchemaInfo(tableInfo, foreignKeys, indexes);
        tablesInfo.push(tableSchema);
      }
      
      // Créer l'objet SchemaMap
      const schemaMap: SchemaMap = {
        tables: tablesInfo,
        databaseName,
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        dialect: 'mysql'
      };
      
      // Écrire le fichier JSON
      const jsonContent = JSON.stringify(schemaMap, null, 2);
      await fs.writeFile(outputPath, jsonContent, 'utf8');
      
      console.log(`Schéma exporté avec succès vers ${outputPath}`);
      
      return schemaMap;
    } catch (error) {
      console.error('Erreur lors de l\'exportation du schéma:', error);
      throw new Error(`Erreur lors de l'exportation du schéma: ${error.message}`);
    }
  }

  /**
   * Convertit les informations d'une table en un objet TableSchemaInfo
   */
  private convertTableToSchemaInfo(
    tableInfo: TableInfo,
    foreignKeys: ForeignKeyInfo[],
    indexes: any[]
  ): TableSchemaInfo {
    // Convertir les colonnes
    const columns = tableInfo.columns.map(col => ({
      name: col.name,
      type: col.type,
      autoIncrement: col.autoIncrement,
      nullable: col.nullable,
      unique: col.unique,
      default: col.default !== null ? String(col.default) : undefined,
      comment: col.comment !== '' ? col.comment : undefined
    }));
    
    // Extraire la clé primaire
    const primaryKey = tableInfo.columns
      .filter(col => col.key === 'PRI')
      .map(col => col.name);
    
    // Convertir les index (en excluant la clé primaire qui est traitée séparément)
    const uniqueIndexes = new Map<string, string[]>();
    const nonUniqueIndexes = new Map<string, string[]>();
    
    for (const idx of indexes) {
      if (idx.indexName === 'PRIMARY') continue;
      
      const indexMap = idx.nonUnique ? nonUniqueIndexes : uniqueIndexes;
      
      if (!indexMap.has(idx.indexName)) {
        indexMap.set(idx.indexName, []);
      }
      
      const columns = indexMap.get(idx.indexName);
      columns.push(idx.columnName);
      indexMap.set(idx.indexName, columns);
    }
    
    const allIndexes = [];
    
    for (const [name, columns] of uniqueIndexes.entries()) {
      allIndexes.push({
        name,
        columns,
        unique: true
      });
    }
    
    for (const [name, columns] of nonUniqueIndexes.entries()) {
      allIndexes.push({
        name,
        columns,
        unique: false
      });
    }
    
    // Convertir les relations (clés étrangères)
    const relations = foreignKeys.map(fk => {
      // Déterminer le type de relation (1:1, 1:n, n:m)
      // Par défaut, on considère une relation 1:n
      let relationType: '1:1' | '1:n' | 'n:m' = '1:n';
      
      // Si la colonne source est unique, c'est plutôt une relation 1:1
      const sourceColumn = tableInfo.columns.find(col => col.name === fk.sourceColumn);
      if (sourceColumn && sourceColumn.unique) {
        relationType = '1:1';
      }
      
      return {
        target: fk.referencedTable,
        type: relationType,
        field: fk.sourceColumn,
        onUpdate: fk.updateRule,
        onDelete: fk.deleteRule
      };
    });
    
    return {
      name: tableInfo.name,
      columns,
      primaryKey: primaryKey.length > 0 ? primaryKey : undefined,
      indexes: allIndexes,
      relations,
      comment: tableInfo.comment !== '' ? tableInfo.comment : undefined
    };
  }

  /**
   * Génère un modèle Prisma suggéré pour une table MySQL
   * @param tableName Nom de la table
   * @returns Chaîne de caractères contenant le modèle Prisma
   */
  async suggestPrismaModel(tableName: string): Promise<string> {
    try {
      if (!this.dbService.isConnectedToDatabase()) {
        await this.dbService.connect();
      }
      
      const tableInfo = await this.tableService.getTableInfo(tableName);
      const foreignKeys = await this.tableService.getForeignKeys(tableName);
      
      // Vérifier si la table existe dans les clés étrangères d'autres tables
      // pour déterminer les relations inverses
      const allRelations = await this.tableService.getAllRelations();
      const inverseRelations = allRelations.filter(rel => 
        rel.referencedTable === tableName
      );
      
      // Début du modèle Prisma
      let prismaModel = `model ${this.pascalCase(tableName)} {\n`;
      
      // Ajouter les colonnes
      for (const column of tableInfo.columns) {
        const prismaType = this.mapSqlTypeToPrisma(column);
        const fieldName = this.camelCase(column.name);
        
        let line = `  ${fieldName}  ${prismaType}`;
        
        // Ajouter les attributs
        const attributes = [];
        
        // Clé primaire
        if (column.key === 'PRI') {
          attributes.push('@id');
          
          // Auto-increment
          if (column.autoIncrement) {
            attributes.push('@default(autoincrement())');
          }
        }
        
        // Valeur par défaut
        if (column.default !== null && !column.autoIncrement) {
          const defaultValue = this.formatPrismaDefaultValue(column);
          if (defaultValue) {
            attributes.push(`@default(${defaultValue})`);
          }
        }
        
        // Colonne unique
        if (column.unique && column.key !== 'PRI') {
          attributes.push('@unique');
        }
        
        // Nom de la colonne si différent du nom du champ
        if (fieldName !== column.name) {
          attributes.push(`@map("${column.name}")`);
        }
        
        // Ajouter les attributs à la ligne
        if (attributes.length > 0) {
          line += ' ' + attributes.join(' ');
        }
        
        prismaModel += `${line}\n`;
      }
      
      // Ajouter les relations
      for (const fk of foreignKeys) {
        const targetModel = this.pascalCase(fk.referencedTable);
        const fieldName = this.camelCase(fk.referencedTable);
        
        // Trouver la colonne source
        const sourceColumn = tableInfo.columns.find(col => col.name === fk.sourceColumn);
        
        // Déterminer le type de relation (1:1, 1:n, n:m)
        let relationType = sourceColumn && sourceColumn.unique ? '1:1' : 'n:1';
        
        prismaModel += `  ${fieldName} ${targetModel} @relation(fields: [${this.camelCase(fk.sourceColumn)}], references: [${this.camelCase(fk.referencedColumn)}]`;
        
        // Ajouter les règles de mise à jour et suppression
        const relationAttributes = [];
        if (fk.updateRule && fk.updateRule !== 'NO ACTION') {
          relationAttributes.push(`onUpdate: ${this.formatReferentialAction(fk.updateRule)}`);
        }
        if (fk.deleteRule && fk.deleteRule !== 'NO ACTION') {
          relationAttributes.push(`onDelete: ${this.formatReferentialAction(fk.deleteRule)}`);
        }
        
        if (relationAttributes.length > 0) {
          prismaModel += `, ${relationAttributes.join(', ')}`;
        }
        
        prismaModel += ')\n';
      }
      
      // Ajouter les relations inverses
      for (const rel of inverseRelations) {
        const sourceModel = this.pascalCase(rel.sourceTable);
        let fieldName = this.camelCase(rel.sourceTable);
        
        // Vérifier si c'est une relation 1:1 ou 1:n
        const reverseColumn = await this.findColumnInTable(rel.sourceTable, rel.sourceColumn);
        const isOneToOne = reverseColumn && reverseColumn.unique;
        
        // Pour les relations 1:n, utiliser le pluriel
        if (!isOneToOne) {
          fieldName = this.pluralize(fieldName);
        }
        
        // Ajouter la relation inverse
        const relationType = isOneToOne ? sourceModel : `${sourceModel}[]`;
        prismaModel += `  ${fieldName} ${relationType}\n`;
      }
      
      // Ajouter la directive de mappage de table si le nom du modèle ne correspond pas au nom de la table
      if (this.pascalCase(tableName) !== tableName) {
        prismaModel += `\n  @@map("${tableName}")\n`;
      }
      
      // Fermer le modèle
      prismaModel += '}';
      
      return prismaModel;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du modèle Prisma pour '${tableName}': ${error.message}`);
    }
  }

  /**
   * Génère un fichier schema.prisma complet pour toutes les tables
   * @param outputPath Chemin où exporter le fichier (default: schema.prisma)
   */
  async generatePrismaFile(outputPath: string = 'schema.prisma'): Promise<void> {
    try {
      if (!this.dbService.isConnectedToDatabase()) {
        await this.dbService.connect();
      }
      
      const tables = await this.tableService.listTables();
      
      // En-tête du fichier Prisma
      let prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Modifié de MySQL à PostgreSQL pour la migration
  url      = env("DATABASE_URL")
}

`;
      
      // Générer le modèle pour chaque table
      for (const tableName of tables) {
        const model = await this.suggestPrismaModel(tableName);
        prismaSchema += `${model}\n\n`;
      }
      
      // Écrire le fichier
      await fs.writeFile(outputPath, prismaSchema, 'utf8');
      
      console.log(`Fichier schema.prisma généré avec succès: ${outputPath}`);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier Prisma:', error);
      throw new Error(`Erreur lors de la génération du fichier Prisma: ${error.message}`);
    }
  }

  /**
   * Effectue une analyse qualité du schéma MySQL pour identifier les problèmes potentiels
   * @returns Rapport d'analyse
   */
  async schemaQualityCheck(): Promise<string> {
    try {
      if (!this.dbService.isConnectedToDatabase()) {
        await this.dbService.connect();
      }
      
      const tables = await this.tableService.listTables();
      let report = '# Rapport d\'analyse de la qualité du schéma MySQL\n\n';
      
      // Statistiques globales
      report += '## Statistiques globales\n\n';
      report += `- Nombre total de tables: ${tables.length}\n`;
      
      // Problèmes identifiés
      report += '\n## Problèmes potentiels identifiés\n\n';
      
      // Vérifier chaque table
      for (const tableName of tables) {
        const tableInfo = await this.tableService.getTableInfo(tableName);
        const hasIssues = await this.checkTableIssues(tableInfo);
        
        if (hasIssues.length > 0) {
          report += `### Table: ${tableName}\n\n`;
          for (const issue of hasIssues) {
            report += `- ${issue}\n`;
          }
          report += '\n';
        }
      }
      
      // Recommandations
      report += '\n## Recommandations pour la migration vers PostgreSQL\n\n';
      
      // Clés étrangères manquantes
      const potentialForeignKeys = await this.identifyPotentialForeignKeys();
      if (potentialForeignKeys.length > 0) {
        report += '### Clés étrangères potentiellement manquantes\n\n';
        for (const fk of potentialForeignKeys) {
          report += `- La colonne \`${fk.sourceTable}.${fk.sourceColumn}\` pourrait référencer \`${fk.targetTable}.${fk.targetColumn}\`\n`;
        }
        report += '\n';
      }
      
      // Types de données recommandés pour PostgreSQL
      report += '### Optimisations de types pour PostgreSQL\n\n';
      report += '- Remplacer `TINYINT(1)` par `BOOLEAN` pour les drapeaux\n';
      report += '- Utiliser `UUID` au lieu de `CHAR(36)` pour les identifiants universels\n';
      report += '- Préférer les types natifs PostgreSQL comme `JSONB` au lieu de `TEXT` pour les données JSON\n';
      report += '- Utiliser les types `TIMESTAMP WITH TIME ZONE` pour les dates avec fuseaux horaires\n';
      
      return report;
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse de la qualité du schéma: ${error.message}`);
    }
  }

  /**
   * Compare le schéma MySQL avec un schéma Prisma existant
   * @param prismaSchemaPath Chemin vers le fichier schema.prisma
   * @param outputPath Chemin où exporter le fichier de différence
   */
  async schemaMigrationDiff(
    prismaSchemaPath: string,
    outputPath: string = 'schema_migration_diff.json'
  ): Promise<void> {
    try {
      // Vérifier si le fichier Prisma existe
      try {
        await fs.access(prismaSchemaPath);
      } catch (error) {
        throw new Error(`Le fichier schema.prisma n'existe pas: ${prismaSchemaPath}`);
      }
      
      // Lire le fichier Prisma
      const prismaSchema = await fs.readFile(prismaSchemaPath, 'utf8');
      
      // Exporter le schéma MySQL
      const mysqlSchema = await this.exportSchemaMap();
      
      // Analyser le schéma Prisma
      const prismaModels = this.parsePrismaSchema(prismaSchema);
      
      // Comparer les schémas
      const diff = this.compareSchemas(mysqlSchema, prismaModels);
      
      // Écrire le fichier de différence
      await fs.writeFile(outputPath, JSON.stringify(diff, null, 2), 'utf8');
      
      console.log(`Différences de schéma exportées vers: ${outputPath}`);
    } catch (error) {
      console.error('Erreur lors de la comparaison des schémas:', error);
      throw new Error(`Erreur lors de la comparaison des schémas: ${error.message}`);
    }
  }

  /**
   * Optimise les types MySQL pour PostgreSQL
   * @returns Mapping des types MySQL vers les types PostgreSQL optimisés
   */
  optimizeTypesForPostgreSQL(): Record<string, string> {
    return {
      // Entiers
      'TINYINT(1)': 'BOOLEAN',
      'TINYINT': 'SMALLINT',
      'SMALLINT': 'SMALLINT',
      'MEDIUMINT': 'INTEGER',
      'INT': 'INTEGER',
      'BIGINT': 'BIGINT',
      
      // Décimaux
      'DECIMAL': 'DECIMAL',
      'NUMERIC': 'NUMERIC',
      'FLOAT': 'REAL',
      'DOUBLE': 'DOUBLE PRECISION',
      
      // Chaînes
      'CHAR': 'CHAR',
      'VARCHAR': 'VARCHAR',
      'TINYTEXT': 'TEXT',
      'TEXT': 'TEXT',
      'MEDIUMTEXT': 'TEXT',
      'LONGTEXT': 'TEXT',
      
      // Binaires
      'BINARY': 'BYTEA',
      'VARBINARY': 'BYTEA',
      'TINYBLOB': 'BYTEA',
      'BLOB': 'BYTEA',
      'MEDIUMBLOB': 'BYTEA',
      'LONGBLOB': 'BYTEA',
      
      // Dates et heures
      'DATE': 'DATE',
      'TIME': 'TIME',
      'DATETIME': 'TIMESTAMP',
      'TIMESTAMP': 'TIMESTAMP',
      'YEAR': 'INTEGER',
      
      // Spécifiques
      'ENUM': 'TEXT', // Peut être converti en type ENUM dans PostgreSQL
      'SET': 'TEXT[]',
      'JSON': 'JSONB',
      
      // Types spéciaux
      'CHAR(36)': 'UUID', // Pour les UUID stockés sous forme de chaîne
      'VARCHAR(255)': 'VARCHAR(255)'
    };
  }

  // ====== Méthodes privées ======

  /**
   * Vérifie les problèmes potentiels d'une table
   */
  private async checkTableIssues(tableInfo: TableInfo): Promise<string[]> {
    const issues: string[] = [];
    
    // Vérifier si la table a une clé primaire
    const hasPrimaryKey = tableInfo.columns.some(col => col.key === 'PRI');
    if (!hasPrimaryKey) {
      issues.push('La table ne possède pas de clé primaire');
    }
    
    // Vérifier les colonnes NULL abusives
    const nullableColumns = tableInfo.columns.filter(col => col.nullable);
    if (nullableColumns.length > tableInfo.columns.length / 2) {
      issues.push('Plus de 50% des colonnes peuvent être NULL, ce qui pourrait indiquer un problème de conception');
    }
    
    // Vérifier les types de données problématiques
    for (const column of tableInfo.columns) {
      // BLOB/TEXT sans longueur
      if (['BLOB', 'TEXT', 'MEDIUMBLOB', 'MEDIUMTEXT', 'LONGBLOB', 'LONGTEXT'].includes(column.type.toUpperCase())) {
        issues.push(`La colonne '${column.name}' utilise un type ${column.type} qui peut être inefficace pour les requêtes`);
      }
      
      // FLOAT pour des valeurs monétaires
      if (column.type.toUpperCase().includes('FLOAT') && column.name.match(/prix|montant|tarif|cost|price|amount/i)) {
        issues.push(`La colonne '${column.name}' utilise FLOAT, mais DECIMAL serait plus approprié pour les valeurs monétaires`);
      }
      
      // Utilisation de CHAR au lieu de VARCHAR
      if (column.type.toUpperCase().startsWith('CHAR(') && !column.name.match(/code|abbr|iso|uuid/i)) {
        issues.push(`La colonne '${column.name}' utilise CHAR de taille fixe, ce qui peut gaspiller de l'espace`);
      }
    }
    
    return issues;
  }

  /**
   * Identifie les clés étrangères potentiellement manquantes
   */
  private async identifyPotentialForeignKeys(): Promise<Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }>> {
    const potentialForeignKeys = [];
    const tables = await this.tableService.listTables();
    
    // Récupérer toutes les clés étrangères existantes
    const existingForeignKeys = await this.tableService.getAllRelations();
    
    // Parcourir toutes les tables
    for (const sourceTable of tables) {
      const columns = await this.tableService.getColumnInfo(sourceTable);
      
      // Chercher les colonnes candidates (id_*, *_id, etc.)
      for (const column of columns) {
        // Ignorer les clés primaires et les colonnes déjà en FK
        if (column.key === 'PRI' || existingForeignKeys.some(fk => 
          fk.sourceTable === sourceTable && fk.sourceColumn === column.name
        )) {
          continue;
        }
        
        // Rechercher les colonnes qui pourraient être des clés étrangères
        if (column.name.endsWith('_id') || column.name.startsWith('id_')) {
          // Extraire le nom de table potentiel
          let targetTable = '';
          
          if (column.name.endsWith('_id')) {
            targetTable = column.name.slice(0, -3);
          } else if (column.name.startsWith('id_')) {
            targetTable = column.name.slice(3);
          }
          
          // Vérifier si la table cible existe
          if (tables.includes(targetTable)) {
            // Vérifier si la colonne cible est une clé primaire
            const targetColumns = await this.tableService.getColumnInfo(targetTable);
            const targetPrimaryKey = targetColumns.find(col => col.key === 'PRI');
            
            if (targetPrimaryKey) {
              potentialForeignKeys.push({
                sourceTable,
                sourceColumn: column.name,
                targetTable,
                targetColumn: targetPrimaryKey.name
              });
            }
          }
        }
      }
    }
    
    return potentialForeignKeys;
  }

  /**
   * Analyse un schéma Prisma et extrait les modèles
   */
  private parsePrismaSchema(schema: string): any {
    // Cette fonction est une version simplifiée d'un analyseur Prisma
    // Dans un cas réel, il faudrait utiliser une bibliothèque spécialisée
    
    const models = [];
    const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
    let match;
    
    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      
      const fields = [];
      const fieldLines = modelBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
      
      for (const line of fieldLines) {
        // Analyser les champs du modèle
        const fieldMatch = line.match(/^(\w+)\s+(\w+)(?:\[\])?(?:\s+(.+))?$/);
        if (fieldMatch) {
          const [, fieldName, fieldType, attributes] = fieldMatch;
          fields.push({
            name: fieldName,
            type: fieldType,
            isArray: line.includes('[]'),
            attributes: attributes || ''
          });
        }
      }
      
      models.push({
        name: modelName,
        fields
      });
    }
    
    return models;
  }

  /**
   * Compare le schéma MySQL avec les modèles Prisma
   */
  private compareSchemas(mysqlSchema: SchemaMap, prismaModels: any[]): any {
    const diff = {
      missingTables: [],
      missingColumns: [],
      typeMismatches: [],
      relationMismatches: []
    };
    
    // Vérifier les tables manquantes
    const mysqlTables = mysqlSchema.tables.map(t => t.name);
    const prismaTableNames = prismaModels.map(m => {
      // Récupérer le nom de la table depuis l'attribut @@map ou le nom du modèle
      const modelBody = m.fields.join(' ');
      const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
      return mapMatch ? mapMatch[1] : m.name;
    });
    
    for (const mysqlTable of mysqlTables) {
      if (!prismaTableNames.includes(mysqlTable)) {
        diff.missingTables.push(mysqlTable);
      }
    }
    
    // Vérifier les colonnes manquantes et les différences de type
    for (const mysqlTable of mysqlSchema.tables) {
      // Trouver le modèle Prisma correspondant
      const prismaModel = prismaModels.find(m => {
        const modelBody = m.fields.join(' ');
        const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
        const tableName = mapMatch ? mapMatch[1] : m.name;
        return tableName === mysqlTable.name;
      });
      
      if (!prismaModel) continue;
      
      // Comparer les colonnes
      for (const mysqlColumn of mysqlTable.columns) {
        // Trouver le champ Prisma correspondant
        const prismaField = prismaModel.fields.find(f => {
          const fieldBody = f.attributes || '';
          const mapMatch = fieldBody.match(/@map\("([^"]+)"\)/);
          const columnName = mapMatch ? mapMatch[1] : f.name;
          return columnName === mysqlColumn.name;
        });
        
        if (!prismaField) {
          diff.missingColumns.push({
            table: mysqlTable.name,
            column: mysqlColumn.name
          });
        } else {
          // Vérifier les différences de type
          const mysqlType = mysqlColumn.type.toUpperCase();
          const prismaType = prismaField.type.toUpperCase();
          
          // Vérification simplifiée des types
          // Dans un cas réel, il faudrait une correspondance plus précise
          if (!this.typesAreCompatible(mysqlType, prismaType)) {
            diff.typeMismatches.push({
              table: mysqlTable.name,
              column: mysqlColumn.name,
              mysqlType,
              prismaType
            });
          }
        }
      }
    }
    
    return diff;
  }

  /**
   * Vérifie si les types MySQL et Prisma sont compatibles
   */
  private typesAreCompatible(mysqlType: string, prismaType: string): boolean {
    // Correspondance simplifiée des types MySQL vers Prisma
    const typeMap = {
      'TINYINT(1)': 'BOOLEAN',
      'TINYINT': 'INT',
      'SMALLINT': 'INT',
      'MEDIUMINT': 'INT',
      'INT': 'INT',
      'BIGINT': 'INT',
      'DECIMAL': 'DECIMAL',
      'FLOAT': 'FLOAT',
      'DOUBLE': 'FLOAT',
      'CHAR': 'STRING',
      'VARCHAR': 'STRING',
      'TEXT': 'STRING',
      'DATE': 'DATE',
      'DATETIME': 'DATETIME',
      'TIMESTAMP': 'DATETIME',
      'JSON': 'JSON'
    };
    
    // Extraire le type de base MySQL (sans les paramètres)
    const baseType = mysqlType.split('(')[0];
    
    for (const [mysqlPattern, prismaEquivalent] of Object.entries(typeMap)) {
      if (baseType.includes(mysqlPattern) && prismaType.includes(prismaEquivalent)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Mappe un type SQL MySQL vers un type Prisma
   */
  private mapSqlTypeToPrisma(column: ColumnInfo): string {
    const type = column.type.toLowerCase();
    
    // Booléens
    if (type === 'tinyint(1)') {
      return 'Boolean';
    }
    
    // Entiers
    if (type.includes('int')) {
      return column.unsigned ? 'BigInt' : 'Int';
    }
    
    // Nombres à virgule flottante
    if (type.includes('decimal') || type.includes('numeric')) {
      return 'Decimal';
    }
    if (type.includes('float') || type.includes('double')) {
      return 'Float';
    }
    
    // Chaînes de caractères
    if (type.includes('char') || type.includes('varchar') || type.includes('text')) {
      // UUID stocké sous forme de chaîne
      if (type === 'char(36)' || (type.includes('varchar') && column.name.includes('uuid'))) {
        return 'String'; // @id @default(uuid()) peut être ajouté si c'est un ID
      }
      return 'String';
    }
    
    // Dates et heures
    if (type === 'date') {
      return 'DateTime'; // @db.Date
    }
    if (type === 'time') {
      return 'DateTime'; // @db.Time
    }
    if (type.includes('datetime') || type.includes('timestamp')) {
      return 'DateTime';
    }
    
    // JSON
    if (type === 'json') {
      return 'Json';
    }
    
    // Binaires
    if (type.includes('binary') || type.includes('blob')) {
      return 'Bytes';
    }
    
    // Enums
    if (type.includes('enum')) {
      // Extraire les valeurs de l'enum
      const enumValues = type.match(/enum\(([^)]+)\)/i);
      if (enumValues && enumValues[1]) {
        // Dans un cas réel, il faudrait créer un type Enum Prisma
        return 'String'; // @db.Enum avec les valeurs extraites
      }
      return 'String';
    }
    
    // Types non reconnus
    return 'String'; // Type par défaut
  }

  /**
   * Formate une valeur par défaut pour Prisma
   */
  private formatPrismaDefaultValue(column: ColumnInfo): string | null {
    if (column.default === null) return null;
    
    const type = column.type.toLowerCase();
    const defaultValue = column.default.toString();
    
    // Valeurs spéciales
    if (defaultValue.toLowerCase() === 'current_timestamp') {
      return 'now()';
    }
    
    // Types numériques
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return defaultValue;
    }
    
    // Booléens
    if (type === 'tinyint(1)') {
      return defaultValue === '1' ? 'true' : 'false';
    }
    
    // Chaînes (ajouter des guillemets)
    return `"${defaultValue.replace(/"/g, '\\"')}"`;
  }

  /**
   * Formate une action référentielle MySQL pour Prisma
   */
  private formatReferentialAction(action: string): string {
    switch (action.toUpperCase()) {
      case 'CASCADE': return 'Cascade';
      case 'SET NULL': return 'SetNull';
      case 'RESTRICT': return 'Restrict';
      case 'NO ACTION': return 'NoAction';
      case 'SET DEFAULT': return 'SetDefault';
      default: return 'NoAction';
    }
  }

  /**
   * Trouve une colonne dans une table
   */
  private async findColumnInTable(tableName: string, columnName: string): Promise<ColumnInfo | null> {
    try {
      const columns = await this.tableService.getColumnInfo(tableName);
      return columns.find(col => col.name === columnName) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convertit une chaîne en camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convertit une chaîne en PascalCase
   */
  private pascalCase(str: string): string {
    const camel = this.camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  /**
   * Pluralise un nom en anglais (simpliste)
   */
  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    }
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es';
    }
    return str + 's';
  }
}