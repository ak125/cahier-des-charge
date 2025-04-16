/**
 * Migration Orchestrator Agent
 * 
 * Agent responsable de l'orchestration intelligente, automatisée et priorisée
 * des migrations PHP vers Remix, parfaitement adaptée à la complexité du monorepo.
 * 
 * Fonctionnalités principales:
 * - Lecture de discovery_map.json pour connaître les fichiers à migrer
 * - Vérification de l'état actuel des migrations via status.json
 * - Résolution des dépendances entre fichiers
 * - Lancement séquentiel des agents nécessaires dans le bon ordre
 * - Gestion des dry-runs dans le dossier /simulations/
 * - Actualisation du tableau de bord via Supabase
 */

import { Logger } from '@nestjs/common';
import fs from 'fs-extra';
import path from 'path';
import { Queue, Worker } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createClient } from 'redis';
import { Context } from '@temporalio/activity';
import { proxyActivities } from '@temporalio/workflow';
import Redis from 'ioredis';

// Types
interface DependencyMap {
  [filePath: string]: string[];
}

interface DiscoveryItem {
  name: string;
  path: string;
  type: string;
  priority: number;
  dependencies?: string[];
  metadata?: {
    routeType?: string;
    isCritical?: boolean;
    hasDatabase?: boolean;
    hasAuthentication?: boolean;
  };
}

interface StatusData {
  lastUpdated: string;
  summary: {
    total: number;
    pending: number;
    done: number;
    invalid: number;
  };
  files: {
    [filename: string]: {
      status: JobStatus;
      agent: string;
      lastUpdated: string;
      error?: string;
    };
  };
}

type JobStatus = 'pending' | 'running' | 'done' | 'invalid';
type AgentType = 'php-analyzer' | 'remix-generator' | 'qa-analyzer' | 'diff-verifier' | 'dev-linter';

// Configuration
interface MigrationOrchestratorConfig {
  discoveryMapPath?: string;
  statusJsonPath?: string;
  simulationDir?: string;
  dependenciesMapPath?: string;
  redisUrl?: string;
  dryRun?: boolean;
  maxConcurrent?: number;
}

// Définition des étapes du workflow
export enum MigrationStep {
  INIT = 'init',
  ANALYZE_PHP = 'analyze_php',
  GENERATE_REMIX = 'generate_remix',
  VALIDATE = 'validate',
  QA_CHECK = 'qa_check',
  CREATE_PR = 'create_pr',
  COMPLETE = 'complete',
  ERROR = 'error'
}

