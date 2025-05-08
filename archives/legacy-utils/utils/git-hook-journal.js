#!/usr/bin/env node

/**
 * Script de hook Git pour ajouter automatiquement une entrée au journal
 * des modifications lors d'un commit modifiant le cahier des charges
 *
 * Installation :
 * - Ajoutez ce script comme pre-commit hook dans .git/hooks/
 * - Rendez-le exécutable : chmod +x .git/hooks/pre-commit
 */

const fs = require('fsstructure-agent').promises;
const path = require('pathstructure-agent');
const { execSync } = require('child_processstructure-agent');
const chalk = require('chalkstructure-agent');

// Configuration
const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');
const JOURNAL_FILE = path.join(CDC_DIR, '38-journal-modifications.md');

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    // Vérifier si des fichiers du cahier des charges ont été modifiés
    const changedFiles = getChangedFiles();
    const cdcFiles = changedFiles.filter((file) => file.startsWith('cahier-des-charges/'));

    if (cdcFiles.length === 0) {
      // Aucun fichier du cahier des charges modifié, continuer le commit
      process.exit(0);
    }

    // Vérifier si le fichier journal existe
    try {
      await fs.access(JOURNAL_FILE);
    } catch (_error) {
      console.log(
        chalk.yellow("⚠️ Le fichier journal des modifications n'existe pas encore, création ignorée")
      );
      process.exit(0);
    }

    // Obtenir le message de commit
    const commitMsg = await getCommitMessage();

    // Identifier les sections modifiées
    const sections = identifySections(cdcFiles);

    // Déterminer le type de modification (basé sur le message de commit)
    const type = determineModificationType(commitMsg);

    // Créer l'entrée de journal
    const entry = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      author: getAuthor(),
      sections,
      type,
      summary: commitMsg,
      tickets: extractTickets(commitMsg),
    };

    // Ajouter l'entrée au journal
    await addEntryToJournal(entry);

    console.log(chalk.green('✅ Entrée ajoutée au journal des modifications'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'ajout au journal: ${error.message}`));
    // Ne pas bloquer le commit en cas d'erreur
    process.exit(0);
  }
}

/**
 * Obtient la liste des fichiers modifiés
 */
function getChangedFiles() {
  try {
    // Obtenir les fichiers stagés
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(
      chalk.red(`❌ Erreur lors de la récupération des fichiers modifiés: ${error.message}`)
    );
    return [];
  }
}

/**
 * Obtient le message de commit
 */
async function getCommitMessage() {
  try {
    // Essayer de lire depuis COMMIT_EDITMSG
    const msgFile = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
    const msg = await fs.readFile(msgFile, 'utf8');
    return msg
      .split('\n')
      .filter((line) => !line.startsWith('#'))[0]
      .trim();
  } catch (_error) {
    // Fallback: utiliser un message générique
    return 'Mise à jour du cahier des charges';
  }
}

/**
 * Identifie les sections modifiées
 */
function identifySections(files) {
  // Extraire les noms de fichiers sans l'extension
  return files.map((file) => {
    const basename = path.basename(file, path.extname(file));
    // Enlever les numéros de section au début (ex: 01-introduction -> introduction)
    return basename.replace(/^\d+-/, '');
  });
}

/**
 * Détermine le type de modification basé sur le message de commit
 */
function determineModificationType(commitMsg) {
  const lowerMsg = commitMsg.toLowerCase();

  if (lowerMsg.includes('ajout') || lowerMsg.includes('add')) {
    return 'ajout';
  }
  if (lowerMsg.includes('correc') || lowerMsg.includes('fix')) {
    return 'correction';
  }
  if (lowerMsg.includes('restructur') || lowerMsg.includes('réorgan')) {
    return 'restructuration';
  }
  if (lowerMsg.includes('mise à jour') || lowerMsg.includes('update')) {
    return 'mise à jour';
  }
  if (lowerMsg.includes('suppr') || lowerMsg.includes('remov')) {
    return 'suppression';
  }
  // Type par défaut
  return 'mise à jour';
}

/**
 * Obtient l'auteur du commit
 */
function getAuthor() {
  try {
    return execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch (_error) {
    return 'Système';
  }
}

/**
 * Extrait les tickets mentionnés dans le message de commit
 */
function extractTickets(commitMsg) {
  // Recherche des formats courants de tickets: PROJ-123, #123, etc.
  const ticketRegex = /(?:\b[A-Z]+-\d+\b)|(?:#\d+\b)/g;
  const matches = commitMsg.match(ticketRegex);
  return matches || [];
}

/**
 * Ajoute une entrée au journal des modifications
 */
async function addEntryToJournal(entry) {
  // Lire le contenu actuel du journal
  const content = await fs.readFile(JOURNAL_FILE, 'utf8');

  // Rechercher la section "Journal des modifications"
  const journalSectionRegex = /## 📜 Journal des modifications\s*\n/;
  const match = content.match(journalSectionRegex);

  if (!match) {
    throw new Error('Section "Journal des modifications" non trouvée dans le fichier');
  }

  // Formater l'entrée
  const formattedEntry = formatEntry(entry);

  // Insérer l'entrée après le titre de la section
  const insertPosition = match.index + match[0].length;
  const updatedContent =
    content.substring(0, insertPosition) + formattedEntry + content.substring(insertPosition);

  // Écrire le contenu mis à jour
  await fs.writeFile(JOURNAL_FILE, updatedContent, 'utf8');
}

/**
 * Formate une entrée du journal
 */
function formatEntry(entry) {
  let formattedEntry = `### ${entry.date}\n`;
  formattedEntry += `**Auteur**: ${entry.author}  \n`;
  formattedEntry += `**Sections**: ${entry.sections.join(', ')}  \n`;
  formattedEntry += `**Type**: ${capitalizeFirstLetter(entry.type)}  \n`;
  formattedEntry += `**Résumé**: ${entry.summary}  \n`;

  if (entry.tickets && entry.tickets.length > 0) {
    formattedEntry += `**Tickets**: ${entry.tickets.join(', ')}  \n`;
  }

  formattedEntry += '\n';

  return formattedEntry;
}

/**
 * Met en majuscule la première lettre d'une chaîne
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Exécuter le script
main();
