#!/bin/bash
# filepath: /workspaces/cahier-des-charge/scripts/workflow-cleanup.sh

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   SCRIPT DE NETTOYAGE DES WORKFLOWS AUTOMATISÉS      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Création des dossiers nécessaires
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/workflows_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
REPORT_DIR="/workspaces/cahier-des-charge/documentation/workflows"

mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORT_DIR}"

# Fichier log
LOG_FILE="${LOG_DIR}/workflow_cleanup_${TIMESTAMP}.log"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour sauvegarder les fichiers de workflow
backup_workflows() {
  log "${YELLOW}Création de sauvegardes des workflows...${NC}"

  # GitHub workflows
  if [ -d "/.github/workflows" ]; then
    mkdir -p "${BACKUP_DIR}/.github"
    cp -r "/.github/workflows" "${BACKUP_DIR}/.github/"
    log "Sauvegarde des GitHub workflows effectuée"
  fi

  # CI workflows
  if [ -d "/workspaces/cahier-des-charge/ci" ]; then
    mkdir -p "${BACKUP_DIR}/ci"
    cp -r "/workspaces/cahier-des-charge/ci" "${BACKUP_DIR}/"
    log "Sauvegarde des CI workflows effectuée"
  fi

  # Docker compose files
  if [ -d "/workspaces/cahier-des-charge/orchestration/docker" ]; then
    mkdir -p "${BACKUP_DIR}/orchestration/docker"
    cp -r "/workspaces/cahier-des-charge/orchestration/docker" "${BACKUP_DIR}/orchestration/"
    log "Sauvegarde des fichiers docker-compose effectuée"
  fi

  # Workflows directory
  if [ -d "/workspaces/cahier-des-charge/workflows" ]; then
    mkdir -p "${BACKUP_DIR}/workflows"
    cp -r "/workspaces/cahier-des-charge/workflows" "${BACKUP_DIR}/"
    log "Sauvegarde du dossier workflows effectuée"
  fi

  log "${GREEN}✅ Sauvegarde des workflows terminée dans ${BACKUP_DIR}${NC}"
}

# Fonction pour désactiver les GitHub Actions workflows
disable_github_workflows() {
  log "${YELLOW}Désactivation des GitHub Actions workflows...${NC}"

  if [ -d "/workspaces/cahier-des-charge/.github/workflows" ]; then
    find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml" -o -name "*.yaml" | while read -r file; do
      log "Désactivation de ${file}"
      mv "${file}" "${file}.disabled"
    done
    log "${GREEN}✅ GitHub Actions workflows désactivés${NC}"
  else
    log "${YELLOW}Aucun dossier .github/workflows trouvé${NC}"
  fi
}

