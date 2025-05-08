/**
 * Templates pour la migration manuelle des agents non-standards
 *
 * Ce fichier contient des templates pour aider à transformer différentes structures
 * d'agents en classes conformes à la nouvelle architecture abstraite.
 */

/**
 * Template pour transformer un agent basé sur un objet
 * (export const myAgent = {...}) en classe abstraite
 */
export const objectToClassTemplate = `
import { AbstractXXXAgent } from '../abstract-xxx';

// Définition des types d'entrée/sortie
interface InputType {
  // Définir les propriétés d'entrée
}

interface OutputType {
  // Définir les propriétés de sortie
}

// Transformation de l'objet en classe
export class XXXAgent extends AbstractXXXAgent<InputType, OutputType> {
  public id = 'xxx-agent';
  public name = 'XXX Agent';
  public description = 'Description de l\'agent';
  public version = '1.0.0';
  
  // Configuration spécifique de l'agent
  private config = {
    // Propriétés de configuration spécifiques
  };
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Code d'initialisation spécifique
  }
  
  /**
   * Méthode principale de l'agent (analyze, validate, generate ou orchestrate)
   */
  public async xxxMethod(input: InputType, context?: any): Promise<OutputType> {
    // Implémentation de la méthode principale
    
    // Retourner le résultat
    return {
      // Propriétés de sortie
    };
  }
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Code de nettoyage spécifique
  }
}

// Si l'agent était précédemment exporté comme singleton
// export const xxxAgent = new XXXAgent();
`;

/**
 * Template pour transformer un agent qui exporte une classe avec une méthode 'process'
 * en classe abstraite avec une méthode standardisée (analyze, validate, etc.)
 */
export const classToAbstractTemplate = `
import { AbstractXXXAgent } from '../abstract-xxx';

// Définition des types d'entrée/sortie
interface InputType {
  // Définir les propriétés d'entrée
}

interface OutputType {
  // Définir les propriétés de sortie
}

/**
 * Agent XXX adapté pour l'architecture abstraite
 */
export class XXXAgent extends AbstractXXXAgent<InputType, OutputType> {
  public id = 'xxx-agent';
  public name = 'XXX Agent';
  public description = 'Description de l\'agent';
  public version = '1.0.0';
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Code d'initialisation spécifique
  }
  
  /**
   * Méthode principale de l'agent (analyze, validate, generate ou orchestrate)
   * Remplace l'ancienne méthode 'process'
   */
  public async xxxMethod(input: InputType, context?: any): Promise<OutputType> {
    // Adapter le code de l'ancienne méthode 'process'
    
    // Retourner le résultat
    return {
      // Propriétés de sortie
    };
  }
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Code de nettoyage spécifique
  }
}
`;

/**
 * Template pour transformer un agent qui exporte une fonction
 * en classe abstraite
 */
export const functionToClassTemplate = `
import { AbstractXXXAgent } from '../abstract-xxx';

// Définition des types d'entrée/sortie
interface InputType {
  // Définir les propriétés d'entrée
}

interface OutputType {
  // Définir les propriétés de sortie
}

/**
 * Agent XXX adapté pour l'architecture abstraite
 */
export class XXXAgent extends AbstractXXXAgent<InputType, OutputType> {
  public id = 'xxx-agent';
  public name = 'XXX Agent';
  public description = 'Description de l\'agent';
  public version = '1.0.0';
  
  // Configuration et état spécifiques à l'agent
  private config = {
    // Propriétés de configuration
  };
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Code d'initialisation spécifique
  }
  
  /**
   * Méthode principale de l'agent (analyze, validate, generate ou orchestrate)
   * Encapsule la fonction exportée précédemment
   */
  public async xxxMethod(input: InputType, context?: any): Promise<OutputType> {
    // Adapter le code de l'ancienne fonction exportée
    
    // Retourner le résultat
    return {
      // Propriétés de sortie
    };
  }
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Code de nettoyage spécifique
  }
}

// Si besoin, vous pouvez garder la fonction originale pour compatibilité
// export async function originalFunction(params: any): Promise<any> {
//   const agent = new XXXAgent();
//   await agent.initialize();
//   const result = await agent.xxxMethod(params);
//   await agent.cleanup();
//   return result;
// }
`;

/**
 * Guide étape par étape pour la migration manuelle d'un agent
 */
export const migrationSteps = `
# Étapes pour la migration manuelle d'un agent

1. **Identifier le type d'agent** (analyzer, validator, generator ou orchestrator)

2. **Examiner la structure actuelle du fichier**
   - S'DoDoDoDotgit-il d'une classe, d'un objet, d'une fonction ?
   - Quelles sont les entrées/sorties actuelles ?
   - Y a-t-il des dépendances spécifiques ?

3. **Choisir le template approprié**
   - Pour un objet : objectToClassTemplate
   - Pour une classe : classToAbstractTemplate
   - Pour une fonction : functionToClassTemplate

4. **Adapter le template**
   - Remplacer XXX par le type d'agent (Analyzer, Validator, Generator ou Orchestrator)
   - Remplacer xxxMethod par la méthode principale (analyze, validate, generate ou orchestrate)
   - Définir correctement les types d'entrée/sortie
   - Transférer la logique de l'ancien code

5. **Implémenter le cycle de vie**
   - Ajouter l'initialisation dans initializeInternal()
   - Ajouter le nettoyage dans cleanupInternal()

6. **Tester la migration**
   - Exécuter les tests unitaires
   - Vérifier que l'agent fonctionne correctement
`;

