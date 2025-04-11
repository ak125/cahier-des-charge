# Versioning intelligent du cahier des charges

## 🔄 Principe du versioning automatisé

Le système de versioning intelligent garantit que chaque évolution du cahier des charges est tracée, archivée et associée aux versions logicielles correspondantes, assurant ainsi une traçabilité complète tout au long du projet.

## 📋 Processus de versioning

Chaque mise à jour du cahier des charges est :

1. **Archivée automatiquement avec horodatage**
   - Sauvegarde complète dans un système de versioning
   - Métadonnées incluant date, auteur et résumé des modifications
   - Historique complet consultable à tout moment

2. **Poussée dans GitHub sous format standardisé**
   - Publication dans le répertoire `/docs/cdc_v1.0.3.md` (exemple)
   - Nommage selon la convention sémantique (MAJOR.MINOR.PATCH)
   - Intégration dans le CI/CD du projet

3. **Reliée à une version logicielle**
   - Correspondance avec les versions dans `package.json`
   - Mise à jour synchronisée avec `migration_plan.md`
   - Références croisées avec les tags Git

## ⚙️ Implémentation technique

### Script de versioning automatique

```bash
# filepath: /workspaces/cahier-des-charge/scripts/version-cdc.sh
#!/bin/bash

# Script de versioning automatique du cahier des charges
# Usage: ./version-cdc.sh [major|minor|patch]

set -e

# Déterminer le type de mise à jour
UPDATE_TYPE=${1:-"patch"}
CDC_DIR="cahier-des-charges"
DOCS_DIR="docs/versions"
CURRENT_VERSION=$(cat version.txt 2>/dev/null || echo "1.0.0")

# Calculer la nouvelle version
calculate_new_version() {
  local current=$1
  local type=$2
  
  IFS='.' read -r major minor patch <<< "$current"
  
  case "$type" in
    major)
      echo "$((major + 1)).0.0"
      ;;
    minor)
      echo "$major.$((minor + 1)).0"
      ;;
    patch|*)
      echo "$major.$minor.$((patch + 1))"
      ;;
  esac
}

NEW_VERSION=$(calculate_new_version "$CURRENT_VERSION" "$UPDATE_TYPE")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
VERSION_FILENAME="cdc_v${NEW_VERSION}"

echo "📋 Versioning du cahier des charges"
echo "Version actuelle: $CURRENT_VERSION"
echo "Nouvelle version: $NEW_VERSION"

# 1. Archivage avec horodatage
echo "🗃️ Archivage de la version actuelle..."
mkdir -p "$DOCS_DIR/archives"
ARCHIVE_PATH="$DOCS_DIR/archives/cdc_${CURRENT_VERSION}_${TIMESTAMP}.md"

# Génération du fichier consolidé
python3 generate_cahier_html.py --format markdown --output "$ARCHIVE_PATH"

# 2. Génération de la nouvelle version pour GitHub
echo "📝 Génération de la nouvelle version..."
mkdir -p "$DOCS_DIR"
GITHUB_PATH="$DOCS_DIR/${VERSION_FILENAME}.md"

# En-tête avec métadonnées
cat > "$GITHUB_PATH" << EOL
---
version: ${NEW_VERSION}
date: $(date +"%Y-%m-%d")
timestamp: ${TIMESTAMP}
type: ${UPDATE_TYPE}
author: $(git config user.name || echo "Système")
---

# Cahier des Charges v${NEW_VERSION}

> Version du $(date +"%d/%m/%Y à %H:%M")
> 
> Correspond à la version logicielle ${NEW_VERSION}

EOL

# Contenu du cahier des charges
python3 generate_cahier_html.py --format markdown --output "$GITHUB_PATH" --append

# 3. Mise à jour des références de version
echo "🔄 Mise à jour des références de version..."

# Mise à jour du fichier version.txt
echo "$NEW_VERSION" > version.txt

# Mise à jour des fichiers package.json
if [ -f "package.json" ]; then
  # Utiliser jq si disponible, sinon npm version
  if command -v jq &> /dev/null; then
    jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
  else
    npm version "$NEW_VERSION" --no-git-tag-version
  fi
fi

# Mise à jour du plan de migration
if [ -f "migration_plan.md" ]; then
  sed -i "../^Version: .*/Version: $NEW_VERSION/" migration_plan.md
fi

# 4. Génération du résumé des modifications
echo "📊 Génération du résumé des modifications..."
CHANGES_SUMMARY="$DOCS_DIR/changes_${NEW_VERSION}.md"

cat > "$CHANGES_SUMMARY" << EOL
# Modifications v${NEW_VERSION}

Date: $(date +"%Y-%m-%d %H:%M")
Type de mise à jour: ${UPDATE_TYPE}

## Fichiers modifiés:
EOL

# Lister les fichiers modifiés depuis le dernier tag
git diff --name-only HEAD > "$CHANGES_SUMMARY.tmp"
if [ -s "$CHANGES_SUMMARY.tmp" ]; then
  cat "$CHANGES_SUMMARY.tmp" | grep -E "^$CDC_DIR/" | sed 's/^/- /' >> "$CHANGES_SUMMARY"
else
  echo "- Aucun fichier modifié" >> "$CHANGES_SUMMARY"
fi
rm "$CHANGES_SUMMARY.tmp"

# 5. Commit et tag Git si dans un repo Git
if [ -d .git ]; then
  echo "🔖 Création du commit et tag Git..."
  
  # Ajout des fichiers modifiés
  git add "$DOCS_DIR" version.txt
  
  if [ -f "package.json" ]; then
    git add package.json
  fi
  
  if [ -f "migration_plan.md" ]; then
    git add migration_plan.md
  fi
  
  # Commit
  git commit -m "📋 Mise à jour du cahier des charges v${NEW_VERSION}"
  
  # Tag
  git tag -a "cdc-v${NEW_VERSION}" -m "Version ${NEW_VERSION} du cahier des charges"
  
  echo "✅ Commit et tag créés. Utilisez 'git push --tags' pour pousser vers le dépôt distant."
else
  echo "⚠️ Pas de dépôt Git détecté. Les modifications n'ont pas été committées."
fi

echo "✅ Versioning du cahier des charges terminé (v${NEW_VERSION})"
```

