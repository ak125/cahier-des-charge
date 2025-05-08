#!/bin/bash
# Script pour vérifier exhaustivement que tous les agents ont été récupérés
# Ce script parcourt tout le projet à la recherche de fichiers .ts potentiellement liés à des agents
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
NEW_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
REPORT_FILE="${WORKSPACE_ROOT}/complete-migration-verification-$(date +%Y%m%d-%H%M%S).md"
POTENTIAL_AGENTS_DIR="${WORKSPACE_ROOT}/reports/potential-agents-$(date +%Y%m%d-%H%M%S)"

# Créer les répertoires nécessaires
mkdir -p "$POTENTIAL_AGENTS_DIR"

# Fonction pour identifier les fichiers TypeScript potentiellement liés à des agents
identify_potential_agents() {
  # Rechercher tous les fichiers .ts dans le projet
  find "${WORKSPACE_ROOT}" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | while read -r file; do
    # Vérifier si le fichier contient des indicateurs d'agent
    if grep -q "Agent\|agent\|analyzer\|validator\|generator\|orchestrator\|execute(" "$file"; then
      # Vérifier si le fichier a déjà été migré en le cherchant dans la structure à trois couches
      base_name=$(basename "$file")
      if ! find "${NEW_AGENTS_DIR}" -name "$base_name" | grep -q .; then
        # Si le fichier n'existe pas dans la nouvelle structure, c'est un agent potentiel non migré
        echo "$file"
      fi
    fi
  done
}

# Fonction pour évaluer si un fichier est réellement un agent
evaluate_agent_probability() {
  local file="$1"
  local score=0
  
  # Vérifier différents indicateurs pour déterminer s'il s'agit d'un agent
  if grep -q "class.*Agent" "$file"; then
    score=$((score + 5))
  fi
  
  if grep -q "extends.*Agent" "$file"; then
    score=$((score + 5))
  fi
  
  if grep -q "implements.*Agent" "$file"; then
    score=$((score + 5))
  fi
  
  if grep -q "execute\s*(" "$file"; then
    score=$((score + 3))
  fi
  
  if grep -q "analyze\|validate\|generate\|orchestrate" "$file"; then
    score=$((score + 2))
  fi
  
  if grep -q "BaseAgent\|BusinessAgent\|AnalyzerAgent\|ValidatorAgent\|GeneratorAgent" "$file"; then
    score=$((score + 4))
  fi
  
  # Vérifier le nom du fichier
  if [[ "$(basename "$file")" =~ [Aa]gent|[Aa]nalyzer|[Vv]alidator|[Gg]enerator|[Oo]rchestrator ]]; then
    score=$((score + 3))
  fi
  
  echo $score
}

# Créer l'entête du rapport
cat > "$REPORT_FILE" << EOF
# Rapport de vérification complète de la migration des agents

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Structure actuelle des agents

EOF

