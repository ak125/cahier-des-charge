/**
 * SeoAnalyzerAgent
 * 
 * Agent spécialisé dans l'analyse et l'audit SEO. Cet agent vérifie la conformité des pages
 * aux bonnes pratiques SEO et génère des rapports détaillés avec recommandations.
 * 
 * @module agents/seo/seo-analyzer-agent
 * @category SEO
 * @subcategory Analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { URL } from 'url';
import { SeoAgentBase, SeoAgentOptions, SeoAnalysisResult } from './seo-agent-base';
import { createReport } from '../utils/reporting';

export interface SeoAnalyzerOptions extends SeoAgentOptions {
    /**
     * Seuils pour les différentes métriques SEO
     */
    thresholds?: {
        minTitleLength?: number;
        maxTitleLength?: number;
        minDescriptionLength?: number;
        maxDescriptionLength?: number;
        minH1Count?: number;
        maxH1Count?: number;
        maxHeadingDepth?: number;
        minContentWordCount?: number;
        maxImageWithoutAlt?: number;
    };

    /**
     * Règles SEO à vérifier
     */
    rules?: {
        requireCanonical?: boolean;
        requireRobotsMeta?: boolean;
        requireOgTags?: boolean;
        requireStructuredData?: boolean;
        requireSitemap?: boolean;
        checkBrokenLinks?: boolean;
        checkPerformance?: boolean;
        checkMobileCompatibility?: boolean;
    };

    /**
     * Problèmes qui bloqueront le pipeline CI
     */
    blockers?: string[];
}

interface SeoIssue {
    type: string;
    url: string;
    description: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    element?: string;
    recommendation?: string;
    isBlocker: boolean;
}

export class SeoAnalyzerAgent extends SeoAgentBase {
    private thresholds: Required<NonNullable<SeoAnalyzerOptions['thresholds']>>;
    private rules: Required<NonNullable<SeoAnalyzerOptions['rules']>>;
    private blockers: string[];
    private results: SeoAnalysisResult[] = [];
    private blockerFound = false;

    constructor(options: SeoAnalyzerOptions) {
        super(options);

        // Valeurs par défaut pour les seuils
        this.thresholds = {
            minTitleLength: 20,
            maxTitleLength: 70,
            minDescriptionLength: 80,
            maxDescriptionLength: 160,
            minH1Count: 1,
            maxH1Count: 1,
            maxHeadingDepth: 4,
            minContentWordCount: 300,
            maxImageWithoutAlt: 0,
            ...(options.thresholds || {})
        };

        // Valeurs par défaut pour les règles
        this.rules = {
            requireCanonical: true,
            requireRobotsMeta: true,
            requireOgTags: true,
            requireStructuredData: true,
            requireSitemap: true,
            checkBrokenLinks: true,
            checkPerformance: false,
            checkMobileCompatibility: true,
            ...(options.rules || {})
        };

        // Problèmes bloquants par défaut
        this.blockers = options.blockers || [
            'missing_title',
            'missing_description',
            'missing_h1',
            'multiple_h1',
            'missing_canonical',
            'no_alt_text',
            'broken_links'
        ];
    }

