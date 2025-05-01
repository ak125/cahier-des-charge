/**
 * PHP Discovery Engine
 *
 * Moteur d'analyse des fichiers PHP pour le SelectorAgent.ts
 * Fournit des fonctions d'analyse détaillées et de scoring
 */

// Interface pour les résultats d'analyse de fichier
export interface FileAnalysisResult {
  role: string;
  dependencies: string[];
  sqlTables: string[];
  couplingScore: number;
  businessImpact: number;
  complexityScore: number;
  seoImpact: number;
}

/**
 * Analyse un fichier PHP et retourne des métriques détaillées
 */
export function analyzePhpFile(content: string, filePath: string): FileAnalysisResult {
  // Analyser le contenu du fichier
  const role = determineFileRole(content, filePath);
  const dependencies = extractDependencies(content, filePath);
  const sqlTables = extractSqlTables(content);
  const couplingScore = calculateCouplingScore(content, dependencies);
  const businessImpact = estimateBusinessImpact(content, sqlTables, role);
  const complexityScore = calculateComplexityScore(content);
  const seoImpact = estimateSeoImpact(content);

  return {
    role,
    dependencies,
    sqlTables,
    couplingScore,
    businessImpact,
    complexityScore,
    seoImpact,
  };
}

/**
 * Détermine le rôle du fichier PHP
 */
function determineFileRole(content: string, filePath: string): string {
  // Détection basée sur le nom du fichier
  const fileName = filePath.split('/').pop() || '';

  if (fileName.includes('controller') || fileName.includes('Controller')) {
    return 'controller';
  }

  if (fileName.includes('model') || fileName.includes('Model')) {
    return 'model';
  }

  if (fileName.includes('view') || fileName.includes('View') || fileName.endsWith('.phtml')) {
    return 'view';
  }

  if (fileName.includes('service') || fileName.includes('Service')) {
    return 'service';
  }

  if (fileName.includes('helper') || fileName.includes('Helper')) {
    return 'helper';
  }

  if (fileName.includes('config') || fileName.includes('Config')) {
    return 'config';
  }

  // Détection basée sur le contenu
  if (
    content.includes('extends Controller') ||
    (content.includes('class') && content.includes('Controller'))
  ) {
    return 'controller';
  }

  if (
    content.includes('extends Model') ||
    (content.includes('class') && content.includes('Model'))
  ) {
    return 'model';
  }

  if (content.match(/<html|<body|<div/)) {
    return 'view';
  }

  // Détection par heuristique
  if (
    content.includes('function') &&
    content.includes('SELECT') &&
    content.includes('FROM') &&
    content.includes('WHERE')
  ) {
    return 'data_access';
  }

  if (
    content.includes('function') &&
    content.includes('return') &&
    !content.includes('echo') &&
    !content.includes('print')
  ) {
    return 'service';
  }

  if (
    content.includes('echo') ||
    content.includes('print') ||
    content.includes('include') ||
    content.includes('require')
  ) {
    return 'view';
  }

  return 'unknown';
}

/**
 * Extrait les dépendances (import/include/require)
 */
