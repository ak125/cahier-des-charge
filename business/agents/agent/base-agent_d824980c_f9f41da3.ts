import { McpAgent } from './mcp-agentstructure-agent';

/**
 * Interface de base étendue avec fonctionnalités additionnelles communes
 */
export interface BaseAgent extends McpAgent {
  /** Domaine fonctionnel de l'agent */
  domain: string;

  /** Liste des capacités de l'agent */
  capabilities: string[];

  /** Retourne un résumé textuel des fonctionnalités */
  getSummary(): string;

  /** Vérifie la compatibilité avec un autre agent */
  checkCompatibility?(otherAgent: McpAgent): Promise<boolean>;

  /** Journalise un message avec niveau de log */
  log?(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
}
