import { Logger } from @nestjs/commonstructure-agent';
import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import * as semver from semverstructure-agent';

/**
 * Interface pour la définition d'une version de workflow
 */
export interface WorkflowVersion {
  workflowName: string;
  version: string;
  buildId: string;
  taskQueue: string;
  compatible: string[];
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Gestionnaire de versions pour les workflows Temporal
 * 
 * Cette classe permet de gérer les différentes versions des workflows Temporal
 * et assure la compatibilité entre les versions.
 */
export class WorkflowVersioner {
  private readonly logger = new Logger('WorkflowVersioner');
  private readonly versionsFilePath: string;
  private versions: Record<string, WorkflowVersion[]> = {};
  
  constructor(options: {
    versionsFilePath?: string;
  }) {
    this.versionsFilePath = options.versionsFilePath || 
      path.join(process.cwd(), 'workflow-versions.json');
    
    this.loadVersions();
  }
  
  /**
   * Enregistre une nouvelle version d'un workflow
   * @param workflowName Nom du workflow
   * @param version Version sémantique (semver)
   * @param taskQueue File d'attente Temporal à utiliser
   * @param buildId ID de build unique pour cette version
   * @param compatibleWith Versions avec lesquelles cette version est compatible
   * @param metadata Métadonnées additionnelles
   */
  registerVersion(
    workflowName: string, 
    version: string, 
    taskQueue: string, 
    buildId: string,
    compatibleWith: string[] = [],
    metadata: Record<string, any> = {}
  ): WorkflowVersion {
    // Valider la version
    if (!semver.valid(version)) {
      throw new Error(`Version invalide: ${version}. Utilisez un format semver valide (ex: 1.0.0)`);
    }
    
    // Initialiser le tableau des versions pour ce workflow s'il n'existe pas
    if (!this.versions[workflowName]) {
      this.versions[workflowName] = [];
    }
    
    // Vérifier si cette version existe déjà
    const existingVersion = this.versions[workflowName].find(v => v.version === version);
    if (existingVersion) {
      throw new Error(`La version ${version} du workflow ${workflowName} existe déjà`);
    }
    
    // Créer l'entrée de version
    const workflowVersion: WorkflowVersion = {
      workflowName,
      version,
      buildId,
      taskQueue,
      compatible: compatibleWith,
      createdAt: new Date().toISOString(),
      metadata
    };
    
    // Ajouter la version
    this.versions[workflowName].push(workflowVersion);
    
    // Trier les versions par ordre décroissant
    this.versions[workflowName].sort((a, b) => 
      semver.compare(b.version, a.version)
    );
    
    // Sauvegarder les versions
    this.saveVersions();
    
    this.logger.log(`✅ Version ${version} enregistrée pour le workflow ${workflowName}`);
    return workflowVersion;
  }
  
  /**
   * Récupère la dernière version d'un workflow
   * @param workflowName Nom du workflow
   * @returns La dernière version du workflow ou null si aucune version n'existe
   */
  getLatestVersion(workflowName: string): WorkflowVersion | null {
    if (!this.versions[workflowName] || this.versions[workflowName].length === 0) {
      return null;
    }
    
    // Les versions sont triées par ordre décroissant, donc la première est la plus récente
    return this.versions[workflowName][0];
  }
  
  /**
   * Récupère une version spécifique d'un workflow
   * @param workflowName Nom du workflow
   * @param version Version à récupérer
   * @returns La version spécifiée du workflow ou null si elle n'existe pas
   */
  getVersion(workflowName: string, version: string): WorkflowVersion | null {
    if (!this.versions[workflowName]) {
      return null;
    }
    
    return this.versions[workflowName].find(v => v.version === version) || null;
  }
  
  /**
   * Vérifie si deux versions sont compatibles
   * @param workflowName Nom du workflow
   * @param versionA Première version
   * @param versionB Deuxième version
   * @returns true si les versions sont compatibles, false sinon
   */
  areVersionsCompatible(workflowName: string, versionA: string, versionB: string): boolean {
    // Récupérer les objets de version
    const verA = this.getVersion(workflowName, versionA);
    const verB = this.getVersion(workflowName, versionB);
    
    if (!verA || !verB) {
      return false;
    }
    
    // Vérifier si une version déclare explicitement qu'elle est compatible avec l'autre
    if (verA.compatible.includes(versionB) || verB.compatible.includes(versionA)) {
      return true;
    }
    
    // Par défaut, considérer que les versions avec le même majeur sont compatibles
    const majorA = semver.major(versionA);
    const majorB = semver.major(versionB);
    return majorA === majorB;
  }
  
  /**
   * Récupère toutes les versions d'un workflow
   * @param workflowName Nom du workflow
   * @returns Tableau de toutes les versions du workflow
   */
  getAllVersions(workflowName: string): WorkflowVersion[] {
    return this.versions[workflowName] || [];
  }
  
  /**
   * Récupère la file d'attente à utiliser pour une version spécifique
   * @param workflowName Nom du workflow
   * @param version Version (ou 'latest')
   * @returns File d'attente à utiliser
   */
  getTaskQueueForVersion(workflowName: string, version: string = 'latest'): string | null {
    // Si 'latest', utiliser la dernière version
    if (version === 'latest') {
      const latestVersion = this.getLatestVersion(workflowName);
      return latestVersion ? latestVersion.taskQueue : null;
    }
    
    // Sinon, récupérer la version spécifiée
    const workflowVersion = this.getVersion(workflowName, version);
    return workflowVersion ? workflowVersion.taskQueue : null;
  }
  
  /**
   * Supprime une version spécifique d'un workflow
   * @param workflowName Nom du workflow
   * @param version Version à supprimer
   * @returns true si la version a été supprimée, false sinon
   */
  removeVersion(workflowName: string, version: string): boolean {
    if (!this.versions[workflowName]) {
      return false;
    }
    
    const initialLength = this.versions[workflowName].length;
    this.versions[workflowName] = this.versions[workflowName].filter(v => v.version !== version);
    
    const removed = this.versions[workflowName].length < initialLength;
    if (removed) {
      this.saveVersions();
      this.logger.log(`✅ Version ${version} supprimée du workflow ${workflowName}`);
    }
    
    return removed;
  }
  
  /**
   * Charge les versions depuis le fichier de versions
   */
  private loadVersions(): void {
    try {
      if (fs.existsSync(this.versionsFilePath)) {
        const fileContent = fs.readFileSync(this.versionsFilePath, 'utf8');
        this.versions = JSON.parse(fileContent);
        this.logger.log(`✅ Versions chargées depuis ${this.versionsFilePath}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors du chargement des versions: ${error.message}`);
    }
  }
  
  /**
   * Sauvegarde les versions dans le fichier de versions
   */
  private saveVersions(): void {
    try {
      fs.writeFileSync(this.versionsFilePath, JSON.stringify(this.versions, null, 2));
      this.logger.log(`✅ Versions sauvegardées dans ${this.versionsFilePath}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde des versions: ${error.message}`);
    }
  }
}