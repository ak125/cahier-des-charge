import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { FormatRegistry } from '@sinclair/typebox/format';
import { ValueErrorType } from '@sinclair/typebox/errors';
import { Type, TSchema } from '@sinclair/typebox';

/**
 * Configuration standardisée pour TypeBox
 * Fournit des formats personnalisés et des utilitaires de validation
 */
export class TypeBoxConfig {
    /**
     * Initialise les formats personnalisés et les paramètres TypeBox standards
     */
    static initialize() {
        // Formats personnalisés
        FormatRegistry.Set('email', (value) => {
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return regex.test(value as string);
        });

        FormatRegistry.Set('uuid', (value) => {
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return regex.test(value as string);
        });

        FormatRegistry.Set('date-time', (value) => {
            const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
            return regex.test(value as string);
        });

        FormatRegistry.Set('url', (value) => {
            try {
                new URL(value as string);
                return true;
            } catch {
                return false;
            }
        });

        FormatRegistry.Set('password', (value) => {
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/;
            return regex.test(value as string);
        });

        // Autres formats personnalisés pour votre projet peuvent être ajoutés ici
    }

    /**
     * Compile un schéma TypeBox pour une validation optimisée
     */
    static compile<T extends TSchema>(schema: T): TypeCheck<T> {
        return TypeCompiler.Compile(schema);
    }

    /**
     * Valide une valeur contre un schéma TypeBox et retourne les erreurs
     */
    static validate<T extends TSchema>(
        schema: T,
        value: unknown
    ): { success: boolean; errors?: ValueErrorType[] } {
        const check = TypeCompiler.Compile(schema);
        const success = check.Check(value);

        if (success) {
            return { success: true };
        }

        const errors = [...check.Errors(value)];
        return { success: false, errors };
    }

    /**
     * Formate les erreurs de validation pour affichage à l'utilisateur
     */
    static formatErrors(errors: ValueErrorType[]): { path: string; message: string }[] {
        return errors.map((error) => ({
            path: error.path,
            message: error.message,
        }));
    }
}

// Initialiser la configuration au démarrage
TypeBoxConfig.initialize();