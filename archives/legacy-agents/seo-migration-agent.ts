/**
 * Agent de Migration SEO
 * 
 * Cet agent extrait et convertit les métadonnées SEO depuis des fichiers PHP legacy
 * vers le nouveau format compatible avec les standards modernes (JSON-LD, OpenGraph).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SeoContentEnhancer } from './seo-content-enhancer';
import { JSDOM } from 'jsdom';

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

export interface SeoMigrationAgentOptions {
    /**
     * Répertoire source contenant les fichiers PHP legacy
     */
    sourceDir: string;

    /**
     * Répertoire cible pour les métadonnées générées
     */
    outputDir: string;

    /**
     * URL de base du site
     */
    baseUrl: string;

    /**
     * Nom du site
     */
    siteName: string;

    /**
     * Structure de mapping entre les fichiers PHP et les routes cibles
     * Si non fourni, on utilisera une structure de répertoire similaire
     */
    routeMapping?: Record<string, string>;

    /**
     * Active le mode verbeux pour plus de détails
     */
    verbose?: boolean;
}

/**
 * Résultat de migration pour un fichier
 */
interface MigrationResult {
    /**
     * Chemin du fichier PHP source
     */
    sourcePath: string;

    /**
     * Route cible dans la nouvelle application
     */
    targetRoute: string;

    /**
     * Métadonnées extraites
     */
    metadata: {
        title?: string;
        description?: string;
        image?: string;
        canonical?: string;
        [key: string]: any;
    };

    /**
     * Métadonnées générées (OpenGraph, JSON-LD)
     */
    generatedMetadata?: {
        openGraph: Record<string, string>;
        jsonLd: Record<string, any>;
    };

    /**
     * Succès de l'opération
     */
    success: boolean;

    /**
     * Messages d'erreur le cas échéant
     */
    error?: string;
}

export class SeoMigrationAgent {
    private options: Required<SeoMigrationAgentOptions>;
    private seoEnhancer: SeoContentEnhancer;

    /**
     * Constructeur de l'agent de migration SEO
     */
    constructor(options: SeoMigrationAgentOptions) {
        this.options = {
            routeMapping: {},
            verbose: false,
            ...options,
        };

        this.seoEnhancer = new SeoContentEnhancer({
            baseUrl: this.options.baseUrl,
            siteName: this.options.siteName,
            legacySourceDir: this.options.sourceDir,
            outputDir: this.options.outputDir,
            verbose: this.options.verbose,
        });
    }

    /**
     * Extrait les métadonnées SEO d'un fichier PHP
     * 
     * @param filePath Chemin du fichier PHP
     * @returns Métadonnées extraites
     */
    async extractMetadataFromPhpFile(filePath: string): Promise<Record<string, any>> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const dom = new JSDOM(content);
            const { document } = dom.window;

            const metadata: Record<string, any> = {};

            // Extraire le titre
            const titleEl = document.querySelector('title');
            if (titleEl) {
                metadata.title = titleEl.textContent;
            }

            // Extraire la description
            const descEl = document.querySelector('meta[name="description"]');
            if (descEl) {
                metadata.description = descEl.getAttribute('content');
            }

            // Extraire les balises OpenGraph
            const ogTitleEl = document.querySelector('meta[property="og:title"]');
            if (ogTitleEl) {
                metadata.ogTitle = ogTitleEl.getAttribute('content');
            }

            const ogDescEl = document.querySelector('meta[property="og:description"]');
            if (ogDescEl) {
                metadata.ogDescription = ogDescEl.getAttribute('content');
            }

            const ogImageEl = document.querySelector('meta[property="og:image"]');
            if (ogImageEl) {
                metadata.image = ogImageEl.getAttribute('content');
            }

            const ogUrlEl = document.querySelector('meta[property="og:url"]');
            if (ogUrlEl) {
                metadata.ogUrl = ogUrlEl.getAttribute('content');
            }

            // Extraire l'URL canonique
            const canonicalEl = document.querySelector('link[rel="canonical"]');
            if (canonicalEl) {
                metadata.canonical = canonicalEl.getAttribute('href');
            }

            // Extraire les mots-clés
            const keywordsEl = document.querySelector('meta[name="keywords"]');
            if (keywordsEl) {
                metadata.keywords = keywordsEl.getAttribute('content');
            }