# Fonction pour créer un inventaire des workflows CI/CD
create_workflow_inventory() {
  log "${YELLOW}Création d'un inventaire des workflows CI/CD...${NC}"

  # Fichier d'inventaire
  INVENTORY_FILE="${REPORT_DIR}/workflow-inventory.md"

  # Entête du fichier d'inventaire
  {
    echo "# Inventaire des Workflows CI/CD"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## GitHub Actions Workflows"
    echo ""
  } > "${INVENTORY_FILE}"

  # Liste des workflows GitHub Actions
  if [ -d "/workspaces/cahier-des-charge/.github/workflows" ]; then
    {
      echo "| Nom | État | Description |"
      echo "|-----|------|-------------|"
    } >> "${INVENTORY_FILE}"

    find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml*" -o -name "*.yaml*" | sort | while read -r file; do
      filename=$(basename "${file}")
      status=$(echo "${file}" | grep -q "\.disabled$" && echo "❌ Désactivé" || echo "✅ Actif")
      
      # Correction: gestion des caractères spéciaux dans les descriptions
      description=$(grep -A 5 "name:" "${file}" 2>/dev/null | head -n 1 | sed 's/name://g' | tr -d "'" | tr -d '"' | xargs)
      if [ -z "${description}" ]; then
        description="*(Pas de description)*"
      fi
      echo "| \`${filename}\` | ${status} | ${description} |" >> "${INVENTORY_FILE}"
    done
    echo "" >> "${INVENTORY_FILE}"
  else
    echo "*(Aucun workflow GitHub Actions trouvé)*" >> "${INVENTORY_FILE}"
    echo "" >> "${INVENTORY_FILE}"
  fi

  # CI workflows
  {
    echo "## Workflows CI"
    echo ""
  } >> "${INVENTORY_FILE}"

  if [ -d "/workspaces/cahier-des-charge/ci" ]; then
    {
      echo "| Nom | Chemin | Type |"
      echo "|-----|--------|------|"
    } >> "${INVENTORY_FILE}"

    find "/workspaces/cahier-des-charge/ci" -name "*.yml" -o -name "*.yaml" | sort | while read -r file; do
      filename=$(basename "${file}")
      filepath=$(echo "${file}" | sed "s|/workspaces/cahier-des-charge/||g")
      type=$(echo "${filename}" | grep -q "verifier" && echo "Vérification" || (echo "${filename}" | grep -q "analyzer" && echo "Analyse" || echo "CI/CD"))
      echo "| \`${filename}\` | ${filepath} | ${type} |" >> "${INVENTORY_FILE}"
    done
    echo "" >> "${INVENTORY_FILE}"
  else
    echo "*(Aucun workflow CI trouvé)*" >> "${INVENTORY_FILE}"
    echo "" >> "${INVENTORY_FILE}"
  fi

  # Docker compose files
  {
    echo "## Orchestration Docker"
    echo ""
  } >> "${INVENTORY_FILE}"

  if [ -d "/workspaces/cahier-des-charge/orchestration/docker" ]; then
    {
      echo "| Nom | Services inclus |"
      echo "|-----|----------------|"
    } >> "${INVENTORY_FILE}"

    find "/workspaces/cahier-des-charge/orchestration/docker" -name "docker-compose*.yml" | sort | while read -r file; do
      filename=$(basename "${file}")
      # Correction: gestion des caractères spéciaux
      services=$(grep -A 1 "services:" "${file}" 2>/dev/null | grep -v "services:" | grep -v "\-\-" | tr -d "'" | tr -d '"' | xargs)
      if [ -z "${services}" ]; then
        services="*(Non détecté)*"
      fi
      echo "| \`${filename}\` | ${services} |" >> "${INVENTORY_FILE}"
    done
    echo "" >> "${INVENTORY_FILE}"
  else
    echo "*(Aucun fichier Docker Compose trouvé)*" >> "${INVENTORY_FILE}"
    echo "" >> "${INVENTORY_FILE}"
  fi

  # Workflows directory
  {
    echo "## Autres Workflows"
    echo ""
  } >> "${INVENTORY_FILE}"

  if [ -d "/workspaces/cahier-des-charge/workflows" ]; then
    {
      echo "| Nom | Chemin |"
      echo "|-----|--------|"
    } >> "${INVENTORY_FILE}"

    find "/workspaces/cahier-des-charge/workflows" -type f | grep -v "node_modules" | sort | while read -r file; do
      filename=$(basename "${file}")
      filepath=$(echo "${file}" | sed "s|/workspaces/cahier-des-charge/||g")
      echo "| \`${filename}\` | ${filepath} |" >> "${INVENTORY_FILE}"
    done
  else
    echo "*(Aucun fichier dans le dossier workflows trouvé)*" >> "${INVENTORY_FILE}"
  fi

  log "${GREEN}✅ Inventaire des workflows terminé dans ${INVENTORY_FILE}${NC}"
}

