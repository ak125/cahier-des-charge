import { BaseMcpAgent, AgentContext, AgentResult } from '../shared/BaseAgent';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Agent d'analyse PHP qui extrait la structure et la logique du code PHP
 * pour faciliter la migration vers Remix.
 */
export class PhpAnalyzerAgent extends BaseMcpAgent {
  name = 'php-analyzer';
  version = '1.2.0';
  description = 'Analyse le code PHP pour extraire la structure et préparer la migration vers Remix';

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      await this.logExecution(context, 'Démarrage de l\'analyse PHP');
      
      if (!context.sourceFile) {
        return {
          success: false,
          error: 'Aucun fichier source spécifié',
          duration: Date.now() - startTime
        };
      }

      // Vérifier que le fichier existe et peut être lu
      try {
        await fs.access(context.sourceFile);
      } catch (error) {
        return {
          success: false,
          error: `Le fichier source ${context.sourceFile} n'existe pas ou n'est pas accessible`,
          duration: Date.now() - startTime
        };
      }

      // Lire le contenu du fichier PHP
      const phpContent = await fs.readFile(context.sourceFile, 'utf-8');
      
      // Analyse du code PHP (logique simplifiée pour l'exemple)
      const analysis = await this.analyzePHP(phpContent);
      
      await this.logExecution(context, 'Analyse PHP terminée avec succès');
      
