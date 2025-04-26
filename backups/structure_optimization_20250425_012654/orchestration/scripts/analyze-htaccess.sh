#!/bin/bash
# Script pour analyser les règles .htaccess et générer les fichiers de configuration pour Remix

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Afficher l'aide
function show_help() {
  echo -e "${BLUE}=== Analyse des règles .htaccess pour Remix ===${NC}"
  echo ""
  echo "Ce script analyse un fichier .htaccess et génère toutes les configurations"
  echo "nécessaires pour la gestion des routes dans Remix."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --htaccess PATH    Chemin vers le fichier .htaccess à analyser (obligatoire)"
  echo "  -o, --output-dir DIR   Répertoire de sortie pour les fichiers générés (par défaut: ./reports)"
  echo "  -p, --php              Inclure les routes PHP courantes même si absentes du .htaccess"
  echo "  -s, --seo              Générer un audit SEO des routes"
  echo "  --help                 Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -h /path/to/.htaccess -o ./reports -p -s"
  exit 0
}

# Options par défaut
HTACCESS_PATH=""
OUTPUT_DIR="./reports"
INCLUDE_PHP=false
GEN_SEO=false

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--htaccess)
      HTACCESS_PATH="$2"
      shift 2
      ;;
    -o|--output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -p|--php)
      INCLUDE_PHP=true
      shift
      ;;
    -s|--seo)
      GEN_SEO=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}❌ Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Vérifier les arguments obligatoires
if [ -z "$HTACCESS_PATH" ]; then
  echo -e "${RED}❌ Le chemin vers le fichier .htaccess est obligatoire${NC}"
  show_help
fi

if [ ! -f "$HTACCESS_PATH" ]; then
  echo -e "${RED}❌ Le fichier .htaccess n'existe pas: ${HTACCESS_PATH}${NC}"
  exit 1
fi

# Créer le répertoire de sortie
mkdir -p "$OUTPUT_DIR"

# Afficher le début de l'exécution
echo -e "${BLUE}=== Analyse des règles .htaccess pour Remix ===${NC}"
echo -e "Fichier .htaccess: ${HTACCESS_PATH}"
echo -e "Répertoire de sortie: ${OUTPUT_DIR}"
echo -e "Inclure routes PHP communes: ${INCLUDE_PHP}"
echo -e "Générer audit SEO: ${GEN_SEO}"
echo ""

# Exécuter l'analyseur d'htaccess
echo -e "${BLUE}Étape 1: Analyse du fichier .htaccess...${NC}"

NODE_SCRIPT=$(cat << 'EOF'
const htaccessParser = require('./agents/migration/php-to-remix/htaccess-parser');
const result = htaccessParser.process({
  inputs: {
    htaccessPath: process.argv[2],
    outputDir: process.argv[3],
    includeCommonPhp: process.argv[4] === 'true',
    identifySeoRoutes: process.argv[5] === 'true'
  }
});
console.log(JSON.stringify(result));
EOF
)

PARSER_RESULT=$(node -e "$NODE_SCRIPT" "$HTACCESS_PATH" "$OUTPUT_DIR" "$INCLUDE_PHP" "$GEN_SEO")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de l'analyse du fichier .htaccess${NC}"
  exit 1
fi

# Extraire les statistiques du résultat
SUCCESS=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.success ? 'true' : 'false');")

if [ "$SUCCESS" = "true" ]; then
  TOTAL_RULES=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.stats?.totalRules || 0);")
  TOTAL_REDIRECTS=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.stats?.redirects || 0);")
  TOTAL_GONE=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.stats?.gone || 0);")
  TOTAL_MAPPING=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.stats?.mapping || 0);")
  TOTAL_SEO=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.stats?.seoRoutes || 0);")
  
  echo -e "${GREEN}✅ Analyse terminée avec succès${NC}"
  echo -e "- Règles totales analysées: ${TOTAL_RULES}"
  echo -e "- Redirections: ${TOTAL_REDIRECTS}"
  echo -e "- Pages supprimées: ${TOTAL_GONE}"
  echo -e "- Mappings: ${TOTAL_MAPPING}"
  echo -e "- Routes SEO critiques: ${TOTAL_SEO}"
  
  # Afficher les chemins des fichiers générés
  echo -e "\nFichiers générés:"
  echo -e "- ${OUTPUT_DIR}/htaccess_map.json (carte complète des règles)"
  echo -e "- ${OUTPUT_DIR}/redirects.json (redirections)"
  echo -e "- ${OUTPUT_DIR}/deleted_routes.json (pages supprimées)"
  echo -e "- ${OUTPUT_DIR}/legacy_route_map.json (mappings des routes)"
  echo -e "- ${OUTPUT_DIR}/routing_patch.json (pour intégration avec Remix)"
  
  if [ "$GEN_SEO" = "true" ]; then
    echo -e "- ${OUTPUT_DIR}/seo_routes.audit.md (audit SEO des routes)"
  fi
  
  echo -e "\n${BLUE}Étape 2: Vérification de l'intégration...${NC}"
  
  # Vérifier si le middleware NestJS existe
  MIDDLEWARE_PATH="./src/common/middleware/legacyHtaccess.middleware.ts"
  if [ ! -f "$MIDDLEWARE_PATH" ]; then
    echo -e "${YELLOW}⚠️ Le middleware NestJS n'a pas été détecté.${NC}"
    echo -e "Pour utiliser les redirections avec NestJS, créez le fichier ${MIDDLEWARE_PATH}"
    echo -e "et ajoutez-le à votre application NestJS."
  else
    echo -e "${GREEN}✅ Middleware NestJS détecté${NC}"
  fi
  
  # Vérifier si la route fallback existe dans Remix
  FALLBACK_PATH="./app/routes/$.php.tsx"
  if [ ! -f "$FALLBACK_PATH" ]; then
    echo -e "${YELLOW}⚠️ La route fallback Remix n'a pas été détectée.${NC}"
    echo -e "Pour gérer les anciennes URLs PHP, créez le fichier ${FALLBACK_PATH}"
  else
    echo -e "${GREEN}✅ Route fallback Remix détectée${NC}"
  fi
  
  # Vérifier si la route dashboard existe
  DASHBOARD_PATH="./app/routes/dashboard.htaccess.tsx"
  if [ ! -f "$DASHBOARD_PATH" ]; then
    echo -e "${YELLOW}⚠️ Le tableau de bord des routes n'a pas été détecté.${NC}"
    echo -e "Pour visualiser les redirections, créez le fichier ${DASHBOARD_PATH}"
  else
    echo -e "${GREEN}✅ Tableau de bord des routes détecté${NC}"
  fi
  
  echo -e "\n${BLUE}Étape 3: Instructions pour l'intégration...${NC}"
  echo -e "1. Assurez-vous que le middleware NestJS est intégré à votre application"
  echo -e "2. Vérifiez que la route fallback Remix est correctement configurée"
  echo -e "3. Utilisez le tableau de bord des routes pour surveiller les anciennes URLs"
  echo -e "4. Testez les redirections importantes pour confirmer qu'elles fonctionnent"
  
  echo -e "\n${GREEN}✅ Processus terminé avec succès${NC}"
else
  ERROR=$(echo "$PARSER_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.error || 'Erreur inconnue');")
  echo -e "${RED}❌ Erreur: ${ERROR}${NC}"
  exit 1
fi