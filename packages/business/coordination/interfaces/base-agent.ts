/**
 * base-agent.ts
 *
 * @deprecated Cette interface est déplacée vers mcp-types/src/base-agent.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter l'interface depuis le fichier centralisé
export { BaseAgent } from 'mcp-types/src/base-agent';

// Pour la compatibilité avec l'ancien code qui utilise certaines propriétés spécifiques
import { EventEmitter } from 'events';
import { AgentContext, AgentMetadata, AgentStatus, BaseConfig } from '@workspaces/migration-ai-pipeline/src/core/interfaces';

// Types pour la rétrocompatibilité
export { AgentContext, AgentMetadata, AgentStatus, BaseConfig };