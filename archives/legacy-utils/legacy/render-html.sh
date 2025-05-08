#!/bin/bash

# Script de génération de vue HTML du cahier des charges
# Version simplifiée pour éviter les problèmes de syntaxe

set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier le mode dry run
DRY_RUN=false
if [ "$1" = "--dry-run" ] || [ "$DRY_RUN" = "true" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}[Mode simulation] Aucune modification ne sera effectuée${NC}"
fi

# Charger la configuration
CONFIG_FILE="cahier_check.config.json"
CAHIER_PATH="./cahier"
HTML_OUTPUT="./dist/cahier.html"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}📂 Chargement de la configuration...${NC}"
    CAHIER_PATH=$(grep -o '"cahier"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    HTML_PATH=$(grep -o '"htmlOutput"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    
    if [ ! -z "$HTML_PATH" ]; then
        HTML_OUTPUT=$HTML_PATH
    fi
fi

echo -e "${BLUE}🔍 Démarrage de la génération de la vue HTML...${NC}"
echo -e "📂 Répertoire: $CAHIER_PATH"
echo -e "📄 Sortie HTML: $HTML_OUTPUT"

# Vérifier si le répertoire existe
if [ ! -d "$CAHIER_PATH" ]; then
    echo -e "${RED}❌ Le répertoire $CAHIER_PATH n'existe pas.${NC}"
    exit 1
fi

# Créer le répertoire de sortie si nécessaire
if [ "$DRY_RUN" = "false" ]; then
    mkdir -p "$(dirname "$HTML_OUTPUT")"
fi

# Trouver les fichiers Markdown
echo -e "${BLUE}📄 Recherche des fichiers Markdown...${NC}"
MD_FILES=$(find "$CAHIER_PATH" -type f -name "*.md" | sort)
MD_COUNT=$(echo "$MD_FILES" | wc -l)

if [ "$MD_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Aucun fichier Markdown trouvé. Impossible de générer le HTML.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Trouvé $MD_COUNT fichiers Markdown${NC}"

# Créer un fichier HTML
echo -e "${BLUE}🔧 Génération du fichier HTML...${NC}"

# En mode dry run, simuler seulement
if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}[Simulation] Génération de l'entête HTML${NC}"
    echo -e "${YELLOW}[Simulation] Traitement des fichiers Markdown${NC}"
    for file in $MD_FILES; do
        echo -e "${YELLOW}[Simulation] Traitement de $(basename "$file")${NC}"
    done
    echo -e "${YELLOW}[Simulation] Finalisation du fichier HTML${NC}"
    echo -e "${GREEN}✅ [Simulation] Vue HTML générée avec succès: $HTML_OUTPUT${NC}"
    exit 0
fi

# Entête HTML
cat > "$HTML_OUTPUT" << EOL
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cahier des Charges</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    h3 { color: #2980b9; }
    pre { background-color: #f8f8f8; padding: 10px; border-radius: 5px; overflow: auto; }
    code { background-color: #f8f8f8; padding: 2px 4px; border-radius: 3px; }
    .chapter { margin-bottom: 40px; }
    #toc { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div id="toc">
    <h2>Table des matières</h2>
    <ul>
EOL

# Trouver le fichier README.md ou sommaire.md s'il existe
SUMMARY_FILE=""
for file in $MD_FILES; do
    filename=$(basename "$file")
    if [ "$filename" = "README.md" ] || [ "$filename" = "00-sommaire.md" ] || [ "$filename" = "sommaire.md" ]; then
        SUMMARY_FILE="$file"
        break
    fi
done

# Générer la table des matières
for file in $MD_FILES; do
    # Ignorer le fichier de sommaire dans la TOC (il sera traité en premier)
    if [ "$file" = "$SUMMARY_FILE" ]; then
        continue
    fi
    
    filename=$(basename "$file")
    id="${filename%.md}"
    
    # Extraire le titre du fichier (première ligne commençant par #)
    title=$(grep -m 1 "^#" "$file" | sed 's/^#\+[[:space:]]*//')
    
    # Si aucun titre n'a été trouvé, utiliser le nom du fichier
    if [ -z "$title" ]; then
        title="${filename%.md}"
    fi
    
    # Ajouter à la table des matières
    echo "      <li><a href=\"#$id\">$title</a></li>" >> "$HTML_OUTPUT"
done

# Fermer la table des matières
cat >> "$HTML_OUTPUT" << EOL
    </ul>
  </div>
EOL

# Simple transformation Markdown pour chaque fichier
for file in $MD_FILES; do
    filename=$(basename "$file")
    echo -e "${BLUE}📄 Traitement de $filename...${NC}"
    
    # Créer un div pour ce fichier
    echo "<div class=\"chapter\" id=\"${filename%.md}\">" >> "$HTML_OUTPUT"
    
    # Convertir simplement les titres et paragraphes
    while IFS= read -r line; do
        # Titres
        if [[ "$line" == "# "* ]]; then
            echo "<h1>${line#"# "}</h1>" >> "$HTML_OUTPUT"
        elif [[ "$line" == "## "* ]]; then
            echo "<h2>${line#"## "}</h2>" >> "$HTML_OUTPUT"
        elif [[ "$line" == "### "* ]]; then
            echo "<h3>${line#"### "}</h3>" >> "$HTML_OUTPUT"
        elif [[ "$line" == "#### "* ]]; then
            echo "<h4>${line#"#### "}</h4>" >> "$HTML_OUTPUT"
        # Ligne vide
        elif [[ -z "$line" ]]; then
            echo "" >> "$HTML_OUTPUT"
        # Ligne normale (paragraphe)
        else
            echo "<p>$line</p>" >> "$HTML_OUTPUT"
        fi
    done < "$file"
    
    # Fermer le div
    echo "</div>" >> "$HTML_OUTPUT"
done

# Pied de page HTML
cat >> "$HTML_OUTPUT" << EOL

  <footer>
    <p>Généré le $(date) par le script render-html.sh</p>
  </footer>
</body>
</html>
EOL

echo -e "${GREEN}✅ Vue HTML générée avec succès: $HTML_OUTPUT${NC}"
