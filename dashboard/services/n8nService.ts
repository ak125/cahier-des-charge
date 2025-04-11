import axios from 'axios';

// Configuration de base
const N8N_API_BASE_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Création d'une instance axios configurée
const n8nApiClient = axios.create({
  baseURL: N8N_API_BASE_URL,
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
  }
});

// Interface pour les workflows
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les exécutions de workflow
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  data?: any;
}

// Service pour les opérations liées à n8n
const n8nService = {
  // Récupérer tous les workflows
  getWorkflows: async (): Promise<Workflow[]> => {
    try {
      const response = await n8nApiClient.get('/workflows');
      return response.data.data.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des workflows:', error);
      throw error;
    }
  },

  // Récupérer un workflow spécifique par ID
  getWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await n8nApiClient.get(`/workflows/${id}`);
      const workflow = response.data;
      return {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du workflow ${id}:`, error);
      throw error;
    }
  },

  // Activer/désactiver un workflow
  toggleWorkflowActive: async (id: string, active: boolean): Promise<Workflow> => {
    try {
      const response = await n8nApiClient.patch(`/workflows/${id}`, {
        active
      });
      const workflow = response.data;
      return {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
    } catch (error) {
      console.error(`Erreur lors de la modification du statut du workflow ${id}:`, error);
      throw error;
    }
  },

  // Exécuter un workflow
  executeWorkflow: async (id: string, data?: any): Promise<WorkflowExecution> => {
    try {
      const response = await n8nApiClient.post(`/workflows/${id}/execute`, data || {});
      return {
        id: response.data.executionId,
        workflowId: id,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Erreur lors de l'exécution du workflow ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les exécutions d'un workflow
  getWorkflowExecutions: async (id: string): Promise<WorkflowExecution[]> => {
    try {
      const response = await n8nApiClient.get(`/executions?workflowId=${id}`);
      return response.data.data.map((execution: any) => ({
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        finishedAt: execution.finishedAt,
        data: execution.data
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des exécutions du workflow ${id}:`, error);
      throw error;
    }
  },

  // Récupérer une exécution spécifique
  getExecution: async (id: string): Promise<WorkflowExecution> => {
    try {
      const response = await n8nApiClient.get(`/executions/${id}`);
      const execution = response.data;
      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        finishedAt: execution.finishedAt,
        data: execution.data
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'exécution ${id}:`, error);
      throw error;
    }
  },

  // Interrompre une exécution en cours
  stopExecution: async (id: string): Promise<void> => {
    try {
      await n8nApiClient.post(`/executions/${id}/stop`);
    } catch (error) {
      console.error(`Erreur lors de l'arrêt de l'exécution ${id}:`, error);
      throw error;
    }
  }
};

export default n8nService;