import * as path from 'path';
import * as fs from 'fs-extra';
import { loadConfig } from '../config/config';
import { AssemblerAgent } from './AssemblerAgent';
import { AgentResult, IAgent } from './BaseAgent';
import { BusinessAgent } from './BusinessAgent';
import { DataAgent } from './DataAgent';
import { DependencyAgent } from './DependencyAgent';
import { QualityAgent } from './QualityAgent';
import { StrategyAgent } from './StrategyAgent';
import { StructureAgent } from './StructureAgent';

// Charger la configuration centralisée
const config = loadConfig();
const { PATHS, AGENTS, ORCHESTRATOR, DASHBOARD } = config;

/**
 * Configuration pour le CoordinatorAgent
 */
interface CoordinatorConfig {
  phpFilePath: string;
  outputDir?: string;
  agentsToRun?: string[];
  parallel?: boolean;
  forceRerun?: boolean;
  dependencyCheck?: boolean;
  validateCahierDesCharges?: boolean;
  cahierDesChargesPath?: string;
  dashboardEnabled?: boolean;
  dashboardUrl?: string;
  advancedMessaging?: boolean; // Nouveau paramètre pour la messagerie avancée
  realTimeUpdates?: boolean; // Nouveau paramètre pour les mises à jour en temps réel
  hooks?: {
    beforeAgent?: (agentName: string) => Promise<void>;
    afterAgent?: (agentName: string, result: AgentResult) => Promise<void>;
    onError?: (agentName: string, error: Error) => Promise<void>;
    onComplete?: (results: AgentExecutionResult[]) => Promise<void>;
    onMessage?: (message: InterAgentMessage) => Promise<void>; // Nouveau hook pour les messages
  };
}

/**
 * Interface pour les messages échangés entre agents
 */
interface InterAgentMessage {
  from: string;
  to: string | 'all';
  type: 'info' | 'warning' | 'error' | 'data' | 'request' | 'response';
  priority: 'low' | 'medium' | 'high' | 'critical';
  content: any;
  timestamp: number;
  correlationId?: string; // Pour suivre les conversations entre agents
  metadata?: Record<string, any>;
}

/**
 * Résultat d'exécution d'un agent
 */
interface AgentExecutionResult {
  agentName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'success' | 'error' | 'skipped';
  result?: AgentResult;
  error?: Error;
  dependencies?: string[];
  messages?: InterAgentMessage[]; // Historique des messages de l'agent
}

/**
 * Interface pour les points de contrôle (checkpoints)
 */
interface ExecutionCheckpoint {
  id: string;
  timestamp: number;
  agentName: string;
  stage: 'before' | 'after' | 'error';
  status: 'pending' | 'completed' | 'failed';
  data?: any;
  metadata?: {
    duration?: number;
    resources?: Record<string, number>;
    artifacts?: string[];
  };
}

/**
 * Agent coordinateur responsable d'orchestrer l'exécution
 * des différents agents d'analyse dans le bon ordre
 */
export class CoordinatorAgent {
  private config: CoordinatorConfig;
  private results: AgentExecutionResult[] = [];
  private startTime = 0;
  private agentRegistry: Map<string, new (filePath: string) => IAgent> = new Map();
  private artifacts: string[] = [];
  private messageQueue: InterAgentMessage[] = []; // File d'attente des messages
  private dashboardUpdateTimer: NodeJS.Timeout | null = null;
  private checkpoints: ExecutionCheckpoint[] = [];
  private checkpointFile: string;

  constructor(config: CoordinatorConfig) {
    // Configuration par défaut en utilisant les valeurs de la configuration centralisée
    this.config = {
      outputDir: config.outputDir || path.dirname(config.phpFilePath),
      agentsToRun: config.agentsToRun || AGENTS.DEFAULT_ORDER,
      parallel: config.parallel || ORCHESTRATOR.PARALLEL_EXECUTION,
      forceRerun: config.forceRerun || ORCHESTRATOR.FORCE_RERUN,
      dependencyCheck:
        config.dependencyCheck !== undefined
          ? config.dependencyCheck
          : ORCHESTRATOR.DEPENDENCY_CHECK,
      validateCahierDesCharges:
        config.validateCahierDesCharges !== undefined
          ? config.validateCahierDesCharges
          : ORCHESTRATOR.VALIDATE_CAHIER,
      cahierDesChargesPath: config.cahierDesChargesPath || PATHS.CAHIER_DES_CHARGES,
      dashboardEnabled:
        config.dashboardEnabled !== undefined
          ? config.dashboardEnabled
          : ORCHESTRATOR.DASHBOARD_ENABLED,
      dashboardUrl: config.dashboardUrl || ORCHESTRATOR.DASHBOARD_URL,
      hooks: config.hooks || {},
      ...config,
    };

    // Enregistrement des agents disponibles
    this.registerAgents();

    // Initialiser le tableau de bord en temps réel si activé
    if (this.config.dashboardEnabled && this.config.realTimeUpdates) {
      this.initRealTimeDashboard();
    }

    // Initialiser le fichier de points de contrôle
    const baseFilename = path.basename(this.config.phpFilePath);
    this.checkpointFile = path.join(this.config.outputDir, `${baseFilename}.checkpoints.json`);

    // Charger les points de contrôle existants si on ne force pas la réexécution
    if (!this.config.forceRerun) {
      this.loadCheckpoints();
    }
  }

  /**
   * Enregistre les agents disponibles dans le registre
   */
  private registerAgents(): void {
    this.agentRegistry.set(AGENTS.BUSINESS, BusinessAgent);
    this.agentRegistry.set(AGENTS.STRUCTURE, StructureAgent);
    this.agentRegistry.set(AGENTS.DATA, DataAgent);
    this.agentRegistry.set(AGENTS.DEPENDENCY, DependencyAgent);
    this.agentRegistry.set(AGENTS.QUALITY, QualityAgent);
    this.agentRegistry.set(AGENTS.STRATEGY, StrategyAgent);
    this.agentRegistry.set(AGENTS.ASSEMBLER, AssemblerAgent);
  }

  /**
   * Vérifie si le fichier PHP existe
   */
  private async validateFile(): Promise<void> {
    try {
      await fs.access(this.config.phpFilePath);
    } catch (error) {
      throw new Error(`Le fichier PHP n'existe pas: ${this.config.phpFilePath}`);
    }

    // Vérifier que le fichier est bien un fichier PHP
    if (!this.config.phpFilePath.toLowerCase().endsWith('.php')) {
      throw new Error(`Le fichier doit être un fichier PHP: ${this.config.phpFilePath}`);
    }
  }

  /**
   * Crée le répertoire de sortie s'il n'existe pas
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      throw new Error(`Impossible de créer le répertoire de sortie: ${error.message}`);
    }
  }

  /**
   * Initialise le fichier de sections d'audit s'il n'existe pas
   */
  private async initializeAuditSections(): Promise<void> {
    const baseFilename = path.basename(this.config.phpFilePath);
    const sectionsPath = path.join(this.config.outputDir, `${baseFilename}.audit.sections.json`);

    try {
      // Vérifier si le fichier existe déjà
      await fs.access(sectionsPath);

      // Si on force la réexécution, réinitialiser le fichier
      if (this.config.forceRerun) {
        await fs.writeFile(sectionsPath, '[]', 'utf8');
        console.log(`Fichier de sections réinitialisé: ${sectionsPath}`);
      } else {
        console.log(`Fichier de sections existant: ${sectionsPath}`);
      }
    } catch (error) {
      // Le fichier n'existe pas, le créer
      await fs.writeFile(sectionsPath, '[]', 'utf8');
      console.log(`Nouveau fichier de sections créé: ${sectionsPath}`);
    }
  }

