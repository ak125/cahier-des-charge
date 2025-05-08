/**
 * Exemple d'utilisation de l'intégration WasmEdge avec l'architecture MCP
 * 
 * Ce fichier montre comment utiliser le sélecteur de moteur WASM pour choisir
 * automatiquement entre WasmEdge et le moteur WASM standard en fonction
 * du type d'agent et des besoins en performance.
 */

import * as path from 'path';
import { AgentContext } from '../../packages/mcp-wasm-runtime';
import { autoSelectWasmEngine, getOptimalWasmEngine } from '../wasm-engine-selector';
import { WasmEdgeAdapter } from '../wasmedge-mcp-adapter';

// Exemple de fonction qui utilise le sélecteur auto de moteur WASM
async function processCodeWithOptimalEngine(
    codePath: string,
    codeContent: string
): Promise<any> {
    // Chemin vers l'agent WASM de transformation de code
    const wasmPath = path.join(__dirname, '../../agents/code-transformer.wasm');

    console.log(`Traitement du fichier: ${codePath}`);

    // Contexte d'exécution pour l'agent
    const context: AgentContext = {
        jobId: `transform-${Date.now()}`,
        inputs: {
            filePath: codePath,
            content: codeContent,
            transformType: 'optimize'
        }
    };

    try {
        // Sélectionner automatiquement le meilleur moteur WASM
        // WasmEdge sera choisi si disponible car il s'agit d'un agent de transformation de code
        const engine = await autoSelectWasmEngine(wasmPath);

        // Exécuter l'agent
        const resultJson = await engine.execute(JSON.stringify(context));
        const result = JSON.parse(resultJson);

        console.log(`Traitement terminé avec le moteur: ${result.metrics.runtime || 'standard'}`);
        console.log(`Temps d'exécution: ${result.metrics.duration}ms`);

        return result.data;
    } catch (error) {
        console.error(`Erreur lors de la transformation: ${error.message}`);
        throw error;
    }
}

// Exemple de fonction utilisant explicitement WasmEdge pour des calculs intensifs
async function runMLInference(
    imageData: Uint8Array,
    modelType: string
): Promise<any> {
    // Chemin vers l'agent WASM d'inférence ML
    const wasmPath = path.join(__dirname, '../../agents/ml-inference.wasm');

    // Utiliser directement WasmEdge avec un profil ML
    const engine = new WasmEdgeAdapter(wasmPath, 'ml');

    try {
        await engine.initialize();

        // Contexte d'exécution pour l'agent
        const context = {
            jobId: `inference-${Date.now()}`,
            inputs: {
                imageData: Array.from(imageData), // Convertir en tableau pour JSON
                modelType
            }
        };

        const resultJson = await engine.execute(JSON.stringify(context));
        return JSON.parse(resultJson);
    } catch (error) {
        // Si WasmEdge échoue, revenir au moteur standard
        console.warn(`WasmEdge non disponible pour l'inférence ML, utilisation du moteur standard: ${error.message}`);

        // Utiliser le sélecteur pour obtenir un moteur alternatif
        const fallbackEngine = await getOptimalWasmEngine('vector-similarity', wasmPath);

        // Contexte d'exécution pour l'agent
        const context = {
            jobId: `inference-${Date.now()}`,
            inputs: {
                imageData: Array.from(imageData),
                modelType
            }
        };

        const resultJson = await fallbackEngine.execute(JSON.stringify(context));
        return JSON.parse(resultJson);
    }
}

// Exemple d'utilisation dans une suite d'agents (pipeline)
async function runAgentPipeline(
    inputText: string
): Promise<string> {
    // Chemins vers les différents agents WASM
    const textProcessorPath = path.join(__dirname, '../../agents/text-processor.wasm');
    const codeGeneratorPath = path.join(__dirname, '../../agents/code-generator.wasm');

    // Étape 1: Traiter le texte avec l'agent de traitement de texte
    const textEngine = await getOptimalWasmEngine('text-processing', textProcessorPath);

    const textContext: AgentContext = {
        jobId: `text-process-${Date.now()}`,
        inputs: { text: inputText }
    };

    const textResultJson = await textEngine.execute(JSON.stringify(textContext));
    const textResult = JSON.parse(textResultJson);

    if (!textResult.success) {
        throw new Error(`Échec du traitement de texte: ${textResult.error}`);
    }

    // Étape 2: Générer du code à partir du texte traité
    const codeEngine = await getOptimalWasmEngine('code-transformation', codeGeneratorPath);

    const codeContext: AgentContext = {
        jobId: `code-gen-${Date.now()}`,
        inputs: {
            processedText: textResult.data.processedText,
            targetLanguage: 'typescript'
        }
    };

    const codeResultJson = await codeEngine.execute(JSON.stringify(codeContext));
    const codeResult = JSON.parse(codeResultJson);

    if (!codeResult.success) {
        throw new Error(`Échec de la génération de code: ${codeResult.error}`);
    }

    return codeResult.data.generatedCode;
}

// Exporter les fonctions d'exemple
export {
    processCodeWithOptimalEngine,
    runMLInference,
    runAgentPipeline
};