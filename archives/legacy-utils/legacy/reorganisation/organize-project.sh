#!/bin/bash
# organize-project.sh - Script pour organiser et unifier la structure du projet
# Date: 11 avril 2025
# Version: 2.1 - Version améliorée avec meilleure gestion des dossiers et optimisations

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Dossiers à ignorer lors des opérations
IGNORE_DIRS="node_modules|dist|.git|.cache|.vscode|coverage|build|dashboard/node_modules|\.bak"

# Variables globales
START_TIME=$(date +%s)
LOG_FILE="logs/reorganize-$(date +%Y%m%d-%H%M%S).log"
SUCCESS_COUNT=0
ERROR_COUNT=0

# Création du dossier logs s'il n'existe pas
mkdir -p logs

# Fonction d'affichage des messages avec formatage et journalisation
log_info() {
  local message="$1"
  echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE"
}

log_success() {
  local message="$1"
  echo -e "${GREEN}[SUCCÈS]${NC} $message" | tee -a "$LOG_FILE"
  ((SUCCESS_COUNT++))
}

log_warning() {
  local message="$1"
  echo -e "${YELLOW}[ATTENTION]${NC} $message" | tee -a "$LOG_FILE"
}

log_error() {
  local message="$1"
  echo -e "${RED}[ERREUR]${NC} $message" | tee -a "$LOG_FILE"
  ((ERROR_COUNT++))
}

# Fonction pour afficher une bannière
show_banner() {
  echo -e "${MAGENTA}${BOLD}"
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║                                                      ║"
  echo "║       🚀 Réorganisation du Projet - v2.1             ║"
  echo "║       Date: $(date '+%d/%m/%Y')                        ║"
  echo "║                                                      ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo "Logs: $LOG_FILE"
  echo ""
}

# Fonction pour créer une sauvegarde avant modifications
create_backup() {
  local backup_name="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  log_info "Création d'une sauvegarde du projet avant réorganisation..."
  
  mkdir -p backups
  
  # Exclusion des dossiers volumineux et inutiles pour la sauvegarde
  tar --exclude="./node_modules" --exclude="./.git" --exclude="./backups" \
      --exclude="./dist" --exclude="./dashboard/node_modules" -czf "backups/$backup_name" .
  
  if [ $? -eq 0 ]; then
    log_success "Sauvegarde créée avec succès: backups/$backup_name"
  else
    log_error "Échec de la création de la sauvegarde"
    exit 1
  fi
}

# Fonction pour vérifier l'intégrité de la structure du projet
verify_structure() {
  log_info "Vérification de l'intégrité de la structure du projet..."
  local errors=0
  
  for dir in docs agents scripts config; do
    if [ ! -d "$dir" ]; then
      log_error "Le dossier $dir n'existe pas ou n'a pas été créé correctement"
      errors=$((errors+1))
    fi
  done
  
  if [ $errors -eq 0 ]; then
    log_success "La structure du projet est correcte"
    return 0
  else
    log_error "$errors problème(s) détecté(s) dans la structure du projet"
    return 1
  fi
}

