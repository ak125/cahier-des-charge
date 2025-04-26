#!/bin/bash

# Script d'analyse de similarité entre fichiers
# Remplace analyze-similarity.ts

set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Charger la configuration
CONFIG_FILE="cahier_check.config.json"
CAHIER_PATH="./cahier"
SIMILARITY_THRESHOLD=0.85

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}📂 Chargement de la configuration...${NC}"
    CAHIER_PATH=$(grep -o '"cahier"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    THRESHOLD_VALUE=$(grep -o '"maxDuplicateThreshold"[[:space:]]*:[[:space:]]*[0-9.]*' "$CONFIG_FILE" | grep -o '[0-9.]*$')
    
    if [ ! -z "$THRESHOLD_VALUE" ]; then
        SIMILARITY_THRESHOLD=$THRESHOLD_VALUE
    fi
fi

echo -e "${BLUE}🔍 Démarrage de l'analyse de similarité conceptuelle...${NC}"
echo -e "📂 Répertoire: $CAHIER_PATH"
echo -e "🎯 Seuil de similarité: $SIMILARITY_THRESHOLD"

# Vérifier si le répertoire existe
if [ ! -d "$CAHIER_PATH" ]; then
    echo -e "${RED}❌ Le répertoire $CAHIER_PATH n'existe pas.${NC}"
    exit 1
fi

# Trouver les fichiers Markdown
echo -e "${BLUE}📄 Recherche des fichiers Markdown...${NC}"
MD_FILES=$(find "$CAHIER_PATH" -type f -name "*.md")
MD_COUNT=$(echo "$MD_FILES" | grep -c "." || echo 0)
echo -e "${GREEN}✅ Trouvé $MD_COUNT fichiers Markdown${NC}"

# Trouver les fichiers JSON
echo -e "${BLUE}🔧 Recherche des fichiers JSON...${NC}"
JSON_FILES=$(find "$CAHIER_PATH" -type f -name "*.json")
JSON_COUNT=$(echo "$JSON_FILES" | grep -c "." || echo 0)
echo -e "${GREEN}✅ Trouvé $JSON_COUNT fichiers JSON${NC}"

# Fonction pour calculer une similarité simplifiée entre deux fichiers
calculate_similarity() {
    local file1="$1"
    local file2="$2"
    
    # Compter les lignes communes entre les deux fichiers
    common_lines=$(grep -Fxf "$file1" "$file2" | wc -l)
    
    # Compter le total des lignes uniques dans les deux fichiers
    total_lines=$(sort -u <(cat "$file1") <(cat "$file2") | wc -l)
    
    # Calculer le coefficient de Jaccard (lignes communes / total lignes uniques)
    if [ "$total_lines" -eq 0 ]; then
        echo "0"
    else
        awk "BEGIN {print $common_lines / $total_lines}"
    fi
}

# Analyser les similitudes entre fichiers Markdown
if [ "$MD_COUNT" -gt 1 ]; then
    echo -e "\n${BLUE}📊 Analyse des similitudes entre fichiers Markdown...${NC}"
    
    # Créer un fichier temporaire pour stocker les résultats
    TEMP_RESULTS=$(mktemp)
    
    # Comparer chaque paire de fichiers
    for file1 in $MD_FILES; do
        for file2 in $MD_FILES; do
            if [ "$file1" != "$file2" ]; then
                # Calculer la similarité
                similarity=$(calculate_similarity "$file1" "$file2")
                
                # Convertir en pourcentage
                percent=$(awk "BEGIN {print $similarity * 100}")
                
                # Si la similarité dépasse le seuil, l'enregistrer
                if (( $(echo "$similarity > $SIMILARITY_THRESHOLD" | bc -l) )); then
                    echo "$file1|$file2|$percent" >> "$TEMP_RESULTS"
                fi
            fi
        done
    done
    
    # Afficher les résultats
    if [ -s "$TEMP_RESULTS" ]; then
        echo -e "${YELLOW}⚠️ Fichiers Markdown similaires détectés:${NC}"
        while IFS="|" read -r file1 file2 percent; do
            echo -e "  ${YELLOW}→ $(basename "$file1") et $(basename "$file2"): ${percent%.*}% de similarité${NC}"
        done < "$TEMP_RESULTS"
        
        echo -e "\n${BLUE}💡 Suggestion: Utilisez deduplicate-files.sh pour fusionner ces fichiers similaires${NC}"
    else
        echo -e "${GREEN}✅ Aucune similarité significative détectée entre les fichiers Markdown${NC}"
    fi
    
    # Supprimer le fichier temporaire
    rm "$TEMP_RESULTS"
fi

# Analyser les similitudes entre fichiers JSON
if [ "$JSON_COUNT" -gt 1 ]; then
    echo -e "\n${BLUE}📊 Analyse des similitudes entre fichiers JSON...${NC}"
    
    # Créer un fichier temporaire pour stocker les résultats
    TEMP_RESULTS=$(mktemp)
    
    # Comparer chaque paire de fichiers
    for file1 in $JSON_FILES; do
        for file2 in $JSON_FILES; do
            if [ "$file1" != "$file2" ]; then
                # Pour JSON, normaliser avant comparaison (trier les objets)
                temp1=$(mktemp)
                temp2=$(mktemp)
                
                # Si jq est disponible, l'utiliser pour normaliser le JSON
                if command -v jq >/dev/null 2>&1; then
                    jq -S . "$file1" > "$temp1" 2>/dev/null || cat "$file1" > "$temp1"
                    jq -S . "$file2" > "$temp2" 2>/dev/null || cat "$file2" > "$temp2"
                else
                    # Sinon, utiliser le JSON non normalisé
                    cat "$file1" > "$temp1"
                    cat "$file2" > "$temp2"
                fi
                
                # Calculer la similarité
                similarity=$(calculate_similarity "$temp1" "$temp2")
                
                # Convertir en pourcentage
                percent=$(awk "BEGIN {print $similarity * 100}")
                
                # Si la similarité dépasse le seuil, l'enregistrer
                if (( $(echo "$similarity > $SIMILARITY_THRESHOLD" | bc -l) )); then
                    echo "$file1|$file2|$percent" >> "$TEMP_RESULTS"
                fi
                
                # Nettoyer les fichiers temporaires
                rm "$temp1" "$temp2"
            fi
        done
    done
    
    # Afficher les résultats
    if [ -s "$TEMP_RESULTS" ]; then
        echo -e "${YELLOW}⚠️ Fichiers JSON similaires détectés:${NC}"
        while IFS="|" read -r file1 file2 percent; do
            echo -e "  ${YELLOW}→ $(basename "$file1") et $(basename "$file2"): ${percent%.*}% de similarité${NC}"
        done < "$TEMP_RESULTS"
        
        echo -e "\n${BLUE}💡 Suggestion: Utilisez deduplicate-files.sh pour fusionner ces fichiers similaires${NC}"
    else
        echo -e "${GREEN}✅ Aucune similarité significative détectée entre les fichiers JSON${NC}"
    fi
    
    # Supprimer le fichier temporaire
    rm "$TEMP_RESULTS"
fi

echo -e "\n${GREEN}✅ Analyse de similarité terminée!${NC}"
