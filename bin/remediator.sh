#!/bin/bash
# Script pour exécuter l'agent de remédiation automatique

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier le nombre d'arguments
if [ "$#" -eq 0 ]; then
  echo -e "${RED}Erreur: Aucun argument fourni${NC}"
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --file=<fichier.php>        : Corriger un fichier PHP spécifique"
  echo "  --dir=<répertoire>          : Corriger tous les fichiers dans un répertoire"
  echo "  --batch                     : Mode batch (correction de tous les fichiers divergents)"
  echo "  --result=<chemin>           : Utiliser un résultat de vérification spécifique"
  echo "  --dry-run                   : Mode simulation (sans modification de fichiers)"
  echo "  --report                    : Générer un rapport HTML"
  echo "  --max-concurrent=<nombre>   : Nombre maximum de corrections simultanées"
  echo "  --force                     : Forcer la réécriture même si le fichier existe"
  exit 1
fi

# Variables par défaut
FILE=""
DIRECTORY=""
BATCH_MODE=false
RESULT_PATH=""
DRY_RUN=false
GENERATE_REPORT=false
MAX_CONCURRENT=5
FORCE_OVERWRITE=false

# Traiter les arguments
for arg in "$@"; do
  case $arg in
    --file=*)
      FILE="${arg#*=}"
      ;;
    --dir=*)
      DIRECTORY="${arg#*=}"
      ;;
    --batch)
      BATCH_MODE=true
      ;;
    --result=*)
      RESULT_PATH="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --report)
      GENERATE_REPORT=true
      ;;
    --max-concurrent=*)
      MAX_CONCURRENT="${arg#*=}"
      ;;
    --force)
      FORCE_OVERWRITE=true
      ;;
    *)
      echo -e "${RED}Option non reconnue: $arg${NC}"
      exit 1
      ;;
  esac
done

# Construire le contexte JSON
JSON_CONTEXT="{"
if [ -n "$FILE" ]; then
  JSON_CONTEXT+="\"file\": \"$FILE\", "
fi
if [ -n "$DIRECTORY" ]; then
  JSON_CONTEXT+="\"directory\": \"$DIRECTORY\", "
fi
if [ "$BATCH_MODE" = true ]; then
  JSON_CONTEXT+="\"batchMode\": true, "
fi
if [ -n "$RESULT_PATH" ]; then
  JSON_CONTEXT+="\"verificationResultPath\": \"$RESULT_PATH\", "
fi
if [ "$DRY_RUN" = true ]; then
  JSON_CONTEXT+="\"dryRun\": true, "
fi
if [ "$GENERATE_REPORT" = true ]; then
  JSON_CONTEXT+="\"generateReport\": true, "
fi
JSON_CONTEXT+="\"maxConcurrent\": $MAX_CONCURRENT, "
if [ "$FORCE_OVERWRITE" = true ]; then
  JSON_CONTEXT+="\"forceOverwrite\": true"
else
  # Supprimer la dernière virgule et espace
  JSON_CONTEXT="${JSON_CONTEXT%, }"
fi
JSON_CONTEXT+="}"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}      Agent de Remédiation Automatique              ${NC}"
echo -e "${BLUE}=====================================================${NC}"

echo -e "${GREEN}📄 Configuration:${NC}"
if [ -n "$FILE" ]; then
  echo -e "  Fichier à corriger: ${YELLOW}$FILE${NC}"
fi
if [ -n "$DIRECTORY" ]; then
  echo -e "  Répertoire à traiter: ${YELLOW}$DIRECTORY${NC}"
fi
if [ "$BATCH_MODE" = true ]; then
  echo -e "  Mode batch: ${YELLOW}Activé${NC}"
fi
if [ -n "$RESULT_PATH" ]; then
  echo -e "  Résultat de vérification: ${YELLOW}$RESULT_PATH${NC}"
fi
if [ "$DRY_RUN" = true ]; then
  echo -e "  Mode simulation: ${YELLOW}Activé${NC}"
fi
if [ "$GENERATE_REPORT" = true ]; then
  echo -e "  Génération de rapport: ${YELLOW}Activée${NC}"
fi
echo -e "  Corrections simultanées: ${YELLOW}$MAX_CONCURRENT${NC}"
if [ "$FORCE_OVERWRITE" = true ]; then
  echo -e "  Force réécriture: ${YELLOW}Activée${NC}"
fi
echo -e "${BLUE}=====================================================${NC}"

# Exécuter l'agent
echo -e "${GREEN}🚀 Exécution de l'agent de remédiation...${NC}"
OUTPUT=$(pnpm tsx agents/migration/remediator.ts "$JSON_CONTEXT" 2>&1)
EXIT_CODE=$?

# Afficher la sortie
echo "$OUTPUT"

# Vérifier si un rapport a été généré
if [ "$GENERATE_REPORT" = true ] && [ "$EXIT_CODE" -eq 0 ]; then
  REPORT_PATH="reports/remediation_summary.html"
  if [ -f "$REPORT_PATH" ]; then
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${GREEN}📊 Rapport de remédiation généré: $(realpath $REPORT_PATH)${NC}"
  fi
fi

# Résumé des résultats
echo -e "${BLUE}=====================================================${NC}"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${GREEN}✅ Remédiation terminée avec succès${NC}"
else
  echo -e "${RED}❌ Remédiation terminée avec des erreurs (code: $EXIT_CODE)${NC}"
fi
echo -e "${BLUE}=====================================================${NC}"

exit $EXIT_CODE