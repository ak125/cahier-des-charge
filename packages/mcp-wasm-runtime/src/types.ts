/**
 * Types pour le runtime WASM des agents MCP
 */

/**
 * Métadonnées d'un agent WASM
 */
export interface WasmAgentMetadata {
    id: string;
    type: string;
    name: string;
    version: string;
    description?: string;
    permissions: AgentPermissions;
    wasmVersion: string;
}

/**
 * Permissions accordées à un agent WASM
 */
export interface AgentPermissions {
    fs?: {
        read?: string[];
        write?: string[];
    };
    network?: {
        domains?: string[];
        ports?: number[];
    };
    system?: {
        env?: boolean;
        exec?: boolean;
    };
}

/**
 * Contexte d'exécution pour un agent
 */
export interface AgentContext {
    jobId: string;
    inputs: Record<string, any>;
    [key: string]: any;
}

/**
 * Résultat d'exécution d'un agent
 */
export interface AgentResult {
    success: boolean;
    data?: any;
    error?: Error;
    metrics: {
        startTime: number;
        endTime: number;
        duration: number;
    };
}

/**
 * Manifest d'un agent WASM
 */
export interface AgentManifest {
    metadata: WasmAgentMetadata;
    schema: {
        input?: any; // Sera remplacé par un schéma Zod
        output?: any; // Sera remplacé par un schéma Zod
    };
    validationStrategy: 'zod' | 'prisma' | 'json-schema' | 'none';
    outputStrategy: 'stdout' | 'storage' | 'supabase' | 'custom';
}

/**
 * Interface pour le contrat entre l'hôte et le module WASM
 */
export interface WasmAgentContract {
    initialize(): Promise<void>;
    execute(contextJson: string): Promise<string>; // Contexte et résultat sérialisés en JSON
    validate(contextJson: string): Promise<boolean>;
    getMetadata(): string; // Métadonnées sérialisées en JSON
}