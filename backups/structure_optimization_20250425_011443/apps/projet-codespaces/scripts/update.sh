#!/bin/bash

echo "🔄 Mise à jour du Cahier des Charges..."

# Étape 1 : Vérifier que le dossier existe
if [ ! -d ../cahier-des-charges ]; then
  echo "❌ Dossier 'cahier-des-charges' introuvable. Exécutez d'abord setup.sh."
  exit 1
fi

# Étape 2 : Afficher les fichiers modifiés
echo "📋 Fichiers modifiés depuis le dernier commit (si Git initialisé) :"
if [ -d ../.git ]; then
  git -C ../cahier-des-charges status --short
else
  echo "⚠️ Git non initialisé. Les modifications ne sont pas tracées."
  echo "📄 Liste des fichiers modifiés récemment :"
  find ../cahier-des-charges -type f -mtime -7 | sort
fi

# Étape 3 : Mise à jour de la table des matières (si 00-sommaire.md existe)
if [ -f ../cahier-des-charges/00-sommaire.md ]; then
  echo "🧩 Mise à jour du sommaire..."
  echo "# Table des matières du cahier des charges" > ../cahier-des-charges/00-sommaire.md
  echo "" >> ../cahier-des-charges/00-sommaire.md
  
  # Parcourir les fichiers md dans l'ordre numérique
  for file in $(find ../cahier-des-charges -name "*.md" | grep -v "00-sommaire.md" | sort); do
    # Extraire le nom du fichier sans chemin
    filename=$(basename "$file")
    # Extraire le titre (première ligne commençant par #)
    title=$(grep -m 1 '^#' "$file" | sed 's/^# //g')
    if [ -z "$title" ]; then
      title="$filename (sans titre)"
    fi
    echo "- [$title]($filename)" >> ../cahier-des-charges/00-sommaire.md
  done
  
  echo "✅ Table des matières mise à jour dans 00-sommaire.md"
fi

# Étape 4 : Mise à jour du changelog
echo "📝 Mise à jour du changelog..."
if [ -f ../cahier-des-charges/changelog.md ]; then
  echo "Voulez-vous ajouter une entrée au changelog? (o/n): "
  read -r response
  if [[ "$response" =~ ^[Oo]$ ]]; then
    echo "Entrez la description de la modification: "
    read -r change_desc
    
    # Ajouter l'entrée au début du fichier changelog
    timestamp=$(date "+%Y-%m-%d %H:%M")
    temp_file=$(mktemp)
    echo "## $timestamp" > "$temp_file"
    echo "$change_desc" >> "$temp_file"
    echo "" >> "$temp_file"
    cat ../cahier-des-charges/changelog.md >> "$temp_file"
    mv "$temp_file" ../cahier-des-charges/changelog.md
    
    echo "✅ Changelog mis à jour"
  else
    echo "⏭️ Aucune modification du changelog"
  fi
else
  echo "⚠️ Fichier changelog.md non trouvé"
fi

# Étape 5 : Exportation automatique du document (HTML)
echo "🔄 Voulez-vous générer une version HTML du cahier des charges? (o/n): "
read -r export_response
if [[ "$export_response" =~ ^[Oo]$ ]]; then
  if [ -f ../cahier-des-charges/export.sh ]; then
    echo "🔄 Génération du document HTML..."
    cd ../cahier-des-charges && ./export.sh
    echo "✅ Document HTML généré"
  else
    echo "❌ Script d'exportation export.sh non trouvé"
  fi
fi

