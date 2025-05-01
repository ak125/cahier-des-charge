#!/usr/bin/env node

/**
 * Script pour corriger les problèmes de déséquilibre dans les fichiers TypeScript
 * Ce script tente de corriger automatiquement les accolades, parenthèses et crochets déséquilibrés
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Fonction pour logger avec des couleurs
function log(type, message) {
    const color = colors[type] || colors.reset;
    console.log(`${color}${message}${colors.reset}`);
}

// Liste des fichiers avec des déséquilibres confirmés
const unbalancedFiles = [
    {
        path: 'apps/mcp-server-postgres/src/mcp-server.ts',
        issues: ['parentheses']
    },
    {
        path: 'packages/mcp-agents/types/index.ts',
        issues: ['braces', 'parentheses', 'brackets']
    }
];

// Fonction pour sauvegarder une copie de sauvegarde du fichier
function backupFile(filePath) {
    const backupPath = `${filePath}.bak`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
}

// Fonction pour équilibrer les accolades dans un contenu donné
function balanceBraces(content) {
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;

    if (openBraces > closeBraces) {
        // Ajouter des accolades fermantes manquantes à la fin du fichier
        const diff = openBraces - closeBraces;
        log('yellow', `  - Ajout de ${diff} accolades fermantes à la fin du fichier`);
        return content + '\n' + '}'.repeat(diff) + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    } else if (closeBraces > openBraces) {
        // Supprimer les accolades fermantes excédentaires à la fin
        let result = content;
        let diff = closeBraces - openBraces;
        // Cette approche est simpliste et peut nécessiter une intervention manuelle
        let lines = result.split('\n');

        // Parcourir les lignes de la fin vers le début pour trouver des accolades fermantes isolées
        for (let i = lines.length - 1; i >= 0 && diff > 0; i--) {
            if (lines[i].trim() === '}') {
                lines[i] = '// Accolade fermante supprimée: ' + lines[i];
                diff--;
            }
        }

        log('yellow', `  - Commentaire de ${closeBraces - openBraces} accolades fermantes excédentaires`);
        return lines.join('\n') + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    }

    return content;
}

// Fonction pour équilibrer les parenthèses dans un contenu donné
function balanceParentheses(content) {
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    if (openParens > closeParens) {
        // Ajouter des parenthèses fermantes manquantes à la fin du fichier
        const diff = openParens - closeParens;
        log('yellow', `  - Ajout de ${diff} parenthèses fermantes à la fin du fichier`);
        return content + '\n' + ')'.repeat(diff) + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    } else if (closeParens > openParens) {
        // Cette approche est simpliste et peut nécessiter une intervention manuelle
        let result = content;
        let diff = closeParens - openParens;
        let lines = result.split('\n');

        // Parcourir les lignes de la fin vers le début pour trouver des parenthèses fermantes isolées
        for (let i = lines.length - 1; i >= 0 && diff > 0; i--) {
            if (lines[i].trim() === ')') {
                lines[i] = '// Parenthèse fermante supprimée: ' + lines[i];
                diff--;
            }
        }

        log('yellow', `  - Commentaire de ${closeParens - openParens} parenthèses fermantes excédentaires`);
        return lines.join('\n') + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    }

    return content;
}

// Fonction pour équilibrer les crochets dans un contenu donné
function balanceBrackets(content) {
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
        // Ajouter des crochets fermants manquants à la fin du fichier
        const diff = openBrackets - closeBrackets;
        log('yellow', `  - Ajout de ${diff} crochets fermants à la fin du fichier`);
        return content + '\n' + ']'.repeat(diff) + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    } else if (closeBrackets > openBrackets) {
        // Cette approche est simpliste et peut nécessiter une intervention manuelle
        let result = content;
        let diff = closeBrackets - openBrackets;
        let lines = result.split('\n');

        // Parcourir les lignes de la fin vers le début pour trouver des crochets fermants isolés
        for (let i = lines.length - 1; i >= 0 && diff > 0; i--) {
            if (lines[i].trim() === ']') {
                lines[i] = '// Crochet fermant supprimé: ' + lines[i];
                diff--;
            }
        }

        log('yellow', `  - Commentaire de ${closeBrackets - openBrackets} crochets fermants excédentaires`);
        return lines.join('\n') + '\n// Auto-équilibré par fix-unbalanced-syntax.js\n';
    }

    return content;
}

// Fonction pour compter et trouver les chaînes non terminées
function findUnterminatedStrings(content) {
    const lines = content.split('\n');
    const problematicLines = [];

    // Motif basique pour chaînes non terminées (à améliorer)
    const singleQuotePattern = /'[^'\\]*(?:\\.[^'\\]*)*$/;
    const doubleQuotePattern = /"[^"\\]*(?:\\.[^"\\]*)*$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (singleQuotePattern.test(line) || doubleQuotePattern.test(line)) {
            // Vérifier que la ligne suivante ne commence pas par une continuation ou un commentaire
            const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
            if (!nextLine.startsWith("'") && !nextLine.startsWith('"') && !nextLine.startsWith('//') && !nextLine.startsWith('*')) {
                problematicLines.push({ lineNumber: i + 1, line });
            }
        }
    }

    return problematicLines;
}

// Fonction pour corriger un fichier
function fixFile(filePath, issues) {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        log('cyan', `Traitement de ${filePath}`);

        // Vérifier si le fichier existe
        if (!fs.existsSync(fullPath)) {
            log('red', `✗ Fichier non trouvé: ${fullPath}`);
            return false;
        }

        // Lire le contenu du fichier
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        let modified = false;

        // Sauvegarder une copie de sauvegarde
        const backupPath = backupFile(fullPath);
        log('green', `✓ Sauvegarde créée: ${backupPath}`);

        // Rechercher les chaînes non terminées
        const unterminatedStrings = findUnterminatedStrings(content);
        if (unterminatedStrings.length > 0) {
            log('yellow', `⚠ Chaînes potentiellement non terminées trouvées aux lignes:`);
            unterminatedStrings.forEach(({ lineNumber, line }) => {
                log('yellow', `  - Ligne ${lineNumber}: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
            });
        }

        // Appliquer les corrections selon les problèmes détectés
        if (issues.includes('braces')) {
            content = balanceBraces(content);
            modified = true;
        }

        if (issues.includes('parentheses')) {
            content = balanceParentheses(content);
            modified = true;
        }

        if (issues.includes('brackets')) {
            content = balanceBrackets(content);
            modified = true;
        }

        // Écrire le contenu modifié dans le fichier
        if (modified && content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            log('green', `✓ Corrections appliquées à ${filePath}`);
            return true;
        } else if (modified) {
            log('yellow', `⚠ Aucun changement n'a été apporté à ${filePath} malgré les tentatives de correction`);
            return false;
        } else {
            log('yellow', `⚠ Aucune correction n'a été appliquée à ${filePath}`);
            return false;
        }
    } catch (error) {
        log('red', `✗ Erreur lors du traitement de ${filePath}: ${error.message}`);
        return false;
    }
}

// Fonction principale
function main() {
    log('cyan', '=== Correction des déséquilibres de syntaxe dans les fichiers TypeScript ===');

    let fixedCount = 0;
    let failCount = 0;

    // Corriger chaque fichier avec des problèmes de déséquilibre connus
    for (const { path: filePath, issues } of unbalancedFiles) {
        const success = fixFile(filePath, issues);
        if (success) {
            fixedCount++;
        } else {
            failCount++;
        }
    }

    // Afficher un résumé
    log('cyan', '\n=== Résumé ===');
    log('green', `✓ ${fixedCount} fichiers corrigés avec succès`);

    if (failCount > 0) {
        log('yellow', `⚠ ${failCount} fichiers n'ont pas pu être corrigés automatiquement`);
        log('cyan', '\nCertains fichiers peuvent nécessiter une édition manuelle plus approfondie.');
        log('cyan', 'Examinez attentivement les fichiers de sauvegarde (.bak) pour comparer les changements.');
    }

    log('cyan', '\nNote: Les corrections automatiques sont basiques et peuvent nécessiter une vérification manuelle.');
    log('cyan', 'En particulier, les problèmes de chaînes non terminées sont difficiles à corriger automatiquement.');
}

// Exécuter le script
main();