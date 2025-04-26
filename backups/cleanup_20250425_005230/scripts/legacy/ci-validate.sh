#!/bin/bash

# Script de validation CI pour le pipeline MCP
# Ce script vérifie:
# 1. La validité TypeScript du code
# 2. L'application des règles ESLint
# 3. Le mapping correct des routes
# 4. La conformité des agents MCP
# 5. La validation des fichiers JSON de configuration

set -e
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ERRORS_FOUND=0
WARNINGS_FOUND=0

# Couleurs pour l'affichage dans le terminal
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Fonction pour afficher un message formaté
print_message() {
  local level=$1
  local message=$2
  local color=$GREEN
  
  case "$level" in
    "INFO") color=$BLUE ;;
    "WARNING") color=$YELLOW; WARNINGS_FOUND=$((WARNINGS_FOUND+1)) ;;
    "ERROR") color=$RED; ERRORS_FOUND=$((ERRORS_FOUND+1)) ;;
  esac
  
  echo -e "${color}[$level]${RESET} $message"
}

# Vérification de l'environnement
check_environment() {
  print_message "INFO" "Vérification de l'environnement de développement..."
  
  # Vérifier Node.js
  if ! command -v node &> /dev/null; then
    print_message "ERROR" "Node.js n'est pas installé."
    exit 1
  fi
  
  # Vérifier npm/yarn/pnpm
  if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
  elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
  elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
  else
    print_message "ERROR" "Aucun gestionnaire de paquets (npm, yarn, pnpm) n'a été trouvé."
    exit 1
  fi
  
  print_message "INFO" "Utilisation de $PKG_MANAGER comme gestionnaire de paquets"
}

# Validation TypeScript
validate_typescript() {
  print_message "INFO" "Validation TypeScript..."
  
  if ! $PKG_MANAGER run tsc --noEmit; then
    print_message "ERROR" "Des erreurs TypeScript ont été détectées."
    return 1
  fi
  
  print_message "INFO" "Validation TypeScript réussie"
  return 0
}

# Validation ESLint
validate_eslint() {
  print_message "INFO" "Validation ESLint..."
  
  if ! $PKG_MANAGER run lint; then
    print_message "ERROR" "Des erreurs ESLint ont été détectées."
    return 1
  fi
  
  print_message "INFO" "Validation ESLint réussie"
  return 0
}

# Validation du mapping de routes
validate_routes_mapping() {
  print_message "INFO" "Validation du mapping des routes..."
  
  # Vérifier la présence de fichiers .loader.ts correspondant aux routes .tsx
  cd "${WORKSPACE_DIR}/apps/frontend/app/routes" || {
    print_message "ERROR" "Le répertoire des routes n'a pas été trouvé."
    return 1
  }
  
  ROUTE_ISSUES=0
  
  for route_file in $(find . -name "*.tsx" -not -name "*.loader.ts" -not -name "*.action.ts" -not -name "*.meta.ts"); do
    base_name=$(basename "$route_file" .tsx)
    dir_name=$(dirname "$route_file")
    
    # Vérifier le loader
    if [[ ! -f "${dir_name}/${base_name}.loader.ts" ]]; then
      print_message "WARNING" "Route sans fichier .loader.ts: ${route_file}"
      ROUTE_ISSUES=$((ROUTE_ISSUES+1))
    fi
    
    # Vérifier les actions pour les formulaires
    if grep -q "Form" "$route_file" && [[ ! -f "${dir_name}/${base_name}.action.ts" ]]; then
      print_message "WARNING" "Route avec Form sans fichier .action.ts: ${route_file}"
      ROUTE_ISSUES=$((ROUTE_ISSUES+1))
    fi
  done
  
  if [[ $ROUTE_ISSUES -gt 0 ]]; then
    print_message "WARNING" "${ROUTE_ISSUES} problèmes détectés dans le mapping des routes."
    return 0
  else
    print_message "INFO" "Validation du mapping des routes réussie"
    return 0
  fi
}

