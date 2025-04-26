# Inventaire des Workflows CI/CD

Document généré le Thu Apr 24 23:49:28 UTC 2025

## GitHub Actions Workflows

| Nom | État | Description |
|-----|------|-------------|
| `audit-validation.yml.disabled` | ❌ Désactivé | Validation des audits |
| `block-merge-on-seo-fail.yml.disabled` | ❌ Désactivé | SEO Quality Gate |
| `ci-mcp-migration.yml.disabled` | ❌ Désactivé | CI - Vérification Migration MCP |
| `ci-migration.yml.disabled` | ❌ Désactivé | *(Pas de description)* |
| `dev-check.yml.disabled` | ❌ Désactivé | 🔍 Dev Checker |
| `mcp-pipeline-audit.yml.disabled` | ❌ Désactivé | Audit du Pipeline MCP |
| `mcp-pipeline.yml.disabled` | ❌ Désactivé | MCP Pipeline CI/CD |
| `mcp-verify.yml.disabled` | ❌ Désactivé | MCP Code Generator & Verifier |
| `migration-pipeline.yml.disabled` | ❌ Désactivé | PHP Migration Pipeline |
| `monitoring.yml.disabled` | ❌ Désactivé | Surveillance post-migration |
| `pipeline-mcp-audit.yml.disabled` | ❌ Désactivé | Audit du Pipeline MCP |
| `preview.yml.disabled` | ❌ Désactivé | Prévisualisation automatique des PRs |
| `security-checks.yml.disabled` | ❌ Désactivé | Security Risk Analysis |
| `validate-agents.yml.disabled` | ❌ Désactivé | Validate MCP Agents |

## Workflows CI

| Nom | Chemin | Type |
|-----|--------|------|
| `dev-checker-ci.yml` | ci/dev-checker-ci.yml | CI/CD |
| `diff-verifier-ci.yml` | ci/diff-verifier-ci.yml | Vérification |
| `documentation-pipeline.yml` | ci/documentation-pipeline.yml | CI/CD |
| `check-mcp-status.yml` | ci/github-actions/check-mcp-status.yml | CI/CD |
| `php-analyzer-ci.yml` | ci/php-analyzer-ci.yml | Analyse |
| `remediator-ci.yml` | ci/remediator-ci.yml | CI/CD |
| `test-writer-ci.yml` | ci/test-writer-ci.yml | CI/CD |

## Orchestration Docker

| Nom | Services inclus |
|-----|----------------|
| `docker-compose.bullmq.yml` | # Service Redis pour BullMQ |
| `docker-compose.dev.yml` | # Base de données PostgreSQL pour lapplication principale et Prisma |
| `docker-compose.mcp.yml` | redis: |
| `docker-compose.n8n.yml` | n8n: |
| `docker-compose.yml` | # Base de données |

## Autres Workflows

| Nom | Chemin |
|-----|--------|
| `01-php-analyzer.json` | workflows/01-php-analyzer.json |
| `ci.yml` | workflows/ci.yml |
| `deploy.yml` | workflows/deploy.yml |
| `audit_quality_metrics.json` | workflows/extracted/audit_quality_metrics.json |
| `audit_validator.json` | workflows/extracted/audit_validator.json |
| `code_generator.json` | workflows/extracted/code_generator.json |
| `documentation_updater.json` | workflows/extracted/documentation_updater.json |
| `php_analyzer.json` | workflows/extracted/php_analyzer.json |
| `pipeline_d_audit_multi_agents.json` | workflows/extracted/pipeline_d_audit_multi_agents.json |
| `s_lection_intelligente_des_fichiers_php.json` | workflows/extracted/s_lection_intelligente_des_fichiers_php.json |
| `v_rification_qualit__du_code.json` | workflows/extracted/v_rification_qualit__du_code.json |
| `mcp-ai-integration.json` | workflows/mcp-ai-integration.json |
| `mcp-php-analysis-pipeline.json` | workflows/mcp-php-analysis-pipeline.json |
| `migration-workflow.json` | workflows/migration-workflow.json |
| `migration-plans-generator.n8n.json` | workflows/migration/migration-plans-generator.n8n.json |
| `migration_pipeline.n8n.json` | workflows/migration/migration_pipeline.n8n.json |
| `n8n.pipeline.json` | workflows/migration/n8n.pipeline.json |
| `sql-analyzer-prisma-builder.n8n.json` | workflows/migration/sql-analyzer-prisma-builder.n8n.json |
| `migration_pipeline.json` | workflows/migration_pipeline.json |
| `wave-runner.json` | workflows/wave-runner.json |
