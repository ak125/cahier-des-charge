#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   SCRIPT D'ANALYSE ET CONSOLIDATION DES AGENTS       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Création des dossiers nécessaires
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/agents_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
REPORT_DIR="/workspaces/cahier-des-charge/documentation/agents"

mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORT_DIR}"

# Fichier log
LOG_FILE="${LOG_DIR}/agent_consolidation_${TIMESTAMP}.log"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour sauvegarder les agents
backup_agents() {
  log "${YELLOW}Création d'une sauvegarde des agents...${NC}"
  
  if [ -d "/workspaces/cahier-des-charge/agents" ]; then
    cp -r "/workspaces/cahier-des-charge/agents" "${BACKUP_DIR}/"
    log "${GREEN}✅ Sauvegarde des agents effectuée dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier /workspaces/cahier-des-charge/agents non trouvé${NC}"
    exit 1
  fi
}

# Fonction pour analyser les agents
analyze_agents() {
  log "${YELLOW}Analyse des agents...${NC}"
  
  AGENTS_DIR="/workspaces/cahier-des-charge/agents"
  ANALYSIS_FILE="${REPORT_DIR}/agents-analysis.md"
  
  # Entête du rapport d'analyse
  {
    echo "# Analyse des Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
  } > "${ANALYSIS_FILE}"
  
  # Liste tous les agents
  {
    echo "## Liste des agents"
    echo ""
    echo "| Nom du fichier | Type d'agent | Fonctionnalités principales |"
    echo "|---------------|-------------|--------------------------|"
  } >> "${ANALYSIS_FILE}"
  
  # Parcourir les agents .ts
  find "${AGENTS_DIR}" -name "*.ts" -type f | sort | while read -r file; do
    filename=$(basename "$file")
    
    # Déterminer le type d'agent
    type="Non classifié"
    if [[ "$filename" == *audit* ]]; then
      type="Audit"
    elif [[ "$filename" == *check* || "$filename" == *verifier* || "$filename" == *validator* ]]; then
      type="Vérification"
    elif [[ "$filename" == *mcp* ]]; then
      type="MCP"
    elif [[ "$filename" == *seo* ]]; then
      type="SEO"
    elif [[ "$filename" == *migration* ]]; then
      type="Migration"
    elif [[ "$filename" == *ci* || "$filename" == *test* ]]; then
      type="CI/CD"
    elif [[ "$filename" == *generate* || "$filename" == *creator* ]]; then
      type="Génération"
    elif [[ "$filename" == *notify* || "$filename" == *notifier* ]]; then
      type="Notification"
    elif [[ "$filename" == *orchestrator* || "$filename" == *coordinator* ]]; then
      type="Orchestration"
    fi
    
    # Extraire les fonctionnalités principales
    features=$(grep -E "function|class|interface|const.*=.*\(" "$file" 2>/dev/null | head -n 5 | sed 's/export//g' | sed 's/{//g' | tr -d '\n' | tr -d '\t' | sed 's/  / /g' | cut -c 1-80)
    if [ ${#features} -gt 80 ]; then
      features="${features}..."
    fi
    
    echo "| \`$filename\` | $type | $features |" >> "${ANALYSIS_FILE}"
  done
  
  # Analyser les doublons potentiels
  {
    echo ""
    echo "## Groupes de fonctionnalités similaires"
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # Audit
  {
    echo "### Agents d'Audit"
    echo ""
    echo "Agents qui effectuent des audits, des vérifications et des validations:"
    echo ""
    grep "Audit\|Vérification" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # MCP
  {
    echo "### Agents MCP"
    echo ""
    echo "Agents liés au Model Context Protocol:"
    echo ""
    grep "MCP" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # SEO
  {
    echo "### Agents SEO"
    echo ""
    echo "Agents liés au référencement et à l'optimisation pour les moteurs de recherche:"
    echo ""
    grep "SEO" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # Migration
  {
    echo "### Agents de Migration"
    echo ""
    echo "Agents qui gèrent les migrations de code ou de données:"
    echo ""
    grep "Migration" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # CI/CD
  {
    echo "### Agents CI/CD"
    echo ""
    echo "Agents liés à l'intégration continue et au déploiement:"
    echo ""
    grep "CI/CD" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  # Orchestration
  {
    echo "### Agents d'Orchestration"
    echo ""
    echo "Agents qui coordonnent d'autres agents ou services:"
    echo ""
    grep "Orchestration" "${ANALYSIS_FILE}" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort
    echo ""
  } >> "${ANALYSIS_FILE}"
  
  log "${GREEN}✅ Analyse des agents terminée. Rapport disponible dans ${ANALYSIS_FILE}${NC}"
}

# Fonction pour analyser les dépendances entre agents
analyze_dependencies() {
  log "${YELLOW}Analyse des dépendances entre agents...${NC}"
  
  AGENTS_DIR="/workspaces/cahier-des-charge/agents"
  DEPENDENCIES_FILE="${REPORT_DIR}/agents-dependencies.md"
  
  # Entête du rapport de dépendances
  {
    echo "# Dépendances entre Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Importations entre agents"
    echo ""
    echo "| Agent | Importe | Importé par |"
    echo "|-------|---------|-------------|"
  } > "${DEPENDENCIES_FILE}"
  
  # Pour chaque agent, trouver ce qu'il importe et qui l'importe
  for agent_file in $(find "${AGENTS_DIR}" -name "*.ts" -type f | sort); do
    agent_name=$(basename "${agent_file}")
    
    # Qui est importé par cet agent
    imports=$(grep -E "import.*from.*['\"]\.\/|import.*from.*['\"]\.\.\/agents" "${agent_file}" 2>/dev/null | sed 's/.*from//g' | sed "s/['\"]//g" | sed 's/\.\/\.\.\///g' | sed 's/\.\/\.\.\/agents\///g' | sed 's/\.\/\.\.\/\.\.\/agents\///g' | sed 's/\.\///g' | xargs | tr ' ' ', ')
    
    # Qui importe cet agent
    imported_by=$(grep -l "import.*from.*['\"].*${agent_name%.ts}" $(find "${AGENTS_DIR}" -name "*.ts" -type f) 2>/dev/null | xargs -r basename -a | tr '\n' ', ' | sed 's/,$//')
    
    if [ -z "${imports}" ]; then
      imports="*(Aucun)*"
    fi
    
    if [ -z "${imported_by}" ]; then
      imported_by="*(Aucun)*"
    fi
    
    echo "| \`${agent_name}\` | ${imports} | ${imported_by} |" >> "${DEPENDENCIES_FILE}"
  done
  
  # Identifier les agents centraux (les plus importés)
  {
    echo ""
    echo "## Agents les plus importés"
    echo ""
    echo "Ces agents sont les plus utilisés par d'autres agents et devraient être considérés comme des composants centraux:"
    echo ""
  } >> "${DEPENDENCIES_FILE}"
  
  # Extraire les agents importés plus de 2 fois
  {
    echo "| Agent | Nombre d'importations |"
    echo "|-------|--------------------|"
  } >> "${DEPENDENCIES_FILE}"
  
  # Compter les occurrences et trier
  for agent_file in $(find "${AGENTS_DIR}" -name "*.ts" -type f); do
    agent_name=$(basename "${agent_file}")
    count=$(grep -l "import.*from.*['\"].*${agent_name%.ts}" $(find "${AGENTS_DIR}" -name "*.ts" -type f) 2>/dev/null | wc -l)
    if [ "${count}" -gt 1 ]; then
      echo "| \`${agent_name}\` | ${count} |" >> "${DEPENDENCIES_FILE}_temp"
    fi
  done
  
  if [ -f "${DEPENDENCIES_FILE}_temp" ]; then
    sort -t'|' -k3 -nr "${DEPENDENCIES_FILE}_temp" >> "${DEPENDENCIES_FILE}"
    rm "${DEPENDENCIES_FILE}_temp"
  else
    echo "*(Aucun agent n'est importé plus de 2 fois)*" >> "${DEPENDENCIES_FILE}"
  fi
  
  log "${GREEN}✅ Analyse des dépendances terminée. Rapport disponible dans ${DEPENDENCIES_FILE}${NC}"
}

# Fonction pour proposer une consolidation
propose_consolidation() {
  log "${YELLOW}Génération d'une proposition de consolidation...${NC}"
  
  CONSOLIDATION_FILE="${REPORT_DIR}/agents-consolidation.md"
  
  # Entête du rapport de consolidation
  {
    echo "# Proposition de Consolidation des Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Stratégie de consolidation"
    echo ""
    echo "Après analyse des agents et de leurs dépendances, voici une proposition de consolidation pour simplifier l'architecture:"
    echo ""
  } > "${CONSOLIDATION_FILE}"
  
  # 1. Agents d'Audit
  {
    echo "### 1. Consolidation des Agents d'Audit"
    echo ""
    echo "Regrouper les agents suivants dans un module d'audit unifié:"
    echo ""
    grep "Audit\|Vérification" "${REPORT_DIR}/agents-analysis.md" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort | sed 's/^/- /'
    echo ""
    echo "**Proposition de structure:**"
    echo ""
    echo "```typescript"
    echo "// File: /workspaces/cahier-des-charge/agents/consolidated/audit.ts"
    echo ""
    echo "// Exporter toutes les fonctionnalités d'audit depuis un seul point d'entrée"
    echo "export * from './audit/validator';"
    echo "export * from './audit/checker';"
    echo "export * from './audit/reporter';"
    echo "```"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  # 2. Agents MCP
  {
    echo "### 2. Consolidation des Agents MCP"
    echo ""
    echo "Regrouper les agents liés au Model Context Protocol:"
    echo ""
    grep "MCP" "${REPORT_DIR}/agents-analysis.md" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort | sed 's/^/- /'
    echo ""
    echo "**Proposition de structure:**"
    echo ""
    echo "```typescript"
    echo "// File: /workspaces/cahier-des-charge/agents/consolidated/mcp.ts"
    echo ""
    echo "// Module unifié pour toutes les fonctionnalités MCP"
    echo "export * from './mcp/verifier';"
    echo "export * from './mcp/manager';"
    echo "export * from './mcp/controller';"
    echo "```"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  # 3. Agents SEO
  {
    echo "### 3. Consolidation des Agents SEO"
    echo ""
    echo "Regrouper les agents liés au référencement:"
    echo ""
    grep "SEO" "${REPORT_DIR}/agents-analysis.md" | sed 's/|/\n/g' | grep "\.ts" | tr -d '\`' | sort | sed 's/^/- /'
    echo ""
    echo "**Proposition de structure:**"
    echo ""
    echo "```typescript"
    echo "// File: /workspaces/cahier-des-charge/agents/consolidated/seo.ts"
    echo ""
    echo "// Module unifié pour toutes les fonctionnalités SEO"
    echo "export * from './seo/auditor';"
    echo "export * from './seo/enhancer';"
    echo "export * from './seo/mapper';"
    echo "```"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  # 4. Couche d'orchestration
  {
    echo "### 4. Mise en place d'une couche d'orchestration claire"
    echo ""
    echo "Créer une couche d'orchestration distincte qui coordonne tous les agents:"
    echo ""
    echo "**Proposition de structure:**"
    echo ""
    echo "```typescript"
    echo "// File: /workspaces/cahier-des-charge/agents/orchestration.ts"
    echo ""
    echo "import { AuditModule } from './consolidated/audit';"
    echo "import { MCPModule } from './consolidated/mcp';"
    echo "import { SEOModule } from './consolidated/seo';"
    echo "import { MigrationModule } from './consolidated/migration';"
    echo ""
    echo "// Orchestrateur central qui coordonne tous les modules d'agents"
    echo "export class AgentOrchestrator {"
    echo "  // Configuration centralisée"
    echo "  private config: OrchestratorConfig;"
    echo ""
    echo "  constructor(config: OrchestratorConfig) {"
    echo "    this.config = config;"
    echo "    this.registerAgents();"
    echo "  }"
    echo ""
    echo "  // Point d'entrée pour toutes les opérations d'agents"
    echo "  public async executeAgentAction(action: AgentAction): Promise<AgentResult> {"
    echo "    // Implémentation de la logique d'orchestration"
    echo "    // ..."
    echo "  }"
    echo "}"
    echo "```"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  # 5. Plan de migration
  {
    echo "### 5. Plan de migration vers la nouvelle structure"
    echo ""
    echo "1. **Phase 1:** Créer la nouvelle structure de dossiers"
    echo "   - `/workspaces/cahier-des-charge/agents/consolidated/`"
    echo "   - Sous-dossiers par type (audit, mcp, seo, migration, etc.)"
    echo ""
    echo "2. **Phase 2:** Migration des agents par groupe fonctionnel"
    echo "   - Commencer par les agents les moins dépendants"
    echo "   - Créer des points d'entrée unifiés pour chaque groupe"
    echo "   - Mettre à jour les importations dans tous les fichiers"
    echo ""
    echo "3. **Phase 3:** Mise en place de la couche d'orchestration"
    echo "   - Implémenter l'orchestrateur central"
    echo "   - Connecter tous les modules consolidés"
    echo ""
    echo "4. **Phase 4:** Tests et validation"
    echo "   - Tester chaque groupe fonctionnel"
    echo "   - Valider l'intégration complète"
    echo ""
    echo "5. **Phase 5:** Nettoyage et documentation"
    echo "   - Supprimer les anciens agents après validation"
    echo "   - Mettre à jour la documentation"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  # 6. Script de migration
  {
    echo "### 6. Script de migration proposé"
    echo ""
    echo "```bash"
    echo "#!/bin/bash"
    echo ""
    echo "# Création de la nouvelle structure"
    echo "mkdir -p /workspaces/cahier-des-charge/agents/consolidated/{audit,mcp,seo,migration,ci}"
    echo ""
    echo "# Migration des agents par groupe fonctionnel"
    echo "# (Exemples à adapter selon les agents réels identifiés)"
    echo ""
    echo "# 1. Groupe Audit"
    echo "# ..."
    echo ""
    echo "# 2. Groupe MCP"
    echo "# ..."
    echo ""
    echo "# 3. Groupe SEO"
    echo "# ..."
    echo ""
    echo "# Création des points d'entrée unifiés"
    echo "# ..."
    echo "```"
    echo ""
  } >> "${CONSOLIDATION_FILE}"
  
  log "${GREEN}✅ Proposition de consolidation générée. Rapport disponible dans ${CONSOLIDATION_FILE}${NC}"
}

# Fonction pour créer un rapport de synthèse
create_summary_report() {
  log "${YELLOW}Création d'un rapport de synthèse...${NC}"
  
  SUMMARY_FILE="${REPORT_DIR}/agents-summary.md"
  
  # Entête du rapport de synthèse
  {
    echo "# Rapport de Synthèse sur les Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Statistiques"
    echo ""
    echo "- **Nombre total d'agents:** $(find "/workspaces/cahier-des-charge/agents" -name "*.ts" -type f | wc -l)"
    echo "- **Types d'agents identifiés:** $(grep -E "Audit|Vérification|MCP|SEO|Migration|CI/CD|Orchestration|Génération|Notification" "${REPORT_DIR}/agents-analysis.md" | sort | uniq | wc -l)"
    echo ""
    
    # Compter par type
    echo "### Répartition par type"
    echo ""
    echo "- **Agents d'Audit/Vérification:** $(grep -E "Audit|Vérification" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Agents MCP:** $(grep "MCP" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Agents SEO:** $(grep "SEO" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Agents de Migration:** $(grep "Migration" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Agents CI/CD:** $(grep "CI/CD" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Agents d'Orchestration:** $(grep "Orchestration" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo "- **Autres/Non classifiés:** $(grep "Non classifié" "${REPORT_DIR}/agents-analysis.md" | wc -l)"
    echo ""
  } > "${SUMMARY_FILE}"
  
  # Problèmes identifiés
  {
    echo "## Problèmes identifiés"
    echo ""
    echo "### 1. Fragmentation excessive"
    echo "De nombreux agents ont des responsabilités similaires mais sont divisés en fichiers séparés, ce qui complique la maintenance et l'évolution du code."
    echo ""
    echo "### 2. Couplage fort"
    echo "Certains agents sont fortement couplés, ce qui rend difficile les modifications isolées et augmente les risques de régression lors des changements."
    echo ""
    echo "### 3. Duplication de code"
    echo "Plusieurs agents implémentent des fonctionnalités similaires, entraînant une duplication de code et une augmentation de la dette technique."
    echo ""
    echo "### 4. Orchestration complexe"
    echo "La coordination entre les agents est gérée de manière ad-hoc, sans structure claire et cohérente."
    echo ""
  } >> "${SUMMARY_FILE}"
  
  # Solutions proposées
  {
    echo "## Solutions proposées"
    echo ""
    echo "### 1. Consolidation fonctionnelle"
    echo "Regrouper les agents par domaine fonctionnel pour créer une structure de code plus cohérente et maintenable."
    echo ""
    echo "### 2. Architecture modulaire"
    echo "Mettre en place une architecture modulaire avec des interfaces claires entre les différents composants."
    echo ""
    echo "### 3. Couche d'orchestration unifiée"
    echo "Créer une couche d'orchestration dédiée qui coordonne tous les agents de manière centralisée et contrôlée."
    echo ""
    echo "### 4. Documentation structurée"
    echo "Mettre en place une documentation qui explique clairement le rôle de chaque agent, ses dépendances et son utilisation."
    echo ""
    echo "### 5. Automatisation et tests"
    echo "Mettre en place des tests automatisés pour valider le comportement des agents et prévenir les régressions lors des refactorisations."
    echo ""
  } >> "${SUMMARY_FILE}"
  
  # Conclusion
  {
    echo "## Conclusion"
    echo ""
    echo "L'analyse des agents montre qu'une consolidation est nécessaire pour simplifier l'architecture et améliorer la maintenabilité du projet. En regroupant les agents par domaine fonctionnel et en mettant en place une orchestration claire, il sera possible de réduire la complexité et d'améliorer la qualité globale du code."
    echo ""
    echo "Les documents d'analyse détaillés et la proposition de consolidation fournissent une base solide pour engager cette refactorisation de manière méthodique et contrôlée."
    echo ""
  } >> "${SUMMARY_FILE}"
  
  log "${GREEN}✅ Rapport de synthèse créé dans ${SUMMARY_FILE}${NC}"
}

# Menu principal
main() {
  echo -e "${YELLOW}Ce script va analyser et proposer une consolidation des agents de votre projet.${NC}"
  echo -e "${RED}ATTENTION: Une sauvegarde sera créée avant toute analyse.${NC}"
  read -p "Voulez-vous continuer? (o/n): " confirm
  
  if [[ $confirm != "o" && $confirm != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Créer une sauvegarde
  backup_agents
  
  # Étape 2: Analyser les agents
  analyze_agents
  
  # Étape 3: Analyser les dépendances
  analyze_dependencies
  
  # Étape 4: Proposer une consolidation
  propose_consolidation
  
  # Étape 5: Créer un rapport de synthèse
  create_summary_report
  
  log "${GREEN}======================================================${NC}"
  log "${GREEN}✅ Analyse et proposition de consolidation terminées!${NC}"
  log "${GREEN}   - Sauvegarde : ${BACKUP_DIR}${NC}"
  log "${GREEN}   - Rapports : ${REPORT_DIR}${NC}"
  log "${GREEN}   - Log : ${LOG_FILE}${NC}"
  log "${GREEN}======================================================${NC}"
  
  echo -e "${CYAN}Que souhaitez-vous faire maintenant?${NC}"
  echo -e "${CYAN}1. Appliquer automatiquement la consolidation proposée${NC}"
  echo -e "${CYAN}2. Réviser manuellement les rapports et appliquer plus tard${NC}"
  read -p "Votre choix (1/2): " next_step
  
  if [[ $next_step == "1" ]]; then
    echo -e "${YELLOW}Cette fonctionnalité n'est pas encore implémentée.${NC}"
    echo -e "${YELLOW}Pour l'instant, veuillez réviser les rapports et appliquer manuellement les modifications.${NC}"
  else
    echo -e "${GREEN}Les rapports sont disponibles dans ${REPORT_DIR}${NC}"
    echo -e "${GREEN}Vous pouvez les consulter et appliquer manuellement les recommandations.${NC}"
  fi
}

# Exécuter le script
main
