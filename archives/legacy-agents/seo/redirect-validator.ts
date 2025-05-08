/**
 * Validateur de redirections SEO
 * 
 * Ce module permet de valider les redirections SEO lors d'une migration
 * depuis un système legacy PHP vers une architecture moderne TypeScript/Remix/NestJS.
 * Il vérifie que les anciennes URLs redirigent correctement vers les nouvelles,
 * ce qui est essentiel pour préserver le SEO lors d'une migration.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';

/**
 * Types de redirection pris en charge
 */
export enum RedirectType {
    PERMANENT = 301,    // Redirection permanente
    FOUND = 302,        // Redirection temporaire
    SEE_OTHER = 303,    // Redirection "voir autre"
    GONE = 410,         // Ressource supprimée définitivement
    PRECONDITION = 412, // Précondition échouée
}

/**
 * États de validation d'une redirection
 */
export enum RedirectStatus {
    SUCCESS = 'success',      // La redirection fonctionne comme prévu
    INVALID = 'invalid',      // La redirection ne fonctionne pas correctement
    WRONG_TARGET = 'wrong_target',  // La redirection pointe vers une URL incorrecte
    ERROR = 'error',          // Une erreur s'est produite lors de la validation
    NOT_FOUND = 'not_found',  // La source n'existe pas
    NOT_TESTED = 'not_tested' // La redirection n'a pas encore été testée
}

/**
 * Configuration d'une redirection
 */
export interface RedirectConfig {
    source: string;           // URL source (ancienne)
    target: string;           // URL cible (nouvelle)
    type: RedirectType;       // Type de redirection HTTP
    regex?: boolean;          // Si la source est une expression régulière
}

/**
 * Structure pour les règles de redirection utilisée par test-redirects.ts
 */
export interface RedirectRule {
    source: string;           // URL source (ancienne)
    destination?: string;     // URL destination (nouvelle)
    statusCode: number;       // Code de statut HTTP attendu
    isRegex?: boolean;        // Si la source est une expression régulière
}

/**
 * Options de chargement pour les redirections
 */
export interface RedirectLoadOptions {
    baseUrl: string;          // URL de base pour les tests
    includeRegex?: boolean;   // Si les règles avec expressions régulières doivent être incluses
}

/**
 * Source de redirection pour test-redirects.ts
 */
export enum RedirectSource {
    HTACCESS = 'htaccess',
    JSON = 'json',
    NGINX = 'nginx',
    CUSTOM = 'custom'
}

/**
 * Résultat de validation d'une redirection
 */
export interface RedirectValidationResult {
    source: string;           // URL source testée
    target: string;           // URL cible attendue
    expectedType: RedirectType; // Type de redirection attendu
    actualType?: number;      // Code de statut HTTP réel
    actualTarget?: string;    // URL cible réelle (après redirection)
    status: RedirectStatus;   // État de la validation
    error?: string;           // Message d'erreur (le cas échéant)
}

/**
 * Schéma de validation pour une redirection
 */
export const RedirectConfigSchema = z.object({
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.nativeEnum(RedirectType),
    regex: z.boolean().optional().default(false)
});

/**
 * Options du validateur de redirections
 */
export interface RedirectValidatorOptions {
    baseUrl: string;          // URL de base pour les tests
    timeout?: number;         // Délai d'attente pour les requêtes HTTP (ms)
    followRedirects?: boolean; // Si axios doit suivre automatiquement les redirections
    outputDir?: string;       // Répertoire pour les rapports
    headers?: Record<string, string>; // En-têtes HTTP personnalisés
    maxRedirects?: number;    // Nombre maximal de redirections à suivre
}

/**
 * Validateur de redirections SEO
 */
export class RedirectValidator {
    private readonly options: Required<RedirectValidatorOptions>;
    private redirects: RedirectConfig[] = [];

