#!/bin/bash
# Script pour nettoyer les doublons d'agents MCP
# Ce script identifie et organise les agents dupliqués dans le projet
# Date: 19 avril 2025
# Mise à jour: 20 avril 2025 - Ajout du mode supervisé (-p)

# Options par défaut
SUPERVISED_MODE=false
DRY_RUN=false

# Analyse des arguments
while getopts "pdh" opt; do
  case ${opt} in
    p )
      SUPERVISED_MODE=true
      echo "🔍 Mode supervisé activé - Les actions seront confirmées individuellement"
      ;;
    d )
      DRY_RUN=true
      echo "🔍 Mode simulation activé - Aucune modification ne sera effectuée"
      ;;
    h )
      echo "Usage: $0 [-p] [-d] [-h]"
      echo "  -p : Mode supervisé (prompt pour chaque action)"
      echo "  -d : Mode simulation (dry run)"
      echo "  -h : Affiche cette aide"
      exit 0
      ;;
    \? )
      echo "Option invalide: -$OPTARG" 1>&2
      echo "Utilisez -h pour voir les options disponibles"
      exit 1
      ;;
  esac
done

echo "🧹 Nettoyage des agents MCP dupliqués..."
echo 

# Répertoire principal de travail
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
# Structure principale des agents (source de vérité)
MCP_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
# Autres dossiers où les agents sont dupliqués
OTHER_AGENTS_DIRS=(
  "${WORKSPACE_ROOT}/agents"
  "${WORKSPACE_ROOT}/cahier-des-charge/agents"
)
# Dossier pour les backups
BACKUP_DIR="${WORKSPACE_ROOT}/backups/agents-duplicates-$(date +%Y%m%d-%H%M%S)"
# Fichier de log
LOG_FILE="${BACKUP_DIR}/cleanup-log.txt"
# Fichier de liste des agents ignorés
SKIPPED_AGENTS_FILE="${BACKUP_DIR}/skipped-agents.txt"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"
touch "$SKIPPED_AGENTS_FILE"

log() {
  local message="$1"
  echo "$message"
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $message" >> "$LOG_FILE"
}

log "📁 Répertoire de sauvegarde créé: $BACKUP_DIR"
log "📝 Fichier de log créé: $LOG_FILE"

# Vérifier que le répertoire principal existe
if [ ! -d "$MCP_AGENTS_DIR" ]; then
  log "❌ Le répertoire principal des agents MCP n'existe pas: $MCP_AGENTS_DIR"
  log "Le nettoyage ne peut pas continuer."
  exit 1
fi

log "✅ Répertoire principal des agents trouvé: $MCP_AGENTS_DIR"

# Fonction pour identifier les agents dans un répertoire
find_agents() {
  local dir="$1"
  local extension="$2"
  
  if [ ! -d "$dir" ]; then
    log "⚠️ Répertoire non trouvé: $dir"
    return
  fi
  
  find "$dir" -type f -name "*.$extension" | sort
}

# Fonction pour obtenir le nom de l'agent à partir d'un chemin
get_agent_name() {
  local file_path="$1"
  local base_name=$(basename "$file_path")
  # Supprime l'extension
  local agent_name="${base_name%.*}"
  # Si c'est index.ts, obtenez le nom du dossier parent
  if [ "$agent_name" = "index" ]; then
    agent_name=$(basename "$(dirname "$file_path")")
  fi
  echo "$agent_name"
}

# Fonction pour demander confirmation en mode supervisé
confirm_action() {
  local action="$1"
  local file_path="$2"
  local agent_name="$3"
  
  if ! $SUPERVISED_MODE; then
    return 0  # Toujours confirmer en mode automatique
  fi
  
  echo
  echo "🤔 Action: $action"
  echo "📄 Fichier: $file_path"
  echo "🤖 Agent: $agent_name"
  echo
  echo "Options:"
  echo "  (o/O) Confirmer cette action"
  echo "  (n/N) Ignorer ce fichier"
  echo "  (t/T) Ignorer tous les fichiers pour cet agent"
  echo "  (q/Q) Quitter le script"
  echo
  
  while true; do
    read -p "Votre choix [o/n/t/q]? " choice
    case "$choice" in
      [Oo]* ) return 0;;  # Confirmer
      [Nn]* ) 
        log "⏩ Action ignorée pour ce fichier: $file_path"
        return 1;;  # Ignorer ce fichier
      [Tt]* )
        echo "$agent_name" >> "$SKIPPED_AGENTS_FILE"
        log "⏩ Agent ignoré complètement: $agent_name"
        return 1;;  # Ignorer cet agent
      [Qq]* )
        log "❌ Script interrompu par l'utilisateur"
        exit 0;;
      * ) echo "Répondez par 'o', 'n', 't' ou 'q'";;
    esac
  done
}

