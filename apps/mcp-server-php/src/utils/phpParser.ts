import Engine from 'php-parser';
import { createLogger } from './logger';

const logger = createLogger('php-parser');

interface PhpParserOptions {
  extractComments?: boolean;
  includeLocations?: boolean;
  captureVariables?: boolean;
}

export interface ParsedPhpFile {
  ast: any;
  classes: PhpClassInfo[];
  functions: PhpFunctionInfo[];
  globals: PhpGlobalInfo[];
  dependencies: string[];
  complexity: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
  };
  linesOfCode: number;
  commentLines: number;
  codeToCommentRatio: number;
  fileSize: number;
  issues: PhpIssue[];
}

export interface PhpClassInfo {
  name: string;
  namespace?: string;
  type: 'class' | 'interface' | 'trait';
  extends?: string;
  implements?: string[];
  methods: PhpMethodInfo[];
  properties: PhpPropertyInfo[];
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
  isFinal: boolean;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  docComment?: string;
}

export interface PhpMethodInfo {
  name: string;
  parameters: PhpParameterInfo[];
  returnType?: string;
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
  isFinal: boolean;
  complexity: number;
  linesOfCode: number;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  docComment?: string;
}

export interface PhpPropertyInfo {
  name: string;
  type?: string;
  defaultValue?: any;
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  docComment?: string;
}

export interface PhpParameterInfo {
  name: string;
  type?: string;
  defaultValue?: any;
  isOptional: boolean;
  isVariadic: boolean;
  isReference: boolean;
}

export interface PhpFunctionInfo {
  name: string;
  namespace?: string;
  parameters: PhpParameterInfo[];
  returnType?: string;
  complexity: number;
  linesOfCode: number;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  docComment?: string;
}

export interface PhpGlobalInfo {
  name: string;
  type: 'constant' | 'variable';
  value?: any;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface PhpIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    start: { line: number; column: number };
    end?: { line: number; column: number };
  };
  code?: string;
}

/**
 * Parse le contenu d'un fichier PHP et extrait les informations structurelles
 */
export function parsePhpCode(
  code: string,
  filePath: string,
  options: PhpParserOptions = {}
): ParsedPhpFile {
  try {
    // Initialisation du parser PHP
    const parser = new Engine({
      parser: {
        extractDoc: options.extractComments ?? true,
        locations: options.includeLocations ?? true,
      },
      ast: {
        withPositions: true,
      },
    });

    // Parsing du code PHP
    const ast = parser.parseCode(code, filePath);
    
    // Extraction des données structurelles
    const result: ParsedPhpFile = {
      ast,
      classes: extractClasses(ast),
      functions: extractFunctions(ast),
      globals: extractGlobals(ast),
      dependencies: extractDependencies(ast),
      complexity: calculateComplexity(ast, code),
      linesOfCode: calculateLinesOfCode(code),
      commentLines: countCommentLines(code),
      codeToCommentRatio: 0,
      fileSize: code.length,
      issues: detectIssues(ast, code),
    };

    // Calcul du ratio code/commentaires
    result.codeToCommentRatio = 
      result.commentLines > 0 
        ? (result.linesOfCode - result.commentLines) / result.commentLines 
        : result.linesOfCode;

    return result;
  } catch (error) {
    logger.error(`Erreur lors du parsing du fichier PHP ${filePath}:`, error);
    throw new Error(`Erreur de parsing: ${(error as Error).message}`);
  }
}

/**
 * Extrait les définitions de classes à partir de l'AST
 */
