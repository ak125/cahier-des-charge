#!/bin/bash
# Script pour effectuer le nettoyage supervisé des fichiers d'agents redondants
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
LEGACY_AGENTS_DIR="${WORKSPACE_ROOT}/src/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/legacy-agents-$(date +"%Y%m%d-%H%M%S")"
LOG_FILE="${WORKSPACE_ROOT}/logs/cleanup-$(date +"%Y%m%d-%H%M%S").log"

# S'assurer que les répertoires existent
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Fonction pour enregistrer les logs
log() {
  local message="$1"
  local level="$2"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  if [ -z "$level" ]; then
    level="INFO"
  fi
  
  echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
  
  case "$level" in
    "INFO") echo -e "${BLUE}${message}${RESET}" ;;
    "SUCCESS") echo -e "${GREEN}${message}${RESET}" ;;
    "WARNING") echo -e "${YELLOW}${message}${RESET}" ;;
    "ERROR") echo -e "${RED}${message}${RESET}" ;;
    *) echo -e "${message}" ;;
  esac
}

# Fonction pour demander confirmation
confirm() {
  local message="$1"
  local response
  
  echo -en "${YELLOW}${message} (o/n): ${RESET}"
  read -r response
  
  if [[ "$response" =~ ^[oO]$ ]]; then
    return 0  # Confirmation positive
  else
    return 1  # Confirmation négative
  fi
}

# Fonction pour effectuer une sauvegarde d'un fichier
backup_file() {
  local file="$1"
  local relative_path="${file#$LEGACY_AGENTS_DIR/}"
  local backup_path="${BACKUP_DIR}/${relative_path}"
  local backup_dir=$(dirname "$backup_path")
  
  mkdir -p "$backup_dir"
  cp "$file" "$backup_path"
  
  log "Sauvegarde de $file vers $backup_path" "INFO"
}

# Fonction pour effectuer le nettoyage supervisé d'un fichier
cleanup_file() {
  local file="$1"
  local similarity="$2"
  local new_file="$3"
  local agent_name=$(basename "$file" .ts)
  
  if [ ! -f "$file" ]; then
    log "Fichier non trouvé: $file" "ERROR"
    return 1
  fi
  
  # Afficher des informations sur le fichier à nettoyer
  log "Analyse du fichier: $file" "INFO"
  log "  - Similarité avec le nouveau fichier: ${similarity}%" "INFO"
  log "  - Nouveau fichier équivalent: $new_file" "INFO"
  
  # Si le fichier est très similaire (>=90%), suggérer une suppression directe
  if (( $(echo "$similarity >= 90" | bc -l) )); then
    if confirm "Le fichier est très similaire (${similarity}%). Voulez-vous le supprimer?"; then
      backup_file "$file"
      rm "$file"
      log "Fichier supprimé: $file" "SUCCESS"
      return 0
    fi
  # Si le fichier est moyennement similaire (>=70%), suggérer une vérification manuelle
  elif (( $(echo "$similarity >= 70" | bc -l) )); then
    echo -e "${YELLOW}Contenu du fichier source:${RESET}"
    head -n 20 "$file" | cat -n
    echo -e "${YELLOW}... (lignes omises) ...${RESET}"
    echo -e "${BLUE}Contenu du fichier cible:${RESET}"
    head -n 20 "$new_file" | cat -n
    echo -e "${BLUE}... (lignes omises) ...${RESET}"
    
    if confirm "Le fichier est moyennement similaire (${similarity}%). Voulez-vous le supprimer après vérification?"; then
      backup_file "$file"
      rm "$file"
      log "Fichier supprimé après vérification: $file" "SUCCESS"
      return 0
    fi
  # Si le fichier est peu similaire (<70%), suggérer de le conserver ou de l'examiner davantage
  else
    log "Le fichier a une faible similarité (${similarity}%). Examen approfondi recommandé." "WARNING"
    echo -e "${YELLOW}Contenu du fichier source:${RESET}"
    head -n 30 "$file" | cat -n
    echo -e "${YELLOW}... (lignes omises) ...${RESET}"
    echo -e "${BLUE}Contenu du fichier cible:${RESET}"
    head -n 30 "$new_file" | cat -n
    echo -e "${BLUE}... (lignes omises) ...${RESET}"
    
    echo -e "${YELLOW}Options:${RESET}"
    echo -e "  1. Supprimer le fichier"
    echo -e "  2. Conserver le fichier"
    echo -e "  3. Ouvrir les deux fichiers pour une comparaison complète"
    
    local choice
    echo -en "${YELLOW}Votre choix (1/2/3): ${RESET}"
    read -r choice
    
    case "$choice" in
      1)
        backup_file "$file"
        rm "$file"
        log "Fichier supprimé après examen approfondi: $file" "SUCCESS"
        return 0
        ;;
      2)
        log "Fichier conservé: $file" "INFO"
        return 1
        ;;
      3)
        # Ouvrir les fichiers dans un éditeur pour comparaison
        if command -v code &> /dev/null; then
          code --diff "$file" "$new_file"
          
          if confirm "Après comparaison, voulez-vous supprimer le fichier?"; then
            backup_file "$file"
            rm "$file"
            log "Fichier supprimé après comparaison complète: $file" "SUCCESS"
            return 0
          else
            log "Fichier conservé après comparaison: $file" "INFO"
            return 1
          fi
        else
          log "Éditeur VS Code non disponible pour la comparaison. Utilisation de diff." "WARNING"
          diff -y --suppress-common-lines "$file" "$new_file" | head -n 50
          
          if confirm "Après comparaison, voulez-vous supprimer le fichier?"; then
            backup_file "$file"
            rm "$file"
            log "Fichier supprimé après comparaison: $file" "SUCCESS"
            return 0
          else
            log "Fichier conservé après comparaison: $file" "INFO"
            return 1
          fi
        fi
        ;;
      *)
        log "Option non reconnue. Le fichier est conservé: $file" "WARNING"
        return 1
        ;;
    esac
  fi
  
  log "Fichier conservé: $file" "INFO"
  return 1
}

