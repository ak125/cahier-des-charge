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
echo -e "${BLUE}   SCRIPT D'ANALYSE ET CONSOLIDATION DES AGENTS       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Création des dossiers nécessaires
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/agents_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
REPORT_DIR="/workspaces/cahier-des-charge/documentation/agents"
CONSOLIDATED_DIR="/workspaces/cahier-des-charge/agents/consolidated"

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
    mkdir -p "${BACKUP_DIR}"
    cp -r "/workspaces/cahier-des-charge/agents" "${BACKUP_DIR}/"
    log "${GREEN}✅ Sauvegarde des agents effectuée dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé!${NC}"
    exit 1
  fi
}

# Fonction pour analyser les agents
analyze_agents() {
  log "${YELLOW}Analyse des agents...${NC}"
  
  # Fichier d'analyse
  ANALYSIS_FILE="${REPORT_DIR}/agents-analysis.md"
  
  {
    echo "# Analyse des Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Liste des agents identifiés"
    echo ""
    echo "| Nom de l'agent | Type | Responsabilités |"
    echo "|---------------|------|-----------------|"
  } > "${ANALYSIS_FILE}"
  
  # Analyser chaque fichier d'agent
  find "/workspaces/cahier-des-charge/agents" -name "*.ts" -type f | sort | while read -r file; do
    agent_name=$(basename "${file}" .ts)
    
    # Déterminer le type d'agent basé sur son nom ou son contenu
    if [[ "${agent_name}" == *audit* ]]; then
      agent_type="Audit"
    elif [[ "${agent_name}" == *verifier* || "${agent_name}" == *validator* ]]; then
      agent_type="Validation"
    elif [[ "${agent_name}" == *orchestrator* || "${agent_name}" == *coordinator* ]]; then
      agent_type="Orchestration"
    elif [[ "${agent_name}" == *monitor* || "${agent_name}" == *check* ]]; then
      agent_type="Monitoring"
    elif [[ "${agent_name}" == *generator* ]]; then
      agent_type="Génération"
    elif [[ "${agent_name}" == *integrator* || "${agent_name}" == *creator* ]]; then
      agent_type="Intégration"
    elif grep -q "class.*Notifier\|function.*notify" "${file}" 2>/dev/null; then
      agent_type="Notification"
    else
      agent_type="Autre"
    fi
    
    # Extraire les responsabilités de l'agent en cherchant des commentaires ou des noms de méthodes
    responsibilities=$(grep -E "\/\/|\/\*|\*\/|function|class|interface|@" "${file}" | head -n 20 | tr -d '*/' | tr -d '/*' | sed 's/\/\///g' | tr '\n' ' ' | sed 's/function//g' | sed 's/class//g' | awk '{$1=$1};1' | head -c 100)
    
    if [ -z "${responsibilities}" ]; then
      responsibilities="*(Non déterminées)*"
    else
      responsibilities="${responsibilities}..."
    fi
    
    echo "| ${agent_name} | ${agent_type} | ${responsibilities} |" >> "${ANALYSIS_FILE}"
  done
  
  {
    echo ""
    echo "## Statistiques"
    echo ""
    echo "- **Nombre total d'agents:** $(find "/workspaces/cahier-des-charge/agents" -name "*.ts" -type f | wc -l)"
    echo "- **Agents d'audit:** $(find "/workspaces/cahier-des-charge/agents" -name "*audit*.ts" -type f | wc -l)"
    echo "- **Agents de validation:** $(find "/workspaces/cahier-des-charge/agents" -name "*verifier*.ts" -type f -o -name "*validator*.ts" -type f | wc -l)"
    echo "- **Agents d'orchestration:** $(find "/workspaces/cahier-des-charge/agents" -name "*orchestrator*.ts" -type f -o -name "*coordinator*.ts" -type f | wc -l)"
    echo "- **Agents de monitoring:** $(find "/workspaces/cahier-des-charge/agents" -name "*monitor*.ts" -type f -o -name "*check*.ts" -type f | wc -l)"
    echo ""
    echo "## Problèmes potentiels identifiés"
    echo ""
    echo "### Chevauchement de fonctionnalités"
    echo ""
    
    # Rechercher des chevauchements potentiels
    echo "#### Agents d'audit"
    echo ""
    find "/workspaces/cahier-des-charge/agents" -name "*audit*.ts" -type f | sort | while read -r file; do
      echo "- $(basename "${file}" .ts)"
    done
    
    echo ""
    echo "#### Agents de validation"
    echo ""
    find "/workspaces/cahier-des-charge/agents" -name "*verifier*.ts" -type f -o -name "*validator*.ts" -type f | sort | while read -r file; do
      echo "- $(basename "${file}" .ts)"
    done
    
    echo ""
    echo "### Duplication de code"
    echo ""
    echo "Les fichiers suivants pourraient contenir du code dupliqué :"
    echo ""
    
    # Identifier les fichiers de taille similaire qui pourraient contenir du code dupliqué
    find "/workspaces/cahier-des-charge/agents" -name "*.ts" -type f -printf "%s %p\n" | sort -n | awk '
    {
      if (prev_size > 0 && $1 > 0 && (prev_size * 0.9 <= $1) && ($1 <= prev_size * 1.1)) {
        printf("- %s et %s (taille similaire: %d octets)\n", prev_file, $2, $1)
      }
      prev_size = $1
      prev_file = $2
    }' | tail -n 10
  } >> "${ANALYSIS_FILE}"
  
  log "${GREEN}✅ Analyse des agents terminée. Rapport disponible dans ${ANALYSIS_FILE}${NC}"
}

# Fonction pour analyser les dépendances entre agents
analyze_dependencies() {
  log "${YELLOW}Analyse des dépendances entre agents...${NC}"
  
  # Fichier de dépendances
  DEPENDENCIES_FILE="${REPORT_DIR}/agents-dependencies.md"
  
  {
    echo "# Dépendances entre Agents"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Graphe de dépendances"
    echo ""
    echo "```mermaid"
    echo "graph TD"
    
    # Analyser les imports dans chaque fichier d'agent
    find "/workspaces/cahier-des-charge/agents" -name "*.ts" -type f | sort | while read -r file; do
      source_agent=$(basename "${file}" .ts)
      grep -E "import.*from" "${file}" | grep -v "node_modules" | grep -v "@types" | while read -r import_line; do
        # Extraire le nom de l'agent importé
        if [[ "${import_line}" =~ from[[:space:]]+[\"\'](.*?)[\"\'] ]]; then
          imported_path="${BASH_REMATCH[1]}"
          imported_agent=$(basename "${imported_path}")
          
          # Si l'import fait référence à un autre agent, ajouter la dépendance
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
