/**
 * Script de correction avancé pour résoudre les problèmes de fusion récursive
 * et les collisions de nommage dans les agents MCP.
 * 
 * Ce script:
 * 1. Identifie les structures récursives problématiques
 * 2. Extrait la version correcte de chaque fichier
 * 3. Sauvegarde ces fichiers
 * 4. Nettoie la structure de répertoires récursive
 * 5. Restaure les fichiers corrects
 * 
 * Usage: node fix-recursive-structure.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const AGENTS_DIR = path.join(__dirname, 'packages/mcp-agents');
const CLEAN_BACKUP_DIR = path.join(__dirname, 'clean-structure-backups');
const PROBLEMATIC_PATTERNS = [
    {
        name: 'QaAnalyzer',
        dir: path.join(AGENTS_DIR, 'analyzers/QaAnalyzer'),
        recursive: 'qa-analyzer',
        mainFile: 'index.ts'
    },
    {
        name: 'CaddyfileGenerator',
        dir: path.join(AGENTS_DIR, 'generators/CaddyfileGenerator'),
        recursive: 'caddyfile-generator',
        mainFile: 'caddyfile-generator.ts'
    },
    {
        name: 'CanonicalValidator',
        dir: path.join(AGENTS_DIR, 'business/validators/canonical-validator'),
        recursive: 'canonical-validator',
        mainFile: 'canonical-validator.ts'
    },
    {
        name: 'SeoChecker',
        dir: path.join(AGENTS_DIR, 'business/validators/seo-checker-agent'),
        recursive: 'seo-checker-agent',
        mainFile: 'seo-checker-agent.ts'
    },
];

// Créer le répertoire de sauvegarde propre s'il n'existe pas
if (!fs.existsSync(CLEAN_BACKUP_DIR)) {
    fs.mkdirSync(CLEAN_BACKUP_DIR, { recursive: true });
}

console.log('=== Script de correction de structure récursive ===');
console.log(`Répertoire de sauvegarde: ${CLEAN_BACKUP_DIR}\n`);

/**
 * Analyse la structure récursive pour un modèle spécifique
 */
function analyzeRecursiveStructure(pattern) {
    console.log(`\n--- Analyse de ${pattern.name} ---`);

    if (!fs.existsSync(pattern.dir)) {
        console.log(`Le répertoire ${pattern.dir} n'existe pas. Ignoré.`);
        return null;
    }

    // Recherche de structures récursives
    let findCmd = `find "${pattern.dir}" -name "${pattern.recursive}" -type d | sort`;
    let recursiveDirs;

    try {
        recursiveDirs = execSync(findCmd).toString().trim().split('\n')
            .filter(dir => dir.length > 0);
    } catch (error) {
        console.log(`Erreur lors de la recherche de structures récursives: ${error.message}`);
        return null;
    }

    console.log(`Structures récursives trouvées: ${recursiveDirs.length}`);

    if (recursiveDirs.length > 1) {
        console.log(`Répertoires récursifs détectés:`);
        recursiveDirs.forEach(dir => console.log(`  - ${dir}`));
    }

    // Recherche des fichiers principaux
    let mainFiles = [];
    try {
        findCmd = `find "${pattern.dir}" -name "${pattern.mainFile}" -type f | sort`;
        mainFiles = execSync(findCmd).toString().trim().split('\n')
            .filter(file => file.length > 0);
    } catch (error) {
        console.log(`Erreur lors de la recherche de fichiers principaux: ${error.message}`);
        return null;
    }

    console.log(`Fichiers principaux trouvés: ${mainFiles.length}`);
    if (mainFiles.length > 0) {
        console.log(`  - ${mainFiles[0]} (version considérée comme principale)`);
        if (mainFiles.length > 1) {
            console.log(`  ... et ${mainFiles.length - 1} autres copies`);
        }
    }

    return {
        recursiveDirs,
        mainFiles,
        // Prendre le fichier principal le plus haut dans la hiérarchie comme référence
        mainFilePath: mainFiles.length > 0 ? mainFiles[0] : null
    };
}

/**
 * Sauvegarde le fichier principal et clean la structure récursive
 */
