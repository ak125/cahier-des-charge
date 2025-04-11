import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export interface AuditSection {
  id: string;
  title: string;
  content: string;
  type: string;
  severity?: 'info' | 'warning' | 'critical';
  source?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  sections: AuditSection[];
  errors?: Error[];
  warnings?: string[];
  metrics?: {
    executionTimeMs: number;
    resourcesUsed?: Record<string, number>;
    itemsProcessed?: number;
  };
  artifacts?: string[]; // Chemins vers les fichiers générés
}

export interface IAgent {
  getName(): string;
  getVersion(): string;
  process(): Promise<AgentResult>;
  loadFile(): Promise<void>;
  analyze(): Promise<void>;
  saveSections(): Promise<void>;
  getDependencies(): string[]; // Renvoie les noms des agents dont celui-ci dépend
}

export abstract class BaseAgent implements IAgent {
  protected filePath: string;
  protected fileContent: string = '';
  protected sections: AuditSection[] = [];
  protected startTime: number = 0;
  protected errors: Error[] = [];
  protected warnings: string[] = [];
  protected artifacts: string[] = [];
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Renvoie le nom de l'agent
   */
  public getName(): string {
    return this.constructor.name;
  }
  
  /**
   * Renvoie la version de l'agent
   */
  public getVersion(): string {
    return '1.0.0'; // À surcharger par les implémentations concrètes
  }
  
  /**
   * Renvoie les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return []; // À surcharger par les implémentations concrètes
  }

  /**
   * Charge le contenu du fichier PHP
   */
  public async loadFile(): Promise<void> {
    try {
      this.fileContent = await fsPromises.readFile(this.filePath, 'utf8');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const newError = new Error(`Erreur lors du chargement du fichier: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }

  /**
   * Sauvegarde les sections d'audit générées
   */
  public async saveSections(): Promise<void> {
    const baseFilename = path.basename(this.filePath);
    const dirPath = path.dirname(this.filePath);
    const outputPath = path.join(dirPath, `${baseFilename}.audit.sections.json`);
    
    try {
      // Vérifier si le fichier existe déjà
      let existingSections: AuditSection[] = [];
      try {
        const existingData = await fsPromises.readFile(outputPath, 'utf8');
        existingSections = JSON.parse(existingData);
      } catch (error) {
        // Le fichier n'existe pas encore, on continue
      }
      
      // Ajouter un timestamp aux sections
      const timestamp = Date.now();
      this.sections.forEach(section => {
        section.timestamp = timestamp;
      });
      
      // Fusionner ou ajouter les nouvelles sections
      const updatedSections = [...existingSections];
      
      for (const newSection of this.sections) {
        const existingIndex = updatedSections.findIndex(s => s.id === newSection.id);
        if (existingIndex !== -1) {
          updatedSections[existingIndex] = newSection;
        } else {
          updatedSections.push(newSection);
        }
      }
      
      // Écrire le fichier mis à jour
      await fsPromises.writeFile(outputPath, JSON.stringify(updatedSections, null, 2), 'utf8');
      console.log(`✅ Sections d'audit enregistrées dans ${outputPath}`);
      
      // Ajouter le chemin aux artefacts
      this.artifacts.push(outputPath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const newError = new Error(`Erreur lors de la sauvegarde des sections: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }

  /**
   * Ajoute une section au rapport d'audit
   */
  protected addSection(
    id: string, 
    title: string, 
    content: string, 
    type: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    metadata?: Record<string, any>
  ): void {
    this.sections.push({
      id,
      title,
      content,
      type,
      severity,
      source: this.constructor.name,
      metadata
    });
  }
  
  /**
   * Ajoute un avertissement
   */
  protected addWarning(message: string): void {
    this.warnings.push(message);
    console.warn(`⚠️ [${this.getName()}] ${message}`);
  }

  /**
   * Méthode principale d'analyse à implémenter par chaque agent
   */
  public abstract analyze(): Promise<void>;

  /**
   * Exécute l'agent complet
   */
  public async process(): Promise<AgentResult> {
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
    this.artifacts = [];
    
    try {
      await this.loadFile();
      await this.analyze();
      await this.saveSections();
      
      const executionTime = Date.now() - this.startTime;
      return {
        success: this.errors.length === 0,
        sections: this.sections,
        errors: this.errors.length > 0 ? this.errors : undefined,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        metrics: {
          executionTimeMs: executionTime,
          itemsProcessed: this.sections.length
        },
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined
      };
    } catch (error: unknown) {
      const executionTime = Date.now() - this.startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (!this.errors.includes(errorObj)) {
        this.errors.push(errorObj);
      }
      
      return {
        success: false,
        sections: this.sections,
        errors: this.errors,
        warnings: this.warnings,
        metrics: {
          executionTimeMs: executionTime
        },
        artifacts: this.artifacts.length > 0 ? this.artifacts : undefined
      };
    }
  }
}
