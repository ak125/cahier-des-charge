import { Type, Static } from '@sinclair/typebox';
import { TypeBoxConfig, StandardSchemas, RestApiSchemas, validateSchema } from '../index';

/**
 * Exemple d'utilisation de TypeBox avec notre configuration standardisée
 * Ce fichier sert de démonstration des différentes fonctionnalités
 */

// Exemple de schéma d'utilisateur
const UserSchema = Type.Object({
    firstName: Type.String({ minLength: 2, maxLength: 50 }),
    lastName: Type.String({ minLength: 2, maxLength: 50 }),
    email: StandardSchemas.Primitives.Email,
    role: Type.Union([
        Type.Literal('admin'),
        Type.Literal('user'),
        Type.Literal('guest')
    ], { default: 'user' }),
    isActive: Type.Boolean({ default: true }),
    birthDate: Type.Optional(StandardSchemas.Primitives.DateTime),
    preferences: Type.Optional(Type.Object({
        theme: Type.Union([Type.Literal('light'), Type.Literal('dark')], { default: 'light' }),
        notifications: Type.Boolean({ default: true }),
        language: Type.String({ default: 'fr' }),
    })),
}, {
    $id: 'User'
});

// Type TypeScript dérivé automatiquement du schéma
type User = Static<typeof UserSchema>;

// Création des schémas CRUD pour l'API REST
const userApiSchemas = RestApiSchemas.createCrudSchemas(UserSchema, 'User');

// Exemple d'utilisation pour la validation
const validateUser = (userData: unknown): {
    valid: boolean;
    user?: User;
    errors?: { path: string; message: string }[]
} => {
    const result = validateSchema<User>(UserSchema, userData);
    return {
        valid: result.valid,
        user: result.value,
        errors: result.errors
    };
};

// Exemple d'utilisation de validation avec compilation pour optimiser les performances
const userValidator = TypeBoxConfig.compile(UserSchema);

const validateUserOptimized = (userData: unknown): boolean => {
    return userValidator.Check(userData);
};

// Exporter les types et schémas pour utilisation
export {
    UserSchema,
    User,
    userApiSchemas,
    validateUser,
    validateUserOptimized
};