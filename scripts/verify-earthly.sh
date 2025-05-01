#!/bin/bash

# Script de vérification Earthly
# Permet de tester rapidement que la configuration Earthly fonctionne correctement

echo "🔍 Vérification de l'installation d'Earthly..."
if ! command -v earthly &> /dev/null; then
  echo "❌ Earthly n'est pas installé ou n'est pas dans le PATH."
  echo "   Veuillez installer Earthly : https://earthly.dev/get-earthly"
  exit 1
else
  EARTHLY_VERSION=$(earthly --version | head -n 1)
  echo "✅ $EARTHLY_VERSION installé."
fi

echo ""
echo "🧪 Test rapide des cibles principales..."

# Test de la cible lint
echo "📋 Test de la cible '+lint'..."
earthly --ci +lint
if [ $? -eq 0 ]; then
  echo "✅ +lint réussie!"
else
  echo "❌ +lint a échoué!"
fi

# Test de la cible typecheck
echo "📋 Test de la cible '+typecheck'..."
earthly --ci +typecheck
if [ $? -eq 0 ]; then
  echo "✅ +typecheck réussie!"
else
  echo "❌ +typecheck a échoué!"
fi

# Test de la cible de build Remix
echo "📋 Test de la cible '+remix-build'..."
earthly --ci +remix-build
if [ $? -eq 0 ]; then
  echo "✅ +remix-build réussie!"
else
  echo "❌ +remix-build a échoué!"
fi

echo ""
echo "✨ Vérification terminée!"

# Afficher un message d'aide
echo ""
echo "🚀 Pour exécuter la CI complète localement :"
echo "   earthly +ci"
echo ""
echo "🚀 Pour déployer en staging :"
echo "   earthly +deploy-staging"
echo ""
echo "🚀 Pour déployer en production :"
echo "   earthly +deploy-production"