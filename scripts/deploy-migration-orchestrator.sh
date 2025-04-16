#!/bin/bash

# Script de déploiement pour l'orchestrateur de migration MCP PHP → Remix
# Ce script installe et configure tous les composants nécessaires à l'orchestrateur intelligent

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire de base du projet
BASE_DIR=$(pwd)
CONFIG_FILE="${BASE_DIR}/migration-config.json"

# Fonction pour afficher le logo ASCII du projet
show_logo() {
  echo -e "${BLUE}"
  echo "  __  __  ____ _____    ___          _               _             _             "
  echo " |  \/  |/ ___|  ___|  / _ \ _ __ __| |_   _____  __| |_ _ __ __ _| |_ ___  _ __ "
  echo " | |\/| | |   | |_    | | | | '__/ _\` \ \ / / _ \/ _\` | | '__/ _\` | __/ _ \| '__|"
  echo " | |  | | |___|  _|   | |_| | | | (_| |\ V /  __/ (_| | | | | (_| | || (_) | |   "
  echo " |_|  |_|\____|_|      \___/|_|  \__,_| \_/ \___|\__,_|_|_|  \__,_|\__\___/|_|   "
  echo -e "${NC}"
  echo -e "${GREEN}Orchestrateur intelligent de migration PHP vers Remix${NC}"
  echo -e "${YELLOW}Version 1.0.0${NC}\n"
}

# Fonction pour afficher l'aide
show_help() {
  echo -e "${BLUE}Usage:${NC}"
  echo -e "  $0 [options]"
  echo ""
  echo -e "${BLUE}Options:${NC}"
  echo -e "  ${GREEN}--help${NC}                 Affiche cette aide"
  echo -e "  ${GREEN}--dry-run${NC}              Exécute en mode simulation"
  echo -e "  ${GREEN}--skip-docker${NC}          Ignore l'installation Docker"
  echo -e "  ${GREEN}--skip-n8n${NC}             Ignore la configuration de n8n"
  echo -e "  ${GREEN}--redis-url <url>${NC}      Spécifie l'URL Redis (défaut: redis://localhost:6379)"
  echo -e "  ${GREEN}--supabase-url <url>${NC}   Spécifie l'URL Supabase"
  echo -e "  ${GREEN}--supabase-key <key>${NC}   Spécifie la clé Supabase"
  echo -e "  ${GREEN}--config <file>${NC}        Utilise un fichier de configuration personnalisé"
  echo -e "  ${GREEN}--prod${NC}                 Installe en mode production"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
  echo -e "${BLUE}Vérification des prérequis...${NC}"
  
  # Vérifier Node.js
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "✅ Node.js est installé (version ${NODE_VERSION})"
  else
    echo -e "${RED}❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
  fi
  
  # Vérifier npm ou pnpm
  if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo -e "✅ pnpm est installé"
  elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo -e "✅ npm est installé"
  else
    echo -e "${RED}❌ Ni npm ni pnpm n'est installé. Veuillez installer l'un d'eux avant de continuer.${NC}"
    exit 1
  fi
  
  # Vérifier Docker si --skip-docker n'est pas spécifié
  if [[ "$SKIP_DOCKER" != "true" ]]; then
    if command -v docker &> /dev/null; then
      echo -e "✅ Docker est installé"
    else
      echo -e "${RED}❌ Docker n'est pas installé. Veuillez l'installer avant de continuer ou utilisez --skip-docker.${NC}"
      exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
      echo -e "✅ Docker Compose est installé"
    else
      echo -e "${RED}❌ Docker Compose n'est pas installé. Veuillez l'installer avant de continuer ou utilisez --skip-docker.${NC}"
      exit 1
    fi
  fi
  
  echo -e "${GREEN}✅ Tous les prérequis sont satisfaits.${NC}"
}

# Fonction pour installer les dépendances
install_dependencies() {
  echo -e "${BLUE}Installation des dépendances...${NC}"
  
  # Vérifier si le fichier package.json existe
  if [[ -f "package.json" ]]; then
    echo -e "📦 Installation des dépendances avec $PACKAGE_MANAGER"
    
    if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm install
    else
      npm install
    fi
    
    # Vérifier si l'installation a réussi
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✅ Dépendances installées avec succès.${NC}"
    else
      echo -e "${RED}❌ Échec de l'installation des dépendances.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠️ Aucun fichier package.json trouvé. Création d'un nouveau projet.${NC}"
    
    if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm init
      pnpm add @nestjs/common bullmq cheerio diff fs-extra redis @nestjs/event-emitter @sentry/node
    else
      npm init -y
      npm install @nestjs/common bullmq cheerio diff fs-extra redis @nestjs/event-emitter @sentry/node
    fi
    
    echo -e "${GREEN}✅ Nouveau projet créé et dépendances installées.${NC}"
  fi
}

