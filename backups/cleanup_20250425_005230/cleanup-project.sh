#!/bin/bash

# Script de nettoyage pour le projet MCP OS
#
# Ce script nettoie les fichiers obsolètes et redondants du projet
# en se basant sur les rapports générés par project-indexer.ts.
# 
# Usage: ./cleanup-project.sh [options]
#
# Options:
#   --auto             Exécution automatique sans confirmation
#   --archive-only     Archiver les fichiers au lieu de les supprimer
#   --threshold <n>    Seuil de confiance minimum (défaut: 80)
#   --verbose          Afficher plus d'informations
#   --help             Afficher cette aide

set -e

# Couleurs pour les sorties
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoires
BASE_DIR=$(pwd)
LEGACY_DIR="${BASE_DIR}/legacy"
REPORTS_DIR="${BASE_DIR}/reports"
OBSOLETES_FILE="${REPORTS_DIR}/obsoletes.json"
REDUNDANCY_FILE="${REPORTS_DIR}/redundancy_report.json"

# Options par défaut
AUTO_MODE=false
ARCHIVE_ONLY=false
CONFIDENCE_THRESHOLD=80
VERBOSE=false

# Fonction d'aide
function show_help {
    echo -e "${BLUE}MCP OS - Script de nettoyage du projet${NC}"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --auto             Exécution automatique sans confirmation"
    echo "  --archive-only     Archiver les fichiers au lieu de les supprimer"
    echo "  --threshold <n>    Seuil de confiance minimum (défaut: 80)"
    echo "  --verbose          Afficher plus d'informations"
    echo "  --help             Afficher cette aide"
    echo
    exit 0
}

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --auto)
        AUTO_MODE=true
        shift
        ;;
        --archive-only)
        ARCHIVE_ONLY=true
        shift
        ;;
        --threshold)
        if [[ $# -gt 1 ]]; then
            CONFIDENCE_THRESHOLD="$2"
            shift 2
        else
            echo -e "${RED}Erreur: L'option --threshold nécessite une valeur.${NC}"
            show_help
        fi
        ;;
        --verbose)
        VERBOSE=true
        shift
        ;;
        --help)
        show_help
        ;;
        *)
        echo -e "${RED}Argument inconnu: $key${NC}"
        show_help
        ;;
    esac
done

# Créer le répertoire legacy s'il n'existe pas
mkdir -p "$LEGACY_DIR"

# Fonction pour archiver un fichier
function archive_file {
    local file="$1"
    local reason="$2"
    
    # Créer un chemin unique dans le répertoire legacy
    local filename=$(basename "$file")
    local legacy_path="${LEGACY_DIR}/${filename}"
    local counter=1
    
    # Si le fichier existe déjà dans legacy, ajouter un suffixe numérique
    while [ -f "$legacy_path" ]; do
        legacy_path="${LEGACY_DIR}/${filename%.${filename##*.}}_${counter}.${filename##*.}"
        ((counter++))
    done
    
    # Créer un fichier .meta avec des informations sur l'archivage
    local meta_path="${legacy_path}.meta"
    echo "Original path: $file" > "$meta_path"
    echo "Archived on: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$meta_path"
    echo "Reason: $reason" >> "$meta_path"
    
    # Déplacer le fichier
    mv "$file" "$legacy_path"
    
    if $VERBOSE; then
        echo -e "${YELLOW}Archivé: $file -> $legacy_path${NC}"
    else
        echo -e "${YELLOW}Archivé: $file${NC}"
    fi
}

# Fonction pour supprimer un fichier
function remove_file {
    local file="$1"
    
    rm "$file"
    echo -e "${RED}Supprimé: $file${NC}"
}

# Vérifier si les rapports nécessaires existent
if [ ! -f "$OBSOLETES_FILE" ]; then
    echo -e "${RED}Rapport des fichiers obsolètes introuvable: $OBSOLETES_FILE${NC}"
    echo -e "${YELLOW}Veuillez d'abord exécuter: npx ts-node tools/project-indexer.ts${NC}"
    exit 1
