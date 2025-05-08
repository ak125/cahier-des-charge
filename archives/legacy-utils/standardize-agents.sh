#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   STANDARDISATION DES AGENTS ET MISE À JOUR DES IMPORTS${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/agents_standardization_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/standardization_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/standardization_${TIMESTAMP}.md"
IMPORTS_FILE="${LOG_DIR}/updated_imports.txt"
AGENTS_FILE="${LOG_DIR}/standardized_agents.txt"

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${WORKSPACE_ROOT}/reports"

# Initialisation des fichiers de log
touch "${LOG_FILE}"
> "${IMPORTS_FILE}"
> "${AGENTS_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour créer une sauvegarde des agents
backup_agents() {
  log "${YELLOW}Sauvegarde des agents avant standardisation...${NC}"
  
  if [ -d "${AGENTS_DIR}" ]; then
    cp -r "${AGENTS_DIR}" "${BACKUP_DIR}/"
    log "${GREEN}✅ Agents sauvegardés dans ${BACKUP_DIR}/agents${NC}"
  else
    log "${RED}❌ Dossier agents non trouvé à ${AGENTS_DIR}${NC}"
    exit 1
  fi
}

# Fonction pour créer les interfaces de base spécifiques à chaque catégorie
create_category_interfaces() {
  log "${YELLOW}Création des interfaces spécifiques à chaque catégorie...${NC}"
  
  # Liste des catégories avec des agents
  ACTIVE_CATEGORIES=$(find "${AGENTS_DIR}" -mindepth 1 -maxdepth 1 -type d -not -path "*/core" | xargs -n1 basename)
  
  for category in ${ACTIVE_CATEGORIES}; do
    # Skip if the category is empty or doesn't exist
    if [ ! -d "${AGENTS_DIR}/${category}" ] || [ -z "$(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -name "index.ts" | head -1)" ]; then
      continue
    fi
    
    # Convert category name to camel case for the interface name
    category_upper=$(echo "${category:0:1}" | tr '[:lower:]' '[:upper:]')${category:1}
    
    # Create the types file for the category
    CATEGORY_TYPES="${AGENTS_DIR}/${category}/types.ts"
    
    if [ ! -f "${CATEGORY_TYPES}" ]; then
      {
        echo "/**"
        echo " * Types spécifiques aux agents de la catégorie ${category}"
        echo " * Ce fichier étend les types de base pour les spécialiser"
        echo " */"
        echo ""
        echo "import { AgentOptions, AgentResult } from '../core/types';"
        echo ""
        echo "/**"
        echo " * Options spécifiques aux agents ${category}"
        echo " */"
        echo "export interface ${category_upper}AgentOptions extends AgentOptions {"
        echo "  // Options spécifiques à cette catégorie"
        echo "}"
        echo ""
        echo "/**"
        echo " * Résultat spécifique aux agents ${category}"
        echo " */"
        echo "export interface ${category_upper}Result extends AgentResult {"
        echo "  // Données spécifiques à cette catégorie"
        echo "}"
      } > "${CATEGORY_TYPES}"
      
      log "Créé types.ts pour la catégorie ${category}"
    else
      log "Le fichier types.ts existe déjà pour ${category}"
    fi
    
    # Create the base agent for the category
    CATEGORY_BASE="${AGENTS_DIR}/${category}/base-${category}-agent.ts"
    
    if [ ! -f "${CATEGORY_BASE}" ]; then
      {
        echo "/**"
        echo " * Agent de base pour la catégorie ${category}"
        echo " * Étend l'agent de base avec des fonctionnalités spécifiques à cette catégorie"
        echo " */"
        echo ""
        echo "import { BaseAgent } from '../core/base-agent';"
        echo "import { ${category_upper}AgentOptions, ${category_upper}Result } from './types';"
        echo ""
        echo "/**"
        echo " * Classe de base pour tous les agents ${category}"
        echo " */"
        echo "export abstract class Base${category_upper}Agent<"
        echo "  TOptions extends ${category_upper}AgentOptions = ${category_upper}AgentOptions,"
        echo "  TResult = any"
        echo "> extends BaseAgent<TOptions, TResult> {"
        echo "  constructor(options?: Partial<TOptions>) {"
        echo "    super(options);"
        echo "  }"
        echo ""
        echo "  /**"
        echo "   * Fonctions utilitaires spécifiques à la catégorie ${category}"
        echo "   */"
        
        # Add category-specific utility methods based on the category
        case "${category}" in
          analysis)
            echo ""
            echo "  /**"
            echo "   * Analyser un contenu et retourner les résultats"
            echo "   */"
            echo "  protected async analyzeContent(content: string): Promise<any> {"
            echo "    this.log('info', 'Analyse du contenu (' + content.length + ' caractères)');"
            echo "    // Logique d'analyse à implémenter"
            echo "    return { analyzed: true };"
            echo "  }"
            ;;
          monitoring)
            echo ""
            echo "  /**"
            echo "   * Vérifier l'état d'une ressource"
            echo "   */"
            echo "  protected async checkStatus(resourceId: string): Promise<boolean> {"
            echo "    this.log('info', 'Vérification du statut de ' + resourceId);"
            echo "    // Logique de vérification à implémenter"
            echo "    return true;"
            echo "  }"
            ;;
          migration)
            echo ""
            echo "  /**"
            echo "   * Migrer des données d'un format à un autre"
            echo "   */"
            echo "  protected async migrateData<T, U>(source: T, transformer: (data: T) => U): Promise<U> {"
            echo "    this.log('info', 'Début de la migration des données');"
            echo "    // Logique de migration à implémenter"
            echo "    return transformer(source);"
            echo "  }"
            ;;
          seo)
            echo ""
            echo "  /**"
            echo "   * Optimiser le contenu pour le référencement"
            echo "   */"
            echo "  protected optimizeContent(content: string, keywords: string[]): string {"
            echo "    this.log('info', 'Optimisation du contenu avec ' + keywords.length + ' mots-clés');"
            echo "    // Logique d'optimisation à implémenter"
            echo "    return content;"
            echo "  }"
            ;;
          audit)
            echo ""
            echo "  /**"
            echo "   * Auditer une ressource et retourner les problèmes détectés"
            echo "   */"
            echo "  protected async auditResource(resourcePath: string): Promise<string[]> {"
            echo "    this.log('info', 'Audit de la ressource ' + resourcePath);"
            echo "    // Logique d'audit à implémenter"
            echo "    return [];"
            echo "  }"
            ;;
          *)
            # Default utility method for other categories
            echo ""
            echo "  /**"
            echo "   * Méthode utilitaire spécifique à cette catégorie"
            echo "   */"
            echo "  protected async process${category_upper}Task(): Promise<void> {"
            echo "    this.log('info', 'Traitement de tâche spécifique');"
            echo "    // Logique spécifique à implémenter"
            echo "  }"
            ;;
        esac
        
        echo "}"
      } > "${CATEGORY_BASE}"
      
      log "Créé base-${category}-agent.ts pour la catégorie ${category}"
    else
      log "Le fichier base-${category}-agent.ts existe déjà pour ${category}"
    fi
    
    # Update the category index.ts to export the new files
    CATEGORY_INDEX="${AGENTS_DIR}/${category}/index.ts"
    
    # Check if the exports already exist
    if ! grep -q "export .* from './types';" "${CATEGORY_INDEX}" 2>/dev/null; then
      echo "export * from './types';" >> "${CATEGORY_INDEX}"
    fi
    
    if ! grep -q "export .* from './base-${category}-agent';" "${CATEGORY_INDEX}" 2>/dev/null; then
      echo "export * from './base-${category}-agent';" >> "${CATEGORY_INDEX}"
    fi
    
    log "Mis à jour index.ts pour la catégorie ${category}"
  done
  
  log "${GREEN}✅ Interfaces des catégories créées${NC}"
}

