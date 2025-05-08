# Catalogue des Agents MCP

Ce document répertorie tous les agents disponibles dans le pipeline MCP, leurs rôles, interfaces, et dépendances.

## Tableau des Agents

| Nom | Couche | Rôle | Entrée | Sortie | Dépendances |
|-----|--------|------|--------|--------|-------------|
| PhpAnalyzer | Business | Analyse PHP legacy | Fichier PHP | mapping.json | config.php, db.php |
| MysqlAnalyzer | Business | Analyse schémas MySQL | Fichiers SQL | schema.json | DataAnalyzer |
| SqlAnalyzer | Business | Analyse requêtes SQL | Fichier PHP | queries.json | PhpAnalyzer |
| DataAnalyzer | Business | Analyse structures de données | Divers | model.json | - |
| DependencyAnalyzer | Business | Analyse dépendances entre fichiers | Dossier source | deps-graph.json | - |
| QaAnalyzer | Business | Validation qualité du code | Code généré | qa-report.json | - |
| StructureAnalyzer | Business | Analyse structure du projet | Dossier racine | structure-map.json | - |
| RemixGenerator | Business | Génération Remix | mapping.json | .tsx/.loader/.meta | Tailwind, Prisma |
| NestjsGenerator | Business | Génération NestJS | schema.json | modules NestJS | - |
| SeoMeta | Business | Génération méta SEO | mapping.json | .meta.ts | - |
| McpVerifier | Coordination | Vérification conformité MCP | Code généré | verification.json | QaAnalyzer |
| HtaccessParser | Business | Parse règles .htaccess | .htaccess | redirects.json | - |
| OrchestratorBridge | Coordination | Pont entre systèmes | - | - | n8n, Temporal, BullMQ |
| McpServer | Adapters | API REST pour MCP | HTTP requests | JSON responses | - |

## Interfaces d'Agents

```typescript
interface BaseAgent {
  id: string;
  name: string;
  version: string;
  execute(input: unknown): Promise<unknown>;
}

interface AnalyzerAgent extends BaseAgent {
  analyze(source: string | Buffer): Promise<AnalysisResult>;
  extractDependencies(): Promise<string[]>;
}

interface GeneratorAgent extends BaseAgent {
  generate(mapping: MappingData): Promise<GenerationResult>;
  validateOutput(output: GenerationResult): Promise<boolean>;
}

interface OrchestratorAgent extends BaseAgent {
  orchestrate(workflow: Workflow): Promise<WorkflowResult>;
  handleError(error: Error): Promise<void>;
  getStatus(): Promise<AgentStatus>;
}

interface ConfigParser extends BaseAgent {
  parse(configFile: string): Promise<ParsedConfig>;
  extractRules(): Promise<Rule[]>;
}

interface Bridge extends BaseAgent {
  connect(): Promise<boolean>;
  forward(message: Message): Promise<void>;
  subscribe(topic: string, callback: (message: Message) => void): void;
}

interface ServerAdapter extends BaseAgent {
  start(): Promise<void>;
  stop(): Promise<void>;
  registerRoute(path: string, handler: RouteHandler): void;
}
```

## Validation des Agents

Dernière validation: 2025-04-21

Le script de validation vérifie automatiquement:
1. La conformité des interfaces TypeScript
2. La présence d'un manifest.json pour chaque agent
3. La couverture des tests unitaires
4. L'enregistrement correct dans agentRegistry.ts

## Comment Développer un Nouvel Agent

1. Créer un dossier dans `agents/` avec le nom de l'agent
2. Implémenter l'interface appropriée
3. Créer un manifest.json
4. Ajouter des tests unitaires
5. Enregistrer l'agent dans agentRegistry.ts
6. Exécuter `npm run validate-agent` pour vérifier

Consultez le guide complet dans la [section Développement des Agents](/docs/agents/development)