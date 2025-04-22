# Rapport de vérification de la migration MCP OS en 3 couches

Date: 2025-04-18

## Structure des répertoires

État: ✅ Valide

Tous les répertoires nécessaires sont présents.

## Statut de la migration

- **Total des agents**: 122
- **Migrés avec succès**: 105 (86%)
- **Non migrés**: 17 (14%)

Agents à migrer:
- notifier
- supabaseoptimizationtracker
- php-sql-sync-mapper
- php-sql-mapper
- inject-to-supabase
- canonical-sync-agent
- schema
- type-converter
- table-classifier
- classifier
- notification-service
- metrics-service
- audit-selector
- selector-agent
- mcp-integrator
- php-discovery-engine
- dynamic_sql_extractor

## Implémentation des interfaces

- **Total des agents**: 162
- **Conformes**: 34 (21%)
- **Non conformes**: 128 (79%)

Agents non conformes:
- `packages/mcp-agents/orchestration/misc/agent-audit/agent-audit.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/agent8-optimizer/agent8-optimizer.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/caddyfile-generator/caddyfile-generator.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/coordinator-agent/coordinator-agent.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/mcp-verifier.worker/mcp-verifier.worker.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/php-analyzer-agent/php-analyzer-agent.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/php-analyzer.worker/php-analyzer.worker.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/sql-analysis-runner/sql-analysis-runner.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/misc/status-writer/status-writer.ts` manque: OrchestrationAgent
- `packages/mcp-agents/orchestration/monitors/monitoring-check/monitoring-check.ts` manque: OrchestrationAgent, MonitorAgent
- `packages/mcp-agents/orchestration/orchestrators/agent-orchestrator/agent-orchestrator.ts` manque: OrchestrationAgent, OrchestratorAgent
- `packages/mcp-agents/orchestration/orchestrators/bullmq-orchestrator/bullmq-orchestrator.ts` manque: OrchestrationAgent, OrchestratorAgent
- `packages/mcp-agents/orchestration/orchestrators/migration-orchestrator/migration-orchestrator.ts` manque: OrchestrationAgent, OrchestratorAgent
- `packages/mcp-agents/orchestration/orchestrators/orchestrator/orchestrator.ts` manque: OrchestrationAgent, OrchestratorAgent
- `packages/mcp-agents/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` manque: OrchestrationAgent, OrchestratorAgent
- `packages/mcp-agents/coordination/bridges/system-integration-bridge/system-integration-bridge.ts` manque: CoordinationAgent, BridgeAgent
- `packages/mcp-agents/business/analyzers/analyze-security-risks/analyze-security-risks.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/debt-analyzer/debt-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/htaccess-route-analyzer/htaccess-route-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/index/index.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/mysql-analyzer/mysql-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/mysql-analyzer+optimizer/mysql-analyzer+optimizer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/nginx-config-analyzer/nginx-config-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/php-analyzer/php-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/php-analyzer-v2/php-analyzer-v2.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/php-analyzer-v3/php-analyzer-v3.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/php-analyzer-v4/php-analyzer-v4.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/qa-analyzer/qa-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/relation-analyzer/relation-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/schema-analyzer/schema-analyzer.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/analyzers/sql-analyzer+prisma-builder/sql-analyzer+prisma-builder.ts` manque: BusinessAgent, AnalyzerAgent
- `packages/mcp-agents/business/generators/caddy-generator/caddy-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/component-generator/component-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/dev-generator/dev-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/generate-migration-plan/generate-migration-plan.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/generate_prisma_model/generate_prisma_model.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/meta-generator/meta-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/prisma-generator/prisma-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/prisma-migration-generator/prisma-migration-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/prisma-smart-generator/prisma-smart-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/remix-route-generator/remix-route-generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/generators/seo-meta.generator/seo-meta.generator.ts` manque: BusinessAgent, GeneratorAgent
- `packages/mcp-agents/business/misc/agent-business/agent-business.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/agent-donnees/agent-donnees.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/agent-quality/agent-quality.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/agent-structure/agent-structure.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/agent-version-auditor/agent-version-auditor.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/auto-pr-agent/auto-pr-agent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/baseagent/baseagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/businessagent/businessagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/ci-tester/ci-tester.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/consolidator/consolidator.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/data-verifier/data-verifier.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/dataagent/dataagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/debt-detector/debt-detector.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/dependencyagent/dependencyagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/dev-integrator/dev-integrator.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/dev-linter/dev-linter.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/devops-preview/devops-preview.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/diff-verifier/diff-verifier.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/discovery-agent/discovery-agent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/helpers/helpers.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/mcp-manifest-manager/mcp-manifest-manager.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/mcp-verifier/mcp-verifier.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/migration-strategist/migration-strategist.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/mysql-to-pg/mysql-to-pg.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/mysql-to-postgresql/mysql-to-postgresql.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/php-router-audit/php-router-audit.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/pipeline-strategy-auditor/pipeline-strategy-auditor.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/pr-creator/pr-creator.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/progressive-migration-agent/progressive-migration-agent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/qa-confirmer/qa-confirmer.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/qualityagent/qualityagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/relational-normalizer/relational-normalizer.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/remediator/remediator.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/semantic-table-mapper/semantic-table-mapper.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/seo-audit-runner/seo-audit-runner.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/seo-content-enhancer/seo-content-enhancer.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/seo-mcp-controller/seo-mcp-controller.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/seo-redirect-mapper/seo-redirect-mapper.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/sql-debt-audit/sql-debt-audit.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/sql-prisma-migration-planner/sql-prisma-migration-planner.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/structureagent/structureagent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/table-cartographer/table-cartographer.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/type-audit-agent/type-audit-agent.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/type-auditor/type-auditor.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/type-converter/type-converter.ts` manque: BusinessAgent
- `packages/mcp-agents/business/misc/type-mapper/type-mapper.ts` manque: BusinessAgent
- `packages/mcp-agents/business/parsers/htaccess-parser/htaccess-parser.ts` manque: BusinessAgent, ParserAgent
- `packages/mcp-agents/business/parsers/nginx-config-parser/nginx-config-parser.ts` manque: BusinessAgent, ParserAgent
- `packages/mcp-agents/business/parsers/parser/parser.ts` manque: BusinessAgent, ParserAgent
- `packages/mcp-agents/business/validators/canonical-validator/canonical-validator.ts` manque: BusinessAgent, ValidatorAgent
- `packages/mcp-agents/business/validators/dev-checker/dev-checker.ts` manque: BusinessAgent, ValidatorAgent
- `packages/mcp-agents/business/validators/postgresql-validator/postgresql-validator.ts` manque: BusinessAgent, ValidatorAgent
- `packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts` manque: BusinessAgent, ValidatorAgent
- `packages/mcp-agents/business/validators/seo-checker-canonical/seo-checker-canonical.ts` manque: BusinessAgent, ValidatorAgent
- `agents/seo-mcp-controller.ts` manque: BaseAgent
- `agents/qa-analyzer.ts` manque: BusinessAgent
- `agents/migration-orchestrator.ts` manque: OrchestrationAgent
- `agents/meta-generator.ts` manque: BusinessAgent
- `agents/canonical-validator.ts` manque: BusinessAgent
- `agents/bullmq-orchestrator.ts` manque: OrchestrationAgent
- `agents/utils/nginx-config-parser.ts` manque: BusinessAgent
- `agents/utils/htaccess-parser.ts` manque: BusinessAgent
- `agents/utils/caddy-generator.ts` manque: BusinessAgent
- `agents/quality/analyze-security-risks.ts` manque: BusinessAgent
- `agents/migration/component-generator.ts` manque: BusinessAgent
- `agents/migration/caddyfile-generator.ts` manque: BaseAgent
- `agents/integration/orchestrator-bridge.ts` manque: OrchestrationAgent
- `agents/integration/notification-service.ts` manque: BaseAgent
- `agents/core/coordinator-agent.ts` manque: CoordinationAgent
- `agents/core/agent-orchestrator.ts` manque: OrchestrationAgent
- `agents/analysis/htaccess-router-analyzer.ts` manque: BusinessAgent
- `agents/migration/php-to-remix/seo-meta.generator.ts` manque: BusinessAgent
- `agents/migration/php-to-remix/remix-route-generator.ts` manque: BusinessAgent
- `agents/migration/php-to-remix/htaccess-route-analyzer.ts` manque: BusinessAgent
- `agents/migration/php-to-remix/htaccess-parser.ts` manque: BaseAgent
- `agents/migration/php-to-remix/dev-generator.ts` manque: BusinessAgent
- `agents/migration/nginx-to-caddy/caddyfile-generator.ts` manque: BaseAgent
- `agents/analysis/config-parsers/nginx-config-parser.ts` manque: BusinessAgent
- `agents/analysis/config-parsers/htaccess-parser.ts` manque: BaseAgent
- `agents/migration/mysql-analyzer/core/schema-analyzer.ts` manque: BusinessAgent
- `agents/migration/mysql-analyzer/core/relation-analyzer.ts` manque: BusinessAgent
- `agents/migration/mysql-analyzer/core/prisma-generator.ts` manque: BusinessAgent
- `agents/migration/mysql-analyzer/core/parser.ts` manque: BusinessAgent
- `agents/migration/mysql-analyzer/core/debt-analyzer.ts` manque: BusinessAgent
- `agents/migration/mysql-analyzer/agents/prisma-generator.ts` manque: CoordinationAgent

## Récapitulatif par couche

| Couche | Nombre d'agents | % du total |
|--------|----------------|------------|
| Orchestration | 20 | 12% |
| Coordination | 3 | 2% |
| Business | 106 | 65% |
| Non classé | 33 | 20% |

## Recommandations

Pour finaliser la migration:

1. ✅ Structure de répertoires complète
2. Migrer les agents restants (17)
3. Implémenter les interfaces manquantes pour les agents non conformes (128)

Exécutez ce script à nouveau après avoir effectué ces actions pour vérifier que la migration est complète.
