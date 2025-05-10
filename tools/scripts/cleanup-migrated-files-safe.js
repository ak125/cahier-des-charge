#!/usr/bin/env node

/**
 * Script de nettoyage des anciens fichiers migrés
 * 
 * Ce script identifie les fichiers migrés qui pourraient être supprimés 
 * en toute sécurité après la consolidation vers l'architecture à trois couches.
 * Il procède avec prudence et ne supprime aucun fichier sans confirmation explicite.
 * 
 * Usage:
 *   node cleanup-migrated-files.js [--list-only] [--dry-run] [--interactive] [--batch=<size>]
 * 
 * Options:
 *   --list-only    Liste uniquement les fichiers candidats sans les supprimer
 *   --dry-run      Simule la suppression sans l'effectuer réellement
 *   --interactive  Demande confirmation pour chaque fichier
 *   --batch=<size> Nombre de fichiers à traiter par lot (défaut: 10)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Analyse des arguments de la ligne de commande
const args = process.argv.slice(2);
const listOnly = args.includes('--list-only');
const dryRun = args.includes('--dry-run') || listOnly;
const interactive = args.includes('--interactive');
let batchSize = 10;

for (const arg of args) {
    if (arg.startsWith('--batch=')) {
        const size = parseInt(arg.split('=')[1]);
        if (!isNaN(size) && size > 0) {
            batchSize = size;
        }
    }
}

// Configuration
const MIGRATED_AGENTS_DIR = path.join(projectRoot, 'packages/migrated-agents');
const REPORT_PATH = path.join(projectRoot, 'cleanup-report', 'safe-cleanup-candidates.md');
const BACKUP_DIR = path.join(projectRoot, 'backup', `migrated-files-backup-${new Date().toISOString().replace(/:/g, '').split('.')[0]}`);

// Dossiers qui contiennent des fichiers consolidés
const CONSOLIDATED_DIRS = [
    path.join(projectRoot, 'packages/orchestration'),
    path.join(projectRoot, 'packages/coordination'),
    path.join(projectRoot, 'packages/business'),
];

// Compteurs pour le rapport
const stats = {
    totalFiles: 0,
    safeToDelete: 0,
    potentiallyUnsafe: 0,
    keepFiles: 0,
    processedFiles: 0,
    deletedFiles: 0,
    errors: 0
};

/**
 * Crée un lecteur interactif pour les entrées utilisateur
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
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
 * Crée un répertoire s'il n'existe pas
 */
