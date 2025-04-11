#!/bin/bash

echo "🛡️ Vérification approfondie de la fiabilité du cahier des charges..."

CDC_DIR="cahier-des-charges"
REPORTS_DIR="$CDC_DIR/reliability-reports"
CONFIG_DIR="config"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Création des répertoires nécessaires
mkdir -p "$REPORTS_DIR" "$CONFIG_DIR"

# Fichier de configuration par défaut si non existant
if [ ! -f "$CONFIG_DIR/reliability-checks.json" ]; then
  cat > "$CONFIG_DIR/reliability-checks.json" << EOL
{
  "min_section_words": 200,
  "min_subsections": 2,
  "required_sections": ["introduction", "exigences", "specifications", "architecture", "plan-migration", "suivi"],
  "interdependency_check": true,
  "decision_traceability": true,
  "technical_foundation_check": true,
  "critical_modules": ["authentification", "paiement", "données-utilisateur"]
}
EOL
  echo "✅ Configuration par défaut créée: $CONFIG_DIR/reliability-checks.json"
fi

# Rapport de vérification
REPORT_FILE="$REPORTS_DIR/reliability-report-$TIMESTAMP.md"

echo "# Rapport de fiabilité du cahier des charges" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Date: $(date +'%Y-%m-%d %H:%M')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Vérification approfondie des sections
echo "## 1. Vérification approfondie des sections" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Obtention des paramètres de configuration
MIN_WORDS=$(grep -o '"min_section_words": [0-9]*' "$CONFIG_DIR/reliability-checks.json" | cut -d ':' -f2 | tr -d ' ,')
MIN_SUBSECTIONS=$(grep -o '"min_subsections": [0-9]*' "$CONFIG_DIR/reliability-checks.json" | cut -d ':' -f2 | tr -d ' ,')

echo "Critères de vérification:" >> "$REPORT_FILE"
echo "- Minimum $MIN_WORDS mots par section" >> "$REPORT_FILE"
echo "- Minimum $MIN_SUBSECTIONS sous-sections" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Tableau des résultats
echo "| Section | Mots | Sous-sections | Statut |" >> "$REPORT_FILE"
echo "|---------|------|---------------|--------|" >> "$REPORT_FILE"

insufficient_sections=0

