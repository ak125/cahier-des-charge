#!/bin/bash
# Script pour unifier les agents MCP
# Usage: ./unify-agents.sh [--exec]

set -e

echo "🚀 Outil d'unification des Agents MCP"
echo "===================================="

# Vérifier si ts-node est installé
if ! command -v ts-node &> /dev/null; then
  echo "⚠️ ts-node n'est pas installé globalement."
  echo "Installation en cours..."
  npm install -g ts-node
fi

echo ""
echo "📊 Exécution de l'analyse des agents..."
echo ""

# Exécuter le script d'analyse directement avec ts-node pour éviter les problèmes de compilation
if [ "$1" == "--exec" ]; then
  echo "⚠️ MODE EXÉCUTION RÉELLE ⚠️"
  echo "Les agents seront effectivement migrés"
  
  # Demander confirmation
  read -p "Êtes-vous sûr de vouloir procéder à la migration réelle ? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    ts-node tools/agent-migration-analyzer.ts --exec
  else
    echo "Migration annulée."
    exit 0
  fi
else
  echo "ℹ️ MODE DRY RUN"
  echo "Aucune modification ne sera effectuée"
  ts-node tools/agent-migration-analyzer.ts
fi

echo ""
echo "📝 Génération du rapport de migration..."

# Créer un rapport de migration
timestamp=$(date +"%Y%m%d-%H%M%S")
report_file="agent-migration-report-$timestamp.md"

echo "# Rapport de Migration des Agents MCP" > "$report_file"
echo "Date: $(date)" >> "$report_file"
echo "" >> "$report_file"
echo "## Agents analysés" >> "$report_file"

# Ajouter une liste des agents analysés
echo "Un rapport de migration a été généré: $report_file"
echo ""
echo "✅ Terminé"