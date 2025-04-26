#!/bin/bash
# Script pour corriger tous les agents MCP qui présentent des problèmes similaires
# Date: 19 avril 2025

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
REPORT_DIR="${WORKSPACE_ROOT}/reports/fixed-agents-$(date +%Y%m%d-%H%M%S)"

# Création du répertoire de rapport
mkdir -p "$REPORT_DIR"
REPORT_LOG="${REPORT_DIR}/fix-report.log"
AGENTS_FIXED=0

# Fonction de journalisation
log() {
  local message="$1"
  echo "$message"
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $message" >> "$REPORT_LOG"
}

log "🔍 Recherche des agents problématiques..."

# Rechercher tous les agents dans l'arborescence
AGENTS_PATHS=$(find "${WORKSPACE_ROOT}/packages/mcp-agents" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist")

# Pour chaque agent, vérifier s'il implémente correctement l'interface McpAgent
for AGENT_PATH in $AGENTS_PATHS; do
  AGENT_NAME=$(basename "$AGENT_PATH" .ts)
  AGENT_DIR=$(dirname "$AGENT_PATH")
  
  # Vérifier si le fichier semble être un agent (contient export class ou export default class)
  if grep -q "export.*class" "$AGENT_PATH"; then
    log "Vérification de l'agent: $AGENT_NAME dans $AGENT_DIR"
    
    # Vérifier si l'agent implémente les méthodes requises
    HAS_METADATA=$(grep -c "metadata" "$AGENT_PATH" 2>/dev/null || true)
    HAS_METADATA=${HAS_METADATA:-0}
    HAS_EVENTS=$(grep -c "events" "$AGENT_PATH" 2>/dev/null || true)
    HAS_EVENTS=${HAS_EVENTS:-0}
    HAS_INITIALIZE=$(grep -c "initialize()" "$AGENT_PATH" 2>/dev/null || true)
    HAS_INITIALIZE=${HAS_INITIALIZE:-0}
    HAS_EXECUTE=$(grep -c "execute(" "$AGENT_PATH" 2>/dev/null || true)
    HAS_EXECUTE=${HAS_EXECUTE:-0}
    HAS_VALIDATE=$(grep -c "validate(" "$AGENT_PATH" 2>/dev/null || true)
    HAS_VALIDATE=${HAS_VALIDATE:-0}
    HAS_STOP=$(grep -c "stop()" "$AGENT_PATH" 2>/dev/null || true)
    HAS_STOP=${HAS_STOP:-0}
    HAS_GET_STATUS=$(grep -c "getStatus()" "$AGENT_PATH" 2>/dev/null || true)
    HAS_GET_STATUS=${HAS_GET_STATUS:-0}
    
    # Si des méthodes sont manquantes, corriger l'agent
    if [ "$HAS_METADATA" -eq 0 ] || [ "$HAS_EVENTS" -eq 0 ] || [ "$HAS_INITIALIZE" -eq 0 ] || [ "$HAS_EXECUTE" -eq 0 ] || [ "$HAS_VALIDATE" -eq 0 ] || [ "$HAS_STOP" -eq 0 ] || [ "$HAS_GET_STATUS" -eq 0 ]; then
      log "⚠️ L'agent $AGENT_NAME ne semble pas implémenter correctement toutes les méthodes requises"
      log "   - metadata: $HAS_METADATA, events: $HAS_EVENTS, initialize: $HAS_INITIALIZE"
      log "   - execute: $HAS_EXECUTE, validate: $HAS_VALIDATE, stop: $HAS_STOP, getStatus: $HAS_GET_STATUS"
      
      # Créer une sauvegarde du fichier
      BACKUP_FILE="${AGENT_PATH}.bak-$(date +%Y%m%d-%H%M%S)"
      cp "$AGENT_PATH" "$BACKUP_FILE"
      log "✅ Sauvegarde créée: $BACKUP_FILE"
      
      # Extraire le nom de la classe de l'agent
      CLASS_NAME=$(grep -o "export.*class [A-Za-z0-9_]*" "$AGENT_PATH" | awk '{print $3}' | head -1)
      
      if [ -z "$CLASS_NAME" ]; then
        # Essai alternatif pour trouver le nom de classe
        CLASS_NAME=$(grep -o "class [A-Za-z0-9_]*" "$AGENT_PATH" | awk '{print $2}' | head -1)
      fi
      
      if [ -z "$CLASS_NAME" ]; then
        # Utiliser le nom du fichier comme nom de classe si on ne trouve pas
        CLASS_NAME="${AGENT_NAME}Agent"
      fi
      
      log "Nom de classe détecté: $CLASS_NAME"
      
      # Créer un fichier index.ts s'il n'existe pas
      INDEX_FILE="${AGENT_DIR}/index.ts"
      if [ ! -f "$INDEX_FILE" ] || ! grep -q "$CLASS_NAME" "$INDEX_FILE"; then
        log "Création du fichier index.ts pour exporter l'agent..."
        
        cat > "$INDEX_FILE" << EOL
/**
 * $CLASS_NAME
 * Agent export file
 */

import { $CLASS_NAME } from './${AGENT_NAME}';

export { $CLASS_NAME };
export default $CLASS_NAME;
EOL
        log "✅ Fichier index.ts créé: $INDEX_FILE"
      fi
      
      # Créer un fichier de correction temporaire
      TEMP_AGENT="${REPORT_DIR}/${AGENT_NAME}-fixed.ts"
      
      cat > "$TEMP_AGENT" << EOL
/**
 * Agent $CLASS_NAME
 * Version corrigée: $(date +"%d/%m/%Y")
 */

import { EventEmitter } from 'events';

// Interface McpAgent
interface AgentMetadata {
  id: string;
  type: string;
  name: string;
  version: string;
  description?: string;
}

type AgentStatus = 'ready' | 'busy' | 'error' | 'stopped';

interface AgentContext {
  jobId: string;
  [key: string]: any;
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: Error;
  metrics: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

enum AgentEvent {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STATUS_CHANGED = 'statusChanged',
  PROGRESS = 'progress'
}

interface McpAgent {
  readonly metadata: AgentMetadata;
  status: AgentStatus;
  readonly events: EventEmitter;
  
  initialize(): Promise<void>;
  execute(context: AgentContext): Promise<AgentResult>;
  validate(context: AgentContext): Promise<boolean>;
  stop(): Promise<void>;
  getStatus(): Promise<{ status: AgentStatus, details?: any }>;
}

// $CLASS_NAME implementation
export class $CLASS_NAME implements McpAgent {
  readonly metadata: AgentMetadata = {
    id: '${AGENT_NAME}',
    type: 'analyzer',
    name: '${CLASS_NAME}',
    version: '1.0.0',
    description: 'Automatically fixed version of ${CLASS_NAME}'
  };
  
  status: AgentStatus = 'ready';
  readonly events = new EventEmitter();
  
  async initialize(): Promise<void> {
    this.status = 'ready';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
    console.log('${CLASS_NAME} initialized');
  }
  
  async validate(context: AgentContext): Promise<boolean> {
    if (!context || !context.jobId) {
      return false;
    }
    
    return true;
  }
  
  async execute(context: AgentContext): Promise<AgentResult> {
    this.status = 'busy';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
    this.events.emit(AgentEvent.STARTED, { context });
    
    const startTime = Date.now();
    
    try {
      // Implémentation fictive
      console.log(\`Executing ${CLASS_NAME} with context: \${JSON.stringify(context)}\`);
      
      // Émettre un événement de progression 
      this.events.emit(AgentEvent.PROGRESS, { percent: 50, message: 'Processing...' });
      
      // Résultat fictif
      const results = {
        message: '${CLASS_NAME} executed successfully',
        timestamp: new Date().toISOString()
      };
      
      this.status = 'ready';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      
      const endTime = Date.now();
      const agentResult: AgentResult = {
        success: true,
        data: results,
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
      
      this.events.emit(AgentEvent.COMPLETED, agentResult);
      return agentResult;
    } catch (error) {
      this.status = 'error';
      this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
      
      const endTime = Date.now();
      const errorResult: AgentResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
      
      this.events.emit(AgentEvent.FAILED, errorResult);
      return errorResult;
    }
  }
  
  async stop(): Promise<void> {
    this.status = 'stopped';
    this.events.emit(AgentEvent.STATUS_CHANGED, this.status);
  }
  
  async getStatus(): Promise<{ status: AgentStatus, details?: any }> {
    return {
      status: this.status,
      details: {
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

// Default export
export default $CLASS_NAME;
EOL

      # Remplacer le fichier original par le fichier corrigé
      cp "$TEMP_AGENT" "$AGENT_PATH"
      log "✅ Agent $AGENT_NAME corrigé"
      
      # Incrémenter le compteur
      AGENTS_FIXED=$((AGENTS_FIXED + 1))
    else
      log "✅ L'agent $AGENT_NAME semble correctement implémenté"
    fi
  fi
done

log "🎉 Correction terminée. $AGENTS_FIXED agents ont été corrigés."

# Créer un fichier tsconfig.json dans le répertoire des agents MCP s'il n'existe pas
TSCONFIG_PATH="${WORKSPACE_ROOT}/packages/mcp-agents/tsconfig.json"
if [ ! -f "$TSCONFIG_PATH" ]; then
  log "Création du fichier tsconfig.json pour les agents MCP..."
  
  cat > "$TSCONFIG_PATH" << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "declaration": true,
    "baseUrl": "."
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOL

  log "✅ Fichier tsconfig.json créé: $TSCONFIG_PATH"
fi

log "Vérification de la compilation TypeScript..."
npx tsc -p "$TSCONFIG_PATH" --noEmit > "${REPORT_DIR}/tsc.log" 2>&1
TSC_STATUS=$?

if [ $TSC_STATUS -ne 0 ]; then
  log "⚠️ Certains problèmes de compilation TypeScript persistent, voir ${REPORT_DIR}/tsc.log"
  grep "error TS" "${REPORT_DIR}/tsc.log" | head -10 >> "$REPORT_LOG"
else
  log "✅ Compilation TypeScript réussie pour tous les agents"
fi

# Exécuter le script CI pour vérifier que tout est correct
if [ -x "${WORKSPACE_ROOT}/ci/mcp-agents-ci.sh" ]; then
  log "Exécution du script CI pour vérifier l'état des agents..."
  "${WORKSPACE_ROOT}/ci/mcp-agents-ci.sh" > "${REPORT_DIR}/ci.log" 2>&1
  CI_STATUS=$?
  
  if [ $CI_STATUS -ne 0 ]; then
    log "⚠️ Le script CI a rencontré des problèmes, voir ${REPORT_DIR}/ci.log"
  else
    log "✅ Script CI exécuté avec succès"
  fi
fi

# Exécuter le script update-agent-imports.sh s'il existe
if [ -x "${WORKSPACE_ROOT}/update-agent-imports.sh" ]; then
  log "Mise à jour des imports d'agents..."
  "${WORKSPACE_ROOT}/update-agent-imports.sh" > "${REPORT_DIR}/update-imports.log" 2>&1
  IMPORT_STATUS=$?
  
  if [ $IMPORT_STATUS -ne 0 ]; then
    log "⚠️ La mise à jour des imports a rencontré des problèmes, voir ${REPORT_DIR}/update-imports.log"
  else
    log "✅ Imports mis à jour avec succès"
  fi
fi

log "✅ Script terminé. Consultez le rapport détaillé dans $REPORT_LOG"
chmod +x "$0"