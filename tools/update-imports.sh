#!/bin/bash
# Script pour mettre à jour les importations après la restructuration
# Date: 9 mai 2025
# Usage: ./update-imports.sh [--dry-run]

# Définition des couleurs pour la lisibilité
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
DRY_RUN=false
LOG_FILE="./reports/update-imports-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="./reports/update-imports-report-$(date +%Y%m%d-%H%M%S).md"

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
  shift
done

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
  echo "[INFO] $1" >> "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  echo "[ERROR] $1" >> "$LOG_FILE"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
  echo "[WARNING] $1" >> "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
  echo "[SUCCESS] $1" >> "$LOG_FILE"
}

# Créer le fichier de log
mkdir -p $(dirname "$LOG_FILE")
echo "# Journal de mise à jour des importations - $(date +"%d/%m/%Y %H:%M:%S")" > "$LOG_FILE"

# Initialiser le rapport
mkdir -p $(dirname "$REPORT_FILE")
cat > "$REPORT_FILE" << EOF
# Rapport de mise à jour des importations
Date: $(date +"%d/%m/%Y %H:%M:%S")

## Actions effectuées

EOF

log "Début du processus de mise à jour des importations..."
log "Mode simulation: $DRY_RUN"

# Définir les correspondances pour les chemins d'importation
declare -A path_mappings
path_mappings["/agents/"]="/packages/business/src/agents/"
path_mappings["/orchestrators/"]="/packages/business/src/orchestration/"
path_mappings["/orchestratorbridge/"]="/packages/business/src/orchestration/core/"
path_mappings["/../packages/mcp-agents/"]="/packages/business/src/agents/"
path_mappings["/../packages/mcp-core/"]="/packages/business/src/core/"
path_mappings["/legacy/"]="/packages/business/src/"

# Fonction pour mettre à jour les importations dans un fichier
update_imports() {
  local file="$1"
  local original_content
  local updated_content
  local changes_made=false
  
  # Ignorer les fichiers dans node_modules, dist, etc.
  if [[ "$file" == *"/node_modules/"* || "$file" == *"/dist/"* || "$file" == *"/.git/"* ]]; then
    return
  fi
  
  original_content=$(cat "$file")
  updated_content="$original_content"
  
  # Mettre à jour les importations
  for old_path in "${!path_mappings[@]}"; do
    new_path="${path_mappings[$old_path]}"
    
    # Rechercher les modèles d'importation et de require
    if grep -q "import.*from.*$old_path" "$file" || grep -q "require.*$old_path" "$file"; then
      updated_content=$(echo "$updated_content" | sed "s|$old_path|$new_path|g")
      changes_made=true
      log "Mise à jour des importations dans $file: $old_path → $new_path"
    fi
  done
  
  # Appliquer les modifications si des changements ont été détectés
  if [ "$changes_made" = true ]; then
    if [ "$DRY_RUN" = false ]; then
      echo "$updated_content" > "$file"
      echo "- Mis à jour: $file" >> "$REPORT_FILE"
    else
      echo "[DRY RUN] Mises à jour des importations dans $file"
    fi
  fi
}

# Rechercher tous les fichiers TypeScript et JavaScript
log "Recherche des fichiers TypeScript et JavaScript..."
files=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*")

# Mettre à jour les importations dans chaque fichier
log "Mise à jour des importations dans les fichiers trouvés..."
file_count=0
updated_count=0

for file in $files; do
  file_count=$((file_count + 1))
  
  # Sauvegarder et mettre à jour le fichier
  if grep -q -E "import |require\(" "$file"; then
    update_imports "$file"
    updated_count=$((updated_count + 1))
  fi
  
  # Afficher la progression tous les 100 fichiers
  if [ $((file_count % 100)) -eq 0 ]; then
    log "Progression: $file_count fichiers analysés, $updated_count mis à jour"
  fi
done

# Finaliser le rapport
cat >> "$REPORT_FILE" << EOF

## Résumé

- Fichiers analysés: $file_count
- Fichiers mis à jour: $updated_count
- Mode simulation: $DRY_RUN

## Chemins d'importation mis à jour

EOF

# Ajouter les mappages au rapport
for old_path in "${!path_mappings[@]}"; do
  new_path="${path_mappings[$old_path]}"
  echo "- \`$old_path\` → \`$new_path\`" >> "$REPORT_FILE"
done

if [ "$DRY_RUN" = true ]; then
  log "Mode simulation terminé. Aucun changement n'a été effectué."
  log "Pour appliquer les changements, exécutez la commande sans l'option --dry-run"
else
  success "Mise à jour des importations terminée avec succès!"
  success "Fichiers analysés: $file_count"
  success "Fichiers mis à jour: $updated_count"
  success "Rapport détaillé disponible dans: $REPORT_FILE"
  success "Journal complet disponible dans: $LOG_FILE"
fi