    /**
     * Exécute l'analyse SEO sur les URLs fournies ou détectées
     */
    public async execute(params?: { urls?: string[] }): Promise<SeoAnalysisResult[]> {
        this.logger.info('🔍 Démarrage de l\'analyse SEO...');

        // Déterminer les URLs à analyser
        let urlsToCheck = params?.urls || [];

        // Si aucune URL n'est fournie, tenter de détecter les URLs modifiées
        if (urlsToCheck.length === 0) {
            this.logger.info('Aucune URL fournie, tentative de détection des URLs modifiées...');
            try {
                urlsToCheck = await this.detectChangedUrls();
            } catch (error) {
                this.logger.error(`Échec de la détection des URLs: ${error.message}`);
                return [];
            }
        }

        if (urlsToCheck.length === 0) {
            this.logger.info('Aucune URL à vérifier, analyse terminée.');
            return [];
        }

        this.logger.info(`Analyse de ${urlsToCheck.length} URLs...`);

        // Réinitialiser les résultats
        this.results = [];
        this.blockerFound = false;

        // Vérifier chaque URL
        for (const url of urlsToCheck) {
            try {
                const fullUrl = this.ensureFullUrl(url);
                this.logger.info(`Vérification de ${fullUrl}...`);

                const result = await this.analyzeUrl(fullUrl);
                this.results.push(result);

                // Vérifier si un bloqueur a été trouvé
                if (result.issues?.some(issue =>
                    issue.severity === 'critical' ||
                    (this.blockers.includes(issue.type) && issue.severity === 'error')
                )) {
                    this.blockerFound = true;
                    this.logger.error(`⛔ Problème SEO bloquant trouvé sur ${fullUrl}`);
                }
            } catch (error) {
                this.logger.error(`Erreur lors de l'analyse de ${url}: ${error.message}`);

                // Ajouter un résultat d'erreur
                this.results.push({
                    url,
                    status: 'fail',
                    score: 0,
                    metadata: {},
                    issues: [{
                        type: 'check_error',
                        description: `Erreur lors de l'analyse: ${error.message}`,
                        severity: 'critical'
                    }]
                });

                this.blockerFound = true;
            }
        }

        // Générer le rapport
        await this.generateReport();

        const success = !this.blockerFound;
        this.logger.info(`✅ Analyse SEO terminée. Statut: ${success ? 'RÉUSSITE' : 'ÉCHEC'}`);

        return this.results;
    }

