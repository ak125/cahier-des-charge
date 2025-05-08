#!/bin/bash

# Script pour renommer les répertoires en kebab-case
# Créé le 1er mai 2025

# Définition des couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Début du renommage des répertoires en kebab-case ===${NC}"

# Fonction pour convertir un nom en kebab-case
to_kebab_case() {
    # Convertit les majuscules en minuscules, remplace les espaces par des tirets
    # et supprime les caractères spéciaux
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed -e 's/ /-/g' -e 's/[^a-z0-9\-\/]//g' -e 's/-\+/-/g'
}

# Fonction pour renommer un répertoire de manière sécurisée
safe_rename() {
    local source="$1"
    local target="$2"
    
    # Si la source et la cible sont identiques, ne rien faire
    if [ "$source" = "$target" ]; then
        return 0
    fi
    
    # Si la cible existe déjà, fusionner le contenu
    if [ -d "$target" ]; then
        echo -e "${BLUE}ℹ️ Fusion du contenu de '$source' vers '$target'${NC}"
        # Copie récursive avec préservation des attributs
        cp -r "$source"/* "$target"/ 2>/dev/null || true
        rm -rf "$source"
        echo -e "${GREEN}✅ Contenu fusionné et répertoire source supprimé${NC}"
    else
        # Si le parent de la cible n'existe pas, le créer
        mkdir -p "$(dirname "$target")"
        
        # Renommer directement si possible
        if mv "$source" "$target" 2>/dev/null; then
            echo -e "${GREEN}✅ Renommé: '$source' -> '$target'${NC}"
        else
            # Si le renommage direct échoue, copier puis supprimer
            echo -e "${BLUE}ℹ️ Copie récursive de '$source' vers '$target'${NC}"
            mkdir -p "$target"
            cp -r "$source"/* "$target"/ 2>/dev/null || true
            rm -rf "$source"
            echo -e "${GREEN}✅ Copié et supprimé: '$source' -> '$target'${NC}"
        fi
    fi
}

# Compter les répertoires à renommer
echo "Recherche des répertoires à renommer..."

# Créer une liste temporaire des répertoires à traiter
find /workspaces/cahier-des-charge -type d -name "*[A-Z]*" -o -name "* *" > /tmp/dirs_to_rename.txt

# Compter les répertoires
DIR_COUNT=$(wc -l < /tmp/dirs_to_rename.txt)

if [ $DIR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun répertoire à renommer. La structure est déjà en kebab-case.${NC}"
    echo -e "${YELLOW}=== Fin du renommage des répertoires ===${NC}"
    rm /tmp/dirs_to_rename.txt
    exit 0
fi

echo -e "Nombre de répertoires à renommer: ${BLUE}$DIR_COUNT${NC}"

# Trier la liste pour traiter d'abord les répertoires les plus profonds
# Cela évite de renommer un répertoire parent avant ses enfants
sort -r /tmp/dirs_to_rename.txt -o /tmp/dirs_to_rename.txt

# Traiter chaque répertoire
while read dir; do
    # Obtenir le nom du répertoire sans le chemin
    dir_name=$(basename "$dir")
    # Convertir en kebab-case
    kebab_name=$(to_kebab_case "$dir_name")
    
    # Si le nom est différent, renommer
    if [ "$dir_name" != "$kebab_name" ]; then
        # Construire le nouveau chemin complet
        new_dir="$(dirname "$dir")/$kebab_name"
        echo -e "${YELLOW}Renommage:${NC} $dir → $new_dir"
        
        # Renommer de manière sécurisée
        safe_rename "$dir" "$new_dir"
    fi
done < /tmp/dirs_to_rename.txt

# Supprimer le fichier temporaire
rm /tmp/dirs_to_rename.txt

echo -e "${GREEN}✅ Renommage des répertoires terminé.${NC}"
echo -e "${YELLOW}=== Fin du renommage des répertoires en kebab-case ===${NC}"