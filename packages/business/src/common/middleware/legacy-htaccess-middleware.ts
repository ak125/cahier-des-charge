import * as fs from 'fs';
import * as path from 'path';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

interface RedirectMapping {
  to: string;
  status: number;
}

interface RouteConfig {
  redirects: Record<string, RedirectMapping>;
  gone: string[];
  mapping: Record<string, string>;
}

/**
 * Middleware NestJS qui gère les redirections des anciennes routes PHP
 * basé sur l'analyse des règles .htaccess
 */
@Injectable()
export class LegacyHtaccessMiddleware implements NestMiddleware {
  private redirects: Record<string, RedirectMapping> = {};
  private gone: string[] = [];
  private mapping: Record<string, string> = {};
  private initialized = false;
  private missedRoutesLog: string;

  constructor() {
    this.missedRoutesLog = path.resolve(process.cwd(), 'logs/missed_legacy_routes.log');
    this.initializeRoutes();
  }

  /**
   * Initialise les routes depuis les fichiers générés par l'agent HtaccessParser
   */
  private initializeRoutes(): void {
    try {
      const reportsDir = path.resolve(process.cwd(), 'reports');

      // Charger les redirections
      const redirectsPath = path.join(reportsDir, 'redirects.json');
      if (fs.existsSync(redirectsPath)) {
        this.redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      }

      // Charger les pages supprimées
      const gonePath = path.join(reportsDir, 'deleted_routes.json');
      if (fs.existsSync(gonePath)) {
        this.gone = JSON.parse(fs.readFileSync(gonePath, 'utf8'));
      }

      // Charger le mapping des routes
      const mappingPath = path.join(reportsDir, 'legacy_route_map.json');
      if (fs.existsSync(mappingPath)) {
        this.mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      }

      this.initialized = true;
      console.log(
        `[LegacyHtaccessMiddleware] Initialisé avec ${Object.keys(this.redirects).length
        } redirections, ${this.gone.length} pages supprimées, ${Object.keys(this.mapping).length
        } mappings`
      );
    } catch (error) {
      console.error(`[LegacyHtaccessMiddleware] Erreur lors de l'initialisation:`, error);
    }
  }

  /**
   * Recharge les règles depuis les fichiers (utile pour les mises à jour à chaud)
   */
  public reloadRules(): void {
    this.initialized = false;
    this.initializeRoutes();
  }

