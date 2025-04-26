#!/bin/bash

echo "📊 Suivi des modifications du cahier des charges..."

CDC_DIR="cahier-des-charges"
STATS_DIR="$CDC_DIR/stats"
mkdir -p "$STATS_DIR"

# Générer des statistiques sur l'état actuel
TIMESTAMP=$(date +"%Y%m%d")
STATS_FILE="$STATS_DIR/stats_$TIMESTAMP.json"

echo "{" > "$STATS_FILE"
echo "  \"date\": \"$(date +'%Y-%m-%d')\","  >> "$STATS_FILE"
echo "  \"sections\": {" >> "$STATS_FILE"

first=true
for md_file in "$CDC_DIR"/*.md; do
  if [[ "$(basename "$md_file")" == "00-sommaire.md" || "$(basename "$md_file")" == "changelog.md" ]]; then
    continue
  fi
  
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$STATS_FILE"
  fi
  
  filename=$(basename "$md_file" .md)
  word_count=$(wc -w < "$md_file")
  section_count=$(grep -c "^## " "$md_file")
  subsection_count=$(grep -c "^### " "$md_file")
  links_count=$(grep -c "\[.*\](\.\/.*\.md)" "$md_file")
  code_blocks=$(grep -c "^\`\`\`" "$md_file")
  
  echo "    \"$filename\": {" >> "$STATS_FILE"
  echo "      \"word_count\": $word_count," >> "$STATS_FILE"
  echo "      \"sections\": $section_count," >> "$STATS_FILE"
  echo "      \"subsections\": $subsection_count," >> "$STATS_FILE"
  echo "      \"links\": $links_count," >> "$STATS_FILE"
  echo "      \"code_blocks\": $((code_blocks / 2))," >> "$STATS_FILE"
  echo "      \"last_modified\": \"$(date -r "$md_file" +'%Y-%m-%d')\"" >> "$STATS_FILE"
  echo -n "    }" >> "$STATS_FILE"
done

echo "" >> "$STATS_FILE"
echo "  }," >> "$STATS_FILE"

# Statistiques globales
total_files=$(find "$CDC_DIR" -name "*.md" | wc -l)
total_words=$(find "$CDC_DIR" -name "*.md" -exec cat {} \; | wc -w)
echo "  \"summary\": {" >> "$STATS_FILE"
echo "    \"total_files\": $total_files," >> "$STATS_FILE"
echo "    \"total_words\": $total_words," >> "$STATS_FILE"
echo "    \"avg_words_per_file\": $((total_words / (total_files - 2)))" >> "$STATS_FILE"
echo "  }" >> "$STATS_FILE"
echo "}" >> "$STATS_FILE"

echo "✅ Statistiques générées: $STATS_FILE"

# Génération du rapport d'évolution si des statistiques précédentes existent
prev_stats=$(find "$STATS_DIR" -name "stats_*.json" | sort | tail -n 2 | head -n 1)
if [ -n "$prev_stats" ] && [ "$prev_stats" != "$STATS_FILE" ]; then
  echo "📈 Génération du rapport d'évolution..."
  EVOLUTION_FILE="$STATS_DIR/evolution_$TIMESTAMP.md"
  
  echo "# Rapport d'évolution du cahier des charges" > "$EVOLUTION_FILE"
  echo "" >> "$EVOLUTION_FILE"
  echo "Période: $(basename "$prev_stats" .json | sed 's/stats_//') → $TIMESTAMP" >> "$EVOLUTION_FILE"
  echo "" >> "$EVOLUTION_FILE"
  
  prev_total=$(grep -o '"total_words": [0-9]*' "$prev_stats" | cut -d' ' -f2)
  curr_total=$(grep -o '"total_words": [0-9]*' "$STATS_FILE" | cut -d' ' -f2)
  evolution=$((curr_total - prev_total))
  
  echo "## Évolution globale" >> "$EVOLUTION_FILE"
  echo "" >> "$EVOLUTION_FILE"
  echo "- Mots totaux: $prev_total → $curr_total ($evolution mots)" >> "$EVOLUTION_FILE"
  
  echo "✅ Rapport d'évolution généré: $EVOLUTION_FILE"
fi

echo "
📊 Suivi des modifications terminé.

Statistiques disponibles dans:
- $STATS_FILE

Pour visualiser l'évolution dans le temps:
- Consultez le dossier $STATS_DIR
"

chmod +x "$0"
