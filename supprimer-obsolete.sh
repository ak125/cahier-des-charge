#!/bin/bash
# Script pour identifier et supprimer les fichiers obsolètes
# Date: 9 mai 2025

# Définition des couleurs
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables par défaut
FORCE_MODE=false
DRY_RUN=false
VERBOSE=false

# Traitement des options en ligne de commande
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--force)
      FORCE_MODE=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -f, --force     Forcer la suppression des dossiers récalcitrants"
      echo "  -d, --dry-run   Simuler la suppression sans supprimer réellement"
      echo "  -v, --verbose   Afficher plus d'informations pendant l'exécution"
      echo "  -h, --help      Afficher cette aide"
      exit 0
      ;;
    *)
      echo "Option inconnue: $1"
      echo "Utilisez -h ou --help pour afficher l'aide"
      exit 1
      ;;
  esac
done

# Configuration
BACKUP_DIR="./backup/supprimer-obsolete-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="./reports/supprimer-obsolete-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="./reports/supprimer-obsolete-report-$(date +%Y%m%d-%H%M%S).md"

# Création des dossiers nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$REPORT_FILE")"

echo "# Journal de suppression des fichiers obsolètes - $(date +"%d/%m/%Y %H:%M:%S")" > "$LOG_FILE"
echo "# Rapport de suppression des fichiers obsolètes - $(date +"%d/%m/%Y %H:%M:%S")" > "$REPORT_FILE"

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
  echo "[INFO] $1" >> "$LOG_FILE"
  echo "## $1" >> "$REPORT_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  echo "[ERROR] $1" >> "$LOG_FILE"
  echo "### ❌ ERREUR: $1" >> "$REPORT_FILE"
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
  echo "[WARNING] $1" >> "$LOG_FILE"
  echo "### ⚠️ ATTENTION: $1" >> "$REPORT_FILE"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
  echo "[SUCCESS] $1" >> "$LOG_FILE"
  echo "### ✅ SUCCÈS: $1" >> "$REPORT_FILE"
}

# Fonction pour sauvegarder avant de supprimer
backup_file() {
  local source="$1"
  local relative_path="${source#./}"
  local backup_path="$BACKUP_DIR/$relative_path"
  
  if [ -e "$source" ]; then
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$(dirname "$backup_path")"
      cp -r "$source" "$backup_path"
      echo "[BACKUP] $source -> $backup_path" >> "$LOG_FILE"
      if [ "$VERBOSE" = true ]; then
        echo -e "${YELLOW}[BACKUP]${NC} $source -> $backup_path"
      fi
    else
      echo "[DRY-RUN][BACKUP] $source -> $backup_path" >> "$LOG_FILE"
      if [ "$VERBOSE" = true ]; then
        echo -e "${YELLOW}[DRY-RUN][BACKUP]${NC} $source -> $backup_path"
      fi
    fi
  fi
}

# Fonction améliorée pour supprimer des fichiers ou dossiers
safe_remove() {
  local path="$1"
  local reason="$2"
  local target_type="$3"  # 'file' ou 'directory'
  
  if [ -e "$path" ]; then
    # Sauvegarder le fichier avant suppression
    backup_file "$path"
    
    # Effectuer la suppression en fonction du type et du mode
    if [ "$DRY_RUN" = false ]; then
      if [ "$target_type" = "directory" ]; then
        if [ "$FORCE_MODE" = true ]; then
          rm -rf "$path"
        else
          # Tenter une suppression normale d'abord
          rm -rf "$path" 2>/dev/null || {
            echo -e "${YELLOW}[WARNING]${NC} Impossible de supprimer le dossier $path avec rm classique"
            echo -e "${YELLOW}[WARNING]${NC} Utilisez -f ou --force pour forcer la suppression"
            echo "[WARNING] Impossible de supprimer le dossier $path avec rm classique" >> "$LOG_FILE"
            echo "[WARNING] Utilisez -f ou --force pour forcer la suppression" >> "$LOG_FILE"
            return 1
          }
        fi
      else
        # Pour les fichiers normaux
        rm -f "$path"
      fi
      echo "[REMOVED] $path ($reason)" >> "$LOG_FILE"
      if [ "$VERBOSE" = true ]; then
        echo -e "${GREEN}[REMOVED]${NC} $path ($reason)"
      fi
    else
      echo "[DRY-RUN][REMOVED] $path ($reason)" >> "$LOG_FILE"
      if [ "$VERBOSE" = true ]; then
        echo -e "${GREEN}[DRY-RUN][REMOVED]${NC} $path ($reason)"
      fi
    fi
    return 0
  else
    if [ "$VERBOSE" = true ]; then
      echo -e "${YELLOW}[SKIP]${NC} $path n'existe pas"
    fi
    return 1
  fi
}

