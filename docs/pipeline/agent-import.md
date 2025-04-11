# Importation des Agents dans n8n

Ce document explique comment utiliser le script `import-agents.js` pour importer des agents TypeScript dans n8n et créer des workflows automatisés.

## 📋 Vue d'ensemble

Le script `import-agents.js` permet de :
- Lire les agents définis en TypeScript depuis les dossiers du projet
- Convertir ces agents en nœuds n8n
- Créer des workflows n8n individuels pour chaque agent
- Créer un pipeline complet intégrant tous les agents

## 🚀 Structure des agents

Les agents sont organisés dans les dossiers suivants :
- `agents/analysis/` - Agents d'analyse du code PHP existant
- `agents/migration/` - Agents de migration vers NestJS/Remix
- `agents/core/` - Agents de base utiles à toutes les étapes
- `agents/quality/` - Agents de validation et contrôle qualité

## 🛠️ Utilisation

### Importer tous les agents

```bash
# Importer tous les agents disponibles
node import-agents.js
```

### Importer des agents spécifiques

```bash
# Importer uniquement les agents d'un type particulier
node import-agents.js --type=migration

# Importer un agent spécifique
node import-agents.js --agent=DatabaseMigrationAgent
```

## 🔧 Personnalisation

Pour créer un nouvel agent :

1. Créez un fichier TypeScript dans le dossier approprié (par exemple, `agents/migration/MyNewAgent.ts`)
2. Implémentez la logique de l'agent en suivant le modèle existant
3. Exécutez le script d'importation pour l'ajouter à n8n

## 🔄 Fonctionnement interne

Le script `import-agents.js` :
1. Se connecte à n8n avec authentification
2. Lit les fichiers agents TypeScript
3. Analyse le contenu pour extraire les méthodes et fonctionnalités
4. Convertit chaque agent en un nœud n8n
5. Crée des workflows individuels pour chaque agent
6. Crée un pipeline complet qui intègre tous les agents dans un flux de travail cohérent

## 🔗 Intégration avec le pipeline principal

Les agents importés sont automatiquement intégrés dans le pipeline principal de migration défini dans `n8n.pipeline.json`. Ils peuvent être utilisés individuellement ou comme partie du processus complet de migration.