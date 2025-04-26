#!/bin/bash

echo "🔍 Vérification approfondie de l'intégrité du cahier des charges..."

CDC_DIR="cahier-des-charges"

# Vérifier l'existence du dossier
if [ ! -d "$CDC_DIR" ]; then
  echo "❌ Dossier '$CDC_DIR' introuvable."
  exit 1
fi

# Vérifier l'existence des fichiers essentiels
REQUIRED_FILES=("00-sommaire.md" "01-introduction.md" "changelog.md")
MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$CDC_DIR/$file" ]; then
    echo "❌ Fichier essentiel manquant: $file"
    MISSING_FILES=$((MISSING_FILES+1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️ $MISSING_FILES fichiers essentiels manquants. Exécutez setup-cahier.sh pour les créer."
fi

# Vérifier les références croisées entre fichiers
echo "🔄 Vérification des références croisées..."
BROKEN_REFS=0

# Extraire toutes les références [Nom du fichier](./fichier.md)
for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  refs=$(grep -o -E '\[.*\]\(\.\/[^)]+\)' "$md_file" | grep -o -E '\.\/[^)]+')
  
  for ref in $refs; do
    ref_path="${ref:2}" # Supprimer le ./
    if [ ! -f "$CDC_DIR/$ref_path" ]; then
      echo "❌ Référence cassée dans $filename: $ref"
      BROKEN_REFS=$((BROKEN_REFS+1))
    fi
  done
done

if [ $BROKEN_REFS -gt 0 ]; then
  echo "⚠️ $BROKEN_REFS références cassées détectées."
else
  echo "✅ Toutes les références sont valides."
fi

# Vérifier que le sommaire inclut tous les fichiers
echo "📑 Vérification de l'exhaustivité du sommaire..."
SOMMAIRE_FILE="$CDC_DIR/00-sommaire.md"
MISSING_IN_TOC=0

for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Exclure le sommaire lui-même et le changelog qui est géré séparément
  if [[ "$filename" != "00-sommaire.md" && "$filename" != "changelog.md" ]]; then
    if ! grep -q "$filename" "$SOMMAIRE_FILE"; then
      echo "❌ Fichier non référencé dans le sommaire: $filename"
      MISSING_IN_TOC=$((MISSING_IN_TOC+1))
    fi
  fi
done

if [ $MISSING_IN_TOC -gt 0 ]; then
  echo "⚠️ $MISSING_IN_TOC fichiers non référencés dans le sommaire. Exécutez update-cahier.sh pour mettre à jour."
else
  echo "✅ Le sommaire inclut tous les fichiers."
fi

# Vérifier la cohérence des titres et niveaux de titres
echo "📚 Vérification de la structure hiérarchique des documents..."
TITLE_ISSUES=0

for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Vérifier que chaque fichier commence par un titre de niveau 1
  if ! head -1 "$md_file" | grep -q "^# "; then
    echo "❌ $filename ne commence pas par un titre de niveau 1"
    TITLE_ISSUES=$((TITLE_ISSUES+1))
  fi
  
  # Vérifier qu'il n'y a pas de saut dans la hiérarchie des titres (ex: h1 -> h3 sans h2)
  if grep -q "^### " "$md_file" && ! grep -q "^## " "$md_file"; then
    echo "❌ $filename contient des titres de niveau 3 sans titre de niveau 2"
    TITLE_ISSUES=$((TITLE_ISSUES+1))
  fi
done

if [ $TITLE_ISSUES -gt 0 ]; then
  echo "⚠️ $TITLE_ISSUES problèmes de structure hiérarchique détectés."
else
  echo "✅ La structure hiérarchique des documents est cohérente."
fi

# Vérification des numéros de section (amélioration)
echo "🔢 Vérification de la séquence des numéros de section..."
FILES=$(find "$CDC_DIR" -name "[0-9]*.md" | sort)
PREV_NUM=0
SEQUENCE_ISSUES=0

for file in $FILES; do
  filename=$(basename "$file")
  if [[ $filename =~ ^([0-9]+) ]]; then
    num=${BASH_REMATCH[1]}
    if [ "$num" -ne "$((PREV_NUM + 1))" ] && [ "$PREV_NUM" -ne 0 ]; then
      echo "❌ Rupture de séquence détectée: $PREV_NUM → $num ($filename)"
      SEQUENCE_ISSUES=$((SEQUENCE_ISSUES+1))
    fi
    PREV_NUM=$num
  fi
done

if [ $SEQUENCE_ISSUES -gt 0 ]; then
  echo "⚠️ $SEQUENCE_ISSUES problèmes de séquence détectés."
else
  echo "✅ La séquence des numéros de section est correcte."
fi

# Vérification de la duplication de contenu (nouvelle fonctionnalité)
echo "🔎 Recherche de contenu dupliqué..."
DUPLICATE_CONTENT=0

for file1 in "$CDC_DIR"/*.md; do
  filename1=$(basename "$file1")
  for file2 in "$CDC_DIR"/*.md; do
    filename2=$(basename "$file2")
    if [ "$filename1" != "$filename2" ]; then
      # Extraction du contenu sans les entêtes pour comparaison
      content1=$(sed -n '4,$p' "$file1" | tr -d '[:space:]')
      content2=$(sed -n '4,$p' "$file2" | tr -d '[:space:]')
      
      # Calculer similarité approximative
      similarity=$(echo -n "$content1" | grep -o "$(echo -n "$content2" | fold -w 100 | head -n 5)" | wc -c)
      similarity_percentage=$((similarity * 100 / $(echo -n "$content2" | wc -c)))
      
      if [ "$similarity_percentage" -gt 60 ]; then
        echo "⚠️ Contenu potentiellement dupliqué: $filename1 et $filename2 ($similarity_percentage% similaires)"
        DUPLICATE_CONTENT=$((DUPLICATE_CONTENT+1))
      fi
    fi
  done
done

if [ $DUPLICATE_CONTENT -gt 0 ]; then
  echo "⚠️ $DUPLICATE_CONTENT cas de contenu potentiellement dupliqué détectés."
else
  echo "✅ Aucun contenu dupliqué détecté."
fi

# Vérification des liens d'image et ressources externes (nouvelle fonctionnalité)
echo "🖼️ Vérification des liens d'images et ressources..."
MISSING_RESOURCES=0

for md_file in "$CDC_DIR"/*.md; do
  # Recherche des liens d'images ![alt](chemin)
  image_links=$(grep -o '!\[.*\](.*)\|<img.*src=".*"' "$md_file")
  
  for link in $image_links; do
    # Extraire le chemin entre parenthèses
    if [[ $link =~ \((.*)\) ]]; then
      path=${BASH_REMATCH[1]}
    elif [[ $link =~ src=\"(.*)\" ]]; then
      path=${BASH_REMATCH[1]}
    else
      continue
    fi
    
    # Ignorer les URLs externes
    if [[ $path == http://* || $path == https://* ]]; then
      continue
    fi
    
    # Vérifier si le fichier existe
    if [ ! -f "$path" ] && [ ! -f "$CDC_DIR/$path" ]; then
      echo "❌ Ressource manquante dans $(basename "$md_file"): $path"
      MISSING_RESOURCES=$((MISSING_RESOURCES+1))
    fi
  done
done

if [ $MISSING_RESOURCES -gt 0 ]; then
  echo "⚠️ $MISSING_RESOURCES ressources manquantes détectées."
else
  echo "✅ Toutes les ressources référencées sont accessibles."
fi

# Vérification de la consistance des formats (nouvelle fonctionnalité)
echo "📝 Vérification de la consistance des formats Markdown..."
FORMAT_ISSUES=0

for md_file in "$CDC_DIR"/*.md; do
  # Vérifier si le fichier commence par un H1
  if ! head -1 "$md_file" | grep -q "^# "; then
    echo "❌ Format incorrect: $(basename "$md_file") ne commence pas par un titre H1"
    FORMAT_ISSUES=$((FORMAT_ISSUES+1))
  fi
  
  # Vérifier si des espaces sont utilisés au lieu de tabulations
  if grep -q "	" "$md_file"; then
    echo "⚠️ $(basename "$md_file") utilise des tabulations au lieu d'espaces"
    FORMAT_ISSUES=$((FORMAT_ISSUES+1))
  fi
  
  # Vérifier le format des tableaux
  if grep -q "^|.*|$" "$md_file" && ! grep -q "^|-" "$md_file"; then
    echo "❌ Format incorrect: $(basename "$md_file") contient des tableaux mal formatés"
    FORMAT_ISSUES=$((FORMAT_ISSUES+1))
  fi
done

if [ $FORMAT_ISSUES -gt 0 ]; then
  echo "⚠️ $FORMAT_ISSUES problèmes de format détectés."
else
  echo "✅ Le format Markdown est cohérent dans tous les fichiers."
fi

# Nouvelle section pour la lecture continue et l'analyse de contenu
echo "📖 Analyse de lecture continue du contenu..."
echo "  💭 Détection des sections nouvelles, incomplètes ou floues..."

# Créer un fichier temporaire pour les suggestions
SUGGESTIONS_FILE="$CDC_DIR/.content_suggestions.md"
echo "# Suggestions d'amélioration du contenu - $(date '+%Y-%m-%d')" > "$SUGGESTIONS_FILE"
echo "" >> "$SUGGESTIONS_FILE"

# Parcourir tous les fichiers Markdown
for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Ignorer certains fichiers
  if [[ "$filename" == "00-sommaire.md" || "$filename" == "changelog.md" || "$filename" == ".content_suggestions.md" ]]; then
    continue
  fi
  
  echo "  🔍 Analyse de $filename..."
  
  # Vérification de complétude
  content_length=$(wc -w < "$md_file")
  section_count=$(grep -c "^## " "$md_file")
  
  echo "## Suggestions pour $filename" >> "$SUGGESTIONS_FILE"
  
  # Sections trop courtes
  if [ "$content_length" -lt 200 ]; then
    echo "⚠️ $filename semble incomplet (moins de 200 mots)"
    echo "- ⚠️ **Contenu potentiellement incomplet**: Ce document contient seulement $content_length mots et pourrait bénéficier d'un contenu plus détaillé." >> "$SUGGESTIONS_FILE"
  fi
  
  # Manque de structure
  if [ "$section_count" -lt 2 ]; then
    echo "⚠️ $filename manque de structure (moins de 2 sous-sections)"
    echo "- ⚠️ **Structure insuffisante**: Ce document ne contient que $section_count sous-section(s). Envisagez d'ajouter une structure plus détaillée." >> "$SUGGESTIONS_FILE"
  fi
  
  # Vérifier la présence d'exemples de code
  if ! grep -q '```' "$md_file"; then
    echo "⚠️ $filename ne contient pas d'exemples de code"
    echo "- 💡 **Exemples manquants**: Envisagez d'ajouter des exemples de code ou des illustrations techniques." >> "$SUGGESTIONS_FILE"
  fi
  
  # Vérifier le vocabulaire flou ou imprécis
  fuzzy_terms=$(grep -o -i '\bpeut-être\b\|\bpossible\b\|\benvisager\b\|\bpourrait\b\|\bdevrait\b' "$md_file" | wc -l)
  if [ "$fuzzy_terms" -gt 5 ]; then
    echo "⚠️ $filename contient un vocabulaire potentiellement flou ($fuzzy_terms occurrences)"
    echo "- ⚠️ **Vocabulaire imprécis**: Ce document contient plusieurs termes imprécis ou conditionnels. Envisagez d'utiliser un langage plus affirmatif." >> "$SUGGESTIONS_FILE"
  fi
  
  # Vérifier la relation avec d'autres sections
  if ! grep -q "\[.*\](\.\/[0-9][0-9]-.*\.md)" "$md_file"; then
    echo "ℹ️ $filename ne fait pas référence à d'autres sections du cahier"
    echo "- 💡 **Références croisées**: Envisagez d'ajouter des liens vers d'autres sections pertinentes du cahier des charges." >> "$SUGGESTIONS_FILE"
  fi
  
  # Vérifier la présence de métriques ou critères mesurables
  if ! grep -q -E "tableau|mesure|métrique|critère|pourcentage|score" "$md_file"; then
    echo "ℹ️ $filename pourrait bénéficier de critères mesurables"
    echo "- 💡 **Métriques manquantes**: Envisagez d'ajouter des critères mesurables ou des indicateurs de performance." >> "$SUGGESTIONS_FILE"
  fi
  
  echo "" >> "$SUGGESTIONS_FILE"
done

# Génération du rapport final d'analyse de contenu
echo "📝 Création du rapport d'analyse du contenu..."
echo "Suggestions disponibles dans: $SUGGESTIONS_FILE"

# Rapport final
echo ""
echo "📊 Rapport de vérification d'intégrité:"
if [ $MISSING_FILES -eq 0 ] && [ $BROKEN_REFS -eq 0 ] && [ $MISSING_IN_TOC -eq 0 ] && [ $TITLE_ISSUES -eq 0 ] && [ $SEQUENCE_ISSUES -eq 0 ] && [ $DUPLICATE_CONTENT -eq 0 ] && [ $MISSING_RESOURCES -eq 0 ] && [ $FORMAT_ISSUES -eq 0 ]; then
  echo "✅ Le cahier des charges est cohérent et complet."
else
  echo "⚠️ Des problèmes ont été détectés. Veuillez les corriger pour assurer la cohérence du cahier des charges."
fi
