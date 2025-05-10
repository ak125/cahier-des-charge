/**
 * Adaptateur de base pour la couche Coordination
 */
import { AdapterConfig, Message, AdapterResult } from '../types';

export class BaseAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  async send(message: Message): Promise<AdapterResult> {
    // Implémentation de base
    return {
      success: true,
      messageId: message.id
    };
  }

  async receive(): Promise<Message | null> {
    // Implémentation de base
    return null;
  }
}
