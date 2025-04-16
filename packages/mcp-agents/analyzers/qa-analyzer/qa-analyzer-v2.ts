import { AbstractAnalyzerAgent } from '../abstract-analyzer';
import { AnalysisResult, AnalyzerFinding, AnalysisStats } from '../../core/interfaces/analyzer-agent';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Interface pour les données d'entrée de l'analyseur de qualité
 */
interface QAAnalyzerInput {
  targetPath: string;         // Chemin du fichier ou du dossier à analyser
  isDirectory?: boolean;      // Indique si le chemin est un dossier
  options?: {
    rulesets?: string[];      // Ensembles de règles à appliquer
    customRules?: {           // Règles personnalisées
      id: string;
      pattern: string;
      message: string;
      severity: string;
    }[];
    ignoredPatterns?: string[]; // Motifs à ignorer
    confidence?: number;      // Niveau de confiance minimum (0-100)
    maxIssuesPerFile?: number; // Nombre maximum de problèmes par fichier
    [key: string]: any;       // Autres options personnalisées
  };
}

/**
 * Interface pour les résultats de l'analyse de qualité
 */
interface QAAnalysisResult {
  summary: {
    totalFiles: number;       // Nombre total de fichiers analysés
    filesWithIssues: number;  // Nombre de fichiers avec des problèmes
    totalIssues: number;      // Nombre total de problèmes
    issuesByType: Record<string, number>; // Problèmes par type
    issuesBySeverity: Record<string, number>; // Problèmes par sévérité
    qualityScore: number;     // Score de qualité (0-100)
    analysisTime: number;     // Temps d'analyse en ms
  };
  fileResults: {
    filePath: string;         // Chemin du fichier
    issues: {
      type: string;           // Type de problème
      message: string;        // Message du problème
      line: number;           // Numéro de ligne
      column: number;         // Numéro de colonne
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; // Sévérité
      ruleId: string;         // ID de la règle
      code?: string;          // Extrait de code problématique
      suggestedFix?: string;  // Proposition de correction
    }[];
    qualityScore: number;     // Score de qualité du fichier (0-100)
    metrics: {                // Métriques du fichier
      complexityScore: number; // Score de complexité
      maintainabilityScore: number; // Score de maintenabilité
      testabilityScore: number; // Score de testabilité
      securityScore: number;  // Score de sécurité
    };
  }[];
  recommendations: {
    id: string;               // ID de la recommandation
    title: string;            // Titre de la recommandation
    description: string;      // Description détaillée
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; // Sévérité
    effort: 'high' | 'medium' | 'low'; // Effort de correction
    category: string;         // Catégorie (sécurité, performance, etc.)
    codeExamples?: {          // Exemples de code
      badCode: string;        // Mauvaise pratique
      goodCode: string;       // Bonne pratique
    }[];
    references?: string[];    // Références externes
  }[];
  applicationSecuritySummary?: {
    riskLevel: 'critical' | 'high' | 'medium' | 'low'; // Niveau de risque global
    vulnerabilitiesCount: number; // Nombre de vulnérabilités identifiées
    securityScore: number;    // Score de sécurité (0-100)
    topVulnerabilities: string[]; // Principales vulnérabilités
  };
}

/**
 * Agent d'analyse de qualité du code PHP
 * 
 * Cet agent analyse la qualité du code PHP, identifie les problèmes
 * et fournit des recommandations pour l'amélioration du code.
 */
export class QAAnalyzerV2 extends AbstractAnalyzerAgent<QAAnalyzerInput, QAAnalysisResult> {
  public id = 'qa-analyzer-v2';
  public name = 'PHP Quality Analyzer V2';
  public description = 'Analyse la qualité du code PHP et fournit des recommandations';
  public version = '2.0.0';
  
  // État interne
  private processedFiles = 0;
  private issuesByType: Record<string, number> = {};
  private issuesBySeverity: Record<string, number> = {};
  private processingTimes: number[] = [];
  
  // Configuration des règles
  private defaultRulesets = [
    'performance',
    'security',
    'maintainability',
    'compatibility',
    'clean-code'
  ];
  
