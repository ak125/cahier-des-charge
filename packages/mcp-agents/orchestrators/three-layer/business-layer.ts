/**
 * Interface de la couche métier
 * 
 * Cette couche est responsable de l'implémentation des logiques métier spécifiques,
 * indépendamment des mécanismes de coordination et d'orchestration.
 */

import { ValidationResult } from './coordination-layer';

/**
 * Interface générique pour un service métier
 */
export interface IBusinessService<T = any, R = any> {
  /**
   * Exécute la logique métier spécifique
   * @param input Données d'entrée pour le service
   * @param options Options spécifiques à ce service
   */
  execute(input: T, options?: BusinessServiceOptions): Promise<BusinessResult<R>>;

  /**
   * Vérifie si le service est applicable au contexte donné
   * @param context Contexte d'application
   */
  isApplicable(context: any): Promise<boolean>;

  /**
   * Valide les données d'entrée
   * @param input Données à valider
   */
  validateInput(input: T): Promise<ValidationResult>;

  /**
   * Obtient des informations sur le service
   */
  getServiceInfo(): BusinessServiceInfo;
}

/**
 * Options pour l'exécution d'un service métier
 */
export interface BusinessServiceOptions {
  /**
   * Contexte d'exécution du service
   */
  context?: BusinessContext;

  /**
   * Si true, le service effectuera uniquement une analyse sans appliquer de modifications
   */
  dryRun?: boolean;

  /**
   * Niveau de détail des logs
   */
  verbosity?: 'minimal' | 'normal' | 'detailed' | 'diagnostic';

  /**
   * Options spécifiques au service
   */
  [key: string]: any;
}

/**
 * Contexte fourni aux services métier
 */
export interface BusinessContext {
  /**
   * Identifiant de l'exécution
   */
  executionId: string;

  /**
   * Données partagées entre services
   */
  sharedData?: Record<string, any>;

  /**
   * Fonctions utilitaires
   */
  utils?: {
    /**
     * Journalise un message
     */
    log(level: 'debug' | 'info' | 'warning' | 'error', message: string): void;
    
    /**
     * Récupère des données d'une source externe
     */
    fetchData<T>(source: string, params?: any): Promise<T>;
    
    /**
     * Rapporte l'avancement
     */
    reportProgress(progress: number, message?: string): void;
  };

  /**
   * Répertoire de travail pour ce service
   */
  workDir?: string;

  /**
   * Configuration spécifique à l'environnement
   */
  environment?: {
    /**
     * Environnement d'exécution (dev, test, prod)
     */
    env: string;
    
    /**
     * Délimiteurs de chemins de fichiers
     */
    pathSeparator: string;
    
    /**
     * Options spécifiques à l'environnement
     */
    [key: string]: any;
  };

  /**
   * Métadonnées diverses
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de l'exécution d'un service métier
 */
export interface BusinessResult<T = any> {
  /**
   * Statut de l'exécution
   */
  status: 'success' | 'warning' | 'error';

  /**
   * Données produites par le service
   */
  data?: T;

  /**
   * Logs générés pendant l'exécution
   */
  logs: string[];

  /**
   * Résumé des opérations effectuées
   */
  summary?: {
    /**
     * Nombre d'éléments traités
     */
    processedItems?: number;
    
    /**
     * Nombre d'éléments modifiés
     */
    modifiedItems?: number;
    
    /**
     * Nombre d'erreurs rencontrées
     */
    errorCount?: number;
    
    /**
     * Nombre d'avertissements générés
     */
    warningCount?: number;
    
    /**
     * Informations supplémentaires spécifiques au service
     */
    [key: string]: any;
  };

  /**
   * Détails de l'exécution
   */
  details?: any;

  /**
   * Erreur survenue (si status = 'error')
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
    context?: any;
  };

  /**
   * Métadonnées sur l'exécution
   */
  metadata?: {
    /**
     * Horodatage du début d'exécution
     */
    startTime: string;
    
    /**
     * Horodatage de fin d'exécution
     */
    endTime: string;
    
    /**
     * Durée d'exécution en millisecondes
     */
    duration: number;
    
    /**
     * Version du service utilisé
     */
    serviceVersion?: string;
    
    /**
     * Autres métadonnées
     */
    [key: string]: any;
  };

  /**
   * Activités à réaliser après ce service
   */
  nextActions?: Array<{
    /**
     * Type d'action
     */
    type: 'service' | 'notification' | 'checkpoint' | 'validation';
    
    /**
     * Identifiant de l'action
     */
    id: string;
    
    /**
     * Données pour l'action
     */
    data?: any;
    
    /**
     * Priorité de l'action
     */
    priority?: 'low' | 'normal' | 'high' | 'critical';
    
    /**
     * Condition d'exécution
     */
    condition?: string | ((result: BusinessResult<T>, context: BusinessContext) => boolean);
  }>;
}

/**
 * Informations sur un service métier
 */
export interface BusinessServiceInfo {
  /**
   * Identifiant unique du service
   */
  id: string;

  /**
   * Nom du service
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Version du service
   */
  version?: string;

