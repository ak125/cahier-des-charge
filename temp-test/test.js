const path = require('path');
try {
  console.log('Tentative d\'import de l\'agent...');
  const agentModule = require('/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/htaccess-router-analyzer/index');
  
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
    throw new Error('Classe d\'agent non trouvée dans le module');
  }
  
  console.log('Classe d\'agent trouvée:', AgentClass.name || 'Sans nom');
  
  // Instancier l'agent
  console.log('Création d\'une instance...');
  const instance = new AgentClass();
  
  // Vérifier les propriétés et méthodes requises
  console.log('Vérification de l\'interface McpAgent:');
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
    console.log(`- ${prop}: ${result ? '✅' : '❌'}`);
  }
  
  const isValid = Object.values(checks).every(v => v);
  
  if (isValid) {
    console.log('\n✅ L\'agent htaccess-router-analyzer implémente correctement l\'interface McpAgent');
    process.exit(0);
  } else {
    console.error('\n❌ L\'agent htaccess-router-analyzer n\'implémente pas correctement l\'interface McpAgent');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
}
