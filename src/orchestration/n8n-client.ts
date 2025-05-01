/**
 * Client n8n pour les intégrations externes
 *
 * Ce module fournit une interface pour déclencher et interagir avec les workflows n8n.
 * Utilisé exclusivement pour les intégrations externes comme recommandé :
 * - CI/CD
 * - Webhooks externes
 * - Intégrations tierces
 */

import axios from 'axios';

interface N8nTriggerOptions {
  workflowId: string;
  payload: Record<string, any>;
  webhookUrl?: string;
  credentials?: Record<string, any>;
}

interface N8nWorkflowStatus {
  id: string;
  name?: string;
  status: string;
  startedAt: string;
  lastUpdated: string;
  finishedAt?: string;
}

class N8nClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
  }

  /**
   * Déclenche un workflow n8n via son webhook ou API
   */
  async triggerWorkflow(options: N8nTriggerOptions): Promise<string> {
    const { workflowId, payload, webhookUrl, credentials } = options;

    try {
      // Si un webhook est fourni, l'utiliser directement
      if (webhookUrl) {
        const response = await axios.post(webhookUrl, payload);
        return response.data?.executionId || `n8n-${workflowId}-${Date.now()}`;
      }

      // Sinon utiliser l'API n8n
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-N8N-API-KEY'] = this.apiKey;
      }

      // Ajouter les identifiants si fournis
      const requestPayload = credentials ? { ...payload, credentials } : payload;

      const response = await axios.post(
        `${this.baseUrl}/api/v1/workflows/${workflowId}/trigger`,
        requestPayload,
        { headers }
      );

      return response.data?.executionId || `n8n-${workflowId}-${Date.now()}`;
    } catch (error) {
      console.error(`Erreur lors du déclenchement du workflow n8n ${workflowId}:`, error);
      throw new Error(
        `Échec du déclenchement de l'intégration externe: ${(error as Error).message}`
      );
    }
  }

  /**
   * Récupère le statut d'un workflow n8n
   */
  async getWorkflowStatus(executionId: string): Promise<N8nWorkflowStatus> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-N8N-API-KEY'] = this.apiKey;
      }

      const response = await axios.get(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers,
      });

      const data = response.data;

      return {
        id: executionId,
        name: data.workflowName || data.workflow?.name,
        status: data.status,
        startedAt: data.startedAt,
        lastUpdated: data.stoppedAt || data.startedAt,
        finishedAt: data.stoppedAt || undefined,
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut du workflow ${executionId}:`, error);
      throw new Error(
        `Échec de la récupération du statut de l'intégration: ${(error as Error).message}`
      );
    }
  }

  /**
   * Arrête l'exécution d'un workflow n8n
   */
  async stopWorkflow(executionId: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-N8N-API-KEY'] = this.apiKey;
      }

      await axios.post(`${this.baseUrl}/api/v1/executions/${executionId}/stop`, {}, { headers });

      return true;
    } catch (error) {
      console.error(`Erreur lors de l'arrêt du workflow ${executionId}:`, error);
      return false;
    }
  }
}

// Exporter un singleton pour une utilisation cohérente
export const n8nClient = new N8nClient();
