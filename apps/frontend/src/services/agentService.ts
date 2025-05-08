import { AgentFormData } from '../components/AgentForm/schemas';
import { validateData } from '../lib/validation';
import { Agent, AgentApiSchemas } from '../../../mcp-server/src/schemas/agent-schemas';

/**
 * Service pour la gestion des agents
 * Utilise TypeBox pour valider les données
 */
export class AgentService {
    private readonly baseUrl: string;

    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Récupère la liste des agents
     */
    async getAgents(): Promise<Agent[]> {
        const response = await fetch(`${this.baseUrl}/agents/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des agents: ${response.statusText}`);
        }

        const data = await response.json();

        // Valider la réponse avec le schéma TypeBox
        const validationResult = validateData<{
            success: boolean;
            data: {
                items: Agent[];
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
            }
        }>(AgentApiSchemas.collectionResponse, data);

        if (!validationResult.isValid) {
            console.error('Réponse API invalide:', validationResult.errors);
            throw new Error('Format de réponse API invalide');
        }

        return validationResult.data?.data.items || [];
    }

    /**
     * Crée un nouvel agent
     */
    async createAgent(agent: AgentFormData): Promise<Agent> {
        // Conversion des données du formulaire vers le format API
        const apiData = {
            name: agent.name,
            description: agent.description,
            version: agent.version,
            type: agent.type as 'analyzer' | 'generator' | 'transformer' | 'validator',
            status: agent.isActive ? 'active' : 'inactive',
            configuration: agent.configuration || {},
            capabilities: agent.capabilities,
            executionCount: 0
        };

        // Valider les données à envoyer avec TypeBox
        const validationResult = validateData(AgentApiSchemas.createRequest, apiData);

        if (!validationResult.isValid) {
            console.error('Données invalides:', validationResult.errors);
            throw new Error('Données invalides pour la création d\'agent');
        }

        const response = await fetch(`${this.baseUrl}/agents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                `Erreur lors de la création de l'agent: ${response.statusText}`
            );
        }

        return response.json().then(data => data.data);
    }

    /**
     * Execute un agent 
     */
    async executeAgent(agentId: string, input: Record<string, unknown>): Promise<any> {
        // Valider les données d'entrée avec TypeBox
        const requestData = {
            agentId,
            input,
            options: {
                synchronous: true
            }
        };

        const response = await fetch(`${this.baseUrl}/agents/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                `Erreur lors de l'exécution de l'agent: ${response.statusText}`
            );
        }

        return response.json();
    }
}

// Exporter une instance par défaut du service
export const agentService = new AgentService();