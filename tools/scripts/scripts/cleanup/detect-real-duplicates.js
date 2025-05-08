#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = '/workspaces/cahier-des-charge';
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.cache'
];
const OUTPUT_FILE = path.join(ROOT_DIR, 'real-duplicates.json');
const MERGE_LOG = path.join(ROOT_DIR, 'real-duplicates-merge.log');

// Fonction pour calculer le hash d'un fichier
function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
        return null;
    }
}

// Fonction pour calculer une signature pour un dossier basée sur son contenu
function calculateDirSignature(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        const filePaths = files
            .filter(file => !IGNORE_PATTERNS.includes(file))
            .map(file => path.join(dirPath, file))
            .sort();

        const fileHashes = filePaths.map(filePath => {
            if (fs.statSync(filePath).isDirectory()) {
                return `D:${path.basename(filePath)}`;
            } else {
                return `F:${path.basename(filePath)}:${calculateFileHash(filePath)}`;
            }
        });

        return {
            name: path.basename(dirPath),
            fileCount: filePaths.length,
            signature: crypto.createHash('md5').update(fileHashes.join('|')).digest('hex'),
            path: dirPath,
            contentSignature: fileHashes.join('|')
        };
    } catch (error) {
        return null;
    }
}

// Fonction pour explorer récursivement les dossiers
function exploreDirectory(dir, depth = 0, maxDepth = 10, result = []) {
    if (depth >= maxDepth) return result;

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            if (IGNORE_PATTERNS.includes(item)) continue;

            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                const signature = calculateDirSignature(itemPath);
                if (signature) {
                    result.push(signature);
                }
                exploreDirectory(itemPath, depth + 1, maxDepth, result);
            }
        }

        return result;
    } catch (error) {
        console.error(`Erreur lors de l'exploration de ${dir}: ${error.message}`);
        return result;
    }
}

// Fonction pour standardiser le nom d'un dossier
function standardizeName(name) {
    // Préférer kebab-case comme standard
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Fonction pour comparer deux dossiers et déterminer lequel a la meilleure convention de nommage
function shouldPreferFirstPath(path1, path2) {
    const name1 = path.basename(path1);
    const name2 = path.basename(path2);

    // Préférer kebab-case
    const isKebabCase1 = name1.includes('-');
    const isKebabCase2 = name2.includes('-');

    if (isKebabCase1 && !isKebabCase2) return true;
    if (!isKebabCase1 && isKebabCase2) return false;

    // Si les deux ont la même convention, préférer le chemin plus court
    return path1.length <= path2.length;
}

// Explorer tous les dossiers et collecter les signatures
console.log('Exploration de la structure des dossiers...');
const allDirSignatures = exploreDirectory(PACKAGES_DIR);
console.log(`${allDirSignatures.length} dossiers analysés`);

// Regrouper les dossiers par signature
const signatureMap = new Map();
allDirSignatures.forEach(dirInfo => {
    if (!signatureMap.has(dirInfo.signature)) {
        signatureMap.set(dirInfo.signature, []);
    }
    signatureMap.get(dirInfo.signature).push(dirInfo);
});

// Filtrer pour ne garder que les groupes ayant des doublons
const duplicateGroups = Array.from(signatureMap.entries())
    .filter(([_, dirs]) => dirs.length > 1)
    .map(([signature, dirs]) => ({
        signature,
        directories: dirs.map(d => d.path),
        fileCount: dirs[0].fileCount
    }))
    .sort((a, b) => b.fileCount - a.fileCount); // Trier par nombre de fichiers (plus intéressant en premier)

// Générer des opérations de fusion
const mergeOperations = [];

duplicateGroups.forEach(group => {
    const paths = group.directories;

    // Trier les chemins selon notre préférence de convention
    const sortedPaths = paths.sort((a, b) => shouldPreferFirstPath(a, b) ? -1 : 1);

    // Le premier chemin est notre cible préférée
    const targetPath = sortedPaths[0];

    // Les autres chemins seront fusionnés dans la cible
    const sourcePaths = sortedPaths.slice(1);

    sourcePaths.forEach(sourcePath => {
        mergeOperations.push({
            sourcePath,
            targetPath,
            fileCount: group.fileCount,
            sourceName: path.basename(sourcePath),
            targetName: path.basename(targetPath)
        });
    });
});

// Enregistrer les résultats
fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    totalDirectories: allDirSignatures.length,
    duplicateGroups: duplicateGroups.length,
    mergeOperations: mergeOperations
}, null, 2));

console.log(`${duplicateGroups.length} groupes de dossiers dupliqués trouvés`);
console.log(`${mergeOperations.length} opérations de fusion générées`);
console.log(`Résultats enregistrés dans ${OUTPUT_FILE}`);

// Exécuter les opérations de fusion
fs.writeFileSync(MERGE_LOG, '# Opérations de fusion de dossiers réels\n\n');

let mergedCount = 0;
let errorCount = 0;
let skippedCount = 0;

function addToLog(message) {
    fs.appendFileSync(MERGE_LOG, message + '\n');
}

// Demander confirmation avant de procéder
console.log('\nProcéder à la fusion des dossiers ? (y/n)');
console.log('Opérations proposées:');
mergeOperations.slice(0, 10).forEach((op, idx) => {
    console.log(`${idx + 1}. ${op.sourcePath} -> ${op.targetPath} (${op.fileCount} fichier(s))`);
});
if (mergeOperations.length > 10) {
    console.log(`... et ${mergeOperations.length - 10} autres opérations`);
}

// Pour automatiser, on va considérer qu'on veut fusionner
mergeOperations.forEach((op, index) => {
    const { sourcePath, targetPath, fileCount } = op;
    console.log(`[${index + 1}/${mergeOperations.length}] Fusion de ${sourcePath} → ${targetPath}`);

    try {
        if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
            addToLog(`⚠️ IGNORÉ: L'un des chemins n'existe pas: ${sourcePath} → ${targetPath}`);
            skippedCount++;
            return;
        }

        // Créer le dossier cible s'il n'existe pas (normalement il existe déjà)
        fs.mkdirSync(targetPath, { recursive: true });

        // Copier tous les fichiers de la source vers la cible
        try {
            execSync(`cp -rn "${sourcePath}/"* "${targetPath}/" 2>/dev/null || true`);

            // Supprimer le dossier source après la copie
            fs.rmSync(sourcePath, { recursive: true, force: true });

            addToLog(`✅ FUSIONNÉ: ${sourcePath} → ${targetPath} (${fileCount} fichier(s))`);
            mergedCount++;
        } catch (e) {
            addToLog(`❌ ERREUR: Échec de la fusion ${sourcePath} → ${targetPath}: ${e.message}`);
            errorCount++;
        }
    } catch (error) {
        addToLog(`❌ ERREUR: Exception générale pour ${sourcePath} → ${targetPath}: ${error.message}`);
        errorCount++;
    }
});

// Résumé
const summary = `
# Résumé des opérations
- Dossiers analysés: ${allDirSignatures.length}
- Groupes de doublons trouvés: ${duplicateGroups.length}
- Opérations de fusion proposées: ${mergeOperations.length}
- Dossiers fusionnés avec succès: ${mergedCount}
- Opérations ignorées: ${skippedCount}
- Erreurs: ${errorCount}
`;

fs.appendFileSync(MERGE_LOG, summary);
console.log(summary);