#!/bin/bash

# Configuration
MCP_SERVER_URL="http://localhost:3030"
SUPABASE_URL=${SUPABASE_URL:-"http://localhost:54322"}
SUPABASE_KEY=${SUPABASE_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}
WEBHOOK_URL=${WEBHOOK_URL:-"http://localhost:5678/webhook/mcp"}
SOURCE_DIR=${SOURCE_DIR:-"./simulations/php-examples"}
DESTINATION_DIR=${DESTINATION_DIR:-"./simulations/generated"}
AUDIT_DIR=${AUDIT_DIR:-"./audit"}

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Création des dossiers nécessaires s'ils n'existent pas
mkdir -p "$DESTINATION_DIR/remix"
mkdir -p "$DESTINATION_DIR/nestjs"
mkdir -p "$AUDIT_DIR"

# Fonction pour afficher un message d'aide
show_help() {
    echo "Usage: $0 [options] [file]"
    echo "Options:"
    echo "  -h, --help            Afficher ce message d'aide"
    echo "  -a, --all             Traiter tous les fichiers PHP du répertoire source"
    echo "  -r, --remix-only      Générer uniquement les composants Remix"
    echo "  -n, --nestjs-only     Générer uniquement les composants NestJS"
    echo "  -d, --dry-run         Simulation (pas de requêtes réelles)"
    echo "  -v, --verbose         Mode verbeux"
    echo "  -w, --webhook URL     Spécifier une URL de webhook"
    echo "  --supabase-url URL    Spécifier l'URL de Supabase"
    echo "  --supabase-key KEY    Spécifier la clé API de Supabase"
    echo "  --source-dir DIR      Spécifier le répertoire source (défaut: $SOURCE_DIR)"
    echo "  --dest-dir DIR        Spécifier le répertoire de destination (défaut: $DESTINATION_DIR)"
    echo
    echo "Exemple: $0 -r fiche.php"
    echo "         $0 --all --webhook http://n8n:5678/webhook/mcp"
}

# Traitement des arguments
POSITIONAL_ARGS=()
PROCESS_ALL=false
REMIX_ONLY=false
NESTJS_ONLY=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -a|--all)
      PROCESS_ALL=true
      shift
      ;;
    -r|--remix-only)
      REMIX_ONLY=true
      shift
      ;;
    -n|--nestjs-only)
      NESTJS_ONLY=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -w|--webhook)
      WEBHOOK_URL="$2"
      shift 2
      ;;
    --supabase-url)
      SUPABASE_URL="$2"
      shift 2
      ;;
    --supabase-key)
      SUPABASE_KEY="$2"
      shift 2
      ;;
    --source-dir)
      SOURCE_DIR="$2"
      shift 2
      ;;
    --dest-dir)
      DESTINATION_DIR="$2"
      shift 2
      ;;
    -*|--*)
      echo "Option inconnue $1"
      show_help
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}"

# Fonction pour enregistrer la tâche dans Supabase
log_to_supabase() {
    local file="$1"
    local status="$2"
    local message="$3"
    local agent_type="$4"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Enregistrement dans Supabase: $file, $status, $agent_type${NC}"
        return 0
    fi
    
    curl -s -X POST "$SUPABASE_URL/rest/v1/mcp_tasks" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"file_path\":\"$file\", \"status\":\"$status\", \"message\":\"$message\", \"agent_type\":\"$agent_type\", \"created_at\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
    > /dev/null
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[Supabase] Enregistrement: $file, $status, $agent_type${NC}"
    fi
}

# Fonction pour déclencher le webhook
trigger_webhook() {
    local file="$1"
    local status="$2"
    local message="$3"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Déclenchement du webhook: $file, $status${NC}"
        return 0
    fi
    
    curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"file\":\"$file\", \"status\":\"$status\", \"message\":\"$message\", \"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
    > /dev/null
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[Webhook] Déclenchement: $file, $status${NC}"
    fi
}

# Fonction pour générer les composants Remix
generate_remix() {
    local file="$1"
    local base_name=$(basename "$file" .php)
    local dest_dir="$DESTINATION_DIR/remix/$base_name"
    
    echo -e "${BLUE}[MCP] Génération des composants Remix pour $file...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Appel à l'API MCP pour générer les composants Remix${NC}"
        echo -e "${GREEN}[MCP] Composants Remix générés avec succès pour $file${NC}"
        return 0
    fi
    
    # Enregistrement du début de la tâche
    log_to_supabase "$file" "started" "Génération des composants Remix en cours" "remix-generator"
    
    # Appel à l'API MCP pour générer les composants Remix
    RESPONSE=$(curl -s -X POST "$MCP_SERVER_URL/generate/remix" \
    -H "Content-Type: application/json" \
    -d "{
        \"sourceFile\": \"$file\",
        \"destinationPath\": \"$dest_dir\",
        \"options\": {
            \"generateTests\": true,
            \"preserveSeo\": true
        }
    }")
    
    # Vérification du résultat
    if [[ "$RESPONSE" == *"\"success\":true"* ]]; then
        echo -e "${GREEN}[MCP] Composants Remix générés avec succès pour $file${NC}"
        log_to_supabase "$file" "completed" "Composants Remix générés avec succès" "remix-generator"
        trigger_webhook "$file" "remix_completed" "Composants Remix générés avec succès"
    else
        echo -e "${RED}[MCP] Erreur lors de la génération des composants Remix pour $file${NC}"
        log_to_supabase "$file" "failed" "Erreur lors de la génération des composants Remix" "remix-generator"
        trigger_webhook "$file" "remix_failed" "Erreur lors de la génération des composants Remix"
    fi
}

