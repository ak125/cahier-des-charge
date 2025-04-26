#!/bin/bash
# Script pour intégrer les agents orphelins dans la structure principale
# Date: 19 avril 2025

echo "🔍 Intégration des agents orphelins dans la structure principale..."

# Répertoire principal de travail
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
# Structure principale des agents
MCP_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
# Dossier pour les backups
BACKUP_DIR="${WORKSPACE_ROOT}/backups/orphan-agents-$(date +%Y%m%d-%H%M%S)"
# Fichier de log
LOG_FILE="${BACKUP_DIR}/integration-log.txt"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"

log() {
  local message="$1"
  echo "$message"
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $message" >> "$LOG_FILE"
}

log "📁 Répertoire de sauvegarde créé: $BACKUP_DIR"

# Liste des agents orphelins identifiés
ORPHAN_AGENTS=(
  "/workspaces/cahier-des-charge/agents/analysis/dynamic_sql_extractor.ts"
  "/workspaces/cahier-des-charge/agents/analysis/php-discovery-engine.ts"
  "/workspaces/cahier-des-charge/agents/core/BaseAgent.ts"
  "/workspaces/cahier-des-charge/agents/discovery/audit-selector.ts"
  "/workspaces/cahier-des-charge/agents/integration/metrics-service.ts"
  "/workspaces/cahier-des-charge/agents/integration/notification-service.ts"
  "/workspaces/cahier-des-charge/agents/notifier.ts"
  "/workspaces/cahier-des-charge/agents/migration/php-sql-mapper.ts"
  "/workspaces/cahier-des-charge/agents/migration/php-sql-sync-mapper.ts"
  "/workspaces/cahier-des-charge/agents/migration/BusinessAgent.ts"
  "/workspaces/cahier-des-charge/agents/migration/php-to-remix/canonical-sync-agent.ts"
  "/workspaces/cahier-des-charge/agents/migration/inject-to-supabase.ts"
  "/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/classifier.ts"
  "/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/table-classifier.ts"
  "/workspaces/cahier-des-charge/agents/optimization/SupabaseOptimizationTracker.ts"
  "/workspaces/cahier-des-charge/agents/quality/QualityAgent.ts"
  "/workspaces/cahier-des-charge/cahier-des-charge/agents/php-sql-mapper.ts"
  "/workspaces/cahier-des-charge/cahier-des-charge/agents/php-sql-sync-mapper.ts"
  "/workspaces/cahier-des-charge/cahier-des-charge/agents/php-discovery-engine.ts"
  "/workspaces/cahier-des-charge/cahier-des-charge/agents/dynamic_sql_extractor.ts"
)

for orphan in "${ORPHAN_AGENTS[@]}"; do
  if [ ! -f "$orphan" ]; then
    log "⚠️ Agent introuvable: $orphan"
    continue
  fi
  
  # Extraire le nom de base du fichier
  file_name=$(basename "$orphan")
  agent_name="${file_name%.*}"
  
  # Déterminer le type d'agent en fonction du chemin ou du nom
  agent_type="misc"
  if [[ "$orphan" == *"/analysis/"* || "$agent_name" == *"analyzer"* ]]; then
    agent_type="analyzers"
  elif [[ "$orphan" == *"/integration/"* || "$agent_name" == *"service"* ]]; then
    agent_type="integrators"
  elif [[ "$agent_name" == *"generator"* ]]; then
    agent_type="generators"
  elif [[ "$agent_name" == *"validator"* ]]; then
    agent_type="validators"
  elif [[ "$orphan" == *"/core/"* || "$agent_name" == "Base"* ]]; then
    agent_type="core"
  fi
  
  # Créer le répertoire de destination
  target_dir="${MCP_AGENTS_DIR}/business/${agent_type}/${agent_name}"
  mkdir -p "$target_dir"
  
  # Sauvegarder le fichier original
  backup_path="${BACKUP_DIR}$(dirname "$orphan")"
  mkdir -p "$backup_path"
  cp "$orphan" "${backup_path}/$(basename "$orphan").backup"
  
  # Copier vers la nouvelle destination
  target_file="${target_dir}/index.ts"
  
  log "🔄 Intégration de: $orphan"
  log "  ↪ Vers: $target_file"
  
  # Préparer la notice
  INTEGRATION_NOTICE="/**
 * Agent intégré dans la structure principale
 * 
 * Cet agent était précédemment situé à:
 * $orphan
 * 
 * Date d'intégration: $(date +'%Y-%m-%d %H:%M:%S')
 */
