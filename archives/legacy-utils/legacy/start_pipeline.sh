#!/bin/bash
#
# Script d'automatisation pour la migration PHP → NestJS/Remix
# Ce script orchestre la migration complète de la base de données MySQL vers PostgreSQL/Supabase
# et la transformation du code PHP vers NestJS/Remix
#

set -e  # Arrêt en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banniére
echo -e "${CYAN}"
echo "╔═════════════════════════════════════════════════════════════╗"
echo "║ Pipeline de Migration Automatisée PHP → NestJS/Remix         ║"
echo "║ MySQL + PostgreSQL + Supabase + MCP + n8n                   ║"
echo "╚═════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
WORKSPACE_DIR=$(pwd)
CONFIG_FILE="${WORKSPACE_DIR}/migration-config.json"
ENV_FILE="${WORKSPACE_DIR}/.env"
LOGS_DIR="${WORKSPACE_DIR}/logs/migration-${TIMESTAMP}"
REPORTS_DIR="${WORKSPACE_DIR}/reports/migration-${TIMESTAMP}"
DB_DUMPS_DIR="${WORKSPACE_DIR}/backups/dumps"
SCHEMA_MAP_FILE="${REPORTS_DIR}/schema_map.json"
N8N_WORKFLOW_FILE="${WORKSPACE_DIR}/config/migration/migration_pipeline.n8n.json"
DATA_REPORT_FILE="${REPORTS_DIR}/migration_report.json"

# Options de ligne de commande
DRY_RUN=false
SKIP_DOCKER=false
SKIP_DUMP_IMPORT=false
SKIP_SCHEMA_ANALYSIS=false
SKIP_PRISMA_GENERATION=false
SKIP_SUPABASE_PUSH=false
SKIP_CODE_TRANSFORM=false
SKIP_N8N_WORKFLOW=false
TABLES=""
VERBOSE=false

# Fonction d'aide
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --config=FILE            Utiliser un fichier de configuration spécifique"
  echo "  --env=FILE               Utiliser un fichier .env spécifique"
  echo "  --dry-run                Simuler l'exécution sans effectuer de modifications sur Supabase"
  echo "  --skip-docker            Ne pas démarrer/reconstruire les conteneurs Docker"
  echo "  --skip-dump-import       Ne pas importer les dumps SQL"
  echo "  --skip-schema-analysis   Ne pas analyser le schéma MySQL"
  echo "  --skip-prisma-generation Ne pas générer les schémas Prisma"
  echo "  --skip-supabase-push     Ne pas pousser vers Supabase"
  echo "  --skip-code-transform    Ne pas transformer le code PHP"
  echo "  --skip-n8n-workflow      Ne pas exécuter le workflow n8n"
  echo "  --tables=LIST            Liste des tables à migrer (séparées par des espaces)"
  echo "  --verbose                Afficher plus de détails"
  echo "  --help                   Afficher cette aide"
}

# Traitement des options
for i in "$@"; do
  case $i in
    --config=*)
      CONFIG_FILE="${i#*=}"
      shift
      ;;
    --env=*)
      ENV_FILE="${i#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-docker)
      SKIP_DOCKER=true
      shift
      ;;
    --skip-dump-import)
      SKIP_DUMP_IMPORT=true
      shift
      ;;
    --skip-schema-analysis)
      SKIP_SCHEMA_ANALYSIS=true
      shift
      ;;
    --skip-prisma-generation)
      SKIP_PRISMA_GENERATION=true
      shift
      ;;
    --skip-supabase-push)
      SKIP_SUPABASE_PUSH=true
      shift
      ;;
    --skip-code-transform)
      SKIP_CODE_TRANSFORM=true
      shift
      ;;
    --skip-n8n-workflow)
      SKIP_N8N_WORKFLOW=true
      shift
      ;;
    --tables=*)
      TABLES="${i#*=}"
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
mkdir -p "${DB_DUMPS_DIR}"

