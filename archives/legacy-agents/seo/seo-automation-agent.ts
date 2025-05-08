/**
 * seo-automation-agent.ts
 * 
 * Agent d'automatisation SEO complet avec intégration Caddy
 * 
 * Fonctionnalités:
 * - Génération automatique de JSON-LD et OpenGraph
 * - Validation et gestion des redirections
 * - Intégration avec Caddy pour un SEO optimisé
 * - Headers de sécurité et performance
 * 
 * Date: 2 mai 2025
 */

import fs from 'fs';
import path from 'path';
import { BaseAgent } from '../core/base-agent';
import { AgentContext } from '../core/interfaces';
import { MCPAgent } from '../core/interfaces';
import { UrlPreservationAgent } from './url-preservation-agent';
import { CaddyGenerator20 } from '../migration/caddy-generator-2.0';

// Types pour les métadonnées SEO
interface SEOMetadata {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl?: string;
    ogTags: Record<string, string>;
    jsonLd: Record<string, any>[];
}

// Configuration pour l'agent SEO
interface SEOAutomationConfig {
    // Options pour la génération des métadonnées
    metadata: {
        jsonLd: boolean;
        openGraph: boolean;
        twitter: boolean;
        defaultImage?: string;
        siteName: string;
        siteUrl: string;
    };

    // Options pour les redirections
    redirections: {
        validate: boolean;
        generateMap: boolean;
        outputPath?: string;
        preserveExistingUrls: boolean;
    };

    // Options pour l'intégration avec Caddy
    serverIntegration: {
        enableCaddy: boolean;
        caddyConfigPath?: string;
        headers: {
            security: boolean;
            performance: boolean;
            cacheControl?: string;
        };
    };

    // Sources de données
    dataSources: {
        routesPath?: string;
        contentPath?: string;
        legacyUrlsPath?: string;
    };
}

/**
 * Agent d'automatisation SEO qui unifie toutes les fonctionnalités SEO
 * et s'intègre avec le serveur Caddy
 */
export class SEOAutomationAgent extends BaseAgent implements MCPAgent {
    name = 'SEOAutomationAgent';
    version = '1.0.0';
    description = 'Agent d\'automatisation SEO avec génération de JSON-LD, OpenGraph, redirections et intégration Caddy';

    private config!: SEOAutomationConfig;
    private urlPreservationAgent: UrlPreservationAgent;
    private caddyGenerator: CaddyGenerator20;

    private metadataRegistry: Map<string, SEOMetadata> = new Map();
    private redirectionMap: Map<string, string> = new Map();

    constructor() {
        super();
        this.urlPreservationAgent = new UrlPreservationAgent();
        this.caddyGenerator = new CaddyGenerator20();
    }

    /**
     * Initialise l'agent SEO avec la configuration fournie
     */
    async initialize(context: AgentContext): Promise<void> {
        this.config = context.getConfig<SEOAutomationConfig>();

        // Valider la configuration
        this.validateConfig();

        // Initialiser les agents dépendants
        if (this.config.redirections.preserveExistingUrls) {
            await this.urlPreservationAgent.initialize(context);
        }

        if (this.config.serverIntegration.enableCaddy) {
            await this.caddyGenerator.initialize(context);
        }

        context.logger.info(`Agent SEO automatisé initialisé avec succès.`);
    }

    /**
     * Exécute le processus d'automatisation SEO complet
     */
    async execute(context: AgentContext): Promise<void> {
        context.logger.info(`Exécution de l'agent d'automatisation SEO...`);

        // Étape 1: Analyser les routes et le contenu
        await this.analyzeContent(context);

        // Étape 2: Générer les métadonnées SEO (JSON-LD, OpenGraph)
        await this.generateMetadata(context);

        // Étape 3: Établir et valider le plan de redirection
        if (this.config.redirections.validate) {
            await this.validateRedirections(context);
        }

        // Étape 4: Intégrer avec Caddy pour les aspects serveur du SEO
        if (this.config.serverIntegration.enableCaddy) {
            await this.configureCaddyForSEO(context);
        }

        // Étape 5: Générer les fichiers de sortie
        await this.generateOutputFiles(context);

        context.logger.info(`Agent SEO terminé avec succès.`);
    }