# Fonction pour vérifier si un agent est dans la liste des ignorés
is_agent_skipped() {
  local agent_name="$1"
  grep -q "^$agent_name$" "$SKIPPED_AGENTS_FILE" 2>/dev/null
  return $?
}

# Récupérer tous les agents TypeScript
log "🔍 Recherche des agents TypeScript..."

# 1. Trouver les agents dans le répertoire principal (source de vérité)
main_agents=()
mapfile -t main_ts_files < <(find_agents "$MCP_AGENTS_DIR" "ts")

# Créer un dictionnaire des chemins principaux par nom d'agent
declare -A main_agent_paths
for file_path in "${main_ts_files[@]}"; do
  agent_name=$(get_agent_name "$file_path")
  
  # Si c'est un fichier index.ts, il a priorité
  if [[ "$file_path" == */index.ts ]]; then
    main_agent_paths["$agent_name"]="$file_path"
  # Sinon, ajouter uniquement s'il n'existe pas déjà
  elif [[ ! -v main_agent_paths["$agent_name"] ]]; then
    main_agent_paths["$agent_name"]="$file_path"
  fi
done

log "📊 ${#main_agent_paths[@]} agents principaux identifiés"

# 2. Analyser les doublons potentiels
duplicate_count=0
legacy_count=0
skipped_count=0

