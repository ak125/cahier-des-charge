/**
 * Exemple d'agent MCP pour le traitement de texte
 * 
 * Cet agent est conçu pour être compilé en WASM via AssemblyScript
 * Il implémente l'interface WasmAgentContract pour communiquer avec le runtime MCP
 */

// Types pour les interfaces
interface AgentMetadata {
    id: string;
    type: string;
    name: string;
    version: string;
    description?: string;
    permissions: {
        fs?: {
            read?: string[];
            write?: string[];
        };
        network?: {
            domains?: string[];
        };
    };
    wasmVersion: string;
}

interface AgentContext {
    jobId: string;
    inputs: {
        text: string;
        language?: string;
        options?: {
            format?: string;
            optimize?: boolean;
            maxLength?: number;
        };
    };
    timestamp?: number;
}

interface AgentResult {
    success: boolean;
    data?: {
        processedText: string;
        metadata?: Record<string, any>;
        stats: {
            inputLength: number;
            outputLength: number;
            processingTime: number;
        };
    };
    error?: Error;
    metrics: {
        startTime: number;
        endTime: number;
        duration: number;
    };
}

// Métadonnées de l'agent
const metadata: AgentMetadata = {
    id: "text-processor",
    type: "processor",
    name: "Agent de Traitement de Texte",
    version: "1.0.0",
    description: "Agent qui effectue divers traitements sur un texte : capitalisation, comptage de mots, etc.",
    permissions: {
        fs: { read: [] },
        network: { domains: [] }
    },
    wasmVersion: "1.0"
};

/**
 * Initialise l'agent - appelé au chargement
 */
export function initialize(): void {
    // Rien à initialiser pour cet agent simple
}

/**
 * Exécute l'agent avec un contexte donné
 * @param contextJson Contexte d'entrée au format JSON
 * @returns Résultat au format JSON
 */
export function execute(contextJson: string): string {
    const startTime = Date.now();

    // Mesures pour les métriques
    let result: AgentResult = {
        success: false,
        metrics: {
            startTime: startTime,
            endTime: 0,
            duration: 0
        }
    };

    try {
        // Désérialiser le contexte
        const context: AgentContext = JSON.parse(contextJson);

        // Vérifications basiques
        if (!context.inputs || !context.inputs.text) {
            throw new Error("Le texte d'entrée est requis");
        }

        const inputText = context.inputs.text;
        const options = context.inputs.options || {};
        const language = context.inputs.language || "fr";

        // Traitement du texte selon les options
        let processedText = inputText;

        // Option : capitalisation
        if (options.format === "uppercase") {
            processedText = processedText.toUpperCase();
        } else if (options.format === "lowercase") {
            processedText = processedText.toLowerCase();
        } else if (options.format === "titlecase") {
            processedText = titleCase(processedText);
        }

        // Option : optimisation (suppression des espaces multiples)
        if (options.optimize === true) {
            processedText = processedText.replace(/\s+/g, " ").trim();
        }

        // Option : longueur maximale
        if (options.maxLength && options.maxLength > 0 && processedText.length > options.maxLength) {
            processedText = processedText.substring(0, options.maxLength) + "...";
        }

        // Statistiques sur le texte
        const wordCount = countWords(processedText);
        const sentenceCount = countSentences(processedText);

        // Métadonnées par langue
        const metadata: Record<string, any> = {
            wordCount,
            sentenceCount,
            averageWordLength: calculateAverageWordLength(processedText)
        };

        // Si français, ajouter des statistiques supplémentaires
        if (language === "fr") {
            metadata.accentCount = countAccents(processedText);
        }

        // Créer le résultat
        const endTime = Date.now();
        result = {
            success: true,
            data: {
                processedText,
                metadata,
                stats: {
                    inputLength: inputText.length,
                    outputLength: processedText.length,
                    processingTime: endTime - startTime
                }
            },
            metrics: {
                startTime,
                endTime,
                duration: endTime - startTime
            }
        };

        return JSON.stringify(result);
    } catch (error) {
        const endTime = Date.now();
        result.success = false;
        result.error = error as Error;
        result.metrics.endTime = endTime;
        result.metrics.duration = endTime - startTime;

        return JSON.stringify(result);
    }
}

/**
 * Valide si l'agent peut traiter le contexte donné
 * @param contextJson Contexte à valider au format JSON
 * @returns true si le contexte est valide, sinon false
 */
export function validate(contextJson: string): boolean {
    try {
        const context: AgentContext = JSON.parse(contextJson);

        // Vérifications basiques
        if (!context.jobId || !context.inputs || !context.inputs.text) {
            return false;
        }

        // Vérifier les options
        const options = context.inputs.options || {};
        if (options.format && !["uppercase", "lowercase", "titlecase", "json", "text", "html"].includes(options.format)) {
            return false;
        }

        // Vérifier la langue
        const language = context.inputs.language || "fr";
        if (!["fr", "en", "es", "de"].includes(language)) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Retourne les métadonnées de l'agent
 * @returns Métadonnées au format JSON
 */
export function getMetadata(): string {
    return JSON.stringify(metadata);
}

// Fonctions utilitaires pour le traitement de texte

function titleCase(text: string): string {
    return text.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}

function countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(Boolean).length;
}

function calculateAverageWordLength(text: string): number {
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return 0;

    const totalLength = words.reduce((acc, word) => acc + word.length, 0);
    return totalLength / words.length;
}

function countAccents(text: string): number {
    return (text.match(/[àáâäæçèéêëìíîïòóôöùúûüÿ]/gi) || []).length;
}