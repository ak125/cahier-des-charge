#!/usr/bin/env node

/**
 * Script pour résoudre les problèmes de projets dupliqués dans la configuration NX
 * 
 * Ce script identifie et résout les problèmes de projets dupliqués qui empêchent NX
 * de fonctionner correctement, notamment ceux dans les dossiers de backup.
 * 
 * Usage: 
 *   node fix-nx-duplicates.js [--dry-run] [--verbose] [--fix-backup]
 * 
 * Options:
 *   --dry-run    Afficher les actions sans les exécuter
 *   --verbose    Afficher des informations détaillées pendant l'exécution
 *   --fix-backup Supprimer les project.json des dossiers de backup (attention!)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(ROOT_DIR, 'reports', `nx-duplicates-report-${new Date().toISOString().replace(/:/g, '-')}.md`);

// Options
const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
    fixBackup: process.argv.includes('--fix-backup')
};

// Créer le dossier reports s'il n'existe pas
if (!fs.existsSync(path.resolve(ROOT_DIR, 'reports'))) {
    fs.mkdirSync(path.resolve(ROOT_DIR, 'reports'), { recursive: true });
}

/**
 * Exécute une commande shell et retourne la sortie
 */
function execCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', cwd: ROOT_DIR });
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la commande: ${command}`);
        console.error(error.message);
        return error.stdout?.toString() || '';
    }
}

/**
 * Analyse la sortie de NX pour identifier les projets dupliqués
 */
function analyzeDuplicateProjects() {
    console.log('Analyse des projets dupliqués dans NX...');

    const output = execCommand('npx nx show projects');
    const duplicatesSection = output.split('\nThe following projects are defined in multiple locations:')[1];

    if (!duplicatesSection) {
        console.log('Aucun projet dupliqué détecté.');
        return { projectDuplicates: {} };
    }

    const projectDuplicates = {};
    const projectsSections = duplicatesSection.split(/- [^:]+:/g);

    for (let i = 1; i < projectsSections.length; i++) {
        const projectName = duplicatesSection.split(/- [^:]+:/g)[i - 1].split('- ').pop().trim();
        const locations = projectsSections[i].trim().split('\n').filter(Boolean).map(loc => loc.trim());
        projectDuplicates[projectName] = locations;
    }

    return { projectDuplicates };
}

/**
 * Supprime les fichiers project.json dans les dossiers de sauvegarde
 */
function removeBackupProjectFiles(duplicates) {
    console.log('Suppression des fichiers project.json dans les dossiers de sauvegarde...');

    const filesToRemove = [];
    const filesRemoved = [];
    const filesWithErrors = [];

    Object.entries(duplicates.projectDuplicates).forEach(([project, locations]) => {
        // Trier les emplacements pour garder ceux qui ne sont pas dans un dossier de sauvegarde
        const backupLocations = locations.filter(loc =>
            loc.includes('/backup/') ||
            loc.includes('/archives_old/'));

        backupLocations.forEach(loc => {
            const projectJsonPath = path.resolve(ROOT_DIR, loc, 'project.json');

            if (fs.existsSync(projectJsonPath)) {
                filesToRemove.push(projectJsonPath);

                if (!options.dryRun) {
                    try {
                        fs.unlinkSync(projectJsonPath);
                        filesRemoved.push(projectJsonPath);
                    } catch (error) {
                        filesWithErrors.push({ path: projectJsonPath, error: error.message });
                        if (options.verbose) {
                            console.error(`Erreur lors de la suppression de ${projectJsonPath}: ${error.message}`);
                        }
                    }
                }
            }
        });
    });

    return { filesToRemove, filesRemoved, filesWithErrors };
}

/**
 * Génère un rapport sur les actions effectuées
 */
function generateReport(duplicates, cleanupResults) {
    console.log(`Génération du rapport dans ${REPORT_PATH}...`);

    let report = '# Rapport de Résolution des Projets Dupliqués dans NX\n';
    report += `Date: ${new Date().toISOString()}\n\n`;

    // Résumé
    report += '## Résumé\n';
    report += `- Projets dupliqués détectés: ${Object.keys(duplicates.projectDuplicates).length}\n`;
    report += `- Fichiers project.json à supprimer: ${cleanupResults.filesToRemove.length}\n`;
    report += `- Fichiers project.json supprimés: ${cleanupResults.filesRemoved.length}\n`;
    report += `- Erreurs rencontrées: ${cleanupResults.filesWithErrors.length}\n\n`;

    // Détails des projets dupliqués
    report += '## Détails des Projets Dupliqués\n\n';
    Object.entries(duplicates.projectDuplicates).forEach(([project, locations]) => {
        report += `### ${project}\n`;
        locations.forEach(loc => {
            const isBackup = loc.includes('/backup/') || loc.includes('/archives_old/');
            report += `- ${isBackup ? '🗑️' : '✅'} \`${loc}\`\n`;
        });
        report += '\n';
    });

    // Actions effectuées
    report += '## Actions Effectuées\n\n';
    if (options.dryRun) {
        report += '**Mode simulation activé, aucun changement n\'a été effectué**\n\n';
    }

    if (cleanupResults.filesRemoved.length > 0) {
        report += '### Fichiers project.json supprimés\n\n';
        cleanupResults.filesRemoved.forEach(file => {
            report += `- \`${file.replace(ROOT_DIR, '')}\`\n`;
        });
        report += '\n';
    }

    if (cleanupResults.filesWithErrors.length > 0) {
        report += '### Erreurs rencontrées\n\n';
        cleanupResults.filesWithErrors.forEach(item => {
            report += `- \`${item.path.replace(ROOT_DIR, '')}\`: ${item.error}\n`;
        });
        report += '\n';
    }

    // Écrire le rapport
    if (!options.dryRun) {
        fs.writeFileSync(REPORT_PATH, report);
    } else {
        console.log('\n--- RAPPORT EN MODE SIMULATION ---');
        console.log(report);
        console.log('--- FIN DU RAPPORT ---');
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('🔍 Analyse et résolution des projets dupliqués dans NX');
    console.log('=====================================================');

    if (options.dryRun) {
        console.log('⚠️ Mode simulation activé: aucun changement ne sera effectué');
    }

    // 1. Analyser les projets dupliqués
    const duplicates = analyzeDuplicateProjects();

    console.log(`Projets dupliqués détectés: ${Object.keys(duplicates.projectDuplicates).length}`);

    // 2. Résoudre les doublons si demandé
    let cleanupResults = {
        filesToRemove: [],
        filesRemoved: [],
        filesWithErrors: []
    };

    if (options.fixBackup && Object.keys(duplicates.projectDuplicates).length > 0) {
        cleanupResults = removeBackupProjectFiles(duplicates);
        console.log(`Fichiers project.json à supprimer: ${cleanupResults.filesToRemove.length}`);
        console.log(`Fichiers project.json supprimés: ${cleanupResults.filesRemoved.length}`);
        console.log(`Erreurs rencontrées: ${cleanupResults.filesWithErrors.length}`);
    } else if (!options.fixBackup && Object.keys(duplicates.projectDuplicates).length > 0) {
        console.log('Utilisez --fix-backup pour supprimer les fichiers project.json dans les dossiers de sauvegarde');
    }

    // 3. Générer un rapport
    generateReport(duplicates, cleanupResults);

    // Proposer des actions supplémentaires
    if (!options.dryRun && cleanupResults.filesRemoved.length > 0) {
        console.log('\nActions suggérées:');
        console.log('1. Vérifiez les dossiers de sauvegarde si vous avez besoin de restaurer des fichiers');
        console.log('2. Exécutez à nouveau les commandes NX pour vérifier si le problème est résolu');
        console.log(`3. Consultez le rapport détaillé: ${REPORT_PATH}`);
        console.log('4. Pour les autres problèmes de duplication (code, fonctionnalités), utilisez les scripts de consolidation existants');
    }

    console.log('\n✅ Opération terminée');
}

// Exécuter le script
main().catch(error => {
    console.error('Une erreur est survenue:', error);
    process.exit(1);
});