function extractClasses(ast: any): PhpClassInfo[] {
  const classes: PhpClassInfo[] = [];
  // Implémentation d'extraction des classes depuis l'AST
  // ...

  // Version simplifiée pour l'exemple
  try {
    const traverseNode = (node: any, namespace?: string) => {
      if (!node) return;

      // Chercher le namespace
      if (node.kind === 'namespace') {
        const ns = getNamespaceString(node);
        if (node.children) {
          node.children.forEach((child: any) => traverseNode(child, ns));
        }
      }

      // Détecter les classes, interfaces et traits
      if (['class', 'interface', 'trait'].includes(node.kind)) {
        const classInfo: PhpClassInfo = {
          name: node.name || 'AnonymousClass',
          namespace,
          type: node.kind as any,
          methods: [],
          properties: [],
          visibility: 'public',
          isStatic: false,
          isAbstract: !!node.isAbstract,
          isFinal: !!node.isFinal,
        };

        if (node.extends) {
          classInfo.extends = getExtendsName(node.extends);
        }

        if (node.implements && node.implements.length) {
          classInfo.implements = node.implements.map((impl: any) => getImplementsName(impl));
        }

        if (node.body && Array.isArray(node.body)) {
          node.body.forEach((member: any) => {
            if (member.kind === 'method') {
              classInfo.methods.push(extractMethod(member));
            } else if (member.kind === 'property') {
              classInfo.properties.push(extractProperty(member));
            }
          });
        }

        classes.push(classInfo);
      }

      // Parcourir les enfants du nœud
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverseNode(child, namespace));
      }
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach((child: any) => traverseNode(child, namespace));
      }
    };

    // Commencer la traversée de l'AST
    traverseNode(ast);
  } catch (error) {
    logger.error(`Erreur lors de l'extraction des classes:`, error);
  }

  return classes;
}

/**
 * Extrait les définitions de fonctions à partir de l'AST
 */
function extractFunctions(ast: any): PhpFunctionInfo[] {
  const functions: PhpFunctionInfo[] = [];
  // Implémentation d'extraction des fonctions
  // Version simplifiée pour l'exemple
  
  return functions;
}

/**
 * Extrait les variables et constantes globales
 */
function extractGlobals(ast: any): PhpGlobalInfo[] {
  const globals: PhpGlobalInfo[] = [];
  // Implémentation d'extraction des globales
  // Version simplifiée pour l'exemple
  
  return globals;
}

/**
 * Extrait les dépendances (use, require, include, etc.)
 */
function extractDependencies(ast: any): string[] {
  const dependencies: string[] = [];
  // Implémentation d'extraction des dépendances
  // Version simplifiée pour l'exemple
  
  return dependencies;
}

/**
 * Calcule la complexité du code
 */
function calculateComplexity(ast: any, code: string) {
  // Implémentation du calcul de complexité cyclomatique et maintainability index
  // Version simplifiée pour l'exemple
  
  return {
    cyclomaticComplexity: 1,
    maintainabilityIndex: 100
  };
}

/**
 * Calcule le nombre de lignes de code
 */
function calculateLinesOfCode(code: string): number {
  return code.split('\n').length;
}

/**
 * Compte le nombre de lignes de commentaires
 */
function countCommentLines(code: string): number {
  const lines = code.split('\n');
  let commentCount = 0;
  let inMultilineComment = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Commentaires multi-lignes
    if (inMultilineComment) {
      commentCount++;
      if (trimmedLine.includes('*/')) {
        inMultilineComment = false;
      }
      continue;
    }

    // Début de commentaire multi-lignes
    if (trimmedLine.includes('/*')) {
      commentCount++;
      if (!trimmedLine.includes('*/')) {
        inMultilineComment = true;
      }
      continue;
    }

    // Commentaires simple ligne
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
      commentCount++;
    }
  }

  return commentCount;
}

/**
 * Détecte les problèmes potentiels dans le code
 */
function detectIssues(ast: any, code: string): PhpIssue[] {
  const issues: PhpIssue[] = [];
  
  // Détecter les problèmes de sécurité
  detectSecurityIssues(ast, code, issues);
  
  // Détecter les problèmes de qualité de code
  detectQualityIssues(ast, code, issues);
  
  // Détecter les problèmes spécifiques au projet
  detectProjectSpecificIssues(ast, code, issues);
  
  // Détecter les problèmes de performance
  detectPerformanceIssues(ast, code, issues);
  
  return issues;
}

/**
 * Détecte les problèmes de sécurité dans le code PHP
 */
