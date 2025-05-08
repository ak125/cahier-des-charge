#!/usr/bin/env node

/**
 * Script pour corriger les problèmes de structure de code
 * Ce script tente de corriger les problèmes d'accolades, parenthèses, et crochets non équilibrés
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

// Fonction pour sauvegarder une copie de sauvegarde du fichier
function backupFile(filePath) {
    const backupPath = `${filePath}.bak-structure`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
}

// Fonction pour équilibrer les accolades, parenthèses, et crochets
function balanceDelimiters(content) {
    // Analyser le contenu ligne par ligne pour trouver les problèmes
    const lines = content.split('\n');
    const fixedLines = [];

    let inStringLiteral = false;
    let stringDelimiter = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Corriger les problèmes courants dans les conditions if
        line = line.replace(/if\s*\([^)]*\)\s*{$/, (match) => {
            // S'assurer que la condition if se termine correctement
            if (!match.includes('{')) {
                return `${match} {`;
            }
            return match;
        });

        // Corriger les chaînes non terminées
        line = line.replace(/(["'])([^"']*?)(\1['"`]+)([,;]|\s*$)/,
            (match, openQuote, content, extraQuotes, terminator) => {
                return `${openQuote}${content}${openQuote}${terminator}`;
            }
        );

        // Corriger les virgules/points-virgules superflus à la fin des lignes
        line = line.replace(/(['"]);(['"]);$/, '$1;');
        line = line.replace(/(['"]),(['"]),$/, '$1,');

        fixedLines.push(line);
    }

    // Reconstruire le contenu
    return fixedLines.join('\n');
}

// Fonction pour corriger les erreurs de syntaxe communes dans les structures de contrôle
function fixControlStructures(content) {
    // Corriger les "if" sans accolade ouvrante
    const fixedContent = content.replace(/if\s*\(([^)]+)\)([^{;]*)$/gm, (match, condition, rest) => {
        if (!rest.trim().endsWith('{')) {
            return `if (${condition})${rest} {`;
        }
        return match;
    });

    return fixedContent;
}

// Fonction pour corriger un fichier spécifique
function fixFile(filePath) {
    try {
        log('cyan', `Traitement de ${filePath}`);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            log('red', `✗ Fichier non trouvé: ${filePath}`);
            return false;
        }

        // Lire le contenu du fichier
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Sauvegarder une copie de sauvegarde
        const backupPath = backupFile(filePath);
        log('green', `✓ Sauvegarde créée: ${backupPath}`);

        // Appliquer les corrections
        content = balanceDelimiters(content);
        content = fixControlStructures(content);

        // Écrire le contenu modifié dans le fichier
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            log('green', `✓ Corrections appliquées à ${filePath}`);
            return true;
        } else {
            log('yellow', `⚠ Aucun changement n'a été apporté à ${filePath}`);
            return false;
        }
    } catch (error) {
        log('red', `✗ Erreur lors du traitement de ${filePath}: ${error.message}`);
        return false;
    }
}

// Fonction principale
function main() {
    log('cyan', '=== Correction des problèmes de structure de code ===');

    // Récupérer les arguments de ligne de commande
    const args = process.argv.slice(2);

    if (args.length === 0) {
        log('yellow', 'Aucun fichier spécifié. Usage: node fix-code-structure.js <chemin-du-fichier>');
        return;
    }

    let fixedCount = 0;
    let failCount = 0;

    // Traiter chaque fichier spécifié
    for (const filePath of args) {
        const success = fixFile(filePath);
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
        log('yellow', `⚠ ${failCount} fichiers n'ont pas pu être corrigés`);
    }

    log('cyan', '\nNote: Ces corrections sont basiques. Une vérification manuelle supplémentaire peut être nécessaire.');
}

// Exécuter le script
main();