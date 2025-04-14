/**
 * Agent Component Generator - Proxy vers le package centralisé
 * @deprecated Utilisez directement import { componentGeneratorAgent } from '@fafa/mcp-agents'
 */

// Export du module centralisé depuis le package @fafa/mcp-agents
export * from '@fafa/mcp-agents/generators/component-generator';

// Log pour indiquer l'utilisation de l'agent centralisé
console.info('Agent utilisé : @fafa/mcp-agents/generators/component-generator');

// Pour la compatibilité avec le code existant
import { agentRegistry } from '@fafa/mcp-agents';
export default agentRegistry['component-generator'];