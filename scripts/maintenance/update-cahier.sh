#!/bin/bash

echo "🔄 Mise à jour automatique du Cahier des Charges..."

CDC_DIR="cahier-des-charges"
SOMMAIRE_FILE="$CDC_DIR/00-sommaire.md"
CHANGELOG_FILE="$CDC_DIR/changelog.md"
BACKUP_DIR="$CDC_DIR/backups"

# Création du répertoire de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Sauvegarde des fichiers avant modification (nouvelle fonctionnalité)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "📦 Sauvegarde des fichiers avant modification..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" "$CDC_DIR"/*.md

# Vérification du dossier
if [ ! -d "$CDC_DIR" ]; then
  echo "❌ Dossier '$CDC_DIR' introuvable. Lancez d'abord ./setup-cahier.sh."
  exit 1
fi

# Détection des fichiers Markdown
echo "📁 Recherche de fichiers dans '$CDC_DIR'..."
md_files=$(find "$CDC_DIR" -type f -name "*.md" ! -name "00-sommaire.md" ! -name "changelog.md" ! -name "interdependances.md" | sort)

# Mise à jour de la table des matières
echo "🧩 Mise à jour de la table des matières..."
echo "# Cahier des Charges - Sommaire" > "$SOMMAIRE_FILE"
echo "" >> "$SOMMAIRE_FILE"
echo "## Sections principales" >> "$SOMMAIRE_FILE"
echo "" >> "$SOMMAIRE_FILE"

for f in $md_files; do
  # Extraction du titre principal du fichier
  title=$(grep -m 1 "^# " "$f" | sed 's/# //')
  rel_path=$(basename "$f")
  
  # Format avec émojis selon le type de fichier
  if [[ "$rel_path" == *"exigences"* ]]; then
    echo "- 📋 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"specifications"* ]]; then
    echo "- 🔧 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"architecture"* ]]; then
    echo "- 🤖 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"migration"* ]]; then
    echo "- 🔄 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"seo"* ]]; then
    echo "- 🔍 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"suivi"* ]]; then
    echo "- 📊 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"module"* ]]; then
    echo "- 📦 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"agent"* ]]; then
    echo "- 🤖 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"interdependance"* ]]; then
    echo "- 🔄 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  elif [[ "$rel_path" == *"decision"* ]]; then
    echo "- 📝 [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  else
    echo "- [$title](./$rel_path)" >> "$SOMMAIRE_FILE"
  fi
done

# Ajout du changelog et des documents spéciaux
echo "" >> "$SOMMAIRE_FILE"
echo "## Documents transverses" >> "$SOMMAIRE_FILE"
echo "" >> "$SOMMAIRE_FILE"
echo "- 🔄 [Matrice des interdépendances](./interdependances.md)" >> "$SOMMAIRE_FILE"
echo "- 📝 [Historique des modifications](./changelog.md)" >> "$SOMMAIRE_FILE"

echo "✅ Table des matières mise à jour : $SOMMAIRE_FILE"

# Mise à jour automatique du changelog si Git actif
if [ -d .git ]; then
  echo "📝 Ajout d'une entrée dans le changelog..."
  DATE=$(date +'%Y-%m-%d %H:%M')
  AUTHOR=$(git config user.name || echo "Anonyme")
  echo -e "\n## $DATE – Mise à jour automatique" >> "$CHANGELOG_FILE"
  echo "- Auteur : $AUTHOR" >> "$CHANGELOG_FILE"
  echo "- Fichiers modifiés :" >> "$CHANGELOG_FILE"
  git -C "$CDC_DIR" diff --name-only | sed 's/^/  - /' >> "$CHANGELOG_FILE"
  
  # Ajout des nouveaux fichiers au changelog
  NEW_FILES=$(git -C "$CDC_DIR" ls-files --others --exclude-standard)
  if [ ! -z "$NEW_FILES" ]; then
    echo "- Nouveaux fichiers :" >> "$CHANGELOG_FILE"
    echo "$NEW_FILES" | sed 's/^/  - /' >> "$CHANGELOG_FILE"
  fi
  
  # Détection des renommages/déplacements de fichiers (nouvelle fonctionnalité)
  echo "🔍 Détection des renommages ou déplacements de fichiers..."
  RENAMED_FILES=$(git diff --name-status | grep "^R" | awk '{print $2 " -> " $3}')
  if [ -n "$RENAMED_FILES" ]; then
    echo "ℹ️ Fichiers renommés détectés:"
    echo "$RENAMED_FILES"
    echo "- Fichiers renommés:" >> "$CHANGELOG_FILE"
    echo "$RENAMED_FILES" | sed 's/^/  - /' >> "$CHANGELOG_FILE"
  fi

  echo "✅ Entrée changelog ajoutée."
else
  echo "⚠️ Git non initialisé, changelog non enrichi automatiquement."
fi

# Vérification des numéros de section et réorganisation si nécessaire (amélioration)
echo "🔢 Vérification de la séquence des numéros de section..."
FILES=$(find "$CDC_DIR" -name "[0-9][0-9]*-*.md" | sort)
EXPECTED_NUM=1

