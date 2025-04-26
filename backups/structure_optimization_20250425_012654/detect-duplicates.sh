#!/bin/bash

# Script simplifié pour détecter les dossiers dupliqués (kebab-case vs PascalCase)
echo "Détection des dossiers dupliqués..."

MAIN_DIR="./packages/mcp-agents"
OUTPUT_FILE="./duplicated-folders.txt"

# Vider ou créer le fichier de sortie
> $OUTPUT_FILE

# Fonction pour normaliser un nom (enlever les tirets et convertir en minuscules)
function normalize() {
    echo "$1" | tr -d '-' | tr '[:upper:]' '[:lower:]'
}

echo "Analyse des dossiers dans $MAIN_DIR..."

# Chercher les dossiers qui pourraient être dupliqués
find $MAIN_DIR -type d | while read dir1; do
    basename1=$(basename "$dir1")
    normalized1=$(normalize "$basename1")
    
    # Éviter les dossiers très courts (comme "src", "lib", etc.)
    if [ ${#normalized1} -lt 4 ]; then
        continue
    fi
    
    find $MAIN_DIR -type d | while read dir2; do
        # Ne pas comparer un dossier avec lui-même
        if [ "$dir1" = "$dir2" ]; then
            continue
        fi
        
        basename2=$(basename "$dir2")
        normalized2=$(normalize "$basename2")
        
        # Si les noms normalisés correspondent mais les noms originaux sont différents
        if [ "$normalized1" = "$normalized2" ] && [ "$basename1" != "$basename2" ]; then
            parent1=$(dirname "$dir1")
            parent2=$(dirname "$dir2")
            
            echo "Duplication détectée:" >> $OUTPUT_FILE
            echo "  $dir1" >> $OUTPUT_FILE
            echo "  $dir2" >> $OUTPUT_FILE
            echo "" >> $OUTPUT_FILE
            
            # Afficher également dans la console
            echo "Duplication détectée:"
            echo "  $dir1"
            echo "  $dir2"
            echo ""
        fi
    done
done

echo "Analyse terminée. Résultats enregistrés dans $OUTPUT_FILE"
echo "Nombre de duplications détectées: $(grep -c "Duplication détectée" $OUTPUT_FILE)"