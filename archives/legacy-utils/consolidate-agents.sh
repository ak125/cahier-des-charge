#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   ANALYSE ET CONSOLIDATION DES AGENTS                ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/agents_consolidation_${TIMESTAMP}"
REPORTS_DIR="${WORKSPACE_ROOT}/reports"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/agents_consolidation_${TIMESTAMP}.log"
REPORT_FILE="${REPORTS_DIR}/agents_consolidation_${TIMESTAMP}.md"
GRAPH_FILE="${REPORTS_DIR}/agents_dependencies_${TIMESTAMP}.dot"
HTML_REPORT="${REPORTS_DIR}/agents_report_${TIMESTAMP}.html"

# Classification des agents par domaine fonctionnel
declare -A DOMAIN_KEYWORDS=(
  ["audit"]="audit review check validator validation verify"
  ["migration"]="migration migrate transformer convert"
  ["monitoring"]="monitoring monitor health check status metrics"
  ["security"]="security secure auth permission role"
  ["integration"]="integration connect api webhook github"
  ["pipeline"]="pipeline ci cd build deploy workflow"
  ["quality"]="quality test lint format eslint prettier"
  ["orchestration"]="orchestrate orchestrator manager coordinator"
  ["seo"]="seo search engine optimize content meta"
  ["notification"]="notify notification alert message email"
  ["analysis"]="analysis analyze parse scan detect discover"
  ["ui"]="ui frontend react component render view"
  ["api"]="api rest graphql endpoint server"
  ["data"]="data database storage persist cache model"
  ["automation"]="automate automation bot task cron schedule"
)

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORTS_DIR}"

# Initialisation du fichier de log
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour créer une sauvegarde des agents
backup_agents() {
  log "${YELLOW}Sauvegarde des agents...${NC}"
  
  if [ -d "${AGENTS_DIR}" ]; then
    cp -r "${AGENTS_DIR}" "${BACKUP_DIR}/"
    log "${GREEN}✅ Agents sauvegardés dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé à ${AGENTS_DIR}${NC}"
    exit 1
  fi
}

