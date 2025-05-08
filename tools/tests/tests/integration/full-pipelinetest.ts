/**
 * Test d'intégration pour le pipeline complet MCP 2.0
 * Teste l'interaction entre les trois modules:
 * - Isolation WASM
 * - Validation Zod
 * - Signature SIGSTORE
 */

import { WasmAgentLoader } from '../../packages/mcp-wasm-runtime';
import { McpValidator, z } from '../../packages/mcp-validation';
import { SigstoreSigner, SigstoreVerifier } from '../../packages/mcp-sigstore';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Mocks nécessaires pour les tests
jest.mock('../../packages/mcp-wasm-runtime', () => {
    return {
        WasmAgentLoader: jest.fn().mockImplementation(() => {
            return {
                initialize: jest.fn().mockResolvedValue(undefined),
                execute: jest.fn().mockImplementation(async (context) => {
                    return {
                        success: true,
                        data: {
                            processedText: `Traité: ${context.inputs.text || 'texte par défaut'}`,
                            stats: {
                                inputLength: (context.inputs.text || '').length,
                                outputLength: (`Traité: ${context.inputs.text || 'texte par défaut'}`).length,
                                processingTime: 50
                            }
                        },
                        metrics: {
                            startTime: Date.now() - 100,
                            endTime: Date.now(),
                            duration: 100
                        }
                    };
                }),
                validate: jest.fn().mockReturnValue(true),
                getMetadata: jest.fn().mockResolvedValue({
                    id: 'test-agent',
                    type: 'processor',
                    name: 'Test Agent',
                    version: '1.0.0'
                })
            };
        })
    };
});

jest.mock('../../packages/mcp-sigstore', () => {
    return {
        SigstoreSigner: jest.fn().mockImplementation(() => {
            return {
                signResult: jest.fn().mockImplementation(async (agentId, runId, result) => {
                    return {
                        signaturePath: `${agentId}/${runId}.sig`,
                        resultHash: 'mock-hash-value',
                        timestamp: Date.now(),
                        agentId,
                        runId,
                        rekorLogEntry: '12345'
                    };
                })
            };
        }),
        SigstoreVerifier: jest.fn().mockImplementation(() => {
            return {
                verifyResult: jest.fn().mockImplementation(async (agentId, runId, resultContent) => {
                    return {
                        valid: true,
                        signatureInfo: {
                            signaturePath: `${agentId}/${runId}.sig`,
                            resultHash: 'mock-hash-value',
                            timestamp: Date.now(),
                            agentId,
                            runId,
                            rekorLogEntry: '12345'
                        }
                    };
                })
            };
        })
    };
});

