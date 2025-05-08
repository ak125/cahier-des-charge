#!/bin/bash

# start_pipeline.sh
# Script d'orchestration du pipeline MCP pour la migration PHP -> Remix/NestJS
# Date: 2025-04-13

# Variables de configuration
MCP_SERVER_URL=${MCP_SERVER_URL:-"http://localhost:3030"}
N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL:-"http://localhost:5678/webhook/"}
SUPABASE_URL=${SUPABASE_URL:-"http://localhost:8000"}
SUPABASE_KEY=${SUPABASE_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt98AtQY6h9CFO9KS6_2iJZmlP4Dv5C0-4e2xw"}
SIMULATION_MODE=${SIMULATION_MODE:-"false"}
LOG_LEVEL=${LOG_LEVEL:-"info"}
SOURCE_PATH=${SOURCE_PATH:-"./src"}
TARGET_PATH=${TARGET_PATH:-"./apps/frontend/app/routes"}
WORKFLOW_ID=${WORKFLOW_ID:-""}

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # Pas de couleur

# Fonction pour afficher les logs
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
  
  case $level in
    "info")
      echo -e "${BLUE}[INFO]${NC} ${timestamp} - ${message}"
      ;;
    "success")
      echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - ${message}"
      ;;
    "warning")
      echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - ${message}"
      ;;
    "error")
      echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}"
      ;;
    "debug")
      if [[ "$LOG_LEVEL" == "debug" ]]; then
        echo -e "${MAGENTA}[DEBUG]${NC} ${timestamp} - ${message}"
      fi
      ;;
    *)
      echo -e "${timestamp} - ${message}"
      ;;
  esac
}

# Fonction pour vérifier que les services sont disponibles
check_services() {
  log "info" "Vérification des services requis..."
  
  # Vérifier MCP Server
  if curl -s -o /dev/null -w "%{http_code}" "${MCP_SERVER_URL}/health" | grep -q "200"; then
    log "success" "MCP Server est opérationnel"
  else
    log "error" "MCP Server n'est pas accessible. Veuillez vérifier que le service est en cours d'exécution."
    log "info" "Vous pouvez démarrer les services avec: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
  fi
  
  # Vérifier n8n
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:5678/healthz" | grep -q "200"; then
    log "success" "n8n est opérationnel"
  else
    log "warning" "n8n n'est pas accessible. Certaines fonctionnalités d'orchestration pourraient ne pas fonctionner."
  fi
  
  # Vérifier Supabase (si nécessaire)
  log "info" "Supabase sera utilisé pour le stockage des métadonnées et des logs"
}

# Fonction pour analyser un fichier PHP
analyze_php_file() {
  local file_path=$1
  local output_file="${file_path}.analysis.json"
  
  log "info" "Analyse du fichier PHP: ${file_path}"
  
  # Appeler le serveur MCP pour analyser le fichier
  response=$(curl -s -X POST "${MCP_SERVER_URL}/analyze" \
    -H "Content-Type: application/json" \
    -d "{\"filePath\": \"${file_path}\", \"outputFormat\": \"json\"}")
  
  # Vérifier si la réponse est valide
  if echo "$response" | jq -e '.status' > /dev/null 2>&1; then
    status=$(echo "$response" | jq -r '.status')
    
    if [[ "$status" == "success" ]]; then
      log "success" "Analyse réussie pour ${file_path}"
      
      # Sauvegarder l'analyse dans un fichier
      echo "$response" > "$output_file"
      log "info" "Résultats d'analyse sauvegardés dans ${output_file}"
      
      # Retourner l'ID d'analyse pour utilisation ultérieure
      analysis_id=$(echo "$response" | jq -r '.data.analysisId')
      echo "$analysis_id"
    else
      error_message=$(echo "$response" | jq -r '.message')
      log "error" "Échec de l'analyse: ${error_message}"
      return 1
    fi
  else
    log "error" "La réponse du serveur MCP n'est pas au format attendu"
    log "debug" "Réponse reçue: ${response}"
    return 1
  fi
}

