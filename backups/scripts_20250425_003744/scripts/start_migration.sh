#!/bin/bash
#
# Pipeline de migration automatique MySQL → PostgreSQL → Prisma → Supabase
# Ce script orchestre le processus complet de migration
#

set -e  # Arrêter l'exécution si une commande échoue

# Charger les variables d'environnement
if [ -f .env ]; then
  source .env
else
  echo "❌ Fichier .env manquant. Veuillez créer un fichier .env avec les variables nécessaires."
  exit 1
fi

# Configuration
WORKSPACE_DIR=$(pwd)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOGS_DIR="${WORKSPACE_DIR}/logs/migration-${TIMESTAMP}"
REPORTS_DIR="${WORKSPACE_DIR}/reports/migration-${TIMESTAMP}"
CONFIG_FILE="${WORKSPACE_DIR}/config/migration/migration-config.json"
MYSQL_DUMP_FILE="${REPORTS_DIR}/dump.mysql.sql"
PG_DUMP_FILE="${REPORTS_DIR}/dump.pg.sql"
SCHEMA_PRISMA_FILE="${REPORTS_DIR}/schema.prisma"
SUPABASE_SCHEMA_FILE="${REPORTS_DIR}/supabase.sql"
AUDIT_REPORT="${REPORTS_DIR}/migration_audit.json"
SUMMARY_FILE="${REPORTS_DIR}/migration_summary.md"

# Création des répertoires de logs et rapports
mkdir -p "${LOGS_DIR}"
mkdir -p "${REPORTS_DIR}"

# Fonction pour enregistrer les logs
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" | tee -a "${LOGS_DIR}/migration.log"
}

# Fonction pour exécuter une commande avec logging
run_command() {
  local command=$1
  local description=$2
  local log_file="${LOGS_DIR}/${3:-command.log}"
  
  log "INFO" "⏳ $description"
  echo "$ $command" > "$log_file"
  
  if eval "$command" >> "$log_file" 2>&1; then
    log "SUCCESS" "✅ $description - Réussi"
    return 0
  else
    log "ERROR" "❌ $description - Échec (voir $log_file)"
    exit 1
  fi
}

# Vérification des prérequis
check_prerequisites() {
  log "INFO" "🔍 Vérification des prérequis..."
  
  # Vérifier si les commandes nécessaires sont installées
  for cmd in mysqldump node npm npx ts-node prisma supabase jq; do
    if ! command -v $cmd &> /dev/null; then
      log "ERROR" "❌ $cmd n'est pas installé. Veuillez l'installer."
      exit 1
    fi
  done
  
  # Vérifier la présence des fichiers de configuration
  if [ ! -f "$CONFIG_FILE" ]; then
    log "ERROR" "❌ Fichier de configuration manquant: $CONFIG_FILE"
    exit 1
  fi
  
  log "SUCCESS" "✅ Tous les prérequis sont satisfaits."
}

# Phase 1: Extraction MySQL
extract_mysql() {
  log "INFO" "🔄 Phase 1: Extraction MySQL"
  
  # Récupérer les variables de configuration
  MYSQL_HOST=$(jq -r '.mysql.host' "$CONFIG_FILE")
  MYSQL_PORT=$(jq -r '.mysql.port' "$CONFIG_FILE")
  MYSQL_USER=$(jq -r '.mysql.user' "$CONFIG_FILE")
  MYSQL_PASSWORD=$(jq -r '.mysql.password' "$CONFIG_FILE")
  MYSQL_DATABASE=$(jq -r '.mysql.database' "$CONFIG_FILE")
  
  # Dump de la base MySQL
  run_command "mysqldump -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} \
    --routines --triggers --no-tablespaces \
    --column-statistics=0 --set-gtid-purged=OFF \
    ${MYSQL_DATABASE} > ${MYSQL_DUMP_FILE}" \
    "Extraction du schéma et des données MySQL" "mysql_dump.log"
  
  # Analyse du schéma MySQL avec l'agent mysql-analyzer
  run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/mysql-analyzer.ts \
    --input=${MYSQL_DUMP_FILE} \
    --output=${REPORTS_DIR}/mysql_analysis.json" \
    "Analyse du schéma MySQL" "mysql_analyzer.log"
  
  log "SUCCESS" "✅ Phase 1 terminée: Extraction MySQL"
}

