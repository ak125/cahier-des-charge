#!/bin/bash
# deploy-preview.sh
# Script de déploiement d'un environnement de prévisualisation pour les PRs

set -e

# Variables par défaut 
BRANCH_NAME=$1
PR_NUMBER=$(echo $BRANCH_NAME | grep -oP 'pr-\K\d+' || echo "unknown")
PREVIEW_DOMAIN=${PREVIEW_DOMAIN:-"preview.mysite.io"}
CONTAINER_PREFIX="preview"
NETWORK_NAME="preview-network"
BACKEND_PORT=3000
FRONTEND_PORT=3001
PROXY_PORT=80
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
USE_TRAEFIK=${USE_TRAEFIK:-"true"}
TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-"traefik-public"}

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nettoyage des caractères spéciaux pour le nom de la branche
SAFE_BRANCH_NAME=$(echo $BRANCH_NAME | sed 's/[^a-zA-Z0-9]/-/g')
PREVIEW_HOSTNAME="${SAFE_BRANCH_NAME}.${PREVIEW_DOMAIN}"

echo -e "${BLUE}🚀 Déploiement de l'environnement de prévisualisation pour ${YELLOW}$BRANCH_NAME${NC}"
echo -e "${BLUE}🌐 URL de prévisualisation: ${GREEN}https://${PREVIEW_HOSTNAME}${NC}"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Fonction de nettoyage
cleanup() {
    echo -e "${BLUE}🧹 Nettoyage des conteneurs existants...${NC}"
    docker rm -f "${CONTAINER_PREFIX}-backend-${SAFE_BRANCH_NAME}" 2>/dev/null || true
    docker rm -f "${CONTAINER_PREFIX}-frontend-${SAFE_BRANCH_NAME}" 2>/dev/null || true
    docker rm -f "${CONTAINER_PREFIX}-proxy-${SAFE_BRANCH_NAME}" 2>/dev/null || true
}

# Nettoyer avant de commencer
cleanup

# Créer le réseau si nécessaire
if ! docker network inspect "${NETWORK_NAME}" &>/dev/null; then
    echo -e "${BLUE}🔌 Création du réseau Docker ${YELLOW}${NETWORK_NAME}${NC}"
    docker network create "${NETWORK_NAME}"
fi

# Vérifier l'existence du réseau Traefik si utilisé
if [ "$USE_TRAEFIK" = "true" ] && ! docker network inspect "${TRAEFIK_NETWORK}" &>/dev/null; then
    echo -e "${YELLOW}⚠️ Réseau Traefik ${TRAEFIK_NETWORK} non trouvé. Création en cours...${NC}"
    docker network create "${TRAEFIK_NETWORK}"
fi

# Créer le dossier temporaire pour les fichiers de configuration
TEMP_DIR="/tmp/preview-${SAFE_BRANCH_NAME}"
mkdir -p "${TEMP_DIR}"

# Générer docker-compose.yml pour l'environnement de prévisualisation
cat > "${TEMP_DIR}/docker-compose.preview.yml" << EOF
version: '3.8'

