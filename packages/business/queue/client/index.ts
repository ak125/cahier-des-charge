/**
 * Export de l'orchestrateur BullMQ standardisé
 * Ce fichier permet d'exposer l'interface principale de l'orchestrateur BullMQ
 */

import { BullMQOrchestrator } from './bullmq-orchestrator';

// Export de la classe pour les cas où une personnalisation est nécessaire
export { BullMQOrchestrator };

// Export d'une instance singleton avec configuration par défaut
export const bullmq = new BullMQOrchestrator();

// Export par défaut pour faciliter l'importation
export default bullmq;