  /**
   * Exécute un agent spécifique
   * @param agentName Nom de l'agent à exécuter
   * @returns Résultat de l'exécution
   */
  private async executeAgent(agentName: string): Promise<AgentExecutionResult> {
    if (!this.agentRegistry.has(agentName)) {
      return {
        agentName,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        status: 'skipped',
        error: new Error(`Agent ${agentName} non trouvé dans le registre`),
        messages: [],
      };
    }

    const startTime = Date.now();
    console.log(`🚀 Exécution de l'agent ${agentName}...`);

    // Notification avant l'exécution
    if (this.config.hooks?.beforeAgent) {
      await this.config.hooks.beforeAgent(agentName);
    }

    // Mise à jour du tableau de bord avec le statut "démarré"
    if (this.config.dashboardEnabled) {
      this.sendMessage({
        from: 'coordinator',
        to: 'all',
        type: 'info',
        priority: 'medium',
        content: `Agent ${agentName} a démarré`,
      });
    }

    try {
      // Créer et exécuter l'agent
      const AgentClass = this.agentRegistry.get(agentName).agent;
      const agentInstance = new AgentClass(this.config.phpFilePath);

      // Stocker l'instance pour la messagerie inter-agents
      this.agentRegistry.set(agentName, {
        agent: AgentClass,
        instance: agentInstance,
      });

      // Injecter la fonction d'envoi de messages si l'agent implémente IMessagingAgent
      if (this.config.advancedMessaging && 'receiveMessage' in agentInstance) {
        agentInstance.setMessageCallback(
          (message: Omit<InterAgentMessage, 'timestamp' | 'from'>) => {
            this.sendMessage({
              ...message,
              from: agentName,
            });
          }
        );
      }

      const result = await agentInstance.process();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Notification après l'exécution
      if (this.config.hooks?.afterAgent) {
        await this.config.hooks.afterAgent(agentName, result);
      }

      // Enregistrer les artefacts générés
      if (result.artifacts && result.artifacts.length > 0) {
        this.artifacts.push(...result.artifacts);
      }

      // Mise à jour du tableau de bord avec le statut "terminé"
      if (this.config.dashboardEnabled) {
        this.sendMessage({
          from: 'coordinator',
          to: 'all',
          type: 'info',
          priority: 'medium',
          content: `Agent ${agentName} a terminé avec succès`,
        });
      }

      const executionResult: AgentExecutionResult = {
        agentName,
        startTime,
        endTime,
        duration,
        status: result.success ? 'success' : 'error',
        result,
        dependencies: agentInstance.getDependencies(),
        messages: this.messageQueue.filter((m) => m.from === agentName || m.to === agentName),
      };

      return executionResult;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Notification en cas d'erreur
      if (this.config.hooks?.onError) {
        await this.config.hooks.onError(agentName, error);
      }

      // Mise à jour du tableau de bord avec le statut "échec"
      if (this.config.dashboardEnabled) {
        this.sendMessage({
          from: 'coordinator',
          to: 'all',
          type: 'error',
          priority: 'high',
          content: `Agent ${agentName} a échoué: ${error.message}`,
        });
      }

      const executionResult: AgentExecutionResult = {
        agentName,
        startTime,
        endTime,
        duration,
        status: 'error',
        error,
        messages: this.messageQueue.filter((m) => m.from === agentName || m.to === agentName),
      };

      return executionResult;
    }
  }

  /**
   * Construit le graphe de dépendances des agents et retourne une liste ordonnée
   */
  private resolveDependencies(agentsToRun: string[]): string[] {
    if (!this.config.dependencyCheck) {
      return agentsToRun;
    }

    // Utiliser les dépendances définies dans la configuration centralisée
    const graph: Record<string, string[]> = {};
    const visited = new Set<string>();
    const result: string[] = [];

    // Initialiser le graphe avec les dépendances de la configuration
    agentsToRun.forEach((agentType) => {
      if (AGENTS.METADATA[agentType]) {
        graph[agentType] = AGENTS.METADATA[agentType].dependencies.filter(
          (dep) => agentsToRun.includes(dep) && this.agentRegistry.has(dep)
        );
      } else if (this.agentRegistry.has(agentType)) {
        // Fallback sur la méthode getDependencies de l'agent
        const AgentClass = this.agentRegistry.get(agentType);
        const agent = new AgentClass(this.config.phpFilePath);
        graph[agentType] = agent
          .getDependencies()
          .filter((dep) => agentsToRun.includes(dep) && this.agentRegistry.has(dep));
      } else {
        graph[agentType] = [];
      }
    });

    // Fonction récursive pour parcourir le graphe en profondeur
    const visit = (agentType: string) => {
      if (visited.has(agentType)) return;
      visited.add(agentType);

      graph[agentType].forEach((dep) => {
        visit(dep);
      });

      result.push(agentType);
    };

    // Parcourir tous les agents
    agentsToRun.forEach((agentType) => {
      if (!visited.has(agentType)) {
        visit(agentType);
      }
    });

    return result;
  }

  /**
   * Exécute tous les agents en série
   */
  private async executeSerially(): Promise<void> {
    // Résoudre les dépendances et obtenir l'ordre d'exécution
    const orderedAgents = this.resolveDependencies(this.config.agentsToRun);
    console.log(`📝 Ordre d'exécution des agents: ${orderedAgents.join(', ')}`);

    for (const agentType of orderedAgents) {
      const result = await this.executeAgent(agentType);
      this.results.push(result);

      // Si un agent échoue et que c'est critique, on s'arrête
      if (!result.success && agentType === 'assembler') {
        throw new Error(`L'agent assembleur a échoué. Arrêt du processus.`);
      }
    }
  }

  /**
   * Exécute les agents en parallèle, en respectant les dépendances
   */
  private async executeInParallel(): Promise<void> {
    // Résoudre les dépendances et obtenir l'ordre d'exécution
    const orderedAgents = this.resolveDependencies(this.config.agentsToRun);
    console.log(`📝 Ordre d'exécution basé sur les dépendances: ${orderedAgents.join(', ')}`);

    // Identifier les agents indépendants pour exécution parallèle
    const dependencyMap = new Map<string, string[]>();
    orderedAgents.forEach((agentType) => {
      if (this.agentRegistry.has(agentType)) {
        const AgentClass = this.agentRegistry.get(agentType);
        const agent = new AgentClass(this.config.phpFilePath);
        dependencyMap.set(
          agentType,
          agent
            .getDependencies()
            .filter((dep) => orderedAgents.includes(dep) && this.agentRegistry.has(dep))
        );
      } else {
        dependencyMap.set(agentType, []);
      }
    });

    // Exécuter les agents en groupes parallèles en fonction des dépendances
    const completedAgents = new Set<string>();
    const remainingAgents = new Set(orderedAgents);

    while (remainingAgents.size > 0) {
      // Identifier les agents qui peuvent être exécutés en parallèle
      const readyAgents = Array.from(remainingAgents).filter((agentType) => {
        const deps = dependencyMap.get(agentType) || [];
        return deps.every((dep) => completedAgents.has(dep));
      });

      if (readyAgents.length === 0) {
        throw new Error("Cycle de dépendances détecté, impossible de résoudre l'ordre d'exécution");
      }

      console.log(`🔄 Exécution en parallèle de: ${readyAgents.join(', ')}`);

      // Exécuter ces agents en parallèle
      const promises = readyAgents.map((agentType) => this.executeAgent(agentType));
      const results = await Promise.all(promises);

      // Mettre à jour les agents terminés
      results.forEach((result) => {
        completedAgents.add(result.agentName);
        remainingAgents.delete(result.agentName);
      });

      // Stocker les résultats
      this.results.push(...results);

      // Vérifier si tous les agents ont réussi
      const failedCriticalAgent = results.find((r) => !r.success && r.agentName === 'assembler');
      if (failedCriticalAgent) {
        throw new Error(`L'agent assembleur a échoué. Arrêt du processus.`);
      }
    }
  }

