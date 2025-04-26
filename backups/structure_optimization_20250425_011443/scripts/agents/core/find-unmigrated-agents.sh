#!/bin/bash
#
# Script pour lister et analyser les agents qui n'ont pas été migrés correctement
# 
# Usage: ./scripts/find-unmigrated-agents.sh [--type=analyzer|validator|generator|orchestrator]
#

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire de base pour les agents MCP
MCP_AGENTS_DIR="packages/mcp-agents"

# Variables par défaut
AGENT_TYPE=""
VERBOSE=false

# Fonction d'aide
print_help() {
    echo -e "${BLUE}Script d'analyse des agents non migrés${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --type=TYPE       Type d'agent à analyser (analyzer, validator, generator, orchestrator, all)"
    echo "  --verbose         Afficher des informations détaillées"
    echo "  --help            Afficher cette aide"
    echo ""
}

# Traitement des arguments
for arg in "$@"
do
    case $arg in
        --type=*)
        AGENT_TYPE="${arg#*=}"
        shift
        ;;
        --verbose)
        VERBOSE=true
        shift
        ;;
        --help)
        print_help
        exit 0
        ;;
        *)
        # argument inconnu
        echo -e "${RED}Argument inconnu: $arg${NC}"
        print_help
        exit 1
        ;;
    esac
done

# Fonction de journalisation
log() {
    local level=$1
    local message=$2
    local prefix=""
    
    case $level in
        "info")
            prefix="${BLUE}[INFO]${NC} "
            ;;
        "success")
            prefix="${GREEN}[SUCCÈS]${NC} "
            ;;
        "warning")
            prefix="${YELLOW}[ATTENTION]${NC} "
            ;;
        "error")
            prefix="${RED}[ERREUR]${NC} "
            ;;
    esac
    
    if [ "$level" != "info" ] || [ "$VERBOSE" = true ]; then
        echo -e "${prefix}${message}"
    fi
}

# Fonction pour vérifier si un agent utilise déjà la classe abstraite
agent_uses_abstract_class() {
    local file_path=$1
    
    if grep -q "extends Abstract" "$file_path"; then
        return 0 # Vrai
    else
        return 1 # Faux
    fi
}

# Fonction pour vérifier le format spécial d'un agent
analyze_special_agent() {
    local file_path=$1
    
    echo "=== Analyse du fichier $(basename "$file_path") ==="
    
    # Vérifier s'il contient une classe
    if grep -q "class " "$file_path"; then
        echo "✓ Le fichier contient une/des classe(s)"
        grep -n "class " "$file_path"
    else
        echo "✗ Le fichier ne contient pas de classe standard"
    fi
    
    # Vérifier s'il contient une fonction ou constante exportée
    if grep -q "export " "$file_path"; then
        echo "✓ Le fichier exporte des éléments:"
        grep -n "export " "$file_path"
    else
        echo "✗ Pas d'exports trouvés"
    fi
    
    # Vérifier le type de module
    if grep -q "module\.exports" "$file_path"; then
        echo "! Le fichier utilise module.exports (style CommonJS)"
    fi
    
    # Vérifier s'il contient des interfaces
    if grep -q "interface " "$file_path"; then
        echo "✓ Le fichier contient des interfaces:"
        grep -n "interface " "$file_path"
    fi
    
    # Vérifier s'il contient des méthodes principales qui devraient être adaptées
    echo ""
    echo "Méthodes principales détectées:"
    case "$(basename "$file_path")" in
        *analyzer*|*-analyzer*|*Analyzer*)
            grep -n -E "analyze|process" "$file_path"
            ;;
        *validator*|*-validator*|*Validator*)
            grep -n -E "validate|process" "$file_path"
            ;;
        *generator*|*-generator*|*Generator*)
            grep -n -E "generate|process" "$file_path"
            ;;
        *orchestrator*|*-orchestrator*|*Orchestrator*|*connector*|*Connector*)
            grep -n -E "orchestrate|process|connect" "$file_path"
            ;;
        *)
            grep -n -E "process|execute|run" "$file_path"
            ;;
    esac
    
    echo ""
    echo "Recommandation pour la migration manuelle:"
    
    # Vérifier le modèle de fichier et proposer une solution
    if grep -q "abstract class" "$file_path"; then
        echo "Ce fichier contient une classe abstraite. Il ne nécessite probablement pas de migration."
    elif grep -q "interface " "$file_path" && ! grep -q "class " "$file_path"; then
        echo "Ce fichier contient uniquement des interfaces. Il ne nécessite pas de migration."
    elif grep -q "export const" "$file_path" && ! grep -q "class " "$file_path"; then
        echo "Ce fichier exporte des constantes, pas une classe. Envisagez de le transformer en classe qui étend la classe abstraite."
    elif grep -q "export function" "$file_path" && ! grep -q "class " "$file_path"; then
        echo "Ce fichier exporte des fonctions, pas une classe. Envisagez de le transformer en classe qui étend la classe abstraite."
    else
        echo "Ce fichier a une structure non standard. Examinez-le manuellement pour déterminer la meilleure approche de migration."
    fi
    
    echo "================================================="
}

# Fonction pour analyser les agents non migrés d'un type donné
analyze_unmigrated_agents() {
    local agent_type=$1
    local agent_dir="${MCP_AGENTS_DIR}/${agent_type}s"
    
    if [ ! -d "$agent_dir" ]; then
        log "error" "Le répertoire $agent_dir n'existe pas."
        return 0
    fi
    
    log "info" "Analyse des agents non migrés de type $agent_type..."
    
    # Trouver tous les fichiers d'agents (mais pas les abstraits et les interfaces)
    local agent_files=$(find "$agent_dir" -type f -name "*.ts" | grep -v "abstract-" | grep -v "interface" | grep -v "index.ts")
    local unmigrated_count=0
    local total_count=0
    
    # Collecter les fichiers non migrés
    local unmigrated_files=()
    
    for file_path in $agent_files; do
        total_count=$((total_count + 1))
        
        # Vérifier si l'agent utilise déjà la classe abstraite
        if ! agent_uses_abstract_class "$file_path"; then
            unmigrated_count=$((unmigrated_count + 1))
            unmigrated_files+=("$file_path")
        fi
    done
    
    log "info" "Trouvé $unmigrated_count/$total_count agent(s) non migré(s) de type $agent_type"
    
    if [ ${#unmigrated_files[@]} -eq 0 ]; then
        log "success" "Tous les agents de type $agent_type ont été migrés avec succès !"
        return 0
    fi
    
    log "info" "Analyse détaillée des agents non migrés..."
    echo ""
    
    # Analyser chaque fichier non migré
    for file_path in "${unmigrated_files[@]}"; do
        analyze_special_agent "$file_path"
        echo ""
    done
}

# Afficher les informations d'exécution
echo -e "${BLUE}=== Analyse des agents non migrés vers l'architecture abstraite ===${NC}"
echo ""

# Déterminer les types d'agents à analyser
if [ "$AGENT_TYPE" = "all" ] || [ -z "$AGENT_TYPE" ]; then
    AGENT_TYPES=("analyzer" "validator" "generator" "orchestrator")
else
    AGENT_TYPES=("$AGENT_TYPE")
fi

# Analyser chaque type d'agent
for agent_type in "${AGENT_TYPES[@]}"; do
    analyze_unmigrated_agents "$agent_type"
done

# Rendre le script exécutable
chmod +x "$0"