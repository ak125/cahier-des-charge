#!/bin/bash

# Script pour insérer dynamiquement des éléments dans le cahier des charges
# et démarrer leur suivi automatique

set -e

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

CDC_DIR="cahier-des-charges"
LOGS_DIR="logs"
TRACKING_FILE="${LOGS_DIR}/tracking-elements.json"

# Vérification des répertoires
mkdir -p "$CDC_DIR"
mkdir -p "$LOGS_DIR"

# Initialisation du fichier de suivi s'il n'existe pas
if [ ! -f "$TRACKING_FILE" ]; then
  echo "{\"elements\": [], \"last_updated\": \"$(date -Iseconds)\"}" > "$TRACKING_FILE"
fi

# Fonction d'aide pour le formatage des noms
format_name() {
  local name="$1"
  local format="$2"
  
  # Conversion en kebab-case
  local kebab_case=$(echo "$name" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')
  
  case "$format" in
    "kebab") echo "$kebab_case" ;;
    "pascal") echo "$kebab_case" | sed -E 's/(^|-)([a-z])/\U\2/g' ;;
    "camel") echo "$kebab_case" | sed -E 's/-(.)/.*/\U\1/g' | sed -E 's/^([A-Z])/\L\1/' ;;
    *) echo "$name" ;;
  esac
}

# Fonction pour déterminer le fichier du CDC à modifier
get_cdc_file() {
  local type="$1"
  
  case "$type" in
    "module") echo "${CDC_DIR}/03-specifications-techniques.md" ;;
    "agent") echo "${CDC_DIR}/04-architecture-ia.md" ;;
    "strategy") echo "${CDC_DIR}/05-plan-migration.md" ;;
    "workflow") echo "${CDC_DIR}/04-architecture-ia.md" ;;
    *) echo "${CDC_DIR}/03-specifications-techniques.md" ;;
  esac
}

# Fonction pour ajouter un élément au cahier des charges
insert_to_cdc() {
  local type="$1"
  local name="$2"
  local description="$3"
  
  local cdc_file=$(get_cdc_file "$type")
  local pascal_name=$(format_name "$name" "pascal")
  local section_id=$(echo "$type-$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  
  echo -e "${BLUE}📝 Insertion de $pascal_name dans $cdc_file...${NC}"
  
  case "$type" in
    "module")
      # Trouver la section des modules
      if ! grep -q "^### Module $pascal_name" "$cdc_file"; then
        # Ajouter la nouvelle section de module
        cat >> "$cdc_file" << EOL

### Module $pascal_name

#### Description
$description

#### Fonctionnalités
- Fonctionnalité 1
- Fonctionnalité 2

#### Dépendances
- Dépendance 1
- Dépendance 2

<!-- @generate:module $name -->
EOL
        echo -e "${GREEN}✅ Module $pascal_name ajouté au cahier des charges${NC}"
      else
        echo -e "${YELLOW}⚠️ Module $pascal_name existe déjà dans le cahier des charges${NC}"
      fi
      ;;
    
    "agent")
      # Trouver la section des agents IA
      if ! grep -q "^### $pascal_name" "$cdc_file"; then
        # Ajouter le nouvel agent
        cat >> "$cdc_file" << EOL

### $pascal_name
- Description: $description
- Input: [Type d'entrée]
- Output: [Type de sortie]
- Algorithme: [Description de l'algorithme]

<!-- @generate:agent $name -->
EOL
        echo -e "${GREEN}✅ Agent $pascal_name ajouté au cahier des charges${NC}"
      else
        echo -e "${YELLOW}⚠️ Agent $pascal_name existe déjà dans le cahier des charges${NC}"
      fi
      ;;
    
    "strategy")
      # Trouver la section des stratégies
      if ! grep -q "^### Stratégie $pascal_name" "$cdc_file"; then
        # Ajouter la nouvelle stratégie
        cat >> "$cdc_file" << EOL

### Stratégie $pascal_name

#### Approche
$description

#### Étapes
1. Étape 1
2. Étape 2
3. Étape 3

#### Métriques de succès
- Métrique 1
- Métrique 2

<!-- @generate:strategy $name -->
EOL
        echo -e "${GREEN}✅ Stratégie $pascal_name ajoutée au cahier des charges${NC}"
      else
        echo -e "${YELLOW}⚠️ Stratégie $pascal_name existe déjà dans le cahier des charges${NC}"
      fi
      ;;
    
    "workflow")
      # Trouver la section des workflows
      if ! grep -q "^### Workflow $pascal_name" "$cdc_file"; then
        # Ajouter le nouveau workflow
        cat >> "$cdc_file" << EOL

### Workflow $pascal_name

#### Objectif
$description

#### Étapes
1. Déclencheur: [Description du déclencheur]
2. Action 1: [Description]
3. Action 2: [Description]
4. Résultat: [Description du résultat]

<!-- @generate:workflow $name -->
EOL
        echo -e "${GREEN}✅ Workflow $pascal_name ajouté au cahier des charges${NC}"
      else
        echo -e "${YELLOW}⚠️ Workflow $pascal_name existe déjà dans le cahier des charges${NC}"
      fi
      ;;
    
    *)
      echo -e "${RED}❌ Type non reconnu: $type${NC}"
      exit 1
      ;;
  esac
}

