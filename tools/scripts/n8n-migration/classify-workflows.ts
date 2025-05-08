/**
 * Script de classification des workflows n8n
 * 
 * Ce script analyse les workflows extraits et les classe selon leur complexité,
 * criticité et autres critères pour faciliter la planification de la migration.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { program } from 'commander';
import * as globby from 'fast-glob';
import chalk from 'chalk';
import { table } from 'table';

// Types pour la classification
interface WorkflowClassification {
    id: string;
    name: string;
    complexity: 'simple' | 'modere' | 'complexe';
    criticality: 'faible' | 'moyenne' | 'haute';
    targetStrategy: 'bullmq' | 'temporal' | 'api' | 'suppression';
    priority: 'P1' | 'P2' | 'P3';
    nodeCount: number;
    hasStateHandling: boolean;
    hasExternalIntegrations: boolean;
    avgExecutionTime?: number;
    executionFrequency?: string;
    lastExecuted?: string;
    usedNodeTypes: string[];
    estimatedMigrationEffort: 'faible' | 'moyen' | 'important';
    suggestedApproach: string;
    notes: string;
}

// Configurer les arguments de ligne de commande
program
    .option('-i, --input <path>', 'Répertoire contenant les workflows extraits', './migrations/n8n-inventory')
    .option('-o, --output <path>', 'Chemin du fichier de sortie pour la classification', './migrations/n8n-classification.json')
    .parse(process.argv);

const options = program.opts();
const inputPath = path.resolve(process.cwd(), options.input);
const outputPath = path.resolve(process.cwd(), options.output);

/**
 * Détermine la complexité d'un workflow en fonction de ses caractéristiques
 */
function determineComplexity(workflow: any): 'simple' | 'modere' | 'complexe' {
    const nodes = workflow.nodes || [];
    const connections = workflow.connections || [];

    // Analyse des nœuds
    const nodeTypes = nodes.map((node: any) => node.type);

    // Facteurs de complexité
    const hasLoops = nodes.some((node: any) => node.type?.includes('Loop') || node.type?.includes('Split'));
    const hasConditions = nodes.some((node: any) => node.type === 'IF' || node.type === 'Switch');
    const hasWaitNodes = nodes.some((node: any) => node.type === 'Wait' || node.type?.includes('Delay'));
    const hasSubworkflows = nodes.some((node: any) => node.type === 'ExecuteWorkflow');
    const hasErrorHandling = workflow.settings?.errorWorkflow || nodes.some((node: any) => node.type === 'Error');

    // Complexité basée sur le nombre de nœuds
    if (nodes.length > 20 || hasSubworkflows) {
        return 'complexe';
    } else if (nodes.length > 8 || hasLoops || hasConditions || hasWaitNodes || hasErrorHandling) {
        return 'modere';
    }

    return 'simple';
}

/**
 * Détermine la criticité d'un workflow en fonction de ses métadonnées d'exécution
 */
function determineCriticality(workflow: any): 'faible' | 'moyenne' | 'haute' {
    const metadata = workflow.metadata || {};
    const stats = metadata.executionStats || {};

    // Un workflow fréquemment utilisé est plus critique
    if (stats.totalExecutions > 1000 || stats.averageDuration > 60000) {
        return 'haute';
    } else if (stats.totalExecutions > 100) {
        return 'moyenne';
    }

    // Analyser les tags pour des indications sur la criticité
    const tags = workflow.tags || [];
    if (tags.some((tag: string) => tag.toLowerCase().includes('critical') || tag.toLowerCase().includes('important'))) {
        return 'haute';
    } else if (tags.some((tag: string) => tag.toLowerCase().includes('medium'))) {
        return 'moyenne';
    }

    return 'faible';
}

/**
 * Détermine la stratégie de migration la plus appropriée
 */
function determineTargetStrategy(
    complexity: 'simple' | 'modere' | 'complexe',
    nodes: any[]
): 'bullmq' | 'temporal' | 'api' | 'suppression' {
    // Vérifier si le workflow est obsolète ou inutilisé
    // (Dans un cas réel, cela pourrait être basé sur des critères plus précis)
    const isUnused = false; // Placeholder pour une logique réelle

    if (isUnused) {
        return 'suppression';
    }

    // Les workflows complexes vont vers Temporal
    if (complexity === 'complexe') {
        return 'temporal';
    }

    // Les workflows modérés nécessitent une évaluation
    if (complexity === 'modere') {
        const hasStateHandling = nodes.some((node: any) =>
            node.type === 'Wait' ||
            node.type?.includes('Delay') ||
            node.type === 'ExecuteWorkflow'
        );

        return hasStateHandling ? 'temporal' : 'bullmq';
    }

    // Pour les workflows simples qui sont juste des webhooks sans logique complexe
    const isSimpleWebhook = nodes.length <= 2 && nodes.some((node: any) => node.type === 'Webhook');
    if (isSimpleWebhook) {
        return 'api';
    }

    // Par défaut, les workflows simples vont vers BullMQ
    return 'bullmq';
}

