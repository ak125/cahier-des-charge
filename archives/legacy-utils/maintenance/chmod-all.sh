#!/bin/bash

# Script simplifié pour appliquer les permissions d'exécution à tous les scripts
# Utilisation: bash chmod-all.sh

echo "🔄 Application des permissions d'exécution..."

# Méthode 1: Utiliser find avec -exec
find /workspaces/cahier-des-charge -name "*.sh" -type f -exec chmod +x {} \;
echo "✅ Permissions appliquées avec find -exec"

# Méthode 2: Application récursive avec chmod directement
chmod -R +x /workspaces/cahier-des-charge/scripts/
echo "✅ Permissions appliquées récursivement sur le dossier scripts/"

# Méthode 3: Pour les scripts spécifiques
scripts_specifiques=(
  "/workspaces/cahier-des-charge/manage-cahier.sh"
  "/workspaces/cahier-des-charge/scripts/fix-migration-errors.sh" 
  "/workspaces/cahier-des-charge/scripts/utils/update-paths.sh"
)

for script in "${scripts_specifiques[@]}"; do
  if [ -f "$script" ]; then
    chmod 755 "$script"
    echo "✅ Permissions 755 appliquées à: $script"
  fi
done

echo "🎉 Terminé! Vous pouvez maintenant exécuter vos scripts."
