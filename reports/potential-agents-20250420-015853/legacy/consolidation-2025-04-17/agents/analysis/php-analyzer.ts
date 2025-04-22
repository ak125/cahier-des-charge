#!/usr/bin/env node
/**
 * php-analyzer.ts
 * 
 * Agent d'analyse de code PHP intégré avec Supabase via le protocole MCP
 * Permet d'analyser les fichiers PHP et stocker les résultats dans Supabase
 * 
 * Usage: ts-node php-analyzer.ts [options]
 * 
 * Options:
 *   --file=<path>       Chemin du fichier PHP à analyser
 *   --module=<name>     Nom du module (ex: cart, user, order)
 *   --recursive         Analyser récursivement un dossier
 *   --batch-size=<n>    Nombre de fichiers à traiter par lot (défaut: 10)
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { glob } from 'glob';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Importer le client Supabase
import { supabase, logMcpEvent, updateMcpEventStatus } from '../../utils/supabaseClient';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PhpAnalysisOptions {
  filePath: string;
  moduleName?: string;
  analyzeComplexity?: boolean;
  generateNestJSCode?: boolean;
  reportToMcp?: boolean;
}

interface PhpAnalysisResult {
  fileInfo: {
    name: string;
    path: string;
    size: number;
    lineCount: number;
    module?: string;
    createdAt?: Date;
    modifiedAt?: Date;
  };
  complexity: {
    cyclomaticComplexity?: number;
    cognitiveComplexity?: number;
    methodCount?: number;
    classCount?: number;
    functionCount?: number;
  };
  dependencies: string[];
  phpVersion?: string;
  classInfo?: {
    name: string;
    methods: Array<{
      name: string;
      visibility: 'public' | 'protected' | 'private';
      parameters: string[];
      returnsType?: string;
    }>;
    properties: Array<{
      name: string;
      visibility: 'public' | 'protected' | 'private';
      type?: string;
    }>;
  }[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
  nestJsEquivalent?: string;
}

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Analyseur de code PHP avec intégration Supabase MCP')
  .option('--file <path>', 'Chemin du fichier PHP à analyser')
  .option('--dir <path>', 'Dossier contenant les fichiers PHP à analyser')
  .option('--module <name>', 'Nom du module (ex: cart, user, order)')
  .option('--recursive', 'Analyser récursivement un dossier', false)
  .option('--batch-size <n>', 'Nombre de fichiers à traiter par lot', '10')
  .option('--verbose', 'Afficher les détails de l\'analyse', false)
  .parse(process.argv);

const options = program.opts();

// Types de retour d'analyse
interface PHPFunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  arguments: string[];
  returnType?: string;
  complexity: number;
  callsToSQL: string[];
  dependencies: string[];
}

interface PHPClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  properties: Array<{
    name: string;
    type?: string;
    access: 'public' | 'protected' | 'private';
  }>;
  methods: PHPFunctionInfo[];
  extends?: string;
  implements?: string[];
}

interface PHPAnalysisResult {
  filePath: string;
  fileSize: number;
  linesOfCode: number;
  classes: PHPClassInfo[];
  functions: PHPFunctionInfo[];
  includes: string[];
  sqlQueries: string[];
  globalVariables: string[];
  complexity: number;
  suggestedJsEquivalent?: string;
  migrationDifficulty: 'easy' | 'medium' | 'hard';
  recommendations: string[];
  errors: string[];
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('🚀 Démarrage de l\'analyseur PHP avec intégration Supabase MCP'));

    // Vérifier la connexion à Supabase
    const { error: supabaseError } = await supabase.from(DoDotmcp_events').select('id').limit(1);
    if (supabaseError) {
      console.error(chalk.red(`❌ Erreur de connexion à Supabase: ${supabaseError.message}`));
      process.exit(1);
    }
    console.log(chalk.green('✅ Connexion à Supabase établie'));

    // Récupérer les fichiers à analyser
    const filesToAnalyze = await getFilesToAnalyze();
    
    if (filesToAnalyze.length === 0) {
      console.error(chalk.red('❌ Aucun fichier PHP trouvé à analyser'));
      process.exit(1);
    }

    console.log(chalk.blue(`📂 ${filesToAnalyze.length} fichiers PHP à analyser`));

    // Analyser les fichiers par lot
    const batchSize = parseInt(options.batchSize, 10);
    for (let i = 0; i < filesToAnalyze.length; i += batchSize) {
      const batch = filesToAnalyze.slice(i, i + batchSize);
      await Promise.all(batch.map(file => analyzeAndStorePHPFile(file)));
      console.log(chalk.blue(`📊 Progression: ${Math.min(i + batchSize, filesToAnalyze.length)}/${filesToAnalyze.length} fichiers`));
    }

    console.log(chalk.green('✅ Analyse terminée'));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Récupère la liste des fichiers PHP à analyser
 */
