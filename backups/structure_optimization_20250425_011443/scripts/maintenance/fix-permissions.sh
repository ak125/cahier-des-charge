#!/bin/bash

# Rendre tous les scripts exécutables

echo "🔧 Correction des permissions pour tous les scripts..."

# Trouver tous les scripts .sh
SCRIPTS=$(find ./scripts -name "*.sh")

# Rendre chaque script exécutable
for script in $SCRIPTS; do
    chmod +x "$script"
    echo "✅ Rendu exécutable: $script"
done

echo "🏁 Terminé! Tous les scripts sont maintenant exécutables."
