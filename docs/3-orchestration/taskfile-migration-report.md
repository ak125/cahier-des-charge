---
title: Taskfile Migration Report
description: Orchestrateur standardisé et coordination
slug: taskfile-migration-report
module: 3-orchestration
status: stable
lastReviewed: 2025-05-09
---

# Migration de Taskfile vers NX

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



Ce document décrit la migration des tâches depuis Taskfile.yaml vers NX pour simplifier l'outillage du projet.

## Motivation


La multiplication des outils d'automatisation (Taskfile, scripts divers) crée une complexité inutile. Cette migration centralise toutes les tâches autour de NX, déjà utilisé dans le projet.

## Équivalence des commandes


| Ancienne commande (Taskfile) | Nouvelle commande (NX) |
|--------------------------|----------------------|
| `task setup` | `nx run setup` |
| `task migrate -- controllers/UserController.php` | `nx run migrate -- --path=controllers/UserController.php` |
| `task migrate:analyze controllers/UserController.php` | `nx run migrate:analyze -- --path=controllers/UserController.php` |
| `task migrate:batch 5` | `nx run migrate:batch -- --count=5` |
| `task audit` | `nx run audit` |
| `task audit:code` | `nx run audit:code` |
| `task audit:temporal` | `nx run audit:temporal` |
| `task audit:seo` | `nx run audit:seo` |
| `task audit:performance` | `nx run audit:performance` |
| `task docker:up` | `nx run docker:up` |
| `task docker:down` | `nx run docker:down` |
| `task docker:restart` | `nx run docker:restart` |
| `task docker:logs service-name` | `nx run docker:logs -- --service=service-name` |
| `task ci:check` | `nx run ci:check` |
| `task test` | `nx run test` |
| `task lint` | `nx run lint` |
| `task n8n:start` | `nx run workflow:n8n-start` |
| `task n8n:import` | `nx run workflow:n8n-import` |
| `task dev` | `nx run dev` |
| `task build` | `nx run build` |
| `task build:check` | `nx run build:check` |
| `task generate:manifest` | `nx run manifest:generate` |
| `task register:agents` | `nx run agents:register` |

## Architecture


Les scripts NX sont organisés dans deux endroits:

1. `nx.json` - Contient les configurations des tâches
2. `scripts/nx-tasks/` - Contient les scripts d'implémentation pour les tâches complexes

## Avantages


- **Cohérence** : Une seule façon de gérer les tâches d'automatisation
- **Cachabilité** : NX met en cache les résultats des tâches pour une exécution plus rapide
- **Extensibilité** : Plus facile d'ajouter de nouvelles tâches dans un système unifié
- **Documentation** : Toutes les tâches sont documentées dans un seul emplacement

## Simplification des orchestrateurs


En parallèle, nous avons simplifié les orchestrateurs en standardisant l'utilisation de:
- **BullMQ** pour les tâches asynchrones simples
- **Temporal** pour les workflows longs et complexes
- **UnifiedOrchestrator** comme point d'entrée principal

## Script de migration


Créer un fichier `scripts/taskfile-to-nx-migration.js` avec le contenu suivant:

```javascript
/**
- Script de migration des tâches Taskfile vers NX
- Ce script analyse le Taskfile.yaml et crée les scripts nécessaires
- pour permettre l'exécution des mêmes tâches via NX
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Lecture du Taskfile
const taskfileContent = fs.readFileSync(path.join(__dirname, '../Taskfile.yaml'), 'utf8');
const taskfile = yaml.load(taskfileContent);

// Chargement du fichier nx.json existant
const nxJsonPath = path.join(__dirname, '../nx.json');
const nxJson = JSON.parse(fs.readFileSync(nxJsonPath, 'utf8'));

// Pour chaque tâche dans le Taskfile, créer un script équivalent
Object.keys(taskfile.tasks).forEach(taskName => {
  const task = taskfile.tasks[taskName];

  // Ignorer les tâches déjà configurées dans NX
  const alreadyInNx = nxJson.targetDefaults && taskName in nxJson.targetDefaults;
  if (alreadyInNx) {
    console.log(`La tâche ${taskName} est déjà configurée dans NX.`);
    return;
  }

  // Créer un script équivalent dans le dossier scripts/nx-tasks
  // Ce script exécutera les commandes définies dans la tâche Taskfile
  const scriptName = `${taskName.replace(/:/g, '-')}.js`;
  const scriptPath = path.join(__dirname, 'nx-tasks', scriptName);

  if (!fs.existsSync(path.dirname(scriptPath))) {
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  }

  // Générer le contenu du script
  let scriptContent = `#!/usr/bin/env node
/**
- Script NX pour la tâche: ${taskName}
- Description: ${task.desc || 'No description'}
- Migré depuis Taskfile.yaml
 */

const { execSync } = require('child_process');
const path = require('path');

// Exécuter les commandes en séquence
try {
`;

  // Ajouter les commandes
  if (task.cmds && Array.isArray(task.cmds)) {
    task.cmds.forEach(cmd => {
      // Si la commande est une tâche Taskfile, la convertir en commande NX
      if (cmd.startsWith('task:')) {
        const subTaskName = cmd.replace('task:', '').trim();
        scriptContent += `  console.log('Exécution de la sous-tâche NX: ${subTaskName}');\n`;
        scriptContent += `  execSync('npx nx run ${subTaskName}', { stdio: 'inherit' });\n\n`;
      } else {
        // Sinon, exécuter la commande telle quelle
        scriptContent += `  console.log('Exécution: ${cmd}');\n`;
        scriptContent += `  execSync('${cmd}', { stdio: 'inherit' });\n\n`;
      }
    });
  }

  scriptContent += `  console.log('✅ Tâche ${taskName} terminée avec succès');\n`;
  scriptContent += `} catch (error) {
  console.error(\`❌ Erreur lors de l'exécution de la tâche ${taskName}: \${error}\`);
  process.exit(1);
}`;

  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755'); // Rendre le script exécutable

  console.log(`Script NX créé pour la tâche ${taskName}: ${scriptPath}`);
});

// Mettre à jour nx.json avec les nouvelles tâches
console.log('Mise à jour du fichier nx.json...');
fs.writeFileSync(nxJsonPath, JSON.stringify(nxJson, null, 2));

console.log('Migration terminée.');
```

