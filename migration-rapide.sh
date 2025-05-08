#!/bin/bash

# ==============================================================================
# migration-rapide.sh - Script de migration rapide vers l'architecture à trois couches
# ==============================================================================
# 
# Ce script restructure automatiquement le projet selon l'architecture à trois couches:
# 1. Couche d'Orchestration: Gestion des workflows, coordination de haut niveau
# 2. Couche de Coordination: Communication entre agents, gestion des événements
# 3. Couche Business: Logique métier, traitement des données, analyse
#
# Auteur: GitHub Copilot
# Date: 7 mai 2025
# ==============================================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variables globales
ROOT_DIR=$(pwd)
BACKUP_DIR="${ROOT_DIR}/backup/architecture-migration-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${ROOT_DIR}/reports/architecture-migration-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
INTERACTIVE=false
VERBOSE=false
FIX_IMPORTS=true
SKIP_TESTS=false
CLEANUP_OLD_FILES=false
CLEANUP_DELAY=7 # Nombre de jours avant de considérer un fichier comme ancien

# Fonctions utilitaires
log() {
  echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[✅ SUCCÈS] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[⚠️ ATTENTION] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[❌ ERREUR] $1${NC}" | tee -a "$LOG_FILE"
  exit 1
}

header() {
  echo -e "\n${BOLD}${PURPLE}== $1 ==${NC}\n" | tee -a "$LOG_FILE"
}

ask() {
  local question=$1
  local default=$2
  
  if [ "$INTERACTIVE" = true ]; then
    read -p "$question [$default]: " answer
    echo ${answer:-$default}
  else
    echo $default
  fi
}

# Affichage du banner
show_banner() {
  clear
  echo -e "${BOLD}${PURPLE}=========================================================================${NC}"
  echo -e "${BOLD}${PURPLE}                  MIGRATION RAPIDE VERS ARCHITECTURE 3 COUCHES                 ${NC}"
  echo -e "${BOLD}${PURPLE}=========================================================================${NC}"
  echo -e "${YELLOW}Ce script restructure automatiquement le projet selon l'architecture à trois couches${NC}"
  echo -e "${GREEN}▸ Orchestration: Gestion des workflows, coordination de haut niveau${NC}"
  echo -e "${GREEN}▸ Coordination:  Communication entre agents, gestion des événements${NC}"
  echo -e "${GREEN}▸ Business:      Logique métier, traitement des données, analyse${NC}"
  echo -e "${BOLD}${PURPLE}=========================================================================${NC}\n"
}

# Fonction pour créer une sauvegarde
create_backup() {
  header "CRÉATION DE LA SAUVEGARDE"
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: sauvegarde non créée"
    return 0
  fi
  
  # Création du répertoire de sauvegarde
  mkdir -p "$BACKUP_DIR"
  
  # Liste des répertoires à sauvegarder
  local dirs_to_backup=(
    "agents"
    "apps"
    "packages"
    "tools"
  )
  
  for dir in "${dirs_to_backup[@]}"; do
    if [ -d "$dir" ]; then
      log "Sauvegarde de $dir..."
      cp -r "$dir" "$BACKUP_DIR/"
      success "Sauvegarde de $dir terminée"
    else
      warn "Répertoire $dir inexistant, sauvegarde ignorée"
    fi
  done
  
  success "Sauvegarde complète créée dans $BACKUP_DIR"
}

# Fonction pour créer la structure de base
create_base_structure() {
  header "CRÉATION DE LA STRUCTURE DE BASE"
  
  # Définition des dossiers principaux à créer
  local main_dirs=(
    "packages/orchestration/orchestrators"
    "packages/orchestration/schedulers"
    "packages/orchestration/monitors"
    "packages/orchestration/interfaces"
    "packages/coordination/bridges"
    "packages/coordination/adapters"
    "packages/coordination/mediators"
    "packages/coordination/interfaces"
    "packages/business/analyzers"
    "packages/business/generators"
    "packages/business/validators"
    "packages/business/parsers"
    "packages/business/interfaces"
    "packages/shared/models"
    "packages/shared/utils"
    "packages/shared/testing"
    "packages/shared/config"
  )
  
  for dir in "${main_dirs[@]}"; do
    if [ "$DRY_RUN" = true ]; then
      log "Mode simulation: mkdir -p $dir"
    else
      mkdir -p "$dir"
      log "Création du répertoire: $dir"
    fi
  done
  
  success "Structure de base créée"
}