            return metadata;
        } catch (error) {
            console.error(`Erreur lors de l'extraction des métadonnées depuis ${filePath}:`, error);
            return {};
        }
    }

    /**
     * Convertit un chemin de fichier PHP en route cible
     * 
     * @param phpPath Chemin du fichier PHP
     * @returns Route cible
     */
    private phpPathToRoute(phpPath: string): string {
        // Vérifier si un mapping explicite existe
        const relativePath = path.relative(this.options.sourceDir, phpPath);
        const mappedRoute = this.options.routeMapping[relativePath];
        if (mappedRoute) {
            return mappedRoute;
        }

        // Sinon, déduire la route
        return '/' + relativePath
            .replace(/\.php$/, '')
            .replace(/index$/, '')
            .replace(/\\/g, '/');
    }

    /**
     * Migre un fichier PHP
     * 
     * @param phpPath Chemin du fichier PHP
     * @returns Résultat de la migration
     */
    async migratePhpFile(phpPath: string): Promise<MigrationResult> {
        try {
            const fullPath = path.resolve(this.options.sourceDir, phpPath);

            // Vérifier si le fichier existe
            if (!await pathExists(fullPath)) {
                return {
                    sourcePath: phpPath,
                    targetRoute: '',
                    metadata: {},
                    success: false,
                    error: `Fichier non trouvé: ${fullPath}`,
                };
            }

            // Déterminer la route cible
            const targetRoute = this.phpPathToRoute(fullPath);

            // Extraire les métadonnées
            const extractedMeta = await this.extractMetadataFromPhpFile(fullPath);

            // Générer les métadonnées SEO
            const generatedMetadata = await this.seoEnhancer.extractAndGenerateFromPhp(
                phpPath,
                targetRoute
            );

            if (this.options.verbose) {
                console.log(`✅ Métadonnées migrées pour ${phpPath} -> ${targetRoute}`);
            }

            return {
                sourcePath: phpPath,
                targetRoute,
                metadata: extractedMeta,
                generatedMetadata,
                success: true,
            };
        } catch (error) {
            console.error(`Erreur lors de la migration de ${phpPath}:`, error);
            return {
                sourcePath: phpPath,
                targetRoute: '',
                metadata: {},
                success: false,
                error: `Erreur: ${error}`,
            };
        }
    }

    /**
     * Migre tous les fichiers PHP d'un répertoire
     * 
     * @param pattern Motif glob pour sélectionner les fichiers (par défaut: tous les .php)
     * @returns Résultats de la migration
     */
    async migrateDirectory(pattern: string = '**/*.php'): Promise<MigrationResult[]> {
        const results: MigrationResult[] = [];

        try {
            const { glob } = await import('glob');
            const files = await glob(pattern, { cwd: this.options.sourceDir });

            if (this.options.verbose) {
                console.log(`🔍 Migration de ${files.length} fichiers PHP...`);
            }

            for (const file of files) {
                results.push(await this.migratePhpFile(file));
            }

            // Écrire un rapport de migration
            const successCount = results.filter(r => r.success).length;
            const report = {
                timestamp: new Date().toISOString(),
                totalFiles: files.length,
                success: successCount,
                failed: files.length - successCount,
                results,
            };

            await fs.mkdir(this.options.outputDir, { recursive: true });
            await fs.writeFile(
                path.join(this.options.outputDir, 'migration-report.json'),
                JSON.stringify(report, null, 2)
            );

            if (this.options.verbose) {
                console.log(`📊 Migration terminée: ${successCount}/${files.length} fichiers migrés avec succès`);
            }

            return results;
        } catch (error) {
            console.error('Erreur lors de la migration:', error);
            return results;
        }
    }

    /**
     * Génère un blueprint Remix pour une route avec ses métadonnées SEO
     * 
     * @param route Route cible
     * @param metadata Métadonnées SEO
     * @returns Code source du composant Remix
     */
    generateRemixComponent(route: string, metadata: MigrationResult['generatedMetadata']): string {
        if (!metadata) {
            return '';
        }

        const routeName = route.split('/').pop() || 'Page';
        const capitalized = routeName.charAt(0).toUpperCase() + routeName.slice(1);

        return `/**
 * Route Remix générée automatiquement avec métadonnées SEO
 * Route: ${route}
 */

import { json } from '@remix-run/node';
import { useLoaderData, MetaFunction } from '@remix-run/react';

/**
 * Fonction loader pour charger les données
 */
export async function loader() {
  // TODO: Implémenter le chargement des données
  
  return json({
    // Données de la page
    pageData: {
      title: '${(metadata.openGraph['og:title'] || '').replace(/'/g, "\\'")}',
      description: '${(metadata.openGraph['og:description'] || '').replace(/'/g, "\\'")}',
    },
    // Métadonnées SEO
    seo: ${JSON.stringify(metadata, null, 2)},
  });
}

/**
 * Fonction meta pour définir les métadonnées de la page
 */
export const meta: MetaFunction = ({ data }) => {
  if (!data) {
    return [
      { title: '${capitalized}' },
      { name: 'description', content: 'Description par défaut' },
    ];
  }
  
  return [
    { title: data.pageData.title },
    { name: 'description', content: data.pageData.description },
    // Les balises OpenGraph et JSON-LD seront injectées par le composant SeoMetaTags
  ];
};

/**
 * Composant pour les balises SEO
 */
function SeoMetaTags({ seo }) {
  if (!seo) return null;
  
  return (
    <>
      {/* OpenGraph Tags */}
      {Object.entries(seo.openGraph).map(([key, value]) => (
        <meta key={key} property={key} content={value} />
      ))}
      
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />
    </>
  );
}

/**
 * Composant de page
 */
export default function ${capitalized}Page() {
  const { pageData, seo } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <SeoMetaTags seo={seo} />
      
      <h1>{pageData.title}</h1>
      <p>{pageData.description}</p>
      
      {/* Contenu de la page */}
    </div>
  );
}`;
    }
}

export default SeoMigrationAgent;