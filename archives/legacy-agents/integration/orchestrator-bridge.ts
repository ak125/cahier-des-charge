/**
 * @deprecated ORCHESTRATEUR PERSONNALISÉ OBSOLÈTE - À MIGRER
 * 
 * Ce pont d'orchestration fait partie des orchestrateurs personnalisés qui doivent être migrés
 * vers l'implémentation standardisée selon le document /docs/technologies-standards.md.
 * 
 * PLAN DE MIGRATION:
 * 1. Pour les workflows complexes: Migrer vers Temporal.io (/packages/business/temporal/)
 * 2. Pour les tâches simples: Migrer vers BullMQ (/packages/business/queue/)
 * 
 * Date de dépréciation: 4 mai 2025
 * Date prévue de suppression: Q1 2026
 * Contact: equipe-architecture@example.com
 */

/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 * Veuillez importer depuis '@mcp/orchestration' à la place.
 * 
 * Ce fichier sera supprimé dans une version future.
 */

import {
  OrchestratorBridge,
  standardizedOrchestrator,
  OrchestratorBridgeOptions,
  TaskType,
  TaskExecutionOptions,
  TaskResult
} from '../../packages/orchestration';

// Exporter les mêmes éléments que l'interface publique d'origine
export {
  OrchestratorBridge,
  standardizedOrchestrator,
  OrchestratorBridgeOptions,
  TaskType,
  TaskExecutionOptions,
  TaskResult
};

// Export par défaut pour maintenir la compatibilité
export default OrchestratorBridge;