# Fonction pour analyser les agents
analyze_agents() {
  log "${YELLOW}Analyse des agents TypeScript...${NC}"
  
  # Compter le nombre total d'agents
  TOTAL_AGENTS=$(find "${AGENTS_DIR}" -type f -name "*.ts" | wc -l)
  log "Nombre total d'agents TypeScript: ${TOTAL_AGENTS}"
  
  # Fichiers temporaires pour l'analyse
  AGENTS_LIST="${LOG_DIR}/agents_list.txt"
  AGENTS_STATS="${LOG_DIR}/agents_stats.txt"
  AGENTS_IMPORTS="${LOG_DIR}/agents_imports.txt"
  AGENTS_EXPORTS="${LOG_DIR}/agents_exports.txt"
  AGENTS_CATEGORIES="${LOG_DIR}/agents_categories.txt"
  AGENTS_DUPLICATES="${LOG_DIR}/agents_duplicates.txt"
  
  # Créer la liste des agents
  find "${AGENTS_DIR}" -type f -name "*.ts" | sort > "${AGENTS_LIST}"
  
  # Analyser chaque agent
  log "Analyse détaillée de chaque agent..."
  
  > "${AGENTS_STATS}"
  > "${AGENTS_IMPORTS}"
  > "${AGENTS_EXPORTS}"
  > "${AGENTS_CATEGORIES}"
  
  while read -r agent_file; do
    agent_name=$(basename "${agent_file}" .ts)
    agent_path=${agent_file#${WORKSPACE_ROOT}/}
    lines=$(wc -l < "${agent_file}")
    
    # Extraire les imports
    imports=$(grep -E "^import |^import\{" "${agent_file}" | sort)
    
    # Extraire les exports
    exports=$(grep -E "^export |^export\{" "${agent_file}" | sort)
    
    # Déterminer la catégorie en fonction des mots-clés
    file_content=$(cat "${agent_file}" | tr '[:upper:]' '[:lower:]')
    
    highest_score=0
    category="undefined"
    
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      keywords=${DOMAIN_KEYWORDS["$domain"]}
      score=0
      
      for keyword in $keywords; do
        if echo "$file_content" | grep -q "$keyword"; then
          ((score++))
        fi
      done
      
      if [[ $score -gt $highest_score ]]; then
        highest_score=$score
        category="$domain"
      fi
    done
    
    # Ajouter à la catégorisation
    echo "${agent_path}|${category}|${highest_score}" >> "${AGENTS_CATEGORIES}"
    
    # Ajouter aux statistiques
    echo "${agent_path}|${lines}|${category}" >> "${AGENTS_STATS}"
    
    # Ajouter aux imports
    if [ -n "$imports" ]; then
      echo -e "--- ${agent_path} ---\n${imports}\n" >> "${AGENTS_IMPORTS}"
    fi
    
    # Ajouter aux exports
    if [ -n "$exports" ]; then
      echo -e "--- ${agent_path} ---\n${exports}\n" >> "${AGENTS_EXPORTS}"
    fi
    
  done < "${AGENTS_LIST}"
  
  # Analyser les duplications potentielles
  log "Recherche de duplications potentielles..."
  
  > "${AGENTS_DUPLICATES}"
  
  # Regrouper les agents par catégorie pour chercher des duplications
  while read -r line; do
    IFS='|' read -r agent_path category score <<< "$line"
    
    # Pour chaque agent de la même catégorie
    grep "|${category}|" "${AGENTS_CATEGORIES}" | while read -r similar_line; do
      IFS='|' read -r similar_path similar_category similar_score <<< "$similar_line"
      
      if [[ "$agent_path" == "$similar_path" ]]; then
        continue  # Ne pas comparer un agent avec lui-même
      fi
      
      # Comparaison simple: vérifier si les noms sont similaires
      agent_name=$(basename "${agent_path}" .ts | sed 's/-agent//g' | sed 's/agent-//g')
      similar_name=$(basename "${similar_path}" .ts | sed 's/-agent//g' | sed 's/agent-//g')
      
      similarity=$(echo -n "${agent_name}" | grep -o "${similar_name}" | wc -c)
      
      # Si les noms sont similaires ou que les fichiers partagent beaucoup d'imports
      if [[ $similarity -gt 3 ]]; then
        echo "${agent_path}|${similar_path}|name|${similarity}" >> "${AGENTS_DUPLICATES}"
      fi
      
      # Vérifier si les importations sont similaires
      agent_imports=$(grep -A 20 "--- ${agent_path} ---" "${AGENTS_IMPORTS}" | grep -v "---" | sort)
      similar_imports=$(grep -A 20 "--- ${similar_path} ---" "${AGENTS_IMPORTS}" | grep -v "---" | sort)
      
      if [[ -n "$agent_imports" && -n "$similar_imports" ]]; then
        common_imports=$(comm -12 <(echo "$agent_imports") <(echo "$similar_imports") | wc -l)
        if [[ $common_imports -gt 3 ]]; then
          echo "${agent_path}|${similar_path}|imports|${common_imports}" >> "${AGENTS_DUPLICATES}"
        fi
      fi
    done
  done < "${AGENTS_CATEGORIES}"
  
  log "${GREEN}✅ Analyse des agents terminée${NC}"
}

# Fonction pour générer un graphe de dépendances entre agents
generate_dependency_graph() {
  log "${YELLOW}Génération du graphe de dépendances...${NC}"
  
  # Créer le fichier DOT
  {
    echo "digraph AgentsDependencies {"
    echo "  rankdir=LR;"
    echo "  node [shape=box, style=filled, fillcolor=lightblue];"
    
    # Parcourir tous les agents
    find "${AGENTS_DIR}" -type f -name "*.ts" | while read -r agent_file; do
      agent_name=$(basename "${agent_file}" .ts)
      agent_path=${agent_file#${WORKSPACE_ROOT}/}
      
      # Trouver les imports d'autres agents
      grep -E "import .* from " "${agent_file}" | while read -r import_line; do
        if [[ "${import_line}" == *"from './"* || "${import_line}" == *"from \"./"* ]]; then
          # Extraire le nom du module importé
          imported_module=$(echo "${import_line}" | sed -E "s/.*from ['\"]\.\/([^'\"]*)['\"].*/\1/")
          imported_module=$(echo "${imported_module}" | sed 's/\..*$//')  # Supprimer l'extension
          
          if [[ -f "${AGENTS_DIR}/${imported_module}.ts" ]]; then
            echo "  \"${agent_name}\" -> \"${imported_module}\";"
          fi
        elif [[ "${import_line}" == *"from '../"* || "${import_line}" == *"from \"../"* ]]; then
          # Gestion des imports relatifs
          imported_module=$(echo "${import_line}" | sed -E "s/.*from ['\"]\.\.\/(.*)['\"].*/\1/")
          imported_module=$(echo "${imported_module}" | sed 's/\..*$//')  # Supprimer l'extension
          
          # Vérifier si c'est un agent
          for other_agent in $(find "${AGENTS_DIR}" -type f -name "*.ts"); do
            other_name=$(basename "${other_agent}" .ts)
            if [[ "${imported_module}" == *"${other_name}"* ]]; then
              echo "  \"${agent_name}\" -> \"${other_name}\";"
              break
            fi
          done
        fi
      done
    done
    
    echo "}"
  } > "${GRAPH_FILE}"
  
  log "${GREEN}✅ Graphe de dépendances généré dans ${GRAPH_FILE}${NC}"
  
  # Générer une image PNG si Graphviz est installé
  if command -v dot &> /dev/null; then
    dot -Tpng "${GRAPH_FILE}" -o "${REPORTS_DIR}/agents_dependencies_${TIMESTAMP}.png"
    log "${GREEN}✅ Image du graphe générée: ${REPORTS_DIR}/agents_dependencies_${TIMESTAMP}.png${NC}"
  else
    log "${YELLOW}⚠️ Graphviz n'est pas installé. L'image du graphe n'a pas été générée.${NC}"
    log "${YELLOW}⚠️ Vous pouvez installer Graphviz avec 'sudo apt install graphviz' et générer l'image manuellement.${NC}"
  fi
}

# Fonction pour générer le rapport d'analyse
generate_report() {
  log "${YELLOW}Génération du rapport d'analyse...${NC}"
  
  # Statistiques sur les agents
  TOTAL_AGENTS=$(wc -l < "${AGENTS_LIST}")
  TOTAL_LINES=$(awk -F'|' '{sum+=$2} END {print sum}' "${AGENTS_STATS}")
  AVERAGE_LINES=$(awk -F'|' '{sum+=$2} END {printf "%.1f", sum/NR}' "${AGENTS_STATS}")
  DUPLICATE_PAIRS=$(sort -u "${AGENTS_DUPLICATES}" | wc -l)
  
  # Catégories
  {
    echo "# Rapport d'analyse et de consolidation des agents"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Vue d'ensemble"
    echo ""
    echo "- **Nombre total d'agents:** ${TOTAL_AGENTS}"
    echo "- **Nombre total de lignes de code:** ${TOTAL_LINES}"
    echo "- **Moyenne de lignes par agent:** ${AVERAGE_LINES}"
    echo "- **Paires d'agents potentiellement similaires:** ${DUPLICATE_PAIRS}"
    echo ""
    echo "## Répartition par catégorie"
    echo ""
    echo "| Catégorie | Nombre d'agents | % du total |"
    echo "|-----------|-----------------|------------|"
    
    # Calculer les statistiques par catégorie
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}")
      percentage=$(awk -v count="$count" -v total="$TOTAL_AGENTS" 'BEGIN {printf "%.1f", (count/total)*100}')
      echo "| ${domain} | ${count} | ${percentage}% |"
    done
    
    echo ""
    echo "## Agents les plus volumineux"
    echo ""
    echo "| Agent | Lignes de code | Catégorie |"
    echo "|-------|---------------|-----------|"
    
    # Top 10 des agents les plus volumineux
    sort -t'|' -k2 -nr "${AGENTS_STATS}" | head -10 | while read -r line; do
      IFS='|' read -r agent_path lines category <<< "$line"
      agent_name=$(basename "${agent_path}")
      echo "| \`${agent_name}\` | ${lines} | ${category} |"
    done
    
    echo ""
    echo "## Agents potentiellement redondants"
    echo ""
    echo "| Agent 1 | Agent 2 | Type de similitude | Score |"
    echo "|---------|---------|-------------------|-------|"
    
    # Afficher les paires d'agents potentiellement redondants
    sort -t'|' -k4 -nr "${AGENTS_DUPLICATES}" | head -20 | while read -r line; do
      IFS='|' read -r agent1 agent2 type score <<< "$line"
      agent1_name=$(basename "${agent1}")
      agent2_name=$(basename "${agent2}")
      echo "| \`${agent1_name}\` | \`${agent2_name}\` | ${type} | ${score} |"
    done
    
    echo ""
    echo "## Propositions de consolidation"
    echo ""
    echo "En se basant sur l'analyse, voici les groupes d'agents qui pourraient être consolidés :"
    echo ""
    
    # Regrouper les agents similaires par catégorie
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      echo "### Catégorie: ${domain}"
      echo ""
      
      agents_in_category=$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | cut -d'|' -f1 | sort)
      
      if [ -z "${agents_in_category}" ]; then
        echo "*Aucun agent dans cette catégorie.*"
        echo ""
        continue
      fi
      
      # Chercher des groupes d'agents similaires dans la catégorie
      found_group=false
      
      # Utiliser un fichier temporaire pour suivre les agents déjà groupés
      TEMP_GROUPED="${LOG_DIR}/grouped_agents_${domain}.txt"
      > "${TEMP_GROUPED}"
      
      echo "<details>"
      echo "<summary>Groupes proposés pour consolidation</summary>"
      echo ""
      
      group_number=1
      while read -r agent_path; do
        # Vérifier si cet agent a déjà été groupé
        if grep -q "^${agent_path}$" "${TEMP_GROUPED}"; then
          continue
        fi
        
        # Chercher des agents similaires
        similar_agents=$(grep -F "|${agent_path}|" "${AGENTS_DUPLICATES}" | cut -d'|' -f2)
        
        if [ -n "${similar_agents}" ]; then
          found_group=true
          echo "#### Groupe ${domain}-${group_number}"
          echo ""
          agent_name=$(basename "${agent_path}")
          echo "- \`${agent_name}\`"
          echo "${agent_path}" >> "${TEMP_GROUPED}"
          
          # Ajouter les agents similaires au groupe
          echo "${similar_agents}" | while read -r similar_path; do
            if grep "|${domain}|" "${AGENTS_CATEGORIES}" | grep -q "^${similar_path}|"; then
              similar_name=$(basename "${similar_path}")
              echo "- \`${similar_name}\`"
              echo "${similar_path}" >> "${TEMP_GROUPED}"
            fi
          done
          
          echo ""
          echo "**Suggestion de consolidation:** Ces agents partagent des fonctionnalités similaires et pourraient être fusionnés en un seul module avec des fonctions dédiées."
          echo ""
          
          group_number=$((group_number + 1))
        fi
      done < <(echo "${agents_in_category}")
      
      if ! ${found_group}; then
        echo "*Pas de groupes de consolidation identifiés dans cette catégorie.*"
      fi
      
      echo "</details>"
      echo ""
      
      # Liste des agents non groupés dans cette catégorie
      echo "<details>"
      echo "<summary>Agents individuels dans cette catégorie</summary>"
      echo ""
      echo "| Agent | Lignes de code |"
      echo "|-------|---------------|"
      
      while read -r agent_path; do
        if ! grep -q "^${agent_path}$" "${TEMP_GROUPED}"; then
          agent_name=$(basename "${agent_path}")
          lines=$(grep "^${agent_path}|" "${AGENTS_STATS}" | cut -d'|' -f2)
          echo "| \`${agent_name}\` | ${lines} |"
        fi
      done < <(echo "${agents_in_category}")
      
      echo "</details>"
      echo ""
    done
    
    echo "## Modèle de structure consolidée proposée"
    echo ""
    echo "\`\`\`"
    echo "agents/"
    echo "├── core/ # Fonctionnalités de base et utilities partagées"
    echo "│   ├── types.ts"
    echo "│   ├── utils.ts"
    echo "│   └── base-agent.ts"
    
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      if grep -q "|${domain}|" "${AGENTS_CATEGORIES}"; then
        count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}")
        echo "├── ${domain}/ # ${count} agents"
        
        # Proposer une structure pour les agents consolidés dans cette catégorie
        consolidated_count=$(sort -u "${TEMP_GROUPED:-/dev/null}" | wc -l 2>/dev/null || echo "0")
        if [ "${consolidated_count}" -gt 0 ]; then
          echo "│   ├── ${domain}-consolidated.ts # Agent consolidé"
        fi
        
        # Quelques exemples d'agents individuels
        examples=$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | head -3 | cut -d'|' -f1 | xargs -n1 basename | sed 's/\.ts$//')
        echo -n "${examples}" | while read -r example; do
          if [ -n "${example}" ]; then
            echo "│   ├── ${example}.ts"
          fi
        done
        
        if [ "$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | wc -l)" -gt 3 ]; then
          echo "│   └── ... autres agents"
        else
          echo "│   └── index.ts"
        fi
      fi
    done
    
    echo "└── index.ts # Export des agents publics"
    echo "\`\`\`"
    echo ""
    echo "## Étapes recommandées pour la consolidation"
    echo ""
    echo "1. **Créer une structure de base commune** - Définir des interfaces et types partagés dans `agents/core/`"
    echo "2. **Consolider par catégorie** - Commencer par les catégories avec le plus d'agents similaires"
    echo "3. **Refactoriser progressivement** - Déplacer les agents vers leur nouvelle catégorie un par un"
    echo "4. **Mettre à jour les imports** - Ajuster les imports dans tout le projet"
    echo "5. **Ajouter des tests** - S'assurer que les fonctionnalités consolidées fonctionnent correctement"
    echo ""
    echo "## Exemple de consolidation pour la catégorie 'audit'"
    echo ""
    echo "```typescript"
    echo "// agents/audit/audit-consolidated.ts"
    echo "export interface AuditOptions {/* ... */}"
    echo ""
    echo "// Fonctionnalités regroupées de plusieurs agents d'audit"
    echo "export class AuditService {"
    echo "  // Méthodes de agent-audit.ts"
    echo "  public static performAudit() {/* ... */}"
    echo ""
    echo "  // Méthodes de status-auditor.ts"
    echo "  public static checkStatus() {/* ... */}"
    echo ""
    echo "  // Méthodes de canonical-validator.ts"
    echo "  public static validateCanonical() {/* ... */}"
    echo "}"
    echo "```"
    echo ""
    echo "## Conclusion"
    echo ""
    echo "L'analyse a identifié ${DUPLICATE_PAIRS} paires d'agents potentiellement similaires. En consolidant ces agents selon la structure proposée, le projet pourrait bénéficier de :"
    echo ""
    echo "- Une réduction significative de la duplication de code"
    echo "- Une meilleure organisation et découvrabilité"
    echo "- Une maintenance simplifiée"
    echo "- Un couplage réduit entre les modules"
    echo ""
    echo "La prochaine étape consiste à examiner en détail les groupes proposés et à planifier une stratégie de refactorisation progressive."

  } > "${REPORT_FILE}"
  
  # Générer un rapport HTML pour une meilleure visualisation
  {
    echo "<!DOCTYPE html>"
    echo "<html lang=\"fr\">"
    echo "<head>"
    echo "  <meta charset=\"UTF-8\">"
    echo "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    echo "  <title>Rapport de consolidation des agents</title>"
    echo "  <style>"
    echo "    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }"
    echo "    h1, h2, h3, h4 { color: #333; margin-top: 1.5em; }"
    echo "    table { border-collapse: collapse; width: 100%; margin: 1em 0; }"
    echo "    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }"
    echo "    th { background-color: #f2f2f2; }"
    echo "    tr:nth-child(even) { background-color: #f9f9f9; }"
    echo "    .category-section { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }"
    echo "    .chart { height: 300px; margin: 30px 0; }"
    echo "    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }"
    echo "    code { font-family: 'Courier New', monospace; }"
    echo "    .container { display: flex; flex-wrap: wrap; }"
    echo "    .column { flex: 1; min-width: 300px; padding: 10px; }"
    echo "    details { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }"
    echo "    summary { cursor: pointer; font-weight: bold; }"
    echo "  </style>"
    echo "  <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>"
    echo "</head>"
    echo "<body>"
    echo "  <h1>Rapport de consolidation des agents</h1>"
    echo "  <p>Date: $(date)</p>"
    echo "  <div class=\"container\">"
    echo "    <div class=\"column\">"
    echo "      <h2>Vue d'ensemble</h2>"
    echo "      <ul>"
    echo "        <li><strong>Nombre total d'agents:</strong> ${TOTAL_AGENTS}</li>"
    echo "        <li><strong>Nombre total de lignes de code:</strong> ${TOTAL_LINES}</li>"
    echo "        <li><strong>Moyenne de lignes par agent:</strong> ${AVERAGE_LINES}</li>"
    echo "        <li><strong>Paires potentiellement similaires:</strong> ${DUPLICATE_PAIRS}</li>"
    echo "      </ul>"
    echo "      <div class=\"chart\">"
    echo "        <canvas id=\"categoriesChart\"></canvas>"
    echo "      </div>"
    echo "    </div>"
    echo "    <div class=\"column\">"
    echo "      <h2>Répartition par catégorie</h2>"
    echo "      <table>"
    echo "        <tr><th>Catégorie</th><th>Nombre</th><th>%</th></tr>"
    
    # Insérer les données des catégories
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}")
      percentage=$(awk -v count="$count" -v total="$TOTAL_AGENTS" 'BEGIN {printf "%.1f", (count/total)*100}')
      echo "        <tr><td>${domain}</td><td>${count}</td><td>${percentage}%</td></tr>"
    done
    
    echo "      </table>"
    echo "    </div>"
    echo "  </div>"
    
    echo "  <h2>Agents les plus volumineux</h2>"
    echo "  <table>"
    echo "    <tr><th>Agent</th><th>Lignes</th><th>Catégorie</th></tr>"
    
    # Top 10 des agents les plus volumineux
    sort -t'|' -k2 -nr "${AGENTS_STATS}" | head -10 | while read -r line; do
      IFS='|' read -r agent_path lines category <<< "$line"
      agent_name=$(basename "${agent_path}")
      echo "    <tr><td><code>${agent_name}</code></td><td>${lines}</td><td>${category}</td></tr>"
    done
    
    echo "  </table>"
    
    echo "  <h2>Agents potentiellement redondants</h2>"
    echo "  <table>"
    echo "    <tr><th>Agent 1</th><th>Agent 2</th><th>Type</th><th>Score</th></tr>"
    
    # Paires d'agents potentiellement redondants
    sort -t'|' -k4 -nr "${AGENTS_DUPLICATES}" | head -20 | while read -r line; do
      IFS='|' read -r agent1 agent2 type score <<< "$line"
      agent1_name=$(basename "${agent1}")
      agent2_name=$(basename "${agent2}")
      echo "    <tr><td><code>${agent1_name}</code></td><td><code>${agent2_name}</code></td><td>${type}</td><td>${score}</td></tr>"
    done
    
    echo "  </table>"
    
    echo "  <h2>Propositions de consolidation par catégorie</h2>"
    
    # Générer une section pour chaque catégorie
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}")
      if [ "${count}" -gt 0 ]; then
        echo "  <div class=\"category-section\">"
        echo "    <h3>Catégorie: ${domain} (${count} agents)</h3>"
        
        # Détails sur les groupes proposés
        echo "    <details>"
        echo "      <summary>Groupes proposés pour consolidation</summary>"
        echo "      <div>"
        
        # Utiliser un fichier temporaire pour suivre les agents déjà groupés
        TEMP_GROUPED="${LOG_DIR}/html_grouped_${domain}.txt"
        > "${TEMP_GROUPED}"
        
        group_number=1
        found_group=false
        
        agents_in_category=$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | cut -d'|' -f1 | sort)
        
        while read -r agent_path; do
          # Vérifier si cet agent a déjà été groupé
          if grep -q "^${agent_path}$" "${TEMP_GROUPED}" 2>/dev/null; then
            continue
          fi
          
          # Chercher des agents similaires
          similar_agents=$(grep -F "|${agent_path}|" "${AGENTS_DUPLICATES}" | cut -d'|' -f2)
          
          if [ -n "${similar_agents}" ]; then
            found_group=true
            
            echo "        <h4>Groupe ${domain}-${group_number}</h4>"
            echo "        <ul>"
            
            agent_name=$(basename "${agent_path}")
            echo "          <li><code>${agent_name}</code></li>"
            echo "${agent_path}" >> "${TEMP_GROUPED}"
            
            # Ajouter les agents similaires au groupe
            echo "${similar_agents}" | while read -r similar_path; do
              if grep "|${domain}|" "${AGENTS_CATEGORIES}" | grep -q "^${similar_path}|"; then
                similar_name=$(basename "${similar_path}")
                echo "          <li><code>${similar_name}</code></li>"
                echo "${similar_path}" >> "${TEMP_GROUPED}"
              fi
            done
            
            echo "        </ul>"
            echo "        <p><em>Suggestion: Ces agents partagent des fonctionnalités similaires et pourraient être fusionnés.</em></p>"
            
            group_number=$((group_number + 1))
          fi
        done < <(echo "${agents_in_category}")
        
        if ! ${found_group}; then
          echo "        <p><em>Pas de groupes de consolidation identifiés dans cette catégorie.</em></p>"
        fi
        
        echo "      </div>"
        echo "    </details>"
        
        # Liste des agents non groupés
        echo "    <details>"
        echo "      <summary>Agents individuels</summary>"
        echo "      <table>"
        echo "        <tr><th>Agent</th><th>Lignes</th></tr>"
        
        while read -r agent_path; do
          if ! grep -q "^${agent_path}$" "${TEMP_GROUPED}" 2>/dev/null; then
            agent_name=$(basename "${agent_path}")
            lines=$(grep "^${agent_path}|" "${AGENTS_STATS}" | cut -d'|' -f2)
            echo "        <tr><td><code>${agent_name}</code></td><td>${lines}</td></tr>"
          fi
        done < <(echo "${agents_in_category}")
        
        echo "      </table>"
        echo "    </details>"
        echo "  </div>"
      fi
    done
    
    # Exemple de structure proposée
    echo "  <h2>Structure consolidée proposée</h2>"
    echo "  <pre><code>"
    echo "agents/"
    echo "├── core/ # Fonctionnalités de base et utilities partagées"
    echo "│   ├── types.ts"
    echo "│   ├── utils.ts"
    echo "│   └── base-agent.ts"
    
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      if grep -q "|${domain}|" "${AGENTS_CATEGORIES}"; then
        count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}")
        echo "├── ${domain}/ # ${count} agents"
        echo "│   ├── ${domain}-consolidated.ts # Agent consolidé"
        
        examples=$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | head -2 | cut -d'|' -f1 | xargs -n1 basename | sed 's/\.ts$//')
        echo -n "${examples}" | while read -r example; do
          if [ -n "${example}" ]; then
            echo "│   ├── ${example}.ts"
          fi
        done
        
        echo "│   └── ... autres agents"
      fi
    done
    
    echo "└── index.ts # Export des agents publics"
    echo "  </code></pre>"
    
    # Script Chart.js pour les graphiques
    echo "  <script>"
    echo "    // Données pour le graphique des catégories"
    echo "    const categoryData = {"
    echo "      labels: [$(for domain in "${!DOMAIN_KEYWORDS[@]}"; do count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}"); if [ "${count}" -gt 0 ]; then echo \"${domain}\",; fi; done)],"
    echo "      datasets: [{"
    echo "        label: 'Nombre d\\'agents',"
    echo "        data: [$(for domain in "${!DOMAIN_KEYWORDS[@]}"; do count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}"); if [ "${count}" -gt 0 ]; then echo \"${count}\",; fi; done)],"
    echo "        backgroundColor: ["
    echo "          '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01',"
    echo "          '#46BDC6', '#7BAAF7', '#F66D9B', '#6368D9', '#1A73E8',"
    echo "          '#80868B', '#D93025', '#188038', '#F9AB00', '#D01884'"
    echo "        ]"
    echo "      }]"
    echo "    };"
    
    echo "    // Créer le graphique des catégories"
    echo "    const ctxCategories = document.getElementById('categoriesChart').getContext('2d');"
    echo "    new Chart(ctxCategories, {"
    echo "      type: 'pie',"
    echo "      data: categoryData,"
    echo "      options: {"
    echo "        responsive: true,"
    echo "        plugins: {"
    echo "          legend: { position: 'right' },"
    echo "          title: {"
    echo "            display: true,"
    echo "            text: 'Répartition des agents par catégorie'"
    echo "          }"
    echo "        }"
    echo "      }"
    echo "    });"
    echo "  </script>"
    echo "</body>"
    echo "</html>"
  } > "${HTML_REPORT}"
  
  log "${GREEN}✅ Rapport généré: ${REPORT_FILE}${NC}"
  log "${GREEN}✅ Rapport HTML généré: ${HTML_REPORT}${NC}"
}