# Fonction pour analyser les dépendances entre workflows
analyze_workflow_dependencies() {
  log "${YELLOW}Analyse des dépendances entre workflows...${NC}"
  
  # Fichier de rapport
  DEPENDENCIES_FILE="${REPORT_DIR}/workflow-dependencies.md"
  
  {
    echo "# Dépendances entre Workflows"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Workflows GitHub Actions qui déclenchent d'autres workflows"
    echo ""
  } > "${DEPENDENCIES_FILE}"
  
  # Recherche des liens entre GitHub Actions workflows
  if [ -d "/workspaces/cahier-des-charge/.github/workflows" ]; then
    {
      echo "| Workflow | Workflows déclenchés | Type de déclenchement |"
      echo "|----------|---------------------|----------------------|"
    } >> "${DEPENDENCIES_FILE}"
    
    find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml*" -o -name "*.yaml*" | while read -r file; do
      filename=$(basename "${file}")
      # Correction: gestion des caractères spéciaux
      triggers=$(grep -E "workflow_dispatch:|workflow_call:|repository_dispatch:" "${file}" 2>/dev/null | tr -d "'" | tr -d '"' | xargs)
      if [ -n "${triggers}" ]; then
        # Correction: gestion des caractères spéciaux
        called_workflows=$(grep -A 5 -E "uses: .+/.github/workflows" "${file}" 2>/dev/null | grep "uses:" | sed 's/.*uses: //g' | tr -d "'" | tr -d '"' | xargs)
        if [ -n "${called_workflows}" ]; then
          echo "| \`${filename}\` | ${called_workflows} | ${triggers} |" >> "${DEPENDENCIES_FILE}"
        else
          echo "| \`${filename}\` | *(Aucun)* | ${triggers} |" >> "${DEPENDENCIES_FILE}"
        fi
      fi
    done
    echo "" >> "${DEPENDENCIES_FILE}"
  else
    echo "*(Aucun workflow GitHub Actions trouvé)*" >> "${DEPENDENCIES_FILE}"
    echo "" >> "${DEPENDENCIES_FILE}"
  fi
  
  # Relation avec CI workflows
  {
    echo "## Relation entre GitHub Actions et CI workflows"
    echo ""
  } >> "${DEPENDENCIES_FILE}"
  
  if [ -d "/workspaces/cahier-des-charge/.github/workflows" ] && [ -d "/workspaces/cahier-des-charge/ci" ]; then
    {
      echo "| GitHub Action | CI workflow associé |"
      echo "|--------------|-------------------|"
    } >> "${DEPENDENCIES_FILE}"
    
    for ci_file in $(find "/workspaces/cahier-des-charge/ci" -name "*.yml" -o -name "*.yaml"); do
      ci_name=$(basename "${ci_file}" | sed 's/\.yml$//' | sed 's/\.yaml$//')
      for gh_file in $(find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml*" -o -name "*.yaml*"); do
        if grep -q "${ci_name}" "${gh_file}" 2>/dev/null; then
          gh_name=$(basename "${gh_file}")
          echo "| \`${gh_name}\` | \`$(basename "${ci_file}")\` |" >> "${DEPENDENCIES_FILE}"
        fi
      done
    done
  else
    echo "*(Impossible d'analyser les relations entre GitHub Actions et CI workflows)*" >> "${DEPENDENCIES_FILE}"
  fi
  
  log "${GREEN}✅ Analyse des dépendances terminée dans ${DEPENDENCIES_FILE}${NC}"
}

# Fonction pour documenter les workflows
document_workflows() {
  log "${YELLOW}Génération de documentation pour les workflows...${NC}"
  
  # Fichier de documentation
  DOCUMENTATION_FILE="${REPORT_DIR}/workflows-documentation.md"
  
  {
    echo "# Documentation des Workflows"
    echo ""
    echo "Document généré le $(date)"
    echo ""
  } > "${DOCUMENTATION_FILE}"
  
  # Documentation des GitHub Actions workflows
  {
    echo "## GitHub Actions Workflows"
    echo ""
  } >> "${DOCUMENTATION_FILE}"
  
  if [ -d "/workspaces/cahier-des-charge/.github/workflows" ]; then
    for file in $(find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml*" -o -name "*.yaml*" | sort); do
      filename=$(basename "${file}")
      status=$(echo "${file}" | grep -q "\.disabled$" && echo "**DÉSACTIVÉ**" || echo "Actif")
      
      {
        echo "### ${filename} (${status})"
        echo ""
        echo "**Chemin:** \`${file}\`"
        echo ""
        echo "**Description:**"
      } >> "${DOCUMENTATION_FILE}"
      
      # Correction: gestion des caractères spéciaux
      description=$(grep -A 1 "name:" "${file}" 2>/dev/null | tail -n 1 | sed 's/^[ \t]*//' | tr -d "'" | tr -d '"')
      if [ -n "${description}" ]; then
        echo "${description}" >> "${DOCUMENTATION_FILE}"
      else
        echo "*(Pas de description)*" >> "${DOCUMENTATION_FILE}"
      fi
      
      echo "" >> "${DOCUMENTATION_FILE}"
      echo "**Déclencheurs:**" >> "${DOCUMENTATION_FILE}"
      
      # Correction: redirection des erreurs
      grep -A 5 "^on:" "${file}" 2>/dev/null | grep -v "^#" | head -n 6 >> "${DOCUMENTATION_FILE}" || echo "*(Déclencheurs non détectés)*" >> "${DOCUMENTATION_FILE}"
      
      echo "" >> "${DOCUMENTATION_FILE}"
      echo "**Jobs:**" >> "${DOCUMENTATION_FILE}"
      
      # Correction: gestion des caractères spéciaux et redirection des erreurs
      jobs=$(grep "^  [a-zA-Z0-9_-]*:" "${file}" 2>/dev/null | sed 's/://' | tr -d "'" | tr -d '"' | xargs)
      if [ -n "${jobs}" ]; then
        for job in ${jobs}; do
          echo "- ${job}" >> "${DOCUMENTATION_FILE}"
        done
      else
        echo "*(Pas de jobs détectés)*" >> "${DOCUMENTATION_FILE}"
      fi
      echo "" >> "${DOCUMENTATION_FILE}"
    done
  else
    echo "*(Aucun workflow GitHub Actions trouvé)*" >> "${DOCUMENTATION_FILE}"
    echo "" >> "${DOCUMENTATION_FILE}"
  fi
  
  # Documentation des fichiers Docker Compose
  {
    echo "## Orchestration Docker"
    echo ""
  } >> "${DOCUMENTATION_FILE}"
  
  if [ -d "/workspaces/cahier-des-charge/orchestration/docker" ]; then
    for file in $(find "/workspaces/cahier-des-charge/orchestration/docker" -name "docker-compose*.yml" | sort); do
      filename=$(basename "${file}")
      
      {
        echo "### ${filename}"
        echo ""
        echo "**Chemin:** \`${file}\`"
        echo ""
        echo "**Services:**"
      } >> "${DOCUMENTATION_FILE}"
      
      # Correction: gestion des caractères spéciaux et redirection des erreurs
      grep -A 1 "^services:" "${file}" 2>/dev/null | grep -v "^services:" | grep -v "\-\-" > /tmp/services.txt
      if [ -s "/tmp/services.txt" ]; then
        grep "^  [a-zA-Z0-9_-]*:" "${file}" 2>/dev/null | sed 's/://' | tr -d "'" | tr -d '"' | while read -r service; do
          echo "- ${service}" >> "${DOCUMENTATION_FILE}"
        done
      else
        echo "*(Pas de services détectés)*" >> "${DOCUMENTATION_FILE}"
      fi
      echo "" >> "${DOCUMENTATION_FILE}"
    done
  else
    echo "*(Aucun fichier Docker Compose trouvé)*" >> "${DOCUMENTATION_FILE}"
    echo "" >> "${DOCUMENTATION_FILE}"
  fi
  
  log "${GREEN}✅ Documentation générée dans ${DOCUMENTATION_FILE}${NC}"
}

# Fonction pour créer un rapport de synthèse
create_summary_report() {
  log "${YELLOW}Création d'un rapport de synthèse...${NC}"
  
  SUMMARY_FILE="${REPORT_DIR}/workflows-summary.md"
  
  {
    echo "# Rapport de Synthèse des Workflows"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Statistiques"
    echo ""
    echo "- **GitHub Actions workflows:** $(find "/workspaces/cahier-des-charge/.github/workflows" -name "*.yml*" -o -name "*.yaml*" 2>/dev/null | wc -l)"
    echo "- **CI workflows:** $(find "/workspaces/cahier-des-charge/ci" -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)"
    echo "- **Docker Compose files:** $(find "/workspaces/cahier-des-charge/orchestration/docker" -name "docker-compose*.yml" 2>/dev/null | wc -l)"
    echo "- **Workflows désactivés:** $(find "/workspaces/cahier-des-charge/.github/workflows" -name "*.disabled" 2>/dev/null | wc -l)"
    echo ""
    echo "## Actions effectuées"
    echo ""
    echo "1. Sauvegarde des workflows dans \`${BACKUP_DIR}\`"
    echo "2. Désactivation des GitHub Actions workflows"
    echo "3. Création d'un inventaire des workflows"
    echo "4. Analyse des dépendances entre workflows"
    echo "5. Documentation des workflows"
    echo ""
    echo "## Problèmes identifiés et solutions"
    echo ""
    echo "### Problèmes potentiels"
    echo ""
    echo "1. **Workflows automatisés incontrôlés** - Les workflows déclenchaient des actions sans supervision adéquate"
    echo "2. **Duplication de fonctionnalités** - Plusieurs workflows effectuaient des tâches similaires"
    echo "3. **Dépendances circulaires** - Certains workflows s'appelaient mutuellement, créant des boucles"
    echo "4. **Manque de documentation** - Les workflows n'étaient pas documentés de façon cohérente"
    echo ""
    echo "### Solutions proposées"
    echo ""
    echo "1. Revoir chaque workflow et ne réactiver que ceux qui sont essentiels"
    echo "2. Consolider les workflows qui ont des fonctionnalités similaires"
    echo "3. Documenter le fonctionnement de chaque workflow dans le code"
    echo "4. Mettre en place un processus d'approbation pour les nouveaux workflows"
    echo "5. Créer un système de journalisation centralisé pour tous les workflows"
    echo "6. Limiter les autorisations des workflows pour éviter les modifications non supervisées"
  } > "${SUMMARY_FILE}"
  
  log "${GREEN}✅ Rapport de synthèse créé dans ${SUMMARY_FILE}${NC}"
}

# Menu principal
main() {
  echo -e "${YELLOW}Ce script va nettoyer et documenter les workflows de votre projet.${NC}"
  echo -e "${RED}ATTENTION: Cette opération modifiera des fichiers. Une sauvegarde sera créée.${NC}"
  read -p "Voulez-vous continuer? (o/n): " confirm
  
  if [[ $confirm != "o" && $confirm != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Créer une sauvegarde
  backup_workflows
  
  # Étape 2: Désactiver les GitHub Actions workflows
  disable_github_workflows
  
  # Étape 3: Créer un inventaire des workflows
  create_workflow_inventory
  
  # Étape 4: Analyser les dépendances entre workflows
  analyze_workflow_dependencies
  
  # Étape 5: Documenter les workflows
  document_workflows
  
  # Étape 6: Créer un rapport de synthèse
  create_summary_report
  
  log "${GREEN}======================================================${NC}"
  log "${GREEN}✅ Nettoyage des workflows terminé avec succès!${NC}"
  log "${GREEN}   - Sauvegarde : ${BACKUP_DIR}${NC}"
  log "${GREEN}   - Documentation : ${REPORT_DIR}${NC}"
  log "${GREEN}   - Log : ${LOG_FILE}${NC}"
  log "${GREEN}======================================================${NC}"
}

# Exécuter le script
main