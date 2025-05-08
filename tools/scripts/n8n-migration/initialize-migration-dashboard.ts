/**
 * Script d'initialisation du tableau de bord de migration
 * 
 * Ce script identifie tous les workflows n8n existants, les analyse
 * et initialise le tableau de bord de migration pour suivre leur migration
 * vers les orchestrateurs standardisés.
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { migrationTracker, MigrationStatus, TargetType, WorkflowMigrationInfo } from '../../../packages/business/orchestration-monitoring/migration-dashboard';

const execPromise = promisify(exec);

// Fonction pour afficher des messages colorés en console (remplacement de chalk)
const colors = {
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`
};

// Chemins pour la recherche de workflows n8n
const WORKFLOW_SEARCH_PATHS = [
    '/workspaces/cahier-des-charge/packages/business/workflows/**/*.json',
    '/workspaces/cahier-des-charge/packages/business/workflows/migration/**/*.json',
    '/workspaces/cahier-des-charge/packages/business/workflows/extracted/**/*.json',
    '/workspaces/cahier-des-charge/packages/business/config/**/*.json',
    '/workspaces/cahier-des-charge/packages/business/config/**/*.n8n.json',
    '/workspaces/cahier-des-charge/packages/orchestration/orchestration/workflows/**/*.json',
    '/workspaces/cahier-des-charge/packages/business/templates/**/*.json'
];

/**
 * Utilise la commande find pour rechercher les fichiers selon un pattern
 * @param pattern Le pattern pour trouver les fichiers
 * @returns Liste des chemins de fichiers trouvés
 */
async function findFilesByPattern(pattern: string): Promise<string[]> {
    try {
        // Extraire le chemin de base et le pattern de fichier
        const parts = pattern.split('/**/');
        const basePath = parts[0];

        // Si le basePath est vide, retourner un tableau vide
        if (!basePath) {
            console.error('Chemin de base non valide:', pattern);
            return [];
        }

        const filePattern = parts.length > 1 ? parts[1] : '*';

        // Vérifier si le répertoire de base existe
        try {
            await fs.access(basePath);
        } catch (err) {
            return []; // Le répertoire n'existe pas, retourner un tableau vide
        }

        // Utiliser find pour chercher les fichiers
        const { stdout } = await execPromise(`find ${basePath} -type f -path "${pattern.replace('**/', '*/')}"`);
        return stdout.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        console.error('Erreur lors de la recherche de fichiers:', error);
        return [];
    }
}

// Configuration des types d'orchestrateurs cibles en fonction des motifs dans les noms de fichiers
const TARGET_TYPE_PATTERNS = [
    { pattern: /notification|email|alert|message|slack/i, type: TargetType.BULLMQ },
    { pattern: /analyze|analysis|job|processing|pipeline|generation|build/i, type: TargetType.TEMPORAL },
    { pattern: /api|webhook|http|rest/i, type: TargetType.REST_API },
    { pattern: /complex|multiple|combined/i, type: TargetType.MIXED },
];

/**
 * Analyse un workflow n8n pour déterminer sa complexité
 */
async function analyzeWorkflowComplexity(filePath: string): Promise<'simple' | 'medium' | 'complex'> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const workflow = JSON.parse(content);

        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
            return 'simple'; // Pas de nœuds définis, probablement un workflow simple
        }

        const nodeCount = workflow.nodes.length;

        // Vérifier si le workflow a une gestion d'état
        const hasStateHandling = workflow.nodes.some((node: any) =>
            node.type === 'Wait' ||
            node.type?.includes('Delay') ||
            node.type === 'ExecuteWorkflow' ||
            node.type === 'Split' ||
            (node.parameters && node.parameters.mode === 'runOnceForEach')
        );

        // Vérifier si le workflow a des intégrations externes
        const externalIntegrationNodes = [
            'HTTP Request', 'Webhook', 'FTP', 'SFTP', 'SSH', 'Email',
            'Slack', 'Telegram', 'Twitter', 'Discord', 'Twilio',
            'Salesforce', 'Stripe', 'HubSpot', 'Airtable', 'Notion'
        ];

        const hasExternalIntegrations = workflow.nodes.some((node: any) =>
            externalIntegrationNodes.includes(node.type) ||
            (node.type && node.type.includes('API'))
        );

        if (nodeCount > 15 || (hasStateHandling && hasExternalIntegrations)) {
            return 'complex';
        } else if (nodeCount > 5 || hasStateHandling || hasExternalIntegrations) {
            return 'medium';
        } else {
            return 'simple';
        }
    } catch (error) {
        console.error(`Erreur lors de l'analyse de la complexité du workflow ${filePath}:`, error);
        return 'medium'; // Valeur par défaut en cas d'erreur
    }
}

