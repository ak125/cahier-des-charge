/**
 * meta-generator.ts
 * 
 * Générateur de métadonnées SEO pour les routes Remix
 * Extrait les données SEO des pages PHP et les convertit en format Remix
 */

import { readFile, writeFile, pathExists } from 'fs-extra';
import { JSDOM } from 'jsdom';
import { parse } from 'node-html-parser';
import * as path from 'path';
import { createTraceabilityService, TraceabilityService } from '../utils/traceability/traceability-service';

interface MetaGeneratorConfig {
  // Chemins des fichiers source et cible
  phpSourceDir: string;       // Répertoire des fichiers PHP source
  remixTargetDir: string;     // Répertoire des routes Remix cible
  outputDir: string;          // Répertoire pour les fichiers générés
  // Sources de métadonnées
  extractFromPhp: boolean;    // Extraire depuis le code PHP
  extractFromDb: boolean;     // Extraire depuis la base de données
  extractFromHtaccess: boolean; // Extraire depuis .htaccess
  // Configuration de la base de données
  dbConfig?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  };
  // Configuration de la traçabilité
  enableTracing?: boolean;
}

interface MetaResult {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: string;
  source: 'php' | 'database' | 'htaccess' | 'default';
}

interface ProcessingResult {
  route: string;
  metaFile: string;
  metaData: MetaResult;
  success: boolean;
  messages: string[];
}

export class MetaGenerator {
  private traceService: TraceabilityService | null = null;
  
  constructor(private config: MetaGeneratorConfig) {
    if (config.enableTracing && config.dbConfig) {
      this.traceService = createTraceabilityService('agents', {
        storageStrategy: 'database',
        supabaseUrl: config.dbConfig.supabaseUrl,
        supabaseKey: config.dbConfig.supabaseKey,
        databaseTable: 'seo_migration_status'
      });
    }
  }
  
  /**
   * Génère les fichiers meta.ts pour toutes les routes correspondant au pattern
   */
  async generateAllMetaFiles(routePattern: string = '**/*.tsx'): Promise<{ success: number; failed: number; }> {
    const traceId = this.traceService ? 
      await this.traceService.generateTraceId({ operation: 'generate-all-meta' }) : '';
    
    if (this.traceService) {
      await this.traceService.logTrace({
        traceId,
        event: 'meta-generation-started',
        timestamp: new Date(),
        context: { routePattern }
      });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      // Implémenter la logique pour trouver toutes les routes correspondant au pattern
      // et générer un fichier meta.ts pour chacune

      return { success: successCount, failed: failCount };
    } catch (error) {
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'meta-generation-error',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }
  
  /**
   * Génère le fichier meta.ts pour une route spécifique
   */
  async generateMetaForRoute(route: string): Promise<ProcessingResult> {
    const traceId = this.traceService ? 
      await this.traceService.generateTraceId({ route, operation: 'generate-meta' }) : '';
    
    const result: ProcessingResult = {
      route,
      metaFile: '',
      metaData: {
        title: '',
        description: '',
        source: 'default'
      },
      success: false,
      messages: []
    };
    
    try {
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-meta-generation-started',
          timestamp: new Date(),
          context: { route }
        });
      }
      
      // 1. Déterminer les chemins des fichiers source et cible
      const phpFilePath = this.findPhpFile(route);
      const remixFilePath = path.join(this.config.remixTargetDir, `${route}.tsx`);
      const metaFilePath = path.join(this.config.outputDir, `${route}.meta.ts`);
      
      result.metaFile = metaFilePath;
      
      // 2. Extraire les métadonnées SEO de différentes sources
      let metaData: MetaResult | null = null;
      
      // Extraction depuis le fichier PHP
      if (this.config.extractFromPhp && phpFilePath && await pathExists(phpFilePath)) {
        metaData = await this.extractMetaFromPhp(phpFilePath);
        if (metaData) {
          result.metaData = metaData;
          result.messages.push(`Métadonnées extraites du fichier PHP: ${phpFilePath}`);
        }
      }
      
