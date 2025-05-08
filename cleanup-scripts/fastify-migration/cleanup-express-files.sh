#!/bin/bash

# Script de nettoyage des fichiers Express obsolètes
# Date: 06/05/2025
# Description: Ce script nettoie les fichiers obsolètes liés à Express
#              après la migration vers Fastify

# Couleurs pour les messages
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Fonction pour afficher un message avec une couleur
log() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Fonction pour sauvegarder un fichier avant de le supprimer
backup_file() {
  local file=$1
  local backup_dir="/workspaces/cahier-des-charge/backup/fastify-migration-20250506"
  
  # Créer le répertoire de sauvegarde s'il n'existe pas
  mkdir -p "$backup_dir"
  
  # Créer les sous-répertoires nécessaires
  local rel_path=$(dirname "${file#/workspaces/cahier-des-charge/}")
  mkdir -p "$backup_dir/$rel_path"
  
  # Copier le fichier
  cp "$file" "$backup_dir/$rel_path/"
  
  log "$BLUE" "📦 Fichier sauvegardé: $file -> $backup_dir/$rel_path/"
}

# Fonction pour supprimer un fichier
remove_file() {
  local file=$1
  
  if [ -f "$file" ]; then
    backup_file "$file"
    rm "$file"
    log "$GREEN" "🗑️ Fichier supprimé: $file"
  else
    log "$YELLOW" "⚠️ Fichier introuvable: $file"
  fi
}

# Fonction pour mettre à jour les références à un middleware dans un module
update_module_references() {
  local module_file=$1
  local old_middleware=$2
  local new_middleware=$3
  
  if [ -f "$module_file" ]; then
    # Vérifier si le middleware est utilisé dans le fichier
    if grep -q "$old_middleware" "$module_file"; then
      # Sauvegarder le fichier avant de le modifier
      backup_file "$module_file"
      
      # Remplacer les références au middleware
      sed -i "s/import { $old_middleware } from '.\/middleware';/import { $new_middleware } from '.\/middleware';/g" "$module_file"
      sed -i "s/$old_middleware/$new_middleware/g" "$module_file"
      
      log "$GREEN" "✅ Références mises à jour dans: $module_file"
    fi
  else
    log "$YELLOW" "⚠️ Module introuvable: $module_file"
  fi
}

log "$BLUE" "🚀 Démarrage du nettoyage des fichiers Express obsolètes..."

# Liste des fichiers à supprimer
EXPRESS_FILES=(
  # Middlewares Express obsolètes
  "/workspaces/cahier-des-charge/apps/mcp-server/src/middleware/compression.middleware.ts"
  "/workspaces/cahier-des-charge/apps/mcp-server/src/middleware/request-logger.middleware.ts"
  # Scripts Express obsolètes
  "/workspaces/cahier-des-charge/scripts/clean-root-directory.sh"
  "/workspaces/cahier-des-charge/scripts/optimize-git-repo-fixed.sh"
  "/workspaces/cahier-des-charge/scripts/clean-packages-fixed.sh"
)

# Supprimer les fichiers Express obsolètes
for file in "${EXPRESS_FILES[@]}"; do
  remove_file "$file"
done

# Vérifier les modules qui pourraient contenir des références aux middlewares supprimés
MODULE_FILES=(
  "/workspaces/cahier-des-charge/apps/mcp-server/src/app.module.ts"
)

# Mettre à jour les références aux middlewares dans les modules
for module_file in "${MODULE_FILES[@]}"; do
  update_module_references "$module_file" "RequestLoggerMiddleware" "ErrorHandlerMiddleware"
done

# Vérifier les fichiers qui utilisent Express et afficher un avertissement
log "$BLUE" "🔍 Recherche des fichiers utilisant encore Express..."

EXPRESS_USAGE=$(grep -r "import.*express" --include="*.ts" --include="*.js" /workspaces/cahier-des-charge/apps/ 2>/dev/null || echo "")

if [ -n "$EXPRESS_USAGE" ]; then
  log "$YELLOW" "⚠️ Les fichiers suivants utilisent encore Express et peuvent nécessiter une mise à jour:"
  echo "$EXPRESS_USAGE"
else
  log "$GREEN" "✅ Aucun fichier n'utilise plus Express dans le dossier apps/"
fi

# Générer un rapport de nettoyage
REPORT_FILE="/workspaces/cahier-des-charge/cleanup-report/fastify-migration-cleanup-report-$(date +%Y%m%d).md"
mkdir -p "$(dirname "$REPORT_FILE")"

cat > "$REPORT_FILE" << EOL
# Rapport de nettoyage de la migration Fastify

Date: $(date +"%d/%m/%Y")

## Fichiers supprimés

Les fichiers suivants ont été supprimés car ils sont devenus obsolètes avec la migration vers Fastify :

EOL

for file in "${EXPRESS_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "- \`${file#/workspaces/cahier-des-charge/}\`" >> "$REPORT_FILE"
  fi
done

cat >> "$REPORT_FILE" << EOL

## Fichiers mis à jour

Les fichiers suivants ont été mis à jour pour utiliser Fastify au lieu d'Express :

- \`packages/business/src/common/middleware/legacy-php-redirect-middleware.ts\`
- \`packages/business/src/common/middleware/legacy-htaccess-middleware.ts\`

## Remarques importantes

1. Les middlewares de compression et de journalisation des requêtes ont été supprimés car ces fonctionnalités sont maintenant gérées directement par Fastify dans le fichier \`main.ts\`.
2. Le middleware de gestion d'erreurs a été conservé car il contient une logique métier spécifique.
3. Les middlewares de redirection PHP legacy ont été mis à jour pour utiliser les types Fastify.

## Prochaines étapes

1. Vérifier le bon fonctionnement de l'application après ces modifications.
2. Mettre à jour les tests unitaires et d'intégration pour qu'ils utilisent Fastify au lieu d'Express.
3. Optimiser davantage les plugins Fastify pour améliorer les performances.
EOL

log "$GREEN" "✅ Rapport de nettoyage généré: $REPORT_FILE"
log "$GREEN" "✅ Nettoyage des fichiers Express obsolètes terminé."