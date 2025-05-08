/**
 * SeoAgentBase
 * 
 * Classe de base pour tous les agents SEO. Cette classe fournit les fonctionnalités communes
 * utilisées par les différents agents spécialisés en SEO.
 * 
 * @module agents/seo/seo-agent-base
 * @category SEO
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { parse as parseHtml } from 'node-html-parser';
import { Logger } from '../utils/logger';

export interface SeoMetadata {
    title?: string;
    description?: string;
    canonical?: string;
    image?: string;
    keywords?: string[];
    ogTags?: Record<string, string>;
    jsonLd?: Record<string, any>;
    [key: string]: any;
}

export interface SeoAgentOptions {
    /**
     * URL de base du site
     */
    baseUrl: string;

    /**
     * Nom du site
     */
    siteName: string;

    /**
     * Chemin du répertoire de sortie
     */
    outputDir: string;

    /**
     * Chemin des sources legacy (le cas échéant)
     */
    legacySourceDir?: string;

    /**
     * Mode verbeux
     */
    verbose?: boolean;

    /**
     * Fonction logger personnalisée
     */
    logger?: Logger;

    /**
     * Configuration supplémentaire spécifique à l'agent
     */
    [key: string]: any;
}

export interface SeoAnalysisResult {
    url: string;
    status: 'pass' | 'fail' | 'warning';
    score: number;
    metadata: SeoMetadata;
    issues?: Array<{
        type: string;
        description: string;
        severity: 'critical' | 'error' | 'warning' | 'info';
        recommendation?: string;
    }>;
}

export abstract class SeoAgentBase {
    protected options: SeoAgentOptions;
    protected logger: Logger;

    constructor(options: SeoAgentOptions) {
        this.options = {
            verbose: false,
            ...options
        };

        this.logger = options.logger || new Logger('SeoAgent', {
            level: options.verbose ? 'debug' : 'info'
        });
    }

    /**
     * Vérifie si un chemin existe
     */
    protected async pathExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Récupère le contenu HTML d'une URL
     */
    protected async fetchHtml(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'SeoAgent/1.0'
                },
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération du contenu HTML de ${url}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extrait les métadonnées SEO depuis le HTML
     */
    protected extractMetadataFromHtml(html: string): SeoMetadata {
        try {
            const root = parseHtml(html);
            const metadata: SeoMetadata = {};

            // Extraire le titre
            const titleEl = root.querySelector('title');
            if (titleEl) {
                metadata.title = titleEl.text.trim();
            }

            // Extraire la description
            const descriptionEl = root.querySelector('meta[name="description"]');
            if (descriptionEl) {
                metadata.description = descriptionEl.getAttribute('content');
            }

            // Extraire l'URL canonique
            const canonicalEl = root.querySelector('link[rel="canonical"]');
            if (canonicalEl) {
                metadata.canonical = canonicalEl.getAttribute('href');
            }

            // Extraire les mots-clés
            const keywordsEl = root.querySelector('meta[name="keywords"]');
            if (keywordsEl) {
                const keywordsContent = keywordsEl.getAttribute('content');
                metadata.keywords = keywordsContent ?
                    keywordsContent.split(',').map(k => k.trim()) :
                    [];
            }

            // Extraire les balises OpenGraph
            metadata.ogTags = {};
            root.querySelectorAll('meta[property^="og:"]').forEach(el => {
                const property = el.getAttribute('property');
                const content = el.getAttribute('content');
                if (property && content) {
                    metadata.ogTags![property] = content;

                    // Récupérer l'image OG spécifiquement
                    if (property === 'og:image') {
                        metadata.image = content;
                    }
                }
            });

            // Extraire les données JSON-LD
            const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
            if (jsonLdScripts.length > 0) {
                try {
                    metadata.jsonLd = JSON.parse(jsonLdScripts[0].text);
                } catch (e) {
                    this.logger.warn(`Erreur lors du parsing du JSON-LD: ${e.message}`);
                }
            }

            return metadata;
        } catch (error) {
            this.logger.error(`Erreur lors de l'extraction des métadonnées: ${error.message}`);
            return {};
        }
    }

    /**
     * Enregistre les résultats dans un fichier JSON
     */
    protected async saveResults(results: any, filename: string): Promise<void> {
        try {
            // Assurer que le répertoire de sortie existe
            await fs.ensureDir(this.options.outputDir);

            const outputPath = path.join(this.options.outputDir, filename);
            await fs.writeJson(outputPath, results, { spaces: 2 });

            this.logger.info(`Résultats sauvegardés dans ${outputPath}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'enregistrement des résultats: ${error.message}`);
            throw error;
        }
    }

    /**
     * Génère des balises Open Graph à partir des métadonnées
     */
    protected generateOpenGraphTags(metadata: SeoMetadata, url: string): Record<string, string> {
        const ogTags: Record<string, string> = {
            'og:title': metadata.title || '',
            'og:description': metadata.description || '',
            'og:url': url,
            'og:type': 'website',
            'og:site_name': this.options.siteName
        };

        if (metadata.image) {
            ogTags['og:image'] = metadata.image.startsWith('http') ?
                metadata.image :
                new URL(metadata.image, this.options.baseUrl).toString();
        }

        return ogTags;
    }

    /**
     * Génère des données structurées JSON-LD à partir des métadonnées
     */
    protected generateJsonLd(metadata: SeoMetadata, url: string): Record<string, any> {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': metadata.title,
            'description': metadata.description,
            'url': url,
            'publisher': {
                '@type': 'Organization',
                'name': this.options.siteName,
                'url': this.options.baseUrl
            }
        };
    }

    /**
     * S'assure qu'une URL est complète (avec protocole et domaine)
     */
    protected ensureFullUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        const baseUrl = this.options.baseUrl.endsWith('/')
            ? this.options.baseUrl.slice(0, -1)
            : this.options.baseUrl;

        return url.startsWith('/')
            ? `${baseUrl}${url}`
            : `${baseUrl}/${url}`;
    }

    /**
     * Point d'entrée commun pour tous les agents SEO
     * Doit être implémenté par les classes dérivées
     */
    public abstract async execute(params?: any): Promise<any>;
}

export default SeoAgentBase;