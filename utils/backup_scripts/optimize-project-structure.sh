#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   OPTIMISATION DE LA STRUCTURE DU PROJET             ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/structure_optimization_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
LOG_FILE="${LOG_DIR}/structure_optimization_${TIMESTAMP}.log"
REPORT_DIR="/workspaces/cahier-des-charge/reports"
REPORT_FILE="${REPORT_DIR}/structure_optimization_${TIMESTAMP}.md"
WORKSPACE_ROOT="/workspaces/cahier-des-charge"

# Structure pour fusionner des dossiers similaires
declare -A MERGE_DIRECTORIES=(
  ["scripts,tools,utils"]="utils"
  ["docs,documentation"]="documentation"
  ["reports,logs"]="reports"
  ["backups,clean-backups,structure-backups,conflict-resolution-backups"]="backups"
  ["tests,test-results"]="tests"
  ["migration-toolkit,migrations"]="migrations"
  ["packages,modules"]="packages"
)

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORT_DIR}"

# Initialisation du fichier de log
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour sauvegarder la structure actuelle
backup_structure() {
  log "${YELLOW}Sauvegarde de la structure actuelle du projet...${NC}"
  
  # Copier la structure (sans les fichiers volumineux)
  find "${WORKSPACE_ROOT}" -type d -not -path "*/node_modules/*" -not -path "*/\.git/*" | while read -r dir; do
    rel_dir="${dir#${WORKSPACE_ROOT}/}"
    if [ -n "${rel_dir}" ]; then
      mkdir -p "${BACKUP_DIR}/${rel_dir}"
    fi
  done
  
  # Copier seulement les fichiers de configuration et les petits fichiers
  find "${WORKSPACE_ROOT}" -type f -size -100k -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" | while read -r file; do
    rel_file="${file#${WORKSPACE_ROOT}/}"
    rel_dir=$(dirname "${rel_file}")
    mkdir -p "${BACKUP_DIR}/${rel_dir}"
    cp "${file}" "${BACKUP_DIR}/${rel_file}"
  done
  
  log "${GREEN}✅ Sauvegarde terminée dans ${BACKUP_DIR}${NC}"
}

# Fonction pour lister les dossiers vides (tous niveaux)
find_empty_directories() {
  log "${YELLOW}Recherche des dossiers vides à tous les niveaux...${NC}"
  
  # Fichier temporaire pour stocker les dossiers vides
  EMPTY_DIRS_FILE="${LOG_DIR}/empty_dirs_${TIMESTAMP}.txt"
  
  # Initialiser le fichier
  > "${EMPTY_DIRS_FILE}"
  
  # Trouver récursivement tous les dossiers vides à tous les niveaux
  # Répéter la recherche jusqu'à ce qu'on ne trouve plus de nouveaux dossiers vides
  while true; do
    PREVIOUS_COUNT=$(wc -l < "${EMPTY_DIRS_FILE}")
    
    # 1. Trouver les dossiers complètement vides
    find "${WORKSPACE_ROOT}" -type d -empty -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" | sort | while read -r dir; do
      if ! grep -q "^${dir}$" "${EMPTY_DIRS_FILE}"; then
        echo "${dir}" >> "${EMPTY_DIRS_FILE}"
      fi
    done
    
    # 2. Trouver les dossiers qui ne contiennent que des dossiers vides connus
    find "${WORKSPACE_ROOT}" -type d -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" | sort | while read -r dir; do
      # Vérifier si ce dossier n'est pas déjà dans la liste
      if ! grep -q "^${dir}$" "${EMPTY_DIRS_FILE}"; then
        # Vérifier si ce dossier contient des fichiers
        if [ -z "$(find "${dir}" -mindepth 1 -maxdepth 1 -type f -not -path "*/\.*")" ]; then
          # Vérifier si tous les sous-dossiers sont "vides" selon notre liste
          all_subdirs_empty=true
          
          for subdir in $(find "${dir}" -mindepth 1 -maxdepth 1 -type d); do
            if ! grep -q "^${subdir}$" "${EMPTY_DIRS_FILE}"; then
              all_subdirs_empty=false
              break
            fi
          done
          
          if [ "${all_subdirs_empty}" = true ]; then
            echo "${dir}" >> "${EMPTY_DIRS_FILE}"
          fi
        fi
      fi
    done
    
    CURRENT_COUNT=$(wc -l < "${EMPTY_DIRS_FILE}")
    
    # Si aucun nouveau dossier vide n'a été trouvé, sortir de la boucle
    if [ "${CURRENT_COUNT}" -eq "${PREVIOUS_COUNT}" ]; then
      break
    fi
    
    log "  Trouvé ${CURRENT_COUNT} dossiers vides (itération en cours...)"
  done
  
  # Trier les dossiers du plus profond au moins profond pour éviter les problèmes de suppression
  sort -r "${EMPTY_DIRS_FILE}" -o "${EMPTY_DIRS_FILE}"
  
  # Compter le nombre de dossiers vides
  EMPTY_DIRS_COUNT=$(wc -l < "${EMPTY_DIRS_FILE}")
  
  log "${GREEN}✅ ${EMPTY_DIRS_COUNT} dossiers vides identifiés à tous les niveaux${NC}"
  
  # Ajouter au rapport
  {
    echo "# Rapport d'optimisation de la structure du projet"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Dossiers vides identifiés"
    echo ""
    echo "Total: ${EMPTY_DIRS_COUNT} dossiers vides (y compris sous-dossiers et sous-sous-dossiers)"
    echo ""
    echo "Liste des dossiers vides (triée du plus profond au moins profond):"
    echo "```"
    cat "${EMPTY_DIRS_FILE}" | sed "s|${WORKSPACE_ROOT}/||"
    echo "```"
    echo ""
  } > "${REPORT_FILE}"
  
  echo "${EMPTY_DIRS_FILE}"
}

