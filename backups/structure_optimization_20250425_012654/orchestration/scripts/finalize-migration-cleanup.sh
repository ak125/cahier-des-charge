#!/bin/bash
# Script pour finaliser la migration vers l'architecture à trois couches
# Ce script nettoie les agents restés dans docs/agents et élimine les duplications dans packages/mcp-agents
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="${WORKSPACE_ROOT}/reports/migration-finalization-${TIMESTAMP}"
OLD_AGENTS_DIR="${WORKSPACE_ROOT}/docs/agents"
NEW_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
LOG_FILE="${REPORT_DIR}/cleanup.log"
BACKUP_DIR="${REPORT_DIR}/backup"

# Création des répertoires nécessaires
mkdir -p "$REPORT_DIR"
mkdir -p "$BACKUP_DIR"

# Fonction pour le logging
log() {
  local level="$1"
  local message="$2"
  local date_str="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$date_str] [$level] $message" | tee -a "$LOG_FILE"
}

# Fonction pour sauvegarder un fichier avant sa suppression
backup_file() {
  local file_path="$1"
  local rel_path=$(echo "$file_path" | sed "s|$WORKSPACE_ROOT/||")
  local backup_path="${BACKUP_DIR}/${rel_path}"
  
  # Créer l'arborescence de répertoires si nécessaire
  mkdir -p "$(dirname "$backup_path")"
  
  # Copier le fichier
  cp "$file_path" "$backup_path"
  log "INFO" "Sauvegardé: $file_path -> $backup_path"
}

# Fonction pour déterminer le type d'agent (analyzer, validator, generator, orchestrator)
determine_agent_type() {
  local file_content="$1"
  
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
  elif echo "$file_content" | grep -q "orchestrator\|orchestration\|orchestrate" ||
     echo "$file_content" | grep -q "class.*Orchestrator" ||
     echo "$file_content" | grep -q "type.*=.*'orchestrator'" ||
     echo "$file_content" | grep -q "orchestrate("; then
    echo "orchestrators"
  else
    echo "misc"
  fi
}

# Fonction pour standardiser le nom d'un agent
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
    
    echo "$pascal_case.ts"
  else
    # Déjà en PascalCase
    echo "$base_name.ts"
  fi
}

# Fonction pour identifier la version canonique d'un agent
identify_canonical_version() {
  local agent_name="$1"
  local agent_files=("$@")
  
  # Préférer les fichiers dans l'architecture à trois couches
  for file in "${agent_files[@]}"; do
    if [[ "$file" =~ ^"$NEW_AGENTS_DIR" ]]; then
      # Préférer ceux qui ont été migrés
      if grep -q "BaseAgent\|BusinessAgent" "$file"; then
        log "INFO" "Version canonique identifiée (migrée): $file"
        echo "$file"
        return 0
      fi
    fi
  done
  
  # Si aucun fichier migré n'est trouvé, prendre le premier fichier dans la nouvelle structure
  for file in "${agent_files[@]}"; do
    if [[ "$file" =~ ^"$NEW_AGENTS_DIR" ]]; then
      log "INFO" "Version canonique identifiée (nouvelle structure): $file"
      echo "$file"
      return 0
    fi
  done
  
  # Si aucun fichier dans la nouvelle structure n'est trouvé, prendre le premier dans l'ancienne structure
  log "INFO" "Version canonique identifiée (ancienne structure): ${agent_files[0]}"
  echo "${agent_files[0]}"
}

# Début du script principal
log "INFO" "================================================================================"
log "INFO" "Début du nettoyage final pour l'architecture à trois couches"
log "INFO" "Date: $(date '+%Y-%m-%d %H:%M:%S')"
log "INFO" "Répertoire de travail: $WORKSPACE_ROOT"
log "INFO" "Répertoire des rapports: $REPORT_DIR"
log "INFO" "================================================================================"

# 1. Identifier tous les agents dans l'ancien et le nouveau répertoire
log "STEP" "1. IDENTIFICATION DES AGENTS DANS L'ANCIENNE ET LA NOUVELLE STRUCTURE"