# Fonction pour mettre à jour les imports dans les fichiers
update_imports() {
  log "${YELLOW}Mise à jour des imports entre les fichiers...${NC}"
  
  # Pour chaque fichier TypeScript dans le dossier agents
  find "${AGENTS_DIR}" -type f -name "*.ts" | while read -r file_path; do
    file_dir=$(dirname "${file_path}")
    file_name=$(basename "${file_path}")
    category=$(basename "${file_dir}")
    
    # Ignorer les fichiers index.ts, types.ts et base-*-agent.ts
    if [[ "${file_name}" == "index.ts" || "${file_name}" == "types.ts" || "${file_name}" == base-*-agent.ts ]]; then
      continue
    fi
    
    log "Mise à jour des imports dans ${file_path#${WORKSPACE_ROOT}/}..."
    
    # Chercher les imports internes
    internal_imports=$(grep -E "^import .* from '(\./|\.\./|agents/)" "${file_path}" || echo "")
    
    if [ -n "${internal_imports}" ]; then
      # Créer un fichier temporaire pour les modifications
      temp_file="${LOG_DIR}/temp_$(basename "${file_path}")"
      cp "${file_path}" "${temp_file}"
      
      # Mettre à jour chaque import
      echo "${internal_imports}" | while read -r import_line; do
        # Extraire le chemin d'import
        import_path=$(echo "${import_line}" | sed -E "s/^import .* from ['\"]([^'\"]*)['\"].*/\1/")
        
        # Si c'est un chemin relatif, essayer de le résoudre
        if [[ "${import_path}" == "./"* || "${import_path}" == "../"* ]]; then
          # Calculer le chemin absolu de l'import
          if [[ "${import_path}" == "./"* ]]; then
            abs_import_path="${file_dir}/${import_path#./}"
          elif [[ "${import_path}" == "../"* ]]; then
            abs_import_path="$(realpath --relative-to="${WORKSPACE_ROOT}" "${file_dir}/${import_path}")"
          fi
          
          # Si le fichier n'existe pas à cet emplacement, chercher ailleurs
          if [ ! -f "${WORKSPACE_ROOT}/${abs_import_path}" ] && [ ! -d "${WORKSPACE_ROOT}/${abs_import_path}" ]; then
            # Nom de base du fichier/module importé
            import_basename=$(basename "${import_path}")
            
            # Chercher le fichier dans tous les dossiers d'agents
            potential_matches=$(find "${AGENTS_DIR}" -type f -name "${import_basename}.ts" -o -type d -name "${import_basename}")
            
            if [ -n "${potential_matches}" ]; then
              # Prendre le premier match
              new_path=$(echo "${potential_matches}" | head -1)
              new_rel_path=$(realpath --relative-to="${file_dir}" "${new_path}")
              
              # Si le chemin relatif ne commence pas par ./ ou ../, ajouter ./
              if [[ ! "${new_rel_path}" == "./"* && ! "${new_rel_path}" == "../"* ]]; then
                new_rel_path="./${new_rel_path}"
              fi
              
              # Remplacer l'ancien import par le nouveau
              sed -i "s|from '${import_path}'|from '${new_rel_path}'|g" "${temp_file}"
              
              log "  Remplacé import '${import_path}' par '${new_rel_path}'"
              echo "${file_path}|${import_path}|${new_rel_path}" >> "${IMPORTS_FILE}"
            fi
          fi
        fi
      done
      
      # Appliquer les modifications
      mv "${temp_file}" "${file_path}"
    fi
  done
  
  UPDATED_COUNT=$(wc -l < "${IMPORTS_FILE}")
  log "${GREEN}✅ ${UPDATED_COUNT} imports mis à jour${NC}"
}

