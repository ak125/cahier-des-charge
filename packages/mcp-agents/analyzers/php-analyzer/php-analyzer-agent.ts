import { AbstractAnalyzerAgent } from '../abstract-analyzer';
/**
 * Agent d'analyse PHP
 * Analyse le code PHP pour extraire des informations utiles pour la migration
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { 
  BaseMcpAgent, 
  AgentMetadata, 
  AgentContext, 
  AgentResult,
  AgentConfig 
} from '../../core/base-agent';
import { McpLogger } from '../../core/logging/logger';

const execFileAsync = promisify(execFile);

// Types spécifiques pour l'agent d'analyse PHP
export interface PhpAnalyzerConfig extends AgentConfig {
  analysisDepth: 'basic' | 'deep';
  includeDependencies: boolean;
  maxFilesToProcess: number;
  ignorePatterns: string[];
  customRules?: string[];
  extractorPath?: string;
}

export interface PhpEntityInfo {
  name: string;
  type: 'class' | 'interface' | 'trait' | 'function';
  file: string;
  startLine: number;
  endLine: number;
  namespace: string;
  dependencies: string[];
  methods?: {
    name: string;
    startLine: number;
    endLine: number;
    visibility?: string;
    static: boolean;
    parameters: Array<{
      name: string;
      type?: string;
      default?: string;
    }>;
    returnType?: string;
  }[];
  properties?: Array<{
    name: string;
    type?: string;
    visibility?: string;
    static: boolean;
    default?: string;
  }>;
}

export interface PhpFileAnalysis {
  path: string;
  entities: PhpEntityInfo[];
  dependencies: string[];
  complexity: number;
  loc: number;
  docblockCoverage: number;
  issues: Array<{
    type: string;
    message: string;
    line: number;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export interface PhpAnalysisResult {
  files: PhpFileAnalysis[];
  summary: {
    totalFiles: number;
    totalEntities: number;
    avgComplexity: number;
    totalLoc: number;
    avgDocblockCoverage: number;
    dependencyGraph: Record<string, string[]>;
    issuesByType: Record<string, number>;
    severityCounts: {
      info: number;
      warning: number;
      error: number;
    };
  };
}

/**
 * Agent d'analyse de code PHP pour la migration
 */
export class PhpAnalyzerAgent extends AbstractAnalyzerAgent<any, any> extends BaseMcpAgent<PhpAnalysisResult, PhpAnalyzerConfig> {
  readonly metadata: AgentMetadata = {
    id: 'php-analyzer',
    type: 'analyzer',
    name: 'PHP Code Analyzer',
    version: '1.0.0',
    description: 'Analyse le code PHP pour faciliter la migration vers Remix',
    author: 'MCP Team',
    tags: ['php', 'analysis', 'migration']
  };
  
  private logger: McpLogger;
  
  constructor(config: Partial<PhpAnalyzerConfig> = {}) {
    // Configuration par défaut
    const defaultConfig: PhpAnalyzerConfig = {
      analysisDepth: 'deep',
      includeDependencies: true,
      maxFilesToProcess: 1000,
      ignorePatterns: ['vendor/**', 'node_modules/**', 'tests/**'],
      logLevel: 'info',
      maxRetries: 2,
      timeout: 300000, // 5 minutes
      concurrency: 1,
      customRules: []
    };
    
    super({...defaultConfig, ...config});
    
    this.logger = new McpLogger({
      serviceName: this.metadata.id,
      logLevel: this.config.logLevel
    });
  }
  
  protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    await this.logger.initialize();
    await super.initialize();
    
