import { PrismaClient } from '@prisma/client';
import { WorkflowCheckpoint, CheckpointStatus, RetryStrategy, ErrorCategory, WorkflowError } from './types';
import { DatabaseService } from './database-service';
import { createLogger } from '../../utils/logger';

/**
 * Gestionnaire de points de contrôle pour les migrations
 * Permet de sauvegarder et reprendre l'état des migrations
 */
export class CheckpointManager {
  private prisma: PrismaClient;
  private dbService: DatabaseService;
  private logger = createLogger('CheckpointManager');
  private maxRetries = 5;
  private memoryCache: Map<string, { checkpoint: WorkflowCheckpoint, timestamp: number }> = new Map();
  private cacheTTL = 60 * 1000; // 1 minute de TTL pour le cache
  
  constructor() {
    this.prisma = new PrismaClient();
    this.dbService = new DatabaseService(); // Nouveau service pour la persistance
  }

  /**
   * Initialise la base de données persistante au démarrage
   */
  async initialize(): Promise<void> {
    this.logger.info('Initialisation du gestionnaire de points de contrôle');
    await this.dbService.ensureTablesExist(); // S'assure que les tables nécessaires existent
    await this.migrateStuckWorkflows(); // Vérifie et répare les workflows bloqués
  }

  /**
   * Crée un nouveau point de contrôle pour un workflow
   * @param workflowId ID du workflow
   * @param metadata Métadonnées additionnelles
   */
  async createCheckpoint(workflowId: string, metadata: Record<string, any> = {}): Promise<WorkflowCheckpoint> {
    const defaultRetryStrategy: RetryStrategy = {
      initialDelayMs: 1000,
      currentDelayMs: 1000,
      backoffCoefficient: 2,
      maxDelayMs: 60000,
      maxAttempts: this.maxRetries,
      currentAttempt: 0,
      errorCategories: {
        transient: true,
        resource: true,
        fatal: false,
      }
    };
    
    const checkpoint: WorkflowCheckpoint = {
      workflowId,
      status: CheckpointStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      step: 0,
      totalSteps: 0,
      progress: 0,
      data: {},
      errors: [],
      metadata: {
        retryStrategy: defaultRetryStrategy,
        ...metadata,
        priority: metadata.priority ?? 5 // Priorité par défaut (1-10, 10 étant la plus élevée)
      }
    };
    
    // Persister le checkpoint dans la base de données
    await this.prisma.$transaction(async (tx) => {
      await tx.migrationCheckpoint.create({
        data: {
          workflowId,
          status: checkpoint.status,
          step: checkpoint.step,
          totalSteps: checkpoint.totalSteps,
          progress: checkpoint.progress,
          data: checkpoint.data as any,
          metadata: checkpoint.metadata as any,
          errors: checkpoint.errors as any,
          createdAt: checkpoint.createdAt,
          updatedAt: checkpoint.updatedAt
        }
      });
    });
    
    // Sauvegarder aussi dans la base de données persistante
    await this.dbService.saveCheckpoint(checkpoint);
    
    // Mettre à jour le cache en mémoire
    this.updateCache(workflowId, checkpoint);
    
    return checkpoint;
  }
  
