/**
 * Tableau de bord de suivi de la migration des workflows n8n
 * 
 * Ce module fournit des fonctionnalités pour suivre la progression de la migration
 * des workflows n8n vers les orchestrateurs standardisés Temporal et BullMQ.
 */

import fs from 'fs/promises';
import path from 'path';
import { orchestratorMonitoring } from './monitoring-service';

/**
 * État d'un workflow dans le processus de migration
 */
export enum MigrationStatus {
    PENDING = 'pending',         // En attente de migration
    IN_PROGRESS = 'in_progress', // Migration en cours
    MIGRATED = 'migrated',       // Migré avec succès
    VALIDATED = 'validated',     // Testé et validé
    FAILED = 'failed',           // Échec de la migration
    DISCARDED = 'discarded'      // Workflow obsolète, ne sera pas migré
}

/**
 * Type de workflow dans la cible
 */
export enum TargetType {
    BULLMQ = 'bullmq',
    TEMPORAL = 'temporal',
    REST_API = 'rest_api',
    MIXED = 'mixed',
    OTHER = 'other'
}

/**
 * Information sur un workflow à migrer
 */
export interface WorkflowMigrationInfo {
    id: string;                           // Identifiant unique du workflow
    name: string;                         // Nom du workflow
    sourcePath: string;                   // Chemin vers le fichier source n8n
    targetPath?: string;                  // Chemin vers le fichier cible (après migration)
    priority: number;                     // Priorité de migration (1-5, 1 étant le plus prioritaire)
    complexity: 'simple' | 'medium' | 'complex'; // Complexité estimée
    status: MigrationStatus;              // État actuel de la migration
    targetType: TargetType;               // Type d'orchestrateur cible
    assignedTo?: string;                  // Personne assignée à la migration
    startDate?: string;                   // Date de début de la migration
    completionDate?: string;              // Date de fin de la migration
    notes?: string;                       // Notes supplémentaires sur la migration
    dependencies?: string[];              // Autres workflows dont celui-ci dépend
    validationResults?: {                 // Résultats de validation après migration
        status: 'success' | 'partial' | 'failed';
        message?: string;
        tests?: Array<{
            name: string;
            status: 'passed' | 'failed';
            message?: string;
        }>;
    };
}

/**
 * Résumé de l'état de la migration
 */
export interface MigrationSummary {
    total: number;                  // Nombre total de workflows à migrer
    status: {                       // Répartition par statut
        [key in MigrationStatus]: number;
    };
    targetType: {                   // Répartition par type d'orchestrateur cible
        [key in TargetType]: number;
    };
    byPriority: {                   // Répartition par priorité
        [key: number]: number;
    };
    completionPercentage: number;   // Pourcentage global de complétion
    lastUpdated: string;            // Dernière mise à jour du résumé
}

/**
 * Classe pour gérer le suivi de la migration des workflows
 */
export class WorkflowMigrationTracker {
    private workflowsInfo: WorkflowMigrationInfo[] = [];
    private dbPath: string;

    /**
     * Initialise le tracker de migration
     * @param dbPath Chemin vers le fichier JSON de stockage des informations
     */
    constructor(dbPath: string = '/workspaces/cahier-des-charge/migrations/n8n-migration-status.json') {
        this.dbPath = dbPath;
    }

