/**
 * validate-links.ts
 * 
 * Script qui vérifie les liens internes et externes dans la documentation
 * pour s'assurer qu'ils sont valides et fonctionnels.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '@nestjs/common';
import glob from 'fast-glob';
import axios from 'axios';

const logger = new Logger('LinksValidator');

/**
 * Valide les liens dans la documentation
 * @param outputDir Dossier contenant les fichiers markdown à valider
 */
export async function validateLinks(outputDir: string): Promise<void> {
    try {
        logger.log(`Validation des liens dans ${outputDir}...`);

        // Trouver tous les fichiers markdown
        const markdownFiles = await glob('**/*.md', { cwd: outputDir, absolute: true });

        logger.log(`${markdownFiles.length} fichiers markdown trouvés`);

        // Accumuler les statistiques
        const stats = {
            filesChecked: 0,
            totalLinks: 0,
            internalLinks: 0,
            externalLinks: 0,
            brokenLinks: [],
            unreachableLinks: []
        };

        // Construire un index des slug/id de page et de leurs chemins réels
        const pageIndex = await buildPageIndex(markdownFiles);

        // Vérifier chaque fichier
        for (const file of markdownFiles) {
            const result = await validateLinksInFile(file, pageIndex);

            // Mettre à jour les statistiques
            stats.filesChecked++;
            stats.totalLinks += result.totalLinks;
            stats.internalLinks += result.internalLinks;
            stats.externalLinks += result.externalLinks;
            stats.brokenLinks.push(...result.brokenLinks);
            stats.unreachableLinks.push(...result.unreachableLinks);

            // Log des progrès
            if (stats.filesChecked % 20 === 0 || stats.filesChecked === markdownFiles.length) {
                logger.log(`Progression: ${stats.filesChecked}/${markdownFiles.length} fichiers vérifiés`);
            }
        }

        // Afficher les statistiques
        logger.log('Validation des liens terminée');
        logger.log(`Fichiers vérifiés: ${stats.filesChecked}`);
        logger.log(`Total des liens: ${stats.totalLinks}`);
        logger.log(`Liens internes: ${stats.internalLinks}`);
        logger.log(`Liens externes: ${stats.externalLinks}`);

        // Rapport des problèmes
        if (stats.brokenLinks.length > 0) {
            logger.warn(`Liens internes cassés: ${stats.brokenLinks.length}`);
            for (const brokenLink of stats.brokenLinks) {
                logger.warn(`  - Dans ${path.relative(outputDir, brokenLink.file)}: ${brokenLink.link}`);
            }
        }

        if (stats.unreachableLinks.length > 0) {
            logger.warn(`Liens externes inaccessibles: ${stats.unreachableLinks.length}`);
            for (const unreachableLink of stats.unreachableLinks) {
                logger.warn(`  - Dans ${path.relative(outputDir, unreachableLink.file)}: ${unreachableLink.link}`);
            }
        }

    } catch (error: any) {
        logger.error(`Erreur lors de la validation des liens: ${error.message}`);
        throw error;
    }
}

/**
 * Construit un index des pages par leur slug ou ID
 */
async function buildPageIndex(markdownFiles: string[]): Promise<Record<string, string>> {
    const index: Record<string, string> = {};

    for (const file of markdownFiles) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            const frontMatter = extractFrontMatter(content);

            if (frontMatter) {
                // Indexer par slug si disponible
                if (frontMatter.slug) {
                    const slug = frontMatter.slug.replace(/^\/+|\/+$/g, ''); // Enlever les / au début et à la fin
                    index[slug] = file;
                }

                // Indexer aussi par ID
                if (frontMatter.id) {
                    index[frontMatter.id] = file;
                }
            }
        } catch (error) {
            // Ignorer les erreurs et continuer
        }
    }

    return index;
}

/**
 * Valide les liens dans un fichier markdown
 */
async function validateLinksInFile(
    file: string,
    pageIndex: Record<string, string>
): Promise<{
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    brokenLinks: Array<{ file: string; link: string }>;
    unreachableLinks: Array<{ file: string; link: string }>;
}> {
    // Résultats
    const result = {
        totalLinks: 0,
        internalLinks: 0,
        externalLinks: 0,
        brokenLinks: [] as Array<{ file: string; link: string }>,
        unreachableLinks: [] as Array<{ file: string; link: string }>
    };

    try {
        const content = await fs.readFile(file, 'utf-8');

        // Trouver tous les liens markdown
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const linkText = match[1];
            const linkUrl = match[2];

            result.totalLinks++;

            if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
                // Lien externe
                result.externalLinks++;

                // Vérification des liens externes (désactivée par défaut pour éviter trop de requêtes)
                // Activation possible avec la variable d'environnement CHECK_EXTERNAL_LINKS=true
                if (process.env.CHECK_EXTERNAL_LINKS === 'true') {
                    try {
                        await checkExternalLink(linkUrl);
                    } catch (error) {
                        result.unreachableLinks.push({ file, link: linkUrl });
                    }
                }
            } else if (linkUrl.startsWith('/docs/')) {
                // Lien interne avec chemin absolu (format Docusaurus)
                result.internalLinks++;

                // Extraire le chemin sans le préfixe /docs/
                const docPath = linkUrl.replace(/^\/docs\//, '');

                if (!pageIndex[docPath]) {
                    result.brokenLinks.push({ file, link: linkUrl });
                }
            } else if (linkUrl.startsWith('#')) {
                // Ancre dans la même page
                result.internalLinks++;
                // On ne vérifie pas les ancres pour le moment
            } else if (!linkUrl.startsWith('mailto:') && !linkUrl.startsWith('tel:')) {
                // Autre type de lien interne
                result.internalLinks++;

                // Vérifier si le lien pointe vers un fichier existant
                const targetPath = path.resolve(path.dirname(file), linkUrl);

                if (!await fs.pathExists(targetPath)) {
                    result.brokenLinks.push({ file, link: linkUrl });
                }
            }
        }
    } catch (error) {
        logger.error(`Erreur lors de la vérification de ${file}: ${(error as Error).message}`);
    }

    return result;
}

/**
 * Vérifie si un lien externe est accessible
 */
async function checkExternalLink(url: string): Promise<boolean> {
    try {
        const response = await axios.head(url, { timeout: 5000 });
        return response.status >= 200 && response.status < 400;
    } catch (error) {
        throw new Error(`Lien inaccessible: ${url}`);
    }
}

/**
 * Extrait le front matter d'un contenu markdown
 */
function extractFrontMatter(content: string): Record<string, any> | null {
    const frontMatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = frontMatterRegex.exec(content);

    if (!match) return null;

    const frontMatterBlock = match[1];
    const frontMatter: Record<string, any> = {};

    // Analyse ligne par ligne
    frontMatterBlock.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();

            // Convertir les types simples
            if (value === 'true') {
                frontMatter[key] = true;
            } else if (value === 'false') {
                frontMatter[key] = false;
            } else if (/^\d+$/.test(value)) {
                frontMatter[key] = parseInt(value, 10);
            } else {
                // Enlever les guillemets si présents
                frontMatter[key] = value.replace(/^["'](.*)["']$/, '$1');
            }
        }
    });

    return frontMatter;
}