# Fonction pour nettoyer les fichiers temporaires et dupliqués
clean_project() {
  log_info "Nettoyage des fichiers temporaires et dupliqués..."
  
  # Suppression des fichiers de sauvegarde temporaires
  find . -type f -name "*.bak" -o -name "*.tmp" -o -name "*~" | while read file; do
    rm "$file"
    log_info "  - Suppression: $file"
  done
  
  # Détection des doublons potentiels (basé sur le nom)
  log_info "Détection des fichiers potentiellement dupliqués..."
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/backups/*" | sort | uniq -d -i
}

# Fonction pour générer un rapport de structure du projet
generate_structure_report() {
  local report_file="docs/rapports/structure-projet-$(date +%Y%m%d).md"
  
  log_info "Génération d'un rapport de structure du projet..."
  mkdir -p docs/rapports
  
  echo "# Rapport de structure du projet" > "$report_file"
  echo "Date: $(date '+%d/%m/%Y à %H:%M:%S')" >> "$report_file"
  echo "" >> "$report_file"
  echo "## Arborescence des dossiers" >> "$report_file"
  echo '```' >> "$report_file"
  find . -type d -not -path "*/\.*" | grep -v -E "($IGNORE_DIRS)" | sort >> "$report_file"
  echo '```' >> "$report_file"
  echo "" >> "$report_file"
  echo "## Statistiques des fichiers" >> "$report_file"
  echo "" >> "$report_file"
  echo "| Type de fichier | Nombre |" >> "$report_file"
  echo "|---------------|--------|" >> "$report_file"
  echo "| .js | $(find . -type f -name "*.js" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  echo "| .ts | $(find . -type f -name "*.ts" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  echo "| .sh | $(find . -type f -name "*.sh" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  echo "| .json | $(find . -type f -name "*.json" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  echo "| .md | $(find . -type f -name "*.md" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  echo "| .html | $(find . -type f -name "*.html" | grep -v -E "($IGNORE_DIRS)" | wc -l) |" >> "$report_file"
  
  log_success "Rapport généré: $report_file"
}

# Fonction pour organiser les workflows n8n
organize_workflows() {
  log_info "Organisation des workflows n8n..."
  
  mkdir -p workflows/migration
  mkdir -p workflows/analysis
  mkdir -p workflows/automation
  
  # Déplacement des workflows
  mv *.n8n.json workflows/ 2>/dev/null
  if [ $? -eq 0 ]; then
    log_success "  - Fichiers *.n8n.json → workflows/"
  fi
  
  # Catégorisation plus fine des workflows
  if [ -f "workflows/migration_pipeline.n8n.json" ]; then
    mv workflows/migration_pipeline.n8n.json workflows/migration/
    log_success "  - migration_pipeline.n8n.json → workflows/migration/"
  fi
  
  if [ -f "workflows/n8n-mysql-analyzer.json" ]; then
    mv workflows/n8n-mysql-analyzer.json workflows/analysis/
    log_success "  - n8n-mysql-analyzer.json → workflows/analysis/"
  fi
}

# Fonction pour configurer les agents
setup_agents() {
  log_info "Configuration des agents..."
  
  # Copie des fichiers de configuration pour les agents
  if [ -f "config/audit-config.yml" ]; then
    cp config/audit-config.yml agents/analysis/
    log_success "  - config/audit-config.yml → agents/analysis/"
  fi
  
  if [ -f "config/reliability-config.md" ]; then
    cp config/reliability-config.md agents/quality/
    log_success "  - config/reliability-config.md → agents/quality/"
  fi
}

# Fonction pour synchroniser les configurations
sync_configs() {
  log_info "Synchronisation des fichiers de configuration..."
  
  mkdir -p config/env
  mkdir -p config/defaults
  
  # Détection et déplacement des fichiers de configuration
  find . -maxdepth 1 -name "*.config.*" -exec mv {} config/ \; 2>/dev/null
  if [ $? -eq 0 ]; then
    log_success "  - *.config.* → config/"
  fi
  
  # Création d'un fichier de configuration par défaut si nécessaire
  if [ ! -f "config/defaults/project-defaults.json" ]; then
    cat > config/defaults/project-defaults.json << EOF
{
  "projectName": "cahier-des-charge",
  "version": "1.0.0",
  "organization": {
    "docsFolder": "docs",
    "scriptsFolder": "scripts",
    "agentsFolder": "agents",
    "workflowsFolder": "workflows"
  },
  "settings": {
    "autoBackup": true,
    "backupInterval": "daily",
    "cleanupInterval": "weekly"
  }
}
EOF
    log_success "  - Création du fichier de configuration par défaut"
  fi
}

# Fonction pour organiser les applications
organize_apps() {
  log_info "📱 Organisation des applications..."
  
  # Vérifier si le dossier apps existe déjà
  if [ ! -d "apps" ]; then
    mkdir -p apps/frontend
    mkdir -p apps/mcp-server
    log_success "Structure apps/ créée"
  fi
  
  # Déplacer le dashboard dans apps si nécessaire
  if [ -d "dashboard" ] && [ ! -d "apps/dashboard" ]; then
    mkdir -p apps/dashboard
    cp -r dashboard/* apps/dashboard/
    log_success "  - dashboard → apps/dashboard/ (copié)"
  fi
  
  # Intégration des projets potentiellement indépendants
  if [ -d "projet-codespaces" ] && [ ! -d "apps/projet-codespaces" ]; then
    mkdir -p apps/projet-codespaces
    cp -r projet-codespaces/* apps/projet-codespaces/
    log_success "  - projet-codespaces → apps/projet-codespaces/ (copié)"
  fi
  
  # S'assurer que tous les fichiers de configuration nécessaires sont présents
  for app_dir in apps/*/; do
    if [ ! -f "${app_dir}package.json" ] && [ -f "package.json" ]; then
      cp package.json "${app_dir}"
      log_success "  - package.json → ${app_dir} (copié)"
    fi
  done
}

# Fonction pour générer un rapport de temps d'exécution
report_execution_time() {
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  
  local minutes=$((duration / 60))
  local seconds=$((duration % 60))
  
  echo -e "\n${CYAN}${BOLD}=== Rapport d'exécution ===${NC}"
  echo -e "⏱️  Durée: ${minutes}m ${seconds}s"
  echo -e "✅ Opérations réussies: ${SUCCESS_COUNT}"
  echo -e "❌ Erreurs: ${ERROR_COUNT}"
  echo -e "📝 Journal: ${LOG_FILE}"
  
  # Ajouter le rapport au fichier log
  echo -e "\n=== Rapport d'exécution ===" >> "$LOG_FILE"
  echo "Durée: ${minutes}m ${seconds}s" >> "$LOG_FILE"
  echo "Opérations réussies: ${SUCCESS_COUNT}" >> "$LOG_FILE"
  echo "Erreurs: ${ERROR_COUNT}" >> "$LOG_FILE"
  echo "Terminé à: $(date)" >> "$LOG_FILE"
}

# Fonction pour mettre à jour les références dans les fichiers
update_references() {
  log_info "📎 Mise à jour des références dans les fichiers..."
  
  local updated_count=0
  
  # Recherche des fichiers Markdown dans docs/
  find docs -name "*.md" -type f | while read md_file; do
    # Sauvegarder le contenu original
    local original_content=$(cat "$md_file")
    local new_content="$original_content"
    
    # Mettre à jour les chemins relatifs
    new_content=$(echo "$new_content" | sed 's|\.\./cahier/|\.\./docs/specifications/|g')
    new_content=$(echo "$new_content" | sed 's|\.\./cahier-des-charges/|\.\./docs/cahier-des-charges/|g')
    new_content=$(echo "$new_content" | sed 's|"./|"../|g')
    
    # Écrire le contenu mis à jour si modifié
    if [ "$original_content" != "$new_content" ]; then
      echo "$new_content" > "$md_file"
      ((updated_count++))
      log_info "  - Références mises à jour dans: $md_file"
    fi
  done
  
  # Recherche de références dans les fichiers JS/TS
  find src apps -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read code_file; do
    # Vérifier s'il y a des imports relatifs
    if grep -q "from '\.\." "$code_file" || grep -q "from \"\.\." "$code_file"; then
      log_warning "  - Vérifiez les imports relatifs dans: $code_file"
    fi
  done
  
  if [ $updated_count -gt 0 ]; then
    log_success "  - $updated_count fichiers ont eu leurs références mises à jour"
  else
    log_info "  - Aucune référence n'a été mise à jour"
  fi
}

# Menu interactif pour choisir les actions à effectuer
show_menu() {
  echo -e "\n${BLUE}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║      MENU DE RÉORGANISATION DU PROJET        ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
  echo -e "1) Exécuter la réorganisation complète"
  echo -e "2) Créer uniquement une sauvegarde"
  echo -e "3) Organiser uniquement la documentation"
  echo -e "4) Organiser uniquement les scripts"
  echo -e "5) Organiser uniquement les workflows"
  echo -e "6) Configurer les agents"
  echo -e "7) Nettoyer les fichiers temporaires"
  echo -e "8) Générer un rapport de structure"
  echo -e "9) Vérifier l'intégrité de la structure"
  echo -e "0) Quitter"
  echo -e "\nVeuillez choisir une option (0-9): "
  read -r choice
  
  case $choice in
    1) run_all ;;
    2) create_backup ;;
    3) organize_docs ;;
    4) organize_scripts ;;
    5) organize_workflows ;;
    6) setup_agents ;;
    7) clean_project ;;
    8) generate_structure_report ;;
    9) verify_structure ;;
    0) exit 0 ;;
    *) log_error "Option invalide" && show_menu ;;
  esac
}

