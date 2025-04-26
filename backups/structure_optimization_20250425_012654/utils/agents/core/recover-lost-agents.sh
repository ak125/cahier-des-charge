#!/bin/bash
# Script pour récupérer les agents uniques perdus pendant la migration
# Ce script identifie les agents qui n'ont pas été migrés correctement
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
NEW_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
BACKUP_DIR="${WORKSPACE_ROOT}/reports/lost-agents-recovery-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${BACKUP_DIR}/recovery.log"

# Répertoires non standard où des agents peuvent exister
NON_STANDARD_DIRS=(
  "${WORKSPACE_ROOT}/agents"
  "${WORKSPACE_ROOT}/src/agents"
  "${WORKSPACE_ROOT}/workers"
  "${WORKSPACE_ROOT}/services"
  "${WORKSPACE_ROOT}/src/workers"
  "${WORKSPACE_ROOT}/src/services"
)

# Créer les répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "${BACKUP_DIR}/recovered_files"

# Fonction pour le logging
log() {
  local level="$1"
  local message="$2"
  local date_str="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$date_str] [$level] $message" | tee -a "$LOG_FILE"
}

# Fonction pour déterminer le type d'agent (analyzer, validator, generator, orchestrator)
determine_agent_type() {
  local file_path="$1"
  local file_content=$(cat "$file_path")
  
  if echo "$file_content" | grep -q "analyzer\|analyse\|analysis\|analyser" ||
     echo "$file_content" | grep -q "class.*Analyzer" ||
     echo "$file_content" | grep -q "type.*=.*'analyzer'" ||
     echo "$file_content" | grep -q "analyze("; then
    echo "analyzers"
  elif echo "$file_content" | grep -q "validator\|validation\|validate" ||
     echo "$file_content" | grep -q "class.*Validator" ||
     echo "$file_content" | grep -q "type.*=.*'validator'" ||
     echo "$file_content" | grep -q "validate("; then
    echo "validators"
  elif echo "$file_content" | grep -q "generator\|generate" ||
     echo "$file_content" | grep -q "class.*Generator" ||
     echo "$file_content" | grep -q "type.*=.*'generator'" ||
     echo "$file_content" | grep -q "generate("; then
    echo "generators"
  elif echo "$file_content" | grep -q "orchestrator\|orchestration\|orchestrate\|worker" ||
     echo "$file_content" | grep -q "class.*Orchestrator" ||
     echo "$file_content" | grep -q "type.*=.*'orchestrator'" ||
     echo "$file_content" | grep -q "orchestrate("; then
    echo "orchestrators"
  else
    echo "misc"
  fi
}

# Fonction pour standardiser le nom de l'agent
standardize_name() {
  local file_name="$1"
  local base_name=$(basename "$file_name" .ts)
  
  # Convertir de kebab-case à PascalCase
  if [[ "$base_name" =~ ^[a-z0-9-]+ ]]; then
    # Remplacer les tirets par des espaces, mettre en majuscule chaque mot, puis supprimer les espaces
    local pascal_case=$(echo "$base_name" | sed -r 's/(^|-)([a-z])/\U\2/g' | sed 's/-//g')
    
    # Ajouter "Agent" à la fin si ce n'est pas déjà présent
    if ! [[ "$pascal_case" =~ Agent$ ]]; then
      pascal_case="${pascal_case}Agent"
    fi
    
    echo "$pascal_case"
  else
    # Déjà en PascalCase
    echo "$base_name"
  fi
}

# Fonction pour vérifier si un agent existe déjà dans la nouvelle structure
agent_exists_in_new_structure() {
  local agent_name="$1"
  local count=$(find "$NEW_AGENTS_DIR" -name "${agent_name}.ts" | wc -l)
  
  if [ $count -gt 0 ]; then
    return 0  # true
  else
    return 1  # false
  fi
}

# Fonction pour récupérer un agent perdu
recover_agent() {
  local file_path="$1"
  local agent_name=$(standardize_name "$file_path")
  local file_name="${agent_name}.ts"
  
  # Vérifier si l'agent existe déjà dans la nouvelle structure
  if agent_exists_in_new_structure "$agent_name"; then
    log "INFO" "L'agent $agent_name existe déjà dans la nouvelle structure, ignoré."
    return 0
  fi
  
  # Déterminer le type d'agent
  local agent_type=$(determine_agent_type "$file_path")
  
  # Créer le répertoire de destination
  local dest_dir="${NEW_AGENTS_DIR}/${agent_type}/${agent_name}"
  mkdir -p "$dest_dir"
  
  # Chemin de destination final
  local dest_path="${dest_dir}/${file_name}"
  
  # Copier le fichier
  cp "$file_path" "$dest_path"
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "Agent récupéré: $file_path -> $dest_path"
    
    # Sauvegarder une copie
    local backup_path="${BACKUP_DIR}/recovered_files/$(basename "$file_path")"
    cp "$file_path" "$backup_path"
    
    return 0
  else
    log "ERROR" "Échec lors de la récupération de l'agent: $file_path"
    return 1
  fi
}

# Début du script
log "INFO" "============================================================="
log "INFO" "Début de la récupération des agents perdus"
log "INFO" "Date: $(date '+%Y-%m-%d %H:%M:%S')"
log "INFO" "Répertoire de travail: $WORKSPACE_ROOT"
log "INFO" "============================================================="

# Statistiques avant récupération
total_before=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)
log "INFO" "Nombre d'agents avant récupération: $total_before"

# Parcourir les répertoires non standard
recovered_count=0

for dir in "${NON_STANDARD_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    log "INFO" "Recherche d'agents dans $dir"
    
    # Trouver tous les fichiers .ts qui pourraient être des agents
    agent_files=$(find "$dir" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist")
    
    for file in $agent_files; do
      # Vérifier si le fichier contient des mots-clés d'agent
      if grep -q "Agent\|agent\|mcp\|analyze\|validate\|generate\|orchestrate" "$file"; then
        log "INFO" "Fichier potentiel d'agent trouvé: $file"
        
        # Tenter de récupérer l'agent
        recover_agent "$file"
        if [ $? -eq 0 ]; then
          recovered_count=$((recovered_count + 1))
        fi
      fi
    done
  else
    log "INFO" "Le répertoire $dir n'existe pas, ignoré."
  fi
done

# Statistiques après récupération
total_after=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)
log "INFO" "Nombre d'agents après récupération: $total_after"
log "SUCCESS" "$recovered_count agents récupérés"

# Générer le rapport
cat > "${BACKUP_DIR}/recovery_report.md" << EOF
# Rapport de récupération des agents perdus

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Résumé des actions effectuées

- **Agents avant récupération** : $total_before
- **Agents récupérés** : $recovered_count
- **Agents après récupération** : $total_after

## Agents récupérés

$(for file in "${BACKUP_DIR}/recovered_files/"*; do
  if [ -f "$file" ]; then
    echo "- **$(basename "$file")** : Agent récupéré"
  fi
done)

## Conclusion

Le processus de récupération a identifié et intégré $recovered_count agents qui avaient été perdus lors de la migration précédente.
Ces agents sont maintenant correctement intégrés dans la nouvelle structure à trois couches.
EOF

log "INFO" "============================================================="
log "INFO" "Récupération terminée"
log "INFO" "Consultez le rapport : ${BACKUP_DIR}/recovery_report.md"
log "INFO" "============================================================="

echo "Rapport de récupération disponible : ${BACKUP_DIR}/recovery_report.md"

exit 0