  /**
   * Sauvegarde l'état actuel d'un point de contrôle avec transaction
   * @param workflowId ID du workflow
   * @param checkpoint Point de contrôle à sauvegarder
   */
  async saveCheckpoint(workflowId: string, checkpoint: WorkflowCheckpoint): Promise<void> {
    checkpoint.updatedAt = new Date();
    
    // Utilisation d'une transaction pour garantir l'atomicité
    await this.prisma.$transaction(async (tx) => {
      // Vérifier si le checkpoint existe
      const existing = await tx.migrationCheckpoint.findUnique({
        where: { workflowId }
      });
      
      if (existing) {
        await tx.migrationCheckpoint.update({
          where: { workflowId },
          data: {
            status: checkpoint.status,
            step: checkpoint.step,
            totalSteps: checkpoint.totalSteps,
            progress: checkpoint.progress,
            data: checkpoint.data as any,
            metadata: checkpoint.metadata as any,
            errors: checkpoint.errors as any,
            updatedAt: checkpoint.updatedAt
          }
        });
      } else {
        await tx.migrationCheckpoint.create({
          data: {
            workflowId,
            status: checkpoint.status,
            step: checkpoint.step,
            totalSteps: checkpoint.totalSteps,
            progress: checkpoint.progress,
            data: checkpoint.data as any,
            metadata: checkpoint.metadata as any,
            errors: checkpoint.errors as any,
            createdAt: checkpoint.createdAt || new Date(),
            updatedAt: checkpoint.updatedAt
          }
        });
      }
      
      // Créer une entrée d'historique pour ce checkpoint
      await tx.migrationCheckpointHistory.create({
        data: {
          workflowId,
          status: checkpoint.status,
          step: checkpoint.step,
          progress: checkpoint.progress,
          timestamp: new Date(),
          snapshot: checkpoint as any
        }
      });
    });
    
    // Sauvegarder en parallèle dans la base persistante
    await this.dbService.saveCheckpoint(checkpoint);
    
    // Mettre à jour le cache
    this.updateCache(workflowId, checkpoint);
  }
  
  /**
   * Récupère un point de contrôle depuis la base de données avec cache
   * @param workflowId ID du workflow
   * @param forceRefresh Forcer le rechargement depuis la BD (ignorer le cache)
   */
  async getCheckpoint(workflowId: string, forceRefresh: boolean = false): Promise<WorkflowCheckpoint | null> {
    // Vérifier le cache en mémoire si on ne force pas le refresh
    if (!forceRefresh) {
      const cached = this.memoryCache.get(workflowId);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.checkpoint;
      }
    }
    
    // Essayer d'abord la base de données Prisma
    const checkpoint = await this.prisma.migrationCheckpoint.findUnique({
      where: {
        workflowId
      }
    });
    
    // Si on ne trouve pas dans Prisma, essayer la base persistante
    if (!checkpoint) {
      const persistedCheckpoint = await this.dbService.getCheckpoint(workflowId);
      if (persistedCheckpoint) {
        // Si trouvé uniquement dans la base persistante, synchroniser avec Prisma
        await this.syncCheckpointToPrisma(persistedCheckpoint);
        this.updateCache(workflowId, persistedCheckpoint);
        return persistedCheckpoint;
      }
      return null;
    }
    
    const result = {
      workflowId: checkpoint.workflowId,
      status: checkpoint.status as CheckpointStatus,
      createdAt: checkpoint.createdAt,
      updatedAt: checkpoint.updatedAt,
      step: checkpoint.step,
      totalSteps: checkpoint.totalSteps,
      progress: checkpoint.progress,
      data: checkpoint.data as Record<string, any>,
      errors: checkpoint.errors as WorkflowError[],
      metadata: checkpoint.metadata as Record<string, any>
    };
    
    // Mettre à jour le cache
    this.updateCache(workflowId, result);
    
