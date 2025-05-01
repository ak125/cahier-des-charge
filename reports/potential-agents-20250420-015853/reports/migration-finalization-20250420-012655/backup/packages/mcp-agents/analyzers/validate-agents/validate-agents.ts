/**
 * Script de validation des agents MCP
 * Ce script vérifie que tous les agents respectent l'interface McpAgent
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { getAllAgentIds } from './business';
import { AgentContext, AgentMetadata, AgentResult, AgentStatus, McpAgent } from './core/interfaces';

// Interface pour le rapport de validation
interface ValidationReport {
  agentId: string;
  path: string;
  isValid: boolean;
  missingProperties: string[];
  missingMethods: string[];
  errors: string[];
}

// Fonction utilitaire pour extraire les messages d'erreur
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return String(error);
  }
}

// Classe pour valider un agent
class AgentValidator implements BaseAgent, BusinessAgent, AnalyzerAgent {
  // Liste des propriétés requises par l'interface McpAgent
  private requiredProperties = ['metadata', 'status', 'events'];

  // Liste des méthodes requises par l'interface McpAgent
  private requiredMethods = ['initialize', 'execute', 'validate', 'stop', 'getStatus'];

  // Valider un agent individuel
  async validateAgent(agentId: string, agentPath: string): Promise<ValidationReport> {
    const report: ValidationReport = {
      agentId,
      path: agentPath,
      isValid: true,
      missingProperties: [],
      missingMethods: [],
      errors: [],
    };

    try {
      // Vérifier si le fichier existe
      const indexPath = path.join(agentPath, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        report.errors.push(`Fichier index.ts non trouvé dans ${agentPath}`);
        report.isValid = false;
        return report;
      }

      // Essayer d'importer le module
      try {
        // Dynamiquement importer le module (peut échouer si des dépendances manquent)
        const agentModule = require(agentPath);

        // Trouver la classe d'agent (heuristique: chercher une classe exportée avec "Agent" dans son nom)
        const agentClasses = Object.values(agentModule).filter(
          (exp: any) =>
            typeof exp === 'function' &&
            /Agent/i.test(exp.name) &&
            typeof exp.prototype === 'object'
        );

        if (agentClasses.length === 0) {
          report.errors.push(`Aucune classe d'agent trouvée dans ${agentPath}`);
          report.isValid = false;
          return report;
        }

        // Tenter d'instancier l'agent (peut échouer si le constructeur attend des paramètres)
        let agent: any;
        try {
          const AgentClass = agentClasses[0] as any;
          agent = new AgentClass();
        } catch (error) {
          report.errors.push(`Impossible d'instancier l'agent: ${getErrorMessage(error)}`);

          // Continuer avec une analyse statique des prototypes
          const proto = (agentClasses[0] as any).prototype;

          // Vérifier les méthodes requises dans le prototype
          for (const method of this.requiredMethods) {
            if (typeof proto[method] !== 'function') {
              report.missingMethods.push(method);
              report.isValid = false;
            }
          }

          return report;
        }

        // Vérifier les propriétés requises
        for (const prop of this.requiredProperties) {
          if (!(prop in agent)) {
            report.missingProperties.push(prop);
            report.isValid = false;
          }
        }

        // Vérifier les méthodes requises
        for (const method of this.requiredMethods) {
          if (typeof agent[method] !== 'function') {
            report.missingMethods.push(method);
            report.isValid = false;
          }
        }

        // Vérifications spécifiques pour certaines propriétés
        if ('metadata' in agent) {
          const metadata = agent.metadata;
          if (!metadata.id || !metadata.type || !metadata.name || !metadata.version) {
            report.errors.push('Propriété metadata incomplète');
            report.isValid = false;
          }
        }

        if ('events' in agent && !(agent.events instanceof EventEmitter)) {
          report.errors.push("La propriété events n'est pas une instance d'EventEmitter");
          report.isValid = false;
        }
      } catch (error) {
        report.errors.push(`Erreur lors de l'importation du module: ${getErrorMessage(error)}`);
        report.isValid = false;
      }
    } catch (error) {
      report.errors.push(`Erreur inattendue: ${getErrorMessage(error)}`);
      report.isValid = false;
    }

    return report;
  }

  // Valider tous les agents
  async validateAllAgents(): Promise<ValidationReport[]> {
    const agentIds = getAllAgentIds();
    const reports: ValidationReport[] = [];

    for (const agentId of agentIds) {
      // Déterminer le chemin de l'agent en fonction de son ID
      let agentPath = '';

      if (agentId.includes('analyzer')) {
        agentPath = path.resolve(__dirname, 'business/analyzers', agentId);
      } else if (agentId.includes('generator')) {
        agentPath = path.resolve(__dirname, 'business/generators', agentId);
      } else if (
        agentId.includes('validator') ||
        agentId === 'SeoChecker' ||
        agentId === 'CanonicalValidator'
      ) {
        agentPath = path.resolve(__dirname, 'business/validators', agentId);
      } else if (agentId.includes('orchestrator') || agentId.includes('agent')) {
        agentPath = path.resolve(__dirname, 'business/orchestrators', agentId);
      }

      if (!agentPath) {
        reports.push({
          agentId,
          path: 'unknown',
          isValid: false,
          missingProperties: [],
          missingMethods: [],
          errors: ["Impossible de déterminer le chemin de l'agent"],
        });
        continue;
      }

      const report = await this.validateAgent(agentId, agentPath);
      reports.push(report);
    }

    return reports;
  }
}

// Fonction principale
async function main() {
  console.log('Validation des agents MCP...');

  const validator = new AgentValidator();
  const reports = await validator.validateAllAgents();

  // Afficher un résumé
  const validCount = reports.filter((r) => r.isValid).length;
  console.log(`\nRésumé: ${validCount}/${reports.length} agents valides\n`);

  // Afficher les détails pour chaque agent
  for (const report of reports) {
    console.log(`Agent: ${report.agentId}`);
    console.log(`Chemin: ${report.path}`);
    console.log(`Valide: ${report.isValid ? 'Oui ✅' : 'Non ❌'}`);

    if (!report.isValid) {
      if (report.missingProperties.length > 0) {
        console.log(`  Propriétés manquantes: ${report.missingProperties.join(', ')}`);
      }

      if (report.missingMethods.length > 0) {
        console.log(`  Méthodes manquantes: ${report.missingMethods.join(', ')}`);
      }

      if (report.errors.length > 0) {
        for (const error of report.errors) {
          console.log(`  Erreur: ${error}`);
        }
      }
    }

    console.log('-----------------------------------');
  }

  // Générer un rapport JSON
  const reportPath = path.resolve(__dirname, 'agent-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));

  console.log(`Rapport JSON généré: ${reportPath}`);

  // Retourner un code d'erreur si des agents sont invalides
  return validCount === reports.length ? 0 : 1;
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error('Erreur inattendue:', getErrorMessage(error));
      process.exit(1);
    });
}

// Exporter pour utilisation dans d'autres scripts
export { AgentValidator };

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';

import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