# Fonction pour créer les fichiers package.json pour chaque package
create_package_files() {
  header "CRÉATION DES FICHIERS PACKAGE.JSON"
  
  # Liste des packages à configurer
  local packages=(
    "orchestration"
    "coordination"
    "business"
    "shared"
  )
  
  for pkg in "${packages[@]}"; do
    local pkg_file="packages/${pkg}/package.json"
    
    if [ "$DRY_RUN" = true ]; then
      log "Mode simulation: création de $pkg_file"
    else
      if [ ! -f "$pkg_file" ]; then
        cat > "$pkg_file" << EOF
{
  "name": "@packages/${pkg}",
  "version": "1.0.0",
  "description": "Module ${pkg} pour l'architecture à trois couches",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "biome lint ."
  },
  "dependencies": {
    "@packages/shared": "workspace:*"
  },
  "devDependencies": {}
}
EOF
        log "Création du fichier package.json pour $pkg"
      else
        warn "Le fichier $pkg_file existe déjà, pas de modification"
      fi
    fi
  done
  
  # Mise à jour du fichier pnpm-workspace.yaml si nécessaire
  if [ -f "pnpm-workspace.yaml" ]; then
    if ! grep -q "packages/orchestration" "pnpm-workspace.yaml" || ! grep -q "packages/coordination" "pnpm-workspace.yaml" || ! grep -q "packages/business" "pnpm-workspace.yaml"; then
      if [ "$DRY_RUN" = true ]; then
        log "Mode simulation: mise à jour de pnpm-workspace.yaml"
      else
        # Création d'une sauvegarde du fichier
        cp "pnpm-workspace.yaml" "${BACKUP_DIR}/pnpm-workspace.yaml.bak"
        
        # Vérifier si le fichier a déjà une structure de packages
        if grep -q "packages:" "pnpm-workspace.yaml"; then
          # Ajouter nos nouveaux packages s'ils ne sont pas déjà présents
          if ! grep -q "- 'packages/orchestration'" "pnpm-workspace.yaml"; then
            sed -i "/packages:/a \ \ - 'packages/orchestration'" "pnpm-workspace.yaml"
          fi
          if ! grep -q "- 'packages/coordination'" "pnpm-workspace.yaml"; then
            sed -i "/packages:/a \ \ - 'packages/coordination'" "pnpm-workspace.yaml"
          fi
          if ! grep -q "- 'packages/business'" "pnpm-workspace.yaml"; then
            sed -i "/packages:/a \ \ - 'packages/business'" "pnpm-workspace.yaml"
          fi
          if ! grep -q "- 'packages/shared'" "pnpm-workspace.yaml"; then
            sed -i "/packages:/a \ \ - 'packages/shared'" "pnpm-workspace.yaml"
          fi
        else
          # Ajouter une nouvelle section packages
          cat >> "pnpm-workspace.yaml" << EOF

packages:
  - 'packages/orchestration'
  - 'packages/coordination'
  - 'packages/business'
  - 'packages/shared'
EOF
        fi
        
        log "pnpm-workspace.yaml mis à jour pour inclure les nouveaux packages"
      fi
    else
      log "pnpm-workspace.yaml déjà configuré correctement"
    fi
  else
    if [ "$DRY_RUN" = true ]; then
      log "Mode simulation: création de pnpm-workspace.yaml"
    else
      # Créer le fichier s'il n'existe pas
      cat > "pnpm-workspace.yaml" << EOF
packages:
  - 'packages/orchestration'
  - 'packages/coordination'
  - 'packages/business'
  - 'packages/shared'
  - 'apps/*'
EOF
      log "pnpm-workspace.yaml créé"
    fi
  fi
  
  success "Fichiers package.json et configuration workspace créés"
}

