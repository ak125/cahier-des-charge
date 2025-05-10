#!/bin/bash

# Script de mise à jour des imports après restructuration
# Date: 10 mai 2025

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mise à jour des imports après restructuration ===${NC}"

# Création du backup
BACKUP_DIR="backup/imports-update-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/apps" "$BACKUP_DIR/packages"
echo -e "${YELLOW}Création d'une copie de sauvegarde...${NC}"
find apps packages -type f -name "*.ts" -o -name "*.tsx" | while read file; do
    dir=$(dirname "$file")
    target_dir="$BACKUP_DIR/$dir"
    mkdir -p "$target_dir"
    cp "$file" "$target_dir/$(basename "$file")" 2>/dev/null || echo "Impossible de copier $file"
done
echo -e "${GREEN}✅ Sauvegarde créée dans: $BACKUP_DIR${NC}"

# Fichier de rapport
REPORT_FILE="cleanup-report/imports-update-$(date +%Y%m%d-%H%M%S).md"
echo "# Rapport de mise à jour des imports" > "$REPORT_FILE"
echo "Date: $(date +%Y-%m-%d)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Modifications effectuées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Fonction pour mettre à jour les imports dans un fichier
update_imports() {
    local file="$1"
    local original_content=$(cat "$file")
    local modified_content="$original_content"
    
    # Mise à jour des imports
    
    # 1. Agents de packages/mcp-agents/analyzers vers packages/business/src/agents
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']([^"'"'"']*)/packages/mcp-agents/analyzers/([^"'"'"']*)|from \1@cahier-des-charge/business/src/agents/\2|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']packages/mcp-agents/analyzers/([^"'"'"']*)|from "@cahier-des-charge/business/src/agents/\1|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']@fafa/mcp-agents/analyzers/([^"'"'"']*)|from "@cahier-des-charge/business/src/agents/\1|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']@mcp/agents/analyzers/([^"'"'"']*)|from "@cahier-des-charge/business/src/agents/\1|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']@workspaces/mcp-agents/analyzers/([^"'"'"']*)|from "@cahier-des-charge/business/src/agents/\1|g')
    
    # 2. Imports de racine agents vers packages/business/src/agents
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']([^"'"'"']*)/agents/([^"'"'"']*)|from \1@cahier-des-charge/business/src/agents/\2|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']agents/([^"'"'"']*)|from "@cahier-des-charge/business/src/agents/\1|g')
    
    # 3. Utils vers packages/coordination
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']([^"'"'"']*)/utils/([^"'"'"']*)|from \1@cahier-des-charge/coordination/src/utils/\2|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']utils/([^"'"'"']*)|from "@cahier-des-charge/coordination/src/utils/\1|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']@mcp/utils/([^"'"'"']*)|from "@cahier-des-charge/coordination/src/utils/\1|g')
    modified_content=$(echo "$modified_content" | sed -E 's|from ["'"'"']@workspaces/mcp-utils/([^"'"'"']*)|from "@cahier-des-charge/coordination/src/utils/\1|g')
    
    # Vérifier si des modifications ont été effectuées
    if [ "$original_content" != "$modified_content" ]; then
        echo "$modified_content" > "$file"
        echo "- Mis à jour: $file" >> "$REPORT_FILE"
        return 0 # Modified
    else
        return 1 # Not modified
    fi
}

# Mettre à jour les imports dans tous les fichiers TypeScript
echo -e "${YELLOW}Mise à jour des imports dans les fichiers...${NC}"
echo "" >> "$REPORT_FILE"
echo "### Fichiers modifiés" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

count_modified=0
count_total=0
TEMP_FILE=$(mktemp)
echo "0" > "$TEMP_FILE.total"
echo "0" > "$TEMP_FILE.modified"

# Traitement des fichiers TypeScript dans apps et packages
for file in $(find apps packages -type f \( -name "*.ts" -o -name "*.tsx" \)); do
    count_total=$(($(cat "$TEMP_FILE.total") + 1))
    echo "$count_total" > "$TEMP_FILE.total"
    
    if update_imports "$file"; then
        count_modified=$(($(cat "$TEMP_FILE.modified") + 1))
        echo "$count_modified" > "$TEMP_FILE.modified"
        echo -e "${GREEN}✓ Mis à jour: $file${NC}"
    fi
done

# Récupérer les compteurs depuis les fichiers temporaires
count_total=$(cat "$TEMP_FILE.total")
count_modified=$(cat "$TEMP_FILE.modified")
rm -f "$TEMP_FILE" "$TEMP_FILE.total" "$TEMP_FILE.modified"

echo -e "\n${GREEN}✅ Mise à jour des imports terminée !${NC}"
echo -e "${BLUE}Rapport disponible dans: $REPORT_FILE${NC}"
echo -e "${YELLOW}Fichiers modifiés: $count_modified / $count_total${NC}"

# Mise à jour du rapport final
echo -e "\n## Statistiques" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- Fichiers traités: $count_total" >> "$REPORT_FILE"
echo "- Fichiers modifiés: $count_modified" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Prochaines étapes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Vérifier que les applications compilent correctement avec les nouveaux imports" >> "$REPORT_FILE"
echo "2. Exécuter les tests pour s'assurer que la fonctionnalité n'est pas affectée" >> "$REPORT_FILE"
echo "3. Mettre à jour la documentation pour refléter la nouvelle structure d'imports" >> "$REPORT_FILE"
