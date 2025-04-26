#!/bin/bash
# Script pour valider automatiquement tous les agents
# Vérifie si les agents respectent l'interface McpAgent
# Date: 19 avril 2025

echo "🔍 Validation des agents MCP..."

# Répertoire principal de travail
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
MCP_AGENTS_DIR="${WORKSPACE_ROOT}/packages/mcp-agents"
REPORT_DIR="${WORKSPACE_ROOT}/reports/agent-validation-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${REPORT_DIR}/validation-log.txt"
MANIFEST_FILE="${WORKSPACE_ROOT}/agent-manifest.json"

# Créer le répertoire pour les rapports
mkdir -p "$REPORT_DIR"
touch "$LOG_FILE"

log() {
  local message="$1"
  echo "$message"
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $message" >> "$LOG_FILE"
}

log "📝 Rapport de validation créé: $REPORT_DIR"

# Vérifier le manifeste
if [ ! -f "$MANIFEST_FILE" ]; then
  log "⚠️ Fichier manifeste non trouvé: $MANIFEST_FILE"
  log "Utilisation de la recherche de fichiers pour trouver les agents..."
  
  # Générer un fichier temporaire avec la liste des agents
  find "$MCP_AGENTS_DIR" -type f -name "*.ts" > "${REPORT_DIR}/agent-files.txt"
else
  log "✅ Fichier manifeste trouvé: $MANIFEST_FILE"
  
  # Extraire les chemins des agents du manifeste
  jq -r '.mainAgents | to_entries[] | .value.path' "$MANIFEST_FILE" > "${REPORT_DIR}/agent-files.txt"
fi

TOTAL_AGENTS=$(wc -l < "${REPORT_DIR}/agent-files.txt")
log "📊 $TOTAL_AGENTS agents trouvés pour validation"

# Créer un fichier tsconfig temporaire pour la validation
TEMP_TSCONFIG="${REPORT_DIR}/tsconfig.validation.json"
cat > "$TEMP_TSCONFIG" << EOL
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "${REPORT_DIR}/dist",
    "declaration": true
  },
  "include": [
    "${MCP_AGENTS_DIR}/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOL

# Créer un fichier TypeScript temporaire pour vérifier l'implémentation de McpAgent
VALIDATION_FILE="${REPORT_DIR}/validate-agent-interface.ts"
cat > "$VALIDATION_FILE" << EOL
import { McpAgent } from '${MCP_AGENTS_DIR}/core/interfaces';
import * as fs from 'fs';
import * as path from 'path';

const agentFile = process.argv[2];
if (!agentFile) {
  console.error('Aucun fichier d\'agent spécifié');
  process.exit(1);
}

async function validateAgent(filePath: string): Promise<boolean> {
  try {
    // Essayer d'importer l'agent
    const agentModule = await import(filePath);
    
    // Vérifier s'il y a une classe qui implémente McpAgent
    let hasValidAgent = false;
    let agentName = '';
    
    // Vérifier l'export par défaut
    if (agentModule.default) {
      const agent = new agentModule.default();
      if (isAgent(agent)) {
        hasValidAgent = true;
        agentName = agent.constructor.name;
      }
    }
    
    // Vérifier les autres exports
    for (const key in agentModule) {
      if (key === 'default') continue;
      
      const ExportedClass = agentModule[key];
      if (typeof ExportedClass === 'function') {
        try {
          const instance = new ExportedClass();
          if (isAgent(instance)) {
            hasValidAgent = true;
            agentName = instance.constructor.name;
            break;
          }
        } catch (e) {
          // Ignorer les erreurs de construction
        }
      }
    }
    
    if (hasValidAgent) {
      console.log(\`✅ L'agent \${agentName} dans \${path.basename(filePath)} implémente l'interface McpAgent\`);
      return true;
    } else {
      console.log(\`❌ Aucun agent dans \${path.basename(filePath)} n'implémente l'interface McpAgent\`);
      return false;
    }
  } catch (error) {
    console.error(\`❌ Erreur lors de la validation de \${path.basename(filePath)}:\`, error);
    return false;
  }
}

// Vérifier si un objet implémente l'interface McpAgent
function isAgent(obj: any): obj is McpAgent {
  return (
    obj &&
    typeof obj.initialize === 'function' &&
    typeof obj.execute === 'function' &&
    typeof obj.validate === 'function' &&
    typeof obj.stop === 'function' &&
    typeof obj.getStatus === 'function' &&
    obj.metadata &&
    obj.events
  );
}

validateAgent(agentFile)
  .then(isValid => {
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  });
EOL

# Résultats de validation
VALID_AGENTS=0
INVALID_AGENTS=0
FAILED_VALIDATION=0

# Parcourir tous les agents et les valider
while IFS= read -r agent_file; do
  log "🔍 Validation de: $(basename "$agent_file")"
  
  # Exécuter la validation avec Node.js
  if npx ts-node --skipProject --transpile-only "$VALIDATION_FILE" "$agent_file" >> "$LOG_FILE" 2>&1; then
    VALID_AGENTS=$((VALID_AGENTS + 1))
    log "  ✅ Agent valide"
  else
    INVALID_AGENTS=$((INVALID_AGENTS + 1))
    log "  ❌ Agent invalide"
    
    # Ajouter au rapport des agents invalides
    echo "- $(basename "$agent_file") ($(dirname "$agent_file"))" >> "${REPORT_DIR}/invalid-agents.md"
  fi
done < "${REPORT_DIR}/agent-files.txt"

# Créer un rapport de validation
REPORT_FILE="${REPORT_DIR}/validation-report.md"

cat > "$REPORT_FILE" << EOL
# Rapport de validation des agents MCP
Date: $(date +'%Y-%m-%d %H:%M:%S')

## Résumé
- **Agents validés**: ${VALID_AGENTS}/${TOTAL_AGENTS}
- **Agents invalides**: ${INVALID_AGENTS}/${TOTAL_AGENTS}
- **Taux de conformité**: $((VALID_AGENTS * 100 / TOTAL_AGENTS))%

## Recommandations
${INVALID_AGENTS} agents ne respectent pas complètement l'interface \`McpAgent\`. 
Pour corriger ces problèmes :

1. Exécutez \`./adapt-agents.sh\` pour adapter automatiquement les agents non conformes
2. Pour les agents plus complexes, consultez le rapport détaillé des agents invalides

## Agents invalides
$([ -f "${REPORT_DIR}/invalid-agents.md" ] && cat "${REPORT_DIR}/invalid-agents.md" || echo "Aucun agent invalide trouvé.")

## Prochain rapport planifié
$(date -d "+1 week" +'%Y-%m-%d')
EOL

log ""
log "📊 Résumé de la validation:"
log "  - Agents validés: ${VALID_AGENTS}/${TOTAL_AGENTS}"
log "  - Agents invalides: ${INVALID_AGENTS}/${TOTAL_AGENTS}"
log "  - Taux de conformité: $((VALID_AGENTS * 100 / TOTAL_AGENTS))%"
log ""
log "✅ Validation terminée!"
log "📝 Rapport complet disponible à: $REPORT_FILE"

# Rendre le script exécutable
chmod +x "$0"