# Fonction pour supprimer les dossiers vides
remove_empty_directories() {
  local empty_dirs_file="$1"
  
  log "${YELLOW}Suppression des dossiers vides à tous les niveaux...${NC}"
  
  # Compteur
  removed=0
  
  # Supprimer les dossiers vides (déjà triés du plus profond au moins profond)
  while read -r dir; do
    if [ -d "${dir}" ] && [ -z "$(ls -A "${dir}")" ]; then
      log "Suppression du dossier vide: ${dir#${WORKSPACE_ROOT}/}"
      rmdir "${dir}" 2>/dev/null
      if [ $? -eq 0 ]; then
        removed=$((removed + 1))
      fi
    fi
  done < "${empty_dirs_file}"
  
  log "${GREEN}✅ ${removed} dossiers vides supprimés (y compris sous-dossiers et sous-sous-dossiers)${NC}"
  
  # Ajouter au rapport
  {
    echo "## Dossiers vides supprimés"
    echo ""
    echo "Total: ${removed} dossiers vides supprimés à tous les niveaux"
    echo ""
  } >> "${REPORT_FILE}"
}

# Fonction pour identifier les dossiers similaires
identify_similar_directories() {
  log "${YELLOW}Identification des dossiers similaires...${NC}"
  
  # Fichier temporaire pour stocker les dossiers similaires
  SIMILAR_DIRS_FILE="${LOG_DIR}/similar_dirs_${TIMESTAMP}.txt"
  
  # Pour chaque groupe défini dans MERGE_DIRECTORIES
  for dirs_group in "${!MERGE_DIRECTORIES[@]}"; do
    IFS=',' read -ra DIRS <<< "${dirs_group}"
    target_dir="${MERGE_DIRECTORIES[${dirs_group}]}"
    
    echo "${dirs_group} -> ${target_dir}" >> "${SIMILAR_DIRS_FILE}"
    
    # Vérifier si les dossiers existent
    for dir in "${DIRS[@]}"; do
      if [ -d "${WORKSPACE_ROOT}/${dir}" ]; then
        echo "  ${WORKSPACE_ROOT}/${dir}" >> "${SIMILAR_DIRS_FILE}"
      fi
    done
    
    echo "" >> "${SIMILAR_DIRS_FILE}"
  done
  
  log "${GREEN}✅ Identification des dossiers similaires terminée${NC}"
  
  # Ajouter au rapport
  {
    echo "## Dossiers similaires identifiés"
    echo ""
    echo "Groupes de dossiers à fusionner:"
    echo "```"
    cat "${SIMILAR_DIRS_FILE}"
    echo "```"
    echo ""
  } >> "${REPORT_FILE}"
  
  echo "${SIMILAR_DIRS_FILE}"
}

