#!/bin/bash

# Script d'arrêt du pipeline de migration IA
# Arrête tous les composants: Docker, n8n, agents IA et dashboard

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Arrêt du pipeline de migration IA...${NC}"

# Arrêt des conteneurs Docker
echo -e "${BLUE}🐳 Arrêt des conteneurs Docker...${NC}"
cd "$PROJECT_ROOT"
docker compose down

echo -e "${GREEN}✅ Pipeline de migration IA arrêté avec succès${NC}"