    /**
     * Détecte les URLs modifiées depuis le dernier commit
     */
    private async detectChangedUrls(): Promise<string[]> {
        try {
            // Vérifier si nous sommes dans un dépôt Git
            execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

            // Utiliser le script de détection si disponible
            const detectScriptPath = path.resolve(process.cwd(), 'scripts', 'ci', 'detect-affected-urls.js');

            if (await this.pathExists(detectScriptPath)) {
                this.logger.info('Utilisation du script de détection des URLs affectées...');

                const output = execSync(`node ${detectScriptPath} --format=json`).toString().trim();
                const urls = JSON.parse(output);

                this.logger.info(`${urls.length} URLs affectées détectées.`);
                return urls;
            }

            // Fallback: Analyser les fichiers modifiés pour trouver des patterns d'URL
            this.logger.info('Script de détection non trouvé, utilisation du fallback...');

            const changedFiles = execSync('git diff --name-only HEAD~1 HEAD').toString().split('\n').filter(Boolean);

            // Filtrer pour ne garder que les fichiers pertinents
            const routePatterns = [
                /src\/routes\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
                /src\/pages\/(.*?)\.(tsx|jsx|ts|js|mdx)$/,
                /src\/app\/(.+?)\/(?:page|route)\.(tsx|jsx|ts|js|mdx)$/
            ];

            const urls = new Set<string>();

            for (const file of changedFiles) {
                for (const pattern of routePatterns) {
                    const match = file.match(pattern);
                    if (match) {
                        let routePath = match[1];

                        // Normaliser le chemin de route en URL
                        routePath = routePath
                            .replace(/\[([^\]]+)\]/g, ':$1')
                            .replace(/\$[^/]+/g, ':id');

                        // Traiter les routes index
                        if (routePath === 'index' || routePath.endsWith('/index')) {
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
            this.logger.error(`Erreur lors de la détection des URLs: ${error.message}`);
            return ['/'];  // Retourner la page d'accueil par défaut
        }
    }

    /**
     * Analyse une URL pour les problèmes SEO
     */
    private async analyzeUrl(url: string): Promise<SeoAnalysisResult> {
        const issues: SeoIssue[] = [];
        const result: SeoAnalysisResult = {
            url,
            status: 'pass',
            score: 100,
            metadata: {
                title: '',
                description: '',
                canonical: '',
                image: '',
                keywords: [],
                ogTags: {},
                jsonLd: {},
                h1Count: 0,
                wordCount: 0,
                imageCount: 0,
                imagesWithoutAlt: 0,
                internalLinks: 0,
                externalLinks: 0,
                timestamp: new Date().toISOString()
            },
            issues: []
        };

        try {
            // Récupérer le contenu de la page
            const html = await this.fetchHtml(url);
            const root = parseHtml(html);

            // Extraire les métadonnées de base
            const metadata = this.extractMetadataFromHtml(html);
            Object.assign(result.metadata, metadata);

            // Vérifications SEO spécifiques
            this.checkTitle(root, url, issues, result.metadata);
            this.checkDescription(root, url, issues, result.metadata);
            this.checkH1(root, url, issues, result.metadata);
            this.checkHeadingDepth(root, url, issues);
            this.checkImages(root, url, issues, result.metadata);
            this.checkCanonical(root, url, issues, result.metadata);
            this.checkOpenGraph(root, url, issues);
            this.checkStructuredData(root, url, issues);
            this.checkLinksAndContent(root, url, issues, result.metadata);
            this.checkRobotsMeta(root, url, issues);

            // Calculer le score SEO
            result.score = this.calculateScore(issues);

            // Déterminer le statut global
            if (issues.some(issue => issue.severity === 'critical' || issue.isBlocker)) {
                result.status = 'fail';
            } else if (issues.some(issue => issue.severity === 'error')) {
                result.status = 'warning';
            }

            // Formater les problèmes pour le résultat final
            result.issues = issues.map(({ url, element, isBlocker, ...rest }) => rest);

        } catch (error) {
            this.logger.error(`Erreur lors de l'analyse de ${url}: ${error.message}`);
            result.status = 'fail';
            result.score = 0;
            result.issues = [{
                type: 'fetch_error',
                description: `Impossible d'accéder à l'URL: ${error.message}`,
                severity: 'critical'
            }];
        }

        return result;
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
                isBlocker: this.blockers.includes('missing_title')
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
                isBlocker: this.blockers.includes('missing_title')
            });
        } else if (title.length < this.thresholds.minTitleLength) {
            issues.push({
                type: 'short_title',
                url,
                description: `Le titre est trop court (${title.length} caractères, minimum recommandé: ${this.thresholds.minTitleLength})`,
                severity: 'error',
                element: title,
                recommendation: 'Allonger le titre pour le rendre plus descriptif',
                isBlocker: this.blockers.includes('short_title')
            });
        } else if (title.length > this.thresholds.maxTitleLength) {
            issues.push({
                type: 'long_title',
                url,
                description: `Le titre est trop long (${title.length} caractères, maximum recommandé: ${this.thresholds.maxTitleLength})`,
                severity: 'warning',
                element: title,
                recommendation: 'Raccourcir le titre pour éviter qu\'il soit tronqué dans les résultats de recherche',
                isBlocker: this.blockers.includes('long_title')
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
                isBlocker: this.blockers.includes('missing_description')
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
                isBlocker: this.blockers.includes('missing_description')
            });
        } else if (description.length < this.thresholds.minDescriptionLength) {
            issues.push({
                type: 'short_description',
                url,
                description: `La description est trop courte (${description.length} caractères, minimum recommandé: ${this.thresholds.minDescriptionLength})`,
                severity: 'warning',
                element: description,
                recommendation: 'Allonger la description pour la rendre plus informative',
                isBlocker: this.blockers.includes('short_description')
            });
        } else if (description.length > this.thresholds.maxDescriptionLength) {
            issues.push({
                type: 'long_description',
                url,
                description: `La description est trop longue (${description.length} caractères, maximum recommandé: ${this.thresholds.maxDescriptionLength})`,
                severity: 'warning',
                element: description,
                recommendation: 'Raccourcir la description pour éviter qu\'elle soit tronquée dans les résultats de recherche',
                isBlocker: this.blockers.includes('long_description')
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
                isBlocker: this.blockers.includes('missing_h1')
            });
        } else if (h1Count > this.thresholds.maxH1Count) {
            issues.push({
                type: 'multiple_h1',
                url,
                description: `La page contient ${h1Count} balises H1 (recommandation: ${this.thresholds.maxH1Count})`,
                severity: 'error',
                element: h1Elements.map(el => el.text.trim()).join(', '),
                recommendation: 'Garder une seule balise H1 principale et utiliser H2, H3, etc. pour les autres titres',
                isBlocker: this.blockers.includes('multiple_h1')
            });
        }
    }

