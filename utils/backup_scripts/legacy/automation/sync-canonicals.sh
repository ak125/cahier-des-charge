#!/bin/bash
# Script pour synchroniser les URLs canoniques entre Supabase et le fichier local

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher l'aide
function show_help {
  echo -e "${BLUE}Synchronisation des URLs canoniques${NC}"
  echo -e "Ce script permet de synchroniser les URLs canoniques entre Supabase et le fichier local"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -d, --direction DIRECTION  Direction de la synchronisation (both, push, pull)"
  echo "  -f, --force                Forcer la mise à jour même si les données n'ont pas changé"
  echo "  -p, --path FILEPATH        Chemin vers le fichier de mappings canoniques"
  echo "  --help                     Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -d pull -p ./app/config/seo-canonicals.json"
  exit 0
}

# Variables par défaut
DIRECTION="both"
FORCE_UPDATE=false
CANONICAL_FILE_PATH="./app/config/seo-canonicals.json"

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--direction)
      DIRECTION="$2"
      if [[ "$DIRECTION" != "both" && "$DIRECTION" != "push" && "$DIRECTION" != "pull" ]]; then
        echo -e "${RED}❌ Direction invalide. Utilisez 'both', 'push' ou 'pull'.${NC}"
        exit 1
      fi
      shift 2
      ;;
    -f|--force)
      FORCE_UPDATE=true
      shift
      ;;
    -p|--path)
      CANONICAL_FILE_PATH="$2"
      shift 2
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

# Vérifier que le fichier existe
if [ ! -f "$CANONICAL_FILE_PATH" ]; then
  echo -e "${RED}❌ Le fichier de mappings canoniques n'existe pas: ${CANONICAL_FILE_PATH}${NC}"
  exit 1
fi

# Charger les variables d'environnement depuis .env si présent
if [ -f ".env" ]; then
  echo -e "${BLUE}Chargement des variables d'environnement depuis .env${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Vérifier les variables d'environnement Supabase
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}⚠️ Variables Supabase non définies. La synchronisation se fera en local uniquement.${NC}"
fi

# Exécuter la synchronisation
echo -e "${BLUE}Synchronisation des URLs canoniques (direction: ${DIRECTION})...${NC}"

NODE_SCRIPT=$(cat << 'EOF'
const canonicalSyncAgent = require('./agents/migration/php-to-remix/canonical-sync-agent');
const result = canonicalSyncAgent.process({
  inputs: {
    canonicalFilePath: process.argv[2],
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    direction: process.argv[3],
    forceUpdate: process.argv[4] === 'true'
  }
});
console.log(JSON.stringify(result));
EOF
)

SYNC_RESULT=$(node -e "$NODE_SCRIPT" "$CANONICAL_FILE_PATH" "$DIRECTION" "$FORCE_UPDATE")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de la synchronisation des URLs canoniques${NC}"
  exit 1
fi

# Afficher le résultat
SUCCESS=$(echo "$SYNC_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.success ? 'true' : 'false');")

if [ "$SUCCESS" = "true" ]; then
  LOCAL_MAPPINGS=$(echo "$SYNC_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.localMappings || 0);")
  REMOTE_MAPPINGS=$(echo "$SYNC_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.data?.remoteMappings || 0);")
  
  echo -e "${GREEN}✅ Synchronisation terminée avec succès${NC}"
  echo -e "- Mappings locaux: ${LOCAL_MAPPINGS}"
  echo -e "- Mappings distants: ${REMOTE_MAPPINGS}"
  echo -e "- Fichier: ${CANONICAL_FILE_PATH}"
else
  ERROR=$(echo "$SYNC_RESULT" | node -e "const result = JSON.parse(process.stdin.read()); console.log(result.error || 'Erreur inconnue');")
  echo -e "${RED}❌ Erreur: ${ERROR}${NC}"
  exit 1
fi