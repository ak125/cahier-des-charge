/**
 * routing-sync.ts
 * 
 * Outil de synchronisation des routes pour la migration PHP vers Remix/NestJS
 * Identifie les anciennes routes .php et génère la carte de redirection url_redirection_map.json
 * 
 * Date: 2025-04-13
 * Auteur: Migration Team
 */

import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import * as glob from globstructure-agent';
import { execSync } from child_processstructure-agent';

// Configuration
const CONFIG = {
  // Chemins de recherche pour les fichiers PHP
  phpSourceDirs: [
    './appsDoDotmcp-server-php/public',
    './appsDoDotmcp-server-php/src',
    './backups/php-legacy'
  ],
  // Répertoire de destination pour les nouvelles routes Remix
  remixRoutesDir: './apps/frontend/app/routes',
  // Répertoire NestJS pour les routes d'API
  nestjsRoutesDir: './appsDoDotmcp-server-postgres/src/controllers',
  // Fichiers de sortie
  redirectMapPath: './reports/url_redirection_map.json',
  auditIndexPath: './reports/audit_index.json',
  routesReportPath: './reports/routes_migration_status.json',
  // Ignorer certains fichiers/dossiers
  ignorePatterns: [
    'node_modules',
    'vendor',
    'DoDoDoDotgit',
    'cache',
    'tmp',
    'admin/lib'
  ],
  // Préfixes de routes à conserver tels quels (pas de redirection)
  preservePrefixes: [
    '/api/',
    '/assets/',
    '/static/',
    '/uploads/'
  ],
  // Extensions de fichiers PHP à analyser
  phpExtensions: ['.php', '.phtml'],
  // Configurations spécifiques pour certaines routes
  specialRoutes: {
    '/index.php': '/',
    '/accueil.php': '/',
    '/home.php': '/'
  }
};

// Types
interface Route {
  originalPath: string;
  newPath: string;
  status: 'pending' | 'in-progress' | 'completed' | 'verified';
  type: 'page' | 'api' | 'redirect' | 'rewrite' | 'static';
  phpFile: string;
  remixFile?: string;
  nestjsFile?: string;
  seoExtracted: boolean;
  priority: number;
  dependencies?: string[];
  redirectType?: '301' | '302' | 'rewrite';
  params?: string[];
  queries?: string[];
}

interface AuditIndex {
  lastUpdated: string;
  totalRoutes: number;
  migratedRoutes: number;
  pendingRoutes: number;
  routesByStatus: Record<string, number>;
  routesByType: Record<string, number>;
}

interface RoutesReport {
  summary: AuditIndex;
  routes: Route[];
}

// Fonction principale
async function main() {
  console.log('🔄 Démarrage de la synchronisation des routes PHP -> Remix/NestJS');

  // Créer les répertoires de sortie si nécessaires
  ensureDirectoriesExist([
    path.dirname(CONFIG.redirectMapPath),
    path.dirname(CONFIG.auditIndexPath),
    path.dirname(CONFIG.routesReportPath)
  ]);

  // Charger les données existantes si disponibles
  let existingRoutes: Route[] = [];
  let auditIndex: AuditIndex = {
    lastUpdated: new Date().toISOString(),
    totalRoutes: 0,
    migratedRoutes: 0,
    pendingRoutes: 0,
    routesByStatus: {},
    routesByType: {}
  };

  if (fs.existsSync(CONFIG.routesReportPath)) {
    try {
      const existingReport = JSON.parse(fs.readFileSync(CONFIG.routesReportPath, 'utf8')) as RoutesReport;
      existingRoutes = existingReport.routes;
      console.log(`📊 Rapport existant chargé: ${existingRoutes.length} routes`);
    } catch (error) {
      console.error('⚠️ Erreur lors du chargement du rapport existant:', error);
    }
  }

  // Découvrir toutes les routes PHP
  const phpFiles = await discoverPhpFiles();
  console.log(`🔍 Découvert ${phpFiles.length} fichiers PHP`);

  // Extraire les routes à partir des fichiers PHP
  const routes = await extractRoutesFromPhpFiles(phpFiles, existingRoutes);
  console.log(`🛣️ Extrait ${routes.length} routes à partir des fichiers PHP`);

  // Vérifier les routes Remix existantes
  const remixRoutes = await discoverRemixRoutes();
  console.log(`📱 Découvert ${remixRoutes.length} routes Remix existantes`);

  // Vérifier les contrôleurs NestJS existants
  const nestjsControllers = await discoverNestjsControllers();
  console.log(`🔌 Découvert ${nestjsControllers.length} contrôleurs NestJS existants`);

  // Mettre à jour les statuts des routes
  const updatedRoutes = updateRoutesStatus(routes, remixRoutes, nestjsControllers);

  // Générer la carte de redirection
  const redirectionMap = generateRedirectionMap(updatedRoutes);
  fs.writeFileSync(CONFIG.redirectMapPath, JSON.stringify(redirectionMap, null, 2));
  console.log(`📝 Carte de redirection enregistrée: ${CONFIG.redirectMapPath}`);

  // Mettre à jour l'audit index
  auditIndex = updateAuditIndex(updatedRoutes);
  fs.writeFileSync(CONFIG.auditIndexPath, JSON.stringify(auditIndex, null, 2));
  console.log(`📊 Index d'audit mis à jour: ${CONFIG.auditIndexPath}`);

  // Générer le rapport de routes
  const routesReport: RoutesReport = {
    summary: auditIndex,
    routes: updatedRoutes
  };
  fs.writeFileSync(CONFIG.routesReportPath, JSON.stringify(routesReport, null, 2));
  console.log(`📄 Rapport de routes généré: ${CONFIG.routesReportPath}`);

  // Proposer les prochaines étapes
  suggestNextSteps(auditIndex);
}

