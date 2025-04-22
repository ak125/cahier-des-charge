/**
 * type-mapper.ts
 * Agent 4 — Typage Avancé & Mapping PostgreSQL / Prisma
 * 
 * Effectue une correspondance intelligente et optimisée des types SQL, 
 * du schéma MySQL vers un modèle PostgreSQL adapté à Prisma.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Types pour les structures de données
interface Table {
  name: string;
  columns: Column[];
  foreignKeys?: ForeignKey[];
  comment?: string;
  engine?: string;
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  default?: string | null;
  comment?: string;
  extra?: string;
}

interface ForeignKey {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

interface TypeMapping {
  [key: string]: {
    mysql: string;
    postgres: string;
    prisma: string;
    warning?: string;
    suggestion?: string;
  };
}

interface TypeAnomalies {
  type: 'enum' | 'set' | 'unsigned' | 'precision' | 'timestamp' | 'json' | 'other';
  table: string;
  column: string;
  mysqlType: string;
  issue: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

interface TypeMappingConfig {
  baseOutputPath: string;
  agents: {
    typeMapper: {
      enabled: boolean;
      inputFiles: string[];
      outputFiles: string[];
      options: {
        validateTypes: boolean;
        detectAnomalies: boolean;
        suggestIndexes: boolean;
        includeDefaultValues: boolean;
        enhancedPrismaMappings: boolean;
      };
      typeMapping: {
        mysql: {
          [key: string]: {
            postgres: string;
            prisma: string;
          };
        };
      };
    };
  };
}

/**
 * Gère la correspondance des types MySQL vers PostgreSQL et Prisma
 */
class TypeMapper implements BaseAgent, BusinessAgent, AnalyzerAgent {
  private config: TypeMappingConfig;
  private tables: Table[] = [];
  private typeMapping: TypeMapping = {};
  private anomalies: TypeAnomalies[] = [];
  private logger: Console;

  // Mapping de base pour les types
  private defaultTypeMappings: { [key: string]: { postgres: string; prisma: string } } = {
    // Entiers
    'TINYINT(1)': { postgres: 'BOOLEAN', prisma: 'Boolean' },
    'TINYINT': { postgres: 'SMALLINT', prisma: 'Int' },
    'SMALLINT': { postgres: 'SMALLINT', prisma: 'Int' },
    'MEDIUMINT': { postgres: 'INTEGER', prisma: 'Int' },
    'INT': { postgres: 'INTEGER', prisma: 'Int' },
    'BIGINT': { postgres: 'BIGINT', prisma: 'BigInt @db.BigInt' },
    
    // Décimaux
    'DECIMAL': { postgres: 'NUMERIC', prisma: 'Decimal @db.Decimal(precision,scale)' },
    'FLOAT': { postgres: 'REAL', prisma: 'Float' },
    'DOUBLE': { postgres: 'DOUBLE PRECISION', prisma: 'Float' },
    
    // Texte
    'CHAR': { postgres: 'CHAR', prisma: 'String @db.Char(length)' },
    'VARCHAR': { postgres: 'VARCHAR', prisma: 'String @db.VarChar(length)' },
    'TINYTEXT': { postgres: 'TEXT', prisma: 'String @db.Text' },
    'TEXT': { postgres: 'TEXT', prisma: 'String @db.Text' },
    'MEDIUMTEXT': { postgres: 'TEXT', prisma: 'String @db.Text' },
    'LONGTEXT': { postgres: 'TEXT', prisma: 'String @db.Text' },
    
    // Binaire
    'BINARY': { postgres: 'BYTEA', prisma: 'Bytes' },
    'VARBINARY': { postgres: 'BYTEA', prisma: 'Bytes' },
    'TINYBLOB': { postgres: 'BYTEA', prisma: 'Bytes' },
    'BLOB': { postgres: 'BYTEA', prisma: 'Bytes' },
    'MEDIUMBLOB': { postgres: 'BYTEA', prisma: 'Bytes' },
    'LONGBLOB': { postgres: 'BYTEA', prisma: 'Bytes' },
    
    // Date et Heure
    'DATE': { postgres: 'DATE', prisma: 'DateTime @db.Date' },
    'TIME': { postgres: 'TIME', prisma: 'DateTime @db.Time' },
    'YEAR': { postgres: 'SMALLINT', prisma: 'Int @db.SmallInt' },
    'DATETIME': { postgres: 'TIMESTAMP', prisma: 'DateTime' },
    'TIMESTAMP': { postgres: 'TIMESTAMP', prisma: 'DateTime' },
    
    // Autres
    'JSON': { postgres: 'JSONB', prisma: 'Json' },
    'ENUM': { postgres: 'TEXT', prisma: 'String @db.Text' },
    'SET': { postgres: 'TEXT[]', prisma: 'String[] @db.Text' },
    'GEOMETRY': { postgres: 'GEOMETRY', prisma: 'Unsupported("GEOMETRY")' },
    'POINT': { postgres: 'POINT', prisma: 'Unsupported("POINT")' },
    'LINESTRING': { postgres: 'PATH', prisma: 'Unsupported("LINESTRING")' },
    'POLYGON': { postgres: 'POLYGON', prisma: 'Unsupported("POLYGON")' },
    'MULTIPOINT': { postgres: 'POINT[]', prisma: 'Unsupported("MULTIPOINT")' },
    'MULTILINESTRING': { postgres: 'PATH[]', prisma: 'Unsupported("MULTILINESTRING")' },
    'MULTIPOLYGON': { postgres: 'POLYGON[]', prisma: 'Unsupported("MULTIPOLYGON")' },
    'GEOMETRYCOLLECTION': { postgres: 'GEOMETRY[]', prisma: 'Unsupported("GEOMETRYCOLLECTION")' }
  };

