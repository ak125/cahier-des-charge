import * as fs from 'fs';
import * as path from 'path';

/**
 * Agent de synchronisation des données entre PHP, SQL et Prisma
 * Crée les mappings nécessaires pour la migration cohérente
 */

interface SyncMapperConfig {
  phpSourcePaths: string[];
  sqlDumpPath: string;
  prismaSchemaPath: string;
  transformationDetection: boolean;
  validateRelationships: boolean;
  outputDir: string;
}

interface TableMapping {
  sourceTable: string;
  targetModel: string;
  fields: FieldMapping[];
}

interface FieldMapping {
  source: string;
  target: string;
  type: 'direct' | 'transform' | 'computed';
  transformation?: string;
  computeFunction?: string;
}

interface RelationshipMapping {
  sourceTable: string;
  targetModel: string;
  relation: 'belongsTo' | 'hasMany' | 'manyToMany';
  sourceField: string;
  targetField: string;
}

interface MigrationPatch {
  tables: TableMapping[];
  relationships: RelationshipMapping[];
}

interface PhpSqlLink {
  phpEntities: PhpEntity[];
}

interface PhpEntity {
  file: string;
  variables: PhpVariable[];
  methods: PhpMethod[];
}

interface PhpVariable {
  name: string;
  sqlTable?: string;
  sqlColumn?: string;
  accessPatterns: string[];
  validations: string[];
}

interface PhpMethod {
  name: string;
  sqlTables?: string[];
  dataMutations?: boolean;
}

class SyncMapper {
  private config: SyncMapperConfig;
  private migrationPatch: MigrationPatch = { tables: [], relationships: [] };
  private phpSqlLinks: PhpSqlLink = { phpEntities: [] };

