# Fiche de migration workflow n8n

## Informations générales
- **ID du workflow**: wf_1746401251546_sz6yj
- **Nom**: SQL Analyzer & Prisma Builder Workflow
- **Description**: Workflow qui analyse les structures SQL et génère des modèles Prisma correspondants
- **Criticité**: Haute
- **Complexité**: Complexe
- **Usage mensuel**: À déterminer lors de l'analyse des logs
- **Propriétaire**: Équipe Migration

## Analyse technique
- **Nombre d'étapes**: À déterminer lors de l'analyse du contenu du workflow
- **Nœuds utilisés**: HTTP Request, Function, IF, Database, JSON
- **Intégrations externes**: Base de données (MySQL, PostgreSQL), API Prisma
- **État persistant**: Oui
- **Durée moyenne d'exécution**: À déterminer

## Plan de migration
- **Technologie cible**: Temporal
- **Priorité**: P1
- **Date prévue**: Juin 2025
- **Responsable**: À désigner
- **Reviewers**: À désigner

## Stratégie de migration
- **Approche**: Parallèle
- **Points d'attention**:
  - Gestion des états persistants des analyses SQL
  - Traitement des différents dialectes SQL (MySQL, PostgreSQL)
  - Génération correcte des modèles Prisma avec relations
  - Support des types de données spécifiques à chaque SGBD
- **Risques identifiés**:
  - Perte de données d'analyse en cours lors de la migration
  - Incompatibilité des versions Prisma
  - Gestion différente des erreurs entre n8n et Temporal
- **Plan de test**:
  - Tests unitaires pour chaque activité Temporal
  - Tests d'intégration avec différentes bases de données
  - Comparaison des résultats entre ancien et nouveau système

## Implémentation Temporal
### Structure des activités

```typescript
// Activités nécessaires pour le workflow
export async function analyzeSQL(input: {
  connectionString: string,
  dialect: 'mysql' | 'postgres' | 'mssql',
  tables?: string[],
  schema?: string
}): Promise<SQLAnalysisResult> {
  // Analyse des structures de tables SQL
}

export async function generatePrismaSchema(input: {
  analysis: SQLAnalysisResult,
  options: PrismaGenerationOptions
}): Promise<PrismaSchemaResult> {
  // Génération du schéma Prisma à partir de l'analyse SQL
}

export async function validatePrismaSchema(input: {
  schema: string,
  connectionString: string
}): Promise<ValidationResult> {
  // Validation du schéma Prisma généré
}

export async function applyMigration(input: {
  schema: string,
  connectionString: string,
  options: MigrationOptions
}): Promise<MigrationResult> {
  // Application optionnelle de la migration
}
```

### Workflow principal Temporal

```typescript
export async function sqlAnalyzerPrismaBuilderWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  // Étape 1: Analyse des structures SQL
  const analysisResult = await activities.analyzeSQL({
    connectionString: input.connectionString,
    dialect: input.dialect,
    tables: input.tables,
    schema: input.schema
  });
  
  // Étape 2: Génération du schéma Prisma
  const prismaSchema = await activities.generatePrismaSchema({
    analysis: analysisResult,
    options: input.prismaOptions || defaultPrismaOptions
  });
  
  // Étape conditionnelle: Validation du schéma (si demandé)
  let validationResult;
  if (input.validateSchema) {
    validationResult = await activities.validatePrismaSchema({
      schema: prismaSchema.schema,
      connectionString: input.connectionString
    });
    
    // Vérifier si la validation a échoué
    if (!validationResult.success) {
      return {
        status: 'error',
        message: `Schema validation failed: ${validationResult.error}`,
        schema: prismaSchema.schema,
        analysisDetails: analysisResult
      };
    }
  }
  
  // Étape conditionnelle: Application de la migration (si demandé)
  let migrationResult;
  if (input.applyMigration) {
    migrationResult = await activities.applyMigration({
      schema: prismaSchema.schema,
      connectionString: input.connectionString,
      options: input.migrationOptions || defaultMigrationOptions
    });
  }
  
  // Résultat final
  return {
    status: 'completed',
    schema: prismaSchema.schema,
    analysisDetails: analysisResult,
    tables: analysisResult.tables.map(t => t.name),
    validationResult,
    migrationResult,
    completedAt: new Date().toISOString()
  };
}
```

## Migration des intégrations
### Client API pour intégration

```typescript
import { temporal } from '@notre-org/business/temporal';

/**
 * Client API pour SQL Analyzer & Prisma Builder
 */
export class SQLAnalyzerPrismaBuilder {
  /**
   * Analyse une base de données et génère un schéma Prisma
   */
  async analyze(options: {
    connectionString: string;
    dialect: 'mysql' | 'postgres' | 'mssql';
    tables?: string[];
    schema?: string;
    validateSchema?: boolean;
    applyMigration?: boolean;
    prismaOptions?: Record<string, any>;
    migrationOptions?: Record<string, any>;
  }): Promise<any> {
    const workflowId = `sql-analyzer-${Date.now()}`;
    
    return temporal.startWorkflow({
      workflowType: 'sqlAnalyzerPrismaBuilderWorkflow',
      taskQueue: 'sql-analyzer-queue',
      workflowId,
      args: [options]
    });
  }
  
  /**
   * Vérifie le statut d'une analyse en cours
   */
  async getStatus(workflowId: string): Promise<any> {
    return temporal.getWorkflowStatus(workflowId);
  }
}

// Export de l'instance pour utilisation dans l'application
export const sqlAnalyzer = new SQLAnalyzerPrismaBuilder();
```

## Mise en œuvre
- **PR**: À créer
- **Date de déploiement**: À déterminer
- **Période d'exécution parallèle**: 2 semaines
- **Date de désactivation n8n**: À déterminer après validation complète

## Résultats
- **Statut**: En attente
- **Incidents**: N/A
- **Performance comparative**: À mesurer durant la période d'exécution parallèle
- **Retours utilisateurs**: À collecter après déploiement