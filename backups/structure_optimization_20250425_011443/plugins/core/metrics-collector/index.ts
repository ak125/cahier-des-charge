import * as fs from 'fs/promises';
import * as path from 'path';
import { McpPlugin, PluginContext } from '../../types';

/**
 * MetricsCollector - Plugin pour collecter et stocker des métriques de performance
 * des agents et migrations du pipeline MCP
 */
export class MetricsCollector implements McpPlugin {
    id: string = 'metrics-collector';
    name: string = 'Collecteur de Métriques MCP';
    version: string = '1.0.0';
    description: string = 'Plugin qui collecte des métriques de performance pour tous les agents et les migrations MCP';
    author: string = 'Équipe MCP';
    type: 'utility' = 'utility';

    private context: PluginContext;
    private metricsData: {
        agents: Record<string, AgentMetrics[]>;
        migrations: Record<string, MigrationMetrics[]>;
        system: SystemMetrics[];
    } = { agents: {}, migrations: {}, system: [] };

    private collectionInterval: NodeJS.Timeout;
    private outputPath: string;
    private startTime: number = Date.now();

    /**
     * Initialise le collecteur de métriques
     */
    async initialize(context: PluginContext): Promise<void> {
        this.context = context;
        this.outputPath = path.resolve(__dirname, context.config.outputPath || '../../audit/metrics');

        // Créer le répertoire de sortie s'il n'existe pas
        await fs.mkdir(this.outputPath, { recursive: true });

        // Charger les métriques existantes si elles existent
        await this.loadExistingMetrics();

        // Configurer les hooks pour collecter automatiquement les métriques
        this.setupHooks();

        // Démarrer la collecte périodique des métriques système
        const interval = context.config.collectionInterval || 60000; // Par défaut: une minute
        this.collectionInterval = setInterval(() => this.collectSystemMetrics(), interval);

        context.logger.info('Collecteur de métriques initialisé');

        // Collecter les métriques système initiales
        this.collectSystemMetrics();
    }

    /**
     * Exécute une action spécifique du collecteur de métriques
     */
    async execute<T, R>(input: T, context: PluginContext): Promise<R> {
        const command = input as { action: string;[key: string]: any };

        switch (command.action) {
            case 'getAgentMetrics':
                return this.getAgentMetrics(command.agentId, command.timeRange) as unknown as R;

            case 'getMigrationMetrics':
                return this.getMigrationMetrics(command.migrationId, command.timeRange) as unknown as R;

            case 'getSystemMetrics':
                return this.getSystemMetrics(command.timeRange) as unknown as R;

            case 'exportMetrics':
                return this.exportMetricsToFile(command.format || 'json') as unknown as R;

            case 'generateReport':
                return this.generateReport() as unknown as R;

            default:
                context.logger.error(`Action non reconnue: ${command.action}`);
                throw new Error(`Action non reconnue: ${command.action}`);
        }
    }

    /**
     * Nettoyage lors de l'arrêt du plugin
     */
    async cleanup(context: PluginContext): Promise<void> {
        clearInterval(this.collectionInterval);

        // Sauvegarder les métriques avant de s'arrêter
        await this.saveMetrics();

        context.logger.info('Collecteur de métriques arrêté, métriques sauvegardées');
    }

