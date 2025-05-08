#!/usr/bin/env node
/**
 * Script de test des redirections SEO
 * 
 * Ce script permet de valider les redirections SEO configurées lors d'une migration
 * en utilisant le module RedirectValidator. Il peut charger les redirections depuis
 * différentes sources (JSON, .htaccess, NGINX) et générer des rapports détaillés.
 * 
 * Usage: 
 *   npx ts-node tools/test-redirects.ts --source=json --file=./redirects.json --baseUrl=https://example.com
 *   npx ts-node tools/test-redirects.ts --source=htaccess --file=./public/.htaccess --baseUrl=https://example.com
 *   npx ts-node tools/test-redirects.ts --source=nginx --file=./nginx/redirects.conf --baseUrl=https://example.com
 */

import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import {
    RedirectValidator,
    RedirectType,
    RedirectConfig,
    RedirectSource
} from '../agents/seo/redirect-validator';
import chalk from 'chalk';

// Configuration du programme avec les options CLI
program
    .version('1.0.0')
    .description('Test SEO redirections and validate they work correctly')
    .option('-s, --source <type>', 'Source des redirections (json, htaccess, nginx, custom)', 'json')
    .option('-f, --file <path>', 'Chemin vers le fichier source des redirections')
    .option('-b, --baseUrl <url>', 'URL de base pour les tests', 'http://localhost:3000')
    .option('-o, --output <dir>', 'Répertoire pour les rapports', './redirect-validation-reports')
    .option('-t, --timeout <ms>', 'Délai d\'attente pour les requêtes en ms', '5000')
    .option('-e, --export <path>', 'Exporter les redirections au format Caddyfile')
    .option('-i, --include-regex', 'Inclure les règles avec expressions régulières', false)
    .option('-m, --max <number>', 'Nombre maximum de redirections à tester', '0')
    .parse(process.argv);

const options = program.opts();

/**
 * Point d'entrée principal du script
 */
async function main() {
    try {
        console.log(chalk.blue('🔍 Démarrage du test des redirections SEO'));
        console.log(chalk.gray(`Source: ${options.source}`));
        console.log(chalk.gray(`URL de base: ${options.baseUrl}`));

        // Vérifier le fichier source
        if (!options.file) {
            console.error(chalk.red('❌ Erreur: Le chemin du fichier source des redirections est requis (--file)'));
            program.help();
            process.exit(1);
        }

        // Vérifier l'existence du fichier
        try {
            await fs.access(options.file);
        } catch (error) {
            console.error(chalk.red(`❌ Erreur: Le fichier ${options.file} n'existe pas`));
            process.exit(1);
        }

        // Initialiser le validateur de redirections
        const validator = new RedirectValidator({
            baseUrl: options.baseUrl,
            timeout: parseInt(options.timeout, 10),
            outputDir: options.output,
            followRedirects: false,
            headers: {
                'User-Agent': 'SEO-Redirect-Tester/1.0',
            }
        });

        // Charger les redirections depuis la source spécifiée
        console.log(chalk.yellow(`📂 Chargement des redirections depuis ${options.file}...`));
        switch (options.source.toLowerCase()) {
            case RedirectSource.JSON:
                await validator.loadRedirectsFromFile(options.file);
                break;
            case RedirectSource.HTACCESS:
                await validator.loadRedirectsFromHtaccess(options.file);
                break;
            case RedirectSource.NGINX:
                await validator.loadRedirectsFromNginx(options.file);
                break;
            case RedirectSource.CUSTOM:
                // Format personnalisé : appeler la fonction appropriée ici
                console.log(chalk.yellow('⚠️ Format personnalisé : vous devez implémenter votre propre chargeur'));
                break;
            default:
                console.error(chalk.red(`❌ Source non supportée: ${options.source}`));
                process.exit(1);
        }

        // Exécuter les tests de redirection
        console.log(chalk.blue('🧪 Validation des redirections...'));
        const results = await validator.validateAll();

        // Afficher le résumé des résultats
        const successCount = results.filter(r => r.status === 'success').length;
        const totalCount = results.length;
        const successRate = (successCount / totalCount) * 100;

        console.log('\n');
        console.log(chalk.bold('📊 Résumé des résultats:'));
        console.log(chalk.gray('-----------------------------------'));
        console.log(`Total des redirections testées: ${chalk.bold(totalCount)}`);
        console.log(`Redirections réussies: ${chalk.green.bold(successCount)}`);
        console.log(`Redirections échouées: ${chalk.red.bold(totalCount - successCount)}`);
        console.log(`Taux de réussite: ${chalk.bold(successRate.toFixed(2))}%`);

        // Si le taux de réussite est trop bas, sortir avec un code d'erreur
        if (successRate < 95) {
            console.log(chalk.yellow('⚠️ Le taux de réussite est inférieur à 95%'));
        }

        // Exporter les redirections au format Caddyfile si demandé
        if (options.export) {
            console.log(chalk.blue(`📤 Exportation des redirections vers ${options.export}...`));
            await validator.exportToCaddyfile(options.export);
            console.log(chalk.green(`✅ Redirections exportées avec succès vers ${options.export}`));
        }

        console.log(chalk.green('\n✅ Tests de redirections terminés'));

        // Afficher le chemin vers les rapports générés
        console.log(chalk.gray(`📁 Rapports disponibles dans : ${path.resolve(options.output)}`));

    } catch (error) {
        console.error(chalk.red('❌ Une erreur est survenue :'));
        console.error(error);
        process.exit(1);
    }
}

/**
 * Fonction utilitaire pour convertir les règles de redirection au format standard
 */
function convertToRedirectConfigs(rules: any[]): RedirectConfig[] {
    return rules.map(rule => {
        const redirectType = getRedirectTypeFromStatusCode(rule.statusCode || 301);
        return {
            source: rule.source,
            target: rule.destination || rule.target,
            type: redirectType,
            regex: rule.isRegex || rule.regex || false
        };
    });
}

/**
 * Convertit un code HTTP en type de redirection
 */
function getRedirectTypeFromStatusCode(statusCode: number): RedirectType {
    switch (statusCode) {
        case 301:
            return RedirectType.PERMANENT;
        case 302:
            return RedirectType.FOUND;
        case 303:
            return RedirectType.SEE_OTHER;
        case 410:
            return RedirectType.GONE;
        case 412:
            return RedirectType.PRECONDITION;
        default:
            return RedirectType.PERMANENT; // Par défaut, utiliser 301
    }
}

// Exécuter le script
main().catch(error => {
    console.error(chalk.red('❌ Erreur fatale:'));
    console.error(error);
    process.exit(1);
});