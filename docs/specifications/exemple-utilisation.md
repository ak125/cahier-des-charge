# Guide d'utilisation de l'AssemblerAgent

## Installation

```bash
npm install
```

## Utilisation en ligne de commande

```bash
ts-node assembler-agent.ts /chemin/vers/fiche.php
```

## Utilisation dans un workflow n8n

Créez un nœud "Execute Command" dans n8n avec la commande suivante:

```bash
cd /chemin/vers/projet && ts-node assembler-agent.ts {{$json.filePath}}
```

## Intégration dans une application TypeScript

```typescript
import { AssemblerAgent } from './assembler-agent';

async function processFile(filePath: string) {
  try {
    const assembler = new AssemblerAgent(filePath);
    await assembler.process();
    console.log('Traitement terminé avec succès');
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
  }
}

processFile('/chemin/vers/fiche.php');
```

## Structure des fichiers d'entrée

Pour que l'AssemblerAgent fonctionne correctement, vous devez avoir au minimum:

- `fiche.php.audit.sections.json` - Les sections d'audit générées par les différents agents

Fichiers optionnels:
- `discovery_map.json` - Carte de découverte pour les priorités
- `schema_migration_diff.json` - Différences de schéma SQL
- `fiche.php.feedback.md` - Feedback manuel

## Sorties générées

Pour chaque fichier PHP analysé, l'AssemblerAgent génère:
- `fiche.php.audit.md` - Rapport d'audit structuré
- `fiche.php.backlog.json` - Liste des tâches à effectuer
- `fiche.php.impact_graph.json` - Graphe de dépendances
- `fiche.php.migration_plan.md` - Plan de migration détaillé