    return result;
  }
  
  /**
   * Mets à jour la progression d'un point de contrôle
   * @param workflowId ID du workflow
   * @param step Étape actuelle
   * @param totalSteps Nombre total d'étapes
   * @param data Données à sauvegarder
   */
  async updateProgress(
    workflowId: string, 
    step: number, 
    totalSteps: number, 
    data: Record<string, any> = {}
  ): Promise<WorkflowCheckpoint> {
    const checkpoint = await this.getCheckpoint(workflowId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint not found for workflow ${workflowId}`);
    }
    
    const progress = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;
    
    const updatedCheckpoint: WorkflowCheckpoint = {
      ...checkpoint,
      step,
      totalSteps,
      progress,
      status: CheckpointStatus.IN_PROGRESS,
      data: {
        ...checkpoint.data,
        ...data,
        lastStep: step,
        lastUpdated: new Date().toISOString()
      },
      updatedAt: new Date()
    };
    
    await this.saveCheckpoint(workflowId, updatedCheckpoint);
    return updatedCheckpoint;
  }
  
  /**
   * Signale qu'un workflow a réussi
   * @param workflowId ID du workflow
   * @param data Données finales
   */
  async markAsCompleted(
    workflowId: string, 
    data: Record<string, any> = {}
  ): Promise<WorkflowCheckpoint> {
    const checkpoint = await this.getCheckpoint(workflowId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint not found for workflow ${workflowId}`);
    }
    
    const updatedCheckpoint: WorkflowCheckpoint = {
      ...checkpoint,
      status: CheckpointStatus.COMPLETED,
      progress: 100,
      data: {
        ...checkpoint.data,
        ...data,
        completedAt: new Date().toISOString()
      },
      updatedAt: new Date()
    };
    
    await this.saveCheckpoint(workflowId, updatedCheckpoint);
    return updatedCheckpoint;
  }
  
  /**
   * Signale une erreur dans le workflow
   * @param workflowId ID du workflow
   * @param error Erreur survenue
   * @param errorType Type d'erreur pour la stratégie de retry (optionnel)
   */
  async markAsError(
    workflowId: string, 
    error: Error,
    errorType?: string
  ): Promise<WorkflowCheckpoint> {
    const checkpoint = await this.getCheckpoint(workflowId, true); // Forcer le refresh depuis la BD
    
    if (!checkpoint) {
      throw new Error(`Checkpoint not found for workflow ${workflowId}`);
    }
    
    const workflowError: WorkflowError = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date(),
      type: errorType || this.classifyError(error),
      data: {}
    };
    
    // Ajouter des informations contextuelles à l'erreur
    if (error.cause) {
      workflowError.data.cause = error.cause;
    }
    
    // Créer un tableau d'erreurs s'il n'existe pas
    if (!checkpoint.errors) {
      checkpoint.errors = [];
    }
    
    const updatedCheckpoint: WorkflowCheckpoint = {
      ...checkpoint,
      status: CheckpointStatus.FAILED,
      errors: [...checkpoint.errors, workflowError],
      updatedAt: new Date()
    };
    
    // Appliquer la stratégie de retry basée sur le type d'erreur
    const checkpointWithRetry = this.calculateRetryStrategy(updatedCheckpoint, workflowError.type);
    await this.saveCheckpoint(workflowId, checkpointWithRetry);
    
    return checkpointWithRetry;
  }
  
  /**
   * Classifie automatiquement le type d'erreur en fonction du message et nom
   * @param error Erreur à classifier
   */
  private classifyError(error: Error): string {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();
    
    if (errorName.includes('network') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('temporary')) {
      return 'transient';
    }
    
    if (errorMessage.includes('quota') || 
        errorMessage.includes('limit') || 
        errorMessage.includes('resource') ||
        errorMessage.includes('memory') ||
        errorMessage.includes('cpu')) {
      return 'resource';
    }
    
    if (errorName.includes('validation') || 
        errorName.includes('syntax') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('missing')) {
      return 'validation';
    }
    
    if (errorMessage.includes('service') ||
        errorMessage.includes('dependency') ||
        errorMessage.includes('external')) {
      return 'dependency';
    }
    
    if (errorName.includes('fatal') ||
        errorMessage.includes('fatal') ||
        errorMessage.includes('corrupt') ||
        errorMessage.includes('permission')) {
      return 'fatal';
    }
    
    if (errorMessage.includes('database') ||
        errorMessage.includes('sql') ||
        errorMessage.includes('query')) {
      return 'database';
    }
    
    if (errorMessage.includes('lock') ||
        errorMessage.includes('concurrent') ||
        errorMessage.includes('deadlock')) {
      return 'concurrency';
    }
    
    return 'unknown';
  }
  
  /**
   * Vérifie si un workflow peut être repris
   * @param checkpoint Point de contrôle à vérifier
   */
  canResume(checkpoint: WorkflowCheckpoint): boolean {
    if (checkpoint.status === CheckpointStatus.COMPLETED) {
      return false;
    }
    
    if (!checkpoint.metadata?.retryStrategy) {
      return false;
    }
    
    const { retryStrategy } = checkpoint.metadata;
    
    // Vérifier les conditions de retry
    if (retryStrategy.currentAttempt >= retryStrategy.maxAttempts) {
      return false;
    }
    
    // Vérifier si l'erreur la plus récente est retryable
    const latestError = checkpoint.errors?.[checkpoint.errors.length - 1];
    if (latestError && !this.isErrorRetryable(latestError.type || 'unknown', retryStrategy.errorCategories)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Tente de reprendre un workflow échoué avec le dernier état connu valide
   * @param workflowId ID du workflow
   */
  async resumeWorkflow(workflowId: string): Promise<WorkflowCheckpoint | null> {
    const checkpoint = await this.getCheckpoint(workflowId, true); // Forcer le refresh depuis la BD
    
    if (!checkpoint) {
      return null;
    }
    
    if (!this.canResume(checkpoint)) {
      return null;
    }
    
    // Récupérer l'historique des checkpoints pour trouver le dernier point valide
    const history = await this.prisma.migrationCheckpointHistory.findMany({
      where: {
        workflowId,
        status: {
          in: [CheckpointStatus.IN_PROGRESS, CheckpointStatus.PENDING]
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5 // Limiter aux 5 derniers états valides
    });
    
    // Trouver le dernier état valide où le step est complet
    let lastValidCheckpoint = null;
    for (const entry of history) {
      const snapshot = entry.snapshot as unknown as WorkflowCheckpoint;
      // Utiliser le checkpoint qui a un step complet
      if (snapshot && snapshot.step > 0) {
        lastValidCheckpoint = snapshot;
        break;
      }
    }
    
    // Si aucun état valide trouvé dans Prisma, essayer dans la base persistante
    if (!lastValidCheckpoint) {
      const persistentHistory = await this.dbService.getCheckpointHistory(workflowId);
      for (const entry of persistentHistory) {
        if (entry && entry.step > 0 && 
            (entry.status === CheckpointStatus.IN_PROGRESS || 
             entry.status === CheckpointStatus.PENDING)) {
          lastValidCheckpoint = entry;
          break;
        }
      }
    }
    
    // Si aucun état valide trouvé, utiliser l'état actuel
    const checkpointToResume = lastValidCheckpoint || checkpoint;
    
    // Préparer le checkpoint pour la reprise
    const updatedCheckpoint: WorkflowCheckpoint = {
      ...checkpointToResume,
      status: CheckpointStatus.RESUMING,
      updatedAt: new Date(),
      // Incrémenter la tentative de retry
      metadata: {
        ...checkpointToResume.metadata,
        retryStrategy: {
          ...checkpointToResume.metadata.retryStrategy,
          currentAttempt: checkpointToResume.metadata.retryStrategy.currentAttempt + 1,
          lastAttemptTime: new Date().toISOString()
        }
      }
    };
    
    await this.saveCheckpoint(workflowId, updatedCheckpoint);
    return updatedCheckpoint;
  }
  
  /**
   * Récupère l'historique des checkpoints pour un workflow
   * @param workflowId ID du workflow
   * @param limit Nombre maximum d'entrées à récupérer
   */
  async getCheckpointHistory(workflowId: string, limit: number = 10): Promise<any[]> {
    const prismaHistory = await this.prisma.migrationCheckpointHistory.findMany({
      where: { workflowId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    // Compléter avec l'historique de la base persistante
    const persistentHistory = await this.dbService.getCheckpointHistory(workflowId, limit);
    
    // Fusionner et trier les deux sources d'historique
    const mergedHistory = [...prismaHistory, ...persistentHistory];
    mergedHistory.sort((a, b) => {
      const aTime = a.timestamp || a.updatedAt;
      const bTime = b.timestamp || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    return mergedHistory.slice(0, limit); // Limiter au nombre demandé
  }
  
  /**
   * Calcule la stratégie de retry en fonction de l'erreur
   * @param checkpoint Point de contrôle actuel
   * @param errorType Type d'erreur survenue
   */
  calculateRetryStrategy(checkpoint: WorkflowCheckpoint, errorType: string): WorkflowCheckpoint {
    if (!checkpoint.metadata?.retryStrategy) {
      return checkpoint;
    }
    
    const { retryStrategy } = checkpoint.metadata;
    
    // Vérifier si ce type d'erreur est retryable
    if (!this.isErrorRetryable(errorType, retryStrategy.errorCategories)) {
      return {
        ...checkpoint,
        metadata: {
          ...checkpoint.metadata,
          retryStrategy: {
            ...retryStrategy,
            maxAttempts: retryStrategy.currentAttempt, // Force l'arrêt des retries
          }
        }
      };
    }
    
    // Calculer le prochain délai avec backoff exponentiel
    const nextDelayMs = Math.min(
      retryStrategy.initialDelayMs * Math.pow(retryStrategy.backoffCoefficient, retryStrategy.currentAttempt),
      retryStrategy.maxDelayMs
    );
    
    // Calculer le moment du prochain retry
    const nextRetryDate = new Date();
    nextRetryDate.setTime(nextRetryDate.getTime() + nextDelayMs);
    
    // Pour les erreurs de concurrence, utiliser un jitter pour éviter les collisions
    const jitter = errorType === 'concurrency' ? Math.random() * 2000 : 0;
    
    // Incrémenter le compteur de tentatives
    const nextAttempt = retryStrategy.currentAttempt + 1;
    
    return {
      ...checkpoint,
      metadata: {
        ...checkpoint.metadata,
        retryStrategy: {
          ...retryStrategy,
          currentDelayMs: nextDelayMs + jitter,
          currentAttempt: nextAttempt,
          nextRetryTime: new Date(nextRetryDate.getTime() + jitter).toISOString(),
          lastAttemptTime: new Date().toISOString()
        }
      }
    };
  }
  
  /**
   * Détermine si un type d'erreur est retryable
   * @param errorType Type d'erreur
   * @param categories Catégories d'erreurs configurées
   */
  private isErrorRetryable(errorType: string, categories: any): boolean {
    switch (errorType) {
      case 'transient':
        return !!categories.transient;
      case 'resource':
        return !!categories.resource;
      case 'dependency':
        return !!categories.dependency !== false; // Par défaut true sauf si explicitement false
      case 'validation':
        return false; // Les erreurs de validation ne sont jamais retryables
      case 'fatal':
        return !!categories.fatal;
      case 'database':
        return true; // Les erreurs de base de données sont généralement retryables
      case 'concurrency':
        return true; // Les erreurs de concurrence sont retryables avec jitter
      default:
        // Par défaut, on retry les erreurs inconnues avec une limite plus stricte
        return true;
    }
  }
  
  /**
   * Nettoie les points de contrôle complétés plus anciens qu'une date donnée
   * @param olderThan Date limite
   */
  async cleanupCompletedCheckpoints(olderThan: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Récupérer les IDs des checkpoints à supprimer
      const checkpointsToDelete = await tx.migrationCheckpoint.findMany({
        where: {
          status: CheckpointStatus.COMPLETED,
          updatedAt: {
            lt: olderThan
          }
        },
        select: { workflowId: true }
      });
      
      const workflowIds = checkpointsToDelete.map(c => c.workflowId);
      
      // Archiver les checkpoints complétés avant suppression
      await tx.migrationCheckpointArchive.createMany({
        data: checkpointsToDelete.map(c => ({
          workflowId: c.workflowId,
          archivedAt: new Date()
        }))
      });
      
      // Supprimer l'historique associé
      if (workflowIds.length > 0) {
        await tx.migrationCheckpointHistory.deleteMany({
          where: {
            workflowId: { in: workflowIds }
          }
        });
      }
      
      // Supprimer les checkpoints complétés
      await tx.migrationCheckpoint.deleteMany({
        where: {
          workflowId: { in: workflowIds }
        }
      });
    });
    
    // Nettoyer également dans la base persistante
    await this.dbService.cleanupCheckpoints(olderThan);
  }
  
  /**
   * Trouve les workflows bloqués qui nécessitent une intervention
   * @param stuckThresholdMinutes Minutes d'inactivité avant de considérer un workflow comme bloqué
   */
  async findStuckWorkflows(stuckThresholdMinutes: number = 30): Promise<WorkflowCheckpoint[]> {
    const stuckThreshold = new Date();
    stuckThreshold.setMinutes(stuckThreshold.getMinutes() - stuckThresholdMinutes);
    
    const stuckCheckpoints = await this.prisma.migrationCheckpoint.findMany({
      where: {
        status: {
          in: [CheckpointStatus.IN_PROGRESS, CheckpointStatus.PENDING, CheckpointStatus.RESUMING]
        },
        updatedAt: {
          lt: stuckThreshold
        }
      }
    });
    
    const stuckPersistentCheckpoints = await this.dbService.findStuckWorkflows(stuckThresholdMinutes);
    
    // Fusionner et dédupliquer les résultats
    const allStuckWorkflowIds = new Set([
      ...stuckCheckpoints.map(cp => cp.workflowId),
      ...stuckPersistentCheckpoints.map(cp => cp.workflowId)
    ]);
    
    const result: WorkflowCheckpoint[] = [];
    for (const workflowId of allStuckWorkflowIds) {
      const checkpoint = await this.getCheckpoint(workflowId, true);
      if (checkpoint) {
        result.push(checkpoint);
      }
    }
    
    return result;
  }

  /**
   * Vérifie et répare les workflows potentiellement bloqués au démarrage
   */
  private async migrateStuckWorkflows(): Promise<void> {
    const stuckWorkflows = await this.findStuckWorkflows(60); // 1 heure
    
    this.logger.info(`Detected ${stuckWorkflows.length} potentially stuck workflows`);
    
    // Pour chaque workflow bloqué, mettre à jour le statut
    for (const workflow of stuckWorkflows) {
      try {
        // Si le workflow est bloqué depuis trop longtemps, le marquer comme échoué
        const updatedCheckpoint: WorkflowCheckpoint = {
          ...workflow,
          status: CheckpointStatus.FAILED,
          updatedAt: new Date(),
          errors: [
            ...(workflow.errors || []),
            {
              message: 'Workflow marked as failed due to inactivity',
              name: 'TimeoutError',
              timestamp: new Date(),
              type: 'transient',
              data: {
                lastActivity: workflow.updatedAt
              }
            }
          ]
        };
        
        await this.saveCheckpoint(workflow.workflowId, updatedCheckpoint);
        this.logger.info(`Updated stuck workflow ${workflow.workflowId} status to FAILED`);
      } catch (error) {
        this.logger.error(`Failed to process stuck workflow ${workflow.workflowId}:`, error);
      }
    }
  }

  /**
   * Met à jour le cache en mémoire
   */
  private updateCache(workflowId: string, checkpoint: WorkflowCheckpoint): void {
    this.memoryCache.set(workflowId, {
      checkpoint,
      timestamp: Date.now()
    });
    
    // Nettoyer le cache régulièrement (10% de chance à chaque opération)
    if (Math.random() < 0.1) {
      this.cleanCache();
    }
  }
  
  /**
   * Nettoie les entrées expirées du cache
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  /**
   * Synchronise un point de contrôle de la base persistante vers Prisma
   */
  private async syncCheckpointToPrisma(checkpoint: WorkflowCheckpoint): Promise<void> {
    try {
      await this.prisma.migrationCheckpoint.create({
        data: {
          workflowId: checkpoint.workflowId,
          status: checkpoint.status,
          step: checkpoint.step,
          totalSteps: checkpoint.totalSteps,
          progress: checkpoint.progress,
          data: checkpoint.data as any,
          metadata: checkpoint.metadata as any,
          errors: checkpoint.errors as any,
          createdAt: checkpoint.createdAt || new Date(),
          updatedAt: checkpoint.updatedAt || new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to sync checkpoint to Prisma: ${error}`);
    }
  }
}