#!/bin/bash
# Script précis pour nettoyer les anciens répertoires d'agents
# Ce script identifie et nettoie les fichiers d'agents qui ont été migrés vers la nouvelle structure
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
NEW_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
LEGACY_DIRS=(
  "${WORKSPACE_ROOT}/legacy/migration-2025-04-18/agents"
  "${WORKSPACE_ROOT}/legacy/migration-2025-04-17/agents"
  "${WORKSPACE_ROOT}/legacy/consolidation-2025-04-17/agents"
  "${WORKSPACE_ROOT}/agents"
)
REPORT_DIR="${WORKSPACE_ROOT}/reports/legacy-cleanup"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="${REPORT_DIR}/cleanup-report-${TIMESTAMP}.md"
BACKUP_DIR="${REPORT_DIR}/backup-${TIMESTAMP}"
TO_DELETE_FILE="${REPORT_DIR}/files-to-delete-${TIMESTAMP}.txt"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Compteurs
TOTAL_FILES=0
MIGRATED_FILES=0
DUPLICATED_FILES=0
UNIQUE_FILES=0
DELETED_FILES=0

# Créer les répertoires nécessaires
mkdir -p "$REPORT_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "${BACKUP_DIR}/duplicate-agents"
mkdir -p "${BACKUP_DIR}/unique-agents"

echo -e "${BLUE}Script de nettoyage précis des anciens répertoires d'agents${RESET}"
echo "============================================================="

# Initialiser le rapport
cat > "$REPORT_FILE" << EOF
# Rapport de nettoyage des anciens répertoires d'agents

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Résumé de l'analyse

EOF

