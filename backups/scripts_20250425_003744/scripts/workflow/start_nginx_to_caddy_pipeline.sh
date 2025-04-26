#!/bin/bash
# Script de migration automatisée de Nginx vers Caddy
# Ce script utilise les agents MCP pour analyser les configurations Nginx et .htaccess
# et générer un Caddyfile équivalent

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
NGINX_CONFIG_PATH=""
HTACCESS_PATH=""
OUTPUT_CADDYFILE="./Caddyfile"
CONFIG_DIR="./config"
BACKUP_DIR="./backups"
TIMESTAMP=$(date "+%Y%m%d-%H%M%S")

# Fonction pour afficher l'aide
function show_help {
  echo -e "${BLUE}Migration Nginx vers Caddy${NC}"
  echo -e "Ce script permet de migrer une configuration Nginx et/ou .htaccess vers Caddy"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -n, --nginx PATH     Chemin vers le fichier de configuration Nginx"
  echo "  -h, --htaccess PATH  Chemin vers le fichier .htaccess"
  echo "  -o, --output PATH    Chemin de sortie pour le Caddyfile (défaut: ./Caddyfile)"
  echo "  --help               Affiche cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -n ./examples/nginx.conf -h ./examples/.htaccess -o ./Caddyfile"
  exit 0
}

# Fonction pour créer une sauvegarde
function create_backup {
  local file=$1
  local backup_file="${BACKUP_DIR}/$(basename ${file}).bak-${TIMESTAMP}"
  
  mkdir -p "${BACKUP_DIR}"
  
  if [ -f "$file" ]; then
    cp "$file" "$backup_file"
    echo -e "${GREEN}✅ Sauvegarde créée: ${backup_file}${NC}"
  fi
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
  
  # Vérifier si le serveur MCP est configuré
  if [ ! -d "${WORKING_DIR}/agents" ]; then
    echo -e "${RED}❌ Le dossier 'agents' n'existe pas. Veuillez exécuter ce script depuis la racine du projet.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Tous les prérequis sont satisfaits${NC}"
}

# Fonction pour créer un docker-compose avec Caddy
function create_docker_compose {
  local output_dir=$(dirname "$OUTPUT_CADDYFILE")
  local compose_file="${output_dir}/docker-compose.caddy.yml"
  
  cat > "$compose_file" << EOF
version: "3.9"

services:
  remix:
    build: ./apps/frontend
    networks: [web]
    restart: unless-stopped

  nest:
    build: ./apps/backend
    networks: [web]
    restart: unless-stopped

  mcp:
    build: ./apps/mcp-server
    networks: [web]
    restart: unless-stopped

  caddy:
    image: caddy:2.7
    restart: unless-stopped
    volumes:
      - ${OUTPUT_CADDYFILE}:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    ports:
      - "80:80"
      - "443:443"
    networks: [web]

networks:
  web:
    external: false

volumes:
  caddy_data:
  caddy_config:
EOF

  echo -e "${GREEN}✅ Fichier docker-compose.caddy.yml généré: ${compose_file}${NC}"
}

# Traitement des paramètres
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--nginx)
      NGINX_CONFIG_PATH="$2"
      shift 2
      ;;
    -h|--htaccess)
      HTACCESS_PATH="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_CADDYFILE="$2"
      shift 2
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

# Vérifier qu'au moins un fichier de configuration est spécifié
if [ -z "$NGINX_CONFIG_PATH" ] && [ -z "$HTACCESS_PATH" ]; then
  echo -e "${RED}❌ Veuillez spécifier au moins une configuration (Nginx ou .htaccess)${NC}"
  show_help
fi

# Exécution du pipeline
echo -e "${BLUE}=== Démarrage de la migration Nginx vers Caddy ===${NC}"

# Vérification des prérequis
check_prerequisites

