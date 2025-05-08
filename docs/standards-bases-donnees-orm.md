# Standards de bases de données et ORM

Ce document définit les standards et directives pour l'utilisation des bases de données et des ORM dans le projet.

## Vue d'ensemble

| Technologie | Statut | Commentaire |
|-------------|--------|------------|
| **Prisma** | **ADOPTER** | ORM principal pour toutes les nouvelles fonctionnalités. À utiliser avec le schéma centralisé. |
| **TypeORM** | **MAINTENIR** | Conserver pour le code existant, mais ne pas utiliser pour les nouvelles fonctionnalités. |
| **MySQL** | **MAINTENIR** | Pour compatibilité avec les systèmes existants. |
| **PostgreSQL** | **ADOPTER** | Base de données principale pour toutes les nouvelles fonctionnalités. |
| **SQLite** | **LIMITER** | À utiliser uniquement pour les tests ou le développement local. |

## Directives d'utilisation

### Prisma

Prisma est notre ORM principal et doit être utilisé pour toutes les nouvelles fonctionnalités. Avantages:
- Typage fort avec génération automatique des types TypeScript
- API intuitive et facile à utiliser
- Schéma déclaratif centralisé
- Migrations gérées automatiquement
- Excellente intégration avec l'écosystème TypeScript/JavaScript

Pour les nouveaux projets ou fonctionnalités, utilisez le schéma Prisma centralisé situé dans le dossier `/prisma`.

### TypeORM

TypeORM est maintenu uniquement pour le code existant:
- Ne pas utiliser TypeORM pour les nouvelles fonctionnalités
- Planifier la migration progressive des fonctionnalités TypeORM vers Prisma
- Éviter d'étendre les modèles TypeORM existants sauf si absolument nécessaire

### Bases de données

#### PostgreSQL

PostgreSQL est notre base de données principale pour toutes les nouvelles fonctionnalités:
- Utiliser PostgreSQL pour tous les nouveaux services et applications
- Tirer parti des fonctionnalités avancées (JSON, indexation full-text, etc.)
- Configuration recommandée dans le dossier `/docker` pour les environnements de développement

#### MySQL

MySQL est maintenu uniquement pour la compatibilité avec les systèmes existants:
- Ne pas utiliser MySQL pour les nouvelles applications
- Planifier la migration progressive des bases MySQL existantes vers PostgreSQL
- Maintenir la compatibilité jusqu'à la fin de la migration complète
- Pour la stratégie détaillée de migration, consulter [la stratégie de migration MySQL vers PostgreSQL](/docs/agents/specific-agents/data-migration-strategy.md)

## Bonnes pratiques

1. **Centralisation des schémas**: Tous les schémas Prisma doivent être centralisés dans le dossier `/prisma`
2. **Migrations**: Utiliser les migrations Prisma pour tous les changements de schéma
3. **Validation**: Combiner Prisma avec Zod pour la validation des données (voir `/docs/prisma-zod-integration.md`)
4. **Transactions**: Utiliser les transactions pour les opérations qui modifient plusieurs entités
5. **Connexions**: Gérer correctement les connexions aux bases de données (pools, fermeture des connexions)

## Ressources

- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- Guide interne d'intégration Prisma-Zod: `/docs/prisma-zod-integration.md`