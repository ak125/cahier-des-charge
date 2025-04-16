/**
 * Agent Interface Validator
 * 
 * Système avancé de validation qui vérifie la compatibilité des interfaces des agents
 * avec les standards du framework MCP (Model Context Protocol).
 */

import fs from 'fs-extra';
import path from 'path';
import ts from 'typescript';
import { Logger } from '@nestjs/common';
import { AgentManifest, AgentManifestEntry } from './agentRegistry';
import { z } from 'zod';

const logger = new Logger('AgentValidator');

/**
 * Types d'erreurs de validation
 */
export enum ValidationErrorType {
  MISSING_REQUIRED_METHOD = 'missing_required_method',
  INCORRECT_METHOD_SIGNATURE = 'incorrect_method_signature',
  MISSING_REQUIRED_PROPERTY = 'missing_required_property',
  DEPENDENCY_NOT_FOUND = 'dependency_not_found',
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  INCOMPATIBLE_VERSION = 'incompatible_version',
  MISSING_DOCUMENTATION = 'missing_documentation',
  CONFIG_VALIDATION_ERROR = 'config_validation_error'
}

/**
 * Erreur de validation pour un agent
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  severity: 'warning' | 'error';
  agent: string;
  location?: string;
}

/**
 * Résultat de validation pour un agent
 */
export interface AgentValidationResult {
  agentId: string;
  className: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Configuration pour le validateur
 */
export interface ValidatorConfig {
  manifestPath: string;
  agentsDir: string;
  strictValidation: boolean;
  checkDependencies: boolean;
  checkVersions: boolean;
  checkDocumentation: boolean;
}

/**
 * Modèle Zod pour la validation de la configuration de base d'un agent
 */
const BaseAgentConfigSchema = z.object({
  timeout: z.number().optional().default(30000),
  retryCount: z.number().optional().default(3),
  enabled: z.boolean().optional().default(true),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});

/**
 * Méthodes requises pour tous les agents du framework MCP
 */
const REQUIRED_AGENT_METHODS = [
  { name: 'initialize', minParams: 0 },
  { name: 'run', minParams: 1 },
  { name: 'getStatus', minParams: 0 },
  { name: 'cleanup', minParams: 0 }
];

/**
 * Propriétés requises pour tous les agents du framework MCP
 */
const REQUIRED_AGENT_PROPERTIES = [
  'version',
  'id'
];

/**
 * Classe principale du validateur d'agents
 */
export class AgentInterfaceValidator {
  private config: ValidatorConfig;
  private manifest: AgentManifest | null = null;
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;
  private results: Map<string, AgentValidationResult> = new Map();
  
  constructor(config: ValidatorConfig) {
    this.config = {
      ...config,
      strictValidation: config.strictValidation ?? true,
      checkDependencies: config.checkDependencies ?? true,
      checkVersions: config.checkVersions ?? true,
      checkDocumentation: config.checkDocumentation ?? true
    };
  }
  
  /**
   * Charge le manifest des agents
   */
  async loadManifest(): Promise<AgentManifest> {
    try {
      this.manifest = await fs.readJson(this.config.manifestPath);
      return this.manifest;
    } catch (err: any) {
      logger.error(`Erreur lors du chargement du manifest: ${err.message}`);
      throw new Error(`Impossible de charger le manifest: ${err.message}`);
    }
  }
  
  /**
   * Initialise le compilateur TypeScript pour l'analyse statique
   */
  private initTypeScriptCompiler(): void {
    logger.log('Initialisation du compilateur TypeScript...');
    
    // Options du compilateur TypeScript
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      resolveJsonModule: true,
    };
    
    const agentsDir = path.resolve(process.cwd(), this.config.agentsDir);
    const pattern = path.join(agentsDir, '**/*.ts');
    
    // Trouver tous les fichiers TypeScript
    const files = require('glob').sync(pattern);
    
    // Créer un programme TypeScript pour l'analyse statique
    this.program = ts.createProgram(files, compilerOptions);
    this.checker = this.program.getTypeChecker();
    
