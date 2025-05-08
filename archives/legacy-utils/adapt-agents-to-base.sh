#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   ADAPTATION DES AGENTS À LA STRUCTURE DE BASE       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/agents_adaptation_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/adaptation_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/adaptation_${TIMESTAMP}.md"
TEMPLATES_DIR="${LOG_DIR}/templates"

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${TEMPLATES_DIR}"
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
  log "${YELLOW}Sauvegarde des agents avant adaptation...${NC}"
  
  if [ -d "${AGENTS_DIR}" ]; then
    cp -r "${AGENTS_DIR}" "${BACKUP_DIR}/"
    log "${GREEN}✅ Agents sauvegardés dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé à ${AGENTS_DIR}${NC}"
    exit 1
  fi
}

# Fonction pour créer les classes de base pour chaque catégorie
create_category_base_classes() {
  log "${YELLOW}Création des classes de base pour chaque catégorie...${NC}"
  
  # Trouver toutes les catégories (dossiers dans agents/ sauf core/)
  CATEGORIES=$(find "${AGENTS_DIR}" -maxdepth 1 -type d -not -path "${AGENTS_DIR}" -not -path "${AGENTS_DIR}/core" | xargs -n1 basename)
  
  # Pour chaque catégorie, créer une classe de base
  echo "${CATEGORIES}" | while read -r category; do
    if [ -z "${category}" ]; then
      continue
    fi
    
    CATEGORY_FILE="${AGENTS_DIR}/${category}/base-${category}-agent.ts"
    
    # Ne pas écraser si le fichier existe déjà
    if [ -f "${CATEGORY_FILE}" ]; then
      log "La classe de base pour ${category} existe déjà"
      continue
    fi
    
    log "Création de la classe de base pour ${category}"
    
    # Créer le contenu de la classe de base
    CATEGORY_PASCAL=$(echo "${category}" | sed -E 's/(^|-)([a-z])/\U\2/g')
    
    {
      echo "/**"
      echo " * Classe de base pour les agents de la catégorie ${category}"
      echo " * Étend la classe BaseAgent avec des fonctionnalités spécifiques à ${category}"
      echo " */"
      echo ""
      echo "import { BaseAgent, AgentOptions, AgentResult } from '../core';"
      echo ""
      echo "export interface ${CATEGORY_PASCAL}AgentOptions extends AgentOptions {"
      echo "  // Options spécifiques aux agents de ${category}"
      echo "  category${CATEGORY_PASCAL}?: boolean;"
      echo "}"
      echo ""
      echo "export interface ${CATEGORY_PASCAL}Result {"
      echo "  // Résultat spécifique aux agents de ${category}"
      echo "  category?: string;"
      echo "  [key: string]: any;"
      echo "}"
      echo ""
      echo "/**"
      echo " * Classe de base pour tous les agents de type ${category}"
      echo " * @abstract"
      echo " */"
      echo "export abstract class Base${CATEGORY_PASCAL}Agent<"
      echo "  TOptions extends ${CATEGORY_PASCAL}AgentOptions = ${CATEGORY_PASCAL}AgentOptions,"
      echo "  TResult = ${CATEGORY_PASCAL}Result"
      echo "> extends BaseAgent<TOptions, TResult> {"
      echo "  constructor(options?: Partial<TOptions>) {"
      echo "    super({...options, category${CATEGORY_PASCAL}: true} as TOptions);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Fonctionnalité spécifique aux agents de ${category}"
      echo "   * @protected"
      echo "   */"
      echo "  protected validate${CATEGORY_PASCAL}Options(): boolean {"
      echo "    // Validation spécifique aux options de ${category}"
      echo "    this.log('debug', 'Validation des options spécifiques à ${category}');"
      echo "    return true;"
      echo "  }"
      echo "}"
      echo ""
      echo "// Export par défaut"
      echo "export default Base${CATEGORY_PASCAL}Agent;"
      
    } > "${CATEGORY_FILE}"
    
    # Mettre à jour l'index de la catégorie pour exporter la classe de base
    INDEX_FILE="${AGENTS_DIR}/${category}/index.ts"
    if [ -f "${INDEX_FILE}" ]; then
      if ! grep -q "export .* from './base-${category}-agent';" "${INDEX_FILE}"; then
        echo "export * from './base-${category}-agent';" >> "${INDEX_FILE}"
      fi
    fi
  done
  
  log "${GREEN}✅ Classes de base créées pour toutes les catégories${NC}"
}

