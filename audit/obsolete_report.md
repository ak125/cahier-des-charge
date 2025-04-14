# Rapport d'obsolescence — MCP Smart Scan

*Date de génération : 14/04/2025*

Ce rapport analyse la structure complète du projet monorepo NestJS + Remix + MCP pour identifier les fichiers potentiellement obsolètes, inutilisés ou à archiver. Les fichiers sont classés selon quatre catégories :

- **✅ Actif** : fichier utilisé dans le code, présent dans une route Remix, un contrôleur NestJS, un import MCP
- **🌀 Généré (non validé)** : fichier créé par un agent MCP, mais encore en simulations/audit
- **⚠️ Obsolète** : fichier avec suffixes .copy, .bak, .v1, ou jamais importé/utilisé
- **📦 Archive** : code PHP déjà migré, scripts de migration MySQL, visualisations historiques

## Résumé

| Catégorie | Nombre de fichiers |
|-----------|-------------------|
| ✅ Actif | 4 |
| 🌀 Généré (non validé) | 3 |
| ⚠️ Obsolète | 32 |
| 📦 Archive | 0 |

## Détail des fichiers par catégorie

### ✅ Fichiers actifs

| Fichier | Statut | Raison |
|---------|--------|--------|
| apps/frontend/app/routes/dashboard.migration-patches.tsx | ✅ Actif | Point d'entrée ou route active |
| apps/frontend/app/routes/products.tsx | ✅ Actif | Point d'entrée ou route active |
| tools/index_suggestions.sql | ✅ Actif | Fichier utilisé dans le projet |
| tools/partition_plan.json | ✅ Actif | Fichier utilisé dans le projet |

### 🌀 Fichiers générés (non validés)

| Fichier | Statut | Raison |
|---------|--------|--------|
| audit/monorepo-analyzer/example-code_style_profile.json | 🌀 Généré (non validé) | Fichier d'audit ou de simulation non validé |
| audit/monorepo-analyzer/example-project_structure.json | 🌀 Généré (non validé) | Fichier d'audit ou de simulation non validé |
| audit/obsolete_report.md | 🌀 Généré (non validé) | Fichier d'audit ou de simulation non validé |

### ⚠️ Fichiers obsolètes

| Fichier | Statut | Raison |
|---------|--------|--------|
| packages/mcp-agents/analysis/php-analyzer.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/core/nestjs-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/core/remix-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/generators/nestjs-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/generators/remix-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/generators/remix-generator.ts.bak-20250413112129 | ⚠️ Obsolète | Nom contient un suffixe de version/doublon (.bak) |
| packages/mcp-agents/index.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/index.ts.bak-20250413112129 | ⚠️ Obsolète | Nom contient un suffixe de version/doublon (.bak) |
| packages/mcp-agents/migration-validator.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| packages/mcp-agents/monorepo-analyzer.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/mysql-to-postgresql.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/nestjs-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/package.json | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/php-analyzer.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/php-analyzer/index.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/prisma-analyzer.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| packages/mcp-agents/prisma-to-dto.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| packages/mcp-agents/prisma-to-zod.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| packages/mcp-agents/remix-generator.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| packages/mcp-agents/test-writer.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| packages/mcp-agents/types/index.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| prisma/schema.prisma | ⚠️ Obsolète | Fichier en doublon dans le projet |
| tools/agent_orchestrator.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/agents/index.js | ⚠️ Obsolète | Fichier en doublon dans le projet |
| tools/agents/package.json | ⚠️ Obsolète | Fichier en doublon dans le projet |
| tools/export-csv.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/generate-migration-patch.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/project-structure-analyzer.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/scan-obsolete.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/supabase-migration-plan-sync.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |
| tools/type-mapper.ts | ⚠️ Obsolète | Fichier en doublon dans le projet |
| tools/validate_audit_outputs.ts | ⚠️ Obsolète | Fichier non importé ni utilisé ailleurs |

## Actions recommandées

### 1. Fichiers à supprimer en sécurité

Les fichiers suivants peuvent être supprimés sans impact sur le projet :

```bash
rm packages/mcp-agents/analysis/php-analyzer.ts
rm packages/mcp-agents/core/nestjs-generator.ts
rm packages/mcp-agents/core/remix-generator.ts
rm packages/mcp-agents/generators/nestjs-generator.ts
rm packages/mcp-agents/generators/remix-generator.ts
rm packages/mcp-agents/generators/remix-generator.ts.bak-20250413112129
rm packages/mcp-agents/index.ts
rm packages/mcp-agents/index.ts.bak-20250413112129
rm packages/mcp-agents/monorepo-analyzer.ts
rm packages/mcp-agents/mysql-to-postgresql.ts
rm packages/mcp-agents/nestjs-generator.ts
rm packages/mcp-agents/package.json
rm packages/mcp-agents/php-analyzer.ts
rm packages/mcp-agents/php-analyzer/index.ts
rm packages/mcp-agents/remix-generator.ts
rm packages/mcp-agents/types/index.ts
rm prisma/schema.prisma
rm tools/agents/index.js
rm tools/agents/package.json
rm tools/type-mapper.ts
```

### 2. Fichiers à archiver (à déplacer vers /archives)

Créer un dossier d'archives pour stocker les fichiers historiques :

```bash
mkdir -p archives/migration-history
mkdir -p archives/backups
mkdir -p archives/php-legacy
mkdir -p archives/sql-legacy

```

### 3. Fichiers générés à valider

Les fichiers suivants nécessitent une validation ou une regénération :

```
audit/monorepo-analyzer/example-code_style_profile.json
audit/monorepo-analyzer/example-project_structure.json
audit/obsolete_report.md
```

Il est recommandé de :
- Valider les fichiers d'audit générés et les intégrer dans la documentation officielle
- Regénérer les exemples en utilisant les données actuelles du projet
- Unifier les fichiers d'audit en évitant les doublons

## Recommandations structurelles

1. **Consolidation des générateurs** :
   - Ne conserver qu'une seule instance de chaque générateur
   - Centraliser les générateurs dans un dossier unique (idéalement `packages/mcp-agents/generators/`)
   - Supprimer les doublons et les versions obsolètes

2. **Gestion des versions d'agents** :
   - Éviter les suffixes de version (`-v1`, `-v2`) en faveur d'un système de versioning Git
   - Utiliser des tags sémantiques pour marquer les versions stables
   - Documenter les changements majeurs dans CHANGELOG.md

3. **Politique de sauvegardes** :
   - Implémenter une politique de rétention (garder uniquement les N dernières sauvegardes)
   - Utiliser un système de sauvegarde différentiel pour réduire la taille
   - Éviter les doublons de sauvegardes dans différents répertoires

4. **Structure du projet** :
   - Nettoyer les dossiers vides
   - Centraliser les audits et simulations dans des dossiers dédiés
   - Séparer clairement le code production des outils de migration

