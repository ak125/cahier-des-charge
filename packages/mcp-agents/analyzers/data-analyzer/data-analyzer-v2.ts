import { AbstractAnalyzerAgent } from '../abstract-analyzer';
import { AnalysisResult, AnalyzerFinding, AnalysisStats } from '../../core/interfaces/analyzer-agent';
import * as fs from 'fs';

/**
 * Interface pour les données d'entrée de l'analyseur de données
 */
interface DataAnalyzerInput {
  filePath: string;         // Chemin du fichier PHP à analyser
  fileContent?: string;     // Contenu du fichier PHP (optionnel, lecture du fichier si non fourni)
  options?: {
    analyzeInputs?: boolean;      // Analyser les entrées utilisateur
    analyzeQueries?: boolean;     // Analyser les requêtes SQL
    analyzeOutputs?: boolean;     // Analyser les sorties
    [key: string]: any;
  };
}

/**
 * Interface pour les résultats de l'analyse de données
 */
interface DataAnalysisResult {
  userInputs: {
    get: string[];
    post: string[];
    request: string[];
    session: string[];
    cookie: string[];
  };
  sqlQueries: {
    raw: string[];
    tables: string[];
    columns: string[];
    queryType: 'PDO' | 'mysqli' | 'legacy' | 'none';
    hasJoins: boolean;
    hasWhere: boolean;
    hasSubqueries: boolean;
  };
  outputs: {
    echoCount: number;
    printCount: number;
    generatesJson: boolean;
    templates: string[];
    hasRedirects: boolean;
  };
}

/**
 * Agent d'analyse de données PHP
 * 
 * Cet agent analyse les entrées utilisateur, les requêtes SQL et les sorties
 * dans un fichier PHP pour aider à la migration.
 */
export class DataAnalyzerAgent extends AbstractAnalyzerAgent<DataAnalyzerInput, DataAnalysisResult> {
  public id = 'data-analyzer';
  public name = 'Data Analyzer';
  public description = 'Analyse les données, SQL et entrées/sorties du code PHP';
  public version = '2.0.0';