    logger.log(`Compilateur TypeScript initialisé avec ${files.length} fichiers`);
  }
  
  /**
   * Effectue la validation d'interface pour un agent spécifique
   */
  private validateAgentInterface(agent: AgentManifestEntry): AgentValidationResult {
    const result: AgentValidationResult = {
      agentId: agent.id,
      className: agent.name,
      valid: true,
      errors: [],
      warnings: []
    };
    
    if (!this.program || !this.checker) {
      throw new Error('Compilateur TypeScript non initialisé');
    }
    
    // Trouver le fichier source de l'agent
    const sourceFiles = this.program.getSourceFiles();
    let agentSourceFile: ts.SourceFile | undefined;
    let agentClass: ts.ClassDeclaration | undefined;
    
    for (const sourceFile of sourceFiles) {
      // Ignorer les fichiers de la bibliothèque standard
      if (sourceFile.fileName.includes('node_modules')) continue;
      
      // Chercher la classe de l'agent dans le fichier
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name && node.name.text === agent.name) {
          agentSourceFile = sourceFile;
          agentClass = node;
        }
      });
      
      if (agentClass) break;
    }
    
    if (!agentClass || !agentSourceFile) {
      result.errors.push({
        type: ValidationErrorType.MISSING_REQUIRED_PROPERTY,
        message: `Agent class '${agent.name}' not found in source files`,
        severity: 'error',
        agent: agent.id
      });
      result.valid = false;
      return result;
    }
    
    // Valider les méthodes requises
    this.validateRequiredMethods(agent, agentClass, result);
    
    // Valider les propriétés requises
    this.validateRequiredProperties(agent, agentClass, result);
    
    // Valider la configuration
    this.validateConfiguration(agent, result);
    
    // Valider les dépendances si configuré
    if (this.config.checkDependencies) {
      this.validateDependencies(agent, result);
    }
    
    // Valider la documentation si configuré
    if (this.config.checkDocumentation) {
      this.validateDocumentation(agent, agentClass, agentSourceFile, result);
    }
    
    // Un agent n'est valide que s'il n'a pas d'erreurs
    result.valid = result.errors.length === 0;
    
    return result;
  }
  
  /**
   * Valide les méthodes requises pour un agent
   */
  private validateRequiredMethods(
    agent: AgentManifestEntry, 
    agentClass: ts.ClassDeclaration,
    result: AgentValidationResult
  ): void {
    const existingMethods = new Map<string, ts.MethodDeclaration>();
    
    // Collecter toutes les méthodes de la classe
    agentClass.members.forEach(member => {
      if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText();
        existingMethods.set(methodName, member);
      }
    });
    
    // Vérifier chaque méthode requise
    for (const requiredMethod of REQUIRED_AGENT_METHODS) {
      const method = existingMethods.get(requiredMethod.name);
      
      if (!method) {
        result.errors.push({
          type: ValidationErrorType.MISSING_REQUIRED_METHOD,
          message: `La méthode requise '${requiredMethod.name}' est manquante`,
          severity: 'error',
          agent: agent.id,
          location: agentClass.getSourceFile().fileName
        });
        continue;
      }
      
      // Vérifier le nombre de paramètres
      if (method.parameters.length < requiredMethod.minParams) {
        result.errors.push({
          type: ValidationErrorType.INCORRECT_METHOD_SIGNATURE,
          message: `La méthode '${requiredMethod.name}' doit avoir au moins ${requiredMethod.minParams} paramètre(s)`,
          severity: 'error',
          agent: agent.id,
          location: `${agentClass.getSourceFile().fileName}:${method.getStart()}`
        });
      }
    }
  }
  
  /**
   * Valide les propriétés requises pour un agent
   */
  private validateRequiredProperties(
    agent: AgentManifestEntry,
    agentClass: ts.ClassDeclaration,
    result: AgentValidationResult
  ): void {
    const existingProperties = new Set<string>();
    
    // Collecter toutes les propriétés de la classe
    agentClass.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && member.name) {
        const propertyName = member.name.getText();
        existingProperties.add(propertyName);
      }
    });
    
    // Vérifier chaque propriété requise
    for (const requiredProperty of REQUIRED_AGENT_PROPERTIES) {
      if (!existingProperties.has(requiredProperty)) {
        result.errors.push({
          type: ValidationErrorType.MISSING_REQUIRED_PROPERTY,
          message: `La propriété requise '${requiredProperty}' est manquante`,
          severity: 'error',
          agent: agent.id,
          location: agentClass.getSourceFile().fileName
        });
      }
    }
  }
  
  /**
   * Valide la configuration d'un agent
   */
  private validateConfiguration(
    agent: AgentManifestEntry,
    result: AgentValidationResult
  ): void {
    try {
      // Valider la configuration de base avec Zod
      BaseAgentConfigSchema.parse(agent.config || {});
    } catch (err: any) {
      // En cas d'erreur de validation Zod
      const formattedError = err.format ? JSON.stringify(err.format()) : err.message;
      
      result.errors.push({
        type: ValidationErrorType.CONFIG_VALIDATION_ERROR,
        message: `Configuration invalide: ${formattedError}`,
        severity: 'error',
        agent: agent.id
      });
    }
    
    // Vérification spécifique pour la présence d'un endpoint API
    if (!agent.apiEndpoint) {
      result.warnings.push({
        type: ValidationErrorType.MISSING_REQUIRED_PROPERTY,
        message: `L'agent n'a pas d'endpoint API défini`,
        severity: 'warning',
        agent: agent.id
      });
    }
  }
  
  /**
   * Valide les dépendances d'un agent
   */
  private validateDependencies(
    agent: AgentManifestEntry,
    result: AgentValidationResult
  ): void {
    // Vérifier que toutes les dépendances existent
    for (const dependency of agent.dependencies || []) {
      if (!this.manifest?.agents.some(a => a.id === dependency)) {
        result.errors.push({
          type: ValidationErrorType.DEPENDENCY_NOT_FOUND,
          message: `La dépendance '${dependency}' n'existe pas dans le manifest`,
          severity: 'error',
          agent: agent.id
        });
      }
    }
    
    // Vérifier s'il y a des dépendances circulaires
    this.checkCircularDependencies(agent, [], new Set(), result);
  }
  
  /**
   * Vérifie les dépendances circulaires de manière récursive
   */
  private checkCircularDependencies(
    agent: AgentManifestEntry,
    path: string[],
    visited: Set<string>,
    result: AgentValidationResult
  ): void {
    if (path.includes(agent.id)) {
      // Dépendance circulaire détectée
      const cycle = [...path.slice(path.indexOf(agent.id)), agent.id];
      
      result.errors.push({
        type: ValidationErrorType.CIRCULAR_DEPENDENCY,
        message: `Dépendance circulaire détectée: ${cycle.join(' -> ')}`,
        severity: 'error',
        agent: agent.id
      });
      
      return;
    }
    
    // Marquer cet agent comme visité dans ce chemin
    const newPath = [...path, agent.id];
    
    // Si l'agent a déjà été complètement visité, ne pas le revisiter
    if (visited.has(agent.id)) return;
    
    // Pour chaque dépendance
    for (const dependencyId of agent.dependencies || []) {
      const dependency = this.manifest?.agents.find(a => a.id === dependencyId);
      
      if (dependency) {
        this.checkCircularDependencies(dependency, newPath, visited, result);
      }
    }
    
    // Marquer cet agent comme complètement visité
    visited.add(agent.id);
  }
  
  /**
   * Valide la documentation d'un agent
   */
  private validateDocumentation(
    agent: AgentManifestEntry,
    agentClass: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    result: AgentValidationResult
  ): void {
    // Vérifier la présence d'une description
    if (!agent.description || agent.description.length < 10) {
      result.warnings.push({
        type: ValidationErrorType.MISSING_DOCUMENTATION,
        message: `Description insuffisante (moins de 10 caractères)`,
        severity: 'warning',
        agent: agent.id
      });
    }
    
    // Vérifier la présence de commentaires JSDoc sur la classe
    const nodeFullText = sourceFile.getFullText();
    const classStart = agentClass.getFullStart();
    const leadingComments = ts.getLeadingCommentRanges(nodeFullText, classStart);
    
    let hasJSDocComment = false;
    
    if (leadingComments) {
      for (const comment of leadingComments) {
        const commentText = nodeFullText.substring(comment.pos, comment.end);
        if (commentText.startsWith('/**') && commentText.includes('*/')) {
          hasJSDocComment = true;
          break;
        }
      }
    }
    
    if (!hasJSDocComment) {
      result.warnings.push({
        type: ValidationErrorType.MISSING_DOCUMENTATION,
        message: `La classe n'a pas de commentaire JSDoc`,
        severity: 'warning',
        agent: agent.id,
        location: `${sourceFile.fileName}:${agentClass.getStart()}`
      });
    }
    
    // Vérifier la présence de commentaires JSDoc pour les méthodes requises
    for (const requiredMethod of REQUIRED_AGENT_METHODS) {
      // Trouver la méthode dans la classe
      const method = agentClass.members.find(member => 
        ts.isMethodDeclaration(member) && 
        member.name && 
        member.name.getText() === requiredMethod.name
      ) as ts.MethodDeclaration | undefined;
      
      if (method) {
        const methodStart = method.getFullStart();
        const methodLeadingComments = ts.getLeadingCommentRanges(nodeFullText, methodStart);
        
        let hasMethodJSDocComment = false;
        
        if (methodLeadingComments) {
          for (const comment of methodLeadingComments) {
            const commentText = nodeFullText.substring(comment.pos, comment.end);
            if (commentText.startsWith('/**') && commentText.includes('*/')) {
              hasMethodJSDocComment = true;
              break;
            }
          }
        }
        
        if (!hasMethodJSDocComment) {
          result.warnings.push({
            type: ValidationErrorType.MISSING_DOCUMENTATION,
            message: `La méthode '${requiredMethod.name}' n'a pas de commentaire JSDoc`,
            severity: 'warning',
            agent: agent.id,
            location: `${sourceFile.fileName}:${method.getStart()}`
          });
        }
      }
    }
  }
  
  /**
   * Valide tous les agents du manifest
   */
  async validateAll(): Promise<Map<string, AgentValidationResult>> {
    if (!this.manifest) {
      await this.loadManifest();
    }
    
    if (!this.program) {
      this.initTypeScriptCompiler();
    }
    
    logger.log(`Validation de ${this.manifest!.agents.length} agents...`);
    
    this.results.clear();
    
    for (const agent of this.manifest!.agents) {
      logger.log(`Validation de l'agent ${agent.name} (${agent.id})...`);
      const result = this.validateAgentInterface(agent);
      this.results.set(agent.id, result);
      
      if (result.valid) {
        logger.log(`✅ Agent ${agent.name} valide.`);
      } else {
        logger.warn(`❌ Agent ${agent.name} invalide: ${result.errors.length} erreur(s), ${result.warnings.length} avertissement(s)`);
      }
    }
    
    return this.results;
  }
  
  /**
   * Valide un agent spécifique
   */
  async validateAgent(agentId: string): Promise<AgentValidationResult | null> {
    if (!this.manifest) {
      await this.loadManifest();
    }
    
    if (!this.program) {
      this.initTypeScriptCompiler();
    }
    
    const agent = this.manifest!.agents.find(a => a.id === agentId);
    
    if (!agent) {
      logger.warn(`Agent avec l'ID '${agentId}' non trouvé dans le manifest`);
      return null;
    }
    
    logger.log(`Validation de l'agent ${agent.name} (${agent.id})...`);
    const result = this.validateAgentInterface(agent);
    this.results.set(agent.id, result);
    
    if (result.valid) {
      logger.log(`✅ Agent ${agent.name} valide.`);
    } else {
      logger.warn(`❌ Agent ${agent.name} invalide: ${result.errors.length} erreur(s), ${result.warnings.length} avertissement(s)`);
    }
    
    return result;
  }
  
  /**
   * Génère un rapport HTML des résultats de validation
   */
  generateHTMLReport(outputPath: string): void {
    logger.log(`Génération du rapport HTML dans ${outputPath}...`);
    
    let validCount = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    
    const resultRows = Array.from(this.results.values()).map(result => {
      if (result.valid) validCount++;
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      
      return `
        <tr class="${result.valid ? 'table-success' : 'table-danger'}">
          <td>${result.agentId}</td>
          <td>${result.className}</td>
          <td>
            ${result.valid 
              ? '<span class="badge bg-success">Valide</span>' 
              : '<span class="badge bg-danger">Invalide</span>'
            }
          </td>
          <td>${result.errors.length}</td>
          <td>${result.warnings.length}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-bs-toggle="collapse" data-bs-target="#details-${result.agentId}">
              Détails
            </button>
          </td>
        </tr>
        <tr>
          <td colspan="6" class="p-0">
            <div class="collapse" id="details-${result.agentId}">
              <div class="card card-body m-2">
                <h5>Erreurs</h5>
                ${result.errors.length === 0 ? 
                  '<p class="text-muted">Aucune erreur</p>' : 
                  '<ul class="text-danger">' + 
                    result.errors.map(err => `<li>${err.message} (${err.type}${err.location ? ' - ' + err.location : ''})</li>`).join('') + 
                  '</ul>'
                }
                
                <h5>Avertissements</h5>
                ${result.warnings.length === 0 ? 
                  '<p class="text-muted">Aucun avertissement</p>' : 
                  '<ul class="text-warning">' + 
                    result.warnings.map(warn => `<li>${warn.message} (${warn.type}${warn.location ? ' - ' + warn.location : ''})</li>`).join('') + 
                  '</ul>'
                }
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    const totalAgents = this.results.size;
    const validPercentage = totalAgents > 0 ? (validCount / totalAgents * 100).toFixed(0) : '0';
    
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport de validation des agents MCP</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        .progress-bar {
          transition: width 0.5s ease-in-out;
        }
      </style>
    </head>
    <body>
      <div class="container my-4">
        <h1>Rapport de validation des agents MCP</h1>
        <p class="lead">Généré le ${new Date().toLocaleString()}</p>
        
        <div class="row mt-4">
          <div class="col-md-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Agents valides</h5>
                <h2>${validCount} / ${totalAgents}</h2>
                <div class="progress mt-2">
                  <div class="progress-bar bg-success" role="progressbar" style="width: ${validPercentage}%" 
                       aria-valuenow="${validPercentage}" aria-valuemin="0" aria-valuemax="100">
                    ${validPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Erreurs</h5>
                <h2>${totalErrors}</h2>
                <p class="text-danger">Doivent être corrigées</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Avertissements</h5>
                <h2>${totalWarnings}</h2>
                <p class="text-warning">Peuvent être améliorés</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-4">
          <div class="card-body">
            <h3>Résultats détaillés</h3>
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Statut</th>
                  <th>Erreurs</th>
                  <th>Avert.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${resultRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    `;
    
    fs.writeFileSync(outputPath, html);
    logger.log(`✅ Rapport HTML généré dans ${outputPath}`);
  }
  
  /**
   * Génère un rapport JSON des résultats de validation
   */
  generateJSONReport(outputPath: string): void {
    logger.log(`Génération du rapport JSON dans ${outputPath}...`);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalAgents: this.results.size,
      validAgents: Array.from(this.results.values()).filter(r => r.valid).length,
      results: Array.from(this.results.values())
    };
    
    fs.writeJsonSync(outputPath, report, { spaces: 2 });
    logger.log(`✅ Rapport JSON généré dans ${outputPath}`);
  }
}

