/**
 * Tests unitaires pour le validateur MCP
 */
import { McpValidator } from '../src/validators/mcp-validator';
import { z } from 'zod';
import { AgentContextSchema, AgentResultSchema } from '../src/types';

describe('McpValidator', () => {
    // Schémas personnalisés pour les tests
    const customInputSchema = z.object({
        jobId: z.string().uuid(),
        inputs: z.object({
            text: z.string().min(5).max(100),
            options: z.object({
                format: z.enum(['json', 'text', 'html']).optional(),
                optimize: z.boolean().default(false),
            }).optional(),
        }),
    });

    const customOutputSchema = z.object({
        success: z.boolean(),
        data: z.object({
            processedText: z.string(),
            stats: z.object({
                inputLength: z.number(),
                outputLength: z.number(),
            }),
        }).optional(),
        error: z.instanceof(Error).optional(),
        metrics: z.object({
            startTime: z.number(),
            endTime: z.number(),
            duration: z.number(),
        }),
    });

    describe('validateInput', () => {
        test('devrait valider un contexte valide avec le schéma par défaut', () => {
            const validContext = {
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                inputs: { key1: 'value1', key2: 42 },
            };

            const result = McpValidator.validateInput(validContext);
            expect(result.valid).toBe(true);
            expect(result.data).toEqual(validContext);
        });

        test('devrait rejeter un contexte invalide avec le schéma par défaut', () => {
            const invalidContext = {
                // Pas de jobId, qui est obligatoire
                inputs: { key1: 'value1' },
            };

            const result = McpValidator.validateInput(invalidContext);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        test('devrait valider un contexte avec un schéma personnalisé', () => {
            const validContext = {
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                inputs: {
                    text: 'Voici un texte suffisamment long',
                    options: {
                        format: 'json',
                        optimize: true,
                    },
                },
            };

            const result = McpValidator.validateInput(validContext, customInputSchema);
            expect(result.valid).toBe(true);
            expect(result.data).toEqual(validContext);
        });

        test('devrait rejeter un contexte ne correspondant pas au schéma personnalisé', () => {
            const invalidContext = {
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                inputs: {
                    text: 'Court', // trop court
                    options: {
                        format: 'xml', // pas dans l'enum
                    },
                },
            };

            const result = McpValidator.validateInput(invalidContext, customInputSchema);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });

    describe('validateOutput', () => {
        test('devrait valider un résultat valide avec le schéma par défaut', () => {
            const validResult = {
                success: true,
                data: { key1: 'value1', key2: 42 },
                metrics: {
                    startTime: Date.now() - 100,
                    endTime: Date.now(),
                    duration: 100,
                },
            };

            const result = McpValidator.validateOutput(validResult);
            expect(result.valid).toBe(true);
            expect(result.data).toEqual(validResult);
        });

        test('devrait rejeter un résultat invalide avec le schéma par défaut', () => {
            const invalidResult = {
                success: true,
                // Pas de metrics, qui sont obligatoires
            };

            const result = McpValidator.validateOutput(invalidResult);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        test('devrait valider un résultat avec un schéma personnalisé', () => {
            const validResult = {
                success: true,
                data: {
                    processedText: 'Texte traité avec succès',
                    stats: {
                        inputLength: 10,
                        outputLength: 25,
                    },
                },
                metrics: {
                    startTime: Date.now() - 100,
                    endTime: Date.now(),
                    duration: 100,
                },
            };

            const result = McpValidator.validateOutput(validResult, customOutputSchema);
            expect(result.valid).toBe(true);
            expect(result.data).toEqual(validResult);
        });

        test('devrait rejeter un résultat ne correspondant pas au schéma personnalisé', () => {
            const invalidResult = {
                success: true,
                data: {
                    processedText: 'Texte traité',
                    // stats manquant
                },
                metrics: {
                    startTime: Date.now() - 100,
                    endTime: Date.now(),
                    duration: 100,
                },
            };

            const result = McpValidator.validateOutput(invalidResult, customOutputSchema);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });

    describe('createAgentValidator', () => {
        test('devrait créer un validateur personnalisé pour un agent', () => {
            const agentValidator = McpValidator.createAgentValidator(
                customInputSchema,
                customOutputSchema
            );

            expect(agentValidator).toHaveProperty('validateInput');
            expect(agentValidator).toHaveProperty('validateOutput');

            // Test du validateur personnalisé
            const validContext = {
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                inputs: {
                    text: 'Voici un texte suffisamment long',
                },
            };

            const inputResult = agentValidator.validateInput(validContext);
            expect(inputResult.valid).toBe(true);

            const validOutput = {
                success: true,
                data: {
                    processedText: 'Texte traité avec succès',
                    stats: {
                        inputLength: 30,
                        outputLength: 25,
                    },
                },
                metrics: {
                    startTime: Date.now() - 100,
                    endTime: Date.now(),
                    duration: 100,
                },
            };

            const outputResult = agentValidator.validateOutput(validOutput);
            expect(outputResult.valid).toBe(true);
        });
    });
});