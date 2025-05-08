#!/bin/bash
#
# Script de validation post-migration Navicat
# À utiliser après avoir migré les données avec Navicat de MySQL vers Supabase
#

set -e  # Arrêter en cas d'erreur

# Charger les variables d'environnement
if [ -f .env ]; then
  source .env
else
  echo "⚠️  Pas de fichier .env trouvé, utilisation des valeurs par défaut"
fi

# Configuration
WORKSPACE_DIR=$(pwd)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOGS_DIR="${WORKSPACE_DIR}/logs/navicat-validation-${TIMESTAMP}"
REPORTS_DIR="${WORKSPACE_DIR}/reports/navicat-validation-${TIMESTAMP}"
CONFIG_FILE="${WORKSPACE_DIR}/config/migration/migration-config.json"
SUMMARY_FILE="${REPORTS_DIR}/validation_summary.md"

# Options de ligne de commande
VERBOSE=false
SOURCE="mysql"
TARGET="supabase"

# Fonction d'aide
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --source=SOURCE    Base de données source (mysql par défaut)"
  echo "  --target=TARGET    Base de données cible (supabase par défaut)"
  echo "  --config=FILE      Fichier de configuration (migration-config.json par défaut)"
  echo "  --verbose          Afficher plus d'informations"
  echo "  --help             Afficher cette aide"
}

# Traitement des options
for i in "$@"; do
  case $i in
    --source=*)
      SOURCE="${i#*=}"
      shift
      ;;
    --target=*)
      TARGET="${i#*=}"
      shift
      ;;
    --config=*)
      CONFIG_FILE="${i#*=}"
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

# Fonction pour les logs
log() {
  local level="$1"
  local message="$2"
  local log_file="${LOGS_DIR}/validation.log"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  echo "[$timestamp] [$level] $message" | tee -a "$log_file"
}

log "INFO" "🔍 Début de la validation post-migration Navicat"
log "INFO" "Source: $SOURCE, Cible: $TARGET"

# Vérifier si le fichier de configuration existe
if [ ! -f "$CONFIG_FILE" ]; then
  log "ERROR" "Fichier de configuration non trouvé: $CONFIG_FILE"
  exit 1
fi

# Charger les configurations depuis le fichier JSON
load_config() {
  if command -v jq &> /dev/null; then
    echo $(jq -r "$1" "$CONFIG_FILE" 2>/dev/null || echo "$2")
  else
    log "WARNING" "jq non installé, utilisation des valeurs par défaut"
    echo "$2"
  fi
}

# Configurations pour les bases de données
if [ "$SOURCE" = "mysql" ]; then
  MYSQL_HOST=$(load_config '.mysql.host' "localhost")
  MYSQL_PORT=$(load_config '.mysql.port' "3306")
  MYSQL_USER=$(load_config '.mysql.user' "root")
  MYSQL_PASSWORD=$(load_config '.mysql.password' "")
  MYSQL_DATABASE=$(load_config '.mysql.database' "")
fi

if [ "$TARGET" = "supabase" ]; then
  PG_HOST=$(load_config '.supabase.host' "db.project.supabase.co")
  PG_PORT=$(load_config '.supabase.port' "5432")
  PG_USER=$(load_config '.supabase.user' "postgres")
  PG_PASSWORD=$(load_config '.supabase.password' "")
  PG_DATABASE=$(load_config '.supabase.database' "postgres")
elif [ "$TARGET" = "postgresql" ]; then
  PG_HOST=$(load_config '.postgresql.host' "localhost")
  PG_PORT=$(load_config '.postgresql.port' "5432")
  PG_USER=$(load_config '.postgresql.user' "postgres")
  PG_PASSWORD=$(load_config '.postgresql.password' "")
  PG_DATABASE=$(load_config '.postgresql.database' "postgres")
fi

