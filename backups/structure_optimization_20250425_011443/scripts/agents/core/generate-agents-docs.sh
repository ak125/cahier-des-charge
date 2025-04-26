#!/bin/bash
#
# Script pour générer la documentation des agents migrés
# 
# Usage: ./scripts/generate-agents-docs.sh [--output=chemin/vers/fichier.md]
#

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire de base pour les agents MCP
MCP_AGENTS_DIR="packages/mcp-agents"

# Variables par défaut
OUTPUT_FILE="docs/architecture-agents-mcp.md"
VERBOSE=false

# Fonction d'aide
print_help() {
    echo -e "${BLUE}Script de génération de documentation pour les agents MCP${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --output=FICHIER    Chemin vers le fichier de sortie (par défaut: docs/architecture-agents-mcp.md)"
    echo "  --verbose           Afficher des informations détaillées"
    echo "  --help              Afficher cette aide"
    echo ""
}

# Traitement des arguments
for arg in "$@"
do
    case $arg in
        --output=*)
        OUTPUT_FILE="${arg#*=}"
        shift
        ;;
        --verbose)
        VERBOSE=true
        shift
        ;;
        --help)
        print_help
        exit 0
        ;;
        *)
        # argument inconnu
        echo -e "${RED}Argument inconnu: $arg${NC}"
        print_help
        exit 1
        ;;
    esac
done

# Fonction de journalisation
log() {
    local level=$1
    local message=$2
    local prefix=""
    
    case $level in
        "info")
            prefix="${BLUE}[INFO]${NC} "
            ;;
        "success")
            prefix="${GREEN}[SUCCÈS]${NC} "
            ;;
        "warning")
            prefix="${YELLOW}[ATTENTION]${NC} "
            ;;
        "error")
            prefix="${RED}[ERREUR]${NC} "
            ;;
    esac
    
    if [ "$level" != "info" ] || [ "$VERBOSE" = true ]; then
        echo -e "${prefix}${message}"
    fi
}

# Créer le répertoire de destination si nécessaire
mkdir -p $(dirname "$OUTPUT_FILE")

# Fonction pour extraire les métadonnées d'un agent
extract_agent_metadata() {
    local file_path=$1
    local metadata=""
    
    # Extraire l'ID
    local id=$(grep -oP "public\s+id\s*=\s*['\"](\w+)['\"]" "$file_path" | grep -oP "['\"](\w+)['\"]" | tr -d "'\"")
    
    # Extraire le nom
    local name=$(grep -oP "public\s+name\s*=\s*['\"]([^'\"]+)['\"]" "$file_path" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\"")
    
    # Extraire la description
    local description=$(grep -oP "public\s+description\s*=\s*['\"]([^'\"]+)['\"]" "$file_path" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\"")
    
    # Extraire la version
    local version=$(grep -oP "public\s+version\s*=\s*['\"]([^'\"]+)['\"]" "$file_path" | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\"")
    
    # Vérifier si l'agent est abstrait
    local is_abstract=$(grep -c "abstract class" "$file_path")
    
    # Vérifier si l'agent utilise une classe abstraite
    local extends_abstract=0
    local extends_class=""
    
    if grep -q "extends Abstract" "$file_path"; then
        extends_abstract=1
        extends_class=$(grep -oP "extends\s+(\w+)" "$file_path" | awk '{print $2}')
    fi
    
    # Extraire les interfaces ou types d'entrée/sortie
    local input_type=$(grep -oP "extends\s+\w+<\s*(\w+)" "$file_path" | grep -oP "<\s*(\w+)" | tr -d "<" | tr -d " ")
    local output_type=$(grep -oP "extends\s+\w+<\s*\w+\s*,\s*(\w+)" "$file_path" | grep -oP ",\s*(\w+)" | tr -d "," | tr -d " ")
    
    # Renvoyer les métadonnées au format JSON
    echo "{\"id\":\"$id\",\"name\":\"$name\",\"description\":\"$description\",\"version\":\"$version\",\"isAbstract\":$is_abstract,\"extendsAbstract\":$extends_abstract,\"extendsClass\":\"$extends_class\",\"inputType\":\"$input_type\",\"outputType\":\"$output_type\",\"filePath\":\"$file_path\"}"
}

