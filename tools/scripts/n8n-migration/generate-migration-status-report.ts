/**
 * Script de génération d'un rapport d'état de la migration
 * 
 * Ce script analyse les fichiers de classification et de tableau de bord
 * pour générer un rapport complet sur l'état actuel de la migration.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { table } from 'table';

// Configurer les arguments de ligne de commande
program
    .option('-c, --classification <path>', 'Chemin vers le fichier de classification', './migrations/n8n-classification.json')
    .option('-d, --dashboard <path>', 'Chemin vers le fichier du tableau de bord', './migrations/n8n-migration-dashboard-data.json')
    .option('-o, --output <path>', 'Chemin du rapport de sortie', './docs/n8n-migration-status-report.md')
    .option('-f, --format <format>', 'Format de sortie (markdown, json)', 'markdown')
    .parse(process.argv);

const options = program.opts();

// Chemins des fichiers
const classificationPath = path.resolve(process.cwd(), options.classification);
const dashboardPath = path.resolve(process.cwd(), options.dashboard);
const outputPath = path.resolve(process.cwd(), options.output);
const format = options.format;

/**
 * Génère un rapport de l'état de la migration au format Markdown
 */
async function generateMarkdownReport(classification: any[], dashboard: any | null): Promise<string> {
    // En-tête du rapport
    let report = `# Rapport d'état de la migration n8n
    
> Généré le ${new Date().toLocaleDateString('fr-FR')}

## Vue d'ensemble

`;

    // Statistiques générales
    const totalWorkflows = classification.length;
    const pendingWorkflows = classification.filter(w => !w.migrationStatus || w.migrationStatus === 'pending').length;
    const inProgressWorkflows = classification.filter(w => w.migrationStatus === 'in-progress').length;
    const completedWorkflows = classification.filter(w => w.migrationStatus === 'completed').length;
    const skippedWorkflows = classification.filter(w => w.migrationStatus === 'skipped').length;

    const progressPercentage = ((completedWorkflows + skippedWorkflows) / totalWorkflows * 100).toFixed(1);

    report += `- **Total des workflows**: ${totalWorkflows}
- **Workflows en attente**: ${pendingWorkflows}
- **Workflows en cours de migration**: ${inProgressWorkflows}
- **Workflows migrés**: ${completedWorkflows}
- **Workflows ignorés**: ${skippedWorkflows}
- **Progression globale**: ${progressPercentage}%

`;

    // Workflows prioritaires non migrés
    const criticalPendingWorkflows = classification.filter(w =>
        (!w.migrationStatus || w.migrationStatus === 'pending') &&
        w.priority === 'P1'
    );

    report += `## Workflows critiques en attente de migration

Ces workflows ont la priorité P1 et doivent être migrés en priorité:

| Nom | Complexité | Criticité | Stratégie cible | Effort estimé |
|-----|------------|-----------|-----------------|---------------|
`;

    criticalPendingWorkflows.forEach(w => {
        report += `| ${w.name} | ${w.complexity} | ${w.criticality} | ${w.targetStrategy} | ${w.estimatedMigrationEffort} |\n`;
    });

    if (criticalPendingWorkflows.length === 0) {
        report += "Aucun workflow critique en attente de migration.\n";
    }

    report += `\n## Répartition par stratégie cible

`;

    const temporalCount = classification.filter(w => w.targetStrategy === 'temporal').length;
    const bullmqCount = classification.filter(w => w.targetStrategy === 'bullmq').length;
    const apiCount = classification.filter(w => w.targetStrategy === 'api').length;
    const suppressionCount = classification.filter(w => w.targetStrategy === 'suppression').length;

    report += `- **Temporal.io**: ${temporalCount} workflows
- **BullMQ**: ${bullmqCount} workflows  
- **API directe**: ${apiCount} workflows
- **À supprimer**: ${suppressionCount} workflows

`;

    // Workflows récemment migrés
    const recentlyMigratedWorkflows = classification
        .filter(w => w.migrationStatus === 'completed')
        .sort((a, b) => new Date(b.migrationDate || '').getTime() - new Date(a.migrationDate || '').getTime())
        .slice(0, 5);

    report += `## Workflows récemment migrés

| Nom | Date de migration | Migré vers | Responsable |
|-----|-------------------|------------|-------------|
`;

    recentlyMigratedWorkflows.forEach(w => {
        report += `| ${w.name} | ${w.migrationDate || 'N/A'} | ${w.migratedTo || 'N/A'} | ${w.migratedBy || 'N/A'} |\n`;
    });

    if (recentlyMigratedWorkflows.length === 0) {
        report += "Aucun workflow migré récemment.\n";
    }

    // Workflows prochains à migrer (P2 non assignés)
    const nextUpWorkflows = classification
        .filter(w => (!w.migrationStatus || w.migrationStatus === 'pending') && w.priority === 'P2')
        .slice(0, 10);

    report += `\n## Prochains workflows à migrer

| Nom | Complexité | Criticité | Stratégie cible | Effort estimé |
|-----|------------|-----------|-----------------|---------------|
`;

    nextUpWorkflows.forEach(w => {
        report += `| ${w.name} | ${w.complexity} | ${w.criticality} | ${w.targetStrategy} | ${w.estimatedMigrationEffort} |\n`;
    });

    if (nextUpWorkflows.length === 0) {
        report += "Tous les workflows de priorité P2 ont été migrés ou sont en cours de migration.\n";
    }

    report += `\n## Recommandations

1. ${criticalPendingWorkflows.length > 0
            ? `Concentrez-vous d'abord sur les ${criticalPendingWorkflows.length} workflows critiques en attente`
            : 'Tous les workflows critiques sont pris en charge, continuez avec les workflows de priorité P2'}
