import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AgentContext, MCPAgent } from '../core/agent-types';
import { HtaccessRuleConverter } from './htaccess-converter';
import { NginxConfigConverter } from './nginx-converter';

const execAsync = promisify(exec);

/**
 * Configuration pour le générateur de Caddyfile
 */
interface CaddyfileGeneratorConfig {
    // Chemins vers les fichiers de configuration Nginx
    nginxConfigPaths?: string[];

    // Chemins vers les fichiers .htaccess
    htaccessPaths?: string[];

    // Chemin où générer le Caddyfile
    outputPath: string;

    // Domaines pour lesquels configurer Let's Encrypt
    domains: string[];

    // Paramètres pour la configuration Let's Encrypt
    letsEncrypt: {
        email: string;
        staging?: boolean;
        renewBefore?: number; // jours avant l'expiration pour renouveler
        caServer?: string; // serveur CA personnalisé (pour staging)
        dnsProvider?: { // Supporte les fournisseurs DNS pour la validation
            name: string;
            credentials?: Record<string, string>;
        };
    };

    // Applications à exposer (Remix, Nest.js, etc.)
    applications?: {
        type: 'remix' | 'nest' | 'express' | 'php' | 'static' | 'custom';
        domain: string;
        path?: string;
        port?: number;
        containerName?: string;
        root?: string;
        customDirectives?: string;
    }[];

    // Redirections
    redirects?: {
        from: string;
        to: string;
        type?: 301 | 302 | 307 | 308;
        pathPrefix?: boolean;
    }[];

    // Configuration Docker Compose
    dockerCompose?: {
        generate: boolean;
        outputPath?: string;
        networkName?: string;
        caddyVersion?: string;
        extraVolumes?: Record<string, any>;
        extraPorts?: string[];
    };

    // Options avancées
    advanced?: {
        httpPort?: number;
        httpsPort?: number;
        autoHTTPS?: boolean;
        compression?: boolean;
        http3?: boolean;
        securityHeaders?: boolean;
        logFormat?: string;
        validateConfig?: boolean;
        customSnippets?: Record<string, string>;
        extraGlobalDirectives?: string[];
    };
}

/**
 * CaddyfileGenerator 3.0
 * 
 * Agent MCP pour générer un Caddyfile à partir de configurations Nginx et .htaccess
 * avec support Let's Encrypt automatique, validation intégrée et support pour microservices
 */
export class CaddyfileGenerator30 implements MCPAgent {
    private config!: CaddyfileGeneratorConfig;
    private version = '3.0.0';
    private convertedRules: Map<string, { type: 'nginx' | 'htaccess', caddyRules: string }> = new Map();
    private nginxConverter?: NginxConfigConverter;
    private htaccessConverter?: HtaccessRuleConverter;

    /**
     * Initialise l'agent avec la configuration
     */
    async initialize(context: AgentContext): Promise<void> {
        // Récupération de la configuration de l'agent
        this.config = context.config as CaddyfileGeneratorConfig;

        // Validation des paramètres requis
        if (!this.config.domains || this.config.domains.length === 0) {
            throw new Error('La configuration doit spécifier au moins un domaine');
        }

        if (!this.config.letsEncrypt || !this.config.letsEncrypt.email) {
            throw new Error('Configuration Let\'s Encrypt requise avec une adresse email valide');
        }

        // Valeurs par défaut pour les options avancées
        this.config.advanced = this.config.advanced || {};
        this.config.advanced.httpPort = this.config.advanced.httpPort || 80;
        this.config.advanced.httpsPort = this.config.advanced.httpsPort || 443;
        this.config.advanced.autoHTTPS = this.config.advanced.autoHTTPS !== false;
        this.config.advanced.compression = this.config.advanced.compression !== false;
        this.config.advanced.http3 = this.config.advanced.http3 !== false;
        this.config.advanced.securityHeaders = this.config.advanced.securityHeaders !== false;
        this.config.advanced.validateConfig = this.config.advanced.validateConfig !== false;

        // Configuration Docker Compose par défaut
        if (this.config.dockerCompose?.generate) {
            this.config.dockerCompose.outputPath = this.config.dockerCompose.outputPath || path.join(path.dirname(this.config.outputPath), 'docker-compose.yml');
            this.config.dockerCompose.networkName = this.config.dockerCompose.networkName || 'caddy_network';
            this.config.dockerCompose.caddyVersion = this.config.dockerCompose.caddyVersion || 'latest';
        }

        // Initialisation des convertisseurs
        if (this.config.nginxConfigPaths && this.config.nginxConfigPaths.length > 0) {
            this.nginxConverter = new NginxConfigConverter();
            await this.nginxConverter.initialize();
        }

        if (this.config.htaccessPaths && this.config.htaccessPaths.length > 0) {
            this.htaccessConverter = new HtaccessRuleConverter();
            await this.htaccessConverter.initialize();
        }

        context.logger.info('CaddyfileGenerator 3.0 initialisé avec succès');
    }

