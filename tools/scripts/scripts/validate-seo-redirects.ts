#!/usr/bin/env ts-node
/**
 * Script de validation automatique des redirections SEO
 * 
 * Ce script permet de valider les redirections SEO dans différents scénarios :
 * 1. Vérifier que les anciennes URLs PHP redirigent correctement
 * 2. Vérifier que les URLs indexées par Google sont toujours accessibles
 * 3. Valider les règles de redirection lors des migrations (.htaccess → Caddyfile ou NGINX)
 * 
 * Usage:
 *   npx ts-node validate-seo-redirects.ts --mode=google-urls --sitemap=https://example.com/sitemap.xml
 *   npx ts-node validate-seo-redirects.ts --mode=legacy-urls --urls=./urls-to-test.txt --base-url=https://example.com
 *   npx ts-node validate-seo-redirects.ts --mode=migration --htaccess=./.htaccess --output-format=caddy
 */

import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import axios from 'axios';
import { parse as parseXml } from 'fast-xml-parser';
import { RedirectValidator, ValidationReport } from './validation/redirect-validator';

// Configuration du programme
const program = new Command();

program
    .name('validate-seo-redirects')
    .description('Outil de validation des redirections SEO')
    .version('1.0.0');

program
    .option('-m, --mode <mode>', 'Mode de validation: google-urls, legacy-urls, ou migration', 'legacy-urls')
    .option('-b, --base-url <url>', 'URL de base pour les tests')
    .option('-u, --urls <path>', 'Chemin vers un fichier contenant les URLs à tester')
    .option('-s, --sitemap <url>', 'URL du sitemap pour extraire les URLs indexées')
    .option('-h, --htaccess <path>', 'Chemin du fichier .htaccess pour la migration')
    .option('-o, --output <path>', 'Chemin pour le rapport de validation', './redirect-validation-report.json')
    .option('-f, --output-format <format>', 'Format de sortie pour les règles migrées: caddy, nginx', 'caddy')
    .option('-v, --verbose', 'Afficher plus de détails pendant la validation')
    .option('--check-status-codes <codes>', 'Codes HTTP à vérifier, séparés par des virgules', '301,410,412')
    .parse();

const options = program.opts();

/**
 * Vérifie que les URLs dans un sitemap sont indexées correctement
 */
async function validateGoogleIndexedUrls(sitemapUrl: string, outputPath: string): Promise<boolean> {
    try {
        console.log(chalk.blue(`🔍 Validation des URLs indexées dans ${sitemapUrl}`));

        // Récupération du sitemap
        const response = await axios.get(sitemapUrl);
        const result = parseXml(response.data, { ignoreAttributes: false });

        if (!result.urlset || !result.urlset.url) {
            throw new Error('Format de sitemap invalide');
        }

        // Extraire les URLs
        const urls = Array.isArray(result.urlset.url)
            ? result.urlset.url.map(u => u.loc)
            : [result.urlset.url.loc];

        console.log(chalk.green(`✅ ${urls.length} URLs trouvées dans le sitemap`));

        // Tester chaque URL
        const results = [];
        const failedUrls = [];

        for (const url of urls) {
            process.stdout.write(`Testing ${url}... `);

            try {
                const response = await axios.get(url, {
                    maxRedirects: 0,
                    validateStatus: () => true
                });

                const statusCode = response.status;
                const isSuccess = statusCode >= 200 && statusCode < 300;
                const isRedirect = statusCode >= 300 && statusCode < 400;

                if (isSuccess) {
                    process.stdout.write(chalk.green('✓ 200 OK\n'));
                    results.push({ url, status: 'success', statusCode });
                } else if (isRedirect) {
                    process.stdout.write(chalk.yellow(`↪ ${statusCode} ${response.headers.location}\n`));
                    results.push({
                        url,
                        status: 'redirect',
                        statusCode,
                        location: response.headers.location
                    });
                } else {
                    process.stdout.write(chalk.red(`✗ ${statusCode}\n`));
                    results.push({ url, status: 'error', statusCode });
                    failedUrls.push(url);
                }
            } catch (error) {
                process.stdout.write(chalk.red(`✗ ERREUR\n`));
                results.push({
                    url,
                    status: 'error',
                    error: error.message
                });
                failedUrls.push(url);
            }
        }

        // Générer le rapport
        const report = {
            timestamp: new Date().toISOString(),
            totalUrls: urls.length,
            successCount: results.filter(r => r.status === 'success').length,
            redirectCount: results.filter(r => r.status === 'redirect').length,
            failureCount: results.filter(r => r.status === 'error').length,
            results
        };

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

        console.log(chalk.blue('\n📊 Résumé de la validation:'));
        console.log(`Total des URLs testées: ${report.totalUrls}`);
        console.log(chalk.green(`✅ URLs valides: ${report.successCount}`));
        console.log(chalk.yellow(`↪ URLs redirigées: ${report.redirectCount}`));

        if (report.failureCount > 0) {
            console.log(chalk.red(`❌ URLs en erreur: ${report.failureCount}`));
            console.log(chalk.red('URLs en échec:'));
            failedUrls.forEach(url => console.log(chalk.red(`- ${url}`)));
            return false;
        }

        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        return false;
    }
}

