import { WasmAgentLoader } from './wasm-loader';
import { AgentContext, AgentResult, WasmAgentMetadata } from './types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Gestionnaire d'agents WASM qui centralise le chargement et l'exécution des agents
 */
export class WasmAgentManager {
    private agents: Map<string, WasmAgentLoader> = new Map();
    private agentsDirectory: string;

    /**
     * Créer un nouveau gestionnaire d'agents WASM
     * @param agentsDirectory Répertoire contenant les agents WASM
     */
    constructor(agentsDirectory: string = path.join(process.cwd(), 'agents')) {
        this.agentsDirectory = agentsDirectory;
    }

    /**
     * Charger un agent WASM depuis un fichier
     * @param agentId Identifiant unique de l'agent
     * @param wasmPath Chemin vers le fichier WASM ou buffer contenant le code WASM
     * @param manifestPath Chemin vers le fichier manifeste de l'agent (optionnel)
     */
    async loadAgent(
        agentId: string,
        wasmPath: string | Uint8Array,
        manifestPath?: string
    ): Promise<WasmAgentMetadata> {
        try {
            // Créer un nouveau chargeur WASM pour cet agent
            const loader = new WasmAgentLoader(wasmPath, manifestPath);

            // Initialiser l'agent
            await loader.initialize();

            // Récupérer les métadonnées
            const metadata = await loader.getMetadata();

            // Stocker l'agent dans notre gestionnaire
            this.agents.set(agentId, loader);

            return metadata;
        } catch (error) {
            console.error(`Erreur lors du chargement de l'agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * Exécuter un agent WASM
     * @param agentId Identifiant de l'agent à exécuter
     * @param context Contexte d'exécution pour l'agent
     */
    async executeAgent(agentId: string, context: AgentContext): Promise<AgentResult> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} non trouvé`);
        }

        // Valider que l'agent peut traiter ce contexte
        const isValid = await agent.validate(context);
        if (!isValid) {
            return {
                success: false,
                error: new Error(`L'agent ${agentId} ne peut pas traiter le contexte fourni`),
                metrics: {
                    startTime: Date.now(),
                    endTime: Date.now(),
                    duration: 0
                }
            };
        }

        // Exécuter l'agent
        return await agent.execute(context);
    }

    /**
     * Décharger un agent de la mémoire
     * @param agentId Identifiant de l'agent à décharger
     */
    unloadAgent(agentId: string): boolean {
        return this.agents.delete(agentId);
    }

    /**
     * Scanner un répertoire pour trouver et charger des agents WASM
     * @param directory Répertoire à scanner (par défaut, le répertoire des agents configuré)
     */
    async scanAndLoadAgents(directory: string = this.agentsDirectory): Promise<WasmAgentMetadata[]> {
        const results: WasmAgentMetadata[] = [];

        try {
            if (!fs.existsSync(directory)) {
                console.warn(`Le répertoire ${directory} n'existe pas`);
                return results;
            }

            const files = fs.readdirSync(directory);

            for (const file of files) {
                if (file.endsWith('.wasm')) {
                    const wasmPath = path.join(directory, file);
                    const baseName = file.replace('.wasm', '');

                    // Vérifier s'il existe un fichier manifest correspondant
                    const manifestPath = path.join(directory, `${baseName}.agent.json`);
                    const hasManifest = fs.existsSync(manifestPath);

                    try {
                        const metadata = await this.loadAgent(
                            baseName,
                            wasmPath,
                            hasManifest ? manifestPath : undefined
                        );

                        results.push(metadata);
                    } catch (error) {
                        console.error(`Erreur lors du chargement de l'agent ${baseName}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Erreur lors du scan du répertoire ${directory}:`, error);
        }

        return results;
    }

    /**
     * Lister tous les agents chargés
     */
    listLoadedAgents(): string[] {
        return Array.from(this.agents.keys());
    }
}