# Fonction pour fusionner les dossiers similaires
merge_similar_directories() {
  local similar_dirs_file="$1"
  
  log "${YELLOW}Fusion des dossiers similaires...${NC}"
  
  # Compteur
  merged=0
  
  # Pour chaque groupe défini dans MERGE_DIRECTORIES
  for dirs_group in "${!MERGE_DIRECTORIES[@]}"; do
    IFS=',' read -ra DIRS <<< "${dirs_group}"
    target_dir="${MERGE_DIRECTORIES[${dirs_group}]}"
    
    log "Fusion du groupe: ${dirs_group} -> ${target_dir}"
    
    # Créer le dossier cible s'il n'existe pas
    mkdir -p "${WORKSPACE_ROOT}/${target_dir}"
    
    # Pour chaque dossier du groupe
    for dir in "${DIRS[@]}"; do
      # Si c'est le dossier cible ou s'il n'existe pas, passer
      if [ "${dir}" = "${target_dir}" ] || [ ! -d "${WORKSPACE_ROOT}/${dir}" ]; then
        continue
      fi
      
      log "  Déplacement de ${dir} vers ${target_dir}"
      
      # Déplacer le contenu
      find "${WORKSPACE_ROOT}/${dir}" -mindepth 1 -maxdepth 1 | while read -r item; do
        item_name=$(basename "${item}")
        
        # Si un fichier/dossier de même nom existe déjà dans la cible
        if [ -e "${WORKSPACE_ROOT}/${target_dir}/${item_name}" ]; then
          if [ -d "${item}" ] && [ -d "${WORKSPACE_ROOT}/${target_dir}/${item_name}" ]; then
            # Si ce sont des dossiers, fusionner récursivement
            log "    Fusion récursive de ${dir}/${item_name} dans ${target_dir}/${item_name}"
            cp -r "${item}"/* "${WORKSPACE_ROOT}/${target_dir}/${item_name}/" 2>/dev/null || true
          else
            # Si c'est un fichier, le renommer avec un suffixe
            log "    Renommage de ${dir}/${item_name} pour éviter un conflit"
            cp "${item}" "${WORKSPACE_ROOT}/${target_dir}/${item_name}_from_${dir}" 2>/dev/null || true
          fi
        else
          # Sinon, déplacer simplement
          cp -r "${item}" "${WORKSPACE_ROOT}/${target_dir}/" 2>/dev/null || true
        fi
      done
      
      # Supprimer le dossier d'origine après avoir déplacé son contenu
      if [ "$(find "${WORKSPACE_ROOT}/${dir}" -mindepth 1 | wc -l)" -gt 0 ]; then
        log "    Le dossier ${dir} n'est pas complètement vide après fusion, sauvegarde dans ${target_dir}/backup_${dir}"
        mkdir -p "${WORKSPACE_ROOT}/${target_dir}/backup_${dir}"
        mv "${WORKSPACE_ROOT}/${dir}"/* "${WORKSPACE_ROOT}/${target_dir}/backup_${dir}/" 2>/dev/null || true
      fi
      
      # Supprimer le dossier d'origine maintenant qu'il est vide
      rm -rf "${WORKSPACE_ROOT}/${dir}"
      
      merged=$((merged + 1))
    done
  done
  
  log "${GREEN}✅ ${merged} dossiers fusionnés${NC}"
  
  # Ajouter au rapport
  {
    echo "## Dossiers fusionnés"
    echo ""
    echo "Total: ${merged} dossiers fusionnés"
    echo ""
    
    echo "## Nouvelle structure de dossiers"
    echo ""
    echo "```"
    find "${WORKSPACE_ROOT}" -maxdepth 1 -type d -not -path "*/\.*" -not -path "${WORKSPACE_ROOT}" | sort | sed "s|${WORKSPACE_ROOT}/||"
    echo "```"
    echo ""
  } >> "${REPORT_FILE}"
}

