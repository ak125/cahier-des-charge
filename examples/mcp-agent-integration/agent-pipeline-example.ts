/**
 * Exemple d'intégration des trois modules d'architecture MCP 2.0
 * 
 * Cet exemple montre comment utiliser ensemble:
 * 1. L'isolation WASM pour les agents
 * 2. La validation Zod pour les entrées/sorties
 * 3. La signature des résultats avec SIGSTORE
 */

import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Importer les modules pour notre architecture
import { WasmAgentLoader, AgentContext } from '../../packages/mcp-wasm-runtime';
import { McpValidator, z } from '../../packages/mcp-validation';
import { SigstoreSigner, SigstoreVerifier } from '../../packages/mcp-sigstore';

// Configuration de l'exemple
const AGENT_WASM_PATH = path.join(__dirname, '../assets/example-agent.wasm');
const SIGNATURES_DIR = path.join(__dirname, 'signatures');

// Schéma Zod pour la validation des entrées spécifiques à notre agent
const ExampleInputSchema = z.object({
    jobId: z.string().uuid(),
    inputs: z.object({
        text: z.string().min(1),
        language: z.enum(['en', 'fr', 'es', 'de']),
        processOptions: z.object({
            optimize: z.boolean().default(false),
            maxLength: z.number().int().positive().optional(),
        }).optional(),
    }),
    timestamp: z.number().optional(),
});

// Schéma Zod pour la validation des sorties spécifiques à notre agent
const ExampleOutputSchema = z.object({
    success: z.boolean(),
    data: z.object({
        processedText: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
        stats: z.object({
            inputLength: z.number(),
            outputLength: z.number(),
            processingTime: z.number(),
        }),
    }).optional(),
    error: z.instanceof(Error).optional(),
    metrics: z.object({
        startTime: z.number(),
        endTime: z.number(),
        duration: z.number(),
    }),
});

// Fonction principale pour exécuter l'exemple de pipeline
async function runExamplePipeline() {
    console.log('🚀 Démarrage du pipeline d\'agent MCP 2.0 avec architecture en trois parties');

    try {
        const agentId = 'example-text-processor';
        const runId = uuidv4();

        console.log(`📝 ID d'exécution: ${runId}`);

        // 1. PRÉPARATION DE L'ISOLATION WASM
        console.log('\n1️⃣ Initialisation de l\'agent WASM isolé');
        const wasmLoader = new WasmAgentLoader(AGENT_WASM_PATH);
        await wasmLoader.initialize();
        console.log('✅ Agent WASM initialisé avec succès');

        // Récupérer les métadonnées de l'agent
        const metadata = await wasmLoader.getMetadata();
        console.log(`📋 Agent chargé: ${metadata.name} (${metadata.id}) v${metadata.version}`);

        // 2. PRÉPARATION DES ENTRÉES ET VALIDATION AVEC ZOD
        console.log('\n2️⃣ Préparation et validation des entrées avec Zod');

        // Créer un validateur personnalisé avec nos schémas
        const validator = McpValidator.createAgentValidator(ExampleInputSchema, ExampleOutputSchema);

        // Préparer le contexte d'entrée
        const context: AgentContext = {
            jobId: runId,
            inputs: {
                text: "Ceci est un exemple de texte à traiter par notre agent isolé en WASM.",
                language: "fr",
                processOptions: {
                    optimize: true,
                    maxLength: 200
                }
            },
            timestamp: Date.now()
        };

        // Valider l'entrée avec notre schéma Zod
        const validationResult = validator.validateInput(context);
        if (!validationResult.valid) {
            console.error('❌ Validation des entrées échouée:', validationResult.errors);
            return;
        }
        console.log('✅ Entrées validées avec succès');

        // 3. EXÉCUTION DE L'AGENT DANS L'ISOLEMENT WASM
        console.log('\n3️⃣ Exécution de l\'agent dans l\'isolement WASM');
        const agentResult = await wasmLoader.execute(validationResult.data);
        console.log('✅ Agent exécuté avec succès');

        // 4. VALIDATION DU RÉSULTAT AVEC ZOD
        console.log('\n4️⃣ Validation du résultat avec Zod');
        const outputValidation = validator.validateOutput(agentResult);
        if (!outputValidation.valid) {
            console.error('❌ Validation du résultat échouée:', outputValidation.errors);
            return;
        }
        console.log('✅ Résultat validé avec succès');
        console.log(`📊 Résultat: ${agentResult.success ? 'Succès' : 'Échec'}`);
        if (agentResult.data) {
            console.log(`📑 Texte traité: "${agentResult.data.processedText.substring(0, 50)}..."`);
            console.log(`⏱️ Temps de traitement: ${agentResult.metrics.duration}ms`);
        }

        // 5. SIGNATURE DU RÉSULTAT AVEC SIGSTORE
        console.log('\n5️⃣ Signature du résultat avec SIGSTORE');
        const signer = new SigstoreSigner({ signaturesDir: SIGNATURES_DIR });
        const signatureInfo = await signer.signResult(agentId, runId, agentResult);
        console.log('✅ Résultat signé avec succès');
        console.log(`📜 Signature stockée: ${signatureInfo.signaturePath}`);
        console.log(`🔐 Hash du résultat: ${signatureInfo.resultHash}`);

        // 6. VÉRIFICATION DE LA SIGNATURE (COMME DANS LE PIPELINE CI/CD)
        console.log('\n6️⃣ Vérification de la signature (simulation CI/CD)');
        const verifier = new SigstoreVerifier({ signaturesDir: SIGNATURES_DIR });
        const verificationResult = await verifier.verifyResult(
            agentId,
            runId,
            JSON.stringify(agentResult)
        );

        if (verificationResult.valid) {
            console.log('✅ Signature vérifiée avec succès');
            console.log('🔒 Le résultat est authentique et n\'a pas été modifié');
        } else {
            console.error('❌ Vérification de signature échouée:', verificationResult.error);
            return;
        }

        console.log('\n🎉 Pipeline complet exécuté avec succès!');
        console.log('✨ L\'architecture en trois parties fonctionne comme prévu:');
        console.log('  1. Isolation WASM pour la sécurité et la modularité');
        console.log('  2. Validation Zod pour la fiabilité et le typage');
        console.log('  3. Signature SIGSTORE pour l\'auditabilité et la confiance');
    } catch (error) {
        console.error('❌ Erreur dans le pipeline:', error);
    }
}

// Exécuter l'exemple si lancé directement
if (require.main === module) {
    runExamplePipeline().catch(console.error);
}

export { runExamplePipeline };