/**
 * Exemple spécifique pour la migration de l'agent NestJSGenerator
 */
export const nestjsGeneratorMigrationExample = `
import { AbstractGeneratorAgent } from '../abstract-generator';
import { GenerationResult } from '../../core/interfaces/generator-agent';
import * as fs from 'fs';
import * as path from 'path';
import { PhpAnalysisResult } from '../../analyzers/php-analyzer/PhpAnalyzer-v2';
import { generatePrismaSchema } from '../../core/prisma-generator';

// Interface pour les données d'entrée spécifiques à NestJSGenerator
interface NestJSGeneratorInput {
  sourceFilePath: string;
  destinationPath: string;
  options?: {
    includeValidation?: boolean;
    includeSwagger?: boolean;
    includeTests?: boolean;
    [key: string]: any;
  }
}

// Interface pour le résultat de génération spécifique à NestJS
interface NestJSGenerationResult extends GenerationResult {
  // Propriétés spécifiques à NestJSGenerator
  nestComponents?: {
    controller?: string;
    service?: string;
    dto?: string;
    module?: string;
    [key: string]: string;
  }
}

/**
 * Agent de génération de code NestJS basé sur l'analyse de code PHP
 */
export class NestJSGeneratorAgent extends AbstractGeneratorAgent<NestJSGeneratorInput, NestJSGenerationResult> {
  public id = 'NestjsGenerator';
  public name = 'NestJS Generator';
  public description = 'Générateur de code NestJS à partir de code PHP';
  public version = '2.0.0';

  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Vérifier que les dépendances nécessaires sont disponibles
    // ...
  }

  /**
   * Génère du code NestJS à partir d'un fichier PHP source
   */
  public async generate(input: NestJSGeneratorInput, context?: any): Promise<NestJSGenerationResult> {
    try {
      const { sourceFilePath, destinationPath, options = {} } = input;
      
      // Vérifier que les fichiers existent
      if (!fs.existsSync(sourceFilePath)) {
        throw new Error(\`Le fichier source \${sourceFilePath} n'existe pas\`);
      }
      
      // Créer le répertoire de destination s'il n'existe pas
      if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
      }
      
      // Analyser le fichier PHP (logique existante)
      // ...
      
      // Générer les composants NestJS (logique existante)
      const nestComponents = await this.generateNestJSComponents(
        /* paramètres existants */
      );
      
      // Générer le schéma Prisma si nécessaire (logique existante)
      await this.generatePrismaSchema(/* paramètres existants */);
      
      // Préparer le résultat
      return {
        success: true,
        generatedFiles: Object.keys(nestComponents).map(key => ({
          path: path.join(destinationPath, \`\${key}.ts\`),
          content: nestComponents[key],
          type: key
        })),
        nestComponents
      };
    } catch (error) {
      return {
        success: false,
        generatedFiles: [],
        error: error.message
      };
    }
  }
  
  // Méthodes existantes à conserver
  // ...
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Aucune ressource à nettoyer
  }
}

// Exporter une instance par défaut pour compatibilité
export default new NestJSGeneratorAgent();
`;

/**
 * Exemple spécifique pour la migration de l'agent QAAnalyzer
 */
