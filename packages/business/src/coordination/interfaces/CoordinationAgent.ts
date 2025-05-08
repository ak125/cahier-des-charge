import { BaseAgent } from './BaseAgent';

/**
 * Interface pour les agents de la couche de coordination
 * Ces agents sont responsables de la coordination entre différents composants du système
 */
export interface CoordinationAgent extends BaseAgent {
    /**
     * Coordonne les interactions entre différentes sources et cibles
     * @param sources Les identifiants des sources de données
     * @param targets Les identifiants des cibles
     * @param data Les données à coordonner
     * @returns Le résultat de la coordination
     */
    coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<Record<string, any>>;
}