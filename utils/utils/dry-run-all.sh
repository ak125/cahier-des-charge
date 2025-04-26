#!/bin/bash

# Script pour exécuter tous les scripts en mode dry run et générer un rapport
# Cela permet de simuler les opérations sans effectuer de modifications

set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Date et heure pour le rapport
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="./logs"
REPORT_FILE="$REPORT_DIR/dry-run-report-$TIMESTAMP.md"

# Créer le répertoire des logs s'il n'existe pas
mkdir -p "$REPORT_DIR"

# Initialiser le rapport
echo "# Rapport d'exécution en dry run (simulation)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Résumé des exécutions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Scripts à exécuter
SCRIPTS=(
  "update-cahier.sh"
  "verify-cahier.sh"
  "deduplicate-files.sh"
  "analyze-similarity.sh"
  "render-html.sh"
)

echo -e "${BLUE}🔍 Exécution de tous les scripts en mode dry run...${NC}"

# Vérifier si chaque script existe et l'exécuter
for script in "${SCRIPTS[@]}"; do
  SCRIPT_PATH="./scripts/$script"
  
  echo -e "\n${CYAN}================================================${NC}"
  echo -e "${BLUE}🔄 Exécution de $script en dry run...${NC}"
  echo -e "${CYAN}================================================${NC}"
  
  # Vérifier si le script existe
  if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}❌ Script non trouvé: $SCRIPT_PATH${NC}"
    
    # Ajouter au rapport
    echo "### ❌ $script" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**ERREUR**: Script non trouvé" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    continue
  fi
  
  # Rendre le script exécutable si nécessaire
  if [ ! -x "$SCRIPT_PATH" ]; then
    chmod +x "$SCRIPT_PATH"
    echo -e "${YELLOW}⚠️ Script rendu exécutable: $SCRIPT_PATH${NC}"
  fi
  
  # Créer un fichier temporaire pour la sortie
  TEMP_OUTPUT=$(mktemp)
  
  # Exécuter le script avec l'option --dry-run et la variable d'environnement DRY_RUN=true
  echo -e "${GREEN}🔍 Simulation de $script...${NC}"
  
  # Exporter la variable d'environnement DRY_RUN
  export DRY_RUN=true
  
  # Exécuter le script et capturer la sortie et le code de retour
  if $SCRIPT_PATH --dry-run > "$TEMP_OUTPUT" 2>&1; then
    STATUS="✅ Succès"
    STATUS_COLOR="$GREEN"
  else
    STATUS="❌ Échec"
    STATUS_COLOR="$RED"
  fi
  
  # Afficher les premières lignes de la sortie
  echo -e "${STATUS_COLOR}$STATUS${NC}"
  echo -e "${YELLOW}Aperçu de la sortie:${NC}"
  head -n 10 "$TEMP_OUTPUT"
  echo -e "${YELLOW}[...]${NC}"
  
  # Ajouter au rapport
  echo "### $STATUS $script" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  {
    echo '```'
    cat "$TEMP_OUTPUT"
    echo '```'
    echo ""
  } >> "$REPORT_FILE"
  
  # Nettoyer
  rm "$TEMP_OUTPUT"
done

echo -e "\n${BLUE}📊 Résumé:${NC}"
echo -e "${GREEN}✅ Rapport d'exécution en dry run généré: $REPORT_FILE${NC}"

# Ajouter une conclusion au rapport
echo "## Conclusion" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Ce rapport montre la simulation de l'exécution de tous les scripts sans effectuer de modifications réelles." >> "$REPORT_FILE"
echo "Utilisez-le pour anticiper les changements qui seraient effectués lors d'une exécution normale." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Pour exécuter les scripts en mode normal, lancez-les sans l'option --dry-run." >> "$REPORT_FILE"

echo -e "\n${BLUE}💡 Pour consulter le rapport complet, ouvrez:${NC}"
echo -e "${CYAN}$REPORT_FILE${NC}"
