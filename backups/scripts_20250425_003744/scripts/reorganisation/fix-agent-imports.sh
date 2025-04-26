#!/bin/bash
# fix-agent-imports.sh - Corrige les imports des agents après réorganisation
# Date: 10 avril 2025

echo "🔧 Correction des imports dans les fichiers d'agents..."

# Fonction pour corriger les imports dans un fichier
fix_imports() {
  local file="$1"
  local agent_type="$2"  # 'core', 'analysis', 'migration' ou 'quality'
  
  echo "📝 Traitement de $file..."
  
  # Correction des imports de modules standards (ne devrait pas poser de problèmes)
  # On les laisse tels quels, car ce sont des packages npm valides
  
  # Correction des imports relatifs pour BaseAgent
  if grep -q "import.*BaseAgent.*from.*'./BaseAgent'" "$file"; then
    echo "  - Correction des imports BaseAgent..."
    sed -i "s|import { BaseAgent } from './BaseAgent'|import { BaseAgent } from '../core/BaseAgent'|g" "$file"
  fi
  
  # Correction des imports relatifs pour d'autres agents
  if [[ "$agent_type" == "analysis" ]]; then
    # Correction des imports spécifiques aux agents d'analyse
    if grep -q "import.*DataAnalyzer.*from.*'./agent-donnees'" "$file"; then
      echo "  - Correction des imports DataAnalyzer..."
      sed -i "s|import { DataAnalyzer } from './agent-donnees'|import { DataAnalyzer } from './agent-donnees'|g" "$file"
    fi
  fi
  
  # Ajout de plus de corrections selon les besoins spécifiques
  if [[ "$agent_type" == "migration" ]]; then
    # Correction des imports spécifiques aux agents de migration
    if grep -q "import.*StructureAnalyzer.*from.*'./agent-structure'" "$file"; then
      echo "  - Correction des imports StructureAnalyzer..."
      sed -i "s|import { StructureAnalyzer } from './agent-structure'|import { StructureAnalyzer } from '../analysis/agent-structure'|g" "$file"
    fi
  fi
  
  if [[ "$agent_type" == "quality" ]]; then
    # Correction des imports spécifiques aux agents de qualité
    if grep -q "import.*BusinessLogic.*from.*'./agent-business'" "$file"; then
      echo "  - Correction des imports BusinessLogic..."
      sed -i "s|import { BusinessLogic } from './agent-business'|import { BusinessLogic } from '../migration/agent-business'|g" "$file"
    fi
  fi
  
  echo "  ✅ Imports corrigés dans $file"
}

# Trouver tous les fichiers .ts dans les dossiers agents
echo "🔍 Recherche des fichiers d'agents..."

# Correction des imports dans les agents de base (core)
find ./agents/core -name "*.ts" | while read file; do
  fix_imports "$file" "core"
done

# Correction des imports dans les agents d'analyse
find ./agents/analysis -name "*.ts" | while read file; do
  fix_imports "$file" "analysis"
done

# Correction des imports dans les agents de migration
find ./agents/migration -name "*.ts" | while read file; do
  fix_imports "$file" "migration"
done

# Correction des imports dans les agents de qualité
find ./agents/quality -name "*.ts" | while read file; do
  fix_imports "$file" "quality"
done

echo "✅ Correction des imports terminée."
echo "📌 Note: Certains imports peuvent nécessiter des ajustements manuels supplémentaires."
echo "   Vérifiez les erreurs éventuelles en exécutant 'npm run build' ou en vérifiant avec TypeScript."