#!/usr/bin/env bash

# Script de migration progressive avec système unifié
# Ce script orchestre la migration d'un projet PHP vers NestJS/Remix
# en utilisant le coordinateur d'agents et la configuration centralisée

set -e

# Charger les configurations et variables d'environnement
source ./config/env.sh

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher une bannière
print_banner() {
  echo -e "${BLUE}"
  echo "┌─────────────────────────────────────────────────┐"
  echo "│                                                 │"
  echo "│       MIGRATION PROGRESSIVE PHP → NESTJS        │"
  echo "│                                                 │"
  echo "└─────────────────────────────────────────────────┘"
  echo -e "${NC}"
  echo "Version: $(node -p "require('./package.json').version")"
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
}

# Afficher l'utilisation du script
show_usage() {
  echo -e "${YELLOW}Usage:${NC}"
  echo "  $0 [options] <chemin-source>"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  -h, --help               Afficher cette aide"
  echo "  -v, --verbose            Mode verbeux"
  echo "  -f, --force              Forcer la réexécution des agents"
  echo "  -p, --parallel           Exécuter les agents en parallèle"
  echo "  -s, --step <étape>       Exécuter uniquement l'étape spécifiée"
  echo "  -a, --agents <agents>    Liste d'agents à exécuter (séparés par des virgules)"
  echo "  -o, --output <dir>       Dossier de sortie pour les rapports"
  echo "  -d, --dashboard          Lancer le tableau de bord après l'exécution"
  echo "  -c, --cahier <path>      Chemin vers le cahier des charges"
  echo "  --no-deps                Désactiver la vérification des dépendances"
  echo "  --no-cahier              Désactiver la validation avec le cahier des charges"
  echo ""
  echo -e "${YELLOW}Étapes disponibles:${NC}"
  echo "  1. discovery             Découverte du code source"
  echo "  2. analysis              Analyse du code source"
  echo "  3. planning              Planification de la migration"
  echo "  4. migration             Migration effective du code"
  echo "  5. testing               Tests de la nouvelle implémentation"
  echo "  6. deployment            Déploiement de la nouvelle implémentation"
  echo ""
  echo -e "${YELLOW}Exemple:${NC}"
  echo "  $0 --parallel --step analysis ./src/modules/users"
}

# Fonction pour afficher le statut d'une étape
print_step() {
  local step="$1"
  local description="$2"
  echo -e "${CYAN}[$step]${NC} $description"
}

# Fonction pour afficher une information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher un succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher un avertissement
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Fonction pour afficher une erreur
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
  print_step "PRÉREQUIS" "Vérification des dépendances requises..."
  
  # Vérifier Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérifier npm/pnpm/yarn
  if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
  elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
  elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
  else
    error "Aucun gestionnaire de paquets (npm, yarn, pnpm) n'est installé."
    exit 1
  fi
  
  # Vérifier TypeScript
  if ! command -v tsc &> /dev/null; then
    warning "TypeScript n'est pas installé globalement. Installation locale..."
    $PACKAGE_MANAGER add -D typescript ts-node
  fi
  
  # Vérifier que le fichier de configuration existe
  if [ ! -f ./config/config.ts ]; then
    error "Le fichier de configuration n'existe pas: ./config/config.ts"
    exit 1
  fi
  
  success "Toutes les dépendances sont installées."
}

# Fonction pour charger la configuration
load_config() {
  print_step "CONFIG" "Chargement de la configuration..."
  
  # Charger la configuration via Node.js
  CONFIG=$(node -e "const { loadConfig } = require('./dist/config/config'); console.log(JSON.stringify(loadConfig()))")
  
  if [ $? -ne 0 ]; then
    error "Impossible de charger la configuration."
    exit 1
  fi
  
  # Extraire les chemins et les options de configuration
  PATHS=$(echo $CONFIG | jq -r '.PATHS')
  AGENTS_CONFIG=$(echo $CONFIG | jq -r '.AGENTS')
  ORCHESTRATOR_CONFIG=$(echo $CONFIG | jq -r '.ORCHESTRATOR')
  
  success "Configuration chargée avec succès."
}

# Fonction pour compiler le code TypeScript
compile_typescript() {
  print_step "COMPILATION" "Compilation du code TypeScript..."
  
  $PACKAGE_MANAGER run build
  
  if [ $? -ne 0 ]; then
    error "Échec de la compilation du code TypeScript."
    exit 1
  fi
  
  success "Code TypeScript compilé avec succès."
}

# Fonction pour exécuter l'étape de découverte
run_discovery() {
  print_step "DÉCOUVERTE" "Analyse du code source..."
  
  local source_dir="$1"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.DISCOVERY_OUTPUT')}"
  
  info "Analyse du répertoire: $source_dir"
  info "Résultats stockés dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Exécuter l'agent de découverte PHP
  node dist/agents/php-discovery-engine.js --source "$source_dir" --output "$output_dir" ${ARGS[verbose]} ${ARGS[force]}
  
  if [ $? -ne 0 ]; then
    error "Échec de la découverte du code source."
    return 1
  fi
  
  # Générer la carte de découverte
  node dist/scripts/generate-discovery-map.js --source "$output_dir" --output "$output_dir/discovery_map.json"
  
  success "Découverte terminée. Carte générée: $output_dir/discovery_map.json"
}

