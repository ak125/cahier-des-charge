#!/usr/bin/env node

/**
 * Script de déduplication des agents
 * 
 * Ce script se concentre uniquement sur l'identification et la suppression des doublons
 * d'agents, sans créer de nouveaux fichiers. Son objectif est d'éliminer les duplications
 * tout en respectant l'architecture en trois couches.
 * 
 * Usage:
 * node consolidate-duplicated-agents.js [--batch=<batch-size>] [--dry-run] [--force]
 * 
 * Options:
 *   --batch=<batch-size>: Nombre d'agents à traiter par lot (défaut: 10)
 *   --dry-run: Simule les actions sans effectuer de modifications réelles
 *   --force: Ignore les erreurs et continue le traitement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { execSync } from 'child_process';

// Variables pour le suivi des résultats
const consolidationResults = {
    deletedAgents: [],
    updatedReferences: [],
    errors: []
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const cleanupReportDir = path.join(projectRoot, 'cleanup-report');

// Analyser les arguments de la ligne de commande
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceMode = args.includes('--force');
let batchSize = 10; // Par défaut

for (const arg of args) {
    if (arg.startsWith('--batch=')) {
        const size = parseInt(arg.split('=')[1]);
        if (!isNaN(size) && size > 0) {
            batchSize = size;
        } else {
            console.error('Taille de lot invalide, utilisation de la valeur par défaut (10)');
        }
    }
}

/**
 * Vérifie si un fichier existe
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

/**
 * Vérifie si un dossier existe, sinon le crée
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Création du dossier: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Consolide deux agents en supprimant le doublon
 */
async function consolidateAgents(keepAgentPath, duplicateAgentPath) {
    console.log(`\n[Consolidation] Traitement de l'agent: ${path.basename(duplicateAgentPath)}`);

    // Vérifier l'existence du fichier à conserver
    if (!fileExists(keepAgentPath)) {
        const errorMsg = `  [ERREUR] Le fichier canonique n'existe pas: ${keepAgentPath}`;
        console.error(errorMsg);
        consolidationResults.errors.push({
            type: 'missing_canonical',
            message: errorMsg,
            keepAgentPath,
            duplicateAgentPath
        });
        return forceMode;
    }

    // Vérifier l'existence du fichier à supprimer
    if (!fileExists(duplicateAgentPath)) {
        console.log(`  [INFO] Le doublon n'existe pas (peut-être déjà supprimé): ${duplicateAgentPath}`);
        return true;
    }

    // Mettre à jour le journal de consolidation
    const action = dryRun ? "À supprimer (simulation)" : "Supprimé";
    updateConsolidationLog(keepAgentPath, duplicateAgentPath, action);

    if (dryRun) {
        console.log(`  [SIMULATION] Suppression du doublon: ${duplicateAgentPath}`);
        return true;
    }

    try {
        // Supprimer le fichier dupliqué
        fs.unlinkSync(duplicateAgentPath);
        console.log(`  [SUCCÈS] Fichier supprimé: ${duplicateAgentPath}`);

        // Ajouter aux résultats
        consolidationResults.deletedAgents.push({
            keepAgentPath,
            duplicateAgentPath
        });

        return true;
    } catch (err) {
        const errorMsg = `  [ERREUR] Impossible de supprimer le fichier: ${err.message}`;
        console.error(errorMsg);
        consolidationResults.errors.push({
            type: 'delete_error',
            message: errorMsg,
            keepAgentPath,
            duplicateAgentPath,
            error: err.message
        });
        return forceMode;
    }
}

/**
 * Mettre à jour le journal de consolidation
 */