function detectSecurityIssues(ast: any, code: string, issues: PhpIssue[]): void {
  const lines = code.split('\n');
  
  // Recherche de fonctions dangereuses
  const dangerousFunctions = [
    'eval', 'system', 'exec', 'passthru', 'shell_exec', 'popen', 'proc_open',
    'unserialize', 'assert', 'create_function', 'include_once', 'require_once'
  ];
  
  // Regex pour les fonctions dangereuses
  const dangerousFuncRegex = new RegExp(`\\b(${dangerousFunctions.join('|')})\\s*\\(`, 'g');
  
  // Vérifier chaque ligne de code
  lines.forEach((line, index) => {
    let match;
    while ((match = dangerousFuncRegex.exec(line)) !== null) {
      issues.push({
        type: 'warning',
        message: `Utilisation de la fonction potentiellement dangereuse ${match[1]}()`,
        location: {
          start: { line: index + 1, column: match.index }
        },
        code: 'security-risky-function'
      });
    }
    
    // Détection d'injections SQL potentielles
    if (line.includes('query(') || line.includes('mysql_query(')) {
      if (line.includes('$_GET') || line.includes('$_POST') || line.includes('$_REQUEST')) {
        issues.push({
          type: 'error',
          message: 'Possible injection SQL détectée: données non filtrées utilisées dans une requête',
          location: {
            start: { line: index + 1, column: 0 }
          },
          code: 'security-sql-injection'
        });
      }
    }
    
    // Détection de XSS potentiels
    if (line.includes('echo') || line.includes('print')) {
      if (line.includes('$_GET') || line.includes('$_POST') || line.includes('$_REQUEST')) {
        if (!line.includes('htmlspecialchars') && !line.includes('htmlentities')) {
          issues.push({
            type: 'warning',
            message: 'Possible XSS détecté: donnée utilisateur affichée sans échappement',
            location: {
              start: { line: index + 1, column: 0 }
            },
            code: 'security-xss'
          });
        }
      }
    }
  });
  
  // Analyse récursive de l'AST pour détecter les problèmes de sécurité
  const traverseForSecurity = (node: any) => {
    if (!node) return;
    
    // Vérifier l'utilisation de variables superglobales sans validation
    if (node.kind === 'variable' && node.name) {
      const name = typeof node.name === 'string' ? node.name : '';
      if (['$_GET', '$_POST', '$_REQUEST', '$_COOKIE', '$_FILES'].includes(name)) {
        if (node.loc) {
          issues.push({
            type: 'info',
            message: `Utilisation de la variable superglobale ${name} - vérifiez que les données sont validées`,
            location: {
              start: { line: node.loc.start.line, column: node.loc.start.column }
            },
            code: 'security-superglobal-usage'
          });
        }
      }
    }
    
    // Vérifier les conditions de traversée
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverseForSecurity(child));
    }
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach((child: any) => traverseForSecurity(child));
    }
    if (node.alternate) {
      traverseForSecurity(node.alternate);
    }
    if (node.test) {
      traverseForSecurity(node.test);
    }
    if (node.expr) {
      traverseForSecurity(node.expr);
    }
  };
  
  traverseForSecurity(ast);
}

/**
 * Détecte les problèmes de qualité de code dans le fichier PHP
 */
