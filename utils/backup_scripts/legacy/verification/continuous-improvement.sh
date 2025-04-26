#!/bin/bash

# Script pour l'analyse continue et les propositions d'amélioration
# du cahier des charges

echo "📚 Analyse continue et suggestions pour le cahier des charges..."

CDC_DIR="cahier-des-charges"
SUGGESTIONS_DIR="$CDC_DIR/suggestions"
LAST_ANALYSIS_FILE="$SUGGESTIONS_DIR/.last_analysis"

# Créer le répertoire de suggestions s'il n'existe pas
mkdir -p "$SUGGESTIONS_DIR"

# Vérifier si une analyse a déjà été effectuée récemment
if [ -f "$LAST_ANALYSIS_FILE" ]; then
  last_time=$(cat "$LAST_ANALYSIS_FILE")
  current_time=$(date +%s)
  time_diff=$((current_time - last_time))
  
  # Si la dernière analyse date de moins d'une heure, demander confirmation
  if [ "$time_diff" -lt 3600 ]; then
    read -p "La dernière analyse date de moins d'une heure. Continuer quand même? (o/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[oO]$ ]]; then
      echo "❌ Analyse annulée."
      exit 1
    fi
  fi
fi

# Enregistrer le timestamp de l'analyse actuelle
date +%s > "$LAST_ANALYSIS_FILE"

# Exécuter l'analyse d'intégrité qui va générer les suggestions
echo "🔍 Analyse de l'intégrité et du contenu..."
./verify-integrity.sh

# Traiter les suggestions générées
SUGGESTIONS_FILE="$CDC_DIR/.content_suggestions.md"
if [ -f "$SUGGESTIONS_FILE" ]; then
  # Créer un fichier de suggestions horodaté
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  DATED_SUGGESTIONS="$SUGGESTIONS_DIR/suggestions_$TIMESTAMP.md"
  
  # Copier les suggestions
  cp "$SUGGESTIONS_FILE" "$DATED_SUGGESTIONS"
  
  # Afficher un résumé
  SUGGESTIONS_COUNT=$(grep -c "^- " "$SUGGESTIONS_FILE")
  FILES_WITH_SUGGESTIONS=$(grep -c "^## Suggestions pour" "$SUGGESTIONS_FILE")
  
  echo "📊 Résumé des suggestions:"
  echo "- Fichiers analysés: $(find "$CDC_DIR" -name '*.md' ! -path "*suggestions*" ! -name "00-sommaire.md" ! -name "changelog.md" | wc -l)"
  echo "- Fichiers avec suggestions: $FILES_WITH_SUGGESTIONS"
  echo "- Suggestions totales: $SUGGESTIONS_COUNT"
  
  # Organiser les suggestions par catégorie
  echo "🔄 Organisation des suggestions par catégorie..."
  
  echo "# Suggestions d'amélioration par catégorie - $(date '+%Y-%m-%d')" > "$SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "## Suggestions structurelles" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  grep -A 1 "Structure insuffisante" "$SUGGESTIONS_FILE" | grep "^-" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "## Contenu incomplet" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  grep -A 1 "Contenu potentiellement incomplet" "$SUGGESTIONS_FILE" | grep "^-" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "## Éléments techniques manquants" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  grep -A 1 "Exemples manquants\|Métriques manquantes" "$SUGGESTIONS_FILE" | grep "^-" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "## Clarification du langage" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  grep -A 1 "Vocabulaire imprécis" "$SUGGESTIONS_FILE" | grep "^-" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "## Suggestions de références croisées" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  grep -A 1 "Références croisées" "$SUGGESTIONS_FILE" | grep "^-" >> "$SUGGESTIONS_DIR/suggestions_by_category.md"
  
  echo "✅ Suggestions organisées par catégorie: $SUGGESTIONS_DIR/suggestions_by_category.md"
  
  # Proposer des actions
  echo ""
  echo "🚀 Actions recommandées:"
  echo "1. Consultez le rapport détaillé: $DATED_SUGGESTIONS"
  echo "2. Examinez les suggestions par catégorie: $SUGGESTIONS_DIR/suggestions_by_category.md"
  echo "3. Mettez à jour les sections concernées selon les recommandations"
  echo "4. Exécutez ./update-cahier.sh après vos modifications"