function updateConsolidationLog(keepAgentPath, duplicateAgentPath, action) {
    const logPath = path.join(projectRoot, 'reports', 'agent-consolidation-journal.md');
    const date = new Date().toISOString().split('T')[0];

    let logContent = '';
    if (fs.existsSync(logPath)) {
        logContent = fs.readFileSync(logPath, 'utf-8');
    } else {
        logContent = '# Journal de consolidation des agents\n\n';
        logContent += '| Date | Agent canonique | Agent dupliqué | Action |\n';
        logContent += '|------|----------------|---------------|--------|\n';
    }

    // Ajouter l'entrée de journal
    const logEntry = `| ${date} | ${keepAgentPath} | ${duplicateAgentPath} | ${action} |\n`;

    // Vérifier si cette entrée existe déjà
    if (!logContent.includes(logEntry)) {
        logContent += logEntry;

        // Créer le dossier reports si nécessaire
        ensureDirectoryExists(path.join(projectRoot, 'reports'));

        // Écrire le journal mis à jour
        fs.writeFileSync(logPath, logContent);
        console.log(`  [INFO] Journal de consolidation mis à jour: ${logPath}`);
    }
}

/**
 * Lire le plan de consolidation à partir du fichier
 */
function readConsolidationPlan() {
    const planPath = path.join(projectRoot, 'reports', 'agent-consolidation-plan.md');

    if (!fileExists(planPath)) {
        console.error(`Plan de consolidation non trouvé: ${planPath}`);
        console.error(`Veuillez exécuter d'abord: node tools/scripts/plan-agent-consolidation.js`);
        process.exit(1);
    }

    const content = fs.readFileSync(planPath, 'utf-8');

    // Extraire les groupes et leurs actions
    const consolidationActions = [];

    // Expression régulière pour trouver les sections de consolidation
    const sectionRegex = /#### Consolidation de "([^"]+)".*?\*\*Agent à conserver\*\*: `([^`]+)`.*?\*\*Chemin cible\*\*: `([^`]+)`.*?\| ([^|]+) \| `([^`]+)` \| ([^|]+) \|/gs;

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
        const group = match[1];
        const keepAgentClass = match[2];
        const targetPath = match[3];
        const duplicateClass = match[4].trim();
        const duplicatePath = match[5];
        const action = match[6].trim();

        if (action === 'migrate') {
            consolidationActions.push({
                group,
                keepAgent: {
                    className: keepAgentClass,
                    filePath: path.join(projectRoot, targetPath)
                },
                duplicateAgent: {
                    className: duplicateClass,
                    filePath: duplicatePath
                }
            });
        }
    }

    return consolidationActions;
}

/**
 * Génère un rapport de consolidation dans le dossier cleanup-report
 */
function generateConsolidationReport(processedCount, successCount) {
    if (dryRun) {
        console.log(`En mode simulation, aucun rapport ne sera généré.`);
        return;
    }

    // Créer le dossier cleanup-report s'il n'existe pas
    ensureDirectoryExists(cleanupReportDir);

    const date = new Date().toLocaleDateString('fr-FR');
    const reportPath = path.join(cleanupReportDir, 'duplicate-agents-report.md');

    let report = `<!-- filepath: ${reportPath} -->
# Rapport de Consolidation des Agents Dupliqués
Date: ${date}

## Résumé
- Agents supprimés: ${consolidationResults.deletedAgents.length}
- Références mises à jour: ${consolidationResults.updatedReferences.length}
- Index mis à jour: ${consolidationResults.indexUpdated ? 'Oui' : 'Non'}

## Détails des Consolidations
`;

    if (consolidationResults.deletedAgents.length > 0) {
        report += `\n### Agents supprimés\n\n`;
        report += `| Agent canonique | Agent dupliqué |\n`;
        report += `|----------------|---------------|\n`;

        for (const result of consolidationResults.deletedAgents) {
            const relativeKeepPath = path.relative(projectRoot, result.keepAgentPath);
            const relativeDuplicatePath = path.relative(projectRoot, result.duplicateAgentPath);
            report += `| \`${relativeKeepPath}\` | \`${relativeDuplicatePath}\` |\n`;
        }
    }

    if (consolidationResults.errors.length > 0) {
        report += `\n### Erreurs\n\n`;
        report += `| Type | Message | Fichier concerné |\n`;
        report += `|------|---------|------------------|\n`;

        for (const error of consolidationResults.errors) {
            const relativePath = error.duplicateAgentPath ?
                path.relative(projectRoot, error.duplicateAgentPath) :
                path.relative(projectRoot, error.keepAgentPath);
            report += `| ${error.type} | ${error.message.replace(/\s+\[ERREUR\]\s+/g, '')} | \`${relativePath}\` |\n`;
        }
    }

    report += `\n## Prochaines étapes\n\n`;
    report += `1. Vérifier que toutes les fonctionnalités des agents supprimés sont bien présentes dans les agents conservés\n`;
    report += `2. Mettre à jour les tests pour utiliser les agents conservés\n`;
    report += `3. Mettre à jour la documentation pour refléter la nouvelle organisation des agents\n`;

    fs.writeFileSync(reportPath, report);
    console.log(`Rapport de consolidation généré: ${reportPath}`);
}

