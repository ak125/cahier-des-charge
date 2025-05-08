/**
 * Test des redirections SEO
 * 
 * Ce script permet de valider automatiquement les redirections SEO à partir
 * d'un fichier d'URLs indexées par Google ou d'un fichier de règles de redirection.
 * 
 * Exemples d'utilisation :
 * - Valider que les anciennes URLs PHP redirigent correctement
 * - Vérifier que les URLs indexées par Google sont encore actives
 * - Valider les règles migrées avant mise en production (.htaccess → Caddyfile ou NGINX → Caddy)
 * 
 * Usage:
 *   npx ts-node test-redirects.ts --source=legacy-urls.txt --base-url=https://example.com --output=reports
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { program } from 'commander';
import RedirectValidator, { RedirectConfig, RedirectType } from '../redirect-validator';

// Configuration CLI
program
  .option('-s, --source <path>', 'Fichier source contenant les URLs ou règles de redirection')
  .option('-m, --map <path>', 'Fichier de mappage des redirections au format JSON')
  .option('-b, --base-url <url>', 'URL de base pour les tests', 'http://localhost:3000')
  .option('-o, --output <dir>', 'Répertoire pour les rapports', './redirect-reports')
  .option('-t, --type <type>', 'Type de source: urls, htaccess, nginx ou json', 'urls')
  .option('--timeout <ms>', 'Délai d\'attente pour les requêtes HTTP (ms)', '5000')
  .option('--html-export', 'Générer un rapport HTML', true)
  .option('--caddy-export <path>', 'Exporter les règles en format Caddyfile')
  .option('--verbose', 'Mode verbeux', false)
  .parse(process.argv);

const options = program.opts();

/**
 * Charge les URLs depuis un fichier texte (.txt)
 */
async function loadUrlsFromTextFile(filePath: string): Promise<RedirectConfig[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  console.log(`Chargement de ${lines.length} URLs depuis ${filePath}`);

  // Si un fichier de mappage est fourni, l'utiliser pour déterminer les redirections
  if (options.map) {
    const mapContent = await fs.readFile(options.map, 'utf-8');
    const urlMap = JSON.parse(mapContent);

    return lines.map(url => {
      // Extraction du chemin relatif
      const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
      const path = urlObj.pathname;

      // Recherche dans le mappage
      const mapping = urlMap[path] || urlMap[path.substring(1)] || urlMap[url];

      return {
        source: path,
        target: mapping?.target || mapping?.destination || path,
        type: mapping?.type || mapping?.statusCode || RedirectType.PERMANENT
      };
    });
  }

  // Sans mappage, on présume que les URLs sont encore valides (301 vers elles-mêmes)
  return lines.map(url => {
    // Extraction du chemin relatif
    const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
    const path = urlObj.pathname;

    return {
      source: path,
      target: path,
      type: RedirectType.PERMANENT
    };
  });
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    if (!options.source) {
      console.error('Erreur : Fichier source requis (--source)');
      process.exit(1);
    }

    console.log(`Test des redirections SEO`);
    console.log(`-------------------------`);
    console.log(`Source : ${options.source}`);
    console.log(`Type : ${options.type}`);
    console.log(`URL de base : ${options.baseUrl}`);
    console.log(`-------------------------\n`);

    // Initialisation du validateur
    const validator = new RedirectValidator({
      baseUrl: options.baseUrl,
      timeout: parseInt(options.timeout, 10),
      outputDir: options.output,
      headers: {
        'User-Agent': 'SEO-Redirect-Validator/1.0'
      }
    });

    // Chargement des redirections selon le type de source
    switch (options.type) {
      case 'urls':
        const redirects = await loadUrlsFromTextFile(options.source);
        validator.addRedirects(redirects);
        break;

      case 'json':
        await validator.loadRedirectsFromFile(options.source);
        break;

      case 'htaccess':
        await validator.loadRedirectsFromHtaccess(options.source);
        break;

      case 'nginx':
        await validator.loadRedirectsFromNginx(options.source);
        break;

      default:
        console.error(`Type de source non pris en charge : ${options.type}`);
        process.exit(1);
    }

    // Validation des redirections
    console.log('Validation des redirections...');
    const results = await validator.validateAll();

    // Affichage du résumé
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.length - successCount;

    console.log('\n-------------------------');
    console.log(`Résultats : ${successCount} / ${results.length} redirections validées (${Math.round(successCount / results.length * 100)}%)`);

    if (failCount > 0) {
      console.log(`Erreurs : ${failCount} redirections ont échoué`);

      if (options.verbose) {
        console.log('\nDétail des erreurs :');
        results
          .filter(r => r.status !== 'success')
          .forEach(r => {
            console.log(`- Source: ${r.source}`);
            console.log(`  Attendu: ${r.expectedType} → ${r.target}`);
            console.log(`  Obtenu: ${r.actualType || '?'} → ${r.actualTarget || '?'}`);
            console.log(`  Erreur: ${r.error || 'N/A'}`);
            console.log();
          });
      }
    }

    // Export Caddyfile si demandé
    if (options.caddyExport) {
      await validator.exportToCaddyfile(options.caddyExport);
      console.log(`Règles exportées au format Caddyfile : ${options.caddyExport}`);
    }

    console.log('\nTerminé.');
  } catch (error) {
    console.error('Erreur :', error);
    process.exit(1);
  }
}

main().catch(console.error);