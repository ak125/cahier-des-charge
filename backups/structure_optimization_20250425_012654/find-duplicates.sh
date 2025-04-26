#!/bin/bash
echo "Recherche de fichiers potentiellement dupliqués..."

# Créer le dossier pour les résultats
mkdir -p ./logs/analysis

# Fonction pour calculer le hash MD5 d'un fichier
calculate_md5() {
  md5sum "$1" | awk '{ print $1 }'
}

# Rechercher tous les fichiers .ts, .js, .json mais ignorer node_modules et dist
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) | grep -v "node_modules" | grep -v "dist" | grep -v "logs/analysis" > ./logs/analysis/all_files.txt

# Initialiser le fichier de résultats
echo "fichier1,fichier2,hash" > ./logs/analysis/duplicate_files.csv

# Créer un tableau associatif de MD5 -> fichiers
declare -A md5_files

while IFS= read -r file; do
  if [ -f "$file" ]; then
    md5=$(calculate_md5 "$file")
    
    # Si ce md5 existe déjà, nous avons trouvé un doublon
    if [[ ${md5_files[$md5]} ]]; then
      echo "${md5_files[$md5]},$file,$md5" >> ./logs/analysis/duplicate_files.csv
    else
      # Sinon, ajouter ce fichier à notre liste
      md5_files[$md5]="$file"
    fi
  fi
done < ./logs/analysis/all_files.txt

echo "Recherche de fichiers avec des noms similaires mais dans des dossiers différents..."
find . -type f -name "*.ts" | sed 's/.*\///' | sort | uniq -d > ./logs/analysis/duplicate_names.txt

echo "Analyse de duplications terminée. Résultats dans ./logs/analysis/duplicate_files.csv et ./logs/analysis/duplicate_names.txt"

# Afficher un aperçu des résultats
echo "Aperçu des fichiers dupliqués (basé sur le contenu) :"
tail -n 10 ./logs/analysis/duplicate_files.csv

echo "Aperçu des noms de fichiers dupliqués (dans différents dossiers) :"
cat ./logs/analysis/duplicate_names.txt | head -10

# find-duplicates.sh
# Ce script recherche les dossiers dupliqués (kebab-case vs PascalCase) dans le projet

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dossier principal à analyser
MAIN_DIR="./packages/mcp-agents"

# Fichier pour enregistrer les duplications détectées
DUPLICATES_FILE="./duplicated-folders.txt"
> $DUPLICATES_FILE  # Vider ou créer le fichier

echo -e "${GREEN}Recherche des dossiers dupliqués dans $MAIN_DIR...${NC}"

# Fonction pour convertir en minuscules
to_lower() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Fonction pour normaliser un nom (enlever les tirets, underscores, points et convertir en minuscules)
normalize_name() {
    echo "$1" | tr -d '-_.' | tr '[:upper:]' '[:lower:]'
}

# Trouver tous les dossiers
echo -e "${BLUE}Collecte de tous les dossiers...${NC}"
find $MAIN_DIR -type d | sort > /tmp/all_dirs.txt

# Créer un tableau associatif pour les dossiers normalisés
declare -A normalized_dirs

# Parcourir tous les dossiers et détecter les duplications
echo -e "${BLUE}Analyse des duplications...${NC}"
while read dir; do
    basename=$(basename "$dir")
    normalized=$(normalize_name "$basename")
    
    if [ -n "${normalized_dirs[$normalized]}" ]; then
        # Duplication trouvée
        existing_dir="${normalized_dirs[$normalized]}"
        existing_basename=$(basename "$existing_dir}")
        
        # Vérifier si c'est bien un cas de kebab-case vs PascalCase
        if [ "$basename" != "$existing_basename" ]; then
            parent_dir=$(dirname "$dir")
            existing_parent=$(dirname "$existing_dir")
            
            # Vérifier si les dossiers sont dans le même dossier parent
            if [ "$parent_dir" = "$existing_parent" ]; then
                echo -e "${YELLOW}Duplication trouvée (même parent):${NC}" | tee -a $DUPLICATES_FILE
                echo -e "  ${BLUE}Dossier 1:${NC} $existing_dir" | tee -a $DUPLICATES_FILE
                echo -e "  ${BLUE}Dossier 2:${NC} $dir" | tee -a $DUPLICATES_FILE
                echo "" | tee -a $DUPLICATES_FILE
            else
                # Même nom mais dossiers parents différents
                echo -e "${YELLOW}Duplication potentielle (parents différents):${NC}" | tee -a $DUPLICATES_FILE
                echo -e "  ${BLUE}Dossier 1:${NC} $existing_dir" | tee -a $DUPLICATES_FILE
                echo -e "  ${BLUE}Dossier 2:${NC} $dir" | tee -a $DUPLICATES_FILE
                echo "" | tee -a $DUPLICATES_FILE
            fi
        fi
    else
        # Ajouter au tableau associatif
        normalized_dirs[$normalized]=$dir
    fi
done < /tmp/all_dirs.txt

# Détection complète
echo -e "${GREEN}Détection des duplications terminée!${NC}"
echo -e "${BLUE}Les résultats ont été enregistrés dans ${DUPLICATES_FILE}${NC}"
echo -e "${YELLOW}Nombre total de duplications trouvées: $(grep -c "Duplication trouvée" $DUPLICATES_FILE)${NC}"
echo -e "${YELLOW}Nombre de duplications potentielles (parents différents): $(grep -c "Duplication potentielle" $DUPLICATES_FILE)${NC}"
