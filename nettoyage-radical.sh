#!/bin/bash
# Script de nettoyage radical pour supprimer tous les fichiers de sauvegarde, rapports et archives
# Date: 10 mai 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}=== NETTOYAGE RADICAL DES FICHIERS DE SAUVEGARDE ET RAPPORTS ===${NC}"
echo -e "${YELLOW}ATTENTION: Cette opération va supprimer définitivement tous les fichiers de sauvegarde et rapports.${NC}"
echo -e "${YELLOW}Assurez-vous que votre projet fonctionne correctement avant de continuer.${NC}"
echo

# Demander confirmation
read -p "Êtes-vous sûr de vouloir procéder au nettoyage radical ? (o/N) " confirmation
if [[ "$confirmation" != "o" && "$confirmation" != "O" ]]; then
    echo -e "${GREEN}Opération annulée.${NC}"
    exit 0
fi

# Variables pour suivre le nombre de fichiers et l'espace libéré
BEFORE_SIZE=$(du -sh /workspaces/cahier-des-charge | awk '{print $1}')
START_TIME=$(date +%s)

echo -e "\n${YELLOW}Suppression des dossiers de sauvegarde...${NC}"
find /workspaces/cahier-des-charge/backup -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} \;
mkdir -p /workspaces/cahier-des-charge/backup/.keep

echo -e "\n${YELLOW}Suppression des archives...${NC}"
find /workspaces/cahier-des-charge/archives_old -mindepth 1 -type d -exec rm -rf {} \;
mkdir -p /workspaces/cahier-des-charge/archives_old/.keep

echo -e "\n${YELLOW}Suppression des rapports...${NC}"
find /workspaces/cahier-des-charge/reports -type f -not -path "*/node_modules/*" -exec rm -f {} \;
mkdir -p /workspaces/cahier-des-charge/reports/.keep

echo -e "\n${YELLOW}Suppression des rapports de nettoyage...${NC}"
find /workspaces/cahier-des-charge/cleanup-report -type f -exec rm -f {} \;
mkdir -p /workspaces/cahier-des-charge/cleanup-report/.keep

echo -e "\n${YELLOW}Nettoyage des fichiers temporaires...${NC}"
find /workspaces/cahier-des-charge -type f -name "*.log" -o -name "*.tmp" -o -name "temp-*" -o -name "*.temp" -not -path "*/node_modules/*" -not -path "*/dist/*" -exec rm -f {} \;

# Calculer l'espace libéré
AFTER_SIZE=$(du -sh /workspaces/cahier-des-charge | awk '{print $1}')
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${GREEN}=== NETTOYAGE TERMINÉ ===${NC}"
echo -e "Taille avant: ${YELLOW}$BEFORE_SIZE${NC}"
echo -e "Taille après: ${YELLOW}$AFTER_SIZE${NC}"
echo -e "Temps écoulé: ${YELLOW}$DURATION secondes${NC}"
echo
echo -e "${GREEN}Votre espace de travail est maintenant propre et débarrassé de tous les fichiers de sauvegarde et rapports.${NC}"
echo -e "${YELLOW}N'oubliez pas de faire un commit Git si votre projet est sous contrôle de version.${NC}"