# Fonction pour exécuter l'étape d'analyse
run_analysis() {
  print_step "ANALYSE" "Analyse approfondie du code découvert..."
  
  local discovery_map="${ARGS[discovery_map]:-$(echo $PATHS | jq -r '.DISCOVERY_MAP')}"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.ANALYSIS_OUTPUT')}"
  local agents="${ARGS[agents]}"
  local parallel_flag=""
  
  if [ "${ARGS[parallel]}" = true ]; then
    parallel_flag="--parallel"
  fi
  
  if [ -n "$agents" ]; then
    agents_flag="--agents $agents"
  else
    agents_flag="--agents $(echo $AGENTS_CONFIG | jq -r '.DEFAULT_ORDER | join(",")')"
  fi
  
  info "Utilisation de la carte de découverte: $discovery_map"
  info "Résultats stockés dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Exécuter le coordinateur d'agents
  node dist/agents/coordinator-agent.js "$discovery_map" --output "$output_dir" $parallel_flag $agents_flag ${ARGS[force]} ${ARGS[no_deps]} ${ARGS[no_cahier]} ${ARGS[cahier]}
  
  if [ $? -ne 0 ]; then
    error "Échec de l'analyse du code source."
    return 1
  fi
  
  success "Analyse terminée. Rapports générés dans: $output_dir"
}

# Fonction pour exécuter l'étape de planification
run_planning() {
  print_step "PLANIFICATION" "Génération du plan de migration..."
  
  local analysis_dir="${ARGS[analysis_dir]:-$(echo $PATHS | jq -r '.ANALYSIS_OUTPUT')}"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.PLANNING_OUTPUT')}"
  
  info "Utilisation des résultats d'analyse: $analysis_dir"
  info "Plan de migration stocké dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Exécuter l'agent de génération du plan de migration
  node dist/agents/generate-migration-plan.js --analysis "$analysis_dir" --output "$output_dir" ${ARGS[verbose]} ${ARGS[force]}
  
  if [ $? -ne 0 ]; then
    error "Échec de la génération du plan de migration."
    return 1
  fi
  
  success "Plan de migration généré: $output_dir/migration_plan.json"
  
  # Générer le rapport de migration détaillé au format Markdown
  node dist/scripts/generate-migration-report.js --plan "$output_dir/migration_plan.json" --output "$output_dir/migration_report.md"
  
  success "Rapport détaillé généré: $output_dir/migration_report.md"
}

# Fonction pour exécuter l'étape de migration
run_migration() {
  print_step "MIGRATION" "Exécution de la migration du code..."
  
  local plan_file="${ARGS[plan_file]:-$(echo $PATHS | jq -r '.PLANNING_OUTPUT')/migration_plan.json}"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.MIGRATION_OUTPUT')}"
  
  info "Utilisation du plan de migration: $plan_file"
  info "Code migré stocké dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Vérifier que le plan de migration existe
  if [ ! -f "$plan_file" ]; then
    error "Le plan de migration n'existe pas: $plan_file"
    error "Veuillez d'abord exécuter l'étape de planification."
    return 1
  fi
  
  # Exécuter l'agent de migration progressif
  node dist/agents/progressive-migration-agent.js --plan "$plan_file" --output "$output_dir" ${ARGS[verbose]} ${ARGS[force]}
  
  if [ $? -ne 0 ]; then
    error "Échec de la migration du code."
    return 1
  fi
  
  success "Migration terminée. Code migré disponible dans: $output_dir"
}

# Fonction pour exécuter l'étape de test
run_testing() {
  print_step "TESTS" "Exécution des tests sur le code migré..."
  
  local migrated_dir="${ARGS[migrated_dir]:-$(echo $PATHS | jq -r '.MIGRATION_OUTPUT')}"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.TESTING_OUTPUT')}"
  
  info "Tests sur le code migré: $migrated_dir"
  info "Résultats des tests stockés dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Lancer les tests automatisés
  cd "$migrated_dir" && $PACKAGE_MANAGER test -- --json --outputFile="../$output_dir/test_results.json"
  
  if [ $? -ne 0 ]; then
    warning "Certains tests ont échoué. Consultez les détails dans le rapport."
  else
    success "Tous les tests ont réussi!"
  fi
  
  # Générer le rapport de couverture de tests
  node dist/scripts/generate-test-report.js --results "$output_dir/test_results.json" --output "$output_dir/test_report.md"
  
  success "Rapport de tests généré: $output_dir/test_report.md"
}

