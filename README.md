# Cahier des Charges - Migration PHP vers NestJS/Remix

Ce dépôt contient la documentation, les outils et les agents IA pour la migration d'une application PHP legacy vers une architecture moderne NestJS/Remix.

## 📋 Structure du projet

> **Note:** Le projet a été réorganisé et unifié pour améliorer sa maintenance. Consultez [STRUCTURE.md](STRUCTURE.md) pour plus de détails sur la nouvelle organisation.

- `/agents/` - Agents IA organisés par fonctionnalité (core, analysis, migration, quality)
- `/docs/` - Documentation centralisée
  - `/docs/cahier-des-charges/` - Documentation principale du cahier des charges
  - `/docs/specifications/` - Documents de référence et spécifications
- `/scripts/` - Scripts d'automatisation organisés par fonction
- `/config/` - Fichiers de configuration
- `/reports/` - Rapports générés par les agents
- `/tools/` - Outils utilitaires pour le processus de migration
- `/workflows/` - Définitions des workflows pour n8n
- `/backups/` - Sauvegardes du projet

## 🚀 Commandes principales

### Orchestration centrale

```bash
# Afficher l'aide de l'orchestrateur
npm run orchestrate -- --help

# Auditer un fichier PHP spécifique
npm run audit -- /chemin/vers/fichier.php

# Auditer un dossier complet de fichiers PHP
npm run audit-dir -- /chemin/vers/dossier

# Afficher un résumé du cahier des charges
npm run cahier

# Afficher le statut actuel de la migration
npm run migration-status

# Lancer le tableau de bord de visualisation
npm run migration-dashboard
```

### Scripts d'analyse et de contrôle

```bash
# Exécuter le système de diagnostic
npm run diagnostic

# Vérifier l'installation
npm run verify-installation

# Générer des configurations d'agent
npm run generate-agent-configs

# Lancer les tests des agents
npm run test-agents

# Générer un audit complet
npm run generate-audit
```

### Gestion du cahier des charges

```bash
# Menu interactif de gestion du cahier
./manage-cahier.sh

# Vérifier le cahier des charges
./scripts/verify-cahier.sh

# Générer une vue HTML du cahier des charges
npm run generate-view
```

## 🔄 Processus de migration

Le processus de migration est organisé en plusieurs phases comme défini dans le cahier des charges :

1. **Analyse initiale** - Cartographie et audit du code legacy
2. **Planification** - Définition de la stratégie de migration module par module
3. **Migration de la base de données** - MySQL vers PostgreSQL avec Prisma
4. **Migration du code** - PHP vers TypeScript (NestJS/Remix)
5. **Tests et validation** - Vérification fonctionnelle et tests de qualité
6. **Déploiement** - Mise en production progressive

## 🤖 Agents IA

Les agents IA sont au cœur du processus de migration et sont organisés selon leur fonction :

| Agent | Description |
|-------|-------------|
| `BusinessAgent` | Analyse les règles métier et logiques fonctionnelles |
| `StructureAgent` | Cartographie la structure du code et les dépendances |
| `DataAgent` | Analyse les accès aux données et génère le schéma Prisma |
| `DependencyAgent` | Détecte les dépendances entre composants |
| `QualityAgent` | Vérifie la qualité du code et suggère des améliorations |
| `StrategyAgent` | Détermine la stratégie optimale de migration |
| `AssemblerAgent` | Assemble les différentes parties du code migré |

Un `CoordinatorAgent` orchestre l'exécution de ces agents dans le bon ordre, avec gestion des dépendances et parallélisation possible.

## ⚙️ Configuration

La configuration principale se trouve dans le fichier `migration-config.json` qui permet de personnaliser :

- Le chemin vers le cahier des charges
- Les agents à utiliser dans chaque phase
- Les technologies cibles (backend/frontend)
- Les étapes de migration
- Les options d'exécution

## 📊 Tableau de bord

Le tableau de bord fournit une visualisation de la progression de la migration et des métriques clés :

- État d'avancement global et par module
- Qualité du code migré
- Couverture des tests
- Points de blocage identifiés
- Prochaines étapes recommandées

Lancez-le avec `npm run migration-dashboard`.

## 📝 Documentation

- Documentation complète du cahier des charges dans `/docs/cahier-des-charges/`
- Plans de migration détaillés dans `/backups/`
- Documentation des agents dans `/docs/agents/`
- Guide de dépannage dans `/docs/troubleshooting.md`

## 🔧 Maintenance

Ce projet est maintenu automatiquement par un système d'agents IA. Pour plus d'informations sur les procédures de maintenance, consultez `/docs/maintenance.md`.

## 📈 Progression

Pour suivre la progression de la migration, utilisez les commandes suivantes :
```bash
# Statut actuel de la migration
npm run migration-status

# Vérifier les résultats de migration
npm run check-migration-results

# Afficher les logs récents
npm run logs
```