    /**
     * Valide la configuration de l'agent
     */
    private validateConfig(): void {
        // Si la configuration des métadonnées est activée, valider les champs obligatoires
        if (this.config.metadata.jsonLd || this.config.metadata.openGraph || this.config.metadata.twitter) {
            if (!this.config.metadata.siteUrl) {
                throw new Error('Le champ metadata.siteUrl est obligatoire pour la génération des métadonnées SEO');
            }

            if (!this.config.metadata.siteName) {
                throw new Error('Le champ metadata.siteName est obligatoire pour la génération des métadonnées SEO');
            }
        }

        // Valider la configuration des redirections
        if (this.config.redirections.generateMap && !this.config.redirections.outputPath) {
            throw new Error('Le champ redirections.outputPath est obligatoire quand redirections.generateMap est activé');
        }

        // Valider la configuration du serveur
        if (this.config.serverIntegration.enableCaddy && !this.config.serverIntegration.caddyConfigPath) {
            throw new Error('Le champ serverIntegration.caddyConfigPath est obligatoire quand serverIntegration.enableCaddy est activé');
        }
    }

    /**
     * Analyse le contenu des routes et pages
     */
    private async analyzeContent(context: AgentContext): Promise<void> {
        context.logger.info('Analyse du contenu et des routes pour le SEO...');

        if (!this.config.dataSources.routesPath) {
            context.logger.warn('Aucun chemin de routes spécifié, étape d\'analyse ignorée.');
            return;
        }

        try {
            // Charger les fichiers de routes
            const routesDir = this.config.dataSources.routesPath;
            const routeFiles = this.findAllRouteFiles(routesDir);

            context.logger.info(`${routeFiles.length} fichiers de route trouvés pour l'analyse SEO.`);

            // Analyser chaque fichier de route
            for (const routeFile of routeFiles) {
                const content = await fs.promises.readFile(routeFile, 'utf-8');

                // Extraire les informations pertinentes pour le SEO
                const route = this.extractRouteInfoFromFile(routeFile, content);
                if (route && route.path) {
                    // Créer une entrée de métadonnées pour cette route
                    this.metadataRegistry.set(route.path, {
                        title: route.title || 'Page sans titre',
                        description: route.description || 'Aucune description disponible',
                        keywords: route.keywords || [],
                        canonicalUrl: route.canonicalUrl,
                        ogTags: {},
                        jsonLd: []
                    });
                }
            }

            // Analyser les redirections existantes si disponibles
            if (this.config.dataSources.legacyUrlsPath) {
                await this.analyzeLegacyUrls(context, this.config.dataSources.legacyUrlsPath);
            }
        } catch (error) {
            context.logger.error(`Erreur lors de l'analyse du contenu: ${error}`);
            throw error;
        }
    }

    /**
     * Trouve tous les fichiers de route dans un répertoire
     */
    private findAllRouteFiles(dirPath: string): string[] {
        const routeFiles: string[] = [];

        // Récupérer tous les fichiers .js, .jsx, .ts, .tsx qui pourraient contenir des définitions de routes
        const allFiles = this.getFilesRecursively(dirPath);

        // Filtrer pour ne garder que les fichiers de routes probables
        return allFiles.filter(file => {
            const ext = path.extname(file);
            return ['.js', '.jsx', '.ts', '.tsx'].includes(ext) &&
                !file.includes('.test.') &&
                !file.includes('.spec.') &&
                (file.includes('route') || file.includes('page'));
        });
    }