# Fonction pour organiser la documentation
organize_docs() {
  log_info "📚 Consolidation de la documentation..."
  
  mkdir -p docs/cahier-des-charges
  mkdir -p docs/specifications
  mkdir -p docs/rapports
  mkdir -p docs/pipeline
  
  if [ -d "cahier-des-charges" ]; then
    cp -r cahier-des-charges/* docs/cahier-des-charges/
    log_success "  - cahier-des-charges → docs/cahier-des-charges/"
  fi

  if [ -d "cahier-des-charges-backup-20250410-113108" ]; then
    cp -r cahier-des-charges-backup-20250410-113108/* docs/cahier-des-charges/
    log_success "  - cahier-des-charges-backup-20250410-113108 → docs/cahier-des-charges/"
  fi

  if [ -d "cahier" ]; then
    cp -r cahier/* docs/specifications/
    log_success "  - cahier → docs/specifications/"
  fi
  
  # Organisation des fichiers markdown
  find . -maxdepth 1 -name "*.md" -not -name "README.md" -not -name "CHANGELOG.md" -not -name "STRUCTURE.md" -exec mv {} docs/ \; 2>/dev/null
  if [ $? -eq 0 ]; then
    log_success "  - Fichiers .md → docs/"
  fi
}

# Fonction pour organiser les scripts
organize_scripts() {
  log_info "📜 Organisation des scripts..."
  
  mkdir -p scripts/migration
  mkdir -p scripts/verification
  mkdir -p scripts/generation
  mkdir -p scripts/maintenance
  mkdir -p scripts/utility
  
  # Scripts de migration
  mv run-progressive-migration.sh scripts/migration/ 2>/dev/null && log_success "  - run-progressive-migration.sh → scripts/migration/"
  mv run-audit.ts scripts/migration/ 2>/dev/null && log_success "  - run-audit.ts → scripts/migration/"
  mv assembler-agent.ts scripts/migration/ 2>/dev/null && log_success "  - assembler-agent.ts → scripts/migration/"
  mv import-workflows*.js scripts/migration/ 2>/dev/null && log_success "  - import-workflows*.js → scripts/migration/"
  mv import-agents.js scripts/migration/ 2>/dev/null && log_success "  - import-agents.js → scripts/migration/"

  # Scripts de vérification
  mv verify-*.sh scripts/verification/ 2>/dev/null
  if [ $? -eq 0 ]; then
    log_success "  - verify-*.sh → scripts/verification/"
  else
    # Créer une copie du script de vérification dans le dossier scripts/verification
    cp verify-reorganization.sh scripts/verification/ 2>/dev/null && log_success "  - verify-reorganization.sh → scripts/verification/ (copié)"
  fi
  mv check-consistency.sh scripts/verification/ 2>/dev/null && log_success "  - check-consistency.sh → scripts/verification/"
  mv continuous-improvement.sh scripts/verification/ 2>/dev/null && log_success "  - continuous-improvement.sh → scripts/verification/"

  # Scripts de génération
  find . -maxdepth 1 -name "generate_*.py" -exec mv {} scripts/generation/ \; 2>/dev/null && log_success "  - generate_*.py → scripts/generation/"
  mv create-section.sh scripts/generation/ 2>/dev/null && log_success "  - create-section.sh → scripts/generation/"
  mv enrich-cahier.sh scripts/generation/ 2>/dev/null && log_success "  - enrich-cahier.sh → scripts/generation/"
  mv reorganize-cahier.sh scripts/generation/ 2>/dev/null && log_success "  - reorganize-cahier.sh → scripts/generation/"
  mv create-pipeline.sh scripts/generation/ 2>/dev/null && log_success "  - create-pipeline.sh → scripts/generation/"

  # Scripts de maintenance
  mv update-*.sh scripts/maintenance/ 2>/dev/null && log_success "  - update-*.sh → scripts/maintenance/"
  mv export-files.sh scripts/maintenance/ 2>/dev/null && log_success "  - export-files.sh → scripts/maintenance/"
  mv update-user.js scripts/maintenance/ 2>/dev/null && log_success "  - update-user.js → scripts/maintenance/"
  
  # Scripts utilitaires
  mv fix-agent-imports.sh scripts/utility/ 2>/dev/null && log_success "  - fix-agent-imports.sh → scripts/utility/"
  mv complete-reorganization.sh scripts/utility/ 2>/dev/null && log_success "  - complete-reorganization.sh → scripts/utility/"
  mv final-cleanup.sh scripts/utility/ 2>/dev/null && log_success "  - final-cleanup.sh → scripts/utility/"
}

# Fonction pour exécuter toutes les actions
run_all() {
  log_info "🚀 Démarrage de la réorganisation complète du projet cahier-des-charge"
  
  # Création d'une sauvegarde
  create_backup
  
  # Création des dossiers principaux
  mkdir -p backups
  mkdir -p docs/cahier-des-charges
  mkdir -p docs/specifications
  mkdir -p scripts/migration
  mkdir -p scripts/verification
  mkdir -p scripts/generation
  mkdir -p scripts/maintenance
  mkdir -p scripts/utility
  mkdir -p agents/core
  mkdir -p agents/analysis
  mkdir -p agents/migration
  mkdir -p agents/quality
  mkdir -p workflows/migration
  mkdir -p workflows/analysis
  mkdir -p workflows/automation
  mkdir -p config/env
  mkdir -p config/defaults
  
  # Exécution des fonctions d'organisation
  organize_docs
  organize_scripts
  organize_workflows
  setup_agents
  sync_configs
  organize_apps
  clean_project
  generate_structure_report
  update_references
  
  # Vérification finale
  verify_structure
  
  log_success "✅ Réorganisation du projet terminée avec succès!"
  echo -e "\n${GREEN}Statistiques:${NC}"
  echo -e "- $(find docs -type f | grep -v -E "($IGNORE_DIRS)" | wc -l) fichiers dans docs/"
  echo -e "- $(find scripts -type f | grep -v -E "($IGNORE_DIRS)" | wc -l) fichiers dans scripts/"
  echo -e "- $(find agents -type f | grep -v -E "($IGNORE_DIRS)" | wc -l) fichiers dans agents/"
  echo -e "- $(find workflows -type f | grep -v -E "($IGNORE_DIRS)" | wc -l) fichiers dans workflows/"
  echo -e "- $(find config -type f | grep -v -E "($IGNORE_DIRS)" | wc -l) fichiers dans config/"
  
  # Générer le rapport de temps d'exécution
  report_execution_time
  
  # Exécuter la vérification externe approfondie
  if [ -f "verify-reorganization.sh" ]; then
    log_info "Lancement de la vérification approfondie avec verify-reorganization.sh..."
    chmod +x verify-reorganization.sh
    ./verify-reorganization.sh --auto
    
    # Vérifier le code de retour
    verification_status=$?
    if [ $verification_status -ne 0 ]; then
      log_warning "⚠️ La vérification a détecté des problèmes dans la réorganisation!"
      
      # Proposer des options à l'utilisateur
      echo -e "\n${YELLOW}${BOLD}La vérification a échoué. Que souhaitez-vous faire?${NC}"
      echo -e "1) Voir les problèmes détaillés"
      echo -e "2) Relancer la réorganisation"
      echo -e "3) Corriger manuellement et relancer la vérification"
      echo -e "4) Ignorer les problèmes et terminer"
      echo -e "\nVotre choix: "
      read -r verify_choice
      
      case $verify_choice in
        1)
          # Afficher les problèmes détaillés
          ./verify-reorganization.sh --verify
          
          echo -e "\n${YELLOW}Souhaitez-vous relancer la réorganisation? (o/n)${NC} "
          read -r rerun_choice
          if [[ "$rerun_choice" =~ ^[Oo]$ ]]; then
            log_info "Relance de la réorganisation..."
            run_all
          fi
          ;;
        2)
          # Relancer la réorganisation
          log_info "Relance de la réorganisation..."
          run_all
          ;;
        3)
          # Proposer de relancer la vérification après correction manuelle
          log_info "Après avoir effectué les corrections manuelles, relancez la vérification avec:"
          echo -e "${CYAN}./verify-reorganization.sh${NC}"
          ;;
        4)
          log_warning "Problèmes ignorés. La réorganisation peut ne pas être complète."
          ;;
        *)
          log_error "Option non valide."
          ;;
      esac
    else
      log_success "✅ Vérification approfondie réussie! La structure du projet est correcte."
    fi
  elif [ -f "scripts/verification/verify-reorganization.sh" ]; then
    log_info "Lancement de la vérification approfondie avec scripts/verification/verify-reorganization.sh..."
    chmod +x scripts/verification/verify-reorganization.sh
    ./scripts/verification/verify-reorganization.sh --auto
    
    # Vérifier le code de retour
    verification_status=$?
    if [ $verification_status -ne 0 ]; then
      log_warning "⚠️ La vérification a détecté des problèmes dans la réorganisation!"
      
      # Proposer des options à l'utilisateur
      echo -e "\n${YELLOW}${BOLD}La vérification a échoué. Que souhaitez-vous faire?${NC}"
      echo -e "1) Voir les problèmes détaillés"
      echo -e "2) Relancer la réorganisation"
      echo -e "3) Corriger manuellement et relancer la vérification"
      echo -e "4) Ignorer les problèmes et terminer"
      echo -e "\nVotre choix: "
      read -r verify_choice
      
      case $verify_choice in
        1)
          # Afficher les problèmes détaillés
          ./scripts/verification/verify-reorganization.sh --verify
          
          echo -e "\n${YELLOW}Souhaitez-vous relancer la réorganisation? (o/n)${NC} "
          read -r rerun_choice
          if [[ "$rerun_choice" =~ ^[Oo]$ ]]; then
            log_info "Relance de la réorganisation..."
            run_all
          fi
          ;;
        2)
          # Relancer la réorganisation
          log_info "Relance de la réorganisation..."
          run_all
          ;;
        3)
          # Proposer de relancer la vérification après correction manuelle
          log_info "Après avoir effectué les corrections manuelles, relancez la vérification avec:"
          echo -e "${CYAN}./scripts/verification/verify-reorganization.sh${NC}"
          ;;
        4)
          log_warning "Problèmes ignorés. La réorganisation peut ne pas être complète."
          ;;
        *)
          log_error "Option non valide."
          ;;
      esac
    else
      log_success "✅ Vérification approfondie réussie! La structure du projet est correcte."
    fi
  else
    log_warning "Le script verify-reorganization.sh n'a pas été trouvé. Vérification approfondie non effectuée."
  fi
}

# Vérification des arguments de la ligne de commande
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: $0 [OPTION]"
  echo "Script pour organiser et unifier la structure du projet"
  echo ""
  echo "Options:"
  echo "  --all, -a         Exécuter la réorganisation complète"
  echo "  --backup, -b      Créer uniquement une sauvegarde"
  echo "  --docs, -d        Organiser uniquement la documentation"
  echo "  --scripts, -s     Organiser uniquement les scripts"
  echo "  --workflows, -w   Organiser uniquement les workflows"
  echo "  --agents          Configurer les agents"
  echo "  --clean, -c       Nettoyer les fichiers temporaires"
  echo "  --report, -r      Générer un rapport de structure"
  echo "  --verify, -v      Vérifier l'intégrité de la structure"
  echo "  --interactive, -i Afficher le menu interactif"
  echo "  --help, -h        Afficher cette aide"
  exit 0
fi

if [ $# -eq 0 ]; then
  # Sans arguments, on affiche le menu interactif
  show_menu
else
  # Traitement des arguments
  case "$1" in
    --all|-a) run_all ;;
    --backup|-b) create_backup ;;
    --docs|-d) organize_docs ;;
    --scripts|-s) organize_scripts ;;
    --workflows|-w) organize_workflows ;;
    --agents) setup_agents ;;
    --clean|-c) clean_project ;;
    --report|-r) generate_structure_report ;;
    --verify|-v) verify_structure ;;
    --interactive|-i) show_menu ;;
    *) log_error "Option non reconnue: $1" && echo "Utilisez --help pour afficher l'aide" && exit 1 ;;
  esac
fi

#!/bin/bash

# Script pour organiser les fichiers du projet en une structure plus logique
# Date de création: $(date +"%Y-%m-%d %H:%M:%S")

# Variables
DRY_RUN=true
BACKUP_DIR="./structure/backup-reorganization-$(date +"%Y%m%d-%H%M%S")"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Traitement des arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --execute)
      DRY_RUN=false
      shift
      ;;
    --help|-h)
      echo -e "${BLUE}Utilisation:${NC} $0 [options]"
      echo ""
      echo "Options:"
      echo "  --execute    Exécuter réellement les déplacements (par défaut: dry-run)"
      echo "  --help, -h   Afficher cette aide"
      exit 0
      ;;
    *)
      echo -e "${RED}Option inconnue:${NC} $1"
      exit 1
      ;;
  esac
done

# Afficher le mode d'exécution
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 Mode simulation (dry-run): aucun déplacement ne sera effectué${NC}"
  echo -e "   Utilisez ${GREEN}--execute${NC} pour effectuer réellement les déplacements"
else
  echo -e "${GREEN}⚙️ Mode d'exécution: les fichiers vont être réorganisés${NC}"
  # Création du répertoire de backup au cas où
  mkdir -p "$BACKUP_DIR"
  echo -e "${BLUE}📁 Une sauvegarde sera créée dans: ${BACKUP_DIR}${NC}"
fi

# Fonction pour créer un répertoire si nécessaire
create_directory() {
  local dir=$1
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$dir"
    echo -e "${GREEN}📁 Créé: ${dir}${NC}"
  else
    echo -e "${BLUE}📁 Serait créé: ${dir}${NC}"
  fi
}

# Fonction pour déplacer un fichier
move_file() {
  local source=$1
  local destination=$2
  
  if [ ! -f "$source" ]; then
    echo -e "${YELLOW}❓ Fichier source introuvable: ${source}${NC}"
    return
  fi
  
  # Créer le répertoire de destination si nécessaire
  local dest_dir=$(dirname "$destination")
  create_directory "$dest_dir"
  
  if [ "$DRY_RUN" = false ]; then
    # Backup du fichier
    local backup_dir=$(dirname "${BACKUP_DIR}/${source}")
    mkdir -p "$backup_dir"
    cp "$source" "${BACKUP_DIR}/${source}"
    
    # Déplacer le fichier
    mv "$source" "$destination"
    echo -e "${GREEN}🚚 Déplacé: ${source} → ${destination}${NC}"
  else
    echo -e "${BLUE}🚚 Serait déplacé: ${source} → ${destination}${NC}"
  fi
}

# Fonction pour fusionner des fichiers
merge_files() {
  local dest_file=$1
  shift
  local source_files=("$@")
  
  if [ ${#source_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Aucun fichier source spécifié pour la fusion${NC}"
    return
  fi
  
  # Vérifier si tous les fichiers sources existent
  local all_exist=true
  for file in "${source_files[@]}"; do
    if [ ! -f "$file" ]; then
      echo -e "${YELLOW}❓ Fichier source pour fusion introuvable: ${file}${NC}"
      all_exist=false
    fi
  done
  
  if [ "$all_exist" = false ]; then
    echo -e "${YELLOW}⚠️ Certains fichiers sources n'existent pas, fusion annulée${NC}"
    return
  fi
  
  # Créer le répertoire de destination si nécessaire
  local dest_dir=$(dirname "$dest_file")
  create_directory "$dest_dir"
  
  if [ "$DRY_RUN" = false ]; then
    # En-tête du fichier fusionné
    echo "/**" > "$dest_file"
    echo " * Fichier fusionné automatiquement par organize-project.sh" >> "$dest_file"
    echo " * Date: $(date +"%Y-%m-%d %H:%M:%S")" >> "$dest_file"
    echo " * " >> "$dest_file"
    echo " * Fichiers sources :" >> "$dest_file"
    
    # Fusionner les fichiers
    for file in "${source_files[@]}"; do
      # Backup du fichier source
      local backup_dir=$(dirname "${BACKUP_DIR}/${file}")
      mkdir -p "$backup_dir"
      cp "$file" "${BACKUP_DIR}/${file}"
      
      # Ajouter le nom du fichier source à l'en-tête
      echo " * - ${file}" >> "$dest_file"
      
      # Ajouter une séparation
      echo -e "\n// ============================================================" >> "$dest_file"
      echo "// Contenu de ${file}" >> "$dest_file"
      echo -e "// ============================================================\n" >> "$dest_file"
      
      # Ajouter le contenu du fichier
      cat "$file" >> "$dest_file"
      echo -e "\n" >> "$dest_file"
      
      # Supprimer le fichier source
      rm "$file"
      echo -e "${GREEN}🔄 Fusionné: ${file} dans ${dest_file}${NC}"
    done
    
    echo " */" >> "$dest_file"
    echo -e "${GREEN}✅ Fusion terminée: ${dest_file}${NC}"
  else
    echo -e "${BLUE}🔄 Seraient fusionnés dans ${dest_file}:${NC}"
    for file in "${source_files[@]}"; do
      echo -e "${BLUE}   - ${file}${NC}"
    done
  fi
}

