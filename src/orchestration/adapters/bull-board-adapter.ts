/**
 * Adaptateur pour Bull Board qui fonctionne avec l'orchestrateur standardisé
 *
 * Cet adaptateur permet à Bull Board de fonctionner avec notre orchestrateur standardisé
 * sans dépendance directe à BullMQ.
 */

import { QueueAdapter } from '@bull-board/api/queueAdapter';
import { unifiedOrchestrator } from '../unified-orchestrator';

/**
 * Adaptateur qui permet à Bull Board d'afficher les files d'attente de l'orchestrateur standardisé
 */
export class StandardizedOrchestratorAdapter implements QueueAdapter {
  private readonly queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  /**
   * Récupération de l'instance de la queue
   */
  async getQueue() {
    // Accéder directement à la Queue BullMQ sous-jacente dans l'unifiedOrchestrator
    // Ceci est une exception à notre règle d'abstraction, mais nécessaire pour permettre
    // au tableau de bord de fonctionner
    if (unifiedOrchestrator.getUnderlyingQueue) {
      return unifiedOrchestrator.getUnderlyingQueue(this.queueName);
    }

    throw new Error(
      `Méthode getUnderlyingQueue manquante dans unifiedOrchestrator pour ${this.queueName}`
    );
  }

  /**
   * Récupérer le nom de la queue
   */
  getName() {
    return this.queueName;
  }

  /**
   * Vérifier si c'est une queue BullMQ
   */
  isBullMQ = true;

  /**
   * Méthodes non utilisées par Bull Board mais nécessaires pour l'interface
   */
  clean() {
    return Promise.resolve();
  }

  isEmpty() {
    return Promise.resolve(false);
  }

  isPaused() {
    return Promise.resolve(false);
  }

  pause() {
    return Promise.resolve();
  }

  resume() {
    return Promise.resolve();
  }
}
