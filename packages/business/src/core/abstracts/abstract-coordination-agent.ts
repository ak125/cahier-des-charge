/**
 * abstract-coordination-agent.ts
 *
 * @deprecated Cette classe est déplacée vers mcp-core/src/coordination/abstract/abstract-coordination-agent.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

import {
    AbstractCoordinationAgent,
    CoordinationOptions,
    ConnectionStatus
} from '@mcp-core/src/coordination/abstract/abstract-coordination-agent';

// Réexporter pour maintenir la compatibilité
export {
    AbstractCoordinationAgent,
    CoordinationOptions,
    ConnectionStatus
};

// Réexporter l'interface pour maintenir la compatibilité avec l'ancien code
export { CoordinationAgent, CoordinationResult } from 'mcp-types/src/layer-contracts';