# Création des dossiers principaux
echo -e "${BLUE}🔍 Création des dossiers principaux...${NC}"

create_directory "business"
create_directory "coordination"
create_directory "shared"
create_directory "orchestration"

# Création des sous-dossiers
echo -e "${BLUE}🔍 Création des sous-dossiers...${NC}"

# Sous-dossiers pour business
create_directory "business/migration"
create_directory "business/seo"
create_directory "business/database"
create_directory "business/agents"

# Sous-dossiers pour coordination
create_directory "coordination/migration"
create_directory "coordination/interfaces"
create_directory "coordination/validation"

# Sous-dossiers pour shared
create_directory "shared/types"
create_directory "shared/config"
create_directory "shared/utils"
create_directory "shared/documentation"

# Sous-dossiers pour orchestration
create_directory "orchestration/core"
create_directory "orchestration/docker"
create_directory "orchestration/scripts"
create_directory "orchestration/workflows"

# Organisation des fichiers à la racine
echo -e "${BLUE}🔍 Organisation des fichiers à la racine...${NC}"

# Docker et orchestration
move_file "docker-compose.yml" "orchestration/docker/docker-compose.yml"
move_file "docker-compose.bullmq.yml" "orchestration/docker/docker-compose.bullmq.yml"
move_file "docker-compose.dev.yml" "orchestration/docker/docker-compose.dev.yml"
move_file "docker-compose.mcp.yml" "orchestration/docker/docker-compose.mcp.yml"
move_file "docker-compose.n8n.yml" "orchestration/docker/docker-compose.n8n.yml"
move_file "Dockerfile" "orchestration/docker/Dockerfile"
move_file "Dockerfile.nestjs" "orchestration/docker/Dockerfile.nestjs"
move_file "Dockerfile.remix" "orchestration/docker/Dockerfile.remix"
move_file "Dockerfile.supabase" "orchestration/docker/Dockerfile.supabase"
move_file "Dockerfile.temporal-worker" "orchestration/docker/Dockerfile.temporal-worker"

