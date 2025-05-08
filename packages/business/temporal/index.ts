/**
 * Module Temporal standardisé
 * 
 * Ce module implémente l'orchestration de workflows durables via Temporal.io,
 * conformément aux standards technologiques définis.
 */

// Export principal du client
export * from './client';

// Export des types spécifiques à Temporal
// Décommenter quand les types spécifiques seront implémentés
// export * from './types';

// Export des workflows prédéfinis
// Décommenter quand les workflows seront implémentés
// export * from './workflows';

// Export des activités prédéfinis
// Décommenter quand les activités seront implémentées 
// export * from './activities';

// Export par défaut du client temporal
import temporal from './client';
export default temporal;