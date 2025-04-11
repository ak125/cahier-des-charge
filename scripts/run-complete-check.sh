#!/bin/bash

# =================================================================
# Script de vérification complète du cahier des charges
# Exécution dans GitHub Codespaces ou environnement local
# Auteur: AI Assistant
# Version: 2.0
# =================================================================

set -o pipefail  # Pour capturer les erreurs dans les pipes

# Définir les couleurs pour un affichage plus lisible
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variables globales
START_TIME=$(date +%s)
REPORT_FILE=""
CONFIG_FILE="cahier_check.config.json"
ALL_SUCCESS=true
VERBOSE=false
AUTO_FIX=false
SKIP_TESTS=""
FORCE_REGENERATE=false

# Bannière du programme
show_banner() {
    echo -e "${BLUE}${BOLD}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║                                                  ║"
    echo "║     🚀 Vérification complète du Cahier des      ║"
    echo "║             Charges - Codespaces                ║"
    echo "║                                                  ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Fonction d'aide
show_help() {
    echo -e "${CYAN}Usage: $0 [options]${NC}"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Afficher cette aide"
    echo "  -v, --verbose              Mode verbeux"
    echo "  -f, --fix                  Correction automatique des problèmes"
    echo "  -s, --skip TESTS           Ignorer certains tests (comma-separated list)"
    echo "                             Valeurs possibles: update,verify,deduplicate,similarity,render"
    echo "  -r, --regenerate           Forcer la régénération de tous les fichiers"
    echo ""
    echo "Exemple:"
    echo "  $0 --verbose --skip update,render"
    echo ""
}

# Analyse des arguments de ligne de commande
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                ;;
            -f|--fix)
                AUTO_FIX=true
                ;;
            -s|--skip)
                SKIP_TESTS="$2"
                shift
                ;;
            -r|--regenerate)
                FORCE_REGENERATE=true
                ;;
            *)
                echo -e "${RED}Option inconnue: $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Vérification de l'environnement
check_environment() {
    # Vérifier que Node.js est installé
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js n'est pas installé.${NC}"
        exit 1
    fi
    
    # Vérifier la version de Node.js
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
    if [ $NODE_MAJOR -lt 14 ]; then
        echo -e "${YELLOW}⚠️ Node.js v$NODE_VERSION détecté. Recommandé: v14+${NC}"
    else
        echo -e "${GREEN}✓ Node.js v$NODE_VERSION${NC}"
    fi
    
    # Vérifier que npm est installé
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm n'est pas installé.${NC}"
        exit 1
    fi
    
    # Vérifier que TypeScript est installé
    if ! command -v npx tsc &> /dev/null; then
        echo -e "${YELLOW}⚠️ TypeScript n'est pas installé globalement. Installation...${NC}"
        npm install -g typescript
    fi
    
    # Vérifier les dépendances du package.json
    if [ -f "package.json" ]; then
        local missing_deps=false
        
        # Vérifier les dépendances essentielles
        for dep in "chalk" "ts-node"; do
            if ! grep -q "\"$dep\"" package.json; then
                echo -e "${YELLOW}⚠️ Dépendance manquante: $dep. Installation...${NC}"
                npm install --save-dev $dep
                missing_deps=true
            fi
        done
        
        # Installer les dépendances si nécessaire
        if [ "$missing_deps" = true ]; then
            echo -e "${BLUE}📦 Installation des dépendances...${NC}"
            npm install
        fi
    else
        echo -e "${YELLOW}⚠️ Aucun package.json trouvé. Création d'un package.json basique...${NC}"
        npm init -y
        npm install --save-dev ts-node typescript chalk
    fi
    
    # Créer les répertoires nécessaires
    mkdir -p logs
    mkdir -p dist
    mkdir -p cahier
}

