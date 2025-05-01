#!/bin/bash

# Script de nettoyage des fichiers de sauvegarde
# Créé le 1er mai 2025

# Définition des couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Début du nettoyage des fichiers de sauvegarde ===${NC}"
echo "Recherche des fichiers de sauvegarde..."

# Comptage des fichiers à supprimer
BACKUP_COUNT=$(find /workspaces/pipelineakai -type f \( -name "*.bak*" -o -name "*.backup*" -o -name "*.merged*" -o -name "*.orig" -o -name "*~" \) | wc -l)

echo "Nombre de fichiers de sauvegarde trouvés: $BACKUP_COUNT"

if [ $BACKUP_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ Aucun fichier de sauvegarde trouvé. Le workspace est propre.${NC}"
  echo -e "${YELLOW}=== Fin du nettoyage des fichiers de sauvegarde ===${NC}"
  exit 0
fi

echo "Suppression des fichiers de sauvegarde en cours..."

# Supprimer les fichiers avec confirmation
find /workspaces/pipelineakai -type f \( -name "*.bak*" -o -name "*.backup*" -o -name "*.merged*" -o -name "*.orig" -o -name "*~" \) -exec rm -f {} \;

# Vérification après suppression
REMAINING=$(find /workspaces/pipelineakai -type f \( -name "*.bak*" -o -name "*.backup*" -o -name "*.merged*" -o -name "*.orig" -o -name "*~" \) | wc -l)

if [ $REMAINING -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les fichiers de sauvegarde ont été supprimés avec succès.${NC}"
  echo "Espace disque libéré."
else
  echo -e "${RED}⚠️ $REMAINING fichiers n'ont pas pu être supprimés. Ils pourraient être verrouillés ou nécessiter des permissions supplémentaires.${NC}"
  echo "Essayez d'exécuter le script avec sudo si nécessaire."
fi

echo -e "${YELLOW}=== Fin du nettoyage des fichiers de sauvegarde ===${NC}"