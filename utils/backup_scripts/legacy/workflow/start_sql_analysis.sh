#!/bin/bash

# ======================================================
# Script de démarrage pour l'Analyseur SQL IA
# Permet une migration intelligente de MySQL vers Prisma/PostgreSQL
# ======================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dossiers nécessaires
REPORTS_DIR="./reports"
LOGS_DIR="./logs"
CONFIG_DIR="./config"
CONFIG_FILE="$CONFIG_DIR/sql_analyzer.config.json"

echo -e "${BLUE}🧠 Démarrage de l'Analyseur SQL IA${NC}"
echo -e "${BLUE}=======================================${NC}"

# Vérification des dossiers
echo -e "${YELLOW}Vérification de l'environnement...${NC}"
mkdir -p $REPORTS_DIR $LOGS_DIR

# Vérification du fichier de configuration
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}Erreur: Fichier de configuration non trouvé: $CONFIG_FILE${NC}"
  exit 1
fi

# Vérification des dépendances
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js est requis mais non installé.${NC}"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}jq est requis mais non installé.${NC}"; exit 1; }

# Extraction des paramètres de la base de données
DB_HOST=$(jq -r '.database.mysql.host' $CONFIG_FILE)
DB_PORT=$(jq -r '.database.mysql.port' $CONFIG_FILE)
DB_USER=$(jq -r '.database.mysql.user' $CONFIG_FILE)
DB_NAME=$(jq -r '.database.mysql.database' $CONFIG_FILE)

# Demande du mot de passe si non défini
DB_PASSWORD=$(jq -r '.database.mysql.password' $CONFIG_FILE)
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "null" ]; then
  read -sp "Entrez le mot de passe MySQL: " DB_PASSWORD
  echo
fi

# Vérification de la connexion à la base de données
echo -e "${YELLOW}Vérification de la connexion à la base de données...${NC}"
if ! mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null; then
  echo -e "${RED}Erreur: Impossible de se connecter à la base de données MySQL.${NC}"
  exit 1
fi

# Fonction pour exécuter un agent
run_agent() {
  local agent_name=$1
  local agent_enabled=$(jq -r ".agents.$agent_name.enabled" $CONFIG_FILE)
  
  if [ "$agent_enabled" == "true" ]; then
    echo -e "${GREEN}🔍 Exécution de l'agent: $agent_name${NC}"
    
    # Lancement de l'agent via Node.js
    node ./agents/analysis/run-agent.js --agent $agent_name --config $CONFIG_FILE
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Agent $agent_name terminé avec succès${NC}"
    else
      echo -e "${RED}❌ Échec de l'agent $agent_name${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⏭️ Agent $agent_name désactivé, ignoré${NC}"
  fi
}

# Fonction pour vérifier si n8n est nécessaire
check_n8n_integration() {
  local n8n_enabled=$(jq -r '.integration.n8nWorkflow.enabled' $CONFIG_FILE)
  
  if [ "$n8n_enabled" == "true" ]; then
    echo -e "${YELLOW}🔄 Intégration n8n activée, vérification...${NC}"
    
    # Vérification de n8n
    if ! curl -s http://localhost:5678/healthz >/dev/null; then
      echo -e "${YELLOW}⚠️ Serveur n8n non détecté, lancement...${NC}"
      docker-compose -f docker-compose.n8n.yml up -d
      sleep 5
    fi
    
    # Exécution du workflow n8n
    local workflow_id=$(jq -r '.integration.n8nWorkflow.workflowId' $CONFIG_FILE)
    if [ -n "$workflow_id" ] && [ "$workflow_id" != "null" ]; then
      echo -e "${GREEN}🚀 Exécution du workflow n8n ID: $workflow_id${NC}"
      curl -X POST http://localhost:5678/webhook/$workflow_id
    else
      echo -e "${YELLOW}⚠️ ID de workflow n8n non configuré${NC}"
    fi
  fi
}

# Fonction pour générer le rapport final
generate_report() {
  echo -e "${BLUE}📊 Génération du rapport final...${NC}"
  
  # Fusion des différents rapports JSON dans un rapport final
  node ./agents/analysis/generate-report.js --config $CONFIG_FILE --output $REPORTS_DIR/sql_analyzer_report.md
  
  echo -e "${GREEN}📝 Rapport généré: $REPORTS_DIR/sql_analyzer_report.md${NC}"
}

# Exécution des agents dans l'ordre
echo -e "${BLUE}🚀 Démarrage de l'analyse...${NC}"

run_agent "extracteur"
run_agent "analyseRelationnelle"
run_agent "optimiseurType"
run_agent "detectionDetteTechnique"
run_agent "generateurPrisma"
run_agent "planificateurMigration"

# Vérification de l'intégration n8n
check_n8n_integration

# Génération du rapport final
generate_report

echo -e "${GREEN}✅ Analyse SQL terminée avec succès!${NC}"
echo -e "${BLUE}📁 Tous les rapports sont disponibles dans le dossier $REPORTS_DIR${NC}"
echo -e "${BLUE}=======================================${NC}"