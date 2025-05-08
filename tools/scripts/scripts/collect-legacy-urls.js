#!/usr/bin/env node
/**
 * Script pour collecter les anciennes URLs PHP importantes
 * Analyse les logs d'accès et les sources PHP pour identifier les URLs à préserver
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const glob = require('glob');
const { execSync } = require('child_process');

program
    .description('Collecte les anciennes URLs PHP importantes pour préservation SEO')
    .option('-l, --logs <path>', 'Chemin vers les logs d\'accès du serveur web')
    .option('-s, --source <path>', 'Chemin vers les sources PHP du site legacy', './legacy')
    .option('-o, --output <path>', 'Chemin de sortie pour le fichier d\'URLs', './legacy-urls.txt')
    .option('--sitemap <url>', 'URL du sitemap du site pour extraire les URLs')
    .option('--gsc <path>', 'Chemin vers l\'export CSV de Google Search Console')
    .option('--min-hits <number>', 'Nombre minimum de hits pour considérer une URL importante', '10')
    .option('--include-all-php', 'Inclure toutes les URLs PHP trouvées même sans statistiques', false)
    .option('--with-stats', 'Ajouter des statistiques aux URLs collectées', false)
    .parse();

const options = program.opts();

// Fonction pour extraire les URLs des logs d'accès
async function extractUrlsFromLogs(logsPath) {
    console.log(chalk.blue(`📊 Analyse des logs d'accès depuis ${logsPath}`));

    // Analyser les logs pour trouver les URLs PHP les plus visitées
    const urlStats = new Map();
    let total = 0;

    try {
        // Déterminer le type de logs (Apache, Nginx, etc.)
        const isApache = await detectLogFormat(logsPath);

        // Utiliser grep pour extraire rapidement les lignes avec .php
        const logFiles = await glob.sync(path.join(logsPath, '*access*.log*'));

        for (const logFile of logFiles) {
            try {
                console.log(chalk.blue(`Analyse de ${logFile}...`));

                // Extraction avec grep (beaucoup plus rapide pour les gros fichiers)
                const grepCmd = `grep -E "\\.php(\\?|\\s)" "${logFile}" | grep -v "robots\\.txt\\|favicon\\.ico" | grep -E "GET|POST"`;
                const grepResult = execSync(grepCmd, { maxBuffer: 50 * 1024 * 1024 }).toString();

                const lines = grepResult.split('\n').filter(Boolean);

                lines.forEach(line => {
                    try {
                        let url;

                        // Extraction selon le format
                        if (isApache) {
                            // Format Apache: IP - - [date] "GET /page.php?id=123 HTTP/1.1" 200 12345
                            const match = line.match(/"(GET|POST)\s+([^"]+\.php[^"]*)\s+HTTP/i);
                            url = match ? match[2] : null;
                        } else {
                            // Format Nginx: IP - user [date] "GET /page.php?id=123 HTTP/1.1" 200 12345 "referer" "user-agent"
                            const match = line.match(/"(GET|POST)\s+([^"]+\.php[^"]*)\s+HTTP/i);
                            url = match ? match[2] : null;
                        }

                        if (url) {
                            // Normaliser l'URL
                            const normalizedUrl = normalizeUrl(url);

                            // Compter les occurrences
                            if (!urlStats.has(normalizedUrl)) {
                                urlStats.set(normalizedUrl, { count: 0, origins: new Set() });
                            }

                            urlStats.get(normalizedUrl).count++;
                            urlStats.get(normalizedUrl).origins.add('logs');
                            total++;
                        }
                    } catch (lineError) {
                        // Ignorer les erreurs de ligne individuelle
                    }
                });
            } catch (fileError) {
                console.warn(chalk.yellow(`⚠️ Impossible d'analyser ${logFile}: ${fileError.message}`));
            }
        }

        console.log(chalk.green(`✅ ${total} requêtes PHP analysées, ${urlStats.size} URLs uniques trouvées`));
        return urlStats;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'analyse des logs: ${error.message}`));
        return new Map();
    }
}

// Détecter le format des logs
async function detectLogFormat(logsPath) {
    try {
        const result = execSync(`head -n 10 $(ls -t ${logsPath}/*access*.log | head -n 1) | grep -c "\\["`, { encoding: 'utf-8' });
        // Simple heuristique: les logs Apache ont généralement des crochets pour la date
        return parseInt(result.trim()) > 0;
    } catch (error) {
        console.warn(chalk.yellow(`⚠️ Impossible de détecter le format des logs, utilisation du format Apache par défaut`));
        return true;
    }
}

// Normaliser une URL pour éviter les doublons
function normalizeUrl(url) {
    // Enlever les paramètres de session, tracking, etc.
    let normalizedUrl = url.split('#')[0]; // Enlever les fragments

    // Enlever certains paramètres qui ne sont pas importants pour le SEO
    const urlObj = new URL(normalizedUrl, 'http://example.com');

    // Paramètres à ignorer
    ['PHPSESSID', 'utm_source', 'utm_medium', 'utm_campaign', 'fbclid'].forEach(param => {
        urlObj.searchParams.delete(param);
    });

    return urlObj.pathname + (urlObj.search || '');
}

// Extraire les URLs des fichiers PHP sources
async function extractUrlsFromPhpSource(sourcePath) {
    console.log(chalk.blue(`🔍 Analyse des fichiers PHP sources depuis ${sourcePath}`));

    const urlStats = new Map();

    try {
        // Trouver tous les fichiers PHP
        const phpFiles = await glob.sync(path.join(sourcePath, '**/*.php'));
        console.log(chalk.blue(`${phpFiles.length} fichiers PHP trouvés`));

        // Analyser chaque fichier pour trouver des indices d'URLs
        for (const phpFile of phpFiles) {
            try {
                const content = await fs.readFile(phpFile, 'utf-8');
                const filename = path.basename(phpFile);

                // Si c'est un fichier accessible via le web (non inclus)
                if (!filename.startsWith('_') && !filename.includes('include') && !filename.includes('functions')) {
                    // Ajouter l'URL basique du fichier
                    const url = '/' + path.relative(sourcePath, phpFile).replace(/\\/g, '/');

                    if (!urlStats.has(url)) {
                        urlStats.set(url, { count: 0, origins: new Set() });
                    }

                    urlStats.get(url).count += 5; // Donner une priorité de base
                    urlStats.get(url).origins.add('source');

                    // Chercher les paramètres importants
                    const paramMatch = content.match(/(?:\$_GET|\$_REQUEST|\$_POST)\s*\[\s*["']([^"']+)["']\s*\]/g);
                    if (paramMatch) {
                        const params = new Set();
                        paramMatch.forEach(match => {
                            const param = match.match(/["']([^"']+)["']/);
                            if (param && param[1]) {
                                params.add(param[1]);
                            }
                        });

                        if (params.size > 0) {
                            urlStats.get(url).params = Array.from(params);
                        }
                    }
                }
            } catch (fileError) {
                console.warn(chalk.yellow(`⚠️ Impossible d'analyser ${phpFile}: ${fileError.message}`));
            }
        }

        console.log(chalk.green(`✅ ${urlStats.size} URLs potentielles extraites depuis les sources PHP`));
        return urlStats;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'analyse des sources PHP: ${error.message}`));
        return new Map();
    }
}