# Créer une sauvegarde des fichiers de configuration
if [ ! -z "$NGINX_CONFIG_PATH" ] && [ -f "$NGINX_CONFIG_PATH" ]; then
  create_backup "$NGINX_CONFIG_PATH"
else
  echo -e "${YELLOW}⚠️ Fichier Nginx non trouvé: ${NGINX_CONFIG_PATH}${NC}"
  NGINX_CONFIG_PATH=""
fi

if [ ! -z "$HTACCESS_PATH" ] && [ -f "$HTACCESS_PATH" ]; then
  create_backup "$HTACCESS_PATH"
else
  echo -e "${YELLOW}⚠️ Fichier .htaccess non trouvé: ${HTACCESS_PATH}${NC}"
  HTACCESS_PATH=""
fi

# Configuration et exécution des agents MCP
echo -e "${BLUE}Analyse des configurations...${NC}"

# Analyse de la configuration Nginx
NGINX_CONFIG_JSON=""
if [ ! -z "$NGINX_CONFIG_PATH" ]; then
  echo -e "${BLUE}Analyse de la configuration Nginx...${NC}"
  
  # Exécuter l'agent d'analyse Nginx
  NGINX_CONFIG_JSON=$(node -e "
    const fs = require('fs');
    const nginxParser = require('./agents/analysis/config-parsers/nginx-config-parser');
    
    const result = nginxParser.process({
      inputs: { configPath: '${NGINX_CONFIG_PATH}' }
    });
    
    console.log(JSON.stringify(result));
  ")
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'analyse de la configuration Nginx${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Configuration Nginx analysée avec succès${NC}"
fi

# Analyse du fichier .htaccess
HTACCESS_CONFIG_JSON=""
if [ ! -z "$HTACCESS_PATH" ]; then
  echo -e "${BLUE}Analyse du fichier .htaccess...${NC}"
  
  # Exécuter l'agent d'analyse .htaccess
  HTACCESS_CONFIG_JSON=$(node -e "
    const fs = require('fs');
    const htaccessParser = require('./agents/analysis/config-parsers/htaccess-parser');
    
    const result = htaccessParser.process({
      inputs: { configPath: '${HTACCESS_PATH}' }
    });
    
    console.log(JSON.stringify(result));
  ")
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'analyse du fichier .htaccess${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Fichier .htaccess analysé avec succès${NC}"
fi

# Génération du Caddyfile
echo -e "${BLUE}Génération du Caddyfile...${NC}"

# Créer le dossier de sortie s'il n'existe pas
mkdir -p "$(dirname "$OUTPUT_CADDYFILE")"

# Exécuter l'agent de génération du Caddyfile
CADDYFILE_RESULT=$(node -e "
  const fs = require('fs');
  const caddyGenerator = require('./agents/migration/nginx-to-caddy/caddyfile-generator');
  
  const nginxConfig = ${NGINX_CONFIG_JSON:-null};
  const htaccessConfig = ${HTACCESS_CONFIG_JSON:-null};
  
  const result = caddyGenerator.process({
    inputs: {
      nginxConfig: nginxConfig ? nginxConfig.data : null,
      htaccessConfig: htaccessConfig ? htaccessConfig.data : null,
      outputPath: '${OUTPUT_CADDYFILE}'
    }
  });
  
  console.log(JSON.stringify(result));
")

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de la génération du Caddyfile${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Caddyfile généré avec succès: ${OUTPUT_CADDYFILE}${NC}"

# Création du docker-compose.caddy.yml
create_docker_compose

echo -e "${BLUE}=== Migration terminée avec succès ===${NC}"
echo -e "${GREEN}Vous pouvez maintenant démarrer Caddy avec la commande:${NC}"
echo -e "docker-compose -f $(dirname "$OUTPUT_CADDYFILE")/docker-compose.caddy.yml up -d"
echo ""
echo -e "${YELLOW}N'oubliez pas de vérifier le Caddyfile généré avant de l'utiliser en production !${NC}"