# Scripts d'orchestration
move_file "analyze-htaccess.sh" "orchestration/scripts/analyze-htaccess.sh"
move_file "check-methods-implementation.sh" "orchestration/scripts/check-methods-implementation.sh"
move_file "ci-validate.sh" "orchestration/scripts/ci-validate.sh"
move_file "clean-agents-duplicates.sh" "orchestration/scripts/clean-agents-duplicates.sh"
move_file "cleanup-legacy-agents.sh" "orchestration/scripts/cleanup-legacy-agents.sh"
move_file "configure-missed-urls-alerts.sh" "orchestration/scripts/configure-missed-urls-alerts.sh"
move_file "consolidate-migration.sh" "orchestration/scripts/consolidate-migration.sh"
move_file "docs-routes-mappings.sh" "orchestration/scripts/docs-routes-mappings.sh"
move_file "emergency-typescript-fix.sh" "orchestration/scripts/emergency-typescript-fix.sh"
move_file "finalize-migration-cleanup.sh" "orchestration/scripts/finalize-migration-cleanup.sh"
move_file "fix-agent-errors.sh" "orchestration/scripts/fix-agent-errors.sh"
move_file "fix-all-agents.sh" "orchestration/scripts/fix-all-agents.sh"
move_file "fix-eslint-installation.sh" "orchestration/scripts/fix-eslint-installation.sh"
move_file "fix-htaccess-agent.sh" "orchestration/scripts/fix-htaccess-agent.sh"
move_file "fix-persistent-errors.sh" "orchestration/scripts/fix-persistent-errors.sh"
move_file "fix-tsconfig-includes.sh" "orchestration/scripts/fix-tsconfig-includes.sh"
move_file "generate-agents-documentation.sh" "orchestration/scripts/generate-agents-documentation.sh"
move_file "implement-all-interfaces.sh" "orchestration/scripts/implement-all-interfaces.sh"
move_file "implement-interfaces.sh" "orchestration/scripts/implement-interfaces.sh"
move_file "implement-missing-methods.sh" "orchestration/scripts/implement-missing-methods.sh"
move_file "improve-agent-tests.sh" "orchestration/scripts/improve-agent-tests.sh"
move_file "install-dependencies.sh" "orchestration/scripts/install-dependencies.sh"
move_file "install-missing-dependencies.sh" "orchestration/scripts/install-missing-dependencies.sh"
move_file "integrate-orphan-agents.sh" "orchestration/scripts/integrate-orphan-agents.sh"
move_file "migrate-agents.sh" "orchestration/scripts/migrate-agents.sh"
move_file "n8n-setup.sh" "orchestration/scripts/n8n-setup.sh"

