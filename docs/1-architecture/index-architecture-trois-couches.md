---
title: Index Architecture Trois Couches
description: Architecture à trois couches et structure
slug: index-architecture-trois-couches
module: 1-architecture
status: stable
lastReviewed: 2025-05-09
---

# Index de la documentation d'architecture à trois couches


*Mise à jour : 8 mai 2025*

Cette page sert d'index à la documentation complète sur l'architecture à trois couches du projet.

## Documents disponibles


1. [Architecture à trois couches](architecture-trois-couches)
   - Vue d'ensemble de l'architecture
   - Description des couches et des interfaces
   - Exemples d'implémentation
   - Statistiques après déduplication

2. [Guide de migration](guide-migration-trois-couches)
   - Comment adapter votre code à la nouvelle architecture
   - Mise à jour des imports
   - Utilisation des interfaces standardisées
   - Outils d'aide à la migration

3. [Guide des tests](guide-tests-architecture-trois-couches)
   - Mise à jour des tests unitaires et d'intégration
   - Bonnes pratiques pour les tests par couche
   - Exemples de tests pour chaque type d'agent
   - Vérification de la couverture

## Résultats de la déduplication


La réorganisation du projet selon l'architecture à trois couches a permis d'éliminer efficacement les duplications :

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|-------------|
| Agents dupliqués | 210 | 0 | 100% |
| Taille totale du code | ~4.2 MB | ~2.8 MB | 33% |
| Maintenabilité (indice) | 62/100 | 87/100 | 40% |

## Structure des répertoires


```
packages/
├── core/
│   └── interfaces/          # Interfaces partagées
│       ├── base/
│       ├── orchestration/
│       ├── coordination/
│       └── business/
│
├── orchestration/           # couche d'orchestration
│   ├── monitors/            # Surveillance
│   ├── schedulers/          # Planification
│   ├── orchestrators/       # Orchestration
│   └── bridges/             # Ponts d'orchestration
│
├── coordination/            couche de coordinationon
│   ├── bridges/             # Communication entre systèmes
│   ├── registries/          # Registres d'agents
│   └── adapters/            # Adaptateurs
│
└── business/                # Couche business
    ├── analyzers/           # Analyse
    ├── generators/          # Génération
    ├── validators/          # Validation
    └── parsers/             # Parsing
```

## Prochaines étapes


- Amélioration continue de la documentation
- Création d'exemples plus détaillés
- Mise en place d'un système de validation automatique de la conformité avec l'architecture
- Développement d'outils supplémentaires pour faciliter la création de nouveaux agents

