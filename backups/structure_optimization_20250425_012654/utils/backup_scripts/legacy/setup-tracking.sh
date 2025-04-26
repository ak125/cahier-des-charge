#!/bin/bash

# Script pour configurer l'environnement de suivi automatique

echo "📦 Installation des dépendances pour le suivi automatique..."

# Vérifier si npm est disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas disponible. Veuillez installer Node.js."
    exit 1
fi

# Créer un package.json s'il n'existe pas
if [ ! -f "package.json" ]; then
    echo "{
  \"name\": \"cahier-des-charges-automation\",
  \"version\": \"1.0.0\",
  \"description\": \"Automatisation du cahier des charges\",
  \"scripts\": {
    \"track\": \"node scripts/track-element.js\",
    \"insert\": \"./scripts/insert-and-track.sh\"
  },
  \"author\": \"\",
  \"license\": \"MIT\"
}" > package.json
fi

# Installer les dépendances
npm install --save chokidar yargs mustache chalk

# Rendre les scripts exécutables
chmod +x scripts/insert-and-track.sh
chmod +x scripts/track-element.js
chmod +x scripts/setup-tracking.sh

echo "✅ Configuration terminée!"
echo "Pour insérer et suivre un nouvel élément:"
echo "  ./scripts/insert-and-track.sh <type> <name> \"<description>\""
echo "Exemple:"
echo "  ./scripts/insert-and-track.sh module user-authentication \"Système d'authentification des utilisateurs\""
