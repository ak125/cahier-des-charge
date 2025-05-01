/**
 * Type pour les options de configuration de l'agent CI-Tester
 */
export interface CITesterOptions {
  /** Chemin vers le fichier de configuration */
  configPath?: string;

  /** Générer le fichier workflow GitHub Actions */
  generateWorkflow?: boolean;

  /** Valider la configuration actuelle */
  validateCurrentSetup?: boolean;

  /** Suggérer l'installation d'applications GitHub */
  installGitHubApps?: boolean;

  /** Effectuer un test local de la CI */
  localTest?: boolean;

  /** Répertoire de sortie pour les fichiers générés */
  outputPath?: string;

  /** Répertoire contenant des templates personnalisés */
  templatesPath?: string;

  /** Afficher plus d'informations */
  verbose?: boolean;

  /** Afficher les actions sans les exécuter */
  dryRun?: boolean;
}

/**
 * Type pour une commande de test CI
 */
export interface CITest {
  /** Nom du test */
  name: string;

  /** Commande à exécuter */
  command: string;

  /** Description du test */
  description: string;

  /** Si le test est requis ou optionnel */
  required: boolean;

  /** Catégorie du test (build, test, lint, etc.) */
  category?: string;

  /** Options spécifiques au test */
  options?: Record<string, any>;
}

/**
 * Type pour les scripts des packages
 */
export interface PackageScripts {
  [packageName: string]: {
    [scriptName: string]: string;
  };
}

/**
 * Type pour le rapport CI généré
 */
export interface CIReport {
  /** Statut global du rapport (success, warning, error) */
  status: 'success' | 'warning' | 'error';

  /** Liste des fichiers générés */
  generatedFiles: string[];

  /** Scripts détectés dans les packages */
  packageScripts: PackageScripts;

  /** Tests CI détectés */
  detectedTests: CITest[];

  /** Tests personnalisés ajoutés via la configuration */
  customTests: CITest[];

  /** Horodatage de l'exécution */
  timestamp: string;

  /** Logs d'exécution */
  logs: string[];

  /** Résultats des tests locaux (si exécutés) */
  localTestResults?: Array<{
    test: CITest;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Type pour la configuration CI
 */
export interface CITesterConfig {
  /** Répertoire racine du projet */
  rootDir?: string;

  /** Chemin vers le fichier workflow à générer */
  outputWorkflowPath?: string;

  /** Chemin vers le fichier de rapport à générer */
  outputReportPath?: string;

  /** Chemin vers le fichier d'informations de dernière exécution */
  outputLastRunPath?: string;

  /** Chemin vers le package.json principal */
  packageJsonPath?: string;

  /** Liste des chemins relatifs vers les package.json des workspaces */
  workspacePackages?: string[];

  /** Répertoire contenant les templates */
  templatesDir?: string;

  /** Tests personnalisés à ajouter */
  customTests?: CITest[];

  /** Configuration des services pour le workflow GitHub Actions */
  services?: {
    /** Configuration de la base de données PostgreSQL */
    postgres?: {
      enabled: boolean;
      version?: string;
      user?: string;
      password?: string;
      database?: string;
    };

    /** Configuration de la base de données MySQL */
    mysql?: {
      enabled: boolean;
      version?: string;
      user?: string;
      password?: string;
      database?: string;
    };

    /** Configuration de Redis */
    redis?: {
      enabled: boolean;
      version?: string;
    };

    /** Configuration d'autres services */
    [serviceName: string]: any;
  };

  /** Branches sur lesquelles exécuter le workflow */
  branches?: {
    push?: string[];
    pullRequest?: string[];
  };

  /** Configuration des notifications */
  notifications?: {
    /** Notifications sur les pull requests */
    pullRequest?: {
      enabled: boolean;
      successMessage?: string;
      failureMessage?: string;
      labels?: {
        success?: string[];
        failure?: string[];
      };
    };

    /** Notifications Slack */
    slack?: {
      enabled: boolean;
      webhook?: string;
      channel?: string;
    };
  };
}
