/**
 * Configuration pour les tests d'intégration de l'orchestrateur standardisé
 *
 * Ce fichier est exécuté avant tous les tests d'intégration
 */

// Étendre le timeout global pour les tests d'intégration
jest.setTimeout(30000);

// Configuration pour les matchers personnalisés Jest
expect.extend({
  toBeValidTaskId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid task ID`,
        pass: true,
      };
    }
    return {
      message: () => `Expected ${received} to be a valid task ID (non-empty string)`,
      pass: false,
    };
  },
});

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.TEMPORAL_ADDRESS = 'localhost:7233';

console.log("🧪 Configuration des tests d'intégration chargée");