# Fonction pour migrer les agents existants
migrate_agents() {
  header "MIGRATION DES AGENTS"
  
  if [ ! -d "agents" ]; then
    warn "Aucun répertoire 'agents' trouvé, migration des agents ignorée"
    return 0
  fi
  
  log "Analyse des agents existants..."
  
  # Mappings pour la migration des agents
  local agent_mappings=(
    # Format: "pattern:destination"
    "*analyzer*:business/analyzers"
    "*validator*:business/validators"
    "*parser*:business/parsers"
    "*generator*:business/generators"
    "*orchestrator*:orchestration/orchestrators"
    "*scheduler*:orchestration/schedulers"
    "*monitor*:orchestration/monitors"
    "*bridge*:coordination/bridges"
    "*adapter*:coordination/adapters"
    "*mediator*:coordination/mediators"
    "*integration*:coordination/bridges"
    "*connector*:coordination/adapters"
  )
  
  # Parcourir tous les fichiers dans le répertoire agents
  find "agents" -type f -name "*.ts" -o -name "*.js" | while read agent_file; do
    local filename=$(basename "$agent_file")
    local destination=""
    
    # Déterminer la destination en fonction du nom du fichier
    for mapping in "${agent_mappings[@]}"; do
      local pattern=$(echo "$mapping" | cut -d':' -f1)
      local dest=$(echo "$mapping" | cut -d':' -f2)
      
      if [[ "$filename" == $pattern ]]; then
        destination="packages/$dest"
        break
      fi
    done
    
    # Si aucune correspondance n'a été trouvée, utiliser une destination par défaut
    if [ -z "$destination" ]; then
      # Analyser le contenu du fichier pour déterminer son type
      if grep -q "analyze\|process\|extract" "$agent_file"; then
        destination="packages/business/analyzers"
      elif grep -q "validate\|check\|verify" "$agent_file"; then
        destination="packages/business/validators"
      elif grep -q "generate\|create\|build" "$agent_file"; then
        destination="packages/business/generators"
      elif grep -q "orchestrate\|coordinate\|manage" "$agent_file"; then
        destination="packages/orchestration/orchestrators"
      else
        # Par défaut, si on ne peut pas déterminer le type
        destination="packages/business/analyzers"
      fi
    fi
    
    # Créer le répertoire de destination s'il n'existe pas
    mkdir -p "$destination"
    
    if [ "$DRY_RUN" = true ]; then
      log "Mode simulation: migration de $agent_file vers $destination/$filename"
    else
      cp "$agent_file" "$destination/$filename"
      log "Agent migré: $agent_file → $destination/$filename"
      
      # Créer un fichier de redirection pour assurer la compatibilité
      local agent_dir=$(dirname "$agent_file")
      mkdir -p "$agent_dir"
      
      cat > "${agent_file}.redirect.js" << EOF
/**
 * @deprecated Ce fichier est une redirection temporaire pour la compatibilité.
 * Veuillez mettre à jour vos imports vers le nouveau chemin.
 */
console.warn('DEPRECATED: Importing from $(dirname "$agent_file")/$filename is deprecated. Please update your imports.');
module.exports = require('$(echo $destination | sed "s|packages/|@packages/|")/$filename');
EOF
      warn "Redirection créée: ${agent_file}.redirect.js → $destination/$filename"
    fi
  done
  
  success "Migration des agents terminée"
}

# Fonction pour migrer les applications
migrate_apps() {
  header "MIGRATION DES APPLICATIONS"
  
  if [ ! -d "apps" ]; then
    warn "Aucun répertoire 'apps' trouvé, migration des applications ignorée"
    return 0
  fi
  
  log "Préservation de la structure des applications..."
  
  # Les applications restent dans leur emplacement actuel
  # Nous allons simplement mettre à jour les imports si nécessaire
  
  if [ "$FIX_IMPORTS" = true ] && [ "$DRY_RUN" = false ]; then
    log "Analyse des imports dans les applications..."
    
    # Parcourir tous les fichiers TypeScript/JavaScript dans les applications
    find "apps" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) | while read app_file; do
      # Détecter et mettre à jour les imports des agents
      if grep -q "from ['\"].*agents/" "$app_file" || grep -q "import.*from.*agents/" "$app_file"; then
        sed -i 's/from \(['"'"'"]\).*agents\/\([^\/]*\)/from \1@packages\/business\/analyzers\/\2/g' "$app_file"
        warn "Imports mis à jour dans $app_file (agents → packages/business)"
      fi
      
      # Autres mises à jour d'imports spécifiques peuvent être ajoutées ici
    done
  fi
  
  success "Migration des applications terminée"
}

