#!/bin/bash

# Script de démarrage du pipeline complet de migration IA
# Démarre tous les composants: Docker, n8n, agents IA et dashboard

set -e
SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
LOG_DIR="$PROJECT_ROOT/logs"

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Création du répertoire de logs s'il n'existe pas
mkdir -p "$LOG_DIR"

echo -e "${BLUE}🚀 Démarrage du pipeline de migration IA...${NC}"
echo -e "${YELLOW}📁 Répertoire projet: ${PROJECT_ROOT}${NC}"

# Vérification que Docker est en cours d'exécution
echo -e "${BLUE}🔍 Vérification que Docker est en cours d'exécution...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker n'est pas en cours d'exécution. Veuillez le démarrer avant de continuer.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker est en cours d'exécution${NC}"

# Vérification que le fichier .env existe
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}⚠️ Fichier .env non trouvé, création à partir de .env.example...${NC}"
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo -e "${YELLOW}⚠️ Veuillez configurer le fichier .env avec vos clés API${NC}"
fi

# Démarrage des conteneurs Docker
echo -e "${BLUE}🐳 Démarrage des conteneurs Docker...${NC}"
cd "$PROJECT_ROOT"
docker compose up -d

# Attente que les services soient prêts
echo -e "${BLUE}⏳ Attente que les services soient prêts...${NC}"
attempt=0
max_attempts=30
n8n_ready=false
agents_ready=false

while [ $attempt -lt $max_attempts ] && { [ "$n8n_ready" = false ] || [ "$agents_ready" = false ]; }; do
    # Vérifier n8n
    if [ "$n8n_ready" = false ] && curl -s http://localhost:5678/healthz > /dev/null; then
        echo -e "${GREEN}✅ n8n est prêt${NC}"
        n8n_ready=true
    fi
    
    # Vérifier les agents
    if [ "$agents_ready" = false ] && curl -s http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Service des agents est prêt${NC}"
        agents_ready=true
    fi
    
    # Si les deux ne sont pas prêts, attendez un peu plus
    if [ "$n8n_ready" = false ] || [ "$agents_ready" = false ]; then
        attempt=$((attempt+1))
        echo -e "${YELLOW}⏳ En attente des services... Tentative $attempt/$max_attempts${NC}"
        sleep 3
    fi
done

if [ "$n8n_ready" = false ] || [ "$agents_ready" = false ]; then
    echo -e "${RED}❌ Tous les services n'ont pas démarré dans le délai imparti${NC}"
    echo -e "${YELLOW}📊 État des services:${NC}"
    echo -e "  - n8n: $([ "$n8n_ready" = true ] && echo -e "${GREEN}Prêt${NC}" || echo -e "${RED}Non prêt${NC}")"
    echo -e "  - Agents: $([ "$agents_ready" = true ] && echo -e "${GREEN}Prêt${NC}" || echo -e "${RED}Non prêt${NC}")"
    exit 1
fi

# Import des workflows n8n si nécessaire
echo -e "${BLUE}🔄 Vérification des workflows n8n...${NC}"
if [ -d "$PROJECT_ROOT/workflows/exports" ] && [ "$(ls -A "$PROJECT_ROOT/workflows/exports" 2>/dev/null)" ]; then
    echo -e "${BLUE}📥 Import des workflows n8n...${NC}"
    node "$SCRIPT_DIR/import-n8n-workflows.js"
else
    echo -e "${YELLOW}⚠️ Aucun workflow à importer trouvé dans workflows/exports${NC}"
fi

# Affichage des informations d'accès
echo -e "\n${GREEN}✅ Pipeline de migration IA démarré avec succès!${NC}"
echo -e "\n${BLUE}📊 Accès aux interfaces:${NC}"
echo -e "  - 🔧 n8n: ${YELLOW}http://localhost:5678${NC}"
echo -e "  - 🖥️ Dashboard d'administration: ${YELLOW}http://localhost:3000${NC}"
echo -e "  - 🤖 API des agents: ${YELLOW}http://localhost:3001${NC}"

echo -e "\n${BLUE}💡 Commandes utiles:${NC}"
echo -e "  - Afficher l'état: ${YELLOW}./scripts/pipeline-status.sh${NC}"
echo -e "  - Arrêter le pipeline: ${YELLOW}./scripts/stop-pipeline.sh${NC}"
echo -e "  - Voir les logs: ${YELLOW}./scripts/pipeline-logs.sh${NC}"

# Rendre le script exécutable
chmod +x "$SCRIPT_DIR/pipeline-status.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/stop-pipeline.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/pipeline-logs.sh" 2>/dev/null || true
