#!/bin/bash
# Script pour exécuter les tests unitaires sur tous les agents
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
TEST_RESULTS_DIR="${WORKSPACE_ROOT}/test-results"
SUMMARY_FILE="${TEST_RESULTS_DIR}/summary-$(date +"%Y%m%d-%H%M%S").json"
LOG_FILE="${WORKSPACE_ROOT}/logs/tests-$(date +"%Y%m%d-%H%M%S").log"

# S'assurer que les répertoires existent
mkdir -p "${TEST_RESULTS_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Fonction pour enregistrer les logs
log() {
  local message="$1"
  local level="$2"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  if [ -z "$level" ]; then
    level="INFO"
  fi
  
  echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
  
  case "$level" in
    "INFO") echo -e "${BLUE}${message}${RESET}" ;;
    "SUCCESS") echo -e "${GREEN}${message}${RESET}" ;;
    "WARNING") echo -e "${YELLOW}${message}${RESET}" ;;
    "ERROR") echo -e "${RED}${message}${RESET}" ;;
    *) echo -e "${message}" ;;
  esac
}

# Fonction pour exécuter les tests d'un agent
test_agent() {
  local agent_file="$1"
  local agent_name=$(basename "$agent_file" .ts)
  local test_file="${agent_file%.ts}.spec.ts"
  local result_file="${TEST_RESULTS_DIR}/${agent_name}.json"
  local test_command="npm test -- --testPathPattern=${test_file}"
  
  log "Exécution des tests pour l'agent: ${agent_name}" "INFO"
  
  # Vérifier si le fichier de test existe
  if [ ! -f "$test_file" ]; then
    log "Fichier de test non trouvé: ${test_file}" "WARNING"
    echo "{\"agent\": \"${agent_name}\", \"status\": \"SKIPPED\", \"message\": \"Fichier de test non trouvé\", \"timestamp\": \"$(date -Iseconds)\"}" > "$result_file"
    return 1
  fi
  
  # Exécuter les tests
  local start_time=$(date +%s)
  $test_command > "${TEST_RESULTS_DIR}/${agent_name}.log" 2>&1
  local exit_code=$?
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Analyser les résultats
  if [ $exit_code -eq 0 ]; then
    log "Tests réussis pour l'agent: ${agent_name} (${duration}s)" "SUCCESS"
    echo "{\"agent\": \"${agent_name}\", \"status\": \"PASSED\", \"duration\": ${duration}, \"timestamp\": \"$(date -Iseconds)\"}" > "$result_file"
    return 0
  else
    log "Tests échoués pour l'agent: ${agent_name} (${duration}s)" "ERROR"
    local error_message=$(grep -E "Error|Failed|FAIL" "${TEST_RESULTS_DIR}/${agent_name}.log" | head -1)
    echo "{\"agent\": \"${agent_name}\", \"status\": \"FAILED\", \"duration\": ${duration}, \"error\": \"${error_message}\", \"timestamp\": \"$(date -Iseconds)\"}" > "$result_file"
    return 1
  fi
}

