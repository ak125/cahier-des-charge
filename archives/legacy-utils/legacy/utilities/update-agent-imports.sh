#!/bin/bash
# Script pour mettre à jour les imports des agents
# Utilise le mapping généré lors de l'intégration des agents orphelins

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
MAPPING_FILE="${WORKSPACE_ROOT}/agent-import-mapping.json"
LOG_FILE="${WORKSPACE_ROOT}/update-imports-$(date +%Y%m%d-%H%M%S).log"

echo "🔄 Mise à jour des imports d'agents..." | tee -a "$LOG_FILE"
echo "📝 Log: $LOG_FILE"

if [ ! -f "$MAPPING_FILE" ]; then
  echo "❌ Fichier de mapping non trouvé: $MAPPING_FILE" | tee -a "$LOG_FILE"
  echo "Exécutez d'abord ./integrate-orphan-agents.sh pour générer le mapping." | tee -a "$LOG_FILE"
  exit 1
fi

# Extraire les mappings du fichier JSON
mappings=$(jq -r '.imports | to_entries[] | "\(.key)|\(.value)"' "$MAPPING_FILE")

# Pour chaque fichier TypeScript/JavaScript dans le projet
find "$WORKSPACE_ROOT" -type f -name "*.ts" -o -name "*.js" | while read -r file; do
  # Ignorer les fichiers dans node_modules
  if [[ "$file" == *"node_modules"* ]]; then
    continue
  fi
  
  # Vérifier si le fichier contient des imports à mettre à jour
  needs_update=false
  
  echo "$mappings" | while IFS="|" read -r old_path new_path; do
    if grep -q "$old_path" "$file"; then
      needs_update=true
      echo "⚙️ Mise à jour des imports dans: $file" | tee -a "$LOG_FILE"
      break
    fi
  done
  
  if [ "$needs_update" = true ]; then
    # Sauvegarder le fichier original
    cp "$file" "${file}.bak"
    
    # Mettre à jour chaque import
    while IFS="|" read -r old_path new_path; do
      # Différentes variantes d'imports pour couvrir tous les cas
      sed -i "s|from ['\"].*${old_path}['\"]|from '${new_path}'|g" "$file"
      sed -i "s|from ['\"].*${old_path%.ts}['\"]|from '${new_path}'|g" "$file"
      sed -i "s|import(['\"].*${old_path}['\"])|import('${new_path}')|g" "$file"
      sed -i "s|import(['\"].*${old_path%.ts}['\"])|import('${new_path}')|g" "$file"
      sed -i "s|require(['\"].*${old_path}['\"])|require('${new_path}')|g" "$file"
      sed -i "s|require(['\"].*${old_path%.ts}['\"])|require('${new_path}')|g" "$file"
    done <<< "$mappings"
    
    echo "  ✅ Imports mis à jour" | tee -a "$LOG_FILE"
  fi
done

echo "✅ Mise à jour des imports terminée" | tee -a "$LOG_FILE"
echo "📝 Un backup de chaque fichier modifié a été créé avec l'extension .bak"
