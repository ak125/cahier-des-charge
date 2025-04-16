/**
 * Classe abstraite de base pour tous les agents
 * Implemente l'interface Agent et fournit des fonctionnalités communes
 */

import { Agent, AgentConfig, AgentResult, AuditSection } from './interfaces/base-agent';
import { Logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs-extra';
import { agentCommunication, AgentEventType } from '../utils/agent-communication';

/**
 * Classe abstraite de base dont héritent tous les types d'agents
 */
export abstract class AbstractAgent<TConfig extends AgentConfig = AgentConfig> implements Agent<TConfig> {
  // Propriétés de l'interface Agent
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract description: string;
  
  // Configuration de l'agent
  public config: TConfig;
  
  // Logger pour l'agent
  protected logger: Logger;
  
  // Stockage des erreurs, avertissements et artefacts
  protected errors: Error[] = [];
  protected warnings: string[] = [];
  protected artifacts: string[] = [];
  protected sections: AuditSection[] = [];

  // Contenu du fichier sur lequel l'agent travaille (si applicable)
  protected filePath?: string;
  protected fileContent?: string;
  
  /**
   * Constructeur de l'agent abstrait
   * @param filePath Chemin du fichier sur lequel travailler (optionnel)
   * @param config Configuration de l'agent
   */
  constructor(filePath?: string, config?: Partial<TConfig>) {
    this.filePath = filePath;
    
    // Initialiser la configuration avec les valeurs par défaut et celles fournies
    this.config = {
      outputDir: './output',
      verbose: false,
      ...config
    } as TConfig;
    
    // Créer un logger pour cet agent
    this.logger = new Logger(this.constructor.name, {
      outputToFile: true,
      logFilePath: path.join(this.config.outputDir || './logs', `${this.constructor.name}.log`),
    });
    
    // Enregistrer l'agent dans le système de communication
    agentCommunication.registerAgent(this);
    
    // Écouter les demandes pour cet agent
    this.setupCommunication();
  }
  
  /**
   * Configure la communication inter-agents
   */
  private setupCommunication(): void {
    // Écouter les demandes adressées à cet agent
    agentCommunication.on(AgentEventType.REQUEST, this.id, async (message) => {
      try {
        // Traiter la demande si elle est adressée à cet agent
        if (message.targetId === this.id) {
          this.logger.debug(`Requête reçue: ${JSON.stringify(message.payload)}`);
          
          // Exécuter l'agent avec les paramètres de la requête
          const result = await this.processWithParams(message.payload);
          
          // Envoyer la réponse
          agentCommunication.sendMessage({
            type: AgentEventType.RESPONSE,
            senderId: this.id,
            targetId: message.senderId,
            correlationId: message.correlationId,
            payload: result
          });
        }
      } catch (error: any) {
        // En cas d'erreur, envoyer une réponse d'erreur
        agentCommunication.sendMessage({
          type: AgentEventType.RESPONSE,
          senderId: this.id,
          targetId: message.senderId,
          correlationId: message.correlationId,
          payload: {
            success: false,
            errors: [error]
          }
        });
      }
    });
  }
  
  /**
   * Charge le contenu du fichier spécifié
   */
  public async loadFile(): Promise<void> {
    try {
      if (!this.filePath) {
        throw new Error("Aucun fichier spécifié");
      }
      
      // Vérifier que le fichier existe
      if (!await fs.pathExists(this.filePath)) {
        throw new Error(`Le fichier n'existe pas: ${this.filePath}`);
      }
      
      // Lire le contenu du fichier
      this.fileContent = await fs.readFile(this.filePath, 'utf-8');
      this.logger.debug(`Fichier chargé: ${this.filePath}`);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const newError = new Error(`Erreur lors du chargement du fichier: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }
  
  /**
   * Méthode principale d'exécution de l'agent
   * Gère les étapes communes et délègue le travail spécifique aux sous-classes
   */
  public async process(): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Notification de début
      this.logger.info(`Démarrage de l'agent ${this.name} v${this.version}`);
      
      // Validation de l'agent si la méthode existe
      if (this.validate && !(await this.validate())) {
        throw new Error("La validation de l'agent a échoué");
      }
      
      // Initialisation si nécessaire
      if (this.init) {
        await this.init();
      }
      
      // Charger le fichier si un chemin est spécifié
      if (this.filePath && !this.fileContent) {
        await this.loadFile();
      }
      
      // Exécuter l'analyse spécifique à l'agent
      if (this.analyze) {
        await this.analyze();
      }
      
      // Exécuter l'action spécifique à l'agent
      if (this.execute) {
        await this.execute();
      }
      
      // Générer le rapport si applicable
      if (this.generateReport) {
        const reportPath = await this.generateReport();
        if (reportPath) {
          this.artifacts.push(reportPath);
        }
      }
      
      // Nettoyage des ressources si nécessaire
      if (this.cleanup) {
        await this.cleanup();
      }
      
      // Construire et retourner le résultat
      const endTime = Date.now();
      const result: AgentResult = {
        success: this.errors.length === 0,
        errors: this.errors.length > 0 ? this.errors : undefined,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined,
        sections: this.sections.length > 0 ? this.sections : undefined,
        executionTimeMs: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      // Log le résultat
      if (result.success) {
        this.logger.info(`Exécution de l'agent ${this.name} terminée avec succès en ${result.executionTimeMs}ms`);
      } else {
        this.logger.error(`Exécution de l'agent ${this.name} terminée avec des erreurs en ${result.executionTimeMs}ms`);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Erreur lors de l'exécution: ${errorMessage}`);
      
      // Ajouter l'erreur à la liste si ce n'est pas déjà fait
      if (!this.errors.some(e => e.message === errorMessage)) {
        this.errors.push(error);
      }
      
      // Construire et retourner le résultat d'erreur
      const endTime = Date.now();
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTimeMs: endTime - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Exécute l'agent avec des paramètres spécifiques
   * @param params Paramètres d'exécution
   * @returns Résultat de l'exécution
   */
  protected async processWithParams(params?: any): Promise<AgentResult> {
    // Par défaut, utiliser la méthode process standard
    // Les sous-classes peuvent surcharger cette méthode pour traiter les paramètres
    return this.process();
  }
  
  /**
   * Ajoute une erreur
   * @param error Erreur à ajouter
   */
  protected addError(error: Error | string): void {
    const err = typeof error === 'string' ? new Error(error) : error;
    this.errors.push(err);
    this.logger.error(err.message);
  }
  
  /**
   * Ajoute un avertissement
   * @param warning Message d'avertissement
   */
  protected addWarning(warning: string): void {
    this.warnings.push(warning);
    this.logger.warn(warning);
  }
  
  /**
   * Ajoute une section d'audit
   * @param id Identifiant de la section
   * @param title Titre de la section
   * @param description Description de la section
   * @param type Type de la section
   * @param data Données associées à la section
   */
  protected addSection(
    id: string,
    title: string,
    description: string,
    type: string,
    data: Record<string, any> | { severity: 'info' | 'warning' | 'critical' } = {}
  ): void {
    // Extraire la sévérité des données si elle existe
    let severity: 'info' | 'warning' | 'critical' | undefined = undefined;
    let sectionData: Record<string, any> = { ...data };
    
    if ('severity' in data) {
      severity = data.severity as 'info' | 'warning' | 'critical';
      delete sectionData.severity;
    }
    
    const section: AuditSection = {
      id,
      title,
      description,
      type,
      data: sectionData,
      severity
    };
    
    this.sections.push(section);
    
    // Log la section créée
    const severityIcon = 
      severity === 'critical' ? '🔴' : 
      severity === 'warning' ? '🟡' : 
      '🔵';
    
    this.logger.info(`${severityIcon} Section ajoutée: ${title}`);
  }
  
  /**
   * Méthodes abstraites que les sous-classes doivent implémenter
   */
  
  /**
   * Analyse le contenu
   * À implémenter dans les sous-classes d'analyseurs
   */
  protected analyze?(): Promise<void>;
  
  /**
   * Exécute des actions
   * À implémenter dans les sous-classes d'actionneurs
   */
  protected execute?(): Promise<void>;
  
  /**
   * Génère un rapport
   * À implémenter dans les sous-classes qui produisent des rapports
   */
  protected generateReport?(): Promise<string | undefined>;
  
  /**
   * Renvoie les agents dont celui-ci dépend
   * Par défaut, aucune dépendance
   */
  public getDependencies(): string[] {
    return [];
  }
  
  /**
   * Validation de l'agent avant exécution
   * Par défaut, toujours valide
   */
  public async validate(): Promise<boolean> {
    return true;
  }
  
  /**
   * Nettoie les ressources utilisées par l'agent
   */
  public async cleanup(): Promise<void> {
    // Désenregistrer l'agent du système de communication
    agentCommunication.unregisterAgent(this.id);
    agentCommunication.removeAllHandlers(this.id);
  }
}