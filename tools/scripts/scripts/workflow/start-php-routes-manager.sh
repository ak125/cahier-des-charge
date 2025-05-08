#!/bin/bash

# Script pour lancer le workflow de gestion des routes PHP via n8n
# Auteur: GitHub Copilot
# Date: 2025-04-12

set -e

# Définir les couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Fonction pour afficher les messages
function log() {
  echo -e "${GREEN}[PHP-ROUTES]${NC} $1"
}

function warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

function error() {
  echo -e "${RED}[ERREUR]${NC} $1"
  exit 1
}

# Vérifier que n8n est installé
if ! command -v n8n &> /dev/null; then
  error "n8n n'est pas installé. Installez-le avec 'npm install -g n8n'"
fi

# Vérifier que le fichier de workflow existe
WORKFLOW_FILE="./config/n8n-php-routes-manager.json"
if [ ! -f "$WORKFLOW_FILE" ]; then
  error "Le fichier de workflow n8n '$WORKFLOW_FILE' n'existe pas"
fi

# Paramètres configurables
HTACCESS_PATH="${1:-./examples/.htaccess}"
BASE_URL="${2:-http://localhost:3001}"
ROUTING_PATCH_PATH="${3:-./routing_patch.json}"

if [ ! -f "$HTACCESS_PATH" ]; then
  warn "Le fichier .htaccess '$HTACCESS_PATH' n'existe pas. Utilisez le chemin correct."
  read -p "Voulez-vous continuer quand même? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Créer les dossiers nécessaires
log "Création des dossiers nécessaires..."
mkdir -p logs reports

# Importer le workflow dans n8n
log "Importation du workflow dans n8n..."
WORKFLOW_ID=$(n8n import:workflow --input="$WORKFLOW_FILE" --separate)

# Extraire l'ID du workflow
WORKFLOW_ID=$(echo "$WORKFLOW_ID" | grep -oP 'Workflow with id \K[a-zA-Z0-9]+')
if [ -z "$WORKFLOW_ID" ]; then
  error "Impossible d'obtenir l'ID du workflow importé"
fi

# Mettre à jour les paramètres du workflow
log "Mise à jour des paramètres du workflow..."
n8n update:workflow "$WORKFLOW_ID" \
  --active true \
  --data "{\"nodes\":[{\"parameters\":{\"command\":\"cd $(pwd) && npx ts-node -r tsconfig-paths/register agents/migration/php-to-remix/php-router-audit.ts --htaccessPath=$HTACCESS_PATH --outputPath=$ROUTING_PATCH_PATH --baseUrl=$BASE_URL --checkActive=true\"}}]}"

# Exécuter le workflow immédiatement (sans attendre le planificateur)
log "Exécution du workflow PHP Routes Migration Manager..."
n8n execute:workflow --id "$WORKFLOW_ID"

log "${BOLD}Le workflow de gestion des routes PHP a été exécuté avec succès!${NC}"
log "Vérifiez les rapports générés dans le dossier 'reports/'."
log "Le fichier routing_patch.json a été mis à jour."
log "Les tests de redirection ont été exécutés."

# Afficher des informations supplémentaires
echo 
echo -e "${BOLD}Que faire ensuite:${NC}"
echo "1. Vérifiez le rapport dans reports/php_routes_audit.md"
echo "2. Examinez les routes non mappées dans reports/missing_php_routes.md"
echo "3. Pour personnaliser davantage les règles, modifiez le nœud 'Personnaliser les règles' dans n8n"
echo "4. Pour modifier la fréquence d'exécution, ajustez le nœud 'Schedule' dans n8n"
echo
echo -e "${BOLD}Pour exécuter à nouveau ce workflow:${NC}"
echo "./start_php_routes_manager.sh [chemin_htaccess] [base_url] [chemin_routing_patch]"