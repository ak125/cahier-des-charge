/**
 * Agent de base
 * Classe abstraite fournissant les fonctionnalités communes à tous les agents
 */

import { AgentOptions, AgentResult, AgentStatus, LogEntry, AgentEventListener } from '../orchestration/types.ts';

export abstract class BaseAgent<TOptions extends AgentOptions = AgentOptions, TResult = any> {
  protected options: TOptions;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected logs: LogEntry[] = [];
  protected listeners: Map<string, AgentEventListener[]> = new Map();
  protected startTime: number = 0;

  constructor(options?: Partial<TOptions>) {
    this.options = {
      debug: false,
      timeout: 30000,
      retries: 3,
      ...options,
    } as TOptions;
  }

  /**
   * Exécute l'agent avec les options spécifiées
   * @param additionalOptions Options supplémentaires pour cette exécution
   * @returns Résultat de l'exécution
   */
  async execute(additionalOptions?: Partial<TOptions>): Promise<AgentResult<TResult>> {
    try {
      this.startTime = Date.now();
      this.status = AgentStatus.RUNNING;
      this.emit('start', { options: this.options });

      const mergedOptions = { ...this.options, ...additionalOptions } as TOptions;
      const result = await this.run(mergedOptions);

      this.status = AgentStatus.COMPLETED;
      const duration = Date.now() - this.startTime;
      this.emit('complete', { result, duration });

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      this.status = AgentStatus.FAILED;
      const duration = Date.now() - this.startTime;
      this.log('error', error instanceof Error ? error.message : String(error));
      this.emit('error', { error, duration });

      return {
        success: false,
        error: error instanceof Error ? error : String(error),
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Méthode abstraite à implémenter par les classes dérivées
   * @param options Options d'exécution
   */
  protected abstract run(options: TOptions): Promise<TResult>;

  /**
   * Ajoute une entrée de journal
   * @param level Niveau de log
   * @param message Message à journaliser
   * @param data Données optionnelles
   */
  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    if (level === 'debug' && !this.options.debug) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    this.logs.push(entry);
    this.emit('log', entry);
  }

  /**
   * Renvoie tous les logs de l'agent
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Renvoie le statut actuel de l'agent
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Ajoute un écouteur d'événement
   * @param event Nom de l'événement
   * @param listener Fonction de rappel
   */
  on(event: string, listener: AgentEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * Retire un écouteur d'événement
   * @param event Nom de l'événement
   * @param listener Fonction de rappel à retirer
   */
  off(event: string, listener: AgentEventListener): void {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event)!;
    this.listeners.set(
      event,
      listeners.filter((l) => l !== listener)
    );
  }

  /**
   * Émet un événement
   * @param event Nom de l'événement
   * @param data Données associées à l'événement
   */
  protected emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;

    for (const listener of this.listeners.get(event)!) {
      try {
        listener(event, data);
      } catch (error) {
        console.error(, error);
      }
    }
  }
}
