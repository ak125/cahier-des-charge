#!/bin/bash
# Script pour générer une documentation complète de la nouvelle structure d'agents
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
DOCS_DIR="${WORKSPACE_ROOT}/docs/architecture"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DOC_FILE="${DOCS_DIR}/agents-documentation-${TIMESTAMP}.md"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RESET='\033[0m'

# Compteurs
TOTAL_ANALYZERS=0
TOTAL_VALIDATORS=0
TOTAL_GENERATORS=0
TOTAL_ORCHESTRATORS=0
TOTAL_MISC=0

# Créer les répertoires nécessaires
mkdir -p "$DOCS_DIR"

echo -e "${BLUE}Génération de la documentation pour les 112 agents${RESET}"
echo "=========================================================="

# Initialiser le fichier de documentation
cat > "$DOC_FILE" << EOF
# Documentation des Agents MCP

*Document généré automatiquement le $(date '+%d/%m/%Y à %H:%M:%S')*

## Vue d'ensemble

Cette documentation présente les 112 agents qui constituent l'architecture à trois couches du projet MCP. Chaque agent implémente une interface spécifique selon sa catégorie et son rôle.

## Architecture à trois couches

L'architecture à trois couches est organisée comme suit:

1. **Couche d'analyse**: Les agents analyseurs extraient et interprètent les données
2. **Couche de validation**: Les agents validateurs vérifient l'intégrité et la conformité des données
3. **Couche de génération**: Les agents générateurs produisent du contenu ou des transformations
4. **Orchestration**: Les agents orchestrateurs coordonnent les flux de travail

De plus, certains agents sont classés comme "misc" car ils remplissent des fonctions transversales ou spécialisées.

## Répartition des agents

EOF

# Fonction pour extraire une brève description à partir d'un fichier agent
extract_description() {
  local file_path="$1"
  
  # Chercher d'abord un commentaire JSDoc
  local jsdoc_desc=$(grep -A 5 "/**" "$file_path" | grep -v "/**" | grep -v "*/" | sed 's/^ \* //' | head -1)
  
  if [ -n "$jsdoc_desc" ]; then
    echo "$jsdoc_desc"
    return
  fi
  
  # Chercher une description dans un commentaire de classe
  local class_desc=$(grep -B 2 "class" "$file_path" | grep "//" | sed 's/\/\/ //' | head -1)
  
  if [ -n "$class_desc" ]; then
    echo "$class_desc"
    return
  fi
  
  # Extraire le nom de classe et deviner une description
  local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file_path" | head -1 | cut -d' ' -f2)
  
  if [ -n "$class_name" ]; then
    # Convertir le nom CamelCase en mots séparés
    local readable_name=$(echo "$class_name" | sed 's/Agent$//' | sed 's/[A-Z]/ &/g' | sed 's/^ //')
    echo "Agent pour ${readable_name,,}"
  else
    echo "Agent spécialisé"
  fi
}

# Fonction pour identifier les méthodes principales d'un agent
extract_key_methods() {
  local file_path="$1"
  
  # Chercher les méthodes définies dans le fichier
  grep -o "async [a-zA-Z0-9_]\+(.*)" "$file_path" | sed 's/async //' | cut -d'(' -f1 | sort | uniq | head -5 | while read -r method; do
    echo "- \`$method()\`"
  done
}

# Fonction pour extraire l'interface implémentée
extract_interface() {
  local file_path="$1"
  
  # Chercher la clause "implements"
  local implements=$(grep -o "implements [A-Za-z0-9_, ]\+" "$file_path" | head -1 | sed 's/implements //')
  
  if [ -n "$implements" ]; then
    echo "$implements"
  else
    echo "BaseAgent (implicite)"
  fi
}

# Documenter les agents par catégorie
for category in "analyzers" "validators" "generators" "orchestrators" "misc"; do
  echo -e "\nAnalyse des agents de type ${YELLOW}$category${RESET}..."
  
  # Ajouter la section dans la documentation
  cat >> "$DOC_FILE" << EOF

## Agents de type ${category^}

