import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { DB } from '../utils/DbConnector';

interface SeoMetadata {
  slug: string;
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  robots?: string;
  type?: string; // 'product', 'category', 'brand', etc.
  language?: string;
  author?: string;
  lastModified?: string;
  h1?: string;
  sourcePath?: string; // Chemin du fichier PHP source
}

interface SeoAnalysisOptions {
  phpSourceDir: string;
  outputPath: string;
  databaseConfig?: {
    host: string;
    user: string;
    password: string;
    database: string;
  };
  baseUrl: string;
  checkDb: boolean;
  checkFiles: boolean;
  verbose: boolean;
}

/**
 * Générateur de métadonnées SEO pour la migration PHP vers Remix
 */
export class SeoMetadataGenerator implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent , GeneratorAgent{
  private metadata: Record<string, SeoMetadata> = {};
  private dbConnection: any = null;
  private options: SeoAnalysisOptions;
  private seoFields: Record<string, any> = {};
  private descriptionFields: string[] = [
    'description', 'desc', 'seo_description', 'meta_description',
    'short_description', 'resume', 'extrait', 'resume_fiche'
  ];

  constructor(options: SeoAnalysisOptions) {
    this.options = options;
    
    if (options.verbose) {
      console.log(`🔍 Initialisation du générateur de métadonnées SEO`);
      console.log(`📂 Source PHP: ${options.phpSourceDir}`);
      console.log(`📄 Destination: ${options.outputPath}`);
    }

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Initialiser la connexion à la base de données si nécessaire
    if (options.checkDb && options.databaseConfig) {
      this.initDbConnection(options.databaseConfig);
    }
  }

  /**
   * Initialise la connexion à la base de données
   */
  private initDbConnection(config: any) {
    try {
      if (this.options.verbose) {
        console.log(`🔌 Connexion à la base de données ${config.database}...`);
      }
      this.dbConnection = new DB(config);
    } catch (error) {
      console.error(`❌ Erreur de connexion à la base de données:`, error);
    }
  }

