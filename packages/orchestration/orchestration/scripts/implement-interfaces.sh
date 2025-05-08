#!/bin/bash

# Script pour implémenter formellement les interfaces dans tous les agents
# Date: 21 avril 2025

echo "🛠️ Implémentation formelle des interfaces dans les agents"

# Création d'un journal des modifications
REPORT_DIR="/workspaces/cahier-des-charge/reports"
mkdir -p "$REPORT_DIR"
INTERFACES_LOG="$REPORT_DIR/interfaces-implementation-$(date +"%Y%m%d-%H%M%S").log"

echo "Implémentation des interfaces - $(date)" > "$INTERFACES_LOG"
echo "=======================================" >> "$INTERFACES_LOG"

# 1. Vérifier et créer les interfaces de base si nécessaires
echo "🔍 Vérification des interfaces de base..."

# Créer les répertoires d'interfaces s'ils n'existent pas
mkdir -p "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces"
mkdir -p "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/analyzer"
mkdir -p "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/generator"
mkdir -p "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/orchestrator"
mkdir -p "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/validator"

# Créer l'interface de base McpAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/mcp-agent.ts" << EOL
/**
 * Interface de base pour tous les agents MCP
 */
export interface McpAgent {
  /** Nom unique de l'agent */
  name: string;
  
  /** Version actuelle de l'agent */
  version: string;
  
  /** Description courte des fonctionnalités */
  description?: string;
  
  /** Initialisation de l'agent avec configuration */
  initialize?(config: Record<string, any>): Promise<void>;
  
  /** Méthode principale d'exécution de l'agent */
  execute(params: Record<string, any>): Promise<Record<string, any>>;
  
  /** Vérifie si l'agent est initialisé et prêt */
  isReady?(): boolean;
  
  /** Libère les ressources utilisées par l'agent */
  shutdown?(): Promise<void>;
  
  /** Retourne les métadonnées de l'agent */
  getMetadata?(): Record<string, any>;
}
EOL

echo "✅ Interface McpAgent créée" | tee -a "$INTERFACES_LOG"

# Créer l'interface BaseAgent qui étend McpAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/base-agent.ts" << EOL
import { McpAgent } from './mcp-agent';

/**
 * Interface de base étendue avec fonctionnalités additionnelles communes
 */
export interface BaseAgent extends McpAgent {
  /** Domaine fonctionnel de l'agent */
  domain: string;
  
  /** Liste des capacités de l'agent */
  capabilities: string[];
  
  /** Retourne un résumé textuel des fonctionnalités */
  getSummary(): string;
  
  /** Vérifie la compatibilité avec un autre agent */
  checkCompatibility?(otherAgent: McpAgent): Promise<boolean>;
  
  /** Journalise un message avec niveau de log */
  log?(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
}
EOL

echo "✅ Interface BaseAgent créée" | tee -a "$INTERFACES_LOG"

# Créer les interfaces spécifiques à chaque type d'agent
# 1. AnalyzerAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/analyzer/analyzer-agent.ts" << EOL
import { BaseAgent } from '../base-agent';

/**
 * Interface pour les agents d'analyse de données ou de code
 */
export interface AnalyzerAgent extends BaseAgent {
  /** Réalise une analyse sur les données d'entrée */
  analyze(input: Record<string, any>): Promise<Record<string, any>>;
  
  /** Configuration spécifique à l'analyse */
  analysisConfig?: Record<string, any>;
  
  /** Vérifie si les données d'entrée sont valides pour l'analyse */
  validateInput?(input: Record<string, any>): boolean;
  
  /** Liste des formats d'entrée supportés */
  supportedFormats?: string[];
}
EOL

echo "✅ Interface AnalyzerAgent créée" | tee -a "$INTERFACES_LOG"

# 2. GeneratorAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/generator/generator-agent.ts" << EOL
import { BaseAgent } from '../base-agent';

/**
 * Interface pour les agents de génération de code, contenu ou configuration
 */
export interface GeneratorAgent extends BaseAgent {
  /** Génère du contenu à partir des données d'entrée */
  generate(input: Record<string, any>): Promise<Record<string, any>>;
  
  /** Configuration spécifique à la génération */
  generationConfig?: Record<string, any>;
  
  /** Formats de sortie supportés */
  outputFormats?: string[];
  
