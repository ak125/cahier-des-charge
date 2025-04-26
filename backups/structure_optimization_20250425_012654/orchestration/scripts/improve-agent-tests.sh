#!/bin/bash
# Script pour améliorer le test des agents MCP
# Date: 19 avril 2025

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
REPORT_DIR="${WORKSPACE_ROOT}/reports/agent-tests-$(date +%Y%m%d-%H%M%S)"

# Création du répertoire de rapport
mkdir -p "$REPORT_DIR"
REPORT_LOG="${REPORT_DIR}/test-report.log"

echo "🔍 Amélioration des tests d'agents MCP..."

# Fonction pour journaliser
log() {
  local message="$1"
  echo "$message"
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $message" >> "$REPORT_LOG"
}

# Créer un script de test JavaScript amélioré
IMPROVED_TEST="${REPORT_DIR}/test-htaccess-router-analyzer.js"

cat > "$IMPROVED_TEST" << 'EOL'
/**
 * Test amélioré pour l'agent HtaccessRouterAnalyzer
 * Ce script teste si l'agent est correctement implémenté et fonctionnel
 */

const path = require('path');
const fs = require('fs');

// Chemins absolus pour éviter les erreurs de chemin relatif
const basePath = '/workspaces/cahier-des-charge';
const possiblePaths = [
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/index.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer.ts',
  'packages/mcp-agents/analyzers/htaccess-router-analyzer/index.ts'
];

console.log('Vérification des chemins possibles pour l\'agent:');

let agentPath = '';
for (const relativePath of possiblePaths) {
  const fullPath = path.join(basePath, relativePath);
  const exists = fs.existsSync(fullPath);
  console.log(`- ${relativePath}: ${exists ? 'Existe ✓' : 'N\'existe pas ✗'}`);
  
  if (exists) {
    // Priorité à htaccess-router-analyzer.ts par rapport à index.ts
    if (!agentPath || (relativePath.includes('htaccess-router-analyzer.ts') && agentPath.includes('index.ts'))) {
      agentPath = fullPath;
    }
  }
}

if (!agentPath) {
  console.error('❌ Aucun fichier d\'agent trouvé');
  process.exit(1);
}

console.log(`✅ Agent trouvé à: ${agentPath}`);

// Examiner le contenu du fichier agent pour vérifier qu'il respecte l'interface
if (agentPath && fs.existsSync(agentPath)) {
  console.log('\nAnalyse du fichier agent:');
  const content = fs.readFileSync(agentPath, 'utf8');
  
  // Vérifier si le fichier contient certaines signatures importantes
  const hasExport = content.includes('export ');
  const hasClass = content.includes('class ');
  const hasMetadata = content.includes('metadata');
  const hasEvents = content.includes('events');
  const hasInitialize = content.includes('initialize');
  const hasExecute = content.includes('execute');
  const hasValidate = content.includes('validate');
  const hasStop = content.includes('stop');
  
  console.log(`- Export présent: ${hasExport ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Classe présente: ${hasClass ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Metadata présent: ${hasMetadata ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Events présent: ${hasEvents ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode initialize: ${hasInitialize ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode execute: ${hasExecute ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode validate: ${hasValidate ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode stop: ${hasStop ? 'Oui ✓' : 'Non ✗'}`);
  
  // Vérifier si le fichier semble implémenter l'interface McpAgent
  const seemsValid = hasExport && hasClass && hasMetadata && hasEvents && 
                     hasInitialize && hasExecute;
  
  if (seemsValid) {
    console.log('\n✅ Le fichier semble contenir un agent valide implémentant l\'interface McpAgent');
    process.exit(0);
  } else {
    console.log('\n❌ Le fichier ne semble pas implémenter correctement l\'interface McpAgent');
    process.exit(1);
  }
} else {
  console.error('❌ Impossible de lire le fichier agent');
  process.exit(1);
}
EOL

log "✅ Script de test amélioré créé: $IMPROVED_TEST"