# Ajouter des statistiques sur la structure actuelle
echo "### Statistiques des agents migrés" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Total des agents dans la nouvelle structure** : $(find "${NEW_AGENTS_DIR}" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "- **Analyzers** : $(find "${NEW_AGENTS_DIR}/analyzers" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "- **Validators** : $(find "${NEW_AGENTS_DIR}/validators" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "- **Generators** : $(find "${NEW_AGENTS_DIR}/generators" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "- **Orchestrators** : $(find "${NEW_AGENTS_DIR}/orchestrators" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "- **Misc** : $(find "${NEW_AGENTS_DIR}/misc" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | wc -l)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Identifier les fichiers potentiels d'agents non migrés
echo "## Agents potentiels non migrés" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

potential_agents=$(identify_potential_agents)
total_potential=$(echo "$potential_agents" | grep -c .)

if [ $total_potential -eq 0 ]; then
  echo "**✅ Tous les agents semblent avoir été migrés avec succès!**" >> "$REPORT_FILE"
else
  echo "**⚠️ $total_potential fichiers potentiels d'agents n'ont peut-être pas été migrés:**" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "| Fichier | Probabilité d'être un agent | Contenu |" >> "$REPORT_FILE"
  echo "|---------|---------------------------|---------|" >> "$REPORT_FILE"
  
  while read -r file; do
    [ -z "$file" ] && continue
    
    # Évaluer la probabilité que ce soit un agent
    score=$(evaluate_agent_probability "$file")
    
    # Catégoriser la probabilité
    if [ $score -ge 10 ]; then
      probability="Très élevée"
    elif [ $score -ge 7 ]; then
      probability="Élevée"
    elif [ $score -ge 4 ]; then
      probability="Moyenne"
    else
      probability="Faible"
    fi
    
    # Copier le fichier pour référence
    rel_path=$(echo "$file" | sed "s|${WORKSPACE_ROOT}/||")
    copy_path="${POTENTIAL_AGENTS_DIR}/${rel_path}"
    mkdir -p "$(dirname "$copy_path")"
    cp "$file" "$copy_path"
    
    # Obtenir un extrait du contenu pour le rapport
    content_preview=$(grep -m 5 "class\|interface\|export" "$file" | sed 's/|/\\|/g' | tr '\n' ' ' | cut -c 1-100)
    echo "| \`$rel_path\` | $probability | \`$content_preview...\` |" >> "$REPORT_FILE"
  done <<< "$potential_agents"
  
  echo "" >> "$REPORT_FILE"
  echo "Pour plus de détails sur ces fichiers, consultez le répertoire: \`$POTENTIAL_AGENTS_DIR\`" >> "$REPORT_FILE"
fi

# Vérifier l'implémentation des interfaces
echo "" >> "$REPORT_FILE"
echo "## Vérification des interfaces" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Compter les agents implémentant les interfaces standard
all_agents=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts")
total_agents=$(echo "$all_agents" | wc -l)
base_agent_count=$(grep -l "BaseAgent" $all_agents | wc -l)
business_agent_count=$(grep -l "BusinessAgent" $all_agents | wc -l)
analyzer_agent_count=$(grep -l "AnalyzerAgent" $all_agents | wc -l)
validator_agent_count=$(grep -l "ValidatorAgent" $all_agents | wc -l)
generator_agent_count=$(grep -l "GeneratorAgent" $all_agents | wc -l)

echo "- Agents implémentant **BaseAgent** : $base_agent_count / $total_agents ($(( base_agent_count * 100 / total_agents ))%)" >> "$REPORT_FILE"
echo "- Agents implémentant **BusinessAgent** : $business_agent_count / $total_agents ($(( business_agent_count * 100 / total_agents ))%)" >> "$REPORT_FILE"
echo "- Agents implémentant **AnalyzerAgent** : $analyzer_agent_count / $total_agents ($(( analyzer_agent_count * 100 / total_agents ))%)" >> "$REPORT_FILE"
echo "- Agents implémentant **ValidatorAgent** : $validator_agent_count / $total_agents ($(( validator_agent_count * 100 / total_agents ))%)" >> "$REPORT_FILE"
echo "- Agents implémentant **GeneratorAgent** : $generator_agent_count / $total_agents ($(( generator_agent_count * 100 / total_agents ))%)" >> "$REPORT_FILE"

# Liste des agents qui n'implémentent aucune interface standard
non_interfaced_agents=$(find "$NEW_AGENTS_DIR" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "index.ts" | xargs grep -L "BaseAgent\|BusinessAgent\|AnalyzerAgent\|ValidatorAgent\|GeneratorAgent")
non_interfaced_count=$(echo "$non_interfaced_agents" | grep -c .)

echo "" >> "$REPORT_FILE"
if [ $non_interfaced_count -gt 0 ]; then
  echo "**⚠️ $non_interfaced_count agents ($((non_interfaced_count * 100 / total_agents))%) n'implémentent aucune interface standard:**" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  while read -r agent; do
    [ -z "$agent" ] && continue
    rel_path=$(echo "$agent" | sed "s|${WORKSPACE_ROOT}/||")
    echo "- \`$rel_path\`" >> "$REPORT_FILE"
  done <<< "$non_interfaced_agents"
else
  echo "**✅ Tous les agents implémentent au moins une interface standard.**" >> "$REPORT_FILE"
fi

# Vérifier la présence d'anciens répertoires d'agents
echo "" >> "$REPORT_FILE"
echo "## Vérification des anciens répertoires d'agents" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

old_dirs=(
  "${WORKSPACE_ROOT}/docs/agents"
  "${WORKSPACE_ROOT}/agents"
  "${WORKSPACE_ROOT}/src/agents"
)

old_dirs_exist=0
for dir in "${old_dirs[@]}"; do
  if [ -d "$dir" ]; then
    old_dirs_exist=1
    echo "**⚠️ Le répertoire ancien \`$(echo "$dir" | sed "s|${WORKSPACE_ROOT}/||")\` existe encore et contient $(find "$dir" -type f -name "*.ts" | wc -l) fichiers .ts**" >> "$REPORT_FILE"
  fi
done

if [ $old_dirs_exist -eq 0 ]; then
  echo "**✅ Tous les anciens répertoires d'agents ont été nettoyés.**" >> "$REPORT_FILE"
fi

# Conclusion et recommandations
echo "" >> "$REPORT_FILE"
echo "## Conclusion et recommandations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $total_potential -gt 0 ]; then
  echo "⚠️ **Actions recommandées:**" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "1. **Examiner les $total_potential fichiers potentiels d'agents** identifiés pour déterminer s'ils doivent être migrés" >> "$REPORT_FILE"
  
  if [ $non_interfaced_count -gt 0 ]; then
    echo "2. **Implémenter les interfaces standard** pour les $non_interfaced_count agents qui n'en ont pas" >> "$REPORT_FILE"
  fi
  
  if [ $old_dirs_exist -eq 1 ]; then
    echo "3. **Nettoyer les anciens répertoires d'agents** pour éviter toute confusion" >> "$REPORT_FILE"
  fi
else
  if [ $non_interfaced_count -gt 0 ]; then
    echo "⚠️ **Actions recommandées:**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "1. **Implémenter les interfaces standard** pour les $non_interfaced_count agents qui n'en ont pas" >> "$REPORT_FILE"
    
    if [ $old_dirs_exist -eq 1 ]; then
      echo "2. **Nettoyer les anciens répertoires d'agents** pour éviter toute confusion" >> "$REPORT_FILE"
    fi
  else
    if [ $old_dirs_exist -eq 1 ]; then
      echo "⚠️ **Actions recommandées:**" >> "$REPORT_FILE"
      echo "" >> "$REPORT_FILE"
      echo "1. **Nettoyer les anciens répertoires d'agents** pour éviter toute confusion" >> "$REPORT_FILE"
    else
      echo "✅ **La migration semble complète et réussie! Aucune action supplémentaire n'est nécessaire.**" >> "$REPORT_FILE"
    fi
  fi
fi

echo "" >> "$REPORT_FILE"
echo "La migration vers l'architecture à trois couches peut être considérée comme $([ $total_potential -eq 0 ] && [ $non_interfaced_count -eq 0 ] && [ $old_dirs_exist -eq 0 ] && echo "complète" || echo "incomplète")." >> "$REPORT_FILE"

echo "Rapport de vérification complète disponible: $REPORT_FILE"
exit 0