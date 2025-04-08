#!/bin/bash

# Script de mise à jour du cahier des charges
# Effectue plusieurs opérations pour maintenir la cohérence du cahier des charges

echo "🔄 Mise à jour du cahier des charges..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "./cahier-des-charges" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
  exit 1
fi

# 1. Mise à jour des références croisées
echo "📑 Mise à jour des références croisées..."
for file in ./cahier-des-charges/*.md; do
  # Remplacer les références obsolètes (exemple simpliste)
  sed -i 's/\(voir section \)[0-9]\+/\1XX/g' "$file"
done

# 2. Mise à jour du sommaire
echo "📚 Génération du sommaire..."
node ./scripts/generate-toc.js > ./cahier-des-charges/00-sommaire.md

# 3. Vérification des numéros de version
echo "🔢 Vérification des numéros de version..."
current_version=$(grep -oE "version: [0-9]+\.[0-9]+\.[0-9]+" "./CHANGELOG.md" | head -1 | cut -d' ' -f2)
echo "Version actuelle: $current_version"

# 4. Ajout d'une entrée au journal des modifications
echo "📝 Ajout au journal des modifications..."
current_date=$(date "+%Y-%m-%d %H:%M:%S")
entry="### $current_date\n**Auteur**: Script automatique\n**Sections**: diverses\n**Type**: Mise à jour\n**Résumé**: Mise à jour automatique du cahier des charges via script update-cahier.sh\n\n"

# Ajouter l'entrée après la ligne "## 📜 Journal des modifications"
sed -i "/## 📜 Journal des modifications/a $entry" "./cahier-des-charges/38-journal-modifications.md"

# 5. Génération de la vue HTML
echo "🌐 Génération de la vue HTML..."
npm run generate-view

echo "✅ Mise à jour terminée!"
echo "➡️  Exécutez './verify-cahier.sh' pour vérifier la cohérence"

