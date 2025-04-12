/**
 * prisma-generator.ts
 * 
 * Génère un schéma Prisma à partir d'un schéma MySQL analysé
 */

import { MySQLSchema, TableInfo, ColumnInfo, RelationInfo, RelationType } from '../models/schema';

export class PrismaGenerator {
  /**
   * Génère un schéma Prisma à partir du schéma MySQL analysé
   */
  generate(schema: MySQLSchema): string {
    let prismaSchemaContent = this.generateHeader();
    
    // Collecter tous les enums à définir
    const enums = this.collectEnums(schema);
    
    // Générer les définitions d'enum
    Object.entries(enums).forEach(([enumName, values]) => {
      prismaSchemaContent += this.generateEnum(enumName, values);
    });
    
    // Générer les modèles pour chaque table
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      prismaSchemaContent += this.generateModel(tableName, table, schema, enums);
    });
    
    return prismaSchemaContent;
  }

  /**
   * Génère l'en-tête du schéma Prisma
   */
  private generateHeader(): string {
    return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  }

  /**
   * Collecte tous les enums à définir dans le schéma Prisma
   */
  private collectEnums(schema: MySQLSchema): Record<string, string[]> {
    const enums: Record<string, string[]> = {};
    
    // Parcourir toutes les colonnes de type ENUM
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      Object.entries(table.columns).forEach(([columnName, column]) => {
        if (column.type.toUpperCase() === 'ENUM' && column.suggestedPrismaType !== 'String') {
          // Extraire les valeurs d'enum
          const match = column.originalType.match(/ENUM\s*\(\s*(.+?)\s*\)/i);
          if (match) {
            const enumValues = match[1]
              .split(',')
              .map(value => value.trim().replace(/^['"]|['"]$/g, ''));
            
            enums[column.suggestedPrismaType] = enumValues;
          }
        }
      });
    });
    
    return enums;
  }

  /**
   * Génère une définition d'enum Prisma
   */
  private generateEnum(enumName: string, values: string[]): string {
    let enumDefinition = `enum ${enumName} {\n`;
    
    values.forEach(value => {
      // Convertir la valeur en constante valide pour Prisma
      const safeValue = this.toSafeEnumValue(value);
      enumDefinition += `  ${safeValue}\n`;
    });
    
    enumDefinition += '}\n\n';
    return enumDefinition;
  }

  /**
   * Convertit une valeur d'enum en valeur sécurisée pour Prisma
   */
  private toSafeEnumValue(value: string): string {
    // Remplacer les caractères non autorisés par des underscores
    let safeValue = value.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // S'assurer que la valeur commence par une lettre
    if (!/^[a-zA-Z]/.test(safeValue)) {
      safeValue = 'E_' + safeValue;
    }
    
    // Si la valeur est vide après nettoyage, utiliser une valeur par défaut
    if (!safeValue) {
      safeValue = 'EMPTY';
    }
    
    return safeValue;
  }

  /**
   * Génère un modèle Prisma pour une table
   */
  private generateModel(
    tableName: string, 
    table: TableInfo, 
    schema: MySQLSchema, 
    enums: Record<string, string[]>
  ): string {
    // Convertir le nom de la table en PascalCase pour le modèle Prisma
    const modelName = this.toPascalCase(tableName);
    
    let modelDefinition = `model ${modelName} {\n`;
    
    // Générer les champs du modèle
    Object.entries(table.columns).forEach(([columnName, column]) => {
      const field = this.generateField(columnName, column, table, schema);
      modelDefinition += `  ${field}\n`;
    });
    
    // Ajouter les index
    table.indexes.forEach(index => {
      if (index.name === 'PRIMARY') return; // Ignorer l'index de clé primaire, déjà géré via @id
      
      const indexDef = this.generateIndex(index);
      if (indexDef) {
        modelDefinition += `  ${indexDef}\n`;
      }
    });
    
    // Ajouter les relations many-to-many qui nécessitent @@relation
    const manyToManyRelations = this.findManyToManyRelations(tableName, table, schema);
    manyToManyRelations.forEach(relation => {
      modelDefinition += `  ${relation}\n`;
    });
    
    // Ajouter la directive de mapping pour la table
    modelDefinition += `\n  @@map("${tableName}")\n`;
    
    modelDefinition += '}\n\n';
    return modelDefinition;
  }

  /**
   * Génère un champ Prisma pour une colonne
   */
  private generateField(
    columnName: string, 
    column: ColumnInfo, 
    table: TableInfo, 
    schema: MySQLSchema
  ): string {
    // Convertir le nom de la colonne en camelCase pour Prisma
    const fieldName = this.toCamelCase(columnName);
    
    // Déterminer le type Prisma à utiliser
    let fieldType = column.suggestedPrismaType || 'String';
    
    // Vérifier s'il s'agit d'une clé étrangère
    let relation = '';
    const isForeignKey = table.foreignKeys.some(fk => fk.columns.includes(columnName));
    const isImplicitForeignKey = column.isImplicitForeignKey;
    
    if (isForeignKey || isImplicitForeignKey) {
      // Trouver la relation correspondante
      const relationInfo = table.relations?.find(rel => rel.sourceColumn === columnName);
      
      if (relationInfo) {
        // Déterminer le type de relation
        const targetModelName = this.toPascalCase(relationInfo.targetTable);
        
        if (relationInfo.type === RelationType.ONE_TO_ONE) {
          fieldType = targetModelName;
          relation = `@relation(fields: [${fieldName}], references: [${this.toCamelCase(relationInfo.targetColumn)}])`;
        } else if (relationInfo.type === RelationType.MANY_TO_ONE) {
          fieldType = targetModelName;
          relation = `@relation(fields: [${fieldName}], references: [${this.toCamelCase(relationInfo.targetColumn)}])`;
        }
      }
    }
    
    // Si c'est une clé primaire, ajouter @id
    let attributes = '';
    if (column.primaryKey) {
      attributes += ' @id';
      
      // Si c'est auto-increment, ajouter @default(autoincrement())
      if (column.autoIncrement) {
        attributes += ' @default(autoincrement())';
      }
    } else if (column.unique) {
      attributes += ' @unique';
    }
    
    // Si c'est nullable, ajouter un point d'interrogation au type
    const nullable = column.nullable && !isForeignKey ? '?' : '';
    
    // Si une valeur par défaut est spécifiée
    if (column.defaultValue !== undefined && column.defaultValue !== null && !column.autoIncrement) {
      attributes += this.generateDefaultValue(column);
    }
    
    // Ajouter la directive de mapping pour la colonne si le nom est différent
    if (fieldName !== columnName) {
      attributes += ` @map("${columnName}")`;
    }
    
    // Ajouter la relation si présente
    if (relation) {
      attributes += ` ${relation}`;
    }
    
    // Ajouter un commentaire si présent
    let comment = '';
    if (column.comment) {
      comment = ` /// ${column.comment}`;
    }
    
    return `${fieldName} ${fieldType}${nullable}${attributes}${comment}`;
  }

  /**
   * Génère une directive @default pour une colonne
   */
  private generateDefaultValue(column: ColumnInfo): string {
    const defaultValue = column.defaultValue;
    
    if (defaultValue === null) {
      return '';
    }
    
    if (defaultValue === 'CURRENT_TIMESTAMP' || defaultValue === 'NOW()') {
      return ' @default(now())';
    }
    
    // Pour les types numériques
    if (['Int', 'Float', 'Decimal', 'BigInt'].includes(column.suggestedPrismaType || '')) {
      return ` @default(${defaultValue})`;
    }
    
    // Pour les types booléens
    if (column.suggestedPrismaType === 'Boolean') {
      const boolValue = defaultValue === '1' || defaultValue.toLowerCase() === 'true';
      return ` @default(${boolValue})`;
    }
    
    // Pour les autres types, entourer de guillemets
    return ` @default("${defaultValue}")`;
  }

  /**
   * Génère une directive d'index
   */
  private generateIndex(index: { name: string; columns: string[]; unique: boolean }): string {
    if (index.columns.length === 0) return '';
    
    const columns = index.columns.map(col => this.toCamelCase(col));
    const fieldList = columns.map(col => `${col}`).join(', ');
    
    if (index.unique && columns.length === 1) {
      // Pour un index unique sur une seule colonne, utiliser @unique
      return ''; // Déjà géré dans generateField
    }
    
    const uniqueStr = index.unique ? '@@unique' : '@@index';
    return `${uniqueStr}([${fieldList}])`;
  }

  /**
   * Trouve les relations many-to-many qui nécessitent une directive @@relation
   */
  private findManyToManyRelations(
    tableName: string, 
    table: TableInfo, 
    schema: MySQLSchema
  ): string[] {
    const relations: string[] = [];
    
    // Si c'est une table de jonction, on peut définir des relations many-to-many
    if (table.tableType === 'JUNCTION' && table.foreignKeys.length >= 2) {
      // Prendre les deux premières clés étrangères pour simplifier
      const fk1 = table.foreignKeys[0];
      const fk2 = table.foreignKeys[1];
      
      // Vérifier que les tables référencées existent
      if (schema.tables[fk1.referencedTable] && schema.tables[fk2.referencedTable]) {
        const model1 = this.toPascalCase(fk1.referencedTable);
        const model2 = this.toPascalCase(fk2.referencedTable);
        
        // Générer des noms de champs pour les relations (au pluriel)
        const field1 = this.pluralize(this.toCamelCase(fk1.referencedTable));
        const field2 = this.pluralize(this.toCamelCase(fk2.referencedTable));
        
        relations.push(`${field1} ${model1}[] @relation("${tableName}_${fk1.referencedTable}")`);
        relations.push(`${field2} ${model2}[] @relation("${tableName}_${fk2.referencedTable}")`);
      }
    }
    
    return relations;
  }

  /**
   * Convertit une chaîne en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es';
    } else if (str.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2).toLowerCase())) {
      return str.slice(0, -1) + 'ies';
    } else {
      return str + 's';
    }
  }
}