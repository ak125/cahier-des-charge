#!/bin/bash

# merge-duplicates.sh
# Ce script fusionne les dossiers dupliqués identifiés par analyze-duplicates.sh

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fichier JSON contenant les informations de fusion
MERGE_FILE="./merge-duplicates.json"

# Vérifier que le fichier existe
if [ ! -f "$MERGE_FILE" ]; then
    echo -e "${RED}Erreur: Fichier $MERGE_FILE non trouvé.${NC}"
    echo -e "${YELLOW}Exécutez d'abord ./analyze-duplicates.sh pour générer le fichier.${NC}"
    exit 1
fi

# Fichier de log pour les opérations de fusion
FUSION_LOG="./fusion-operations.log"
echo "# Log des opérations de fusion - $(date)" > $FUSION_LOG

# Compteurs
TOTAL=0
SUCCESS=0
SKIPPED=0
FAILED=0

# Fonction pour fusionner deux dossiers
function merge_directories() {
    local source_dir="$1"
    local target_dir="$2"
    
    echo -e "${BLUE}Fusion de $source_dir vers $target_dir...${NC}" | tee -a $FUSION_LOG
    
    # Vérifier que les deux dossiers existent
    if [ ! -d "$source_dir" ]; then
        echo -e "  ${RED}Erreur: Dossier source $source_dir n'existe pas${NC}" | tee -a $FUSION_LOG
        return 1
    fi
    
    if [ ! -d "$target_dir" ]; then
        echo -e "  ${RED}Erreur: Dossier cible $target_dir n'existe pas${NC}" | tee -a $FUSION_LOG
        return 1
    fi
    
    # Créer un dossier de backup au cas où
    local backup_dir="${source_dir}_backup_$(date +%Y%m%d%H%M%S)"
    cp -r "$source_dir" "$backup_dir"
    echo -e "  ${YELLOW}Backup créé: $backup_dir${NC}" | tee -a $FUSION_LOG
    
    # Copier tous les fichiers du dossier source vers le dossier cible
    local files_copied=0
    local files_skipped=0
    
    find "$source_dir" -type f | while read -r file; do
        # Obtenir le chemin relatif du fichier par rapport au dossier source
        local rel_path="${file#$source_dir/}"
        local target_file="$target_dir/$rel_path"
        local target_dir_path=$(dirname "$target_file")
        
        # Créer le dossier cible s'il n'existe pas
        if [ ! -d "$target_dir_path" ]; then
            mkdir -p "$target_dir_path"
        fi
        
        # Si le fichier existe déjà dans la cible, comparer le contenu
        if [ -f "$target_file" ]; then
            if diff -q "$file" "$target_file" >/dev/null; then
                echo -e "  ${YELLOW}Fichier identique, ignoré: $rel_path${NC}" | tee -a $FUSION_LOG
                files_skipped=$((files_skipped + 1))
            else
                # Fichiers différents, créer une version fusionnée
                local merged_file="${target_file}.merged"
                echo "// FUSION AUTOMATIQUE - $(date)" > "$merged_file"
                echo "// Source 1: $target_file" >> "$merged_file"
                echo "// Source 2: $file" >> "$merged_file"
                echo "" >> "$merged_file"
                echo "// CONTENU DE $target_file:" >> "$merged_file"
                echo "// ----------------------" >> "$merged_file"
                cat "$target_file" >> "$merged_file"
                echo "" >> "$merged_file"
                echo "// CONTENU DE $file:" >> "$merged_file"
                echo "// ----------------------" >> "$merged_file"
                cat "$file" >> "$merged_file"
                
                echo -e "  ${YELLOW}Fichiers différents, fusion créée: ${merged_file}${NC}" | tee -a $FUSION_LOG
                files_copied=$((files_copied + 1))
            fi
        else
            # Le fichier n'existe pas dans la cible, le copier directement
            cp "$file" "$target_file"
            echo -e "  ${GREEN}Fichier copié: $rel_path${NC}" | tee -a $FUSION_LOG
            files_copied=$((files_copied + 1))
        fi
    done
    
    echo -e "  ${GREEN}Fusion terminée: $files_copied fichiers copiés, $files_skipped fichiers ignorés${NC}" | tee -a $FUSION_LOG
    
    # Ne pas supprimer automatiquement le dossier source pour éviter les problèmes
    # C'est plus sécuritaire de le faire manuellement après vérification
    echo -e "  ${YELLOW}Note: Le dossier source $source_dir a été conservé. Supprimez-le manuellement après vérification.${NC}" | tee -a $FUSION_LOG
    
    return 0
}