# Phase 2: Mapping MySQL → PostgreSQL
map_to_postgresql() {
  log "INFO" "🔄 Phase 2: Mapping MySQL → PostgreSQL"
  
  # Option 1: Utiliser pgloader (si disponible)
  if command -v pgloader &> /dev/null; then
    # Générer un fichier de configuration pgloader
    cat > "${REPORTS_DIR}/pgloader.conf" <<EOL
LOAD DATABASE
     FROM mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}
     INTO postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}
 WITH include no drop,
      create tables,
      create indexes,
      preserve index names,
      reset sequences,
      foreign keys,
      disable triggers,
      truncate
 CAST
      type int with extra auto_increment to serial,
      type tinyint when (= 1) to boolean using tinyint-to-boolean,
      type varchar to text,
      type datetime to timestamp
EOL

    run_command "pgloader ${REPORTS_DIR}/pgloader.conf" \
      "Conversion de MySQL à PostgreSQL avec pgloader" "pgloader.log"
  
  # Option 2: Utiliser notre propre agent de mapping
  else
    log "INFO" "pgloader non trouvé, utilisation de notre agent mysql-to-postgresql"
    
    # Récupérer les variables de configuration PostgreSQL
    PG_HOST=$(jq -r '.postgresql.host' "$CONFIG_FILE")
    PG_PORT=$(jq -r '.postgresql.port' "$CONFIG_FILE")
    PG_USER=$(jq -r '.postgresql.user' "$CONFIG_FILE")
    PG_PASSWORD=$(jq -r '.postgresql.password' "$CONFIG_FILE")
    PG_DATABASE=$(jq -r '.postgresql.database' "$CONFIG_FILE")
    
    run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/mysql-to-postgresql.ts \
      --input=${MYSQL_DUMP_FILE} \
      --output=${PG_DUMP_FILE} \
      --map=${REPORTS_DIR}/type_mapping.json" \
      "Conversion de MySQL à PostgreSQL avec agent personnalisé" "mysql_to_pg.log"
      
    # Exécuter le script PostgreSQL généré
    run_command "PGPASSWORD=${PG_PASSWORD} psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -f ${PG_DUMP_FILE}" \
      "Import du schéma et des données dans PostgreSQL" "pg_import.log"
  fi
  
  # Génération d'un rapport de différences
  run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/schema-diff.ts \
    --mysql=${REPORTS_DIR}/mysql_analysis.json \
    --pg=${PG_DUMP_FILE} \
    --output=${REPORTS_DIR}/schema_diff.json" \
    "Génération du rapport de différences entre MySQL et PostgreSQL" "schema_diff.log"
  
  log "SUCCESS" "✅ Phase 2 terminée: Mapping MySQL → PostgreSQL"
}

# Phase 3: Génération Prisma
generate_prisma() {
  log "INFO" "🔄 Phase 3: Génération du schéma Prisma"
  
  # Initialisation de Prisma s'il n'est pas déjà présent
  if [ ! -f "${WORKSPACE_DIR}/prisma/schema.prisma" ]; then
    run_command "cd ${WORKSPACE_DIR} && npx prisma init" \
      "Initialisation de Prisma" "prisma_init.log"
  fi
  
  # Récupération du schéma depuis PostgreSQL
  DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
  
  run_command "cd ${WORKSPACE_DIR} && DATABASE_URL=\"${DATABASE_URL}\" npx prisma db pull --force" \
    "Récupération du schéma depuis PostgreSQL" "prisma_db_pull.log"
  
  # Copier le schema.prisma généré
  cp "${WORKSPACE_DIR}/prisma/schema.prisma" "${SCHEMA_PRISMA_FILE}"
  
  # Nettoyage et optimisation du schéma Prisma
  run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/prisma-optimizer.ts \
    --input=${SCHEMA_PRISMA_FILE} \
    --output=${SCHEMA_PRISMA_FILE}" \
    "Optimisation du schéma Prisma" "prisma_optimizer.log"
  
  # Validation du schéma Prisma
  run_command "cd ${WORKSPACE_DIR} && DATABASE_URL=\"${DATABASE_URL}\" npx prisma validate" \
    "Validation du schéma Prisma" "prisma_validate.log"
  
  log "SUCCESS" "✅ Phase 3 terminée: Génération du schéma Prisma"
}

