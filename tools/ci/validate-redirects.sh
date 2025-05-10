#!/bin/bash

# Script d'intégration CI/CD pour la validation des redirections
# Ce script exécute le validateur de redirections et génère des rapports
# qui peuvent être intégrés dans le processus de déploiement

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
HTACCESS_PATHS=()
BASE_URL="http://localhost:3000"
OUTPUT_DIR="./reports/redirects"
SEO_URLS_FILE=""
TIMEOUT=5
VERBOSE=false
EXIT_ON_FAIL=true
NODE_ENV="development"

# Affichage de l'aide
function show_help {
  echo -e "${BLUE}Validateur de redirections pour CI/CD${NC}"
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -h, --help              Affiche cette aide"
  echo "  -p, --htaccess-paths    Chemins des fichiers .htaccess à analyser (séparés par des espaces)"
  echo "  -b, --base-url          URL de base pour tester les redirections (défaut: http://localhost:3000)"
  echo "  -o, --output-dir        Répertoire pour sauvegarder les rapports (défaut: ./reports/redirects)"
  echo "  -s, --seo-urls-file     Fichier JSON contenant les URLs importantes pour le SEO"
  echo "  -t, --timeout           Timeout en secondes pour les requêtes (défaut: 5)"
  echo "  -v, --verbose           Mode verbeux"
  echo "  -n, --no-exit-on-fail   Ne pas quitter avec un code d'erreur en cas d'échec"
  echo "  -e, --environment       Environnement d'exécution (dev, staging, prod) (défaut: development)"
}

# Parsing des arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -p|--htaccess-paths)
      shift
      while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
        HTACCESS_PATHS+=("$1")
        shift
      done
      ;;
    -b|--base-url)
      BASE_URL="$2"
      shift
      shift
      ;;
    -o|--output-dir)
      OUTPUT_DIR="$2"
      shift
      shift
      ;;
    -s|--seo-urls-file)
      SEO_URLS_FILE="$2"
      shift
      shift
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -n|--no-exit-on-fail)
      EXIT_ON_FAIL=false
      shift
      ;;
    -e|--environment)
      NODE_ENV="$2"
      shift
      shift
      ;;
    *)
      echo -e "${RED}Option inconnue: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Vérifier qu'au moins un chemin .htaccess est fourni
if [ ${#HTACCESS_PATHS[@]} -eq 0 ]; then
  echo -e "${RED}Erreur: Au moins un chemin de fichier .htaccess doit être spécifié${NC}"
  show_help
  exit 1
fi

# Vérifier les dépendances
echo -e "${BLUE}Vérification des dépendances...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}Erreur: Node.js est requis${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}Erreur: npm est requis${NC}"
  exit 1
fi

# Installer les dépendances si nécessaire
echo -e "${BLUE}Installation des dépendances...${NC}"
npm list --depth=0 | grep -q "fs-extra" || npm install --no-save fs-extra
npm list --depth=0 | grep -q "axios" || npm install --no-save axios
npm list --depth=0 | grep -q "chalk" || npm install --no-save chalk
npm list --depth=0 | grep -q "yargs" || npm install --no-save yargs

# Créer le répertoire de sortie
echo -e "${BLUE}Préparation du répertoire de sortie...${NC}"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_PATH="$OUTPUT_DIR/redirect-validation-$TIMESTAMP.json"
SUMMARY_PATH="$OUTPUT_DIR/redirect-validation-$TIMESTAMP-summary.txt"

# Construction de la commande
CMD="NODE_ENV=$NODE_ENV node /workspaces/cahier-des-charge/scripts/validation/redirect-validator.ts"

# Ajout des chemins .htaccess
for path in "${HTACCESS_PATHS[@]}"; do
  CMD+=" --htaccess '$path'"
done

# Ajout des autres options
CMD+=" --base-url '$BASE_URL'"
CMD+=" --output '$REPORT_PATH'"

if [ -n "$SEO_URLS_FILE" ]; then
  CMD+=" --seo-urls '$SEO_URLS_FILE'"
fi

CMD+=" --timeout $TIMEOUT"

if [ "$VERBOSE" = true ]; then
  CMD+=" --verbose"
fi

# Exécution du validateur
echo -e "${BLUE}Exécution du validateur de redirections...${NC}"
echo -e "${YELLOW}Commande: $CMD${NC}"
eval "$CMD" | tee "$SUMMARY_PATH"

# Vérification du résultat
VALIDATOR_EXIT_CODE=${PIPESTATUS[0]}
if [ $VALIDATOR_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Validation des redirections réussie !${NC}"
  echo -e "${GREEN}Rapport détaillé: $REPORT_PATH${NC}"
  echo -e "${GREEN}Résumé: $SUMMARY_PATH${NC}"
  exit 0
else
  echo -e "${RED}❌ Validation des redirections échouée !${NC}"
  echo -e "${RED}Rapport détaillé: $REPORT_PATH${NC}"
  echo -e "${RED}Résumé: $SUMMARY_PATH${NC}"
  
  # Extraire les problèmes critiques
  echo -e "${RED}\nProblèmes SEO critiques détectés:${NC}"
  if [ -f "$REPORT_PATH" ]; then
    SEO_ISSUES=$(node -e "const report = require('$REPORT_PATH'); console.log(report.results.filter(r => !r.valid && r.isSeoImportant).map(r => \`- \${r.url}: \${r.error}\`).join('\\n'))")
    echo -e "$SEO_ISSUES"
  else
    echo -e "${RED}Impossible de lire le fichier de rapport${NC}"
  fi
  
  if [ "$EXIT_ON_FAIL" = true ]; then
    exit 1
  else
    echo -e "${YELLOW}⚠️ Les problèmes ont été ignorés car --no-exit-on-fail est activé${NC}"
    exit 0
  fi
fi