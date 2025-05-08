#!/bin/bash

# ========================================================
# Script de nettoyage et réorganisation de la racine du projet
# Ce script:
#   1. Déplace les fichiers de configuration vers /config
#   2. Regroupe les scripts d'utilitaires dans /scripts
#   3. Déplace les fichiers de logs vers /logs
#   4. Organise les fichiers de test
# ========================================================

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROOT_DIR="/workspaces/cahier-des-charge"
LOG_FILE="$ROOT_DIR/reorganisation.log"

# Vider le log précédent
echo "" > $LOG_FILE

# Fonction pour enregistrer et afficher un message
log_message() {
  local msg="$1"
  local color="${2:-$NC}"
  echo -e "${color}${msg}${NC}" | tee -a $LOG_FILE
}

# Fonction pour créer un répertoire s'il n'existe pas
ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    log_message "✓ Créé: $dir" "$GREEN"
  fi
}

# Fonction pour déplacer un fichier vers un répertoire
move_file() {
  local src="$1"
  local dest="$2"
  local file=$(basename "$src")

  if [ -f "$src" ]; then
    mv "$src" "$dest/"
    log_message "✓ Déplacé: $file vers $dest" "$GREEN"
  else
    log_message "⚠ Fichier non trouvé: $file" "$YELLOW"
  fi
}

# Fonction pour vérifier si un fichier est essentiel à la racine
is_essential_root_file() {
  local file="$1"
  local essential_files=(
    "package.json"
    "package-lock.json"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "nx.json"
    "tsconfig.json"
    "biome.json"
    ".gitignore"
    ".env"
    ".env.example"
    "README.md"
    "LICENSE"
    "earthfile"
    "Dockerfile"
    ".dockerignore"
  )

  for ef in "${essential_files[@]}"; do
    if [ "$file" = "$ef" ]; then
      return 0
    fi
  done
  return 1
}

# Affiche un message de bienvenue
log_message "\n========================================================" "$BLUE"
log_message "🧹 NETTOYAGE ET RÉORGANISATION DU PROJET" "$BLUE"
log_message "========================================================\n" "$BLUE"

cd "$ROOT_DIR"

# ========================================================
# 1. CRÉER LES RÉPERTOIRES NÉCESSAIRES
# ========================================================
log_message "🗂️  Création des répertoires nécessaires..." "$BLUE"

ensure_dir "$ROOT_DIR/config/test"
ensure_dir "$ROOT_DIR/config/eslint"
ensure_dir "$ROOT_DIR/config/docker"
ensure_dir "$ROOT_DIR/scripts/maintenance"
ensure_dir "$ROOT_DIR/scripts/utils"
ensure_dir "$ROOT_DIR/logs"

# ========================================================
# 2. DÉPLACER LES FICHIERS DE CONFIGURATION
# ========================================================
log_message "\n📝 Déplacement des fichiers de configuration..." "$BLUE"

# Fichiers Jest et test vers config/test
for file in jest*.js jest*.config.js test-config.ts; do
  if [ -f "$file" ]; then
    move_file "$file" "$ROOT_DIR/config/test"
  fi
done

# Fichiers ESLint et style vers config/eslint
if [ -f "$ROOT_DIR/eslintrc.json" ]; then
  move_file "$ROOT_DIR/eslintrc.json" "$ROOT_DIR/config/eslint"
fi

# Fichiers Docker vers config/docker
for file in docker-compose*.yml; do
  if [ -f "$file" ]; then
    move_file "$file" "$ROOT_DIR/config/docker"
  fi
done

# TSConfig de base vers config
if [ -f "$ROOT_DIR/tsconfigbase.json" ]; then
  move_file "$ROOT_DIR/tsconfigbase.json" "$ROOT_DIR/config"
fi

# ========================================================
# 3. DÉPLACER LES SCRIPTS D'UTILITAIRES
# ========================================================
log_message "\n🔧 Déplacement des scripts d'utilitaires..." "$BLUE"

# Scripts de correction
for file in fix-*.js fix-*.sh clean-*.sh clean*.sh cleanup*.js cleanup*.sh; do
  if ls $file 1>/dev/null 2>&1; then
    for f in $file; do
      move_file "$f" "$ROOT_DIR/scripts/maintenance"
    done
  fi
done

# Scripts de validation et d'installation
if [ -f "$ROOT_DIR/validate-structure.js" ]; then
  move_file "$ROOT_DIR/validate-structure.js" "$ROOT_DIR/scripts/utils"