else
  echo "❌ Aucun fichier de suggestions trouvé. Vérifiez si l'analyse a été correctement exécutée."
fi

# Nouvelle section : Suggestions intelligentes
echo "🧠 Génération de suggestions intelligentes..."

INTELLIGENT_SUGGESTIONS="$SUGGESTIONS_DIR/intelligent_suggestions.md"
echo "# Suggestions intelligentes - $(date '+%Y-%m-%d')" > "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

# Analyser les sous-sections manquantes par rapport à des templates
echo "## Sous-sections potentiellement manquantes" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

# Définir des templates de sous-sections par type de document
declare -A section_templates
section_templates["module"]="## Objectif du module\n## Architecture\n## Flux de données\n## APIs et interfaces\n## Dépendances\n## Tests\n## Métriques"
section_templates["migration"]="## État actuel\n## État cible\n## Stratégie de migration\n## Risques et mitigations\n## Plan d'action\n## Tests de validation\n## Rollback"
section_templates["agent"]="## Objectif de l'agent\n## Entrées/Sorties\n## Algorithme\n## Intégration\n## Limitations\n## Performances\n## Évolution"

# Parcourir les fichiers et suggérer des sous-sections manquantes
for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Ignorer certains fichiers
  if [[ "$filename" == "00-sommaire.md" || "$filename" == "changelog.md" || "$filename" =~ ^\..*$ ]]; then
    continue
  fi
  
  # Déterminer le type du document
  doc_type=""
  if grep -q -i "module" "$md_file"; then
    doc_type="module"
  elif grep -q -i "migration" "$md_file"; then
    doc_type="migration"
  elif grep -q -i "agent" "$md_file"; then
    doc_type="agent"
  fi
  
  if [ -n "$doc_type" ]; then
    echo "### $filename (type: $doc_type)" >> "$INTELLIGENT_SUGGESTIONS"
    
    # Extraire les sous-sections existantes
    existing_sections=$(grep "^## " "$md_file" | sed 's/^## //')
    
    # Convertir le template en tableau
    IFS=$'\n' read -d '' -ra template_sections <<< "$(echo -e "${section_templates[$doc_type]}" | grep "^## " | sed 's/^## //')"
    
    # Comparer et suggérer les sections manquantes
    missing_sections=()
    for template_section in "${template_sections[@]}"; do
      if ! echo "$existing_sections" | grep -q "$template_section"; then
        missing_sections+=("$template_section")
      fi
    done
    
    if [ ${#missing_sections[@]} -gt 0 ]; then
      echo "Sous-sections suggérées:" >> "$INTELLIGENT_SUGGESTIONS"
      for section in "${missing_sections[@]}"; do
        echo "- \`\`\`markdown" >> "$INTELLIGENT_SUGGESTIONS"
        echo "## $section" >> "$INTELLIGENT_SUGGESTIONS"
        echo "" >> "$INTELLIGENT_SUGGESTIONS"
        echo "<!-- Contenu suggéré pour cette section -->" >> "$INTELLIGENT_SUGGESTIONS"
        echo "\`\`\`" >> "$INTELLIGENT_SUGGESTIONS"
      done
    else
      echo "✅ Toutes les sous-sections recommandées sont présentes." >> "$INTELLIGENT_SUGGESTIONS"
    fi
    
    echo "" >> "$INTELLIGENT_SUGGESTIONS"
  fi
done

# Vérification des liens avec les fichiers externes (.audit.md, .backlog.json, etc.)
echo "## Liens avec les fichiers externes" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

# Liste des fichiers externes à vérifier
external_files=(
  "docs/audit/*.audit.md"
  "config/*.backlog.json"
  "workflows/*.json"
)

for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Ignorer certains fichiers
  if [[ "$filename" == "00-sommaire.md" || "$filename" == "changelog.md" || "$filename" =~ ^\..*$ ]]; then
    continue
  fi
  
  # Extraire le nom principal (sans l'extension et le numéro)
  base_name=$(echo "$filename" | sed -E 's/^[0-9]+-//;s/\.md$//')
  
  echo "### $filename" >> "$INTELLIGENT_SUGGESTIONS"
  missing_links=0
  
  # Vérifier les liens potentiels vers des fichiers externes
  for pattern in "${external_files[@]}"; do
    matching_files=$(find "$(dirname "$CDC_DIR")" -path "$(dirname "$CDC_DIR")/$pattern" 2>/dev/null | grep -i "$base_name" || echo "")
    
    if [ -n "$matching_files" ]; then
      echo "Fichiers associés détectés:" >> "$INTELLIGENT_SUGGESTIONS"
      echo "$matching_files" | while read -r related_file; do
        rel_path=$(realpath --relative-to="$(dirname "$md_file")" "$related_file")
        
        # Vérifier si le lien existe déjà dans le document
        if ! grep -q "$rel_path" "$md_file"; then
          echo "- Lien suggéré vers \`$rel_path\`" >> "$INTELLIGENT_SUGGESTIONS"
          echo "  \`\`\`markdown" >> "$INTELLIGENT_SUGGESTIONS"
          echo "Pour plus de détails, consultez [le fichier d'audit](../$rel_path)." >> "$INTELLIGENT_SUGGESTIONS"
          echo "  \`\`\`" >> "$INTELLIGENT_SUGGESTIONS"
          missing_links=$((missing_links + 1))
        fi
      done
    fi
  done
  
  if [ $missing_links -eq 0 ]; then
    echo "✅ Aucun fichier externe pertinent manquant." >> "$INTELLIGENT_SUGGESTIONS"
  fi
  
  echo "" >> "$INTELLIGENT_SUGGESTIONS"
done

# Mise à jour des plans d'action et roadmap
echo "## Suggestions de mise à jour pour les plans d'action" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

# Fichiers concernant les plans d'action ou roadmaps
roadmap_files=$(grep -l -E "roadmap|plan d'action|feuille de route" "$CDC_DIR"/*.md || echo "")

if [ -n "$roadmap_files" ]; then
  echo "$roadmap_files" | while read -r roadmap_file; do
    filename=$(basename "$roadmap_file")
    echo "### $filename" >> "$INTELLIGENT_SUGGESTIONS"
    
    # Vérifier la date de modification
    last_modified=$(stat -c %Y "$roadmap_file")
    current_time=$(date +%s)
    days_since_update=$(( (current_time - last_modified) / 86400 ))
    
    if [ $days_since_update -gt 14 ]; then
      echo "⚠️ Ce plan d'action n'a pas été mis à jour depuis $days_since_update jours." >> "$INTELLIGENT_SUGGESTIONS"
      echo "" >> "$INTELLIGENT_SUGGESTIONS"
      echo "Suggestions de mises à jour:" >> "$INTELLIGENT_SUGGESTIONS"
      echo "- Vérifier si les dates prévues sont toujours d'actualité" >> "$INTELLIGENT_SUGGESTIONS"
      echo "- Mettre à jour le statut des tâches en cours" >> "$INTELLIGENT_SUGGESTIONS"
      echo "- Ajouter les nouvelles étapes ou jalons identifiés depuis" >> "$INTELLIGENT_SUGGESTIONS"
      
      # Vérifier si des éléments marqués comme "en cours" sont potentiellement terminés
      in_progress=$(grep -E "\- \[ \]|\- \[x\]" "$roadmap_file" | grep -i "en cours" || echo "")
      if [ -n "$in_progress" ]; then
        echo "" >> "$INTELLIGENT_SUGGESTIONS"
        echo "Éléments à vérifier (potentiellement terminés):" >> "$INTELLIGENT_SUGGESTIONS"
        echo "$in_progress" | sed 's/^/- /' >> "$INTELLIGENT_SUGGESTIONS"
      fi
    else
      echo "✅ Plan d'action mis à jour récemment (il y a $days_since_update jours)." >> "$INTELLIGENT_SUGGESTIONS"
    fi
    
    echo "" >> "$INTELLIGENT_SUGGESTIONS"
  done
else
  echo "Aucun fichier de plan d'action ou roadmap n'a été identifié." >> "$INTELLIGENT_SUGGESTIONS"
  echo "" >> "$INTELLIGENT_SUGGESTIONS"
fi

# Détecter les dépendances techniques manquantes
echo "## Analyse des dépendances techniques" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

# Parcourir les fichiers pour identifier les technologies mentionnées et les dépendances
all_technologies=$(grep -h -o -E "(NestJS|Remix|PostgreSQL|Redis|Prisma|Docker|n8n|TypeScript)" "$CDC_DIR"/*.md | sort | uniq)
technology_mentions=()

for tech in $all_technologies; do
  mentions=$(grep -l "$tech" "$CDC_DIR"/*.md | wc -l)
  technology_mentions+=("$tech:$mentions")
done

echo "### Technologies détectées dans le cahier des charges" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"
echo "| Technologie | Mentions | Fichier de configuration | Documentation dédiée |" >> "$INTELLIGENT_SUGGESTIONS"
echo "|-------------|----------|--------------------------|----------------------|" >> "$INTELLIGENT_SUGGESTIONS"

for item in "${technology_mentions[@]}"; do
  tech=$(echo "$item" | cut -d':' -f1)
  mentions=$(echo "$item" | cut -d':' -f2)
  
  # Vérifier si une documentation dédiée existe
  doc_file=$(find "$CDC_DIR" -name "*$tech*.md" -o -name "*$(echo "$tech" | tr '[:upper:]' '[:lower:]')*.md" | head -1)
  doc_status="❌ Manquant"
  if [ -n "$doc_file" ]; then
    doc_status="✅ [$(basename "$doc_file")](./$(basename "$doc_file"))"
  fi
  
  # Vérifier si un fichier de configuration existe
  config_file=$(find "$(dirname "$CDC_DIR")"/config -name "*$tech*.json" -o -name "*$(echo "$tech" | tr '[:upper:]' '[:lower:]')*.json" 2>/dev/null | head -1)
  config_status="❌ Manquant"
  if [ -n "$config_file" ]; then
    config_status="✅ $(basename "$config_file")"
  fi
  
  echo "| $tech | $mentions | $config_status | $doc_status |" >> "$INTELLIGENT_SUGGESTIONS"
done

echo "" >> "$INTELLIGENT_SUGGESTIONS"
echo "### Suggestions de documentation technique" >> "$INTELLIGENT_SUGGESTIONS"
echo "" >> "$INTELLIGENT_SUGGESTIONS"

for item in "${technology_mentions[@]}"; do
  tech=$(echo "$item" | cut -d':' -f1)
  
  # Vérifier si une documentation dédiée existe
  doc_file=$(find "$CDC_DIR" -name "*$tech*.md" -o -name "*$(echo "$tech" | tr '[:upper:]' '[:lower:]')*.md" | head -1)
  
  if [ -z "$doc_file" ] && [ "$(echo "$item" | cut -d':' -f2)" -gt 3 ]; then
    echo "- Il est recommandé de créer une documentation dédiée pour **$tech** (mentionné dans plusieurs sections)" >> "$INTELLIGENT_SUGGESTIONS"
    echo "  ```" >> "$INTELLIGENT_SUGGESTIONS"
    echo "  Proposition de nom de fichier: XX-configuration-$(echo "$tech" | tr '[:upper:]' '[:lower:]').md" >> "$INTELLIGENT_SUGGESTIONS"
    echo "  ```" >> "$INTELLIGENT_SUGGESTIONS"
  fi
done

echo ""
echo "✅ Suggestions intelligentes générées: $INTELLIGENT_SUGGESTIONS"
echo ""
echo "🚀 Actions recommandées:"
echo "1. Consultez les suggestions intelligentes: $INTELLIGENT_SUGGESTIONS"
echo "2. Appliquez les mises à jour pertinentes au cahier des charges"
echo "3. Exécutez ./update-cahier.sh après vos modifications"

echo "✨ Processus d'analyse continue terminé."
