import { WasmAgentContract, AgentContext } from '../packages/mcp-wasm-runtime';
import { runWasmAgent } from './wasmedge-config';

/**
 * Adaptateur qui implémente l'interface WasmAgentContract pour utiliser WasmEdge
 * comme moteur d'exécution pour les agents WASM dans l'architecture MCP
 */
export class WasmEdgeAdapter implements WasmAgentContract {
    constructor(
        private wasmPath: string,
        private profileType: 'standard' | 'compute' | 'ml' = 'standard'
    ) { }

    async initialize(): Promise<void> {
        // Vérifier que l'agent WASM existe et est valide
        // Cette étape peut précharger le module pour validation
        const testResult = await runWasmAgent(
            this.wasmPath,
            { action: 'healthcheck' },
            this.profileType
        );

        if (!testResult?.success) {
            throw new Error(`Échec de l'initialisation de l'agent WasmEdge: ${this.wasmPath}`);
        }
    }

    async execute(contextJson: string): Promise<string> {
        const context = JSON.parse(contextJson);

        // Tracker les métriques de performance
        const startTime = Date.now();

        try {
            // Exécuter l'agent via WasmEdge
            const result = await runWasmAgent(this.wasmPath, context, this.profileType);

            // Ajouter les métriques
            result.metrics = {
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime,
                runtime: 'wasmedge'
            };

            return JSON.stringify(result);
        } catch (error) {
            // Gérer les erreurs
            const errorResult = {
                success: false,
                error: error.message,
                metrics: {
                    startTime,
                    endTime: Date.now(),
                    duration: Date.now() - startTime,
                    runtime: 'wasmedge'
                }
            };

            return JSON.stringify(errorResult);
        }
    }

    async validate(contextJson: string): Promise<boolean> {
        try {
            const context = JSON.parse(contextJson);
            const result = await runWasmAgent(
                this.wasmPath,
                { ...context, action: 'validate' },
                this.profileType
            );
            return !!result?.valid;
        } catch (error) {
            return false;
        }
    }

    getMetadata(): string {
        // Pour simplifier, récupérer les métadonnées via une exécution
        return runWasmAgent(
            this.wasmPath,
            { action: 'metadata' },
            'standard'  // Utiliser un profil léger pour la récupération des métadonnées
        ).then(result => JSON.stringify(result?.metadata || {}))
            .catch(() => JSON.stringify({}));
    }
}