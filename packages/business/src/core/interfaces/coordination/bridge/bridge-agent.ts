/**
 * Pont d'intégration
 *
 * @deprecated Cette interface est déplacée vers mcp-types/src/layer-contracts.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter l'interface depuis le fichier centralisé
export { BridgeAgent } from 'mcp-types/src/layer-contracts';

// Types utilisés par l'interface pour la rétrocompatibilité
export type BridgeOptions = Record<string, any>;
export interface BridgeResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}

// Ces types sont maintenus pour la rétrocompatibilité
export interface SystemEndpoint {
  id: string;
  type: string;
  uri: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
}

export interface Connection {
  id: string;
  source: SystemEndpoint;
  target: SystemEndpoint;
  status: 'active' | 'inactive' | 'error';
  error?: string;
  metadata?: Record<string, any>;
}

export interface TransferResult {
  success: boolean;
  data?: any;
  error?: string;
  bytesTransferred?: number;
  itemsTransferred?: number;
  startTime: string;
  endTime: string;
  duration: number;
  metadata?: Record<string, any>;
}
