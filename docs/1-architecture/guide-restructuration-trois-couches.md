---
title: Guide Restructuration Trois Couches
description: Architecture à trois couches et structure
slug: guide-restructuration-trois-couches
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Guide de restructuration vers l'architecture en trois couches


## Objectif principal


**L'objectif fondamental de cette restructuration est d'éliminer les duplications et d'organiser le code selon une architecture en trois couches cohérente**. Le projet actuel contient de nombreuses duplications, des fichiers obsolètes et des implémentations redondantes qui nuisent à sa maintenabilité.

## Principes fondamentaux


La restructuration du projet vers une architecture en trois couches (orchestration, coordination, métier) doit suivre une approche méthodique qui **privilégie la réutilisation et la consolidation des éléments existants** plutôt que la création de nouvelles structures.

## Méthodologie de restructuration


### 1. Identifier et éliminer les duplications


**Priorité absolue:** La suppression des duplications est la première étape cruciale.

- **Identifier les doublons** — Utiliser des outils d'analyse pour détecter les fichiers et fonctionnalités dupliqués
- **Centraliser les définitions** — Choisir un emplacement canonique pour chaque interface/classe
- **Supprimer les copies redondantes** — Une fois la version canonique confirmée, supprimer les duplications
- **Rediriger les références** — Mettre à jour tous les imports pour pointer vers la version canonique

### 2. Examiner l'existant avant de créer


**Important:** Avant de créer de nouveaux fichiers ou interfaces, toujours examiner le code existant pour:
- Identifier les implémentations ou interfaces similaires
- Comprendre les conventions déjà établies
- Éviter les duplications inutiles

### 3. Déplacer et consolider en priorité


La restructuration doit suivre cette séquence d'actions:

1. **Examiner** — Analyser les fichiers et interfaces existants
2. **Déplacer** — Transférer les éléments pertinents vers la nouvelle structure
3. **Consolider** — Fusionner les implémentations redondantes
4. **Créer** — Uniquement en dernier recours, si aucune implémentation existante n'est trouvée

### 4. Nettoyer et supprimer systématiquement


**Important:** Une restructuration efficace implique non seulement de déplacer et consolider, mais aussi de nettoyer et supprimer les éléments redondants ou obsolètes:

- **Suppression méthodique** — Éliminer les fichiers devenus inutiles après leur migration
- **Documentation des suppressions** — Documenter chaque suppression avec la justification correspondante
- **Nettoyage des imports** — Supprimer les imports non utilisés ou obsolètes
- **Suppression des doublons** — Une fois les fichiers consolidés, supprimer les versions redondantes
- **Vérification de l'intégrité** — S'assurer que les suppressions n'ont pas d'impact négatif sur le système

La règle fondamentale: **Un code non utilisé est un code nuisible**. La présence de code obsolète ou redondant rend la maintenance plus difficile et introduit des risques d'erreurs.

## Plan d'action concret pour l'élimination des duplications


### Étape 1: Cartographie des duplications


1. **Interfaces dupliquées:**
   - Interfaces MCP dans `packages/mcp-types/src/layer-contracts.ts` vs `packages/core/interfaces/*`
   - Interfaces d'agents dans différents packages (`packages/business`, `packages/mcp-agents`, etc.)

2. **Implémentations dupliquées:**
   - Agents avec fonctionnalités similaires dispersés dans plusieurs dossiers
   - Utilitaires redondants (`packages/utils`, `packages/mcp-utils`, etc.)

3. **Documentation dupliquée:**
   - Documentation dispersée entre `docs`, `documentation_backup_v2`, et `documentation-site`

### Étape 2: Plan d'élimination par catégorie


#### Interfaces (priorité haute)


1. Confirmer que `packages/core/interfaces/` est l'emplacement canonique
2. Vérifier la complétude de ces interfaces (comme nous venons de le faire)
3. Ajouter une notice de dépréciation dans `packages/mcp-types/src/layer-contracts.ts`
4. Planifier la suppression du fichier redundant après la migration des imports

#### Agents (priorité haute)


1. Classifier tous les agents selon l'architecture en trois couches
2. Identifier les agents aux fonctionnalités similaires ou identiques
3. Consolider ces agents en une seule implémentation par fonctionnalité
4. Créer un journal des suppressions et des redirections d'imports