# Fonction pour migrer les outils
migrate_tools() {
  header "MIGRATION DES OUTILS"
  
  if [ ! -d "tools" ]; then
    warn "Aucun répertoire 'tools' trouvé, migration des outils ignorée"
    return 0
  fi
  
  log "Analyse des outils existants..."
  
  # Mappings pour la migration des outils
  local tool_mappings=(
    # Format: "pattern:destination"
    "*orchestrat*:orchestration/tools"
    "*workflow*:orchestration/tools"
    "*monitor*:orchestration/tools"
    "*analyze*:business/tools"
    "*validat*:business/tools"
    "*generat*:business/tools"
    "*migrat*:business/tools"
    "*sql*:business/tools"
    "*php*:business/tools"
    "*test*:shared/testing"
    "*config*:shared/config"
    "*util*:shared/utils"
  )
  
  # Parcourir tous les fichiers dans le répertoire tools
  find "tools" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.sh" \) | while read tool_file; do
    local filename=$(basename "$tool_file")
    local dirname=$(dirname "$tool_file" | sed 's|^tools/||')
    local destination=""
    
    # Déterminer la destination en fonction du nom du fichier
    for mapping in "${tool_mappings[@]}"; do
      local pattern=$(echo "$mapping" | cut -d':' -f1)
      local dest=$(echo "$mapping" | cut -d':' -f2)
      
      if [[ "$filename" == $pattern ]]; then
        destination="packages/$dest"
        break
      fi
    done
    
    # Si aucune correspondance n'a été trouvée, conserver la structure de répertoire
    if [ -z "$destination" ]; then
      if [[ "$dirname" == "scripts" ]]; then
        destination="packages/shared/scripts"
      else
        destination="packages/shared/tools/$dirname"
      fi
    fi
    
    # Créer le répertoire de destination s'il n'existe pas
    mkdir -p "$destination"
    
    if [ "$DRY_RUN" = true ]; then
      log "Mode simulation: migration de $tool_file vers $destination/$filename"
    else
      cp "$tool_file" "$destination/$filename"
      log "Outil migré: $tool_file → $destination/$filename"
    fi
  done
  
  success "Migration des outils terminée"
}

# Fonction pour générer les interfaces TypeScript
generate_interfaces() {
  header "GÉNÉRATION DES INTERFACES"
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: génération des interfaces ignorée"
    return 0
  fi
  
  # Créer des interfaces de base pour chaque couche
  
  # Interface pour la couche business
  cat > "packages/business/interfaces/BusinessAgent.ts" << EOF
/**
 * Interface de base pour les agents métier
 */
export interface BusinessAgent {
  /**
   * Identifiant unique de l'agent
   */
  id: string;
  
  /**
   * Nom de l'agent
   */
  name: string;
  
  /**
   * Description de l'agent
   */
  description: string;
  
  /**
   * Exécute l'agent avec les données fournies
   * @param data Données d'entrée pour l'agent
   * @returns Résultat du traitement
   */
  execute(data: unknown): Promise<unknown>;
}
EOF
  log "Interface BusinessAgent créée"
  
  # Interface pour la couche orchestration
  cat > "packages/orchestration/interfaces/Orchestrator.ts" << EOF
/**
 * Interface de base pour les orchestrateurs
 */
export interface Orchestrator {
  /**
   * Identifiant unique de l'orchestrateur
   */
  id: string;
  
  /**
   * Nom de l'orchestrateur
   */
  name: string;
  
  /**
   * Description de l'orchestrateur
   */
  description: string;
  
  /**
   * Démarre l'orchestration avec les paramètres fournis
   * @param params Paramètres d'initialisation
   * @returns Résultat de l'orchestration
   */
  orchestrate(params: unknown): Promise<unknown>;
  
  /**
   * Arrête l'orchestration en cours
   */
  stop(): Promise<void>;
}
EOF
  log "Interface Orchestrator créée"
  
  # Interface pour la couche coordination
  cat > "packages/coordination/interfaces/Coordinator.ts" << EOF
/**
 * Interface de base pour les coordinateurs
 */
export interface Coordinator {
  /**
   * Identifiant unique du coordinateur
   */
  id: string;
  
  /**
   * Nom du coordinateur
   */
  name: string;
  
  /**
   * Description du coordinateur
   */
  description: string;
  
  /**
   * Coordonne l'exécution entre différents composants
   * @param source Composant source
   * @param target Composant cible
   * @param data Données à transmettre
   */
  coordinate(source: unknown, target: unknown, data: unknown): Promise<void>;
  
  /**
   * Récupère les informations sur les connexions actives
   */
  getConnections(): Promise<unknown[]>;
}
EOF
  log "Interface Coordinator créée"
  
  success "Interfaces de base générées"
}

