import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { AnalyzerAgent,BusinessAgent  } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
import * as fs from 'fs-extra';;
import * as path from 'path';

interface ImpactGraph {
  nodes: string[];
  edges: [string, string][];
}

export class DependencyAgent implements BusinessAgent, AnalyzerAgent extends BaseAgent {
  private impactGraph: ImpactGraph = { nodes: [], edges: [] };
  
  /**
   * Analyse les dépendances et les inclusions du fichier PHP
   */
  public async analyze(): Promise<void> {
    // Identifier les fichiers inclus
    const includedFiles = this.identifyIncludedFiles();
    
    // Analyser les appels croisés (variables globales, etc.)
    const crossCalls = this.analyzeCrossCalls();
    
    // Analyser les utilisations de session
    const sessionUsage = this.analyzeSessionUsage();
    
    // Générer l'impact graph
    await this.generateImpactGraph();
    
    // Générer les sections d'audit
    this.addSection(
      'included-files',
      'Fichiers inclus',
      includedFiles,
      'dependencies'
    );
    
    this.addSection(
      'cross-calls',
      'Appels croisés',
      crossCalls,
      'dependencies'
    );
    
    this.addSection(
      'session-state',
      'Session & state',
      sessionUsage,
      'dependencies'
    );
  }
  
  /**
   * Identifie les fichiers inclus dans le code PHP
   */
  private identifyIncludedFiles(): string {
    const fileContent = this.fileContent;
    let includedFiles = '';
    
    // Détecter les includes et requires
    const includeMatches = fileContent.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/g);
    const requireMatches = fileContent.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/g);
    
    const includes: string[] = [];
    
    if (includeMatches) {
      includeMatches.forEach(match => {
        const file = match.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/)[1];
        includes.push(file);
      });
    }
    
    if (requireMatches) {
      requireMatches.forEach(match => {
        const file = match.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/)[1];
        includes.push(file);
      });
    }
    
    // Regrouper par type (config, template, core, etc.)
    const configFiles = includes.filter(file => 
      file.includes('config') || file.includes('conf') || file.includes('settings')
    );
    
    const templateFiles = includes.filter(file => 
      file.includes('tpl') || file.includes('template') || file.includes('view')
    );
    
    const coreFiles = includes.filter(file => 
      file.includes('core') || file.includes('common') || file.includes('functions')
    );
    
    const otherFiles = includes.filter(file => 
      !configFiles.includes(file) && !templateFiles.includes(file) && !coreFiles.includes(file)
    );
    
    // Construire la sortie
    if (configFiles.length > 0) {
      includedFiles += `- Fichiers de configuration : ${configFiles.join(', ')}\n`;
    }
    
    if (templateFiles.length > 0) {
      includedFiles += `- Templates : ${templateFiles.join(', ')}\n`;
    }
    
    if (coreFiles.length > 0) {
      includedFiles += `- Fichiers core : ${coreFiles.join(', ')}\n`;
    }
    
    if (otherFiles.length > 0) {
      includedFiles += `- Autres inclusions : ${otherFiles.join(', ')}\n`;
    }
    
    // Si aucun fichier n'a été inclus
    if (includedFiles === '') {
      includedFiles = "Aucun fichier inclus détecté.";
    }
    
    return includedFiles;
  }
  
  /**
   * Analyse les appels croisés (variables globales, etc.)
   */
  private analyzeCrossCalls(): string {
    const fileContent = this.fileContent;
    let crossCalls = '';
    
    // Détecter les variables globales
    const globalVariables = this.extractGlobalVariables(fileContent);
    if (globalVariables.length > 0) {
      crossCalls += `- Variables globales : ${globalVariables.join(', ')}\n`;
    }
    
    // Détecter les fonctions définies ailleurs
    const externalFunctions = this.extractExternalFunctionCalls(fileContent);
    if (externalFunctions.length > 0) {
      crossCalls += `- Fonctions externes : ${externalFunctions.join(', ')}\n`;
    }
    
    // Détecter les définitions de constantes
    const constants = fileContent.match(/define\s*\(\s*["'](\w+)["']/g);
    if (constants && constants.length > 0) {
      const constantNames = constants.map(c => c.match(/define\s*\(\s*["'](\w+)["']/)[1]);
      crossCalls += `- Constantes définies : ${constantNames.join(', ')}\n`;
    }
    
    // Si aucun appel croisé n'a été détecté
    if (crossCalls === '') {
      crossCalls = "Aucun appel croisé détecté.";
    }
    
    return crossCalls;
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
   * Analyse l'utilisation des sessions
   */
  private analyzeSessionUsage(): string {
    const fileContent = this.fileContent;
    let sessionUsage = '';
    
    // Vérifier si la session est démarrée
    if (fileContent.includes('session_start()')) {
      sessionUsage += "- Démarre une session PHP\n";
    }
    
    // Extraire les clés de session utilisées
    const sessionKeys = this.extractSessionKeys(fileContent);
    if (sessionKeys.length > 0) {
      sessionUsage += `- Utilise les variables de session : ${sessionKeys.join(', ')}\n`;
    }
    
    // Vérifier s'il y a destruction de session
    if (fileContent.includes('session_destroy()')) {
      sessionUsage += "- Détruit la session\n";
    }
    
    // Vérifier s'il y a manipulation des cookies
    if (fileContent.includes('setcookie(') || fileContent.includes('$_COOKIE')) {
      sessionUsage += "- Utilise des cookies\n";
    }
    
    // Si aucune utilisation de session n'a été détectée
    if (sessionUsage === '') {
      sessionUsage = "Aucune utilisation de session détectée.";
    }
    
    return sessionUsage;
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
  private async generateImpactGraph(): Promise<void> {
    const baseFilename = path.basename(this.filePath);
    
    // Ajouter le nœud principal
    this.impactGraph.nodes.push(baseFilename);
    
    // Extraire les fichiers inclus
    const includes = this.extractIncludes(this.fileContent);
    
    // Ajouter les nœuds et arêtes pour les includes
    includes.forEach(include => {
      if (!this.impactGraph.nodes.includes(include)) {
        this.impactGraph.nodes.push(include);
      }
      this.impactGraph.edges.push([baseFilename, include]);
    });
    
    // Détecter le nom potentiel du contrôleur
    const controllerName = baseFilename.replace('.php', 'Controller');
    const potentialController = `controller/${controllerName}`;
    this.impactGraph.nodes.push(potentialController);
    this.impactGraph.edges.push([baseFilename, potentialController]);
    
    // Enregistrer le graphe d'impact
    await this.saveImpactGraph();
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
    
    return includes;
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
      throw new Error(`Erreur lors de la sauvegarde du graphe d'impact: ${error.message}`);
    }
  }
}
