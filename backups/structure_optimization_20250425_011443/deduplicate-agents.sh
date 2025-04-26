#!/bin/bash
# deduplicate-agents.sh - Script pour corriger les duplications d'agents dans les structures de dossiers
# Date: 24 avril 2025
# Version: 1.0

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables globales
START_TIME=$(date +%s)
LOG_FILE="logs/deduplicate-agents-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="structure-backups/$(date +%Y%m%d-%H%M%S)"
DRY_RUN=true
VERBOSE=false

# Création des dossiers nécessaires
mkdir -p logs
mkdir -p "$BACKUP_DIR"

# Fonctions d'affichage des messages
log_info() {
  local message="$1"
  echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE"
}

log_success() {
  local message="$1"
  echo -e "${GREEN}[SUCCÈS]${NC} $message" | tee -a "$LOG_FILE"
}

log_warning() {
  local message="$1"
  echo -e "${YELLOW}[ATTENTION]${NC} $message" | tee -a "$LOG_FILE"
}

log_error() {
  local message="$1"
  echo -e "${RED}[ERREUR]${NC} $message" | tee -a "$LOG_FILE"
}

log_verbose() {
  local message="$1"
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}[DÉTAIL]${NC} $message" | tee -a "$LOG_FILE"
  else
    echo -e "${CYAN}[DÉTAIL]${NC} $message" >> "$LOG_FILE"
  fi
}

