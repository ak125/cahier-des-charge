#!/bin/bash

# Script de restructuration en architecture à trois couches
# Date: 10 mai 2025

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Restructuration en architecture à trois couches ===${NC}"

# Création du backup
BACKUP_DIR="backup/restructuration-trois-couches-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}Création d'une copie de sauvegarde...${NC}"
cp -R packages "$BACKUP_DIR/packages"
cp -R workspaces "$BACKUP_DIR/workspaces"
cp -R apps "$BACKUP_DIR/apps"
echo -e "${GREEN}✅ Sauvegarde créée dans: $BACKUP_DIR${NC}"

# Fichier de rapport
REPORT_FILE="cleanup-report/restructuration-trois-couches-$(date +%Y%m%d-%H%M%S).md"
echo "# Rapport de restructuration en architecture à trois couches" > "$REPORT_FILE"
echo "Date: $(date +%Y-%m-%d)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Actions effectuées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Création de la structure en trois couches si elle n'existe pas déjà
echo -e "${YELLOW}1. Création de la structure en trois couches...${NC}"
echo "### 1. Création de la structure en trois couches" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Couche Orchestration
mkdir -p "packages/orchestration/src"
mkdir -p "packages/orchestration/tests"
echo "- Création du dossier packages/orchestration" >> "$REPORT_FILE"

# Couche Coordination
mkdir -p "packages/coordination/src"
mkdir -p "packages/coordination/tests"
echo "- Création du dossier packages/coordination" >> "$REPORT_FILE"

# Couche Business
mkdir -p "packages/business/src"
mkdir -p "packages/business/tests"
echo "- Création du dossier packages/business" >> "$REPORT_FILE"

# Dossier Interfaces
mkdir -p "packages/interfaces/src"
mkdir -p "packages/interfaces/tests"
echo "- Création du dossier packages/interfaces" >> "$REPORT_FILE"

# Création des fichiers de base pour chaque couche
echo -e "${YELLOW}2. Création des fichiers de base pour chaque couche...${NC}"
echo "" >> "$REPORT_FILE"
echo "### 2. Création des fichiers de base pour chaque couche" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Couche Orchestration - fichiers de base
cat << 'EOF' > "packages/orchestration/src/index.ts"
/**
 * Couche Orchestration
 * Coordonne les workflows de haut niveau et l'interaction entre différents systèmes
 */

export * from './types';
export * from './workflows';
EOF

cat << 'EOF' > "packages/orchestration/src/types.ts"
/**
 * Types pour la couche Orchestration
 */

export interface WorkflowConfig {
  name: string;
  steps: WorkflowStep[];
  maxConcurrency?: number;
  timeout?: number;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  parameters: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowResult {
  id: string;
  status: 'success' | 'failure' | 'pending';
  results: Record<string, any>;
  errors?: Error[];
}
EOF

mkdir -p "packages/orchestration/src/workflows"
cat << 'EOF' > "packages/orchestration/src/workflows/index.ts"
/**
 * Exports pour les workflows de la couche Orchestration
 */

export * from './base-workflow';
EOF

cat << 'EOF' > "packages/orchestration/src/workflows/base-workflow.ts"
/**
 * Workflow de base pour la couche Orchestration
 */
import { WorkflowConfig, WorkflowResult } from '../types';

export class BaseWorkflow {
  protected config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  async execute(): Promise<WorkflowResult> {
    // Implémentation de base
    return {
      id: this.config.name,
      status: 'pending',
      results: {}
    };
  }
}
EOF

echo "- Fichiers de base créés pour la couche Orchestration" >> "$REPORT_FILE"

# Couche Coordination - fichiers de base
cat << 'EOF' > "packages/coordination/src/index.ts"
/**
 * Couche Coordination
 * Gère la communication entre les différentes couches et systèmes
 */

export * from './types';
export * from './adapters';
EOF

cat << 'EOF' > "packages/coordination/src/types.ts"
/**
 * Types pour la couche Coordination
 */

export interface AdapterConfig {
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  protocol?: string;
  timeout?: number;
}

export interface Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  destination: string;
}

export interface AdapterResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}
EOF

mkdir -p "packages/coordination/src/adapters"
cat << 'EOF' > "packages/coordination/src/adapters/index.ts"
/**
 * Exports pour les adaptateurs de la couche Coordination
 */

export * from './base-adapter';
EOF

cat << 'EOF' > "packages/coordination/src/adapters/base-adapter.ts"
/**
 * Adaptateur de base pour la couche Coordination
 */
