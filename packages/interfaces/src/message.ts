/**
 * Interfaces pour les messages
 */

export interface Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  destination: string;
}

export interface MessageHandler {
  handleMessage(message: Message): Promise<void>;
  canHandle(message: Message): boolean;
}