    /**
     * Exécute l'agent pour générer le Caddyfile
     */
    async execute(context: AgentContext): Promise<void> {
        context.logger.info(`Génération du Caddyfile avec CaddyfileGenerator ${this.version}...`);

        // Conversion des configurations Nginx si présentes
        if (this.nginxConverter && this.config.nginxConfigPaths) {
            for (const nginxPath of this.config.nginxConfigPaths) {
                try {
                    const nginxContent = fs.readFileSync(nginxPath, 'utf-8');
                    const caddyRules = await this.nginxConverter.convertToCaddy(nginxContent);
                    this.storeConvertedRules(nginxPath, 'nginx', caddyRules);
                    context.logger.info(`Configuration Nginx convertie: ${nginxPath}`);
                } catch (error) {
                    context.logger.error(`Erreur lors de la conversion de la configuration Nginx ${nginxPath}: ${error}`);
                }
            }
        }

        // Conversion des fichiers .htaccess si présents
        if (this.htaccessConverter && this.config.htaccessPaths) {
            for (const htaccessPath of this.config.htaccessPaths) {
                try {
                    const htaccessContent = fs.readFileSync(htaccessPath, 'utf-8');
                    const caddyRules = await this.htaccessConverter.convertToCaddy(htaccessContent);
                    this.storeConvertedRules(htaccessPath, 'htaccess', caddyRules);
                    context.logger.info(`Fichier .htaccess converti: ${htaccessPath}`);
                } catch (error) {
                    context.logger.error(`Erreur lors de la conversion du fichier .htaccess ${htaccessPath}: ${error}`);
                }
            }
        }

        // Génération du Caddyfile
        let caddyfileContent = this.generateGlobalOptions();

        // Ajout des blocs de domaine
        for (const domain of this.config.domains) {
            caddyfileContent += this.generateDomainBlock(domain);
        }

        // Ajout des applications si elles sont configurées
        if (this.config.applications && this.config.applications.length > 0) {
            for (const app of this.config.applications) {
                caddyfileContent += this.generateApplicationBlock(app);
            }
        }

        // Ajout des redirections si elles sont configurées
        if (this.config.redirects && this.config.redirects.length > 0) {
            caddyfileContent += this.generateRedirectBlocks();
        }

        // Création du dossier de sortie si nécessaire
        fs.mkdirSync(path.dirname(this.config.outputPath), { recursive: true });
        fs.writeFileSync(this.config.outputPath, caddyfileContent);
        context.logger.info(`Caddyfile généré avec succès: ${this.config.outputPath}`);

        // Validation du Caddyfile généré
        if (this.config.advanced?.validateConfig) {
            try {
                await this.validateCaddyfile(this.config.outputPath);
                context.logger.info('Validation du Caddyfile réussie');
            } catch (error) {
                context.logger.error(`Erreur lors de la validation du Caddyfile: ${error}`);
            }
        }

        // Génération du docker-compose.yml si demandé
        if (this.config.dockerCompose?.generate) {
            await this.generateDockerCompose(context);
        }

        // Analyse des règles converties pour détecter les problèmes potentiels
        this.analyzeConvertedRules(context);
    }

