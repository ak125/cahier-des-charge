/**
 * Générateur de Caddyfile
 * 
 * Ce module permet de générer un fichier de configuration Caddy (Caddyfile)
 * à partir de configurations NGINX ou .htaccess existantes.
 * 
 * Caddy est un serveur web moderne avec HTTPS automatique via Let's Encrypt,
 * support HTTP/3, et une configuration simplifiée parfaite pour les applications modernes.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { RedirectConfig, RedirectType } from './redirect-validator';

/**
 * Types de serveurs web source pour la migration
 */
export enum ServerType {
    NGINX = 'nginx',
    APACHE = 'apache',
    HTACCESS = 'htaccess',
}

/**
 * Type de proxy pour la configuration Caddy
 */
export enum ProxyType {
    HTTP = 'http',
    FASTCGI = 'fastcgi',
    UNIX_SOCKET = 'unix',
}

/**
 * Configuration pour la génération de Caddyfile
 */
export interface CaddyfileConfig {
    domains: string[];
    root?: string;
    phpVersion?: string;
    proxyPass?: {
        path: string;
        target: string;
        type: ProxyType;
    }[];
    redirects?: RedirectConfig[];
    additionalConfig?: string;
    automaticHTTPS?: boolean;
    compressionEnabled?: boolean;
    headerSecurity?: boolean;
    logPath?: string;
    useGzip?: boolean;
    useBrotli?: boolean;
    customDirectives?: Record<string, string>;
}

/**
 * Configuration de sécurité pour les en-têtes HTTP
 */
export interface SecurityHeadersConfig {
    xFrameOptions?: string;
    xContentTypeOptions?: boolean;
    xXssProtection?: boolean;
    contentSecurityPolicy?: string;
    strictTransportSecurity?: {
        maxAge: number;
        includeSubdomains: boolean;
        preload: boolean;
    };
    referrerPolicy?: string;
    permissionsPolicy?: string;
}

/**
 * Options du générateur de Caddyfile
 */
export interface CaddyfileGeneratorOptions {
    indentation?: number;
    outputDir?: string;
    defaultSecurityHeaders?: SecurityHeadersConfig;
}

/**
 * Générateur de Caddyfile
 */
export class CaddyfileGenerator {
    private readonly options: Required<CaddyfileGeneratorOptions>;
    private readonly configs: Map<string, CaddyfileConfig> = new Map();

    /**
     * Constructeur du générateur de Caddyfile
     */
    constructor(options: CaddyfileGeneratorOptions = {}) {
        this.options = {
            indentation: 2,
            outputDir: './generated-caddyfiles',
            defaultSecurityHeaders: {
                xFrameOptions: 'SAMEORIGIN',
                xContentTypeOptions: true,
                xXssProtection: true,
                strictTransportSecurity: {
                    maxAge: 63072000,
                    includeSubdomains: true,
                    preload: false,
                },
                referrerPolicy: 'strict-origin-when-cross-origin',
            },
            ...options,
        };
    }

    /**
     * Ajoute une configuration de site pour le Caddyfile
     */
    addSite(name: string, config: CaddyfileConfig): void {
        this.configs.set(name, config);
    }

    /**
     * Charge une configuration depuis un fichier NGINX
     */
    async loadFromNginx(
        filePath: string,
        siteName: string,
        options: {
            defaultRoot?: string;
            defaultProxyTarget?: string;
        } = {}
    ): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const config: CaddyfileConfig = {
                domains: [],
                root: options.defaultRoot,
                proxyPass: [],
                redirects: [],
            };

            // Extraction du nom de serveur / domaine
            const serverNameRegex = /server_name\s+([^;]+);/gi;
            const serverNameMatch = serverNameRegex.exec(content);
            if (serverNameMatch) {
                config.domains = serverNameMatch[1]
                    .split(' ')
                    .filter(d => d && d !== '_')
                    .map(d => d.trim());
            }

            // Extraction du répertoire racine
            const rootRegex = /root\s+([^;]+);/gi;
            const rootMatch = rootRegex.exec(content);
            if (rootMatch) {
                config.root = rootMatch[1].trim();
            }

