/**
 * Configuration d'initialisation pour les tests unitaires
 * Ce fichier est exécuté avant chaque fichier de test unitaire
 */

// Configuration globale pour les tests unitaires
process.env.NODE_ENV = 'test';

// Augmenter le délai par défaut pour les tests asynchrones
jest.setTimeout(10000);

// Configuration des mocks globaux si nécessaire
// jest.mock('./path/to/module', () => ({ ... }));

// Extensions Jest personnalisées
expect.extend({
    toBeValidMcpObject(received) {
        // Exemple de validateur personnalisé pour les objets MCP
        const isValid = received &&
            typeof received === 'object' &&
            'type' in received &&
            'version' in received &&
            'data' in received;

        if (isValid) {
            return {
                message: () => `expected ${received} not to be a valid MCP object`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid MCP object with type, version and data properties`,
                pass: false,
            };
        }
    },
});