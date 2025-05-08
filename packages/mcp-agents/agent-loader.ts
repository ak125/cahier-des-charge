/**
 * Agent Loader - Point d'enregistrement centralisé pour les agents MCP
 * 
 * Ce fichier permet d'enregistrer tous les agents MCP disponibles dans le système.
 * Chaque agent doit être importé et enregistré ici pour être accessible via l'API MCP.
 */

import { AgentRegistry } from '../agents/agent-registry';

// Importation des agents d'orchestration et de nettoyage
import * as dockerCleaner from './orchestration/cleanup/mcp-agent-docker-cleaner';
import * as diskWatcher from './orchestration/cleanup/disk-watcher';

// Création du registre d'agents
const agents = new AgentRegistry();

/**
 * Enregistrement des agents de nettoyage et de maintenance
 */
agents.register('docker-cleaner', dockerCleaner.run);
agents.register('disk-watcher', diskWatcher.run);

/**
 * Export du registre des agents pour utilisation dans le système MCP
 */
export { agents };