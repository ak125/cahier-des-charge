/**
 * Htaccess Router Analyzer
 * Agent export file
 *
 * Version corrigée: 2025-04-19
 */

import { HtaccessRouterAnalyzer } from './htaccess-router-analyzer';

// Définir l'interface AgentContext directement ici
export interface AgentContext {
  jobId: string;
  filePath?: string;
  [key: string]: any;
}

// Créer une instance de l'agent qui sera exportée directement
const agent = new HtaccessRouterAnalyzer();

// Exporter les propriétés et méthodes requises pour l'interface McpAgent
export const metadata = agent.metadata;
export const events = agent.events;
export const initialize = () => agent.initialize();
export const execute = (context: AgentContext) => agent.execute(context);
export const validate = (context: AgentContext) => agent.validate(context);
export const stop = () => agent.stop();
export const getStatus = () => agent.getStatus();

// Exporter également la classe pour permettre l'instanciation manuelle si nécessaire
export { HtaccessRouterAnalyzer };

// Export par défaut de l'instance agent
export default agent;
