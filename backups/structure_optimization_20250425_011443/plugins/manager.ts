import * as fs from 'fs/promises';
import * as path from 'path';
import { McpPlugin, PluginContext, PluginManifest, PluginLogger } from './types';

/**
 * Gestionnaire de plugins pour le pipeline MCP
 * Responsable du chargement, de l'initialisation et de l'exécution des plugins
 */
export class PluginManager {
    private plugins: Map<string, McpPlugin> = new Map();
    private pluginContexts: Map<string, PluginContext> = new Map();
    private pluginPaths: string[] = [];
    private api: any;
    private logger: any;

    constructor(options: {
        pluginPaths?: string[];
        api?: any;
        logger?: any;
    } = {}) {
        this.pluginPaths = options.pluginPaths || [
            path.resolve(__dirname, 'core'),
            path.resolve(__dirname, 'community')
        ];
        this.api = options.api || {};
        this.logger = options.logger || console;
    }

    /**
     * Découvre et charge tous les plugins disponibles dans les répertoires configurés
     */
    async discoverPlugins(): Promise<string[]> {
        const discoveredPlugins: string[] = [];

        for (const pluginPath of this.pluginPaths) {
            try {
                const entries = await fs.readdir(pluginPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const pluginDir = path.join(pluginPath, entry.name);
                        const manifestPath = path.join(pluginDir, 'manifest.json');

                        try {
                            // Vérifier si le manifest existe
                            await fs.access(manifestPath);

                            // Lire et parser le manifest
                            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                            const manifest: PluginManifest = JSON.parse(manifestContent);

                            // Charger le plugin
                            await this.loadPlugin(manifest, pluginDir);
                            discoveredPlugins.push(manifest.id);

                        } catch (err) {
                            this.logger.warn(`Échec de chargement du plugin ${entry.name}: ${err.message}`);
                        }
                    }
                }
            } catch (err) {
                this.logger.warn(`Échec d'accès au répertoire de plugins ${pluginPath}: ${err.message}`);
            }
        }

