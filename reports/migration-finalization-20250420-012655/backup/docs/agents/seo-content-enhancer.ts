/**
 * SEO Content Enhancer Agent
 * 
 * Agent qui analyse et enrichit le contenu des pages
 * pour améliorer leur référencement naturel
 */

import { MCPAgent, AgentContext, AgentConfig } from '../packagesDoDotmcp-core';
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { JSDOM } from 'jsdom';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


interface EnhancerTarget {
  route: string;
  filePath: string;
  type: 'product' | 'category' | 'article' | 'generic';
}

interface ContentSuggestion {
  type: 'faq' | 'related' | 'schema' | 'keywords' | 'headings';
  content: string;
  targetFile: string;
  position?: 'top' | 'bottom' | 'replace' | 'after-intro';
  selector?: string;
  priority: number;
}

interface SEOContentEnhancerConfig extends AgentConfig {
  remixDir: string;
  outputDir: string;
  applyChanges: boolean;
  targetContentTypes: ('product' | 'category' | 'article' | 'generic')[];
  enhancementFeatures: {
    generateFAQ: boolean;
    improveHeadings: boolean;
    addStructuredData: boolean;
    suggestRelatedContent: boolean;
    optimizeKeywords: boolean;
  };
}

export class SEOContentEnhancer implements BaseAgent, BusinessAgent, MCPAgent<SEOContentEnhancerConfig> {
  id = 'seo-content-enhancer';
  name = 'SEO Content Enhancer';
  description = 'Enrichit le contenu des pages pour améliorer leur référencement';
  version = '1.0.0';
  
  constructor(private config: SEOContentEnhancerConfig, private context: AgentContext) {}
  
  async initialize(): Promise<void> {
    this.context.logger.info('Initialisation du SEO Content Enhancer');
    await fs.ensureDir(this.config.outputDir);
  }
  
  async run(): Promise<void> {
    this.context.logger.info('Démarrage de l\'analyse et de l\'enrichissement du contenu');
    
    // Identifier les cibles d'enrichissement
    const targets = await this.identifyTargets();
    this.context.logger.info(`${targets.length} cibles d'enrichissement identifiées`);
    
    // Enrichir chaque cible
    for (const target of targets) {
      await this.processTarget(target);
    }
  }
  
