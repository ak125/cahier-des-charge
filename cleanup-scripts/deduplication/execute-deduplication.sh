#!/bin/bash

# Script pour exécuter le plan de déduplication des fichiers
# Date: $(date +%Y-%m-%d)

# Configuration
BACKUP_DIR="/workspaces/cahier-des-charge/backup/deduplication-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/workspaces/cahier-des-charge/cleanup-report/deduplication-$(date +%Y%m%d-%H%M%S).log"
PLAN_FILE="/workspaces/cahier-des-charge/cleanup-scripts/deduplication-plan/deduplication-plan.json"
EMPTY_FILES_LIST="/workspaces/cahier-des-charge/cleanup-scripts/empty-files-list.txt"

# Vérifier que les répertoires existent
mkdir -p "$BACKUP_DIR"
mkdir -p $(dirname "$LOG_FILE")

# Fonction pour enregistrer les actions dans le journal
log() {
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# Démarrage du script
log "Démarrage du processus de déduplication"
log "Répertoire de sauvegarde: $BACKUP_DIR"

# Traiter les fichiers vides d'abord
if [ -f "$EMPTY_FILES_LIST" ]; then
    log "Traitement des fichiers vides..."
    mkdir -p "$BACKUP_DIR/empty-files"
    
    while IFS= read -r file; do
        if [[ "$file" =~ node_modules ]] || [[ "$file" =~ ".git/" ]]; then
            continue
        fi
        
        if [ -f "$file" ]; then
            log "Sauvegarde du fichier vide: $file"
            parent_dir="$BACKUP_DIR/empty-files/$(dirname "${file#/workspaces/cahier-des-charge/}")"
            mkdir -p "$parent_dir"
            cp -p "$file" "$parent_dir/"
            
            log "Suppression du fichier vide: $file"
            rm "$file"
        fi
    done < <(grep -v "node_modules\|.git/" "$EMPTY_FILES_LIST")
    
    log "Traitement des fichiers vides terminé"
fi

# Traiter les doublons exacts à partir du rapport
log "Début de suppression des doublons exacts..."

# Action 1: Groupe avec le hash d41d8cd98f00b204e9800998ecf8427e
log "Traitement du groupe 1 (fichiers vides)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/tools/generate-migration-patch.ts"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/tools/project-structure-analyzer.ts"
    "/workspaces/cahier-des-charge/tools/supabase-migration-plan-sync.ts"
    "/workspaces/cahier-des-charge/tools/update-mcp-imports.ts"
    "/workspaces/cahier-des-charge/agents/audit-selector-agent/index.ts"
    "/workspaces/cahier-des-charge/agents/classifier-agent/index.ts"
    "/workspaces/cahier-des-charge/apps/dashboard/server.ts"
    "/workspaces/cahier-des-charge/apps/dashboard/services/supabase.ts"
    "/workspaces/cahier-des-charge/apps/frontend/utils/supabaseserver.ts"
    "/workspaces/cahier-des-charge/packages/mcp-utils/src/types/index.ts"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Action 2: Groupe Pipeline_de_Migration_IA
log "Traitement du groupe 2 (Pipeline de Migration IA)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/migrations/n8n-inventory/Pipeline_de_Migration_IA_20250506125602.json"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/Pipeline_de_Migration_IA_20250506125603.json"
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/workflows/Pipeline_de_Migration_IA_20250506130018.json"
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/workflows/Pipeline_de_Migration_IA_20250506130020.json"
    "/workspaces/cahier-des-charge/packages/business/workflows/migration/n8npipeline.json"
    "/workspaces/cahier-des-charge/packages/orchestration/orchestration/workflows/n8npipelineclean.json"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Action 3: Groupe migrationpipelinen8n
log "Traitement du groupe 3 (migrationpipelinen8n)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/migrations/n8n-inventory/migrationpipelinen8n_20250506125602.json"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/migrationpipelinen8n_20250506125603.json"
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/workflows/migrationpipelinen8n_20250506130017.json"
    "/workspaces/cahier-des-charge/migrations/n8n-inventory/workflows/migrationpipelinen8n_20250506130019.json"
    "/workspaces/cahier-des-charge/packages/business/config/migration/migration-pipelinen8n.json"
    "/workspaces/cahier-des-charge/packages/business/config/migration-pipelinen8n.json"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Action 4: Groupe php-analyzer-v2
log "Traitement du groupe 4 (php-analyzer-v2)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/archives/migrations-legacy/consolidation-2025-04-17/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v2/php-analyzer-v2.ts"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/archives/migrations-legacy/consolidation-2025-04-17/packages/mcp-agents/analyzers/php-analyzer/phpanalyzerv2/php-analyzer-v2.ts"
    "/workspaces/cahier-des-charge/archives/migrations-legacy/consolidation-2025-04-17/packages/mcp-agents/analyzers/phpanalyzer/php-analyzer-v2/php-analyzer-v2.ts"
    "/workspaces/cahier-des-charge/archives/migrations-legacy/consolidation-2025-04-17/packages/mcp-agents/analyzers/phpanalyzer/phpanalyzerv2/php-analyzer-v2.ts"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Action 5: Groupe qa-analyzer
log "Traitement du groupe 5 (qa-analyzer)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/packages/mcp-agents/qa-analyzer/qa-analyzer.ts"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/packages/mcp-agents/qa-analyzer/qa-analyzer/qa-analyzer.ts"
    "/workspaces/cahier-des-charge/packages/business/src/business/analyzers/qa-analyzer/index.ts"
    "/workspaces/cahier-des-charge/packages/business/src/business/analyzers/qa-analyzer/qa-analyzer.ts"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Action 6: Groupe tsconfig.json
log "Traitement du groupe 6 (tsconfig.json)..."
FILES_TO_KEEP="/workspaces/cahier-des-charge/packages/mcp-domain/tsconfig.json"
FILES_TO_REMOVE=(
    "/workspaces/cahier-des-charge/packages/mcp-services/tsconfig.json"
    "/workspaces/cahier-des-charge/packages/mcp-utils/tsconfig.json"
    "/workspaces/cahier-des-charge/packages/ui-remix/tsconfig.json"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        log "Sauvegarde de $file"
        backup_path="$BACKUP_DIR${file#/workspaces/cahier-des-charge}"
        mkdir -p "$(dirname "$backup_path")"
        cp -p "$file" "$backup_path"
        
        log "Suppression de $file"
        rm "$file"
    else
        log "Fichier non trouvé: $file"
    fi
done

# Finalisation
log "Déduplication terminée"
log "Nombre total de fichiers traités: $(grep -c "Suppression de " "$LOG_FILE")"
log "Consultez le journal pour plus de détails: $LOG_FILE"

echo "Déduplication terminée. Consultez le fichier log pour les détails: $LOG_FILE"