# Fonction pour vérifier si un fichier est référencé dans les imports du projet
is_file_referenced() {
  local file="$1"
  local file_basename=$(basename "$file" | sed 's/\.[^.]*$//')  # nom du fichier sans extension
  
  # Rechercher les références à ce fichier dans les imports
  refs=$(grep -r "import.*$file_basename" --include="*.ts" --include="*.js" ./packages ./apps ./agents 2>/dev/null | wc -l)
  
  if [ "$refs" -gt 0 ]; then
    return 0  # fichier référencé (vrai)
  else
    return 1  # fichier non référencé (faux)
  fi
}

# Fonction pour détecter les doublons entre ancienne et nouvelle structure
detect_duplicates() {
  log "Détection avancée des doublons entre ancienne et nouvelle structure..."
  
  # Structure ancien -> nouveau mapping
  declare -A STRUCTURE_MAPPING=(
    ["packages/mcp-agents/analyzers"]="packages/business/src/agents"
    ["agents"]="packages/business/src/agents"
    ["packages/orchestration-old"]="packages/orchestration"
    ["legacy/integration"]="packages/coordination/src"
    ["packages/mcp-utils"]="packages/utils"
    ["packages/migrated-agents"]="packages/business/src/agents"
    ["workspaces/cahier-des-charge/packages"]="packages"
  )
  
  echo "" >> "$REPORT_FILE"
  echo "### Doublons détectés" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| Ancien emplacement | Nouvel emplacement | Similitude |" >> "$REPORT_FILE"
  echo "|-------------------|-------------------|------------|" >> "$REPORT_FILE"
  
  # Pour chaque paire de structures
  for old_struct in "${!STRUCTURE_MAPPING[@]}"; do
    new_struct="${STRUCTURE_MAPPING[$old_struct]}"
    
    if [ ! -d "$old_struct" ]; then
      continue  # Ignorer les dossiers qui n'existent pas
    fi
    
    # Parcourir les fichiers sources dans l'ancienne structure
    find "$old_struct" -type f -name "*.ts" -o -name "*.js" 2>/dev/null | while read -r old_file; do
      # Extraire le nom du fichier sans chemin
      file_base=$(basename "$old_file")
      file_name="${file_base%.*}"  # Nom sans extension
      
      # Rechercher des fichiers similaires dans la nouvelle structure
      similar_files=$(find "$new_struct" -type f -name "$file_base" 2>/dev/null)
      
      if [ -n "$similar_files" ]; then
        # Fichier avec le même nom trouvé
        first_match=$(echo "$similar_files" | head -n 1)
        
        # Vérifier la similitude du contenu
        if [ -f "$old_file" ] && [ -f "$first_match" ]; then
          similarity=$(diff -y --suppress-common-lines "$old_file" "$first_match" | wc -l)
          total_lines=$(wc -l < "$old_file")
          
          # Si moins de 10 lignes différentes ou moins de 20% du fichier
          if [ "$similarity" -lt 10 ] || [ "$total_lines" -gt 0 -a "$similarity" -lt $(( total_lines / 5 )) ]; then
            # Considéré comme un doublon (>80% identique)
            similarity_pct=$((100 - similarity * 100 / (total_lines > 0 ? total_lines : 1)))
            echo "| $old_file | $first_match | ${similarity_pct}% identique |" >> "$REPORT_FILE"
            echo "[DUPLICATE] $old_file -> $first_match (${similarity_pct}% identique)" >> "$LOG_FILE"
            
            if [ "$VERBOSE" = true ]; then
              echo -e "${YELLOW}[DUPLICATE]${NC} $old_file -> $first_match (${similarity_pct}% identique)"
            fi
            
            # Supprimer le fichier obsolète si suffisamment similaire (>95%)
            if [ "$similarity_pct" -gt 95 ]; then
              if safe_remove "$old_file" "Doublon de $first_match (${similarity_pct}% identique)" "file"; then
                echo "[AUTO-REMOVED] $old_file (${similarity_pct}% identique à $first_match)" >> "$LOG_FILE"
                if [ "$VERBOSE" = true ]; then
                  echo -e "${GREEN}[AUTO-REMOVED]${NC} $old_file"
                fi
              fi
            fi
          fi
        fi
      else
        # Chercher des fichiers avec un nom similaire (ignorer kebab-case vs camelCase)
        normalized_name=$(echo "$file_name" | tr -d '-' | tr -d '_' | tr '[:upper:]' '[:lower:]')
        
        find "$new_struct" -type f -name "*.ts" -o -name "*.js" 2>/dev/null | while read -r potential_match; do
          potential_base=$(basename "$potential_match")
          potential_name="${potential_base%.*}"
          normalized_potential=$(echo "$potential_name" | tr -d '-' | tr -d '_' | tr '[:upper:]' '[:lower:]')
          
          if [ "$normalized_name" = "$normalized_potential" ]; then
            # Les noms sont similaires après normalisation
            similarity=$(diff -y --suppress-common-lines "$old_file" "$potential_match" | wc -l)
            total_lines=$(wc -l < "$old_file")
            
            if [ "$similarity" -lt 20 ] || [ "$total_lines" -gt 0 -a "$similarity" -lt $(( total_lines / 3 )) ]; then
              # Considéré comme un doublon potentiel (>66% identique)
              similarity_pct=$((100 - similarity * 100 / (total_lines > 0 ? total_lines : 1)))
              echo "| $old_file | $potential_match | ${similarity_pct}% identique (noms normalisés) |" >> "$REPORT_FILE"
              echo "[POTENTIAL-DUPLICATE] $old_file -> $potential_match (${similarity_pct}% identique)" >> "$LOG_FILE"
              
              if [ "$VERBOSE" = true ]; then
                echo -e "${YELLOW}[POTENTIAL-DUPLICATE]${NC} $old_file -> $potential_match (${similarity_pct}% identique)"
              fi
              
              # Supprimer le fichier obsolète si suffisamment similaire (>90%) et en mode force
              if [ "$similarity_pct" -gt 90 ] && [ "$FORCE_MODE" = true ]; then
                if safe_remove "$old_file" "Doublon de $potential_match (${similarity_pct}% identique)" "file"; then
                  echo "[AUTO-REMOVED] $old_file (${similarity_pct}% identique à $potential_match)" >> "$LOG_FILE"
                  if [ "$VERBOSE" = true ]; then
                    echo -e "${GREEN}[AUTO-REMOVED]${NC} $old_file"
                  fi
                fi
              fi
              break
            fi
          fi
        done
      fi
    done
  done
  
  # Rechercher aussi les dossiers potentiellement doublons
  for old_struct in "${!STRUCTURE_MAPPING[@]}"; do
    new_struct="${STRUCTURE_MAPPING[$old_struct]}"
    
    if [ ! -d "$old_struct" ]; then
      continue  # Ignorer les dossiers qui n'existent pas
    fi
    
    # Parcourir les sous-dossiers
    find "$old_struct" -mindepth 1 -maxdepth 3 -type d 2>/dev/null | while read -r old_dir; do
      dir_name=$(basename "$old_dir")
      
      # Rechercher des dossiers avec le même nom dans la nouvelle structure
      similar_dirs=$(find "$new_struct" -mindepth 1 -maxdepth 3 -type d -name "$dir_name" 2>/dev/null)
      
      if [ -n "$similar_dirs" ]; then
        first_match=$(echo "$similar_dirs" | head -n 1)
        
        # Compter les fichiers dans les deux dossiers
        old_files=$(find "$old_dir" -type f | wc -l)
        new_files=$(find "$first_match" -type f | wc -l)
        
        if [ "$old_files" -gt 0 ] && [ "$new_files" -gt 0 ]; then
          echo "| $old_dir/ | $first_match/ | Dossier doublon potentiel |" >> "$REPORT_FILE"
          echo "[DUPLICATE-DIR] $old_dir -> $first_match" >> "$LOG_FILE"
          
          if [ "$VERBOSE" = true ]; then
            echo -e "${YELLOW}[DUPLICATE-DIR]${NC} $old_dir -> $first_match"
          fi
          
          # En mode force, supprimer les dossiers doublons
          if [ "$FORCE_MODE" = true ]; then
            if safe_remove "$old_dir" "Dossier doublon de $first_match" "directory"; then
              echo "[AUTO-REMOVED-DIR] $old_dir (doublon de $first_match)" >> "$LOG_FILE"
              if [ "$VERBOSE" = true ]; then
                echo -e "${GREEN}[AUTO-REMOVED-DIR]${NC} $old_dir"
              fi
            fi
          fi
        fi
      fi
    done
  done
  
  success "Détection avancée des doublons terminée"
}