    // Vérifier si les outils nécessaires sont disponibles
    try {
      await this.checkDependencies();
    } catch (error) {
      this.log('error', `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  async execute(context: AgentContext): Promise<AgentResult<PhpAnalysisResult>> {
    return this.executeWithMetrics(context, async () => {
      // Valider le contexte
      if (!(await this.validate(context))) {
        return {
          success: false,
          error: 'Contexte d\'exécution invalide'
        };
      }
      
      try {
        const { sourceFiles = [], workspaceRoot = process.cwd() } = context;
        
        // Collecter les fichiers à analyser s'ils ne sont pas spécifiés
        const filesToAnalyze = sourceFiles.length > 0
          ? sourceFiles
          : await this.collectPhpFiles(workspaceRoot);
        
        // Limiter le nombre de fichiers
        const limitedFiles = filesToAnalyze.slice(0, this.config.maxFilesToProcess);
        if (limitedFiles.length < filesToAnalyze.length) {
          this.log('warn', `Limitation à ${this.config.maxFilesToProcess} fichiers sur ${filesToAnalyze.length} trouvés`);
        }
        
        this.log('info', `Analyse de ${limitedFiles.length} fichiers PHP`);
        this.emitProgress(10, `Démarrage de l'analyse sur ${limitedFiles.length} fichiers`);
        
        // Analyser les fichiers
        const fileAnalyses: PhpFileAnalysis[] = [];
        let processedCount = 0;
        
        for (const filePath of limitedFiles) {
          try {
            const fileAnalysis = await this.analyzePhpFile(filePath);
            fileAnalyses.push(fileAnalysis);
            
            processedCount++;
            const progressPercent = 10 + Math.round((processedCount / limitedFiles.length) * 80);
            this.emitProgress(progressPercent, `Analysé ${processedCount}/${limitedFiles.length} fichiers`);
          } catch (error) {
            this.log('error', `Erreur lors de l'analyse du fichier ${filePath}`, error);
          }
        }
        
        // Générer le résumé global
        this.log('info', 'Génération du résumé de l\'analyse');
        this.emitProgress(90, 'Génération du résumé');
        
        const summary = this.generateSummary(fileAnalyses);
        
        this.emitProgress(100, 'Analyse PHP terminée');
        
        return {
          success: true,
          data: {
            files: fileAnalyses,
            summary
          }
        };
      } catch (error) {
        this.log('error', 'Erreur lors de l\'analyse PHP', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
  }
  
  protected async validateAgentContext(context: AgentContext): Promise<boolean> {
    // Vérifier si le workspace existe
    if (context.workspaceRoot) {
      try {
        await fs.access(context.workspaceRoot);
      } catch (error) {
        this.log('error', `Le répertoire de travail '${context.workspaceRoot}' n'existe pas`);
        return false;
      }
    }
    
    // Vérifier si les fichiers source spécifiés existent
    if (context.sourceFiles && context.sourceFiles.length > 0) {
      for (const file of context.sourceFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          this.log('error', `Le fichier source '${file}' n'existe pas`);
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Vérifie si les dépendances nécessaires sont installées
   */
  private async checkDependencies(): Promise<void> {
    try {
      // Vérifier si PHP est disponible
      await execFileAsync('php', ['-v']);
      
      // Vérifier le chemin de l'extracteur
      if (this.config.extractorPath) {
        await fs.access(this.config.extractorPath);
      }
      
      this.log('debug', 'Toutes les dépendances sont correctement configurées');
    } catch (error) {
      throw new Error(`Certaines dépendances sont manquantes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Collecte récursivement tous les fichiers PHP dans un répertoire
   */
  private async collectPhpFiles(rootDir: string): Promise<string[]> {
    const phpFiles: string[] = [];
    
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.php')) {
          phpFiles.push(fullPath);
        }
      }
    }
    
    await scan(rootDir);
    return phpFiles;
  }
  
  /**
   * Analyse un fichier PHP et extrait les informations
   */
  private async analyzePhpFile(filePath: string): Promise<PhpFileAnalysis> {
    this.log('debug', `Analyse du fichier ${filePath}`);
    
    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Analyse basique des métriques
    const loc = lines.length;
    const docblockCount = content.match(/\/\*\*[\s\S]*?\*\//g)?.length || 0;
    const docblockCoverage = Math.min(100, (docblockCount / Math.max(1, this.countEntities(content))) * 100);
    
    // Analyse plus approfondie avec PHP si nécessaire
    let entities: PhpEntityInfo[] = [];
    let dependencies: string[] = [];
    let issues: Array<{
      type: string;
      message: string;
      line: number;
      severity: 'info' | 'warning' | 'error';
    }> = [];
    let complexity = this.estimateComplexity(content);
    
    if (this.config.analysisDepth === 'deep') {
      try {
        // Utiliser un outil externe ou un script PHP pour l'analyse approfondie
        const result = await this.runDeepAnalysis(filePath);
        entities = result.entities;
        dependencies = result.dependencies;
        issues = result.issues;
      } catch (error) {
        this.log('warn', `Erreur lors de l'analyse approfondie de ${filePath}`, error);
        // En cas d'erreur, utiliser l'analyse basique
        entities = this.extractBasicEntities(content);
        dependencies = this.extractDependencies(content);
        issues = [];
      }
    } else {
      // Analyse basique
      entities = this.extractBasicEntities(content);
      dependencies = this.extractDependencies(content);
    }
    
    return {
      path: filePath,
      entities,
      dependencies,
      complexity,
      loc,
      docblockCoverage,
      issues
    };
  }
  
  /**
   * Compte le nombre d'entités (classes, fonctions, etc.) dans le code
   */
  private countEntities(content: string): number {
    const classMatch = content.match(/\bclass\s+\w+/g);
    const interfaceMatch = content.match(/\binterface\s+\w+/g);
    const traitMatch = content.match(/\btrait\s+\w+/g);
    const functionMatch = content.match(/\bfunction\s+\w+/g);
    
    return (classMatch?.length || 0) + 
           (interfaceMatch?.length || 0) + 
           (traitMatch?.length || 0) + 
           (functionMatch?.length || 0);
  }
  
  /**
   * Estime la complexité cyclomatique du code
   */
  private estimateComplexity(content: string): number {
    // Compter les structures de contrôle comme indicateur de complexité
    const ifCount = (content.match(/\bif\s*\(/g) || []).length;
    const elseCount = (content.match(/\belse\b/g) || []).length;
    const forCount = (content.match(/\bfor\s*\(/g) || []).length;
    const foreachCount = (content.match(/\bforeach\s*\(/g) || []).length;
    const whileCount = (content.match(/\bwhile\s*\(/g) || []).length;
    const switchCount = (content.match(/\bswitch\s*\(/g) || []).length;
    const caseCount = (content.match(/\bcase\s+/g) || []).length;
    const tryCount = (content.match(/\btry\s*\{/g) || []).length;
    const catchCount = (content.match(/\bcatch\s*\(/g) || []).length;
    
    // Base de 1 + somme pondérée des structures de contrôle
    return 1 + ifCount + elseCount + forCount * 2 + foreachCount * 2 + 
           whileCount * 2 + switchCount + caseCount * 0.5 + tryCount + catchCount;
  }
  
  /**
   * Extrait les dépendances de base (imports, requires, etc.)
   */
  private extractDependencies(content: string): string[] {
    const dependencies: Set<string> = new Set();
    
    // Rechercher les include/require
    const includeRegex = /\b(?:include|include_once|require|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // Rechercher les use statements (imports de namespace)
    const useRegex = /\buse\s+([^;]+);/g;
    while ((match = useRegex.exec(content)) !== null) {
      dependencies.add(match[1].trim());
    }
    
    return Array.from(dependencies);
  }
  
  /**
   * Extrait les entités de base (analyse syntaxique simple)
   */
  private extractBasicEntities(content: string): PhpEntityInfo[] {
    const entities: PhpEntityInfo[] = [];
    const lines = content.split('\n');
    
    // Rechercher les classes, interfaces et traits
    const classRegex = /\b(class|interface|trait)\s+(\w+)/g;
    const namespaceRegex = /namespace\s+([^;]+);/;
    
    // Extraire le namespace
    const namespaceMatch = content.match(namespaceRegex);
    const namespace = namespaceMatch ? namespaceMatch[1].trim() : '';
    
    // Trouver les classes, interfaces et traits
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const type = match[1] as 'class' | 'interface' | 'trait';
      const name = match[2];
      const startLine = this.getLineNumber(content, match.index);
      
      entities.push({
        name,
        type,
        file: 'placeholder', // Sera remplacé plus tard
        startLine,
        endLine: -1, // Difficile à déterminer sans analyse syntaxique complète
        namespace,
        dependencies: [],
        methods: [],
        properties: []
      });
    }
    
    // Rechercher les fonctions globales
    const functionRegex = /function\s+(\w+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1];
      const startLine = this.getLineNumber(content, match.index);
      
      // Vérifier si cette fonction n'est pas une méthode de classe
      const isMethod = entities.some(entity => {
        return content.lastIndexOf('class', match.index) > content.lastIndexOf('}', match.index);
      });
      
      if (!isMethod) {
        entities.push({
          name,
          type: 'function',
          file: 'placeholder', // Sera remplacé plus tard
          startLine,
          endLine: -1, // Difficile à déterminer sans analyse syntaxique complète
          namespace,
          dependencies: []
        });
      }
    }
    
    return entities;
  }
  
  /**
   * Détermine le numéro de ligne à partir d'un index dans la chaîne
   */
  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
  
  /**
   * Exécute une analyse PHP approfondie via un script externe
   */
  private async runDeepAnalysis(filePath: string): Promise<{
    entities: PhpEntityInfo[];
    dependencies: string[];
    issues: Array<{
      type: string;
      message: string;
      line: number;
      severity: 'info' | 'warning' | 'error';
    }>;
  }> {
    // Utiliser soit un extracteur externe spécifié, soit un script intégré
    const extractorPath = this.config.extractorPath || path.join(__dirname, 'extractor.php');
    
    try {
      const { stdout } = await execFileAsync('php', [extractorPath, filePath]);
      const result = JSON.parse(stdout);
      
      return result;
    } catch (error) {
      // Si le script échoue, on utilise des résultats par défaut
      this.log('warn', `Erreur lors de l'exécution de l'analyse PHP approfondie: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        entities: [],
        dependencies: [],
        issues: [{
          type: 'analysis_error',
          message: 'Erreur lors de l\'analyse approfondie',
          line: 1,
          severity: 'warning'
        }]
      };
    }
  }
  
  /**
   * Génère un résumé des analyses de tous les fichiers
   */
  private generateSummary(fileAnalyses: PhpFileAnalysis[]): PhpAnalysisResult['summary'] {
    const totalEntities = fileAnalyses.reduce((sum, file) => sum + file.entities.length, 0);
    const totalFiles = fileAnalyses.length;
    const totalLoc = fileAnalyses.reduce((sum, file) => sum + file.loc, 0);
    const avgComplexity = fileAnalyses.reduce((sum, file) => sum + file.complexity, 0) / Math.max(1, totalFiles);
    const avgDocblockCoverage = fileAnalyses.reduce((sum, file) => sum + file.docblockCoverage, 0) / Math.max(1, totalFiles);
    
    // Construire le graphe de dépendances
    const dependencyGraph: Record<string, string[]> = {};
    fileAnalyses.forEach(file => {
      const filename = path.basename(file.path);
      dependencyGraph[filename] = file.dependencies;
    });
    
    // Compter les types de problèmes
    const issuesByType: Record<string, number> = {};
    const severityCounts = { info: 0, warning: 0, error: 0 };
    
    fileAnalyses.forEach(file => {
      file.issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        severityCounts[issue.severity]++;
      });
    });
    
    return {
      totalFiles,
      totalEntities,
      avgComplexity,
      totalLoc,
      avgDocblockCoverage,
      dependencyGraph,
      issuesByType,
      severityCounts
    };
  }
}