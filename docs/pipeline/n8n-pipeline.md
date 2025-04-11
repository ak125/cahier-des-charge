# Pipeline de Migration avec n8n

Ce document décrit comment utiliser n8n pour automatiser le processus de migration du code PHP vers NestJS/Remix.

## 📋 Vue d'ensemble

n8n est une plateforme d'automatisation de flux de travail qui nous permet de créer des pipelines de migration efficaces et visuels. Dans ce projet, n8n est utilisé pour :

1. Analyser le code PHP existant
2. Générer des rapports d'analyse
3. Orchestrer les étapes de migration
4. Générer du code pour la nouvelle architecture
5. Valider les migrations

## 🚀 Installation et configuration

### Prérequis

- Docker et docker-compose installés
- Node.js (pour les scripts d'importation)

### Installation

```bash
# Installer et configurer n8n
npm run n8n:setup

# Démarrer n8n
npm run n8n:start
```

L'interface de n8n sera accessible à l'adresse : http://localhost:5678
- Identifiants: admin / cahier-des-charges-migrator

## 🔄 Pipelines disponibles

Le projet inclut plusieurs pipelines préconfigurés :

1. **PHP Analyzer** (ID: `php-analyzer`)
   - Analyse les fichiers PHP existants
   - Extrait la structure, les dépendances et la logique métier
   - Génère des rapports JSON détaillés

2. **Code Generator** (ID: `code-generator`)
   - Génère du code NestJS/Remix à partir des rapports d'analyse
   - Crée la structure de fichiers cible
   - Applique les transformations nécessaires

3. **Documentation Updater** (ID: `docs-updater`)
   - Met à jour la documentation en fonction du code migré
   - Génère des rapports de migration

## 🛠️ Utilisation

### Lancer une migration

```bash
# Syntaxe : npm run n8n:migrate [WORKFLOW_ID] [SOURCE_PATH] [TARGET_PATH]

# Exemple avec le pipeline par défaut (php-analyzer)
npm run n8n:migrate

# Exemple avec un pipeline spécifique et des chemins personnalisés
npm run n8n:migrate code-generator ./reports/analysis ./src/generated
```

### Arrêter n8n

```bash
npm run n8n:stop
```

### Voir les logs de n8n

```bash
npm run n8n:logs
```

## 📊 Structure des workflows

Tous les workflows de pipeline sont définis dans les fichiers suivants :

- `n8n.pipeline.json` : Définition principale des workflows
- `config/*.n8n.json` : Configurations spécifiques à certains workflows

## 🔧 Personnalisation

Pour créer ou modifier un workflow :

1. Accédez à l'interface n8n à http://localhost:5678
2. Créez ou modifiez le workflow selon vos besoins
3. Exportez-le et intégrez-le dans `n8n.pipeline.json` ou créez un nouveau fichier dans `config/`

## 🔄 Intégration avec le cahier des charges

Les pipelines n8n sont conçus pour fonctionner en parallèle du cahier des charges. Ils implémentent les processus décrits dans le cahier des charges et s'assurent que la migration respecte les exigences spécifiées.

Les étapes de migration définies dans le cahier des charges sont automatisées via ces pipelines, ce qui permet :
- Une exécution cohérente et répétable
- Un suivi précis de la progression
- La génération de rapports détaillés
- Une traçabilité complète du processus
