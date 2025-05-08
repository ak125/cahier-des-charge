#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Vérifier si un nom de fichier a été fourni
if (process.argv.length < 3) {
  console.error('❌ Usage: ./fix-quotes.js <file-path>');
  process.exit(1);
}

const filePath = process.argv[2];

// Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
  console.error(`❌ Le fichier ${filePath} n'existe pas`);
  process.exit(1);
}

// Lire le fichier
let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (error) {
  console.error(`❌ Erreur lors de la lecture du fichier: ${error.message}`);
  process.exit(1);
}

// Créer une sauvegarde du fichier original
const backupPath = `${filePath}.bak-quotes`;
try {
  fs.writeFileSync(backupPath, content, 'utf-8');
  console.log(`✓ Sauvegarde créée: ${backupPath}`);
} catch (error) {
  console.error(`❌ Impossible de créer une sauvegarde: ${error.message}`);
  process.exit(1);
}

// Correction des problèmes de chaînes non terminées
function fixQuoteIssues(content) {
  let modified = false;
  let newContent = content;

  // Correction des chaînes avec triple apostrophe ou triple guillemet
  newContent = newContent.replace(/'\'\'|\"\"\"|\'\'\"/g, (match) => {
    modified = true;
    return match.charAt(0);
  });

  // Correction des problèmes d'importation avec apostrophes supplémentaires
  newContent = newContent.replace(/(import[^;]*from\s+)['"]([^'"]*?)['"]'['"]'/g, (match, importStmt, path) => {
    modified = true;
    return `${importStmt}'${path}'`;
  });

  // Correction des virgules entre expressions dans les comparaisons
  newContent = newContent.replace(/([a-zA-Z0-9_)\]"']+)\s*,\s*([!=><]+)\s*,\s*([a-zA-Z0-9_("']+)/g, (match, left, op, right) => {
    modified = true;
    return `${left} ${op} ${right}`;
  });

  // Suppression des apostrophes/guillemets supplémentaires dans les chaînes
  newContent = newContent.replace(/(['"]).+?\1(['"])\1/g, (match, q1, q2) => {
    modified = true;
    return `${q1}${match.substring(1, match.length - 2)}${q1}`;
  });

  // Correction spécifique pour 'status: \'OK\' | \'Partial\' | \'Failed\';'
  newContent = newContent.replace(/status:\s+\'([^\']+)\'\s+\|\s+\'([^\']+)\'\s+\|\s+\'([^\']+)\'\;/g, (match, s1, s2, s3) => {
    modified = true;
    return `status: '${s1}' | '${s2}' | '${s3}';`;
  });

  return { newContent, modified };
}

// Correction des problèmes de virgules incorrectes
function fixCommaIssues(content) {
  let modified = false;
  let newContent = content;

  // Correction des virgules dans les conditions if
  newContent = newContent.replace(/if\s*\(([^,)]*),\s*([!=><]+)\s*,\s*([^,)]*)\)/g, (match, left, op, right) => {
    modified = true;
    return `if (${left} ${op} ${right})`;
  });

  // Correction des virgules dans les expressions ===, !==, etc.
  newContent = newContent.replace(/([a-zA-Z0-9_)\]"']+)\s*,\s*([!=><]+)\s*,\s*([a-zA-Z0-9_("']+)/g, (match, left, op, right) => {
    modified = true;
    return `${left} ${op} ${right}`;
  });

  return { newContent, modified };
}

// Correction des problèmes de apostrophes/guillemets dans les chaînes
const quoteResult = fixQuoteIssues(content);
let finalContent = quoteResult.newContent;
let modified = quoteResult.modified;

// Correction des problèmes de virgules
const commaResult = fixCommaIssues(finalContent);
finalContent = commaResult.newContent;
modified = modified || commaResult.modified;

// Enregistrer les modifications si des changements ont été effectués
if (modified) {
  try {
    fs.writeFileSync(filePath, finalContent, 'utf-8');
    console.log(`✓ Corrections appliquées à ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'écriture des corrections: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`⚠ Aucun problème de citation ou de virgule identifié dans ${filePath}`);
}