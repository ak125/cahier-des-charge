#!/usr/bin/env node
/**
 * Script pour générer les configurations nécessaires à la préservation des anciennes URLs PHP
 * Crée des configurations pour Remix, Next.js, Caddy et NGINX
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');

program
    .description('Génère les configurations pour préserver les anciennes URLs PHP')
    .option('-i, --input <path>', 'Chemin vers le fichier contenant les URLs à préserver', './legacy-urls.txt')
    .option('-o, --output <dir>', 'Dossier de sortie pour les configurations générées', './url-configs')
    .option('-t, --types <types>', 'Types de configurations à générer (remix,next,caddy,nginx)', 'remix,next,caddy,nginx')
    .option('-b, --base-path <path>', 'Chemin de base pour les routes (ex: /api)', '')
    .option('-p, --prefix <prefix>', 'Préfixe à ajouter aux noms de fichiers générés', '')
    .option('--use-json', 'Utiliser le fichier JSON comme source (plus détaillé)', false)
    .parse();

const options = program.opts();

// Fonction pour charger les URLs depuis un fichier texte
async function loadUrlsFromTxt(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                // Extraire l'URL sans commentaires
                const urlMatch = line.match(/^([^#]+)/);
                return urlMatch ? urlMatch[1].trim() : null;
            })
            .filter(Boolean);
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors du chargement des URLs: ${error.message}`));
        process.exit(1);
    }
}

// Fonction pour charger les URLs depuis un fichier JSON
async function loadUrlsFromJson(filePath) {
    try {
        const jsonPath = filePath.replace(/\.txt$/, '') + '.json';
        const content = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(content);

        // Extraire les URLs avec leurs métadonnées
        return Object.entries(data.urlStats).map(([url, stats]) => ({
            url,
            count: stats.count,
            origins: stats.origins,
            params: stats.params || [],
            clicks: stats.clicks,
            impressions: stats.impressions,
            position: stats.position
        }));
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors du chargement des URLs JSON: ${error.message}`));
        console.log(chalk.yellow(`⚠️ Utilisation du fichier texte à la place`));

        // Fallback au fichier texte
        const simpleUrls = await loadUrlsFromTxt(filePath);
        return simpleUrls.map(url => ({ url }));
    }
}

// Fonction pour convertir une URL PHP en nom de fichier/route moderne
function convertUrlToModernRoute(url) {
    // Enlever l'extension .php
    let modernRoute = url.replace(/\.php$/, '');

    // Traiter les cas spéciaux
    if (modernRoute === '/index') {
        modernRoute = '/';
    }

    return modernRoute;
}

// Fonction pour extraire les paramètres d'une URL
function extractUrlParams(url, knownParams = []) {
    const urlObj = new URL(url, 'http://example.com');
    const params = {};

    // Extraire les paramètres de l'URL
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
}

// Fonction pour analyser la structure d'une URL
function analyzeUrlStructure(url) {
    const urlObj = new URL(url, 'http://example.com');
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const extension = path.extname(urlObj.pathname);
    const fileName = path.basename(urlObj.pathname);
    const paramKeys = Array.from(urlObj.searchParams.keys());

    return {
        path: urlObj.pathname,
        segments: pathSegments,
        extension,
        fileName,
        hasParams: paramKeys.length > 0,
        paramKeys,
        queryString: urlObj.search
    };
}

// Fonction pour générer la configuration Remix
async function generateRemixConfig(urls, outputDir, basePath) {
    console.log(chalk.blue('🎵 Génération de la configuration Remix...'));

    try {
        // Créer le dossier de sortie
        const remixDir = path.join(outputDir, 'remix');
        await fs.mkdir(remixDir, { recursive: true });

        // Créer le dossier routes
        const routesDir = path.join(remixDir, 'routes');
        await fs.mkdir(routesDir, { recursive: true });

        // Créer le fichier de configuration principal
        let routesCode = `/**
 * Configuration des routes Remix pour préserver les anciennes URLs PHP
 * Généré automatiquement le ${new Date().toISOString()}
 */

import { RouteObject } from '@remix-run/react';
import { LegacyPhpHandler } from '../components/LegacyPhpHandler';