    /**
     * Hooks pour capturer les événements du pipeline
     */
    hooks = {
        onAgentStart: async (agentId: string, input: any): Promise<void> => {
            const startTime = Date.now();

            // Stocker le temps de démarrage pour calculer la durée plus tard
            if (!this.metricsData.agents[agentId]) {
                this.metricsData.agents[agentId] = [];
            }

            this.metricsData.agents[agentId].push({
                agentId,
                startTime,
                endTime: null,
                duration: null,
                inputSize: this.calculateSize(input),
                outputSize: null,
                success: null,
                memoryUsage: process.memoryUsage().heapUsed,
                timestamp: new Date().toISOString()
            });

            this.context.logger.debug(`Début d'exécution de l'agent ${agentId}`);
        },

        onAgentComplete: async (agentId: string, result: any): Promise<void> => {
            const endTime = Date.now();

            // Rechercher la dernière métrique pour cet agent qui n'a pas encore de endTime
            const agentMetrics = this.metricsData.agents[agentId] || [];
            const lastMetric = agentMetrics[agentMetrics.length - 1];

            if (lastMetric && lastMetric.endTime === null) {
                lastMetric.endTime = endTime;
                lastMetric.duration = endTime - lastMetric.startTime;
                lastMetric.outputSize = this.calculateSize(result);
                lastMetric.success = true;
                lastMetric.memoryUsage = process.memoryUsage().heapUsed;

                this.context.logger.debug(`Fin d'exécution de l'agent ${agentId}: ${lastMetric.duration}ms`);

                // Sauvegarder périodiquement
                this.saveMetricsDebounced();
            }
        },

        onAgentError: async (agentId: string, error: Error): Promise<void> => {
            const endTime = Date.now();

            // Rechercher la dernière métrique pour cet agent qui n'a pas encore de endTime
            const agentMetrics = this.metricsData.agents[agentId] || [];
            const lastMetric = agentMetrics[agentMetrics.length - 1];

            if (lastMetric && lastMetric.endTime === null) {
                lastMetric.endTime = endTime;
                lastMetric.duration = endTime - lastMetric.startTime;
                lastMetric.success = false;
                lastMetric.error = error.message;
                lastMetric.memoryUsage = process.memoryUsage().heapUsed;

                this.context.logger.debug(`Erreur d'exécution de l'agent ${agentId}: ${error.message}`);

                // Sauvegarder immédiatement en cas d'erreur
                this.saveMetrics();
            }
        },

        onMigrationStart: async (migration: any): Promise<void> => {
            const startTime = Date.now();
            const migrationId = migration.id;

            if (!this.metricsData.migrations[migrationId]) {
                this.metricsData.migrations[migrationId] = [];
            }

            this.metricsData.migrations[migrationId].push({
                migrationId,
                name: migration.name,
                startTime,
                endTime: null,
                duration: null,
                agents: [],
                success: null,
                timestamp: new Date().toISOString()
            });

            this.context.logger.debug(`Début de la migration ${migrationId}: ${migration.name}`);
        },

        onMigrationComplete: async (migration: any, result: any): Promise<void> => {
            const endTime = Date.now();
            const migrationId = migration.id;

            // Rechercher la dernière métrique pour cette migration
            const migrationMetrics = this.metricsData.migrations[migrationId] || [];
            const lastMetric = migrationMetrics[migrationMetrics.length - 1];

            if (lastMetric && lastMetric.endTime === null) {
                lastMetric.endTime = endTime;
                lastMetric.duration = endTime - lastMetric.startTime;
                lastMetric.success = true;
                lastMetric.result = result;

                // Collecter les agents utilisés si disponibles
                if (result && result.agents) {
                    lastMetric.agents = result.agents;
                }

                this.context.logger.debug(`Fin de la migration ${migrationId}: ${lastMetric.duration}ms`);

                // Sauvegarder après chaque migration
                this.saveMetrics();
            }
        },

        onPipelineStart: async () => {
            this.startTime = Date.now();
            this.context.logger.info('Démarrage du pipeline, début de la collecte de métriques');
        },

        onPipelineComplete: async () => {
            const totalTime = Date.now() - this.startTime;
            this.context.logger.info(`Pipeline terminé, temps total: ${totalTime}ms`);

            // Générer un rapport à la fin du pipeline
            await this.generateReport();

            // Sauvegarder toutes les métriques
            await this.saveMetrics();
        }
    };

    /**
     * Collecte les métriques système (CPU, mémoire, etc.)
     */
    private async collectSystemMetrics(): Promise<void> {
        const memoryUsage = process.memoryUsage();

        const metrics: SystemMetrics = {
            timestamp: new Date().toISOString(),
            memoryUsage: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
            },
            uptime: process.uptime(),
            loadAverage: process.loadavg(),
        };

        this.metricsData.system.push(metrics);

