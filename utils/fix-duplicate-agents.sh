#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   DÉTECTION ET RÉSOLUTION DES AGENTS DUPLIQUÉS        ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/duplicates_fix_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/duplicates_fix_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/duplicates_resolution_${TIMESTAMP}.md"

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
  log "${YELLOW}Sauvegarde des agents avant modifications...${NC}"
  
  if [ -d "${AGENTS_DIR}" ]; then
    cp -r "${AGENTS_DIR}" "${BACKUP_DIR}/"
    log "${GREEN}✅ Agents sauvegardés dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé à ${AGENTS_DIR}${NC}"
    exit 1
  fi
}

# Fonction pour trouver les fichiers dupliqués (même nom)
find_duplicate_agents_by_name() {
  log "${YELLOW}Recherche des agents avec des noms identiques...${NC}"
  
  DUPLICATES_BY_NAME="${LOG_DIR}/duplicates_by_name.txt"
  > "${DUPLICATES_BY_NAME}"
  
  # Trouver tous les noms de fichiers .ts
  find "${AGENTS_DIR}" -type f -name "*.ts" -exec basename {} \; | sort | uniq -d > "${LOG_DIR}/duplicate_names.txt"
  
  # Pour chaque nom dupliqué, trouver les chemins complets
  while read -r filename; do
    echo "=== ${filename} ===" >> "${DUPLICATES_BY_NAME}"
    find "${AGENTS_DIR}" -type f -name "${filename}" >> "${DUPLICATES_BY_NAME}"
    echo "" >> "${DUPLICATES_BY_NAME}"
  done < "${LOG_DIR}/duplicate_names.txt"
  
  DUPLICATE_COUNT=$(wc -l < "${LOG_DIR}/duplicate_names.txt")
  log "${GREEN}✅ Trouvé ${DUPLICATE_COUNT} noms d'agents dupliqués${NC}"
  
  echo "${DUPLICATES_BY_NAME}"
}

# Fonction pour trouver les fichiers dupliqués (contenu identique ou similaire)
find_duplicate_agents_by_content() {
  log "${YELLOW}Recherche des agents avec un contenu similaire...${NC}"
  
  DUPLICATES_BY_CONTENT="${LOG_DIR}/duplicates_by_content.txt"
  > "${DUPLICATES_BY_CONTENT}"
  
  # Pour chaque fichier .ts
  find "${AGENTS_DIR}" -type f -name "*.ts" | sort > "${LOG_DIR}/all_agents.txt"
  
  TOTAL_AGENTS=$(wc -l < "${LOG_DIR}/all_agents.txt")
  log "Analyse de ${TOTAL_AGENTS} agents pour trouver des contenus similaires..."
  
  # Comparer chaque paire de fichiers (méthode naïve mais fonctionnelle)
  DUPLICATE_PAIRS=0
  
  while read -r file1; do
    basename1=$(basename "${file1}")
    
    while read -r file2; do
      # Ne pas comparer un fichier avec lui-même
      if [[ "${file1}" == "${file2}" ]]; then
        continue
      fi
      
      basename2=$(basename "${file2}")
      
      # Si les noms sont différents mais que les fichiers sont identiques
      if diff -q "${file1}" "${file2}" >/dev/null; then
        echo "=== Contenu 100% identique ===" >> "${DUPLICATES_BY_CONTENT}"
        echo "Fichier 1: ${file1}" >> "${DUPLICATES_BY_CONTENT}"
        echo "Fichier 2: ${file2}" >> "${DUPLICATES_BY_CONTENT}"
        echo "" >> "${DUPLICATES_BY_CONTENT}"
        DUPLICATE_PAIRS=$((DUPLICATE_PAIRS + 1))
      else
        # Si les fichiers ne sont pas identiques, vérifier s'ils sont similaires
        # Calculer la similarité en utilisant le nombre de lignes communes
        similarity=$(comm -12 <(sort "${file1}") <(sort "${file2}") | wc -l)
        
        # Obtenir le nombre total de lignes des deux fichiers
        lines1=$(wc -l < "${file1}")
        lines2=$(wc -l < "${file2}")
        
        # Si la similarité est élevée (> 70% des lignes sont identiques)
        similarity_threshold=$((($lines1 + $lines2) * 70 / 200))
        if [[ ${similarity} -gt ${similarity_threshold} ]]; then
          percentage=$((${similarity} * 200 / ($lines1 + $lines2)))
          echo "=== Contenu ${percentage}% similaire ===" >> "${DUPLICATES_BY_CONTENT}"
          echo "Fichier 1: ${file1} (${lines1} lignes)" >> "${DUPLICATES_BY_CONTENT}"
          echo "Fichier 2: ${file2} (${lines2} lignes)" >> "${DUPLICATES_BY_CONTENT}"
          echo "" >> "${DUPLICATES_BY_CONTENT}"
          DUPLICATE_PAIRS=$((DUPLICATE_PAIRS + 1))
        fi
      fi
    done < "${LOG_DIR}/all_agents.txt"
  done < "${LOG_DIR}/all_agents.txt"
  
  log "${GREEN}✅ Trouvé ${DUPLICATE_PAIRS} paires d'agents avec contenu similaire${NC}"
  
  echo "${DUPLICATES_BY_CONTENT}"
}

