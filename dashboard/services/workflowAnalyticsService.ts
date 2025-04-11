import n8nService, { Workflow, WorkflowExecution } from './n8nService';

export interface WorkflowMetrics {
  id: string;
  name: string;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  lastExecutionStatus: string;
  lastExecutionTime: string;
  failureCount: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface PerformanceData {
  timeframes: string[];
  successRates: number[];
  executionCounts: number[];
  averageDurations: number[];
}

// Interface pour les métriques de performance
export interface WorkflowPerformanceMetrics {
  averageExecutionTime: number; // en milliseconds
  successRate: number; // pourcentage de 0 à 100
  totalExecutions: number;
  failureCount: number;
  successCount: number;
  runningCount: number;
  waitingCount: number;
  executionTrend: Array<{ date: string; count: number; successRate: number }>;
  lastExecutionStatus: 'success' | 'failed' | 'running' | 'waiting' | 'none';
}

// Interface pour le rapport d'analyse de workflow
export interface WorkflowAnalysisReport {
  workflow: Workflow;
  metrics: WorkflowPerformanceMetrics;
  recentExecutions: WorkflowExecution[];
  nodesPerformance?: Array<{ 
    nodeName: string; 
    averageExecutionTime: number;
    errorRate: number;
  }>;
  bottlenecks?: string[];
  recommendations?: string[];
}

class WorkflowAnalyticsService {
  private cache: {
    metrics: { [workflowId: string]: WorkflowMetrics };
    performanceData: { [workflowId: string]: PerformanceData };
    lastUpdate: number;
  } = {
    metrics: {},
    performanceData: {},
    lastUpdate: 0
  };

  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Calcule les métriques pour un workflow spécifique
   * @param workflowId ID du workflow à analyser
   * @param force Force le recalcul des métriques même si elles sont en cache
   */
  async getWorkflowMetrics(workflowId: string, force = false): Promise<WorkflowMetrics> {
    const now = Date.now();
    const isCacheValid = this.cache.metrics[workflowId] && (now - this.cache.lastUpdate < this.CACHE_TTL);
    
    if (isCacheValid && !force) {
      return this.cache.metrics[workflowId];
    }

    try {
      // Récupérer les données nécessaires
      const workflow = await n8nService.getWorkflow(workflowId);
      const executions = await n8nService.getWorkflowExecutions(workflowId);
      
      // Calculer les métriques
      const metrics = this.calculateMetrics(workflow, executions);
      
      // Mettre en cache
      this.cache.metrics[workflowId] = metrics;
      this.cache.lastUpdate = now;
      
      return metrics;
    } catch (error) {
      console.error('Erreur lors du calcul des métriques :', error);
      throw error;
    }
  }

  /**
   * Récupère les données de performance pour un workflow sur une période donnée
   * @param workflowId ID du workflow
   * @param days Nombre de jours d'historique à analyser
   */
  async getPerformanceData(workflowId: string, days = 7): Promise<PerformanceData> {
    const now = Date.now();
    const cacheKey = `${workflowId}_${days}`;
    const isCacheValid = this.cache.performanceData[cacheKey] && (now - this.cache.lastUpdate < this.CACHE_TTL);
    
    if (isCacheValid) {
      return this.cache.performanceData[cacheKey];
    }

    try {
      // Récupérer toutes les exécutions
      const executions = await n8nService.getWorkflowExecutions(workflowId);
      
      // Filtrer par période
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const filteredExecutions = executions.filter(exec => 
        new Date(exec.startedAt) >= startDate
      );

      // Organiser par jour
      const performanceData = this.calculatePerformanceByDay(filteredExecutions, days);
      
      // Mettre en cache
      this.cache.performanceData[cacheKey] = performanceData;
      this.cache.lastUpdate = now;
      
      return performanceData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de performance :', error);
      throw error;
    }
  }