  /**
   * Analyse les fichiers PHP pour extraire les métadonnées SEO
   */
  public async analyzePhpFiles(): Promise<void> {
    if (!this.options.checkFiles) return;

    if (this.options.verbose) {
      console.log(`🔍 Analyse des fichiers PHP...`);
    }

    // Trouver tous les fichiers PHP
    const phpFiles = glob.sync(`${this.options.phpSourceDir}/**/*.php`);
    
    if (this.options.verbose) {
      console.log(`📑 ${phpFiles.length} fichiers PHP trouvés.`);
    }

    let processedFiles = 0;
    const routePatterns = [
      { pattern: /fiche\.php/, type: 'product' },
      { pattern: /produit\.php/, type: 'product' },
      { pattern: /categorie\.php/, type: 'category' },
      { pattern: /marque\.php/, type: 'brand' },
      { pattern: /gamme\.php/, type: 'range' },
      { pattern: /page\.php/, type: 'page' },
      { pattern: /article\.php/, type: 'article' },
      { pattern: /blog\.php/, type: 'blog' }
    ];

    for (const filePath of phpFiles) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Déterminer le type de page
        const fileName = path.basename(filePath);
        let pageType = 'unknown';
        
        for (const { pattern, type } of routePatterns) {
          if (pattern.test(fileName)) {
            pageType = type;
            break;
          }
        }
        
        if (pageType === 'unknown' && !this.isSeoRelevant(fileContent)) {
          continue; // Ignorer les fichiers non pertinents pour le SEO
        }
        
        // Extraire les métadonnées
        const metadata = this.extractMetadataFromPhp(fileContent, filePath, pageType);
        
        if (metadata && metadata.slug) {
          this.metadata[metadata.slug] = metadata;
          processedFiles++;
          
          if (this.options.verbose && processedFiles % 100 === 0) {
            console.log(`⏳ ${processedFiles} fichiers traités...`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'analyse du fichier ${filePath}:`, error);
      }
    }

    if (this.options.verbose) {
      console.log(`✅ Analyse des fichiers PHP terminée. ${processedFiles} fichiers traités avec métadonnées extraites.`);
    }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

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

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
  }

  /**
   * Détermine si un fichier PHP est pertinent pour le SEO
   */
  private isSeoRelevant(content: string): boolean {
    // Vérifier la présence d'éléments SEO importants
    return content.includes('<title>') ||
           content.includes('<meta name="description"') ||
           content.includes('<meta property="og:') ||
           content.includes('<link rel="canonical"') ||
           content.includes('<h1');
  }

  /**
   * Extrait les métadonnées SEO d'un fichier PHP
   */
  private extractMetadataFromPhp(content: string, filePath: string, pageType: string): SeoMetadata | null {
    try {
      const $ = cheerio.load(content);
      
      // Extraire le slug depuis le chemin du fichier ou le contenu
      let slug = this.extractSlugFromPhp(content, filePath);
      if (!slug) return null;
      
      // Extraire les métadonnées de base
      const title = $('title').text().trim() || this.extractTitleFromPhp(content);
      const description = $('meta[name="description"]').attr('content') || this.extractDescriptionFromPhp(content);
      const h1 = $('h1').first().text().trim();
      
      // Extraire les métadonnées Open Graph
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');
      
      // Extraire l'URL canonique
      const canonical = $('link[rel="canonical"]').attr('href');
      
      // Extraire les mots-clés et les robots
      const keywords = $('meta[name="keywords"]').attr('content');
      const robots = $('meta[name="robots"]').attr('content');
      
      // Créer l'objet de métadonnées
      const metadata: SeoMetadata = {
        slug,
        title: this.cleanText(title || h1 || slug),
        description: this.cleanText(description || ''),
        h1: this.cleanText(h1 || ''),
        ogTitle: this.cleanText(ogTitle || ''),
        ogDescription: this.cleanText(ogDescription || ''),
        ogImage: ogImage || '',
        canonical: canonical || `/${pageType}/${slug}`,
        keywords: this.cleanText(keywords || ''),
        robots: robots || 'index, follow',
        type: pageType,
        sourcePath: filePath
      };
      
      // Nettoyer et améliorer les métadonnées
      return this.enhanceMetadata(metadata);
    } catch (error) {
      console.error(`❌ Erreur lors de l'extraction des métadonnées du fichier ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extrait le slug depuis un fichier PHP
   */
  private extractSlugFromPhp(content: string, filePath: string): string | null {
    // Extraction depuis les variables GET ou les paramètres de requête
    const slugParams = ['slug', 'id_fiche', 'id_produit', 'reference', 'ref', 'id', 'name'];
    
    for (const param of slugParams) {
      const regex = new RegExp(`['\"]${param}['\"](\\s+)?=(\\s+)?['\"]([^'\"]+?)['\"]`, 'i');
      const match = content.match(regex);
      
      if (match && match[3]) {
        return match[3].trim();
      }
    }
    
    // Si aucun slug n'est trouvé, utiliser le nom du fichier sans extension
    const fileName = path.basename(filePath, '.php');
    if (fileName !== 'index' && fileName !== 'fiche' && fileName !== 'product') {
      return fileName;
    }
    
    // Dernier recours: générer un slug à partir du chemin
    const pathSegments = filePath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 2];
    
    if (lastSegment && lastSegment !== 'src' && lastSegment !== 'app' && lastSegment !== 'public') {
      return lastSegment;
    }
    
    return null;
  }

  /**
   * Extrait le titre depuis un contenu PHP
   */
  private extractTitleFromPhp(content: string): string {
    // Chercher les variables de titre communes
    const titleVars = ['titre', 'title', 'nom_produit', 'nom_fiche', 'nom_page', 'name'];
    
    for (const varName of titleVars) {
      const regex = new RegExp(`\\$${varName}\\s*=\\s*['"]([^'"]+?)['"]`, 'i');
      const match = content.match(regex);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Extrait la description depuis un contenu PHP
   */
  private extractDescriptionFromPhp(content: string): string {
    // Chercher les variables de description communes
    for (const varName of this.descriptionFields) {
      const regex = new RegExp(`\\$${varName}\\s*=\\s*['"]([^'"]+?)['"]`, 'i');
      const match = content.match(regex);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Requête des données SEO depuis la base de données
   */
  public async fetchSeoFromDatabase(): Promise<void> {
    if (!this.options.checkDb || !this.dbConnection) return;

    if (this.options.verbose) {
      console.log(`🔍 Récupération des données SEO depuis la base de données...`);
    }

    try {
      // Rechercher les tables SEO courantes
      const seoTables = await this.findSeoTables();
      
      if (this.options.verbose) {
        console.log(`📊 Tables SEO trouvées: ${seoTables.join(', ') || 'aucune'}`);
      }
      
      // Requêter les données SEO
      await this.querySeoDatabases(seoTables);
      
      // Récupérer les descriptions des produits/fiches
      await this.queryEntityDescriptions();
      
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des données SEO depuis la base de données:`, error);
    }
  }

  /**
   * Trouve les tables potentiellement liées au SEO dans la base de données
   */
  private async findSeoTables(): Promise<string[]> {
    const seoTables: string[] = [];
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${this.options.databaseConfig?.database}'
    `;
    
    const tables = await this.dbConnection.query(tablesQuery);
    
    const seoKeywords = ['seo', 'meta', 'referencement', 'sitemap', 'redirect'];
    
    for (const row of tables) {
      const tableName = row.table_name || row.TABLE_NAME;
      
      if (seoKeywords.some(keyword => tableName.toLowerCase().includes(keyword))) {
        seoTables.push(tableName);
      }
    }
    
    return seoTables;
  }

  /**
   * Requête les tables SEO pour extraire les données
   */
  private async querySeoDatabases(seoTables: string[]): Promise<void> {
    for (const table of seoTables) {
      try {
        // Récupérer structure de la table
        const columnsQuery = `SHOW COLUMNS FROM ${table}`;
        const columns = await this.dbConnection.query(columnsQuery);
        
        // Rechercher les colonnes pertinentes
        const idColumn = columns.find((col: any) => 
          col.Field === 'id' || col.Field.endsWith('_id') || col.Field.includes('id_')
        )?.Field || 'id';
        
        const slugColumn = columns.find((col: any) => 
          ['slug', 'url', 'permalink', 'reference', 'ref'].includes(col.Field)
        )?.Field;
        
        const titleColumn = columns.find((col: any) => 
          ['title', 'titre', 'meta_title', 'seo_title'].includes(col.Field)
        )?.Field;
        
        const descColumn = columns.find((col: any) => 
          this.descriptionFields.includes(col.Field)
        )?.Field;
        
        const selectColumns = [
          idColumn,
          slugColumn ? `${slugColumn} AS slug` : 'NULL AS slug',
          titleColumn ? `${titleColumn} AS title` : 'NULL AS title',
          descColumn ? `${descColumn} AS description` : 'NULL AS description'
        ].filter(Boolean).join(', ');
        
        // Récupérer les données
        const dataQuery = `SELECT ${selectColumns} FROM ${table} LIMIT 1000`;
        const seoData = await this.dbConnection.query(dataQuery);
        
        if (this.options.verbose) {
          console.log(`📊 ${seoData.length} entrées SEO récupérées de ${table}`);
        }
        
        // Traiter les données
        for (const row of seoData) {
          if (row.slug) {
            const slug = row.slug.trim();
            
            if (!this.seoFields[slug]) {
              this.seoFields[slug] = {};
            }
            
            if (row.title) this.seoFields[slug].title = row.title;
            if (row.description) this.seoFields[slug].description = row.description;
            
            // Conserver la clé primaire et la table pour référence
            this.seoFields[slug].id = row[idColumn];
            this.seoFields[slug].table = table;
          }
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la requête de la table ${table}:`, error);
      }
    }
  }

  /**
   * Récupère les descriptions des entités (produits, catégories, etc.)
   */
  private async queryEntityDescriptions(): Promise<void> {
    const entityTables = [
      { name: 'produits', type: 'product' },
      { name: 'product', type: 'product' },
      { name: 'fiches', type: 'product' },
      { name: 'categories', type: 'category' },
      { name: 'category', type: 'category' },
      { name: 'marques', type: 'brand' },
      { name: 'brands', type: 'brand' },
      { name: 'gammes', type: 'range' },
      { name: 'ranges', type: 'range' },
      { name: 'articles', type: 'article' },
      { name: 'blog', type: 'blog' },
      { name: 'pages', type: 'page' }
    ];
    
    for (const {name, type} of entityTables) {
      try {
        // Vérifier si la table existe
        const checkTable = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = '${this.options.databaseConfig?.database}' AND table_name = '${name}'
        `;
        
        const tableExists = await this.dbConnection.query(checkTable);
        
        if (tableExists.length === 0) continue;
        
        // Récupérer structure de la table
        const columnsQuery = `SHOW COLUMNS FROM ${name}`;
        const columns = await this.dbConnection.query(columnsQuery);
        const columnNames = columns.map((col: any) => col.Field);
        
        // Rechercher les colonnes pertinentes
        const idColumn = columnNames.find(col => 
          col === 'id' || col.endsWith('_id') || col.includes('id_')
        ) || 'id';
        
        const slugColumn = columnNames.find(col => 
          ['slug', 'url', 'permalink', 'reference', 'ref'].includes(col)
        ) || null;
        
        const nameColumn = columnNames.find(col => 
          ['name', 'nom', 'titre', 'title'].includes(col)
        ) || null;
        
        const descColumn = columnNames.find(col => 
          this.descriptionFields.includes(col)
        ) || null;
        
        const imageColumn = columnNames.find(col => 
          ['image', 'photo', 'picture', 'thumbnail', 'image_url'].includes(col)
        ) || null;
        
        if (!slugColumn && !nameColumn) continue;
        
        // Construire la requête
        const selectColumns = [
          idColumn,
          slugColumn ? `${slugColumn} AS slug` : `${idColumn} AS slug`,
          nameColumn ? `${nameColumn} AS title` : 'NULL AS title',
          descColumn ? `${descColumn} AS description` : 'NULL AS description',
          imageColumn ? `${imageColumn} AS image` : 'NULL AS image'
        ].join(', ');
        
        const query = `SELECT ${selectColumns} FROM ${name} LIMIT 2000`;
        const rows = await this.dbConnection.query(query);
        
        if (this.options.verbose) {
          console.log(`📊 ${rows.length} entrées récupérées de ${name}`);
        }
        
        // Traiter les données
        for (const row of rows) {
          let slug = row.slug;
          
          // Nettoyer le slug
          if (slug) {
            slug = this.normalizeSlug(slug.toString());
          } else {
            continue;
          }
          
          // Ajouter ou mettre à jour les métadonnées
          if (!this.metadata[slug]) {
            this.metadata[slug] = {
              slug,
              title: this.cleanText(row.title || ''),
              description: this.cleanText(row.description || ''),
              image: row.image || undefined,
              type: type
            };
          } else {
            // Compléter les métadonnées existantes
            if (row.title && !this.metadata[slug].title) {
              this.metadata[slug].title = this.cleanText(row.title);
            }
            
            if (row.description && !this.metadata[slug].description) {
              this.metadata[slug].description = this.cleanText(row.description);
            }
            
            if (row.image && !this.metadata[slug].image) {
              this.metadata[slug].image = row.image;
            }
            
            if (!this.metadata[slug].type) {
              this.metadata[slug].type = type;
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la requête de la table ${name}:`, error);
      }
    }
  }

  /**
   * Normalise un slug
   */
  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Nettoie et améliore les métadonnées
   */
  private enhanceMetadata(metadata: SeoMetadata): SeoMetadata {
    // Nettoyer le titre
    if (metadata.title) {
      metadata.title = this.cleanText(metadata.title);
      
      // Ajouter le nom du site si nécessaire
      if (!metadata.title.includes('Auto Pièces') && !metadata.title.includes('APE')) {
        metadata.title = `${metadata.title} — Auto Pièces Équipements`;
      }
    }
    
    // Nettoyer et limiter la description
    if (metadata.description) {
      metadata.description = this.cleanText(metadata.description);
      if (metadata.description.length > 160) {
        metadata.description = metadata.description.substring(0, 157) + '...';
      }
    } else if (metadata.h1) {
      // Utiliser H1 comme description si nécessaire
      metadata.description = `Découvrez ${metadata.h1} sur notre site. Meilleurs prix, livraison rapide et service de qualité.`;
    }
    
    // Définir OG title s'il n'existe pas
    if (!metadata.ogTitle && metadata.title) {
      metadata.ogTitle = metadata.title.replace(' — Auto Pièces Équipements', '');
    }
    
    // Définir OG description s'il n'existe pas
    if (!metadata.ogDescription && metadata.description) {
      metadata.ogDescription = metadata.description;
    }
    
    // Canonicaliser le slug
    if (metadata.type) {
      switch (metadata.type) {
        case 'product':
          metadata.canonical = `/fiche/${metadata.slug}`;
          break;
        case 'category':
          metadata.canonical = `/categorie/${metadata.slug}`;
          break;
        case 'brand':
          metadata.canonical = `/marque/${metadata.slug}`;
          break;
        case 'range':
          metadata.canonical = `/gamme/${metadata.slug}`;
          break;
        case 'article':
        case 'blog':
          metadata.canonical = `/blog/${metadata.slug}`;
          break;
        case 'page':
          metadata.canonical = `/${metadata.slug}`;
          break;
        default:
          metadata.canonical = `/${metadata.slug}`;
      }
    }
    
    return metadata;
  }

  /**
   * Nettoie un texte (HTML, caractères spéciaux, etc.)
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
      .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
      .replace(/&amp;/g, '&') // Remplacer les &amp;
      .replace(/&lt;/g, '<') // Remplacer les &lt;
      .replace(/&gt;/g, '>') // Remplacer les &gt;
      .replace(/&quot;/g, '"') // Remplacer les &quot;
      .replace(/&#39;/g, "'") // Remplacer les &#39;
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples
      .trim(); // Supprimer les espaces en début et fin
  }

  /**
   * Fusionne les métadonnées du fichier PHP et de la base de données
   */
  private mergeMetadata(): void {
    // Fusionner les données de la base avec les métadonnées des fichiers
    for (const slug in this.seoFields) {
      if (this.metadata[slug]) {
        // Compléter les métadonnées existantes
        const current = this.metadata[slug];
        const fromDb = this.seoFields[slug];
        
        if (fromDb.title && (!current.title || current.title === current.slug)) {
          current.title = this.cleanText(fromDb.title);
        }
        
        if (fromDb.description && (!current.description || current.description.length < 50)) {
          current.description = this.cleanText(fromDb.description);
        }
      } else {
        // Créer de nouvelles métadonnées
        const fromDb = this.seoFields[slug];
        
        this.metadata[slug] = {
          slug,
          title: this.cleanText(fromDb.title || slug),
          description: this.cleanText(fromDb.description || ''),
          type: this.guessTypeFromSlug(slug)
        };
      }
    }
    
    if (this.options.verbose) {
      console.log(`✅ Fusion des métadonnées terminée. ${Object.keys(this.metadata).length} entrées au total.`);
    }
  }

  /**
   * Devine le type d'une page à partir de son slug
   */
  private guessTypeFromSlug(slug: string): string {
    if (slug.includes('fiche-') || slug.includes('produit-')) {
      return 'product';
    } else if (slug.includes('cat-') || slug.includes('categorie-')) {
      return 'category';
    } else if (slug.includes('marque-') || slug.includes('brand-')) {
      return 'brand';
    } else if (slug.includes('gamme-') || slug.includes('range-')) {
      return 'range';
    } else if (slug.includes('article-') || slug.includes('blog-')) {
      return 'article';
    } else {
      return 'page';
    }
  }

  /**
   * Génère le fichier de métadonnées
   */
  public async generateMetadataFile(): Promise<void> {
    // Fusionner les métadonnées
    this.mergeMetadata();
    
    // Améliorer toutes les métadonnées
    for (const slug in this.metadata) {
      this.metadata[slug] = this.enhanceMetadata(this.metadata[slug]);
    }
    
    // Écrire le fichier de métadonnées
    const metadataContent = JSON.stringify(this.metadata, null, 2);
    fs.writeFileSync(this.options.outputPath, metadataContent);
    
    // Créer le fichier d'index pour Remix
    this.generateRemixMetadataIndex();
    
    if (this.options.verbose) {
      console.log(`✅ Fichier de métadonnées écrit: ${this.options.outputPath}`);
      console.log(`📊 ${Object.keys(this.metadata).length} entrées de métadonnées générées.`);
    }
  }

  /**
   * Génère l'index des métadonnées pour Remix
   */
  private generateRemixMetadataIndex(): void {
    const indexContent = `// Généré automatiquement par SeoMetadataGenerator
// Ne pas modifier manuellement, utilisez l'agent seo-meta.generator.ts à la place

import { seoMetadata } from './seo-metadata.db';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


/**
 * Récupère les métadonnées SEO pour une route donnée
 * @param slug Slug de la page
 * @param type Type de page (product, category, brand, etc.)
 * @returns Métadonnées SEO ou null si non trouvées
 */
export function getSeoMetadata(slug: string, type?: string) {
  // Essayer de récupérer directement par slug
  if (seoMetadata[slug]) {
    return seoMetadata[slug];
  }

  // Si un type est fourni, essayer avec le type
  if (type) {
    // Construire les chemins possibles
    const possiblePaths = [
      \`/\${type}/\${slug}\`,
      \`/\${type}-\${slug}\`,
      \`/\${slug}\`
    ];

    // Chercher dans les chemins possibles
    for (const path of possiblePaths) {
      if (seoMetadata[path]) {
        return seoMetadata[path];
      }
    }

    // Pour les produits, essayer avec d'autres préfixes
    if (type === 'product') {
      const productPaths = [
        \`/fiche/\${slug}\`,
        \`/fiche-\${slug}\`,
        \`/produit/\${slug}\`,
        \`/produit-\${slug}\`
      ];

      for (const path of productPaths) {
        if (seoMetadata[path]) {
          return seoMetadata[path];
        }
      }
    }
  }

  // Chercher parmi toutes les métadonnées
  for (const key in seoMetadata) {
    if (key.endsWith(\`/\${slug}\`) || key.includes(\`-\${slug}\`)) {
      return seoMetadata[key];
    }
  }

  return null;
}

/**
 * Génère les métadonnées SEO pour une page
 * @param data Données de la page
 * @param defaultTitle Titre par défaut
 * @param defaultDescription Description par défaut
 * @returns Tableau de métadonnées pour la fonction meta de Remix
 */
export function generateSeoMetadata(data: any, defaultTitle?: string, defaultDescription?: string) {
  // Si pas de données, utiliser les valeurs par défaut
  if (!data) {
    return [
      { title: defaultTitle || 'Page non trouvée' },
      { name: 'description', content: defaultDescription || 'Contenu non disponible' },
      { name: 'robots', content: 'noindex, nofollow' }
    ];
  }

  // Déterminer le type de données
  let type = data.type || 'page';
  let slug = data.slug || '';

  // Pour les fiches produit
  if (data.reference || data.ref) {
    type = 'product';
    slug = data.slug || data.reference || data.ref;
  }

  // Récupérer les métadonnées existantes
  const metadata = getSeoMetadata(slug, type);

  // Construire les métadonnées SEO
  return [
    { title: metadata?.title || data.title || data.nom || data.name || defaultTitle || 'Auto Pièces Équipements' },
    { name: 'description', content: metadata?.description || data.description || defaultDescription || \`Découvrez notre sélection de pièces auto de qualité. Livraison rapide et service client réactif.\` },
    { property: 'og:title', content: metadata?.ogTitle || data.title || data.nom || data.name || defaultTitle || 'Auto Pièces Équipements' },
    { property: 'og:description', content: metadata?.ogDescription || data.description || defaultDescription || \`Découvrez notre sélection de pièces auto de qualité. Livraison rapide et service client réactif.\` },
    { property: 'og:image', content: metadata?.ogImage || data.image || '/images/default-share.jpg' },
    { property: 'og:type', content: type === 'product' ? 'product' : (type === 'article' || type === 'blog' ? 'article' : 'website') },
    { name: 'robots', content: metadata?.robots || 'index, follow' },
    { rel: 'canonical', href: \`\${process.env.PUBLIC_URL || 'https://www.auto-pieces-equipements.fr'}\${metadata?.canonical || \`/\${slug}\`}\` }
  ];
}

export default {
  getSeoMetadata,
  generateSeoMetadata,
};
`;

    // Écrire le fichier d'index
    const indexPath = path.join(path.dirname(this.options.outputPath), 'seo-metadata.index.ts');
    fs.writeFileSync(indexPath, indexContent);
    
    // Créer le fichier d'importation pour Remix
    const remixImportPath = path.join(path.dirname(this.options.outputPath), 'seo-metadata.db.ts');
    const importContent = `// Généré automatiquement par SeoMetadataGenerator
// Ne pas modifier manuellement

export const seoMetadata = ${JSON.stringify(this.metadata, null, 2)} as const;

export default seoMetadata;
`;
    fs.writeFileSync(remixImportPath, importContent);
  }

  /**
   * Exécute l'ensemble du processus de génération de métadonnées SEO
   */
  public async run(): Promise<void> {
    console.log(`🚀 Lancement du générateur de métadonnées SEO...`);
    
    // Analyser les fichiers PHP
    await this.analyzePhpFiles();
    
    // Récupérer les données SEO depuis la base de données
    await this.fetchSeoFromDatabase();
    
    // Générer le fichier de métadonnées
    await this.generateMetadataFile();
    
    console.log(`✅ Génération des métadonnées SEO terminée !`);
    console.log(`📄 Fichier de métadonnées: ${this.options.outputPath}`);
    console.log(`📊 Nombre d'entrées: ${Object.keys(this.metadata).length}`);
  }
}

// Script d'exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  const phpSourceDir = args[0] || './appsDoDotmcp-server-php/public';
  const outputPath = args[1] || './app/data/seo-metadata.db.json';
  const baseUrl = args[2] || 'https://www.auto-pieces-equipements.fr';
  const checkDb = args.includes('--with-db');
  const checkFiles = !args.includes('--no-files');
  const verbose = !args.includes('--quiet');
  
  const dbConfig = checkDb ? {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auto_pieces'
  } : undefined;
  
  const generator = new SeoMetadataGenerator({
    phpSourceDir,
    outputPath,
    databaseConfig: dbConfig,
    baseUrl,
    checkDb,
    checkFiles,
    verbose
  });
  
  generator.run().catch(error => {
    console.error(`❌ Erreur lors de l'exécution du générateur de métadonnées SEO:`, error);
    process.exit(1);
  });
}









































































































































































































































































































































































































































































































































































































































































































































































































import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
















































































































































































