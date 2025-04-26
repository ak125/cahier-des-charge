#!/bin/bash

# Script pour générer les plans de migration pour tous les fichiers PHP audités
# Utilisation: ./scripts/batch-generate-migration-plans.sh [--dry-run]

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier le mode dry run
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}[Mode simulation] Aucune modification ne sera effectuée${NC}"
fi

echo -e "${BLUE}🚀 Génération des plans de migration...${NC}"

# Chercher tous les fichiers PHP qui ont un audit associé
AUDIT_FILES=$(find ./cahier-des-charges -name "*.audit.md")

if [ -z "$AUDIT_FILES" ]; then
  echo -e "${YELLOW}⚠️ Aucun fichier d'audit trouvé.${NC}"
  exit 0
fi

# Compter les fichiers
TOTAL_FILES=$(echo "$AUDIT_FILES" | wc -l)
echo -e "${BLUE}📂 Fichiers d'audit trouvés: $TOTAL_FILES${NC}"

# Traiter chaque fichier d'audit
PROCESSED=0
ERRORS=0

for audit_file in $AUDIT_FILES; do
  # Extraire le nom de base du fichier
  base_name=$(basename "$audit_file" .audit.md)
  
  # Construire le chemin du fichier PHP (peut être fictif)
  php_file="./cahier-des-charges/src/$base_name"
  
  echo -e "${BLUE}📄 Traitement de $base_name...${NC}"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[Simulation] Génération du plan de migration pour $base_name${NC}"
  else
    # Exécuter le générateur de plan de migration
    if node ./agents/generate-migration-plan.ts "$php_file" 2>/dev/null; then
      echo -e "${GREEN}✅ Plan de migration généré pour $base_name${NC}"
      PROCESSED=$((PROCESSED + 1))
    else
      echo -e "${RED}❌ Erreur lors de la génération du plan pour $base_name${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# Afficher le résumé
echo -e "\n${BLUE}📊 Résumé de la génération${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[Simulation] $TOTAL_FILES fichiers auraient été traités${NC}"
else
  echo -e "${GREEN}✅ $PROCESSED plans de migration générés avec succès${NC}"
  if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ $ERRORS erreurs rencontrées${NC}"
  fi
fi

echo -e "\n${BLUE}🏁 Terminé !${NC}"
