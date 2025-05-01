import { agentErrors, measureExecutionTime, pipelineQueueSize } from './metrics';

// Exemple d'utilisation des métriques dans un agent
export class ExampleAgent {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Utilisation de la fonction de mesure du temps d'exécution
  async process(data: any): Promise<any> {
    return measureExecutionTime(this.name, async () => {
      // Simuler un traitement
      await this.doSomeWork(data);

      // Mettre à jour la taille de la file d'attente pour ce processus
      pipelineQueueSize.set({ queue_name: `${this.name}_queue` }, this.getQueueSize());

      return { result: 'success', processedData: data };
    });
  }

  // Méthode qui gère correctement les erreurs pour qu'elles soient comptabilisées
  async executeWithErrorHandling(data: any): Promise<any> {
    try {
      return await this.process(data);
    } catch (error) {
      // Les erreurs sont déjà comptabilisées par measureExecutionTime
      // Mais on peut ajouter des détails supplémentaires si nécessaire
      agentErrors.inc({
        agent_name: this.name,
        error_type: 'custom_error',
      });

      throw error;
    }
  }

  // Méthodes privées pour simulation
  private async doSomeWork(_data: any): Promise<void> {
    // Simuler un traitement qui prend du temps
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  private getQueueSize(): number {
    // Simuler une taille de file d'attente
    return Math.floor(Math.random() * 50);
  }
}
