#!/bin/bash

# Script de déduplication des fichiers
# Remplace deduplicate-files.ts

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

echo -e "${BLUE}🔍 Démarrage de la déduplication des fichiers...${NC}"
echo -e "📂 Répertoire: $CAHIER_PATH"

# Vérifier si le répertoire existe
if [ ! -d "$CAHIER_PATH" ]; then
    echo -e "${RED}❌ Le répertoire $CAHIER_PATH n'existe pas.${NC}"
    exit 1
fi

# Fonction pour déduplicer les fichiers d'un type spécifique
deduplicate_files() {
    local extension=$1
    
    echo -e "\n${BLUE}🔍 Recherche de doublons pour les fichiers $extension...${NC}"
    
    # Trouver tous les fichiers avec cette extension
    FILES=$(find "$CAHIER_PATH" -type f -name "*$extension")
    FILE_COUNT=$(echo "$FILES" | grep -c "." || echo 0)
    
    if [ "$FILE_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ Aucun fichier $extension trouvé.${NC}"
        return 0
    fi
    
    echo -e "${GREEN}✅ Trouvé $FILE_COUNT fichiers $extension${NC}"
    
    # Regrouper les fichiers par nom de base
    declare -A file_groups
    
    for file in $FILES; do
        # Extraire le nom de base
        filename=$(basename "$file")
        base_name="${filename%$extension}"
        
        # Enlever les numéros de version (par exemple, .v1)
        base_name=$(echo "$base_name" | sed -E 's/\.v[0-9]+$//')
        
        # Ajouter au groupe
        if [ -z "${file_groups[$base_name]}" ]; then
            file_groups[$base_name]="$file"
        else
            file_groups[$base_name]="${file_groups[$base_name]} $file"
        fi
    done
    
    # Traiter chaque groupe pour trouver les doublons
    duplicates_found=0
    
    for base_name in "${!file_groups[@]}"; do
        # Récupérer les fichiers de ce groupe
        group_files=${file_groups[$base_name]}
        file_count=$(echo "$group_files" | wc -w)
        
        if [ "$file_count" -gt 1 ]; then
            echo -e "\n${YELLOW}⚠️ Groupe de fichiers similaires détecté pour: $base_name${NC}"
            
            # Afficher les fichiers de ce groupe
            for file in $group_files; do
                echo -e "  - $(basename "$file")"
            done
            
            duplicates_found=$((duplicates_found + 1))
            
            # Demander confirmation pour fusionner
            echo -e "\n${BLUE}❓ Voulez-vous fusionner ces fichiers? (y/n)${NC}"
            read -r answer
            
            if [[ "$answer" =~ ^[Yy]$ ]]; then
                # Trouver le fichier le plus récent (ou le premier s'ils ont la même date)
                newest_file=$(ls -t $group_files | head -n 1)
                
                # Créer un fichier fusionné
                merged_file="${CAHIER_PATH}/$(basename "${newest_file%$extension}")_merged${extension}"
                
                echo -e "${BLUE}🔄 Fusion en cours vers: $(basename "$merged_file")...${NC}"
                
                # Pour les fichiers Markdown, concaténer avec un séparateur
                if [[ "$extension" == ".md" ]]; then
                    echo -e "# Fichier fusionné: $(basename "$merged_file")\n" > "$merged_file"
                    echo -e "Ce fichier est le résultat de la fusion des fichiers suivants:\n" >> "$merged_file"
                    
                    for file in $group_files; do
                        echo "- $(basename "$file")" >> "$merged_file"
                    done
                    
                    echo -e "\n---\n" >> "$merged_file"
                    
                    for file in $group_files; do
                        echo -e "\n## Contenu de: $(basename "$file")\n" >> "$merged_file"
                        cat "$file" >> "$merged_file"
                        echo -e "\n---\n" >> "$merged_file"
                    done
                # Pour les fichiers JSON, utiliser le plus récent
                elif [[ "$extension" == ".json" ]]; then
                    cp "$newest_file" "$merged_file"
                    echo -e "${GREEN}✅ Fichier JSON copié depuis le plus récent: $(basename "$newest_file")${NC}"
                # Pour les autres types de fichiers, copier simplement le plus récent
                else
                    cp "$newest_file" "$merged_file"
                fi
                
                echo -e "${GREEN}✅ Fusion terminée: $merged_file${NC}"
                
                # Demander si l'utilisateur veut supprimer les fichiers originaux
                echo -e "\n${BLUE}❓ Voulez-vous supprimer les fichiers originaux? (y/n)${NC}"
                read -r delete_answer
                
                if [[ "$delete_answer" =~ ^[Yy]$ ]]; then
                    # Ajouter une confirmation supplémentaire pour la sécurité
                    echo -e "\n${RED}⚠️ ATTENTION! Cette action va supprimer définitivement les fichiers suivants:${NC}"
                    for file in $group_files; do
                        echo -e "${RED}  - $file${NC}"
                    done
                    echo -e "\n${RED}⚠️ Êtes-vous vraiment sûr de vouloir supprimer ces fichiers? (tapez 'CONFIRMER' pour continuer)${NC}"
                    read -r final_confirmation
                    
                    if [ "$final_confirmation" = "CONFIRMER" ]; then
                        for file in $group_files; do
                            rm "$file"
                            echo -e "${YELLOW}🗑️ Supprimé: $file${NC}"
                        done
                    else
                        echo -e "${GREEN}✅ Suppression annulée. Les fichiers originaux ont été conservés.${NC}"
                    fi
                fi
            fi
        fi
    done
    
    if [ "$duplicates_found" -eq 0 ]; then
        echo -e "${GREEN}✅ Aucun doublon trouvé parmi les fichiers $extension${NC}"
    else
        echo -e "\n${BLUE}📊 Déduplication terminée: $duplicates_found groupe(s) de fichiers similaires traité(s)${NC}"
    fi
}

# Déduplicer les différents types de fichiers
deduplicate_files ".md"
deduplicate_files ".json"
deduplicate_files ".audit.md"
deduplicate_files ".backlog.json"
deduplicate_files ".impact_graph.json"

echo -e "\n${GREEN}✅ Processus de déduplication terminé!${NC}"
