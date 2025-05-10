import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de pont (bridge)
 * Responsable de la communication entre différentes couches et systèmes
 */
export interface BridgeAgent extends BaseAgent {
  /**
   * Transmet une requête d'un système à un autre
   * @param sourceSystem Système source de la requête
   * @param targetSystem Système cible de la requête
   * @param request Contenu de la requête à transmettre
   */
  forward(sourceSystem: string, targetSystem: string, request: Record<string, any>): Promise<AgentResult>;

  /**
   * Traduit un message d'un format à un autre
   * @param message Message à traduire
   * @param sourceFormat Format source du message
   * @param targetFormat Format cible pour la traduction
   */
  translate(message: Record<string, any>, sourceFormat: string, targetFormat: string): Promise<Record<string, any>>;
}