  /**
   * Exécute le processus d'audit complet
   */
  public async execute(): Promise<AgentExecutionResult[]> {
    this.startTime = Date.now();
    console.log(`🚀 Démarrage de l'audit pour ${this.config.phpFilePath}`);

    try {
      // Préparation
      await this.validateFile();
      await this.ensureOutputDirectory();
      await this.initializeAuditSections();

      // Envoyer les données initiales au tableau de bord si activé
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('init', {
          filePath: this.config.phpFilePath,
          status: 'started',
          timestamp: new Date().toISOString(),
        });
      }

      // Exécution des agents
      if (this.config.parallel) {
        await this.executeInParallel();
      } else {
        await this.executeSerially();
      }

      // Calculer le temps total
      const totalTime = Date.now() - this.startTime;
      console.log(`✅ Audit terminé en ${totalTime}ms`);

      // Générer le rapport HTML du tableau de bord
      const dashboardReportPath = await this.generateDashboardReport();
      if (dashboardReportPath) {
        this.artifacts.push(dashboardReportPath);
      }

      // Mettre à jour le tableau de bord avec les résultats finaux
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('complete', {
          filePath: this.config.phpFilePath,
          status: 'completed',
          results: this.results,
          executionTime: totalTime,
          timestamp: new Date().toISOString(),
          artifacts: this.artifacts,
        });
      }

      // Hook de fin de processus
      if (this.config.hooks?.onComplete) {
        await this.config.hooks.onComplete(this.results);
      }

