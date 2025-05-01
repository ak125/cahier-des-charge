#!/bin/bash

# Script pour consolider les agents les plus fréquemment dupliqués

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fichier de log
LOG_FILE="./consolidation-results.log"
> "$LOG_FILE"

echo -e "${BLUE}=== Consolidation des agents prioritaires ===${NC}" | tee -a "$LOG_FILE"
echo "Date: $(date)" | tee -a "$LOG_FILE"

# Liste des agents prioritaires à consolider (format: kebab-case)
PRIORITY_AGENTS=(
  "qa-analyzer"
  "dev-checker" 
  "canonical-validator"
  "seo-checker-agent"
  "seo-content-enhancer"
  "caddyfile-generator"
  "php-analyzer"
  "orchestrator-bridge"
  "structure-agent"
  "dependency-agent"
)

# Chemin principal des packages
MAIN_PATH="./packages/mcp-agents"

# Fonction pour convertir PascalCase en kebab-case
to_kebab_case() {
  echo "$1" | sed -r 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# Fonction pour trouver toutes les instances d'un agent (kebab-case et PascalCase)
find_agent_instances() {
  local agent_name="$1"
  local pascal_name=$(echo "$agent_name" | sed -E 's/(^|-)([a-z])/\U\2/g' | sed 's/-//g')
  
  echo -e "${BLUE}Recherche des instances pour l'agent: ${agent_name}${NC}" | tee -a "$LOG_FILE"
  
  # Trouver les dossiers
  local kebab_dirs=$(find . -type d -path "*${agent_name}*" | grep -v "node_modules" | sort)
  local pascal_dirs=$(find . -type d -path "*${pascal_name}*" | grep -v "node_modules" | sort)
  
  echo -e "${GREEN}Instances kebab-case trouvées:${NC}" | tee -a "$LOG_FILE"
  echo "$kebab_dirs" | tee -a "$LOG_FILE"
  
  echo -e "${GREEN}Instances PascalCase trouvées:${NC}" | tee -a "$LOG_FILE"
  echo "$pascal_dirs" | tee -a "$LOG_FILE"
  
  # Retourner tous les chemins
  echo -e "$kebab_dirs\n$pascal_dirs" | grep -v "^$"
}

# Fonction pour sélectionner le dossier principal (target)
select_target_directory() {
  local agent_name="$1"
  local directories="$2"
  
  # Chercher d'abord dans le chemin principal
  local main_dir=$(echo "$directories" | grep "$MAIN_PATH" | grep -E "/$agent_name$" | head -1)
  
  # Si trouvé dans le chemin principal, l'utiliser
  if [ -n "$main_dir" ]; then
    echo "$main_dir"
    return
  fi
  
  # Sinon, chercher d'autres dossiers kebab-case
  local kebab_dir=$(echo "$directories" | grep -E "/$agent_name$" | head -1)
  
  if [ -n "$kebab_dir" ]; then
    echo "$kebab_dir"
    return
  fi
  
  # En dernier recours, prendre le premier dossier de la liste
  echo "$directories" | head -1
}

# Fonction pour fusionner les fichiers
merge_files() {
  local source="$1"
  local target="$2"
  
  # Si les répertoires sont identiques, ignorer
  if [ "$source" = "$target" ]; then
    return
  fi
  
  echo -e "${YELLOW}Fusion de ${source} vers ${target}${NC}" | tee -a "$LOG_FILE"
  
  # Vérifier que les deux dossiers existent
  if [ ! -d "$source" ]; then
    echo -e "${RED}Erreur: Le dossier source n'existe pas: ${source}${NC}" | tee -a "$LOG_FILE"
    return
  fi
  
  if [ ! -d "$target" ]; then
    echo -e "${RED}Erreur: Le dossier cible n'existe pas: ${target}${NC}" | tee -a "$LOG_FILE"
    return
  fi
  
  # Créer un backup du dossier source
  local backup="${source}_backup_$(date +%Y%m%d%H%M%S)"
  cp -r "$source" "$backup"
  echo -e "${BLUE}Backup créé: ${backup}${NC}" | tee -a "$LOG_FILE"
  
  # Statistiques
  local copied=0
  local merged=0
  local skipped=0
  
  # Parcourir tous les fichiers du dossier source
  find "$source" -type f | while read -r file; do
    local rel_path="${file#$source/}"
    local target_file="${target}/${rel_path}"
    local target_dir=$(dirname "$target_file")
    
    # Créer le dossier cible si nécessaire
    if [ ! -d "$target_dir" ]; then
      mkdir -p "$target_dir"
    fi
    
    # Vérifier si le fichier existe déjà dans la cible
    if [ -f "$target_file" ]; then
      # Comparer les fichiers
      if diff -q "$file" "$target_file" >/dev/null; then
        echo -e "${GREEN}Identique: ${rel_path} (ignoré)${NC}" | tee -a "$LOG_FILE"
        skipped=$((skipped+1))
      else
        # Créer un fichier de fusion
        local merged_file="${target_file}.merged"
        echo "// FUSION AUTOMATIQUE - $(date)" > "$merged_file"
        echo "// Source 1: $target_file" >> "$merged_file"
        echo "// Source 2: $file" >> "$merged_file"
        echo "" >> "$merged_file"
        echo "// CONTENU DE $target_file:" >> "$merged_file"
        echo "// ----------------------" >> "$merged_file"
        cat "$target_file" >> "$merged_file"
        echo "" >> "$merged_file"
        echo "// CONTENU DE $file:" >> "$merged_file"
        echo "// ----------------------" >> "$merged_file"
        cat "$file" >> "$merged_file"
        
        echo -e "${YELLOW}Fusion créée: ${merged_file}${NC}" | tee -a "$LOG_FILE"
        merged=$((merged+1))
      fi
    else
      # Copier directement le fichier
      cp "$file" "$target_file"
      echo -e "${GREEN}Copié: ${rel_path}${NC}" | tee -a "$LOG_FILE"
      copied=$((copied+1))
    fi
  done
  
  echo -e "${BLUE}Résumé de la fusion:${NC}" | tee -a "$LOG_FILE"
  echo -e "  ${GREEN}Fichiers copiés: ${copied}${NC}" | tee -a "$LOG_FILE"
  echo -e "  ${YELLOW}Fichiers à fusionner manuellement: ${merged}${NC}" | tee -a "$LOG_FILE"
  echo -e "  ${BLUE}Fichiers ignorés: ${skipped}${NC}" | tee -a "$LOG_FILE"
}

# Fonction pour mettre à jour les références dans le code
update_references() {
  local old_path="$1"
  local new_path="$2"
  
  echo -e "${BLUE}Mise à jour des références: ${old_path} -> ${new_path}${NC}" | tee -a "$LOG_FILE"
  
  local old_name=$(basename "$old_path")
  local new_name=$(basename "$new_path")
  
  # Mettre à jour les importations dans les fichiers TypeScript et JavaScript
  find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | while read -r file; do
    # Compter les occurrences avant remplacement
    local count=$(grep -c "$old_name" "$file")
    
    if [ "$count" -gt 0 ]; then
      # Faire une copie de sauvegarde
      cp "$file" "${file}.bak"
      
      # Remplacer les importations
      sed -i "s|from ['\"]\\(.*\\)$old_name\\(['\"]\\)|from \\1$new_name\\2|g" "$file"
      sed -i "s|import ['\"]\\(.*\\)$old_name\\(['\"]\\)|import \\1$new_name\\2|g" "$file"
      sed -i "s|require(['\"]\\(.*\\)$old_name\\(['\"]\\))|require(\\1$new_name\\2)|g" "$file"
      
      # Vérifier si des modifications ont été faites
      if diff -q "$file" "${file}.bak" >/dev/null; then
        # Pas de changement, supprimer la sauvegarde
        rm "${file}.bak"
      else
        echo -e "${GREEN}Importations mises à jour dans: ${file}${NC}" | tee -a "$LOG_FILE"
      fi
    fi
  done
}

# Traiter chaque agent prioritaire
for agent in "${PRIORITY_AGENTS[@]}"; do
  echo -e "\n${BLUE}=== Traitement de l'agent: ${agent} ===${NC}" | tee -a "$LOG_FILE"
  
  # Trouver toutes les instances de l'agent
  instances=$(find_agent_instances "$agent")
  
  # Si aucune instance trouvée, passer à l'agent suivant
  if [ -z "$instances" ]; then
    echo -e "${YELLOW}Aucune instance trouvée pour l'agent: ${agent}${NC}" | tee -a "$LOG_FILE"
    continue
  fi
  
  # Sélectionner le dossier cible
  target=$(select_target_directory "$agent" "$instances")
  echo -e "${GREEN}Dossier cible sélectionné: ${target}${NC}" | tee -a "$LOG_FILE"
  
  # Fusionner toutes les autres instances vers la cible
  echo "$instances" | while read -r source; do
    if [ "$source" != "$target" ]; then
      merge_files "$source" "$target"
      update_references "$source" "$target"
    fi
  done
  
  echo -e "${GREEN}Consolidation de l'agent ${agent} terminée${NC}" | tee -a "$LOG_FILE"
done

echo -e "\n${GREEN}=== Consolidation des agents prioritaires terminée ===${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Vérifiez les fichiers .merged pour résoudre les conflits manuellement${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Les dossiers sources ont été sauvegardés avec le suffixe _backup_TIMESTAMP${NC}" | tee -a "$LOG_FILE"