// Extraire les URLs depuis un sitemap
async function extractUrlsFromSitemap(sitemapUrl) {
    console.log(chalk.blue(`🌐 Extraction des URLs depuis le sitemap ${sitemapUrl}`));

    const urlStats = new Map();

    try {
        // Utiliser curl pour télécharger le sitemap
        const xmlContent = execSync(`curl -s "${sitemapUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString();

        // Extraire les URLs avec une expression régulière simple
        const urlMatches = xmlContent.match(/<loc>([^<]+)<\/loc>/g);

        if (urlMatches) {
            urlMatches.forEach(match => {
                const url = match.replace(/<loc>|<\/loc>/g, '');

                try {
                    const urlObj = new URL(url);

                    // Ne conserver que les URLs PHP
                    if (urlObj.pathname.includes('.php')) {
                        const normalizedUrl = normalizeUrl(urlObj.pathname + urlObj.search);

                        if (!urlStats.has(normalizedUrl)) {
                            urlStats.set(normalizedUrl, { count: 0, origins: new Set() });
                        }

                        urlStats.get(normalizedUrl).count += 10; // Priorité élevée pour les URLs du sitemap
                        urlStats.get(normalizedUrl).origins.add('sitemap');
                    }
                } catch (urlError) {
                    // Ignorer les URLs malformées
                }
            });
        }

        console.log(chalk.green(`✅ ${urlStats.size} URLs PHP extraites du sitemap`));
        return urlStats;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'extraction du sitemap: ${error.message}`));
        return new Map();
    }
}

// Extraire les URLs depuis Google Search Console
async function extractUrlsFromGSC(gscPath) {
    console.log(chalk.blue(`📈 Extraction des URLs depuis l'export GSC ${gscPath}`));

    const urlStats = new Map();

    try {
        const csvContent = await fs.readFile(gscPath, 'utf-8');
        const lines = csvContent.split('\n').filter(Boolean);

        // Ignorer l'en-tête
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(',');

            if (columns.length >= 2) {
                const url = columns[0].trim().replace(/^"|"$/g, '');
                const clicks = parseInt(columns[1], 10) || 0;

                try {
                    const urlObj = new URL(url);

                    // Ne conserver que les URLs PHP
                    if (urlObj.pathname.includes('.php')) {
                        const normalizedUrl = normalizeUrl(urlObj.pathname + urlObj.search);

                        if (!urlStats.has(normalizedUrl)) {
                            urlStats.set(normalizedUrl, { count: 0, origins: new Set() });
                        }

                        urlStats.get(normalizedUrl).count += clicks || 20; // Priorité basée sur les clics ou valeur par défaut
                        urlStats.get(normalizedUrl).origins.add('gsc');

                        // Conserver les métriques GSC
                        if (columns.length >= 4) {
                            urlStats.get(normalizedUrl).clicks = clicks;
                            urlStats.get(normalizedUrl).impressions = parseInt(columns[2], 10) || 0;
                            urlStats.get(normalizedUrl).position = parseFloat(columns[3]) || 0;
                        }
                    }
                } catch (urlError) {
                    // Ignorer les URLs malformées
                }
            }
        }

        console.log(chalk.green(`✅ ${urlStats.size} URLs PHP extraites de Google Search Console`));
        return urlStats;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'extraction des données GSC: ${error.message}`));
        return new Map();
    }
}

