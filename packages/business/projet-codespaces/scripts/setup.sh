#!/bin/bash

echo "📦 Initialisation du Cahier des Charges..."

# Vérifier le chemin du fichier .b64
ZIPB64_PATH="../cahier-des-charges.zip.b64"
if [ ! -f "$ZIPB64_PATH" ]; then
  echo "🔍 Recherche alternative du fichier..."
  ZIPB64_PATH=$(find .. -name "cahier-des-charges.zip.b64" -type f | head -n 1)
  
  if [ -z "$ZIPB64_PATH" ]; then
    echo "❌ Fichier cahier-des-charges.zip.b64 non trouvé."
    exit 1
  else
    echo "✅ Fichier trouvé à: $ZIPB64_PATH"
  fi
fi

# Étape 1 : Décoder le fichier .b64 en .zip
echo "📥 Décodage de 'cahier-des-charges.zip.b64'..."
base64 -d "$ZIPB64_PATH" > ../cahier-des-charges.zip

# Étape 2 : Extraire le .zip dans le répertoire parent
echo "📂 Extraction de l'archive..."
unzip -o ../cahier-des-charges.zip -d ../cahier-des-charges > /dev/null

# Étape 3 : Installer pandoc (si non installé)
if ! command -v pandoc &> /dev/null; then
  echo "🔧 Installation de Pandoc (génération HTML)..."
  sudo apt update && sudo apt install -y pandoc
else
  echo "✅ Pandoc déjà installé."
fi

# Étape 4 : Donner les droits d'exécution au script export
chmod +x ../cahier-des-charges/export.sh

# Étape 5 : Créer un lien symbolique dans le répertoire principal pour faciliter l'accès
ln -sf ../cahier-des-charges/export.sh ../export-cahier.sh

# Étape 6 : Affichage du contenu
echo "✅ Cahier des charges installé dans ../cahier-des-charges/"
echo "📄 Fichiers disponibles :"
ls -la ../cahier-des-charges

# Étape 7 : Suggestion d'ouverture dans VSCode
echo -e "\n👉 Pour commencer à travailler :"
echo "cd ../cahier-des-charges"
echo "code ."

# Étape 8 : Informations sur l'utilisation
echo -e "\n📋 Structure du cahier des charges :"
echo "- 00-sommaire.md - Vue d'ensemble du document"
echo "- 01-contexte.md - Contexte du projet"
echo "- 02-objectifs.md - Objectifs du projet"
echo "- 11-suivi-IA.md - Suivi de l'intelligence artificielle"
echo "- 12-controle-qualite.md - Procédures de contrôle qualité"
echo "- 13-backlog.md - Liste des tâches à réaliser"
echo "- 14-risques.md - Analyse des risques"
echo "- 15-kpi.md - Indicateurs clés de performance"
echo "- 16-pipeline.md - Pipeline de développement"
echo "- 17-validation.md - Processus de validation"
echo "- 18-mismatch.md - Gestion des incohérences"
echo "- 19-audit-pr.md - Audit des pull requests"
echo "- 20-dashboard.md - Tableau de bord du projet"
echo "- 21-versioning.md - Gestion des versions"
echo "- 22-stack-technique.md - Stack technique utilisée"
echo -e "\n📜 Vous pouvez exporter le cahier des charges en HTML avec :"
echo "./export-cahier.sh"
