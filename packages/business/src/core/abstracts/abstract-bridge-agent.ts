/**
 * abstract-bridge-agent.ts
 *
 * @deprecated Cette classe est déplacée vers mcp-core/src/coordination/abstract/abstract-bridge-agent.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

import {
    AbstractBridgeAgent,
    BridgeOptions,
    SystemEndpoint,
    Connection,
    TransferResult,
    BridgeResult
} from '@mcp-core/src/coordination/abstract/abstract-bridge-agent';

// Réexporter pour maintenir la compatibilité
export {
    AbstractBridgeAgent,
    BridgeOptions,
    SystemEndpoint,
    Connection,
    TransferResult,
    BridgeResult
};

// Réexporter l'interface pour maintenir la compatibilité avec l'ancien code
export { BridgeAgent } from 'mcp-types/src/layer-contracts';