#!/bin/bash
# Script de migration des routes PHP vers Remix
# Ce script utilise les agents MCP pour analyser les fichiers .htaccess
# et générer les routes Remix équivalentes

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables et chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKING_DIR="${SCRIPT_DIR}"
HTACCESS_PATH=""
REMIX_ROUTES_DIR=""
OUTPUT_MAPPING="./routing_patch.json"
FIX_SEO_ISSUES=false
GENERATE_CATCH_ALL=true

# Fonction pour afficher l'aide
function show_help {
  echo -e "${BLUE}Migration des routes PHP vers Remix${NC}"
  echo -e "Ce script permet de migrer les routes PHP vers Remix à partir d'un fichier .htaccess"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --htaccess PATH     Chemin vers le fichier .htaccess"
  echo "  -r, --routes-dir PATH   Chemin vers le répertoire des routes Remix"
  echo "  -m, --mapping PATH      Chemin de sortie pour le fichier de mappage (défaut: ./routing_patch.json)"
  echo "  --fix-seo               Corrige automatiquement les problèmes SEO (balises canoniques, etc.)"
  echo "  --no-catch-all          Ne génère pas de route catch-all pour les routes PHP non migrées"
  echo "  --help                  Affiche cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -h ./examples/.htaccess -r ./apps/frontend/app/routes -m ./routing_patch.json"
  exit 0
}

# Fonction pour vérifier les prérequis
function check_prerequisites {
  echo -e "${BLUE}Vérification des prérequis...${NC}"
  
  # Vérifier node/npm
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
  fi
  
  # Vérifier typescript
  if ! command -v tsc &> /dev/null; then
    echo -e "${YELLOW}⚠️ TypeScript n'est pas installé. Installation...${NC}"
    npm install -g typescript
  fi
  
  # Vérifier si les agents MCP sont configurés
  if [ ! -d "${WORKING_DIR}/agents/migration/php-to-remix" ]; then
    echo -e "${RED}❌ Les agents de migration PHP vers Remix n'existent pas. Veuillez vérifier votre installation.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Tous les prérequis sont satisfaits${NC}"
}

# Traitement des paramètres
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--htaccess)
      HTACCESS_PATH="$2"
      shift 2
      ;;
    -r|--routes-dir)
      REMIX_ROUTES_DIR="$2"
      shift 2
      ;;
    -m|--mapping)
      OUTPUT_MAPPING="$2"
      shift 2
      ;;
    --fix-seo)
      FIX_SEO_ISSUES=true
      shift
      ;;
    --no-catch-all)
      GENERATE_CATCH_ALL=false
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Vérifier les paramètres obligatoires
if [ -z "$HTACCESS_PATH" ]; then
  echo -e "${RED}❌ Veuillez spécifier un fichier .htaccess avec l'option -h ou --htaccess${NC}"
  show_help
fi

if [ -z "$REMIX_ROUTES_DIR" ]; then
  echo -e "${RED}❌ Veuillez spécifier un répertoire de routes Remix avec l'option -r ou --routes-dir${NC}"
  show_help
fi

# Exécution du pipeline
echo -e "${BLUE}=== Démarrage de la migration des routes PHP vers Remix ===${NC}"

# Vérification des prérequis
check_prerequisites

# Vérifier que le fichier .htaccess existe
if [ ! -f "$HTACCESS_PATH" ]; then
  echo -e "${RED}❌ Le fichier .htaccess n'existe pas: ${HTACCESS_PATH}${NC}"
  exit 1
fi

# Créer le répertoire des routes Remix s'il n'existe pas
if [ ! -d "$REMIX_ROUTES_DIR" ]; then
  echo -e "${YELLOW}⚠️ Le répertoire des routes Remix n'existe pas, création...${NC}"
  mkdir -p "$REMIX_ROUTES_DIR"
fi

# Créer le répertoire parent du fichier de mappage s'il n'existe pas
MAPPING_DIR=$(dirname "$OUTPUT_MAPPING")
if [ ! -d "$MAPPING_DIR" ]; then
  mkdir -p "$MAPPING_DIR"
fi

# Étape 1: Analyser le fichier .htaccess et générer le mappage des routes
echo -e "${BLUE}Étape 1: Analyse du fichier .htaccess...${NC}"
NODE_SCRIPT_1=$(cat << 'EOF'
const htaccessRouteAnalyzer = require('./agents/migration/php-to-remix/htaccess-route-analyzer');
const result = htaccessRouteAnalyzer.process({
  inputs: {
    htaccessPath: process.argv[2],
    outputPath: process.argv[3]
  }
});
console.log(JSON.stringify(result));
EOF
)

