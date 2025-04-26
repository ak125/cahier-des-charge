# Guide du Développement d'un Agent MCP

Ce guide explique comment créer un nouvel agent pour le pipeline MCP en respectant l'architecture à trois couches et les conventions du projet.

## Étapes de création d'un nouvel agent

1. [Définition du besoin et choix d'interface](#1-définition-du-besoin)
2. [Structure des fichiers](#2-structure-des-fichiers)
3. [Implémentation de l'interface](#3-implémentation-de-linterface)
4. [Création du manifest.json](#4-création-du-manifestjson)
5. [Tests unitaires](#5-tests-unitaires)
6. [Enregistrement dans agentRegistry.ts](#6-enregistrement-dans-agentregistryts)
7. [Validation](#7-validation)
8. [Documentation](#8-documentation)

## 1. Définition du besoin

Avant de développer, déterminez le type d'agent selon son rôle principal:

| Type d'agent | Interface         | Couche       | Utilisation                            |
| ------------ | ----------------- | ------------ | -------------------------------------- |
| Analyzer     | AnalyzerAgent     | Business     | Analyser du code ou des données source |
| Generator    | GeneratorAgent    | Business     | Générer du code ou des fichiers        |
| Orchestrator | OrchestratorAgent | Coordination | Coordonner d'autres agents             |
| Parser       | ConfigParser      | Business     | Parser des fichiers de configuration   |
| Bridge       | Bridge            | Coordination | Connecter différents systèmes          |
| Server       | ServerAdapter     | Adapters     | Exposer des API ou services            |

## 2. Structure des fichiers

Pour un agent nommé `MonNouvelAgent`, créez cette structure:

```
agents/
└── mon-nouvel-agent/
    ├── index.ts           # Point d'entrée, exporte l'agent
    ├── manifest.json      # Métadonnées de l'agent
    ├── tests/             # Tests unitaires
    │   └── index.test.ts  
    ├── types.ts           # Types spécifiques à l'agent
    └── README.md          # Documentation spécifique
```

## 3. Implémentation de l'interface

Voici un exemple d'implémentation pour un AnalyzerAgent:

```typescript
// agents/mon-nouvel-agent/index.ts
import { AnalyzerAgent, AnalysisResult } from '../types';

export class MonNouvelAgent implements AnalyzerAgent {
  id: string = 'mon-nouvel-agent';
  name: string = 'Mon Nouvel Agent';
  version: string = '1.0.0';
  
  async execute(input: unknown): Promise<unknown> {
    // Conversion du input en format attendu
    const source = typeof input === 'string' ? input : JSON.stringify(input);
    return this.analyze(source);
  }
  
  async analyze(source: string | Buffer): Promise<AnalysisResult> {
    // Logique d'analyse spécifique
    const result: AnalysisResult = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        sourceType: 'mon-type',
      },
      findings: [],
      // Autres propriétés spécifiques
    };
    
    // Implémentez votre logique d'analyse ici
    
    return result;
  }
  
  async extractDependencies(): Promise<string[]> {
    // Identifiez les dépendances
    return ['dependency1', 'dependency2'];
  }
}

export default new MonNouvelAgent();
```

## 4. Création du manifest.json

Le manifest.json contient les métadonnées de l'agent:

```json
{
  "id": "mon-nouvel-agent",
  "name": "Mon Nouvel Agent",
  "version": "1.0.0",
  "type": "analyzer",
  "description": "Cet agent analyse [décrire la fonctionnalité]",
  "author": "Votre Nom",
  "layer": "business",
  "inputs": [
    {
      "name": "source",
      "type": "string",
      "description": "Contenu à analyser"
    }
  ],
  "outputs": [
    {
      "name": "analysisResult",
      "type": "object",
      "description": "Résultat de l'analyse"
    }
  ],
  "dependencies": [
    "dependency1",
    "dependency2"
  ],
  "configuration": {
    "option1": {
      "type": "string",
      "default": "valeur par défaut",
      "description": "Description de l'option"
    }
  },
  "examples": [
    {
      "name": "Exemple basique",
      "input": "exemple d'entrée",
      "expectedOutput": "exemple de sortie attendue"
    }
  ]
}
```

## 5. Tests unitaires

Créez des tests unitaires pour valider le fonctionnement:

```typescript
// agents/mon-nouvel-agent/tests/index.test.ts
import { describe, it, expect } from 'vitest';
import monNouvelAgent from '../index';

describe('MonNouvelAgent', () => {
  it('should correctly analyze valid input', async () => {
    const input = 'input de test';
    const result = await monNouvelAgent.analyze(input);
    
    expect(result).toBeDefined();
    expect(result.metadata.sourceType).toBe('mon-type');
    // Autres assertions
  });
  
  it('should handle invalid input gracefully', async () => {
    const invalidInput = null;
    
    await expect(async () => {
      await monNouvelAgent.execute(invalidInput);
    }).not.toThrow();
  });
  
  it('should extract dependencies correctly', async () => {
    const deps = await monNouvelAgent.extractDependencies();
    
    expect(deps).toBeInstanceOf(Array);
    expect(deps).toContain('dependency1');
  });
});
```

## 6. Enregistrement dans agentRegistry.ts

Ajoutez votre agent au registre:

```typescript
// Ajoutez cette ligne dans agentRegistry.ts
import monNouvelAgent from './mon-nouvel-agent';

// Et ajoutez-le dans la liste des agents exportés
export const agents = {
  // ... autres agents
  monNouvelAgent,
};
```

## 7. Validation

Exécutez la validation pour vérifier que votre agent est conforme:

```bash
npm run validate-agent -- mon-nouvel-agent
```

Cela vérifie:
- La conformité TypeScript de l'interface
- La présence et la validité du manifest.json
- La couverture des tests unitaires
- L'enregistrement correct dans agentRegistry.ts

## 8. Documentation

Mettez à jour la documentation:

1. Ajoutez votre agent dans `agents/AGENTS.md`
2. Créez un README.md spécifique dans le dossier de l'agent
3. Documentez les entrées/sorties et cas d'utilisation

## Bonnes pratiques

1. **Séparation des préoccupations**: Chaque agent doit avoir une responsabilité unique
2. **Gestion des erreurs**: Utilisez try/catch et loggez les erreurs
3. **Idempotence**: Les opérations doivent pouvoir être répétées sans effet de bord
4. **Validation**: Validez toujours les entrées et sorties
5. **Tests**: Visez une couverture de test >80%

## Exemples d'agents bien implémentés

Pour des exemples de référence, consultez ces agents existants:

- `php-analyzer`: Exemple d'AnalyzerAgent
- `remix-generator`: Exemple de GeneratorAgent
- `mcp-verifier`: Exemple d'OrchestratorAgent

## Résolution des problèmes courants

### L'agent n'apparaît pas dans le dashboard

Vérifiez l'enregistrement dans agentRegistry.ts et le redémarrage du service.

### Erreurs TypeScript

Assurez-vous que votre agent implémente correctement toutes les méthodes requises par son interface.

### Échec des tests

Vérifiez que les tests couvrent les cas d'erreur et les cas limites.

## Ressources

- [Architecture MCP](/workspaces/cahier-des-charge/shared/documentation/ARCHITECTURE.md)
- [Types d'agents](/workspaces/cahier-des-charge/agents/types.ts)
- [Documentation du pipeline](/workspaces/cahier-des-charge/docs/PIPELINE.md)