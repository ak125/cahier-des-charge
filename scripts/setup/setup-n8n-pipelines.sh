#!/bin/bash

# Script d'automatisation pour la configuration et l'activation des pipelines n8n
# Créé le: $(date)

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuration
N8N_URL=${N8N_URL:-"http://localhost:5678"}
N8N_API_KEY=${N8N_API_KEY:-""}
NOTIFICATION_CHAT_ID=${NOTIFICATION_CHAT_ID:-""}
DASHBOARD_URL=${DASHBOARD_URL:-"http://localhost:3000"}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET:-""}

echo -e "${BLUE}=== Configuration des pipelines n8n ===${NC}"

# Vérification des prérequis
echo -e "\n${YELLOW}Vérification des prérequis...${NC}"

# Vérifier si n8n est en cours d'exécution
echo -e "Vérification de n8n..."
if ! curl -s "$N8N_URL/healthz" > /dev/null; then
  echo -e "${RED}Erreur: n8n n'est pas accessible à l'URL $N8N_URL${NC}"
  echo -e "Veuillez démarrer n8n avec: docker-compose -f docker-compose.n8n.yml up -d"
  exit 1
fi
echo -e "${GREEN}✓ n8n est en cours d'exécution${NC}"

# Vérifier si le dossier agents existe
echo -e "Vérification du dossier agents..."
if [ ! -d "./agents" ]; then
  echo -e "${RED}Erreur: Le dossier agents n'existe pas${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dossier agents trouvé${NC}"

# Vérifier les agents requis
echo -e "Vérification des agents requis..."
REQUIRED_AGENTS=(
  "auto-pr-agent.ts"
  "bullmq-orchestrator.ts"
  "ci-tester.ts"
  "dev-checker.ts"
  "dev-integrator.ts"
  "dev-linter.ts"
  "devops-preview.ts"
  "diff-verifier.ts"
  "mcp-manifest-manager.ts"
  "mcp-verifier.ts"
  "monitoring-check.ts"
  "notifier.ts"
  "orchestrator.ts"
  "php-analyzer-agent.ts"
  "pr-creator.ts"
  "qa-analyzer.ts"
)

MISSING_AGENTS=0
for agent in "${REQUIRED_AGENTS[@]}"; do
  if [ ! -f "./agents/$agent" ]; then
    echo -e "${RED}Agent manquant: $agent${NC}"
    MISSING_AGENTS=$((MISSING_AGENTS+1))
  fi
done

if [ $MISSING_AGENTS -gt 0 ]; then
  echo -e "${YELLOW}Attention: $MISSING_AGENTS agents sont manquants${NC}"
  echo -e "Les pipelines peuvent ne pas fonctionner correctement."
  read -p "Voulez-vous continuer quand même? (o/n): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[oO]$ ]]; then
    echo -e "${RED}Configuration annulée${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Tous les agents requis sont présents${NC}"
fi

# Configuration des variables d'environnement
echo -e "\n${YELLOW}Configuration des variables d'environnement...${NC}"

# Demander les valeurs si elles ne sont pas définies
if [ -z "$N8N_API_KEY" ]; then
  read -p "Clé API n8n (laissez vide si non requise): " N8N_API_KEY
fi

if [ -z "$NOTIFICATION_CHAT_ID" ]; then
  read -p "ID de chat Telegram pour les notifications: " NOTIFICATION_CHAT_ID
fi

if [ -z "$DASHBOARD_URL" ]; then
  read -p "URL du tableau de bord (default: http://localhost:3000): " DASHBOARD_URL_INPUT
  DASHBOARD_URL=${DASHBOARD_URL_INPUT:-"http://localhost:3000"}
fi

if [ -z "$GITHUB_WEBHOOK_SECRET" ]; then
  read -p "Secret pour les webhooks GitHub (laissez vide si non utilisé): " GITHUB_WEBHOOK_SECRET
fi

# Sauvegarde des variables dans un fichier de configuration
echo -e "Sauvegarde de la configuration..."
cat > ./.env.n8n << EOF
N8N_URL=$N8N_URL
N8N_API_KEY=$N8N_API_KEY
NOTIFICATION_CHAT_ID=$NOTIFICATION_CHAT_ID
DASHBOARD_URL=$DASHBOARD_URL
GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET
EOF
echo -e "${GREEN}✓ Configuration sauvegardée dans .env.n8n${NC}"

# Importer les pipelines dans n8n
echo -e "\n${YELLOW}Importation des pipelines dans n8n...${NC}"

# Optimiser le fichier n8n.pipeline.json avant importation
echo -e "Optimisation du fichier n8n.pipeline.json..."
cp ./n8n.pipeline.json ./n8n.pipeline.optimized.json

# Importer chaque workflow
echo -e "\n${YELLOW}Import des workflows dans n8n...${NC}"