// Définition des routes pour les anciennes URLs PHP
export const legacyPhpRoutes: RouteObject[] = [
`;

        // Définitions des pages de composants individuels
        const components = new Set();
        const urlsMetadata = [];

        // Traiter chaque URL
        for (const urlObj of urls) {
            const url = urlObj.url;
            const urlData = analyzeUrlStructure(url);
            const modernRoute = convertUrlToModernRoute(url);
            const componentName = `Legacy${urlData.fileName.replace(/\W+/g, '')}Page`;

            components.add(componentName);

            // Ajouter la route
            routesCode += `  {
    // ${url}${urlObj.count ? ` (${urlObj.count} hits)` : ''}
    path: "${basePath}${url}",
    element: <LegacyPhpHandler originalUrl="${url}" targetRoute="${modernRoute}" />,
  },\n`;

            // Stocker les métadonnées
            urlsMetadata.push({
                originalUrl: url,
                modernRoute,
                component: componentName,
                params: urlData.paramKeys,
                hasParams: urlData.hasParams,
                metadata: {
                    count: urlObj.count,
                    origins: urlObj.origins,
                    clicks: urlObj.clicks,
                    impressions: urlObj.impressions
                }
            });
        }

        routesCode += `];

export default legacyPhpRoutes;
`;

        await fs.writeFile(path.join(remixDir, 'legacyPhpRoutes.tsx'), routesCode);

        // Créer le composant LegacyPhpHandler
        const handlerCode = `/**
 * Composant pour gérer les anciennes URLs PHP
 * Fait le pont entre les anciennes URLs et les nouvelles routes
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';

interface LegacyPhpHandlerProps {
  originalUrl: string;
  targetRoute: string;
}

export function LegacyPhpHandler({ originalUrl, targetRoute }: LegacyPhpHandlerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Conserver les paramètres de requête originaux
    const queryParams = new URLSearchParams(searchParams);
    const targetUrl = targetRoute + (queryParams.toString() ? \`?\${queryParams.toString()}\` : '');
    
    // Router vers la nouvelle route sans changer l'URL visible
    // Cela permet de préserver l'URL originale dans la barre d'adresse
    navigate(targetUrl, { replace: true, state: { legacyUrl: originalUrl } });
    
    // Enregistrement pour analyse (optionnel)
    console.log(\`URL PHP préservée: \${originalUrl} -> \${targetUrl}\`);
  }, [originalUrl, targetRoute, searchParams, navigate]);
  
  // Ce composant ne rend rien visuellement, il gère uniquement le routage
  return null;
}
`;

        await fs.writeFile(path.join(remixDir, 'LegacyPhpHandler.tsx'), handlerCode);

        // Créer un exemple d'intégration
        const integrationCode = `/**
 * Exemple d'intégration des routes legacy PHP dans Remix
 */

import { createBrowserRouter } from '@remix-run/react';
import legacyPhpRoutes from './legacyPhpRoutes';

// Vos routes normales de l'application
const appRoutes = [
  // ... vos autres routes ici
];

// Créer le routeur avec les routes modernes et legacy
export const router = createBrowserRouter([
  ...appRoutes,
  ...legacyPhpRoutes // Ajouter les anciennes routes PHP
]);
`;

        await fs.writeFile(path.join(remixDir, 'exampleIntegration.tsx'), integrationCode);

        // Créer un fichier de métadonnées
        await fs.writeFile(
            path.join(remixDir, 'urlsMetadata.json'),
            JSON.stringify({
                generatedAt: new Date().toISOString(),
                basePath,
                urlsCount: urls.length,
                urls: urlsMetadata
            }, null, 2)
        );

        console.log(chalk.green(`✅ Configuration Remix générée dans ${remixDir}`));
        return remixDir;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération de la configuration Remix: ${error.message}`));
        return null;
    }
}

