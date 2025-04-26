/**
 * Configuration Jest pour résoudre les problèmes de collision de nommage Haste
 * et permettre l'exécution des tests malgré les noms de modules dupliqués.
 */

module.exports = {
    // Utiliser un détecteur de modules personnalisé pour éviter les collisions
    modulePathIgnorePatterns: [
        // Ignorer tous les dossiers de backup qui causent les collisions
        "_backup_",
        ".merged"
    ],
    // Désactiver le cache de Haste pour éviter les problèmes de collision
    haste: {
        forceNodeFilesystemAPI: true,
        enableSymlinks: true
    },
    // Configuration spécifique pour les tests
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },
    // Permettre de passer les tests même s'il n'y en a pas pour le moment
    passWithNoTests: true,
    // Augmenter les délais d'attente pour les environnements complexes
    testTimeout: 30000
};