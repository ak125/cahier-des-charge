/**
 * Configuration Jest pour les tests d'intégration
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  testTimeout: 30000, // Tests d'intégration peuvent prendre plus de temps
  collectCoverage: true,
  collectCoverageFrom: [
    'src/orchestration/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  maxWorkers: 1, // Exécuter les tests d'intégration séquentiellement
  bail: false, // Continuer à exécuter les tests même si certains échouent
  moduleNameMapper: {
    // Ajouter des mappages de modules si nécessaire
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Désactiver explicitement le cache pour éviter les problèmes de compilation
  cache: false,
  // Ignorer les répertoires de sauvegarde pour éviter les collisions de modules
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/clean-structure-backups/',
    '<rootDir>/backup_structure-backups/',
    '<rootDir>/consolidation-logs/',
  ],
  // Configurer watchPathIgnorePatterns pour ignorer les mêmes répertoires
  watchPathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/clean-structure-backups/',
    '<rootDir>/backup_structure-backups/',
    '<rootDir>/consolidation-logs/',
  ],
  // Configurer le resolver Haste pour éviter les collisions
  haste: {
    forceNodeFilesystemAPI: true, // Utiliser NodeJS pour éviter les problèmes avec les liens symboliques
    enableSymlinks: true, // Prendre en charge les liens symboliques
    throwOnModuleCollision: false, // Ne pas échouer en cas de collision, utiliser le premier module trouvé
  },
};
