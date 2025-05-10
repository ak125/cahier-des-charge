---
title: Guide Migration Agents
description: Guides et processus de migration
slug: guide-migration-agents
module: 2-migration
status: stable
lastReviewed: 2025-05-09
---

# Guide de migration vers l'architecture à trois couches


Ce guide vous aidera à migrer vos agents existants vers la nouvelle architecture à trois couches et à adapter le code généré automatiquement à la logique métier existante.

## Table des matières


1. [Architecture à trois couches](#architecture-à-trois-couches)
2. [Processus de migration automatisée](#processus-de-migration-automatisée)
3. [Adaptation du code généré](#adaptation-du-code-généré)
4. [Exemples de migration](#exemples-de-migration)
5. [Bonnes pratiques](#bonnes-pratiques)

## Architecture à trois couches


Notre nouvelle architecture organise les agents en trois couches distinctes :

### 1. couche d'orchestration (Orchestration)


Responsable de la coordination des workflows de haut niveau et de l'exécution séquentielle des agents.

**Interfaces** :
- `OrchestrationAgent` : interface de base pour tous les agents d'orchestration
- `OrchestratorAgent` : pour les agents qui orchestrent des séquences d'exécution
- `MonitorAgent` : pour les agents qui surveillent l'exécution d'autres agents
- `SchedulerAgent` : pour les agents qui planifient l'exécution d'autres agents

### 2. couche de coordination (Coordination)


Responsable de l'intégration, de l'adaptation et de la communication entre différents systèmes et agents.

**Interfaces** :
- `CoordinationAgent` : interface de base pour tous les agents de coordination
- `AdapterAgent` : pour les agents qui adaptent les formats de données
- `BridgeAgent` : pour les agents qui font le pont entre différents systèmes
- `RegistryAgent` : pour les agents qui gèrent un registre de services ou de données

### 3. couche métier (Business)


Responsable des opérations métier spécifiques et du traitement des données.

**Interfaces** :
- `BusinessAgent` : interface de base pour tous les agents métier
- `AnalyzerAgent` : pour les agents qui analysent des données
- `GeneratorAgent` : pour les agents qui génèrent du contenu ou des données
- `ValidatorAgent` : pour les agents qui valident des données
- `ParserAgent` : pour les agents qui analysent et transforment des formats spécifiques

## Processus de migration automatisée


La migration automatisée est réalisée à l'aide du script `migrate-agent.ts` :

```bash
npx ts-node /workspaces/cahier-des-charge/tools/migrate-agent.ts -a -w <chemin-de-l-agent>
```

Pour migrer tous les agents non conformes en une seule fois :

```bash
chmod +x /workspaces/cahier-des-charge/tools/migrate-all-agents.sh
/workspaces/cahier-des-charge/tools/migrate-all-agents.sh
```typescript

## Adaptation du code généré


Le code généré fournit un squelette conforme à l'interface requise, mais il faut l'adapter à la logique métier existante. Voici comment procéder :

### 1. Identifier les méthodes existantes et leur correspondance


Comparez les méthodes de votre agent existant avec les méthodes requises par la nouvelle interface :

| Méthode existante | Méthode d'interface |
|-------------------|---------------------|
| `initialize()` | `initialize()` |
| `run()` | Peut correspondre à `process()` pour `BusinessAgent` |
| Méthodes spécifiques | Méthodes spécifiques à l'interface (`validate()`, `analyze()`, etc.) |

### 2. Migrer les propriétés


Assurez-vous que toutes les propriétés requises sont présentes :
- `id` : identifiant unique de l'agent
- `name` : nom lisible de l'agent
- `type` : type d'agent (correspond généralement à l'interface sans "Agent")
- `version` : version de l'agent

Conservez les propriétés spécifiques à votre agent.

### 3. Adapter la logique métier


Exemple général d'adaptation :

```typescript
// Avant: méthode run() dans l'ancien agent
async run(): Promise<void> {
  // logique métier
}

// Après: méthode process() dans la nouvelle interface BusinessAgent
async process(operation: string, context: Record<string, any>): Promise<AgentResult> {
  // Adaptation de la logique métier
  if (operation === 'run' || operation === 'default') {
    try {
      // Appel à l'ancienne logique ou adaptation
      await this.runInternal(context);
      return {
        success: true,
        data: { /* résultats */ }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  // ...
}

// Méthode privée conservant la logique originale
private async runInternal(context: Record<string, any>): Promise<void> {
  // logique métier originale de run()
}
```

### 4. Gérer la configuration et le contexte


Adaptez la gestion de la configuration et du contexte :

```typescript
// Avant
constructor(private config: MyAgentConfig, private context: AgentContext) {
  // ...
}

// Après
constructor(private config: MyAgentConfig, private context: AgentContext) {
  // Initialiser les propriétés requises
  this.id = 'mon-agent-id';
  this.name = 'Mon Agent';
  this.type = 'agent-type';
  this.version = '1.0.0';

  // Reste du code d'initialisation
}

// OU utiliser initialize() pour la configuration tardive
async initialize(options?: Record<string, any>): Promise<void> {
  this.config = options?.config || this.config;
  this.context = options?.context || this.context;

  // Reste du code d'initialisation
}
```typescript

## Exemples de migration


### Exemple: Migration de CanonicalValidator vers ValidatorAgent


Voici comment adapter un `CanonicalValidator` existant vers l'interface `ValidatorAgent` :

```typescript
import { ValidatorAgent, AgentResult } from 'mcp-types';
import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import glob from 'glob';
import { Database } from '../packages/shared/db-connector';

interface CanonicalValidatorConfig {
  remixDir: string;
  baseUrl: string;
  ignorePatterns: string[];
  autoCorrect: boolean;
  validateUrlStatus: boolean;
  dbTracking: boolean;
}

interface CanonicalIssue {
  route: string;
  file: string;
  canonical: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export class CanonicalValidator implements ValidatorAgent {
  // Propriétés requises par l'interface
  id = 'canonical-validator';
  name = 'Canonical URL Validator';
  type = 'validator';
  version = '1.0.0';
  description = 'Valide, corrige et optimise les URL canoniques dans les routes Remix';

  // Propriétés spécifiques à cet agent
  private db: Database | null = null;
  private issues: CanonicalIssue[] = [];
  private config: CanonicalValidatorConfig;
  private context: any;

  constructor(config: CanonicalValidatorConfig, context: any) {
    this.config = config;
    this.context = context;

    if (config.dbTracking) {
      this.initializeDatabase();
    }
  }

  // Méthodes requises par l'interface ValidatorAgent
  async validate(data: any, schema: any): Promise<{ valid: boolean; errors?: Array<Record<string, any>> }> {
    // Adapter la logique de validation des canonicals
    const route = data.route;
    const file = data.file;

    await this.validateMetaFile(file);

    // Retourner le résultat de validation
    const errors = this.issues
      .filter(issue => issue.route === route && issue.severity === 'error')
      .map(issue => ({
        path: issue.route,
        message: issue.issue,
        suggestion: issue.suggestion
      }));

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async normalize(data: any): Promise<any> {
    // Implémenter la normalisation des URLs canoniques
    if (this.config.autoCorrect && data.canonical) {
      // Si l'URL est relative, la convertir en absolue
      if (!data.canonical.startsWith('http')) {
        return {
          ...data,
          canonical: `${this.config.baseUrl}${data.canonical}`
        };
      }
    }
    return data;
  }

  // Méthode BusinessAgent requise
  async process(operation: string, context: Record<string, any>): Promise<AgentResult> {
    // Déléguer aux méthodes spécifiques selon l'opération
    switch(operation) {
      case 'validate':
        const result = await this.validate(context.data, context.schema);
        return {
          success: result.valid,
          data: result,
          error: result.valid ? undefined : { errors: result.errors }
        };

      case 'run': // Pour rétrocompatibilité
        try {
          await this.run();
          return {
            success: true,
            data: {
              issues: this.issues,
              summary: {
                total: this.issues.length,
                errors: this.issues.filter(i => i.severity === 'error').length,
                warnings: this.issues.filter(i => i.severity === 'warning').length,
                info: this.issues.filter(i => i.severity === 'info').length
              }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }

      default:
        return {
          success: false,
          error: `Opération ${operation} non supportée`
        };
    }
  }

  // Autres méthodes requises par BaseAgent
  async initialize(options?: Record<string, any>): Promise<void> {
    // Réutiliser la méthode initialize existante
    this.context.logger.info('Initialisation du Canonical Validator');
    this.issues = [];

    if (options) {
      this.config = { ...this.config, ...options.config };
      this.context = options.context || this.context;
    }
  }

  isReady(): boolean {
    return true; // L'agent est toujours prêt après l'initialisation
  }

  async shutdown(): Promise<void> {
    // Nettoyage des ressources
    if (this.db) {
      try {
        await this.db.close();
      } catch (error) {
        this.context.logger.error("Erreur lors de la fermeture de la base de données:", error);
      }
    }
    return Promise.resolve();
  }

  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version,
      description: this.description,
      capabilities: ['validate', 'run'],
      configSchema: {
        remixDir: { type: 'string', required: true },
        baseUrl: { type: 'string', required: true },
        ignorePatterns: { type: 'array', items: { type: 'string' } },
        autoCorrect: { type: 'boolean' },
        validateUrlStatus: { type: 'boolean' },
        dbTracking: { type: 'boolean' }
      }
    };
  }

  // Méthodes spécifiques à cet agent (conserver la logique existante)
  private async initializeDatabase(): Promise<void> {
    // Code existant...
  }

  async run(): Promise<void> {
    // Code existant...
  }

  private async validateMetaFile(filePath: string): Promise<void> {
    // Code existant...
  }

  private getRouteFromFile(filePath: string): string {
    // Code existant...
  }

  private async correctIssues(): Promise<void> {
    // Code existant...
  }

  private async addCanonicalToFile(filePath: string, canonical: string): Promise<void> {
    // Code existant...
  }

  private async updateCanonicalInFile(
    filePath: string,
    oldCanonical: string,
    newCanonical: string
  ): Promise<void> {
    // Code existant...
  }

  private async generateReport(): Promise<void> {
    // Code existant...
  }
}

export default CanonicalValidator;
```

## Bonnes pratiques


1. **Ne pas supprimer la logique existante** : Adaptez-la plutôt à la nouvelle interface.
2. **Utiliser des méthodes privées** pour conserver la logique métier originale.
3. **Tester après migration** : Assurez-vous que le comportement est identique après la migration.
4. **Mettre à jour les utilisations** : Vérifiez et mettez à jour tous les imports et utilisations de l'agent.
5. **Documentation** : Mettez à jour la documentation pour refléter la nouvelle interface.
6. **Conventions de nommage** : Suivez les conventions de nommage de l'architecture à trois couches.
7. **Gestion d'erreurs** : Utilisez le format `AgentResult` pour gérer les erreurs de manière cohérente.

