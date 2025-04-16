/**
 * Agent TypeScriptStructureValidator
 * Valide la structure et les bonnes pratiques du code TypeScript
 * Date: 16 avril 2025
 */

import { AbstractValidatorAgent, ValidatorConfig, ValidationRule, ValidationResult, ValidationViolation } from '../core/abstract-validator-agent';
import { AgentContext } from '../core/mcp-agent';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';
import * as glob from 'glob';

/**
 * Configuration spécifique à l'agent TypeScriptStructureValidator
 */
export interface TypeScriptValidatorConfig extends ValidatorConfig {
  projectRoot?: string;        // Racine du projet TypeScript
  tsConfigPath?: string;       // Chemin vers le fichier tsconfig.json
  maxComplexity?: number;      // Complexité cyclomatique maximale autorisée
  maxFileLength?: number;      // Nombre maximal de lignes par fichier
  maxFunctionLength?: number;  // Nombre maximal de lignes par fonction
  enforcePascalCaseClasses?: boolean; // Imposer le PascalCase pour les classes
  enforceCamelCaseFunctions?: boolean; // Imposer le camelCase pour les fonctions
  enforceInterfacePrefixI?: boolean;   // Imposer le préfixe "I" pour les interfaces
  ignorePatterns?: string[];   // Motifs de fichiers à ignorer
}

/**
 * Agent qui analyse la structure et la qualité du code TypeScript
 */
export class TypeScriptStructureValidator extends AbstractValidatorAgent<TypeScriptValidatorConfig> {
  // Identifiants de l'agent
  public id = 'typescript-structure-validator';
  public name = 'TypeScript Structure Validator';
  public version = '1.0.0';
  public description = 'Analyse la structure et la qualité du code TypeScript';

  // Cache pour les fichiers analysés
  private parsedFiles: Map<string, ts.SourceFile> = new Map();
  private typeChecker?: ts.TypeChecker;
  private program?: ts.Program;

