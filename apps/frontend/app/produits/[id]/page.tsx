/**
 * Page de produit avec SEO automatisé
 */

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSEO from '../../../../../packages/seo-tools/src/hooks/useSEO';
import SEOHead from '../../../../../packages/seo-tools/src/components/SEOHead';

// Simulation de données produit
const getProductById = (id: string) => {
    // Dans une application réelle, ceci proviendrait d'une API ou d'une base de données
    const products = {
        '1': {
            id: '1',
            name: 'Chaise ergonomique professionnelle',
            description: 'Chaise ergonomique haut de gamme pour bureau, avec soutien lombaire et réglable en hauteur.',
            price: 299.99,
            image: '/images/products/chaise-ergonomique.jpg',
            category: 'mobilier-bureau'
        },
        '2': {
            id: '2',
            name: 'Bureau ajustable électrique',
            description: 'Bureau ajustable électriquement en hauteur, parfait pour alterner entre position assise et debout.',
            price: 499.99,
            image: '/images/products/bureau-ajustable.jpg',
            category: 'mobilier-bureau'
        }
    };

    return products[id as keyof typeof products];
};

export default function ProductPage() {
    // Obtenir l'ID du produit depuis l'URL
    const params = useParams();
    const productId = params?.id as string;

    // Récupérer les données du produit
    const product = getProductById(productId);

    // Utiliser notre hook SEO personnalisé
    const { seoData } = useSEO({
        fallbackTitle: product ? `${product.name} | Notre Boutique` : 'Produit | Notre Boutique',
        fallbackDescription: product ? product.description : 'Découvrez nos produits de qualité'
    });

    // Si le produit n'existe pas, afficher une page 404
    if (!product) {
        return (
            <>
                <SEOHead
                    title="Produit introuvable | Notre Boutique"
                    description="Le produit que vous recherchez n'existe pas."
                    noindex={true}
                />
                <div className="container mx-auto px-4 py-20">
                    <h1 className="text-3xl font-bold mb-6">Produit introuvable</h1>
                    <p>Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
                </div>
            </>
        );
    }

    // Construire le JSON-LD pour le produit
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}${product.image}`,
        sku: `PROD-${product.id}`,
        mpn: `MPN-${product.id}`,
        brand: {
            '@type': 'Brand',
            name: 'Notre Marque'
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: product.price,
            availability: 'https://schema.org/InStock',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/produits/${product.id}`,
            seller: {
                '@type': 'Organization',
                name: 'Notre Boutique'
            }
        }
    };

    return (
        <>
            {/* Utiliser les métadonnées SEO générées automatiquement ou les données spécifiques au produit */}
            <SEOHead
                title={seoData?.title || `${product.name} | Notre Boutique`}
                description={seoData?.description || product.description}
                ogImage={product.image}
                ogType="product"
                canonicalUrl={`/produits/${product.id}`}
                keywords={seoData?.keywords || [product.category, 'mobilier', 'bureau', 'ergonomique']}
                jsonLd={seoData?.jsonLd || [productJsonLd]}
            />

            <main className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image du produit */}
                    <div className="rounded-lg overflow-hidden shadow-lg">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {/* Informations du produit */}
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                        <p className="text-gray-700 mb-6">{product.description}</p>
                        <p className="text-2xl font-bold text-blue-600 mb-6">{product.price.toFixed(2)} €</p>

                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Ajouter au panier
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}