async function getFilesToAnalyze(): Promise<string[]> {
  if (options.file) {
    // Vérifier si le fichier existe
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier ${filePath} n'existe pas`);
    }
    // Vérifier que c'est un fichier PHP
    if (!filePath.endsWith('.php')) {
      throw new Error(`Le fichier ${filePath} n'est pas un fichier PHP`);
    }
    return [filePath];
  } else if (options.dir) {
    // Chercher tous les fichiers PHP dans le dossier
    const dirPath = path.resolve(options.dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Le dossier ${dirPath} n'existe pas`);
    }

    const pattern = options.recursive 
      ? path.join(dirPath, '**', '*.php')
      : path.join(dirPath, '*.php');
    
    return glob.sync(pattern);
  } else {
    throw new Error('Veuillez spécifier un fichier (--file) ou un dossier (--dir) à analyser');
  }
}

/**
 * Analyser un fichier PHP et stocker les résultats dans Supabase
 */
async function analyzeAndStorePHPFile(filePath: string): Promise<void> {
  try {
    console.log(chalk.blue(`📝 Analyse du fichier ${filePath}`));

    // Créer un enregistrement d'exécution d'agent
    const startTime = performance.now();
    const agentRunResult = await supabase.from('agent_runs').insert({
      agent_name: 'php-analyzer',
      status: 'started',
      input_params: { filePath, module: options.module },
    }).select('id').single();

    if (agentRunResult.error) {
      throw new Error(`Erreur lors de la création de l'enregistrement d'agent: ${agentRunResult.error.message}`);
    }

    const agentRunId = agentRunResult.data.id;

    try {
      // Vérifier si le fichier existe déjà dans les mappings
      const { data: existingMapping } = await supabase
        .from('file_mappings')
        .select('id, status')
        .eq('php_file', filePath)
        .maybeSingle();

      let fileId: number;

      if (existingMapping) {
        fileId = existingMapping.id;
        // Mettre à jour le statut du fichier s'il n'a pas déjà été analysé
        if (existingMapping.status !== 'analyzed' && existingMapping.status !== 'migrated') {
          await supabase
            .from('file_mappings')
            .update({ 
              status: 'analyzed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', fileId);
        }
      } else {
        // Créer un nouvel enregistrement dans file_mappings
        const { data: newMapping, error: mappingError } = await supabase
          .from('file_mappings')
          .insert({
            file_path: filePath,
            php_file: filePath,
            status: 'analyzed',
            module: options.module || extractModuleFromPath(filePath),
            category: determineCategoryFromPath(filePath),
          })
          .select('id')
          .single();

        if (mappingError) {
          throw new Error(`Erreur lors de la création du mapping de fichier: ${mappingError.message}`);
        }

        fileId = newMapping.id;
      }

      // Analyser le fichier PHP
      const analysisResult = await analyzePHPFile(filePath);

      // Stocker le résultat de l'analyse dans audit_logs
      const { error: auditError } = await supabase.from('audit_logs').insert({
        file_name: filePath,
        module: options.module || extractModuleFromPath(filePath),
        agent: 'php-analyzer',
        status: 'done',
        audit_json: analysisResult,
        duration_ms: Math.round(performance.now() - startTime),
        version: '1.0.0',
      });

      if (auditError) {
        throw new Error(`Erreur lors de l'enregistrement de l'audit: ${auditError.message}`);
      }

      // Mettre à jour l'enregistrement d'agent
      await supabase.from('agent_runs').update({
        status: 'completed',
        output_result: { 
          fileId,
          analysisResult: {
            classes: analysisResult.classes.length,
            functions: analysisResult.functions.length, 
            complexity: analysisResult.complexity,
            migrationDifficulty: analysisResult.migrationDifficulty,
          }
        },
        duration_ms: Math.round(performance.now() - startTime),
      }).eq('id', agentRunId);

      // Créer une tâche de migration si elle n'existe pas déjà
      const { data: existingTask } = await supabase
        .from('migration_tasks')
        .select('id')
        .eq('file_id', fileId)
        .maybeSingle();

      if (!existingTask) {
        await supabase.from('migration_tasks').insert({
          file_id: fileId,
          status: 'pending',
          task_type: 'php_to_ts',
          priority: determinePriority(analysisResult),
          estimated_hours: estimateHours(analysisResult),
        });
      }

      // Envoyer un événement MCP pour signaler la fin de l'analyse
      await supabase.from(DoDotmcp_events').insert({
        event_type: 'php_analysis_completed',
        payload: {
          filePath,
          fileId,
          timestamp: new Date().toISOString(),
          module: options.module || extractModuleFromPath(filePath),
          complexity: analysisResult.complexity,
          migrationDifficulty: analysisResult.migrationDifficulty,
        },
        source: 'php-analyzer',
        status: 'received',
        priority: determinePriority(analysisResult),
      });

      console.log(chalk.green(`✅ Analyse terminée pour ${filePath}`));
    } catch (error) {
      // En cas d'erreur, mettre à jour l'enregistrement d'agent
      await supabase.from('agent_runs').update({
        status: 'failed',
        error_message: error.message,
        duration_ms: Math.round(performance.now() - startTime),
      }).eq('id', agentRunId);

      throw error;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse de ${filePath}: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
  }
}

/**
 * Analyser un fichier PHP et retourner les résultats
 */
async function analyzePHPFile(filePath: string): Promise<PHPAnalysisResult> {
  // Lire le contenu du fichier
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileStats = fs.statSync(filePath);
  
  // Analyse simplifiée pour l'exemple
  // Dans un cas réel, vous utiliseriez un parser PHP comme php-parser
  const linesOfCode = fileContent.split('\n').length;
  const classes = extractPHPClasses(fileContent);
  const functions = extractPHPFunctions(fileContent);
  const includes = extractPHPIncludes(fileContent);
  const sqlQueries = extractSQLQueries(fileContent);
  const globalVariables = extractGlobalVariables(fileContent);
  
  // Calculer la complexité globale
  const complexity = calculateComplexity(fileContent, classes, functions);
  
  // Déterminer la difficulté de migration
  const migrationDifficulty = determineMigrationDifficulty(complexity, sqlQueries.length, classes.length);
  
  // Générer des recommandations
  const recommendations = generateRecommendations(fileContent, classes, functions, sqlQueries);
  
  return {
    filePath,
    fileSize: fileStats.size,
    linesOfCode,
    classes,
    functions,
    includes,
    sqlQueries,
    globalVariables,
    complexity,
    migrationDifficulty,
    recommendations,
    errors: [],
  };
}

/**
 * Fonctions d'extraction (simplifiées pour l'exemple)
 */
function extractPHPClasses(content: string): PHPClassInfo[] {
  // Extraction simplifiée des classes pour l'exemple
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
  const classes: PHPClassInfo[] = [];
  
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    const extendsClass = match[2];
    const implementsInterfaces = match[3] ? match[3].split(',').map(i => i.trim()) : undefined;
    
    classes.push({
      name: className,
      startLine: getLineNumber(content, match.index),
      endLine: getLineNumber(content, content.indexOf('}', match.index)),
      properties: extractProperties(content, match.index),
      methods: extractMethods(content, match.index),
      extends: extendsClass,
      implements: implementsInterfaces,
    });
  }
  
  return classes;
}

