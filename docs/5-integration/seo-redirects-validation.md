---
title: Seo Redirects Validation
description: Intégration et standards technologiques
slug: seo-redirects-validation
module: 5-integration
status: stable
lastReviewed: 2025-05-09
---

# Validation Automatique des Redirections SEO


Ce document décrit les outils et les procédures pour valider automatiquement les redirections SEO, essentiel lors des migrations de sites et des changements d'architecture.

## Problématiques adressées


1. **Validation des anciennes URLs PHP** - S'assurer que les URLs comme `/core/seo/blog.php` redirigent correctement vers les nouvelles URLs
2. **Vérification des URLs indexées par Google** - Contrôler que les URLs présentes dans l'index de Google sont toujours actives
3. **Migration des règles de redirection** - Convertir et valider les règles de redirection lors des migrations (.htaccess → Caddyfile ou NGINX)

## Outils disponibles


### 1. Script principal de validation des redirections


Le script `validate-seo-redirects.ts` permet de valider les redirections dans différents contextes.

```bash


# Validation des redirections d'anciennes URLs

npx ts-node scripts/validate-seo-redirects.ts \
  --mode=legacy-urls \
  --urls=./examples/legacy-urls-to-test.txt \
  --base-url=https://example.com \
  --output=./redirect-validation-report.json

# Validation des URLs indexées par Google via sitemap

npx ts-node scripts/validate-seo-redirects.ts \
  --mode=google-urls \
  --sitemap=https://example.com/sitemap.xml \
  --output=./google-urls-report.json

# Migration et validation des règles de redirection

npx ts-node scripts/validate-seo-redirects.ts \
  --mode=migration \
  --htaccess=./public/.htaccess \
  --output-format=caddy \
  --output=./migration-report.json
```

Options:
- `--mode` : Mode de validation (`legacy-urls`, `google-urls`, ou `migration`)
- `--urls` : Fichier contenant les URLs à tester (mode `legacy-urls`)
- `--base-url` : URL de base pour les tests (mode `legacy-urls`)
- `--sitemap` : URL du sitemap (mode `google-urls`)
- `--htaccess` : Chemin du fichier .htaccess (mode `migration`)
- `--output-format` : Format de sortie pour les règles migrées (`caddy` ou `nginx`)
- `--output` : Chemin pour le rapport de validation
- `--check-status-codes` : Codes HTTP à vérifier (défaut: `301,410,412`)
- `--verbose` : Affiche plus de détails pendant la validation

### 2. Script d'extraction des URLs indexées par Google


Le script `extract-google-urls.js` permet d'extraire les URLs indexées par Google Search Console.

```bash
node scripts/extract-google-urls.js \
  --site=https://example.com \
  --days=30 \
  --output=./google-urls.txt
```

Options:
- `--site` : URL du site dans la Search Console
- `--days` : Nombre de jours à considérer (défaut: 30)
- `--limit` : Nombre maximum d'URLs à récupérer (défaut: 5000)
- `--output` : Chemin pour le fichier de sortie

**Prérequis**:
- Créer un projet dans Google Cloud Console
- Activer l'API Search Console
- Créer des identifiants OAuth 2.0 et télécharger le fichier credentials.json

### 3. Script CI/CD pour la validation automatique


Le script `ci-check-redirects.sh` intègre la validation des redirections dans un pipeline CI/CD.

```bash


# Validation en environnement de staging

./scripts/ci-check-redirects.sh

# Validation en environnement de production avec vérification des URLs Google

./scripts/ci-check-redirects.sh --env=production --check-google-urls

# Validation des redirections et de la migration

./scripts/ci-check-redirects.sh --check-migrations --htaccess=./public/.htaccess
```

Options:
- `--env` : Environnement (`staging` ou `production`)
- `--check-google-urls` : Active la validation des URLs indexées par Google
- `--check-migrations` : Active la validation des règles de migration
- `--htaccess` : Spécifie le chemin du fichier .htaccess

## Création d'un fichier d'URLs à tester


Pour tester les redirections d'anciennes URLs, créez un fichier texte avec les URLs à valider :

```


# Redirections PHP vers nouvelles pages

/core/seo/blog.php
/core/seo/article.php?id=123
/modules/products/view.php

# Pages supprimées (doivent retourner 410 Gone)

/outdated-content.php
/deprecated-api.php

# Pages avec conditions spéciales (doivent retourner 412 Precondition)

/special-offer.php
```

## Intégration dans le workflow de déploiement


### GitHub Actions


```yaml
name: Validate SEO Redirects

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate-redirects:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate redirects
        run: |
          chmod +x ./scripts/ci-check-redirects.sh
          ./scripts/ci-check-redirects.sh --env=staging

      - name: Archive validation reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: redirect-validation-reports
          path: redirect-validation-reports/
```

### GitLab CI


```yaml
validate-redirects:
  stage: test
  script:
    - chmod +x ./scripts/ci-check-redirects.sh
    - ./scripts/ci-check-redirects.sh --env=staging
  artifacts:
    paths:
      - redirect-validation-reports/
```

## Bonnes pratiques SEO pour les redirections


1. **Utilisez des redirections 301 (permanentes)** pour les contenus déplacés définitivement
2. **Utilisez des redirections 410 (Gone)** pour les contenus supprimés définitivement
3. **Évitez les chaînes de redirection** qui ralentissent le chargement et réduisent le PageRank
4. **Redirigez vers l'URL canonique exacte** pour préserver le SEO
5. **Validez les redirections avant chaque déploiement** pour prévenir les problèmes de SEO

## Rapports et monitoring


Les rapports générés par les scripts contiennent des informations détaillées sur :
- URLs testées et leurs statuts
- Code HTTP attendu vs. reçu
- Destination attendue vs. reçue
- Chaînes de redirection détectées
- Problèmes SEO critiques

Ces rapports peuvent être archivés et analysés pour suivre l'évolution de vos redirections SEO au fil du temps.

