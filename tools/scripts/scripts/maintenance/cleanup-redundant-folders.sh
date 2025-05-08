#!/bin/bash

# Script pour nettoyer les dossiers redondants et imbriqués

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Nettoyage des dossiers redondants ===${NC}"

# 1. Supprimer les structures imbriquées de cahier-des-charge
echo -e "${YELLOW}Traitement des structures imbriquées de cahier-des-charge...${NC}"
if [ -d "/workspaces/cahier-des-charge/cahier-des-charge" ]; then
  echo "Structure imbriquée détectée : /workspaces/cahier-des-charge/cahier-des-charge"
  echo "Suppression en cours..."
  rm -rf "/workspaces/cahier-des-charge/cahier-des-charge"
  echo -e "${GREEN}✅ Structure imbriquée supprimée${NC}"
else
  echo -e "${GREEN}✅ Pas de structure imbriquée détectée${NC}"
fi

# 2. Supprimer les dossiers tmp et temp
echo -e "${YELLOW}Suppression des dossiers temporaires...${NC}"
find /workspaces/cahier-des-charge -type d -name "tmp" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm -rf {} \; 2>/dev/null || true
find /workspaces/cahier-des-charge -type d -name "temp" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm -rf {} \; 2>/dev/null || true
echo -e "${GREEN}✅ Dossiers temporaires nettoyés${NC}"

# 3. Nettoyer les backups redondants
echo -e "${YELLOW}Nettoyage des backups redondants...${NC}"
if [ -d "/workspaces/cahier-des-charge/clean-structure-backups" ]; then
  echo "Suppression du dossier clean-structure-backups"
  rm -rf "/workspaces/cahier-des-charge/clean-structure-backups"
fi

# Garder uniquement les backups récents (moins de 30 jours)
if [ -d "/workspaces/cahier-des-charge/backups" ]; then
  echo "Nettoyage des anciens backups (> 30 jours)"
  find /workspaces/cahier-des-charge/backups -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
fi

echo -e "${GREEN}✅ Backups redondants nettoyés${NC}"

# 4. Nettoyer les logs anciens
echo -e "${YELLOW}Nettoyage des logs anciens...${NC}"
if [ -d "/workspaces/cahier-des-charge/logs" ]; then
  echo "Nettoyage des logs anciens (> 14 jours)"
  find /workspaces/cahier-des-charge/logs -name "*.log" -type f -mtime +14 -delete 2>/dev/null || true
fi
if [ -d "/workspaces/cahier-des-charge/consolidation-logs" ]; then
  echo "Nettoyage des logs de consolidation anciens (> 14 jours)"
  find /workspaces/cahier-des-charge/consolidation-logs -name "*.log" -type f -mtime +14 -delete 2>/dev/null || true
fi
echo -e "${GREEN}✅ Logs anciens nettoyés${NC}"

# 5. Nettoyage des scripts redondants
echo -e "${YELLOW}Nettoyage des scripts redondants...${NC}"
if [ -d "/workspaces/cahier-des-charge/utils/backup_scripts" ]; then
  echo "Suppression des scripts de backup redondants"
  rm -rf "/workspaces/cahier-des-charge/utils/backup_scripts"
fi
if [ -d "/workspaces/cahier-des-charge/utils/backup_tools" ]; then
  echo "Suppression des outils de backup redondants"
  rm -rf "/workspaces/cahier-des-charge/utils/backup_tools"
fi
if [ -d "/workspaces/cahier-des-charge/scripts/backup-shell" ]; then
  echo "Suppression des scripts shell de backup redondants"
  rm -rf "/workspaces/cahier-des-charge/scripts/backup-shell"
fi
echo -e "${GREEN}✅ Scripts redondants nettoyés${NC}"

echo -e "${BLUE}=== Nettoyage des dossiers redondants terminé ===${NC}"
