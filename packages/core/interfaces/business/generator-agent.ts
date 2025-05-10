import { BusinessAgent } from './business-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface spécifique pour les agents générateurs
 */
export interface GeneratorAgent extends BusinessAgent {
    /**
     * Génère du contenu à partir d'une spécification
     * @param spec Spécification de génération
     * @param options Options de génération
     */
    generate(spec: Record<string, any>, options?: Record<string, any>): Promise<any>;

    /**
     * Vérifie si une spécification est valide pour la génération
     * @param spec Spécification à vérifier
     */
    validateSpec(spec: Record<string, any>): Promise<boolean>;
}