  // Définitions des règles (simplifiées pour l'exemple)
  private rules: Record<string, {
    pattern: RegExp;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    suggestedFix?: string;
  }> = {
    'security.sql-injection': {
      pattern: /mysql_query\s*\(\s*(['"`].*\$.*['"`])/,
      message: 'Risque d\'injection SQL avec mysql_query et variable non échappée',
      severity: 'critical',
      category: 'security',
      suggestedFix: 'Utiliser des requêtes préparées avec PDO ou mysqli'
    },
    'security.xss': {
      pattern: /echo\s+\$_(?:GET|POST|REQUEST)/,
      message: 'Risque XSS : affichage direct de données utilisateur',
      severity: 'critical',
      category: 'security',
      suggestedFix: 'Utiliser htmlspecialchars() ou une librairie d\'échappement'
    },
    'security.file-inclusion': {
      pattern: /include\s*\(\s*\$_(?:GET|POST|REQUEST)/,
      message: 'Risque d\'inclusion de fichier arbitraire',
      severity: 'critical',
      category: 'security',
      suggestedFix: 'Ne jamais inclure de fichiers à partir de données utilisateur'
    },
    'security.eval': {
      pattern: /eval\s*\(/,
      message: 'Utilisation dangereuse de la fonction eval()',
      severity: 'critical',
      category: 'security',
      suggestedFix: 'Éviter d\'utiliser eval(), trouver une alternative plus sûre'
    },
    'performance.loop-in-loop': {
      pattern: /(for|foreach|while)[\s\S]{0,50}(for|foreach|while)/,
      message: 'Boucle imbriquée détectée, potentiel problème de performance',
      severity: 'medium',
      category: 'performance',
      suggestedFix: 'Optimiser l\'algorithme ou utiliser des opérations sur les ensembles'
    },
    'performance.global-variable': {
      pattern: /global\s+\$/,
      message: 'Utilisation de variables globales',
      severity: 'medium',
      category: 'performance',
      suggestedFix: 'Utiliser des paramètres de fonction ou des classes'
    },
    'maintainability.long-function': {
      pattern: /function\s+\w+\s*\([^)]*\)\s*{[\s\S]{1000,}/,
      message: 'Fonction trop longue (plus de 1000 caractères)',
      severity: 'medium',
      category: 'maintainability',
      suggestedFix: 'Décomposer en fonctions plus petites avec une responsabilité unique'
    },
    'maintainability.too-many-parameters': {
      pattern: /function\s+\w+\s*\([^)]{80,}\)/,
      message: 'Fonction avec trop de paramètres',
      severity: 'medium',
      category: 'maintainability',
      suggestedFix: 'Utiliser un objet pour les paramètres ou décomposer la fonction'
    },
    'clean-code.magic-number': {
      pattern: /[=<>!]\s*[0-9]{4,}/,
      message: 'Utilisation de nombre magique',
      severity: 'low',
      category: 'clean-code',
      suggestedFix: 'Définir une constante nommée pour expliquer l\'intention'
    },
    'compatibility.mysql-deprecated': {
      pattern: /mysql_/,
      message: 'Fonction mysql_* obsolète (retirée dans PHP 7.0)',
      severity: 'high',
      category: 'compatibility',
      suggestedFix: 'Utiliser mysqli ou PDO'
    }
  };
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Réinitialiser l'état
    this.processedFiles = 0;
    this.issuesByType = {};
    this.issuesBySeverity = {};
    this.processingTimes = [];
    
    // Vérifier la disponibilité de PHP
    try {
      await execAsync('which php');
    } catch (error) {
      console.warn('PHP n\'est pas installé ou n\'est pas disponible dans le PATH. Certaines analyses avancées seront limitées.');
    }
  }
  
  /**
   * Valide les données d'entrée
   */
  public async validateInput(input: QAAnalyzerInput): Promise<boolean> {
    if (!input || !input.targetPath) {
      console.error('Un chemin cible est requis');
      return false;
    }
    
    try {
      const stats = fs.statSync(input.targetPath);
      input.isDirectory = stats.isDirectory();
      return true;
    } catch (error) {
      console.error(`Le chemin cible n'existe pas: ${input.targetPath}`);
      return false;
    }
  }
  
  /**
   * Analyse la qualité du code PHP
   */
  public async analyze(input: QAAnalyzerInput, context?: any): Promise<AnalysisResult<QAAnalysisResult>> {
    const startTime = Date.now();
    
    try {
      // Valider les entrées
      if (!await this.validateInput(input)) {
        return {
          success: false,
          findings: [{
            id: 'invalid-input',
            type: 'error',
            severity: 'critical',
            message: 'Entrées invalides pour l\'analyse QA'
          }],
          timestamp: new Date()
        };
      }
      
      // Configurer les options d'analyse
      const options = input.options || {};
      const rulesets = options.rulesets || this.defaultRulesets;
      const confidence = options.confidence || 90;
      const maxIssuesPerFile = options.maxIssuesPerFile || 100;
      
      // Trouver les fichiers à analyser
      const filePaths = input.isDirectory 
        ? await this.findPhpFiles(input.targetPath, options.ignoredPatterns) 
        : [input.targetPath];
      
      // Résultat global
      const result: QAAnalysisResult = {
        summary: {
          totalFiles: filePaths.length,
          filesWithIssues: 0,
          totalIssues: 0,
          issuesByType: {},
          issuesBySeverity: {},
          qualityScore: 100,
          analysisTime: 0
        },
        fileResults: [],
        recommendations: []
      };
      
      // Analyser chaque fichier
      for (const filePath of filePaths) {
        const fileAnalysisStartTime = Date.now();
        const fileResult = await this.analyzeFile(filePath, rulesets, confidence, maxIssuesPerFile);
        this.processingTimes.push(Date.now() - fileAnalysisStartTime);
        
        // Mettre à jour les statistiques globales
        result.fileResults.push(fileResult);
        if (fileResult.issues.length > 0) {
          result.summary.filesWithIssues++;
        }
        result.summary.totalIssues += fileResult.issues.length;
        
        // Mettre à jour les statistiques par type et sévérité
        fileResult.issues.forEach(issue => {
          result.summary.issuesByType[issue.type] = (result.summary.issuesByType[issue.type] || 0) + 1;
          result.summary.issuesBySeverity[issue.severity] = (result.summary.issuesBySeverity[issue.severity] || 0) + 1;
          
          // Mettre à jour l'état interne
          this.issuesByType[issue.type] = (this.issuesByType[issue.type] || 0) + 1;
          this.issuesBySeverity[issue.severity] = (this.issuesBySeverity[issue.severity] || 0) + 1;
        });
      }
      
      // Mettre à jour les statistiques finales
      result.summary.analysisTime = Date.now() - startTime;
      result.summary.qualityScore = this.calculateQualityScore(result);
      
      // Générer des recommandations
      result.recommendations = this.generateRecommendations(result);
      
      // Évaluer la sécurité de l'application
      result.applicationSecuritySummary = this.evaluateApplicationSecurity(result);
      
      // Convertir les résultats en findings pour l'interface AbstractAnalyzerAgent
      const findings = this.convertToFindings(result);
      
      // Mettre à jour le compteur de fichiers traités
      this.processedFiles += filePaths.length;
      
      return {
        success: true,
        findings,
        data: result,
        stats: {
          totalFiles: result.summary.totalFiles,
          totalFindings: findings.length,
          findingsByType: this.issuesByType,
          findingsBySeverity: this.issuesBySeverity,
          executionTime: result.summary.analysisTime,
          qualityScore: result.summary.qualityScore
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        findings: [{
          id: 'analysis-error',
          type: 'error',
          severity: 'critical',
          message: `Erreur lors de l'analyse QA: ${(error as Error).message}`
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Trouve les fichiers PHP récursivement
   */
  private async findPhpFiles(dir: string, ignoredPatterns: string[] = []): Promise<string[]> {
    try {
      let findCommand = `find ${dir} -type f -name "*.php"`;
      
      // Ajouter les motifs à ignorer
      if (ignoredPatterns && ignoredPatterns.length > 0) {
        for (const pattern of ignoredPatterns) {
          findCommand += ` | grep -v '${pattern}'`;
        }
      }
      
      // Toujours ignorer vendor et node_modules
      findCommand += ` | grep -v '/vendor/' | grep -v '/node_modules/'`;
      
      const { stdout } = await execAsync(findCommand);
      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.error('Erreur lors de la recherche des fichiers PHP:', error);
      return [];
    }
  }
  
  /**
   * Analyse un fichier PHP
   */
  private async analyzeFile(
    filePath: string, 
    rulesets: string[], 
    confidence: number, 
    maxIssues: number
  ): Promise<QAAnalysisResult['fileResults'][0]> {
    try {
      // Lire le contenu du fichier
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Résultat pour ce fichier
      const fileResult: QAAnalysisResult['fileResults'][0] = {
        filePath,
        issues: [],
        qualityScore: 100,
        metrics: {
          complexityScore: 0,
          maintainabilityScore: 0,
          testabilityScore: 0,
          securityScore: 0
        }
      };
      
      // Collecter les règles applicables selon les rulesets sélectionnés
      const applicableRules = Object.entries(this.rules)
        .filter(([ruleId]) => {
          const category = ruleId.split('.')[0];
          return rulesets.includes(category);
        });
      
      // Appliquer chaque règle au contenu du fichier
      for (const [ruleId, rule] of applicableRules) {
        // Rechercher les correspondances
        const matches = content.match(rule.pattern);
        if (matches) {
          for (const match of matches) {
            // Trouver la ligne et la colonne
            const index = content.indexOf(match);
            const beforeMatch = content.substring(0, index);
            const line = (beforeMatch.match(/\n/g) || []).length + 1;
            const lastNewLine = beforeMatch.lastIndexOf('\n');
            const column = lastNewLine === -1 ? index + 1 : index - lastNewLine;
            
            // Extraire le contexte du code (la ligne complète)
            const lines = content.split('\n');
            const codeLine = lines[line - 1] || '';
            
            // Ajouter le problème
            fileResult.issues.push({
              type: rule.category,
              message: rule.message,
              line,
              column,
              severity: rule.severity,
              ruleId,
              code: codeLine.trim(),
              suggestedFix: rule.suggestedFix
            });
            
            // Limiter le nombre de problèmes par fichier
            if (fileResult.issues.length >= maxIssues) {
              break;
            }
          }
        }
      }
      
      // Calculer les métriques de qualité du fichier
      fileResult.metrics = this.calculateFileMetrics(content, fileResult.issues);
      
      // Calculer le score de qualité du fichier
      fileResult.qualityScore = this.calculateFileQualityScore(fileResult);
      
      return fileResult;
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
      return {
        filePath,
        issues: [{
          type: 'error',
          message: `Erreur lors de l'analyse: ${(error as Error).message}`,
          line: 0,
          column: 0,
          severity: 'critical',
          ruleId: 'analysis.error'
        }],
        qualityScore: 0,
        metrics: {
          complexityScore: 0,
          maintainabilityScore: 0,
          testabilityScore: 0,
          securityScore: 0
        }
      };
    }
  }
  
  /**
   * Calcule les métriques de qualité pour un fichier
   */
  private calculateFileMetrics(
    content: string, 
    issues: QAAnalysisResult['fileResults'][0]['issues']
  ): QAAnalysisResult['fileResults'][0]['metrics'] {
    const metrics = {
      complexityScore: 0,
      maintainabilityScore: 0,
      testabilityScore: 0,
      securityScore: 0
    };
    
    // Calculer le score de complexité (simpliste pour l'exemple)
    // Compter les structures de contrôle
    const ifCount = (content.match(/if\s*\(/g) || []).length;
    const forCount = (content.match(/for\s*\(/g) || []).length;
    const foreachCount = (content.match(/foreach\s*\(/g) || []).length;
    const whileCount = (content.match(/while\s*\(/g) || []).length;
    const switchCount = (content.match(/switch\s*\(/g) || []).length;
    
    // Plus le nombre est élevé, plus la complexité est haute (moins bon score)
    const structureCount = ifCount + forCount + foreachCount + whileCount + switchCount;
    metrics.complexityScore = Math.max(0, 100 - structureCount * 5);
    
    // Calculer le score de maintenabilité
    // Facteurs : longueur des fonctions, nombre de paramètres, commentaires
    const functionLengths = [];
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g);
    if (functionMatches) {
      for (const fnMatch of functionMatches) {
        functionLengths.push(fnMatch.length);
      }
    }
    
    const avgFunctionLength = functionLengths.length > 0 
      ? functionLengths.reduce((sum, len) => sum + len, 0) / functionLengths.length 
      : 0;
    
    const commentRatio = (content.match(/\/\/|\/\*|\*\//g) || []).length / content.length;
    metrics.maintainabilityScore = Math.max(0, 100 - (avgFunctionLength / 20) + (commentRatio * 1000));
    
    // Calculer le score de testabilité
    // Moins de dépendances = plus testable
    const globalUsage = (content.match(/global\s+\$/g) || []).length;
    const staticUsage = (content.match(/static\s+/g) || []).length;
    metrics.testabilityScore = Math.max(0, 100 - (globalUsage * 10) - (staticUsage * 5));
    
    // Calculer le score de sécurité
    // Basé sur les problèmes de sécurité détectés
    const securityIssues = issues.filter(issue => issue.type === 'security');
    const securityPenalty = securityIssues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'critical': return total + 25;
        case 'high': return total + 15;
        case 'medium': return total + 10;
        case 'low': return total + 5;
        default: return total;
      }
    }, 0);
    
    metrics.securityScore = Math.max(0, 100 - securityPenalty);
    
    return metrics;
  }
  
  /**
   * Calcule le score de qualité pour un fichier
   */
  private calculateFileQualityScore(fileResult: QAAnalysisResult['fileResults'][0]): number {
    const { metrics, issues } = fileResult;
    
    // Combiner les scores des métriques et les pénalités des problèmes
    const metricsScore = (
      metrics.complexityScore * 0.25 +
      metrics.maintainabilityScore * 0.25 +
      metrics.testabilityScore * 0.25 +
      metrics.securityScore * 0.25
    );
    
    // Calculer les pénalités pour les problèmes
    const issuePenalty = issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'critical': return total + 10;
        case 'high': return total + 5;
        case 'medium': return total + 3;
        case 'low': return total + 1;
        default: return total;
      }
    }, 0);
    
    // Score final
    return Math.max(0, Math.min(100, metricsScore - issuePenalty));
  }
  
  /**
   * Calcule le score de qualité global
   */
  private calculateQualityScore(result: QAAnalysisResult): number {
    if (result.fileResults.length === 0) {
      return 0;
    }
    
    // Moyenne des scores de qualité des fichiers
    const totalScore = result.fileResults.reduce(
      (sum, file) => sum + file.qualityScore, 
      0
    );
    
    return Math.round(totalScore / result.fileResults.length);
  }
  
  /**
   * Génère des recommandations en fonction des problèmes détectés
   */
  private generateRecommendations(result: QAAnalysisResult): QAAnalysisResult['recommendations'] {
    const recommendations: QAAnalysisResult['recommendations'] = [];
    const issuesByType = result.summary.issuesByType;
    
    // Recommandation pour les problèmes de sécurité
    if (issuesByType['security'] && issuesByType['security'] > 0) {
      recommendations.push({
        id: 'security-improvements',
        title: 'Améliorer la sécurité du code',
        description: `${issuesByType['security']} problèmes de sécurité détectés. Il est crucial de les corriger avant la migration pour éviter d'introduire des vulnérabilités dans la nouvelle architecture.`,
        severity: 'high',
        effort: 'high',
        category: 'security',
        codeExamples: [{
          badCode: 'mysql_query("SELECT * FROM users WHERE id = " . $_GET["id"]);',
          goodCode: '$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");\n$stmt->execute([$_GET["id"]]);'
        }],
        references: [
          'https://www.php.net/manual/fr/pdo.prepared-statements.php',
          'https://owasp.org/www-project-top-ten/'
        ]
      });
    }
    
    // Recommandation pour les problèmes de performance
    if (issuesByType['performance'] && issuesByType['performance'] > 0) {
      recommendations.push({
        id: 'performance-improvements',
        title: 'Optimisation des performances',
        description: `${issuesByType['performance']} problèmes de performance détectés. L'optimisation peut simplifier la migration et améliorer l'expérience utilisateur.`,
        severity: 'medium',
        effort: 'medium',
        category: 'performance',
        codeExamples: [{
          badCode: 'foreach ($users as $user) {\n  foreach ($items as $item) {\n    // Traitement\n  }\n}',
          goodCode: '// Restructurer pour éviter les boucles imbriquées\n$userItemMap = [];\nforeach ($items as $item) {\n  $userItemMap[$item->userId][] = $item;\n}\nforeach ($users as $user) {\n  $userItems = $userItemMap[$user->id] ?? [];\n  // Traitement\n}'
        }]
      });
    }
    
    // Recommandation pour les problèmes de maintenabilité
    if (issuesByType['maintainability'] && issuesByType['maintainability'] > 0) {
      recommendations.push({
        id: 'maintainability-improvements',
        title: 'Amélioration de la maintenabilité du code',
        description: `${issuesByType['maintainability']} problèmes de maintenabilité détectés. Simplifier et structurer le code existant facilitera la migration.`,
        severity: 'medium',
        effort: 'medium',
        category: 'maintainability',
        codeExamples: [{
          badCode: 'function processData($data, $type, $format, $validate, $user, $permissions, $options, $timestamp) {\n  // Fonction avec trop de paramètres\n}',
          goodCode: 'function processData(ProcessOptions $options) {\n  // Utilisation d\'un objet pour les options\n}'
        }]
      });
    }
    
    // Recommandation pour les problèmes de compatibilité
    if (issuesByType['compatibility'] && issuesByType['compatibility'] > 0) {
      recommendations.push({
        id: 'compatibility-improvements',
        title: 'Résolution des problèmes de compatibilité PHP',
        description: `${issuesByType['compatibility']} problèmes de compatibilité détectés qui pourraient causer des erreurs dans les versions récentes de PHP.`,
        severity: 'high',
        effort: 'high',
        category: 'compatibility',
        codeExamples: [{
          badCode: '$result = mysql_query("SELECT * FROM table");',
          goodCode: '$result = $mysqli->query("SELECT * FROM table");'
        }]
      });
    }
    
    // Recommandation générale pour le nettoyage du code
    if (issuesByType['clean-code'] && issuesByType['clean-code'] > 0) {
      recommendations.push({
        id: 'clean-code-improvements',
        title: 'Application des principes de code propre',
        description: `${issuesByType['clean-code']} opportunités d'amélioration du code identifiées. Un code plus propre sera plus facile à migrer et à maintenir.`,
        severity: 'low',
        effort: 'medium',
        category: 'clean-code',
        codeExamples: [{
          badCode: 'if ($status === 1000) { /* ... */ }',
          goodCode: 'const STATUS_ACTIVE = 1000;\n\nif ($status === STATUS_ACTIVE) { /* ... */ }'
        }]
      });
    }
    
    return recommendations;
  }
  
  /**
   * Évalue la sécurité de l'application
   */
  private evaluateApplicationSecurity(result: QAAnalysisResult): QAAnalysisResult['applicationSecuritySummary'] {
    // Compter les vulnérabilités de sécurité par sévérité
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let topVulnerabilities: string[] = [];
    
    // Parcourir tous les problèmes de sécurité
    result.fileResults.forEach(file => {
      file.issues.filter(issue => issue.type === 'security').forEach(issue => {
        switch (issue.severity) {
          case 'critical': criticalCount++; break;
          case 'high': highCount++; break;
          case 'medium': mediumCount++; break;
          case 'low': lowCount++; break;
        }
        
        // Collecter les principaux types de vulnérabilités
        const vulnerabilityType = issue.ruleId.split('.')[1];
        if (!topVulnerabilities.includes(vulnerabilityType)) {
          topVulnerabilities.push(vulnerabilityType);
        }
      });
    });
    
    // Limiter aux 5 principales vulnérabilités
    topVulnerabilities = topVulnerabilities.slice(0, 5);
    
    // Calculer le niveau de risque global
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (criticalCount > 0) {
      riskLevel = 'critical';
    } else if (highCount > 0) {
      riskLevel = 'high';
    } else if (mediumCount > 0) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // Calculer le score de sécurité (0-100)
    const totalVulnerabilities = criticalCount + highCount + mediumCount + lowCount;
    const securityScore = totalVulnerabilities === 0 ? 100 : Math.max(0, 100 - (
      criticalCount * 25 + 
      highCount * 10 + 
      mediumCount * 5 + 
      lowCount * 1
    ));
    
    return {
      riskLevel,
      vulnerabilitiesCount: totalVulnerabilities,
      securityScore,
      topVulnerabilities
    };
  }
  
  /**
   * Convertit les résultats de l'analyse en AnalyzerFinding[]
   */
  private convertToFindings(result: QAAnalysisResult): AnalyzerFinding[] {
    const findings: AnalyzerFinding[] = [];
    
    // Ajouter une découverte pour le score de qualité
    findings.push({
      id: 'quality-score',
      type: 'quality-metric',
      severity: this.getScoreSeverity(result.summary.qualityScore),
      message: `Score de qualité global : ${result.summary.qualityScore}/100`,
      metadata: { qualityScore: result.summary.qualityScore }
    });
    
    // Ajouter une découverte pour chaque recommandation
    result.recommendations.forEach(recommendation => {
      findings.push({
        id: recommendation.id,
        type: 'recommendation',
        severity: recommendation.severity,
        message: recommendation.title,
        description: recommendation.description,
        metadata: {
          category: recommendation.category,
          effort: recommendation.effort,
          codeExamples: recommendation.codeExamples,
          references: recommendation.references
        }
      });
    });
    
    // Ajouter une découverte pour chaque problème critique
    result.fileResults.forEach(file => {
      file.issues
        .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
        .forEach(issue => {
          findings.push({
            id: `issue-${file.filePath}-${issue.line}-${issue.ruleId}`,
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            location: file.filePath,
            lineNumber: issue.line,
            codeSnippet: issue.code,
            suggestedFix: issue.suggestedFix
          });
        });
    });
    
    // Ajouter une découverte pour le résumé de la sécurité
    if (result.applicationSecuritySummary) {
      findings.push({
        id: 'security-summary',
        type: 'security-assessment',
        severity: result.applicationSecuritySummary.riskLevel,
        message: `Niveau de risque de sécurité : ${result.applicationSecuritySummary.riskLevel} (score: ${result.applicationSecuritySummary.securityScore}/100)`,
        metadata: {
          securityScore: result.applicationSecuritySummary.securityScore,
          vulnerabilitiesCount: result.applicationSecuritySummary.vulnerabilitiesCount,
          topVulnerabilities: result.applicationSecuritySummary.topVulnerabilities
        }
      });
    }
    
    return findings;
  }
  
  /**
   * Détermine la sévérité en fonction du score
   */
  private getScoreSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (score < 50) return 'critical';
    if (score < 70) return 'high';
    if (score < 85) return 'medium';
    if (score < 95) return 'low';
    return 'info';
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
        id: 'security.sql-injection',
        name: 'Détection d\'injection SQL',
        description: 'Détecte les risques d\'injection SQL dans les requêtes non paramétrées',
        isEnabled: true,
        severity: 'critical'
      },
      {
        id: 'security.xss',
        name: 'Détection de XSS',
        description: 'Détecte les risques de cross-site scripting (XSS)',
        isEnabled: true,
        severity: 'critical'
      },
      {
        id: 'security.file-inclusion',
        name: 'Inclusion de fichier non sécurisée',
        description: 'Détecte les inclusions de fichiers à partir de données utilisateur',
        isEnabled: true,
        severity: 'critical'
      },
      {
        id: 'security.eval',
        name: 'Utilisation de eval()',
        description: 'Détecte l\'utilisation dangereuse de eval()',
        isEnabled: true,
        severity: 'critical'
      },
      {
        id: 'performance.loop-in-loop',
        name: 'Boucles imbriquées',
        description: 'Détecte les boucles imbriquées qui peuvent causer des problèmes de performance',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'performance.global-variable',
        name: 'Variables globales',
        description: 'Détecte l\'utilisation de variables globales',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'maintainability.long-function',
        name: 'Fonction trop longue',
        description: 'Détecte les fonctions trop longues qui devraient être refactorisées',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'maintainability.too-many-parameters',
        name: 'Trop de paramètres',
        description: 'Détecte les fonctions avec trop de paramètres',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'clean-code.magic-number',
        name: 'Nombres magiques',
        description: 'Détecte l\'utilisation de nombres magiques dans le code',
        isEnabled: true,
        severity: 'low'
      },
      {
        id: 'compatibility.mysql-deprecated',
        name: 'Fonctions mysql_* obsolètes',
        description: 'Détecte l\'utilisation de fonctions mysql_* obsolètes',
        isEnabled: true,
        severity: 'high'
      }
    ];
  }
  
  /**
   * Récupère les statistiques d'analyse
   */
  public async getAnalysisStats(): Promise<{
    processed: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const avgTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length 
      : 0;
    
    return {
      processed: this.processedFiles,
      issuesByType: this.issuesByType,
      issuesBySeverity: this.issuesBySeverity,
      averageProcessingTime: avgTime
    };
  }
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Réinitialiser l'état interne
    this.processedFiles = 0;
    this.issuesByType = {};
    this.issuesBySeverity = {};
    this.processingTimes = [];
  }
}

// Exporter une instance par défaut pour compatibilité
export default new QAAnalyzerV2();