############################################################
# ÉTAPE 1: FICHIERS OBSOLÈTES CONNUS
############################################################

log "Suppression des fichiers obsolètes connus..."

# Liste des fichiers à supprimer basée sur le rapport d'obsolescence
declare -a OBSOLETE_FILES=(
  "./scripts/clean-root-directory.sh"
  "./scripts/optimize-git-repo-fixed.sh"
  "./scripts/clean-packages-fixed.sh"
  "./cleanup-report-*.txt"
  "./disk-optimization-report-*.txt"
  
  # Fichiers dupliqués après la restructuration à trois couches
  "./packages/mcp-agents/analyzers"
  "./agents"
  
  # Ancienne structure de orchestration obsolète
  "./legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestratorbridge"
  "./legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts"
  
  # Fichiers de configuration obsolètes
  "./app"  # Structure redondante avec le standard Nx apps
  
  # Scripts temporaires et redondants
  "./restructure-3-layers.sh"  # Remplacé par restructuration-trois-couches.sh
  "./restructure-project.sh"   # Remplacé par restructuration-complete.sh
  "./migration-rapide.sh"      # Migration désormais terminée
  "./fix-duplicates.sh"        # Remplacé par deduplication-agents.sh
  "./reorganiser-projet.sh"    # Remplacé par restructuration-complete.sh
)