export const qaAnalyzerMigrationExample = `
import { AbstractAnalyzerAgent } from '../abstract-analyzer';
import { AnalysisResult, AnalyzerFinding, AnalysisStats } from '../../core/interfaces/analyzer-agent';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Interface pour les données d'entrée de l'analyseur QA
interface QAAnalyzerInput {
  sourcePhpPath: string;
  generatedFiles: Record<string, string>;
  options?: QAAnalyzerOptions;
}

// Interface pour les options
interface QAAnalyzerOptions {
  // Options spécifiques à QA
  // ...
}

// Interface pour les résultats
interface QAAnalysisResult {
  issues: QAIssue[];
  statistics: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    score: number;
  };
  fieldAnalysis: {
    phpFields: string[];
    mappedFields: string[];
    unmappedFields: string[];
    coverage: number;
  };
}

interface QAIssue {
  // Structure des problèmes QA
  // ...
}

/**
 * Agent d'analyse de qualité pour la migration PHP -> React
 */
export class QAAnalyzerAgent extends AbstractAnalyzerAgent<QAAnalyzerInput, QAAnalysisResult> {
  public id = 'QaAnalyzer';
  public name = 'Quality Analysis Agent';
  public description = 'Analyse la qualité de la migration PHP vers React';
  public version = '2.0.0';
  
  // État interne
  private sourcePhpPath: string;
  private generatedFiles: Record<string, string>;
  private options: QAAnalyzerOptions;
  private qaResult: QAAnalysisResult;
  
  /**
   * Initialisation de l'agent
   */
  protected async initializeInternal(): Promise<void> {
    // Initialisation de l'état interne si nécessaire
    this.qaResult = {
      issues: [],
      statistics: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        score: 0
      },
      fieldAnalysis: {
        phpFields: [],
        mappedFields: [],
        unmappedFields: [],
        coverage: 0
      }
    };
  }
  
  /**
   * Analyse de la qualité de la migration
   */
  public async analyze(input: QAAnalyzerInput, context?: any): Promise<AnalysisResult<QAAnalysisResult>> {
    try {
      // Extraire les paramètres
      this.sourcePhpPath = input.sourcePhpPath;
      this.generatedFiles = input.generatedFiles;
      this.options = input.options || {};
      
      // Effectuer l'analyse (code existant)
      await this.runAnalysisProcess();
      
      // Convertir le résultat spécifique en résultat générique
      const findings: AnalyzerFinding[] = this.qaResult.issues.map(issue => ({
        id: \`qa-\${issue.id || Math.random().toString(36).substring(2, 10)}\`,
        type: issue.type || 'qa-issue',
        severity: issue.severity || 'medium',
        message: issue.message,
        location: issue.location,
        lineNumber: issue.lineNumber,
        suggestedFix: issue.suggestedFix
      }));
      
      // Calculer des statistiques
      const stats: AnalysisStats = {
        totalFiles: Object.keys(this.generatedFiles).length,
        totalLines: 0, // À calculer si nécessaire
        totalFindings: findings.length,
        findingsByType: this.calculateFindingsByType(findings),
        findingsBySeverity: this.calculateFindingsBySeverity(findings)
      };
      
      return {
        success: true,
        data: this.qaResult,
        findings,
        stats,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        findings: [{
          id: 'qa-analysis-error',
          type: 'error',
          severity: 'critical',
          message: \`Erreur lors de l'analyse QA: \${error.message}\`
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Exécute le processus d'analyse complet
   */
  private async runAnalysisProcess(): Promise<void> {
    // Code existant pour l'analyse
    // ...
  }
  
  // Méthodes d'analyse existantes à conserver
  // ...
  
  /**
   * Calcule les statistiques par type de découverte
   */
  private calculateFindingsByType(findings: AnalyzerFinding[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const finding of findings) {
      result[finding.type] = (result[finding.type] || 0) + 1;
    }
    
    return result;
  }
  
  /**
   * Calcule les statistiques par sévérité
   */
  private calculateFindingsBySeverity(findings: AnalyzerFinding[]): Record<string, number> {
    const result: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    for (const finding of findings) {
      result[finding.severity] = (result[finding.severity] || 0) + 1;
    }
    
    return result;
  }
  
  /**
   * Nettoyage des ressources
   */
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources si nécessaire
  }
}

/**
 * Pour compatibilité avec le code existant
 */
export async function runQAAnalyzer(
  sourcePhpPath: string,
  generatedFiles: Record<string, string>,
  options: QAAnalyzerOptions = {}
): Promise<QAAnalysisResult> {
  const analyzer = new QAAnalyzerAgent();
  await analyzer.initialize();
  
  const result = await analyzer.analyze({
    sourcePhpPath,
    generatedFiles,
    options
  });
  
  await analyzer.cleanup();
  
  if (!result.success) {
    throw new Error(\`L'analyse QA a échoué: \${result.findings[0]?.message}\`);
  }
  
  return result.data;
}
`;

/**
 * Comment utiliser les templates de migration manuelle
 */
export const usageInstructions = `
# Comment utiliser les templates de migration manuelle

Pour migrer un agent qui n'a pas pu être migré automatiquement:

1. Identifiez le type d'agent (analyzer, validator, generator, orchestrator)
2. Copiez le template approprié de ce fichier
3. Créez un nouveau fichier pour l'agent migré (par exemple, agent-name-v2.ts)
4. Adaptez le template à l'agent spécifique
5. Transférez la logique de l'ancien agent vers le nouveau
6. Testez le nouvel agent pour vous assurer qu'il fonctionne correctement
7. Mettez à jour les références à l'ancien agent

## Exemple de commande pour créer un nouveau fichier d'agent

\`\`\`bash
# Pour un agent d'analyse
cp /workspaces/cahier-des-charge/scripts/manual-migration-templates.ts /workspaces/cahier-des-charge/packagesDoDotmcp-agents/analyzers/my-analyzer-v2.ts
\`\`\`

## Exécuter les tests après migration

\`\`\`bash
# Exécuter les tests de migration
npm test -- -t "Test de migration des agents"
\`\`\`
`;
