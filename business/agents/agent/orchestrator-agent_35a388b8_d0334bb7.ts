import { BaseAgent } from '../base-agentstructure-agent';
import { McpAgent } from '../mcp-agentstructure-agent';

/**
 * Interface pour les agents d'orchestration qui coordonnent d'autres agents
 */
export interface OrchestratorAgent extends BaseAgent {
  /** Orchestrer l'exécution d'une chaîne d'agents */
  orchestrate(agents: McpAgent[], params: Record<string, any>): Promise<Record<string, any>>;

  /** Enregistrer un agent dans l'orchestrateur */
  registerAgent?(agent: McpAgent): Promise<void>;

  /** Désenregistrer un agent */
  unregisterAgent?(agentName: string): Promise<void>;

  /** Liste des agents enregistrés */
  registeredAgents?: McpAgent[];

  /** Récupère l'état du système d'orchestration */
  getSystemState?(): Promise<Record<string, any>>;

  /** Supervise l'exécution d'une tâche */
  monitorExecution?(jobId: string): Promise<Record<string, any>>;
}
