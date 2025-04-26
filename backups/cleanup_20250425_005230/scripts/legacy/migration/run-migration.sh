#!/bin/bash
# run-migration.sh - Lance une migration via le pipeline n8n

echo "🚀 Lancement d'une migration via le pipeline n8n..."

# Vérifier si n8n est en cours d'exécution
if ! curl -s http://localhost:5678/rest/settings > /dev/null; then
  echo "❌ n8n n'est pas en cours d'exécution. Lancez-le d'abord avec: ./scripts/migration/start-n8n.sh"
  exit 1
fi

# Paramètres de la migration
WORKFLOW_ID=${1:-"php-analyzer"}  # ID du workflow à exécuter, php-analyzer par défaut
SOURCE_PATH=${2:-"./app"}         # Chemin source par défaut
TARGET_PATH=${3:-"./reports/analysis"} # Chemin cible par défaut

echo "📋 Paramètres de la migration:"
echo "   - Workflow: $WORKFLOW_ID"
echo "   - Chemin source: $SOURCE_PATH"
echo "   - Chemin cible: $TARGET_PATH"

# Demander confirmation
echo -n "❓ Voulez-vous lancer cette migration? (o/n): "
read -r answer

if [[ ! "$answer" =~ ^[oO]$ ]]; then
  echo "❌ Migration annulée."
  exit 0
fi

# Créer le dossier cible s'il n'existe pas
mkdir -p "$TARGET_PATH"

# Lancer l'exécution du workflow
echo "🔄 Lancement du workflow $WORKFLOW_ID..."

# Authentification pour l'API n8n
N8N_USER=${N8N_BASIC_AUTH_USER:-"admin"}
N8N_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-"cahier-des-charges-migrator"}
AUTH_STRING=$(echo -n "$N8N_USER:$N8N_PASSWORD" | base64)

# Récupérer l'ID interne du workflow
WORKFLOW_DATA=$(curl -s -H "Authorization: Basic $AUTH_STRING" http://localhost:5678/rest/workflows)
INTERNAL_ID=$(echo "$WORKFLOW_DATA" | grep -o "\"id\":\"[^\"]*\",\"name\":\"[^\"]*$WORKFLOW_ID" | head -1 | cut -d'"' -f4)

if [ -z "$INTERNAL_ID" ]; then
  echo "❌ Workflow '$WORKFLOW_ID' non trouvé dans n8n."
  exit 1
fi

# Lancer l'exécution
EXECUTION_DATA=$(curl -s -X POST \
  -H "Authorization: Basic $AUTH_STRING" \
  -H "Content-Type: application/json" \
  -d "{\"workflowData\": {\"id\": \"$INTERNAL_ID\"}, \"runData\": {\"sourcePath\": \"$SOURCE_PATH\", \"targetPath\": \"$TARGET_PATH\"}}" \
  http://localhost:5678/rest/workflows/$INTERNAL_ID/execute)

EXECUTION_ID=$(echo "$EXECUTION_DATA" | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)

if [ -z "$EXECUTION_ID" ]; then
  echo "❌ Erreur lors du lancement de l'exécution."
  exit 1
fi

echo "✅ Migration lancée avec l'ID d'exécution: $EXECUTION_ID"
echo "   Vous pouvez suivre l'avancement dans l'interface n8n: http://localhost:5678/execution/$EXECUTION_ID"
