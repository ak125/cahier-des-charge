#!/bin/bash
#
# run-type-audit.sh
#
# Script utilitaire pour exécuter l'Agent 2 d'audit des types SQL
# Facilite l'exécution de l'agent avec différentes configurations et options
#
# Utilisation:
#   ./scripts/run-type-audit.sh <action> [options]
#
# Actions:
#   run           - Exécute l'audit sur un schéma spécifié
#   compare       - Compare deux résultats d'audit
#   integrate     - Intègre les résultats de l'audit dans le schéma Prisma
#   batch         - Exécute l'audit sur plusieurs schémas
#   help          - Affiche l'aide
#
# Options générales:
#   --schema=<path>         - Chemin vers le fichier de schéma MySQL
#   --output-dir=<dir>      - Dossier de sortie (défaut: ./outputs)
#   --deep                  - Active l'analyse profonde
#   --adjust-sizes          - Ajuste les tailles des champs
#   --detect-enums          - Détecte les énumérations
#   --verbose               - Mode verbeux
#   --config=<path>         - Utilise un fichier de configuration
#
# Options spécifiques à la comparaison:
#   --baseline=<path>       - Résultat d'audit de référence
#   --current=<path>        - Résultat d'audit actuel
#
# Options spécifiques à l'intégration:
#   --prisma-schema=<path>  - Schéma Prisma existant
#   --enum-only             - Intègre uniquement les énumérations
#
# Exemples:
#   ./scripts/run-type-audit.sh run --schema=./data/schema.json --adjust-sizes --detect-enums
#   ./scripts/run-type-audit.sh compare --baseline=./outputs/audit-v1.json --current=./outputs/audit-v2.json
#   ./scripts/run-type-audit.sh integrate --prisma-schema=./schema.prisma
#
# Date: 11 avril 2025
# Auteur: GitHub Copilot

set -e

# Couleurs pour la sortie console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration par défaut
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ACTION=""
SCHEMA_PATH=""
OUTPUT_DIR="$PROJECT_ROOT/outputs/type-audit"
DEEP_ANALYSIS=false
ADJUST_SIZES=false
DETECT_ENUMS=false
VERBOSE=false
CONFIG_PATH=""
BASELINE_PATH=""
CURRENT_PATH=""
PRISMA_SCHEMA=""
ENUM_ONLY=false
CONFIG_LOADED=false

# Fonction d'affichage de l'aide
show_help() {
    echo -e "${BLUE}Agent 2 - Utilitaire d'audit des types SQL${NC}"
    echo
    echo "Utilisation: ./scripts/run-type-audit.sh <action> [options]"
    echo
    echo "Actions:"
    echo "  run           - Exécute l'audit sur un schéma spécifié"
    echo "  compare       - Compare deux résultats d'audit"
    echo "  integrate     - Intègre les résultats de l'audit dans le schéma Prisma"
    echo "  batch         - Exécute l'audit sur plusieurs schémas"
    echo "  help          - Affiche l'aide"
    echo
    echo "Options générales:"
    echo "  --schema=<path>         - Chemin vers le fichier de schéma MySQL"
    echo "  --output-dir=<dir>      - Dossier de sortie (défaut: ./outputs)"
    echo "  --deep                  - Active l'analyse profonde"
    echo "  --adjust-sizes          - Ajuste les tailles des champs"
    echo "  --detect-enums          - Détecte les énumérations"
    echo "  --verbose               - Mode verbeux"
    echo "  --config=<path>         - Utilise un fichier de configuration"
    echo
    echo "Options spécifiques à la comparaison:"
    echo "  --baseline=<path>       - Résultat d'audit de référence"
    echo "  --current=<path>        - Résultat d'audit actuel"
    echo
    echo "Options spécifiques à l'intégration:"
    echo "  --prisma-schema=<path>  - Schéma Prisma existant"
    echo "  --enum-only             - Intègre uniquement les énumérations"
    echo
    echo "Exemples:"
    echo "  ./scripts/run-type-audit.sh run --schema=./data/schema.json --adjust-sizes --detect-enums"
    echo "  ./scripts/run-type-audit.sh compare --baseline=./outputs/audit-v1.json --current=./outputs/audit-v2.json"
    echo "  ./scripts/run-type-audit.sh integrate --prisma-schema=./schema.prisma"
    echo
}

# Fonction de log
log() {
    local level=$1
    local message=$2
    local color=$NC

    case $level in
        "INFO")
            color=$CYAN
            ;;
        "SUCCESS")
            color=$GREEN
            ;;
        "WARNING")
            color=$YELLOW
            ;;
        "ERROR")
            color=$RED
            ;;
    esac

    echo -e "${color}[$level]${NC} $message"
}

