/**
 * Générateur de Caddyfile
 * 
 * Ce module permet de générer automatiquement des fichiers de configuration Caddy
 * à partir de configurations NGINX ou .htaccess existantes.
 * Caddy offre des avantages considérables : HTTPS automatique avec Let's Encrypt,
 * HTTP/3, compression par défaut et facilité de configuration.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Types de serveurs web source pris en charge
 */
export enum ServerType {
    NGINX = 'nginx',
    APACHE = 'apache',
    CUSTOM = 'custom'
}

/**
 * Configuration pour le site Caddy
 */
export interface CaddySiteConfig {
    domain: string;
    root?: string;
    email?: string;
    enableCompression?: boolean;
    enableHTTP3?: boolean;
    securityHeaders?: boolean;
    customSnippets?: string[];
    php?: {
        enabled: boolean;
        version?: string;
        socket?: string;
        maxUploadSize?: string;
    };
    reverseProxy?: {
        path: string;
        target: string;
    }[];
}

/**
 * Schéma de validation pour la configuration du site
 */
export const CaddySiteConfigSchema = z.object({
    domain: z.string().min(1),
    root: z.string().optional(),
    email: z.string().email().optional(),
    enableCompression: z.boolean().default(true),
    enableHTTP3: z.boolean().default(true),
    securityHeaders: z.boolean().default(true),
    customSnippets: z.array(z.string()).optional(),
    php: z.object({
        enabled: z.boolean(),
        version: z.string().optional(),
        socket: z.string().optional(),
        maxUploadSize: z.string().optional()
    }).optional(),
    reverseProxy: z.array(
        z.object({
            path: z.string(),
            target: z.string()
        })
    ).optional()
});

/**
 * Options du générateur de Caddyfile
 */
export interface CaddyfileGeneratorOptions {
    outputDir?: string;
    defaultEmail?: string;
    defaultRoot?: string;
}

/**
 * Générateur de Caddyfile
 */
export class CaddyfileGenerator {
    private readonly options: CaddyfileGeneratorOptions;
    private siteConfigs: CaddySiteConfig[] = [];

    /**
     * Constructeur du générateur de Caddyfile
     */
    constructor(options: CaddyfileGeneratorOptions = {}) {
        this.options = {
            outputDir: './generated-caddyfiles',
            ...options
        };
    }

    /**
     * Ajoute une configuration de site
     */
    addSite(config: CaddySiteConfig): void {
        try {
            const validatedConfig = CaddySiteConfigSchema.parse(config);
            this.siteConfigs.push(validatedConfig);
        } catch (error) {
            console.error('Invalid Caddy site configuration:', error);
            throw new Error(`Invalid Caddy site configuration: ${JSON.stringify(config)}`);
        }
    }

    /**
     * Parse un fichier .htaccess et génère une configuration Caddy équivalente
     */
    async parseHtaccess(filePath: string, domain: string): Promise<CaddySiteConfig> {
        console.log(`Parsing .htaccess file: ${filePath}`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const config: CaddySiteConfig = {
                domain,
                customSnippets: []
            };

            // Détection du répertoire racine
            const documentRootRegex = /DocumentRoot\s+"?([^"\s]+)"?/i;
            const documentRootMatch = content.match(documentRootRegex);
            if (documentRootMatch) {
                config.root = documentRootMatch[1];
            }

            // Détection de PHP
            if (content.includes('php')) {
                config.php = {
                    enabled: true
                };

                // Détection de la taille maximale de téléchargement
                const uploadMaxRegex = /php_value\s+upload_max_filesize\s+(\d+[MG])/i;
                const uploadMaxMatch = content.match(uploadMaxRegex);
                if (uploadMaxMatch) {
                    config.php.maxUploadSize = uploadMaxMatch[1];
                }
            }

            // Extraction des règles de redirection
            const redirectRegex = /Redirect\s+(\d+)\s+([^\s]+)\s+([^\s]+)/gi;
            let match;
            while ((match = redirectRegex.exec(content)) !== null) {
                const statusCode = parseInt(match[1], 10);
                const source = match[2];
                const target = match[3];

                // Convention pour les redirections dans Caddy
                let redirectRule: string;
                if (statusCode === 301) {
                    redirectRule = `redir ${source} ${target} permanent`;
                } else if (statusCode === 302) {
                    redirectRule = `redir ${source} ${target} temporary`;
                } else if (statusCode === 410) {
                    redirectRule = `respond ${source} 410`;
                } else {
                    redirectRule = `redir ${source} ${target} ${statusCode}`;
                }

                config.customSnippets?.push(redirectRule);
            }