/**
 * Détermine la priorité de migration basée sur la matrice de priorisation
 */
function determinePriority(
    complexity: 'simple' | 'modere' | 'complexe',
    criticality: 'faible' | 'moyenne' | 'haute'
): 'P1' | 'P2' | 'P3' {
    const priorityMatrix: Record<string, Record<string, 'P1' | 'P2' | 'P3'>> = {
        simple: {
            faible: 'P3',
            moyenne: 'P2',
            haute: 'P2'
        },
        modere: {
            faible: 'P3',
            moyenne: 'P2',
            haute: 'P1'
        },
        complexe: {
            faible: 'P2',
            moyenne: 'P1',
            haute: 'P1'
        }
    };

    return priorityMatrix[complexity][criticality];
}

/**
 * Estime l'effort de migration nécessaire
 */
function estimateMigrationEffort(
    complexity: 'simple' | 'modere' | 'complexe',
    nodes: any[]
): 'faible' | 'moyen' | 'important' {
    // L'effort est basé sur la complexité et le nombre de nœuds
    if (complexity === 'complexe' || nodes.length > 15) {
        return 'important';
    } else if (complexity === 'modere' || nodes.length > 7) {
        return 'moyen';
    }

    return 'faible';
}

/**
 * Suggère une approche de migration
 */
function suggestMigrationApproach(
    complexity: 'simple' | 'modere' | 'complexe',
    criticality: 'faible' | 'moyenne' | 'haute',
    targetStrategy: 'bullmq' | 'temporal' | 'api' | 'suppression'
): string {
    if (targetStrategy === 'suppression') {
        return 'Pas de migration nécessaire - workflow obsolète';
    }

    // Pour les workflows critiques et complexes
    if (criticality === 'haute' && (complexity === 'complexe' || complexity === 'modere')) {
        return 'Exécution parallèle avec période de validation';
    }

    // Pour les workflows de criticité moyenne
    if (criticality === 'moyenne') {
        return 'Tests approfondis avant migration';
    }

    // Pour les workflows simples de faible criticité
    if (complexity === 'simple' && criticality === 'faible') {
        return 'Migration directe en lot';
    }

    return 'Migration standard avec tests';
}

/**
 * Vérifier si un workflow a une gestion d'état
 */
function hasStateHandling(nodes: any[]): boolean {
    return nodes.some((node: any) =>
        node.type === 'Wait' ||
        node.type?.includes('Delay') ||
        node.type === 'ExecuteWorkflow' ||
        node.type === 'Split' ||
        node.parameters?.mode === 'runOnceForEach'
    );
}

/**
 * Vérifier si un workflow a des intégrations externes
 */
function hasExternalIntegrations(nodes: any[]): boolean {
    const externalIntegrationNodes = [
        'HTTP Request', 'Webhook', 'FTP', 'SFTP', 'SSH', 'Email',
        'Slack', 'Telegram', 'Twitter', 'Discord', 'Twilio',
        'Salesforce', 'Stripe', 'HubSpot', 'Airtable', 'Notion'
    ];

    return nodes.some((node: any) =>
        externalIntegrationNodes.includes(node.type) ||
        node.type?.includes('API')
    );
}

/**
 * Analyse les workflows n8n extraits et les classe
 */
