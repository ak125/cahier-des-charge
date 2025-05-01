/**
import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
 * prisma-generator.ts
 * 
 * Agent spécialisé dans la génération des modèles Prisma
 * - Génère les définitions de modèles avec types appropriés
 * - Ajoute les relations inter-modèles
 * - Configure les énumérations et les valeurs par défaut
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';
import { ColumnInfo, MySQLSchema, TableInfo } from '../models/schema';


interface PrismaModelField {
  name: string;
  type: string;
  attributes: string[];
  comment?: string;
}

interface PrismaModel {
  name: string;
  fields: PrismaModelField[];
  comment?: string;
}

interface PrismaEnum {
  name: string;
  values: string[];
}

interface PrismaSchema {
  models: PrismaModel[];
  enums: PrismaEnum[];
}

export class PrismaGenerator implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent{
  /**
   * Génère un schéma Prisma complet à partir du schéma MySQL analysé
   */
  async generate(schema: MySQLSchema): Promise<{
    prismaSchema: string;
    splitModels: Record<string, string>;
    enums: Record<string, string[]>;
  }> {
    // Structures pour construire le schéma Prisma
    const prismaSchema: PrismaSchema = {
      models: [],
      enums: []
    };
    
    // Collecte des énumérations à travers toutes les tables
    const enumMap: Record<string, Set<string>> = {};
    
    // Première passe : créer les modèles de base sans relations
    Object.entries(schema.tables).forEach(([tableName, table]) => {
      // Normaliser le nom de la table pour Prisma (PascalCase)
      const modelName = this.toPascalCase(tableName);
      
      // Construire les champs du modèle
      const fields: PrismaModelField[] = [];
      
      // Identifier les clés primaires
      const primaryKeys = table.primaryKey || ['id'];
      
      // Traiter chaque colonne
      Object.entries(table.columns).forEach(([columnName, column]) => {
        // Si la colonne est une énumération, l'ajouter à la map
        if (column.isEnum && column.enumValues && column.enumValues.length > 0) {
          const enumName = column.suggestedPrismaType || this.toPascalCase(columnName);
          if (!enumMap[enumName]) {
            enumMap[enumName] = new Set<string>();
          }
          
          column.enumValues.forEach(val => enumMap[enumName].add(val));
        }
        
        // Ajouter le champ au modèle
        fields.push(this.columnToPrismaField(columnName, column, primaryKeys, tableName));
      });
      
      // Ajouter le modèle
      prismaSchema.models.push({
        name: modelName,
        fields,
        comment: `Modèle généré à partir de la table MySQL '${tableName}'`
      });
    });
    
    // Deuxième passe : ajouter les relations
    this.addRelationships(prismaSchema, schema);
    
    // Convertir les énumérations collectées en énumérations Prisma
    for (const [enumName, values] of Object.entries(enumMap)) {
      prismaSchema.enums.push({
        name: enumName,
        values: Array.from(values)
      });
    }
    
    // Générer la chaîne de schéma Prisma
    const prismaSchemaString = this.renderPrismaSchema(prismaSchema);
    
    // Générer des modèles séparés pour chaque table
    const splitModels: Record<string, string> = {};
    
    prismaSchema.models.forEach(model => {
      splitModels[model.name] = this.renderSingleModel(model, prismaSchema.enums);
    });
    
    // Extraire les énumérations sous forme de map
    const enums: Record<string, string[]> = {};
    prismaSchema.enums.forEach(enumDef => {
      enums[enumDef.name] = enumDef.values;
    });
    
    return { 
      prismaSchema: prismaSchemaString, 
      splitModels, 
      enums
    };
  }
  
  /**
   * Convertit un nom snake_case en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
  
  /**
   * Convertit un nom snake_case en camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }
  
  /**
   * Convertit une colonne MySQL en champ Prisma
   */
  private columnToPrismaField(
    columnName: string, 
    column: ColumnInfo, 
    primaryKeys: string[], 
    tableName: string
  ): PrismaModelField {
    const isPrimaryKey = primaryKeys.includes(columnName);
    const fieldName = this.toCamelCase(columnName);
    
    // Déterminer le type Prisma à utiliser
    let fieldType = column.suggestedPrismaType || 'String';
    
    // Attributs du champ
    const attributes: string[] = [];
    
    // Si c'est une clé primaire
    if (isPrimaryKey) {
      attributes.push('@id');
      
      // Si c'est une clé auto-incrémentée
      if (column.extra && column.extra.includes('auto_increment')) {
        attributes.push('@default(autoincrement())');
      }
    }
    
    // Si le champ est une clé étrangère implicite, ne pas l'ajouter maintenant
    // car les relations seront ajoutées dans une seconde passe
    
    // Gérer les valeurs par défaut
    if (column.defaultValue !== null && column.defaultValue !== undefined) {
      if (column.defaultValue === 'CURRENT_TIMESTAMP' || column.defaultValue === 'current_timestamp()') {
        attributes.push('@default(now())');
      } else if (column.defaultValue === 'NULL') {
        // Ne rien faire pour NULL
      } else if (column.type.toUpperCase().includes('INT')) {
        // Valeur numérique
        attributes.push(`@default(${column.defaultValue})`);
      } else {
        // Valeur chaîne de caractères
        // Supprimer les guillemets simples si présents
        const cleanValue = column.defaultValue.replace(/^'|'$/g, '');
        attributes.push(`@default("${cleanValue}")`);
      }
    }
    
    // Gérer les types spéciaux
    if (column.isEnum) {
      // Le type est le nom de l'énumération
      fieldType = column.suggestedPrismaType || this.toPascalCase(columnName);
    }
    
    // Mapper les types spécifiques à PostgreSQL si nécessaire
    if (column.suggestedPostgresType) {
      attributes.push(`@db.${column.suggestedPostgresType}`);
    }
    
    // Rendre le champ nullable si nécessaire
    let fieldTypeWithNullability = fieldType;
    if (column.nullable) {
      fieldTypeWithNullability += '?';
    }
    
    // Créer et retourner le champ
    return {
      name: fieldName,
      type: fieldTypeWithNullability,
      attributes,
      comment: this.generateFieldComment(column, columnName, tableName)
    };
  }
  
  /**
   * Génère un commentaire pour un champ Prisma
   */
  private generateFieldComment(
    column: ColumnInfo, 
    columnName: string, 
    tableName: string
  ): string | undefined {
    const commentParts: string[] = [];
    
    // Ajouter le type MySQL d'origine
    if (column.originalType) {
      commentParts.push(`MySQL: ${column.originalType}`);
    }
    
    // Ajouter des informations sur l'index
    if (column.isIndexed) {
      commentParts.push('Indexé');
    }
    
    // Mentionner si c'est une FK implicite
    if (column.isImplicitForeignKey && column.references) {
      commentParts.push(`FK implicite -> ${column.references.table}.${column.references.column}`);
    }
    
    // Renvoyer le commentaire ou undefined
    return commentParts.length > 0 ? commentParts.join(', ') : undefined;
  }
  
  /**
   * Ajoute les relations entre les modèles Prisma
   */
  private addRelationships(prismaSchema: PrismaSchema, mysqlSchema: MySQLSchema): void {
    // Map des modèles par nom pour un accès facile
    const modelsByName: Record<string, PrismaModel> = {};
    prismaSchema.models.forEach(model => {
      modelsByName[model.name] = model;
    });
    
    // Map des tables MySQL par nom pour un accès facile
    const tablesByName: Record<string, TableInfo> = mysqlSchema.tables;
    
    // Traiter chaque table MySQL
    Object.entries(tablesByName).forEach(([tableName, table]) => {
      const modelName = this.toPascalCase(tableName);
      const model = modelsByName[modelName];
      
      if (!model) return;
      
      // Traiter les relations explicites (foreign keys)
      table.foreignKeys.forEach(fk => {
        const targetModelName = this.toPascalCase(fk.referencedTable);
        const targetModel = modelsByName[targetModelName];
        
        if (!targetModel) return;
        
        // Générer des noms de relation
        const relationName = this.generateRelationName(tableName, fk.referencedTable, fk.columns[0]);
        
        // Ajouter la relation côté source (Many-to-One)
        this.addRelationToModel(
          model,
          targetModel,
          relationName,
          fk.columns,
          fk.referencedColumns,
          'ManyToOne'
        );
        
        // Ajouter la relation inverse côté cible (One-to-Many)
        this.addRelationToModel(
          targetModel,
          model,
          relationName + 's', // Pluraliser la relation inverse
          fk.referencedColumns,
          fk.columns,
          'OneToMany'
        );
      });
      
      // Traiter les relations implicites
      if (table.relations) {
        table.relations.forEach(relation => {
          if (relation.isImplicit) {
            const targetModelName = this.toPascalCase(relation.targetTable);
            const targetModel = modelsByName[targetModelName];
            
            if (!targetModel) return;
            
            // Générer un nom de relation
            const relationName = this.generateRelationName(
              relation.sourceTable, relation.targetTable, relation.sourceColumn);
            
            // Ajouter la relation côté source
            this.addRelationToModel(
              model,
              targetModel,
              relationName,
              [relation.sourceColumn],
              [relation.targetColumn],
              relation.type === 'ONE_TO_ONE' ? 'OneToOne' : 'ManyToOne'
            );
            
            // Ajouter la relation inverse côté cible
            const inverseRelationName = relation.type === 'ONE_TO_ONE' 
              ? relationName 
              : relationName + 's';
              
            this.addRelationToModel(
              targetModel,
              model,
              inverseRelationName,
              [relation.targetColumn],
              [relation.sourceColumn],
              relation.type === 'ONE_TO_ONE' ? 'OneToOne' : 'OneToMany'
            );
          }
        });
      }
    });
  }
  
  /**
   * Génère un nom de relation significatif
   */
  private generateRelationName(
    sourceTable: string, 
    targetTable: string, 
    sourceColumn: string
  ): string {
    // Si la colonne suit la convention id_target ou target_id
    if (sourceColumn === `id_${targetTable}` || sourceColumn === `${targetTable}_id`) {
      return this.toCamelCase(targetTable);
    }
    
    // Si la colonne commence par 'id_'
    if (sourceColumn.startsWith('id_')) {
      return this.toCamelCase(sourceColumn.substring(3));
    }
    
    // Si la colonne se termine par '_id'
    if (sourceColumn.endsWith('_id')) {
      return this.toCamelCase(sourceColumn.substring(0, sourceColumn.length - 3));
    }
    
    // Cas par défaut
    return this.toCamelCase(targetTable);

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';
  }
  
  /**
   * Ajoute une relation à un modèle Prisma
   */
  private addRelationToModel(
    sourceModel: PrismaModel, 
    targetModel: PrismaModel, 
    relationName: string, 
    sourceColumns: string[], 
    targetColumns: string[],
    relationType: 'OneToOne' | 'OneToMany' | 'ManyToOne'
  ): void {
    // Vérifier si la relation existe déjà
    const existingFieldIndex = sourceModel.fields.findIndex(field => 
      field.name === relationName && 
      field.attributes.some(attr => attr.includes('@relation'))
    );
    
    if (existingFieldIndex >= 0) return;
    
    // Préparer l'attribut de relation
    const relationAttr = this.buildRelationAttribute(
      targetModel.name, 
      sourceColumns.map(this.toCamelCase), 
      targetColumns.map(this.toCamelCase)
    );
    
    // Adapter le type selon le type de relation
    let fieldType = targetModel.name;
    if (relationType === 'OneToMany') {
      fieldType = `${targetModel.name}[]`;
    }
    
    // Ajouter le champ de relation au modèle
    sourceModel.fields.push({
      name: relationName,
      type: fieldType,
      attributes: [relationAttr]
    });
    
    // Pour OneToOne et ManyToOne, ajouter aussi les champs de clé étrangère explicitement s'ils n'existent pas déjà
    if (relationType === 'OneToOne' || relationType === 'ManyToOne') {
      sourceColumns.forEach((columnName, index) => {
        const fieldName = this.toCamelCase(columnName);
        
        // Vérifier si le champ existe déjà
        const existingField = sourceModel.fields.find(f => f.name === fieldName);
        if (!existingField) {
          // Déterminer le type en fonction du type de la colonne cible
          const targetColumn = targetColumns[index];
          const targetTable = mysqlSchema.tables[targetModel.name.toLowerCase()];
          
          if (targetTable && targetTable.columns[targetColumn]) {
            const targetColumnInfo = targetTable.columns[targetColumn];
            const fieldType = targetColumnInfo.suggestedPrismaType || 'Int';
            
            // Ajouter le champ FK
            sourceModel.fields.push({
              name: fieldName,
              type: `${fieldType}${targetColumnInfo.nullable ? '?' : ''}`,
              attributes: []
            });
          }
        }
      });
    }
  }
  
  /**
   * Construit un attribut de relation Prisma
   */
  private buildRelationAttribute(
    targetModel: string, 
    sourceFields: string[], 
    targetFields: string[]
  ): string {
    // Format: @relation(fields: [field1, field2], references: [ref1, ref2])
    return `@relation(fields: [${sourceFields.join(', ')}], references: [${targetFields.join(', ')}])`;
  }
  
  /**
   * Génère la chaîne de schéma Prisma complète
   */
  private renderPrismaSchema(schema: PrismaSchema): string {
    // En-tête du schéma
    let output = `// Schéma Prisma généré automatiquement à partir du schéma MySQL
// Généré le ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
    
    // Ajouter les énumérations
    schema.enums.forEach(enumDef => {
      output += `enum ${enumDef.name} {
${enumDef.values.map(value => `  ${value}`).join('\n')}
}

`;
    });
    
    // Ajouter les modèles
    schema.models.forEach(model => {
      output += `model ${model.name} {
${model.fields.map(field => this.renderField(field)).join('\n')}
}

`;
    });
    
    return output;
  }
  
  /**
   * Génère la chaîne d'un modèle Prisma unique
   */
  private renderSingleModel(model: PrismaModel, enums: PrismaEnum[]): string {
    // Trouver les énumérations utilisées par ce modèle
    const usedEnums = new Set<string>();
    model.fields.forEach(field => {
      // Si le type correspond à une énumération connue
      const enumDef = enums.find(e => e.name === field.type || field.type === e.name + '?');
      if (enumDef) {
        usedEnums.add(enumDef.name);
      }
    });
    
    // En-tête du fichier
    let output = `// Modèle Prisma ${model.name} généré automatiquement
// Généré le ${new Date().toISOString()}

`;
    
    // Ajouter les énumérations utilisées
    usedEnums.forEach(enumName => {
      const enumDef = enums.find(e => e.name === enumName);
      if (enumDef) {
        output += `enum ${enumDef.name} {
${enumDef.values.map(value => `  ${value}`).join('\n')}
}

`;
      }
    });
    
    // Ajouter le modèle
    output += `model ${model.name} {
${model.fields.map(field => this.renderField(field)).join('\n')}
}
`;
    
    return output;
  }
  
  /**
   * Génère la chaîne d'un champ Prisma
   */
  private renderField(field: PrismaModelField): string {
    let output = `  ${field.name} ${field.type}`;
    
    // Ajouter les attributs
    if (field.attributes.length > 0) {
      output += ` ${field.attributes.join(' ')}`;
    }
    
    // Ajouter un commentaire si présent
    if (field.comment) {
      output += ` // ${field.comment}`;
    }
    
    return output;
  }
}