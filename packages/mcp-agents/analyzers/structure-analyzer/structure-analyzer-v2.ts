import { AbstractAnalyzerAgent } from '../abstract-analyzer';
import { AnalysisResult, AnalyzerFinding, AnalysisStats } from '../../core/interfaces/analyzer-agent';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface pour les données d'entrée de l'analyseur de structure
 */
interface StructureAnalyzerInput {
  filePath: string;                 // Chemin du fichier PHP à analyser
  fileContent?: string;             // Contenu du fichier PHP (optionnel)
  options?: {
    analyzeClasses?: boolean;       // Analyser les structures de classe
    analyzeFunctions?: boolean;     // Analyser les fonctions
    analyzeEntryPoints?: boolean;   // Analyser les points d'entrée
    analyzeTemplates?: boolean;     // Analyser l'utilisation des templates
    analyzeComplexity?: boolean;    // Analyser la complexité structurelle
    calculateMetrics?: boolean;     // Calculer des métriques de code
    [key: string]: any;             // Autres options personnalisées
  };
}

/**
 * Interface pour les résultats de l'analyse de structure
 */
interface StructureAnalysisResult {
  fileStructure: {
    isObjectOriented: boolean;      // Le fichier est-il orienté objet
    classCount: number;             // Nombre de classes
    functionCount: number;          // Nombre de fonctions
    loopCount: {                    // Nombre de boucles
      for: number;
      foreach: number;
      while: number;
      total: number;
    };
    conditionalCount: number;       // Nombre de structures conditionnelles
    constantCount: number;          // Nombre de constantes
    lineCount: number;              // Nombre de lignes de code
  };
  entryPoints: {
    getParameters: string[];        // Paramètres GET
    postParameters: string[];       // Paramètres POST
    requestParameters: string[];    // Paramètres REQUEST
    isJsonApi: boolean;             // Est-ce un point d'entrée API JSON
    hasAuthCheck: boolean;          // Y a-t-il une vérification d'authentification
  };
  templateUsage: {
    templateFiles: string[];        // Fichiers template inclus
    outputCount: {                  // Nombre d'instructions d'affichage
      echo: number;
      print: number;
      total: number;
    };
    htmlTagCount: number;           // Nombre de balises HTML inline
  };
  classDetails?: {                  // Détails des classes (si présentes)
    name: string;
    methodCount: number;
    propertyCount: number;
    methods: {
      name: string;
      visibility: string;
      isStatic: boolean;
      parameterCount: number;
    }[];
  }[];
  metrics: {                        // Métriques de code
    cyclomaticComplexity: number;   // Complexité cyclomatique
    maintenanceIndex: number;       // Indice de maintenabilité (0-100)
    commentDensity: number;         // Densité de commentaires (%)
  };
}

/**
 * Agent d'analyse de structure de code PHP
 * 
 * Cet agent analyse la structure technique d'un fichier PHP, notamment les classes,
 * fonctions, points d'entrée et l'utilisation des templates.
 */
