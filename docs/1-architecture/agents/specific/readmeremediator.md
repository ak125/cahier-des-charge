---
title: Readmeremediator
description: Architecture à trois couches et structure
slug: readmeremediator
module: 1-architecture
category: agents/specific
status: stable
lastReviewed: 2025-05-09
---

# Agent de Remédiation Automatique


Cet agent étend les fonctionnalités de l'agent diff-verifier en permettant de corriger automatiquement les divergences détectées lors du processus de vérification de parité entre le code PHP legacy et le code migré vers NestJS/Remix.

## Fonctionnalités


L'agent de remédiation peut automatiquement :

- Ajouter les champs manquants dans les entités et DTOs
- Créer ou compléter les routes manquantes dans l'application Remix
- Ajouter les endpoints d'API manquants dans les contrôleurs NestJS
- Implémenter les mécanismes de contrôle d'accès manquants
- Corriger les problèmes de mapping SQL
- Ajouter la logique métier manquante (en générant des méthodes avec des implémentations de base)

## Utilisation


L'agent peut être exécuté via le script `bin/remediator.sh` avec les options suivantes :

```bash
./bin/remediator.sh [options]
```

### Options


- `--file=<fichier.php>` : Corriger un fichier PHP spécifique
- `--dir=<répertoire>` : Corriger tous les fichiers divergents dans un répertoire
- `--batch` : Mode batch (correction de tous les fichiers divergents)
- `--result=<chemin>` : Utiliser un résultat de vérification spécifique
- `--dry-run` : Mode simulation (sans modification de fichiers)
- `--report` : Générer un rapport HTML
- `--max-concurrent=<nombre>` : Nombre maximum de corrections simultanées
- `--force` : Forcer la réécriture même si le fichier existe

### Exemples


1. Corriger un fichier spécifique :
```bash
./bin/remediator.sh --file=src/controllers/UserController.php
```

2. Corriger tous les fichiers divergents en mode batch :
```bash
./bin/remediator.sh --batch --report
```

3. Tester la correction sans appliquer les modifications :
```bash
./bin/remediator.sh --file=app/Product.php --dry-run
```

## Intégration au Pipeline


L'agent de remédiation s'intègre parfaitement au pipeline existant :

1. L'agent diff-verifier détecte les divergences entre le code PHP et le code migré
2. L'agent remediator corrige automatiquement ces divergences
3. diff-verifier est exécuté à nouveau pour valider les corrections

## Workflow recommandé


1. Exécuter diff-verifier pour détecter les divergences
```bash
./bin/diff-verifier.sh --batch --report
```

2. Exécuter remediator pour corriger automatiquement les divergences
```bash
./bin/remediator.sh --batch --report
```

3. Exécuter diff-verifier à nouveau pour valider les corrections
```bash
./bin/diff-verifier.sh --batch --report
```

## Rapports


Lorsque l'option `--report` est utilisée, l'agent génère un rapport HTML détaillé dans `reports/remediation_summary.html`, montrant :

- Le résumé des corrections appliquées
- Le détail par fichier des changements effectués
- Les erreurs éventuelles

## Notes


- Les corrections automatiques sont un point de départ et peuvent nécessiter des ajustements manuels
- En cas de logique métier complexe, l'agent génère une implémentation de base qui devra être complétée
- Utilisez l'option `--dry-run` pour voir les modifications proposées sans les appliquer