# Fonction pour mettre à jour le fichier de suivi
update_tracking() {
  local type="$1"
  local name="$2"
  local description="$3"
  local cdc_file=$(get_cdc_file "$type")
  local timestamp=$(date -Iseconds)
  
  # Extraire le contenu JSON existant
  local json_content=$(cat "$TRACKING_FILE")
  
  # Ajouter le nouvel élément
  local new_element="{\"type\":\"$type\",\"name\":\"$name\",\"description\":\"$description\",\"cdc_file\":\"$cdc_file\",\"added\":\"$timestamp\",\"status\":\"active\",\"technical_files\":[]}"
  
  # Mettre à jour le fichier de suivi
  local updated_json=$(echo "$json_content" | jq ".elements += [$new_element] | .last_updated = \"$timestamp\"")
  echo "$updated_json" > "$TRACKING_FILE"
  
  echo -e "${GREEN}✅ Élément ajouté au suivi automatique${NC}"
}

# Fonction pour générer les fichiers techniques associés
generate_technical_files() {
  local type="$1"
  local name="$2"
  local cdc_file=$(get_cdc_file "$type")
  
  echo -e "${BLUE}🛠️ Génération des fichiers techniques pour $name...${NC}"
  
  if [ -f "./scripts/generate-technical-files.js" ]; then
    node ./scripts/generate-technical-files.js --type "$type" --name "$name" --cdc-section "$cdc_file" || {
      echo -e "${RED}❌ Échec de la génération des fichiers techniques${NC}"
    }
  else
    echo -e "${YELLOW}⚠️ Le script de génération de fichiers techniques n'existe pas${NC}"
    echo -e "${YELLOW}⚠️ Créez le script avec: npm install mustache yargs chalk${NC}"
  fi
}

# Fonction pour déclencher la mise à jour du cahier des charges
update_cahier_des_charges() {
  echo -e "${BLUE}🔄 Mise à jour du sommaire du cahier des charges...${NC}"
  
  if [ -f "./update-cahier.sh" ]; then
    ./update-cahier.sh
  else
    echo -e "${YELLOW}⚠️ Le script update-cahier.sh n'existe pas${NC}"
  fi
}

# Fonction pour démarrer le suivi automatique
start_tracking() {
  local type="$1"
  local name="$2"
  
  echo -e "${BLUE}🔍 Démarrage du suivi automatique pour $name...${NC}"
  
  # Créer un identifiant de suivi unique
  local tracking_id="$type-$name-$(date +%s)"
  
  # Créer un fichier de configuration de suivi
  mkdir -p "config/tracking"
  cat > "config/tracking/$tracking_id.json" << EOL
{
  "id": "$tracking_id",
  "type": "$type",
  "name": "$name",
  "created": "$(date -Iseconds)",
  "cdc_file": "$(get_cdc_file "$type")",
  "watch_paths": [
    "src/${type}s/$(format_name "$name" "kebab")"
  ],
  "notification_channels": [
    "console",
    "log"
  ],
  "tracking_interval": 300
}
EOL

  echo -e "${GREEN}✅ Configuration de suivi créée: config/tracking/$tracking_id.json${NC}"
  
  # Démarrer le processus de suivi en arrière-plan si le script existe
  if [ -f "./scripts/track-element.js" ]; then
    node ./scripts/track-element.js --config "$tracking_id" &
    echo -e "${GREEN}✅ Processus de suivi démarré pour $name${NC}"
  else
    echo -e "${YELLOW}⚠️ Script de suivi non disponible${NC}"
  fi
}

# Fonction principale
main() {
  if [ "$#" -lt 3 ]; then
    echo -e "${RED}Usage: $0 <type> <name> <description>${NC}"
    echo -e "${YELLOW}Types supportés: module, agent, strategy, workflow${NC}"
    exit 1
  fi
  
  local type="$1"
  local name="$2"
  local description="$3"
  
  # Vérifier le type
  case "$type" in
    "module"|"agent"|"strategy"|"workflow")
      # Type valide, continuer
      ;;
    *)
      echo -e "${RED}❌ Type non supporté: $type${NC}"
      echo -e "${YELLOW}Types supportés: module, agent, strategy, workflow${NC}"
      exit 1
      ;;
  esac
  
  echo -e "${BLUE}🚀 Insertion et suivi automatique: $type '$name'${NC}"
  
  # Étape 1: Insérer dans le cahier des charges
  insert_to_cdc "$type" "$name" "$description"
  
  # Étape 2: Mettre à jour le fichier de suivi
  update_tracking "$type" "$name" "$description"
  
  # Étape 3: Générer les fichiers techniques
  generate_technical_files "$type" "$name"
  
  # Étape 4: Mettre à jour le cahier des charges
  update_cahier_des_charges
  
  # Étape 5: Démarrer le suivi automatique
  start_tracking "$type" "$name"
  
  echo -e "\n${GREEN}✅ Élément inséré et suivi automatique démarré!${NC}"
  echo -e "${BLUE}📄 Cahier des charges: $(get_cdc_file "$type")${NC}"
  echo -e "${BLUE}🔍 Suivi: config/tracking/${type}-${name}-*.json${NC}"
  
  # Ajouter une entrée dans le changelog
  echo -e "\n## $(date +'%Y-%m-%d') - Ajout de $type: $name" >> "${CDC_DIR}/changelog.md"
  echo -e "- Description: $description" >> "${CDC_DIR}/changelog.md"
  echo -e "- Insertion automatique via script" >> "${CDC_DIR}/changelog.md"
  echo -e "- Génération des fichiers techniques associés" >> "${CDC_DIR}/changelog.md"
}

# Exécution du script
main "$@"
