/**
 * caddy-generator-2.0.ts
 * 
 * Générateur de configuration Caddy 2.0 avec migration intelligente depuis NGINX
 * ou .htaccess et support Let's Encrypt automatique.
 * 
 * Avantages:
 * - HTTPS automatique avec Let's Encrypt intégré sans configuration
 * - HTTP/3, compression, en-têtes de sécurité par défaut
 * - Syntaxe simple parfaite pour générer dynamiquement avec un agent
 * - Adapté aux microservices et aux applications Remix
 * 
 * Date: 2 mai 2025
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { AgentContext } from '../core/interfaces';
import { MCPAgent } from '../core/interfaces';
import { BaseAgent } from '../core/base-agent';

const execAsync = promisify(exec);

/**
 * Structure d'une route dans le Caddyfile
 */
interface RouteConfig {
    path: string;
    type: 'proxy' | 'static' | 'redirect' | 'rewrite' | 'respond';
    target?: string;
    status?: number;
    headers?: Record<string, string>;
    options?: Record<string, any>;
    matcher?: string;
}

/**
 * Structure d'une configuration TLS
 */
interface TLSConfig {
    type: 'auto' | 'internal' | 'manual';
    certFile?: string;
    keyFile?: string;
    wildcard?: boolean;
    email?: string;
    staging?: boolean;
}

/**
 * Structure d'un serveur dans le Caddyfile
 */
interface ServerConfig {
    domain: string;
    routes: RouteConfig[];
    tls?: TLSConfig;
    headers?: Record<string, string>;
    customBlocks?: string[];
    microservice?: boolean;
    appType?: 'remix' | 'react' | 'vue' | 'next' | 'static' | 'api';
}

/**
 * Structure de config NGINX pour la conversion
 */
interface NginxConfig {
    servers: NginxServer[];
    upstreams?: Record<string, string[]>;
    globals?: Record<string, string>;
}

/**
 * Structure d'un serveur NGINX pour la conversion
 */
interface NginxServer {
    serverName: string[];
    listen: string[];
    root?: string;
    ssl?: boolean;
    sslCertificate?: string;
    sslCertificateKey?: string;
    locations: NginxLocation[];
}

/**
 * Structure d'une location NGINX pour la conversion
 */
interface NginxLocation {
    path: string;
    isRegex: boolean;
    proxyPass?: string;
    rewrite?: string[];
    return?: string;
    alias?: string;
    try_files?: string[];
    headers?: Record<string, string>;
}

/**
 * Configuration du générateur de Caddyfile
 */
interface CaddyGeneratorConfig {
    // Chemins d'entrée
    input: {
        nginxConfigPaths?: string[];
        htaccessPaths?: string[];
        existingCaddyfilePath?: string;
    };

    // Chemins de sortie
    output: {
        caddyfilePath: string;
        dockerComposePath?: string;
    };

    // Options globales
    globalOptions?: {
        logLevel?: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
        enableAdmin?: boolean;
        adminAddr?: string;
        enableTelemetry?: boolean;
        email?: string;
    };

    // Configuration par défaut pour Let's Encrypt
    tls?: {
        email?: string;
        useStaging?: boolean;
        wildcardDomains?: string[];
        selfSigned?: boolean;
    };

    // Configuration Docker Compose
    dockerCompose?: {
        generate: boolean;
        networkName?: string;
        caddyVersion?: string;
        includeServices?: boolean;
        exposePorts?: number[];
    };

    // Options avancées
    advanced?: {
        validateConfig?: boolean;
        autoReload?: boolean;
        microfrontends?: boolean;
        http3?: boolean;
        compression?: boolean;
        security?: {
            strictTransportSecurity?: boolean;
            contentSecurityPolicy?: string;
            frameOptions?: string;
        };
    };

    // Options pour microservices
    microservices?: {
        enabled: boolean;
        services?: {
            name: string;
            host: string;
            port: number;
            pathPrefix?: string;
        }[];
    };
}

/**
 * CaddyfileGenerator 2.0
 * 
 * Agent MCP pour générer un Caddyfile à partir de configurations Nginx et .htaccess
 * avec support Let's Encrypt automatique, validation intégrée et support pour microservices
 */