  /** Vérifie si le contenu généré est valide */
  validateOutput?(output: Record<string, any>): boolean;
  
  /** Options de formatage de la sortie */
  formatOptions?: Record<string, any>;
}
EOL

echo "✅ Interface GeneratorAgent créée" | tee -a "$INTERFACES_LOG"

# 3. OrchestratorAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/orchestrator/orchestrator-agent.ts" << EOL
import { BaseAgent } from '../base-agent';
import { McpAgent } from '../mcp-agent';

/**
 * Interface pour les agents d'orchestration qui coordonnent d'autres agents
 */
export interface OrchestratorAgent extends BaseAgent {
  /** Orchestrer l'exécution d'une chaîne d'agents */
  orchestrate(agents: McpAgent[], params: Record<string, any>): Promise<Record<string, any>>;
  
  /** Enregistrer un agent dans l'orchestrateur */
  registerAgent?(agent: McpAgent): Promise<void>;
  
  /** Désenregistrer un agent */
  unregisterAgent?(agentName: string): Promise<void>;
  
  /** Liste des agents enregistrés */
  registeredAgents?: McpAgent[];
  
  /** Récupère l'état du système d'orchestration */
  getSystemState?(): Promise<Record<string, any>>;
  
  /** Supervise l'exécution d'une tâche */
  monitorExecution?(jobId: string): Promise<Record<string, any>>;
}
EOL

echo "✅ Interface OrchestratorAgent créée" | tee -a "$INTERFACES_LOG"

# 4. ValidatorAgent
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/validator/validator-agent.ts" << EOL
import { BaseAgent } from '../base-agent';

/**
 * Interface pour les agents de validation et vérification
 */
export interface ValidatorAgent extends BaseAgent {
  /** Valide les données d'entrée selon un schéma ou des règles */
  validate(input: Record<string, any>): Promise<Record<string, any>>;
  
  /** Règles de validation configurables */
  validationRules?: Record<string, any>;
  
  /** Niveau de sévérité des erreurs à remonter */
  severityLevel?: 'info' | 'warning' | 'error' | 'critical';
  
  /** Vérifie la conformité à un standard spécifique */
  checkCompliance?(standard: string, input: Record<string, any>): Promise<boolean>;
  
  /** Formats des rapports d'erreurs */
  errorReportFormat?: 'simple' | 'detailed' | 'json';
}
EOL

echo "✅ Interface ValidatorAgent créée" | tee -a "$INTERFACES_LOG"

# Créer des index pour exporter les interfaces
cat > "/workspaces/cahier-des-charge/packages/mcp-agents/interfaces/index.ts" << EOL
// Exports des interfaces principales
export * from './mcp-agent';
export * from './base-agent';
export * from './analyzer/analyzer-agent';
export * from './generator/generator-agent';
export * from './orchestrator/orchestrator-agent';
export * from './validator/validator-agent';
EOL

# Chercher tous les fichiers d'agents pour implémenter les interfaces
echo "🔍 Recherche des agents à mettre à jour..." | tee -a "$INTERFACES_LOG"

# 1. Trouver tous les agents d'analyse
analyzer_agents=$(find /workspaces/cahier-des-charge -path "*/analyzers/*/*.ts" -or -path "*/analysis/*/*.ts" | grep -v "index.ts" | grep -v "interfaces")

for agent_file in $analyzer_agents; do
  echo "🛠️ Mise à jour de l'agent d'analyse: $agent_file" | tee -a "$INTERFACES_LOG"
  
  # Vérifier si le fichier implémente déjà une interface
  if grep -q "implements" "$agent_file"; then
    echo "  ✓ Déjà implémenté" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Extraire le nom de la classe
  class_name=$(grep -oP "(?<=class\s+)(\w+)" "$agent_file" | head -1)
  
  if [ -z "$class_name" ]; then
    echo "  ⚠️ Pas de classe trouvée, ignoré" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Ajouter l'import de l'interface
  sed -i '1s/^/import { AnalyzerAgent } from "..\/..\/interfaces\/analyzer\/analyzer-agent";\n/' "$agent_file"
  
  # Ajouter l'implémentation de l'interface
  sed -i "s/class $class_name/class $class_name implements AnalyzerAgent/" "$agent_file"
  
