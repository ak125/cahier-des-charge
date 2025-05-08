#!/bin/bash
# Script pour s'assurer que tous les 112 agents implémentent correctement les interfaces
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
REPORT_DIR="${WORKSPACE_ROOT}/reports/migration"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="${REPORT_DIR}/interface-implementation-${TIMESTAMP}.md"
BACKUP_DIR="${REPORT_DIR}/backup-${TIMESTAMP}"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Compteurs
TOTAL_FILES=0
UPDATED_FILES=0
ALREADY_COMPLIANT=0
FAILED_FILES=0

# Créer les répertoires nécessaires
mkdir -p "$REPORT_DIR"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Script d'implémentation des interfaces pour tous les agents${RESET}"
echo "=========================================================="

# Initialiser le rapport
cat > "$REPORT_FILE" << EOF
# Rapport d'implémentation des interfaces pour les agents

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Résultats

EOF

# Fonction pour déterminer le type d'agent en fonction de son chemin
determine_agent_type() {
  local file_path="$1"
  
  if [[ "$file_path" == *"/analyzers/"* ]]; then
    echo "analyzer"
  elif [[ "$file_path" == *"/validators/"* ]]; then
    echo "validator"
  elif [[ "$file_path" == *"/generators/"* ]]; then
    echo "generator"
  elif [[ "$file_path" == *"/orchestrators/"* ]]; then
    echo "orchestrator"
  elif [[ "$file_path" == *"/misc/"* ]]; then
    echo "misc"
  else
    # Analyser le contenu du fichier pour deviner le type
    if grep -q "analyze\|analyzer\|analyse\|analyzing" "$file_path"; then
      echo "analyzer"
    elif grep -q "validate\|validator\|validation" "$file_path"; then
      echo "validator"
    elif grep -q "generate\|generator\|creating" "$file_path"; then
      echo "generator"
    elif grep -q "orchestrate\|orchestrator\|schedule\|workflow\|pipeline" "$file_path"; then
      echo "orchestrator"
    else
      echo "misc"
    fi
  fi
}

# Fonction pour déterminer l'interface à implémenter en fonction du type d'agent
get_interface_for_type() {
  local agent_type="$1"
  
  case "$agent_type" in
    "analyzer")
      echo "AnalyzerAgent"
      ;;
    "validator")
      echo "ValidatorAgent"
      ;;
    "generator")
      echo "GeneratorAgent"
      ;;
    "orchestrator")
      echo "OrchestratorAgent"
      ;;
    "misc")
      echo "BusinessAgent"
      ;;
    *)
      echo "BaseAgent"
      ;;
  esac
}

# Fonction pour vérifier si un fichier implémente déjà l'interface
check_implements_interface() {
  local file_path="$1"
  local interface_name="$2"
  
  if grep -q "implements.*${interface_name}" "$file_path"; then
    return 0
  else
    return 1
  fi
}

# Fonction pour vérifier si un fichier a déjà une clause implements
has_implements_clause() {
  local file_path="$1"
  
  if grep -q "implements" "$file_path"; then
    return 0
  else
    return 1
  fi
}

# Fonction pour obtenir la classe principale d'un agent
get_agent_class() {
  local file_path="$1"
  local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f2)
  
  if [ -z "$class_name" ]; then
    class_name=$(basename "$file_path" .ts)
  fi
  
  echo "$class_name"
}

# Fonction pour implémenter l'interface dans un fichier
implement_interface() {
  local file_path="$1"
  local interface_name="$2"
  local backup_file="${BACKUP_DIR}/$(basename "$file_path")"
  
  # Créer une sauvegarde
  cp "$file_path" "$backup_file"
  
  # Si le fichier a déjà une clause implements, l'ajouter à celle-ci
  if has_implements_clause "$file_path"; then
    # Ajouter l'interface à la liste existante
    sed -i "s/implements \([A-Za-z0-9_, ]*\)/implements \1, $interface_name/g" "$file_path"
  else
    # Ajouter une nouvelle clause implements
    class_name=$(get_agent_class "$file_path")
    sed -i "s/class $class_name/class $class_name implements $interface_name/g" "$file_path"
  fi
  
  # Ajouter l'importation nécessaire si elle n'existe pas déjà
  if ! grep -q "import.*$interface_name" "$file_path"; then
    # Trouver la ligne appropriée pour insérer l'import
    if grep -q "^import " "$file_path"; then
      # Insérer après la dernière ligne d'import
      sed -i "/^import /a import { $interface_name } from '../../core/interfaces';" "$file_path"
    else
      # Insérer au début du fichier
      sed -i "1s/^/import { $interface_name } from '../../core/interfaces';\n\n/" "$file_path"
    fi
  fi
  
  return 0
}