# Phase 4: Déploiement Supabase
deploy_supabase() {
  log "INFO" "🔄 Phase 4: Déploiement Supabase"
  
  # Récupérer les variables de configuration Supabase
  SUPABASE_PROJECT_ID=$(jq -r '.supabase.project_id' "$CONFIG_FILE")
  SUPABASE_DB_PASSWORD=$(jq -r '.supabase.db_password' "$CONFIG_FILE")
  
  # Connexion à Supabase
  run_command "supabase login" \
    "Connexion à Supabase" "supabase_login.log"
    
  # Linkage au projet Supabase
  run_command "supabase link --project-ref ${SUPABASE_PROJECT_ID}" \
    "Liaison au projet Supabase" "supabase_link.log"
  
  # Générer un script de migration pour Supabase
  DATABASE_URL_SOURCE="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
  DATABASE_URL_TARGET="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
  
  run_command "cd ${WORKSPACE_DIR} && npx prisma migrate diff \
    --from-url=\"${DATABASE_URL_SOURCE}\" \
    --to-url=\"${DATABASE_URL_TARGET}\" \
    --script > ${SUPABASE_SCHEMA_FILE}" \
    "Génération du script de migration Supabase" "supabase_migrate_diff.log"
  
  # Exécuter le script de migration dans Supabase
  run_command "supabase db execute --file ${SUPABASE_SCHEMA_FILE}" \
    "Exécution du script de migration dans Supabase" "supabase_deploy.log"
    
  # Vérifier les tables dans Supabase
  run_command "supabase db tables" \
    "Vérification des tables dans Supabase" "supabase_tables.log"
  
  log "SUCCESS" "✅ Phase 4 terminée: Déploiement Supabase"
}

# Phase 5: Intégration MCP
integrate_mcp() {
  log "INFO" "🔄 Phase 5: Intégration MCP"
  
  # Récupérer les variables de configuration n8n
  N8N_WEBHOOK_URL=$(jq -r '.n8n.webhook_url' "$CONFIG_FILE")
  
  # Génération des mappings pour les agents MCP
  run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/generate-mappings.ts \
    --mysql=${REPORTS_DIR}/mysql_analysis.json \
    --pg=${REPORTS_DIR}/schema_diff.json \
    --prisma=${SCHEMA_PRISMA_FILE} \
    --output=${REPORTS_DIR}/mcp_mappings.json" \
    "Génération des mappings pour les agents MCP" "mcp_mappings.log"
  
  # Notification du webhook n8n pour lancer les workflows
  run_command "curl -s -X POST ${N8N_WEBHOOK_URL} \
    -H 'Content-Type: application/json' \
    -d '{\"event\": \"migration_completed\", \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\", \"mappingFile\": \"${REPORTS_DIR}/mcp_mappings.json\"}'" \
    "Notification du webhook n8n" "n8n_webhook.log"
  
  log "SUCCESS" "✅ Phase 5 terminée: Intégration MCP"
}

# Phase 6: Validation
validate_migration() {
  log "INFO" "🔄 Phase 6: Validation de la migration"
  
  # Exécuter des tests de validation
  run_command "cd ${WORKSPACE_DIR} && ts-node packages/mcp-agents/migration-validator.ts \
    --mappings=${REPORTS_DIR}/mcp_mappings.json \
    --mysql=${REPORTS_DIR}/mysql_analysis.json \
    --pg=${REPORTS_DIR}/schema_diff.json \
    --prisma=${SCHEMA_PRISMA_FILE} \
    --output=${AUDIT_REPORT}" \
    "Validation de la migration" "migration_validator.log"
  
  # Générer un rapport de synthèse
  run_command "cd ${WORKSPACE_DIR} && ts-node scripts/generate-summary.ts \
    --audit=${AUDIT_REPORT} \
    --output=${SUMMARY_FILE}" \
    "Génération du rapport de synthèse" "summary_generator.log"
  
  # Afficher le résumé de la migration
  log "INFO" "📋 Résumé de la migration :"
  cat "${SUMMARY_FILE}"
  
  log "SUCCESS" "✅ Phase 6 terminée: Validation de la migration"
}

# Fonction principale
main() {
  log "INFO" "🚀 Démarrage du pipeline de migration MySQL → PostgreSQL → Prisma → Supabase"
  
  # Vérifier les prérequis
  check_prerequisites
  
  # Exécuter les phases du pipeline
  extract_mysql
  map_to_postgresql
  generate_prisma
  deploy_supabase
  integrate_mcp
  validate_migration
  
  log "SUCCESS" "🎉 Pipeline de migration terminé avec succès! Rapports disponibles dans ${REPORTS_DIR}"
  echo "Résumé de la migration : ${SUMMARY_FILE}"
}

# Exécuter la fonction principale
main