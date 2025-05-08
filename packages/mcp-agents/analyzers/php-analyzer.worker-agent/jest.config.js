/**
 * Configuration Jest spécifique pour l'agent PhpAnalyzer
 * Résout le problème de compatibilité entre watchman et haste.enableSymlinks
 */

module.exports = {
    // Configuration de base pour les tests
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }],
    },
    // Désactiver les fonctionnalités problématiques
    watchman: false,
    haste: {
        enableSymlinks: false,
    },
    // Inclure uniquement les tests dans le dossier __tests__
    testMatch: ['**/__tests__/**/*.test.ts'],
    // Permettre de passer les tests même s'il n'y en a pas pour le moment
    passWithNoTests: true,
    // Augmenter les délais d'attente pour les environnements complexes
    testTimeout: 30000,
};