# Fonction pour sélectionner les agents principaux et les doublons à fusionner
select_master_agents() {
  log "${YELLOW}Sélection des agents principaux pour chaque groupe de doublons...${NC}"
  
  DUPLICATES_BY_NAME="$1"
  MASTER_AGENTS="${LOG_DIR}/master_agents.txt"
  DUPLICATE_AGENTS="${LOG_DIR}/duplicate_agents.txt"
  
  > "${MASTER_AGENTS}"
  > "${DUPLICATE_AGENTS}"
  
  # Pour chaque groupe de doublons par nom
  current_group=""
  first_file=""
  
  while read -r line; do
    # Si c'est un en-tête de groupe
    if [[ "${line}" == "==="* ]]; then
      current_group="${line#=== }"
      current_group="${current_group% ===}"
      first_file=""
    # Si c'est un chemin de fichier
    elif [[ -f "${line}" ]]; then
      # Si c'est le premier fichier du groupe
      if [[ -z "${first_file}" ]]; then
        first_file="${line}"
        # Sélectionner le fichier du dossier le plus spécifique comme maître (ex: analysis/ plutôt que /)
        echo "${current_group}|${line}" >> "${MASTER_AGENTS}"
      else
        # Les autres fichiers sont considérés comme doublons
        echo "${current_group}|${line}" >> "${DUPLICATE_AGENTS}"
      fi
    fi
  done < "${DUPLICATES_BY_NAME}"
  
  MASTER_COUNT=$(wc -l < "${MASTER_AGENTS}")
  DUPLICATE_COUNT=$(wc -l < "${DUPLICATE_AGENTS}")
  
  log "${GREEN}✅ Sélectionné ${MASTER_COUNT} agents principaux et ${DUPLICATE_COUNT} doublons à fusionner${NC}"
  
  echo "${MASTER_AGENTS}|${DUPLICATE_AGENTS}"
}

