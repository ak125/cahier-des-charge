/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/packages/business', '<rootDir>/packages/orchestration'],
    testMatch: ['**/?(*.)+(spec|test).(ts|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.json',
        }]
    },
    moduleNameMapper: {
        '^@packages/business/(.*)$': '<rootDir>/packages/business/$1',
        '^@packages/orchestration/(.*)$': '<rootDir>/packages/orchestration/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.orchestrator.setup.js'],
    collectCoverageFrom: [
        'packages/business/**/*.{ts,js}',
        'packages/orchestration/**/*.{ts,js}',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/dist/**',
        '!**/coverage/**'
    ],
    coverageDirectory: 'packages/business/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    testTimeout: 30000, // Temporel peut prendre un peu plus de temps lors des tests
    verbose: true
};