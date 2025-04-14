#!/bin/bash

echo "🧪 Agent test-writer MCP"
echo "🔍 Générateur de tests NestJS et Remix"
echo "----------------------------------------------------"

# Vérifier les arguments
MODULE_NAME=""
TYPE="both"
AUTO_DETECT=false
GENERATE_COVERAGE=false
RUN_TESTS=false
SOURCE_PATH=""

print_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --module=MODULENAME   Nom du module/route à tester"
  echo "  --type=TYPE           Type de tests à générer (nestjs, remix, both)"
  echo "  --auto-detect         Détection automatique des modules/routes"
  echo "  --coverage            Générer un fichier de suivi de couverture"
  echo "  --run-tests           Exécuter les tests après génération"
  echo "  --source=PATH         Chemin source spécifique (optionnel)"
  echo "  --help                Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0 --module=user --type=nestjs"
  echo "  $0 --auto-detect --type=both --coverage"
  echo "  $0 --module=products --type=remix --run-tests"
}

# Analyser les arguments
for arg in "$@"; do
  case $arg in
    --module=*)
      MODULE_NAME="${arg#*=}"
      ;;
    --type=*)
      TYPE="${arg#*=}"
      ;;
    --source=*)
      SOURCE_PATH="${arg#*=}"
      ;;
    --auto-detect)
      AUTO_DETECT=true
      ;;
    --coverage)
      GENERATE_COVERAGE=true
      ;;
    --run-tests)
      RUN_TESTS=true
      ;;
    --help)
      print_help
      exit 0
      ;;
    *)
      echo "⚠️ Option inconnue: $arg"
      print_help
      exit 1
      ;;
  esac
done

# Vérifier que les arguments sont valides
if [ "$AUTO_DETECT" = false ] && [ -z "$MODULE_NAME" ]; then
  echo "⚠️ Erreur: Vous devez spécifier un module (--module=xxx) ou utiliser l'auto-détection (--auto-detect)"
  print_help
  exit 1
fi

if [ "$TYPE" != "nestjs" ] && [ "$TYPE" != "remix" ] && [ "$TYPE" != "both" ]; then
  echo "⚠️ Erreur: Le type doit être 'nestjs', 'remix' ou 'both'"
  print_help
  exit 1
fi

# Préparer le JSON de contexte
JSON_CONTEXT="{"
if [ -n "$MODULE_NAME" ]; then
  JSON_CONTEXT+="\"moduleName\": \"$MODULE_NAME\", "
fi
JSON_CONTEXT+="\"type\": \"$TYPE\", "
JSON_CONTEXT+="\"autoDetect\": $AUTO_DETECT, "
JSON_CONTEXT+="\"generateCoverage\": $GENERATE_COVERAGE, "
JSON_CONTEXT+="\"runTests\": $RUN_TESTS"
if [ -n "$SOURCE_PATH" ]; then
  JSON_CONTEXT+=", \"sourcePath\": \"$SOURCE_PATH\""
fi
JSON_CONTEXT+="}"

echo "📄 Configuration:"
echo "  Type: $TYPE"
if [ -n "$MODULE_NAME" ]; then
  echo "  Module: $MODULE_NAME"
fi
if [ "$AUTO_DETECT" = true ]; then
  echo "  Auto-détection: Activée"
fi
if [ "$GENERATE_COVERAGE" = true ]; then
  echo "  Suivi de couverture: Activé"
fi
if [ "$RUN_TESTS" = true ]; then
  echo "  Exécution des tests: Activée"
fi
if [ -n "$SOURCE_PATH" ]; then
  echo "  Chemin source: $SOURCE_PATH"
fi
echo "----------------------------------------------------"

# Exécuter l'agent
echo "🚀 Exécution de l'agent test-writer..."
OUTPUT=$(pnpm tsx apps/mcp-server/src/handleAgentRequest.ts test-writer "$JSON_CONTEXT" 2>&1)
EXIT_CODE=$?

# Afficher la sortie
echo "$OUTPUT"

# Vérifier si l'agent a généré des tests
if echo "$OUTPUT" | grep -q "Test.*généré"; then
  echo "----------------------------------------------------"
  echo "✅ Tests générés avec succès!"
  
  # Vérifier si un rapport de couverture a été généré
  if [ "$GENERATE_COVERAGE" = true ] && [ -f "reports/test_coverage_map.json" ]; then
    echo "📊 Rapport de couverture généré: $(pwd)/reports/test_coverage_map.json"
  fi
  
  # Si les tests ont été exécutés, afficher un résumé
  if [ "$RUN_TESTS" = true ]; then
    if echo "$OUTPUT" | grep -q "Tests.*exécutés avec succès"; then
      echo "🧪 Tests exécutés avec succès!"
    else
      echo "⚠️ Les tests ont été générés mais n'ont pas pu être exécutés correctement."
      echo "   Vérifiez les erreurs ci-dessus pour plus de détails."
    fi
  else
    echo "💡 Pour exécuter les tests générés:"
    if [ "$TYPE" = "nestjs" ] || [ "$TYPE" = "both" ]; then
      echo "   pnpm test:unit"
    fi
    if [ "$TYPE" = "remix" ] || [ "$TYPE" = "both" ]; then
      echo "   pnpm test:e2e"
    fi
  fi
fi

exit $EXIT_CODE