#!/bin/bash

# Script de vérification du cahier des charges
# Vérifie la cohérence, la structure et le contenu du cahier des charges

echo "🔍 Vérification du cahier des charges..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "./cahier-des-charges" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
  exit 1
fi

# Variables pour le suivi des problèmes
errors=0
warnings=0

# 1. Vérification de la présence des fichiers requis
echo "📋 Vérification des fichiers requis..."
required_files=(
  "00-sommaire.md"
  "01-introduction.md"
  "38-journal-modifications.md"
)

for file in "${required_files[@]}"; do
  if [ ! -f "./cahier-des-charges/$file" ]; then
    echo "❌ Erreur: Fichier requis manquant: $file"
    ((errors++))
  fi
done

# 2. Vérification des liens internes
echo "🔗 Vérification des liens internes..."
for file in ./cahier-des-charges/*.md; do
  # Extraire les références aux autres fichiers
  refs=$(grep -oE "\[.*\]\(.*\.md\)" "$file" | grep -oE "\(.*\.md\)" | tr -d '()')
  
  for ref in $refs; do
    if [ ! -f "./cahier-des-charges/$ref" ]; then
      echo "⚠️ Avertissement: Lien brisé dans $file: $ref"
      ((warnings++))
    fi
  done
done

# 3. Vérification de la validité du markdown
echo "📝 Vérification de la validité du markdown..."
if command -v markdownlint &>/dev/null; then
  markdownlint "./cahier-des-charges/*.md" || echo "⚠️ Avertissement: Problèmes de formatage markdown détectés"
else
  echo "ℹ️ markdownlint non disponible, vérification ignorée"
fi

# 4. Vérification des sections obligatoires
echo "📑 Vérification des sections obligatoires..."
if ! grep -q "# Introduction" "./cahier-des-charges/01-introduction.md"; then
  echo "❌ Erreur: Section 'Introduction' manquante"
  ((errors++))
fi

# 5. Vérification des mises à jour récentes
echo "🕒 Vérification des mises à jour récentes..."
last_update=$(grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2}" "./cahier-des-charges/38-journal-modifications.md" | head -1)
today=$(date "+%Y-%m-%d")
one_month_ago=$(date -d "30 days ago" "+%Y-%m-%d")

if [[ "$last_update" < "$one_month_ago" ]]; then
  echo "⚠️ Avertissement: Dernière mise à jour ($last_update) date de plus d'un mois"
  ((warnings++))
fi

# Bilan de la vérification
echo "-----------------------------------"
echo "🔍 Bilan de la vérification:"
echo "   - $errors erreurs"
echo "   - $warnings avertissements"

if [ $errors -eq 0 ]; then
  if [ $warnings -eq 0 ]; then
    echo "✅ Le cahier des charges est conforme et à jour!"
  else
    echo "⚠️ Le cahier des charges est conforme mais contient des avertissements."
  fi
  exit 0
else
  echo "❌ Le cahier des charges contient des erreurs à corriger."
  exit 1
fi