# Fonction pour analyser un agent et déterminer s'il peut être adapté
analyze_agent() {
  local agent_file="$1"
  local agent_name=$(basename "${agent_file}" .ts)
  local category=$(dirname "${agent_file}" | xargs basename)
  
  # Ignorer les fichiers spéciaux comme index.ts, les classes de base, etc.
  if [[ "${agent_name}" == "index" ]] || [[ "${agent_name}" == "base-"* ]]; then
    echo "ignore|${agent_file}"
    return
  fi
  
  # Vérifier si l'agent est déjà une classe qui étend BaseAgent ou une classe de base catégorie
  if grep -q "extends \(Base\|BaseAgent\)" "${agent_file}"; then
    echo "extends_already|${agent_file}"
    return
  fi
  
  # Vérifier si l'agent est une classe
  if grep -q "class ${agent_name}" "${agent_file}" || \
     grep -q "class [A-Z][a-zA-Z]*" "${agent_file}"; then
    echo "is_class|${agent_file}"
    return
  fi
  
  # Vérifier si l'agent est une fonction exportée
  if grep -q "export function" "${agent_file}" || \
     grep -q "export const .* = " "${agent_file}"; then
    echo "is_function|${agent_file}"
    return
  }
  
  # Si aucun des cas ci-dessus, l'agent est potentiellement adaptable
  echo "adaptable|${agent_file}"
}

