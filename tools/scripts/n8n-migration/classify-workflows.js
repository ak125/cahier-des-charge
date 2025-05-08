/**
 * Script de classification des workflows n8n
 * Ce script analyse les workflows n8n extraits et les classe selon
 * leur complexité et leur criticité pour faciliter la priorisation de migration.
 * 
 * Usage: node classify-workflows.js --input ./migrations/n8n-inventory --output ./migrations/n8n-classification.json
 * 
 * Date de création: 6 mai 2025
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_INPUT_DIR = path.join(process.cwd(), 'migrations/n8n-inventory');
const DEFAULT_OUTPUT_FILE = path.join(process.cwd(), 'migrations/n8n-classification.json');
const DEFAULT_WORKFLOWS_INDEX = 'n8n-workflows-index.json';

// Traitement des arguments
const args = process.argv.slice(2);
let inputDir = DEFAULT_INPUT_DIR;
let outputFile = DEFAULT_OUTPUT_FILE;
let verbose = false;

for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--input' || arg.startsWith('--input=')) {
        inputDir = arg.includes('=') ? arg.split('=')[1] : args[++i];
    } else if (arg === '--output' || arg.startsWith('--output=')) {
        outputFile = arg.includes('=') ? arg.split('=')[1] : args[++i];
    } else if (arg === '--verbose') {
        verbose = true;
    }
}

console.log('=== Classification des workflows n8n ===');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Répertoire d'entrée: ${inputDir}`);
console.log(`Fichier de sortie: ${outputFile}`);

// Vérification que le répertoire d'entrée existe
if (!fs.existsSync(inputDir)) {
    console.error(`Erreur: Le répertoire d'entrée ${inputDir} n'existe pas.`);
    process.exit(1);
}

// Vérification de l'existence du fichier d'index
const indexFile = path.join(inputDir, DEFAULT_WORKFLOWS_INDEX);
if (!fs.existsSync(indexFile)) {
    console.error(`Erreur: Le fichier d'index ${indexFile} n'existe pas.`);
    console.error('Exécutez d\'abord extract-workflows.sh pour créer l\'inventaire des workflows.');
    process.exit(1);
}

// Création du répertoire de sortie s'il n'existe pas
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Répertoire de sortie créé: ${outputDir}`);
}

/**
 * Classification des workflows
 * 
 * Complexité:
 * - Simple: Workflow linéaire avec peu d'étapes et sans état complexe
 * - Modéré: Workflow avec branchements conditionnels ou boucles simples
 * - Complexe: Workflow avec état persistant, compensation, ou longue durée
 * 
 * Criticité:
 * - Faible: Non essentiel au fonctionnement du système
 * - Moyenne: Important mais avec alternatives ou contournements
 * - Haute: Critique pour le fonctionnement du système
 * 
 * Stratégie de migration:
 * - BullMQ: Pour les workflows simples sans état
 * - Temporal: Pour les workflows complexes avec état
 * - API: Pour les workflows remplaçables par API directes
 * - Suppression: Pour les workflows obsolètes ou inutilisés
 */

// Charger l'index des workflows
console.log('Chargement de l\'index des workflows...');
const workflowsIndex = require(indexFile);
console.log(`${workflowsIndex.totalWorkflows} workflows trouvés dans l'index.`);

// Analyser chaque workflow
console.log('Classification des workflows...');
const classifiedWorkflows = [];

