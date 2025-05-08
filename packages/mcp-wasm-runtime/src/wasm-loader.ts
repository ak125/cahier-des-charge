import { WASI } from '@wasmer/wasi';
import { WasmFs } from '@wasmer/wasmfs';
import * as fs from 'fs';
import * as path from 'path';
import { AgentContext, AgentResult, WasmAgentContract, AgentManifest } from './types';

/**
 * Chargeur d'agents WASM qui fournit un environnement d'exécution isolé
 */
export class WasmAgentLoader {
    private wasmFs: WasmFs;
    private wasmBinary: Uint8Array;
    private wasmModule: WebAssembly.Module;
    private wasi: WASI;
    private instance: WebAssembly.Instance | null = null;
    private manifest: AgentManifest | null = null;

    /**
     * Créer un nouveau chargeur d'agents WASM
     * @param wasmPath Chemin vers le fichier WASM ou buffer contenant le code WASM
     * @param manifestPath Chemin vers le fichier manifeste de l'agent (optionnel)
     */
    constructor(
        private wasmPath: string | Uint8Array,
        private manifestPath?: string
    ) {
        this.wasmFs = new WasmFs();

        // Charger le binaire WASM
        if (typeof wasmPath === 'string') {
            this.wasmBinary = fs.readFileSync(wasmPath);
        } else {
            this.wasmBinary = wasmPath;
        }

        // Initialiser le module WASM
        this.wasmModule = new WebAssembly.Module(this.wasmBinary);

        // Configurer WASI
        this.wasi = new WASI({
            args: [],
            env: {},
            bindings: {
                ...WASI.defaultBindings,
                fs: this.wasmFs.fs
            },
            preopens: {
                '/': '/'
            }
        });
    }

    /**
     * Initialiser l'agent WASM
     */
    async initialize(): Promise<void> {
        // Charger le manifeste si disponible
        if (this.manifestPath) {
            try {
                const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
                this.manifest = JSON.parse(manifestContent);
            } catch (error) {
                console.warn(`Impossible de charger le manifeste: ${error.message}`);
            }
        }

        // Créer l'instance WASM
        const importObject = {
            wasi_snapshot_preview1: this.wasi.wasiImport
        };

        this.instance = await WebAssembly.instantiate(this.wasmModule, importObject);

        // Initialiser WASI
        this.wasi.start(this.instance);

        // Appeler la méthode d'initialisation de l'agent si elle existe
        const contract = this.getContract();
        if (contract && typeof contract.initialize === 'function') {
            await contract.initialize();
        }
    }

    /**
     * Récupérer l'interface de contrat de l'agent
     */
    private getContract(): WasmAgentContract | null {
        if (!this.instance || !this.instance.exports) {
            return null;
        }

        const exports = this.instance.exports as any;

        // Vérifier que toutes les méthodes requises sont présentes
        const requiredMethods = ['initialize', 'execute', 'validate', 'getMetadata'];
        for (const method of requiredMethods) {
            if (typeof exports[method] !== 'function') {
                console.error(`La méthode ${method} n'est pas exportée par le module WASM`);
                return null;
            }
        }

        return exports as WasmAgentContract;
    }

    /**
     * Exécuter l'agent avec un contexte donné
     */
    async execute(context: AgentContext): Promise<AgentResult> {
        const contract = this.getContract();
        if (!contract) {
            throw new Error("L'agent n'est pas correctement initialisé");
        }

        try {
            // Sérialiser le contexte en JSON
            const contextJson = JSON.stringify(context);

            // Exécuter l'agent
            const resultJson = await contract.execute(contextJson);

            // Désérialiser le résultat
            return JSON.parse(resultJson) as AgentResult;
        } catch (error) {
            return {
                success: false,
                error,
                metrics: {
                    startTime: Date.now(),
                    endTime: Date.now(),
                    duration: 0
                }
            };
        }
    }

    /**
     * Valider si l'agent peut traiter le contexte donné
     */
    async validate(context: AgentContext): Promise<boolean> {
        const contract = this.getContract();
        if (!contract) {
            return false;
        }

        try {
            const contextJson = JSON.stringify(context);
            return await contract.validate(contextJson);
        } catch (error) {
            console.error("Erreur lors de la validation du contexte:", error);
            return false;
        }
    }

    /**
     * Récupérer les métadonnées de l'agent
     */
    async getMetadata(): Promise<any> {
        // Si nous avons déjà le manifeste, l'utiliser
        if (this.manifest) {
            return this.manifest.metadata;
        }

        // Sinon, demander au module WASM
        const contract = this.getContract();
        if (!contract) {
            throw new Error("L'agent n'est pas correctement initialisé");
        }

        try {
            const metadataJson = await contract.getMetadata();
            return JSON.parse(metadataJson);
        } catch (error) {
            console.error("Erreur lors de la récupération des métadonnées:", error);
            throw error;
        }
    }
}