#### Utilitaires (priorité moyenne)


1. Inventorier tous les utilitaires dans les différents packages
2. Regrouper par fonction (DB, validation, formatage, etc.)
3. Consolider les utilitaires par fonction dans les emplacements appropriés
4. Supprimer les versions obsolètes

#### Documentation (priorité moyenne)


1. Centraliser toute la documentation dans le dossier `docs`
2. Organiser selon la structure de l'architecture en trois couches
3. Supprimer les dossiers de documentation redondants

### Étape 3: Suivi et validation


Pour chaque élément dupliqué éliminé:
1. Documenter dans un journal de suppressions (date, fichier, raison, alternative)
2. Valider que les tests passent après la suppression
3. Vérifier qu'aucune fonctionnalité n'a été perdue

## Exemple de journal de déduplication


| Date | Catégorie | Élément supprimé | Raison | Élément conservé |
|------|-----------|-----------------|--------|-----------------|
| 2025-05-08 | Interface | packages/mcp-types/src/layer-contracts.ts | Duplication des interfaces | packages/core/interfaces/* |
| 2025-05-08 | Agent | packages/mcp-agents/legacy-analyzer.ts | Fonctionnalité dupliquée | packages/business/analyzer/analyzer-agent.ts |

## Structure cible de l'architecture en trois couches


La structure finale après restructuration devrait ressembler à ceci:

```
packages/
├── core/
│   ├── interfaces/        # Définitions d'interfaces canoniques
│   │   ├── base/
│   │   ├── orchestration/
│   │   ├── coordination/
│   │   └── business/
│   └── abstracts/         # Classes abstraites de base
├── orchestration/         # Implémentations de la couche d'orchestration
├── coordination/          # Implémentations de lcouche de coordinationon
└── business/              # Implémentations de la couche business
```

## Gestion des dépendances


Lors de la restructuration, porter une attention particulière aux dépendances entre les fichiers:

1. Identifier tous les imports qui référencent les fichiers déplacés
2. Mettre à jour ces imports pour pointer vers les nouveaux emplacements
3. Utiliser des outils automatisés (comme `tsc` ou des scripts personnalisés) pour vérifier que les imports sont valides

## Validation après restructuration


Après chaque étape de restructuration:
1. Exécuter les tests unitaires et d'intégration
2. Vérifier que la compilation fonctionne sans erreurs
3. Documenter les changements effectués

## Cas spécifique des interfaces en trois couches


Pour les interfaces des trois couches (orchestration, coordination, business), nous avons déjà identifié plusieurs implémentations existantes, notamment dans:
- `packages/mcp-types/src/layer-contracts.ts`
- `packages/business/src/core/interfaces/`
- `packages/model-context-protocol/core/src/interfaces/`

La consolidation de ces interfaces doit être prioritaire avant toute création de nouvelles interfaces.

## Bonnes pratiques de nettoyage


Lors de la suppression de code:

1. **Étapes progressives** — Procéder par petits lots pour faciliter le suivi et le débogage
2. **Tests après suppression** — Exécuter les tests après chaque lot de suppressions
3. **Sauvegarde temporaire** — Conserver temporairement (sous forme d'archive) les fichiers supprimés jusqu'à validation complète
4. **Journalisation des suppressions** — Maintenir un journal des fichiers supprimés pour référence future

Exemple de journal de suppression:
```
| Date       | Fichier supprimé                     | Raison                                      | Alternative      |
|------------|-------------------------------------|---------------------------------------------|-----------------|
| 2025-05-08 | packages/utils/duplicate-helper.ts  | Fonctionnalité migrée vers core/utils      | core/utils/helpers.ts |
| 2025-05-08 | packages/legacy-agents/*            | Agents migrés vers architecture 3 couches   | packages/business/* |
```

## Conclusion


L'élimination des duplications est la clé d'un code maintenable et cohérent. En suivant cette méthodologie "identifier, examiner, déplacer, consolider, nettoyer, supprimer", nous garantissons:
1. Une réduction drastique de la duplication de code
2. Une architecture plus cohérente et compréhensible
3. Une base de code plus facile à maintenir et à faire évoluer
4. Un projet plus léger avec moins de fichiers inutiles