// Interface pour le statut de migration
export interface MigrationStatus {
  id: string;
  file: string;
  step: MigrationStep;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

// Interface pour les options de migration
export interface MigrationOptions {
  file: string;
  generateTests?: boolean;
  createPR?: boolean;
  qaThreshold?: number;
  checkAccessibility?: boolean;
  enableSeoCheck?: boolean;
  enableUnitTests?: boolean;
}

// Définition des activités
const { 
  analyzePhp, 
  generateRemix, 
  validateMigration, 
  qaCheck, 
  createGitHubPr,
  updateStatus,
  notifyCompletion
} = proxyActivities<typeof Activities>({
  startToCloseTimeout: '10 minutes',
});

// Interface pour les résultats d'analyse PHP
interface PhpAnalysisResult {
  routes: string[];
  fields: string[];
  dependencies: string[];
  queries: string[];
  formFields: string[];
  validationRules: Record<string, any>;
  comments: string[];
}

// Interface pour les résultats de génération Remix
interface RemixGenerationResult {
  routeFile: string;
  loaderFile?: string;
  actionFile?: string;
  modelFiles?: string[];
  testsGenerated?: boolean;
}

/**
 * Workflow principal pour la migration de PHP vers Remix
 */
export async function phpToRemixMigrationWorkflow(options: MigrationOptions): Promise<MigrationStatus> {
  // Initialisation du status
  const migrationId = `migration-${options.file}-${Date.now()}`;
  let status: MigrationStatus = {
    id: migrationId,
    file: options.file,
    step: MigrationStep.INIT,
    progress: 0,
    status: 'pending',
    startTime: new Date().toISOString()
  };

  try {
    // Mise à jour du statut
    status.status = 'in-progress';
    await updateStatus(status);

    // Étape 1: Analyse du fichier PHP
    status.step = MigrationStep.ANALYZE_PHP;
    status.progress = 10;
    await updateStatus(status);
    
    const phpAnalysis = await analyzePhp(options.file);
    
    status.progress = 30;
    await updateStatus(status);

    // Étape 2: Génération des fichiers Remix
    status.step = MigrationStep.GENERATE_REMIX;
    await updateStatus(status);
    
    const remixGeneration = await generateRemix({
      file: options.file,
      phpAnalysis,
      generateTests: options.generateTests || false
    });
    
    status.progress = 50;
    await updateStatus(status);

    // Étape 3: Validation de la migration
    status.step = MigrationStep.VALIDATE;
    await updateStatus(status);
    
    const validationResult = await validateMigration({
      file: options.file,
      remixGeneration
    });
    
    status.progress = 70;
    await updateStatus(status);

    // Étape 4: QA Check
    status.step = MigrationStep.QA_CHECK;
    await updateStatus(status);
    
    const qaResult = await qaCheck({
      file: options.file,
      threshold: options.qaThreshold || 95,
      checkAccessibility: options.checkAccessibility || false,
      enableSeoCheck: options.enableSeoCheck || true
    });

    status.progress = 90;
    await updateStatus(status);

    // Étape 5: Création d'une PR si l'option est activée et les contrôles QA sont passés
    if (options.createPR && qaResult.score >= (options.qaThreshold || 95)) {
      status.step = MigrationStep.CREATE_PR;
      await updateStatus(status);
      
      await createGitHubPr({
        file: options.file,
        remixGeneration,
        qaResult
      });
    }

    // Finalisation du workflow
    status.step = MigrationStep.COMPLETE;
    status.progress = 100;
    status.status = 'completed';
    status.endTime = new Date().toISOString();
    status.result = {
      phpAnalysis,
      remixGeneration,
      validationResult,
      qaResult
    };
    
    await updateStatus(status);
    await notifyCompletion(status);

    return status;
  } catch (error) {
    // En cas d'erreur
    status.step = MigrationStep.ERROR;
    status.status = 'failed';
    status.error = error instanceof Error ? error.message : String(error);
    status.endTime = new Date().toISOString();
    
    await updateStatus(status);
    
    throw error;
  }
}

/**
 * Activités du workflow
 */
export const Activities = {
  /**
   * Analyse le fichier PHP et extrait les informations nécessaires
   */
  async analyzePhp(file: string): Promise<PhpAnalysisResult> {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const cachedResult = await redis.get(`php-analysis:${file}`);
    
    if (cachedResult) {
      await redis.quit();
      return JSON.parse(cachedResult);
    }
    
    console.log(`Analyzing PHP file: ${file}`);
    
    // Logique d'analyse PHP réelle à implémenter ici
    // Pour l'exemple, nous simulons un résultat d'analyse
    const result: PhpAnalysisResult = {
      routes: [`/${file.replace('.php', '')}`],
      fields: ['id', 'title', 'content', 'created_at'],
      dependencies: ['database', 'auth', 'validation'],
      queries: ['SELECT * FROM posts WHERE id = ?'],
      formFields: ['title', 'content'],
      validationRules: {
        title: { required: true, max: 100 },
        content: { required: true }
      },
      comments: ['// TODO: Implement file upload']
    };
    
    // Cache le résultat
    await redis.set(`php-analysis:${file}`, JSON.stringify(result), 'EX', 3600); // expire après 1h
    await redis.quit();
    
    return result;
  },
  
  /**
   * Génère les fichiers Remix à partir de l'analyse PHP
   */
  async generateRemix({ file, phpAnalysis, generateTests }: { 
    file: string; 
    phpAnalysis: PhpAnalysisResult; 
    generateTests: boolean;
  }): Promise<RemixGenerationResult> {
    console.log(`Generating Remix files for: ${file}`);
    
    // Logique de génération Remix réelle à implémenter ici
    // Pour l'exemple, nous simulons un résultat de génération
    const baseName = file.replace('.php', '');
    
    const result: RemixGenerationResult = {
      routeFile: `app/routes/${baseName}.tsx`,
      loaderFile: `app/routes/${baseName}.loader.ts`,
      actionFile: `app/routes/${baseName}.action.ts`,
      modelFiles: [`app/models/${baseName}.server.ts`],
      testsGenerated: generateTests
    };
    
    if (generateTests) {
      // Simulation de la génération de tests
      console.log(`Generating tests for: ${file}`);
    }
    
    return result;
  },
  
  /**
   * Valide la migration pour s'assurer que tous les éléments ont été correctement convertis
   */
  async validateMigration({ file, remixGeneration }: { 
    file: string; 
    remixGeneration: RemixGenerationResult;
  }): Promise<{ valid: boolean; errors: string[] }> {
    console.log(`Validating migration for: ${file}`);
    
    // Logique de validation réelle à implémenter ici
    // Pour l'exemple, nous simulons un résultat de validation
    const errors: string[] = [];
    
    // Vérifications simulées
    const valid = Math.random() > 0.2; // 80% de chances de succès
    
    if (!valid) {
      errors.push('Certains champs de formulaire n\'ont pas été migrés correctement');
    }
    
    return { valid, errors };
  },
  
  /**
   * Effectue des vérifications de qualité sur la migration
   */
  async qaCheck({ file, threshold, checkAccessibility, enableSeoCheck }: {
    file: string;
    threshold: number;
    checkAccessibility: boolean;
    enableSeoCheck: boolean;
  }): Promise<{ score: number; details: Record<string, any> }> {
    console.log(`Performing QA check for: ${file}`);
    
    // Logique de QA réelle à implémenter ici
    // Pour l'exemple, nous simulons un résultat QA
    const score = Math.floor(Math.random() * 20) + 81; // Score entre 81 et 100
    
    const details: Record<string, any> = {
      fieldsScore: Math.min(100, score + 5),
      routesScore: Math.min(100, score - 2),
      typesScore: Math.min(100, score + 3),
      testsScore: Math.min(100, score - 5)
    };
    
    if (checkAccessibility) {
      details.accessibilityScore = Math.min(100, Math.floor(Math.random() * 20) + 75);
    }
    
    if (enableSeoCheck) {
      details.seoScore = Math.min(100, Math.floor(Math.random() * 20) + 80);
    }
    
    return { score, details };
  },
  
  /**
   * Crée une Pull Request GitHub pour la migration
   */
  async createGitHubPr({ file, remixGeneration, qaResult }: {
    file: string;
    remixGeneration: RemixGenerationResult;
    qaResult: { score: number; details: Record<string, any> };
  }): Promise<{ url: string; number: number }> {
    console.log(`Creating GitHub PR for: ${file}`);
    
    // Logique de création de PR réelle à implémenter ici
    // Pour l'exemple, nous simulons une création de PR
    
    // Simule un numéro de PR et une URL
    const prNumber = Math.floor(Math.random() * 1000) + 1;
    const url = `https://github.com/your-org/your-repo/pull/${prNumber}`;
    
    return { url, number: prNumber };
  },
  
  /**
   * Met à jour le statut de la migration
   */
  async updateStatus(status: MigrationStatus): Promise<void> {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    console.log(`Updating migration status: ${status.file} (${status.step}) - ${status.progress}%`);
    
    await redis.set(`migration-status:${status.id}`, JSON.stringify(status));
    await redis.publish('migration-updates', JSON.stringify(status));
    
    await redis.quit();
  },
  
  /**
   * Notifie la fin de la migration
   */
  async notifyCompletion(status: MigrationStatus): Promise<void> {
    console.log(`Migration completed for: ${status.file} with status: ${status.status}`);
    
    // Logique de notification réelle à implémenter ici
    // (par exemple, envoi d'un e-mail, notification Slack, etc.)
    const info = {
      file: status.file,
      status: status.status,
      duration: new Date(status.endTime || Date.now()).getTime() - new Date(status.startTime).getTime(),
      result: status.result
    };
    
    // Exemple de notification via un webhook externe
    try {
      const webhookUrl = process.env.NOTIFICATION_WEBHOOK;
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(info)
        });
        
        if (!response.ok) {
          console.error(`Failed to send notification: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
};

/**
 * Agent d'orchestration des migrations
 */
export class MigrationOrchestrator {
  private readonly logger = new Logger('MigrationOrchestrator');
  private readonly discoveryMapPath: string;
  private readonly statusJsonPath: string;
  private readonly simulationDir: string;
  private readonly dependenciesMapPath: string;
  private readonly redisClient: ReturnType<typeof createClient>;
  private readonly eventEmitter: EventEmitter2;
  private readonly dryRun: boolean;
  private readonly maxConcurrent: number;
  
  private discoveryMap: DiscoveryItem[] = [];
  private statusData: StatusData | null = null;
  private dependencyMap: DependencyMap = {};
  private processingQueue: string[] = [];
  private currentlyProcessing: Set<string> = new Set();
  
  /**
   * Constructeur
   */
  constructor(
    private readonly config: MigrationOrchestratorConfig = {}
  ) {
    this.discoveryMapPath = config.discoveryMapPath || './discovery_map.json';
    this.statusJsonPath = config.statusJsonPath || './status.json';
    this.simulationDir = config.simulationDir || './simulations';
    this.dependenciesMapPath = config.dependenciesMapPath || './dependencies_map.json';
    this.dryRun = config.dryRun || false;
    this.maxConcurrent = config.maxConcurrent || 3;
    
    // Connexion Redis
    this.redisClient = createClient({
      url: config.redisUrl || 'redis://localhost:6379'
    });
    
    // Event emitter
    this.eventEmitter = new EventEmitter2();
  }
  
  /**
   * Initialise l'orchestrateur
   */
  async initialize(): Promise<void> {
    this.logger.log('Initialisation de MigrationOrchestrator');
    
    try {
      // Créer le répertoire de simulation s'il n'existe pas
      await fs.ensureDir(this.simulationDir);
      
      // Charger discovery_map.json s'il existe
      await this.loadDiscoveryMap();
      
      // Charger status.json
      await this.loadStatusData();
      
      // Charger ou générer la carte de dépendances
      await this.loadOrGenerateDependencyMap();
      
      // Se connecter à Redis
      await this.redisClient.connect();
      
      this.logger.log('MigrationOrchestrator initialisé avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'initialisation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Charge la carte des découvertes
   */
  private async loadDiscoveryMap(): Promise<void> {
    try {
      if (await fs.pathExists(this.discoveryMapPath)) {
        this.discoveryMap = await fs.readJson(this.discoveryMapPath);
        this.logger.log(`Discovery map chargée: ${this.discoveryMap.length} fichiers trouvés`);
      } else {
        this.logger.warn(`Le fichier discovery_map.json n'existe pas à ${this.discoveryMapPath}`);
        // Création d'un fichier vide pour éviter les erreurs
        await fs.writeJson(this.discoveryMapPath, [], { spaces: 2 });
        this.discoveryMap = [];
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement de discovery_map.json: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Charge les données de statut
   */
  private async loadStatusData(): Promise<void> {
    try {
      if (await fs.pathExists(this.statusJsonPath)) {
        this.statusData = await fs.readJson(this.statusJsonPath);
        this.logger.log(`Statut chargé: ${Object.keys(this.statusData.files).length} fichiers`);
      } else {
        this.logger.warn(`Le fichier status.json n'existe pas à ${this.statusJsonPath}`);
        // Initialiser avec des données vides
        this.statusData = {
          lastUpdated: new Date().toISOString(),
          summary: {
            total: 0,
            pending: 0,
            done: 0,
            invalid: 0
          },
          files: {}
        };
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement de status.json: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Charge ou génère la carte de dépendances
   */
  private async loadOrGenerateDependencyMap(): Promise<void> {
    try {
      if (await fs.pathExists(this.dependenciesMapPath)) {
        this.dependencyMap = await fs.readJson(this.dependenciesMapPath);
        this.logger.log(`Carte de dépendances chargée: ${Object.keys(this.dependencyMap).length} fichiers`);
      } else {
        this.logger.warn(`Le fichier de dépendances n'existe pas, génération automatique...`);
        await this.generateDependencyMap();
        await fs.writeJson(this.dependenciesMapPath, this.dependencyMap, { spaces: 2 });
        this.logger.log(`Carte de dépendances générée: ${Object.keys(this.dependencyMap).length} fichiers`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du chargement/génération des dépendances: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Génère la carte de dépendances basée sur les inclusions PHP
   * et les importations de modèles
   */
  private async generateDependencyMap(): Promise<void> {
    this.dependencyMap = {};
    
    // Utiliser les dépendances déclarées dans discovery_map.json si disponibles
    for (const item of this.discoveryMap) {
      if (item.dependencies && Array.isArray(item.dependencies)) {
        this.dependencyMap[item.name] = item.dependencies;
      } else {
        this.dependencyMap[item.name] = [];
      }
    }
  }
  
  /**
   * Vérifie si un fichier est prêt à être traité
   * (toutes ses dépendances sont complétées)
   */
  private isFileReady(fileName: string): boolean {
    if (!this.statusData) return false;
    
    // Si le fichier est déjà traité, il n'est pas prêt pour un nouveau traitement
    if (this.statusData.files[fileName]?.status === 'done') {
      return false;
    }
    
    // Si le fichier est déjà en cours de traitement, il n'est pas prêt
    if (this.currentlyProcessing.has(fileName)) {
      return false;
    }
    
    // Vérifier les dépendances
    const dependencies = this.dependencyMap[fileName] || [];
    
    for (const dep of dependencies) {
      if (!this.statusData.files[dep] || this.statusData.files[dep].status !== 'done') {
        return false; // Une dépendance n'est pas terminée
      }
    }
    
    return true;
  }
  
  /**
   * Ordonne les fichiers selon leur priorité et leurs dépendances
   */
  private calculateProcessingQueue(): string[] {
    const queue: string[] = [];
    const priorityMap = new Map<string, number>();
    
    // Assigner les priorités
    for (const item of this.discoveryMap) {
      let priority = item.priority || 0;
      
      // Augmenter la priorité pour les fichiers critiques
      if (item.metadata?.isCritical) {
        priority += 100;
      }
      
      priorityMap.set(item.name, priority);
    }
    
    // Ajouter les fichiers prêts à être traités à la queue
    for (const item of this.discoveryMap) {
      if (this.isFileReady(item.name)) {
        queue.push(item.name);
      }
    }
    
    // Trier la queue par priorité décroissante
    queue.sort((a, b) => {
      const priorityA = priorityMap.get(a) || 0;
      const priorityB = priorityMap.get(b) || 0;
      return priorityB - priorityA;
    });
    
    return queue;
  }
  
  /**
   * Lance un agent pour traiter un fichier spécifique
   */
  private async launchAgent(agentType: AgentType, fileName: string): Promise<void> {
    try {
      this.logger.log(`Lancement de l'agent ${agentType} pour ${fileName}`);
      
      // Marquer comme en cours de traitement
      this.currentlyProcessing.add(fileName);
      
      // En mode simulation, créer un fichier dans le dossier de simulation
      if (this.dryRun) {
        const simulationFile = path.join(this.simulationDir, `${fileName}.${agentType}.json`);
        await fs.writeJson(simulationFile, {
          agent: agentType,
          fileName,
          timestamp: new Date().toISOString(),
          isDryRun: true
        }, { spaces: 2 });
        
        this.logger.log(`Simulation écrite dans ${simulationFile}`);
      } 
      // Sinon, ajouter un job à la queue Redis
      else {
        const queue = new Queue('mcp-jobs', {
          connection: this.redisClient
        });
        
        // Trouver l'item dans discovery_map pour les métadonnées
        const discoveryItem = this.discoveryMap.find(item => item.name === fileName);
        
        await queue.add(agentType, {
          filename: fileName,
          filePath: discoveryItem?.path || fileName,
          timestamp: new Date().toISOString(),
          metadata: discoveryItem?.metadata || {}
        }, {
          attempts: 3,
          removeOnComplete: false,
          removeOnFail: false
        });
        
        this.logger.log(`Job ajouté à la queue Redis pour ${fileName}`);
      }
      
      // En mode dry-run, on simule la complétion immédiate
      if (this.dryRun) {
        setTimeout(() => {
          this.currentlyProcessing.delete(fileName);
          this.emitAgentComplete(fileName, agentType);
        }, 1000);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors du lancement de l'agent ${agentType} pour ${fileName}: ${error.message}`);
      this.currentlyProcessing.delete(fileName);
      throw error;
    }
  }
  
  /**
   * Émet un événement de complétion d'agent (pour le mode dry-run)
   */
  private emitAgentComplete(fileName: string, agentType: AgentType): void {
    this.eventEmitter.emit('agent.complete', { fileName, agentType });
  }
  
  /**
   * Traite l'étape suivante de la migration orchestrée
   */
  private async processNextBatch(): Promise<boolean> {
    // Recalculer la queue de traitement à chaque itération
    this.processingQueue = this.calculateProcessingQueue();
    
    if (this.processingQueue.length === 0) {
      this.logger.log('Aucun fichier prêt à être traité');
      return false;
    }
    
    const batchSize = Math.min(this.maxConcurrent - this.currentlyProcessing.size, this.processingQueue.length);
    
    if (batchSize <= 0) {
      this.logger.log(`Nombre maximum de traitements simultanés atteint (${this.currentlyProcessing.size}/${this.maxConcurrent})`);
      return true; // Toujours des tâches à traiter mais on attend
    }
    
    // Traiter le prochain lot
    const batch = this.processingQueue.slice(0, batchSize);
    
    for (const fileName of batch) {
      // Déterminer quel agent lancer en fonction de l'état actuel
      // En général, on commence par l'analyse PHP
      await this.launchAgent('php-analyzer', fileName);
    }
    
    return true;
  }
  
  /**
   * Configurer les écouteurs pour les événements de queue Redis
   */
  private setupQueueListeners(): void {
    const worker = new Worker('mcp-jobs', async job => {
      // Ne rien faire ici, juste pour écouter les événements
    }, {
      connection: this.redisClient,
      autorun: false // Ne pas traiter les jobs, juste écouter
    });
    
    worker.on('completed', job => {
      if (job.data?.filename) {
        this.currentlyProcessing.delete(job.data.filename);
        
        // Déclencher le traitement du lot suivant
        setTimeout(() => this.processNextBatch(), 500);
      }
    });
    
    worker.on('failed', job => {
      if (job.data?.filename) {
        this.currentlyProcessing.delete(job.data.filename);
        
        // Déclencher le traitement du lot suivant
        setTimeout(() => this.processNextBatch(), 500);
      }
    });
    
    // Pour le mode dry-run
    this.eventEmitter.on('agent.complete', () => {
      // Déclencher le traitement du lot suivant
      setTimeout(() => this.processNextBatch(), 500);
    });
  }
  
  /**
   * Vérifie les résultats du dry-run
   */
  async checkDryRunResults(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    if (!this.dryRun) {
      this.logger.warn('Cette méthode ne doit être appelée qu'en mode dry-run');
      return results;
    }
    
    try {
      const files = await fs.readdir(this.simulationDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.simulationDir, file);
          const content = await fs.readJson(filePath);
          
          const baseName = path.basename(file, '.json');
          results[baseName] = content;
        }
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la vérification des résultats de simulation: ${error.message}`);
    }
    
    return results;
  }
  
  /**
   * Démarre l'orchestrateur de migration
   */
  async run(): Promise<void> {
    await this.initialize();
    
    this.logger.log('Démarrage de MigrationOrchestrator');
    
    // Configurer les écouteurs de queue Redis
    this.setupQueueListeners();
    
    // Commencer le traitement
    const hasMoreTasks = await this.processNextBatch();
    
    if (!hasMoreTasks) {
      this.logger.log('Pas de tâches à traiter, orchestrateur terminé');
    } else if (this.dryRun) {
      this.logger.log('Mode dry-run: résultats disponibles dans le dossier de simulation');
    } else {
      this.logger.log('Orchestrateur démarré, traitement des jobs en cours');
    }
  }
  
  /**
   * Obtient le statut actuel de l'orchestrateur
   */
  getStatus(): any {
    return {
      discoveryMapSize: this.discoveryMap.length,
      dependenciesMapSize: Object.keys(this.dependencyMap).length,
      currentlyProcessing: Array.from(this.currentlyProcessing),
      processingQueueSize: this.processingQueue.length,
      dryRun: this.dryRun,
      maxConcurrent: this.maxConcurrent
    };
  }
  
  /**
   * Arrête proprement l'orchestrateur
   */
  async cleanup(): Promise<void> {
    try {
      // Déconnexion de Redis
      await this.redisClient.disconnect();
      
      this.logger.log('MigrationOrchestrator arrêté proprement');
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'arrêt: ${error.message}`);
    }
  }
  
  /**
   * Obtient la version de l'agent
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const orchestrator = new MigrationOrchestrator({
      dryRun: process.argv.includes('--dry-run')
    });
    
    try {
      await orchestrator.run();
      
      // Si c'est un dry-run, afficher les résultats
      if (process.argv.includes('--dry-run')) {
        const results = await orchestrator.checkDryRunResults();
        console.log('Résultats du dry-run:', JSON.stringify(results, null, 2));
        await orchestrator.cleanup();
        process.exit(0);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'orchestrateur:', error);
      await orchestrator.cleanup();
      process.exit(1);
    }
  })();
}