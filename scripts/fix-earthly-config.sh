#!/bin/bash

# Script pour corriger la configuration d'Earthly
# Ce script simplifie la configuration pour éviter les problèmes de format

# Couleurs pour améliorer la lisibilité
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}     Simplification de la config Earthly      ${NC}"
echo -e "${CYAN}===============================================${NC}"

CONFIG_DIR=~/.earthly

# Vérifier si le répertoire existe
if [ ! -d "$CONFIG_DIR" ]; then
    echo -e "${YELLOW}Création du répertoire de configuration...${NC}"
    mkdir -p "$CONFIG_DIR"
fi

# Supprimer complètement le fichier de configuration pour repartir de zéro
CONFIG_FILE="$CONFIG_DIR/config.yml"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Suppression de l'ancien fichier de configuration...${NC}"
    rm "$CONFIG_FILE"
fi

# Créer un fichier de configuration minimal
echo -e "${YELLOW}Création d'un fichier de configuration minimal...${NC}"

cat > "$CONFIG_FILE" << EOL
global:
  disable_analytics: true
EOL

# Vérifier si le fichier a été créé correctement
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓ Configuration minimale créée avec succès!${NC}"
    echo -e "${YELLOW}Contenu de la configuration:${NC}"
    cat "$CONFIG_FILE"
else
    echo -e "${RED}✗ Échec de la création de la configuration.${NC}"
    exit 1
fi

# Maintenant, créons un script d'adaptation qui va permettre d'exécuter Earthly dans un environnement conteneurisé
EARTHLY_WRAPPER="/workspaces/cahier-des-charge/scripts/run-earthly.sh"
echo -e "${YELLOW}Création d'un wrapper pour Earthly dans un environnement conteneurisé...${NC}"

cat > "$EARTHLY_WRAPPER" << 'EOL'
#!/bin/bash

# Script wrapper pour exécuter Earthly dans un environnement conteneurisé
# Ce script ajoute des options qui fonctionnent mieux dans des environnements comme GitHub Codespaces

# Exécuter Earthly avec des options adaptées aux environnements conteneurisés
earthly --no-output --no-cache "$@"
EOL

chmod +x "$EARTHLY_WRAPPER"

echo -e "${GREEN}✓ Wrapper Earthly créé: $EARTHLY_WRAPPER${NC}"
echo -e "\n${GREEN}✅ Configuration simplifiée terminée!${NC}"
echo -e "${CYAN}→ Pour exécuter Earthly, utilisez: ./scripts/run-earthly.sh +target${NC}"
echo -e "${CYAN}   Exemple: ./scripts/run-earthly.sh +lint${NC}"