# Fonction pour générer du code Remix à partir d'une analyse
generate_remix_component() {
  local analysis_id=$1
  local target_dir=$2
  local options=$3
  
  log "info" "Génération du composant Remix à partir de l'analyse ${analysis_id}"
  
  # Construire les options de génération
  if [[ -z "$options" ]]; then
    options='{
      "createRouteFiles": true,
      "includeMeta": true,
      "includeLoader": true,
      "includeCanonical": true,
      "preserveSeo": true,
      "dryRun": '$SIMULATION_MODE'
    }'
  fi
  
  # Appeler le serveur MCP pour générer le code
  response=$(curl -s -X POST "${MCP_SERVER_URL}/generate" \
    -H "Content-Type: application/json" \
    -d "{
      \"analysisId\": \"${analysis_id}\",
      \"generator\": \"remix\",
      \"targetDirectory\": \"${target_dir}\",
      \"options\": ${options}
    }")
  
  # Vérifier si la réponse est valide
  if echo "$response" | jq -e '.status' > /dev/null 2>&1; then
    status=$(echo "$response" | jq -r '.status')
    
    if [[ "$status" == "success" ]]; then
      log "success" "Génération Remix réussie"
      
      # Afficher les fichiers générés
      files=$(echo "$response" | jq -r '.data.files[].path')
      log "info" "Fichiers générés:"
      echo "$files" | while read -r file; do
        log "info" "  - ${file}"
      done
      
      # Générer un rapport détaillé
      generation_id=$(echo "$response" | jq -r '.data.generationId')
      echo "$response" > "migration-results-$(date +%Y-%m-%dT%H-%M-%S-%3NZ).json"
      
      return 0
    else
      error_message=$(echo "$response" | jq -r '.message')
      log "error" "Échec de la génération: ${error_message}"
      return 1
    fi
  else
    log "error" "La réponse du serveur MCP n'est pas au format attendu"
    log "debug" "Réponse reçue: ${response}"
    return 1
  fi
}

# Fonction pour déclencher un workflow n8n
trigger_n8n_workflow() {
  local workflow_id=$1
  local payload=$2
  
  log "info" "Déclenchement du workflow n8n: ${workflow_id}"
  
  # Appeler le webhook n8n
  response=$(curl -s -X POST "${N8N_WEBHOOK_URL}${workflow_id}" \
    -H "Content-Type: application/json" \
    -d "${payload}")
  
  log "debug" "Réponse n8n: ${response}"
  log "success" "Workflow n8n déclenché avec succès"
}

# Fonction pour traiter un répertoire entier
process_directory() {
  local source_dir=$1
  local target_dir=$2
  local file_pattern=${3:-"*.php"}
  
  log "info" "Traitement du répertoire: ${source_dir}"
  log "info" "Fichiers cibles: ${file_pattern}"
  
  # Trouver tous les fichiers PHP dans le répertoire source
  find "$source_dir" -name "$file_pattern" -type f | while read -r file; do
    log "info" "Traitement du fichier: ${file}"
    
    # Analyser le fichier PHP
    analysis_id=$(analyze_php_file "$file")
    
    if [[ -n "$analysis_id" ]]; then
      # Générer le composant Remix
      generate_remix_component "$analysis_id" "$target_dir" ""
      
      # Ajouter un délai pour éviter de surcharger le serveur
      sleep 1
    fi
  done
  
  log "success" "Traitement du répertoire terminé"
}

# Fonction pour synchroniser les métadonnées avec Supabase
sync_with_supabase() {
  local metadata_file=$1
  
  log "info" "Synchronisation des métadonnées avec Supabase"
  
  # Envoyer les métadonnées à Supabase
  response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/migration_metadata" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "@${metadata_file}")
  
  log "success" "Métadonnées synchronisées avec Supabase"
}