# Fonction pour normaliser un nom d'agent (pour comparaison)
normalize_agent_name() {
  local name="$1"
  # Supprimer l'extension .ts
  name=${name%.ts}
  # Supprimer les préfixes et suffixes courants
  name=${name#agent-}
  name=${name%agent}
  name=${name%-agent}
  name=${name%.worker}
  name=${name%.node}
  # Convertir en minuscules
  echo "$name" | tr '[:upper:]' '[:lower:]' | tr '-' '_'
}

# Fonction pour extraire le nom de la classe d'un agent
extract_class_name() {
  local file_path="$1"
  
  # Essayer de trouver une définition de classe
  local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f2)
  
  if [ -z "$class_name" ]; then
    # Essayer de trouver une exportation par défaut
    class_name=$(grep -o "export default [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f3)
  fi
  
  if [ -z "$class_name" ]; then
    # Utiliser le nom du fichier comme dernier recours
    class_name=$(basename "$file_path" .ts)
  fi
  
  echo "$class_name" | tr '[:upper:]' '[:lower:]'
}

# Fonction pour vérifier si un agent est déjà migré (par nom de fichier ou nom de classe)
is_agent_migrated() {
  local legacy_file="$1"
  local legacy_basename=$(basename "$legacy_file")
  local legacy_norm_name=$(normalize_agent_name "$legacy_basename")
  local legacy_class_name=$(extract_class_name "$legacy_file" | tr '[:upper:]' '[:lower:]')
  
  # Parcourir tous les fichiers dans la nouvelle structure
  find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "index.ts" | grep -v "/core/" | while read -r new_file; do
    local new_basename=$(basename "$new_file")
    local new_norm_name=$(normalize_agent_name "$new_basename")
    local new_class_name=$(extract_class_name "$new_file" | tr '[:upper:]' '[:lower:]')
    
    # Comparer les noms normalisés et les noms de classe
    if [[ "$legacy_norm_name" == "$new_norm_name" ]] || 
       [[ "$legacy_class_name" == "$new_class_name" ]] ||
       [[ "$legacy_basename" == "$new_basename" ]]; then
      # L'agent est migré
      echo "$new_file"
      return 0
    fi
  done
  
  # L'agent n'est pas migré
  return 1
}

# Fonction pour comparer le contenu de deux fichiers
compare_content() {
  local file1="$1"
  local file2="$2"
  
  # Calculer le pourcentage de similarité (lignes identiques / total des lignes)
  local total_lines=$(wc -l < "$file1")
  local diff_lines=$(diff -y --suppress-common-lines "$file1" "$file2" | wc -l)
  local similarity=$(( 100 - (diff_lines * 100 / total_lines) ))
  
  echo $similarity
}

# Fonction pour sauvegarder un fichier avant suppression
backup_file() {
  local file="$1"
  local category="$2" # 'duplicate' ou 'unique'
  
  local rel_path=${file#$WORKSPACE_ROOT/}
  local backup_path="${BACKUP_DIR}/${category}-agents/${rel_path}"
  local backup_dir=$(dirname "$backup_path")
  
  mkdir -p "$backup_dir"
  cp "$file" "$backup_path"
}

# Parcourir tous les anciens répertoires et identifier les fichiers à nettoyer
for legacy_dir in "${LEGACY_DIRS[@]}"; do
  if [ ! -d "$legacy_dir" ]; then
    echo -e "${YELLOW}Répertoire non trouvé: $legacy_dir${RESET}"
    continue
  fi
  
  echo -e "\n${BLUE}Analyse du répertoire: $legacy_dir${RESET}"
  
  # Trouver tous les fichiers TypeScript dans ce répertoire
  find "$legacy_dir" -type f -name "*.ts" | sort | while read -r legacy_file; do
    TOTAL_FILES=$((TOTAL_FILES+1))
    echo -e "Analyse de ${YELLOW}$(basename "$legacy_file")${RESET}..."
    
    # Vérifier si l'agent a été migré
    migrated_to=$(is_agent_migrated "$legacy_file")
    
    if [ -n "$migrated_to" ]; then
      MIGRATED_FILES=$((MIGRATED_FILES+1))
      
      # Comparer le contenu pour déterminer le degré de similarité
      similarity=$(compare_content "$legacy_file" "$migrated_to")
      
      if [ "$similarity" -ge 70 ]; then
        # Agent dupliqué avec une similarité élevée
        echo -e "  ${GREEN}✓ Migré vers $(basename "$migrated_to") (similarité: ${similarity}%)${RESET}"
        DUPLICATED_FILES=$((DUPLICATED_FILES+1))
        
        # Sauvegarder avant marquage pour suppression
        backup_file "$legacy_file" "duplicate"
        
        # Ajouter à la liste des fichiers à supprimer
        echo "$legacy_file" >> "$TO_DELETE_FILE"
        
        # Ajouter au rapport
        cat >> "$REPORT_FILE" << EOF
### Fichier dupliqué: \`${legacy_file#$WORKSPACE_ROOT/}\`
- Migré vers: \`${migrated_to#$WORKSPACE_ROOT/}\`
- Similarité: ${similarity}%
- Action: Marqué pour suppression

EOF
      else
        # Agent migré mais avec des différences significatives
        echo -e "  ${YELLOW}! Migré vers $(basename "$migrated_to") mais avec des différences (similarité: ${similarity}%)${RESET}"
        UNIQUE_FILES=$((UNIQUE_FILES+1))
        
        # Sauvegarder mais ne pas supprimer
        backup_file "$legacy_file" "unique"
        
        # Ajouter au rapport
        cat >> "$REPORT_FILE" << EOF
### Fichier partiellement migré: \`${legacy_file#$WORKSPACE_ROOT/}\`
- Migré vers: \`${migrated_to#$WORKSPACE_ROOT/}\`
- Similarité: ${similarity}%
- Action: Conservé pour vérification manuelle

\`\`\`diff
$(diff -u "$legacy_file" "$migrated_to" | head -15)
...
\`\`\`

EOF
      fi
    else
      # Agent non migré
      echo -e "  ${RED}✗ Non migré${RESET}"
      UNIQUE_FILES=$((UNIQUE_FILES+1))
      
      # Sauvegarder mais ne pas supprimer
      backup_file "$legacy_file" "unique"
      
      # Ajouter au rapport
      cat >> "$REPORT_FILE" << EOF
### Fichier unique: \`${legacy_file#$WORKSPACE_ROOT/}\`
- Statut: Non migré
- Action: Conservé pour vérification manuelle

EOF
    fi
  done
done

# Mettre à jour le rapport avec les statistiques
cat >> "$REPORT_FILE" << EOF
## Statistiques

- Total des fichiers analysés: $TOTAL_FILES
- Fichiers migrés identifiés: $MIGRATED_FILES
- Fichiers dupliqués (similarité ≥ 70%): $DUPLICATED_FILES
- Fichiers uniques ou partiellement migrés: $UNIQUE_FILES

## Actions recommandées

1. **Fichiers dupliqués:** Ces fichiers peuvent être supprimés en toute sécurité car ils ont des équivalents dans la nouvelle structure avec une similarité de contenu élevée.
   - Nombre de fichiers: $DUPLICATED_FILES
   - Liste complète: \`$TO_DELETE_FILE\`

2. **Fichiers uniques ou partiellement migrés:** Ces fichiers nécessitent une vérification manuelle car ils contiennent potentiellement du code unique ou des modifications importantes.
   - Nombre de fichiers: $UNIQUE_FILES
   - Sauvegardés dans: \`$BACKUP_DIR/unique-agents/\`

## Instructions pour le nettoyage

Pour supprimer les fichiers dupliqués en toute sécurité, exécutez:

\`\`\`bash
# Version supervisée (recommandée)
cat $TO_DELETE_FILE | xargs -p rm

# Version automatique
cat $TO_DELETE_FILE | xargs rm
\`\`\`

EOF

echo -e "\n${GREEN}Analyse terminée !${RESET}"
echo -e "Rapport détaillé disponible: ${BLUE}$REPORT_FILE${RESET}"
echo -e "Liste des fichiers à supprimer: ${BLUE}$TO_DELETE_FILE${RESET}"
echo -e "\n${BLUE}Statistiques:${RESET}"
echo -e "- Total des fichiers analysés: ${BLUE}$TOTAL_FILES${RESET}"
echo -e "- Fichiers migrés identifiés: ${GREEN}$MIGRATED_FILES${RESET}"
echo -e "- Fichiers dupliqués (similarité ≥ 70%): ${GREEN}$DUPLICATED_FILES${RESET}"
echo -e "- Fichiers uniques ou partiellement migrés: ${YELLOW}$UNIQUE_FILES${RESET}"

# Si l'utilisateur souhaite exécuter la suppression, décommenter la ligne suivante
# cat "$TO_DELETE_FILE" | xargs -p rm

echo -e "\nPour supprimer les fichiers dupliqués, exécutez: ${YELLOW}cat $TO_DELETE_FILE | xargs -p rm${RESET}"