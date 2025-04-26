#!/bin/bash
# batch-generate-migration-plans.sh
# 
# Script pour générer des plans de migration en lot pour plusieurs fichiers PHP
#
# Usage: 
#   ./batch-generate-migration-plans.sh <répertoire-php> [--export-all] [--inject-supabase]
#
# Exemple:
#   ./batch-generate-migration-plans.sh /chemin/vers/sources/php --export-all
#
# Date: 11 avril 2025

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier les arguments
if [ $# -lt 1 ]; then
  echo -e "${RED}Erreur: Le répertoire source PHP est requis${NC}"
  echo "Usage: $0 <répertoire-php> [--export-all] [--inject-supabase]"
  exit 1
fi

# Récupérer les arguments
PHP_DIR=$1
shift
OPTIONS=$@

# Vérifier si le répertoire existe
if [ ! -d "$PHP_DIR" ]; then
  echo -e "${RED}Erreur: Le répertoire '$PHP_DIR' n'existe pas${NC}"
  exit 1
fi

# Créer un répertoire pour les résultats
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="migration-plans-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}=== Génération de plans de migration en lot ===${NC}"
echo -e "${BLUE}Source: $PHP_DIR${NC}"
echo -e "${BLUE}Résultats: $RESULTS_DIR${NC}"
echo -e "${BLUE}Options: $OPTIONS${NC}"

# Trouver tous les fichiers PHP
PHP_FILES=$(find "$PHP_DIR" -type f -name "*.php")
TOTAL_FILES=$(echo "$PHP_FILES" | wc -l)

if [ "$TOTAL_FILES" -eq 0 ]; then
  echo -e "${YELLOW}Aucun fichier PHP trouvé dans $PHP_DIR${NC}"
  exit 0
fi

echo -e "${BLUE}Fichiers PHP trouvés: $TOTAL_FILES${NC}"
echo ""

# Générer un rapport récapitulatif
SUMMARY_FILE="$RESULTS_DIR/migration-summary.md"
echo "# Résumé des plans de migration" > "$SUMMARY_FILE"
echo "Date: $(date '+%d/%m/%Y à %H:%M:%S')" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Statistiques" >> "$SUMMARY_FILE"
echo "- Total des fichiers analysés: $TOTAL_FILES" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Plans générés" >> "$SUMMARY_FILE"
echo "| Fichier | Type | Score | Vague | Priorité |" >> "$SUMMARY_FILE"
echo "|---------|------|-------|-------|----------|" >> "$SUMMARY_FILE"

# Traiter chaque fichier PHP
COUNTER=0
SUCCESS=0

for PHP_FILE in $PHP_FILES; do
  COUNTER=$((COUNTER+1))
  FILE_NAME=$(basename "$PHP_FILE")
  
  echo -e "${BLUE}[$COUNTER/$TOTAL_FILES] Traitement de $FILE_NAME...${NC}"
  
  # Exécuter le script de génération du plan de migration
  RESULT=$(cd $(dirname "$0") && npx ts-node generate-migration-plan.ts "$PHP_FILE" $OPTIONS 2>&1)
  
  if [ $? -eq 0 ]; then
    SUCCESS=$((SUCCESS+1))
    
    # Extraire les informations du plan pour le résumé
    WAVE=$(echo "$RESULT" | grep -o "Vague [0-9]" | awk '{print $2}')
    TYPE=$(echo "$RESULT" | grep -o "Type : .*" | sed 's/Type : //')
    SCORE=$(echo "$RESULT" | grep -o "Score global migration : .*" | sed 's/Score global migration : //')
    PRIORITY=""
    
    if [[ "$SCORE" == *"🌟🌟🌟🌟🌟"* ]]; then
      PRIORITY="Critique"
    elif [[ "$SCORE" == *"🌟🌟🌟🌟"* ]]; then
      PRIORITY="Élevée"
    elif [[ "$SCORE" == *"🌟🌟🌟"* ]]; then
      PRIORITY="Moyenne"
    else
      PRIORITY="Basse"
    fi
    
    # Ajouter l'entrée au résumé
    echo "| $FILE_NAME | $TYPE | $SCORE | $WAVE | $PRIORITY |" >> "$SUMMARY_FILE"
    
    echo -e "${GREEN}✅ Plan de migration généré pour $FILE_NAME${NC}"
    
    # Copier les fichiers générés dans le répertoire des résultats
    MD_FILE="${PHP_FILE%.php}.migration_plan.md"
    if [ -f "$MD_FILE" ]; then
      cp "$MD_FILE" "$RESULTS_DIR/"
    fi
    
    JSON_FILE="${PHP_FILE%.php}.backlog.json"
    if [ -f "$JSON_FILE" ]; then
      cp "$JSON_FILE" "$RESULTS_DIR/"
    fi
  else
    echo -e "${RED}❌ Échec de la génération du plan pour $FILE_NAME: $RESULT${NC}"
    echo "| $FILE_NAME | Échec | - | - | - |" >> "$SUMMARY_FILE"
  fi
  
  echo ""
done

# Ajouter les statistiques finales au résumé
echo "" >> "$SUMMARY_FILE"
echo "## Résumé final" >> "$SUMMARY_FILE"
echo "- Fichiers traités avec succès: $SUCCESS / $TOTAL_FILES" >> "$SUMMARY_FILE"
echo "- Taux de réussite: $(( SUCCESS * 100 / TOTAL_FILES ))%" >> "$SUMMARY_FILE"

# Générer des graphiques de répartition (nécessite l'outil de visualisation)
if command -v node > /dev/null && [ -f "$(dirname "$0")/../tools/generate-migration-charts.js" ]; then
  echo -e "${BLUE}Génération des graphiques de visualisation...${NC}"
  node "$(dirname "$0")/../tools/generate-migration-charts.js" "$RESULTS_DIR" "$RESULTS_DIR/charts"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Graphiques générés avec succès dans $RESULTS_DIR/charts/${NC}"
  else
    echo -e "${YELLOW}⚠️ Impossible de générer les graphiques${NC}"
  fi
fi

echo -e "${GREEN}=== Traitement terminé ===${NC}"
echo -e "${GREEN}$SUCCESS/$TOTAL_FILES fichiers traités avec succès${NC}"
echo -e "${GREEN}Résultats disponibles dans: $RESULTS_DIR${NC}"
echo -e "${GREEN}Résumé: $SUMMARY_FILE${NC}"