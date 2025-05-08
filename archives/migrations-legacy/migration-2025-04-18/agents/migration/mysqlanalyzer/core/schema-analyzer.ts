/**
 * schema-analyzer.ts
 *
 * Analyse le schéma MySQL et génère des statistiques et des mappings
 */

import {
  ColumnInfo,
  MySQLSchema,
  PrismaEnum,
  PrismaField,
  PrismaMapping,
  PrismaModel,
  SchemaStats,
  TableInfo,
  TableStats,
  TableType,
} from '../models/schema';

export class SchemaAnalyzer {
  /**
   * Génère des statistiques sur le schéma
   */
  generateStats(schema: MySQLSchema): SchemaStats {
    const stats: SchemaStats = {
      totalTables: 0,
      totalColumns: 0,
      totalIndexes: 0,
      totalForeignKeys: 0,
      totalConstraints: 0,
      tablesByType: {
        BUSINESS: 0,
        TECHNICAL: 0,
        JUNCTION: 0,
        AUDIT: 0,
        CACHE: 0,
        CONFIG: 0,
        REFERENCE: 0,
        UNKNOWN: 0,
      },
      columnsTypeDistribution: {},
      suggestedTypeConversions: {},
      tableStats: {},
    };

    // Comptage global
    stats.totalTables = Object.keys(schema.tables).length;

    // Analyser chaque table
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      // Incrémenter par type de table
      stats.tablesByType[table.tableType]++;

      // Compter les colonnes et autres éléments
      const columnCount = Object.keys(table.columns).length;
      stats.totalColumns += columnCount;
      stats.totalIndexes += table.indexes.length;
      stats.totalForeignKeys += table.foreignKeys.length;
      stats.totalConstraints += table.constraints.length;

      // Analyser les types de colonnes
      Object.values(table.columns).forEach((column) => {
        const type = column.type.toUpperCase();
        stats.columnsTypeDistribution[type] = (stats.columnsTypeDistribution[type] || 0) + 1;

        // Enregistrer les conversions de types suggérées
        if (column.suggestedPostgresType) {
          const conversion = `${type} -> ${column.suggestedPostgresType}`;
          stats.suggestedTypeConversions[conversion] =
            (stats.suggestedTypeConversions[conversion] || 0) + 1;
        }
      });

      // Générer les statistiques de la table
      stats.tableStats[tableName] = this.generateTableStats(tableName, table);
    });

    return stats;
  }

  /**
   * Génère des statistiques pour une table spécifique
   */
  private generateTableStats(tableName: string, table: TableInfo): TableStats {
    const columnCount = Object.keys(table.columns).length;
    const primaryKeyColumns =
      typeof table.primaryKey === 'string' ? [table.primaryKey] : table.primaryKey || [];

    const nullableColumns = Object.values(table.columns).filter((col) => col.nullable);
    const autoIncrementColumns = Object.entries(table.columns)
      .filter(([_, col]) => col.autoIncrement)
      .map(([name, _]) => name);

    // Déterminer si la table a un usage spécial
    let hasSpecialUsage = false;
    let specialUsageReason: string | undefined;

    if (table.tableType !== TableType.BUSINESS && table.tableType !== TableType.UNKNOWN) {
      hasSpecialUsage = true;
      specialUsageReason = `Table de type ${table.tableType}`;
    } else if (
      table.name.toLowerCase().includes('log') ||
      table.name.toLowerCase().includes('hist') ||
      table.name.toLowerCase().includes('audit')
    ) {
      hasSpecialUsage = true;
      specialUsageReason = "Table d'historique ou d'audit";
    } else if (
      table.name.toLowerCase().includes('cache') ||
      table.name.toLowerCase().includes('temp') ||
      table.name.toLowerCase().includes('tmp')
    ) {
      hasSpecialUsage = true;
      specialUsageReason = 'Table de cache ou temporaire';
    }

    return {
      name: tableName,
      columnCount,
      indexCount: table.indexes.length,
      foreignKeyCount: table.foreignKeys.length,
      primaryKeyColumns,
      nullableColumnsCount: nullableColumns.length,
      autoIncrementColumns,
      hasSpecialUsage,
      specialUsageReason,
    };
  }

  /**
   * Génère un mapping vers Prisma
   */
  generatePrismaMapping(schema: MySQLSchema): PrismaMapping {
    const prismaMapping: PrismaMapping = {
      models: {},
      enums: {},
      datasource: {
        provider: 'postgresql',
        url: 'env("DATABASE_URL")',
      },
      generator: {
        provider: 'prisma-client-js',
      },
    };

    // Collecter tous les enums
    const enums: Record<string, PrismaEnum> = {};

    // Parcourir toutes les colonnes de type ENUM
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        if (
          column.type.toUpperCase() === 'ENUM' &&
          column.suggestedPrismaType &&
          column.suggestedPrismaType !== 'String'
        ) {
          // Extraire les valeurs d'enum
          const match = column.originalType.match(/ENUM\s*\(\s*(.+?)\s*\)/i);
          if (match) {
            const enumValues = match[1]
              .split(',')
              .map((value) => value.trim().replace(/^['"]|['"]$/g, ''));

            enums[column.suggestedPrismaType] = {
              name: column.suggestedPrismaType,
              values: enumValues,
              documentation: `Généré à partir de ${tableName}.${columnName}`,
            };
          }
        }
      });
    });

    prismaMapping.enums = enums;

    // Générer les modèles pour chaque table
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      prismaMapping.models[this.toPascalCase(tableName)] = this.tableToPrismaModel(
        tableName,
        table,
        schema
      );
    });

    return prismaMapping;
  }

  /**
   * Convertit une table en modèle Prisma
   */
  private tableToPrismaModel(
    tableName: string,
    table: TableInfo,
    schema: MySQLSchema
  ): PrismaModel {
    const modelName = this.toPascalCase(tableName);
    const model: PrismaModel = {
      tableName,
      name: modelName,
      fields: {},
      documentation: table.comment,
    };

    // Convertir chaque colonne en champ Prisma
    Object.entries(table.columns).forEach(([columnName, column]) => {
      model.fields[this.toCamelCase(columnName)] = this.columnToPrismaField(
        columnName,
        column,
        table,
        schema
      );
    });

    // Ajouter les relations many-to-many pour les tables de jonction
    if (table.tableType === TableType.JUNCTION && table.foreignKeys.length >= 2) {
      this.addJunctionRelations(model, table, schema);
    }

    return model;
  }

  /**
   * Convertit une colonne en champ Prisma
   */
  private columnToPrismaField(
    columnName: string,
    column: ColumnInfo,
    table: TableInfo,
    schema: MySQLSchema
  ): PrismaField {
    const field: PrismaField = {
      name: this.toCamelCase(columnName),
      type: column.suggestedPrismaType || 'String',
      optional: column.nullable,
      map: columnName !== this.toCamelCase(columnName) ? columnName : undefined,
      documentation: column.comment,
    };

    // Gérer les valeurs par défaut
    if (column.defaultValue !== undefined && column.defaultValue !== null) {
      if (column.defaultValue === 'CURRENT_TIMESTAMP' || column.defaultValue === 'NOW()') {
        field.default = 'now()';
      } else if (['Int', 'Float', 'Decimal', 'BigInt'].includes(field.type)) {
        field.default = column.defaultValue;
      } else if (field.type === 'Boolean') {
        field.default =
          column.defaultValue === '1' || column.defaultValue.toLowerCase() === 'true'
            ? 'true'
            : 'false';
      } else {
        field.default = `"${column.defaultValue}"`;
      }
    }

    // Gérer les clés primaires et auto-increment
    if (column.primaryKey) {
      if (column.autoIncrement) {
        field.default = 'autoincrement()';
      }
    }

    // Gérer les relations
    if (
      table.foreignKeys.some((fk) => fk.columns.includes(columnName)) ||
      column.isImplicitForeignKey
    ) {
      const relationInfo = table.relations?.find((rel) => rel.sourceColumn === columnName);

      if (relationInfo) {
        field.type = this.toPascalCase(relationInfo.targetTable);
        field.relation = {
          fields: [field.name],
          references: [this.toCamelCase(relationInfo.targetColumn)],
        };

        // Ajouter les options ON DELETE et ON UPDATE si disponibles
        const foreignKey = table.foreignKeys.find((fk) => fk.columns.includes(columnName));
        if (foreignKey) {
          if (foreignKey.onDelete) {
            field.relation.onDelete = foreignKey.onDelete.toLowerCase();
          }
          if (foreignKey.onUpdate) {
            field.relation.onUpdate = foreignKey.onUpdate.toLowerCase();
          }
        }
      }
    }

    return field;
  }

  /**
   * Ajoute des relations many-to-many pour les tables de jonction
   */
  private addJunctionRelations(model: PrismaModel, table: TableInfo, schema: MySQLSchema): void {
    if (table.foreignKeys.length < 2) return;

    // Prendre les deux premières clés étrangères
    const fk1 = table.foreignKeys[0];
    const fk2 = table.foreignKeys[1];

    // Vérifier que les tables référencées existent
    if (!schema.tables[fk1.referencedTable] || !schema.tables[fk2.referencedTable]) return;

    // Générer des noms pour les relations
    const relationName1 = `${table.name}_${fk1.referencedTable}`;
    const relationName2 = `${table.name}_${fk2.referencedTable}`;

    // Ajouter les champs de relation
    model.fields[this.pluralize(this.toCamelCase(fk1.referencedTable))] = {
      name: this.pluralize(this.toCamelCase(fk1.referencedTable)),
      type: this.toPascalCase(fk1.referencedTable),
      list: true,
      relation: {
        name: relationName1,
      },
    };

    model.fields[this.pluralize(this.toCamelCase(fk2.referencedTable))] = {
      name: this.pluralize(this.toCamelCase(fk2.referencedTable)),
      type: this.toPascalCase(fk2.referencedTable),
      list: true,
      relation: {
        name: relationName2,
      },
    };
  }

  /**
   * Convertit une chaîne en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convertit une chaîne en camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Met au pluriel une chaîne (simpliste, à améliorer)
   */
  private pluralize(str: string): string {
    if (
      str.endsWith('s') ||
      str.endsWith('x') ||
      str.endsWith('z') ||
      str.endsWith('ch') ||
      str.endsWith('sh')
    ) {
      return str + 'es';
    } else if (
      str.endsWith('y') &&
      !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2).toLowerCase())
    ) {
      return str.slice(0, -1) + 'ies';
    } else {
      return str + 's';
    }
  }
}
