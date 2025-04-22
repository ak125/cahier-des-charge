/**
 * Test pour l'agent HtaccessRouterAnalyzer
 * Ce script teste si l'agent est correctement implémenté et fonctionnel
 */

import * as path from 'path';
import * as fs from 'fs';

// Vérifier l'existence des chemins possibles
const basePath = '/workspaces/cahier-des-charge';
const possiblePaths = [
  'packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer/index.ts',
  'packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer.ts',
  'packagesDoDotmcp-agents/analyzers/HtaccessRouterAnalyzer/index.ts'
];

console.log('Vérification des chemins possibles pour l\'agent:');

let agentPath = '';
for (const relativePath of possiblePaths) {
  const fullPath = path.join(basePath, relativePath);
  const exists = fs.existsSync(fullPath);
  console.log(`- ${relativePath}: ${exists ? 'Existe ✓' : 'N\'existe pas ✗'}`);
  
  if (exists && !agentPath) {
    agentPath = fullPath;
  }
}

if (!agentPath) {
  console.error('❌ Aucun fichier d\'agent trouvé');
  process.exit(1);
}

console.log(`✅ Agent trouvé à: ${agentPath}`);

// Créer un fichier temporaire pour importer et tester l'agent
console.log('Création d\'un fichier de test temporaire...');

const tempTestDir = path.join(basePath, 'temp-test');
if (!fs.existsSync(tempTestDir)) {
  fs.mkdirSync(tempTestDir);
}

const tempFile = path.join(tempTestDir, 'test.js');
const agentRelativePath = path.relative(tempTestDir, agentPath).replace(/\.ts$/, '');

const testCode = `
const path = require('path');
try {
  console.log('Tentative d\\'import de l\\'agent...');
  const agentModule = require('${agentRelativePath.replace(/\\/g, '/')}');
  
  console.log('Module importé, clés disponibles:', Object.keys(agentModule));
  
  // Trouver la classe de l'agent
  let AgentClass = null;
  if (agentModule.default) {
    AgentClass = agentModule.default;
  } else if (agentModule.HtaccessRouterAnalyzer) {
    AgentClass = agentModule.HtaccessRouterAnalyzer;
  } else {
    // Chercher un constructeur ou une classe dans le module
    for (const key of Object.keys(agentModule)) {
      if (typeof agentModule[key] === 'function') {
        AgentClass = agentModule[key];
        break;
      }
    }
  }
  
  if (!AgentClass) {
    throw new Error('Classe d\\'agent non trouvée dans le module');
  }
  
  console.log('Classe d\\'agent trouvée:', AgentClass.name || 'Sans nom');
  
  // Instancier l'agent
  console.log('Création d\\'une instance...');
  const instance = new AgentClass();
  
  // Vérifier les propriétés et méthodes requises
  console.log('Vérification de l\\'interface McpAgent:');
  const checks = {
    metadata: typeof instance.metadata === 'object' && instance.metadata !== null,
    events: typeof instance.events !== 'undefined',
    initialize: typeof instance.initialize === 'function',
    execute: typeof instance.execute === 'function',
    validate: typeof instance.validate === 'function',
    stop: typeof instance.stop === 'function',
    getStatus: typeof instance.getStatus === 'function'
  };
  
  for (const [prop, result] of Object.entries(checks)) {
    console.log(\`- \${prop}: \${result ? '✅' : '❌'}\`);
  }
  
  const isValid = Object.values(checks).every(v => v);
  
  if (isValid) {
    console.log('\\n✅ L\\'agent HtaccessRouterAnalyzer implémente correctement l\\'interface McpAgent');
    process.exit(0);
  } else {
    console.error('\\n❌ L\\'agent HtaccessRouterAnalyzer n\\'implémente pas correctement l\\'interface McpAgent');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
}
`;

fs.writeFileSync(tempFile, testCode);
console.log(`✅ Fichier de test créé à: ${tempFile}`);
console.log('\nPour exécuter le test, utilisez la commande:');
console.log(`node ${tempFile}`);

// Créer un fichier tsconfig.json approprié pour l'agent
const tsConfigPath = path.join(basePath, 'packagesDoDotmcp-agents/tsconfig.json');
if (!fs.existsSync(tsConfigPath)) {
  console.log('\nCréation d\'un fichier tsconfig.json pour les agents...');
  
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "CommonJS",
      moduleResolution: "node",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      outDir: "dist",
      declaration: true,
      baseUrl: "."
    },
    include: [
      "**/*.ts"
    ],
    exclude: [
      "node_modules",
      "dist"
    ]
  };
  
  const tsConfigDir = path.dirname(tsConfigPath);
  if (!fs.existsSync(tsConfigDir)) {
    fs.mkdirSync(tsConfigDir, { recursive: true });
  }
  
  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  console.log(`✅ Fichier tsconfig.json créé à: ${tsConfigPath}`);
}

console.log('\nPour compiler l\'agent avec TypeScript, utilisez:');
console.log(`npx tsc -p ${tsConfigPath} --noEmit`);