// Assurer que les répertoires existent
function ensureDirectoriesExist(directories: string[]) {
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Découvrir tous les fichiers PHP
async function discoverPhpFiles(): Promise<string[]> {
  const phpFiles: string[] = [];

  for (const sourceDir of CONFIG.phpSourceDirs) {
    if (!fs.existsSync(sourceDir)) {
      console.warn(`⚠️ Répertoire source non trouvé: ${sourceDir}`);
      continue;
    }

    // Utiliser glob pour trouver tous les fichiers PHP
    for (const ext of CONFIG.phpExtensions) {
      const files = glob.sync(`${sourceDir}/**/*${ext}`, {
        ignore: CONFIG.ignorePatterns.map(pattern => `**/${pattern}/**`)
      });
      phpFiles.push(...files);
    }
  }

  return [...new Set(phpFiles)]; // Dédoublonner
}

// Extraire les routes à partir des fichiers PHP
async function extractRoutesFromPhpFiles(phpFiles: string[], existingRoutes: Route[]): Promise<Route[]> {
  const routes: Route[] = [];
  const existingRouteMap: Map<string, Route> = new Map(
    existingRoutes.map(route => [route.phpFile, route])
  );

  for (const phpFile of phpFiles) {
    const relativePath = getRelativePath(phpFile);
    const originalPath = phpPathToUrl(relativePath);
    let newPath = getNewPath(originalPath);
    
    // Vérifier si cette route existe déjà
    const existingRoute = existingRouteMap.get(phpFile);
    if (existingRoute) {
      routes.push(existingRoute);
      continue;
    }

    // Analyser le fichier PHP pour les informations supplémentaires
    const { type, params, queries } = analyzePhpFile(phpFile);

    // Créer une nouvelle route
    const route: Route = {
      originalPath,
      newPath,
      status: 'pending',
      type: type,
      phpFile,
      seoExtracted: false,
      priority: calculatePriority(originalPath, type),
      params: params,
      queries: queries
    };

    // Ajouter le type de redirection pour les routes n'ayant pas la même structure
    if (originalPath !== newPath) {
      route.redirectType = '301';
    }

    routes.push(route);
  }

  return routes;
}

// Convertir un chemin de fichier PHP en URL
function phpPathToUrl(relativePath: string): string {
  // Retirer l'extension .php et normaliser les slashes
  let url = relativePath.replace(/\\/g, '/');
  
  // Gérer les cas spéciaux comme index.php
  if (url.endsWith('/index.php')) {
    url = url.replace(/\/index\.php$/, '/');
  } else {
    url = url.replace(/\.php$/, '');
  }

  // S'assurer que l'URL commence par un slash
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  return url;
}

// Obtenir la nouvelle URL pour une route
function getNewPath(originalPath: string): string {
  // Vérifier si c'est une route spéciale
  if (CONFIG.specialRoutes[originalPath]) {
    return CONFIG.specialRoutes[originalPath];
  }

  // Vérifier si c'est un préfixe à préserver
  for (const prefix of CONFIG.preservePrefixes) {
    if (originalPath.startsWith(prefix)) {
      return originalPath;
    }
  }

  // Standardiser: 
  // 1. Remplacer les formats /module/action en /$module/$action
  // 2. Utiliser des kebab-case pour les mots multiples
  let newPath = originalPath;

  // Remplacer .html, .htm par rien
  newPath = newPath.replace(/\.(html|htm)$/, '');

  // Standardiser les paramètres dans l'URL (transformer ?id=123 en /123 si possible)
  if (newPath.includes('?')) {
    const [basePath, queryString] = newPath.split('?');
    const params = new URLSearchParams(queryString);
    
    // Cas courant: ?id=X -> /X
    if (params.has('id') && params.size === 1) {
      newPath = `${basePath}/${params.get('id')}`;
    }
  }

  return newPath;
}

// Analyser un fichier PHP pour obtenir des informations supplémentaires
function analyzePhpFile(phpFile: string): { type: Route['type'], params: string[], queries: string[] } {
  const content = fs.readFileSync(phpFile, 'utf8');
  const params: string[] = [];
  const queries: string[] = [];
  let type: Route['type'] = 'page';

  // Détecter si c'est une API ou une page
  if (content.includes('header(\'Content-Type: application/json\')') || 
      content.includes('json_encode(') ||
      phpFile.includes('/api/')) {
    type = 'api';
  } else if (content.includes('header(\'Location:')) {
    type = 'redirect';
  } else if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
    // Si pas de balise HTML mais des inclusions, c'est peut-être un fragment ou une redirection
    type = 'rewrite';
  }

  // Rechercher les paramètres GET
  const getParamRegex = /\$_GET\s*\[\s*['"](.*?)['"]]/g;
  let match;
  while ((match = getParamRegex.exec(content)) !== null) {
    queries.push(match[1]);
  }

  // Rechercher les paramètres de route
  const routeParamRegex = /\$_REQUEST\s*\[\s*['"](.*?)['"]]/g;
  while ((match = routeParamRegex.exec(content)) !== null) {
    params.push(match[1]);
  }

  return { type, params: [...new Set(params)], queries: [...new Set(queries)] };
}

// Obtenir le chemin relatif d'un fichier
function getRelativePath(filePath: string): string {
  for (const sourceDir of CONFIG.phpSourceDirs) {
    if (filePath.startsWith(sourceDir)) {
      return filePath.substring(sourceDir.length);
    }
  }
  return filePath;
}

// Calculer la priorité d'une route
function calculatePriority(path: string, type: Route['type']): number {
  let priority = 0;

  // Les routes de base ont une priorité plus élevée
  if (path === '/' || path === '/index' || path === '/home') {
    priority += 100;
  }

  // Les API ont une priorité plus élevée que les pages normales
  if (type === 'api') {
    priority += 50;
  }

  // Les routes avec paramètres ont une priorité plus basse car plus complexes
  if (path.includes('?') || path.includes(':')) {
    priority -= 20;
  }

  // Les routes courtes sont généralement plus importantes
  priority -= path.length / 10;

  return Math.round(priority);
}

// Découvrir les routes Remix existantes
async function discoverRemixRoutes(): Promise<string[]> {
  if (!fs.existsSync(CONFIG.remixRoutesDir)) {
    return [];
  }

  return glob.sync(`${CONFIG.remixRoutesDir}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/+*.*']
  });
}

// Découvrir les contrôleurs NestJS existants
async function discoverNestjsControllers(): Promise<string[]> {
  if (!fs.existsSync(CONFIG.nestjsRoutesDir)) {
    return [];
  }

  return glob.sync(`${CONFIG.nestjsRoutesDir}/**/*.controller.{ts,js}`);
}

// Mettre à jour les statuts des routes
function updateRoutesStatus(routes: Route[], remixRoutes: string[], nestjsControllers: string[]): Route[] {
  const updatedRoutes = [...routes];
  
  for (const route of updatedRoutes) {
    // Déterminer le chemin attendu pour le fichier Remix
    const expectedRemixPath = getExpectedRemixPath(route.newPath);
    const remixExists = remixRoutes.some(r => r.includes(expectedRemixPath));
    
    // Déterminer le chemin attendu pour le contrôleur NestJS si c'est une API
    const needsNestjs = route.type === 'api';
    const expectedNestjsPath = needsNestjs ? getExpectedNestjsPath(route.newPath) : '';
    const nestjsExists = needsNestjs ? nestjsControllers.some(c => c.includes(expectedNestjsPath)) : true;
    
    // Mettre à jour le statut et les chemins de fichiers
    if (remixExists) {
      route.remixFile = remixRoutes.find(r => r.includes(expectedRemixPath));
    }
    
    if (needsNestjs && nestjsExists) {
      route.nestjsFile = nestjsControllers.find(c => c.includes(expectedNestjsPath));
    }
    
    // Mettre à jour le statut
    if (remixExists && (!needsNestjs || nestjsExists)) {
      route.status = route.status === 'verified' ? 'verified' : 'completed';
    } else if (remixExists || nestjsExists) {
      route.status = 'in-progress';
    } else {
      route.status = 'pending';
    }
  }
  
  return updatedRoutes;
}

// Déterminer le chemin attendu pour un fichier Remix
function getExpectedRemixPath(newPath: string): string {
  // Nettoyer le chemin
  let path = newPath.replace(/^\//, ''); // Enlever le / initial
  
  // Gérer les cas spéciaux
  if (path === '') {
    return 'index';
  }
  
  // Formater pour Remix : /users/profile devient users.profile ou users/profile/index
  // Nous utilisons la convention des dossiers ici
  return path;
}

// Déterminer le chemin attendu pour un contrôleur NestJS
function getExpectedNestjsPath(newPath: string): string {
  // Nettoyer le chemin
  let path = newPath.replace(/^\//, ''); // Enlever le / initial
  
  // Extraire la ressource principale
  const segments = path.split('/');
  const resource = segments[0];
  
  return resource;
}

// Générer la carte de redirection
function generateRedirectionMap(routes: Route[]): Record<string, string> {
  const redirectionMap: Record<string, string> = {};
  
  for (const route of routes) {
    if (route.originalPath !== route.newPath) {
      redirectionMap[route.originalPath] = route.newPath;
    }
  }
  
  return redirectionMap;
}

// Mettre à jour l'audit index
function updateAuditIndex(routes: Route[]): AuditIndex {
  const routesByStatus: Record<string, number> = {
    'pending': 0,
    'in-progress': 0,
    'completed': 0,
    'verified': 0
  };
  
  const routesByType: Record<string, number> = {
    'page': 0,
    'api': 0,
    'redirect': 0,
    'rewrite': 0,
    'static': 0
  };
  
  for (const route of routes) {
    routesByStatus[route.status] = (routesByStatus[route.status] || 0) + 1;
    routesByType[route.type] = (routesByType[route.type] || 0) + 1;
  }
  
  return {
    lastUpdated: new Date().toISOString(),
    totalRoutes: routes.length,
    migratedRoutes: routesByStatus.completed + routesByStatus.verified,
    pendingRoutes: routesByStatus.pending + routesByStatus.['in-progress'],
    routesByStatus,
    routesByType
  };
}

// Suggérer les prochaines étapes
function suggestNextSteps(auditIndex: AuditIndex) {
  console.log('\n📋 Résumé de la synchronisation:');
  console.log(`- Total des routes: ${auditIndex.totalRoutes}`);
  console.log(`- Routes migrées: ${auditIndex.migratedRoutes} (${Math.round(auditIndex.migratedRoutes / auditIndex.totalRoutes * 100)}%)`);
  console.log(`- Routes en attente: ${auditIndex.pendingRoutes}`);
  
  console.log('\n🚀 Prochaines étapes recommandées:');
  if (auditIndex.pendingRoutes > 0) {
    console.log('1. Exécuter seo-extractor.ts pour extraire les métadonnées SEO des routes non migrées');
    console.log('2. Générer les composants Remix et contrôleurs NestJS pour les routes en attente');
    console.log('3. Mettre à jour le middleware NestJS avec les nouvelles redirections');
  } else {
    console.log('1. Vérifier les routes migrées avec test-redirections.sh');
    console.log('2. Mettre à jour les métadonnées SEO des routes migrées');
    console.log('3. Désactiver l'ancien système PHP');
  }
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('❌ Erreur lors de la synchronisation des routes:', err);
  process.exit(1);
});