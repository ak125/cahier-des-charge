#!/bin/bash

# Script pour standardiser les conventions de nommage dans le projet
# Utilise kebab-case pour les noms de fichiers et dossiers

echo "Standardisation des noms de fichiers et dossiers dans packages/mcp-agents..."

# Fonction pour convertir PascalCase et camelCase en kebab-case
function to_kebab_case() {
    echo "$1" | sed -r 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# Parcourir les fichiers et dossiers pour standardiser les noms
find ./packages/mcp-agents -type d -name "*[A-Z]*" | sort -r | while read dir; do
    kebab_name=$(to_kebab_case "$(basename "$dir")")
    parent_dir=$(dirname "$dir")
    new_dir="$parent_dir/$kebab_name"
    
    # Vérifier si un dossier avec le même nom en kebab-case existe déjà
    if [ "$dir" != "$new_dir" ] && [ ! -e "$new_dir" ]; then
        echo "Renommage du dossier: $dir -> $new_dir"
        mv "$dir" "$new_dir"
    elif [ "$dir" != "$new_dir" ] && [ -e "$new_dir" ]; then
        echo "ATTENTION: Le dossier $new_dir existe déjà, fusion nécessaire avec $dir"
    fi
done

# Standardiser les noms de fichiers mais pas les extensions
find ./packages/mcp-agents -type f -name "*[A-Z]*.ts" | sort | while read file; do
    dir=$(dirname "$file")
    filename=$(basename "$file" .ts)
    kebab_filename=$(to_kebab_case "$filename")
    new_file="$dir/$kebab_filename.ts"
    
    # Vérifier si un fichier avec le même nom en kebab-case existe déjà
    if [ "$file" != "$new_file" ] && [ ! -e "$new_file" ]; then
        echo "Renommage du fichier: $file -> $new_file"
        mv "$file" "$new_file"
    elif [ "$file" != "$new_file" ] && [ -e "$new_file" ]; then
        echo "ATTENTION: Le fichier $new_file existe déjà, fusion nécessaire avec $file"
    fi
done

echo "Standardisation terminée dans packages/mcp-agents."