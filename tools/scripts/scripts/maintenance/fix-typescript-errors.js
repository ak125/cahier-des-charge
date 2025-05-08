#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Vérifier si un nom de fichier a été fourni
if (process.argv.length < 3) {
    console.error('❌ Usage: ./fix-typescript-errors.js <file-path>');
    process.exit(1);
}

const filePath = process.argv[2];

// Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
    console.error(`❌ Le fichier ${filePath} n'existe pas`);
    process.exit(1);
}

// Créer une sauvegarde du fichier original
const backupPath = `${filePath}.bak-ts`;
try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✓ Sauvegarde créée: ${backupPath}`);
} catch (error) {
    console.error(`❌ Impossible de créer une sauvegarde: ${error.message}`);
    process.exit(1);
}

// Lire le contenu du fichier
let content;
try {
    content = fs.readFileSync(filePath, 'utf-8');
} catch (error) {
    console.error(`❌ Erreur lors de la lecture du fichier: ${error.message}`);
    process.exit(1);
}

// Fonction pour corriger les erreurs TypeScript courantes
function fixTypeScriptErrors(content) {
    let modified = false;
    let newContent = content;

    // Correction des virgules dans les expressions de comparaison
    newContent = newContent.replace(/([a-zA-Z0-9_)\]"']+)\s*,\s*([!=><]+)\s*,\s*([a-zA-Z0-9_("']+)/g, (match, left, op, right) => {
        modified = true;
        return `${left} ${op} ${right}`;
    });

    // Correction des conditions mal formées dans les if
    newContent = newContent.replace(/if\s*\(([^,)]*),\s*([!=><]+)\s*,\s*([^,)]*)\)/g, (match, left, op, right) => {
        modified = true;
        return `if (${left} ${op} ${right})`;
    });

    // Correction des boucles mal formées
    newContent = newContent.replace(/for\s*\(([^,)]*),\s*([!=><]+)\s*,\s*([^,)]*)\)/g, (match, init, cond, inc) => {
        modified = true;
        return `for (${init} ${cond} ${inc})`;
    });

    // Correction des fonctions fléchées mal formées
    newContent = newContent.replace(/\(([^,)]*),\s*=>\s*,\s*([^,)]*)\)/g, (match, param, body) => {
        modified = true;
        return `(${param} => ${body})`;
    });

    // Correction des objets mal formés
    newContent = newContent.replace(/(\w+)\s*,\s*:/g, (match, prop) => {
        modified = true;
        return `${prop}:`;
    });

    // Correction des fonctions avec paramètres mal formés
    newContent = newContent.replace(/function\s+(\w+)\s*\(([^)]*),\s*\)/g, (match, name, params) => {
        modified = true;
        return `function ${name}(${params.replace(/,\s*$/, '')})`;
    });

    // Correction des types d'union mal formés
    newContent = newContent.replace(/type\s+(\w+)\s*=\s*([^;|]+)\s*\|\s*,\s*([^;|]+)/g, (match, name, type1, type2) => {
        modified = true;
        return `type ${name} = ${type1} | ${type2}`;
    });

    // Correction des imports TypeScript mal formés
    newContent = newContent.replace(/import\s*{\s*([^}]*),\s*}\s*from/g, (match, imports) => {
        modified = true;
        return `import { ${imports.replace(/,\s*$/, '')} } from`;
    });

    // Correction des accolades mal placées dans TypeScript
    newContent = newContent.replace(/(\w+)\s*;\s*{/g, (match, stmt) => {
        modified = true;
        return `${stmt}; {`;
    });

    // Correction des expressions de type avec virgules incorrectes
    newContent = newContent.replace(/<([^>]*),\s*>/g, (match, types) => {
        modified = true;
        return `<${types.replace(/,\s*$/, '')}>`;
    });

    // Suppression des chaînes de caractères non terminées
    newContent = newContent.replace(/(['"])((?:\\\1|(?!\1).)*?)(\s*$)/gm, (match, quote, content, end) => {
        modified = true;
        return `${quote}${content}${quote}${end}`;
    });

    // Correction des définitions d'interface avec accolades manquantes
    newContent = newContent.replace(/interface\s+(\w+)\s*(?!\{)/g, (match, name) => {
        modified = true;
        return `interface ${name} {`;
    });

    // Correction des accolades déséquilibrées
    const openBraces = (newContent.match(/\{/g) || []).length;
    const closeBraces = (newContent.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
        console.log(`⚠️ Détecté: ${openBraces - closeBraces} accolades ouvrantes non fermées`);
        newContent = newContent + '\n'.repeat(openBraces - closeBraces) + '}'.repeat(openBraces - closeBraces);
        modified = true;
    }

    return { newContent, modified };
}

// Appliquer les corrections
const result = fixTypeScriptErrors(content);
if (result.modified) {
    try {
        fs.writeFileSync(filePath, result.newContent, 'utf-8');
        console.log(`✓ Corrections TypeScript appliquées à ${filePath}`);

        // Vérifier si le fichier est maintenant valide avec TypeScript
        try {
            execSync(`npx tsc --noEmit --allowJs ${filePath}`, { stdio: 'pipe' });
            console.log('✓ Le fichier passe maintenant la vérification TypeScript');
        } catch (error) {
            console.log('⚠️ Des erreurs TypeScript persistent après correction:');

            // Extraire les erreurs spécifiques pour faciliter l'identification
            const errorOutput = error.message.split('\n');
            const relevantErrors = errorOutput.filter(line =>
                line.includes('error TS') && line.includes(path.basename(filePath))
            );

            if (relevantErrors.length > 0) {
                console.log(relevantErrors.slice(0, 10).join('\n'));
                if (relevantErrors.length > 10) {
                    console.log(`... et ${relevantErrors.length - 10} autres erreurs`);
                }
            } else {
                console.log('Erreurs non identifiables dans la sortie TypeScript');
            }
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'écriture des corrections: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`ℹ️ Aucune erreur TypeScript courante détectée dans ${filePath}`);
}