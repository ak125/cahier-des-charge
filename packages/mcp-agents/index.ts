// Registre centralisé des agents MCP
// Généré automatiquement par le script de nettoyage des doublons

// Export des agents individuels depuis la racine
export * from './php-analyzer';
export * from './remix-generator';
export * from './nestjs-generator';
export * from './mysql-to-postgresql';
export * from './migration-validator';
export * from './test-writer';

// Export des agents depuis les sous-répertoires
// Analysis
export * from './analysis/php-analyzer';

// Core
export * from './core/nestjs-generator';
export * from './core/remix-generator';

// Generators
export * from './generators/nestjs-generator';
export * from './generators/remix-generator';

// Types
export * from './types/index';

// Registre d'agents pour une utilisation facilitée
export const agentRegistry = {
  // Agents racine
  "php-analyzer": require('./php-analyzer'),
  "remix-generator": require('./remix-generator'),
  "nestjs-generator": require('./nestjs-generator'),
  "mysql-to-postgresql": require('./mysql-to-postgresql'),
  "migration-validator": require('./migration-validator'),
  "test-writer": require('./test-writer'),
  
  // Agents dans les sous-répertoires
  "analysis/php-analyzer": require('./analysis/php-analyzer'),
  "core/nestjs-generator": require('./core/nestjs-generator'),
  "core/remix-generator": require('./core/remix-generator'),
  "generators/nestjs-generator": require('./generators/nestjs-generator'),
  "generators/remix-generator": require('./generators/remix-generator')
};

// Fonction utilitaire pour exécuter un agent
export async function executeAgent(agentName: string, context: any) {
  const agent = agentRegistry[agentName];
  if (!agent) {
    throw new Error(`Agent "${agentName}" introuvable dans le registre MCP.`);
  }
  console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
  return await agent.run(context);
}