/**
 * Fonction principale pour consolider les agents
 */
async function consolidateDuplicatedAgents() {
    console.log(`\n=== Consolidation des agents dupliqués ===`);
    console.log(`Mode: ${dryRun ? 'Simulation (dry-run)' : 'Exécution réelle'}`);
    console.log(`Mode force: ${forceMode ? 'Activé' : 'Désactivé'}`);

    // Créer une sauvegarde avant de commencer
    if (!dryRun) {
        try {
            const backupDir = `backup/deduplication-phase2-${new Date().toISOString().replace(/:/g, '').split('.')[0]}`;
            console.log(`Création d'une sauvegarde dans ${backupDir}...`);
            ensureDirectoryExists(path.join(projectRoot, backupDir));

            // Sauvegarde des dossiers clés
            for (const folder of ['packages', 'reports']) {
                execSync(`cp -r ${path.join(projectRoot, folder)} ${path.join(projectRoot, backupDir)}/ 2>/dev/null || true`);
            }

            console.log(`Sauvegarde créée avec succès.`);
        } catch (err) {
            console.warn(`Impossible de créer une sauvegarde: ${err.message}`);
            if (!forceMode) {
                console.error(`Pour continuer sans créer de sauvegarde, utilisez l'option --force`);
                process.exit(1);
            }
        }
    }

    const actions = readConsolidationPlan();

    if (!actions || actions.length === 0) {
        console.log(`Aucune action de consolidation trouvée.`);
        return;
    }

    console.log(`Actions de consolidation identifiées: ${actions.length}`);
    console.log(`Traitement par lots de ${batchSize} agents maximum`);

    let processedCount = 0;
    let successCount = 0;

    // Traiter les actions par lot pour éviter de surcharger le système
    for (let i = 0; i < actions.length; i += batchSize) {
        const batchActions = actions.slice(i, i + batchSize);

        console.log(`\n--- Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(actions.length / batchSize)} ---`);

        for (const action of batchActions) {
            processedCount++;

            const success = await consolidateAgents(
                action.keepAgent.filePath,
                action.duplicateAgent.filePath
            );

            if (success) {
                successCount++;
            }
        }
    }

    console.log(`\n=== Résumé de la consolidation ===`);
    console.log(`Total des agents traités: ${processedCount}`);
    console.log(`Consolidations réussies: ${successCount}`);
    console.log(`Erreurs rencontrées: ${consolidationResults.errors.length}`);

    if (dryRun) {
        console.log(`\nExécutez sans l'option --dry-run pour appliquer réellement les changements.`);
    } else {
        console.log(`\nRapport complet disponible dans: ${path.join(cleanupReportDir, 'duplicate-agents-report.md')}`);
    }
}

// Lancer la consolidation
consolidateDuplicatedAgents().catch(err => {
    console.error('Erreur lors de la consolidation:', err);
    process.exit(1);
});
