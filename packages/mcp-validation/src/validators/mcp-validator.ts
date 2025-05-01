/**
 * Validateur principal pour les entrées et sorties des agents MCP
 */

import { z, ZodError, ZodSchema } from 'zod';
import { AgentContextSchema, AgentResultSchema } from '../types';

export class McpValidator {
    /**
     * Valide un contexte d'entrée selon un schéma
     * @param context Contexte à valider
     * @param schema Schéma de validation (optionnel, utilise AgentContextSchema par défaut)
     */
    static validateInput(
        context: any,
        schema: ZodSchema = AgentContextSchema
    ): { valid: boolean; data?: any; errors?: ZodError } {
        try {
            const validatedData = schema.parse(context);
            return { valid: true, data: validatedData };
        } catch (error) {
            if (error instanceof ZodError) {
                return { valid: false, errors: error };
            }
            throw error;
        }
    }

    /**
     * Valide un résultat d'agent selon un schéma
     * @param result Résultat à valider
     * @param schema Schéma de validation (optionnel, utilise AgentResultSchema par défaut)
     */
    static validateOutput(
        result: any,
        schema: ZodSchema = AgentResultSchema
    ): { valid: boolean; data?: any; errors?: ZodError } {
        try {
            const validatedData = schema.parse(result);
            return { valid: true, data: validatedData };
        } catch (error) {
            if (error instanceof ZodError) {
                return { valid: false, errors: error };
            }
            throw error;
        }
    }

    /**
     * Crée un validateur spécifique pour un agent avec des schémas personnalisés
     * @param inputSchema Schéma pour valider les entrées
     * @param outputSchema Schéma pour valider les sorties
     */
    static createAgentValidator(
        inputSchema?: ZodSchema,
        outputSchema?: ZodSchema
    ) {
        return {
            validateInput: (context: any) =>
                this.validateInput(context, inputSchema || AgentContextSchema),

            validateOutput: (result: any) =>
                this.validateOutput(result, outputSchema || AgentResultSchema)
        };
    }
}