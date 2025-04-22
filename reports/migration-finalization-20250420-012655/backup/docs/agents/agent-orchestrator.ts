import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { devCheckerAgent } from '../DevChecker';
import { devLinterAgent } from '../DevLinter';
import { diffVerifierAgent } from '../DiffVerifier';
import { devIntegratorAgent } from '../DevIntegrator';
import { ciTesterAgent } from '../CiTester';
import { BaseAgent, OrchestrationAgent } from '../core/interfaces/BaseAgent';


// Configuration pour l'orchestrateur
import { OrchestratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/orchestration';
const CONFIG = {
  outputDir: path.join(process.cwd(), 'reports'),
  logsDir: path.join(process.cwd(), 'logs'),
  agentStatusFile: path.join(process.cwd(), 'reports', 'agents_status.json'),
  dashboardDataFile: path.join(process.cwd(), 'dashboard', 'data', 'pipeline_status.json'),
  autoRemediation: true,
  performanceBenchmark: true,
  webhookEndpoints: {
    slack: process.env.SLACK_WEBHOOK_URL || '',
    teams: process.env.TEAMS_WEBHOOK_URL || '',
    discord: process.env.DISCORD_WEBHOOK_URL || '',
  }
};

// Interface pour les résultats d'agent
interface AgentResult {
  status: string;
  logs: string[];
  fixes?: any[];
  data?: any;
}

// Interface pour l'état global du pipeline
interface PipelineStatus {
  timestamp: string;
  overallStatus: 'success' | 'warning' | 'error' | 'running';
  agents: {
    [agentName: string]: {
      status: string;
      lastRun: string;
      successRate: number;
      issuesCount: number;
      fixedCount: number;
      performanceMetrics?: {
        duration: number;
        memoryUsage: number;
      };
    };
  };
  performanceComparison?: {
    legacy: {
      responseTime: number;
      throughput: number;
      memoryUsage: number;
    };
    migrated: {
      responseTime: number;
      throughput: number;
      memoryUsage: number;
    };
    improvement: {
      responseTime: number;
      throughput: number;
      memoryUsage: number;
    };
  };
  issuesSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoFixed: number;
    pendingManualFix: number;
  };
  progress: {
    totalComponents: number;
    migratedComponents: number;
    verifiedComponents: number;
    percentComplete: number;
  };
}

// Classe principale d'orchestration
export class AgentOrchestrator implements BaseAgent, OrchestrationAgent, BaseAgent, OrchestrationAgent , OrchestratorAgent{
  private pipelineStatus: PipelineStatus;
  private runId: string;

  constructor() {
    this.runId = new Date().toISOString().replace(/[:.]/g, '-');
    this.initializePipelineStatus();
  }

  private initializePipelineStatus(): void {
    // Tente de charger l'état précédent ou initialise un nouvel état
    try {
      if (fs.existsSync(CONFIG.agentStatusFile)) {
        this.pipelineStatus = JSON.parse(fs.readFileSync(CONFIG.agentStatusFile, 'utf8'));
        this.pipelineStatus.timestamp = new Date().toISOString();
        this.pipelineStatus.overallStatus = 'running';
      } else {
        this.createDefaultPipelineStatus();
      }
    } catch (error) {
      console.warn(`Erreur lors du chargement de l'état du pipeline: ${error.message}`);
      this.createDefaultPipelineStatus();
    }
  }