  constructor(config: SyncMapperConfig) {
    this.config = config;

    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Exécute le processus de synchronisation complet
   */
  public async generateMappings(): Promise<void> {
    console.log('🔄 Démarrage de la génération des mappings de synchronisation...');

    try {
      // Analyser le schéma SQL
      const sqlTables = await this.parseSqlDump();
      console.log(`📊 ${sqlTables.length} tables SQL analysées`);

      // Analyser le schéma Prisma
      const prismaModels = await this.parsePrismaSchema();
      console.log(`📊 ${prismaModels.length} modèles Prisma analysés`);

      // Analyser le code PHP pour les relations entre variables et SQL
      const phpEntities = await this.analyzePhpCode();
      console.log(`📊 ${phpEntities.length} entités PHP analysées`);

      // Générer les mappings de migration
      await this.generateMigrationPatch(sqlTables, prismaModels);

      // Générer les liens PHP-SQL
      await this.generatePhpSqlLinks(phpEntities, sqlTables);

      // Écrire les fichiers de sortie
      this.writeMappingFiles();

      console.log('✅ Génération des mappings terminée avec succès.');
    } catch (error) {
      console.error('❌ Erreur lors de la génération des mappings:', error);
      process.exit(1);
    }
  }

  /**
   * Analyse le dump SQL pour extraire les structures de tables
   */
  private async parseSqlDump(): Promise<any[]> {
    console.log(`👉 Analyse du dump SQL: ${this.config.sqlDumpPath}`);

    // Dans un cas réel, cette fonction utiliserait un parser SQL propre
    // Ici, on utilise une implémentation simplifiée

    // Vérifier si le fichier existe
    if (!fs.existsSync(this.config.sqlDumpPath)) {
      throw new Error(`Le fichier SQL ${this.config.sqlDumpPath} n'existe pas.`);
    }

    const sqlContent = fs.readFileSync(this.config.sqlDumpPath, 'utf8');

    // Utiliser des expressions régulières pour extraire la structure des tables
    // Note: Ceci est une approche simplifiée pour l'exemple, pas robuste pour tous les cas
    const tableRegex = /CREATE\s+TABLE\s+`(\w+)`\s*\(([\s\S]*?)\)\s*ENGINE/g;
    const columnRegex = /`(\w+)`\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/g;

    const tables = [];
    let tableMatch;

    while ((tableMatch = tableRegex.exec(sqlContent)) !== null) {
      const tableName = tableMatch[1];
      const columnsDefinition = tableMatch[2];

      const columns = [];
      let columnMatch;

      while ((columnMatch = columnRegex.exec(columnsDefinition)) !== null) {
        columns.push({
          name: columnMatch[1],
          type: columnMatch[2],
          length: columnMatch[3] ? parseInt(columnMatch[3]) : null,
        });
      }

      tables.push({
        name: tableName,
        columns,
      });
    }

    return tables;
  }

  /**
   * Analyse le schéma Prisma pour extraire les modèles
   */
  private async parsePrismaSchema(): Promise<any[]> {
    console.log(`👉 Analyse du schéma Prisma: ${this.config.prismaSchemaPath}`);

    // Vérifier si le fichier existe
    if (!fs.existsSync(this.config.prismaSchemaPath)) {
      throw new Error(`Le fichier Prisma ${this.config.prismaSchemaPath} n'existe pas.`);
    }

    const prismaContent = fs.readFileSync(this.config.prismaSchemaPath, 'utf8');

    // Utiliser des expressions régulières pour extraire les modèles
    // Note: Approche simplifiée, un parser Prisma propre serait préférable
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
    const fieldRegex = /(\w+)\s+(\w+)(?:\(\))?(?:\?)?\s*(?:@\w+(?:\([^)]*\))?)?/g;

    const models = [];
    let modelMatch;

    while ((modelMatch = modelRegex.exec(prismaContent)) !== null) {
      const modelName = modelMatch[1];
      const fieldsDefinition = modelMatch[2];

      const fields = [];
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(fieldsDefinition)) !== null) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2],
        });
      }

      models.push({
        name: modelName,
        fields,
      });
    }

    return models;
  }

  /**
   * Analyse le code PHP pour identifier les relations avec SQL
   */
  private async analyzePhpCode(): Promise<PhpEntity[]> {
    console.log('👉 Analyse du code PHP...');

    const entities: PhpEntity[] = [];

    // Parcourir tous les chemins source PHP
    for (const sourcePath of this.config.phpSourcePaths) {
      // Dans un cas réel, on utiliserait un parser PHP comme php-parser
      // Pour cet exemple, on va juste simuler les résultats

      // Entité simulée 1
      entities.push({
        file: path.join(sourcePath, 'user.class.php'),
        variables: [
          {
            name: '$username',
            sqlTable: 'users',
            sqlColumn: 'user_name',
            accessPatterns: ['get', 'set'],
            validations: ['notEmpty', 'maxLength:255'],
          },
          {
            name: '$email',
            sqlTable: 'users',
            sqlColumn: 'user_email',
            accessPatterns: ['get', 'set'],
            validations: ['notEmpty', 'email'],
          },
        ],
        methods: [
          {
            name: 'getUserProfile',
            sqlTables: ['users', 'user_profiles'],
            dataMutations: true,
          },
          {
            name: 'authenticate',
            sqlTables: ['users'],
            dataMutations: false,
          },
        ],
      });

      // Entité simulée 2
      entities.push({
        file: path.join(sourcePath, 'product.class.php'),
        variables: [
          {
            name: '$productName',
            sqlTable: 'products',
            sqlColumn: 'product_name',
            accessPatterns: ['get', 'set'],
            validations: ['notEmpty'],
          },
          {
            name: '$price',
            sqlTable: 'products',
            sqlColumn: 'price',
            accessPatterns: ['get', 'set'],
            validations: ['numeric', 'positive'],
          },
        ],
        methods: [
          {
            name: 'getProductDetails',
            sqlTables: ['products', 'product_categories'],
            dataMutations: false,
          },
        ],
      });
    }

    return entities;
  }

  /**
   * Génère le patch de migration à partir des analyses
   */
  private async generateMigrationPatch(sqlTables: any[], prismaModels: any[]): Promise<void> {
    console.log('👉 Génération du patch de migration...');

    // Créer un mapping pour chaque table SQL vers un modèle Prisma
    for (const table of sqlTables) {
      // Trouver le modèle Prisma correspondant (par convention de nommage)
      // Dans un cas réel, on utiliserait une logique plus sophistiquée ou une configuration manuelle
      const modelName = this.toPascalCase(table.name); // users → Users
      const model = prismaModels.find((m) => m.name === modelName);

      if (!model) {
        console.warn(`⚠️ Pas de modèle Prisma trouvé pour la table ${table.name}.`);
        continue;
      }

      const tableMapping: TableMapping = {
        sourceTable: table.name,
        targetModel: model.name,
        fields: [],
      };

      // Mapper les colonnes de la table aux champs du modèle
      for (const column of table.columns) {
        // Convertir le nom de colonne snake_case en camelCase pour Prisma
        const fieldName = this.toCamelCase(column.name);
        const field = model.fields.find((f) => f.name === fieldName);

        if (field) {
          // Déterminer le type de mapping
          let mappingType: 'direct' | 'transform' | 'computed' = 'direct';
          let transformation: string | undefined;

          // Règles de transformation simplifiées
          if (column.type === 'datetime' && field.type === 'DateTime') {
            mappingType = 'transform';
            transformation = 'DATE_TO_ISO';
          } else if (column.type === 'tinyint' && field.type === 'Boolean') {
            mappingType = 'transform';
            transformation = 'TINYINT_TO_BOOLEAN';
          }

          tableMapping.fields.push({
            source: column.name,
            target: field.name,
            type: mappingType,
            transformation,
          });
        } else {
          console.warn(
            `⚠️ Pas de champ correspondant à ${column.name} dans le modèle ${model.name}.`
          );
        }
      }

      this.migrationPatch.tables.push(tableMapping);
    }

    // Détecter et ajouter les relations
    if (this.config.validateRelationships) {
      this.detectRelationships(sqlTables, prismaModels);
    }
  }

  /**
   * Détecte les relations entre tables et les ajoute au patch de migration
   */
  private detectRelationships(sqlTables: any[], prismaModels: any[]): void {
    console.log('👉 Détection des relations...');

    // Rechercher les clés étrangères potentielles (simplifiée pour l'exemple)
    for (const table of sqlTables) {
      // Chercher des colonnes qui semblent être des clés étrangères (ex: user_id)
      for (const column of table.columns) {
        if (column.name.endsWith('_id')) {
          // Extraire le nom de table potentiel (ex: user_id → users)
          const referencedTableName = column.name.replace('_id', '');
          const pluralTableName = `${referencedTableName}s`; // Simpliste, mais pour l'exemple

          // Vérifier si cette table existe
          const referencedTable = sqlTables.find(
            (t) => t.name === referencedTableName || t.name === pluralTableName
          );

          if (referencedTable) {
            // Trouver les modèles Prisma correspondants
            const sourceModel = this.toPascalCase(table.name);
            const targetModel = this.toPascalCase(referencedTable.name);

            // Ajouter la relation
            this.migrationPatch.relationships.push({
              sourceTable: table.name,
              targetModel: targetModel,
              relation: 'belongsTo',
              sourceField: column.name,
              targetField: 'id', // Supposer que la clé primaire est 'id'
            });
          }
        }
      }
    }
  }

  /**
   * Génère les liens entre PHP et SQL à partir des analyses
   */
  private async generatePhpSqlLinks(phpEntities: PhpEntity[], sqlTables: any[]): Promise<void> {
    console.log('👉 Génération des liens PHP-SQL...');

    // Copier directement les entités PHP analysées
    this.phpSqlLinks.phpEntities = phpEntities;
  }

  /**
   * Écrit les fichiers de mapping finaux
   */
  private writeMappingFiles(): void {
    // Écrire le patch de migration
    const migrationPatchPath = path.join(this.config.outputDir, 'migration_patch.json');
    fs.writeFileSync(migrationPatchPath, JSON.stringify(this.migrationPatch, null, 2), 'utf8');
    console.log(`✅ Patch de migration écrit dans ${migrationPatchPath}`);

    // Écrire les liens PHP-SQL
    const phpSqlLinksPath = path.join(this.config.outputDir, 'php_sql_links.json');
    fs.writeFileSync(phpSqlLinksPath, JSON.stringify(this.phpSqlLinks, null, 2), 'utf8');
    console.log(`✅ Liens PHP-SQL écrits dans ${phpSqlLinksPath}`);
  }

  /**
   * Utilitaire: Convertit snake_case en camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Utilitaire: Convertit snake_case en PascalCase
   */
  private toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }
}

// Configuration par défaut
const defaultConfig: SyncMapperConfig = {
  phpSourcePaths: ['./legacy/models/', './legacy/includes/'],
  sqlDumpPath: './database/legacy_dump.sql',
  prismaSchemaPath: './prisma/schema.prisma',
  transformationDetection: true,
  validateRelationships: true,
  outputDir: './output',
};

// Point d'entrée du script
async function main() {
  try {
    // Charger la configuration depuis les arguments ou utiliser les valeurs par défaut
    const config = {
      ...defaultConfig,
      // Ajouter ici le parsing des arguments CLI si nécessaire
      outputDir: process.env.OUTPUT_DIR || defaultConfig.outputDir,
    };

    console.log('📊 Configuration:', config);

    const mapper = new SyncMapper(config);
    await mapper.generateMappings();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