# Fonction pour générer la documentation des agents d'un type donné
generate_agents_doc() {
    local agent_type=$1
    local agent_dir="${MCP_AGENTS_DIR}/${agent_type}s"
    local migrated_count=0
    local total_count=0
    
    if [ ! -d "$agent_dir" ]; then
        log "warning" "Le répertoire $agent_dir n'existe pas."
        return 0
    fi
    
    log "info" "Génération de la documentation pour les agents de type $agent_type..."
    
    # Trouver tous les fichiers d'agents (mais pas les interfaces)
    local agent_files=$(find "$agent_dir" -type f -name "*.ts" | grep -v "interface" | grep -v "index.ts")
    
    # En-tête de la section
    local type_title=$(echo ${agent_type^})
    
    echo "## Agents de type $type_title" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "Les agents de type *$type_title* sont utilisés pour ${description_by_type[$agent_type]}." >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Ajouter l'information sur la classe abstraite
    local abstract_file="$agent_dir/abstract-$agent_type.ts"
    if [ -f "$abstract_file" ]; then
        echo "Tous ces agents héritent de la classe \`Abstract${type_title}Agent<I, O>\` où :" >> "$OUTPUT_FILE"
        echo "- \`I\` est le type des données d'entrée" >> "$OUTPUT_FILE"
        echo "- \`O\` est le type des données de sortie" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Ajouter la signature principale
        case $agent_type in
            analyzer)
                echo "La méthode principale à implémenter est :" >> "$OUTPUT_FILE"
                echo '```typescript' >> "$OUTPUT_FILE"
                echo "public async analyze(input: I, context?: any): Promise<O>" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                ;;
            validator)
                echo "La méthode principale à implémenter est :" >> "$OUTPUT_FILE"
                echo '```typescript' >> "$OUTPUT_FILE"
                echo "public async validate(input: I, context?: any): Promise<O>" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                ;;
            generator)
                echo "La méthode principale à implémenter est :" >> "$OUTPUT_FILE"
                echo '```typescript' >> "$OUTPUT_FILE"
                echo "public async generate(input: I, context?: any): Promise<O>" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                ;;
            orchestrator)
                echo "La méthode principale à implémenter est :" >> "$OUTPUT_FILE"
                echo '```typescript' >> "$OUTPUT_FILE"
                echo "public async orchestrate(input: I, context?: any): Promise<O>" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                ;;
        esac
        
        echo "" >> "$OUTPUT_FILE"
    fi
    
    # Tableau des agents
    echo "| Agent | Description | Version | Migré |" >> "$OUTPUT_FILE"
    echo "|-------|-------------|---------|-------|" >> "$OUTPUT_FILE"
    
    # Parcourir tous les agents
    for file_path in $agent_files; do
        # Ne pas inclure les classes abstraites dans la liste
        if [[ "$file_path" == *"abstract-"* ]]; then
            continue
        fi
        
        total_count=$((total_count + 1))
        
        # Extraire les métadonnées
        local metadata=$(extract_agent_metadata "$file_path")
        local id=$(echo $metadata | jq -r '.id')
        local name=$(echo $metadata | jq -r '.name')
        local description=$(echo $metadata | jq -r '.description')
        local version=$(echo $metadata | jq -r '.version')
        local extends_abstract=$(echo $metadata | jq -r '.extendsAbstract')
        
        # Déterminer si l'agent est migré
        local migrated_status="❌"
        if [ "$extends_abstract" -eq 1 ]; then
            migrated_status="✅"
            migrated_count=$((migrated_count + 1))
        fi
        
        # Utiliser le nom de fichier si l'ID n'est pas disponible
        if [ -z "$id" ] || [ "$id" = "null" ]; then
            id=$(basename "$file_path" .ts)
        fi
        
        # Utiliser des valeurs par défaut si certaines métadonnées sont manquantes
        if [ -z "$name" ] || [ "$name" = "null" ]; then
            name=$id
        fi
        
        if [ -z "$description" ] || [ "$description" = "null" ]; then
            description="*Pas de description disponible*"
        fi
        
        if [ -z "$version" ] || [ "$version" = "null" ]; then
            version="-"
        fi
        
        # Ajouter l'agent au tableau
        echo "| $name | $description | $version | $migrated_status |" >> "$OUTPUT_FILE"
    done
    
    # Statistiques de migration
    echo "" >> "$OUTPUT_FILE"
    echo "**Statistiques de migration:** $migrated_count/$total_count agents migrés ($((migrated_count * 100 / total_count))%)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    log "success" "$migrated_count/$total_count agent(s) de type $agent_type documenté(s)."
    return 0
}

