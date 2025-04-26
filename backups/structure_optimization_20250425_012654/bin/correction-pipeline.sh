#!/bin/bash
# Script pour intégrer l'agent diff-verifier et l'agent remediator dans un pipeline de correction continu

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options par défaut
AUTO_REMEDIATE=true
MAX_ITERATIONS=3
GENERATE_REPORT=true
TARGET=""
TARGET_TYPE=""
BATCH_MODE=false
DRY_RUN=false

# Fonction d'affichage d'aide
show_help() {
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  --file=<fichier.php>      Fichier spécifique à vérifier et corriger"
  echo "  --dir=<répertoire>        Répertoire à vérifier et corriger"
  echo "  --batch                   Mode batch (tous les fichiers avec divergences)"
  echo "  --no-remediate            Désactiver la remédiation automatique"
  echo "  --max-iterations=<n>      Nombre maximum d'itérations (par défaut: 3)"
  echo "  --dry-run                 Mode simulation (sans modification)"
  echo "  --no-report               Ne pas générer de rapport HTML"
  echo "  --help                    Afficher cette aide"
  echo
  echo "Description:"
  echo "  Ce script exécute un pipeline de correction continu qui:"
  echo "  1. Vérifie les divergences avec diff-verifier"
  echo "  2. Applique des corrections automatiques avec remediator"
  echo "  3. Vérifie à nouveau et répète jusqu'à ce que toutes les"
  echo "     divergences soient corrigées ou le nombre max d'itérations atteint"
}

# Traiter les arguments
for arg in "$@"; do
  case $arg in
    --file=*)
      TARGET="${arg#*=}"
      TARGET_TYPE="file"
      ;;
    --dir=*)
      TARGET="${arg#*=}"
      TARGET_TYPE="dir"
      ;;
    --batch)
      BATCH_MODE=true
      ;;
    --no-remediate)
      AUTO_REMEDIATE=false
      ;;
    --max-iterations=*)
      MAX_ITERATIONS="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --no-report)
      GENERATE_REPORT=false
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Option non reconnue: $arg${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Vérifier que les options sont cohérentes
if [[ "$TARGET_TYPE" != "" && "$BATCH_MODE" == true ]]; then
  echo -e "${RED}Erreur: --batch ne peut pas être utilisé avec --file ou --dir${NC}"
  exit 1
fi

if [[ "$TARGET_TYPE" == "" && "$BATCH_MODE" == false ]]; then
  echo -e "${YELLOW}Aucune cible spécifiée, activation du mode batch par défaut${NC}"
  BATCH_MODE=true
fi

# Construire les arguments de base pour les commandes
VERIFIER_ARGS=""
REMEDIATOR_ARGS=""

if [[ "$TARGET_TYPE" == "file" ]]; then
  VERIFIER_ARGS="--file $TARGET"
  REMEDIATOR_ARGS="--file=$TARGET"
elif [[ "$TARGET_TYPE" == "dir" ]]; then
  VERIFIER_ARGS="--dir $TARGET"
  REMEDIATOR_ARGS="--dir=$TARGET"
elif [[ "$BATCH_MODE" == true ]]; then
  VERIFIER_ARGS="--batch"
  REMEDIATOR_ARGS="--batch"
fi

if [[ "$GENERATE_REPORT" == true ]]; then
  VERIFIER_ARGS="$VERIFIER_ARGS --report"
  REMEDIATOR_ARGS="$REMEDIATOR_ARGS --report"
fi

if [[ "$DRY_RUN" == true ]]; then
  REMEDIATOR_ARGS="$REMEDIATOR_ARGS --dry-run"
fi

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}      Pipeline de Correction Continu                 ${NC}"
echo -e "${BLUE}=====================================================${NC}"

echo -e "${GREEN}📋 Configuration:${NC}"
if [[ "$TARGET_TYPE" == "file" ]]; then
  echo -e "  Fichier cible: ${YELLOW}$TARGET${NC}"
elif [[ "$TARGET_TYPE" == "dir" ]]; then
  echo -e "  Répertoire cible: ${YELLOW}$TARGET${NC}"
elif [[ "$BATCH_MODE" == true ]]; then
  echo -e "  Mode batch: ${YELLOW}Activé${NC}"
fi

