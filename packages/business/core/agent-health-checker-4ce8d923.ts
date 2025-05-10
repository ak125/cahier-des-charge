import * as fs from 'fs';
import * as path from 'path';
import { agents } from './agent-registry';
import { BaseAgent } from './types';

interface AgentHealth {
  id: string;
  name: string;
  hasManifest: boolean;
  hasTests: boolean;
  hasValidInterface: boolean;
  isInRegistry: boolean;
  isInStatusJson: boolean;
  issues: string[];
}

interface HealthCheckReport {
  timestamp: string;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  agents: AgentHealth[];
  recommendations: string[];
}

/**
 * Agent Health Checker - Vérifie la conformité des agents au sein du système MCP
 *
 * Cet agent analyse tous les agents disponibles pour s'assurer qu'ils respectent
 * les conventions de développement et sont correctement intégrés dans le système.
 */
export class AgentHealthChecker implements BaseAgent {
  id = 'agent-health-checker';
  name = 'Agent Health Checker';
  version = '1.0.0';

  private agentsDir: string = path.resolve(__dirname);
  private auditDir: string = path.resolve(__dirname, '../audit/agents');
  private statusJsonPath: string = path.resolve(__dirname, '../status.json');

  async execute(): Promise<HealthCheckReport> {
    console.log('Démarrage de la vérification de la santé des agents...');

    // Analyse de tous les agents
    const healthReport = await this.checkAllAgents();

    // Générer un rapport Markdown
    await this.generateMarkdownReport(healthReport);

    console.log(`Rapport de santé généré: ${path.join(this.auditDir, 'health-report.md')}`);

    return healthReport;
  }

  private async checkAllAgents(): Promise<HealthCheckReport> {
    // S'assurer que le répertoire d'audit existe
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }

    // Lire le statut JSON s'il existe
    let statusJson: any = {};
    if (fs.existsSync(this.statusJsonPath)) {
      try {
        statusJson = JSON.parse(fs.readFileSync(this.statusJsonPath, 'utf8'));
      } catch (error) {
        console.error('Erreur lors de la lecture de status.json:', error);
      }
    }

    // Lire les entrées du répertoire des agents
    const dirEntries = fs.readdirSync(this.agentsDir, { withFileTypes: true });

    // Filtrer pour ne garder que les répertoires d'agents (pas les fichiers)
    const agentDirs = dirEntries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((dir) => dir.name);

    // Vérifier chaque agent
    const agentHealthList: AgentHealth[] = [];

    for (const agentId of Object.keys(agents)) {
      const agentInstance = agents[agentId];

      if (!agentInstance) continue;

      const agentDirName = this.getAgentDirName(agentId);
      const _dirExists = agentDirs.includes(agentDirName);

      const health: AgentHealth = {
        id: agentInstance.id || agentId,
        name: agentInstance.name || agentId,
        hasManifest: false,
        hasTests: false,
        hasValidInterface: true, // Par défaut, on suppose que l'interface est valide
        isInRegistry: true, // S'il est dans le registre c'est déjà vrai
        isInStatusJson: false,
        issues: [],
      };

      // Vérifier si l'agent est dans status.json
      if (statusJson.agents?.[agentId]) {
        health.isInStatusJson = true;
      } else {
        health.issues.push(`N'est pas présent dans status.json`);
      }

      // Vérifier le manifest.json
      const manifestPath = path.join(this.agentsDir, agentDirName, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        health.hasManifest = true;
      } else {
        health.issues.push(`Pas de manifest.json trouvé dans ${agentDirName}`);
      }

      // Vérifier les tests
      const testsPath = path.join(this.agentsDir, agentDirName, 'tests');
      if (fs.existsSync(testsPath) && fs.readdirSync(testsPath).length > 0) {
        health.hasTests = true;
      } else {
        health.issues.push(`Pas de tests unitaires trouvés dans ${agentDirName}/tests`);
      }

      // Vérifier l'interface (basique)
      if (typeof agentInstance.execute !== 'function') {
        health.hasValidInterface = false;
        health.issues.push(`N'implémente pas la méthode execute()`);
      }

      agentHealthList.push(health);
    }

