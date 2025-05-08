/**
 * Script de fusion de fichiers similaires
 * 
 * Ce script prend deux fichiers en entrée et tente de les fusionner
 * en conservant toutes les fonctionnalités uniques.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Arguments attendus: targetFile otherFile
const [,, targetFile, otherFile] = process.argv;

if (!targetFile || !otherFile) {
    console.error('Usage: node merge-similar-files.js <targetFile> <otherFile>');
    process.exit(1);
}

async function mergeFiles() {
    try {
        // Lire les fichiers
        const targetContent = await readFile(targetFile, 'utf8');
        const otherContent = await readFile(otherFile, 'utf8');
        
        // Extraire les fonctions et leurs contenus
        const targetFunctions = extractFunctions(targetContent);
        const otherFunctions = extractFunctions(otherContent);
        
        // Trouver les fonctions qui n'existent que dans l'autre fichier
        const uniqueFunctionsInOther = otherFunctions.filter(
            otherFn => !targetFunctions.some(targetFn => targetFn.name === otherFn.name)
        );
        
        // Préparer le contenu fusionné
        let mergedContent = targetContent;
        
        // Si nous avons des fonctions uniques à ajouter
        if (uniqueFunctionsInOther.length > 0) {
            // Trouver un bon endroit pour insérer les nouvelles fonctions
            // Par défaut, nous les ajouterons à la fin, mais avant les exports si c'est un module
            
            // Vérifier s'il y a une ligne d'export à la fin
            const exportMatch = mergedContent.match(/\n(module\.exports|export |exports\.).*(\n*)$/);
            
            if (exportMatch) {
                // Insérer avant les exports
                const insertPosition = mergedContent.lastIndexOf(exportMatch[0]);
                
                // Préparer les fonctions à ajouter
                const functionsToAdd = uniqueFunctionsInOther
                    .map(fn => `\n\n// Fonction ajoutée depuis ${path.basename(otherFile)}\n${fn.fullText}`)
                    .join('\n');
                
                // Insérer les fonctions
                mergedContent = 
                    mergedContent.substring(0, insertPosition) +
                    functionsToAdd +
                    mergedContent.substring(insertPosition);
            } else {
                // Ajouter à la fin avec une séparation
                mergedContent += '\n\n// Fonctions ajoutées depuis ' + path.basename(otherFile) + '\n';
                uniqueFunctionsInOther.forEach(fn => {
                    mergedContent += `\n${fn.fullText}\n`;
                });
            }
            
            // Ajouter un commentaire en haut du fichier pour documenter la fusion
            const fusionComment = 
                `/**\n` +
                ` * Fichier fusionné\n` +
                ` * Ce fichier contient du contenu fusionné depuis: ${path.basename(otherFile)}\n` +
                ` * Date de fusion: ${new Date().toISOString().split('T')[0]}\n` +
                ` */\n\n`;
            
            mergedContent = fusionComment + mergedContent;
            
            // Écrire le fichier fusionné
            await writeFile(targetFile, mergedContent, 'utf8');
            console.log(`Fusion réussie: ${uniqueFunctionsInOther.length} fonctions de ${otherFile} ont été ajoutées à ${targetFile}`);
            return {
                success: true,
                addedFunctions: uniqueFunctionsInOther.length
            };
        } else {
            console.log(`Aucune fonction unique trouvée dans ${otherFile} à ajouter à ${targetFile}`);
            return {
                success: false,
                addedFunctions: 0
            };
        }
    } catch (error) {
        console.error(`Erreur lors de la fusion des fichiers:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fonction pour extraire les fonctions d'un fichier avec leur contenu complet
function extractFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    
    // Recherche des fonctions et méthodes
    let inFunction = false;
    let currentFunction = null;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Vérifier si on est au début d'une fonction
        if (!inFunction) {
            // Vérifier différents modèles de déclaration de fonction
            const fnMatches = [
                // function name() {
                line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/),
                // const name = () => {
                line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*{/),
                // name() {
                line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/)
            ];
            
            // Vérifier si l'un des modèles correspond
            const match = fnMatches.find(m => m !== null);
            
            if (match) {
                // Ignorer les structures de contrôle (if, for, etc.)
                const name = match[1];
                if (!['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
                    inFunction = true;
                    braceCount = (line.match(/{/g) || []).length;
                    braceCount -= (line.match(/}/g) || []).length;
                    
                    // Chercher les commentaires au-dessus de la fonction
                    let commentStart = i;
                    while (commentStart > 0 && 
                          (lines[commentStart - 1].trim().startsWith('*') || 
                           lines[commentStart - 1].trim().startsWith('/') || 
                           lines[commentStart - 1].trim() === '')) {
                        commentStart--;
                    }
                    
                    currentFunction = {
                        name,
                        startLine: commentStart,
                        lines: [lines.slice(commentStart, i + 1).join('\n')],
                        fullText: lines.slice(commentStart, i + 1).join('\n')
                    };
                    
                    // Si la fonction se termine sur cette même ligne
                    if (braceCount === 0 && line.includes('}')) {
                        inFunction = false;
                        functions.push(currentFunction);
                        currentFunction = null;
                    }
                }
            }
        } 
        // Si on est déjà dans une fonction, continuer à collecter les lignes
        else if (inFunction) {
            currentFunction.lines.push(line);
            currentFunction.fullText += '\n' + line;
            
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            // Si le nombre d'accolades ouvrantes et fermantes correspond, la fonction est terminée
            if (braceCount === 0) {
                inFunction = false;
                functions.push(currentFunction);
                currentFunction = null;
            }
        }
    }
    
    return functions;
}

// Exécuter la fusion
mergeFiles().then(result => {
    if (result.success) {
        process.exit(0);
    } else if (result.addedFunctions === 0) {
        // Code de sortie spécial pour indiquer qu'aucune fusion n'était nécessaire
        process.exit(2);
    } else {
        process.exit(1);
    }
}).catch(() => process.exit(1));
