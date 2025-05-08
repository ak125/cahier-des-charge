/**
 * Configuration Jest principale pour l'architecture MCP 2.0
 * Ce fichier exporte les projets Jest pour les tests unitaires et d'intégration
 */

module.exports = {
    projects: [
        '<rootDir>/jest.unit.config.js',
        '<rootDir>/jest.integration.config.js',
    ],
    collectCoverageFrom: [
        '**/*.{js,ts}',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/build/**',
        '!**/coverage/**',
        '!**/wasm-agents/build/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'test-results',
                outputName: 'junit.xml',
            },
        ],
    ],
};