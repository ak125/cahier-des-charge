// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractGeneratorAgent, GeneratorConfig } from '../../core/abstract-generator-agent';
import { AgentContext } from '../../core/mcp-agent';

/**
 * BaseGeneratorAgent - Classe de base pour tous les agents de génération
 * 
 * Cette classe implémente la couche d'abstraction pour les agents de génération
 * et fournit des fonctionnalités communes à tous les générateurs.
 */

import { BaseMcpAgent, AgentContext, AgentResult, AgentConfig } from '../core/interfaces';

// Configuration spécifique aux agents de génération
export interface GeneratorAgentConfig extends AgentConfig {
  // Configurations spécifiques aux générateurs
  outputDir?: string;
  overwriteExisting?: boolean;
  templatePath?: string;
  templateVars?: Record<string, any>;
  prettify?: boolean;
  dryRun?: boolean;
}

// Résultat spécifique aux agents de génération
export interface GenerationResult {
  // Résultats spécifiques aux générateurs
  generatedFiles: Array<{
    path: string;
    type: string;
    size: number;
    content?: string; // Optionnel: uniquement si demandé explicitement
  }>;
  summary: {
    totalFiles: number;
    totalSize: number;
    duration: number;
  };
  warnings?: string[];
}

/**
 * Classe de base pour les agents de génération
 */
export abstract class BaseGeneratorAgent extends BaseMcpAgent<GenerationResult, GeneratorAgentConfig> {
  /**
   * Exécute la génération et retourne le résultat
   */
  async execute(context: AgentContext): Promise<AgentResult<GenerationResult>> {
    return this.executeWithMetrics(context, async () => {
      // Valider le contexte
      if (!(await this.validate(context))) {
        return {
          success: false,
          error: 'Contexte d\'exécution invalide',
          warnings: ['Le contexte d\'exécution fourni ne contient pas les informations nécessaires']
        };
      }

      this.log('info', 'Démarrage de la génération');

      try {
        // Calculer le répertoire de sortie effectif
        const effectiveOutputDir = this.resolveOutputDirectory(context);
        
        this.log('debug', `Répertoire de sortie: ${effectiveOutputDir}`);
        
        // Préparation de l'environnement
        await this.prepareEnvironment(effectiveOutputDir, context);
        
        // Appel à l'implémentation spécifique de la génération
        const generationResult = await this.performGeneration(effectiveOutputDir, context);
        
        // Si la configuration demande d'embellir le code
        if (this.config.prettify) {
          await this.prettifyGeneratedFiles(generationResult, context);
        }
        
        // Construction du résultat
        const result: AgentResult<GenerationResult> = {
          success: true,
          data: generationResult
        };
        
        this.log('info', `Génération terminée avec ${generationResult.generatedFiles.length} fichiers générés`);
        
        return result;
      } catch (error) {
        this.log('error', `Erreur lors de la génération: ${error instanceof Error ? error.message : String(error)}`);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    });
  }

  /**
   * Implémentation spécifique de la génération à fournir par chaque sous-classe
   */
  protected abstract performGeneration(outputDir: string, context: AgentContext): Promise<GenerationResult>;

  /**
   * Détermine le répertoire de sortie effectif
   */
  protected resolveOutputDirectory(context: AgentContext): string {
    // Priorité : 
    // 1. Config de l'agent
    // 2. Paramètres du contexte
    // 3. Dossier cible du contexte
    // 4. Dossier de travail courant + sous-dossier généré
    
    if (this.config.outputDir) {
      return this.config.outputDir;
    }
    
    if (context.parameters?.outputDir) {
      return context.parameters.outputDir as string;
    }
    
    if (context.targetFiles && context.targetFiles.length > 0) {
      // Extrait le dossier du premier fichier cible
      const path = require('path');
      return path.dirname(context.targetFiles[0]);
    }
    
    // Génère un dossier dans le répertoire courant
    return `./generated-${Date.now()}`;
  }

  /**
   * Prépare l'environnement avant la génération
   */
  protected async prepareEnvironment(outputDir: string, context: AgentContext): Promise<void> {
    // Créer le dossier de sortie s'il n'existe pas
    const fs = require('fs').promises;
    await fs.mkdir(outputDir, { recursive: true });
    
    // Si en mode dry run, on arrête là
    if (this.config.dryRun || context.dryRun) {
      this.log('info', 'Mode dry run activé: les fichiers ne seront pas réellement générés');
    }
  }

  /**
   * Embellit les fichiers générés si demandé
   */
  protected async prettifyGeneratedFiles(result: GenerationResult, context: AgentContext): Promise<void> {
    // Par défaut, cette méthode ne fait rien
    // Les sous-classes peuvent la surcharger pour formater le code selon leur langage
    this.log('debug', 'Embellissement des fichiers générés non implémenté');
  }
}