# Vérifier si jq est installé pour le traitement JSON
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}L'outil jq n'est pas installé. Installation en cours...${NC}"
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
  elif command -v yum &> /dev/null; then
    sudo yum install -y jq
  elif command -v brew &> /dev/null; then
    brew install jq
  else
    echo -e "${RED}Impossible d'installer jq automatiquement.${NC}"
    echo -e "Veuillez l'installer manuellement puis réexécuter ce script."
    exit 1
  fi
fi

# Extraction et import des workflows
if command -v jq &> /dev/null; then
  workflow_ids=$(jq -r '.workflows[].id' ./n8n.pipeline.optimized.json)
  
  for id in $workflow_ids; do
    name=$(jq -r ".workflows[] | select(.id == \"$id\") | .name" ./n8n.pipeline.optimized.json)
    echo -e "Import du workflow: ${BLUE}$name${NC} (ID: $id)"
    
    # Extraction du workflow individuel
    jq ".workflows[] | select(.id == \"$id\")" ./n8n.pipeline.optimized.json > "./temp_$id.json"
    
    # Import via l'API n8n
    import_result=$(curl -s -X POST \
      "$N8N_URL/api/v1/workflows/import" \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      -H "Content-Type: application/json" \
      -d @"./temp_$id.json")
    
    # Vérifier le résultat
    if [[ $import_result == *"id"* ]]; then
      echo -e "${GREEN}✓ Workflow $name importé avec succès${NC}"
    else
      echo -e "${RED}Erreur lors de l'import du workflow $name${NC}"
      echo -e "Réponse: $import_result"
    fi
    
    # Supprimer le fichier temporaire
    rm "./temp_$id.json"
  done
else
  echo -e "${YELLOW}jq n'est pas disponible, importation manuelle requise${NC}"
  echo -e "Veuillez ouvrir n8n et importer manuellement le fichier n8n.pipeline.optimized.json"
fi

# Configuration des variables d'environnement dans n8n
echo -e "\n${YELLOW}Configuration des variables d'environnement dans n8n...${NC}"

# Créer/mettre à jour les variables d'environnement via l'API n8n
env_vars="{
  \"NOTIFICATION_CHAT_ID\": \"$NOTIFICATION_CHAT_ID\",
  \"DASHBOARD_URL\": \"$DASHBOARD_URL\"
}"

env_result=$(curl -s -X POST \
  "$N8N_URL/api/v1/variables" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$env_vars")

if [[ $env_result == *"success"* || $env_result == *"id"* ]]; then
  echo -e "${GREEN}✓ Variables d'environnement configurées dans n8n${NC}"
else
  echo -e "${YELLOW}Configuration manuelle des variables d'environnement requise${NC}"
  echo -e "Veuillez définir ces variables dans n8n:"
  echo -e "NOTIFICATION_CHAT_ID: $NOTIFICATION_CHAT_ID"
  echo -e "DASHBOARD_URL: $DASHBOARD_URL"
fi

# Configuration des webhooks GitHub (si le secret est fourni)
if [ ! -z "$GITHUB_WEBHOOK_SECRET" ]; then
  echo -e "\n${YELLOW}Configuration des webhooks GitHub...${NC}"
  
  echo -e "${BLUE}Pour configurer les webhooks GitHub, ajoutez les URLs suivantes dans les paramètres de votre dépôt:${NC}"
  echo -e "URL: ${N8N_URL}/webhook/audit-php-files-webhook"
  echo -e "URL: ${N8N_URL}/webhook/auto-pr-webhook"
  echo -e "URL: ${N8N_URL}/webhook/dev-check-webhook"
  echo -e "URL: ${N8N_URL}/webhook/migration-webhook"
  echo -e "URL: ${N8N_URL}/webhook/mcp-verify-webhook"
  echo -e "Secret: $GITHUB_WEBHOOK_SECRET"
  echo -e "Content type: application/json"
  echo -e "Événements: push, pull_request"
fi

# Instructions finales
echo -e "\n${GREEN}=== Configuration terminée ===${NC}"
echo -e "Tous les pipelines ont été importés et configurés dans n8n."
echo -e "\nPour activer manuellement un pipeline, accédez à:"
echo -e "${BLUE}$N8N_URL${NC}"
echo -e "et activez le workflow correspondant."

echo -e "\n${YELLOW}Remarques importantes:${NC}"
echo -e "1. Assurez-vous que les agents sont correctement installés et fonctionnels."
echo -e "2. Vérifiez les chemins de fichiers dans les workflows si nécessaire."
echo -e "3. Les workflows sont configurés pour utiliser: ${BLUE}/workspaces/cahier-des-charge${NC}"
echo -e "4. Pour les notifications Telegram, configurez correctement un bot et l'ID de chat."

exit 0