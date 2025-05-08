/**
 * Module d'orchestration pour le projet MCP
 * 
 * Ce module expose l'orchestrateur standardisé qui permet d'utiliser
 * la meilleure solution d'orchestration selon le type de tâche,
 * ainsi que les orchestrateurs individuels pour les cas spécifiques.
 */

// Export principal de l'orchestrateur standardisé
export {
    standardizedOrchestrator as default,
    standardizedOrchestrator,
    StandardizedOrchestrator,
    StandardizedOrchestratorOptions
} from './standardized-orchestrator';

// Export des types communs
export * from './types';

// Export des orchestrateurs individuels pour les cas d'usage spécifiques
export { temporal } from './temporal';
export { bullmq } from './queue';

// Export de l'orchestrateur déprécié (avec avertissement)
// Décommenter uniquement si nécessaire pour migration progressive
// export { n8n } from './n8n-deprecated';

// Export du pont d'orchestrateur pour les composants externes
export * from './orchestrator-bridge';