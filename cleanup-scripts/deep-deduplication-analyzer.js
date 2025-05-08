#!/usr/bin/env node

/**
 * Script d'analyse et de consolidation profonde pour éliminer tous les doublons
 * 
 * Ce script analyse récursivement tous les sous-dossiers pour identifier :
 * - Les doublons exacts (même contenu)
 * - Les doublons fonctionnels (contenu similaire)
 * - Les doublons avec variations de nommage
 * 
 * Usage: 
 *   node deep-deduplication-analyzer.js [--analyze-only] [--verbose]
 * 
 * Options:
 *   --analyze-only  Analyser uniquement sans effectuer de consolidation
 *   --verbose       Afficher des informations détaillées pendant l'exécution
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const { exec } = require('child_process');
const execAsync = util.promisify(exec);

// Configuration
const ROOT_PATH = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(__dirname, '../cleanup-report/deep-deduplication-report.md');
const CONSOLIDATION_PLAN_PATH = path.resolve(__dirname, '../cleanup-report/deep-deduplication-plan.json');

// Options
const options = {
    analyzeOnly: process.argv.includes('--analyze-only'),
    verbose: process.argv.includes('--verbose')
};

// Constantes
const TARGET_EXTENSIONS = ['.ts', '.js', '.json'];
const IGNORE_PATTERNS = [
    'node_modules',
    'dist',
    '.git',
    'public',
    'assets',
    'bin',
    'examples'
];

// Structure des résultats
let results = {
    exactDuplicates: [], // Fichiers ayant exactement le même contenu
    similarFiles: [], // Fichiers ayant un contenu similaire
    duplicateDirectories: [], // Dossiers ayant une structure similaire
    duplicateAgents: [], // Agents similaires dans différents dossiers
    caseVariations: [], // Variations de majuscules/minuscules pour les mêmes entités
    separatorVariations: [], // Variations de séparateurs (tiret, point, sans séparateur)
    consolidationPlan: [] // Plan des actions de consolidation recommandées
};

// Fonction pour calculer le hash du contenu d'un fichier
function calculateFileHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// Fonction pour calculer le score de similarité entre deux contenus textuels
function calculateSimilarity(text1, text2) {
    // Normalisation du texte (suppression des espaces supplémentaires, commentaires, etc.)
    const normalizedText1 = text1
        .replace(/\/\/.*$/gm, '') // Supprimer les commentaires //
        .replace(/\/\*[\s\S]*?\*\//g, '') // Supprimer les commentaires /* */
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedText2 = text2
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Si les textes sont identiques après normalisation, ils sont très similaires
    if (normalizedText1 === normalizedText2) {
        return 1;
    }

    // Sinon, utiliser une approche simplifiée de similarité basée sur les mots communs
    const words1 = new Set(normalizedText1.split(/\s+/));
    const words2 = new Set(normalizedText2.split(/\s+/));

    // Si l'un des textes est vide ou ne contient que des espaces
    if (words1.size === 0 || words2.size === 0) {
        return 0;
    }

    // Calculer le nombre de mots communs
    let commonWords = 0;
    for (const word of words1) {
        if (words2.has(word)) {
            commonWords++;
        }
    }

    // Fonction de similarité de Jaccard
    const similarity = commonWords / (words1.size + words2.size - commonWords);
    return similarity;
}

// Fonction pour analyser les exportations d'un fichier
function extractExports(content) {
    const exports = new Set();

    // Capturer les exportations nommées
    const namedExportRegex = /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
        exports.add(match[2]);
    }

    // Capturer les exportations par défaut
    const defaultExportRegex = /export\s+default\s+(?:(?:const|let|var|function|class|interface|type|enum)\s+)?(\w+)/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
        exports.add(`default: ${match[1]}`);
    }

    return [...exports];
}

// Fonction pour trouver la casse normalisée (kebab-case)
function normalizeToKebabCase(name) {
    return name
        .replace(/([a-z])([A-Z])/g, '$1-$2') // CamelCase -> kebab-case
        .replace(/\s+/g, '-')                // spaces -> dash
        .replace(/\./g, '-')                 // dots -> dash
        .replace(/_/g, '-')                  // snake_case -> kebab-case
        .toLowerCase();                      // Tout en minuscule
}

