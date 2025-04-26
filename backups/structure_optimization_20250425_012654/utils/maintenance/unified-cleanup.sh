#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   SCRIPT DE NETTOYAGE UNIFIÉ DU PROJET      ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Variables
SCRIPTS_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
PROJECT_ROOT=$(dirname "${SCRIPTS_DIR}")
LOG_DIR="${PROJECT_ROOT}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/cleanup-${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "${LOG_FILE}"
}

# Fonction pour nettoyer les fichiers dupliqués
cleanup_duplicates() {
  log "${YELLOW}Nettoyage des fichiers dupliqués...${NC}"
  
  # Recherche des fichiers potentiellement dupliqués (même taille)
  find "${PROJECT_ROOT}" -type f -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" -printf "%s %p\n" | \
  sort -n | \
  awk 'BEGIN{lasthash=""; lastsize=0; lastfile=""}
  {
    if($1 == lastsize && lastsize > 100) {
      print "Vérification : " lastfile " et " $2 > "/dev/stderr"
      cmd = "md5sum \"" lastfile "\" \"" $2 "\""
      cmd | getline; md51 = $1; file1 = $2
      cmd | getline; md52 = $1; file2 = $2
      close(cmd)
      if(md51 == md52) {
        print file1 " et " file2 " sont identiques"
        print "rm \"" file2 "\""
      }
    }
    lastsize = $1
    lastfile = $2
  }' | grep "^rm" > /tmp/duplicate-removal-commands.sh
  
  # Afficher les fichiers à supprimer
  if [ -s "/tmp/duplicate-removal-commands.sh" ]; then
    log "Les fichiers dupliqués suivants vont être supprimés :"
    cat /tmp/duplicate-removal-commands.sh | sed 's/rm "/- /' | sed 's/"$//'
    
    read -p "Voulez-vous supprimer ces fichiers? (o/n): " confirm
    if [[ $confirm == "o" || $confirm == "O" ]]; then
      bash /tmp/duplicate-removal-commands.sh
      log "${GREEN}✅ Fichiers dupliqués supprimés${NC}"
    else
      log "${YELLOW}Suppression annulée${NC}"
    fi
  else
    log "${GREEN}✅ Aucun fichier dupliqué trouvé${NC}"
  fi
}

# Fonction pour nettoyer le projet
cleanup_project() {
  log "${YELLOW}Nettoyage général du projet...${NC}"
  
  # Nettoyer les dossiers temporaires
  find "${PROJECT_ROOT}" -name "tmp" -type d -exec rm -rf {} \; 2>/dev/null || true
  find "${PROJECT_ROOT}" -name "temp" -type d -exec rm -rf {} \; 2>/dev/null || true
  find "${PROJECT_ROOT}" -name ".DS_Store" -type f -delete 2>/dev/null || true
  
  # Nettoyer les fichiers de log
  find "${LOG_DIR}" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
  
  # Nettoyer les backups anciens
  find "${PROJECT_ROOT}/backups" -type d -mtime +90 -exec rm -rf {} \; 2>/dev/null || true
  
  log "${GREEN}✅ Nettoyage général terminé${NC}"
}

# Fonction pour nettoyer les agents MCP
clean_mcp_agents() {
  log "${YELLOW}Nettoyage des agents MCP...${NC}"
  
  # Supprimer les agents temporaires ou orphelins
  find "${PROJECT_ROOT}/agents" -name "*temp*.ts" -type f -delete 2>/dev/null || true
  find "${PROJECT_ROOT}/agents" -name "*backup*.ts" -type f -delete 2>/dev/null || true
  
  # Identifier les agents orphelins (non référencés)
  for agent in $(find "${PROJECT_ROOT}/agents" -name "*.ts" -type f); do
    agent_name=$(basename "${agent}" .ts)
    if ! grep -q "${agent_name}" "${PROJECT_ROOT}/agents/index.ts" 2>/dev/null; then
      echo "Agent orphelin trouvé : ${agent}"
    fi
  done
  
  log "${GREEN}✅ Nettoyage des agents MCP terminé${NC}"
}

# Fonction pour dédupliquer les fichiers
deduplicate_files() {
  log "${YELLOW}Suppression des fichiers en double...${NC}"
  
  # Utiliser fdupes pour identifier les doublons
  if command -v fdupes &> /dev/null; then
    fdupes -r "${PROJECT_ROOT}" -f | tee /tmp/duplicate-files.txt
    
    if [ -s "/tmp/duplicate-files.txt" ]; then
      log "Fichiers en double trouvés. Consultez /tmp/duplicate-files.txt pour les détails."
      log "Utilisez 'fdupes -r -d ${PROJECT_ROOT}' pour les supprimer interactivement."
    else
      log "${GREEN}✅ Aucun doublon trouvé${NC}"
    fi
  else
    log "${RED}❌ L'outil 'fdupes' n'est pas installé. Installation recommandée.${NC}"
  fi
}

# Menu principal
show_menu() {
  echo ""
  echo "Options disponibles:"
  echo "1. Nettoyer les fichiers dupliqués"
  echo "2. Nettoyage général du projet"
  echo "3. Nettoyer les agents MCP"
  echo "4. Dédupliquer les fichiers"
  echo "5. Exécuter tout"
  echo "6. Quitter"
  echo ""
  read -p "Choisissez une option (1-6): " choice
  
  case $choice in
    1) cleanup_duplicates ;;
    2) cleanup_project ;;
    3) clean_mcp_agents ;;
    4) deduplicate_files ;;
    5)
      cleanup_duplicates
      cleanup_project
      clean_mcp_agents
      deduplicate_files
      ;;
    6) exit 0 ;;
    *) echo "Option invalide" ;;
  esac
  
  show_menu
}

# Vérifier si des arguments sont fournis
if [ $# -gt 0 ]; then
  for arg in "$@"; do
    case $arg in
      --duplicates) cleanup_duplicates ;;
      --project) cleanup_project ;;
      --agents) clean_mcp_agents ;;
      --dedup) deduplicate_files ;;
      --all)
        cleanup_duplicates
        cleanup_project
        clean_mcp_agents
        deduplicate_files
        ;;
      --help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --duplicates   Nettoyer les fichiers dupliqués"
        echo "  --project      Nettoyage général du projet"
        echo "  --agents       Nettoyer les agents MCP"
        echo "  --dedup        Dédupliquer les fichiers"
        echo "  --all          Exécuter toutes les actions"
        echo "  --help         Afficher cette aide"
        exit 0
        ;;
    esac
  done
else
  # Aucun argument, afficher le menu interactif
  show_menu
fi
