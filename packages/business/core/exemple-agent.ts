/**
 * Exemple d'intégration OpenTelemetry dans un agent MCP
 * Cet exemple montre comment instrumenter un agent pour profiter du traçage distribué
 */

import { AgentTracer } from './index';

// Un exemple d'agent MCP simplifié
class MCPVerifierAgent {
  id: string = 'mcp-verifier';
  name: string = 'MCP Verifier';
  version: string = '1.0.0';

  constructor() {
    // Initialiser le traçage pour cet agent
    AgentTracer.initAgentTracing(this);
  }

  /**
   * Vérification de la conformité d'un fichier
   */
  async verifyFile(filePath: string, options: any): Promise<any> {
    // Utiliser le traceur pour suivre l'exécution de cette opération
    return AgentTracer.traceAgentExecution(
      this,
      'verifyFile',
      async () => {
        // Le code réel de la vérification du fichier
        console.log(`Vérifiant le fichier: ${filePath}`);

        // Simuler un appel API externe à un service de vérification
        const verificationResult = await this.callVerificationService(filePath);

        // Simuler un traitement local
        const processedResult = await this.processVerificationResults(verificationResult);

        return {
          success: true,
          data: processedResult,
          file: filePath
        };
      },
      // Métadonnées supplémentaires pour enrichir les traces
      {
        'file.path': filePath,
        'verification.type': options.type,
        'verification.depth': options.depth
      }
    );
  }

  /**
   * Exemple d'appel API vers un service externe
   */
  private async callVerificationService(filePath: string): Promise<any> {
    // Tracer l'appel API externe
    return AgentTracer.traceApiCall(
      this,
      'verification-service',
      '/api/verify',
      async () => {
        // Simuler un appel API
        console.log(`Appel API vers le service de vérification pour ${filePath}`);

        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 100));

        return { status: 'valid', issues: [] };
      }
    );
  }

  /**
   * Traitement local des résultats de vérification
   */
  private async processVerificationResults(results: any): Promise<any> {
    // Tracer une opération interne
    return AgentTracer.traceAsync(
      `Processing:${this.id}:VerificationResults`,
      async (span) => {
        console.log('Traitement des résultats de vérification');

        // Ajouter des attributs supplémentaires au span
        span.setAttributes({
          'processing.complexity': results.issues.length > 0 ? 'complex' : 'simple'
        });

        // Simuler un traitement
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
          verified: true,
          issuesCount: results.issues.length,
          status: results.status
        };
      }
    );
  }
}

// Démonstration de l'utilisation
async function demonstrateTracing() {
  const agent = new MCPVerifierAgent();

  try {
    console.log('Démarrage de la vérification...');

    const result = await agent.verifyFile('/path/to/some/file.ts', {
      type: 'typescript',
      depth: 'detailed'
    });

    console.log('Résultat:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la démonstration si ce fichier est exécuté directement
if (require.main === module) {
  demonstrateTracing();
}