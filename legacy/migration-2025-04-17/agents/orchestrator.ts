import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';

// Import des agents existants
import { ciTesterAgent } from './CiTester';
import { devCheckerAgent } from './DevChecker';
import { devIntegratorAgent } from './DevIntegrator';
import { devLinterAgent } from './DevLinter';
import { diffVerifierAgent } from './DiffVerifier';

// Types pour l'orchestrateur
interface OrchestratorContext {
  mode: 'full' | 'lite' | 'verification' | 'remediation' | 'ci' | 'performance';
  target?: string; // fichier ou dossier spécifique
  autoRemediate?: boolean;
  generateReport?: boolean;
  notifyTeam?: boolean;
  updateDiscoveryMap?: boolean;
  benchmarkPerformance?: boolean;
  runParallel?: boolean; // Exécuter des agents en parallèle
  skipIfPrevious?: boolean; // Sauter un agent si le précédent a échoué
  continueOnError?: boolean; // Continuer en cas d'erreur
  pipelineId?: string; // Identifiant de pipeline pour le suivi
  // Nouvelles options de coordination
  retryCount?: number; // Nombre maximum de tentatives pour chaque agent
  checkpointFrequency?: number; // Fréquence de sauvegarde des points de contrôle (en ms)
  priority?: 'speed' | 'accuracy' | 'balanced'; // Priorité de l'orchestration
  timeoutPerAgent?: number; // Délai d'expiration par agent (en ms)
  saveSharedData?: boolean; // Sauvegarder les données partagées entre les exécutions
  verboseLogging?: boolean; // Journalisation détaillée
}

interface AgentResult {
  status: 'success' | 'error' | 'warning';
  logs: string[];
  [key: string]: any;
}

interface OrchestratorReport {
  startTime: string;
  endTime: string;
  duration: number;
  mode: string;
  target?: string;
  pipelineId?: string;
  agents: {
    name: string;
    status: 'success' | 'error' | 'warning' | 'skipped' | 'retried';
    startTime: string;
    endTime: string;
    duration: number;
    attempts?: number; // Nouveau: nombre de tentatives
    summary?: any;
    details?: any;
    error?: string;
  }[];
  overallStatus: 'success' | 'partial' | 'failed';
  benchmarks?: {
    name: string;
    legacy?: number;
    migrated?: number;
    improvement?: number;
  }[];
  sharedData?: any; // Données partagées entre les agents
  checkpoints?: {
    // Nouveau: points de contrôle
    timestamp: string;
    completedAgents: string[];
    state: any;
  }[];
}

// Interface pour les métriques de performance des agents
interface AgentPerformanceMetrics {
  averageExecutionTime: number;
  successRate: number;
  lastExecutionTimestamp: string;
  failureReasons?: string[];
  resourceUsage?: {
    cpu?: number;
    memory?: number;
  };
}

