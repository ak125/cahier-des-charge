#!/bin/bash

# Script pour renommer les fichiers sans numéro de section
# dans le cahier des charges

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire du cahier des charges
CDC_DIR="/workspaces/cahier-des-charge/cahier-des-charges"

# Fichiers à renommer
declare -A files_to_rename
files_to_rename["interdependances.md"]="36-interdependances.md"
files_to_rename["changelog.md"]="38-changelog.md"
files_to_rename[".content_suggestions.md"]="09-content-suggestions.md"

# Renommer les fichiers
for file in "${!files_to_rename[@]}"; do
  src_path="${CDC_DIR}/${file}"
  dest_path="${CDC_DIR}/${files_to_rename[$file]}"
  
  if [ -f "$src_path" ]; then
    echo -e "${BLUE}Renommage:${NC} $src_path -> $dest_path"
    mv "$src_path" "$dest_path"
    echo -e "${GREEN}✓ Fichier renommé avec succès${NC}"
  else
    echo -e "${YELLOW}⚠️ Fichier non trouvé:${NC} $src_path"
  fi
done

echo -e "${GREEN}✓ Opération terminée${NC}"
