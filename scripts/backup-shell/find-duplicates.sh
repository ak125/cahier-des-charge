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