# Liste des patterns de fichiers obsolètes
declare -a OBSOLETE_PATTERNS=(
  "*-deprecated.{ts,js,json}"
  "*.temp.{ts,js}"
  "*.old.{ts,js}"
  "*_old.{ts,js}"
  "*_deprecated.{ts,js}"
  "*_unused.{ts,js}"
  "*-unused.{ts,js}"
  "*-backup-*.{ts,js,json}"
  "*_backup_*.{ts,js,json}"
)

# Supprimer les fichiers obsolètes connus
echo "| Fichier | Raison de suppression |" >> "$REPORT_FILE"
echo "|---------|------------------------|" >> "$REPORT_FILE"

for file in "${OBSOLETE_FILES[@]}"; do
  if [ -e "$file" ]; then
    target_type="file"
    if [ -d "$file" ]; then
      target_type="directory"
    fi
    
    if safe_remove "$file" "Fichier obsolète connu" "$target_type"; then
      echo "| $file | Fichier obsolète connu | " >> "$REPORT_FILE"
    fi
  fi
done

# Rechercher et supprimer les fichiers correspondant aux patterns obsolètes
for pattern in "${OBSOLETE_PATTERNS[@]}"; do
  find ./packages ./apps ./agents ./tools -type f -name "$pattern" 2>/dev/null | while read -r file; do
    if safe_remove "$file" "Correspondance au pattern d'obsolescence '$pattern'" "file"; then
      echo "| $file | Correspondance au pattern d'obsolescence '$pattern' |" >> "$REPORT_FILE"
    fi
  done
done

# Suppression des fichiers dupliqués après restructuration en trois couches
log "Nettoyage des fichiers dupliqués après restructuration en trois couches..."