  /**
   * Analyse tous les workflows pour identifier les anomalies ou les workflows problématiques
   */
  async analyzeAllWorkflows(): Promise<{ 
    problemWorkflows: WorkflowMetrics[], 
    recommendedActions: { workflowId: string, action: string }[] 
  }> {
    try {
      const workflows = await n8nService.getWorkflows();
      const allMetrics: WorkflowMetrics[] = [];
      
      // Recueillir les métriques pour tous les workflows
      for (const workflow of workflows) {
        const metrics = await this.getWorkflowMetrics(workflow.id);
        allMetrics.push(metrics);
      }
      
      // Identifier les workflows problématiques (moins de 80% de succès ou tendance dégradante)
      const problemWorkflows = allMetrics.filter(
        metrics => metrics.successRate < 80 || metrics.trend === 'degrading'
      );
      
      // Générer des recommandations
      const recommendedActions = problemWorkflows.map(metrics => ({
        workflowId: metrics.id,
        action: this.generateRecommendation(metrics)
      }));
      
      return { problemWorkflows, recommendedActions };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des workflows :', error);
      throw error;
    }
  }

  /**
   * Calcule les métriques à partir des données d'exécution
   */
  private calculateMetrics(workflow: Workflow, executions: WorkflowExecution[]): WorkflowMetrics {
    const totalExecutions = executions.length;
    
    if (totalExecutions === 0) {
      return {
        id: workflow.id,
        name: workflow.name,
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        lastExecutionStatus: 'N/A',
        lastExecutionTime: 'N/A',
        failureCount: 0,
        trend: 'stable'
      };
    }
    
    // Calculer le taux de réussite
    const successfulExecutions = executions.filter(e => e.status === 'success').length;
    const successRate = (successfulExecutions / totalExecutions) * 100;
    
    // Calculer la durée moyenne d'exécution
    const durationsMs = executions
      .filter(e => e.finishedAt) // Ignorer les exécutions en cours
      .map(e => new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime());
    
    const averageDuration = durationsMs.length > 0 
      ? durationsMs.reduce((sum, duration) => sum + duration, 0) / durationsMs.length / 1000 // en secondes
      : 0;
    
    // Déterminer la dernière exécution
    const latestExecution = executions.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )[0];
    
    // Analyser la tendance
    const trend = this.analyzeTrend(executions);
    
    return {
      id: workflow.id,
      name: workflow.name,
      totalExecutions,
      successRate,
      averageDuration,
      lastExecutionStatus: latestExecution.status,
      lastExecutionTime: latestExecution.startedAt,
      failureCount: totalExecutions - successfulExecutions,
      trend
    };
  }

