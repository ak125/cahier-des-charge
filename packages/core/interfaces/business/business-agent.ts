import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de la couche business
 * Responsable de la logique métier et du traitement des données
 */
export interface BusinessAgent extends BaseAgent {
    /**
     * Exécute une opération métier
     * @param operation Opération à exécuter
     * @param context Contexte d'exécution
     */
    process(operation: string, context: Record<string, any>): Promise<AgentResult>;

    /**
     * Valide les données d'entrée selon les règles métier
     * @param data Données à valider
     * @param rules Règles de validation
     */
    validateBusinessRules?(data: any, rules: Record<string, any>): Promise<boolean>;
}