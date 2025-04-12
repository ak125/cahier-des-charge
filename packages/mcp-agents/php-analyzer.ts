#!/usr/bin/env node
/**
 * php-analyzer.ts
 * 
 * Agent d'analyse PHP qui examine les fichiers PHP, génère un rapport d'analyse
 * et enregistre les résultats dans Supabase pour le protocole MCP.
 * 
 * Usage: ts-node php-analyzer.ts [options]
 * 
 * Options:
 *   --file=<path>        Chemin vers le fichier PHP à analyser
 *   --dir=<path>         Répertoire contenant les fichiers PHP à analyser
 *   --output=<path>      Répertoire de sortie pour les rapports
 *   --recursive          Analyse récursivement les sous-répertoires
 *   --verbose            Affiche des informations détaillées pendant l'analyse
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import * as glob from 'glob';
import chalk from 'chalk';
import { parse as phpParse } from 'php-parser';
import { supabase, SupabaseHelper, AuditLog, FileMapping } from '../../mcp-core/supabaseClient';

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Analyse les fichiers PHP et enregistre les résultats dans Supabase')
  .option('--file <path>', 'Chemin vers le fichier PHP à analyser')
  .option('--dir <path>', 'Répertoire contenant les fichiers PHP à analyser')
  .option('--output <path>', 'Répertoire de sortie pour les rapports', './reports/php-analysis')
  .option('--recursive', 'Analyse récursivement les sous-répertoires', false)
  .option('--verbose', 'Affiche des informations détaillées pendant l\'analyse', false)
  .parse(process.argv);

const options = program.opts();

// Interfaces pour les résultats d'analyse
interface PHPAnalysisResult {
  filePath: string;
  className?: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  dependencies: string[];
  databaseQueries: DatabaseQueryInfo[];
  complexity: ComplexityMetrics;
  patterns: DetectedPattern[];
  issues: AnalysisIssue[];
  migrationDifficulty: 'easy' | 'medium' | 'hard';
  migrationEstimateHours: number;
  recommendations: string[];
}

interface MethodInfo {
  name: string;
  visibility: 'public' | 'protected' | 'private';
  static: boolean;
  parameters: ParameterInfo[];
  returnType?: string;
  complexity: number;
  loc: number;
  docblockComplete: boolean;
  hasTypeHints: boolean;
}

interface ParameterInfo {
  name: string;
  type?: string;
  defaultValue?: any;
  nullable: boolean;
}

interface PropertyInfo {
  name: string;
  visibility: 'public' | 'protected' | 'private';
  static: boolean;
  type?: string;
  defaultValue?: any;
}

interface DatabaseQueryInfo {
  query: string;
  type: 'select' | 'insert' | 'update' | 'delete' | 'other';
  tables: string[];
  prepared: boolean;
  line: number;
}

interface ComplexityMetrics {
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  halsteadVolume: number;
  locTotal: number;
  locLogic: number;
  locComments: number;
}

interface DetectedPattern {
  name: string;
  confidence: number;
  location: {
    startLine: number;
    endLine: number;
  };
  description: string;
}

interface AnalysisIssue {
  type: 'security' | 'performance' | 'maintainability' | 'bug' | 'style';
  severity: 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  code?: string;
  recommendation?: string;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('🚀 Démarrage de l\'analyse PHP'));

  // Vérifier les paramètres obligatoires
  if (!options.file && !options.dir) {
    console.error(chalk.red('❌ Erreur: Vous devez spécifier un fichier (--file) ou un répertoire (--dir) à analyser'));
    process.exit(1);
  }

  // Vérifier la connexion à Supabase
  try {
    const { data, error } = await supabase.from('audit_logs').select('count').limit(1);
    if (error) {
      console.error(chalk.red(`❌ Erreur de connexion à Supabase: ${error.message}`));
      console.error(chalk.red('Vérifiez vos variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY'));
      process.exit(1);
    }
    console.log(chalk.green('✅ Connexion à Supabase établie avec succès'));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur inattendue lors de la connexion à Supabase: ${error.message}`));
    process.exit(1);
  }

  // Créer le répertoire de sortie s'il n'existe pas
  const outputDir = path.resolve(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Récupérer la liste des fichiers à analyser
  const filesToAnalyze: string[] = [];

  if (options.file) {
    // Analyse d'un seul fichier
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`❌ Erreur: Le fichier ${filePath} n'existe pas`));
      process.exit(1);
    }
    filesToAnalyze.push(filePath);
  } else if (options.dir) {
    // Analyse d'un répertoire
    const dirPath = path.resolve(options.dir);
    if (!fs.existsSync(dirPath)) {
      console.error(chalk.red(`❌ Erreur: Le répertoire ${dirPath} n'existe pas`));
      process.exit(1);
    }

    const pattern = options.recursive ? '**/*.php' : '*.php';
    filesToAnalyze.push(...glob.sync(path.join(dirPath, pattern)));

    console.log(chalk.blue(`📂 ${filesToAnalyze.length} fichiers PHP trouvés dans ${dirPath}`));
  }

  // Analyser chaque fichier
  let successCount = 0;
  let errorCount = 0;

  for (const filePath of filesToAnalyze) {
    try {
      console.log(chalk.blue(`\n📝 Analyse de ${filePath}...`));
      
      // Créer un mapping de fichier avec le statut "analyzing"
      const fileMapping: FileMapping = {
        php_file: filePath,
        status: 'analyzing',
      };
      
      const mappingId = await SupabaseHelper.createFileMapping(fileMapping);
      
      if (!mappingId) {
        console.warn(chalk.yellow(`⚠️ Impossible de créer le mapping pour ${filePath}`));
      } else if (options.verbose) {
        console.log(chalk.gray(`📌 Mapping créé avec l'ID ${mappingId}`));
      }
      
      // Créer un log d'audit avec le statut "running"
      const auditLog: AuditLog = {
        file_name: filePath,
        module: detectModule(filePath),
        agent: 'php-analyzer',
        status: 'running',
        audit_json: {}
      };
      
      const auditId = await SupabaseHelper.createAuditLog(auditLog);
      
      if (!auditId) {
        console.warn(chalk.yellow(`⚠️ Impossible de créer le log d'audit pour ${filePath}`));
      } else if (options.verbose) {
        console.log(chalk.gray(`📝 Log d'audit créé avec l'ID ${auditId}`));
      }
      
      // Effectuer l'analyse
      const result = await analyzePHPFile(filePath);
      successCount++;
      
      // Enregistrer le résultat dans un fichier JSON
      const outputFilePath = path.join(outputDir, path.basename(filePath) + '.analysis.json');
      fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
      console.log(chalk.green(`✅ Analyse enregistrée dans ${outputFilePath}`));
      
      // Mettre à jour le log d'audit avec le statut "done" et les résultats
      if (auditId) {
        await SupabaseHelper.updateAuditLog(auditId, {
          status: 'done',
          audit_json: result
        });
        
        if (options.verbose) {
          console.log(chalk.gray(`📝 Log d'audit mis à jour avec les résultats`));
        }
      }
      
      // Mettre à jour le mapping de fichier avec le statut "analyzed"
      if (mappingId) {
        await SupabaseHelper.updateFileMapping(mappingId, {
          status: 'analyzed',
          migration_data: {
            analyzed_at: new Date().toISOString(),
            complexity: result.complexity,
            migration_difficulty: result.migrationDifficulty,
            migration_estimate_hours: result.migrationEstimateHours,
            issue_count: result.issues.length
          }
        });
        
        if (options.verbose) {
          console.log(chalk.gray(`📌 Mapping mis à jour avec le statut "analyzed"`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'analyse de ${filePath}: ${error.message}`));
      errorCount++;
      
      // Mettre à jour le log d'audit avec le statut "error"
      try {
        const auditLogs = await SupabaseHelper.getAuditLogsForFile(filePath);
        const runningLog = auditLogs.find(log => log.status === 'running');
        
        if (runningLog && runningLog.id) {
          await SupabaseHelper.updateAuditLog(runningLog.id, {
            status: 'error',
            audit_json: {
              error: error.message,
              stack: error.stack
            }
          });
        }
        
        // Mettre à jour le mapping avec le statut "error"
        const mapping = await SupabaseHelper.getFileMappingByPhpFile(filePath);
        
        if (mapping && mapping.id) {
          await SupabaseHelper.updateFileMapping(mapping.id, {
            status: 'error',
            migration_data: {
              error: error.message,
              error_at: new Date().toISOString()
            }
          });
        }
      } catch (updateError) {
        console.error(chalk.red(`❌ Erreur lors de la mise à jour du statut d'erreur: ${updateError.message}`));
      }
    }
  }

  // Afficher un résumé
  console.log(chalk.blue('\n📊 Résumé de l\'analyse:'));
  console.log(chalk.green(`✅ ${successCount} fichier(s) analysé(s) avec succès`));
  if (errorCount > 0) {
    console.log(chalk.red(`❌ ${errorCount} fichier(s) ont rencontré des erreurs`));
  }
}

/**
 * Analyse un fichier PHP
 */
async function analyzePHPFile(filePath: string): Promise<PHPAnalysisResult> {
  // Lecture du fichier
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Initialiser le résultat
  const result: PHPAnalysisResult = {
    filePath,
    methods: [],
    properties: [],
    dependencies: [],
    databaseQueries: [],
    complexity: {
      cyclomaticComplexity: 0,
      maintainabilityIndex: 0,
      halsteadVolume: 0,
      locTotal: 0,
      locLogic: 0,
      locComments: 0
    },
    patterns: [],
    issues: [],
    migrationDifficulty: 'medium',
    migrationEstimateHours: 2,
    recommendations: []
  };
  
  try {
    // Parser le code PHP
    const ast = phpParse(fileContent, {
      parser: {
        debug: false,
        locations: true,
        extractDoc: true,
        suppressErrors: true
      },
      ast: {
        withPositions: true
      }
    });
    
    // Extraire les informations de base
    result.className = extractClassName(ast);
    result.methods = extractMethods(ast);
    result.properties = extractProperties(ast);
    result.dependencies = extractDependencies(ast);
    result.databaseQueries = extractDatabaseQueries(fileContent);
    
    // Calculer la complexité
    result.complexity = calculateComplexity(fileContent, ast);
    
    // Détecter les patterns
    result.patterns = detectPatterns(ast, fileContent);
    
    // Analyser les problèmes potentiels
    result.issues = analyzeIssues(fileContent, ast);
    
    // Évaluer la difficulté de migration
    const difficultyAssessment = assessMigrationDifficulty(result);
    result.migrationDifficulty = difficultyAssessment.difficulty;
    result.migrationEstimateHours = difficultyAssessment.estimateHours;
    
    // Générer des recommandations
    result.recommendations = generateRecommendations(result);
    
    return result;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'analyse de ${filePath}:`), error);
    throw new Error(`Échec de l'analyse: ${error.message}`);
  }
}

/**
 * Détecte le module auquel appartient le fichier
 */
function detectModule(filePath: string): string {
  // Logique simple basée sur le chemin du fichier
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/admin/')) return 'admin';
  if (normalizedPath.includes('/cart/')) return 'cart';
  if (normalizedPath.includes('/product/')) return 'product';
  if (normalizedPath.includes('/user/')) return 'user';
  if (normalizedPath.includes('/auth/')) return 'auth';
  if (normalizedPath.includes('/order/')) return 'order';
  if (normalizedPath.includes('/payment/')) return 'payment';
  if (normalizedPath.includes('/shipping/')) return 'shipping';
  if (normalizedPath.includes('/customer/')) return 'customer';
  if (normalizedPath.includes('/inventory/')) return 'inventory';
  
  // Extraire le répertoire parent comme module par défaut
  const parts = normalizedPath.split('/');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  
  return 'core';
}

/**
 * Extrait le nom de la classe du fichier
 */
function extractClassName(ast: any): string | undefined {
  // Implémentation simplifiée pour l'exemple
  try {
    if (ast && ast.children) {
      for (const node of ast.children) {
        if (node.kind === 'class') {
          return node.name.name;
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de l\'extraction du nom de classe'), error);
  }
  
  return undefined;
}

/**
 * Extrait les méthodes de la classe
 */
function extractMethods(ast: any): MethodInfo[] {
  const methods: MethodInfo[] = [];
  
  // Implémentation simplifiée pour l'exemple
  try {
    if (ast && ast.children) {
      for (const node of ast.children) {
        if (node.kind === 'class' && node.body) {
          for (const classItem of node.body) {
            if (classItem.kind === 'method') {
              const method: MethodInfo = {
                name: classItem.name.name,
                visibility: getVisibility(classItem),
                static: Boolean(classItem.isStatic),
                parameters: extractParameters(classItem),
                complexity: 1, // Valeur par défaut
                loc: countLines(classItem),
                docblockComplete: hasCompleteDocblock(classItem),
                hasTypeHints: hasParameterTypeHints(classItem)
              };
              
              // Extraire le type de retour s'il existe
              if (classItem.returnType) {
                method.returnType = classItem.returnType.name;
              }
              
              methods.push(method);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de l\'extraction des méthodes'), error);
  }
  
  return methods;
}

/**
 * Détermine la visibilité d'un élément de classe
 */
function getVisibility(node: any): 'public' | 'protected' | 'private' {
  if (node.visibility === 'protected') return 'protected';
  if (node.visibility === 'private') return 'private';
  return 'public'; // Par défaut
}

/**
 * Extrait les paramètres d'une méthode
 */
function extractParameters(methodNode: any): ParameterInfo[] {
  const parameters: ParameterInfo[] = [];
  
  try {
    if (methodNode.arguments) {
      for (const arg of methodNode.arguments) {
        const parameter: ParameterInfo = {
          name: arg.name,
          nullable: Boolean(arg.nullable)
        };
        
        // Extraire le type s'il existe
        if (arg.type) {
          parameter.type = arg.type;
        }
        
        // Extraire la valeur par défaut s'il en existe une
        if (arg.value) {
          parameter.defaultValue = arg.value.value;
        }
        
        parameters.push(parameter);
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de l\'extraction des paramètres'), error);
  }
  
  return parameters;
}

/**
 * Compte le nombre de lignes d'une méthode
 */
function countLines(node: any): number {
  try {
    if (node.loc) {
      return node.loc.end.line - node.loc.start.line + 1;
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors du comptage des lignes'), error);
  }
  
  return 0;
}

/**
 * Vérifie si une méthode a un docblock complet
 */
function hasCompleteDocblock(methodNode: any): boolean {
  try {
    if (methodNode.doc) {
      const doc = methodNode.doc.toString();
      return doc.includes('@param') && doc.includes('@return');
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de la vérification du docblock'), error);
  }
  
  return false;
}

/**
 * Vérifie si les paramètres d'une méthode ont des type hints
 */
function hasParameterTypeHints(methodNode: any): boolean {
  try {
    if (methodNode.arguments && methodNode.arguments.length > 0) {
      return methodNode.arguments.every((arg: any) => Boolean(arg.type));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de la vérification des type hints'), error);
  }
  
  return false;
}

/**
 * Extrait les propriétés de la classe
 */
function extractProperties(ast: any): PropertyInfo[] {
  const properties: PropertyInfo[] = [];
  
  // Implémentation simplifiée pour l'exemple
  try {
    if (ast && ast.children) {
      for (const node of ast.children) {
        if (node.kind === 'class' && node.body) {
          for (const classItem of node.body) {
            if (classItem.kind === 'property') {
              for (const prop of classItem.properties) {
                const property: PropertyInfo = {
                  name: prop.name,
                  visibility: getVisibility(classItem),
                  static: Boolean(classItem.isStatic)
                };
                
                // Extraire la valeur par défaut s'il en existe une
                if (prop.value) {
                  property.defaultValue = prop.value.value;
                }
                
                properties.push(property);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de l\'extraction des propriétés'), error);
  }
  
  return properties;
}

/**
 * Extrait les dépendances (use, require, include, etc.)
 */
function extractDependencies(ast: any): string[] {
  const dependencies: string[] = [];
  
  // Implémentation simplifiée pour l'exemple
  try {
    if (ast && ast.children) {
      for (const node of ast.children) {
        // Inclusions
        if (node.kind === 'include' || node.kind === 'require') {
          if (node.target && node.target.value) {
            dependencies.push(node.target.value);
          }
        }
        
        // Imports (use statements)
        if (node.kind === 'namespace' && node.children) {
          for (const nsChild of node.children) {
            if (nsChild.kind === 'use' && nsChild.items) {
              for (const useItem of nsChild.items) {
                dependencies.push(useItem.name);
              }
            }
          }
        }
        
        // Use statements au niveau global
        if (node.kind === 'use' && node.items) {
          for (const useItem of node.items) {
            dependencies.push(useItem.name);
          }
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Erreur lors de l\'extraction des dépendances'), error);
  }
  
  return [...new Set(dependencies)]; // Dédupliquer
}

/**
 * Extrait les requêtes de base de données
 */
function extractDatabaseQueries(fileContent: string): DatabaseQueryInfo[] {
  const queries: DatabaseQueryInfo[] = [];
  
  // Implémentation simplifiée pour l'exemple
  // Recherche de patterns SQL courants
  
  // Pattern 1: Requêtes SQL directes avec des chaînes de caractères simples
  const directQueryRegex = /["`']SELECT\s+.*?FROM\s+.*?["`']/gi;
  const directMatches = fileContent.match(directQueryRegex) || [];
  
  // Pattern 2: Requêtes préparées avec execute
  const preparedQueryRegex = /\$stmt\s*=\s*\$(?:this->)?(?:pdo|db|conn|connection|database)->prepare\s*\(\s*["'`](.*?)["'`]\s*\)/gi;
  const preparedMatches = [...fileContent.matchAll(preparedQueryRegex)];
  
  // Ajouter les requêtes directes
  for (const match of directMatches) {
    // Extraire les tables (simplifié)
    const fromRegex = /FROM\s+["`']?(\w+)["`']?/i;
    const fromMatch = match.match(fromRegex);
    const table = fromMatch ? fromMatch[1] : 'unknown';
    
    // Déterminer le type (simplifié)
    let type: 'select' | 'insert' | 'update' | 'delete' | 'other' = 'other';
    if (match.toUpperCase().startsWith('SELECT')) type = 'select';
    else if (match.toUpperCase().startsWith('INSERT')) type = 'insert';
    else if (match.toUpperCase().startsWith('UPDATE')) type = 'update';
    else if (match.toUpperCase().startsWith('DELETE')) type = 'delete';
    
    // Trouver le numéro de ligne (approximatif)
    const lines = fileContent.split('\n');
    let lineNumber = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        lineNumber = i + 1;
        break;
      }
    }
    
    queries.push({
      query: match,
      type,
      tables: [table],
      prepared: false,
      line: lineNumber
    });
  }
  
  // Ajouter les requêtes préparées
  for (const match of preparedMatches) {
    const query = match[1];
    
    // Extraire les tables (simplifié)
    const fromRegex = /FROM\s+["`']?(\w+)["`']?/i;
    const fromMatch = query.match(fromRegex);
    const table = fromMatch ? fromMatch[1] : 'unknown';
    
    // Déterminer le type (simplifié)
    let type: 'select' | 'insert' | 'update' | 'delete' | 'other' = 'other';
    if (query.toUpperCase().startsWith('SELECT')) type = 'select';
    else if (query.toUpperCase().startsWith('INSERT')) type = 'insert';
    else if (query.toUpperCase().startsWith('UPDATE')) type = 'update';
    else if (query.toUpperCase().startsWith('DELETE')) type = 'delete';
    
    // Calculer le numéro de ligne
    const upToMatch = fileContent.slice(0, match.index);
    const lineNumber = upToMatch.split('\n').length;
    
    queries.push({
      query,
      type,
      tables: [table],
      prepared: true,
      line: lineNumber
    });
  }
  
  return queries;
}

/**
 * Calcule les métriques de complexité
 */
function calculateComplexity(fileContent: string, ast: any): ComplexityMetrics {
  // Implémentation simplifiée pour l'exemple
  
  // Compter les lignes de code totales
  const lines = fileContent.split('\n');
  const locTotal = lines.length;
  
  // Compter les lignes de commentaires (approximatif)
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*')
  ).length;
  
  // Compter les lignes de code logique (approximatif)
  const logicLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('//') && 
           !trimmed.startsWith('/*') && 
           !trimmed.startsWith('*') &&
           !trimmed.startsWith('}') &&
           !trimmed.startsWith('{');
  }).length;
  
  // Calculer la complexité cyclomatique (simplifié)
  // Compter les structures de contrôle
  const controlStructures = (fileContent.match(/\b(if|else|for|foreach|while|do|switch|case)\b/g) || []).length;
  const cyclomaticComplexity = 1 + controlStructures;
  
  // Calculer l'indice de maintenabilité (simplifié)
  // Formule simplifiée: 171 - 5.2 * ln(halsteadVolume) - 0.23 * (cyclomaticComplexity) - 16.2 * ln(locTotal)
  const halsteadVolume = locTotal * 0.7; // Approximation
  const maintainabilityIndex = Math.max(0, Math.min(100, 
    171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(locTotal)
  ));
  
  return {
    cyclomaticComplexity,
    maintainabilityIndex,
    halsteadVolume,
    locTotal,
    locLogic: logicLines,
    locComments: commentLines
  };
}

/**
 * Détecte les patterns de conception dans le code
 */
function detectPatterns(ast: any, fileContent: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  
  // Implémentation simplifiée pour l'exemple
  
  // 1. Détection du pattern Singleton
  if (fileContent.includes('private static $instance') && 
      fileContent.includes('private function __construct') &&
      fileContent.includes('public static function getInstance')) {
    patterns.push({
      name: 'Singleton',
      confidence: 0.9,
      location: {
        startLine: 1,
        endLine: fileContent.split('\n').length
      },
      description: 'Cette classe utilise le pattern Singleton'
    });
  }
  
  // 2. Détection du pattern Factory
  if (fileContent.includes('function create') && 
      (fileContent.includes('return new ') || fileContent.includes('instanceof'))) {
    patterns.push({
      name: 'Factory',
      confidence: 0.7,
      location: {
        startLine: 1,
        endLine: fileContent.split('\n').length
      },
      description: 'Cette classe semble implémenter le pattern Factory'
    });
  }
  
  // 3. Détection du pattern Repository
  if ((fileContent.includes('Repository') || fileContent.includes('DAO')) && 
      (fileContent.includes('find') || fileContent.includes('get') || fileContent.includes('save'))) {
    patterns.push({
      name: 'Repository',
      confidence: 0.8,
      location: {
        startLine: 1,
        endLine: fileContent.split('\n').length
      },
      description: 'Cette classe implémente le pattern Repository pour l\'accès aux données'
    });
  }
  
  // 4. Détection du pattern Observer
  if (fileContent.includes('addObserver') && 
      fileContent.includes('notifyObservers')) {
    patterns.push({
      name: 'Observer',
      confidence: 0.85,
      location: {
        startLine: 1,
        endLine: fileContent.split('\n').length
      },
      description: 'Cette classe implémente le pattern Observer'
    });
  }
  
  return patterns;
}

/**
 * Analyse les problèmes potentiels dans le code
 */
function analyzeIssues(fileContent: string, ast: any): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  
  // Implémentation simplifiée pour l'exemple
  
  // 1. Problèmes de sécurité
  
  // SQL Injection
  if (fileContent.includes('$_GET') && fileContent.includes('query(')) {
    issues.push({
      type: 'security',
      severity: 'high',
      message: 'Risque d\'injection SQL: utilisation de variables $_GET directement dans une requête SQL',
      recommendation: 'Utilisez des requêtes préparées avec des paramètres liés'
    });
  }
  
  // XSS
  if (fileContent.includes('echo $_') || fileContent.includes('print $_')) {
    issues.push({
      type: 'security',
      severity: 'high',
      message: 'Risque XSS: affichage de données utilisateur sans échappement',
      recommendation: 'Utilisez htmlspecialchars() pour échapper les données utilisateur'
    });
  }
  
  // 2. Problèmes de performance
  
  // Requêtes dans des boucles
  if (fileContent.match(/for\s*\(.*\)\s*\{[\s\S]*?\$.*->query\s*\(/)) {
    issues.push({
      type: 'performance',
      severity: 'medium',
      message: 'Requête de base de données dans une boucle',
      recommendation: 'Utilisez des requêtes avec JOIN ou avec des clauses IN plutôt que des requêtes individuelles dans des boucles'
    });
  }
  
  // 3. Problèmes de maintenabilité
  
  // Méthodes trop longues
  const lines = fileContent.split('\n');
  let inMethod = false;
  let methodStart = 0;
  let methodName = '';
  let bracketCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détection du début d'une méthode
    if (!inMethod && line.match(/function\s+(\w+)\s*\(/)) {
      inMethod = true;
      methodStart = i;
      methodName = line.match(/function\s+(\w+)\s*\(/)[1];
      bracketCount = 0;
    }
    
    // Comptage des accolades
    if (inMethod) {
      bracketCount += (line.match(/\{/g) || []).length;
      bracketCount -= (line.match(/\}/g) || []).length;
      
      // Fin de méthode
      if (bracketCount === 0 && line.includes('}')) {
        inMethod = false;
        const methodLength = i - methodStart + 1;
        
        if (methodLength > 50) {
          issues.push({
            type: 'maintainability',
            severity: 'medium',
            message: `Méthode "${methodName}" trop longue (${methodLength} lignes)`,
            line: methodStart + 1,
            recommendation: 'Divisez cette méthode en méthodes plus petites et plus spécialisées'
          });
        }
      }
    }
  }
  
  // 4. Bugs potentiels
  
  // Utilisation de variables non initialisées
  const variableUseRegex = /\$(\w+)\s*(?:=|\+|-|\*|\/|\.)/g;
  const variableMatches = [...fileContent.matchAll(variableUseRegex)];
  const usedVariables = new Set(variableMatches.map(match => match[1]));
  
  const variableDefRegex = /\$(\w+)\s*=/g;
  const definedVariables = new Set([...fileContent.matchAll(variableDefRegex)].map(match => match[1]));
  
  // Variables globales prédéfinies
  const predefinedVars = new Set(['_GET', '_POST', '_REQUEST', '_SESSION', '_COOKIE', '_SERVER', '_ENV', '_FILES', 'GLOBALS', 'this']);
  
  // Vérification des variables potentiellement non initialisées
  for (const variable of usedVariables) {
    if (!definedVariables.has(variable) && !predefinedVars.has(variable) && variable !== 'this') {
      issues.push({
        type: 'bug',
        severity: 'medium',
        message: `Variable "$${variable}" potentiellement non initialisée`,
        recommendation: `Assurez-vous d'initialiser la variable "$${variable}" avant de l'utiliser`
      });
    }
  }
  
  return issues;
}

/**
 * Évalue la difficulté de migration
 */
function assessMigrationDifficulty(analysis: PHPAnalysisResult): { difficulty: 'easy' | 'medium' | 'hard', estimateHours: number } {
  // Calculer un score de difficulté basé sur plusieurs facteurs
  let difficultyScore = 0;
  
  // Facteur 1: Complexité du code
  if (analysis.complexity.cyclomaticComplexity > 20) {
    difficultyScore += 3;
  } else if (analysis.complexity.cyclomaticComplexity > 10) {
    difficultyScore += 2;
  } else {
    difficultyScore += 1;
  }
  
  // Facteur 2: Utilisation de la base de données
  if (analysis.databaseQueries.length > 10) {
    difficultyScore += 3;
  } else if (analysis.databaseQueries.length > 5) {
    difficultyScore += 2;
  } else if (analysis.databaseQueries.length > 0) {
    difficultyScore += 1;
  }
  
  // Facteur 3: Nombre de dépendances
  if (analysis.dependencies.length > 10) {
    difficultyScore += 3;
  } else if (analysis.dependencies.length > 5) {
    difficultyScore += 2;
  } else {
    difficultyScore += 1;
  }
  
  // Facteur 4: Problèmes de sécurité (pondération plus élevée)
  const securityIssues = analysis.issues.filter(issue => issue.type === 'security').length;
  difficultyScore += securityIssues * 2;
  
  // Facteur 5: Taille du code
  if (analysis.complexity.locTotal > 500) {
    difficultyScore += 3;
  } else if (analysis.complexity.locTotal > 200) {
    difficultyScore += 2;
  } else {
    difficultyScore += 1;
  }
  
  // Conversion du score en difficulté
  let difficulty: 'easy' | 'medium' | 'hard';
  let estimateHours: number;
  
  if (difficultyScore > 10) {
    difficulty = 'hard';
    estimateHours = Math.round(analysis.complexity.locTotal / 10); // ~10 lignes par heure pour les cas difficiles
  } else if (difficultyScore > 5) {
    difficulty = 'medium';
    estimateHours = Math.round(analysis.complexity.locTotal / 20); // ~20 lignes par heure pour les cas moyens
  } else {
    difficulty = 'easy';
    estimateHours = Math.round(analysis.complexity.locTotal / 30); // ~30 lignes par heure pour les cas faciles
  }
  
  // Assurer un minimum d'heures et un maximum raisonnable
  estimateHours = Math.max(1, Math.min(estimateHours, 80)); // Entre 1h et 80h (2 semaines)
  
  return { difficulty, estimateHours };
}

/**
 * Génère des recommandations pour la migration
 */
function generateRecommendations(analysis: PHPAnalysisResult): string[] {
  const recommendations: string[] = [];
  
  // Recommandation 1: Migration vers des models/repositories Prisma
  if (analysis.databaseQueries.length > 0) {
    recommendations.push('Convertir les requêtes SQL en modèles Prisma pour une meilleure type-safety et une gestion simplifiée de la base de données');
  }
  
  // Recommandation 2: Refactoring des méthodes trop longues
  const longMethods = analysis.methods.filter(method => method.loc > 50);
  if (longMethods.length > 0) {
    const methodNames = longMethods.map(m => m.name).join(', ');
    recommendations.push(`Refactoriser les méthodes trop longues (${methodNames}) en les divisant en méthodes plus petites et spécialisées`);
  }
  
  // Recommandation 3: Ajout de types TypeScript
  if (analysis.methods.some(m => !m.hasTypeHints)) {
    recommendations.push('Ajouter des annotations de type TypeScript pour tous les paramètres et valeurs de retour des méthodes');
  }
  
  // Recommandation 4: Sécurité
  const securityIssues = analysis.issues.filter(issue => issue.type === 'security');
  if (securityIssues.length > 0) {
    recommendations.push(`Corriger les ${securityIssues.length} problèmes de sécurité identifiés avant la migration`);
  }
  
  // Recommandation 5: Adaptation du pattern
  if (analysis.patterns.length > 0) {
    const patterns = analysis.patterns.map(p => p.name).join(', ');
    recommendations.push(`Adapter les patterns existants (${patterns}) aux équivalents TypeScript/NestJS`);
  }
  
  // Recommandation 6: Tests
  recommendations.push('Créer des tests unitaires et d\'intégration pour assurer que la fonctionnalité est préservée après la migration');
  
  // Recommandation 7: Dépendances
  if (analysis.dependencies.length > 0) {
    recommendations.push('Identifier et migrer les dépendances PHP vers leurs équivalents TypeScript/Node.js');
  }
  
  // Recommandation 8: Architecture
  if (analysis.complexity.maintainabilityIndex < 65) {
    recommendations.push('Restructurer l\'architecture du code pendant la migration pour améliorer la maintenabilité');
  }
  
  return recommendations;
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`❌ Erreur inattendue: ${error.message}`));
  console.error(error);
  process.exit(1);
});