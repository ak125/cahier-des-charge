#!/bin/bash

echo "🔧 Agent dev-checker MCP"
echo "🔍 Vérification de l'intégration du code dans le monorepo"
echo "----------------------------------------------------"

# Vérifier si le mode auto-correction est demandé
AUTO_FIX=false
PATH_ARG=""

# Parcourir les arguments pour trouver --fix et le chemin spécifique
for arg in "$@"; do
  if [ "$arg" = "--fix" ]; then
    AUTO_FIX=true
  elif [ "$arg" != "--fix" ] && [ "${arg:0:2}" != "--" ]; then
    PATH_ARG="$arg"
  fi
done

# Exécuter avec les paramètres appropriés
if [ "$AUTO_FIX" = true ] && [ -n "$PATH_ARG" ]; then
  echo "📁 Vérification avec correction automatique du répertoire/fichier: $PATH_ARG"
  pnpm tsx apps/mcp-server/src/handleAgentRequest.ts dev-checker --fix "$PATH_ARG"
elif [ "$AUTO_FIX" = true ]; then
  echo "📁 Vérification avec correction automatique du monorepo"
  pnpm tsx apps/mcp-server/src/handleAgentRequest.ts dev-checker --fix
elif [ -n "$PATH_ARG" ]; then
  echo "📁 Vérification du répertoire/fichier spécifique: $PATH_ARG"
  pnpm tsx apps/mcp-server/src/handleAgentRequest.ts dev-checker "$PATH_ARG"
else
  echo "📁 Vérification complète du monorepo"
  pnpm tsx apps/mcp-server/src/handleAgentRequest.ts dev-checker
fi

# Récupérer le code de sortie
EXIT_CODE=$?

# Afficher le chemin du rapport
if [ -f "reports/dev_check_report.md" ]; then
  echo "----------------------------------------------------"
  echo "📊 Rapport généré: $(pwd)/reports/dev_check_report.md"
  
  # Si des corrections automatiques ont été effectuées, afficher un résumé
  if [ "$AUTO_FIX" = true ] && grep -q "Corrections automatiques" "reports/dev_check_report.md"; then
    echo "----------------------------------------------------"
    echo "🛠️ Résumé des corrections automatiques:"
    echo ""
    grep -A 3 "## 🛠️ Corrections automatiques" "reports/dev_check_report.md" | grep -v "## 🛠️ Corrections automatiques"
    echo "..."
    echo "Consultez le rapport complet pour plus de détails."
  fi
fi

# Sortir avec le même code de sortie
exit $EXIT_CODE