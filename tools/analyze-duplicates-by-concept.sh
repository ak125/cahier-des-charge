#!/bin/bash
# Analyseur de duplicate par fonction et concept pour un projet à 3 couches
# Date: 9 mai 2025

# Définition des couleurs
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
OUTPUT_DIR="./reports/duplicate-analysis-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$OUTPUT_DIR/duplicate-analysis-report.md"
mkdir -p "$OUTPUT_DIR"

echo "# Rapport d'analyse de duplication par concept - $(date +"%d/%m/%Y %H:%M:%S")" > "$REPORT_FILE"

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Liste des concepts à analyser
declare -a CONCEPTS=(
  "Orchestrator:orchestrator,orchestration"
  "Redis:redis,redisservice,redisjson"
  "BullMQ:bullmq,bull,queue"
  "Temporal:temporal,workflow"
  "OpenAPI:openapi,swagger,typebox"
  "OrchestratorBridge:orchestratorbridge,orchestrator-bridge"
  "BaseAgent:baseagent,base-agent"
  "CoordinationAgent:coordination,mediator"
  "Adapter:adapter,adapters"
)

log "Début de l'analyse de duplication par concept..."

# Pour chaque concept, analyser les fichiers correspondants
for concept_data in "${CONCEPTS[@]}"; do
  # Extraire le nom du concept et les mots-clés
  concept_name="${concept_data%%:*}"
  keywords="${concept_data#*:}"
  
  log "Analyse du concept: $concept_name"
  
  # Créer un fichier pour stocker les chemins
  concept_file="$OUTPUT_DIR/${concept_name,,}-files.txt"
  touch "$concept_file"
  
  # Rechercher les fichiers pour chaque mot-clé
  IFS=',' read -ra KEYWORDS <<< "$keywords"
  for keyword in "${KEYWORDS[@]}"; do
    find ./packages -type f -name "*${keyword}*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" >> "$concept_file"
    find ./apps -type f -name "*${keyword}*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" >> "$concept_file"
  done
  
  # Supprimer les doublons
  sort -u "$concept_file" -o "$concept_file"
  
  # Compter les fichiers
  file_count=$(wc -l < "$concept_file")
  log "  Trouvé $file_count fichiers pour le concept $concept_name"
  
  # Ajouter au rapport
  cat >> "$REPORT_FILE" << EOF

## Concept: $concept_name

Fichiers trouvés: $file_count

### Emplacements

EOF
  
  # Si plus de 1 fichier, analyser les correspondances de contenu
  if [ "$file_count" -gt 1 ]; then
    log "  Analyse des correspondances de contenu pour $concept_name"
    
    # Créer un fichier pour les groupes de contenu similaire
    similar_content_file="$OUTPUT_DIR/${concept_name,,}-similar-content.txt"
    
    # Extraire les définitions de classe/interface
    while IFS= read -r file; do
      # Ajouter le chemin du fichier au rapport
      echo "- \`$file\`" >> "$REPORT_FILE"
      
      # Extraire les exports (classes, interfaces, types)
      grep -n "export \(class\|interface\|type\|enum\)" "$file" | sed "s/^/$file:/g" >> "$similar_content_file"
    done < "$concept_file"
    
    # Ajouter les définitions au rapport
    cat >> "$REPORT_FILE" << EOF

### Définitions

\`\`\`
$(cat "$similar_content_file")
\`\`\`

EOF
  else
    # S'il n'y a qu'un seul fichier, ajouter simplement son chemin
    cat "$concept_file" | while IFS= read -r file; do
      echo "- \`$file\`" >> "$REPORT_FILE"
    done
  fi
  
  # Ajouter une ligne vide entre les concepts
  echo "" >> "$REPORT_FILE"
done

# Ajouter une section de recommandations au rapport
cat >> "$REPORT_FILE" << EOF
## Recommandations de fusion et consolidation

En fonction de l'analyse ci-dessus, voici les recommandations de consolidation :

### Orchestration
- Conserver uniquement les adaptateurs standardisés dans \`packages/business/src/orchestration/adapters\`
- Conserver l'orchestrateur principal dans \`packages/business/src/orchestration/standardized-orchestrator.ts\`
- Supprimer les autres implémentations après vérification

### Redis
- Consolider le service Redis dans \`packages/infrastructure/src/redis/redisservice.ts\`
- S'assurer que les fonctionnalités RedisJSON et SWR sont incluses

### Agents
- Consolider les abstractions d'agents dans \`packages/core/src/agents\`
- Déplacer les implémentations spécifiques dans \`packages/business/src/agents\`

### API
- Maintenir le générateur OpenAPI dans \`packages/business/src/api\`
- Centraliser les définitions de schéma

Ces recommandations visent à éliminer la duplication tout en maintenant une architecture en 3 couches claire.
EOF

success "Analyse de duplication par concept terminée!"
success "Rapport disponible dans: $REPORT_FILE"

echo -e "\n${GREEN}=== Analyse de duplication terminée ===${NC}\n"
