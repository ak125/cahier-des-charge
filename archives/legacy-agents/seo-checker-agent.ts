/**
 * Agent SEO-Checker
 * 
 * Cet agent analyse automatiquement les pages pour vérifier leur conformité SEO
 * et peut être exécuté dans le pipeline CI/CD pour bloquer des déploiements
 * si les critères SEO ne sont pas respectés.
 * 
 * @module agents/seo-checker
 * @category SEO
 * @subcategory Validation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { parse as parseHtml } from 'node-html-parser';
import { URL } from 'url';
import { execSync } from 'child_process';
import { createReport } from './utils/reporting';

/**
 * Configuration pour les vérifications SEO
 * 
 * @interface SeoCheckConfig
 * @property {string[]} urls - Liste des URLs à vérifier
 * @property {string} baseUrl - URL de base du site
 * @property {object} thresholds - Seuils pour les différentes métriques
 * @property {number} thresholds.minTitleLength - Longueur minimale pour les titres
 * @property {number} thresholds.maxTitleLength - Longueur maximale pour les titres
 * @property {number} thresholds.minDescriptionLength - Longueur minimale pour les meta descriptions
 * @property {number} thresholds.maxDescriptionLength - Longueur maximale pour les meta descriptions
 * @property {number} thresholds.minH1Count - Nombre minimum de balises H1
 */

interface SeoCheckConfig {
    urls: string[];
    baseUrl: string;
    thresholds: {
        minTitleLength: number;
        maxTitleLength: number;
        minDescriptionLength: number;
        maxDescriptionLength: number;
        minH1Count: number;
        maxH1Count: number;
        maxHeadingDepth: number;
        minContentWordCount: number;
        maxImageWithoutAlt: number;
    };
    rules: {
        requireCanonical: boolean;
        requireRobotsMeta: boolean;
        requireOgTags: boolean;
        requireStructuredData: boolean;
        requireSitemap: boolean;
        checkBrokenLinks: boolean;
        checkPerformance: boolean;
        checkMobileCompatibility: boolean;
    };
    blockers: string[]; // Liste des problèmes qui bloqueront le pipeline CI
    reportPath: string;
}

const defaultConfig: SeoCheckConfig = {
    urls: [],
    baseUrl: 'https://example.com',
    thresholds: {
        minTitleLength: 20,
        maxTitleLength: 70,
        minDescriptionLength: 80,
        maxDescriptionLength: 160,
        minH1Count: 1,
        maxH1Count: 1,
        maxHeadingDepth: 4,
        minContentWordCount: 300,
        maxImageWithoutAlt: 0
    },
    rules: {
        requireCanonical: true,
        requireRobotsMeta: true,
        requireOgTags: true,
        requireStructuredData: true,
        requireSitemap: true,
        checkBrokenLinks: true,
        checkPerformance: false, // Désactivé par défaut car peut ralentir le pipeline
        checkMobileCompatibility: true
    },
    blockers: [
        'missing_title',
        'missing_description',
        'missing_h1',
        'multiple_h1',
        'missing_canonical',
        'no_alt_text',
        'broken_links'
    ],
    reportPath: './reports/seo'
};

interface SeoIssue {
    type: string;
    url: string;
    description: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    element?: string;
    position?: string;
    recommendation?: string;
    isBlocker: boolean;
}

interface SeoCheckResult {
    url: string;
    status: 'pass' | 'fail' | 'warning';
    score: number;
    issues: SeoIssue[];
    metadata: {
        title: string;
        description: string;
        canonical: string | null;
        h1Count: number;
        wordCount: number;
        imageCount: number;
        imagesWithoutAlt: number;
        internalLinks: number;
        externalLinks: number;
        timestamp: string;
    };
}

class SeoCheckerAgent {
    private config: SeoCheckConfig;
    private results: SeoCheckResult[] = [];
    private blockerFound = false;

    constructor(configPath?: string) {
        this.config = { ...defaultConfig };

        if (configPath && fs.existsSync(configPath)) {
            try {
                const userConfig = fs.readJSONSync(configPath);
                this.config = { ...this.config, ...userConfig };
            } catch (error) {
                console.error(`Erreur lors du chargement de la configuration SEO: ${error.message}`);
            }
        }
    }

