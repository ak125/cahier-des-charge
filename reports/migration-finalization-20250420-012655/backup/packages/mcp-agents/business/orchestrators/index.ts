/**
 * Point d'entrée pour tous les orchestrators
 * Exporte tous les agents d'orchestration disponibles
 */

// Exportation des orchestrators
export * from './CoordinatorAgent';
export * from './SelectorAgent';
export * from './BullmqOrchestrator';
export * from '.DotMcpIntegrator';

// Nom des agents pour l'enregistrement
export const orchestratorsIds = [
  'CoordinatorAgent',
  'SelectorAgent', 
  'BullmqOrchestrator',
  DotMcpIntegrator'
];