// Fonction pour générer la configuration Next.js
async function generateNextConfig(urls, outputDir, basePath) {
    console.log(chalk.blue('⚫ Génération de la configuration Next.js...'));

    try {
        // Créer le dossier de sortie
        const nextDir = path.join(outputDir, 'nextjs');
        await fs.mkdir(nextDir, { recursive: true });

        // Créer le dossier pages pour les routes dynamiques
        const pagesDir = path.join(nextDir, 'pages');
        await fs.mkdir(pagesDir, { recursive: true });

        // Créer le fichier de middleware pour gérer les anciennes URLs
        const middlewareCode = `/**
 * Middleware Next.js pour préserver les anciennes URLs PHP
 * Généré automatiquement le ${new Date().toISOString()}
 */

import { NextRequest, NextResponse } from 'next/server';
import { legacyUrlMap } from './legacyUrlMap';

export function middleware(request: NextRequest) {
  // Récupérer le chemin de l'URL demandée
  const pathname = request.nextUrl.pathname;
  
  // Vérifier si c'est une ancienne URL PHP
  const legacyUrl = Object.keys(legacyUrlMap).find(url => {
    if (url.endsWith('.php')) {
      // Pour les URLs qui se terminent par .php, faire une correspondance exacte
      return pathname === url;
    } else {
      // Pour les autres, vérifier si le chemin commence par l'URL legacy
      return pathname.startsWith(url);
    }
  });
  
  if (legacyUrl) {
    // Récupérer la nouvelle route correspondante
    const modernRoute = legacyUrlMap[legacyUrl];
    
    // Conserver les paramètres de requête
    const url = request.nextUrl.clone();
    url.pathname = modernRoute;
    
    // Rewriter l'URL en interne sans changer l'URL visible
    return NextResponse.rewrite(url);
  }
  
  // Pas d'ancienne URL PHP, continuer normalement
  return NextResponse.next();
}

// Configurer les chemins pour lesquels le middleware sera exécuté
export const config = {
  matcher: [
    // Routes qui correspondent aux anciennes URLs PHP
    ${urls.map(urlObj => `'${basePath}${urlObj.url}'`).join(',\n    ')}
  ]
};
`;

        await fs.writeFile(path.join(nextDir, 'middleware.ts'), middlewareCode);

        // Créer la carte de correspondance des URLs
        let mapCode = `/**
 * Carte de correspondance entre les anciennes URLs PHP et les nouvelles routes
 * Généré automatiquement le ${new Date().toISOString()}
 */

export const legacyUrlMap: Record<string, string> = {
`;

        // Ajouter chaque URL à la carte
        for (const urlObj of urls) {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);
            mapCode += `  '${basePath}${url}': '${basePath}${modernRoute}',\n`;
        }

        mapCode += `};
`;

        await fs.writeFile(path.join(nextDir, 'legacyUrlMap.ts'), mapCode);

        // Créer un exemple de composant pour les pages préservées
        const legacyPageCode = `/**
 * Composant exemple pour une page legacy PHP
 */

import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LegacyPhpPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Vous pouvez faire du traitement ici basé sur l'ancienne URL
    console.log('Page legacy PHP accédée avec les paramètres:', router.query);
    
    // Optionnel: analytics pour suivre les anciennes URLs accédées
    if (typeof window !== 'undefined') {
      // Enregistrer l'accès à l'ancienne URL
    }
  }, [router.query]);
  
  // Renvoyer le contenu de la nouvelle page
  return (
    <div className="legacy-page">
      <h1>Page migrée depuis PHP</h1>
      <p>Cette page était précédemment une page PHP.</p>
      <pre>{JSON.stringify(router.query, null, 2)}</pre>
    </div>
  );
}
`;

        await fs.writeFile(path.join(nextDir, 'LegacyPhpPage.tsx'), legacyPageCode);

        // Créer un exemple de next.config.js
        const nextConfigCode = `/**
 * Configuration Next.js pour gérer les anciennes URLs PHP
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ajouter rewrites pour les anciennes URLs PHP
  async rewrites() {
    return {
      beforeFiles: [
        // Les anciennes URLs PHP seront traitées par les mêmes pages que les nouvelles
        // Cela se fait au niveau du serveur, donc pas de redirection client
${urls.slice(0, 5).map(urlObj => {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);
            return `        {
          source: '${basePath}${url}', 
          destination: '${basePath}${modernRoute}'
        }`;
        }).join(',\n')}${urls.length > 5 ? ',\n        // ... autres routes legacy' : ''}
      ]
    };
  }
};

module.exports = nextConfig;
`;

        await fs.writeFile(path.join(nextDir, 'next.config.js'), nextConfigCode);

        // Créer un fichier de métadonnées
        await fs.writeFile(
            path.join(nextDir, 'urlsMetadata.json'),
            JSON.stringify({
                generatedAt: new Date().toISOString(),
                basePath,
                urlsCount: urls.length,
                urls: urls.map(urlObj => {
                    const url = urlObj.url;
                    const urlData = analyzeUrlStructure(url);

                    return {
                        originalUrl: url,
                        modernRoute: convertUrlToModernRoute(url),
                        params: urlData.paramKeys,
                        hasParams: urlData.hasParams,
                        metadata: {
                            count: urlObj.count,
                            origins: urlObj.origins,
                            clicks: urlObj.clicks,
                            impressions: urlObj.impressions
                        }
                    };
                })
            }, null, 2)
        );

        console.log(chalk.green(`✅ Configuration Next.js générée dans ${nextDir}`));
        return nextDir;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération de la configuration Next.js: ${error.message}`));
        return null;
    }
}

// Fonction pour générer la configuration Caddy
async function generateCaddyConfig(urls, outputDir, basePath) {
    console.log(chalk.blue('📦 Génération de la configuration Caddy...'));

    try {
        // Créer le dossier de sortie
        const caddyDir = path.join(outputDir, 'caddy');
        await fs.mkdir(caddyDir, { recursive: true });

        // Créer le fichier Caddyfile
        let caddyCode = `# Configuration Caddy pour préserver les anciennes URLs PHP
# Généré automatiquement le ${new Date().toISOString()}

# Domaine principal
your-domain.com {
  # Rediriger HTTP vers HTTPS
  redir https://{host}{uri} permanent
}

# Domaine HTTPS
https://your-domain.com {
  # Configuration TLS (à personnaliser)
  tls {
    # Vous pouvez spécifier vos certificats SSL ici
    # cert /chemin/vers/cert.pem
    # key /chemin/vers/key.pem
  }
  
  # Chemin vers l'application moderne
  root * /var/www/app/build
  
  # Règles pour préserver les anciennes URLs PHP
`;

        // Ajouter chaque URL à la configuration
        for (const urlObj of urls) {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);

            caddyCode += `
  # Préserver ${url}${urlObj.count ? ` (${urlObj.count} hits)` : ''}
  @legacy_${url.replace(/\W+/g, '_')} {
    path ${basePath}${url}
  }
  rewrite @legacy_${url.replace(/\W+/g, '_')} ${basePath}${modernRoute} internal
`;
        }

        caddyCode += `
  # Gestion des fichiers statiques
  file_server
  
  # Règles pour le reverse proxy vers le serveur d'application
  reverse_proxy @api localhost:3000
  
  # Toute autre requête est gérée par l'application
  try_files {path} /index.html
}
`;

        await fs.writeFile(path.join(caddyDir, 'Caddyfile'), caddyCode);

        // Créer une version plus simple pour référence
        let simpleCaddyCode = `# Configuration Caddy simplifée pour préserver les anciennes URLs PHP
