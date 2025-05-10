/**
 * Abstract Orchestrator Agent
 *
 * Classe abstraite pour les agents orchestrateurs de la couche orchestration.
 * Étend la classe AbstractOrchestrationAgent et implémente l'interface OrchestratorAgent.
 */
import { OrchestratorAgent, AgentResult } from 'mcp-types';
import { AbstractOrchestrationAgent } from './abstract-orchestration-agent';
/**
 * Classe abstraite pour les agents orchestrateurs
 */
export declare abstract class AbstractOrchestratorAgent extends AbstractOrchestrationAgent implements OrchestratorAgent {
    /**
     * Map des séquences en cours d'exécution
     */
    protected sequenceMap: Map<string, {
        agents: string[];
        status: 'pending' | 'running' | 'completed' | 'failed';
        currentStep: number;
        results: Record<string, any>;
        startTime: string;
        lastUpdated: string;
    }>;
    /**
     * Constructeur de la classe AbstractOrchestratorAgent
     * @param id Identifiant unique de l'agent
     * @param name Nom descriptif de l'agent
     * @param version Version de l'agent
     * @param options Options de configuration de l'agent
     */
    constructor(id: string, name: string, version: string, options?: Record<string, any>);
    /**
     * Coordonne l'exécution d'une séquence d'agents
     * @param agents Liste des agents à exécuter
     * @param inputs Données d'entrée pour la séquence
     * @param options Options de l'orchestration
     */
    abstract executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;
    /**
     * Gère les erreurs et reprises lors de l'exécution d'un workflow
     * @param workflowId ID du workflow à récupérer
     * @param errorContext Contexte de l'erreur
     */
    abstract handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult>;
    /**
     * Démarre l'orchestration d'un workflow ou d'un processus
     * @param workflow Identifiant ou définition du workflow à orchestrer
     * @param context Contexte d'exécution incluant les paramètres nécessaires
     */
    orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>;
    /**
     * Charge la définition d'un workflow depuis son identifiant
     * @param workflowId L'identifiant du workflow
     * @returns La définition du workflow
     */
    protected abstract loadWorkflowDefinition(workflowId: string): Promise<object>;
    /**
     * Extrait la liste des agents à partir d'une définition de workflow
     * @param workflow La définition du workflow
     * @returns La liste des agents à exécuter
     */
    protected abstract extractAgentsFromWorkflow(workflow: object): Promise<string[]>;
    /**
     * Génère un ID unique pour une séquence
     * @returns Un identifiant unique pour la séquence
     */
    protected generateSequenceId(): string;
    /**
     * Récupère l'état d'une séquence en cours d'exécution
     * @param sequenceId L'identifiant de la séquence
     * @returns L'état de la séquence ou null si non trouvée
     */
    protected getSequenceStatus(sequenceId: string): {
        agents: string[];
        status: string;
        currentStep: number;
        results: Record<string, any>;
    } | null;
    /**
     * Nettoie les séquences terminées ou échouées ayant dépassé un âge donné
     * @param maxAgeMs Âge maximum en millisecondes (par défaut: 1 heure)
     */
    protected cleanupOldSequences(maxAgeMs?: number): void;
}
//# sourceMappingURL=abstract-orchestrator-agent.d.ts.map