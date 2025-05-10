/**
 * Types pour la couche Coordination
 */

export interface AdapterConfig {
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  protocol?: string;
  timeout?: number;
}

export interface Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  destination: string;
}

export interface AdapterResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}
