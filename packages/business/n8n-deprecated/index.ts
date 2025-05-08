/**
 * Export de l'orchestrateur n8n (DÉPRÉCIÉ)
 * 
 * @deprecated Ce module est déprécié et sera progressivement remplacé par Temporal.io et BullMQ
 * selon le plan de migration décrit dans la documentation de standardisation.
 */

import { N8nOrchestrator } from './n8n-orchestrator';

// Log de dépréciation lors de l'import
console.warn(
    '╔═════════════════════════════ AVERTISSEMENT ═════════════════════════════╗\n' +
    '║ Le module n8n est DÉPRÉCIÉ et prévu pour être éliminé.                  ║\n' +
    '║ Veuillez utiliser Temporal.io pour les workflows complexes              ║\n' +
    '║ ou BullMQ pour les tâches simples selon le cas d\'usage.                 ║\n' +
    '║ Consultez la documentation pour le plan de migration.                   ║\n' +
    '╚════════════════════════════════════════════════════════════════════════╝'
);

// Export de la classe pour les cas où une personnalisation est nécessaire
export { N8nOrchestrator };

// Export d'une instance singleton avec configuration par défaut
export const n8n = new N8nOrchestrator();

// Export par défaut pour faciliter l'importation
export default n8n;