2. Planifiez la migration des workflows de type "${pendingWorkflows > 0
            ? classification.filter(w => !w.migrationStatus || w.migrationStatus === 'pending')
                .reduce((acc: Record<string, number>, w) => {
                    acc[w.targetStrategy] = (acc[w.targetStrategy] || 0) + 1;
                    return acc;
                }, {})
            : {}
        }" en lot pour gagner du temps
3. Validez les workflows déjà migrés en environnement de production
`;

    return report;
}

/**
 * Génère un rapport au format JSON
 */
async function generateJsonReport(classification: any[], dashboard: any | null): Promise<any> {
    const report = {
        generatedAt: new Date().toISOString(),
        overview: {
            totalWorkflows: classification.length,
            pendingWorkflows: classification.filter(w => !w.migrationStatus || w.migrationStatus === 'pending').length,
            inProgressWorkflows: classification.filter(w => w.migrationStatus === 'in-progress').length,
            completedWorkflows: classification.filter(w => w.migrationStatus === 'completed').length,
            skippedWorkflows: classification.filter(w => w.migrationStatus === 'skipped').length,
            progressPercentage: ((classification.filter(w =>
                w.migrationStatus === 'completed' || w.migrationStatus === 'skipped'
            ).length / classification.length) * 100).toFixed(1)
        },
        criticalPendingWorkflows: classification
            .filter(w => (!w.migrationStatus || w.migrationStatus === 'pending') && w.priority === 'P1')
            .map(w => ({
                id: w.id,
                name: w.name,
                complexity: w.complexity,
                criticality: w.criticality,
                targetStrategy: w.targetStrategy,
                estimatedMigrationEffort: w.estimatedMigrationEffort
            })),
        targetStrategyDistribution: {
            temporal: classification.filter(w => w.targetStrategy === 'temporal').length,
            bullmq: classification.filter(w => w.targetStrategy === 'bullmq').length,
            api: classification.filter(w => w.targetStrategy === 'api').length,
            suppression: classification.filter(w => w.targetStrategy === 'suppression').length
        },
        recentlyMigratedWorkflows: classification
            .filter(w => w.migrationStatus === 'completed')
            .sort((a, b) => new Date(b.migrationDate || '').getTime() - new Date(a.migrationDate || '').getTime())
            .slice(0, 5)
            .map(w => ({
                id: w.id,
                name: w.name,
                migrationDate: w.migrationDate,
                migratedTo: w.migratedTo,
                migratedBy: w.migratedBy
            })),
        nextUpWorkflows: classification
            .filter(w => (!w.migrationStatus || w.migrationStatus === 'pending') && w.priority === 'P2')
            .slice(0, 10)
            .map(w => ({
                id: w.id,
                name: w.name,
                complexity: w.complexity,
                criticality: w.criticality,
                targetStrategy: w.targetStrategy,
                estimatedMigrationEffort: w.estimatedMigrationEffort
            }))
    };

    return report;
}

/**
 * Génère un rapport d'état de la migration
 */
async function generateMigrationStatusReport(): Promise<void> {
    try {
        console.log(chalk.blue('📊 Génération d\'un rapport d\'état de la migration...'));

        // Vérifier que le fichier de classification existe
        if (!fs.existsSync(classificationPath)) {
            throw new Error(`Le fichier de classification n'existe pas: ${classificationPath}`);
        }

        // Charger les données de classification
        const classification = await fs.readJson(classificationPath);

        // Tenter de charger les données du tableau de bord si elles existent
        let dashboard = null;
        if (fs.existsSync(dashboardPath)) {
            dashboard = await fs.readJson(dashboardPath);
        }

        // Générer le rapport selon le format demandé
        let reportContent;
        if (format === 'markdown') {
            reportContent = await generateMarkdownReport(classification, dashboard);
        } else if (format === 'json') {
            reportContent = await generateJsonReport(classification, dashboard);
            reportContent = JSON.stringify(reportContent, null, 2);
        } else {
            throw new Error(`Format non supporté: ${format}. Utilisez 'markdown' ou 'json'.`);
        }

        // Créer le répertoire parent si nécessaire
        await fs.ensureDir(path.dirname(outputPath));

        // Écrire le rapport
        await fs.writeFile(outputPath, reportContent);

        console.log(chalk.green(`✅ Rapport d'état de la migration généré avec succès: ${outputPath}`));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors de la génération du rapport d\'état :'), error.message);
        process.exit(1);
    }
}

// Exécuter le script
generateMigrationStatusReport()
    .then(() => {
        console.log(chalk.green('✅ Génération du rapport terminée.'));
    })
    .catch((error) => {
        console.error(chalk.red('❌ Erreur lors de l\'exécution du script :'), error);
        process.exit(1);
    });