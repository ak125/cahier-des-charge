/**
 * Configuration Jest pour les tests unitaires
 */

module.exports = {
    displayName: 'Unit Tests',
    testMatch: ['**/__tests__/unit/**/*.[jt]s?(x)', '**/?(*.)+(unit|spec).[jt]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/', '/integration/'],
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
    setupFilesAfterEnv: ['<rootDir>/jest.setup.unit.js'],
    testEnvironment: 'node',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    verbose: true,
};