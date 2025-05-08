/**
 * Module d'orchestration consolidé
 * Ce fichier est le point d'entrée principal pour toutes les fonctionnalités d'orchestration
 * 
 * @deprecated Ce module est maintenu pour la compatibilité mais redirige désormais
 * vers la nouvelle implémentation standardisée dans /packages/business/.
 */

// Afficher un avertissement lors de l'importation
console.warn(
    '⚠️ Vous utilisez le module d\'orchestration déprécié dans /packages/orchestration/. ' +
    'Veuillez mettre à jour vos imports pour utiliser la version standardisée depuis /packages/business/ à la place.'
);

// Rediriger vers la nouvelle implémentation standardisée
export {
    standardizedOrchestrator,
    StandardizedOrchestrator,
    StandardizedOrchestratorOptions as OrchestratorBridgeOptions,
    orchestratorBridge as OrchestratorBridge,
    TaskDescription as TaskType,
    ComplexWorkflowOptions as TaskExecutionOptions,
    TaskStatus as TaskResult
} from '../business';

// Export par défaut pour une utilisation simplifiée
export { standardizedOrchestrator as default } from '../business';

// Note de dépréciation: Les adaptateurs spécifiques ne sont plus exposés ici
// mais sont disponibles directement depuis les sous-modules de /packages/business/