/**
 * abstract-adapter-agent.ts
 *
 * @deprecated Cette classe est déplacée vers mcp-core/src/coordination/abstract/abstract-adapter-agent.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

import { AbstractAdapterAgent, AdapterOptions, AdapterResult } from '@mcp-core/src/coordination/abstract/abstract-adapter-agent';
import { CoordinationResult } from 'mcp-types/src/layer-contracts';

// Réexporter pour maintenir la compatibilité
export { AbstractAdapterAgent, AdapterOptions, AdapterResult };

// Réexporter l'interface pour maintenir la compatibilité avec l'ancien code
export { AdapterAgent } from 'mcp-types/src/layer-contracts';