    /**
     * Récupère tous les fichiers de manière récursive dans un répertoire
     */
    private getFilesRecursively(dir: string): string[] {
        let files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(this.getFilesRecursively(fullPath));
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Extrait les informations de route pertinentes pour le SEO depuis un fichier
     */
    private extractRouteInfoFromFile(filePath: string, content: string): any {
        // Extraire le chemin de la route
        const routePath = this.extractRoutePath(content);

        // Extraire les métadonnées SEO du fichier
        const title = this.extractMetaTag(content, 'title');
        const description = this.extractMetaTag(content, 'description');
        const keywords = this.extractKeywords(content);
        const canonicalUrl = this.extractMetaTag(content, 'canonical');

        return {
            path: routePath,
            title,
            description,
            keywords,
            canonicalUrl,
            filePath
        };
    }

    /**
     * Extrait une balise méta spécifique du contenu
     */
    private extractMetaTag(content: string, tagName: string): string | undefined {
        // Rechercher selon différents patterns courants
        // 1. Pattern d'export meta: export const meta = { title: "Titre" }
        const metaObjectMatch = content.match(
            new RegExp(`meta\\s*=\\s*{[^}]*${tagName}\\s*:\\s*["']([^"']+)["']`, 'i')
        );
        if (metaObjectMatch) return metaObjectMatch[1];

        // 2. Pattern de composant Head: <meta name="description" content="Description" />
        const headComponentMatch = content.match(
            new RegExp(`<meta\\s+name=["']${tagName}["']\\s+content=["']([^"']+)["']`, 'i')
        );
        if (headComponentMatch) return headComponentMatch[1];

        // 3. Pattern de titre direct: <title>Titre</title>
        if (tagName === 'title') {
            const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch) return titleMatch[1];
        }

        return undefined;
    }

    /**
     * Extrait les mots-clés du contenu
     */
    private extractKeywords(content: string): string[] {
        const keywordsMatch = content.match(/keywords\s*[=:]\s*["']([^"']+)["']/i) ||
            content.match(/keywords\s*[=:]\s*\[([^\]]+)\]/i);

        if (keywordsMatch) {
            // Nettoyer et diviser la chaîne de mots-clés
            return keywordsMatch[1]
                .split(/,\s*/)
                .map(kw => kw.trim().replace(/["']/g, ''))
                .filter(Boolean);
        }

        return [];
    }

    /**
     * Extrait le chemin de la route à partir du contenu du fichier
     */
    private extractRoutePath(content: string): string | undefined {
        // Pattern pour les définitions de route dans divers frameworks
        const patterns = [
            // Next.js / Remix - export du loader
            /export\s+const\s+loader[^{]*?path\s*:\s*["']([^"']+)["']/i,

            // React Router - définition de route
            /path\s*:\s*["']([^"']+)["']/i,

            // Remix - URL pattern
            /export\s+const\s+route\s*=\s*["']([^"']+)["']/i,

            // Extracteur générique qui se base sur le nom du fichier
            /(\/?[a-z0-9_\-]+)\.[jt]sx?$/i
        ];

        // Essayer chaque pattern
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) return match[1];
        }

        return undefined;
    }

    /**
     * Analyse les URLs legacy pour générer des redirections
     */
    private async analyzeLegacyUrls(context: AgentContext, legacyUrlsPath: string): Promise<void> {
        try {
            const content = await fs.promises.readFile(legacyUrlsPath, 'utf-8');
            let legacyUrls: string[] = [];

            try {
                // Essayer de parser comme JSON d'abord
                const jsonData = JSON.parse(content);
                if (Array.isArray(jsonData)) {
                    legacyUrls = jsonData.map(item => {
                        if (typeof item === 'string') return item;
                        if (item.url) return item.url;
                        return '';
                    }).filter(Boolean);
                } else if (jsonData.urls && Array.isArray(jsonData.urls)) {
                    legacyUrls = jsonData.urls;
                }
            } catch {
                // Si pas un JSON, considérer comme une liste d'URLs ligne par ligne
                legacyUrls = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('/') || line.startsWith('http'));
            }

            // Mapper les anciennes URLs vers les nouvelles
            for (const legacyUrl of legacyUrls) {
                const normalizedUrl = this.normalizeUrl(legacyUrl);
                const modernUrl = this.mapLegacyToModernUrl(normalizedUrl);

                if (modernUrl) {
                    this.redirectionMap.set(normalizedUrl, modernUrl);
                }
            }

            context.logger.info(`${this.redirectionMap.size} redirections identifiées depuis les URLs legacy.`);
        } catch (error) {
            context.logger.error(`Erreur lors de l'analyse des URLs legacy: ${error}`);
        }
    }

