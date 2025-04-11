# Structure du Projet Cahier des Charges - Guide d'Organisation

## Vue d'ensemble

Ce document présente la nouvelle structure unifiée du projet "cahier-des-charge" suite à la réorganisation. Cette structure vise à faciliter la maintenance, la collaboration et l'évolution du projet de migration PHP vers NestJS/Remix.

## Hiérarchie des dossiers

### Documentation

- `/docs/` - Documentation centralisée
  - `/docs/cahier-des-charges/` - Cahier des charges complet et détaillé
  - `/docs/specifications/` - Spécifications techniques et documents de référence

### Code et Agents

- `/agents/` - Agents IA pour l'analyse et la migration
  - `/agents/core/` - Agents de base et coordination
  - `/agents/analysis/` - Agents d'analyse du code source
  - `/agents/migration/` - Agents de migration et transformation
  - `/agents/quality/` - Agents de contrôle qualité

### Structure applicative

- `/app/` - Code de l'application principale
- `/apps/` - Applications multiples (structure monorepo)
- `/src/` - Code source partagé

### Outils et configuration

- `/scripts/` - Scripts organisés par fonction
  - `/scripts/migration/` - Scripts liés à la migration
  - `/scripts/verification/` - Scripts de vérification et validation
  - `/scripts/generation/` - Scripts de génération de code et documentation
  - `/scripts/maintenance/` - Scripts de maintenance du projet
- `/config/` - Fichiers de configuration
- `/tools/` - Outils utilitaires
- `/templates/` - Modèles et templates
- `/rules/` - Règles et contraintes

### Ressources

- `/assets/` - Ressources statiques
- `/backups/` - Sauvegardes du projet
- `/mock-data/` - Données de test
- `/examples/` - Exemples d'utilisation

### Intégration et déploiement

- `/ci/` - Configuration d'intégration continue
- `/workflows/` - Définitions des workflows

## Fichiers principaux

- `README.md` - Documentation principale du projet
- `migration-config.json` - Configuration de la migration
- `package.json` - Dépendances npm et scripts
- `tsconfig.json` - Configuration TypeScript
- `docker-compose.yml` - Configuration Docker

## Scripts d'organisation

- `organize-project.sh` - Script principal de réorganisation
- `fix-agent-imports.sh` - Correction des imports après réorganisation
- `verify-reorganization.sh` - Vérification de la structure du projet

## Comment utiliser cette structure

### Travailler avec la documentation

La documentation est maintenant centralisée dans le dossier `/docs/`. Pour consulter le cahier des charges complet, naviguez vers `/docs/cahier-des-charges/`.

### Développer ou modifier les agents

Les agents sont organisés par fonction dans le dossier `/agents/`. Pour ajouter un nouvel agent d'analyse, placez-le dans `/agents/analysis/`.

### Exécuter les scripts

Les scripts sont désormais organisés par fonctionnalité dans le dossier `/scripts/`. Par exemple, pour lancer un script de migration :

```bash
./scripts/migration/run-progressive-migration.sh
```

### Mettre à jour la configuration

Les fichiers de configuration principaux restent à la racine du projet pour faciliter l'accès, tandis que les configurations spécifiques se trouvent dans le dossier `/config/`.

## Maintenance de la structure

Pour maintenir cette structure organisée au fil du temps :

1. Placez toujours les nouveaux fichiers dans le dossier approprié
2. Mettez à jour la documentation lorsque vous ajoutez de nouveaux composants
3. Utilisez les scripts de vérification régulièrement pour détecter les problèmes

## Avantages de cette nouvelle structure

- **Meilleure séparation des préoccupations** - Chaque type de fichier a sa place
- **Navigation facilitée** - Structure intuitive pour tous les collaborateurs
- **Maintenance simplifiée** - Réduction des conflits et amélioration de la lisibilité
- **Évolutivité** - Structure adaptée à la croissance du projet