import { AbstractAnalyzerAgent } from '../abstract-analyzer';
import { AnalysisResult, AnalyzerFinding, AnalysisStats } from '../../core/interfaces/analyzer-agent';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Interface pour les données d'entrée de l'analyseur de dépendances
 */
interface DependencyAnalyzerInput {
  filePath: string;                 // Chemin du fichier PHP à analyser
  fileContent?: string;             // Contenu du fichier PHP (optionnel)
  options?: {
    saveImpactGraph?: boolean;      // Sauvegarder le graphe d'impact dans un fichier
    analyzeIncludes?: boolean;      // Analyser les includes et requires
    analyzeCrossCalls?: boolean;    // Analyser les appels croisés
    analyzeSessionUsage?: boolean;  // Analyser l'utilisation des sessions
    followIncludes?: boolean;       // Suivre et analyser les fichiers inclus
    recursionDepth?: number;        // Profondeur maximale pour l'analyse récursive
    [key: string]: any;             // Autres options personnalisées
  };
}

/**
 * Interface pour le graphe d'impact
 */
interface ImpactGraph {
  nodes: string[];                  // Nœuds du graphe (fichiers)
  edges: [string, string][];        // Arêtes du graphe (dépendances)
}

/**
 * Interface pour les résultats de l'analyse de dépendances
 */
interface DependencyAnalysisResult {
  includedFiles: {
    config: string[];               // Fichiers de configuration inclus
    templates: string[];            // Templates inclus
    core: string[];                 // Fichiers core inclus
    other: string[];                // Autres fichiers inclus
    raw: string[];                  // Liste brute de tous les fichiers inclus
  };
  crossCalls: {
    globalVariables: string[];      // Variables globales utilisées
    externalFunctions: string[];    // Fonctions externes appelées
    constants: string[];            // Constantes définies
  };
  sessionUsage: {
    startsSession: boolean;         // Si le script démarre une session
    sessionKeys: string[];          // Clés de session utilisées
    destroysSession: boolean;       // Si le script détruit la session
    usesCookies: boolean;           // Si le script utilise des cookies
  };
  impactGraph: ImpactGraph;         // Graphe d'impact des dépendances
}

/**
 * Agent d'analyse de dépendances PHP
 * 
 * Cet agent analyse les dépendances, les inclusions de fichiers, les appels croisés,
 * et l'utilisation des sessions dans un fichier PHP pour faciliter la migration.
 */
export class DependencyAnalyzerAgent extends AbstractAnalyzerAgent<DependencyAnalyzerInput, DependencyAnalysisResult> {
  public id = 'dependency-analyzer';
  public name = 'Dependency Analyzer';
  public description = 'Analyse les dépendances, inclusions et état dans le code PHP';
  public version = '2.0.0';
  
