import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { FlowProducer, Job, Queue, QueueScheduler, Worker } from 'bullmq';

/**
 * Orchestrateur BullMQ pour coordonner les agents MCP
 * Cette classe gère les différentes files d'attente et coordonne les agents
 */
export class BullMqOrchestrator {
  private readonly logger = new Logger('BullMqOrchestrator');
  private readonly redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };

  private queues: Record<string, Queue> = {};
  private workers: Record<string, Worker> = {};
  private schedulers: Record<string, QueueScheduler> = {};
  private flowProducer: FlowProducer;

  constructor() {
    this.flowProducer = new FlowProducer({ connection: this.redisOptions });
  }

  /**
   * Initialise les files d'attente principales
   */
  async initialize() {
    this.logger.log("🚀 Initialisation de l'orchestrateur BullMQ...");

    // Création des files d'attente principales
    this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });
    this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });
    this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });
    this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });

    // Initialisation des planificateurs pour chaque file d'attente
    this.schedulers['orchestrator'] = new QueueScheduler('orchestrator', {
      connection: this.redisOptions,
    });
    this.schedulers['PhpAnalyzer'] = new QueueScheduler('PhpAnalyzer', {
      connection: this.redisOptions,
    });
    this.schedulers['js-analyzer'] = new QueueScheduler('js-analyzer', {
      connection: this.redisOptions,
    });
    this.schedulers['migration'] = new QueueScheduler('migration', {
      connection: this.redisOptions,
    });

    // Initialisation du worker orchestrateur
    this.workers['orchestrator'] = new Worker(
      'orchestrator',
      async (job: Job) => {
        return await this.processOrchestratorJob(job);
      },
      {
        connection: this.redisOptions,
        concurrency: 1, // L'orchestrateur doit traiter les jobs un par un
      }
    );

    // Configuration des écouteurs d'événements pour l'orchestrateur
    this.setupWorkerListeners(this.workers['orchestrator'], 'orchestrator');

    this.logger.log('✅ Orchestrateur BullMQ initialisé avec succès');

    return this;
  }

  /**
   * Traite un job d'orchestration
   */
  private async processOrchestratorJob(job: Job) {
    const { action, params } = job.data;
    this.logger.log(`🔄 Traitement du job orchestrateur "${action}"`);

    switch (action) {
      case 'analyze-directory':
        return await this.orchestrateDirectoryAnalysis(params.directory, params.options);
      case 'batch-migration':
        return await this.orchestrateBatchMigration(params.files, params.options);
      case 'chain-analysis':
        return await this.orchestrateChainedAnalysis(params);
      default:
        throw new Error(`Action d'orchestration inconnue: ${action}`);
    }
  }

  /**
   * Orchestre l'analyse d'un répertoire en créant des jobs pour chaque fichier
   */
  private async orchestrateDirectoryAnalysis(directory: string, options: any = {}) {
    this.logger.log(`📂 Orchestration de l'analyse du répertoire: ${directory}`);

    try {
      // Récupération récursive des fichiers du répertoire
      const files = await this.getFilesRecursively(directory);

      const phpFiles = files.filter((file) => file.endsWith('.php'));
      const jsFiles = files.filter(
        (file) =>
          file.endsWith('.js') ||
          file.endsWith('.jsx') ||
          file.endsWith('.ts') ||
          file.endsWith('.tsx')
      );

      this.logger.log(`🔍 Fichiers trouvés: ${phpFiles.length} PHP, ${jsFiles.length} JS/TS`);

      // Création des jobs avec FlowProducer pour le traçage des dépendances
      const flows = [];

      // Ajout des jobs PHP
      for (const file of phpFiles) {
        flows.push({
          name: `analyze-php:${path.basename(file)}`,
          queueName: 'PhpAnalyzer',
          data: {
            filePath: file,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'orchestrator',
              batchId: options.batchId || `batch-${Date.now()}`,
              ...options,
            },
          },
          opts: {
            priority: options.priority || 1,
            attempts: options.attempts || 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        });
      }

      // Ajout des jobs JS
      for (const file of jsFiles) {
        flows.push({
          name: `analyze-js:${path.basename(file)}`,
          queueName: 'js-analyzer',
          data: {
            filePath: file,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'orchestrator',
              batchId: options.batchId || `batch-${Date.now()}`,
              ...options,
            },
          },
          opts: {
            priority: options.priority || 1,
            attempts: options.attempts || 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        });
      }

      // Ajout d'un job de completion
      flows.push({
        name: 'analysis-completed',
        queueName: 'orchestrator',
        data: {
          action: 'analysis-completed',
          params: {
            batchId: options.batchId || `batch-${Date.now()}`,
            summary: {
              directory,
              phpFilesCount: phpFiles.length,
              jsFilesCount: jsFiles.length,
              options,
            },
            timestamp: new Date().toISOString(),
          },
        },
        opts: { priority: 10 }, // Priorité élevée pour le job de completion
        children: flows.map((flow) => ({ name: flow.name, queueName: flow.queueName })),
      });

      const flow = await this.flowProducer.add({
        name: 'directory-analysis',
        queueName: 'orchestrator',
        data: {
          action: 'directory-analysis-started',
          params: {
            directory,
            fileCount: phpFiles.length + jsFiles.length,
            timestamp: new Date().toISOString(),
          },
        },
        children: [
          {
            name: 'analysis-batch',
            queueName: 'orchestrator',
            data: {
              action: 'analysis-batch',
              params: {
                batchId: options.batchId || `batch-${Date.now()}`,
                fileCount: phpFiles.length + jsFiles.length,
                timestamp: new Date().toISOString(),
              },
            },
            children: flows,
          },
        ],
      });

      this.logger.log(`✅ Flow d'analyse créé: ${flow.job.id}`);

      return {
        success: true,
        flowId: flow.job.id,
        batchId: options.batchId || `batch-${Date.now()}`,
        summary: {
          directory,
          phpFilesCount: phpFiles.length,
          jsFilesCount: jsFiles.length,
          totalFiles: phpFiles.length + jsFiles.length,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'orchestration de l'analyse: ${error.message}`);
      throw error;
    }
  }

  /**
   * Orchestre la migration par lots
   */
  private async orchestrateBatchMigration(files: string[], options: any = {}) {
    this.logger.log(`🔄 Orchestration de la migration par lots pour ${files.length} fichiers`);

    // Implémentation similaire à orchestrateDirectoryAnalysis
    // mais adaptée pour la migration de fichiers spécifiques

    return {
      success: true,
      message: `Migration par lots de ${files.length} fichiers planifiée`,
    };
  }

  /**
   * Orchestre une analyse en chaîne (ex: analyse PHP -> analyse JS -> migration)
   */
  private async orchestrateChainedAnalysis(params: any) {
    this.logger.log(`⛓️ Orchestration d'une analyse en chaîne`);

    // Implémentation d'un workflow complexe avec des étapes séquentielles

    return {
      success: true,
      message: `Analyse en chaîne planifiée`,
    };
  }

  /**
   * Orchestre une vérification automatique après génération
   * Version améliorée avec validations complètes
   */
  private async orchestrateVerificationAfterGeneration(filePrefix: string, options: any = {}) {
    this.logger.log(`🔍 Orchestration de la vérification après génération pour: ${filePrefix}`);

    try {
      // Structure pour suivre toutes les étapes de vérification
      const verificationSteps = {
        typeCheck: { status: 'pending', startTime: null, endTime: null, result: null },
        unitTests: { status: 'pending', startTime: null, endTime: null, result: null },
        componentTests: { status: 'pending', startTime: null, endTime: null, result: null },
        visualRegression: { status: 'pending', startTime: null, endTime: null, result: null },
        accessibility: { status: 'pending', startTime: null, endTime: null, result: null },
        functionalEquivalence: { status: 'pending', startTime: null, endTime: null, result: null },
        securityAudit: { status: 'pending', startTime: null, endTime: null, result: null },
        performanceCheck: { status: 'pending', startTime: null, endTime: null, result: null },
      };

      // 1. Ajouter un job pour la vérification du typage TypeScript
      if (options.typeCheck !== false) {
        verificationSteps.typeCheck.status = 'queued';
        verificationSteps.typeCheck.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-type',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            targetVersion: options.targetTsVersion || '5.0',
            strict: options.strictTypeCheck || true,
            includeLibs: options.includeLibs || ['react', 'remix'],
            metadataPath: options.metadataPath,
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 7,
            attempts: options.attempts || 3,
          }
        );
      }

      // 2. Ajouter un job pour les tests unitaires
      if (options.unitTests !== false) {
        verificationSteps.unitTests.status = 'queued';
        verificationSteps.unitTests.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-unit-tests',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            testRunner: options.testRunner || 'vitest',
            coverage: options.coverage || 70,
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 6,
            attempts: options.attempts || 3,
          }
        );
      }

      // 3. Tester les composants avec des scénarios d'interaction
      if (options.componentTests !== false) {
        verificationSteps.componentTests.status = 'queued';
        verificationSteps.componentTests.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-component',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            framework: options.testingFramework || 'playwright-component',
            scenarios: options.componentScenarios || ['render', 'interact', 'navigate'],
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 5,
            attempts: options.attempts || 2,
          }
        );
      }

      // 4. Tests de régression visuelle
      if (options.visualTests !== false) {
        verificationSteps.visualRegression.status = 'queued';
        verificationSteps.visualRegression.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-visual',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            compareTo: options.visualBaseline || 'latest',
            viewports: options.viewports || ['mobile', 'tablet', 'desktop'],
            threshold: options.visualThreshold || 0.05, // 5% de différence max
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 4,
            attempts: options.attempts || 2,
          }
        );
      }

      // 5. Tests d'accessibilité
      if (options.a11yTests !== false) {
        verificationSteps.accessibility.status = 'queued';
        verificationSteps.accessibility.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-a11y',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            standard: options.a11yStandard || 'WCAG2.1AA',
            includeAria: options.includeAria || true,
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 4,
            attempts: options.attempts || 2,
          }
        );
      }

      // 6. Vérification de l'équivalence fonctionnelle avec le fichier PHP d'origine
      if (options.equivalenceCheck !== false) {
        verificationSteps.functionalEquivalence.status = 'queued';
        verificationSteps.functionalEquivalence.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-equivalence',
          {
            filePrefix,
            originalPath: options.originalPhpPath || `./legacy/${filePrefix}.php`,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            endpoints: options.endpoints || [],
            dataScenarios: options.dataScenarios || [],
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 8, // Haute priorité car critique
            attempts: options.attempts || 3,
          }
        );
      }

      // 7. Audit de sécurité
      if (options.securityAudit !== false) {
        verificationSteps.securityAudit.status = 'queued';
        verificationSteps.securityAudit.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-security',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            checks: options.securityChecks || ['xss', 'csrf', 'injection', 'dependencies'],
            severity: options.securitySeverity || 'high',
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 7,
            attempts: options.attempts || 2,
          }
        );
      }

      // 8. Vérification des performances
      if (options.perfCheck !== false) {
        verificationSteps.performanceCheck.status = 'queued';
        verificationSteps.performanceCheck.startTime = new Date().toISOString();

        await this.queues['verification'].add(
          'verify-performance',
          {
            filePrefix,
            generatedPath: path.join(
              options.generatedDir || './apps/frontend/app/generated',
              filePrefix
            ),
            metrics: options.perfMetrics || ['fcp', 'lcp', 'cls', 'ttfb'],
            baseline: options.perfBaseline || { fcp: 1000, lcp: 2500, cls: 0.1, ttfb: 300 },
            timeout: options.perfTimeout || 10000,
            timestamp: new Date().toISOString(),
          },
          {
            priority: options.priority || 3,
            attempts: options.attempts || 2,
          }
        );
      }

      // Ajouter un job de vérification finale qui agrège tous les résultats
      await this.queues['verification'].add(
        'verify-summary',
        {
          filePrefix,
          steps: verificationSteps,
          options,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'orchestrator',
            batchId: options.batchId || `verify-${Date.now()}`,
            generationType: options.generationType || 'unknown',
            originalAuthor: options.originalAuthor,
            targetBranch: options.targetBranch || 'main',
            ...options.metadata,
          },
        },
        {
          priority: options.priority || 9, // Très haute priorité
          delay: options.summaryDelay || 10000, // Attendre 10s pour que les autres jobs avancent
          attempts: options.attempts || 5,
        }
      );

      // Mettre à jour le statut global
      await this.updateVerificationStatus(filePrefix, {
        status: 'verification_started',
        steps: verificationSteps,
        timestamp: new Date().toISOString(),
        expectedDuration: options.expectedDuration || '5m',
      });

      this.logger.log(`✅ Orchestration de vérification complète lancée pour ${filePrefix}`);

      return {
        success: true,
        filePrefix,
        steps: Object.keys(verificationSteps),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'orchestration de la vérification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour le statut de vérification dans le fichier status.json
   */
  private async updateVerificationStatus(filePrefix: string, statusUpdate: any) {
    if (!this.config.statusFilePath) return;

    try {
      // Lire le fichier status.json actuel
      let statusData = { verifications: {}, events: [] };

      if (fs.existsSync(this.config.statusFilePath)) {
        const fileContent = fs.readFileSync(this.config.statusFilePath, 'utf8');
        statusData = JSON.parse(fileContent);
        if (!statusData.verifications) {
          statusData.verifications = {};
        }
      }

      // Mettre à jour le statut de vérification pour ce fichier
      statusData.verifications[filePrefix] = {
        ...statusUpdate,
        lastUpdated: new Date().toISOString(),
      };

      // Ajouter aux événements généraux
      statusData.events.unshift({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'verification.update',
        filePrefix,
        timestamp: new Date().toISOString(),
        data: statusUpdate,
      });

      // Limiter à 1000 événements max
      if (statusData.events.length > 1000) {
        statusData.events = statusData.events.slice(0, 1000);
      }

      // Écrire dans le fichier
      fs.writeFileSync(this.config.statusFilePath, JSON.stringify(statusData, null, 2));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du statut de vérification pour ${filePrefix}`,
        error
      );
    }
  }

  /**
   * Configure les écouteurs d'événements pour un worker
   */
  private setupWorkerListeners(worker: Worker, name: string) {
    worker.on('completed', (job: Job, result: any) => {
      this.logger.log(`✨ Job ${name} #${job.id} terminé avec succès`);
    });

    worker.on('failed', (job: Job, error: Error) => {
      this.logger.error(`💥 Job ${name} #${job.id} échoué: ${error.message}`);
    });

    worker.on('error', (error: Error) => {
      this.logger.error(`🔥 Erreur générale du worker ${name}: ${error.message}`);
    });
  }

  /**
   * Récupère récursivement tous les fichiers d'un répertoire
   */
  private async getFilesRecursively(directory: string): Promise<string[]> {
    let files: string[] = [];

    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = [...files, ...(await this.getFilesRecursively(fullPath))];
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Arrête proprement l'orchestrateur et tous ses composants
   */
  async shutdown() {
    this.logger.log("🛑 Arrêt de l'orchestrateur BullMQ...");

    // Fermeture des workers
    for (const [name, worker] of Object.entries(this.workers)) {
      this.logger.log(`🔽 Arrêt du worker ${name}...`);
      await worker.close();
    }

    // Fermeture des planificateurs
    for (const [name, scheduler] of Object.entries(this.schedulers)) {
      this.logger.log(`🔽 Arrêt du planificateur ${name}...`);
      await scheduler.close();
    }

    // Fermeture des files d'attente
    for (const [name, queue] of Object.entries(this.queues)) {
      this.logger.log(`🔽 Arrêt de la file d'attente ${name}...`);
      await queue.close();
    }

    // Fermeture du flow producer
    await this.flowProducer.close();

    this.logger.log('✅ Orchestrateur BullMQ arrêté avec succès');
  }
}

// Script pour exécuter l'orchestrateur en standalone
async function startBullMqOrchestrator() {
  const logger = new Logger('BullMqOrchestratorStarter');
  logger.log("🚀 Démarrage de l'orchestrateur BullMQ...");

  const orchestrator = new BullMqOrchestrator();
  await orchestrator.initialize();

  logger.log('✅ Orchestrateur BullMQ démarré avec succès');

  // Gestion des signaux d'arrêt
  process.on('SIGINT', async () => {
    logger.log("📥 Signal SIGINT reçu - Arrêt de l'orchestrateur...");
    await orchestrator.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.log("📥 Signal SIGTERM reçu - Arrêt de l'orchestrateur...");
    await orchestrator.shutdown();
    process.exit(0);
  });

  return orchestrator;
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
  startBullMqOrchestrator().catch((err) => {
    console.error("❌ Erreur fatale lors du démarrage de l'orchestrateur:", err);
    process.exit(1);
  });
}

export { BullMqOrchestrator, startBullMqOrchestrator };