    /**
     * Génère les options globales du Caddyfile
     */
    private generateGlobalOptions(): string {
        let globalOptions = `# Caddyfile généré automatiquement par CaddyfileGenerator ${this.version}
# Date de génération: ${new Date().toISOString()}

{
  # Configuration Let's Encrypt automatique
  email ${this.config.letsEncrypt.email}
`;

        // Options Let's Encrypt avancées
        if (this.config.letsEncrypt.staging) {
            globalOptions += `  acme_ca ${this.config.letsEncrypt.caServer || 'https://acme-staging-v02.api.letsencrypt.org/directory'}\n`;
        }

        if (this.config.letsEncrypt.renewBefore) {
            globalOptions += `  ocsp_stapling {\n    must_staple true\n    renewal_window ${this.config.letsEncrypt.renewBefore * 24}h\n  }\n`;
        }

        // Configuration du fournisseur DNS pour la validation Let's Encrypt
        if (this.config.letsEncrypt.dnsProvider) {
            globalOptions += `  acme_dns ${this.config.letsEncrypt.dnsProvider.name}`;
            if (this.config.letsEncrypt.dnsProvider.credentials) {
                Object.entries(this.config.letsEncrypt.dnsProvider.credentials).forEach(([key, value]) => {
                    globalOptions += ` ${key}=${value}`;
                });
            }
            globalOptions += '\n';
        }

        // Options HTTP/3
        if (this.config.advanced?.http3) {
            globalOptions += '  servers {\n    protocol {\n      experimental_http3\n    }\n  }\n';
        }

        // Ports personnalisés
        if (this.config.advanced?.httpPort !== 80 || this.config.advanced?.httpsPort !== 443) {
            globalOptions += `  http_port ${this.config.advanced?.httpPort}\n`;
            globalOptions += `  https_port ${this.config.advanced?.httpsPort}\n`;
        }

        // Format de log personnalisé
        if (this.config.advanced?.logFormat) {
            globalOptions += `  log {\n    format ${this.config.advanced.logFormat}\n  }\n`;
        }

        // Directives globales supplémentaires
        if (this.config.advanced?.extraGlobalDirectives) {
            for (const directive of this.config.advanced.extraGlobalDirectives) {
                globalOptions += `  ${directive}\n`;
            }
        }

        globalOptions += '}\n\n';
        return globalOptions;
    }

    /**
     * Génère un bloc de configuration pour un domaine spécifique
     */
    private generateDomainBlock(domain: string): string {
        // Vérifier si ce domaine est déjà géré par une configuration d'application
        if (this.config.applications?.some(app => app.domain === domain)) {
            return '';
        }

        let domainBlock = `# Configuration pour ${domain}\n${domain} {\n`;

        // Ajout de la compression si activée
        if (this.config.advanced?.compression) {
            domainBlock += '  encode gzip zstd\n';
        }

        // Ajout des en-têtes de sécurité si activés
        if (this.config.advanced?.securityHeaders) {
            domainBlock += '  header {\n';
            domainBlock += '    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n';
            domainBlock += '    X-Content-Type-Options "nosniff"\n';
            domainBlock += '    X-Frame-Options "DENY"\n';
            domainBlock += '    Referrer-Policy "strict-origin-when-cross-origin"\n';
            domainBlock += '    X-XSS-Protection "1; mode=block"\n';
            domainBlock += '    Content-Security-Policy "default-src \'self\'"\n';
            domainBlock += '    -Server\n';
            domainBlock += '  }\n';
        }

        // Snippets personnalisés
        if (this.config.advanced?.customSnippets && this.config.advanced.customSnippets[domain]) {
            domainBlock += this.config.advanced.customSnippets[domain] + '\n';
        }

        // Configuration simple par défaut
        domainBlock += '  root * /var/www/html\n';
        domainBlock += '  file_server\n';
        domainBlock += '}\n\n';

        return domainBlock;
    }