# Validation de base - Vérifications simples
validate_basic() {
  log "INFO" "Exécution des validations de base..."
  
  # Générer la liste des tables MySQL
  if [ "$SOURCE" = "mysql" ]; then
    log "INFO" "Extraction de la liste des tables MySQL..."
    mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
      -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = '$MYSQL_DATABASE';" \
      > "${REPORTS_DIR}/mysql_tables.txt"
    
    if [ $? -ne 0 ]; then
      log "ERROR" "Échec de la connexion à MySQL"
      exit 1
    fi
  fi
  
  # Générer la liste des tables PostgreSQL (Supabase)
  log "INFO" "Extraction de la liste des tables PostgreSQL..."
  PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
    -c "SELECT tablename, n_live_tup FROM pg_catalog.pg_stat_user_tables ORDER BY tablename;" \
    > "${REPORTS_DIR}/postgresql_tables.txt"
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Échec de la connexion à PostgreSQL (Supabase)"
    exit 1
  fi
  
  # Comparer le nombre de tables
  local mysql_tables=$(grep -v "^table_name" "${REPORTS_DIR}/mysql_tables.txt" | wc -l)
  local pg_tables=$(grep -v "^tablename" "${REPORTS_DIR}/postgresql_tables.txt" | wc -l)
  
  log "INFO" "Tables MySQL: $mysql_tables, Tables PostgreSQL: $pg_tables"
  
  if [ $mysql_tables -ne $pg_tables ]; then
    log "WARNING" "⚠️  Le nombre de tables diffère entre MySQL ($mysql_tables) et PostgreSQL ($pg_tables)"
  else
    log "SUCCESS" "✅ Même nombre de tables dans MySQL et PostgreSQL"
  fi
  
  # Vérification des séquences PostgreSQL
  log "INFO" "Vérification des séquences PostgreSQL..."
  PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
    -c "SELECT sequencename, last_value FROM pg_sequences;" \
    > "${REPORTS_DIR}/postgresql_sequences.txt"
}

# Validation avancée - Utilise notre toolkit de migration existant
validate_advanced() {
  log "INFO" "Exécution des validations avancées..."
  
  # Utiliser notre agent de validation existant
  if [ -f "${WORKSPACE_DIR}/packages/mcp-agents/migration-validator.ts" ]; then
    log "INFO" "Exécution de l'agent de validation MCP..."
    
    local db_url_mysql="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
    local db_url_pg="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
    
    cd "${WORKSPACE_DIR}" && npx ts-node packages/mcp-agents/migration-validator.ts \
      --source="$db_url_mysql" \
      --target="$db_url_pg" \
      --output="${REPORTS_DIR}/validation_report.json" \
      --loglevel=$([ "$VERBOSE" = true ] && echo "debug" || echo "info")
      
    if [ $? -eq 0 ]; then
      log "SUCCESS" "✅ Validation MCP réussie"
    else
      log "WARNING" "⚠️  Problèmes détectés lors de la validation MCP"
    fi
  else
    log "WARNING" "Agent de validation MCP non trouvé, validation avancée ignorée"
  fi
}

# Vérification des données (échantillonnage)
validate_data_sampling() {
  log "INFO" "Échantillonnage des données pour validation..."
  
  # Créer un fichier pour les résultats
  echo "# Échantillonnage des données" > "${REPORTS_DIR}/data_sampling.md"
  
  # Liste des tables importantes à vérifier en priorité
  IMPORTANT_TABLES=$(load_config '.migration.importantTables | join(" ")' "users customers orders products")
  
  for table in $IMPORTANT_TABLES; do
    echo "## Table: $table" >> "${REPORTS_DIR}/data_sampling.md"
    
    # Compter les enregistrements dans MySQL
    if [ "$SOURCE" = "mysql" ]; then
      local mysql_count=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
        -s -e "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "N/A")
      
      echo "* MySQL: $mysql_count enregistrements" >> "${REPORTS_DIR}/data_sampling.md"
    fi
    
    # Compter les enregistrements dans PostgreSQL
    local pg_count=$(PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
      -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "N/A")
    
    echo "* PostgreSQL: $pg_count enregistrements" >> "${REPORTS_DIR}/data_sampling.md"
    
    # Comparer les comptages
    if [ "$mysql_count" != "N/A" ] && [ "$pg_count" != "N/A" ]; then
      if [ "$mysql_count" = "$pg_count" ]; then
        echo "* ✅ Nombre d'enregistrements identique" >> "${REPORTS_DIR}/data_sampling.md"
      else
        echo "* ⚠️ Différence dans le nombre d'enregistrements" >> "${REPORTS_DIR}/data_sampling.md"
      fi
    fi
    
    # Échantillonner quelques enregistrements (pour les tables pas trop grandes)
    if [ "$pg_count" != "N/A" ] && [ "$pg_count" -lt 1000 ]; then
      echo "### Échantillon (5 premiers enregistrements)" >> "${REPORTS_DIR}/data_sampling.md"
      PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
        -c "SELECT * FROM $table LIMIT 5;" >> "${REPORTS_DIR}/data_sampling.md" 2>/dev/null
    fi
    
    echo "" >> "${REPORTS_DIR}/data_sampling.md"
  done
}