# Fonction de vérification de fichier
check_file_exists() {
    local file_path=$1
    local file_description=$2

    if [ ! -f "$file_path" ]; then
        log "ERROR" "Le fichier $file_description n'existe pas: $file_path"
        exit 1
    fi

    if [ "$VERBOSE" = true ]; then
        log "INFO" "Fichier $file_description trouvé: $file_path"
    fi
}

# Fonction de chargement de configuration
load_config() {
    local config_path=$1

    check_file_exists "$config_path" "de configuration"

    log "INFO" "Chargement de la configuration depuis $config_path"

    # Lire le fichier de configuration JSON
    if command -v jq >/dev/null 2>&1; then
        if [ -z "$SCHEMA_PATH" ]; then
            SCHEMA_PATH=$(jq -r '.schemaPath // ""' "$config_path")
        fi
        if [ -z "$OUTPUT_DIR" ]; then
            OUTPUT_DIR=$(jq -r '.outputDir // ""' "$config_path")
            if [ -z "$OUTPUT_DIR" ]; then
                OUTPUT_DIR="$PROJECT_ROOT/outputs/type-audit"
            fi
        fi
        if [ "$DEEP_ANALYSIS" = false ]; then
            DEEP_ANALYSIS=$(jq -r '.deepAnalysis // false' "$config_path")
            if [ "$DEEP_ANALYSIS" = "true" ]; then
                DEEP_ANALYSIS=true
            else
                DEEP_ANALYSIS=false
            fi
        fi
        if [ "$ADJUST_SIZES" = false ]; then
            ADJUST_SIZES=$(jq -r '.adjustSizes // false' "$config_path")
            if [ "$ADJUST_SIZES" = "true" ]; then
                ADJUST_SIZES=true
            else
                ADJUST_SIZES=false
            fi
        fi
        if [ "$DETECT_ENUMS" = false ]; then
            DETECT_ENUMS=$(jq -r '.detectEnums // false' "$config_path")
            if [ "$DETECT_ENUMS" = "true" ]; then
                DETECT_ENUMS=true
            else
                DETECT_ENUMS=false
            fi
        fi
    else
        log "WARNING" "jq n'est pas installé, impossible de parser correctement le fichier de configuration JSON."
        log "WARNING" "Installation recommandée: sudo apt-get install jq"
    fi

    CONFIG_LOADED=true
}

# Fonction pour exécuter l'audit
run_audit() {
    local schema_path=$1
    local output_dir=$2

    # Vérifier le fichier de schéma
    check_file_exists "$schema_path" "de schéma"

    # Créer le dossier de sortie s'il n'existe pas
    mkdir -p "$output_dir"

    # Construire les arguments
    local args=""
    
    if [ "$DEEP_ANALYSIS" = true ]; then
        args="$args --deep-analysis"
    fi
    
    if [ "$ADJUST_SIZES" = true ]; then
        args="$args --adjust-sizes"
    fi
    
    if [ "$DETECT_ENUMS" = true ]; then
        args="$args --detect-enums"
    fi

    args="$args --output-dir $output_dir"

    # Exécuter l'agent d'audit
    log "INFO" "Exécution de l'audit sur $schema_path"
    log "INFO" "Arguments: $args"
    
    if [ "$VERBOSE" = true ]; then
        npx ts-node "$PROJECT_ROOT/agents/migration/type-audit-agent.ts" "$schema_path" $args
    else
        npx ts-node "$PROJECT_ROOT/agents/migration/type-audit-agent.ts" "$schema_path" $args > /dev/null
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "SUCCESS" "Audit terminé avec succès! Résultats dans $output_dir"
        echo
        echo -e "${GREEN}Fichiers générés:${NC}"
        echo -e "  - ${CYAN}type_conversion_map.json${NC}: Mappings de conversion de types"
        echo -e "  - ${CYAN}field_typing_issues.md${NC}: Rapport des problèmes de typage"
        echo -e "  - ${CYAN}prisma_enum.suggestion.prisma${NC}: Énumérations Prisma générées"
        echo -e "  - ${CYAN}mysql_schema_converted.json${NC}: Schéma avec types convertis"
        echo
        echo -e "${YELLOW}Prochaines étapes suggérées:${NC}"
        echo -e "  - Exécutez ${CYAN}./scripts/run-type-audit.sh integrate --prisma-schema=<path>${NC} pour intégrer les énumérations"
        echo -e "  - Consultez le rapport ${CYAN}$output_dir/field_typing_issues.md${NC} pour les problèmes détectés"
        echo
    else
        log "ERROR" "L'audit a échoué avec le code d'erreur $exit_code"
        exit $exit_code
    fi
}