# Initialiser le rapport
init_report() {
    REPORT_FILE="logs/complete-check-report-$(date +%Y%m%d-%H%M%S).md"
    
    echo "# Rapport de vérification complète du cahier des charges" > $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "Date: $(date)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    # Ajouter les informations d'environnement
    echo "## Environnement" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Système**: $(uname -a)" >> $REPORT_FILE
    echo "- **Node.js**: $(node -v)" >> $REPORT_FILE
    echo "- **Options**: $([[ $VERBOSE == true ]] && echo "Verbeux, ")$([[ $AUTO_FIX == true ]] && echo "Auto-fix, ")$([[ ! -z $SKIP_TESTS ]] && echo "Tests ignorés: $SKIP_TESTS, ")$([[ $FORCE_REGENERATE == true ]] && echo "Régénération forcée")" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    echo "## Résumé des vérifications" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
}

# Crée ou met à jour le fichier de configuration
ensure_config() {
    if [ ! -f "$CONFIG_FILE" ] || [ "$FORCE_REGENERATE" = true ]; then
        echo -e "${YELLOW}⚠️ Génération du fichier de configuration...${NC}"
        
        # Créer un fichier de configuration par défaut
        cat > $CONFIG_FILE << EOL
{
  "paths": {
    "cahier": "./cahier/",
    "scripts": "./scripts/",
    "logs": "./logs/",
    "htmlOutput": "./dist/cahier.html"
  },
  "rules": {
    "maxDuplicateThreshold": 0.92,
    "minStructureScore": 75,
    "allowInlineJS": false,
    "requireAuditMd": true
  },
  "github": {
    "owner": "votre-org",
    "repo": "remix-nestjs-monorepo",
    "branch": "main",
    "autoPR": true
  }
}
EOL
        echo -e "${GREEN}✅ Fichier de configuration créé${NC}"
    else
        echo -e "${GREEN}✓ Fichier de configuration existant${NC}"
    fi
}

# Vérifie les scripts nécessaires et les installe si besoin
check_scripts() {
    local missing_count=0
    local scripts_dir="scripts"
    
    # Liste des scripts essentiels
    local required_scripts=(
        "verify-cahier.ts"
        "update-cahier.ts"
        "deduplicate-files.ts"
        "analyze-similarity.ts"
        "render-html.ts"
    )
    
    echo -e "${BLUE}🔍 Vérification des scripts nécessaires...${NC}"
    
    # Vérifier chaque script
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$scripts_dir/$script" ]; then
            missing_count=$((missing_count + 1))
            
            echo -e "${YELLOW}⚠️ Script manquant: $script${NC}"
            
            if [ "$FORCE_REGENERATE" = true ]; then
                echo -e "${BLUE}📝 Génération automatique du script $script...${NC}"
                
                # Ici, nous pourrions appeler une fonction spécifique pour générer chaque script
                # Pour l'instant, nous allons simplement créer un stub
                mkdir -p "$scripts_dir"
                echo -e "// Stub for $script\nconsole.log('Script $script needs to be implemented');" > "$scripts_dir/$script"
                
                echo -e "${GREEN}✓ Script $script créé (stub)${NC}"
            fi
        else
            if [ "$VERBOSE" = true ]; then
                echo -e "${GREEN}✓ Script $script présent${NC}"
            fi
        fi
    done
    
    if [ $missing_count -eq 0 ]; then
        echo -e "${GREEN}✅ Tous les scripts nécessaires sont présents${NC}"
    elif [ "$FORCE_REGENERATE" = true ]; then
        echo -e "${YELLOW}⚠️ $missing_count scripts manquants ont été créés en tant que stubs${NC}"
    else
        echo -e "${YELLOW}⚠️ $missing_count scripts manquants. Utilisez --regenerate pour générer des stubs.${NC}"
    fi
}

