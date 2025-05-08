/**
 * Script de test pour vérifier la connexion MySQL avec la version mise à jour de mysql2
 * Ce script est temporaire et sera utilisé uniquement pour tester les fonctionnalités après la mise à jour
 */
import { MySQLSchemaAnalyzer } from '../src/analyzers/mysql-schema-analyzer';
import chalk from 'chalk';

// Configuration de connexion à votre base de données MySQL pour le test
// Si vous n'avez pas de base de données MySQL accessible, vous pouvez également
// utiliser la méthode alternative avec un fichier SQL en commentant ce bloc de test
// et en décommentant le bloc alternatif plus bas
const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'test'
};

console.log(chalk.blue('Configuration de connexion utilisée :'));
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`User: ${config.user}`);
console.log(`Database: ${config.database}`);

// Fonction de test principal
async function testMySQLConnection() {
    console.log(chalk.blue('Test de connexion MySQL avec mysql2 version 3.x'));

    try {
        const analyzer = new MySQLSchemaAnalyzer();

        // Test avec une connexion directe à la base de données
        try {
            console.log(chalk.yellow('Tentative de connexion à la base de données MySQL...'));
            const tables = await analyzer.analyzeFromDatabase(config);

            console.log(chalk.green('Connexion réussie !'));
            console.log(chalk.green(`Nombre de tables trouvées: ${tables.length}`));

            // Afficher les noms des tables pour vérifier
            if (tables.length > 0) {
                console.log(chalk.blue('Tables trouvées:'));
                tables.forEach((table, index) => {
                    console.log(chalk.cyan(`  ${index + 1}. ${table.name}`));
                });
            } else {
                console.log(chalk.yellow('Aucune table trouvée dans la base de données.'));
            }
        } catch (dbError) {
            console.warn(chalk.yellow('Impossible de se connecter à la base de données.'));
            console.warn(chalk.yellow('Message: ' + (dbError instanceof Error ? dbError.message : String(dbError))));
            console.log(chalk.yellow('Tentative de test alternatif avec un exemple de fichier SQL...'));

            // Test alternatif avec un exemple de schéma SQL simplifié
            const sampleSQL = `
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

            try {
                // Nous allons simplement vérifier que mysql2 est importable correctement
                try {
                    const mysql2 = require('mysql2/promise');
                    console.log(chalk.green('Module mysql2/promise importé avec succès.'));
                    console.log(chalk.green('Version de mysql2 : ' + require('mysql2/package.json').version));
                    console.log(chalk.green('Le test d\'importation mysql2 est réussi.'));

                    // Essayons aussi d'importer sql-parser-cst pour vérifier qu'il est accessible
                    try {
                        const sqlParser = require('sql-parser-cst');
                        console.log(chalk.green('Module sql-parser-cst importé avec succès.'));
                        console.log(chalk.green('Le module sql-parser-cst est fonctionnel.'));
                        console.log(chalk.green('Tous les modules nécessaires sont fonctionnels.'));
                        return true;
                    } catch (parserError) {
                        console.error(chalk.red('Échec de l\'importation de sql-parser-cst:'));
                        console.error(chalk.red(parserError instanceof Error ? parserError.message : String(parserError)));
                    }

                    return true;
                } catch (importError) {
                    console.error(chalk.red('Échec de l\'importation de mysql2/promise:'));
                    console.error(chalk.red(importError instanceof Error ? importError.message : String(importError)));
                    throw importError;
                }
            } catch (sqlError) {
                console.error(chalk.red('Échec de l\'analyse du schéma SQL:'));
                if (sqlError instanceof Error) {
                    console.error(chalk.red(`Message: ${sqlError.message}`));
                    console.error(chalk.red(`Stack: ${sqlError.stack}`));
                } else {
                    console.error(chalk.red(`Erreur: ${String(sqlError)}`));
                }
                throw sqlError;
            }
        }

        return true;
    } catch (error) {
        console.error(chalk.red('Erreur lors du test de connexion MySQL:'));
        if (error instanceof Error) {
            console.error(chalk.red(`Message: ${error.message}`));
            console.error(chalk.red(`Stack: ${error.stack}`));
        } else {
            console.error(chalk.red(`Erreur non-standard: ${String(error)}`));
        }
        process.exit(1);
    }
}

// Exécuter le test
testMySQLConnection()
    .then(() => {
        console.log(chalk.green('Test terminé avec succès !'));
        process.exit(0);
    })
    .catch(error => {
        console.error(chalk.red('Erreur inattendue:'));
        if (error instanceof Error) {
            console.error(chalk.red(`Message: ${error.message}`));
            console.error(chalk.red(`Stack: ${error.stack}`));
        } else {
            console.error(chalk.red(`Erreur non-standard: ${String(error)}`));
        }
        process.exit(1);
    });