# Fonction pour comparer deux audits
compare_audits() {
    local baseline_path=$1
    local current_path=$2

    check_file_exists "$baseline_path" "d'audit de référence"
    check_file_exists "$current_path" "d'audit actuel"

    log "INFO" "Comparaison des audits $baseline_path et $current_path"

    # Implémenter la logique de comparaison
    # Pour l'instant, simplement utiliser diff
    if command -v jq >/dev/null 2>&1; then
        local diff_output=$(jq --argfile a "$baseline_path" --argfile b "$current_path" -n '
            def count_issues: 
                if type == "object" and .issues then .issues | length else 0 end;
            def count_enums: 
                if type == "object" and .enums then .enums | length else 0 end;
            def count_conversion_types:
                if type == "object" and .typeConversionMap then .typeConversionMap | keys | length else 0 end;
            
            {
                baseline: {
                    issues_count: ($a | count_issues),
                    enums_count: ($a | count_enums),
                    conversion_types_count: ($a | count_conversion_types)
                },
                current: {
                    issues_count: ($b | count_issues),
                    enums_count: ($b | count_enums),
                    conversion_types_count: ($b | count_conversion_types)
                },
                diff: {
                    issues: (($b | count_issues) - ($a | count_issues)),
                    enums: (($b | count_enums) - ($a | count_enums)),
                    conversion_types: (($b | count_conversion_types) - ($a | count_conversion_types))
                }
            }
        ')

        echo -e "${BLUE}Résultat de la comparaison:${NC}"
        echo "$diff_output" | jq .
    else
        log "WARNING" "jq n'est pas installé, utilisation de diff basique"
        diff -u "$baseline_path" "$current_path" || true
    fi
}

# Fonction pour intégrer les résultats d'audit
integrate_results() {
    local prisma_schema=$1
    local output_dir=$2
    local enum_only=$3

    check_file_exists "$prisma_schema" "de schéma Prisma"

    local enum_file="$output_dir/prisma_enum.suggestion.prisma"
    check_file_exists "$enum_file" "d'énumérations Prisma"

    log "INFO" "Intégration des résultats d'audit dans $prisma_schema"

    # Créer une sauvegarde du schéma Prisma original
    local backup_file="${prisma_schema}.bak"
    cp "$prisma_schema" "$backup_file"
    log "INFO" "Sauvegarde du schéma original dans $backup_file"

    if [ "$enum_only" = true ]; then
        # Intégrer uniquement les énumérations
        log "INFO" "Intégration uniquement des énumérations"
        
        # Extraire les définitions d'enum du fichier d'énumérations
        local enum_defs=$(grep -v "^//" "$enum_file")
        
        # Vérifier si le fichier Prisma contient déjà des énumérations
        if grep -q "enum " "$prisma_schema"; then
            # Insérer après la dernière énumération
            log "INFO" "Schéma contient déjà des énumérations, ajout après les énumérations existantes"
            sed -i "/^enum .*/,/^}/!b;/^}/a\\
\\
$enum_defs" "$prisma_schema"
        else
            # Insérer après la définition du datasource
            log "INFO" "Aucune énumération existante, ajout après le datasource"
            sed -i "/^datasource db .*/,/^}/!b;/^}/a\\
\\
$enum_defs" "$prisma_schema"
        fi
    else
        # Implémentation complète de l'intégration
        log "WARNING" "L'intégration complète n'est pas encore implémentée"
        log "INFO" "Pour l'instant, seules les énumérations sont intégrées"
        
        # Extraire les définitions d'enum du fichier d'énumérations
        local enum_defs=$(grep -v "^//" "$enum_file")
        
        # Vérifier si le fichier Prisma contient déjà des énumérations
        if grep -q "enum " "$prisma_schema"; then
            # Insérer après la dernière énumération
            log "INFO" "Schéma contient déjà des énumérations, ajout après les énumérations existantes"
            sed -i "/^enum .*/,/^}/!b;/^}/a\\
\\
$enum_defs" "$prisma_schema"
        else
            # Insérer après la définition du datasource
            log "INFO" "Aucune énumération existante, ajout après le datasource"
            sed -i "/^datasource db .*/,/^}/!b;/^}/a\\
\\
$enum_defs" "$prisma_schema"
        fi
    fi

    log "SUCCESS" "Intégration terminée! Schéma mis à jour: $prisma_schema"
}

# Fonction pour exécuter un audit par lot
run_batch() {
    local output_dir=$1

    # Vérifier si un répertoire de schémas a été fourni
    if [ -z "$SCHEMA_PATH" ] || [ ! -d "$SCHEMA_PATH" ]; then
        log "ERROR" "Pour l'action 'batch', --schema doit être un répertoire existant"
        exit 1
    fi

    # Créer le dossier de sortie principal
    mkdir -p "$output_dir"

    # Trouver tous les fichiers JSON dans le répertoire
    local schema_files=$(find "$SCHEMA_PATH" -name "*.json" -type f)
    local count=$(echo "$schema_files" | wc -l)

    if [ "$count" -eq 0 ]; then
        log "ERROR" "Aucun fichier JSON trouvé dans $SCHEMA_PATH"
        exit 1
    fi

    log "INFO" "Exécution de l'audit sur $count fichiers de schéma dans $SCHEMA_PATH"

    # Initialiser un compteur
    local i=1

    # Traiter chaque fichier JSON
    for schema_file in $schema_files; do
        local schema_name=$(basename "$schema_file" .json)
        local schema_output_dir="$output_dir/$schema_name"
        
        log "INFO" "[$i/$count] Traitement de $schema_name"
        
        # Exécuter l'audit pour ce schéma
        run_audit "$schema_file" "$schema_output_dir"
        
        ((i++))
    done

    log "SUCCESS" "Traitement par lot terminé! Tous les résultats sont dans $output_dir"
}

# Traitement des arguments
ACTION="$1"
shift

if [ -z "$ACTION" ]; then
    show_help
    exit 1
fi

# Traiter les arguments
for arg in "$@"; do
    case $arg in
        --schema=*)
            SCHEMA_PATH="${arg#*=}"
            ;;
        --output-dir=*)
            OUTPUT_DIR="${arg#*=}"
            ;;
        --config=*)
            CONFIG_PATH="${arg#*=}"
            ;;
        --baseline=*)
            BASELINE_PATH="${arg#*=}"
            ;;
        --current=*)
            CURRENT_PATH="${arg#*=}"
            ;;
        --prisma-schema=*)
            PRISMA_SCHEMA="${arg#*=}"
            ;;
        --deep)
            DEEP_ANALYSIS=true
            ;;
        --adjust-sizes)
            ADJUST_SIZES=true
            ;;
        --detect-enums)
            DETECT_ENUMS=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --enum-only)
            ENUM_ONLY=true
            ;;
        *)
            log "WARNING" "Option inconnue: $arg"
            ;;
    esac
