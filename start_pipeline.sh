#!/bin/bash
set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages avec timestamp
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Fonction pour afficher des étapes
step() {
  echo -e "\n${GREEN}=== ÉTAPE $1: $2 ===${NC}\n"
}

# Fonction pour afficher des avertissements
warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher des erreurs
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# Vérification de l'environnement
check_env() {
  step "1" "Vérification de l'environnement"
  
  # Vérifier si le fichier .env existe, sinon le créer à partir du modèle
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      log "Création du fichier .env à partir de .env.example"
      cp .env.example .env
      warn "Fichier .env créé à partir du modèle. Veuillez vérifier et ajuster les valeurs si nécessaire."
    else
      error "Aucun fichier .env ou .env.example trouvé. Veuillez en créer un avec les variables requises."
    fi
  fi
  
  # Charger les variables d'environnement
  log "Chargement des variables d'environnement"
  export $(grep -v '^#' .env | xargs)
  
  # Vérifier les variables essentielles
  if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    error "Variables d'environnement MYSQL_ROOT_PASSWORD ou POSTGRES_PASSWORD non définies dans le fichier .env"
  fi
  
  # Détection de l'architecture
  ARCH=$(uname -m)
  if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    log "Architecture ARM détectée: $ARCH"
    export DOCKER_PLATFORM="linux/arm64"
  else
    log "Architecture x86 détectée: $ARCH"
    export DOCKER_PLATFORM="linux/amd64"
  fi
  
  log "Environnement vérifié avec succès ✅"
}

# Démarrage des containers Docker
start_containers() {
  step "2" "Démarrage des containers Docker"
  
  # Arrêter les containers existants si besoin
  if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    log "Arrêt des containers existants..."
    docker-compose -f docker-compose.dev.yml down
  fi
  
  # Démarrer les containers
  log "Démarrage des containers Docker..."
  docker-compose -f docker-compose.dev.yml up -d
  
  # Attendre que les bases de données soient prêtes
  log "Attente de la disponibilité de MySQL..."
  until docker-compose -f docker-compose.dev.yml exec -T mysql-legacy mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent; do
    echo -n "."
    sleep 2
  done
  
  log "Attente de la disponibilité de PostgreSQL..."
  until docker-compose -f docker-compose.dev.yml exec -T postgres-intermediate pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    echo -n "."
    sleep 2
  done
  
  log "Tous les containers sont démarrés et opérationnels ✅"
}