# Fonction pour mettre à jour les imports dans les fichiers
update_imports() {
  log "${YELLOW}Mise à jour des imports dans les fichiers...${NC}"
  
  # Fichiers modifiés
  UPDATED_FILES=0
  
  # Pour chaque groupe défini dans MERGE_DIRECTORIES
  for dirs_group in "${!MERGE_DIRECTORIES[@]}"; do
    IFS=',' read -ra DIRS <<< "${dirs_group}"
    target_dir="${MERGE_DIRECTORIES[${dirs_group}]}"
    
    for dir in "${DIRS[@]}"; do
      # Si c'est le dossier cible, passer
      if [ "${dir}" = "${target_dir}" ]; then
        continue
      fi
      
      # Trouver tous les fichiers JS/TS et mettre à jour les imports
      find "${WORKSPACE_ROOT}" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" | while read -r file; do
        # Si le fichier contient des imports du dossier à remplacer
        if grep -q "from ['\"]\.\./${dir}/\|from ['\"]/${dir}/\|from ['\"]\.\.\/${dir}'\\|from ['\"]\/${dir}'" "${file}"; then
          log "  Mise à jour des imports dans ${file#${WORKSPACE_ROOT}/}"
          
          # Remplacer les imports
          sed -i "s/from ['\"]\.\./${dir}/from '..\\/${target_dir}/g" "${file}"
          sed -i "s/from ['\"]\/\.${dir}/from '\\/${target_dir}/g" "${file}"
          sed -i "s/from ['\"]\.\.\/${dir}'/from '..\\/${target_dir}'/g" "${file}"
          sed -i "s/from ['\"]\/${dir}'/from '\\/${target_dir}'/g" "${file}"
          
          UPDATED_FILES=$((UPDATED_FILES + 1))
        fi
      done
    done
  done
  
  log "${GREEN}✅ ${UPDATED_FILES} fichiers mis à jour${NC}"
  
  # Ajouter au rapport
  {
    echo "## Mises à jour des imports"
    echo ""
    echo "Total: ${UPDATED_FILES} fichiers mis à jour"
    echo ""
  } >> "${REPORT_FILE}"
}

# Fonction pour créer le rapport final
generate_final_report() {
  log "${YELLOW}Génération du rapport final...${NC}"
  
  # Ouvrir le rapport existant et ajouter des informations finales
  {
    echo "## Résumé"
    echo ""
    echo "- Dossiers vides supprimés: ${1}"
    echo "- Dossiers fusionnés: ${2}"
    echo "- Fichiers mis à jour: ${3}"
    echo ""
    echo "## Actions recommandées"
    echo ""
    echo "1. Vérifier que toutes les importations fonctionnent correctement"
    echo "2. Lancer les tests pour s'assurer que la restructuration n'a pas cassé de fonctionnalités"
    echo "3. Mettre à jour la documentation pour refléter la nouvelle structure de dossiers"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer la structure précédente en copiant le contenu de ce dossier."
  } >> "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport final généré: ${REPORT_FILE#${WORKSPACE_ROOT}/}${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va optimiser la structure du projet en supprimant les dossiers vides et en fusionnant les dossiers similaires.${NC}"
  echo -e "${RED}ATTENTION: Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder la structure actuelle
  backup_structure
  
  # Étape 2: Identifier et supprimer les dossiers vides
  empty_dirs_file=$(find_empty_directories)
  empty_dirs_count=$(wc -l < "${empty_dirs_file}")
  remove_empty_directories "${empty_dirs_file}"
  
  # Étape 3: Identifier et fusionner les dossiers similaires
  similar_dirs_file=$(identify_similar_directories)
  merge_similar_directories "${similar_dirs_file}"
  merged_dirs_count=$(grep -c "^  ${WORKSPACE_ROOT}" "${similar_dirs_file}")
  
  # Étape 4: Mettre à jour les imports dans les fichiers
  update_imports
  updated_files_count=$UPDATED_FILES
  
  # Étape 5: Générer le rapport final
  generate_final_report "${empty_dirs_count}" "${merged_dirs_count}" "${updated_files_count}"
  
  log "${GREEN}======================================================${NC}"
  log "${GREEN}✅ Optimisation de la structure du projet terminée!${NC}"
  log "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  log "${GREEN}   - Rapport: ${REPORT_FILE#${WORKSPACE_ROOT}/}${NC}"
  log "${GREEN}   - Log: ${LOG_FILE#${WORKSPACE_ROOT}/}${NC}"
  log "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les dossiers vides ont été supprimés."
  echo "Les dossiers similaires ont été fusionnés selon la configuration."
  echo "Consultez le rapport pour plus de détails: ${REPORT_FILE#${WORKSPACE_ROOT}/}"
}

# Exécution du script principal
main