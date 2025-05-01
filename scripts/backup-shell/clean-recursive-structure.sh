#!/bin/bash

# Script pour nettoyer la structure récursive du projet
# 
# Ce script :
# 1. Élimine les structures récursives (dossiers contenant des sous-dossiers de même nom)
# 2. Aplatit la hiérarchie lorsque c'est possible pour réduire la profondeur
# 3. Normalise la casse des dossiers en kebab-case
# 4. Assure l'unicité des noms de packages

echo "=== Nettoyage de la structure du projet ==="

# Définir les chemins et variables
BASE_DIR="packages/mcp-agents"
BACKUP_DIR="structure-backups/$(date +%Y-%m-%d-%H-%M-%S)"

# Créer un répertoire de sauvegarde
mkdir -p "${BACKUP_DIR}"
echo "📁 Backup créé dans ${BACKUP_DIR}"

# Fonction pour convertir PascalCase en kebab-case
to_kebab_case() {
  echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# 1. Traitement des structures récursives connues
echo -e "\n1. Élimination des structures récursives connues..."

# Liste des motifs récursifs connus à traiter
RECURSIVE_PATTERNS=(
  "packages/mcp-agents/analyzers/QaAnalyzer/qa-analyzer/QaAnalyzer"
  "packages/mcp-agents/generators/CaddyfileGenerator/caddyfile-generator/CaddyfileGenerator"
)

for pattern in "${RECURSIVE_PATTERNS[@]}"; do
  if [ -d "$pattern" ]; then
    echo "  🔄 Structure récursive détectée : $pattern"
    # Créer un backup
    cp -r "$pattern" "${BACKUP_DIR}/$(basename "$pattern")_backup"
    
    # Voir si le contenu peut être fusionné avec le parent
    parent_dir=$(dirname "$pattern")
    echo "  ⬆️ Fusion du contenu avec $parent_dir"
    
    # Déplacer les fichiers (mais pas les dossiers) vers le parent
    find "$pattern" -maxdepth 1 -type f | while read file; do
      cp "$file" "$parent_dir/"
      echo "    📄 Déplacé : $(basename "$file")"
    done
    
    # Supprimer la structure récursive
    rm -rf "$pattern"
    echo "  ✅ Structure récursive supprimée"
  fi
done

# 2. Normalisation de la casse des dossiers (PascalCase -> kebab-case)
echo -e "\n2. Normalisation de la casse des dossiers..."

# Trouver tous les dossiers en PascalCase
find "$BASE_DIR" -type d | grep -E '[A-Z]' | sort -r | while read dir; do
  base_name=$(basename "$dir")
  
  # Si le nom est en PascalCase
  if [[ "$base_name" =~ [A-Z] ]]; then
    kebab_name=$(to_kebab_case "$base_name")
    parent_dir=$(dirname "$dir")
    new_dir="${parent_dir}/${kebab_name}"
    
    # Vérifier si un dossier en kebab-case équivalent existe déjà
    if [ -d "$new_dir" ] && [ "$dir" != "$new_dir" ]; then
      echo "  🔄 Fusion de '$dir' avec '$new_dir'"
      
      # Backup avant fusion
      cp -r "$dir" "${BACKUP_DIR}/$(echo "$dir" | tr '/' '_')_backup"
      
      # Déplacer tout le contenu vers le dossier kebab-case
      find "$dir" -maxdepth 1 -mindepth 1 | while read item; do
        target="${new_dir}/$(basename "$item")"
        
        # Si la cible existe déjà, créer un suffixe unique
        if [ -e "$target" ]; then
          if [ -d "$item" ]; then
            # Pour les dossiers, fusionner récursivement
            cp -r "$item"/* "$target"/ 2>/dev/null || true
          else
            # Pour les fichiers, ajouter un suffixe
            cp "$item" "${target}.from-pascal" 2>/dev/null || true
          fi
        else
          # Si la cible n'existe pas, déplacer simplement
          cp -r "$item" "$target" 2>/dev/null || true
        fi
      done
      
      # Supprimer le dossier original
      rm -rf "$dir"
      echo "    ✅ Fusion terminée et dossier PascalCase supprimé"
    elif [ "$dir" != "$new_dir" ]; then
      echo "  🔄 Renommage : $dir -> $new_dir"
      
      # Backup avant renommage
      cp -r "$dir" "${BACKUP_DIR}/$(echo "$dir" | tr '/' '_')_backup"
      
      # Créer le nouveau dossier et copier le contenu
      mkdir -p "$new_dir"
      cp -r "$dir"/* "$new_dir"/ 2>/dev/null || true
      
      # Supprimer l'ancien dossier
      rm -rf "$dir"
      echo "    ✅ Renommage terminé"
    fi
  fi
done

# 3. Suppression des dossiers vides pour aplatir la hiérarchie
echo -e "\n3. Suppression des dossiers vides..."
find "$BASE_DIR" -type d -empty -delete -print | while read dir; do
  echo "  🗑️ Dossier vide supprimé : $dir"
done

# 4. Mise à jour des références dans les package.json
echo -e "\n4. Mise à jour des références dans les package.json..."
find "$BASE_DIR" -name "package.json" | while read pkg_file; do
  # Extraire le nom actuel du package
  current_name=$(grep -o '"name": *"[^"]*"' "$pkg_file" | cut -d'"' -f4)
  
  # Déterminer un nom de package basé sur le chemin
  rel_path=$(echo "$pkg_file" | sed "s|$BASE_DIR/||" | sed 's|/package.json$||')
  dir_name=$(basename "$(dirname "$pkg_file")")
  parent_dir=$(basename "$(dirname "$(dirname "$pkg_file")")")
  
  if [[ "$parent_dir" =~ analyzers|generators|validators|orchestrators ]]; then
    type_prefix="${parent_dir%s}"  # Enlever le 's' final
    suggested_name="@mcp/${dir_name}-${type_prefix}"
  else
    suggested_name="@mcp/${dir_name}"
  fi
  
  # Ne pas modifier si le nom est déjà correct
  if [ "$current_name" != "$suggested_name" ]; then
    echo "  📦 Mise à jour du package.json dans $pkg_file"
    echo "    $current_name -> $suggested_name"
    
    # Backup avant modification
    cp "$pkg_file" "${BACKUP_DIR}/$(echo "$pkg_file" | tr '/' '_')_backup"
    
    # Mettre à jour le nom du package
    sed -i "s|\"name\": *\"$current_name\"|\"name\": \"$suggested_name\"|" "$pkg_file"
  fi
done

echo -e "\n=== Nettoyage terminé ==="
echo "📝 Un backup complet a été créé dans ${BACKUP_DIR}"
echo "⚠️  N'oubliez pas d'exécuter 'node fix-package-name-collisions.js' ensuite pour finaliser la résolution des collisions de noms"
