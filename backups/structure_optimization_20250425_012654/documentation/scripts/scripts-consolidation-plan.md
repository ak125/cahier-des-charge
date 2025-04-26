# Plan de Consolidation des Scripts

Document généré le Fri Apr 25 00:37:55 UTC 2025

## Nouvelle structure proposée

│   ├── plans/           # Génération de plans de migration
│   ├── execution/       # Exécution des migrations
│   ├── analysis/        # Analyse avant/après migration
│   └── verification/    # Vérification post-migration
├── cicd/                # Scripts CI/CD
│   ├── tests/           # Tests automatisés
│   ├── deployment/      # Scripts de déploiement
│   └── pipelines/       # Configuration des pipelines
├── verification/        # Scripts de vérification
│   ├── quality/         # Vérification de qualité
│   ├── consistency/     # Vérification de cohérence
│   └── structure/       # Vérification de structure
├── agents/              # Scripts liés aux agents
│   ├── core/            # Agents principaux
│   ├── audit/           # Agents d'audit
│   ├── validation/      # Agents de validation
│   ├── orchestration/   # Agents d'orchestration
│   └── monitoring/      # Agents de surveillance
├── monitoring/          # Scripts de monitoring
├── setup/               # Scripts d'installation
├── maintenance/         # Scripts de maintenance
├── generation/          # Scripts de génération
├── dashboards/          # Scripts des tableaux de bord
├── workflows/           # Scripts des workflows
└── utils/               # Scripts utilitaires

## Plan de migration des scripts

### Migration des scripts de migration

| Script source | Destination | Action |
|--------------|-------------|--------|
| `batch-generate-migration-plans.sh` | migration/plans/ | Copier |
| `verify-complete-migration.sh` | migration/verification/ | Copier |
| `deploy-migration-orchestrator.sh` | migration/execution/ | Copier |
| `find-unmigrated-agents.sh` | migration/execution/ | Copier |
| `fix-migration-errors.sh` | migration/execution/ | Copier |
| `generate_migration_plan.ts` | migration/plans/ | Copier |
| `init-mysql-migration-pipeline.sh` | migration/execution/ | Copier |
| `manual-migration-templates.ts` | migration/execution/ | Copier |
| `migrate-agent.js` | migration/execution/ | Copier |
| `migrate-agents.sh` | migration/execution/ | Copier |
| `migrate-to-bullmq.sh` | migration/execution/ | Copier |
| `migration` | migration/execution/ | Copier |
| `migration-watcher.js` | migration/execution/ | Copier |
| `batch-generate-migration-plans.sh` | migration/plans/ | Copier |
| `fallback-migration.sql` | migration/execution/ | Copier |
| `generate-migration-plan.ts` | migration/plans/ | Copier |
| `migration-orchestrator.ts` | migration/execution/ | Copier |
| `next-migration-steps.sh` | migration/execution/ | Copier |
| `php-to-remix-migration.sh` | migration/execution/ | Copier |
| `run-migration.sh` | migration/execution/ | Copier |
| `run-progressive-migration.sh` | migration/execution/ | Copier |
| `migration` | migration/execution/ | Copier |
| `run-progressive-migration.ts` | migration/execution/ | Copier |
| `start_data_migration.sh` | migration/execution/ | Copier |
| `start_migration.sh` | migration/execution/ | Copier |
| `sync-migration-dashboard.ts` | migration/execution/ | Copier |
| `sync-migration-status.ts` | migration/execution/ | Copier |
| `validate-navicat-migration.sh` | migration/execution/ | Copier |
| `verify-migration.ts` | migration/verification/ | Copier |

### Migration des scripts CI/CD

| Script source | Destination | Action |
|--------------|-------------|--------|
| `ci-validate.sh` | cicd/pipelines/ | Copier |
| `run-agent-tests.sh` | cicd/tests/ | Copier |
| `run-agents-adapted-tests.sh` | cicd/tests/ | Copier |
| `run-agents-smart-tests.sh` | cicd/tests/ | Copier |
| `test-all-agents.sh` | cicd/tests/ | Copier |
| `test-htaccess-router.js` | cicd/tests/ | Copier |
| `test-htaccess-router.ts` | cicd/tests/ | Copier |
| `test-qa-analyzer-simple.ts` | cicd/tests/ | Copier |
| `test-qa-analyzer.ts` | cicd/tests/ | Copier |
| `test-redirections.sh` | cicd/tests/ | Copier |
| `verify-agent-count.sh` | cicd/pipelines/ | Copier |
| `verify-complete-migration.sh` | cicd/pipelines/ | Copier |
| `tests` | cicd/tests/ | Copier |

### Migration des scripts de vérification