async function classifyWorkflows(): Promise<void> {
    try {
        console.log(chalk.blue('🔍 Analyse et classification des workflows n8n...'));

        // Vérifier que le répertoire d'entrée existe
        if (!await fs.pathExists(inputPath)) {
            throw new Error(`Le répertoire d'entrée n'existe pas: ${inputPath}`);
        }

        // Rechercher tous les fichiers JSON (sauf _index.json)
        const workflowFiles = await globby(`${inputPath}/**/*.json`, {
            ignore: [`${inputPath}/_index.json`],
            absolute: true
        });

        console.log(chalk.green(`✅ ${workflowFiles.length} fichiers de workflow trouvés.`));

        // Analyser et classifier chaque workflow
        const classifications: WorkflowClassification[] = [];

        for (const file of workflowFiles) {
            try {
                const workflow = await fs.readJSON(file);
                const nodes = workflow.nodes || [];

                const complexity = determineComplexity(workflow);
                const criticality = determineCriticality(workflow);
                const targetStrategy = determineTargetStrategy(complexity, nodes);
                const priority = determinePriority(complexity, criticality);

                const classification: WorkflowClassification = {
                    id: workflow.id,
                    name: workflow.name,
                    complexity,
                    criticality,
                    targetStrategy,
                    priority,
                    nodeCount: nodes.length,
                    hasStateHandling: hasStateHandling(nodes),
                    hasExternalIntegrations: hasExternalIntegrations(nodes),
                    avgExecutionTime: workflow.metadata?.executionStats?.averageDuration,
                    executionFrequency: workflow.metadata?.executionStats?.totalExecutions > 0
                        ? `${workflow.metadata.executionStats.totalExecutions} exécutions récentes`
                        : 'Inconnue',
                    lastExecuted: workflow.metadata?.executionStats?.lastExecution,
                    usedNodeTypes: [...new Set(nodes.map((node: any) => node.type))],
                    estimatedMigrationEffort: estimateMigrationEffort(complexity, nodes),
                    suggestedApproach: suggestMigrationApproach(complexity, criticality, targetStrategy),
                    notes: ''
                };

                classifications.push(classification);
                process.stdout.write(`${chalk.green('.')} `);
            } catch (error) {
                console.error(chalk.red(`Erreur lors de la classification du workflow ${file}`), error.message);
            }
        }

        console.log('\n');

        // Créer le répertoire parent si nécessaire
        await fs.ensureDir(path.dirname(outputPath));

        // Sauvegarder la classification
        await fs.writeJSON(outputPath, classifications, { spaces: 2 });
        console.log(chalk.green(`✅ Classification sauvegardée dans ${outputPath}`));

        // Générer un rapport de synthèse
        const summary = {
            totalWorkflows: classifications.length,
            byComplexity: {
                simple: classifications.filter(c => c.complexity === 'simple').length,
                modere: classifications.filter(c => c.complexity === 'modere').length,
                complexe: classifications.filter(c => c.complexity === 'complexe').length
            },
            byCriticality: {
                faible: classifications.filter(c => c.criticality === 'faible').length,
                moyenne: classifications.filter(c => c.criticality === 'moyenne').length,
                haute: classifications.filter(c => c.criticality === 'haute').length
            },
            byTargetStrategy: {
                bullmq: classifications.filter(c => c.targetStrategy === 'bullmq').length,
                temporal: classifications.filter(c => c.targetStrategy === 'temporal').length,
                api: classifications.filter(c => c.targetStrategy === 'api').length,
                suppression: classifications.filter(c => c.targetStrategy === 'suppression').length
            },
            byPriority: {
                P1: classifications.filter(c => c.priority === 'P1').length,
                P2: classifications.filter(c => c.priority === 'P2').length,
                P3: classifications.filter(c => c.priority === 'P3').length
            }
        };

        // Afficher le rapport de synthèse
        console.log(chalk.blue('\n📊 Rapport de synthèse de la classification'));
        console.log(`Nombre total de workflows : ${chalk.bold(summary.totalWorkflows)}`);

        const complexityData = [
            ['Complexité', 'Nombre'],
            ['Simple', summary.byComplexity.simple],
            ['Modéré', summary.byComplexity.modere],
            ['Complexe', summary.byComplexity.complexe]
        ];

        const criticalityData = [
            ['Criticité', 'Nombre'],
            ['Faible', summary.byCriticality.faible],
            ['Moyenne', summary.byCriticality.moyenne],
            ['Haute', summary.byCriticality.haute]
        ];

        const strategyData = [
            ['Stratégie cible', 'Nombre'],
            ['BullMQ', summary.byTargetStrategy.bullmq],
            ['Temporal', summary.byTargetStrategy.temporal],
            ['API directe', summary.byTargetStrategy.api],
            ['Suppression', summary.byTargetStrategy.suppression]
        ];

        const priorityData = [
            ['Priorité', 'Nombre'],
            ['P1 (Haute)', summary.byPriority.P1],
            ['P2 (Moyenne)', summary.byPriority.P2],
            ['P3 (Basse)', summary.byPriority.P3]
        ];

        console.log(chalk.yellow('\nRépartition par complexité:'));
        console.log(table(complexityData));

        console.log(chalk.yellow('\nRépartition par criticité:'));
        console.log(table(criticalityData));

        console.log(chalk.yellow('\nRépartition par stratégie cible:'));
        console.log(table(strategyData));

        console.log(chalk.yellow('\nRépartition par priorité:'));
        console.log(table(priorityData));

        // Sauvegarder le rapport de synthèse
        const summaryPath = path.join(path.dirname(outputPath), 'n8n-classification-summary.json');
        await fs.writeJSON(summaryPath, summary, { spaces: 2 });
        console.log(chalk.green(`✅ Rapport de synthèse sauvegardé dans ${summaryPath}`));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors de la classification des workflows :'), error.message);
        process.exit(1);
    }
}

// Exécuter le script
classifyWorkflows()
    .then(() => {
        console.log(chalk.green('✅ Classification des workflows terminée avec succès.'));
    })
    .catch((error) => {
        console.error(chalk.red('❌ Erreur lors de l\'exécution du script :'), error);
        process.exit(1);
    });