            // Extraction des configurations proxy_pass
            const proxyPassRegex = /location\s+([^{]+)\s*{[^}]*proxy_pass\s+([^;]+);/gi;
            let proxyMatch;
            while ((proxyMatch = proxyPassRegex.exec(content)) !== null) {
                const path = proxyMatch[1].trim();
                const target = proxyMatch[2].trim();

                config.proxyPass = config.proxyPass || [];
                config.proxyPass.push({
                    path,
                    target,
                    type: ProxyType.HTTP,
                });
            }

            // Extraction des redirections
            const redirectRegex = /return\s+(\d+)\s+([^;]+);/gi;
            let redirectMatch;
            while ((redirectMatch = redirectRegex.exec(content)) !== null) {
                const type = parseInt(redirectMatch[1], 10) as RedirectType;
                const target = redirectMatch[2].trim();

                // Recherche du bloc location associé
                const locationBlockRegex = new RegExp(`location\\s+([^\\s{]+)\\s*{[^}]*return\\s+${type}\\s+${target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
                const locationMatch = locationBlockRegex.exec(content);

                if (locationMatch) {
                    const source = locationMatch[1].trim();

                    config.redirects = config.redirects || [];
                    config.redirects.push({
                        source,
                        target: target.replace(/"/g, ''),
                        type,
                    });
                }
            }

            // Extraction des réécritures permanentes
            const rewriteRegex = /rewrite\s+([^\s]+)\s+([^\s]+)\s+(permanent|redirect);/gi;
            let rewriteMatch;
            while ((rewriteMatch = rewriteRegex.exec(content)) !== null) {
                const source = rewriteMatch[1].trim();
                const target = rewriteMatch[2].trim();
                const isPermanent = rewriteMatch[3].trim() === 'permanent';

                config.redirects = config.redirects || [];
                config.redirects.push({
                    source,
                    target,
                    type: isPermanent ? RedirectType.PERMANENT : RedirectType.FOUND,
                    regex: true,
                });
            }

            // Extraction de la configuration PHP FastCGI
            const fastcgiRegex = /fastcgi_pass\s+([^;]+);/gi;
            const fastcgiMatch = fastcgiRegex.exec(content);
            if (fastcgiMatch) {
                const target = fastcgiMatch[1].trim();

                // Détection de la version PHP
                const phpVersionMatch = target.match(/php(\d+\.\d+)/i);
                if (phpVersionMatch) {
                    config.phpVersion = phpVersionMatch[1];
                }

                config.proxyPass = config.proxyPass || [];
                config.proxyPass.push({
                    path: '*.php',
                    target,
                    type: ProxyType.FASTCGI,
                });
            }

            // Extraction d'autres configurations importantes
            if (content.includes('gzip on')) {
                config.useGzip = true;
            }

            if (content.includes('add_header Strict-Transport-Security')) {
                config.headerSecurity = true;
            }

            // Ajouter la configuration au générateur
            this.addSite(siteName, config);

        } catch (error) {
            console.error(`Error loading NGINX config from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Charge une configuration depuis un fichier .htaccess
     */
    async loadFromHtaccess(
        filePath: string,
        siteName: string,
        options: {
            domains: string[];
            defaultRoot?: string;
        }
    ): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const config: CaddyfileConfig = {
                domains: options.domains,
                root: options.defaultRoot,
                redirects: [],
            };

            // Extraction du répertoire racine
            const documentRootRegex = /DocumentRoot\s+["']?([^"'\s]+)["']?/i;
            const documentRootMatch = documentRootRegex.exec(content);
            if (documentRootMatch) {
                config.root = documentRootMatch[1].trim();
            }

            // Extraction des redirections simples
            const redirectRegex = /Redirect\s+(\d+)\s+([^\s]+)\s+([^\s]+)/gi;
            let redirectMatch;
            while ((redirectMatch = redirectRegex.exec(content)) !== null) {
                const type = parseInt(redirectMatch[1], 10) as RedirectType;
                const source = redirectMatch[2].trim();
                const target = redirectMatch[3].trim();

                config.redirects = config.redirects || [];
                config.redirects.push({
                    source,
                    target,
                    type,
                });
            }

            // Extraction des règles de réécriture avec redirection
            const rewriteRegex = /RewriteRule\s+([^\s]+)\s+([^\s]+)\s+\[.*?R=(\d+).*?\]/gi;
            let rewriteMatch;
            while ((rewriteMatch = rewriteRegex.exec(content)) !== null) {
                const source = rewriteMatch[1].trim();
                const target = rewriteMatch[2].trim();
                const type = parseInt(rewriteMatch[3], 10) as RedirectType;

                config.redirects = config.redirects || [];
                config.redirects.push({
                    source,
                    target,
                    type,
                    regex: true,
                });
            }

            // Extraction des règles de réécriture sans redirection 
            // (à convertir en handle_path ou route)
            const rewriteRuleNoRedirectRegex = /RewriteRule\s+([^\s]+)\s+([^\s]+)\s+\[(?!.*?R=).*?\]/gi;
            let noRedirectMatch;
            while ((noRedirectMatch = rewriteRuleNoRedirectRegex.exec(content)) !== null) {
                // Ces règles devront être traitées manuellement 
                // ou converties en directives handle_path/route de Caddy
                config.additionalConfig = config.additionalConfig || '';
                config.additionalConfig += `# Converted from .htaccess RewriteRule: ${noRedirectMatch[0]}\n`;
                config.additionalConfig += `# handle_path ${noRedirectMatch[1]} {\n#   rewrite * ${noRedirectMatch[2]}\n# }\n\n`;
            }

            // Extraction de la configuration PHP
            if (content.includes('php_')) {
                config.phpVersion = '7.4'; // Version par défaut, à ajuster selon les besoins
            }

            // Extraction d'autres configurations importantes
            if (content.includes('Header set Content-Security-Policy')) {
                config.headerSecurity = true;
            }

            if (content.includes('Header set Strict-Transport-Security')) {
                config.headerSecurity = true;
            }

            // Ajouter la configuration au générateur
            this.addSite(siteName, config);

        } catch (error) {
            console.error(`Error loading .htaccess from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Génère la configuration des en-têtes de sécurité
     */
    private generateSecurityHeaders(config: SecurityHeadersConfig): string {
        const headers: string[] = [];

        if (config.xFrameOptions) {
            headers.push(`X-Frame-Options "${config.xFrameOptions}"`);
        }

        if (config.xContentTypeOptions) {
            headers.push(`X-Content-Type-Options "nosniff"`);
        }

        if (config.xXssProtection) {
            headers.push(`X-XSS-Protection "1; mode=block"`);
        }

        if (config.contentSecurityPolicy) {
            headers.push(`Content-Security-Policy "${config.contentSecurityPolicy}"`);
        }

        if (config.strictTransportSecurity) {
            const { maxAge, includeSubdomains, preload } = config.strictTransportSecurity;
            let value = `max-age=${maxAge}`;
            if (includeSubdomains) value += '; includeSubDomains';
            if (preload) value += '; preload';
            headers.push(`Strict-Transport-Security "${value}"`);
        }

        if (config.referrerPolicy) {
            headers.push(`Referrer-Policy "${config.referrerPolicy}"`);
        }

        if (config.permissionsPolicy) {
            headers.push(`Permissions-Policy "${config.permissionsPolicy}"`);
        }

        if (headers.length === 0) {
            return '';
        }

        return 'header {\n' +
            headers.map(h => ' '.repeat(this.options.indentation) + h).join('\n') +
            '\n}\n\n';
    }

    /**
     * Génère le Caddyfile pour un site
     */
    generateSiteCaddyfile(siteName: string): string {
        const config = this.configs.get(siteName);
        if (!config) {
            throw new Error(`No configuration found for site: ${siteName}`);
        }

        let caddyfile = '';

        // Domaines
        if (config.domains && config.domains.length > 0) {
            caddyfile += `${config.domains.join(', ')} {\n`;
        } else {
            caddyfile += `:80 {\n`;
        }

        // Répertoire racine
        if (config.root) {
            caddyfile += `${' '.repeat(this.options.indentation)}root * ${config.root}\n\n`;
        }

        // Activation de la compression
        if (config.compressionEnabled !== false) {
            caddyfile += `${' '.repeat(this.options.indentation)}encode `;

            const compressionFormats: string[] = [];
            if (config.useBrotli !== false) compressionFormats.push('br');
            if (config.useGzip !== false) compressionFormats.push('gzip');
            if (compressionFormats.length === 0) compressionFormats.push('gzip');

            caddyfile += `${compressionFormats.join(' ')}\n\n`;
        }

        // Configuration des logs
        if (config.logPath) {
            caddyfile += `${' '.repeat(this.options.indentation)}log {\n`;
            caddyfile += `${' '.repeat(this.options.indentation * 2)}output file ${config.logPath}\n`;
            caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
        }

        // En-têtes de sécurité
        if (config.headerSecurity) {
            caddyfile += `${' '.repeat(this.options.indentation)}${this.generateSecurityHeaders(this.options.defaultSecurityHeaders)}`;
        }

        // Redirections
        if (config.redirects && config.redirects.length > 0) {
            caddyfile += `${' '.repeat(this.options.indentation)}# Redirections\n`;

            for (const redirect of config.redirects) {
                const sourcePath = redirect.source.replace(/^\//, '');
                let targetPath = redirect.target;

                if (!targetPath.startsWith('http')) {
                    targetPath = '{scheme}://{host}' + (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
                }

                if (redirect.regex) {
                    // Pour les règles regex, utiliser la syntaxe @match
                    const matcherName = `redirect_${sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    caddyfile += `${' '.repeat(this.options.indentation)}@${matcherName} path_regexp ${matcherName} ${sourcePath}\n`;

                    switch (redirect.type) {
                        case RedirectType.PERMANENT:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir @${matcherName} ${targetPath} permanent\n\n`;
                            break;
                        case RedirectType.FOUND:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir @${matcherName} ${targetPath} temporary\n\n`;
                            break;
                        case RedirectType.GONE:
                            caddyfile += `${' '.repeat(this.options.indentation)}respond @${matcherName} 410\n\n`;
                            break;
                        default:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir @${matcherName} ${targetPath} ${redirect.type}\n\n`;
                    }
                } else {
                    // Pour les règles simples
                    switch (redirect.type) {
                        case RedirectType.PERMANENT:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir /${sourcePath} ${targetPath} permanent\n`;
                            break;
                        case RedirectType.FOUND:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir /${sourcePath} ${targetPath} temporary\n`;
                            break;
                        case RedirectType.GONE:
                            caddyfile += `${' '.repeat(this.options.indentation)}handle /${sourcePath} {\n`;
                            caddyfile += `${' '.repeat(this.options.indentation * 2)}respond 410\n`;
                            caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
                            break;
                        default:
                            caddyfile += `${' '.repeat(this.options.indentation)}redir /${sourcePath} ${targetPath} ${redirect.type}\n`;
                    }
                }
            }

            caddyfile += '\n';
        }

        // Configuration de proxy
        if (config.proxyPass && config.proxyPass.length > 0) {
            caddyfile += `${' '.repeat(this.options.indentation)}# Configurations de proxy\n`;

            for (const proxy of config.proxyPass) {
                switch (proxy.type) {
                    case ProxyType.HTTP:
                        caddyfile += `${' '.repeat(this.options.indentation)}handle ${proxy.path} {\n`;
                        caddyfile += `${' '.repeat(this.options.indentation * 2)}reverse_proxy ${proxy.target}\n`;
                        caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
                        break;

                    case ProxyType.FASTCGI:
                        caddyfile += `${' '.repeat(this.options.indentation)}handle ${proxy.path} {\n`;
                        caddyfile += `${' '.repeat(this.options.indentation * 2)}php_fastcgi ${proxy.target}\n`;
                        caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
                        break;

                    case ProxyType.UNIX_SOCKET:
                        caddyfile += `${' '.repeat(this.options.indentation)}handle ${proxy.path} {\n`;
                        caddyfile += `${' '.repeat(this.options.indentation * 2)}unix_socket ${proxy.target}\n`;
                        caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
                        break;
                }
            }
        }

        // Configuration PHP si spécifiée
        if (config.phpVersion) {
            caddyfile += `${' '.repeat(this.options.indentation)}# Configuration PHP\n`;
            caddyfile += `${' '.repeat(this.options.indentation)}php_fastcgi unix//run/php/php${config.phpVersion}-fpm.sock\n\n`;
        }

        // Configuration de fichiers statiques
        caddyfile += `${' '.repeat(this.options.indentation)}# Fichiers statiques\n`;
        caddyfile += `${' '.repeat(this.options.indentation)}file_server\n\n`;

        // Directives personnalisées
        if (config.customDirectives) {
            caddyfile += `${' '.repeat(this.options.indentation)}# Directives personnalisées\n`;
            for (const [directive, value] of Object.entries(config.customDirectives)) {
                caddyfile += `${' '.repeat(this.options.indentation)}${directive} ${value}\n`;
            }
            caddyfile += '\n';
        }

        // Configuration supplémentaire
        if (config.additionalConfig) {
            caddyfile += `${' '.repeat(this.options.indentation)}# Configuration supplémentaire\n`;
            caddyfile += config.additionalConfig
                .split('\n')
                .map(line => `${' '.repeat(this.options.indentation)}${line}`)
                .join('\n');
            caddyfile += '\n';
        }

        // Fermeture du bloc de site
        caddyfile += '}\n';

        return caddyfile;
    }

    /**
     * Génère un Caddyfile complet avec tous les sites configurés
     */
    generateFullCaddyfile(): string {
        if (this.configs.size === 0) {
            throw new Error('No site configurations added');
        }

        let caddyfile =
            `# Caddyfile généré automatiquement\n` +
            `# Date de génération: ${new Date().toISOString()}\n\n` +
            `# Configuration globale\n` +
            `{\n` +
            `${' '.repeat(this.options.indentation)}admin off # Désactiver l'interface d'administration pour la production\n` +
            `${' '.repeat(this.options.indentation)}auto_https on # Activation de HTTPS automatique avec Let's Encrypt\n` +
            `${' '.repeat(this.options.indentation)}http_port 80\n` +
            `${' '.repeat(this.options.indentation)}https_port 443\n` +
            `}\n\n`;

        // Générer chaque site
        for (const [name, _] of this.configs) {
            caddyfile += `# Site: ${name}\n`;
            caddyfile += this.generateSiteCaddyfile(name);
            caddyfile += '\n';
        }

        return caddyfile;
    }

    /**
     * Enregistre un Caddyfile généré
     */
    async saveCaddyfile(content: string, fileName: string): Promise<string> {
        try {
            await fs.mkdir(this.options.outputDir, { recursive: true });

            const filePath = path.join(this.options.outputDir, fileName);
            await fs.writeFile(filePath, content);

            console.log(`Caddyfile saved to ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('Error saving Caddyfile:', error);
            throw error;
        }
    }

    /**
     * Génère et enregistre un Caddyfile complet
     */
    async generateAndSave(fileName: string = 'Caddyfile'): Promise<string> {
        const content = this.generateFullCaddyfile();
        return await this.saveCaddyfile(content, fileName);
    }

    /**
     * Génère une structure de site Caddy minimale pour une application moderne 
     * comme Remix/Next.js/NestJS
     */
    generateModernAppTemplate(
        domain: string,
        options: {
            appPort?: number;
            appHost?: string;
            enableTls?: boolean;
            enableGzip?: boolean;
            enableBrotli?: boolean;
            logPath?: string;
            apiPrefix?: string;
            staticPath?: string;
        } = {}
    ): string {
        const {
            appPort = 3000,
            appHost = 'localhost',
            enableTls = true,
            enableGzip = true,
            enableBrotli = true,
            logPath = '/var/log/caddy/access.log',
            apiPrefix = '/api',
            staticPath = '/static'
        } = options;

        let caddyfile = `${domain} {\n`;

        // Compression
        const compressionMethods: string[] = [];
        if (enableBrotli) compressionMethods.push('br');
        if (enableGzip) compressionMethods.push('gzip');

        if (compressionMethods.length > 0) {
            caddyfile += `${' '.repeat(this.options.indentation)}encode ${compressionMethods.join(' ')}\n\n`;
        }

        // Logs
        if (logPath) {
            caddyfile += `${' '.repeat(this.options.indentation)}log {\n`;
            caddyfile += `${' '.repeat(this.options.indentation * 2)}output file ${logPath}\n`;
            caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;
        }

        // En-têtes de sécurité
        caddyfile += `${' '.repeat(this.options.indentation)}${this.generateSecurityHeaders(this.options.defaultSecurityHeaders)}`;

        // Proxy pour l'API
        caddyfile += `${' '.repeat(this.options.indentation)}handle ${apiPrefix}/* {\n`;
        caddyfile += `${' '.repeat(this.options.indentation * 2)}reverse_proxy ${appHost}:${appPort}\n`;
        caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;

        // Servir les fichiers statiques directement
        caddyfile += `${' '.repeat(this.options.indentation)}handle ${staticPath}/* {\n`;
        caddyfile += `${' '.repeat(this.options.indentation * 2)}file_server\n`;
        caddyfile += `${' '.repeat(this.options.indentation * 2)}root * /app/public\n`;
        caddyfile += `${' '.repeat(this.options.indentation)}}\n\n`;

        // Proxy pour l'application principale
        caddyfile += `${' '.repeat(this.options.indentation)}handle * {\n`;
        caddyfile += `${' '.repeat(this.options.indentation * 2)}reverse_proxy ${appHost}:${appPort}\n`;
        caddyfile += `${' '.repeat(this.options.indentation)}}\n`;

        caddyfile += `}\n`;

        return caddyfile;
    }

    /**
     * Crée un template de Caddyfile pour une application moderne
     */
    async createModernAppTemplate(
        domain: string,
        fileName: string,
        options: {
            appPort?: number;
            appHost?: string;
            enableTls?: boolean;
            enableGzip?: boolean;
            enableBrotli?: boolean;
            logPath?: string;
            apiPrefix?: string;
            staticPath?: string;
        } = {}
    ): Promise<string> {
        const content = this.generateModernAppTemplate(domain, options);
        return await this.saveCaddyfile(content, fileName);
    }
}

export default CaddyfileGenerator;