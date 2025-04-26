#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   RÉORGANISATION DES AGENTS PAR CATÉGORIE            ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/agents_reorganization_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/reorganization_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/reorganization_${TIMESTAMP}.md"
CATEGORIES_FILE="${LOG_DIR}/agent_categories.txt"

# Utilisation du rapport d'analyse des agents s'il existe
ANALYSIS_REPORT_DIR="${WORKSPACE_ROOT}/reports"
LATEST_ANALYSIS_REPORT=$(find "${ANALYSIS_REPORT_DIR}" -name "agents_consolidation_*.md" -type f | sort -r | head -1)

# Classification des agents par domaine fonctionnel (mots-clés)
declare -A DOMAIN_KEYWORDS=(
  ["analysis"]="analysis analyze parser scan detect discover investigate explore"
  ["monitoring"]="monitoring monitor health check status metrics alert observe track watch"
  ["migration"]="migration migrate transform convert transfer move transition shift"
  ["audit"]="audit review check validator validation verify examine inspect scrutinize"
  ["security"]="security secure auth permission role protect encrypt access login guard shield firewall"
  ["integration"]="integration connect api webhook github gitlab external service third-party interface"
  ["pipeline"]="pipeline ci cd build deploy workflow process task automate job sequence"
  ["quality"]="quality test lint format eslint prettier jest mocha code standard format"
  ["seo"]="seo search engine optimize content meta meta-tag canonical redirect sitemap"
  ["notification"]="notify notification alert message email sms slack discord telegram push"
  ["orchestration"]="orchestrate orchestration coordinator manager control direct arrange conduct"
  ["ui"]="ui frontend react vue angular component render view template dom"
  ["api"]="api rest graphql endpoint server route controller handler request response"
  ["data"]="data database storage persist cache model entity record document json xml"
  ["automation"]="automate automation bot task cron schedule time job trigger flow"
)

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${WORKSPACE_ROOT}/reports"

# Initialisation du fichier de log
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour créer une sauvegarde des agents
backup_agents() {
  log "${YELLOW}Sauvegarde des agents avant réorganisation...${NC}"
  
  if [ -d "${AGENTS_DIR}" ]; then
    cp -r "${AGENTS_DIR}" "${BACKUP_DIR}/"
    log "${GREEN}✅ Agents sauvegardés dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé à ${AGENTS_DIR}${NC}"
    exit 1
  fi
}

# Fonction pour s'assurer que le dossier core existe
ensure_core_directory() {
  log "${YELLOW}Vérification du dossier core...${NC}"
  
  if [ ! -d "${AGENTS_DIR}/core" ]; then
    mkdir -p "${AGENTS_DIR}/core"
    log "${YELLOW}Dossier core créé${NC}"
  else
    log "${GREEN}Le dossier core existe déjà${NC}"
  fi
}

# Fonction pour créer la structure des catégories
create_category_structure() {
  log "${YELLOW}Création de la structure des catégories...${NC}"
  
  # Créer un dossier pour chaque catégorie
  for category in "${!DOMAIN_KEYWORDS[@]}"; do
    if [ ! -d "${AGENTS_DIR}/${category}" ]; then
      mkdir -p "${AGENTS_DIR}/${category}"
      log "Catégorie ${category} créée"
      
      # Créer un index.ts pour chaque catégorie
      {
        echo "/**"
        echo " * Agents de la catégorie ${category}"
        echo " * Ce fichier exporte tous les agents de cette catégorie"
        echo " */"
        echo ""
        echo "// Export tous les agents de la catégorie"
        echo "// (ces exports seront générés automatiquement lors de la réorganisation)"
      } > "${AGENTS_DIR}/${category}/index.ts"
    else
      log "Catégorie ${category} existe déjà"
    fi
  done
  
  log "${GREEN}✅ Structure des catégories créée${NC}"
}