# Fonction pour vérifier l'implémentation des interfaces
check_interface_implementation() {
  local agent_file="$1"
  local agent_name=$(basename "$agent_file" .ts)
  local result_file="${TEST_RESULTS_DIR}/${agent_name}-interface.json"
  
  log "Vérification des interfaces pour l'agent: ${agent_name}" "INFO"
  
  # Liste des interfaces à vérifier
  local interfaces=(
    "BaseAgent"
    "CoordinationAgent"
    "OrchestrationAgent"
  )
  
  local implemented_interfaces=()
  local missing_methods=()
  
  # Vérifier chaque interface
  for interface in "${interfaces[@]}"; do
    # Vérifier si l'agent implémente cette interface
    if grep -q "implements.*${interface}" "$agent_file"; then
      implemented_interfaces+=("$interface")
      
      # Obtenir les méthodes requises pour cette interface
      local required_methods=($(grep -A 20 "interface ${interface}" "${WORKSPACE_ROOT}/src/core/interfaces/"* | grep -o "[a-zA-Z0-9_]\+(" | tr -d '(' | sort -u))
      
      # Vérifier si toutes les méthodes requises sont implémentées
      for method in "${required_methods[@]}"; do
        if ! grep -q "${method}[(:)]" "$agent_file"; then
          missing_methods+=("${interface}.${method}")
        fi
      done
    fi
  done
  
  # Enregistrer les résultats
  if [ ${#missing_methods[@]} -eq 0 ]; then
    log "Toutes les interfaces sont correctement implémentées pour: ${agent_name}" "SUCCESS"
    echo "{\"agent\": \"${agent_name}\", \"interfaces\": [\"$(IFS=\\\", ; echo "${implemented_interfaces[*]}")\"], \"status\": \"COMPLIANT\", \"timestamp\": \"$(date -Iseconds)\"}" > "$result_file"
    return 0
  else
    log "Méthodes manquantes dans l'implémentation des interfaces de: ${agent_name}" "ERROR"
    for missing in "${missing_methods[@]}"; do
      log "  - ${missing}" "ERROR"
    done
    echo "{\"agent\": \"${agent_name}\", \"interfaces\": [\"$(IFS=\\\", ; echo "${implemented_interfaces[*]}")\"], \"status\": \"NON_COMPLIANT\", \"missing\": [\"$(IFS=\\\", ; echo "${missing_methods[*]}")\"], \"timestamp\": \"$(date -Iseconds)\"}" > "$result_file"
    return 1
  fi
}

# Fonction pour générer un rapport de synthèse
generate_summary() {
  local total_agents=0
  local passed_tests=0
  local failed_tests=0
  local skipped_tests=0
  local compliant_interfaces=0
  local non_compliant_interfaces=0
  
  log "Génération du rapport de synthèse" "INFO"
  
  # Analyser les résultats des tests
  for result_file in "${TEST_RESULTS_DIR}"/*.json; do
    if [[ "$result_file" == *-interface.json ]]; then
      # Fichier de résultat pour la vérification d'interface
      if grep -q "\"status\": \"COMPLIANT\"" "$result_file"; then
        ((compliant_interfaces++))
      else
        ((non_compliant_interfaces++))
      fi
    elif [[ "$result_file" != *summary*.json ]]; then
      # Fichier de résultat pour les tests unitaires
      ((total_agents++))
      
      if grep -q "\"status\": \"PASSED\"" "$result_file"; then
        ((passed_tests++))
      elif grep -q "\"status\": \"FAILED\"" "$result_file"; then
        ((failed_tests++))
      elif grep -q "\"status\": \"SKIPPED\"" "$result_file"; then
        ((skipped_tests++))
      fi
    fi
  done
  
  # Générer le fichier de synthèse
  cat > "$SUMMARY_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "tests": {
    "total": ${total_agents},
    "passed": ${passed_tests},
    "failed": ${failed_tests},
    "skipped": ${skipped_tests},
    "success_rate": $(awk "BEGIN { print (${total_agents} > 0 ? ${passed_tests}*100/${total_agents} : 0) }")
  },
  "interfaces": {
    "compliant": ${compliant_interfaces},
    "non_compliant": ${non_compliant_interfaces},
    "compliance_rate": $(awk "BEGIN { print ((${compliant_interfaces}+${non_compliant_interfaces}) > 0 ? ${compliant_interfaces}*100/(${compliant_interfaces}+${non_compliant_interfaces}) : 0) }")
  }
}
EOF
  
  log "Rapport de synthèse généré: ${SUMMARY_FILE}" "SUCCESS"
  
  # Afficher un résumé
  log "\nRésumé des tests:" "INFO"
  log "- Agents testés: ${total_agents}" "INFO"
  log "- Tests réussis: ${passed_tests}" "INFO"
  log "- Tests échoués: ${failed_tests}" "INFO"
  log "- Tests ignorés: ${skipped_tests}" "INFO"
  log "- Taux de réussite: $(awk "BEGIN { print (${total_agents} > 0 ? ${passed_tests}*100/${total_agents} : 0) }")%" "INFO"
  
  log "\nRésumé des interfaces:" "INFO"
  log "- Agents conformes: ${compliant_interfaces}" "INFO"
  log "- Agents non conformes: ${non_compliant_interfaces}" "INFO"
  log "- Taux de conformité: $(awk "BEGIN { print ((${compliant_interfaces}+${non_compliant_interfaces}) > 0 ? ${compliant_interfaces}*100/(${compliant_interfaces}+${non_compliant_interfaces}) : 0) }")%" "INFO"
  
  # Retourner un statut d'échec si des tests ont échoué ou des interfaces sont non conformes
  if [ $failed_tests -gt 0 ] || [ $non_compliant_interfaces -gt 0 ]; then
    return 1
  else
    return 0
  fi
}

# Fonction principale
main() {
  log "Démarrage des tests unitaires sur tous les agents" "INFO"
  
  # Rechercher tous les fichiers d'agent
  local agent_files=($(find "${WORKSPACE_ROOT}" -name "*.ts" -not -name "*.spec.ts" -not -path "*/node_modules/*" -path "*/agents/*"))
  
  log "Nombre d'agents trouvés: ${#agent_files[@]}" "INFO"
  
  # Initialiser les compteurs
  local test_count=0
  local test_passed=0
  local test_failed=0
  local interface_count=0
  local interface_passed=0
  local interface_failed=0
  
  # Traiter chaque agent
  for agent_file in "${agent_files[@]}"; do
    # Vérifier l'implémentation des interfaces
    check_interface_implementation "$agent_file"
    if [ $? -eq 0 ]; then
      ((interface_passed++))
    else
      ((interface_failed++))
    fi
    ((interface_count++))
    
    # Exécuter les tests unitaires
    test_agent "$agent_file"
    if [ $? -eq 0 ]; then
      ((test_passed++))
    else
      ((test_failed++))
    fi
    ((test_count++))
    
    echo ""  # Ligne vide pour séparer les agents
  done
  
  log "Tests terminés" "SUCCESS"
  log "Statistiques des tests:" "INFO"
  log "- Tests exécutés: $test_count" "INFO"
  log "- Tests réussis: $test_passed" "SUCCESS"
  log "- Tests échoués: $test_failed" "INFO" 
  
  log "Statistiques des interfaces:" "INFO"
  log "- Interfaces vérifiées: $interface_count" "INFO"
  log "- Interfaces conformes: $interface_passed" "SUCCESS"
  log "- Interfaces non conformes: $interface_failed" "INFO"
  
  # Générer le rapport de synthèse
  generate_summary
  
  log "Journal des opérations disponible dans: $LOG_FILE" "INFO"
  
  if [ $test_failed -gt 0 ] || [ $interface_failed -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
}

# Exécuter la fonction principale
main