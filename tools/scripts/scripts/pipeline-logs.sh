#!/bin/bash

# Script pour afficher les logs du pipeline de migration IA

SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Options par défaut
SERVICE="all"
LINES=50
FOLLOW=false

# Aide
function show_help {
    echo -e "${BLUE}Usage: $0 [options]${NC}"
    echo -e "Options:"
    echo -e "  -s, --service SERVICE  Service spécifique (n8n, agents-api, dashboard, mongo)"
    echo -e "  -n, --lines LINES      Nombre de lignes à afficher (défaut: 50)"
    echo -e "  -f, --follow           Suivre les logs en temps réel"
    echo -e "  -h, --help             Afficher cette aide"
    echo -e "\nExemples:"
    echo -e "  $0 --service n8n --follow"
    echo -e "  $0 --service agents-api --lines 100"
    exit 0
}

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Option non reconnue: $1${NC}"
            show_help
            ;;
    esac
done

cd "$PROJECT_ROOT"

# Construire la commande de logs
LOGS_CMD="docker compose logs"

if [ "$SERVICE" != "all" ]; then
    LOGS_CMD="$LOGS_CMD $SERVICE"
fi

LOGS_CMD="$LOGS_CMD --tail=$LINES"

if [ "$FOLLOW" = true ]; then
    LOGS_CMD="$LOGS_CMD -f"
fi

# Afficher les logs
echo -e "${BLUE}📃 Affichage des logs pour: ${YELLOW}$SERVICE${NC}"
echo -e "${BLUE}🔍 Lignes: ${YELLOW}$LINES${NC}${FOLLOW:+ (suivi en temps réel)}"
echo -e "${YELLOW}----------- DÉBUT DES LOGS -----------${NC}\n"

eval "$LOGS_CMD"

if [ "$FOLLOW" = false ]; then
    echo -e "\n${YELLOW}------------ FIN DES LOGS ------------${NC}"
    echo -e "\n${BLUE}💡 Astuce: Utilisez ${YELLOW}$0 --follow${BLUE} pour suivre les logs en temps réel${NC}"
fi