        return discoveredPlugins;
    }

    /**
     * Charge un plugin spécifique à partir de son manifeste
     */
    private async loadPlugin(manifest: PluginManifest, pluginDir: string): Promise<void> {
        if (this.plugins.has(manifest.id)) {
            this.logger.warn(`Plugin ${manifest.id} est déjà chargé`);
            return;
        }

        try {
            const mainPath = path.join(pluginDir, manifest.main);
            const pluginModule = await import(mainPath);
            const pluginInstance = pluginModule.default as McpPlugin;

            if (!this.validatePlugin(pluginInstance, manifest)) {
                throw new Error(`Le plugin ${manifest.id} n'est pas conforme à l'interface McpPlugin`);
            }

            // Créer le contexte du plugin
            const pluginContext = this.createPluginContext(manifest, pluginDir);

            // Stocker le plugin et son contexte
            this.plugins.set(manifest.id, pluginInstance);
            this.pluginContexts.set(manifest.id, pluginContext);

            this.logger.info(`Plugin chargé: ${manifest.name} (${manifest.id}) v${manifest.version}`);

        } catch (err) {
            this.logger.error(`Échec de chargement du plugin ${manifest.id}: ${err.message}`);
            throw err;
        }
    }

    /**
     * Initialise tous les plugins chargés
     */
    async initializePlugins(): Promise<void> {
        // Construire le graphe de dépendances pour l'initialisation dans le bon ordre
        const initOrder = this.buildDependencyGraph();

        for (const pluginId of initOrder) {
            const plugin = this.plugins.get(pluginId);
            const context = this.pluginContexts.get(pluginId);

            if (plugin && context) {
                try {
                    this.logger.info(`Initialisation du plugin: ${pluginId}`);
                    await plugin.initialize(context);
                } catch (err) {
                    this.logger.error(`Échec d'initialisation du plugin ${pluginId}: ${err.message}`);
                    // On continue avec les autres plugins même si un échoue
                }
            }
        }
    }

    /**
     * Exécute un plugin spécifique
     */
    async executePlugin<T, R>(pluginId: string, input: T): Promise<R> {
        const plugin = this.plugins.get(pluginId);
        const context = this.pluginContexts.get(pluginId);

        if (!plugin || !context) {
            throw new Error(`Plugin ${pluginId} non trouvé`);
        }

        try {
            this.logger.debug(`Exécution du plugin: ${pluginId}`);
            return await plugin.execute(input, context) as R;
        } catch (err) {
            this.logger.error(`Erreur lors de l'exécution du plugin ${pluginId}: ${err.message}`);
            throw err;
        }
    }

    /**
     * Nettoie et arrête tous les plugins
     */
    async shutdownPlugins(): Promise<void> {
        // Fermer les plugins dans l'ordre inverse des dépendances
        const shutdownOrder = this.buildDependencyGraph().reverse();

        for (const pluginId of shutdownOrder) {
            const plugin = this.plugins.get(pluginId);
            const context = this.pluginContexts.get(pluginId);

            if (plugin && context && plugin.cleanup) {
                try {
                    this.logger.info(`Arrêt du plugin: ${pluginId}`);
                    await plugin.cleanup(context);
                } catch (err) {
                    this.logger.error(`Erreur lors de l'arrêt du plugin ${pluginId}: ${err.message}`);
                    // On continue avec les autres plugins
                }
            }
        }

        this.plugins.clear();
        this.pluginContexts.clear();
    }

    /**
     * Obtient la liste de tous les plugins chargés
     */
    getLoadedPlugins(): string[] {
        return Array.from(this.plugins.keys());
    }

    /**
     * Vérifie si un plugin est disponible
     */
    hasPlugin(pluginId: string): boolean {
        return this.plugins.has(pluginId);
    }

    /**
     * Déclenche un hook d'événement sur tous les plugins qui l'implémentent
     */
    async triggerHook(hookName: string, ...args: any[]): Promise<void> {
        for (const [pluginId, plugin] of this.plugins.entries()) {
            if (plugin.hooks && hookName in plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
                try {
                    this.logger.debug(`Déclenchement du hook ${hookName} pour le plugin ${pluginId}`);
                    await plugin.hooks[hookName](...args);
                } catch (err) {
                    this.logger.error(`Erreur dans le hook ${hookName} du plugin ${pluginId}: ${err.message}`);
                    // On continue avec les autres plugins
                }
            }
        }
    }

    /**
     * Valide qu'un plugin implémente correctement l'interface McpPlugin
     */
    private validatePlugin(plugin: McpPlugin, manifest: PluginManifest): boolean {
        const requiredProperties = ['id', 'name', 'version', 'description', 'author', 'type', 'initialize', 'execute'];

        for (const prop of requiredProperties) {
            if (!(prop in plugin)) {
                this.logger.error(`Plugin ${manifest.id} n'implémente pas la propriété ${prop}`);
                return false;
            }
        }

        // Vérifier que l'id du plugin correspond à celui du manifest
        if (plugin.id !== manifest.id) {
            this.logger.error(`L'ID du plugin ${plugin.id} ne correspond pas à l'ID du manifest ${manifest.id}`);
            return false;
        }

        return true;
    }

    /**
     * Crée le contexte d'exécution pour un plugin
     */
    private createPluginContext(manifest: PluginManifest, pluginDir: string): PluginContext {
        // Créer un logger spécifique au plugin
        const pluginLogger: PluginLogger = {
            debug: (message, ...args) => this.logger.debug(`[Plugin:${manifest.id}] ${message}`, ...args),
            info: (message, ...args) => this.logger.info(`[Plugin:${manifest.id}] ${message}`, ...args),
            warn: (message, ...args) => this.logger.warn(`[Plugin:${manifest.id}] ${message}`, ...args),
            error: (message, ...args) => this.logger.error(`[Plugin:${manifest.id}] ${message}`, ...args)
        };

        // Créer le contexte avec l'API et les configurations spécifiques au plugin
        return {
            api: this.createPluginApi(manifest.id),
            config: manifest.config || {},
            logger: pluginLogger,
            tempDir: path.join(pluginDir, 'temp'),
        };
    }

    /**
     * Crée l'API exposée au plugin
     */
    private createPluginApi(pluginId: string): any {
        // Implémenter une version de l'API qui trace les appels et applique les restrictions
        // basées sur les autorisations du plugin
        return {
            ...this.api,

            // Surcharger l'API des plugins pour éviter les références circulaires
            plugins: {
                list: async () => this.getLoadedPlugins(),
                execute: async <T, R>(targetPluginId: string, input: T) => {
                    // Vérifier si le plugin cible existe
                    if (!this.hasPlugin(targetPluginId)) {
                        throw new Error(`Plugin ${targetPluginId} non trouvé`);
                    }

                    // Vérifier si le plugin a accès au plugin cible
                    // (peut être implémenté plus tard avec un système de permissions)

                    return this.executePlugin<T, R>(targetPluginId, input);
                },
                isAvailable: async (targetPluginId: string) => this.hasPlugin(targetPluginId)
            }
        };
    }

    /**
     * Construit un graphe de dépendances pour l'initialisation correcte des plugins
     */
    private buildDependencyGraph(): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        // Fonction pour le parcours en profondeur du graphe
        const visit = (pluginId: string, path: string[] = []): void => {
            // Détecter les cycles de dépendances
            if (path.includes(pluginId)) {
                this.logger.error(`Cycle de dépendances détecté: ${path.join(' -> ')} -> ${pluginId}`);
                return;
            }

            // Éviter de visiter deux fois le même nœud
            if (visited.has(pluginId)) {
                return;
            }

            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                this.logger.warn(`Plugin ${pluginId} référencé comme dépendance mais non chargé`);
                return;
            }

            visited.add(pluginId);

            // Visiter d'abord toutes les dépendances
            const dependencies = plugin.dependencies || [];
            for (const depId of dependencies) {
                visit(depId, [...path, pluginId]);
            }

            // Puis ajouter ce plugin à la liste de résultats
            result.push(pluginId);
        };

        // Visiter tous les plugins
        for (const pluginId of this.plugins.keys()) {
            visit(pluginId);
        }

        return result;
    }
}

export default new PluginManager();