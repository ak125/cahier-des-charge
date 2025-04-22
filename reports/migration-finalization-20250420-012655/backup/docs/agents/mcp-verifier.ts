/**
 * MCP Verifier - Vérificateur de qualité pour les fichiers .tsx générés
 * 
 * Ce module analyse les fichiers .tsx générés lors de la migration PHP vers Remix
 * pour s'assurer qu'ils respectent les bonnes pratiques et les standards de qualité.
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import { MCPManifestManager } from '.DotMcpManifestManager';
import * as ts from 'typescript';
import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';
import { createLocalAiService } from '../packages/shared/ai/local-ai.service';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


// Types
export interface VerifierConfig {
  manifestPath: string;
  frontendAppDir: string;
  eslintConfigPath?: string;
  typescriptOptions?: ts.CompilerOptions;
  aiConfig?: {
    redisUrl: string;
    ollamaUrl: string;
    model: string;
  };
  reportPath?: string;
  autofix?: boolean;
  verbose?: boolean;
}

export interface VerificationResult {
  file: string;
  passed: boolean;
  issues: VerificationIssue[];
  fixesApplied?: string[];
  score: number;
}

export interface VerificationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  autoFixable?: boolean;
  rule?: string;
}

interface FileStats {
  lines: number;
  imports: number;
  hooks: number;
  jsxElements: number;
  hasDataFetching: boolean;
  hasHandleExport: boolean;
  hasForms: boolean;
  complexity: number;
}

/**
 * Classe principale du vérificateur
 */
export class MCPVerifier implements BaseAgent, BusinessAgent {
  private logger = new Logger('MCPVerifier');
  private config: VerifierConfig;
  private manifestManager: MCPManifestManager;
  private results: Record<string, VerificationResult> = {};
  private aiService: any;
  
  constructor(config: VerifierConfig) {
    this.config = {
      ...config,
      eslintConfigPath: config.eslintConfigPath || path.join(process.cwd(), '.eslintrc.js'),
      typescriptOptions: config.typescriptOptions || {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        strict: true,
      },
      reportPath: config.reportPath || path.join(process.cwd(), 'reports', 'verification-report.json'),
      autofix: config.autofix !== undefined ? config.autofix : false,
      verbose: config.verbose !== undefined ? config.verbose : false,
    };
    
    this.manifestManager = new MCPManifestManager(this.config.manifestPath);
    
    // Initialiser le service d'IA si configuré
    if (this.config.aiConfig) {
      this.aiService = createLocalAiService({
        redisUrl: this.config.aiConfig.redisUrl || 'redis://localhost:6379',
        ollamaUrl: this.config.aiConfig.ollamaUrl || 'http://localhost:11434',
        model: this.config.aiConfig.model || 'deepseek-coder',
        useCache: true
      });
    }
  }
  
