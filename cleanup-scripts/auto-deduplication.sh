#!/bin/bash

# Script pour exécuter la consolidation des doublons automatiquement (sans confirmation)
# Idéal pour les pipelines CI/CD
# Auteur: GitHub Copilot
# Date: 7 mai 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Consolidation automatique des doublons ===${NC}"
echo -e "${YELLOW}Mode automatique - Aucune confirmation ne sera demandée${NC}"
echo

# Créer une sauvegarde des fichiers qui seront modifiés
BACKUP_DIR="/workspaces/cahier-des-charge/backup/auto-deduplication-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Création d'une copie de sauvegarde des fichiers...${NC}"
cp -R /workspaces/cahier-des-charge/cleanup-report "$BACKUP_DIR/"
echo -e "${GREEN}✅ Sauvegarde créée dans: $BACKUP_DIR${NC}"

echo -e "${YELLOW}Exécution de la consolidation des doublons...${NC}"
node /workspaces/cahier-des-charge/cleanup-scripts/deep-deduplication-analyzer.js

# Journal des résultats pour référence
REPORT_FILE="$BACKUP_DIR/execution-report.txt"
echo "Exécution de la consolidation automatique des doublons" > "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "Sauvegarde: $BACKUP_DIR" >> "$REPORT_FILE"

echo
echo -e "${GREEN}=== Consolidation terminée ===${NC}"
echo -e "${BLUE}Rapport de consolidation sauvegardé dans:${NC} $REPORT_FILE"
echo -e "${YELLOW}Sauvegarde des fichiers disponible dans:${NC} $BACKUP_DIR"