#!/bin/bash

# Script pour nettoyer les fichiers obsolètes avant la migration structurelle
# Date de création: $(date +"%Y-%m-%d %H:%M:%S")

# Variables
DRY_RUN=true
BACKUP_DIR="./structure/backup-obsolete-files-$(date +"%Y%m%d-%H%M%S")"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Traitement des arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --execute)
      DRY_RUN=false
      shift
      ;;
    --help|-h)
      echo -e "${BLUE}Utilisation:${NC} $0 [options]"
      echo ""
      echo "Options:"
      echo "  --execute    Exécuter réellement les suppressions (par défaut: dry-run)"
      echo "  --help, -h   Afficher cette aide"
      exit 0
      ;;
    *)
      echo -e "${RED}Option inconnue:${NC} $1"
      exit 1
      ;;
  esac
done

# Afficher le mode d'exécution
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 Mode simulation (dry-run): aucune suppression ne sera effectuée${NC}"
  echo -e "   Utilisez ${GREEN}--execute${NC} pour effectuer réellement les suppressions"
else
  echo -e "${RED}⚠️ Mode d'exécution: les fichiers vont être supprimés${NC}"
  # Création du répertoire de backup au cas où
  mkdir -p "$BACKUP_DIR"
  echo -e "${BLUE}📁 Les fichiers seront sauvegardés dans: ${BACKUP_DIR}${NC}"
fi

# Liste des fichiers obsolètes à nettoyer
# Ces fichiers sont identifiés comme dépréciés dans le rapport de classification
OBSOLETE_FILES=(
  "agent-import-mapping.json.bak"
  "clean_file_lissqt.txt"
  "clean_file_list.txt"
  "clean_file_liste.txt"
  "tsconfig.json.bak"
  "cahier-des-charge/cahier-des-charges-lecture-optimisee.html"
  "cahier-des-charge/vue-complete-auto.html"
  "cahier-des-charge/vue-complete.html"
  "examples/nginx.conf"
  "logs/tests-20250420-031131.log"
  "logs/tests-20250420-041822.log"
  "reports/agent-rename-20250421-030912.log"
  "reports/agent-rename-20250421-034245.log"
  "reports/dependencies-install-20250421-031242.log"
  "reports/dependencies-install-20250421-034707.log"
  "reports/eslint-fix-20250421-033729.log"
  "reports/interfaces-implementation-20250421-031509.log"
  "reports/interfaces-implementation-20250421-034947.log"
  "Dotgithub/workflows/mcp-pipeline.yml"
  "agents/integration/orchestrator-bridge.ts.bak"
)

# Motifs pour trouver des fichiers obsolètes supplémentaires
OBSOLETE_PATTERNS=(
  "*.bak"
  "*.tmp"
  "*.old"
  "*.backup"
  "reports/*/backup*"
  "reports/legacy-cleanup/backup*"
  "reports/potential-agents*/reports/migration-finalization*/backup*"
)

# Fonctions
backup_file() {
  local file=$1
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}❓ Fichier introuvable:${NC} $file"
    return
  fi
  
  local dir=$(dirname "${BACKUP_DIR}/${file}")
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$dir"
    cp "$file" "${BACKUP_DIR}/${file}"
    echo -e "${GREEN}📑 Sauvegardé:${NC} $file → ${BACKUP_DIR}/${file}"
  else
    echo -e "${BLUE}📑 Serait sauvegardé:${NC} $file → ${BACKUP_DIR}/${file}"
  fi
}

remove_file() {
  local file=$1
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}❓ Fichier introuvable:${NC} $file"
    return
  fi
  
  if [ "$DRY_RUN" = false ]; then
    rm -f "$file"
    echo -e "${GREEN}🗑️ Supprimé:${NC} $file"
  else
    echo -e "${BLUE}🗑️ Serait supprimé:${NC} $file"
  fi
}

# Traitement des fichiers obsolètes connus
echo -e "${BLUE}🔍 Traitement des fichiers obsolètes connus...${NC}"
for file in "${OBSOLETE_FILES[@]}"; do
  if [ -f "$file" ]; then
    backup_file "$file"
    remove_file "$file"
  fi
done

# Recherche de fichiers obsolètes supplémentaires par motif
echo -e "${BLUE}🔍 Recherche de fichiers obsolètes par motif...${NC}"
for pattern in "${OBSOLETE_PATTERNS[@]}"; do
  echo -e "${BLUE}   Recherche de:${NC} $pattern"
  
  # Trouver les fichiers correspondant au motif
  mapfile -t found_files < <(find . -path "./node_modules" -prune -o -path "./dist" -prune -o -path "$BACKUP_DIR" -prune -o -name "$pattern" -type f -print 2>/dev/null)
  
  if [ ${#found_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}   Aucun fichier trouvé pour:${NC} $pattern"
    continue
  fi
  
  echo -e "${GREEN}   Trouvé ${#found_files[@]} fichiers pour:${NC} $pattern"
  
  for file in "${found_files[@]}"; do
    backup_file "$file"
    remove_file "$file"
  done
done

# Nettoyer les dossiers vides des répertoires de rapports
if [ "$DRY_RUN" = false ]; then
  echo -e "${BLUE}🔍 Nettoyage des dossiers vides...${NC}"
  find ./reports -type d -empty -delete 2>/dev/null
  echo -e "${GREEN}✅ Nettoyage des dossiers vides terminé${NC}"
fi

# Résumé
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}✨ Simulation terminée. Aucune modification n'a été effectuée.${NC}"
  echo -e "   Pour effectuer réellement les suppressions, utilisez: $0 --execute"
else
  echo -e "${GREEN}✨ Nettoyage terminé! Les fichiers obsolètes ont été supprimés.${NC}"
  echo -e "   Les fichiers ont été sauvegardés dans: ${BACKUP_DIR}"
fi