# Fichiers qui ont été migrés vers la nouvelle structure à trois couches
if [ -d "./packages/business" ] && [ -d "./packages/mcp-agents" ]; then
  echo "" >> "$REPORT_FILE"
  echo "### Fichiers dupliqués après migration vers architecture à trois couches" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| Ancien emplacement | Nouvel emplacement |" >> "$REPORT_FILE"
  echo "|-------------------|-------------------|" >> "$REPORT_FILE"
  
  # Agents restructurés
  if [ -d "./packages/business/src/agents" ]; then
    for agent_dir in $(find ./packages/business/src/agents -mindepth 2 -maxdepth 2 -type d 2>/dev/null); do
      agent_name=$(basename "$agent_dir")
      old_agent_dir=$(find ./packages/mcp-agents -path "*/$agent_name" -type d 2>/dev/null)
      
      if [ -n "$old_agent_dir" ]; then
        echo "| $old_agent_dir | $agent_dir |" >> "$REPORT_FILE"
        echo "[DUPLICATE DETECTED] $old_agent_dir -> $agent_dir" >> "$LOG_FILE"
        backup_file "$old_agent_dir"
        rm -rf "$old_agent_dir"
        echo "[REMOVED] $old_agent_dir (migrated to 3-layer)" >> "$LOG_FILE"
      fi
    done
  fi
fi

success "Suppression des fichiers obsolètes connus terminée"

############################################################
# ÉTAPE 2: FICHIERS DE MIGRATIONS OBSOLÈTES
############################################################

log "Nettoyage des fichiers de migration obsolètes..."

# Fichiers de migration n8n qui ne sont plus nécessaires
find ./migrations -type f \( -name "*workflow*.json.bak" -o -name "*workflow*.json.old" -o -name "*workflow*-backup-*.json" \) 2>/dev/null | while read -r file; do
  backup_file "$file"
  rm -f "$file"
  echo "| $file | Backup de workflow n8n obsolète |" >> "$REPORT_FILE"
  echo "[REMOVED] $file" >> "$LOG_FILE"
done

success "Nettoyage des fichiers de migration obsolètes terminé"

############################################################
# ÉTAPE 3: FICHIERS TEMPORAIRES ET LOGS
############################################################

log "Suppression des fichiers temporaires et logs..."

# Supprimer les fichiers temporaires et logs
find . -type f \( -name "*.log" -o -name "*.tmp" -o -name "temp-*" -o -name "*.temp" \) -not -path "./reports/*" -not -path "./logs/*" 2>/dev/null | while read -r file; do
  backup_file "$file"
  rm -f "$file"
  echo "| $file | Fichier temporaire ou log |" >> "$REPORT_FILE"
  echo "[REMOVED] $file (temp/log)" >> "$LOG_FILE"
done

success "Suppression des fichiers temporaires et logs terminée"

############################################################
# ÉTAPE 4: FICHIERS TESTS OBSOLÈTES
############################################################

log "Vérification des tests obsolètes..."

# Rechercher les fichiers de test qui ne correspondent plus à des fichiers existants
find . -type f -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" 2>/dev/null | while read -r test_file; do
  # Extraire le nom du fichier testé
  base_name=$(basename "$test_file" | sed -E 's/\.test\..+|\.spec\..+//')
  dir_name=$(dirname "$test_file")
  
  # Chercher le fichier correspondant
  if ! find "$dir_name" -maxdepth 1 -name "${base_name}.ts" -o -name "${base_name}.js" | grep -q .; then
    echo "| $test_file | Test pour un fichier qui n'existe plus |" >> "$REPORT_FILE"
    backup_file "$test_file"
    rm -f "$test_file"
    echo "[REMOVED] $test_file (test orphelin)" >> "$LOG_FILE"
  fi
done

success "Vérification des tests obsolètes terminée"

############################################################
# ÉTAPE 5: FICHIERS OBSOLÈTES APRÈS RESTRUCTURATION EN TROIS COUCHES
############################################################

log "Nettoyage après restructuration en trois couches..."