fi

if [ ! -f "$REDUNDANCY_FILE" ]; then
    echo -e "${RED}Rapport de redondance introuvable: $REDUNDANCY_FILE${NC}"
    echo -e "${YELLOW}Veuillez d'abord exécuter: npx ts-node tools/project-indexer.ts${NC}"
    exit 1
fi

# Extraire les fichiers à nettoyer des rapports
echo -e "${BLUE}=== Analyse des rapports de nettoyage ===${NC}"
echo -e "${YELLOW}Seuil de confiance: ${CONFIDENCE_THRESHOLD}%${NC}"

# 1. Fichiers obsolètes (avec un seuil de confiance)
OBSOLETES_COUNT=$(jq ".candidatesForRemoval | length" "$OBSOLETES_FILE")
OBSOLETES_FILTERED_COUNT=$(jq ".candidatesForRemoval | map(select(.confidence >= $CONFIDENCE_THRESHOLD)) | length" "$OBSOLETES_FILE")

echo -e "Fichiers obsolètes détectés: $OBSOLETES_COUNT (total) - $OBSOLETES_FILTERED_COUNT (au-dessus du seuil)"

# 2. Fichiers de backup
BACKUP_FILES_COUNT=$(jq ".backupFiles | length" "$REDUNDANCY_FILE")
echo -e "Fichiers de backup détectés: $BACKUP_FILES_COUNT"

# 3. Fichiers versionnés obsolètes
VERSIONED_FILES_COUNT=$(jq ".versionedFiles | length" "$REDUNDANCY_FILE")
echo -e "Fichiers versionnés détectés: $VERSIONED_FILES_COUNT"

# Afficher la liste complète des fichiers à nettoyer
TOTAL_FILES=$((OBSOLETES_FILTERED_COUNT + BACKUP_FILES_COUNT + VERSIONED_FILES_COUNT))

if [ $TOTAL_FILES -eq 0 ]; then
    echo -e "${GREEN}Aucun fichier à nettoyer. Le projet est déjà propre!${NC}"
    exit 0
fi

echo -e "\n${BLUE}=== Liste des fichiers à nettoyer (${TOTAL_FILES}) ===${NC}"

# 1. Afficher les fichiers obsolètes filtrés
echo -e "\n${YELLOW}Fichiers obsolètes:${NC}"
jq -r ".candidatesForRemoval | map(select(.confidence >= $CONFIDENCE_THRESHOLD)) | .[] | .path + \" (Confiance: \" + (.confidence|tostring) + \"%, Raison: \" + .reason + \")\"" "$OBSOLETES_FILE"

# 2. Afficher les fichiers de backup
echo -e "\n${YELLOW}Fichiers de backup:${NC}"
jq -r '.backupFiles[]' "$REDUNDANCY_FILE"

# 3. Afficher les fichiers versionnés
echo -e "\n${YELLOW}Fichiers versionnés obsolètes:${NC}"
jq -r '.versionedFiles[]' "$REDUNDANCY_FILE"

# Demander confirmation si le mode auto n'est pas activé
if [ "$AUTO_MODE" = false ]; then
    echo -e "\n${YELLOW}Voulez-vous procéder au nettoyage de ces fichiers? (y/n)${NC}"
    read -r response
    
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        echo -e "${BLUE}Opération annulée.${NC}"
        exit 0
    fi
fi

# Traiter les fichiers
echo -e "\n${BLUE}=== Début du nettoyage ===${NC}"
PROCESSED_COUNT=0

# 1. Traiter les fichiers obsolètes filtrés
while read -r file_info; do
    if [ -z "$file_info" ]; then
        continue
    fi
    
    # Extraire le chemin du fichier et la raison
    file=$(echo "$file_info" | cut -d ' ' -f1)
    reason=$(echo "$file_info" | cut -d '(' -f2- | sed 's/)$//')
    
    if [ -f "$file" ]; then
        if [ "$ARCHIVE_ONLY" = true ]; then
            archive_file "$file" "$reason"
        else
            remove_file "$file"
        fi
        
        PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
    else
        if $VERBOSE; then
            echo -e "${BLUE}Ignoré (n'existe pas): $file${NC}"
        fi
    fi