# Fonction pour configurer Docker
setup_docker() {
  if [[ "$SKIP_DOCKER" == "true" ]]; then
    echo -e "${YELLOW}Configuration Docker ignorée selon les options spécifiées.${NC}"
    return
  fi
  
  echo -e "${BLUE}Configuration des conteneurs Docker...${NC}"
  
  # Vérifier si les fichiers docker-compose existent
  if [[ -f "docker-compose.yml" ]]; then
    echo -e "🐳 Lancement des conteneurs Docker"
    docker-compose up -d
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✅ Conteneurs Docker lancés avec succès.${NC}"
    else
      echo -e "${RED}❌ Échec du lancement des conteneurs Docker.${NC}"
      exit 1
    fi
  elif [[ -f "docker-compose.mcp.yml" ]]; then
    echo -e "🐳 Lancement des conteneurs Docker MCP"
    docker-compose -f docker-compose.mcp.yml up -d
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✅ Conteneurs Docker MCP lancés avec succès.${NC}"
    else
      echo -e "${RED}❌ Échec du lancement des conteneurs Docker MCP.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠️ Aucun fichier docker-compose trouvé. Création d'un nouveau fichier.${NC}"
    
    # Créer un fichier docker-compose.yml basique avec Redis
    cat <<EOF > docker-compose.mcp.yml
version: '3'
services:
  redis:
    image: redis:alpine
    container_name: mcp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    
volumes:
  redis-data:
EOF
    
    echo -e "🐳 Lancement des conteneurs Docker"
    docker-compose -f docker-compose.mcp.yml up -d
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✅ Conteneurs Docker créés et lancés avec succès.${NC}"
    else
      echo -e "${RED}❌ Échec du lancement des conteneurs Docker.${NC}"
      exit 1
    fi
  fi
}

# Fonction pour configurer n8n
setup_n8n() {
  if [[ "$SKIP_N8N" == "true" ]]; then
    echo -e "${YELLOW}Configuration n8n ignorée selon les options spécifiées.${NC}"
    return
  fi
  
  echo -e "${BLUE}Configuration de n8n...${NC}"
  
  # Vérifier si n8n est installé
  if command -v n8n &> /dev/null; then
    echo -e "✅ n8n est installé"
  else
    echo -e "${YELLOW}⚠️ n8n n'est pas installé. Installation...${NC}"
    
    # Installer n8n
    if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm add -g n8n
    else
      npm install -g n8n
    fi
    
    if [[ $? -eq 0 ]]; then
      echo -e "${GREEN}✅ n8n installé avec succès.${NC}"
    else
      echo -e "${RED}❌ Échec de l'installation de n8n.${NC}"
      exit 1
    fi
  fi
  
  # Importer les workflows n8n
  if [[ -f "n8n.migration-orchestrator.json" ]]; then
    echo -e "📥 Importation du workflow d'orchestration de migration dans n8n"
    
    # Vérifier si n8n est en cours d'exécution
    if pgrep -x "n8n" > /dev/null; then
      echo -e "${YELLOW}⚠️ n8n est déjà en cours d'exécution. Assurez-vous d'importer manuellement le workflow.${NC}"
      echo -e "${YELLOW}⚠️ Fichier de workflow: $PWD/n8n.migration-orchestrator.json${NC}"
    else
      # Lancer n8n en arrière-plan
      echo -e "🚀 Démarrage de n8n en arrière-plan"
      nohup n8n start &> /dev/null &
      sleep 5
      
      echo -e "${GREEN}✅ Accédez à l'interface n8n et importez le workflow manuellement.${NC}"
      echo -e "${GREEN}✅ URL par défaut: http://localhost:5678${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Fichier de workflow n8n non trouvé.${NC}"
  fi
}

# Fonction pour configurer les dossiers requis
setup_directories() {
  echo -e "${BLUE}Configuration des dossiers requis...${NC}"
  
  # Créer les dossiers nécessaires s'ils n'existent pas
  for dir in "simulations" "logs" "diff-reports"; do
    if [[ ! -d "$dir" ]]; then
      mkdir -p "$dir"
      echo -e "📁 Dossier \"$dir\" créé"
    else
      echo -e "✅ Dossier \"$dir\" existe déjà"
    fi
  done
  
  echo -e "${GREEN}✅ Structure de dossiers configurée.${NC}"
}

# Fonction pour configurer le fichier discovery_map.json s'il n'existe pas
setup_discovery_map() {
  if [[ ! -f "discovery_map.json" ]]; then
    echo -e "${BLUE}Création d'un fichier discovery_map.json vide...${NC}"
    echo "[]" > discovery_map.json
    echo -e "${GREEN}✅ Fichier discovery_map.json créé.${NC}"
  else
    echo -e "✅ Le fichier discovery_map.json existe déjà"
  fi
}

