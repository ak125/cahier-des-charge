#!/bin/bash
# Script pour valider et adapter les agents MCP
# Usage: ./unified-agents.sh [--validate|--adapt|--help]

set -e

function show_help {
  echo "Scripts pour unifier les agents MCP"
  echo "===================================="
  echo
  echo "Options:"
  echo "  --validate   Exécute la validation des agents"
  echo "  --adapt      Adapte les agents pour respecter l'interface"
  echo "  --help       Affiche cette aide"
  echo
  echo "Exemple d'usage:"
  echo "  ./unified-agents.sh --validate"
  echo "  ./unified-agents.sh --adapt"
}

function validate_agents {
  echo "🔍 Validation des agents MCP..."
  cd packages/mcp-agents
  ts-node validate-agents.ts
  exit_code=$?
  cd ../..
  
  if [ $exit_code -eq 0 ]; then
    echo "✅ Tous les agents sont valides!"
  else
    echo "⚠️  Des problèmes ont été détectés. Consultez le rapport pour plus de détails."
    echo "   Vous pouvez adapter les agents avec ./unified-agents.sh --adapt"
  fi
  
  return $exit_code
}

function adapt_agents {
  echo "🔧 Adaptation des agents MCP..."
  cd packages/mcp-agents
  ts-node adapt-agents.ts
  exit_code=$?
  cd ../..
  
  if [ $exit_code -eq 0 ]; then
    echo "✅ Adaptation terminée avec succès!"
    echo "   Vérifiez les adaptations avec ./unified-agents.sh --validate"
  else
    echo "❌ Des problèmes sont survenus lors de l'adaptation des agents."
  fi
  
  return $exit_code
}

# Vérifier si ts-node est installé
if ! command -v ts-node &> /dev/null; then
  echo "⚠️ ts-node n'est pas installé globalement."
  echo "Installation en cours..."
  npm install -g ts-node
fi

# Traitement des arguments
if [ "$#" -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  --validate)
    validate_agents
    ;;
  --adapt)
    adapt_agents
    ;;
  --help)
    show_help
    ;;
  *)
    echo "Option non reconnue: $1"
    show_help
    exit 1
    ;;
esac