  constructor(configPath: string, private schemaPath: string, logger = console) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.logger = logger;
    
    // Fusionner le mapping par défaut avec celui de la configuration
    if (this.config.agents.typeMapper.typeMapping?.mysql) {
      this.defaultTypeMappings = {
        ...this.defaultTypeMappings,
        ...this.config.agents.typeMapper.typeMapping.mysql
      };
    }
  }

  /**
   * Charge les données du schéma
   */
  async loadSchema(): Promise<void> {
    try {
      const schemaContent = await readFile(this.schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Adaptez cette partie selon la structure réelle du schema_raw.json
      if (Array.isArray(schema.tables)) {
        this.tables = schema.tables;
      } else if (schema.tables) {
        // Si c'est un objet avec des noms de table comme clés
        this.tables = Object.keys(schema.tables).map(tableName => {
          return {
            name: tableName,
            ...schema.tables[tableName]
          };
        });
      } else {
        throw new Error('Format du schema_raw.json non reconnu');
      }
      
      this.logger.info(`Chargé ${this.tables.length} tables depuis le schéma`);
    } catch (error) {
      this.logger.error(`Erreur lors du chargement du schéma: ${error}`);
      throw error;
    }
  }

  /**
   * Effectue l'analyse complète des types
   */
  async analyze(): Promise<void> {
    await this.loadSchema();
    
    // Analyser chaque table
    for (const table of this.tables) {
      this.analyzeTable(table);
    }
    
    // Générer les fichiers de sortie
    await this.generateOutputFiles();
  }

  /**
   * Analyse une table et ses colonnes
   */
  private analyzeTable(table: Table): void {
    for (const column of table.columns) {
      const mappingKey = `${table.name}.${column.name}`;
      const mysqlType = this.normalizeType(column.type);
      
      const mapping = this.mapColumnType(column, table);
      
      this.typeMapping[mappingKey] = {
        mysql: column.type,
        postgres: mapping.postgres,
        prisma: mapping.prisma
      };
      
      // Vérifier les anomalies
      if (this.config.agents.typeMapper.options.detectAnomalies) {
        const anomaly = this.detectTypeAnomaly(column, table);
        if (anomaly) {
          this.anomalies.push(anomaly);
          this.typeMapping[mappingKey].warning = anomaly.issue;
          this.typeMapping[mappingKey].suggestion = anomaly.recommendation;
        }
      }
    }
  }

  /**
   * Normalise un type MySQL pour le matching
   */
  private normalizeType(type: string): string {
    // Supprimer les paramètres de taille pour la correspondance de base
    const baseType = type.replace(/\(\d+(?:,\d+)?\)/, '');
    
    // Gérer TINYINT(1) comme un cas spécial (généralement un booléen)
    if (type.match(/TINYINT\(1\)/i)) {
      return 'TINYINT(1)';
    }
    
    return baseType.toUpperCase();
  }

  /**
   * Extrait les informations de taille et précision d'un type
   */
  private extractTypeSizeInfo(type: string): { baseType: string; size?: string; precision?: number; scale?: number } {
    const sizeMatch = type.match(/([A-Za-z]+)\((\d+)(?:,(\d+))?\)/i);
    
    if (!sizeMatch) {
      return { baseType: type.toUpperCase() };
    }
    
    const baseType = sizeMatch[1].toUpperCase();
    const size = sizeMatch[2];
    
    // Pour les types avec précision et échelle (comme DECIMAL)
    if (sizeMatch[3]) {
      return {
        baseType,
        size,
        precision: parseInt(sizeMatch[2], 10),
        scale: parseInt(sizeMatch[3], 10)
      };
    }
    
    return { baseType, size };
  }

  /**
   * Obtient la définition Prisma complète pour une colonne
   */
  private getPrismaFieldDefinition(column: Column, table: Table, postgresType: string): string {
    const typeInfo = this.extractTypeSizeInfo(column.type);
    const baseType = typeInfo.baseType;
    
    let prismaType = '';
    
    // Trouver le type Prisma correspondant
    for (const [mysqlPattern, mapping] of Object.entries(this.defaultTypeMappings)) {
      if (baseType === this.normalizeType(mysqlPattern)) {
        prismaType = mapping.prisma;
        break;
      }
    }
    
    // Si aucune correspondance trouvée, utiliser un type générique
    if (!prismaType) {
      prismaType = 'String';
    }
    
    // Remplacer les placeholders de taille/précision si nécessaire
    if (typeInfo.precision && typeInfo.scale !== undefined && prismaType.includes('precision')) {
      prismaType = prismaType.replace('precision,scale', `${typeInfo.precision},${typeInfo.scale}`);
    } else if (typeInfo.size && prismaType.includes('length')) {
      prismaType = prismaType.replace('length', typeInfo.size);
    }
    
    // Gérer les clés primaires
    if (column.isPrimary) {
      prismaType += ' @id';
      
      // Ajouter autoincrement si nécessaire
      if (column.extra && column.extra.toLowerCase().includes('auto_increment')) {
        prismaType += ' @default(autoincrement())';
      } else if (postgresType.includes('SERIAL')) {
        prismaType += ' @default(autoincrement())';
      }
    } 
    // Ajouter @default si présent
    else if (column.default !== null && column.default !== undefined) {
      let defaultValue = column.default;
      
      // Formater la valeur par défaut selon le type
      if (prismaType.startsWith('String')) {
        defaultValue = `"${defaultValue}"`;
      } else if (prismaType.startsWith('DateTime')) {
        if (defaultValue.toLowerCase() === 'current_timestamp') {
          defaultValue = 'now()';
        } else {
          defaultValue = `"${defaultValue}"`;
        }
      } else if (prismaType.startsWith('Boolean')) {
        defaultValue = defaultValue === '1' || defaultValue.toLowerCase() === 'true' ? 'true' : 'false';
      }
      
      // Ajouter la directive @default
      prismaType += ` @default(${defaultValue})`;
    }
    
    // Gérer les champs non nullables
    if (!column.nullable) {
      // Ne pas ajouter explicitement si déjà marqué comme @id (implicitement non nullable)
      if (!prismaType.includes('@id')) {
        // Ajouter avant les autres attributs
        const attrIndex = prismaType.indexOf('@');
        if (attrIndex !== -1) {
          prismaType = prismaType.substring(0, attrIndex) + prismaType.substring(attrIndex);
        }
      }
    } else {
      // Marquer explicitement comme nullable si nécessaire
      const attrIndex = prismaType.indexOf('@');
      if (attrIndex !== -1) {
        prismaType = prismaType.substring(0, attrIndex) + '?' + prismaType.substring(attrIndex);
      } else {
        prismaType += '?';
      }
    }
    
    return prismaType;
  }

  /**
   * Mappe le type MySQL vers PostgreSQL et Prisma
   */
  private mapColumnType(column: Column, table: Table): { postgres: string; prisma: string } {
    const typeInfo = this.extractTypeSizeInfo(column.type);
    const baseType = typeInfo.baseType;
    
    // Chercher une correspondance exacte
    const exactMatch = this.defaultTypeMappings[column.type.toUpperCase()];
    if (exactMatch) {
      return {
        postgres: exactMatch.postgres,
        prisma: this.getPrismaFieldDefinition(column, table, exactMatch.postgres)
      };
    }
    
    // Chercher une correspondance de base
    const baseMatch = this.defaultTypeMappings[baseType];
    if (baseMatch) {
      let postgresType = baseMatch.postgres;
      
      // Ajouter les informations de taille si nécessaire
      if (typeInfo.size) {
        if (['VARCHAR', 'CHAR'].includes(baseType)) {
          postgresType = `${postgresType}(${typeInfo.size})`;
        } else if (baseType === 'DECIMAL' && typeInfo.precision && typeInfo.scale !== undefined) {
          postgresType = `${postgresType}(${typeInfo.precision},${typeInfo.scale})`;
        }
      }
      
      // Gérer les champs auto-incrémentés
      if (column.isPrimary && column.extra && column.extra.toLowerCase().includes('auto_increment')) {
        if (baseType === 'INT' || baseType === 'INTEGER') {
          postgresType = 'SERIAL';
        } else if (baseType === 'BIGINT') {
          postgresType = 'BIGSERIAL';
        } else if (baseType === 'SMALLINT') {
          postgresType = 'SMALLSERIAL';
        }
      }
      
      return {
        postgres: postgresType,
        prisma: this.getPrismaFieldDefinition(column, table, postgresType)
      };
    }
    
    // Cas spéciaux ou non supportés
    if (baseType.startsWith('ENUM')) {
      const enumValues = this.extractEnumValues(column.type);
      return {
        postgres: 'TEXT',
        prisma: `String @db.Text // Enum original: ${column.type}`
      };
    }
    
    if (baseType.startsWith('SET')) {
      const setValues = this.extractEnumValues(column.type);
      return {
        postgres: 'TEXT[]',
        prisma: `String[] @db.Text // Set original: ${column.type}`
      };
    }
    
    // Type non reconnu, utiliser TEXT comme fallback
    return {
      postgres: 'TEXT',
      prisma: `String @db.Text // Type original non supporté: ${column.type}`
    };
  }

  /**
   * Extrait les valeurs d'une énumération MySQL
   */
  private extractEnumValues(enumType: string): string[] {
    const match = enumType.match(/ENUM\('([^']*)'(?:,\s*'([^']*)')*\)/i) || 
                 enumType.match(/SET\('([^']*)'(?:,\s*'([^']*)')*\)/i);
    
    if (!match) return [];
    
    // Extraire toutes les valeurs entre guillemets
    const allMatches = enumType.match(/'([^']*)'/g);
    if (!allMatches) return [];
    
    return allMatches.map(value => value.replace(/'/g, ''));
  }

  /**
   * Détecte les anomalies de typage
   */
  private detectTypeAnomaly(column: Column, table: Table): TypeAnomalies | null {
    const typeInfo = this.extractTypeSizeInfo(column.type);
    const baseType = typeInfo.baseType;
    
    // Vérifier les types ENUM (conversion complexe en PostgreSQL)
    if (baseType.startsWith('ENUM')) {
      return {
        type: 'enum',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les ENUM MySQL ne sont pas nativement supportés par PostgreSQL',
        recommendation: 'Créer un type ENUM en Prisma ou utiliser une table de référence',
        severity: 'medium'
      };
    }
    
    // Vérifier les types SET (non supportés en PostgreSQL)
    if (baseType.startsWith('SET')) {
      return {
        type: 'set',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les types SET MySQL ne sont pas supportés par PostgreSQL',
        recommendation: 'Utiliser un tableau (TEXT[]) ou une table de jointure',
        severity: 'high'
      };
    }
    
    // Vérifier les UNSIGNED (non supportés en PostgreSQL)
    if (column.type.toUpperCase().includes('UNSIGNED')) {
      return {
        type: 'unsigned',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Les entiers UNSIGNED ne sont pas supportés par PostgreSQL',
        recommendation: 'Utiliser un type de taille supérieure (ex: INT -> BIGINT)',
        severity: 'medium'
      };
    }
    
    // Vérifier les types à virgule flottante pour données financières
    if ((baseType === 'FLOAT' || baseType === 'DOUBLE') && 
        (column.name.includes('price') || column.name.includes('amount') || 
         column.name.includes('cost') || column.name.includes('fee'))) {
      return {
        type: 'precision',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'Type à virgule flottante utilisé pour des données financières',
        recommendation: 'Utiliser NUMERIC(precision,scale) pour une précision exacte',
        severity: 'high'
      };
    }
    
    // Vérifier les valeurs par défaut des TIMESTAMP
    if (baseType === 'TIMESTAMP' && column.default?.toUpperCase() === 'CURRENT_TIMESTAMP') {
      return {
        type: 'timestamp',
        table: table.name,
        column: column.name,
        mysqlType: column.type,
        issue: 'La valeur par défaut CURRENT_TIMESTAMP a une syntaxe différente en PostgreSQL',
        recommendation: 'Utiliser NOW() ou définir en Prisma avec @default(now())',
        severity: 'low'
      };
    }
    
    // Vérifier les colonnes JSON sans validation
    if (baseType === 'JSON' || baseType === 'LONGTEXT' || baseType === 'TEXT') {
      if (column.name.includes('json') || column.name.includes('data') || column.name.includes('config')) {
        return {
          type: 'json',
          table: table.name,
          column: column.name,
          mysqlType: column.type,
          issue: 'Colonne stockant probablement du JSON sans validation de structure',
          recommendation: 'Utiliser JSONB avec contraintes ou définir un zod schema',
          severity: 'low'
        };
      }
    }
    
    return null;
  }

  /**
   * Génère les fichiers de sortie
   */
  async generateOutputFiles(): Promise<void> {
    const { baseOutputPath } = this.config;
    const outputDir = baseOutputPath || './reports';
    
    // S'assurer que le répertoire de sortie existe
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Ignorer l'erreur si le répertoire existe déjà
    }
    
    // Générer type_mapping.json
    const mappingPath = path.join(outputDir, 'type_mapping.json');
    await writeFile(mappingPath, JSON.stringify(this.typeMapping, null, 2), 'utf8');
    this.logger.info(`Mapping de types écrit dans ${mappingPath}`);
    
    // Générer postgres_mapping_recommendations.md
    const recommendationsPath = path.join(outputDir, 'postgres_mapping_recommendations.md');
    const recommendationsContent = this.generateRecommendationsMarkdown();
    await writeFile(recommendationsPath, recommendationsContent, 'utf8');
    this.logger.info(`Recommandations de mapping écrites dans ${recommendationsPath}`);
  }

  /**
   * Génère le rapport de recommandations au format Markdown
   */
  private generateRecommendationsMarkdown(): string {
    let markdown = `# 🔍 Mapping Typologique MySQL ➝ PostgreSQL ➝ Prisma\n\n`;
    
    // Statistiques générales
    markdown += `## 📊 Statistiques\n\n`;
    const totalColumns = Object.keys(this.typeMapping).length;
    const columnsWithWarnings = Object.values(this.typeMapping).filter(m => m.warning).length;
    
    markdown += `- Tables analysées: **${this.tables.length}**\n`;
    markdown += `- Colonnes analysées: **${totalColumns}**\n`;
    markdown += `- Conversions avec avertissements: **${columnsWithWarnings}**\n`;
    markdown += `- Anomalies détectées: **${this.anomalies.length}**\n\n`;
    
    // Regrouper les colonnes par type de transformation
    const typeGroups: { [key: string]: { from: string; to: string; columns: string[] } } = {};
    
    for (const [key, mapping] of Object.entries(this.typeMapping)) {
      const [table, column] = key.split('.');
      const fromType = mapping.mysql;
      const toType = mapping.postgres;
      
      // Clé de groupe pour ce mapping de type
      const groupKey = `${fromType} -> ${toType}`;
      
      if (!typeGroups[groupKey]) {
        typeGroups[groupKey] = {
          from: fromType,
          to: toType,
          columns: []
        };
      }
      
      typeGroups[groupKey].columns.push(`${table}.${column}`);
    }
    
    // Afficher les conversions par groupes
    markdown += `## ✅ Conversions de types\n\n`;
    
    // Trier par fréquence d'utilisation
    const sortedGroups = Object.entries(typeGroups)
      .sort((a, b) => b[1].columns.length - a[1].columns.length);
    
    markdown += `| MySQL | PostgreSQL | Prisma | Colonnes |\n`;
    markdown += `|-------|------------|--------|----------|\n`;
    
    for (const [groupKey, group] of sortedGroups) {
      const firstColumn = group.columns[0];
      const prismaType = this.typeMapping[firstColumn].prisma.split(' @')[0]; // Prendre juste le type de base
      
      // Tronquer la liste si trop longue
      let columnsList = group.columns.length <= 3 
        ? group.columns.join(', ')
        : `${group.columns.slice(0, 3).join(', ')} et ${group.columns.length - 3} autres`;
      
      markdown += `| ${group.from} | ${group.to} | ${prismaType} | ${columnsList} |\n`;
    }
    
    markdown += `\n`;
    
    // Anomalies par type
    const anomalyTypes = [...new Set(this.anomalies.map(a => a.type))];
    
    if (anomalyTypes.length > 0) {
      markdown += `## ⚠️ Anomalies détectées\n\n`;
      
      for (const type of anomalyTypes) {
        const typeAnomalies = this.anomalies.filter(a => a.type === type);
        
        // Entête pour ce type d'anomalie
        let title = '';
        switch (type) {
          case 'enum': title = 'Énumérations MySQL'; break;
          case 'set': title = 'Types SET MySQL'; break;
          case 'unsigned': title = 'Entiers UNSIGNED'; break;
          case 'precision': title = 'Problèmes de précision numérique'; break;
          case 'timestamp': title = 'Valeurs par défaut TIMESTAMP'; break;
          case 'json': title = 'Données JSON sans validation'; break;
          default: title = 'Autres anomalies'; break;
        }
        
        markdown += `### ${title}\n\n`;
        
        // Détailler les anomalies de ce type
        for (const anomaly of typeAnomalies) {
          markdown += `- **${anomaly.table}.${anomaly.column}** (${anomaly.mysqlType}):\n`;
          markdown += `  - Problème: ${anomaly.issue}\n`;
          markdown += `  - Recommandation: ${anomaly.recommendation}\n`;
        }
        
        markdown += `\n`;
      }
    }
    
    // Recommandations générales
    markdown += `## 💡 Recommandations générales\n\n`;
    
    // Recommandations basées sur les anomalies détectées
    if (this.anomalies.some(a => a.type === 'enum')) {
      markdown += `### Gestion des énumérations\n\n`;
      markdown += `Pour les types ENUM MySQL, considérer:\n\n`;
      markdown += `1. Définir un enum en Prisma:\n`;
      markdown += `   \`\`\`prisma\n`;
      markdown += `   enum UserRole {\n`;
      markdown += `     ADMIN\n`;
      markdown += `     USER\n`;
      markdown += `     GUEST\n`;
      markdown += `   }\n`;
      markdown += `   \`\`\`\n\n`;
      markdown += `2. Utiliser un type PostgreSQL natif:\n`;
      markdown += `   \`\`\`sql\n`;
      markdown += `   CREATE TYPE user_role AS ENUM ('ADMIN', 'USER', 'GUEST');\n`;
      markdown += `   \`\`\`\n\n`;
      markdown += `3. Utiliser une table de référence pour plus de flexibilité\n\n`;
    }
    
    if (this.anomalies.some(a => a.type === 'unsigned')) {
      markdown += `### Entiers non signés (UNSIGNED)\n\n`;
      markdown += `PostgreSQL ne supporte pas directement les types UNSIGNED. Options de remplacement:\n\n`;
      markdown += `- Utiliser un type d'entier de taille supérieure (ex: INT → BIGINT)\n`;
      markdown += `- Ajouter une contrainte CHECK (column >= 0)\n`;
      markdown += `- Pour les identifiants auto-incrémentés, utiliser SERIAL (qui est toujours signé)\n\n`;
    }
    
    if (this.anomalies.some(a => a.type === 'precision')) {
      markdown += `### Données financières et précision numérique\n\n`;
      markdown += `Pour les montants financiers et autres données nécessitant une précision exacte:\n\n`;
      markdown += `- Toujours utiliser NUMERIC/DECIMAL plutôt que FLOAT/DOUBLE\n`;
      markdown += `- Recommandation: NUMERIC(19,4) pour les montants (supporte jusqu'à 9,999,999,999,999.9999)\n`;
      markdown += `- En Prisma: \`price Decimal @db.Decimal(19,4)\`\n\n`;
    }
    
    if (this.anomalies.some(a => a.type === 'json')) {
      markdown += `### Données JSON\n\n`;
      markdown += `PostgreSQL offre le type JSONB performant avec indexation:\n\n`;
      markdown += `- Utiliser JSONB plutôt que TEXT pour stocker du JSON\n`;
      markdown += `- Considérer l'ajout de validation côté application avec zod ou JSON Schema\n`;
      markdown += `- En Prisma: \`config Json\`\n\n`;
    }
    
    // Suggestions pour améliorer le schéma
    markdown += `## 🚀 Suggestions d'optimisation\n\n`;
    markdown += `1. **Définir les clés primaires explicitement** - Assurer que chaque table a une clé primaire bien définie\n\n`;
    markdown += `2. **Utiliser UUID pour les clés distribuées** - Considérer les UUID pour les systèmes distribués:\n`;
    markdown += `   \`\`\`prisma\n`;
    markdown += `   id String @id @default(uuid()) @db.Uuid\n`;
    markdown += `   \`\`\`\n\n`;
    markdown += `3. **Convertir les timestamps automatiques** - Utiliser les fonctionnalités Prisma:\n`;
    markdown += `   \`\`\`prisma\n`;
    markdown += `   createdAt DateTime @default(now())\n`;
    markdown += `   updatedAt DateTime @updatedAt\n`;
    markdown += `   \`\`\`\n\n`;
    markdown += `4. **Pour les relations many-to-many** - Définir explicitement les tables de joinction\n\n`;
    
    return markdown;
  }
}

/**
 * Point d'entrée pour l'exécution à partir de la ligne de commande
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const configPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1] || './config/sql_analyzer.config.json';
    const schemaPath = args.find(arg => arg.startsWith('--schema='))?.split('=')[1] || './reports/schema_raw.json';
    
    console.log(`🔍 Démarrage du Mapping de Types...`);
    console.log(`📁 Configuration: ${configPath}`);
    console.log(`📁 Schéma: ${schemaPath}`);
    
    const typeMapper = new TypeMapper(configPath, schemaPath);
    await typeMapper.analyze();
    
    console.log(`✅ Mapping de types terminé avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors du mapping de types: ${error}`);
    process.exit(1);
  }
}

// Si exécuté directement (pas importé)
if (require.main === module) {
  main();
}

export { TypeMapper };










import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent, AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';












































































































































































































































































































































































































































































































































































































































































































































