for (const workflowFile of workflowsIndex.workflowFiles || []) {
    try {
        const filePath = path.join(path.dirname(indexFile), workflowFile.path);

        if (!fs.existsSync(filePath)) {
            console.error(`Avertissement: Le fichier ${filePath} n'existe pas.`);
            continue;
        }

        // Charger le contenu du workflow
        const workflowContent = require(filePath);
        const workflowName = workflowContent.name || workflowFile.name || 'Workflow sans nom';

        // Analyser la complexité du workflow
        const complexity = analyzeComplexity(workflowContent);

        // Déterminer la criticité (simple heuristique pour démo, à remplacer par une vraie analyse)
        const criticality = analyzeCriticality(workflowContent);

        // Déterminer la stratégie de migration recommandée
        const migrationStrategy = determineMigrationStrategy(complexity, criticality);

        // Déterminer la priorité selon la matrice
        const priority = determinePriority(complexity, criticality);

        // Collecter les détails de la classification
        classifiedWorkflows.push({
            name: workflowName,
            id: workflowContent.id || `workflow-${classifiedWorkflows.length + 1}`,
            filePath: workflowFile.path,
            complexity: {
                level: complexity.level,
                score: complexity.score,
                factors: complexity.factors
            },
            criticality: {
                level: criticality.level,
                score: criticality.score,
                factors: criticality.factors
            },
            migrationStrategy: migrationStrategy,
            priority: priority,
            stats: {
                nodes: (workflowContent.nodes || []).length,
                connections: countConnections(workflowContent),
                hasWebhooks: hasWebhooks(workflowContent),
                hasCron: hasCronTriggers(workflowContent),
                hasExternalCalls: hasExternalAPICalls(workflowContent),
                hasLoops: hasLoops(workflowContent),
                estimatedMigrationEffort: estimateMigrationEffort(complexity, criticality)
            }
        });

        if (verbose) {
            console.log(`Classifié: ${workflowName}`);
            console.log(`  Complexité: ${complexity.level} (${complexity.score})`);
            console.log(`  Criticité: ${criticality.level} (${criticality.score})`);
            console.log(`  Stratégie: ${migrationStrategy}`);
            console.log(`  Priorité: ${priority}`);
        } else {
            process.stdout.write('.');
        }
    } catch (error) {
        console.error(`Erreur lors de la classification du workflow ${workflowFile.path}: ${error.message}`);
    }
}

if (!verbose) {
    console.log(''); // Nouvelle ligne après les points de progression
}

console.log(`${classifiedWorkflows.length} workflows classifiés avec succès.`);

// Générer le rapport de classification
const classificationReport = {
    generatedAt: new Date().toISOString(),
    totalWorkflows: classifiedWorkflows.length,
    sourceInventory: indexFile,
    summary: generateSummary(classifiedWorkflows),
    workflows: classifiedWorkflows
};

// Écrire le rapport dans le fichier de sortie
fs.writeFileSync(outputFile, JSON.stringify(classificationReport, null, 2));
console.log(`Rapport de classification écrit dans ${outputFile}`);

// Générer également une version Markdown
const markdownFile = outputFile.replace('.json', '.md');
fs.writeFileSync(markdownFile, generateMarkdownReport(classificationReport));
console.log(`Rapport Markdown écrit dans ${markdownFile}`);

console.log('=== Classification terminée avec succès ===');

// Fonctions d'analyse de la complexité des workflows
function analyzeComplexity(workflow) {
    const nodes = workflow.nodes || [];
    const connections = workflow.connections || [];

    let score = 0;
    const factors = [];

    // Nombre de nœuds (1 point par tranche de 5 nœuds)
    const nodeScore = Math.ceil(nodes.length / 5);
    score += nodeScore;
    factors.push(`${nodes.length} nœuds (+${nodeScore})`);

    // Nombre de connexions (1 point par tranche de 7 connexions)
    const connectionCount = countConnections(workflow);
    const connectionScore = Math.ceil(connectionCount / 7);
    score += connectionScore;
    factors.push(`${connectionCount} connexions (+${connectionScore})`);

    // Points supplémentaires pour les caractéristiques complexes

    // Vérifier si le workflow a des webhooks
    if (hasWebhooks(workflow)) {
        score += 3;
        factors.push('Contient des webhooks (+3)');
    }

    // Vérifier si le workflow a des déclencheurs cron
    if (hasCronTriggers(workflow)) {
        score += 2;
        factors.push('Contient des déclencheurs cron (+2)');
    }

    // Vérifier si le workflow fait des appels API externes
    if (hasExternalAPICalls(workflow)) {
        score += 2;
        factors.push('Contient des appels API externes (+2)');
    }

    // Vérifier si le workflow contient des boucles
    if (hasLoops(workflow)) {
        score += 3;
        factors.push('Contient des boucles (+3)');
    }

    // Déterminer le niveau de complexité
    let level = 'Simple';
    if (score >= 15) {
        level = 'Complexe';
    } else if (score >= 7) {
        level = 'Modéré';
    }

    return { level, score, factors };
}