// Fusionner toutes les sources d'URLs
function mergeUrlStats(sources) {
    const mergedStats = new Map();

    // Fusionner toutes les statistiques d'URL
    sources.forEach(source => {
        source.forEach((stats, url) => {
            if (!mergedStats.has(url)) {
                mergedStats.set(url, { count: 0, origins: new Set() });
            }

            const existingStats = mergedStats.get(url);
            existingStats.count += stats.count;

            stats.origins.forEach(origin => existingStats.origins.add(origin));

            // Conserver les métriques supplémentaires
            ['params', 'clicks', 'impressions', 'position'].forEach(key => {
                if (stats[key] !== undefined) {
                    existingStats[key] = stats[key];
                }
            });
        });
    });

    return mergedStats;
}

// Point d'entrée principal
async function main() {
    try {
        const sources = [];

        // Collecter depuis toutes les sources disponibles
        if (options.logs) {
            sources.push(await extractUrlsFromLogs(options.logs));
        }

        if (options.source) {
            sources.push(await extractUrlsFromPhpSource(options.source));
        }

        if (options.sitemap) {
            sources.push(await extractUrlsFromSitemap(options.sitemap));
        }

        if (options.gsc) {
            sources.push(await extractUrlsFromGSC(options.gsc));
        }

        // Vérifier qu'on a au moins une source
        if (sources.length === 0) {
            console.error(chalk.red(`❌ Aucune source d'URLs spécifiée. Utilisez --logs, --source, --sitemap ou --gsc`));
            process.exit(1);
        }

        // Fusionner toutes les sources
        const mergedStats = mergeUrlStats(sources);
        console.log(chalk.blue(`🔄 ${mergedStats.size} URLs uniques trouvées après fusion`));

        // Filtrer par nombre minimum de hits
        const minHits = parseInt(options.minHits, 10);
        const filteredUrls = Array.from(mergedStats.entries())
            .filter(([_, stats]) => options.includeAllPhp || stats.count >= minHits)
            .sort((a, b) => b[1].count - a[1].count);

        console.log(chalk.blue(`🧹 ${filteredUrls.length} URLs conservées après filtrage (min ${minHits} hits)`));

        // Écrire dans le fichier de sortie
        let fileContent = '';

        // Ajouter un en-tête avec les informations
        fileContent += `# URLs PHP legacy importantes à préserver\n`;
        fileContent += `# Générées le ${new Date().toISOString()}\n`;
        fileContent += `# Format: URL [hits] [sources] [métriques supplémentaires]\n`;
        fileContent += `# Total: ${filteredUrls.length} URLs\n\n`;

        filteredUrls.forEach(([url, stats]) => {
            // URL de base
            let line = url;

            // Ajouter des statistiques si demandé
            if (options.withStats) {
                line += ` # ${stats.count} hits, sources: ${Array.from(stats.origins).join(',')}`;

                // Ajouter des métriques GSC si disponibles
                if (stats.clicks !== undefined) {
                    line += `, GSC: ${stats.clicks} clics, ${stats.impressions} impressions, pos ${stats.position.toFixed(1)}`;
                }

                // Ajouter les paramètres identifiés
                if (stats.params) {
                    line += `, paramètres: ${stats.params.join(',')}`;
                }
            }

            fileContent += line + '\n';
        });

        await fs.writeFile(options.output, fileContent);
        console.log(chalk.green(`✅ ${filteredUrls.length} URLs écrites dans ${options.output}`));

        // Générer aussi un fichier JSON pour référence
        const jsonOutput = options.output.replace(/\.txt$/, '') + '.json';
        await fs.writeFile(jsonOutput, JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalUrls: filteredUrls.length,
            urlStats: Object.fromEntries(
                filteredUrls.map(([url, stats]) => [
                    url,
                    {
                        ...stats,
                        origins: Array.from(stats.origins)
                    }
                ])
            )
        }, null, 2));

        console.log(chalk.green(`✅ Statistiques détaillées écrites dans ${jsonOutput}`));

    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        process.exit(1);
    }
}

// Lancer le script
main();