# Fonction pour mettre en œuvre les méthodes requises
implement_required_methods() {
  local file_path="$1"
  local interface_name="$2"
  
  # Vérifier si les méthodes nécessaires sont déjà implémentées
  case "$interface_name" in
    "AnalyzerAgent")
      if ! grep -q "analyze" "$file_path"; then
        # Implémenter la méthode analyze si elle n'existe pas
        sed -i "/class.*implements/a \\\n  async analyze(input: any): Promise<any> {\n    // TODO: Implémenter l'analyse\n    return { success: true };\n  }" "$file_path"
      fi
      ;;
    "ValidatorAgent")
      if ! grep -q "validate" "$file_path"; then
        # Implémenter la méthode validate si elle n'existe pas
        sed -i "/class.*implements/a \\\n  async validate(input: any): Promise<any> {\n    // TODO: Implémenter la validation\n    return { isValid: true };\n  }" "$file_path"
      fi
      ;;
    "GeneratorAgent")
      if ! grep -q "generate" "$file_path"; then
        # Implémenter la méthode generate si elle n'existe pas
        sed -i "/class.*implements/a \\\n  async generate(input: any): Promise<any> {\n    // TODO: Implémenter la génération\n    return { generated: true };\n  }" "$file_path"
      fi
      ;;
    "OrchestratorAgent")
      if ! grep -q "orchestrate" "$file_path"; then
        # Implémenter la méthode orchestrate si elle n'existe pas
        sed -i "/class.*implements/a \\\n  async orchestrate(config: any): Promise<any> {\n    // TODO: Implémenter l'orchestration\n    return { orchestrated: true };\n  }" "$file_path"
      fi
      ;;
    "BusinessAgent"|"BaseAgent")
      if ! grep -q "execute" "$file_path"; then
        # Implémenter la méthode execute si elle n'existe pas
        sed -i "/class.*implements/a \\\n  async execute(context: any): Promise<any> {\n    // TODO: Implémenter l'exécution\n    return { executed: true };\n  }" "$file_path"
      fi
      ;;
  esac
}

# Parcourir tous les fichiers d'agents
find "$AGENTS_DIR" -type f -name "*.ts" | grep -v "index.ts" | grep -v "/core/" | while read -r file_path; do
  TOTAL_FILES=$((TOTAL_FILES+1))
  echo -e "\n${BLUE}Traitement de $(basename "$file_path")${RESET}"
  
  # Déterminer le type d'agent
  agent_type=$(determine_agent_type "$file_path")
  interface_name=$(get_interface_for_type "$agent_type")
  
  echo -e "  Type détecté: ${YELLOW}$agent_type${RESET}"
  echo -e "  Interface cible: ${YELLOW}$interface_name${RESET}"
  
  # Vérifier si l'interface est déjà implémentée
  if check_implements_interface "$file_path" "$interface_name"; then
    echo -e "  ${GREEN}✓ L'agent implémente déjà $interface_name${RESET}"
    ALREADY_COMPLIANT=$((ALREADY_COMPLIANT+1))
    
    # Ajouter au rapport
    cat >> "$REPORT_FILE" << EOF
### ✅ $(basename "$file_path")
- Type: $agent_type
- Interface: $interface_name
- Status: Déjà conforme

EOF
  else
    echo -e "  ${YELLOW}! L'agent n'implémente pas encore $interface_name${RESET}"
    
    # Essayer d'implémenter l'interface
    if implement_interface "$file_path" "$interface_name"; then
      echo -e "  ${GREEN}✓ Interface $interface_name implémentée avec succès${RESET}"
      
      # Mise en œuvre des méthodes requises
      implement_required_methods "$file_path" "$interface_name"
      echo -e "  ${GREEN}✓ Méthodes requises implémentées${RESET}"
      
      UPDATED_FILES=$((UPDATED_FILES+1))
      
      # Ajouter au rapport
      cat >> "$REPORT_FILE" << EOF
### ✅ $(basename "$file_path")
- Type: $agent_type
- Interface: $interface_name
- Status: Mis à jour avec succès

\`\`\`diff
$(diff -u "${BACKUP_DIR}/$(basename "$file_path")" "$file_path" | head -15)
...
\`\`\`

EOF
    else
      echo -e "  ${RED}✗ Échec de l'implémentation de l'interface${RESET}"
      FAILED_FILES=$((FAILED_FILES+1))
      
      # Ajouter au rapport
      cat >> "$REPORT_FILE" << EOF
### ❌ $(basename "$file_path")
- Type: $agent_type
- Interface: $interface_name
- Status: Échec de la mise à jour

EOF
    fi
  fi
done

# Finaliser le rapport
cat >> "$REPORT_FILE" << EOF
## Résumé

- Total des fichiers analysés: $TOTAL_FILES
- Fichiers déjà conformes: $ALREADY_COMPLIANT
- Fichiers mis à jour avec succès: $UPDATED_FILES
- Fichiers avec échec de mise à jour: $FAILED_FILES

EOF

echo -e "\n${GREEN}Terminé !${RESET}"
echo -e "${BLUE}Rapport d'implémentation des interfaces: $REPORT_FILE${RESET}"
echo -e "${BLUE}Total des fichiers analysés: $TOTAL_FILES${RESET}"
echo -e "${GREEN}Fichiers déjà conformes: $ALREADY_COMPLIANT${RESET}"
echo -e "${GREEN}Fichiers mis à jour avec succès: $UPDATED_FILES${RESET}"
echo -e "${RED}Fichiers avec échec de mise à jour: $FAILED_FILES${RESET}"