#!/bin/bash

# Script de réorganisation du monorepo MCP
# Crée et organise les dossiers selon la structure recommandée

set -e

echo "🚀 Réorganisation du monorepo MCP..."

# Création de la structure des packages
mkdir -p packages/mcp-agents/{php-analyzer,remix-generator,seo-checker,sql-mapper,htaccess-router,qa-analyzer,status-tracker,migration-orchestrator,shared}
mkdir -p packages/remix-ui/{components,layouts,inputs,hooks}
mkdir -p packages/types/{dto,remix,nestjs,prisma}
mkdir -p packages/eslint-config

# Création/organisation des apps
mkdir -p apps/admin-dashboard/{app,routes,components,seo}

echo "📦 Migration des agents existants..."

# Déplacer les agents existants vers la nouvelle structure
for agent in php-analyzer remix-generator seo-checker sql-mapper htaccess-router qa-analyzer status-tracker migration-orchestrator; do
  if [ -d "agents/$agent" ]; then
    echo "  - Migration de l'agent $agent..."
    cp -r "agents/$agent/"* "packages/mcp-agents/$agent/"
  elif [ -f "agents/$agent.ts" ]; then
    echo "  - Migration du fichier agent $agent.ts..."
    cp "agents/$agent.ts" "packages/mcp-agents/$agent/index.ts"
  fi
done

# Création des fichiers de base pour l'API commune des agents
echo "📄 Création de l'API commune pour les agents MCP..."
cat > packages/mcp-agents/shared/types.ts << EOF
export interface AgentContext {
  jobId: string;
  sourceFile?: string;
  targetFile?: string;
  options?: Record<string, any>;
  dryRun?: boolean;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  score?: number;
  duration?: number;
}

export interface McpAgent {
  name: string;
  version: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
  validate?(context: AgentContext): Promise<boolean>;
  getStatus?(): Promise<{ status: 'ready' | 'busy' | 'error', message?: string }>;
}
EOF

cat > packages/mcp-agents/shared/base-agent.ts << EOF
import { AgentContext, AgentResult, McpAgent } from './types';

export abstract class BaseMcpAgent implements McpAgent {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  abstract execute(context: AgentContext): Promise<AgentResult>;
  
  async validate(context: AgentContext): Promise<boolean> {
    // Validation de base - peut être surchargée par les agents spécifiques
    return !!context && !!context.jobId;
  }
  
  async getStatus(): Promise<{ status: 'ready' | 'busy' | 'error'; message?: string }> {
    return { status: 'ready' };
  }
  
  protected async logExecution(context: AgentContext, message: string): Promise<void> {
    console.log(\`[\${this.name}] \${message} (JobID: \${context.jobId})\`);
  }
}
EOF

# Création du fichier d'index pour exporter tous les agents
cat > packages/mcp-agents/index.ts << EOF
// Export de tous les agents MCP
export * from './php-analyzer';
export * from './remix-generator';
export * from './seo-checker';
export * from './sql-mapper';
export * from './htaccess-router';
export * from './qa-analyzer';
export * from './status-tracker';
export * from './migration-orchestrator';
export * from './shared/types';
export * from './shared/base-agent';
EOF

echo "🔧 Mise à jour des configurations..."

# Création/mise à jour du package.json pour mcp-agents
cat > packages/mcp-agents/package.json << EOF
{
  "name": "@mcp/agents",
  "version": "1.0.0",
  "description": "Agents MCP pour la migration PHP vers Remix",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "bullmq": "^4.0.0",
    "node-fetch": "^3.3.0",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.11",
    "jest": "^29.5.0",
    "typescript": "^5.0.4"
  }
}
EOF

echo "✅ Réorganisation du monorepo terminée !"
echo "Pour compléter la migration, effectuez les ajustements manuels nécessaires et mettez à jour les importations."