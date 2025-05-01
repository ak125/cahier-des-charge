/**
 * migration-strategist.ts
 *
 * Service qui génère un plan de migration structuré pour chaque table MySQL
 * vers PostgreSQL via Prisma, à partir des résultats d'analyse.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface MigrationPlan {
  table: string;
  prismaModel: string;
  summary: {
    role: string;
    functionalArea: string;
  };
  typeChanges: Array<{
    field: string;
    from: string;
    to: string;
    reason?: string;
  }>;
  postgresAdaptations: Array<{
    element: string;
    recommendation: string;
  }>;
  prismaRecommendations: string[];
  prismaModel: string;
  relationalOptimizations: string[];
  postMigrationInstructions: string[];
  linkedFiles: string[];
  migrationReady: boolean;
  migrationReadyScore: number;
  dependencies: string[];
}

interface SchemaMap {
  name: string;
  tables: Record<string, TableInfo>;
  version?: string;
  characterSet?: string;
  collation?: string;
  metadata?: Record<string, any>;
  classificationStats?: Record<string, number>;
  foreignKeys?: Array<{
    name: string;
    sourceTable: string;
    sourceColumns: string[];
    targetTable: string;
    targetColumns: string[];
    onDelete?: string;
    onUpdate?: string;
  }>;
}

interface TableInfo {
  name: string;
  columns: Record<string, ColumnInfo>;
  primaryKey?: string[];
  indexes?: IndexInfo[];
  foreignKeys?: ForeignKeyInfo[];
  constraints?: ConstraintInfo[];
  tableType?: string;
  classificationReason?: string;
  relations?: RelationInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  isPrimary: boolean;
  isUnique?: boolean;
  autoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
  enumValues?: string[];
  suggestedPostgresType?: string;
  suggestedPrismaType?: string;
  originalType?: string;
  references?: {
    table: string;
    column: string;
  };
}

interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

interface ForeignKeyInfo {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

interface ConstraintInfo {
  name: string;
  type: string;
  definition: string;
}

interface RelationInfo {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: string;
  isImplicit?: boolean;
}

interface TypeConversionResult {
  schema: SchemaMap;
  conversionStats: {
    totalFields: number;
    convertedFields: number;
    optimizedFields: number;
    enumsDetected: number;
  };
  typeConversionMap: Record<
    string,
    {
      from: string;
      to: string;
      postgres?: string;
      count: number;
    }
  >;
  fieldTypingIssues: Array<{
    tableName: string;
    columnName: string;
    originalType: string;
    suggestedType: string;
    reason: string;
  }>;
  detectedEnums: Record<string, string[]>;
}

interface ImpactInfo {
  table: string;
  impactedFiles: string[];
  dependentTables: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  priority: number;
}

class MigrationStrategist {
  private schemaMap: SchemaMap;
  private conversionResult: TypeConversionResult;
  private impactGraph: Record<string, ImpactInfo>;
  private plans: Record<string, MigrationPlan> = {};

  constructor(schemaMapPath: string, conversionResultPath: string, impactGraphPath: string) {
    // Charger les fichiers d'analyse
    this.schemaMap = JSON.parse(fs.readFileSync(schemaMapPath, 'utf8'));
    this.conversionResult = JSON.parse(fs.readFileSync(conversionResultPath, 'utf8'));
    this.impactGraph = JSON.parse(fs.readFileSync(impactGraphPath, 'utf8'));
  }

  /**
   * Génère des plans de migration pour toutes les tables
   */
  public generateMigrationPlans(): Record<string, MigrationPlan> {
    // Pour chaque table dans le schéma
    Object.entries(this.schemaMap.tables).forEach(([tableName, tableInfo]) => {
      this.plans[tableName] = this.generatePlanForTable(tableName, tableInfo);
    });

    // Calcul des dépendances et du score de migration
    this.calculateDependenciesAndReadiness();

    return this.plans;
  }

  /**
   * Génère un plan de migration pour une table spécifique
   */
  private generatePlanForTable(tableName: string, tableInfo: TableInfo): MigrationPlan {
    // Nom du modèle Prisma (PascalCase)
    const prismaModel = this.toPascalCase(tableName);

    // Extraire les changements de type
    const typeChanges = this.extractTypeChanges(tableName, tableInfo);

    // Générer les adaptations PostgreSQL
    const postgresAdaptations = this.generatePostgresAdaptations(tableName, tableInfo);

    // Générer les recommandations Prisma
    const prismaRecommendations = this.generatePrismaRecommendations(tableName, tableInfo);

    // Générer le modèle Prisma
    const prismaModelCode = this.generatePrismaModelCode(tableName, tableInfo);

    // Générer les optimisations relationnelles
    const relationalOptimizations = this.generateRelationalOptimizations(tableName, tableInfo);

    // Générer les instructions post-migration
    const postMigrationInstructions = this.generatePostMigrationInstructions(tableName, tableInfo);

    // Fichiers liés (depuis l'impact graph)
    const linkedFiles = this.impactGraph[tableName]?.impactedFiles || [];

    // Déterminer le rôle fonctionnel de la table
    const functionalSummary = this.determineFunctionalSummary(tableName, tableInfo);

    return {
      table: tableName,
      prismaModel,
      summary: functionalSummary,
      typeChanges,
      postgresAdaptations,
      prismaRecommendations,
      prismaModel: prismaModelCode,
      relationalOptimizations,
      postMigrationInstructions,
      linkedFiles,
      migrationReady: false, // Sera calculé plus tard
      migrationReadyScore: 0, // Sera calculé plus tard
      dependencies: [], // Sera rempli plus tard
    };
  }

  /**
   * Extrait les changements de type pour une table
   */
  private extractTypeChanges(
    tableName: string,
    tableInfo: TableInfo
  ): Array<{
    field: string;
    from: string;
    to: string;
    reason?: string;
  }> {
    const changes: Array<{
      field: string;
      from: string;
      to: string;
      reason?: string;
    }> = [];

    // Parcourir les colonnes de la table
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      if (columnInfo.originalType && columnInfo.suggestedPostgresType) {
        // Ne pas inclure les changements qui sont identiques
        if (
          this.normalizeType(columnInfo.originalType) !==
          this.normalizeType(columnInfo.suggestedPostgresType)
        ) {
          const change = {
            field: columnName,
            from: columnInfo.originalType,
            to: columnInfo.suggestedPostgresType,
          };

          // Ajouter la raison si disponible
          const issue = this.conversionResult.fieldTypingIssues.find(
            (issue) => issue.tableName === tableName && issue.columnName === columnName
          );

          if (issue) {
            change['reason'] = issue.reason;
          }

          changes.push(change);
        }
      }
    });

    return changes;
  }

  /**
   * Génère les adaptations PostgreSQL pour une table
   */
  private generatePostgresAdaptations(
    tableName: string,
    tableInfo: TableInfo
  ): Array<{
    element: string;
    recommendation: string;
  }> {
    const adaptations: Array<{
      element: string;
      recommendation: string;
    }> = [];

    // Parcourir les colonnes de la table
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      // TINYINT(1) → BOOLEAN
      if (columnInfo.originalType?.toLowerCase().includes('tinyint(1)')) {
        adaptations.push({
          element: 'Typage',
          recommendation: `${columnName}: TINYINT(1) → BOOLEAN`,
        });
      }

      // Auto-increment
      if (columnInfo.autoIncrement) {
        adaptations.push({
          element: 'Auto-incrément',
          recommendation: `${columnName}: Utiliser @default(autoincrement()) dans Prisma`,
        });
      }

      // UUID
      if (
        columnInfo.originalType?.toLowerCase().includes('char(36)') ||
        (columnInfo.originalType?.toLowerCase().includes('varchar') &&
          columnName.toLowerCase().includes('uuid'))
      ) {
        adaptations.push({
          element: 'UUID',
          recommendation: `${columnName}: Utiliser le type UUID natif de PostgreSQL et @default(uuid()) dans Prisma`,
        });
      }

      // TIMESTAMP/DATETIME
      if (
        columnInfo.originalType?.toLowerCase().includes('timestamp') ||
        columnInfo.originalType?.toLowerCase().includes('datetime')
      ) {
        adaptations.push({
          element: 'Timestamp',
          recommendation: `${columnName}: Remplacer ${columnInfo.originalType} par TIMESTAMP WITH TIME ZONE`,
        });
      }

      // Énumérations
      if (columnInfo.enumValues) {
        adaptations.push({
          element: 'Enum',
          recommendation: `${columnName}: Créer un enum Prisma ${this.toPascalCase(columnName)}`,
        });
      }

      // DECIMAL pour les montants
      if (
        (columnInfo.originalType?.toLowerCase().includes('float') ||
          columnInfo.originalType?.toLowerCase().includes('double')) &&
        (columnName.toLowerCase().includes('price') ||
          columnName.toLowerCase().includes('amount') ||
          columnName.toLowerCase().includes('cost'))
      ) {
        adaptations.push({
          element: 'Précision monétaire',
          recommendation: `${columnName}: Utiliser DECIMAL au lieu de ${columnInfo.originalType} pour éviter les erreurs d'arrondi`,
        });
      }
    });

    // ID principal
    if (tableInfo.primaryKey) {
      adaptations.push({
        element: 'ID',
        recommendation: `Utiliser @id @default(cuid()) ou @default(autoincrement()) dans Prisma selon le cas d'usage`,
      });
    }

    return adaptations;
  }

  /**
   * Génère les recommandations Prisma pour une table
   */
  private generatePrismaRecommendations(tableName: string, tableInfo: TableInfo): string[] {
    const recommendations: string[] = [];

    // Vérifier les index uniques pour les champs comme l'email
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      if (
        columnInfo.isUnique ||
        tableInfo.indexes?.some(
          (idx) => idx.isUnique && idx.columns.length === 1 && idx.columns[0] === columnName
        )
      ) {
        recommendations.push(`Ajouter @unique sur ${columnName}`);
      }

      // Recommandations pour les clés étrangères
      if (columnName.endsWith('_id') && columnInfo.references) {
        const referencedTable = columnInfo.references.table;
        const referencedModel = this.toPascalCase(referencedTable);
        const relationName = this.getSingularName(referencedTable);

        recommendations.push(
          `Créer relation ${relationName}: ${referencedModel} pour ${columnName}`
        );

        // Vérifier si la relation est 1:n ou 1:1
        const relation = tableInfo.relations?.find(
          (rel) => rel.sourceColumn === columnName && rel.targetTable === referencedTable
        );

        if (relation && relation.type.includes('ONE_TO_ONE')) {
          recommendations.push(`Définir relation 1:1 avec ${referencedModel}`);
        } else {
          recommendations.push(`Définir relation n:1 avec ${referencedModel}`);
        }
      }
    });

    // Recommandations générales
    recommendations.push('Utiliser des enums Prisma pour les champs à valeurs constantes');
    recommendations.push(
      'Ajouter @map("nom_colonne") si nécessaire pour maintenir la compatibilité'
    );
    recommendations.push(
      'Ajouter @@map("nom_table") à la fin du modèle pour maintenir la compatibilité'
    );

    return recommendations;
  }

  /**
   * Génère un exemple de code Prisma pour le modèle
   */
  private generatePrismaModelCode(tableName: string, tableInfo: TableInfo): string {
    const modelName = this.toPascalCase(tableName);
    let modelCode = `model ${modelName} {\n`;

    // Ajouter les champs
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      const prismaType = columnInfo.suggestedPrismaType || 'String';
      let line = `  ${columnName} ${prismaType}`;

      // Ajouter les attributs
      const attributes: string[] = [];

      // Clé primaire
      if (columnInfo.isPrimary) {
        attributes.push('@id');

        // Valeur par défaut pour l'ID
        if (columnInfo.autoIncrement) {
          attributes.push('@default(autoincrement())');
        } else if (
          columnInfo.originalType?.toLowerCase().includes('char(36)') ||
          columnName.toLowerCase().includes('uuid')
        ) {
          attributes.push('@default(uuid())');
        } else {
          attributes.push('@default(cuid())');
        }
      }

      // Champ unique
      if (columnInfo.isUnique) {
        attributes.push('@unique');
      }

      // Valeur par défaut
      if (
        columnInfo.defaultValue !== undefined &&
        !attributes.some((attr) => attr.startsWith('@default'))
      ) {
        if (columnInfo.defaultValue === 'CURRENT_TIMESTAMP') {
          attributes.push('@default(now())');
        } else if (columnInfo.defaultValue === 'NULL') {
          // Ne rien ajouter pour NULL
        } else if (columnInfo.defaultValue === 'true' || columnInfo.defaultValue === 'false') {
          attributes.push(`@default(${columnInfo.defaultValue})`);
        } else if (!isNaN(Number(columnInfo.defaultValue))) {
          attributes.push(`@default(${columnInfo.defaultValue})`);
        } else {
          // Supprimer les guillemets pour les chaînes
          const defaultValue = columnInfo.defaultValue.replace(/^['"]|['"]$/g, '');
          attributes.push(`@default("${defaultValue}")`);
        }
      }

      // Type de base de données spécifique
      if (columnInfo.suggestedPostgresType) {
        const dbType = columnInfo.suggestedPostgresType;

        // Convertir les types PostgreSQL en notation Prisma
        if (dbType.toLowerCase() === 'timestamp') {
          attributes.push('@db.Timestamp(6)');
        } else if (dbType.toLowerCase() === 'timestamp with time zone') {
          attributes.push('@db.Timestamptz(6)');
        } else if (dbType.toLowerCase().startsWith('varchar(')) {
          const length = dbType.match(/\((\d+)\)/)?.[1];
          if (length) {
            attributes.push(`@db.VarChar(${length})`);
          }
        } else if (dbType.toLowerCase().startsWith('decimal(')) {
          const precision = dbType.match(/\((\d+),\s*(\d+)\)/);
          if (precision) {
            attributes.push(`@db.Decimal(${precision[1]}, ${precision[2]})`);
          }
        }
      }

      // Ajouter les attributs à la ligne
      if (attributes.length > 0) {
        line += ' ' + attributes.join(' ');
      }

      // Champ nullable
      if (columnInfo.nullable) {
        // Ajouter le caractère ? après le type
        line = line.replace(` ${prismaType}`, ` ${prismaType}?`);
      }

      modelCode += `${line}\n`;
    });

    // Ajouter les relations
    const relations = this.findRelations(tableName, tableInfo);
    relations.forEach((relation) => {
      modelCode += relation + '\n';
    });

    // Ajouter les contraintes de table
    modelCode += `  @@map("${tableName}")\n`;

    // Ajouter les index qui ne sont pas des clés uniques
    tableInfo.indexes?.forEach((index) => {
      if (!index.isUnique && index.columns.length > 0 && index.name !== 'PRIMARY') {
        modelCode += `  @@index([${index.columns.join(', ')}])\n`;
      }
    });

    modelCode += '}';

    return modelCode;
  }

  /**
   * Trouve les relations pour une table
   */
  private findRelations(tableName: string, tableInfo: TableInfo): string[] {
    const relations: string[] = [];

    // Vérifier les relations dans le schéma
    if (tableInfo.relations) {
      tableInfo.relations.forEach((relation) => {
        if (relation.sourceTable === tableName) {
          // Cette table a une relation vers une autre table
          const targetModel = this.toPascalCase(relation.targetTable);
          const relationName = this.getSingularName(relation.targetTable);

          if (relation.type.includes('ONE_TO_ONE')) {
            relations.push(
              `  ${relationName} ${targetModel}? @relation(fields: [${relation.sourceColumn}], references: [${relation.targetColumn}])`
            );
          } else if (relation.type.includes('MANY_TO_ONE')) {
            relations.push(
              `  ${relationName} ${targetModel}? @relation(fields: [${relation.sourceColumn}], references: [${relation.targetColumn}])`
            );
          }
        } else if (relation.targetTable === tableName) {
          // Une autre table a une relation vers cette table
          const sourceModel = this.toPascalCase(relation.sourceTable);

          if (relation.type.includes('ONE_TO_MANY')) {
            const relationName = this.getPluralName(relation.sourceTable);
            relations.push(`  ${relationName} ${sourceModel}[] @relation`);
          }
        }
      });
    }

    return relations;
  }

  /**
   * Génère les optimisations relationnelles pour une table
   */
  private generateRelationalOptimizations(tableName: string, tableInfo: TableInfo): string[] {
    const optimizations: string[] = [];

    // Vérifier les index sur les clés étrangères
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      if (
        columnName.endsWith('_id') &&
        !tableInfo.indexes?.some((idx) => idx.columns.includes(columnName))
      ) {
        optimizations.push(`Ajout d'un index sur ${columnName} dans la table ${tableName}`);
      }
    });

    // Vérifier les clés étrangères qui devraient être explicites
    tableInfo.relations?.forEach((relation) => {
      if (relation.sourceTable === tableName && relation.isImplicit) {
        optimizations.push(
          `Foreign key déclarée explicitement dans Prisma pour ${relation.sourceColumn} → ${relation.targetTable}.${relation.targetColumn}`
        );
      }
    });

    // Vérifier les tables qui pourraient être fusionnées (dénormalisation)
    if (
      tableInfo.tableType === 'BUSINESS_DETAIL' &&
      tableInfo.columns &&
      Object.keys(tableInfo.columns).length <= 5
    ) {
      // Petites tables de détails qui pourraient être fusionnées avec la table principale
      const mainTable = tableInfo.relations?.find(
        (rel) => rel.sourceTable === tableName
      )?.targetTable;
      if (mainTable) {
        optimizations.push(
          `Fusionner ${tableName} avec ${mainTable} si les champs ne sont pas trop nombreux`
        );
      }
    }

    // Vérifier les champs JSON potentiels
    Object.entries(tableInfo.columns).forEach(([columnName, columnInfo]) => {
      if (
        columnInfo.originalType?.toLowerCase().includes('text') &&
        (columnName.includes('config') ||
          columnName.includes('settings') ||
          columnName.includes('data') ||
          columnName.includes('json'))
      ) {
        optimizations.push(
          `Considérer l'utilisation du type JSONB pour ${columnName} si contient des données structurées`
        );
      }
    });

    // Ajouter des recommandations générales
    optimizations.push('Utiliser les transactions PostgreSQL pour les opérations critiques');
    optimizations.push('Utiliser des contraintes de validation côté base de données');

    return optimizations;
  }

  /**
   * Génère les instructions post-migration pour une table
   */
  private generatePostMigrationInstructions(tableName: string, tableInfo: TableInfo): string[] {
    const instructions: string[] = [];
    const modelName = this.toPascalCase(tableName);

    // Instructions génériques
    instructions.push(`⚠️ Adapter les DTOs ${modelName}Dto`);

    // Instructions spécifiques basées sur le type de table
    if (tableInfo.tableType === 'BUSINESS_CORE') {
      instructions.push(`⚠️ Mettre à jour les services liés à ${modelName}`);
      instructions.push(`⚠️ Vérifier les validations métier dans ${modelName}Service`);
    } else if (tableInfo.tableType === 'TECHNICAL') {
      instructions.push(`⚠️ Vérifier la compatibilité avec les outils externes`);
    }

    // Instructions basées sur les relations
    if (tableInfo.relations?.some((rel) => rel.targetTable === tableName)) {
      instructions.push(`⚠️ Mettre à jour les requêtes avec jointures impliquant ${tableName}`);
    }

    // Instructions basées sur les types spéciaux
    if (Object.values(tableInfo.columns).some((col) => col.enumValues)) {
      instructions.push(`⚠️ Synchroniser les enums TypeScript avec les enums Prisma`);
    }

    // Instructions basées sur les fichiers impactés
    if (this.impactGraph[tableName]?.impactedFiles.length > 0) {
      instructions.push(
        `⚠️ Mettre à jour les appels dans ${this.impactGraph[tableName].impactedFiles.length} fichiers liés`
      );
    }

    return instructions;
  }

  /**
   * Détermine le résumé fonctionnel de la table
   */
  private determineFunctionalSummary(
    tableName: string,
    tableInfo: TableInfo
  ): {
    role: string;
    functionalArea: string;
  } {
    let role = 'stocke des données';
    let functionalArea = 'général';

    // Déterminer le rôle basé sur le type de table
    if (tableInfo.tableType === 'BUSINESS_CORE') {
      role = 'stocke les entités principales';

      // Détecter la zone fonctionnelle
      if (
        tableName.includes('user') ||
        tableName.includes('customer') ||
        tableName.includes('account')
      ) {
        functionalArea = 'utilisateurs / authentification';
      } else if (
        tableName.includes('product') ||
        tableName.includes('item') ||
        tableName.includes('catalog')
      ) {
        functionalArea = 'catalogue / produits';
      } else if (
        tableName.includes('order') ||
        tableName.includes('invoice') ||
        tableName.includes('payment')
      ) {
        functionalArea = 'commandes / paiements';
      } else if (
        tableName.includes('post') ||
        tableName.includes('comment') ||
        tableName.includes('content')
      ) {
        functionalArea = 'contenu / CMS';
      }
    } else if (tableInfo.tableType === 'BUSINESS_DETAIL') {
      role = 'stocke les détails associés aux entités principales';

      // Détecter la zone fonctionnelle
      const mainTable = tableInfo.relations?.find(
        (rel) => rel.sourceTable === tableName
      )?.targetTable;
      if (mainTable) {
        // Utiliser la zone fonctionnelle de la table principale
        if (
          mainTable.includes('user') ||
          mainTable.includes('customer') ||
          mainTable.includes('account')
        ) {
          functionalArea = 'profils utilisateurs';
        } else if (mainTable.includes('product') || mainTable.includes('item')) {
          functionalArea = 'détails produits';
        } else if (mainTable.includes('order')) {
          functionalArea = 'détails commandes';
        }
      }
    } else if (tableInfo.tableType === 'JUNCTION') {
      role = 'gère les relations many-to-many';

      // Déterminer les entités reliées
      const tables = tableName.split('_');
      functionalArea = `relation ${tables.join(' / ')}`;
    } else if (tableInfo.tableType === 'TECHNICAL') {
      role = 'stocke des données techniques';

      if (tableName.includes('log') || tableName.includes('audit')) {
        functionalArea = 'journalisation / audit';
      } else if (tableName.includes('session') || tableName.includes('token')) {
        functionalArea = 'sessions / authentification';
      } else if (tableName.includes('cache')) {
        functionalArea = 'mise en cache';
      } else if (tableName.includes('job') || tableName.includes('queue')) {
        functionalArea = 'tâches asynchrones';
      }
    }

    // Utiliser la classification de la raison si disponible
    if (tableInfo.classificationReason) {
      role = tableInfo.classificationReason;
    }

    return { role, functionalArea };
  }

  /**
   * Calcule les dépendances et la préparation à la migration pour chaque table
   */
  private calculateDependenciesAndReadiness(): void {
    // Construire un graphe de dépendances
    const dependencyGraph: Record<string, string[]> = {};

    // Parcourir les relations pour établir les dépendances
    this.schemaMap.foreignKeys?.forEach((fk) => {
      if (!dependencyGraph[fk.sourceTable]) {
        dependencyGraph[fk.sourceTable] = [];
      }
      if (!dependencyGraph[fk.sourceTable].includes(fk.targetTable)) {
        dependencyGraph[fk.sourceTable].push(fk.targetTable);
      }
    });

    // Ajouter les dépendances au plan de migration
    Object.keys(this.plans).forEach((tableName) => {
      this.plans[tableName].dependencies = dependencyGraph[tableName] || [];
    });

    // Calculer le score de préparation à la migration
    Object.keys(this.plans).forEach((tableName) => {
      let score = 100;
      const plan = this.plans[tableName];

      // Réduire le score en fonction des dépendances
      score -= plan.dependencies.length * 5;

      // Réduire le score en fonction des instructions post-migration
      score -= plan.postMigrationInstructions.length * 3;

      // Réduire le score en fonction des fichiers liés
      score -= plan.linkedFiles.length * 2;

      // Réduire le score en fonction des changements de type
      score -= plan.typeChanges.length;

      // Limiter le score entre 0 et 100
      plan.migrationReadyScore = Math.max(0, Math.min(100, score));

      // Déterminer si la table est prête pour la migration
      plan.migrationReady = plan.migrationReadyScore >= 70;
    });
  }

  /**
   * Exporte le plan de migration au format Markdown
   */
  public exportToMarkdown(outputPath: string): void {
    let markdown = `# Plan de Migration PostgreSQL\n\n`;
    markdown += `Généré le ${new Date().toLocaleString()}\n\n`;
    markdown += `## Sommaire\n\n`;

    // Créer le sommaire
    Object.keys(this.plans)
      .sort()
      .forEach((tableName) => {
        const plan = this.plans[tableName];
        const readyStatus = plan.migrationReady ? '✅' : '⏳';
        markdown += `- [${readyStatus} ${tableName}](#${tableName.toLowerCase()}) - Score: ${
          plan.migrationReadyScore
        }%\n`;
      });

    markdown += '\n';

    // Ajouter chaque plan de table
    Object.keys(this.plans)
      .sort()
      .forEach((tableName) => {
        const plan = this.plans[tableName];

        markdown += `## ${tableName}\n\n`;

        // Résumé fonctionnel
        markdown += `### ✅ 1.1 – Résumé fonctionnel\n\n`;
        markdown += `Nom de la table : ${tableName}\n\n`;
        markdown += `Rôle métier : ${plan.summary.role}\n\n`;
        markdown += `Zone fonctionnelle : ${plan.summary.functionalArea}\n\n`;

        // Adaptation PostgreSQL
        markdown += `### 🔧 1.2 – Adaptation PostgreSQL\n\n`;
        markdown += `| Élément | Recommandation |\n`;
        markdown += `|---------|---------------|\n`;
        plan.postgresAdaptations.forEach((adaptation) => {
          markdown += `| ${adaptation.element} | ${adaptation.recommendation} |\n`;
        });
        markdown += '\n';

        // Recommandations Prisma
        markdown += `### ⚙️ 1.3 – Recommandations Prisma\n\n`;
        plan.prismaRecommendations.forEach((recommendation) => {
          markdown += `- ${recommendation}\n`;
        });
        markdown += '\n';

        // Modèle Prisma
        markdown += `Transformer la table en :\n\n`;
        markdown += '```ts\n';
        markdown += plan.prismaModel;
        markdown += '\n```\n\n';

        // Optimisations relationnelles
        markdown += `### 🧩 1.4 – Optimisations relationnelles\n\n`;
        plan.relationalOptimizations.forEach((optimization) => {
          markdown += `- ${optimization}\n`;
        });
        markdown += '\n';

        // Instructions post-migration
        markdown += `### 🧨 1.5 – Instructions post-migration\n\n`;
        plan.postMigrationInstructions.forEach((instruction) => {
          markdown += `${instruction}\n\n`;
        });

        // Dépendances
        if (plan.dependencies.length > 0) {
          markdown += `### 🔗 Dépendances\n\n`;
          markdown += `Cette table dépend des tables suivantes :\n\n`;
          plan.dependencies.forEach((dependency) => {
            markdown += `- ${dependency}\n`;
          });
          markdown += '\n';
        }

        // Fichiers liés
        if (plan.linkedFiles.length > 0) {
          markdown += `### 📄 Fichiers liés\n\n`;
          plan.linkedFiles.forEach((file) => {
            markdown += `- ${file}\n`;
          });
          markdown += '\n';
        }

        // Séparateur entre les tables
        markdown += '---\n\n';
      });

    // Écrire dans le fichier
    fs.writeFileSync(outputPath, markdown);
    console.log(`Plan de migration généré avec succès dans : ${outputPath}`);
  }

  /**
   * Exporte le plan de migration au format JSON
   */
  public exportToJson(outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(this.plans, null, 2));
    console.log(`Plan de migration généré avec succès dans : ${outputPath}`);
  }

  /**
   * Converti une chaîne en PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Obtient la forme singulière d'un nom de table
   */
  private getSingularName(tableName: string): string {
    // Règle simple : supprimer le 's' final
    const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
    // Convertir en camelCase pour un champ de relation
    return singular.charAt(0).toLowerCase() + this.toPascalCase(singular).slice(1);
  }

  /**
   * Obtient la forme plurielle d'un nom de table
   */
  private getPluralName(tableName: string): string {
    // Règle simple : ajouter un 's' si pas déjà présent
    const plural = tableName.endsWith('s') ? tableName : tableName + 's';
    // Convertir en camelCase pour un champ de relation
    return plural.charAt(0).toLowerCase() + this.toPascalCase(plural).slice(1);
  }

  /**
   * Normalise un type pour comparaison
   */
  private normalizeType(type: string): string {
    return type.toLowerCase().replace(/\(\d+(?:,\d+)?\)/g, '');
  }
}

// Point d'entrée
if (require.main === module) {
  // Chemin des fichiers d'entrée par défaut
  const schemaMapPath = process.argv[2] || './mysql_schema_map.json';
  const conversionResultPath = process.argv[3] || './type_conversion_result.json';
  const impactGraphPath = process.argv[4] || './impact_graph.json';

  // Chemin des fichiers de sortie par défaut
  const markdownOutputPath = process.argv[5] || './migration_plan.md';
  const jsonOutputPath = process.argv[6] || './migration_plan.json';

  try {
    const strategist = new MigrationStrategist(
      schemaMapPath,
      conversionResultPath,
      impactGraphPath
    );
    strategist.generateMigrationPlans();
    strategist.exportToMarkdown(markdownOutputPath);
    strategist.exportToJson(jsonOutputPath);
  } catch (error) {
    console.error('Erreur lors de la génération du plan de migration:', error);
    process.exit(1);
  }
}

export { MigrationStrategist };

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import {
  AnalyzerAgent,
  BusinessAgent,
} from '@workspaces/cahier-des-charge/src/core/interfaces/business';