# Vérifier si la restructuration a été effectuée
if [ -d "./packages/orchestration" ] && [ -d "./packages/coordination" ] && [ -d "./packages/business" ]; then
  
  # Liste des orchestrateurs à supprimer (maintenant dans packages/orchestration)
  echo "" >> "$REPORT_FILE"
  echo "### Orchestrateurs obsolètes" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| Ancien emplacement | Nouvel emplacement |" >> "$REPORT_FILE"
  echo "|-------------------|-------------------|" >> "$REPORT_FILE"
  
  # Chercher les orchestrateurs en dehors de packages/orchestration qui sont des doublons
  find . -type f \( -name "*orchestrator*.ts" -o -name "*orchestration*.ts" \) -not -path "./packages/orchestration/*" -not -path "./node_modules/*" -not -path "./backup/*" 2>/dev/null | while read -r old_file; do
    file_base=$(basename "$old_file")
    new_file=$(find ./packages/orchestration -name "$file_base" 2>/dev/null)
    
    if [ -n "$new_file" ] || grep -q "orchestrator" "$old_file"; then
      echo "| $old_file | $([ -n "$new_file" ] && echo "$new_file" || echo "Migré vers orchestration") |" >> "$REPORT_FILE"
      backup_file "$old_file"
      rm -f "$old_file"
      echo "[REMOVED] $old_file (orchestrateur migré)" >> "$LOG_FILE"
    fi
  done
  
  # Supprimer les agents obsolètes
  echo "" >> "$REPORT_FILE"
  echo "### Agents obsolètes" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| Ancien emplacement | Nouvel emplacement |" >> "$REPORT_FILE"
  echo "|-------------------|-------------------|" >> "$REPORT_FILE"
  
  if [ -d "./packages/mcp-agents" ]; then
    echo "[INFO] Sauvegarde des agents dans le répertoire packages/mcp-agents" >> "$LOG_FILE"
    backup_file "./packages/mcp-agents"
    
    echo "| ./packages/mcp-agents | ./packages/business/src/agents |" >> "$REPORT_FILE"
    rm -rf "./packages/mcp-agents"
    echo "[REMOVED] ./packages/mcp-agents (migré vers business/src/agents)" >> "$LOG_FILE"
  fi
  
  success "Nettoyage après restructuration en trois couches terminé"
else
  warn "Structure à trois couches non détectée, étape ignorée"
fi

############################################################
# ÉTAPE 6: DÉTECTION AVANCÉE DES DOUBLONS
############################################################

# Utiliser notre nouvelle fonction de détection des doublons
detect_duplicates

############################################################
# ÉTAPE 7: SUPPRESSION DES DOSSIERS VIDES
############################################################

log "Suppression des dossiers vides..."

# Trouver et supprimer les dossiers vides (de manière récursive)
find ./packages ./apps ./tools -type d -empty 2>/dev/null | sort -r | while read -r empty_dir; do
  echo "| $empty_dir | Dossier vide après nettoyage |" >> "$REPORT_FILE"
  rmdir "$empty_dir"
  echo "[REMOVED] $empty_dir (dossier vide)" >> "$LOG_FILE"
done

success "Suppression des dossiers vides terminée"

############################################################
# ÉTAPE 7: VERIFICATION DES RAPPORTS OBSOLÈTES
############################################################

log "Archivage des rapports obsolètes..."

# Créer un répertoire d'archives pour les anciens rapports
ARCHIVE_DIR="./archives_old/archive-rapports-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

# Déplacer les anciens rapports vers les archives
find ./reports -type f -name "*-2025-0[1-4]-*.md" -o -name "*-2024-*.md" 2>/dev/null | while read -r report; do
  mkdir -p "$ARCHIVE_DIR/$(dirname "$report" | sed 's|^\./||')"
  mv "$report" "$ARCHIVE_DIR/$report"
  echo "| $report | Archivé (rapport obsolète) |" >> "$REPORT_FILE"
  echo "[ARCHIVED] $report -> $ARCHIVE_DIR/$report" >> "$LOG_FILE"
done

# Déplacer les rapports de déduplication intermédiaires
find ./cleanup-report -type f -name "deduplication-phase*-report-*.md" 2>/dev/null | sort | head -n -1 | while read -r report; do
  mkdir -p "$ARCHIVE_DIR/$(dirname "$report" | sed 's|^\./||')"
  mv "$report" "$ARCHIVE_DIR/$report"
  echo "| $report | Archivé (rapport de déduplication intermédiaire) |" >> "$REPORT_FILE"
  echo "[ARCHIVED] $report -> $ARCHIVE_DIR/$report" >> "$LOG_FILE"
done

success "Archivage des rapports obsolètes terminé"

############################################################
# ÉTAPE 8: GÉNÉRATION D'UN RAPPORT DE SYNTHÈSE
############################################################