/**
 * Vérifie les redirections d'URLs legacy (PHP, etc.)
 */
async function validateLegacyUrls(urlsPath: string, baseUrl: string, outputPath: string, statusCodes: number[]): Promise<boolean> {
    try {
        console.log(chalk.blue(`🔍 Validation des redirections d'URLs legacy depuis ${urlsPath}`));

        // Charger les URLs à tester
        const content = await fs.readFile(urlsPath, 'utf-8');
        const urls = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        console.log(chalk.green(`✅ ${urls.length} URLs à tester chargées`));

        // Tester chaque URL
        const results = [];
        const failedUrls = [];

        for (const url of urls) {
            const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
            process.stdout.write(`Testing ${fullUrl}... `);

            try {
                const response = await axios.get(fullUrl, {
                    maxRedirects: 0,
                    validateStatus: () => true
                });

                const statusCode = response.status;
                const expectedCodes = statusCodes.length > 0 ? statusCodes : [301, 302, 307, 308, 410, 412];

                if (expectedCodes.includes(statusCode)) {
                    const location = response.headers.location;

                    if ([301, 302, 307, 308].includes(statusCode) && location) {
                        process.stdout.write(chalk.green(`✓ ${statusCode} -> ${location}\n`));
                        results.push({
                            url,
                            status: 'success',
                            statusCode,
                            location
                        });
                    } else if ([410, 412].includes(statusCode)) {
                        process.stdout.write(chalk.green(`✓ ${statusCode} (Gone/Precondition)\n`));
                        results.push({
                            url,
                            status: 'success',
                            statusCode
                        });
                    } else {
                        process.stdout.write(chalk.red(`✗ ${statusCode} (Pas de redirection)\n`));
                        results.push({
                            url,
                            status: 'error',
                            statusCode,
                            error: 'Redirection attendue mais aucune trouvée'
                        });
                        failedUrls.push(url);
                    }
                } else {
                    process.stdout.write(chalk.red(`✗ ${statusCode} (Code inattendu)\n`));
                    results.push({
                        url,
                        status: 'error',
                        statusCode,
                        error: `Code ${statusCode} inattendu, attendu: ${expectedCodes.join(', ')}`
                    });
                    failedUrls.push(url);
                }
            } catch (error) {
                process.stdout.write(chalk.red(`✗ ERREUR\n`));
                results.push({
                    url,
                    status: 'error',
                    error: error.message
                });
                failedUrls.push(url);
            }
        }

        // Générer le rapport
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl,
            totalUrls: urls.length,
            successCount: results.filter(r => r.status === 'success').length,
            failureCount: results.filter(r => r.status === 'error').length,
            expectedStatusCodes: statusCodes,
            results
        };

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

        console.log(chalk.blue('\n📊 Résumé de la validation:'));
        console.log(`Total des URLs testées: ${report.totalUrls}`);
        console.log(chalk.green(`✅ URLs avec redirection valide: ${report.successCount}`));

        if (report.failureCount > 0) {
            console.log(chalk.red(`❌ URLs avec redirection incorrecte: ${report.failureCount}`));
            console.log(chalk.red('URLs en échec:'));
            failedUrls.forEach(url => console.log(chalk.red(`- ${url}`)));
            return false;
        }

        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        return false;
    }
}

/**
 * Valide et migre les règles de redirection depuis .htaccess
 */
