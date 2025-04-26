/**
 * Test pour l'agent HtaccessRouterAnalyzer
 * Ce script teste si l'agent est correctement implémenté et fonctionnel
 */

const path = require(pathstructure-agent');
const fs = require(fsstructure-agent');

// Vérifier l'existence des chemins possibles
const basePath = '/workspaces/cahier-des-charge';
const possiblePaths = [
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/index.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer.ts',
  'packages/mcp-agents/analyzers/htaccess-router-analyzer/index.ts'
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

// Créer un fichier tsconfig.json approprié pour l'agent
const tsConfigPath = path.join(basePath, 'packages/mcp-agents/tsconfig.json');
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

// Afficher les instructions pour compiler et tester manuellement
console.log('\nInstructions pour tester l\'agent htaccess-router-analyzer:');
console.log('--------------------------------------------------------');
console.log('1. Installer ts-node si ce n\'est pas déjà fait:');
console.log('   npm install -g ts-node typescript');
console.log('\n2. Exécuter la commande suivante à la racine du projet:');
console.log(`   TS_NODE_PROJECT="${tsConfigPath}" ts-node --transpile-only ${agentPath}`);
console.log('\n3. Pour compiler l\'agent avec TypeScript, utilisez:');
console.log(`   npx tsc -p ${tsConfigPath} --noEmit`);

// Examiner le contenu du fichier agent pour fournir des informations supplémentaires
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
  
  console.log(`- Export présent: ${hasExport ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Classe présente: ${hasClass ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Metadata présent: ${hasMetadata ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Events présent: ${hasEvents ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode initialize: ${hasInitialize ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`- Méthode execute: ${hasExecute ? 'Oui ✓' : 'Non ✗'}`);
  
  // Vérifier si le fichier semble implémenter l'interface McpAgent
  const seemsValid = hasExport && hasClass && hasMetadata && hasEvents && hasInitialize && hasExecute;
  
  if (seemsValid) {
    console.log('\n✅ Le fichier semble contenir un agent valide implémentant l\'interface McpAgent');
  } else {
    console.log('\n⚠️ Le fichier pourrait ne pas implémenter correctement l\'interface McpAgent');
  }
}