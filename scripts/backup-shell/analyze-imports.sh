#!/bin/bash
echo "Analyse des imports entre fichiers..."
echo "Recherche de tous les fichiers .ts et .js..."

# Créer le dossier pour les résultats
mkdir -p ./logs/analysis

# Trouver tous les fichiers TS et JS
find . -type f -name "*.ts" -o -name "*.js" | grep -v "node_modules" | grep -v "dist" > ./logs/analysis/all_ts_js_files.txt

# Analyser les imports
echo "Analyse des imports..."
echo "fichier_source,import_path" > ./logs/analysis/imports.csv

while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Extraire les lignes avec import
    grep -E "^import .+ from ['\"]" "$file" | sed -E "s/^import .+ from ['\"](.+)['\"];*/\1/" | while read -r import; do
      echo "$file,$import" >> ./logs/analysis/imports.csv
    done
    # Extraire les requires
    grep -E "require\(['\"]" "$file" | sed -E "s/.*require\(['\"](.+)['\"]\).*/\1/" | while read -r import; do
      echo "$file,$import" >> ./logs/analysis/imports.csv
    done
  fi
done < ./logs/analysis/all_ts_js_files.txt

echo "Analyse des imports terminée. Résultats dans ./logs/analysis/imports.csv"