// Fonctions d'analyse de la criticité des workflows
function analyzeCriticality(workflow) {
    const nodes = workflow.nodes || [];
    const name = workflow.name || '';

    let score = 0;
    const factors = [];

    // Rechercher des mots-clés liés à la criticité dans le nom du workflow
    const criticalKeywords = ['critique', 'critical', 'important', 'principal', 'main', 'core'];
    const mediumKeywords = ['notification', 'alert', 'rapport', 'report', 'monitor'];

    // Vérifier si le nom contient des mots-clés critiques
    for (const keyword of criticalKeywords) {
        if (name.toLowerCase().includes(keyword)) {
            score += 3;
            factors.push(`Nom contient "${keyword}" (+3)`);
            break;
        }
    }

    // Vérifier si le nom contient des mots-clés moyens
    for (const keyword of mediumKeywords) {
        if (name.toLowerCase().includes(keyword)) {
            score += 2;
            factors.push(`Nom contient "${keyword}" (+2)`);
            break;
        }
    }

    // Vérifier si le workflow est lié à des processus métier critiques
    if (name.toLowerCase().includes('migration')) {
        score += 3;
        factors.push('Lié à la migration (+3)');
    }

    if (name.toLowerCase().includes('pipeline')) {
        score += 2;
        factors.push('Lié à un pipeline (+2)');
    }

    // Workflows SQL/DB sont souvent critiques
    if (
        name.toLowerCase().includes('sql') ||
        name.toLowerCase().includes('database') ||
        name.toLowerCase().includes('db') ||
        name.toLowerCase().includes('mysql') ||
        name.toLowerCase().includes('postgres')
    ) {
        score += 3;
        factors.push('Lié à une base de données (+3)');
    }

    // Vérifier s'il contient des nœuds critiques
    if (containsCriticalNodes(nodes)) {
        score += 3;
        factors.push('Contient des nœuds critiques (+3)');
    }

    // Déterminer le niveau de criticité
    let level = 'Faible';
    if (score >= 5) {
        level = 'Haute';
    } else if (score >= 3) {
        level = 'Moyenne';
    }

    return { level, score, factors };
}

// Fonctions utilitaires
function countConnections(workflow) {
    const connections = workflow.connections || [];

    // Si connections est un tableau d'objets
    if (Array.isArray(connections)) {
        return connections.reduce((total, connection) => {
            // Vérifier si connection.items existe
            return total + (connection.items ? connection.items.length : 1);
        }, 0);
    }
    // Si connections est un objet avec des clés (format alternatif des workflows n8n)
    else if (connections && typeof connections === 'object') {
        let count = 0;

        // Parcourir les propriétés de l'objet connections
        for (const key in connections) {
            if (Array.isArray(connections[key])) {
                count += connections[key].length;
            } else if (connections[key]) {
                count += 1;
            }
        }

        return count;
    }

    // Par défaut, retourner 0
    return 0;
}

function hasWebhooks(workflow) {
    const nodes = workflow.nodes || [];
    return nodes.some(node => {
        return node.type && (
            node.type.toLowerCase().includes('webhook') ||
            node.type.toLowerCase().includes('trigger')
        );
    });
}

function hasCronTriggers(workflow) {
    const nodes = workflow.nodes || [];
    return nodes.some(node => {
        return node.type && (
            node.type.toLowerCase().includes('cron') ||
            node.type.toLowerCase().includes('schedule')
        );
    });
}

function hasExternalAPICalls(workflow) {
    const nodes = workflow.nodes || [];
    return nodes.some(node => {
        return node.type && (
            node.type.toLowerCase().includes('http') ||
            node.type.toLowerCase().includes('api') ||
            node.type.toLowerCase().includes('request')
        );
    });
}

function hasLoops(workflow) {
    const nodes = workflow.nodes || [];
    return nodes.some(node => {
        return node.type && (
            node.type.toLowerCase().includes('loop') ||
            node.type.toLowerCase().includes('foreach')
        );
    });
}

function containsCriticalNodes(nodes) {
    const criticalNodeTypes = [
        'database', 'mysql', 'postgres', 'mongodb',
        'webhook', 'email', 'sms', 'notification',
        'execute', 'function', 'code',
    ];

    return nodes.some(node => {
        if (!node.type) return false;

        for (const criticalType of criticalNodeTypes) {
            if (node.type.toLowerCase().includes(criticalType)) {
                return true;
            }
        }

        return false;
    });
}

