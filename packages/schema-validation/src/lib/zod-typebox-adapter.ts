import { TSchema, TObject } from '@sinclair/typebox';
import { z } from 'zod';
import { TypeBoxConfig } from './typebox-config';

/**
 * Adaptateur permettant d'intégrer Zod et TypeBox
 * Utile pour les projets qui migrent progressivement de Zod vers TypeBox
 * ou qui doivent maintenir la compatibilité avec les deux systèmes
 */
export class ZodTypeBoxAdapter {
    /**
     * Convertit un schéma TypeBox en schéma Zod équivalent (conversion simplifiée)
     * Note: Cette conversion ne prend pas en charge tous les cas complexes
     */
    static typeBoxToZod(schema: TSchema): z.ZodType<any> {
        // Implémentation de base - à étendre selon les besoins du projet
        if (schema.type === 'string') {
            let zodSchema = z.string();

            if (schema.minLength !== undefined) {
                zodSchema = zodSchema.min(schema.minLength);
            }
            if (schema.maxLength !== undefined) {
                zodSchema = zodSchema.max(schema.maxLength);
            }
            if (schema.format === 'email') {
                zodSchema = zodSchema.email();
            }
            if (schema.format === 'uuid') {
                zodSchema = zodSchema.uuid();
            }
            if (schema.format === 'url') {
                zodSchema = zodSchema.url();
            }
            if (schema.format === 'date-time') {
                zodSchema = zodSchema.datetime();
            }

            return zodSchema;
        }
        else if (schema.type === 'number' || schema.type === 'integer') {
            let zodSchema = z.number();

            if (schema.minimum !== undefined) {
                zodSchema = zodSchema.min(schema.minimum);
            }
            if (schema.maximum !== undefined) {
                zodSchema = zodSchema.max(schema.maximum);
            }
            if (schema.type === 'integer') {
                zodSchema = zodSchema.int();
            }

            return zodSchema;
        }
        else if (schema.type === 'boolean') {
            return z.boolean();
        }
        else if (schema.type === 'null') {
            return z.null();
        }
        else if (schema.type === 'array' && schema.items) {
            return z.array(this.typeBoxToZod(schema.items as TSchema));
        }
        else if (schema.type === 'object' && schema.properties) {
            const objectSchema = schema as TObject;
            const zodSchemaObject: { [key: string]: z.ZodType<any> } = {};

            for (const key in objectSchema.properties) {
                zodSchemaObject[key] = this.typeBoxToZod(objectSchema.properties[key] as TSchema);

                if (objectSchema.required?.includes(key) !== true) {
                    zodSchemaObject[key] = zodSchemaObject[key].optional();
                }
            }

            return z.object(zodSchemaObject);
        }
        else if (schema.anyOf || schema.oneOf) {
            const unionSchemas = (schema.anyOf || schema.oneOf)?.map(s => this.typeBoxToZod(s as TSchema));
            return z.union(unionSchemas as [z.ZodType<any>, z.ZodType<any>, ...z.ZodType<any>[]]);
        }

        // Type non pris en charge, retourner un type any par défaut
        return z.any();
    }

    /**
     * Valide une valeur en utilisant un schéma TypeBox, mais retourne les erreurs au format Zod
     * Utile pour la compatibilité avec du code existant qui s'attend à des erreurs Zod
     */
    static validateAsZod<T>(schema: TSchema, value: unknown): {
        success: boolean;
        data?: T;
        error?: z.ZodError;
    } {
        const result = TypeBoxConfig.validate(schema, value);

        if (result.success) {
            return { success: true, data: value as T };
        }

        // Créer une structure d'erreur compatible avec Zod
        const zodErrors = result.errors?.map(err => ({
            code: 'custom',
            path: err.path.split('/').filter(Boolean),
            message: err.message,
        })) || [];

        // Créer un ZodError similaire
        const zodError = new z.ZodError(zodErrors);

        return {
            success: false,
            error: zodError,
        };
    }
}