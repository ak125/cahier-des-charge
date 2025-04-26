# Rapport de vérification des statistiques des agents

Date: 2025-04-20 01:40:58

## Nombre d'agents par emplacement

- **Agents dans la nouvelle structure** : 22

## Distribution par type d'agent

- **Analyzers** : 12
- **Validators** : 0
- **Generators** : 0
- **Orchestrators** : 1
- **Misc** : 9

**Total par catégorie** : 22

**✅ COHÉRENCE VALIDÉE** : Le nombre total d'agents correspond à la somme des agents par catégorie.

## Vérification des interfaces

- Agents implémentant **BaseAgent** : 14
- Agents implémentant **BusinessAgent** : 12
- Agents implémentant **AnalyzerAgent** : 7
- Agents implémentant **ValidatorAgent** : 0
- Agents implémentant **GeneratorAgent** : 0

**⚠️ 8 agents n'implémentent aucune interface standard** :
```
/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/AuditSelectorAgent/AuditSelectorAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/McpIntegratorAgent/McpIntegratorAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/Dynamic_sql_extractorAgent/Dynamic_sql_extractorAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/PhpSqlMapperAgent/PhpSqlMapperAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/PhpSqlSyncMapperAgent/PhpSqlSyncMapperAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/InjectToSupabaseAgent/InjectToSupabaseAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/PhpDiscoveryEngineAgent/PhpDiscoveryEngineAgent.ts
/workspaces/cahier-des-charge/packages/mcp-agents/misc/SelectorAgent/SelectorAgent.ts
```

## Conclusion

La vérification des statistiques a identifié 22 agents dans la nouvelle structure, répartis comme suit :
- 12 analyzers
- 0 validators
- 0 generators
- 1 orchestrators
- 9 misc

Ces statistiques diffèrent du rapport de finalisation qui mentionnait 194 agents uniques et 35 agents dans la nouvelle structure.
