#!/bin/bash

# Script de migration des anciens dossiers vers la nouvelle structure
# Usage: ./migrate-legacy-folders.sh
#
# Ce script migre le contenu des anciens dossiers agents et orchestrators
# vers la nouvelle structure de packages, tout en créant des fichiers de
# redirection temporaires pour assurer la compatibilité pendant la transition.

set -e

# Variables de configuration
ROOT_DIR=$(pwd)
LOG_FILE="$ROOT_DIR/migration-legacy-folders.log"
BACKUP_DIR="$ROOT_DIR/backups/legacy-folders-$(date +%Y%m%d-%H%M%S)"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour logger les messages
log() {
  local msg="$1"
  local level="$2"
  local color="$NC"
  
  case "$level" in
    "INFO") color="$BLUE" ;;
    "SUCCESS") color="$GREEN" ;;
    "WARNING") color="$YELLOW" ;;
    "ERROR") color="$RED" ;;
  esac
  
  echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $msg${NC}" | tee -a "$LOG_FILE"
}

# Créer le fichier de log
mkdir -p "$(dirname "$LOG_FILE")"
echo "===== JOURNAL DE MIGRATION DES ANCIENS DOSSIERS =====" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"

# Créer un répertoire de sauvegarde
log "Création du répertoire de sauvegarde: $BACKUP_DIR" "INFO"
mkdir -p "$BACKUP_DIR"

# 1. Migration du dossier agents
if [ -d "$ROOT_DIR/agents" ]; then
  log "Migration du dossier agents..." "INFO"
  
  # Sauvegarde du dossier agents
  log "Sauvegarde du dossier agents dans $BACKUP_DIR/agents" "INFO"
  cp -r "$ROOT_DIR/agents" "$BACKUP_DIR/"
  
  # Migrer le contenu de agents/integration vers packages/agents/integration
  if [ -d "$ROOT_DIR/agents/integration" ]; then
    log "Migration de agents/integration vers packages/agents/integration" "INFO"
    mkdir -p "$ROOT_DIR/packages/agents/integration"
    cp -r "$ROOT_DIR/agents/integration/"* "$ROOT_DIR/packages/agents/integration/"
    
    # Créer un fichier index.ts dans le nouveau dossier s'il n'existe pas
    if [ ! -f "$ROOT_DIR/packages/agents/integration/index.ts" ]; then
      log "Création du fichier index.ts dans packages/agents/integration" "INFO"
      echo '/**
 * Module d'intégration des agents
 * Ce module fournit des intégrations pour différents systèmes et services
 */

// Exporter tous les composants du module integration
export * from "./types";
export * from "./connectors";
export * from "./adapters";
' > "$ROOT_DIR/packages/agents/integration/index.ts"
    fi
    
    # Créer un fichier de redirection dans l'ancien emplacement
    log "Création d'un fichier de redirection dans l'ancien dossier agents/integration" "INFO"
    echo '/**
 * @deprecated Ce module est déprécié et sera supprimé dans une version future.
 * Utilisez @packages/agents/integration à la place.
 */

export * from "@packages/agents/integration";

// Affiche un avertissement de dépréciation lors de l'import
console.warn(
  "Le module agents/integration est déprécié et sera supprimé. " +
  "Utilisez @packages/agents/integration à la place."
);
' > "$ROOT_DIR/agents/integration/index.ts"
  fi
fi

# 2. Migration du dossier orchestrators
if [ -d "$ROOT_DIR/orchestrators" ]; then
  log "Migration du dossier orchestrators..." "INFO"
  
  # Sauvegarde du dossier orchestrators
  log "Sauvegarde du dossier orchestrators dans $BACKUP_DIR/orchestrators" "INFO"
  cp -r "$ROOT_DIR/orchestrators" "$BACKUP_DIR/"
  
  # Créer la structure dans packages/orchestration si elle n'existe pas
  mkdir -p "$ROOT_DIR/packages/orchestration/providers"
  
  # Migrer chaque fichier spécifique
  for file in bullmq.ts n8n.ts temporal.ts types.ts; do
    if [ -f "$ROOT_DIR/orchestrators/$file" ]; then
      log "Migration de orchestrators/$file vers packages/orchestration/providers/$(basename $file .ts).ts" "INFO"
      cp "$ROOT_DIR/orchestrators/$file" "$ROOT_DIR/packages/orchestration/providers/$(basename $file .ts).ts"
    fi
  done
  
  # Traitement spécifique pour index.ts
  if [ -f "$ROOT_DIR/orchestrators/index.ts" ]; then
    log "Migration de orchestrators/index.ts vers packages/orchestration/providers/index.ts" "INFO"
    cp "$ROOT_DIR/orchestrators/index.ts" "$ROOT_DIR/packages/orchestration/providers/index.ts"
    
    # Mise à jour des imports dans le nouveau fichier providers/index.ts
    sed -i 's/\.\/bullmq/\.\/bullmq/g' "$ROOT_DIR/packages/orchestration/providers/index.ts"
    sed -i 's/\.\/n8n/\.\/n8n/g' "$ROOT_DIR/packages/orchestration/providers/index.ts"
    sed -i 's/\.\/temporal/\.\/temporal/g' "$ROOT_DIR/packages/orchestration/providers/index.ts"
    sed -i 's/\.\/types/\.\/types/g' "$ROOT_DIR/packages/orchestration/providers/index.ts"
  fi
  
  # Migrer package.json s'il existe
  if [ -f "$ROOT_DIR/orchestrators/package.json" ]; then
    log "Migration de orchestrators/package.json vers packages/orchestration/package.json" "INFO"
    cp "$ROOT_DIR/orchestrators/package.json" "$ROOT_DIR/packages/orchestration/package.json"
  fi
  
  # Mettre à jour l'index.ts principal de packages/orchestration pour exporter les providers
  log "Mise à jour de packages/orchestration/index.ts pour exporter les providers" "INFO"
  if grep -q "export \* from './providers'" "$ROOT_DIR/packages/orchestration/index.ts"; then
    log "L'export des providers existe déjà dans packages/orchestration/index.ts" "INFO"
  else
    log "Ajout de l'export des providers dans packages/orchestration/index.ts" "INFO"
    echo "
// Export des providers d'orchestration
export * from './providers';" >> "$ROOT_DIR/packages/orchestration/index.ts"
  fi
  
  # Créer un fichier de redirection dans l'ancien emplacement
  log "Création d'un fichier de redirection dans l'ancien dossier orchestrators" "INFO"
  echo '/**
 * @deprecated Ce module est déprécié et sera supprimé dans une version future.
 * Utilisez @packages/orchestration à la place.
 */

export * from "@packages/orchestration/providers";

// Affiche un avertissement de dépréciation lors de l'import
console.warn(
  "Le module orchestrators est déprécié et sera supprimé. " +
  "Utilisez @packages/orchestration à la place."
);
' > "$ROOT_DIR/orchestrators/index.ts"
fi

log "Migration terminée avec succès!" "SUCCESS"
log "Les anciens dossiers ont été sauvegardés dans: $BACKUP_DIR" "INFO"
log "Des fichiers de redirection ont été créés pour assurer la compatibilité pendant la transition." "INFO"
log "Pour finaliser la migration, mettez à jour les imports dans votre code pour utiliser les nouveaux chemins." "INFO"