  # Vérifier si les propriétés et méthodes obligatoires sont présentes
  if ! grep -q "name\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  name = \"$class_name\";" "$agent_file"
  fi
  
  if ! grep -q "version\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  version = \"1.0.0\";" "$agent_file"
  fi
  
  if ! grep -q "domain\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  domain = \"analysis\";" "$agent_file"
  fi
  
  if ! grep -q "capabilities\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  capabilities = [\"analyze\"];" "$agent_file"
  fi
  
  # Ajouter la méthode getSummary si elle n'existe pas
  if ! grep -q "getSummary" "$agent_file"; then
    sed -i "/class $class_name/a \  getSummary(): string {\n    return \`\${this.name} v\${this.version} - Agent d'analyse\`;\n  }" "$agent_file"
  fi
  
  # Ajouter la méthode analyze si elle n'existe pas
  if ! grep -q "analyze" "$agent_file" && ! grep -q "analyse" "$agent_file"; then
    sed -i "/class $class_name/a \  async analyze(input: Record<string, any>): Promise<Record<string, any>> {\n    return await this.execute(input);\n  }" "$agent_file"
  fi
  
  echo "  ✅ Interface implémentée" | tee -a "$INTERFACES_LOG"
done

# 2. Trouver tous les agents de génération
generator_agents=$(find /workspaces/cahier-des-charge -path "*/generators/*/*.ts" | grep -v "index.ts" | grep -v "interfaces")

for agent_file in $generator_agents; do
  echo "🛠️ Mise à jour de l'agent de génération: $agent_file" | tee -a "$INTERFACES_LOG"
  
  # Vérifier si le fichier implémente déjà une interface
  if grep -q "implements" "$agent_file"; then
    echo "  ✓ Déjà implémenté" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Extraire le nom de la classe
  class_name=$(grep -oP "(?<=class\s+)(\w+)" "$agent_file" | head -1)
  
  if [ -z "$class_name" ]; then
    echo "  ⚠️ Pas de classe trouvée, ignoré" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Ajouter l'import de l'interface
  sed -i '1s/^/import { GeneratorAgent } from "..\/..\/interfaces\/generator\/generator-agent";\n/' "$agent_file"
  
  # Ajouter l'implémentation de l'interface
  sed -i "s/class $class_name/class $class_name implements GeneratorAgent/" "$agent_file"
  
  # Vérifier si les propriétés et méthodes obligatoires sont présentes
  if ! grep -q "name\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  name = \"$class_name\";" "$agent_file"
  fi
  
  if ! grep -q "version\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  version = \"1.0.0\";" "$agent_file"
  fi
  
  if ! grep -q "domain\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  domain = \"generation\";" "$agent_file"
  fi
  
  if ! grep -q "capabilities\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  capabilities = [\"generate\"];" "$agent_file"
  fi
  
  # Ajouter la méthode getSummary si elle n'existe pas
  if ! grep -q "getSummary" "$agent_file"; then
    sed -i "/class $class_name/a \  getSummary(): string {\n    return \`\${this.name} v\${this.version} - Agent de génération\`;\n  }" "$agent_file"
  fi
  
  # Ajouter la méthode generate si elle n'existe pas
  if ! grep -q "generate" "$agent_file"; then
    sed -i "/class $class_name/a \  async generate(input: Record<string, any>): Promise<Record<string, any>> {\n    return await this.execute(input);\n  }" "$agent_file"
  fi
  
  echo "  ✅ Interface implémentée" | tee -a "$INTERFACES_LOG"
done

# 3. Trouver tous les agents d'orchestration
orchestrator_agents=$(find /workspaces/cahier-des-charge -path "*/orchestrators/*/*.ts" | grep -v "index.ts" | grep -v "interfaces")

for agent_file in $orchestrator_agents; do
  echo "🛠️ Mise à jour de l'agent d'orchestration: $agent_file" | tee -a "$INTERFACES_LOG"
  
  # Vérifier si le fichier implémente déjà une interface
  if grep -q "implements" "$agent_file"; then
    echo "  ✓ Déjà implémenté" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Extraire le nom de la classe
  class_name=$(grep -oP "(?<=class\s+)(\w+)" "$agent_file" | head -1)
  
