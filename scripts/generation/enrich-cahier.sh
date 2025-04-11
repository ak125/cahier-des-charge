#!/bin/bash

echo "🔍 Enrichissement intelligent du cahier des charges..."

CDC_DIR="cahier-des-charges"
BACKUP_DIR="$CDC_DIR/backups"
SUGGESTIONS_DIR="$CDC_DIR/suggestions"

# Création des répertoires nécessaires
mkdir -p "$BACKUP_DIR" "$SUGGESTIONS_DIR"

# Sauvegarde de la version actuelle
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
tar -czf "$BACKUP_DIR/cdc_backup_$TIMESTAMP.tar.gz" "$CDC_DIR"/*.md
echo "✅ Sauvegarde créée: $BACKUP_DIR/cdc_backup_$TIMESTAMP.tar.gz"

# Analyse des sections incomplètes
echo "🔍 Analyse des sections incomplètes..."
ANALYSIS_FILE="$SUGGESTIONS_DIR/analyse_$TIMESTAMP.md"

echo "# Analyse du cahier des charges - $(date '+%Y-%m-%d %H:%M')" > "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"

# Examen de chaque fichier
for md_file in "$CDC_DIR"/*.md; do
  filename=$(basename "$md_file")
  
  # Ignorer certains fichiers
  if [[ "$filename" == "00-sommaire.md" || "$filename" == "changelog.md" ]]; then
    continue
  fi
  
  echo "## Analyse de $filename" >> "$ANALYSIS_FILE"
  echo "" >> "$ANALYSIS_FILE"
  
  # Vérification des sections
  section_count=$(grep -c "^## " "$md_file")
  content_size=$(wc -w < "$md_file")
  
  if [ "$section_count" -lt 3 ]; then
    echo "- **⚠️ Peu de sous-sections**: Ce document ne contient que $section_count sous-sections" >> "$ANALYSIS_FILE"
    echo "  - Suggestion: Ajouter des sections sur l'implémentation, les tests, ou les métriques" >> "$ANALYSIS_FILE"
  fi
  
  if [ "$content_size" -lt 300 ]; then
    echo "- **⚠️ Contenu limité**: Ce document contient seulement $content_size mots" >> "$ANALYSIS_FILE"
    echo "  - Suggestion: Enrichir avec plus de détails techniques ou des exemples" >> "$ANALYSIS_FILE"
  fi
  
  # Vérifier les liens interdocuments
  refs_count=$(grep -c "\[.*\](\.\/.*\.md)" "$md_file")
  if [ "$refs_count" -eq 0 ]; then
    echo "- **⚠️ Absence de références**: Ce document ne fait pas référence à d'autres sections" >> "$ANALYSIS_FILE"
    echo "  - Suggestion: Ajouter des liens vers les sections connexes" >> "$ANALYSIS_FILE"
  fi
  
  echo "" >> "$ANALYSIS_FILE"
done

# Suggestion d'ajout de nouvelles sections
echo "## Suggestions de nouvelles sections" >> "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"

# Vérifier si certaines sections importantes manquent
section_topics=(
  "architecture-detaillee"
  "strategie-test"
  "securite"
  "performance"
  "deploiement"
)

section_names=(
  "Architecture Détaillée"
  "Stratégie de Test"
  "Sécurité et Conformité"
  "Performance et Optimisation"
  "Déploiement et CI/CD"
)

for i in "${!section_topics[@]}"; do
  if ! ls "$CDC_DIR"/*-"${section_topics[$i]}".md 1> /dev/null 2>&1; then
    echo "- **💡 Nouvelle section**: ${section_names[$i]}" >> "$ANALYSIS_FILE"
    echo "  - Cette section importante semble manquer au cahier des charges" >> "$ANALYSIS_FILE"
    echo "  - Commande pour créer: \`./create-section.sh \"${section_names[$i]}\"\`" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
  fi
done

echo "✅ Analyse terminée: $ANALYSIS_FILE"

# Mise à jour du changelog
echo "📝 Mise à jour du journal des modifications..."
CHANGELOG_FILE="$CDC_DIR/changelog.md"

echo -e "\n## $(date +'%Y-%m-%d') - Enrichissement automatique" >> "$CHANGELOG_FILE"
echo "- Analyse complète du cahier des charges" >> "$CHANGELOG_FILE"
echo "- Génération de suggestions d'amélioration" >> "$CHANGELOG_FILE"
echo "- Identification des sections manquantes" >> "$CHANGELOG_FILE"

# Mise à jour du sommaire
if [ -f "/workspaces/cahier-des-charge/update-cahier.sh" ]; then
  echo "🔄 Mise à jour du sommaire..."
  /workspaces/cahier-des-charge/update-cahier.sh
fi

echo "
🚀 Enrichissement terminé!

📊 Résumé des actions:
- Sauvegarde créée: $BACKUP_DIR/cdc_backup_$TIMESTAMP.tar.gz
- Analyse disponible: $ANALYSIS_FILE
- Changelog mis à jour

📋 Prochaines étapes recommandées:
1. Consultez l'analyse générée pour identifier les améliorations prioritaires
2. Utilisez ./create-section.sh pour ajouter les sections manquantes
3. Enrichissez les sections incomplètes selon les suggestions
4. Exécutez à nouveau cet outil périodiquement pour maintenir la qualité
"

chmod +x "$0"
