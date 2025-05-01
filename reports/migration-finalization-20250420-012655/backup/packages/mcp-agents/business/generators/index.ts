/**
 * Point d'entrée pour tous les generators
 * Exporte tous les agents de génération disponibles
 */

// Exportation des generators
export * from './RemixGenerator';
export * from './NestjsGenerator';
export * from './PrismaGenerator';
export * from './ComponentGenerator';

// Nom des agents pour l'enregistrement
export const generatorsIds = [
  'RemixGenerator',
  'NestjsGenerator',
  'PrismaGenerator',
  'ComponentGenerator',
];