    /**
     * Génère un bloc de configuration pour une application spécifique
     */
    private generateApplicationBlock(app: CaddyfileGeneratorConfig['applications'][0]): string {
        let appBlock = `# Configuration pour l'application ${app.type} sur ${app.domain}\n${app.domain} {\n`;

        // Ajout de la compression si activée
        if (this.config.advanced?.compression) {
            appBlock += '  encode gzip zstd\n';
        }

        // Ajout des en-têtes de sécurité si activés
        if (this.config.advanced?.securityHeaders) {
            appBlock += '  header {\n';
            appBlock += '    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n';
            appBlock += '    X-Content-Type-Options "nosniff"\n';
            appBlock += '    X-Frame-Options "DENY"\n';
            appBlock += '    Referrer-Policy "strict-origin-when-cross-origin"\n';
            appBlock += '    X-XSS-Protection "1; mode=block"\n';
            appBlock += '    Content-Security-Policy "default-src \'self\'"\n';
            appBlock += '    -Server\n';
            appBlock += '  }\n';
        }

        // Configuration spécifique selon le type d'application
        switch (app.type) {
            case 'remix':
                appBlock += `  @assets {\n    path *.css *.js *.ico *.jpg *.jpeg *.png *.gif *.svg *.webp *.woff *.woff2\n  }\n`;
                appBlock += `  route @assets {\n    file_server\n    root ${app.root || '/app/public'}\n  }\n`;
                appBlock += `  reverse_proxy ${app.path || '/*'} ${app.containerName || 'localhost'}:${app.port || 3000} {\n`;
                appBlock += '    header_up Host {host}\n';
                appBlock += '    header_up X-Real-IP {remote_host}\n';
                appBlock += '    header_up X-Forwarded-For {remote_host}\n';
                appBlock += '    header_up X-Forwarded-Proto {scheme}\n';
                appBlock += '  }\n';
                break;

            case 'nest':
            case 'express':
                appBlock += `  reverse_proxy ${app.path || '/*'} ${app.containerName || 'localhost'}:${app.port || 3000} {\n`;
                appBlock += '    header_up Host {host}\n';
                appBlock += '    header_up X-Real-IP {remote_host}\n';
                appBlock += '    header_up X-Forwarded-For {remote_host}\n';
                appBlock += '    header_up X-Forwarded-Proto {scheme}\n';
                appBlock += '  }\n';
                break;

            case 'php':
                appBlock += `  root * ${app.root || '/var/www/html'}\n`;
                appBlock += '  php_fastcgi ${app.containerName || 'php - fpm'}:9000\n';
                appBlock += '  file_server\n';
                break;

            case 'static':
                appBlock += `  root * ${app.root || '/var/www/html'}\n`;
                appBlock += '  file_server\n';
                break;

            case 'custom':
                if (app.customDirectives) {
                    appBlock += app.customDirectives + '\n';
                }
                break;
        }

        // Snippets personnalisés
        if (this.config.advanced?.customSnippets && this.config.advanced.customSnippets[app.domain]) {
            appBlock += this.config.advanced.customSnippets[app.domain] + '\n';
        }

        appBlock += '}\n\n';
        return appBlock;
    }

    /**
     * Génère les blocs de redirection
     */
    private generateRedirectBlocks(): string {
        let redirectsBlock = '# Redirections\n';

        if (this.config.redirects) {
            for (const redirect of this.config.redirects) {
                const statusCode = redirect.type || 301;
                if (redirect.pathPrefix) {
                    redirectsBlock += `${redirect.from} {\n`;
                    redirectsBlock += `  redir ${statusCode} {uri} ${redirect.to}{uri}\n`;
                    redirectsBlock += '}\n\n';
                } else {
                    redirectsBlock += `${redirect.from} {\n`;
                    redirectsBlock += `  redir ${statusCode} ${redirect.to}\n`;
                    redirectsBlock += '}\n\n';
                }
            }
        }

        return redirectsBlock;
    }

    /**
     * Stocke les règles converties pour validation ultérieure
     */
    private storeConvertedRules(sourcePath: string, sourceType: 'nginx' | 'htaccess', caddyRules: string): void {
        this.convertedRules.set(sourcePath, { type: sourceType, caddyRules });
    }

