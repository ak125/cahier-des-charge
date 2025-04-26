#!/bin/bash
#
# Script d'automatisation pour la migration des agents vers l'architecture abstraite
# 
# Usage: ./scripts/migrate-agents.sh [--type=analyzer|validator|generator|orchestrator] [--agent=nom-agent] [--dry-run]
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
AGENT_NAME=""
DRY_RUN=false
VERBOSE=false

# Fonction d'aide
print_help() {
    echo -e "${BLUE}Script de migration des agents MCP vers l'architecture abstraite${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --type=TYPE       Type d'agent à migrer (analyzer, validator, generator, orchestrator, all)"
    echo "  --agent=NOM       Nom spécifique d'agent à migrer (ex: php-analyzer)"
    echo "  --dry-run         Exécuter sans modifier les fichiers"
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
        --agent=*)
        AGENT_NAME="${arg#*=}"
        shift
        ;;
        --dry-run)
        DRY_RUN=true
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

# Fonction pour vérifier si un agent existe déjà en tant que classe abstraite
check_agent_extends_abstract() {
    local file_path=$1
    local abstract_class=$2
    
    if grep -q "extends $abstract_class" "$file_path"; then
        return 0 # Vrai
    else
        return 1 # Faux
    fi
}

# Fonction pour transformer un agent
transform_agent() {
    local file_path=$1
    local agent_type=$2
    local abstract_class_name="Abstract$(echo ${agent_type^})Agent"
    local import_statement="import { $abstract_class_name } from '../abstract-$agent_type';"
    local temp_file="${file_path}.tmp"
    
    # Vérifier si l'agent étend déjà la classe abstraite
    if check_agent_extends_abstract "$file_path" "$abstract_class_name"; then
        log "warning" "L'agent $(basename $file_path) utilise déjà la classe abstraite."
        return 0
    fi
    
    # Extraire le nom de la classe
    local class_name=$(grep -oP 'export\s+class\s+\K\w+' "$file_path")
    if [ -z "$class_name" ]; then
        log "error" "Impossible de trouver le nom de classe dans $file_path"
        return 1
    fi
    
    log "info" "Transformation de l'agent $class_name..."
    
    # Créer une copie de travail
    cp "$file_path" "$temp_file"
    
    # Ajouter l'import pour la classe abstraite s'il n'existe pas déjà
    if ! grep -q "$import_statement" "$temp_file"; then
        sed -i "1i $import_statement" "$temp_file"
    fi
    
    # Modifier la déclaration de classe
    sed -i "s/export\s\+class\s\+$class_name/export class $class_name extends $abstract_class_name<any, any>/g" "$temp_file"
    
    # Adapter les méthodes principales en fonction du type d'agent
    case $agent_type in
        analyzer)
            # Remplacer la méthode principale par analyze
            sed -i "s/\(async\s\+\)\?\(process\|analyze\)\s*(\s*\([^:)]\+\)\s*:\s*\([^)]\+\))\s*:[^{]\+{/public async analyze(\3: any, context?: any): Promise<any> {/g" "$temp_file"
            ;;
        validator)
            # Remplacer la méthode principale par validate
            sed -i "s/\(async\s\+\)\?\(process\|validate\)\s*(\s*\([^:)]\+\)\s*:\s*\([^)]\+\))\s*:[^{]\+{/public async validate(\3: any, context?: any): Promise<any> {/g" "$temp_file"
            ;;
        generator)
            # Remplacer la méthode principale par generate
            sed -i "s/\(async\s\+\)\?\(process\|generate\)\s*(\s*\([^:)]\+\)\s*:\s*\([^)]\+\))\s*:[^{]\+{/public async generate(\3: any, context?: any): Promise<any> {/g" "$temp_file"
            ;;
        orchestrator)
            # Remplacer la méthode principale par orchestrate
            sed -i "s/\(async\s\+\)\?\(process\|orchestrate\)\s*(\s*\([^:)]\+\)\s*:\s*\([^)]\+\))\s*:[^{]\+{/public async orchestrate(\3: any, context?: any): Promise<any> {/g" "$temp_file"
            ;;
    esac
    
    # Adapter les méthodes d'initialisation et de nettoyage
    if ! grep -q "initializeInternal" "$temp_file"; then
        # Chercher la méthode init existante
        if grep -q "\(async\s\+\)\?\(init\|initialize\)" "$temp_file"; then
            sed -i "s/\(async\s\+\)\?\(init\|initialize\)\s*(\s*[^)]*\s*)\s*:[^{]\+{/protected async initializeInternal(): Promise<void> {/g" "$temp_file"
        else
            # Ajouter une méthode d'initialisation minimale après l'ouverture de la classe
            sed -i "/export class $class_name/a\\