async function validateAndMigrateRedirects(htaccessPath: string, outputFormat: string, outputPath: string): Promise<boolean> {
    try {
        console.log(chalk.blue(`🔄 Migration des règles de redirection depuis ${htaccessPath} vers ${outputFormat}`));

        // Créer une instance de RedirectValidator avec la configuration minimale requise
        const validator = new RedirectValidator({
            htaccessPaths: [htaccessPath],
            baseUrl: 'http://localhost', // L'URL réelle n'est pas importante pour la migration
            outputReportPath: outputPath,
            timeout: 5,
            verbose: options.verbose
        });

        // Extraire les règles et générer un rapport de validation
        const report: ValidationReport = await validator.validate();

        // Générer le fichier de configuration dans le format demandé
        const outputConfigPath = path.join(
            path.dirname(outputPath),
            `redirects.${outputFormat === 'caddy' ? 'Caddyfile' : 'conf'}`
        );

        await generateConfigFile(report, outputFormat, outputConfigPath);

        return report.failed === 0;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        return false;
    }
}

/**
 * Génère un fichier de configuration Caddyfile ou NGINX à partir des règles de redirection
 */
async function generateConfigFile(report: ValidationReport, format: string, outputPath: string): Promise<void> {
    try {
        let configContent = '';

        if (format === 'caddy') {
            // Générer la configuration Caddy
            configContent = "# Règles de redirection générées automatiquement\n\n";

            for (const result of report.results) {
                if (!result.valid) continue;

                const source = result.url.replace(/^\/+/, '');
                const target = result.expected.destination || '';
                const code = result.expected.statusCode;

                if (code === 410) {
                    configContent += `/${source} {\n  respond 410\n}\n\n`;
                } else if (code === 412) {
                    configContent += `/${source} {\n  respond 412\n}\n\n`;
                } else if ([301, 308].includes(code)) {
                    configContent += `redir /${source} ${target} permanent\n`;
                } else {
                    configContent += `redir /${source} ${target} temporary\n`;
                }
            }
        } else if (format === 'nginx') {
            // Générer la configuration NGINX
            configContent = "# Règles de redirection générées automatiquement\n\n";

            for (const result of report.results) {
                if (!result.valid) continue;

                const source = result.url;
                const target = result.expected.destination || '';
                const code = result.expected.statusCode;

                if (code === 410) {
                    configContent += `location ${source} {\n  return 410;\n}\n\n`;
                } else if (code === 412) {
                    configContent += `location ${source} {\n  return 412;\n}\n\n`;
                } else {
                    configContent += `location ${source} {\n  return ${code} ${target};\n}\n\n`;
                }
            }
        } else {
            throw new Error(`Format de sortie non supporté: ${format}`);
        }

        await fs.writeFile(outputPath, configContent);
        console.log(chalk.green(`✅ Configuration ${format.toUpperCase()} générée dans ${outputPath}`));
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération du fichier de configuration: ${error.message}`));
        throw error;
    }
}

/**
 * Point d'entrée principal
 */
async function main() {
    try {
        // Vérifier les options requises selon le mode
        if (options.mode === 'google-urls' && !options.sitemap) {
            console.error(chalk.red('❌ Le mode google-urls nécessite une URL de sitemap (--sitemap)'));
            process.exit(1);
        } else if (options.mode === 'legacy-urls' && (!options.urls || !options.baseUrl)) {
            console.error(chalk.red('❌ Le mode legacy-urls nécessite un fichier d\'URLs (--urls) et une URL de base (--base-url)'));
            process.exit(1);
        } else if (options.mode === 'migration' && !options.htaccess) {
            console.error(chalk.red('❌ Le mode migration nécessite un fichier .htaccess (--htaccess)'));
            process.exit(1);
        }

        // Parser les codes de statut à vérifier
        const statusCodes = options.checkStatusCodes
            .split(',')
            .map(code => parseInt(code.trim(), 10))
            .filter(code => !isNaN(code));

        let success = false;

        // Exécuter le mode demandé
        switch (options.mode) {
            case 'google-urls':
                success = await validateGoogleIndexedUrls(options.sitemap, options.output);
                break;

            case 'legacy-urls':
                success = await validateLegacyUrls(options.urls, options.baseUrl, options.output, statusCodes);
                break;

            case 'migration':
                success = await validateAndMigrateRedirects(options.htaccess, options.outputFormat, options.output);
                break;

            default:
                console.error(chalk.red(`❌ Mode non reconnu: ${options.mode}`));
                process.exit(1);
        }

        // Sortir avec le code approprié (pour CI/CD)
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error(chalk.red(`❌ Erreur fatale: ${error.message}`));
        process.exit(1);
    }
}

// Lancer le script
main();