// Fonction pour extraire le nom de base d'un agent
function extractBaseAgentName(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));

    // Supprimer les suffixes comme -12345678 ou -12345678-87654321
    const baseFileName = fileName.replace(/-[0-9a-f]{8}(-[0-9a-f]{8})?$/, '');

    // Supprimer le suffixe -agent s'il existe
    const withoutAgentSuffix = baseFileName.replace(/-agent$/, '');

    return normalizeToKebabCase(withoutAgentSuffix);
}

// Fonction pour regrouper des fichiers par similarité de nom (kebab-case, camelCase, etc.)
function groupSimilarNames(files) {
    const groups = new Map();

    for (const file of files) {
        const baseName = extractBaseAgentName(file);

        if (!groups.has(baseName)) {
            groups.set(baseName, []);
        }

        groups.get(baseName).push(file);
    }

    // Filtrer pour ne garder que les groupes avec des doublons
    return Array.from(groups.entries())
        .filter(([_, files]) => files.length > 1)
        .map(([baseName, files]) => ({ baseName, files }));
}

// Fonction pour déterminer le type d'agent à partir du nom de fichier ou du chemin
function categorizeAgent(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
    const dirPath = path.dirname(filePath).toLowerCase();

    const categories = [];

    // Catégorisation par nom de fichier
    if (fileName.includes('analyzer') || fileName.includes('analyser')) {
        categories.push('analyzer');
    }
    if (fileName.includes('validator') || fileName.includes('checker')) {
        categories.push('validator');
    }
    if (fileName.includes('generator') || fileName.includes('builder')) {
        categories.push('generator');
    }
    if (fileName.includes('orchestrator') || fileName.includes('coordinator')) {
        categories.push('orchestrator');
    }
    if (fileName.includes('parser')) {
        categories.push('parser');
    }

    // Catégorisation par chemin
    if (dirPath.includes('analyzer') || dirPath.includes('analyser')) {
        if (!categories.includes('analyzer')) categories.push('analyzer');
    }
    if (dirPath.includes('validator') || dirPath.includes('checker')) {
        if (!categories.includes('validator')) categories.push('validator');
    }
    if (dirPath.includes('generator') || dirPath.includes('builder')) {
        if (!categories.includes('generator')) categories.push('generator');
    }
    if (dirPath.includes('orchestrator') || dirPath.includes('coordinator')) {
        if (!categories.includes('orchestrator')) categories.push('orchestrator');
    }
    if (dirPath.includes('parser')) {
        if (!categories.includes('parser')) categories.push('parser');
    }

    // Si aucune catégorie trouvée, utiliser 'misc'
    if (categories.length === 0) {
        categories.push('misc');
    }

    return categories;
}