  /**
   * Types de données en entrée supportés
   */
  inputTypes?: string[];

  /**
   * Types de données en sortie
   */
  outputTypes?: string[];

  /**
   * Services dont dépend ce service
   */
  dependencies?: string[];

  /**
   * Auteur du service
   */
  author?: string;

  /**
   * Lien vers la documentation
   */
  documentationUrl?: string;

  /**
   * Indique si le service effectue des opérations de lecture seule
   */
  readOnly?: boolean;

  /**
   * Indique si le service est déprécié
   */
  deprecated?: boolean;

  /**
   * Métriques de performance
   */
  metrics?: {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecuted?: string;
  };

  /**
   * Exemples d'utilisation
   */
  examples?: Array<{
    name: string;
    input: any;
    output: any;
    description?: string;
  }>;
}

/**
 * Interface pour une fabrique de services métier
 */
export interface BusinessServiceFactory {
  /**
   * Crée une instance d'un service métier
   * @param serviceId Identifiant du service à créer
   * @param config Configuration du service
   */
  createService<T = any, R = any>(serviceId: string, config?: any): Promise<IBusinessService<T, R>>;

  /**
   * Vérifie si un service est disponible
   * @param serviceId Identifiant du service à vérifier
   */
  hasService(serviceId: string): boolean;

  /**
   * Récupère les informations de tous les services disponibles
   */
  getAllServicesInfo(): BusinessServiceInfo[];
}

/**
 * Interface pour un registre de services métier
 */
export interface BusinessServiceRegistry {
  /**
   * Enregistre un service métier
   * @param serviceInfo Informations sur le service
   * @param factory Fonction de création d'une instance du service
   */
  registerService<T = any, R = any>(
    serviceInfo: BusinessServiceInfo, 
    factory: (config?: any) => Promise<IBusinessService<T, R>>
  ): void;

  /**
   * Récupère une instance d'un service métier
   * @param serviceId Identifiant du service
   * @param config Configuration du service
   */
  getService<T = any, R = any>(serviceId: string, config?: any): Promise<IBusinessService<T, R>>;

  /**
   * Récupère les informations d'un service
   * @param serviceId Identifiant du service
   */
  getServiceInfo(serviceId: string): BusinessServiceInfo | null;

  /**
   * Récupère les informations de tous les services enregistrés
   */
  getAllServices(): BusinessServiceInfo[];

  /**
   * Trouve des services en fonction de critères
   * @param criteria Critères de recherche
   */
  findServices(criteria: ServiceSearchCriteria): BusinessServiceInfo[];
}

/**
 * Critères de recherche pour les services métier
 */
export interface ServiceSearchCriteria {
  /**
   * Recherche dans l'ID
   */
  id?: string | RegExp;

  /**
   * Recherche dans le nom
   */
  name?: string | RegExp;

  /**
   * Recherche dans la description
   */
  description?: string | RegExp;

  /**
   * Filtre par auteur
   */
  author?: string;

  /**
   * Filtre par version
   */
  version?: string;

  /**
   * Filtre par type d'entrée supporté
   */
  inputType?: string;

  /**
   * Filtre par type de sortie
   */
  outputType?: string;

  /**
   * Filtre par dépendance
   */
  dependency?: string;

  /**
   * Inclure les services dépréciés
   */
  includeDeprecated?: boolean;

  /**
   * Filtre par mode lecture seule
   */
  readOnly?: boolean;
}

/**
 * Types de données métier standardisés
 */
export enum BusinessDataType {
  // Types génériques
  ANY = 'any',
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  
  // Types de fichiers
  FILE_PATH = 'file:path',
  FILE_CONTENT = 'file:content',
  DIRECTORY_PATH = 'directory:path',
  
  // Types de données structurées
  JSON = 'json',
  XML = 'xml',
  CSV = 'csv',
  YAML = 'yaml',
  
  // Types de code source
  CODE_PHP = 'code:php',
  CODE_JAVASCRIPT = 'code:javascript',
  CODE_TYPESCRIPT = 'code:typescript',
  CODE_HTML = 'code:html',
  CODE_CSS = 'code:css',
  
  // Types relatifs à la migration
  MIGRATION_CONFIG = 'migration:config',
  MIGRATION_RESULT = 'migration:result',
  MIGRATION_STATUS = 'migration:status',
  
  // Types d'analyse
  ANALYSIS_RESULT = 'analysis:result',
  ANALYSIS_DIFF = 'analysis:diff',
  ANALYSIS_ISSUE = 'analysis:issue',
  
  // Types de rapport
  REPORT_HTML = 'report:html',
  REPORT_JSON = 'report:json',
  REPORT_METRICS = 'report:metrics',
  
  // Types spécifiques à votre domaine métier
  SEO_DATA = 'seo:data',
  SEO_ISSUE = 'seo:issue',
  SEO_RECOMMENDATION = 'seo:recommendation',
  SEO_STRATEGY = 'seo:strategy',
  
  // Types de workflow
  WORKFLOW_DEFINITION = 'workflow:definition',
  WORKFLOW_STATUS = 'workflow:status',
  WORKFLOW_RESULT = 'workflow:result'
}