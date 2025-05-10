/** @type {import('jest').Config} */
module.exports = {
    // Racine du projet pour les chemins relatifs
    rootDir: '.',

    // Configuration du resolver pour éviter les conflits de nommage Haste
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/packages/$1'
    },

    // Ignorer les dossiers node_modules et dist
    modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

    // Gérer les conflits de nommage Haste
    haste: {
        forceNodeFilesystemAPI: true,
        hasteImplModulePath: null,
    },

    // Motifs d'exclusion pour les fichiers de test
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    // Extensions des fichiers de test
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

    // Permettre les fichiers de test avec ces extensions
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

    // Utiliser l'environnement Node.js pour les tests
    testEnvironment: 'node',

    // Verbose pour un rapport détaillé
    verbose: true
};