# Descriptions des types d'agents
declare -A description_by_type
description_by_type["analyzer"]="analyser du code ou des données en profondeur"
description_by_type["validator"]="valider la conformité du code ou des données"
description_by_type["generator"]="générer du code ou des données"
description_by_type["orchestrator"]="coordonner l'exécution d'autres agents"

# En-tête du document
cat > "$OUTPUT_FILE" << EOL
# Architecture des agents MCP

Ce document décrit l'architecture des agents du Model Context Protocol (MCP) et leur migration vers une architecture à base de classes abstraites.

## Introduction

Les agents MCP sont des composants spécialisés qui effectuent des tâches spécifiques dans le cadre de l'architecture globale du projet. Ils sont organisés en quatre types principaux :

1. **Analyzers** : Agents d'analyse qui examinent du code ou des données
2. **Validators** : Agents de validation qui vérifient la conformité du code ou des données
3. **Generators** : Agents de génération qui produisent du code ou des données
4. **Orchestrators** : Agents d'orchestration qui coordonnent d'autres agents

Chaque type d'agent hérite maintenant d'une classe abstraite spécifique qui fournit une interface commune et des fonctionnalités de base.

## Cycle de vie des agents

Tous les agents MCP suivent un cycle de vie commun :

1. **Initialisation** (\`initialize()\`) : Prépare l'agent pour l'exécution
2. **Exécution** (méthode principale spécifique au type d'agent)
3. **Nettoyage** (\`cleanup()\`) : Libère les ressources utilisées

Les classes abstraites implémentent le modèle Template Method pour standardiser ce cycle de vie :

\`\`\`typescript
public async initialize(): Promise<void> {
  // Logique commune d'initialisation
  await this.initializeInternal();
  // Mise à jour de l'état après initialisation
}

protected abstract initializeInternal(): Promise<void>;
\`\`\`

Les classes dérivées doivent implémenter les méthodes "Internal" pour leur logique spécifique.

EOL

# Types d'agents à documenter
AGENT_TYPES=("analyzer" "validator" "generator" "orchestrator")

# Générer la documentation pour chaque type d'agent
for agent_type in "${AGENT_TYPES[@]}"; do
    generate_agents_doc "$agent_type"
done

# Ajouter les instructions de migration
cat >> "$OUTPUT_FILE" << EOL
## Migration des agents vers l'architecture abstraite

### Utilisation du script de migration

Le script \`migrate-agents.sh\` permet d'automatiser la migration des agents existants vers la nouvelle architecture abstraite :

\`\`\`bash
./scripts/migrate-agents.sh --type=analyzer --agent=mon-agent
\`\`\`

Options disponibles :
- \`--type=TYPE\` : Type d'agent à migrer (analyzer, validator, generator, orchestrator, all)
- \`--agent=NOM\` : Nom spécifique d'agent à migrer
- \`--dry-run\` : Mode simulation sans modification des fichiers
- \`--verbose\` : Afficher des informations détaillées

### Migration manuelle

Pour adapter manuellement un agent à la nouvelle architecture :

1. **Importez la classe abstraite appropriée** :
   \`\`\`typescript
   import { AbstractAnalyzerAgent } from '../abstract-analyzer';
   \`\`\`

2. **Faites hériter votre classe** :
   \`\`\`typescript
   export class MonAgent extends AbstractAnalyzerAgent<EntreeType, SortieType> {
     // ...
   }
   \`\`\`

3. **Remplacez la méthode principale** par la méthode standard du type d'agent.

4. **Implémentez les méthodes du cycle de vie** :
   \`\`\`typescript
   protected async initializeInternal(): Promise<void> {
     // Code d'initialisation spécifique
   }

   protected async cleanupInternal(): Promise<void> {
     // Code de nettoyage spécifique
   }
   \`\`\`

## Bonnes pratiques

1. **Typez correctement vos entrées/sorties** : Utilisez des interfaces ou des types pour définir clairement les données d'entrée et de sortie de votre agent.

2. **Gérez correctement les ressources** : Initialisez les ressources dans \`initializeInternal()\` et libérez-les dans \`cleanupInternal()\`.

3. **Documentez vos agents** : Ajoutez des commentaires JSDoc pour décrire le but de votre agent et ses fonctionnalités.

4. **Ajouter des tests unitaires** : Vérifiez que votre agent fonctionne correctement et maintient la compatibilité avec l'architecture abstraite.

> Document généré automatiquement le $(date +"%d/%m/%Y à %H:%M")
EOL

# Rendre le script exécutable
chmod +x "$0"

log "success" "Documentation générée avec succès dans $OUTPUT_FILE"