export class CaddyGenerator20 extends BaseAgent implements MCPAgent {
    name = 'CaddyfileGenerator';
    version = '2.0.0';
    description = 'Génère un Caddyfile avec support Let\'s Encrypt automatique et migration intelligente depuis NGINX/.htaccess';

    private config!: CaddyGeneratorConfig;
    private convertedRules: Map<string, { type: 'nginx' | 'htaccess', caddyRules: string }> = new Map();
    private serverConfigs: ServerConfig[] = [];

    /**
     * Initialise l'agent avec la configuration
     */
    async initialize(context: AgentContext): Promise<void> {
        this.config = context.getConfig<CaddyGeneratorConfig>();

        // Valider et compléter la configuration
        if (!this.config.input) this.config.input = {} as any;
        if (!this.config.output) {
            throw new Error('Configuration de sortie manquante');
        }

        // Configuration par défaut pour Let's Encrypt
        if (!this.config.tls) {
            this.config.tls = {
                email: this.config.globalOptions?.email || 'admin@example.com',
                useStaging: false
            };
        }

        // Options avancées par défaut
        if (!this.config.advanced) {
            this.config.advanced = {
                validateConfig: true,
                autoReload: true,
                microfrontends: false,
                http3: true,
                compression: true,
            };
        }

        context.logger.info(`CaddyfileGenerator 2.0 initialisé avec succès`);
    }

    /**
     * Exécute l'agent pour générer le Caddyfile
     */
    async execute(context: AgentContext): Promise<void> {
        context.logger.info(`Génération du Caddyfile avec CaddyfileGenerator ${this.version}...`);

        // Étape 1: Conversion des configurations NGINX
        this.serverConfigs = [];
        if (this.config.input.nginxConfigPaths && this.config.input.nginxConfigPaths.length > 0) {
            for (const nginxPath of this.config.input.nginxConfigPaths) {
                try {
                    context.logger.info(`Analyse de la configuration NGINX: ${nginxPath}`);
                    const nginxContent = fs.readFileSync(nginxPath, 'utf-8');
                    const nginxConfig = await this.parseNginxConfig(nginxContent);
                    const serverConfigs = await this.convertNginxToServerConfigs(nginxConfig);

                    this.serverConfigs.push(...serverConfigs);
                    context.logger.info(`Configuration NGINX convertie avec succès: ${nginxPath}`);
                } catch (error) {
                    context.logger.error(`Erreur lors de la conversion de la configuration NGINX ${nginxPath}: ${error}`);
                }
            }
        }

        // Étape 2: Conversion des fichiers .htaccess
        if (this.config.input.htaccessPaths && this.config.input.htaccessPaths.length > 0) {
            for (const htaccessPath of this.config.input.htaccessPaths) {
                try {
                    context.logger.info(`Analyse du fichier .htaccess: ${htaccessPath}`);
                    const htaccessContent = fs.readFileSync(htaccessPath, 'utf-8');
                    await this.enhanceServerConfigsFromHtaccess(htaccessContent, htaccessPath);
                    context.logger.info(`Fichier .htaccess converti avec succès: ${htaccessPath}`);
                } catch (error) {
                    context.logger.error(`Erreur lors de la conversion du fichier .htaccess ${htaccessPath}: ${error}`);
                }
            }
        }

        // Étape 3: Si aucune configuration n'a été trouvée, créer une configuration par défaut
        if (this.serverConfigs.length === 0) {
            context.logger.info("Aucune configuration trouvée, création d'une configuration par défaut");
            this.serverConfigs.push(this.createDefaultServerConfig());
        }

        // Étape 4: Génération du Caddyfile
        let caddyfileContent = this.generateGlobalOptions();

        // Générer les blocs de serveur
        for (const serverConfig of this.serverConfigs) {
            caddyfileContent += await this.generateServerBlock(serverConfig);
            caddyfileContent += '\n\n';
        }

        // Étape 5: Écriture du Caddyfile
        fs.writeFileSync(this.config.output.caddyfilePath, caddyfileContent);
        context.logger.info(`Caddyfile généré: ${this.config.output.caddyfilePath}`);

        // Étape 6: Validation du Caddyfile si demandé
        if (this.config.advanced?.validateConfig !== false) {
            await this.validateCaddyfile(context, this.config.output.caddyfilePath);
        }

        // Étape 7: Génération du fichier docker-compose.yml si demandé
        if (this.config.dockerCompose?.generate) {
            await this.generateDockerComposeFile(context);
        }
    }

