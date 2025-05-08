// Exporter les types
export * from './types';

// Exporter les classes principales
export { WasmAgentLoader } from './wasm-loader';
export { WasmAgentManager } from './agent-manager';

// Exporter une instance par défaut du gestionnaire d'agents
import { WasmAgentManager } from './agent-manager';
export const defaultAgentManager = new WasmAgentManager();