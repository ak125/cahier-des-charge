import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de registre
 * Responsable de l'enregistrement et de la découverte des agents et services
 */
export interface RegistryAgent extends BaseAgent {
  /**
   * Enregistre un agent dans le registre
   * @param agent Métadonnées de l'agent à enregistrer
   */
  registerAgent(agent: Record<string, any>): Promise<AgentResult>;

  /**
   * Désenregistre un agent du registre
   * @param agentId Identifiant de l'agent à désenregistrer
   */
  unregisterAgent(agentId: string): Promise<AgentResult>;

  /**
   * Recherche des agents selon des critères
   * @param criteria Critères de recherche
   */
  findAgents(criteria: Record<string, any>): Promise<Record<string, any>[]>;
}