  if [ -z "$class_name" ]; then
    echo "  ⚠️ Pas de classe trouvée, ignoré" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Ajouter l'import de l'interface
  sed -i '1s/^/import { OrchestratorAgent } from "..\/..\/interfaces\/orchestrator\/orchestrator-agent";\n/' "$agent_file"
  sed -i '1s/^/import { McpAgent } from "..\/..\/interfaces\/mcp-agent";\n/' "$agent_file"
  
  # Ajouter l'implémentation de l'interface
  sed -i "s/class $class_name/class $class_name implements OrchestratorAgent/" "$agent_file"
  
  # Vérifier si les propriétés et méthodes obligatoires sont présentes
  if ! grep -q "name\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  name = \"$class_name\";" "$agent_file"
  fi
  
  if ! grep -q "version\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  version = \"1.0.0\";" "$agent_file"
  fi
  
  if ! grep -q "domain\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  domain = \"orchestration\";" "$agent_file"
  fi
  
  if ! grep -q "capabilities\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  capabilities = [\"orchestrate\"];" "$agent_file"
  fi
  
  # Ajouter la méthode getSummary si elle n'existe pas
  if ! grep -q "getSummary" "$agent_file"; then
    sed -i "/class $class_name/a \  getSummary(): string {\n    return \`\${this.name} v\${this.version} - Agent d'orchestration\`;\n  }" "$agent_file"
  fi
  
  # Ajouter la méthode orchestrate si elle n'existe pas
  if ! grep -q "orchestrate" "$agent_file"; then
    sed -i "/class $class_name/a \  async orchestrate(agents: McpAgent[], params: Record<string, any>): Promise<Record<string, any>> {\n    return await this.execute({ agents, ...params });\n  }" "$agent_file"
  fi
  
  echo "  ✅ Interface implémentée" | tee -a "$INTERFACES_LOG"
done

# 4. Trouver tous les agents de validation
validator_agents=$(find /workspaces/cahier-des-charge -path "*/validators/*/*.ts" | grep -v "index.ts" | grep -v "interfaces")

for agent_file in $validator_agents; do
  echo "🛠️ Mise à jour de l'agent de validation: $agent_file" | tee -a "$INTERFACES_LOG"
  
  # Vérifier si le fichier implémente déjà une interface
  if grep -q "implements" "$agent_file"; then
    echo "  ✓ Déjà implémenté" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Extraire le nom de la classe
  class_name=$(grep -oP "(?<=class\s+)(\w+)" "$agent_file" | head -1)
  
  if [ -z "$class_name" ]; then
    echo "  ⚠️ Pas de classe trouvée, ignoré" | tee -a "$INTERFACES_LOG"
    continue
  fi
  
  # Ajouter l'import de l'interface
  sed -i '1s/^/import { ValidatorAgent } from "..\/..\/interfaces\/validator\/validator-agent";\n/' "$agent_file"
  
  # Ajouter l'implémentation de l'interface
  sed -i "s/class $class_name/class $class_name implements ValidatorAgent/" "$agent_file"
  
  # Vérifier si les propriétés et méthodes obligatoires sont présentes
  if ! grep -q "name\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  name = \"$class_name\";" "$agent_file"
  fi
  
  if ! grep -q "version\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  version = \"1.0.0\";" "$agent_file"
  fi
  
  if ! grep -q "domain\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  domain = \"validation\";" "$agent_file"
  fi
  
  if ! grep -q "capabilities\s*=" "$agent_file"; then
    sed -i "/class $class_name/a \  capabilities = [\"validate\"];" "$agent_file"
  fi
  
  # Ajouter la méthode getSummary si elle n'existe pas
  if ! grep -q "getSummary" "$agent_file"; then
    sed -i "/class $class_name/a \  getSummary(): string {\n    return \`\${this.name} v\${this.version} - Agent de validation\`;\n  }" "$agent_file"
  fi
  
  # Ajouter la méthode validate si elle n'existe pas
  if ! grep -q "validate" "$agent_file"; then
    sed -i "/class $class_name/a \  async validate(input: Record<string, any>): Promise<Record<string, any>> {\n    return await this.execute(input);\n  }" "$agent_file"
  fi
  
  echo "  ✅ Interface implémentée" | tee -a "$INTERFACES_LOG"
done

echo "✅ Implémentation des interfaces terminée"
echo "📋 Journal d'implémentation : $INTERFACES_LOG"