#!/bin/bash

# Script pour créer une archive des fichiers importants du cahier des charges
# Usage: bash export-files.sh [destination_directory]

# Couleurs pour meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Définir le répertoire de destination (par défaut: répertoire courant)
DEST_DIR="${1:-.}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="cahier_des_charges_export_${TIMESTAMP}.tar.gz"
MANIFEST_NAME="cahier_des_charges_manifest_${TIMESTAMP}.md"

echo -e "${BLUE}🔍 Début de l'exportation des fichiers du cahier des charges${NC}"

# Créer un répertoire temporaire pour l'exportation
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}📁 Création du répertoire temporaire: ${TEMP_DIR}${NC}"

# Répertoires importants à sauvegarder
DIRS_TO_SAVE=(
  "cahier-des-charges"
  "cahier"
  "agents"
  "scripts"
  "rules"
  "logs"
)

# Fichiers individuels importants à la racine
FILES_TO_SAVE=(
  "manage-cahier.sh"
  "cahier_check.config.json"
  "README.md"
)

# Fonction pour copier des fichiers/répertoires s'ils existent
copy_if_exists() {
  local source="$1"
  local dest="$2"
  
  if [ -e "$source" ]; then
    mkdir -p "$(dirname "$dest")"
    cp -r "$source" "$dest"
    echo -e "${GREEN}✅ Copié: $source${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️ Non trouvé: $source${NC}"
    return 1
  fi
}

# Copier les répertoires importants
for dir in "${DIRS_TO_SAVE[@]}"; do
  copy_if_exists "/workspaces/cahier-des-charge/$dir" "$TEMP_DIR/$dir"
done

# Copier les fichiers individuels
for file in "${FILES_TO_SAVE[@]}"; do
  copy_if_exists "/workspaces/cahier-des-charge/$file" "$TEMP_DIR/$file"
done

# Générer un manifest avec la liste des fichiers et leur description
echo "# Cahier des Charges - Manifest d'exportation" > "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "Date d'exportation: $(date)" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "## Fichiers principaux" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"

# Ajouter les agents IA
echo "### Agents IA" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"
if [ -d "/workspaces/cahier-des-charge/agents" ]; then
  for agent in /workspaces/cahier-des-charge/agents/*.ts; do
    if [ -f "$agent" ]; then
      echo "- `$(basename "$agent")`: Agent d'analyse de $(basename "$agent" | sed 's/agent-//;s/\.ts//')" >> "$TEMP_DIR/$MANIFEST_NAME"
    fi
  done
fi
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"

# Ajouter les scripts
echo "### Scripts" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"
if [ -d "/workspaces/cahier-des-charge/scripts" ]; then
  for script in /workspaces/cahier-des-charge/scripts/*.sh; do
    if [ -f "$script" ]; then
      echo "- `$(basename "$script")`: $(head -n 3 "$script" | grep -m 1 "#" | sed 's/# //')" >> "$TEMP_DIR/$MANIFEST_NAME"
    fi
  done
fi
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"

# Ajouter les fichiers du cahier des charges
echo "### Documents du cahier des charges" >> "$TEMP_DIR/$MANIFEST_NAME"
echo "" >> "$TEMP_DIR/$MANIFEST_NAME"
for dir in "cahier-des-charges" "cahier"; do
  if [ -d "/workspaces/cahier-des-charge/$dir" ]; then
    for doc in /workspaces/cahier-des-charge/$dir/*.md; do
      if [ -f "$doc" ]; then
        echo "- `$(basename "$doc")`: $(head -n 1 "$doc" | sed 's/# //')" >> "$TEMP_DIR/$MANIFEST_NAME"
      fi
    done
  fi
done

# Créer l'archive
cd "$TEMP_DIR"
tar -czf "$DEST_DIR/$ARCHIVE_NAME" .
echo -e "${GREEN}✅ Archive créée: $DEST_DIR/$ARCHIVE_NAME${NC}"

# Copier le manifest séparément aussi
cp "$TEMP_DIR/$MANIFEST_NAME" "$DEST_DIR/$MANIFEST_NAME"
echo -e "${GREEN}✅ Manifest créé: $DEST_DIR/$MANIFEST_NAME${NC}"

# Nettoyage
rm -rf "$TEMP_DIR"

# Instructions pour l'utilisateur
echo -e "\n${BLUE}🚀 Exportation terminée avec succès!${NC}"
echo -e "Archive: ${GREEN}$DEST_DIR/$ARCHIVE_NAME${NC}"
echo -e "Manifest: ${GREEN}$DEST_DIR/$MANIFEST_NAME${NC}"
echo -e "\nPour extraire l'archive plus tard:"
echo -e "${YELLOW}mkdir -p extract_dir${NC}"
echo -e "${YELLOW}tar -xzf $ARCHIVE_NAME -C extract_dir${NC}"