        // Limiter la taille des métriques système (garder les 1000 derniers points)
        if (this.metricsData.system.length > 1000) {
            this.metricsData.system = this.metricsData.system.slice(-1000);
        }
    }

    /**
     * Calcule approximativement la taille d'un objet JavaScript
     */
    private calculateSize(obj: any): number {
        if (obj === null || obj === undefined) return 0;

        try {
            const json = JSON.stringify(obj);
            return json.length;
        } catch (e) {
            return -1; // Impossible de calculer
        }
    }

    /**
     * Charge les métriques précédemment sauvegardées
     */
    private async loadExistingMetrics(): Promise<void> {
        try {
            const metricsPath = path.join(this.outputPath, 'metrics.json');

            const exists = await fs.access(metricsPath).then(() => true).catch(() => false);

            if (exists) {
                const data = await fs.readFile(metricsPath, 'utf-8');
                this.metricsData = JSON.parse(data);

                this.context.logger.info('Métriques existantes chargées');

                // Nettoyage des métriques trop anciennes
                await this.cleanupOldMetrics();
            }
        } catch (err) {
            this.context.logger.warn(`Impossible de charger les métriques existantes: ${err.message}`);
            // Continuer avec un objet vide
        }
    }

    /**
     * Nettoie les métriques plus anciennes que la période de rétention configurée
     */
    private async cleanupOldMetrics(): Promise<void> {
        const retentionDays = this.context.config.metricsRetentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffTime = cutoffDate.getTime();

        // Nettoyer les métriques des agents
        for (const agentId in this.metricsData.agents) {
            this.metricsData.agents[agentId] = this.metricsData.agents[agentId].filter(
                metric => new Date(metric.timestamp).getTime() > cutoffTime
            );
        }

        // Nettoyer les métriques des migrations
        for (const migrationId in this.metricsData.migrations) {
            this.metricsData.migrations[migrationId] = this.metricsData.migrations[migrationId].filter(
                metric => new Date(metric.timestamp).getTime() > cutoffTime
            );
        }

        // Nettoyer les métriques système
        this.metricsData.system = this.metricsData.system.filter(
            metric => new Date(metric.timestamp).getTime() > cutoffTime
        );

        this.context.logger.info(`Métriques plus anciennes que ${retentionDays} jours supprimées`);
    }

    /**
     * Sauvegarde les métriques dans un fichier
     */
    private async saveMetrics(): Promise<void> {
        try {
            const metricsPath = path.join(this.outputPath, 'metrics.json');

            await fs.writeFile(
                metricsPath,
                JSON.stringify(this.metricsData, null, 2),
                'utf-8'
            );

            this.context.logger.debug('Métriques sauvegardées');
        } catch (err) {
            this.context.logger.error(`Erreur lors de la sauvegarde des métriques: ${err.message}`);
        }
    }

    /**
     * Version débounced de saveMetrics pour éviter trop d'écritures
     */
    private saveMetricsDebounced = (() => {
        let timeout: NodeJS.Timeout | null = null;

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(() => {
                this.saveMetrics();
                timeout = null;
            }, 5000); // Attendre 5 secondes d'inactivité avant de sauvegarder
        };
    })();

    /**
     * Récupère les métriques pour un agent spécifique
     */
    private getAgentMetrics(agentId: string, timeRange?: { start: string; end: string }): AgentMetrics[] {
        let metrics = this.metricsData.agents[agentId] || [];

        if (timeRange) {
            const start = new Date(timeRange.start).getTime();
            const end = new Date(timeRange.end).getTime();

            metrics = metrics.filter(metric => {
                const time = new Date(metric.timestamp).getTime();
                return time >= start && time <= end;
            });
        }

        return metrics;
    }

    /**
     * Récupère les métriques pour une migration spécifique
     */
    private getMigrationMetrics(migrationId: string, timeRange?: { start: string; end: string }): MigrationMetrics[] {
        let metrics = this.metricsData.migrations[migrationId] || [];

        if (timeRange) {
            const start = new Date(timeRange.start).getTime();
            const end = new Date(timeRange.end).getTime();

            metrics = metrics.filter(metric => {
                const time = new Date(metric.timestamp).getTime();
                return time >= start && time <= end;
            });
        }

        return metrics;
    }

    /**
     * Récupère les métriques système
     */
    private getSystemMetrics(timeRange?: { start: string; end: string }): SystemMetrics[] {
        let metrics = [...this.metricsData.system];

        if (timeRange) {
            const start = new Date(timeRange.start).getTime();
            const end = new Date(timeRange.end).getTime();

            metrics = metrics.filter(metric => {
                const time = new Date(metric.timestamp).getTime();
                return time >= start && time <= end;
            });
        }

        return metrics;
    }

    /**
     * Exporte les métriques dans un fichier au format spécifié
     */
    private async exportMetricsToFile(format: 'json' | 'csv' = 'json'): Promise<{ path: string }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let outputPath: string;

        if (format === 'json') {
            outputPath = path.join(this.outputPath, `metrics-export-${timestamp}.json`);
            await fs.writeFile(outputPath, JSON.stringify(this.metricsData, null, 2), 'utf-8');
        } else if (format === 'csv') {
            // Export des métriques d'agents
            outputPath = path.join(this.outputPath, `agent-metrics-${timestamp}.csv`);
            let csvContent = 'agentId,timestamp,startTime,endTime,duration,inputSize,outputSize,success,memoryUsage\n';

            for (const agentId in this.metricsData.agents) {
                for (const metric of this.metricsData.agents[agentId]) {
                    csvContent += `${metric.agentId},${metric.timestamp},${metric.startTime},${metric.endTime},${metric.duration},${metric.inputSize},${metric.outputSize},${metric.success},${metric.memoryUsage}\n`;
                }
            }

            await fs.writeFile(outputPath, csvContent, 'utf-8');

            // Export des métriques de migrations
            const migrationOutputPath = path.join(this.outputPath, `migration-metrics-${timestamp}.csv`);
            let migrationCsvContent = 'migrationId,name,timestamp,startTime,endTime,duration,success\n';

            for (const migrationId in this.metricsData.migrations) {
                for (const metric of this.metricsData.migrations[migrationId]) {
                    migrationCsvContent += `${metric.migrationId},${metric.name},${metric.timestamp},${metric.startTime},${metric.endTime},${metric.duration},${metric.success}\n`;
                }
            }

            await fs.writeFile(migrationOutputPath, migrationCsvContent, 'utf-8');
        }

        this.context.logger.info(`Métriques exportées au format ${format}: ${outputPath}`);

        return { path: outputPath };
    }

    /**
     * Génère un rapport de performance basé sur les métriques collectées
     */
    private async generateReport(): Promise<{ path: string }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputPath, `performance-report-${timestamp}.md`);

        let report = `# Rapport de Performance MCP\n\n`;
        report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`;

        // Résumé global
        report += `## Résumé Global\n\n`;

        // Statistiques sur les agents
        const allAgentMetrics = Object.values(this.metricsData.agents).flat();
        const totalAgentExecutions = allAgentMetrics.length;
        const successfulAgentExecutions = allAgentMetrics.filter(m => m.success === true).length;
        const failedAgentExecutions = allAgentMetrics.filter(m => m.success === false).length;

        const avgAgentDuration = allAgentMetrics
            .filter(m => m.duration !== null)
            .reduce((acc, m) => acc + (m.duration || 0), 0) / totalAgentExecutions || 0;

        report += `- **Nombre total d'exécutions d'agents**: ${totalAgentExecutions}\n`;
        report += `- **Exécutions réussies**: ${successfulAgentExecutions} (${Math.round(successfulAgentExecutions / totalAgentExecutions * 100 || 0)}%)\n`;
        report += `- **Exécutions échouées**: ${failedAgentExecutions} (${Math.round(failedAgentExecutions / totalAgentExecutions * 100 || 0)}%)\n`;
        report += `- **Durée moyenne d'exécution**: ${Math.round(avgAgentDuration)}ms\n\n`;

        // Statistiques sur les migrations
        const allMigrationMetrics = Object.values(this.metricsData.migrations).flat();
        const totalMigrations = allMigrationMetrics.length;
        const successfulMigrations = allMigrationMetrics.filter(m => m.success === true).length;
        const failedMigrations = allMigrationMetrics.filter(m => m.success === false).length;

        const avgMigrationDuration = allMigrationMetrics
            .filter(m => m.duration !== null)
            .reduce((acc, m) => acc + (m.duration || 0), 0) / totalMigrations || 0;

        report += `- **Nombre total de migrations**: ${totalMigrations}\n`;
        report += `- **Migrations réussies**: ${successfulMigrations} (${Math.round(successfulMigrations / totalMigrations * 100 || 0)}%)\n`;
        report += `- **Migrations échouées**: ${failedMigrations} (${Math.round(failedMigrations / totalMigrations * 100 || 0)}%)\n`;
        report += `- **Durée moyenne des migrations**: ${Math.round(avgMigrationDuration / 1000)}s\n\n`;

        // Top 5 des agents les plus lents
        report += `## Agents les Plus Lents (Top 5)\n\n`;

        const agentAvgDurations: { agentId: string; avgDuration: number; executions: number }[] = [];

        for (const agentId in this.metricsData.agents) {
            const metrics = this.metricsData.agents[agentId];
            const validMetrics = metrics.filter(m => m.duration !== null);
            const totalDuration = validMetrics.reduce((acc, m) => acc + (m.duration || 0), 0);
            const avgDuration = validMetrics.length > 0 ? totalDuration / validMetrics.length : 0;

            agentAvgDurations.push({
                agentId,
                avgDuration,
                executions: metrics.length
            });
        }

        // Trier par durée moyenne (décroissante)
        agentAvgDurations.sort((a, b) => b.avgDuration - a.avgDuration);

        report += `| Agent | Durée Moyenne | Exécutions | Taux de Succès |\n`;
        report += `|-------|---------------|------------|---------------|\n`;

        for (const agent of agentAvgDurations.slice(0, 5)) {
            const metrics = this.metricsData.agents[agent.agentId];
            const successRate = metrics.filter(m => m.success === true).length / metrics.length * 100 || 0;

            report += `| ${agent.agentId} | ${Math.round(agent.avgDuration)}ms | ${agent.executions} | ${Math.round(successRate)}% |\n`;
        }

        report += '\n';

        // Top 5 des migrations les plus lentes
        report += `## Migrations les Plus Lentes (Top 5)\n\n`;

        const migrationDurations: { migrationId: string; name: string; duration: number }[] = [];

        for (const migrationId in this.metricsData.migrations) {
            const metrics = this.metricsData.migrations[migrationId];

            for (const metric of metrics) {
                if (metric.duration !== null) {
                    migrationDurations.push({
                        migrationId,
                        name: metric.name,
                        duration: metric.duration
                    });
                }
            }
        }

        // Trier par durée (décroissante)
        migrationDurations.sort((a, b) => b.duration - a.duration);

        report += `| Migration | Nom | Durée |\n`;
        report += `|-----------|-----|-------|\n`;

        for (const migration of migrationDurations.slice(0, 5)) {
            report += `| ${migration.migrationId} | ${migration.name} | ${Math.round(migration.duration / 1000)}s |\n`;
        }

        report += '\n';

        // Utilisation de la mémoire
        report += `## Utilisation des Ressources\n\n`;

        if (this.metricsData.system.length > 0) {
            const lastMetric = this.metricsData.system[this.metricsData.system.length - 1];
            const maxMemory = Math.max(...this.metricsData.system.map(m => m.memoryUsage.heapUsed));
            const avgMemory = this.metricsData.system.reduce((acc, m) => acc + m.memoryUsage.heapUsed, 0) / this.metricsData.system.length;

            report += `- **Utilisation mémoire actuelle**: ${Math.round(lastMetric.memoryUsage.heapUsed / 1024 / 1024)}MB\n`;
            report += `- **Utilisation mémoire maximum**: ${Math.round(maxMemory / 1024 / 1024)}MB\n`;
            report += `- **Utilisation mémoire moyenne**: ${Math.round(avgMemory / 1024 / 1024)}MB\n`;
            report += `- **Charge système moyenne**: ${lastMetric.loadAverage[0].toFixed(2)}\n\n`;
        } else {
            report += `*Aucune métrique système disponible*\n\n`;
        }

        // Écrire le rapport
        await fs.writeFile(reportPath, report, 'utf-8');

        this.context.logger.info(`Rapport de performance généré: ${reportPath}`);

        return { path: reportPath };
    }
}

// Types pour les métriques
interface AgentMetrics {
    agentId: string;
    startTime: number;
    endTime: number | null;
    duration: number | null;
    inputSize: number;
    outputSize: number | null;
    success: boolean | null;
    memoryUsage: number;
    error?: string;
    timestamp: string;
}

interface MigrationMetrics {
    migrationId: string;
    name: string;
    startTime: number;
    endTime: number | null;
    duration: number | null;
    agents: string[];
    success: boolean | null;
    result?: any;
    timestamp: string;
}

interface SystemMetrics {
    timestamp: string;
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    uptime: number;
    loadAverage: number[];
}

export default new MetricsCollector();