# Fonction pour exécuter l'étape de déploiement
run_deployment() {
  print_step "DÉPLOIEMENT" "Préparation du déploiement..."
  
  local migrated_dir="${ARGS[migrated_dir]:-$(echo $PATHS | jq -r '.MIGRATION_OUTPUT')}"
  local output_dir="${ARGS[output]:-$(echo $PATHS | jq -r '.DEPLOYMENT_OUTPUT')}"
  
  info "Code à déployer: $migrated_dir"
  info "Artefacts de déploiement stockés dans: $output_dir"
  
  # Créer le répertoire de sortie s'il n'existe pas
  mkdir -p "$output_dir"
  
  # Construire l'application
  cd "$migrated_dir" && $PACKAGE_MANAGER run build
  
  if [ $? -ne 0 ]; then
    error "Échec de la construction de l'application pour le déploiement."
    return 1
  fi
  
  # Préparer les fichiers de déploiement
  cp -r "$migrated_dir/dist" "$output_dir/"
  cp "$migrated_dir/package.json" "$output_dir/"
  cp "$migrated_dir/ecosystem.config.js" "$output_dir/" 2>/dev/null || true
  
  # Générer la documentation de déploiement
  node dist/scripts/generate-deployment-docs.js --output "$output_dir/deployment_instructions.md"
  
  success "Déploiement préparé. Artefacts disponibles dans: $output_dir"
  success "Instructions de déploiement: $output_dir/deployment_instructions.md"
}

# Fonction pour lancer le tableau de bord
run_dashboard() {
  print_step "TABLEAU DE BORD" "Lancement du tableau de bord..."
  
  # Démarrer un serveur HTTP simple pour le tableau de bord
  if command -v npx &> /dev/null; then
    npx serve -s ./dashboard &
    DASHBOARD_PID=$!
    info "Tableau de bord disponible à l'adresse: http://localhost:3000"
    info "Appuyez sur Ctrl+C pour arrêter le tableau de bord."
    wait $DASHBOARD_PID
  else
    error "npx n'est pas disponible. Impossible de lancer le tableau de bord."
    info "Vous pouvez lancer le tableau de bord manuellement avec: npx serve -s ./dashboard"
    return 1
  fi
}

# Initialiser les arguments avec leurs valeurs par défaut
declare -A ARGS
ARGS[verbose]=false
ARGS[force]=false
ARGS[parallel]=false
ARGS[dashboard]=false
ARGS[no_deps]=false
ARGS[no_cahier]=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    -v|--verbose)
      ARGS[verbose]="--verbose"
      shift
      ;;
    -f|--force)
      ARGS[force]="--force"
      shift
      ;;
    -p|--parallel)
      ARGS[parallel]=true
      shift
      ;;
    -s|--step)
      ARGS[step]="$2"
      shift 2
      ;;
    -a|--agents)
      ARGS[agents]="$2"
      shift 2
      ;;
    -o|--output)
      ARGS[output]="$2"
      shift 2
      ;;
    -d|--dashboard)
      ARGS[dashboard]=true
      shift
      ;;
    -c|--cahier)
      ARGS[cahier]="--cahier $2"
      shift 2
      ;;
    --no-deps)
      ARGS[no_deps]="--no-deps"
      shift
      ;;
    --no-cahier)
      ARGS[no_cahier]="--no-cahier"
      shift
      ;;
    -*)
      error "Option inconnue: $1"
      show_usage
      exit 1
      ;;
    *)
      if [ -z "${ARGS[source]}" ]; then
        ARGS[source]="$1"
      else
        error "Argument inattendu: $1"
        show_usage
        exit 1
      fi
      shift
      ;;
  esac
done

# Vérifier qu'un répertoire source a été spécifié
if [ -z "${ARGS[source]}" ] && [ "${ARGS[step]}" != "dashboard" ]; then
  error "Vous devez spécifier un répertoire source."
  show_usage
  exit 1
fi

# Vérifier que le répertoire source existe
if [ -n "${ARGS[source]}" ] && [ ! -d "${ARGS[source]}" ] && [ ! -f "${ARGS[source]}" ]; then
  error "Le chemin source n'existe pas: ${ARGS[source]}"
  exit 1
fi

# Fonction principale
main() {
  print_banner
  
  # Vérifier les prérequis
  check_prerequisites
  
  # Compiler le code TypeScript
  compile_typescript
  
  # Charger la configuration
  load_config
  
  # Exécuter l'étape spécifiée ou toutes les étapes
  case "${ARGS[step]}" in
    discovery)
      run_discovery "${ARGS[source]}"
      ;;
    analysis)
      run_analysis
      ;;
    planning)
      run_planning
      ;;
    migration)
      run_migration
      ;;
    testing)
      run_testing
      ;;
    deployment)
      run_deployment
      ;;
    dashboard)
      run_dashboard
      ;;
    "")
      # Exécuter toutes les étapes
      run_discovery "${ARGS[source]}" && \
      run_analysis && \
      run_planning && \
      run_migration && \
      run_testing && \
      run_deployment
      
      # Lancer le tableau de bord si demandé
      if [ "${ARGS[dashboard]}" = true ]; then
        run_dashboard
      fi
      ;;
    *)
      error "Étape inconnue: ${ARGS[step]}"
      show_usage
      exit 1
      ;;
  esac
}

# Exécuter la fonction principale
main