# Fonction pour configurer les fichiers package.json et tsconfig.json si nécessaire
setup_typescript() {
  echo -e "${BLUE}Configuration de TypeScript...${NC}"
  
  # Vérifier si tsconfig.json existe
  if [[ ! -f "tsconfig.json" ]]; then
    echo -e "${YELLOW}⚠️ tsconfig.json non trouvé. Création...${NC}"
    
    # Créer un fichier tsconfig.json basique
    cat <<EOF > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF
    
    echo -e "${GREEN}✅ Fichier tsconfig.json créé.${NC}"
  else
    echo -e "✅ Le fichier tsconfig.json existe déjà"
  fi
  
  # Ajouter les scripts dans package.json
  if [[ -f "package.json" ]]; then
    echo -e "🔄 Mise à jour des scripts dans package.json"
    
    # Utiliser une commande temporaire pour mettre à jour package.json
    if command -v jq &> /dev/null; then
      # Utiliser jq si disponible
      jq '.scripts.start = "ts-node agents/migration-orchestrator.ts" | .scripts["start:dry-run"] = "ts-node agents/migration-orchestrator.ts --dry-run" | .scripts.build = "tsc" | .scripts.watch = "tsc -w" | .scripts.diff = "ts-node packages/mcp-orchestrator/diff-checker.ts" | .scripts["dependency-graph"] = "ts-node packages/mcp-orchestrator/dependency-resolver.ts"' package.json > package.json.tmp
      mv package.json.tmp package.json
    else
      echo -e "${YELLOW}⚠️ jq non trouvé. Ajoutez manuellement les scripts à package.json.${NC}"
    fi
    
    echo -e "${GREEN}✅ Scripts mis à jour dans package.json.${NC}"
  fi
  
  # Installer ts-node si nécessaire
  if ! command -v ts-node &> /dev/null; then
    echo -e "${YELLOW}⚠️ ts-node non trouvé. Installation...${NC}"
    
    if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm add -D typescript ts-node @types/node
    else
      npm install -D typescript ts-node @types/node
    fi
    
    echo -e "${GREEN}✅ ts-node installé.${NC}"
  fi
}

# Fonction pour afficher les instructions finales
show_final_instructions() {
  echo -e "\n${GREEN}===================================================${NC}"
  echo -e "${GREEN}✅ DÉPLOIEMENT DE L'ORCHESTRATEUR MCP TERMINÉ${NC}"
  echo -e "${GREEN}===================================================${NC}\n"
  
  echo -e "${BLUE}Pour démarrer l'orchestrateur:${NC}"
  echo -e "  ${YELLOW}Mode normal:${NC} npm start"
  echo -e "  ${YELLOW}Mode simulation:${NC} npm run start:dry-run\n"
  
  echo -e "${BLUE}Pour utiliser le vérificateur de différences:${NC}"
  echo -e "  npm run diff <fichier-php> <fichier-tsx>\n"
  
  echo -e "${BLUE}Pour analyser les dépendances:${NC}"
  echo -e "  npm run dependency-graph\n"
  
  if [[ "$SKIP_N8N" != "true" ]]; then
    echo -e "${BLUE}Pour accéder à n8n:${NC}"
    echo -e "  URL: http://localhost:5678\n"
  fi
  
  echo -e "${BLUE}Pour plus d'informations, consultez la documentation:${NC}"
  echo -e "  $PWD/README.md\n"
}

# Traitement des arguments de ligne de commande
DRY_RUN="false"
SKIP_DOCKER="false"
SKIP_N8N="false"
REDIS_URL="redis://localhost:6379"
SUPABASE_URL=""
SUPABASE_KEY=""
PRODUCTION_MODE="false"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --help) show_help; exit 0 ;;
    --dry-run) DRY_RUN="true"; shift ;;
    --skip-docker) SKIP_DOCKER="true"; shift ;;
    --skip-n8n) SKIP_N8N="true"; shift ;;
    --redis-url) REDIS_URL="$2"; shift 2 ;;
    --supabase-url) SUPABASE_URL="$2"; shift 2 ;;
    --supabase-key) SUPABASE_KEY="$2"; shift 2 ;;
    --config) CONFIG_FILE="$2"; shift 2 ;;
    --prod) PRODUCTION_MODE="true"; shift ;;
    *) echo "Option inconnue: $1"; show_help; exit 1 ;;
  esac
done

# Charge la configuration depuis le fichier si spécifié
if [[ -f "$CONFIG_FILE" ]]; then
  echo -e "${BLUE}Chargement de la configuration depuis $CONFIG_FILE...${NC}"
  
  if command -v jq &> /dev/null; then
    if [[ -z "$REDIS_URL" || "$REDIS_URL" == "redis://localhost:6379" ]]; then
      REDIS_URL=$(jq -r '.redisUrl // "redis://localhost:6379"' "$CONFIG_FILE")
    fi
    
    if [[ -z "$SUPABASE_URL" ]]; then
      SUPABASE_URL=$(jq -r '.supabaseUrl // ""' "$CONFIG_FILE")
    fi
    
    if [[ -z "$SUPABASE_KEY" ]]; then
      SUPABASE_KEY=$(jq -r '.supabaseKey // ""' "$CONFIG_FILE")
    fi
  else
    echo -e "${YELLOW}⚠️ jq non trouvé. Impossible de charger la configuration.${NC}"
  fi
fi

# Fonction principale
main() {
  show_logo
  
  if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Mode simulation activé. Aucune modification ne sera appliquée.${NC}\n"
    return
  fi
  
  check_prerequisites
  install_dependencies
  setup_docker
  setup_n8n
  setup_directories
  setup_discovery_map
  setup_typescript
  show_final_instructions
}

# Exécution du script
main