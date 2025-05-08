#!/usr/bin/env node

/**
 * Script de suivi de migration n8n vers Temporal/BullMQ
 * 
 * Ce script analyse l'état actuel de la migration et génère un rapport de progression
 * basé sur le manifeste MCP et les données de workflows n8n.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const MANIFEST_PATH = path.resolve(__dirname, '../manifests/n8n-migration-workflow.json');
const OUTPUT_DIR = path.resolve(__dirname, '../reports');
const N8N_WORKFLOWS_FILE = process.env.N8N_WORKFLOWS_FILE || '';

// Vérifier si le fichier de workflows n8n existe
let workflowsData = [];
if (N8N_WORKFLOWS_FILE && fs.existsSync(N8N_WORKFLOWS_FILE)) {
    try {
        workflowsData = JSON.parse(fs.readFileSync(N8N_WORKFLOWS_FILE, 'utf8'));
        console.log(chalk.green(`✓ Chargé ${workflowsData.length} workflows depuis ${N8N_WORKFLOWS_FILE}`));
    } catch (error) {
        console.error(chalk.red(`✗ Erreur lors du chargement des workflows: ${error.message}`));
        process.exit(1);
    }
} else {
    console.log(chalk.yellow('⚠ Aucun fichier de workflows n8n spécifié. Utilisation du mode simulation.'));

    // Générer des données de test
    workflowsData = Array.from({ length: 30 }, (_, i) => ({
        id: `workflow-${i + 1}`,
        name: `Workflow Test ${i + 1}`,
        active: Math.random() > 0.3,
        nodes: Math.floor(Math.random() * 20) + 1,
        connections: Math.floor(Math.random() * 15),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
        complexity: ['simple', 'modéré', 'complexe'][Math.floor(Math.random() * 3)],
        criticality: ['faible', 'moyenne', 'haute'][Math.floor(Math.random() * 3)],
        status: ['non-migré', 'en cours', 'migré', 'validé'][Math.floor(Math.random() * 4)],
        targetSystem: Math.random() > 0.5 ? 'BullMQ' : 'Temporal'
    }));
}

// Charger le manifeste MCP
let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(chalk.green(`✓ Manifeste MCP chargé: ${manifest.name}`));
} catch (error) {
    console.error(chalk.red(`✗ Erreur lors du chargement du manifeste: ${error.message}`));
    process.exit(1);
}

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Analyser les données pour générer des statistiques
const stats = {
    total: workflowsData.length,
    byStatus: {
        'non-migré': workflowsData.filter(w => w.status === 'non-migré').length,
        'en cours': workflowsData.filter(w => w.status === 'en cours').length,
        'migré': workflowsData.filter(w => w.status === 'migré').length,
        'validé': workflowsData.filter(w => w.status === 'validé').length
    },
    byComplexity: {
        'simple': workflowsData.filter(w => w.complexity === 'simple').length,
        'modéré': workflowsData.filter(w => w.complexity === 'modéré').length,
        'complexe': workflowsData.filter(w => w.complexity === 'complexe').length
    },
    byCriticality: {
        'faible': workflowsData.filter(w => w.criticality === 'faible').length,
        'moyenne': workflowsData.filter(w => w.criticality === 'moyenne').length,
        'haute': workflowsData.filter(w => w.criticality === 'haute').length
    },
    byTarget: {
        'BullMQ': workflowsData.filter(w => w.targetSystem === 'BullMQ').length,
        'Temporal': workflowsData.filter(w => w.targetSystem === 'Temporal').length
    }
};

// Calcul du pourcentage de progression
const progressPercentage = ((stats.byStatus.migré + stats.byStatus.validé) / stats.total) * 100;

// Générer le rapport de progression
const currentDate = new Date().toISOString().split('T')[0];
const report = {
    title: `Rapport de Progression de Migration n8n - ${currentDate}`,
    date: currentDate,
    stats,
    progress: {
        percentage: progressPercentage.toFixed(2),
        nonMigrés: stats.byStatus['non-migré'],
        enCours: stats.byStatus['en cours'],
        migrés: stats.byStatus['migré'],
        validés: stats.byStatus['validé']
    },
    phases: manifest.phases.map(phase => ({
        name: phase.name,
        description: phase.description,
        status: determinePhaseStatus(phase.name, progressPercentage)
    })),
    priorités: {
        haute: workflowsData
            .filter(w => w.criticality === 'haute' && w.status === 'non-migré')
            .map(w => w.name),
        moyenne: workflowsData
            .filter(w => w.criticality === 'moyenne' && w.status === 'non-migré')
            .slice(0, 5)
            .map(w => w.name),
    }
};

// Fonction pour déterminer le statut de chaque phase
function determinePhaseStatus(phaseName, progress) {
    if (phaseName === 'audit' && progress >= 0) return 'en cours';
    if (phaseName === 'audit' && progress >= 30) return 'terminé';
    if (phaseName === 'prioritization' && progress >= 20) return 'en cours';
    if (phaseName === 'prioritization' && progress >= 40) return 'terminé';
    if (phaseName === 'migration' && progress >= 30) return 'en cours';
    if (phaseName === 'migration' && progress >= 80) return 'terminé';
    if (phaseName === 'validation' && progress >= 70) return 'en cours';
    if (phaseName === 'validation' && progress >= 95) return 'terminé';
    if (phaseName === 'decommissioning' && progress >= 90) return 'en cours';
    if (phaseName === 'decommissioning' && progress >= 100) return 'terminé';
    return 'non démarré';
}

// Générer le rapport au format Markdown
const markdownReport = `# ${report.title}

## 📊 État de la migration

- **Progression globale:** ${report.progress.percentage}%
- **Workflows non migrés:** ${report.progress.nonMigrés}
- **Workflows en cours de migration:** ${report.progress.enCours}
- **Workflows migrés:** ${report.progress.migrés}
- **Workflows validés:** ${report.progress.validés}
- **Total des workflows:** ${stats.total}

## 📋 Progression par phase

| Phase | Description | État |
|-------|-------------|------|
${report.phases.map(p => `| ${p.name} | ${p.description} | ${p.status} |`).join('\n')}

## 🔍 Statistiques détaillées

### Par complexité
- **Simple:** ${stats.byComplexity.simple} workflows
- **Modéré:** ${stats.byComplexity.modéré} workflows
- **Complexe:** ${stats.byComplexity.complexe} workflows

### Par criticité
- **Haute:** ${stats.byCriticality.haute} workflows
- **Moyenne:** ${stats.byCriticality.moyenne} workflows
- **Faible:** ${stats.byCriticality.faible} workflows

### Par système cible
- **BullMQ:** ${stats.byTarget.BullMQ} workflows
- **Temporal:** ${stats.byTarget.Temporal} workflows

## ⚠️ Workflows prioritaires à migrer

### Criticité haute
${report.priorités.haute.length > 0 ? report.priorités.haute.map(w => `- ${w}`).join('\n') : '- Aucun workflow prioritaire restant'}

### Criticité moyenne (top 5)
${report.priorités.moyenne.length > 0 ? report.priorités.moyenne.map(w => `- ${w}`).join('\n') : '- Aucun workflow prioritaire restant'}

## 📅 Prochaines étapes

1. ${report.phases.find(p => p.status === 'en cours')?.description || 'Finaliser la phase en cours'}
2. Mettre à jour le tableau de bord de migration
3. Planifier la prochaine itération de migration

---
*Rapport généré automatiquement le ${report.date}*
`;

// Écrire le rapport dans un fichier
const reportPath = path.join(OUTPUT_DIR, `migration-n8n-rapport-${currentDate}.md`);
fs.writeFileSync(reportPath, markdownReport);

console.log(chalk.green(`✓ Rapport de progression généré: ${reportPath}`));

// Générer également une version JSON pour d'éventuelles intégrations
const jsonReportPath = path.join(OUTPUT_DIR, `migration-n8n-rapport-${currentDate}.json`);
fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

console.log(chalk.green(`✓ Données JSON du rapport générées: ${jsonReportPath}`));
console.log(chalk.blue(`\nRésumé de la progression:`));
console.log(`- Progression: ${chalk.bold(report.progress.percentage + '%')}`);
console.log(`- Phase actuelle: ${chalk.bold(report.phases.find(p => p.status === 'en cours')?.name || 'Aucune')}`);
console.log(`- Workflows prioritaires restants: ${chalk.bold(report.priorités.haute.length)}`);