### Configuration GitHub Actions

```yaml
# filepath: /workspaces/cahier-des-charge/.github/workflows/cdc-versioning.yml
name: Cahier des Charges Versioning

on:
  push:
    paths:
      - 'cahier-des-charges/**'
    branches:
      - main
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Type de mise à jour (patch, minor, major)'
        required: true
        default: 'patch'

jobs:
  version-cdc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install markdown
      
      - name: Set Git identity
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
      
      - name: Run versioning script
        run: |
          chmod +x scripts/version-cdc.sh
          ./scripts/version-cdc.sh ${{ github.event.inputs.version_type || 'patch' }}
      
      - name: Push changes
        run: |
          git push
          git push --tags
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: cdc-v$(cat version.txt)
          name: Cahier des Charges v$(cat version.txt)
          body_path: docs/versions/changes_$(cat version.txt).md
          draft: false
          prerelease: false
```

## 📚 Structure des versions archivées

Les versions du cahier des charges sont organisées selon la structure suivante:

```
docs/
└── versions/
    ├── cdc_v1.0.0.md       # Version initiale
    ├── cdc_v1.0.1.md       # Correctifs mineurs
    ├── cdc_v1.1.0.md       # Ajout de nouvelles sections
    ├── cdc_v2.0.0.md       # Refonte majeure
    ├── changes_1.0.1.md    # Résumé des changements
    ├── changes_1.1.0.md
    ├── changes_2.0.0.md
    └── archives/           # Archives horodatées
        ├── cdc_1.0.0_2023-01-15_14-30-22.md
        ├── cdc_1.0.1_2023-02-03_09-45-17.md
        └── ...
```

## 🔄 Synchronisation avec les versions logicielles

Le système maintient automatiquement la correspondance entre:

1. **Version du cahier des charges** (`cdc_v1.0.3.md`)
2. **Version du logiciel** (`package.json` → `"version": "1.0.3"`)
3. **Tags Git** (`cdc-v1.0.3`)
4. **Documents associés** (`migration_plan.md` → `Version: 1.0.3`)

Cette synchronisation garantit une traçabilité complète et permet de comprendre facilement quelle version du cahier des charges correspond à quelle version du code, facilitant ainsi la maintenance et le support à long terme.

## 📊 Tableau de version

| Version CDC | Date | Type | Changements majeurs | Version logicielle |
|-------------|------|------|---------------------|-------------------|
| 1.0.0 | 2023-01-15 | Initial | Version initiale du CDC | 0.1.0 |
| 1.0.1 | 2023-02-03 | Patch | Corrections mineures | 0.1.1 |
| 1.1.0 | 2023-03-10 | Minor | Ajout des spécifications REST API | 0.2.0 |
| 2.0.0 | 2023-05-22 | Major | Refonte pour intégration IA | 1.0.0 |

Ce tableau est maintenu à jour automatiquement par le script de versioning et disponible dans le fichier `docs/versions/version_history.md`.
