#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers dupliqués après migration
 * Ce script supprime les fichiers d'origine qui ont été migrés avec succès
 * pour éviter la duplication de code.
 * 
 * Usage:
 * node cleanup-migrated-files.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Simule la suppression sans effectuer de modifications réelles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Analyser les arguments de la ligne de commande
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

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
 * Supprime un fichier s'il existe
 */
function removeFile(filePath) {
    if (!fileExists(filePath)) {
        console.log(`  [INFO] Le fichier n'existe pas: ${filePath}`);
        return false;
    }

    try {
        if (dryRun) {
            console.log(`  [SIMULATION] Suppression de: ${filePath}`);
            return true;
        } else {
            fs.unlinkSync(filePath);
            console.log(`  [SUPPRIMÉ] Fichier: ${filePath}`);
            return true;
        }
    } catch (err) {
        console.error(`  [ERREUR] Impossible de supprimer: ${filePath} - ${err.message}`);
        return false;
    }
}

/**
 * Lire le journal de migration pour identifier les fichiers à supprimer
 */
function getMigratedFiles() {
    const logPath = path.join(projectRoot, 'reports', 'migration-journal.md');
    if (!fileExists(logPath)) {
        console.error(`Journal de migration non trouvé: ${logPath}`);
        return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');

    // Ignorer les premières lignes (en-têtes)
    const dataLines = lines.slice(4);

    const files = [];
    for (const line of dataLines) {
        if (!line.trim()) continue;

        // Format: | Date | Agent | Couche | Source | Destination | Statut |
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 5) {
            const sourcePath = parts[3];
            files.push(sourcePath);
        }
    }

    return files;
}

/**
 * Fonction principale pour nettoyer les fichiers migrés
 */
async function cleanupMigratedFiles() {
    console.log(`\n=== Nettoyage des fichiers dupliqués après migration ===`);
    console.log(`Mode: ${dryRun ? 'Simulation (dry-run)' : 'Exécution réelle'}`);

    const filesToRemove = getMigratedFiles();

    if (filesToRemove.length === 0) {
        console.log('\nAucun fichier à nettoyer dans le journal de migration.');
        return;
    }

    console.log(`\nFichiers à nettoyer: ${filesToRemove.length}`);

    // Créer le rapport de nettoyage
    let cleanupReport = `# Rapport de nettoyage des fichiers dupliqués\n\n`;
    cleanupReport += `*Généré le ${new Date().toISOString()}*\n\n`;
    cleanupReport += `| Fichier source | Statut |\n`;
    cleanupReport += `|--------------|--------|\n`;

    let successCount = 0;

    for (const filePath of filesToRemove) {
        console.log(`\nTraitement du fichier: ${filePath}`);

        const success = removeFile(filePath);

        if (success) {
            successCount++;
            cleanupReport += `| ${filePath} | ${dryRun ? 'Simulation suppression' : 'Supprimé'} |\n`;
        } else {
            cleanupReport += `| ${filePath} | Échec de suppression |\n`;
        }
    }

    console.log(`\n=== Résumé du nettoyage ===`);
    console.log(`Total des fichiers traités: ${filesToRemove.length}`);
    console.log(`Fichiers ${dryRun ? 'qui seraient supprimés' : 'supprimés'}: ${successCount}`);

    // Sauvegarder le rapport
    if (!dryRun) {
        const reportPath = path.join(projectRoot, 'reports', 'cleanup-duplicated-files-report.md');
        fs.writeFileSync(reportPath, cleanupReport);
        console.log(`\nRapport de nettoyage sauvegardé: ${reportPath}`);
    } else {
        console.log('\nExécutez sans --dry-run pour appliquer les suppressions et générer le rapport.');
    }
}

// Exécuter la fonction principale
cleanupMigratedFiles().catch(err => {
    console.error('Erreur lors du nettoyage des fichiers:', err);
    process.exit(1);
});
