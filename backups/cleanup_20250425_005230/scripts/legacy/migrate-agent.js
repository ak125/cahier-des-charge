#!/usr/bin/env node
/**
 * Script de migration d'agents vers l'architecture standardisée
 * 
 * Ce script analyse un agent existant et génère le code de base pour sa migration 
 * vers la nouvelle architecture à 3 couches.
 * 
 * Usage: node migrate-agent.js <chemin-vers-agent-source> <type-agent>
 * 
 * Types d'agents supportés: analyzer, generator, validator, orchestrator
 */

const fs = require(fs-extrastructure-agent');
const path = require(pathstructure-agent');
const { execSync } = require(child_processstructure-agent');

// Chemins des répertoires
const AGENTS_ROOT = path.join(__dirname, '..', 'packages', 'mcp-agents');
const AGENT_TYPES = {
  analyzer: path.join(AGENTS_ROOT, 'analyzers'),
  generator: path.join(AGENTS_ROOT, 'generators'),
  validator: path.join(AGENTS_ROOT, 'validators'),
  orchestrator: path.join(AGENTS_ROOT, 'orchestrators')
};

// Templates de migration
const TEMPLATES = {
  analyzer: `
/**
 * [NOM_AGENT] - [DESCRIPTION_COURTE]
 * 
 * [DESCRIPTION_LONGUE]
 */

import { AgentContext, AgentMetadata } from ../core/interfacesstructure-agent';
import { BaseAnalyzerAgent, AnalyzerAgentConfig, AnalysisResult } from ./base-analyzer-agentstructure-agent';

// Configuration spécifique à l'agent
export interface [NOM_CLASSE]Config extends AnalyzerAgentConfig {
  [CONFIGS_SPECIFIQUES]
}

/**
 * Agent d'analyse standardisé
 */
export class [NOM_CLASSE] extends BaseAnalyzerAgent {
  /**
   * Métadonnées de l'agent selon le standard MCP
   */
  readonly metadata: AgentMetadata = {
    id: '[ID_AGENT]',
    name: '[NOM_LISIBLE]',
    description: '[DESCRIPTION_COURTE]',
    version: '2.0.0',
    type: 'analyzer',
    author: 'Équipe MCP',
    tags: [TAGS]
  };
  
  constructor(config: [NOM_CLASSE]Config) {
    super(config);
  }
  
  /**
   * Implémentation de la méthode d'analyse requise par BaseAnalyzerAgent
   */
  protected async performAnalysis(context: AgentContext): Promise<AnalysisResult> {
    // Initialiser le résultat d'analyse
    const analysisResult: AnalysisResult = {
      findings: [],
    };
    
    try {
      // TODO: Implémenter la logique d'analyse spécifique ici
      
      // Exemple de résultat d'analyse
      analysisResult.findings.push({
        type: 'example-finding',
        severity: 'info',
        message: 'Ceci est un exemple de résultat d'analyse',
        location: { file: 'example.ts' }
      });
      
      // Statistiques
      analysisResult.statistics = {
        totalFiles: 0,
        filesAnalyzed: 0,
        totalFindings: analysisResult.findings.length,
        findingsBySeverity: {}
      };
      
      // Résumé des résultats
      analysisResult.summary = {
        // TODO: Ajouter un résumé spécifique ici
      };
      
    } catch (error) {
      this.log('error', \`Erreur lors de l'analyse: \${error instanceof Error ? error.message : String(error)}\`);
      throw error;
    }
    
    return analysisResult;
  }
}
  `,
  
  generator: `
/**
 * [NOM_AGENT] - [DESCRIPTION_COURTE]
 * 
 * [DESCRIPTION_LONGUE]
 */

import { AgentContext, AgentMetadata } from ../core/interfacesstructure-agent';
import { BaseGeneratorAgent, GeneratorAgentConfig, GenerationResult } from ./base-generator-agentstructure-agent';
import path from pathstructure-agent';
import fs from fs-extrastructure-agent';

// Configuration spécifique à l'agent
export interface [NOM_CLASSE]Config extends GeneratorAgentConfig {
  [CONFIGS_SPECIFIQUES]
}

/**
 * Agent de génération standardisé
 */
export class [NOM_CLASSE] extends BaseGeneratorAgent {
  /**
   * Métadonnées de l'agent selon le standard MCP
   */
  readonly metadata: AgentMetadata = {
    id: '[ID_AGENT]',
    name: '[NOM_LISIBLE]',
    description: '[DESCRIPTION_COURTE]',
    version: '2.0.0',
    type: 'generator',
    author: 'Équipe MCP',
    tags: [TAGS]
  };
  
  constructor(config: [NOM_CLASSE]Config) {
    super(config);
  }
  
  /**
   * Implémentation de la méthode de génération requise par BaseGeneratorAgent
   */
  protected async performGeneration(outputDir: string, context: AgentContext): Promise<GenerationResult> {
    // Initialiser le résultat de génération
    const generationResult: GenerationResult = {
      generatedFiles: [],
      summary: {
        totalFiles: 0,
        totalSize: 0,
        duration: 0
      }
    };
    
    const startTime = Date.now();
    
    try {
      // TODO: Implémenter la logique de génération spécifique ici
      
      // Exemple de génération de fichier
      const exampleFilePath = path.join(outputDir, 'example.txt');
      const content = 'Ceci est un exemple de fichier généré';
      
      await fs.writeFile(exampleFilePath, content, 'utf-8');
      
      generationResult.generatedFiles.push({
        path: exampleFilePath,
        type: 'text/plain',
        size: content.length
      });
      
      // Mettre à jour le résumé
      generationResult.summary.totalFiles = generationResult.generatedFiles.length;
      generationResult.summary.totalSize = generationResult.generatedFiles.reduce(
        (total, file) => total + file.size, 0
      );
      generationResult.summary.duration = Date.now() - startTime;
      
    } catch (error) {
      this.log('error', \`Erreur lors de la génération: \${error instanceof Error ? error.message : String(error)}\`);
      throw error;
    }
    
    return generationResult;
  }
}
  `,
  
  validator: `
/**
 * [NOM_AGENT] - [DESCRIPTION_COURTE]
 * 
 * [DESCRIPTION_LONGUE]
 */

import { AgentContext, AgentMetadata } from ../core/interfacesstructure-agent';
import { BaseValidatorAgent, ValidatorAgentConfig, ValidationResult } from ./base-validator-agentstructure-agent';

// Configuration spécifique à l'agent
export interface [NOM_CLASSE]Config extends ValidatorAgentConfig {
  [CONFIGS_SPECIFIQUES]
}

/**
 * Agent de validation standardisé
 */
export class [NOM_CLASSE] extends BaseValidatorAgent {
  /**
   * Métadonnées de l'agent selon le standard MCP
   */
  readonly metadata: AgentMetadata = {
    id: '[ID_AGENT]',
    name: '[NOM_LISIBLE]',
    description: '[DESCRIPTION_COURTE]',
    version: '2.0.0',
    type: 'validator',
    author: 'Équipe MCP',
    tags: [TAGS]
  };
  
  constructor(config: [NOM_CLASSE]Config) {
    super(config);
  }
  
  /**
   * Implémentation de la méthode de validation requise par BaseValidatorAgent
   */
  protected async performValidation(context: AgentContext): Promise<ValidationResult> {
    // Initialiser le résultat de validation
    const validationResult: ValidationResult = {
      valid: false,
      violations: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        score: 0
      }
    };
    
    try {
      // TODO: Implémenter la logique de validation spécifique ici
      
      // Exemple de validation
      validationResult.summary.totalChecks = 5;
      validationResult.summary.passedChecks = 4;
      validationResult.summary.failedChecks = 1;
      
      validationResult.violations.push({
        rule: 'example-rule',
        severity: 'warning',
        message: 'Ceci est un exemple de violation',
        autoFixable: false
      });
      
      // Définir si la validation est réussie
      validationResult.valid = validationResult.summary.failedChecks === 0;
      
    } catch (error) {
      this.log('error', \`Erreur lors de la validation: \${error instanceof Error ? error.message : String(error)}\`);
      throw error;
    }
    
    return validationResult;
  }
  
  /**
   * Application des corrections automatiques si possible
   */
  protected async applyAutofixes(result: ValidationResult, context: AgentContext): Promise<void> {
    await super.applyAutofixes(result, context);
    
    // TODO: Implémenter les corrections automatiques spécifiques ici
    this.log('info', 'Application des corrections automatiques');
    
    result.fixesApplied = {
      // Détails des corrections appliquées
    };
  }
}
  `,
  
  orchestrator: `
/**
 * [NOM_AGENT] - [DESCRIPTION_COURTE]
 * 
 * [DESCRIPTION_LONGUE]
 */

import { AgentContext, AgentMetadata } from ../core/interfacesstructure-agent';
import { BaseOrchestratorAgent, OrchestratorAgentConfig, OrchestrationResult } from ./base-orchestrator-agentstructure-agent';
import { AgentRegistry } from ../core/agent-registrystructure-agent';

// Configuration spécifique à l'agent
export interface [NOM_CLASSE]Config extends OrchestratorAgentConfig {
  [CONFIGS_SPECIFIQUES]
}

/**
 * Agent d'orchestration standardisé
 */
export class [NOM_CLASSE] extends BaseOrchestratorAgent {
  private agentRegistry: AgentRegistry;
  
  /**
   * Métadonnées de l'agent selon le standard MCP
   */
  readonly metadata: AgentMetadata = {
    id: '[ID_AGENT]',
    name: '[NOM_LISIBLE]',
    description: '[DESCRIPTION_COURTE]',
    version: '2.0.0',
    type: 'orchestrator',
    author: 'Équipe MCP',
    tags: [TAGS]
  };
  
  constructor(config: [NOM_CLASSE]Config) {
    super(config);
    this.agentRegistry = AgentRegistry.getInstance();
  }
  
  /**
   * Préparation du plan d'exécution
   */
  protected async prepareExecutionPlan(context: AgentContext): Promise<Array<{
    agentId: string;
    config?: any;
    dependencies?: string[];
  }>> {
    // Définition du plan d'exécution
    return [
      // TODO: Définir les étapes du workflow ici
      {
        agentId: 'example-agent-1',
        config: { /* Configuration spécifique */ },
        dependencies: []
      },
      {
        agentId: 'example-agent-2',
        config: { /* Configuration spécifique */ },
        dependencies: ['example-agent-1']
      }
    ];
  }
  
  /**
   * Exécution du workflow
   */
  protected async executeWorkflow(
    executionPlan: Array<{
      agentId: string;
      config?: any;
      dependencies?: string[];
    }>,
    context: AgentContext
  ): Promise<OrchestrationResult> {
    // Initialisation du résultat
    const result: OrchestrationResult = {
      completedSteps: [],
      summary: {
        totalSteps: executionPlan.length,
        successfulSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        overallStatus: 'failed',
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: ''
      },
      artifacts: []
    };
    
    // TODO: Implémenter la logique d'exécution du workflow
    
    // Exemple simplifié d'exécution séquentielle
    for (let i = 0; i < executionPlan.length; i++) {
      const step = executionPlan[i];
      
      // Mise à jour du statut
      this.updateStepStatus(i, 'running');
      
      try {
        // Exécuter l'agent
        const stepResult = await this.executeAgent(step.agentId, step.config, context);
        
        // Enregistrer le résultat
        result.completedSteps.push({
          agentId: step.agentId,
          status: 'success',
          result: stepResult,
          duration: 0 // À calculer correctement
        });
        
        // Mise à jour du statut
        this.updateStepStatus(i, 'success', stepResult);
        result.summary.successfulSteps++;
        
      } catch (error) {
        // Gérer l'erreur
        this.log('error', \`Erreur lors de l'exécution de l'étape \${i} (agent: \${step.agentId}): \${error instanceof Error ? error.message : String(error)}\`);
        
        // Mise à jour du statut
        this.updateStepStatus(i, 'error', { error: error instanceof Error ? error.message : String(error) });
        result.summary.failedSteps++;
        
        // Arrêter le workflow si continueOnError n'est pas activé
        if (!this.config.continueOnError) {
          break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Exécution d'un agent à partir de son ID
   */
  protected async executeAgent(
    agentId: string,
    config: any,
    context: AgentContext
  ): Promise<any> {
    try {
      this.log('info', \`Exécution de l'agent \${agentId}\`);
      
      // Créer une instance de l'agent avec la configuration fournie
      const agent = this.agentRegistry.createAgent(agentId, config);
      
      // Initialiser l'agent
      await agent.initialize();
      
      // Exécuter l'agent
      const result = await agent.execute(context);
      
      return result;
    } catch (error) {
      this.log('error', \`Erreur lors de l'exécution de l'agent \${agentId}: \${error instanceof Error ? error.message : String(error)}\`);
      throw error;
    }
  }
}
  `
};

/**
 * Point d'entrée principal
 */
async function main() {
  // Vérifier les arguments
  const [sourceFilePath, agentType] = process.argv.slice(2);
  
  if (!sourceFilePath || !AGENT_TYPES[agentType]) {
    console.error('Usage: node migrate-agent.js <chemin-vers-agent-source> <type-agent>');
    console.error('Types d\'agents supportés:', Object.keys(AGENT_TYPES).join(', '));
    process.exit(1);
  }
  
  // Vérifier si le fichier source existe
  if (!fs.existsSync(sourceFilePath)) {
    console.error(`Le fichier source n'existe pas: ${sourceFilePath}`);
    process.exit(1);
  }
  
  try {
    // Analyser le fichier source
    console.log(`\n🔍 Analyse du fichier ${sourceFilePath}...`);
    const sourceCode = await fs.readFile(sourceFilePath, 'utf-8');
    
    // Extraire les informations de base
    const className = extractClassName(sourceCode);
    const fileName = path.basename(sourceFilePath);
    const agentId = fileName.replace(/\.(ts|js)$/, '').toLowerCase();
    const description = extractDescription(sourceCode);
    const configProperties = extractConfigProperties(sourceCode);
    
    console.log(`✅ Informations extraites:`);
    console.log(`- Nom de classe: ${className}`);
    console.log(`- ID de l'agent: ${agentId}`);
    console.log(`- Description: ${description}`);
    
    // Générer le nom du fichier de destination
    const destFileName = `${agentId.replace(/-agent$/, '')}-agent.ts`;
    const destFilePath = path.join(AGENT_TYPES[agentType], destFileName);
    
    // Générer le code migré
    let migratedCode = TEMPLATES[agentType]
      .replace(/\[NOM_CLASSE\]/g, className)
      .replace(/\[ID_AGENT\]/g, agentId)
      .replace(/\[NOM_LISIBLE\]/g, className.replace(/([A-Z])/g, ' $1').trim().replace(/Agent$/, ''))
      .replace(/\[DESCRIPTION_COURTE\]/g, description.split('.')[0].trim())
      .replace(/\[DESCRIPTION_LONGUE\]/g, description)
      .replace(/\[CONFIGS_SPECIFIQUES\]/g, configProperties);
      
    // Définir les tags automatiquement
    const tags = generateTags(agentId, description, agentType);
    migratedCode = migratedCode.replace(/\[TAGS\]/g, JSON.stringify(tags));
    
    // Créer le fichier de destination
    console.log(`📝 Création du fichier migré: ${destFilePath}`);
    await fs.ensureDir(path.dirname(destFilePath));
    await fs.writeFile(destFilePath, migratedCode, 'utf-8');
    
    console.log(`\n✨ Migration terminée avec succès! Fichier créé: ${destFilePath}`);
    console.log('\n⚠️ Note: La migration automatique est un point de départ. Veuillez vérifier et adapter le code généré selon vos besoins spécifiques.');
    
    // Ouvrir le fichier si possible
    try {
      console.log('📂 Ouverture du fichier migré...');
      if (process.platform === 'darwin') {
        execSync(`open ${destFilePath}`);
      } else if (process.platform === 'win32') {
        execSync(`start ${destFilePath}`);
      } else {
        execSync(`xdg-open ${destFilePath}`);
      }
    } catch (error) {
      console.log('⚠️ Impossible d\'ouvrir automatiquement le fichier.');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

/**
 * Extrait le nom de la classe depuis le code source
 */
function extractClassName(sourceCode) {
  const classMatch = sourceCode.match(/(?:export\s+class\s+)(\w+)/) ||
                     sourceCode.match(/(?:class\s+)(\w+)/);
                     
  if (classMatch && classMatch[1]) {
    return classMatch[1];
  }
  
  // Générer un nom par défaut basé sur le timestamp
  return `MigratedAgent${Date.now().toString().slice(-4)}`;
}

/**
 * Extrait la description depuis le code source
 */
function extractDescription(sourceCode) {
  const commentBlocks = sourceCode.match(/\/\*\*([\s\S]*?)\*\//g) || [];
  
  for (const block of commentBlocks) {
    // Supprimer les astérisques et les espaces au début de chaque ligne
    const cleanedBlock = block
      .replace(/\/\*\*|\*\//g, '')
      .replace(/^\s*\*\s*/gm, '')
      .trim();
      
    if (cleanedBlock) {
      return cleanedBlock;
    }
  }
  
  return "Agent migré depuis l'ancienne architecture";
}

/**
 * Extrait les propriétés de configuration depuis le code source
 */
function extractConfigProperties(sourceCode) {
  // Rechercher les interfaces de configuration
  const interfaceMatch = sourceCode.match(/(?:interface\s+\w+Config\s*{)([\s\S]*?)}/);
  
  if (interfaceMatch && interfaceMatch[1]) {
    return interfaceMatch[1].trim();
  }
  
  // Rechercher les propriétés de classe qui pourraient être des configurations
  const properties = [];
  const propertyMatches = sourceCode.matchAll(/private\s+(\w+):\s*([\w<>[\]]+)/g);
  
  for (const match of propertyMatches) {
    properties.push(`${match[1]}?: ${match[2]};`);
  }
  
  return properties.join('\n  ');
}

/**
 * Génère des tags basés sur l'ID et la description
 */
function generateTags(agentId, description, agentType) {
  const tags = [agentType];
  
  // Ajouter des mots-clés depuis l'ID
  const idWords = agentId.split('-').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'agent'].includes(word)
  );
  
  // Ajouter des mots-clés depuis la description
  const descWords = description.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      word.length > 4 && 
      !['agent', 'class', 'function', 'method', 'which', 'allow', 'allows'].includes(word)
    );
  
  // Fusionner tous les tags et éliminer les doublons
  const allTags = [...new Set([...tags, ...idWords, ...descWords])].slice(0, 5);
  
  return allTags;
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});