    /**
     * Analyse une configuration NGINX
     */
    private async parseNginxConfig(content: string): Promise<NginxConfig> {
        // Analyse simplifiée de NGINX - dans une implémentation réelle, ceci serait plus complexe
        const config: NginxConfig = { servers: [] };

        // Expression régulière simple pour trouver les blocs server
        const serverBlocks = content.match(/server\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g) || [];

        for (const serverBlock of serverBlocks) {
            const server: NginxServer = { serverName: [], listen: [], locations: [] };

            // Extraire server_name
            const serverNameMatch = serverBlock.match(/server_name\s+([^;]+);/);
            if (serverNameMatch) {
                server.serverName = serverNameMatch[1].split(/\s+/).filter(Boolean);
            }

            // Extraire listen
            const listenMatches = serverBlock.match(/listen\s+([^;]+);/g);
            if (listenMatches) {
                server.listen = listenMatches.map(m => m.match(/listen\s+([^;]+);/)![1]);
            }

            // Extraire root
            const rootMatch = serverBlock.match(/root\s+([^;]+);/);
            if (rootMatch) {
                server.root = rootMatch[1];
            }

            // Déterminer si SSL est activé
            server.ssl = serverBlock.includes('ssl_certificate') ||
                serverBlock.includes('ssl on') ||
                server.listen.some(l => l.includes('ssl'));

            // Extraire certificat SSL
            const sslCertMatch = serverBlock.match(/ssl_certificate\s+([^;]+);/);
            if (sslCertMatch) {
                server.sslCertificate = sslCertMatch[1];
            }

            // Extraire clé SSL
            const sslKeyMatch = serverBlock.match(/ssl_certificate_key\s+([^;]+);/);
            if (sslKeyMatch) {
                server.sslCertificateKey = sslKeyMatch[1];
            }

            // Extraire les blocs location
            const locationBlocks = serverBlock.match(/location\s+(?:=|~|~\*|\^~)?\s*[^{]+{[^{}]*(?:{[^{}]*}[^{}]*)*}/g) || [];

            for (const locationBlock of locationBlocks) {
                const locationMatch = locationBlock.match(/location\s+(?:(=|~|~\*|\^~))?\s*([^{]+)\s*{/);
                if (locationMatch) {
                    const modifier = locationMatch[1] || '';
                    const path = locationMatch[2].trim();

                    const location: NginxLocation = {
                        path,
                        isRegex: modifier === '~' || modifier === '~*'
                    };

                    // Extraire proxy_pass
                    const proxyPassMatch = locationBlock.match(/proxy_pass\s+([^;]+);/);
                    if (proxyPassMatch) {
                        location.proxyPass = proxyPassMatch[1];
                    }

                    // Extraire rewrite
                    const rewriteMatches = locationBlock.match(/rewrite\s+([^;]+);/g);
                    if (rewriteMatches) {
                        location.rewrite = rewriteMatches.map(m => m.match(/rewrite\s+([^;]+);/)![1]);
                    }

                    // Extraire return
                    const returnMatch = locationBlock.match(/return\s+([^;]+);/);
                    if (returnMatch) {
                        location.return = returnMatch[1];
                    }

                    // Extraire alias
                    const aliasMatch = locationBlock.match(/alias\s+([^;]+);/);
                    if (aliasMatch) {
                        location.alias = aliasMatch[1];
                    }

                    // Extraire try_files
                    const tryFilesMatch = locationBlock.match(/try_files\s+([^;]+);/);
                    if (tryFilesMatch) {
                        location.try_files = tryFilesMatch[1].split(/\s+/);
                    }

                    // Extraire les en-têtes
                    const addHeaderMatches = locationBlock.match(/add_header\s+([^;]+);/g);
                    if (addHeaderMatches) {
                        location.headers = {};
                        addHeaderMatches.forEach(match => {
                            const headerMatch = match.match(/add_header\s+([^\s]+)\s+(.*?);/);
                            if (headerMatch) {
                                const headerName = headerMatch[1];
                                const headerValue = headerMatch[2].replace(/^["']|["']$/g, '');
                                location.headers![headerName] = headerValue;
                            }
                        });
                    }

                    server.locations.push(location);
                }
            }

            config.servers.push(server);
        }

        return config;
    }

    /**
     * Convertit une configuration NGINX en ServerConfigs pour Caddy
     */
    private async convertNginxToServerConfigs(nginxConfig: NginxConfig): Promise<ServerConfig[]> {
        const serverConfigs: ServerConfig[] = [];

        for (const nginxServer of nginxConfig.servers) {
            // Ignorer les configurations de serveur par défaut
            const serverNames = nginxServer.serverName.filter(name =>
                name !== '_' && name !== 'default_server' && name !== 'default');

            if (serverNames.length === 0) {
                serverNames.push('localhost');
            }

            for (const domain of serverNames) {
                const serverConfig: ServerConfig = {
                    domain,
                    routes: [],
                };

                // Configurer TLS
                if (nginxServer.ssl) {
                    serverConfig.tls = {
                        type: nginxServer.sslCertificate && nginxServer.sslCertificateKey ? 'manual' : 'auto',
                        certFile: nginxServer.sslCertificate,
                        keyFile: nginxServer.sslCertificateKey,
                        email: this.config.tls?.email,
                        staging: this.config.tls?.useStaging
                    };
                } else {
                    // Par défaut, activer HTTPS automatique avec Let's Encrypt
                    serverConfig.tls = {
                        type: 'auto',
                        email: this.config.tls?.email,
                        staging: this.config.tls?.useStaging
                    };
                }

                // Traiter les locations
                for (const location of nginxServer.locations) {
                    // Proxy
                    if (location.proxyPass) {
                        serverConfig.routes.push({
                            path: location.path,
                            type: 'proxy',
                            target: location.proxyPass,
                            headers: location.headers
                        });
                        continue;
                    }

                    // Redirection avec return
                    if (location.return) {
                        const parts = location.return.split(/\s+/);
                        if (parts.length >= 2) {
                            const status = parseInt(parts[0], 10);
                            const target = parts.slice(1).join(' ').replace(/^"|"$/g, '');

                            serverConfig.routes.push({
                                path: location.path,
                                type: 'redirect',
                                target,
                                status: !isNaN(status) ? status : 302
                            });
                        }
                        continue;
                    }

                    // Réécritures
                    if (location.rewrite && location.rewrite.length > 0) {
                        for (const rewrite of location.rewrite) {
                            const parts = rewrite.split(/\s+/);
                            if (parts.length >= 2) {
                                const pattern = parts[0];
                                const target = parts[1];
                                const isPermanent = parts.slice(2).some(p => p === 'permanent');

                                serverConfig.routes.push({
                                    path: pattern,
                                    type: isPermanent ? 'redirect' : 'rewrite',
                                    target,
                                    status: isPermanent ? 301 : undefined
                                });
                            }
                        }
                        continue;
                    }

                    // Contenu statique
                    if (nginxServer.root || location.alias) {
                        serverConfig.routes.push({
                            path: location.path,
                            type: 'static',
                            target: location.alias || nginxServer.root || '/var/www/html',
                        });
                        continue;
                    }

                    // try_files (typique pour les applications SPA)
                    if (location.try_files) {
                        const hasFallbackIndex = location.try_files.some(f => f.includes('index.html'));
                        if (hasFallbackIndex && (location.path === '/' || location.path === '/api')) {
                            if (location.path === '/api') {
                                serverConfig.appType = 'api';
                            } else {
                                // Détecter type d'app
                                serverConfig.appType = 'react'; // Par défaut, à remplacer par une détection plus intelligente
                            }
                        }

                        // Répondre avec l'index.html pour toutes les routes (typique des SPAs)
                        if (hasFallbackIndex) {
                            serverConfig.routes.push({
                                path: location.path,
                                type: 'respond',
                                target: '/index.html',
                                options: { root: nginxServer.root || '/var/www/html' }
                            });
                        }
                    }
                }

                // Si nous n'avons pas de routes et qu'un root est défini, ajoutons une route par défaut
                if (serverConfig.routes.length === 0 && nginxServer.root) {
                    serverConfig.routes.push({
                        path: '/',
                        type: 'static',
                        target: nginxServer.root
                    });
                }

                serverConfigs.push(serverConfig);
            }
        }

        return serverConfigs;
    }

    /**
     * Améliore les configurations de serveur à partir d'un fichier .htaccess
     */
    private async enhanceServerConfigsFromHtaccess(htaccessContent: string, htaccessPath: string): Promise<void> {
        // Si aucun serveur n'existe encore, créer un serveur par défaut
        if (this.serverConfigs.length === 0) {
            this.serverConfigs.push(this.createDefaultServerConfig());
        }

        const serverConfig = this.serverConfigs[0]; // Utiliser le premier serveur comme cible

        // Analyse simplifiée du .htaccess - dans une implémentation réelle, ceci serait plus complexe

        // Traiter les règles de réécriture (RewriteRule)
        const rewriteRules = htaccessContent.match(/RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?/g);
        if (rewriteRules) {
            for (const rule of rewriteRules) {
                const match = rule.match(/RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?/);
                if (match) {
                    const pattern = match[1];
                    const target = match[2];
                    const flags = match[3] || '';

                    // Déterminer si c'est une redirection ou une réécriture
                    const isRedirect = flags.includes('R') || flags.includes('redirect');
                    const isPermanent = flags.includes('R=301') || flags.includes('permanent');
                    const status = isPermanent ? 301 : isRedirect ? 302 : undefined;

                    serverConfig.routes.push({
                        path: this.convertHtaccessRegexToCaddyRegex(pattern),
                        type: isRedirect ? 'redirect' : 'rewrite',
                        target: this.convertHtaccessTargetToCaddy(target),
                        status
                    });
                }
            }
        }

        // Traiter les directives DirectoryIndex
        const directoryIndexMatch = htaccessContent.match(/DirectoryIndex\s+(.*?)$/m);
        if (directoryIndexMatch) {
            const indexFiles = directoryIndexMatch[1].split(/\s+/);
            if (indexFiles.length > 0) {
                // Ajouter une règle pour servir le premier fichier d'index par défaut
                serverConfig.routes.push({
                    path: '/',
                    type: 'static',
                    options: { index: indexFiles[0] }
                });
            }
        }

        // Traiter les en-têtes personnalisés
        const headerRules = htaccessContent.match(/Header\s+(set|add)\s+(\S+)\s+"([^"]*)"/g);
        if (headerRules) {
            if (!serverConfig.headers) {
                serverConfig.headers = {};
            }

            for (const rule of headerRules) {
                const match = rule.match(/Header\s+(set|add)\s+(\S+)\s+"([^"]*)"/);
                if (match) {
                    const headerName = match[2];
                    const headerValue = match[3];
                    serverConfig.headers[headerName] = headerValue;
                }
            }
        }

        // Traiter les règles de redirection simples
        const redirectRules = htaccessContent.match(/Redirect\s+(\S+)\s+(\S+)\s+(\S+)/g);
        if (redirectRules) {
            for (const rule of redirectRules) {
                const match = rule.match(/Redirect\s+(\S+)\s+(\S+)\s+(\S+)/);
                if (match) {
                    const status = parseInt(match[1], 10);
                    const sourcePath = match[2];
                    const targetUrl = match[3];

                    serverConfig.routes.push({
                        path: sourcePath,
                        type: 'redirect',
                        target: targetUrl,
                        status: !isNaN(status) ? status : 302
                    });
                }
            }
        }

        // Traiter les règles d'authentification
        if (htaccessContent.includes('AuthType') || htaccessContent.includes('AuthName')) {
            // Ajouter une note que l'authentification devra être configurée manuellement
            serverConfig.customBlocks = serverConfig.customBlocks || [];
            serverConfig.customBlocks.push(
                '# Attention: Des règles d\'authentification ont été détectées dans le fichier .htaccess',
                '# Pour les implémenter dans Caddy, utilisez la directive "basicauth"',
                '# Exemple: basicauth {',
                '#   user password_hash',
                '# }'
            );
        }
    }

    /**
     * Convertit une expression régulière .htaccess en expression régulière compatible Caddy
     */
    private convertHtaccessRegexToCaddyRegex(pattern: string): string {
        // Supprimer les délimiteurs ^$ si présents
        let caddyPattern = pattern;
        if (caddyPattern.startsWith('^') && caddyPattern.endsWith('$')) {
            caddyPattern = caddyPattern.substring(1, caddyPattern.length - 1);
        }

        // Remplacer les motifs courants
        caddyPattern = caddyPattern
            .replace(/\\\./g, '.') // \.
            .replace(/\\\*/g, '*') // \*
            .replace(/\\\+/g, '+') // \+
            .replace(/\\\?/g, '?'); // \?

        return caddyPattern;
    }

    /**
     * Convertit une cible .htaccess en cible compatible Caddy
     */
    private convertHtaccessTargetToCaddy(target: string): string {
        // Remplacer les variables courantes
        return target
            .replace(/\$1/g, '{re.1}')
            .replace(/\$2/g, '{re.2}')
            .replace(/\$3/g, '{re.3}')
            .replace(/\%{HTTP_HOST}/g, '{http.request.host}')
            .replace(/\%{REQUEST_URI}/g, '{http.request.uri}')
            .replace(/\%{QUERY_STRING}/g, '{http.request.uri.query}');
    }

    /**
     * Créer une configuration de serveur par défaut
     */
    private createDefaultServerConfig(): ServerConfig {
        return {
            domain: 'localhost',
            routes: [
                {
                    path: '/',
                    type: 'static',
                    target: '/var/www/html',
                    options: { index: 'index.html' }
                }
            ],
            tls: {
                type: 'auto',
                email: this.config.tls?.email
            }
        };
    }

    /**
     * Génère les options globales du Caddyfile
     */
    private generateGlobalOptions(): string {
        const lines: string[] = [];

        // Options globales
        if (this.config.globalOptions) {
            if (this.config.globalOptions.logLevel) {
                lines.push('{', `  log {`, `    level ${this.config.globalOptions.logLevel.toLowerCase()}`, '  }', '}', '');
            }

            if (this.config.globalOptions.enableAdmin) {
                if (this.config.globalOptions.adminAddr) {
                    lines.push('{', `  admin ${this.config.globalOptions.adminAddr}`, '}', '');
                } else {
                    lines.push('{', '  admin', '}', '');
                }
            }
        }

        // Options avancées
        if (this.config.advanced?.http3 === false) {
            lines.push('{', '  servers {', '    protocol http1 http2', '  }', '}', '');
        } else {
            lines.push('{', '  servers {', '    protocol http1 http2 h3', '  }', '}', '');
        }

        // Options de sécurité globales
        if (this.config.advanced?.security) {
            lines.push('# Options de sécurité globales');
            lines.push('(security_headers) {');

            if (this.config.advanced.security.strictTransportSecurity !== false) {
                lines.push('  header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"');
            }

            if (this.config.advanced.security.contentSecurityPolicy) {
                lines.push(`  header Content-Security-Policy "${this.config.advanced.security.contentSecurityPolicy}"`);
            } else {
                lines.push('  header Content-Security-Policy "default-src \'self\'"');
            }

            if (this.config.advanced.security.frameOptions) {
                lines.push(`  header X-Frame-Options "${this.config.advanced.security.frameOptions}"`);
            } else {
                lines.push('  header X-Frame-Options "DENY"');
            }

            lines.push('  header X-Content-Type-Options "nosniff"');
            lines.push('  header Referrer-Policy "strict-origin-when-cross-origin"');
            lines.push('  header Permissions-Policy "geolocation=(), microphone=(), camera=()"');
            lines.push('}', '');
        }

        // Snippet pour la compression
        if (this.config.advanced?.compression !== false) {
            lines.push('# Compression pour optimiser les performances');
            lines.push('(compression) {');
            lines.push('  encode gzip zstd');
            lines.push('}', '');
        }

        // Snippet pour les applications SPA
        lines.push('# Configuration pour Single Page Applications');
        lines.push('(spa) {');
        lines.push('  @notStatic {');
        lines.push('    not path *.ico *.css *.js *.gif *.jpg *.jpeg *.png *.svg *.woff *.woff2 *.ttf *.eot');
        lines.push('    file {');
        lines.push('      try_files {path} /index.html');
        lines.push('    }');
        lines.push('  }');
        lines.push('  rewrite @notStatic /index.html');
        lines.push('}', '');

        // Snippet pour applications Remix
        lines.push('# Configuration pour Remix');
        lines.push('(remix) {');
        lines.push('  @static {');
        lines.push('    path /_static/* /build/* /assets/*');
        lines.push('  }');
        lines.push('  handle @static {');
        lines.push('    file_server');
        lines.push('  }');
        lines.push('  handle {');
        lines.push('    reverse_proxy localhost:3000');
        lines.push('  }');
        lines.push('}', '');

        return lines.join('\n');
    }

    /**
     * Génère un bloc de serveur pour le Caddyfile
     */
    private async generateServerBlock(server: ServerConfig): Promise<string> {
        const lines: string[] = [];

        // Ajouter le nom de domaine
        lines.push(`${server.domain} {`);

        // Ajouter la configuration TLS
        if (server.tls) {
            lines.push(this.generateTLSConfig(server.tls));
        }

        // Ajouter la compression
        if (this.config.advanced?.compression !== false) {
            lines.push('  import compression');
        }

        // Ajouter les en-têtes de sécurité
        if (this.config.advanced?.security) {
            lines.push('  import security_headers');
        }

        // Ajouter les en-têtes spécifiques au serveur
        if (server.headers && Object.keys(server.headers).length > 0) {
            for (const [headerName, headerValue] of Object.entries(server.headers)) {
                lines.push(`  header ${headerName} "${headerValue}"`);
            }
        }

        // Traiter selon le type d'application
        if (server.appType) {
            switch (server.appType) {
                case 'remix':
                    lines.push('  import remix');
                    break;
                case 'react':
                case 'vue':
                case 'next':
                    lines.push('  import spa');
                    break;
            }
        }

        // Ajouter les routes
        for (const route of server.routes) {
            lines.push(this.generateRouteBlock(route));
        }

        // Ajouter les blocs personnalisés
        if (server.customBlocks && server.customBlocks.length > 0) {
            for (const block of server.customBlocks) {
                lines.push(`  ${block}`);
            }
        }

        // Ajouter la configuration microservice si nécessaire
        if (this.config.microservices?.enabled && server.microservice) {
            lines.push('  # Configuration pour microservices');
            lines.push('  handle_path /api/* {');
            lines.push('    reverse_proxy api_service:8080');
            lines.push('  }');
        }

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * Génère la configuration TLS pour un serveur
     */
    private generateTLSConfig(tls: TLSConfig): string {
        if (tls.type === 'auto') {
            let tlsConfig = '  tls';

            if (tls.email) {
                tlsConfig += ` ${tls.email}`;
            }

            if (tls.staging) {
                tlsConfig += ' {';
                tlsConfig += '\n    ca https://acme-staging-v02.api.letsencrypt.org/directory';
                tlsConfig += '\n  }';
            }

            return tlsConfig;
        } else if (tls.type === 'manual' && tls.certFile && tls.keyFile) {
            return `  tls ${tls.certFile} ${tls.keyFile}`;
        } else if (tls.type === 'internal') {
            return '  tls internal';
        }

        return '';
    }

    /**
     * Génère un bloc de route
     */
    private generateRouteBlock(route: RouteConfig): string {
        const indent = '  ';
        let result = '';

        // Générer le matcher si nécessaire
        let matcher = '';
        if (route.matcher) {
            matcher = `@${route.matcher}`;
            result += `${indent}@${route.matcher} {\n`;
            result += `${indent}  path ${route.path}\n`;
            result += `${indent}}\n`;
        }

        // Traiter selon le type de route
        switch (route.type) {
            case 'proxy':
                if (matcher) {
                    result += `${indent}handle ${matcher} {\n`;
                    result += `${indent}  reverse_proxy ${route.target}\n`;
                    result += `${indent}}\n`;
                } else {
                    result += `${indent}handle ${route.path} {\n`;
                    result += `${indent}  reverse_proxy ${route.target}\n`;
                    result += `${indent}}\n`;
                }
                break;

            case 'static':
                if (matcher) {
                    result += `${indent}handle ${matcher} {\n`;
                    result += `${indent}  root * ${route.target}\n`;

                    if (route.options?.index) {
                        result += `${indent}  try_files {path} ${route.options.index}\n`;
                    }

                    result += `${indent}  file_server\n`;
                    result += `${indent}}\n`;
                } else {
                    result += `${indent}handle ${route.path} {\n`;
                    result += `${indent}  root * ${route.target || "/var/www/html"}\n`;

                    if (route.options?.index) {
                        result += `${indent}  try_files {path} ${route.options.index}\n`;
                    }

                    result += `${indent}  file_server\n`;
                    result += `${indent}}\n`;
                }
                break;

            case 'redirect':
                if (matcher) {
                    result += `${indent}redir ${matcher} ${route.target}`;
                } else {
                    result += `${indent}redir ${route.path} ${route.target}`;
                }

                if (route.status) {
                    result += ` ${route.status}`;
                }

                result += '\n';
                break;

            case 'rewrite':
                if (matcher) {
                    result += `${indent}rewrite ${matcher} ${route.target}\n`;
                } else {
                    result += `${indent}rewrite ${route.path} ${route.target}\n`;
                }
                break;

            case 'respond':
                if (matcher) {
                    result += `${indent}respond ${matcher}`;
                } else {
                    result += `${indent}respond ${route.path}`;
                }

                if (route.target) {
                    result += ` "${route.target}"`;
                }

                if (route.status) {
                    result += ` ${route.status}`;
                }

                result += '\n';
                break;
        }

        return result;
    }

    /**
     * Stocke les règles converties pour validation ultérieure
     */
    private storeConvertedRules(sourcePath: string, sourceType: 'nginx' | 'htaccess', caddyRules: string): void {
        this.convertedRules.set(sourcePath, {
            type: sourceType,
            caddyRules
        });
    }

    /**
     * Valide un fichier Caddyfile
     */
    private async validateCaddyfile(context: AgentContext, caddyfilePath: string): Promise<boolean> {
        try {
            const { stdout, stderr } = await execAsync(`caddy validate --config ${caddyfilePath}`);

            if (stderr) {
                context.logger.error(`Erreur lors de la validation du Caddyfile: ${stderr}`);
                return false;
            }

            context.logger.info(`Caddyfile validé avec succès: ${stdout.trim()}`);
            return true;
        } catch (error) {
            context.logger.error(`Erreur lors de la validation du Caddyfile: ${error}`);

            // Si l'erreur est due à l'absence de Caddy, afficher un message spécial
            if ((error as any).stderr?.includes('command not found')) {
                context.logger.info('Caddy n\'est pas installé. Pour installer Caddy:');
                context.logger.info('curl -1sLf \'https://dl.cloudsmith.io/public/caddy/stable/setup.deb.sh\' | sudo -E bash');
                context.logger.info('sudo apt install caddy');
            }

            return false;
        }
    }

    /**
     * Génère un fichier docker-compose.yml pour Caddy
     */
    private async generateDockerComposeFile(context: AgentContext): Promise<void> {
        if (!this.config.dockerCompose?.generate) {
            return;
        }

        const dockerComposePath = this.config.dockerCompose.outputPath ||
            path.join(path.dirname(this.config.output.caddyfilePath), 'docker-compose.yml');

        const networkName = this.config.dockerCompose.networkName || 'caddy_network';
        const caddyVersion = this.config.dockerCompose.caddyVersion || 'latest';

        // Construire le contenu du fichier docker-compose.yml
        let composeContent = `version: '3'

services:
  caddy:
    image: caddy:${caddyVersion}
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ${path.relative(path.dirname(dockerComposePath), this.config.output.caddyfilePath)}:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - ${networkName}
`;

        // Ajouter des services supplémentaires si demandé
        if (this.config.dockerCompose.includeServices && this.config.microservices?.services) {
            for (const service of this.config.microservices.services) {
                composeContent += `
  ${service.name}:
    image: ${service.name}-image
    restart: unless-stopped
    networks:
      - ${networkName}
`;
            }
        }

        // Ajouter les volumes et réseaux
        composeContent += `
volumes:
  caddy_data:
  caddy_config:

networks:
  ${networkName}:
    driver: bridge
`;

        // Écrire le fichier
        fs.writeFileSync(dockerComposePath, composeContent);
        context.logger.info(`Fichier docker-compose.yml généré: ${dockerComposePath}`);
    }
}