import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { MCPAgent, MCPContext } from '../../../coreDoDotmcp-agent';

interface PhpRouteAuditResult {
  url: string;
  status: 'active' | 'inactive' | 'error';
  statusCode?: number;
  redirectsTo?: string;
  lastChecked: string;
  responseTime?: number;
  errorMessage?: string;
}

export class PhpRouterAudit implements MCPAgent {
  name = 'php-router-audit';
  description = 'Audite les routes PHP actives et génère un rapport';

  async process(context: MCPContext): Promise<any> {
    const {
      htaccessPath,
      baseUrl,
      outputPath,
      routingMapPath,
      checkActive = true,
    } = context.inputs;

    // Valider les entrées
    if (!htaccessPath || !fs.existsSync(htaccessPath)) {
      return {
        success: false,
        error: `Le fichier .htaccess n'existe pas: ${htaccessPath}`,
      };
    }

    const baseUrlToUse = baseUrl || 'http://localhost:3001';

    try {
      // Étape 1: Analyser le fichier .htaccess et extraire les routes PHP
      const phpRoutes = this.extractPhpRoutesFromHtaccess(htaccessPath);

      // Étape 2: Comparer avec le fichier routing_patch.json si fourni
      let existingRoutes = [];
      if (routingMapPath && fs.existsSync(routingMapPath)) {
        existingRoutes = JSON.parse(fs.readFileSync(routingMapPath, 'utf8'));
      }

      // Étape 3: Vérifier l'état actif des routes PHP si demandé
      let auditResults: PhpRouteAuditResult[] = [];
      if (checkActive) {
        auditResults = await this.checkActiveRoutes(phpRoutes, baseUrlToUse);
      }

      // Étape 4: Générer le fichier routing_patch.json si un chemin de sortie est spécifié
      if (outputPath) {
        const routingPatch = this.generateRoutingPatch(phpRoutes, existingRoutes, auditResults);
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(routingPatch, null, 2), 'utf8');
      }

      // Étape 5: Générer un rapport d'audit
      const reportPath = path.join(process.cwd(), 'reports', 'php_routes_audit.md');
      const reportDir = path.dirname(reportPath);

      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const reportContent = this.generateAuditReport(phpRoutes, existingRoutes, auditResults);
      fs.writeFileSync(reportPath, reportContent, 'utf8');

      return {
        success: true,
        data: {
          totalPhpRoutes: phpRoutes.length,
          mappedRoutes: existingRoutes.length,
          unmappedRoutes:
            phpRoutes.length - existingRoutes.filter((r) => phpRoutes.includes(r.from)).length,
          activeRoutes: auditResults.filter((r) => r.status === 'active').length,
          inactiveRoutes: auditResults.filter((r) => r.status === 'inactive').length,
          errorRoutes: auditResults.filter((r) => r.status === 'error').length,
          reportPath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'audit des routes PHP: ${error.message}`,
      };
    }
  }