# Fonction pour standardiser les agents en utilisant BaseAgent
standardize_agents() {
  log "${YELLOW}Standardisation des agents en utilisant BaseAgent...${NC}"
  
  # Pour chaque fichier TypeScript dans le dossier agents (sauf dans core et les index.ts/types.ts)
  find "${AGENTS_DIR}" -type f -name "*.ts" -not -path "*/core/*" -not -name "index.ts" -not -name "types.ts" -not -name "base-*-agent.ts" | while read -r agent_file; do
    agent_name=$(basename "${agent_file}")
    agent_dir=$(dirname "${agent_file}")
    category=$(basename "${agent_dir}")
    
    log "Standardisation de l'agent ${agent_name} dans la catégorie ${category}..."
    
    # Vérifier si l'agent utilise déjà BaseAgent ou une classe de base spécifique à la catégorie
    if grep -q "extends \(BaseAgent\|Base.*Agent\)" "${agent_file}"; then
      log "  Agent ${agent_name} étend déjà une classe de base, ignoré."
      continue
    fi
    
    # Convert category name to camel case for the class name
    category_upper=$(echo "${category:0:1}" | tr '[:lower:]' '[:upper:]')${category:1}
    
    # Create a temporary file for modifications
    temp_file="${LOG_DIR}/temp_${agent_name}"
    
    # Check if the file is a class or a function/module
    if grep -q "class" "${agent_file}"; then
      # It's a class, modify it to extend BaseAgent
      sed -E "s/class ([A-Za-z0-9_]+)/class \1 extends Base${category_upper}Agent/" "${agent_file}" > "${temp_file}"
      
      # Add necessary imports
      if ! grep -q "import .* from '../core/base-agent';" "${temp_file}"; then
        if grep -q "^import " "${temp_file}"; then
          # Add after the last import
          sed -i "0,/^import .*$/s//&\nimport { Base${category_upper}Agent } from '.\/base-${category}-agent';/" "${temp_file}"
        else
          # Add at the beginning of the file
          sed -i "1s/^/import { Base${category_upper}Agent } from '.\/base-${category}-agent';\n/" "${temp_file}"
        fi
      fi
      
      # Add constructor if it doesn't exist
      if ! grep -q "constructor" "${temp_file}"; then
        # Find the first line after the class definition
        class_line=$(grep -n "class" "${temp_file}" | cut -d: -f1)
        class_line=$((class_line + 1))
        
        # Add constructor
        sed -i "${class_line}s/^/  constructor(options?: any) {\n    super(options);\n  }\n\n/" "${temp_file}"
      fi
      
      log "  Modifié la classe pour étendre Base${category_upper}Agent"
      echo "${agent_file}|class|Base${category_upper}Agent" >> "${AGENTS_FILE}"
    else
      # It's a function/module, wrap it into a class
      {
        echo "/**"
        echo " * Agent ${agent_name%.*} standardisé"
        echo " * Version classe de l'agent original"
        echo " */"
        echo ""
        echo "import { Base${category_upper}Agent } from './base-${category}-agent';"
        echo ""
        echo "// Original content (commented)"
        echo "/*"
        cat "${agent_file}"
        echo "*/"
        echo ""
        echo "/**"
        echo " * Agent ${agent_name%.*}"
        echo " */"
        echo "export class ${agent_name%.*}Agent extends Base${category_upper}Agent {"
        echo "  constructor(options?: any) {"
        echo "    super(options);"
        echo "  }"
        echo ""
        echo "  /**"
        echo "   * Exécute l'agent"
        echo "   * @param options Options d'exécution"
        echo "   */"
        echo "  protected async run(options: any): Promise<any> {"
        echo "    // TODO: Implémenter la logique de l'agent en se basant sur le code original"
        echo "    this.log('info', 'Exécution de l\\'agent ${agent_name%.*}');"
        echo "    return { success: true, message: 'À implémenter' };"
        echo "  }"
        echo "}"
      } > "${temp_file}"
      
      log "  Créé une nouvelle classe qui étend Base${category_upper}Agent"
      echo "${agent_file}|function|Base${category_upper}Agent" >> "${AGENTS_FILE}"
    fi
    
    # Apply the changes
    mv "${temp_file}" "${agent_file}"
  done
  
  STANDARDIZED_COUNT=$(wc -l < "${AGENTS_FILE}")
  log "${GREEN}✅ ${STANDARDIZED_COUNT} agents standardisés${NC}"
}