  /**
   * Constructeur
   * @param config Configuration de l'agent
   */
  constructor(config: Partial<TypeScriptValidatorConfig>) {
    super({
      // Configuration par défaut
      threshold: 75,
      outputDir: './reports/ts-validator',
      reportFormat: 'md',
      maxComplexity: 15,
      maxFileLength: 500,
      maxFunctionLength: 50,
      enforcePascalCaseClasses: true,
      enforceCamelCaseFunctions: true,
      enforceInterfacePrefixI: false,
      ignorePatterns: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts', '**/*.spec.ts'],
      ...config
    });
  }

  /**
   * Initialise le compilateur TypeScript et les règles
   */
  protected async loadDefaultRules(): Promise<void> {
    this.logger.info('Chargement des règles de validation TypeScript');

    // Initialiser le programme TypeScript si un chemin vers tsconfig est fourni
    if (this.config.tsConfigPath && await fs.pathExists(this.config.tsConfigPath)) {
      try {
        this.logger.info(`Initialisation du compilateur TypeScript avec ${this.config.tsConfigPath}`);
        const configFile = ts.readConfigFile(this.config.tsConfigPath, ts.sys.readFile);
        
        if (configFile.error) {
          throw new Error(`Erreur lors de la lecture du fichier tsconfig: ${configFile.error.messageText}`);
        }
        
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(this.config.tsConfigPath)
        );
        
        if (parsedConfig.errors.length) {
          throw new Error(`Erreur lors de l'analyse du fichier tsconfig: ${parsedConfig.errors[0].messageText}`);
        }
        
        this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
        this.typeChecker = this.program.getTypeChecker();
        
        this.logger.info(`Compilateur TypeScript initialisé avec ${parsedConfig.fileNames.length} fichiers`);
      } catch (error: any) {
        this.logger.error(`Erreur lors de l'initialisation du compilateur TypeScript: ${error.message}`);
        this.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Règle: Nommage des classes (PascalCase)
    this.addRule({
      id: 'class-naming',
      name: 'Nommage des classes',
      description: 'Les classes doivent utiliser le format PascalCase',
      category: 'style',
      severity: 'warning',
      enabled: this.config.enforcePascalCaseClasses,
      validate: async (input: string | string[], context?: any) => {
        if (!this.config.enforcePascalCaseClasses) {
          return { valid: true, violations: [] };
        }
        
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const sourceFile = await this.getSourceFile(file);
          if (sourceFile) {
            this.findClassDeclarations(sourceFile).forEach(classNode => {
              const className = classNode.name?.text;
              if (className && !this.isPascalCase(className)) {
                violations.push({
                  ruleId: 'class-naming',
                  message: `La classe "${className}" n'utilise pas le format PascalCase`,
                  severity: 'warning',
                  location: {
                    file: file,
                    line: sourceFile.getLineAndCharacterOfPosition(classNode.name!.getStart()).line + 1
                  },
                  fix: `Renommer en ${this.toPascalCase(className)}`,
                  autoFixable: true
                });
              }
            });
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      },
      fix: async (input: string, context: any) => {
        // La correction automatique n'est pas implémentée pour l'exemple
        return input;
      }
    });

    // Règle: Nommage des fonctions (camelCase)
    this.addRule({
      id: 'function-naming',
      name: 'Nommage des fonctions',
      description: 'Les fonctions doivent utiliser le format camelCase',
      category: 'style',
      severity: 'warning',
      enabled: this.config.enforceCamelCaseFunctions,
      validate: async (input: string | string[], context?: any) => {
        if (!this.config.enforceCamelCaseFunctions) {
          return { valid: true, violations: [] };
        }
        
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const sourceFile = await this.getSourceFile(file);
          if (sourceFile) {
            this.findFunctionDeclarations(sourceFile).forEach(funcNode => {
              const funcName = funcNode.name?.text;
              if (funcName && !this.isCamelCase(funcName)) {
                violations.push({
                  ruleId: 'function-naming',
                  message: `La fonction "${funcName}" n'utilise pas le format camelCase`,
                  severity: 'warning',
                  location: {
                    file: file,
                    line: sourceFile.getLineAndCharacterOfPosition(funcNode.name!.getStart()).line + 1
                  },
                  fix: `Renommer en ${this.toCamelCase(funcName)}`,
                  autoFixable: true
                });
              }
            });
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      }
    });

    // Règle: Préfixe I pour les interfaces
    this.addRule({
      id: 'interface-naming',
      name: 'Nommage des interfaces',
      description: 'Les interfaces doivent commencer par "I" suivi de PascalCase',
      category: 'style',
      severity: 'info',
      enabled: this.config.enforceInterfacePrefixI,
      validate: async (input: string | string[], context?: any) => {
        if (!this.config.enforceInterfacePrefixI) {
          return { valid: true, violations: [] };
        }
        
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const sourceFile = await this.getSourceFile(file);
          if (sourceFile) {
            this.findInterfaceDeclarations(sourceFile).forEach(interfaceNode => {
              const interfaceName = interfaceNode.name.text;
              if (!interfaceName.startsWith('I') || !this.isPascalCase(interfaceName.substring(1))) {
                violations.push({
                  ruleId: 'interface-naming',
                  message: `L'interface "${interfaceName}" ne commence pas par "I" suivi de PascalCase`,
                  severity: 'info',
                  location: {
                    file: file,
                    line: sourceFile.getLineAndCharacterOfPosition(interfaceNode.name.getStart()).line + 1
                  },
                  fix: `Renommer en I${this.toPascalCase(interfaceName)}`,
                  autoFixable: true
                });
              }
            });
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      }
    });

    // Règle: Complexité cyclomatique
    this.addRule({
      id: 'cyclomatic-complexity',
      name: 'Complexité cyclomatique',
      description: `La complexité cyclomatique des fonctions doit être inférieure à ${this.config.maxComplexity}`,
      category: 'maintainability',
      severity: 'error',
      validate: async (input: string | string[], context?: any) => {
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const sourceFile = await this.getSourceFile(file);
          if (sourceFile) {
            const functions = this.findFunctionDeclarations(sourceFile);
            
            for (const func of functions) {
              const complexity = this.calculateComplexity(func);
              if (complexity > (this.config.maxComplexity || 15)) {
                violations.push({
                  ruleId: 'cyclomatic-complexity',
                  message: `La fonction "${func.name?.text || 'anonyme'}" a une complexité de ${complexity}, supérieure à la limite de ${this.config.maxComplexity}`,
                  severity: 'error',
                  location: {
                    file: file,
                    line: sourceFile.getLineAndCharacterOfPosition(func.getStart()).line + 1
                  },
                  fix: `Refactoriser la fonction pour réduire sa complexité`,
                  autoFixable: false
                });
              }
            }
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      }
    });

    // Règle: Taille des fichiers
    this.addRule({
      id: 'file-length',
      name: 'Taille des fichiers',
      description: `Les fichiers ne doivent pas dépasser ${this.config.maxFileLength} lignes`,
      category: 'maintainability',
      severity: 'warning',
      validate: async (input: string | string[], context?: any) => {
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const lineCount = content.split('\n').length;
          
          if (lineCount > (this.config.maxFileLength || 500)) {
            violations.push({
              ruleId: 'file-length',
              message: `Le fichier contient ${lineCount} lignes, ce qui dépasse la limite de ${this.config.maxFileLength}`,
              severity: 'warning',
              location: { file },
              fix: `Diviser le fichier en modules plus petits`,
              autoFixable: false
            });
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      }
    });

    // Règle: Taille des fonctions
    this.addRule({
      id: 'function-length',
      name: 'Taille des fonctions',
      description: `Les fonctions ne doivent pas dépasser ${this.config.maxFunctionLength} lignes`,
      category: 'maintainability',
      severity: 'warning',
      validate: async (input: string | string[], context?: any) => {
        const violations: ValidationViolation[] = [];
        const files = await this.getFileList(input);
        
        for (const file of files) {
          const sourceFile = await this.getSourceFile(file);
          if (sourceFile) {
            this.findFunctionDeclarations(sourceFile).forEach(funcNode => {
              const funcText = funcNode.getText();
              const lineCount = funcText.split('\n').length;
              
              if (lineCount > (this.config.maxFunctionLength || 50)) {
                violations.push({
                  ruleId: 'function-length',
                  message: `La fonction "${funcNode.name?.text || 'anonyme'}" contient ${lineCount} lignes, ce qui dépasse la limite de ${this.config.maxFunctionLength}`,
                  severity: 'warning',
                  location: {
                    file: file,
                    line: sourceFile.getLineAndCharacterOfPosition(funcNode.getStart()).line + 1
                  },
                  fix: `Refactoriser la fonction en sous-fonctions plus petites`,
                  autoFixable: false
                });
              }
            });
          }
        }
        
        return {
          valid: violations.length === 0,
          violations
        };
      }
    });

    this.logger.info(`${this.rules.length} règles de validation TypeScript chargées`);
  }

  /**
   * Retourne une liste de fichiers à valider
   */
  private async getFileList(input: string | string[]): Promise<string[]> {
    if (typeof input === 'string') {
      // Si l'entrée est un chemin de fichier unique
      if (await fs.pathExists(input) && (await fs.stat(input)).isFile()) {
        return [input];
      }
      
      // Si l'entrée est un répertoire
      if (await fs.pathExists(input) && (await fs.stat(input)).isDirectory()) {
        return glob.sync(path.join(input, '**/*.{ts,tsx}'));
      }
      
      // Sinon, c'est peut-être un motif glob
      return glob.sync(input);
    } else if (Array.isArray(input)) {
      // Si l'entrée est un tableau de chemins
      return input;
    }
    
    // Si aucune entrée valide n'est fournie, utiliser le chemin du projet
    const projectRoot = this.config.projectRoot || process.cwd();
    return glob.sync(path.join(projectRoot, '**/*.{ts,tsx}'), {
      ignore: this.config.ignorePatterns
    });
  }

  /**
   * Récupère ou analyse un fichier source TypeScript
   */
  private async getSourceFile(filePath: string): Promise<ts.SourceFile | undefined> {
    // Si le fichier est déjà dans le cache, le retourner
    if (this.parsedFiles.has(filePath)) {
      return this.parsedFiles.get(filePath);
    }
    
    try {
      // Si nous avons un programme TypeScript, utiliser le compilateur
      if (this.program) {
        const sourceFile = this.program.getSourceFile(filePath);
        if (sourceFile) {
          this.parsedFiles.set(filePath, sourceFile);
          return sourceFile;
        }
      }
      
      // Sinon, analyser manuellement le fichier
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      this.parsedFiles.set(filePath, sourceFile);
      return sourceFile;
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse du fichier ${filePath}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Calcule la complexité cyclomatique d'une fonction
   */
  private calculateComplexity(node: ts.FunctionLikeDeclaration): number {
    let complexity = 1; // Commence à 1 pour chaque fonction
    
    const visit = (n: ts.Node): void => {
      // Augmenter la complexité pour les structures conditionnelles et les boucles
      switch (n.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.ConditionalExpression: // Opérateur ternaire
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.CatchClause:
          complexity++;
          break;
        
        // Les opérateurs logiques && et || augmentent aussi la complexité
        case ts.SyntaxKind.BinaryExpression:
          const binExpr = n as ts.BinaryExpression;
          if (binExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            complexity++;
          }
          break;
      }
      
      ts.forEachChild(n, visit);
    };
    
    if (node.body) {
      visit(node.body);
    }
    
    return complexity;
  }

  /**
   * Recherche les déclarations de classes dans un fichier source
   */
  private findClassDeclarations(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
    const classes: ts.ClassDeclaration[] = [];
    
    const visit = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node) && node.name) {
        classes.push(node);
      }
      ts.forEachChild(node, visit);
    };
    
    ts.forEachChild(sourceFile, visit);
    return classes;
  }

  /**
   * Recherche les déclarations d'interfaces dans un fichier source
   */
  private findInterfaceDeclarations(sourceFile: ts.SourceFile): ts.InterfaceDeclaration[] {
    const interfaces: ts.InterfaceDeclaration[] = [];
    
    const visit = (node: ts.Node): void => {
      if (ts.isInterfaceDeclaration(node)) {
        interfaces.push(node);
      }
      ts.forEachChild(node, visit);
    };
    
    ts.forEachChild(sourceFile, visit);
    return interfaces;
  }

  /**
   * Recherche les déclarations de fonctions dans un fichier source
   */
  private findFunctionDeclarations(sourceFile: ts.SourceFile): ts.FunctionLikeDeclaration[] {
    const functions: ts.FunctionLikeDeclaration[] = [];
    
    const visit = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        functions.push(node as ts.FunctionLikeDeclaration);
      }
      ts.forEachChild(node, visit);
    };
    
    ts.forEachChild(sourceFile, visit);
    return functions;
  }

  /**
   * Vérifie si une chaîne est au format PascalCase
   */
  private isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }

  /**
   * Vérifie si une chaîne est au format camelCase
   */
  private isCamelCase(str: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }

  /**
   * Convertit une chaîne en format PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  /**
   * Convertit une chaîne en format camelCase
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Nettoie les ressources utilisées
   */
  public async cleanup(): Promise<void> {
    this.parsedFiles.clear();
    this.program = undefined;
    this.typeChecker = undefined;
    await super.cleanup();
  }
}

/**
 * Exporte une factory pour créer l'agent
 */
export const createTypescriptStructureValidator = (config?: Partial<TypeScriptValidatorConfig>) => {
  return new TypeScriptStructureValidator(config || {});
};