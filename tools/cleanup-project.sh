#!/bin/bash
# Script de nettoyage et de restructuration du projet
# Date: 9 mai 2025
# Usage: ./cleanup-project.sh [--dry-run] [--analysis-dir <directory>]

# Définition des couleurs pour la lisibilité
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
DRY_RUN=false
ANALYSIS_DIR="./reports/structure-analysis-latest"
BACKUP_DIR="./backup/cleanup-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="./reports/cleanup-report-$(date +%Y%m%d-%H%M%S).md"

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true ;;
    --analysis-dir) ANALYSIS_DIR="$2"; shift ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
  shift
done

# Vérifier si le dossier d'analyse existe
if [ ! -d "$ANALYSIS_DIR" ]; then
  echo -e "${RED}[ERROR]${NC} Le dossier d'analyse $ANALYSIS_DIR n'existe pas."
  echo -e "${YELLOW}[TIP]${NC} Exécutez d'abord ./tools/analyze-project-structure.sh ou spécifiez un dossier existant avec --analysis-dir"
  exit 1
fi

# Créer le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Fonction pour créer une sauvegarde d'un fichier ou dossier
backup() {
  local path="$1"
  local relative_path="${path#./}"
  local backup_path="$BACKUP_DIR/$relative_path"
  
  mkdir -p "$(dirname "$backup_path")"
  
  if [ -d "$path" ]; then
    cp -r "$path" "$backup_path"
  else
    cp "$path" "$backup_path"
  fi
  
  echo "Sauvegardé: $relative_path"
}

# Fonction pour supprimer un fichier ou dossier avec sauvegarde
safe_remove() {
  local path="$1"
  local reason="$2"
  
  if [ -e "$path" ]; then
    backup "$path"
    
    if [ "$DRY_RUN" = false ]; then
      rm -rf "$path"
      echo "Supprimé: $path ($reason)"
    else
      echo "[DRY RUN] Serait supprimé: $path ($reason)"
    fi
  fi
}

# Fonction pour déplacer un fichier ou dossier avec sauvegarde
safe_move() {
  local source="$1"
  local dest="$2"
  local reason="$3"
  
  if [ -e "$source" ]; then
    backup "$source"
    
    if [ "$DRY_RUN" = false ]; then
      # S'assurer que le dossier de destination existe
      mkdir -p "$(dirname "$dest")"
      mv "$source" "$dest"
      echo "Déplacé: $source → $dest ($reason)"
    else
      echo "[DRY RUN] Serait déplacé: $source → $dest ($reason)"
    fi
  fi
}

# Initialiser le rapport
cat > "$REPORT_FILE" << EOF
# Rapport de nettoyage et restructuration du projet
Date: $(date +"%d/%m/%Y %H:%M:%S")

## Actions effectuées

EOF

log "Début du processus de nettoyage et restructuration..."
log "Mode simulation: $DRY_RUN"
log "Dossier d'analyse: $ANALYSIS_DIR"
log "Dossier de sauvegarde: $BACKUP_DIR"

# 1. Suppression des dossiers de sauvegarde obsolètes
log "Nettoyage des dossiers de sauvegarde obsolètes..."

if [ -f "$ANALYSIS_DIR/backup-folders.txt" ]; then
  # Filtrer les dossiers de backup à conserver (moins de 7 jours)
  recents=$(find ./backup -type d -maxdepth 1 -mtime -7 | sort)
  
  while IFS= read -r folder; do
    # Vérifier si le dossier est récent
    if echo "$recents" | grep -q "$folder"; then
      continue
    fi
    
    # Sauvegarder uniquement la structure (pas les fichiers)
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$BACKUP_DIR/backup-structure"
      find "$folder" -type d | sed "s|$folder|$BACKUP_DIR/backup-structure/|" | xargs mkdir -p 2>/dev/null
    fi
    
    safe_remove "$folder" "Dossier de sauvegarde obsolète"
    echo "- Supprimé: $folder (sauvegarde obsolète)" >> "$REPORT_FILE"
  done < "$ANALYSIS_DIR/backup-folders.txt"
  
  success "Dossiers de sauvegarde nettoyés"
else
  warn "Fichier backup-folders.txt non trouvé, étape ignorée"
fi

# 2. Fusion des fichiers dupliqués
log "Traitement des fichiers dupliqués..."