function extractPHPFunctions(content: string): PHPFunctionInfo[] {
  // Extraction simplifiée des fonctions pour l'exemple
  const functionRegex = /function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+))?\s*{/g;
  const functions: PHPFunctionInfo[] = [];
  
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    // Ignorer les fonctions qui sont dans des classes (méthodes)
    if (isWithinClass(content, match.index)) {
      continue;
    }
    
    const functionName = match[1];
    const args = match[2].split(',').map(arg => arg.trim()).filter(arg => arg !== '');
    const returnType = match[3];
    
    functions.push({
      name: functionName,
      startLine: getLineNumber(content, match.index),
      endLine: getLineNumber(content, findClosingBrace(content, match.index)),
      arguments: args,
      returnType,
      complexity: calculateFunctionComplexity(content, match.index),
      callsToSQL: extractSQLCalls(content, match.index, findClosingBrace(content, match.index)),
      dependencies: extractDependencies(content, match.index, findClosingBrace(content, match.index)),
    });
  }
  
  return functions;
}

function extractProperties(content: string, classStartIndex: number): Array<{ name: string; type?: string; access: 'public' | 'protected' | 'private' }> {
  // Simplification pour l'exemple
  const propertyRegex = /(public|protected|private)\s+(?:(\w+)\s+)?\$(\w+)/g;
  const classContent = content.substring(classStartIndex, findClosingBrace(content, classStartIndex));
  const properties = [];
  
  let match;
  while ((match = propertyRegex.exec(classContent)) !== null) {
    properties.push({
      access: match[1] as 'public' | 'protected' | 'private',
      type: match[2],
      name: match[3],
    });
  }
  
  return properties;
}