// Fonction récursive pour scanner les fichiers
async function scanFiles(dirPath, fileMap = new Map(), hashMap = new Map(), depth = 0) {
    if (IGNORE_PATTERNS.some(pattern => dirPath.includes(pattern))) {
        return { fileMap, hashMap };
    }

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Récursion dans les sous-dossiers
                await scanFiles(entryPath, fileMap, hashMap, depth + 1);
            } else if (entry.isFile() && TARGET_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
                try {
                    const content = fs.readFileSync(entryPath, 'utf-8');
                    const hash = calculateFileHash(content);

                    if (!hashMap.has(hash)) {
                        hashMap.set(hash, []);
                    }
                    hashMap.get(hash).push(entryPath);

                    fileMap.set(entryPath, {
                        path: entryPath,
                        content,
                        hash,
                        size: content.length,
                        exports: extractExports(content),
                        categories: categorizeAgent(entryPath),
                        baseName: extractBaseAgentName(entryPath)
                    });
                } catch (error) {
                    console.error(`Erreur lors de la lecture du fichier ${entryPath}:`, error);
                }
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture du dossier ${dirPath}:`, error);
    }

    return { fileMap, hashMap };
}

// Fonction pour trouver les doublons exacts (même hash)
function findExactDuplicates(hashMap) {
    return Array.from(hashMap.entries())
        .filter(([_, files]) => files.length > 1)
        .map(([hash, files]) => ({
            hash,
            files,
            count: files.length
        }))
        .sort((a, b) => b.count - a.count);
}

// Fonction pour trouver les fichiers similaires
function findSimilarFiles(fileMap) {
    const similarFiles = [];
    const processed = new Set();

    const files = Array.from(fileMap.values());

    for (let i = 0; i < files.length; i++) {
        const file1 = files[i];
        if (processed.has(file1.path)) continue;

        const group = {
            baseName: file1.baseName,
            files: [file1.path],
            similarities: []
        };

        for (let j = i + 1; j < files.length; j++) {
            const file2 = files[j];
            if (processed.has(file2.path) || file1.hash === file2.hash) continue;

            // Si les noms de base sont similaires ou s'ils partagent des catégories
            const sharedCategories = file1.categories.filter(cat => file2.categories.includes(cat));

            if (file1.baseName === file2.baseName || sharedCategories.length > 0) {
                const similarity = calculateSimilarity(file1.content, file2.content);

                // Considérer comme similaire si la similarité est > 60%
                if (similarity > 0.6) {
                    group.files.push(file2.path);
                    group.similarities.push({
                        file1: file1.path,
                        file2: file2.path,
                        score: Math.round(similarity * 100),
                        sharedCategories
                    });

                    processed.add(file2.path);
                }
            }
        }

        if (group.files.length > 1) {
            similarFiles.push(group);
            processed.add(file1.path);
        }
    }

    return similarFiles.sort((a, b) => b.files.length - a.files.length);
}

// Fonction pour trouver les doublons avec variations de nommage
function findNameVariations(fileMap) {
    const allFiles = Array.from(fileMap.keys());
    return groupSimilarNames(allFiles);
}

// Fonction pour créer un plan de consolidation
function createConsolidationPlan(results) {
    const plan = [];
    const processedFiles = new Set();

    // Traiter les doublons exacts en premier (priorité absolue)
    for (const group of results.exactDuplicates) {
        // Choisir le fichier à conserver (préférer les chemins les plus courts et les plus significatifs)
        const files = [...group.files].sort((a, b) => {
            // Préférer les fichiers hors des dossiers d'archives
            const aIsArchive = a.includes('/archives/') || a.includes('/backup/');
            const bIsArchive = b.includes('/archives/') || b.includes('/backup/');
            if (aIsArchive && !bIsArchive) return 1;
            if (!aIsArchive && bIsArchive) return -1;

            // Préférer les chemins les plus courts
            const aSegments = a.split(path.sep).length;
            const bSegments = b.split(path.sep).length;
            if (aSegments !== bSegments) return aSegments - bSegments;

            // Préférer les noms sans suffixes hexadécimaux
            const aHasHex = /[0-9a-f]{8}/.test(path.basename(a));
            const bHasHex = /[0-9a-f]{8}/.test(path.basename(b));
            if (aHasHex && !bHasHex) return 1;
            if (!aHasHex && bHasHex) return -1;

            // Par défaut, trier par chemin
            return a.localeCompare(b);
        });

        const keepFile = files[0];
        const removeFiles = files.slice(1);

        plan.push({
            type: 'exactDuplicate',
            keep: keepFile,
            remove: removeFiles,
            reason: 'Contenu identique'
        });

        // Marquer les fichiers comme traités
        files.forEach(file => processedFiles.add(file));
    }

    // Traiter ensuite les doublons similaires
    for (const group of results.similarFiles) {
        // Ignorer les groupes où tous les fichiers ont déjà été traités
        const remainingFiles = group.files.filter(file => !processedFiles.has(file));
        if (remainingFiles.length <= 1) continue;

        // Trier par critères de sélection similaires à ci-dessus
        const files = [...remainingFiles].sort((a, b) => {
            const aIsArchive = a.includes('/archives/') || a.includes('/backup/');
            const bIsArchive = b.includes('/archives/') || b.includes('/backup/');
            if (aIsArchive && !bIsArchive) return 1;
            if (!aIsArchive && bIsArchive) return -1;

            // Préférer les fichiers standards aux archives
            if (a.includes('packages/business') && !b.includes('packages/business')) return -1;
            if (!a.includes('packages/business') && b.includes('packages/business')) return 1;

            // Préférer les chemins les moins profonds
            const aSegments = a.split(path.sep).length;
            const bSegments = b.split(path.sep).length;
            if (aSegments !== bSegments) return aSegments - bSegments;

            return a.localeCompare(b);
        });

        const keepFile = files[0];
        const removeFiles = files.slice(1);

        plan.push({
            type: 'similarFiles',
            keep: keepFile,
            remove: removeFiles,
            reason: `Fichiers similaires avec base commune '${group.baseName}'`
        });

        // Marquer les fichiers comme traités
        files.forEach(file => processedFiles.add(file));
    }

    // Traiter les variations de nommage
    for (const group of results.caseVariations) {
        const remainingFiles = group.files.filter(file => !processedFiles.has(file));
        if (remainingFiles.length <= 1) continue;

        // Logique similaire pour choisir quel fichier conserver
        const files = [...remainingFiles].sort((a, b) => {
            // Préférer kebab-case
            const aIsKebabCase = /-/.test(path.basename(a));
            const bIsKebabCase = /-/.test(path.basename(b));
            if (aIsKebabCase && !bIsKebabCase) return -1;
            if (!aIsKebabCase && bIsKebabCase) return 1;

            // Autres critères comme ci-dessus
            const aIsArchive = a.includes('/archives/') || a.includes('/backup/');
            const bIsArchive = b.includes('/archives/') || b.includes('/backup/');
            if (aIsArchive && !bIsArchive) return 1;
            if (!aIsArchive && bIsArchive) return -1;

            return a.localeCompare(b);
        });

        const keepFile = files[0];
        const removeFiles = files.slice(1);

        plan.push({
            type: 'nameVariation',
            keep: keepFile,
            remove: removeFiles,
            reason: `Variations de nommage pour la même entité '${group.baseName}'`
        });

        // Marquer les fichiers comme traités
        files.forEach(file => processedFiles.add(file));
    }

    return plan;
}

// Fonction pour générer un rapport MD
function generateMarkdownReport(results, consolidationPlan) {
    const timestamp = new Date().toLocaleString('fr-FR');

    let markdown = `# Rapport d'analyse profonde des doublons
Date: ${timestamp}

## Résumé

- **Doublons exacts** : ${results.exactDuplicates.length} groupes (${results.exactDuplicates.reduce((acc, group) => acc + group.files.length - 1, 0)} fichiers dupliqués)
- **Fichiers similaires** : ${results.similarFiles.length} groupes (${results.similarFiles.reduce((acc, group) => acc + group.files.length - 1, 0)} fichiers similaires)
- **Variations de nommage** : ${results.caseVariations.length} groupes
- **Plan de consolidation** : ${consolidationPlan.length} actions

## Doublons exacts

Les groupes suivants contiennent des fichiers avec un contenu 100% identique :

${results.exactDuplicates.slice(0, 20).map(group => `
### Groupe avec ${group.files.length} fichiers identiques (hash: ${group.hash})

${group.files.map(file => `- \`${file}\``).join('\n')}
`).join('\n')}
${results.exactDuplicates.length > 20 ? `\n...et ${results.exactDuplicates.length - 20} autres groupes` : ''}

## Fichiers similaires

Les groupes suivants contiennent des fichiers dont le contenu est très similaire :

${results.similarFiles.slice(0, 20).map(group => `
### Groupe '${group.baseName}' (${group.files.length} fichiers)

${group.files.map(file => `- \`${file}\``).join('\n')}

Similarités :
${group.similarities.map(sim => `- \`${path.basename(sim.file1)}\` et \`${path.basename(sim.file2)}\` : ${sim.score}% (catégories partagées : ${sim.sharedCategories.join(', ')})`).join('\n')}
`).join('\n')}
${results.similarFiles.length > 20 ? `\n...et ${results.similarFiles.length - 20} autres groupes` : ''}

## Variations de nommage

Les groupes suivants représentent la même entité avec différentes conventions de nommage :

${results.caseVariations.slice(0, 20).map(group => `
### Groupe '${group.baseName}' (${group.files.length} fichiers)

${group.files.map(file => `- \`${file}\``).join('\n')}
`).join('\n')}
${results.caseVariations.length > 20 ? `\n...et ${results.caseVariations.length - 20} autres groupes` : ''}

## Plan de consolidation

Voici le plan proposé pour consolider les fichiers dupliqués :

${consolidationPlan.slice(0, 20).map(action => `
### Action "${action.type}"

- **Fichier à conserver** : \`${action.keep}\`
- **Fichiers à supprimer** : 
${action.remove.map(file => `  - \`${file}\``).join('\n')}
- **Raison** : ${action.reason}
`).join('\n')}
${consolidationPlan.length > 20 ? `\n...et ${consolidationPlan.length - 20} autres actions` : ''}

## Recommandations

1. **Harmonisation des conventions de nommage** : Adopter une convention unique pour tous les agents (kebab-case recommandé)
2. **Structure de dossiers standardisée** : Organiser les agents par type fonctionnel dans une arborescence cohérente
3. **Centralisation des implémentations** : Regrouper toutes les versions d'un même agent dans un seul dossier avec versionnage explicite
4. **Documentation des différences** : Documenter clairement les différences entre versions similaires d'agents

## Prochaines étapes

1. Valider le plan de consolidation proposé
2. Effectuer la consolidation par phases (d'abord les doublons exacts, puis les similaires)
3. Mettre à jour les références dans le code après chaque consolidation
4. Mettre en place des linters et des règles pour prévenir de futurs doublons
`;

    fs.writeFileSync(REPORT_PATH, markdown, 'utf-8');
    console.log(`📄 Rapport généré: ${REPORT_PATH}`);
}