# Fonction pour générer les composants NestJS
generate_nestjs() {
    local file="$1"
    local base_name=$(basename "$file" .php)
    local dest_dir="$DESTINATION_DIR/nestjs/$base_name"
    
    echo -e "${BLUE}[MCP] Génération des composants NestJS pour $file...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Appel à l'API MCP pour générer les composants NestJS${NC}"
        echo -e "${GREEN}[MCP] Composants NestJS générés avec succès pour $file${NC}"
        return 0
    fi
    
    # Enregistrement du début de la tâche
    log_to_supabase "$file" "started" "Génération des composants NestJS en cours" "nestjs-generator"
    
    # Appel à l'API MCP pour générer les composants NestJS
    RESPONSE=$(curl -s -X POST "$MCP_SERVER_URL/generate/nestjs" \
    -H "Content-Type: application/json" \
    -d "{
        \"sourceFile\": \"$file\",
        \"destinationPath\": \"$dest_dir\",
        \"options\": {
            \"generatePrismaModels\": true
        }
    }")
    
    # Vérification du résultat
    if [[ "$RESPONSE" == *"\"success\":true"* ]]; then
        echo -e "${GREEN}[MCP] Composants NestJS générés avec succès pour $file${NC}"
        log_to_supabase "$file" "completed" "Composants NestJS générés avec succès" "nestjs-generator"
        trigger_webhook "$file" "nestjs_completed" "Composants NestJS générés avec succès"
    else
        echo -e "${RED}[MCP] Erreur lors de la génération des composants NestJS pour $file${NC}"
        log_to_supabase "$file" "failed" "Erreur lors de la génération des composants NestJS" "nestjs-generator"
        trigger_webhook "$file" "nestjs_failed" "Erreur lors de la génération des composants NestJS"
    fi
}

# Traitement d'un fichier spécifique
process_file() {
    local file="$1"
    
    # Vérification que le fichier existe
    if [ ! -f "$file" ]; then
        echo -e "${RED}[ERREUR] Le fichier $file n'existe pas${NC}"
        return 1
    fi
    
    # Vérification que c'est un fichier PHP
    if [[ ! "$file" == *.php ]]; then
        echo -e "${RED}[ERREUR] Le fichier $file n'est pas un fichier PHP${NC}"
        return 1
    fi
    
    echo -e "${BLUE}[MCP] Traitement du fichier $file...${NC}"
    
    # Génération des composants selon les options
    if [ "$REMIX_ONLY" = true ]; then
        generate_remix "$file"
    elif [ "$NESTJS_ONLY" = true ]; then
        generate_nestjs "$file"
    else
        generate_remix "$file"
        generate_nestjs "$file"
    fi
    
    return 0
}

# Fonction principale
main() {
    echo -e "${BLUE}=== Script de démarrage du pipeline MCP ===${NC}"
    echo -e "${BLUE}Configuration:${NC}"
    echo -e "${BLUE}- URL du serveur MCP: $MCP_SERVER_URL${NC}"
    echo -e "${BLUE}- URL Supabase: $SUPABASE_URL${NC}"
    echo -e "${BLUE}- URL Webhook: $WEBHOOK_URL${NC}"
    echo -e "${BLUE}- Répertoire source: $SOURCE_DIR${NC}"
    echo -e "${BLUE}- Répertoire destination: $DESTINATION_DIR${NC}"
    echo
    
    # Si on doit traiter tous les fichiers
    if [ "$PROCESS_ALL" = true ]; then
        echo -e "${BLUE}[MCP] Traitement de tous les fichiers PHP dans $SOURCE_DIR...${NC}"
        
        # Recherche de tous les fichiers PHP dans le répertoire source
        for file in "$SOURCE_DIR"/*.php; do
            if [ -f "$file" ]; then
                process_file "$file"
            fi
        done
    elif [ ${#POSITIONAL_ARGS[@]} -gt 0 ]; then
        # Traitement des fichiers spécifiés en arguments
        for file in "${POSITIONAL_ARGS[@]}"; do
            # Si le chemin n'est pas absolu, le préfixer avec le répertoire source
            if [[ ! "$file" == /* ]]; then
                file="$SOURCE_DIR/$file"
            fi
            process_file "$file"
        done
    else
        echo -e "${RED}[ERREUR] Aucun fichier spécifié${NC}"
        show_help
        exit 1
    fi
    
    echo -e "${GREEN}[MCP] Traitement terminé${NC}"
}

# Exécution de la fonction principale
main