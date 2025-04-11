#!/bin/bash

# Script de vérification du cahier des charges
# Ce script analyse l'intégrité et la cohérence du cahier des charges

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vérification du cahier des charges...${NC}"

# Vérifier l'existence du répertoire cahier-des-charges
if [ ! -d "cahier-des-charges" ]; then
  echo -e "${RED}❌ Le répertoire 'cahier-des-charges' n'existe pas.${NC}"
  exit 1
fi

# Vérifier le fichier de sommaire
if [ ! -f "cahier-des-charges/00-sommaire.md" ]; then
  echo -e "${RED}❌ Le fichier de sommaire '00-sommaire.md' est manquant.${NC}"
  exit 1
fi

# Extraire les liens du sommaire
echo -e "${BLUE}📋 Vérification des liens dans le sommaire...${NC}"
LINKS=$(grep -oP '\[.*?\]\((.*?)\)' "cahier-des-charges/00-sommaire.md" | grep -oP '\(.*?\)' | tr -d '()')

# Variables pour le comptage
TOTAL_LINKS=0
BROKEN_LINKS=0
EXISTING_LINKS=0

# Vérifier chaque lien
for link in $LINKS; do
  TOTAL_LINKS=$((TOTAL_LINKS+1))
  FULL_PATH="cahier-des-charges/$link"
  
  if [ -f "$FULL_PATH" ]; then
    EXISTING_LINKS=$((EXISTING_LINKS+1))
  else
    echo -e "${YELLOW}⚠️ Lien cassé: $link${NC}"
    BROKEN_LINKS=$((BROKEN_LINKS+1))
  fi
done

# Afficher le résumé des liens
echo -e "${BLUE}📊 Résumé des liens:${NC}"
echo -e "- Total des liens: $TOTAL_LINKS"
echo -e "- Liens valides: $EXISTING_LINKS"
echo -e "- Liens cassés: $BROKEN_LINKS"

# Vérifier la structure des fichiers du cahier des charges
echo -e "${BLUE}🔍 Vérification de la structure des fichiers...${NC}"

# Nombre de fichiers markdown
MD_FILES=$(find "cahier-des-charges" -name "*.md" | wc -l)
echo -e "- Fichiers markdown: $MD_FILES"

# Vérifier la numérotation des fichiers
echo -e "${BLUE}🔢 Vérification de la numérotation des fichiers...${NC}"
NUMBERED_FILES=$(find "cahier-des-charges" -name "[0-9]*.md" | sort)
PREV_NUM=0
NUM_ERRORS=0

for file in $NUMBERED_FILES; do
  BASENAME=$(basename "$file")
  if [[ $BASENAME =~ ^([0-9]+) ]]; then
    NUM=${BASH_REMATCH[1]}
    if (( NUM != PREV_NUM+1 )) && (( PREV_NUM != 0 )); then
      echo -e "${YELLOW}⚠️ Incohérence de numérotation: $BASENAME (attendu: $(printf "%02d" $((PREV_NUM+1))))${NC}"
      NUM_ERRORS=$((NUM_ERRORS+1))
    fi
    PREV_NUM=$NUM
  fi
done

if [ $NUM_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Numérotation cohérente.${NC}"
else
  echo -e "${YELLOW}⚠️ $NUM_ERRORS incohérences de numérotation détectées.${NC}"
fi

# Vérifier les scripts associés
echo -e "${BLUE}🔧 Vérification des scripts d'automatisation...${NC}"
REQUIRED_SCRIPTS=("update-cahier.sh" "manage-cahier.sh" "setup-cahier.sh")
SCRIPT_ERRORS=0

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "$script" ]; then
    echo -e "${RED}❌ Script manquant: $script${NC}"
    SCRIPT_ERRORS=$((SCRIPT_ERRORS+1))
  elif [ ! -x "$script" ]; then
    echo -e "${YELLOW}⚠️ Script sans permission d'exécution: $script${NC}"
    SCRIPT_ERRORS=$((SCRIPT_ERRORS+1))
  fi
done

if [ $SCRIPT_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Scripts d'automatisation disponibles et exécutables.${NC}"
fi

# Vérifier les agents IA
echo -e "${BLUE}🤖 Vérification des agents IA...${NC}"
if [ ! -d "agents" ]; then
  echo -e "${RED}❌ Le répertoire 'agents' est manquant.${NC}"
else
  TS_AGENTS=$(find "agents" -name "*.ts" | wc -l)
  echo -e "- Agents TypeScript: $TS_AGENTS"
  
  # Vérifier la présence de Node.js et ts-node
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé. Les agents IA ne peuvent pas s'exécuter.${NC}"
  elif ! command -v npx ts-node &> /dev/null; then
    echo -e "${YELLOW}⚠️ ts-node n'est pas installé. Les agents IA pourraient ne pas s'exécuter correctement.${NC}"
    echo -e "   Exécutez: npm install -g typescript ts-node"
  else
    echo -e "${GREEN}✅ Environnement Node.js disponible pour les agents IA.${NC}"
  fi
fi

# Vérification du module generate-migration-plan.ts
AGENT_PATH="agents/generate-migration-plan.ts"
if [ -f "$AGENT_PATH" ]; then
  echo -e "${BLUE}🔍 Test de l'agent generate-migration-plan.ts...${NC}"
  if npx ts-node "$AGENT_PATH" --test &> /dev/null; then
    echo -e "${GREEN}✅ L'agent generate-migration-plan.ts est fonctionnel.${NC}"
  else
    echo -e "${YELLOW}⚠️ L'agent generate-migration-plan.ts a rencontré des erreurs lors du test.${NC}"
    echo -e "   Vérifiez les dépendances et assurez-vous que TypeScript est correctement configuré."
  fi
fi

# Conclusion
if [ $BROKEN_LINKS -eq 0 ] && [ $NUM_ERRORS -eq 0 ] && [ $SCRIPT_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Vérification du cahier des charges terminée avec succès.${NC}"
else
  echo -e "${YELLOW}⚠️ Vérification terminée avec des problèmes à corriger.${NC}"
fi

exit 0