function determineMigrationStrategy(complexity, criticality) {
    // Simple workflows → BullMQ
    if (complexity.level === 'Simple') {
        return 'BullMQ';
    }

    // Modéré ou Complexe → Temporal
    if (complexity.level === 'Modéré' || complexity.level === 'Complexe') {
        return 'Temporal';
    }

    // Par défaut, si on ne peut pas déterminer
    return 'à déterminer';
}

function determinePriority(complexity, criticality) {
    const matrix = {
        'Simple': {
            'Faible': 'P3',
            'Moyenne': 'P2',
            'Haute': 'P2'
        },
        'Modéré': {
            'Faible': 'P3',
            'Moyenne': 'P2',
            'Haute': 'P1'
        },
        'Complexe': {
            'Faible': 'P2',
            'Moyenne': 'P1',
            'Haute': 'P1'
        }
    };

    return matrix[complexity.level][criticality.level] || 'P2';
}

function estimateMigrationEffort(complexity, criticality) {
    // Estimation de base selon la complexité
    let baseEffort = 1; // en jours-personne

    if (complexity.level === 'Modéré') {
        baseEffort = 2;
    } else if (complexity.level === 'Complexe') {
        baseEffort = 4;
    }

    // Ajustement selon la criticité
    const criticalityFactor = criticality.level === 'Haute' ? 1.5 :
        criticality.level === 'Moyenne' ? 1.2 : 1;

    // Effort total estimé
    const totalEffort = baseEffort * criticalityFactor;

    // Arrondir à 0.5 jour près
    return Math.round(totalEffort * 2) / 2;
}

function generateSummary(workflows) {
    // Compter le nombre de workflows par complexité
    const complexityCount = {
        'Simple': 0,
        'Modéré': 0,
        'Complexe': 0
    };

    // Compter le nombre de workflows par criticité
    const criticalityCount = {
        'Faible': 0,
        'Moyenne': 0,
        'Haute': 0
    };

    // Compter le nombre de workflows par stratégie
    const strategyCount = {
        'BullMQ': 0,
        'Temporal': 0,
        'API': 0,
        'Suppression': 0,
        'à déterminer': 0
    };

    // Compter le nombre de workflows par priorité
    const priorityCount = {
        'P1': 0,
        'P2': 0,
        'P3': 0
    };

    // Total des efforts de migration
    let totalEffort = 0;

    // Parcourir tous les workflows
    for (const workflow of workflows) {
        complexityCount[workflow.complexity.level]++;
        criticalityCount[workflow.criticality.level]++;
        strategyCount[workflow.migrationStrategy]++;
        priorityCount[workflow.priority]++;
        totalEffort += workflow.stats.estimatedMigrationEffort;
    }

    return {
        complexityDistribution: complexityCount,
        criticalityDistribution: criticalityCount,
        strategyDistribution: strategyCount,
        priorityDistribution: priorityCount,
        estimatedTotalEffort: totalEffort,
        estimatedDuration: {
            weeks: Math.ceil(totalEffort / 5), // jours → semaines
            days: totalEffort
        }
    };
}

