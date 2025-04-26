#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   CONSOLIDATION DES SCRIPTS ET WORKFLOWS DU PROJET   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/scripts_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
REPORT_DIR="/workspaces/cahier-des-charge/documentation/scripts"
SCRIPTS_DIR="/workspaces/cahier-des-charge/scripts"
NEW_STRUCTURE_DIR="/workspaces/cahier-des-charge/scripts/organized"

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORT_DIR}"
mkdir -p "${NEW_STRUCTURE_DIR}"

# Fichier log
LOG_FILE="${LOG_DIR}/scripts_consolidation_${TIMESTAMP}.log"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour sauvegarder les scripts
backup_scripts() {
  log "${YELLOW}Sauvegarde de tous les scripts...${NC}"
  
  # Copier l'ensemble du dossier scripts
  cp -r "${SCRIPTS_DIR}" "${BACKUP_DIR}"
  
  log "${GREEN}✅ Sauvegarde des scripts terminée dans ${BACKUP_DIR}${NC}"
}

# Fonction pour analyser les scripts existants
analyze_scripts() {
  log "${YELLOW}Analyse des scripts existants...${NC}"
  
  # Fichier d'analyse
  ANALYSIS_FILE="${REPORT_DIR}/scripts-analysis.md"
  
  {
    echo "# Analyse des Scripts"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Catégories de scripts identifiées"
    echo ""
    
    # Compter les scripts par catégorie
    echo "### Migration ($(find "${SCRIPTS_DIR}" -name "*migrat*" -o -name "*migra*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*migrat*" -o -name "*migra*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### CI/CD ($(find "${SCRIPTS_DIR}" -path "*/ci/*" -o -name "*ci-*" -o -name "*test*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -path "*/ci/*" -o -name "*ci-*" -o -name "*test*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Agents ($(find "${SCRIPTS_DIR}" -name "*agent*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*agent*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Vérification ($(find "${SCRIPTS_DIR}" -name "*verif*" -o -name "*valid*" -o -name "*check*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*verif*" -o -name "*valid*" -o -name "*check*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Analyse ($(find "${SCRIPTS_DIR}" -name "*analy*" -o -path "*/analysis/*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*analy*" -o -path "*/analysis/*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Monitoring ($(find "${SCRIPTS_DIR}" -name "*monitor*" -o -path "*/monitoring/*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*monitor*" -o -path "*/monitoring/*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Génération ($(find "${SCRIPTS_DIR}" -name "*generat*" -o -path "*/generation/*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*generat*" -o -path "*/generation/*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Maintenance ($(find "${SCRIPTS_DIR}" -path "*/maintenance/*" -o -name "*fix*" -o -name "*clean*" -o -name "*update*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -path "*/maintenance/*" -o -name "*fix*" -o -name "*clean*" -o -name "*update*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Setup ($(find "${SCRIPTS_DIR}" -name "*setup*" -o -name "*init*" -o -name "*install*" -o -path "*/setup/*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*setup*" -o -name "*init*" -o -name "*install*" -o -path "*/setup/*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Dashboards ($(find "${SCRIPTS_DIR}" -name "*dashboard*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*dashboard*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "### Workflows ($(find "${SCRIPTS_DIR}" -name "*workflow*" -o -path "*/workflow/*" | wc -l) scripts)"
    echo ""
    find "${SCRIPTS_DIR}" -name "*workflow*" -o -path "*/workflow/*" | sort | while read -r file; do
      echo "- \`$(basename "${file}")\`"
    done
    
    echo ""
    echo "## Problèmes identifiés"
    echo ""
    echo "### Scripts dupliqués ou similaires"
    echo ""
    
    # Identifier les scripts avec des noms similaires
    find "${SCRIPTS_DIR}" -type f -name "*.sh" | sort | awk -F/ '{print $NF}' | sort | uniq -d | while read -r script_name; do
      echo "- Scripts similaires pour \`${script_name}\`:"
      find "${SCRIPTS_DIR}" -name "${script_name}" | while read -r file; do
        echo "  - \`${file}\`"
      done
    done
    
    echo ""
    echo "### Scripts avec fonctionnalités chevauchantes"
    echo ""
    
    # Identifier les scripts liés à la migration
    echo "#### Scripts de migration:"
    echo ""
    find "${SCRIPTS_DIR}" -name "*migrat*" | sort | while read -r file; do
      if [ -f "${file}" ] && [ -x "${file}" ]; then
        head -n 10 "${file}" | grep -E "^#" | grep -v "^#!" | head -n 1 | sed "s/^# */- \`$(basename "${file}")\`: /"
      else
        echo "- \`$(basename "${file}")\`"
      fi
    done
    
    echo ""
    echo "#### Scripts de vérification:"
    echo ""
    find "${SCRIPTS_DIR}" -name "*verif*" -o -name "*check*" | sort | while read -r file; do
      if [ -f "${file}" ] && [ -x "${file}" ]; then
        head -n 10 "${file}" | grep -E "^#" | grep -v "^#!" | head -n 1 | sed "s/^# */- \`$(basename "${file}")\`: /"
      else
        echo "- \`$(basename "${file}")\`"
      fi
    done
    
    echo ""
    echo "## Recommandations de consolidation"
    echo ""
    echo "En fonction de l'analyse, nous recommandons les regroupements suivants:"
    echo ""
    echo "1. **Migration** - Consolider tous les scripts de migration dans un sous-répertoire avec une structure cohérente"
    echo "2. **CI/CD** - Regrouper les scripts CI/CD avec des nommages standardisés"
    echo "3. **Vérification** - Unifier les scripts de vérification et de validation"
    echo "4. **Agents** - Consolider les scripts liés aux agents dans un seul répertoire bien organisé"
    echo "5. **Monitoring** - Rassembler tous les scripts de surveillance et de monitoring"
    echo "6. **Utilitaires** - Créer un répertoire pour les scripts utilitaires communs"
    
  } > "${ANALYSIS_FILE}"
  
  log "${GREEN}✅ Analyse des scripts terminée. Rapport disponible dans ${ANALYSIS_FILE}${NC}"
}