// Fonction pour écrire le plan de consolidation en JSON
function writeConsolidationPlan(plan) {
    fs.writeFileSync(CONSOLIDATION_PLAN_PATH, JSON.stringify(plan, null, 2), 'utf-8');
    console.log(`📝 Plan de consolidation enregistré: ${CONSOLIDATION_PLAN_PATH}`);
}

// Fonction pour exécuter la consolidation
async function executeConsolidation(plan) {
    let successCount = 0;
    let errorCount = 0;

    console.log('🚀 Exécution du plan de consolidation...');

    for (let i = 0; i < plan.length; i++) {
        const action = plan[i];
        console.log(`\n⚙️ Action ${i + 1}/${plan.length}: ${action.type} - ${action.reason}`);
        console.log(`  📂 Conserver: ${action.keep}`);
        console.log(`  🗑️ Supprimer ${action.remove.length} fichier(s)`);

        try {
            // Vérifier que le fichier à conserver existe
            if (!fs.existsSync(action.keep)) {
                console.error(`  ❌ Erreur: Le fichier à conserver ${action.keep} n'existe pas`);
                errorCount++;
                continue;
            }

            // Mettre à jour les références avant de supprimer les fichiers
            for (const fileToRemove of action.remove) {
                try {
                    if (fs.existsSync(fileToRemove)) {
                        // Mettre à jour les références à ce fichier
                        await updateReferences(fileToRemove, action.keep);

                        // Supprimer le fichier
                        fs.unlinkSync(fileToRemove);
                        console.log(`  ✅ Supprimé: ${fileToRemove}`);
                    } else {
                        console.warn(`  ⚠️ Fichier déjà supprimé: ${fileToRemove}`);
                    }
                } catch (err) {
                    console.error(`  ❌ Erreur lors de la suppression de ${fileToRemove}:`, err);
                    errorCount++;
                }
            }

            successCount++;
        } catch (err) {
            console.error(`  ❌ Erreur lors de la consolidation:`, err);
            errorCount++;
        }
    }

    console.log(`\n✅ Consolidation terminée: ${successCount} actions réussies, ${errorCount} erreurs`);
}

