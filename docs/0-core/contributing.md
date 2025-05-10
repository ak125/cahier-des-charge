---
title: Contributing
description: Documentation fondamentale et conventions
slug: contributing
module: 0-core
status: stable
lastReviewed: 2025-05-09
---

# Guide de contribution


Ce projet utilise des conventions de nommage strictes pour éviter les collisions de noms
et maintenir une structure de code propre et cohérente.

## Conventions de nommage des packages


- Utilisez des noms uniques pour chaque package
- Suivez le format `@mcp/[fonctionnalité]-[type]` où:
  - `fonctionnalité` décrit le rôle principal du package
  - `type` indique la catégorie du package (analyzer, generator, validator, etc.)

## Structure des dossiers


- Évitez les structures récursives
- Limitez la profondeur des dossiers à 5 niveaux maximum
- Utilisez le kebab-case pour les noms de dossiers
- Évitez les dossiers avec des noms similaires à différentes casses (PascalCase vs kebab-case)

## Avant chaque commit


- Exécutez `node validate-structure.js` pour vérifier votre structure
- Utilisez `node fix-package-name-collisions.js` si des collisions sont détectées

## Liste des outils de qualité disponibles


- `validate-structure.js`: Vérifie la structure du projet
- `fix-package-name-collisions.js`: Résout automatiquement les collisions de noms
- `clean-recursive-structure.sh`: Nettoie les structures récursives problématiques