if [ -f "$ANALYSIS_DIR/duplicate-files-content.txt" ] && [ -s "$ANALYSIS_DIR/duplicate-files-content.txt" ]; then
  duplicates=$(grep -v "^$" "$ANALYSIS_DIR/duplicate-files-content.txt" | grep -v "^[0-9a-f]\{32\}" | sort)
  
  # Parcourir les groupes de fichiers dupliqués
  current_hash=""
  declare -a files
  
  while IFS= read -r line; do
    if [[ $line =~ ^[0-9a-f]{32} ]]; then
      # C'est un hash, début d'un nouveau groupe
      if [ -n "$current_hash" ] && [ ${#files[@]} -gt 0 ]; then
        # Traiter le groupe précédent
        keep_file="${files[0]}"
        for ((i=1; i<${#files[@]}; i++)); do
          safe_remove "${files[$i]}" "Fichier dupliqué, conservé $keep_file"
          echo "- Fusionné: ${files[$i]} → $keep_file (contenu identique)" >> "$REPORT_FILE"
        done
      fi
      
      # Réinitialiser pour le nouveau groupe
      current_hash=$(echo "$line" | awk '{print $1}')
      files=()
    elif [ -n "$line" ]; then
      # C'est un fichier du groupe actuel
      file_path=$(echo "$line" | awk '{$1=""; print $0}' | xargs)
      files+=("$file_path")
    fi
  done < <(cat "$ANALYSIS_DIR/duplicate-files-content.txt")
  
  # Traiter le dernier groupe
  if [ -n "$current_hash" ] && [ ${#files[@]} -gt 0 ]; then
    keep_file="${files[0]}"
    for ((i=1; i<${#files[@]}; i++)); do
      safe_remove "${files[$i]}" "Fichier dupliqué, conservé $keep_file"
      echo "- Fusionné: ${files[$i]} → $keep_file (contenu identique)" >> "$REPORT_FILE"
    done
  fi
  
  success "Fichiers dupliqués traités"
else
  warn "Fichier duplicate-files-content.txt non trouvé ou vide, étape ignorée"
fi

# 3. Consolidation des orchestrateurs et agents
log "Consolidation des orchestrateurs..."

# Créer des dossiers standardisés si nécessaires
if [ "$DRY_RUN" = false ]; then
  mkdir -p ./packages/business/src/orchestration/core
  mkdir -p ./packages/business/src/orchestration/adapters
  mkdir -p ./packages/business/src/agents/core
  mkdir -p ./packages/business/src/agents/specialized
fi

# Déplacer et consolider les orchestrateurs
if [ -f "$ANALYSIS_DIR/orchestrator-files.txt" ]; then
  # Identifier les fichiers d'orchestration principaux à conserver
  main_orchestrator=$(grep -l "standardized-orchestrator" $(cat "$ANALYSIS_DIR/orchestrator-files.txt") 2>/dev/null | head -1)
  
  if [ -n "$main_orchestrator" ]; then
    log "Orchestrateur principal identifié: $main_orchestrator"
    
    # Déplacer l'orchestrateur principal si nécessaire
    if [[ "$main_orchestrator" != "./packages/business/src/orchestration/"* ]]; then
      safe_move "$main_orchestrator" "./packages/business/src/orchestration/core/standardized-orchestrator.ts" "Consolidation des orchestrateurs"
      echo "- Déplacé: $main_orchestrator → ./packages/business/src/orchestration/core/standardized-orchestrator.ts" >> "$REPORT_FILE"
    fi
    
    # Traiter les autres fichiers d'orchestration
    while IFS= read -r file; do
      if [[ "$file" != "./packages/business/src/orchestration/"* && "$file" != "$main_orchestrator" ]]; then
        filename=$(basename "$file")
        safe_remove "$file" "Orchestrateur dupliqué ou obsolète"
        echo "- Supprimé: $file (orchestrateur dupliqué)" >> "$REPORT_FILE"
      fi
    done < "$ANALYSIS_DIR/orchestrator-files.txt"
  else
    warn "Aucun orchestrateur principal identifié"
  fi
  
  success "Orchestrateurs consolidés"
else
  warn "Fichier orchestrator-files.txt non trouvé, étape ignorée"
fi

# 4. Consolidation des agents
log "Consolidation des agents..."

if [ -f "$ANALYSIS_DIR/agent-files.txt" ]; then
  # Répertoires cibles pour les agents
  agent_core_dir="./packages/business/src/agents/core"
  agent_specialized_dir="./packages/business/src/agents/specialized"
  
  # Créer les répertoires s'ils n'existent pas
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$agent_core_dir"
    mkdir -p "$agent_specialized_dir"
  fi
  
  # Déplacer les agents
  while IFS= read -r file; do
    filename=$(basename "$file")
    
    # Déterminer si c'est un agent de base ou spécialisé
    if [[ "$filename" == *"base"* || "$filename" == *"abstract"* || "$filename" == *"core"* ]]; then
      target="$agent_core_dir/$filename"
    else
      target="$agent_specialized_dir/$filename"
    fi
    
    # Ne pas déplacer si déjà au bon endroit
    if [[ "$file" == "$target" ]]; then
      continue
    fi
    
    # Éviter les doublons dans le dossier cible
    if [ -f "$target" ]; then
      safe_remove "$file" "Agent dupliqué, déjà présent dans $target"
      echo "- Supprimé: $file (agent dupliqué)" >> "$REPORT_FILE"
    else
      safe_move "$file" "$target" "Consolidation des agents"
      echo "- Déplacé: $file → $target" >> "$REPORT_FILE"
    fi
  done < "$ANALYSIS_DIR/agent-files.txt"
  
  success "Agents consolidés"
else
  warn "Fichier agent-files.txt non trouvé, étape ignorée"
fi

# 5. Suppression des éléments legacy explicites
log "Nettoyage des éléments legacy..."

if [ -f "$ANALYSIS_DIR/legacy-files.txt" ]; then
  while IFS= read -r item; do
    # On ne supprime que les éléments contenant "legacy" dans leur nom et pas dans leur chemin parent
    if [[ $(basename "$item") == *legacy* ]]; then
      safe_remove "$item" "Élément legacy explicite"
      echo "- Supprimé: $item (élément legacy)" >> "$REPORT_FILE"
    fi
  done < "$ANALYSIS_DIR/legacy-files.txt"
  
  success "Éléments legacy nettoyés"
else
  warn "Fichier legacy-files.txt non trouvé, étape ignorée"
fi

# 6. Mise à jour du fichier pnpm-workspace.yaml
log "Mise à jour du fichier pnpm-workspace.yaml..."

if [ -f "pnpm-workspace.yaml" ]; then
  backup "pnpm-workspace.yaml"
  
  if [ "$DRY_RUN" = false ]; then
    cat > "pnpm-workspace.yaml" << EOF
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
  - 'agents/*'
  - 'migrations/*'
EOF
    echo "- Mis à jour: pnpm-workspace.yaml (simplification des chemins)" >> "$REPORT_FILE"
  else
    echo "[DRY RUN] Mise à jour du fichier pnpm-workspace.yaml"
  fi
  
  success "Fichier pnpm-workspace.yaml mis à jour"
else
  warn "Fichier pnpm-workspace.yaml non trouvé, étape ignorée"
fi

# Finaliser le rapport
cat >> "$REPORT_FILE" << EOF

## Résumé des actions

- Dossiers de sauvegarde nettoyés
- Fichiers dupliqués fusionnés
- Orchestrateurs consolidés
- Agents consolidés
- Éléments legacy supprimés
- Configuration pnpm-workspace.yaml simplifiée

## Prochaines étapes recommandées

1. Vérifier que les packages peuvent toujours être installés correctement
2. Exécuter les tests pour s'assurer que tout fonctionne comme prévu
3. Mettre à jour les importations dans les fichiers qui faisaient référence à des éléments déplacés

Les fichiers supprimés ont été sauvegardés dans: $BACKUP_DIR
EOF

if [ "$DRY_RUN" = true ]; then
  log "Mode simulation terminé. Aucun changement n'a été effectué."
  log "Pour appliquer les changements, exécutez la commande sans l'option --dry-run"
else
  success "Nettoyage et restructuration terminés avec succès!"
  success "Rapport détaillé disponible dans: $REPORT_FILE"
  success "Sauvegarde des fichiers modifiés disponible dans: $BACKUP_DIR"
fi
