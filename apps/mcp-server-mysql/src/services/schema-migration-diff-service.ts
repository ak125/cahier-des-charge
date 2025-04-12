/**
 * Service de comparaison de schémas entre MySQL et Prisma
 * Ce service permet de générer un rapport de différences entre un schéma MySQL
 * et un schéma Prisma pour faciliter la migration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TableInfo, ColumnInfo } from './types';

/**
 * Interface pour la cartographie du schéma MySQL
 */
export interface SchemaMap {
  tables: TableInfo[];
  databaseName: string;
  version: string;
  exportDate: string;
  dialect: string;
}

/**
 * Interface pour les différences de schéma
 */
interface SchemaDiff {
  version_source: string;
  version_target: string;
  tables: TableDiff[];
  timestamp: string;
}

/**
 * Interface pour les différences au niveau des tables
 */
interface TableDiff {
  name: string;
  changes: ColumnDiff[];
  missing_in_target?: string[];
  missing_in_source?: string[];
  relation_changes?: RelationDiff[];
}

/**
 * Interface pour les différences au niveau des colonnes
 */
interface ColumnDiff {
  column: string;
  from: string;
  to: string;
  reason: string;
}

/**
 * Interface pour les différences au niveau des relations
 */
interface RelationDiff {
  name: string;
  from: string;
  to: string;
  reason: string;
}

/**
 * Classe pour la comparaison de schémas entre MySQL et Prisma
 */
export class SchemaMigrationDiffService {
  /**
   * Compare un schéma MySQL à un schéma Prisma et génère un rapport de différences
   * @param mySqlSchemaPath Chemin vers le fichier de cartographie du schéma MySQL
   * @param prismaSchemaPath Chemin vers le fichier schema.prisma
   * @param outputPath Chemin où sauvegarder le rapport de différences
   */
  async compareMySqlWithPrisma(
    mySqlSchemaPath: string,
    prismaSchemaPath: string,
    outputPath: string
  ): Promise<void> {
    try {
      console.log('Chargement des schémas...');
      
      // Charger le schéma MySQL
      const mySqlSchemaContent = await fs.readFile(mySqlSchemaPath, 'utf8');
      const mySqlSchema: SchemaMap = JSON.parse(mySqlSchemaContent);
      
      // Charger le schéma Prisma
      const prismaSchemaContent = await fs.readFile(prismaSchemaPath, 'utf8');
      
      // Analyser le schéma Prisma
      const prismaModels = this.parsePrismaSchema(prismaSchemaContent);
      
      console.log(`Comparaison de ${mySqlSchema.tables.length} tables MySQL avec ${Object.keys(prismaModels).length} modèles Prisma...`);
      
      // Initialiser la structure de différences
      const schemaDiff: SchemaDiff = {
        version_source: `MySQL_${mySqlSchema.version}`,
        version_target: 'Prisma_v1',
        tables: [],
        timestamp: new Date().toISOString(),
      };
      
      // Comparer chaque table MySQL avec son modèle Prisma correspondant
      for (const table of mySqlSchema.tables) {
        // Convertir le nom de la table en PascalCase pour correspondre à la convention Prisma
        const modelName = this.toPascalCase(table.name);
        const prismaModel = prismaModels[modelName];
        
        const tableDiff: TableDiff = {
          name: table.name,
          changes: [],
        };
        
        if (prismaModel) {
          // Comparer les colonnes
          for (const column of table.columns) {
            const mysqlType = column.type;
            const fieldName = column.name;
            const prismaField = prismaModel.fields[fieldName];
            
            if (prismaField) {
              // Si le type a été transformé
              if (this.getMySqlTypeName(mysqlType) !== prismaField.type) {
                tableDiff.changes.push({
                  column: fieldName,
                  from: mysqlType,
                  to: prismaField.type,
                  reason: 'Conversion SQL → Prisma',
                });
              }
              
              // Vérifier les changements de nullabilité
              if (column.nullable !== prismaField.optional) {
                tableDiff.changes.push({
                  column: fieldName,
                  from: column.nullable ? 'NULL' : 'NOT NULL',
                  to: prismaField.optional ? 'Optional' : 'Required',
                  reason: 'Modification contrainte de nullabilité',
                });
              }
            } else {
              // Colonne présente dans MySQL mais absente dans Prisma
              tableDiff.missing_in_target = tableDiff.missing_in_target || [];
              tableDiff.missing_in_target.push(fieldName);
            }
          }
          
          // Vérifier s'il y a des champs dans Prisma qui n'existent pas dans MySQL
          const mySqlColumnNames = table.columns.map(col => col.name);
          const missingInSource = Object.keys(prismaModel.fields).filter(fieldName => 
            !mySqlColumnNames.includes(fieldName) && 
            !fieldName.startsWith('_')  // Ignorer les champs relationnels ajoutés par Prisma
          );
          
          if (missingInSource.length > 0) {
            tableDiff.missing_in_source = missingInSource;
          }
          
          // Comparer les relations
          if (table.relations) {
            tableDiff.relation_changes = [];
            
            for (const relation of table.relations) {
              const targetModelName = this.toPascalCase(relation.target);
              const relationFieldName = relation.target.toLowerCase();
              
              // Vérifier si la relation existe dans le modèle Prisma
              const hasRelationInPrisma = Object.values(prismaModel.fields).some(field => 
                field.relation && field.relation.references === targetModelName
              );
              
              if (!hasRelationInPrisma) {
                tableDiff.relation_changes.push({
                  name: relation.name,
                  from: `${table.name}.${relation.field} -> ${relation.target}.${relation.targetField}`,
                  to: 'Relation absente',
                  reason: 'Relation manquante dans Prisma',
                });
              }
            }
            
            // Supprimer le tableau des relations s'il est vide
            if (tableDiff.relation_changes.length === 0) {
              delete tableDiff.relation_changes;
            }
          }
        } else {
          // La table n'existe pas dans le schéma Prisma
          tableDiff.changes.push({
            column: '*',
            from: 'Table entière',
            to: 'Absente',
            reason: 'Table manquante dans Prisma',
          });
        }
        
        // Ajouter la différence de table si elle contient des changements
        if (tableDiff.changes.length > 0 || 
            tableDiff.missing_in_target || 
            tableDiff.missing_in_source || 
            tableDiff.relation_changes) {
          schemaDiff.tables.push(tableDiff);
        }
      }
      
      // Vérifier s'il y a des modèles Prisma qui n'existent pas dans MySQL
      const mySqlTableNames = mySqlSchema.tables.map(table => this.toPascalCase(table.name));
      const missingTables = Object.keys(prismaModels).filter(modelName => 
        !mySqlTableNames.includes(modelName)
      );
      
      for (const missingTable of missingTables) {
        schemaDiff.tables.push({
          name: this.toSnakeCase(missingTable),
          changes: [
            {
              column: '*',
              from: 'Absente',
              to: 'Nouvelle table',
              reason: 'Table ajoutée dans Prisma',
            }
          ],
        });
      }
      
      // Sauvegarder le rapport de différences
      await fs.writeFile(outputPath, JSON.stringify(schemaDiff, null, 2), 'utf8');
      
      console.log(`Comparaison terminée. ${schemaDiff.tables.length} tables ont des différences.`);
    } catch (error) {
      console.error('Erreur lors de la comparaison des schémas:', error);
      throw error;
    }
  }