done < <(jq -r ".candidatesForRemoval | map(select(.confidence >= $CONFIDENCE_THRESHOLD)) | .[] | .path + \" (\" + .reason + \")\"" "$OBSOLETES_FILE")

# 2. Traiter les fichiers de backup
while read -r file; do
    if [ -z "$file" ]; then
        continue
    fi
    
    if [ -f "$file" ]; then
        if [ "$ARCHIVE_ONLY" = true ]; then
            archive_file "$file" "Fichier de backup"
        else
            remove_file "$file"
        fi
        
        PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
    else
        if $VERBOSE; then
            echo -e "${BLUE}Ignoré (n'existe pas): $file${NC}"
        fi
    fi
done < <(jq -r '.backupFiles[]' "$REDUNDANCY_FILE")

# 3. Traiter les fichiers versionnés obsolètes
# On récupère uniquement les fichiers versionnés qui ne sont pas la dernière version
while read -r file; do
    if [ -z "$file" ]; then
        continue
    fi
    
    if [ -f "$file" ]; then
        # Vérifier qu'il s'agit bien d'un fichier versionné
        if [[ "$file" =~ \.v[0-9]+\. ]]; then
            # Extraire le nom de base et la version
            base_name=$(echo "$file" | sed 's/\.v[0-9]\+\./\./')
            version=$(echo "$file" | grep -o "\.v[0-9]\+" | sed 's/\.v//')
            
            # Vérifier s'il existe une version plus récente
            is_latest=true
            for existing_file in $(find $(dirname "$file") -name "$(basename "$base_name" | sed 's/\./\\./g').*"); do
                if [[ "$existing_file" =~ \.v([0-9]+)\. ]]; then
                    other_version="${BASH_REMATCH[1]}"
                    if (( other_version > version )); then
                        is_latest=false
                        break
                    fi
                fi
            done
            
            # Ne nettoyer que s'il ne s'agit pas de la dernière version
            if [ "$is_latest" = false ]; then
                if [ "$ARCHIVE_ONLY" = true ]; then
                    archive_file "$file" "Version obsolète (v$version)"
                else
                    remove_file "$file"
                fi
                
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
            else
                if $VERBOSE; then
                    echo -e "${BLUE}Ignoré (dernière version): $file${NC}"
                fi
            fi
        fi
    else
        if $VERBOSE; then
            echo -e "${BLUE}Ignoré (n'existe pas): $file${NC}"
        fi
    fi
done < <(jq -r '.versionedFiles[]' "$REDUNDANCY_FILE")

# Résumé
echo -e "\n${BLUE}=== Résumé du nettoyage ===${NC}"
echo -e "Fichiers traités: $PROCESSED_COUNT / $TOTAL_FILES"

if [ "$ARCHIVE_ONLY" = true ]; then
    echo -e "${GREEN}Les fichiers ont été archivés dans: $LEGACY_DIR${NC}"
    echo -e "${YELLOW}Vous pouvez consulter les métadonnées d'archivage dans les fichiers .meta correspondants.${NC}"
else
    echo -e "${GREEN}Les fichiers ont été supprimés définitivement.${NC}"
fi

echo -e "\n${GREEN}Nettoyage terminé!${NC}"

# Recommandation
echo -e "\n${BLUE}=== Prochaines étapes recommandées ===${NC}"
echo -e "1. Exécutez ${YELLOW}npx ts-node tools/project-indexer.ts${NC} pour mettre à jour les rapports."
echo -e "2. Exécutez ${YELLOW}npm run test${NC} pour vérifier que le nettoyage n'a pas affecté le fonctionnement du projet."
echo -e "3. Utilisez ${YELLOW}./scripts/consolidate.sh --by-layer${NC} pour organiser le projet selon l'architecture trois couches."

exit 0