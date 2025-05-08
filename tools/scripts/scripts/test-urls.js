#!/usr/bin/env node
/**
 * Script de test des URLs pour vérifier que les anciennes URLs sont préservées sans redirection
 * 
 * Permet de tester que les URLs PHP sont correctement servies avec un statut 200
 * sans être redirigées vers une nouvelle URL.
 * 
 * Usage:
 *   node test-urls.js --urls=./legacy-urls.txt --base-url=https://example.com --expect=200 --no-redirect
 */

const fs = require('fs').promises;
const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
    .description('Teste que les anciennes URLs sont préservées sans redirection')
    .option('-u, --urls <path>', 'Chemin vers le fichier contenant les URLs à tester')
    .option('-b, --base-url <url>', 'URL de base pour les tests', 'http://localhost:3000')
    .option('-e, --expect <status>', 'Code HTTP attendu', '200')
    .option('--no-redirect', 'Vérifie qu\'aucune redirection ne se produit')
    .option('--timeout <ms>', 'Timeout en millisecondes', '5000')
    .option('-v, --verbose', 'Mode verbeux')
    .parse();

const options = program.opts();

/**
 * Charge les URLs depuis un fichier
 */
async function loadUrls(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
    } catch (error) {
        console.error(chalk.red(`Erreur lors du chargement des URLs: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Teste une URL individuelle
 */
async function testUrl(url, baseUrl, expectStatus, noRedirect, timeout) {
    // S'assurer que l'URL est complète
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

    try {
        // Configurer axios pour ne pas suivre automatiquement les redirections
        const response = await axios.get(fullUrl, {
            maxRedirects: 0,
            validateStatus: status => status < 400 || status === 404,
            timeout: parseInt(timeout),
        });

        const status = response.status;
        const location = response.headers.location;

        // Vérifier le code de statut
        const statusMatch = status.toString() === expectStatus;

        // Vérifier la redirection
        const redirectCheck = noRedirect ? !location : true;

        if (statusMatch && redirectCheck) {
            return {
                url,
                fullUrl,
                success: true,
                status,
                redirect: !!location,
                redirectTo: location || null,
                message: location ?
                    `Code ${status}, redirection vers ${location}` :
                    `Code ${status}, pas de redirection`
            };
        } else {
            let message = '';
            if (!statusMatch) {
                message += `Code inattendu: ${status} (attendu ${expectStatus})`;
            }
            if (noRedirect && location) {
                message += message ? ', ' : '';
                message += `Redirection non prévue vers ${location}`;
            }

            return {
                url,
                fullUrl,
                success: false,
                status,
                redirect: !!location,
                redirectTo: location || null,
                message
            };
        }
    } catch (error) {
        // Gérer les erreurs spécifiques aux redirections
        if (error.response) {
            const status = error.response.status;
            const location = error.response.headers.location;

            return {
                url,
                fullUrl,
                success: false,
                status,
                redirect: !!location,
                redirectTo: location || null,
                message: `Erreur ${status}${location ? `, redirection vers ${location}` : ''}`
            };
        }

        // Autres erreurs (réseau, timeout, etc.)
        return {
            url,
            fullUrl,
            success: false,
            status: null,
            redirect: false,
            redirectTo: null,
            message: `Erreur: ${error.message}`
        };
    }
}

/**
 * Point d'entrée principal
 */
async function main() {
    try {
        if (!options.urls) {
            console.error(chalk.red('Vous devez spécifier un fichier d\'URLs avec --urls'));
            process.exit(1);
        }

        const urls = await loadUrls(options.urls);
        console.log(chalk.blue(`🔍 Test de ${urls.length} URLs depuis ${options.urls}`));

        const results = [];
        const successCount = { total: 0, withoutRedirect: 0, withRedirect: 0 };
        const failureCount = { total: 0, status: 0, redirect: 0, error: 0 };

        // Tester toutes les URLs
        for (const url of urls) {
            process.stdout.write(chalk.blue(`Test de ${url}... `));

            const result = await testUrl(
                url,
                options.baseUrl,
                options.expect,
                options.noRedirect,
                options.timeout
            );

            results.push(result);

            if (result.success) {
                successCount.total++;
                if (result.redirect) {
                    successCount.withRedirect++;
                    process.stdout.write(chalk.green(`✓ (${result.status}, redirigé vers ${result.redirectTo})\n`));
                } else {
                    successCount.withoutRedirect++;
                    process.stdout.write(chalk.green(`✓ (${result.status}, pas de redirection)\n`));
                }
            } else {
                failureCount.total++;

                if (!result.status) {
                    failureCount.error++;
                    process.stdout.write(chalk.red(`✗ (${result.message})\n`));
                } else if (options.noRedirect && result.redirect) {
                    failureCount.redirect++;
                    process.stdout.write(chalk.yellow(`✗ (${result.status}, redirection non désirée vers ${result.redirectTo})\n`));
                } else {
                    failureCount.status++;
                    process.stdout.write(chalk.red(`✗ (${result.status}, attendu ${options.expect})\n`));
                }
            }
        }

        // Afficher un résumé
        console.log(chalk.blue('\n📊 Résumé des tests:'));
        console.log(`Total des URLs testées: ${urls.length}`);
        console.log(chalk.green(`✅ URLs valides: ${successCount.total}`));

        if (options.noRedirect) {
            console.log(chalk.green(`   Sans redirection: ${successCount.withoutRedirect}`));
            console.log(chalk.yellow(`   Avec redirection (non désiré): ${successCount.withRedirect}`));
        } else {
            console.log(chalk.green(`   Sans redirection: ${successCount.withoutRedirect}`));
            console.log(chalk.green(`   Avec redirection: ${successCount.withRedirect}`));
        }

        if (failureCount.total > 0) {
            console.log(chalk.red(`❌ URLs en échec: ${failureCount.total}`));
            console.log(chalk.red(`   Mauvais code HTTP: ${failureCount.status}`));

            if (options.noRedirect) {
                console.log(chalk.red(`   Redirections non désirées: ${failureCount.redirect}`));
            }

            console.log(chalk.red(`   Erreurs de connexion: ${failureCount.error}`));
        }

        // Écriture du rapport détaillé
        const reportPath = './url-test-report.json';
        await fs.writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            options: {
                baseUrl: options.baseUrl,
                expectStatus: options.expect,
                noRedirect: options.noRedirect
            },
            summary: {
                total: urls.length,
                success: successCount,
                failure: failureCount
            },
            results
        }, null, 2));

        console.log(chalk.blue(`\n📝 Rapport détaillé écrit dans ${reportPath}`));

        // Sortir avec le code approprié
        process.exit(failureCount.total > 0 ? 1 : 0);
    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        process.exit(1);
    }
}

// Lancer le script
main();