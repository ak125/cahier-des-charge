/**
 * SeoContentEnhancer Agent
 * 
 * Agent spécialisé dans l'amélioration du contenu SEO, incluant la génération automatique
 * de métadonnées structurées (JSON-LD, OpenGraph) et l'optimisation du contenu pour les moteurs de recherche.
 */

import { SeoMetaGenerator, PageType, Metadata } from './seo/seo-meta-generator';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Vérifie si un chemin existe
 * @param path Chemin à vérifier
 * @returns true si le chemin existe, false sinon
 */
async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

export interface SeoContentEnhancerOptions {
    /**
     * URL de base du site
     */
    baseUrl: string;

    /**
     * Nom du site
     */
    siteName: string;

    /**
     * Locale par défaut
     */
    defaultLocale?: string;

    /**
     * Image par défaut pour les métadonnées
     */
    defaultImage?: string;

    /**
     * Répertoire de sortie pour les métadonnées générées
     */
    outputDir?: string;

    /**
     * Source des données PHP legacy
     */
    legacySourceDir?: string;

    /**
     * Active le mode verbeux pour plus d'informations
     */
    verbose?: boolean;
}

export class SeoContentEnhancer {
    private metaGenerator: SeoMetaGenerator;
    private options: Required<SeoContentEnhancerOptions>;
    private metadataCache: Map<string, Metadata> = new Map();

    /**
     * Constructeur de l'agent
     */
    constructor(options: SeoContentEnhancerOptions) {
        this.options = {
            defaultLocale: 'fr_FR',
            defaultImage: `${options.baseUrl}/images/default-og-image.jpg`,
            verbose: false,
            legacySourceDir: '',
            outputDir: './generated/seo',
            ...options,
        };

        this.metaGenerator = new SeoMetaGenerator({
            baseUrl: this.options.baseUrl,
            defaultSiteName: this.options.siteName,
            defaultLocale: this.options.defaultLocale,
            defaultImage: this.options.defaultImage,
            outputDir: this.options.outputDir,
        });
    }