for file in $FILES; do
  if [[ "$(basename "$file")" == "00-sommaire.md" ]]; then
    continue
  fi
  
  filename=$(basename "$file")
  if [[ $filename =~ ^([0-9][0-9]*)- ]]; then
    current_num=${BASH_REMATCH[1]}
    padded_expected=$(printf "%02d" $EXPECTED_NUM)
    
    if [ "$current_num" != "$padded_expected" ]; then
      echo "⚠️ Numéro de section incorrect: $filename (attendu: ${padded_expected}-*)"
      new_filename="${padded_expected}${filename:${#current_num}}"
      echo "🔄 Renommage: $filename → $new_filename"
      
      if [ -f "$CDC_DIR/$new_filename" ]; then
        echo "❌ Impossible de renommer: $new_filename existe déjà!"
      else
        mv "$file" "$CDC_DIR/$new_filename"
        echo "- Fichier renommé: $filename → $new_filename" >> "$CHANGELOG_FILE"
      fi
    fi
    
    EXPECTED_NUM=$((EXPECTED_NUM + 1))
  fi
done

# Vérification des références d'image et ressources (nouvelle fonctionnalité)
echo "🖼️ Optimisation des références aux ressources..."
for md_file in "$CDC_DIR"/*.md; do
  # Recherche et correction des chemins relatifs incorrects
  sed -i 's|\.\./images/|./images/|g' "$md_file"
  
  # Extraction des liens d'images sans texte alternatif et ajout d'un alt
  sed -i 's|!\[\](|![Image](|g' "$md_file"
done

# Génération d'un fichier de métadonnées (nouvelle fonctionnalité)
echo "📊 Génération des métadonnées du cahier des charges..."
METADATA_FILE="$CDC_DIR/metadata.json"

# Compter les fichiers, sections, etc.
TOTAL_FILES=$(find "$CDC_DIR" -name "*.md" | wc -l)
TOTAL_SECTIONS=$(grep -r "^## " "$CDC_DIR" | wc -l)
TOTAL_SUBSECTIONS=$(grep -r "^### " "$CDC_DIR" | wc -l)
LAST_UPDATED=$(date +"%Y-%m-%d %H:%M:%S")
WORD_COUNT=$(find "$CDC_DIR" -name "*.md" -exec cat {} \; | wc -w)

# Générer le JSON
cat > "$METADATA_FILE" << EOL
{
  "title": "Cahier des Charges - Migration IA",
  "lastUpdated": "$LAST_UPDATED",
  "stats": {
    "files": $TOTAL_FILES,
    "sections": $TOTAL_SECTIONS,
    "subsections": $TOTAL_SUBSECTIONS,
    "words": $WORD_COUNT
  },
  "contributors": [
    $(git log --format="%an" | sort | uniq | sed 's/^/    "/;s/$/"/' | tr '\n' ',' | sed 's/,$//')
  ],
  "version": "$(cat version.txt 2>/dev/null || echo "1.0.0")"
}
EOL

echo "✅ Métadonnées générées: $METADATA_FILE"

# Vérification des technologies obsolètes
echo -e "${BLUE}🔍 Vérification des technologies obsolètes...${NC}"
if [ -f "scripts/check-tech-obsolescence.js" ]; then
  node scripts/check-tech-obsolescence.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vérification des technologies terminée${NC}"
  else
    echo -e "${YELLOW}⚠️ Des technologies obsolètes ont été détectées${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Script de vérification des technologies non disponible${NC}"
fi

# Vérification des incohérences
echo -e "${BLUE}🔍 Vérification des incohérences documentation-code...${NC}"
if [ -f "scripts/check-mismatches.js" ]; then
  node scripts/check-mismatches.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vérification des incohérences terminée${NC}"
  else
    echo -e "${YELLOW}⚠️ Des incohérences ont été détectées${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Script de vérification des incohérences non disponible${NC}"
fi

# Vérification des alertes de désynchronisation
echo -e "${BLUE}🔍 Vérification des alertes de désynchronisation...${NC}"
if [ -f "scripts/check-desync-alerts.js" ]; then
  node scripts/check-desync-alerts.js
  ALERTS_STATUS=$?
  
  if [ $ALERTS_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune alerte critique de désynchronisation${NC}"
  else
    echo -e "${YELLOW}⚠️ Des alertes de désynchronisation critiques ont été détectées${NC}"
    echo -e "${YELLOW}   Consultez le tableau de bord pour plus de détails${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Script de vérification des alertes non disponible${NC}"
fi

# Vérification de l'intégrité
echo "🔍 Exécution de la vérification d'intégrité..."
./verify-integrity.sh

# Génération de la documentation HTML
if [ -f "generate_cahier_html.py" ]; then
  echo "📄 Génération de la documentation HTML..."
  python3 generate_cahier_html.py
fi

# Vérification de l'intégrité après toutes les modifications
echo "🔍 Exécution de la vérification d'intégrité finale..."
./verify-integrity.sh

echo "✅ Mise à jour du cahier des charges terminée."