import { AdapterConfig, Message, AdapterResult } from '../types';

export class BaseAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  async send(message: Message): Promise<AdapterResult> {
    // Implémentation de base
    return {
      success: true,
      messageId: message.id
    };
  }

  async receive(): Promise<Message | null> {
    // Implémentation de base
    return null;
  }
}
EOF

echo "- Fichiers de base créés pour la couche Coordination" >> "$REPORT_FILE"

# Couche Business - fichiers de base
cat << 'EOF' > "packages/business/src/index.ts"
/**
 * Couche Business
 * Contient la logique métier de l'application
 */

export * from './types';
export * from './agents';
export * from './validators';
export * from './analyzers';
EOF

cat << 'EOF' > "packages/business/src/types.ts"
/**
 * Types pour la couche Business
 */

export interface AgentConfig {
  name: string;
  type: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  errors?: Error[];
}

export interface AnalyzerConfig {
  target: string;
  depth?: number;
  filters?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning' | 'info';
}
EOF

mkdir -p "packages/business/src/agents"
cat << 'EOF' > "packages/business/src/agents/index.ts"
/**
 * Exports pour les agents de la couche Business
 */

export * from './base-agent';
EOF

cat << 'EOF' > "packages/business/src/agents/base-agent.ts"
/**
 * Agent de base pour la couche Business
 */
import { AgentConfig, AgentResult } from '../types';

export class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async execute(input: any): Promise<AgentResult> {
    // Implémentation de base
    return {
      success: true,
      data: {}
    };
  }
}
EOF

mkdir -p "packages/business/src/validators"
cat << 'EOF' > "packages/business/src/validators/index.ts"
/**
 * Exports pour les validateurs de la couche Business
 */

export * from './base-validator';
EOF

cat << 'EOF' > "packages/business/src/validators/base-validator.ts"
/**
 * Validateur de base pour la couche Business
 */
import { ValidationResult } from '../types';

export class BaseValidator {
  validate(data: any): ValidationResult {
    // Implémentation de base
    return {
      valid: true,
      errors: []
    };
  }
}
EOF

mkdir -p "packages/business/src/analyzers"
cat << 'EOF' > "packages/business/src/analyzers/index.ts"
/**
 * Exports pour les analyseurs de la couche Business
 */

export * from './base-analyzer';
EOF

cat << 'EOF' > "packages/business/src/analyzers/base-analyzer.ts"
/**
 * Analyseur de base pour la couche Business
 */
import { AnalyzerConfig } from '../types';

export class BaseAnalyzer {
  protected config: AnalyzerConfig;

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  async analyze(input: any): Promise<any> {
    // Implémentation de base
    return {};
  }
}
EOF

echo "- Fichiers de base créés pour la couche Business" >> "$REPORT_FILE"

# Interfaces - fichiers de base
cat << 'EOF' > "packages/interfaces/src/index.ts"
/**
 * Interfaces partagées entre les différentes couches
 */

export * from './agent';
export * from './workflow';
export * from './message';
EOF

cat << 'EOF' > "packages/interfaces/src/agent.ts"
/**
 * Interfaces pour les agents
 */

export interface Agent {
  name: string;
  execute(input: any): Promise<AgentResult>;
  configure(config: AgentConfig): void;
}

export interface AgentConfig {
  name: string;
  type: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  errors?: Error[];
}
EOF

cat << 'EOF' > "packages/interfaces/src/workflow.ts"
/**
 * Interfaces pour les workflows
 */

export interface Workflow {
  name: string;
  execute(): Promise<WorkflowResult>;
  addStep(step: WorkflowStep): void;
  removeStep(stepId: string): void;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  parameters: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowResult {
  id: string;
  status: 'success' | 'failure' | 'pending';
  results: Record<string, any>;
  errors?: Error[];
}
EOF

cat << 'EOF' > "packages/interfaces/src/message.ts"
/**
 * Interfaces pour les messages
 */

export interface Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  destination: string;
}

export interface MessageHandler {
  handleMessage(message: Message): Promise<void>;
  canHandle(message: Message): boolean;
}
EOF

echo "- Fichiers de base créés pour les interfaces" >> "$REPORT_FILE"

