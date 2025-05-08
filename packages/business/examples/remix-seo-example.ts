/**
 * Exemple d'intégration des métadonnées SEO dans une application Remix
 * 
 * Ce fichier montre comment utiliser le système de métadonnées SEO
 * automatisé dans différents scénarios courants.
 */

// Imports (à adapter selon votre structure de projet)
import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createRemixSeoIntegrator } from '../packages/shared/seo/remix-seo-integration';

// Créer l'intégrateur SEO (à faire une seule fois dans votre application)
const seoIntegrator = createRemixSeoIntegrator({
    baseUrl: 'https://www.example.com',
    siteName: 'Mon Site E-commerce',
    rootDir: process.cwd(),
});

/**
 * Exemple 1: Route produit avec métadonnées automatiques
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
    // Récupérer les données du produit depuis votre API ou base de données
    const product = await fetchProduct(params.productId);

    // Données de base que vous retourneriez normalement
    const loaderData = {
        product,
        relatedProducts: await fetchRelatedProducts(product.id),
    };

    // Enrichir les données avec les métadonnées SEO
    return json(await seoIntegrator.enhanceLoader(
        request.url,
        {
            ...loaderData,
            title: `${product.name} | Mon Site E-commerce`,
            description: product.shortDescription,
            image: product.mainImage,
        }
    ));
}

// Fonction meta pour Remix qui utilise les métadonnées générées
export const meta: MetaFunction = ({ data }) => {
    // data.seo contient les métadonnées générées par l'intégrateur
    if (!data || !data.seo) {
        return [
            { title: 'Produit | Mon Site E-commerce' },
            { name: 'description', content: 'Description de secours' },
        ];
    }

    // Retourner les métadonnées de base (title, description)
    // Les autres (OpenGraph, JSON-LD) seront injectées automatiquement
    return [
        { title: data.title || 'Produit | Mon Site E-commerce' },
        { name: 'description', content: data.description || 'Description de secours' },
    ];
};

// Exemple de composant de page
export default function ProductPage() {
    const { product, relatedProducts, seo } = useLoaderData<typeof loader>();

    return (
        <div>
        {/* Insérer les métas OpenGraph et JSON-LD */ }
        < div dangerouslySetInnerHTML = {{ __html: seo.toHtml() }
} />

    < h1 > { product.name } </h1>
    < p > { product.shortDescription } </p>
{/* Reste du contenu de la page */ }
</div>
  );
}

/**
 * Exemple 2: Page générée dynamiquement par un agent MCP
 */
export async function loaderDynamicPage({ params, request }: LoaderFunctionArgs) {
    // URL de la page actuelle
    const url = new URL(request.url);
    const path = url.pathname;

    // Simulons un agent MCP qui génère du contenu dynamiquement
    const pageData = await generateDynamicPage(path);

    // Ajoutons des métadonnées SEO spécifiques pour cette page
    const seoMetadata = {
        title: pageData.title,
        description: pageData.summary,
        image: pageData.headerImage,
        // Pour une page FAQ, ajoutons des données structurées
        faqItems: pageData.questions?.map(q => ({
            question: q.title,
            answer: q.content,
        })),
    };

    // Générer les métadonnées
    const metadata = await seoIntegrator.generateMetadata(
        { route: path },
        pageData,
        seoMetadata
    );

    // Retourner les données avec les métadonnées
    return json({
        ...pageData,
        seo: {
            ...metadata,
            toHtml: () => `
        <!-- OpenGraph Tags -->
        ${Object.entries(metadata.openGraph)
                    .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
                    .join('\n')}
        
        <!-- JSON-LD -->
        <script type="application/ld+json">
          ${JSON.stringify(metadata.jsonLd, null, 2)}
        </script>
      `
        }
    });
}

/**
 * Exemple 3: Route avec extraction des métadonnées depuis PHP legacy
 */
export async function migratedPhpLoader({ params, request }: LoaderFunctionArgs) {
    const path = new URL(request.url).pathname;

    // Chemin original du fichier PHP
    const originalPhpPath = `public/${path.replace(/^\//, '')}.php`;

    // Extraire et générer les métadonnées depuis le fichier PHP
    const seoController = seoIntegrator.controller;
    const metadata = await seoController.extractFromPhp(originalPhpPath, path);

    // Charger les autres données nécessaires à la page
    const pageData = await fetchDataForMigratedPage(path);

    return json({
        ...pageData,
        seo: {
            ...metadata,
            toHtml: () => `
        <!-- OpenGraph Tags (Migrated from PHP) -->
        ${Object.entries(metadata.openGraph)
                    .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
                    .join('\n')}
        
        <!-- JSON-LD (Generated) -->
        <script type="application/ld+json">
          ${JSON.stringify(metadata.jsonLd, null, 2)}
        </script>
      `
        }
    });
}

// Fonctions fictives pour l'exemple
async function fetchProduct(id) { /* ... */ }
async function fetchRelatedProducts(id) { /* ... */ }
async function generateDynamicPage(path) { /* ... */ }
async function fetchDataForMigratedPage(path) { /* ... */ }