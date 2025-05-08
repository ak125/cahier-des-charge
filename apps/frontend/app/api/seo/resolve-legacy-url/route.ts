/**
 * API de résolution des URLs legacy
 * 
 * Cette API transforme les anciennes URLs (.php) en nouvelles URLs modernes
 * sans effectuer de redirection, préservant ainsi le SEO
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Cache des redirections pour éviter de relire le fichier à chaque requête
let redirectionCache: Record<string, string> | null = null;

/**
 * Charge le fichier de redirections généré par l'agent SEO
 */
async function loadRedirections(): Promise<Record<string, string>> {
    try {
        if (redirectionCache) {
            return redirectionCache;
        }

        const redirectionsPath = path.join(process.cwd(), 'generated', 'seo', 'redirections.json');
        const redirectionsData = await fs.promises.readFile(redirectionsPath, 'utf-8');
        const redirections = JSON.parse(redirectionsData);

        // Transformer en map simple pour une recherche plus rapide
        const redirectionMap: Record<string, string> = {};

        if (Array.isArray(redirections.redirections)) {
            for (const redirection of redirections.redirections) {
                if (redirection.source && redirection.target) {
                    redirectionMap[redirection.source] = redirection.target;
                }
            }
        }

        // Mettre en cache pour les futures requêtes
        redirectionCache = redirectionMap;

        return redirectionMap;
    } catch (error) {
        console.error('Erreur lors du chargement des redirections:', error);
        return {};
    }
}

/**
 * Gère les requêtes aux URLs legacy
 */
export async function GET(request: NextRequest) {
    try {
        // Récupérer le chemin de la requête
        const url = new URL(request.url);
        const legacyPath = url.pathname;

        // Charger les redirections
        const redirectionMap = await loadRedirections();

        // Trouver la redirection correspondante
        const targetPath = redirectionMap[legacyPath];

        if (targetPath) {
            // Si l'URL de destination existe, servir cette page sans redirection
            // En préservant l'URL originale dans la barre d'adresse
            const response = await fetch(new URL(targetPath, request.nextUrl.origin));
            const content = await response.text();

            // Créer une nouvelle réponse avec le contenu de la cible
            return new NextResponse(content, {
                headers: {
                    'Content-Type': response.headers.get('Content-Type') || 'text/html',
                    'X-Mapped-Legacy-Url': legacyPath,
                    'X-Mapped-Target': targetPath
                }
            });
        }

        // Si aucune redirection n'est trouvée, retourner une erreur 404
        return NextResponse.json(
            {
                error: 'Page not found',
                message: `Aucune redirection trouvée pour ${legacyPath}`
            },
            { status: 404 }
        );
    } catch (error) {
        console.error('Erreur lors de la résolution de l\'URL legacy:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: 'Une erreur est survenue lors de la résolution de l\'URL'
            },
            { status: 500 }
        );
    }
}