# Fonction pour créer un template d'adaptation pour un agent
create_agent_adapter_template() {
  local agent_file="$1"
  local analysis="$2"
  
  local agent_name=$(basename "${agent_file}" .ts)
  local category=$(dirname "${agent_file}" | xargs basename)
  local category_pascal=$(echo "${category}" | sed -E 's/(^|-)([a-z])/\U\2/g')
  local agent_pascal=$(echo "${agent_name}" | sed -E 's/(^|[-_])([a-z])/\U\2/g')
  
  # Créer le dossier pour les templates
  mkdir -p "${TEMPLATES_DIR}/${category}"
  
  # Template pour la transformation
  local template_file="${TEMPLATES_DIR}/${category}/${agent_name}.template.ts"
  
  # Si l'agent est une classe, créer un template pour l'héritage
  if [[ "${analysis}" == "is_class" ]]; then
    {
      echo "/**"
      echo " * Agent ${agent_name} adapté pour étendre la classe de base"
      echo " * Ce template montre comment adapter une classe existante pour hériter de Base${category_pascal}Agent"
      echo " */"
      echo ""
      echo "import { Base${category_pascal}Agent, ${category_pascal}AgentOptions, ${category_pascal}Result } from './base-${category}-agent';"
      echo ""
      echo "// Définir les options spécifiques à cet agent"
      echo "export interface ${agent_pascal}Options extends ${category_pascal}AgentOptions {"
      echo "  // Ajouter des options spécifiques à ${agent_name}"
      echo "}"
      echo ""
      echo "// Définir le type de résultat spécifique à cet agent"
      echo "export interface ${agent_pascal}Result extends ${category_pascal}Result {"
      echo "  // Ajouter des champs spécifiques au résultat de ${agent_name}"
      echo "}"
      echo ""
      echo "/**"
      echo " * Agent ${agent_name}"
      echo " * Étend la classe Base${category_pascal}Agent avec les fonctionnalités spécifiques à ${agent_name}"
      echo " */"
      echo "export class ${agent_pascal}Agent extends Base${category_pascal}Agent<${agent_pascal}Options, ${agent_pascal}Result> {"
      echo "  constructor(options?: Partial<${agent_pascal}Options>) {"
      echo "    super(options);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Implémentation de la méthode run requise par BaseAgent"
      echo "   * @param options Options d'exécution"
      echo "   * @returns Résultat de l'exécution"
      echo "   */"
      echo "  protected async run(options: ${agent_pascal}Options): Promise<${agent_pascal}Result> {"
      echo "    this.log('info', 'Exécution de ${agent_pascal}Agent');"
      echo ""
      echo "    // TODO: Implémenter la logique spécifique à ${agent_name} ici"
      echo "    // Utiliser le code existant comme référence"
      echo ""
      echo "    return {"
      echo "      category: '${category}',"
      echo "      // Ajouter les données de résultat spécifiques"
      echo "    };"
      echo "  }"
      echo "}"
      echo ""
      echo "// Export par défaut"
      echo "export default ${agent_pascal}Agent;"
    } > "${template_file}"
  
  # Si l'agent est une fonction, créer un template pour l'encapsulation
  elif [[ "${analysis}" == "is_function" ]]; then
    {
      echo "/**"
      echo " * Agent ${agent_name} adapté pour étendre la classe de base"
      echo " * Ce template montre comment adapter une fonction existante pour encapsuler dans une classe Base${category_pascal}Agent"
      echo " */"
      echo ""
      echo "import { Base${category_pascal}Agent, ${category_pascal}AgentOptions, ${category_pascal}Result } from './base-${category}-agent';"
      echo ""
      echo "// Définir les options spécifiques à cet agent"
      echo "export interface ${agent_pascal}Options extends ${category_pascal}AgentOptions {"
      echo "  // Ajouter des options spécifiques à ${agent_name}"
      echo "}"
      echo ""
      echo "// Définir le type de résultat spécifique à cet agent"
      echo "export interface ${agent_pascal}Result extends ${category_pascal}Result {"
      echo "  // Ajouter des champs spécifiques au résultat de ${agent_name}"
      echo "}"
      echo ""
      echo "/**"
      echo " * Agent ${agent_name}"
      echo " * Encapsule la fonction ${agent_name} dans une classe qui étend Base${category_pascal}Agent"
      echo " */"
      echo "export class ${agent_pascal}Agent extends Base${category_pascal}Agent<${agent_pascal}Options, ${agent_pascal}Result> {"
      echo "  constructor(options?: Partial<${agent_pascal}Options>) {"
      echo "    super(options);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Implémentation de la méthode run requise par BaseAgent"
      echo "   * @param options Options d'exécution"
      echo "   * @returns Résultat de l'exécution"
      echo "   */"
      echo "  protected async run(options: ${agent_pascal}Options): Promise<${agent_pascal}Result> {"
      echo "    this.log('info', 'Exécution de ${agent_pascal}Agent');"
      echo ""
      echo "    try {"
      echo "      // TODO: Appeler la fonction originale ici et transformer son résultat"
      echo "      // Exemple: const result = await originalFunction(options);"
      echo ""
      echo "      return {"
      echo "        category: '${category}',"
      echo "        // Ajouter les données de résultat transformées"
      echo "      };"
      echo "    } catch (error) {"
      echo "      this.log('error', 'Erreur lors de l\'exécution de ${agent_name}', error);"
      echo "      throw error;"
      echo "    }"
      echo "  }"
      echo "}"
      echo ""
      echo "// Export par défaut"
      echo "export default ${agent_pascal}Agent;"
      echo ""
      echo "// TODO: Conserver les exports originaux au besoin (fonctions utilitaires, etc.)"
    } > "${template_file}"
  
  # Si l'agent est adaptable mais pas clairement une classe ou fonction
  else
    {
      echo "/**"
      echo " * Agent ${agent_name} adapté pour étendre la classe de base"
      echo " * Ce template montre comment adapter un module existant pour créer une classe compatible avec Base${category_pascal}Agent"
      echo " */"
      echo ""
      echo "import { Base${category_pascal}Agent, ${category_pascal}AgentOptions, ${category_pascal}Result } from './base-${category}-agent';"
      echo ""
      echo "// Définir les options spécifiques à cet agent"
      echo "export interface ${agent_pascal}Options extends ${category_pascal}AgentOptions {"
      echo "  // Ajouter des options spécifiques à ${agent_name}"
      echo "}"
      echo ""
      echo "// Définir le type de résultat spécifique à cet agent"
      echo "export interface ${agent_pascal}Result extends ${category_pascal}Result {"
      echo "  // Ajouter des champs spécifiques au résultat de ${agent_name}"
      echo "}"
      echo ""
      echo "/**"
      echo " * Agent ${agent_name}"
      echo " * Implémente les fonctionnalités de ${agent_name} en étendant Base${category_pascal}Agent"
      echo " */"
      echo "export class ${agent_pascal}Agent extends Base${category_pascal}Agent<${agent_pascal}Options, ${agent_pascal}Result> {"
      echo "  constructor(options?: Partial<${agent_pascal}Options>) {"
      echo "    super(options);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Implémentation de la méthode run requise par BaseAgent"
      echo "   * @param options Options d'exécution"
      echo "   * @returns Résultat de l'exécution"
      echo "   */"
      echo "  protected async run(options: ${agent_pascal}Options): Promise<${agent_pascal}Result> {"
      echo "    this.log('info', 'Exécution de ${agent_pascal}Agent');"
      echo ""
      echo "    // TODO: Implémenter ici la logique de l'agent original"
      echo "    // Analyser le code original et l'adapter pour utiliser l'API BaseAgent"
      echo ""
      echo "    return {"
      echo "      category: '${category}',"
      echo "      // Ajouter ici les données de résultat"
      echo "    };"
      echo "  }"
      echo "}"
      echo ""
      echo "// Export par défaut"
      echo "export default ${agent_pascal}Agent;"
      echo ""
      echo "// TODO: Conserver les exports originaux au besoin (fonctions utilitaires, types, etc.)"
    } > "${template_file}"
  fi
  
  echo "${template_file}|${analysis}"
}

