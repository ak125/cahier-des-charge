#!/bin/bash
#
# Script d'automatisation complète pour migrer MySQL → Supabase (PostgreSQL)
# Utilise Navicat + scripts complémentaires + agents IA (MCP + n8n)
#

set -e  # Arrête l'exécution en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_DIR=$(pwd)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
CONFIG_FILE="${WORKSPACE_DIR}/migration-config.json"
LOGS_DIR="${WORKSPACE_DIR}/logs/migration-${TIMESTAMP}"
REPORTS_DIR="${WORKSPACE_DIR}/reports/migration-${TIMESTAMP}"
EXPORTS_DIR="${WORKSPACE_DIR}/exports/${TIMESTAMP}"
SCHEMA_MAP_FILE="${REPORTS_DIR}/schema_map.json"
N8N_WORKFLOW_FILE="${WORKSPACE_DIR}/config/migration/migration_pipeline.n8n.json"
DATA_REPORT_FILE="${REPORTS_DIR}/migration_report.json"

# Options de ligne de commande
VERBOSE=false
SKIP_NAVICAT=false
SKIP_EXPORT=false
SKIP_UPLOAD=false
SKIP_VERIFICATION=false
EXPORT_FORMAT="csv"  # ou "sql"
TABLES=""
USE_N8N=true

# Fonction d'aide
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --config=FILE         Fichier de configuration (migration-config.json par défaut)"
  echo "  --skip-navicat        Ignorer l'étape d'export Navicat (utilise uniquement les scripts)"
  echo "  --skip-export         Ignorer l'étape d'export (utilise des fichiers existants)"
  echo "  --skip-upload         Ignorer l'étape d'upload vers Supabase"
  echo "  --skip-verification   Ignorer l'étape de vérification"
  echo "  --export-format=TYPE  Format d'export (csv ou sql, csv par défaut)"
  echo "  --tables=LIST         Liste de tables à migrer (toutes par défaut)"
  echo "  --disable-n8n         Ne pas utiliser n8n pour l'orchestration"
  echo "  --verbose             Afficher plus d'informations"
  echo "  --help                Afficher cette aide"
}

# Traitement des options
for i in "$@"; do
  case $i in
    --config=*)
      CONFIG_FILE="${i#*=}"
      shift
      ;;
    --skip-navicat)
      SKIP_NAVICAT=true
      shift
      ;;
    --skip-export)
      SKIP_EXPORT=true
      shift
      ;;
    --skip-upload)
      SKIP_UPLOAD=true
      shift
      ;;
    --skip-verification)
      SKIP_VERIFICATION=true
      shift
      ;;
    --export-format=*)
      EXPORT_FORMAT="${i#*=}"
      shift
      ;;
    --tables=*)
      TABLES="${i#*=}"
      shift
      ;;
    --disable-n8n)
      USE_N8N=false
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      # Option inconnue
      echo "Option inconnue: $i"
      print_usage
      exit 1
      ;;
  esac
done

# Création des répertoires
mkdir -p "${LOGS_DIR}"
mkdir -p "${REPORTS_DIR}"
mkdir -p "${EXPORTS_DIR}"

# Fonction pour les logs
log() {
  local level="$1"
  local message="$2"
  local log_file="${LOGS_DIR}/migration.log"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "[$timestamp] [${BLUE}INFO${NC}] $message" | tee -a "$log_file"
      ;;
    "SUCCESS")
      echo -e "[$timestamp] [${GREEN}SUCCESS${NC}] $message" | tee -a "$log_file"
      ;;
    "WARNING")
      echo -e "[$timestamp] [${YELLOW}WARNING${NC}] $message" | tee -a "$log_file"
      ;;
    "ERROR")
      echo -e "[$timestamp] [${RED}ERROR${NC}] $message" | tee -a "$log_file"
      ;;
    *)
      echo -e "[$timestamp] [$level] $message" | tee -a "$log_file"
      ;;
  esac
}

# Fonction pour exécuter des commandes et logger le résultat
run_command() {
  local command="$1"
  local description="$2"
  local log_file="${LOGS_DIR}/${3:-command.log}"
  
  log "INFO" "⏳ $description"
  
  if eval "$command" >> "$log_file" 2>&1; then
    log "SUCCESS" "✅ $description"
    return 0
  else
    log "ERROR" "❌ $description a échoué. Voir le fichier log: $log_file"
    if [ "$4" != "continue" ]; then
      exit 1
    fi
    return 1
  fi
}