/**
 * Programme principal
 */
async function main() {
  const validatorConfig: ValidatorConfig = {
    manifestPath: './agent-manifest.json',
    agentsDir: './agents',
    strictValidation: true,
    checkDependencies: true,
    checkVersions: true,
    checkDocumentation: true
  };
  
  try {
    const validator = new AgentInterfaceValidator(validatorConfig);
    await validator.validateAll();
    
    // Générer les rapports
    validator.generateHTMLReport('./agent-validation-report.html');
    validator.generateJSONReport('./agent-validation-report.json');
    
    logger.log('✅ Validation terminée');
  } catch (err: any) {
    logger.error(`Erreur lors de la validation: ${err.message}`);
    process.exit(1);
  }
}

// Exécuter le programme si appelé directement
if (require.main === module) {
  main();
}

export { 
  AgentInterfaceValidator, 
  ValidatorConfig, 
  ValidationErrorType,
  ValidationError,
  AgentValidationResult
};

#!/usr/bin/env ts-node

/**
 * Script pour valider l'implémentation des interfaces d'agents
 * 
 * Ce script permet de vérifier si un agent implémente correctement 
 * l'interface abstraite correspondant à son type.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { QAAnalyzer } from './packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer';

/**
 * Interface de contexte minimale pour les tests
 */
