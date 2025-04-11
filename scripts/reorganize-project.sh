#!/bin/bash

# Script amélioré pour réorganiser la structure du projet
# Utilisation: bash reorganize-project.sh [--auto] [--clean] [--no-backup]
#   --auto      : Exécution automatique sans demander de confirmation
#   --clean     : Supprime les anciens fichiers/dossiers après copie réussie
#   --no-backup : Ne crée pas de sauvegarde avant réorganisation

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Traitement des arguments
AUTO_MODE=false
CLEAN_MODE=false
NO_BACKUP=false

for arg in "$@"; do
  case $arg in
    --auto)
      AUTO_MODE=true
      ;;
    --clean)
      CLEAN_MODE=true
      ;;
    --no-backup)
      NO_BACKUP=true
      ;;
    --help)
      echo "Usage: $0 [--auto] [--clean] [--no-backup]"
      echo "  --auto      : Exécution automatique sans demander de confirmation"
      echo "  --clean     : Supprime les anciens fichiers/dossiers après copie réussie"
      echo "  --no-backup : Ne crée pas de sauvegarde avant réorganisation"
      exit 0
      ;;
  esac
done

# Création d'un fichier de log
LOG_FILE="logs/reorganization-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

# Fonction pour logger
log() {
  local message="$1"
  local level="${2:-INFO}"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  case $level in
    INFO)
      echo -e "${BLUE}$message${NC}"
      ;;
    SUCCESS)
      echo -e "${GREEN}✅ $message${NC}"
      ;;
    WARNING)
      echo -e "${YELLOW}⚠️ $message${NC}"
      ;;
    ERROR)
      echo -e "${RED}❌ $message${NC}"
      ;;
    *)
      echo -e "$message"
      ;;
  esac
}

