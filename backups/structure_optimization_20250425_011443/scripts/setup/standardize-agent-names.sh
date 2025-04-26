#!/bin/bash

# Script pour standardiser les noms d'agents avec caractères spéciaux
# Date: 21 avril 2025

echo "🔧 Standardisation des noms d'agents"
echo "📋 Renommage des fichiers et mise à jour des références"

# Création d'un journal des renommages
REPORT_DIR="/workspaces/cahier-des-charge/reports"
mkdir -p "$REPORT_DIR"
RENAME_LOG="$REPORT_DIR/agent-rename-$(date +"%Y%m%d-%H%M%S").log"

echo "Standardisation des noms d'agents - $(date)" > "$RENAME_LOG"
echo "===========================================" >> "$RENAME_LOG"

# Fonction pour renommer un dossier et mettre à jour les références
rename_agent_dir() {
  local old_path="$1"
  local new_path="$2"
  local old_name=$(basename "$old_path")
  local new_name=$(basename "$new_path")
  
  echo "🔄 Renommage: $old_path -> $new_path"
  echo "[$old_name] -> [$new_name]" >> "$RENAME_LOG"
  
  if [ ! -d "$old_path" ]; then
    echo "❌ Répertoire source non trouvé: $old_path" | tee -a "$RENAME_LOG"
    return 1
  fi
  
  # Si le répertoire de destination existe déjà, fusionner
  if [ -d "$new_path" ]; then
    echo "⚠️ Répertoire de destination existe déjà, fusion des fichiers..." | tee -a "$RENAME_LOG"
    cp -r "$old_path"/* "$new_path"/
  else
    # Créer le répertoire de destination et copier les fichiers
    mkdir -p "$new_path"
    cp -r "$old_path"/* "$new_path"/
  fi
  
  echo "✅ Fichiers copiés" | tee -a "$RENAME_LOG"
  
  return 0
}

# Fonction pour mettre à jour les références dans le code
update_references() {
  local old_name="$1"
  local new_name="$2"
  
  echo "🔍 Mise à jour des références: $old_name -> $new_name"
  echo "Recherche des références à $old_name..." >> "$RENAME_LOG"
  
  # Trouver toutes les occurrences du nom d'agent dans les fichiers .ts et .tsx
  files_with_refs=$(grep -l "$old_name" $(find /workspaces/cahier-des-charge -name "*.ts" -o -name "*.tsx" | grep -v "node_modules"))
  
  ref_count=0
  for file in $files_with_refs; do
    # Ignorer les fichiers dans les répertoires d'origine ou de destination
    if [[ "$file" == *"$old_name"* ]] || [[ "$file" == *"$new_name"* ]]; then
      continue
    fi
    
    echo "  📝 Mise à jour de $file" | tee -a "$RENAME_LOG"
    sed -i "s/$old_name/$new_name/g" "$file"
    ref_count=$((ref_count + 1))
  done
  
  echo "✅ $ref_count fichiers mis à jour avec les nouvelles références" | tee -a "$RENAME_LOG"
}

# Recherche et standardisation des agents avec caractères spéciaux dans le nom
echo "🔍 Recherche des agents avec caractères spéciaux..."

# 1. Agents avec "+" dans le nom (ex: MysqlAnalyzer+optimizerAgent)
echo "🔍 Traitement des agents avec '+' dans le nom..."
plus_agents=$(find /workspaces/cahier-des-charge -type d -name "*+*" -not -path "*/node_modules/*" -not -path "*/dist/*")

for agent_dir in $plus_agents; do
  old_name=$(basename "$agent_dir")
  # Remplacer "+" par "Plus" dans le nom
  new_name=$(echo "$old_name" | sed 's/+/Plus/g')
  # Convertir première lettre de chaque mot en majuscule (CamelCase)
  new_name=$(echo "$new_name" | sed -r 's/(^|[^a-zA-Z])([a-z])/\1\u\2/g')
  
  new_dir=$(dirname "$agent_dir")/"$new_name"
  
  rename_agent_dir "$agent_dir" "$new_dir"
  update_references "$old_name" "$new_name"
done

# 2. Agents avec "." dans le nom (ex: PhpAnalyzer.workerAgent)
echo "🔍 Traitement des agents avec '.' dans le nom..."
dot_agents=$(find /workspaces/cahier-des-charge -type d -name "*.*" -not -path "*/node_modules/*" -not -path "*/dist/*")

for agent_dir in $dot_agents; do
  old_name=$(basename "$agent_dir")
  # Remplacer "." par "Dot" dans le nom
  new_name=$(echo "$old_name" | sed 's/\./Dot/g')
  # Convertir première lettre de chaque mot en majuscule (CamelCase)
  new_name=$(echo "$new_name" | sed -r 's/(^|[^a-zA-Z])([a-z])/\1\u\2/g')
  
  new_dir=$(dirname "$agent_dir")/"$new_name"
  
  rename_agent_dir "$agent_dir" "$new_dir"
  update_references "$old_name" "$new_name"
done

# 3. Agents avec "-" dans le nom (ex: agent-audit)
echo "🔍 Traitement des agents avec '-' dans le nom..."
hyphen_agents=$(find /workspaces/cahier-des-charge -type d -name "*-*" -not -path "*/node_modules/*" -not -path "*/dist/*")

for agent_dir in $hyphen_agents; do
  # Ignorer certains répertoires courants comme node_modules
  if [[ "$agent_dir" == *"/node_modules/"* ]] || [[ "$agent_dir" == *"/dist/"* ]]; then
    continue
  fi
  
  old_name=$(basename "$agent_dir")
  # Convertir kebab-case en CamelCase
  new_name=$(echo "$old_name" | sed -r 's/(^|-)([a-z])/\1\u\2/g' | sed 's/-//g')
  
  # Ne traiter que les répertoires d'agents
  if [[ "$agent_dir" == */agents/* ]] || [[ "$agent_dir" == */analyzers/* ]] || 
     [[ "$agent_dir" == */generators/* ]] || [[ "$agent_dir" == */orchestrators/* ]] || 
     [[ "$agent_dir" == */validators/* ]]; then
    
    new_dir=$(dirname "$agent_dir")/"$new_name"
    
    if [ "$old_name" != "$new_name" ]; then
      rename_agent_dir "$agent_dir" "$new_dir"
      update_references "$old_name" "$new_name"
    fi
  fi
done

# 4. Mettre à jour le fichier agent-import-mapping.json avec les nouveaux noms
echo "📝 Mise à jour du fichier agent-import-mapping.json..."
mapping_file="/workspaces/cahier-des-charge/agent-import-mapping.json"

if [ -f "$mapping_file" ]; then
  # Backup du fichier original
  cp "$mapping_file" "${mapping_file}.bak"
  
  # Mettre à jour avec de nouvelles entrées
  cat > "$mapping_file" << EOL
{
  "importMap": {
    "MysqlAnalyzer+optimizerAgent": "MysqlAnalyzerPlusOptimizerAgent",
    "PhpAnalyzer.workerAgent": "PhpAnalyzerDotWorkerAgent", 
    "SqlAnalyzer+prismaBuilderAgent": "SqlAnalyzerPlusPrismaBuilderAgent",
    "McpVerifier.workerAgent": "McpVerifierDotWorkerAgent",
    "SeoMeta.generatorAgent": "SeoMetaDotGeneratorAgent",
    "agent-audit": "AgentAudit",
    "agent-business": "AgentBusiness",
    "agent-donnees": "AgentDonnees",
    "agent-structure": "AgentStructure",
    "agent-quality": "AgentQuality"
  },
  "pathMap": {
    "MysqlAnalyzerPlusOptimizerAgent": "packages/mcp-agents/analyzers/MysqlAnalyzerPlusOptimizerAgent",
    "PhpAnalyzerDotWorkerAgent": "packages/mcp-agents/analyzers/PhpAnalyzerDotWorkerAgent",
    "SqlAnalyzerPlusPrismaBuilderAgent": "packages/mcp-agents/analyzers/SqlAnalyzerPlusPrismaBuilderAgent",
    "McpVerifierDotWorkerAgent": "packages/mcp-agents/orchestrators/McpVerifierDotWorkerAgent",
    "SeoMetaDotGeneratorAgent": "packages/mcp-agents/generators/SeoMetaDotGeneratorAgent",
    "AgentAudit": "agents/analysis/AgentAudit",
    "AgentBusiness": "agents/migration/AgentBusiness",
    "AgentDonnees": "agents/analysis/AgentDonnees",
    "AgentStructure": "agents/analysis/AgentStructure",
    "AgentQuality": "agents/quality/AgentQuality"
  }
}
EOL
  echo "✅ Mapping d'importation mis à jour"
fi

# 5. Exécuter le script update-agent-imports.js pour mettre à jour les importations
if [ -f "/workspaces/cahier-des-charge/update-agent-imports.js" ]; then
  echo "🔄 Exécution du script de mise à jour des importations..."
  node /workspaces/cahier-des-charge/update-agent-imports.js
fi

echo "✅ Standardisation des noms d'agents terminée"
echo "📋 Journal des renommages: $RENAME_LOG"