function ensureDirExists(dirPath) {
    if (!fileExists(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
    }
    return false;
}

/**
 * Crée une sauvegarde des fichiers avant de les supprimer
 */
function backupFile(filePath) {
    try {
        const relativePath = path.relative(projectRoot, filePath);
        const backupPath = path.join(BACKUP_DIR, relativePath);

        // Créer le répertoire de sauvegarde
        ensureDirExists(path.dirname(backupPath));

        // Copier le fichier
        fs.copyFileSync(filePath, backupPath);
        return true;
    } catch (error) {
        console.error(`⚠️ Erreur lors de la sauvegarde de ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Recherche des références à un fichier dans le reste du projet
 */
async function findReferences(filePath) {
    try {
        const fileName = path.basename(filePath);
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

        // Recherche de références dans le code (imports, requires)
        const grepCommand = `grep -r --include="*.ts" --include="*.js" -l "${fileNameWithoutExt}" ${projectRoot} | grep -v "node_modules" | grep -v "${filePath}" | grep -v "backup/" || true`;
        const result = execSync(grepCommand, { encoding: 'utf8' });

        return result.trim().split('\n').filter(Boolean);
    } catch (error) {
        console.error(`⚠️ Erreur lors de la recherche de références pour ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Vérifie si un fichier migré a une version consolidée
 */
async function hasConsolidatedVersion(filePath) {
    const fileName = path.basename(filePath);
    const fileNameBase = fileName.replace(/(-[a-f0-9]{8}(-[a-f0-9]{8})?)?\.ts$/, '');

    // Chercher dans les dossiers consolidés
    for (const dir of CONSOLIDATED_DIRS) {
        // Recherche récursive pour trouver des fichiers avec un nom similaire
        const command = `find ${dir} -type f -name "${fileNameBase}.ts" -o -name "${fileNameBase}-*.ts" | head -n 1 || true`;
        const result = execSync(command, { encoding: 'utf8' });

        if (result.trim()) {
            return result.trim();
        }
    }

    return null;
}

/**
 * Analyse un fichier migré pour déterminer s'il peut être supprimé en toute sécurité
 */
async function analyzeMigratedFile(filePath) {
    stats.totalFiles++;

    // Vérifier si le fichier a été consolidé
    const consolidatedVersion = await hasConsolidatedVersion(filePath);

    // Chercher des références à ce fichier
    const references = await findReferences(filePath);

    return {
        path: filePath,
        relativePath: path.relative(projectRoot, filePath),
        consolidatedVersion: consolidatedVersion ? path.relative(projectRoot, consolidatedVersion) : null,
        hasConsolidatedVersion: !!consolidatedVersion,
        references,
        hasReferences: references.length > 0,
        isSafeToDelete: !!consolidatedVersion && references.length === 0
    };
}

/**
 * Supprimer un fichier migré
 */
async function deleteFile(filePath, interactive = false) {
    // Si en mode interactif, demander confirmation
    if (interactive) {
        const rl = createReadlineInterface();

        return new Promise((resolve) => {
            rl.question(`❓ Supprimer ${path.relative(projectRoot, filePath)} ? (O/n) `, (answer) => {
                rl.close();
                if (answer.toLowerCase() !== 'n') {
                    if (dryRun) {
                        console.log(`🔍 [SIMULATION] Suppression de ${path.relative(projectRoot, filePath)}`);
                        resolve(true);
                    } else {
                        try {
                            // Sauvegarder avant de supprimer
                            backupFile(filePath);
                            fs.unlinkSync(filePath);
                            console.log(`✅ Fichier supprimé: ${path.relative(projectRoot, filePath)}`);
                            resolve(true);
                        } catch (error) {
                            console.error(`⚠️ Erreur lors de la suppression de ${filePath}: ${error.message}`);
                            resolve(false);
                        }
                    }
                } else {
                    console.log(`⏭️ Conservation du fichier: ${path.relative(projectRoot, filePath)}`);
                    stats.keepFiles++;
                    resolve(false);
                }
            });
        });
    } else {
        // Mode non interactif
        if (dryRun) {
            console.log(`🔍 [SIMULATION] Suppression de ${path.relative(projectRoot, filePath)}`);
            return true;
        } else {
            try {
                // Sauvegarder avant de supprimer
                backupFile(filePath);
                fs.unlinkSync(filePath);
                console.log(`✅ Fichier supprimé: ${path.relative(projectRoot, filePath)}`);
                return true;
            } catch (error) {
                console.error(`⚠️ Erreur lors de la suppression de ${filePath}: ${error.message}`);
                stats.errors++;
                return false;
            }
        }
    }
}

/**
 * Trouve tous les fichiers dans le répertoire des agents migrés
 */
function findAllMigratedFiles() {
    try {
        const command = `find ${MIGRATED_AGENTS_DIR} -type f -name "*.ts" | sort`;
        const result = execSync(command, { encoding: 'utf8' });
        return result.trim().split('\n').filter(Boolean);
    } catch (error) {
        console.error(`⚠️ Erreur lors de la recherche des fichiers migrés: ${error.message}`);
        return [];
    }
}

/**
 * Génère un rapport des fichiers analysés
 */
function generateReport(results) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let report = `<!-- filepath: ${REPORT_PATH} -->\n`;
    report += `# Rapport des candidats pour nettoyage sécurisé\n\n`;
    report += `*Généré le ${timestamp}*\n\n`;

    report += `## Résumé\n\n`;
    report += `- **Total des fichiers migrés analysés**: ${stats.totalFiles}\n`;
    report += `- **Sûrs à supprimer**: ${stats.safeToDelete}\n`;
    report += `- **Potentiellement non sûrs**: ${stats.potentiallyUnsafe}\n`;

    if (stats.deletedFiles > 0) {
        report += `- **Fichiers supprimés**: ${stats.deletedFiles}\n`;
    }
    if (stats.keepFiles > 0) {
        report += `- **Fichiers conservés**: ${stats.keepFiles}\n`;
    }
    if (stats.errors > 0) {
        report += `- **Erreurs rencontrées**: ${stats.errors}\n`;
    }

    report += `\n## Fichiers sûrs à supprimer\n\n`;

    const safeFiles = results.filter(r => r.isSafeToDelete);

    if (safeFiles.length > 0) {
        report += `| Fichier | Version consolidée |\n`;
        report += `|---------|-------------------|\n`;

        for (const file of safeFiles) {
            report += `| \`${file.relativePath}\` | \`${file.consolidatedVersion}\` |\n`;
        }
    } else {
        report += `*Aucun fichier sûr à supprimer trouvé.*\n`;
    }

    report += `\n## Fichiers à vérifier manuellement\n\n`;

    const unsafeFiles = results.filter(r => !r.isSafeToDelete);

    if (unsafeFiles.length > 0) {
        report += `| Fichier | Version consolidée | Références |\n`;
        report += `|---------|-------------------|------------|\n`;

        for (const file of unsafeFiles) {
            const consolidatedInfo = file.hasConsolidatedVersion
                ? `\`${file.consolidatedVersion}\``
                : "❌ Non trouvée";

            const referencesCount = file.references.length;
            const referencesInfo = referencesCount > 0
                ? `${referencesCount} référence(s)`
                : "Aucune référence";

            report += `| \`${file.relativePath}\` | ${consolidatedInfo} | ${referencesInfo} |\n`;
        }
    } else {
        report += `*Aucun fichier nécessitant une vérification manuelle.*\n`;
    }

    if (file.references.length > 0) {
        report += `\n### Détails des références\n\n`;

        for (const file of unsafeFiles.filter(f => f.references.length > 0)) {
            report += `#### \`${file.relativePath}\`\n\n`;
            report += `Références trouvées dans:\n\n`;

            for (const reference of file.references) {
                report += `- \`${path.relative(projectRoot, reference)}\`\n`;
            }

            report += `\n`;
        }
    }

    report += `\n## Comment procéder\n\n`;

    if (safeFiles.length > 0) {
        report += `Pour supprimer les fichiers sûrs, exécutez:\n\n`;
        report += `\`\`\`bash\n`;
        report += `node tools/scripts/cleanup-migrated-files.js --batch=${Math.min(10, safeFiles.length)}\n`;
        report += `\`\`\`\n\n`;
        report += `Pour une suppression interactive (recommandé):\n\n`;
        report += `\`\`\`bash\n`;
        report += `node tools/scripts/cleanup-migrated-files.js --interactive\n`;
        report += `\`\`\`\n\n`;
    }

    report += `Pour simuler la suppression sans effectuer de modifications:\n\n`;
    report += `\`\`\`bash\n`;
    report += `node tools/scripts/cleanup-migrated-files.js --dry-run\n`;
    report += `\`\`\`\n\n`;

    report += `Les fichiers qui ont encore des références nécessitent une analyse manuelle pour mettre à jour ces références vers les versions consolidées avant suppression.\n`;

    return report;
}

/**
 * Fonction principale
 */
async function main() {
    console.log(`\n=== Nettoyage prudent des fichiers migrés ===`);
    console.log(`Mode: ${dryRun ? 'Liste/Simulation' : 'Suppression réelle'}`);

    // Vérifier si le répertoire des agents migrés existe
    if (!fileExists(MIGRATED_AGENTS_DIR)) {
        console.error(`⚠️ Le répertoire des agents migrés n'existe pas: ${MIGRATED_AGENTS_DIR}`);
        process.exit(1);
    }

    // Créer le répertoire de sauvegarde si nous allons supprimer des fichiers
    if (!dryRun) {
        console.log(`📦 Création d'une sauvegarde dans ${BACKUP_DIR}...`);
        ensureDirExists(BACKUP_DIR);
    }

    // Trouver tous les fichiers migrés
    console.log(`🔍 Recherche des fichiers migrés...`);
    const migratedFiles = findAllMigratedFiles();
    console.log(`📊 ${migratedFiles.length} fichiers migrés trouvés.`);

    if (migratedFiles.length === 0) {
        console.log(`⚠️ Aucun fichier migré à analyser.`);
        return;
    }

    // Analyser chaque fichier migré
    console.log(`\n🔍 Analyse des fichiers migrés...`);

    const results = [];
    for (let i = 0; i < migratedFiles.length; i++) {
        const filePath = migratedFiles[i];
        process.stdout.write(`\r📊 Analyse des fichiers... ${i + 1}/${migratedFiles.length}`);

        const analysis = await analyzeMigratedFile(filePath);
        results.push(analysis);

        if (analysis.isSafeToDelete) {
            stats.safeToDelete++;
        } else {
            stats.potentiallyUnsafe++;
        }
    }
    console.log(`\n✅ Analyse terminée.`);

    // Générer et sauvegarder le rapport
    const report = generateReport(results);
    ensureDirExists(path.dirname(REPORT_PATH));
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`📄 Rapport généré: ${REPORT_PATH}`);

    // Si mode liste uniquement, s'arrêter ici
    if (listOnly) {
        console.log(`\n📋 Liste des fichiers établie. Exécutez avec des options spécifiques pour procéder à la suppression.`);
        return;
    }

    // Supprimer les fichiers sûrs
    const safeFiles = results.filter(r => r.isSafeToDelete);

    if (safeFiles.length === 0) {
        console.log(`\n⚠️ Aucun fichier sûr à supprimer n'a été identifié.`);
        return;
    }

    console.log(`\n🗑️ Suppression des fichiers sûrs...`);
    console.log(`📊 ${safeFiles.length} fichiers à traiter`);

    if (interactive) {
        console.log(`\n⚠️ Mode interactif activé. Confirmation requise pour chaque fichier.`);

        for (const file of safeFiles) {
            stats.processedFiles++;
            const deleted = await deleteFile(file.path, true);
            if (deleted) stats.deletedFiles++;
        }
    } else {
        console.log(`\n⚠️ Mode par lot activé. Traitement par lots de ${batchSize} fichiers.`);

        // Traiter par lots
        for (let i = 0; i < safeFiles.length; i += batchSize) {
            const batch = safeFiles.slice(i, i + batchSize);
            console.log(`\n--- Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(safeFiles.length / batchSize)} ---`);

            for (const file of batch) {
                stats.processedFiles++;
                const deleted = await deleteFile(file.path, false);
                if (deleted) stats.deletedFiles++;
            }

            if (i + batchSize < safeFiles.length && !dryRun) {
                console.log(`\n⏸️ Pause pour vérification...`);
                const rl = createReadlineInterface();

                await new Promise((resolve) => {
                    rl.question(`Continuer avec le prochain lot ? (O/n) `, (answer) => {
                        rl.close();
                        if (answer.toLowerCase() === 'n') {
                            console.log(`\n⏹️ Opération interrompue par l'utilisateur.`);
                            process.exit(0);
                        }
                        resolve();
                    });
                });
            }
        }
    }

    console.log(`\n=== Résumé du nettoyage ===`);
    console.log(`📊 Total des fichiers migrés: ${stats.totalFiles}`);
    console.log(`✅ Fichiers sûrs identifiés: ${stats.safeToDelete}`);
    console.log(`⚠️ Fichiers potentiellement non sûrs: ${stats.potentiallyUnsafe}`);
    console.log(`🗑️ Fichiers supprimés: ${stats.deletedFiles}`);

    if (stats.keepFiles > 0) {
        console.log(`📌 Fichiers conservés: ${stats.keepFiles}`);
    }

    if (stats.errors > 0) {
        console.log(`❌ Erreurs rencontrées: ${stats.errors}`);
    }

    if (dryRun) {
        console.log(`\n📝 Exécution en mode simulation. Aucun fichier n'a été réellement supprimé.`);
        console.log(`   Pour supprimer réellement les fichiers, exécutez sans l'option --dry-run.`);
    } else {
        console.log(`\n📦 Une sauvegarde des fichiers supprimés a été créée dans: ${BACKUP_DIR}`);
    }
}

// Exécuter le script
main().catch(error => {
    console.error(`❌ Erreur lors de l'exécution du script: ${error.message}`);
    process.exit(1);
});