\\  protected async initializeInternal(): Promise<void> {\\
    // Initialisation de l'agent\\
  }\\
" "$temp_file"
        fi
    fi
    
    if ! grep -q "cleanupInternal" "$temp_file"; then
        # Chercher la méthode cleanup existante
        if grep -q "\(async\s\+\)\?\(cleanup\|dispose\|destroy\)" "$temp_file"; then
            sed -i "s/\(async\s\+\)\?\(cleanup\|dispose\|destroy\)\s*(\s*[^)]*\s*)\s*:[^{]\+{/protected async cleanupInternal(): Promise<void> {/g" "$temp_file"
        else
            # Ajouter une méthode de nettoyage minimale après la méthode d'initialisation
            sed -i "/initializeInternal(): Promise<void>/a\\
\\  protected async cleanupInternal(): Promise<void> {\\
    // Nettoyage des ressources\\
  }\\
" "$temp_file"
        fi
    fi
    
    # Si ce n'est pas un dry run, appliquer les changements
    if [ "$DRY_RUN" = false ]; then
        mv "$temp_file" "$file_path"
        log "success" "✓ Agent $class_name transformé avec succès."
    else
        log "info" "🔍 Mode simulation: modifications non sauvegardées pour $(basename $file_path)"
        # Supprimer le fichier temporaire
        rm "$temp_file"
    fi
    
    return 0
}

# Fonction pour traiter tous les agents d'un type donné
process_agents_of_type() {
    local agent_type=$1
    local agent_dir="${MCP_AGENTS_DIR}/${agent_type}s"
    local processed_count=0
    
    if [ ! -d "$agent_dir" ]; then
        log "warning" "Le répertoire $agent_dir n'existe pas."
        return 0
    fi
    
    log "info" "Traitement des agents de type $agent_type..."
    
    # Trouver tous les fichiers d'agents (mais pas les abstraits et les interfaces)
    local agent_files=$(find "$agent_dir" -type f -name "*.ts" | grep -v "abstract-" | grep -v "interface" | grep -v "index.ts")
    
    # Filtrer par nom d'agent si spécifié
    if [ -n "$AGENT_NAME" ]; then
        agent_files=$(echo "$agent_files" | grep "$AGENT_NAME")
    fi
    
    # Si aucun fichier trouvé
    if [ -z "$agent_files" ]; then
        log "warning" "Aucun agent de type $agent_type${AGENT_NAME:+ correspondant à '$AGENT_NAME'} trouvé."
        return 0
    fi
    
    local total_files=$(echo "$agent_files" | wc -l)
    log "info" "Trouvé $total_files agent(s) à transformer..."
    
    # Traiter chaque fichier d'agent
    while IFS= read -r file_path; do
        if [ -f "$file_path" ]; then
            transform_agent "$file_path" "$agent_type"
            processed_count=$((processed_count + 1))
        fi
    done <<< "$agent_files"
    
    log "success" "$processed_count agent(s) de type $agent_type transformé(s)."
    return $processed_count
}

# Afficher les informations d'exécution
echo -e "${BLUE}=== Migration des agents MCP vers l'architecture abstraite ===${NC}"
echo ""
echo -e "Mode: $([ "$DRY_RUN" = true ] && echo "${YELLOW}Simulation (Dry Run)${NC}" || echo "${GREEN}Modification réelle${NC}")"
echo ""

# Déterminer les types d'agents à traiter
if [ "$AGENT_TYPE" = "all" ] || [ -z "$AGENT_TYPE" ]; then
    AGENT_TYPES=("analyzer" "validator" "generator" "orchestrator")
else
    AGENT_TYPES=("$AGENT_TYPE")
fi

# Traiter chaque type d'agent
total_processed=0
for agent_type in "${AGENT_TYPES[@]}"; do
    process_agents_of_type "$agent_type"
    result=$?
    total_processed=$((total_processed + result))
done

# Résumé final
echo ""
echo -e "${BLUE}=== Résumé de la migration ===${NC}"
echo -e "Total traité: ${GREEN}$total_processed${NC} agent(s)"

if [ "$DRY_RUN" = true ] && [ $total_processed -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ Il s'agissait d'une simulation. Pour effectuer les modifications, exécutez sans --dry-run${NC}"
fi

# Rendre le script exécutable
chmod +x "$0"