    /**
     * Charge les données de migration depuis le fichier
     */
    public async load(): Promise<void> {
        try {
            // S'assurer que le répertoire existe
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

            try {
                const data = await fs.readFile(this.dbPath, 'utf-8');
                this.workflowsInfo = JSON.parse(data);
            } catch (error: any) {
                // Si le fichier n'existe pas ou n'est pas valide, on commence avec un tableau vide
                if (error.code === 'ENOENT' || error instanceof SyntaxError) {
                    this.workflowsInfo = [];
                    await this.save(); // Créer le fichier
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error(`Erreur lors du chargement des données de migration: ${error}`);
            throw error;
        }
    }

    /**
     * Sauvegarde les données de migration dans le fichier
     */
    public async save(): Promise<void> {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(this.workflowsInfo, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde des données de migration: ${error}`);
            throw error;
        }
    }

    /**
     * Ajoute un nouveau workflow à suivre
     */
    public async addWorkflow(info: Omit<WorkflowMigrationInfo, 'id'>): Promise<WorkflowMigrationInfo> {
        // Générer un ID unique
        const id = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Vérifier que tous les champs obligatoires sont présents
        if (!info.name || !info.sourcePath || info.priority === undefined ||
            !info.complexity || info.status === undefined || info.targetType === undefined) {
            throw new Error('Tous les champs obligatoires doivent être fournis (name, sourcePath, priority, complexity, status, targetType)');
        }

        // Créer le nouvel objet workflow avec l'ID
        const newWorkflow: WorkflowMigrationInfo = {
            ...info,
            id
        };

        // Ajouter à la liste et sauvegarder
        this.workflowsInfo.push(newWorkflow);
        await this.save();
        return newWorkflow;
    }

    /**
     * Met à jour les informations d'un workflow
     */
    public async updateWorkflow(id: string, updates: Partial<WorkflowMigrationInfo>): Promise<WorkflowMigrationInfo | null> {
        const index = this.workflowsInfo.findIndex(wf => wf.id === id);
        if (index === -1) {
            return null;
        }

        // Récupérer le workflow complet existant
        const currentWorkflow = this.workflowsInfo[index];

        // Vérifier que currentWorkflow existe bien (pour TypeScript)
        if (!currentWorkflow) {
            return null;
        }

        // Créer un nouvel objet de type WorkflowMigrationInfo garantissant tous les champs obligatoires
        const updatedWorkflow: WorkflowMigrationInfo = {
            id: currentWorkflow.id,
            name: updates.name || currentWorkflow.name,
            sourcePath: updates.sourcePath || currentWorkflow.sourcePath,
            priority: updates.priority !== undefined ? updates.priority : currentWorkflow.priority,
            complexity: updates.complexity || currentWorkflow.complexity,
            status: updates.status !== undefined ? updates.status : currentWorkflow.status,
            targetType: updates.targetType || currentWorkflow.targetType,
            targetPath: updates.targetPath || currentWorkflow.targetPath,
            assignedTo: updates.assignedTo || currentWorkflow.assignedTo,
            startDate: updates.startDate || currentWorkflow.startDate,
            completionDate: updates.completionDate || currentWorkflow.completionDate,
            notes: updates.notes || currentWorkflow.notes,
            dependencies: updates.dependencies || currentWorkflow.dependencies,
            validationResults: updates.validationResults || currentWorkflow.validationResults,
        };

        // Si le statut passe à migré, définir la date de complétion
        if (updates.status === MigrationStatus.MIGRATED && !updatedWorkflow.completionDate) {
            updatedWorkflow.completionDate = new Date().toISOString();
        }

        // Mettre à jour le tableau
        this.workflowsInfo[index] = updatedWorkflow;

        await this.save();
        return updatedWorkflow;
    }

    /**
     * Obtient les informations d'un workflow par son ID
     */
    public getWorkflow(id: string): WorkflowMigrationInfo | null {
        return this.workflowsInfo.find(wf => wf.id === id) || null;
    }

    /**
     * Liste tous les workflows avec filtrage optionnel
     */
    public listWorkflows(filters?: Partial<{
        status: MigrationStatus | MigrationStatus[];
        targetType: TargetType | TargetType[];
        priority: number | number[];
        assignedTo: string;
    }>): WorkflowMigrationInfo[] {
        let result = [...this.workflowsInfo];

        if (filters) {
            if (filters.status) {
                const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
                result = result.filter(wf => statuses.includes(wf.status));
            }

            if (filters.targetType) {
                const types = Array.isArray(filters.targetType) ? filters.targetType : [filters.targetType];
                result = result.filter(wf => types.includes(wf.targetType));
            }

            if (filters.priority) {
                const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
                result = result.filter(wf => priorities.includes(wf.priority));
            }

            if (filters.assignedTo) {
                result = result.filter(wf => wf.assignedTo === filters.assignedTo);
            }
        }

        return result;
    }

    /**
     * Calcule un résumé de l'état actuel de la migration
     */
    public async generateSummary(): Promise<MigrationSummary> {
        // Initialiser le résumé
        const summary: MigrationSummary = {
            total: this.workflowsInfo.length,
            status: {
                [MigrationStatus.PENDING]: 0,
                [MigrationStatus.IN_PROGRESS]: 0,
                [MigrationStatus.MIGRATED]: 0,
                [MigrationStatus.VALIDATED]: 0,
                [MigrationStatus.FAILED]: 0,
                [MigrationStatus.DISCARDED]: 0
            },
            targetType: {
                [TargetType.BULLMQ]: 0,
                [TargetType.TEMPORAL]: 0,
                [TargetType.REST_API]: 0,
                [TargetType.MIXED]: 0,
                [TargetType.OTHER]: 0
            },
            byPriority: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            },
            completionPercentage: 0,
            lastUpdated: new Date().toISOString()
        };

        // Compter par statut
        for (const workflow of this.workflowsInfo) {
            summary.status[workflow.status]++;
            summary.targetType[workflow.targetType]++;

            // Compter par priorité
            if (workflow.priority >= 1 && workflow.priority <= 5) {
                summary.byPriority[workflow.priority] = (summary.byPriority[workflow.priority] || 0) + 1;
            }
        }

        // Calculer le pourcentage de complétion
        const completed = summary.status[MigrationStatus.MIGRATED] +
            summary.status[MigrationStatus.VALIDATED] +
            summary.status[MigrationStatus.DISCARDED];

        summary.completionPercentage = summary.total > 0
            ? Math.round((completed / summary.total) * 100)
            : 0;

        // Obtenir des données de monitoring complémentaires si disponibles
        try {
            const monitoringReport = await orchestratorMonitoring.generateMigrationReport();

            // Ajouter au résumé des informations du monitoring
            const enrichedSummary = {
                ...summary,
                monitoring: {
                    temporal: monitoringReport.temporal,
                    bullmq: monitoringReport.bullmq
                }
            };

            return enrichedSummary;
        } catch (error) {
            console.warn('Impossible d\'enrichir le résumé avec les données de monitoring:', error);
            return summary;
        }
    }

    /**
     * Effectue une analyse automatique des dépendances entre workflows
     */
    public async analyzeDependencies(): Promise<void> {
        // Pour chaque workflow, analyser son contenu pour trouver des références à d'autres workflows
        for (const workflow of this.workflowsInfo) {
            try {
                // Cette fonction serait implémentée pour analyser le contenu du fichier
                // et identifier les références à d'autres workflows
                const dependencies = await this.extractDependenciesFromWorkflow(workflow.sourcePath);

                // Mettre à jour les dépendances
                await this.updateWorkflow(workflow.id, { dependencies });
            } catch (error) {
                console.error(`Erreur lors de l'analyse des dépendances pour ${workflow.name}:`, error);
            }
        }
    }

    /**
     * Crée un plan de migration optimisé basé sur les priorités et les dépendances
     */
    public async generateMigrationPlan(): Promise<WorkflowMigrationInfo[]> {
        // S'assurer que les dépendances sont à jour
        await this.analyzeDependencies();

        // Copier la liste des workflows
        const workflows = [...this.workflowsInfo];

        // Trier les workflows par priorité (croissante) et nombre de dépendances (décroissant)
        workflows.sort((a, b) => {
            // D'abord par priorité
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            // Ensuite par nombre de dépendances (les workflows avec moins de dépendances d'abord)
            const aDeps = a.dependencies?.length || 0;
            const bDeps = b.dependencies?.length || 0;
            return aDeps - bDeps;
        });

        return workflows;
    }

    /**
     * Extrait les dépendances d'un fichier de workflow n8n
     * @private
     */
    private async extractDependenciesFromWorkflow(filePath: string): Promise<string[]> {
        try {
            // Lire le contenu du fichier
            const content = await fs.readFile(filePath, 'utf-8');
            const workflow = JSON.parse(content);

            const dependencies: string[] = [];

            // Rechercher les nœuds ExecuteWorkflow qui référencent d'autres workflows
            if (workflow.nodes && Array.isArray(workflow.nodes)) {
                for (const node of workflow.nodes) {
                    // Nœuds de type ExecuteWorkflow qui appellent explicitement d'autres workflows
                    if (node.type === 'n8n-nodes-base.executeWorkflow' && node.parameters?.workflowId) {
                        const referencedWorkflowId = node.parameters.workflowId;
                        // Trouver le nom du workflow correspondant à cet ID
                        const referencedWorkflow = this.workflowsInfo.find(wf =>
                            wf.sourcePath.includes(referencedWorkflowId) || wf.name.includes(referencedWorkflowId)
                        );

                        if (referencedWorkflow) {
                            dependencies.push(referencedWorkflow.id);
                        }
                    }

                    // Nœuds HTTP qui pourraient appeler des webhooks d'autres workflows
                    if ((node.type === 'n8n-nodes-base.httpRequest' || node.type === 'n8n-nodes-base.webhook') &&
                        node.parameters?.url) {
                        const url = node.parameters.url;
                        // Rechercher dans l'URL des références à des webhooks n8n
                        if (url.includes('webhook') || url.includes('n8n')) {
                            // Logique pour identifier les workflows associés à ces webhooks
                            // Cette partie serait adaptée au contexte spécifique
                        }
                    }
                }
            }

            return dependencies;
        } catch (error) {
            console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
            return [];
        }
    }
}

// Exporter une instance par défaut du tracker
export const migrationTracker = new WorkflowMigrationTracker();

/**
 * UTILISATION
 * 
 * // Initialiser le tracker
 * await migrationTracker.load();
 * 
 * // Ajouter un nouveau workflow à suivre
 * await migrationTracker.addWorkflow({
 *   name: 'Analyse de code',
 *   sourcePath: '/workflows/code-analysis.n8n.json',
 *   targetPath: '/packages/business/temporal/workflows/code-analysis.ts',
 *   priority: 1,
 *   complexity: 'complex',
 *   status: MigrationStatus.PENDING,
 *   targetType: TargetType.TEMPORAL,
 *   assignedTo: 'developer@example.com'
 * });
 * 
 * // Mettre à jour l'état d'un workflow
 * await migrationTracker.updateWorkflow('wf_123', {
 *   status: MigrationStatus.IN_PROGRESS,
 *   startDate: new Date().toISOString()
 * });
 * 
 * // Générer un résumé de la migration
 * const summary = await migrationTracker.generateSummary();
 * console.log(`Progression: ${summary.completionPercentage}%`);
 */