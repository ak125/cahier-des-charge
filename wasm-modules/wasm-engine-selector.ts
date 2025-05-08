import { AgentContext, WasmAgentLoader } from '../packages/mcp-wasm-runtime';
import { WasmEdgeAdapter } from './wasmedge-mcp-adapter';
import * as fs from 'fs';

/**
 * Profils d'agents pour déterminer le meilleur moteur d'exécution
 * à utiliser en fonction du type d'agent
 */
const AGENT_ENGINE_PROFILES = {
    // Agents nécessitant les meilleures performances
    'code-transformation': {
        preferredEngine: 'wasmedge',
        profileType: 'compute'
    },
    'vector-similarity': {
        preferredEngine: 'wasmedge',
        profileType: 'ml'
    },
    'code-analyzer': {
        preferredEngine: 'wasmedge',
        profileType: 'compute'
    },
    // Agents standards
    'text-processing': {
        preferredEngine: 'standard',
        profileType: 'standard'
    },
    'markdown-parser': {
        preferredEngine: 'standard',
        profileType: 'standard'
    }
};

/**
 * Vérifie si WasmEdge est disponible dans l'environnement d'exécution
 */
async function isWasmEdgeAvailable(): Promise<boolean> {
    try {
        // Vérifier si le module wasmedge-core est disponible
        return !!require('wasmedge-core');
    } catch (error) {
        return false;
    }
}

/**
 * Détermine le type d'agent à partir des métadonnées ou du nom de fichier
 */
function determineAgentType(wasmPath: string, metadata?: any): string {
    // Si les métadonnées contiennent un champ type, l'utiliser
    if (metadata?.type) {
        return metadata.type;
    }

    // Sinon déduire du nom de fichier
    const fileName = wasmPath.split('/').pop() || '';
    if (fileName.includes('code-transform') || fileName.includes('transformer')) {
        return 'code-transformation';
    } else if (fileName.includes('vector') || fileName.includes('similarity')) {
        return 'vector-similarity';
    } else if (fileName.includes('text') || fileName.includes('process')) {
        return 'text-processing';
    } else if (fileName.includes('code-analy') || fileName.includes('analyzer')) {
        return 'code-analyzer';
    }

    // Par défaut
    return 'standard';
}

/**
 * Retourne le moteur WASM optimal (WasmEdge ou standard) en fonction
 * du type d'agent et de la disponibilité de WasmEdge
 */
export async function getOptimalWasmEngine(
    agentType: string,
    wasmPath: string
) {
    // Vérifier que le fichier existe
    if (!fs.existsSync(wasmPath)) {
        throw new Error(`Le fichier WASM n'existe pas: ${wasmPath}`);
    }

    // Récupérer le profil ou utiliser un profil par défaut
    const profile = AGENT_ENGINE_PROFILES[agentType] || {
        preferredEngine: 'standard',
        profileType: 'standard'
    };

    // Si WasmEdge est préféré, essayer de l'utiliser d'abord
    if (profile.preferredEngine === 'wasmedge' && await isWasmEdgeAvailable()) {
        try {
            const adapter = new WasmEdgeAdapter(wasmPath, profile.profileType as any);
            await adapter.initialize();
            console.log(`WasmEdge activé pour l'agent ${agentType} (profil: ${profile.profileType})`);
            return adapter;
        } catch (error) {
            console.warn(`WasmEdge non disponible, utilisation du moteur standard: ${error.message}`);
        }
    }

    // Fallback au moteur WASM standard
    console.log(`Moteur WASM standard utilisé pour l'agent ${agentType}`);
    const standardLoader = new WasmAgentLoader(wasmPath);
    await standardLoader.initialize();
    return standardLoader;
}

/**
 * Sélectionne automatiquement le meilleur moteur WASM en fonction du chemin du fichier
 * et des métadonnées disponibles
 */
export async function autoSelectWasmEngine(wasmPath: string, metadata?: any) {
    const agentType = determineAgentType(wasmPath, metadata);
    return getOptimalWasmEngine(agentType, wasmPath);
}