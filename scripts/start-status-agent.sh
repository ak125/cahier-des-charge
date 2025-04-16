#!/bin/bash

# Script pour démarrer l'agent de suivi des jobs MCP
# Utilise l'agent status-writer.ts pour maintenir status.json à jour

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Démarrage de l'agent de suivi des jobs MCP =====${NC}"

# Vérifier que les dossiers nécessaires existent
if [ ! -d "./logs" ]; then
  echo -e "${YELLOW}Création du dossier logs...${NC}"
  mkdir -p ./logs
fi

# Détection de l'environnement
if [ -f ".env" ]; then
  echo -e "${GREEN}Chargement des variables d'environnement depuis .env${NC}"
  source .env
fi

# Configuration Redis
REDIS_URL=${REDIS_URL:-redis://localhost:6379}
echo -e "${BLUE}Configuration Redis : ${REDIS_URL}${NC}"

# Configuration Supabase (optionnelle)
if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_KEY" ]; then
  echo -e "${GREEN}Configuration Supabase détectée${NC}"
  SUPABASE_ARGS="--supabaseUrl=$SUPABASE_URL --supabaseKey=$SUPABASE_KEY"
else
  echo -e "${YELLOW}Supabase non configuré, fonctionnement en mode local uniquement${NC}"
  SUPABASE_ARGS=""
fi

# Lancement de l'agent via node
echo -e "${BLUE}Lancement de l'agent status-writer.ts...${NC}"

# Compiler l'agent au besoin
if [ ! -f "./dist/agents/status-writer.js" ]; then
  echo -e "${YELLOW}Compilation de l'agent...${NC}"
  npx tsc
fi

# Démarrer l'agent, avec les chemins de fichier absolus
node ./dist/agents/status-writer.js \
  --statusPath=$(pwd)/status.json \
  --logPath=$(pwd)/logs/error.log \
  --redisJobsPath=$(pwd)/logs/jobs.redis.json \
  --redisUrl=$REDIS_URL \
  $SUPABASE_ARGS &

AGENT_PID=$!
echo -e "${GREEN}Agent démarré avec PID: ${AGENT_PID}${NC}"
echo $AGENT_PID > ./logs/status-agent.pid

echo -e "${GREEN}===== L'agent de suivi est maintenant actif =====${NC}"
echo -e "Les données seront disponibles dans :"
echo -e "  - ${BLUE}status.json${NC} : Suivi de tous les fichiers PHP"
echo -e "  - ${BLUE}logs/error.log${NC} : Journal des erreurs"
echo -e "  - ${BLUE}logs/jobs.redis.json${NC} : Dump des jobs Redis"
echo -e "${GREEN}===== Dashboard disponible à l'URL /admin/jobs =====${NC}"