# Fonction pour générer un rapport de standardisation
generate_report() {
  log "${YELLOW}Génération du rapport de standardisation...${NC}"
  
  {
    echo "# Rapport de standardisation des agents"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Résumé"
    echo ""
    echo "- **Imports mis à jour:** $(wc -l < "${IMPORTS_FILE}")"
    echo "- **Agents standardisés:** $(wc -l < "${AGENTS_FILE}")"
    echo ""
    echo "## Imports mis à jour"
    echo ""
    echo "| Fichier | Ancien import | Nouvel import |"
    echo "|---------|--------------|--------------|"
    
    # Liste des imports mis à jour
    if [ -s "${IMPORTS_FILE}" ]; then
      while read -r line; do
        IFS='|' read -r file_path old_import new_import <<< "${line}"
        file_rel="${file_path#${WORKSPACE_ROOT}/}"
        echo "| \`${file_rel}\` | \`${old_import}\` | \`${new_import}\` |"
      done < "${IMPORTS_FILE}"
    else
      echo "Aucun import n'a nécessité de mise à jour."
    fi
    
    echo ""
    echo "## Agents standardisés"
    echo ""
    echo "| Agent | Type d'origine | Classe de base |"
    echo "|-------|----------------|----------------|"
    
    # Liste des agents standardisés
    if [ -s "${AGENTS_FILE}" ]; then
      while read -r line; do
        IFS='|' read -r agent_path type base_class <<< "${line}"
        agent_rel="${agent_path#${WORKSPACE_ROOT}/}"
        agent_name=$(basename "${agent_path}")
        echo "| \`${agent_name}\` | ${type} | ${base_class} |"
      done < "${AGENTS_FILE}"
    else
      echo "Aucun agent n'a nécessité de standardisation."
    fi
    
    echo ""
    echo "## Prochaines étapes"
    echo ""
    echo "1. **Vérifiez la standardisation** - Assurez-vous que les agents fonctionnent correctement après la standardisation"
    echo "2. **Complétez les implémentations** - Pour les agents qui ont été convertis de fonctions en classes, complétez l'implémentation"
    echo "3. **Uniformisez les interfaces** - Utilisez les interfaces TypeScript pour garantir la cohérence entre les agents"
    echo "4. **Écrivez des tests** - Ajoutez des tests pour vérifier le bon fonctionnement de chaque agent"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des agents avant standardisation a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
  } > "${REPORT_FILE}"
  
  log "${GREEN}✅ Rapport de standardisation généré: ${REPORT_FILE}${NC}"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va standardiser les agents et mettre à jour les imports.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les agents
  backup_agents
  
  # Étape 2: Créer les interfaces spécifiques à chaque catégorie
  create_category_interfaces
  
  # Étape 3: Mettre à jour les imports
  update_imports
  
  # Étape 4: Standardiser les agents
  standardize_agents
  
  # Étape 5: Générer un rapport de standardisation
  generate_report
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Standardisation des agents terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les agents ont été standardisés et les imports mis à jour."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
  echo ""
  echo "Prochaines étapes recommandées :"
  echo "1. Vérifier le bon fonctionnement des agents après standardisation"
  echo "2. Compléter les implémentations des agents convertis de fonctions en classes"
}

# Exécution du script principal
main