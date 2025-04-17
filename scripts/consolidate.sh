#!/bin/bash

# Script d'interface pour la consolidation des agents MCP
#
# Ce script facilite l'utilisation de l'outil de consolidation des agents
# en exposant les commandes les plus courantes et en guidant l'utilisateur.

set -e

# Couleurs pour les sorties
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
function show_help {
    echo -e "${BLUE}Consolidation d'agents MCP OS - Outil de restructuration architecture trois couches${NC}"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --dry-run            Simuler les opérations sans effectuer de modifications"
    echo "  --threshold <n>      Seuil de redondance (défaut: 3.0)"
    echo "  --only-high          Ne traiter que les agents à haute redondance (seuil 4.0)"
    echo "  --quick              Consolider uniquement les 5 agents les plus redondants"
    echo "  --by-layer           Organiser les agents par couche (orchestration, coordination, métier)"
    echo "  --update-imports     Mettre à jour automatiquement les imports dans tous les fichiers"
    echo "  --help               Afficher cette aide"
    echo
    echo "Exemples:"
    echo "  $0 --dry-run                 # Simuler la consolidation de tous les agents redondants"
    echo "  $0 --only-high               # Consolider uniquement les agents à haute redondance"
    echo "  $0 --threshold 2.5           # Consolider les agents avec un score de redondance >= 2.5"
    echo "  $0 --quick                   # Consolider seulement les 5 agents les plus redondants"
    echo "  $0 --by-layer                # Organiser les agents par couches (orchestration, coordination, métier)"
    echo
    exit 0
}

# Traitement des arguments
DRY_RUN=""
THRESHOLD="3.0"
ONLY_TOP_5=""
BY_LAYER=""
UPDATE_IMPORTS=""

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --dry-run)
        DRY_RUN="--dry-run"
        shift
        ;;
        --threshold)
        if [[ $# -gt 1 ]]; then
            THRESHOLD="$2"
            shift 2
        else
            echo -e "${RED}Erreur: L'option --threshold nécessite une valeur.${NC}"
            show_help
        fi
        ;;
        --only-high)
        THRESHOLD="4.0"
        shift
        ;;
        --quick)
        ONLY_TOP_5="--top=5"
        shift
        ;;
        --by-layer)
        BY_LAYER="--organize-by-layer"
        shift
        ;;
        --update-imports)
        UPDATE_IMPORTS="--update-imports"
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

# Vérifier si le fichier structure-map.json existe
if [ ! -f "./structure-map.json" ]; then
    echo -e "${YELLOW}Fichier structure-map.json non trouvé. Génération d'une structure par défaut...${NC}"
    
    # Générer un fichier structure-map.json minimal
    cat > ./structure-map.json << EOF
{
  "version": "1.0.0",
  "updated": "$(date +%Y-%m-%d)",
  "taxonomySchema": {
    "layer": {
      "description": "Couche architecturale dans MCP OS",
      "values": ["orchestration", "coordination", "business", "shared", "unknown"]
    },
    "domain": {
      "description": "Domaine fonctionnel",
      "values": ["migration", "seo", "analysis", "quality", "monitoring", "dashboard", "core", "tools", "integration", "unknown"]
    },
    "status": {
      "description": "État du fichier dans le cycle de vie",
      "values": ["active", "developing", "testing", "stable", "deprecated", "legacy", "unknown"]
    }
  },
  "defaultClassification": {
    "layer": "unknown",
    "domain": "unknown",
    "status": "unknown"
  },
  "folderClassifications": [
    {
      "pattern": "src/orchestration/**",
      "classification": {
        "layer": "orchestration"
      }
    },
    {
      "pattern": "src/coordination/**",
      "classification": {
        "layer": "coordination"
      }
    },
    {
      "pattern": "src/business/**",
      "classification": {
        "layer": "business"
      }
    }
  ],
  "fileClassifications": []
}
EOF
    echo -e "${GREEN}Fichier structure-map.json créé avec succès.${NC}"
fi

# Vérifier si les rapports existent et les générer si nécessaire
if [ ! -f "./reports/agent_version_audit.json" ]; then
    echo -e "${YELLOW}Rapport d'audit des agents non trouvé. Génération...${NC}"
    
    if [ -f "./agents/tools/agent-version-auditor.ts" ]; then
        npx ts-node ./agents/tools/agent-version-auditor.ts
    else
        echo -e "${RED}L'outil d'audit des agents n'a pas été trouvé.${NC}"
        echo -e "Vérifiez que le fichier ${YELLOW}./agents/tools/agent-version-auditor.ts${NC} existe."
        exit 1
    fi
fi