show_banner() {
  echo -e "${BLUE}╔═════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║                                                         ║${NC}"
  echo -e "${BLUE}║      🧹 Correction des duplications d'agents            ║${NC}"
  echo -e "${BLUE}║      Date: $(date '+%d/%m/%Y')                            ║${NC}"
  echo -e "${BLUE}║                                                         ║${NC}"
  echo -e "${BLUE}╚═════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Fonction pour faire une sauvegarde d'un fichier avant modification
backup_file() {
  local source="$1"
  if [ -f "$source" ]; then
    local target_dir="$BACKUP_DIR/$(dirname "$source")"
    mkdir -p "$target_dir"
    cp -p "$source" "$target_dir/$(basename "$source")"
    log_verbose "Sauvegarde: $source → $target_dir/$(basename "$source")"
    return 0
  else
    log_verbose "Fichier introuvable pour sauvegarde: $source"
    return 1
  fi
}

# Fonction pour déplacer un fichier (ou simuler le déplacement)
move_file() {
  local source="$1"
  local destination="$2"
  
  # Vérifier si le fichier source existe
  if [ ! -f "$source" ]; then
    log_error "Fichier source introuvable: $source"
    return 1
  fi
  
  # Créer le répertoire de destination si nécessaire
  local dest_dir=$(dirname "$destination")
  if [ ! -d "$dest_dir" ]; then
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$dest_dir"
      log_verbose "Répertoire créé: $dest_dir"
    else
      log_verbose "[DRY-RUN] Répertoire qui serait créé: $dest_dir"
    fi
  fi
  
  # Faire une sauvegarde du fichier
  if [ "$DRY_RUN" = false ]; then
    backup_file "$source"
  else
    log_verbose "[DRY-RUN] Le fichier $source serait sauvegardé"
  fi
  
  # Déplacer le fichier
  if [ "$DRY_RUN" = false ]; then
    # Vérifier si le fichier de destination existe déjà
    if [ -f "$destination" ]; then
      # Comparer les fichiers
      if diff -q "$source" "$destination" > /dev/null; then
        log_info "Le fichier $source est identique à $destination, suppression du fichier source"
        rm "$source"
      else
        # Sauvegarder la version de destination existante
        backup_file "$destination"
        log_warning "Le fichier $destination existe déjà et diffère. Fusion nécessaire."
        # Décider de la stratégie: ici on remplace par la version source
        cp "$source" "$destination"
        rm "$source"
        log_success "Fichier $source → $destination (avec remplacement)"
      fi
    else
      # Déplacement simple
      mv "$source" "$destination"
      log_success "Fichier déplacé: $source → $destination"
    fi
  else
    log_info "[DRY-RUN] Déplacement qui serait effectué: $source → $destination"
  fi
  
  return 0
}

# Fonction pour récupérer les dossiers contenant des agents selon un pattern
find_agent_folders() {
  local pattern="$1"
  find . -type d -path "*$pattern*" | grep -v "node_modules" | sort
}

# Fonction pour standardiser le nom d'un agent
normalize_agent_name() {
  local name="$1"
  # Convertit CamelCase en kebab-case
  # Ex: SeoCheckerAgent → seo-checker-agent
  echo "$name" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# Fonction pour analyser et corriger les duplications de l'agent qa-analyzer
fix_qa_analyzer() {
  log_info "Correction des duplications de l'agent qa-analyzer..."
  
  # Destination standardisée
  local dest_dir="business/analyzers/qa-analyzer"
  local dest_file="$dest_dir/qa-analyzer.ts"
  
  # Créer le répertoire de destination
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$dest_dir"
  else 
    log_info "[DRY-RUN] Création du répertoire: $dest_dir"
  fi
  
  # Liste des fichiers sources possibles
  local qa_analyzer_files=(
    "agents/qa-analyzer.ts"
    "packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts"
    "src/business/analyzers/qa-analyzer/qa-analyzer.ts"
    "src/business/analyzers/QaAnalyzer/qa-analyzer.ts"
  )
  
  # Prioriser le fichier principal (le premier trouvé dans la liste)
  local main_file=""
  for file in "${qa_analyzer_files[@]}"; do
    if [ -f "$file" ]; then
      main_file="$file"
      break
    fi
  done
  
  if [ -n "$main_file" ]; then
    move_file "$main_file" "$dest_file"
    
    # Supprimer ou déplacer les autres versions
    for file in "${qa_analyzer_files[@]}"; do
      if [ "$file" != "$main_file" ] && [ -f "$file" ]; then
        # Vérifier si les fichiers sont identiques
        if [ "$DRY_RUN" = false ] && diff -q "$file" "$dest_file" > /dev/null; then
          backup_file "$file"
          rm "$file"
          log_success "Fichier dupliqué supprimé: $file"
        else
          # Si les fichiers diffèrent, les sauvegarder avec un suffixe
          local backup_name="$dest_dir/$(basename ${file%.*})_$(echo $file | md5sum | cut -c1-8).${file##*.}"
          move_file "$file" "$backup_name"
          log_warning "Version différente sauvegardée: $file → $backup_name"
        fi
      fi
    done
  else
    log_error "Aucun fichier qa-analyzer trouvé"
  fi
}

# Fonction pour analyser et corriger les duplications de l'agent seo-checker
fix_seo_checker() {
  log_info "Correction des duplications de l'agent seo-checker..."
  
  # Destination standardisée
  local dest_dir="business/validators/seo-checker"
  local dest_file="$dest_dir/seo-checker-agent.ts"
  
  # Créer le répertoire de destination
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$dest_dir"
  else
    log_info "[DRY-RUN] Création du répertoire: $dest_dir"
  fi
  
  # Liste des fichiers sources possibles
  local seo_checker_files=(
    "agents/seo-checker-agent.ts"
    "packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts"
    "packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts"
    "src/business/validators/seo-checker-agent/seo-checker-agent.ts"
    "src/business/validators/SeoCheckerAgent/seo-checker-agent.ts"
  )
  
  # Prioriser le fichier principal (le premier trouvé dans la liste)
  local main_file=""
  for file in "${seo_checker_files[@]}"; do
    if [ -f "$file" ]; then
      main_file="$file"
      break
    fi
  done
  
  if [ -n "$main_file" ]; then
    move_file "$main_file" "$dest_file"
    
    # Supprimer ou déplacer les autres versions
    for file in "${seo_checker_files[@]}"; do
      if [ "$file" != "$main_file" ] && [ -f "$file" ]; then
        # Vérifier si les fichiers sont identiques
        if [ "$DRY_RUN" = false ] && diff -q "$file" "$dest_file" > /dev/null; then
          backup_file "$file"
          rm "$file"
          log_success "Fichier dupliqué supprimé: $file"
        else
          # Si les fichiers diffèrent, les sauvegarder avec un suffixe
          local backup_name="$dest_dir/$(basename ${file%.*})_$(echo $file | md5sum | cut -c1-8).${file##*.}"
          move_file "$file" "$backup_name"
          log_warning "Version différente sauvegardée: $file → $backup_name"
        fi
      fi
    done
  else
    log_error "Aucun fichier seo-checker trouvé"
  fi
}

# Fonction pour analyser tous les agents et corriger les duplications
fix_all_agents() {
  log_info "Analyse et correction de tous les agents..."
  
  # Récupération des dossiers d'agents
  local agent_dirs=$(find . -type d -name "*agent*" -o -name "*Agent*" | grep -v "node_modules" | sort)
  local agent_files=$(find . -type f -name "*agent*.ts" -o -name "*Agent*.ts" | grep -v "node_modules" | sort)
  
  # Création d'une structure temporaire pour l'analyse
  local temp_file="/tmp/agent-analysis-$(date +%s).txt"
  
  # Écrire tous les chemins de fichiers dans un fichier temporaire
  echo "$agent_files" > "$temp_file"
  
  # Analyser le fichier pour détecter les duplications
  log_info "Analyse des duplications d'agents..."
  
  # Récupérer tous les noms d'agents normalisés
  local agent_names=$(cat "$temp_file" | xargs -n1 basename | sed 's/\..*//' | while read name; do normalize_agent_name "$name"; done | sort | uniq)
  
  # Pour chaque nom d'agent normalisé
  echo "$agent_names" | while read normalized_name; do
    if [ -n "$normalized_name" ]; then
      log_info "Vérification de l'agent: $normalized_name"
      
      # Rechercher tous les fichiers correspondants à cet agent
      local files=$(grep -i "$normalized_name" "$temp_file" || echo "")
      local count=$(echo "$files" | wc -l)
      
      if [ "$count" -gt 1 ]; then
        log_warning "⚠️ Agent dupliqué ($count copies): $normalized_name"
        log_verbose "Fichiers trouvés:"
        echo "$files" | while read file; do
          log_verbose "  - $file"
        done
        
        # Créer la destination standardisée
        if [[ "$normalized_name" == *analyzer* ]]; then
          local std_dir="business/analyzers/$(echo $normalized_name | sed 's/-agent$//')"
        elif [[ "$normalized_name" == *validator* ]]; then
          local std_dir="business/validators/$(echo $normalized_name | sed 's/-agent$//')"
        elif [[ "$normalized_name" == *generator* ]]; then
          local std_dir="business/generators/$(echo $normalized_name | sed 's/-agent$//')"
        else
          local std_dir="business/agents/$(echo $normalized_name | sed 's/-agent$//')"
        fi
        
        local std_file="$std_dir/$normalized_name.ts"
        
        # Créer le répertoire standardisé
        if [ "$DRY_RUN" = false ]; then
          mkdir -p "$std_dir"
        else
          log_info "[DRY-RUN] Création du répertoire: $std_dir"
        fi
        
        # Trouver le fichier principal (prioriser les fichiers dans agents/)
        local main_file=""
        echo "$files" | while read file; do
          if [[ "$file" == agents/* ]] && [ -f "$file" ]; then
            main_file="$file"
            break
          fi
        done
        
        # Si aucun fichier dans agents/, prendre le premier
        if [ -z "$main_file" ]; then
          main_file=$(echo "$files" | head -1)
        fi
        
        # Déplacer le fichier principal
        if [ -f "$main_file" ]; then
          move_file "$main_file" "$std_file"
        else
          log_error "Fichier principal introuvable pour l'agent: $normalized_name"
          continue
        fi
        
        # Traiter les autres fichiers
        echo "$files" | while read file; do
          if [ "$file" != "$main_file" ] && [ -f "$file" ]; then
            # Vérifier si les fichiers sont identiques
            if [ "$DRY_RUN" = false ] && diff -q "$file" "$std_file" > /dev/null; then
              backup_file "$file"
              rm "$file"
              log_success "Fichier dupliqué supprimé: $file"
            else
              # Si les fichiers diffèrent, les sauvegarder avec un suffixe
              local backup_name="$std_dir/$(basename ${file%.*})_$(echo $file | md5sum | cut -c1-8).${file##*.}"
              move_file "$file" "$backup_name"
              log_warning "Version différente sauvegardée: $file → $backup_name"
            fi
          fi
        done
      elif [ "$count" -eq 1 ]; then
        log_info "✅ Agent unique: $normalized_name"
      else
        log_verbose "Aucun fichier trouvé pour: $normalized_name"
      fi
    fi
  done
  
  # Nettoyage
  rm -f "$temp_file"
}

# Fonction pour mettre à jour les références après déplacement des agents
update_references() {
  log_info "Mise à jour des références aux agents déplacés..."
  
  # Recherche des fichiers pouvant contenir des imports
  local ts_files=$(find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v "dist")
  
  # Pour chaque fichier
  echo "$ts_files" | while read file; do
    if [ -f "$file" ]; then
      # Vérifier s'il contient des imports d'agents
      local imports=$(grep -l "import.*from.*agent" "$file" 2>/dev/null || echo "")
      if [ -n "$imports" ]; then
        log_verbose "Vérification des imports dans: $file"
        local modified=false
        
        # Sauvegarde du fichier
        if [ "$DRY_RUN" = false ]; then
          backup_file "$file"
        fi
        
        # Mise à jour des chemins pour qa-analyzer
        if grep -q "import.*from.*qa-analyzer" "$file" 2>/dev/null; then
          if [ "$DRY_RUN" = false ]; then
            sed -i 's|import .* from ".*qa-analyzer"|import { qaAnalyzer } from "../../business/analyzers/qa-analyzer/qa-analyzer"|g' "$file"
            sed -i 's|import .* from ".*/qa-analyzer"|import { qaAnalyzer } from "../../business/analyzers/qa-analyzer/qa-analyzer"|g' "$file"
            modified=true
            log_success "Imports de qa-analyzer mis à jour dans: $file"
          else
            log_info "[DRY-RUN] Les imports de qa-analyzer seraient mis à jour dans: $file"
          fi
        fi
        
        # Mise à jour des chemins pour seo-checker
        if grep -q "import.*from.*seo-checker" "$file" 2>/dev/null; then
          if [ "$DRY_RUN" = false ]; then
            sed -i 's|import .* from ".*seo-checker-agent"|import { seoCheckerAgent } from "../../business/validators/seo-checker/seo-checker-agent"|g' "$file"
            sed -i 's|import .* from ".*/seo-checker-agent"|import { seoCheckerAgent } from "../../business/validators/seo-checker/seo-checker-agent"|g' "$file"
            modified=true
            log_success "Imports de seo-checker mis à jour dans: $file"
          else
            log_info "[DRY-RUN] Les imports de seo-checker seraient mis à jour dans: $file"
          fi
        fi
        
        if [ "$modified" = true ]; then
          log_success "Références mises à jour dans: $file"
        fi
      fi
    fi
  done
}

# Fonction pour mettre à jour le statut des migrations
update_migration_status() {
  local migration_id="$1"
  local status="$2"
  
  if [ -f "status.json" ]; then
    log_info "Mise à jour du statut de migration $migration_id → $status"
    
    if [ "$DRY_RUN" = false ]; then
      # Sauvegarde du fichier status.json
      backup_file "status.json"
      
      # Lecture du fichier dans une variable
      local status_content=$(cat status.json)
      
      # Vérifier si la section migrations existe
      if echo "$status_content" | grep -q '"migrations": \[\]'; then
        # Remplacer la section migrations vide par notre entrée
        local new_content=$(echo "$status_content" | sed 's/"migrations": \[\]/"migrations": \[{"id": "'$migration_id'", "status": "'$status'", "lastUpdated": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}\]/')
        echo "$new_content" > status.json
      else
        # Chercher si l'ID existe déjà
        if echo "$status_content" | grep -q "\"id\": \"$migration_id\""; then
          # Mettre à jour l'entrée existante
          local new_content=$(echo "$status_content" | sed 's/\("id": "'$migration_id'", "status": "\)[^"]*\(".*\)/\1'$status'\2/')
          echo "$new_content" > status.json
        else
          # Ajouter une nouvelle entrée
          local new_content=$(echo "$status_content" | sed 's/\("migrations": \[\)/\1{"id": "'$migration_id'", "status": "'$status'", "lastUpdated": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}, /')
          echo "$new_content" > status.json
        fi
      fi
      
      log_success "Statut de migration mis à jour dans status.json"
    else
      log_info "[DRY-RUN] Le statut de migration $migration_id serait mis à jour vers $status"
    fi
  else
    log_error "Le fichier status.json n'existe pas"
  fi
}

# Fonction principale
main() {
  show_banner
  
  # Récupération des arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --execute)
        DRY_RUN=false
        shift
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --help|-h)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --execute    Exécuter réellement les déplacements (défaut: dry-run)"
        echo "  --verbose    Afficher les messages détaillés"
        echo "  --help, -h   Afficher cette aide"
        exit 0
        ;;
      *)
        log_error "Option inconnue: $1"
        echo "Utilisez --help pour afficher l'aide"
        exit 1
        ;;
    esac
  done
  
  # Afficher le mode d'exécution
  if [ "$DRY_RUN" = true ]; then
    log_info "Mode simulation (dry-run) - Aucune modification ne sera effectuée"
    log_info "Pour appliquer les modifications, utilisez --execute"
  else
    log_info "Mode exécution - Les modifications seront appliquées"
  fi
  
  # 1. Corriger les agents spécifiques mentionnés
  fix_qa_analyzer
  fix_seo_checker
  
  # 2. Analyser et corriger toutes les autres duplications d'agents
  fix_all_agents
  
  # 3. Mettre à jour les références
  update_references
  
  # 4. Mettre à jour le statut des migrations concernées
  update_migration_status "MIG-093" "done"
  
  # Affichage du résumé
  log_info "Opération terminée. Journalisation dans: $LOG_FILE"
  
  # Calcul de la durée d'exécution
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  log_info "Durée d'exécution: $DURATION secondes"
  
  # Message final
  if [ "$DRY_RUN" = true ]; then
    echo -e "\n${YELLOW}==============================================${NC}"
    echo -e "${YELLOW}Mode simulation terminé.${NC}"
    echo -e "${YELLOW}Utilisez ${GREEN}$0 --execute${YELLOW} pour appliquer les modifications.${NC}"
    echo -e "${YELLOW}==============================================${NC}"
  else
    echo -e "\n${GREEN}==============================================${NC}"
    echo -e "${GREEN}Correction des duplications terminée avec succès!${NC}"
    echo -e "${GREEN}==============================================${NC}"
  fi
}

# Exécution de la fonction principale
main "$@"