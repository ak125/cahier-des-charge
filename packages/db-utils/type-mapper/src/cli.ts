#!/usr/bin/env node

/**
 * CLI pour la conversion de types entre MySQL, PostgreSQL et Prisma
 */
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { TypeMapper } from './type-mapper';

const program = new Command();
const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);

program
    .name('type-mapper')
    .description('Outil de mappage de types entre MySQL, PostgreSQL et Prisma')
    .version(packageJson.version);

program
    .command('analyze')
    .description('Analyser un schéma MySQL et générer un mapping vers PostgreSQL et Prisma')
    .option('-s, --schema <path>', 'Chemin vers le fichier SQL contenant le schéma MySQL')
    .option('-h, --host <host>', 'Hôte de la base de données MySQL', 'localhost')
    .option('-p, --port <port>', 'Port de la base de données MySQL', '3306')
    .option('-u, --user <user>', 'Utilisateur de la base de données MySQL')
    .option('-P, --password <password>', 'Mot de passe de la base de données MySQL')
    .option('-d, --database <name>', 'Nom de la base de données MySQL')
    .option('--json <path>', 'Chemin où sauvegarder le résultat du mapping au format JSON')
    .option('--prisma <path>', 'Chemin où sauvegarder le schéma Prisma généré')
    .option('--markdown <path>', 'Chemin où sauvegarder la documentation Markdown')
    .action(async (options) => {
        try {
            const mapper = new TypeMapper({
                mysqlSchemaPath: options.schema,
                databaseHost: options.host,
                databasePort: parseInt(options.port, 10),
                databaseUser: options.user,
                databasePassword: options.password,
                databaseName: options.database,
                outputJsonPath: options.json,
                outputPrismaPath: options.prisma,
                outputMarkdownPath: options.markdown,
            });

            console.log('Analyse du schéma MySQL...');

            const result = await mapper.analyze();

            // Statistiques basiques
            console.log(`Analyse terminée. ${result.tables.length} tables analysées.`);

            if (result.enums.length > 0) {
                console.log(`${result.enums.length} types énumérés détectés.`);
            }

            // Anomalies détectées
            const anomaliesCount = result.tables
                .filter(t => t.anomalies && t.anomalies.length > 0)
                .reduce((sum, t) => sum + t.anomalies!.length, 0);

            if (anomaliesCount > 0) {
                console.log(`${anomaliesCount} anomalies potentielles détectées.`);
            }

            // Sauvegarder les résultats
            console.log('Sauvegarde des résultats...');
            await mapper.saveResults(result);

            if (options.json) {
                console.log(`Résultat JSON sauvegardé à ${options.json}`);
            }

            if (options.prisma) {
                console.log(`Schéma Prisma sauvegardé à ${options.prisma}`);
            }

            if (options.markdown) {
                console.log(`Documentation Markdown sauvegardée à ${options.markdown}`);
            }

            console.log('Opération terminée avec succès.');
        } catch (error) {
            console.error('Erreur lors de l\'analyse du schéma:', error);
            process.exit(1);
        }
    });

program.parse(process.argv);