  private extractPhpRoutesFromHtaccess(htaccessPath: string): string[] {
    const content = fs.readFileSync(htaccessPath, 'utf8');
    const routes: string[] = [];

    // Rechercher toutes les références à des fichiers .php
    const phpReferences = content.match(/\.php(\?[^'\s\]]+)?/g) || [];

    // Extraire les routes PHP uniques
    const uniqueRoutes = new Set<string>();

    phpReferences.forEach((ref) => {
      // Obtenir le nom de fichier PHP complet
      const phpFileMatch = ref.match(/([a-zA-Z0-9_\-\/]+\.php)(\?[^'\s\]]+)?/);
      if (phpFileMatch) {
        const phpFile = phpFileMatch[1];
        if (phpFile.startsWith('/')) {
          uniqueRoutes.add(phpFile);
        } else {
          uniqueRoutes.add(`/${phpFile}`);
        }
      }
    });

    // Ajouter également les règles de réécriture qui ciblent des fichiers PHP
    const rewriteRules = content.match(/RewriteRule\s+[^\s]+\s+([^\s]+)(\s+\[[^\]]+\])?/g) || [];

    rewriteRules.forEach((rule) => {
      const targetMatch = rule.match(/RewriteRule\s+[^\s]+\s+([^\s]+)/);
      if (targetMatch) {
        const target = targetMatch[1];
        if (target.includes('.php')) {
          const phpFileMatch = target.match(/([a-zA-Z0-9_\-\/]+\.php)(\?[^'\s\]]+)?/);
          if (phpFileMatch) {
            const phpFile = phpFileMatch[1];
            if (phpFile.startsWith('/')) {
              uniqueRoutes.add(phpFile);
            } else {
              uniqueRoutes.add(`/${phpFile}`);
            }
          }
        }
      }
    });

    // Ajouter des routes PHP communes qui pourraient ne pas être mentionnées
    const commonPhpRoutes = [
      '/index.php',
      '/login.php',
      '/register.php',
      '/contact.php',
      '/profile.php',
      '/admin.php',
      '/search.php',
      '/cart.php',
      '/checkout.php',
      '/product.php',
      '/category.php',
      '/api.php',
    ];

    commonPhpRoutes.forEach((route) => {
      uniqueRoutes.add(route);
    });

    return Array.from(uniqueRoutes);
  }

  private async checkActiveRoutes(
    routes: string[],
    baseUrl: string
  ): Promise<PhpRouteAuditResult[]> {
    const results: PhpRouteAuditResult[] = [];

    for (const route of routes) {
      const url = `${baseUrl}${route}`;
      const now = new Date().toISOString();

      try {
        const startTime = Date.now();
        const response = await axios.get(url, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 600,
        });
        const responseTime = Date.now() - startTime;

        if (response.status >= 200 && response.status < 400) {
          results.push({
            url: route,
            status: 'active',
            statusCode: response.status,
            lastChecked: now,
            responseTime,
          });
        } else if (response.status >= 400 && response.status < 500) {
          results.push({
            url: route,
            status: 'inactive',
            statusCode: response.status,
            lastChecked: now,
            responseTime,
          });
        } else {
          results.push({
            url: route,
            status: 'error',
            statusCode: response.status,
            lastChecked: now,
            responseTime,
            errorMessage: `Statut HTTP inattendu: ${response.status}`,
          });
        }
      } catch (error) {
        // Traiter spécifiquement les redirections
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          results.push({
            url: route,
            status: 'active',
            statusCode: error.response.status,
            redirectsTo: error.response.headers.location,
            lastChecked: now,
            responseTime: null,
          });
        } else {
          results.push({
            url: route,
            status: 'error',
            lastChecked: now,
            errorMessage: error.message,
          });
        }
      }
    }

    return results;
  }

  private generateRoutingPatch(
    phpRoutes: string[],
    existingRoutes: any[],
    auditResults: PhpRouteAuditResult[]
  ): any[] {
    const routingPatch = [...existingRoutes];
    const existingPaths = new Set(existingRoutes.map((r) => r.from));

    // Ajouter les routes manquantes
    phpRoutes.forEach((route) => {
      if (!existingPaths.has(route)) {
        // Vérifier si la route est active d'après l'audit
        const auditResult = auditResults.find((r) => r.url === route);
        const isActive = auditResult && auditResult.status === 'active';

        // Déterminer la cible de la redirection pour les routes actives
        let target = route.replace(/\.php$/, '');
        if (target === '/index') target = '/';

        // Si c'est une redirection, utiliser la cible de la redirection
        if (auditResult && auditResult.redirectsTo) {
          target = auditResult.redirectsTo;
        }

        // Créer l'entrée de mappage
        const routeEntry = {
          from: route,
          to: target,
          type: isActive ? 'rewrite' : 'removed',
          status: isActive ? 200 : 410,
          description: `Route PHP ${isActive ? 'active' : 'inactive'} détectée automatiquement`,
        };

        routingPatch.push(routeEntry);
        existingPaths.add(route);
      }
    });

    return routingPatch;
  }

  private generateAuditReport(
    phpRoutes: string[],
    existingRoutes: any[],
    auditResults: PhpRouteAuditResult[]
  ): string {
    const now = new Date().toLocaleString();
    const existingPaths = new Set(existingRoutes.map((r) => r.from));

    let report = `# Rapport d'audit des routes PHP\n\n`;
    report += `_Généré le: ${now}_\n\n`;

    // Résumé
    report += `## Résumé\n\n`;
    report += `- **Routes PHP détectées**: ${phpRoutes.length}\n`;
    report += `- **Routes déjà mappées**: ${existingRoutes.length}\n`;
    report += `- **Routes à mapper**: ${phpRoutes.filter((r) => !existingPaths.has(r)).length}\n`;

    if (auditResults.length > 0) {
      const activeRoutes = auditResults.filter((r) => r.status === 'active').length;
      const inactiveRoutes = auditResults.filter((r) => r.status === 'inactive').length;
      const errorRoutes = auditResults.filter((r) => r.status === 'error').length;

      report += `- **Routes actives**: ${activeRoutes}\n`;
      report += `- **Routes inactives**: ${inactiveRoutes}\n`;
      report += `- **Routes en erreur**: ${errorRoutes}\n`;
    }

    report += `\n## Détail des routes\n\n`;

    // Tableau des routes
    report += `| Route PHP | État | Code | Mappage | Redirection | Temps de réponse |\n`;
    report += `| --------- | ---- | ---- | ------- | ----------- | ---------------- |\n`;

    phpRoutes.forEach((route) => {
      const existingRoute = existingRoutes.find((r) => r.from === route);
      const auditResult = auditResults.find((r) => r.url === route);

      const mappingStatus = existingRoute
        ? `✅ ${existingRoute.to} (${existingRoute.type})`
        : '❌ Non mappé';

      let status = '❓ Inconnu';
      let statusCode = '';
      let redirect = '';
      let responseTime = '';

      if (auditResult) {
        status =
          auditResult.status === 'active'
            ? '✅ Actif'
            : auditResult.status === 'inactive'
              ? '❌ Inactif'
              : '⚠️ Erreur';
        statusCode = auditResult.statusCode ? auditResult.statusCode.toString() : '';
        redirect = auditResult.redirectsTo || '';
        responseTime = auditResult.responseTime ? `${auditResult.responseTime}ms` : '';
      }

      report += `| ${route} | ${status} | ${statusCode} | ${mappingStatus} | ${redirect} | ${responseTime} |\n`;
    });

    // Recommandations
    report += `\n## Recommandations\n\n`;

    // Routes non mappées et actives
    const unmappedActiveRoutes = phpRoutes.filter((route) => {
      const existingRoute = existingRoutes.find((r) => r.from === route);
      const auditResult = auditResults.find((r) => r.url === route);
      return !existingRoute && auditResult && auditResult.status === 'active';
    });

    if (unmappedActiveRoutes.length > 0) {
      report += `### Routes actives non mappées\n\n`;
      report += `Les routes suivantes sont actives mais ne sont pas encore mappées dans routing_patch.json :\n\n`;

      unmappedActiveRoutes.forEach((route) => {
        report += `- \`${route}\`: Ajouter un mappage vers une nouvelle route Remix\n`;
      });

      report += `\n`;
    }

    // Routes avec redirections
    const redirectRoutes = auditResults.filter((r) => r.redirectsTo);

    if (redirectRoutes.length > 0) {
      report += `### Routes avec redirections\n\n`;
      report += `Les routes suivantes redirigent déjà vers d'autres URLs :\n\n`;

      redirectRoutes.forEach((route) => {
        report += `- \`${route.url}\` → \`${route.redirectsTo}\` (${route.statusCode})\n`;
      });

      report += `\n`;
    }

    // Routes inactives
    const inactiveRoutes = auditResults.filter((r) => r.status === 'inactive');

    if (inactiveRoutes.length > 0) {
      report += `### Routes inactives\n\n`;
      report += `Les routes suivantes semblent inactives (code 4xx) :\n\n`;

      inactiveRoutes.forEach((route) => {
        report += `- \`${route.url}\` (${route.statusCode}): Envisager une redirection 410 Gone\n`;
      });

      report += `\n`;
    }

    // Routes en erreur
    const errorRoutes = auditResults.filter((r) => r.status === 'error');

    if (errorRoutes.length > 0) {
      report += `### Routes en erreur\n\n`;
      report += `Les routes suivantes ont généré des erreurs lors de l'audit :\n\n`;

      errorRoutes.forEach((route) => {
        report += `- \`${route.url}\`: ${route.errorMessage}\n`;
      });

      report += `\n`;
    }

    report += `## Intégration à NestJS\n\n`;
    report += `Pour intégrer ces routes au middleware NestJS, assurez-vous que :\n\n`;
    report += `1. Le fichier \`routing_patch.json\` est à jour\n`;
    report += `2. Le middleware \`LegacyPhpRedirectMiddleware\` est configuré dans votre application\n`;
    report += `3. Les routes de type \`rewrite\` pointent vers des routes Remix valides\n`;
    report += `4. Toutes les routes actives sont correctement gérées\n\n`;

    report += `Pour tester le middleware, essayez d'accéder à ces routes PHP et vérifiez le comportement.\n`;

    return report;
  }
}

export default new PhpRouterAudit();
