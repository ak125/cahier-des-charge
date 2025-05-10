#!/bin/bash

# Script de diagnostic rapide pour l'architecture en 3 couches
# Ce script vérifie l'état actuel de l'architecture et diagnostique
# les problèmes potentiels dans le pipeline CI/CD.

echo "🔍 Diagnostic de l'architecture en 3 couches"
echo "============================================"

# Vérifier les structures de répertoires
echo -e "\n📂 Vérification des structures de répertoires:"
for dir in "packages/business" "packages/coordination" "packages/orchestration"; do
  if [ -d "$dir" ]; then
    echo "✅ $dir existe"
    
    # Compte des fichiers par couche
    file_count=$(find $dir -type f -name "*.ts" | wc -l)
    echo "   📊 $file_count fichiers TypeScript"
    
  else
    echo "❌ $dir n'existe pas"
  fi
done

# Vérifier l'état des workflows GitHub Actions
echo -e "\n🔄 Vérification des workflows GitHub Actions:"

workflows_ok=0
workflows_warning=0
workflows_error=0

for workflow in $(ls .github/workflows/*.yml); do
  if grep -q "packages/business" "$workflow" || grep -q "packages/coordination" "$workflow" || grep -q "packages/orchestration" "$workflow"; then
    # Le workflow contient des références aux nouvelles couches
    if grep -q "packages/agents" "$workflow" || grep -q "packages/mcp-agents" "$workflow"; then
      # Mais contient aussi des références aux anciens packages
      echo "⚠️ $workflow - Contient des références mixtes (transition)"
      workflows_warning=$((workflows_warning + 1))
    else
      echo "✅ $workflow - À jour avec la nouvelle structure"
      workflows_ok=$((workflows_ok + 1))
    fi
  elif grep -q "agents/" "$workflow" || grep -q "packages/agents" "$workflow" || grep -q "packages/mcp-agents" "$workflow"; then
    # Le workflow ne contient que des références aux anciens packages
    echo "❌ $workflow - Contient uniquement d'anciennes références"
    workflows_error=$((workflows_error + 1))
  else
    echo "ℹ️ $workflow - Non pertinent pour l'architecture"
  fi
done

echo -e "\n📊 Résumé des workflows:"
echo "   ✅ À jour: $workflows_ok"
echo "   ⚠️ En transition: $workflows_warning"
echo "   ❌ À mettre à jour: $workflows_error"

# Vérifier le script de génération de matrice de tests
echo -e "\n🧪 Vérification du script de génération de matrice de tests:"
if [ -f "tools/ci/generate-test-matrix.js" ]; then
  if grep -q "packages/business" "tools/ci/generate-test-matrix.js" || grep -q "packages/coordination" "tools/ci/generate-test-matrix.js" || grep -q "packages/orchestration" "tools/ci/generate-test-matrix.js"; then
    echo "✅ Le script de génération de matrice de tests est à jour"
  else
    echo "⚠️ Le script de génération de matrice de tests ne contient pas de références à la nouvelle architecture"
  fi
else
  echo "❌ Le script de génération de matrice de tests n'existe pas à l'emplacement attendu"
fi

# Vérifier la configuration Earthfile
echo -e "\n🔧 Vérification de la configuration Earthfile:"
if [ -f "Earthfile" ]; then
  if grep -q "validate-3layer" "Earthfile"; then
    echo "✅ Earthfile contient la validation de la structure en 3 couches"
  else
    echo "❌ Earthfile ne contient pas de validation de la structure en 3 couches"
  fi
  
  if grep -q "validate-architecture" "Earthfile"; then
    echo "✅ Earthfile contient la validation complète de l'architecture"
  else
    echo "❌ Earthfile ne contient pas de validation complète de l'architecture"
  fi
else
  echo "❌ Fichier Earthfile introuvable"
fi

# Recommandations
echo -e "\n📋 Recommandations:"
if [ $workflows_error -gt 0 ]; then
  echo "⚠️ Il reste $workflows_error workflow(s) à mettre à jour pour la nouvelle structure"
  echo "   Exécutez: node tools/ci/deep-check-workflows.js pour identifier les workflows spécifiques"
fi

if [ ! -f "tools/ci/validate-architecture.js" ]; then
  echo "⚠️ Il est recommandé de créer un script validate-architecture.js pour valider l'architecture complète"
fi

echo -e "\n✨ Diagnostic terminé! ✨"
