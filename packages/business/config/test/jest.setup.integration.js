/**
 * Configuration d'initialisation pour les tests d'intégration
 * Ce fichier est exécuté avant chaque fichier de test d'intégration
 */

// Configuration globale pour les tests d'intégration
process.env.NODE_ENV = 'test';
process.env.INTEGRATION_TEST = 'true';

// Augmenter le délai par défaut pour les tests d'intégration
jest.setTimeout(30000);

// Extensions Jest personnalisées pour les tests d'intégration
expect.extend({
    toMatchResponseSchema(received, schema) {
        // Validateur personnalisé pour les réponses API
        const validation = schema.safeParse(received);

        if (validation.success) {
            return {
                message: () => `expected response not to match schema`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected response to match schema\nErrors: ${JSON.stringify(validation.error.errors, null, 2)}`,
                pass: false,
            };
        }
    },
});