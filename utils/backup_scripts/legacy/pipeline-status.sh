#!/bin/bash

# Script de vérification du statut du pipeline de migration IA

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vérification du statut du pipeline de migration IA...${NC}"

# Vérification des conteneurs Docker
echo -e "${BLUE}🐳 Statut des conteneurs Docker:${NC}"
cd "$PROJECT_ROOT"
docker compose ps

# Vérification de l'état des services
echo -e "\n${BLUE}🔌 Connectivité des services:${NC}"

# Vérifier n8n
echo -n "  - n8n (http://localhost:5678): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz | grep -q "200"; then
    echo -e "${GREEN}Opérationnel✅${NC}"
else
    echo -e "${RED}Non disponible❌${NC}"
fi

# Vérifier les agents
echo -n "  - Service des agents (http://localhost:3001): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    echo -e "${GREEN}Opérationnel✅${NC}"
    
    # Récupérer les détails des agents si le service est disponible
    AGENTS_INFO=$(curl -s http://localhost:3001/health)
    if [[ $AGENTS_INFO == *"agents"* ]]; then
        echo -e "\n${BLUE}🤖 Statut des agents IA:${NC}"
        echo "$AGENTS_INFO" | grep -o '"agents":\[[^]]*\]' | sed 's/"agents":\[//g' | sed 's/\]//g' | sed 's/,/\n/g' | sed 's/"//g' | while read -r agent; do
            echo -e "  - $agent: ${GREEN}Opérationnel✅${NC}"
        done
    fi
else
    echo -e "${RED}Non disponible❌${NC}"
fi

# Vérifier le dashboard
echo -n "  - Dashboard (http://localhost:3000): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}Opérationnel✅${NC}"
else
    echo -e "${RED}Non disponible❌${NC}"
fi

# Vérifier la base de données
echo -n "  - MongoDB: "
if docker exec -it $(docker compose ps -q mongo) mongosh --quiet --eval "db.adminCommand('ping')" | grep -q "ok"; then
    echo -e "${GREEN}Opérationnel✅${NC}"
else
    echo -e "${RED}Non disponible❌${NC}"
fi

echo -e "\n${BLUE}💡 Commandes utiles:${NC}"
echo -e "  - Démarrer le pipeline: ${YELLOW}./scripts/start-pipeline.sh${NC}"
echo -e "  - Arrêter le pipeline: ${YELLOW}./scripts/stop-pipeline.sh${NC}"
echo -e "  - Voir les logs: ${YELLOW}./scripts/pipeline-logs.sh${NC}"