function detectQualityIssues(ast: any, code: string, issues: PhpIssue[]): void {
  const lines = code.split('\n');
  
  // Vérifier la longueur des lignes
  const maxLineLength = 120;
  lines.forEach((line, index) => {
    if (line.length > maxLineLength) {
      issues.push({
        type: 'info',
        message: `Ligne trop longue (${line.length} caractères, max recommandé: ${maxLineLength})`,
        location: {
          start: { line: index + 1, column: 0 }
        },
        code: 'quality-line-length'
      });
    }
  });
  
  // Vérifier la présence de commentaires TODO/FIXME
  const todoRegex = /\/\/\s*(TODO|FIXME):|\/\*\s*(TODO|FIXME):|#\s*(TODO|FIXME):/i;
  lines.forEach((line, index) => {
    const match = line.match(todoRegex);
    if (match) {
      issues.push({
        type: 'info',
        message: `Commentaire ${match[1] || match[2] || match[3]} trouvé, à résoudre avant la mise en production`,
        location: {
          start: { line: index + 1, column: match.index || 0 }
        },
        code: 'quality-todo-comment'
      });
    }
  });
  
  // Analyse récursive de l'AST pour détecter les problèmes de qualité
  const traverseForQuality = (node: any) => {
    if (!node) return;
    
    // Détecter les fonctions/méthodes trop longues
    if ((node.kind === 'function' || node.kind === 'method') && node.loc) {
      const functionLines = node.loc.end.line - node.loc.start.line;
      if (functionLines > 50) {
        issues.push({
          type: 'warning',
          message: `Fonction/méthode ${node.name || 'anonyme'} trop longue (${functionLines} lignes)`,
          location: {
            start: { line: node.loc.start.line, column: node.loc.start.column }
          },
          code: 'quality-function-length'
        });
      }
    }
    
    // Détecter les noms de variables trop courts
    if (node.kind === 'variable' && typeof node.name === 'string' && node.name.length <= 2) {
      // Ignorer les variables de boucle standard
      if (!['$i', '$j', '$k', '$id'].includes(node.name) && node.loc) {
        issues.push({
          type: 'info',
          message: `Nom de variable trop court: ${node.name}`,
          location: {
            start: { line: node.loc.start.line, column: node.loc.start.column }
          },
          code: 'quality-variable-name'
        });
      }
    }
    
    // Vérifier les conditions de traversée
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverseForQuality(child));
    }
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach((child: any) => traverseForQuality(child));
    }
    if (node.alternate) {
      traverseForQuality(node.alternate);
    }
    if (node.test) {
      traverseForQuality(node.test);
    }
    if (node.expr) {
      traverseForQuality(node.expr);
    }
  };
  
  traverseForQuality(ast);
}

/**
 * Détecte les problèmes spécifiques au projet
 */
function detectProjectSpecificIssues(ast: any, code: string, issues: PhpIssue[]): void {
  const lines = code.split('\n');
  
  // Règles spécifiques au projet MCP
  const projectForbiddenFunctions = [
    'mysql_connect', // Utiliser mysqli ou PDO à la place
    'ereg', 'eregi', // Utiliser preg_match à la place
    'split', // Utiliser explode ou preg_split à la place
    'mcrypt' // Utiliser openssl à la place
  ];
  
  // Vérifier chaque ligne pour détecter les fonctions interdites dans le projet
  lines.forEach((line, index) => {
    projectForbiddenFunctions.forEach(func => {
      const funcRegex = new RegExp(`\\b${func}\\s*\\(`, 'g');
      let match;
      while ((match = funcRegex.exec(line)) !== null) {
        issues.push({
          type: 'error',
          message: `Fonction ${func}() interdite dans ce projet - utilisez les alternatives recommandées`,
          location: {
            start: { line: index + 1, column: match.index }
          },
          code: 'project-forbidden-function'
        });
      }
    });
  });
  
  // Vérifier l'utilisation des namespaces selon les conventions du projet
  if (!code.includes('namespace App\\') && !code.includes('namespace MCP\\')) {
    issues.push({
      type: 'warning',
      message: 'Namespace non conforme aux standards du projet (devrait commencer par App\\ ou MCP\\)',
      location: {
        start: { line: 1, column: 0 }
      },
      code: 'project-namespace-standard'
    });
  }
  
  // Vérifier si les fichiers de modèles suivent le pattern MCP
  if (code.includes('class') && code.includes('extends')) {
    const modelPatterns = [
      { pattern: /class\s+\w+\s+extends\s+\w+Model/g, expected: true, message: 'Les modèles doivent étendre BaseModel ou AbstractModel' },
      { pattern: /class\s+(\w+Controller)\s+/g, expected: code.includes('extends BaseController'), message: 'Les contrôleurs doivent étendre BaseController' },
      { pattern: /class\s+(\w+Service)\s+/g, expected: code.includes('implements ServiceInterface'), message: 'Les services doivent implémenter ServiceInterface' }
    ];
    
    modelPatterns.forEach(({ pattern, expected, message }) => {
      const match = code.match(pattern);
      if (match && !expected) {
        issues.push({
          type: 'warning',
          message,
          location: {
            start: { line: 1, column: 0 }
          },
          code: 'project-class-pattern'
        });
      }
    });
  }
  
  // Détecter l'absence de docblocks sur les classes et méthodes
  const traverseForDocs = (node: any) => {
    if (!node) return;
    
    if ((node.kind === 'class' || node.kind === 'interface' || node.kind === 'trait') && !node.docComment) {
      if (node.loc) {
        issues.push({
          type: 'info',
          message: `La ${node.kind} ${node.name || 'anonyme'} devrait avoir un DocBlock selon les standards du projet`,
          location: {
            start: { line: node.loc.start.line, column: node.loc.start.column }
          },
          code: 'project-missing-docblock'
        });
      }
    }
    
    if ((node.kind === 'method' || node.kind === 'function') && !node.docComment) {
      if (node.loc && node.name !== '__construct') { // Ignorer les constructeurs
        issues.push({
          type: 'info',
          message: `La ${node.kind === 'method' ? 'méthode' : 'fonction'} ${node.name || 'anonyme'} devrait avoir un DocBlock selon les standards du projet`,
          location: {
            start: { line: node.loc.start.line, column: node.loc.start.column }
          },
          code: 'project-missing-docblock'
        });
      }
    }
    
    // Vérifier les conditions de traversée
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverseForDocs(child));
    }
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach((child: any) => traverseForDocs(child));
    }
  };
  
  traverseForDocs(ast);
}