| Script source | Destination | Action |
|--------------|-------------|--------|
| `cahier-des-charges-verifier.ts` | verification/ | Copier |
| `check-desync-alerts.js` | verification/ | Copier |
| `check-mismatches.js` | verification/ | Copier |
| `check-tech-obsolescence.js` | verification/ | Copier |
| `ci-validate.sh` | verification/ | Copier |
| `verify-agent-count.sh` | verification/ | Copier |
| `verify-complete-migration.sh` | verification/ | Copier |
| `validation` | verification/ | Copier |
| `verification` | verification/ | Copier |
| `verification` | verification/ | Copier |
| `post-generate-verification.ts` | verification/ | Copier |
| `verify-reorganization.sh` | verification/ | Copier |
| `run-complete-check.sh` | verification/ | Copier |
| `run-quality-checks.js` | verification/quality/ | Copier |
| `validate-all-agents.sh` | verification/ | Copier |
| `validate-interface-implementations.ts` | verification/ | Copier |
| `validate-navicat-migration.sh` | verification/ | Copier |
| `validation` | verification/ | Copier |
| `schema-validator.ts` | verification/ | Copier |
| `verification` | verification/ | Copier |
| `check-consistency.sh` | verification/consistency/ | Copier |
| `verify-cahier.sh` | verification/ | Copier |
| `verify-checklist.sh` | verification/ | Copier |
| `verify-integrity.sh` | verification/ | Copier |
| `verify-reliability.sh` | verification/ | Copier |
| `verify-reorganization.sh` | verification/ | Copier |
| `verifiers` | verification/ | Copier |
| `consistency-verifier.ts` | verification/consistency/ | Copier |
| `logic-verifier.ts` | verification/ | Copier |
| `run-complete-check.sh` | verification/ | Copier |
| `structure-verifier.ts` | verification/structure/ | Copier |
| `syntax-verifier.ts` | verification/ | Copier |
| `verify-cahier.sh` | verification/ | Copier |
| `verify-cahier.ts` | verification/ | Copier |
| `verify-cahier.sh` | verification/ | Copier |
| `verify-cahier.ts` | verification/ | Copier |
| `verify-mcp-imports.ts` | verification/ | Copier |
| `verify-migration.ts` | verification/ | Copier |

### Migration des scripts d'agents

| Script source | Destination | Action |
|--------------|-------------|--------|
| `agent-consolidation.sh` | agents/core/ | Copier |
| `agent-status.js` | agents/core/ | Copier |
| `sync-mcp-agents.sh` | agents/core/ | Copier |
| `run-agent-tests.sh` | agents/core/ | Copier |
| `run-agents-adapted-tests.sh` | agents/core/ | Copier |
| `run-agents-smart-tests.sh` | agents/core/ | Copier |
| `test-all-agents.sh` | agents/core/ | Copier |
| `verify-agent-count.sh` | agents/validation/ | Copier |
| `clean-mcp-agents.sh` | agents/core/ | Copier |
| `find-unmigrated-agents.sh` | agents/core/ | Copier |
| `generate-agent-configs.js` | agents/core/ | Copier |
| `generate-agents-docs.sh` | agents/core/ | Copier |
| `fix-agents.sh` | agents/core/ | Copier |
| `run-agent.sh` | agents/core/ | Copier |
| `migrate-agent.js` | agents/core/ | Copier |
| `migrate-agents.sh` | agents/core/ | Copier |
| `import-agents.js` | agents/core/ | Copier |
| `agents` | agents/core/ | Copier |
| `fix-agent-imports.sh` | agents/core/ | Copier |
| `standardize-agent-names.sh` | agents/core/ | Copier |
| `start-status-agent.sh` | agents/core/ | Copier |
| `recover-lost-agents.sh` | agents/core/ | Copier |
| `unified-agents.sh` | agents/core/ | Copier |
| `unify-agents.sh` | agents/core/ | Copier |
| `update-agent-imports.sh` | agents/core/ | Copier |
| `validate-all-agents.sh` | agents/validation/ | Copier |
| `fix-agent-imports.sh` | agents/core/ | Copier |

### Autres scripts

#### Scripts de monitoring:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `monitor-missed-routes.js` | monitoring/ | Copier |
| `monitor-resources.sh` | monitoring/ | Copier |
| `monitoring` | monitoring/ | Copier |
| `pipeline-activity-tracker.ts` | monitoring/ | Copier |
| `pipeline-audit-tool.ts` | monitoring/ | Copier |
| `monitoring` | monitoring/ | Copier |

#### Scripts de génération:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `batch-generate-migration-plans.sh` | generation/ | Copier |
| `generate-agent-configs.js` | generation/ | Copier |
| `generate-agents-docs.sh` | generation/ | Copier |
| `generate-audit.js` | generation/ | Copier |
| `generate-dashboard.js` | generation/ | Copier |
| `generate-html-view.js` | generation/ | Copier |
| `generate-interactive-report.js` | generation/ | Copier |
| `generate-interfaces.sh` | generation/ | Copier |
| `generate-reports.js` | generation/ | Copier |
| `generate-technical-files.js` | generation/ | Copier |
| `generate-toc.js` | generation/ | Copier |
| `generate_migration_plan.ts` | generation/ | Copier |
| `generation` | generation/ | Copier |
| `create-pipeline.sh` | generation/ | Copier |
| `create-section.sh` | generation/ | Copier |
| `enrich-cahier.sh` | generation/ | Copier |
| `generate_cahier_html.py` | generation/ | Copier |
| `generate_dependency_graph.py` | generation/ | Copier |
| `generate_html.py` | generation/ | Copier |
| `reorganize-cahier.sh` | generation/ | Copier |
| `batch-generate-migration-plans.sh` | generation/ | Copier |
| `generate-migration-plan.ts` | generation/ | Copier |
| `nestjs-module-generator.ts` | generation/ | Copier |
| `remix-route-generator.ts` | generation/ | Copier |
| `generation` | generation/ | Copier |
| `post-generate-verification.ts` | generation/ | Copier |