    /**
     * Exécute la vérification SEO sur les URLs fournies ou détectées
     */
    async run(providedUrls?: string[]): Promise<boolean> {
        console.log('🔍 Démarrage de la vérification SEO...');

        // Déterminer les URLs à analyser
        let urlsToCheck = providedUrls || this.config.urls;

        // Si aucune URL n'est fournie, on tente de détecter les URLs modifiées
        if (!urlsToCheck || urlsToCheck.length === 0) {
            console.log('Aucune URL fournie, tentative de détection des URLs modifiées...');
            try {
                urlsToCheck = this.detectChangedUrls();
            } catch (error) {
                console.error(`Échec de la détection des URLs modifiées: ${error.message}`);
                return false;
            }
        }

        if (urlsToCheck.length === 0) {
            console.log('Aucune URL à vérifier, analyse terminée.');
            return true;
        }

        console.log(`Analyse de ${urlsToCheck.length} URLs...`);

        // Vérifier chaque URL
        for (const url of urlsToCheck) {
            try {
                const fullUrl = this.ensureFullUrl(url);
                console.log(`Vérification de ${fullUrl}...`);
                const result = await this.checkUrl(fullUrl);
                this.results.push(result);

                // Vérifier si un bloqueur a été trouvé
                if (result.issues.some(issue => issue.isBlocker)) {
                    this.blockerFound = true;
                    console.error(`⛔ Problème SEO bloquant trouvé sur ${fullUrl}`);
                }
            } catch (error) {
                console.error(`Erreur lors de l'analyse de ${url}: ${error.message}`);

                // Ajouter un résultat d'erreur
                this.results.push({
                    url,
                    status: 'fail',
                    score: 0,
                    issues: [{
                        type: 'check_error',
                        url,
                        description: `Erreur lors de l'analyse: ${error.message}`,
                        severity: 'error',
                        isBlocker: true
                    }],
                    metadata: {
                        title: '',
                        description: '',
                        canonical: null,
                        h1Count: 0,
                        wordCount: 0,
                        imageCount: 0,
                        imagesWithoutAlt: 0,
                        internalLinks: 0,
                        externalLinks: 0,
                        timestamp: new Date().toISOString()
                    }
                });

                this.blockerFound = true;
            }
        }

        // Générer le rapport
        await this.generateReport();

        // Retourner le statut global (réussite = aucun bloqueur trouvé)
        const success = !this.blockerFound;
        console.log(`✅ Vérification SEO terminée. Statut: ${success ? 'RÉUSSITE' : 'ÉCHEC'}`);

        return success;
    }

    /**
     * S'assure qu'une URL est complète (avec protocole et domaine)
     */
    private ensureFullUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Ajouter le baseUrl si le chemin est relatif
        const baseUrl = this.config.baseUrl.endsWith('/')
            ? this.config.baseUrl.slice(0, -1)
            : this.config.baseUrl;

