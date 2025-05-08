import { CoordinationAgent } from './CoordinationAgent';

/**
 * Interface pour l'agent de registre qui gère l'enregistrement et la découverte des agents
 * Cette interface étend CoordinationAgent car le registre est responsable de la coordination
 * entre différents agents du système
 */
export interface RegistryAgent extends CoordinationAgent {
    /**
     * Enregistre un nouvel agent dans le registre
     * @param agentId Identifiant de l'agent
     * @param metadata Métadonnées associées à l'agent
     * @returns Identifiant d'enregistrement
     */
    register(agentId: string, metadata: Record<string, any>): Promise<string>;

    /**
     * Recherche des agents selon des critères spécifiques
     * @param criteria Critères de recherche
     * @returns Liste d'agents correspondant aux critères
     */
    discover(criteria: Record<string, any>): Promise<Record<string, any>[]>;

    /**
     * Désenregistre un agent du registre
     * @param registrationId Identifiant d'enregistrement
     * @returns true si l'opération a réussi, false sinon
     */
    unregister(registrationId: string): Promise<boolean>;

    /**
     * Récupère les informations d'un agent spécifique
     * @param agentId Identifiant de l'agent
     * @returns Métadonnées de l'agent
     */
    getAgentInfo(agentId: string): Promise<Record<string, any> | null>;
}