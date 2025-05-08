import { FastifyInstance } from 'fastify';
import { Connection, Client } from '@temporalio/client';
import { WorkflowInput } from '../workflows/sql-analyzer-workflow';

// Définition des interfaces pour le typage des requêtes
interface AnalyzeSqlRequest {
  Body: {
    connectionString?: string;
    dialect?: string;
    databaseName?: string;
    includeTables?: string[];
    excludeTables?: string[];
    schemaOnly?: boolean;
    generatePrisma?: boolean;
    analyzePerformance?: boolean;
    commitToGit?: boolean;
    createArchive?: boolean;
    validateSchema?: boolean;
    applyMigration?: boolean;
    gitBranch?: string;
    commitMessage?: string;
    author?: string;
    modelNaming?: string;
    includeComments?: boolean;
    includeIndexes?: boolean;
    datasourceProvider?: string;
    datasourceName?: string;
    outputFormat?: string;
    relationshipNaming?: string;
    migrationMode?: string;
    migrationForce?: boolean;
    skipSeed?: boolean;
    createOnly?: boolean;
  }
}

interface StatusRequest {
  Params: {
    workflowId: string;
  }
}

interface DownloadRequest {
  Params: {
    workflowId: string;
  }
}

// Configuration Temporal
const temporalConfig = {
  address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  namespace: process.env.TEMPORAL_NAMESPACE || 'default',
};

// Créer le plugin Fastify au lieu du routeur Express
export const sqlAnalyzerRouter = (fastify: FastifyInstance, opts: any, done: () => void) => {
  /**
   * Endpoint pour déclencher l'analyse SQL et la génération de modèles Prisma
   */
  fastify.post<AnalyzeSqlRequest>('/analyze-sql-prisma', async (request, reply) => {
    try {
      const connectionString = request.body.connectionString || process.env.DATABASE_URL;
      if (!connectionString) {
        return reply.code(400).send({
          error: 'Connection string is required. Provide it in the request body or set DATABASE_URL environment variable.'
        });
      }

      const workflow: WorkflowInput = {
        connectionString,
        dialect: request.body.dialect || 'mysql',
        databaseName: request.body.databaseName || 'application_db',
        tables: request.body.includeTables || [],
        excludeTables: request.body.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata'],
        outputDir: `/workspaces/cahier-des-charge/reports/sql-audit-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}`,
        schemaOnly: request.body.schemaOnly !== false,
        generatePrisma: request.body.generatePrisma !== false,
        analyzePerformance: request.body.analyzePerformance !== false,
        commitToGit: request.body.commitToGit !== false,
        createArchive: request.body.createArchive !== false,
        validateSchema: request.body.validateSchema !== false,
        applyMigration: request.body.applyMigration === true,
        gitOptions: {
          branchName: request.body.gitBranch || `audit-sql-${new Date().toISOString().slice(0, 10)}`,
          commitMessage: request.body.commitMessage || 'Audit SQL et génération de modèles Prisma automatisés',
          author: request.body.author || 'sql-analyzer-agent',
        },
        prismaOptions: {
          modelNaming: request.body.modelNaming || 'PascalCase',
          includeComments: request.body.includeComments !== false,
          includeIndexes: request.body.includeIndexes !== false,
          datasourceProvider: request.body.datasourceProvider || 'postgresql',
          datasourceName: request.body.datasourceName || 'db',
          outputFormat: request.body.outputFormat || 'prisma',
          relationshipNaming: request.body.relationshipNaming || 'explicit',
        },
        migrationOptions: request.body.applyMigration ? {
          mode: request.body.migrationMode || 'dev',
          force: request.body.migrationForce === true,
          skipSeed: request.body.skipSeed !== false,
          createOnly: request.body.createOnly === true,
        } : undefined,
      };

      // Se connecter au client Temporal
      const connection = await Connection.connect(temporalConfig);
      const client = new Client({ connection });

      // Générer un ID unique pour l'exécution du workflow
      const workflowId = `sql-analyzer-${Date.now()}`;

      // Démarrer le workflow
      const handle = await client.workflow.start('sqlAnalyzerPrismaBuilderWorkflow', {
        taskQueue: 'sql-analyzer-queue',
        workflowId,
        args: [workflow],
      });

      // Répondre immédiatement (mode asynchrone)
      return reply.code(202).send({
        message: 'SQL analyzer and Prisma builder workflow started successfully',
        workflowId,
        status: 'started',
        statusUrl: `/api/sql-analyzer/status/${workflowId}`,
        outputDir: workflow.outputDir,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting SQL analyzer workflow:', error);
      return reply.code(500).send({
        error: `Failed to start SQL analyzer workflow: ${error.message}`
      });
    }
  });

  /**
   * Endpoint pour vérifier le statut d'une analyse SQL
   */
  fastify.get<StatusRequest>('/status/:workflowId', async (request, reply) => {
    try {
      const { workflowId } = request.params;

      // Se connecter au client Temporal
      const connection = await Connection.connect(temporalConfig);
      const client = new Client({ connection });

      // Obtenir le handle du workflow
      const handle = client.workflow.getHandle(workflowId);

      // Vérifier si le workflow est toujours en cours d'exécution
      const isRunning = await handle.isRunning();

      if (isRunning) {
        return reply.code(200).send({
          workflowId,
          status: 'running',
          message: 'SQL analyzer workflow is still running',
          checkAgainIn: '30 seconds',
        });
      }

      // Si le workflow est terminé, récupérer le résultat
      try {
        const result = await handle.result();
        return reply.code(200).send({
          workflowId,
          status: result.status,
          message: result.message || 'SQL analyzer workflow completed',
          result,
        });
      } catch (error) {
        // Si le workflow a échoué
        return reply.code(200).send({
          workflowId,
          status: 'failed',
          error: error.message,
        });
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
      return reply.code(500).send({
        error: `Failed to check workflow status: ${error.message}`
      });
    }
  });

  /**
   * Endpoint pour télécharger l'archive des résultats
   */
  fastify.get<DownloadRequest>('/download/:workflowId', async (request, reply) => {
    try {
      const { workflowId } = request.params;

      // Se connecter au client Temporal
      const connection = await Connection.connect(temporalConfig);
      const client = new Client({ connection });

      // Obtenir le handle du workflow
      const handle = client.workflow.getHandle(workflowId);

      // Vérifier si le workflow est toujours en cours d'exécution
      const isRunning = await handle.isRunning();
      if (isRunning) {
        return reply.code(400).send({
          error: 'Workflow is still running, no results available yet'
        });
      }

      // Récupérer le résultat pour obtenir le chemin de l'archive
      const result = await handle.result();

      if (result.status !== 'completed' || !result.archivePath) {
        return reply.code(404).send({
          error: 'Archive not found or workflow did not complete successfully'
        });
      }

      // Envoyer le fichier
      return reply.sendFile(result.archivePath);
    } catch (error) {
      console.error('Error downloading results:', error);
      return reply.code(500).send({
        error: `Failed to download results: ${error.message}`
      });
    }
  });

  // Terminer l'enregistrement du plugin Fastify
  done();
};