ROUTE_ANALYZER_RESULT=$(node -e "$NODE_SCRIPT_1" "$HTACCESS_PATH" "$OUTPUT_MAPPING")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de l'analyse du fichier .htaccess${NC}"
  exit 1
fi

TOTAL_ROUTES=$(echo "$ROUTE_ANALYZER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.totalRoutes || 0);")
echo -e "${GREEN}✅ Analyse du fichier .htaccess terminée. ${TOTAL_ROUTES} routes trouvées.${NC}"

# Étape 2: Générer les fichiers de routes Remix
echo -e "${BLUE}Étape 2: Génération des fichiers de routes Remix...${NC}"
NODE_SCRIPT_2=$(cat << 'EOF'
const remixRouteGenerator = require('./agents/migration/php-to-remix/remix-route-generator');
const result = remixRouteGenerator.process({
  inputs: {
    routeMappingPath: process.argv[2],
    outputDir: process.argv[3],
    generateCatchAll: process.argv[4] === 'true'
  }
});
console.log(JSON.stringify(result));
EOF
)

ROUTE_GENERATOR_RESULT=$(node -e "$NODE_SCRIPT_2" "$OUTPUT_MAPPING" "$REMIX_ROUTES_DIR" "$GENERATE_CATCH_ALL")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de la génération des fichiers de routes Remix${NC}"
  exit 1
fi

TOTAL_GENERATED=$(echo "$ROUTE_GENERATOR_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.totalRoutes || 0);")
echo -e "${GREEN}✅ Génération des fichiers de routes Remix terminée. ${TOTAL_GENERATED} fichiers générés.${NC}"

# Étape 3: Vérifier les problèmes SEO et corriger si nécessaire
echo -e "${BLUE}Étape 3: Vérification des problèmes SEO...${NC}"
NODE_SCRIPT_3=$(cat << 'EOF'
const seoChecker = require('./agents/migration/php-to-remix/seo-checker-canonical');
const result = seoChecker.process({
  inputs: {
    routesDir: process.argv[2],
    routeMappingPath: process.argv[3],
    generateReport: true,
    fixIssues: process.argv[4] === 'true'
  }
});
console.log(JSON.stringify(result));
EOF
)

SEO_CHECKER_RESULT=$(node -e "$NODE_SCRIPT_3" "$REMIX_ROUTES_DIR" "$OUTPUT_MAPPING" "$FIX_SEO_ISSUES")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de la vérification des problèmes SEO${NC}"
  exit 1
fi

TOTAL_ISSUES=$(echo "$SEO_CHECKER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.totalIssues || 0);")
TOTAL_RECOMMENDATIONS=$(echo "$SEO_CHECKER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.totalRecommendations || 0);")

if [ "$FIX_SEO_ISSUES" = true ]; then
  echo -e "${GREEN}✅ Vérification et correction des problèmes SEO terminées. ${TOTAL_ISSUES} problèmes et ${TOTAL_RECOMMENDATIONS} recommandations.${NC}"
else
  echo -e "${GREEN}✅ Vérification des problèmes SEO terminée. ${TOTAL_ISSUES} problèmes et ${TOTAL_RECOMMENDATIONS} recommandations.${NC}"
  echo -e "${YELLOW}ℹ️ Utilisez l'option --fix-seo pour corriger automatiquement les problèmes SEO.${NC}"
fi

# Récapitulatif
echo -e "${BLUE}=== Migration des routes PHP vers Remix terminée avec succès ===${NC}"
echo -e "${GREEN}Récapitulatif :${NC}"
echo -e "- ${TOTAL_ROUTES} routes analysées dans le fichier .htaccess"
echo -e "- ${TOTAL_GENERATED} fichiers de routes Remix générés"
echo -e "- ${TOTAL_ISSUES} problèmes SEO détectés"
echo -e "- ${TOTAL_RECOMMENDATIONS} recommandations SEO"
echo -e ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo -e "1. Vérifier le fichier de mappage des routes : ${OUTPUT_MAPPING}"
echo -e "2. Personnaliser les fichiers de routes générés dans : ${REMIX_ROUTES_DIR}"
echo -e "3. Tester les routes migrées pour vérifier leur bon fonctionnement"
if [ "$FIX_SEO_ISSUES" = false ] && [ "$TOTAL_ISSUES" -gt 0 ]; then
  echo -e "4. Corriger les problèmes SEO en relançant le script avec l'option --fix-seo"
fi
echo -e ""
echo -e "${GREEN}✅ Pour consulter le rapport SEO détaillé : ./reports/seo-check-report.json${NC}"