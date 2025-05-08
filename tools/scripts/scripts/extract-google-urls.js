#!/usr/bin/env node
/**
 * Extracteur d'URLs indexées par Google
 * 
 * Ce script utilise l'API Google Search Console pour extraire les URLs indexées
 * et les exporter dans un format compatible avec notre validateur de redirections SEO.
 * 
 * Prérequis:
 * 1. Créer un projet dans Google Cloud Console
 * 2. Activer l'API Search Console
 * 3. Créer des identifiants OAuth 2.0 et télécharger le fichier credentials.json
 * 
 * Usage:
 *   node extract-google-urls.js --site=https://example.com --days=30 --output=./google-urls.txt
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// Si vous modifiez ces scopes, supprimez le fichier token.json.
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
// Le fichier token.json stocke l'accès et le rafraîchissement des tokens de l'utilisateur
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
// Le fichier credentials.json stocke les identifiants de l'API OAuth
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Parse les arguments de ligne de commande
 */
function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            args[key] = value;
        }
    });

    // Vérifier les arguments obligatoires
    if (!args.site) {
        console.error('Erreur: --site est requis (ex: --site=https://example.com)');
        process.exit(1);
    }

    return {
        site: args.site,
        days: parseInt(args.days || '30', 10),
        output: args.output || './google-urls.txt',
        limit: parseInt(args.limit || '5000', 10)
    };
}

/**
 * Charge les identifiants sauvegardés ou authentifie l'utilisateur.
 */
async function authorize() {
    let client = null;
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        client = google.auth.fromJSON(credentials);
    } catch (err) {
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });

        // Sauvegarder le token pour une utilisation future
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: client.client_id,
            client_secret: client.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    }
    return client;
}

/**
 * Extrait les URLs indexées par Google Search Console
 */
async function extractUrls(auth, options) {
    const webmasters = google.webmasters({ version: 'v3', auth });

    // Calculer les dates
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - options.days);
    const startDateStr = startDate.toISOString().slice(0, 10);

    // Requête pour obtenir toutes les URLs
    const result = [];
    let startRow = 0;
    let totalRows = 0;

    do {
        console.log(`Récupération des URLs (${startRow}/${totalRows || 'inconnu'})...`);

        const response = await webmasters.searchanalytics.query({
            siteUrl: options.site,
            requestBody: {
                startDate: startDateStr,
                endDate: endDate,
                dimensions: ['page'],
                rowLimit: 25000,
                startRow: startRow,
            },
        });

        const rows = response.data.rows || [];
        totalRows = Math.max(totalRows, response.data.rows?.length + startRow || 0);

        // Ajouter les URLs au résultat
        rows.forEach(row => {
            result.push(row.keys[0]);
        });

        startRow += rows.length;

        // Continuer jusqu'à ce qu'on ait tout récupéré ou atteint la limite
    } while (startRow < totalRows && startRow < options.limit);

    return result;
}

/**
 * Point d'entrée principal du programme
 */
async function main() {
    const options = parseArgs();

    try {
        // Authentifier
        console.log('Authentification auprès de Google Search Console...');
        const auth = await authorize().catch(err => {
            console.error('Erreur d\'authentification:', err);
            process.exit(1);
        });

        // Extraire les URLs
        console.log(`Extraction des URLs indexées pour ${options.site} (${options.days} derniers jours)...`);
        const urls = await extractUrls(auth, options);

        console.log(`✅ ${urls.length} URLs extraites`);

        // Écrire les URLs dans un fichier
        await fs.writeFile(options.output, urls.join('\n'));
        console.log(`📝 URLs sauvegardées dans ${options.output}`);

    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

// Lancer le script
main();