    /**
     * Valide le Caddyfile généré en utilisant la commande caddy validate
     */
    private async validateCaddyfile(caddyfilePath: string): Promise<void> {
        try {
            await execAsync(`caddy validate --config ${caddyfilePath}`);
        } catch (error: any) {
            throw new Error(`Validation du Caddyfile échouée: ${error.stderr || error.message}`);
        }
    }

    /**
     * Génère ou met à jour un fichier docker-compose.yml pour inclure Caddy
     */
    private async generateDockerCompose(context: AgentContext): Promise<void> {
        if (!this.config.dockerCompose?.generate) {
            return;
        }

        const dockerComposePath = this.config.dockerCompose.outputPath || path.join(path.dirname(this.config.outputPath), 'docker-compose.yml');
        const caddyfilePath = path.relative(path.dirname(dockerComposePath), this.config.outputPath);
        const networkName = this.config.dockerCompose.networkName || 'caddy_network';

        const dockerCompose: any = {
            version: '3',
            services: {
                caddy: {
                    image: `caddy:${this.config.dockerCompose.caddyVersion || 'latest'}`,
                    restart: 'unless-stopped',
                    ports: [
                        `${this.config.advanced?.httpPort || 80}:${this.config.advanced?.httpPort || 80}`,
                        `${this.config.advanced?.httpsPort || 443}:${this.config.advanced?.httpsPort || 443}`
                    ],
                    volumes: [
                        `${caddyfilePath}:/etc/caddy/Caddyfile:ro`,
                        'caddy_data:/data',
                        'caddy_config:/config'
                    ],
                    networks: [
                        networkName
                    ]
                }
            },
            volumes: {
                caddy_data: {},
                caddy_config: {}
            },
            networks: {
                [networkName]: {
                    driver: 'bridge'
                }
            }
        };

        // Ajout des volumes supplémentaires si spécifiés
        if (this.config.dockerCompose.extraVolumes) {
            Object.assign(dockerCompose.volumes, this.config.dockerCompose.extraVolumes);
        }

        // Ajout des ports supplémentaires si spécifiés
        if (this.config.dockerCompose.extraPorts && this.config.dockerCompose.extraPorts.length > 0) {
            dockerCompose.services.caddy.ports.push(...this.config.dockerCompose.extraPorts);
        }

        // Création du dossier de sortie si nécessaire
        fs.mkdirSync(path.dirname(dockerComposePath), { recursive: true });
        fs.writeFileSync(dockerComposePath, JSON.stringify(dockerCompose, null, 2));
        context.logger.info(`Docker Compose généré avec succès: ${dockerComposePath}`);
    }

    /**
     * Analyse les règles converties pour détecter les problèmes potentiels
     */
    private analyzeConvertedRules(context: AgentContext): void {
        // Analyse basique des règles converties pour détecter les problèmes potentiels
        const warnings: string[] = [];

        for (const [sourcePath, { type, caddyRules }] of this.convertedRules.entries()) {
            // Vérification des directives non prises en charge
            if (caddyRules.includes('# UNSUPPORTED:')) {
                warnings.push(`Le fichier ${sourcePath} contient des directives non prises en charge`);
            }

            // Vérification des directives de réécriture complexes
            if (type === 'htaccess' && caddyRules.includes('rewrite ')) {
                warnings.push(`Le fichier ${sourcePath} contient des règles de réécriture complexes qui pourraient nécessiter une vérification manuelle`);
            }

            // Vérification des variables d'environnement
            if (caddyRules.includes('{env.')) {
                warnings.push(`Le fichier ${sourcePath} utilise des variables d'environnement qui doivent être définies correctement`);
            }
        }

        // Affichage des avertissements
        if (warnings.length > 0) {
            context.logger.warn('Avertissements lors de la conversion des règles:');
            for (const warning of warnings) {
                context.logger.warn(` - ${warning}`);
            }
            context.logger.warn('Veuillez vérifier manuellement le Caddyfile généré pour vous assurer que tout est correct.');
        } else {
            context.logger.info('Aucun problème détecté dans les règles converties.');
        }
    }
}