# Généré automatiquement le ${new Date().toISOString()}

{
  # Configuration globale
  admin off  # Désactiver l'API admin pour la production
}

your-domain.com {
  # Gérer les anciennes URLs PHP
  handle_path ${basePath} {
`;

        // Ajouter les quelques premières URLs comme exemple
        const topUrls = urls.slice(0, 10);
        topUrls.forEach(urlObj => {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);

            simpleCaddyCode += `    # Préserver ${url}
    rewrite ${url} ${modernRoute}
    
`;
        });

        if (urls.length > 10) {
            simpleCaddyCode += `    # ... autres routes préservées (${urls.length - 10} URLs supplémentaires)
    
`;
        }

        simpleCaddyCode += `  }
  
  # Servir l'application
  root * /var/www/app/dist
  try_files {path} /index.html
  file_server
}
`;

        await fs.writeFile(path.join(caddyDir, 'Caddyfile.simple'), simpleCaddyCode);

        // Créer un fichier JSON avec toutes les règles pour import programmatique
        await fs.writeFile(
            path.join(caddyDir, 'caddy-rules.json'),
            JSON.stringify({
                generatedAt: new Date().toISOString(),
                basePath,
                urlsCount: urls.length,
                rules: urls.map(urlObj => {
                    const url = urlObj.url;
                    return {
                        originalUrl: url,
                        modernRoute: convertUrlToModernRoute(url),
                        rewriteRule: {
                            from: `${basePath}${url}`,
                            to: `${basePath}${convertUrlToModernRoute(url)}`,
                            internal: true
                        },
                        metadata: {
                            count: urlObj.count,
                            origins: urlObj.origins,
                            clicks: urlObj.clicks,
                            impressions: urlObj.impressions
                        }
                    };
                })
            }, null, 2)
        );

        console.log(chalk.green(`✅ Configuration Caddy générée dans ${caddyDir}`));
        return caddyDir;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération de la configuration Caddy: ${error.message}`));
        return null;
    }
}

