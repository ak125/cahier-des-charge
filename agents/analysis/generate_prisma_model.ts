/**
 * generate_prisma_model.ts
 * Script optionnel pour l'Agent 4 - Typage Avancé & Mapping PostgreSQL / Prisma
 * 
 * Génère automatiquement un modèle Prisma à partir du mapping de types
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface TypeMapping {
  [tableColumn: string]: {
    mysql: string;
    postgres: string;
    prisma: string;
    warning?: string;
    custom?: boolean;
    originalLength?: number;
    originalPrecision?: number;
    originalScale?: number;
    originalUnsigned?: boolean;
    recommendation?: string;
  };
}

interface Table {
  name: string;
  columns: Column[];
  relations: Relation[];
  enums: EnumSuggestion[];
}

interface Column {
  name: string;
  prismaType: string;
  isId: boolean;
  isRequired: boolean;
  comment?: string;
}

interface Relation {
  name: string;
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  relationField: string;
  fromField: string;
  toField: string;
  toTable: string;
}

interface EnumSuggestion {
  name: string;
  values: string[];
  columnName: string;
}

interface ForeignKey {
  table: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

class PrismaModelGenerator {
  private typeMappings: TypeMapping = {};
  private tables: Record<string, Table> = {};
  private foreignKeys: ForeignKey[] = [];
  private enumSuggestions: EnumSuggestion[] = [];
  private relationTables: Set<string> = new Set();
  private logger: Console;

  constructor(
    private typeMappingPath: string,
    private schemaRawPath: string,
    private outputPath: string,
    logger = console
  ) {
    this.logger = logger;
  }

  /**
   * Charge le mapping de types depuis un fichier JSON
   */
  async loadTypeMapping(): Promise<void> {
    try {
      const content = await readFile(this.typeMappingPath, 'utf8');
      this.typeMappings = JSON.parse(content);
      this.logger.info(`Mapping de types chargé depuis ${this.typeMappingPath}`);
    } catch (error) {
      this.logger.error(`Erreur lors du chargement du mapping de types: ${error}`);
      throw error;
    }
  }

  /**
   * Charge les données brutes du schéma
   */
  async loadSchemaRaw(): Promise<void> {
    try {
      const content = await readFile(this.schemaRawPath, 'utf8');
      const schemaRaw = JSON.parse(content);
      
      // Extraire les clés étrangères et autres métadonnées depuis le schéma
      if (schemaRaw.tables) {
        for (const tableName in schemaRaw.tables) {
          const tableData = schemaRaw.tables[tableName];
          
          if (tableData.foreignKeys) {
            for (const fk of tableData.foreignKeys) {
              this.foreignKeys.push({
                table: tableName,
                column: fk.column,
                references: {
                  table: fk.references.table,
                  column: fk.references.column
                },
                onDelete: fk.onDelete || 'NO ACTION',
                onUpdate: fk.onUpdate || 'NO ACTION'
              });
            }
          }
        }
      }
      
      this.logger.info(`Schéma brut chargé depuis ${this.schemaRawPath}`);
      this.logger.info(`Trouvé ${this.foreignKeys.length} clés étrangères`);
    } catch (error) {
      this.logger.error(`Erreur lors du chargement du schéma brut: ${error}`);
      // Continuer même si on ne peut pas charger le schéma brut - nous pouvons travailler
      // avec seulement le mapping de types, mais sans les relations
    }
  }

  /**
   * Traite le mapping de types pour extraire les tables et colonnes
   */
  processTypeMapping(): void {
    // Étape 1: Extraire toutes les tables et colonnes
    for (const tableColumn in this.typeMappings) {
      const [tableName, columnName] = tableColumn.split('.');
      const mapping = this.typeMappings[tableColumn];
      
      // Créer la table si elle n'existe pas encore
      if (!this.tables[tableName]) {
        this.tables[tableName] = {
          name: tableName,
          columns: [],
          relations: [],
          enums: []
        };
      }
      
      // Ajouter la colonne
      const isId = mapping.prisma.includes('@id');
      const isRequired = !mapping.prisma.includes('?');
      
      this.tables[tableName].columns.push({
        name: columnName,
        prismaType: this.cleanPrismaType(mapping.prisma),
        isId,
        isRequired
      });
      
      // Détecter les suggestions d'énumérations
      if (mapping.warning && 
          (mapping.warning.includes('ENUM') || 
           mapping.recommendation?.includes('enum Prisma'))) {
        
        // Essayer d'extraire les valeurs d'énumération
        const enumMatch = mapping.mysql.match(/ENUM\('([^']+)'(?:,'([^']+)')*\)/);
        if (enumMatch) {
          // Extraire les valeurs d'énumération
          const enumValues = mapping.mysql
            .match(/ENUM\(([^)]+)\)/)?.[1]
            .split(',')
            .map(val => val.trim().replace(/'/g, '')) || [];
          
          const enumName = this.formatEnumName(tableName, columnName);
          
          this.enumSuggestions.push({
            name: enumName,
            values: enumValues,
            columnName: columnName
          });
          
          // Ajouter l'énumération à la table
          this.tables[tableName].enums.push({
            name: enumName,
            values: enumValues,
            columnName: columnName
          });
        } else if (mapping.recommendation?.includes('enum Prisma')) {
          // Essayer d'extraire le nom de l'enum et les valeurs depuis la recommandation
          const enumDefMatch = mapping.recommendation.match(/enum ([a-zA-Z0-9_]+) \{ ([^}]+) \}/);
          if (enumDefMatch) {
            const enumName = enumDefMatch[1];
            const enumValues = enumDefMatch[2].trim().split(' ');
            
            this.enumSuggestions.push({
              name: enumName,
              values: enumValues,
              columnName: columnName
            });
            
            // Ajouter l'énumération à la table
            this.tables[tableName].enums.push({
              name: enumName,
              values: enumValues,
              columnName: columnName
            });
          }
        }
      } else if (mapping.warning?.includes('Candidat potentiel pour ENUM')) {
        // Candidat potentiel pour enum, mais sans valeurs définies
        const enumName = this.formatEnumName(tableName, columnName);
        
        this.enumSuggestions.push({
          name: enumName,
          values: ['PLACEHOLDER1', 'PLACEHOLDER2', 'PLACEHOLDER3'],
          columnName: columnName
        });
        
        // Ajouter l'énumération à la table
        this.tables[tableName].enums.push({
          name: enumName,
          values: ['PLACEHOLDER1', 'PLACEHOLDER2', 'PLACEHOLDER3'],
          columnName: columnName
        });
      }
    }
    
    // Étape 2: Détecter les tables de relation (ManyToMany)
    this.detectRelationTables();
    
    // Étape 3: Gérer les relations
    this.processRelations();
    
    this.logger.info(`Traitement terminé. ${Object.keys(this.tables).length} tables trouvées`);
    this.logger.info(`${this.enumSuggestions.length} suggestions d'énumérations trouvées`);
    this.logger.info(`${this.relationTables.size} tables de relation détectées`);
  }

  /**
   * Détecte les tables qui semblent être des tables de relation many-to-many
   */
  private detectRelationTables(): void {
    // Recherche des tables qui ont principalement des clés étrangères
    // et pas beaucoup d'autres colonnes
    
    for (const tableName in this.tables) {
      const table = this.tables[tableName];
      const fkColumns = this.foreignKeys
        .filter(fk => fk.table === tableName)
        .map(fk => fk.column);
      
      // Si la table a au moins 2 FK et que presque toutes ses colonnes sont des FK
      // (en permettant une colonne d'ID et quelques métadonnées comme created_at)
      const nonIdColumns = table.columns.filter(col => !col.isId).length;
      
      if (fkColumns.length >= 2 && fkColumns.length >= nonIdColumns - 1) {
        // C'est probablement une table de relation N:M
        this.relationTables.add(tableName);
      }
    }
  }

  /**
   * Traite les relations entre les tables
   */
  private processRelations(): void {
    // Traiter les clés étrangères pour définir les relations
    for (const fk of this.foreignKeys) {
      const { table: fromTable, column: fromColumn } = fk;
      const { table: toTable, column: toColumn } = fk.references;
      
      // Ignorer si l'une des tables n'existe pas dans notre mapping
      if (!this.tables[fromTable] || !this.tables[toTable]) {
        continue;
      }
      
      // Détecter le type de relation
      if (this.relationTables.has(fromTable)) {
        // Si c'est une table de relation, cela devient une relation many-to-many
        // Nous ajoutons la relation aux deux tables référencées
        
        // Trouver l'autre FK dans cette table de relation
        const otherFks = this.foreignKeys.filter(
          otherFk => otherFk.table === fromTable && otherFk.column !== fromColumn
        );
        
        if (otherFks.length > 0) {
          // Pour chaque autre FK dans la table de relation
          for (const otherFk of otherFks) {
            const otherTable = otherFk.references.table;
            
            if (!this.tables[otherTable]) {
              continue;
            }
            
            // Ajouter une relation many-to-many entre toTable et otherTable via fromTable
            const relationName = this.camelCase(otherTable);
            const selfRelationName = this.camelCase(toTable) + 's';
            
            // Ajouter la relation à toTable
            this.tables[toTable].relations.push({
              name: relationName + 's', // pluriel
              type: 'manyToMany',
              relationField: selfRelationName,
              fromField: toColumn,
              toField: otherFk.references.column,
              toTable: otherTable
            });
            
            // Ajouter la relation inverse à otherTable
            this.tables[otherTable].relations.push({
              name: selfRelationName,
              type: 'manyToMany',
              relationField: relationName + 's',
              fromField: otherFk.references.column,
              toField: toColumn,
              toTable: toTable
            });
          }
        }
      } else {
        // Relation one-to-many standard
        const relationName = this.camelCase(toTable);
        const inverseRelationName = this.camelCase(fromTable) + 's'; // pluriel
        
        // Ajouter la relation many-to-one dans la table avec la FK
        this.tables[fromTable].relations.push({
          name: relationName,
          type: 'manyToOne',
          relationField: inverseRelationName,
          fromField: fromColumn,
          toField: toColumn,
          toTable: toTable
        });
        
        // Ajouter la relation inverse one-to-many dans l'autre table
        this.tables[toTable].relations.push({
          name: inverseRelationName,
          type: 'oneToMany',
          relationField: relationName,
          fromField: toColumn,
          toField: fromColumn,
          toTable: fromTable
        });
      }
    }
  }

  /**
   * Nettoie un type Prisma en retirant les annotations
   */
  private cleanPrismaType(prismaType: string): string {
    // Retire toutes les annotations Prisma (après le premier @)
    return prismaType.split('@')[0].trim();
  }

  /**
   * Formate un nom d'enum selon les conventions
   */
  private formatEnumName(tableName: string, columnName: string): string {
    return this.pascalCase(tableName) + this.pascalCase(columnName) + 'Enum';
  }

  /**
   * Convertit un texte en PascalCase
   */
  private pascalCase(text: string): string {
    return text
      .split(/[_\s-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convertit un texte en camelCase
   */
  private camelCase(text: string): string {
    const pascal = this.pascalCase(text);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Génère le contenu du modèle Prisma
   */
  generatePrismaModel(): string {
    let prismaContent = `// Prisma schema généré automatiquement par generate_prisma_model.ts
// Généré le ${new Date().toISOString()}
// Basé sur le mapping de types depuis ${path.basename(this.typeMappingPath)}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;

    // Ajouter les définitions d'enum
    const uniqueEnums = new Map<string, EnumSuggestion>();
    
    for (const suggestion of this.enumSuggestions) {
      uniqueEnums.set(suggestion.name, suggestion);
    }
    
    for (const [enumName, suggestion] of uniqueEnums.entries()) {
      prismaContent += `enum ${enumName} {\n`;
      for (const value of suggestion.values) {
        prismaContent += `  ${value}\n`;
      }
      prismaContent += `}\n\n`;
    }
    
    // Ajouter les modèles (filtrer les tables de relation qui seront implicites via les relations many-to-many)
    for (const tableName in this.tables) {
      // Ignorer les tables de relation M:M qui seront définies implicitement par Prisma
      if (this.relationTables.has(tableName)) {
        continue;
      }
      
      const table = this.tables[tableName];
      
      prismaContent += `model ${this.pascalCase(tableName)} {\n`;
      
      // Ajouter les colonnes
      for (const column of table.columns) {
        let columnDef = `  ${column.name} `;
        
        // Chercher si cette colonne a une définition d'enum
        const enumDef = table.enums.find(e => e.columnName === column.name);
        
        if (enumDef) {
          // Utiliser le type enum au lieu du type standard
          columnDef += `${enumDef.name}`;
          if (!column.isRequired) {
            columnDef += '?';
          }
        } else {
          // Utiliser le type standard
          columnDef += column.prismaType;
        }
        
        // Ajouter les attributs Prisma depuis le mapping
        const mapping = this.typeMappings[`${tableName}.${column.name}`];
        if (mapping) {
          const attrs = mapping.prisma.split('@').slice(1);
          if (attrs.length > 0) {
            for (const attr of attrs) {
              columnDef += ` @${attr.trim()}`;
            }
          }
        }
        
        prismaContent += `${columnDef}\n`;
      }
      
      // Ajouter les relations
      for (const relation of table.relations) {
        if (relation.type === 'oneToMany') {
          prismaContent += `  ${relation.name} ${this.pascalCase(relation.toTable)}[] @relation("${relation.name}")\n`;
        } else if (relation.type === 'manyToOne') {
          const referencedTable = this.tables[relation.toTable];
          const referencedColumn = referencedTable?.columns.find(c => c.name === relation.toField);
          
          prismaContent += `  ${relation.name} ${this.pascalCase(relation.toTable)} @relation("${relation.relationField}", fields: [${relation.fromField}], references: [${relation.toField}])\n`;
        } else if (relation.type === 'manyToMany') {
          prismaContent += `  ${relation.name} ${this.pascalCase(relation.toTable)}[] @relation("${relation.name}")\n`;
        }
      }
      
      // Ajouter un index sur les colonnes FK
      const fkColumns = table.relations
        .filter(rel => rel.type === 'manyToOne')
        .map(rel => rel.fromField);
      
      if (fkColumns.length > 0) {
        prismaContent += '\n  @@index([' + fkColumns.join(', ') + '])\n';
      }
      
      prismaContent += '}\n\n';
    }
    
    return prismaContent;
  }

  /**
   * Exécute la génération complète
   */
  async generate(): Promise<void> {
    try {
      await this.loadTypeMapping();
      await this.loadSchemaRaw();
      this.processTypeMapping();
      
      const prismaModel = this.generatePrismaModel();
      
      // Créer le répertoire de sortie si nécessaire
      const outputDir = path.dirname(this.outputPath);
      try {
        await mkdir(outputDir, { recursive: true });
      } catch (error) {
        // Ignorer si le répertoire existe déjà
      }
      
      // Écrire le modèle Prisma
      await writeFile(this.outputPath, prismaModel, 'utf8');
      
      this.logger.info(`Modèle Prisma généré avec succès dans ${this.outputPath}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du modèle Prisma: ${error}`);
      throw error;
    }
  }
}

/**
 * Point d'entrée pour l'exécution à partir de la ligne de commande
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const typeMappingPath = args.find(arg => arg.startsWith('--mapping='))?.split('=')[1] || './reports/type_mapping.json';
    const schemaRawPath = args.find(arg => arg.startsWith('--schema='))?.split('=')[1] || './reports/schema_raw.json';
    const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || './reports/schema.prisma';
    
    console.log(`🧠 Démarrage de la génération du modèle Prisma...`);
    console.log(`📁 Mapping de types: ${typeMappingPath}`);
    console.log(`📁 Schéma brut: ${schemaRawPath}`);
    console.log(`📁 Sortie: ${outputPath}`);
    
    const generator = new PrismaModelGenerator(typeMappingPath, schemaRawPath, outputPath);
    await generator.generate();
    
    console.log(`✅ Modèle Prisma généré avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du modèle Prisma: ${error}`);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé)
if (require.main === module) {
  main();
}

export { PrismaModelGenerator };