/**
 * Détermine le type d'orchestrateur cible pour un workflow
 */
function determineTargetType(filePath: string, name: string): TargetType {
    const fileName = path.basename(filePath);

    for (const { pattern, type } of TARGET_TYPE_PATTERNS) {
        if (pattern.test(fileName) || pattern.test(name)) {
            return type;
        }
    }

    return TargetType.OTHER; // Par défaut
}

/**
 * Détermine la priorité de migration pour un workflow
 */
function determineMigrationPriority(
    complexity: 'simple' | 'medium' | 'complex',
    filePath: string,
    name: string
): number {
    // Priorités:
    // 1 - Critique et utilisé fréquemment
    // 2 - Important et utilisé régulièrement
    // 3 - Moyennement important ou utilisé occasionnellement
    // 4 - Peu important ou rarement utilisé
    // 5 - Très peu important ou obsolète

    // Vérifier si le workflow est dans un chemin qui indique son importance
    if (filePath.includes('/workflows/migration/')) {
        return 1; // Workflows de migration sont prioritaires
    }

    if (filePath.includes('/config/') && !filePath.includes('legacy')) {
        return 2; // Workflows de configuration sont importants
    }

    if (name.toLowerCase().includes('monitoring') || name.toLowerCase().includes('alert')) {
        return 2; // Les workflows de monitoring et d'alertes sont importants
    }

    // Ajuster en fonction de la complexité
    switch (complexity) {
        case 'complex': return 3; // Les workflows complexes ont une priorité moyenne
        case 'medium': return 3; // Priorité moyenne
        case 'simple': return 4; // Les workflows simples sont moins prioritaires
        default: return 5;
    }
}

/**
 * Fonction principale qui effectue l'initialisation du tableau de bord de migration
 */
