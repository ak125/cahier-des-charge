---
title: README
slug: readme
module: README.md
status: stable
lastReviewed: 2025-05-09
---

# Documentation du Projet MCP

> **Note importante** : L'utilisation de n8n est désormais dépréciée conformément au document `technologies-standards.md`. Tous les workflows n8n existants doivent être migrés vers BullMQ (pour les jobs simples) ou Temporal.io (pour les workflows complexes).



*Dernière mise à jour: 2025-05-09*

Cette documentation est organisée selon une architecture à six sections pour faciliter la navigation et la maintenance.

## Structure


1. **[Core (0-core)](0-core/README.md)**
   - Conventions de code, style guides et documentation fondamentale
   - [Guide de style](0-core/style-guide.md)
   - [Conventions TypeScript](0-core/typescript-conventions.md)

2. **[Architecture (1-architecture)](1-architecture/README.md)**
   - Architecture à trois couches, structures et bonnes pratiques
   - [Architecture à trois couches](1-architecture/architecture-trois-couches.md)
   - [Guide de tests](1-architecture/guide-tests-architecture-trois-couches.md)
   - [Index de l'architecture](1-architecture/index-architecture-trois-couches.md)

3. **[Migration (2-migration)](2-migration/README.md)**
   - Guides et rapports sur les processus de migration
   - [Guide de migration des agents](2-migration/guide-migration-agents.md)
   - [Guide de correction des duplications](2-migration/guide-correction-duplications-agents.md)

4. **[Orchestration (3-orchestration)](3-orchestration/README.md)**
   - Documentation sur l'orchestrateur standardisé et les systèmes de coordination
   - [Guide de l'orchestrateur standardisé](3-orchestration/orchestrateur-standardise-guide.md)
   - [Rapport d'audit de l'orchestrateur](3-orchestration/orchestrator-audit-report.md)

5. **[NX & CI/CD (4-nx-ci)](4-nx-ci/README.md)**
   - Configuration NX, pipelines CI/CD et automatisation
   - [Guide d'utilisation de NX](4-nx-ci/nx-usage-guide.md)
   - [Pipeline CI/CD avec NX](4-nx-ci/nx-pipeline-ci-cd.md)

6. **[Intégration (5-integration)](5-integration/README.md)**
   - Standards d'intégration, migrations N8N, ORM et autres outils
   - [Migration de N8N vers Temporal](5-integration/n8n-to-temporal-migration-patterns.md)
   - [Standards des bases de données et ORM](5-integration/standards-bases-donnees-orm.md)

7. **[Planning (6-planning)](6-planning/README.md)**
   - Planification, stratégie et suivi des tâches
   - [Stratégie de migration](6-planning/migration-strategy.md)
   - [Changelog](6-planning/changelog.md)

## Utilisation


- **Navigation**: Utilisez les liens ci-dessus pour naviguer dans la documentation.
- **Recherche**: Le fichier `docs-index.json` peut être utilisé pour implémenter une recherche dans un dashboard Remix ou une interface Obsidian.
- **Rapports**: Un rapport complet de la documentation est disponible dans [documentation-report.md](documentation-report.md).

## Archives


Les anciennes versions de la documentation sont conservées dans le dossier [`_archives/`](_archives/README.md).

---

*Cette documentation a été organisée selon le plan de restructuration de mai 2025.*

Cette documentation peut être consultée de plusieurs façons:
- Directement sur GitHub

- Via le dashboard Remix Admin (en développement)

## Maintenance


Pour ajouter de nouveaux documents, placez-les dans le dossier approprié et exécutez:
```bash
node tools/scripts/update-docs-index.js
```

Pour identifier les documents similaires à fusionner:
```bash
node tools/scripts/detect-similar-md.js
```