# Vérifier si les dépendances sont installées
NODE_MODULES_MISSING=false
if [ ! -d "./node_modules" ]; then
    NODE_MODULES_MISSING=true
fi

if ! npx --no-install glob --version >/dev/null 2>&1; then
    NODE_MODULES_MISSING=true
fi

if $NODE_MODULES_MISSING; then
    echo -e "${YELLOW}Installation des dépendances requises...${NC}"
    npm install --save glob @types/glob
    echo -e "${GREEN}Dépendances installées.${NC}"
fi

# Préparer les répertoires
mkdir -p ./reports
mkdir -p ./src/orchestration
mkdir -p ./src/coordination
mkdir -p ./src/business
mkdir -p ./src/core/interfaces

# Exécuter l'outil de consolidation
echo -e "${BLUE}=== Lancement de la consolidation des agents MCP - Architecture trois couches ===${NC}"
echo -e "Mode: ${DRY_RUN:+"Simulation (aucune modification ne sera effectuée)"}"
echo -e "Seuil de redondance: ${THRESHOLD}"
echo -e "Limité aux plus redondants: ${ONLY_TOP_5:+"Oui (top 5)"}"
echo -e "Organisation par couches: ${BY_LAYER:+"Oui"}"
echo -e "Mise à jour des imports: ${UPDATE_IMPORTS:+"Oui"}"
echo

CONSOLIDATION_COMMAND="npx ts-node ./tools/consolidate-agents.ts $DRY_RUN --threshold=$THRESHOLD $ONLY_TOP_5 $BY_LAYER $UPDATE_IMPORTS"

echo -e "Commande: ${YELLOW}$CONSOLIDATION_COMMAND${NC}"
echo

eval $CONSOLIDATION_COMMAND

# Afficher un résumé
if [ -f "./reports/consolidation-report.json" ]; then
    echo -e "\n${BLUE}=== Résumé de la consolidation ===${NC}"
    
    TOTAL_AGENTS=$(jq '.totalAgentsConsolidated' ./reports/consolidation-report.json)
    echo -e "Agents consolidés: ${GREEN}$TOTAL_AGENTS${NC}"
    
    echo -e "\nPar couche:"
    jq -r '.layerStats | to_entries[] | "- \(.key): \(.value) agents"' ./reports/consolidation-report.json
    
    echo -e "\nPar type:"
    jq -r '.typeStats | to_entries[] | "- \(.key): \(.value) agents"' ./reports/consolidation-report.json
    
    echo -e "\nLes agents avec les scores de redondance les plus élevés:"
    jq -r '.plans | sort_by(.archivedFiles) | reverse | .[0:5] | .[] | "- \(.agentName) (\(.archivedFiles) fichiers archivés)"' ./reports/consolidation-report.json
    
    # Générer les interfaces si nécessaire
    if [ -n "$BY_LAYER" ]; then
        echo -e "\n${BLUE}=== Génération des interfaces pour l'architecture trois couches ===${NC}"
        if [ -f "./tools/generate-layer-interfaces.ts" ]; then
            npx ts-node ./tools/generate-layer-interfaces.ts
            echo -e "${GREEN}Interfaces générées avec succès.${NC}"
        else
            echo -e "${YELLOW}L'outil de génération d'interfaces n'a pas été trouvé.${NC}"
            echo -e "Vous pouvez créer manuellement les interfaces dans ${YELLOW}./src/core/interfaces/${NC}"
        fi
    fi
fi

# Instructions finales
echo -e "\n${BLUE}=== Prochaines étapes recommandées ===${NC}"
echo -e "1. Vérifiez la structure générée dans ${YELLOW}./src${NC}"
echo -e "2. Exécutez les tests unitaires pour confirmer que tout fonctionne"

if [ -z "$UPDATE_IMPORTS" ]; then
    echo -e "3. Mettez à jour les imports dans vos fichiers qui référencent les agents avec ${YELLOW}--update-imports${NC}"
else
    echo -e "3. Vérifiez que les imports ont été correctement mis à jour"
fi

if [ -n "$BY_LAYER" ]; then
    echo -e "4. Adaptez vos agents pour qu'ils implémentent les interfaces générées dans ${YELLOW}./src/core/interfaces/${NC}"
else
    echo -e "4. Utilisez l'option ${YELLOW}--by-layer${NC} pour organiser les agents par couche et générer les interfaces"
fi

if [ -n "$DRY_RUN" ]; then
    echo -e "\n${YELLOW}Note: Ceci était une simulation. Aucun fichier n'a été modifié.${NC}"
    echo -e "Pour effectuer la consolidation réelle, exécutez la commande sans ${YELLOW}--dry-run${NC}"
fi

echo -e "\n${GREEN}Terminé!${NC}"