  // État interne
  private filePath: string = '';
  private fileContent: string = '';
  private impactGraph: ImpactGraph = { nodes: [], edges: [] };
  private processedFiles: number = 0;
  private issuesByType: Record<string, number> = {};
  private processingTimes: number[] = [];
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Réinitialiser l'état
    this.impactGraph = { nodes: [], edges: [] };
    this.processedFiles = 0;
    this.issuesByType = {};
    this.processingTimes = [];
  }
  
  /**
   * Valide les données d'entrée
   */
  public async validateInput(input: DependencyAnalyzerInput): Promise<boolean> {
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
   * Analyse les dépendances d'un fichier PHP
   */
  public async analyze(input: DependencyAnalyzerInput, context?: any): Promise<AnalysisResult<DependencyAnalysisResult>> {
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
          this.fileContent = await fs.readFile(this.filePath, 'utf8');
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
        saveImpactGraph: true,
        analyzeIncludes: true,
        analyzeCrossCalls: true,
        analyzeSessionUsage: true
      };
      
      // Préparer le résultat
      const result: DependencyAnalysisResult = {
        includedFiles: {
          config: [],
          templates: [],
          core: [],
          other: [],
          raw: []
        },
        crossCalls: {
          globalVariables: [],
          externalFunctions: [],
          constants: []
        },
        sessionUsage: {
          startsSession: false,
          sessionKeys: [],
          destroysSession: false,
          usesCookies: false
        },
        impactGraph: { nodes: [], edges: [] }
      };
      
      // Collecter les découvertes (findings)
      const findings: AnalyzerFinding[] = [];
      
      // Effectuer l'analyse des dépendances
      if (options.analyzeIncludes !== false) {
        // Analyser les includes et requires
        const rawIncludes = this.extractIncludes(this.fileContent);
        result.includedFiles.raw = rawIncludes;
        
        // Catégoriser les fichiers inclus
        result.includedFiles.config = rawIncludes.filter(file => 
          file.includes('config') || file.includes('conf') || file.includes('settings')
        );
        
        result.includedFiles.templates = rawIncludes.filter(file => 
          file.includes('tpl') || file.includes('template') || file.includes('view')
        );
        
        result.includedFiles.core = rawIncludes.filter(file => 
          file.includes('core') || file.includes('common') || file.includes('functions')
        );
        
        result.includedFiles.other = rawIncludes.filter(file => 
          !result.includedFiles.config.includes(file) && 
          !result.includedFiles.templates.includes(file) && 
          !result.includedFiles.core.includes(file)
        );
        
        // Ajouter des découvertes pour les fichiers inclus
        this.addIncludesFindings(result.includedFiles, findings);
      }
      
      if (options.analyzeCrossCalls !== false) {
        // Analyser les variables globales
        result.crossCalls.globalVariables = this.extractGlobalVariables(this.fileContent);
        
        // Analyser les appels de fonctions externes
        result.crossCalls.externalFunctions = this.extractExternalFunctionCalls(this.fileContent);
        
        // Analyser les constantes définies
        const constantMatches = this.fileContent.match(/define\s*\(\s*["'](\w+)["']/g);
        if (constantMatches) {
          result.crossCalls.constants = constantMatches.map(c => {
            const match = c.match(/define\s*\(\s*["'](\w+)["']/);
            return match ? match[1] : '';
          }).filter(Boolean);
        }
        
        // Ajouter des découvertes pour les appels croisés
        this.addCrossCallsFindings(result.crossCalls, findings);
      }
      
      if (options.analyzeSessionUsage !== false) {
        // Analyser l'utilisation des sessions
        result.sessionUsage.startsSession = this.fileContent.includes('session_start()');
        result.sessionUsage.sessionKeys = this.extractSessionKeys(this.fileContent);
        result.sessionUsage.destroysSession = this.fileContent.includes('session_destroy()');
        result.sessionUsage.usesCookies = this.fileContent.includes('setcookie(') || this.fileContent.includes('$_COOKIE');
        
        // Ajouter des découvertes pour l'utilisation des sessions
        this.addSessionUsageFindings(result.sessionUsage, findings);
      }
      
      // Générer et sauvegarder le graphe d'impact
      this.impactGraph = await this.generateImpactGraph();
      result.impactGraph = this.impactGraph;
      
      if (options.saveImpactGraph) {
        await this.saveImpactGraph();
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
          message: `Erreur lors de l'analyse des dépendances: ${error.message}`
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Ajoute des découvertes concernant les fichiers inclus
   */
  private addIncludesFindings(includedFiles: DependencyAnalysisResult['includedFiles'], findings: AnalyzerFinding[]): void {
    const totalIncludes = includedFiles.raw.length;
    
    if (totalIncludes > 0) {
      findings.push({
        id: 'file-includes',
        type: 'include-dependency',
        severity: 'info',
        message: `Détecté ${totalIncludes} fichiers inclus`,
        metadata: { includedFiles }
      });
      
      // Trouver les inclusions potentiellement dangereuses (chemins dynamiques)
      const dynamicIncludes = this.detectDynamicIncludes(this.fileContent);
      if (dynamicIncludes.length > 0) {
        findings.push({
          id: 'dynamic-includes',
          type: 'security-concern',
          severity: 'high',
          message: 'Inclusions dynamiques détectées (risque d\'injection de fichier)',
          location: this.filePath,
          codeSnippet: dynamicIncludes.join('\n'),
          suggestedFix: 'Remplacer par des imports statiques ou valider strictement les chemins'
        });
      }
      
      // Recommandations pour la migration
      if (includedFiles.templates.length > 0) {
        findings.push({
          id: 'template-dependencies',
          type: 'migration-task',
          severity: 'medium',
          message: `${includedFiles.templates.length} templates à migrer vers des composants React`,
          suggestedFix: 'Convertir les templates PHP en composants React dans Remix'
        });
      }
      
      if (includedFiles.config.length > 0) {
        findings.push({
          id: 'config-dependencies',
          type: 'migration-task',
          severity: 'medium',
          message: `${includedFiles.config.length} fichiers de configuration à migrer`,
          suggestedFix: 'Convertir en configuration NestJS ou variables d\'environnement'
        });
      }
    }
  }
  
  /**
   * Détecte les inclusions dynamiques (potentiellement dangereuses)
   */
  private detectDynamicIncludes(content: string): string[] {
    const dynamicIncludes: string[] = [];
    
    // Rechercher les patterns d'inclusion dynamique
    const patterns = [
      /include(?:_once)?\s*\(\s*\$\w+/g,
      /require(?:_once)?\s*\(\s*\$\w+/g,
      /include(?:_once)?\s*\(\s*[^"']/g,
      /require(?:_once)?\s*\(\s*[^"']/g
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        dynamicIncludes.push(...matches);
      }
    });
    
    return dynamicIncludes;
  }
  
  /**
   * Ajoute des découvertes concernant les appels croisés
   */
  private addCrossCallsFindings(crossCalls: DependencyAnalysisResult['crossCalls'], findings: AnalyzerFinding[]): void {
    // Ajouter une découverte pour les variables globales
    if (crossCalls.globalVariables.length > 0) {
      findings.push({
        id: 'global-variables',
        type: 'state-management',
        severity: 'high',
        message: `Utilisation de ${crossCalls.globalVariables.length} variables globales`,
        metadata: { variables: crossCalls.globalVariables },
        suggestedFix: 'Remplacer les variables globales par des services ou context React'
      });
    }
    
    // Ajouter une découverte pour les fonctions externes
    if (crossCalls.externalFunctions.length > 0) {
      findings.push({
        id: 'external-functions',
        type: 'code-dependency',
        severity: 'medium',
        message: `Appel à ${crossCalls.externalFunctions.length} fonctions externes`,
        metadata: { functions: crossCalls.externalFunctions },
        suggestedFix: 'Regrouper les fonctions dans des services ou utilitaires'
      });
    }
    
    // Ajouter une découverte pour les constantes
    if (crossCalls.constants.length > 0) {
      findings.push({
        id: 'constants',
        type: 'config-dependency',
        severity: 'low',
        message: `Définition de ${crossCalls.constants.length} constantes`,
        metadata: { constants: crossCalls.constants },
        suggestedFix: 'Migrer vers des fichiers de constantes ou configuration NestJS'
      });
    }
  }
  
  /**
   * Ajoute des découvertes concernant l'utilisation des sessions
   */
  private addSessionUsageFindings(sessionUsage: DependencyAnalysisResult['sessionUsage'], findings: AnalyzerFinding[]): void {
    if (sessionUsage.startsSession || sessionUsage.sessionKeys.length > 0 || sessionUsage.usesCookies) {
      findings.push({
        id: 'session-usage',
        type: 'state-management',
        severity: 'medium',
        message: 'Gestion d\'état avec session ou cookies détectée',
        metadata: { sessionUsage },
        suggestedFix: sessionUsage.sessionKeys.length > 0 
          ? 'Migrer vers sessions NestJS et cookies sécurisés ou état client React'
          : 'Considérer l\'utilisation de contexte React ou state management'
      });
      
      // Si utilisation intensive des sessions
      if (sessionUsage.sessionKeys.length > 5) {
        findings.push({
          id: 'heavy-session-usage',
          type: 'architecture-concern',
          severity: 'high',
          message: `Utilisation intensive des sessions (${sessionUsage.sessionKeys.length} clés)`,
          suggestedFix: 'Considérer une solution robuste de state management comme Redux ou Context API'
        });
      }
    }
  }
  
  /**
   * Extrait les chemins des fichiers inclus
   */
  private extractIncludes(content: string): string[] {
    const includes: string[] = [];
    
    // Rechercher les includes et requires
    const patterns = [
      /include(?:_once)?\s*\(['"](.*?)['"].*?\)/g,
      /require(?:_once)?\s*\(['"](.*?)['"].*?\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        includes.push(match[1]);
      }
    });
    
    return [...new Set(includes)];
  }
  
  /**
   * Extrait les variables globales du code PHP
   */
  private extractGlobalVariables(content: string): string[] {
    const globalVars: string[] = [];
    
    // Détecter les déclarations global
    const globalDeclarations = content.match(/global\s+\$(\w+)/g);
    if (globalDeclarations) {
      globalDeclarations.forEach(declaration => {
        const match = declaration.match(/global\s+\$(\w+)/);
        if (match) {
          globalVars.push(match[1]);
        }
      });
    }
    
    // Détecter les accès à $GLOBALS
    const globalsAccess = content.match(/\$GLOBALS\[["'](\w+)["']\]/g);
    if (globalsAccess) {
      globalsAccess.forEach(access => {
        const match = access.match(/\$GLOBALS\[["'](\w+)["']\]/);
        if (match) {
          globalVars.push(match[1]);
        }
      });
    }
    
    return [...new Set(globalVars)];
  }
  
  /**
   * Extrait les appels de fonctions externes
   */
  private extractExternalFunctionCalls(content: string): string[] {
    // Extraire toutes les fonctions appelées
    const functionCalls = content.match(/\b(\w+)\s*\(/g);
    if (!functionCalls) return [];
    
    // Nettoyer les noms de fonctions
    const calledFunctions = functionCalls.map(call => {
      return call.replace(/\s*\($/, '');
    });
    
    // Filtrer les fonctions natives PHP
    const phpNativeFunctions = [
      'echo', 'print', 'include', 'require', 'include_once', 'require_once',
      'array', 'isset', 'empty', 'die', 'exit', 'print_r', 'var_dump',
      'count', 'strlen', 'strpos', 'str_replace', 'explode', 'implode',
      'json_encode', 'json_decode', 'date', 'time', 'mktime', 'header'
    ];
    
    // Extraire les fonctions définies dans le fichier
    const definedFunctions = content.match(/function\s+(\w+)\s*\(/g) || [];
    const internalFunctions = definedFunctions.map(func => {
      return func.replace(/function\s+/, '').replace(/\s*\($/, '');
    });
    
    // Filtrer pour obtenir uniquement les fonctions externes
    return [...new Set(calledFunctions)]
      .filter(func => 
        !phpNativeFunctions.includes(func) && 
        !internalFunctions.includes(func)
      );
  }
  
  /**
   * Extrait les clés de session utilisées
   */
  private extractSessionKeys(content: string): string[] {
    const sessionKeys: string[] = [];
    
    // Rechercher les accès à $_SESSION
    const sessionAccess = content.match(/\$_SESSION\[["'](\w+)["']\]/g);
    if (sessionAccess) {
      sessionAccess.forEach(access => {
        const match = access.match(/\$_SESSION\[["'](\w+)["']\]/);
        if (match) {
          sessionKeys.push(match[1]);
        }
      });
    }
    
    return [...new Set(sessionKeys)];
  }
  
  /**
   * Génère le graphe d'impact des dépendances
   */
  private async generateImpactGraph(): Promise<ImpactGraph> {
    const impactGraph: ImpactGraph = { nodes: [], edges: [] };
    const baseFilename = path.basename(this.filePath);
    
    // Ajouter le nœud principal
    impactGraph.nodes.push(baseFilename);
    
    // Extraire les fichiers inclus
    const includes = this.extractIncludes(this.fileContent);
    
    // Ajouter les nœuds et arêtes pour les includes
    includes.forEach(include => {
      if (!impactGraph.nodes.includes(include)) {
        impactGraph.nodes.push(include);
      }
      impactGraph.edges.push([baseFilename, include]);
    });
    
    // Détecter le nom potentiel du contrôleur
    if (baseFilename.endsWith('.php')) {
      const controllerName = baseFilename.replace('.php', 'Controller');
      const potentialController = `controller/${controllerName}`;
      
      if (!impactGraph.nodes.includes(potentialController)) {
        impactGraph.nodes.push(potentialController);
      }
      
      impactGraph.edges.push([baseFilename, potentialController]);
    }
    
    return impactGraph;
  }
  
  /**
   * Enregistre le graphe d'impact généré
   */
  private async saveImpactGraph(): Promise<void> {
    const baseFilename = path.basename(this.filePath);
    const dirPath = path.dirname(this.filePath);
    const outputPath = path.join(dirPath, `${baseFilename}.impact_graph.json`);
    
    try {
      await fs.writeFile(outputPath, JSON.stringify(this.impactGraph, null, 2), 'utf8');
      console.log(`✅ Graphe d'impact enregistré dans ${outputPath}`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du graphe d'impact: ${(error as Error).message}`);
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
        id: 'include-dependency',
        name: 'Dépendances d\'inclusion',
        description: 'Détecte les fichiers inclus via include/require et leurs relations',
        isEnabled: true,
        severity: 'info'
      },
      {
        id: 'security-concern',
        name: 'Préoccupations de Sécurité',
        description: 'Détecte les inclusions dynamiques et autres problèmes de sécurité',
        isEnabled: true,
        severity: 'high'
      },
      {
        id: 'state-management',
        name: 'Gestion d\'État',
        description: 'Détecte l\'utilisation de sessions et variables globales',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'code-dependency',
        name: 'Dépendances de Code',
        description: 'Identifie les appels à des fonctions externes',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'migration-task',
        name: 'Tâches de Migration',
        description: 'Identifie les tâches spécifiques à accomplir lors de la migration',
        isEnabled: true,
        severity: 'medium'
      },
      {
        id: 'config-dependency',
        name: 'Dépendances de Configuration',
        description: 'Détecte les constants et configurations utilisées',
        isEnabled: true,
        severity: 'low'
      },
      {
        id: 'architecture-concern',
        name: 'Préoccupations d\'Architecture',
        description: 'Identifie les problèmes potentiels d\'architecture lors de la migration',
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
    this.impactGraph = { nodes: [], edges: [] };
  }
}

// Exporter une instance par défaut pour compatibilité
export default new DependencyAnalyzerAgent();