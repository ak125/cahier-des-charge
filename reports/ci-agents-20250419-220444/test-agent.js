/**
 * Test pour l'agent HtaccessRouterAnalyzer
 * Ce script teste directement le fichier d'implémentation
 */

const fs = require('fs');

// Chemin absolu du fichier d'implémentation
const implementationFile =
  '/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts';

console.log("Test de l'agent htaccess-router-analyzer");
console.log(`Fichier d'implémentation: ${implementationFile}`);

// Vérifier si le fichier existe
if (!fs.existsSync(implementationFile)) {
  console.error(`❌ Fichier non trouvé: ${implementationFile}`);
  process.exit(1);
}

// Lire le contenu du fichier
const content = fs.readFileSync(implementationFile, 'utf8');

// Vérifier les éléments requis pour l'interface McpAgent
const hasExport = content.includes('export ');
const hasClass = content.includes('class ');
const hasMetadata = content.includes('metadata');
const hasEvents = content.includes('events');
const hasInitialize = content.includes('initialize');
const hasExecute = content.includes('execute');
const hasValidate = content.includes('validate');
const hasStop = content.includes('stop');
const hasGetStatus = content.includes('getStatus');

console.log("Vérification de l'interface McpAgent:");
console.log(`- Export présent: ${hasExport ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Classe présente: ${hasClass ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Metadata présent: ${hasMetadata ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Events présent: ${hasEvents ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Méthode initialize: ${hasInitialize ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Méthode execute: ${hasExecute ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Méthode validate: ${hasValidate ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Méthode stop: ${hasStop ? 'Oui ✓' : 'Non ✗'}`);
console.log(`- Méthode getStatus: ${hasGetStatus ? 'Oui ✓' : 'Non ✗'}`);

// Vérifier la conformité globale
const requiredElements = [
  hasExport,
  hasClass,
  hasMetadata,
  hasEvents,
  hasInitialize,
  hasExecute,
  hasValidate,
  hasStop,
];
const isValid = requiredElements.every((element) => element === true);

if (isValid) {
  console.log("\n✅ Le fichier implémente correctement l'interface McpAgent");
  process.exit(0);
} else {
  console.error("\n❌ Le fichier n'implémente pas correctement l'interface McpAgent");
  const missingElements = [
    hasExport ? null : 'Export',
    hasClass ? null : 'Classe',
    hasMetadata ? null : 'Metadata',
    hasEvents ? null : 'Events',
    hasInitialize ? null : 'Méthode initialize',
    hasExecute ? null : 'Méthode execute',
    hasValidate ? null : 'Méthode validate',
    hasStop ? null : 'Méthode stop',
  ].filter(Boolean);

  console.error(`Éléments manquants: ${missingElements.join(', ')}`);
  process.exit(1);
}