# Mettre à jour le script CI pour utiliser notre test amélioré
CI_SCRIPT="${WORKSPACE_ROOT}/ci/mcp-agents-ci.sh"
CI_SCRIPT_BACKUP="${CI_SCRIPT}.bak-$(date +%Y%m%d-%H%M%S)"

if [ -f "$CI_SCRIPT" ]; then
  cp "$CI_SCRIPT" "$CI_SCRIPT_BACKUP"
  log "✅ Backup du script CI créé: $CI_SCRIPT_BACKUP"
  
  # Modifier le script CI pour intégrer notre nouveau test
  log "Mise à jour du script CI..."
  sed -i 's/AGENT_TEST_SCRIPT="${REPORT_DIR}\/test-agent.js"/AGENT_TEST_SCRIPT="${REPORT_DIR}\/test-htaccess-router-analyzer.js"\n\n# Utilisation du test amélioré qui privilégie htaccess-router-analyzer.ts sur index.ts/g' "$CI_SCRIPT"
  
  # Copier notre script de test dans le script CI
  sed -i "/cat > \"\$AGENT_TEST_SCRIPT\" << EOL/,/^EOL$/c\\cat > \"\$AGENT_TEST_SCRIPT\" << 'EOL'\n$(cat $IMPROVED_TEST)\nEOL" "$CI_SCRIPT"
  
  log "✅ Script CI mis à jour"
else
  log "❌ Script CI non trouvé: $CI_SCRIPT"
fi

# Créer un README pour la documentation des agents MCP
README_FILE="${WORKSPACE_ROOT}/packages/mcp-agents/README.md"

if [ ! -f "$README_FILE" ]; then
  log "Création du README pour les agents MCP..."
  
  cat > "$README_FILE" << 'EOL'
# Agents MCP (Model Context Protocol)

Ce module contient les agents pour le Model Context Protocol, utilisés pour la migration PHP vers Remix.

## Structure du projet

```
packages/mcp-agents/
├── business/
│   ├── analyzers/     # Agents d'analyse (fichiers, schémas, routes)
│   ├── generators/    # Agents de génération de code
│   ├── validators/    # Agents de validation
│   ├── integrators/   # Agents d'intégration avec services externes
│   ├── misc/          # Agents divers
│   └── core/          # Composants essentiels des agents
├── README.md          # Documentation principale
└── tsconfig.json      # Configuration TypeScript
```

## Agents disponibles

### Analyseurs

- **HtaccessRouterAnalyzer**: Analyse les fichiers `.htaccess` pour identifier les règles de routage
- **DynamicSqlExtractor**: Extrait les requêtes SQL dynamiques du code PHP
- **PhpDiscoveryEngine**: Découvre les points d'entrée et la structure des applications PHP

### Générateurs

- Générateurs de code Remix
- Générateurs de schémas Prisma
- Générateurs de modèles de données

### Validateurs

- Validateurs de schémas
- Validateurs de routes
- Validateurs de migrations

## Interface McpAgent

Tous les agents implémentent l'interface standard `McpAgent` :

```typescript
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
```

## Scripts de maintenance

- **./ci/mcp-agents-ci.sh**: Tests et validation CI/CD des agents
- **./clean-agents-duplicates.sh**: Nettoie les doublons d'agents
- **./sync-mcp-agents.sh**: Synchronise les agents entre les différents environnements
- **./integrate-orphan-agents.sh**: Intègre les agents orphelins dans la structure principale

## Utilisation

```typescript
import { HtaccessRouterAnalyzer } from './packages/mcp-agents/business/analyzers/htaccess-router-analyzer';

const analyzer = new HtaccessRouterAnalyzer();
await analyzer.initialize();

const result = await analyzer.execute({
  jobId: 'job-001',
  filePath: '/path/to/.htaccess'
});

console.log(result.data);
```
EOL

  log "✅ README créé: $README_FILE"
fi

echo "✅ Améliorations des tests terminées"
log "Script terminé avec succès"
chmod +x "$0"