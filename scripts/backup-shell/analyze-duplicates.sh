#!/bin/bash

# analyze-duplicates.sh
# Ce script analyse les dossiers dupliqués (versions PascalCase et kebab-case)
# et détermine quelle version conserver basée sur plusieurs critères
# comme la taille du code, la date de modification, et les références

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dossier principal à analyser
MAIN_DIR="./packages/mcp-agents"

# Fichier de log pour enregistrer les résultats
LOG_FILE="./standardization-warnings.txt"

# Fichier pour enregistrer les fusions à effectuer
MERGE_FILE="./merge-duplicates.json"

echo "Analyse des dossiers dupliqués dans $MAIN_DIR..." | tee -a $LOG_FILE
echo "[" > $MERGE_FILE

# Extraction des avertissements de fusion depuis le fichier de log standard
grep "ATTENTION: Le dossier" $LOG_FILE | while read -r line; do
    # Extraire les chemins des dossiers
    kebab_dir=$(echo "$line" | sed -r 's/ATTENTION: Le dossier (.*) existe déjà, fusion nécessaire avec (.*)/\1/')
    pascal_dir=$(echo "$line" | sed -r 's/ATTENTION: Le dossier (.*) existe déjà, fusion nécessaire avec (.*)/\2/')
    
    if [ -d "$kebab_dir" ] && [ -d "$pascal_dir" ]; then
        echo -e "${BLUE}Analyse de la duplication:${NC}" | tee -a $LOG_FILE
        echo -e "  ${YELLOW}Dossier kebab-case:${NC} $kebab_dir" | tee -a $LOG_FILE
        echo -e "  ${YELLOW}Dossier PascalCase:${NC} $pascal_dir" | tee -a $LOG_FILE
        
        # Nombre de fichiers dans chaque dossier
        kebab_files=$(find "$kebab_dir" -type f | wc -l)
        pascal_files=$(find "$pascal_dir" -type f | wc -l)
        
        # Taille totale du code dans chaque dossier (en octets)
        kebab_size=$(du -sb "$kebab_dir" | cut -f1)
        pascal_size=$(du -sb "$pascal_dir" | cut -f1)
        
        # Date de dernière modification
        kebab_date=$(stat -c %y "$kebab_dir" | cut -d' ' -f1)
        pascal_date=$(stat -c %y "$pascal_dir" | cut -d' ' -f1)
        
        echo -e "  ${BLUE}Statistiques:${NC}" | tee -a $LOG_FILE
        echo -e "    ${GREEN}Dossier kebab-case:${NC} $kebab_files fichiers, $kebab_size octets, dernière modif: $kebab_date" | tee -a $LOG_FILE
        echo -e "    ${GREEN}Dossier PascalCase:${NC} $pascal_files fichiers, $pascal_size octets, dernière modif: $pascal_date" | tee -a $LOG_FILE
        
        # Déterminer quel dossier conserver (par défaut kebab-case, mais privilégier le plus grand/récent)
        keep=""
        reason=""
        
        if [ "$kebab_files" -gt "$pascal_files" ]; then
            keep="$kebab_dir"
            reason="plus de fichiers"
        elif [ "$pascal_files" -gt "$kebab_files" ]; then
            keep="$pascal_dir"
            reason="plus de fichiers"
        elif [ "$kebab_size" -gt "$pascal_size" ]; then
            keep="$kebab_dir"
            reason="plus de contenu"
        elif [ "$pascal_size" -gt "$kebab_size" ]; then
            keep="$pascal_dir"
            reason="plus de contenu"
        elif [[ "$kebab_date" > "$pascal_date" ]]; then
            keep="$kebab_dir"
            reason="plus récent"
        elif [[ "$pascal_date" > "$kebab_date" ]]; then
            keep="$pascal_dir"
            reason="plus récent"
        else
            keep="$kebab_dir"
            reason="convention kebab-case préférée"
        fi
        
        # Vérifier les références dans le code pour tester quel dossier est le plus utilisé
        kebab_refs=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" $(basename "$kebab_dir") ./packages/ | wc -l)
        pascal_refs=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" $(basename "$pascal_dir") ./packages/ | wc -l)
        
        echo -e "    ${BLUE}Références:${NC} kebab-case: $kebab_refs, PascalCase: $pascal_refs" | tee -a $LOG_FILE
        
        if [ "$pascal_refs" -gt "$kebab_refs" ] && [ "$keep" = "$kebab_dir" ]; then
            echo -e "    ${YELLOW}Attention:${NC} La version PascalCase a plus de références ($pascal_refs) que la version kebab-case ($kebab_refs)" | tee -a $LOG_FILE
        fi
        
        # Extraction du nom de base pour l'affichage
        base_kebab=$(basename "$kebab_dir")
        base_pascal=$(basename "$pascal_dir")
        
        echo -e "  ${GREEN}Recommandation:${NC} Conserver ${keep} (raison: $reason)" | tee -a $LOG_FILE
        echo -e "  ${GREEN}Action requise:${NC} Fusionner ${pascal_dir} vers ${kebab_dir} puis supprimer ${pascal_dir}\n" | tee -a $LOG_FILE
        
        # Ajouter l'entrée au fichier JSON de fusion
        echo "  {" >> $MERGE_FILE
        echo "    \"kebab\": \"$kebab_dir\"," >> $MERGE_FILE
        echo "    \"pascal\": \"$pascal_dir\"," >> $MERGE_FILE
        echo "    \"keep\": \"$keep\"," >> $MERGE_FILE
        echo "    \"reason\": \"$reason\"," >> $MERGE_FILE
        echo "    \"kebabRefs\": $kebab_refs," >> $MERGE_FILE
        echo "    \"pascalRefs\": $pascal_refs" >> $MERGE_FILE
        echo "  }," >> $MERGE_FILE
    else
        if [ ! -d "$kebab_dir" ]; then
            echo -e "${RED}Erreur: Le dossier $kebab_dir n'existe pas${NC}" | tee -a $LOG_FILE
        fi
        if [ ! -d "$pascal_dir" ]; then
            echo -e "${RED}Erreur: Le dossier $pascal_dir n'existe pas${NC}" | tee -a $LOG_FILE
        fi
    fi
done

# Finaliser le fichier JSON
sed -i '$ s/,$//' $MERGE_FILE
echo "]" >> $MERGE_FILE

echo -e "\n${GREEN}Analyse terminée!${NC}" | tee -a $LOG_FILE
echo -e "${BLUE}Résultats enregistrés dans ${LOG_FILE}${NC}"
echo -e "${BLUE}Liste des fusions à effectuer dans ${MERGE_FILE}${NC}"