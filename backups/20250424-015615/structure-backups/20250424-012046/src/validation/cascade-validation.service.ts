import { Injectable, Logger } from @nestjs/commonstructure-agent';
import { ConfigService } from @nestjs/configstructure-agent';
import { EventEmitter2 } from @nestjs/event-emitterstructure-agent';
import * as fs from fs/promisesstructure-agent';
import * as path from pathstructure-agent';

import { 
  ValidationLevel,
  ValidationRequest,
  ValidationResult,
  ValidationViolation,
  Validator,
  CodeFile
} from ./interfacesstructure-agent';

import {
  // Niveau 1: Validation syntaxique
  CodeLinter,
  FormattingValidator,
  NamingConventionChecker,
  ImportOrderValidator,
  
  // Niveau 2: Validation structurelle
  ArchitectureValidator,
  DependencyValidator,
  ModuleStructureValidator,
  ComponentPatternValidator,
  
  // Niveau 3: Validation fonctionnelle
  RequirementsCoverageValidator,
  BehaviorSpecValidator,
  UseCaseValidator,
  RegressionDetector,
  
  // Niveau 4: Validation technique
  PerformanceValidator,
  SecurityValidator,
  CodeQualityValidator,
  AccessibilityValidator,
  
  // Niveau 5: Validation d'intégration
  SystemIntegrationValidator,
  APICohesionValidator,
  BackwardCompatibilityValidator,
  DatabaseSchemaValidator
} from ./validatorsstructure-agent';

@Injectable()
export class CascadeValidationService {
  private readonly logger = new Logger(CascadeValidationService.name);
  private validators: Map<ValidationLevel, Validator[]> = new Map();
  private pluginValidators: Validator[] = [];
  
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    // Injecter les dépendances des validateurs
    private readonly codeLinter: CodeLinter,
    private readonly formattingValidator: FormattingValidator,
    // ... autres injections
  ) {
    this.initializeValidators();
  }
  
  /**
   * Initialise les validateurs par niveau
   */
  private initializeValidators(): void {
    // Niveau 1: Syntaxique
    this.validators.set(ValidationLevel.SYNTACTIC, [
      this.codeLinter,
      this.formattingValidator,
      new NamingConventionChecker(),
      new ImportOrderValidator()
    ]);
    
    // Niveau 2: Structurel
    this.validators.set(ValidationLevel.STRUCTURAL, [
      new ArchitectureValidator(),
      new DependencyValidator(this.configService.get('architecture')),
      new ModuleStructureValidator(),
      new ComponentPatternValidator()
    ]);
    
    // Niveau 3: Fonctionnel
    this.validators.set(ValidationLevel.FUNCTIONAL, [
      // ... initialisation des validateurs fonctionnels
    ]);
    
    // Niveau 4: Technique
    this.validators.set(ValidationLevel.TECHNICAL, [
      // ... initialisation des validateurs techniques
    ]);
    
    // Niveau 5: Intégration
    this.validators.set(ValidationLevel.INTEGRATION, [
      // ... initialisation des validateurs d'intégration
    ]);
    
    this.logger.log('Validateurs initialisés pour tous les niveaux');
  }
  
  /**
   * Enregistre un plugin de validation
   */
  registerPlugin(plugin: any): void {
    this.pluginValidators.push(...plugin.getValidators());
    this.logger.log(`Plugin de validation enregistré: ${plugin.name}`);
  }
  
  /**
   * Valide une requête à travers tous les niveaux en cascade
   */
  async validateCascade(request: ValidationRequest): Promise<ValidationResult> {
    this.logger.log(`Démarrage de la validation en cascade pour ${request.files.length} fichiers`);
    
    // Chargement des fichiers
    const codeFiles = await this.loadCodeFiles(request.files);
    let currentLevel = ValidationLevel.SYNTACTIC;
    let result: ValidationResult = { valid: true, violations: [], level: currentLevel };
    
    // Déterminer le niveau maximal à valider
    const maxLevel = request.maxLevel || ValidationLevel.INTEGRATION;
    
    // Valider niveau par niveau
    while (currentLevel <= maxLevel) {
      this.logger.debug(`Exécution de la validation de niveau ${currentLevel}`);
      
      // Obtenir les validateurs pour ce niveau
      const levelValidators = this.validators.get(currentLevel) || [];
      const applicablePlugins = this.pluginValidators.filter(v => 
        v.levels?.includes(currentLevel)
      );
      
      const allValidators = [...levelValidators, ...applicablePlugins];
      
      // Exécuter tous les validateurs pour ce niveau
      const levelResults = await Promise.all(
        allValidators.map(validator => validator.validate(codeFiles))
      );
      
      // Fusionner les résultats
      const levelViolations = levelResults.flatMap(r => r.violations || []);
      const levelValid = levelResults.every(r => r.valid) && 
                         !levelViolations.some(v => v.severity === 'error');
      
      // Mettre à jour le résultat global
      result = {
        valid: result.valid && levelValid,
        violations: [...result.violations, ...levelViolations],
        level: currentLevel
      };
      
      // Si ce niveau échoue, arrêter la validation en cascade
      if (!levelValid) {
        this.logger.warn(`Validation échouée au niveau ${currentLevel}`);
        break;
      }
      
      // Passer au niveau suivant
      currentLevel++;
    }
    
    // Émettre un événement pour le résultat
    this.eventEmitter.emit('validation.completed', {
      requestId: request.id,
      result,
      timestamp: new Date()
    });
    
    // Journaliser le résultat
    this.logger.log(
      `Validation terminée au niveau ${currentLevel}: ` +
      `${result.valid ? 'Succès' : 'Échec'} avec ${result.violations.length} violations`
    );
    
    return result;
  }
  
  /**
   * Charge les fichiers de code à partir des chemins
   */
  private async loadCodeFiles(filePaths: string[]): Promise<CodeFile[]> {
    return Promise.all(filePaths.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const extension = path.extname(filePath);
        
        return {
          path: filePath,
          content,
          extension,
          language: this.determineLanguage(extension)
        };
      } catch (error) {
        this.logger.error(`Erreur lors du chargement du fichier ${filePath}: ${error.message}`);
        throw error;
      }
    }));
  }
  
  /**
   * Détermine le langage de programmation à partir de l'extension
   */
  private determineLanguage(extension: string): string {
    const extensionMap = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    
    return extensionMap[extension] || 'unknown';
  }
  
  /**
   * Exécute uniquement la validation d'un niveau spécifique
   */
  async validateSingleLevel(request: ValidationRequest, level: ValidationLevel): Promise<ValidationResult> {
    this.logger.log(`Exécution de la validation de niveau ${level} uniquement`);
    
    const codeFiles = await this.loadCodeFiles(request.files);
    const levelValidators = this.validators.get(level) || [];
    
    // Exécuter tous les validateurs pour ce niveau
    const results = await Promise.all(
      levelValidators.map(validator => validator.validate(codeFiles))
    );
    
    // Fusionner les résultats
    const violations = results.flatMap(r => r.violations || []);
    const valid = results.every(r => r.valid) && 
                  !violations.some(v => v.severity === 'error');
    
    return { valid, violations, level };
  }
}
