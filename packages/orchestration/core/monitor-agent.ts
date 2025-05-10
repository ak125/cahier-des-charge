import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de surveillance dans la couche d'orchestration
 * Responsable de la surveillance des workflows et processus
 */
export interface MonitorAgent extends BaseAgent {
  /**
   * Surveille l'exécution des cibles spécifiées
   * @param targets Liste des identifiants de workflows ou processus à surveiller
   */
  monitorExecution(targets: string[]): Promise<void>;

  /**
   * Génère un rapport à partir des résultats d'analyse
   * @param analysisResult Résultat de l'analyse à formater
   * @param format Format du rapport souhaité (html, markdown, json)
   */
  generateReport(analysisResult: Record<string, any>, format: string): Promise<string>;
}