/**
 * Pipeline Strategy Auditor
 * 
 * Agent d'analyse qui audite :
 * 1. Le pipeline de migration (configurationsDotn8N, efficacité, bloqueurs)
 * 2. La stratégie globale de migration (couverture, risques, chemins critiques)
 * 
 * Génère des rapports JSON détaillés et un résumé au format Markdown
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '@nestjs/common';

// Types
interface PipelineAudit {
  timestamp: string;
  score: number;
  summary: {
    status: 'ok' | 'warning' | 'error';
    message: string;
  };
  workflows: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error';
    nodeCount: number;
    connections: number;
    errorNodes: string[];
  }[];
  performance: {
    averageExecutionTime: number;
    bottlenecks: {
      workflowId: string;
      nodeId: string;
      averageTime: number;
      recommendation: string;
    }[];
  };
  issues: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    location: {
      workflow: string;
      node?: string;
    };
    recommendation: string;
  }[];
  recommendations: string[];
}

interface StrategyAudit {
  timestamp: string;
  score: number;
  coverage: {
    total: number;
    covered: number;
    percentage: number;
  };
  risks: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    mitigation: string;
  }[];
  criticalPaths: {
    name: string;
    components: string[];
    estimatedTime: number;
    dependencies: string[];
    status: 'completed' | 'in-progress' | 'blocked' | 'not-started';
  }[];
  gaps: {
    area: string;
    description: string;
    recommendation: string;
  }[];
  schedule: {
    onTrack: boolean;
    currentPhase: string;
    nextMilestone: string;
    estimatedTimeToCompletion: number;
  };
  recommendations: string[];
}

class PipelineStrategyAuditor implements BaseAgent, BusinessAgent {
  private readonly logger = new Logger('PipelineStrategyAuditor');
  private pipelineAudit: PipelineAudit | null = null;
  private strategyAudit: StrategyAudit | null = null;
  private workflowConfigs: Record<string, any>[] = [];
  privateDotn8NPipelines: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.initializeAuditor();
  }

  /**
   * Initialise l'auditeur en chargeant les configurations
   */
  private initializeAuditor(): void {
    try {
      this.logger.log('Initialisation de l\'auditeur de pipeline et stratégie...');
      
      // Charger les configurationsDotn8N
      constDotn8NFiles = fs.readdirSync(path.resolve('.'))
        .filter(file => file.startsWith(Dotn8N.') && file.endsWith('.json'));
      
      this.logger.log(`$Dotn8NFiles.length} fichiers de configurationDotn8N détectés`);
      thisDotn8NPipelines =Dotn8NFiles;
      
      // Charger les configurations workflow
     Dotn8NFiles.forEach(file => {
        try {
          const config = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
          this.workflowConfigs.push({
            fileName: file,
            config
          });
        } catch (err: any) {
          this.warnings.push(`Impossible de charger le fichier ${file}: ${err.message}`);
        }
      });
      
      this.logger.log('Auditeur initialisé avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur d'initialisation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyse le pipeline de migration
   */
  private async auditPipeline(): Promise<PipelineAudit> {
    this.logger.log('Analyse du pipeline de migration...');
    
    // Structure de base
    const audit: PipelineAudit = {
      timestamp: new Date().toISOString(),
      score: 0,
      summary: {
        status: 'ok',
        message: 'Audit du pipeline terminé'
      },
      workflows: [],
      performance: {
        averageExecutionTime: 0,
        bottlenecks: []
      },
      issues: [],
      recommendations: []
    };
    
    try {
      // Analyser chaque workflow
      for (const {fileName, config} of this.workflowConfigs) {
        if (!config.nodes || !Array.isArray(config.nodes)) {
          this.warnings.push(`Configuration invalide dans ${fileName}: aucun nœud trouvé`);
          continue;
        }
        
        // Extraire les informations de base
        const workflowId = fileName.replace(Dotn8N.', '').replace('.json', '');
        const workflowName = config.name || workflowId;
        const nodeCount = config.nodes.length;
        const connections = this.countConnections(config.nodes, config);
        const errorNodes = this.findErrorNodes(config.nodes);
        
        audit.workflows.push({
          id: workflowId,
          name: workflowName,
          status: errorNodes.length > 0 ? 'error' : 'active',
          nodeCount,
          connections,
          errorNodes
        });
        
        // Détecter les problèmes potentiels
        this.detectWorkflowIssues(workflowId, workflowName, config.nodes, audit.issues);
      }
      
      // Calculer le score (algorithme simplifié)
      const maxScore = 100;
      const issuesPenalty = audit.issues.reduce((penalty, issue) => {
        switch (issue.severity) {
          case 'critical': return penalty + 20;
          case 'high': return penalty + 10;
          case 'medium': return penalty + 5;
          case 'low': return penalty + 2;
          default: return penalty;
        }
      }, 0);
      
      audit.score = Math.max(0, Math.min(maxScore, maxScore - issuesPenalty));
      
      // Déterminer le statut global
      if (audit.score < 50) {
        audit.summary.status = 'error';
        audit.summary.message = 'Des problèmes critiques ont été détectés dans le pipeline';
      } else if (audit.score < 80) {
        audit.summary.status = 'warning';
        audit.summary.message = 'Des améliorations sont nécessaires dans le pipeline';
      }
      
      // Générer des recommandations
      audit.recommendations = this.generatePipelineRecommendations(audit);
      
      return audit;
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse du pipeline: ${error.message}`);
      audit.summary.status = 'error';
      audit.summary.message = `Erreur d'analyse: ${error.message}`;
      audit.score = 0;
      return audit;
    }
  }
  
  /**
   * Analyse la stratégie de migration
   */
  private async auditStrategy(): Promise<StrategyAudit> {
    this.logger.log('Analyse de la stratégie de migration...');
    
    // Structure de base
    const audit: StrategyAudit = {
      timestamp: new Date().toISOString(),
      score: 0,
      coverage: {
        total: 0,
        covered: 0,
        percentage: 0
      },
      risks: [],
      criticalPaths: [],
      gaps: [],
      schedule: {
        onTrack: true,
        currentPhase: 'Analyse',
        nextMilestone: 'Migration PHP → Remix',
        estimatedTimeToCompletion: 90 // jours
      },
      recommendations: []
    };
    
    try {
      // Analyser le fichier de statut si présent
      const statusPath = path.resolve('status.json');
      if (fs.existsSync(statusPath)) {
        try {
          const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
          
          if (status.migration) {
            // Extraire les métriques de couverture
            audit.coverage.total = status.migration.total || 0;
            audit.coverage.covered = status.migration.completed || 0;
            audit.coverage.percentage = audit.coverage.total > 0 
              ? Math.round((audit.coverage.covered / audit.coverage.total) * 100) 
              : 0;
              
            // Extraire la phase actuelle
            audit.schedule.currentPhase = status.migration.currentPhase || audit.schedule.currentPhase;
            
            // Déterminer si le projet est en retard
            if (status.migration.delayDays && status.migration.delayDays > 7) {
              audit.schedule.onTrack = false;
            }
          }
        } catch (err: any) {
          this.warnings.push(`Impossible d'analyser status.json: ${err.message}`);
        }
      }
      
      // Analyser le backlog MCP
      const backlogPath = path.resolve('backlogDoDotmcp.json');
      if (fs.existsSync(backlogPath)) {
        try {
          const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
          
          // Extraire les chemins critiques
          if (backlog.criticalPaths && Array.isArray(backlog.criticalPaths)) {
            audit.criticalPaths = backlog.criticalPaths;
          }
          
          // Extraire les risques identifiés
          if (backlog.risks && Array.isArray(backlog.risks)) {
            audit.risks = backlog.risks;
          }
        } catch (err: any) {
          this.warnings.push(`Impossible d'analyser backlogDoDotmcp.json: ${err.message}`);
        }
      }
      
      // Analyser les lacunes potentielles dans la stratégie
      this.identifyStrategyGaps(audit);
      
      // Calculer le score de la stratégie
      const maxScore = 100;
      let score = maxScore;
      
      // Pénalités pour les risques
      const risksPenalty = audit.risks.reduce((penalty, risk) => {
        switch (risk.severity) {
          case 'critical': return penalty + 15;
          case 'high': return penalty + 10;
          case 'medium': return penalty + 5;
          case 'low': return penalty + 2;
          default: return penalty;
        }
      }, 0);
      
      // Pénalités pour la couverture
      const coveragePenalty = Math.max(0, 30 - Math.floor(audit.coverage.percentage / 3.33));
      
      // Pénalités pour les chemins critiques bloqués
      const blockedCriticalPaths = audit.criticalPaths.filter(path => path.status === 'blocked').length;
      const criticalPathPenalty = blockedCriticalPaths * 5;
      
      // Pénalité si en retard
      const schedulePenalty = audit.schedule.onTrack ? 0 : 15;
      
      // Score final
      score = Math.max(0, score - risksPenalty - coveragePenalty - criticalPathPenalty - schedulePenalty);
      audit.score = score;
      
      // Générer des recommandations
      audit.recommendations = this.generateStrategyRecommendations(audit);
      
      return audit;
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse de la stratégie: ${error.message}`);
      audit.score = 0;
      return audit;
    }
  }

  /**
   * Compte le nombre de connexions entre les nœuds
   */
  private countConnections(nodes: any[], config: any): number {
    // Si la configuration n'a pas de connexions définies, retourner 0
    if (!config.connections || typeof config.connections !== 'object') {
      return 0;
    }
    
    // DansDotn8N, les connexions sont au niveau du workflow, pas des nœuds
    // Compter toutes les connexions définies entre les nœuds
    let connections = 0;
    
    // Parcourir toutes les clés de l'objet connections (noms des nœuds sources)
    Object.keys(config.connections).forEach(sourceNode => {
      // Chaque nœud source peut avoir plusieurs tableaux de connexions (main, etc.)
      const sourceConnections = config.connections[sourceNode];
      if (sourceConnections && sourceConnections.main && Array.isArray(sourceConnections.main)) {
        // Parcourir tous les tableaux de connexions sortantes
        sourceConnections.main.forEach((connectionArray: any[]) => {
          if (Array.isArray(connectionArray)) {
            connections += connectionArray.length;
          }
        });
      }
    });
    
    return connections;
  }

  /**
   * Trouve les nœuds en erreur dans un workflow
   */
  private findErrorNodes(nodes: any[]): string[] {
    const errorNodes: string[] = [];
    
    for (const node of nodes) {
      // Critères pour identifier un nœud en erreur
      if (
        (node.issues && node.issues.length > 0) ||
        (node.disabled === true) ||
        (node.status === 'error')
      ) {
        errorNodes.push(node.name || node.id || 'Nœud inconnu');
      }
    }
    
    return errorNodes;
  }

  /**
   * Détecte les problèmes dans un workflow
   */
  private detectWorkflowIssues(workflowId: string, workflowName: string, nodes: any[], issues: PipelineAudit['issues']): void {
    // Vérifier les patterns problématiques
    
    // 1. Nœuds non connectés
    const unconnectedNodes = nodes.filter(node => {
      return !node.connections || node.connections.length === 0;
    });
    
    if (unconnectedNodes.length > 0) {
      issues.push({
        severity: 'medium',
        message: `${unconnectedNodes.length} nœud(s) non connecté(s) détecté(s)`,
        location: {
          workflow: workflowName
        },
        recommendation: 'Connectez les nœuds isolés ou supprimez-les'
      });
    }
    
    // 2. Points de terminaison potentiels manquants
    const hasError = nodes.some(node => node.type?.includes('Error'));
    
    if (!hasError) {
      issues.push({
        severity: 'low',
        message: 'Aucun nœud de gestion d\'erreur trouvé',
        location: {
          workflow: workflowName
        },
        recommendation: 'Ajoutez des gestionnaires d\'erreur pour améliorer la robustesse'
      });
    }
    
    // 3. Détecter les boucles potentiellement infinies
    const possiblyInfiniteLoops = this.detectPotentialInfiniteLoops(nodes);
    
    if (possiblyInfiniteLoops) {
      issues.push({
        severity: 'high',
        message: 'Boucle potentiellement infinie détectée',
        location: {
          workflow: workflowName
        },
        recommendation: 'Vérifiez les conditions de sortie des boucles de ce workflow'
      });
    }
  }

  /**
   * Détecte les boucles potentiellement infinies
   */
  private detectPotentialInfiniteLoops(nodes: any[]): boolean {
    // Logique simplifiée - recherche des nœuds de boucle sans condition claire de sortie
    return nodes.some(node => {
      return (
        (node.type?.includes('Loop') || node.type?.includes('While') || node.type?.includes('Each')) &&
        (!node.parameters?.limit || node.parameters.limit > 1000)
      );
    });
  }

  /**
   * Identifie les lacunes dans la stratégie de migration
   */
  private identifyStrategyGaps(audit: StrategyAudit): void {
    // Vérifier la couverture
    if (audit.coverage.percentage < 50) {
      audit.gaps.push({
        area: 'Couverture',
        description: 'Faible couverture de la migration (<50%)',
        recommendation: 'Établir un plan d\'action pour prioriser les éléments à migrer'
      });
    }
    
    // Vérifier la présence de tests
    const hasTestPath = fs.existsSync('test-QaAnalyzer.ts') || fs.existsSync('test-QaAnalyzer-simple.ts');
    
    if (!hasTestPath) {
      audit.gaps.push({
        area: 'Tests',
        description: 'Stratégie de tests automatisés insuffisante',
        recommendation: 'Implémenter une suite de tests automatisés pour valider les migrations'
      });
    }
    
    // Vérifier la présence de Docker
    const hasDocker = fs.existsSync('docker-compose.yml');
    
    if (!hasDocker) {
      audit.gaps.push({
        area: 'Infrastructure',
        description: 'Environnement d\'exécution mal défini',
        recommendation: 'Standardiser l\'environnement avec Docker pour assurer la cohérence'
      });
    }
    
    // Vérifier si des stratégies de rollback sont présentes
    const hasMigrationConfig = fs.existsSync('migration-config.json');
    
    if (!hasMigrationConfig) {
      audit.gaps.push({
        area: 'Résilience',
        description: 'Stratégie de rollback non définie',
        recommendation: 'Définir des procédures de rollback en cas d\'échec de migration'
      });
    }
  }

  /**
   * Génère des recommandations pour le pipeline
   */
  private generatePipelineRecommendations(audit: PipelineAudit): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur le score
    if (audit.score < 50) {
      recommendations.push('Résoudre en priorité les problèmes critiques et graves dans le pipeline');
    }
    
    // Recommandations basées sur les workflows
    const errorWorkflows = audit.workflows.filter(w => w.status === 'error');
    if (errorWorkflows.length > 0) {
      recommendations.push(`Corriger les ${errorWorkflows.length} workflows en erreur pour assurer la stabilité du pipeline`);
    }
    
    // Recommandations basées sur les problèmes courants
    if (audit.issues.some(i => i.message.includes('non connecté'))) {
      recommendations.push('Nettoyer les workflows en supprimant ou connectant les nœuds isolés');
    }
    
    if (audit.issues.some(i => i.message.includes('Boucle potentiellement infinie'))) {
      recommendations.push('Ajouter des limites explicites à toutes les boucles pour éviter les exécutions infinies');
    }
    
    // Recommandations générales
    recommendations.push('Implémenter une surveillance continue des performances du pipeline');
    recommendations.push('Mettre en place un système de notification en cas d\'échec de workflow');
    
    return recommendations;
  }

  /**
   * Génère des recommandations pour la stratégie
   */
  private generateStrategyRecommendations(audit: StrategyAudit): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur la couverture
    if (audit.coverage.percentage < 30) {
      recommendations.push('CRITIQUE : Accélérer la couverture de migration qui est actuellement très faible');
    } else if (audit.coverage.percentage < 70) {
      recommendations.push('Augmenter le taux de couverture de la migration pour atteindre au moins 70%');
    }
    
    // Recommandations basées sur les risques
    const criticalRisks = audit.risks.filter(r => r.severity === 'critical').length;
    const highRisks = audit.risks.filter(r => r.severity === 'high').length;
    
    if (criticalRisks > 0) {
      recommendations.push(`Traiter immédiatement les ${criticalRisks} risques critiques identifiés`);
    }
    
    if (highRisks > 0) {
      recommendations.push(`Établir un plan d'action pour les ${highRisks} risques élevés`);
    }
    
    // Recommandations basées sur les chemins critiques
    const blockedPaths = audit.criticalPaths.filter(p => p.status === 'blocked').length;
    
    if (blockedPaths > 0) {
      recommendations.push(`Débloquer les ${blockedPaths} chemins critiques actuellement bloqués`);
    }
    
    // Recommandations basées sur les lacunes
    audit.gaps.forEach(gap => {
      recommendations.push(gap.recommendation);
    });
    
    // Recommandations si en retard
    if (!audit.schedule.onTrack) {
      recommendations.push('Réévaluer le calendrier de migration et ajuster les ressources pour rattraper le retard');
    }
    
    return recommendations;
  }

  /**
   * Génère un rapport Markdown basé sur les deux audits
   */
  private generateMarkdownReport(pipelineAudit: PipelineAudit, strategyAudit: StrategyAudit): string {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    let markdown = `# Rapport d'audit du pipeline de migration\n\n`;
    markdown += `*Généré le ${formattedDate} à ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}*\n\n`;
    
    // Section résumé
    markdown += `## 📋 Résumé\n\n`;
    markdown += `| Composant | Score | Statut |\n`;
    markdown += `|-----------|-------|--------|\n`;
    markdown += `| **Pipeline** | ${pipelineAudit.score}/100 | ${this.getStatusEmoji(pipelineAudit.summary.status)} ${pipelineAudit.summary.message} |\n`;
    markdown += `| **Stratégie** | ${strategyAudit.score}/100 | ${strategyAudit.schedule.onTrack ? '✅ En bonne voie' : '⚠️ En retard'} |\n\n`;
    
    // Section pipeline
    markdown += `## 🔄 Pipeline de migration\n\n`;
    markdown += `### Workflows analysés (${pipelineAudit.workflows.length})\n\n`;
    
    if (pipelineAudit.workflows.length > 0) {
      markdown += `| Workflow | Statut | Nœuds | Connexions |\n`;
      markdown += `|----------|--------|-------|------------|\n`;
      
      pipelineAudit.workflows.forEach(workflow => {
        const statusEmoji = workflow.status === 'active' ? '✅' : 
                           (workflow.status === 'inactive' ? '⚠️' : '❌');
        
        markdown += `| ${workflow.name} | ${statusEmoji} | ${workflow.nodeCount} | ${workflow.connections} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // Section problèmes de pipeline
    if (pipelineAudit.issues.length > 0) {
      markdown += `### Problèmes détectés (${pipelineAudit.issues.length})\n\n`;
      markdown += `| Sévérité | Problème | Localisation | Recommandation |\n`;
      markdown += `|----------|----------|-------------|----------------|\n`;
      
      pipelineAudit.issues.forEach(issue => {
        const severityEmoji = this.getSeverityEmoji(issue.severity);
        markdown += `| ${severityEmoji} | ${issue.message} | ${issue.location.workflow}${issue.location.node ? ` / ${issue.location.node}` : ''} | ${issue.recommendation} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // Section stratégie
    markdown += `## 📊 Stratégie de migration\n\n`;
    markdown += `### Couverture actuelle\n\n`;
    markdown += `- **Total à migrer** : ${strategyAudit.coverage.total} éléments\n`;
    markdown += `- **Déjà migrés** : ${strategyAudit.coverage.covered} éléments\n`;
    markdown += `- **Pourcentage** : ${strategyAudit.coverage.percentage}%\n\n`;
    
    // Afficher un graphique de progression ASCII
    const progressBar = this.generateAsciiProgressBar(strategyAudit.coverage.percentage);
    markdown += "```\n";
    markdown += progressBar;
    markdown += "\n```\n\n";
    
    // Section risques
    if (strategyAudit.risks.length > 0) {
      markdown += `### Risques identifiés (${strategyAudit.risks.length})\n\n`;
      markdown += `| Sévérité | Description | Impact | Mitigation |\n`;
      markdown += `|----------|-------------|--------|------------|\n`;
      
      strategyAudit.risks.forEach(risk => {
        const severityEmoji = this.getSeverityEmoji(risk.severity);
        markdown += `| ${severityEmoji} | ${risk.description} | ${risk.impact} | ${risk.mitigation} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // Section chemins critiques
    if (strategyAudit.criticalPaths.length > 0) {
      markdown += `### Chemins critiques (${strategyAudit.criticalPaths.length})\n\n`;
      markdown += `| Nom | Statut | Dépendances | Temps estimé (j) |\n`;
      markdown += `|-----|--------|-------------|------------------|\n`;
      
      strategyAudit.criticalPaths.forEach(path => {
        const statusEmoji = this.getPathStatusEmoji(path.status);
        markdown += `| ${path.name} | ${statusEmoji} | ${path.dependencies.length} | ${path.estimatedTime} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // Section recommandations prioritaires
    markdown += `## 🚀 Recommandations prioritaires\n\n`;
    
    // Combiner et prioriser les recommandations
    const priorityRecommendations = [
      ...pipelineAudit.recommendations.slice(0, 3),
      ...strategyAudit.recommendations.slice(0, 3)
    ].slice(0, 5);
    
    priorityRecommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    
    markdown += `\n`;
    
    // Section prochaines étapes
    markdown += `## ⏭️ Prochaines étapes\n\n`;
    markdown += `1. Résoudre les problèmes critiques identifiés\n`;
    markdown += `2. Mettre à jour la stratégie de migration en fonction des recommandations\n`;
    markdown += `3. Planifier un nouvel audit dans 2 semaines\n`;
    
    // Ajouter les avertissements s'il y en a
    if (this.warnings.length > 0) {
      markdown += `\n## ⚠️ Avertissements\n\n`;
      this.warnings.forEach(warning => {
        markdown += `- ${warning}\n`;
      });
    }
    
    return markdown;
  }

  /**
   * Génère une barre de progression ASCII
   */
  private generateAsciiProgressBar(percentage: number): string {
    const width = 50;
    const completedWidth = Math.floor(width * (percentage / 100));
    const remainingWidth = width - completedWidth;
    
    return `${percentage.toString().padStart(3)}% [${'#'.repeat(completedWidth)}${'-'.repeat(remainingWidth)}]`;
  }

  /**
   * Obtenir un emoji pour un statut donné
   */
  private getStatusEmoji(status: 'ok' | 'warning' | 'error'): string {
    switch (status) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }

  /**
   * Obtenir un emoji pour une sévérité donnée
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  /**
   * Obtenir un emoji pour un statut de chemin critique
   */
  private getPathStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'blocked': return '🛑';
      case 'not-started': return '⏳';
      default: return '❓';
    }
  }

  /**
   * Fonction principale pour exécuter l'audit complet
   */
  public async runAudit(options: {
    outputPipeline: string;
    outputStrategy: string;
    summary?: string;
  }): Promise<void> {
    try {
      // Créer les répertoires de sortie si nécessaires
      const pipelineDirPath = path.dirname(options.outputPipeline);
      const strategyDirPath = path.dirname(options.outputStrategy);
      
      if (!fs.existsSync(pipelineDirPath)) {
        fs.mkdirSync(pipelineDirPath, { recursive: true });
      }
      
      if (!fs.existsSync(strategyDirPath)) {
        fs.mkdirSync(strategyDirPath, { recursive: true });
      }
      
      // Lancer l'audit du pipeline
      this.logger.log('Démarrage de l\'audit du pipeline...');
      this.pipelineAudit = await this.auditPipeline();
      
      // Lancer l'audit de la stratégie
      this.logger.log('Démarrage de l\'audit de la stratégie...');
      this.strategyAudit = await this.auditStrategy();
      
      // Écrire les rapports JSON
      fs.writeFileSync(options.outputPipeline, JSON.stringify(this.pipelineAudit, null, 2));
      this.logger.log(`✅ Rapport d'audit du pipeline enregistré dans ${options.outputPipeline}`);
      
      fs.writeFileSync(options.outputStrategy, JSON.stringify(this.strategyAudit, null, 2));
      this.logger.log(`✅ Rapport d'audit de la stratégie enregistré dans ${options.outputStrategy}`);
      
      // Générer et écrire le rapport Markdown
      if (options.summary) {
        const markdownReport = this.generateMarkdownReport(this.pipelineAudit, this.strategyAudit);
        fs.writeFileSync(options.summary, markdownReport);
        this.logger.log(`✅ Résumé en Markdown enregistré dans ${options.summary}`);
      }
      
      // Afficher un résumé
      this.logger.log('\n📊 Résumé de l\'audit :');
      this.logger.log(`- Score pipeline : ${this.pipelineAudit.score}/100 (${this.pipelineAudit.issues.length} problèmes identifiés)`);
      this.logger.log(`- Score stratégie : ${this.strategyAudit.score}/100 (${this.strategyAudit.risks.length} risques identifiés)`);
      
      if (this.warnings.length > 0) {
        this.logger.warn(`⚠️ ${this.warnings.length} avertissement(s) durant l'audit.`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'exécution de l'audit: ${error.message}`);
      throw error;
    }
  }
}

// Fonction principale pour l'exécution en CLI
async function main() {
  try {
    // Analyser les arguments
    const args = process.argv.slice(2);
    const options: Record<string, string> = {};
    
    // Traiter les arguments de ligne de commande
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
        options[key] = value;
        if (value !== 'true') i++;
      }
    }
    
    // Vérifier les arguments requis
    if (!options['output-pipeline']) {
      console.error('❌ Erreur: Argument --output-pipeline manquant');
      process.exit(1);
    }
    
    if (!options['output-strategy']) {
      console.error('❌ Erreur: Argument --output-strategy manquant');
      process.exit(1);
    }
    
    // Créer et exécuter l'auditeur
    const auditor = new PipelineStrategyAuditor();
    await auditor.runAudit({
      outputPipeline: options['output-pipeline'],
      outputStrategy: options['output-strategy'],
      summary: options['summary']
    });
  } catch (error: any) {
    console.error(`❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

// Exporter pour les tests et la réutilisation
export { PipelineStrategyAuditor };













import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';









































































































































































































































































































































































































































































































































































































































































































































































































































































