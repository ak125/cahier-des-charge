#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Vérifier si un nom de fichier a été fourni
if (process.argv.length < 3) {
  console.error('❌ Usage: ./fix-syntax-errors.js <file-path>');
  process.exit(1);
}

const filePath = process.argv[2];

// Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
  console.error(`❌ Le fichier ${filePath} n'existe pas`);
  process.exit(1);
}

// Créer une sauvegarde du fichier original
const backupPath = `${filePath}.bak-syntax`;
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

// Fonction pour corriger les erreurs de syntaxe courantes
function fixSyntaxErrors(content) {
  let modified = false;
  let newContent = content;

  // Correction des blocs de code mal équilibrés (accolades)
  const openBraces = (newContent.match(/\{/g) || []).length;
  const closeBraces = (newContent.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    console.log(`⚠️ Détecté: ${openBraces - closeBraces} accolades ouvrantes non fermées`);
    newContent = newContent + '\n'.repeat(openBraces - closeBraces) + '}'.repeat(openBraces - closeBraces);
    modified = true;
  } else if (closeBraces > openBraces) {
    console.log(`⚠️ Détecté: ${closeBraces - openBraces} accolades fermantes en trop`);
    // Plus difficile à corriger automatiquement
  }

  // Correction des chaînes non terminées
  newContent = newContent.replace(/(['"]((?:\\.|[^"\\])*?))([\s\n])/g, (match, start, content, end) => {
    if (start.startsWith('"') && !start.endsWith('"')) {
      modified = true;
      return `${start}"${end}`;
    }
    if (start.startsWith("'") && !start.endsWith("'")) {
      modified = true;
      return `${start}'${end}`;
    }
    return match;
  });

  // Correction des commentaires de section déséquilibrés
  newContent = newContent.replace(/\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*(?!\/)/, (match) => {
    modified = true;
    return match + '/';
  });

  // Correction des problèmes de syntaxe spécifiques à TypeScript

  // Correction des problèmes d'interface et de type mal formés
  newContent = newContent.replace(/interface\s+(\w+)\s*\{([^}]*?)(?!\})/g, (match, name, content) => {
    modified = true;
    return `interface ${name} {${content}\n}`;
  });

  newContent = newContent.replace(/type\s+(\w+)\s*=\s*(\{[^}]*?)(?!\})/g, (match, name, content) => {
    modified = true;
    return `type ${name} = ${content}\n}`;
  });

  // Correction des expressions d'objets mal formées
  newContent = newContent.replace(/\{([^{}]*?)(?!\})([\s\n])/g, (match, content, end) => {
    if (!/\{/.test(content)) { // Éviter les expressions imbriquées
      modified = true;
      return `{${content}}${end}`;
    }
    return match;
  });

  return { newContent, modified };
}

// Appliquer les corrections
const result = fixSyntaxErrors(content);
if (result.modified) {
  try {
    fs.writeFileSync(filePath, result.newContent, 'utf-8');
    console.log(`✓ Corrections appliquées à ${filePath}`);

    // Vérifier si le fichier est maintenant valide avec TypeScript (si disponible)
    try {
      execSync(`npx tsc --noEmit --allowJs ${filePath}`);
      console.log('✓ Le fichier passe maintenant la vérification TypeScript');
    } catch (error) {
      console.log('⚠️ Des erreurs TypeScript persistent après correction:');
      console.log(error.message);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'écriture des corrections: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`ℹ️ Aucune erreur de syntaxe courante détectée dans ${filePath}`);
}
