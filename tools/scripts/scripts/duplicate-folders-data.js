/**
 * Liste des dossiers en conflit (PascalCase/kebab-case) à fusionner
 * 
 * Ce fichier contient les paires de dossiers qui ont causé des erreurs ENOTEMPTY
 * lors de la tentative de standardisation des noms en kebab-case.
 */

module.exports = [
  // Orchestrators
  {
    pascalCase: 'packages/mcp-agents/orchestrators/BullmqOrchestratorAgent',
    kebabCase: 'packages/mcp-agents/orchestrators/bullmq-orchestrator-agent'
  },
  {
    pascalCase: 'packages/mcp-agents/orchestrators/McpVerifierDotworkerAgent',
    kebabCase: 'packages/mcp-agents/orchestrators/mcp-verifier-dotworker-agent'
  },
  {
    pascalCase: 'packages/mcp-agents/orchestrators/MetricsServiceAgent',
    kebabCase: 'packages/mcp-agents/orchestrators/metrics-service-agent'
  },
  {
    pascalCase: 'packages/mcp-agents/orchestrators/MigrationOrchestratorAgent',
    kebabCase: 'packages/mcp-agents/orchestrators/migration-orchestrator-agent'
  },
  {
    pascalCase: 'packages/mcp-agents/orchestrators/OrchestratorAgent',
    kebabCase: 'packages/mcp-agents/orchestrators/orchestrator-agent'
  },

  // Validators
  {
    pascalCase: 'packages/mcp-agents/validators/CanonicalValidatorAgent',
    kebabCase: 'packages/mcp-agents/validators/canonical-validator-agent'
  },
  {
    pascalCase: 'packages/mcp-agents/validators/PostgresqlValidatorAgent',
    kebabCase: 'packages/mcp-agents/validators/postgresql-validator-agent'
  },

  // Base Agents
  {
    pascalCase: 'src/business/agents/BaseAgent',
    kebabCase: 'src/business/agents/base-agent'
  },

  // Analyzers
  {
    pascalCase: 'src/business/analyzers/PhpAnalyzer',
    kebabCase: 'src/business/analyzers/php-analyzer'
  },
  {
    pascalCase: 'src/business/analyzers/PhpAnalyzerV2',
    kebabCase: 'src/business/analyzers/php-analyzer-v2'
  },
  {
    pascalCase: 'src/business/analyzers/QaAnalyzer',
    kebabCase: 'src/business/analyzers/qa-analyzer'
  },

  // Generators
  {
    pascalCase: 'src/business/generators/CaddyfileGenerator',
    kebabCase: 'src/business/generators/caddyfile-generator'
  },
  {
    pascalCase: 'src/business/generators/NestjsGenerator',
    kebabCase: 'src/business/generators/nestjs-generator'
  },
  {
    pascalCase: 'src/business/generators/RemixGenerator',
    kebabCase: 'src/business/generators/remix-generator'
  },

  // Business Validators
  {
    pascalCase: 'src/business/validators/CanonicalValidator',
    kebabCase: 'src/business/validators/canonical-validator'
  },

  // Orchestration
  {
    pascalCase: 'src/orchestration/orchestrators/OrchestratorBridge',
    kebabCase: 'src/orchestration/orchestrators/orchestrator-bridge'
  },
  {
    pascalCase: 'src/orchestration/orchestrators/TemporalAdapter',
    kebabCase: 'src/orchestration/orchestrators/temporal-adapter'
  },

  // Agents Analysis
  {
    pascalCase: 'agents/analysis/ConfigParsers',
    kebabCase: 'agents/analysis/config-parsers'
  },

  // Migration
  {
    pascalCase: 'agents/migration/MysqlAnalyzer',
    kebabCase: 'agents/migration/mysql-analyzer'
  },
  {
    pascalCase: 'agents/migration/NginxToCaddy',
    kebabCase: 'agents/migration/nginx-to-caddy'
  },
  {
    pascalCase: 'agents/migration/PhpToRemix',
    kebabCase: 'agents/migration/php-to-remix'
  }
];