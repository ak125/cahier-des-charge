#!/usr/bin/env node

/**
 * Script de détection des duplications de code
 * Ce script permet de :
 * 1. Analyser les fichiers de code source pour détecter des segments similaires
 * 2. Générer un rapport des duplications trouvées
 * 3. Suggérer des opportunités de refactoring
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(ROOT_DIR, 'code-duplication-report.json');
const EXTENSIONS_TO_CHECK = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.php'];
const MIN_LINES = 6; // Nombre minimum de lignes pour considérer une duplication
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const ONLY_DIR = process.argv.find(arg => arg.startsWith('--dir='))?.split('=')[1];

// Structure pour stocker les duplications
const duplications = new Map();
// Index de hachage pour les segments de code
const codeSegments = new Map();
// Statistiques
const stats = {
    filesScanned: 0,
    linesScanned: 0,
    duplicationsFound: 0,
    duplicatedLines: 0,
    scanStartTime: Date.now()
};

/**
 * Génère un hash pour un segment de code
 * @param {string} code - Le segment de code à hacher
 * @returns {string} - Le hash du code
 */
function hashCode(code) {
    return crypto.createHash('md5').update(code.trim()).digest('hex');
}

/**
 * Normalise le code pour la comparaison
 * - Supprime les commentaires
 * - Supprime les espaces supplémentaires
 * @param {string} code - Le code à normaliser
 * @returns {string} - Le code normalisé
 */
function normalizeCode(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Supprime les commentaires
        .replace(/^\s+|\s+$/gm, '')                // Supprime les espaces de début/fin de ligne
        .replace(/\s+/g, ' ')                       // Réduit les espaces multiples en un seul
        .trim();
}

/**
 * Détermine si un fichier doit être analysé selon son extension
 * @param {string} filePath - Chemin vers le fichier
 * @returns {boolean} - True si le fichier doit être analysé
 */
function shouldAnalyzeFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSIONS_TO_CHECK.includes(ext);
}

/**
 * Vérifie si un dossier doit être exclu
 * @param {string} dirPath - Chemin du dossier
 * @returns {boolean} - True si le dossier doit être exclu
 */
function shouldExcludeDir(dirPath) {
    const dirName = path.basename(dirPath);
    return EXCLUDE_DIRS.includes(dirName);
}

/**
 * Divise le contenu d'un fichier en segments de code et les analyse
 * @param {string} filePath - Chemin vers le fichier
 * @param {string} content - Contenu du fichier
 */
function analyzeFileContent(filePath, content) {
    const lines = content.split('\n');
    stats.linesScanned += lines.length;

    // Analyser les segments de longueur MIN_LINES dans le fichier
    for (let i = 0; i <= lines.length - MIN_LINES; i++) {
        const segment = lines.slice(i, i + MIN_LINES).join('\n');
        const normalizedSegment = normalizeCode(segment);

        // Si le segment normalisé est vide ou trop court, ignorer
        if (normalizedSegment.length < 30) continue;

        const hash = hashCode(normalizedSegment);

        if (!codeSegments.has(hash)) {
            codeSegments.set(hash, [{
                file: filePath,
                startLine: i + 1,
                endLine: i + MIN_LINES,
                code: segment
            }]);
        } else {
            const existingSegments = codeSegments.get(hash);
            // Vérifier si c'est une duplication dans un autre fichier
            const isDuplicate = existingSegments.some(seg => seg.file !== filePath);

            if (isDuplicate || existingSegments.length > 1) {
                // C'est une duplication
                existingSegments.push({
                    file: filePath,
                    startLine: i + 1,
                    endLine: i + MIN_LINES,
                    code: segment
                });

                codeSegments.set(hash, existingSegments);
                duplications.set(hash, existingSegments);
                stats.duplicationsFound++;
                stats.duplicatedLines += MIN_LINES;
            }
        }
    }
}

/**
 * Parcourt récursivement les dossiers pour analyser les fichiers
 * @param {string} dir - Dossier à parcourir
 */
