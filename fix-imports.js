#!/usr/bin/env node

/**
 * Script pour corriger les problèmes d'imports
 * Ce script nettoie les apostrophes et guillemets supplémentaires dans les imports
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
  const backupPath = `${filePath}.bak-imports`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Correction des problèmes d'imports
function fixImports(content) {
  // Rechercher les lignes d'import avec des apostrophes ou guillemets supplémentaires
  const importRegex = /^(import .+?['"])(['";]+)(.*)$/gm;

  // Corriger les imports
  const fixedContent = content.replace(importRegex, (match, importStatement, quotes, rest) => {
    // Garder seulement la première apostrophe/guillemet
    const firstQuote = quotes.charAt(0);
    return `${importStatement}${rest}`;
  });

  return fixedContent;
}

// Fonction pour corriger les apostrophes et guillemets supplémentaires
function fixQuotes(content) {
  // Correction des chaînes avec des apostrophes ou guillemets supplémentaires
  // Exemple: 'text';' devient 'text';
  const stringRegex = /(["'])([^"']*?)\1(['"`]+)([,;]|$)/g;

  const fixedContent = content.replace(stringRegex, (match, openQuote, text, extraQuotes, terminator) => {
    return `${openQuote}${text}${openQuote}${terminator}`;
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

    // Corriger les imports
    content = fixImports(content);

    // Corriger les apostrophes/guillemets supplémentaires
    content = fixQuotes(content);

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
  log('cyan', '=== Correction des problèmes d\'imports ===');

  // Récupérer les arguments de ligne de commande
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('yellow', 'Aucun fichier spécifié. Usage: node fix-imports.js <chemin-du-fichier>');
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
