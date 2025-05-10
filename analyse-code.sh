#!/bin/bash
# Script principal d'analyse de code et déduplication
# Date: 9 mai 2025

# Définition des couleurs
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration par défaut
MODE="menu"
OUTPUT_DIR="./reports/code-analysis-$(date +%Y%m%d-%H%M%S)"
SUMMARY_REPORT="$OUTPUT_DIR/analyse-code-rapport.md"

# Traitement des arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --structure) MODE="structure"; shift ;;
    --duplicates) MODE="duplicates"; shift ;;
    --functions) MODE="functions"; shift ;;
    --concepts) MODE="concepts"; shift ;;
    --all) MODE="all"; shift ;;
    --help) MODE="help"; shift ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

# Vérifier que les scripts requis existent
check_script() {
  local script="$1"
  if [ ! -f "$script" ]; then
    echo -e "${RED}[ERROR]${NC} Le script $script n'existe pas."
    echo -e "${YELLOW}[INFO]${NC} Assurez-vous que tous les scripts d'analyse sont présents dans le dossier tools/"
    exit 1
  fi
}

# Créer les répertoires nécessaires
mkdir -p "$OUTPUT_DIR"

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Afficher l'aide
show_help() {
  cat << EOF
Analyseur de code et déduplication
Usage: ./analyse-code.sh [OPTIONS]

Options:
  --structure    Analyser uniquement la structure du projet
  --duplicates   Analyser uniquement les doublons de code
  --functions    Analyser uniquement les signatures de fonction
  --concepts     Analyser uniquement les doublons par concept
  --all          Exécuter toutes les analyses
  --help         Afficher cette aide

Sans option, le script affiche un menu interactif.
EOF
}

# Afficher le menu interactif
show_menu() {
  echo -e "\n${GREEN}=== MENU D'ANALYSE DE CODE ===${NC}\n"
  echo "1. Analyser la structure du projet"
  echo "2. Analyser les doublons de code (avancé)"
  echo "3. Analyser les signatures de fonction"
  echo "4. Analyser les doublons par concept"
  echo "5. Exécuter toutes les analyses"
  echo "6. Quitter"
  
  echo -e "\nVotre choix: "
  read -r choice
  
  case $choice in
    1) MODE="structure" ;;
    2) MODE="duplicates" ;;
    3) MODE="functions" ;;
    4) MODE="concepts" ;;
    5) MODE="all" ;;
    6) exit 0 ;;
    *) echo -e "${RED}Choix invalide${NC}"; show_menu ;;
  esac
}

# Exécuter une analyse
run_analysis() {
  local script="$1"
  local description="$2"
  
  check_script "$script"
  
  log "Exécution de $description..."
  "$script"
  
  if [ $? -eq 0 ]; then
    success "$description terminée avec succès"
  else
    warn "$description a rencontré des problèmes"
  fi
}

# Créer le rapport de synthèse
create_summary() {
  log "Création du rapport de synthèse..."
  
  cat > "$SUMMARY_REPORT" << EOF
# Rapport d'analyse de code et déduplication
Date: $(date +"%d/%m/%Y %H:%M:%S")

Ce document synthétise les résultats des différentes analyses effectuées sur le code source.

## Analyses exécutées

EOF
  
  # Ajouter les analyses exécutées au rapport
  if [ "$STRUCTURE_ANALYSIS" = true ]; then
    echo "- **Analyse de structure**: Examiner la structure du projet pour identifier les problèmes d'organisation" >> "$SUMMARY_REPORT"
  fi
  
  if [ "$DUPLICATE_ANALYSIS" = true ]; then
    echo "- **Analyse des doublons**: Identifier les sections de code dupliquées ou très similaires" >> "$SUMMARY_REPORT"
  fi
  
  if [ "$FUNCTION_ANALYSIS" = true ]; then
    echo "- **Analyse des signatures**: Identifier les fonctions et méthodes avec des signatures similaires" >> "$SUMMARY_REPORT"
  fi
  
  if [ "$CONCEPT_ANALYSIS" = true ]; then
    echo "- **Analyse par concept**: Regrouper et analyser le code par concept fonctionnel" >> "$SUMMARY_REPORT"
  fi
  
  cat >> "$SUMMARY_REPORT" << EOF

## Résumé des résultats

Pour des résultats détaillés, consultez les rapports individuels dans le dossier:
$OUTPUT_DIR

## Prochaines étapes recommandées

1. Examiner les rapports détaillés pour chaque type d'analyse
2. Planifier la déduplication en commençant par les doublons à haute similarité
3. Restructurer le projet selon les recommandations de structure
4. Exécuter à nouveau l'analyse après les modifications pour mesurer l'amélioration
EOF

  success "Rapport de synthèse créé: $SUMMARY_REPORT"
}

# Si aucun mode n'est spécifié, afficher le menu
if [ "$MODE" = "menu" ]; then
  show_menu
fi

# Si le mode est help, afficher l'aide
if [ "$MODE" = "help" ]; then
  show_help
  exit 0
fi

# Variables pour suivre les analyses exécutées
STRUCTURE_ANALYSIS=false
DUPLICATE_ANALYSIS=false
FUNCTION_ANALYSIS=false
CONCEPT_ANALYSIS=false

echo -e "\n${GREEN}=== DÉBUT DE L'ANALYSE DE CODE ===${NC}\n"
log "Mode: $MODE"
log "Répertoire de sortie: $OUTPUT_DIR"

# Exécuter les analyses selon le mode
if [ "$MODE" = "structure" ] || [ "$MODE" = "all" ]; then
  STRUCTURE_ANALYSIS=true
  run_analysis "./tools/analyze-project-structure.sh" "Analyse de la structure du projet"
fi

if [ "$MODE" = "duplicates" ] || [ "$MODE" = "all" ]; then
  DUPLICATE_ANALYSIS=true
  run_analysis "./tools/advanced-duplicate-analyzer.sh" "Analyse avancée des doublons"
fi

if [ "$MODE" = "functions" ] || [ "$MODE" = "all" ]; then
  FUNCTION_ANALYSIS=true
  run_analysis "./tools/function-signature-analyzer.sh" "Analyse des signatures de fonction"
fi

if [ "$MODE" = "concepts" ] || [ "$MODE" = "all" ]; then
  CONCEPT_ANALYSIS=true
  run_analysis "./tools/analyze-duplicates-by-concept.sh" "Analyse des doublons par concept"
fi

# Créer le rapport de synthèse
create_summary

echo -e "\n${GREEN}=== FIN DE L'ANALYSE DE CODE ===${NC}\n"
success "Toutes les analyses demandées ont été exécutées"
log "Les rapports sont disponibles dans: $OUTPUT_DIR"
