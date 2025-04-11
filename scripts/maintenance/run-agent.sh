#!/bin/bash

# Script pour exécuter un agent IA spécifique
# Usage: ./run-agent.sh <nom-agent> [arguments]

if [ $# -lt 1 ]; then
  echo "Usage: $0 <nom-agent> [arguments]"
  echo ""
  echo "Agents disponibles:"
  ls -1 agents/*.ts | sed 's/agents\///' | sed 's/\.ts//'
  exit 1
fi

AGENT="$1"
shift

if [ ! -f "agents/${AGENT}.ts" ]; then
  echo "❌ Agent '${AGENT}' non trouvé!"
  echo ""
  echo "Agents disponibles:"
  ls -1 agents/*.ts | sed 's/agents\///' | sed 's/\.ts//'
  exit 1
fi

echo "🚀 Exécution de l'agent ${AGENT}..."
npx ts-node "agents/${AGENT}.ts" "$@"
