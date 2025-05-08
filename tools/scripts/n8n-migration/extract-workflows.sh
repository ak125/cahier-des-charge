#!/bin/bash
#
# Script d'extraction des workflows n8n
# Ce script extrait tous les workflows n8n actifs et les sauvegarde dans un répertoire
#
# Usage: ./extract-workflows.sh --output ./migrations/n8n-inventory/
#
# Date de création: 6 mai 2025

# Paramètres par défaut
OUTPUT_DIR="./migrations/n8n-inventory/workflows"
N8N_API_TOKEN="${N8N_API_TOKEN:-}"
N8N_URL="${N8N_URL:-http://localhost:5678}"
VERBOSE=false

# Traitement des arguments
for arg in "$@"
do
  case $arg in
    --output=*|--output)
      if [[ $arg == --output=* ]]; then
        OUTPUT_DIR="${arg#*=}"
      else
        OUTPUT_DIR="$2"
        shift
      fi
      ;;
    --token=*|--token)
      if [[ $arg == --token=* ]]; then
        N8N_API_TOKEN="${arg#*=}"
      else
        N8N_API_TOKEN="$2"
        shift
      fi
      ;;
    --url=*|--url)
      if [[ $arg == --url=* ]]; then
        N8N_URL="${arg#*=}"
      else
        N8N_URL="$2"
        shift
      fi
      ;;
    --verbose)
      VERBOSE=true
      ;;
    *)
      # Argument inconnu
      ;;
  esac
  shift
done

# S'assurer que OUTPUT_DIR a le format correct et se termine par /workflows
if [[ "$OUTPUT_DIR" == */ ]]; then
  # Si le chemin se termine par /, ajouter workflows
  WORKFLOWS_DIR="${OUTPUT_DIR}workflows"
else
  # Sinon ajouter /workflows
  WORKFLOWS_DIR="${OUTPUT_DIR}/workflows"
fi

# Base directory for all outputs
BASE_DIR=$(dirname "$WORKFLOWS_DIR")

# Création du répertoire de sortie
mkdir -p "$WORKFLOWS_DIR"
echo "Répertoire de sortie: $WORKFLOWS_DIR"

# Vérification des prérequis
if ! command -v curl &> /dev/null; then
  echo "Erreur: curl n'est pas installé. Veuillez l'installer et réessayer."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Erreur: jq n'est pas installé. Veuillez l'installer et réessayer."
  exit 1
fi

# Fonction pour extraire les workflows localement (à partir des fichiers json)
extract_local_workflows() {
  echo "Extraction des workflows n8n à partir des fichiers locaux..."
  
  # Recherche de tous les fichiers json qui pourraient contenir des workflows n8n
  find /workspaces/cahier-des-charge -name "*n8n*.json" -o -name "n8n-*.json" | grep -v "node_modules" | grep -v "dist" | while read file; do
    # Vérifier si le fichier contient des nœuds et des connexions (caractéristiques d'un workflow n8n)
    if grep -q '"nodes":' "$file" && grep -q '"connections":' "$file"; then
      # Extraire le nom du workflow et créer un fichier de sortie
      WORKFLOW_NAME=$(jq -r '.name // "unnamed-workflow"' "$file" | tr -dc '[:alnum:] [:space:]' | tr ' ' '_')
      WORKFLOW_ID=$(jq -r '.id // .meta.identifier // "workflow-unknown"' "$file")
      
      # Nom de fichier unique avec timestamp
      TIMESTAMP=$(date +%Y%m%d%H%M%S)
      OUTPUT_FILE="$WORKFLOWS_DIR/${WORKFLOW_NAME}_${TIMESTAMP}.json"
      
      # Copier le fichier
      cp "$file" "$OUTPUT_FILE"
      
      if [ "$VERBOSE" = true ]; then
        echo "Workflow extrait: $WORKFLOW_NAME ($WORKFLOW_ID) → $OUTPUT_FILE"
      else
        echo "Workflow extrait: $WORKFLOW_NAME"
      fi
    fi
  done
}

