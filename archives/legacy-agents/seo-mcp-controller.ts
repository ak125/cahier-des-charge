/**
 * SEO MCP Controller
 * 
 * Agent de contrôle SEO intégré au protocole MCP pour la génération automatique
 * des métadonnées et la validation des critères SEO.
 */

import { SeoContentEnhancer } from './seo-content-enhancer';
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

export interface SEOMCPControllerOptions {
    /**
     * URL de base du site
     */
    baseUrl: string;

    /**
     * Nom du site
     */
    siteName: string;

    /**
     * Répertoire racine de l'application
     */
    rootDir: string;

    /**
     * Répertoire contenant les routes
     */
    routesDir?: string;

    /**
     * Répertoire contenant les sources PHP legacy
     */
    legacySourceDir?: string;

    /**
     * Répertoire de sortie pour les métadonnées générées
     */
    outputDir?: string;

    /**
     * Active le mode verbeux
     */
    verbose?: boolean;
}

export class SEOMCPController {
    private seoEnhancer: SeoContentEnhancer;
    private options: Required<SEOMCPControllerOptions>;

    /**
     * Constructeur de l'agent
     */
    constructor(options: SEOMCPControllerOptions) {
        this.options = {
            routesDir: path.join(options.rootDir, 'app/routes'),
            outputDir: path.join(options.rootDir, 'generated/seo'),
            legacySourceDir: '',
            verbose: false,
            ...options,
        };

        // Initialisation de l'enhancer SEO
        this.seoEnhancer = new SeoContentEnhancer({
            baseUrl: this.options.baseUrl,
            siteName: this.options.siteName,
            legacySourceDir: this.options.legacySourceDir,
            outputDir: this.options.outputDir,
            verbose: this.options.verbose,
        });
    }

    /**
     * Initialise l'agent et prépare les répertoires
     */
    async initialize(): Promise<void> {
        // Créer le répertoire de sortie s'il n'existe pas
        await fs.mkdir(this.options.outputDir, { recursive: true });

        if (this.options.verbose) {
            console.log(`🚀 Agent SEO MCP Controller initialisé`);
            console.log(`📁 Répertoire de sortie: ${this.options.outputDir}`);
        }
    }

    /**
     * Génère les métadonnées SEO pour toutes les routes existantes
     */
    async generateMetadataForAllRoutes(): Promise<void> {
        await this.seoEnhancer.batchGenerateMetaForDirectory(this.options.routesDir);
    }

    /**
     * Intercepte et modifie la réponse d'une route pour y injecter les métadonnées SEO
     * 
     * @param route Route demandée
     * @param responseData Données de réponse (HTML ou JSON)
     * @param context Contexte de la requête
     * @returns Réponse modifiée avec métadonnées SEO
     */
    async interceptRoute(
        route: string,
        responseData: string | object,
        context: Record<string, any> = {}
    ): Promise<string | object> {
        // Si la réponse est un objet JSON, nous ne modifions pas la réponse
        if (typeof responseData !== 'string' || !responseData.includes('<html')) {
            return responseData;
        }

        // Extraire les métadonnées du contexte
        const metadata = context.metadata || {};

        // Injecter les métadonnées SEO dans la réponse HTML
        return this.seoEnhancer.injectMetaIntoHtml(responseData, route, metadata);
    }

    /**
     * Génère des métadonnées pour une nouvelle route
     * 
     * @param route Chemin de la route
     * @param metadata Métadonnées partielles
     * @returns Métadonnées générées
     */
    async generateForRoute(
        route: string,
        metadata: Record<string, any> = {}
    ): Promise<{ openGraph: Record<string, string>; jsonLd: Record<string, any> }> {
        return this.seoEnhancer.generateMetaForRoute(route, metadata);
    }

    /**
     * Génère un rapport de conformité SEO pour l'ensemble des routes
     * 
     * @returns Rapport de conformité
     */
    async generateSeoComplianceReport(): Promise<Record<string, any>> {
        // Implémenter logique de génération de rapport à partir des meta générées
        const report = {
            generatedAt: new Date().toISOString(),
            totalRoutes: 0,
            compliantRoutes: 0,
            issues: [] as Array<{ route: string, issues: string[] }>,
        };

        // Analyser le répertoire de sortie
        try {
            const { glob } = await import('glob');
            const metaFiles = await glob('**/meta.json', { cwd: this.options.outputDir });

            report.totalRoutes = metaFiles.length;

            for (const metaFile of metaFiles) {
                const filePath = path.join(this.options.outputDir, metaFile);
                const meta = JSON.parse(await fs.readFile(filePath, 'utf-8'));

                const routeIssues: string[] = [];

                // Vérifier le titre
                if (!meta.openGraph['og:title'] || meta.openGraph['og:title'].length > 60) {
                    routeIssues.push('Titre trop long (> 60 caractères) ou manquant');
                }

                // Vérifier la description
                if (!meta.openGraph['og:description'] || meta.openGraph['og:description'].length > 160) {
                    routeIssues.push('Description trop longue (> 160 caractères) ou manquante');
                }

                // Vérifier l'image
                if (!meta.openGraph['og:image']) {
                    routeIssues.push('Image OpenGraph manquante');
                }

                // Vérifier JSON-LD
                if (!meta.jsonLd || !meta.jsonLd['@context']) {
                    routeIssues.push('JSON-LD invalide ou manquant');
                }

                if (routeIssues.length === 0) {
                    report.compliantRoutes++;
                } else {
                    report.issues.push({
                        route: metaFile.replace('/meta.json', ''),
                        issues: routeIssues,
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la génération du rapport SEO:', error);
        }

        return report;
    }

    /**
     * Pour les pages PHP legacy, extrait les métadonnées et génère un format compatible
     * 
     * @param phpPath Chemin du fichier PHP
     * @param targetRoute Route cible dans la nouvelle architecture
     * @returns Métadonnées extraites et améliorées
     */
    async extractFromPhp(
        phpPath: string,
        targetRoute: string
    ): Promise<{ openGraph: Record<string, string>; jsonLd: Record<string, any> }> {
        return this.seoEnhancer.extractAndGenerateFromPhp(phpPath, targetRoute);
    }
}

export default SEOMCPController;