    /**
     * Vérification de la profondeur des headings
     */
    private checkHeadingDepth(root: any, url: string, issues: SeoIssue[]): void {
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        const maxDepth = this.thresholds.maxHeadingDepth;

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
                    isBlocker: this.blockers.includes('deep_heading')
                });
            }
        }

        // Vérifier la hiérarchie des titres
        const headingLevels = headings.map(h => root.querySelectorAll(h).length);
        for (let i = 1; i < headingLevels.length; i++) {
            if (headingLevels[i] > 0 && headingLevels[i - 1] === 0) {
                issues.push({
                    type: 'heading_hierarchy',
                    url,
                    description: `La page utilise ${headings[i].toUpperCase()} sans ${headings[i - 1].toUpperCase()}, ce qui rompt la hiérarchie sémantique`,
                    severity: 'warning',
                    recommendation: 'Structurer les titres de manière hiérarchique (H1, puis H2, etc.)',
                    isBlocker: this.blockers.includes('heading_hierarchy')
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
                    isBlocker: this.blockers.includes('no_alt_text') && imagesWithoutAlt > this.thresholds.maxImageWithoutAlt
                });
            }
        }

        metadata.imagesWithoutAlt = imagesWithoutAlt;
    }

    /**
     * Vérification de la balise canonical
     */
    private checkCanonical(root: any, url: string, issues: SeoIssue[], metadata: any): void {
        if (!this.rules.requireCanonical) {
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
                isBlocker: this.blockers.includes('missing_canonical')
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
                isBlocker: this.blockers.includes('empty_canonical')
            });
        }
    }

    /**
     * Vérification des balises Open Graph
     */
    private checkOpenGraph(root: any, url: string, issues: SeoIssue[]): void {
        if (!this.rules.requireOgTags) {
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
                isBlocker: this.blockers.includes('missing_og_tags')
            });
        }
    }

    /**
     * Vérification des données structurées
     */
    private checkStructuredData(root: any, url: string, issues: SeoIssue[]): void {
        if (!this.rules.requireStructuredData) {
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
                isBlocker: this.blockers.includes('missing_structured_data')
            });
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

            if (words.length < this.thresholds.minContentWordCount) {
                issues.push({
                    type: 'low_word_count',
                    url,
                    description: `Contenu texte insuffisant (${words.length} mots, minimum recommandé: ${this.thresholds.minContentWordCount})`,
                    severity: 'warning',
                    recommendation: 'Enrichir le contenu textuel de la page pour une meilleure indexation',
                    isBlocker: this.blockers.includes('low_word_count')
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
                        isBlocker: this.blockers.includes('broken_links')
                    });
                }
            }

            metadata.internalLinks = internalLinks.length;
            metadata.externalLinks = externalLinks.length;

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
        if (!this.rules.requireRobotsMeta) {
            return;
        }

        const robotsMeta = root.querySelector('meta[name="robots"]');

        if (!robotsMeta) {
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
                isBlocker: this.blockers.includes('restrictive_robots')
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
        this.logger.info('📊 Génération du rapport SEO...');

        try {
            // S'assurer que le dossier de rapport existe
            await fs.ensureDir(this.options.outputDir);

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
                thresholds: this.thresholds,
                rules: this.rules
            };

            const jsonReportPath = path.join(this.options.outputDir, 'seo-analysis-report.json');
            await fs.writeJson(jsonReportPath, jsonReport, { spaces: 2 });

            // Générer un rapport HTML plus lisible si la fonction est disponible
            if (typeof createReport === 'function') {
                await createReport(
                    jsonReport,
                    path.join(this.options.outputDir, 'html'),
                    'Rapport d\'analyse SEO'
                );
            }

            this.logger.info(`📄 Rapport enregistré dans ${jsonReportPath}`);
        } catch (error) {
            this.logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
        }
    }
}

export default SeoAnalyzerAgent;