            // Extraction des règles RewriteRule
            const rewriteRuleRegex = /RewriteRule\s+([^\s]+)\s+([^\s]+)\s+\[.*?R=(\d+).*?\]/gi;
            while ((match = rewriteRuleRegex.exec(content)) !== null) {
                const source = match[1];
                const target = match[2];
                const statusCode = parseInt(match[3], 10);

                // Convention pour les réécritures dans Caddy
                if (source.includes("^") || source.includes("$") || source.includes("*")) {
                    // Règle avec regex
                    const matcherName = `rewrite_${source.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    config.customSnippets?.push(`@${matcherName} path_regexp ${matcherName} ${source}`);

                    if (statusCode === 301) {
                        config.customSnippets?.push(`redir @${matcherName} ${target} permanent`);
                    } else if (statusCode === 302) {
                        config.customSnippets?.push(`redir @${matcherName} ${target} temporary`);
                    } else {
                        config.customSnippets?.push(`redir @${matcherName} ${target} ${statusCode}`);
                    }
                } else {
                    // Règle simple
                    if (statusCode === 301) {
                        config.customSnippets?.push(`redir ${source} ${target} permanent`);
                    } else if (statusCode === 302) {
                        config.customSnippets?.push(`redir ${source} ${target} temporary`);
                    } else {
                        config.customSnippets?.push(`redir ${source} ${target} ${statusCode}`);
                    }
                }
            }

            // Extraction des entêtes de sécurité
            if (content.includes('Header set') || content.includes('Header always set')) {
                config.securityHeaders = true;
            }

            return config;
        } catch (error) {
            console.error(`Error parsing .htaccess file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Parse un fichier NGINX et génère une configuration Caddy équivalente
     */
    async parseNginxConfig(filePath: string, domain: string): Promise<CaddySiteConfig> {
        console.log(`Parsing NGINX config file: ${filePath}`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const config: CaddySiteConfig = {
                domain,
                customSnippets: []
            };

            // Détection du répertoire racine
            const rootRegex = /root\s+([^;]+);/i;
            const rootMatch = content.match(rootRegex);
            if (rootMatch) {
                config.root = rootMatch[1];
            }

            // Détection de PHP
            if (content.includes('.php')) {
                config.php = {
                    enabled: true
                };

                // Détection du socket PHP
                const phpSocketRegex = /fastcgi_pass\s+unix:([^;]+);/i;
                const phpSocketMatch = content.match(phpSocketRegex);
                if (phpSocketMatch) {
                    config.php.socket = phpSocketMatch[1];
                }
            }

            // Extraction des règles de redirection
            const redirectRegex = /return\s+(\d+)\s+([^;]+);/gi;
            let match;
            while ((match = redirectRegex.exec(content)) !== null) {
                const statusCode = parseInt(match[1], 10);
                let target = match[2].trim();

                // Extraire le path de la location block
                const locationBlockRegex = new RegExp(`location\\s+([^\\s{]+)\\s*{[^}]*return\\s+${statusCode}\\s+${target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
                const locationMatch = locationBlockRegex.exec(content);

                if (locationMatch) {
                    const source = locationMatch[1];

                    // Convertir la règle NGINX en règle Caddy
                    if (statusCode === 301) {
                        config.customSnippets?.push(`redir ${source} ${target} permanent`);
                    } else if (statusCode === 302) {
                        config.customSnippets?.push(`redir ${source} ${target} temporary`);
                    } else if (statusCode === 410) {
                        config.customSnippets?.push(`respond ${source} 410`);
                    } else {
                        config.customSnippets?.push(`redir ${source} ${target} ${statusCode}`);
                    }
                }
            }

            // Extraction des règles rewrite
            const rewriteRegex = /rewrite\s+([^\s]+)\s+([^\s]+)(?:\s+(\w+))?;/gi;
            while ((match = rewriteRegex.exec(content)) !== null) {
                const source = match[1];
                const target = match[2];
                const flag = match[3];

                if (flag === 'permanent') {
                    config.customSnippets?.push(`redir ${source} ${target} permanent`);
                } else if (flag === 'redirect') {
                    config.customSnippets?.push(`redir ${source} ${target} temporary`);
                } else if (flag === 'last' || !flag) {
                    config.customSnippets?.push(`rewrite ${source} ${target}`);
                }
            }

            // Extraction des proxy_pass
            const proxyRegex = /location\s+([^{\s]+)\s*\{[^}]*proxy_pass\s+([^;]+);/gi;
            const reverseProxies: { path: string; target: string }[] = [];

            while ((match = proxyRegex.exec(content)) !== null) {
                const path = match[1];
                const target = match[2];

                reverseProxies.push({
                    path,
                    target
                });
            }

            if (reverseProxies.length > 0) {
                config.reverseProxy = reverseProxies;
            }

            // Détection des entêtes de sécurité
            if (content.includes('add_header') || content.includes('X-XSS-Protection') || content.includes('X-Content-Type-Options')) {
                config.securityHeaders = true;
            }

            // Détection de la compression
            if (content.includes('gzip on')) {
                config.enableCompression = true;
            }

            // Détection de HTTP/3
            if (content.includes('http3') || content.includes('HTTP/3')) {
                config.enableHTTP3 = true;
            }

            return config;
        } catch (error) {
            console.error(`Error parsing NGINX config file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Génère un Caddyfile pour une configuration de site
     */
    generateSiteCaddyfile(config: CaddySiteConfig): string {
        // Domaine
        let caddyfile = `${config.domain} {\n`;

        // Email pour Let's Encrypt
        if (config.email || this.options.defaultEmail) {
            caddyfile += `  tls ${config.email || this.options.defaultEmail}\n`;
        } else {
            caddyfile += '  tls internal\n';
        }

        // Répertoire racine
        if (config.root || this.options.defaultRoot) {
            caddyfile += `  root * ${config.root || this.options.defaultRoot}\n`;
        }

        // Compression (activée par défaut)
        if (config.enableCompression !== false) {
            caddyfile += '  encode gzip zstd\n';
        }

        // HTTP/3 (activé par défaut)
        if (config.enableHTTP3 !== false) {
            caddyfile += '  servers {\n    protocol {\n      experimental_http3\n    }\n  }\n';
        }

        // En-têtes de sécurité
        if (config.securityHeaders !== false) {
            caddyfile += `  header {
    # Sécurité
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
    X-Frame-Options "SAMEORIGIN"
    # Supprimer les en-têtes sensibles
    -Server
  }\n`;
        }

        // Support PHP
        if (config.php?.enabled) {
            const socket = config.php.socket || (config.php.version
                ? `/var/run/php/php${config.php.version}-fpm.sock`
                : '/var/run/php/php-fpm.sock');
            const maxSize = config.php.maxUploadSize || '100M';

            caddyfile += `  php_fastcgi unix/${socket} {
    env DOCUMENT_ROOT {root}
    split .php
    index index.php
    root {root}
  }
  @phpFiles {
    path_regexp \\.(php)$
  }
  header @phpFiles {
    -Server
    X-Powered-By "PHP"
  }
  limits {
    body ${maxSize}
  }\n`;
        } else {
            // File server par défaut pour les fichiers statiques
            caddyfile += '  file_server\n';
        }

        // Reverse proxy
        if (config.reverseProxy && config.reverseProxy.length > 0) {
            for (const proxy of config.reverseProxy) {
                caddyfile += `  handle ${proxy.path} {\n`;
                caddyfile += `    reverse_proxy ${proxy.target} {\n`;
                caddyfile += '      header_up Host {upstream_hostport}\n';
                caddyfile += '      header_up X-Real-IP {remote_host}\n';
                caddyfile += '      header_up X-Forwarded-For {remote_host}\n';
                caddyfile += '      header_up X-Forwarded-Proto {scheme}\n';
                caddyfile += '    }\n';
                caddyfile += '  }\n';
            }
        }

        // Snippets personnalisés
        if (config.customSnippets && config.customSnippets.length > 0) {
            for (const snippet of config.customSnippets) {
                caddyfile += `  ${snippet}\n`;
            }
        }

        // Fermeture du bloc de site
        caddyfile += '}\n';

        return caddyfile;
    }

    /**
     * Génère un Caddyfile complet pour tous les sites configurés
     */
    generateCaddyfile(): string {
        // En-tête global
        let caddyfile = `# Caddyfile généré automatiquement
# Date: ${new Date().toISOString()}
# Générateur: CaddyfileGenerator 2.0

{
  # Paramètres globaux
  email ${this.options.defaultEmail || "admin@example.com"}
  
  # Active l'auto HTTPS
  auto_https on
  
  # Serveurs HTTP/3
  servers {
    protocol {
      experimental_http3
    }
  }
  
  # Politique d'expiration des certificats TLS
  cert_issuer acme {
    preferred_chains smallest
  }
  
  # Logging
  log {
    output file /var/log/caddy/access.log {
      roll_size 10MB
      roll_keep 10
    }
    format json
  }
}

`;

        // Ajouter chaque site
        for (const config of this.siteConfigs) {
            caddyfile += this.generateSiteCaddyfile(config) + '\n';
        }

        return caddyfile;
    }

    /**
     * Génère et enregistre le Caddyfile
     */
    async generateAndSave(outputPath?: string): Promise<string> {
        const caddyfile = this.generateCaddyfile();
        const finalPath = outputPath || path.join(this.options.outputDir || '.', 'Caddyfile');

        // Créer le répertoire de sortie s'il n'existe pas
        await fs.mkdir(path.dirname(finalPath), { recursive: true });

        // Écrire le Caddyfile
        await fs.writeFile(finalPath, caddyfile);
        console.log(`Caddyfile generated and saved to ${finalPath}`);

        return finalPath;
    }

    /**
     * Valide un Caddyfile avec la commande caddy validate
     * Nécessite que Caddy soit installé sur le système
     */
    async validateCaddyfile(caddyfilePath: string): Promise<boolean> {
        try {
            const { execSync } = require('child_process');
            execSync(`caddy validate --config ${caddyfilePath}`, { stdio: 'inherit' });
            console.log(`✅ Caddyfile ${caddyfilePath} is valid`);
            return true;
        } catch (error) {
            console.error(`❌ Caddyfile ${caddyfilePath} is invalid:`, error);
            return false;
        }
    }
}

export default CaddyfileGenerator;