function cleanAndRestore(pattern, analysis) {
    if (!analysis || !analysis.mainFilePath) {
        console.log(`Pas de fichier principal trouvé pour ${pattern.name}. Ignoré.`);
        return false;
    }

    const backupPath = path.join(CLEAN_BACKUP_DIR, `${pattern.name}-${path.basename(analysis.mainFilePath)}`);

    console.log(`\n--- Nettoyage de ${pattern.name} ---`);

    // Backup du fichier principal
    console.log(`Sauvegarde du fichier principal en ${backupPath}`);
    try {
        fs.copyFileSync(analysis.mainFilePath, backupPath);
    } catch (error) {
        console.log(`Erreur lors de la sauvegarde: ${error.message}`);
        return false;
    }

    // Supprimer les dossiers récursifs de niveau 2 et plus
    if (analysis.recursiveDirs.length > 1) {
        console.log(`Suppression des structures récursives...`);

        // Trier par profondeur (du plus profond au moins profond)
        const sortedDirs = [...analysis.recursiveDirs].sort((a, b) => {
            const depthA = a.split('/').length;
            const depthB = b.split('/').length;
            return depthB - depthA;  // Ordre décroissant
        });

        // Garder le premier niveau et supprimer les niveaux plus profonds
        const dirsToKeep = sortedDirs[sortedDirs.length - 1];
        const dirsToRemove = sortedDirs.slice(0, sortedDirs.length - 1);

        console.log(`  Conservation de: ${dirsToKeep}`);
        dirsToRemove.forEach(dir => {
            console.log(`  Suppression de: ${dir}`);
            try {
                // Utilisez rm -rf pour supprimer les répertoires
                execSync(`rm -rf "${dir}"`);
            } catch (error) {
                console.log(`  Erreur lors de la suppression de ${dir}: ${error.message}`);
            }
        });
    } else {
        console.log(`Pas de structures récursives à nettoyer.`);
    }

    // Nettoyage des fichiers .merged
    try {
        const mergedFiles = execSync(`find "${pattern.dir}" -name "*.merged*" | wc -l`).toString().trim();
        if (parseInt(mergedFiles) > 0) {
            console.log(`Suppression de ${mergedFiles} fichiers .merged...`);
            execSync(`find "${pattern.dir}" -name "*.merged*" -delete`);
        } else {
            console.log(`Pas de fichiers .merged à nettoyer.`);
        }
    } catch (error) {
        console.log(`Erreur lors du nettoyage des fichiers .merged: ${error.message}`);
    }

    // Nettoyage des dossiers _backup_
    try {
        const backupDirs = execSync(`find "${pattern.dir}" -type d -name "*_backup_*" | wc -l`).toString().trim();
        if (parseInt(backupDirs) > 0) {
            console.log(`Suppression de ${backupDirs} dossiers de backup...`);
            execSync(`find "${pattern.dir}" -type d -name "*_backup_*" -exec rm -rf {} \\; 2>/dev/null || true`);
        } else {
            console.log(`Pas de dossiers de backup à nettoyer.`);
        }
    } catch (error) {
        console.log(`Erreur lors du nettoyage des dossiers de backup: ${error.message}`);
    }

    return true;
}

/**
 * Vérifie la présence de collisions de noms dans les packages.json
 */
function checkPackageNameCollisions() {
    console.log('\n--- Vérification des collisions de noms dans package.json ---');

    try {
        // Trouver tous les package.json
        const packageJsons = execSync(`find "${AGENTS_DIR}" -name "package.json" | sort`).toString().trim().split('\n');

        // Extraire les noms des packages
        const packageNames = {};

        packageJsons.forEach(pkgPath => {
            try {
                if (!pkgPath || pkgPath.length === 0) return;

                const content = fs.readFileSync(pkgPath, 'utf8');
                const pkg = JSON.parse(content);

                if (pkg.name) {
                    if (!packageNames[pkg.name]) {
                        packageNames[pkg.name] = [];
                    }
                    packageNames[pkg.name].push(pkgPath);
                }
            } catch (error) {
                console.log(`Impossible de lire ${pkgPath}: ${error.message}`);
            }
        });

        // Vérifier les collisions
        let collisionsFound = false;
        Object.entries(packageNames).forEach(([name, paths]) => {
            if (paths.length > 1) {
                collisionsFound = true;
                console.log(`\nCollision pour le package "${name}":`);
                paths.forEach(p => console.log(`  - ${p}`));
            }
        });

        if (!collisionsFound) {
            console.log('Aucune collision de noms détectée.');
        } else {
            console.log('\nCes collisions peuvent causer des problèmes avec Jest et d\'autres outils.');
            console.log('Suggestion: Renommez les packages ou utilisez un moduleNameMapper personnalisé dans Jest');
        }
    } catch (error) {
        console.log(`Erreur lors de la vérification des collisions: ${error.message}`);
    }
}

// Analyse et nettoyage de chaque modèle problématique
PROBLEMATIC_PATTERNS.forEach(pattern => {
    const analysis = analyzeRecursiveStructure(pattern);
    if (analysis) {
        cleanAndRestore(pattern, analysis);
    }
});

// Vérifier les collisions de noms
checkPackageNameCollisions();

console.log('\n=== Nettoyage terminé ===');
console.log(`Les fichiers originaux ont été sauvegardés dans: ${CLEAN_BACKUP_DIR}`);
console.log('Exécutez à nouveau les tests pour vérifier que les problèmes sont résolus.');