# Vérification des séquences (pour les colonnes auto-increment)
validate_sequences() {
  log "INFO" "Vérification des séquences PostgreSQL..."
  
  echo "# État des séquences PostgreSQL" > "${REPORTS_DIR}/sequences.md"
  
  # Lister toutes les séquences
  PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
    -c "SELECT sequencename, last_value, start_value, increment_by FROM pg_sequences;" \
    >> "${REPORTS_DIR}/sequences.md"
    
  echo "" >> "${REPORTS_DIR}/sequences.md"
  echo "## Commandes pour réinitialiser les séquences" >> "${REPORTS_DIR}/sequences.md"
  echo "Pour chaque table avec une colonne à auto-incrément, exécuter :" >> "${REPORTS_DIR}/sequences.md"
  echo '```sql' >> "${REPORTS_DIR}/sequences.md"
  echo "SELECT setval('table_id_seq', (SELECT MAX(id) FROM table), true);" >> "${REPORTS_DIR}/sequences.md"
  echo '```' >> "${REPORTS_DIR}/sequences.md"
  
  log "INFO" "Rapport des séquences généré dans ${REPORTS_DIR}/sequences.md"
}

# Génération du rapport final
generate_summary() {
  log "INFO" "Génération du rapport de synthèse..."
  
  cat > "$SUMMARY_FILE" << EOL
# Rapport de validation post-migration Navicat

Date: $(date +"%Y-%m-%d %H:%M:%S")
Source: $SOURCE
Cible: $TARGET

## Résumé

EOL

  # Ajouter le résumé de base
  if [ -f "${REPORTS_DIR}/mysql_tables.txt" ] && [ -f "${REPORTS_DIR}/postgresql_tables.txt" ]; then
    local mysql_tables=$(grep -v "^table_name" "${REPORTS_DIR}/mysql_tables.txt" | wc -l)
    local pg_tables=$(grep -v "^tablename" "${REPORTS_DIR}/postgresql_tables.txt" | wc -l)
    
    echo "* Tables MySQL: $mysql_tables" >> "$SUMMARY_FILE"
    echo "* Tables PostgreSQL: $pg_tables" >> "$SUMMARY_FILE"
    
    if [ $mysql_tables -ne $pg_tables ]; then
      echo "* ⚠️ **ALERTE**: Le nombre de tables diffère" >> "$SUMMARY_FILE"
    else
      echo "* ✅ Nombre de tables identique" >> "$SUMMARY_FILE"
    fi
  fi
  
  # Ajouter des infos sur les données si disponibles
  if [ -f "${REPORTS_DIR}/data_sampling.md" ]; then
    echo "" >> "$SUMMARY_FILE"
    echo "## Échantillonnage des données" >> "$SUMMARY_FILE"
    echo "Voir le fichier détaillé: [data_sampling.md](./data_sampling.md)" >> "$SUMMARY_FILE"
  fi
  
  # Ajouter des infos sur les séquences si disponibles
  if [ -f "${REPORTS_DIR}/sequences.md" ]; then
    echo "" >> "$SUMMARY_FILE"
    echo "## Séquences PostgreSQL" >> "$SUMMARY_FILE"
    echo "Voir le fichier détaillé: [sequences.md](./sequences.md)" >> "$SUMMARY_FILE"
  fi
  
  # Ajouter le résultat de validation avancée si disponible
  if [ -f "${REPORTS_DIR}/validation_report.json" ]; then
    echo "" >> "$SUMMARY_FILE"
    echo "## Rapport de validation détaillé" >> "$SUMMARY_FILE"
    echo "Voir le fichier détaillé: [validation_report.json](./validation_report.json)" >> "$SUMMARY_FILE"
  fi
  
  # Ajouter les recommandations
  cat >> "$SUMMARY_FILE" << EOL

## Recommandations

1. **Vérifiez les séquences** - Après la migration, assurez-vous que les séquences PostgreSQL sont correctement initialisées.
2. **Vérifiez les contraintes d'intégrité** - Validez que les clés étrangères fonctionnent correctement.
3. **Testez l'application** - Exécutez une série de tests fonctionnels sur l'application.

## Prochaines étapes

1. Mettre à jour les configurations de l'application pour pointer vers Supabase
2. Configurer la sauvegarde automatique de la base de données Supabase
3. Surveiller les performances après la migration

EOL

  log "SUCCESS" "✅ Rapport de synthèse généré: $SUMMARY_FILE"
}

# Fonction principale
main() {
  log "INFO" "🚀 Démarrage de la validation post-migration Navicat"
  
  validate_basic
  validate_advanced
  validate_data_sampling
  validate_sequences
  generate_summary
  
  log "SUCCESS" "✅ Validation terminée, rapport disponible dans: $REPORTS_DIR"
  
  echo ""
  echo "📊 Résumé de la validation:"
  echo "- Rapport complet: $SUMMARY_FILE"
  echo "- Journaux: ${LOGS_DIR}/validation.log"
  echo ""
  echo "Pour intégrer cette validation avec n8n, exécutez:"
  echo "node run-pipeline.js --workflow=migration-validation --source=supabase"
}

# Exécuter la fonction principale
main