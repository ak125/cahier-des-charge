import { BusinessAgent } from './business-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface spécifique pour les agents d'analyse syntaxique
 */
export interface ParserAgent extends BusinessAgent {
    /**
     * Analyse syntaxiquement des données
     * @param input Données à analyser syntaxiquement
     * @param options Options d'analyse syntaxique
     */
    parse(input: any, options?: Record<string, any>): Promise<any>;

    /**
     * Convertit des données d'un format à un autre
     * @param data Données à convertir
     * @param sourceFormat Format source
     * @param targetFormat Format cible
     */
    convert(data: any, sourceFormat: string, targetFormat: string): Promise<any>;
}