// Fonction pour mettre à jour les références à un fichier
async function updateReferences(oldFilePath, newFilePath) {
    // Extraire les noms de fichier sans extension ni chemin
    const oldFileName = path.basename(oldFilePath, path.extname(oldFilePath));
    const newFileName = path.basename(newFilePath, path.extname(newFilePath));

    // Extraire les chemins relatifs pour les imports
    const oldDir = path.dirname(oldFilePath);
    const newDir = path.dirname(newFilePath);

    console.log(`  🔄 Mise à jour des références: ${oldFileName} → ${newFileName}`);

    try {
        const { stdout } = await execAsync(`grep -r --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" "${oldFileName}" ${ROOT_PATH} | grep -v "node_modules" | grep import`);

        const lines = stdout.trim().split('\n').filter(Boolean);

        for (const line of lines) {
            const [filePath, matchingLine] = line.split(':', 2);

            if (!matchingLine || !filePath) continue;

            // Ignorer les fichiers de build et les node_modules
            if (filePath.includes('node_modules') || filePath.includes('/dist/')) {
                continue;
            }

            try {
                let content = fs.readFileSync(filePath, 'utf-8');

                // Calculer le chemin relatif de l'import
                const importingDir = path.dirname(filePath);
                const relativePathToOld = path.relative(importingDir, oldDir);
                const relativePathToNew = path.relative(importingDir, newDir);

                // Mettre à jour les imports
                const oldImportPattern = new RegExp(`(from\\s+['"])${relativePathToOld}/${oldFileName}(['"])`, 'g');
                const newImport = `$1${relativePathToNew}/${newFileName}$2`;

                const updatedContent = content.replace(oldImportPattern, newImport);

                if (content !== updatedContent) {
                    fs.writeFileSync(filePath, updatedContent, 'utf-8');
                    console.log(`    📝 Mise à jour des imports dans: ${filePath}`);
                }
            } catch (err) {
                console.error(`    ❌ Erreur lors de la mise à jour des références dans ${filePath}:`, err);
            }
        }
    } catch (error) {
        // Si grep ne trouve rien, c'est OK
        if (!error.stdout && error.stderr) {
            return;
        }
        console.error(`  ❌ Erreur lors de la recherche des références:`, error);
    }
}

