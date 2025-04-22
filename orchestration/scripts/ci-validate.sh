#!/bin/bash

# Script de validation CI pour TypeScript et ESLint
# Date: 21 avril 2025

echo "🔍 Validation du code avant commit/push"

# Exécuter la vérification des types TypeScript
echo "⌛ Vérification des types TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Erreur: La vérification des types TypeScript a échoué."
  exit 1
fi
echo "✅ Vérification des types TypeScript réussie"

# Exécuter ESLint
echo "⌛ Vérification des règles ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Erreur: La validation ESLint a échoué."
  exit 1
fi
echo "✅ Vérification ESLint réussie"

echo "🎉 Validation complète réussie!"
exit 0