# Fonction principale
main() {
  log "Démarrage du nettoyage supervisé des fichiers d'agents redondants" "INFO"
  
  # Vérifier si cleanup-legacy-agents.sh existe et l'exécuter si nécessaire
  if [ -f "${WORKSPACE_ROOT}/cleanup-legacy-agents.sh" ] && [ ! -f "${WORKSPACE_ROOT}/cleanup-legacy-agents-results.json" ]; then
    log "Exécution du script d'analyse initial cleanup-legacy-agents.sh" "INFO"
    bash "${WORKSPACE_ROOT}/cleanup-legacy-agents.sh" --analyze-only --output "${WORKSPACE_ROOT}/cleanup-legacy-agents-results.json"
  fi
  
  # Vérifier si le fichier de résultats existe
  if [ ! -f "${WORKSPACE_ROOT}/cleanup-legacy-agents-results.json" ]; then
    log "Fichier de résultats d'analyse non trouvé. Impossible de continuer." "ERROR"
    exit 1
  fi
  
  # Compter le nombre de fichiers à traiter
  local total_files=$(grep -o '"similarity":' "${WORKSPACE_ROOT}/cleanup-legacy-agents-results.json" | wc -l)
  log "Nombre total de fichiers à analyser: $total_files" "INFO"
  
  # Initialiser les compteurs
  local processed=0
  local removed=0
  local kept=0
  
  # Traiter chaque fichier dans le résultat de l'analyse
  while IFS= read -r line; do
    # Extraire les informations du fichier
    local file=$(echo "$line" | grep -o '"sourceFile": "[^"]*"' | cut -d'"' -f4)
    local similarity=$(echo "$line" | grep -o '"similarity": [0-9.]*' | cut -d' ' -f2)
    local new_file=$(echo "$line" | grep -o '"targetFile": "[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$file" ] || [ -z "$similarity" ] || [ -z "$new_file" ]; then
      continue
    fi
    
    ((processed++))
    log "Traitement du fichier $processed/$total_files: $file" "INFO"
    
    # Effectuer le nettoyage supervisé
    if cleanup_file "$file" "$similarity" "$new_file"; then
      ((removed++))
    else
      ((kept++))
    fi
    
    echo ""  # Ligne vide pour séparer les fichiers
  done < <(grep -o '{[^}]*"sourceFile"[^}]*}' "${WORKSPACE_ROOT}/cleanup-legacy-agents-results.json")
  
  log "Nettoyage supervisé terminé" "SUCCESS"
  log "Statistiques:" "INFO"
  log "- Fichiers traités: $processed" "INFO"
  log "- Fichiers supprimés: $removed" "SUCCESS"
  log "- Fichiers conservés: $kept" "INFO"
  log "Une sauvegarde de tous les fichiers supprimés a été créée dans: $BACKUP_DIR" "INFO"
  log "Journal des opérations disponible dans: $LOG_FILE" "INFO"
}

# Exécuter la fonction principale
main