    /**
     * Constructeur du validateur de redirections
     */
    constructor(options: RedirectValidatorOptions) {
        this.options = {
            timeout: 5000,
            followRedirects: false,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'RedirectValidator/1.0',
            },
            outputDir: './redirect-validation-reports',
            ...options
        };
    }

    /**
     * Ajoute une redirection à valider
     */
    addRedirect(redirect: RedirectConfig): void {
        try {
            const validatedRedirect = RedirectConfigSchema.parse(redirect);
            this.redirects.push(validatedRedirect);
        } catch (error) {
            console.error('Invalid redirect configuration:', error);
            throw new Error(`Invalid redirect configuration: ${JSON.stringify(redirect)}`);
        }
    }

    /**
     * Ajoute plusieurs redirections à valider
     */
    addRedirects(redirects: RedirectConfig[]): void {
        redirects.forEach(redirect => this.addRedirect(redirect));
    }

    /**
     * Charge les redirections depuis un fichier JSON
     */
    async loadRedirectsFromFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            if (Array.isArray(data)) {
                this.addRedirects(data);
            } else if (data.redirects && Array.isArray(data.redirects)) {
                this.addRedirects(data.redirects);
            } else {
                throw new Error('Invalid redirects file format');
            }
        } catch (error) {
            console.error(`Error loading redirects from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Charge les redirections depuis un fichier .htaccess
     */
    async loadRedirectsFromHtaccess(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const redirects: RedirectConfig[] = [];

            // Recherche des règles de redirection dans le fichier .htaccess
            const redirectRegex = /Redirect\s+(\d+)\s+([^\s]+)\s+([^\s]+)/gi;
            const rewriteRegex = /RewriteRule\s+([^\s]+)\s+([^\s]+)\s+\[.*?R=(\d+).*?\]/gi;

            // Traitement des règles Redirect
            let match;
            while ((match = redirectRegex.exec(content)) !== null) {
                const type = parseInt(match[1], 10);
                redirects.push({
                    source: match[2],
                    target: match[3],
                    type: type as RedirectType,
                });
            }

            // Traitement des règles RewriteRule avec redirection
            while ((match = rewriteRegex.exec(content)) !== null) {
                const type = parseInt(match[3], 10);
                redirects.push({
                    source: match[1],
                    target: match[2],
                    type: type as RedirectType,
                    regex: true
                });
            }

            this.addRedirects(redirects);
        } catch (error) {
            console.error(`Error loading redirects from htaccess ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Charge les redirections depuis un fichier de configuration NGINX
     */
    async loadRedirectsFromNginx(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const redirects: RedirectConfig[] = [];

            // Recherche des règles de redirection dans le fichier NGINX
            const redirectRegex = /return\s+(\d+)\s+([^;]+);/gi;
            const rewriteRegex = /rewrite\s+([^\s]+)\s+([^\s]+)\s+permanent;/gi;
            const rewriteTempRegex = /rewrite\s+([^\s]+)\s+([^\s]+)\s+redirect;/gi;

            // Traitement des règles return
            let match;
            while ((match = redirectRegex.exec(content)) !== null) {
                const type = parseInt(match[1], 10);
                const target = match[2].trim().replace(/\$request_uri$/, '');

                // Extraire la source du bloc location
                const locationBlockRegex = new RegExp(`location\\s+([^\\s{]+)\\s*{[^}]*return\\s+${type}\\s+${target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
                const locationMatch = locationBlockRegex.exec(content);

                if (locationMatch) {
                    redirects.push({
                        source: locationMatch[1],
                        target: target.replace(/"/g, ''),
                        type: type as RedirectType,
                    });
                }
            }

            // Traitement des règles rewrite permanent
            while ((match = rewriteRegex.exec(content)) !== null) {
                redirects.push({
                    source: match[1],
                    target: match[2],
                    type: RedirectType.PERMANENT,
                    regex: true
                });
            }

            // Traitement des règles rewrite temporaires
            while ((match = rewriteTempRegex.exec(content)) !== null) {
                redirects.push({
                    source: match[1],
                    target: match[2],
                    type: RedirectType.FOUND,
                    regex: true
                });
            }

            this.addRedirects(redirects);
        } catch (error) {
            console.error(`Error loading redirects from NGINX config ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Valide une redirection individuelle
     */
    async validateRedirect(redirect: RedirectConfig): Promise<RedirectValidationResult> {
        const sourceUrl = redirect.source.startsWith('http')
            ? redirect.source
            : `${this.options.baseUrl}${redirect.source}`;

        let targetUrl = redirect.target;
        if (!targetUrl.startsWith('http') && !targetUrl.startsWith('/')) {
            targetUrl = `/${targetUrl}`;
        }
        if (!targetUrl.startsWith('http')) {
            targetUrl = `${this.options.baseUrl}${targetUrl}`;
        }

        const result: RedirectValidationResult = {
            source: sourceUrl,
            target: targetUrl,
            expectedType: redirect.type,
            status: RedirectStatus.NOT_TESTED
        };

        try {
            // Effectuer la requête sans suivre les redirections
            const response = await axios.get(sourceUrl, {
                maxRedirects: 0,
                validateStatus: () => true,
                timeout: this.options.timeout,
                headers: this.options.headers
            });

            result.actualType = response.status;

            // Vérification du code de statut HTTP
            if (response.status === redirect.type) {
                if (response.status === RedirectType.GONE) {
                    // Pour les ressources supprimées (410), nous n'attendons pas de redirection
                    result.status = RedirectStatus.SUCCESS;
                } else if ([RedirectType.PERMANENT, RedirectType.FOUND, RedirectType.SEE_OTHER].includes(response.status)) {
                    // Pour les redirections, vérifier l'en-tête Location
                    const location = response.headers.location;
                    if (location) {
                        result.actualTarget = location;

                        // Normaliser les URLs pour la comparaison
                        const normalizedActual = this.normalizeUrl(location);
                        const normalizedExpected = this.normalizeUrl(targetUrl);

                        if (normalizedActual === normalizedExpected) {
                            result.status = RedirectStatus.SUCCESS;
                        } else {
                            result.status = RedirectStatus.WRONG_TARGET;
                            result.error = `Expected redirect to ${targetUrl}, but got ${location}`;
                        }
                    } else {
                        result.status = RedirectStatus.INVALID;
                        result.error = `Status code ${response.status} indicates a redirect, but no Location header found`;
                    }
                } else {
                    result.status = RedirectStatus.SUCCESS;
                }
            } else {
                result.status = RedirectStatus.INVALID;
                result.error = `Expected status code ${redirect.type}, but got ${response.status}`;
            }
        } catch (error) {
            result.status = RedirectStatus.ERROR;
            if (error.response) {
                result.actualType = error.response.status;
                result.error = `HTTP error: ${error.response.status} ${error.response.statusText}`;
            } else if (error.request) {
                result.error = `Request error: No response received (timeout or CORS issue)`;
            } else {
                result.error = `Error: ${error.message}`;
            }
        }

        return result;
    }

    /**
     * Normalise une URL pour la comparaison
     */
    private normalizeUrl(url: string): string {
        // Supprime les paramètres de requête et les fragments
        let normalized = url.split(/[?#]/)[0];

        // Supprime les barres obliques de fin
        normalized = normalized.replace(/\/+$/, '');

        // Assure-toi que les URL relatives commencent par /
        if (!normalized.startsWith('http') && !normalized.startsWith('/')) {
            normalized = `/${normalized}`;
        }

        return normalized;
    }

    /**
     * Valide toutes les redirections configurées
     */
    async validateAll(): Promise<RedirectValidationResult[]> {
        const results: RedirectValidationResult[] = [];

        for (const redirect of this.redirects) {
            const result = await this.validateRedirect(redirect);
            results.push(result);
        }

        // Si un répertoire de sortie est spécifié, enregistrer le rapport
        if (this.options.outputDir) {
            await this.saveReport(results);
        }

        return results;
    }

    /**
     * Enregistre le rapport de validation des redirections
     */
    private async saveReport(results: RedirectValidationResult[]): Promise<void> {
        try {
            await fs.mkdir(this.options.outputDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportPath = path.join(this.options.outputDir, `redirect-validation-${timestamp}.json`);

            const report = {
                timestamp: new Date().toISOString(),
                baseUrl: this.options.baseUrl,
                totalRedirects: results.length,
                successCount: results.filter(r => r.status === RedirectStatus.SUCCESS).length,
                failureCount: results.filter(r => r.status !== RedirectStatus.SUCCESS).length,
                results
            };

            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`Redirect validation report saved to ${reportPath}`);

            // Générer également un rapport HTML pour une meilleure lisibilité
            const htmlReportPath = path.join(this.options.outputDir, `redirect-validation-${timestamp}.html`);
            await this.generateHtmlReport(report, htmlReportPath);
        } catch (error) {
            console.error('Error saving redirect validation report:', error);
        }
    }

    /**
     * Génère un rapport HTML pour les redirections
     */
    private async generateHtmlReport(
        report: {
            timestamp: string;
            baseUrl: string;
            totalRedirects: number;
            successCount: number;
            failureCount: number;
            results: RedirectValidationResult[];
        },
        outputPath: string
    ): Promise<void> {
        const getStatusBadge = (status: RedirectStatus): string => {
            switch (status) {
                case RedirectStatus.SUCCESS:
                    return '<span class="badge success">Succès</span>';
                case RedirectStatus.INVALID:
                    return '<span class="badge error">Invalide</span>';
                case RedirectStatus.WRONG_TARGET:
                    return '<span class="badge warning">Cible incorrecte</span>';
                case RedirectStatus.ERROR:
                    return '<span class="badge error">Erreur</span>';
                case RedirectStatus.NOT_FOUND:
                    return '<span class="badge error">Non trouvé</span>';
                default:
                    return '<span class="badge">Non testé</span>';
            }
        };

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de validation des redirections SEO</title>
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
  </style>
</head>
<body>
  <h1>Rapport de validation des redirections SEO</h1>
  <div class="summary">
    <p><strong>Date :</strong> ${report.timestamp}</p>
    <p><strong>URL de base :</strong> ${report.baseUrl}</p>
    <p><strong>Total des redirections :</strong> ${report.totalRedirects}</p>
    <p><strong>Réussies :</strong> ${report.successCount} (${Math.round(report.successCount / report.totalRedirects * 100)}%)</p>
    <p><strong>Échouées :</strong> ${report.failureCount} (${Math.round(report.failureCount / report.totalRedirects * 100)}%)</p>
  </div>

  <h2>Résultats détaillés</h2>
  <table>
    <thead>
      <tr>
        <th>Source</th>
        <th>Cible attendue</th>
        <th>Type attendu</th>
        <th>Statut</th>
        <th>Détails</th>
      </tr>
    </thead>
    <tbody>
      ${report.results.map(result => `
        <tr>
          <td>${result.source}</td>
          <td>${result.target}</td>
          <td>${result.expectedType}</td>
          <td>${getStatusBadge(result.status)}</td>
          <td>
            ${result.status !== RedirectStatus.SUCCESS ? `
              <div class="details">
                ${result.error || ''}
                ${result.actualType ? `<br>Code obtenu : ${result.actualType}` : ''}
                ${result.actualTarget ? `<br>Cible obtenue : ${result.actualTarget}` : ''}
              </div>
            ` : 'OK'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

        await fs.writeFile(outputPath, html);
        console.log(`HTML redirect validation report saved to ${outputPath}`);
    }

    /**
     * Exporte les redirections au format Caddyfile
     * Cette fonction permet de convertir les redirections validées en format Caddyfile
     */
    async exportToCaddyfile(outputPath: string): Promise<void> {
        try {
            let caddyfileContent = "# Redirections générées automatiquement\n\n";

            for (const redirect of this.redirects) {
                const sourcePath = redirect.source.replace(/^\//, '');
                let targetPath = redirect.target;

                if (!targetPath.startsWith('http')) {
                    targetPath = '{scheme}://{host}' + (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
                }

                if (redirect.regex) {
                    // Pour les règles regex, utiliser la syntaxe @match
                    const matcherName = `redirect_${sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    caddyfileContent += `@${matcherName} path_regexp ${matcherName} ${sourcePath}\n`;

                    switch (redirect.type) {
                        case RedirectType.PERMANENT:
                            caddyfileContent += `redir @${matcherName} ${targetPath} permanent\n\n`;
                            break;
                        case RedirectType.FOUND:
                            caddyfileContent += `redir @${matcherName} ${targetPath} temporary\n\n`;
                            break;
                        case RedirectType.GONE:
                            caddyfileContent += `respond @${matcherName} 410\n\n`;
                            break;
                        default:
                            caddyfileContent += `redir @${matcherName} ${targetPath} ${redirect.type}\n\n`;
                    }
                } else {
                    // Pour les règles simples
                    switch (redirect.type) {
                        case RedirectType.PERMANENT:
                            caddyfileContent += `redir /${sourcePath} ${targetPath} permanent\n`;
                            break;
                        case RedirectType.FOUND:
                            caddyfileContent += `redir /${sourcePath} ${targetPath} temporary\n`;
                            break;
                        case RedirectType.GONE:
                            caddyfileContent += `/${sourcePath} {\n  respond 410\n}\n`;
                            break;
                        default:
                            caddyfileContent += `redir /${sourcePath} ${targetPath} ${redirect.type}\n`;
                    }
                }
            }

            await fs.writeFile(outputPath, caddyfileContent);
            console.log(`Redirects exported to Caddyfile at ${outputPath}`);
        } catch (error) {
            console.error(`Error exporting redirects to Caddyfile:`, error);
            throw error;
        }
    }
}

export default RedirectValidator;