function generateMarkdownReport(report) {
    const summary = report.summary;

    let markdown = `# Rapport de Classification des Workflows n8n\n\n`;
    markdown += `*Rapport généré le ${new Date().toISOString().split('T')[0]}*\n\n`;

    markdown += `## Vue d'ensemble\n\n`;
    markdown += `- **Total des workflows**: ${report.totalWorkflows}\n`;
    markdown += `- **Effort total estimé**: ${summary.estimatedTotalEffort} jours-personne\n`;
    markdown += `- **Durée estimée**: ${summary.estimatedDuration.weeks} semaines (${summary.estimatedDuration.days} jours)\n\n`;

    markdown += `## Répartition par complexité\n\n`;
    markdown += `| Complexité | Nombre | Pourcentage |\n`;
    markdown += `|------------|--------|------------|\n`;
    for (const [level, count] of Object.entries(summary.complexityDistribution)) {
        const percentage = (count / report.totalWorkflows * 100).toFixed(1);
        markdown += `| ${level} | ${count} | ${percentage}% |\n`;
    }
    markdown += `\n`;

    markdown += `## Répartition par criticité\n\n`;
    markdown += `| Criticité | Nombre | Pourcentage |\n`;
    markdown += `|-----------|--------|------------|\n`;
    for (const [level, count] of Object.entries(summary.criticalityDistribution)) {
        const percentage = (count / report.totalWorkflows * 100).toFixed(1);
        markdown += `| ${level} | ${count} | ${percentage}% |\n`;
    }
    markdown += `\n`;

    markdown += `## Répartition par stratégie de migration\n\n`;
    markdown += `| Stratégie | Nombre | Pourcentage |\n`;
    markdown += `|-----------|--------|------------|\n`;
    for (const [strategy, count] of Object.entries(summary.strategyDistribution)) {
        if (count > 0) {
            const percentage = (count / report.totalWorkflows * 100).toFixed(1);
            markdown += `| ${strategy} | ${count} | ${percentage}% |\n`;
        }
    }
    markdown += `\n`;

    markdown += `## Répartition par priorité\n\n`;
    markdown += `| Priorité | Nombre | Pourcentage |\n`;
    markdown += `|----------|--------|------------|\n`;
    for (const [priority, count] of Object.entries(summary.priorityDistribution)) {
        const percentage = (count / report.totalWorkflows * 100).toFixed(1);
        markdown += `| ${priority} | ${count} | ${percentage}% |\n`;
    }
    markdown += `\n`;

    markdown += `## Liste des workflows par priorité\n\n`;

    // Trier les workflows par priorité
    const workflowsByPriority = {
        'P1': [],
        'P2': [],
        'P3': []
    };

    for (const workflow of report.workflows) {
        workflowsByPriority[workflow.priority].push(workflow);
    }

    // Afficher les workflows P1 d'abord
    markdown += `### Priorité P1 (Haute)\n\n`;
    if (workflowsByPriority['P1'].length === 0) {
        markdown += `*Aucun workflow P1 identifié*\n\n`;
    } else {
        markdown += `| Nom | Complexité | Criticité | Stratégie | Effort |\n`;
        markdown += `|-----|------------|-----------|-----------|--------|\n`;
        for (const workflow of workflowsByPriority['P1']) {
            markdown += `| ${workflow.name} | ${workflow.complexity.level} | ${workflow.criticality.level} | ${workflow.migrationStrategy} | ${workflow.stats.estimatedMigrationEffort} j |\n`;
        }
        markdown += `\n`;
    }

    // Workflows P2
    markdown += `### Priorité P2 (Moyenne)\n\n`;
    if (workflowsByPriority['P2'].length === 0) {
        markdown += `*Aucun workflow P2 identifié*\n\n`;
    } else {
        markdown += `| Nom | Complexité | Criticité | Stratégie | Effort |\n`;
        markdown += `|-----|------------|-----------|-----------|--------|\n`;
        for (const workflow of workflowsByPriority['P2']) {
            markdown += `| ${workflow.name} | ${workflow.complexity.level} | ${workflow.criticality.level} | ${workflow.migrationStrategy} | ${workflow.stats.estimatedMigrationEffort} j |\n`;
        }
        markdown += `\n`;
    }

    // Workflows P3
    markdown += `### Priorité P3 (Faible)\n\n`;
    if (workflowsByPriority['P3'].length === 0) {
        markdown += `*Aucun workflow P3 identifié*\n\n`;
    } else {
        markdown += `| Nom | Complexité | Criticité | Stratégie | Effort |\n`;
        markdown += `|-----|------------|-----------|-----------|--------|\n`;
        for (const workflow of workflowsByPriority['P3']) {
            markdown += `| ${workflow.name} | ${workflow.complexity.level} | ${workflow.criticality.level} | ${workflow.migrationStrategy} | ${workflow.stats.estimatedMigrationEffort} j |\n`;
        }
        markdown += `\n`;
    }

    markdown += `## Étapes suivantes\n\n`;
    markdown += `Selon le plan de migration n8n vers Temporal:\n\n`;
    markdown += `1. **Phase 1 (Mai 2025)**: Compléter l'audit et l'analyse des workflows n8n\n`;
    markdown += `2. **Phase 2 (Juin 2025)**: Classification et priorisation de la migration\n`;
    markdown += `3. **Phase 3 (Juillet 2025)**: Migrer les workflows non critiques\n`;
    markdown += `4. **Phase 4 (Août-Octobre 2025)**: Migration générale\n`;
    markdown += `5. **Phase 5 (Novembre 2025)**: Décommissionnement de n8n\n\n`;

    markdown += `Pour plus de détails, consultez le [Plan de migration n8n](/docs/n8n-migration-plan.md).\n`;

    return markdown;
}