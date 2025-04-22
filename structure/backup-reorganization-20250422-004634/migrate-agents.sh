#!/bin/bash

# Script de migration pour structurer les agents selon l'architecture à 3 couches
echo "Début de la migration des agents vers l'architecture à 3 couches..."

# 1. S'assurer que la structure de dossiers existe
echo "Création des dossiers nécessaires..."
mkdir -p packages/mcp-agents/{core/{interfaces,utils,services},analyzers,generators,validators,orchestrators}

# Vérification que les interfaces de base et les classes abstraites existent
# Si les fichiers abstract-*.ts n'existent pas, il faudra les créer manuellement

# 2. Création des sous-dossiers pour chaque type d'agent
echo "Création des sous-dossiers par type d'agent..."

# Analyseurs
mkdir -p packages/mcp-agents/analyzers/{sql-analyzer,php-analyzer,route-analyzer,qa-analyzer,data-analyzer,dependency-analyzer,structure-analyzer}

# Générateurs
mkdir -p packages/mcp-agents/generators/{code-generator,schema-generator,test-generator,caddyfile-generator,content-generator}

# Validateurs
mkdir -p packages/mcp-agents/validators/{canonical-validator,seo-checker,qa-validator,dev-checker}

# Orchestrateurs
mkdir -p packages/mcp-agents/orchestrators/{temporal,bullmq,n8n,bridges}

# 3. Migration des agents existants
echo "Migration des agents existants..."

# Function pour copier et adapter un agent
migrate_agent() {
  SRC_FILE="$1"
  DEST_DIR="$2"
  AGENT_TYPE="$3"
  AGENT_NAME=$(basename "$SRC_FILE" .ts)
  DEST_FILE="$DEST_DIR/${AGENT_NAME}.ts"
  
  # Créer le dossier cible si nécessaire
  mkdir -p "$(dirname "$DEST_FILE")"
  
  echo "  Migrating $SRC_FILE -> $DEST_FILE"
  
  # Copier le fichier (pour l'instant)
  # Dans un pipeline réel, on adapterait le contenu pour utiliser les classes abstraites
  cp "$SRC_FILE" "$DEST_FILE"
}

# Migration des agents d'analyse
echo "Migration des agents d'analyse..."
[ -f "agents/qa-analyzer.ts" ] && migrate_agent "agents/qa-analyzer.ts" "packages/mcp-agents/analyzers/qa-analyzer" "analyzer"
[ -f "agents/analysis/php-analyzer-v2.ts" ] && migrate_agent "agents/analysis/php-analyzer-v2.ts" "packages/mcp-agents/analyzers/php-analyzer" "analyzer"
[ -f "agents/analysis/DataAgent.ts" ] && migrate_agent "agents/analysis/DataAgent.ts" "packages/mcp-agents/analyzers/data-analyzer" "analyzer"
[ -f "agents/analysis/StructureAgent.ts" ] && migrate_agent "agents/analysis/StructureAgent.ts" "packages/mcp-agents/analyzers/structure-analyzer" "analyzer"
[ -f "agents/analysis/DependencyAgent.ts" ] && migrate_agent "agents/analysis/DependencyAgent.ts" "packages/mcp-agents/analyzers/dependency-analyzer" "analyzer"

# Migration des agents de validation
echo "Migration des agents de validation..."
[ -f "agents/canonical-validator.ts" ] && migrate_agent "agents/canonical-validator.ts" "packages/mcp-agents/validators/canonical-validator" "validator"
[ -f "agents/seo-checker-agent.ts" ] && migrate_agent "agents/seo-checker-agent.ts" "packages/mcp-agents/validators/seo-checker" "validator"
[ -f "agents/dev-checker.ts" ] && migrate_agent "agents/dev-checker.ts" "packages/mcp-agents/validators/dev-checker" "validator"

# Migration des agents de génération
echo "Migration des agents de génération..."
[ -f "agents/migration/caddyfile-generator.ts" ] && migrate_agent "agents/migration/caddyfile-generator.ts" "packages/mcp-agents/generators/caddyfile-generator" "generator"
[ -f "agents/seo-content-enhancer.ts" ] && migrate_agent "agents/seo-content-enhancer.ts" "packages/mcp-agents/generators/content-generator" "generator"

# Migration des agents d'orchestration
echo "Migration des agents d'orchestration..."
[ -f "agents/integration/orchestrator-bridge.ts" ] && migrate_agent "agents/integration/orchestrator-bridge.ts" "packages/mcp-agents/orchestrators/bridges" "orchestrator"

echo "Fin de la migration des agents."
echo "Note: Les fichiers ont été copiés mais n'implémentent pas encore les classes abstraites."
echo "      Veuillez adapter manuellement les agents migrés pour implémenter les interfaces appropriées."