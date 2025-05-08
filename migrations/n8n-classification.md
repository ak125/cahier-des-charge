# Rapport de Classification des Workflows n8n

*Rapport généré le 2025-05-06*

## Vue d'ensemble

- **Total des workflows**: 45
- **Effort total estimé**: 103 jours-personne
- **Durée estimée**: 21 semaines (103 jours)

## Répartition par complexité

| Complexité | Nombre | Pourcentage |
|------------|--------|------------|
| Simple | 15 | 33.3% |
| Modéré | 30 | 66.7% |
| Complexe | 0 | 0.0% |

## Répartition par criticité

| Criticité | Nombre | Pourcentage |
|-----------|--------|------------|
| Faible | 6 | 13.3% |
| Moyenne | 13 | 28.9% |
| Haute | 26 | 57.8% |

## Répartition par stratégie de migration

| Stratégie | Nombre | Pourcentage |
|-----------|--------|------------|
| BullMQ | 15 | 33.3% |
| Temporal | 30 | 66.7% |

## Répartition par priorité

| Priorité | Nombre | Pourcentage |
|----------|--------|------------|
| P1 | 21 | 46.7% |
| P2 | 18 | 40.0% |
| P3 | 6 | 13.3% |

## Liste des workflows par priorité

### Priorité P1 (Haute)

| Nom | Complexité | Criticité | Stratégie | Effort |
|-----|------------|-----------|-----------|--------|
| Alertes Complexité PHP Avancées | Modéré | Haute | Temporal | 3 j |
| BullMQ Orchestrator Pipeline | Modéré | Haute | Temporal | 3 j |
| CI/CD Pipeline Workflow | Modéré | Haute | Temporal | 3 j |
| Generate Migration Plans Workflow | Modéré | Haute | Temporal | 3 j |
| MCP Workflow Pipeline | Modéré | Haute | Temporal | 3 j |
| Migration Data Validator | Modéré | Haute | Temporal | 3 j |
| Migration Orchestrator Pipeline | Modéré | Haute | Temporal | 3 j |
| Migration SQL complète - Pipeline | Modéré | Haute | Temporal | 3 j |
| Monorepo Analyzer Pipeline | Modéré | Haute | Temporal | 3 j |
| MySQL Analyzer Workflow | Modéré | Haute | Temporal | 3 j |
| PHP Analyzer Pipeline | Modéré | Haute | Temporal | 3 j |
| PHP Analyzer - Alertes de complexité | Modéré | Haute | Temporal | 3 j |
| PHP Audit Pipeline | Modéré | Haute | Temporal | 3 j |
| PHP Routes Migration Manager | Modéré | Haute | Temporal | 3 j |
| Pipeline Migration Routes PHP vers Remix | Modéré | Haute | Temporal | 3 j |
| Pipeline de Migration Automatisée PHP → NestJS/Remix | Modéré | Haute | Temporal | 3 j |
| PostgreSQL Analyzer Workflow | Modéré | Haute | Temporal | 3 j |
| SQL Analyzer IA Pipeline | Modéré | Haute | Temporal | 3 j |
| SQL Analyzer - Analyse Relationnelle & Cohérence Référentielle | Modéré | Haute | Temporal | 3 j |
| SQL Analyzer - Cartographe Sémantique des Tables | Modéré | Haute | Temporal | 3 j |
| SQL Analyzer & Prisma Builder Workflow | Modéré | Haute | Temporal | 3 j |

### Priorité P2 (Moyenne)

| Nom | Complexité | Criticité | Stratégie | Effort |
|-----|------------|-----------|-----------|--------|
| Analyse .htaccess pour SEO et Migration | Simple | Haute | BullMQ | 1.5 j |
| Auto-Remédiation des Divergences | Modéré | Moyenne | Temporal | 2.5 j |
| Docker Cleanup Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| Htaccess Analyzer Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| Pipeline de Migration IA | Simple | Haute | BullMQ | 1.5 j |
| Pipeline de Migration IA | Simple | Haute | BullMQ | 1.5 j |
| Prisma Analyzer Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| QA Analyzer Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| SEO Analyzer Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| Supabase Analyzer Workflow | Modéré | Moyenne | Temporal | 2.5 j |
| Vérification PHP → NestJS/Remix | Modéré | Moyenne | Temporal | 2.5 j |
| migration-pipelinen8n | Simple | Haute | BullMQ | 1.5 j |
| migration-pipelinen8n | Simple | Haute | BullMQ | 1.5 j |
| migration-workflown8n | Simple | Moyenne | BullMQ | 1 j |
| migration-workflown8n | Simple | Moyenne | BullMQ | 1 j |
| n8n-mysql-analyzer | Simple | Moyenne | BullMQ | 1 j |
| n8n-mysql-analyzer | Simple | Moyenne | BullMQ | 1 j |
| unnamedworkflow | Modéré | Moyenne | Temporal | 2.5 j |

### Priorité P3 (Faible)

| Nom | Complexité | Criticité | Stratégie | Effort |
|-----|------------|-----------|-----------|--------|
| n8n-audit-analyzer-workflow | Simple | Faible | BullMQ | 1 j |
| n8n-audit-analyzer-workflow | Simple | Faible | BullMQ | 1 j |
| n8n-update-audit-node | Simple | Faible | BullMQ | 1 j |
| n8n-update-audit-node | Simple | Faible | BullMQ | 1 j |
| wave-runnern8n | Simple | Faible | BullMQ | 1 j |
| wave-runnern8n | Simple | Faible | BullMQ | 1 j |

## Étapes suivantes

Selon le plan de migration n8n vers Temporal:

1. **Phase 1 (Mai 2025)**: Compléter l'audit et l'analyse des workflows n8n
2. **Phase 2 (Juin 2025)**: Classification et priorisation de la migration
3. **Phase 3 (Juillet 2025)**: Migrer les workflows non critiques
4. **Phase 4 (Août-Octobre 2025)**: Migration générale
5. **Phase 5 (Novembre 2025)**: Décommissionnement de n8n

Pour plus de détails, consultez le [Plan de migration n8n](/docs/n8n-migration-plan.md).