/**
 * Détecte les problèmes de performance dans le code PHP
 */
function detectPerformanceIssues(ast: any, code: string, issues: PhpIssue[]): void {
  const lines = code.split('\n');
  
  // Détecter les requêtes SQL dans les boucles
  let inLoop = false;
  let loopStartLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'une boucle
    if (line.match(/\b(for|foreach|while|do)\b/)) {
      inLoop = true;
      loopStartLine = i + 1;
    }
    
    // Détecter la fin d'une boucle
    if (inLoop && line.match(/^\s*}/) && !line.match(/^\s*}\s*else/)) {
      inLoop = false;
    }
    
    // Vérifier les requêtes SQL dans les boucles
    if (inLoop && (line.includes('query(') || line.includes('->execute(') || line.includes('->prepare('))) {
      issues.push({
        type: 'warning',
        message: 'Requête SQL potentielle à l\'intérieur d\'une boucle - risque de performance',
        location: {
          start: { line: i + 1, column: 0 }
        },
        code: 'performance-query-in-loop'
      });
    }
  }
  
  // Détecter les requêtes N+1 potentielles
  const findNPlusOnePattern = (node: any) => {
    if (!node) return;
    
    // Chercher les boucles qui contiennent des requêtes à l'intérieur du corps
    if ((node.kind === 'for' || node.kind === 'foreach' || node.kind === 'while' || node.kind === 'do') && node.body) {
      const findQueries = (bodyNode: any): boolean => {
        if (!bodyNode) return false;
        
        // Détecter les appels de fonction qui pourraient être des requêtes
        if (bodyNode.kind === 'call' && bodyNode.what) {
          const isFunctionCall = bodyNode.what.kind === 'identifier';
          const isMethodCall = bodyNode.what.kind === 'propertylookup';
          
          if (isFunctionCall && ['query', 'execute', 'fetch', 'findBy'].some(f => bodyNode.what.name === f)) {
            return true;
          }
          
          if (isMethodCall && bodyNode.what.offset && 
              ['query', 'execute', 'fetch', 'findBy'].some(f => bodyNode.what.offset.name === f)) {
            return true;
          }
        }
        
        // Rechercher récursivement dans les nœuds enfants
        if (bodyNode.children && Array.isArray(bodyNode.children)) {
          return bodyNode.children.some((child: any) => findQueries(child));
        }
        if (bodyNode.body && Array.isArray(bodyNode.body)) {
          return bodyNode.body.some((child: any) => findQueries(child));
        }
        if (bodyNode.alternate) {
          return findQueries(bodyNode.alternate);
        }
        if (bodyNode.test) {
          return findQueries(bodyNode.test);
        }
        if (bodyNode.expr) {
          return findQueries(bodyNode.expr);
        }
        
        return false;
      };
      
      if (node.body.children && Array.isArray(node.body.children)) {
        if (node.body.children.some((child: any) => findQueries(child))) {
          if (node.loc) {
            issues.push({
              type: 'warning',
              message: 'Problème potentiel N+1: requêtes de base de données à l\'intérieur d\'une boucle. Utilisez des JOINs ou préchargez les données.',
              location: {
                start: { line: node.loc.start.line, column: node.loc.start.column }
              },
              code: 'performance-n-plus-1'
            });
          }
        }
      }
    }
    
    // Parcourir récursivement les nœuds enfants
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => findNPlusOnePattern(child));
    }
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach((child: any) => findNPlusOnePattern(child));
    }
    if (node.alternate) {
      findNPlusOnePattern(node.alternate);
    }
    if (node.test) {
      findNPlusOnePattern(node.test);
    }
    if (node.expr) {
      findNPlusOnePattern(node.expr);
    }
  };
  
  findNPlusOnePattern(ast);
}