export const orchestratorAgent = {
  name: 'orchestrator',
  description: 'Coordonne tous les agents pour créer un pipeline complet de validation',

  async run(
    context: OrchestratorContext
  ): Promise<{ status: string; logs: string[]; report: OrchestratorReport }> {
    const logs: string[] = [];
    const startTime = new Date();

    // Initialiser les options de configuration avec des valeurs par défaut
    context = this.initializeContext(context);

    logs.push(
      `🚀 Démarrage de l'orchestrateur en mode ${context.mode} (ID: ${context.pipelineId})`
    );
    if (context.verboseLogging) {
      logs.push(`📝 Configuration détaillée: ${JSON.stringify(context, null, 2)}`);
    }

    // Initialiser le rapport
    const report: OrchestratorReport = {
      startTime: startTime.toISOString(),
      endTime: '',
      duration: 0,
      mode: context.mode,
      target: context.target,
      pipelineId: context.pipelineId,
      agents: [],
      overallStatus: 'success',
      sharedData: {}, // Données partagées entre les agents
      checkpoints: [], // Points de contrôle
    };

    try {
      // Restaurer les données partagées de l'exécution précédente si activé
      if (context.saveSharedData) {
        await this.restoreSharedData(report, logs);
      }

      // Créer le répertoire de travail pour ce pipeline
      const workDir = path.resolve('reports', `pipeline-${context.pipelineId}`);
      if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
      }
      logs.push(`📁 Répertoire de travail: ${workDir}`);

      // Charger les métriques de performance des agents
      const agentMetrics = this.loadAgentPerformanceMetrics();

      // Déterminer quels agents exécuter en fonction du mode
      const agentsToRun = this.getAgentsForMode(context.mode);
      logs.push(`📋 Agents à exécuter: ${agentsToRun.map((a) => a.name).join(', ')}`);

      // Optimiser l'ordre des agents en fonction des métriques si priorité = speed
      if (context.priority === 'speed') {
        this.optimizeAgentsOrder(agentsToRun, agentMetrics, logs);
      }

      // Configurer un intervalle pour les checkpoints si activé
      let checkpointInterval: NodeJS.Timeout | null = null;
      if (context.checkpointFrequency && context.checkpointFrequency > 0) {
        checkpointInterval = setInterval(() => {
          const checkpoint = {
            timestamp: new Date().toISOString(),
            completedAgents: report.agents.map((a) => a.name),
            state: report.sharedData,
          };
          report.checkpoints?.push(checkpoint);
          this.saveCheckpoint(checkpoint, context.pipelineId as string);
          if (context.verboseLogging) {
            logs.push(`💾 Point de contrôle créé à ${checkpoint.timestamp}`);
          }
        }, context.checkpointFrequency);
      }

      // Exécuter chaque agent (séquentiellement ou en parallèle)
      if (context.runParallel) {
        logs.push(`⚡ Exécution en parallèle des agents compatibles`);

        // Regrouper les agents qui peuvent être exécutés en parallèle
        const parallelGroups = this.groupAgentsForParallelExecution(agentsToRun);
        logs.push(`🔀 Groupes en parallèle: ${parallelGroups.length}`);

        for (const group of parallelGroups) {
          if (group.length === 1) {
            logs.push(`\n🔄 Exécution de l'agent: ${group[0].name}`);
            await this.runSingleAgent(group[0], context, report, logs, workDir, agentMetrics);
          } else {
            logs.push(
              `\n🔀 Exécution en parallèle du groupe: ${group.map((a) => a.name).join(', ')}`
            );

            // Exécuter les agents en parallèle avec gestion des délais d'attente
            const promises = group.map((agent) => {
              // Créer une promesse avec délai d'attente si configuré
              if (context.timeoutPerAgent && context.timeoutPerAgent > 0) {
                return Promise.race([
                  this.runSingleAgent(agent, context, report, logs, workDir, agentMetrics),
                  new Promise<void>((_, reject) => {
                    setTimeout(() => {
                      logs.push(
                        `⏱️ L'agent ${agent.name} a dépassé le délai d'expiration de ${context.timeoutPerAgent}ms`
                      );
                      reject(new Error(`Timeout for agent ${agent.name}`));
                    }, context.timeoutPerAgent);
                  }),
                ]).catch((err) => {
                  // En cas d'erreur de délai d'attente, enregistrer l'échec
                  logs.push(
                    `⚠️ Erreur lors de l'exécution en parallèle de l'agent ${agent.name}: ${err.message}`
                  );
                  report.agents.push({
                    name: agent.name,
                    status: 'error',
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                    duration: 0,
                    error: `Timeout: ${err.message}`,
                  });
                });
              } else {
                return this.runSingleAgent(agent, context, report, logs, workDir, agentMetrics);
              }
            });

            await Promise.all(promises);
          }

          // Sauvegarder un point de contrôle après chaque groupe
          if (context.checkpointFrequency) {
            const checkpoint = {
              timestamp: new Date().toISOString(),
              completedAgents: report.agents.map((a) => a.name),
              state: report.sharedData,
            };
            report.checkpoints?.push(checkpoint);
            this.saveCheckpoint(checkpoint, context.pipelineId as string);
          }

          // Vérifier si nous devons continuer après le groupe
          if (
            !context.continueOnError &&
            report.overallStatus === 'failed' &&
            context.skipIfPrevious
          ) {
            logs.push(`⚠️ Arrêt après échec d'un groupe d'agents`);
            break;
          }
        }
      } else {
        // Exécution séquentielle
        for (const agent of agentsToRun) {
          logs.push(`\n🔄 Exécution de l'agent: ${agent.name}`);
          await this.runSingleAgent(agent, context, report, logs, workDir, agentMetrics);

          // Sauvegarder un point de contrôle après chaque agent
          if (context.checkpointFrequency) {
            const checkpoint = {
              timestamp: new Date().toISOString(),
              completedAgents: report.agents.map((a) => a.name),
              state: report.sharedData,
            };
            report.checkpoints?.push(checkpoint);
            this.saveCheckpoint(checkpoint, context.pipelineId as string);
          }

          // Vérifier si nous devons continuer
          if (
            !context.continueOnError &&
            report.overallStatus === 'failed' &&
            context.skipIfPrevious
          ) {
            logs.push(`⚠️ Arrêt après échec de l'agent ${agent.name}`);
            break;
          }
        }
      }

      // Arrêter l'intervalle de checkpoint s'il est actif
      if (checkpointInterval) {
        clearInterval(checkpointInterval);
      }

      // Exécuter les benchmarks de performance si demandé
      if (context.benchmarkPerformance) {
        logs.push(`\n📊 Exécution des benchmarks de performance`);
        report.benchmarks = await this.runPerformanceBenchmarks(
          context.target,
          report.sharedData,
          logs
        );
      }

      // Générer un rapport global si demandé
      if (context.generateReport) {
        this.generateGlobalReport(report, logs, workDir);
      }

      // Mettre à jour le tableau de bord
      await this.updateDashboard(report, logs);

      // Sauvegarder les données partagées pour une utilisation future si activé
      if (context.saveSharedData) {
        this.saveSharedData(report.sharedData, context.pipelineId as string);
      }

      // Mettre à jour les métriques de performance des agents
      this.updateAgentPerformanceMetrics(report, agentMetrics);

      // Notifier l'équipe si demandé
      if (context.notifyTeam) {
        this.notifyTeam(report, logs);
      }

      // Finaliser le rapport
      const endTime = new Date();
      report.endTime = endTime.toISOString();
      report.duration = endTime.getTime() - startTime.getTime();

      logs.push(
        `\n✅ Orchestration terminée en ${report.duration}ms avec statut: ${report.overallStatus}`
      );

      // Sauvegarder le rapport complet
      this.saveOrchestratorReport(report, workDir);

      return {
        status: report.overallStatus,
        logs,
        report,
      };
    } catch (err: any) {
      const endTime = new Date();
      report.endTime = endTime.toISOString();
      report.duration = endTime.getTime() - startTime.getTime();
      report.overallStatus = 'failed';

      logs.push(`❌ Erreur générale dans l'orchestrateur: ${err.message}`);

      // Sauvegarder le rapport d'erreur
      this.saveOrchestratorReport(report);

      return {
        status: 'error',
        logs,
        report,
      };
    }
  },

  /**
   * Initialise le contexte avec des valeurs par défaut
   */
  initializeContext(context: OrchestratorContext): OrchestratorContext {
    // Valeurs par défaut
    return {
      ...context,
      pipelineId:
        context.pipelineId || `pipeline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      retryCount: context.retryCount !== undefined ? context.retryCount : 2,
      checkpointFrequency: context.checkpointFrequency || 0,
      priority: context.priority || 'balanced',
      timeoutPerAgent: context.timeoutPerAgent || 0,
      saveSharedData: context.saveSharedData !== undefined ? context.saveSharedData : false,
      verboseLogging: context.verboseLogging !== undefined ? context.verboseLogging : false,
    };
  },

  /**
   * Optimise l'ordre des agents en fonction des métriques de performance
   */
  optimizeAgentsOrder(
    agents: any[],
    metrics: Record<string, AgentPerformanceMetrics>,
    logs: string[]
  ): void {
    if (Object.keys(metrics).length === 0) {
      return; // Pas de métriques à utiliser pour l'optimisation
    }

    logs.push(`🔄 Optimisation de l'ordre des agents basée sur les métriques de performance`);

    // Trier les agents par temps d'exécution moyen (du plus rapide au plus lent)
    // tout en respectant les dépendances entre agents
    const dependencies: Record<string, string[]> = {
      DiffVerifier: [], // Pas de dépendances
      DevLinter: [], // Pas de dépendances
      DevChecker: ['DevLinter'], // Dépend de DevLinter
      DevIntegrator: ['DiffVerifier', 'DevChecker'], // Dépend de DiffVerifier et DevChecker
      CiTester: ['DevChecker'], // Dépend de DevChecker
    };

    // Classer les agents par niveaux de dépendance
    const levels: Record<string, number> = {};
    for (const agent of agents) {
      this.calculateDependencyLevel(agent.name, dependencies, levels);
    }

    // Trier d'abord par niveau de dépendance, puis par temps d'exécution
    agents.sort((a, b) => {
      // D'abord trier par niveau de dépendance
      const levelDiff = (levels[a.name] || 0) - (levels[b.name] || 0);
      if (levelDiff !== 0) return levelDiff;

      // Ensuite par temps d'exécution moyen s'il existe
      const timeA = metrics[a.name]?.averageExecutionTime || 0;
      const timeB = metrics[b.name]?.averageExecutionTime || 0;
      return timeA - timeB;
    });

    logs.push(`📋 Nouvel ordre des agents: ${agents.map((a) => a.name).join(', ')}`);
  },

  /**
   * Calcule le niveau de dépendance d'un agent
   */
  calculateDependencyLevel(
    agentName: string,
    dependencies: Record<string, string[]>,
    levels: Record<string, number>,
    visited: Set<string> = new Set()
  ): number {
    // Éviter les boucles infinies
    if (visited.has(agentName)) {
      return levels[agentName] || 0;
    }

    visited.add(agentName);

    // Si le niveau est déjà calculé, le retourner
    if (levels[agentName] !== undefined) {
      return levels[agentName];
    }

    // Si pas de dépendances, niveau 0
    const deps = dependencies[agentName] || [];
    if (deps.length === 0) {
      levels[agentName] = 0;
      return 0;
    }

    // Calculer le niveau en fonction des dépendances
    let maxLevel = 0;
    for (const dep of deps) {
      const depLevel = this.calculateDependencyLevel(dep, dependencies, levels, visited);
      maxLevel = Math.max(maxLevel, depLevel);
    }

    // Le niveau est le max des niveaux des dépendances + 1
    levels[agentName] = maxLevel + 1;
    return levels[agentName];
  },

  /**
   * Exécute un agent unique avec le contexte approprié et gestion des erreurs/retries
   */
  async runSingleAgent(
    agent: any,
    globalContext: OrchestratorContext,
    report: OrchestratorReport,
    logs: string[],
    workDir: string,
    metrics: Record<string, AgentPerformanceMetrics>
  ): Promise<void> {
    const agentStartTime = new Date();
    let attempts = 0;
    let success = false;
    let agentResult: any = null;
    let lastError: Error | null = null;

    // Déterminer le nombre max de tentatives
    const maxAttempts = globalContext.retryCount !== undefined ? globalContext.retryCount + 1 : 1;

    while (attempts < maxAttempts && !success) {
      attempts++;

      if (attempts > 1) {
        logs.push(`🔄 Tentative ${attempts}/${maxAttempts} pour l'agent ${agent.name}`);
      }

      try {
        // Adapter le contexte pour l'agent spécifique
        const agentContext = this.prepareAgentContext(agent.name, globalContext, report.sharedData);

        // Ajouter le répertoire de travail pour les artefacts de cet agent
        agentContext.workDir = path.join(workDir, agent.name);
        if (!fs.existsSync(agentContext.workDir)) {
          fs.mkdirSync(agentContext.workDir, { recursive: true });
        }

        // Ajouter des informations sur la tentative en cours
        agentContext.attempt = attempts;
        agentContext.maxAttempts = maxAttempts;

        // Mesurer les ressources utilisées si possible
        const resourceUsageBefore = this.measureResourceUsage();

        // Exécuter l'agent avec gestion du délai d'attente
        if (globalContext.timeoutPerAgent && globalContext.timeoutPerAgent > 0) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(`Agent ${agent.name} timed out after ${globalContext.timeoutPerAgent}ms`)
              );
            }, globalContext.timeoutPerAgent);
          });

          agentResult = await Promise.race([agent.run(agentContext), timeoutPromise]);
        } else {
          agentResult = await agent.run(agentContext);
        }

        // Mesurer l'utilisation des ressources après exécution
        const resourceUsageAfter = this.measureResourceUsage();
        const resourceDelta = {
          cpu: resourceUsageAfter.cpu - resourceUsageBefore.cpu,
          memory: resourceUsageAfter.memory - resourceUsageBefore.memory,
        };

        // Ajouter les logs de l'agent
        logs.push(...agentResult.logs.map((log) => `  ${log}`));

        success = true;
      } catch (err: any) {
        lastError = err;
        logs.push(
          `❌ Erreur lors de la tentative ${attempts}/${maxAttempts} pour l'agent ${agent.name}: ${err.message}`
        );

        // Si c'est la dernière tentative, enregistrer l'échec
        if (attempts >= maxAttempts) {
          logs.push(`❌ Toutes les tentatives ont échoué pour l'agent ${agent.name}`);
        }
      }
    }

    const agentEndTime = new Date();
    const duration = agentEndTime.getTime() - agentStartTime.getTime();

    // Enregistrer le résultat dans le rapport
    if (success) {
      const agentReport = {
        name: agent.name,
        status: agentResult.status,
        startTime: agentStartTime.toISOString(),
        endTime: agentEndTime.toISOString(),
        duration: duration,
        attempts: attempts,
        summary: agentResult.summary || null,
        details: agentResult.details || null,
      };

      report.agents.push(agentReport);

      // Partager les données de l'agent pour les agents suivants
      if (agentResult.data) {
        report.sharedData[agent.name] = agentResult.data;
      }

      // Mettre à jour le statut global
      if (agentResult.status === 'error') {
        report.overallStatus = 'failed';
      } else if (agentResult.status === 'warning' && report.overallStatus !== 'failed') {
        report.overallStatus = 'partial';
      }
    } else {
      // Enregistrer l'échec dans le rapport
      report.agents.push({
        name: agent.name,
        status: 'error',
        startTime: agentStartTime.toISOString(),
        endTime: agentEndTime.toISOString(),
        duration: duration,
        attempts: attempts,
        error: lastError?.message || 'Échec inconnu',
      });

      report.overallStatus = 'failed';

      // Récupérer et stocker la raison de l'échec pour les métriques
      if (metrics[agent.name]) {
        if (!metrics[agent.name].failureReasons) {
          metrics[agent.name].failureReasons = [];
        }
        metrics[agent.name].failureReasons.push(lastError?.message || 'Échec inconnu');
        // Limiter la taille du tableau des raisons d'échec
        if (metrics[agent.name].failureReasons.length > 10) {
          metrics[agent.name].failureReasons = metrics[agent.name].failureReasons.slice(-10);
        }
      }
    }
  },

  /**
   * Mesure l'utilisation des ressources système
   */
  measureResourceUsage(): { cpu: number; memory: number } {
    try {
      // Tentative de mesure de l'utilisation des ressources
      // Note: Ceci est une implémentation simplifiée
      const memoryUsage = process.memoryUsage();

      return {
        cpu: process.cpuUsage().user / 1000, // en millisecondes
        memory: memoryUsage.rss / (1024 * 1024), // en MB
      };
    } catch (err) {
      // En cas d'erreur, retourner des valeurs par défaut
      return { cpu: 0, memory: 0 };
    }
  },

  /**
   * Charge les métriques de performance des agents
   */
  loadAgentPerformanceMetrics(): Record<string, AgentPerformanceMetrics> {
    try {
      const metricsFile = path.resolve('reports', 'agent_performance_metrics.json');
      if (fs.existsSync(metricsFile)) {
        return JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      }
    } catch (err) {
      // Ignorer les erreurs
    }
    return {};
  },

  /**
   * Met à jour les métriques de performance des agents
   */
  updateAgentPerformanceMetrics(
    report: OrchestratorReport,
    metrics: Record<string, AgentPerformanceMetrics>
  ): void {
    for (const agent of report.agents) {
      if (!metrics[agent.name]) {
        metrics[agent.name] = {
          averageExecutionTime: agent.duration,
          successRate: agent.status === 'success' ? 1 : 0,
          lastExecutionTimestamp: agent.endTime,
          resourceUsage: { cpu: 0, memory: 0 },
        };
      } else {
        // Mettre à jour la moyenne du temps d'exécution (moyenne mobile)
        const prevAvg = metrics[agent.name].averageExecutionTime;
        const alpha = 0.3; // Facteur de pondération pour la moyenne mobile exponentielle
        metrics[agent.name].averageExecutionTime = alpha * agent.duration + (1 - alpha) * prevAvg;

        // Mettre à jour le taux de réussite (moyenne mobile)
        const prevRate = metrics[agent.name].successRate;
        const success = agent.status === 'success' ? 1 : 0;
        metrics[agent.name].successRate = alpha * success + (1 - alpha) * prevRate;

        // Mettre à jour l'horodatage
        metrics[agent.name].lastExecutionTimestamp = agent.endTime;
      }
    }

    // Sauvegarder les métriques mises à jour
    try {
      const metricsFile = path.resolve('reports', 'agent_performance_metrics.json');
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    } catch (err) {
      // Ignorer les erreurs d'écriture
    }
  },

  /**
   * Sauvegarde un point de contrôle
   */
  saveCheckpoint(checkpoint: any, pipelineId: string): void {
    try {
      const checkpointDir = path.resolve('reports', 'checkpoints');
      if (!fs.existsSync(checkpointDir)) {
        fs.mkdirSync(checkpointDir, { recursive: true });
      }

      const checkpointFile = path.resolve(checkpointDir, `${pipelineId}_${Date.now()}.json`);
      fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
    } catch (err) {
      // Ignorer les erreurs d'écriture
    }
  },

  /**
   * Sauvegarde les données partagées pour une utilisation future
   */
  saveSharedData(sharedData: any, pipelineId: string): void {
    try {
      const dataDir = path.resolve('reports', 'shared_data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dataFile = path.resolve(dataDir, `${pipelineId}_shared_data.json`);
      fs.writeFileSync(dataFile, JSON.stringify(sharedData, null, 2));
    } catch (err) {
      // Ignorer les erreurs d'écriture
    }
  },

  /**
   * Restaure les données partagées d'une exécution précédente
   */
  async restoreSharedData(report: OrchestratorReport, logs: string[]): Promise<void> {
    try {
      const dataDir = path.resolve('reports', 'shared_data');
      if (!fs.existsSync(dataDir)) {
        return;
      }

      // Trouver le fichier de données partagées le plus récent
      const files = fs
        .readdirSync(dataDir)
        .filter((file) => file.endsWith('_shared_data.json'))
        .map((file) => ({
          name: file,
          path: path.resolve(dataDir, file),
          time: fs.statSync(path.resolve(dataDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        const latestFile = files[0];
        const sharedData = JSON.parse(fs.readFileSync(latestFile.path, 'utf-8'));
        report.sharedData = sharedData;
        logs.push(`📂 Données partagées restaurées depuis ${latestFile.name}`);
      }
    } catch (err) {
      logs.push(`⚠️ Impossible de restaurer les données partagées: ${(err as Error).message}`);
    }
  },

  /**
   * Groupe les agents en fonction de leur compatibilité d'exécution parallèle
   */
  groupAgentsForParallelExecution(agents: any[]): any[][] {
    // Définir les dépendances entre agents
    const dependencies: Record<string, string[]> = {
      DiffVerifier: [], // Pas de dépendances
      DevLinter: [], // Pas de dépendances
      DevChecker: ['DevLinter'], // Dépend de DevLinter
      DevIntegrator: ['DiffVerifier', 'DevChecker'], // Dépend de DiffVerifier et DevChecker
      CiTester: ['DevChecker'], // Dépend de DevChecker
    };

    // Grouper les agents en respectant les dépendances
    const groups: any[][] = [];
    const processed = new Set<string>();

    while (processed.size < agents.length) {
      const currentGroup: any[] = [];

      for (const agent of agents) {
        if (processed.has(agent.name)) continue;

        // Vérifier si toutes les dépendances de cet agent sont déjà traitées
        const deps = dependencies[agent.name] || [];
        const allDepsProcessed = deps.every(
          (dep) => processed.has(dep) || !agents.some((a) => a.name === dep)
        );

        if (allDepsProcessed) {
          currentGroup.push(agent);
        }
      }

      if (currentGroup.length === 0) {
        // Si aucun agent ne peut être ajouté, c'est qu'il y a une dépendance circulaire
        // Dans ce cas, ajouter le premier agent non traité
        for (const agent of agents) {
          if (!processed.has(agent.name)) {
            currentGroup.push(agent);
            break;
          }
        }
      }

      groups.push(currentGroup);
      currentGroup.forEach((agent) => processed.add(agent.name));
    }

    return groups;
  },

  /**
   * Détermine quels agents exécuter en fonction du mode
   */
  getAgentsForMode(mode: string): any[] {
    switch (mode) {
      case 'full':
        return [
          ciTesterAgent,
          devLinterAgent,
          devCheckerAgent,
          diffVerifierAgent,
          devIntegratorAgent,
        ];
      case 'lite':
        return [devLinterAgent, devCheckerAgent, diffVerifierAgent];
      case 'verification':
        return [diffVerifierAgent, devCheckerAgent];
      case 'remediation':
        return [diffVerifierAgent, devIntegratorAgent];
      case 'ci':
        return [ciTesterAgent, devLinterAgent, devCheckerAgent];
      default:
        return [diffVerifierAgent];
    }
  },

  /**
   * Prépare le contexte spécifique pour chaque agent
   */
  prepareAgentContext(
    agentName: string,
    globalContext: OrchestratorContext,
    sharedData: any = {}
  ): any {
    const baseContext: any = {
      file: globalContext.target,
      directory: globalContext.target,
      generateReport: globalContext.generateReport,
      pipelineId: globalContext.pipelineId,
      sharedData, // Nouveau: passer les données partagées
    };

    switch (agentName) {
      case 'DiffVerifier':
        return {
          ...baseContext,
          autoRemediate: globalContext.autoRemediate,
          updateDiscoveryMap: globalContext.updateDiscoveryMap,
          batchMode: !globalContext.target,
        };
      case 'DevIntegrator':
        return {
          ...baseContext,
          autoFix: globalContext.autoRemediate,
        };
      case 'DevChecker':
        return {
          ...baseContext,
          deep: globalContext.mode === 'full',
          fixImports: globalContext.autoRemediate,
        };
      case 'DevLinter':
        return {
          ...baseContext,
          autoFix: globalContext.autoRemediate,
          strict: globalContext.mode === 'ci',
        };
      case 'CiTester':
        return {
          ...baseContext,
          validateOnly: globalContext.mode !== 'full',
          updateWorkflows: globalContext.mode === 'full',
        };
      default:
        return baseContext;
    }
  },

  /**
   * Exécute des benchmarks de performance comparant le code legacy et migré
   */
  async runPerformanceBenchmarks(
    target: string | undefined,
    sharedData: any,
    logs: string[]
  ): Promise<any[]> {
    logs.push(`📊 Exécution des benchmarks de performance`);

    const benchmarks = [];

    try {
      // Si aucune cible n'est fournie, utiliser des endpoints test standard
      const endpointsToTest = target
        ? this.getEndpointsFromTarget(target)
        : ['/api/users', '/api/products', '/api/orders', '/api/dashboard', '/api/search'];

      logs.push(`📊 Endpoints à tester: ${endpointsToTest.join(', ')}`);

      // Pour chaque endpoint, comparer les performances PHP vs NestJS
      for (const endpoint of endpointsToTest) {
        logs.push(`📊 Benchmark pour ${endpoint}`);

        // Mesurer les performances du code PHP legacy
        const legacyResult = this.measureEndpointPerformance('legacy', endpoint);

        // Mesurer les performances du code migré (NestJS)
        const migratedResult = this.measureEndpointPerformance('migrated', endpoint);

        // Calculer l'amélioration en pourcentage
        const improvement =
          legacyResult > 0 ? ((legacyResult - migratedResult) / legacyResult) * 100 : 0;

        benchmarks.push({
          name: endpoint,
          legacy: legacyResult,
          migrated: migratedResult,
          improvement,
        });

        logs.push(`  - Legacy: ${legacyResult.toFixed(2)}ms`);
        logs.push(`  - Migré: ${migratedResult.toFixed(2)}ms`);
        logs.push(`  - Amélioration: ${improvement.toFixed(2)}%`);
      }

      return benchmarks;
    } catch (err: any) {
      logs.push(`❌ Erreur lors des benchmarks: ${err.message}`);
      return [];
    }
  },

  /**
   * Extrait les endpoints à tester à partir de la cible fournie
   */
  getEndpointsFromTarget(target: string): string[] {
    // Si la cible est un fichier, extraire les endpoints de ce fichier
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      const fileContent = fs.readFileSync(target, 'utf-8');

      // Chercher des endpoints dans le format /api/...
      const endpointMatches = fileContent.match(/['"]\/api\/[a-zA-Z0-9\/_-]+['"]/g);

      if (endpointMatches) {
        return endpointMatches.map((match) => match.replace(/['"]/g, ''));
      }

      return ['/api/test'];
    }

    // Si la cible est un dossier, trouver des contrôleurs et extraire des endpoints
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      const controllerFiles = glob.sync(path.join(target, '**/*.controller.ts'));

      if (controllerFiles.length > 0) {
        // Extraire jusqu'à 5 endpoints des contrôleurs
        const endpoints: string[] = [];

        for (const file of controllerFiles) {
          if (endpoints.length >= 5) break;

          const fileContent = fs.readFileSync(file, 'utf-8');
          const endpointMatches = fileContent.match(
            /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]+)['"]\)/g
          );

          if (endpointMatches) {
            for (const match of endpointMatches) {
              const routeMatch = match.match(/['"]([^'"]+)['"]/);
              if (routeMatch && routeMatch[1]) {
                endpoints.push('/api' + (routeMatch[1].startsWith('/') ? '' : '/') + routeMatch[1]);
                if (endpoints.length >= 5) break;
              }
            }
          }
        }

        if (endpoints.length > 0) {
          return endpoints;
        }
      }
    }

    // Par défaut, retourner des endpoints génériques
    return ['/api/test', '/api/users', '/api/products'];
  },

  /**
   * Mesure les performances d'un endpoint spécifique
   */
  measureEndpointPerformance(type: 'legacy' | 'migrated', endpoint: string): number {
    try {
      // Déterminer l'URL de base en fonction du type
      const baseUrl =
        type === 'legacy'
          ? 'http://localhost:8080' // URL du serveur PHP legacy
          : 'http://localhost:3000'; // URL du serveur NestJS migré

      // Effectuer 5 requêtes pour chauffer
      for (let i = 0; i < 5; i++) {
        try {
          execSync(`curl -s -o /dev/null -w "%{time_total}" ${baseUrl}${endpoint}`);
        } catch (e) {
          // Ignorer les erreurs pendant la phase d'échauffement
        }
      }

      // Effectuer 10 requêtes de test et calculer la moyenne
      let totalTime = 0;
      let successfulRequests = 0;

      for (let i = 0; i < 10; i++) {
        try {
          const result = execSync(`curl -s -o /dev/null -w "%{time_total}" ${baseUrl}${endpoint}`);
          const time = parseFloat(result.toString()) * 1000; // Convertir en ms
          totalTime += time;
          successfulRequests++;
        } catch (e) {
          // Ignorer les requêtes en échec
        }
      }

      // Retourner le temps moyen en ms (ou 0 si toutes les requêtes ont échoué)
      return successfulRequests > 0 ? totalTime / successfulRequests : 0;
    } catch (err) {
      // En cas d'erreur, retourner 0
      return 0;
    }
  },

  /**
   * Génère un rapport global HTML
   */
  generateGlobalReport(report: OrchestratorReport, logs: string[], workDir: string): void {
    const reportPath = path.resolve(
      workDir,
      `orchestrator_report_${new Date().toISOString().replace(/:/g, '-')}.html`
    );

    // Créer un rapport HTML
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'orchestration de migration</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .agent-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
    .agent-card h3 { margin-top: 0; color: #2c3e50; }
    .success { border-left: 5px solid #2ecc71; }
    .warning { border-left: 5px solid #f39c12; }
    .error { border-left: 5px solid #e74c3c; }
    .skipped { border-left: 5px solid #7f8c8d; }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: bold;
      color: white;
    }
    .status-success { background-color: #2ecc71; }
    .status-warning { background-color: #f39c12; }
    .status-error { background-color: #e74c3c; }
    .status-skipped { background-color: #7f8c8d; }
    .benchmark-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .benchmark-table th, .benchmark-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .benchmark-table th { background-color: #f2f2f2; }
    .improvement-positive { color: #2ecc71; }
    .improvement-negative { color: #e74c3c; }
  </style>
</head>
<body>
  <h1>Rapport d'orchestration de migration</h1>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>
      <strong>Date de début:</strong> ${new Date(report.startTime).toLocaleString()}<br>
      <strong>Date de fin:</strong> ${new Date(report.endTime).toLocaleString()}<br>
      <strong>Durée:</strong> ${(report.duration / 1000).toFixed(2)} secondes<br>
      <strong>Mode:</strong> ${report.mode}<br>
      ${report.target ? `<strong>Cible:</strong> ${report.target}<br>` : ''}
      <strong>Statut:</strong> <span class="status-badge status-${
        report.overallStatus === 'success'
          ? 'success'
          : report.overallStatus === 'partial'
            ? 'warning'
            : 'error'
      }">${report.overallStatus}</span>
    </p>
  </div>
  
  <h2>Détails par agent</h2>`;

    // Ajouter les détails pour chaque agent
    for (const agent of report.agents) {
      html += `
  <div class="agent-card ${agent.status}">
    <h3>${agent.name} <span class="status-badge status-${agent.status}">${agent.status}</span></h3>
    <p>
      <strong>Début:</strong> ${new Date(agent.startTime).toLocaleString()}<br>
      <strong>Fin:</strong> ${new Date(agent.endTime).toLocaleString()}<br>
      <strong>Durée:</strong> ${(agent.duration / 1000).toFixed(2)} secondes
    </p>`;

      // Ajouter le résumé spécifique de l'agent s'il existe
      if (agent.summary) {
        html += `
    <div class="agent-summary">
      <h4>Résumé</h4>`;

        if (typeof agent.summary === 'object') {
          html += `
      <ul>`;
          for (const [key, value] of Object.entries(agent.summary)) {
            html += `
        <li><strong>${key}:</strong> ${value}</li>`;
          }
          html += `
      </ul>`;
        } else {
          html += `
      <p>${agent.summary}</p>`;
        }

        html += `
    </div>`;
      }

      html += `
  </div>`;
    }

    // Ajouter les résultats de benchmark s'ils existent
    if (report.benchmarks && report.benchmarks.length > 0) {
      html += `
  <h2>Benchmarks de performance</h2>
  <table class="benchmark-table">
    <thead>
      <tr>
        <th>Endpoint</th>
        <th>Legacy (ms)</th>
        <th>Migré (ms)</th>
        <th>Amélioration</th>
      </tr>
    </thead>
    <tbody>`;

      for (const benchmark of report.benchmarks) {
        const improvementClass =
          benchmark.improvement > 0 ? 'improvement-positive' : 'improvement-negative';

        html += `
      <tr>
        <td>${benchmark.name}</td>
        <td>${benchmark.legacy?.toFixed(2) ?? 'N/A'}</td>
        <td>${benchmark.migrated?.toFixed(2) ?? 'N/A'}</td>
        <td class="${improvementClass}">${benchmark.improvement?.toFixed(2) ?? 'N/A'}%</td>
      </tr>`;
      }

      html += `
    </tbody>
  </table>`;
    }

    html += `
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    logs.push(`📊 Rapport global généré: ${reportPath}`);
  },

  /**
   * Notifie l'équipe des résultats via webhook
   */
  notifyTeam(report: OrchestratorReport, logs: string[]): void {
    try {
      // Vérifier si un webhook est configuré
      const configFile = path.resolve('config', 'notification.json');
      if (!fs.existsSync(configFile)) {
        logs.push(`⚠️ Pas de configuration de notification trouvée`);
        return;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      if (!config.webhookUrl) {
        logs.push(`⚠️ Pas d'URL de webhook configurée`);
        return;
      }

      // Préparer le résumé pour la notification
      const agentStatuses = report.agents
        .map((a) => `- ${a.name}: ${a.status.toUpperCase()}`)
        .join('\n');

      const benchmarkSummary =
        report.benchmarks && report.benchmarks.length > 0
          ? report.benchmarks
              .map((b) => `- ${b.name}: ${b.improvement?.toFixed(2)}% d'amélioration`)
              .join('\n')
          : 'Aucun benchmark exécuté';

      // Préparer le message
      const message = {
        text:
          `*Rapport d'orchestration de migration*\n\n` +
          `*Mode:* ${report.mode}\n` +
          `*Cible:* ${report.target || 'Globale'}\n` +
          `*Statut:* ${report.overallStatus.toUpperCase()}\n` +
          `*Durée:* ${(report.duration / 1000).toFixed(2)} secondes\n\n` +
          `*Statut des agents:*\n${agentStatuses}\n\n` +
          `*Benchmarks:*\n${benchmarkSummary}`,
      };

      // Envoyer la notification
      execSync(
        `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(message)}' ${
          config.webhookUrl
        }`
      );

      logs.push(`📣 Notification envoyée à l'équipe`);
    } catch (err: any) {
      logs.push(`⚠️ Échec de la notification: ${err.message}`);
    }
  },

  /**
   * Sauvegarde le rapport d'orchestration complet
   */
  saveOrchestratorReport(report: OrchestratorReport, workDir?: string): void {
    const reportDir = workDir || path.resolve('reports');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.resolve(reportDir, `orchestrator_report_${timestamp}.json`);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  },

  /**
   * Met à jour le tableau de bord avec les résultats du pipeline
   */
  async updateDashboard(report: OrchestratorReport, logs: string[]): Promise<void> {
    logs.push(`📊 Mise à jour du tableau de bord de monitoring`);

    try {
      // Vérifier si le fichier de tableau de bord existe
      const dashboardFile = path.resolve('dashboard', 'migration-status.json');

      // Créer le répertoire si nécessaire
      if (!fs.existsSync(path.dirname(dashboardFile))) {
        fs.mkdirSync(path.dirname(dashboardFile), { recursive: true });
      }

      // Lire les données existantes ou initialiser
      let dashboardData = {};
      if (fs.existsSync(dashboardFile)) {
        dashboardData = JSON.parse(fs.readFileSync(dashboardFile, 'utf-8'));
      } else {
        dashboardData = {
          lastUpdated: '',
          pipelines: [],
          summary: {
            total: 0,
            success: 0,
            partial: 0,
            failed: 0,
          },
          agentPerformance: {},
          recentBenchmarks: [],
        };
      }

      // Mettre à jour les informations du tableau de bord
      dashboardData.lastUpdated = new Date().toISOString();

      // Ajouter ce pipeline
      const pipelineInfo = {
        id: report.pipelineId,
        mode: report.mode,
        target: report.target,
        status: report.overallStatus,
        startTime: report.startTime,
        duration: report.duration,
        agents: report.agents.map((a) => ({
          name: a.name,
          status: a.status,
          duration: a.duration,
        })),
      };

      // Garder uniquement les 100 derniers pipelines
      dashboardData.pipelines.unshift(pipelineInfo);
      if (dashboardData.pipelines.length > 100) {
        dashboardData.pipelines = dashboardData.pipelines.slice(0, 100);
      }

      // Mettre à jour le résumé
      dashboardData.summary.total = dashboardData.pipelines.length;
      dashboardData.summary.success = dashboardData.pipelines.filter(
        (p) => p.status === 'success'
      ).length;
      dashboardData.summary.partial = dashboardData.pipelines.filter(
        (p) => p.status === 'partial'
      ).length;
      dashboardData.summary.failed = dashboardData.pipelines.filter(
        (p) => p.status === 'failed'
      ).length;

      // Mettre à jour les performances des agents
      for (const agent of report.agents) {
        if (!dashboardData.agentPerformance[agent.name]) {
          dashboardData.agentPerformance[agent.name] = {
            executions: 0,
            success: 0,
            warning: 0,
            error: 0,
            avgDuration: 0,
          };
        }

        const perf = dashboardData.agentPerformance[agent.name];
        perf.executions++;

        if (agent.status === 'success') perf.success++;
        else if (agent.status === 'warning') perf.warning++;
        else if (agent.status === 'error') perf.error++;

        // Mettre à jour la durée moyenne
        perf.avgDuration =
          (perf.avgDuration * (perf.executions - 1) + agent.duration) / perf.executions;
      }

      // Ajouter les benchmarks récents s'ils existent
      if (report.benchmarks && report.benchmarks.length > 0) {
        // Ajouter un timestamp aux benchmarks
        const benchmarksWithTime = {
          timestamp: new Date().toISOString(),
          pipelineId: report.pipelineId,
          results: report.benchmarks,
        };

        dashboardData.recentBenchmarks.unshift(benchmarksWithTime);

        // Garder uniquement les 20 derniers benchmarks
        if (dashboardData.recentBenchmarks.length > 20) {
          dashboardData.recentBenchmarks = dashboardData.recentBenchmarks.slice(0, 20);
        }
      }

      // Sauvegarder les données du tableau de bord
      fs.writeFileSync(dashboardFile, JSON.stringify(dashboardData, null, 2));

      // Générer le fichier HTML du tableau de bord
      await this.generateDashboardHtml(dashboardData);

      logs.push(`✅ Tableau de bord mis à jour avec succès`);
    } catch (err: any) {
      logs.push(`⚠️ Erreur lors de la mise à jour du tableau de bord: ${err.message}`);
    }
  },

  /**
   * Génère le fichier HTML du tableau de bord
   */
  async generateDashboardHtml(dashboardData: any): Promise<void> {
    const dashboardHtml = path.resolve('dashboard', 'index.html');

    // Code HTML du tableau de bord (version simple)
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau de bord de migration</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .card { margin-bottom: 20px; }
    .status-badge {
      display: inline-block;
      padding: 0.25em 0.6em;
      border-radius: 0.25rem;
      font-size: 0.75em;
      font-weight: 700;
      color: white;
    }
    .status-success { background-color: #198754; }
    .status-partial { background-color: #fd7e14; }
    .status-failed { background-color: #dc3545; }
    .small-chart { height: 200px; }
    .pipeline-row:hover { background-color: #f8f9fa; }
  </style>
</head>
<body>
  <div class="container-fluid">
    <h1 class="my-4">Tableau de bord de migration</h1>
    <p class="text-muted">Dernière mise à jour: ${new Date(
      dashboardData.lastUpdated
    ).toLocaleString()}</p>
    
    <div class="row">
      <div class="col-md-3">
        <div class="card">
          <div class="card-body text-center">
            <h5 class="card-title">Pipelines totaux</h5>
            <h2>${dashboardData.summary.total}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card">
          <div class="card-body text-center bg-success bg-opacity-10">
            <h5 class="card-title">Réussis</h5>
            <h2>${dashboardData.summary.success}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card">
          <div class="card-body text-center bg-warning bg-opacity-10">
            <h5 class="card-title">Partiels</h5>
            <h2>${dashboardData.summary.partial}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card">
          <div class="card-body text-center bg-danger bg-opacity-10">
            <h5 class="card-title">Échoués</h5>
            <h2>${dashboardData.summary.failed}</h2>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Statut des pipelines
          </div>
          <div class="card-body">
            <canvas id="pipelineChart" class="small-chart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Performance des agents
          </div>
          <div class="card-body">
            <canvas id="agentChart" class="small-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            Benchmarks récents
          </div>
          <div class="card-body">
            <canvas id="benchmarkChart" class="small-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            Pipelines récents
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mode</th>
                    <th>Cible</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  ${dashboardData.pipelines
                    .slice(0, 10)
                    .map(
                      (p) => `
                  <tr class="pipeline-row">
                    <td>${p.id}</td>
                    <td>${p.mode}</td>
                    <td>${p.target || '-'}</td>
                    <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                    <td>${new Date(p.startTime).toLocaleString()}</td>
                    <td>${(p.duration / 1000).toFixed(2)}s</td>
                  </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Données du tableau de bord
    const dashboardData = ${JSON.stringify(dashboardData)};
    
    // Graphique des statuts de pipeline
    const pipelineCtx = document.getElementById('pipelineChart').getContext('2d');
    new Chart(pipelineCtx, {
      type: 'pie',
      data: {
        labels: ['Réussi', 'Partiel', 'Échoué'],
        datasets: [{
          data: [
            dashboardData.summary.success,
            dashboardData.summary.partial,
            dashboardData.summary.failed
          ],
          backgroundColor: ['#198754', '#fd7e14', '#dc3545']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
    
    // Graphique des performances des agents
    const agentCtx = document.getElementById('agentChart').getContext('2d');
    const agentNames = Object.keys(dashboardData.agentPerformance);
    const agentSuccessRates = agentNames.map(name => {
      const perf = dashboardData.agentPerformance[name];
      return perf.executions > 0 ? (perf.success / perf.executions) * 100 : 0;
    });
    
    new Chart(agentCtx, {
      type: 'bar',
      data: {
        labels: agentNames,
        datasets: [{
          label: 'Taux de réussite (%)',
          data: agentSuccessRates,
          backgroundColor: '#0d6efd'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Graphique des benchmarks
    if (dashboardData.recentBenchmarks && dashboardData.recentBenchmarks.length > 0) {
      const benchmarkCtx = document.getElementById('benchmarkChart').getContext('2d');
      
      // Trouver tous les endpoints uniques
      const allEndpoints = new Set();
      dashboardData.recentBenchmarks.forEach(b => {
        b.results.forEach(r => allEndpoints.add(r.name));
      });
      
      // Organiser les données par endpoint
      const endpointData = {};
      Array.from(allEndpoints).forEach(endpoint => {
        endpointData[endpoint] = {
          labels: [],
          legacy: [],
          migrated: []
        };
      });
      
      // Remplir les données chronologiquement
      dashboardData.recentBenchmarks.slice().reverse().forEach(benchmark => {
        const dateLabel = new Date(benchmark.timestamp).toLocaleDateString();
        
        benchmark.results.forEach(result => {
          if (endpointData[result.name]) {
            endpointData[result.name].labels.push(dateLabel);
            endpointData[result.name].legacy.push(result.legacy);
            endpointData[result.name].migrated.push(result.migrated);
          }
        });
      });
      
      // Créer le graphique avec le premier endpoint
      const firstEndpoint = Object.keys(endpointData)[0];
      const benchmarkData = endpointData[firstEndpoint];
      
      new Chart(benchmarkCtx, {
        type: 'line',
        data: {
          labels: benchmarkData.labels,
          datasets: [
            {
              label: 'Legacy (ms)',
              data: benchmarkData.legacy,
              borderColor: '#dc3545',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              tension: 0.1
            },
            {
              label: 'Migré (ms)',
              data: benchmarkData.migrated,
              borderColor: '#198754',
              backgroundColor: 'rgba(25, 135, 84, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Temps de réponse (ms)'
              }
            }
          }
        }
      });
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(dashboardHtml, html);
  },
};
