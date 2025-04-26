import { Injectable, NestMiddleware } from @nestjs/commonstructure-agent';
import { Request, Response, NextFunction } from expressstructure-agent';
import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';

interface RouteMapping {
  from: string;
  to: string;
  type: 'redirect' | 'rewrite' | 'dynamic' | 'removed';
  status?: number;
  queryParams?: string[];
  description?: string;
}

@Injectable()
export class LegacyPhpRedirectMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LegacyPhpRedirectMiddleware.name);
  private routingMap: RouteMapping[] = [];
  private missedRoutesLog: string = path.resolve(process.cwd(), 'logs/missed_legacy_routes.log');

  constructor() {
    this.loadRoutingMap();
    this.ensureLogDirectoryExists();
  }

  private loadRoutingMap() {
    const routingMapPath = path.resolve(process.cwd(), 'routing_patch.json');
    try {
      if (fs.existsSync(routingMapPath)) {
        this.routingMap = JSON.parse(fs.readFileSync(routingMapPath, 'utf-8'));
        this.logger.log(`Chargement de ${this.routingMap.length} routes depuis routing_patch.json`);
      } else {
        this.logger.warn('Fichier routing_patch.json non trouvé. Aucune route chargée.');
        this.routingMap = [];
      }
    } catch (error) {
      this.logger.error(`Erreur lors du chargement de routing_patch.json: ${error.message}`);
      this.routingMap = [];
    }
  }

  private ensureLogDirectoryExists() {
    const logDir = path.dirname(this.missedRoutesLog);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private logMissedRoute(req: Request) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} | ${req.method} | ${req.url} | ${req.headers['user-agent'] || 'Unknown'} | ${req.ip}\n`;
    
    fs.appendFile(this.missedRoutesLog, logEntry, (err) => {
      if (err) {
        this.logger.error(`Erreur lors de l'écriture dans le fichier de log: ${err.message}`);
      }
    });
  }

  private generateMissingRoutesReport() {
    try {
      if (!fs.existsSync(this.missedRoutesLog)) {
        return;
      }

      const logContent = fs.readFileSync(this.missedRoutesLog, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim());

      // Extraire et compter les URLs uniques
      const urlCounts = new Map<string, number>();
      const urlDetails = new Map<string, { userAgents: Set<string>, methods: Set<string>, dates: string[] }>();

      logLines.forEach(line => {
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
              userAgents: new Set<string>(),
              methods: new Set<string>(),
              dates: []
            });
          }

          const details = urlDetails.get(url);
          details.userAgents.add(userAgent);
          details.methods.add(method);
          details.dates.push(date);
        }
      });

      // Générer le rapport en Markdown
      const reportPath = path.resolve(process.cwd(), 'reports/missing_php_routes.md');
      const reportDir = path.dirname(reportPath);
      
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      let reportContent = `# Rapport des routes PHP non mappées\n\n`;
      reportContent += `*Généré le: ${new Date().toLocaleString()}*\n\n`;
      reportContent += `## Résumé\n\n`;
      reportContent += `Total des routes uniques non mappées: **${urlCounts.size}**\n\n`;
      reportContent += `## Détail des routes\n\n`;
      reportContent += `| URL | Nombre d'accès | Dernière tentative | Méthodes | User-Agents |\n`;
      reportContent += `| --- | -------------- | ----------------- | -------- | ----------- |\n`;

      // Trier par nombre d'accès (du plus grand au plus petit)
      const sortedUrls = [...urlCounts.entries()].sort((a, b) => b[1] - a[1]);

      sortedUrls.forEach(([url, count]) => {
        const details = urlDetails.get(url);
        const lastAccess = details.dates[details.dates.length - 1];
        const methods = [...details.methods].join(', ');
        const userAgents = [...details.userAgents].slice(0, 3).join(', ') + 
          (details.userAgents.size > 3 ? `, et ${details.userAgents.size - 3} autres` : '');

        reportContent += `| ${url} | ${count} | ${lastAccess} | ${methods} | ${userAgents} |\n`;
      });

      reportContent += `\n\n## Recommandations\n\n`;
      reportContent += `Pour chaque URL ci-dessus, nous recommandons de :\n\n`;
      reportContent += `1. Vérifier si la page existe encore dans la nouvelle architecture\n`;
      reportContent += `2. Ajouter une redirection 301 dans le fichier \`routing_patch.json\` si nécessaire\n`;
      reportContent += `3. Analyser les User-Agents pour identifier si les accès sont lDoDoDoDotgitimes ou des bots\n`;
      reportContent += `4. Envisager de créer des pages spécifiques pour les URLs les plus fréquemment accédées\n`;

      fs.writeFileSync(reportPath, reportContent);
      this.logger.log(`Rapport des routes manquantes généré: ${reportPath}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Vérifier si l'URL se termine par .php
    if (!req.originalUrl.includes('.php')) {
      return next();
    }

    // Extraire le chemin de l'URL (sans les paramètres de requête)
    const [pathname] = req.originalUrl.split('?');
    
    // Rechercher une correspondance dans le mapping
    const match = this.routingMap.find(route => {
      // Pour une correspondance exacte
      if (route.from === pathname) {
        return true;
      }
      
      // Pour les routes avec des patterns plus complexes (à implémenter selon les besoins)
      // Exemple: route.from contient des wildcards ou des expressions régulières
      return false;
    });

    if (match) {
      this.logger.log(`Route PHP mappée: ${req.originalUrl} => ${match.to}`);
      
      // Gérer selon le type de mapping
      switch (match.type) {
        case 'redirect':
          // Redirection permanente vers la nouvelle URL
          return res.redirect(match.status || 301, match.to + this.preserveQueryParams(req, match));
          
        case 'rewrite':
          // Réécriture interne de l'URL
          req.url = match.to + this.preserveQueryParams(req, match);
          return next();
          
        case 'dynamic':
          // Pour les routes dynamiques (à adapter selon votre logique d'application)
          // Exemple: appel à un contrôleur spécifique
          // Ici on transfère simplement à la route dynamique de Remix
          return res.redirect(302, match.to + this.preserveQueryParams(req, match));
          
        case 'removed':
          // Page supprimée - renvoyer un code 410 Gone
          return res.status(410).send('Cette page a été retirée et n\'est plus disponible.');
          
        default:
          // Type non reconnu, traiter comme une redirection par défaut
          return res.redirect(301, match.to + this.preserveQueryParams(req, match));
      }
    }

    // Route non mappée - journaliser et générer le rapport
    this.logger.warn(`🔍 Route PHP non mappée: ${req.originalUrl}`);
    this.logMissedRoute(req);
    this.generateMissingRoutesReport();
    
    // Option 1: Renvoyer une erreur 410 Gone
    // return res.status(410).send('Cette page a été supprimée ou n\'existe plus.');
    
    // Option 2: Rediriger vers une page "Legacy non migré"
    return res.redirect(302, '/legacy-not-migrated?url=' + encodeURIComponent(req.originalUrl));
    
    // Option 3: Passer au middleware suivant (peut causer un 404 plus tard)
    // return next();
  }

  private preserveQueryParams(req: Request, match: RouteMapping): string {
    // Extraire les paramètres de requête de l'URL originale
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const queryParams = [...url.searchParams.entries()];
    
    // Si aucun paramètre ou pas de paramètres à préserver, retourner une chaîne vide
    if (queryParams.length === 0 || !match.queryParams || match.queryParams.length === 0) {
      return '';
    }
    
    // Construire la nouvelle chaîne de requête en filtrant uniquement les paramètres à préserver
    const newParams = new URLSearchParams();
    
    if (match.queryParams.includes('*')) {
      // Si '*' est spécifié, préserver tous les paramètres
      queryParams.forEach(([key, value]) => {
        newParams.append(key, value);
      });
    } else {
      // Sinon, préserver uniquement les paramètres spécifiés
      queryParams.forEach(([key, value]) => {
        if (match.queryParams.includes(key)) {
          newParams.append(key, value);
        }
      });
    }
    
    const newParamsString = newParams.toString();
    return newParamsString ? `?${newParamsString}` : '';
  }
}