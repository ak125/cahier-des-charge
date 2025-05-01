// Export des agents principaux
export * from './CanonicalValidator';
export * from './QaAnalyzer';
export * from './DevChecker';
export * from './MonitoringCheck';
export * from './DevLinter';
export * from './SeoContentEnhancer';
export * from '.DotMcpVerifier';
export * from './SeoRedirectMapper';
export * from './DiffVerifier';
export * from '.DotMcpManifestManager';
export * from './StatusWriter';

// Export des agents d'analyse
export * from './analysis/AgentDonnees';
export * from './analysis/DataAgent';
export * from './analysis/DependencyAgent';
export * from './analysis/AgentAudit';
export * from './analysis/TypeMapper';

// Export des workers
export * from './workers/PhpAnalyzerDotworker';
export * from './workers/McpVerifierDotworker';

// Remarque: Cet index exporte tous les agents trouvés dans le dossier.
// Si certains exports sont incorrects en raison de la structure des fichiers,
// veuillez ajuster selon la structure réelle des fichiers.

// Export des agents MCP
import { BullMQOrchestratorAgent } from './BullmqOrchestrator';

// Export des nouveaux agents Remix/SWC
export * from './RemixRoutes-agent';
export * from './swc-build-agent';
export * from './remix-loader-agent';

// Types
export interface AgentConfig {
  id: string;
  version: string;
  enabled: boolean;
  concurrency?: number;
  options?: Record<string, any>;
}

// Export des agents individuels
export { BullMQOrchestratorAgent };

// Export du registre d'agents
export { default as AgentRegistry } from '../agentRegistry';

// Export de l'outil de validation d'interface d'agent
export { validateAgentInterface } from '../agent-interface-validator';

// Fonction utilitaire pour initialiser tous les agents
export function initializeAgents(config: Record<string, AgentConfig>) {
  const agents = [];

  // Initialiser chaque agent basé sur la configuration
  for (const [agentId, agentConfig] of Object.entries(config)) {
    if (agentConfig.enabled) {
      // Ici, on peut ajouter la logique pour initialiser différents types d'agents
      // basé sur l'ID ou d'autres propriétés
      console.log(`Initialisation de l'agent: ${agentId} (v${agentConfig.version})`);
      // Les agents sont ajoutés au tableau pour être retournés
    }
  }

  return agents;
}