# Vérification des prérequis
check_prerequisites() {
  log "INFO" "🔍 Vérification des prérequis..."
  
  # Vérifier si le fichier de configuration existe
  if [ ! -f "$CONFIG_FILE" ]; then
    log "ERROR" "Le fichier de configuration n'existe pas: $CONFIG_FILE"
    exit 1
  fi
  
  # Vérifier les outils requis
  if [ "$SKIP_NAVICAT" = false ]; then
    # Pour Navicat, on ne peut pas vraiment vérifier automatiquement, donc on demande confirmation
    echo -e "${YELLOW}⚠️  Ce script va tenter d'utiliser Navicat. Assurez-vous que Navicat est installé et configuré.${NC}"
    echo "Appuyez sur Entrée pour continuer, ou Ctrl+C pour annuler."
    read -r
  fi
  
  # Vérifier node, npm, ts-node, etc.
  for cmd in node npm npx ts-node jq; do
    if ! command -v $cmd &> /dev/null; then
      log "ERROR" "Commande requise non trouvée: $cmd"
      exit 1
    fi
  fi
  
  # Vérifier n8n si utilisé
  if [ "$USE_N8N" = true ]; then
    if ! command -v n8n &> /dev/null; then
      log "WARNING" "n8n n'est pas installé. Installation en cours..."
      run_command "npm install -g n8n" "Installation de n8n"
    fi
  fi
  
  log "SUCCESS" "✅ Tous les prérequis sont satisfaits"
}

# Charger les configurations depuis le fichier JSON
load_config() {
  if command -v jq &> /dev/null; then
    echo $(jq -r "$1" "$CONFIG_FILE" 2>/dev/null || echo "$2")
  else
    log "WARNING" "jq n'est pas installé, utilisation des valeurs par défaut"
    echo "$2"
  fi
}

# Phase 1: Extraction et mapping MySQL → PostgreSQL
extract_and_map() {
  log "INFO" "🔄 Phase 1: Extraction et mapping MySQL → PostgreSQL"
  
  # Récupérer les informations de connexion MySQL depuis le fichier de configuration
  MYSQL_HOST=$(load_config '.mysql.host' "localhost")
  MYSQL_PORT=$(load_config '.mysql.port' "3306")
  MYSQL_USER=$(load_config '.mysql.user' "root")
  MYSQL_PASSWORD=$(load_config '.mysql.password' "")
  MYSQL_DATABASE=$(load_config '.mysql.database' "")
  
  # Si les tables ne sont pas spécifiées, récupérer toutes les tables
  if [ -z "$TABLES" ]; then
    log "INFO" "Récupération de la liste des tables MySQL..."
    TABLES=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -e "SHOW TABLES FROM $MYSQL_DATABASE;" | tr '\n' ' ')
    if [ -z "$TABLES" ]; then
      log "ERROR" "Aucune table trouvée dans la base de données MySQL"
      exit 1
    fi
    log "INFO" "Tables détectées: $TABLES"
  fi
  
  # Générer le mapping des types MySQL → PostgreSQL avec l'agent MCP
  log "INFO" "Génération du mapping des types MySQL → PostgreSQL..."
  run_command "cd ${WORKSPACE_DIR} && npx ts-node agents/migration/mysql-to-pg.ts \
    --host=${MYSQL_HOST} \
    --port=${MYSQL_PORT} \
    --user=${MYSQL_USER} \
    --password=${MYSQL_PASSWORD} \
    --database=${MYSQL_DATABASE} \
    --output=${SCHEMA_MAP_FILE}" \
    "Génération du mapping des types" "mysql_to_pg.log"
  
  log "SUCCESS" "✅ Phase 1 terminée: Extraction et mapping"
}

# Phase 2: Export des données (Navicat ou script)
export_data() {
  log "INFO" "🔄 Phase 2: Export des données"
  
  if [ "$SKIP_EXPORT" = true ]; then
    log "WARNING" "Export ignoré (--skip-export)"
    return 0
  fi
  
  # Navicat (utilisation manuelle guidée)
  if [ "$SKIP_NAVICAT" = false ]; then
    echo -e "${YELLOW}⚠️  Étape manuelle requise: Export Navicat${NC}"
    echo "1. Ouvrez Navicat et connectez-vous à votre base de données MySQL"
    echo "2. Sélectionnez les tables: $TABLES"
    echo "3. Clic droit > Export Wizard > choisissez $EXPORT_FORMAT"
    echo "4. Enregistrez les fichiers dans: $EXPORTS_DIR"
    echo "5. Appuyez sur Entrée une fois l'export terminé"
    read -r
    
    # Vérifier que les fichiers ont bien été exportés
    for table in $TABLES; do
      if [ ! -f "$EXPORTS_DIR/$table.$EXPORT_FORMAT" ]; then
        log "WARNING" "Fichier attendu non trouvé: $EXPORTS_DIR/$table.$EXPORT_FORMAT"
      else
        log "SUCCESS" "✅ Fichier trouvé: $table.$EXPORT_FORMAT"
      fi
    done
  else
    # Export via script automatique
    log "INFO" "Export automatique via script..."
    
    if [ "$EXPORT_FORMAT" = "csv" ]; then
      run_command "cd ${WORKSPACE_DIR} && npx ts-node tools/export-csv.ts \
        --config=${CONFIG_FILE} \
        --output=${EXPORTS_DIR} \
        --tables=\"${TABLES}\"" \
        "Export CSV des tables" "export_csv.log"
    else
      # Export SQL
      for table in $TABLES; do
        run_command "mysqldump -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} \
          ${MYSQL_DATABASE} ${table} > ${EXPORTS_DIR}/${table}.sql" \
          "Export SQL de la table $table" "export_sql_${table}.log" "continue"
      done
    fi
  fi
  
  log "SUCCESS" "✅ Phase 2 terminée: Export des données"
}

