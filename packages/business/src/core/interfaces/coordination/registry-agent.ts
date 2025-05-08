/**
 * Interface pour un agent de registre qui gère les inscriptions et la découverte d'autres agents
 * 
 * @deprecated Cette interface est déplacée vers mcp-types/src/layer-contracts.ts
 * Ce fichier est maintenu pour des raisons de rétrocompatibilité
 */

// Réexporter l'interface depuis le fichier centralisé
export { RegistryAgent } from 'mcp-types/src/layer-contracts';

// Imports nécessaires pour la rétrocompatibilité
import { CoordinationResult } from '../types';

// Types utilisés par l'interface pour la rétrocompatibilité
export interface Agent {
    id: string;
    name: string;
    type: string;
    version: string;
    capabilities?: string[];
    endpoint?: string;
    metadata?: Record<string, any>;
}

export interface AgentCriteria {
    type?: string | string[];
    capability?: string | string[];
    name?: string;
    version?: string;
    metadata?: Record<string, any>;
}