  /**
   * Analyse la tendance de fiabilité d'un workflow
   */
  private analyzeTrend(executions: WorkflowExecution[]): 'improving' | 'stable' | 'degrading' {
    if (executions.length < 5) return 'stable';
    
    // Trier par date de début
    const sortedExecutions = [...executions].sort((a, b) => 
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    
    // Diviser en deux moitiés
    const midpoint = Math.floor(sortedExecutions.length / 2);
    const firstHalf = sortedExecutions.slice(0, midpoint);
    const secondHalf = sortedExecutions.slice(midpoint);
    
    // Calculer les taux de réussite de chaque moitié
    const firstHalfSuccessRate = firstHalf.filter(e => e.status === 'success').length / firstHalf.length;
    const secondHalfSuccessRate = secondHalf.filter(e => e.status === 'success').length / secondHalf.length;
    
    // Comparer les taux
    const difference = secondHalfSuccessRate - firstHalfSuccessRate;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Calcule les données de performance quotidiennes
   */
  private calculatePerformanceByDay(executions: WorkflowExecution[], days: number): PerformanceData {
    const timeframes: string[] = [];
    const successRates: number[] = [];
    const executionCounts: number[] = [];
    const averageDurations: number[] = [];
    
    // Créer un objet pour chaque jour
    const dailyData: { [date: string]: {
      total: number,
      success: number,
      durations: number[]
    }} = {};
    
    // Initialiser les données pour chaque jour de la période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeframes.push(dateStr);
      dailyData[dateStr] = { total: 0, success: 0, durations: [] };
    }
    
    // Agréger les données d'exécution par jour
    for (const execution of executions) {
      const date = new Date(execution.startedAt).toISOString().split('T')[0];
      
      if (dailyData[date]) {
        dailyData[date].total++;
        
        if (execution.status === 'success') {
          dailyData[date].success++;
        }
        
        if (execution.finishedAt) {
          const duration = (new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000;
          dailyData[date].durations.push(duration);
        }
      }
    }
    
    // Calculer les métriques pour chaque jour
    for (const date of timeframes) {
      const data = dailyData[date];
      
      // Taux de réussite
      const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0;
      successRates.push(Number(successRate.toFixed(2)));
      
      // Nombre d'exécutions
      executionCounts.push(data.total);
      
      // Durée moyenne
      const avgDuration = data.durations.length > 0 
        ? data.durations.reduce((sum, dur) => sum + dur, 0) / data.durations.length 
        : 0;
      averageDurations.push(Number(avgDuration.toFixed(2)));
    }
    
    return { timeframes, successRates, executionCounts, averageDurations };
  }

  /**
   * Génère une recommandation basée sur les métriques du workflow
   */
  private generateRecommendation(metrics: WorkflowMetrics): string {
    if (metrics.successRate < 50) {
      return `Examiner le workflow "${metrics.name}" en urgence: taux d'échec élevé (${(100 - metrics.successRate).toFixed(2)}%)`;
    }
    
    if (metrics.trend === 'degrading') {
      return `La fiabilité du workflow "${metrics.name}" se dégrade, une vérification est recommandée`;
    }
    
    if (metrics.averageDuration > 300) { // Plus de 5 minutes
      return `Le workflow "${metrics.name}" a des temps d'exécution longs (${metrics.averageDuration.toFixed(2)}s), optimisation possible`;
    }
    
    return `Surveiller le workflow "${metrics.name}" pour maintenir les performances`;
  }
}

// Service d'analyse des workflows
const workflowAnalyticsService = {
  // Générer un rapport d'analyse pour un workflow
  generateWorkflowAnalysis: async (workflowId: string): Promise<WorkflowAnalysisReport> => {
    try {
      // Récupérer les informations de base du workflow
      const workflow = await n8nService.getWorkflow(workflowId);
      
      // Récupérer les exécutions du workflow
      const executions = await n8nService.getWorkflowExecutions(workflowId);
      
      // Calculer les métriques de performance
      const metrics = calculatePerformanceMetrics(executions);
      
      // Analyser les nœuds si des données détaillées sont disponibles
      const nodesPerformance = analyzeNodePerformance(executions);
      
      // Identifier les goulots d'étranglement potentiels
      const bottlenecks = identifyBottlenecks(nodesPerformance);
      
      // Générer des recommandations
      const recommendations = generateRecommendations(metrics, bottlenecks);
      
      return {
        workflow,
        metrics,
        recentExecutions: executions.slice(0, 10), // Limiter aux 10 exécutions les plus récentes
        nodesPerformance,
        bottlenecks,
        recommendations
      };
    } catch (error) {
      console.error(`Erreur lors de la génération de l'analyse du workflow ${workflowId}:`, error);
      throw error;
    }
  },
  
  // Comparer les performances de plusieurs workflows
  compareWorkflows: async (workflowIds: string[]): Promise<Record<string, WorkflowPerformanceMetrics>> => {
    try {
      const results: Record<string, WorkflowPerformanceMetrics> = {};
      
      // Récupérer et calculer les métriques pour chaque workflow
      for (const workflowId of workflowIds) {
        const workflow = await n8nService.getWorkflow(workflowId);
        const executions = await n8nService.getWorkflowExecutions(workflowId);
        results[workflow.name] = calculatePerformanceMetrics(executions);
      }
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la comparaison des workflows:', error);
      throw error;
    }
  },
  
  // Obtenir les tendances d'exécution sur une période donnée
  getExecutionTrends: async (workflowId: string, days: number = 30): Promise<Array<{ date: string; count: number; successRate: number }>> => {
    try {
      // Récupérer les exécutions
      const executions = await n8nService.getWorkflowExecutions(workflowId);
      
      // Filtrer les exécutions par date (uniquement celles des X derniers jours)
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - days);
      
      const filteredExecutions = executions.filter(
        execution => new Date(execution.startedAt) >= startDate
      );
      
      // Regrouper par jour et calculer les métriques
      return calculateExecutionTrends(filteredExecutions);
    } catch (error) {
      console.error(`Erreur lors de la récupération des tendances d'exécution pour le workflow ${workflowId}:`, error);
      throw error;
    }
  }
};

// Fonction utilitaire pour calculer les métriques de performance
const calculatePerformanceMetrics = (executions: WorkflowExecution[]): WorkflowPerformanceMetrics => {
  // Compter les différents types d'exécution
  const totalExecutions = executions.length;
  const successCount = executions.filter(e => e.status === 'success').length;
  const failureCount = executions.filter(e => e.status === 'failed').length;
  const runningCount = executions.filter(e => e.status === 'running').length;
  const waitingCount = executions.filter(e => e.status === 'waiting').length;
  
  // Calculer le taux de réussite
  const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
  
  // Calculer le temps d'exécution moyen (uniquement pour les exécutions terminées)
  let totalExecutionTime = 0;
  let completedExecutions = 0;
  
  executions.forEach(execution => {
    if (execution.finishedAt && execution.status !== 'running' && execution.status !== 'waiting') {
      const startTime = new Date(execution.startedAt).getTime();
      const endTime = new Date(execution.finishedAt).getTime();
      totalExecutionTime += endTime - startTime;
      completedExecutions++;
    }
  });
  
  const averageExecutionTime = completedExecutions > 0 ? totalExecutionTime / completedExecutions : 0;
  
  // Récupérer le statut de la dernière exécution
  const lastExecutionStatus = executions.length > 0 
    ? executions[0].status 
    : 'none';
  
  // Calculer la tendance des exécutions
  const executionTrend = calculateExecutionTrends(executions);
  
  return {
    averageExecutionTime,
    successRate,
    totalExecutions,
    failureCount,
    successCount,
    runningCount,
    waitingCount,
    executionTrend,
    lastExecutionStatus
  };
};

// Analyser la performance des nœuds dans les exécutions
const analyzeNodePerformance = (executions: WorkflowExecution[]) => {
  // Cette fonction nécessiterait des données détaillées sur les exécutions de chaque nœud
  // que l'on pourrait extraire des données d'exécution si elles sont disponibles
  const nodeStats: Record<string, { totalTime: number; executions: number; errors: number }> = {};
  
  executions.forEach(execution => {
    if (execution.data && execution.data.executionData && execution.data.executionData.nodeExecutionStack) {
      execution.data.executionData.nodeExecutionStack.forEach((nodeExec: any) => {
        const nodeName = nodeExec.node || 'unknown';
        
        if (!nodeStats[nodeName]) {
          nodeStats[nodeName] = { totalTime: 0, executions: 0, errors: 0 };
        }
        
        nodeStats[nodeName].executions++;
        
        if (nodeExec.executionTime) {
          nodeStats[nodeName].totalTime += nodeExec.executionTime;
        }
        
        if (nodeExec.error) {
          nodeStats[nodeName].errors++;
        }
      });
    }
  });
  
  return Object.entries(nodeStats).map(([nodeName, stats]) => ({
    nodeName,
    averageExecutionTime: stats.executions > 0 ? stats.totalTime / stats.executions : 0,
    errorRate: stats.executions > 0 ? (stats.errors / stats.executions) * 100 : 0
  }));
};

// Identifier les goulots d'étranglement potentiels
const identifyBottlenecks = (nodesPerformance?: Array<{ nodeName: string; averageExecutionTime: number; errorRate: number }>) => {
  if (!nodesPerformance || nodesPerformance.length === 0) {
    return [];
  }
  
  const bottlenecks: string[] = [];
  
  // Trouver les nœuds avec un temps d'exécution élevé (> 1s)
  const slowNodes = nodesPerformance
    .filter(node => node.averageExecutionTime > 1000)
    .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime);
  