export class StructureAnalyzerAgent extends AbstractAnalyzerAgent<StructureAnalyzerInput, StructureAnalysisResult> {
  public id = 'structure-analyzer';
  public name = 'Structure Analyzer';
  public description = 'Analyse la structure technique du code PHP';
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
  public async validateInput(input: StructureAnalyzerInput): Promise<boolean> {
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
   * Analyse la structure d'un fichier PHP
   */
  public async analyze(input: StructureAnalyzerInput, context?: any): Promise<AnalysisResult<StructureAnalysisResult>> {
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
        analyzeClasses: true,
        analyzeFunctions: true,
        analyzeEntryPoints: true,
        analyzeTemplates: true,
        analyzeComplexity: true,
        calculateMetrics: true
      };
      
      // Préparer le résultat
      const result: StructureAnalysisResult = {
        fileStructure: {
          isObjectOriented: false,
          classCount: 0,
          functionCount: 0,
          loopCount: {
            for: 0,
            foreach: 0,
            while: 0,
            total: 0
          },
          conditionalCount: 0,
          constantCount: 0,
          lineCount: 0
        },
        entryPoints: {
          getParameters: [],
          postParameters: [],
          requestParameters: [],
          isJsonApi: false,
          hasAuthCheck: false
        },
        templateUsage: {
          templateFiles: [],
          outputCount: {
            echo: 0,
            print: 0,
            total: 0
          },
          htmlTagCount: 0
        },
        metrics: {
          cyclomaticComplexity: 0,
          maintenanceIndex: 0,
          commentDensity: 0
        }
      };
      
      // Collecter les découvertes (findings)
      const findings: AnalyzerFinding[] = [];
      
      // Analyser la structure du fichier
      this.analyzeFileStructure(result);
      
      // Analyser les points d'entrée
      if (options.analyzeEntryPoints !== false) {
        this.analyzeEntryPoints(result);
      }
      
      // Analyser l'utilisation des templates
      if (options.analyzeTemplates !== false) {
        this.analyzeTemplateUsage(result);
      }
      
      // Analyser les classes et méthodes
      if (options.analyzeClasses !== false) {
        result.classDetails = this.analyzeClasses();
      }
      
      // Calculer les métriques
      if (options.calculateMetrics !== false) {
        this.calculateMetrics(result);
      }
      
      // Ajouter des découvertes basées sur l'analyse
      this.addFileStructureFindings(result.fileStructure, findings);
      this.addEntryPointsFindings(result.entryPoints, findings);
      this.addTemplateUsageFindings(result.templateUsage, findings);
      this.addMetricsFindings(result.metrics, findings);
      
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
          message: `Erreur lors de l'analyse de structure: ${error.message}`
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Ajoute des découvertes concernant la structure du fichier
   */
  private addFileStructureFindings(fileStructure: StructureAnalysisResult['fileStructure'], findings: AnalyzerFinding[]): void {
    // Ajouter une découverte pour la structure générale
    findings.push({
      id: 'file-structure',
      type: 'code-organization',
      severity: 'info',
      message: `Structure du fichier: ${fileStructure.classCount} classe(s), ${fileStructure.functionCount} fonction(s), ${fileStructure.loopCount.total} boucle(s)`,
      metadata: { fileStructure }
    });
    
    // Vérifier si le fichier est orienté procédural plutôt qu'objet
    if (!fileStructure.isObjectOriented && fileStructure.functionCount > 3) {
      findings.push({
        id: 'procedural-code',
        type: 'architecture-concern',
        severity: 'medium',
        message: `Code procédural avec ${fileStructure.functionCount} fonctions`,
        location: this.filePath,
        suggestedFix: 'Restructurer en classes et services NestJS'
      });
    }
    
    // Vérifier la complexité structurelle
    if (fileStructure.loopCount.total > 10 || fileStructure.conditionalCount > 15) {
      findings.push({
        id: 'high-structural-complexity',
        type: 'code-complexity',
        severity: 'high',
        message: `Complexité structurelle élevée: ${fileStructure.loopCount.total} boucles, ${fileStructure.conditionalCount} conditions`,
        suggestedFix: 'Décomposer en fonctions/méthodes plus petites et spécifiques'
      });
    }
    
    // Vérifier la taille du fichier
    if (fileStructure.lineCount > 300) {
      findings.push({
        id: 'large-file',
        type: 'code-organization',
        severity: 'medium',
        message: `Fichier de grande taille (${fileStructure.lineCount} lignes)`,
        suggestedFix: 'Décomposer en plusieurs fichiers selon la responsabilité'
      });
    }
  }
  
  /**
   * Ajoute des découvertes concernant les points d'entrée
   */
  private addEntryPointsFindings(entryPoints: StructureAnalysisResult['entryPoints'], findings: AnalyzerFinding[]): void {
    const totalParameters = entryPoints.getParameters.length + 
                          entryPoints.postParameters.length + 
                          entryPoints.requestParameters.length;
    
    if (totalParameters > 0) {
      findings.push({
        id: 'user-input-parameters',
        type: 'api-endpoint',
        severity: 'info',
        message: `Point d'entrée avec ${totalParameters} paramètre(s) d'entrée`,
        metadata: { 
          get: entryPoints.getParameters,
          post: entryPoints.postParameters,
          request: entryPoints.requestParameters
        }
      });
      
      // Recommandation pour la migration vers des contrôleurs NestJS
      findings.push({
        id: 'controller-migration',
        type: 'migration-task',
        severity: 'medium',
        message: 'Point d\'entrée à migrer vers un contrôleur NestJS',
        suggestedFix: 'Créer un contrôleur NestJS avec endpoints REST ou GraphQL'
      });
      
      // Vérifier l'utilisation de $_REQUEST (moins sécurisée)
      if (entryPoints.requestParameters.length > 0) {
        findings.push({
          id: 'request-usage',
          type: 'security-concern',
          severity: 'medium',
          message: 'Utilisation de $_REQUEST (moins sécurisée)',
          suggestedFix: 'Utiliser des validateurs de DTO dans NestJS'
        });
      }
    }
    
    // S'il s'agit d'une API JSON
    if (entryPoints.isJsonApi) {
      findings.push({
        id: 'json-api',
        type: 'api-endpoint',
        severity: 'low',
        message: 'Point d\'entrée API JSON détecté',
        suggestedFix: 'Migrer vers un contrôleur REST NestJS avec sérialisation'
      });
    }
    
    // S'il y a vérification d'authentification
    if (entryPoints.hasAuthCheck) {
      findings.push({
        id: 'auth-check',
        type: 'security-feature',
        severity: 'medium',
        message: 'Vérification d\'authentification détectée',
        suggestedFix: 'Utiliser le système d\'authentification NestJS avec Guards'
      });
    }
  }
  
  /**
   * Ajoute des découvertes concernant l'utilisation des templates
   */
  private addTemplateUsageFindings(templateUsage: StructureAnalysisResult['templateUsage'], findings: AnalyzerFinding[]): void {
    // Utilisation de templates
    if (templateUsage.templateFiles.length > 0) {
      findings.push({
        id: 'template-usage',
        type: 'view-layer',
        severity: 'medium',
        message: `Utilisation de ${templateUsage.templateFiles.length} fichier(s) template`,
        metadata: { files: templateUsage.templateFiles },
        suggestedFix: 'Migrer vers des composants React dans Remix'
      });
    }
    
    // Génération de HTML inline
    if (templateUsage.htmlTagCount > 0) {
      findings.push({
        id: 'inline-html',
        type: 'view-layer',
        severity: 'high',
        message: `${templateUsage.htmlTagCount} balises HTML inline détectées`,
        suggestedFix: 'Extraire le HTML dans des composants React'
      });
    }
    
    // Instructions d'affichage directes
    if (templateUsage.outputCount.total > 10) {
      findings.push({
        id: 'direct-output',
        type: 'code-quality',
        severity: 'medium',
        message: `Utilisation intensive d'instructions d'affichage direct (${templateUsage.outputCount.total})`,
        suggestedFix: 'Remplacer par le système de rendu de Remix'
      });
    }
  }
  
  /**
   * Ajoute des découvertes concernant les métriques
   */
  private addMetricsFindings(metrics: StructureAnalysisResult['metrics'], findings: AnalyzerFinding[]): void {
    // Complexité cyclomatique
    if (metrics.cyclomaticComplexity > 10) {
      findings.push({
        id: 'high-cyclomatic-complexity',
        type: 'code-complexity',
        severity: metrics.cyclomaticComplexity > 20 ? 'high' : 'medium',
        message: `Complexité cyclomatique élevée: ${metrics.cyclomaticComplexity}`,
        suggestedFix: 'Refactoriser en plus petites fonctions avec responsabilités uniques'
      });
    }
    
    // Indice de maintenabilité
    if (metrics.maintenanceIndex < 65) {
      findings.push({
        id: 'low-maintainability',
        type: 'code-quality',
        severity: metrics.maintenanceIndex < 40 ? 'high' : 'medium',
        message: `Faible indice de maintenabilité: ${metrics.maintenanceIndex}/100`,
        suggestedFix: 'Améliorer la lisibilité du code et réduire la complexité'
      });
    }
    
    // Densité de commentaires
    if (metrics.commentDensity < 5) {
      findings.push({
        id: 'low-comment-density',
        type: 'documentation',
        severity: 'low',
        message: `Faible densité de commentaires: ${metrics.commentDensity}%`,
        suggestedFix: 'Ajouter des commentaires pour expliquer l\'intention du code'
      });
    }
  }
  
  /**
   * Analyse la structure générale du fichier PHP
   */
  private analyzeFileStructure(result: StructureAnalysisResult): void {
    const fileContent = this.fileContent;
    
    // Détecter si le fichier est orienté objet
    const classMatches = fileContent.match(/class\s+\w+/g);
    result.fileStructure.classCount = (classMatches || []).length;
    result.fileStructure.isObjectOriented = result.fileStructure.classCount > 0;
    
    // Compter les fonctions
    const functionMatches = fileContent.match(/function\s+\w+\s*\(/g);
    result.fileStructure.functionCount = (functionMatches || []).length;
    
    // Détecter les boucles
    result.fileStructure.loopCount.for = (fileContent.match(/for\s*\(/g) || []).length;
    result.fileStructure.loopCount.foreach = (fileContent.match(/foreach\s*\(/g) || []).length;
    result.fileStructure.loopCount.while = (fileContent.match(/while\s*\(/g) || []).length;
    result.fileStructure.loopCount.total = result.fileStructure.loopCount.for + 
                                         result.fileStructure.loopCount.foreach + 
                                         result.fileStructure.loopCount.while;
    
    // Détecter les conditions if/else
    result.fileStructure.conditionalCount = (fileContent.match(/if\s*\(/g) || []).length;
    
    // Détecter la définition de constantes
    result.fileStructure.constantCount = (fileContent.match(/define\s*\(/g) || []).length;
    
    // Compter les lignes de code
    result.fileStructure.lineCount = fileContent.split('\n').length;
  }
  
  /**
   * Analyse les points d'entrée du script PHP
   */
  private analyzeEntryPoints(result: StructureAnalysisResult): void {
    const fileContent = this.fileContent;
    
    // Extraire les paramètres GET
    const getMatches = fileContent.match(/\$_GET\[['"](\w+)['"]\]/g);
    if (getMatches) {
      result.entryPoints.getParameters = getMatches.map(match => {
        const extracted = match.match(/\$_GET\[['"](\w+)['"]\]/);
        return extracted ? extracted[1] : '';
      }).filter(Boolean);
    }
    
    // Extraire les paramètres POST
    const postMatches = fileContent.match(/\$_POST\[['"](\w+)['"]\]/g);
    if (postMatches) {
      result.entryPoints.postParameters = postMatches.map(match => {
        const extracted = match.match(/\$_POST\[['"](\w+)['"]\]/);
        return extracted ? extracted[1] : '';
      }).filter(Boolean);
    }
    
    // Extraire les paramètres REQUEST
    const requestMatches = fileContent.match(/\$_REQUEST\[['"](\w+)['"]\]/g);
    if (requestMatches) {
      result.entryPoints.requestParameters = requestMatches.map(match => {
        const extracted = match.match(/\$_REQUEST\[['"](\w+)['"]\]/);
        return extracted ? extracted[1] : '';
      }).filter(Boolean);
    }
    
    // Détecter les points d'entrée API
    result.entryPoints.isJsonApi = fileContent.includes('header(\'Content-Type: application/json\')') || 
                                  fileContent.includes('json_encode');
    
    // Détecter les points d'entrée d'authentification
    result.entryPoints.hasAuthCheck = fileContent.includes('$_SESSION[\'user\'') || 
                                     fileContent.includes('$_SESSION[\'auth\'') || 
                                     fileContent.includes('isConnected') || 
                                     fileContent.includes('isLoggedIn');
  }
  
  /**
   * Analyse l'utilisation des templates dans le fichier PHP
   */
  private analyzeTemplateUsage(result: StructureAnalysisResult): void {
    const fileContent = this.fileContent;
    
    // Détecter les includes et requires
    const includeMatches = fileContent.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/g);
    const requireMatches = fileContent.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/g);
    
    if (includeMatches) {
      includeMatches.forEach(statement => {
        const match = statement.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/);
        if (match && match[1] && (match[1].includes('tpl') || match[1].includes('template') || match[1].includes('view'))) {
          result.templateUsage.templateFiles.push(match[1]);
        }
      });
    }
    
    if (requireMatches) {
      requireMatches.forEach(statement => {
        const match = statement.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/);
        if (match && match[1] && (match[1].includes('tpl') || match[1].includes('template') || match[1].includes('view'))) {
          result.templateUsage.templateFiles.push(match[1]);
        }
      });
    }
    
    // Détecter les outputs directs
    result.templateUsage.outputCount.echo = (fileContent.match(/echo\s+/g) || []).length;
    result.templateUsage.outputCount.print = (fileContent.match(/print\s+/g) || []).length;
    result.templateUsage.outputCount.total = result.templateUsage.outputCount.echo + 
                                           result.templateUsage.outputCount.print;
    
    // Détecter les blocs HTML inline
    const htmlTags = fileContent.match(/<[a-z][^>]*>/ig);
    result.templateUsage.htmlTagCount = (htmlTags || []).length;
  }
  
  /**
   * Analyse les classes définies dans le fichier PHP
   */
  private analyzeClasses(): StructureAnalysisResult['classDetails'] {
    const fileContent = this.fileContent;
    const classDetails: StructureAnalysisResult['classDetails'] = [];
    
    // Rechercher les déclarations de classe
    const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*{/g;
    let classMatch;
    
    while ((classMatch = classRegex.exec(fileContent)) !== null) {
      const className = classMatch[1];
      const classStart = classMatch.index;
      
      // Trouver la fin de la classe
      let braceCount = 1;
      let classEnd = fileContent.indexOf('{', classStart) + 1;
      
      while (braceCount > 0 && classEnd < fileContent.length) {
        const char = fileContent[classEnd];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        classEnd++;
      }
      
      const classBody = fileContent.substring(classStart, classEnd);
      
      // Trouver les méthodes
      const methodRegex = /(public|private|protected)(?:\s+static)?\s+function\s+(\w+)\s*\(([^)]*)\)/g;
      const methods: { name: string; visibility: string; isStatic: boolean; parameterCount: number }[] = [];
      let methodMatch;
      
      while ((methodMatch = methodRegex.exec(classBody)) !== null) {
        const visibility = methodMatch[1];
        const methodName = methodMatch[2];
        const params = methodMatch[3].trim();
        const isStatic = methodMatch[0].includes('static');
        const parameterCount = params ? params.split(',').length : 0;
        
        methods.push({
          name: methodName,
          visibility,
          isStatic,
          parameterCount
        });
      }
      
      // Trouver les propriétés
      const propertyRegex = /(public|private|protected)(?:\s+static)?\s+(\$\w+)/g;
      let propertyCount = 0;
      while (propertyRegex.exec(classBody) !== null) {
        propertyCount++;
      }
      
      classDetails.push({
        name: className,
        methodCount: methods.length,
        propertyCount,
        methods
      });
    }
    
    return classDetails;
  }
  
  /**
   * Calcule des métriques de code
   */
  private calculateMetrics(result: StructureAnalysisResult): void {
    const fileContent = this.fileContent;
    
    // Calculer la complexité cyclomatique (version simplifiée)
    // Chaque branche dans le flux de contrôle ajoute 1 à la complexité
    const conditions = (fileContent.match(/if\s*\(/g) || []).length;
    const caseStatements = (fileContent.match(/case\s+/g) || []).length;
    const loops = result.fileStructure.loopCount.total;
    const catches = (fileContent.match(/catch\s*\(/g) || []).length;
    const ternaries = (fileContent.match(/\?.*:/g) || []).length;
    const logicalOps = (fileContent.match(/&&|\|\|/g) || []).length;
    
    result.metrics.cyclomaticComplexity = 1 + conditions + caseStatements + loops + catches + ternaries + logicalOps;
    
    // Calculer l'indice de maintenabilité (version simplifiée)
    // MI = MAX(0,(171 - 5.2 * ln(V) - 0.23 * (CC) - 16.2 * ln(LOC)) * 100 / 171)
    // Où V est le volume de Halstead, CC est la complexité cyclomatique, et LOC est le nombre de lignes de code
    // Ici, on utilise une version simplifiée sans le volume de Halstead
    const loc = result.fileStructure.lineCount;
    
    if (loc > 0) {
      const mi = Math.max(0, (171 - 0.23 * result.metrics.cyclomaticComplexity - 16.2 * Math.log(loc)) * 100 / 171);
      result.metrics.maintenanceIndex = Math.round(mi);
    }
    
    // Calculer la densité de commentaires
    const commentLines = (fileContent.match(/\/\/|\/\*|\*\/|\*/g) || []).length;
    result.metrics.commentDensity = Math.round((commentLines / loc) * 100);
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
        id: 'code-organization',
        name: 'Organisation du Code',
        description: 'Analyse la structure générale du fichier et son organisation',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'architecture-concern',
        name: 'Préoccupations d\'Architecture',
        description: 'Détecte les problèmes d\'architecture qui pourraient affecter la migration',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'code-complexity',
        name: 'Complexité du Code',
        description: 'Évalue la complexité du code et ses implications',
        isEnabled: true,
        severity: 'high'
      },
      {
        id: 'api-endpoint',
        name: 'Points d\'Entrée API',
        description: 'Identifie les points d\'entrée API et les paramètres',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'security-concern',
        name: 'Problèmes de Sécurité',
        description: 'Détecte les problèmes potentiels de sécurité',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'security-feature',
        name: 'Fonctionnalités de Sécurité',
        description: 'Identifie les fonctionnalités de sécurité existantes',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'view-layer',
        name: 'Couche de Vue',
        description: 'Analyse l\'utilisation des templates et de la génération HTML',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'code-quality',
        name: 'Qualité du Code',
        description: 'Évalue différents aspects de la qualité du code',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'documentation',
        name: 'Documentation du Code',
        description: 'Évalue le niveau de documentation dans le code',
        isEnabled: true,
        severity: 'low'
      },
      {
        id: 'migration-task',
        name: 'Tâches de Migration',
        description: 'Identifie les tâches spécifiques pour la migration',
        isEnabled: true,
        severity: 'medium'
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
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Réinitialiser l'état interne
    this.filePath = '';
    this.fileContent = '';
  }
}

// Exporter une instance par défaut pour compatibilité
export default new StructureAnalyzerAgent();