/**
 * Configuration globale d'initialisation pour les tests d'intégration
 * Ce fichier est exécuté une fois avant tous les tests d'intégration
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
    console.log('\n[Test Environment] Configuration de l\'environnement de test d\'intégration...');

    // Créer un répertoire temporaire pour les tests si nécessaire
    const testTmpDir = path.join(__dirname, '.test-tmp');
    if (!fs.existsSync(testTmpDir)) {
        fs.mkdirSync(testTmpDir, { recursive: true });
    }

    // Variables globales accessibles à tous les tests
    global.__TEST_TMP_DIR__ = testTmpDir;

    // Configuration des services de test (bases de données, serveurs, etc.)
    try {
        // Exemple : démarrer une base de données de test
        console.log('[Test Environment] Démarrage des services de test...');

        // Option 1: Si vous utilisez Docker pour les services de test
        // execSync('docker-compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });

        // Option 2: Si vous utilisez des bases de données en mémoire
        global.__TEST_DB__ = await setupInMemoryDatabase();

        console.log('[Test Environment] Services de test prêts');
    } catch (error) {
        console.error('[Test Environment] Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
};

/**
 * Configure une base de données en mémoire pour les tests
 */
async function setupInMemoryDatabase() {
    // Implémentation d'une base de données en mémoire pour les tests
    // Exemple : SQLite en mémoire, MongoDB en mémoire, etc.
    return {
        // Exemple de connexion à une base de données en mémoire
        connect: () => console.log('Connected to in-memory database'),
        disconnect: () => console.log('Disconnected from in-memory database'),
        // Autres méthodes utiles pour les tests...
    };
}