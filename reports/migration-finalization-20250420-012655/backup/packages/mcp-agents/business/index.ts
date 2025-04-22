/**
 * Point d'entrée principal pour tous les agents MCP
 * Ce fichier exporte tous les agents organisés par catégorie
 */

// Exportation de toutes les catégories d'agents
export * from './analyzers';
export * from './generators';
export * from './validators';
export * from './orchestrators';

// Regroupement des IDs pour l'enregistrement
import { analyzersIds } from './analyzers';
import { generatorsIds } from './generators';
import { validatorsIds } from './validators';
import { orchestratorsIds } from './orchestrators';

export const allAgentIds = {
  analyzers: analyzersIds,
  generators: generatorsIds,
  validators: validatorsIds,
  orchestrators: orchestratorsIds
};

// Exporter une fonction d'aide pour l'enregistrement de tous les agents
export function getAllAgentIds(): string[] {
  return [
    ...analyzersIds,
    ...generatorsIds,
    ...validatorsIds,
    ...orchestratorsIds
  ];
}