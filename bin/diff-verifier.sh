#!/bin/bash

echo "🔍 Agent diff-verifier MCP"
echo "👁️ Vérification comportementale PHP → NestJS/Remix"
echo "----------------------------------------------------"

# Vérifier que le répertoire de travail est le bon
if [ ! -d "agents" ] || [ ! -d "apps" ]; then
  echo "⚠️ Erreur: Ce script doit être exécuté depuis la racine du projet"
  echo "   Veuillez vous placer dans le répertoire racine du projet"
  exit 1
fi

# Options par défaut
FILE=""
DIRECTORY=""
BATCH_MODE=false
AUTO_REMEDIATE=false
UPDATE_DISCOVERY=false
GENERATE_REPORT=false

print_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --file=FICHIER.php      Vérifier un fichier PHP spécifique"
  echo "  --dir=REPERTOIRE        Vérifier tous les fichiers PHP d'un répertoire"
  echo "  --batch                 Vérifier tous les fichiers avec audit mais non vérifiés"
  echo "  --auto-remediate        Tenter de corriger automatiquement les divergences"
  echo "  --update-discovery      Mettre à jour discovery_map.json avec le statut vérifié"
  echo "  --report                Générer un rapport HTML global"
  echo "  --help                  Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  $0 --file=src/panier.php"
  echo "  $0 --dir=src/modules/users --report"
  echo "  $0 --batch --auto-remediate --update-discovery --report"
}

# Analyser les arguments
for arg in "$@"; do
  case $arg in
    --file=*)
      FILE="${arg#*=}"
      ;;
    --dir=*)
      DIRECTORY="${arg#*=}"
      ;;
    --batch)
      BATCH_MODE=true
      ;;
    --auto-remediate)
      AUTO_REMEDIATE=true
      ;;
    --update-discovery)
      UPDATE_DISCOVERY=true
      ;;
    --report)
      GENERATE_REPORT=true
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
if [ -z "$FILE" ] && [ -z "$DIRECTORY" ] && [ "$BATCH_MODE" = false ]; then
  echo "⚠️ Erreur: Vous devez spécifier un fichier (--file), un répertoire (--dir) ou utiliser le mode batch (--batch)"
  print_help
  exit 1
fi

# Préparer le JSON de contexte
JSON_CONTEXT="{"
if [ -n "$FILE" ]; then
  JSON_CONTEXT+="\"file\": \"$FILE\", "
fi
if [ -n "$DIRECTORY" ]; then
  JSON_CONTEXT+="\"directory\": \"$DIRECTORY\", "
fi
JSON_CONTEXT+="\"batchMode\": $BATCH_MODE, "
JSON_CONTEXT+="\"autoRemediate\": $AUTO_REMEDIATE, "
JSON_CONTEXT+="\"updateDiscoveryMap\": $UPDATE_DISCOVERY, "
JSON_CONTEXT+="\"generateReport\": $GENERATE_REPORT"
JSON_CONTEXT+="}"

echo "📄 Configuration:"
if [ -n "$FILE" ]; then
  echo "  Fichier à vérifier: $FILE"
fi
if [ -n "$DIRECTORY" ]; then
  echo "  Répertoire à vérifier: $DIRECTORY"
fi
if [ "$BATCH_MODE" = true ]; then
  echo "  Mode batch: Activé"
fi
if [ "$AUTO_REMEDIATE" = true ]; then
  echo "  Auto-remédiation: Activée"
fi
if [ "$UPDATE_DISCOVERY" = true ]; then
  echo "  Mise à jour discovery_map: Activée"
fi
if [ "$GENERATE_REPORT" = true ]; then
  echo "  Génération de rapport HTML: Activée"
fi
echo "----------------------------------------------------"

# Exécuter l'agent
echo "🚀 Exécution de l'agent diff-verifier..."
OUTPUT=$(pnpm tsx apps/mcp-server/src/handleAgentRequest.ts diff-verifier "$JSON_CONTEXT" 2>&1)
EXIT_CODE=$?

# Afficher la sortie
echo "$OUTPUT"

# Vérifier si un rapport a été généré
if [ "$GENERATE_REPORT" = true ] && [ "$EXIT_CODE" -eq 0 ]; then
  REPORT_PATH="reports/verification_summary.html"
  if [ -f "$REPORT_PATH" ]; then
    echo "----------------------------------------------------"
    echo "📊 Rapport de vérification généré: $(realpath $REPORT_PATH)"
  fi
fi

# Vérifier si l'index a été mis à jour
INDEX_PATH="reports/verifier_index.json"
if [ -f "$INDEX_PATH" ]; then
  VERIFIED_COUNT=$(grep -o "\"status\": \"verified\"" "$INDEX_PATH" | wc -l)
  DIVERGENT_COUNT=$(grep -o "\"status\": \"divergent\"" "$INDEX_PATH" | wc -l)
  CRITICAL_COUNT=$(grep -o "\"status\": \"critical\"" "$INDEX_PATH" | wc -l)
  
  echo "----------------------------------------------------"
  echo "📈 Progrès de migration:"
  echo "   ✅ Fichiers vérifiés: $VERIFIED_COUNT"
  echo "   ⚠️ Fichiers divergents: $DIVERGENT_COUNT"
  echo "   🔴 Fichiers critiques: $CRITICAL_COUNT"
fi

exit $EXIT_CODE