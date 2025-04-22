/**
 * Point d'entrée pour tous les validators
 * Exporte tous les agents de validation disponibles
 */

// Exportation des validators
export * from './SeoChecker';
export * from './CanonicalValidator';

// Nom des agents pour l'enregistrement
export const validatorsIds = [
  'SeoChecker',
  'CanonicalValidator'
];