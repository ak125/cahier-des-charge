/**
 * Exemple d'intégration OpenTelemetry dans un orchestrateur MCP
 * Cet exemple montre comment instrumenter un orchestrateur pour le traçage distribué
 */

import { OrchestratorTracer } from './index';
import { Span } from '@opentelemetry/api';

// Un exemple d'orchestrateur MCP simplifié
class MigrationOrchestrator {
  id: string = 'migration-orchestrator';
  name: string = 'Migration Orchestrator';
  version: string = '1.0.0';

  constructor() {
    // Initialiser le traçage pour cet orchestrateur
    OrchestratorTracer.initOrchestratorTracing(this);
  }

  /**
   * Exécute un workflow de migration complet
   */
  async executeWorkflow(workflowId: string, params: any): Promise<any> {
    // Définition du workflow (exemple simplifié)
    const workflow = {
      id: workflowId,
      name: 'Migration Standard',
      steps: [
        {
          id: 'step1',
          name: 'Analyse de structure',
          agentId: 'structure-analyzer'
        },
        {
          id: 'step2',
          name: 'Vérification MCP',
          agentId: 'mcp-verifier',
          dependsOn: ['step1']
        },
        {
          id: 'step3',
          name: 'Migration de contenu',
          agentId: 'content-migrator',
          dependsOn: ['step2']
        },
        {
          id: 'step4',
          name: 'Validation post-migration',
          agentId: 'validator',
          dependsOn: ['step3']
        }
      ]
    };

    // Tracer l'exécution complète du workflow
    return OrchestratorTracer.traceWorkflowExecution(
      this,
      workflow,
      async (workflowSpan) => {
        console.log(`Démarrage du workflow: ${workflow.name} (ID: ${workflow.id})`);

        // Exécuter les étapes du workflow
        const results = {};

        // Simuler l'exécution séquentielle des étapes (dans un vrai orchestrateur, 
        // cela pourrait être parallélisé selon les dépendances)
        for (const step of workflow.steps) {
          results[step.id] = await this.executeWorkflowStep(workflow, step, workflowSpan, params);
        }

        console.log(`Workflow ${workflow.id} terminé avec succès`);

        return {
          workflowId,
          success: true,
          results,
          completedSteps: workflow.steps.length
        };
      },
      // Métadonnées supplémentaires
      {
        'workflow.type': 'migration',
        'workflow.priority': params.priority || 'normal',
        'workflow.initiator': params.initiator || 'system'
      }
    );
  }

  /**
   * Exécute une étape spécifique du workflow
   */
  private async executeWorkflowStep(workflow: any, step: any, parentSpan: Span, params: any): Promise<any> {
    // Tracer l'exécution d'une étape individuelle du workflow
    return OrchestratorTracer.traceWorkflowStep(
      this,
      workflow,
      step,
      async () => {
        console.log(`Exécution de l'étape: ${step.name} (ID: ${step.id})`);

        // Simuler l'invocation d'un agent spécifique
        const result = await this.invokeAgent(step.agentId, {
          stepId: step.id,
          workflowId: workflow.id,
          params
        });

        console.log(`Étape ${step.id} terminée avec résultat:`, result.success ? 'succès' : 'échec');

        return result;
      },
      parentSpan
    );
  }

  /**
   * Simule l'invocation d'un agent
   */
  private async invokeAgent(agentId: string, context: any): Promise<any> {
    // Tracer l'opération d'ordonnancement
    return OrchestratorTracer.traceSchedulingOperation(
      this,
      `InvokeAgent:${agentId}`,
      async () => {
        console.log(`Invocation de l'agent ${agentId} avec contexte:`, context);

        // Simuler un délai d'exécution variable selon l'agent
        let delay = 50;
        switch (agentId) {
          case 'structure-analyzer': delay = 150; break;
          case 'mcp-verifier': delay = 200; break;
          case 'content-migrator': delay = 300; break;
          case 'validator': delay = 100; break;
        }

        // Simuler le traitement de l'agent
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simuler un résultat
        return {
          agentId,
          success: true,
          data: { processed: true, timestamp: new Date().toISOString() }
        };
      },
      {
        'agent.id': agentId,
        'invocation.context': JSON.stringify(context)
      }
    );
  }
}

// Démonstration de l'utilisation
async function demonstrateOrchestration() {
  const orchestrator = new MigrationOrchestrator();

  try {
    console.log('Démarrage du workflow de migration...');

    const result = await orchestrator.executeWorkflow('wf-123', {
      priority: 'high',
      initiator: 'user-admin'
    });

    console.log('Workflow terminé avec succès:', result);
  } catch (error) {
    console.error('Erreur d\'orchestration:', error);
  }
}

// Exécuter la démonstration si ce fichier est exécuté directement
if (require.main === module) {
  demonstrateOrchestration();
}