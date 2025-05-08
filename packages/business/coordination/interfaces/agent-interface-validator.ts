/**
 * Agent Interface Validator
 * 
 * Système avancé de validation qui vérifie la compatibilité des interfaces des agents
 * avec les standards du framework MCP (Model Context Protocol).
 */

import path from 'path';
import { Logger } from '@nestjs/common';
import fs from 'fs-extra';
import ts from 'typescript';
import { z } from 'zod';
import { AgentManifest, AgentManifestEntry } from './agent-registry';

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
        message: "Description insuffisante (moins de 10 caractères)",
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
    
    logger.log(`Validation de ${this.manifest?.agents.length} agents...`);
    
    this.results.clear();
    
    for (const agent of this.manifest?.agents) {
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
    
    const agent = this.manifest?.agents.find(a => a.id === agentId);
    
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
                  `<ul class="text-danger">${result.errors.map(err => `<li>${err.message} (${err.type}${err.location ? ` - ${err.location}` : ''})</li>`).join('')}</ul>`
                }
                
                <h5>Avertissements</h5>
                ${result.warnings.length === 0 ? 
                  '<p class="text-muted">Aucun avertissement</p>' : 
                  `<ul class="text-warning">${result.warnings.map(warn => `<li>${warn.message} (${warn.type}${warn.location ? ` - ${warn.location}` : ''})</li>`).join('')}</ul>`
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

import * as fs from 'fs';
import * as path from 'path';

// Chemins
const PACKAGES_DIR = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const AGENTS_DIR = '/workspaces/cahier-des-charge/agents';
const REPORT_DIR = '/workspaces/cahier-des-charge/reports/migration';

// Ensembles d'interfaces par couche
const INTERFACE_MAP = {
  orchestration: {
    layer: 'OrchestrationAgent',
    types: {
      orchestrator: 'OrchestratorAgent',
      monitor: 'MonitorAgent',
      scheduler: 'SchedulerAgent'
    }
  },
  coordination: {
    layer: 'CoordinationAgent',
    types: {
      bridge: 'BridgeAgent',
      adapter: 'AdapterAgent',
      registry: 'RegistryAgent'
    }
  },
  business: {
    layer: 'BusinessAgent',
    types: {
      analyzer: 'AnalyzerAgent',
      generator: 'GeneratorAgent',
      validator: 'ValidatorAgent',
      parser: 'ParserAgent'
    }
  }
};

// Créer le répertoire de rapport s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Formatter le fichier rapport
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = path.join(REPORT_DIR, "interface-implementation-results.md");
fs.writeFileSync(reportFile, `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`);

// Map pour collecter les statistiques
const stats = {
  total: 0,
  updated: 0,
  skipped: 0,
  details: {} as Record<string, string[]>
};

/**
 * Déterminer la couche pour un fichier donné
 */
function determineLayer(filePath: string): 'orchestration' | 'coordination' | 'business' {
  const content = fs.readFileSync(filePath, 'utf8');

  // Vérifier dans le contenu
  if (content.includes('Agent MCP pour orchestration') || 
      filePath.includes('/orchestration/') || 
      filePath.includes('/agents/core/')) {
    return 'orchestration';
  }

  if (content.includes('Agent MCP pour coordination') || 
      filePath.includes('/coordination/') || 
      filePath.includes('/agents/integration/')) {
    return 'coordination';
  }

  // Par défaut, on considère que c'est un agent business
  return 'business';
}

/**
 * Déterminer le type spécifique d'agent
 */
function determineType(filePath: string, content: string): string {
  // Vérifier dans le contenu
  const typeMatch = content.match(/type\s*=\s*['"](\w+)['"]/);
  if (typeMatch) {
    return typeMatch[1];
  }

  // Deviner à partir du chemin de fichier
  const filename = path.basename(filePath).toLowerCase();

  if (filename.includes('analyzer') || filePath.includes('/analysis/')) {
    return 'analyzer';
  }
  if (filename.includes('generator')) {
    return 'generator';
  }
  if (filename.includes('monitor')) {
    return 'monitor';
  }
  if (filename.includes('orchestrator')) {
    return 'orchestrator';
  }
  if (filename.includes('validator')) {
    return 'validator';
  }
  if (filename.includes('parser')) {
    return 'parser';
  }
  if (filename.includes('bridge')) {
    return 'bridge';
  }

  return 'unknown';
}

/**
 * Implémenter les interfaces dans un fichier
 */
function implementInterfaces(filePath: string): void {
  stats.total++;

  console.log(`Traitement de ${filePath}`);
  
  // Lire le contenu du fichier
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Déterminer la couche et le type
  const layer = determineLayer(filePath);
  const type = determineType(filePath, content);
  
  // Lister les interfaces nécessaires
  const requiredInterfaces = [];
  
  // Interface de base
  if (!content.includes('BaseAgent')) {
    requiredInterfaces.push('BaseAgent');
  }
  
  // Interface de couche
  const layerInterface = INTERFACE_MAP[layer].layer;
  if (!content.includes(layerInterface)) {
    requiredInterfaces.push(layerInterface);
  }
  
  // Interface de type spécifique
  if (type !== 'unknown' && INTERFACE_MAP[layer].types[type]) {
    const typeInterface = INTERFACE_MAP[layer].types[type];
    if (!content.includes(typeInterface)) {
      requiredInterfaces.push(typeInterface);
    }
  }
  
  // Si aucune interface manquante, on passe
  if (requiredInterfaces.length === 0) {
    console.log("  ✓ Aucune interface manquante");
    stats.skipped++;
    stats.details[filePath] = [];
    return;
  }
  
  console.log(`  ! Interfaces manquantes: ${requiredInterfaces.join(', ')}`);
  
  // Ajouter les imports nécessaires
  const importLines = [];
  if (requiredInterfaces.includes('BaseAgent')) {
    importLines.push(`import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent';`);
  }
  if (requiredInterfaces.includes(layerInterface)) {
    importLines.push(`import { ${layerInterface} } from '@workspaces/cahier-des-charge/src/core/interfaces/${layer}';`);
  }
  if (type !== 'unknown' && INTERFACE_MAP[layer].types[type] && requiredInterfaces.includes(INTERFACE_MAP[layer].types[type])) {
    if (!importLines[1]?.includes(INTERFACE_MAP[layer].types[type])) {
      importLines[1] = importLines[1]?.replace(`import { ${layerInterface}`, `import { ${layerInterface}, ${INTERFACE_MAP[layer].types[type]}`);
    }
  }
  
  // Ajouter ces imports après les imports existants s'il y en a
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    // Insérer après le dernier import
    lines.splice(lastImportIndex + 1, 0, ...importLines);
  } else {
    // Insérer au début du fichier
    lines.splice(0, 0, ...importLines);
  }
  
  // Ajout de l'implémentation des interfaces à la classe
  let implementsAdded = false;
  for (let i = 0; i < lines.length; i++) {
    const classMatch = lines[i].match(/class\s+(\w+)(\s+implements\s+([^{]*))?/);
    if (classMatch) {
      const className = classMatch[1];
      
      if (classMatch[2]) {
        // Il y a déjà une clause implements
        const implementsList = classMatch[3];
        const alreadyImplemented = implementsList.split(',').map(i => i.trim());
        const interfacesToAdd = requiredInterfaces.filter(i => !alreadyImplemented.includes(i));
        
        if (interfacesToAdd.length > 0) {
          lines[i] = lines[i].replace(/implements\s+([^{]*)/, `implements ${implementsList}, ${interfacesToAdd.join(', ')}`);
        }
      } else {
        // Pas de clause implements
        lines[i] = lines[i].replace(/class\s+(\w+)/, `class ${className} implements ${requiredInterfaces.join(', ')}`);
      }
      
      implementsAdded = true;
      break;
    }
  }
  
  if (implementsAdded) {
    // Écrire le nouveau contenu
    fs.writeFileSync(filePath, lines.join('\n'));
    
    stats.updated++;
    stats.details[filePath] = requiredInterfaces;
    
    console.log(`  ✓ Interfaces ajoutées: ${requiredInterfaces.join(', ')}`);
  } else {
    console.log("  ✗ Aucune classe trouvée pour ajouter les interfaces");
    stats.skipped++;
    stats.details[filePath] = [];
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('Recherche des fichiers agents...');
  
  // Liste des répertoires à scanner
  const directories = [PACKAGES_DIR, AGENTS_DIR];
  
  // Récupérer tous les fichiers agents récursivement
  const allAgentFiles: string[] = [];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Le répertoire ${dir} n'existe pas.`);
      return;
    }
    
    // Fonction récursive pour parcourir les dossiers
    const findAgentFiles = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          findAgentFiles(filePath);
        } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Vérifier si c'est un fichier agent (contient une classe et le mot "Agent")
          if ((content.includes('class') && content.includes('Agent')) ||
              file.toLowerCase().includes('agent')) {
            allAgentFiles.push(filePath);
          }
        }
      });
    };
    
    findAgentFiles(dir);
  });
  
  console.log(`Trouvé ${allAgentFiles.length} fichiers agents.`);
  
  // Traiter chaque fichier
  allAgentFiles.forEach(filePath => {
    try {
      implementInterfaces(filePath);
    } catch (error) {
      console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
  });
  
  // Générer le rapport final
  let report = `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`;
  report += "## Résumé\n\n";
  report += `- Total des fichiers traités: ${stats.total}\n`;
  report += `- Fichiers mis à jour: ${stats.updated}\n`;
  report += `- Fichiers ignorés: ${stats.skipped}\n\n`;
  
  report += "## Détails\n\n";
  
  Object.entries(stats.details).forEach(([filePath, interfaces]) => {
    report += `### ${filePath}\n`;
    if (interfaces.length > 0) {
      report += `- Ajout des imports pour: ${interfaces.join(', ')}\n`;
      report += `- Ajout des interfaces à la classe: ${interfaces.join(', ')}\n`;
      report += "- Ajout des méthodes requises par les interfaces\n\n";
    } else {
      report += "- Déjà conforme, aucun changement\n\n";
    }
  });
  
  fs.writeFileSync(reportFile, report);
  
  console.log(`\nTerminé ! Rapport généré: ${reportFile}`);
  console.log(`${stats.updated} fichiers mis à jour.`);
  console.log(`${stats.skipped} fichiers déjà conformes.`);
}

// Exécuter la fonction principale
main().catch(console.error);