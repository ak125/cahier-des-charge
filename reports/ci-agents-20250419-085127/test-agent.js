/**
 * Test pour l'agent HtaccessRouterAnalyzer
 * Ce script teste si l'agent est correctement implémenté et fonctionnel
 */

const path = require('path');
const fs = require('fs');

// Chemins absolus pour éviter les erreurs de chemin relatif
const basePath = '/workspaces/cahier-des-charge';
const possiblePaths = [
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/index.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts',
  'packages/mcp-agents/business/analyzers/htaccess-router-analyzer.ts',
  'packages/mcp-agents/analyzers/htaccess-router-analyzer/index.ts',
];

console.log("Vérification des chemins possibles pour l'agent:");

let agentPath = '';
for (const relativePath of possiblePaths) {
  const fullPath = path.join(basePath, relativePath);
  const exists = fs.existsSync(fullPath);
  console.log(`- ${relativePath}: ${exists ? 'Existe ✓' : "N'existe pas ✗"}`);

  if (exists && !agentPath) {
    agentPath = fullPath;
  }
}

if (!agentPath) {
  console.error("❌ Aucun fichier d'agent trouvé");
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
  const seemsValid =
    hasExport && hasClass && hasMetadata && hasEvents && hasInitialize && hasExecute;

  if (seemsValid) {
    console.log(
      "\n✅ Le fichier semble contenir un agent valide implémentant l'interface McpAgent"
    );
    process.exit(0);
  } else {
    console.log("\n❌ Le fichier ne semble pas implémenter correctement l'interface McpAgent");
    process.exit(1);
  }
} else {
  console.error('❌ Impossible de lire le fichier agent');
  process.exit(1);
}
