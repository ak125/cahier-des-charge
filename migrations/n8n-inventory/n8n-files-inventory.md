# Inventaire des Fichiers n8n

*Rapport généré le 2025-05-06*

## Vue d'ensemble

- **Nombre total de fichiers n8n**: 49
- **Catégories identifiées**: 8

| Catégorie | Nombre de fichiers |
|-----------|-------------------|
| migration | 15 |
| php-analysis | 5 |
| audit | 3 |
| unknown | 18 |
| pipeline | 3 |
| monitoring | 1 |
| database | 3 |
| seo | 1 |

## Catégorie: migration

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `manifests/n8n-migration-workflow.json` | unknown | - | 2025-05-05 |
| `migrations/n8n-migration-status.json` | unknown | - | 2025-05-05 |
| `packages/orchestration/orchestration/workflows/n8nmigration-orchestrator.json` | workflow | Migration Orchestrator Pipeline | 2025-05-01 |
| `packages/orchestration/orchestration/workflows/n8nmigration.json` | workflow | Migration Data Validator | 2025-05-01 |
| `packages/business/config/migration-workflown8n.json` | workflow | migration-workflown8n | 2025-05-04 |
| `packages/business/config/migration/n8n-mysql-migration.json` | workflow | Migration SQL complète - Pipeline | 2025-04-30 |
| `packages/business/config/migration/sql-analyzer-pipelinen8n.json` | workflow | SQL Analyzer IA Pipeline | 2025-05-01 |
| `packages/business/config/migration/migration-pipelinen8n.json` | workflow | migration-pipelinen8n | 2025-05-04 |
| `packages/business/config/migration-pipelinen8n.json` | workflow | migration-pipelinen8n | 2025-05-04 |
| `packages/business/workflows/migration/migration-plans-generatorn8n.json` | workflow | Generate Migration Plans Workflow | 2025-05-01 |
| `packages/business/workflows/migration/migration-pipelinen8n.json` | workflow | Pipeline de Migration Automatisée PHP → NestJS/Remix | 2025-05-01 |
| `packages/business/workflows/migration/n8npipeline.json` | workflow | Pipeline de Migration IA | 2025-05-01 |
| `packages/business/workflows/migration/sql-analyzer-prisma-buildern8n.json` | workflow | SQL Analyzer & Prisma Builder Workflow | 2025-05-01 |
| `tools/scripts/n8n-migration/inventory-n8n-files.js` | workflow | - | 2025-05-06 |
| `tools/scripts/scripts/migration/import-n8n-workflows.js` | script | - | 2025-04-30 |

## Catégorie: php-analysis

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `migrations/migration-toolkit/php-to-remix-migrationn8n.json` | workflow | Pipeline Migration Routes PHP vers Remix | 2025-05-01 |
| `backup/obsolete-files-20250505/packages/business/config/n8n-php-analyzer-webhook.json` | workflow | PHP Analyzer - Alertes de complexité | 2025-05-05 |
| `backup/obsolete-files-20250505/packages/business/config/php-analyzer-pipelinen8n.json` | workflow | PHP Analyzer Pipeline | 2025-05-05 |
| `backup/obsolete-files-20250505/packages/business/config/n8n-php-complexity-alerts.json` | workflow | Alertes Complexité PHP Avancées | 2025-05-05 |
| `packages/business/config/n8n-php-routes-manager.json` | workflow | PHP Routes Migration Manager | 2025-04-30 |

## Catégorie: audit

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `backup/obsolete-files-20250505/packages/business/config/n8n-audit-analyzer-workflow.json` | workflow | n8n-audit-analyzer-workflow | 2025-05-05 |
| `backup/obsolete-files-20250505/packages/business/templates/n8n-audit-workflow.json` | workflow | PHP Audit Pipeline | 2025-05-05 |
| `packages/business/config/n8n-update-audit-node.json` | workflow | n8n-update-audit-node | 2025-05-04 |

