#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     MISE À JOUR DES IMPORTS DES AGENTS              ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/imports_update_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/update_imports_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/imports_update_${TIMESTAMP}.md"

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${WORKSPACE_ROOT}/reports"

# Initialisation du fichier de log
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  local level="${2:-INFO}"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Fonction pour créer une sauvegarde des fichiers source
backup_source_files() {
  log "Sauvegarde des fichiers source avant mise à jour des imports..." "INFO"
  
  # Sauvegarde des fichiers TypeScript/JavaScript dans tout le projet
  find "${WORKSPACE_ROOT}" -type f \( -name "*.ts" -o -name "*.js" \) -not -path "${WORKSPACE_ROOT}/node_modules/*" -not -path "${WORKSPACE_ROOT}/dist/*" -not -path "${BACKUP_DIR}/*" | while read -r file; do
    rel_path="${file#${WORKSPACE_ROOT}/}"
    target_dir="$(dirname "${BACKUP_DIR}/${rel_path}")"
    mkdir -p "${target_dir}"
    cp "${file}" "${BACKUP_DIR}/${rel_path}"
  done
  
  log "✅ Fichiers source sauvegardés dans ${BACKUP_DIR}" "INFO"
}

# Fonction pour créer une map des anciens chemins vers les nouveaux chemins
create_agent_path_map() {
  log "Création de la map des anciens chemins vers les nouveaux..." "INFO"
  
  local map_file="${LOG_DIR}/agent_path_map.csv"
  echo "old_path,new_path" > "${map_file}"
  
  # Lire le rapport de réorganisation pour extraire les déplacements d'agents
  reorganization_report=$(find "${WORKSPACE_ROOT}/reports" -name "reorganization_*.md" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
  
  if [ -z "${reorganization_report}" ]; then
    log "❌ Aucun rapport de réorganisation trouvé. Impossible de continuer." "ERROR"
    exit 1
  fi
  
  log "Utilisation du rapport de réorganisation : ${reorganization_report}" "INFO"
  
  # Extraire les déplacements de la section "Agents déplacés" du rapport
  in_moved_section=0
  while IFS= read -r line; do
    if [[ "${line}" == "## Agents déplacés" ]]; then
      in_moved_section=1
      continue
    elif [[ "${line}" =~ ^##[^#] && ${in_moved_section} -eq 1 ]]; then
      in_moved_section=0
      break
    fi
    
    if [[ ${in_moved_section} -eq 1 && "${line}" =~ \|.*\|.*\|.*\|.*\| ]]; then
      # Extraire les chemins de la ligne de tableau
      agent=$(echo "${line}" | cut -d'|' -f2 | sed 's/^ *`\(.*\)`.*$/\1/')
      old_path=$(echo "${line}" | cut -d'|' -f3 | xargs)
      new_path=$(echo "${line}" | cut -d'|' -f4 | xargs)
      action=$(echo "${line}" | cut -d'|' -f5 | xargs)
      
      if [[ -n "${old_path}" && -n "${new_path}" && ("${action}" == "moved" || "${action}" == "renamed") ]]; then
        echo "${old_path},${new_path}" >> "${map_file}"
        log "Ajout de l'entrée: ${old_path} -> ${new_path}" "DEBUG"
      fi
    fi
  done < "${reorganization_report}"
  
  total_entries=$(grep -c "," "${map_file}")
  log "✅ Map des chemins créée avec ${total_entries} entrées." "INFO"
  
  echo "${map_file}"
}

# Fonction pour trouver tous les imports d'agents dans les fichiers
find_agent_imports() {
  log "Recherche des imports d'agents dans les fichiers..." "INFO"
  
  local map_file="${1}"
  local imports_file="${LOG_DIR}/agent_imports.csv"
  echo "file,line_number,import_statement,old_path" > "${imports_file}"
  
  # Pour chaque ancien chemin d'agent dans la map
  tail -n +2 "${map_file}" | while IFS=, read -r old_path new_path; do
    # Construire un pattern d'import en utilisant des parties du chemin ou du nom de fichier
    agent_file=$(basename "${old_path}")
    agent_name="${agent_file%.ts}"
    agent_dir=$(dirname "${old_path}" | sed 's|^agents/||')
    
    # Construire plusieurs patterns possibles pour les imports
    patterns=(
      "from ['\"].*${agent_name}['\"]"
      "from ['\"].*${old_path%.*}['\"]"
      "from ['\"].*/${agent_name}['\"]"
      "from ['\"].*/agents/${agent_dir}/${agent_name}['\"]"
    )
    
    for pattern in "${patterns[@]}"; do
      grep -r --include="*.ts" --include="*.js" -n "${pattern}" "${WORKSPACE_ROOT}" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=backups | while IFS=: read -r file line rest; do
        import_statement=$(echo "${rest}" | sed 's/^[[:space:]]*//')
        echo "${file},${line},${import_statement},${old_path}" >> "${imports_file}"
      done
    done
  done
  
  total_imports=$(grep -c "," "${imports_file}")
  log "✅ ${total_imports} imports d'agents trouvés." "INFO"
  
  echo "${imports_file}"
}

# Fonction pour mettre à jour les imports dans un fichier
update_imports_in_file() {
  local file="${1}"
  local map_file="${2}"
  local imports_file="${3}"
  local updates=0
  
  log "Mise à jour des imports dans ${file}..." "DEBUG"
  
  # Créer un fichier temporaire
  local temp_file="${LOG_DIR}/temp_$(basename "${file}")"
  cp "${file}" "${temp_file}"
  
  # Obtenir les imports à mettre à jour dans ce fichier
  grep "^${file}," "${imports_file}" | while IFS=, read -r filepath line_num import_statement old_path; do
    # Trouver le nouveau chemin dans la map
    new_path=$(grep "^${old_path}," "${map_file}" | cut -d',' -f2)
    
    if [ -n "${new_path}" ]; then
      # Déterminer le cas d'import
      if [[ "${import_statement}" =~ from[[:space:]]+[\"\']([^\'\"]+)[\"\'] ]]; then
        old_import_path="${BASH_REMATCH[1]}"
        
        # Calculer le chemin relatif ou l'ajustement nécessaire
        if [[ "${old_import_path}" == *"${agent_name}" ]]; then
          # Import simple par nom, besoin d'ajuster le chemin complet
          agent_name=$(basename "${old_path}" .ts)
          new_agent_dir=$(dirname "${new_path}")
          
          # Créer un nouveau chemin d'import en utilisant le chemin du fichier actuel
          file_dir=$(dirname "${file}")
          rel_path=$(realpath --relative-to="${file_dir}" "${WORKSPACE_ROOT}/${new_agent_dir}")
          new_import_path="${rel_path}/${agent_name}"
          
          # Remplacer l'ancien chemin par le nouveau
          sed -i "${line_num}s|from ['\"]${old_import_path}['\"]|from '${new_import_path}'|" "${temp_file}"
          updates=$((updates + 1))
        else
          # Import avec chemin, ajuster en conséquence
          # Trouver la partie de l'ancien chemin qui correspond à l'import
          agent_name=$(basename "${old_path}" .ts)
          old_agent_dir=$(dirname "${old_path}")
          new_agent_dir=$(dirname "${new_path}")
          
          # Remplacer la partie correspondante dans le chemin d'import
          new_import_path="${old_import_path/${old_agent_dir}/${new_agent_dir}}"
          if [[ "${new_import_path}" != "${old_import_path}" ]]; then
            sed -i "${line_num}s|from ['\"]${old_import_path}['\"]|from '${new_import_path}'|" "${temp_file}"
            updates=$((updates + 1))
          fi
        fi
      fi
    fi
  done
  
  if [ "${updates}" -gt 0 ]; then
    mv "${temp_file}" "${file}"
    log "✅ ${updates} imports mis à jour dans ${file}" "DEBUG"
    return 0
  else
    rm "${temp_file}"
    log "Aucun import à mettre à jour dans ${file}" "DEBUG"
    return 1
  fi
}

# Fonction pour mettre à jour tous les imports
update_all_imports() {
  local map_file="${1}"
  local imports_file="${2}"
  
  log "Mise à jour de tous les imports..." "INFO"
  
  # Créer une liste des fichiers uniques à traiter
  local files_to_update=$(cut -d',' -f1 "${imports_file}" | sort | uniq | grep -v "^file$")
  local updated_files=0
  local updated_imports=0
  
  echo "${files_to_update}" | while read -r file; do
    if update_imports_in_file "${file}" "${map_file}" "${imports_file}"; then
      updated_files=$((updated_files + 1))
      # Compter les imports mis à jour dans ce fichier
      file_updates=$(grep "^${file}," "${imports_file}" | wc -l)
      updated_imports=$((updated_imports + file_updates))
    fi
  done
  
  log "✅ Imports mis à jour: ${updated_imports} dans ${updated_files} fichiers" "INFO"
}

# Fonction pour générer un rapport de la mise à jour
generate_update_report() {
  local map_file="${1}"
  local imports_file="${2}"
  
  log "Génération du rapport de mise à jour..." "INFO"
  
  # Compter les statistiques
  total_paths=$(grep -c "," "${map_file}")
  total_imports=$(grep -c "," "${imports_file}")
  total_files=$(cut -d',' -f1 "${imports_file}" | sort | uniq | grep -v "^file$" | wc -l)
  
  {
    echo "# Rapport de mise à jour des imports d'agents"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Résumé"
    echo ""
    echo "- **Agents déplacés:** ${total_paths}"
    echo "- **Imports mis à jour:** ${total_imports}"
    echo "- **Fichiers affectés:** ${total_files}"
    echo ""
    echo "## Agents déplacés"
    echo ""
    echo "| Agent | Ancien chemin | Nouveau chemin |"
    echo "|-------|--------------|---------------|"
    
    # Lister les agents déplacés
    tail -n +2 "${map_file}" | sort | while IFS=, read -r old_path new_path; do
      agent_name=$(basename "${old_path}" .ts)
      echo "| \`${agent_name}\` | \`${old_path}\` | \`${new_path}\` |"
    done
    
    echo ""
    echo "## Imports mis à jour"
    echo ""
    echo "| Fichier | Ligne | Import mis à jour |"
    echo "|---------|-------|-------------------|"
    
    # Lister les imports mis à jour
    tail -n +2 "${imports_file}" | sort -t',' -k1,1 -k2,2n | while IFS=, read -r file line_num import_statement old_path; do
      rel_file="${file#${WORKSPACE_ROOT}/}"
      echo "| \`${rel_file}\` | ${line_num} | \`${import_statement}\` |"
    done
    
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des fichiers source avant la mise à jour a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
    
  } > "${REPORT_FILE}"
  
  log "✅ Rapport de mise à jour généré: ${REPORT_FILE}" "INFO"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va mettre à jour les imports des agents déplacés.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "Opération annulée par l'utilisateur." "INFO"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les fichiers source
  backup_source_files
  
  # Étape 2: Créer une map des anciens chemins vers les nouveaux
  map_file=$(create_agent_path_map)
  
  # Étape 3: Trouver tous les imports d'agents
  imports_file=$(find_agent_imports "${map_file}")
  
  # Étape 4: Mettre à jour tous les imports
  update_all_imports "${map_file}" "${imports_file}"
  
  # Étape 5: Générer un rapport de la mise à jour
  generate_update_report "${map_file}" "${imports_file}"
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Mise à jour des imports terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les imports des agents ont été mis à jour."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
}

# Exécution du script principal
main