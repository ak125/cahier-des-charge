/**
 * coordination-agent.ts
 *
 * @deprecated Cette interface est déplacée vers mcp-types/src/layer-contracts.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter les interfaces depuis le fichier centralisé
export {
    CoordinationAgent,
    CoordinationResult
} from 'mcp-types/src/layer-contracts';

// Pour la compatibilité avec l'ancien code
export interface CoordinationOptions {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    serviceConfig?: Record<string, any>;
    [key: string]: any;
}

export interface ConnectionStatus {
    connected: boolean;
    services: Record<string, {
        connected: boolean;
        lastChecked: string;
        error?: string;
    }>;
    lastChecked: string;
}