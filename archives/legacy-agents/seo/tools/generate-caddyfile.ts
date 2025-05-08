/**
 * Script de génération de Caddyfile
 * 
 * Ce script utilise le générateur de Caddyfile pour convertir des configurations
 * NGINX ou .htaccess en fichiers de configuration Caddy.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import CaddyfileGenerator from '../caddyfile-generator';

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), 'generated-caddyfiles');
const DEFAULT_EMAIL = 'admin@example.com';

/**
 * Fonction principale
 */
async function main() {
    console.log('🚀 Démarrage du générateur de Caddyfile...');

    try {
        // Créer le répertoire de sortie s'il n'existe pas
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Instancier le générateur de Caddyfile
        const generator = new CaddyfileGenerator({
            outputDir: OUTPUT_DIR,
            defaultEmail: DEFAULT_EMAIL
        });

        // Exemple 1: Migration d'un site PHP avec .htaccess
        console.log('📄 Génération de Caddyfile pour un site PHP avec .htaccess...');
        await generatePhpSiteExample(generator);

        // Exemple 2: Migration d'un site NGINX avec configuration avancée
        console.log('📄 Génération de Caddyfile pour un site avec NGINX...');
        await generateNginxSiteExample(generator);

        // Exemple 3: Multi-site avec différentes configurations
        console.log('📄 Génération de Caddyfile pour une configuration multi-site...');
        await generateMultiSiteExample(generator);

        console.log(`✅ Génération de Caddyfile terminée! Les fichiers sont disponibles dans ${OUTPUT_DIR}`);

    } catch (error) {
        console.error('❌ Erreur lors de la génération des Caddyfiles:', error);
        process.exit(1);
    }
}

/**
 * Génère un exemple de site PHP avec .htaccess
 */