# Fonction pour catégoriser les agents
categorize_agents() {
  log "${YELLOW}Catégorisation des agents...${NC}"
  
  > "${CATEGORIES_FILE}"
  
  # Si un rapport d'analyse existe, l'utiliser pour la catégorisation
  if [ -n "${LATEST_ANALYSIS_REPORT}" ] && [ -f "${LATEST_ANALYSIS_REPORT}" ]; then
    log "Utilisation du rapport d'analyse existant: ${LATEST_ANALYSIS_REPORT#${WORKSPACE_ROOT}/}"
    
    # Extraire les catégories du rapport d'analyse
    grep -A 2000 "^| \`.*\.ts\` | [0-9]* | [a-z]* |$" "${LATEST_ANALYSIS_REPORT}" | 
    grep "^| \`.*\.ts\` | [0-9]* | [a-z]* |$" |
    sed -E 's/\| \`(.*)\` \| [0-9]* \| ([a-z]*) \|/\1|\2/' > "${CATEGORIES_FILE}"
    
    CATEGORIZED_COUNT=$(wc -l < "${CATEGORIES_FILE}")
    log "Extrait ${CATEGORIZED_COUNT} agents du rapport d'analyse"
  fi
  
  # Pour chaque fichier TypeScript dans le dossier agents (sauf ceux dans core)
  find "${AGENTS_DIR}" -type f -name "*.ts" -not -path "${AGENTS_DIR}/core/*" -not -path "${AGENTS_DIR}/*/index.ts" | while read -r agent_file; do
    agent_name=$(basename "${agent_file}")
    
    # Vérifier si l'agent est déjà catégorisé
    if grep -q "^${agent_name}|" "${CATEGORIES_FILE}"; then
      continue
    fi
    
    # Déterminer la catégorie en fonction des mots-clés
    file_content=$(cat "${agent_file}" | tr '[:upper:]' '[:lower:]')
    highest_score=0
    category="misc"
    
    for domain in "${!DOMAIN_KEYWORDS[@]}"; do
      keywords=${DOMAIN_KEYWORDS["$domain"]}
      score=0
      
      for keyword in $keywords; do
        if echo "$file_content" | grep -q "$keyword"; then
          ((score++))
        fi
      done
      
      # Vérifier aussi le nom de l'agent
      agent_name_lower=$(echo "${agent_name}" | tr '[:upper:]' '[:lower:]')
      for keyword in $keywords; do
        if echo "$agent_name_lower" | grep -q "$keyword"; then
          ((score+=2))
        fi
      done
      
      if [[ $score -gt $highest_score ]]; then
        highest_score=$score
        category="$domain"
      fi
    done
    
    # Ajouter à la liste des catégories
    echo "${agent_name}|${category}" >> "${CATEGORIES_FILE}"
  done
  
  TOTAL_CATEGORIZED=$(wc -l < "${CATEGORIES_FILE}")
  log "${GREEN}✅ ${TOTAL_CATEGORIZED} agents catégorisés${NC}"
}

# Fonction pour déplacer les agents dans leurs catégories
move_agents_to_categories() {
  log "${YELLOW}Déplacement des agents dans leurs catégories respectives...${NC}"
  
  MOVED_AGENTS="${LOG_DIR}/moved_agents.txt"
  > "${MOVED_AGENTS}"
  
  # Pour chaque agent catégorisé
  while read -r line; do
    IFS='|' read -r agent_name category <<< "${line}"
    
    # Ignorer les agents sans catégorie
    if [ "${category}" == "undefined" ] || [ "${category}" == "misc" ]; then
      log "Agent ${agent_name} non catégorisé, reste à la racine"
      continue
    fi
    
    # Trouver le fichier agent dans le dossier agents
    agent_paths=$(find "${AGENTS_DIR}" -type f -name "${agent_name}" -not -path "${AGENTS_DIR}/${category}/*")
    
    for agent_path in ${agent_paths}; do
      # S'assurer que le dossier de catégorie existe
      mkdir -p "${AGENTS_DIR}/${category}"
      
      # Chemin de destination
      destination="${AGENTS_DIR}/${category}/${agent_name}"
      
      # Si l'agent existe déjà dans la catégorie, comparer les fichiers
      if [ -f "${destination}" ]; then
        if diff -q "${agent_path}" "${destination}" > /dev/null; then
          log "Agent ${agent_name} existe déjà dans ${category} (identique), suppression de l'original"
          rm "${agent_path}"
        else
          log "Agent ${agent_name} existe déjà dans ${category} mais est différent, renommage"
          # Ajouter un suffixe numérique pour éviter les collisions
          suffix=1
          while [ -f "${destination%.ts}_${suffix}.ts" ]; do
            ((suffix++))
          done
          cp "${agent_path}" "${destination%.ts}_${suffix}.ts"
          rm "${agent_path}"
          echo "${agent_name}|${agent_path}|${destination%.ts}_${suffix}.ts|renamed" >> "${MOVED_AGENTS}"
        fi
      else
        # Déplacer l'agent dans son dossier de catégorie
        mv "${agent_path}" "${destination}"
        log "Agent ${agent_name} déplacé vers ${category}"
        echo "${agent_name}|${agent_path}|${destination}|moved" >> "${MOVED_AGENTS}"
      fi
      
      # Mettre à jour l'index.ts de la catégorie
      if ! grep -q "export .* from './${agent_name%.ts}';" "${AGENTS_DIR}/${category}/index.ts"; then
        echo "export * from './${agent_name%.ts}';" >> "${AGENTS_DIR}/${category}/index.ts"
      fi
    done
  done < "${CATEGORIES_FILE}"
  
  MOVED_COUNT=$(grep -c "|moved$" "${MOVED_AGENTS}")
  RENAMED_COUNT=$(grep -c "|renamed$" "${MOVED_AGENTS}")
  
  log "${GREEN}✅ ${MOVED_COUNT} agents déplacés, ${RENAMED_COUNT} agents renommés${NC}"
}

