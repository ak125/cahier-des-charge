/**
 * Définitions de types pour les agents MCP
 * @version 1.0.0
 * @date 2025-04-19
 */

declare module '@workspaces/cahier-des-charge/src/core/interfaces/base-agent' {
  import { EventEmitter } from './eventsstructure-agent';

  export type AgentStatus = 'ready' | 'busy' | 'error' | 'stopped';

  export interface AgentContext {
    jobId: string;
    [key: string]: any;
  }

  export interface AgentMetadata {
    id: string;
    type: string;
    name: string;
    version: string;
    description?: string;
  }

  export interface AgentResult {
    success: boolean;
    data?: any;
    error?: Error;
    metrics: {
      startTime: number;
      endTime: number;
      duration: number;
    };
  }

  export enum AgentEvent {
    STARTED = 'started',
    COMPLETED = 'completed',
    FAILED = 'failed',
    STATUS_CHANGED = 'statusChanged',
    PROGRESS = 'progress',
  }

  export interface BaseAgent {
    readonly metadata: AgentMetadata;
    status: AgentStatus;
    readonly events: EventEmitter;

    initialize(): Promise<void>;
    execute(context: AgentContext): Promise<AgentResult>;
    validate(context: AgentContext): Promise<boolean>;
    stop(): Promise<void>;
    getStatus(): Promise<{ status: AgentStatus; details?: any }>;
  }

  export default BaseAgent;
}