for md_file in "$CDC_DIR"/*.md; do
  # Ignorer certains fichiers spéciaux
  if [[ "$(basename "$md_file")" == "00-sommaire.md" || "$(basename "$md_file")" == "changelog.md" ]]; then
    continue
  fi
  
  filename=$(basename "$md_file")
  word_count=$(wc -w < "$md_file")
  subsection_count=$(grep -c "^## " "$md_file")
  
  if [ "$word_count" -lt "$MIN_WORDS" ] || [ "$subsection_count" -lt "$MIN_SUBSECTIONS" ]; then
    status="⚠️ Insuffisant"
    insufficient_sections=$((insufficient_sections + 1))
  else
    status="✅ Complet"
  fi
  
  echo "| $filename | $word_count | $subsection_count | $status |" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "Résultat: $insufficient_sections section(s) nécessitent une amélioration." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2. Vérification des interdépendances
echo "## 2. Vérification des interdépendances" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "Analyse des références croisées entre sections:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Matrice des interdépendances
echo "| Section source | Références vers | Références depuis |" >> "$REPORT_FILE"
echo "|---------------|----------------|-------------------|" >> "$REPORT_FILE"

for source_file in "$CDC_DIR"/*.md; do
  # Ignorer fichiers spéciaux
  if [[ "$(basename "$source_file")" == "00-sommaire.md" || "$(basename "$source_file")" == "changelog.md" ]]; then
    continue
  fi
  
  source_name=$(basename "$source_file")
  
  # Références sortantes
  outgoing_refs=$(grep -o "\[.*\](\.\/[^)]*)" "$source_file" | grep -o "\.\/[^)]*" | sort | uniq | wc -l)
  
  # Références entrantes
  incoming_refs=0
  for ref_file in "$CDC_DIR"/*.md; do
    if [ "$ref_file" != "$source_file" ]; then
      if grep -q "$source_name" "$ref_file"; then
        incoming_refs=$((incoming_refs + 1))
      fi
    fi
  done
  
  echo "| $source_name | $outgoing_refs | $incoming_refs |" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "Analyse des modules isolés (sans références):" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for source_file in "$CDC_DIR"/*.md; do
  # Ignorer fichiers spéciaux
  if [[ "$(basename "$source_file")" == "00-sommaire.md" || "$(basename "$source_file")" == "changelog.md" ]]; then
    continue
  fi
  
  source_name=$(basename "$source_file")
  
  # Vérifier si le fichier n'a ni références sortantes ni entrantes
  outgoing_refs=$(grep -o "\[.*\](\.\/[^)]*)" "$source_file" | grep -o "\.\/[^)]*" | sort | uniq | wc -l)
  
  incoming_refs=0
  for ref_file in "$CDC_DIR"/*.md; do
    if [ "$ref_file" != "$source_file" ]; then
      if grep -q "$source_name" "$ref_file"; then
        incoming_refs=$((incoming_refs + 1))
      fi
    fi
  done
  
  if [ "$outgoing_refs" -eq 0 ] && [ "$incoming_refs" -eq 0 ]; then
    echo "- ⚠️ **Module isolé**: $source_name n'a aucune référence entrante ou sortante" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"

# 3. Vérification de la cohérence d'ensemble
echo "## 3. Cohérence d'ensemble" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Vérifier la terminologie cohérente
echo "### Analyse de cohérence terminologique" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Liste des termes techniques importants à vérifier
tech_terms=("NestJS" "Remix" "PostgreSQL" "Prisma" "monorepo" "migration" "API" "TypeScript")

for term in "${tech_terms[@]}"; do
  occurrences=0
  variants=0
  
  # Recherche du terme exact
  occurrences=$(grep -r -o -i "$term" "$CDC_DIR" | wc -l)
  
  # Recherche des variantes (exemple: nest-js, nest js)
  variant1=$(echo "$term" | sed 's/\([A-Z]\)/-\1/g' | tr '[:upper:]' '[:lower:]')
  variant2=$(echo "$term" | sed 's/\([A-Z]\)/ \1/g' | tr '[:upper:]' '[:lower:]')
  
  variant1_count=$(grep -r -o -i "$variant1" "$CDC_DIR" | wc -l)
  variant2_count=$(grep -r -o -i "$variant2" "$CDC_DIR" | wc -l)
  
  variants=$((variant1_count + variant2_count))
  
  if [ "$variants" -gt 0 ]; then
    echo "- ⚠️ **Incohérence terminologique**: '$term' apparaît sous $variants formes différentes" >> "$REPORT_FILE"
  fi
done

echo "" >> "$REPORT_FILE"

# 4. Fondations techniques auditables
echo "## 4. Fondations techniques auditables" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Décisions techniques documentées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Chercher les décisions techniques documentées (ADR)
decision_markers=("décision:" "decision:" "choix technique:" "ADR:")
decision_count=0

for md_file in "$CDC_DIR"/*.md; do
  for marker in "${decision_markers[@]}"; do
    file_decisions=$(grep -c -i "$marker" "$md_file")
    decision_count=$((decision_count + file_decisions))
  done
done

echo "Nombre total de décisions techniques documentées: $decision_count" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$decision_count" -lt 5 ]; then
  echo "⚠️ **Risque de fondations insuffisantes**: Le nombre de décisions techniques documentées est faible" >> "$REPORT_FILE"
  echo "Recommandation: Documenter explicitement les choix architecturaux et technologiques majeurs avec leur justification" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Vérification des sections critiques
echo "### Couverture des modules critiques" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Extraction des modules critiques de la configuration
CRITICAL_MODULES=$(grep -o '"critical_modules":\s*\[\s*"[^"]*"' "$CONFIG_DIR/reliability-checks.json" | sed 's/"critical_modules":\s*\[\s*"//g' | tr '", ' '\n' | grep -v '^$')

echo "Modules identifiés comme critiques:" >> "$REPORT_FILE"
for module in $CRITICAL_MODULES; do
  echo "- $module" >> "$REPORT_FILE"
  
  # Vérifier si le module est documenté en profondeur
  module_docs=$(grep -r -l -i "$module" "$CDC_DIR")
  
  if [ -z "$module_docs" ]; then
    echo "  - ⚠️ **Documentation insuffisante**: Module critique non documenté" >> "$REPORT_FILE"
  else
    detail_level=0
    for doc in $module_docs; do
      # Compter les occurrences du terme et des sections qui le contiennent
      term_count=$(grep -c -i "$module" "$doc")
      section_count=$(grep -A1 -i "##.*$module" "$doc" | wc -l)
      detail_level=$((detail_level + term_count + section_count))
    done
    
    if [ "$detail_level" -lt 10 ]; then
      echo "  - ⚠️ **Profondeur insuffisante**: Module critique peu détaillé" >> "$REPORT_FILE"
    else
      echo "  - ✅ Documentation satisfaisante" >> "$REPORT_FILE"
    fi
  fi
done

echo "" >> "$REPORT_FILE"

# Résumé et recommandations
echo "## Résumé et recommandations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Évaluation globale de fiabilité" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Calcul du score de fiabilité (exemple simplifié)
reliability_score=100

if [ "$insufficient_sections" -gt 0 ]; then
  penalty=$((insufficient_sections * 5))
  reliability_score=$((reliability_score - penalty))
  echo "- Pénalité pour sections insuffisantes: -$penalty points" >> "$REPORT_FILE"
fi

isolated_modules=$(grep -c "Module isolé" "$REPORT_FILE")
if [ "$isolated_modules" -gt 0 ]; then
  penalty=$((isolated_modules * 3))
  reliability_score=$((reliability_score - penalty))
  echo "- Pénalité pour modules isolés: -$penalty points" >> "$REPORT_FILE"
fi

term_inconsistencies=$(grep -c "Incohérence terminologique" "$REPORT_FILE")
if [ "$term_inconsistencies" -gt 0 ]; then
  penalty=$((term_inconsistencies * 2))
  reliability_score=$((reliability_score - penalty))
  echo "- Pénalité pour incohérences terminologiques: -$penalty points" >> "$REPORT_FILE"
fi

if [ "$decision_count" -lt 5 ]; then
  penalty=$((5 - decision_count) * 4)
  reliability_score=$((reliability_score - penalty))
  echo "- Pénalité pour manque de décisions documentées: -$penalty points" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "**Score de fiabilité**: $reliability_score / 100" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Classification du niveau de fiabilité
if [ "$reliability_score" -ge 90 ]; then
  reliability_level="🟢 Excellent"
elif [ "$reliability_score" -ge 75 ]; then
  reliability_level="🟡 Satisfaisant"
elif [ "$reliability_score" -ge 60 ]; then
  reliability_level="🟠 Nécessite des améliorations"
else
  reliability_level="🔴 Risqué - Action requise"
fi

echo "**Niveau de fiabilité**: $reliability_level" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "### Actions recommandées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$insufficient_sections" -gt 0 ]; then
  echo "1. **Enrichir les sections insuffisantes** identifiées dans la première partie" >> "$REPORT_FILE"
fi

if [ "$isolated_modules" -gt 0 ]; then
  echo "2. **Établir des liens entre les modules isolés** et le reste de la documentation" >> "$REPORT_FILE"
fi

if [ "$term_inconsistencies" -gt 0 ]; then
  echo "3. **Standardiser la terminologie** à travers tout le cahier des charges" >> "$REPORT_FILE"
fi

if [ "$decision_count" -lt 5 ]; then
  echo "4. **Documenter explicitement les décisions techniques** avec leur justification" >> "$REPORT_FILE"
fi

# Mise à jour du changelog
CHANGELOG_FILE="$CDC_DIR/changelog.md"

echo -e "\n## $(date +'%Y-%m-%d') - Vérification de fiabilité" >> "$CHANGELOG_FILE"
echo "- Exécution d'une vérification approfondie de la fiabilité" >> "$CHANGELOG_FILE"
echo "- Score de fiabilité: $reliability_score/100 - Niveau: $reliability_level" >> "$CHANGELOG_FILE"
echo "- Rapport détaillé généré: reliability-report-$TIMESTAMP.md" >> "$CHANGELOG_FILE"

echo "✅ Vérification de fiabilité terminée"
echo "📊 Rapport généré: $REPORT_FILE"
echo "📝 Changelog mis à jour"

chmod +x "$0"
