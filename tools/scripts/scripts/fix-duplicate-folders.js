#!/usr/bin/env node

/**
 * Script pour résoudre les problèmes de dossiers dupliqués avec des conventions de nommage différentes
 * Ce script identifie les paires de dossiers (PascalCase et kebab-case) qui existent simultanément
 * et fusionne leur contenu de manière sécurisée
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour convertir PascalCase en kebab-case
function pascalToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Fonction pour vérifier si un dossier est en PascalCase
function isPascalCase(name) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

// Fonction pour copier récursivement des fichiers d'un dossier à un autre
function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            // Si le fichier existe déjà dans la destination, créer une sauvegarde
            if (fs.existsSync(destPath)) {
                const backupPath = destPath + '.backup.' + Date.now();
                console.log(`Le fichier existe déjà: ${destPath} - création d'une sauvegarde: ${backupPath}`);
                fs.copyFileSync(destPath, backupPath);
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Fonction principale pour trouver et fusionner les dossiers dupliqués
function findAndMergeDuplicateFolders(baseDir) {
    let processed = 0;
    let errors = [];

    // Fonction récursive pour analyser les dossiers
    function processDirectory(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

            // Recherche des dossiers en PascalCase
            const pascalCaseDirs = directories.filter(isPascalCase);

            for (const pascalDir of pascalCaseDirs) {
                const kebabDir = pascalToKebab(pascalDir);

                // Vérifier si la version kebab-case existe aussi
                if (directories.includes(kebabDir)) {
                    const pascalPath = path.join(dir, pascalDir);
                    const kebabPath = path.join(dir, kebabDir);

                    console.log(`Fusion de dossiers en double trouvés:`);
                    console.log(`  - ${pascalPath} (PascalCase)`);
                    console.log(`  - ${kebabPath} (kebab-case)`);

                    try {
                        // Copier tous les fichiers du dossier PascalCase vers le dossier kebab-case
                        copyRecursive(pascalPath, kebabPath);

                        // Renommer les sous-dossiers PascalCase dans le dossier kebab-case
                        console.log(`Renommage des sous-dossiers PascalCase dans ${kebabPath}...`);
                        processDirectory(kebabPath);

                        // Créer un dossier de sauvegarde temporaire pour l'ancien dossier
                        const backupDir = pascalPath + '.backup.' + Date.now();
                        console.log(`Sauvegarde du dossier ${pascalPath} vers ${backupDir} avant suppression`);
                        fs.renameSync(pascalPath, backupDir);

                        processed++;
                    } catch (err) {
                        console.error(`Erreur lors de la fusion de ${pascalPath} vers ${kebabPath}:`, err);
                        errors.push({
                            pascalPath,
                            kebabPath,
                            error: err.toString()
                        });
                    }
                }
            }

            // Traiter récursivement tous les sous-dossiers
            for (const dir of directories) {
                processDirectory(path.join(dir, dir));
            }
        } catch (err) {
            console.error(`Erreur lors du traitement du répertoire ${dir}:`, err);
        }
    }

    // Commencer le traitement à partir du répertoire de base
    processDirectory(baseDir);

    return { processed, errors };
}

// Mettre à jour les imports dans les fichiers TypeScript/JavaScript
function updateImports(baseDir) {
    try {
        console.log('Mise à jour des imports dans les fichiers...');
        const results = execSync(
            `find ${baseDir} -type f -name "*.ts" -o -name "*.js" | xargs grep -l "import.*from.*[A-Z]" || true`,
            { encoding: 'utf8' }
        ).trim().split('\n').filter(Boolean);

        let updatedFiles = 0;

        for (const file of results) {
            try {
                let content = fs.readFileSync(file, 'utf8');
                const originalContent = content;

                // Mettre à jour les imports de forme PascalCase vers kebab-case
                content = content.replace(
                    /from\s+['"](.*?)([A-Z][a-zA-Z0-9]*)(\/[^'"]*)?['"]/g,
                    (match, prefix, pascalName, suffix = '') => {
                        const kebabName = pascalToKebab(pascalName);
                        return `from '${prefix}${kebabName}${suffix}'`;
                    }
                );

                if (content !== originalContent) {
                    fs.writeFileSync(file, content, 'utf8');
                    console.log(`Imports mis à jour dans ${file}`);
                    updatedFiles++;
                }
            } catch (err) {
                console.error(`Erreur lors de la mise à jour des imports dans ${file}:`, err);
            }
        }

        return updatedFiles;
    } catch (err) {
        console.error('Erreur lors de la recherche de fichiers avec des imports à mettre à jour:', err);
        return 0;
    }
}

// Corriger le problème d'importation à la fin du fichier
function fixImportOrder(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Rechercher les imports à la fin du fichier
        const match = content.match(/(\r?\n\s*import\s+{.*?}\s+from\s+['"].*?['"];?\s*)$/);

        if (match) {
            // Déplacer ces imports au début du fichier
            const importStatement = match[1].trim();
            const newContent = importStatement + '\n\n' + content.replace(match[0], '');
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Ordre des imports corrigé dans ${filePath}`);
        }
    } catch (err) {
        console.error(`Erreur lors de la correction de l'ordre des imports dans ${filePath}:`, err);
    }
}

// Exécution principale
function main() {
    const baseDir = process.argv[2] || '/workspaces/cahier-des-charge';

    console.log(`Analyse et fusion des dossiers dupliqués dans ${baseDir}...`);
    const { processed, errors } = findAndMergeDuplicateFolders(baseDir);

    const updatedFiles = updateImports(baseDir);

    // Corriger les imports dans le fichier SupabaseOptimizationTracker.ts
    const trackerPath = '/workspaces/cahier-des-charge/agents/optimization/SupabaseOptimizationTracker.ts';
    if (fs.existsSync(trackerPath)) {
        console.log('Correction des imports dans SupabaseOptimizationTracker.ts');
        fixImportOrder(trackerPath);
    }

    console.log('\n=== RÉSULTATS ===');
    console.log(`Dossiers fusionnés: ${processed}`);
    console.log(`Fichiers avec imports mis à jour: ${updatedFiles}`);

    if (errors.length > 0) {
        console.log(`\nErreurs rencontrées: ${errors.length}`);
        console.log('Voir le log pour les détails');
    }
}

main();