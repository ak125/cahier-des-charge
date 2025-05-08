#!/bin/bash

# Script d'installation de Earthly pour les environnements de développement
# Ce script installe Earthly dans un environnement Linux, optimisé pour GitHub Codespaces

set -e

# Couleurs pour améliorer la lisibilité
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}     Installation de Earthly                  ${NC}"
echo -e "${CYAN}===============================================${NC}"

# Vérifier si earthly est déjà installé
if command -v earthly &> /dev/null; then
    echo -e "${GREEN}✓ Earthly est déjà installé!${NC}"
    earthly --version
    exit 0
fi

echo -e "${YELLOW}→ Installation d'Earthly...${NC}"

# Vérifier si nous sommes dans un environnement Codespaces/conteneur
IN_CONTAINER=false
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null || [ -n "$CODESPACES" ]; then
    IN_CONTAINER=true
    echo -e "${YELLOW}→ Environnement conteneurisé détecté (Codespaces ou Docker)${NC}"
fi

# Installer les dépendances nécessaires
echo -e "${YELLOW}→ Installation des dépendances...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq wget ca-certificates git

# Télécharger et installer Earthly
echo -e "${YELLOW}→ Téléchargement et installation de Earthly...${NC}"
sudo /bin/sh -c 'wget https://github.com/earthly/earthly/releases/latest/download/earthly-linux-amd64 -O /usr/local/bin/earthly && chmod +x /usr/local/bin/earthly'

# Vérifier l'installation
if command -v earthly &> /dev/null; then
    echo -e "${GREEN}✓ Earthly installé avec succès!${NC}"
    earthly --version
else
    echo -e "${RED}✗ L'installation d'Earthly a échoué.${NC}"
    exit 1
fi

# Configuration pour environnements conteneurisés (comme GitHub Codespaces)
if [ "$IN_CONTAINER" = true ]; then
    echo -e "${YELLOW}→ Configuration spéciale pour environnement conteneurisé...${NC}"
    
    # Créer le dossier de configuration
    mkdir -p ~/.earthly
    
    # Éviter l'initialisation complète qui nécessite un daemon Docker
    cat > ~/.earthly/config.yml << EOL
global:
  disable_analytics: true
git:
  auto_push: false
EOL
    
    echo -e "${GREEN}✓ Configuration adaptée pour environnement conteneurisé${NC}"
    echo -e "${YELLOW}Note: Dans Codespaces, certaines fonctionnalités avancées d'Earthly peuvent être limitées${NC}"
else
    # Dans un environnement normal, faire un bootstrap complet
    echo -e "${YELLOW}→ Configuration complète de Earthly...${NC}"
    earthly bootstrap --no-buildkit
    echo -e "${GREEN}✓ Configuration complète terminée${NC}"
fi

echo -e "\n${GREEN}✅ Installation d'Earthly terminée avec succès!${NC}"
echo -e "${CYAN}→ Vous pouvez maintenant utiliser 'earthly +target' pour lancer des builds${NC}"