/**
 * OrchestratorBridge - Pont de communication entre orchestrateurs
 * Version améliorée 2025-04-30
 */

import { EventEmitter } from 'events';
import { BaseAgent } from '../core/interfaces/base-agent';
import { OrchestrationAgent } from '../core/interfaces/orchestration-agent';
import { Notification, NotificationService, NotificationType } from './notification-service';

/**
 * Interface pour les options de configuration du bridge
 */
interface OrchestratorBridgeOptions {
  enableNotifications?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  autoReconnect?: boolean;
}

/**
 * Classe OrchestratorBridge - Implémente l'interface OrchestrationAgent
 */
export class OrchestratorBridge implements OrchestrationAgent {
  name = 'OrchestratorBridge';
  description = 'Bridge de communication entre orchestrateurs';
  version = '1.0.0';
  private ready = false;
  private agents: BaseAgent[] = [];
  private config: OrchestratorBridgeOptions = {
    enableNotifications: true,
    logLevel: 'info',
    autoReconnect: true,
  };
  private eventBus: EventEmitter = new EventEmitter();
  private notifier: NotificationService;

  constructor(options?: OrchestratorBridgeOptions) {
    if (options) {
      this.config = { ...this.config, ...options };
    }
    this.notifier = new NotificationService();
  }

  async initialize(options?: Record<string, any>): Promise<void> {
    console.log(`[${this.name}] Initialisation du bridge d'orchestration...`);
    if (options) {
      this.config = { ...this.config, ...options };
    }

    this.notifier.sendNotification({
      level: NotificationLevel.INFO,
      target: NotificationTarget.SYSTEM,
      message: `Bridge d'orchestration initialisé avec ${this.agents.length} agents`,
    });

    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  getMetadata(): Record<string, any> {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      agentCount: this.agents.length,
    };
  }

  async getSystemState(): Promise<Record<string, any>> {
    return {
      ready: this.ready,
      agents: this.agents.map((a) => a.name),
      config: this.config,
    };
  }

  async registerAgent(agent: BaseAgent): Promise<void> {
    console.log(`[${this.name}] Enregistrement de l'agent: ${agent.name}`);
    this.agents.push(agent);
    this.eventBus.emit('agent:registered', agent.name);
  }

  async orchestrate(workflow: string, input: any): Promise<any> {
    if (!this.ready) {
      throw new Error('Bridge not initialized');
    }

    console.log(`[${this.name}] Orchestration du workflow: ${workflow}`);

    // Implémentation de l'orchestration
    return {
      success: true,
      result: input,
      workflow,
    };
  }
}

export default OrchestratorBridge;
