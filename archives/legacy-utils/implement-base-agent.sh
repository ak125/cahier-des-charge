#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     IMPLÉMENTATION DE LA CLASSE BaseAgent            ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/agents"
BACKUP_DIR="${WORKSPACE_ROOT}/backups/base_agent_${TIMESTAMP}"
LOG_DIR="${BACKUP_DIR}/logs"
LOG_FILE="${LOG_DIR}/base_agent_${TIMESTAMP}.log"
REPORT_FILE="${WORKSPACE_ROOT}/reports/base_agent_${TIMESTAMP}.md"
CATEGORIES=()

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${WORKSPACE_ROOT}/reports"

# Initialisation du fichier de log
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  local level="${2:-INFO}"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Fonction pour créer une sauvegarde des fichiers source
backup_agent_files() {
  log "Sauvegarde des fichiers agents avant implémentation de BaseAgent..." "INFO"
  
  # Sauvegarde des fichiers TypeScript dans le dossier agents
  find "${AGENTS_DIR}" -type f -name "*.ts" | while read -r file; do
    rel_path="${file#${WORKSPACE_ROOT}/}"
    target_dir="$(dirname "${BACKUP_DIR}/${rel_path}")"
    mkdir -p "${target_dir}"
    cp "${file}" "${BACKUP_DIR}/${rel_path}"
  done
  
  log "✅ Fichiers agents sauvegardés dans ${BACKUP_DIR}" "INFO"
}

# Fonction pour découvrir les catégories d'agents
discover_agent_categories() {
  log "Découverte des catégories d'agents..." "INFO"
  
  # Trouver toutes les sous-catégories directes dans le dossier agents
  CATEGORIES=($(find "${AGENTS_DIR}" -mindepth 1 -maxdepth 1 -type d -not -path "${AGENTS_DIR}/node_modules" -printf "%f\n" | sort))
  
  log "✅ ${#CATEGORIES[@]} catégories d'agents trouvées" "INFO"
  echo "${CATEGORIES[@]}"
}

