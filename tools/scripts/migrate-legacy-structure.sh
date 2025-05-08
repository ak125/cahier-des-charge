#!/bin/bash

# Script de migration des anciennes structures vers la nouvelle structure
# Ce script migre le contenu des dossiers agents/ et orchestrators/ vers packages/
# et crée des fichiers de redirection pour assurer la compatibilité temporaire

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Chemins
ROOT_DIR=$(pwd)
BACKUP_DIR="${ROOT_DIR}/tmp-restructuration/backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${ROOT_DIR}/tmp-restructuration/migration-$(date +%Y%m%d-%H%M%S).log"

# Fonctions utilitaires
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
  exit 1
}

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log "Début de la migration des anciennes structures vers la nouvelle structure"
log "Les fichiers de sauvegarde seront stockés dans: $BACKUP_DIR"
log "Le journal de migration sera disponible dans: $LOG_FILE"

# Vérification de l'existence des répertoires source et destination
if [ ! -d "${ROOT_DIR}/agents" ]; then
  warn "Le répertoire agents/ n'existe pas, ignoré"
fi

if [ ! -d "${ROOT_DIR}/orchestrators" ]; then
  warn "Le répertoire orchestrators/ n'existe pas, ignoré"
fi

if [ ! -d "${ROOT_DIR}/packages" ]; then
  error "Le répertoire packages/ n'existe pas, veuillez le créer d'abord"
fi

# Création des répertoires de destination dans packages/ si nécessaires
mkdir -p "${ROOT_DIR}/packages/agents"
mkdir -p "${ROOT_DIR}/packages/orchestration"

# Étape 1: Sauvegarde des répertoires sources
log "Sauvegarde des répertoires sources..."

if [ -d "${ROOT_DIR}/agents" ]; then
  mkdir -p "${BACKUP_DIR}/agents"
  cp -r "${ROOT_DIR}/agents/"* "${BACKUP_DIR}/agents/"
  success "Sauvegarde du répertoire agents/ terminée"
fi

if [ -d "${ROOT_DIR}/orchestrators" ]; then
  mkdir -p "${BACKUP_DIR}/orchestrators"
  cp -r "${ROOT_DIR}/orchestrators/"* "${BACKUP_DIR}/orchestrators/"
  success "Sauvegarde du répertoire orchestrators/ terminée"
fi

# Étape 2: Migration du contenu
log "Migration du contenu vers la nouvelle structure..."

# Migration des agents
if [ -d "${ROOT_DIR}/agents" ]; then
  # Copie du contenu
  cp -r "${ROOT_DIR}/agents/integration" "${ROOT_DIR}/packages/agents/"
  
  # Création d'un fichier package.json dans packages/agents s'il n'existe pas
  if [ ! -f "${ROOT_DIR}/packages/agents/package.json" ]; then
    cat > "${ROOT_DIR}/packages/agents/package.json" << EOF
{
  "name": "@packages/agents",
  "version": "1.0.0",
  "description": "Agents migrated from legacy structure",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {},
  "devDependencies": {}
}
EOF
  fi
  
  success "Migration du contenu agents/ vers packages/agents/ terminée"
fi

# Migration des orchestrators
if [ -d "${ROOT_DIR}/orchestrators" ]; then
  # Copie du contenu
  cp -r "${ROOT_DIR}/orchestrators/"* "${ROOT_DIR}/packages/orchestration/"
  
  # Mise à jour des imports
  if [ -f "${ROOT_DIR}/orchestrators/package.json" ]; then
    cp "${ROOT_DIR}/orchestrators/package.json" "${ROOT_DIR}/packages/orchestration/"
    # Mise à jour du nom du package
    sed -i 's/"name": ".*"/"name": "@packages\/orchestration"/g' "${ROOT_DIR}/packages/orchestration/package.json"
  else
    # Création d'un fichier package.json dans packages/orchestration s'il n'existe pas
    cat > "${ROOT_DIR}/packages/orchestration/package.json" << EOF
{
  "name": "@packages/orchestration",
  "version": "1.0.0",
  "description": "Orchestration migrated from legacy orchestrators",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {},
  "devDependencies": {}
}
EOF
  fi
  
  success "Migration du contenu orchestrators/ vers packages/orchestration/ terminée"
fi

# Étape 3: Création des fichiers de redirection
log "Création des fichiers de redirection pour assurer la compatibilité..."

# Pour agents
if [ -d "${ROOT_DIR}/agents" ]; then
  # Sauvegarde du contenu original pour référence
  mkdir -p "${ROOT_DIR}/agents/LEGACY-MIGRATED"
  echo "Ce dossier a été migré vers packages/agents/. Veuillez mettre à jour vos imports." > "${ROOT_DIR}/agents/LEGACY-MIGRATED/README.md"
  
  # Création d'un fichier index.js de redirection pour chaque sous-dossier
  for dir in $(find "${ROOT_DIR}/agents" -type d -not -path "*/LEGACY-MIGRATED*" -not -path "${ROOT_DIR}/agents"); do
    rel_path=$(echo "$dir" | sed "s|${ROOT_DIR}/agents/||")
    redirect_file="${dir}/index-redirect.js"
    
    cat > "$redirect_file" << EOF
/**
 * @deprecated Ce fichier est une redirection temporaire pour la compatibilité.
 * Veuillez mettre à jour vos imports vers @packages/agents/${rel_path}
 */
