/**
 * Point d'entrée pour tous les analyzers
 * Exporte tous les agents d'analyse disponibles
 */

// Exportation des analyzers
export * from './PhpAnalyzer';
export * from './MysqlAnalyzer';
export * from './SqlAnalyzer';
export * from './HtaccessRouterAnalyzer';
export * from './QaAnalyzer';

// Nom des agents pour l'enregistrement
export const analyzersIds = [
  'PhpAnalyzer',
  'MysqlAnalyzer',
  'SqlAnalyzer',
  'HtaccessRouterAnalyzer',
  'QaAnalyzer',
];