      // Extraction depuis la base de données
      if (!metaData && this.config.extractFromDb) {
        metaData = await this.extractMetaFromDatabase(route);
        if (metaData) {
          result.metaData = metaData;
          result.messages.push('Métadonnées extraites de la base de données');
        }
      }
      
      // Extraction depuis .htaccess
      if (!metaData && this.config.extractFromHtaccess) {
        metaData = await this.extractMetaFromHtaccess(route);
        if (metaData) {
          result.metaData = metaData;
          result.messages.push('Métadonnées extraites de fichier .htaccess');
        }
      }
      
      // 3. Si aucune métadonnée n'est trouvée, utiliser des valeurs par défaut
      if (!metaData) {
        metaData = this.generateDefaultMeta(route);
        result.metaData = metaData;
        result.messages.push('Aucune métadonnée trouvée, utilisation de valeurs par défaut');
      }
      
      // 4. Générer le contenu du fichier meta.ts
      const metaContent = this.generateMetaFileContent(route, metaData);
      
      // 5. Écrire le fichier meta.ts
      await writeFile(metaFilePath, metaContent, 'utf-8');
      result.success = true;
      result.messages.push(`Fichier meta.ts généré avec succès: ${metaFilePath}`);
      
      // 6. Tracer le résultat
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-meta-generation-completed',
          timestamp: new Date(),
          success: true,
          context: {
            route,
            metaFile: metaFilePath,
            metaData: result.metaData,
            source: result.metaData.source
          }
        });
      }
      
      return result;
    } catch (error) {
      result.success = false;
      result.messages.push(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
      
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-meta-generation-error',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : String(error),
          context: { route, messages: result.messages }
        });
      }
      
      return result;
    }
  }
  
  /**
   * Trouve le fichier PHP correspondant à une route Remix
   */
  private findPhpFile(route: string): string | null {
    // Logique pour mapper une route Remix à son fichier PHP source
    // Ceci est un exemple simple, à adapter selon votre convention de nommage
    
    const possiblePhpFiles = [
      path.join(this.config.phpSourceDir, `${route}.php`),
      path.join(this.config.phpSourceDir, `${route}/index.php`),
      path.join(this.config.phpSourceDir, `${route.replace(/\/[^/]+$/, '')}.php`)
    ];
    
    for (const phpFile of possiblePhpFiles) {
      if (pathExists(phpFile)) {
        return phpFile;
      }
    }
    
    return null;
  }
  
  /**
   * Extrait les métadonnées SEO d'un fichier PHP
   */
  private async extractMetaFromPhp(phpFilePath: string): Promise<MetaResult | null> {
    try {
      const phpContent = await readFile(phpFilePath, 'utf-8');
      
      // Rechercher les balises meta dans le contenu PHP
      const metaMatches = phpContent.match(/<meta[^>]*>/gi) || [];
      const titleMatch = phpContent.match(/<title[^>]*>(.*?)<\/title>/i);
      
      // Initialiser l'objet de résultat
      const result: MetaResult = {
        title: '',
        description: '',
        source: 'php'
      };
      
      // Extraire le titre
      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim();
      }
      
      // Analyser les balises meta
      for (const metaTag of metaMatches) {
        const nameMatch = metaTag.match(/name=["'](.*?)["']/i);
        const contentMatch = metaTag.match(/content=["'](.*?)["']/i);
        
        if (nameMatch && contentMatch) {
          const name = nameMatch[1].toLowerCase();
          const content = contentMatch[1];
          
          if (name === 'description') {
            result.description = content;
          } else if (name === 'keywords') {
            result.keywords = content.split(',').map(k => k.trim());
          } else if (name === 'robots') {
            result.robots = content;
          }
        }
        
        // Rechercher les balises Open Graph
        const propertyMatch = metaTag.match(/property=["'](.*?)["']/i);
        if (propertyMatch && contentMatch) {
          const property = propertyMatch[1].toLowerCase();
          const content = contentMatch[1];
          
          if (property === 'og:title') {
            result.ogTitle = content;
          } else if (property === 'og:description') {
            result.ogDescription = content;
          } else if (property === 'og:image') {
            result.ogImage = content;
          }
        }
      }
      
      // Rechercher les balises link canonical
      const canonicalMatch = phpContent.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["'][^>]*>/i);
      if (canonicalMatch && canonicalMatch[1]) {
        result.canonical = canonicalMatch[1];
      }
      
      return result.title || result.description ? result : null;
    } catch (error) {
      console.error(`Erreur lors de l'extraction des métadonnées du fichier PHP ${phpFilePath}:`, error);
      return null;
    }
  }
  
  /**
   * Extrait les métadonnées SEO depuis la base de données
   */
  private async extractMetaFromDatabase(route: string): Promise<MetaResult | null> {
    // Implémentation de l'extraction depuis la base de données
    // Cette méthode dépendra de votre structure de base de données
    // TODO: Ajouter l'implémentation réelle pour votre cas d'usage
    
    return null;
  }
  
  /**
   * Extrait les métadonnées SEO depuis les règles htaccess
   */
  private async extractMetaFromHtaccess(route: string): Promise<MetaResult | null> {
    // Implémentation de l'extraction depuis .htaccess
    // TODO: Ajouter l'implémentation réelle pour votre cas d'usage
    
    return null;
  }
  
  /**
   * Génère des métadonnées par défaut pour une route
   */
  private generateDefaultMeta(route: string): MetaResult {
    const routeParts = route.split('/').filter(Boolean);
    const routeName = routeParts[routeParts.length - 1] || 'accueil';
    const formattedName = routeName
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      title: `${formattedName} | Votre Site`,
      description: `Page ${formattedName.toLowerCase()} avec toutes les informations dont vous avez besoin.`,
      keywords: [formattedName.toLowerCase(), 'site', 'information'],
      robots: 'index, follow',
      source: 'default'
    };
  }
  
  /**
   * Génère le contenu du fichier meta.ts
   */
  private generateMetaFileContent(route: string, metaData: MetaResult): string {
    const { title, description, keywords, canonical, ogTitle, ogDescription, ogImage, robots } = metaData;
    
    return `/**
 * Fichier de métadonnées SEO pour la route "${route}"
 * Généré automatiquement par MetaGenerator le ${new Date().toISOString()}
 * Source des données: ${metaData.source}
 */
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = ({ data }) => {
  // Valeurs par défaut ou extraites des données
  const seo = data?.seo || {};
  
  return [
    { title: seo.title || ${JSON.stringify(title)} },
    { name: "description", content: seo.description || ${JSON.stringify(description)} },
    ${keywords ? `{ name: "keywords", content: seo.keywords || ${JSON.stringify(keywords.join(', '))} },` : ''}
    ${robots ? `{ name: "robots", content: seo.robots || ${JSON.stringify(robots)} },` : ''}
    ${canonical ? `{ tagName: "link", rel: "canonical", href: seo.canonical || ${JSON.stringify(canonical)} },` : ''}
    ${ogTitle ? `{ property: "og:title", content: seo.ogTitle || ${JSON.stringify(ogTitle)} },` : ''}
    ${ogDescription ? `{ property: "og:description", content: seo.ogDescription || ${JSON.stringify(ogDescription)} },` : ''}
    ${ogImage ? `{ property: "og:image", content: seo.ogImage || ${JSON.stringify(ogImage)} },` : ''}
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }
  ].filter(Boolean);
};

export default meta;
`;
  }
}

/**
 * Fonction utilitaire pour créer une instance de MetaGenerator
 */
export function createMetaGenerator(config: MetaGeneratorConfig): MetaGenerator {
  return new MetaGenerator(config);
}