  /**
   * Analyse un schéma Prisma pour extraire les informations des modèles
   * @param prismaSchema Contenu du fichier schema.prisma
   * @returns Modèles Prisma extraits
   */
  private parsePrismaSchema(prismaSchema: string): Record<string, { fields: Record<string, any> }> {
    const models: Record<string, { fields: Record<string, any> }> = {};
    
    // Utiliser une expression régulière pour extraire les blocs de modèle
    const modelRegex = /model\s+(\w+)\s+{([^}]*)}/gs;
    let modelMatch;
    
    while ((modelMatch = modelRegex.exec(prismaSchema)) !== null) {
      const modelName = modelMatch[1];
      const modelBody = modelMatch[2];
      
      const fields: Record<string, any> = {};
      
      // Extraire les champs
      const fieldRegex = /\s*(\w+)\s+(\w+)(\??)\s*(?:@([^)]*)\))?/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const isOptional = fieldMatch[3] === '?';
        const attributes = fieldMatch[4] || '';
        
        const field: any = {
          type: fieldType,
          optional: isOptional,
        };
        
        // Extraire les relations
        if (attributes.includes('@relation')) {
          const relationMatch = /@relation\s*\(\s*fields:\s*\[([^\]]+)\]\s*,\s*references:\s*\[([^\]]+)\]\s*(?:,\s*([^)]*))?\)/i.exec(attributes);
          
          if (relationMatch) {
            field.relation = {
              fields: relationMatch[1].split(',').map(f => f.trim()),
              references: relationMatch[2].split(',').map(f => f.trim()),
              options: relationMatch[3] ? relationMatch[3].trim() : undefined,
            };
          }
        }
        
        fields[fieldName] = field;
      }
      
      models[modelName] = { fields };
    }
    
    return models;
  }

  /**
   * Convertit une chaîne en PascalCase
   * @param str Chaîne à convertir
   * @returns Chaîne convertie en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convertit une chaîne en snake_case
   * @param str Chaîne à convertir
   * @returns Chaîne convertie en snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  /**
   * Extrait le nom du type MySQL à partir d'une définition complète
   * @param mysqlType Type MySQL complet (ex: varchar(255))
   * @returns Nom du type MySQL (ex: varchar)
   */
  private getMySqlTypeName(mysqlType: string): string {
    const match = /^(\w+)(?:\(.*\))?/.exec(mysqlType);
    return match ? match[1].toUpperCase() : mysqlType.toUpperCase();
  }
}