# Phase 3: Upload et import dans Supabase
upload_to_supabase() {
  log "INFO" "🔄 Phase 3: Upload vers Supabase"
  
  if [ "$SKIP_UPLOAD" = true ]; then
    log "WARNING" "Upload ignoré (--skip-upload)"
    return 0
  fi
  
  # Récupérer les informations de connexion Supabase
  SUPABASE_URL=$(load_config '.supabase.url' "")
  SUPABASE_KEY=$(load_config '.supabase.key' "")
  SUPABASE_DB_HOST=$(load_config '.supabase.db_host' "")
  SUPABASE_DB_PORT=$(load_config '.supabase.db_port' "5432")
  SUPABASE_DB_USER=$(load_config '.supabase.db_user' "postgres")
  SUPABASE_DB_PASSWORD=$(load_config '.supabase.db_password' "")
  SUPABASE_DB_NAME=$(load_config '.supabase.db_name' "postgres")
  
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    log "ERROR" "Informations de connexion Supabase manquantes"
    exit 1
  fi
  
  # Choix de la méthode d'upload
  if [ "$USE_N8N" = true ] && [ -f "$N8N_WORKFLOW_FILE" ]; then
    # Méthode n8n
    log "INFO" "Upload via n8n workflow..."
    
    # Mettre à jour le workflow n8n avec les chemins des fichiers exportés
    TMP_WORKFLOW=$(mktemp)
    jq --arg dir "$EXPORTS_DIR" '.nodes[] | select(.type == "n8n-nodes-base.readBinaryFiles") | .parameters.path = $dir' "$N8N_WORKFLOW_FILE" > "$TMP_WORKFLOW"
    mv "$TMP_WORKFLOW" "${REPORTS_DIR}/updated_workflow.json"
    
    # Exécuter le workflow n8n
    run_command "n8n execute --workflow ${REPORTS_DIR}/updated_workflow.json" \
      "Exécution du workflow n8n pour l'upload" "n8n_execute.log"
  else
    # Méthode script TS
    log "INFO" "Upload via script Prisma/TS..."
    
    if [ "$EXPORT_FORMAT" = "csv" ]; then
      run_command "cd ${WORKSPACE_DIR} && npx ts-node tools/import-csv-to-supabase.ts \
        --config=${CONFIG_FILE} \
        --input=${EXPORTS_DIR} \
        --schema-map=${SCHEMA_MAP_FILE}" \
        "Import CSV vers Supabase" "import_csv_supabase.log"
    else
      # Import SQL
      # On utilise psql pour l'import SQL
      for table in $TABLES; do
        # On modifie d'abord le SQL pour adapter à PostgreSQL avec notre agent
        run_command "cd ${WORKSPACE_DIR} && npx ts-node tools/convert-mysql-sql-to-pg.ts \
          --input=${EXPORTS_DIR}/${table}.sql \
          --output=${EXPORTS_DIR}/${table}.pg.sql \
          --schema-map=${SCHEMA_MAP_FILE}" \
          "Conversion SQL MySQL → PostgreSQL pour $table" "convert_sql_${table}.log" "continue"
        
        # Puis on importe dans Supabase
        run_command "PGPASSWORD=${SUPABASE_DB_PASSWORD} psql -h ${SUPABASE_DB_HOST} -p ${SUPABASE_DB_PORT} -U ${SUPABASE_DB_USER} -d ${SUPABASE_DB_NAME} -f ${EXPORTS_DIR}/${table}.pg.sql" \
          "Import SQL dans Supabase pour $table" "import_sql_${table}.log" "continue"
      done
    fi
  fi
  
  log "SUCCESS" "✅ Phase 3 terminée: Upload vers Supabase"
}

