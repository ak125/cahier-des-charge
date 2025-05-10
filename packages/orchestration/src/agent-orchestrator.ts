/**
 * @deprecated ORCHESTRATEUR PERSONNALISÉ OBSOLÈTE - À MIGRER
 * 
 * Cet orchestrateur d'agents fait partie des orchestrateurs personnalisés qui doivent être migrés
 * vers l'implémentation standardisée selon le document /docs/technologies-standards.md.
 * 
 * PLAN DE MIGRATION:
 * - Pour l'orchestration des agents: Migrer vers Temporal.io (/packages/business/temporal/)
 *   en utilisant les workflows et activités standardisés.
 * 
 * Date de dépréciation: 4 mai 2025
 * Date prévue de suppression: Q1 2026
 * Contact: equipe-architecture@example.com
 */

/**
 * AgentOrchestrator
 * Agent export file
 */

import { AgentOrchestrator } from './agent-orchestrator';

export { AgentOrchestrator };
export default AgentOrchestrator;