      return {
        success: true,
        data: analysis,
        duration: Date.now() - startTime,
        score: analysis.qualityScore
      };
    } catch (error) {
      await this.logExecution(context, `Erreur lors de l'analyse: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Valide que le contexte contient les informations nécessaires pour l'analyse
   */
  async validate(context: AgentContext): Promise<boolean> {
    // S'assurer que le contexte de base est valide
    const baseValidation = await super.validate(context);
    
    // Vérifier les conditions spécifiques à l'agent PHP Analyzer
    return baseValidation && 
           !!context.sourceFile && 
           context.sourceFile.endsWith('.php');
  }

  /**
   * Analyse le code PHP pour en extraire les informations importantes
   * @param phpContent Contenu du fichier PHP
   */
  private async analyzePHP(phpContent: string): Promise<{
    routes: any[];
    database: {
      tables: string[];
      queries: string[];
    };
    templates: string[];
    functions: any[];
    includeFiles: string[];
    globalVariables: string[];
    remixComponents: any[];
    qualityScore: number;
  }> {
    // Logique d'analyse simplifiée pour l'exemple
    const routes = this.extractRoutes(phpContent);
    const database = this.extractDatabaseInfo(phpContent);
    const templates = this.extractTemplates(phpContent);
    const functions = this.extractFunctions(phpContent);
    const includeFiles = this.extractIncludes(phpContent);
    const globalVariables = this.extractGlobalVariables(phpContent);
    
    // Génération de suggestions de composants Remix
    const remixComponents = this.suggestRemixComponents(phpContent, routes, templates);
    
    // Calcul d'un score de qualité
    const qualityScore = this.calculateQualityScore(
      phpContent, routes, database, templates, functions
    );
    
    return {
      routes,
      database,
      templates,
      functions,
      includeFiles,
      globalVariables,
      remixComponents,
      qualityScore
    };
  }

  private extractRoutes(phpContent: string): any[] {
    // Implémentation simplifiée
    // Recherche des patterns de routing dans PHP (htaccess, switch case, etc.)
    const routes = [];
    
    // Exemple simple: rechercher des motifs de URL dans les conditions
    const urlPatterns = phpContent.match(/\$_GET\['([^']+)'\]/g) || [];
    for (const pattern of urlPatterns) {
      routes.push({
        param: pattern.replace(/\$_GET\['([^']+)'\]/g, '$1'),
        type: 'GET'
      });
    }
    
    return routes;
  }

  private extractDatabaseInfo(phpContent: string): {
    tables: string[];
    queries: string[];
  } {
    // Extraction des requêtes SQL
    const sqlQueries = (phpContent.match(/(?:mysql_query|mysqli_query|query)\s*\(\s*['"]([^'"]+)['"]/g) || [])
      .map(q => q.replace(/(?:mysql_query|mysqli_query|query)\s*\(\s*['"]([^'"]+)['"]/g, '$1'));
    
    // Extraction des noms de tables (approximative)
    const tablePattern = /(?:FROM|UPDATE|INSERT INTO|DELETE FROM)\s+([a-zA-Z0-9_]+)/gi;
    const tables = new Set<string>();
    let match;
    while ((match = tablePattern.exec(phpContent)) !== null) {
      tables.add(match[1]);
    }
    
    return {
      tables: Array.from(tables),
      queries: sqlQueries
    };
  }

  private extractTemplates(phpContent: string): string[] {
    // Recherche des includes et requires qui pourraient être des templates
    const includePattern = /(?:include|require|include_once|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const templates = new Set<string>();
    let match;
    
    while ((match = includePattern.exec(phpContent)) !== null) {
      const file = match[1];
      if (file.includes('template') || file.includes('view') || file.endsWith('.tpl.php')) {
        templates.add(file);
      }
    }
    
    return Array.from(templates);
  }

  private extractFunctions(phpContent: string): any[] {
    // Extraction des fonctions définies dans le fichier
    const functionPattern = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
    const functions = [];
    let match;
    
    while ((match = functionPattern.exec(phpContent)) !== null) {
      functions.push({
        name: match[1],
        parameters: match[2].split(',').map(p => p.trim()),
        position: match.index
      });
    }
    
    return functions;
  }

  private extractIncludes(phpContent: string): string[] {
    // Extraction de tous les fichiers inclus
    const includePattern = /(?:include|require|include_once|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const includes = new Set<string>();
    let match;
    
    while ((match = includePattern.exec(phpContent)) !== null) {
      includes.add(match[1]);
    }
    
    return Array.from(includes);
  }

  private extractGlobalVariables(phpContent: string): string[] {
    // Extraction des variables globales
    const globalPattern = /global\s+\$([a-zA-Z0-9_]+)/g;
    const globals = new Set<string>();
    let match;
    
    while ((match = globalPattern.exec(phpContent)) !== null) {
      globals.add(match[1]);
    }
    
    // Ajouter les superglobales utilisées
    const superGlobals = ['_GET', '_POST', '_SESSION', '_COOKIE', '_SERVER', '_ENV', '_FILES'];
    for (const sg of superGlobals) {
      if (phpContent.includes('$' + sg)) {
        globals.add(sg);
      }
    }
    
    return Array.from(globals);
  }

  private suggestRemixComponents(
    phpContent: string, 
    routes: any[], 
    templates: string[]
  ): any[] {
    // Générateur de suggestions de composants Remix basé sur l'analyse PHP
    const components = [];
    
    // Ex: Si on trouve un formulaire, suggérer un composant Form de Remix
    if (phpContent.includes('<form')) {
      components.push({
        type: 'Form',
        description: 'Formulaire Remix avec validation',
        recommendation: 'Utiliser <Form> de Remix pour gérer la soumission'
      });
    }
    
    // Ex: Si on trouve une pagination, suggérer un composant Pagination
    if (phpContent.includes('pagination') || phpContent.match(/LIMIT\s+\d+\s*,\s*\d+/)) {
      components.push({
        type: 'Pagination',
        description: 'Pagination des résultats',
        recommendation: 'Créer un composant <Pagination> avec useSearchParams'
      });
    }
    
    return components;
  }

  private calculateQualityScore(
    phpContent: string, 
    routes: any[], 
    database: any, 
    templates: string[], 
    functions: any[]
  ): number {
    // Score basé sur différents facteurs
    let score = 100; // Score de base
    
    // Pénalités pour code obsolète ou difficile à migrer
    if (phpContent.includes('mysql_')) score -= 10; // mysql_ est obsolète
    if (phpContent.match(/echo\s+\$[a-zA-Z0-9_]+\s*;/g)) score -= 5; // echo direct sans échappement
    if (phpContent.includes('global $')) score -= 5; // utilisation de variables globales
    
    // Bonus pour pratiques facilitant la migration
    if (functions.length > 0) score += 5; // Code modulaire
    if (templates.length > 0) score += 5; // Séparation vue/logique
    if (phpContent.includes('PDO')) score += 10; // Utilisation de PDO
    
    // Limiter le score entre 0 et 100
    return Math.max(0, Math.min(100, score));
  }
}

export const phpAnalyzer = new PhpAnalyzerAgent();