# Fonction pour mettre à jour les importations dans les fichiers
function update_imports() {
    local old_name="$1"
    local new_name="$2"
    local base_dir="./packages/mcp-agents"
    
    echo -e "${BLUE}Mise à jour des importations: $old_name -> $new_name${NC}" | tee -a $FUSION_LOG
    
    # Trouver tous les fichiers TypeScript et JavaScript
    find "$base_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
        # Chercher les importations du format précédent
        if grep -q "from ['\"].*$old_name['\"]" "$file"; then
            # Faire une copie de sauvegarde du fichier
            cp "$file" "${file}.bak"
            
            # Remplacer les importations
            sed -i "s|from ['\"]\\(.*\\)$old_name\\(['\"]\\)|from \\1$new_name\\2|g" "$file"
            
            echo -e "  ${GREEN}Importations mises à jour dans: $file${NC}" | tee -a $FUSION_LOG
        fi
    done
}

echo -e "${GREEN}Début du processus de fusion des dossiers dupliqués...${NC}"

# Lire le fichier JSON ligne par ligne (traitement simplifié)
cat "$MERGE_FILE" | grep -o '"kebab": "[^"]*"\|"pascal": "[^"]*"\|"keep": "[^"]*"' | while read -r line; do
    # Extraire les valeurs de kebab, pascal, et keep
    if [[ "$line" == *"kebab"* ]]; then
        kebab_dir=$(echo "$line" | sed -r 's/"kebab": "([^"]*)"/\1/')
    elif [[ "$line" == *"pascal"* ]]; then
        pascal_dir=$(echo "$line" | sed -r 's/"pascal": "([^"]*)"/\1/')
    elif [[ "$line" == *"keep"* ]]; then
        keep=$(echo "$line" | sed -r 's/"keep": "([^"]*)"/\1/')
        
        # Si nous avons toutes les valeurs, procéder à la fusion
        if [ -n "$kebab_dir" ] && [ -n "$pascal_dir" ] && [ -n "$keep" ]; then
            TOTAL=$((TOTAL + 1))
            
            # Déterminer la direction de la fusion
            if [ "$keep" == "$kebab_dir" ]; then
                source_dir="$pascal_dir"
                target_dir="$kebab_dir"
                old_name=$(basename "$pascal_dir")
                new_name=$(basename "$kebab_dir")
            else
                source_dir="$kebab_dir"
                target_dir="$pascal_dir"
                old_name=$(basename "$kebab_dir")
                new_name=$(basename "$pascal_dir")
            fi
            
            echo -e "\n${BLUE}[$TOTAL] Traitement de la fusion:${NC}" | tee -a $FUSION_LOG
            echo -e "  ${YELLOW}Source:${NC} $source_dir" | tee -a $FUSION_LOG
            echo -e "  ${YELLOW}Cible:${NC} $target_dir" | tee -a $FUSION_LOG
            
            # Fusionner les dossiers
            if merge_directories "$source_dir" "$target_dir"; then
                SUCCESS=$((SUCCESS + 1))
                
                # Mettre à jour les importations
                update_imports "$old_name" "$new_name"
            else
                FAILED=$((FAILED + 1))
            fi
            
            # Réinitialiser les variables pour le prochain groupe
            kebab_dir=""
            pascal_dir=""
            keep=""
        fi
    fi
done

echo -e "\n${GREEN}Fusion terminée!${NC}"
echo -e "${BLUE}Résumé des opérations:${NC}"
echo -e "  ${GREEN}Total traité: $TOTAL${NC}"
echo -e "  ${GREEN}Réussis: $SUCCESS${NC}"
echo -e "  ${RED}Échoués: $FAILED${NC}"
echo -e "  ${YELLOW}Ignorés: $SKIPPED${NC}"
echo -e "${BLUE}Log détaillé disponible dans ${FUSION_LOG}${NC}"
echo -e "${YELLOW}IMPORTANT: Vérifiez les fichiers .merged créés et les chemins d'importation avant de continuer.${NC}"