# Phase 4: Vérification des données
verify_data() {
  log "INFO" "🔄 Phase 4: Vérification des données"
  
  if [ "$SKIP_VERIFICATION" = true ]; then
    log "WARNING" "Vérification ignorée (--skip-verification)"
    return 0
  fi
  
  # Exécuter l'agent de vérification
  run_command "cd ${WORKSPACE_DIR} && npx ts-node agents/migration/data-verifier.ts \
    --config=${CONFIG_FILE} \
    --tables=\"${TABLES}\" \
    --output=${DATA_REPORT_FILE}" \
    "Vérification des données" "data_verify.log"
  
  # Vérifier si des problèmes ont été détectés
  if jq -e '.problems | length > 0' "$DATA_REPORT_FILE" > /dev/null; then
    log "WARNING" "⚠️ Des problèmes ont été détectés durant la vérification. Voir: $DATA_REPORT_FILE"
  else
    log "SUCCESS" "✅ Aucun problème détecté durant la vérification"
  fi
  
  log "SUCCESS" "✅ Phase 4 terminée: Vérification des données"
}

# Phase 5: Orchestration finale et webhook
finalize() {
  log "INFO" "🔄 Phase 5: Finalisation et orchestration"
  
  # Générer un résumé de la migration
  log "INFO" "Génération du résumé de migration..."
  
  # Création du rapport final en JSON
  cat > "${REPORTS_DIR}/migration_summary.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "completed",
  "source": {
    "type": "mysql",
    "database": "$(load_config '.mysql.database' "")",
    "tables": [$(echo "$TABLES" | sed 's/ /","/g' | sed 's/^/"/' | sed 's/$/"/')],
    "records": {}
  },
  "target": {
    "type": "supabase",
    "url": "$(load_config '.supabase.url' "" | sed 's/\(https:\/\/\)\([^\.]*\)\..*/\1\2/')",
    "tables": [$(echo "$TABLES" | sed 's/ /","/g' | sed 's/^/"/' | sed 's/$/"/')],
    "records": {}
  },
  "exportFormat": "$EXPORT_FORMAT",
  "navicat": $([ "$SKIP_NAVICAT" = true ] && echo "false" || echo "true"),
  "n8n": $([ "$USE_N8N" = true ] && echo "true" || echo "false"),
  "reportsPath": "$REPORTS_DIR",
  "logsPath": "$LOGS_DIR"
}
EOL
  
  # Si l'intégration avec n8n est activée, déclencher le webhook
  if [ "$USE_N8N" = true ]; then
    # Récupérer l'URL du webhook depuis le config
    WEBHOOK_URL=$(load_config '.n8n.webhookUrl' "")
    
    if [ -n "$WEBHOOK_URL" ]; then
      log "INFO" "Déclenchement du webhook n8n..."
      run_command "curl -s -X POST $WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d @${REPORTS_DIR}/migration_summary.json" \
        "Déclenchement du webhook" "webhook.log" "continue"
    fi
  fi
  
  log "SUCCESS" "🎉 Migration terminée avec succès! Rapports disponibles dans: $REPORTS_DIR"
  
  # Générer un rapport Markdown plus lisible
  cat > "${REPORTS_DIR}/migration_summary.md" << EOL
# Rapport de migration MySQL → Supabase

**Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Résumé

- **Source MySQL:** $(load_config '.mysql.database' "")
- **Destination Supabase:** $(load_config '.supabase.url' "" | sed 's/\(https:\/\/\)\([^\.]*\)\..*/\1\2/')
- **Tables migrées:** $TABLES
- **Format d'export:** $EXPORT_FORMAT
- **Utilisation de Navicat:** $([ "$SKIP_NAVICAT" = true ] && echo "Non" || echo "Oui")
- **Orchestration n8n:** $([ "$USE_N8N" = true ] && echo "Oui" || echo "Non")

## Rapports détaillés

- Vérification des données: [migration_report.json](./migration_report.json)
- Mapping des schémas: [schema_map.json](./schema_map.json)
- Logs complets: $LOGS_DIR/migration.log

## Prochaines étapes

1. Vérifier l'intégrité des données dans Supabase
2. Mettre à jour les configurations de l'application pour pointer vers Supabase
3. Effectuer des tests de l'application avec la nouvelle base de données
EOL
  
  echo -e "\n📑 Résumé de la migration: ${REPORTS_DIR}/migration_summary.md"
}

# Fonction principale
main() {
  log "INFO" "🚀 Démarrage de la migration MySQL → Supabase (PostgreSQL)"
  
  check_prerequisites
  extract_and_map
  export_data
  upload_to_supabase
  verify_data
  finalize
}

# Exécuter la fonction principale
main