# Workflows n8n
move_file "n8n.diff-verifier.json" "orchestration/workflows/n8n.diff-verifier.json"
move_file "n8n.migration-orchestrator.json" "orchestration/workflows/n8n.migration-orchestrator.json"
move_file "n8n.migration.json" "orchestration/workflows/n8n.migration.json"
move_file "n8n.monitoring.json" "orchestration/workflows/n8n.monitoring.json"
move_file "n8n.monorepo-analyzer.json" "orchestration/workflows/n8n.monorepo-analyzer.json"
move_file "n8n.pipeline.clean.json" "orchestration/workflows/n8n.pipeline.clean.json"
move_file "n8n.pipeline.json" "orchestration/workflows/n8n.pipeline.json"

# Business - Agents et implémentations
move_file "adapt-agents.ts" "business/agents/adapt-agents.ts"
move_file "agent-interface-validator.ts" "coordination/interfaces/agent-interface-validator.ts"
move_file "implement-interfaces-agent.ts" "coordination/interfaces/implement-interfaces-agent.ts"
move_file "implement-interfaces.ts" "coordination/interfaces/implement-interfaces.ts"
move_file "detect-agent-methods.ts" "business/agents/detect-agent-methods.ts"
move_file "fix-agent-typescript-errors.ts" "business/agents/fix-agent-typescript-errors.ts"
move_file "generate-agent-manifest.ts" "business/agents/generate-agent-manifest.ts"