  /**
   * Vérifie tous les fichiers .tsx générés
   */
  public async verifyAll(): Promise<Record<string, VerificationResult>> {
    try {
      await this.manifestManager.load();
      
      // Récupérer toutes les migrations
      const migrations = this.manifestManager.getAllMigrations();
      
      // Filtrer les migrations qui ont des fichiers .tsx à vérifier
      const migrationsWithTsxFiles = migrations.filter(m => {
        return m.targetFiles && 
               Object.values(m.targetFiles).some(f => f.endsWith('.tsx'));
      });
      
      this.logger.log(`🔍 Vérification de ${migrationsWithTsxFiles.length} migrations avec fichiers .tsx`);
      
      // Traiter chaque migration
      for (const migration of migrationsWithTsxFiles) {
        const tsxFiles = Object.values(migration.targetFiles).filter(f => f.endsWith('.tsx'));
        
        for (const tsxFile of tsxFiles) {
          const result = await this.verifyFile(tsxFile, migration.id);
          this.results[tsxFile] = result;
          
          // Mettre à jour le status dans le manifeste
          this.updateManifestStatus(migration.id, result);
        }
      }
      
      // Générer le rapport
      await this.generateReport();
      
      return this.results;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la vérification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Vérifie un seul fichier .tsx
   */
  public async verifyFile(filePath: string, migrationId?: string): Promise<VerificationResult> {
    this.logger.log(`🔍 Vérification du fichier: ${filePath}`);
    
    // Initialiser le résultat
    const result: VerificationResult = {
      file: filePath,
      passed: true,
      issues: [],
      fixesApplied: [],
      score: 100
    };
    
    try {
      // Vérifier si le fichier existe
      if (!await fs.pathExists(filePath)) {
        result.passed = false;
        result.issues.push({
          type: 'error',
          message: `Le fichier ${filePath} n'existe pas`,
          rule: 'file-exists'
        });
        result.score = 0;
        return result;
      }
      
      // Lire le contenu du fichier
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Effectuer les vérifications
      await this.checkTypeScript(filePath, content, result);
      this.checkESLint(filePath, result);
      this.checkImportPatterns(content, result);
      this.checkCodeCoverage(content, result);
      const stats = this.analyzeFileStats(content, filePath);
      this.checkComplexity(stats, result);
      this.checkDataFetching(stats, content, result);
      
      // Vérifier les bonnes pratiques de React
      this.checkReactBestPractices(content, result);
      
      // Vérification de l'accessibilité
      this.checkAccessibility(content, result);
      
      // Analyse supplémentaire avec IA si disponible
      if (this.aiService && content.length > 0) {
        await this.runAIAnalysis(filePath, content, result);
      }
      
      // Appliquer des corrections automatiques si activé
      if (this.config.autofix && result.issues.some(i => i.autoFixable)) {
        await this.applyAutoFixes(filePath, content, result);
      }
      
      // Calculer le score final
      this.calculateScore(result);
      
      // Vérifier si le test a passé
      result.passed = result.issues.filter(i => i.type === 'error').length === 0;
      
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la vérification de ${filePath}: ${error.message}`);
      
      result.passed = false;
      result.issues.push({
        type: 'error',
        message: `Erreur lors de la vérification: ${error.message}`,
        rule: 'verification-process'
      });
      result.score = 0;
      
      return result;
    }
  }
  
  /**
   * Vérifie la compilation TypeScript
   */
  private async checkTypeScript(filePath: string, content: string, result: VerificationResult): Promise<void> {
    try {
      // Créer un programme TypeScript
      const host = ts.createCompilerHost(this.config.typescriptOptions!);
      const program = ts.createProgram([filePath], this.config.typescriptOptions!, host);
      
      // Obtenir les diagnostics
      const diagnostics = [
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics(),
      ];
      
      // Ajouter les problèmes au résultat
      if (diagnostics.length > 0) {
        for (const diagnostic of diagnostics) {
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          const location = diagnostic.file && diagnostic.start ? 
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : 
            undefined;
          
          result.issues.push({
            type: 'error',
            message: `TypeScript: ${message}`,
            line: location?.line,
            column: location?.character,
            rule: 'typescript'
          });
        }
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de la vérification TypeScript: ${error.message}`);
      result.issues.push({
        type: 'error',
        message: `Erreur TypeScript: ${error.message}`,
        rule: 'typescript-check'
      });
    }
  }
  
  /**
   * Vérifie les règles ESLint
   */
  private checkESLint(filePath: string, result: VerificationResult): void {
    try {
      // Exécuter ESLint
      const eslintOutput = execSync(`npx eslint --format json ${filePath}`, { encoding: 'utf-8' });
      const eslintResults = JSON.parse(eslintOutput);
      
      // Ajouter les problèmes au résultat
      if (eslintResults.length > 0 && eslintResults[0].messages.length > 0) {
        const messages = eslintResults[0].messages;
        
        for (const message of messages) {
          result.issues.push({
            type: message.severity === 2 ? 'error' : 'warning',
            message: `ESLint: ${message.message}`,
            line: message.line,
            column: message.column,
            autoFixable: message.fix !== undefined,
            rule: `eslint:${message.ruleId}`
          });
        }
      }
    } catch (error: any) {
      // ESLint peut retourner un code d'erreur lorsqu'il trouve des problèmes
      try {
        const output = error.stdout.toString();
        const eslintResults = JSON.parse(output);
        
        if (eslintResults.length > 0 && eslintResults[0].messages.length > 0) {
          const messages = eslintResults[0].messages;
          
          for (const message of messages) {
            result.issues.push({
              type: message.severity === 2 ? 'error' : 'warning',
              message: `ESLint: ${message.message}`,
              line: message.line,
              column: message.column,
              autoFixable: message.fix !== undefined,
              rule: `eslint:${message.ruleId}`
            });
          }
        }
      } catch (parseError) {
        this.logger.warn(`⚠️ Erreur lors de la vérification ESLint: ${error.message}`);
        result.issues.push({
          type: 'warning',
          message: `Erreur ESLint: ${error.message}`,
          rule: 'eslint-check'
        });
      }
    }
  }
  
  /**
   * Vérifie les patterns d'imports
   */
  private checkImportPatterns(content: string, result: VerificationResult): void {
    try {
      // Vérifier les imports React
      if (!content.includes('import React') && content.includes('React.')) {
        result.issues.push({
          type: 'warning',
          message: 'Import React manquant alors que React est utilisé directement',
          autoFixable: true,
          rule: 'import-patterns'
        });
      }
      
      // Vérifier les imports Remix
      const remixImports = [
        'useLoaderData',
        'useActionData',
        'useNavigation',
        'Form',
        'json',
        'redirect'
      ];
      
      for (const importName of remixImports) {
        if (content.includes(importName) && !content.includes(`import { ${importName}`) && !content.includes(`import {${importName}`)) {
          result.issues.push({
            type: 'warning',
            message: `Utilisation de ${importName} sans import correspondant`,
            autoFixable: true,
            rule: 'import-patterns'
          });
        }
      }
      
      // Vérifier l'utilisation d'exports Remix
      if ((content.includes('loader') || content.includes('action')) && !content.includes('export async function')) {
        result.issues.push({
          type: 'warning',
          message: 'Fonction loader/action utilisée sans export',
          rule: 'export-patterns'
        });
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de la vérification des imports: ${error.message}`);
    }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }
  }
  
  /**
   * Vérifie la couverture du code
   */
  private checkCodeCoverage(content: string, result: VerificationResult): void {
    // Vérifier les commentaires
    const lines = content.split('\n');
    const codeLines = lines.filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*') && line.trim() !== '');
    const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('*'));
    
    const commentRatio = commentLines.length / (codeLines.length || 1);
    
    if (commentRatio < 0.1) {
      result.issues.push({
        type: 'warning',
        message: 'Faible ratio de commentaires dans le code (< 10%)',
        rule: 'code-coverage'
      });
    }
    
    // Vérifier la documentation des fonctions exportées
    if ((content.includes('export function') || content.includes('export const')) && !content.includes('/**')) {
      result.issues.push({
        type: 'warning',
        message: 'Documentation JSDoc manquante pour les fonctions exportées',
        rule: 'code-documentation'
      });
    }
  }
  
  /**
   * Analyse les statistiques du fichier
   */
  private analyzeFileStats(content: string, filePath: string): FileStats {
    try {
      const ast = babelParse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      const stats: FileStats = {
        lines: content.split('\n').length,
        imports: 0,
        hooks: 0,
        jsxElements: 0,
        hasDataFetching: false,
        hasHandleExport: false,
        hasForms: false,
        complexity: 0
      };
      
      traverse(ast, {
        ImportDeclaration() {
          stats.imports++;
        },
        CallExpression(path) {
          const callee = path.node.callee;
          if (callee.type === 'Identifier' && callee.name.startsWith('use')) {
            stats.hooks++;
          }
        },
        JSXElement() {
          stats.jsxElements++;
        },
        JSXOpeningElement(path) {
          if (path.node.name.type === 'JSXIdentifier' && path.node.name.name === 'Form') {
            stats.hasForms = true;
          }
        },
        ExportNamedDeclaration(path) {
          const declaration = path.node.declaration;
          if (declaration && declaration.type === 'FunctionDeclaration') {
            if (declaration.id?.name === 'loader' || declaration.id?.name === 'action') {
              stats.hasDataFetching = true;
            }
            if (declaration.id?.name === 'handle') {
              stats.hasHandleExport = true;
            }
          }
        }
      });
      
      // Calculer la complexité (heuristique basique)
      stats.complexity = stats.lines / 10 + stats.imports / 3 + stats.hooks + (stats.hasForms ? 2 : 0) + (stats.hasDataFetching ? 2 : 0);
      
      return stats;
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de l'analyse du fichier ${filePath}: ${error.message}`);
      return {
        lines: content.split('\n').length,
        imports: 0,
        hooks: 0,
        jsxElements: 0,
        hasDataFetching: false,
        hasHandleExport: false,
        hasForms: false,
        complexity: 0
      };
    }
  }
  
  /**
   * Vérifie la complexité du code
   */
  private checkComplexity(stats: FileStats, result: VerificationResult): void {
    // Vérifier la longueur du fichier
    if (stats.lines > 300) {
      result.issues.push({
        type: 'warning',
        message: `Fichier trop long (${stats.lines} lignes), devrait être divisé en composants plus petits`,
        rule: 'complexity'
      });
    }
    
    // Vérifier le nombre d'imports
    if (stats.imports > 15) {
      result.issues.push({
        type: 'warning',
        message: `Trop d'imports (${stats.imports}), considérer une meilleure organisation`,
        rule: 'complexity'
      });
    }
    
    // Vérifier la complexité générale
    if (stats.complexity > 10) {
      result.issues.push({
        type: 'warning',
        message: `Complexité élevée (${stats.complexity.toFixed(1)}), envisager de simplifier le composant`,
        rule: 'complexity'
      });
    }
  }
  
  /**
   * Vérifie les patterns de récupération de données
   */
  private checkDataFetching(stats: FileStats, content: string, result: VerificationResult): void {
    // Vérifier l'utilisation correcte de loader/action
    if (stats.hasDataFetching) {
      if (!content.includes('useLoaderData') && content.includes('loader')) {
        result.issues.push({
          type: 'warning',
          message: 'Fonction loader exportée mais données non utilisées avec useLoaderData',
          rule: 'data-fetching'
        });
      }
      
      if (!content.includes('useActionData') && content.includes('action')) {
        result.issues.push({
          type: 'warning',
          message: 'Fonction action exportée mais données non utilisées avec useActionData',
          rule: 'data-fetching'
        });
      }
      
      // Vérifier les types de retour
      if (content.includes('loader') && !content.includes('return json(')) {
        result.issues.push({
          type: 'warning',
          message: 'La fonction loader devrait retourner un appel à json()',
          rule: 'data-fetching'
        });
      }
    }
    
    // Vérifier la gestion des erreurs
    if (stats.hasDataFetching && !content.includes('try') && !content.includes('catch')) {
      result.issues.push({
        type: 'warning',
        message: 'Gestion des erreurs manquante dans les fonctions de récupération de données',
        rule: 'error-handling'
      });
    }
  }
  
  /**
   * Vérifie les bonnes pratiques React
   */
  private checkReactBestPractices(content: string, result: VerificationResult): void {
    // Vérifier les problèmes courants
    if (content.includes('useState') && !content.includes('useEffect') && content.includes('fetch(')) {
      result.issues.push({
        type: 'warning',
        message: 'Appel fetch() sans useEffect, risque de fuites mémoire ou rendus infinis',
        rule: 'react-best-practices'
      });
    }
    
    if (content.includes('useState') && content.match(/setState\(.+\)/) && content.match(/setState\(.+state.+\)/)) {
      result.issues.push({
        type: 'warning',
        message: 'Fonction setState utilisant l\'état précédent sans fonction de mise à jour',
        rule: 'react-best-practices'
      });
    }
    
    // Vérifier les clés dans les listes
    if ((content.includes('map(') || content.includes('.map((')) && 
        content.includes('</') && 
        !content.match(/key=\{[^{}]+\}/)) {
      result.issues.push({
        type: 'warning',
        message: 'Rendu de liste sans propriété key',
        rule: 'react-keys'
      });
    }
  }
  
  /**
   * Vérifie l'accessibilité
   */
  private checkAccessibility(content: string, result: VerificationResult): void {
    // Vérifier les attributs ARIA
    if (content.includes('<img') && !content.includes('alt=')) {
      result.issues.push({
        type: 'warning',
        message: 'Images sans attribut alt',
        rule: 'accessibility'
      });
    }
    
    // Vérifier les éléments interactifs
    if ((content.includes('<button') || content.includes('<a')) && 
        !content.includes('aria-label') && 
        !content.includes('aria-labelledby')) {
      result.issues.push({
        type: 'info',
        message: 'Considérer l\'ajout d\'attributs ARIA pour les éléments interactifs',
        rule: 'accessibility'
      });
    }
  }
  
  /**
   * Exécute une analyse d'IA sur le fichier
   */
  private async runAIAnalysis(filePath: string, content: string, result: VerificationResult): Promise<void> {
    try {
      const fileName = path.basename(filePath);
      const prompt = `Analyser ce fichier ${fileName} et identifier tout problème potentiel ou amélioration:
\`\`\`tsx
${content.substring(0, 2000)} ${content.length > 2000 ? '...(contenu tronqué)' : ''}
\`\`\``;
      
      const analysisResult = await this.aiService.analyzeCode(
        content.substring(0, 3000),
        'tsx',
        `Fichier: ${fileName}\nVérifier les problèmes potentiels et les améliorations possibles dans ce composant Remix.`
      );
      
      // Extraire les suggestions
      const suggestions = analysisResult.split('\n')
        .filter(line => line.includes('problème') || line.includes('amélioration') || line.includes('suggestion'))
        .map(line => line.trim())
        .filter(line => line.length > 10);
      
      for (const suggestion of suggestions) {
        result.issues.push({
          type: 'info',
          message: `IA: ${suggestion}`,
          rule: 'ai-suggestion'
        });
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de l'analyse IA: ${error.message}`);
    }
  }
  
  /**
   * Applique les corrections automatiques
   */
  private async applyAutoFixes(filePath: string, content: string, result: VerificationResult): Promise<void> {
    try {
      // Appliquer ESLint autofix
      try {
        execSync(`npx eslint --fix ${filePath}`, { encoding: 'utf-8' });
        result.fixesApplied = result.fixesApplied || [];
        result.fixesApplied.push('ESLint auto-fixes appliquées');
      } catch (eslintError) {
        // Ignorer les erreurs ESLint ici
      }
      
      // Lire le contenu mis à jour
      const updatedContent = await fs.readFile(filePath, 'utf-8');
      
      // Si aucun changement n'a été fait, appliquer nos propres corrections
      if (content === updatedContent) {
        let newContent = updatedContent;
        
        // Corriger les imports manquants
        if (!newContent.includes('import React') && newContent.includes('React.')) {
          newContent = `import React from 'react';\n${newContent}`;
          result.fixesApplied = result.fixesApplied || [];
          result.fixesApplied.push('Import React ajouté');
        }
        
        // Sauvegarder si des modifications ont été apportées
        if (newContent !== updatedContent) {
          await fs.writeFile(filePath, newContent, 'utf-8');
        }
      } else {
        result.fixesApplied = result.fixesApplied || [];
        result.fixesApplied.push('Corrections ESLint appliquées');
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Erreur lors de l'application des corrections: ${error.message}`);
    }
  }
  
  /**
   * Calcule le score final
   */
  private calculateScore(result: VerificationResult): void {
    const errorCount = result.issues.filter(i => i.type === 'error').length;
    const warningCount = result.issues.filter(i => i.type === 'warning').length;
    const infoCount = result.issues.filter(i => i.type === 'info').length;
    
    // Formule de calcul du score
    let score = 100;
    score -= errorCount * 20;     // -20 points par erreur
    score -= warningCount * 5;    // -5 points par avertissement
    score -= infoCount * 0.5;     // -0.5 points par info
    
    // Limiter le score entre 0 et 100
    result.score = Math.max(0, Math.min(100, score));
  }
  
  /**
   * Met à jour le statut dans le manifeste
   */
  private updateManifestStatus(migrationId: string, result: VerificationResult): void {
    try {
      const migration = this.manifestManager.getMigration(migrationId);
      
      if (!migration) {
        this.logger.warn(`⚠️ Migration ${migrationId} non trouvée dans le manifeste`);
        return;
      }
      
      // Créer ou mettre à jour l'étape de vérification
      const verificationStep = {
        name: DoDotmcp-verifier',
        status: result.passed ? 'passed' : result.score >= 70 ? 'partial' : 'failed',
        score: result.score
      };
      
      migration.verificationSteps = migration.verificationSteps || [];
      
      // Mettre à jour ou ajouter l'étape
      const existingStepIndex = migration.verificationSteps.findIndex(s => s.name === DoDotmcp-verifier');
      if (existingStepIndex >= 0) {
        migration.verificationSteps[existingStepIndex] = verificationStep;
      } else {
        migration.verificationSteps.push(verificationStep);
      }
      
      // Sauvegarder le manifeste
      this.manifestManager.updateMetadata();
      this.manifestManager.save().then(() => {
        this.logger.log(`✅ Statut de vérification mis à jour pour la migration ${migrationId}`);
      }).catch(error => {
        this.logger.error(`❌ Erreur lors de la sauvegarde du manifeste: ${error.message}`);
      });
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }
  
  /**
   * Génère un rapport de vérification
   */
  private async generateReport(): Promise<void> {
    try {
      // Créer le dossier de rapports s'il n'existe pas
      const reportDir = path.dirname(this.config.reportPath || '');
      await fs.ensureDir(reportDir);
      
      // Préparer les données du rapport
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          total: Object.keys(this.results).length,
          passed: Object.values(this.results).filter(r => r.passed).length,
          failed: Object.values(this.results).filter(r => !r.passed).length,
          averageScore: Object.values(this.results).reduce((acc, r) => acc + r.score, 0) / (Object.keys(this.results).length || 1)
        },
        results: this.results
      };
      
      // Écrire le rapport
      await fs.writeJson(this.config.reportPath!, report, { spaces: 2 });
      
      this.logger.log(`📊 Rapport de vérification généré: ${this.config.reportPath}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la génération du rapport: ${error.message}`);
    }
  }
  
  /**
   * Ferme toutes les connexions et ressources
   */
  public async close(): Promise<void> {
    // Fermer le service d'IA si disponible
    if (this.aiService) {
      await this.aiService.close();
    }
    
    this.logger.log('👋 MCPVerifier arrêté');
  }
}

/**
 * Crée une instance du vérificateur avec la configuration spécifiée
 */
export function createMCPVerifier(config: VerifierConfig): MCPVerifier {
  return new MCPVerifier(config);
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const config: VerifierConfig = {
    manifestPath: process.env.MANIFEST_PATH || path.join(process.cwd(), 'MCPManifest.json'),
    frontendAppDir: process.env.FRONTEND_APP_DIR || path.join(process.cwd(), 'apps', 'frontend'),
    autofix: process.env.AUTOFIX === 'true',
    verbose: process.env.VERBOSE === 'true',
    reportPath: process.env.REPORT_PATH || path.join(process.cwd(), 'reports', `verification-report-${new Date().toISOString().replace(/:/g, '-')}.json`),
  };
  
  console.log('🚀 Démarrage du vérificateur MCP');
  
  const verifier = createMCPVerifier(config);
  
  verifier.verifyAll()
    .then(results => {
      const totalFiles = Object.keys(results).length;
      const passedFiles = Object.values(results).filter(r => r.passed).length;
      const failedFiles = totalFiles - passedFiles;
      
      console.log(`
📊 Résumé de la vérification:
✅ ${passedFiles}/${totalFiles} fichiers validés
❌ ${failedFiles}/${totalFiles} fichiers avec des problèmes
`);
      
      // Afficher les fichiers avec des problèmes
      if (failedFiles > 0) {
        console.log('Fichiers avec des problèmes:');
        Object.entries(results)
          .filter(([_, result]) => !result.passed)
          .forEach(([file, result]) => {
            console.log(`- ${file}: ${result.issues.length} problèmes, score: ${result.score.toFixed(1)}`);
          });
      }
      
      return verifier.close();
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error.message}`);
      verifier.close();
      process.exit(1);
    });
}