/**
 * Méthodes utilitaires
 */
function getNamespaceString(node: any): string {
  try {
    if (node.name && node.name.name) {
      return node.name.name;
    }
    if (node.name) {
      return node.name;
    }
  } catch (e) {}
  return '';
}

function getExtendsName(node: any): string {
  try {
    if (node.name) {
      return node.name;
    }
  } catch (e) {}
  return '';
}

function getImplementsName(node: any): string {
  try {
    if (node.name) {
      return node.name;
    }
  } catch (e) {}
  return '';
}

function extractMethod(node: any): PhpMethodInfo {
  const method: PhpMethodInfo = {
    name: node.name || 'anonymousMethod',
    parameters: extractParameters(node.arguments || []),
    visibility: getVisibility(node),
    isStatic: !!node.isStatic,
    isAbstract: !!node.isAbstract,
    isFinal: !!node.isFinal,
    complexity: 1, // Simplifié
    linesOfCode: 0, // Calculé plus tard
    docComment: node.docComment || undefined,
  };

  if (node.type) {
    method.returnType = getTypeName(node.type);
  }

  if (node.location) {
    method.location = {
      start: { line: node.location.start.line, column: node.location.start.column },
      end: { line: node.location.end.line, column: node.location.end.column }
    };
    
    if (method.location.start && method.location.end) {
      method.linesOfCode = method.location.end.line - method.location.start.line + 1;
    }
  }

  return method;
}

function extractProperty(node: any): PhpPropertyInfo {
  const property: PhpPropertyInfo = {
    name: getPropertyName(node),
    visibility: getVisibility(node),
    isStatic: !!node.isStatic,
    docComment: node.docComment || undefined,
  };

  if (node.value) {
    property.defaultValue = getValueAsString(node.value);
  }

  if (node.type) {
    property.type = getTypeName(node.type);
  }

  if (node.location) {
    property.location = {
      start: { line: node.location.start.line, column: node.location.start.column },
      end: { line: node.location.end.line, column: node.location.end.column }
    };
  }

  return property;
}

function extractParameters(args: any[]): PhpParameterInfo[] {
  return args.map(arg => ({
    name: arg.name || '',
    type: arg.type ? getTypeName(arg.type) : undefined,
    defaultValue: arg.value ? getValueAsString(arg.value) : undefined,
    isOptional: !!arg.value,
    isVariadic: !!arg.variadic,
    isReference: !!arg.byref
  }));
}

function getVisibility(node: any): 'public' | 'protected' | 'private' {
  if (node.visibility === 1) return 'public';
  if (node.visibility === 2) return 'protected';
  if (node.visibility === 4) return 'private';
  return 'public';
}

function getPropertyName(node: any): string {
  try {
    if (node.name) {
      return node.name;
    }
  } catch (e) {}
  return 'unknownProperty';
}

function getTypeName(typeNode: any): string {
  try {
    if (typeof typeNode === 'string') {
      return typeNode;
    }
    if (typeNode.name) {
      return typeNode.name;
    }
  } catch (e) {}
  return 'mixed';
}

function getValueAsString(valueNode: any): string {
  try {
    if (valueNode.kind === 'string') {
      return valueNode.value;
    }
    if (valueNode.kind === 'number') {
      return valueNode.value.toString();
    }
    if (valueNode.kind === 'boolean') {
      return valueNode.value ? 'true' : 'false';
    }
    if (valueNode.kind === 'array') {
      return 'array';
    }
    if (valueNode.raw) {
      return valueNode.raw;
    }
  } catch (e) {}
  return '';
}