"
  
  # Copier et ajouter la notice
  cat "$orphan" > "$target_file"
  sed -i "1s/^/$INTEGRATION_NOTICE\n/" "$target_file"
  
  # Ajouter une notice au fichier original
  MOVED_NOTICE="/**
 * ⚠️ AGENT DÉPLACÉ - NE PAS UTILISER CETTE VERSION
 * 
 * Cet agent a été déplacé et intégré dans la structure principale à:
 * $target_file
 * 
 * Veuillez mettre à jour vos imports pour utiliser la nouvelle version.
 * 
 * Date de déplacement: $(date +'%Y-%m-%d %H:%M:%S')
 */
"
  
  # Appliquer la notice en conservant le contenu original
  original_content=$(cat "$orphan")
  echo -e "${MOVED_NOTICE}\n${original_content}" > "$orphan"
  
  log "  ✅ Agent intégré avec succès"
done

# Générer un fichier de mapping pour aider à mettre à jour les imports
MAPPING_FILE="${WORKSPACE_ROOT}/agent-import-mapping.json"

echo "{" > "$MAPPING_FILE"
echo "  \"generatedAt\": \"$(date +'%Y-%m-%d %H:%M:%S')\"," >> "$MAPPING_FILE"
echo "  \"imports\": {" >> "$MAPPING_FILE"

# Ajouter chaque agent au mapping
i=0
total=${#ORPHAN_AGENTS[@]}
for orphan in "${ORPHAN_AGENTS[@]}"; do
  i=$((i + 1))
  
  if [ -f "$orphan" ]; then
    # Extraire le nom de base du fichier
    file_name=$(basename "$orphan")
    agent_name="${file_name%.*}"
    
    # Déterminer le type d'agent
    agent_type="misc"
    if [[ "$orphan" == *"/analysis/"* || "$agent_name" == *"analyzer"* ]]; then
      agent_type="analyzers"
    elif [[ "$orphan" == *"/integration/"* || "$agent_name" == *"service"* ]]; then
      agent_type="integrators"
    elif [[ "$agent_name" == *"generator"* ]]; then
      agent_type="generators"
    elif [[ "$agent_name" == *"validator"* ]]; then
      agent_type="validators"
    elif [[ "$orphan" == *"/core/"* || "$agent_name" == "Base"* ]]; then
      agent_type="core"
    fi
    
    # Formatter le chemin relatif pour les imports
    relative_old=$(echo "$orphan" | sed "s|^${WORKSPACE_ROOT}/||")
    relative_new="packages/mcp-agents/business/${agent_type}/${agent_name}"
    
    # Ajouter au mapping JSON
    if [ $i -lt $total ]; then
      echo "    \"$relative_old\": \"$relative_new\"," >> "$MAPPING_FILE"
    else
      echo "    \"$relative_old\": \"$relative_new\"" >> "$MAPPING_FILE"
    fi
  fi
done

echo "  }" >> "$MAPPING_FILE"
echo "}" >> "$MAPPING_FILE"

log "📝 Fichier de mapping créé: $MAPPING_FILE"

# Créer un script pour mettre à jour les imports
UPDATE_IMPORTS_SCRIPT="${WORKSPACE_ROOT}/update-agent-imports.sh"

cat > "$UPDATE_IMPORTS_SCRIPT" << 'EOF'
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
EOF

chmod +x "$UPDATE_IMPORTS_SCRIPT"
log "🔄 Script de mise à jour des imports créé: $UPDATE_IMPORTS_SCRIPT"

log "✅ Intégration des agents orphelins terminée avec succès!"
log "📂 Toutes les versions originales ont été sauvegardées dans: $BACKUP_DIR"
log "📝 Pour mettre à jour les imports, utilisez: $UPDATE_IMPORTS_SCRIPT"

chmod +x "$0"