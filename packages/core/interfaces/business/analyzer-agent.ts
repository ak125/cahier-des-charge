import { BusinessAgent } from './business-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface spécifique pour les agents d'analyse
 */
export interface AnalyzerAgent extends BusinessAgent {
    /**
     * Analyse des données selon des critères spécifiques
     * @param data Données à analyser
     * @param criteria Critères d'analyse
     */
    analyze(data: any, criteria: Record<string, any>): Promise<Record<string, any>>;

    /**
     * Génère un rapport d'analyse
     * @param analysisResult Résultat d'analyse
     * @param format Format du rapport
     */
    generateReport(analysisResult: Record<string, any>, format: string): Promise<string>;
}