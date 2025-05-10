---
title: Structure Dossiers
description: Architecture à trois couches et structure
slug: structure-dossiers
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Structure de dossiers du projet


*Document créé le 3 mai 2025*

## Vue d'ensemble


Le projet a été restructuré selon les standards modernes de développement et suit une architecture modulaire basée sur les principes de Nx. Cette nouvelle structure permet une meilleure séparation des préoccupations, une réutilisation facilitée du code, et une maintenance plus aisée.

## Structure principale


```
/
├── apps/                 # Applications exécutables
├── packages/             # Bibliothèques partagées
├── tools/                # Outils et scripts utilitaires
├── docs/                 # Documentation
├── docker/               # Configuration Docker
└── prisma/               # Modèles et migrations de base de données
```

## Détail des dossiers


### Apps (`/apps`)


Contient les applications exécutables complètes :

```
apps/
├── admin-dashboard/      # Application d'administration
├── backend/              # API backend principale
├── frontend/             # Application frontale principale
│   └── src/
│       └── routes/       # Routes de l'application frontend
├── mcp-server/           # Serveur MCP générique
├── mcp-server-mysql/     # Serveur MCP avec MySQL
├── mcp-server-php/       # Serveur MCP avec PHP
├── mcp-server-postgres/  # Serveur MCP avec PostgreSQL
└── projet-codespaces/    # Application pour environnement Codespaces
```

### Packages (`/packages`)


Contient les bibliothèques partagées et réutilisables :

```typescript
packages/
├── agents/               # Agents MCP
│   ├── base/             # Classes et interfaces de base pour les agents
│   ├── php-analyzer/     # Agent d'analyse PHP
│   ├── seo/              # Agent SEO
│   ├── code-analysis/    # Agent d'analyse de code
│   ├── text-processing/  # Agent de traitement de texte
│   ├── data-extraction/  # Agent d'extraction de données
│   └── wasm/             # Agents WASM
├── orchestration/        # Infrastructure d'orchestration
│   ├── bridges/          # Ponts d'orchestration standardisés
│   ├── adapters/         # Adaptateurs pour les différents orchestrateurs
│   └── interfaces/       # Interfaces communes d'orchestration
├── business/             # Logique métier partagée
│   ├── models/           # Modèles de données métier
│   └── services/         # Services métier
├── ui/                   # Composants d'interface utilisateur partagés
│   ├── components/       # Composants UI réutilisables
│   ├── hooks/            # Hooks React réutilisables
│   ├── contexts/         # Contextes React
│   ├── themes/           # Configuration des thèmes
│   └── utils/            # Utilitaires UI
└── utils/                # Utilitaires généraux partagés
```

### Tools (`/tools`)


Contient des scripts et outils pour faciliter le développement :

```
tools/
├── scripts/              # Scripts utilitaires
├── generators/           # Générateurs de code
└── executors/            # Exécuteurs pour Nx
```

### Docs (`/docs`)


Contient la documentation du projet :

```
docs/
├── architecture/         # Documentation de l'architecture
├── technical/            # Documentation technique
├── guides/               # Guides d'utilisation
└── packages/             # Documentation des packages
```

### Docker (`/docker`)


Contient les configurations Docker :

```
docker/
├── docker-compose.yml           # Configuration docker-compose principale
└── docker-compose.monitoring.yml # Configuration pour le monitoring
```

### Prisma (`/prisma`)


Contient les modèles et migrations de base de données :

```
prisma/
├── schema.prisma        # Schéma Prisma
└── migrations/          # Migrations de base de données générées
```

## Imports et alias


Le projet utilise des alias d'importation pour faciliter les références entre packages :

| Alias | Chemin |
|-------|--------|
| `@packages/agents` | `packages/agents` |
| `@packages/orchestration` | `packages/orchestration` |
| `@packages/business` | `packages/business` |
| `@packages/ui` | `packages/ui` |
| `@packages/utils` | `packages/utils` |

Exemples d'utilisation :

```typescript
// Import direct d'un package
import { BaseAgent } from '@packages/agents';

// Import d'un sous-module spécifique
import { standardizedOrchestrator } from '@packages/orchestration';
import { UserModel } from '@packages/business/models';
import { Button } from '@packages/ui/components';
import { formatDate } from '@packages/utils';
```

## Compatibilité avec l'ancienne structure


Pour assurer une transition en douceur, des fichiers de compatibilité ont été mis en place pour rediriger les anciens imports vers les nouveaux emplacements. Ces fichiers seront maintenus pendant la période de migration, puis supprimés une fois que tous les imports auront été mis à jour.

## Notes de migration


Cette nouvelle structure résout l'incohérence architecturale précédemment identifiée où coexistaient les structures `app/`, `apps/`, et `src/` avec des responsabilités qui se chevauchaient.

- Le contenu de `app/` a été déplacé vers les dossiers correspondants dans `packages/` et `apps/`
- La structure `apps/` est maintenue et conforme aux standards Nx
- Le contenu de `src/` a été organisé dans les packages appropriés

## Prochaines étapes


1. Continuer à migrer les imports restants vers les nouveaux emplacements
2. Mettre à jour la documentation pour les nouveaux packages
3. Améliorer la couverture des tests pour les packages nouvellement créés
4. Standardiser l'utilisation des alias d'importation dans la base de code

