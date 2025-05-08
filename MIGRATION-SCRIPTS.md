# Migration des Scripts Bash vers Nx et Earthfile

## Introduction

Ce document explique notre migration des scripts bash vers une architecture standardisée basée sur Nx et Earthfile. Cette démarche améliore la reproductibilité des builds, la stabilité de notre pipeline CI/CD et l'expérience des développeurs.

## Pourquoi cette migration ?

1. **Reproductibilité** : Earthfile garantit une exécution identique en local et en CI
2. **Stabilité** : Élimination des problèmes de bash cassé ou non portable
3. **Cache intelligent** : Nx offre un système de cache sophistiqué pour accélérer les builds
4. **Exécution parallèle** : Possibilité d'exécuter les tâches en parallèle
5. **Standardisation** : Une approche unifiée pour tous les scripts d'infrastructure
6. **Documentation** : Les cibles sont auto-documentées

## Scripts Migrés

Cette section liste les anciens scripts et leurs équivalents Nx/Earthfile.

| Ancien Script | Nouveau Equivalent | Description |
|---------------|-------------------|-------------|
| `optimize-disk-space.sh` | `earthly +optimize-disk` | Optimise l'espace disque |
| `optimize-git-repo.sh` | `earthly +optimize-disk` | Optimise le dépôt Git (inclus dans optimize-disk) |
| `optimize-project.sh` | `earthly +optimize-disk && earthly +cleanup-project` | Optimisation complète du projet |
| `migrate-agents.sh` | `earthly +ci-migrate --MODE=execute --MIGRATE_TYPE=agents` | Migration des agents |
| `migrate-to-bullmq.sh` | `earthly +ci-migrate --MODE=execute --MIGRATE_TYPE=bullmq` | Migration vers BullMQ |
| `migrate-to-temporal.js` | `earthly +ci-migrate --MODE=execute --MIGRATE_TYPE=temporal` | Migration vers Temporal |
| `start-migration.sh` | `earthly +ci-migrate --MODE=execute --MIGRATE_TYPE=all` | Démarrage des migrations (tous types) |
| `cleanup-project.sh` | `earthly +cleanup-project` | Nettoyage du projet |
| `ci-check-redirects.sh` | `earthly +check-seo-redirects` | Vérification des redirections SEO |
| `verify-cahier.sh` | `earthly +generate-cahier --UPDATE_MODE=check` | Vérification du cahier des charges |
| `update-cahier.sh` | `earthly +generate-cahier --UPDATE_MODE=update` | Mise à jour du cahier des charges |
| `nx-wrapper.sh` | `npx nx` | Utiliser directement les commandes Nx |

## Utilisation des Nouvelles Cibles Nx

Nx offre maintenant des cibles typées pour notre monorepo. Voici comment les utiliser :

```bash
# Exécuter le typecheck sur tous les projets
npx nx run-many --target=typecheck --all

# Exécuter le typecheck sur un projet spécifique
npx nx run admin-dashboard:typecheck

# Optimiser la base de données
npx nx run-many --target=db-optimize --all

# Lancer les migrations CI
npx nx run-many --target=ci-migrate --all
```

## Utilisation des Cibles Earthfile

Earthfile offre une exécution reproductible pour nos scripts d'infrastructure :

```bash
# Exécuter l'optimisation du disque
earthly +optimize-disk

# Avec des arguments spécifiques
earthly +optimize-disk --MIN_FREE_SPACE=10 --ENABLE_DOCKER_CLEAN=true

# Migration en mode dry-run
earthly +ci-migrate --MODE=dry-run

# Migration complète
earthly +ci-migrate --MODE=execute --MIGRATE_TYPE=all

# CI complète
earthly +ci-full

# Déploiement complet
earthly +deploy-full --ENV=staging
```

## Script d'Aide pour la Transition

Nous avons créé un script d'aide interactif pour faciliter la transition :

```bash
# Exécuter le script d'aide
./scripts/migration-guide.js
```

Ce script vous guide dans l'utilisation des nouvelles commandes, vous permet de rechercher des équivalents aux anciens scripts, et offre des exemples d'utilisation.

## CI/CD

Notre pipeline CI/CD a été mis à jour pour utiliser ces nouvelles cibles. Les principaux workflows sont :

1. **Vérification de code** : `earthly +typecheck && earthly +lint`
2. **Tests** : `earthly +test`
3. **Optimisation de base de données** : `earthly +db-optimize`
4. **Migration CI** : `earthly +ci-migrate --MODE=dry-run`
5. **Build complet** : `earthly +ci-full`
6. **Déploiement** : `earthly +deploy-full --ENV=production`

## Avantages de la Nouvelle Approche

- **Mise en cache améliorée** : Les builds sont beaucoup plus rapides grâce au cache intelligent de Nx
- **Reproductibilité** : Fini les "ça marche chez moi"
- **Traçabilité** : Les cibles documentent clairement ce qui est exécuté
- **Extensibilité** : Facile d'ajouter de nouvelles cibles sans casser l'existant
- **Observabilité** : Meilleure visibilité sur l'exécution des scripts

## Conclusion

Cette migration représente une amélioration significative de notre infrastructure de développement et CI/CD. Elle standardise nos pratiques et nous prépare pour une meilleure évolutivité et maintenabilité du projet.

## Contact

Pour toute question concernant cette migration, contactez l'équipe DevOps ou consultez la documentation détaillée dans le dossier `/docs/devops`.