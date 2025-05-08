#!/bin/bash

# Script de déduplication automatique basé sur le rapport d'analyse deep-deduplication-report.md
# Date: $(date +%Y-%m-%d)

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="/workspaces/cahier-des-charge/backup/deduplication-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$BACKUP_DIR/deduplication-log.txt"
EMPTY_FILES_LIST="/workspaces/cahier-des-charge/cleanup-scripts/empty-files-list.txt"
REPORT_FILE="/workspaces/cahier-des-charge/cleanup-report/deep-deduplication-report.md"
WORKSPACE_ROOT="/workspaces/cahier-des-charge"

# Vérifier si le répertoire de backup existe, sinon le créer
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}Dossier de sauvegarde créé: $BACKUP_DIR${NC}"
fi

# Fonction pour journaliser les actions
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Fonction pour sauvegarder un fichier avant de le supprimer
backup_file() {
    local file="$1"
    local relative_path="${file#$WORKSPACE_ROOT/}"
    local backup_path="$BACKUP_DIR/$relative_path"
    
    # Créer le répertoire de destination s'il n'existe pas
    mkdir -p "$(dirname "$backup_path")"
    
    # Copier le fichier
    cp "$file" "$backup_path" 2>/dev/null
    
    # Vérifier si la copie a réussi
    if [ $? -eq 0 ]; then
        log "Sauvegarde effectuée: $file -> $backup_path"
        return 0
    else
        log "${RED}ERREUR: Impossible de sauvegarder $file${NC}"
        return 1
    fi
}

# Fonction pour supprimer un fichier dupliqué
remove_duplicate() {
    local file="$1"
    
    # Vérifier si le fichier existe
    if [ ! -f "$file" ]; then
        log "${YELLOW}ATTENTION: Fichier déjà supprimé ou inexistant: $file${NC}"
        return 1
    fi
    
    # Sauvegarder le fichier avant suppression
    backup_file "$file"
    
    # Supprimer le fichier
    rm "$file"
    
    if [ $? -eq 0 ]; then
        log "Fichier supprimé avec succès: $file"
        return 0
    else
        log "${RED}ERREUR: Impossible de supprimer $file${NC}"
        return 1
    fi
}

# Fonction pour traiter les fichiers vides
clean_empty_files() {
    echo -e "${BLUE}Traitement des fichiers vides...${NC}"
    local count=0
    
    # Ignorer les fichiers dans node_modules, .git et autres fichiers systèmes
    while read -r file; do
        # Ignorer les fichiers spéciaux
        if [[ "$file" == *"node_modules"* || "$file" == *".git/"* || "$file" == *".nojekyll"* || "$file" == *".docusaurus/"* ]]; then
            continue
        fi
        
        # Vérifier si le fichier existe toujours
        if [ -f "$file" ]; then
            backup_file "$file"
            rm "$file"
            log "Fichier vide supprimé: $file"
            ((count++))
        fi
    done < "$EMPTY_FILES_LIST"
    
    echo -e "${GREEN}$count fichiers vides traités${NC}"
}

# Fonction pour effectuer la déduplication selon le rapport
execute_deduplication() {
    echo -e "${BLUE}Exécution de la déduplication basée sur le rapport...${NC}"
    local report_file="$1"
    local files_processed=0
    local groups_processed=0
    
    # Vérifier si le rapport existe
    if [ ! -f "$report_file" ]; then
        echo -e "${RED}Le fichier rapport n'existe pas: $report_file${NC}"
        return 1
    fi
    
    # Traitement des doublons exacts
    # Cette partie extrait les fichiers à conserver et les fichiers à supprimer
    # du rapport de déduplication
    
    echo -e "${YELLOW}Phase 1: Traitement des doublons exacts${NC}"
    
    # TODO: Implémenter l'extraction des informations du rapport markdown
    # Pour l'instant, nous utiliserons une approche simplifiée avec un fichier de plan
    
    if [ -f "$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan/exact-duplicates.txt" ]; then
        while IFS=':' read -r keep_file remove_files; do
            if [ -f "$WORKSPACE_ROOT/$keep_file" ]; then
                log "Conservation du fichier de référence: $keep_file"
                
                # Traitement des fichiers à supprimer (séparés par des virgules)
                IFS=',' read -ra FILES_TO_REMOVE <<< "$remove_files"
                for file in "${FILES_TO_REMOVE[@]}"; do
                    remove_duplicate "$WORKSPACE_ROOT/$file"
                    ((files_processed++))
                done
                
                ((groups_processed++))
            else
                log "${YELLOW}ATTENTION: Fichier de référence introuvable: $keep_file${NC}"
            fi
        done < "$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan/exact-duplicates.txt"
    else
        log "${YELLOW}Fichier de plan pour les doublons exacts non trouvé. Création du fichier de plan...${NC}"
        # Création du fichier plan pour une utilisation manuelle
        mkdir -p "$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan"
        echo "# Format: chemin/vers/fichier/à/conserver:chemin/vers/doublon1,chemin/vers/doublon2" > "$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan/exact-duplicates.txt"
        echo "# Exemple: tools/generate-migration-patch.ts:tools/project-structure-analyzer.ts,tools/supabase-migration-plan-sync.ts" >> "$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan/exact-duplicates.txt"
    fi
    
    echo -e "${GREEN}Déduplication terminée: $groups_processed groupes traités, $files_processed fichiers supprimés${NC}"
}

# Programme principal
echo -e "${BLUE}=== Début du processus de déduplication $(date) ===${NC}" | tee -a "$LOG_FILE"

# 1. Sauvegarde de sécurité
echo -e "${YELLOW}Création d'une sauvegarde de sécurité dans: $BACKUP_DIR${NC}"
log "Démarrage du processus de déduplication"

# 2. Nettoyage des fichiers vides
clean_empty_files

# 3. Exécution de la déduplication principale
execute_deduplication "$REPORT_FILE"

echo -e "${BLUE}=== Fin du processus de déduplication $(date) ===${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}Log complet disponible dans: $LOG_FILE${NC}"