# Fonction pour extraire les workflows à partir de l'API n8n
extract_api_workflows() {
  if [ -z "$N8N_API_TOKEN" ]; then
    echo "Aucun token API n8n fourni. L'extraction à partir de l'API est ignorée."
    return
  fi

  echo "Extraction des workflows n8n à partir de l'API..."
  
  # Récupération de tous les workflows
  WORKFLOWS_JSON=$(curl -s -X GET \
    "$N8N_URL/api/v1/workflows" \
    -H "Accept: application/json" \
    -H "X-N8N-API-KEY: $N8N_API_TOKEN")
  
  # Vérifier si la requête a réussi
  if [ $? -ne 0 ] || [[ "$WORKFLOWS_JSON" == *"error"* ]]; then
    echo "Erreur lors de la récupération des workflows: $WORKFLOWS_JSON"
    return
  fi
  
  # Extraire chaque workflow individuellement
  WORKFLOW_IDS=$(echo "$WORKFLOWS_JSON" | jq -r '.data[].id')
  
  for ID in $WORKFLOW_IDS; do
    # Récupérer les détails du workflow
    WORKFLOW_JSON=$(curl -s -X GET \
      "$N8N_URL/api/v1/workflows/$ID" \
      -H "Accept: application/json" \
      -H "X-N8N-API-KEY: $N8N_API_TOKEN")
    
    # Extraire le nom du workflow
    WORKFLOW_NAME=$(echo "$WORKFLOW_JSON" | jq -r '.name' | tr -dc '[:alnum:] [:space:]' | tr ' ' '_')
    
    # Nom de fichier unique avec timestamp
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    OUTPUT_FILE="$WORKFLOWS_DIR/${WORKFLOW_NAME}_${ID}_${TIMESTAMP}.json"
    
    # Sauvegarder le workflow
    echo "$WORKFLOW_JSON" > "$OUTPUT_FILE"
    
    if [ "$VERBOSE" = true ]; then
      echo "Workflow API extrait: $WORKFLOW_NAME ($ID) → $OUTPUT_FILE"
    else
      echo "Workflow API extrait: $WORKFLOW_NAME"
    fi
  done
}

# Exécution principale
echo "=== Extraction des workflows n8n ==="
echo "Date: $(date)"

# Extraction des workflows locaux
extract_local_workflows

# Extraction des workflows à partir de l'API si un token est fourni
extract_api_workflows

# Combiner les métadonnées
echo "Création du fichier d'index des workflows..."
WORKFLOWS_COUNT=$(find "$WORKFLOWS_DIR" -name "*.json" | wc -l)
echo "Total des workflows extraits: $WORKFLOWS_COUNT"

# Création d'un index des workflows - Nouveau chemin corrigé
METADATA_FILE="${BASE_DIR}/n8n-workflows-index.json"
echo "{" > "$METADATA_FILE"
echo "  \"extractionDate\": \"$(date -Iseconds)\"," >> "$METADATA_FILE"
echo "  \"totalWorkflows\": $WORKFLOWS_COUNT," >> "$METADATA_FILE"
echo "  \"workflowFiles\": [" >> "$METADATA_FILE"

# Ajouter chaque fichier workflow à l'index
FIRST=true
find "$WORKFLOWS_DIR" -name "*.json" | sort | while read workflow_file; do
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> "$METADATA_FILE"
  fi
  
  RELATIVE_PATH=$(realpath --relative-to="$BASE_DIR" "$workflow_file")
  
  # Extraction sans jq pour éviter les erreurs
  WORKFLOW_NAME=$(basename "$workflow_file" | sed 's/_[0-9]\{14\}.json$//')
  
  echo "    {" >> "$METADATA_FILE"
  echo "      \"name\": \"$WORKFLOW_NAME\"," >> "$METADATA_FILE"
  echo "      \"path\": \"$RELATIVE_PATH\"," >> "$METADATA_FILE"
  echo "      \"lastModified\": \"$(date -r "$workflow_file" -Iseconds)\"" >> "$METADATA_FILE"
  echo -n "    }" >> "$METADATA_FILE"
done

# Fermer le fichier JSON
echo "" >> "$METADATA_FILE"
echo "  ]" >> "$METADATA_FILE"
echo "}" >> "$METADATA_FILE"

echo "Index des workflows créé: $METADATA_FILE"
echo "=== Extraction terminée avec succès ==="