## Catégorie: unknown

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `packages/orchestration/orchestration/workflows/n8nmonorepo-analyzer.json` | workflow | Monorepo Analyzer Pipeline | 2025-05-01 |
| `packages/orchestration/orchestration/workflows/n8ndiff-verifier.json` | workflow | Vérification PHP → NestJS/Remix | 2025-05-01 |
| `packages/mcp-agents/orchestration/cleanup/n8n.json` | workflow | Docker Cleanup Workflow | 2025-05-02 |
| `packages/business/config/supabase-analyzer-workflown8n.json` | workflow | Supabase Analyzer Workflow | 2025-05-01 |
| `packages/business/config/n8n-table-cartographer-workflow.json` | workflow | SQL Analyzer - Cartographe Sémantique des Tables | 2025-04-30 |
| `packages/business/config/bullmq-orchestratorn8n.json` | workflow | BullMQ Orchestrator Pipeline | 2025-05-01 |
| `packages/business/config/prisma-analyzer-workflown8n.json` | workflow | Prisma Analyzer Workflow | 2025-05-01 |
| `packages/business/config/n8n-htaccess-analyzer.json` | workflow | Analyse .htaccess pour SEO et Migration | 2025-04-30 |
| `packages/business/config/wave-runnern8n.json` | workflow | wave-runnern8n | 2025-05-04 |
| `packages/business/config/n8n-relation-analyzer-workflow.json` | workflow | SQL Analyzer - Analyse Relationnelle & Cohérence Référentielle | 2025-04-30 |
| `packages/business/config/htaccess-analyzer-workflown8n.json` | workflow | Htaccess Analyzer Workflow | 2025-05-01 |
| `packages/business/config/n8nremediator.json` | workflow | Auto-Remédiation des Divergences | 2025-05-01 |
| `packages/business/config/n8nqa-analyzer.json` | workflow | QA Analyzer Workflow | 2025-05-01 |
| `packages/business/config/mcp-workflown8n.json` | workflow | MCP Workflow Pipeline | 2025-05-01 |
| `tools/scripts/scripts/import-n8n-workflows.js` | script | - | 2025-04-30 |
| `packages/orchestration/legacy-orchestrators/n8n.ts` | unknown | - | 2025-05-03 |
| `packages/business/n8n-deprecated/n8n-orchestrator.ts` | unknown | - | 2025-05-04 |
| `packages/business/src/orchestration/n8n-client.ts` | unknown | - | 2025-05-04 |

## Catégorie: pipeline

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `packages/orchestration/orchestration/workflows/n8npipelineclean.json` | workflow | Pipeline de Migration IA | 2025-05-01 |
| `packages/business/config/cicd-pipeline-workflown8n.json` | workflow | CI/CD Pipeline Workflow | 2025-05-01 |
| `tools/scripts/scripts/automation/optimize-n8n-pipeline.js` | script | - | 2025-04-30 |

## Catégorie: monitoring

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `packages/orchestration/orchestration/workflows/n8nmonitoring.json` | workflow | - | 2025-05-01 |

## Catégorie: database

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `packages/business/config/n8n-mysql-analyzer.json` | workflow | n8n-mysql-analyzer | 2025-05-04 |
| `packages/business/config/postgres-analyzer-workflown8n.json` | workflow | PostgreSQL Analyzer Workflow | 2025-05-01 |
| `packages/business/config/mysql-analyzer-workflown8n.json` | workflow | MySQL Analyzer Workflow | 2025-05-01 |

## Catégorie: seo

| Fichier | Type | Description | Dernière modification |
|---------|------|-------------|----------------------|
| `packages/business/config/seo-analyzer-workflown8n.json` | workflow | SEO Analyzer Workflow | 2025-05-01 |

## Étapes suivantes

Selon le plan de migration n8n vers Temporal:

1. **Phase 1 (Mai 2025)**: Compléter l'audit et l'analyse de ces fichiers
2. **Phase 2 (Juin 2025)**: Classification et priorisation de la migration
3. **Phase 3 (Juillet 2025)**: Migrer les workflows non critiques
4. **Phase 4 (Août-Octobre 2025)**: Migration générale
5. **Phase 5 (Novembre 2025)**: Décommissionnement de n8n

Pour plus de détails, consultez le [Plan de migration n8n](/docs/n8n-migration-plan.md).
