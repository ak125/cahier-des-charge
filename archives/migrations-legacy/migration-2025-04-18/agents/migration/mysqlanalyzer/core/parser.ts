/**
 * parser.ts
 *
 * Parser SQL qui extrait les structures des tables d'un dump MySQL
 */

import {
  ColumnInfo,
  ConstraintInfo,
  ForeignKeyInfo,
  IndexInfo,
  MySQLSchema,
  TableInfo,
  TableType,
} from '../models/schema';

export class SQLParser {
  /**
   * Parse un fichier SQL pour en extraire le schéma
   */
  parse(sqlContent: string): MySQLSchema {
    // Initialiser le schéma
    const schema: MySQLSchema = {
      tables: {},
    };

    // Extraire la version MySQL si disponible
    const versionMatch = sqlContent.match(/-- MySQL dump (\d+\.\d+)/i);
    if (versionMatch) {
      schema.version = versionMatch[1];
    }

    // Extraire les `CREATE TABLE` statements
    this.extractCreateTables(sqlContent, schema);

    // Extraire les `ALTER TABLE` statements pour les clés étrangères
    this.extractAlterTables(sqlContent, schema);

    return schema;
  }

  /**
   * Extrait les déclarations CREATE TABLE
   */
  private extractCreateTables(sqlContent: string, schema: MySQLSchema): void {
    // Regex pour capturer les CREATE TABLE avec leur contenu complet
    const createTableRegex =
      /CREATE\s+TABLE\s+(?:`|")?([^`"\s]+)(?:`|")?\s*\(([\s\S]*?)\)([^;]*);/gim;

    let match;
    while ((match = createTableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const tableContent = match[2];
      const tableOptions = match[3] || '';

      // Initialiser les informations de la table
      const tableInfo: TableInfo = {
        name: tableName,
        columns: {},
        indexes: [],
        foreignKeys: [],
        constraints: [],
        tableType: TableType.UNKNOWN, // Sera déterminé plus tard par le TableClassifier
        originalCreateStatement: match[0],
      };

      // Extraire les options de la table (ENGINE, CHARSET, etc.)
      this.extractTableOptions(tableOptions, tableInfo);

      // Extraire les colonnes, index, et contraintes
      this.extractTableContents(tableContent, tableInfo);

      // Ajouter la table au schéma
      schema.tables[tableName] = tableInfo;
    }
  }

  /**
   * Extrait les options d'une table (ENGINE, CHARSET, etc.)
   */
  private extractTableOptions(optionsStr: string, tableInfo: TableInfo): void {
    // Extraire le moteur de stockage
    const engineMatch = optionsStr.match(/ENGINE\s*=\s*(\w+)/i);
    if (engineMatch) {
      tableInfo.engine = engineMatch[1];
    }

    // Extraire le jeu de caractères
    const charsetMatch = optionsStr.match(/(?:DEFAULT\s+)?CHARSET\s*=\s*(\w+)/i);
    if (charsetMatch) {
      tableInfo.charset = charsetMatch[1];
    }

    // Extraire la collation
    const collateMatch = optionsStr.match(/COLLATE\s*=\s*(\w+)/i);
    if (collateMatch) {
      tableInfo.collation = collateMatch[1];
    }

    // Extraire la valeur auto_increment
    const autoIncrementMatch = optionsStr.match(/AUTO_INCREMENT\s*=\s*(\d+)/i);
    if (autoIncrementMatch) {
      tableInfo.autoIncrement = parseInt(autoIncrementMatch[1], 10);
    }

    // Extraire le commentaire
    const commentMatch = optionsStr.match(/COMMENT\s*=\s*['"](.*?)['"]/i);
    if (commentMatch) {
      tableInfo.comment = commentMatch[1];
    }
  }

  /**
   * Extrait le contenu d'une table (colonnes, index, contraintes)
   */
  private extractTableContents(content: string, tableInfo: TableInfo): void {
    // Séparation des définitions (colonnes, index, contraintes)
    // On doit gérer correctement les virgules dans les chaînes de caractères et les définitions
    const definitions = this.splitTableDefinitions(content);

    // Position de la colonne pour l'ordre
    let columnPosition = 0;

    // Traiter chaque définition
    definitions.forEach((definition) => {
      definition = definition.trim();

      // Si c'est une définition de colonne (ne commence pas par une clé ou index)
      if (!definition.match(/^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)/i)) {
        this.extractColumnDefinition(definition, tableInfo, columnPosition);
        columnPosition++;
      }
      // Si c'est une définition de clé primaire
      else if (definition.match(/^PRIMARY\s+KEY/i)) {
        this.extractPrimaryKey(definition, tableInfo);
      }
      // Si c'est une définition d'index ou de clé unique
      else if (definition.match(/^(UNIQUE\s+)?(KEY|INDEX)/i)) {
        this.extractIndex(definition, tableInfo);
      }
      // Si c'est une définition de contrainte
      else if (definition.match(/^CONSTRAINT/i)) {
        this.extractConstraint(definition, tableInfo);
      }
      // Si c'est une définition de clé étrangère directe
      else if (definition.match(/^FOREIGN\s+KEY/i)) {
        this.extractForeignKey(definition, tableInfo);
      }
    });
  }

  /**
   * Divise le contenu de la table en définitions individuelles
   */
  private splitTableDefinitions(content: string): string[] {
    const definitions: string[] = [];
    let currentDefinition = '';
    let inString = false;
    let inParentheses = 0;

    // Parcourir chaque caractère
    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // Gérer les chaînes de caractères (pour éviter de diviser sur des virgules dans les chaînes)
      if (char === "'" || char === '"') {
        // Vérifier si le guillemet est échappé
        const isEscaped = i > 0 && content[i - 1] === '\\';
        if (!isEscaped) {
          inString = !inString;
        }
      }

      // Gérer les parenthèses (pour les définitions imbriquées)
      if (!inString) {
        if (char === '(') {
          inParentheses++;
        } else if (char === ')') {
          inParentheses--;
        }
      }

      // Si on trouve une virgule et qu'on n'est pas dans une chaîne ou des parenthèses
      if (char === ',' && !inString && inParentheses === 0) {
        definitions.push(currentDefinition.trim());
        currentDefinition = '';
      } else {
        currentDefinition += char;
      }
    }

    // Ajouter la dernière définition si non vide
    if (currentDefinition.trim()) {
      definitions.push(currentDefinition.trim());
    }

    return definitions;
  }

  /**
   * Extrait une définition de colonne
   */
  private extractColumnDefinition(
    definition: string,
    tableInfo: TableInfo,
    position: number
  ): void {
    // Regex pour extraire le nom et le type de la colonne
    const columnRegex = /^(?:`|")?([^`"\s]+)(?:`|")?\s+([A-Za-z0-9]+(?:\([^)]+\))?)\s*(.*?)$/i;
    const match = definition.match(columnRegex);

    if (!match) return;

    const columnName = match[1];
    const originalType = match[2];
    const options = match[3] || '';

    // Initialiser les informations de la colonne
    const columnInfo: ColumnInfo = {
      name: columnName,
      type: this.extractBaseType(originalType),
      originalType,
      nullable: !options.includes('NOT NULL'),
      position,
    };

    // Extraire la longueur/précision du type
    this.extractTypeDetails(originalType, columnInfo);

    // Extraire les autres options (DEFAULT, AUTO_INCREMENT, etc.)
    this.extractColumnOptions(options, columnInfo);

    // Si c'est une clé primaire directement définie sur la colonne
    if (options.includes('PRIMARY KEY')) {
      columnInfo.primaryKey = true;

      // Si la table n'a pas encore de clé primaire définie
      if (!tableInfo.primaryKey) {
        tableInfo.primaryKey = columnName;
      }
    }

    // Si c'est une colonne unique
    if (options.includes('UNIQUE')) {
      columnInfo.unique = true;
    }

    // Ajouter la colonne à la table
    tableInfo.columns[columnName] = columnInfo;
  }

