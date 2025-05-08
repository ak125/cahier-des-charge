# Model Context Protocol (MCP)

Implémentation standardisée du Model Context Protocol pour la communication entre agents d'intelligence artificielle, conformément aux standards définis dans le document de standardisation des technologies.

## Vue d'ensemble

Ce package fournit une implémentation complète du Model Context Protocol (MCP) selon les standards définis dans notre document de standardisation des technologies. Il comprend :

- Le **core** : bibliothèque principale avec validation Zod et télémétrie OpenTelemetry
- Le **server** : module NestJS pour l'intégration du MCP dans une API REST

## Structure du projet

```
model-context-protocol/
├── core/                   # Bibliothèque principale MCP
│   ├── src/
│   │   ├── schemas/        # Schémas Zod pour la validation
│   │   ├── services/       # Services principaux
│   │   └── telemetry/      # Intégration OpenTelemetry
│   └── package.json
│
└── server/                 # Module NestJS pour MCP
    ├── src/
    │   ├── controllers/    # Contrôleurs REST
    │   ├── dto/            # DTOs pour validation
    │   ├── services/       # Services NestJS
    │   └── example/        # Application d'exemple
    └── package.json
```

## Fonctionnalités

- Validation complète du contexte MCP avec Zod
- Télémétrie et traçage avec OpenTelemetry
- Module NestJS prêt à l'emploi
- Documentation Swagger intégrée
- Gestion des erreurs standardisée

## Installation

```bash
# Installation du core
npm install @model-context-protocol/core

# Installation du server pour NestJS
npm install @model-context-protocol/server
```

## Utilisation du module MCP dans une application NestJS

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MCPModule } from '@model-context-protocol/server';

@Module({
  imports: [
    MCPModule.forRoot({
      agent: {
        id: 'my-agent',
        name: 'Mon Agent',
        capabilities: ['text-generation'],
        version: '1.0.0',
      },
      telemetry: {
        serviceName: 'mon-service-mcp',
        environment: 'production',
      },
    }),
  ],
})
export class AppModule {}
```

## Implémentation d'un agent

```typescript
// my-agent.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MCPNestService } from '@model-context-protocol/server';
import { MCPContext } from '@model-context-protocol/core';

@Injectable()
export class MyAgentService implements OnModuleInit {
  constructor(private readonly mcpService: MCPNestService) {}

  onModuleInit() {
    this.mcpService.registerAgent('my-agent', this.processRequest.bind(this));
  }

  async processRequest(context: MCPContext): Promise<any> {
    // Implémentation de l'agent
    return {
      result: `Résultat pour la requête: ${context.input.query}`,
    };
  }
}
```

## Structure du contexte MCP

```typescript
interface MCPContext {
  requestId: string;       // UUID unique pour la requête
  timestamp: string;       // Horodatage ISO
  version: string;         // Version du protocole (2.0)
  agent: {
    id: string;
    name: string;
    capabilities?: string[];
    version?: string;
  };
  session: {
    id: string;           // UUID de la session
    history?: any[];      // Historique optionnel
    metadata?: Record<string, any>;
  };
  input: {
    query: string;
    parameters?: Record<string, any>;
    format?: 'text' | 'json' | 'markdown' | 'html';
  };
  // ... autres champs (voir documentation complète)
}
```

## Exemple d'application

Pour exécuter l'application d'exemple:

1. Compiler le package:
   ```bash
   cd packages/model-context-protocol/core
   npm install
   npm run build

   cd ../server
   npm install
   npm run build
   ```

2. Lancer l'exemple:
   ```bash
   cd packages/model-context-protocol/server
   npx ts-node src/example/main.ts
   ```

3. Tester l'API:
   ```bash
   node src/example/scripts/test-mcp.js
   ```

## Conformité aux standards

Cette implémentation respecte tous les standards définis dans notre document de technologies pour les API et la communication, notamment:

- Utilisation de Zod pour la validation des schémas
- Intégration de la télémétrie selon les bonnes pratiques
- Structure standardisée pour le contexte MCP
- Implémentation REST API respectant les principes fondamentaux