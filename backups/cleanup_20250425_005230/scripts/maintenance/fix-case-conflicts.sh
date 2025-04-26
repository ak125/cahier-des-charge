#!/bin/bash

# Script pour résoudre les conflits de casse dans les noms de fichiers TypeScript
echo "Correction des conflits de casse dans les fichiers TypeScript..."

# Dossier de base
BASE_DIR="/workspaces/cahier-des-charge/packages/mcp-agents/business/misc"

# Fonction pour fusionner les dossiers qui ne diffèrent que par la casse
merge_folders() {
    local lowercase_dir="$1"
    local uppercase_dir="$2"
    local backup_dir="$BASE_DIR/case_conflicts_backup_$(date +%Y%m%d_%H%M%S)"
    
    echo "Fusion de $lowercase_dir vers $uppercase_dir"
    
    # Créer un répertoire de sauvegarde
    mkdir -p "$backup_dir"
    
    # Copier les fichiers du répertoire en minuscules dans le répertoire de sauvegarde
    cp -r "$lowercase_dir"/* "$backup_dir/"
    echo "Sauvegarde des fichiers de $lowercase_dir dans $backup_dir"
    
    # Déplacer les fichiers du répertoire en minuscules vers le répertoire en majuscules (si pas déjà présents)
    for file in "$lowercase_dir"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            if [ ! -f "$uppercase_dir/$filename" ]; then
                cp "$file" "$uppercase_dir/"
                echo "Copié $filename vers $uppercase_dir"
            else
                echo "Le fichier $filename existe déjà dans $uppercase_dir, ignoré"
            fi
        fi
    done
    
    # Supprimer le répertoire en minuscules
    rm -rf "$lowercase_dir"
    echo "Supprimé le répertoire $lowercase_dir"
    
    # Créer un lien symbolique du répertoire en majuscules vers le nom en minuscules
    ln -s "$uppercase_dir" "$lowercase_dir"
    echo "Créé un lien symbolique de $uppercase_dir vers $lowercase_dir"
}

# Fusionner BusinessAgent
if [ -d "$BASE_DIR/businessagent" ] && [ -d "$BASE_DIR/BusinessAgent" ]; then
    merge_folders "$BASE_DIR/businessagent" "$BASE_DIR/BusinessAgent"
fi

# Fusionner QualityAgent
if [ -d "$BASE_DIR/qualityagent" ] && [ -d "$BASE_DIR/QualityAgent" ]; then
    merge_folders "$BASE_DIR/qualityagent" "$BASE_DIR/QualityAgent"
fi

echo "Terminé. Les conflits de casse ont été résolus."
