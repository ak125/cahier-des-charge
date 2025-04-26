#!/bin/bash
# Script pour vérifier les statistiques des agents après la migration
# Ce script analyse la structure des agents et génère un rapport précis
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
NEW_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
REPORT_FILE="${WORKSPACE_ROOT}/agent-statistics-report.md"

# Fonction pour compter les agents par type
count_agents_by_type() {
  local type="$1"
  local count=$(find "${NEW_AGENTS_DIR}/${type}" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)
  echo "$count"
}

# Fonction pour rechercher tous les fichiers .ts dans un répertoire
find_ts_files() {
  local dir="$1"
  find "$dir" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts"
}

echo "# Rapport de vérification des statistiques des agents"
echo
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo
echo "## Nombre d'agents par emplacement"
echo

# Compter tous les fichiers .ts dans la nouvelle structure
total_new_structure=$(find_ts_files "$NEW_AGENTS_DIR" | wc -l)
echo "- **Agents dans la nouvelle structure** : $total_new_structure"

# Compter par type d'agent spécifique
analyzers_count=$(count_agents_by_type "analyzers")
validators_count=$(count_agents_by_type "validators")
generators_count=$(count_agents_by_type "generators")
orchestrators_count=$(count_agents_by_type "orchestrators")
misc_count=$(count_agents_by_type "misc")

echo
echo "## Distribution par type d'agent"
echo
echo "- **Analyzers** : $analyzers_count"
echo "- **Validators** : $validators_count"
echo "- **Generators** : $generators_count"
echo "- **Orchestrators** : $orchestrators_count"
echo "- **Misc** : $misc_count"

# Calculer le total des agents par catégorie
total_by_category=$((analyzers_count + validators_count + generators_count + orchestrators_count + misc_count))
echo
echo "**Total par catégorie** : $total_by_category"

# Vérifier les incohérences
echo
if [ $total_new_structure -ne $total_by_category ]; then
  echo "**⚠️ INCOHÉRENCE DÉTECTÉE** : Le nombre total d'agents ($total_new_structure) ne correspond pas à la somme des agents par catégorie ($total_by_category)."
  
  # Analyser les fichiers qui ne sont pas dans les catégories standards
  echo
  echo "## Agents hors catégories standards"
  echo
  
  # Obtenir la liste des fichiers .ts dans la racine et les sous-répertoires non standards
  non_standard_files=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | grep -v "/analyzers/" | grep -v "/validators/" | grep -v "/generators/" | grep -v "/orchestrators/" | grep -v "/misc/")
  
  if [ -n "$non_standard_files" ]; then
    echo "Les agents suivants sont stockés en dehors des catégories standards :"
    echo '```'
    echo "$non_standard_files"
    echo '```'
  else
    echo "Aucun agent stocké en dehors des catégories standards."
  fi
else
  echo "**✅ COHÉRENCE VALIDÉE** : Le nombre total d'agents correspond à la somme des agents par catégorie."
fi

# Vérifier la présence d'interfaces
echo
echo "## Vérification des interfaces"
echo

# Compter les agents implémentant les interfaces standard
base_agent_count=$(grep -l "BaseAgent" $(find_ts_files "$NEW_AGENTS_DIR") | wc -l)
business_agent_count=$(grep -l "BusinessAgent" $(find_ts_files "$NEW_AGENTS_DIR") | wc -l)
analyzer_agent_count=$(grep -l "AnalyzerAgent" $(find_ts_files "$NEW_AGENTS_DIR") | wc -l)
validator_agent_count=$(grep -l "ValidatorAgent" $(find_ts_files "$NEW_AGENTS_DIR") | wc -l)
generator_agent_count=$(grep -l "GeneratorAgent" $(find_ts_files "$NEW_AGENTS_DIR") | wc -l)

echo "- Agents implémentant **BaseAgent** : $base_agent_count"
echo "- Agents implémentant **BusinessAgent** : $business_agent_count"
echo "- Agents implémentant **AnalyzerAgent** : $analyzer_agent_count"
echo "- Agents implémentant **ValidatorAgent** : $validator_agent_count"
echo "- Agents implémentant **GeneratorAgent** : $generator_agent_count"

# Liste des agents qui n'implémentent aucune interface standard
non_interfaced_agents=$(find_ts_files "$NEW_AGENTS_DIR" | xargs grep -L "BaseAgent\|BusinessAgent\|AnalyzerAgent\|ValidatorAgent\|GeneratorAgent")

echo
if [ -n "$non_interfaced_agents" ]; then
  non_interfaced_count=$(echo "$non_interfaced_agents" | wc -l)
  echo "**⚠️ $non_interfaced_count agents n'implémentent aucune interface standard** :"
  echo '```'
  echo "$non_interfaced_agents"
  echo '```'
else
  echo "**✅ Tous les agents implémentent au moins une interface standard.**"
fi

# Conclusion
echo
echo "## Conclusion"
echo
echo "La vérification des statistiques a identifié $total_new_structure agents dans la nouvelle structure, répartis comme suit :"
echo "- $analyzers_count analyzers"
echo "- $validators_count validators"
echo "- $generators_count generators"
echo "- $orchestrators_count orchestrators"
echo "- $misc_count misc"
echo
echo "Ces statistiques diffèrent du rapport de finalisation qui mentionnait 194 agents uniques et 35 agents dans la nouvelle structure."