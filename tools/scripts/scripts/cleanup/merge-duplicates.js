#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lire le fichier des dossiers dupliqués
const duplicatedFoldersContent = fs.readFileSync('/workspaces/cahier-des-charge/duplicated-folders.txt', 'utf8');
const duplications = [];

// Parser le contenu pour extraire les paires de dossiers dupliqués
const regex = /Duplication détectée:\s+(.+)\s+(.+)/g;
let matches;
while ((matches = regex.exec(duplicatedFoldersContent)) !== null) {
    duplications.push({
        source: matches[1].trim(),
        target: matches[2].trim()
    });
}

// Grouper par ensembles de dossiers dupliqués
const duplicateSets = new Map();

duplications.forEach(({ source, target }) => {
    // Normaliser les chemins pour éviter les problèmes de casse ou de slashes
    const normSource = path.normalize(source);
    const normTarget = path.normalize(target);

    let found = false;

    // Vérifier si l'un des chemins est déjà dans un ensemble
    for (const [key, set] of duplicateSets.entries()) {
        if (set.has(normSource) || set.has(normTarget)) {
            set.add(normSource);
            set.add(normTarget);
            found = true;
            break;
        }
    }

    // Si aucun ensemble existant ne contient ces chemins, créer un nouvel ensemble
    if (!found) {
        duplicateSets.set(`set_${duplicateSets.size}`, new Set([normSource, normTarget]));
    }
});

// Pour chaque ensemble de duplications, déterminer le dossier cible 
// (préférence pour kebab-case et les chemins plus courts)
const mergeOperations = [];

duplicateSets.forEach((pathSet, setKey) => {
    const paths = Array.from(pathSet);

    // Trier les chemins: préférer kebab-case, puis les chemins plus courts
    const sortedPaths = paths.sort((a, b) => {
        const aIsKebab = a.includes('-');
        const bIsKebab = b.includes('-');

        if (aIsKebab && !bIsKebab) return -1;
        if (!aIsKebab && bIsKebab) return 1;

        return a.length - b.length;
    });

    // Le premier chemin après le tri est notre cible préférée
    const targetPath = sortedPaths[0];

    // Les autres chemins sont à fusionner dans la cible
    sortedPaths.slice(1).forEach(sourcePath => {
        mergeOperations.push({ sourcePath, targetPath });
    });
});

// Exécuter les opérations de fusion
console.log(`Total de ${mergeOperations.length} opérations de fusion à exécuter\n`);

// Créer un journal des opérations
const logFile = '/workspaces/cahier-des-charge/merge-operations.log';
fs.writeFileSync(logFile, '# Opérations de fusion de dossiers\n\n');

// Fonction pour vérifier si un chemin existe
function pathExists(p) {
    try {
        fs.accessSync(path.resolve('/workspaces/cahier-des-charge', p.replace(/^\.\//, '')));
        return true;
    } catch (err) {
        return false;
    }
}

// Effectuer les opérations de fusion
mergeOperations.forEach(({ sourcePath, targetPath }, index) => {
    const fullSourcePath = path.resolve('/workspaces/cahier-des-charge', sourcePath.replace(/^\.\//, ''));
    const fullTargetPath = path.resolve('/workspaces/cahier-des-charge', targetPath.replace(/^\.\//, ''));

    // Vérifier si les chemins existent avant de procéder
    const sourceExists = pathExists(sourcePath);
    const targetExists = pathExists(targetPath);

    let status = 'IGNORÉ';
    let details = '';

    try {
        if (sourceExists && targetExists) {
            // Créer le dossier cible s'il n'existe pas
            fs.mkdirSync(path.dirname(fullTargetPath), { recursive: true });

            // Copier les fichiers uniques du source vers la cible
            const sourceFiles = fs.readdirSync(fullSourcePath, { withFileTypes: true });

            for (const item of sourceFiles) {
                const srcItemPath = path.join(fullSourcePath, item.name);
                const tgtItemPath = path.join(fullTargetPath, item.name);

                if (item.isDirectory()) {
                    try {
                        if (!fs.existsSync(tgtItemPath)) {
                            fs.mkdirSync(tgtItemPath, { recursive: true });
                            execSync(`cp -r "${srcItemPath}/"* "${tgtItemPath}/" 2>/dev/null || true`);
                        }
                    } catch (e) {
                        details += `Erreur lors de la copie du dossier ${item.name}: ${e.message}\n`;
                    }
                } else {
                    try {
                        if (!fs.existsSync(tgtItemPath)) {
                            fs.copyFileSync(srcItemPath, tgtItemPath);
                        }
                    } catch (e) {
                        details += `Erreur lors de la copie du fichier ${item.name}: ${e.message}\n`;
                    }
                }
            }

            // Supprimer le dossier source après la fusion
            try {
                fs.rmSync(fullSourcePath, { recursive: true, force: true });
                status = 'FUSIONNÉ';
            } catch (e) {
                status = 'ERREUR';
                details += `Erreur lors de la suppression du dossier source: ${e.message}\n`;
            }
        } else {
            if (!sourceExists) details += 'Le dossier source n\'existe pas. ';
            if (!targetExists) details += 'Le dossier cible n\'existe pas. ';
        }
    } catch (error) {
        status = 'ERREUR';
        details += `Exception générale: ${error.message}`;
    }

    // Journaliser l'opération
    const logEntry = `## Opération ${index + 1}/${mergeOperations.length}\n` +
        `- Source: ${sourcePath}\n` +
        `- Cible: ${targetPath}\n` +
        `- Statut: ${status}\n` +
        (details ? `- Détails: ${details}\n` : '') +
        '\n';

    fs.appendFileSync(logFile, logEntry);

    console.log(`[${index + 1}/${mergeOperations.length}] ${status}: ${sourcePath} → ${targetPath}`);
});

console.log(`\nFusion terminée. Journal des opérations enregistré dans ${logFile}`);