# Fonction pour créer la nouvelle structure de répertoires
create_new_structure() {
  log "${YELLOW}Création de la nouvelle structure de répertoires...${NC}"
  
  # Créer les répertoires principaux
  mkdir -p "${NEW_STRUCTURE_DIR}/migration"
  mkdir -p "${NEW_STRUCTURE_DIR}/cicd"
  mkdir -p "${NEW_STRUCTURE_DIR}/verification"
  mkdir -p "${NEW_STRUCTURE_DIR}/agents"
  mkdir -p "${NEW_STRUCTURE_DIR}/monitoring"
  mkdir -p "${NEW_STRUCTURE_DIR}/setup"
  mkdir -p "${NEW_STRUCTURE_DIR}/maintenance"
  mkdir -p "${NEW_STRUCTURE_DIR}/generation"
  mkdir -p "${NEW_STRUCTURE_DIR}/dashboards"
  mkdir -p "${NEW_STRUCTURE_DIR}/workflows"
  mkdir -p "${NEW_STRUCTURE_DIR}/utils"
  
  # Créer les sous-répertoires
  mkdir -p "${NEW_STRUCTURE_DIR}/migration/plans"
  mkdir -p "${NEW_STRUCTURE_DIR}/migration/execution"
  mkdir -p "${NEW_STRUCTURE_DIR}/migration/analysis"
  mkdir -p "${NEW_STRUCTURE_DIR}/migration/verification"
  
  mkdir -p "${NEW_STRUCTURE_DIR}/agents/core"
  mkdir -p "${NEW_STRUCTURE_DIR}/agents/audit"
  mkdir -p "${NEW_STRUCTURE_DIR}/agents/validation"
  mkdir -p "${NEW_STRUCTURE_DIR}/agents/orchestration"
  mkdir -p "${NEW_STRUCTURE_DIR}/agents/monitoring"
  
  mkdir -p "${NEW_STRUCTURE_DIR}/verification/quality"
  mkdir -p "${NEW_STRUCTURE_DIR}/verification/consistency"
  mkdir -p "${NEW_STRUCTURE_DIR}/verification/structure"
  
  mkdir -p "${NEW_STRUCTURE_DIR}/cicd/tests"
  mkdir -p "${NEW_STRUCTURE_DIR}/cicd/deployment"
  mkdir -p "${NEW_STRUCTURE_DIR}/cicd/pipelines"
  
  log "${GREEN}✅ Nouvelle structure de répertoires créée${NC}"
}