# Fonction pour mettre à jour l'index principal
update_main_index() {
  log "${YELLOW}Mise à jour de l'index principal...${NC}"
  
  # Index principal
  MAIN_INDEX="${AGENTS_DIR}/index.ts"
  
  # Sauvegarder l'ancien index
  if [ -f "${MAIN_INDEX}" ]; then
    cp "${MAIN_INDEX}" "${LOG_DIR}/old_index.ts"
    log "Ancien index sauvegardé"
  fi
  
  # Créer le nouvel index
  {
    echo "/**"
    echo " * Points d'entrée pour tous les agents"
    echo " * Ce fichier exporte tous les agents organisés par catégorie"
    echo " */"
    echo ""
    echo "// Export des fonctionnalités de base"
    echo "export * from './core';"
    echo ""
    echo "// Export des agents par catégorie"
  } > "${MAIN_INDEX}"
  
  # Ajouter un export pour chaque catégorie qui a des agents
  for category in $(ls -d "${AGENTS_DIR}/"*/ | grep -v "/core/"); do
    category_name=$(basename "${category}")
    if [ -f "${category}/index.ts" ]; then
      echo "export * as ${category_name} from './${category_name}';" >> "${MAIN_INDEX}"
    fi
  done
  
  log "${GREEN}✅ Index principal mis à jour${NC}"
}

# Fonction pour générer un rapport de réorganisation
generate_report() {
  log "${YELLOW}Génération du rapport de réorganisation...${NC}"
  
  MOVED_AGENTS="${LOG_DIR}/moved_agents.txt"
  
  {
    echo "# Rapport de réorganisation des agents"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Résumé"
    echo ""
    echo "- **Nombre total d'agents catégorisés:** $(wc -l < "${CATEGORIES_FILE}")"
    echo "- **Nombre d'agents déplacés:** $(grep -c "|moved$" "${MOVED_AGENTS}")"
    echo "- **Nombre d'agents renommés:** $(grep -c "|renamed$" "${MOVED_AGENTS}")"
    echo ""
    echo "## Répartition par catégorie"
    echo ""
    echo "| Catégorie | Nombre d'agents |"
    echo "|-----------|-----------------|"
    
    # Compter le nombre d'agents par catégorie
    for category in "${!DOMAIN_KEYWORDS[@]}"; do
      count=$(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/index.ts" | wc -l)
      echo "| ${category} | ${count} |"
    done
    
    echo ""
    echo "## Agents déplacés"
    echo ""
    echo "| Agent | De | Vers | Action |"
    echo "|-------|----|----|--------|"
    
    # Lister tous les agents déplacés
    while read -r line; do
      if [ -n "${line}" ]; then
        IFS='|' read -r agent_name source_path dest_path action <<< "${line}"
        source_rel="${source_path#${WORKSPACE_ROOT}/}"
        dest_rel="${dest_path#${WORKSPACE_ROOT}/}"
        echo "| \`${agent_name}\` | \`${source_rel}\` | \`${dest_rel}\` | ${action} |"
      fi
    done < "${MOVED_AGENTS}"
    
    echo ""
    echo "## Prochaines étapes"
    echo ""
    echo "1. **Vérifiez les imports** - Assurez-vous que tous les imports sont à jour après la réorganisation"
    echo "2. **Étendez la classe de base** - Mettez à jour les agents pour étendre la classe `BaseAgent` de `core/base-agent.ts`"
    echo "3. **Standardisez les interfaces** - Utilisez les interfaces définies dans `core/types.ts`"
    echo "4. **Créez des classes spécialisées par catégorie** - Pour chaque catégorie, créez une classe de base spécifique"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des agents avant réorganisation a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
  } > "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport de réorganisation généré: ${REPORT_FILE}${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va réorganiser les agents par catégorie fonctionnelle.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les agents
  backup_agents
  
  # Étape 2: S'assurer que le dossier core existe
  ensure_core_directory
  
  # Étape 3: Créer la structure des catégories
  create_category_structure
  
  # Étape 4: Catégoriser les agents
  categorize_agents
  
  # Étape 5: Déplacer les agents dans leurs catégories
  move_agents_to_categories
  
  # Étape 6: Mettre à jour l'index principal
  update_main_index
  
  # Étape 7: Générer un rapport de réorganisation
  generate_report
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Réorganisation des agents terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les agents ont été réorganisés par catégorie."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
  echo ""
  echo "Prochaines étapes recommandées :"
  echo "1. Mettre à jour les imports dans les fichiers"
  echo "2. Faire hériter les agents de la classe BaseAgent"
}

# Exécution du script principal
main