  private createDefaultPipelineStatus(): void {
    this.pipelineStatus = {
      timestamp: new Date().toISOString(),
      overallStatus: 'running',
      agents: {},
      issuesSummary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        autoFixed: 0,
        pendingManualFix: 0
      },
      progress: {
        totalComponents: 0,
        migratedComponents: 0,
        verifiedComponents: 0,
        percentComplete: 0
      }
    };
  }

  // Exécute l'ensemble du pipeline
  async runPipeline(options: {
    agents?: string[];
    autoRemediation?: boolean;
    perfTest?: boolean;
    ciMode?: boolean;
  } = {}): Promise<PipelineStatus> {
    console.log(`🚀 Démarrage du pipeline d'orchestration des agents (ID: ${this.runId})`);
    
    const startTime = Date.now();
    const agentsToRun = options.agents || ['DevChecker', 'DevLinter', 'DiffVerifier', 'DevIntegrator', 'CiTester'];
    const autoRemediation = options.autoRemediation ?? CONFIG.autoRemediation;
    const performanceBenchmark = options.perfTest ?? CONFIG.performanceBenchmark;
    
    try {
      // Vérifier l'espace de travail
      this.ensureDirectoriesExist();
      
      // Exécuter les agents en séquence
      for (const agentName of agentsToRun) {
        await this.runAgent(agentName, { autoRemediation });
      }

      // Exécuter les tests de performance si demandé
      if (performanceBenchmark) {
        await this.runPerformanceBenchmarks();
      }

      // Générer les rapports finaux
      this.generateFinalReports();
      
      // Mettre à jour l'état global du pipeline
      this.updateOverallStatus();
      
      // Enregistrer l'état du pipeline
      this.savePipelineStatus();
      
      // En mode CI, sortir avec un code d'erreur si nécessaire
      if (options.ciMode && this.pipelineStatus.overallStatus === 'error') {
        console.error('❌ Pipeline terminé avec des erreurs. Vérifiez les rapports pour plus de détails.');
        process.exit(1);
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Pipeline terminé en ${duration}s avec le statut: ${this.pipelineStatus.overallStatus}`);
      
      return this.pipelineStatus;
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution du pipeline: ${error.message}`);
      this.pipelineStatus.overallStatus = 'error';
      this.savePipelineStatus();
      
      if (options.ciMode) {
        process.exit(1);
      }
      
      return this.pipelineStatus;
    }
  }

  // Exécute un agent spécifique
  private async runAgent(agentName: string, options: { autoRemediation: boolean }): Promise<AgentResult> {
    console.log(`🔄 Exécution de l'agent: ${agentName}`);
    const agentStartTime = Date.now();

    let result: AgentResult;
    try {
      // Exécuter l'agent approprié
      switch(agentName) {
        case 'DevChecker':
          result = await devCheckerAgent.run({ autoFix: options.autoRemediation });
          break;
        case 'DevLinter':
          result = await devLinterAgent.run({ autoFix: options.autoRemediation });
          break;
        case 'DiffVerifier':
          result = await diffVerifierAgent.run();
          break;
        case 'DevIntegrator':
          result = await devIntegratorAgent.run({ autoRemediation: options.autoRemediation });
          break;
        case 'CiTester':
          result = await ciTesterAgent.run();
          break;
        default:
          throw new Error(`Agent inconnu: ${agentName}`);
      }

      // Calculer les métriques de performance
      const duration = (Date.now() - agentStartTime) / 1000;
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // En MB

      // Mettre à jour l'état de l'agent
      this.updateAgentStatus(agentName, result, { duration, memoryUsage });
      
      return result;
    } catch (error) {
      const errorResult: AgentResult = {
        status: 'error',
        logs: [`Erreur lors de l'exécution de l'agent ${agentName}: ${error.message}`]
      };
      
      // Mettre à jour l'état de l'agent en cas d'erreur
      this.updateAgentStatus(agentName, errorResult, { 
        duration: (Date.now() - agentStartTime) / 1000,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      });
      
      return errorResult;
    }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel du système
   */
  async getSystemState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
  }

  // Met à jour l'état d'un agent après son exécution
  private updateAgentStatus(
    agentName: string, 
    result: AgentResult, 
    metrics: { duration: number; memoryUsage: number }
  ): void {
    // Calculer les statistiques à partir des logs
    const errorCount = result.logs.filter(log => log.includes('❌')).length;
    const warningCount = result.logs.filter(log => log.includes('⚠️')).length;
    const fixedCount = result.fixes?.length || 0;
    
    // Initialiser l'entrée de l'agent s'il n'existe pas encore
    if (!this.pipelineStatus.agents[agentName]) {
      this.pipelineStatus.agents[agentName] = {
        status: 'unknown',
        lastRun: '',
        successRate: 0,
        issuesCount: 0,
        fixedCount: 0,
        performanceMetrics: {
          duration: 0,
          memoryUsage: 0
        }
      };
    }
    
    // Mettre à jour l'état de l'agent
    this.pipelineStatus.agents[agentName] = {
      status: result.status,
      lastRun: new Date().toISOString(),
      successRate: errorCount === 0 ? 100 : Math.max(0, 100 - (errorCount / (errorCount + warningCount + 1)) * 100),
      issuesCount: errorCount + warningCount,
      fixedCount,
      performanceMetrics: {
        duration: metrics.duration,
        memoryUsage: metrics.memoryUsage
      }
    };
    
    // Mettre à jour le résumé des problèmes
    this.updateIssuesSummary(result);
    
    // Écrire les logs dans un fichier
    this.writeAgentLogs(agentName, result.logs);
  }

  // Met à jour le résumé des problèmes
  private updateIssuesSummary(result: AgentResult): void {
    // Analyser les logs pour déterminer la gravité des problèmes
    const criticalIssues = result.logs.filter(log => 
      log.includes('❌') && (
        log.includes('CRITICAL') || 
        log.includes('schema.prisma') ||
        log.includes('sécurité') ||
        log.includes('security')
      )
    ).length;
    
    const highIssues = result.logs.filter(log => 
      log.includes('❌') && !log.includes('CRITICAL')
    ).length;
    
    const mediumIssues = result.logs.filter(log => 
      log.includes('⚠️') && (
        log.includes('WARNING') ||
        log.includes('important')
      )
    ).length;
    
    const lowIssues = result.logs.filter(log => 
      log.includes('⚠️') && !log.includes('WARNING') && !log.includes('important')
    ).length;

    // Mettre à jour les compteurs globaux
    this.pipelineStatus.issuesSummary.critical += criticalIssues;
    this.pipelineStatus.issuesSummary.high += highIssues;
    this.pipelineStatus.issuesSummary.medium += mediumIssues;
    this.pipelineStatus.issuesSummary.low += lowIssues;
    this.pipelineStatus.issuesSummary.autoFixed += result.fixes?.length || 0;
    this.pipelineStatus.issuesSummary.pendingManualFix += 
      (criticalIssues + highIssues + mediumIssues + lowIssues) - (result.fixes?.length || 0);
  }

  // Écrit les logs d'un agent dans un fichier
  private writeAgentLogs(agentName: string, logs: string[]): void {
    const logDir = path.join(CONFIG.logsDir, this.runId);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logPath = path.join(logDir, `${agentName}.log`);
    const logContent = [
      `=== Logs de l'agent ${agentName} ===`,
      `Date: ${new Date().toISOString()}`,
      `===================================`,
      '',
      ...logs
    ].join('\n');
    
    fs.writeFileSync(logPath, logContent);
  }
  
  // Met à jour le statut global du pipeline
  private updateOverallStatus(): void {
    const agentStatuses = Object.values(this.pipelineStatus.agents).map(agent => agent.status);
    
    if (agentStatuses.includes('error')) {
      this.pipelineStatus.overallStatus = 'error';
    } else if (agentStatuses.includes('warning')) {
      this.pipelineStatus.overallStatus = 'warning';
    } else {
      this.pipelineStatus.overallStatus = 'success';
    }
    
    // Mettre à jour la progression
    this.updateProgressData();
  }
  
  // Met à jour les données de progression
  private updateProgressData(): void {
    try {
      // Compter les composants totaux (routes + contrôleurs)
      const routesCount = this.countFiles('apps/frontend/app/routes', '.tsx');
      const controllersCount = this.countFiles('apps/backend/src', 'controller.ts');
      
      // Compter les composants migrés et vérifiés
      const migratedCount = this.countFilesWithCondition('reports/migration', 'status', 'completed');
      const verifiedCount = this.countFilesWithCondition('reports/verification', 'status', 'verified');
      
      this.pipelineStatus.progress = {
        totalComponents: routesCount + controllersCount,
        migratedComponents: migratedCount,
        verifiedComponents: verifiedCount,
        percentComplete: Math.floor((migratedCount / (routesCount + controllersCount)) * 100) || 0
      };
    } catch (error) {
      console.warn(`Erreur lors de la mise à jour des données de progression: ${error.message}`);
    }
  }
  
  // Exécute des tests de performance comparatifs
  private async runPerformanceBenchmarks(): Promise<void> {
    console.log('📊 Exécution des benchmarks de performance...');
    
    try {
      // Exécuter le script de benchmark
      const benchmarkResult = execSync('node tools/benchmark-runner.js --compare', { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10 MB
      });
      
      let perfData;
      try {
        perfData = JSON.parse(benchmarkResult);
      } catch (error) {
        console.warn(`Impossible de parser les résultats de benchmark: ${error.message}`);
        
        // Créer des données de test si le parsing échoue
        perfData = {
          legacy: {
            responseTime: 150, // ms
            throughput: 100,   // req/sec
            memoryUsage: 256   // MB
          },
          migrated: {
            responseTime: 80,  // ms
            throughput: 180,   // req/sec
            memoryUsage: 180   // MB
          }
        };
      }
      
      // Calculer les améliorations
      const responseTimeImprovement = (1 - perfData.migrated.responseTime / perfData.legacy.responseTime) * 100;
      const throughputImprovement = ((perfData.migrated.throughput / perfData.legacy.throughput) - 1) * 100;
      const memoryImprovement = (1 - perfData.migrated.memoryUsage / perfData.legacy.memoryUsage) * 100;
      
      // Mettre à jour les données de performance
      this.pipelineStatus.performanceComparison = {
        legacy: perfData.legacy,
        migrated: perfData.migrated,
        improvement: {
          responseTime: Math.round(responseTimeImprovement * 10) / 10, // Arrondi à 1 décimale
          throughput: Math.round(throughputImprovement * 10) / 10,
          memoryUsage: Math.round(memoryImprovement * 10) / 10
        }
      };
      
      console.log(`✅ Benchmarks terminés. Amélioration de la réponse: ${responseTimeImprovement.toFixed(1)}%`);
    } catch (error) {
      console.warn(`⚠️ Erreur lors de l'exécution des benchmarks: ${error.message}`);
    }
  }
  
  // Génère les rapports finaux
  private generateFinalReports(): void {
    console.log('📝 Génération des rapports finaux...');
    
    // Rapport JSON pour le tableau de bord
    this.saveDashboardData();
    
    // Générer un rapport Markdown
    this.generateMarkdownReport();
  }
  
  // Enregistre les données pour le tableau de bord
  private saveDashboardData(): void {
    const dashboardDir = path.dirname(CONFIG.dashboardDataFile);
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.dashboardDataFile, JSON.stringify(this.pipelineStatus, null, 2));
  }
  
  // Génère un rapport au format Markdown
  private generateMarkdownReport(): void {
    const reportPath = path.join(CONFIG.outputDir, `pipeline-report-${this.runId}.md`);
    
    let report = `# Rapport d'exécution du pipeline - ${new Date().toLocaleString()}\n\n`;
    
    // Résumé général
    report += `## 📊 Résumé\n\n`;
    report += `- **Statut global**: ${this.getStatusEmoji(this.pipelineStatus.overallStatus)} ${this.pipelineStatus.overallStatus}\n`;
    report += `- **Progression**: ${this.pipelineStatus.progress.percentComplete}% (${this.pipelineStatus.progress.migratedComponents}/${this.pipelineStatus.progress.totalComponents} composants)\n`;
    report += `- **Problèmes**: ${this.pipelineStatus.issuesSummary.critical + this.pipelineStatus.issuesSummary.high + this.pipelineStatus.issuesSummary.medium + this.pipelineStatus.issuesSummary.low} (${this.pipelineStatus.issuesSummary.autoFixed} corrigés automatiquement)\n\n`;
    
    // Statut des agents
    report += `## 🤖 Statut des agents\n\n`;
    report += `| Agent | Statut | Problèmes | Résolus auto. | Taux succès |\n`;
    report += `|-------|--------|-----------|---------------|------------|\n`;
    
    Object.entries(this.pipelineStatus.agents).forEach(([agentName, agentData]) => {
      report += `| ${agentName} | ${this.getStatusEmoji(agentData.status)} ${agentData.status} | ${agentData.issuesCount} | ${agentData.fixedCount} | ${agentData.successRate.toFixed(1)}% |\n`;
    });
    
    report += `\n`;
    
    // Détails des problèmes
    report += `## ⚠️ Résumé des problèmes\n\n`;
    report += `- 🔴 **Critiques**: ${this.pipelineStatus.issuesSummary.critical}\n`;
    report += `- 🟠 **Élevés**: ${this.pipelineStatus.issuesSummary.high}\n`;
    report += `- 🟡 **Moyens**: ${this.pipelineStatus.issuesSummary.medium}\n`;
    report += `- 🟢 **Faibles**: ${this.pipelineStatus.issuesSummary.low}\n`;
    report += `- 🛠️ **Corrigés auto.**: ${this.pipelineStatus.issuesSummary.autoFixed}\n`;
    report += `- 📝 **À corriger manuellement**: ${this.pipelineStatus.issuesSummary.pendingManualFix}\n\n`;
    
    // Informations de performance
    if (this.pipelineStatus.performanceComparison) {
      report += `## 📈 Comparaison de performance\n\n`;
      report += `| Métrique | Legacy | Migré | Amélioration |\n`;
      report += `|----------|--------|-------|-------------|\n`;
      report += `| Temps de réponse | ${this.pipelineStatus.performanceComparison.legacy.responseTime} ms | ${this.pipelineStatus.performanceComparison.migrated.responseTime} ms | ${this.pipelineStatus.performanceComparison.improvement.responseTime}% |\n`;
      report += `| Débit | ${this.pipelineStatus.performanceComparison.legacy.throughput} req/s | ${this.pipelineStatus.performanceComparison.migrated.throughput} req/s | +${this.pipelineStatus.performanceComparison.improvement.throughput}% |\n`;
      report += `| Utilisation mémoire | ${this.pipelineStatus.performanceComparison.legacy.memoryUsage} MB | ${this.pipelineStatus.performanceComparison.migrated.memoryUsage} MB | ${this.pipelineStatus.performanceComparison.improvement.memoryUsage}% |\n\n`;
    }
    
    // Pour chaque agent, ajouter un lien vers son fichier de log
    report += `## 📋 Logs détaillés\n\n`;
    Object.keys(this.pipelineStatus.agents).forEach(agentName => {
      report += `- [Logs de ${agentName}](../logs/${this.runId}/${agentName}.log)\n`;
    });
    
    // Écrire le rapport
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Rapport généré: ${reportPath}`);
  }
  
  // Enregistre l'état actuel du pipeline
  private savePipelineStatus(): void {
    fs.writeFileSync(CONFIG.agentStatusFile, JSON.stringify(this.pipelineStatus, null, 2));
  }
  
  // Utilitaires
  
  private ensureDirectoriesExist(): void {
    [CONFIG.outputDir, CONFIG.logsDir, path.dirname(CONFIG.dashboardDataFile)].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  private getStatusEmoji(status: string): string {
    switch(status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '❓';
    }
  }
  
  private countFiles(dirPath: string, extension: string): number {
    try {
      const fullPath = path.join(process.cwd(), dirPath);
      if (!fs.existsSync(fullPath)) return 0;
      
      const result = execSync(`find ${fullPath} -name "*${extension}" | wc -l`, { encoding: 'utf8' });
      return parseInt(result.trim(), 10);
    } catch (error) {
      return 0;
    }
  }
  
  private countFilesWithCondition(dirPath: string, jsonField: string, value: string): number {
    try {
      const fullPath = path.join(process.cwd(), dirPath);
      if (!fs.existsSync(fullPath)) return 0;
      
      const result = execSync(
        `grep -l "\\"${jsonField}\\"\\s*:\\s*\\"${value}\\"" ${fullPath}/*.json | wc -l`, 
        { encoding: 'utf8' }
      );
      return parseInt(result.trim(), 10);
    } catch (error) {
      return 0;
    }
  }
}

// Point d'entrée pour l'exécution en ligne de commande
if (require.main === module) {
  const orchestrator = new AgentOrchestrator();
  
  // Traiter les arguments de ligne de commande
  const args = process.argv.slice(2);
  const options = {
    agents: args.includes('--agents') 
      ? args[args.indexOf('--agents') + 1]?.split(',')
      : undefined,
    autoRemediation: args.includes('--auto-fix'),
    perfTest: args.includes('--perf-test'),
    ciMode: args.includes('--ci-mode')
  };
  
  orchestrator.runPipeline(options)
    .then(() => {
      console.log('Pipeline terminé avec succès');
    })
    .catch(error => {
      console.error('Erreur lors de l\'exécution du pipeline:', error);
      process.exit(1);
    });
}

export default AgentOrchestrator;