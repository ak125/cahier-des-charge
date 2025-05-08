/**
 * Médiateur entre agents
 *
 * @deprecated Cette interface est déplacée vers mcp-types/src/layer-contracts.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter l'interface depuis le fichier centralisé
export { MediatorAgent } from 'mcp-types/src/layer-contracts';

// Types utilisés par l'interface pour la rétrocompatibilité
export type MediatorOptions = Record<string, any>;
export interface MediatorResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}

// Type Agent pour la rétrocompatibilité
export interface Agent {
  id: string;
  name: string;
  type: string;
  version: string;
  capabilities?: string[];
  status?: 'active' | 'inactive' | 'busy';
  metadata?: Record<string, any>;
}