# Fonction pour générer un rapport d'adaptation
generate_adaptation_report() {
  local templates_created="${1}"
  local adaptation_stats="${2}"
  
  # Compter les types d'adaptations
  count_extends_already=$(echo "${adaptation_stats}" | grep -c "extends_already")
  count_is_class=$(echo "${adaptation_stats}" | grep -c "is_class")
  count_is_function=$(echo "${adaptation_stats}" | grep -c "is_function")
  count_adaptable=$(echo "${adaptation_stats}" | grep -c "adaptable")
  count_ignore=$(echo "${adaptation_stats}" | grep -c "ignore")
  
  log "${YELLOW}Génération du rapport d'adaptation...${NC}"
  
  {
    echo "# Rapport d'adaptation des agents à la structure de base"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Résumé"
    echo ""
    echo "- **Agents déjà adaptés:** ${count_extends_already}"
    echo "- **Agents de type classe:** ${count_is_class}"
    echo "- **Agents de type fonction:** ${count_is_function}"
    echo "- **Agents à adapter manuellement:** ${count_adaptable}"
    echo "- **Fichiers ignorés (index, etc.):** ${count_ignore}"
    echo "- **Templates générés:** $(echo "${templates_created}" | wc -l)"
    echo ""
    echo "## Classes de base créées"
    echo ""
    echo "Les classes de base suivantes ont été créées pour chaque catégorie d'agent :"
    echo ""
    echo "| Catégorie | Classe de base | Chemin |"
    echo "|-----------|---------------|--------|"
    
    # Lister les classes de base créées
    find "${AGENTS_DIR}" -name "base-*-agent.ts" | sort | while read -r base_file; do
      category=$(dirname "${base_file}" | xargs basename)
      base_class=$(basename "${base_file}")
      rel_path="${base_file#${WORKSPACE_ROOT}/}"
      category_pascal=$(echo "${category}" | sed -E 's/(^|-)([a-z])/\U\2/g')
      echo "| ${category} | Base${category_pascal}Agent | \`${rel_path}\` |"
    done
    
    echo ""
    echo "## Agents par type d'adaptation"
    echo ""
    echo "### Agents déjà adaptés (${count_extends_already})"
    echo ""
    
    if [ "${count_extends_already}" -gt 0 ]; then
      echo "| Agent | Catégorie |"
      echo "|-------|-----------|"
      echo "${adaptation_stats}" | grep "extends_already" | sort | while read -r line; do
        agent_path="${line#extends_already|}"
        agent_name=$(basename "${agent_path}" .ts)
        category=$(dirname "${agent_path}" | xargs basename)
        echo "| \`${agent_name}\` | ${category} |"
      done
    else
      echo "*Aucun agent déjà adapté.*"
    fi
    
    echo ""
    echo "### Agents de type classe (${count_is_class})"
    echo ""
    
    if [ "${count_is_class}" -gt 0 ]; then
      echo "| Agent | Catégorie | Template |"
      echo "|-------|-----------|----------|"
      echo "${templates_created}" | grep "|is_class" | sort | while read -r line; do
        template_path="${line%|is_class}"
        agent_name=$(basename "${template_path}" .template.ts)
        category=$(dirname "${template_path}" | xargs basename)
        template_rel="${template_path#${WORKSPACE_ROOT}/}"
        echo "| \`${agent_name}\` | ${category} | [Template](${template_rel}) |"
      done
    else
      echo "*Aucun agent de type classe.*"
    fi
    
    echo ""
    echo "### Agents de type fonction (${count_is_function})"
    echo ""
    
    if [ "${count_is_function}" -gt 0 ]; then
      echo "| Agent | Catégorie | Template |"
      echo "|-------|-----------|----------|"
      echo "${templates_created}" | grep "|is_function" | sort | while read -r line; do
        template_path="${line%|is_function}"
        agent_name=$(basename "${template_path}" .template.ts)
        category=$(dirname "${template_path}" | xargs basename)
        template_rel="${template_path#${WORKSPACE_ROOT}/}"
        echo "| \`${agent_name}\` | ${category} | [Template](${template_rel}) |"
      done
    else
      echo "*Aucun agent de type fonction.*"
    fi
    
    echo ""
    echo "### Agents à adapter manuellement (${count_adaptable})"
    echo ""
    
    if [ "${count_adaptable}" -gt 0 ]; then
      echo "| Agent | Catégorie | Template |"
      echo "|-------|-----------|----------|"
      echo "${templates_created}" | grep "|adaptable" | sort | while read -r line; do
        template_path="${line%|adaptable}"
        agent_name=$(basename "${template_path}" .template.ts)
        category=$(dirname "${template_path}" | xargs basename)
        template_rel="${template_path#${WORKSPACE_ROOT}/}"
        echo "| \`${agent_name}\` | ${category} | [Template](${template_rel}) |"
      done
    else
      echo "*Aucun agent à adapter manuellement.*"
    fi
    
    echo ""
    echo "## Guide d'adaptation"
    echo ""
    echo "### Comment adapter un agent existant"
    echo ""
    echo "1. **Identifiez le type d'agent** - Classe, fonction ou autre"
    echo "2. **Consultez le template généré** - Des templates ont été générés pour la plupart des agents"
    echo "3. **Créez une copie de travail** - Par exemple, nommez-la `agent-name.adapted.ts`"
    echo "4. **Intégrez le code existant** - Adaptez le code existant pour utiliser l'API BaseAgent"
    echo "5. **Testez votre adaptation** - Vérifiez que tout fonctionne comme prévu"
    echo "6. **Remplacez l'agent original** - Une fois que tout fonctionne, remplacez l'agent original"
    echo ""
    echo "### Exemple d'adaptation"
    echo ""
    echo "#### Pour une fonction"
    echo ""
    echo "```typescript"
    echo "// Avant : Une simple fonction exportée"
    echo "export async function analyzeData(data: any, options?: any) {"
    echo "  // Logique existante"
    echo "  return { /* résultat */ };"
    echo "}"
    echo ""
    echo "// Après : Une classe qui étend la classe de base"
    echo "import { BaseAnalysisAgent, AnalysisAgentOptions } from './base-analysis-agent';"
    echo ""
    echo "export interface AnalyzeDataOptions extends AnalysisAgentOptions {"
    echo "  // Options spécifiques"
    echo "}"
    echo ""
    echo "export class AnalyzeDataAgent extends BaseAnalysisAgent<AnalyzeDataOptions> {"
    echo "  constructor(options?: Partial<AnalyzeDataOptions>) {"
    echo "    super(options);"
    echo "  }"
    echo ""
    echo "  protected async run(options: AnalyzeDataOptions) {"
    echo "    this.log('info', 'Analyse des données');"
    echo "    // Appeler la logique originale"
    echo "    const result = await this.analyzeData(options.data);"
    echo "    return result;"
    echo "  }"
    echo ""
    echo "  // Méthode privée contenant la logique originale"
    echo "  private async analyzeData(data: any) {"
    echo "    // Logique existante"
    echo "    return { /* résultat */ };"
    echo "  }"
    echo "}"
    echo ""
    echo "// Conserver l'API publique originale pour une compatibilité ascendante"
    echo "export async function analyzeData(data: any, options?: any) {"
    echo "  const agent = new AnalyzeDataAgent(options);"
    echo "  return agent.execute({ data });"
    echo "}"
    echo "```"
    echo ""
    echo "#### Pour une classe"
    echo ""
    echo "```typescript"
    echo "// Avant : Une classe standard"
    echo "export class DataProcessor {"
    echo "  constructor(private config: any) {}"
    echo ""
    echo "  process(data: any) {"
    echo "    // Logique existante"
    echo "  }"
    echo "}"
    echo ""
    echo "// Après : Une classe qui étend la classe de base"
    echo "import { BaseDataAgent, DataAgentOptions } from './base-data-agent';"
    echo ""
    echo "export interface DataProcessorOptions extends DataAgentOptions {"
    echo "  config: any;"
    echo "}"
    echo ""
    echo "export class DataProcessorAgent extends BaseDataAgent<DataProcessorOptions> {"
    echo "  constructor(options?: Partial<DataProcessorOptions>) {"
    echo "    super(options);"
    echo "  }"
    echo ""
    echo "  protected async run(options: DataProcessorOptions) {"
    echo "    this.log('info', 'Traitement des données');"
    echo "    // Logique existante"
    echo "    return this.process(options.data);"
    echo "  }"
    echo ""
    echo "  private process(data: any) {"
    echo "    // Logique existante"
    echo "    return { /* résultat */ };"
    echo "  }"
    echo "}"
    echo ""
    echo "// Conserver la classe originale pour une compatibilité ascendante"
    echo "export class DataProcessor {"
    echo "  private agent: DataProcessorAgent;"
    echo ""
    echo "  constructor(config: any) {"
    echo "    this.agent = new DataProcessorAgent({ config });"
    echo "  }"
    echo ""
    echo "  process(data: any) {"
    echo "    return this.agent.execute({ data });"
    echo "  }"
    echo "}"
    echo "```"
    echo ""
    echo "## Comment mettre à jour les imports"
    echo ""
    echo "Après avoir adapté les agents, vous devrez mettre à jour les imports dans tout le projet :"
    echo ""
    echo "```typescript"
    echo "// Avant"
    echo "import { analyzeData } from '../agents/analysis/data-analyzer';"
    echo ""
    echo "// Après - Option 1: Utiliser la fonction compatible"
    echo "import { analyzeData } from '../agents/analysis/data-analyzer';"
    echo ""
    echo "// Après - Option 2: Utiliser la classe directement"
    echo "import { AnalyzeDataAgent } from '../agents/analysis/data-analyzer';"
    echo "```"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des agents avant adaptation a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
    
  } > "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport d'adaptation généré: ${REPORT_FILE}${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va adapter les agents pour utiliser la classe de base.${NC}"
  echo -e "${YELLOW}Des templates d'adaptation seront générés pour chaque agent.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les agents
  backup_agents
  
  # Étape 2: Créer les classes de base pour chaque catégorie
  create_category_base_classes
  
  # Étape 3: Analyser et créer des templates pour tous les agents
  log "${YELLOW}Analyse des agents et création des templates d'adaptation...${NC}"
  
  ADAPTATION_STATS=""
  TEMPLATES_CREATED=""
  
  # Pour chaque agent dans chaque catégorie (sauf core/)
  find "${AGENTS_DIR}" -mindepth 2 -type f -name "*.ts" \
    -not -path "${AGENTS_DIR}/core/*" \
    -not -name "index.ts" \
    -not -name "base-*-agent.ts" | while read -r agent_file; do
    
    # Analyser l'agent
    analysis=$(analyze_agent "${agent_file}")
    ADAPTATION_STATS="${ADAPTATION_STATS}${analysis}
"
    
    # Si l'agent n'est pas à ignorer, créer un template
    if [[ "${analysis}" != "ignore"* ]]; then
      template_info=$(create_agent_adapter_template "${agent_file}" "${analysis#*|}")
      TEMPLATES_CREATED="${TEMPLATES_CREATED}${template_info}
"
    fi
  done
  
  # Étape 4: Générer un rapport d'adaptation
  generate_adaptation_report "${TEMPLATES_CREATED}" "${ADAPTATION_STATS}"
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Préparation de l'adaptation des agents terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Templates: ${TEMPLATES_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les classes de base pour chaque catégorie ont été créées."
  echo "Des templates d'adaptation ont été générés pour chaque agent."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
  echo ""
  echo "Prochaines étapes recommandées :"
  echo "1. Consultez le rapport pour identifier les agents à adapter"
  echo "2. Utilisez les templates pour adapter progressivement chaque agent"
  echo "3. Mettez à jour les imports dans le reste du projet"
}

# Exécution du script principal
main