# Fonction pour fusionner les fichiers dupliqués
merge_duplicate_agents() {
  log "${YELLOW}Fusion des agents dupliqués...${NC}"
  
  IFS="|" read -r MASTER_AGENTS DUPLICATE_AGENTS <<< "$1"
  MERGED_AGENTS="${LOG_DIR}/merged_agents.txt"
  
  > "${MERGED_AGENTS}"
  
  # Pour chaque fichier dupliqué
  while read -r line; do
    IFS='|' read -r agent_name duplicate_path <<< "${line}"
    
    # Trouver le fichier maître correspondant
    master_path=$(grep "^${agent_name}|" "${MASTER_AGENTS}" | cut -d'|' -f2)
    
    if [[ -n "${master_path}" && -f "${duplicate_path}" && -f "${master_path}" ]]; then
      log "Fusion de ${duplicate_path#${WORKSPACE_ROOT}/} vers ${master_path#${WORKSPACE_ROOT}/}..."
      
      # Si les fichiers sont identiques, supprimer simplement le doublon
      if diff -q "${master_path}" "${duplicate_path}" >/dev/null; then
        log "  Les fichiers sont identiques, suppression du doublon."
        rm "${duplicate_path}"
        echo "${agent_name}|${duplicate_path}|${master_path}|identical|deleted" >> "${MERGED_AGENTS}"
      else
        # Si les fichiers sont différents, fusionner le contenu 
        log "  Les fichiers sont différents, fusion du contenu."
        
        # Créer un fichier temporaire pour la fusion
        merged_file="${LOG_DIR}/merged_${agent_name}"
        
        # En-tête du fichier fusionné
        echo "// Fichier fusionné automatiquement" > "${merged_file}"
        echo "// Source 1: ${master_path#${WORKSPACE_ROOT}/}" >> "${merged_file}"
        echo "// Source 2: ${duplicate_path#${WORKSPACE_ROOT}/}" >> "${merged_file}"
        echo "" >> "${merged_file}"
        
        # Ajouter le contenu du fichier maître
        cat "${master_path}" >> "${merged_file}"
        
        # Ajouter le contenu du fichier dupliqué en commentaire
        echo "" >> "${merged_file}"
        echo "// ====== CONTENU FUSIONNÉ DEPUIS ${duplicate_path#${WORKSPACE_ROOT}/} ======" >> "${merged_file}"
        echo "// Décommentez et adaptez ce code si nécessaire" >> "${merged_file}"
        echo "" >> "${merged_file}"
        
        # Ajouter chaque ligne du fichier dupliqué en commentaire
        while read -r content_line; do
          echo "// ${content_line}" >> "${merged_file}"
        done < "${duplicate_path}"
        
        # Remplacer le fichier maître par la version fusionnée
        cp "${merged_file}" "${master_path}"
        
        # Supprimer le fichier dupliqué
        rm "${duplicate_path}"
        
        echo "${agent_name}|${duplicate_path}|${master_path}|merged|deleted" >> "${MERGED_AGENTS}"
      fi
    else
      log "${RED}⚠️ Impossible de fusionner ${duplicate_path} - fichier maître non trouvé${NC}"
    fi
  done < "${DUPLICATE_AGENTS}"
  
  MERGED_COUNT=$(wc -l < "${MERGED_AGENTS}")
  log "${GREEN}✅ ${MERGED_COUNT} agents dupliqués ont été fusionnés${NC}"
  
  echo "${MERGED_AGENTS}"
}