// Fonction pour générer la configuration NGINX
async function generateNginxConfig(urls, outputDir, basePath) {
    console.log(chalk.blue('🟩 Génération de la configuration NGINX...'));

    try {
        // Créer le dossier de sortie
        const nginxDir = path.join(outputDir, 'nginx');
        await fs.mkdir(nginxDir, { recursive: true });

        // Créer le fichier de configuration principal
        let nginxCode = `# Configuration NGINX pour préserver les anciennes URLs PHP
# Généré automatiquement le ${new Date().toISOString()}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Rediriger HTTP vers HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # Configuration SSL (à personnaliser)
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    
    # Racine du projet
    root /var/www/app/dist;
    index index.html;
    
    # Configuration pour préserver les anciennes URLs PHP
    
`;

        // Ajouter chaque URL à la configuration
        for (const urlObj of urls) {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);

            nginxCode += `    # Préserver ${url}${urlObj.count ? ` (${urlObj.count} hits)` : ''}
    location = ${basePath}${url} {
        # Conserver les paramètres de requête
        rewrite ^(.*)$ ${basePath}${modernRoute} last;
    }
    
`;
        }

        nginxCode += `    # Servir l'application pour toutes les autres routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Configuration pour les assets statiques
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }
    
    # Journaux d'accès et d'erreurs
    access_log /var/log/nginx/your-domain.com-access.log;
    error_log /var/log/nginx/your-domain.com-error.log;
}
`;

        await fs.writeFile(path.join(nginxDir, 'nginx.conf'), nginxCode);

        // Créer une version avec includes pour les gros sites
        if (urls.length > 20) {
            // Créer un fichier de configuration principal avec include
            let nginxMainCode = `# Configuration NGINX principale pour préserver les anciennes URLs PHP
# Généré automatiquement le ${new Date().toISOString()}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Rediriger HTTP vers HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # Configuration SSL (à personnaliser)
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    
    # Racine du projet
    root /var/www/app/dist;
    index index.html;
    
    # Inclure les configurations des anciennes URLs PHP
    include /etc/nginx/legacy-urls/*.conf;
    
    # Servir l'application pour toutes les autres routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Configuration pour les assets statiques
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }
    
    # Journaux d'accès et d'erreurs
    access_log /var/log/nginx/your-domain.com-access.log;
    error_log /var/log/nginx/your-domain.com-error.log;
}
`;

            await fs.writeFile(path.join(nginxDir, 'nginx-with-includes.conf'), nginxMainCode);

            // Créer le dossier pour les includes
            const includesDir = path.join(nginxDir, 'legacy-urls');
            await fs.mkdir(includesDir, { recursive: true });

            // Diviser les URLs en plusieurs fichiers (100 par fichier)
            const urlsPerFile = 100;
            const chunks = [];

            for (let i = 0; i < urls.length; i += urlsPerFile) {
                chunks.push(urls.slice(i, i + urlsPerFile));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunkUrls = chunks[i];
                let chunkCode = `# Configuration NGINX des anciennes URLs PHP (partie ${i + 1}/${chunks.length})
# Généré automatiquement le ${new Date().toISOString()}

`;

                chunkUrls.forEach(urlObj => {
                    const url = urlObj.url;
                    const modernRoute = convertUrlToModernRoute(url);

                    chunkCode += `# Préserver ${url}${urlObj.count ? ` (${urlObj.count} hits)` : ''}
location = ${basePath}${url} {
    rewrite ^(.*)$ ${basePath}${modernRoute} last;
}

`;
                });

                await fs.writeFile(path.join(includesDir, `legacy-urls-${i + 1}.conf`), chunkCode);
            }
        }

        // Créer un fichier de map pour référence
        let mapCode = `# Map NGINX pour les URL legacy
# Généré automatiquement le ${new Date().toISOString()}
# À inclure dans un bloc http{}

map $request_uri $legacy_url_mapping {
    # Par défaut, pas de redirection
    default "";
    
`;

        // Ajouter quelques exemples au map
        urls.slice(0, 20).forEach(urlObj => {
            const url = urlObj.url;
            const modernRoute = convertUrlToModernRoute(url);
            mapCode += `    "${basePath}${url}" "${basePath}${modernRoute}";\n`;
        });

        if (urls.length > 20) {
            mapCode += `    # ... autres mappings (${urls.length - 20} URLs supplémentaires)\n`;
        }

        mapCode += `}

# Exemple d'utilisation:
# if ($legacy_url_mapping) {
#     rewrite ^ $legacy_url_mapping last;
# }
`;

        await fs.writeFile(path.join(nginxDir, 'legacy-url-map.conf'), mapCode);

        // Créer un fichier JSON avec toutes les règles pour import programmatique
        await fs.writeFile(
            path.join(nginxDir, 'nginx-rules.json'),
            JSON.stringify({
                generatedAt: new Date().toISOString(),
                basePath,
                urlsCount: urls.length,
                rules: urls.map(urlObj => {
                    const url = urlObj.url;
                    return {
                        originalUrl: url,
                        modernRoute: convertUrlToModernRoute(url),
                        rewriteRule: {
                            location: `${basePath}${url}`,
                            rewrite: `^(.*)$ ${basePath}${convertUrlToModernRoute(url)} last;`
                        },
                        metadata: {
                            count: urlObj.count,
                            origins: urlObj.origins,
                            clicks: urlObj.clicks,
                            impressions: urlObj.impressions
                        }
                    };
                })
            }, null, 2)
        );

        console.log(chalk.green(`✅ Configuration NGINX générée dans ${nginxDir}`));
        return nginxDir;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération de la configuration NGINX: ${error.message}`));
        return null;
    }
}

// Point d'entrée principal
async function main() {
    try {
        // Vérifier si le dossier de sortie existe, sinon le créer
        await fs.mkdir(options.output, { recursive: true });

        // Charger les URLs depuis le fichier d'entrée
        let urls;
        if (options.useJson) {
            urls = await loadUrlsFromJson(options.input);
        } else {
            const simpleUrls = await loadUrlsFromTxt(options.input);
            urls = simpleUrls.map(url => ({ url }));
        }

        console.log(chalk.blue(`🔄 ${urls.length} URLs chargées depuis ${options.input}`));

        // Déterminer les types de configurations à générer
        const types = options.types.split(',').map(t => t.trim());
        const results = {};

        // Générer les configurations demandées
        if (types.includes('remix')) {
            results.remix = await generateRemixConfig(urls, options.output, options.basePath);
        }

        if (types.includes('next')) {
            results.next = await generateNextConfig(urls, options.output, options.basePath);
        }

        if (types.includes('caddy')) {
            results.caddy = await generateCaddyConfig(urls, options.output, options.basePath);
        }

        if (types.includes('nginx')) {
            results.nginx = await generateNginxConfig(urls, options.output, options.basePath);
        }

        // Créer un fichier README avec des instructions
        const readmeContent = `# Configurations pour la préservation des anciennes URLs PHP

Ce dossier contient des configurations générées automatiquement pour préserver les anciennes URLs PHP sans redirection.

## Contenu généré le ${new Date().toISOString()}

- **URLs traitées**: ${urls.length} URLs depuis \`${options.input}\`
- **Chemin de base**: ${options.basePath || '(racine)'}

## Configurations disponibles

${Object.entries(results).map(([type, dir]) => `- **${type}**: ${dir ? `Disponible dans \`${path.relative(options.output, dir)}\`` : 'Non généré'}`).join('\n')}

## Comment utiliser ces configurations

### Remix

1. Copiez les fichiers depuis \`${results.remix ? path.relative(options.output, results.remix) : 'remix'}\` dans votre projet Remix.
2. Intégrez les routes legacy dans votre configuration de routage principale.

### Next.js

1. Copiez les fichiers depuis \`${results.next ? path.relative(options.output, results.next) : 'nextjs'}\` dans votre projet Next.js.
2. Assurez-vous que le middleware est correctement configuré.

### Caddy

1. Intégrez les règles depuis \`${results.caddy ? path.relative(options.output, results.caddy) : 'caddy'}/Caddyfile\` dans votre configuration Caddy.
2. Ajustez les chemins selon votre environnement.

### NGINX

1. Intégrez les règles depuis \`${results.nginx ? path.relative(options.output, results.nginx) : 'nginx'}/nginx.conf\` dans votre configuration NGINX.
2. Pour les sites avec beaucoup d'URLs, utilisez la version avec includes.

## Tester les configurations

Utilisez le script \`test-urls.js\` pour vérifier que les anciennes URLs sont correctement préservées sans redirection :

\`\`\`
node test-urls.js --urls=${options.input} --base-url=https://votre-site.com --expect=200 --no-redirect
\`\`\`

## Documentation

Pour plus d'informations sur la stratégie de préservation des URLs sans redirection, consultez la documentation complète.

`;

        await fs.writeFile(path.join(options.output, 'README.md'), readmeContent);

        console.log(chalk.green(`✅ Configurations générées dans ${options.output}`));
        console.log(chalk.blue('📝 Un fichier README.md avec des instructions a été créé'));

    } catch (error) {
        console.error(chalk.red(`❌ Erreur: ${error.message}`));
        process.exit(1);
    }
}

// Lancer le script
main();