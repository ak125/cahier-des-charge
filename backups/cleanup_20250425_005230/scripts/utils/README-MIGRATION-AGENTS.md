# Guide de migration des agents MCP vers l'architecture abstraite

Ce document explique comment utiliser le script de migration pour adapter les agents existants vers l'architecture à base de classes abstraites.

## Contexte

L'architecture des agents MCP a été refactorisée pour utiliser des classes abstraites, ce qui permet :

- Une meilleure réutilisation du code
- Une standardisation des interfaces des agents
- Une gestion uniforme du cycle de vie des agents
- Une plus grande facilité pour les tests unitaires

Les agents sont maintenant organisés en quatre types principaux :

1. **Analyzers** : Agents d'analyse qui examinent du code ou des données
2. **Validators** : Agents de validation qui vérifient la conformité du code ou des données
3. **Generators** : Agents de génération qui produisent du code ou des données
4. **Orchestrators** : Agents d'orchestration qui coordonnent d'autres agents

Chaque type d'agent hérite d'une classe abstraite spécifique :

- `AbstractAnalyzerAgent<I, O>`
- `AbstractValidatorAgent<I, O>`
- `AbstractGeneratorAgent<I, O>`
- `AbstractOrchestratorAgent<I, O>`

Où `I` est le type des données d'entrée et `O` est le type des données de sortie.

## Script de migration automatique

Le script `migrate-agents.sh` permet d'automatiser la migration des agents existants vers cette nouvelle architecture.

### Utilisation du script

```bash
./scripts/migrate-agents.sh [options]
```

### Options disponibles

- `--type=TYPE` : Type d'agent à migrer (analyzer, validator, generator, orchestrator, all)
- `--agent=NOM` : Nom spécifique d'agent à migrer (ex: php-analyzer)
- `--dry-run` : Exécuter sans modifier les fichiers (simulation)
- `--verbose` : Afficher des informations détaillées
- `--help` : Afficher l'aide

### Exemples d'utilisation

Migrer tous les agents analyseurs :
```bash
./scripts/migrate-agents.sh --type=analyzer
```

Migrer un agent spécifique :
```bash
./scripts/migrate-agents.sh --type=analyzer --agent=php-analyzer
```

Simuler la migration sans modifier les fichiers :
```bash
./scripts/migrate-agents.sh --type=all --dry-run
```

## Migration manuelle d'un agent

Si vous préférez adapter manuellement un agent, voici les étapes à suivre :

1. **Importez la classe abstraite appropriée** :
   ```typescript
   import { AbstractAnalyzerAgent } from '../abstract-analyzer';
   ```

2. **Faites hériter votre classe de la classe abstraite** :
   ```typescript
   export class MyCustomAnalyzer extends AbstractAnalyzerAgent<CustomInput, CustomOutput> {
     // ...
   }
   ```

3. **Remplacez la méthode principale** par la méthode standard du type d'agent :
   - Pour un analyseur : `analyze(input: I, context?: any): Promise<O>`
   - Pour un validateur : `validate(input: I, context?: any): Promise<O>`
   - Pour un générateur : `generate(input: I, context?: any): Promise<O>`
   - Pour un orchestrateur : `orchestrate(input: I, context?: any): Promise<O>`

4. **Implémentez les méthodes du cycle de vie** :
   ```typescript
   protected async initializeInternal(): Promise<void> {
     // Code d'initialisation spécifique
   }

   protected async cleanupInternal(): Promise<void> {
     // Code de nettoyage spécifique
   }
   ```

## Vérification de la migration

Une suite de tests unitaires est disponible pour vérifier que les agents ont été correctement migrés :

```bash
npm test -- -t "Test de migration des agents"
```

Ces tests vérifient que :
- Les agents héritent bien des classes abstraites appropriées
- Les méthodes requises sont correctement implémentées
- Le cycle de vie des agents fonctionne comme prévu

## Structure des classes abstraites

### AbstractAnalyzerAgent

```typescript
abstract class AbstractAnalyzerAgent<I, O> {
  // Propriétés de l'agent
  public id: string;
  public name: string;
  public description: string;
  public version: string;

  // Méthodes principales
  public async initialize(): Promise<void>;
  public async cleanup(): Promise<void>;
  public async analyze(input: I, context?: any): Promise<O>;

  // Méthodes à implémenter par les classes dérivées
  protected abstract initializeInternal(): Promise<void>;
  protected abstract cleanupInternal(): Promise<void>;
}
```

Les autres classes abstraites (`AbstractValidatorAgent`, `AbstractGeneratorAgent`, `AbstractOrchestratorAgent`) suivent une structure similaire avec leurs méthodes principales spécifiques.

## Bonnes pratiques

1. **Typez correctement vos entrées/sorties** : Utilisez des interfaces ou des types pour définir clairement les données d'entrée et de sortie de votre agent.

2. **Gérez correctement les ressources** : Initialisez les ressources dans `initializeInternal()` et libérez-les dans `cleanupInternal()`.

3. **Documentez vos agents** : Ajoutez des commentaires JSDoc pour décrire le but de votre agent et ses fonctionnalités.

4. **Ajoutez des tests unitaires** : Vérifiez que votre agent fonctionne correctement après la migration.