  // État interne
  private filePath: string = '';
  private fileContent: string = '';
  private processedFiles: number = 0;
  private issuesByType: Record<string, number> = {};
  private processingTimes: number[] = [];

  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Réinitialiser l'état
    this.processedFiles = 0;
    this.issuesByType = {};
    this.processingTimes = [];
  }

  /**
   * Valide les données d'entrée
   */
  public async validateInput(input: DataAnalyzerInput): Promise<boolean> {
    if (!input || !input.filePath) {
      console.error('Un chemin de fichier est requis');
      return false;
    }

    // Si le contenu du fichier est fourni, pas besoin de vérifier l'existence du fichier
    if (input.fileContent) {
      return true;
    }

    // Vérifier l'existence du fichier
    try {
      if (!fs.existsSync(input.filePath)) {
        console.error(`Le fichier ${input.filePath} n'existe pas`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors de la validation du fichier: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Analyse les données d'un fichier PHP
   */
  public async analyze(input: DataAnalyzerInput, context?: any): Promise<AnalysisResult<DataAnalysisResult>> {
    const startTime = Date.now();
    try {
      // Extraire les paramètres d'entrée
      this.filePath = input.filePath;
      
      // Lire le contenu du fichier si non fourni
      if (input.fileContent) {
        this.fileContent = input.fileContent;
      } else {
        try {
          if (!fs.existsSync(this.filePath)) {
            return {
              success: false,
              findings: [{
                id: 'file-not-found',
                type: 'error',
                severity: 'critical',
                message: `Le fichier ${this.filePath} n'existe pas.`
              }],
              timestamp: new Date()
            };
          }
          this.fileContent = fs.readFileSync(this.filePath, 'utf8');
        } catch (err) {
          const error = err as Error;
          return {
            success: false,
            findings: [{
              id: 'file-read-error',
              type: 'error',
              severity: 'critical',
              message: `Impossible de lire le fichier: ${error.message}`
            }],
            timestamp: new Date()
          };
        }
      }

      // Configurer les options d'analyse
      const options = input.options || {
        analyzeInputs: true,
        analyzeQueries: true,
        analyzeOutputs: true
      };

      // Préparer le résultat
      const result: DataAnalysisResult = {
        userInputs: {
          get: [],
          post: [],
          request: [],
          session: [],
          cookie: []
        },
        sqlQueries: {
          raw: [],
          tables: [],
          columns: [],
          queryType: 'none',
          hasJoins: false,
          hasWhere: false,
          hasSubqueries: false
        },
        outputs: {
          echoCount: 0,
          printCount: 0,
          generatesJson: false,
          templates: [],
          hasRedirects: false
        }
      };
      
      // Collecter les découvertes (findings)
      const findings: AnalyzerFinding[] = [];
      
      // Effectuer les analyses selon les options
      if (options.analyzeInputs !== false) {
        const userInputs = this.analyzeUserInputs();
        result.userInputs = userInputs;
        
        // Ajouter des découvertes sur les entrées utilisateur
        this.addInputFindings(userInputs, findings);
      }
      
      if (options.analyzeQueries !== false) {
        const sqlQueries = this.analyzeSqlQueries();
        result.sqlQueries = sqlQueries;
        
        // Ajouter des découvertes sur les requêtes SQL
        this.addSqlFindings(sqlQueries, findings);
      }
      
      if (options.analyzeOutputs !== false) {
        const outputs = this.analyzeOutputs();
        result.outputs = outputs;
        
        // Ajouter des découvertes sur les sorties
        this.addOutputFindings(outputs, findings);
      }

      // Mettre à jour les statistiques
      this.processedFiles++;
      this.processingTimes.push(Date.now() - startTime);

      // Mettre à jour les statistiques par type de problème
      findings.forEach(finding => {
        this.issuesByType[finding.type] = (this.issuesByType[finding.type] || 0) + 1;
      });
      
      return {
        success: true,
        data: result,
        findings,
        timestamp: new Date()
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        findings: [{
          id: 'analysis-error',
          type: 'error',
          severity: 'critical',
          message: `Erreur lors de l'analyse: ${error.message}`
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Récupère les règles d'analyse disponibles
   */
  public async getAvailableRules(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    severity: string;
  }>> {
    return [
      {
        id: 'user-input',
        name: 'Entrées Utilisateur',
        description: 'Détecte les variables d\'entrée utilisateur (GET, POST, REQUEST, etc.)',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'security-concern',
        name: 'Problèmes de Sécurité',
        description: 'Détecte les entrées utilisateur non validées ou non assainies',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'database-usage',
        name: 'Utilisation de Base de Données',
        description: 'Détecte les requêtes SQL et les tables utilisées',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'security-vulnerability',
        name: 'Vulnérabilités de Sécurité',
        description: 'Détecte les fonctions SQL obsolètes et non sécurisées',
        isEnabled: true,
        severity: 'high'
      },
      {
        id: 'migration-complexity',
        name: 'Complexité de Migration',
        description: 'Évalue la complexité des requêtes SQL pour la migration',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'output-generation',
        name: 'Génération de Sorties',
        description: 'Détecte les mécanismes de génération de contenu (echo, print, etc.)',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'migration-task',
        name: 'Tâches de Migration',
        description: 'Identifie les tâches spécifiques à accomplir pour la migration',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'migration-opportunity',
        name: 'Opportunités de Migration',
        description: 'Identifie les opportunités d\'amélioration lors de la migration',
        isEnabled: true,
        severity: 'low'
      }
    ];
  }

  /**
   * Récupère les statistiques d'analyse
   */
  public async getAnalysisStats(): Promise<{
    processed: number;
    issuesByType: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const avgTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length 
      : 0;
    
    return {
      processed: this.processedFiles,
      issuesByType: this.issuesByType,
      averageProcessingTime: avgTime
    };
  }
  
  /**
   * Ajoute des découvertes concernant les entrées utilisateur
   */
  private addInputFindings(userInputs: DataAnalysisResult['userInputs'], findings: AnalyzerFinding[]): void {
    // Vérifier si des entrées utilisateur sont présentes
    const allInputs = [
      ...userInputs.get, 
      ...userInputs.post, 
      ...userInputs.request, 
      ...userInputs.session, 
      ...userInputs.cookie
    ];
    
    if (allInputs.length > 0) {
      findings.push({
        id: 'user-inputs',
        type: 'user-input',
        severity: 'info',
        message: `Détecté ${allInputs.length} entrées utilisateur`,
        metadata: { userInputs }
      });
      
      // Ajouter une découverte pour les entrées non sécurisées
      if (userInputs.get.length > 0 || userInputs.post.length > 0 || userInputs.request.length > 0) {
        findings.push({
          id: 'unsanitized-inputs',
          type: 'security-concern',
          severity: 'medium',
          message: 'Les entrées utilisateur doivent être validées et assainies',
          suggestedFix: 'Utiliser les filtres de validation et les décorateurs NestJS pour les entrées'
        });
      }
    }
  }
  
  /**
   * Ajoute des découvertes concernant les requêtes SQL
   */
  private addSqlFindings(sqlQueries: DataAnalysisResult['sqlQueries'], findings: AnalyzerFinding[]): void {
    if (sqlQueries.raw.length > 0) {
      findings.push({
        id: 'sql-queries',
        type: 'database-usage',
        severity: 'info',
        message: `Détecté ${sqlQueries.raw.length} requêtes SQL utilisant ${sqlQueries.tables.length} tables`,
        metadata: { 
          tables: sqlQueries.tables, 
          columns: sqlQueries.columns,
          queryType: sqlQueries.queryType
        }
      });
      
      // Ajouter une découverte pour les requêtes SQL legacy
      if (sqlQueries.queryType === 'legacy') {
        findings.push({
          id: 'legacy-sql',
          type: 'security-vulnerability',
          severity: 'high',
          message: 'Utilisation de fonctions SQL obsolètes et non sécurisées',
          suggestedFix: 'Migrer vers Prisma ou TypeORM dans NestJS'
        });
      }
      
      // Ajouter une découverte pour les requêtes SQL complexes
      if (sqlQueries.hasJoins || sqlQueries.hasSubqueries) {
        findings.push({
          id: 'complex-sql',
          type: 'migration-complexity',
          severity: 'medium',
          message: 'Requêtes SQL complexes détectées',
          suggestedFix: 'Utiliser des relations Prisma ou TypeORM dans NestJS'
        });
      }
    }
  }
  
  /**
   * Ajoute des découvertes concernant les sorties
   */
  private addOutputFindings(outputs: DataAnalysisResult['outputs'], findings: AnalyzerFinding[]): void {
    // Ajouter une découverte pour les sorties
    const hasOutputs = outputs.echoCount > 0 || outputs.printCount > 0 || outputs.generatesJson || outputs.templates.length > 0;
    
    if (hasOutputs) {
      findings.push({
        id: 'php-outputs',
        type: 'output-generation',
        severity: 'info',
        message: `Génération de contenu: ${outputs.echoCount} echo, ${outputs.templates.length} templates`,
        metadata: { outputs }
      });
      
      // Ajouter une découverte pour les templates à migrer
      if (outputs.templates.length > 0) {
        findings.push({
          id: 'php-templates',
          type: 'migration-task',
          severity: 'medium',
          message: `${outputs.templates.length} templates PHP à migrer vers Remix`,
          suggestedFix: 'Convertir les templates PHP en composants React'
        });
      }
      
      // Ajouter une découverte pour les sorties JSON
      if (outputs.generatesJson) {
        findings.push({
          id: 'json-output',
          type: 'migration-opportunity',
          severity: 'low',
          message: 'Génération de JSON détectée, adapté pour une API REST',
          suggestedFix: 'Convertir en contrôleur NestJS avec @Get/@Post'
        });
      }
    }
  }

  /**
   * Analyse les entrées utilisateur dans le fichier PHP
   */
  private analyzeUserInputs(): DataAnalysisResult['userInputs'] {
    return {
      get: this.extractSuperglobalVariables(this.fileContent, '$_GET'),
      post: this.extractSuperglobalVariables(this.fileContent, '$_POST'),
      request: this.extractSuperglobalVariables(this.fileContent, '$_REQUEST'),
      session: this.extractSuperglobalVariables(this.fileContent, '$_SESSION'),
      cookie: this.extractSuperglobalVariables(this.fileContent, '$_COOKIE')
    };
  }

  /**
   * Extrait les variables d'une superglobale spécifique
   */
  private extractSuperglobalVariables(content: string, superglobal: string): string[] {
    const regex = new RegExp(`${superglobal.replace('$', '\\$')}\\[['"]([\\w_]+)['"]\\]`, 'g');
    const matches = content.match(regex);
    
    if (!matches) return [];
    
    const variables = matches.map(match => {
      const varNameMatch = match.match(/\[['"](\w+)['"]\]/);
      return varNameMatch ? varNameMatch[1] : '';
    }).filter(Boolean);
    
    // Éliminer les doublons
    return [...new Set(variables)];
  }

  /**
   * Analyse les requêtes SQL dans le fichier PHP
   */
  private analyzeSqlQueries(): DataAnalysisResult['sqlQueries'] {
    // Extraire les requêtes SQL
    const rawQueries = this.extractSqlQueries(this.fileContent);
    
    // Déterminer le type de requête
    let queryType: 'PDO' | 'mysqli' | 'legacy' | 'none' = 'none';
    if (rawQueries.length > 0) {
      if (this.fileContent.includes('PDO')) {
        queryType = 'PDO';
      } else if (this.fileContent.includes('mysqli')) {
        queryType = 'mysqli';
      } else if (this.fileContent.includes('mysql_')) {
        queryType = 'legacy';
      }
    }
    
    // Extraire les tables et colonnes
    const tables = this.extractSqlTables(rawQueries);
    const columns = this.extractSqlColumns(rawQueries);
    
    // Détecter les caractéristiques spéciales
    const hasJoins = rawQueries.some(q => 
      q.includes(' JOIN ') || q.includes(' INNER JOIN ') || q.includes(' LEFT JOIN ')
    );
    
    const hasWhere = rawQueries.some(q => q.includes(' WHERE '));
    
    const hasSubqueries = rawQueries.some(q => 
      q.includes('SELECT') && q.indexOf('SELECT') !== q.lastIndexOf('SELECT')
    );
    
    return {
      raw: rawQueries,
      tables,
      columns,
      queryType,
      hasJoins,
      hasWhere,
      hasSubqueries
    };
  }

  /**
   * Extrait les requêtes SQL du code PHP
   */
  private extractSqlQueries(content: string): string[] {
    const queries: string[] = [];
    
    // Extraire les requêtes entre guillemets
    const stringQueries = content.match(/["'](SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)[\s\S]*?["']/gi);
    if (stringQueries) {
      stringQueries.forEach(query => {
        // Nettoyer la requête
        const cleanedQuery = query.slice(1, -1)
          .replace(/\s+/g, ' ')
          .trim();
        queries.push(cleanedQuery);
      });
    }
    
    // Extraire les requêtes avec concaténation (moins précis)
    const concatMatches = content.match(/\$sql\s*=\s*["'][\s\S]*?;/gi);
    if (concatMatches) {
      concatMatches.forEach(match => {
        // Nettoyer du mieux possible
        const cleanedQuery = match
          .replace(/\$sql\s*=\s*["']/i, '')
          .replace(/["'];$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedQuery.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)/i)) {
          queries.push(cleanedQuery);
        }
      });
    }
    
    return queries;
  }

  /**
   * Extrait les noms de tables des requêtes SQL
   */
  private extractSqlTables(queries: string[]): string[] {
    const tables: string[] = [];
    
    queries.forEach(query => {
      // Rechercher les motifs FROM table, INSERT INTO table, UPDATE table
      let matches;
      
      // SELECT ... FROM table
      matches = query.match(/FROM\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // INSERT INTO table
      matches = query.match(/INSERT INTO\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // UPDATE table
      matches = query.match(/UPDATE\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // JOIN table
      const joinMatches = query.match(/JOIN\s+(\w+)/gi);
      if (joinMatches) {
        joinMatches.forEach(match => {
          const table = match.replace(/JOIN\s+/i, '');
          tables.push(table);
        });
      }
    });
    
    // Éliminer les doublons et trier
    return [...new Set(tables)].sort();
  }

  /**
   * Extrait les noms de colonnes des requêtes SQL
   */
  private extractSqlColumns(queries: string[]): string[] {
    const columns: string[] = [];
    
    queries.forEach(query => {
      // SELECT col1, col2 FROM table
      const selectMatches = query.match(/SELECT\s+([\w\s,*]+)\s+FROM/i);
      if (selectMatches && selectMatches[1] && selectMatches[1] !== '*') {
        const cols = selectMatches[1]
          .split(',')
          .map(col => col.trim().split(/\s+AS\s+|\s+/i)[0].trim());
        columns.push(...cols);
      }
      
      // WHERE col = ...
      const whereMatches = query.match(/WHERE\s+(\w+)\s*=/i);
      if (whereMatches && whereMatches[1]) {
        columns.push(whereMatches[1]);
      }
      
      // ORDER BY col
      const orderMatches = query.match(/ORDER BY\s+(\w+)/i);
      if (orderMatches && orderMatches[1]) {
        columns.push(orderMatches[1]);
      }
    });
    
    // Éliminer les doublons et trier
    return [...new Set(columns)]
      .filter(col => col !== '*' && !col.match(/^\d+$/))
      .sort();
  }

  /**
   * Analyse les sorties du script PHP
   */
  private analyzeOutputs(): DataAnalysisResult['outputs'] {
    const echoCount = (this.fileContent.match(/echo\s+/g) || []).length;
    const printCount = (this.fileContent.match(/print\s+/g) || []).length;
    
    // Détecter les sorties JSON
    const generatesJson = this.fileContent.includes('json_encode') || 
                         this.fileContent.includes('header(\'Content-Type: application/json\')');
    
    // Détecter les includes de templates
    const templates: string[] = [];
    const templateIncludes = this.fileContent.match(/include\s*\(['"](.*?\.(?:php|tpl|html))['"].*?\)/g);
    if (templateIncludes && templateIncludes.length > 0) {
      templateIncludes.forEach(include => {
        const match = include.match(/include\s*\(['"](.*?)['"].*?\)/);
        if (match && match[1]) {
          templates.push(match[1]);
        }
      });
    }
    
    // Détecter les redirections
    const hasRedirects = this.fileContent.includes('header(\'Location:') || 
                         this.fileContent.includes('redirect');
    
    return {
      echoCount,
      printCount,
      generatesJson,
      templates,
      hasRedirects
    };
  }

  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Réinitialiser l'état interne
    this.filePath = '';
    this.fileContent = '';
  }
}

// Exporter une instance par défaut pour compatibilité
export default new DataAnalyzerAgent();