# Validation des agents MCP
validate_mcp_agents() {
  print_message "INFO" "Validation des agents MCP..."
  
  # Exécuter l'agent de vérification de santé
  cd "${WORKSPACE_DIR}" || exit 1
  
  if [[ -f "./agents/agent-health-checker.ts" ]]; then
    node -r ts-node/register ./agents/agent-health-checker.ts
    
    # Vérifier le rapport généré
    REPORT_PATH="./audit/agents/health-report.md"
    if [[ -f "$REPORT_PATH" ]]; then
      # Extraction du nombre d'agents en bonne santé vs. total
      HEALTHY_AGENTS=$(grep -o "Agents en bonne santé: [0-9]*" "$REPORT_PATH" | awk '{print $4}')
      TOTAL_AGENTS=$(grep -o "Total des agents: [0-9]*" "$REPORT_PATH" | awk '{print $4}')
      
      if [[ $HEALTHY_AGENTS -lt $TOTAL_AGENTS ]]; then
        print_message "WARNING" "${HEALTHY_AGENTS}/${TOTAL_AGENTS} agents sont en bonne santé."
      else
        print_message "INFO" "Tous les agents (${TOTAL_AGENTS}) sont en bonne santé."
      fi
    else
      print_message "ERROR" "Rapport de santé des agents non généré."
      return 1
    fi
  else
    print_message "ERROR" "L'agent de vérification de santé n'est pas disponible."
    return 1
  fi
  
  print_message "INFO" "Validation des agents MCP terminée"
  return 0
}

# Validation des fichiers JSON
validate_json_files() {
  print_message "INFO" "Validation des fichiers JSON..."
  
  JSON_ISSUES=0
  
  # Liste des fichiers JSON importants à valider
  important_json_files=(
    "status.json"
    "agents/*/manifest.json"
    "examples/input-modules/*.input.json"
  )
  
  for pattern in "${important_json_files[@]}"; do
    for json_file in $(find "${WORKSPACE_DIR}" -path "${WORKSPACE_DIR}/${pattern}" 2>/dev/null); do
      if ! jq empty "$json_file" 2>/dev/null; then
        print_message "ERROR" "Fichier JSON invalide: ${json_file}"
        JSON_ISSUES=$((JSON_ISSUES+1))
      fi
    done
  done
  
  if [[ $JSON_ISSUES -gt 0 ]]; then
    print_message "ERROR" "${JSON_ISSUES} fichiers JSON invalides détectés."
    return 1
  else
    print_message "INFO" "Validation des fichiers JSON réussie"
    return 0
  fi
}

# Mise à jour du badge de conformité
update_badge() {
  print_message "INFO" "Mise à jour du badge de conformité MCP..."
  
  README_PATH="${WORKSPACE_DIR}/README.md"
  
  if [[ ! -f "$README_PATH" ]]; then
    print_message "WARNING" "Fichier README.md non trouvé."
    return 0
  fi
  
  if [[ $ERRORS_FOUND -gt 0 ]]; then
    BADGE="![MCP Pipeline Status](https://img.shields.io/badge/MCP%20Pipeline-❌%20Invalid-red)"
  elif [[ $WARNINGS_FOUND -gt 0 ]]; then
    BADGE="![MCP Pipeline Status](https://img.shields.io/badge/MCP%20Pipeline-⚠️%20Warning-yellow)"
  else
    BADGE="![MCP Pipeline Status](https://img.shields.io/badge/MCP%20Pipeline-✅%20Valid-green)"
  fi
  
  # Remplacer le badge existant ou l'ajouter s'il n'existe pas
  if grep -q "!\[MCP Pipeline Status\]" "$README_PATH"; then
    sed -i "s|!\[MCP Pipeline Status\].*|${BADGE}|" "$README_PATH"
  else
    # Ajouter le badge après le premier titre ou en haut du fichier
    if grep -q "^# " "$README_PATH"; then
      sed -i "0,/^# /{s/^# .*/&\n\n${BADGE}/}" "$README_PATH"
    else
      sed -i "1s/^/${BADGE}\n\n/" "$README_PATH"
    fi
  fi
  
  print_message "INFO" "Badge de conformité MCP mis à jour"
}

# Fonction principale
main() {
  print_message "INFO" "Démarrage de la validation CI du pipeline MCP..."
  
  check_environment
  
  # Exécuter toutes les validations
  validate_typescript
  validate_eslint
  validate_routes_mapping
  validate_mcp_agents
  validate_json_files
  
  # Mettre à jour le badge de conformité
  update_badge
  
  # Rapport final
  echo ""
  echo "==============================="
  echo "RAPPORT DE VALIDATION CI MCP"
  echo "==============================="
  echo ""
  
  if [[ $ERRORS_FOUND -gt 0 ]]; then
    print_message "ERROR" "${ERRORS_FOUND} erreurs détectées"
    echo ""
    print_message "INFO" "La validation CI a échoué. Veuillez corriger les erreurs."
    exit 1
  elif [[ $WARNINGS_FOUND -gt 0 ]]; then
    print_message "WARNING" "${WARNINGS_FOUND} avertissements détectés"
    echo ""
    print_message "INFO" "La validation CI est passée avec des avertissements."
    exit 0
  else
    print_message "INFO" "La validation CI est passée avec succès!"
    exit 0
  fi
}

# Exécuter la fonction principale
main