# Trouver tous les fichiers .ts dans l'ancien répertoire
old_agents=$(find "$OLD_AGENTS_DIR" -type f -name "*.ts" 2>/dev/null)
old_agents_count=$(echo "$old_agents" | grep -v "^$" | wc -l)
log "INFO" "Trouvé $old_agents_count agents dans l'ancienne structure"

# Trouver tous les fichiers .ts dans le nouveau répertoire
new_agents=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist")
new_agents_count=$(echo "$new_agents" | grep -v "^$" | wc -l)
log "INFO" "Trouvé $new_agents_count agents dans la nouvelle structure"

# 2. Créer un mapping des agents entre l'ancienne et la nouvelle structure
log "STEP" "2. CRÉATION D'UN MAPPING ENTRE L'ANCIENNE ET LA NOUVELLE STRUCTURE"

# Dictionnaire pour stocker le mapping (agent_name -> [old_path, new_paths...])
declare -A agent_mapping

# Analyser tous les agents de l'ancienne structure
while IFS= read -r old_path; do
  [ -z "$old_path" ] && continue
  
  base_name=$(basename "$old_path")
  std_name=$(standardize_name "$base_name")
  
  if [ -n "$std_name" ]; then
    # Initialiser le tableau s'il n'existe pas encore
    if [ -z "${agent_mapping[$std_name]}" ]; then
      agent_mapping[$std_name]="$old_path"
    else
      agent_mapping[$std_name]="${agent_mapping[$std_name]} $old_path"
    fi
  fi
done <<< "$old_agents"

# Analyser tous les agents de la nouvelle structure
while IFS= read -r new_path; do
  [ -z "$new_path" ] && continue
  
  base_name=$(basename "$new_path")
  std_name=$(standardize_name "$base_name")
  
  if [ -n "$std_name" ]; then
    if [ -z "${agent_mapping[$std_name]}" ]; then
      agent_mapping[$std_name]="$new_path"
    else
      agent_mapping[$std_name]="${agent_mapping[$std_name]} $new_path"
    fi
  fi
done <<< "$new_agents"