        return url.startsWith('/')
            ? `${baseUrl}${url}`
            : `${baseUrl}/${url}`;
    }

    /**
     * Détecte les URLs modifiées depuis le dernier commit
     */
    private detectChangedUrls(): string[] {
        try {
            // Vérifier d'abord si nous sommes dans un dépôt Git
            execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

            // Utiliser le script de détection des URLs affectées si disponible
            const detectScriptPath = path.resolve(process.cwd(), 'scripts', 'ci', 'detect-affected-urls.js');

            if (fs.existsSync(detectScriptPath)) {
                console.log('Utilisation du script de détection des URLs affectées...');

                const output = execSync(`node ${detectScriptPath} --format=json`).toString().trim();
                const urls = JSON.parse(output);

                console.log(`${urls.length} URLs affectées détectées.`);
                return urls;
            }

            // Fallback: Analyser les fichiers modifiés pour trouver des patterns d'URL
            console.log('Script de détection non trouvé, utilisation du fallback...');

            const changedFiles = execSync('git diff --name-only HEAD~1 HEAD').toString().split('\n').filter(Boolean);

            // Filtrer pour ne garder que les fichiers pertinents pour les routes/pages
            const routePatterns = [
                /src\/routes\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
                /src\/pages\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
                /src\/app\/(.+?)\/(?:page|route)\.(tsx|jsx|ts|js|mdx)$/
            ];

            const urls = new Set<string>();

            // Extraire les routes depuis les fichiers modifiés
            for (const file of changedFiles) {
                for (const pattern of routePatterns) {
                    const match = file.match(pattern);
                    if (match) {
                        let routePath = match[1];

                        // Normaliser le chemin de route en URL
                        // Remplacer les segments dynamiques [param] par :param
                        routePath = routePath
                            .replace(/\[([^\]]+)\]/g, ':$1')
                            .replace(/\$[^/]+/g, ':id');

                        // Traiter les cas spéciaux comme les routes index
                        if (routePath === 'index' || routePath.endswith('/index')) {
                            routePath = routePath.replace(/\/index$/, '/');
                        }

                        // S'assurer que le chemin commence par "/"
                        if (!routePath.startsWith('/')) {
                            routePath = '/' + routePath;
                        }

                        urls.add(routePath);
                    }
                }
            }

            // Toujours inclure la page d'accueil
            urls.add('/');

            return Array.from(urls);
        } catch (error) {
            console.error(`Erreur lors de la détection des URLs: ${error.message}`);
            return ['/'];  // Retourner au moins la page d'accueil
        }
    }

    /**
     * Vérifie une URL pour les problèmes SEO
     */
    private async checkUrl(url: string): Promise<SeoCheckResult> {
        const issues: SeoIssue[] = [];
        const metadata = {
            title: '',
            description: '',
            canonical: null as string | null,
            h1Count: 0,
            wordCount: 0,
            imageCount: 0,
            imagesWithoutAlt: 0,
            internalLinks: 0,
            externalLinks: 0,
            timestamp: new Date().toISOString()
        };

        try {
            // Récupérer le contenu de la page
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'SEO-Checker-Agent/1.0'
                },
                timeout: 10000
            });

            const html = response.data;
            const root = parseHtml(html);

            // Vérification du titre
            this.checkTitle(root, url, issues, metadata);

            // Vérification de la description
            this.checkDescription(root, url, issues, metadata);

            // Vérification du H1
            this.checkH1(root, url, issues, metadata);

            // Vérification de la profondeur des headings
            this.checkHeadingDepth(root, url, issues);

            // Vérification des images sans alt
            this.checkImages(root, url, issues, metadata);

            // Vérification du canonical
            this.checkCanonical(root, url, issues, metadata);

            // Vérification des balises Open Graph
            this.checkOpenGraph(root, url, issues);

            // Vérification des données structurées
            this.checkStructuredData(root, url, issues);

            // Vérification des liens et calcul du nombre de mots
            this.checkLinksAndContent(root, url, issues, metadata);

            // Vérification des balises robots
            this.checkRobotsMeta(root, url, issues);

        } catch (error) {
            issues.push({
                type: 'fetch_error',
                url,
                description: `Impossible d'accéder à l'URL: ${error.message}`,
                severity: 'critical',
                isBlocker: true
            });
        }

        // Calculer le score SEO
        const score = this.calculateScore(issues);

        // Déterminer le statut global
        let status: 'pass' | 'fail' | 'warning' = 'pass';
        if (issues.some(issue => issue.severity === 'critical' || issue.isBlocker)) {
            status = 'fail';
        } else if (issues.some(issue => issue.severity === 'error')) {
            status = 'warning';
        }

        return {
            url,
            status,
            score,
            issues,
            metadata
        };
    }

    /**
     * Vérification de la balise title
     */
    private checkTitle(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        const titleEl = root.querySelector('title');

        if (!titleEl) {
            issues.push({
                type: 'missing_title',
                url,
                description: 'La balise title est absente',
                severity: 'critical',
                recommendation: 'Ajouter une balise title concise et descriptive',
                isBlocker: this.config.blockers.includes('missing_title')
            });
            return;
        }

        const title = titleEl.text.trim();
        metadata.title = title;

        if (title.length === 0) {
            issues.push({
                type: 'empty_title',
                url,
                description: 'La balise title est vide',
                severity: 'critical',
                element: titleEl.toString(),
                recommendation: 'Ajouter un texte descriptif à la balise title',
                isBlocker: this.config.blockers.includes('missing_title')
            });
        } else if (title.length < this.config.thresholds.minTitleLength) {
            issues.push({
                type: 'short_title',
                url,
                description: `Le titre est trop court (${title.length} caractères, minimum recommandé: ${this.config.thresholds.minTitleLength})`,
                severity: 'error',
                element: title,
                recommendation: 'Allonger le titre pour le rendre plus descriptif',
                isBlocker: this.config.blockers.includes('short_title')
            });
        } else if (title.length > this.config.thresholds.maxTitleLength) {
            issues.push({
                type: 'long_title',
                url,
                description: `Le titre est trop long (${title.length} caractères, maximum recommandé: ${this.config.thresholds.maxTitleLength})`,
                severity: 'warning',
                element: title,
                recommendation: 'Raccourcir le titre pour éviter qu\'il soit tronqué dans les résultats de recherche',
                isBlocker: this.config.blockers.includes('long_title')
            });
        }
    }

    /**
     * Vérification de la balise meta description
     */
    private checkDescription(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        const descriptionEl = root.querySelector('meta[name="description"]');

        if (!descriptionEl) {
            issues.push({
                type: 'missing_description',
                url,
                description: 'La balise meta description est absente',
                severity: 'error',
                recommendation: 'Ajouter une meta description concise et descriptive',
                isBlocker: this.config.blockers.includes('missing_description')
            });
            return;
        }

        const description = descriptionEl.getAttribute('content').trim();
        metadata.description = description;

        if (description.length === 0) {
            issues.push({
                type: 'empty_description',
                url,
                description: 'La balise meta description est vide',
                severity: 'error',
                element: descriptionEl.toString(),
                recommendation: 'Ajouter un texte descriptif à la balise meta description',
                isBlocker: this.config.blockers.includes('missing_description')
            });
        } else if (description.length < this.config.thresholds.minDescriptionLength) {
            issues.push({
                type: 'short_description',
                url,
                description: `La description est trop courte (${description.length} caractères, minimum recommandé: ${this.config.thresholds.minDescriptionLength})`,
                severity: 'warning',
                element: description,
                recommendation: 'Allonger la description pour la rendre plus informative',
                isBlocker: this.config.blockers.includes('short_description')
            });
        } else if (description.length > this.config.thresholds.maxDescriptionLength) {
            issues.push({
                type: 'long_description',
                url,
                description: `La description est trop longue (${description.length} caractères, maximum recommandé: ${this.config.thresholds.maxDescriptionLength})`,
                severity: 'warning',
                element: description,
                recommendation: 'Raccourcir la description pour éviter qu\'elle soit tronquée dans les résultats de recherche',
                isBlocker: this.config.blockers.includes('long_description')
            });
        }
    }

    /**
     * Vérification de la balise H1
     */
    private checkH1(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        const h1Elements = root.querySelectorAll('h1');
        const h1Count = h1Elements.length;
        metadata.h1Count = h1Count;

        if (h1Count === 0) {
            issues.push({
                type: 'missing_h1',
                url,
                description: 'La page ne contient pas de balise H1',
                severity: 'error',
                recommendation: 'Ajouter une balise H1 principale qui décrit le contenu de la page',
                isBlocker: this.config.blockers.includes('missing_h1')
            });
        } else if (h1Count > this.config.thresholds.maxH1Count) {
            issues.push({
                type: 'multiple_h1',
                url,
                description: `La page contient ${h1Count} balises H1 (recommandation: ${this.config.thresholds.maxH1Count})`,
                severity: 'error',
                element: h1Elements.map(el => el.text.trim()).join(', '),
                recommendation: 'Garder une seule balise H1 principale et utiliser H2, H3, etc. pour les autres titres',
                isBlocker: this.config.blockers.includes('multiple_h1')
            });
        }
    }

    /**
     * Vérification de la profondeur des headings
     */
    private checkHeadingDepth(root: any, url: string, issues: SeoIssue[]): void {
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        const maxDepth = this.config.thresholds.maxHeadingDepth;

        // Vérifier si des headings de niveau élevé sont utilisés
        for (let i = maxDepth; i < headings.length; i++) {
            const headingElements = root.querySelectorAll(headings[i]);
            if (headingElements.length > 0) {
                issues.push({
                    type: 'deep_heading',
                    url,
                    description: `La page utilise des titres ${headings[i].toUpperCase()} qui sont trop profonds (profondeur max recommandée: H${maxDepth})`,
                    severity: 'warning',
                    element: headingElements.map(el => el.text.trim()).join(', '),
                    recommendation: `Restructurer les titres pour ne pas dépasser H${maxDepth}`,
                    isBlocker: this.config.blockers.includes('deep_heading')
                });
            }
        }

        // Vérifier la hiérarchie des titres (si H3 est utilisé sans H2, etc.)
        const headingLevels = headings.map(h => root.querySelectorAll(h).length);
        for (let i = 1; i < headingLevels.length; i++) {
            if (headingLevels[i] > 0 && headingLevels[i - 1] === 0) {
                issues.push({
                    type: 'heading_hierarchy',
                    url,
                    description: `La page utilise ${headings[i].toUpperCase()} sans ${headings[i - 1].toUpperCase()}, ce qui rompt la hiérarchie sémantique`,
                    severity: 'warning',
                    recommendation: 'Structurer les titres de manière hiérarchique (H1, puis H2, etc.)',
                    isBlocker: this.config.blockers.includes('heading_hierarchy')
                });
            }
        }
    }

    /**
     * Vérification des images sans attribut alt
     */
    private checkImages(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        const images = root.querySelectorAll('img');
        metadata.imageCount = images.length;

        let imagesWithoutAlt = 0;

        for (const img of images) {
            const alt = img.getAttribute('alt');
            const src = img.getAttribute('src');

            if (!alt && !img.hasAttribute('role') && !img.hasAttribute('aria-hidden')) {
                imagesWithoutAlt++;
                issues.push({
                    type: 'no_alt_text',
                    url,
                    description: `Image sans attribut alt: ${src || 'source inconnue'}`,
                    severity: 'error',
                    element: img.toString(),
                    recommendation: 'Ajouter un attribut alt descriptif ou marquer l\'image comme décorative',
                    isBlocker: this.config.blockers.includes('no_alt_text') && imagesWithoutAlt > this.config.thresholds.maxImageWithoutAlt
                });
            }
        }

        metadata.imagesWithoutAlt = imagesWithoutAlt;
    }

    /**
     * Vérification de la balise canonical
     */
    private checkCanonical(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        if (!this.config.rules.requireCanonical) {
            return;
        }

        const canonicalEl = root.querySelector('link[rel="canonical"]');

        if (!canonicalEl) {
            issues.push({
                type: 'missing_canonical',
                url,
                description: 'La balise canonical est absente',
                severity: 'error',
                recommendation: 'Ajouter une balise canonical pour éviter les problèmes de contenu dupliqué',
                isBlocker: this.config.blockers.includes('missing_canonical')
            });
            return;
        }

        const canonicalUrl = canonicalEl.getAttribute('href');
        metadata.canonical = canonicalUrl;

        if (!canonicalUrl) {
            issues.push({
                type: 'empty_canonical',
                url,
                description: 'La balise canonical a un attribut href vide',
                severity: 'error',
                element: canonicalEl.toString(),
                recommendation: 'Ajouter une URL valide à l\'attribut href de la balise canonical',
                isBlocker: this.config.blockers.includes('empty_canonical')
            });
        }
    }

    /**
     * Vérification des balises Open Graph
     */
    private checkOpenGraph(root: any, url: string, issues: SeoIssue[]): void {
        if (!this.config.rules.requireOgTags) {
            return;
        }

        const requiredOgTags = ['title', 'description', 'image', 'url', 'type'];
        const missingOgTags: string[] = [];

        for (const tag of requiredOgTags) {
            const ogTag = root.querySelector(`meta[property="og:${tag}"]`);
            if (!ogTag || !ogTag.getAttribute('content')) {
                missingOgTags.push(`og:${tag}`);
            }
        }

        if (missingOgTags.length > 0) {
            issues.push({
                type: 'missing_og_tags',
                url,
                description: `Balises Open Graph manquantes: ${missingOgTags.join(', ')}`,
                severity: 'warning',
                recommendation: 'Ajouter les balises Open Graph manquantes pour améliorer le partage sur les réseaux sociaux',
                isBlocker: this.config.blockers.includes('missing_og_tags')
            });
        }
    }

    /**
     * Vérification des données structurées
     */
    private checkStructuredData(root: any, url: string, issues: SeoIssue[]): void {
        if (!this.config.rules.requireStructuredData) {
            return;
        }

        const ldJson = root.querySelectorAll('script[type="application/ld+json"]');

        if (ldJson.length === 0) {
            issues.push({
                type: 'missing_structured_data',
                url,
                description: 'Données structurées (JSON-LD) absentes',
                severity: 'warning',
                recommendation: 'Ajouter des données structurées pertinentes en format JSON-LD',
                isBlocker: this.config.blockers.includes('missing_structured_data')
            });
        } else {
            // On pourrait ajouter ici une validation plus poussée des données structurées
        }
    }

    /**
     * Vérification des liens et calcul du nombre de mots
     */
    private checkLinksAndContent(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        // Nombre de mots dans le corps du texte
        const body = root.querySelector('body');
        if (body) {
            const text = body.text.trim();
            const words = text.split(/\s+/).filter(Boolean);
            metadata.wordCount = words.length;

            if (words.length < this.config.thresholds.minContentWordCount) {
                issues.push({
                    type: 'low_word_count',
                    url,
                    description: `Contenu texte insuffisant (${words.length} mots, minimum recommandé: ${this.config.thresholds.minContentWordCount})`,
                    severity: 'warning',
                    recommendation: 'Enrichir le contenu textuel de la page pour une meilleure indexation',
                    isBlocker: this.config.blockers.includes('low_word_count')
                });
            }
        }

        // Analyse des liens
        const links = root.querySelectorAll('a');
        const internalLinks: string[] = [];
        const externalLinks: string[] = [];
        const brokenLinks: string[] = [];

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            for (const link of links) {
                const href = link.getAttribute('href');
                if (!href) continue;

                try {
                    // Lien absolu ou relatif
                    const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                    const linkUrlObj = new URL(fullUrl);

                    if (linkUrlObj.hostname === hostname) {
                        internalLinks.push(fullUrl);
                    } else {
                        externalLinks.push(fullUrl);
                    }

                } catch (error) {
                    // URL invalide
                    brokenLinks.push(href);
                    issues.push({
                        type: 'invalid_link',
                        url,
                        description: `Lien invalide: ${href}`,
                        severity: 'error',
                        element: link.toString(),
                        recommendation: 'Corriger ou supprimer ce lien invalide',
                        isBlocker: this.config.blockers.includes('broken_links')
                    });
                }
            }

            metadata.internalLinks = internalLinks.length;
            metadata.externalLinks = externalLinks.length;

            // Vérification des liens brisés si activée
            if (this.config.rules.checkBrokenLinks && (internalLinks.length > 0 || externalLinks.length > 0)) {
                // Dans une implémentation réelle, on pourrait faire des requêtes HEAD vers ces liens
                // pour vérifier s'ils sont accessibles, mais cela ralentirait considérablement le processus
            }

        } catch (error) {
            issues.push({
                type: 'link_analysis_error',
                url,
                description: `Erreur lors de l'analyse des liens: ${error.message}`,
                severity: 'info',
                isBlocker: false
            });
        }
    }

    /**
     * Vérification des balises robots
     */
    private checkRobotsMeta(root: any, url: string, issues: SeoIssue[]): void {
        if (!this.config.rules.requireRobotsMeta) {
            return;
        }

        const robotsMeta = root.querySelector('meta[name="robots"]');

        if (!robotsMeta) {
            // Pas d'erreur critique, car l'absence de meta robots signifie "index, follow" par défaut
            issues.push({
                type: 'missing_robots_meta',
                url,
                description: 'Balise meta robots absente (par défaut: index, follow)',
                severity: 'info',
                recommendation: 'Ajouter explicitement une balise meta robots pour plus de clarté',
                isBlocker: false
            });
            return;
        }

        const content = robotsMeta.getAttribute('content');
        if (content && (content.includes('noindex') || content.includes('nofollow'))) {
            issues.push({
                type: 'restrictive_robots',
                url,
                description: `La balise meta robots est restrictive: ${content}`,
                severity: 'warning',
                element: robotsMeta.toString(),
                recommendation: 'Vérifier si cette restriction est intentionnelle',
                isBlocker: this.config.blockers.includes('restrictive_robots')
            });
        }
    }

    /**
     * Calcule le score SEO global basé sur les problèmes trouvés
     */
    private calculateScore(issues: SeoIssue[]): number {
        // Pondération par sévérité
        const weights = {
            critical: 30,
            error: 10,
            warning: 3,
            info: 1
        };

        // Score de base: 100
        let score = 100;

        // Soustraire des points en fonction des problèmes
        for (const issue of issues) {
            score -= weights[issue.severity];
        }

        // Garantir que le score reste entre 0 et 100
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Génère un rapport détaillé des résultats
     */
    private async generateReport(): Promise<void> {
        console.log('📊 Génération du rapport SEO...');

        try {
            // S'assurer que le dossier de rapport existe
            await fs.ensureDir(this.config.reportPath);

            // Enregistrer les résultats bruts au format JSON
            const jsonReport = {
                summary: {
                    total: this.results.length,
                    pass: this.results.filter(r => r.status === 'pass').length,
                    warning: this.results.filter(r => r.status === 'warning').length,
                    fail: this.results.filter(r => r.status === 'fail').length,
                    averageScore: Math.round(
                        this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length
                    ),
                    hasBlockingIssues: this.blockerFound
                },
                results: this.results,
                timestamp: new Date().toISOString(),
                config: this.config
            };

            const jsonReportPath = path.join(this.config.reportPath, 'seo-report.json');
            await fs.writeJSON(jsonReportPath, jsonReport, { spaces: 2 });

            // Générer un rapport HTML plus lisible
            await createReport(
                jsonReport,
                path.join(this.config.reportPath, 'html'),
                'Rapport d\'analyse SEO'
            );

            console.log(`📄 Rapport enregistré dans ${this.config.reportPath}`);
        } catch (error) {
            console.error(`Erreur lors de la génération du rapport: ${error.message}`);
        }
    }
}

