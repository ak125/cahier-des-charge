/**
 * Adaptateur pour services externes
 *
 * @deprecated Cette interface est déplacée vers mcp-types/src/layer-contracts.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter l'interface depuis le fichier centralisé
export { AdapterAgent } from 'mcp-types/src/layer-contracts';

// Types utilisés par l'interface pour la rétrocompatibilité
export type AdapterOptions = Record<string, any>;
export interface AdapterResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}