describe('Pipeline MCP 2.0 Complet', () => {
    // Configuration de schémas personnalisés pour les tests
    const TextProcessorInputSchema = z.object({
        jobId: z.string().uuid(),
        inputs: z.object({
            text: z.string().min(1),
            language: z.enum(['fr', 'en', 'es']),
            options: z.object({
                format: z.enum(['json', 'text', 'html']).optional(),
                optimize: z.boolean().default(false)
            }).optional()
        }),
        timestamp: z.number().optional()
    });

    const TextProcessorOutputSchema = z.object({
        success: z.boolean(),
        data: z.object({
            processedText: z.string(),
            stats: z.object({
                inputLength: z.number(),
                outputLength: z.number(),
                processingTime: z.number()
            })
        }).optional(),
        error: z.instanceof(Error).optional(),
        metrics: z.object({
            startTime: z.number(),
            endTime: z.number(),
            duration: z.number()
        })
    });

    const TEST_SIGNATURES_DIR = path.join(__dirname, '../temp-signatures');
    let wasmAgent: WasmAgentLoader;
    let validator: any;
    let signer: SigstoreSigner;
    let verifier: SigstoreVerifier;

    beforeEach(() => {
        // Créer le répertoire pour les signatures si nécessaire
        if (!fs.existsSync(TEST_SIGNATURES_DIR)) {
            fs.mkdirSync(TEST_SIGNATURES_DIR, { recursive: true });
        }

        // Initialiser les composants
        wasmAgent = new WasmAgentLoader('/mock/path/to/agent.wasm');
        validator = McpValidator.createAgentValidator(
            TextProcessorInputSchema,
            TextProcessorOutputSchema
        );
        signer = new SigstoreSigner({ signaturesDir: TEST_SIGNATURES_DIR });
        verifier = new SigstoreVerifier({ signaturesDir: TEST_SIGNATURES_DIR });
    });

    test('devrait traiter un flux complet de validation, exécution et signature', async () => {
        // 0. Initialiser l'agent
        await wasmAgent.initialize();

        // 1. Créer un contexte d'entrée
        const runId = uuidv4();
        const agentId = 'text-processor';
        const inputContext = {
            jobId: runId,
            inputs: {
                text: 'Ceci est un texte à traiter dans notre pipeline MCP 2.0.',
                language: 'fr',
                options: {
                    format: 'json',
                    optimize: true
                }
            },
            timestamp: Date.now()
        };

        // 2. Valider l'entrée avec Zod
        const inputValidation = validator.validateInput(inputContext);
        expect(inputValidation.valid).toBe(true);
        expect(inputValidation.errors).toBeUndefined();

        // 3. Exécuter l'agent WASM
        const result = await wasmAgent.execute(inputValidation.data);

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('data.processedText');
        expect(result.data.processedText).toContain('Traité:');

        // 4. Valider la sortie avec Zod
        const outputValidation = validator.validateOutput(result);
        expect(outputValidation.valid).toBe(true);
        expect(outputValidation.errors).toBeUndefined();

        // 5. Signer le résultat
        const signatureInfo = await signer.signResult(agentId, runId, result);
        expect(signatureInfo).toHaveProperty('signaturePath');
        expect(signatureInfo).toHaveProperty('resultHash');
        expect(signatureInfo).toHaveProperty('agentId', agentId);
        expect(signatureInfo).toHaveProperty('runId', runId);

        // 6. Vérifier la signature
        const verificationResult = await verifier.verifyResult(
            agentId,
            runId,
            JSON.stringify(result)
        );
        expect(verificationResult.valid).toBe(true);
        expect(verificationResult).toHaveProperty('signatureInfo');
    });

    test('devrait échouer à la validation d\'entrée avec des données incorrectes', async () => {
        // Créer un contexte d'entrée invalide
        const invalidContext = {
            jobId: uuidv4(),
            inputs: {
                text: 'Texte',
                language: 'de', // 'de' n'est pas dans l'enum accepté
                options: {
                    format: 'xml' // 'xml' n'est pas dans l'enum accepté
                }
            }
        };

        // Valider l'entrée avec Zod
        const inputValidation = validator.validateInput(invalidContext);
        expect(inputValidation.valid).toBe(false);
        expect(inputValidation.errors).toBeDefined();
    });

    // Test traitant un cas d'erreur dans l'exécution de l'agent
    test('devrait gérer correctement un échec d\'exécution de l\'agent', async () => {
        // Mock pour simuler un échec d'exécution
        (wasmAgent.execute as jest.Mock).mockRejectedValueOnce(new Error('Erreur de traitement'));

        // Valider puis exécuter l'agent avec un contexte valide
        const runId = uuidv4();
        const agentId = 'text-processor';
        const inputContext = {
            jobId: runId,
            inputs: {
                text: 'Texte qui provoquera une erreur.',
                language: 'fr'
            }
        };

        const inputValidation = validator.validateInput(inputContext);
        expect(inputValidation.valid).toBe(true);

        // L'exécution devrait échouer
        await expect(wasmAgent.execute(inputValidation.data)).rejects.toThrow('Erreur de traitement');

        // On ne devrait pas essayer de signer un résultat qui a échoué
        // (dans une implémentation réelle, on capturerait l'erreur et on renverrait un résultat avec success: false)
    });
});