    /**
     * Normalise une URL en retirant le domaine et en normalisant les slashs
     */
    private normalizeUrl(url: string): string {
        // Retirer le protocole et le domaine
        let path = url;
        if (url.includes('://')) {
            const urlObj = new URL(url);
            path = urlObj.pathname + urlObj.search + urlObj.hash;
        }

        // Normaliser les slashs
        if (!path.startsWith('/')) path = '/' + path;

        return path;
    }

    /**
     * Mappe une URL legacy vers son équivalent moderne
     */
    private mapLegacyToModernUrl(legacyUrl: string): string | undefined {
        // Simple mapping d'exemple - dans un cas réel, utiliser une logique plus sophistiquée
        // basée sur les règles de migration spécifiques

        // Convertir les URLs PHP en URLs modernes sans extension
        if (legacyUrl.endsWith('.php')) {
            // Supprimer l'extension .php
            const basePath = legacyUrl.substring(0, legacyUrl.length - 4);

            // Traiter les cas spéciaux courants
            if (legacyUrl.includes('produit.php') || legacyUrl.includes('product.php')) {
                const productId = new URL(`http://example.com${legacyUrl}`).searchParams.get('id');
                if (productId) {
                    return `/produits/${productId}`;
                }
                return '/produits';
            }

            if (legacyUrl.includes('categorie.php') || legacyUrl.includes('category.php')) {
                const categoryId = new URL(`http://example.com${legacyUrl}`).searchParams.get('id');
                if (categoryId) {
                    return `/categories/${categoryId}`;
                }
                return '/categories';
            }

            if (legacyUrl === '/index.php') {
                return '/';
            }

            // Pour les autres cas, juste enlever l'extension
            return basePath;
        }

        return undefined;
    }

    /**
     * Génère les métadonnées SEO (JSON-LD, OpenGraph) pour les routes
     */
    private async generateMetadata(context: AgentContext): Promise<void> {
        if (!this.config.metadata.jsonLd && !this.config.metadata.openGraph && !this.config.metadata.twitter) {
            context.logger.info('Génération des métadonnées désactivée, étape ignorée.');
            return;
        }

        context.logger.info('Génération des métadonnées SEO...');

        for (const [routePath, metadata] of this.metadataRegistry.entries()) {
            // Générer JSON-LD
            if (this.config.metadata.jsonLd) {
                metadata.jsonLd = this.generateJsonLdForRoute(routePath, metadata);
            }

            // Générer OpenGraph
            if (this.config.metadata.openGraph) {
                metadata.ogTags = this.generateOpenGraphForRoute(routePath, metadata);
            }

            // Ajouter Twitter Cards (basées sur OpenGraph)
            if (this.config.metadata.twitter && this.config.metadata.openGraph) {
                metadata.ogTags['twitter:card'] = 'summary_large_image';
                metadata.ogTags['twitter:title'] = metadata.ogTags['og:title'];
                metadata.ogTags['twitter:description'] = metadata.ogTags['og:description'];
                if (metadata.ogTags['og:image']) {
                    metadata.ogTags['twitter:image'] = metadata.ogTags['og:image'];
                }
            }
        }

        context.logger.info(`Métadonnées SEO générées pour ${this.metadataRegistry.size} routes.`);
    }

    /**
     * Génère les balises OpenGraph pour une route
     */
    private generateOpenGraphForRoute(routePath: string, metadata: SEOMetadata): Record<string, string> {
        const ogTags: Record<string, string> = {
            'og:title': metadata.title,
            'og:description': metadata.description || '',
            'og:type': 'website',
            'og:url': new URL(routePath, this.config.metadata.siteUrl).toString(),
            'og:site_name': this.config.metadata.siteName
        };

        // Ajouter une image si disponible
        if (this.config.metadata.defaultImage) {
            ogTags['og:image'] = new URL(this.config.metadata.defaultImage, this.config.metadata.siteUrl).toString();
        }

        return ogTags;
    }