  /**
   * Extrait le type de base d'une colonne (sans la longueur/précision)
   */
  private extractBaseType(fullType: string): string {
    const baseTypeMatch = fullType.match(/^([A-Za-z0-9]+)/i);
    return baseTypeMatch ? baseTypeMatch[1].toUpperCase() : fullType;
  }

  /**
   * Extrait les détails du type (longueur, précision, échelle)
   */
  private extractTypeDetails(fullType: string, columnInfo: ColumnInfo): void {
    // Extraire les informations de longueur/précision entre parenthèses
    const detailsMatch = fullType.match(/\(([^)]+)\)/);

    if (!detailsMatch) return;

    const details = detailsMatch[1];

    // Si c'est un type numérique avec précision et échelle (ex: DECIMAL(10,2))
    if (details.includes(',')) {
      const [precision, scale] = details.split(',').map((s) => parseInt(s.trim(), 10));
      columnInfo.precision = precision;
      columnInfo.scale = scale;
    }
    // Si c'est un type avec longueur (ex: VARCHAR(255))
    else {
      columnInfo.length = parseInt(details, 10);
    }
  }

  /**
   * Extrait les options d'une colonne (DEFAULT, AUTO_INCREMENT, etc.)
   */
  private extractColumnOptions(options: string, columnInfo: ColumnInfo): void {
    // Extraire la valeur par défaut
    const defaultMatch = options.match(/DEFAULT\s+(?:'((?:[^']|'')*)'|"((?:[^"]|"")*)"|([\w.]+))/i);
    if (defaultMatch) {
      // Si la valeur par défaut est une chaîne entre guillemets simples
      if (defaultMatch[1] !== undefined) {
        columnInfo.defaultValue = defaultMatch[1].replace(/''/g, "'");
      }
      // Si la valeur par défaut est une chaîne entre guillemets doubles
      else if (defaultMatch[2] !== undefined) {
        columnInfo.defaultValue = defaultMatch[2].replace(/""/g, '"');
      }
      // Si la valeur par défaut est un mot-clé ou une valeur sans guillemets
      else if (defaultMatch[3] !== undefined) {
        columnInfo.defaultValue = defaultMatch[3];
      }
    }

    // Vérifier si la colonne est auto-increment
    columnInfo.autoIncrement = options.includes('AUTO_INCREMENT');

    // Extraire le commentaire
    const commentMatch = options.match(/COMMENT\s+['"](.*?)['"]/i);
    if (commentMatch) {
      columnInfo.comment = commentMatch[1];
    }

    // Extraire le jeu de caractères
    const charsetMatch = options.match(/CHARACTER SET\s+(\w+)/i);
    if (charsetMatch) {
      columnInfo.charset = charsetMatch[1];
    }

    // Extraire la collation
    const collateMatch = options.match(/COLLATE\s+(\w+)/i);
    if (collateMatch) {
      columnInfo.collation = collateMatch[1];
    }
  }

  /**
   * Extrait une définition de clé primaire
   */
  private extractPrimaryKey(definition: string, tableInfo: TableInfo): void {
    // Extraire les colonnes de la clé primaire
    const columnsMatch = definition.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);

    if (!columnsMatch) return;

    // Extraire et nettoyer les noms de colonnes
    const columns = columnsMatch[1].split(',').map((col) => {
      const cleaned = col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, '');
      return cleaned;
    });

    // Définir la clé primaire de la table
    if (columns.length === 1) {
      tableInfo.primaryKey = columns[0];

      // Marquer la colonne comme clé primaire
      if (tableInfo.columns[columns[0]]) {
        tableInfo.columns[columns[0]].primaryKey = true;
      }
    } else {
      tableInfo.primaryKey = columns;

      // Marquer les colonnes comme faisant partie de la clé primaire
      columns.forEach((col) => {
        if (tableInfo.columns[col]) {
          tableInfo.columns[col].primaryKey = true;
        }
      });
    }

    // Ajouter également comme index
    tableInfo.indexes.push({
      name: 'PRIMARY',
      columns,
      unique: true,
      type: 'PRIMARY',
    });
  }

  /**
   * Extrait une définition d'index ou de clé unique
   */
  private extractIndex(definition: string, tableInfo: TableInfo): void {
    // Vérifier si c'est un index unique
    const isUnique = definition.includes('UNIQUE');

    // Extraire le nom et les colonnes de l'index
    const indexMatch = definition.match(
      /(?:UNIQUE\s+)?(?:KEY|INDEX)\s+(?:`|")?([^`"\s(]+)(?:`|")?\s*\(([^)]+)\)/i
    );

    if (!indexMatch) return;

    const indexName = indexMatch[1];

    // Extraire et nettoyer les noms de colonnes
    const columns = indexMatch[2].split(',').map((col) => {
      // Supprimer les spécifications de longueur pour les index (ex: firstname(20))
      const colName = col.trim().replace(/\(\d+\)$/, '');
      return colName.replace(/^`|`$/g, '').replace(/^"|"$/g, '');
    });

    // Ajouter l'index à la table
    tableInfo.indexes.push({
      name: indexName,
      columns,
      unique: isUnique,
      type: isUnique ? 'UNIQUE' : 'INDEX',
    });

    // Si c'est un index unique sur une seule colonne, marquer la colonne comme unique
    if (isUnique && columns.length === 1 && tableInfo.columns[columns[0]]) {
      tableInfo.columns[columns[0]].unique = true;
    }
  }

  /**
   * Extrait une définition de contrainte
   */
  private extractConstraint(definition: string, tableInfo: TableInfo): void {
    // Extraire le nom de la contrainte
    const nameMatch = definition.match(/CONSTRAINT\s+(?:`|")?([^`"\s]+)(?:`|")?/i);
    if (!nameMatch) return;

    const constraintName = nameMatch[1];

    // Si c'est une contrainte de clé étrangère
    if (definition.includes('FOREIGN KEY')) {
      this.extractForeignKey(definition, tableInfo, constraintName);
      return;
    }

    // Si c'est une contrainte unique
    if (definition.includes('UNIQUE')) {
      const uniqueMatch = definition.match(/UNIQUE\s+(?:KEY|INDEX)?\s*\(([^)]+)\)/i);

      if (uniqueMatch) {
        // Extraire et nettoyer les noms de colonnes
        const columns = uniqueMatch[1]
          .split(',')
          .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));

        // Ajouter la contrainte d'unicité à la table
        tableInfo.constraints.push({
          name: constraintName,
          type: 'UNIQUE',
          definition,
        });

        // Ajouter également comme index
        tableInfo.indexes.push({
          name: constraintName,
          columns,
          unique: true,
          type: 'UNIQUE',
        });

        // Si c'est une contrainte unique sur une seule colonne, marquer la colonne comme unique
        if (columns.length === 1 && tableInfo.columns[columns[0]]) {
          tableInfo.columns[columns[0]].unique = true;
        }
      }
    }
    // Si c'est une contrainte CHECK (MySQL 8+)
    else if (definition.includes('CHECK')) {
      tableInfo.constraints.push({
        name: constraintName,
        type: 'CHECK',
        definition,
      });
    }
    // Autres types de contraintes
    else {
      tableInfo.constraints.push({
        name: constraintName,
        type: 'CUSTOM',
        definition,
      });
    }
  }

  /**
   * Extrait une définition de clé étrangère
   */
  private extractForeignKey(
    definition: string,
    tableInfo: TableInfo,
    constraintName?: string
  ): void {
    // Si le nom de la contrainte n'est pas fourni, essayer de l'extraire
    if (!constraintName) {
      const nameMatch = definition.match(/CONSTRAINT\s+(?:`|")?([^`"\s]+)(?:`|")?/i);
      if (nameMatch) {
        constraintName = nameMatch[1];
      } else {
        constraintName = `fk_${tableInfo.name}_${tableInfo.foreignKeys.length + 1}`;
      }
    }

    // Extraire les colonnes source et cible
    const fkMatch = definition.match(
      /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:`|")?([^`"\s(]+)(?:`|")?\s*\(([^)]+)\)/i
    );

    if (!fkMatch) return;

    // Extraire et nettoyer les noms de colonnes source
    const sourceColumns = fkMatch[1]
      .split(',')
      .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));

    const referencedTable = fkMatch[2];

    // Extraire et nettoyer les noms de colonnes cible
    const referencedColumns = fkMatch[3]
      .split(',')
      .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));

    // Extraire les options ON DELETE et ON UPDATE
    let onDelete: string | undefined;
    let onUpdate: string | undefined;

    const onDeleteMatch = definition.match(/ON\s+DELETE\s+([A-Z]+(?:\s+[A-Z]+)?)/i);
    if (onDeleteMatch) {
      onDelete = onDeleteMatch[1];
    }

    const onUpdateMatch = definition.match(/ON\s+UPDATE\s+([A-Z]+(?:\s+[A-Z]+)?)/i);
    if (onUpdateMatch) {
      onUpdate = onUpdateMatch[1];
    }

    // Ajouter la clé étrangère à la table
    tableInfo.foreignKeys.push({
      name: constraintName,
      columns: sourceColumns,
      referencedTable,
      referencedColumns,
      onDelete,
      onUpdate,
    });

    // Ajouter également comme contrainte
    tableInfo.constraints.push({
      name: constraintName,
      type: 'FOREIGN',
      definition,
    });
  }

  /**
   * Extrait les déclarations ALTER TABLE pour les clés étrangères
   */
  private extractAlterTables(sqlContent: string, schema: MySQLSchema): void {
    // Regex pour capturer les ALTER TABLE avec leur contenu
    const alterTableRegex =
      /ALTER\s+TABLE\s+(?:`|")?([^`"\s]+)(?:`|")?\s+ADD\s+(CONSTRAINT\s+(?:`|")?([^`"\s]+)(?:`|")?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:`|")?([^`"\s(]+)(?:`|")?\s*\(([^)]+)\)([^;]*);/gim;

    let match;
    while ((match = alterTableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const constraintName =
        match[3] || `fk_${tableName}_${schema.tables[tableName]?.foreignKeys.length + 1 || 1}`;

      // Vérifier si la table existe dans le schéma
      if (!schema.tables[tableName]) continue;

      // Extraire et nettoyer les noms de colonnes source
      const sourceColumns = match[4]
        .split(',')
        .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));

      const referencedTable = match[5];

      // Extraire et nettoyer les noms de colonnes cible
      const referencedColumns = match[6]
        .split(',')
        .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));

      const options = match[7] || '';

      // Extraire les options ON DELETE et ON UPDATE
      let onDelete: string | undefined;
      let onUpdate: string | undefined;

      const onDeleteMatch = options.match(/ON\s+DELETE\s+([A-Z]+(?:\s+[A-Z]+)?)/i);
      if (onDeleteMatch) {
        onDelete = onDeleteMatch[1];
      }

      const onUpdateMatch = options.match(/ON\s+UPDATE\s+([A-Z]+(?:\s+[A-Z]+)?)/i);
      if (onUpdateMatch) {
        onUpdate = onUpdateMatch[1];
      }

      // Ajouter la clé étrangère à la table
      schema.tables[tableName].foreignKeys.push({
        name: constraintName,
        columns: sourceColumns,
        referencedTable,
        referencedColumns,
        onDelete,
        onUpdate,
      });

      // Ajouter également comme contrainte
      schema.tables[tableName].constraints.push({
        name: constraintName,
        type: 'FOREIGN',
        definition: match[0],
      });
    }
  }
}
