/**
 * Point d'entrée principal pour le module MCP Agents
 * Architecture standardisée à 3 couches:
 * 1. Couche d'abstraction (interfaces communes)
 * 2. Couche métier (implémentations spécifiques)
 * 3. Couche d'intégration (connecteurs aux autres systèmes)
 */

// Exporter les interfaces et types de base
export * from './core/interfaces';
export * from './core/types';

// Exporter le registre d'agents
export { AgentRegistry, AgentFactory } from './core/agent-registry';

// Exporter les classes de base pour chaque type d'agent
export { BaseAnalyzerAgent, AnalyzerAgentConfig, AnalysisResult } from './analyzers';
export { BaseGeneratorAgent, GeneratorAgentConfig, GenerationResult } from './generators';
export { BaseValidatorAgent, ValidatorAgentConfig, ValidationResult } from './validators';
export { 
  BaseOrchestratorAgent, 
  OrchestratorAgentConfig, 
  OrchestrationResult,
  OrchestratorEvent
} from './orchestrators';

// Exporter les implémentations d'agents
// Analyseurs
export * from './analyzers';

// Générateurs
export * from './generators';

// Validateurs
export * from './validators';

// Orchestrateurs
export * from './orchestrators';

// Services partagés
export * from './core/logging/logger';
export * from './core/metrics/metrics-collector';