# Fonction pour créer la classe BaseAgent
create_base_agent() {
  log "Création de la classe BaseAgent..." "INFO"
  
  mkdir -p "${AGENTS_DIR}/core"
  
  cat > "${AGENTS_DIR}/core/BaseAgent.ts" << 'EOL'
/**
 * BaseAgent - Classe abstraite pour tous les agents
 * 
 * Cette classe sert de base pour tous les agents du système,
 * garantissant une interface cohérente et un comportement standard.
 * 
 * @abstract
 */
export abstract class BaseAgent {
  /** Identifiant unique de l'agent */
  protected id: string;
  
  /** Nom convivial de l'agent */
  protected name: string;
  
  /** Description de la fonctionnalité de l'agent */
  protected description: string;
  
  /** Version de l'agent */
  protected version: string = '1.0.0';
  
  /** Statut actuel de l'agent */
  protected status: 'idle' | 'running' | 'error' | 'completed' = 'idle';
  
  /** Timestamp du dernier démarrage */
  protected lastStartTime?: Date;
  
  /** Timestamp de la dernière exécution terminée */
  protected lastCompletionTime?: Date;
  
  /** Configuration de l'agent */
  protected config: Record<string, any> = {};
  
  /**
   * Constructeur de la classe BaseAgent
   * 
   * @param id - Identifiant unique de l'agent
   * @param name - Nom convivial de l'agent
   * @param description - Description de la fonctionnalité de l'agent
   * @param config - Configuration optionnelle de l'agent
   */
  constructor(
    id: string,
    name: string,
    description: string,
    config: Record<string, any> = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Initialise l'agent avec une configuration
   * 
   * @param config - Configuration à fusionner avec la configuration existante
   */
  init(config: Record<string, any> = {}): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Récupère l'ID de l'agent
   * 
   * @returns L'ID de l'agent
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Récupère le nom de l'agent
   * 
   * @returns Le nom de l'agent
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Récupère la description de l'agent
   * 
   * @returns La description de l'agent
   */
  getDescription(): string {
    return this.description;
  }
  
  /**
   * Récupère le statut actuel de l'agent
   * 
   * @returns Le statut actuel de l'agent
   */
  getStatus(): 'idle' | 'running' | 'error' | 'completed' {
    return this.status;
  }
  
  /**
   * Récupère la configuration de l'agent
   * 
   * @returns La configuration actuelle de l'agent
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
  
  /**
   * Met à jour la configuration de l'agent
   * 
   * @param config - Nouvelle configuration à fusionner
   */
  updateConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Démarre l'exécution de l'agent
   * Cette méthode doit être implémentée par les sous-classes
   * 
   * @param params - Paramètres spécifiques pour l'exécution
   */
  abstract async execute(params?: Record<string, any>): Promise<any>;
  
  /**
   * Arrête l'exécution de l'agent
   */
  stop(): void {
    if (this.status === 'running') {
      this.status = 'idle';
    }
  }
  
  /**
   * Prépare l'agent avant l'exécution
   * 
   * @protected
   */
  protected async prepare(): Promise<void> {
    this.status = 'running';
    this.lastStartTime = new Date();
  }
  
  /**
   * Finalise l'exécution de l'agent
   * 
   * @protected
   * @param success - Indique si l'exécution s'est terminée avec succès
   */
  protected async finalize(success: boolean): Promise<void> {
    this.status = success ? 'completed' : 'error';
    this.lastCompletionTime = new Date();
  }
  
  /**
   * Méthode pour journaliser des informations
   * 
   * @protected
   * @param message - Message à journaliser
   * @param level - Niveau de journalisation
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${this.id}] ${message}`);
  }
}
EOL
  
  log "✅ BaseAgent créé avec succès" "INFO"
}

# Fonction pour créer les classes de base spécifiques à chaque catégorie
create_category_base_classes() {
  local categories=("$@")
  
  log "Création des classes de base spécifiques à chaque catégorie..." "INFO"
  
  for category in "${categories[@]}"; do
    log "Création de la classe de base pour la catégorie: ${category}" "DEBUG"
    
    # Convertir le nom de catégorie en PascalCase
    category_pascal=$(echo "${category}" | sed -r 's/(^|_)([a-z])/\U\2/g')
    
    mkdir -p "${AGENTS_DIR}/${category}/core"
    
    cat > "${AGENTS_DIR}/${category}/core/${category_pascal}Agent.ts" << EOL
import { BaseAgent } from '../../core/BaseAgent';

/**
 * ${category_pascal}Agent - Classe de base pour les agents de la catégorie ${category}
 * 
 * Cette classe étend BaseAgent avec des fonctionnalités spécifiques
 * pour les agents de type ${category}.
 */
export abstract class ${category_pascal}Agent extends BaseAgent {
  /**
   * Constructeur de la classe ${category_pascal}Agent
   * 
   * @param id - Identifiant unique de l'agent
   * @param name - Nom convivial de l'agent
   * @param description - Description de la fonctionnalité de l'agent
   * @param config - Configuration optionnelle de l'agent
   */
  constructor(
    id: string,
    name: string,
    description: string,
    config: Record<string, any> = {}
  ) {
    super(id, name, description, config);
    
    // Configuration par défaut spécifique à la catégorie ${category}
    this.config = { 
      category: '${category}',
      ...this.config 
    };
  }
  
  /**
   * Méthodes spécifiques à la catégorie ${category} peuvent être ajoutées ici
   */
}
EOL
    
    log "✅ Classe ${category_pascal}Agent créée" "DEBUG"
  done
  
  log "✅ Classes de base par catégorie créées avec succès" "INFO"
}

# Fonction pour créer un index.ts pour chaque catégorie
create_category_indexes() {
  local categories=("$@")
  
  log "Création des fichiers index.ts pour chaque catégorie..." "INFO"
  
  for category in "${categories[@]}"; do
    log "Création du fichier index.ts pour la catégorie: ${category}" "DEBUG"
    
    # Convertir le nom de catégorie en PascalCase
    category_pascal=$(echo "${category}" | sed -r 's/(^|_)([a-z])/\U\2/g')
    
    cat > "${AGENTS_DIR}/${category}/index.ts" << EOL
// Export des classes de base
export * from './core/${category_pascal}Agent';

// Export des agents de la catégorie ${category}
// Ce fichier est auto-généré et sera complété lors de l'analyse des agents
EOL
    
    log "✅ Index pour ${category} créé" "DEBUG"
  done
  
  log "✅ Fichiers index.ts créés avec succès" "INFO"
}

# Fonction pour analyser un agent et modifier son code pour hériter de la classe de base
update_agent_inheritance() {
  local agent_file="$1"
  local category="$2"
  
  log "Mise à jour de l'héritage pour ${agent_file}..." "DEBUG"
  
  # Convertir le nom de catégorie en PascalCase
  category_pascal=$(echo "${category}" | sed -r 's/(^|_)([a-z])/\U\2/g')
  
  # Extraire le nom de la classe d'agent à partir du nom de fichier
  agent_name=$(basename "${agent_file}" .ts)
  agent_pascal=$(echo "${agent_name}" | sed -r 's/(^|[-_])([a-z])/\U\2/g' | sed 's/-//g')
  
  # Vérifier si c'est déjà une classe
  if grep -q "class ${agent_pascal}" "${agent_file}"; then
    # C'est une classe, modifier pour hériter
    if ! grep -q "extends ${category_pascal}Agent" "${agent_file}"; then
      # Ajouter l'import de la classe de base
      sed -i "1i import { ${category_pascal}Agent } from './core/${category_pascal}Agent';" "${agent_file}"
      
      # Remplacer la déclaration de classe pour hériter
      sed -i "s/class ${agent_pascal}/class ${agent_pascal} extends ${category_pascal}Agent/" "${agent_file}"
      
      # Ajouter un constructeur s'il n'existe pas
      if ! grep -q "constructor" "${agent_file}"; then
        constructor_insertion=$(grep -n "class ${agent_pascal}" "${agent_file}" | cut -d':' -f1)
        constructor_insertion=$((constructor_insertion + 1))
        
        sed -i "${constructor_insertion}i\\
  constructor() {\\
    super('${agent_name}', '${agent_pascal}', 'Agent for ${agent_pascal} functionality');\\
  }\\
" "${agent_file}"
      fi
      
      log "✅ Classe ${agent_pascal} mise à jour pour hériter de ${category_pascal}Agent" "DEBUG"
      return 0
    else
      log "ℹ️ ${agent_pascal} hérite déjà de ${category_pascal}Agent" "DEBUG"
      return 1
    fi
  else
    # C'est une fonction ou un autre type, créer une classe wrapper
    # Sauvegarder le contenu original
    original_content=$(cat "${agent_file}")
    
    # Créer un nouveau fichier avec une classe
    cat > "${agent_file}" << EOL
import { ${category_pascal}Agent } from './core/${category_pascal}Agent';

/**
 * ${agent_pascal} - Agent pour la fonctionnalité ${agent_name}
 */
export class ${agent_pascal} extends ${category_pascal}Agent {
  /**
   * Constructeur
   */
  constructor() {
    super('${agent_name}', '${agent_pascal}', 'Agent for ${agent_pascal} functionality');
  }
  
  /**
   * Exécute les fonctionnalités de l'agent
   */
  async execute(params?: Record<string, any>): Promise<any> {
    await this.prepare();
    
    try {
      // Code original encapsulé
      const originalImplementation = ${agent_name};
      const result = await originalImplementation(params);
      
      await this.finalize(true);
      return result;
    } catch (error) {
      this.log(\`Erreur lors de l'exécution : \${error}\`, 'error');
      await this.finalize(false);
      throw error;
    }
  }
}

// Code original préservé
${original_content}
EOL
    
    log "✅ Wrapper de classe créé pour ${agent_name}" "DEBUG"
    return 0
  fi
}

# Fonction pour mettre à jour tous les agents d'une catégorie
update_category_agents() {
  local category="$1"
  
  log "Mise à jour des agents de la catégorie: ${category}..." "INFO"
  
  # Trouver tous les fichiers d'agents dans cette catégorie
  agent_files=($(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts"))
  
  local updates=0
  local skips=0
  
  for agent_file in "${agent_files[@]}"; do
    if update_agent_inheritance "${agent_file}" "${category}"; then
      updates=$((updates + 1))
    else
      skips=$((skips + 1))
    fi
  done
  
  log "✅ Catégorie ${category}: ${updates} agents mis à jour, ${skips} ignorés" "INFO"
  
  # Mettre à jour le fichier index.ts pour exporter tous les agents
  log "Mise à jour du fichier index.ts pour exporter tous les agents de ${category}..." "DEBUG"
  
  # Obtenir les noms de fichiers d'agents
  agent_names=()
  for agent_file in "${agent_files[@]}"; do
    agent_name=$(basename "${agent_file}" .ts)
    agent_names+=("${agent_name}")
  done
  
  # Ajouter les exports au fichier index.ts
  for agent_name in "${agent_names[@]}"; do
    # Vérifier si l'export existe déjà
    if ! grep -q "export.*from.*/${agent_name}" "${AGENTS_DIR}/${category}/index.ts"; then
      echo "export * from './${agent_name}';" >> "${AGENTS_DIR}/${category}/index.ts"
    fi
  done
  
  log "✅ Fichier index.ts mis à jour pour la catégorie ${category}" "DEBUG"
}

# Fonction pour générer un rapport de la mise à jour
generate_implementation_report() {
  local categories=("$@")
  
  log "Génération du rapport d'implémentation..." "INFO"
  
  # Compiler les statistiques
  total_categories=${#categories[@]}
  total_agents=0
  updated_agents=0
  
  for category in "${categories[@]}"; do
    category_agents=$(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts" | wc -l)
    total_agents=$((total_agents + category_agents))
    
    # Compter les agents qui ont été mis à jour (ont une référence à CategoryAgent)
    category_updated=$(grep -l "extends.*Agent" $(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts") | wc -l)
    updated_agents=$((updated_agents + category_updated))
  done
  
  {
    echo "# Rapport d'implémentation de BaseAgent"
    echo ""
    echo "Date: $(date)"
    echo ""
    echo "## Résumé"
    echo ""
    echo "- **Catégories d'agents:** ${total_categories}"
    echo "- **Agents totaux:** ${total_agents}"
    echo "- **Agents mis à jour:** ${updated_agents}"
    echo ""
    echo "## Classes de base créées"
    echo ""
    echo "1. **BaseAgent** - Classe de base commune à tous les agents"
    echo ""
    for category in "${categories[@]}"; do
      category_pascal=$(echo "${category}" | sed -r 's/(^|_)([a-z])/\U\2/g')
      echo "2. **${category_pascal}Agent** - Classe de base pour la catégorie \`${category}\`"
    done
    echo ""
    echo "## Détails par catégorie"
    echo ""
    
    for category in "${categories[@]}"; do
      echo "### Catégorie: ${category}"
      echo ""
      
      # Compter les statistiques de cette catégorie
      category_agents=$(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts" | wc -l)
      category_updated=$(grep -l "extends.*Agent" $(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts") | wc -l)
      
      echo "- Agents totaux: ${category_agents}"
      echo "- Agents mis à jour: ${category_updated}"
      echo ""
      echo "| Agent | Type de mise à jour |"
      echo "|-------|-------------------|"
      
      # Lister les agents de cette catégorie
      find "${AGENTS_DIR}/${category}" -type f -name "*.ts" -not -path "*/core/*" -not -path "*/node_modules/*" -not -name "index.ts" | sort | while read -r agent_file; do
        agent_name=$(basename "${agent_file}" .ts)
        
        # Déterminer le type de mise à jour
        if grep -q "class.*extends" "${agent_file}"; then
          if grep -q "originalImplementation" "${agent_file}"; then
            update_type="Fonction encapsulée dans une classe"
          else
            update_type="Héritage ajouté à la classe existante"
          fi
        else
          update_type="⚠️ Non mis à jour"
        fi
        
        echo "| \`${agent_name}\` | ${update_type} |"
      done
      
      echo ""
    done
    
    echo "## Prochaines étapes"
    echo ""
    echo "1. Vérifier le bon fonctionnement des agents mis à jour"
    echo "2. Compléter les méthodes spécifiques aux catégories dans les classes de base"
    echo "3. Ajouter des tests unitaires pour les classes de base"
    echo "4. Documenter l'utilisation des classes de base pour les nouveaux agents"
    echo ""
    echo "## Sauvegarde"
    echo ""
    echo "Une sauvegarde complète des fichiers agents avant l'implémentation a été créée dans: \`${BACKUP_DIR}\`"
    echo ""
    echo "Si nécessaire, vous pouvez restaurer les fichiers originaux depuis cette sauvegarde."
    
  } > "${REPORT_FILE}"
  
  log "✅ Rapport d'implémentation généré: ${REPORT_FILE}" "INFO"
}

# Fonction principale
main() {
  echo -e "${YELLOW}Ce script va implémenter la classe BaseAgent pour tous les agents.${NC}"
  echo -e "${RED}Une sauvegarde sera créée avant toute modification.${NC}"
  read -p "Voulez-vous continuer ? (o/n): " confirm
  
  if [[ "${confirm}" != "o" && "${confirm}" != "O" ]]; then
    log "Opération annulée par l'utilisateur." "INFO"
    exit 1
  fi
  
  # Étape 1: Sauvegarder les fichiers agents
  backup_agent_files
  
  # Étape 2: Découvrir les catégories d'agents
  categories=($(discover_agent_categories))
  
  if [ ${#categories[@]} -eq 0 ]; then
    log "❌ Aucune catégorie d'agent trouvée. Impossible de continuer." "ERROR"
    exit 1
  fi
  
  # Étape 3: Créer la classe BaseAgent
  create_base_agent
  
  # Étape 4: Créer les classes de base pour chaque catégorie
  create_category_base_classes "${categories[@]}"
  
  # Étape 5: Créer les fichiers index.ts pour chaque catégorie
  create_category_indexes "${categories[@]}"
  
  # Étape 6: Mettre à jour les agents pour hériter des classes de base
  for category in "${categories[@]}"; do
    update_category_agents "${category}"
  done
  
  # Étape 7: Générer un rapport de la mise à jour
  generate_implementation_report "${categories[@]}"
  
  # Afficher le résumé
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}✅ Implémentation de BaseAgent terminée!${NC}"
  echo -e "${GREEN}   - Sauvegarde: ${BACKUP_DIR}${NC}"
  echo -e "${GREEN}   - Rapport: ${REPORT_FILE}${NC}"
  echo -e "${GREEN}   - Log: ${LOG_FILE}${NC}"
  echo -e "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Les agents ont été mis à jour pour hériter de BaseAgent."
  echo "Consultez le rapport pour plus d'informations : ${REPORT_FILE#${WORKSPACE_ROOT}/}"
}

# Exécution du script principal
main