done

# Charger la configuration si spécifiée
if [ -n "$CONFIG_PATH" ]; then
    load_config "$CONFIG_PATH"
fi

# Si aucune option n'est spécifiée et que la configuration n'est pas chargée,
# activer les options par défaut pour un comportement raisonnable
if [ "$DEEP_ANALYSIS" = false ] && [ "$ADJUST_SIZES" = false ] && [ "$DETECT_ENUMS" = false ] && [ "$CONFIG_LOADED" = false ]; then
    log "INFO" "Aucune option spécifiée, activation des options par défaut --adjust-sizes --detect-enums"
    ADJUST_SIZES=true
    DETECT_ENUMS=true
fi

# Exécuter l'action appropriée
case $ACTION in
    "run")
        if [ -z "$SCHEMA_PATH" ]; then
            log "ERROR" "Veuillez spécifier un fichier de schéma avec --schema=<path>"
            exit 1
        fi
        run_audit "$SCHEMA_PATH" "$OUTPUT_DIR"
        ;;
    "compare")
        if [ -z "$BASELINE_PATH" ] || [ -z "$CURRENT_PATH" ]; then
            log "ERROR" "Veuillez spécifier les chemins des audits à comparer avec --baseline=<path> et --current=<path>"
            exit 1
        fi
        compare_audits "$BASELINE_PATH" "$CURRENT_PATH"
        ;;
    "integrate")
        if [ -z "$PRISMA_SCHEMA" ]; then
            log "ERROR" "Veuillez spécifier un schéma Prisma avec --prisma-schema=<path>"
            exit 1
        fi
        integrate_results "$PRISMA_SCHEMA" "$OUTPUT_DIR" "$ENUM_ONLY"
        ;;
    "batch")
        run_batch "$OUTPUT_DIR"
        ;;
    "help")
        show_help
        ;;
    *)
        log "ERROR" "Action inconnue: $ACTION"
        show_help
        exit 1
        ;;
esac

exit 0