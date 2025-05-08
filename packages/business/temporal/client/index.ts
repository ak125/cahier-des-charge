/**
 * Export de l'orchestrateur Temporal standardisé
 * Ce fichier permet d'exposer l'interface principale de l'orchestrateur Temporal
 */

import { TemporalOrchestrator } from './temporal-orchestrator';

// Export de la classe pour les cas où une personnalisation est nécessaire
export { TemporalOrchestrator };

// Export d'une instance singleton avec configuration par défaut
export const temporal = new TemporalOrchestrator();

// Export par défaut pour faciliter l'importation
export default temporal;