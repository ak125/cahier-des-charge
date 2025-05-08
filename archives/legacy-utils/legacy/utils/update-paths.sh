#!/bin/bash

# Utilitaire pour mettre à jour les chemins de façon cohérente dans tous les fichiers
# Utilisation: ./scripts/utils/update-paths.sh [--dry-run]

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier le mode dry run
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}[Mode simulation] Aucune modification ne sera effectuée${NC}"
fi

echo -e "${BLUE}🔄 Mise à jour des chemins dans les fichiers du projet...${NC}"

# Mappages des chemins à remplacer
declare -A PATH_MAPPINGS=(
  ["./cahier/"]="./cahier-des-charges/"
  ["../cahier/"]="../cahier-des-charges/"
  ["\"cahier/"]="\"cahier-des-charges/"
  ["'cahier/"]="'cahier-des-charges/"
  ["/cahier/"]="/cahier-des-charges/"
  ["import.*from.*cahier/"]="import from cahier-des-charges/"
  ["require.*cahier/"]="require cahier-des-charges/"
)

# Fonction pour mettre à jour un fichier
update_file() {
  local file="$1"
  local original_content
  local new_content
  local changes=0
  
  # Lire le contenu du fichier
  original_content=$(cat "$file")
  new_content="$original_content"
  
  # Appliquer les remplacements
  for old_path in "${!PATH_MAPPINGS[@]}"; do
    local new_path="${PATH_MAPPINGS[$old_path]}"
    
    # Pour les cas spéciaux avec import/require, utiliser des expressions régulières
    if [[ "$old_path" == *"import"* || "$old_path" == *"require"* ]]; then
      # Extraire le motif réel
      local pattern="${old_path/import.*from.*cahier\//import.*from.*cahier\/}"
      pattern="${pattern/require.*cahier\//require.*cahier\/}"
      
      # Obtenir la chaîne de remplacement
      local replacement="${new_path/import from cahier-des-charges\//from 'cahier-des-charges\/}"
      replacement="${replacement/require cahier-des-charges\//require('cahier-des-charges\/}"
      
      # Appliquer avec sed (différent selon l'OS)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        new_content=$(echo "$new_content" | sed -E "s|$pattern|$replacement|g")
      else
        # Linux
        new_content=$(echo "$new_content" | sed -r "s|$pattern|$replacement|g")
      fi
    else
      # Remplacement simple
      new_content="${new_content//$old_path/$new_path}"
    fi
    
    # Compter les remplacements
    if [ "$original_content" != "$new_content" ]; then
      changes=1
    fi
  done
  
  # Écrire le nouveau contenu si nécessaire
  if [ "$changes" -eq 1 ]; then
    if [ "$DRY_RUN" = false ]; then
      echo "$new_content" > "$file"
      echo -e "${GREEN}✅ Mis à jour: $file${NC}"
    else
      echo -e "${YELLOW}[Simulation] Mise à jour: $file${NC}"
    fi
    return 0
  else
    echo -e "${BLUE}ℹ️ Aucun changement: $file${NC}"
    return 1
  fi
}

# Types de fichiers à traiter
FILE_TYPES=("*.md" "*.json" "*.ts" "*.js" "*.sh")

# Compteurs
updated_count=0
examined_count=0

# Parcourir tous les fichiers et appliquer les mises à jour
for type in "${FILE_TYPES[@]}"; do
  for file in $(find . -name "$type" -type f -not -path "./node_modules/*" -not -path "./backup-*/*"); do
    examined_count=$((examined_count+1))
    if update_file "$file"; then
      updated_count=$((updated_count+1))
    fi
  done
done

# Rapport final
echo -e "\n${BLUE}📊 Résumé des mises à jour${NC}"
echo -e "Fichiers examinés: $examined_count"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Fichiers qui seraient mis à jour: $updated_count${NC}"
else
  echo -e "${GREEN}Fichiers mis à jour: $updated_count${NC}"
fi

# Rendre ce script exécutable
chmod +x /workspaces/cahier-des-charge/scripts/utils/update-paths.sh