# Fonction pour les logs
log() {
  local level="$1"
  local message="$2"
  local log_file="${LOGS_DIR}/pipeline.log"
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

# Fonction pour exécuter des commandes
run_command() {
  local command="$1"
  local description="$2"
  local log_file="${LOGS_DIR}/${3:-command.log}"
  
  log "INFO" "⏳ $description"
  
  if [ "$VERBOSE" = true ]; then
    echo -e "${YELLOW}Commande: $command${NC}"
  fi
  
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

# Vérification initiale
check_prerequisites() {
  log "INFO" "🔍 Vérification des prérequis..."

  # Vérifier si Docker est installé
  if ! command -v docker &> /dev/null; then
    log "ERROR" "Docker n'est pas installé"
    exit 1
  fi

  # Vérifier si Docker Compose est installé
  if ! command -v docker-compose &> /dev/null; then
    log "ERROR" "Docker Compose n'est pas installé"
    exit 1
  fi

  # Vérifier si jq est installé (pour traiter les fichiers JSON)
  if ! command -v jq &> /dev/null; then
    log "WARNING" "jq n'est pas installé. Certaines fonctionnalités peuvent ne pas fonctionner correctement."
  fi

  # Vérifier le fichier de configuration
  if [ ! -f "$CONFIG_FILE" ]; then
    log "ERROR" "Le fichier de configuration n'existe pas: $CONFIG_FILE"
    exit 1
  fi

  # Vérifier le fichier .env
  if [ ! -f "$ENV_FILE" ]; then
    log "WARNING" "Le fichier .env n'existe pas: $ENV_FILE. Création d'un fichier .env par défaut..."
    cat > "$ENV_FILE" << EOL
# Fichier .env généré automatiquement
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=legacy_app
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=app_migration
POSTGRES_PORT=5433
MYSQL_PORT=3307
MCP_MYSQL_PORT=3002
MCP_POSTGRES_PORT=3003
CODE_TRANSFORMER_PORT=3004
ADMINER_PORT=8081
OPENAI_API_KEY=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_ID=
SUPABASE_DB_PASSWORD=
N8N_WEBHOOK_URL=http://n8n:5678/webhook/migration-pipeline
DOCKER_PLATFORM=linux/amd64
EOL
    log "WARNING" "Veuillez éditer le fichier .env pour configurer les variables d'environnement"
  fi

  # Charger les variables d'environnement
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi

  log "SUCCESS" "✅ Vérification des prérequis terminée"
}

# Phase 1: Configuration de l'environnement Docker
setup_docker() {
  if [ "$SKIP_DOCKER" = true ]; then
    log "WARNING" "Étape Docker ignorée (--skip-docker)"
    return 0
  fi

  log "INFO" "🔄 Phase 1: Configuration de l'environnement Docker"

  # Vérifier si des conteneurs sont déjà en cours d'exécution
  if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    log "INFO" "Des conteneurs sont déjà en cours d'exécution"
    read -p "Voulez-vous arrêter et recréer les conteneurs? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
      run_command "docker-compose -f docker-compose.dev.yml down" "Arrêt des conteneurs Docker existants" "docker_down.log"
    else
      log "INFO" "Utilisation des conteneurs existants"
    fi
  fi

  # Créer les répertoires d'initialisation si nécessaire
  mkdir -p "${WORKSPACE_DIR}/scripts/mysql/init"
  mkdir -p "${WORKSPACE_DIR}/scripts/postgres/init"

  # Créer un script d'initialisation MySQL si inexistant
  if [ ! -f "${WORKSPACE_DIR}/scripts/mysql/init/01-init.sql" ]; then
    log "INFO" "Création d'un script d'initialisation MySQL par défaut"
    cat > "${WORKSPACE_DIR}/scripts/mysql/init/01-init.sql" << EOL
-- Script d'initialisation MySQL par défaut
-- Sera exécuté lors du premier démarrage du conteneur

-- Création d'une base de données de démonstration si elle n'existe pas déjà
CREATE DATABASE IF NOT EXISTS \`legacy_app\`;
USE \`legacy_app\`;

-- Activation des clés étrangères
SET FOREIGN_KEY_CHECKS=1;

-- Tables de base
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`price\` decimal(10,2) NOT NULL,
  \`stock\` int(11) NOT NULL DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données de démonstration
INSERT INTO \`users\` (\`username\`, \`email\`, \`password\`) VALUES
('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('user', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO \`products\` (\`name\`, \`description\`, \`price\`, \`stock\`) VALUES
('Produit 1', 'Description du produit 1', 19.99, 10),
('Produit 2', 'Description du produit 2', 29.99, 5),
('Produit 3', 'Description du produit 3', 39.99, 20);
EOL
  fi

  # Démarrer les conteneurs Docker
  run_command "docker-compose -f docker-compose.dev.yml up -d" "Démarrage des conteneurs Docker" "docker_up.log"

  # Vérifier que tous les conteneurs sont bien démarrés
  log "INFO" "Vérification de l'état des conteneurs..."
  sleep 10  # Attendre que les conteneurs démarrent

  if ! docker-compose -f docker-compose.dev.yml ps | grep -q "mysql-legacy.*Up"; then
    log "ERROR" "Le conteneur MySQL n'a pas démarré correctement"
    run_command "docker-compose -f docker-compose.dev.yml logs mysql-legacy" "Logs MySQL" "mysql_logs.log" "continue"
    exit 1
  fi

  if ! docker-compose -f docker-compose.dev.yml ps | grep -q "postgres-intermediate.*Up"; then
    log "ERROR" "Le conteneur PostgreSQL n'a pas démarré correctement"
    run_command "docker-compose -f docker-compose.dev.yml logs postgres-intermediate" "Logs PostgreSQL" "postgres_logs.log" "continue"
    exit 1
  fi

  log "SUCCESS" "✅ Phase 1 terminée: Environnement Docker configuré"
}

# Phase 2: Import des dumps SQL
import_dumps() {
  if [ "$SKIP_DUMP_IMPORT" = true ]; then
    log "WARNING" "Import des dumps ignoré (--skip-dump-import)"
    return 0
  fi

  log "INFO" "🔄 Phase 2: Import des dumps SQL"

  # Vérifier si des dumps SQL personnalisés sont présents
  MYSQL_DUMPS=($(find "$DB_DUMPS_DIR" -name "*.mysql.sql" -type f))
  
  if [ ${#MYSQL_DUMPS[@]} -gt 0 ]; then
    log "INFO" "Dumps MySQL trouvés: ${#MYSQL_DUMPS[@]} fichier(s)"
    
    for dump in "${MYSQL_DUMPS[@]}"; do
      dump_filename=$(basename "$dump")
      log "INFO" "Import du dump MySQL: $dump_filename"
      
      run_command "docker-compose -f docker-compose.dev.yml exec -T mysql-legacy mysql -u${MYSQL_USER:-app_user} -p${MYSQL_PASSWORD:-app_password} ${MYSQL_DATABASE:-legacy_app} < $dump" \
        "Import du dump MySQL $dump_filename" "mysql_import_${dump_filename}.log" "continue"
    done
  else
    log "INFO" "Aucun dump MySQL personnalisé trouvé dans $DB_DUMPS_DIR"
    log "INFO" "La base de données MySQL utilise le script d'initialisation par défaut"
  fi

  log "SUCCESS" "✅ Phase 2 terminée: Import des dumps SQL"
}

# Phase 3: Analyse du schéma MySQL
analyze_schema() {
  if [ "$SKIP_SCHEMA_ANALYSIS" = true ]; then
    log "WARNING" "Analyse du schéma ignorée (--skip-schema-analysis)"
    return 0
  fi

  log "INFO" "🔄 Phase 3: Analyse du schéma MySQL et conversion vers PostgreSQL"

  # Attendre que les serveurs MCP soient démarrés
  log "INFO" "Attente du démarrage des serveurs MCP..."
  sleep 10

  # Exécuter l'agent mysql-to-pg pour analyser le schéma
  log "INFO" "Exécution de l'agent mysql-to-pg..."
  
  # Construire la commande avec les options pour les tables spécifiques
  TABLES_OPTION=""
  if [ -n "$TABLES" ]; then
    TABLES_OPTION="--include-tables=\"$TABLES\""
  fi

  # Exécuter l'agent dans le conteneur
  run_command "docker-compose -f docker-compose.dev.yml exec -T code-transformer npx ts-node /app/mysql-to-pg.ts \
    --host=mysql-legacy \
    --port=3306 \
    --user=${MYSQL_USER:-app_user} \
    --password=${MYSQL_PASSWORD:-app_password} \
    --database=${MYSQL_DATABASE:-legacy_app} \
    --output=/app/schema_map.json \
    --verbose \
    $TABLES_OPTION" \
    "Analyse du schéma MySQL" "mysql_to_pg.log"
  
  # Copier le fichier de mapping généré
  run_command "docker cp \$(docker-compose -f docker-compose.dev.yml ps -q code-transformer):/app/schema_map.json $SCHEMA_MAP_FILE" \
    "Copie du fichier de mapping" "copy_schema_map.log"

  log "SUCCESS" "✅ Phase 3 terminée: Analyse du schéma MySQL"
}

# Phase 4: Génération du schéma Prisma
generate_prisma() {
  if [ "$SKIP_PRISMA_GENERATION" = true ]; then
    log "WARNING" "Génération du schéma Prisma ignorée (--skip-prisma-generation)"
    return 0
  fi

  log "INFO" "🔄 Phase 4: Génération du schéma Prisma"

  # Copier le fichier de mapping vers le conteneur prisma-generator
  run_command "docker cp $SCHEMA_MAP_FILE \$(docker-compose -f docker-compose.dev.yml ps -q prisma-generator):/app/schema_map.json" \
    "Copie du fichier de mapping vers prisma-generator" "copy_to_prisma.log"

  # Exécuter le générateur de schéma Prisma
  run_command "docker-compose -f docker-compose.dev.yml exec -T prisma-generator node /app/index.js" \
    "Génération du schéma Prisma" "prisma_generation.log"

  # Copier le schéma Prisma généré
  run_command "docker cp \$(docker-compose -f docker-compose.dev.yml ps -q prisma-generator):/app/output/schema.prisma ${REPORTS_DIR}/schema.prisma" \
    "Copie du schéma Prisma généré" "copy_prisma_schema.log"

  log "SUCCESS" "✅ Phase 4 terminée: Génération du schéma Prisma"
}

# Phase 5: Push vers Supabase
push_to_supabase() {
  if [ "$SKIP_SUPABASE_PUSH" = true ] || [ "$DRY_RUN" = true ]; then
    if [ "$DRY_RUN" = true ]; then
      log "WARNING" "Push vers Supabase ignoré (mode dry-run)"
    else
      log "WARNING" "Push vers Supabase ignoré (--skip-supabase-push)"
    fi
    return 0
  fi

  log "INFO" "🔄 Phase 5: Push vers Supabase"

  # Vérifier les variables d'environnement Supabase
  if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_ID" ]; then
    log "ERROR" "Les variables d'environnement SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_ID sont requises"
    exit 1
  fi

  # Créer un script SQL temporaire pour Supabase
  log "INFO" "Création d'un script SQL pour Supabase"
  cat > "${REPORTS_DIR}/supabase_push.sql" << EOL
-- Script généré automatiquement pour Supabase
-- Basé sur le schéma PostgreSQL converti

BEGIN;

-- Code SQL pour créer les tables dans Supabase
$([ -f "${REPORTS_DIR}/schema.sql" ] && cat "${REPORTS_DIR}/schema.sql" || echo "-- Aucun schéma SQL généré")

COMMIT;
EOL

  # Utiliser Supabase CLI pour pousser vers Supabase
  log "INFO" "Push vers Supabase via Supabase CLI"
  
  # Copier le script SQL vers le conteneur supabase-cli
  run_command "docker cp ${REPORTS_DIR}/supabase_push.sql \$(docker-compose -f docker-compose.dev.yml ps -q supabase-cli):/supabase/migration.sql" \
    "Copie du script SQL vers supabase-cli" "copy_to_supabase.log"

  # Exécuter la migration
  run_command "docker-compose -f docker-compose.dev.yml exec -T supabase-cli supabase db push --db-url postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres-intermediate:5432/${POSTGRES_DB:-app_migration} --password ${SUPABASE_DB_PASSWORD}" \
    "Push vers Supabase" "supabase_push.log" "continue"

  log "SUCCESS" "✅ Phase 5 terminée: Push vers Supabase"
}

# Phase 6: Transformation du code PHP vers NestJS/Remix
transform_code() {
  if [ "$SKIP_CODE_TRANSFORM" = true ]; then
    log "WARNING" "Transformation du code ignorée (--skip-code-transform)"
    return 0
  fi

  log "INFO" "🔄 Phase 6: Transformation du code PHP vers NestJS/Remix"

  # Vérifier si le répertoire source existe
  if [ ! -d "${WORKSPACE_DIR}/src" ]; then
    log "WARNING" "Le répertoire source n'existe pas: ${WORKSPACE_DIR}/src"
    log "INFO" "Création d'un répertoire source par défaut..."
    mkdir -p "${WORKSPACE_DIR}/src"
    
    # Créer un exemple de fichier PHP
    cat > "${WORKSPACE_DIR}/src/example.php" << EOL
<?php
/**
 * Exemple de fichier PHP pour démonstration
 */

// Configuration de base de données
\$db_config = [
    'host' => 'localhost',
    'username' => 'app_user',
    'password' => 'app_password',
    'database' => 'legacy_app'
];

// Fonction de connexion
function connectDB(\$config) {
    \$conn = new mysqli(\$config['host'], \$config['username'], \$config['password'], \$config['database']);
    if (\$conn->connect_error) {
        die("Connection failed: " . \$conn->connect_error);
    }
    return \$conn;
}

// Classe utilisateur
class User {
    private \$id;
    private \$username;
    private \$email;
    
    public function __construct(\$id, \$username, \$email) {
        \$this->id = \$id;
        \$this->username = \$username;
        \$this->email = \$email;
    }
    
    public function getId() {
        return \$this->id;
    }
    
    public function getUsername() {
        return \$this->username;
    }
    
    public function getEmail() {
        return \$this->email;
    }
    
    // Récupérer tous les utilisateurs
    public static function getAllUsers(\$conn) {
        \$users = [];
        \$sql = "SELECT id, username, email FROM users";
        \$result = \$conn->query(\$sql);
        
        if (\$result->num_rows > 0) {
            while(\$row = \$result->fetch_assoc()) {
                \$users[] = new User(\$row['id'], \$row['username'], \$row['email']);
            }
        }
        
        return \$users;
    }
}

// Connexion à la base de données
\$conn = connectDB(\$db_config);

// Récupérer tous les utilisateurs
\$users = User::getAllUsers(\$conn);

// Afficher les utilisateurs
echo "<h1>Liste des utilisateurs</h1>";
echo "<ul>";
foreach (\$users as \$user) {
    echo "<li>" . \$user->getUsername() . " (" . \$user->getEmail() . ")</li>";
}
echo "</ul>";

// Fermer la connexion
\$conn->close();
?>
EOL
  fi

  # Exécuter la transformation du code
  log "INFO" "Exécution de la transformation du code..."
  
  run_command "docker-compose -f docker-compose.dev.yml exec -T code-transformer node /app/transform.js" \
    "Transformation du code PHP vers NestJS/Remix" "code_transform.log" "continue"

  # Copier les résultats de la transformation
  run_command "mkdir -p ${REPORTS_DIR}/transformed_code" \
    "Création du répertoire pour le code transformé" "mkdir_transformed.log"
  
  run_command "docker cp \$(docker-compose -f docker-compose.dev.yml ps -q code-transformer):/app/target/ ${REPORTS_DIR}/transformed_code/" \
    "Copie du code transformé" "copy_transformed.log" "continue"

  log "SUCCESS" "✅ Phase 6 terminée: Transformation du code PHP vers NestJS/Remix"
}

# Phase 7: Exécution du workflow n8n
run_n8n_workflow() {
  if [ "$SKIP_N8N_WORKFLOW" = true ]; then
    log "WARNING" "Exécution du workflow n8n ignorée (--skip-n8n-workflow)"
    return 0
  fi

  log "INFO" "🔄 Phase 7: Exécution du workflow n8n"

  # Vérifier si le fichier de workflow n8n existe
  if [ ! -f "$N8N_WORKFLOW_FILE" ]; then
    log "ERROR" "Le fichier de workflow n8n n'existe pas: $N8N_WORKFLOW_FILE"
    exit 1
  fi

  # Copier le workflow n8n à jour
  run_command "cp $N8N_WORKFLOW_FILE ${WORKSPACE_DIR}/workflows/migration_pipeline.json" \
    "Copie du workflow n8n" "copy_n8n_workflow.log"

  # Générer un fichier de résumé de la migration
  log "INFO" "Génération du résumé de la migration..."
  
  # Création du rapport final en JSON
  cat > "${REPORTS_DIR}/migration_summary.json" << EOL
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "completed",
  "source": {
    "type": "mysql",
    "database": "${MYSQL_DATABASE:-legacy_app}",
    "host": "mysql-legacy"
  },
  "target": {
    "type": "postgresql",
    "database": "${POSTGRES_DB:-app_migration}",
    "host": "postgres-intermediate"
  },
  "supabase": {
    "projectId": "${SUPABASE_PROJECT_ID}",
    "pushed": $([ "$SKIP_SUPABASE_PUSH" = true ] || [ "$DRY_RUN" = true ] && echo "false" || echo "true")
  },
  "codeTransformation": {
    "completed": $([ "$SKIP_CODE_TRANSFORM" = true ] && echo "false" || echo "true"),
    "source": "PHP",
    "target": "NestJS/Remix"
  },
  "reportPath": "${REPORTS_DIR}",
  "dryRun": $([ "$DRY_RUN" = true ] && echo "true" || echo "false")
}
EOL

  # Appeler le webhook n8n
  if [ -n "$N8N_WEBHOOK_URL" ]; then
    log "INFO" "Appel du webhook n8n..."
    
    run_command "curl -s -X POST ${N8N_WEBHOOK_URL} -H 'Content-Type: application/json' -d @${REPORTS_DIR}/migration_summary.json" \
      "Appel du webhook n8n" "n8n_webhook.log" "continue"
  else
    log "WARNING" "Variable N8N_WEBHOOK_URL non définie, impossible d'appeler le webhook n8n"
  fi

  log "SUCCESS" "✅ Phase 7 terminée: Exécution du workflow n8n"
}

# Finalisation
finalize() {
  log "INFO" "🔄 Finalisation du pipeline de migration"

  # Générer un rapport Markdown plus lisible
  cat > "${REPORTS_DIR}/migration_summary.md" << EOL
# Rapport de migration PHP → NestJS/Remix

**Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Résumé

- **Source MySQL:** mysql-legacy (${MYSQL_DATABASE:-legacy_app})
- **Cible PostgreSQL intermédiaire:** postgres-intermediate (${POSTGRES_DB:-app_migration})
- **Mode dry-run:** $([ "$DRY_RUN" = true ] && echo "Oui" || echo "Non")
- **Push vers Supabase:** $([ "$SKIP_SUPABASE_PUSH" = true ] || [ "$DRY_RUN" = true ] && echo "Non" || echo "Oui")
- **Transformation de code:** $([ "$SKIP_CODE_TRANSFORM" = true ] && echo "Non" || echo "Oui")

## Répertoires des ressources

- **Rapports:** ${REPORTS_DIR}
- **Logs:** ${LOGS_DIR}
- **Schéma PostgreSQL:** ${REPORTS_DIR}/schema.sql
- **Schéma Prisma:** ${REPORTS_DIR}/schema.prisma
- **Code transformé:** ${REPORTS_DIR}/transformed_code

## Prochaines étapes

1. Vérifier le schéma et les données dans PostgreSQL
2. Explorer le code NestJS/Remix généré
3. Tester l'application avec la nouvelle base de données
4. Configurer les routes et les contrôleurs NestJS
EOL

  log "SUCCESS" "🎉 Pipeline de migration terminé avec succès!"
  log "INFO" "📋 Un rapport complet est disponible dans: ${REPORTS_DIR}/migration_summary.md"
}

# Fonction principale
main() {
  log "INFO" "🚀 Démarrage du pipeline de migration PHP → NestJS/Remix"
  
  if [ "$DRY_RUN" = true ]; then
    log "WARNING" "Mode dry-run activé: aucune modification ne sera effectuée sur Supabase"
  fi
  
  check_prerequisites
  setup_docker
  import_dumps
  analyze_schema
  generate_prisma
  push_to_supabase
  transform_code
  run_n8n_workflow
  finalize
}

# Exécuter la fonction principale
main