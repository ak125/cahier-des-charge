/**
 * Script de validation des métadonnées SEO
 * 
 * Ce script analyse les fichiers de métadonnées SEO et valide leur conformité
 * avec les standards de référencement.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SeoMetaGenerator, BaseMetadataSchema, ArticleMetadataSchema, ProductMetadataSchema, FaqMetadataSchema, PageType } from '../seo-meta-generator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), 'seo-validation');
const DEFAULT_SITE_NAME = 'Mon Site';
const DEFAULT_LOCALE = 'fr_FR';
const DEFAULT_IMAGE = 'https://example.com/default-image.jpg';
const BASE_URL = 'https://example.com';

interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    path?: string;
}

interface ValidationReport {
    timestamp: string;
    totalFiles: number;
    validFiles: number;
    invalidFiles: number;
    results: Record<string, ValidationResult>;
}

/**
 * Fonction principale
 */
async function main() {
    console.log('🔍 Démarrage de la validation des métadonnées SEO...');

    try {
        // Créer le répertoire de sortie s'il n'existe pas
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Instancier le générateur de métadonnées SEO
        const seoGenerator = new SeoMetaGenerator({
            defaultSiteName: DEFAULT_SITE_NAME,
            defaultLocale: DEFAULT_LOCALE,
            defaultImage: DEFAULT_IMAGE,
            baseUrl: BASE_URL,
            outputDir: OUTPUT_DIR,
        });

        // Simuler la validation de différents types de pages
        const report: ValidationReport = {
            timestamp: new Date().toISOString(),
            totalFiles: 0,
            validFiles: 0,
            invalidFiles: 0,
            results: {}
        };

        // Exemples de pages à valider
        const pagesToValidate = [
            {
                path: '/accueil',
                type: PageType.HOMEPAGE,
                metadata: {
                    title: 'Accueil - Mon Site',
                    description: 'Bienvenue sur Mon Site, la plateforme de référence pour tous vos besoins de développement web et de référencement.',
                    url: `${BASE_URL}/accueil`,
                    type: 'website',
                    siteName: DEFAULT_SITE_NAME,
                    locale: DEFAULT_LOCALE,
                }
            },
            {
                path: '/blog/optimisation-seo',
                type: PageType.ARTICLE,
                metadata: {
                    title: 'Comment optimiser votre SEO en 2025',
                    description: 'Découvrez les meilleures pratiques SEO pour améliorer votre classement dans les moteurs de recherche en 2025, avec des conseils d'experts.',
          url: `${BASE_URL}/blog/optimisation-seo`,
                type: 'article',
                siteName: DEFAULT_SITE_NAME,
                publishedTime: '2025-04-15T10:00:00Z',
                modifiedTime: '2025-04-20T14:30:00Z',
                authors: ['Jane Doe', 'John Smith'],
                tags: ['SEO', 'Référencement', 'Google', 'Marketing Digital'],
            }
      },
    {
        path: '/produits/seo-toolkit',
            type: PageType.PRODUCT,
                metadata: {
            title: 'SEO Toolkit Premium - Optimisez votre référencement',
                description: 'Notre SEO Toolkit Premium vous offre tous les outils nécessaires pour améliorer votre référencement et augmenter votre visibilité en ligne.',
                    url: `${BASE_URL}/produits/seo-toolkit`,
                        type: 'product',
                            price: 99.99,
                                currency: 'EUR',
                                    availability: 'InStock',
                                        sku: 'SEO-TK-2025',
                                            brand: 'SEO Pro Tools',
                                                image: `${BASE_URL}/images/products/seo-toolkit.jpg`,
                                                    reviewCount: 127,
                                                        ratingValue: 4.7,
        }
    },
    {
        path: '/aide/faq',
            type: PageType.FAQ,
                metadata: {
            title: 'Questions fréquemment posées - Mon Site',
                description: 'Trouvez des réponses aux questions les plus fréquemment posées sur nos services, notre plateforme et nos outils de référencement.',
                    url: `${BASE_URL}/aide/faq`,
                        type: 'website',
                            faqItems: [
                                {
                                    question: 'Comment améliorer mon SEO rapidement ?',
                                    answer: 'Pour améliorer rapidement votre SEO, concentrez-vous sur l\'optimisation de vos balises méta, la création de contenu de qualité et l\'obtention de backlinks pertinents.',
                                },
                                {
                                    question: 'Quelle est l\'importance du JSON-LD pour le SEO ?',
                                    answer: 'Le JSON-LD aide les moteurs de recherche à mieux comprendre le contenu de votre page, ce qui peut conduire à des résultats enrichis dans les pages de résultats et améliorer votre CTR.',
                                },
                                {
                                    question: 'Comment migrer un site PHP vers une architecture moderne sans perdre mon référencement ?',
                                    answer: 'Utilisez notre outil de validation des redirections pour vous assurer que toutes vos anciennes URLs redirigent correctement vers les nouvelles, et conservez vos métadonnées SEO pendant la migration.',
                                }
                            ],
        }
    },
    // Exemple de page avec des erreurs de validation
    {
        path: '/page-avec-erreurs',
            type: PageType.GENERIC,
                metadata: {
            title: 'Ti', // Titre trop court (moins de 5 caractères)
                description: 'Description trop courte', // Description trop courte (moins de 50 caractères)
                    url: 'invalid-url', // URL invalide
                        type: 'website',
        }
    }
    ];

    // Validation des pages
    for (const page of pagesToValidate) {
        report.totalFiles++;

        try {
            // Valider les métadonnées en fonction du type de page
            let validatedMetadata;
            let isValid = true;
            const errors: string[] = [];
            const warnings: string[] = [];

            try {
                switch (page.type) {
                    case PageType.ARTICLE:
                    case PageType.BLOG:
                        validatedMetadata = ArticleMetadataSchema.parse(page.metadata);
                        break;

                    case PageType.PRODUCT:
                        validatedMetadata = ProductMetadataSchema.parse(page.metadata);
                        break;

                    case PageType.FAQ:
                        validatedMetadata = FaqMetadataSchema.parse(page.metadata);
                        break;

                    default:
                        validatedMetadata = BaseMetadataSchema.parse(page.metadata);
                }

                // Génération des métadonnées pour la page
                const { openGraph, jsonLd } = await seoGenerator.generateForRoute(page.path, validatedMetadata, page.type);

                // Écriture des métadonnées validées dans un fichier
                const pagePath = page.path.replace(/^\/?/, '').replace(/\/$/, '');
                const outputPath = path.join(OUTPUT_DIR, pagePath);
                await fs.mkdir(outputPath, { recursive: true });

                await fs.writeFile(
                    path.join(outputPath, 'meta.json'),
                    JSON.stringify({ openGraph, jsonLd }, null, 2)
                );

                // Vérifications supplémentaires spécifiques au SEO

                // 1. Vérification de la longueur du titre pour les moteurs de recherche
                if (page.metadata.title && page.metadata.title.length > 60) {
                    warnings.push(`Le titre est trop long (${page.metadata.title.length} caractères). Il devrait être limité à 60 caractères pour un affichage optimal dans les SERP.`);
                }

                // 2. Vérification de la présence de mots-clés dans le titre et la description
                if (page.path.includes('seo') || page.path.includes('référencement')) {
                    if (page.metadata.title && !page.metadata.title.toLowerCase().includes('seo') && !page.metadata.title.toLowerCase().includes('référencement')) {
                        warnings.push('Le titre ne contient pas le mot-clé principal (SEO/référencement) alors que l\'URL le suggère.');
                    }

                    if (page.metadata.description && !page.metadata.description.toLowerCase().includes('seo') && !page.metadata.description.toLowerCase().includes('référencement')) {
                        warnings.push('La description ne contient pas le mot-clé principal (SEO/référencement) alors que l\'URL le suggère.');
                    }
                }

                // 3. Vérification des OpenGraph tags spécifiques au type
                if (page.type === PageType.ARTICLE && (!openGraph['article:published_time'] || !openGraph['article:modified_time'])) {
                    warnings.push('Les balises article:published_time et article:modified_time sont recommandées pour les articles.');
                }

                report.validFiles++;
            } catch (error) {
                isValid = false;
                errors.push(`Erreur de validation: ${error.message}`);
                report.invalidFiles++;
            }

            // Ajouter le résultat au rapport
            report.results[page.path] = {
                valid: isValid,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                path: page.path
            };

        } catch (error) {
            console.error(`Erreur lors de la validation de ${page.path}:`, error);
            report.invalidFiles++;
            report.results[page.path] = {
                valid: false,
                errors: [`Erreur: ${error.message}`],
                path: page.path
            };
        }
    }

    // Génération du rapport HTML
    await generateHtmlReport(report);

    // Génération du rapport JSON
    const reportPath = path.join(OUTPUT_DIR, 'seo-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Validation SEO terminée! Rapport disponible dans ${reportPath}`);
    console.log(`📊 Résumé: ${report.validFiles}/${report.totalFiles} pages valides`);

} catch (error) {
    console.error('❌ Erreur lors de la validation SEO:', error);
    process.exit(1);
}
}

/**
 * Génère un rapport HTML pour les résultats de validation
 */
async function generateHtmlReport(report: ValidationReport): Promise<void> {
    const reportPath = path.join(OUTPUT_DIR, 'seo-validation-report.html');

    const getStatusBadge = (result: ValidationResult): string => {
        if (result.valid && !result.warnings?.length) {
            return '<span class="badge success">Succès</span>';
        } else if (result.valid && result.warnings?.length) {
            return '<span class="badge warning">Avertissements</span>';
        } else {
            return '<span class="badge error">Échec</span>';
        }
    };

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de validation SEO</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #2c3e50; }
    .summary { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .success { background-color: #d4edda; color: #155724; }
    .error { background-color: #f8d7da; color: #721c24; }
    .warning { background-color: #fff3cd; color: #856404; }
    .details { margin-top: 5px; font-size: 14px; color: #666; }
    .issues { margin-top: 10px; padding-left: 20px; }
    .issue-item { margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>Rapport de validation SEO</h1>
  <div class="summary">
    <p><strong>Date :</strong> ${report.timestamp}</p>
    <p><strong>Total des pages :</strong> ${report.totalFiles}</p>
    <p><strong>Pages valides :</strong> ${report.validFiles} (${Math.round(report.validFiles / report.totalFiles * 100)}%)</p>
    <p><strong>Pages invalides :</strong> ${report.invalidFiles} (${Math.round(report.invalidFiles / report.totalFiles * 100)}%)</p>
  </div>

  <h2>Résultats détaillés</h2>
  <table>
    <thead>
      <tr>
        <th>Page</th>
        <th>Statut</th>
        <th>Détails</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(report.results).map(([path, result]) => `
        <tr>
          <td>${path}</td>
          <td>${getStatusBadge(result)}</td>
          <td>
            ${result.errors || result.warnings ? `
              <div class="details">
                ${result.errors?.length ? `
                  <div>
                    <strong>Erreurs :</strong>
                    <ul class="issues">
                      ${result.errors.map(error => `<li class="issue-item">${error}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${result.warnings?.length ? `
                  <div>
                    <strong>Avertissements :</strong>
                    <ul class="issues">
                      ${result.warnings.map(warning => `<li class="issue-item">${warning}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            ` : 'OK'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recommandations générales</h2>
  <ul>
    <li>Assurez-vous que vos titres contiennent entre 50 et 60 caractères pour un affichage optimal.</li>
    <li>Les méta descriptions doivent contenir entre 150 et 160 caractères.</li>
    <li>Incluez vos mots-clés principaux dans les titres et descriptions.</li>
    <li>Pour les articles, ajoutez toujours les dates de publication et de modification.</li>
    <li>Pour les produits, renseignez toujours le prix, la devise et la disponibilité.</li>
    <li>Pour les pages FAQ, structurez vos questions et réponses avec JSON-LD.</li>
  </ul>
</body>
</html>`;

    await fs.writeFile(reportPath, html);
    console.log(`📄 Rapport HTML généré : ${reportPath}`);
}

// Exécution
main().catch(error => {
    console.error('Erreur lors de l\'exécution du script de validation SEO:', error);
    process.exit(1);
});