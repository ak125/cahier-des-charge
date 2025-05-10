/**
 * @deprecated ORCHESTRATEUR PERSONNALISÉ OBSOLÈTE - À MIGRER
 * 
 * Cet orchestrateur de migration fait partie des orchestrateurs personnalisés qui doivent être migrés
 * vers l'implémentation standardisée selon le document /docs/technologies-standards.md.
 * 
 * PLAN DE MIGRATION:
 * - Pour les workflows de migration complexes: Migrer vers Temporal.io (/packages/business/temporal/)
 *   en utilisant la persistance d'état et la gestion d'erreurs avancée.
 * 
 * Date de dépréciation: 4 mai 2025
 * Date prévue de suppression: Q1 2026
 * Contact: equipe-architecture@example.com
 */

/**
 * MigrationOrchestrator
 * Agent export file
 */

import { MigrationOrchestrator } from './migration-orchestrator';

export { MigrationOrchestrator };
export default MigrationOrchestrator;