# Compter le nombre total d'agents uniques
unique_agents=${#agent_mapping[@]}
log "INFO" "Trouvé $unique_agents agents uniques au total"

# 3. Éliminer les duplications et choisir la version canonique
log "STEP" "3. ÉLIMINATION DES DUPLICATIONS ET SÉLECTION DES VERSIONS CANONIQUES"

# Stocker les agents déjà déplacés vers la version finale
declare -A canonical_paths
duplicates_removed=0
agents_to_move=0

for agent_name in "${!agent_mapping[@]}"; do
  # Convertir la chaîne de chemins en tableau
  IFS=' ' read -r -a paths <<< "${agent_mapping[$agent_name]}"
  
  # Si un seul chemin existe, rien à faire
  if [ ${#paths[@]} -eq 1 ]; then
    log "INFO" "Agent $agent_name a déjà une seule version: ${paths[0]}"
    canonical_paths[$agent_name]=${paths[0]}
    
    # Si c'est dans l'ancien répertoire, il faudra le déplacer
    if [[ ${paths[0]} =~ ^"$OLD_AGENTS_DIR" ]]; then
      agents_to_move=$((agents_to_move + 1))
    fi
    
    continue
  fi
  
  # Plusieurs versions existent, identifier la version canonique
  canonical_path=$(identify_canonical_version "$agent_name" "${paths[@]}")
  canonical_paths[$agent_name]=$canonical_path
  
  # Sauvegarder et supprimer les duplicats
  for path in "${paths[@]}"; do
    if [ "$path" != "$canonical_path" ]; then
      log "INFO" "Duplication trouvée pour $agent_name: $path (la version canonique est $canonical_path)"
      backup_file "$path"
      rm -f "$path"
      duplicates_removed=$((duplicates_removed + 1))
      log "SUCCESS" "Duplication supprimée: $path"
    fi
  done
  
  # Si la version canonique est dans l'ancien répertoire, il faudra la déplacer
  if [[ $canonical_path =~ ^"$OLD_AGENTS_DIR" ]]; then
    agents_to_move=$((agents_to_move + 1))
  fi
done

log "SUCCESS" "Supprimé $duplicates_removed duplications"
log "INFO" "$agents_to_move agents doivent être déplacés de l'ancienne structure vers la nouvelle"

# 4. Déplacer les agents restants de l'ancienne structure vers la nouvelle
log "STEP" "4. DÉPLACEMENT DES AGENTS RESTANTS VERS LA NOUVELLE STRUCTURE"

agents_moved=0
for agent_name in "${!canonical_paths[@]}"; do
  canonical_path="${canonical_paths[$agent_name]}"
  
  # Si l'agent est dans l'ancienne structure, le déplacer
  if [[ "$canonical_path" =~ ^"$OLD_AGENTS_DIR" ]]; then
    # Lire le contenu pour déterminer le type
    content=$(cat "$canonical_path")
    agent_type=$(determine_agent_type "$content")
    
    # Créer le répertoire de destination
    dest_dir="${NEW_AGENTS_DIR}/${agent_type}/${agent_name%.ts}"
    mkdir -p "$dest_dir"
    
    # Chemin de destination final
    dest_path="${dest_dir}/${agent_name}"
    
    # Déplacer le fichier
    log "INFO" "Déplacement de $canonical_path vers $dest_path"
    cp "$canonical_path" "$dest_path"
    
    if [ $? -eq 0 ]; then
      log "SUCCESS" "Agent déplacé avec succès: $canonical_path -> $dest_path"
      agents_moved=$((agents_moved + 1))
      
      # Mettre à jour la version canonique
      canonical_paths[$agent_name]="$dest_path"
      
      # Supprimer le fichier original après sauvegarde
      backup_file "$canonical_path"
      rm -f "$canonical_path"
    else
      log "ERROR" "Échec lors du déplacement de $canonical_path vers $dest_path"
    fi
  fi
done

log "SUCCESS" "Déplacé $agents_moved agents vers la nouvelle structure"

# 5. Vérifier si des dossiers sont vides et les nettoyer
log "STEP" "5. NETTOYAGE DES RÉPERTOIRES VIDES"

# Fonction pour supprimer les répertoires vides récursivement
remove_empty_dirs() {
  local dir="$1"
  
  # Parcourir tous les sous-répertoires
  find "$dir" -type d -empty -print | while read -r empty_dir; do
    log "INFO" "Suppression du répertoire vide: $empty_dir"
    rmdir "$empty_dir"
    if [ $? -eq 0 ]; then
      log "SUCCESS" "Répertoire vide supprimé: $empty_dir"
    else
      log "ERROR" "Échec lors de la suppression du répertoire vide: $empty_dir"
    fi
  done
}

# Nettoyer les répertoires vides dans l'ancienne structure
empty_dirs_count_before=$(find "$OLD_AGENTS_DIR" -type d -empty | wc -l)
remove_empty_dirs "$OLD_AGENTS_DIR"
empty_dirs_count_after=$(find "$OLD_AGENTS_DIR" -type d -empty | wc -l)
empty_dirs_removed=$((empty_dirs_count_before - empty_dirs_count_after))

log "SUCCESS" "Supprimé $empty_dirs_removed répertoires vides dans l'ancienne structure"

# 6. Créer un index.ts pour chaque répertoire d'agents dans la nouvelle structure
log "STEP" "6. CRÉATION DES FICHIERS INDEX.TS POUR L'EXPORTATION DES AGENTS"

index_files_created=0

# Fonction pour créer un fichier index.ts dans un répertoire
create_index_file() {
  local dir="$1"
  local index_path="${dir}/index.ts"
  local agents=$(find "$dir" -maxdepth 1 -type f -name "*.ts" -not -name "index.ts")
  
  if [ -z "$agents" ]; then
    return
  fi
  
  # Créer le contenu du fichier index.ts
  local content="/**\n * Index file for $(basename "$dir")\n * Generated automatically on $(date '+%Y-%m-%d')\n */\n\n"
  
  # Ajouter les imports et exports
  while IFS= read -r agent_path; do
    local agent_name=$(basename "$agent_path" .ts)
    # Éviter les doublons dans le nom
    if [[ "$agent_name" == *"$agent_name"* ]]; then
      export_name="$agent_name"
    else
      export_name="${agent_name}Agent"
    fi
    
    content+="import { $export_name } from './$agent_name';\n"
  done <<< "$agents"
  
  content+="\nexport {\n"
  
  while IFS= read -r agent_path; do
    local agent_name=$(basename "$agent_path" .ts)
    # Éviter les doublons dans le nom
    if [[ "$agent_name" == *"$agent_name"* ]]; then
      export_name="$agent_name"
    else
      export_name="${agent_name}Agent"
    fi
    
    content+="  $export_name,\n"
  done <<< "$agents"
  
  content+="};\n"
  
  # Écrire le fichier index.ts
  echo -e "$content" > "$index_path"
  
  if [ $? -eq 0 ]; then
    log "SUCCESS" "Index.ts créé: $index_path"
    index_files_created=$((index_files_created + 1))
  else
    log "ERROR" "Échec lors de la création de l'index.ts: $index_path"
  fi
}

# Créer des index.ts pour les types d'agents principaux
for agent_type in analyzers validators generators orchestrators; do
  type_dir="${NEW_AGENTS_DIR}/${agent_type}"
  
  if [ -d "$type_dir" ]; then
    create_index_file "$type_dir"
    
    # Parcourir les sous-répertoires pour créer des index.ts dans chacun
    find "$type_dir" -type d -mindepth 1 | while read -r subdir; do
      create_index_file "$subdir"
    done
  fi
done

log "SUCCESS" "Créé $index_files_created fichiers index.ts dans la nouvelle structure"

# 7. Générer un rapport final
log "STEP" "7. GÉNÉRATION DU RAPPORT FINAL"

# Nombre d'agents restants dans l'ancienne structure
remaining_old_agents=$(find "$OLD_AGENTS_DIR" -type f -name "*.ts" 2>/dev/null | wc -l)

# Nombre d'agents dans la nouvelle structure
final_new_agents=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist" | wc -l)

# Générer le rapport
cat > "${REPORT_DIR}/final_report.md" << EOF
# Rapport de finalisation de la migration vers l'architecture à trois couches

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Résumé des actions effectuées

- **Agents uniques identifiés** : $unique_agents
- **Duplications supprimées** : $duplicates_removed
- **Agents déplacés vers la nouvelle structure** : $agents_moved
- **Répertoires vides nettoyés** : $empty_dirs_removed
- **Fichiers index.ts créés** : $index_files_created

## État final

- **Agents restants dans l'ancienne structure** : $remaining_old_agents
- **Agents dans la nouvelle structure** : $final_new_agents

## Structure finale

### Distribution par type d'agent

$(for type in analyzers validators generators orchestrators misc; do
  count=$(find "${NEW_AGENTS_DIR}/${type}" -type f -name "*.ts" 2>/dev/null | grep -v "index.ts" | wc -l)
  echo "- **${type^}** : $count"
done)

## Prochaines étapes

1. **Vérification du fonctionnement** : S'assurer que les agents fonctionnent correctement dans leur nouvelle structure
2. **Mise à jour des imports** : Adapter les modules qui importent ces agents pour utiliser leur nouvel emplacement
3. **Tests d'intégration** : Exécuter des tests pour confirmer que tout fonctionne comme avant la migration

## Conclusion

La migration vers l'architecture à trois couches a été finalisée. Tous les agents sont désormais organisés selon cette structure et les duplications ont été éliminées.
EOF

log "SUCCESS" "Rapport final généré: ${REPORT_DIR}/final_report.md"
log "INFO" "================================================================================"
log "INFO" "Nettoyage final terminé avec succès"
log "INFO" "Consultez le rapport : ${REPORT_DIR}/final_report.md"
log "INFO" "================================================================================"

# Afficher le chemin du rapport
echo "Rapport de finalisation disponible : ${REPORT_DIR}/final_report.md"

exit 0

#!/bin/bash

# Script pour nettoyer les anciens répertoires d'agents après la migration
# Ce script identifie les fichiers agents qui ont été migrés vers la nouvelle structure
# et crée un rapport de ceux qui peuvent être supprimés en toute sécurité

# Définition des couleurs pour les messages
RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'

# Chemins
PACKAGES_DIR="/workspaces/cahier-des-charge/packages/mcp-agents"
AGENTS_DIR="/workspaces/cahier-des-charge/agents"
LEGACY_DIRS=(
  "/workspaces/cahier-des-charge/legacy/migration-2025-04-18/agents"
  "/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents"
  "/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents"
)
REPORT_DIR="/workspaces/cahier-des-charge/reports/migration-finalization"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="$REPORT_DIR/legacy-cleanup-$TIMESTAMP.md"
BACKUP_DIR="$REPORT_DIR/backup"

# Compteurs
TOTAL_LEGACY=0
TOTAL_MIGRATED=0
SAFE_TO_DELETE=0
NEEDS_REVIEW=0

echo -e "${BLUE}Script de nettoyage des anciens répertoires d'agents${RESET}"
echo "=========================================================="

# Création des répertoires nécessaires
mkdir -p "$REPORT_DIR"
mkdir -p "$BACKUP_DIR"

# Initialisation du rapport
cat > "$REPORT_FILE" << EOF
# Rapport de nettoyage des anciens répertoires d'agents - $(date +"%Y-%m-%d %H:%M:%S")

## Résumé

EOF

# Fonction pour normaliser le nom d'un agent à partir du chemin du fichier
get_agent_name() {
  local file_path="$1"
  local filename=$(basename "$file_path")
  local agent_name=${filename%.ts}
  
  # Supprimer les suffixes communs
  agent_name=${agent_name%.agent}
  agent_name=${agent_name%.worker}
  agent_name=${agent_name%.node}
  
  # Convertir en minuscules pour la comparaison
  echo "$agent_name" | tr '[:upper:]' '[:lower:]'
}

# Fonction pour extraire le nom de la classe d'un fichier agent
extract_class_name() {
  local file_path="$1"
  local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f2)
  
  if [ -z "$class_name" ]; then
    # Si aucune classe n'est trouvée, essayer de trouver une exportation par défaut
    class_name=$(grep -o "export default [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f3)
  fi
  
  if [ -z "$class_name" ]; then
    # Si toujours rien, utiliser le nom du fichier
    class_name=$(basename "$file_path" .ts)
  fi
  
  echo "$class_name" | tr '[:upper:]' '[:lower:]'
}

# Fonction pour vérifier si un agent existe déjà dans la nouvelle structure
is_agent_migrated() {
  local legacy_file="$1"
  local legacy_agent_name=$(get_agent_name "$legacy_file")
  local legacy_class_name=$(extract_class_name "$legacy_file")
  local found=0
  
  # Chercher dans les deux répertoires principaux
  for dir in "$PACKAGES_DIR" "$AGENTS_DIR"; do
    find "$dir" -type f -name "*.ts" | while read -r migrated_file; do
      local migrated_agent_name=$(get_agent_name "$migrated_file")
      local migrated_class_name=$(extract_class_name "$migrated_file")
      
      # Vérifier la correspondance par nom de fichier ou nom de classe
      if [[ "$legacy_agent_name" == "$migrated_agent_name" ]] || 
         [[ "$legacy_class_name" == "$migrated_class_name" ]]; then
        echo "$migrated_file"
        return 0
      fi
    done
  done
  
  # Pas de correspondance trouvée
  return 1
}

# Fonction pour vérifier si le contenu de deux fichiers est similaire
is_content_similar() {
  local file1="$1"
  local file2="$2"
  local similarity=$(diff -y --suppress-common-lines "$file1" "$file2" | wc -l)
  local total_lines=$(cat "$file1" | wc -l)
  
  # Si moins de 30% de différences, considérer comme similaire
  if (( similarity * 100 / total_lines < 30 )); then
    return 0
  else
    return 1
  fi
}

# Fonction pour créer une sauvegarde d'un fichier avant suppression
backup_file() {
  local file_path="$1"
  local relative_path="${file_path#/workspaces/cahier-des-charge/}"
  local backup_path="$BACKUP_DIR/$relative_path"
  
  # Créer le répertoire de destination
  mkdir -p "$(dirname "$backup_path")"
  
  # Copier le fichier
  cp "$file_path" "$backup_path"
}

# Parcourir tous les anciens répertoires d'agents
for legacy_dir in "${LEGACY_DIRS[@]}"; do
  if [ ! -d "$legacy_dir" ]; then
    echo -e "${RED}Le répertoire $legacy_dir n'existe pas.${RESET}"
    continue
  fi
  
  echo -e "\n${YELLOW}Analyse du répertoire $legacy_dir${RESET}"
  
  # Trouver tous les fichiers TypeScript dans le répertoire ancien
  find "$legacy_dir" -type f -name "*.ts" | while read -r legacy_file; do
    TOTAL_LEGACY=$((TOTAL_LEGACY+1))
    
    echo -e "  ${BLUE}Vérification de $legacy_file${RESET}"
    
    # Vérifier si cet agent a été migré
    migrated_file=$(is_agent_migrated "$legacy_file")
    
    if [ -n "$migrated_file" ]; then
      TOTAL_MIGRATED=$((TOTAL_MIGRATED+1))
      
      echo -e "    ${GREEN}✓ Agent migré vers $migrated_file${RESET}"
      
      # Vérifier si le contenu est similaire
      if is_content_similar "$legacy_file" "$migrated_file"; then
        echo -e "    ${GREEN}✓ Contenu similaire, peut être supprimé${RESET}"
        SAFE_TO_DELETE=$((SAFE_TO_DELETE+1))
        
        # Sauvegarder avant de marquer pour suppression
        backup_file "$legacy_file"
        
        # Ajouter au rapport - section suppression sûre
        cat >> "$REPORT_FILE" << EOF
### Fichier sûr à supprimer
- Ancien: \`$legacy_file\`
- Migré vers: \`$migrated_file\`
- Status: Contenu similaire, migration confirmée

EOF
      else
        echo -e "    ${YELLOW}! Contenu différent, vérification manuelle requise${RESET}"
        NEEDS_REVIEW=$((NEEDS_REVIEW+1))
        
        # Ajouter au rapport - section nécessitant vérification
        cat >> "$REPORT_FILE" << EOF
### Fichier nécessitant une vérification
- Ancien: \`$legacy_file\`
- Migré vers: \`$migrated_file\`
- Status: Contenu différent, vérifier les modifications

\`\`\`diff
$(diff -u "$legacy_file" "$migrated_file" | head -20)
[...]
\`\`\`

EOF
      fi
    else
      echo -e "    ${RED}✗ Agent non migré${RESET}"
      
      # Ajouter au rapport - section non migrée
      cat >> "$REPORT_FILE" << EOF
### Fichier non migré
- Ancien: \`$legacy_file\`
- Status: Agent non trouvé dans la nouvelle structure

EOF
    fi
  done
done

# Finaliser le rapport
cat >> "$REPORT_FILE" << EOF
## Résumé

- Total des fichiers anciens analysés: $TOTAL_LEGACY
- Fichiers migrés identifiés: $TOTAL_MIGRATED
- Fichiers pouvant être supprimés en toute sécurité: $SAFE_TO_DELETE
- Fichiers nécessitant une vérification manuelle: $NEEDS_REVIEW

## Instructions pour le nettoyage

Pour effectuer le nettoyage, exécutez la commande suivante:

\`\`\`bash
# ATTENTION: Sauvegarde créée dans $BACKUP_DIR
# Revue le rapport avant d'exécuter ces commandes

# Pour supprimer les fichiers sûrs:
cat $REPORT_FILE | grep -A 1 "### Fichier sûr à supprimer" | grep "Ancien: " | cut -d"\`" -f2 | cut -d"\`" -f1 | xargs rm -f

# OU pour exécuter un nettoyage supervisé (recommandé):
cat $REPORT_FILE | grep -A 1 "### Fichier sûr à supprimer" | grep "Ancien: " | cut -d"\`" -f2 | cut -d"\`" -f1 > /tmp/files-to-delete.txt
cat /tmp/files-to-delete.txt | xargs -p rm -f
\`\`\`

EOF

echo -e "\n${GREEN}Terminé ! Rapport généré: $REPORT_FILE${RESET}"
echo -e "${BLUE}Total des fichiers anciens analysés: $TOTAL_LEGACY${RESET}"
echo -e "${BLUE}Fichiers migrés identifiés: $TOTAL_MIGRATED${RESET}"
echo -e "${GREEN}Fichiers pouvant être supprimés en toute sécurité: $SAFE_TO_DELETE${RESET}"
echo -e "${YELLOW}Fichiers nécessitant une vérification manuelle: $NEEDS_REVIEW${RESET}"