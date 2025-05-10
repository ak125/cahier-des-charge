---
title: README
description: Documentation fondamentale et conventions
slug: readme
module: 0-core
status: stable
lastReviewed: 2025-05-09
---

# Documentation du projet


Ce répertoire contient la documentation officielle du projet.

## Documents de référence principaux


| Domaine | Document de référence |
|---------|----------------------|
| Standards des bases de données et ORM | [standards-bases-donnees-orm.md](../5-integration/standards-bases-donnees-orm) |
| Technologies standards | [technologies-standards.md](../5-integration/technologies-standards) |
| Stratégie de migration MySQL vers PostgreSQL | [agents/specific-agents/data-migration-strategy.md](../1-architecture/agents/specific/data-migration-strategy) |
| Intégration Prisma avec Zod | [prisma-zod-integration.md](../5-integration/prisma-zod-integration) |

## Note sur la duplication de documentation


Il existe actuellement plusieurs copies des documents de stratégie de migration dans le projet. Ces copies sont considérées comme des documents obsolètes qui seront supprimés lors d'une future opération de nettoyage :

- `/workspaces/cahier-des-charge/documentation-site/docs/agents/specific-agents/data-migration-strategy.md` (obsolète)
- `/workspaces/cahier-des-charge/packages/agents/legacy-agents/migration/examples/data-migration-strategy.md` (obsolète)
- `/workspaces/cahier-des-charge/tmp-restructuration/packages/agents/others/legacy/migration/examples/data-migration-strategy.md` (obsolète)

**Importance** : Toujours se référer aux documents du répertoire `/docs` pour les informations les plus à jour.

