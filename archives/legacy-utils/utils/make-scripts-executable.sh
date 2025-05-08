#!/bin/bash

# Script pour rendre tous les scripts .sh exécutables

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Rendre les scripts exécutables...${NC}"

# Trouver tous les scripts .sh
SCRIPTS=$(find ./scripts -name "*.sh")
SCRIPT_COUNT=$(echo "$SCRIPTS" | grep -c "." || echo 0)

if [ "$SCRIPT_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Aucun script .sh trouvé.${NC}"
    exit 0
fi

echo -e "${BLUE}📄 Trouvé $SCRIPT_COUNT scripts .sh${NC}"

# Rendre chaque script exécutable
for script in $SCRIPTS; do
    chmod +x "$script"
    echo -e "${GREEN}✅ Rendu exécutable: $script${NC}"
done

echo -e "${GREEN}✅ Tous les scripts sont maintenant exécutables!${NC}"
echo ""
echo -e "${BLUE}💡 Pour exécuter un script, utilisez:${NC}"
echo "  ./scripts/nom-du-script.sh"