# Fonction pour générer le rapport de résolution
generate_resolution_report() {
  log "${YELLOW}Génération du rapport de résolution...${NC}"
  
  MERGED_AGENTS="$1"
  DUPLICATES_BY_CONTENT="$2"
  
  {
    echo "# Rapport de résolution des agents dupliqués"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Actions effectuées"
    echo ""
    echo "### Agents fusionnés"
    echo ""
    echo "| Nom de l'agent | Fichier dupliqué | Fusionné vers | Action |"
    echo "|----------------|------------------|--------------|--------|"
    
    while read -r line; do
      if [[ -n "${line}" ]]; then
        IFS='|' read -r agent_name duplicate_path master_path merge_type action <<< "${line}"
        duplicate_rel="${duplicate_path#${WORKSPACE_ROOT}/}"
        master_rel="${master_path#${WORKSPACE_ROOT}/}"
        echo "| \`${agent_name}\` | \`${duplicate_rel}\` | \`${master_rel}\` | ${action} (${merge_type}) |"
      fi
    done < "${MERGED_AGENTS}"
    
    echo ""
    echo "### Agents similaires (nécessitant revue manuelle)"
    echo ""
    echo "Les paires d'agents suivantes ont un contenu similaire mais des noms différents. Une revue manuelle est recommandée."
    echo ""
    echo "<details>"
    echo "<summary>Afficher les agents similaires</summary>"
    echo ""
    
    # Extraire uniquement les paires avec un contenu similaire (pas identique)
    grep -A 3 "=== Contenu [0-9]*% similaire ===" "${DUPLICATES_BY_CONTENT}" | grep -v "^--$" > "${LOG_DIR}/similar_content.txt"
    
    if [[ -s "${LOG_DIR}/similar_content.txt" ]]; then
      current_header=""
      while read -r line; do
        if [[ "${line}" == "==="* ]]; then
          current_header="${line}"
          echo -e "\n**${current_header}**\n"
        elif [[ "${line}" == "Fichier 1:"* ]]; then
          file1="${line#Fichier 1: }"
          file1_rel="${file1%% *}"
          file1_rel="${file1_rel#${WORKSPACE_ROOT}/}"
          echo "- \`${file1_rel}\`"
        elif [[ "${line}" == "Fichier 2:"* ]]; then
          file2="${line#Fichier 2: }"
          file2_rel="${file2%% *}"
          file2_rel="${file2_rel#${WORKSPACE_ROOT}/}"
          echo "- \`${file2_rel}\`"
          echo ""
          echo "```diff"
          diff -u "${file1%% *}" "${file2%% *}" | head -n 20 | sed 's/^/  /'
          echo "..."
          echo "```"
        fi
      done < "${LOG_DIR}/similar_content.txt"
    else
      echo "*Aucun agent avec contenu similaire trouvé.*"
    fi
    
    echo "</details>"
    
    echo ""
    echo "## Recommandations"
    echo ""
    echo "1. **Vérifiez les fichiers fusionnés** - Assurez-vous que la fusion automatique n'a pas causé de problèmes"
    echo "2. **Examinez les agents similaires** - Les agents avec un contenu similaire mais des noms différents peuvent nécessiter une consolidation manuelle"
    echo "3. **Mettez à jour les imports** - Si des agents ont été déplacés, assurez-vous de mettre à jour les imports"
    echo ""
    echo "## Prochaines étapes"
    echo ""
    echo "1. Créer une structure de base commune dans `agents/core/`"
    echo "2. Regrouper les agents par catégorie fonctionnelle"
    echo "3. Créer des classes de base pour chaque catégorie"
    echo "4. Standardiser les interfaces des agents"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des agents avant fusion a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
  } > "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport de résolution généré: ${REPORT_FILE}${NC}"
}

