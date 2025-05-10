---
title: Migration Plan
description: Planification et suivi des tâches
slug: migration-plan
module: 6-planning
status: stable
lastReviewed: 2025-05-09
---

# Plan de Migration vers MCP OS 3 couches


## Priorisation des agents


1. **StatusWriterAgent** (orchestration/unknown) - 0 utilisations
2. **php-analyzer-agent** (orchestration/unknown) - 0 utilisations
3. **orchestrator** (orchestration/orchestrator) - 0 utilisations
4. **monitoring-check** (orchestration/monitor) - 0 utilisations
5. **MigrationOrchestrator** (orchestration/orchestrator) - 0 utilisations
6. **BullMqOrchestrator** (orchestration/orchestrator) - 0 utilisations
7. **php-analyzer.worker** (orchestration/unknown) - 0 utilisations
8. **mcp-verifier.worker** (orchestration/unknown) - 0 utilisations
9. **Agent8SqlOptimizer** (orchestration/unknown) - 0 utilisations
10. **sql-analysis-runner** (orchestration/unknown) - 0 utilisations

## Structure cible


```
packages/mcp-agents/
├─ orchestration/
│  ├─ orchestrators/
│  ├─ schedulers/
│  └─ monitors/
├─ coordination/
│  ├─ bridges/
│  ├─ adapters/
│  └─ registries/
└─ business/
   ├─ analyzers/
   ├─ generators/
   ├─ validators/
   └─ parsers/
```

## Étapes d'exécution


1. Créer la structure de répertoires
2. Migrer les agents d'orchestration
3. Migrer les agents de coordination
4. Migrer les agents métier
5. Mettre à jour le registre d'agents
6. Exécuter les tests de validation
7. Supprimer les agents obsolètes

## Commandes


```bash


# Créer la structure

mkdir -p packages/mcp-agents/{orchestration,coordination,business}/{orchestrators,schedulers,monitors,bridges,adapters,registries,analyzers,generators,validators,parsers}

# Migrer en utilisant ce script

node scripts/migrate-agents.ts --execute --layer=orchestration
node scripts/migrate-agents.ts --execute --layer=coordination
node scripts/migrate-agents.ts --execute --layer=business

# Valider la migration

npm run test:coverage
```