# Configuration et manifestes
move_file "agent-import-mapping.json" "shared/config/agent-import-mapping.json"
move_file "agent-manifest.json" "shared/config/agent-manifest.json"
move_file "MCPManifest.json" "shared/config/MCPManifest.json"
move_file "migration-config.json" "shared/config/migration-config.json"
move_file "backlog.json" "shared/config/backlog.json"
move_file "backlog.mcp.json" "shared/config/backlog.mcp.json"
move_file "biome.json" "shared/config/biome.json"
move_file "discovery_map.json" "shared/config/discovery_map.json"

# Business - Migration et SQL
move_file "migration_checklist.sql" "business/database/migration_checklist.sql"
move_file "analyse_sql_recommandations.sql" "business/database/analyse_sql_recommandations.sql"
move_file "mcp-routes.ts" "business/migration/mcp-routes.ts"
move_file "index.ts" "business/migration/index.ts"

# Rapports et documentation
move_file "agent-migration-report-20250418-175114.md" "shared/documentation/agent-migration-report-20250418-175114.md"
move_file "agent-migration-report-20250418-175257.md" "shared/documentation/agent-migration-report-20250418-175257.md"
move_file "agent-statistics-report.md" "shared/documentation/agent-statistics-report.md"
move_file "complete-migration-verification-20250420-015853.md" "shared/documentation/complete-migration-verification-20250420-015853.md"
move_file "ARCHITECTURE.md" "shared/documentation/ARCHITECTURE.md"
move_file "migration-report.json" "shared/documentation/migration-report.json"
move_file "migration-results-2025-04-10T22-42-27-339Z.json" "shared/documentation/migration-results-2025-04-10T22-42-27-339Z.json"
move_file "migration-results-2025-04-10T23-01-27-662Z.json" "shared/documentation/migration-results-2025-04-10T23-01-27-662Z.json"
move_file "migration-results-2025-04-10T23-02-53-998Z.json" "shared/documentation/migration-results-2025-04-10T23-02-53-998Z.json"