function scanDirectory(dir) {
    if (shouldExcludeDir(dir)) {
        if (VERBOSE) console.log(`Exclusion du dossier: ${dir}`);
        return;
    }

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                scanDirectory(fullPath);
            } else if (entry.isFile() && shouldAnalyzeFile(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    analyzeFileContent(fullPath, content);
                    stats.filesScanned++;

                    if (VERBOSE && stats.filesScanned % 100 === 0) {
                        console.log(`Fichiers analysés: ${stats.filesScanned}`);
                    }
                } catch (err) {
                    console.error(`Erreur lors de la lecture du fichier ${fullPath}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error(`Erreur lors de l'analyse du dossier ${dir}:`, err.message);
    }
}

/**
 * Génère un rapport sur les duplications détectées
 */
function generateReport() {
    const scanTimeInSeconds = Math.round((Date.now() - stats.scanStartTime) / 1000);

    // Transformer les duplications en format JSON
    const duplicationsArray = Array.from(duplications.entries()).map(([hash, instances]) => ({
        hash,
        occurrences: instances.length,
        totalLines: instances.length * MIN_LINES,
        instances: instances.map(inst => ({
            file: path.relative(ROOT_DIR, inst.file),
            startLine: inst.startLine,
            endLine: inst.endLine,
            snippet: inst.code.split('\n').slice(0, 3).join('\n') + (inst.code.split('\n').length > 3 ? '...' : '')
        }))
    }));

    // Trier par nombre d'occurrences
    duplicationsArray.sort((a, b) => b.occurrences - a.occurrences);

    const report = {
        summary: {
            filesScanned: stats.filesScanned,
            linesScanned: stats.linesScanned,
            duplicationsFound: duplicationsArray.length,
            duplicatedSegments: stats.duplicationsFound,
            duplicatedLines: stats.duplicatedLines,
            scanTimeSeconds: scanTimeInSeconds
        },
        duplications: duplicationsArray,
        timestamp: new Date().toISOString(),
        config: {
            minLines: MIN_LINES,
            extensions: EXTENSIONS_TO_CHECK
        }
    };

    return report;
}

/**
 * Affiche un résumé des duplications détectées
 * @param {Object} report - Rapport de duplication
 */
function printSummary(report) {
    console.log('\n=== RAPPORT DE DUPLICATION DE CODE ===');
    console.log(`Fichiers analysés: ${report.summary.filesScanned}`);
    console.log(`Lignes de code analysées: ${report.summary.linesScanned}`);
    console.log(`Segments dupliqués uniques: ${report.summary.duplicationsFound}`);
    console.log(`Total d'instances dupliquées: ${report.summary.duplicatedSegments}`);
    console.log(`Lignes dupliquées: ${report.summary.duplicatedLines}`);
    console.log(`Temps d'analyse: ${report.summary.scanTimeSeconds} secondes`);

    console.log('\n=== TOP 5 DES DUPLICATIONS ===');
    report.duplications.slice(0, 5).forEach((dup, index) => {
        console.log(`\n#${index + 1}: ${dup.occurrences} occurrences (${dup.totalLines} lignes au total)`);
        console.log('Exemple de code:');
        console.log('```');
        console.log(dup.instances[0].snippet);
        console.log('```');
        console.log('Fichiers concernés:');
        dup.instances.forEach(inst => {
            console.log(`- ${inst.file} (lignes ${inst.startLine}-${inst.endLine})`);
        });
    });
}

/**
 * Fonction principale
 */
async function main() {
    console.log('Début de l\'analyse des duplications de code...');

    // Déterminer le répertoire à analyser
    const dirToScan = ONLY_DIR ? path.join(ROOT_DIR, ONLY_DIR) : ROOT_DIR;

    if (!fs.existsSync(dirToScan)) {
        console.error(`Erreur: Le répertoire '${dirToScan}' n'existe pas.`);
        process.exit(1);
    }

    console.log(`Analyse du répertoire: ${dirToScan}`);
    console.log(`Extensions recherchées: ${EXTENSIONS_TO_CHECK.join(', ')}`);
    console.log(`Taille minimale du segment: ${MIN_LINES} lignes`);

    // Lancer l'analyse
    scanDirectory(dirToScan);

    // Générer le rapport
    const report = generateReport();

    // Afficher le résumé
    printSummary(report);

    // Sauvegarder le rapport
    if (!DRY_RUN) {
        fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
        console.log(`\nRapport détaillé sauvegardé dans ${REPORT_FILE}`);
        console.log('\nSuggestions de refactoring:');
        console.log('- Extraire les segments dupliqués en fonctions utilitaires');
        console.log('- Créer des composants/classes réutilisables pour les motifs répétés');
        console.log('- Considérer l\'utilisation de mixins ou d\'héritage pour partager le code');
    } else {
        console.log('\nMode simulation (dry-run): le rapport n\'a pas été sauvegardé');
    }
}

// Exécuter le script
if (require.main === module) {
    main().catch(err => {
        console.error('Erreur lors de l\'analyse des duplications:', err);
        process.exit(1);
    });
}

module.exports = {
    scanDirectory,
    analyzeFileContent,
    generateReport
};