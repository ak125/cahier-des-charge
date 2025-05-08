/**
 * Module BullMQ standardisé
 * 
 * Ce module implémente l'orchestration de tâches simples via BullMQ,
 * conformément aux standards technologiques définis.
 */

// Export principal du client
export * from './client';

// Export des types spécifiques à BullMQ
// Décommenter quand les types spécifiques seront implémentés
// export * from './types';

// Export des processeurs prédéfinis
// Décommenter quand les processeurs seront implémentés
// export * from './processors';

// Export par défaut du client BullMQ
import bullmq from './client';
export default bullmq;