      return this.results;
    } catch (error) {
      const totalTime = Date.now() - this.startTime;
      console.error(`❌ Audit échoué après ${totalTime}ms: ${error.message}`);

      // Mettre à jour le tableau de bord en cas d'erreur
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('error', {
          filePath: this.config.phpFilePath,
          status: 'failed',
          error: error.message,
          executionTime: totalTime,
          timestamp: new Date().toISOString(),
        });
      }

      throw error;
    }
  }

  /**
   * Met à jour le tableau de bord pour un agent spécifique
   */
  private async updateAgentProgress(
    agentName: string,
    status: 'started' | 'completed' | 'failed',
    result?: AgentExecutionResult
  ): Promise<void> {
    if (!this.config.dashboardEnabled) return;

    try {
      // Préparer les données à envoyer au tableau de bord
      const updateData = {
        timestamp: new Date().toISOString(),
        filePath: this.config.phpFilePath,
        agentName,
        status,
        executionTime: result?.executionTime,
        success: result?.success,
        errors: result?.error ? [result.error.message] : undefined,
        // Ajouter les métriques améliorées des résultats si disponibles
        metrics: result?.result?.metrics,
        // Inclure les informations de progression supplémentaires
        progress: {
          totalAgents: this.config.agentsToRun.length,
          completedAgents: this.results.length,
          currentAgent: agentName,
        },
      };

      // Envoyer les données au tableau de bord via l'API
      await this.updateDashboard('agent-update', updateData);
    } catch (error) {
      console.warn(`⚠️ Impossible de mettre à jour le tableau de bord: ${error.message}`);
    }
  }

  /**
   * Envoie une mise à jour au tableau de bord
   */
  private async updateDashboard(eventType: string, data: any): Promise<void> {
    if (!this.config.dashboardEnabled || !this.config.dashboardUrl) return;

    try {
      // Préparer les données à envoyer
      const payload = {
        eventType,
        data,
        timestamp: new Date().toISOString(),
        version: '2.0', // Nouvelle version du schéma de données
        source: 'coordinator-agent',
      };

      // Version améliorée utilisant fetch au lieu de http.request
      const response = await fetch(this.config.dashboardUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Version': this.getVersion(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Échec de la mise à jour du tableau de bord: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.warn(`⚠️ Erreur lors de la mise à jour du tableau de bord: ${error.message}`);
    }
  }

  /**
   * Envoie un message entre agents
   * @param message Message à envoyer
   */
  public sendMessage(message: Omit<InterAgentMessage, 'timestamp'>): void {
    if (!this.config.advancedMessaging) {
      return;
    }

    const fullMessage: InterAgentMessage = {
      ...message,
      timestamp: Date.now(),
    };

    // Ajouter le message à la file d'attente
    this.messageQueue.push(fullMessage);

    // Log du message
    console.log(`📨 Message de ${fullMessage.from} à ${fullMessage.to}: ${fullMessage.content}`);

    // Si le message est destiné à un agent spécifique et qu'il est actif, le transmettre
    if (fullMessage.to !== 'all' && this.agentRegistry.has(fullMessage.to)) {
      const targetAgent = this.agentRegistry.get(fullMessage.to)?.instance;

      if (targetAgent && 'receiveMessage' in targetAgent) {
        try {
          targetAgent.receiveMessage(fullMessage);
        } catch (error) {
          console.error(`Erreur lors de la transmission du message à ${fullMessage.to}:`, error);
        }
      }
    }

    // Mettre à jour le tableau de bord si activé
    if (this.config.dashboardEnabled) {
      this.updateDashboard('message', fullMessage);
    }

    // Appeler le hook si défini
    if (this.config.hooks?.onMessage) {
      this.config.hooks.onMessage(fullMessage);
    }
  }

  /**
   * Envoie un message inter-agent
   */
  private async sendInterAgentMessage(
    fromAgent: string,
    toAgent: string,
    messageType: string,
    payload: any
  ): Promise<void> {
    try {
      // Préparer le message
      const message = {
        fromAgent,
        toAgent,
        messageType,
        payload,
        timestamp: new Date().toISOString(),
        correlationId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };

      // Enregistrer le message pour le suivi et la traçabilité
      const messagesDir = path.join(this.config.outputDir, 'agent-messages');
      await fs.mkdir(messagesDir, { recursive: true });
      await fs.writeFile(
        path.join(messagesDir, `${message.correlationId}.json`),
        JSON.stringify(message, null, 2)
      );

      // Si l'agent destinataire est en cours d'exécution, ajouter à sa file d'attente
      // Sinon, le message sera lu lors de la prochaine exécution de l'agent
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('agent-message', { message });
      }

      console.log(`📨 Message envoyé de ${fromAgent} à ${toAgent}: ${messageType}`);
    } catch (error) {
      console.warn(`⚠️ Erreur lors de l'envoi du message inter-agent: ${error.message}`);
    }
  }

  /**
   * Récupère les messages pour un agent spécifique
   */
  public async getMessagesForAgent(agentName: string): Promise<any[]> {
    try {
      const messagesDir = path.join(this.config.outputDir, 'agent-messages');

      // Vérifier si le répertoire existe
      try {
        await fs.access(messagesDir);
      } catch {
        // Le répertoire n'existe pas, aucun message
        return [];
      }

      // Lister tous les fichiers de messages
      const files = await fs.readdir(messagesDir);
      const messageFiles = files.filter((file) => file.endsWith('.json'));

      // Lire et filtrer les messages pour cet agent
      const messages = [];
      for (const file of messageFiles) {
        const filePath = path.join(messagesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const message = JSON.parse(content);

        if (message.toAgent === agentName && !message.processed) {
          messages.push(message);
        }
      }

      return messages;
    } catch (error) {
      console.warn(
        `⚠️ Erreur lors de la récupération des messages pour ${agentName}: ${error.message}`
      );
      return [];
    }
  }

  /**
   * Marque un message comme traité
   */
  public async markMessageAsProcessed(messageId: string): Promise<void> {
    try {
      const messagesDir = path.join(this.config.outputDir, 'agent-messages');
      const filePath = path.join(messagesDir, `${messageId}.json`);

      // Vérifier si le fichier existe
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`⚠️ Message introuvable: ${messageId}`);
        return;
      }

      // Lire le message
      const content = await fs.readFile(filePath, 'utf8');
      const message = JSON.parse(content);

      // Marquer comme traité
      message.processed = true;
      message.processedAt = new Date().toISOString();

      // Enregistrer le message mis à jour
      await fs.writeFile(filePath, JSON.stringify(message, null, 2), 'utf8');
    } catch (error) {
      console.warn(`⚠️ Erreur lors du marquage du message comme traité: ${error.message}`);
    }
  }

  /**
   * Génère un rapport HTML pour le tableau de bord
   */
  private async generateDashboardReport(): Promise<string> {
    // Nom de fichier basé sur le nom du fichier PHP analysé
    const baseFilename = path.basename(this.config.phpFilePath, '.php');
    const reportPath = path.join(this.config.outputDir, `${baseFilename}_dashboard_report.html`);

    try {
      // Générer le contenu HTML
      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'analyse - ${baseFilename}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2c3e50; }
    .summary { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    .agent { background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .success { border-left: 4px solid #28a745; }
    .failure { border-left: 4px solid #dc3545; }
    .metrics { display: flex; gap: 20px; flex-wrap: wrap; }
    .metric { background: #e9ecef; padding: 10px; border-radius: 4px; flex: 1; min-width: 120px; }
    .section { margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
    .timestamp { font-size: 0.8em; color: #6c757d; }
    .progress-bar { height: 20px; background: #e9ecef; border-radius: 4px; margin-top: 15px; overflow: hidden; }
    .progress-bar-inner { height: 100%; background: #4caf50; width: 0%; transition: width 0.3s; }
    @media (prefers-color-scheme: dark) {
      body { background: #2d2d2d; color: #e0e0e0; }
      .summary, .metric { background: #3d3d3d; }
      .agent { background: #2d2d2d; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
      h1, h2, h3 { color: #e0e0e0; }
      .timestamp { color: #adb5bd; }
      .progress-bar { background: #3d3d3d; }
    }
  </style>
</head>
<body>
  <h1>Rapport d'analyse pour ${baseFilename}</h1>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>Fichier analysé: <code>${this.config.phpFilePath}</code></p>
    <p>Date de l'analyse: ${new Date().toLocaleString()}</p>
    <p>Durée totale: ${(Date.now() - this.startTime) / 1000} secondes</p>
    <p>Agents exécutés: ${this.results.length} / ${this.config.agentsToRun.length}</p>
    <p>Résultat global: ${this.results.every((r) => r.success) ? '✅ Succès' : '❌ Échec'}</p>
    
    <div class="progress-bar">
      <div class="progress-bar-inner" style="width: ${
        (this.results.length / this.config.agentsToRun.length) * 100
      }%"></div>
    </div>
  </div>
  
  <h2>Détails des agents</h2>
  ${this.results
    .map(
      (result) => `
    <div class="agent ${result.success ? 'success' : 'failure'}">
      <h3>${result.agentName}</h3>
      <p>Statut: ${result.success ? '✅ Succès' : '❌ Échec'}</p>
      <p>Durée d'exécution: ${result.executionTime / 1000} secondes</p>
      
      ${result.error ? `<p>Erreur: ${result.error.message}</p>` : ''}
      
      ${
        result.result?.metrics
          ? `
        <div class="metrics">
          <div class="metric">
            <strong>Temps d'exécution</strong>
            <p>${result.result.metrics.executionTimeMs} ms</p>
          </div>
          ${
            result.result.metrics.itemsProcessed
              ? `
            <div class="metric">
              <strong>Éléments traités</strong>
              <p>${result.result.metrics.itemsProcessed}</p>
            </div>
          `
              : ''
          }
          ${
            result.result.metrics.resourcesUsed
              ? Object.entries(result.result.metrics.resourcesUsed)
                  .map(
                    ([key, value]) => `
            <div class="metric">
              <strong>${key}</strong>
              <p>${value}</p>
            </div>
          `
                  )
                  .join('')
              : ''
          }
        </div>
      `
          : ''
      }
      
      ${
        result.result?.sections
          ? `
        <div class="sections">
          <h4>Sections (${result.result.sections.length})</h4>
          ${result.result.sections
            .map(
              (section) => `
            <div class="section">
              <h5>${section.title}</h5>
              <p>${section.content}</p>
              <p class="timestamp">Généré le ${new Date(
                section.timestamp || Date.now()
              ).toLocaleString()}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')}
  
  <script>
    // Script pour actualiser le rapport toutes les 30 secondes pendant l'exécution
    const isComplete = ${this.results.length === this.config.agentsToRun.length};
    if (!isComplete) {
      setTimeout(() => {
        location.reload();
      }, 30000);
    }
  </script>
</body>
</html>`;

      // Enregistrer le rapport HTML
      await fs.writeFile(reportPath, htmlContent, 'utf8');
      console.log(`✅ Rapport HTML généré: ${reportPath}`);

      return reportPath;
    } catch (error) {
      console.warn(`⚠️ Erreur lors de la génération du rapport HTML: ${error.message}`);
      return null;
    }
  }

  /**
   * Génère un rapport d'exécution
   */
  public generateExecutionReport(): string {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter((r) => r.success).length;
    const failCount = this.results.filter((r) => !r.success).length;

    let report = `# Rapport d'exécution des agents\n\n`;
    report += `- **Fichier**: ${this.config.phpFilePath}\n`;
    report += `- **Date**: ${new Date().toLocaleString()}\n`;
    report += `- **Durée totale**: ${totalTime}ms\n`;
    report += `- **Agents exécutés**: ${this.results.length} (${successCount} réussis, ${failCount} échoués)\n\n`;

    report += `## Détail des exécutions\n\n`;
    report += `| Agent | Statut | Durée (ms) | Erreur |\n`;
    report += `|-------|--------|------------|--------|\n`;

    this.results.forEach((result) => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const error = result.error ? result.error.message : '';
      report += `| ${result.agentName} | ${status} | ${result.executionTime} | ${error} |\n`;
    });

    // Ajouter des informations sur les artefacts générés
    report += `\n## Artefacts générés\n\n`;
    report += `| Agent | Artefact |\n`;
    report += `|-------|----------|\n`;

    this.results.forEach((result) => {
      if (result.result?.artifacts && result.result.artifacts.length > 0) {
        result.result.artifacts.forEach((artifact) => {
          report += `| ${result.agentName} | ${artifact} |\n`;
        });
      } else {
        report += `| ${result.agentName} | Aucun artefact |\n`;
      }
    });

    // Ajouter des métriques
    report += `\n## Métriques\n\n`;
    report += `| Agent | Temps d'exécution | Éléments traités |\n`;
    report += `|-------|-------------------|------------------|\n`;

    this.results.forEach((result) => {
      const metrics = result.result?.metrics;
      const executionTime = metrics?.executionTimeMs || result.executionTime;
      const itemsProcessed = metrics?.itemsProcessed || 'N/A';

      report += `| ${result.agentName} | ${executionTime}ms | ${itemsProcessed} |\n`;
    });

    return report;
  }

  /**
   * Enregistre le rapport d'exécution dans un fichier
   */
  public async saveExecutionReport(): Promise<string> {
    const baseFilename = path.basename(this.config.phpFilePath);

    // Utiliser le dossier de rapports d'exécution de la configuration centralisée
    fs.mkdirSync(PATHS.EXECUTION_REPORTS, { recursive: true });
    const reportPath = path.join(PATHS.EXECUTION_REPORTS, `${baseFilename}.execution_report.md`);

    const report = this.generateExecutionReport();
    await fs.writeFile(reportPath, report, 'utf8');

    console.log(`📝 Rapport d'exécution enregistré: ${reportPath}`);
    return reportPath;
  }

  /**
   * Renvoie la version du coordinateur
   */
  public getVersion(): string {
    return '2.1.0'; // Version mise à jour
  }

  /**
   * Initialise le tableau de bord en temps réel
   * @private
   */
  private initRealTimeDashboard(): void {
    // Mettre à jour le tableau de bord toutes les 3 secondes
    this.dashboardUpdateTimer = setInterval(() => {
      this.updateDashboard();
    }, 3000);
  }

  /**
   * Met à jour le tableau de bord avec les dernières informations
   * @private
   */
  private updateDashboard(): void {
    try {
      const dashboardData = {
        timestamp: Date.now(),
        agents: this.results,
        messages: this.messageQueue.slice(-50), // Limiter aux 50 derniers messages
        progress: this.calculateProgress(),
        status: this.calculateOverallStatus(),
        metrics: this.calculateMetrics(),
      };

      // Écrire les données dans un fichier JSON pour le tableau de bord
      const dashboardFile = path.join(this.config.outputDir, 'dashboard-data.json');
      fs.writeFileSync(dashboardFile, JSON.stringify(dashboardData, null, 2));

      if (this.config.hooks?.onDashboardUpdate) {
        this.config.hooks.onDashboardUpdate(dashboardData);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tableau de bord:', error);
    }
  }

  /**
   * Calcule les métriques globales de l'exécution
   * @private
   */
  private calculateMetrics(): Record<string, any> {
    const successfulAgents = this.results.filter((r) => r.status === 'success').length;
    const failedAgents = this.results.filter((r) => r.status === 'error').length;
    const skippedAgents = this.results.filter((r) => r.status === 'skipped').length;
    const totalDuration = this.results.reduce((acc, r) => acc + (r.duration || 0), 0);

    return {
      successRate: this.results.length ? (successfulAgents / this.results.length) * 100 : 0,
      failureRate: this.results.length ? (failedAgents / this.results.length) * 100 : 0,
      totalDuration,
      averageDuration: this.results.length ? totalDuration / this.results.length : 0,
      messagesExchanged: this.messageQueue.length,
      criticalMessages: this.messageQueue.filter((m) => m.priority === 'critical').length,
    };
  }

  /**
   * Calcule le pourcentage global de progression
   * @private
   */
  private calculateProgress(): number {
    if (!this.config.agentsToRun.length) return 0;

    const completedAgents = this.results.filter(
      (r) => r.status === 'success' || r.status === 'error'
    ).length;

    return (completedAgents / this.config.agentsToRun.length) * 100;
  }

  /**
   * Détermine le statut global de l'exécution
   * @private
   */
  private calculateOverallStatus(): 'pending' | 'running' | 'completed' | 'failed' {
    if (!this.results.length) return 'pending';

    if (this.results.length < this.config.agentsToRun.length) {
      return 'running';
    }

    if (this.results.some((r) => r.status === 'error')) {
      return 'failed';
    }

    return 'completed';
  }

  /**
   * Envoie un message entre agents
   * @param message Le message à envoyer
   */
  public sendMessage(message: Omit<InterAgentMessage, 'timestamp'>): void {
    const fullMessage: InterAgentMessage = {
      ...message,
      timestamp: Date.now(),
    };

    this.messageQueue.push(fullMessage);

    // Traiter le message immédiatement si nécessaire
    if (message.priority === 'critical' || message.priority === 'high') {
      this.processMessage(fullMessage);
    }

    // Mettre à jour le tableau de bord si le mode temps réel est activé
    if (this.config.dashboardEnabled && this.config.realTimeUpdates) {
      this.updateDashboard();
    }
  }

  /**
   * Traite un message reçu et le transmet à l'agent destinataire
   * @param message Le message à traiter
   * @private
   */
  private processMessage(message: InterAgentMessage): void {
    try {
      if (message.to === 'all') {
        // Diffuser à tous les agents
        for (const [agentName, { instance }] of this.agentRegistry.entries()) {
          if (agentName !== message.from && typeof instance.receiveMessage === 'function') {
            instance.receiveMessage(message);
          }
        }
      } else {
        // Envoyer à un agent spécifique
        const targetAgent = this.agentRegistry.get(message.to);
        if (targetAgent && typeof targetAgent.instance.receiveMessage === 'function') {
          targetAgent.instance.receiveMessage(message);
        }
      }
    } catch (error) {
      console.error(
        `Erreur lors du traitement du message de ${message.from} à ${message.to}:`,
        error
      );
    }
  }

  /**
   * Crée un point de contrôle pour permettre la reprise d'exécution
   * @param agentName Nom de l'agent actuel
   * @param state État à sauvegarder
   */
  private async createCheckpoint(agentName: string, state: any): Promise<void> {
    try {
      const checkpointsDir = path.join(this.config.outputDir, 'checkpoints');
      await fs.mkdir(checkpointsDir, { recursive: true });

      const checkpointFile = path.join(checkpointsDir, `${agentName}-checkpoint.json`);
      const checkpointData = {
        agentName,
        state,
        timestamp: new Date().toISOString(),
        progress: this.calculateProgress(),
        completedAgents: this.results.map((r) => r.agentName),
      };

      await fs.writeFile(checkpointFile, JSON.stringify(checkpointData, null, 2));

      // Mise à jour du tableau de bord si activé
      if (this.config.dashboardEnabled) {
        this.updateDashboard({
          type: 'checkpoint',
          agentName,
          timestamp: checkpointData.timestamp,
          progress: checkpointData.progress,
        });
      }

      console.log(`✅ Point de contrôle créé pour l'agent ${agentName}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du point de contrôle pour ${agentName}:`, error);
    }
  }

  /**
   * Restaure l'exécution à partir d'un point de contrôle
   * @param agentName Nom de l'agent dont on veut restaurer l'état
   * @returns L'état restauré ou null si aucun point de contrôle n'existe
   */
  private async restoreFromCheckpoint(agentName: string): Promise<any | null> {
    try {
      const checkpointsDir = path.join(this.config.outputDir, 'checkpoints');
      const checkpointFile = path.join(checkpointsDir, `${agentName}-checkpoint.json`);

      // Vérifier si le fichier de point de contrôle existe
      try {
        await fs.access(checkpointFile);
      } catch {
        return null; // Aucun point de contrôle trouvé
      }

      // Lire et analyser le point de contrôle
      const checkpointData = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));

      console.log(`🔄 Restauration du point de contrôle pour l'agent ${agentName}`);

      // Mise à jour du tableau de bord si activé
      if (this.config.dashboardEnabled) {
        this.updateDashboard({
          type: 'restore',
          agentName,
          timestamp: new Date().toISOString(),
        });
      }

      return checkpointData.state;
    } catch (error) {
      console.error(
        `❌ Erreur lors de la restauration du point de contrôle pour ${agentName}:`,
        error
      );
      return null;
    }
  }

  /**
   * Sauvegarde un point de contrôle pour l'exécution d'un agent
   * @param agentName Nom de l'agent
   * @param checkpointData Données du point de contrôle
   */
  private async saveCheckpoint(agentName: string, checkpointData: any): Promise<void> {
    try {
      const checkpointDir = path.join(process.cwd(), 'logs', 'checkpoints');
      await fs.promises.mkdir(checkpointDir, { recursive: true });

      const checkpointPath = path.join(checkpointDir, `${agentName}-checkpoint.json`);
      const checkpointContent = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          agentName,
          data: checkpointData,
        },
        null,
        2
      );

      await fs.promises.writeFile(checkpointPath, checkpointContent, 'utf8');

      this.logger.debug(`Point de contrôle sauvegardé pour l'agent ${agentName}`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la sauvegarde du point de contrôle pour l'agent ${agentName}: ${error.message}`
      );
    }
  }

  /**
   * Charge un point de contrôle pour l'exécution d'un agent
   * @param agentName Nom de l'agent
   * @returns Données du point de contrôle ou null si aucun point n'existe
   */
  private async loadCheckpoint(agentName: string): Promise<any | null> {
    try {
      const checkpointPath = path.join(
        process.cwd(),
        'logs',
        'checkpoints',
        `${agentName}-checkpoint.json`
      );

      if (!fs.existsSync(checkpointPath)) {
        return null;
      }

      const checkpointContent = await fs.promises.readFile(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(checkpointContent);

      this.logger.debug(`Point de contrôle chargé pour l'agent ${agentName}`);
      return checkpoint.data;
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement du point de contrôle pour l'agent ${agentName}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Supprime un point de contrôle après une exécution réussie
   * @param agentName Nom de l'agent
   */
  private async clearCheckpoint(agentName: string): Promise<void> {
    try {
      const checkpointPath = path.join(
        process.cwd(),
        'logs',
        'checkpoints',
        `${agentName}-checkpoint.json`
      );

      if (fs.existsSync(checkpointPath)) {
        await fs.promises.unlink(checkpointPath);
        this.logger.debug(`Point de contrôle supprimé pour l'agent ${agentName}`);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du point de contrôle pour l'agent ${agentName}: ${error.message}`
      );
    }
  }

  /**
   * Calcule le pourcentage de progression global
   * @returns Pourcentage de progression (0-100)
   */
  private calculateProgress(): number {
    const totalAgents = this.config.agentsToRun.length;
    const completedAgents = this.results.length;
    return Math.floor((completedAgents / totalAgents) * 100);
  }

  /**
   * Charge les points de contrôle existants depuis le fichier
   */
  private loadCheckpoints(): void {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const data = fs.readFileSync(this.checkpointFile, 'utf8');
        this.checkpoints = JSON.parse(data);
        console.log(`Points de contrôle chargés: ${this.checkpoints.length}`);
      }
    } catch (error) {
      console.warn(`Impossible de charger les points de contrôle: ${error.message}`);
      this.checkpoints = [];
    }
  }

  /**
   * Sauvegarde les points de contrôle dans le fichier
   */
  private saveCheckpoints(): void {
    try {
      fs.writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoints, null, 2), 'utf8');
    } catch (error) {
      console.warn(`Impossible de sauvegarder les points de contrôle: ${error.message}`);
    }
  }

  /**
   * Ajoute un point de contrôle
   */
  private addCheckpoint(
    agentName: string,
    stage: 'before' | 'after' | 'error',
    status: 'pending' | 'completed' | 'failed',
    data?: any
  ): ExecutionCheckpoint {
    const checkpoint: ExecutionCheckpoint = {
      id: `${agentName}-${stage}-${Date.now()}`,
      timestamp: Date.now(),
      agentName,
      stage,
      status,
      data,
    };

    this.checkpoints.push(checkpoint);
    this.saveCheckpoints();

    return checkpoint;
  }

  /**
   * Vérifie si un agent a déjà été exécuté avec succès
   */
  private hasCompletedCheckpoint(agentName: string): boolean {
    return this.checkpoints.some(
      (cp) => cp.agentName === agentName && cp.stage === 'after' && cp.status === 'completed'
    );
  }

  /**
   * Met à jour le statut d'un point de contrôle existant
   */
  private updateCheckpoint(
    checkpointId: string,
    status: 'pending' | 'completed' | 'failed',
    data?: any
  ): void {
    const checkpoint = this.checkpoints.find((cp) => cp.id === checkpointId);
    if (checkpoint) {
      checkpoint.status = status;
      if (data) {
        checkpoint.data = data;
      }
      this.saveCheckpoints();
    }
  }

  /**
   * Sauvegarde un point de contrôle d'exécution
   * @param agentName Nom de l'agent
   * @param stage Étape d'exécution
   * @param status Statut du point de contrôle
   * @param data Données associées au point de contrôle
   * @param metadata Métadonnées additionnelles pour le point de contrôle
   */
  public saveCheckpoint(
    agentName: string,
    stage: 'before' | 'after' | 'error',
    status: 'pending' | 'completed' | 'failed',
    data?: any,
    metadata?: any
  ): string {
    const id = `${agentName}_${stage}_${Date.now()}`;
    const checkpoint: ExecutionCheckpoint = {
      id,
      timestamp: Date.now(),
      agentName,
      stage,
      status,
      data,
      metadata,
    };

    // Supprimer les anciens checkpoints du même agent et stage
    this.checkpoints = this.checkpoints.filter(
      (cp) => !(cp.agentName === agentName && cp.stage === stage)
    );

    this.checkpoints.push(checkpoint);

    // Sauvegarder les points de contrôle dans le fichier
    try {
      fs.writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoints, null, 2), 'utf8');
      console.log(`✅ Point de contrôle sauvegardé pour l'agent ${agentName} (${stage})`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde du point de contrôle: ${error.message}`);
    }

    // Mettre à jour le tableau de bord si activé
    if (this.config.dashboardEnabled) {
      this.updateDashboard('checkpoint', {
        checkpointId: id,
        agentName,
        stage,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    return id;
  }

  /**
   * Charge les points de contrôle précédemment sauvegardés
   */
  private loadCheckpoints(): void {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const data = fs.readFileSync(this.checkpointFile, 'utf8');
        this.checkpoints = JSON.parse(data);
        console.log(
          `ℹ️ Chargement de ${this.checkpoints.length} points de contrôle depuis ${this.checkpointFile}`
        );
      } else {
        this.checkpoints = [];
        console.log(`ℹ️ Aucun point de contrôle trouvé, démarrage d'une nouvelle exécution`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du chargement des points de contrôle: ${error.message}`);
      this.checkpoints = [];
    }
  }

  /**
   * Vérifie si un agent a déjà été exécuté avec succès
   * @param agentName Nom de l'agent à vérifier
   */
  public hasCompletedCheckpoint(agentName: string): boolean {
    return this.checkpoints.some(
      (cp) => cp.agentName === agentName && cp.stage === 'after' && cp.status === 'completed'
    );
  }

  /**
   * Récupère les résultats précédents d'un agent depuis les points de contrôle
   * @param agentName Nom de l'agent
   */
  public getPreviousAgentResult(agentName: string): AgentExecutionResult | null {
    const checkpoint = this.checkpoints.find(
      (cp) =>
        cp.agentName === agentName && cp.stage === 'after' && cp.status === 'completed' && cp.data
    );

    return checkpoint ? checkpoint.data : null;
  }

  /**
   * Nettoie les points de contrôle obsolètes
   * @param maxAge Âge maximum des points de contrôle en millisecondes (par défaut: 7 jours)
   */
  public cleanupCheckpoints(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    this.checkpoints = this.checkpoints.filter((cp) => now - cp.timestamp < maxAge);
    this.saveCheckpoints();
    console.log(
      `🧹 Nettoyage des points de contrôle obsolètes terminé (${this.checkpoints.length} restants)`
    );
  }

  /**
   * Liste tous les points de contrôle disponibles
   * @param filter Critères de filtrage optionnels
   */
  public listCheckpoints(filter?: {
    agentName?: string;
    stage?: 'before' | 'after' | 'error';
    status?: 'pending' | 'completed' | 'failed';
  }): ExecutionCheckpoint[] {
    let filteredCheckpoints = [...this.checkpoints];

    if (filter) {
      if (filter.agentName) {
        filteredCheckpoints = filteredCheckpoints.filter((cp) => cp.agentName === filter.agentName);
      }

      if (filter.stage) {
        filteredCheckpoints = filteredCheckpoints.filter((cp) => cp.stage === filter.stage);
      }

      if (filter.status) {
        filteredCheckpoints = filteredCheckpoints.filter((cp) => cp.status === filter.status);
      }
    }

    return filteredCheckpoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Restaure l'exécution à partir du dernier point de contrôle valide
   * @returns true si la restauration a réussi, false sinon
   */
  public async restoreFromLastCheckpoint(): Promise<boolean> {
    // Trouver tous les agents complétés
    const completedAgents = this.checkpoints
      .filter((cp) => cp.stage === 'after' && cp.status === 'completed')
      .map((cp) => cp.agentName);

    if (completedAgents.length === 0) {
      console.log(`ℹ️ Aucun point de contrôle valide trouvé pour la reprise`);
      return false;
    }

    console.log(
      `🔄 Reprise à partir des derniers points de contrôle (${completedAgents.length} agents terminés)`
    );

    // Restaurer les résultats précédents
    for (const agentName of completedAgents) {
      const result = this.getPreviousAgentResult(agentName);
      if (result) {
        console.log(`📋 Restauration des résultats pour l'agent ${agentName}`);
        this.results.push(result);
      }
    }

    // Mettre à jour le tableau de bord
    if (this.config.dashboardEnabled) {
      await this.updateDashboard('restore', {
        timestamp: new Date().toISOString(),
        completedAgents,
        progress: this.calculateProgress(),
      });
    }

    return true;
  }

  /**
   * Exécute un agent spécifique avec gestion des erreurs et des points de contrôle
   * @param agentName Nom de l'agent à exécuter
   * @param args Arguments à passer à l'agent
   */
  public async executeAgent(agentName: string, args: any = {}): Promise<AgentExecutionResult> {
    // Vérifier si l'agent a déjà été exécuté avec succès
    if (this.config.useCheckpoints && this.hasCompletedCheckpoint(agentName)) {
      console.log(`🔄 Agent ${agentName} déjà exécuté, utilisation des résultats précédents`);
      const previousResult = this.getPreviousAgentResult(agentName);
      if (previousResult) {
        return previousResult;
      }
    }

    // Créer un point de contrôle avant l'exécution
    if (this.config.useCheckpoints) {
      this.saveCheckpoint(agentName, 'before', 'pending', args);
    }

    console.log(`🚀 Exécution de l'agent: ${agentName}`);
    const startTime = Date.now();

    try {
      // Initialiser l'agent en fonction de son type
      const agent = this.initializeAgent(agentName);

      // Exécuter l'agent avec les arguments fournis
      const result = await agent.execute(args);

      // Calculer la durée d'exécution
      const duration = Date.now() - startTime;

      // Créer un point de contrôle après l'exécution réussie
      if (this.config.useCheckpoints) {
        this.saveCheckpoint(agentName, 'after', 'completed', result, {
          duration,
          resources: agent.getResourceUsage?.() || {},
        });
      }

      // Enregistrer le résultat
      this.results.push({
        agentName,
        timestamp: new Date().toISOString(),
        status: 'success',
        data: result,
        duration,
      });

      console.log(`✅ Agent ${agentName} terminé en ${duration}ms`);

      // Mettre à jour le tableau de bord
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('agentComplete', {
          agentName,
          status: 'success',
          duration,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erreur lors de l'exécution de l'agent ${agentName}: ${error.message}`);

      // Créer un point de contrôle d'erreur
      if (this.config.useCheckpoints) {
        this.saveCheckpoint(
          agentName,
          'error',
          'failed',
          { error: error.message },
          {
            duration,
            errorStack: error.stack,
          }
        );
      }

      // Enregistrer l'erreur
      this.results.push({
        agentName,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message,
        duration,
      });

      // Mettre à jour le tableau de bord
      if (this.config.dashboardEnabled) {
        await this.updateDashboard('agentError', {
          agentName,
          error: error.message,
          duration,
          timestamp: new Date().toISOString(),
        });
      }

      // Tenter une reprise automatique si configuré
      if (this.config.autoRetry && this.config.maxRetries > 0) {
        return this.handleRetry(agentName, args, error);
      }

      throw error;
    }
  }

  /**
   * Gère la tentative de réexécution d'un agent après une erreur
   * @param agentName Nom de l'agent
   * @param args Arguments de l'agent
   * @param originalError Erreur originale
   */
  private async handleRetry(
    agentName: string,
    args: any,
    originalError: Error
  ): Promise<AgentExecutionResult> {
    const retryCount = this.getRetryCount(agentName);

    if (retryCount >= this.config.maxRetries) {
      console.error(`❌ Nombre maximum de tentatives atteint pour l'agent ${agentName}`);
      throw originalError;
    }

    // Attendre avant de réessayer (backoff exponentiel)
    const delayMs = this.calculateRetryDelay(retryCount);
    console.log(
      `⏱️ Nouvelle tentative pour l'agent ${agentName} dans ${delayMs}ms (tentative ${
        retryCount + 1
      }/${this.config.maxRetries})`
    );

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Incrémenter le compteur de tentatives
    this.incrementRetryCount(agentName);

    // Réessayer l'exécution
    return this.executeAgent(agentName, args);
  }

  /**
   * Récupère le nombre de tentatives pour un agent
   * @param agentName Nom de l'agent
   */
  private getRetryCount(agentName: string): number {
    if (!this.retries[agentName]) {
      this.retries[agentName] = 0;
    }
    return this.retries[agentName];
  }

  /**
   * Incrémente le compteur de tentatives pour un agent
   * @param agentName Nom de l'agent
   */
  private incrementRetryCount(agentName: string): void {
    if (!this.retries[agentName]) {
      this.retries[agentName] = 0;
    }
    this.retries[agentName]++;
  }

  /**
   * Calcule le délai avant une nouvelle tentative (backoff exponentiel)
   * @param retryCount Nombre de tentatives actuelles
   */
  private calculateRetryDelay(retryCount: number): number {
    // Backoff exponentiel avec une limite maximale
    const baseDelay = this.config.retryBaseDelay || 1000;
    const maxDelay = this.config.retryMaxDelay || 30000;

    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount) + Math.random() * 1000);

    return Math.round(delay);
  }

  /**
   * Sauvegarde un point de contrôle pour un agent spécifique
   * @param agentName Nom de l'agent
   * @param phase Phase de l'exécution (before, after, error)
   * @param status Statut de l'exécution (pending, completed, failed)
   * @param data Données à sauvegarder
   */
  private saveCheckpoint(
    agentName: string,
    phase: 'before' | 'after' | 'error',
    status: 'pending' | 'completed' | 'failed',
    data: any
  ): void {
    if (!this.config.useCheckpoints || !this.config.checkpointDir) {
      return;
    }

    try {
      // Créer le répertoire des checkpoints s'il n'existe pas
      if (!fs.existsSync(this.config.checkpointDir)) {
        fs.mkdirSync(this.config.checkpointDir, { recursive: true });
      }

      const timestamp = new Date().toISOString();
      const checkpointId = `${agentName}_${phase}_${timestamp.replace(/[:.]/g, '-')}`;
      const checkpointPath = path.join(this.config.checkpointDir, `${checkpointId}.json`);

      // Créer le contenu du checkpoint
      const checkpoint = {
        id: checkpointId,
        agentName,
        phase,
        status,
        timestamp,
        data,
      };

      // Écrire le checkpoint
      fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

      // Mettre à jour l'index des checkpoints
      this.updateCheckpointIndex(checkpoint, checkpointPath);

      console.log(`💾 Point de contrôle créé: ${checkpointId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du point de contrôle: ${error.message}`);
    }
  }

  /**
   * Met à jour l'index des points de contrôle
   * @param checkpoint Informations du checkpoint
   * @param checkpointPath Chemin du fichier de checkpoint
   */
  private updateCheckpointIndex(checkpoint: any, checkpointPath: string): void {
    if (!this.config.checkpointDir) {
      return;
    }

    const indexPath = path.join(this.config.checkpointDir, 'checkpoint-index.json');
    let index: Record<string, any> = {};

    // Charger l'index existant s'il existe
    if (fs.existsSync(indexPath)) {
      try {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        index = JSON.parse(indexContent);
      } catch (error) {
        console.error(`⚠️ Erreur lors de la lecture de l'index des checkpoints: ${error.message}`);
      }
    }

    // Ajouter ou mettre à jour l'entrée pour cet agent
    index[checkpoint.agentName] = {
      agentName: checkpoint.agentName,
      lastPhase: checkpoint.phase,
      status: checkpoint.status,
      timestamp: checkpoint.timestamp,
      path: checkpointPath,
    };

    // Écrire l'index mis à jour
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Vérifie si un agent a un checkpoint complet
   * @param agentName Nom de l'agent
   * @returns true si l'agent a un checkpoint complet
   */
  private hasCompletedCheckpoint(agentName: string): boolean {
    if (!this.config.useCheckpoints || !this.config.checkpointDir) {
      return false;
    }

    const indexPath = path.join(this.config.checkpointDir, 'checkpoint-index.json');
    if (!fs.existsSync(indexPath)) {
      return false;
    }

    try {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const index = JSON.parse(indexContent);

      // Vérifier si l'agent a un checkpoint et s'il est complet
      return index[agentName]?.status === 'completed' && index[agentName]?.lastPhase === 'after';
    } catch (error) {
      console.error(`⚠️ Erreur lors de la vérification des checkpoints: ${error.message}`);
      return false;
    }
  }

  /**
   * Récupère le résultat précédent d'un agent à partir d'un checkpoint
   * @param agentName Nom de l'agent
   * @returns Résultat de l'exécution précédente ou null
   */
  private getPreviousAgentResult(agentName: string): AgentExecutionResult | null {
    if (!this.config.useCheckpoints || !this.config.checkpointDir) {
      return null;
    }

    const indexPath = path.join(this.config.checkpointDir, 'checkpoint-index.json');
    if (!fs.existsSync(indexPath)) {
      return null;
    }

    try {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const index = JSON.parse(indexContent);

      // Vérifier si l'agent a un checkpoint complet
      if (!(index[agentName]?.status === 'completed' && index[agentName]?.lastPhase === 'after')) {
        return null;
      }

      // Charger le checkpoint
      const checkpointPath = index[agentName].path;
      if (!fs.existsSync(checkpointPath)) {
        return null;
      }

      const checkpointContent = fs.readFileSync(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(checkpointContent);

      return checkpoint.data as AgentExecutionResult;
    } catch (error) {
      console.error(`⚠️ Erreur lors de la récupération du résultat précédent: ${error.message}`);
      return null;
    }
  }

  /**
   * Nettoie les checkpoints obsolètes
   * @param maxAge Âge maximum des checkpoints en millisecondes
   */
  public cleanupCheckpoints(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    if (!this.config.useCheckpoints || !this.config.checkpointDir) {
      return;
    }

    console.log(`🧹 Nettoyage des points de contrôle obsolètes (âge max: ${maxAge}ms)...`);

    try {
      if (!fs.existsSync(this.config.checkpointDir)) {
        return;
      }

      const now = new Date().getTime();
      const files = fs.readdirSync(this.config.checkpointDir);
      let deletedCount = 0;

      for (const file of files) {
        // Ignorer l'index
        if (file === 'checkpoint-index.json') {
          continue;
        }

        const filePath = path.join(this.config.checkpointDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      // Mettre à jour l'index après le nettoyage
      this.rebuildCheckpointIndex();

      console.log(`✅ Nettoyage terminé: ${deletedCount} point(s) de contrôle supprimé(s)`);
    } catch (error) {
      console.error(`❌ Erreur lors du nettoyage des points de contrôle: ${error.message}`);
    }
  }

  /**
   * Reconstruit l'index des checkpoints à partir des fichiers existants
   */
  private rebuildCheckpointIndex(): void {
    if (!this.config.checkpointDir) {
      return;
    }

    try {
      const indexPath = path.join(this.config.checkpointDir, 'checkpoint-index.json');
      const files = fs.readdirSync(this.config.checkpointDir);
      const index: Record<string, any> = {};

      for (const file of files) {
        // Ignorer l'index
        if (file === 'checkpoint-index.json') {
          continue;
        }

        const filePath = path.join(this.config.checkpointDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const checkpoint = JSON.parse(content);

          // Ne conserver que le checkpoint le plus récent pour chaque agent
          if (
            !index[checkpoint.agentName] ||
            new Date(checkpoint.timestamp) > new Date(index[checkpoint.agentName].timestamp)
          ) {
            index[checkpoint.agentName] = {
              agentName: checkpoint.agentName,
              lastPhase: checkpoint.phase,
              status: checkpoint.status,
              timestamp: checkpoint.timestamp,
              path: filePath,
            };
          }
        } catch (error) {
          console.error(`⚠️ Erreur lors de la lecture du checkpoint ${file}: ${error.message}`);
        }
      }

      // Écrire l'index mis à jour
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error(`❌ Erreur lors de la reconstruction de l'index: ${error.message}`);
    }
  }
}

/**
 * Point d'entrée en ligne de commande
 */
async function main() {
  // Analyser les arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node coordinator-agent.ts <chemin-fichier-php> [options]');
    console.error('Options:');
    console.error('  --parallel                  Exécuter les agents en parallèle');
    console.error('  --force                     Forcer la réexécution même si déjà audité');
    console.error('  --no-deps                   Désactiver la vérification des dépendances');
    console.error(
      "  --agents <liste>            Liste d'agents à exécuter (séparés par des virgules)"
    );
    console.error('  --output <dir>              Dossier de sortie des rapports');
    console.error('  --cahier <path>             Chemin vers le cahier des charges');
    console.error(
      '  --no-cahier                 Désactiver la validation avec le cahier des charges'
    );
    process.exit(1);
  }

  const phpFilePath = args[0];
  const parallel = args.includes('--parallel');
  const forceRerun = args.includes('--force');
  const dependencyCheck = !args.includes('--no-deps');
  const validateCahierDesCharges = !args.includes('--no-cahier');

  let agentsToRun;
  let outputDir;
  let cahierDesChargesPath;

  // Extraire la liste des agents
  const agentsIndex = args.indexOf('--agents');
  if (agentsIndex !== -1 && agentsIndex < args.length - 1) {
    agentsToRun = args[agentsIndex + 1].split(',');
  }

  // Extraire le dossier de sortie
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && outputIndex < args.length - 1) {
    outputDir = args[outputIndex + 1];
  }

  // Extraire le chemin du cahier des charges
  const cahierIndex = args.indexOf('--cahier');
  if (cahierIndex !== -1 && cahierIndex < args.length - 1) {
    cahierDesChargesPath = args[cahierIndex + 1];
  }

  try {
    const coordinator = new CoordinatorAgent({
      phpFilePath,
      outputDir,
      agentsToRun,
      parallel,
      forceRerun,
      dependencyCheck,
      validateCahierDesCharges,
      cahierDesChargesPath,
      hooks: {
        beforeAgent: async (agentName) => {
          console.log(`⏳ Préparation de l'agent ${agentName}...`);
        },
        afterAgent: async (agentName, result) => {
          console.log(
            `🏁 Finalisation de l'agent ${agentName} avec ${result.sections.length} sections...`
          );
        },
        onError: async (agentName, error) => {
          console.error(`🚨 Erreur avec l'agent ${agentName}: ${error.message}`);
        },
        onComplete: async (results) => {
          const successCount = results.filter((r) => r.success).length;
          const totalCount = results.length;
          console.log(
            `🎉 Terminé! ${successCount}/${totalCount} agents ont réussi leur exécution.`
          );
        },
      },
    });

    await coordinator.execute();
    await coordinator.saveExecutionReport();
  } catch (error) {
    console.error(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
