/**
 * Configuration Jest pour les tests d'intégration
 */

module.exports = {
    displayName: 'Integration Tests',
    testMatch: ['**/__tests__/integration/**/*.[jt]s?(x)', '**/?(*.)+(integration|e2e).[jt]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/', '/unit/'],
    transform: {
        '^.+\\.[t|j]s?$': [
            'ts-jest',
            {
                isolatedModules: true,
                tsconfig: '<rootDir>/tsconfig.json',
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    preset: 'ts-jest',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
    testEnvironment: 'node',
    collectCoverage: false, // Désactivé par défaut pour les tests d'intégration
    globalSetup: '<rootDir>/jest.global.setup.js',
    globalTeardown: '<rootDir>/jest.global.teardown.js',
    testTimeout: 30000, // Délai plus long pour les tests d'intégration
    verbose: true,
};