#### Scripts de setup:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `init-multiple-postgres-dbs.sh` | setup/ | Copier |
| `init-mysql-migration-pipeline.sh` | setup/ | Copier |
| `install-pipeline.sh` | setup/ | Copier |
| `setup-cahier.sh` | setup/ | Copier |
| `setup-scripts-permissions.sh` | setup/ | Copier |
| `setup` | setup/ | Copier |
| `setup` | setup/ | Copier |
| `setup-parallel-cahier.sh` | setup/ | Copier |
| `setup-tracking.sh` | setup/ | Copier |
| `setup.js` | setup/ | Copier |
| `restructure.sh` | setup/ | Copier |
| `setup-eslint.sh` | setup/ | Copier |
| `setup-n8n-pipelines.sh` | setup/ | Copier |
| `standardize-agent-names.sh` | setup/ | Copier |

#### Scripts de maintenance:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `clean-mcp-agents.sh` | maintenance/ | Copier |
| `cleanup-duplicates.sh` | maintenance/ | Copier |
| `cleanup-project.sh` | maintenance/ | Copier |
| `fix-case-conflicts.sh` | maintenance/ | Copier |
| `fix-migration-errors.sh` | maintenance/ | Copier |
| `fix-permissions.sh` | maintenance/ | Copier |
| `chmod-all.sh` | maintenance/ | Copier |
| `export-files.sh` | maintenance/ | Copier |
| `fix-agents.sh` | maintenance/ | Copier |
| `fix-permissions.sh` | maintenance/ | Copier |
| `manage-cahier.sh` | maintenance/ | Copier |
| `manage-cdc.sh` | maintenance/ | Copier |
| `run-agent.sh` | maintenance/ | Copier |
| `setup-cahier.sh` | maintenance/ | Copier |
| `setup-scripts-permissions.sh` | maintenance/ | Copier |
| `start_pipeline.sh` | maintenance/ | Copier |
| `track-changes.sh` | maintenance/ | Copier |
| `update-cahier.sh` | maintenance/ | Copier |
| `update-n8n.sh` | maintenance/ | Copier |
| `update-npm-scripts.sh` | maintenance/ | Copier |
| `update-references.sh` | maintenance/ | Copier |
| `update-user.js` | maintenance/ | Copier |
| `fix-agent-imports.sh` | maintenance/ | Copier |
| `update-cahier.sh` | maintenance/ | Copier |
| `update-cahier.ts` | maintenance/ | Copier |
| `update-tech.js` | maintenance/ | Copier |
| `run-supervised-cleanup.sh` | maintenance/ | Copier |
| `update-agent-imports.sh` | maintenance/ | Copier |
| `update-imports.sh` | maintenance/ | Copier |
| `final-cleanup.sh` | maintenance/ | Copier |
| `fix-agent-imports.sh` | maintenance/ | Copier |
| `update-paths.sh` | maintenance/ | Copier |
| `workflow-cleanup.sh` | maintenance/ | Copier |

#### Scripts de dashboards:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `dashboard.js` | dashboards/ | Copier |
| `deploy-layered-dashboards.sh` | dashboards/ | Copier |
| `generate-dashboard.js` | dashboards/ | Copier |
| `launch-dashboard.js` | dashboards/ | Copier |
| `dashboards` | dashboards/ | Copier |
| `start-dashboards.sh` | dashboards/ | Copier |
| `sync-migration-dashboard.ts` | dashboards/ | Copier |
| `unified-dashboard.js` | dashboards/ | Copier |

#### Scripts de workflows:

| Script source | Destination | Action |
|--------------|-------------|--------|
| `import-n8n-workflows.js` | workflows/ | Copier |
| `extract-workflows.js` | workflows/ | Copier |
| `import-n8n-workflows.js` | workflows/ | Copier |
| `import-workflows-jwt.js` | workflows/ | Copier |
| `import-workflows.js` | workflows/ | Copier |
| `workflows` | workflows/ | Copier |
| `workflow` | workflows/ | Copier |
| `workflow-cleanup.sh` | workflows/ | Copier |
| `start_nginx_to_caddy_pipeline.sh` | workflows/ | Copier |
| `start_php_routes_manager.sh` | workflows/ | Copier |
| `start_pipeline.sh` | workflows/ | Copier |
| `start_pipeline_audit.sh` | workflows/ | Copier |
| `start_sql_analysis.sh` | workflows/ | Copier |