async function initializeMigrationDashboard(): Promise<void> {
    try {
        console.log(colors.blue('🔍 Initialisation du tableau de bord de migration des workflows n8n...'));

        // Initialiser le tracker de migration
        await migrationTracker.load();

        // Rechercher tous les workflows n8n
        let allWorkflows: string[] = [];
        for (const searchPath of WORKFLOW_SEARCH_PATHS) {
            const files = await findFilesByPattern(searchPath);
            allWorkflows = [...allWorkflows, ...files];
        }

        console.log(colors.green(`✅ ${allWorkflows.length} fichiers de workflow n8n trouvés.`));

        // Analyser et ajouter chaque workflow au tracker
        for (const filePath of allWorkflows) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const fileName = path.basename(filePath);

                // Essayer de lire le workflow pour extraire son nom
                let workflowName: string;
                try {
                    const workflow = JSON.parse(content);
                    workflowName = workflow.name || fileName.replace('.json', '').replace('.n8n', '');
                } catch (parseError) {
                    workflowName = fileName.replace('.json', '').replace('.n8n', '');
                    console.warn(colors.yellow(`⚠️ Impossible de parser le contenu JSON de ${filePath}, utilisation du nom de fichier.`));
                }

                // Analyser la complexité
                const complexity = await analyzeWorkflowComplexity(filePath);

                // Déterminer le type d'orchestrateur cible
                const targetType = determineTargetType(filePath, workflowName);

                // Déterminer la priorité
                const priority = determineMigrationPriority(complexity, filePath, workflowName);

                // Vérifier si le workflow est déjà dans le tracker (vérifier par chemin source)
                const existingWorkflows = migrationTracker.listWorkflows();
                const existingWorkflow = existingWorkflows.find((wf: WorkflowMigrationInfo) => wf.sourcePath === filePath);

                if (existingWorkflow) {
                    console.log(colors.yellow(`ℹ️ Workflow déjà présent dans le tracker: ${workflowName}`));
                    continue;
                }

                // Ajouter le workflow au tracker
                await migrationTracker.addWorkflow({
                    name: workflowName,
                    sourcePath: filePath,
                    priority,
                    complexity,
                    status: MigrationStatus.PENDING,
                    targetType
                });

                console.log(colors.green(`✅ Workflow ajouté au tracker: ${workflowName} (Complexité: ${complexity}, Priorité: ${priority})`));
            } catch (error) {
                console.error(colors.red(`❌ Erreur lors du traitement du workflow ${filePath}:`), error);
            }
        }

        // Analyser les dépendances entre workflows
        console.log(colors.blue('🔍 Analyse des dépendances entre workflows...'));
        await migrationTracker.analyzeDependencies();

        // Générer un plan de migration initial
        console.log(colors.blue('📋 Génération du plan de migration initial...'));
        const migrationPlan = await migrationTracker.generateMigrationPlan();

        // Afficher un résumé
        const summary = await migrationTracker.generateSummary();
        console.log(colors.green('\n📊 Résumé du tableau de bord de migration:'));
        console.log(colors.green(`  • Total des workflows: ${summary.total}`));
        console.log(colors.green(`  • Par statut:`));
        console.log(colors.green(`    ◦ En attente: ${summary.status[MigrationStatus.PENDING]}`));
        console.log(colors.green(`    ◦ En cours: ${summary.status[MigrationStatus.IN_PROGRESS]}`));
        console.log(colors.green(`    ◦ Migrés: ${summary.status[MigrationStatus.MIGRATED]}`));
        console.log(colors.green(`    ◦ Validés: ${summary.status[MigrationStatus.VALIDATED]}`));
        console.log(colors.green(`  • Par type d'orchestrateur cible:`));
        console.log(colors.green(`    ◦ BullMQ: ${summary.targetType[TargetType.BULLMQ]}`));
        console.log(colors.green(`    ◦ Temporal: ${summary.targetType[TargetType.TEMPORAL]}`));
        console.log(colors.green(`    ◦ API REST: ${summary.targetType[TargetType.REST_API]}`));
        console.log(colors.green(`    ◦ Mixte: ${summary.targetType[TargetType.MIXED]}`));
        console.log(colors.green(`    ◦ Autre: ${summary.targetType[TargetType.OTHER]}`));

        console.log(colors.blue('\n🔄 Top 5 des workflows prioritaires à migrer:'));
        // S'assurer que migrationPlan a des éléments avant d'itérer dessus
        if (migrationPlan.length > 0) {
            for (let i = 0; i < Math.min(5, migrationPlan.length); i++) {
                const wf = migrationPlan[i];
                if (wf) {
                    console.log(colors.blue(`  ${i + 1}. ${wf.name} (Priorité: ${wf.priority}, Complexité: ${wf.complexity})`));
                }
            }
        } else {
            console.log(colors.yellow('  Aucun workflow à migrer trouvé.'));
        }

        console.log(colors.green('\n✅ Initialisation du tableau de bord de migration terminée!'));
    } catch (error) {
        console.error(colors.red('\n❌ Erreur lors de l\'initialisation du tableau de bord de migration:'), error);
        process.exit(1);
    }
}

// Exécution du script
initializeMigrationDashboard().catch(error => {
    console.error(colors.red('❌ Erreur non gérée:'), error);
    process.exit(1);
});