    // Statistiques sur la santé
    const totalAgents = agentHealthList.length;
    const healthyAgents = agentHealthList.filter((h) => h.issues.length === 0).length;

    // Générer des recommandations
    const recommendations = this.generateRecommendations(agentHealthList);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalAgents,
        healthy: healthyAgents,
        unhealthy: totalAgents - healthyAgents,
      },
      agents: agentHealthList,
      recommendations,
    };
  }

  private getAgentDirName(agentId: string): string {
    // Convertit camelCase en kebab-case pour les noms de répertoire
    return agentId.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private generateRecommendations(agentHealthList: AgentHealth[]): string[] {
    const recommendations: string[] = [];

    const noManifestAgents = agentHealthList.filter((a) => !a.hasManifest);
    if (noManifestAgents.length > 0) {
      recommendations.push(
        `Créer les fichiers manifest.json manquants pour: ${noManifestAgents
          .map((a) => a.id)
          .join(', ')}`
      );
    }

    const noTestAgents = agentHealthList.filter((a) => !a.hasTests);
    if (noTestAgents.length > 0) {
      recommendations.push(
        `Ajouter des tests unitaires pour: ${noTestAgents.map((a) => a.id).join(', ')}`
      );
    }

    const notInStatusAgents = agentHealthList.filter((a) => !a.isInStatusJson);
    if (notInStatusAgents.length > 0) {
      recommendations.push(
        `Mettre à jour status.json pour inclure: ${notInStatusAgents.map((a) => a.id).join(', ')}`
      );
    }

    const interfaceIssueAgents = agentHealthList.filter((a) => !a.hasValidInterface);
    if (interfaceIssueAgents.length > 0) {
      recommendations.push(
        `Corriger l'implémentation de l'interface pour: ${interfaceIssueAgents
          .map((a) => a.id)
          .join(', ')}`
      );
    }

    return recommendations;
  }

  private async generateMarkdownReport(report: HealthCheckReport): Promise<void> {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR');

    let markdown = '# Rapport de Santé des Agents MCP\n\n';
    markdown += `Généré le: ${dateStr} à ${timeStr}\n\n`;

    markdown += '## Résumé\n\n';
    markdown += `- **Total des agents**: ${report.summary.total}\n`;
    markdown += `- **Agents en bonne santé**: ${report.summary.healthy}\n`;
    markdown += `- **Agents avec problèmes**: ${report.summary.unhealthy}\n\n`;

    if (report.recommendations.length > 0) {
      markdown += '## Recommandations\n\n';
      report.recommendations.forEach((rec) => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    markdown += '## Détails par Agent\n\n';

    // Tri des agents: d'abord ceux avec problèmes
    const sortedAgents = [...report.agents].sort((a, b) => {
      // Première priorité: les agents avec problèmes
      if (a.issues.length === 0 && b.issues.length > 0) return 1;
      if (a.issues.length > 0 && b.issues.length === 0) return -1;
      // Deuxième priorité: ordre alphabétique
      return a.name.localeCompare(b.name);
    });

    sortedAgents.forEach((agent) => {
      const status = agent.issues.length === 0 ? '✅' : '❌';
      markdown += `### ${status} ${agent.name}\n\n`;

      markdown += `- **ID**: \`${agent.id}\`\n`;
      markdown += `- **Manifest**: ${agent.hasManifest ? '✅' : '❌'}\n`;
      markdown += `- **Tests**: ${agent.hasTests ? '✅' : '❌'}\n`;
      markdown += `- **Interface valide**: ${agent.hasValidInterface ? '✅' : '❌'}\n`;
      markdown += `- **Dans agentRegistry.ts**: ${agent.isInRegistry ? '✅' : '❌'}\n`;
      markdown += `- **Dans status.json**: ${agent.isInStatusJson ? '✅' : '❌'}\n`;

      if (agent.issues.length > 0) {
        markdown += '\n**Problèmes:**\n\n';
        agent.issues.forEach((issue) => {
          markdown += `- ${issue}\n`;
        });
      }

      markdown += '\n';
    });

    // Écriture du rapport
    fs.writeFileSync(path.join(this.auditDir, 'health-report.md'), markdown);
  }
}

export default new AgentHealthChecker();
