---
title: Typescript Conventions
description: Documentation fondamentale et conventions
slug: typescript-conventions
module: 0-core
status: stable
lastReviewed: 2025-05-09
---

# Conventions TypeScript pour le projet MCP


## Conventions établies le 2025-04-21


### 1. Convention de nommage des agents


- **Nom de classe**: CamelCase, ex: `MysqlAnalyzer`
- **Dossiers**: Éviter les caractères spéciaux comme '+' ou '.'
- **Format recommandé**: `<type>-<nom>-<rôle>`, ex: `analyzer-mysql-optimizer`

### 2. Structure d'un fichier d'agent


```typescript
/**
- Description de l'agent
 */
import { TypeAgent } from '../../interfaces/typeagent';

/**
- Classe d'implémentation de l'agent
 */
export class AgentName implements TypeAgent {
  name = 'AgentName';
  description = 'Description de l\'agent';
  version = '1.0.0';

  async initialize(config: any): Promise<void> {
    // Initialisation
  }

  async execute(input: any): Promise<any> {
    // Logique d'exécution
    return { success: true, result: input };
  }
}

export default AgentName;
```

### 3. Interfaces standardisées


- **AnalyzerAgent**: Pour les agents d'analyse de données
- **GeneratorAgent**: Pour les agents de génération de code/contenu
- **OrchestratorAgent**: Pour les agents de coordination
- **ValidatorAgent**: Pour les agents de validation
- **ConfigParser**: Pour les parseurs de configuration

### 4. Bonnes pratiques TypeScript


- Éviter les types de retour dans les signatures de méthodes de classe
- Préférer l'utilisation de `interface` pour définir les contrats
- Utiliser des guillemets doubles pour les chaînes contenant des apostrophes
- Définir explicitement les types pour les paramètres de méthodes

### 5. Intégration CI/CD


- Validation TypeScript à chaque commit
- Génération de rapport des agents validés
- Mise à jour automatique du document d'architecture