# Exécute un script de vérification et génère un rapport
run_check() {
    local script=$1
    local name=$2
    local skip_pattern=$3
    
    # Vérifier si ce test doit être ignoré
    if [[ ! -z $SKIP_TESTS && $SKIP_TESTS == *"$skip_pattern"* ]]; then
        echo -e "${YELLOW}⏩ Ignoré: $name${NC}"
        
        # Ajouter au rapport
        echo "### $name" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        echo "⏩ **Ignoré** (par configuration)" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        
        return 0
    fi
    
    local start_time=$(date +%s)
    echo -e "${BLUE}🔍 Exécution de $name...${NC}"
    
    # Vérifier si le script existe
    if [ ! -f "$script" ]; then
        echo -e "${RED}❌ Script non trouvé: $script${NC}"
        
        # Ajouter au rapport
        echo "### $name" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        echo "❌ **Erreur**: Script non trouvé: $script" >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        
        ALL_SUCCESS=false
        return 1
    fi
    
    # Ajouter l'en-tête de la vérification au rapport
    echo "### $name" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    # Construire la commande avec les options
    local cmd=""
    if [ "${script##*.}" == "ts" ]; then
        cmd="npx ts-node $script"
        if [ "$AUTO_FIX" = true ]; then
            cmd="$cmd --auto-fix"
        fi
        if [ "$VERBOSE" = true ]; then
            cmd="$cmd --verbose"
        fi
    else
        cmd="bash $script"
        if [ "$AUTO_FIX" = true ]; then
            cmd="$cmd --fix"
        fi
        if [ "$VERBOSE" = true ]; then
            cmd="$cmd --verbose"
        fi
    fi
    
    # Exécuter le script et capturer la sortie
    OUTPUT=$(eval $cmd 2>&1)
    EXIT_CODE=$?
    
    # Calculer le temps d'exécution
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Formater la durée
    local duration_formatted
    if [ $duration -lt 60 ]; then
        duration_formatted="${duration}s"
    else
        local minutes=$((duration / 60))
        local seconds=$((duration % 60))
        duration_formatted="${minutes}m ${seconds}s"
    fi
    
    # Ajouter le résultat au rapport
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ $name terminé avec succès (${duration_formatted})${NC}"
        echo "✅ **Succès** (${duration_formatted})" >> $REPORT_FILE
    else
        echo -e "${RED}❌ $name a échoué (code: $EXIT_CODE, ${duration_formatted})${NC}"
        echo "❌ **Échec** (code: $EXIT_CODE, ${duration_formatted})" >> $REPORT_FILE
        ALL_SUCCESS=false
    fi
    
    echo "" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
    echo "$OUTPUT" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    # Afficher un extrait du résultat
    echo "$OUTPUT" | head -n 5
    if [ $(echo "$OUTPUT" | wc -l) -gt 5 ]; then
        echo -e "${YELLOW}[...] (voir le rapport complet pour plus de détails)${NC}"
    fi
    echo ""
}

# Résumé final
show_summary() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - START_TIME))
    
    echo -e "${BLUE}📊 Résumé de la vérification complète${NC}"
    if [ "$ALL_SUCCESS" = true ]; then
        echo -e "${GREEN}✅ Vérification terminée avec succès${NC}"
    else
        echo -e "${RED}❌ Vérification terminée avec des erreurs${NC}"
    fi
    echo -e "${BLUE}📄 Rapport complet disponible: ${NC}$REPORT_FILE"
    
    echo ""
    echo "Pour visualiser le rapport complet, exécutez:"
    echo "cat $REPORT_FILE"
    
    # Ajouter un résumé au rapport
    echo "## Conclusion" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "Vérification complète terminée le $(date)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "Durée totale: ${total_duration}s" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "Tous les résultats détaillés sont disponibles dans les sections ci-dessus." >> $REPORT_FILE
}

# Main
show_banner
parse_args "$@"
check_environment
init_report
ensure_config
check_scripts

# Exécuter les vérifications
run_check "scripts/update-cahier.ts" "Mise à jour du cahier des charges" "update"
run_check "scripts/verify-cahier.ts" "Vérification de cohérence" "verify"
run_check "scripts/deduplicate-files.ts" "Déduplication des fichiers" "deduplicate"
run_check "scripts/analyze-similarity.ts" "Analyse de similarité" "similarity"
run_check "scripts/render-html.ts" "Génération vue HTML" "render"

show_summary