console.warn('DEPRECATION WARNING: Importing from agents/${rel_path} is deprecated. Please update your imports to use @packages/agents/${rel_path}');
module.exports = require('@packages/agents/${rel_path}');
EOF

    success "Fichier de redirection créé: $redirect_file"
  done
fi

# Pour orchestrators
if [ -d "${ROOT_DIR}/orchestrators" ]; then
  # Sauvegarde du contenu original pour référence
  mkdir -p "${ROOT_DIR}/orchestrators/LEGACY-MIGRATED"
  echo "Ce dossier a été migré vers packages/orchestration/. Veuillez mettre à jour vos imports." > "${ROOT_DIR}/orchestrators/LEGACY-MIGRATED/README.md"
  
  # Création d'un fichier index.js de redirection pour chaque fichier .ts
  for file in $(find "${ROOT_DIR}/orchestrators" -name "*.ts" -not -path "*/LEGACY-MIGRATED/*"); do
    filename=$(basename "$file" .ts)
    dirname=$(dirname "$file")
    redirect_file="${dirname}/${filename}-redirect.js"
    
    cat > "$redirect_file" << EOF
/**
 * @deprecated Ce fichier est une redirection temporaire pour la compatibilité.
 * Veuillez mettre à jour vos imports vers @packages/orchestration/${filename}
 */
console.warn('DEPRECATION WARNING: Importing from orchestrators/${filename} is deprecated. Please update your imports to use @packages/orchestration/${filename}');
module.exports = require('@packages/orchestration/${filename}');
EOF

    success "Fichier de redirection créé: $redirect_file"
  done
fi

# Étape 4: Mise à jour des imports dans le code existant
log "Analyse et mise à jour des imports dans le code existant..."

# Recherche des fichiers contenant des imports depuis les anciens dossiers
ts_files=$(find "${ROOT_DIR}" -type f -name "*.ts" -o -name "*.tsx" -not -path "${ROOT_DIR}/node_modules/*" -not -path "${BACKUP_DIR}/*")

# Mise à jour des imports
for file in $ts_files; do
  # Détection des imports depuis agents/
  if grep -q "from ['\"]agents/" "$file" || grep -q "from ['\"]\.\.*/\.\.*/agents/" "$file"; then
    sed -i 's/from \(['"'"'"]\)agents\//from \1@packages\/agents\//g' "$file"
    sed -i 's/from \(['"'"'"]\)\.\.\/\.\.\/agents\//from \1@packages\/agents\//g' "$file"
    warn "Imports mis à jour dans: $file (agents/ -> @packages/agents/)"
  fi
  
  # Détection des imports depuis orchestrators/
  if grep -q "from ['\"]orchestrators/" "$file" || grep -q "from ['\"]\.\.*/\.\.*/orchestrators/" "$file"; then
    sed -i 's/from \(['"'"'"]\)orchestrators\//from \1@packages\/orchestration\//g' "$file"
    sed -i 's/from \(['"'"'"]\)\.\.\/\.\.\/orchestrators\//from \1@packages\/orchestration\//g' "$file"
    warn "Imports mis à jour dans: $file (orchestrators/ -> @packages/orchestration/)"
  fi
done

# Création d'un rapport de migration
log "Création d'un rapport de migration..."

REPORT_FILE="${ROOT_DIR}/tmp-restructuration/rapport-migration-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Rapport de migration de structure

Date: $(date +%Y-%m-%d\ %H:%M:%S)

## Résumé

Ce rapport détaille la migration de l'ancienne structure vers la nouvelle structure basée sur des packages.

### Dossiers migrés

- \`agents/\` -> \`packages/agents/\`
- \`orchestrators/\` -> \`packages/orchestration/\`

### Fichiers de sauvegarde

Les fichiers d'origine ont été sauvegardés dans:
\`\`\`
$BACKUP_DIR
\`\`\`

### Journal de migration

Le journal complet de la migration est disponible dans:
\`\`\`
$LOG_FILE
\`\`\`

## Actions requises

1. Vérifiez que l'application fonctionne correctement après la migration.
2. Mettez à jour progressivement les imports dans le code pour utiliser directement les nouveaux chemins:
   - Remplacez \`agents/...\` par \`@packages/agents/...\`
   - Remplacez \`orchestrators/...\` par \`@packages/orchestration/...\`
3. Une fois tous les imports mis à jour, vous pourrez supprimer les fichiers de redirection temporaires.

## Étapes suivantes recommandées

1. Exécutez les tests pour vérifier que tout fonctionne comme prévu
2. Mettez à jour la documentation pour refléter la nouvelle structure
3. Informez l'équipe de la migration et des changements nécessaires dans les imports

## Notes supplémentaires

Les fichiers de redirection ont été créés pour assurer la compatibilité temporaire. Ils génèrent des avertissements de dépréciation pour encourager la mise à jour des imports.
EOF

success "Rapport de migration créé: $REPORT_FILE"

# Étape 5: Exécution des tests
log "Exécution des tests pour vérifier la migration..."

if [ -f "${ROOT_DIR}/package.json" ] && grep -q '"test"' "${ROOT_DIR}/package.json"; then
  if npm test; then
    success "Tests exécutés avec succès!"
  else
    warn "Des problèmes ont été détectés lors de l'exécution des tests. Veuillez consulter les erreurs ci-dessus."
  fi
else
  warn "Impossible d'exécuter les tests automatiquement. Veuillez exécuter manuellement vos tests."
fi

success "Migration terminée! Consultez le rapport pour les étapes suivantes: $REPORT_FILE"