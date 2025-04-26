/**
 * Types de base pour les agents
 * Ce fichier définit les interfaces communes utilisées par tous les agents
 */

export interface AgentOptions {
  debug?: boolean;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
  timestamp: number;
  duration?: number;
}

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

export type AgentEventListener = (event: string, data?: any) => void;