# Pour chaque répertoire alternatif
for other_dir in "${OTHER_AGENTS_DIRS[@]}"; do
  log "🔍 Recherche dans: $other_dir"
  
  if [ ! -d "$other_dir" ]; then
    log "⚠️ Répertoire non trouvé, ignoré: $other_dir"
    continue
  fi
  
  # Trouver tous les fichiers TypeScript dans ce répertoire
  mapfile -t other_ts_files < <(find_agents "$other_dir" "ts")
  
  log "  ↪ ${#other_ts_files[@]} fichiers trouvés"
  
  # Analyser chaque fichier pour déterminer s'il est un doublon
  for file_path in "${other_ts_files[@]}"; do
    agent_name=$(get_agent_name "$file_path")
    
    # Vérifier si l'agent est dans la liste des ignorés
    if is_agent_skipped "$agent_name"; then
      log "⏩ Agent ignoré selon la configuration: $agent_name"
      skipped_count=$((skipped_count + 1))
      continue
    fi
    
    # Vérifier si c'est un doublon (si un agent principal avec ce nom existe)
    if [[ -v main_agent_paths["$agent_name"] ]]; then
      main_file="${main_agent_paths["$agent_name"]}"
      
      # Vérifier s'il s'agit d'un fichier de documentation ou de test
      if [[ "$file_path" == */docs/* || "$file_path" == */tests/* ]]; then
        log "📚 Fichier de documentation/test: $file_path"
        continue
      fi
      
      # Vérifier s'il s'agit d'un fichier legacy
      if [[ "$file_path" == */legacy/* ]]; then
        log "📜 Détecté comme version legacy: $file_path"
        
        # Demander confirmation en mode supervisé
        if ! confirm_action "Marquer comme obsolète" "$file_path" "$agent_name"; then
          skipped_count=$((skipped_count + 1))
          continue
        fi
        
        # Créer un dossier pour le chemin de base dans la sauvegarde
        backup_path="$BACKUP_DIR$(dirname "$file_path")"
        mkdir -p "$backup_path"
        
        # Copier le fichier original
        cp "$file_path" "$backup_path/$(basename "$file_path").backup"
        
        # En mode simulation, ne pas modifier le fichier
        if ! $DRY_RUN; then
          # Ajouter une notice en commentaire au début du fichier
          LEGACY_NOTICE="/**
 * ⚠️ VERSION OBSOLÈTE - NE PAS UTILISER
 * 
 * Ce fichier est une ancienne version conservée à des fins d'archivage.
 * La version actuelle se trouve à:
 * $main_file
 * 
 * Date de marquage: $(date +'%Y-%m-%d %H:%M:%S')
 */
"
          sed -i "1s/^/$LEGACY_NOTICE\n/" "$file_path"
        fi
        
        legacy_count=$((legacy_count + 1))
        log "  ↪ Marqué comme obsolète"
        continue
      fi
      
      # C'est un doublon à traiter
      log "🔄 Doublon trouvé: $file_path"
      log "  ↪ Version principale: $main_file"
      
      # Demander confirmation en mode supervisé
      if ! confirm_action "Remplacer par la version principale" "$file_path" "$agent_name"; then
        skipped_count=$((skipped_count + 1))
        continue
      fi
      
      # Créer un dossier pour le chemin de base dans la sauvegarde
      backup_path="$BACKUP_DIR$(dirname "$file_path")"
      mkdir -p "$backup_path"
      
      # Copier le fichier original
      cp "$file_path" "$backup_path/$(basename "$file_path").backup"
      
      # En mode simulation, ne pas modifier le fichier
      if ! $DRY_RUN; then
        # Ajouter une notice en commentaire au début du fichier et remplacer
        DUPLICATE_NOTICE="/**
 * ⚠️ FICHIER DUPLIQUÉ - NE PAS MODIFIER DIRECTEMENT
 * 
 * Ce fichier est un doublon de la version principale qui se trouve à:
 * $main_file
 * 
 * Toutes les modifications doivent être apportées à la version principale.
 * Ce fichier sera remplacé lors des prochaines synchronisations.
 * 
 * Date de synchronisation: $(date +'%Y-%m-%d %H:%M:%S')
 */
"
        # Copier le contenu de la version principale
        cp "$main_file" "$file_path"
        
        # Ajouter la notice au début du fichier
        sed -i "1s/^/$DUPLICATE_NOTICE\n/" "$file_path"
      fi
      
      duplicate_count=$((duplicate_count + 1))
      log "  ↪ Remplacé par la version principale avec notice"
    else
      log "⚠️ Agent sans version principale: $file_path"
    fi
  done
done

# Créer un manifeste des agents
log "📝 Création d'un manifeste des agents..."

# Liste tous les agents principaux
manifest_file="$BACKUP_DIR/agent-manifest.json"

echo "{" > "$manifest_file"
echo "  \"generatedAt\": \"$(date +'%Y-%m-%d %H:%M:%S')\"," >> "$manifest_file"
echo "  \"totalAgents\": ${#main_agent_paths[@]}," >> "$manifest_file"
echo "  \"duplicateAgents\": $duplicate_count," >> "$manifest_file"
echo "  \"legacyAgents\": $legacy_count," >> "$manifest_file"
echo "  \"skippedAgents\": $skipped_count," >> "$manifest_file"
echo "  \"supervisedMode\": $SUPERVISED_MODE," >> "$manifest_file"
echo "  \"dryRun\": $DRY_RUN," >> "$manifest_file"
echo "  \"mainAgents\": {" >> "$manifest_file"

# Ajouter chaque agent principal
i=0
for agent_name in "${!main_agent_paths[@]}"; do
  i=$((i + 1))
  path="${main_agent_paths[$agent_name]}"
  # Déterminer le type d'agent à partir du chemin
  agent_type="unknown"
  if [[ "$path" == */analyzers/* ]]; then
    agent_type="analyzer"
  elif [[ "$path" == */generators/* ]]; then
    agent_type="generator"
  elif [[ "$path" == */validators/* ]]; then
    agent_type="validator"
  elif [[ "$path" == */orchestrators/* ]]; then
    agent_type="orchestrator"
  fi
  
  # Formatter le JSON, ajouter une virgule pour tous sauf le dernier
  if [ $i -lt ${#main_agent_paths[@]} ]; then
    echo "    \"$agent_name\": {" >> "$manifest_file"
    echo "      \"path\": \"$path\"," >> "$manifest_file"
    echo "      \"type\": \"$agent_type\"" >> "$manifest_file"
    echo "    }," >> "$manifest_file"
  else
    echo "    \"$agent_name\": {" >> "$manifest_file"
    echo "      \"path\": \"$path\"," >> "$manifest_file"
    echo "      \"type\": \"$agent_type\"" >> "$manifest_file"
    echo "    }" >> "$manifest_file"
  fi
done

echo "  }" >> "$manifest_file"
echo "}" >> "$manifest_file"

log "✅ Manifeste des agents créé: $manifest_file"

# Créer un script de synchronisation automatique pour l'avenir
SYNC_SCRIPT="$WORKSPACE_ROOT/sync-mcp-agents.sh"

cat > "$SYNC_SCRIPT" << 'EOF'
#!/bin/bash
# Script de synchronisation automatique des agents MCP
# Ce script synchronise les doublons d'agents avec leurs versions principales
# Il préserve les notices de doublon et la structure des fichiers

# Options par défaut
SUPERVISED_MODE=false
DRY_RUN=false

# Analyse des arguments
while getopts "pdh" opt; do
  case ${opt} in
    p )
      SUPERVISED_MODE=true
      echo "🔍 Mode supervisé activé - Les actions seront confirmées individuellement"
      ;;
    d )
      DRY_RUN=true
      echo "🔍 Mode simulation activé - Aucune modification ne sera effectuée"
      ;;
    h )
      echo "Usage: $0 [-p] [-d] [-h]"
      echo "  -p : Mode supervisé (prompt pour chaque action)"
      echo "  -d : Mode simulation (dry run)"
      echo "  -h : Affiche cette aide"
      exit 0
      ;;
    \? )
      echo "Option invalide: -$OPTARG" 1>&2
      echo "Utilisez -h pour voir les options disponibles"
      exit 1
      ;;
  esac
done

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
MANIFEST_FILE="$WORKSPACE_ROOT/agent-manifest.json"
LOG_FILE="$WORKSPACE_ROOT/sync-agents-$(date +%Y%m%d-%H%M%S).log"
SKIPPED_AGENTS_FILE="$WORKSPACE_ROOT/skipped-agents.txt"

echo "🔄 Synchronisation des agents MCP..." | tee -a "$LOG_FILE"
echo "📝 Log: $LOG_FILE"

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "❌ Fichier manifeste non trouvé: $MANIFEST_FILE" | tee -a "$LOG_FILE"
  echo "Exécutez d'abord ./clean-agents-duplicates.sh pour générer le manifeste." | tee -a "$LOG_FILE"
  exit 1
fi

# Créer le fichier des agents ignorés s'il n'existe pas
touch "$SKIPPED_AGENTS_FILE"

# Fonction pour demander confirmation en mode supervisé
confirm_action() {
  local action="$1"
  local file_path="$2"
  local agent_name="$3"
  
  if ! $SUPERVISED_MODE; then
    return 0  # Toujours confirmer en mode automatique
  fi
  
  echo
  echo "🤔 Action: $action"
  echo "📄 Fichier: $file_path"
  echo "🤖 Agent: $agent_name"
  echo
  echo "Options:"
  echo "  (o/O) Confirmer cette action"
  echo "  (n/N) Ignorer ce fichier"
  echo "  (t/T) Ignorer tous les fichiers pour cet agent"
  echo "  (q/Q) Quitter le script"
  echo
  
  while true; do
    read -p "Votre choix [o/n/t/q]? " choice
    case "$choice" in
      [Oo]* ) return 0;;  # Confirmer
      [Nn]* ) 
        echo "⏩ Action ignorée pour ce fichier: $file_path" | tee -a "$LOG_FILE"
        return 1;;  # Ignorer ce fichier
      [Tt]* )
        echo "$agent_name" >> "$SKIPPED_AGENTS_FILE"
        echo "⏩ Agent ignoré complètement: $agent_name" | tee -a "$LOG_FILE"
        return 1;;  # Ignorer cet agent
      [Qq]* )
        echo "❌ Script interrompu par l'utilisateur" | tee -a "$LOG_FILE"
        exit 0;;
      * ) echo "Répondez par 'o', 'n', 't' ou 'q'";;
    esac
  done
}

# Fonction pour vérifier si un agent est dans la liste des ignorés
is_agent_skipped() {
  local agent_name="$1"
  grep -q "^$agent_name$" "$SKIPPED_AGENTS_FILE" 2>/dev/null
  return $?
}

# Trouver tous les fichiers marqués comme doublons
echo "🔍 Recherche des fichiers dupliqués..." | tee -a "$LOG_FILE"

find "$WORKSPACE_ROOT" -type f -name "*.ts" -exec grep -l "FICHIER DUPLIQUÉ" {} \; > /tmp/duplicate-files.txt
COUNT=$(wc -l < /tmp/duplicate-files.txt)

echo "📊 $COUNT fichiers dupliqués trouvés" | tee -a "$LOG_FILE"

# Compteurs
updated=0
skipped=0

# Parcourir chaque fichier dupliqué
while IFS= read -r file_path; do
  # Extraire le nom de l'agent
  agent_name=$(basename "$file_path" .ts)
  if [ "$agent_name" = "index" ]; then
    agent_name=$(basename "$(dirname "$file_path")")
  fi
  
  # Vérifier si l'agent est dans la liste des ignorés
  if is_agent_skipped "$agent_name"; then
    echo "⏩ Agent ignoré selon la configuration: $agent_name" | tee -a "$LOG_FILE"
    skipped=$((skipped + 1))
    continue
  fi
  
  echo "⚙️ Traitement de: $file_path" | tee -a "$LOG_FILE"
  
  # Extraire le chemin de la version principale
  main_file=$(grep -o "version principale qui se trouve à:.*" "$file_path" | head -1 | cut -d':' -f2- | tr -d ' ' | tr -d '\r')
  
  if [ ! -f "$main_file" ]; then
    echo "  ⚠️ Version principale introuvable: $main_file" | tee -a "$LOG_FILE"
    skipped=$((skipped + 1))
    continue
  fi
  
  # Demander confirmation en mode supervisé
  if ! confirm_action "Synchroniser avec la version principale" "$file_path" "$agent_name"; then
    skipped=$((skipped + 1))
    continue
  fi
  
  # En mode simulation, ne pas modifier le fichier
  if ! $DRY_RUN; then
    # Sauvegarder la notice actuelle
    notice=$(grep -A 10 "FICHIER DUPLIQUÉ" "$file_path" | grep -B 10 "Date de synchronisation:" | grep -v "^--$")
    
    # Remplacer le contenu par celui de la version principale
    cp "$main_file" "$file_path"
    
    # Restaurer la notice au début du fichier, en mettant à jour la date
    notice=$(echo "$notice" | sed "s/Date de synchronisation:.*/Date de synchronisation: $(date +'%Y-%m-%d %H:%M:%S')*/")
    sed -i "1s/^/$notice\n/" "$file_path"
  fi
  
  updated=$((updated + 1))
  echo "  ✅ Synchronisé avec succès" | tee -a "$LOG_FILE"
done < /tmp/duplicate-files.txt

rm /tmp/duplicate-files.txt

echo "✅ Synchronisation terminée" | tee -a "$LOG_FILE"
echo "📊 Résumé:" | tee -a "$LOG_FILE"
echo "  - $updated fichiers synchronisés" | tee -a "$LOG_FILE"
echo "  - $skipped fichiers ignorés" | tee -a "$LOG_FILE"
echo "  - Mode supervisé: $SUPERVISED_MODE" | tee -a "$LOG_FILE"
echo "  - Mode simulation: $DRY_RUN" | tee -a "$LOG_FILE"
EOF

chmod +x "$SYNC_SCRIPT"
log "🔄 Script de synchronisation créé: $SYNC_SCRIPT"

# Résumé
log ""
log "📊 Résumé du nettoyage:"
log "  - ${#main_agent_paths[@]} agents principaux identifiés"
log "  - $duplicate_count doublons remplacés par leurs versions principales"
log "  - $legacy_count versions legacy marquées comme obsolètes"
log "  - $skipped_count agents ignorés en mode supervisé"
log "  - Mode supervisé: $SUPERVISED_MODE"
log "  - Mode simulation: $DRY_RUN"
log ""
log "✅ Nettoyage terminé avec succès!"
log "📂 Toutes les versions originales ont été sauvegardées dans: $BACKUP_DIR"
log "📝 Pour synchroniser les agents à l'avenir, utilisez: $SYNC_SCRIPT"
log ""
log "Il est recommandé de vérifier les imports dans votre code pour vous assurer qu'ils pointent vers les bonnes versions des agents."

# Rendre le script exécutable
chmod +x "$0"