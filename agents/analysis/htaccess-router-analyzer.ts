import { Agent } from '@agent-protocol/sdk';
import { HtaccessParser } from '../utils/htaccess-parser';
import { SEOChecker } from '../../packages/mcp-agents/seo-checker/seo-checker';
import * as fs from 'fs';
import * as path from 'path';

interface HtaccessRouterAnalyzerConfig {
  htaccessPath: string;
  outputDir: string;
  includeCommonPhp?: boolean;
  generateSeoReport?: boolean;
  seoThreshold?: number;
}

interface RouteAnalysisResult {
  url: string;
  type: 'redirect' | 'rewrite' | 'proxy' | 'forbidden' | 'other';
  target?: string;
  statusCode?: number;
  seoScore?: number;
  issues?: string[];
}

/**
 * Agent MCP qui analyse les règles htaccess pour identifier les routes
 * et effectue une analyse SEO sur ces routes
 */
export class HtaccessRouterAnalyzer extends Agent {
  private parser: HtaccessParser;
  private seoChecker: SEOChecker | null = null;
  private config: HtaccessRouterAnalyzerConfig;

  constructor(config: HtaccessRouterAnalyzerConfig) {
    super();
    this.config = config;
    this.parser = new HtaccessParser();
    
    // Initialiser le SEO Checker si l'option est activée
    if (config.generateSeoReport) {
      this.seoChecker = new SEOChecker({
        threshold: config.seoThreshold || 70
      });
    }

    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Analyse un fichier htaccess et retourne les résultats
   */
  async analyze(): Promise<{ redirects: Record<string, any>, routeMap: Record<string, any> }> {
    console.log(`Analyse du fichier .htaccess: ${this.config.htaccessPath}`);
    
    if (!fs.existsSync(this.config.htaccessPath)) {
      throw new Error(`Le fichier .htaccess n'existe pas: ${this.config.htaccessPath}`);
    }

    const htaccessContent = fs.readFileSync(this.config.htaccessPath, 'utf8');
    
    // Analyser le fichier .htaccess
    const parseResult = this.parser.parse(htaccessContent);
    
    // Extraire les redirections et les réécritures
    const redirects = this.parser.extractRedirects(parseResult);
    const rewrites = this.parser.extractRewriteRules(parseResult);
    
    // Générer la carte des routes
    const routeMap = this.generateRouteMap(redirects, rewrites);
    
    // Sauvegarder les résultats
    this.saveResults(redirects, routeMap);
    
    // Générer un rapport SEO si demandé
    if (this.config.generateSeoReport && this.seoChecker) {
      await this.generateSEOReport(routeMap);
    }
    
    return { redirects, routeMap };
  }

  /**
   * Génère une carte des routes à partir des redirections et réécritures
   */
  private generateRouteMap(redirects: Record<string, any>, rewrites: any[]): Record<string, any> {
    const routeMap: Record<string, any> = {};

    // Ajouter les redirections à la carte des routes
    Object.entries(redirects).forEach(([url, config]) => {
      routeMap[url] = {
        type: 'redirect',
        target: config.target,
        statusCode: config.statusCode || 301,
        source: 'htaccess'
      };
    });

    // Ajouter les réécritures à la carte des routes
    rewrites.forEach(rule => {
      if (rule.source && rule.target) {
        const sourcePattern = this.parser.normalizePattern(rule.source);
        routeMap[sourcePattern] = {
          type: 'rewrite',
          target: rule.target,
          conditions: rule.conditions,
          flags: rule.flags,
          source: 'htaccess'
        };
      }
    });

    // Ajouter les routes PHP courantes si l'option est activée
    if (this.config.includeCommonPhp) {
      this.addCommonPhpRoutes(routeMap);
    }

    return routeMap;
  }

  /**
   * Ajoute les routes PHP courantes à la carte des routes
   */
  private addCommonPhpRoutes(routeMap: Record<string, any>): void {
    // Liste non exhaustive des routes PHP courantes
    const commonRoutes = [
      '/index.php',
      '/contact.php',
      '/about.php',
      '/login.php',
      '/register.php',
      '/profile.php',
      '/admin.php',
      '/search.php',
      '/products.php',
      '/cart.php',
      '/checkout.php'
    ];

    commonRoutes.forEach(route => {
      // N'ajouter que si la route n'existe pas déjà
      if (!routeMap[route]) {
        routeMap[route] = {
          type: 'page',
          source: 'common'
        };
      }
    });
  }

  /**
   * Sauvegarde les résultats de l'analyse
   */
  private saveResults(redirects: Record<string, any>, routeMap: Record<string, any>): void {
    // Sauvegarder les redirections
    fs.writeFileSync(
      path.join(this.config.outputDir, 'redirects.json'),
      JSON.stringify(redirects, null, 2),
      'utf8'
    );
    
    // Sauvegarder la carte des routes
    fs.writeFileSync(
      path.join(this.config.outputDir, 'route_map.json'),
      JSON.stringify(routeMap, null, 2),
      'utf8'
    );
    
    // Générer un fichier de configuration pour Remix
    const remixConfig = this.generateRemixConfig(routeMap);
    fs.writeFileSync(
      path.join(this.config.outputDir, 'remix_routes.json'),
      JSON.stringify(remixConfig, null, 2),
      'utf8'
    );

    console.log(`Résultats sauvegardés dans le répertoire: ${this.config.outputDir}`);
  }

  /**
   * Génère un fichier de configuration pour les routes Remix
   */
  private generateRemixConfig(routeMap: Record<string, any>): Record<string, any> {
    const remixRoutes: Record<string, any> = {};
    
    Object.entries(routeMap).forEach(([url, config]) => {
      // Convertir l'URL en format compatible avec Remix
      const remixPath = url
        .replace(/^\/?/, '/') // Assurer que l'URL commence par /
        .replace(/\/$/, '') // Supprimer le / final
        .replace(/\.php$/, '') // Supprimer l'extension .php
        .replace(/\/index$/, '/') // Transformer /index en /
        .replace(/\*/g, '$1'); // Remplacer les * par $1
      
      // Créer la configuration de route
      if (config.type === 'redirect') {
        remixRoutes[remixPath] = {
          redirect: config.target,
          status: config.statusCode || 301
        };
      } else if (config.type === 'rewrite') {
        remixRoutes[remixPath] = {
          file: `routes${remixPath}.tsx`,
          // Pour les routes dynamiques, on pourrait ajouter ici la logique
        };
      } else {
        remixRoutes[remixPath] = {
          file: `routes${remixPath}.tsx`
        };
      }
    });
    
    return remixRoutes;
  }

  /**
   * Génère un rapport SEO pour les routes identifiées
   */
  private async generateSEOReport(routeMap: Record<string, any>): Promise<void> {
    if (!this.seoChecker) return;

    console.log("Génération du rapport SEO...");
    
    const results: RouteAnalysisResult[] = [];
    
    // Analyser chaque route pour le SEO
    for (const [url, config] of Object.entries(routeMap)) {
      try {
        // Ignorer certains types de routes pour l'analyse SEO
        if (config.type === 'forbidden' || url.includes('admin')) {
          continue;
        }
        
        const seoResult = await this.seoChecker.analyzeRoute(url, config);
        
        results.push({
          url,
          type: config.type,
          target: config.target,
          statusCode: config.statusCode,
          seoScore: seoResult.score,
          issues: seoResult.issues
        });
      } catch (error) {
        console.error(`Erreur lors de l'analyse SEO pour ${url}:`, error);
      }
    }
    
    // Calculer le score SEO global
    const totalScore = results.reduce((sum, result) => sum + (result.seoScore || 0), 0);
    const avgScore = results.length > 0 ? totalScore / results.length : 0;
    
    // Générer le rapport final
    const seoReport = {
      timestamp: new Date().toISOString(),
      globalScore: avgScore,
      totalRoutes: results.length,
      results: results.sort((a, b) => (a.seoScore || 0) - (b.seoScore || 0)), // Tri par score croissant
      summary: {
        highPriorityIssues: results.filter(r => (r.seoScore || 0) < 50).length,
        mediumPriorityIssues: results.filter(r => (r.seoScore || 0) >= 50 && (r.seoScore || 0) < 70).length,
        lowPriorityIssues: results.filter(r => (r.seoScore || 0) >= 70 && (r.seoScore || 0) < 90).length,
        goodScore: results.filter(r => (r.seoScore || 0) >= 90).length
      }
    };
    
    // Sauvegarder le rapport SEO
    fs.writeFileSync(
      path.join(this.config.outputDir, 'seo_report.json'),
      JSON.stringify(seoReport, null, 2),
      'utf8'
    );
    
    // Générer un rapport SEO au format Markdown
    this.generateSEOMarkdownReport(seoReport);
    
    console.log("Rapport SEO généré avec succès");
  }

  /**
   * Génère un rapport SEO au format Markdown
   */
  private generateSEOMarkdownReport(seoReport: any): void {
    let markdown = `# Rapport d'analyse SEO des routes\n\n`;
    markdown += `Date: ${new Date().toLocaleDateString()}\n\n`;
    
    markdown += `## Résumé\n\n`;
    markdown += `- Score global: ${seoReport.globalScore.toFixed(2)} / 100\n`;
    markdown += `- Nombre total de routes: ${seoReport.totalRoutes}\n`;
    markdown += `- Problèmes prioritaires: ${seoReport.summary.highPriorityIssues}\n`;
    markdown += `- Problèmes moyens: ${seoReport.summary.mediumPriorityIssues}\n`;
    markdown += `- Problèmes mineurs: ${seoReport.summary.lowPriorityIssues}\n`;
    markdown += `- Routes optimisées: ${seoReport.summary.goodScore}\n\n`;
    
    markdown += `## Routes à optimiser en priorité\n\n`;
    
    // Afficher les 10 routes avec le score le plus bas
    const priorityRoutes = seoReport.results.filter(r => (r.seoScore || 0) < 50).slice(0, 10);
    
    if (priorityRoutes.length > 0) {
      priorityRoutes.forEach(route => {
        markdown += `### ${route.url} (Score: ${route.seoScore})\n`;
        markdown += `- Type: ${route.type}\n`;
        if (route.target) markdown += `- Cible: ${route.target}\n`;
        if (route.statusCode) markdown += `- Code HTTP: ${route.statusCode}\n`;
        
        if (route.issues && route.issues.length > 0) {
          markdown += `- Problèmes identifiés:\n`;
          route.issues.forEach(issue => {
            markdown += `  - ${issue}\n`;
          });
        }
        
        markdown += `\n`;
      });
    } else {
      markdown += `Aucune route prioritaire n'a été identifiée.\n\n`;
    }
    
    markdown += `## Recommandations générales\n\n`;
    markdown += `1. Vérifier que toutes les redirections importantes utilisent des codes 301 (permanentes)\n`;
    markdown += `2. Éviter les chaînes de redirections (redirections en cascade)\n`;
    markdown += `3. S'assurer que les redirections préservent les paramètres d'URL importants\n`;
    markdown += `4. Mettre à jour la sitemap.xml après chaque modification des redirections\n`;
    markdown += `5. Vérifier régulièrement dans Google Search Console les erreurs liées aux redirections\n`;
    
    // Sauvegarder le rapport Markdown
    fs.writeFileSync(
      path.join(this.config.outputDir, 'seo_routes.audit.md'),
      markdown,
      'utf8'
    );
  }
}

// Exporter une fonction pour créer facilement une instance
export function createHtaccessRouterAnalyzer(config: HtaccessRouterAnalyzerConfig): HtaccessRouterAnalyzer {
  return new HtaccessRouterAnalyzer(config);
}