function extractDependencies(content: string, filePath: string): string[] {
  const dependencies: string[] = [];
  const baseDir = filePath.split('/').slice(0, -1).join('/');

  // Détecter les includes et requires
  const includeRegex =
    /(?:include|require|include_once|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  // Utiliser une structure plus claire au lieu d'assigner dans l'expression
  while (true) {
    match = includeRegex.exec(content);
    if (match === null) break;

    let depPath = match[1];

    // Normaliser les chemins relatifs
    if (depPath.startsWith('./') || depPath.startsWith('../')) {
      depPath = resolvePath(baseDir, depPath);
    } else if (!depPath.startsWith('/')) {
      depPath = `${baseDir}/${depPath}`;
    }

    // Normaliser les extensions
    if (!depPath.endsWith('.php')) {
      depPath += '.php';
    }

    dependencies.push(depPath);
  }

  // Détecter les class_exists, new Class(), static::method() etc.
  const classRegex = /(?:new\s+|\:\:\s*)(\w+)\s*\(/g;

  // Utiliser une structure plus claire au lieu d'assigner dans l'expression
  while (true) {
    match = classRegex.exec(content);
    if (match === null) break;

    // Noter la dépendance de classe (sans chemin de fichier)
    // Dans une implémentation réelle, on résoudrait le mapping classe → fichier
  }

  return [...new Set(dependencies)]; // Éliminer les doublons
}

/**
 * Résout un chemin relatif
 */
function resolvePath(baseDir: string, relativePath: string): string {
  const parts = baseDir.split('/');
  let processedPath = relativePath;

  if (processedPath.startsWith('./')) {
    processedPath = processedPath.substring(2);
  } else if (processedPath.startsWith('../')) {
    while (processedPath.startsWith('../')) {
      processedPath = processedPath.substring(3);
      parts.pop();
    }
  }

  return [...parts, processedPath].join('/');
}

/**
 * Extrait les tables SQL mentionnées dans le fichier
 */
function extractSqlTables(content: string): string[] {
  const tables: string[] = [];

  // Détecter les requêtes SQL
  const fromRegex = /FROM\s+`?(\w+)`?/gi;
  let match;

  // Utiliser une structure plus claire au lieu d'assigner dans l'expression
  while (true) {
    match = fromRegex.exec(content);
    if (match === null) break;
    tables.push(match[1].toUpperCase());
  }

  // Détecter les jointures
  const joinRegex = /JOIN\s+`?(\w+)`?/gi;
  while (true) {
    match = joinRegex.exec(content);
    if (match === null) break;
    tables.push(match[1].toUpperCase());
  }

  // Détecter les inserts
  const insertRegex = /INSERT\s+INTO\s+`?(\w+)`?/gi;
  while (true) {
    match = insertRegex.exec(content);
    if (match === null) break;
    tables.push(match[1].toUpperCase());
  }

  // Détecter les updates
  const updateRegex = /UPDATE\s+`?(\w+)`?/gi;
  while (true) {
    match = updateRegex.exec(content);
    if (match === null) break;
    tables.push(match[1].toUpperCase());
  }

  // Détecter les deletes
  const deleteRegex = /DELETE\s+FROM\s+`?(\w+)`?/gi;
  while (true) {
    match = deleteRegex.exec(content);
    if (match === null) break;
    tables.push(match[1].toUpperCase());
  }

  return [...new Set(tables)]; // Éliminer les doublons
}

/**
 * Calcule le score de couplage
 */
function calculateCouplingScore(content: string, dependencies: string[]): number {
  // Base sur le nombre de dépendances
  let score = Math.min(dependencies.length / 10, 1);

  // Ajuster en fonction du nombre de variables globales utilisées
  const globalMatches = content.match(/\$_(?:GET|POST|SESSION|COOKIE|REQUEST|SERVER|ENV)/g) || [];
  score += globalMatches.length * 0.05;

  // Ajuster en fonction des appels de fonctions externes (approximation)
  const functionCallMatches = content.match(/\w+\s*\(/g) || [];
  score += functionCallMatches.length * 0.01;

  return Math.min(score, 1); // Plafonner à 1
}

/**
 * Estime l'impact métier du fichier
 */
function estimateBusinessImpact(content: string, sqlTables: string[], role: string): number {
  let score = 0;

  // Les tables critiques indiquent souvent un impact métier élevé
  const criticalTables = [
    'USER',
    'USERS',
    'UTILISATEUR',
    'UTILISATEURS',
    'PRODUCT',
    'PRODUCTS',
    'PRODUIT',
    'PRODUITS',
    'ORDER',
    'ORDERS',
    'COMMANDE',
    'COMMANDES',
    'CART',
    'PANIER',
    'CUSTOMER',
    'CLIENT',
  ];

  const criticalTablesFound = sqlTables.filter((table) => criticalTables.includes(table)).length;

  score += criticalTablesFound * 0.2;

  // Les contrôleurs et vues ont souvent un impact métier plus élevé
  if (role === 'controller' || role === 'view') {
    score += 0.3;
  }

  // Détection de mots-clés métier critiques
  const businessKeywords = [
    'payment',
    'paiement',
    'checkout',
    'cart',
    'panier',
    'order',
    'commande',
    'client',
    'compte',
    'account',
    'password',
    'mot de passe',
    'login',
    'connexion',
  ];

  const lowerContent = content.toLowerCase();
  const keywordsFound = businessKeywords.filter((keyword) => lowerContent.includes(keyword)).length;

  score += keywordsFound * 0.1;

  return Math.min(score, 1); // Plafonner à 1
}

/**
 * Calcule un score de complexité pour le fichier
 */
function calculateComplexityScore(content: string): number {
  // Approximation de la complexité cyclomatique
  // Dans une implémentation réelle, utiliser une analyse AST plus robuste
  let score = 0;

  // Compter les structures de contrôle
  const ifMatches = content.match(/\bif\s*\(/g) || [];
  const elseMatches = content.match(/\belse\b/g) || [];
  const forMatches = content.match(/\bfor\s*\(/g) || [];
  const foreachMatches = content.match(/\bforeach\s*\(/g) || [];
  const whileMatches = content.match(/\bwhile\s*\(/g) || [];
  const switchMatches = content.match(/\bswitch\s*\(/g) || [];
  const caseMatches = content.match(/\bcase\s+/g) || [];
  const ternaryMatches = content.match(/\?\s*.*\s*\:/g) || [];

  const totalBranches =
    ifMatches.length +
    elseMatches.length +
    forMatches.length +
    foreachMatches.length +
    whileMatches.length +
    switchMatches.length +
    caseMatches.length +
    ternaryMatches.length;

  // Score basé sur le nombre de branches
  score += Math.min(totalBranches / 50, 0.5);

  // Compter les fonctions
  const functionMatches = content.match(/function\s+\w+\s*\(/g) || [];
  score += Math.min(functionMatches.length / 20, 0.3);

  // Taille du fichier
  score += Math.min(content.length / 50000, 0.2);

  return Math.min(score, 1); // Plafonner à 1
}

/**
 * Estime l'impact SEO du fichier
 */
function estimateSeoImpact(content: string): number {
  let score = 0;

  // Vérifier la présence de balises meta
  if (content.includes('<meta name="description"') || content.includes('<meta name="keywords"')) {
    score += 0.3;
  }

  // Vérifier la présence de balises title
  if (content.includes('<title>')) {
    score += 0.2;
  }

  // Vérifier la présence de balises heading (h1, h2, etc.)
  if (content.match(/<h[1-6][^>]*>/)) {
    score += 0.2;
  }

  // Vérifier la présence de manipulations d'URL / de redirections
  if ((content.includes('301') && content.includes('header(')) || content.includes('Location:')) {
    score += 0.3;
  }

  // Vérifier la présence de canonicals
  if (content.includes('canonical')) {
    score += 0.3;
  }

  // Détection de mots-clés SEO
  const seoKeywords = [
    'seo',
    'sitemap',
    'google',
    'robots',
    'noindex',
    'nofollow',
    'canonical',
    'redirect',
    'meta',
    'description',
    'keywords',
  ];

  const lowerContent = content.toLowerCase();
  const keywordsFound = seoKeywords.filter((keyword) => lowerContent.includes(keyword)).length;

  score += keywordsFound * 0.05;

  return Math.min(score, 1); // Plafonner à 1
}

/**
 * Calcule le score de priorité global
 */
export function calculatePriorityScore(
  analysis: FileAnalysisResult,
  trafficData: any,
  _routeData: any
): number {
  // Poids des différents facteurs
  const weights = {
    complexity: 0.2,
    coupling: 0.1,
    business: 0.3,
    seo: 0.15,
    traffic: 0.25,
  };

  // Scores individuels
  const complexityScore = analysis.complexityScore;
  const couplingScore = analysis.couplingScore;
  const businessScore = analysis.businessImpact;
  const seoScore = analysis.seoImpact;

  // Score de trafic (normalisé)
  const trafficScore = Math.min(
    (trafficData.hits || 0) / 10000 + (trafficData.searchBots || 0) / 100,
    1
  );

  // Calcul du score composite (0-10)
  const priorityScore =
    (complexityScore * weights.complexity +
      couplingScore * weights.coupling +
      businessScore * weights.business +
      seoScore * weights.seo +
      trafficScore * weights.traffic) *
    10;

  return Math.min(Math.max(priorityScore, 0), 10);
}