fi

if [ -f "$ROOT_DIR/install-git-hooks.js" ]; then
  move_file "$ROOT_DIR/install-git-hooks.js" "$ROOT_DIR/scripts/utils"
fi

if [ -f "$ROOT_DIR/prevent-merge-conflicts.js" ]; then
  move_file "$ROOT_DIR/prevent-merge-conflicts.js" "$ROOT_DIR/scripts/utils"
fi

if [ -f "$ROOT_DIR/schema-diff-to-code-patch.ts" ]; then
  move_file "$ROOT_DIR/schema-diff-to-code-patch.ts" "$ROOT_DIR/scripts/utils"
fi

if [ -f "$ROOT_DIR/rename-directories.sh" ]; then
  move_file "$ROOT_DIR/rename-directories.sh" "$ROOT_DIR/scripts/maintenance"
fi

# ========================================================
# 4. DÉPLACER LES FICHIERS DE LOGS
# ========================================================
log_message "\n📊 Déplacement des fichiers de logs et rapport..." "$BLUE"

# Logs et rapports divers
log_files=(
  "merge-operations.log"
  "real-duplicates-merge.log"
  "standardization-warnings.txt"
  "standardized-filenames.log"
  "duplicated-folders.txt"
  "real-duplicates.json"
  "status.json"
  "structure-map.json"
  "workflow-ids.json"
)

for file in "${log_files[@]}"; do
  if [ -f "$ROOT_DIR/$file" ]; then
    move_file "$ROOT_DIR/$file" "$ROOT_DIR/logs"
  fi
done

# ========================================================
# 5. VÉRIFIER LES FICHIERS RESTANTS
# ========================================================
log_message "\n🔍 Vérification des fichiers restants à la racine..." "$BLUE"

declare -a remaining_files=()
for file in *; do
  if [ -f "$file" ] && ! is_essential_root_file "$file" && [ "$file" != "reorganisation.log" ]; then
    remaining_files+=("$file")
  fi
done

if [ ${#remaining_files[@]} -gt 0 ]; then
  log_message "\n⚠️  Les fichiers suivants restent à la racine et pourraient être à réorganiser:" "$YELLOW"
  for file in "${remaining_files[@]}"; do
    log_message "   - $file" "$YELLOW"
  done
else
  log_message "\n✅ Tous les fichiers non essentiels ont été réorganisés!" "$GREEN"
fi

# ========================================================
# 6. MISE À JOUR DU PACKAGE.JSON
# ========================================================
log_message "\n🔄 Mise à jour des chemins dans package.json..." "$BLUE"

if [ -f "$ROOT_DIR/package.json" ] && command -v node &> /dev/null; then
  node -e '
  const fs = require("fs");
  const path = require("path");
  
  // Lire le package.json
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) process.exit(0);
  
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  
  // Mettre à jour les scripts si nécessaire
  if (pkg.scripts) {
    // Mettre à jour les chemins vers les nouveaux emplacements
    Object.keys(pkg.scripts).forEach(key => {
      // Mettre à jour les références aux fichiers Jest
      pkg.scripts[key] = pkg.scripts[key]
        .replace(/jest\.config\.js/g, "config/test/jest.config.js")
        .replace(/test-config\.ts/g, "config/test/test-config.ts");
    });
    
    // Ajouter le nouveau script de cleanup
    pkg.scripts["cleanup"] = "bash scripts/clean-root-directory.sh";
  }
  
  // Écrire le package.json mis à jour
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  console.log("✓ package.json mis à jour");
  ' 2>/dev/null || log_message "⚠️ Erreur lors de la mise à jour de package.json" "$YELLOW"
fi

# ========================================================
# CONCLUSION
# ========================================================
log_message "\n========================================================" "$BLUE"
log_message "✅ RÉORGANISATION TERMINÉE !" "$GREEN"
log_message "========================================================" "$BLUE"
log_message "- Journal détaillé disponible dans: reorganisation.log" "$BLUE"
log_message "- Pour revenir en arrière, consultez le journal qui contient" "$BLUE"
log_message "  tous les déplacements de fichiers effectués." "$BLUE"
log_message "\nExécutez à nouveau ce script si nécessaire pour nettoyer" "$BLUE"
log_message "d'autres fichiers à l'avenir." "$BLUE"
log_message "========================================================\n" "$BLUE"

# Rendre le script exécutable
chmod +x "$ROOT_DIR/scripts/clean-root-directory.sh"