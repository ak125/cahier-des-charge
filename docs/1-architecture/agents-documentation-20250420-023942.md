---
title: Agents Documentation 20250420 023942
description: Architecture à trois couches et structure
slug: agents-documentation-20250420-023942
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Documentation des Agents MCP


*Document généré automatiquement le 20 avril 2025 à 02:39:42*

## Vue d'ensemble


Cette documentation présente les 112 agents qui constituent l'architecture à trois couches du projet MCP. Chaque agent implémente une interface spécifique selon sa catégorie et son rôle.

## Architecture à trois couches


L'architecture à trois couches est organisée comme suit:

1. **Couche d'analyse**: Les agents analyseurs extraient et interprètent les données
2. **Couche de validation**: Les agents validateurs vérifient l'intégrité et la conformité des données
3. **Couche de génération**: Les agents générateurs produisent du contenu ou des transformations
4. **Orchestration**: Les agents orchestrateurs coordonnent les flux de travail

De plus, certains agents sont classés comme "misc" car ils remplissent des fonctions transversales ou spécialisées.

## Répartition des agents



## Agents de type Analyzers


*Nombre d'agents: 30*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
| `AuditSelectorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `BaseAgent` | `McpAgent , AnalyzerAgent` | class implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `BusinessAgent` | `AnalyzerAgent extends BaseAgent ` | Agent pour business | - `analyze()` |
| `ClassifierAgent` | `BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent` |     Créer une copie profonde du schéma pour ne pas modifier l'original | - `getState()` - `initialize()` - `shutdown()` |
| `ComponentGeneratorAgent` | `McpAgent , BaseAgent, BusinessAgent, GeneratorAgent, AnalyzerAgent` | ComponentGenerator implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `DebtAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `HtaccessRouteAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `HtaccessRouterAnalyzerAgent` | `BaseAgent (implicite)` | Exporter également la classe pour permettre l'instanciation manuelle si nécessaire |  |
| `MysqlAnalyzer+optimizerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MysqlAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `NginxConfigAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `NotifierAgent` | `BaseAgent, OrchestrationAgent , BusinessAgent, AnalyzerAgent` | Agent pour m c p notifier | - `getSystemState()` - `handleRedisMessage()` - `handleSupabaseChange()` - `initialize()` - `notify()` |
| `PhpAnalyzer.workerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpAnalyzerV3Agent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpAnalyzerV4Agent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PrismaGeneratorAgent` | `McpAgent , BaseAgent, BusinessAgent, GeneratorAgent, AnalyzerAgent` | PrismaGenerator implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `QualityAgent` | `BusinessAgent extends BaseAgent , AnalyzerAgent` |     Détecter l'orientation objet | - `analyze()` |
| `RelationAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SchemaAgent` | `BaseAgent (implicite)` |   tableType: TableType; Type de table (métier, technique, etc.) |  |
| `SchemaAnalyzerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SqlAnalysisRunnerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SqlAnalyzer+prismaBuilderAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SupabaseOptimizationTracker` | `BaseAgent, BusinessAgent , AnalyzerAgent` | Agent pour supabase optimization tracker | - `getOptimizationHistory()` - `getOptimizationProgress()` - `getPendingRecommendations()` - `getState()` - `initialize()` |
| `TableClassifierAgent` | `BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , AnalyzerAgent` |   Règles de classification des tables | - `getState()` - `initialize()` - `shutdown()` |
| `agents` | `McpAgent , BaseAgent, BusinessAgent, AnalyzerAgent` | QAAnalyzer implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `data-analyzer-v2` | `McpAgent , BaseAgent, BusinessAgent, AnalyzerAgent` | DataAnalyzerAgent implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `dependency-analyzer-v2` | `McpAgent , BaseAgent, BusinessAgent, AnalyzerAgent` | DependencyAnalyzerAgent implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `qa-analyzer-v2` | `McpAgent , BaseAgent, BusinessAgent, AnalyzerAgent` | QAAnalyzerV2 implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |
| `structure-analyzer-v2` | `McpAgent , BaseAgent, BusinessAgent, AnalyzerAgent` | StructureAnalyzerAgent implementation | - `execute()` - `getStatus()` - `initialize()` - `stop()` - `validate()` |

## Agents de type Validators


*Nombre d'agents: 2*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
| `CanonicalValidatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PostgresqlValidatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |

## Agents de type Generators


*Nombre d'agents: 10*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
| `CaddyGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `CaddyfileGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DevGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `GenerateMigrationPlanAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `Generate_prisma_modelAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MetaGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PrismaMigrationGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PrismaSmartGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `RemixRouteGeneratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoMeta.generatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |

## Agents de type Orchestrators


*Nombre d'agents: 6*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
| `AgentOrchestratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `BullmqOrchestratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `McpVerifier.workerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MetricsServiceAgent` | `BaseAgent, OrchestrationAgent , CoordinationAgent, OrchestratorAgent` | Agent pour metrics service | - `getSystemState()` - `initialize()` - `orchestrate()` |
| `MigrationOrchestratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `OrchestratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |

## Agents de type Misc


*Nombre d'agents: 64*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
| `Agent8OptimizerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentAuditAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentBusinessAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentDonneesAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentQualityAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentStructureAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AgentVersionAuditorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AnalyzeSecurityRisksAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `AutoPrAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `CanonicalSyncAgent` | `BaseAgent, CoordinationAgent, MCPAgent , BusinessAgent` | Agent pour canonical sync | - `checkConnection()` - `initialize()` - `process()` - `shutdown()` |
| `CiTesterAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `ConsolidatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `CoordinatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DataAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DataVerifierAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DebtDetectorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DependencyAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DevCheckerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DevIntegratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DevLinterAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DevopsPreviewAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DiffVerifierAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `DiscoveryAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `Dynamic_sql_extractorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `HelpersAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `HtaccessParserAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `InjectToSupabaseAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `McpIntegratorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `McpManifestManagerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `McpVerifierAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MigrationStrategistAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MonitoringCheckAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MysqlToPgAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `MysqlToPostgresqlAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `NginxConfigParserAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `NotificationServiceAgent` | `OrchestrationAgent, BaseAgent, OrchestrationAgent , CoordinationAgent, BusinessAgent` | Agent pour notification service | - `critical()` - `error()` - `getSystemState()` - `info()` - `initialize()` |
| `ParserAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpDiscoveryEngineAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpRouterAuditAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpSqlMapperAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PhpSqlSyncMapperAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PipelineStrategyAuditorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `PrCreatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `ProgressiveMigrationAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `QaConfirmerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `RelationalNormalizerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `RemediatorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SelectorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SemanticTableMapperAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoAuditRunnerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoCheckerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoCheckerCanonicalAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoContentEnhancerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoMcpControllerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SeoRedirectMapperAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SqlDebtAuditAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `SqlPrismaMigrationPlannerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `StatusWriterAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `StructureAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `TableCartographerAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `TypeAuditAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `TypeAuditorAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `TypeConverterAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |
| `TypeMapperAgent` | `BaseAgent (implicite)` | Agent spécialisé |  |

## Statistiques globales


- **Total des agents**: 112
- **Analyzers**: 30 agents
- **Validators**: 2 agents
- **Generators**: 10 agents
- **Orchestrators**: 6 agents
- **Misc**: 64 agents

## Relations entre les couches


L'architecture à trois couches fonctionne selon les principes suivants:

1. Les agents **Analyzers** produisent des données qui sont consommées par les **Validators**
2. Les données validées sont utilisées par les **Generators** pour créer de nouveaux artefacts
3. Les **Orchestrators** coordonnent ce flux et font appel aux agents des différentes couches

Les agents de la catégorie **Misc** peuvent être utilisés à n'importe quel niveau selon leurs fonctionnalités spécifiques.

## Maintenance


Pour ajouter un nouvel agent à cette architecture:

1. Identifiez la catégorie appropriée (analyzer, validator, generator, orchestrator ou misc)
2. Créez un nouveau fichier dans le répertoire correspondant
3. Implémentez l'interface appropriée
4. Ajoutez l'agent au registre dans le fichier index.ts
5. Exécutez les tests pour vérifier l'intégration

Cette documentation est générée automatiquement. Pour la mettre à jour, exécutez:
```
./generate-agents-documentation.sh
```