    /**
     * Génère le JSON-LD pour une route
     */
    private generateJsonLdForRoute(routePath: string, metadata: SEOMetadata): Record<string, any>[] {
        const jsonLdArray: Record<string, any>[] = [];

        // Ajouter le schema WebPage de base
        jsonLdArray.push({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': metadata.title,
            'description': metadata.description,
            'url': new URL(routePath, this.config.metadata.siteUrl).toString()
        });

        // Ajouter BreadcrumbList
        if (routePath !== '/') {
            const breadcrumbItems = this.generateBreadcrumbFromPath(routePath);

            if (breadcrumbItems.length > 0) {
                jsonLdArray.push({
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': breadcrumbItems.map((item, index) => ({
                        '@type': 'ListItem',
                        'position': index + 1,
                        'name': item.name,
                        'item': new URL(item.path, this.config.metadata.siteUrl).toString()
                    }))
                });
            }
        }

        // Ajouter Organization
        jsonLdArray.push({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': this.config.metadata.siteName,
            'url': this.config.metadata.siteUrl
        });

        return jsonLdArray;
    }

    /**
     * Génère des fils d'Ariane (breadcrumbs) à partir d'un chemin
     */
    private generateBreadcrumbFromPath(path: string): Array<{ name: string, path: string }> {
        const breadcrumbs: Array<{ name: string, path: string }> = [];

        // Ajouter l'accueil comme premier élément
        breadcrumbs.push({
            name: 'Accueil',
            path: '/'
        });

        // Diviser le chemin et construire les breadcrumbs
        const parts = path.split('/').filter(Boolean);
        let currentPath = '';

        for (const part of parts) {
            currentPath += `/${part}`;
            breadcrumbs.push({
                name: this.formatBreadcrumbName(part),
                path: currentPath
            });
        }

        return breadcrumbs;
    }

    /**
     * Formate un segment d'URL en nom lisible pour breadcrumb
     */
    private formatBreadcrumbName(urlSegment: string): string {
        // Remplacer les tirets et underscores par des espaces
        let name = urlSegment.replace(/[-_]/g, ' ');

        // Mettre en majuscule la première lettre
        name = name.charAt(0).toUpperCase() + name.slice(1);

        return name;
    }

    /**
     * Valide les redirections
     */
    private async validateRedirections(context: AgentContext): Promise<void> {
        context.logger.info('Validation des redirections SEO...');

        // Compiler une liste de toutes les routes valides
        const validRoutes = new Set<string>(this.metadataRegistry.keys());

        // Valider chaque redirection
        const invalidRedirections = new Map<string, string>();

        for (const [source, target] of this.redirectionMap.entries()) {
            // Vérifier si la cible est une route valide
            if (!validRoutes.has(target)) {
                invalidRedirections.set(source, target);
            }
        }

        // Journaliser les redirections invalides
        if (invalidRedirections.size > 0) {
            context.logger.warn(`${invalidRedirections.size} redirections pointent vers des routes inexistantes.`);

            for (const [source, target] of invalidRedirections.entries()) {
                context.logger.warn(`  ${source} -> ${target} (cible inexistante)`);
            }
        } else {
            context.logger.info('Toutes les redirections sont valides.');
        }
    }

    /**
     * Configure Caddy pour optimiser le SEO
     */
    private async configureCaddyForSEO(context: AgentContext): Promise<void> {
        context.logger.info('Configuration du serveur Caddy pour le SEO...');

        if (!this.config.serverIntegration.caddyConfigPath) {
            context.logger.warn('Aucun chemin de configuration Caddy spécifié.');
            return;
        }

        try {
            // Lire le fichier Caddyfile existant
            const caddyfilePath = this.config.serverIntegration.caddyConfigPath;
            let caddyContent = '';

            try {
                caddyContent = await fs.promises.readFile(caddyfilePath, 'utf-8');
            } catch (error) {
                context.logger.warn(`Fichier Caddyfile non trouvé à ${caddyfilePath}, création d'un nouveau fichier.`);
            }

            // Ajouter les snippets SEO
            caddyContent = this.enhanceCaddyfileWithSEO(caddyContent);

            // Écrire le fichier Caddyfile mis à jour
            await fs.promises.writeFile(caddyfilePath, caddyContent, 'utf-8');

            context.logger.info(`Fichier Caddyfile configuré pour le SEO: ${caddyfilePath}`);
        } catch (error) {
            context.logger.error(`Erreur lors de la configuration de Caddy: ${error}`);
        }
    }

    /**
     * Améliore un fichier Caddyfile avec des directives SEO
     */
    private enhanceCaddyfileWithSEO(caddyContent: string): string {
        // Vérifier si le snippet SEO est déjà présent
        if (caddyContent.includes('(seo_optimizations)')) {
            return caddyContent;
        }

        // Ajouter les snippets SEO globaux
        const seoSnippets = `
# SEO optimizations snippet
(seo_optimizations) {
  # Enable compression for better performance
  encode gzip zstd

  # Security headers for SEO
  header {
    # Security headers
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "SAMEORIGIN"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # Remove server information
    -Server

    # Cache control (customizable per route)
    ?Cache-Control "{args.0}"
  }
}

# Redirections for legacy URLs
(legacy_redirects) {
  @legacy_urls {
    path_regexp legacy ^/(.+)\\.php$
  }
  
  # Handle legacy PHP URLs
  handle @legacy_urls {
    rewrite * /api/seo/resolve-legacy-url{path}?{query}
  }
}

`;

        // Si le contenu est vide, créer un nouveau Caddyfile avec les snippets
        if (!caddyContent.trim()) {
            return seoSnippets + `
# Exemple de configuration de domaine
example.com {
  # Importer les optimisations SEO
  import seo_optimizations "max-age=3600, public"
  
  # Importer les redirections legacy
  import legacy_redirects
  
  # Servir les fichiers statiques
  root * /var/www/html
  file_server
}
`;
        }

        // Sinon, ajouter les snippets au début du fichier
        return seoSnippets + caddyContent;
    }

    /**
     * Génère les fichiers de sortie
     */
    private async generateOutputFiles(context: AgentContext): Promise<void> {
        context.logger.info('Génération des fichiers de sortie...');

        // Créer les répertoires nécessaires
        await this.createOutputDirectories(context);

        // Générer le fichier de métadonnées SEO
        await this.generateSEOMetadataFile(context);

        // Générer le fichier de redirections
        if (this.config.redirections.generateMap) {
            await this.generateRedirectionsFile(context);
        }

        context.logger.info('Génération des fichiers terminée.');
    }

    /**
     * Crée les répertoires de sortie nécessaires
     */
    private async createOutputDirectories(context: AgentContext): Promise<void> {
        const outputPaths = [
            this.config.redirections.outputPath,
        ].filter(Boolean);

        for (const outputPath of outputPaths) {
            if (!outputPath) continue;

            const dirPath = path.dirname(outputPath);
            try {
                await fs.promises.mkdir(dirPath, { recursive: true });
            } catch (error) {
                context.logger.error(`Erreur lors de la création du répertoire ${dirPath}: ${error}`);
            }
        }
    }

    /**
     * Génère le fichier de métadonnées SEO
     */
    private async generateSEOMetadataFile(context: AgentContext): Promise<void> {
        // Convertir la map en objet pour la sérialisation
        const metadataObject: Record<string, any> = {};
        for (const [route, metadata] of this.metadataRegistry.entries()) {
            metadataObject[route] = metadata;
        }

        const outputPath = path.join(
            process.cwd(),
            'generated',
            'seo',
            'metadata.json'
        );

        // Créer le répertoire de sortie
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

        // Écrire le fichier
        await fs.promises.writeFile(
            outputPath,
            JSON.stringify(metadataObject, null, 2),
            'utf-8'
        );

        context.logger.info(`Fichier de métadonnées SEO généré: ${outputPath}`);
    }

    /**
     * Génère le fichier de redirections
     */
    private async generateRedirectionsFile(context: AgentContext): Promise<void> {
        if (!this.config.redirections.outputPath) {
            context.logger.warn('Aucun chemin de sortie spécifié pour les redirections.');
            return;
        }

        // Convertir la map en objet pour la sérialisation
        const redirectionsObject: Record<string, any> = {
            redirections: Array.from(this.redirectionMap.entries()).map(([source, target]) => ({
                source,
                target,
                statusCode: 301
            })),
            generatedAt: new Date().toISOString(),
            count: this.redirectionMap.size
        };

        // Écrire le fichier
        await fs.promises.writeFile(
            this.config.redirections.outputPath,
            JSON.stringify(redirectionsObject, null, 2),
            'utf-8'
        );

        context.logger.info(`Fichier de redirections généré: ${this.config.redirections.outputPath}`);
    }
}