# Fonction pour créer la structure de base
create_core_structure() {
  log "${YELLOW}Création de la structure de base pour les agents...${NC}"
  
  # Créer le dossier core s'il n'existe pas
  if [[ ! -d "${AGENTS_DIR}/core" ]]; then
    mkdir -p "${AGENTS_DIR}/core"
    log "Dossier agents/core créé"
  else
    log "Dossier agents/core existe déjà"
  fi
  
  # Créer le fichier types.ts
  CORE_TYPES="${AGENTS_DIR}/core/types.ts"
  if [[ ! -f "${CORE_TYPES}" ]]; then
    {
      echo "/**"
      echo " * Types de base pour les agents"
      echo " * Ce fichier définit les interfaces communes utilisées par tous les agents"
      echo " */"
      echo ""
      echo "export interface AgentOptions {"
      echo "  debug?: boolean;"
      echo "  timeout?: number;"
      echo "  retries?: number;"
      echo "  [key: string]: any;"
      echo "}"
      echo ""
      echo "export interface AgentResult<T = any> {"
      echo "  success: boolean;"
      echo "  data?: T;"
      echo "  error?: Error | string;"
      echo "  timestamp: number;"
      echo "  duration?: number;"
      echo "}"
      echo ""
      echo "export enum AgentStatus {"
      echo "  IDLE = 'idle',"
      echo "  RUNNING = 'running',"
      echo "  COMPLETED = 'completed',"
      echo "  FAILED = 'failed'"
      echo "}"
      echo ""
      echo "export interface LogEntry {"
      echo "  timestamp: number;"
      echo "  level: 'info' | 'warn' | 'error' | 'debug';"
      echo "  message: string;"
      echo "  data?: any;"
      echo "}"
      echo ""
      echo "export type AgentEventListener = (event: string, data?: any) => void;"
    } > "${CORE_TYPES}"
    log "Fichier types.ts créé"
  else
    log "Fichier types.ts existe déjà"
  fi
  
  # Créer le fichier base-agent.ts
  BASE_AGENT="${AGENTS_DIR}/core/base-agent.ts"
  if [[ ! -f "${BASE_AGENT}" ]]; then
    {
      echo "/**"
      echo " * Agent de base"
      echo " * Classe abstraite fournissant les fonctionnalités communes à tous les agents"
      echo " */"
      echo ""
      echo "import { AgentOptions, AgentResult, AgentStatus, LogEntry, AgentEventListener } from './types';"
      echo ""
      echo "export abstract class BaseAgent<TOptions extends AgentOptions = AgentOptions, TResult = any> {"
      echo "  protected options: TOptions;"
      echo "  protected status: AgentStatus = AgentStatus.IDLE;"
      echo "  protected logs: LogEntry[] = [];"
      echo "  protected listeners: Map<string, AgentEventListener[]> = new Map();"
      echo "  protected startTime: number = 0;"
      echo ""
      echo "  constructor(options?: Partial<TOptions>) {"
      echo "    this.options = {"
      echo "      debug: false,"
      echo "      timeout: 30000,"
      echo "      retries: 3,"
      echo "      ...options,"
      echo "    } as TOptions;"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Exécute l'agent avec les options spécifiées"
      echo "   * @param additionalOptions Options supplémentaires pour cette exécution"
      echo "   * @returns Résultat de l'exécution"
      echo "   */"
      echo "  async execute(additionalOptions?: Partial<TOptions>): Promise<AgentResult<TResult>> {"
      echo "    try {"
      echo "      this.startTime = Date.now();"
      echo "      this.status = AgentStatus.RUNNING;"
      echo "      this.emit('start', { options: this.options });"
      echo ""
      echo "      const mergedOptions = { ...this.options, ...additionalOptions } as TOptions;"
      echo "      const result = await this.run(mergedOptions);"
      echo ""
      echo "      this.status = AgentStatus.COMPLETED;"
      echo "      const duration = Date.now() - this.startTime;"
      echo "      this.emit('complete', { result, duration });"
      echo ""
      echo "      return {"
      echo "        success: true,"
      echo "        data: result,"
      echo "        timestamp: Date.now(),"
      echo "        duration,"
      echo "      };"
      echo "    } catch (error) {"
      echo "      this.status = AgentStatus.FAILED;"
      echo "      const duration = Date.now() - this.startTime;"
      echo "      this.log('error', error instanceof Error ? error.message : String(error));"
      echo "      this.emit('error', { error, duration });"
      echo ""
      echo "      return {"
      echo "        success: false,"
      echo "        error: error instanceof Error ? error : String(error),"
      echo "        timestamp: Date.now(),"
      echo "        duration,"
      echo "      };"
      echo "    }"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Méthode abstraite à implémenter par les classes dérivées"
      echo "   * @param options Options d'exécution"
      echo "   */"
      echo "  protected abstract run(options: TOptions): Promise<TResult>;"
      echo ""
      echo "  /**"
      echo "   * Ajoute une entrée de journal"
      echo "   * @param level Niveau de log"
      echo "   * @param message Message à journaliser"
      echo "   * @param data Données optionnelles"
      echo "   */"
      echo "  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {"
      echo "    if (level === 'debug' && !this.options.debug) return;"
      echo ""
      echo "    const entry: LogEntry = {"
      echo "      timestamp: Date.now(),"
      echo "      level,"
      echo "      message,"
      echo "      data,"
      echo "    };"
      echo ""
      echo "    this.logs.push(entry);"
      echo "    this.emit('log', entry);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Renvoie tous les logs de l'agent"
      echo "   */"
      echo "  getLogs(): LogEntry[] {"
      echo "    return [...this.logs];"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Renvoie le statut actuel de l'agent"
      echo "   */"
      echo "  getStatus(): AgentStatus {"
      echo "    return this.status;"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Ajoute un écouteur d'événement"
      echo "   * @param event Nom de l'événement"
      echo "   * @param listener Fonction de rappel"
      echo "   */"
      echo "  on(event: string, listener: AgentEventListener): void {"
      echo "    if (!this.listeners.has(event)) {"
      echo "      this.listeners.set(event, []);"
      echo "    }"
      echo "    this.listeners.get(event)!.push(listener);"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Retire un écouteur d'événement"
      echo "   * @param event Nom de l'événement"
      echo "   * @param listener Fonction de rappel à retirer"
      echo "   */"
      echo "  off(event: string, listener: AgentEventListener): void {"
      echo "    if (!this.listeners.has(event)) return;"
      echo ""
      echo "    const listeners = this.listeners.get(event)!;"
      echo "    this.listeners.set("
      echo "      event,"
      echo "      listeners.filter((l) => l !== listener)"
      echo "    );"
      echo "  }"
      echo ""
      echo "  /**"
      echo "   * Émet un événement"
      echo "   * @param event Nom de l'événement"
      echo "   * @param data Données associées à l'événement"
      echo "   */"
      echo "  protected emit(event: string, data?: any): void {"
      echo "    if (!this.listeners.has(event)) return;"
      echo ""
      echo "    for (const listener of this.listeners.get(event)!) {"
      echo "      try {"
      echo "        listener(event, data);"
      echo "      } catch (error) {"
      echo "        console.error(`Error in event listener for ${event}:`, error);"
      echo "      }"
      echo "    }"
      echo "  }"
      echo "}"
    } > "${BASE_AGENT}"
    log "Fichier base-agent.ts créé"
  else
    log "Fichier base-agent.ts existe déjà"
  fi
  
  # Créer le fichier utils.ts
  CORE_UTILS="${AGENTS_DIR}/core/utils.ts"
  if [[ ! -f "${CORE_UTILS}" ]]; then
    {
      echo "/**"
      echo " * Utilitaires pour les agents"
      echo " * Fonctions communes utilisées par tous les agents"
      echo " */"
      echo ""
      echo "import { AgentResult } from './types';"
      echo ""
      echo "/**"
      echo " * Mesure le temps d'exécution d'une fonction"
      echo " * @param fn Fonction à mesurer"
      echo " * @returns Résultat et durée d'exécution"
      echo " */"
      echo "export async function measureExecutionTime<T>("
      echo "  fn: () => Promise<T>"
      echo "): Promise<{ result: T; duration: number }> {"
      echo "  const startTime = Date.now();"
      echo "  const result = await fn();"
      echo "  const duration = Date.now() - startTime;"
      echo "  return { result, duration };"
      echo "}"
      echo ""
      echo "/**"
      echo " * Exécute une fonction avec un nombre de tentatives maximum"
      echo " * @param fn Fonction à exécuter"
      echo " * @param retries Nombre de tentatives"
      echo " * @param delay Délai entre les tentatives (en ms)"
      echo " * @returns Résultat de la fonction"
      echo " */"
      echo "export async function withRetry<T>("
      echo "  fn: () => Promise<T>,"
      echo "  retries: number = 3,"
      echo "  delay: number = 1000"
      echo "): Promise<T> {"
      echo "  try {"
      echo "    return await fn();"
      echo "  } catch (error) {"
      echo "    if (retries <= 0) {"
      echo "      throw error;"
      echo "    }"
      echo ""
      echo "    await new Promise((resolve) => setTimeout(resolve, delay));"
      echo "    return withRetry(fn, retries - 1, delay * 2);"
      echo "  }"
      echo "}"
      echo ""
      echo "/**"
      echo " * Crée un résultat d'agent réussi"
      echo " * @param data Données du résultat"
      echo " * @param duration Durée d'exécution"
      echo " * @returns Résultat d'agent"
      echo " */"
      echo "export function createSuccessResult<T>("
      echo "  data: T,"
      echo "  duration?: number"
      echo "): AgentResult<T> {"
      echo "  return {"
      echo "    success: true,"
      echo "    data,"
      echo "    timestamp: Date.now(),"
      echo "    duration,"
      echo "  };"
      echo "}"
      echo ""
      echo "/**"
      echo " * Crée un résultat d'agent en échec"
      echo " * @param error Erreur"
      echo " * @param duration Durée d'exécution"
      echo " * @returns Résultat d'agent"
      echo " */"
      echo "export function createErrorResult("
      echo "  error: Error | string,"
      echo "  duration?: number"
      echo "): AgentResult<never> {"
      echo "  return {"
      echo "    success: false,"
      echo "    error,"
      echo "    timestamp: Date.now(),"
      echo "    duration,"
      echo "  };"
      echo "}"
      echo ""
      echo "/**"
      echo " * Transforme une fonction standard en une fonction compatible avec l'API des agents"
      echo " * @param fn Fonction à transformer"
      echo " * @returns Fonction compatible avec l'API des agents"
      echo " */"
      echo "export function toAgentFunction<TParams extends any[], TResult>("
      echo "  fn: (...args: TParams) => Promise<TResult>"
      echo "): (...args: TParams) => Promise<AgentResult<TResult>> {"
      echo "  return async (...args: TParams): Promise<AgentResult<TResult>> => {"
      echo "    try {"
      echo "      const { result, duration } = await measureExecutionTime(() =>"
      echo "        fn(...args)"
      echo "      );"
      echo "      return createSuccessResult(result, duration);"
      echo "    } catch (error) {"
      echo "      return createErrorResult(error instanceof Error ? error : String(error));"
      echo "    }"
      echo "  };"
      echo "}"
    } > "${CORE_UTILS}"
    log "Fichier utils.ts créé"
  else
    log "Fichier utils.ts existe déjà"
  fi
  
  # Créer le fichier index.ts
  CORE_INDEX="${AGENTS_DIR}/core/index.ts"
  if [[ ! -f "${CORE_INDEX}" ]]; then
    {
      echo "/**"
      echo " * Point d'entrée pour les fonctionnalités de base des agents"
      echo " */"
      echo ""
      echo "export * from './types';"
      echo "export * from './base-agent';"
      echo "export * from './utils';"
    } > "${CORE_INDEX}"
    log "Fichier index.ts créé"
  else
    log "Fichier index.ts existe déjà"
  fi
  
  log "${GREEN}✅ Structure de base créée${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va détecter et résoudre les agents dupliqués dans le projet.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les agents
  backup_agents
  
  # Étape 2: Trouver les doublons par nom
  duplicates_by_name=$(find_duplicate_agents_by_name)
  
  # Étape 3: Trouver les doublons par contenu
  duplicates_by_content=$(find_duplicate_agents_by_content)
  
  # Étape 4: Sélectionner les agents principaux
  master_duplicate_agents=$(select_master_agents "${duplicates_by_name}")
  
  # Étape 5: Fusionner les doublons
  merged_agents=$(merge_duplicate_agents "${master_duplicate_agents}")
  
  # Étape 6: Générer le rapport de résolution
  generate_resolution_report "${merged_agents}" "${duplicates_by_content}"
  
  # Étape 7: Créer la structure de base
  create_core_structure
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Résolution des agents dupliqués terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les agents dupliqués ont été fusionnés."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
  echo ""
  echo "La structure de base pour la consolidation des agents a été créée dans agents/core/"
  echo "  - types.ts: Types communs pour tous les agents"
  echo "  - base-agent.ts: Classe de base pour tous les agents"
  echo "  - utils.ts: Fonctions utilitaires pour les agents"
}

# Exécution du script principal
main