# Fonction pour afficher l'aide
show_help() {
  echo -e "${CYAN}Usage:${NC} $0 [options] [command]"
  echo ""
  echo -e "${CYAN}Options:${NC}"
  echo "  --source-path PATH     Chemin vers les fichiers source PHP (par défaut: $SOURCE_PATH)"
  echo "  --target-path PATH     Chemin cible pour les fichiers générés (par défaut: $TARGET_PATH)"
  echo "  --mcp-url URL          URL du serveur MCP (par défaut: $MCP_SERVER_URL)"
  echo "  --n8n-url URL          URL du webhook n8n (par défaut: $N8N_WEBHOOK_URL)"
  echo "  --workflow-id ID       ID du workflow n8n à déclencher"
  echo "  --simulation           Exécuter en mode simulation (ne pas écrire les fichiers)"
  echo "  --debug                Activer les logs de débogage"
  echo "  --help                 Afficher cette aide"
  echo ""
  echo -e "${CYAN}Commandes:${NC}"
  echo "  analyze FILE           Analyser un fichier PHP spécifique"
  echo "  generate ID DIR        Générer un composant Remix à partir d'une analyse"
  echo "  process DIR            Traiter un répertoire entier"
  echo "  trigger-n8n ID PAYLOAD Déclencher un workflow n8n"
  echo "  run-pipeline           Exécuter le pipeline complet"
  echo ""
  echo -e "${CYAN}Exemples:${NC}"
  echo "  $0 analyze src/fiche.php"
  echo "  $0 process src/pages"
  echo "  $0 --simulation run-pipeline"
  echo "  $0 --workflow-id abc123 trigger-n8n '{\"file\":\"src/fiche.php\"}'"
}

# Fonction principale
main() {
  # Traiter les options
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --source-path)
        SOURCE_PATH="$2"
        shift 2
        ;;
      --target-path)
        TARGET_PATH="$2"
        shift 2
        ;;
      --mcp-url)
        MCP_SERVER_URL="$2"
        shift 2
        ;;
      --n8n-url)
        N8N_WEBHOOK_URL="$2"
        shift 2
        ;;
      --workflow-id)
        WORKFLOW_ID="$2"
        shift 2
        ;;
      --simulation)
        SIMULATION_MODE="true"
        shift
        ;;
      --debug)
        LOG_LEVEL="debug"
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      analyze)
        check_services
        analyze_php_file "$2"
        exit $?
        ;;
      generate)
        check_services
        generate_remix_component "$2" "$3" "$4"
        exit $?
        ;;
      process)
        check_services
        process_directory "$2" "$TARGET_PATH" "$3"
        exit $?
        ;;
      trigger-n8n)
        check_services
        trigger_n8n_workflow "${WORKFLOW_ID:-$2}" "$3"
        exit $?
        ;;
      run-pipeline)
        # Exécuter le pipeline complet
        check_services
        
        log "info" "Démarrage du pipeline complet"
        
        if [[ "$SIMULATION_MODE" == "true" ]]; then
          log "warning" "Mode simulation activé - aucun fichier ne sera écrit"
        fi
        
        # Si un workflow_id est fourni, utiliser n8n
        if [[ -n "$WORKFLOW_ID" ]]; then
          log "info" "Utilisation du workflow n8n: $WORKFLOW_ID"
          trigger_n8n_workflow "$WORKFLOW_ID" "{\"sourcePath\": \"$SOURCE_PATH\", \"targetPath\": \"$TARGET_PATH\", \"simulation\": $SIMULATION_MODE}"
        else
          # Sinon, exécuter localement
          process_directory "$SOURCE_PATH" "$TARGET_PATH"
        fi
        
        log "success" "Pipeline terminé"
        exit 0
        ;;
      *)
        if [[ -z "$1" ]]; then
          break
        fi
        
        log "error" "Option ou commande inconnue: $1"
        show_help
        exit 1
        ;;
    esac
  done
  
  # Si aucune commande n'est spécifiée, afficher l'aide
  show_help
}

# Exécuter la fonction principale
main "$@"