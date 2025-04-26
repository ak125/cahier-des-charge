#!/bin/bash

# Script pour générer les interfaces de l'architecture à trois couches
#
# Ce script facilite l'utilisation de l'outil de génération d'interfaces
# pour l'architecture à trois couches MCP OS.

set -e

# Couleurs pour les sorties
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
function show_help {
    echo -e "${BLUE}Générateur d'interfaces pour l'architecture MCP OS à trois couches${NC}"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --force           Écraser les interfaces existantes"
    echo "  --help            Afficher cette aide"
    echo
    echo "Description:"
    echo "  Ce script génère les interfaces TypeScript pour les différents types d'agents"
    echo "  dans chaque couche de l'architecture. Ces interfaces assurent la cohérence"
    echo "  et la standardisation des interactions entre les agents."
    echo
    exit 0
}

# Traitement des arguments
FORCE=""

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --force)
        FORCE="--force"
        shift
        ;;
        --help)
        show_help
        ;;
        *)
        echo -e "${RED}Argument inconnu: $key${NC}"
        show_help
        ;;
    esac
done

# Vérifier si les dépendances sont installées
NODE_MODULES_MISSING=false
if [ ! -d "./node_modules" ]; then
    NODE_MODULES_MISSING=true
fi

if $NODE_MODULES_MISSING; then
    echo -e "${YELLOW}Installation des dépendances requises...${NC}"
    npm install
    echo -e "${GREEN}Dépendances installées.${NC}"
fi

# Exécuter l'outil de génération d'interfaces
echo -e "${BLUE}=== Génération des interfaces pour l'architecture à trois couches ===${NC}"

# Préparer les répertoires
mkdir -p ./src/core/interfaces

# Vérifier si des interfaces existent déjà et si --force n'est pas utilisé
if [ -d "./src/core/interfaces" ] && [ -z "$FORCE" ] && [ "$(ls -A ./src/core/interfaces)" ]; then
    echo -e "${YELLOW}Des interfaces existent déjà dans ./src/core/interfaces${NC}"
    echo -e "Utilisez ${GREEN}--force${NC} pour les remplacer."
    exit 1
fi

# Exécuter le générateur d'interfaces
npx ts-node ./tools/generate-layer-interfaces.ts $FORCE

echo -e "\n${BLUE}=== Exemples d'utilisation des interfaces ===${NC}"
echo -e "Pour implémenter un agent avec les interfaces générées:"
echo -e "${GREEN}import { AnalyzerAgent } from '../core/interfaces/business';${NC}"
echo -e "${GREEN}class MyCustomAnalyzer implements AnalyzerAgent { ... }${NC}"

echo -e "\n${GREEN}Terminé!${NC}"