# Fonction pour mettre à jour les imports dans tous les fichiers
fix_imports() {
  header "MISE À JOUR DES IMPORTS"
  
  if [ "$FIX_IMPORTS" = false ]; then
    log "Mise à jour des imports désactivée, ignorée"
    return 0
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: mise à jour des imports ignorée"
    return 0
  fi
  
  log "Analyse et mise à jour des imports dans les fichiers..."
  
  # Créer un tableau de mappings d'importation
  declare -A import_mappings
  import_mappings["agents"]="@packages/business"
  import_mappings["orchestrators"]="@packages/orchestration"
  import_mappings["tools/scripts"]="@packages/shared/scripts"
  import_mappings["tools/utils"]="@packages/shared/utils"
  
  # Recherche de tous les fichiers TypeScript et JavaScript
  find "${ROOT_DIR}" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/backup/*" | while read file; do
    local modified=false
    
    # Vérifier et mettre à jour les imports pour chaque mapping
    for old_path in "${!import_mappings[@]}"; do
      local new_path=${import_mappings[$old_path]}
      
      # Détecter les imports relatifs et absolus
      if grep -q "from ['\"].*$old_path/" "$file" || grep -q "import.*from.*$old_path/" "$file"; then
        # Créer une sauvegarde du fichier avant modification
        cp "$file" "${file}.bak"
        
        # Mettre à jour les imports
        sed -i "s|from ['\"]\\(.*\\)$old_path/|from \"$new_path/|g" "$file"
        modified=true
      fi
    done
    
    if [ "$modified" = true ]; then
      warn "Imports mis à jour dans $file"
    fi
  done
  
  success "Mise à jour des imports terminée"
}

# Fonction pour générer un rapport de migration
generate_report() {
  header "GÉNÉRATION DU RAPPORT DE MIGRATION"
  
  local report_file="${ROOT_DIR}/reports/rapport-migration-architecture-$(date +%Y%m%d-%H%M%S).md"
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: génération du rapport ignorée"
    return 0
  fi
  
  # Assurer que le répertoire existe
  mkdir -p "$(dirname "$report_file")"
  
  cat > "$report_file" << EOF
# Rapport de migration vers l'architecture à trois couches

Date: $(date +%Y-%m-%d\ %H:%M:%S)

## Résumé

Ce rapport détaille la migration vers l'architecture à trois couches (Orchestration, Coordination, Business).

### Structure créée

\`\`\`
packages/
├── orchestration/           # Couche d'orchestration
│   ├── orchestrators/       # Orchestrateurs de workflows
│   ├── schedulers/          # Planificateurs de tâches
│   ├── monitors/            # Moniteurs d'exécution
│   └── interfaces/          # Interfaces communes
├── coordination/            # Couche de coordination
│   ├── bridges/             # Ponts d'intégration
│   ├── adapters/            # Adaptateurs pour services externes
│   ├── mediators/           # Médiateurs entre agents
│   └── interfaces/          # Interfaces communes
├── business/                # Couche business
│   ├── analyzers/           # Agents d'analyse
│   ├── generators/          # Agents de génération
│   ├── validators/          # Agents de validation
│   ├── parsers/             # Agents de parsing
│   └── interfaces/          # Interfaces communes
└── shared/                  # Code partagé
    ├── models/              # Modèles de données
    ├── utils/               # Utilitaires communs
    ├── testing/             # Outils de test
    └── config/              # Configuration partagée
\`\`\`

### Sauvegarde

Une sauvegarde complète a été créée dans:
\`\`\`
$BACKUP_DIR
\`\`\`

### Journal de migration

Le journal complet de la migration est disponible dans:
\`\`\`
$LOG_FILE
\`\`\`

## Actions requises

1. Vérifiez que l'application fonctionne correctement après la migration.
2. Mettez à jour progressivement les imports restants pour utiliser la nouvelle structure.
3. Adaptez les interfaces des agents existants pour implémenter les interfaces de base.

## Prochaines étapes recommandées

1. Exécutez la suite de tests complète pour valider la migration
2. Mettez à jour la documentation pour refléter la nouvelle structure
3. Formez l'équipe sur la nouvelle architecture
4. Implémentez les interfaces standardisées pour tous les agents

## Notes techniques

Les fichiers de redirection ont été créés pour maintenir la compatibilité avec le code existant. Ces fichiers émettent des avertissements de dépréciation pour encourager la mise à jour des imports.

## Statistiques

- Agents migrés: $(find packages/business -type f \( -name "*.ts" -o -name "*.js" \) | wc -l)
- Orchestrateurs migrés: $(find packages/orchestration -type f \( -name "*.ts" -o -name "*.js" \) | wc -l)
- Coordinateurs migrés: $(find packages/coordination -type f \( -name "*.ts" -o -name "*.js" \) | wc -l)
- Utilitaires partagés: $(find packages/shared -type f \( -name "*.ts" -o -name "*.js" \) | wc -l)
EOF
  
  success "Rapport de migration généré: $report_file"
  
  # Afficher le chemin du rapport
  echo -e "\n${GREEN}${BOLD}Rapport de migration disponible dans: ${NC}${report_file}"
}

# Fonction pour exécuter les tests
run_tests() {
  header "EXÉCUTION DES TESTS"
  
  if [ "$SKIP_TESTS" = true ]; then
    log "Exécution des tests désactivée, ignorée"
    return 0
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: exécution des tests ignorée"
    return 0
  fi
  
  log "Exécution des tests pour vérifier la migration..."
  
  if [ -f "${ROOT_DIR}/package.json" ] && grep -q '"test"' "${ROOT_DIR}/package.json"; then
    if npm test; then
      success "Tests exécutés avec succès!"
    else
      warn "Des problèmes ont été détectés lors de l'exécution des tests. Vérifiez les erreurs ci-dessus."
    fi
  else
    warn "Impossible d'exécuter les tests automatiquement. Veuillez exécuter manuellement vos tests."
  fi
}

# Fonction pour nettoyer les fichiers anciens
cleanup_old_files() {
  header "NETTOYAGE DES FICHIERS ANCIENS"
  
  if [ "$CLEANUP_OLD_FILES" = false ]; then
    log "Nettoyage des fichiers anciens désactivé, ignoré"
    return 0
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log "Mode simulation: nettoyage des fichiers anciens ignoré"
    return 0
  fi
  
  log "Analyse des fichiers à supprimer..."
  
  # Répertoires sources qui ont été migrés
  local dirs_to_clean=(
    "agents"
    "orchestrators"
  )
  
  # Fichiers journaux et de sauvegarde anciens à nettoyer
  local old_backup_dirs=$(find "${ROOT_DIR}/backup" -type d -name "architecture-migration-*" -o -name "deduplication-*" -mtime +${CLEANUP_DELAY} 2>/dev/null)
  local old_reports=$(find "${ROOT_DIR}/reports" -type f -name "rapport-migration-*.md" -o -name "architecture-migration-*.log" -mtime +${CLEANUP_DELAY} 2>/dev/null)
  
  # Créer un répertoire pour la liste des fichiers supprimés
  local deleted_files_list="${ROOT_DIR}/reports/fichiers-supprimes-$(date +%Y%m%d-%H%M%S).txt"
  mkdir -p "$(dirname "$deleted_files_list")"
  touch "$deleted_files_list"
  
  # 1. Nettoyage des répertoires sources
  for dir in "${dirs_to_clean[@]}"; do
    if [ -d "$dir" ]; then
      log "Analyse du répertoire '$dir' pour suppression..."
      
      # Si le mode interactif est activé, demander confirmation
      if [ "$INTERACTIVE" = true ]; then
        read -p "Voulez-vous supprimer le répertoire '$dir'? (o/N): " confirm
        if [[ "$confirm" != "o" && "$confirm" != "O" ]]; alors
          warn "Suppression de '$dir' annulée par l'utilisateur"
          continue
        fi
      fi
      
      # Créer une liste des fichiers du répertoire avant suppression
      find "$dir" -type f | sort >> "$deleted_files_list"
      
      # Supprimer le répertoire
      rm -rf "$dir"
      success "Répertoire '$dir' supprimé"
    fi
  done
  
  # 2. Nettoyage des sauvegardes anciennes
  if [ -n "$old_backup_dirs" ]; then
    log "Suppression des sauvegardes anciennes de plus de ${CLEANUP_DELAY} jours..."
    
    for old_dir in $old_backup_dirs; do
      # Si le mode interactif est activé, demander confirmation
      if [ "$INTERACTIVE" = true ]; then
        read -p "Voulez-vous supprimer la sauvegarde ancienne '$old_dir'? (o/N): " confirm
        if [[ "$confirm" != "o" && "$confirm" != "O" ]]; alors
          warn "Suppression de '$old_dir' annulée par l'utilisateur"
          continue
        fi
      fi
      
      echo "Sauvegarde supprimée: $old_dir" >> "$deleted_files_list"
      rm -rf "$old_dir"
      success "Sauvegarde ancienne '$old_dir' supprimée"
    done
  else
    log "Aucune sauvegarde ancienne de plus de ${CLEANUP_DELAY} jours trouvée"
  fi
  
  # 3. Nettoyage des rapports anciens
  if [ -n "$old_reports" ]; then
    log "Suppression des rapports anciens de plus de ${CLEANUP_DELAY} jours..."
    
    for old_report in $old_reports; do
      echo "Rapport supprimé: $old_report" >> "$deleted_files_list"
      rm -f "$old_report"
      log "Rapport ancien '$old_report' supprimé"
    done
    
    success "Rapports anciens supprimés"
  else
    log "Aucun rapport ancien de plus de ${CLEANUP_DELAY} jours trouvé"
  fi
  
  # 4. Nettoyage des fichiers de redirection temporaires
  log "Recherche des fichiers de redirection temporaires..."
  local redirect_files=$(find "${ROOT_DIR}" -type f -name "*.redirect.js" 2>/dev/null)
  
  if [ -n "$redirect_files" ]; then
    # Si le mode interactif est activé, demander confirmation
    if [ "$INTERACTIVE" = true ]; then
      read -p "Voulez-vous supprimer les fichiers de redirection temporaires (${#redirect_files[@]} fichiers)? (o/N): " confirm
      if [[ "$confirm" != "o" && "$confirm" != "O" ]]; alors
        warn "Suppression des fichiers de redirection annulée par l'utilisateur"
      else
        echo "Fichiers de redirection supprimés:" >> "$deleted_files_list"
        echo "$redirect_files" >> "$deleted_files_list"
        echo "$redirect_files" | xargs rm -f
        success "Fichiers de redirection temporaires supprimés"
      fi
    else
      echo "Fichiers de redirection supprimés:" >> "$deleted_files_list"
      echo "$redirect_files" >> "$deleted_files_list"
      echo "$redirect_files" | xargs rm -f
      success "Fichiers de redirection temporaires supprimés"
    fi
  else
    log "Aucun fichier de redirection temporaire trouvé"
  fi
  
  # 5. Nettoyage des fichiers de sauvegarde (.bak) créés pendant la migration
  log "Recherche des fichiers de sauvegarde (.bak)..."
  local bak_files=$(find "${ROOT_DIR}" -type f -name "*.bak" -mtime +1 2>/dev/null)
  
  if [ -n "$bak_files" ]; then
    echo "Fichiers de sauvegarde supprimés:" >> "$deleted_files_list"
    echo "$bak_files" >> "$deleted_files_list"
    echo "$bak_files" | xargs rm -f
    success "Fichiers de sauvegarde (.bak) supprimés"
  else
    log "Aucun fichier de sauvegarde (.bak) ancien trouvé"
  fi
  
  success "Nettoyage des fichiers anciens terminé"
  log "Liste des fichiers supprimés disponible dans: $deleted_files_list"
}

# Fonction pour afficher l'aide
show_help() {
  cat << EOF
Usage: $0 [options]

Options:
  -h, --help        Affiche cette aide
  -d, --dry-run     Mode simulation (n'effectue aucune modification)
  -i, --interactive Mode interactif (demande confirmation avant les actions)
  -v, --verbose     Mode verbeux (affiche plus de détails)
  --no-fix-imports  Désactive la mise à jour automatique des imports
  --skip-tests      Ne pas exécuter les tests après la migration
  --cleanup         Active la suppression des fichiers anciens après migration
  --cleanup-days=N  Définit le nombre de jours avant de considérer un fichier comme ancien (défaut: 7)

Exemples:
  $0                     # Exécution standard
  $0 --dry-run           # Simulation sans modification
  $0 --interactive       # Mode interactif avec confirmations
  $0 --cleanup           # Active le nettoyage des fichiers anciens
  $0 --cleanup-days=30   # Considère les fichiers de plus de 30 jours comme anciens
EOF
  exit 0
}

# Fonction pour afficher un menu interactif
show_interactive_menu() {
  local options=("Démarrer la migration complète" "Mode simulation uniquement" "Créer uniquement la structure" "Activer le nettoyage des fichiers anciens" "Aide" "Quitter")
  local choice
  
  echo -e "${BOLD}Choisissez une action:${NC}"
  
  PS3="Votre choix: "
  select choice in "${options[@]}"; do
    case $choice in
      "Démarrer la migration complète")
        INTERACTIVE=true
        break
        ;;
      "Mode simulation uniquement")
        INTERACTIVE=true
        DRY_RUN=true
        break
        ;;
      "Créer uniquement la structure")
        INTERACTIVE=true
        FIX_IMPORTS=false
        break
        ;;
      "Activer le nettoyage des fichiers anciens")
        INTERACTIVE=true
        CLEANUP_OLD_FILES=true
        echo -e "${GREEN}Nettoyage des fichiers anciens activé${NC}"
        # Demander le nombre de jours
        read -p "Nombre de jours avant de considérer un fichier comme ancien [7]: " cleanup_days
        if [[ -n "$cleanup_days" ]]; then
          CLEANUP_DELAY=$cleanup_days
        fi
        echo -e "${BLUE}Les fichiers de plus de ${CLEANUP_DELAY} jours seront considérés comme anciens${NC}"
        break
        ;;
      "Aide")
        show_help
        ;;
      "Quitter")
        exit 0
        ;;
      *)
        echo "Option invalide"
        ;;
    esac
  done
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        ;;
      -d|--dry-run)
        DRY_RUN=true
        shift
        ;;
      -i|--interactive)
        INTERACTIVE=true
        shift
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      --no-fix-imports)
        FIX_IMPORTS=false
        shift
        ;;
      --skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      --cleanup)
        CLEANUP_OLD_FILES=true
        shift
        ;;
      --cleanup-days=*)
        CLEANUP_DELAY="${1#*=}"
        shift
        ;;
      *)
        error "Option inconnue: $1"
        ;;
    esac
  done
}

# Fonction principale
main() {
  show_banner
  
  # Si mode interactif sans arguments, afficher le menu
  if [ "$#" -eq 0 ] && [ "$INTERACTIVE" = true ]; then
    show_interactive_menu
  else
    parse_args "$@"
  fi
  
  # Créer les répertoires pour les logs
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"
  
  # Mode simulation
  if [ "$DRY_RUN" = true ]; then
    log "⚠️  EXÉCUTION EN MODE SIMULATION - AUCUNE MODIFICATION NE SERA EFFECTUÉE"
  fi
  
  # Timestamp de début
  local start_time=$(date +%s)
  log "Début de la migration: $(date)"
  
  # Exécution des étapes
  create_backup
  create_base_structure
  create_package_files
  migrate_agents
  migrate_apps
  migrate_tools
  generate_interfaces
  fix_imports
  run_tests
  generate_report
  
  # Nettoyage des fichiers anciens si activé
  if [ "$CLEANUP_OLD_FILES" = true ]; then
    cleanup_old_files
  fi
  
  # Timestamp de fin
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local minutes=$((duration / 60))
  local seconds=$((duration % 60))
  
  success "Migration terminée en ${minutes}m${seconds}s"
  
  if [ "$DRY_RUN" = true ]; then
    log "⚠️  CECI ÉTAIT UNE SIMULATION - Aucune modification n'a été apportée"
    log "Pour effectuer la migration réelle, exécutez la commande sans l'option --dry-run"
  fi
}

# Exécution du script
main "$@"