    /**
     * Génère les métadonnées SEO pour une route
     * 
     * @param routePath Chemin de la route
     * @param metadata Métadonnées partielles
     * @param pageType Type de page
     * @returns Métadonnées générées (OpenGraph et JSON-LD)
     */
    async generateMetaForRoute(
        routePath: string,
        metadata: Partial<Metadata>,
        pageType?: PageType
    ): Promise<{ openGraph: Record<string, string>; jsonLd: Record<string, any> }> {
        // Auto-détection du type de page si non spécifié
        const detectedPageType = pageType || this.detectPageType(routePath);

        // URL complète
        const url = `${this.options.baseUrl}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;

        // Métadonnées complètes
        const fullMetadata: Metadata = {
            title: metadata.title || this.generateDefaultTitle(routePath),
            description: metadata.description || this.generateDefaultDescription(routePath),
            url,
            type: this.getContentTypeForPageType(detectedPageType),
            siteName: this.options.siteName,
            locale: this.options.defaultLocale,
            ...metadata,
        } as Metadata;

        // Génération des métadonnées
        const result = await this.metaGenerator.generateForRoute(routePath, fullMetadata, detectedPageType);

        // Mise en cache des métadonnées
        this.metadataCache.set(routePath, fullMetadata);

        // Log
        if (this.options.verbose) {
            console.log(`✅ Métadonnées SEO générées pour ${routePath} (type: ${detectedPageType})`);
        }

        return result;
    }

    /**
     * Extrait et génère des métadonnées depuis un fichier PHP existant
     * 
     * @param phpPath Chemin du fichier PHP
     * @param targetRoute Route cible
     * @returns Métadonnées extraites et améliorées
     */
    async extractAndGenerateFromPhp(
        phpPath: string,
        targetRoute: string
    ): Promise<{ openGraph: Record<string, string>; jsonLd: Record<string, any> }> {
        try {
            // Vérifier si le fichier existe
            const fullPhpPath = path.join(this.options.legacySourceDir, phpPath);
            if (!await pathExists(fullPhpPath)) {
                throw new Error(`Fichier PHP non trouvé: ${fullPhpPath}`);
            }

            // Extraire les métadonnées de base
            const { extractMetaFromPhpPage } = await import('./seo/seo-meta-generator');
            const extractedMeta = await extractMetaFromPhpPage(fullPhpPath);

            // Détecter le type de page
            const pageType = this.detectPageType(targetRoute);

            // Génération des métadonnées complètes
            return this.generateMetaForRoute(targetRoute, extractedMeta, pageType);
        } catch (error) {
            console.error(`Erreur lors de l'extraction des métadonnées depuis ${phpPath}:`, error);
            // En cas d'erreur, générer des métadonnées par défaut
            return this.generateMetaForRoute(targetRoute, {}, this.detectPageType(targetRoute));
        }
    }

    /**
     * Injecte des métadonnées SEO dans un fichier HTML
     * 
     * @param html Contenu HTML
     * @param routePath Chemin de la route
     * @param metadata Métadonnées (optionnel, utilisera le cache si disponible)
     * @returns HTML avec métadonnées injectées
     */
    async injectMetaIntoHtml(
        html: string,
        routePath: string,
        metadata?: Partial<Metadata>
    ): Promise<string> {
        // Récupérer les métadonnées depuis le cache ou en générer de nouvelles
        const meta = metadata
            ? await this.generateMetaForRoute(routePath, metadata)
            : this.metadataCache.has(routePath)
                ? {
                    openGraph: this.metaGenerator.generateOpenGraph(this.metadataCache.get(routePath)!),
                    jsonLd: this.metaGenerator.generateJsonLd(
                        this.metadataCache.get(routePath)!,
                        this.detectPageType(routePath)
                    )
                }
                : await this.generateMetaForRoute(routePath, {});

        // Convertir les métadonnées en HTML
        const openGraphHtml = this.metaGenerator.generateOpenGraphHtml(meta.openGraph);
        const jsonLdHtml = this.metaGenerator.generateJsonLdHtml(meta.jsonLd);

        // Injection dans le HTML
        let result = html;

        // Injecter OpenGraph avant </head>
        result = result.replace(
            /<\/head>/i,
            `<!-- OpenGraph / Social Media -->\n${openGraphHtml}\n</head>`
        );

        // Injecter JSON-LD après <body>
        result = result.replace(
            /<body([^>]*)>/i,
            `<body$1>\n<!-- Structured Data -->\n${jsonLdHtml}`
        );

        return result;
    }

    /**
     * Génère des métadonnées pour toutes les routes d'un répertoire
     * 
     * @param routesDir Répertoire contenant les fichiers de routes
     * @param pattern Motif de fichier à traiter (glob)
     */
    async batchGenerateMetaForDirectory(
        routesDir: string,
        pattern: string = '**/*.{tsx,jsx,ts,js}'
    ): Promise<void> {
        const { glob } = await import('glob');

        // Trouver tous les fichiers de routes
        const files = await glob(pattern, { cwd: routesDir });

        if (this.options.verbose) {
            console.log(`🔍 Traitement de ${files.length} fichiers de routes...`);
        }

        for (const file of files) {
            try {
                // Convertir le chemin de fichier en route
                const route = this.filePathToRoute(file);

                // Générer les métadonnées
                await this.generateMetaForRoute(route, {});

            } catch (error) {
                console.error(`Erreur lors de la génération pour ${file}:`, error);
            }
        }

        if (this.options.verbose) {
            console.log(`✅ Génération terminée pour ${files.length} routes`);
        }
    }

    /**
     * Détecte le type de page en fonction du chemin de la route
     * 
     * @param routePath Chemin de la route
     * @returns Type de page détecté
     */
    private detectPageType(routePath: string): PageType {
        const path = routePath.toLowerCase();

        if (path === '/' || path === 'index') {
            return PageType.HOMEPAGE;
        }

        if (path.includes('blog') || path.includes('article')) {
            return PageType.ARTICLE;
        }

        if (path.includes('produit') || path.includes('product') || path.includes('fiche')) {
            return PageType.PRODUCT;
        }

        if (path.includes('categorie') || path.includes('category')) {
            return PageType.CATEGORY;
        }

        if (path.includes('faq') || path.includes('questions')) {
            return PageType.FAQ;
        }

        if (path.includes('contact')) {
            return PageType.CONTACT;
        }

        if (path.includes('about') || path.includes('a-propos')) {
            return PageType.ABOUT;
        }

        if (path.includes('service')) {
            return PageType.SERVICE;
        }

        return PageType.GENERIC;
    }

    /**
     * Convertit un type de page en type de contenu OpenGraph
     * 
     * @param pageType Type de page
     * @returns Type de contenu OpenGraph
     */
    private getContentTypeForPageType(pageType: PageType): 'website' | 'article' | 'product' | 'profile' {
        switch (pageType) {
            case PageType.ARTICLE:
            case PageType.BLOG:
                return 'article';
            case PageType.PRODUCT:
                return 'product';
            case PageType.ABOUT:
                return 'profile';
            default:
                return 'website';
        }
    }

    /**
     * Génère un titre par défaut pour une route
     * 
     * @param routePath Chemin de la route
     * @returns Titre généré
     */
    private generateDefaultTitle(routePath: string): string {
        // Extraire le dernier segment de la route
        const segment = routePath.split('/').pop() || 'Accueil';

        // Capitaliser et remplacer les tirets par des espaces
        const formatted = segment
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return `${formatted} | ${this.options.siteName}`;
    }

    /**
     * Génère une description par défaut pour une route
     * 
     * @param routePath Chemin de la route
     * @returns Description générée
     */
    private generateDefaultDescription(routePath: string): string {
        const segment = routePath.split('/').pop() || 'Accueil';
        const formatted = segment.replace(/-/g, ' ');

        return `Découvrez notre page ${formatted} sur ${this.options.siteName}. Nous proposons du contenu de qualité et des informations utiles.`;
    }

    /**
     * Convertit un chemin de fichier en route
     * 
     * @param filePath Chemin de fichier
     * @returns Route correspondante
     */
    private filePathToRoute(filePath: string): string {
        return '/' + filePath
            .replace(/\.(tsx|jsx|ts|js)$/, '')
            .replace(/\/index$/, '')
            .replace(/\[([^\]]+)\]/g, ':$1');
    }
}

export default SeoContentEnhancer;