# Fonction pour afficher une bannière
show_banner() {
  echo -e "${BLUE}${BOLD}"
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║                                                      ║"
  echo "║       🚀 Réorganisation du Cahier des Charges        ║"
  echo "║                                                      ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Fonction pour vérifier si une commande existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Fonction pour créer une sauvegarde
create_backup() {
  if [ "$NO_BACKUP" = true ]; then
    log "Sauvegarde désactivée par l'utilisateur" "WARNING"
    return 0
  fi
  
  log "Création d'une sauvegarde avant réorganisation..." "INFO"
  
  local backup_file="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  local dirs_to_backup=("cahier" "scripts" "agents" "tools" "rules")
  local files_to_backup=("manage-cahier.sh" "cahier_check.config.json" "README.md")
  
  # Créer la liste des fichiers/dossiers à sauvegarder
  local items_to_backup=()
  
  for dir in "${dirs_to_backup[@]}"; do
    if [ -d "$dir" ]; then
      items_to_backup+=("$dir")
    fi
  done
  
  for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
      items_to_backup+=("$file")
    fi
  done
  
  if [ ${#items_to_backup[@]} -eq 0 ]; then
    log "Aucun fichier à sauvegarder" "WARNING"
    return 0
  fi
  
  if tar -czf "$backup_file" "${items_to_backup[@]}" 2>/dev/null; then
    log "Sauvegarde créée: $backup_file" "SUCCESS"
    return 0
  else
    log "Échec de la création de la sauvegarde" "ERROR"
    
    if [ "$AUTO_MODE" = false ]; then
      read -p "Continuer quand même? [y/N] " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Réorganisation annulée par l'utilisateur" "INFO"
        exit 1
      fi
    fi
    
    return 1
  fi
}

# Fonction pour créer la structure de répertoires
create_directory_structure() {
  log "Création de la structure de répertoires..." "INFO"
  
  # Structure principale (avec vérification)
  local dirs=(
    "cahier-des-charges/docs"
    "cahier-des-charges/audits"
    "cahier-des-charges/backlogs"
    "cahier-des-charges/impact-graphs"
    "cahier-des-charges/rapports"
    "scripts/verifiers"
    "scripts/utils"
    "scripts/templates"
    "agents"
    "tools"
    "rules"
    "logs"
    "dist"
  )
  
  local created_count=0
  for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      mkdir -p "$dir"
      if [ $? -eq 0 ]; then
        created_count=$((created_count+1))
        log "Répertoire créé: $dir" "INFO" 
      else
        log "Échec de la création du répertoire: $dir" "ERROR"
      fi
    else
      log "Répertoire existant: $dir" "INFO"
    fi
  done
  
  # Structure spécifique pour les audits
  mkdir -p cahier-des-charges/audits/{pages,api,core,admin}
  
  log "$created_count nouveaux répertoires créés" "SUCCESS"
}

# Fonction pour copier et trier les fichiers
migrate_files() {
  log "Migration des fichiers vers la nouvelle structure..." "INFO"
  
  local copied_count=0
  local error_count=0
  
  # Fonction pour copier un fichier
  copy_file() {
    local src="$1"
    local dst="$2"
    local type="$3"
    
    # Créer le répertoire de destination si nécessaire
    mkdir -p "$(dirname "$dst")"
    
    if cp "$src" "$dst"; then
      copied_count=$((copied_count+1))
      log "Fichier $type copié: $(basename "$src")" "SUCCESS"
      return 0
    else
      error_count=$((error_count+1))
      log "Échec de la copie du fichier $type: $src" "ERROR"
      return 1
    fi
  }
  
  # Déplacer les fichiers principaux
  if [ -d "cahier" ]; then
    # Fichier de sommaire
    if [ -f "cahier/00-sommaire.md" ]; then
      copy_file "cahier/00-sommaire.md" "cahier-des-charges/00-sommaire.md" "sommaire"
    fi
    
    # Documents numérotés
    for file in cahier/[0-9]*.md; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        copy_file "$file" "cahier-des-charges/docs/$filename" "document"
      fi
    done
    
    # Fichiers d'audit
    for file in cahier/*.audit.md; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        base_name="${filename%.audit.md}"
        
        # Déterminer le dossier de destination en fonction du type de fichier
        if [[ "$base_name" == *"api"* ]]; then
          dst_dir="cahier-des-charges/audits/api"
        elif [[ "$base_name" == *"admin"* ]]; then
          dst_dir="cahier-des-charges/audits/admin"
        else 
          dst_dir="cahier-des-charges/audits/pages"
        fi
        
        copy_file "$file" "$dst_dir/$filename" "audit"
      fi
    done
    
    # Fichiers de backlog
    for file in cahier/*.backlog.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        copy_file "$file" "cahier-des-charges/backlogs/$filename" "backlog"
      fi
    done
    
    # Fichiers de graphe d'impact
    for file in cahier/*.impact_graph.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        copy_file "$file" "cahier-des-charges/impact-graphs/$filename" "graphe d'impact"
      fi
    done
  fi
  
  # Déplacer les scripts si nécessaire
  if [ -d "scripts" ]; then
    for file in scripts/*.sh scripts/*.ts; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Déterminer le dossier de destination selon le nom du fichier
        if [[ "$filename" == *"verify"* || "$filename" == *"check"* || "$filename" == *"audit"* ]]; then
          dst_dir="scripts/verifiers"
        elif [[ "$filename" == *"util"* || "$filename" == *"helper"* ]]; then
          dst_dir="scripts/utils"
        else
          dst_dir="scripts"
        fi
        
        # Ne pas copier si c'est le fichier actuel
        if [[ "$file" != "scripts/reorganize-project.sh" ]]; then
          copy_file "$file" "$dst_dir/$filename" "script"
        fi
      fi
    done
  fi
  
  log "Migration terminée: $copied_count fichiers copiés, $error_count erreurs" "INFO"
  
  return $error_count
}

# Fonction pour mettre à jour les liens dans les fichiers
update_references() {
  log "Mise à jour des références dans les fichiers..." "INFO"
  
  local updated_count=0
  
  # Recherche des fichiers Markdown
  local md_files=$(find cahier-des-charges -name "*.md")
  
  for file in $md_files; do
    local original_content=$(cat "$file")
    local new_content
    
    # Mettre à jour les liens relatifs
    new_content=$(echo "$original_content" | sed 's|\.\./cahier/|\.\./|g' | sed 's|\.\.\/\.\.\/cahier\/|\.\.\/\.\.\/|g')
    new_content=$(echo "$new_content" | sed 's|\.\./audits/|\.\./cahier-des-charges/audits/|g')
    
    # Écrire le nouveau contenu si modifié
    if [ "$original_content" != "$new_content" ]; then
      echo "$new_content" > "$file"
      updated_count=$((updated_count+1))
      log "Références mises à jour dans: $file" "INFO"
    fi
  done
  
  log "$updated_count fichiers ont eu leurs références mises à jour" "SUCCESS"
}

# Fonction pour créer les fichiers de configuration
create_configuration_files() {
  log "Création des fichiers de configuration..." "INFO"
  
  # Créer .gitignore s'il n'existe pas
  if [ ! -f ".gitignore" ]; then
    cat > .gitignore << EOL
# Logs
logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of build processes
/dist
/build

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
.DS_Store

# Backups
backup-*.tar.gz
EOL
    log "Fichier .gitignore créé" "SUCCESS"
  fi
  
  # Créer/mettre à jour README.md
  cat > README.md << EOL
# Cahier des Charges - Migration PHP vers NestJS/Remix

Ce dépôt contient la documentation et les outils de gestion du cahier des charges pour la migration d'une application PHP vers NestJS/Remix.

## Structure du projet

- \`/cahier-des-charges/\` - Documentation principale du cahier des charges
  - \`/docs/\` - Documents généraux (architecture, stratégie, etc.)
  - \`/audits/\` - Analyse détaillée des fichiers existants
  - \`/backlogs/\` - Backlogs des tâches à effectuer
  - \`/impact-graphs/\` - Graphes d'impact et de dépendance
  - \`/rapports/\` - Rapports générés

- \`/scripts/\` - Scripts d'automatisation
  - \`/verifiers/\` - Scripts de vérification
  - \`/utils/\` - Utilitaires
  - \`/templates/\` - Templates pour la génération de fichiers

- \`/agents/\` - Agents IA d'analyse et de génération
- \`/tools/\` - Outils divers
- \`/rules/\` - Règles de configuration
- \`/logs/\` - Journaux d'exécution
- \`/dist/\` - Fichiers générés (HTML, PDF, etc.)

## Commandes principales

\`\`\`bash
# Démarrer le menu interactif
./manage-cahier.sh

# Vérifier le cahier des charges
./scripts/verify-cahier.sh

# Générer la vue HTML
./scripts/render-html.sh

# Exécuter tous les scripts en dry-run
./scripts/dry-run-all.sh

# Réorganiser le projet
./scripts/reorganize-project.sh
\`\`\`

## Maintenance

Ce projet est maintenu automatiquement par un système d'agents IA.
EOL
  log "Fichier README.md créé/mis à jour" "SUCCESS"
  
  # Créer/mettre à jour le fichier de configuration de l'organisation
  if [ ! -f "rules/organization.rules.json" ]; then
    cat > rules/organization.rules.json << EOL
{
  "directoryStructure": {
    "cahier-des-charges": {
      "docs": "Documentation principale",
      "audits": "Analyses détaillées des fichiers",
      "backlogs": "Backlogs de tâches",
      "impact-graphs": "Graphes d'impact et de dépendances",
      "rapports": "Rapports générés"
    },
    "scripts": {
      "verifiers": "Scripts de vérification",
      "utils": "Scripts utilitaires",
      "templates": "Templates pour génération"
    },
    "agents": "Agents IA",
    "tools": "Outils divers",
    "rules": "Règles de configuration",
    "logs": "Journaux d'exécution",
    "dist": "Fichiers générés"
  },
  "filenaming": {
    "audits": "{filename}.audit.md",
    "backlogs": "{filename}.backlog.json",
    "impactGraphs": "{filename}.impact_graph.json",
    "docs": "{nn}-{name}.md",
    "scripts": "{name}.sh",
    "agents": "agent-{name}.ts",
    "rules": "{name}.rules.json",
    "reports": "{type}-report-{timestamp}.md"
  },
  "linkUpdates": {
    "updateRelativePaths": true,
    "pathMappings": {
      "cahier/": "cahier-des-charges/",
      "audits/": "cahier-des-charges/audits/",
      "backlogs/": "cahier-des-charges/backlogs/"
    }
  },
  "checkFrequency": "daily"
}
EOL
    log "Fichier rules/organization.rules.json créé" "SUCCESS"
  fi
}

# Fonction pour rendre les scripts exécutables
make_scripts_executable() {
  log "Rendre les scripts exécutables..." "INFO"
  
  local scripts_count=0
  
  # Trouver tous les scripts .sh
  for script in $(find scripts -name "*.sh"); do
    chmod +x "$script"
    scripts_count=$((scripts_count+1))
    log "Script rendu exécutable: $script" "INFO"
  done
  
  # Rendre manage-cahier.sh exécutable s'il existe
  if [ -f "manage-cahier.sh" ]; then
    chmod +x manage-cahier.sh
    scripts_count=$((scripts_count+1))
    log "Script rendu exécutable: manage-cahier.sh" "INFO"
  fi
  
  log "$scripts_count scripts rendus exécutables" "SUCCESS"
}

# Fonction pour vérifier la qualité de la migration
verify_migration() {
  log "Vérification de la qualité de la migration..." "INFO"
  
  local errors=0
  
  # Vérifier que les dossiers critiques existent
  local critical_dirs=(
    "cahier-des-charges"
    "scripts"
    "agents"
    "rules"
  )
  
  for dir in "${critical_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      log "Dossier critique manquant: $dir" "ERROR"
      errors=$((errors+1))
    fi
  done
  
  # Vérifier que le fichier de sommaire a été copié
  if [ ! -f "cahier-des-charges/00-sommaire.md" ]; then
    log "Fichier de sommaire manquant" "WARNING"
  fi
  
  # Compter les fichiers dans les répertoires source et destination
  if [ -d "cahier" ]; then
    local source_count=$(find cahier -type f | wc -l)
    local dest_count=$(find cahier-des-charges -type f | wc -l)
    
    log "Fichiers source: $source_count, Fichiers destination: $dest_count" "INFO"
    
    if [ $dest_count -lt $source_count ]; then
      log "Attention: Certains fichiers n'ont pas été migrés ($((source_count - dest_count)) manquants)" "WARNING"
    fi
  fi
  
  # Vérifier que README.md a été créé
  if [ ! -f "README.md" ]; then
    log "README.md n'a pas été créé" "ERROR"
    errors=$((errors+1))
  fi
  
  if [ $errors -eq 0 ]; then
    log "Vérification réussie: la migration semble complète" "SUCCESS"
    return 0
  else
    log "Vérification terminée avec $errors erreurs" "WARNING"
    return 1
  fi
}

# Fonction pour nettoyer les anciens fichiers/dossiers
clean_old_files() {
  if [ "$CLEAN_MODE" = false ]; then
    log "Mode nettoyage désactivé. Les fichiers originaux sont conservés." "INFO"
    return 0
  fi
  
  if [ "$AUTO_MODE" = false ]; then
    log "Les fichiers suivants seront supprimés:" "WARNING"
    log "- Dossier 'cahier' et tout son contenu" "WARNING"
    
    read -p "Êtes-vous sûr de vouloir supprimer ces fichiers? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log "Nettoyage annulé par l'utilisateur" "INFO"
      return 0
    fi
  fi
  
  # Supprimer le dossier cahier
  if [ -d "cahier" ]; then
    log "Suppression du dossier 'cahier'..." "INFO"
    rm -rf "cahier"
    if [ $? -eq 0 ]; then
      log "Dossier 'cahier' supprimé avec succès" "SUCCESS"
    else
      log "Échec de la suppression du dossier 'cahier'" "ERROR"
    fi
  fi
  
  log "Nettoyage terminé" "SUCCESS"
}

# Fonction principale
main() {
  show_banner
  
  # Créer le répertoire logs si nécessaire
  mkdir -p logs
  
  log "Démarrage de la réorganisation du projet..." "INFO"
  
  # Confirmation si non automatique
  if [ "$AUTO_MODE" = false ]; then
    echo -e "${CYAN}Cette opération va réorganiser la structure de votre projet.${NC}"
    echo -e "${CYAN}Les fichiers seront copiés vers de nouveaux emplacements.${NC}"
    echo -e "${YELLOW}Options activées:${NC}"
    echo -e "- Mode automatique: ${AUTO_MODE}"
    echo -e "- Nettoyage: ${CLEAN_MODE}"
    echo -e "- Sans sauvegarde: ${NO_BACKUP}"
    
    read -p "Voulez-vous continuer? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log "Réorganisation annulée par l'utilisateur" "INFO"
      exit 0
    fi
  fi
  
  # Étapes de la réorganisation
  create_backup
  create_directory_structure
  migrate_files
  update_references
  create_configuration_files
  make_scripts_executable
  verify_migration
  
  # Nettoyage si demandé
  clean_old_files
  
  log "Réorganisation terminée avec succès!" "SUCCESS"
  log "Journal de réorganisation disponible: $LOG_FILE" "INFO"
  
  echo -e "${BLUE}${BOLD}📋 Prochaines étapes:${NC}"
  echo -e "  1. Consultez le journal pour vérifier d'éventuelles erreurs: $LOG_FILE"
  if [ "$CLEAN_MODE" = false ]; then
    echo -e "  2. Vérifiez manuellement que tous les fichiers ont été correctement copiés"
    echo -e "  3. Pour supprimer les anciens fichiers, relancez avec --clean"
  fi
  echo -e "  4. Mettez à jour vos références dans les scripts si nécessaire"
  echo -e "  5. Commitez les changements dans Git"
}

# Lancer le script
main