function extractMethods(content: string, classStartIndex: number): PHPFunctionInfo[] {
  // Simplification pour l'exemple
  const methodRegex = /(public|protected|private)(?:\s+static)?\s+function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+))?\s*{/g;
  const classContent = content.substring(classStartIndex, findClosingBrace(content, classStartIndex));
  const methods = [];
  
  let match;
  while ((match = methodRegex.exec(classContent)) !== null) {
    const methodName = match[2];
    const args = match[3].split(',').map(arg => arg.trim()).filter(arg => arg !== '');
    const returnType = match[4];
    const methodStartIndex = classStartIndex + match.index;
    
    methods.push({
      name: methodName,
      startLine: getLineNumber(content, methodStartIndex),
      endLine: getLineNumber(content, findClosingBrace(content, methodStartIndex)),
      arguments: args,
      returnType,
      complexity: calculateFunctionComplexity(classContent, match.index),
      callsToSQL: extractSQLCalls(classContent, match.index, findClosingBrace(classContent, match.index)),
      dependencies: extractDependencies(classContent, match.index, findClosingBrace(classContent, match.index)),
    });
  }
  
  return methods;
}

function extractPHPIncludes(content: string): string[] {
  const includeRegex = /(include|require|include_once|require_once)\s*\(\s*['"](.+?)['"]\s*\)/g;
  const includes = [];
  
  let match;
  while ((match = includeRegex.exec(content)) !== null) {
    includes.push(match[2]);
  }
  
  return includes;
}

function extractSQLQueries(content: string): string[] {
  // Recherche simplifiée de requêtes SQL
  const sqlRegex = /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+.+?(?:FROM|INTO|TABLE|DATABASE|INDEX)\s+[\w\.]+/gi;
  const queries = [];
  
  let match;
  while ((match = sqlRegex.exec(content)) !== null) {
    queries.push(match[0]);
  }
  
  return queries;
}

function extractGlobalVariables(content: string): string[] {
  const globalRegex = /global\s+\$([\w,\s]+);/g;
  const globals = [];
  
  let match;
  while ((match = globalRegex.exec(content)) !== null) {
    const varList = match[1].split(',').map(v => v.trim());
    globals.push(...varList);
  }
  
  return globals;
}

function extractSQLCalls(content: string, startIndex: number, endIndex: number): string[] {
  const segment = content.substring(startIndex, endIndex);
  const sqlCalls = [];
  
  // Recherche de patterns comme $db->query, mysqli_query, etc.
  const dbQueryRegex = /(?:\$\w+->query|mysqli_query)\s*\(\s*(['"].*?['"])/g;
  
  let match;
  while ((match = dbQueryRegex.exec(segment)) !== null) {
    sqlCalls.push(match[1]);
  }
  
  return sqlCalls;
}

function extractDependencies(content: string, startIndex: number, endIndex: number): string[] {
  const segment = content.substring(startIndex, endIndex);
  const dependencies = new Set<string>();
  
  // Pattern pour trouver les utilisations de classes
  const classUsageRegex = /new\s+(\w+)|instanceof\s+(\w+)|\$\w+\s*=\s*(\w+)::/g;
  
  let match;
  while ((match = classUsageRegex.exec(segment)) !== null) {
    const className = match[1] || match[2] || match[3];
    if (className) {
      dependencies.add(className);
    }
  }
  
  return Array.from(dependencies);
}

/**
 * Fonctions utilitaires
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

function findClosingBrace(content: string, startIndex: number): number {
  // Trouver l'accolade ouvrante
  const openingBraceIndex = content.indexOf('{', startIndex);
  if (openingBraceIndex === -1) return content.length;
  
  let depth = 1;
  let i = openingBraceIndex + 1;
  
  while (i < content.length && depth > 0) {
    if (content[i] === '{') {
      depth++;
    } else if (content[i] === '}') {
      depth--;
    }
    i++;
  }
  
  return i;
}

function isWithinClass(content: string, index: number): boolean {
  // Simplification pour l'exemple
  const classBrackets = [];
  const classRegex = /class\s+\w+.*?{/g;
  
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const openBraceIndex = content.indexOf('{', match.index);
    const closeBraceIndex = findClosingBrace(content, match.index);
    classBrackets.push([openBraceIndex, closeBraceIndex]);
  }
  
  return classBrackets.some(([start, end]) => index > start && index < end);
}

function calculateComplexity(content: string, classes: PHPClassInfo[], functions: PHPFunctionInfo[]): number {
  // Facteurs de complexité (simplifiés pour l'exemple)
  const linesOfCode = content.split('\n').length;
  const classCount = classes.length;
  const methodCount = classes.reduce((sum, cls) => sum + cls.methods.length, 0);
  const functionCount = functions.length;
  const sqlQueryCount = content.match(/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/gi)?.length || 0;
  const conditionals = (content.match(/if\s*\(/g) || []).length;
  const loops = (content.match(/(?:for|foreach|while|do)\s*\(/g) || []).length;
  
  // Formule simplifiée de complexité
  return (
    linesOfCode / 100 +
    classCount * 5 +
    methodCount * 2 +
    functionCount * 3 +
    sqlQueryCount * 4 +
    conditionals * 1.5 +
    loops * 2
  );
}

function calculateFunctionComplexity(content: string, startIndex: number): number {
  const functionContent = content.substring(
    startIndex, 
    findClosingBrace(content, startIndex)
  );
  
  // Compter les facteurs de complexité
  const conditionals = (functionContent.match(/if\s*\(/g) || []).length;
  const loops = (functionContent.match(/(?:for|foreach|while|do)\s*\(/g) || []).length;
  const returnStmts = (functionContent.match(/return\s+/g) || []).length;
  const sqlQueries = (functionContent.match(/(?:query|execute)\s*\(/g) || []).length;
  
  // Formule simplifiée
  return 1 + conditionals + loops * 2 + (returnStmts > 1 ? returnStmts - 1 : 0) + sqlQueries * 1.5;
}

function determineMigrationDifficulty(
  complexity: number, 
  sqlQueriesCount: number, 
  classesCount: number
): 'easy' | 'medium' | 'hard' {
  if (complexity > 100 || sqlQueriesCount > 10) {
    return 'hard';
  } else if (complexity > 50 || sqlQueriesCount > 5 || classesCount > 3) {
    return 'medium';
  } else {
    return 'easy';
  }
}

function generateRecommendations(
  content: string, 
  classes: PHPClassInfo[], 
  functions: PHPFunctionInfo[], 
  sqlQueries: string[]
): string[] {
  const recommendations = [];
  
  // Recommandations basées sur le contenu
  if (functions.length > 10) {
    recommendations.push("Diviser le fichier en modules plus petits selon les responsabilités");
  }
  
  if (sqlQueries.length > 0) {
    recommendations.push("Migrer les requêtes SQL vers Prisma");
  }
  
  if (content.includes('global $')) {
    recommendations.push("Remplacer les variables globales par une approche d'injection de dépendances");
  }
  
  // Recommandations basées sur les classes
  for (const cls of classes) {
    if (cls.methods.length > 15) {
      recommendations.push(`Diviser la classe ${cls.name} en classes plus petites`);
    }
    
    const methodsWithHighComplexity = cls.methods.filter(m => m.complexity > 8);
    if (methodsWithHighComplexity.length > 0) {
      recommendations.push(
        `Refactoriser les méthodes complexes dans ${cls.name}: ${methodsWithHighComplexity.map(m => m.name).join(', ')}`
      );
    }
  }
  
  // Recommandations spécifiques à la migration
  if (content.includes('mysql_')) {
    recommendations.push("Remplacer les fonctions mysql_* obsolètes par Prisma");
  }
  
  if (content.includes('echo ') || content.includes('print ')) {
    recommendations.push("Convertir les sorties echo/print en composants React/JSX");
  }
  
  return recommendations;
}

function determinePriority(analysis: PHPAnalysisResult): number {
  // Priorité basée sur la difficulté et la complexité
  switch (analysis.migrationDifficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 3;
    case 'hard':
      return 5;
    default:
      return 3;
  }
}

function estimateHours(analysis: PHPAnalysisResult): number {
  // Estimation d'heures basée sur la difficulté
  switch (analysis.migrationDifficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 4;
    case 'hard':
      return 8;
    default:
      return 4;
  }
}

function extractModuleFromPath(filePath: string): string | null {
  // Extraire le module à partir du chemin (personnaliser selon la structure de votre projet)
  const parts = filePath.split('/');
  const moduleIndex = parts.findIndex(part => part === 'modules' || part === 'components');
  
  if (moduleIndex !== -1 && parts.length > moduleIndex + 1) {
    return parts[moduleIndex + 1];
  }
  
  return null;
}

function determineCategoryFromPath(filePath: string): 'controller' | 'model' | 'view' | 'helper' | 'api' | 'other' {
  const lowerPath = filePath.toLowerCase();
  
  if (lowerPath.includes('/controllers/') || lowerPath.includes('controller.php')) {
    return 'controller';
  } else if (lowerPath.includes('/models/') || lowerPath.includes('model.php')) {
    return 'model';
  } else if (lowerPath.includes('/views/') || lowerPath.includes('/templates/') || lowerPath.includes('/tpl/')) {
    return 'view';
  } else if (lowerPath.includes('/helpers/') || lowerPath.includes('/utils/')) {
    return 'helper';
  } else if (lowerPath.includes('/api/') || lowerPath.includes('api.php')) {
    return 'api';
  } else {
    return 'other';
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur inattendue:'), error);
  process.exit(1);
});

/**
 * Analyse un fichier PHP et retourne des informations détaillées
 * Optionnellement, enregistre les résultats dans Supabase
 */
export async function analyzePhpFile(options: PhpAnalysisOptions): Promise<PhpAnalysisResult> {
  console.log(`Analyse du fichier PHP: ${options.filePath}`);
  let eventId: number | undefined;
  const startTime = Date.now();
  
  try {
    // Si reportToMcp est activé, on enregistre l'événement de début d'analyse
    if (options.reportToMcp) {
      eventId = await logMcpEvent(
        'php_analysis_started',
        { filePath: options.filePath, moduleName: options.moduleName },
        'php-analyzer',
        4
      );
      
      if (eventId) {
        await updateMcpEventStatus(eventId, 'processing');
      }
    }

    // Vérifier si le fichier existe
    try {
      await fs.access(options.filePath);
    } catch (error) {
      throw new Error(`Le fichier n'existe pas: ${options.filePath}`);
    }

    // Lire le contenu du fichier
    const content = await fs.readFile(options.filePath, 'utf-8');
    const stats = await fs.stat(options.filePath);
    
    // Analyse basique du fichier
    const lineCount = content.split('\n').length;
    const fileName = path.basename(options.filePath);
    
    // Analyse des classes, méthodes et fonctions
    const classMatches = [...content.matchAll(/class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g)];
    const functionMatches = [...content.matchAll(/function\s+(\w+)\s*\(([^)]*)\)/g)];
    const methodMatches = [...content.matchAll(/(?:public|private|protected)\s+function\s+(\w+)\s*\(([^)]*)\)/g)];
    
    // Analyser la complexité si demandé
    let complexity = {
      methodCount: methodMatches.length,
      functionCount: functionMatches.length,
      classCount: classMatches.length,
    };
    
    if (options.analyzeComplexity) {
      try {
        // Utiliser un outil externe comme PHPMD pour analyser la complexité
        const { stdout } = await execAsync(`phpmd "${options.filePath}" json codesize`);
        const phpmdResult = JSON.parse(stdout);
        
        // Extraire la complexité cyclomatique
        if (phpmdResult.files && phpmdResult.files.length > 0) {
          const complexityViolations = phpmdResult.files[0].violations.filter(
            (v: any) => v.rule === 'CyclomaticComplexity'
          );
          
          if (complexityViolations.length > 0) {
            complexity.cyclomaticComplexity = parseInt(complexityViolations[0].value, 10);
          }
        }
      } catch (error) {
        console.warn('Impossible d\'analyser la complexité avec PHPMD:', error);
      }
    }
    
    // Recueillir les informations sur les classes
    const classInfo = classMatches.map(match => {
      const className = match[1];
      const classRegex = new RegExp(`class\\s+${className}[^{]*{([\\s\\S]*?)}`, 'g');
      const classBodyMatch = classRegex.exec(content);
      const classBody = classBodyMatch ? classBodyMatch[1] : '';
      
      // Extraire les propriétés
      const propertyMatches = [...classBody.matchAll(/(?:public|private|protected)\s+(?:\$(\w+))/g)];
      const properties = propertyMatches.map(propMatch => {
        return {
          name: propMatch[1],
          visibility: propMatch[0].includes('public') 
            ? 'public' 
            : propMatch[0].includes('private') 
              ? 'private' 
              : 'protected',
        };
      });
      
      // Extraire les méthodes
      const methodRegex = /(?:public|private|protected)\s+function\s+(\w+)\s*\(([^)]*)\)/g;
      const methodsInClass = [...classBody.matchAll(methodRegex)];
      
      const methods = methodsInClass.map(methodMatch => {
        return {
          name: methodMatch[1],
          visibility: methodMatch[0].includes('public') 
            ? 'public' 
            : methodMatch[0].includes('private') 
              ? 'private' 
              : 'protected',
          parameters: methodMatch[2].split(',').map(param => param.trim())
        };
      });
      
      return {
        name: className,
        methods,
        properties
      };
    });
    
    // Détecter les dépendances (require, include, etc.)
    const dependencyMatches = [
      ...content.matchAll(/(?:require|include|require_once|include_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)
    ];
    
    const dependencies = dependencyMatches.map(match => match[1]);
    
    // Analyse des erreurs et avertissements potentiels
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier la syntaxe PHP
    try {
      await execAsync(`php -l "${options.filePath}"`);
    } catch (error: any) {
      errors.push(`Erreur de syntaxe PHP: ${error.stderr}`);
    }
    
    // Générer des suggestions de migration
    const suggestions: string[] = [];
    
    if (content.includes('mysql_')) {
      suggestions.push('Les fonctions mysql_* sont obsolètes. Utiliser PDO ou mysqli.');
    }
    
    if (!content.includes('namespace') && !fileName.startsWith('index')) {
      suggestions.push('Ajouter un namespace pour faciliter la migration vers NestJS.');
    }
    
    // Vérifier la version PHP utilisée
    let phpVersion: string | undefined;
    if (content.includes('<?php')) {
      if (content.includes('readonly') || content.includes('enum')) {
        phpVersion = '8.x';
      } else if (content.includes('fn') || content.includes('?->')) {
        phpVersion = '7.4+';
      } else if (content.includes('??') || content.includes('...')) {
        phpVersion = '7.0+';
      } else {
        phpVersion = '5.x';
      }
    }
    
    // Générer l'équivalent NestJS si demandé
    let nestJsEquivalent: string | undefined;
    if (options.generateNestJSCode && classInfo.length > 0) {
      nestJsEquivalent = generateNestJSEquivalent(classInfo[0], options.filePath);
    }
    
    // Construire le résultat final
    const result: PhpAnalysisResult = {
      fileInfo: {
        name: fileName,
        path: options.filePath,
        size: stats.size,
        lineCount,
        module: options.moduleName,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
      complexity,
      dependencies,
      phpVersion,
      classInfo,
      errors,
      warnings,
      suggestions,
      nestJsEquivalent,
    };
    
    // Si reportToMcp est activé, on enregistre le résultat dans Supabase
    if (options.reportToMcp) {
      const duration = Date.now() - startTime;
      
      // Enregistrer l'analyse dans audit_logs
      await supabase.from('audit_logs').insert({
        file_name: options.filePath,
        module: options.moduleName || path.dirname(options.filePath).split(path.sep).pop(),
        agent: 'php-analyzer',
        status: errors.length > 0 ? 'error' : 'done',
        audit_json: result,
        duration_ms: duration,
        error_message: errors.length > 0 ? errors.join(', ') : null,
      });
      
      // Mettre à jour file_mappings si nécessaire
      const { data: existingMapping } = await supabase
        .from('file_mappings')
        .select('id, status')
        .eq('file_path', options.filePath)
        .single();
      
      if (existingMapping) {
        await supabase
          .from('file_mappings')
          .update({
            status: errors.length > 0 ? 'error' : 'analyzed',
            updated_at: new Date().toISOString(),
            complexity: complexity.cyclomaticComplexity || complexity.methodCount + complexity.functionCount,
            lines_of_code: lineCount,
          })
          .eq('id', existingMapping.id);
      } else {
        // Créer un nouveau mapping si le fichier n'est pas encore dans la base
        await supabase
          .from('file_mappings')
          .insert({
            file_path: options.filePath,
            php_file: options.filePath,
            status: errors.length > 0 ? 'error' : 'analyzed',
            module: options.moduleName || path.dirname(options.filePath).split(path.sep).pop(),
            category: detectFileCategory(options.filePath, content),
            complexity: complexity.cyclomaticComplexity || complexity.methodCount + complexity.functionCount,
            lines_of_code: lineCount,
          });
      }
      
      // Si un eventId a été créé, mettre à jour son statut
      if (eventId) {
        await updateMcpEventStatus(
          eventId, 
          errors.length > 0 ? 'failed' : 'completed',
          errors.length > 0 ? errors.join(', ') : undefined
        );
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse du fichier PHP:', error);
    
    // Si un eventId a été créé, mettre à jour son statut en échec
    if (eventId) {
      await updateMcpEventStatus(eventId, 'failed', error.message);
    }
    
    // Enregistrer l'erreur dans audit_logs si reportToMcp est activé
    if (options.reportToMcp) {
      await supabase.from('audit_logs').insert({
        file_name: options.filePath,
        module: options.moduleName || path.dirname(options.filePath).split(path.sep).pop(),
        agent: 'php-analyzer',
        status: 'error',
        error_message: error.message,
        duration_ms: Date.now() - startTime,
      });
    }
    
    throw error;
  }
}

/**
 * Génère une équivalence NestJS pour une classe PHP
 */
function generateNestJSEquivalent(
  classInfo: PhpAnalysisResult['classInfo'][0], 
  filePath: string
): string {
  const className = classInfo.name;
  const fileName = path.basename(filePath, '.php');
  const isController = fileName.toLowerCase().includes('controller');
  const isService = fileName.toLowerCase().includes('service') || fileName.toLowerCase().includes('manager');
  const isEntity = fileName.toLowerCase().includes('model') || fileName.toLowerCase().includes('entity');

  // Préparer les importations
  let imports = `import { ${isController ? 'Controller, ' : ''}${isService ? 'Injectable, ' : ''}${isEntity ? 'Entity, ' : ''}`;
  imports += 'Get, Post, Body, Param, Delete, Put } from \'@nestjs/common\';\n';
  
  if (isEntity) {
    imports += 'import { Column, PrimaryGeneratedColumn } from \'typeorm\';\n';
  }
  
  // Générer les décorateurs de classe
  const classDecorator = isController 
    ? `@Controller('${fileName.replace('Controller', '').toLowerCase()}')`
    : isService 
      ? '@Injectable()' 
      : isEntity 
        ? '@Entity()' 
        : '';
  
  // Générer les propriétés
  const properties = classInfo.properties.map(prop => {
    const decorator = isEntity 
      ? prop.name.toLowerCase().includes('id') 
        ? '@PrimaryGeneratedColumn()' 
        : '@Column()' 
      : '';
    
    return `${decorator ? decorator + '\n  ' : ''}${prop.visibility} ${prop.name}: any; // TODO: définir le type approprié`;
  }).join('\n\n  ');
  
  // Générer les méthodes
  const methods = classInfo.methods.map(method => {
    let decorator = '';
    
    if (isController) {
      if (method.name.startsWith('get')) {
        decorator = '@Get()';
      } else if (method.name.startsWith('create') || method.name.startsWith('add')) {
        decorator = '@Post()';
      } else if (method.name.startsWith('update')) {
        decorator = '@Put()';
      } else if (method.name.startsWith('delete') || method.name.startsWith('remove')) {
        decorator = '@Delete()';
      }
    }
    
    const params = method.parameters.map(param => {
      if (param.includes('$id')) {
        return '@Param(\'id\') id: string';
      } else if (param.startsWith('$')) {
        const paramName = param.substring(1);
        return `@Body() ${paramName}: any`;
      }
      return param.replace('$', '');
    }).join(', ');
    
    return `${decorator ? decorator + '\n  ' : ''}${method.visibility} async ${method.name}(${params}): Promise<any> {\n    // TODO: implémenter la logique\n    return {};\n  }`;
  }).join('\n\n  ');
  
  // Assembler le code NestJS
  return `${imports}
${classDecorator}
export class ${className} {
  ${properties ? properties + '\n\n  ' : ''}${methods}
}
`;
}

/**
 * Détecte la catégorie d'un fichier PHP en fonction de son nom et de son contenu
 */
function detectFileCategory(filePath: string, content: string): string {
  const fileName = path.basename(filePath).toLowerCase();
  
  if (fileName.includes('controller')) {
    return 'controller';
  } else if (fileName.includes('model') || fileName.includes('entity') || content.includes('extends Model')) {
    return 'model';
  } else if (fileName.includes('view') || fileName.includes('template') || content.includes('<?php include')) {
    return 'view';
  } else if (fileName.includes('helper') || fileName.includes('util')) {
    return 'helper';
  } else if (fileName.includes('api') || content.includes('header(\'Content-Type: application/json\')')) {
    return 'api';
  } else {
    return 'other';
  }
}

// Point d'entrée pour exécuter l'outil en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node php-analyzer.js <filePath> [moduleName] [--complexity] [--nestjs] [--report]');
    process.exit(1);
  }
  
  const filePath = args[0];
  const moduleName = args.length > 1 && !args[1].startsWith('--') ? args[1] : undefined;
  const analyzeComplexity = args.includes('--complexity');
  const generateNestJSCode = args.includes('--nestjs');
  const reportToMcp = args.includes('--report');
  
  analyzePhpFile({
    filePath,
    moduleName,
    analyzeComplexity,
    generateNestJSCode,
    reportToMcp
  })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}