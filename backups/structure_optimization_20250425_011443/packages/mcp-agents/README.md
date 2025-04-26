# Système d'Agents MCP

Ce module contient tous les agents MCP (*Model Context Protocol*) standardisés pour le projet. Les agents sont organisés selon une structure cohérente et respectent tous l'interface `McpAgent`.

## Structure

```
packages/mcp-agents/
├── business/           # Agents métier spécifiques
│   ├── analyzers/      # Agents d'analyse
│   ├── generators/     # Agents de génération
│   ├── validators/     # Agents de validation
│   ├── orchestrators/  # Agents orchestrateurs
│   └── misc/           # Autres agents métier
├── core/               # Interfaces et classes de base
└── orchestration/      # Agents d'orchestration système
    ├── monitors/       # Agents de monitoring
    ├── orchestrators/  # Orchestrateurs système
    └── misc/           # Autres agents d'orchestration
```

## Interface McpAgent

Tous les agents doivent implémenter l'interface `McpAgent` :

```typescript
interface AgentMetadata {
  id: string;           // Identifiant unique de l'agent
  type: string;         // Type d'agent (analyzer, generator, etc.)
  name: string;         // Nom lisible par un humain
  version: string;      // Version sémantique
  description: string;  // Description de l'agent
}

type AgentStatus = 'ready' | 'busy' | 'error' | 'stopped';

interface AgentContext {
  jobId: string;
  // Paramètres spécifiques à l'agent
  [key: string]: any;
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: Error;
  metrics: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

enum AgentEvent {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STATUS_CHANGED = 'statusChanged',
  PROGRESS = 'progress'
}

interface McpAgent {
  readonly metadata: AgentMetadata;
  status: AgentStatus;
  readonly events: EventEmitter;
  
  initialize(): Promise<void>;
  execute(context: AgentContext): Promise<AgentResult>;
  validate(context: AgentContext): Promise<boolean>;
  stop(): Promise<void>;
  getStatus(): Promise<{ status: AgentStatus, details?: any }>;
}
```

## Utilisation

### Importer un agent

```typescript
// Import direct
import { HtaccessRouterAnalyzer } from 'packages/mcp-agents/business/analyzers/htaccess-router-analyzer';

// OU utiliser un import dynamique
const agentId = 'htaccess-router-analyzer';
const AgentClass = await import(`packages/mcp-agents/business/analyzers/${agentId}`).default;
const agent = new AgentClass();
```

### Exécuter un agent

```typescript
const agent = new HtaccessRouterAnalyzer();

// Initialiser l'agent
await agent.initialize();

// S'abonner aux événements
agent.events.on(AgentEvent.PROGRESS, (progress) => {
  console.log(`Progression: ${progress.percent}%`);
});

// Valider le contexte
const isValid = await agent.validate({ jobId: 'job-123', filePath: '/path/to/htaccess' });

if (isValid) {
  // Exécuter l'agent
  const result = await agent.execute({ jobId: 'job-123', filePath: '/path/to/htaccess' });
  
  if (result.success) {
    console.log('Analyse terminée avec succès:', result.data);
  } else {
    console.error('Erreur lors de l\'analyse:', result.error);
  }
}

// Arrêter l'agent
await agent.stop();
```

## Outils de maintenance

Le projet inclut plusieurs outils pour faciliter la maintenance des agents :

### Validation des agents

Pour vérifier que tous les agents respectent l'interface `McpAgent` :

```bash
./validate-all-agents.sh
```

### Nettoyage des doublons

Pour nettoyer les doublons d'agents dans le projet :

```bash
./clean-agents-duplicates.sh
```

### Synchronisation des agents

Pour synchroniser les doublons d'agents avec leurs versions principales :

```bash
./sync-mcp-agents.sh
```

### Intégration des agents orphelins

Pour intégrer les agents orphelins dans la structure principale :

```bash
./integrate-orphan-agents.sh
```

## Développer un nouvel agent

Pour créer un nouvel agent, suivez ces étapes :

1. Créez un nouveau dossier dans la catégorie appropriée (analyzers, generators, etc.)
2. Créez un fichier `index.ts` qui exporte votre agent
3. Implémentez l'interface `McpAgent`
4. Validez votre agent avec `./validate-all-agents.sh`

Exemple :

```typescript
import { EventEmitter } from 'events';
import { McpAgent, AgentMetadata, AgentStatus, AgentContext, AgentResult, AgentEvent } from '../../core/interfaces';

export class MyNewAgent implements McpAgent {
  readonly metadata: AgentMetadata = {
    id: 'my-new-agent',
    type: 'analyzer',
    name: 'My New Agent',
    version: '1.0.0',
    description: 'Description de mon nouvel agent'
  };
  
  status: AgentStatus = 'ready';
  readonly events = new EventEmitter();
  
  async initialize(): Promise<void> {
    this.status = 'ready';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
  }
  
  async validate(context: AgentContext): Promise<boolean> {
    return !!context && !!context.jobId;
  }
  
  async execute(context: AgentContext): Promise<AgentResult> {
    this.status = 'busy';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
    this.events.emit(AgentEvent.STARTED, { context });
    
    const startTime = Date.now();
    
    try {
      // Logique principale de l'agent
      const result = { /* votre résultat */ };
      
      this.status = 'ready';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      
      const endTime = Date.now();
      const agentResult: AgentResult = {
        success: true,
        data: result,
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
      
      this.events.emit(AgentEvent.COMPLETED, agentResult);
      return agentResult;
    } catch (error) {
      this.status = 'error';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      
      const endTime = Date.now();
      const errorResult: AgentResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
      
      this.events.emit(AgentEvent.FAILED, errorResult);
      return errorResult;
    }
  }
  
  async stop(): Promise<void> {
    this.status = 'stopped';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
  }
  
  async getStatus(): Promise<{ status: AgentStatus, details?: any }> {
    return { status: this.status };
  }
}

export default MyNewAgent;
```