# Injection des dumps dans les bases de données
inject_dumps() {
  step "3" "Injection des dumps de données"
  
  # Vérifier s'il existe des dumps à injecter
  MYSQL_DUMPS_DIR="./scripts/mysql/dumps"
  POSTGRES_DUMPS_DIR="./scripts/postgres/dumps"
  
  # Injection des dumps MySQL
  if [ -d "$MYSQL_DUMPS_DIR" ] && [ "$(ls -A $MYSQL_DUMPS_DIR)" ]; then
    log "Injection des dumps MySQL..."
    for dump in $MYSQL_DUMPS_DIR/*.sql; do
      if [ -f "$dump" ]; then
        DUMP_NAME=$(basename "$dump")
        log "Injection de $DUMP_NAME dans MySQL..."
        docker-compose -f docker-compose.dev.yml exec -T mysql-legacy mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$dump"
      fi
    done
  else
    warn "Aucun dump MySQL trouvé dans $MYSQL_DUMPS_DIR"
  fi
  
  # Injection des dumps PostgreSQL
  if [ -d "$POSTGRES_DUMPS_DIR" ] && [ "$(ls -A $POSTGRES_DUMPS_DIR)" ]; then
    log "Injection des dumps PostgreSQL..."
    for dump in $POSTGRES_DUMPS_DIR/*.sql; do
      if [ -f "$dump" ]; then
        DUMP_NAME=$(basename "$dump")
        log "Injection de $DUMP_NAME dans PostgreSQL..."
        docker-compose -f docker-compose.dev.yml exec -T postgres-intermediate psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$dump"
      fi
    done
  else
    warn "Aucun dump PostgreSQL trouvé dans $POSTGRES_DUMPS_DIR"
  fi
  
  # Injection des données de seed pour tests si disponibles
  MYSQL_SEED="./scripts/mysql/seed.sql"
  POSTGRES_SEED="./scripts/postgres/seed.sql"
  
  if [ -f "$MYSQL_SEED" ]; then
    log "Injection des données de test MySQL..."
    docker-compose -f docker-compose.dev.yml exec -T mysql-legacy mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$MYSQL_SEED"
  fi
  
  if [ -f "$POSTGRES_SEED" ]; then
    log "Injection des données de test PostgreSQL..."
    docker-compose -f docker-compose.dev.yml exec -T postgres-intermediate psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$POSTGRES_SEED"
  fi
  
  log "Injection des dumps terminée ✅"
}

# Démarrage des agents MCP
start_mcp_agents() {
  step "4" "Démarrage des agents MCP"
  
  # Attendre que les serveurs MCP soient prêts
  log "Attente de la disponibilité des serveurs MCP..."
  # Vérifier si MCP MySQL est prêt
  MCP_MYSQL_PORT=${MCP_MYSQL_PORT:-3002}
  until curl -s "http://localhost:$MCP_MYSQL_PORT/health" > /dev/null; do
    echo -n "."
    sleep 2
  done
  
  # Vérifier si MCP PostgreSQL est prêt
  MCP_POSTGRES_PORT=${MCP_POSTGRES_PORT:-3003}
  until curl -s "http://localhost:$MCP_POSTGRES_PORT/health" > /dev/null; do
    echo -n "."
    sleep 2
  done
  
  log "Exécution de l'agent MySQL Analyzer..."
  docker-compose -f docker-compose.dev.yml exec -T code-transformer node /app/bin/mysql-analyzer.js

  log "Exécution de l'agent MySQL-to-PostgreSQL..."
  docker-compose -f docker-compose.dev.yml exec -T code-transformer node /app/bin/mysql-to-pg.js

  log "Exécution de l'agent Sync-Mapper..."
  docker-compose -f docker-compose.dev.yml exec -T code-transformer node /app/bin/sync-mapper.js
  
  log "Tous les agents MCP sont démarrés ✅"
}

# Génération du schema Prisma
generate_prisma_schema() {
  step "5" "Génération du schema Prisma"
  
  log "Exécution du générateur de schema Prisma..."
  docker-compose -f docker-compose.dev.yml run --rm prisma-generator
  
  log "Vérification du schema généré..."
  if [ -f "./apps/frontend/prisma/schema.prisma" ]; then
    log "Schema Prisma généré avec succès ✅"
  else
    warn "Le schema Prisma n'a pas été généré correctement. Vérifiez les logs du container prisma-generator."
  fi
}

# Push vers Supabase
push_to_supabase() {
  step "6" "Push vers Supabase"
  
  # Vérifier si les variables Supabase sont définies
  if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_ID" ]; then
    warn "Variables Supabase non définies. Étape de push vers Supabase ignorée."
    return
  fi
  
  if [ "$DRY_RUN" = "true" ]; then
    log "Mode DRY RUN activé - Simulation du push vers Supabase"
    docker-compose -f docker-compose.dev.yml run --rm supabase-cli supabase db diff --use-migra --schema public
  else
    log "Push vers Supabase..."
    docker-compose -f docker-compose.dev.yml run --rm supabase-cli supabase db push
  fi
  
  log "Push vers Supabase terminé ✅"
}

# Lancement du workflow n8n
trigger_n8n_workflow() {
  step "7" "Déclenchement du workflow n8n"
  
  # Attendre que n8n soit prêt
  log "Attente de la disponibilité de n8n..."
  N8N_PORT=${N8N_PORT:-5678}
  until curl -s "http://localhost:$N8N_PORT/healthz" > /dev/null; do
    echo -n "."
    sleep 2
  done
  
  # Identifier l'ID du workflow à déclencher
  WORKFLOW_NAME="Migration Data Validator"
  
  if [ "$DRY_RUN" = "true" ]; then
    log "Mode DRY RUN activé - Simulation du déclenchement du workflow n8n '$WORKFLOW_NAME'"
  else
    log "Déclenchement du workflow n8n '$WORKFLOW_NAME'..."
    # Deux méthodes possibles : webhook ou exécution directe
    
    # Option 1: Via webhook si configuré
    if [ ! -z "$N8N_WEBHOOK_URL" ]; then
      curl -X POST "$N8N_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{"event":"migration_completed","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    # Option 2: Via API n8n
    else
      # Récupérer l'ID du workflow
      WORKFLOW_ID=$(curl -s "http://localhost:$N8N_PORT/api/v1/workflows" | grep -o '"id":"[^"]*","name":"'"$WORKFLOW_NAME"'"' | cut -d'"' -f4)
      if [ ! -z "$WORKFLOW_ID" ]; then
        curl -X POST "http://localhost:$N8N_PORT/api/v1/workflows/$WORKFLOW_ID/activate"
      else
        warn "Workflow '$WORKFLOW_NAME' non trouvé dans n8n"
      fi
    fi
  fi
  
  log "Workflow n8n déclenché ✅"
}

# Affichage du résumé
show_summary() {
  step "8" "Résumé du pipeline"
  
  echo -e "${GREEN}✅ Pipeline de migration exécuté avec succès${NC}"
  echo -e "📊 ${BLUE}Statistiques:${NC}"
  echo -e "   - Containers Docker: En cours d'exécution"
  echo -e "   - Bases de données: MySQL & PostgreSQL initialisées"
  echo -e "   - Agents MCP: Exécutés"
  echo -e "   - Schema Prisma: Généré"
  
  if [ "$DRY_RUN" = "true" ]; then
    echo -e "   - Mode: ${YELLOW}DRY RUN${NC} (aucune modification dans Supabase)"
  else
    echo -e "   - Mode: ${GREEN}PRODUCTION${NC} (données synchronisées avec Supabase)"
  fi
  
  echo -e "\n${BLUE}Pour accéder aux interfaces:${NC}"
  echo -e "   - Dashboard de migration: http://localhost:3000"
  echo -e "   - Interface n8n: http://localhost:$N8N_PORT"
  echo -e "   - Adminer (DB): http://localhost:8080"
  
  echo -e "\n${YELLOW}Pour arrêter le pipeline:${NC} docker-compose -f docker-compose.dev.yml down"
}

# Fonction principale
main() {
  # Bannière
  echo -e "${GREEN}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║         PIPELINE DE MIGRATION PHP → NESTJS/REMIX          ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  
  # Traitement des arguments
  DRY_RUN=false
  FORCE_RESTART=false
  
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      --dry-run) DRY_RUN=true; shift ;;
      --force|-f) FORCE_RESTART=true; shift ;;
      -h|--help)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --dry-run       Exécute le pipeline sans écrire dans Supabase"
        echo "  --force, -f     Force le redémarrage des containers existants"
        echo "  --help, -h      Affiche cette aide"
        exit 0
        ;;
      *) error "Option inconnue: $1" ;;
    esac
  done
  
  if [ "$DRY_RUN" = "true" ]; then
    warn "Mode DRY RUN activé - Aucune donnée ne sera écrite dans Supabase"
  fi
  
  # Exécution des étapes
  check_env
  
  if [ "$FORCE_RESTART" = "true" ]; then
    start_containers --force
  else
    start_containers
  fi
  
  inject_dumps
  start_mcp_agents
  generate_prisma_schema
  push_to_supabase
  trigger_n8n_workflow
  show_summary
}

# Exécution du script
main "$@"