# Fonction pour proposer un plan de consolidation
generate_consolidation_plan() {
  log "${YELLOW}Génération du plan de consolidation...${NC}"
  
  PLAN_FILE="${REPORTS_DIR}/consolidation_plan_${TIMESTAMP}.md"
  
  {
    echo "# Plan de consolidation des agents"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Vue d'ensemble du plan"
    echo ""
    echo "Ce plan propose une approche progressive pour consolider les agents du projet, en se basant sur l'analyse précédente."
    echo ""
    
    echo "## Phase 1: Préparation (Semaine 1)"
    echo ""
    echo "1. **Créer la structure de base**"
    echo "   - Mettre en place le dossier `agents/core/`"
    echo "   - Définir les interfaces et types communs"
    echo "   - Créer une classe de base `BaseAgent` avec les fonctionnalités partagées"
    echo ""
    echo "2. **Préparer les dossiers de catégorisation**"
    
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}" 2>/dev/null || echo "0")
      if [ "${count}" -gt 0 ]; then
        echo "   - Créer le dossier `agents/${domain}/` et son index.ts"
      fi
    done
    
    echo ""
    echo "## Phase 2: Migration des agents (Semaines 2-4)"
    echo ""
    
    # Pour chaque catégorie, par ordre de priorité (nombre d'agents)
    for domain in $(grep -v "undefined" "${AGENTS_CATEGORIES}" 2>/dev/null | cut -d'|' -f2 | sort | uniq -c | sort -nr | awk '{print $2}'); do
      count=$(grep -c "|${domain}|" "${AGENTS_CATEGORIES}" 2>/dev/null || echo "0")
      if [ "${count}" -gt 0 ]; then
        echo "### Catégorie: ${domain} (${count} agents)"
        echo ""
        
        # Chercher les groupes potentiels
        TEMP_GROUPED="${LOG_DIR}/plan_grouped_${domain}.txt"
        > "${TEMP_GROUPED}"
        
        agents_in_category=$(grep "|${domain}|" "${AGENTS_CATEGORIES}" | cut -d'|' -f1 | sort)
        
        # 1. D'abord traiter les groupes d'agents similaires
        echo "1. **Consolidation des groupes similaires**"
        
        group_found=false
        while read -r agent_path; do
          # Vérifier si cet agent a déjà été groupé
          if grep -q "^${agent_path}$" "${TEMP_GROUPED}" 2>/dev/null; then
            continue
          fi
          
          # Chercher des agents similaires
          similar_agents=$(grep -F "|${agent_path}|" "${AGENTS_DUPLICATES}" | cut -d'|' -f2)
          
          if [ -n "${similar_agents}" ]; then
            group_found=true
            agent_name=$(basename "${agent_path}" .ts)
            echo "   - Créer un module consolidé pour *${agent_name}* et ses similaires:"
            echo "${agent_path}" >> "${TEMP_GROUPED}"
            
            # Ajouter les agents similaires au groupe
            echo "${similar_agents}" | while read -r similar_path; do
              if grep "|${domain}|" "${AGENTS_CATEGORIES}" | grep -q "^${similar_path}|"; then
                similar_name=$(basename "${similar_path}" .ts)
                echo "     - Extraire les fonctionnalités de *${similar_name}*"
                echo "${similar_path}" >> "${TEMP_GROUPED}"
              fi
            done
          fi
        done < <(echo "${agents_in_category}")
        
        if ! ${group_found}; then
          echo "   - Aucun groupe de consolidation identifié pour cette catégorie"
        fi
        
        echo ""
        
        # 2. Puis déplacer les agents individuels
        echo "2. **Migration des agents individuels**"
        
        # Compter les agents individuels
        individual_count=0
        while read -r agent_path; do
          if ! grep -q "^${agent_path}$" "${TEMP_GROUPED}" 2>/dev/null; then
            individual_count=$((individual_count + 1))
          fi
        done < <(echo "${agents_in_category}")
        
        if [ "${individual_count}" -gt 0 ]; then
          echo "   - Déplacer les ${individual_count} agents restants vers le dossier `agents/${domain}/`"
          echo "   - Mettre à jour les imports dans le projet"
          echo "   - Adapter l'interface des agents si nécessaire"
        else
          echo "   - Tous les agents de cette catégorie font partie de groupes à consolider"
        fi
        
        echo ""
      fi
    done
    
    echo "## Phase 3: Tests et validation (Semaine 5)"
    echo ""
    echo "1. **Tests unitaires**"
    echo "   - Écrire des tests pour chaque module consolidé"
    echo "   - Vérifier que toutes les fonctionnalités d'origine sont préservées"
    echo ""
    echo "2. **Tests d'intégration**"
    echo "   - Tester les interactions entre les agents consolidés et le reste du système"
    echo "   - S'assurer que tous les scénarios de bout en bout fonctionnent correctement"
    echo ""
    echo "3. **Validation de performance**"
    echo "   - Mesurer les temps d'exécution avant et après consolidation"
    echo "   - S'assurer qu'il n'y a pas de régression de performance"
    echo ""
    echo "## Phase 4: Documentation et nettoyage (Semaine 6)"
    echo ""
    echo "1. **Documenter la nouvelle architecture**"
    echo "   - Créer un schéma de l'architecture des agents"
    echo "   - Documenter les interfaces et patterns utilisés"
    echo ""
    echo "2. **Mettre à jour les guides de développement**"
    echo "   - Comment créer un nouvel agent"
    echo "   - Comment étendre les agents existants"
    echo "   - Comment tester les agents"
    echo ""
    echo "3. **Nettoyage final**"
    echo "   - Supprimer les fichiers d'agents obsolètes"
    echo "   - Supprimer le code mort et les imports inutilisés"
    echo "   - Exécuter une analyse de couverture de code"
    echo ""
    echo "## Estimations de temps et d'effort"
    echo ""
    echo "| Phase | Durée | Effort (personne-jours) | Complexité |"
    echo "|-------|-------|-------------------------|------------|"
    echo "| Préparation | 1 semaine | 5 | Moyenne |"
    echo "| Migration | 3 semaines | 15 | Haute |"
    echo "| Tests et validation | 1 semaine | 5 | Moyenne |"
    echo "| Documentation et nettoyage | 1 semaine | 3 | Faible |"
    echo "| **Total** | **6 semaines** | **28** | **Moyenne-Haute** |"
    echo ""
    echo "## Risques et atténuations"
    echo ""
    echo "| Risque | Impact | Probabilité | Atténuation |"
    echo "|--------|--------|-------------|-------------|"
    echo "| Régressions fonctionnelles | Haut | Moyen | Tests exhaustifs avant et après chaque étape |"
    echo "| Dépendances circulaires | Moyen | Haut | Analyse préalable des dépendances et refactoring progressif |"
    echo "| Résistance au changement | Moyen | Moyen | Communication claire et documentation du plan |"
    echo "| Échéancier trop optimiste | Moyen | Haut | Buffer de 20% sur les estimations |"
    echo ""
    echo "## Conclusion"
    echo ""
    echo "Ce plan propose une approche progressive pour consolider les ${TOTAL_AGENTS} agents du projet en une structure plus maintenable et plus cohérente. La consolidation permettra de réduire la duplication de code, d'améliorer la découvrabilité des fonctionnalités et de faciliter les futurs développements."
    
  } > "${PLAN_FILE}"
  
  log "${GREEN}✅ Plan de consolidation généré: ${PLAN_FILE}${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va analyser les agents du projet et proposer une consolidation.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute analyse.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les agents
  backup_agents
  
  # Étape 2: Analyser les agents
  analyze_agents
  
  # Étape 3: Générer le graphe de dépendances
  generate_dependency_graph
  
  # Étape 4: Générer le rapport d'analyse
  generate_report
  
  # Étape 5: Générer un plan de consolidation
  generate_consolidation_plan
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Analyse et plan de consolidation terminés!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport d'analyse: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Rapport HTML: ${HTML_REPORT}${NC}"
  echo -e "${GREEN}   - Plan de consolidation: ${PLAN_FILE}${NC}"
  echo -e "${GREEN}   - Graphe de dépendances: ${GRAPH_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les agents ont été analysés et un plan de consolidation a été généré."
  echo "Consultez le rapport HTML pour une visualisation interactive : ${HTML_REPORT#${WORKSPACE_ROOT}/}"
  echo "Un plan détaillé de consolidation est disponible dans : ${PLAN_FILE#${WORKSPACE_ROOT}/}"
}

# Exécution du script principal
main