#!/bin/bash

# Ce script exécute directement ts-node avec le fichier structure-classifier-agent.ts

# Obtenir le chemin absolu du répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Chemin vers le binaire ts-node (plusieurs possibilités)
TS_NODE_LOCAL="$PROJECT_ROOT/node_modules/.bin/ts-node"
TS_NODE_GLOBAL="$(which ts-node 2>/dev/null)"

# Chemin vers le script TypeScript
TS_FILE="$SCRIPT_DIR/structure-classifier-agent.ts"

# Vérifier que ts-node est installé localement ou globalement
if [ -f "$TS_NODE_LOCAL" ]; then
    TS_NODE_BIN="$TS_NODE_LOCAL"
elif [ -n "$TS_NODE_GLOBAL" ]; then
    TS_NODE_BIN="$TS_NODE_GLOBAL"
else
    echo "❌ ts-node n'est pas installé. Vérifiez que vous avez bien installé les dépendances."
    echo "Essayez d'exécuter : npm install -g ts-node"
    exit 1
fi

# Exécuter ts-node avec les options appropriées
echo "🔍 Utilisation de ts-node : $TS_NODE_BIN"
echo "🔍 Exécution de : $TS_FILE"
"$TS_NODE_BIN" --project "$PROJECT_ROOT/tsconfig.json" --transpile-only "$TS_FILE"