EOF
  
  # Compter le nombre d'agents dans cette catégorie
  category_count=$(find "${AGENTS_DIR}/${category}" -type f -name "*.ts" | grep -v "index.ts" | wc -l)
  
  case "$category" in
    "analyzers") TOTAL_ANALYZERS=$category_count ;;
    "validators") TOTAL_VALIDATORS=$category_count ;;
    "generators") TOTAL_GENERATORS=$category_count ;;
    "orchestrators") TOTAL_ORCHESTRATORS=$category_count ;;
    "misc") TOTAL_MISC=$category_count ;;
  esac
  
  cat >> "$DOC_FILE" << EOF
*Nombre d'agents: $category_count*

| Agent | Interface | Description | Méthodes principales |
|-------|-----------|-------------|---------------------|
EOF

  # Parcourir tous les agents de cette catégorie
  find "${AGENTS_DIR}/${category}" -type f -name "*.ts" | grep -v "index.ts" | sort | while read -r agent_file; do
    agent_name=$(basename "$agent_file" .ts)
    agent_interface=$(extract_interface "$agent_file")
    agent_desc=$(extract_description "$agent_file")
    
    # Obtenir les méthodes principales
    methods=$(extract_key_methods "$agent_file" | tr '\n' ' ' | sed 's/ $//')
    
    # Ajouter l'agent à la documentation
    echo "| \`$agent_name\` | \`$agent_interface\` | $agent_desc | $methods |" >> "$DOC_FILE"
  done
done

# Ajouter les statistiques globales
TOTAL_AGENTS=$((TOTAL_ANALYZERS + TOTAL_VALIDATORS + TOTAL_GENERATORS + TOTAL_ORCHESTRATORS + TOTAL_MISC))

cat >> "$DOC_FILE" << EOF

## Statistiques globales

- **Total des agents**: $TOTAL_AGENTS
- **Analyzers**: $TOTAL_ANALYZERS agents
- **Validators**: $TOTAL_VALIDATORS agents
- **Generators**: $TOTAL_GENERATORS agents
- **Orchestrators**: $TOTAL_ORCHESTRATORS agents
- **Misc**: $TOTAL_MISC agents

## Relations entre les couches

L'architecture à trois couches fonctionne selon les principes suivants:

1. Les agents **Analyzers** produisent des données qui sont consommées par les **Validators**
2. Les données validées sont utilisées par les **Generators** pour créer de nouveaux artefacts
3. Les **Orchestrators** coordonnent ce flux et font appel aux agents des différentes couches

Les agents de la catégorie **Misc** peuvent être utilisés à n'importe quel niveau selon leurs fonctionnalités spécifiques.

## Maintenance

Pour ajouter un nouvel agent à cette architecture:

1. Identifiez la catégorie appropriée (analyzer, validator, generator, orchestrator ou misc)
2. Créez un nouveau fichier dans le répertoire correspondant
3. Implémentez l'interface appropriée
4. Ajoutez l'agent au registre dans le fichier index.ts
5. Exécutez les tests pour vérifier l'intégration

Cette documentation est générée automatiquement. Pour la mettre à jour, exécutez:
\`\`\`
./generate-agents-documentation.sh
\`\`\`

EOF

echo -e "\n${GREEN}Documentation générée avec succès !${RESET}"
echo -e "Fichier de documentation: ${BLUE}$DOC_FILE${RESET}"
echo -e "\n${BLUE}Statistiques:${RESET}"
echo -e "- Total des agents: ${GREEN}$TOTAL_AGENTS${RESET}"
echo -e "- Analyzers: ${GREEN}$TOTAL_ANALYZERS${RESET}"
echo -e "- Validators: ${GREEN}$TOTAL_VALIDATORS${RESET}"
echo -e "- Generators: ${GREEN}$TOTAL_GENERATORS${RESET}"
echo -e "- Orchestrators: ${GREEN}$TOTAL_ORCHESTRATORS${RESET}"
echo -e "- Misc: ${GREEN}$TOTAL_MISC${RESET}"