  /**
   * Vérifie si une URL est dans la liste des routes supprimées (410 Gone)
   */
  private isGone(url: string): boolean {
    // Vérifier si l'URL est exactement dans la liste
    if (this.gone.includes(url)) {
      return true;
    }

    // Vérifier avec des expressions régulières pour les modèles dynamiques
    for (const pattern of this.gone) {
      if (pattern.includes(':param')) {
        const regexPattern = pattern.replace(/:param/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(url)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Mappe une ancienne URL PHP vers une nouvelle URL Remix
   */
  private mapLegacyToRemix(url: string): string | null {
    // Vérifier si l'URL est exactement dans le mapping
    if (this.mapping[url]) {
      return this.mapping[url];
    }

    // Extraire le chemin de base et les paramètres pour les routes PHP
    if (url.includes('.php')) {
      const [basePath, queryString] = url.split('?');
      if (this.mapping[basePath]) {
        const targetPath = this.mapping[basePath];

        // Si pas de query string, juste retourner le chemin cible
        if (!queryString) {
          return targetPath;
        }

        // Traiter les paramètres pour les routes dynamiques
        const params = new URLSearchParams(queryString);

        // Cas spéciaux courants
        if (basePath === '/fiche.php' && params.has('id')) {
          return `${targetPath}/${params.get('id')}`;
        }

        if (basePath === '/categorie.php' && params.has('id')) {
          return `${targetPath}/${params.get('id')}`;
        }

        if (basePath === '/search.php' && params.has('q')) {
          return `${targetPath}?q=${params.get('q')}`;
        }

        // Cas général : ajouter les paramètres tels quels
        return `${targetPath}?${queryString}`;
      }
    }

    return null;
  }

  /**
   * Enregistre une route manquée pour analyse ultérieure
   */
  private logMissedRoute(req: FastifyRequest): void {
    try {
      const logDir = path.dirname(this.missedRoutesLog);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const date = new Date().toISOString();
      const method = req.method;
      const url = req.url;
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const referer = req.headers['referer'] || 'Unknown';

      const logEntry = `${date} | ${method} | ${url} | ${userAgent} | ${referer}\n`;
      fs.appendFileSync(this.missedRoutesLog, logEntry);
    } catch (error) {
      console.error(`[LegacyHtaccessMiddleware] Erreur d'écriture dans le journal:`, error);
    }
  }

  /**
   * Préserve les paramètres de requête importants lors des redirections
   */
  private preserveQueryParams(req: FastifyRequest, route: any): string {
    // Liste des paramètres à toujours préserver
    const alwaysPreserve = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    // Obtenir les paramètres de requête actuels
    const urlString = req.url;
    const currentParams = new URLSearchParams(urlString.includes('?') ? urlString.split('?')[1] : '');
    const preservedParams = new URLSearchParams();

    // Ajouter les paramètres à préserver
    alwaysPreserve.forEach((param) => {
      if (currentParams.has(param)) {
        preservedParams.append(param, currentParams.get(param) as string);
      }
    });

    // Ajouter les paramètres spécifiés dans la configuration de la route
    if (route.queryParams) {
      route.queryParams.forEach((param: string) => {
        if (currentParams.has(param)) {
          preservedParams.append(param, currentParams.get(param) as string);
        }
      });
    }

    // Construire la chaîne de requête
    const queryString = preservedParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Middleware principal qui intercepte et traite les requêtes
   */
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // S'assurer que les règles sont chargées
    if (!this.initialized) {
      this.initializeRoutes();
    }

    // Fastify gère les URL différemment de Express
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const url = urlObj.pathname;

    // 1. Vérifier si l'URL est dans les redirections
    if (this.redirects[url]) {
      const { to, status } = this.redirects[url];
      return res.redirect(status, to);
    }

    // 2. Vérifier si l'URL correspond à une page supprimée
    if (this.isGone(url)) {
      return res.status(410).send("Gone - Cette ressource n'existe plus");
    }

    // 3. Vérifier si c'est une ancienne URL PHP
    if (url.endsWith('.php')) {
      const remixUrl = this.mapLegacyToRemix(url);
      if (remixUrl) {
        // Rediriger vers la nouvelle URL Remix
        return res.redirect(301, remixUrl);
      }
      // Enregistrer l'URL PHP inconnue pour analyse
      this.logMissedRoute(req);
    }

    // 4. Vérifier les URL qui contiennent /core/, /admin/, etc. (typiques des CMS PHP)
    const legacyPaths = ['/core/', '/admin/', '/includes/', '/modules/', '/plugins/'];
    if (legacyPaths.some((path) => url.includes(path))) {
      this.logMissedRoute(req);
      return res.status(410).send("Gone - Cette ressource a été déplacée ou n'existe plus");
    }

    // Continuer avec le traitement normal de la demande
    next();
  }

  /**
   * Génère un rapport des routes manquées
   */
  public generateMissingRoutesReport(): Record<string, any> {
    try {
      if (!fs.existsSync(this.missedRoutesLog)) {
        return {
          total: 0,
          routes: [],
        };
      }

      const logContent = fs.readFileSync(this.missedRoutesLog, 'utf-8');
      const logLines = logContent.split('\n').filter((line) => line.trim());

      // Extraire et compter les URLs uniques
      const urlCounts = new Map<string, number>();
      const urlDetails = new Map<
        string,
        { userAgents: Set<string>; methods: Set<string>; dates: string[] }
      >();

      logLines.forEach((line) => {
        const parts = line.split(' | ');
        if (parts.length >= 3) {
          const date = parts[0];
          const method = parts[1];
          const url = parts[2];
          const userAgent = parts[3] || 'Unknown';

          // Incrémenter le compteur
          urlCounts.set(url, (urlCounts.get(url) || 0) + 1);

          // Stocker les détails
          if (!urlDetails.has(url)) {
            urlDetails.set(url, {
              userAgents: new Set(),
              methods: new Set(),
              dates: [],
            });
          }

          const details = urlDetails.get(url) as {
            userAgents: Set<string>;
            methods: Set<string>;
            dates: string[];
          };
          details.userAgents.add(userAgent);
          details.methods.add(method);
          details.dates.push(date);
        }
      });

      // Trier par nombre d'accès (du plus grand au plus petit)
      const sortedUrls = [...urlCounts.entries()].sort((a, b) => b[1] - a[1]);

      // Générer le rapport
      const report = sortedUrls.map(([url, count]) => {
        const details = urlDetails.get(url) as {
          userAgents: Set<string>;
          methods: Set<string>;
          dates: string[];
        };
        const lastAccess = details.dates[details.dates.length - 1];

        return {
          url,
          count,
          lastAccess,
          methods: [...details.methods],
          userAgents: [...details.userAgents].slice(0, 5), // Limiter à 5 user agents pour éviter trop de données
        };
      });

      return {
        total: sortedUrls.length,
        routes: report,
      };
    } catch (error) {
      console.error('[LegacyHtaccessMiddleware] Erreur lors de la génération du rapport:', error);
      return {
        total: 0,
        routes: [],
        error: error.message,
      };
    }
  }
}
