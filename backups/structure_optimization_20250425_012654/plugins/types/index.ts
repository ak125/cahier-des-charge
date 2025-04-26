/**
 * Système de plugins pour le pipeline MCP
 * Cette interface définit la structure de base que tous les plugins doivent implémenter
 */
export interface McpPlugin {
    /** Identifiant unique du plugin */
    id: string;

    /** Nom lisible du plugin */
    name: string;

    /** Version du plugin */
    version: string;

    /** Description du plugin */
    description: string;

    /** Auteur(s) du plugin */
    author: string;

    /** 
     * Type de plugin définissant son comportement principal
     * - 'analyzer': Analyse du code source ou des données
     * - 'generator': Génération de code ou de fichiers
     * - 'transformer': Transformation de données
     * - 'validator': Validation de code ou de données
     * - 'reporter': Génération de rapports
     * - 'integration': Intégration avec des systèmes externes
     * - 'utility': Utilitaires divers
     */
    type: 'analyzer' | 'generator' | 'transformer' | 'validator' | 'reporter' | 'integration' | 'utility';

    /**
     * Point d'entrée du plugin appelé lors de son initialisation
     * @param context Contexte d'exécution du plugin
     * @returns Promise résolue lorsque l'initialisation est terminée
     */
    initialize: (context: PluginContext) => Promise<void>;

    /**
     * Méthode principale exécutant la logique du plugin
     * @param input Données d'entrée du plugin
     * @param context Contexte d'exécution
     * @returns Résultat de l'exécution du plugin
     */
    execute: <T, R>(input: T, context: PluginContext) => Promise<R>;

    /**
     * Point de sortie appelé lors de l'arrêt du plugin
     * @param context Contexte d'exécution du plugin
     */
    cleanup?: (context: PluginContext) => Promise<void>;

    /**
     * Hooks permettant au plugin d'être notifié des événements du pipeline
     */
    hooks?: {
        onMigrationStart?: (migration: MigrationContext) => Promise<void>;
        onMigrationComplete?: (migration: MigrationContext, result: any) => Promise<void>;
        onAgentStart?: (agentId: string, input: any) => Promise<void>;
        onAgentComplete?: (agentId: string, result: any) => Promise<void>;
        onAgentError?: (agentId: string, error: Error) => Promise<void>;
        onPipelineStart?: () => Promise<void>;
        onPipelineComplete?: () => Promise<void>;
    };

    /**
     * Configuration du plugin
     */
    config?: Record<string, any>;

    /**
     * Liste des dépendances du plugin (ids d'autres plugins)
     */
    dependencies?: string[];
}

/**
 * Contexte fourni au plugin pendant son exécution
 */
export interface PluginContext {
    /** API pour accéder aux services du pipeline MCP */
    api: McpPluginApi;

    /** Configuration spécifique au plugin */
    config: Record<string, any>;

    /** Logger pour le plugin */
    logger: PluginLogger;

    /** État de la migration en cours */
    migration?: MigrationContext;

    /** Chemin vers le répertoire temporaire du plugin */
    tempDir: string;
}

/**
 * API exposée aux plugins pour interagir avec le pipeline MCP
 */
export interface McpPluginApi {
    /** Accès aux agents du pipeline */
    agents: {
        /** Liste tous les agents disponibles */
        list: () => Promise<string[]>;

        /** Exécute un agent spécifique avec des données d'entrée */
        execute: <T, R>(agentId: string, input: T) => Promise<R>;

        /** Obtient les métadonnées d'un agent */
        getMetadata: (agentId: string) => Promise<any>;
    };

    /** Accès aux migrations */
    migrations: {
        /** Liste toutes les migrations */
        list: () => Promise<string[]>;

        /** Obtient les détails d'une migration */
        get: (id: string) => Promise<MigrationContext>;

        /** Met à jour l'état d'une migration */
        updateStatus: (id: string, status: MigrationStatus) => Promise<void>;
    };

    /** Accès au système de fichiers */
    fs: {
        /** Lit un fichier */
        readFile: (path: string) => Promise<Buffer>;

        /** Écrit un fichier */
        writeFile: (path: string, content: Buffer | string) => Promise<void>;

        /** Vérifie si un fichier existe */
        exists: (path: string) => Promise<boolean>;

        /** Liste les fichiers d'un répertoire */
        readdir: (path: string) => Promise<string[]>;
    };

    /** Accès aux services externes intégrés */
    services: {
        /** Service de base de données */
        db?: any;

        /** Service de cache */
        cache?: any;

        /** Service de file d'attente */
        queue?: any;
    };

    /** Accès aux autres plugins */
    plugins: {
        /** Liste tous les plugins chargés */
        list: () => Promise<string[]>;

        /** Exécute un plugin spécifique */
        execute: <T, R>(pluginId: string, input: T) => Promise<R>;

        /** Vérifie si un plugin est disponible */
        isAvailable: (pluginId: string) => Promise<boolean>;
    };
}

/**
 * Interface pour le logger d'un plugin
 */
export interface PluginLogger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
}

/**
 * Contexte d'une migration MCP
 */
export interface MigrationContext {
    id: string;
    name: string;
    status: MigrationStatus;
    sourcePath: string;
    targetPath: string;
    startTime?: Date;
    endTime?: Date;
    metadata: Record<string, any>;
}

/**
 * Statut possible d'une migration
 */
export type MigrationStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Manifeste d'un plugin
 */
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    type: McpPlugin['type'];
    main: string;
    dependencies?: string[];
    config?: Record<string, any>;
}