  /**
   * Identifie les cibles d'enrichissement en fonction de la configuration
   */
  private async identifyTargets(): Promise<EnhancerTarget[]> {
    const targets: EnhancerTarget[] = [];
    const routesDir = path.join(this.config.remixDir, 'app/routes');
    
    // Fonction pour déterminer le type de contenu
    const getContentType = (filePath: string): 'product' | 'category' | 'article' | 'generic' => {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (content.includes('product') || content.includes('produit') || 
          filePath.includes('product') || filePath.includes('produit') || 
          filePath.includes('fiche')) {
        return 'product';
      }
      
      if (content.includes('category') || content.includes('categorie') || 
          filePath.includes('category') || filePath.includes('categorie')) {
        return 'category';
      }
      
      if (content.includes('article') || content.includes('blog') || 
          filePath.includes('article') || filePath.includes('blog') || 
          filePath.includes('post')) {
        return 'article';
      }
      
      return 'generic';
    };
    
    // Chercher les fichiers de routes
    const routeFiles = glob.sync(path.join(routesDir, '**/*.{tsx,jsx}'), {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/._*']
    });
    
    for (const filePath of routeFiles) {
      const relativePath = path.relative(routesDir, filePath);
      
      // Convertir le chemin du fichier en route
      const route = '/' + relativePath
        .replace(/\.(tsx|jsx)$/, '')
        .replace(/\$/g, ':')
        .replace(/\.index$/, '')
        .replace(/index$/, '')
        .replace(/\._/g, '/');
        
      const contentType = getContentType(filePath);
      
      // Ajouter la cible si le type de contenu est dans la configuration
      if (this.config.targetContentTypes.includes(contentType)) {
        targets.push({
          route,
          filePath,
          type: contentType
        });
      }
    }
    
    return targets;

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }
  }
  
  /**
   * Traite une cible pour l'enrichissement de contenu
   */
  private async processTarget(target: EnhancerTarget): Promise<void> {
    this.context.logger.info(`Traitement de ${target.route} (${target.type})`);
    
    const contentSuggestions: ContentSuggestion[] = [];
    const { enhancementFeatures } = this.config;
    
    // Analyser le contenu existant
    const content = await fs.readFile(target.filePath, 'utf-8');
    
    // Générer des FAQ
    if (enhancementFeatures.generateFAQ) {
      const faqSuggestion = await this.generateFAQContent(target, content);
      if (faqSuggestion) {
        contentSuggestions.push(faqSuggestion);
      }
    }
    
    // Améliorer les titres (headings)
    if (enhancementFeatures.improveHeadings) {
      const headingSuggestions = await this.improveHeadings(target, content);
      contentSuggestions.push(...headingSuggestions);
    }
    
    // Ajouter des données structurées
    if (enhancementFeatures.addStructuredData) {
      const structuredDataSuggestion = await this.generateStructuredData(target, content);
      if (structuredDataSuggestion) {
        contentSuggestions.push(structuredDataSuggestion);
      }
    }
    
    // Suggérer du contenu associé
    if (enhancementFeatures.suggestRelatedContent) {
      const relatedContentSuggestion = await this.generateRelatedContent(target, content);
      if (relatedContentSuggestion) {
        contentSuggestions.push(relatedContentSuggestion);
      }
    }
    
    // Optimiser les mots-clés
    if (enhancementFeatures.optimizeKeywords) {
      const keywordsSuggestion = await this.optimizeKeywords(target, content);
      if (keywordsSuggestion) {
        contentSuggestions.push(keywordsSuggestion);
      }
    }
    
    // Appliquer les suggestions ou les sauvegarder
    await this.applySuggestions(target, contentSuggestions);
  }
  
  /**
   * Génère une section FAQ pour améliorer le SEO
   */
  private async generateFAQContent(target: EnhancerTarget, content: string): Promise<ContentSuggestion | null> {
    try {
      // Extraire les informations pertinentes selon le type de contenu
      let questions: string[] = [];
      
      switch (target.type) {
        case 'product':
          // Questions typiques pour les produits
          questions = [
            "Comment choisir la bonne taille ?",
            "Quelles sont les options de livraison ?",
            "Quelle est la politique de retour ?",
            "Ce produit est-il disponible en d'autres couleurs ?",
            "Quelles sont les principales caractéristiques de ce produit ?"
          ];
          break;
        case 'category':
          // Questions typiques pour les catégories
          questions = [
            "Quels sont les produits les plus populaires dans cette catégorie ?",
            "Comment choisir le bon produit dans cette catégorie ?",
            "Quelles sont les dernières tendances dans cette catégorie ?",
            "Y a-t-il des promotions en cours dans cette catégorie ?",
            "Quels sont les critères de qualité importants pour cette catégorie ?"
          ];
          break;
        case 'article':
          // Questions typiques pour les articles de blog
          questions = [
            "Quels sont les points clés à retenir de cet article ?",
            "Où puis-je trouver plus d'informations sur ce sujet ?",
            "Comment appliquer ces conseils dans la vie quotidienne ?",
            "Quelles sont les références utilisées dans cet article ?",
            "Qui devrait lire cet article ?"
          ];
          break;
        default:
          // Questions génériques
          questions = [
            "Quelles informations puis-je trouver sur cette page ?",
            "Comment contacter le service client ?",
            "Quelles sont les conditions générales ?",
            "Y a-t-il des ressources complémentaires disponibles ?",
            "Comment partager cette page ?"
          ];
      }
      
      // Générer le contenu FAQ
      const faqJSX = `
{/* Section FAQ générée automatiquement pour améliorer le SEO */}
<section className="faq-section my-8">
  <h2 className="text-xl font-bold mb-4">Questions fréquentes</h2>
  <div className="space-y-4">
    ${questions.map(q => `
    <details className="border p-4 rounded">
      <summary className="font-semibold cursor-pointer">${q}</summary>
      <div className="mt-2 text-gray-600">
        {/* Réponse à personnaliser */}
        Contenu à personnaliser avec une réponse détaillée à cette question.
      </div>
    </details>`).join('')}
  </div>
</section>
`;

      // Générer le script JSON-LD pour FAQ
      const faqJsonLd = `
{/* Script JSON-LD pour FAQ */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        ${questions.map(q => `{
          "@type": "Question",
          "name": "${q}",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Contenu à personnaliser avec une réponse détaillée à cette question."
          }
        }`).join(',')}
      ]
    })
  }}
/>
`;

      return {
        type: 'faq',
        content: faqJSX + '\n\n' + faqJsonLd,
        targetFile: target.filePath,
        position: 'bottom',
        selector: 'return, </>',
        priority: 1
      };
    } catch (error) {
      this.context.logger.error(`Erreur lors de la génération de FAQ pour ${target.route}:`, error);
      return null;
    }
  }
  
  /**
   * Améliore les titres (h1, h2, etc.) pour le SEO
   */
  private async improveHeadings(target: EnhancerTarget, content: string): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];
    
    try {
      // Analyser le contenu pour les titres
      const dom = new JSDOM(`<div>${content}</div>`);
      const document = dom.window.document;
      
      // Vérifier la présence et la structure des titres
      const h1Tags = document.querySelectorAll('h1');
      const h2Tags = document.querySelectorAll('h2');
      
      // Vérifier s'il y a un H1
      if (h1Tags.length === 0) {
        // Suggérer l'ajout d'un H1 si manquant
        suggestions.push({
          type: 'headings',
          content: 'Ajouter un titre H1 pertinent et contenant des mots-clés',
          targetFile: target.filePath,
          priority: 0
        });
      } else if (h1Tags.length > 1) {
        // Suggérer de ne garder qu'un seul H1
        suggestions.push({
          type: 'headings',
          content: 'N\'utiliser qu\'un seul titre H1 par page',
          targetFile: target.filePath,
          priority: 0
        });
      }
      
      // Vérifier la structure des sous-titres
      if (h2Tags.length === 0 && content.length > 1000) {
        // Suggérer l'ajout de sous-titres pour le contenu long
        suggestions.push({
          type: 'headings',
          content: 'Ajouter des sous-titres H2 pour structurer le contenu',
          targetFile: target.filePath,
          priority: 1
        });
      }
    } catch (error) {
      this.context.logger.error(`Erreur lors de l'analyse des titres pour ${target.route}:`, error);
    }
    
    return suggestions;
  }
  
  /**
   * Génère des données structurées JSON-LD
   */
  private async generateStructuredData(target: EnhancerTarget, content: string): Promise<ContentSuggestion | null> {
    try {
      let schemaTemplate = '';
      
      // Générer un schéma adapté au type de contenu
      switch (target.type) {
        case 'product':
          schemaTemplate = `
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.images.map(img => \`\${siteUrl}\${img.url}\`),
      "description": product.description,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": product.brand.name
      },
      "offers": {
        "@type": "Offer",
        "url": canonical,
        "priceCurrency": "EUR",
        "price": product.price,
        "availability": product.inStock 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Votre entreprise"
        }
      }
    })
  }}
/>
`;
          break;
          
        case 'article':
          schemaTemplate = `
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "image": article.coverImage ? \`\${siteUrl}\${article.coverImage}\` : [],
      "datePublished": article.publishDate,
      "dateModified": article.updateDate || article.publishDate,
      "author": {
        "@type": "Person",
        "name": article.author.name
      },
      "publisher": {
        "@type": "Organization",
        "name": "Votre entreprise",
        "logo": {
          "@type": "ImageObject",
          "url": \`\${siteUrl}/images/logo.png\`
        }
      },
      "description": article.excerpt || article.metaDescription,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonical
      }
    })
  }}
/>
`;
          break;
          
        default:
          schemaTemplate = `
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": pageTitle,
      "description": metaDescription,
      "url": canonical
    })
  }}
/>
`;
      }
      
      // Suggérer d'ajouter le schéma à un fichier de métadonnées
      const metaFilePath = target.filePath.replace(/\.(tsx|jsx)$/, '.meta.ts');
      
      return {
        type: 'schema',
        content: `
// Ajoutez ces données structurées dans la fonction de métadonnées
export const handle = {
  // Autres propriétés existantes...
  
  // Données structurées Schema.org
  structuredData: (data) => {
    const siteUrl = "https://votre-site.com";
    const canonical = new URL(data.request.url).pathname;
    
    return ${schemaTemplate.split('\n').map(line => `  ${line}`).join('\n')}
  }
};`,
        targetFile: metaFilePath,
        priority: 2
      };
    } catch (error) {
      this.context.logger.error(`Erreur lors de la génération de données structurées pour ${target.route}:`, error);
      return null;
    }
  }
  
  /**
   * Génère des suggestions de contenu associé
   */
  private async generateRelatedContent(target: EnhancerTarget, content: string): Promise<ContentSuggestion | null> {
    try {
      // Contenu associé selon le type
      let relatedContent = '';
      
      switch (target.type) {
        case 'product':
          relatedContent = `
{/* Section de produits associés générée pour améliorer le SEO et l'expérience utilisateur */}
<section className="related-products my-8">
  <h2 className="text-xl font-bold mb-4">Produits similaires</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {relatedProducts.map((product) => (
      <div key={product.id} className="border p-4 rounded">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
        <h3 className="font-semibold mt-2">{product.name}</h3>
        <p className="text-gray-600">{product.price}</p>
        <Link to={product.url} className="text-blue-500 mt-2 block">
          Voir le produit
        </Link>
      </div>
    ))}
  </div>
</section>
`;
          break;
          
        case 'article':
          relatedContent = `
{/* Section d'articles associés générée pour améliorer le SEO et l'expérience utilisateur */}
<section className="related-articles my-8">
  <h2 className="text-xl font-bold mb-4">Articles sur le même sujet</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {relatedArticles.map((article) => (
      <div key={article.id} className="border p-4 rounded">
        <h3 className="font-semibold">{article.title}</h3>
        <p className="text-gray-600 text-sm">{article.date}</p>
        <p className="my-2">{article.excerpt}</p>
        <Link to={article.url} className="text-blue-500">
          Lire l'article
        </Link>
      </div>
    ))}
  </div>
</section>
`;
          break;
          
        default:
          relatedContent = `
{/* Section de liens associés générée pour améliorer le SEO et l'expérience utilisateur */}
<section className="related-content my-8">
  <h2 className="text-xl font-bold mb-4">Contenu associé</h2>
  <ul className="space-y-2">
    {relatedLinks.map((link) => (
      <li key={link.url}>
        <Link to={link.url} className="text-blue-500">
          {link.title}
        </Link>
        {link.description && <p className="text-sm text-gray-600">{link.description}</p>}
      </li>
    ))}
  </ul>
</section>
`;
      }
      
      // Suggérer également d'ajouter la logique pour charger le contenu associé
      const loaderLogic = `
// Ajoutez cette fonction pour charger le contenu associé
async function loadRelatedContent(currentId, type) {
  // Ici, implémentez la logique pour charger le contenu associé
  // depuis votre API ou base de données
  return [];
}
`;
      
      return {
        type: 'related',
        content: relatedContent + '\n\n' + loaderLogic,
        targetFile: target.filePath,
        position: 'bottom',
        selector: 'return, </>',
        priority: 3
      };
    } catch (error) {
      this.context.logger.error(`Erreur lors de la génération de contenu associé pour ${target.route}:`, error);
      return null;
    }
  }
  
  /**
   * Suggère des optimisations de mots-clés
   */
  private async optimizeKeywords(target: EnhancerTarget, content: string): Promise<ContentSuggestion | null> {
    try {
      // Liste de mots-clés suggérés selon le type de contenu
      let keywordSuggestions = '';
      
      switch (target.type) {
        case 'product':
          keywordSuggestions = `
/*
Suggestions de mots-clés SEO pour cette page produit:
- Ajouter le nom du produit dans le titre H1
- Inclure le nom de la marque dans les premiers paragraphes
- Utiliser des termes comme "acheter", "prix", "avis" dans le contenu
- Mentionner les caractéristiques principales dans des listes à puces
- Ajouter une section de spécifications techniques avec des termes de recherche pertinents
- Inclure des mots-clés de longue traîne comme "meilleur [produit] pour [usage]"
*/
`;
          break;
          
        case 'category':
          keywordSuggestions = `
/*
Suggestions de mots-clés SEO pour cette page catégorie:
- Utiliser le nom de la catégorie dans le titre H1
- Ajouter une description détaillée de la catégorie en haut de page
- Inclure des termes de comparaison comme "meilleur", "top", "comparatif"
- Mentionner les marques principales dans la description
- Utiliser des termes liés à la navigation comme "découvrir", "explorer", "parcourir"
- Inclure des mots-clés de filtre comme "par prix", "par marque", "par fonctionnalité"
*/
`;
          break;
          
        case 'article':
          keywordSuggestions = `
/*
Suggestions de mots-clés SEO pour cet article:
- Utiliser le mot-clé principal dans le titre H1
- Inclure des variations du mot-clé principal dans les sous-titres H2
- Ajouter des termes de recherche informationnels comme "comment", "pourquoi", "guide"
- Utiliser un langage naturel avec des questions que les utilisateurs pourraient poser
- Inclure des termes techniques pertinents pour le sujet
- Ajouter des liens internes vers d'autres articles avec des ancres optimisées
*/
`;
          break;
          
        default:
          keywordSuggestions = `
/*
Suggestions de mots-clés SEO pour cette page:
- Utiliser des mots-clés spécifiques à la page dans le titre H1
- Inclure des termes de recherche pertinents dans les premiers paragraphes
- Structurer le contenu avec des sous-titres H2 contenant des mots-clés
- Utiliser un vocabulaire naturel et varié autour du sujet principal
- Ajouter des liens internes avec des ancres descriptives
- Inclure des termes liés aux intentions de recherche des utilisateurs
*/
`;
      }
      
      return {
        type: 'keywords',
        content: keywordSuggestions,
        targetFile: target.filePath,
        position: 'top',
        priority: 0
      };
    } catch (error) {
      this.context.logger.error(`Erreur lors de l'optimisation des mots-clés pour ${target.route}:`, error);
      return null;
    }
  }
  
  /**
   * Applique ou sauvegarde les suggestions de contenu
   */
  private async applySuggestions(target: EnhancerTarget, suggestions: ContentSuggestion[]): Promise<void> {
    if (suggestions.length === 0) {
      this.context.logger.info(`Aucune suggestion pour ${target.route}`);
      return;
    }
    
    // Trier les suggestions par priorité
    suggestions.sort((a, b) => a.priority - b.priority);
    
    // Générer un rapport de suggestions
    const reportPath = path.join(
      this.config.outputDir,
      `seo-content-${this.sanitizeFileName(target.route)}.md`
    );
    
    let report = `# Suggestions d'enrichissement SEO pour ${target.route}

## Type de contenu: ${target.type}

`;

    for (const suggestion of suggestions) {
      report += `### ${this.getSuggestionTitle(suggestion.type)}

**Fichier cible**: \`${path.relative(this.config.remixDir, suggestion.targetFile)}\`
**Position**: ${suggestion.position || 'Non spécifiée'}

\`\`\`jsx
${suggestion.content}
\`\`\`

---

`;
    }
    
    // Écrire le rapport
    await fs.writeFile(reportPath, report, 'utf-8');
    
    this.context.logger.info(`Rapport de suggestions généré pour ${target.route}: ${reportPath}`);
    
    // Si la configuration demande d'appliquer les changements
    if (this.config.applyChanges) {
      for (const suggestion of suggestions) {
        try {
          await this.applySuggestion(suggestion);
          this.context.logger.info(`Suggestion ${suggestion.type} appliquée à ${suggestion.targetFile}`);
        } catch (error) {
          this.context.logger.error(
            `Erreur lors de l'application de la suggestion ${suggestion.type} à ${suggestion.targetFile}:`,
            error
          );
        }
      }
    }
  }
  
  /**
   * Applique une suggestion au fichier cible
   */
  private async applySuggestion(suggestion: ContentSuggestion): Promise<void> {
    if (!fs.existsSync(suggestion.targetFile)) {
      throw new Error(`Le fichier cible ${suggestion.targetFile} n'existe pas`);
    }
    
    let content = await fs.readFile(suggestion.targetFile, 'utf-8');
    
    switch (suggestion.position) {
      case 'top':
        content = suggestion.content + '\n\n' + content;
        break;
        
      case 'bottom':
        content = content + '\n\n' + suggestion.content;
        break;
        
      case 'replace':
        if (suggestion.selector) {
          const regex = new RegExp(suggestion.selector, 'g');
          content = content.replace(regex, suggestion.content);
        }
        break;
        
      case 'after-intro':
        // Trouver la fin du premier paragraphe ou du premier composant
        const introEndMatch = content.match(/<\/p>|<\/div>|<\/section>/);
        if (introEndMatch && introEndMatch.index) {
          const position = introEndMatch.index + introEndMatch[0].length;
          content = content.slice(0, position) + '\n\n' + suggestion.content + '\n\n' + content.slice(position);
        } else {
          content = content + '\n\n' + suggestion.content;
        }
        break;
        
      default:
        // Essayer de trouver un emplacement approprié
        if (suggestion.selector) {
          const regex = new RegExp(suggestion.selector);
          const match = content.match(regex);
          
          if (match && match.index) {
            const position = match.index;
            content = content.slice(0, position) + suggestion.content + '\n\n' + content.slice(position);
          } else {
            content = content + '\n\n' + suggestion.content;
          }
        } else {
          content = content + '\n\n' + suggestion.content;
        }
    }
    
    await fs.writeFile(suggestion.targetFile, content, 'utf-8');
  }
  
  /**
   * Obtient un titre lisible pour le type de suggestion
   */
  private getSuggestionTitle(type: string): string {
    switch (type) {
      case 'faq':
        return 'Section FAQ pour améliorer le SEO';
      case 'related':
        return 'Contenu associé pour améliorer l\'engagement';
      case 'schema':
        return 'Données structurées Schema.org';
      case 'keywords':
        return 'Optimisation des mots-clés';
      case 'headings':
        return 'Amélioration des titres et sous-titres';
      default:
        return 'Suggestion d\'enrichissement';
    }
  }
  
  /**
   * Convertit une URL en nom de fichier sécurisé
   */
  private sanitizeFileName(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[\/\?#:\*\<\>\|\"]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

export default SEOContentEnhancer;