services:
  backend:
    image: ${DOCKER_REGISTRY}remix-nestjs-backend:${SAFE_BRANCH_NAME}
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
      args:
        - BRANCH_NAME=${BRANCH_NAME}
    container_name: ${CONTAINER_PREFIX}-backend-${SAFE_BRANCH_NAME}
    restart: unless-stopped
    environment:
      - NODE_ENV=preview
      - PORT=${BACKEND_PORT}
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/preview_${SAFE_BRANCH_NAME}
    networks:
      - ${NETWORK_NAME}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.preview-backend-${SAFE_BRANCH_NAME}.rule=Host(\`${PREVIEW_HOSTNAME}\`) && PathPrefix(\`/api\`)"
      - "traefik.http.routers.preview-backend-${SAFE_BRANCH_NAME}.entrypoints=websecure"
      - "traefik.http.routers.preview-backend-${SAFE_BRANCH_NAME}.tls=true"
      - "traefik.http.services.preview-backend-${SAFE_BRANCH_NAME}.loadbalancer.server.port=${BACKEND_PORT}"

  frontend:
    image: ${DOCKER_REGISTRY}remix-frontend:${SAFE_BRANCH_NAME}
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
      args:
        - BRANCH_NAME=${BRANCH_NAME}
        - API_URL=https://${PREVIEW_HOSTNAME}/api
    container_name: ${CONTAINER_PREFIX}-frontend-${SAFE_BRANCH_NAME}
    restart: unless-stopped
    environment:
      - NODE_ENV=preview
      - PORT=${FRONTEND_PORT}
    networks:
      - ${NETWORK_NAME}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.preview-frontend-${SAFE_BRANCH_NAME}.rule=Host(\`${PREVIEW_HOSTNAME}\`)"
      - "traefik.http.routers.preview-frontend-${SAFE_BRANCH_NAME}.entrypoints=websecure"
      - "traefik.http.routers.preview-frontend-${SAFE_BRANCH_NAME}.tls=true"
      - "traefik.http.services.preview-frontend-${SAFE_BRANCH_NAME}.loadbalancer.server.port=${FRONTEND_PORT}"

networks:
  ${NETWORK_NAME}:
    external: true
EOF

# Ajouter le réseau Traefik si utilisé
if [ "$USE_TRAEFIK" = "true" ]; then
    echo -e "${BLUE}🔀 Configuration de Traefik pour l'environnement de prévisualisation${NC}"
    cat >> "${TEMP_DIR}/docker-compose.preview.yml" << EOF
  ${TRAEFIK_NETWORK}:
    external: true
EOF

    # Ajouter le réseau Traefik aux services
    sed -i "s/networks:/networks:\n      - ${TRAEFIK_NETWORK}/" "${TEMP_DIR}/docker-compose.preview.yml"
fi

# Lancer les conteneurs
echo -e "${BLUE}🐳 Lancement des conteneurs Docker...${NC}"
cd "${TEMP_DIR}" && docker-compose -f docker-compose.preview.yml up -d --build

# Vérifier si les conteneurs sont en cours d'exécution
echo -e "${BLUE}⏳ Vérification de l'état des conteneurs...${NC}"
sleep 5
if docker ps | grep -q "${CONTAINER_PREFIX}-backend-${SAFE_BRANCH_NAME}" && \
   docker ps | grep -q "${CONTAINER_PREFIX}-frontend-${SAFE_BRANCH_NAME}"; then
    echo -e "${GREEN}✅ Environnement de prévisualisation déployé avec succès !${NC}"
    echo -e "${GREEN}🌐 URL: https://${PREVIEW_HOSTNAME}${NC}"
    
    # Créer le fichier d'information sur le déploiement
    PREVIEW_DIR=".preview/fiche-${PR_NUMBER}"
    mkdir -p "${PREVIEW_DIR}"
    
    cat > "${PREVIEW_DIR}/deployment_info.json" << EOF
{
  "previewUrl": "https://${PREVIEW_HOSTNAME}",
  "prNumber": "${PR_NUMBER}",
  "branchName": "${BRANCH_NAME}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "containers": {
    "backend": "${CONTAINER_PREFIX}-backend-${SAFE_BRANCH_NAME}",
    "frontend": "${CONTAINER_PREFIX}-frontend-${SAFE_BRANCH_NAME}"
  }
}
EOF

    # Sauvegarder l'URL de prévisualisation
    echo "https://${PREVIEW_HOSTNAME}" > "${PREVIEW_DIR}/preview_url.txt"
    
    exit 0
else
    echo -e "${RED}❌ Erreur lors du déploiement de l'environnement de prévisualisation.${NC}"
    echo -e "${YELLOW}Consultez les logs Docker pour plus d'informations:${NC}"
    echo "docker logs ${CONTAINER_PREFIX}-backend-${SAFE_BRANCH_NAME}"
    echo "docker logs ${CONTAINER_PREFIX}-frontend-${SAFE_BRANCH_NAME}"
    
    # Nettoyage en cas d'échec
    cleanup
    exit 1
fi