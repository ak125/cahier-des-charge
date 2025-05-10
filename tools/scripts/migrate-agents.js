#!/usr/bin/env node

/**
 * Script de migration automatisée des agents vers l'architecture en trois couches
 * Basé sur le plan de consolidation généré le 2025-05-08T22:06:18.432Z
 */

import fs from 'fs';
import path from 'path';

// Liste des actions de consolidation issues du plan
const consolidationActions = [
  {
    "group": "monitor-agent",
    "layer": "orchestration",
    "keepAgent": {
      "className": "monitor-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/orchestration/monitors/monitor-agent.ts",
      "sourceFolder": "packages/orchestration",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/orchestration/core/monitor-agent.ts",
    "agents": [
      {
        "className": "monitor-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/monitor-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "scheduler-agent",
    "layer": "orchestration",
    "keepAgent": {
      "className": "scheduler-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/orchestration/schedulers/scheduler-agent.ts",
      "sourceFolder": "packages/orchestration",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/orchestration/core/scheduler-agent.ts",
    "agents": [
      {
        "className": "scheduler-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/scheduler-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "coordination-agent",
    "layer": "coordination",
    "keepAgent": {
      "className": "coordination-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/coordination-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/coordination/core/coordination-agent.ts",
    "agents": [
      {
        "className": "coordination-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/coordination/coordination-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "registry-agent",
    "layer": "coordination",
    "keepAgent": {
      "className": "registry-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/registry-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/coordination/core/registry-agent.ts",
    "agents": [
      {
        "className": "registry-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/coordination/registry-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "abstract-analyzer-agentd-240d1f1c",
    "layer": "business",
    "keepAgent": {
      "className": "abstract-analyzer-agentd-240d1f1c",
      "filePath": "/workspaces/cahier-des-charge/packages/business/analyzers/abstract-analyzer-agentd-240d1f1c.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/abstract-analyzer-agentd-240d1f1c.ts",
    "agents": [
      {
        "className": "abstract-analyzer-agentd-240d1f1c",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agentd-240d1f1c.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "exemple-agent",
    "layer": "business",
    "keepAgent": {
      "className": "exemple-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/exemple-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/exemple-agent.ts",
    "agents": [
      {
        "className": "exemple-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/monitoring/telemetry/exemple-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "abstract-analyzer-agentd-40b4b06a-c85fc576",
    "layer": "business",
    "keepAgent": {
      "className": "abstract-analyzer-agentd-40b4b06a-c85fc576",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agentd-40b4b06a-c85fc576.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/abstract-analyzer-agentd-40b4b06a-c85fc576.ts",
    "agents": [
      {
        "className": "abstract-analyzer-agentd-40b4b06a-c85fc576",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/analyzers/abstract-analyzer/abstract-analyzer-agentd-40b4b06a-c85fc576.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "abstract-analyzer-agentd-8c952bcb",
    "layer": "business",
    "keepAgent": {
      "className": "abstract-analyzer-agentd-8c952bcb",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agentd-8c952bcb.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/abstract-analyzer-agentd-8c952bcb.ts",
    "agents": [
      {
        "className": "abstract-analyzer-agentd-8c952bcb",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/analyzers/abstract-analyzer/abstract-analyzer-agentd-8c952bcb.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "adapt-agents",
    "layer": "business",
    "keepAgent": {
      "className": "adapt-agents",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/adapt-agents.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/adapt-agents.ts",
    "agents": [
      {
        "className": "adapt-agents",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/adapt-agents.ts",
        "action": "migrate"
      },
      {
        "className": "adapt-agents",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/adapt-agents/adapt-agents.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "fix-agent-typescript-errors",
    "layer": "business",
    "keepAgent": {
      "className": "fix-agent-typescript-errors",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/fix-agent-typescript-errors.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/fix-agent-typescript-errors.ts",
    "agents": [
      {
        "className": "fix-agent-typescript-errors",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/fix-agent-typescript-errors.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "detect-agent-methods",
    "layer": "business",
    "keepAgent": {
      "className": "detect-agent-methods",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/detect-agent-methods.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/detect-agent-methods.ts",
    "agents": [
      {
        "className": "detect-agent-methods",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/detect-agent-methods.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "relational-normalizer-agent-74ce0933",
    "layer": "business",
    "keepAgent": {
      "className": "relational-normalizer-agent-74ce0933",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/relational-normalizer-agent-74ce0933.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/relational-normalizer-agent-74ce0933.ts",
    "agents": [
      {
        "className": "relational-normalizer-agent-74ce0933",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/relational-normalizer-agent-74ce0933.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "meta-generator-agent-625e5a9a",
    "layer": "business",
    "keepAgent": {
      "className": "meta-generator-agent-625e5a9a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/meta-generator-agent-625e5a9a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/meta-generator-agent-625e5a9a.ts",
    "agents": [
      {
        "className": "meta-generator-agent-625e5a9a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/meta-generator-agent-625e5a9a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-metagenerator-agent-00c109a0-a049bca3",
    "layer": "business",
    "keepAgent": {
      "className": "seo-metagenerator-agent-00c109a0-a049bca3",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-metagenerator-agent-00c109a0-a049bca3.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-metagenerator-agent-00c109a0-a049bca3.ts",
    "agents": [
      {
        "className": "seo-metagenerator-agent-00c109a0-a049bca3",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-metagenerator-agent-00c109a0-a049bca3.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "helpers-agent-b141a429",
    "layer": "business",
    "keepAgent": {
      "className": "helpers-agent-b141a429",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/helpers-agent-b141a429.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/helpers-agent-b141a429.ts",
    "agents": [
      {
        "className": "helpers-agent-b141a429",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/helpers-agent-b141a429.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-mapper-agent-5059c2e4",
    "layer": "business",
    "keepAgent": {
      "className": "type-mapper-agent-5059c2e4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-mapper-agent-5059c2e4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/type-mapper-agent-5059c2e4.ts",
    "agents": [
      {
        "className": "type-mapper-agent-5059c2e4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/type-mapper-agent-5059c2e4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migrate-agents-0112b2cb",
    "layer": "business",
    "keepAgent": {
      "className": "migrate-agents-0112b2cb",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/migrate-agents-0112b2cb.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/migrate-agents-0112b2cb.ts",
    "agents": [
      {
        "className": "migrate-agents-0112b2cb",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/migrate-agents-0112b2cb.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "detect-agent-methods-8f49f568",
    "layer": "business",
    "keepAgent": {
      "className": "detect-agent-methods-8f49f568",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/detect-agent-methods-8f49f568.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/detect-agent-methods-8f49f568.ts",
    "agents": [
      {
        "className": "detect-agent-methods-8f49f568",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/detect-agent-methods-8f49f568.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "structure-classifier-agent-15cd3eb4",
    "layer": "business",
    "keepAgent": {
      "className": "structure-classifier-agent-15cd3eb4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/structure-classifier-agent-15cd3eb4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/structure-classifier-agent-15cd3eb4.ts",
    "agents": [
      {
        "className": "structure-classifier-agent-15cd3eb4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/structure-classifier-agent-15cd3eb4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "qa-confirmer-agent-30ee4d9b",
    "layer": "business",
    "keepAgent": {
      "className": "qa-confirmer-agent-30ee4d9b",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/qa-confirmer-agent-30ee4d9b.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/qa-confirmer-agent-30ee4d9b.ts",
    "agents": [
      {
        "className": "qa-confirmer-agent-30ee4d9b",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/qa-confirmer-agent-30ee4d9b.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "php-analyzerworker-agent-1688e1a4",
    "layer": "business",
    "keepAgent": {
      "className": "php-analyzerworker-agent-1688e1a4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-analyzerworker-agent-1688e1a4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/php-analyzerworker-agent-1688e1a4.ts",
    "agents": [
      {
        "className": "php-analyzerworker-agent-1688e1a4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/php-analyzerworker-agent-1688e1a4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "progressive-migration-agent-33a56704-90744e9a",
    "layer": "business",
    "keepAgent": {
      "className": "progressive-migration-agent-33a56704-90744e9a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/progressive-migration-agent-33a56704-90744e9a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/progressive-migration-agent-33a56704-90744e9a.ts",
    "agents": [
      {
        "className": "progressive-migration-agent-33a56704-90744e9a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/progressive-migration-agent-33a56704-90744e9a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-audit-runner-agent-3e711436",
    "layer": "business",
    "keepAgent": {
      "className": "seo-audit-runner-agent-3e711436",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-audit-runner-agent-3e711436.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-audit-runner-agent-3e711436.ts",
    "agents": [
      {
        "className": "seo-audit-runner-agent-3e711436",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-audit-runner-agent-3e711436.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-redirect-mapper-agent-28b31273",
    "layer": "business",
    "keepAgent": {
      "className": "seo-redirect-mapper-agent-28b31273",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-redirect-mapper-agent-28b31273.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-redirect-mapper-agent-28b31273.ts",
    "agents": [
      {
        "className": "seo-redirect-mapper-agent-28b31273",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-redirect-mapper-agent-28b31273.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-linter-agent-216afad7",
    "layer": "business",
    "keepAgent": {
      "className": "dev-linter-agent-216afad7",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-linter-agent-216afad7.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/dev-linter-agent-216afad7.ts",
    "agents": [
      {
        "className": "dev-linter-agent-216afad7",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/dev-linter-agent-216afad7.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-content-enhancer-agent-2807102a",
    "layer": "business",
    "keepAgent": {
      "className": "seo-content-enhancer-agent-2807102a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-content-enhancer-agent-2807102a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-content-enhancer-agent-2807102a.ts",
    "agents": [
      {
        "className": "seo-content-enhancer-agent-2807102a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-content-enhancer-agent-2807102a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "semantic-table-mapper-agent-20e70ce5-8f9a616d",
    "layer": "business",
    "keepAgent": {
      "className": "semantic-table-mapper-agent-20e70ce5-8f9a616d",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/semantic-table-mapper-agent-20e70ce5-8f9a616d.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/semantic-table-mapper-agent-20e70ce5-8f9a616d.ts",
    "agents": [
      {
        "className": "semantic-table-mapper-agent-20e70ce5-8f9a616d",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/semantic-table-mapper-agent-20e70ce5-8f9a616d.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "htaccess-router-analyzer-agent-6a249c15",
    "layer": "business",
    "keepAgent": {
      "className": "htaccess-router-analyzer-agent-6a249c15",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/htaccess-router-analyzer-agent-6a249c15.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/htaccess-router-analyzer-agent-6a249c15.ts",
    "agents": [
      {
        "className": "htaccess-router-analyzer-agent-6a249c15",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/htaccess-router-analyzer-agent-6a249c15.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "caddyfile-generator-agent-0fc04359",
    "layer": "business",
    "keepAgent": {
      "className": "caddyfile-generator-agent-0fc04359",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddyfile-generator-agent-0fc04359.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/caddyfile-generator-agent-0fc04359.ts",
    "agents": [
      {
        "className": "caddyfile-generator-agent-0fc04359",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/caddyfile-generator-agent-0fc04359.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "validator-agent-70a2aa45-3d324a7a",
    "layer": "business",
    "keepAgent": {
      "className": "validator-agent-70a2aa45-3d324a7a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/validator-agent-70a2aa45-3d324a7a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/validator-agent-70a2aa45-3d324a7a.ts",
    "agents": [
      {
        "className": "validator-agent-70a2aa45-3d324a7a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/validator-agent-70a2aa45-3d324a7a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "htaccess-parser-agent-1ecf4eb4",
    "layer": "business",
    "keepAgent": {
      "className": "htaccess-parser-agent-1ecf4eb4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/htaccess-parser-agent-1ecf4eb4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/htaccess-parser-agent-1ecf4eb4.ts",
    "agents": [
      {
        "className": "htaccess-parser-agent-1ecf4eb4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/htaccess-parser-agent-1ecf4eb4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-converter-agent-2442cb1d-35e76010",
    "layer": "business",
    "keepAgent": {
      "className": "type-converter-agent-2442cb1d-35e76010",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-converter-agent-2442cb1d-35e76010.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/type-converter-agent-2442cb1d-35e76010.ts",
    "agents": [
      {
        "className": "type-converter-agent-2442cb1d-35e76010",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/type-converter-agent-2442cb1d-35e76010.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "consolidator-agent-785413a2",
    "layer": "business",
    "keepAgent": {
      "className": "consolidator-agent-785413a2",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/consolidator-agent-785413a2.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/consolidator-agent-785413a2.ts",
    "agents": [
      {
        "className": "consolidator-agent-785413a2",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/consolidator-agent-785413a2.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-manifest-manager-agent-2de3fd41",
    "layer": "business",
    "keepAgent": {
      "className": "mcp-manifest-manager-agent-2de3fd41",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-manifest-manager-agent-2de3fd41.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mcp-manifest-manager-agent-2de3fd41.ts",
    "agents": [
      {
        "className": "mcp-manifest-manager-agent-2de3fd41",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mcp-manifest-manager-agent-2de3fd41.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "assembler-agent-52d4116b-49f86143",
    "layer": "business",
    "keepAgent": {
      "className": "assembler-agent-52d4116b-49f86143",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/assembler-agent-52d4116b-49f86143.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/assembler-agent-52d4116b-49f86143.ts",
    "agents": [
      {
        "className": "assembler-agent-52d4116b-49f86143",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/assembler-agent-52d4116b-49f86143.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-generator-agent-1a09754d",
    "layer": "business",
    "keepAgent": {
      "className": "dev-generator-agent-1a09754d",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-generator-agent-1a09754d.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/dev-generator-agent-1a09754d.ts",
    "agents": [
      {
        "className": "dev-generator-agent-1a09754d",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/dev-generator-agent-1a09754d.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "relation-analyzer-agent-a69f9d68",
    "layer": "business",
    "keepAgent": {
      "className": "relation-analyzer-agent-a69f9d68",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/relation-analyzer-agent-a69f9d68.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/relation-analyzer-agent-a69f9d68.ts",
    "agents": [
      {
        "className": "relation-analyzer-agent-a69f9d68",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/relation-analyzer-agent-a69f9d68.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "auto-pr-agent-15836cb1",
    "layer": "business",
    "keepAgent": {
      "className": "auto-pr-agent-15836cb1",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/auto-pr-agent-15836cb1.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/auto-pr-agent-15836cb1.ts",
    "agents": [
      {
        "className": "auto-pr-agent-15836cb1",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/auto-pr-agent-15836cb1.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-health-checker-4ce8d923",
    "layer": "business",
    "keepAgent": {
      "className": "agent-health-checker-4ce8d923",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-health-checker-4ce8d923.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-health-checker-4ce8d923.ts",
    "agents": [
      {
        "className": "agent-health-checker-4ce8d923",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-health-checker-4ce8d923.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-prisma-model-agent-022ca30b",
    "layer": "business",
    "keepAgent": {
      "className": "generate-prisma-model-agent-022ca30b",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-prisma-model-agent-022ca30b.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/generate-prisma-model-agent-022ca30b.ts",
    "agents": [
      {
        "className": "generate-prisma-model-agent-022ca30b",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/generate-prisma-model-agent-022ca30b.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "pr-creator-agent-576ad81d-23756e85",
    "layer": "business",
    "keepAgent": {
      "className": "pr-creator-agent-576ad81d-23756e85",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pr-creator-agent-576ad81d-23756e85.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/pr-creator-agent-576ad81d-23756e85.ts",
    "agents": [
      {
        "className": "pr-creator-agent-576ad81d-23756e85",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/pr-creator-agent-576ad81d-23756e85.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dependency-agent-57637993",
    "layer": "business",
    "keepAgent": {
      "className": "dependency-agent-57637993",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dependency-agent-57637993.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/dependency-agent-57637993.ts",
    "agents": [
      {
        "className": "dependency-agent-57637993",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/dependency-agent-57637993.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "status-writer-agent-0184f24a-883f8da0",
    "layer": "business",
    "keepAgent": {
      "className": "status-writer-agent-0184f24a-883f8da0",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/status-writer-agent-0184f24a-883f8da0.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/status-writer-agent-0184f24a-883f8da0.ts",
    "agents": [
      {
        "className": "status-writer-agent-0184f24a-883f8da0",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/status-writer-agent-0184f24a-883f8da0.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-quality-agent-7f8ece54-027fd9a2",
    "layer": "business",
    "keepAgent": {
      "className": "agent-quality-agent-7f8ece54-027fd9a2",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-quality-agent-7f8ece54-027fd9a2.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-quality-agent-7f8ece54-027fd9a2.ts",
    "agents": [
      {
        "className": "agent-quality-agent-7f8ece54-027fd9a2",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-quality-agent-7f8ece54-027fd9a2.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "htaccess-route-analyzer-agent-793e6bb5",
    "layer": "business",
    "keepAgent": {
      "className": "htaccess-route-analyzer-agent-793e6bb5",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/htaccess-route-analyzer-agent-793e6bb5.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/htaccess-route-analyzer-agent-793e6bb5.ts",
    "agents": [
      {
        "className": "htaccess-route-analyzer-agent-793e6bb5",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/htaccess-route-analyzer-agent-793e6bb5.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migration-strategist-agent-96302cb2",
    "layer": "business",
    "keepAgent": {
      "className": "migration-strategist-agent-96302cb2",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/migration-strategist-agent-96302cb2.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/migration-strategist-agent-96302cb2.ts",
    "agents": [
      {
        "className": "migration-strategist-agent-96302cb2",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/migration-strategist-agent-96302cb2.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-business-agent-9d8ecbba-6eeeeb28",
    "layer": "business",
    "keepAgent": {
      "className": "agent-business-agent-9d8ecbba-6eeeeb28",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-business-agent-9d8ecbba-6eeeeb28.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-business-agent-9d8ecbba-6eeeeb28.ts",
    "agents": [
      {
        "className": "agent-business-agent-9d8ecbba-6eeeeb28",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-business-agent-9d8ecbba-6eeeeb28.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "caddy-generator-agent-356493a8",
    "layer": "business",
    "keepAgent": {
      "className": "caddy-generator-agent-356493a8",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddy-generator-agent-356493a8.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/caddy-generator-agent-356493a8.ts",
    "agents": [
      {
        "className": "caddy-generator-agent-356493a8",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/caddy-generator-agent-356493a8.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "canonical-validator-agent-43a361a1",
    "layer": "business",
    "keepAgent": {
      "className": "canonical-validator-agent-43a361a1",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/canonical-validator-agent-43a361a1.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/canonical-validator-agent-43a361a1.ts",
    "agents": [
      {
        "className": "canonical-validator-agent-43a361a1",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/canonical-validator-agent-43a361a1.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-checker-agent-e31c7de0-fdd82467-84696944",
    "layer": "business",
    "keepAgent": {
      "className": "seo-checker-agent-e31c7de0-fdd82467-84696944",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-agent-e31c7de0-fdd82467-84696944.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-checker-agent-e31c7de0-fdd82467-84696944.ts",
    "agents": [
      {
        "className": "seo-checker-agent-e31c7de0-fdd82467-84696944",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-checker-agent-e31c7de0-fdd82467-84696944.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-integrator-agent-648e3433-830b728e",
    "layer": "business",
    "keepAgent": {
      "className": "dev-integrator-agent-648e3433-830b728e",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-integrator-agent-648e3433-830b728e.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/dev-integrator-agent-648e3433-830b728e.ts",
    "agents": [
      {
        "className": "dev-integrator-agent-648e3433-830b728e",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/dev-integrator-agent-648e3433-830b728e.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mediator-agent-092cc82f",
    "layer": "business",
    "keepAgent": {
      "className": "mediator-agent-092cc82f",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mediator-agent-092cc82f.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mediator-agent-092cc82f.ts",
    "agents": [
      {
        "className": "mediator-agent-092cc82f",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mediator-agent-092cc82f.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "consolidate-agents-3a5f6c7b",
    "layer": "business",
    "keepAgent": {
      "className": "consolidate-agents-3a5f6c7b",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/consolidate-agents-3a5f6c7b.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/consolidate-agents-3a5f6c7b.ts",
    "agents": [
      {
        "className": "consolidate-agents-3a5f6c7b",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/consolidate-agents-3a5f6c7b.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "debt-detector-agent-2cf1f086",
    "layer": "business",
    "keepAgent": {
      "className": "debt-detector-agent-2cf1f086",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/debt-detector-agent-2cf1f086.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/debt-detector-agent-2cf1f086.ts",
    "agents": [
      {
        "className": "debt-detector-agent-2cf1f086",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/debt-detector-agent-2cf1f086.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "discovery-agent-794064d6",
    "layer": "business",
    "keepAgent": {
      "className": "discovery-agent-794064d6",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/discovery-agent-794064d6.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/discovery-agent-794064d6.ts",
    "agents": [
      {
        "className": "discovery-agent-794064d6",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/discovery-agent-794064d6.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-verifier-agent-1c955b4f",
    "layer": "business",
    "keepAgent": {
      "className": "mcp-verifier-agent-1c955b4f",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifier-agent-1c955b4f.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mcp-verifier-agent-1c955b4f.ts",
    "agents": [
      {
        "className": "mcp-verifier-agent-1c955b4f",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mcp-verifier-agent-1c955b4f.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "data-verifier-agent-205f2ee3-14a53df1",
    "layer": "business",
    "keepAgent": {
      "className": "data-verifier-agent-205f2ee3-14a53df1",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-verifier-agent-205f2ee3-14a53df1.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/data-verifier-agent-205f2ee3-14a53df1.ts",
    "agents": [
      {
        "className": "data-verifier-agent-205f2ee3-14a53df1",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/data-verifier-agent-205f2ee3-14a53df1.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agentcontroller-12a77065",
    "layer": "business",
    "keepAgent": {
      "className": "agentcontroller-12a77065",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agentcontroller-12a77065.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agentcontroller-12a77065.ts",
    "agents": [
      {
        "className": "agentcontroller-12a77065",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agentcontroller-12a77065.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "devops-preview-agent-10aa63a3",
    "layer": "business",
    "keepAgent": {
      "className": "devops-preview-agent-10aa63a3",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/devops-preview-agent-10aa63a3.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/devops-preview-agent-10aa63a3.ts",
    "agents": [
      {
        "className": "devops-preview-agent-10aa63a3",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/devops-preview-agent-10aa63a3.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "implement-interfaces-agent-084503ba",
    "layer": "business",
    "keepAgent": {
      "className": "implement-interfaces-agent-084503ba",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/implement-interfaces-agent-084503ba.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/implement-interfaces-agent-084503ba.ts",
    "agents": [
      {
        "className": "implement-interfaces-agent-084503ba",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/implement-interfaces-agent-084503ba.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-audit-agent-06443f3d",
    "layer": "business",
    "keepAgent": {
      "className": "agent-audit-agent-06443f3d",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-audit-agent-06443f3d.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "packages/business/core/agent-audit-agent-06443f3d.ts",
    "agents": [
      {
        "className": "agent-audit-agent-06443f3d",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-audit-agent-06443f3d.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "table-cartographer-agent-454dcdff-a9aeece6",
    "layer": "business",
    "keepAgent": {
      "className": "table-cartographer-agent-454dcdff-a9aeece6",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/table-cartographer-agent-454dcdff-a9aeece6.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/table-cartographer-agent-454dcdff-a9aeece6.ts",
    "agents": [
      {
        "className": "table-cartographer-agent-454dcdff-a9aeece6",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/table-cartographer-agent-454dcdff-a9aeece6.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "postgresql-validator-agent-076bd659",
    "layer": "business",
    "keepAgent": {
      "className": "postgresql-validator-agent-076bd659",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/postgresql-validator-agent-076bd659.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/postgresql-validator-agent-076bd659.ts",
    "agents": [
      {
        "className": "postgresql-validator-agent-076bd659",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/postgresql-validator-agent-076bd659.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-migration-plan-agent-75ae79a0-3488ed02",
    "layer": "business",
    "keepAgent": {
      "className": "generate-migration-plan-agent-75ae79a0-3488ed02",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-migration-plan-agent-75ae79a0-3488ed02.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/generate-migration-plan-agent-75ae79a0-3488ed02.ts",
    "agents": [
      {
        "className": "generate-migration-plan-agent-75ae79a0-3488ed02",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/generate-migration-plan-agent-75ae79a0-3488ed02.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "coordinator-agent-20d3ca8a-38df9c83",
    "layer": "business",
    "keepAgent": {
      "className": "coordinator-agent-20d3ca8a-38df9c83",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/coordinator-agent-20d3ca8a-38df9c83.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/coordinator-agent-20d3ca8a-38df9c83.ts",
    "agents": [
      {
        "className": "coordinator-agent-20d3ca8a-38df9c83",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/coordinator-agent-20d3ca8a-38df9c83.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "remediator-agent-6393fbc0",
    "layer": "business",
    "keepAgent": {
      "className": "remediator-agent-6393fbc0",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remediator-agent-6393fbc0.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/remediator-agent-6393fbc0.ts",
    "agents": [
      {
        "className": "remediator-agent-6393fbc0",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/remediator-agent-6393fbc0.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "remix-route-generator-agent-6c186911-344343fe",
    "layer": "business",
    "keepAgent": {
      "className": "remix-route-generator-agent-6c186911-344343fe",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remix-route-generator-agent-6c186911-344343fe.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/remix-route-generator-agent-6c186911-344343fe.ts",
    "agents": [
      {
        "className": "remix-route-generator-agent-6c186911-344343fe",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/remix-route-generator-agent-6c186911-344343fe.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "nginx-config-parser-agent-1be409c7",
    "layer": "business",
    "keepAgent": {
      "className": "nginx-config-parser-agent-1be409c7",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/nginx-config-parser-agent-1be409c7.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/nginx-config-parser-agent-1be409c7.ts",
    "agents": [
      {
        "className": "nginx-config-parser-agent-1be409c7",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/nginx-config-parser-agent-1be409c7.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "data-agent-16b053b9",
    "layer": "business",
    "keepAgent": {
      "className": "data-agent-16b053b9",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-agent-16b053b9.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/data-agent-16b053b9.ts",
    "agents": [
      {
        "className": "data-agent-16b053b9",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/data-agent-16b053b9.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "validate-mcp-agents-0371f6e0-3786c841",
    "layer": "business",
    "keepAgent": {
      "className": "validate-mcp-agents-0371f6e0-3786c841",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/validate-mcp-agents-0371f6e0-3786c841.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/validate-mcp-agents-0371f6e0-3786c841.ts",
    "agents": [
      {
        "className": "validate-mcp-agents-0371f6e0-3786c841",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/validate-mcp-agents-0371f6e0-3786c841.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-checker-agent-0b4aadee-e425cd04-a6a7866d",
    "layer": "business",
    "keepAgent": {
      "className": "seo-checker-agent-0b4aadee-e425cd04-a6a7866d",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-agent-0b4aadee-e425cd04-a6a7866d.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-checker-agent-0b4aadee-e425cd04-a6a7866d.ts",
    "agents": [
      {
        "className": "seo-checker-agent-0b4aadee-e425cd04-a6a7866d",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-checker-agent-0b4aadee-e425cd04-a6a7866d.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "debt-analyzer-agent-2019bd5f",
    "layer": "business",
    "keepAgent": {
      "className": "debt-analyzer-agent-2019bd5f",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/debt-analyzer-agent-2019bd5f.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/debt-analyzer-agent-2019bd5f.ts",
    "agents": [
      {
        "className": "debt-analyzer-agent-2019bd5f",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/debt-analyzer-agent-2019bd5f.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "fix-agent-typescript-errors-2b878bf0-360ed3fb",
    "layer": "business",
    "keepAgent": {
      "className": "fix-agent-typescript-errors-2b878bf0-360ed3fb",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/fix-agent-typescript-errors-2b878bf0-360ed3fb.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/fix-agent-typescript-errors-2b878bf0-360ed3fb.ts",
    "agents": [
      {
        "className": "fix-agent-typescript-errors-2b878bf0-360ed3fb",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/fix-agent-typescript-errors-2b878bf0-360ed3fb.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "prisma-smart-generator-agent-36033951",
    "layer": "business",
    "keepAgent": {
      "className": "prisma-smart-generator-agent-36033951",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-smart-generator-agent-36033951.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/prisma-smart-generator-agent-36033951.ts",
    "agents": [
      {
        "className": "prisma-smart-generator-agent-36033951",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/prisma-smart-generator-agent-36033951.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "analyzer-agent-094d882a-45c18ba9",
    "layer": "business",
    "keepAgent": {
      "className": "analyzer-agent-094d882a-45c18ba9",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/analyzer-agent-094d882a-45c18ba9.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/analyzer-agent-094d882a-45c18ba9.ts",
    "agents": [
      {
        "className": "analyzer-agent-094d882a-45c18ba9",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/analyzer-agent-094d882a-45c18ba9.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-schema-5728cc32-04283494",
    "layer": "business",
    "keepAgent": {
      "className": "agent-schema-5728cc32-04283494",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-schema-5728cc32-04283494.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-schema-5728cc32-04283494.ts",
    "agents": [
      {
        "className": "agent-schema-5728cc32-04283494",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-schema-5728cc32-04283494.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migrate-agents-to-abstracts-66bee5ee-724759d2",
    "layer": "business",
    "keepAgent": {
      "className": "migrate-agents-to-abstracts-66bee5ee-724759d2",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/migrate-agents-to-abstracts-66bee5ee-724759d2.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/migrate-agents-to-abstracts-66bee5ee-724759d2.ts",
    "agents": [
      {
        "className": "migrate-agents-to-abstracts-66bee5ee-724759d2",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/migrate-agents-to-abstracts-66bee5ee-724759d2.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "sql-prisma-migration-planner-agent-881f54d1",
    "layer": "business",
    "keepAgent": {
      "className": "sql-prisma-migration-planner-agent-881f54d1",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-prisma-migration-planner-agent-881f54d1.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/sql-prisma-migration-planner-agent-881f54d1.ts",
    "agents": [
      {
        "className": "sql-prisma-migration-planner-agent-881f54d1",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/sql-prisma-migration-planner-agent-881f54d1.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "prisma-generator-agent-44c3dc90-807e97fa",
    "layer": "business",
    "keepAgent": {
      "className": "prisma-generator-agent-44c3dc90-807e97fa",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-generator-agent-44c3dc90-807e97fa.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/prisma-generator-agent-44c3dc90-807e97fa.ts",
    "agents": [
      {
        "className": "prisma-generator-agent-44c3dc90-807e97fa",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/prisma-generator-agent-44c3dc90-807e97fa.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-checker-seo-checker-agent-2022462f-78e88eb5",
    "layer": "business",
    "keepAgent": {
      "className": "seo-checker-seo-checker-agent-2022462f-78e88eb5",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-seo-checker-agent-2022462f-78e88eb5.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-checker-seo-checker-agent-2022462f-78e88eb5.ts",
    "agents": [
      {
        "className": "seo-checker-seo-checker-agent-2022462f-78e88eb5",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-checker-seo-checker-agent-2022462f-78e88eb5.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "schema-agent-107d31c5",
    "layer": "business",
    "keepAgent": {
      "className": "schema-agent-107d31c5",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/schema-agent-107d31c5.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/schema-agent-107d31c5.ts",
    "agents": [
      {
        "className": "schema-agent-107d31c5",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/schema-agent-107d31c5.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generator-agent-6252e966",
    "layer": "business",
    "keepAgent": {
      "className": "generator-agent-6252e966",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generator-agent-6252e966.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/generator-agent-6252e966.ts",
    "agents": [
      {
        "className": "generator-agent-6252e966",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/generator-agent-6252e966.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base-agent-0b16ac1a",
    "layer": "business",
    "keepAgent": {
      "className": "base-agent-0b16ac1a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/base-agent-0b16ac1a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/base-agent-0b16ac1a.ts",
    "agents": [
      {
        "className": "base-agent-0b16ac1a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/base-agent-0b16ac1a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-audit-agent-60432969-0c5b4fb2",
    "layer": "business",
    "keepAgent": {
      "className": "type-audit-agent-60432969-0c5b4fb2",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-audit-agent-60432969-0c5b4fb2.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/type-audit-agent-60432969-0c5b4fb2.ts",
    "agents": [
      {
        "className": "type-audit-agent-60432969-0c5b4fb2",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/type-audit-agent-60432969-0c5b4fb2.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-agent-manifest-1f2de883-29d287e7",
    "layer": "business",
    "keepAgent": {
      "className": "generate-agent-manifest-1f2de883-29d287e7",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-agent-manifest-1f2de883-29d287e7.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/generate-agent-manifest-1f2de883-29d287e7.ts",
    "agents": [
      {
        "className": "generate-agent-manifest-1f2de883-29d287e7",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/generate-agent-manifest-1f2de883-29d287e7.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "schema-analyzer-agent-15883c46",
    "layer": "business",
    "keepAgent": {
      "className": "schema-analyzer-agent-15883c46",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/schema-analyzer-agent-15883c46.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/schema-analyzer-agent-15883c46.ts",
    "agents": [
      {
        "className": "schema-analyzer-agent-15883c46",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/schema-analyzer-agent-15883c46.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-checker-agent-16f12a13",
    "layer": "business",
    "keepAgent": {
      "className": "dev-checker-agent-16f12a13",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-checker-agent-16f12a13.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/dev-checker-agent-16f12a13.ts",
    "agents": [
      {
        "className": "dev-checker-agent-16f12a13",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/dev-checker-agent-16f12a13.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-mcp-controller-agent-11f44af0",
    "layer": "business",
    "keepAgent": {
      "className": "seo-mcp-controller-agent-11f44af0",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-mcp-controller-agent-11f44af0.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/seo-mcp-controller-agent-11f44af0.ts",
    "agents": [
      {
        "className": "seo-mcp-controller-agent-11f44af0",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/seo-mcp-controller-agent-11f44af0.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-verifierworker-agent-1b1c0d93-37a729a4",
    "layer": "business",
    "keepAgent": {
      "className": "mcp-verifierworker-agent-1b1c0d93-37a729a4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifierworker-agent-1b1c0d93-37a729a4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mcp-verifierworker-agent-1b1c0d93-37a729a4.ts",
    "agents": [
      {
        "className": "mcp-verifierworker-agent-1b1c0d93-37a729a4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mcp-verifierworker-agent-1b1c0d93-37a729a4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-agentd-75c1c297",
    "layer": "business",
    "keepAgent": {
      "className": "mcp-agentd-75c1c297",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-agentd-75c1c297.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mcp-agentd-75c1c297.ts",
    "agents": [
      {
        "className": "mcp-agentd-75c1c297",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mcp-agentd-75c1c297.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "component-generator-agent-24dcb508",
    "layer": "business",
    "keepAgent": {
      "className": "component-generator-agent-24dcb508",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/component-generator-agent-24dcb508.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/component-generator-agent-24dcb508.ts",
    "agents": [
      {
        "className": "component-generator-agent-24dcb508",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/component-generator-agent-24dcb508.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "sql-analyzerprisma-builder-agent-40e202ca",
    "layer": "business",
    "keepAgent": {
      "className": "sql-analyzerprisma-builder-agent-40e202ca",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-analyzerprisma-builder-agent-40e202ca.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/sql-analyzerprisma-builder-agent-40e202ca.ts",
    "agents": [
      {
        "className": "sql-analyzerprisma-builder-agent-40e202ca",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/sql-analyzerprisma-builder-agent-40e202ca.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base-agentd-42157dfb-1537c859",
    "layer": "business",
    "keepAgent": {
      "className": "base-agentd-42157dfb-1537c859",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/base-agentd-42157dfb-1537c859.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/base-agentd-42157dfb-1537c859.ts",
    "agents": [
      {
        "className": "base-agentd-42157dfb-1537c859",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/base-agentd-42157dfb-1537c859.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mysql-to-pg-agent-013e84ce",
    "layer": "business",
    "keepAgent": {
      "className": "mysql-to-pg-agent-013e84ce",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-to-pg-agent-013e84ce.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mysql-to-pg-agent-013e84ce.ts",
    "agents": [
      {
        "className": "mysql-to-pg-agent-013e84ce",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mysql-to-pg-agent-013e84ce.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-runner-2afd4b00",
    "layer": "business",
    "keepAgent": {
      "className": "agent-runner-2afd4b00",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-runner-2afd4b00.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-runner-2afd4b00.ts",
    "agents": [
      {
        "className": "agent-runner-2afd4b00",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-runner-2afd4b00.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "php-router-audit-agent-18eea54a",
    "layer": "business",
    "keepAgent": {
      "className": "php-router-audit-agent-18eea54a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-router-audit-agent-18eea54a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/php-router-audit-agent-18eea54a.ts",
    "agents": [
      {
        "className": "php-router-audit-agent-18eea54a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/php-router-audit-agent-18eea54a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "php-analyzer-agent-907ad6a3",
    "layer": "business",
    "keepAgent": {
      "className": "php-analyzer-agent-907ad6a3",
      "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/php-analyzer-agent-907ad6a3.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "packages/business/core/php-analyzer-agent-907ad6a3.ts",
    "agents": [
      {
        "className": "php-analyzer-agent-907ad6a3",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-analyzer-agent-907ad6a3.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-migration-analyzer-031d45d2-8da1b03b",
    "layer": "business",
    "keepAgent": {
      "className": "agent-migration-analyzer-031d45d2-8da1b03b",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-migration-analyzer-031d45d2-8da1b03b.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-migration-analyzer-031d45d2-8da1b03b.ts",
    "agents": [
      {
        "className": "agent-migration-analyzer-031d45d2-8da1b03b",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-migration-analyzer-031d45d2-8da1b03b.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "nginx-config-analyzer-agent-006eb064-41f40d91",
    "layer": "business",
    "keepAgent": {
      "className": "nginx-config-analyzer-agent-006eb064-41f40d91",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/nginx-config-analyzer-agent-006eb064-41f40d91.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/nginx-config-analyzer-agent-006eb064-41f40d91.ts",
    "agents": [
      {
        "className": "nginx-config-analyzer-agent-006eb064-41f40d91",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/nginx-config-analyzer-agent-006eb064-41f40d91.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mysql-analyzer-agent-826f5bf4",
    "layer": "business",
    "keepAgent": {
      "className": "mysql-analyzer-agent-826f5bf4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-analyzer-agent-826f5bf4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mysql-analyzer-agent-826f5bf4.ts",
    "agents": [
      {
        "className": "mysql-analyzer-agent-826f5bf4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mysql-analyzer-agent-826f5bf4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent8-optimizer-agent-29cab73f",
    "layer": "business",
    "keepAgent": {
      "className": "agent8-optimizer-agent-29cab73f",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent8-optimizer-agent-29cab73f.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent8-optimizer-agent-29cab73f.ts",
    "agents": [
      {
        "className": "agent8-optimizer-agent-29cab73f",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent8-optimizer-agent-29cab73f.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "analyze-security-risks-agent-0c036604",
    "layer": "business",
    "keepAgent": {
      "className": "analyze-security-risks-agent-0c036604",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/analyze-security-risks-agent-0c036604.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/analyze-security-risks-agent-0c036604.ts",
    "agents": [
      {
        "className": "analyze-security-risks-agent-0c036604",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/analyze-security-risks-agent-0c036604.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "php-analyzer-v4-agent-6eb859a5-39d911bd",
    "layer": "business",
    "keepAgent": {
      "className": "php-analyzer-v4-agent-6eb859a5-39d911bd",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-analyzer-v4-agent-6eb859a5-39d911bd.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/php-analyzer-v4-agent-6eb859a5-39d911bd.ts",
    "agents": [
      {
        "className": "php-analyzer-v4-agent-6eb859a5-39d911bd",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/php-analyzer-v4-agent-6eb859a5-39d911bd.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-interface-validator-105e77f4",
    "layer": "business",
    "keepAgent": {
      "className": "agent-interface-validator-105e77f4",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-interface-validator-105e77f4.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-interface-validator-105e77f4.ts",
    "agents": [
      {
        "className": "agent-interface-validator-105e77f4",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-interface-validator-105e77f4.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "diff-verifier-agent-b331f606-611c68e7",
    "layer": "business",
    "keepAgent": {
      "className": "diff-verifier-agent-b331f606-611c68e7",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/diff-verifier-agent-b331f606-611c68e7.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/diff-verifier-agent-b331f606-611c68e7.ts",
    "agents": [
      {
        "className": "diff-verifier-agent-b331f606-611c68e7",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/diff-verifier-agent-b331f606-611c68e7.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-agent-9ecdee32",
    "layer": "business",
    "keepAgent": {
      "className": "mcp-agent-9ecdee32",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-agent-9ecdee32.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/mcp-agent-9ecdee32.ts",
    "agents": [
      {
        "className": "mcp-agent-9ecdee32",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/mcp-agent-9ecdee32.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-structure-agent-1ae26cce",
    "layer": "business",
    "keepAgent": {
      "className": "agent-structure-agent-1ae26cce",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-structure-agent-1ae26cce.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-structure-agent-1ae26cce.ts",
    "agents": [
      {
        "className": "agent-structure-agent-1ae26cce",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-structure-agent-1ae26cce.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "pipeline-strategy-auditor-agent-3709eb21-d25bf868",
    "layer": "business",
    "keepAgent": {
      "className": "pipeline-strategy-auditor-agent-3709eb21-d25bf868",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pipeline-strategy-auditor-agent-3709eb21-d25bf868.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/pipeline-strategy-auditor-agent-3709eb21-d25bf868.ts",
    "agents": [
      {
        "className": "pipeline-strategy-auditor-agent-3709eb21-d25bf868",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/pipeline-strategy-auditor-agent-3709eb21-d25bf868.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-auditor-agent-0aeccfd6",
    "layer": "business",
    "keepAgent": {
      "className": "type-auditor-agent-0aeccfd6",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-auditor-agent-0aeccfd6.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/type-auditor-agent-0aeccfd6.ts",
    "agents": [
      {
        "className": "type-auditor-agent-0aeccfd6",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/type-auditor-agent-0aeccfd6.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "parser-agent-66bf5a37",
    "layer": "business",
    "keepAgent": {
      "className": "parser-agent-66bf5a37",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/parser-agent-66bf5a37.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/parser-agent-66bf5a37.ts",
    "agents": [
      {
        "className": "parser-agent-66bf5a37",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/parser-agent-66bf5a37.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-agent-manifest",
    "layer": "business",
    "keepAgent": {
      "className": "generate-agent-manifest",
      "filePath": "/workspaces/cahier-des-charge/packages/business/generators/generate-agent-manifest.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/generate-agent-manifest.ts",
    "agents": [
      {
        "className": "generate-agent-manifest",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-agent-manifest.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "memo-agent",
    "layer": "business",
    "keepAgent": {
      "className": "memo-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/memo-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/memo-agent.ts",
    "agents": [
      {
        "className": "memo-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/memo-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "smart-analyzer-agent",
    "layer": "business",
    "keepAgent": {
      "className": "smart-analyzer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/smart-analyzer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/smart-analyzer-agent.ts",
    "agents": [
      {
        "className": "smart-analyzer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/agents/examples/smart-analyzer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base-memo-agent",
    "layer": "business",
    "keepAgent": {
      "className": "base-memo-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/base-memo-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/base-memo-agent.ts",
    "agents": [
      {
        "className": "base-memo-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/agents/base-memo-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base-validator-agent",
    "layer": "business",
    "keepAgent": {
      "className": "base-validator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/base-validator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/base-validator-agent.ts",
    "agents": [
      {
        "className": "base-validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/business/validators/base-validator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "business-agent",
    "layer": "business",
    "keepAgent": {
      "className": "business-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/business-agent.ts",
      "sourceFolder": "packages/core",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/business-agent.ts",
    "agents": [
      {
        "className": "business-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/businessagent/business-agent.ts",
        "action": "migrate"
      },
      {
        "className": "business-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/business-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-business-agent",
    "layer": "business",
    "keepAgent": {
      "className": "agent-business-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-business-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "packages/business/core/agent-business-agent.ts",
    "agents": [
      {
        "className": "agent-business-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/agent-business-agent/agent-business-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "layered-agent-registry-05710bba",
    "layer": "mixed",
    "keepAgent": {
      "className": "layered-agent-registry-05710bba",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/layered-agent-registry-05710bba.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/layered-agent-registry-05710bba.ts",
    "agents": [
      {
        "className": "layered-agent-registry-05710bba",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/layered-agent-registry-05710bba.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "orchestrator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "orchestrator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/orchestrator-agent.ts",
      "sourceFolder": "packages/core",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/orchestrator-agent.ts",
    "agents": [
      {
        "className": "orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/orchestration/orchestrator/orchestrator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/orchestrator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/orchestrator/orchestrator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator-agent/orchestrator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-orchestrator-agent-63c2b23c-4896cc05",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-orchestrator-agent-63c2b23c-4896cc05",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/agent-orchestrator-agent-63c2b23c-4896cc05.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/agent-orchestrator-agent-63c2b23c-4896cc05.ts",
    "agents": [
      {
        "className": "agent-orchestrator-agent-63c2b23c-4896cc05",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-orchestrator-agent-63c2b23c-4896cc05.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "scheduler-agent-2f3b04d3",
    "layer": "mixed",
    "keepAgent": {
      "className": "scheduler-agent-2f3b04d3",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/scheduler-agent-2f3b04d3.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/scheduler-agent-2f3b04d3.ts",
    "agents": [
      {
        "className": "scheduler-agent-2f3b04d3",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/scheduler-agent-2f3b04d3.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "bullmq-orchestrator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "bullmq-orchestrator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/bullmq-orchestrator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/bullmq-orchestrator-agent.ts",
    "agents": [
      {
        "className": "bullmq-orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bullmq-orchestrator-agent/bullmq-orchestrator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "orchestrator-agent-079b99f7",
    "layer": "mixed",
    "keepAgent": {
      "className": "orchestrator-agent-079b99f7",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/orchestrator-agent-079b99f7.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/orchestrator-agent-079b99f7.ts",
    "agents": [
      {
        "className": "orchestrator-agent-079b99f7",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/orchestrator-agent-079b99f7.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "monitoring-check-agent-a2bc802a",
    "layer": "mixed",
    "keepAgent": {
      "className": "monitoring-check-agent-a2bc802a",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitoring-check-agent-a2bc802a.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitoring-check-agent-a2bc802a.ts",
    "agents": [
      {
        "className": "monitoring-check-agent-a2bc802a",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/monitoring-check-agent-a2bc802a.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migration-orchestrator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "migration-orchestrator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/migration-orchestrator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/migration-orchestrator-agent.ts",
    "agents": [
      {
        "className": "migration-orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/migration-orchestrator-agent/migration-orchestrator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "monitor-agent-3a930372",
    "layer": "mixed",
    "keepAgent": {
      "className": "monitor-agent-3a930372",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitor-agent-3a930372.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitor-agent-3a930372.ts",
    "agents": [
      {
        "className": "monitor-agent-3a930372",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/monitor-agent-3a930372.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-orchestrator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-orchestrator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/agent-orchestrator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/agent-orchestrator-agent.ts",
    "agents": [
      {
        "className": "agent-orchestrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/agentorchestratoragent/agent-orchestrator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "bullmq-orchestrator-agent-072dc935",
    "layer": "mixed",
    "keepAgent": {
      "className": "bullmq-orchestrator-agent-072dc935",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/bullmq-orchestrator-agent-072dc935.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/bullmq-orchestrator-agent-072dc935.ts",
    "agents": [
      {
        "className": "bullmq-orchestrator-agent-072dc935",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/bullmq-orchestrator-agent-072dc935.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "monitoring-check-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "monitoring-check-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitoring-check-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitoring-check-agent.ts",
    "agents": [
      {
        "className": "monitoring-check-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/monitoring-check-agent/monitoring-check-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migration-orchestrator-agent-02f58fee",
    "layer": "mixed",
    "keepAgent": {
      "className": "migration-orchestrator-agent-02f58fee",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/migration-orchestrator-agent-02f58fee.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/migration-orchestrator-agent-02f58fee.ts",
    "agents": [
      {
        "className": "migration-orchestrator-agent-02f58fee",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/migration-orchestrator-agent-02f58fee.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "base-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/coordination/interfaces/base-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/business/coordination/interfaces/base-agent.ts",
    "agents": [
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/base-agent.ts",
        "action": "migrate"
      },
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/business/agents/base-agent/base-agent.ts",
        "action": "migrate"
      },
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/base-agent.ts",
        "action": "migrate"
      },
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/base/base-agent.ts",
        "action": "migrate"
      },
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/baseagent/base-agent.ts",
        "action": "migrate"
      },
      {
        "className": "base-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/base-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "implement-interfaces-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "implement-interfaces-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/implement-interfaces-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/implement-interfaces-agent.ts",
    "agents": [
      {
        "className": "implement-interfaces-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/coordination/interfaces/implement-interfaces-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "adapter-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "adapter-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/adapter/adapter-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/adapter/adapter-agent.ts",
    "agents": [
      {
        "className": "adapter-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/coordination/adapter-agent.ts",
        "action": "migrate"
      },
      {
        "className": "adapter-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/adapter-agent.ts",
        "action": "migrate"
      },
      {
        "className": "adapter-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/adapter/adapter-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mediator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mediator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/mediator/mediator-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/mediator/mediator-agent.ts",
    "agents": [
      {
        "className": "mediator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mediator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "base",
    "layer": "mixed",
    "keepAgent": {
      "className": "BaseAgent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/src/coordination/interfaces/BaseAgent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/business/src/coordination/interfaces/BaseAgent.ts",
    "agents": [
      {
        "className": "BaseAgent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/BaseAgent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "bridge-agent-860b8037-4f7fa96e",
    "layer": "mixed",
    "keepAgent": {
      "className": "bridge-agent-860b8037-4f7fa96e",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/bridge-agent-860b8037-4f7fa96e.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/bridge-agent-860b8037-4f7fa96e.ts",
    "agents": [
      {
        "className": "bridge-agent-860b8037-4f7fa96e",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/bridge-agent-860b8037-4f7fa96e.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-registry-502b4731",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-registry-502b4731",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/agent-registry-502b4731.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/agent-registry-502b4731.ts",
    "agents": [
      {
        "className": "agent-registry-502b4731",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-registry-502b4731.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-1d488289",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-1d488289",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/agent-1d488289.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/agent-1d488289.ts",
    "agents": [
      {
        "className": "agent-1d488289",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/agent/agent-1d488289.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "analyzer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "analyzer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/business/analyzers/analyzer-agent.ts",
      "sourceFolder": "packages/business",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/business/analyzers/analyzer-agent.ts",
    "agents": [
      {
        "className": "analyzer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/business/analyzer/analyzer-agent.ts",
        "action": "migrate"
      },
      {
        "className": "analyzer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/analyzer-agent.ts",
        "action": "migrate"
      },
      {
        "className": "analyzer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/analyzer/analyzer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-checker-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-checker-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-agent.ts",
    "agents": [
      {
        "className": "seo-checker-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/business/validators/seo-checker/seo-checker-agent.ts",
        "action": "migrate"
      },
      {
        "className": "seo-checker-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/business/validators/seo-checker-agent/seo-checker-agent.ts",
        "action": "migrate"
      },
      {
        "className": "seo-checker-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "parser-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "parser-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/parser-agent.ts",
      "sourceFolder": "packages/core",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/parser-agent.ts",
    "agents": [
      {
        "className": "parser-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/business/parser/parser-agent.ts",
        "action": "migrate"
      },
      {
        "className": "parser-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/parser-agent.ts",
        "action": "migrate"
      },
      {
        "className": "parser-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/parser-agent/parser-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/generator-agent.ts",
      "sourceFolder": "packages/core",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/generator-agent.ts",
    "agents": [
      {
        "className": "generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/business/generator/generator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/generator/generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "validator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "validator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/validator-agent.ts",
      "sourceFolder": "packages/core",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/validator-agent.ts",
    "agents": [
      {
        "className": "validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/business/validator/validator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/validator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/validator/validator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "abstract-analyzer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "abstract-analyzer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agent.ts",
    "agents": [
      {
        "className": "abstract-analyzer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/src/abstract-analyzer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "remediator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "remediator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remediator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remediator-agent.ts",
    "agents": [
      {
        "className": "remediator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/remediator-agent/remediator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "helpers-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "helpers-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/helpers-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/helpers-agent.ts",
    "agents": [
      {
        "className": "helpers-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/helpers-agent/helpers-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-loader",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-loader",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-loader.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-loader.ts",
    "agents": [
      {
        "className": "agent-loader",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/agent-loader.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "devops-preview-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "devops-preview-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/devops-preview-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/devops-preview-agent.ts",
    "agents": [
      {
        "className": "devops-preview-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/devops-preview-agent/devops-preview-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-quality-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-quality-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-quality-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-quality-agent.ts",
    "agents": [
      {
        "className": "agent-quality-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/agent-quality-agent/agent-quality-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "auto-pr-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "auto-pr-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/auto-pr-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/auto-pr-agent.ts",
    "agents": [
      {
        "className": "auto-pr-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/auto-pr-agent/auto-pr-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-mcp-controller-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-mcp-controller-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-mcp-controller-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-mcp-controller-agent.ts",
    "agents": [
      {
        "className": "seo-mcp-controller-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-mcp-controller-agent/seo-mcp-controller-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent8-optimizer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent8-optimizer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent8-optimizer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent8-optimizer-agent.ts",
    "agents": [
      {
        "className": "agent8-optimizer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/agent8-optimizer-agent/agent8-optimizer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "canonical-validator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "canonical-validator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/canonical-validator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/canonical-validator-agent.ts",
    "agents": [
      {
        "className": "canonical-validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical-validator-agent/canonical-validator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-audit-runner-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-audit-runner-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-audit-runner-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-audit-runner-agent.ts",
    "agents": [
      {
        "className": "seo-audit-runner-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-audit-runner-agent/seo-audit-runner-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dependency-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "dependency-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dependency-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dependency-agent.ts",
    "agents": [
      {
        "className": "dependency-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/dependency-agent/dependency-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "caddy-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "caddy-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddy-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddy-generator-agent.ts",
    "agents": [
      {
        "className": "caddy-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddygeneratoragent/caddy-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "table-cartographer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "table-cartographer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/table-cartographer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/table-cartographer-agent.ts",
    "agents": [
      {
        "className": "table-cartographer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/table-cartographer-agent/table-cartographer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "php-router-audit-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "php-router-audit-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-router-audit-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/php-router-audit-agent.ts",
    "agents": [
      {
        "className": "php-router-audit-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/php-router-audit-agent/php-router-audit-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "caddyfile-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "caddyfile-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddyfile-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/caddyfile-generator-agent.ts",
    "agents": [
      {
        "className": "caddyfile-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfilegeneratoragent/caddyfile-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "status-writer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "status-writer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/status-writer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/status-writer-agent.ts",
    "agents": [
      {
        "className": "status-writer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/status-writer-agent/status-writer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "sql-debt-audit-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "sql-debt-audit-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-debt-audit-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-debt-audit-agent.ts",
    "agents": [
      {
        "className": "sql-debt-audit-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/sql-debt-audit-agent/sql-debt-audit-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "pr-creator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "pr-creator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pr-creator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pr-creator-agent.ts",
    "agents": [
      {
        "className": "pr-creator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/pr-creator-agent/pr-creator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "qa-confirmer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "qa-confirmer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/qa-confirmer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/qa-confirmer-agent.ts",
    "agents": [
      {
        "className": "qa-confirmer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/qa-confirmer-agent/qa-confirmer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "analyze-security-risks-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "analyze-security-risks-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/analyze-security-risks-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/analyze-security-risks-agent.ts",
    "agents": [
      {
        "className": "analyze-security-risks-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/analyze-security-risks-agent/analyze-security-risks-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "structure-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "structure-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/structure-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/structure-agent.ts",
    "agents": [
      {
        "className": "structure-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/structure-agent/structure-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "dev-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-generator-agent.ts",
    "agents": [
      {
        "className": "dev-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/devgeneratoragent/dev-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-integrator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "dev-integrator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-integrator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-integrator-agent.ts",
    "agents": [
      {
        "className": "dev-integrator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/dev-integrator-agent/dev-integrator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "agent-structure-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "agent-structure-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-structure-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/agent-structure-agent.ts",
    "agents": [
      {
        "className": "agent-structure-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/agent-structure-agent/agent-structure-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "postgresql-validator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "postgresql-validator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/postgresql-validator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/postgresql-validator-agent.ts",
    "agents": [
      {
        "className": "postgresql-validator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/validators/postgresql-validator-agent/postgresql-validator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-audit-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "type-audit-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-audit-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-audit-agent.ts",
    "agents": [
      {
        "className": "type-audit-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/type-audit-agent/type-audit-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-content-enhancer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-content-enhancer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-content-enhancer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-content-enhancer-agent.ts",
    "agents": [
      {
        "className": "seo-content-enhancer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-content-enhancer-agent/seo-content-enhancer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "meta-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "meta-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/meta-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/meta-generator-agent.ts",
    "agents": [
      {
        "className": "meta-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/metageneratoragent/meta-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "htaccess-parser-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "htaccess-parser-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/htaccess-parser-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/htaccess-parser-agent.ts",
    "agents": [
      {
        "className": "htaccess-parser-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/htaccess-parser-agent/htaccess-parser-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-verifier-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mcp-verifier-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifier-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifier-agent.ts",
    "agents": [
      {
        "className": "mcp-verifier-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/mcp-verifier-agent/mcp-verifier-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "prisma-smart-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "prisma-smart-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-smart-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-smart-generator-agent.ts",
    "agents": [
      {
        "className": "prisma-smart-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/prismasmartgeneratoragent/prisma-smart-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-migration-plan-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "generate-migration-plan-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-migration-plan-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-migration-plan-agent.ts",
    "agents": [
      {
        "className": "generate-migration-plan-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/generatemigrationplanagent/generate-migration-plan-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "generate-prisma-model-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "generate-prisma-model-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-prisma-model-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-prisma-model-agent.ts",
    "agents": [
      {
        "className": "generate-prisma-model-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/generateprismamodelagent/generate-prisma-model-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "debt-detector-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "debt-detector-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/debt-detector-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/debt-detector-agent.ts",
    "agents": [
      {
        "className": "debt-detector-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/debt-detector-agent/debt-detector-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-auditor-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "type-auditor-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-auditor-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-auditor-agent.ts",
    "agents": [
      {
        "className": "type-auditor-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/type-auditor-agent/type-auditor-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "data-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "data-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-agent.ts",
    "agents": [
      {
        "className": "data-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/data-agent/data-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-metagenerator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-metagenerator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-metagenerator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-metagenerator-agent.ts",
    "agents": [
      {
        "className": "seo-metagenerator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/seometageneratoragent/seo-metagenerator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "data-verifier-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "data-verifier-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-verifier-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/data-verifier-agent.ts",
    "agents": [
      {
        "className": "data-verifier-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/data-verifier-agent/data-verifier-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-manifest-manager-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mcp-manifest-manager-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-manifest-manager-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-manifest-manager-agent.ts",
    "agents": [
      {
        "className": "mcp-manifest-manager-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/mcp-manifest-manager-agent/mcp-manifest-manager-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "metrics-service-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "metrics-service-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/metrics-service-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/metrics-service-agent.ts",
    "agents": [
      {
        "className": "metrics-service-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/metrics-service-agent/metrics-service-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "pipeline-strategy-auditor-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "pipeline-strategy-auditor-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pipeline-strategy-auditor-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/pipeline-strategy-auditor-agent.ts",
    "agents": [
      {
        "className": "pipeline-strategy-auditor-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/pipeline-strategy-auditor-agent/pipeline-strategy-auditor-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "relational-normalizer-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "relational-normalizer-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/relational-normalizer-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/relational-normalizer-agent.ts",
    "agents": [
      {
        "className": "relational-normalizer-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/relational-normalizer-agent/relational-normalizer-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "prisma-migration-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "prisma-migration-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-migration-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/prisma-migration-generator-agent.ts",
    "agents": [
      {
        "className": "prisma-migration-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/prismamigrationgeneratoragent/prisma-migration-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "discovery-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "discovery-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/discovery-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/discovery-agent.ts",
    "agents": [
      {
        "className": "discovery-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/discovery-agent/discovery-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mcp-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-agent.ts",
    "agents": [
      {
        "className": "mcp-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/mcp-agent.ts",
        "action": "migrate"
      },
      {
        "className": "mcp-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/src/mcp-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "audit-selector-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "audit-selector-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/audit-selector-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/audit-selector-agent.ts",
    "agents": [
      {
        "className": "audit-selector-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/audit-selector-agent/audit-selector-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "semantic-table-mapper-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "semantic-table-mapper-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/semantic-table-mapper-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/semantic-table-mapper-agent.ts",
    "agents": [
      {
        "className": "semantic-table-mapper-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/semantic-table-mapper-agent/semantic-table-mapper-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "quality-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "quality-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/quality-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/quality-agent.ts",
    "agents": [
      {
        "className": "quality-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qualityagent/quality-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mysql-to-pg-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mysql-to-pg-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-to-pg-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-to-pg-agent.ts",
    "agents": [
      {
        "className": "mysql-to-pg-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/mysql-to-pg-agent/mysql-to-pg-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "canonical-sync-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "canonical-sync-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/canonical-sync-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/canonical-sync-agent.ts",
    "agents": [
      {
        "className": "canonical-sync-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/canonicalsyncagent/canonical-sync-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-converter-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "type-converter-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-converter-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-converter-agent.ts",
    "agents": [
      {
        "className": "type-converter-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/type-converter-agent/type-converter-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "nginx-config-parser-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "nginx-config-parser-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/nginx-config-parser-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/nginx-config-parser-agent.ts",
    "agents": [
      {
        "className": "nginx-config-parser-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/nginx-config-parser-agent/nginx-config-parser-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-linter-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "dev-linter-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-linter-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-linter-agent.ts",
    "agents": [
      {
        "className": "dev-linter-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/dev-linter-agent/dev-linter-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-checker-canonical-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-checker-canonical-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-canonical-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-checker-canonical-agent.ts",
    "agents": [
      {
        "className": "seo-checker-canonical-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-checker-canonical-agent/seo-checker-canonical-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "seo-redirect-mapper-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "seo-redirect-mapper-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-redirect-mapper-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/seo-redirect-mapper-agent.ts",
    "agents": [
      {
        "className": "seo-redirect-mapper-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/seo-redirect-mapper-agent/seo-redirect-mapper-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "dev-checker-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "dev-checker-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-checker-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/dev-checker-agent.ts",
    "agents": [
      {
        "className": "dev-checker-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/dev-checker-agent/dev-checker-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "type-mapper-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "type-mapper-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-mapper-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/type-mapper-agent.ts",
    "agents": [
      {
        "className": "type-mapper-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/type-mapper-agent/type-mapper-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "diff-verifier-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "diff-verifier-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/diff-verifier-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/diff-verifier-agent.ts",
    "agents": [
      {
        "className": "diff-verifier-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/diff-verifier-agent/diff-verifier-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "progressive-migration-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "progressive-migration-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/progressive-migration-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/progressive-migration-agent.ts",
    "agents": [
      {
        "className": "progressive-migration-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/progressive-migration-agent/progressive-migration-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "migration-strategist-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "migration-strategist-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/migration-strategist-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/migration-strategist-agent.ts",
    "agents": [
      {
        "className": "migration-strategist-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/migration-strategist-agent/migration-strategist-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mcp-verifierworker-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mcp-verifierworker-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifierworker-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mcp-verifierworker-agent.ts",
    "agents": [
      {
        "className": "mcp-verifierworker-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/mcp-verifier-dotworker-agent/mcp-verifierworker-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "mysql-to-postgresql-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "mysql-to-postgresql-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-to-postgresql-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/mysql-to-postgresql-agent.ts",
    "agents": [
      {
        "className": "mysql-to-postgresql-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/mysql-to-postgresql-agent/mysql-to-postgresql-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "coordinator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "coordinator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/coordinator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-07"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/coordinator-agent.ts",
    "agents": [
      {
        "className": "coordinator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/coordinator-agent/coordinator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "sql-prisma-migration-planner-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "sql-prisma-migration-planner-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-prisma-migration-planner-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/sql-prisma-migration-planner-agent.ts",
    "agents": [
      {
        "className": "sql-prisma-migration-planner-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/sql-prisma-migration-planner-agent/sql-prisma-migration-planner-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "remix-route-generator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "remix-route-generator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remix-route-generator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/remix-route-generator-agent.ts",
    "agents": [
      {
        "className": "remix-route-generator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/generators/remixroutegeneratoragent/remix-route-generator-agent.ts",
        "action": "migrate"
      }
    ]
  },
  {
    "group": "consolidator-agent",
    "layer": "mixed",
    "keepAgent": {
      "className": "consolidator-agent",
      "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/consolidator-agent.ts",
      "sourceFolder": "packages/migrated-agents",
      "modifiedDate": "2025-05-08"
    },
    "targetPath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/consolidator-agent.ts",
    "agents": [
      {
        "className": "consolidator-agent",
        "filePath": "/workspaces/cahier-des-charge/packages/mcp-agents/misc/consolidator-agent/consolidator-agent.ts",
        "action": "migrate"
      },
      {
        "className": "Date",
        "filePath": "Agent",
        "action": "migrate"
      },
      {
        "className": "2025-05-08",
        "filePath": "_exemple_",
        "action": "migrate"
      }
    ]
  }
];

// Fonction principale
async function migrateAgents() {
  console.log('Début de la migration des agents...');
  
  // Créer les dossiers cibles
  await createTargetFolders();
  
  // Pour chaque action de consolidation
  for (const action of consolidationActions) {
    console.log(`\nConsolidation du groupe "${action.group}"...`);
    
    // Vérifier que l'agent à conserver existe
    const keepFilePath = action.keepAgent.filePath;
    if (!fs.existsSync(keepFilePath)) {
      console.error(`L'agent à conserver n'existe pas: ${keepFilePath}`);
      continue;
    }
    
    // Déplacer l'agent vers l'emplacement cible si nécessaire
    const targetPath = action.targetPath;
    if (keepFilePath !== targetPath) {
      console.log(`Déplacement de ${keepFilePath} vers ${targetPath}`);
      
      // Créer le dossier cible s'il n'existe pas
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copier le fichier vers l'emplacement cible
      fs.copyFileSync(keepFilePath, targetPath);
      
      // TODO: Mettre à jour les imports dans le fichier cible
    }
    
    // Pour chaque agent à migrer
    for (const agent of action.agents) {
      if (agent.action === 'migrate') {
        console.log(`Migration de ${agent.filePath}...`);
        
        // TODO: Extraire les fonctionnalités uniques et les ajouter à l'agent cible
        
        // TODO: Mettre à jour les imports qui référencent cet agent
      }
    }
  }
  
  console.log('\nMigration terminée!');
}

// Création des dossiers cibles
async function createTargetFolders() {
  console.log('Création des dossiers cibles...');
  
  const folderStructure = {
    'packages/orchestration/core': true,
    'packages/orchestration/orchestrators': true,
    'packages/orchestration/monitors': true,
    'packages/orchestration/schedulers': true,
    'packages/coordination/core': true,
    'packages/coordination/adapters': true,
    'packages/coordination/bridges': true,
    'packages/coordination/registries': true,
    'packages/business/core': true,
    'packages/business/analyzers': true,
    'packages/business/generators': true,
    'packages/business/validators': true,
    'packages/business/parsers': true
  };
  
  for (const folder of Object.keys(folderStructure)) {
    const fullPath = path.resolve(process.cwd(), folder);
    if (!fs.existsSync(fullPath)) {
      console.log(`Création du dossier: ${folder}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

// Vérification du dossier cible
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Lancer la migration
migrateAgents().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});