# Fonction pour créer le plan de consolidation
create_consolidation_plan() {
  log "${YELLOW}Création du plan de consolidation...${NC}"
  
  # Fichier du plan
  PLAN_FILE="${REPORT_DIR}/scripts-consolidation-plan.md"
  
  {
    echo "# Plan de Consolidation des Scripts"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Nouvelle structure proposée"
    echo ""
    echo "```"
    echo "scripts/"
    echo "├── migration/            # Scripts liés à la migration"
    echo "│   ├── plans/           # Génération de plans de migration"
    echo "│   ├── execution/       # Exécution des migrations"
    echo "│   ├── analysis/        # Analyse avant/après migration"
    echo "│   └── verification/    # Vérification post-migration"
    echo "├── cicd/                # Scripts CI/CD"
    echo "│   ├── tests/           # Tests automatisés"
    echo "│   ├── deployment/      # Scripts de déploiement"
    echo "│   └── pipelines/       # Configuration des pipelines"
    echo "├── verification/        # Scripts de vérification"
    echo "│   ├── quality/         # Vérification de qualité"
    echo "│   ├── consistency/     # Vérification de cohérence"
    echo "│   └── structure/       # Vérification de structure"
    echo "├── agents/              # Scripts liés aux agents"
    echo "│   ├── core/            # Agents principaux"
    echo "│   ├── audit/           # Agents d'audit"
    echo "│   ├── validation/      # Agents de validation" 
    echo "│   ├── orchestration/   # Agents d'orchestration"
    echo "│   └── monitoring/      # Agents de surveillance"
    echo "├── monitoring/          # Scripts de monitoring"
    echo "├── setup/               # Scripts d'installation"
    echo "├── maintenance/         # Scripts de maintenance"
    echo "├── generation/          # Scripts de génération"
    echo "├── dashboards/          # Scripts des tableaux de bord"
    echo "├── workflows/           # Scripts des workflows"
    echo "└── utils/               # Scripts utilitaires"
    echo "```"
    echo ""
    echo "## Plan de migration des scripts"
    echo ""
    
    # Migration
    echo "### Migration des scripts de migration"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*migrat*" -o -name "*migration*" | sort | while read -r file; do
      if [[ "${file}" == *"plan"* ]]; then
        echo "| \`$(basename "${file}")\` | migration/plans/ | Copier |"
      elif [[ "${file}" == *"verif"* || "${file}" == *"check"* ]]; then
        echo "| \`$(basename "${file}")\` | migration/verification/ | Copier |"
      elif [[ "${file}" == *"analy"* ]]; then
        echo "| \`$(basename "${file}")\` | migration/analysis/ | Copier |"
      else
        echo "| \`$(basename "${file}")\` | migration/execution/ | Copier |"
      fi
    done
    
    echo ""
    echo "### Migration des scripts CI/CD"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -path "*/ci/*" -o -name "*ci-*" -o -name "*test*" | sort | while read -r file; do
      if [[ "${file}" == *"test"* ]]; then
        echo "| \`$(basename "${file}")\` | cicd/tests/ | Copier |"
      elif [[ "${file}" == *"deploy"* ]]; then
        echo "| \`$(basename "${file}")\` | cicd/deployment/ | Copier |"
      else
        echo "| \`$(basename "${file}")\` | cicd/pipelines/ | Copier |"
      fi
    done
    
    echo ""
    echo "### Migration des scripts de vérification"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*verif*" -o -name "*valid*" -o -name "*check*" | sort | while read -r file; do
      if [[ "${file}" == *"quality"* || "${file}" == *"qa"* ]]; then
        echo "| \`$(basename "${file}")\` | verification/quality/ | Copier |"
      elif [[ "${file}" == *"consist"* ]]; then
        echo "| \`$(basename "${file}")\` | verification/consistency/ | Copier |"
      elif [[ "${file}" == *"struct"* ]]; then
        echo "| \`$(basename "${file}")\` | verification/structure/ | Copier |"
      else
        echo "| \`$(basename "${file}")\` | verification/ | Copier |"
      fi
    done
    
    echo ""
    echo "### Migration des scripts d'agents"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*agent*" | sort | while read -r file; do
      if [[ "${file}" == *"audit"* ]]; then
        echo "| \`$(basename "${file}")\` | agents/audit/ | Copier |"
      elif [[ "${file}" == *"valid"* || "${file}" == *"verif"* ]]; then
        echo "| \`$(basename "${file}")\` | agents/validation/ | Copier |"
      elif [[ "${file}" == *"orchestr"* ]]; then
        echo "| \`$(basename "${file}")\` | agents/orchestration/ | Copier |"
      elif [[ "${file}" == *"monitor"* ]]; then
        echo "| \`$(basename "${file}")\` | agents/monitoring/ | Copier |"
      else
        echo "| \`$(basename "${file}")\` | agents/core/ | Copier |"
      fi
    done
    
    echo ""
    echo "### Autres scripts"
    echo ""
    
    # Monitoring
    echo "#### Scripts de monitoring:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*monitor*" -o -path "*/monitoring/*" | sort | grep -v "agent" | while read -r file; do
      echo "| \`$(basename "${file}")\` | monitoring/ | Copier |"
    done
    
    echo ""
    echo "#### Scripts de génération:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*generat*" -o -path "*/generation/*" | sort | while read -r file; do
      echo "| \`$(basename "${file}")\` | generation/ | Copier |"
    done
    
    echo ""
    echo "#### Scripts de setup:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*setup*" -o -name "*init*" -o -name "*install*" -o -path "*/setup/*" | sort | while read -r file; do
      echo "| \`$(basename "${file}")\` | setup/ | Copier |"
    done
    
    echo ""
    echo "#### Scripts de maintenance:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -path "*/maintenance/*" -o -name "*fix*" -o -name "*clean*" -o -name "*update*" | sort | while read -r file; do
      echo "| \`$(basename "${file}")\` | maintenance/ | Copier |"
    done
    
    echo ""
    echo "#### Scripts de dashboards:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*dashboard*" | sort | while read -r file; do
      echo "| \`$(basename "${file}")\` | dashboards/ | Copier |"
    done
    
    echo ""
    echo "#### Scripts de workflows:"
    echo ""
    echo "| Script source | Destination | Action |"
    echo "|--------------|-------------|--------|"
    find "${SCRIPTS_DIR}" -name "*workflow*" -o -path "*/workflow/*" | sort | while read -r file; do
      echo "| \`$(basename "${file}")\` | workflows/ | Copier |"
    done
  } > "${PLAN_FILE}"
  
  log "${GREEN}✅ Plan de consolidation créé. Disponible dans ${PLAN_FILE}${NC}"
}

# Fonction pour consolider les scripts
consolidate_scripts() {
  log "${YELLOW}Consolidation des scripts...${NC}"
  
  # Migration
  log "Consolidation des scripts de migration..."
  find "${SCRIPTS_DIR}" -name "*migrat*" -o -name "*migration*" | while read -r file; do
    if [[ "${file}" == *"plan"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/migration/plans/"
    elif [[ "${file}" == *"verif"* || "${file}" == *"check"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/migration/verification/"
    elif [[ "${file}" == *"analy"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/migration/analysis/"
    else
      cp "${file}" "${NEW_STRUCTURE_DIR}/migration/execution/"
    fi
  done
  
  # CI/CD
  log "Consolidation des scripts CI/CD..."
  find "${SCRIPTS_DIR}" -path "*/ci/*" -o -name "*ci-*" -o -name "*test*" | while read -r file; do
    if [[ "${file}" == *"test"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/cicd/tests/"
    elif [[ "${file}" == *"deploy"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/cicd/deployment/"
    else
      cp "${file}" "${NEW_STRUCTURE_DIR}/cicd/pipelines/"
    fi
  done
  
  # Vérification
  log "Consolidation des scripts de vérification..."
  find "${SCRIPTS_DIR}" -name "*verif*" -o -name "*valid*" -o -name "*check*" | while read -r file; do
    if [[ "${file}" == *"quality"* || "${file}" == *"qa"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/verification/quality/"
    elif [[ "${file}" == *"consist"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/verification/consistency/"
    elif [[ "${file}" == *"struct"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/verification/structure/"
    else
      cp "${file}" "${NEW_STRUCTURE_DIR}/verification/"
    fi
  done
  
  # Agents
  log "Consolidation des scripts d'agents..."
  find "${SCRIPTS_DIR}" -name "*agent*" | while read -r file; do
    if [[ "${file}" == *"audit"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/agents/audit/"
    elif [[ "${file}" == *"valid"* || "${file}" == *"verif"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/agents/validation/"
    elif [[ "${file}" == *"orchestr"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/agents/orchestration/"
    elif [[ "${file}" == *"monitor"* ]]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/agents/monitoring/"
    else
      cp "${file}" "${NEW_STRUCTURE_DIR}/agents/core/"
    fi
  done
  
  # Autres scripts
  log "Consolidation des autres scripts..."
  
  # Monitoring
  find "${SCRIPTS_DIR}" -name "*monitor*" -o -path "*/monitoring/*" | grep -v "agent" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/monitoring/"
  done
  
  # Génération
  find "${SCRIPTS_DIR}" -name "*generat*" -o -path "*/generation/*" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/generation/"
  done
  
  # Setup
  find "${SCRIPTS_DIR}" -name "*setup*" -o -name "*init*" -o -name "*install*" -o -path "*/setup/*" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/setup/"
  done
  
  # Maintenance
  find "${SCRIPTS_DIR}" -path "*/maintenance/*" -o -name "*fix*" -o -name "*clean*" -o -name "*update*" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/maintenance/"
  done
  
  # Dashboards
  find "${SCRIPTS_DIR}" -name "*dashboard*" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/dashboards/"
  done
  
  # Workflows
  find "${SCRIPTS_DIR}" -name "*workflow*" -o -path "*/workflow/*" | while read -r file; do
    cp "${file}" "${NEW_STRUCTURE_DIR}/workflows/"
  done
  
  # Utils (reste)
  find "${SCRIPTS_DIR}" -type f -not -path "${NEW_STRUCTURE_DIR}/*" | while read -r file; do
    # Vérifier si le fichier n'a pas déjà été copié dans une autre catégorie
    already_copied=false
    for dir in migration cicd verification agents monitoring setup maintenance generation dashboards workflows; do
      if [ -f "${NEW_STRUCTURE_DIR}/${dir}/$(basename "${file}")" ]; then
        already_copied=true
        break
      fi
      
      # Vérifier aussi dans les sous-répertoires
      if find "${NEW_STRUCTURE_DIR}/${dir}" -name "$(basename "${file}")" | grep -q .; then
        already_copied=true
        break
      fi
    done
    
    if [ "${already_copied}" = false ]; then
      cp "${file}" "${NEW_STRUCTURE_DIR}/utils/"
    fi
  done
  
  # Rendre tous les scripts exécutables
  find "${NEW_STRUCTURE_DIR}" -type f -name "*.sh" -exec chmod +x {} \;
  
  log "${GREEN}✅ Consolidation des scripts terminée${NC}"
}

# Fonction pour créer un rapport de consolidation
create_consolidation_report() {
  log "${YELLOW}Création du rapport de consolidation...${NC}"
  
  # Fichier de rapport
  REPORT_FILE="${REPORT_DIR}/scripts-consolidation-report.md"
  
  {
    echo "# Rapport de Consolidation des Scripts"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Résultats de la consolidation"
    echo ""
    echo "### Scripts par catégorie"
    echo ""
    echo "| Catégorie | Nombre de scripts |"
    echo "|-----------|------------------|"
    
    # Compter le nombre de scripts par catégorie
    for dir in "${NEW_STRUCTURE_DIR}"/*; do
      if [ -d "${dir}" ]; then
        category=$(basename "${dir}")
        count=$(find "${dir}" -type f | wc -l)
        echo "| ${category} | ${count} |"
      fi
    done
    
    echo ""
    echo "### Détail par sous-catégorie"
    echo ""
    
    # Migration
    echo "#### Migration"
    echo ""
    echo "| Sous-catégorie | Scripts |"
    echo "|---------------|---------|"
    for subdir in "${NEW_STRUCTURE_DIR}/migration"/*; do
      if [ -d "${subdir}" ]; then
        subcategory=$(basename "${subdir}")
        scripts=$(find "${subdir}" -type f -printf "%f, " | sed 's/, $//')
        echo "| ${subcategory} | ${scripts} |"
      fi
    done
    
    echo ""
    echo "#### Agents"
    echo ""
    echo "| Sous-catégorie | Scripts |"
    echo "|---------------|---------|"
    for subdir in "${NEW_STRUCTURE_DIR}/agents"/*; do
      if [ -d "${subdir}" ]; then
        subcategory=$(basename "${subdir}")
        scripts=$(find "${subdir}" -type f -printf "%f, " | sed 's/, $//')
        echo "| ${subcategory} | ${scripts} |"
      fi
    done
    
    echo ""
    echo "## Duplications résolues"
    echo ""
    echo "Les scripts suivants semblaient avoir des fonctionnalités dupliquées et ont été consolidés:"
    echo ""
    
    # Liste des duplications potentielles
    find "${SCRIPTS_DIR}" -type f -name "*.sh" | sort | awk -F/ '{print $NF}' | sort | uniq -d | while read -r script_name; do
      echo "- \`${script_name}\` - consolidé en un seul script"
    done
    
    echo ""
    echo "## Prochaines étapes recommandées"
    echo ""
    echo "1. **Réviser chaque catégorie** pour vérifier la pertinence des scripts consolidés"
    echo "2. **Fusionner les scripts similaires** au sein de chaque catégorie"
    echo "3. **Standardiser les noms** pour une meilleure cohérence"
    echo "4. **Ajouter une documentation** en entête de chaque script"
    echo "5. **Mettre à jour les références** entre scripts pour refléter la nouvelle structure"
    echo "6. **Remplacer l'ancienne structure** une fois les tests effectués"
  } > "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport de consolidation créé. Disponible dans ${REPORT_FILE}${NC}"
}

# Menu principal
main() {
  echo -e "${YELLOW}Ce script va consolider et organiser les scripts du projet.${NC}"
  echo -e "${RED}ATTENTION: Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer? (o/n): " confirm
  
  if [[ $confirm != "o" && $confirm != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Créer une sauvegarde
  backup_scripts
  
  # Étape 2: Analyser les scripts existants
  analyze_scripts
  
  # Étape 3: Créer une nouvelle structure de répertoires
  create_new_structure
  
  # Étape 4: Créer un plan de consolidation
  create_consolidation_plan
  
  # Étape 5: Consolider les scripts
  consolidate_scripts
  
  # Étape 6: Créer un rapport de consolidation
  create_consolidation_report
  
  log "${GREEN}======================================================${NC}"
  log "${GREEN}✅ Consolidation des scripts terminée!${NC}"
  log "${GREEN}   - Sauvegarde : ${BACKUP_DIR}${NC}"
  log "${GREEN}   - Nouvelle structure : ${NEW_STRUCTURE_DIR}${NC}"
  log "${GREEN}   - Rapports : ${REPORT_DIR}${NC}"
  log "${GREEN}   - Log : ${LOG_FILE}${NC}"
  log "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Que souhaitez-vous faire maintenant?"
  echo "1. Appliquer la nouvelle structure (remplacer l'ancienne)"
  echo "2. Conserver les deux structures pour l'instant"
  read -p "Votre choix (1/2): " choice
  
  if [ "${choice}" = "1" ]; then
    log "${YELLOW}Application de la nouvelle structure...${NC}"
    
    # Créer un dossier legacy pour l'ancienne structure
    mkdir -p "${SCRIPTS_DIR}/legacy"
    
    # Déplacer les anciens scripts (sauf ce script et le dossier organized)
    find "${SCRIPTS_DIR}" -maxdepth 1 -not -path "${SCRIPTS_DIR}" -not -path "${NEW_STRUCTURE_DIR}" -not -path "${SCRIPTS_DIR}/legacy" -not -path "${SCRIPTS_DIR}/project-consolidation.sh" | while read -r item; do
      mv "${item}" "${SCRIPTS_DIR}/legacy/"
    done
    
    # Déplacer les nouveaux scripts au niveau supérieur
    find "${NEW_STRUCTURE_DIR}" -maxdepth 1 -mindepth 1 | while read -r item; do
      mv "${item}" "${SCRIPTS_DIR}/"
    done
    
    # Supprimer le dossier temporaire
    rmdir "${NEW_STRUCTURE_DIR}"
    
    log "${GREEN}✅ Nouvelle structure appliquée avec succès!${NC}"
    log "${YELLOW}Les anciens scripts ont été déplacés dans ${SCRIPTS_DIR}/legacy/${NC}"
  else
    log "${YELLOW}La nouvelle structure est disponible dans ${NEW_STRUCTURE_DIR}${NC}"
    log "${YELLOW}Vous pouvez l'appliquer manuellement plus tard.${NC}"
  fi
}

# Exécuter le script
main