interface MinimalAgentContext {
  getConfig: () => Record<string, any>;
  logger: Console;
}

/**
 * Fonction pour tester un agent QA-Analyzer
 */
async function testQAAnalyzer() {
  const sourcePhpPath = '/tmp/example.php';
  const generatedFiles = {
    component: '/tmp/example.tsx',
    loader: '/tmp/example.loader.ts'
  };
  
  // Créer des fichiers temporaires pour le test
  await fs.writeFile(sourcePhpPath, `<?php\n// Example PHP file\n$name = $_GET['name'];\necho "Hello, $name";\n?>`);
  await fs.writeFile(generatedFiles.component, 'export default function Example() { return <div>Hello</div>; }');
  await fs.writeFile(generatedFiles.loader, 'export async function loader() { return { name: "World" }; }');
  
  console.log('Fichiers de test créés.');
  
  // Créer une instance de l'agent
  const analyzer = new QAAnalyzer(sourcePhpPath, generatedFiles, {
    outputDir: '/tmp',
    verbose: true
  });
  
  console.log('Agent créé. Propriétés requises:');
  console.log(`- id: ${analyzer.id}`);
  console.log(`- name: ${analyzer.name}`);
  console.log(`- version: ${analyzer.version}`);
  console.log(`- description: ${analyzer.description}`);
  
  // Créer un contexte minimal
  const context: MinimalAgentContext = {
    getConfig: () => ({ outputDir: '/tmp' }),
    logger: console
  };
  
  // Tester l'initialisation
  console.log('\nInitialisation de l\'agent...');
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    await analyzer.initialize(context);
    console.log('Initialisation réussie!');
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation:', error.message);
  }
  
  // Tester l'exécution
  console.log('\nExécution de l\'agent...');
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    await analyzer.execute(context);
    console.log('Exécution réussie!');
  } catch (error: any) {
    console.error('Erreur lors de l\'exécution:', error.message);
  }
  
  // Tester le nettoyage
  console.log('\nNettoyage de l\'agent...');
  try {
    await analyzer.cleanup();
    console.log('Nettoyage réussi!');
  } catch (error: any) {
    console.error('Erreur lors du nettoyage:', error.message);
  }
  
  // Supprimer les fichiers temporaires
  await fs.remove(sourcePhpPath);
  await fs.remove(generatedFiles.component);
  await fs.remove(generatedFiles.loader);
  
  console.log('\nFichiers temporaires supprimés.');
  console.log('\nTest terminé.');
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('=== Validation de l\'interface d\'agent ===\n');
  
  try {
    // Tester l'agent QA-Analyzer
    console.log('Test de QA-Analyzer:');
    await testQAAnalyzer();
  } catch (error: any) {
    console.error('Erreur lors du test:', error.message);
  }
}

// Exécuter le script
main()
  .then(() => console.log('\nValidation terminée.'))
  .catch(error => console.error('Erreur:', error));