  // Trouver les nœuds avec un taux d'erreur élevé (> 10%)
  const errorProneNodes = nodesPerformance
    .filter(node => node.errorRate > 10)
    .sort((a, b) => b.errorRate - a.errorRate);
  
  // Ajouter les nœuds lents comme goulots d'étranglement potentiels
  slowNodes.slice(0, 3).forEach(node => {
    bottlenecks.push(`Nœud lent: ${node.nodeName} (${node.averageExecutionTime.toFixed(0)} ms)`);
  });
  
  // Ajouter les nœuds sujets aux erreurs comme goulots d'étranglement potentiels
  errorProneNodes.slice(0, 3).forEach(node => {
    bottlenecks.push(`Nœud avec erreurs fréquentes: ${node.nodeName} (${node.errorRate.toFixed(2)}% d'échecs)`);
  });
  
  return bottlenecks;
};

// Générer des recommandations basées sur l'analyse
const generateRecommendations = (metrics: WorkflowPerformanceMetrics, bottlenecks?: string[]) => {
  const recommendations: string[] = [];
  
  // Recommandations basées sur le taux de réussite
  if (metrics.successRate < 50) {
    recommendations.push("Le taux de réussite est faible. Vérifier la logique du workflow et les conditions d'erreur.");
  }
  
  // Recommandations basées sur le temps d'exécution
  if (metrics.averageExecutionTime > 60000) { // Plus d'une minute
    recommendations.push("Le temps d'exécution moyen est élevé. Envisager d'optimiser les opérations ou de paralléliser certaines tâches.");
  }
  
  // Recommandations basées sur les goulots d'étranglement identifiés
  if (bottlenecks && bottlenecks.length > 0) {
    recommendations.push("Optimiser les nœuds identifiés comme goulots d'étranglement.");
    
    // Ajout de recommandations spécifiques pour les nœuds HTTP
    if (bottlenecks.some(b => b.includes("HTTP"))) {
      recommendations.push("Pour les nœuds HTTP lents, envisager de mettre en cache les réponses ou d'utiliser des webhooks.");
    }
    
    // Ajout de recommandations pour les nœuds de base de données
    if (bottlenecks.some(b => b.includes("DB") || b.includes("Database") || b.includes("SQL"))) {
      recommendations.push("Pour les nœuds de base de données lents, optimiser les requêtes ou ajouter des index.");
    }
  }
  
  // Recommandations générales
  if (metrics.totalExecutions < 10) {
    recommendations.push("Peu d'exécutions enregistrées. Plus de données permettront une analyse plus précise.");
  }
  
  return recommendations;
};

// Calculer les tendances d'exécution
const calculateExecutionTrends = (executions: WorkflowExecution[]): Array<{ date: string; count: number; successRate: number }> => {
  // Regrouper les exécutions par jour
  const executionsByDay: Record<string, { total: number; success: number }> = {};
  
  executions.forEach(execution => {
    const date = new Date(execution.startedAt).toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    if (!executionsByDay[date]) {
      executionsByDay[date] = { total: 0, success: 0 };
    }
    
    executionsByDay[date].total++;
    if (execution.status === 'success') {
      executionsByDay[date].success++;
    }
  });
  
  // Convertir en tableau et calculer les taux de réussite
  return Object.entries(executionsByDay).map(([date, stats]) => ({
    date,
    count: stats.total,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0
  })).sort((a, b) => a.date.localeCompare(b.date)); // Trier par date
};

export default workflowAnalyticsService;
export default new WorkflowAnalyticsService();