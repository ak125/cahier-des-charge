import { BusinessAgent } from './business-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface spécifique pour les agents validateurs
 */
export interface ValidatorAgent extends BusinessAgent {
    /**
     * Valide des données selon un schéma ou des règles
     * @param data Données à valider
     * @param schema Schéma de validation ou règles
     */
    validate(data: any, schema: any): Promise<{
        valid: boolean;
        errors?: Array<Record<string, any>>;
    }>;

    /**
     * Nettoie et normalise des données
     * @param data Données à normaliser
     */
    normalize(data: any): Promise<any>;
}