/**
 * Point d'entrée pour l'utilisation en ligne de commande
 */
if (require.main === module) {
    const yargs = require('yargs/yargs');
    const { hideBin } = require('yargs/helpers');

    const argv = yargs(hideBin(process.argv))
        .option('config', {
            alias: 'c',
            description: 'Chemin vers le fichier de configuration',
            type: 'string'
        })
        .option('url', {
            alias: 'u',
            description: 'URL ou chemins à vérifier',
            type: 'array'
        })
        .option('base-url', {
            alias: 'b',
            description: 'URL de base pour les chemins relatifs',
            type: 'string'
        })
        .option('report-path', {
            alias: 'r',
            description: 'Chemin où enregistrer le rapport',
            type: 'string'
        })
        .help()
        .alias('help', 'h')
        .argv;

    // Instancier et exécuter l'agent
    const agent = new SeoCheckerAgent(argv.config);

    // Mettre à jour la configuration si des options sont fournies
    if (argv.baseUrl) {
        agent.config.baseUrl = argv.baseUrl;
    }

    if (argv.reportPath) {
        agent.config.reportPath = argv.reportPath;
    }

    agent.run(argv.url)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error(`Erreur fatale: ${error.message}`);
            process.exit(1);
        });
}

export { SeoCheckerAgent, SeoCheckConfig, SeoCheckResult, SeoIssue };
