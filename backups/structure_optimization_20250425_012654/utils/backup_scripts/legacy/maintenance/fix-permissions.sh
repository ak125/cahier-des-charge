#!/bin/bash

# Script pour corriger les permissions de tous les scripts
# Exécuter avec: bash fix-permissions.sh

echo "🔧 Correction des permissions pour tous les scripts..."

# Rendre les scripts récemment créés exécutables
chmod +x /workspaces/cahier-des-charge/scripts/fix-migration-errors.sh
chmod +x /workspaces/cahier-des-charge/scripts/utils/update-paths.sh

# Trouver et rendre exécutables tous les scripts .sh
for script in $(find /workspaces/cahier-des-charge -name "*.sh"); do
  chmod +x "$script"
  echo "✅ Rendu exécutable: $script"
done

echo "🏁 Terminé! Tous les scripts sont maintenant exécutables."
echo ""
echo "Vous pouvez maintenant exécuter:"
echo "  ./scripts/fix-migration-errors.sh"
echo "  ./scripts/utils/update-paths.sh --dry-run"
