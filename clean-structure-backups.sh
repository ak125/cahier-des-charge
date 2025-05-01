#!/bin/bash

# Définition des couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Nettoyage des dossiers de sauvegarde ===${NC}"

# Compter les dossiers de sauvegarde avant nettoyage
BACKUP_COUNT=$(find /workspaces/pipelineakai/structure -path "*/backup-*" -type d | wc -l)

if [ $BACKUP_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ Aucun dossier de sauvegarde trouvé dans le dossier structure/. Rien à nettoyer.${NC}"
  echo -e "${YELLOW}=== Fin du nettoyage des dossiers de sauvegarde ===${NC}"
  exit 0
fi

echo "Trouvé $BACKUP_COUNT dossiers de sauvegarde à supprimer."
echo "Liste des dossiers de sauvegarde :"
find /workspaces/pipelineakai/structure -path "*/backup-*" -type d | sort

echo "Suppression des dossiers de sauvegarde en cours..."

# Supprimer tous les dossiers de sauvegarde
find /workspaces/pipelineakai/structure -path "*/backup-*" -type d -exec rm -rf {} \; 2>/dev/null || true

# Vérifier qu'il ne reste plus de dossiers de sauvegarde
REMAINING=$(find /workspaces/pipelineakai/structure -path "*/backup-*" -type d | wc -l)

if [ $REMAINING -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les dossiers de sauvegarde ont été supprimés avec succès.${NC}"
  echo "Espace disque libéré."
else
  echo -e "${RED}❌ Il reste encore $REMAINING dossiers de sauvegarde qui n'ont pas pu être supprimés.${NC}"
  echo "Voici les dossiers restants :"
  find /workspaces/pipelineakai/structure -path "*/backup-*" -type d | sort
  echo "Veuillez vérifier les permissions des dossiers."
fi

echo -e "${YELLOW}=== Fin du nettoyage des dossiers de sauvegarde ===${NC}"