# Dashboard
move_file "dashboard-architecture.tsx" "business/dashboard/dashboard-architecture.tsx"
move_file "dashboard-prisma-migration.tsx" "business/dashboard/dashboard-prisma-migration.tsx"
move_file "dashboard-quality-scores.tsx" "business/dashboard/dashboard-quality-scores.tsx"
move_file "dashboard-seo-migration.tsx" "business/dashboard/dashboard-seo-migration.tsx"
move_file "dashboard.html" "business/dashboard/dashboard.html"

# Fusionner les fichiers similaires
echo -e "${BLUE}🔍 Fusion des fichiers similaires...${NC}"

# Fusionner les fichiers de listes
merge_files "shared/documentation/clickable_lists.txt" "clickable_file_list.txt" "clickable_list.txt"

# Fin du script
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}✨ Simulation terminée. Aucune modification n'a été effectuée.${NC}"
  echo -e "   Pour effectuer réellement les déplacements, utilisez: $0 --execute"
else
  echo -e "${GREEN}✨ Réorganisation terminée! Les fichiers ont été déplacés vers leurs nouveaux emplacements.${NC}"
  echo -e "   Une sauvegarde a été créée dans: ${BACKUP_DIR}"
  
  # Afficher la nouvelle structure
  echo -e "${BLUE}📊 Nouvelle structure du projet:${NC}"
  find . -type d -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git*" | sort | sed -e "s/[^-][^\/]*\// |  /g" -e "s/|\([^ ]\)/| - \1/"
fi