// Fonction principale d'analyse
async function analyze() {
    console.log('🔍 Analyse profonde des doublons en cours...');
    console.log('📂 Scan des fichiers...');

    const startTime = Date.now();
    const { fileMap, hashMap } = await scanFiles(ROOT_PATH);

    console.log(`📊 ${fileMap.size} fichiers analysés en ${(Date.now() - startTime) / 1000}s`);

    console.log('🔎 Recherche des doublons exacts...');
    results.exactDuplicates = findExactDuplicates(hashMap);

    console.log('🔎 Recherche des fichiers similaires...');
    results.similarFiles = findSimilarFiles(fileMap);

    console.log('🔎 Recherche des variations de nommage...');
    results.caseVariations = findNameVariations(fileMap);

    console.log('📝 Création du plan de consolidation...');
    const consolidationPlan = createConsolidationPlan(results);

    console.log('📋 Génération du rapport...');
    generateMarkdownReport(results, consolidationPlan);
    writeConsolidationPlan(consolidationPlan);

    return { results, consolidationPlan };
}

// Fonction principale
async function main() {
    try {
        const { consolidationPlan } = await analyze();

        // Afficher les statistiques
        console.log('\n📊 Statistiques des doublons:');
        console.log(`- Doublons exacts: ${results.exactDuplicates.length} groupes (${results.exactDuplicates.reduce((acc, group) => acc + group.files.length - 1, 0)} fichiers dupliqués)`);
        console.log(`- Fichiers similaires: ${results.similarFiles.length} groupes (${results.similarFiles.reduce((acc, group) => acc + group.files.length - 1, 0)} fichiers similaires)`);
        console.log(`- Variations de nommage: ${results.caseVariations.length} groupes`);
        console.log(`- Plan de consolidation: ${consolidationPlan.length} actions`);

        if (!options.analyzeOnly) {
            // Demander confirmation avant d'exécuter la consolidation
            console.log('\n⚠️ La consolidation va supprimer des fichiers. Assurez-vous d\'avoir une sauvegarde ou un commit récent.');
            console.log('Pour exécuter sans consolidation, utilisez l\'option --analyze-only');

            // Dans un environnement réel, on demanderait confirmation ici
            // Dans ce cas, on procède directement à la consolidation
            await executeConsolidation(consolidationPlan);
        } else {
            console.log('\n👉 Mode analyse uniquement. Aucune modification n\'a été effectuée.');
            console.log('👉 Pour exécuter la consolidation, relancez sans l\'option --analyze-only');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error);
        process.exit(1);
    }
}

// Exécution du script
main();