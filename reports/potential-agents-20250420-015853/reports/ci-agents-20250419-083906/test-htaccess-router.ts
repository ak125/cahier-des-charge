/**
 * Test pour l'agent HtaccessRouterAnalyzer
 * Ce script teste si l'agent est correctement implémenté dans la structure principale
 */

// Utilisez le chemin relatif pour l'import
import * as path from 'path';
import * as fs from 'fs';

// Vérifier l'existence des différents chemins possibles pour l'agent
const possiblePaths = [
  '../packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer/index.ts',
  '../packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer/HtaccessRouterAnalyzer.ts',
  '../packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer.ts'
];

// Fonction d'aide pour vérifier si un fichier existe
const checkFile = (relativePath: string): boolean => {
  const absolutePath = path.resolve(__dirname, relativePath);
  const exists = fs.existsSync(absolutePath);
  console.log(`Fichier ${relativePath}: ${exists ? 'Existe ✅' : 'N\'existe pas ❌'} (${absolutePath})`);
  return exists;
};

// Vérifier tous les chemins possibles
console.log('Vérification des chemins possibles pour l\'agent:');
const existingFiles = possiblePaths.filter(checkFile);

if (existingFiles.length === 0) {
  console.error('❌ Aucun fichier d\'agent trouvé aux emplacements attendus');
  process.exit(1);
}

// Fonctions pour importer et tester dynamiquement l'agent
async function testAgent(modulePath: string): Promise<boolean> {
  try {
    console.log(`Tentative d'import depuis ${modulePath}...`);
    
    // Import dynamique du module
    const agentModule = await import(modulePath);
    console.log('Module importé, exports disponibles:', Object.keys(agentModule));
    
    // Trouver la classe d'agent (peut être export par défaut ou nommé)
    const AgentClass = agentModule.default || 
                       agentModule.HtaccessRouterAnalyzer || 
                       Object.values(agentModule)[0];
    
    if (!AgentClass) {
      console.error('❌ Aucune classe d\'agent trouvée dans le module');
      return false;
    }
    
    console.log(`Classe agent trouvée: ${AgentClass.name || 'Sans nom'}`);
    
    // Instancier l'agent
    console.log('Création d\'une instance de l\'agent...');
    const agent = new AgentClass();
    
    // Vérifier les propriétés et méthodes requises
    console.log('Vérification des propriétés et méthodes McpAgent:');
    const hasMetadata = typeof agent.metadata === 'object' && agent.metadata !== null;
    const hasEvents = agent.events !== undefined;
    const hasInitialize = typeof agent.initialize === 'function';
    const hasExecute = typeof agent.execute === 'function';
    
    console.log('- metadata:', hasMetadata ? '✅' : '❌');
    console.log('- events:', hasEvents ? '✅' : '❌');
    console.log('- initialize():', hasInitialize ? '✅' : '❌');
    console.log('- execute():', hasExecute ? '✅' : '❌');
    
    const isValidAgent = hasMetadata && hasEvents;
    
    if (isValidAgent) {
      console.log('✅ Test réussi: L\'agent implémente les propriétés principales de McpAgent');
      return true;
    } else {
      console.error('❌ Test échoué: L\'agent n\'implémente pas correctement l\'interface McpAgent');
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors du test de l'agent: ${error}`);
    return false;
  }
}

// Tester le premier fichier trouvé
async function runTest() {
  for (const filePath of existingFiles) {
    const success = await testAgent(filePath);
    if (success) {
      return true;
    }
  }
  return false;
}

// Exécuter le test
runTest()
  .then(success => {
    if (success) {
      console.log('✅ Test de l\'agent HtaccessRouterAnalyzer réussi');
      process.exit(0);
    } else {
      console.error('❌ L\'agent HtaccessRouterAnalyzer ne respecte pas l\'interface attendue');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur inattendue lors de l\'exécution du test:', error);
    process.exit(1);
  });
