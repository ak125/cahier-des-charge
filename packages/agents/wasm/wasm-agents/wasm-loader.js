// Wrapper pour les agents WASM MCP
// Facilite le chargement et l'utilisation des modules WebAssembly

/**
 * Classe pour gérer le chargement et l'interaction avec les modules WASM
 */
class WasmAgentLoader {
    /**
     * @type {WebAssembly.Instance}
     * @private
     */
    #instance = null;

    /**
     * @type {WebAssembly.Memory}
     * @private
     */
    #memory = null;

    /**
     * @type {Object}
     * @private
     */
    #exports = null;

    /**
     * Charge un module WASM à partir d'un chemin donné
     * @param {string} wasmPath - Chemin vers le fichier .wasm
     * @returns {Promise<void>}
     */
    async loadModule(wasmPath) {
        try {
            // Créer une mémoire partagée avec JS
            this.#memory = new WebAssembly.Memory({
                initial: 10, // 10 pages de 64KB
                maximum: 100, // 100 pages maximum
                shared: true
            });

            // Options d'importation pour le module WASM
            const importObject = {
                env: {
                    abort: (msg, file, line, column) => {
                        console.error(`Erreur WASM: ${msg} dans ${file}:${line}:${column}`);
                        throw new Error(`Erreur WASM à ${file}:${line}:${column}`);
                    },
                    memory: this.#memory,
                    trace: (message) => console.log(message),
                    seed: Date.now, // pour la génération de nombres aléatoires
                }
            };

            // Charger le module WASM
            const response = await fetch(wasmPath);
            const buffer = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(buffer, importObject);

            this.#instance = instance;
            this.#exports = instance.exports;

            console.log("Module WASM chargé avec succès");
            return true;
        } catch (error) {
            console.error("Erreur lors du chargement du module WASM:", error);
            throw error;
        }
    }

    /**
     * Fonction utilitaire pour encoder une chaîne UTF-8 en mémoire
     * @param {string} str - La chaîne à encoder
     * @returns {number} - Pointeur vers la chaîne en mémoire
     * @private
     */
    #encodeString(str) {
        if (!this.#exports) {
            throw new Error("Module WASM non chargé");
        }

        const { __newString, __pin, __unpin } = this.#exports;
        const ptr = __newString(str);
        __pin(ptr);
        return ptr;
    }

    /**
     * Fonction utilitaire pour décoder une chaîne UTF-8 depuis la mémoire
     * @param {number} ptr - Pointeur vers la chaîne en mémoire
     * @returns {string} - La chaîne décodée
     * @private
     */
    #decodeString(ptr) {
        if (!this.#exports) {
            throw new Error("Module WASM non chargé");
        }

        const { __getString, __unpin } = this.#exports;
        const str = __getString(ptr);
        __unpin(ptr);
        return str;
    }

    /**
     * Valide un objet JSON
     * @param {string} jsonStr - La chaîne JSON à valider
     * @returns {Object} - Résultat de la validation
     */
    validateJson(jsonStr) {
        if (!this.#exports?.validateJson) {
            throw new Error("Fonction validateJson non disponible dans le module WASM");
        }

        const inputPtr = this.#encodeString(jsonStr);
        const resultPtr = this.#exports.validateJson(inputPtr);
        const result = this.#decodeString(resultPtr);

        return JSON.parse(result);
    }

    /**
     * Audit de sécurité sur une chaîne de texte
     * @param {string} input - La chaîne à auditer
     * @returns {Object} - Résultat de l'audit de sécurité
     */
    securityAudit(input) {
        if (!this.#exports?.securityAudit) {
            throw new Error("Fonction securityAudit non disponible dans le module WASM");
        }

        const inputPtr = this.#encodeString(input);
        const resultPtr = this.#exports.securityAudit(inputPtr);
        const result = this.#decodeString(resultPtr);

        return JSON.parse(result);
    }

    /**
     * Valide un objet MCP
     * @param {string|Object} input - L'objet ou la chaîne JSON MCP à valider
     * @returns {Object} - Résultat de la validation
     */
    validateMcpObject(input) {
        if (!this.#exports?.validateMcpObject) {
            throw new Error("Fonction validateMcpObject non disponible dans le module WASM");
        }

        const jsonStr = typeof input === 'string' ? input : JSON.stringify(input);
        const inputPtr = this.#encodeString(jsonStr);
        const resultPtr = this.#exports.validateMcpObject(inputPtr);
        const result = this.#decodeString(resultPtr);

        return JSON.parse(result);
    }

    /**
     * Valide un objet MCP par rapport à un schéma spécifique
     * @param {string|Object} input - L'objet ou la chaîne JSON MCP à valider
     * @param {string} schemaType - Le type de schéma à utiliser
     * @returns {Object} - Résultat de la validation
     */
    validateMcpSchema(input, schemaType) {
        if (!this.#exports?.validateMcpSchema) {
            throw new Error("Fonction validateMcpSchema non disponible dans le module WASM");
        }

        const jsonStr = typeof input === 'string' ? input : JSON.stringify(input);
        const inputPtr = this.#encodeString(jsonStr);
        const schemaTypePtr = this.#encodeString(schemaType);
        const resultPtr = this.#exports.validateMcpSchema(inputPtr, schemaTypePtr);
        const result = this.#decodeString(resultPtr);

        return JSON.parse(result);
    }

    /**
     * Optimise un objet MCP
     * @param {string|Object} input - L'objet ou la chaîne JSON MCP à optimiser
     * @returns {Object} - Résultat de l'optimisation
     */
    optimizeMcpObject(input) {
        if (!this.#exports?.optimizeMcpObject) {
            throw new Error("Fonction optimizeMcpObject non disponible dans le module WASM");
        }

        const jsonStr = typeof input === 'string' ? input : JSON.stringify(input);
        const inputPtr = this.#encodeString(jsonStr);
        const resultPtr = this.#exports.optimizeMcpObject(inputPtr);
        const result = this.#decodeString(resultPtr);

        return JSON.parse(result);
    }
}

// Export pour usage en module ES
export default WasmAgentLoader;

// Support pour les environnements non-module
if (typeof window !== 'undefined') {
    window.WasmAgentLoader = WasmAgentLoader;
}