async function generatePhpSiteExample(generator: CaddyfileGenerator): Promise<void> {
    // Créer un exemple de fichier .htaccess
    const htaccessContent = `
# Configuration Apache pour site PHP
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirection HTTP vers HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Redirection www vers non-www
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
  
  # URLs propres pour le blog
  RewriteRule ^blog/([0-9]+)/([a-zA-Z0-9-]+)$ /blog.php?id=$1&slug=$2 [L]
  
  # Redirection des anciennes URLs
  Redirect 301 /ancien-blog.php /blog
  Redirect 301 /produits.php /boutique
  Redirect 410 /services-obsoletes.php
  
  # Fichiers statiques
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.php [L]
</IfModule>

# Configuration PHP
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value memory_limit 256M
php_value max_execution_time 300

# En-têtes de sécurité
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;

    // Sauvegarder le fichier .htaccess exemple
    const htaccessPath = path.join(OUTPUT_DIR, 'exemple-htaccess');
    await fs.mkdir(htaccessPath, { recursive: true });
    await fs.writeFile(path.join(htaccessPath, '.htaccess'), htaccessContent);

    // Analyser le .htaccess et générer une configuration Caddy
    const phpSiteConfig = await generator.parseHtaccess(
        path.join(htaccessPath, '.htaccess'),
        'example-php-site.com'
    );

    // Ajouter des configurations supplémentaires spécifiques à PHP
    phpSiteConfig.root = '/var/www/html/example-php-site';
    phpSiteConfig.php = {
        enabled: true,
        version: '8.2',
        maxUploadSize: '50M'
    };

    // Ajouter la configuration au générateur
    generator.addSite(phpSiteConfig);

    // Générer le Caddyfile pour ce site uniquement
    const caddyfile = generator.generateSiteCaddyfile(phpSiteConfig);

    // Enregistrer le Caddyfile généré
    await fs.writeFile(
        path.join(OUTPUT_DIR, 'example-php-site.Caddyfile'),
        caddyfile
    );
}

/**
 * Génère un exemple de site avec NGINX
 */
async function generateNginxSiteExample(generator: CaddyfileGenerator): Promise<void> {
    // Créer un exemple de fichier de configuration NGINX
    const nginxContent = `
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # En-têtes de sécurité
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    
    location / {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API v1
    location /api/v1 {
        proxy_pass http://localhost:3000/api/v1;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API v2
    location /api/v2 {
        proxy_pass http://localhost:3001/api/v2;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Ressources statiques
    location /static {
        alias /var/www/static;
        expires 7d;
    }
    
    # Anciennes API (redirection)
    location /api/legacy {
        return 301 /api/v2$request_uri;
    }
    
    # API obsolètes
    location /api/v0 {
        return 410;
    }
    
    # Documentation
    location /docs {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`;

    // Sauvegarder le fichier NGINX exemple
    const nginxPath = path.join(OUTPUT_DIR, 'exemple-nginx');
    await fs.mkdir(nginxPath, { recursive: true });
    await fs.writeFile(path.join(nginxPath, 'api.conf'), nginxContent);

    // Analyser le fichier NGINX et générer une configuration Caddy
    const apiSiteConfig = await generator.parseNginxConfig(
        path.join(nginxPath, 'api.conf'),
        'api.example.com'
    );

    // Ajouter des configurations supplémentaires spécifiques
    apiSiteConfig.enableHTTP3 = true;
    apiSiteConfig.email = 'api-admin@example.com';

    // Vérifier que nous avons bien des chemins de proxy
    if (!apiSiteConfig.reverseProxy) {
        apiSiteConfig.reverseProxy = [];
    }

    // S'assurer que nous avons les bonnes configurations de proxy
    const existingPaths = apiSiteConfig.reverseProxy.map(proxy => proxy.path);

    if (!existingPaths.includes('/')) {
        apiSiteConfig.reverseProxy.push({
            path: '/',
            target: 'localhost:3000'
        });
    }

    if (!existingPaths.includes('/docs')) {
        apiSiteConfig.reverseProxy.push({
            path: '/docs',
            target: 'localhost:3002'
        });
    }

    // Ajouter la configuration au générateur
    generator.addSite(apiSiteConfig);

    // Générer le Caddyfile pour ce site uniquement
    const caddyfile = generator.generateSiteCaddyfile(apiSiteConfig);

    // Enregistrer le Caddyfile généré
    await fs.writeFile(
        path.join(OUTPUT_DIR, 'api.example.com.Caddyfile'),
        caddyfile
    );
}

/**
 * Génère un exemple de configuration multi-site
 */
async function generateMultiSiteExample(generator: CaddyfileGenerator): Promise<void> {
    // Configuration du site principal
    generator.addSite({
        domain: 'example.org',
        root: '/var/www/example.org',
        email: 'admin@example.org',
        enableCompression: true,
        enableHTTP3: true,
        securityHeaders: true,
        php: {
            enabled: true,
            version: '8.1'
        },
        customSnippets: [
            'redir /blog/archive/* /blog/archives{uri} permanent',
            'redir /old-contact.php /contact permanent',
            'handle_path /api/* {',
            '  reverse_proxy localhost:4000',
            '}'
        ]
    });

    // Configuration du sous-domaine blog
    generator.addSite({
        domain: 'blog.example.org',
        root: '/var/www/blog.example.org',
        email: 'admin@example.org',
        php: {
            enabled: true,
            version: '8.1'
        }
    });

    // Configuration du sous-domaine app (SPA)
    generator.addSite({
        domain: 'app.example.org',
        root: '/var/www/app.example.org/dist',
        enableCompression: true,
        enableHTTP3: true,
        securityHeaders: true,
        customSnippets: [
            'try_files {path} /index.html'
        ]
    });

    // Configuration de l'API (Node.js backend)
    generator.addSite({
        domain: 'api.example.org',
        reverseProxy: [
            {
                path: '/',
                target: 'localhost:3000'
            }
        ],
        securityHeaders: true,
        enableCompression: true
    });

    // Générer le Caddyfile complet avec tous les sites
    const caddyfilePath = await generator.generateAndSave(
        path.join(OUTPUT_DIR, 'multi-site.Caddyfile')
    );

    // Log de la réussite
    console.log(`📄 Caddyfile multi-site généré : ${caddyfilePath}`);
}

// Exécution
main().catch(error => {
    console.error('Erreur lors de l\'exécution du générateur de Caddyfile:', error);
    process.exit(1);
});