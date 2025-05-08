/**
 * @deprecated ORCHESTRATEUR PERSONNALISÉ OBSOLÈTE - À MIGRER
 * 
 * Cette classe d'agent d'orchestration de base fait partie des orchestrateurs personnalisés
 * qui doivent être migrés vers l'implémentation standardisée selon 
 * le document /docs/technologies-standards.md.
 * 
 * PLAN DE MIGRATION:
 * - Utiliser les classes de base standardisées de l'orchestrateur dans:
 *   /packages/business/temporal/ et /packages/business/queue/
 * 
 * Date de dépréciation: 4 mai 2025
 * Date prévue de suppression: Q1 2026
 * Contact: equipe-architecture@example.com
 */

/**
 * Agent de base pour la catégorie orchestration
 * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie
 */

import { BaseAgent } from '../core/base-agent';
import { OrchestrationAgentOptions, OrchestrationResult } from './types';

/**
 * Classe de base pour tous les agents orchestration
 */
export abstract class BaseOrchestrationAgent<
  TOptions extends OrchestrationAgentOptions = OrchestrationAgentOptions,
  TResult = any,
> extends BaseAgent<TOptions, TResult> {
  /**
   * Fonctions utilitaires spécifiques à la catégorie orchestration
   */

  /**
   * Méthode utilitaire spécifique à cette catégorie
   */
  protected async processOrchestrationTask(): Promise<void> {
    this.log('info', 'Traitement de tâche spécifique');
    // Logique spécifique à implémenter
  }
}