echo -e "  Remédiation automatique: ${YELLOW}$([ "$AUTO_REMEDIATE" == true ] && echo "Activée" || echo "Désactivée")${NC}"
echo -e "  Maximum d'itérations: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "  Mode simulation: ${YELLOW}$([ "$DRY_RUN" == true ] && echo "Activé" || echo "Désactivé")${NC}"
echo -e "  Génération de rapport: ${YELLOW}$([ "$GENERATE_REPORT" == true ] && echo "Activée" || echo "Désactivée")${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Fonction pour extraire les statistiques de l'index de vérification
get_verification_stats() {
  local INDEX_PATH="reports/verifier_index.json"
  
  if [[ ! -f "$INDEX_PATH" ]]; then
    echo "0 0 0"
    return
  fi
  
  local VERIFIED=$(grep -o '"verifiedCount": [0-9]*' "$INDEX_PATH" | awk '{print $2}')
  local DIVERGENT=$(grep -o '"divergentCount": [0-9]*' "$INDEX_PATH" | awk '{print $2}')
  local CRITICAL=$(grep -o '"criticalCount": [0-9]*' "$INDEX_PATH" | awk '{print $2}')
  
  echo "$VERIFIED $DIVERGENT $CRITICAL"
}

# Exécuter le pipeline
current_iteration=1
all_fixed=false

while [[ $current_iteration -le $MAX_ITERATIONS && "$all_fixed" == false ]]; do
  echo -e "\n${BLUE}=====================================================${NC}"
  echo -e "${BLUE}      Itération $current_iteration / $MAX_ITERATIONS                    ${NC}"
  echo -e "${BLUE}=====================================================${NC}"
  
  # Étape 1: Vérification avec diff-verifier
  echo -e "\n${GREEN}🔍 Étape 1: Vérification des divergences...${NC}"
  echo -e "   Exécution: ./bin/diff-verifier.sh $VERIFIER_ARGS"
  
  ./bin/diff-verifier.sh $VERIFIER_ARGS
  
  # Lire les statistiques actuelles
  read verified divergent critical <<< $(get_verification_stats)
  
  echo -e "\n${GREEN}📊 Résultat de la vérification:${NC}"
  echo -e "   ✅ Vérifiés: $verified"
  echo -e "   ⚠️ Divergents: $divergent"
  echo -e "   🔴 Critiques: $critical"
  
  # Vérifier s'il y a des divergences
  if [[ "$divergent" == "0" && "$critical" == "0" ]]; then
    echo -e "\n${GREEN}✅ Toutes les vérifications ont réussi! Aucune divergence détectée.${NC}"
    all_fixed=true
    break
  fi
  
  # Si la remédiation automatique est désactivée, sortir
  if [[ "$AUTO_REMEDIATE" == false ]]; then
    echo -e "\n${YELLOW}⚠️ Remédiation automatique désactivée. Arrêt du pipeline.${NC}"
    break
  fi
  
  # Étape 2: Remédiation avec remediator
  echo -e "\n${GREEN}🛠️ Étape 2: Application des corrections...${NC}"
  echo -e "   Exécution: ./bin/remediator.sh $REMEDIATOR_ARGS"
  
  ./bin/remediator.sh $REMEDIATOR_ARGS
  
  # Si en mode simulation, pas besoin de continuer les itérations
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "\n${YELLOW}⚠️ Mode simulation activé. Arrêt du pipeline après une itération.${NC}"
    break
  fi
  
  # Incrémenter le compteur d'itérations
  ((current_iteration++))
  
  # Si c'est la dernière itération, vérifier une dernière fois
  if [[ $current_iteration -gt $MAX_ITERATIONS ]]; then
    echo -e "\n${YELLOW}⚠️ Nombre maximum d'itérations atteint. Vérification finale...${NC}"
    
    ./bin/diff-verifier.sh $VERIFIER_ARGS
    
    read verified divergent critical <<< $(get_verification_stats)
    
    echo -e "\n${GREEN}📊 Résultat final:${NC}"
    echo -e "   ✅ Vérifiés: $verified"
    echo -e "   ⚠️ Divergents restants: $divergent"
    echo -e "   🔴 Critiques restants: $critical"
    
    if [[ "$divergent" == "0" && "$critical" == "0" ]]; then
      all_fixed=true
    fi
  fi
done

echo -e "\n${BLUE}=====================================================${NC}"
if [[ "$all_fixed" == true ]]; then
  echo -e "${GREEN}✅ Pipeline terminé avec succès! Toutes les divergences corrigées.${NC}"
  exit_code=0
else
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}⚠️ Pipeline terminé en mode simulation.${NC}"
    exit_code=0
  else
    echo -e "${YELLOW}⚠️ Pipeline terminé avec des divergences restantes.${NC}"
    echo -e "${YELLOW}   Une intervention manuelle peut être nécessaire.${NC}"
    exit_code=1
  fi
fi
echo -e "${BLUE}=====================================================${NC}"

exit $exit_code