# Création des fichiers package.json pour chaque couche
echo -e "${YELLOW}3. Création des fichiers package.json pour chaque couche...${NC}"
echo "" >> "$REPORT_FILE"
echo "### 3. Création des fichiers package.json pour chaque couche" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat << 'EOF' > "packages/orchestration/package.json"
{
  "name": "@cahier-des-charge/orchestration",
  "version": "1.0.0",
  "description": "Couche d'orchestration pour l'architecture à trois couches",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@cahier-des-charge/interfaces": "*"
  }
}
EOF

cat << 'EOF' > "packages/coordination/package.json"
{
  "name": "@cahier-des-charge/coordination",
  "version": "1.0.0",
  "description": "Couche de coordination pour l'architecture à trois couches",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@cahier-des-charge/interfaces": "*"
  }
}
EOF

cat << 'EOF' > "packages/business/package.json"
{
  "name": "@cahier-des-charge/business",
  "version": "1.0.0",
  "description": "Couche business pour l'architecture à trois couches",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@cahier-des-charge/interfaces": "*"
  }
}
EOF

cat << 'EOF' > "packages/interfaces/package.json"
{
  "name": "@cahier-des-charge/interfaces",
  "version": "1.0.0",
  "description": "Interfaces partagées pour l'architecture à trois couches",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
EOF

echo "- Fichiers package.json créés pour chaque couche" >> "$REPORT_FILE"

# Migration des agents vers la nouvelle structure
echo -e "${YELLOW}4. Migration des agents vers la nouvelle structure...${NC}"
echo "" >> "$REPORT_FILE"
echo "### 4. Migration des agents vers la nouvelle structure" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -d "packages/mcp-agents/analyzers" ]; then
    echo "- Migration des agents depuis packages/mcp-agents/analyzers vers packages/business/src/agents" >> "$REPORT_FILE"
    
    # Créer des sous-dossiers par catégorie dans la couche business
    mkdir -p "packages/business/src/agents/analyzers"
    mkdir -p "packages/business/src/agents/validators"
    mkdir -p "packages/business/src/agents/generators"
    
    # Copier les analyseurs
    ANALYZER_AGENTS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -name "*analyzer*agent" -o -name "*-analyzer-*agent" -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*")
    for agent in $ANALYZER_AGENTS; do
        agent_name=$(basename "$agent")
        if [ -d "$agent" ]; then
            echo "  - Migration de $agent_name vers analyzers" >> "$REPORT_FILE"
            mkdir -p "packages/business/src/agents/analyzers/$agent_name"
            cp -R "$agent"/* "packages/business/src/agents/analyzers/$agent_name/"
        fi
    done
    
    # Copier les validateurs
    VALIDATOR_AGENTS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -name "*validator*agent" -o -name "*checker*agent" -o -name "*-validation-*agent" -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*")
    for agent in $VALIDATOR_AGENTS; do
        agent_name=$(basename "$agent")
        if [ -d "$agent" ]; then
            echo "  - Migration de $agent_name vers validators" >> "$REPORT_FILE"
            mkdir -p "packages/business/src/agents/validators/$agent_name"
            cp -R "$agent"/* "packages/business/src/agents/validators/$agent_name/"
        fi
    done
    
    # Copier les générateurs
    GENERATOR_AGENTS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -name "*generator*agent" -o -name "*builder*agent" -o -name "*-creator-*agent" -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*")
    for agent in $GENERATOR_AGENTS; do
        agent_name=$(basename "$agent")
        if [ -d "$agent" ]; then
            echo "  - Migration de $agent_name vers generators" >> "$REPORT_FILE"
            mkdir -p "packages/business/src/agents/generators/$agent_name"
            cp -R "$agent"/* "packages/business/src/agents/generators/$agent_name/"
        fi
    done
    
    # Tous les autres agents non catégorisés
    OTHER_AGENTS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*" | grep -v "analyzers$" | grep -v "validator" | grep -v "checker" | grep -v "generator" | grep -v "builder" | grep -v "analyzer")
    for agent in $OTHER_AGENTS; do
        agent_name=$(basename "$agent")
        if [ -d "$agent" ]; then
            echo "  - Migration de $agent_name vers le dossier racine des agents" >> "$REPORT_FILE"
            mkdir -p "packages/business/src/agents/$agent_name"
            cp -R "$agent"/* "packages/business/src/agents/$agent_name/"
        fi
    done
fi

# Mise à jour des imports dans les fichiers index
echo -e "${YELLOW}5. Mise à jour des fichiers index pour refléter la nouvelle structure...${NC}"
echo "" >> "$REPORT_FILE"
echo "### 5. Mise à jour des fichiers index" >> "$REPORT_FILE"

# Générer l'index pour les analyzers
ANALYZER_DIRS=$(find packages/business/src/agents/analyzers -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*" | grep -v "analyzers$")
if [ -n "$ANALYZER_DIRS" ]; then
    echo "// Autogénéré par le script de restructuration" > packages/business/src/agents/analyzers/index.ts
    echo "export * from './base-analyzer';" >> packages/business/src/agents/analyzers/index.ts
    
    for dir in $ANALYZER_DIRS; do
        dir_name=$(basename "$dir")
        if [ -f "$dir/index.ts" ]; then
            echo "export * from './$dir_name';" >> packages/business/src/agents/analyzers/index.ts
        fi
    done
    
    echo "- Fichier index.ts mis à jour pour analyzers" >> "$REPORT_FILE"
fi

# Générer l'index pour les validators
VALIDATOR_DIRS=$(find packages/business/src/agents/validators -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*" | grep -v "validators$")
if [ -n "$VALIDATOR_DIRS" ]; then
    echo "// Autogénéré par le script de restructuration" > packages/business/src/agents/validators/index.ts
    echo "export * from './base-validator';" >> packages/business/src/agents/validators/index.ts
    
    for dir in $VALIDATOR_DIRS; do
        dir_name=$(basename "$dir")
        if [ -f "$dir/index.ts" ]; then
            echo "export * from './$dir_name';" >> packages/business/src/agents/validators/index.ts
        fi
    done
    
    echo "- Fichier index.ts mis à jour pour validators" >> "$REPORT_FILE"
fi

# Générer l'index pour les generators
GENERATOR_DIRS=$(find packages/business/src/agents/generators -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*" | grep -v "generators$")
if [ -n "$GENERATOR_DIRS" ]; then
    echo "// Autogénéré par le script de restructuration" > packages/business/src/agents/generators/index.ts
    echo "export * from './base-generator';" >> packages/business/src/agents/generators/index.ts
    
    for dir in $GENERATOR_DIRS; do
        dir_name=$(basename "$dir")
        if [ -f "$dir/index.ts" ]; then
            echo "export * from './$dir_name';" >> packages/business/src/agents/generators/index.ts
        fi
    done
    
    echo "- Fichier index.ts mis à jour pour generators" >> "$REPORT_FILE"
fi

# Migration des orchestrateurs
echo -e "${YELLOW}6. Migration des orchestrateurs vers la couche d'orchestration...${NC}"
echo "" >> "$REPORT_FILE"
echo "### 6. Migration des orchestrateurs" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Rechercher les orchestrateurs potentiels
ORCHESTRATORS=$(find . -type f \( -name "*orchestrator*.ts" -o -name "*orchestration*.ts" \) -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" -not -path "*.cache*" -not -path "*coverage*" -not -path "*vendor*" -not -path "*build*" -not -path "*out*" -not -path "*.vscode*")
for orch in $ORCHESTRATORS; do
    filename=$(basename "$orch")
    dir_name=$(dirname "$filename" | cut -d'/' -f1)
    
    # Créer un dossier pour chaque type d'orchestrateur trouvé
    if [[ $orch == *"migration"* ]]; then
        target_dir="packages/orchestration/src/workflows/migration"
    elif [[ $orch == *"pipeline"* ]]; then
        target_dir="packages/orchestration/src/workflows/pipeline"
    else
        target_dir="packages/orchestration/src/workflows/general"
    fi
    
    mkdir -p "$target_dir"
    cp "$orch" "$target_dir/$filename"
    echo "- Orchestrateur migré: $orch -> $target_dir/$filename" >> "$REPORT_FILE"
done

echo -e "\n${GREEN}✅ Restructuration en architecture à trois couches terminée !${NC}"
echo -e "${BLUE}Rapport disponible dans: $REPORT_FILE${NC}"
echo -e "${YELLOW}Il peut être nécessaire de mettre à jour les imports dans les fichiers pour refléter la nouvelle structure.${NC}"

# Mise à jour du rapport final
echo -e "\n## Prochaines étapes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Mettre à jour les imports dans tous les fichiers pour refléter la nouvelle structure" >> "$REPORT_FILE"
echo "2. Tester la nouvelle structure pour s'assurer que tout fonctionne correctement" >> "$REPORT_FILE"
echo "3. Mettre à jour la documentation pour refléter la nouvelle structure" >> "$REPORT_FILE"
echo "4. Mettre à jour les fichiers de configuration de build pour la nouvelle structure" >> "$REPORT_FILE"