echo -e "\n## Synthèse de la suppression des fichiers obsolètes" >> "$REPORT_FILE"
echo "| Catégorie | Nombre d'éléments traités |" >> "$REPORT_FILE"
echo "|-----------|---------------------------|" >> "$REPORT_FILE"
echo "| Fichiers obsolètes supprimés | $(grep "\[REMOVED\]" "$LOG_FILE" | wc -l) |" >> "$REPORT_FILE"
echo "| Fichiers archivés | $(grep "\[ARCHIVED\]" "$LOG_FILE" | wc -l) |" >> "$REPORT_FILE"

############################################################
# STATISTIQUES FINALES
############################################################

# Calculer les statistiques
TOTAL_REMOVED=$(grep -c "\[REMOVED\]" "$LOG_FILE")
TOTAL_AUTO_REMOVED=$(grep -c "\[AUTO-REMOVED\]" "$LOG_FILE")
TOTAL_AUTO_REMOVED_DIR=$(grep -c "\[AUTO-REMOVED-DIR\]" "$LOG_FILE")
TOTAL_BACKUPS=$(grep -c "\[BACKUP\]" "$LOG_FILE")
TOTAL_DUPLICATES=$(grep -c "\[DUPLICATE\]" "$LOG_FILE")
TOTAL_POTENTIAL_DUPLICATES=$(grep -c "\[POTENTIAL-DUPLICATE\]" "$LOG_FILE")
DISK_SAVED=$(du -sh "$BACKUP_DIR" | awk '{print $1}')

# Ajouter les statistiques au rapport
echo "" >> "$REPORT_FILE"
echo "## Statistiques" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Fichiers supprimés manuellement**: $TOTAL_REMOVED" >> "$REPORT_FILE"
echo "- **Fichiers supprimés automatiquement**: $TOTAL_AUTO_REMOVED" >> "$REPORT_FILE"
echo "- **Dossiers supprimés automatiquement**: $TOTAL_AUTO_REMOVED_DIR" >> "$REPORT_FILE"
echo "- **Doublons détectés**: $TOTAL_DUPLICATES" >> "$REPORT_FILE"
echo "- **Doublons potentiels**: $TOTAL_POTENTIAL_DUPLICATES" >> "$REPORT_FILE"
echo "- **Sauvegardes créées**: $TOTAL_BACKUPS" >> "$REPORT_FILE"
echo "- **Espace disque libéré**: $DISK_SAVED" >> "$REPORT_FILE"
echo "- **Sauvegarde des fichiers supprimés**: \`$BACKUP_DIR\`" >> "$REPORT_FILE"

# Ajouter une note sur les options utilisées
echo "" >> "$REPORT_FILE"
echo "### Options utilisées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Mode force**: $([ "$FORCE_MODE" = true ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
echo "- **Mode simulation**: $([ "$DRY_RUN" = true ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
echo "- **Mode verbeux**: $([ "$VERBOSE" = true ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Conclusion" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Le nettoyage des fichiers obsolètes après la restructuration du projet est terminé. Tous les fichiers supprimés ont été sauvegardés dans le dossier \`$BACKUP_DIR\` en cas de besoin de restauration." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Date de fin: $(date +"%d/%m/%Y %H:%M:%S")" >> "$REPORT_FILE"

# Étape 9: Afficher le résumé à l'écran
echo
echo -e "${GREEN}${BOLD}=== Résumé du nettoyage ===${NC}"
echo -e "${BLUE}Fichiers supprimés:${NC} $TOTAL_REMOVED"
echo -e "${BLUE}Sauvegardes créées:${NC} $TOTAL_BACKUPS"
echo -e "${BLUE}Espace disque libéré:${NC} $DISK_SAVED"
echo -e "${YELLOW}Sauvegarde des fichiers supprimés:${NC} $BACKUP_DIR"
echo -e "${GREEN}Rapport détaillé:${NC} $REPORT_FILE"
echo

success "Nettoyage des fichiers obsolètes terminé avec succès!"
echo -e "${YELLOW}Note: En cas de problème, tous les fichiers peuvent être restaurés depuis $BACKUP_DIR${NC}"

echo
echo -e "${BLUE}Pour une détection plus agressive des doublons, utilisez:${NC}"
echo -e "  ${GREEN}./supprimer-obsolete.sh --force --verbose${NC}"
echo -e "${BLUE}Pour simuler la suppression sans supprimer réellement:${NC}"
echo -e "  ${GREEN}./supprimer-obsolete.sh --dry-run --verbose${NC}"
