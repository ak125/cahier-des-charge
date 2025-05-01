#!/usr/bin/env node

/**
 * Script pour ajouter une entrée au journal des modifications du cahier des charges
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const yaml = require('js-yaml');

// Fichier du journal des modifications
const JOURNAL_FILE = path.join(process.cwd(), 'cahier-des-charges', '38-journal-modifications.md');

// Types de modifications disponibles
const MODIFICATION_TYPES = ['ajout', 'correction', 'restructuration', 'mise à jour', 'suppression'];

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log(chalk.blue("📝 Ajout d'une entrée au journal des modifications"));

    // Vérifier si le fichier journal existe
    await checkJournalFile();

    // Collecter les informations pour la nouvelle entrée
    const entry = await collectEntryInfo();

    // Ajouter l'entrée au journal
    await addEntryToJournal(entry);

    console.log(chalk.green('✅ Entrée ajoutée avec succès au journal des modifications'));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Vérifie si le fichier journal existe
 */
async function checkJournalFile() {
  try {
    await fs.access(JOURNAL_FILE);
  } catch (error) {
    throw new Error(`Le fichier journal ${JOURNAL_FILE} n'existe pas. Veuillez le créer d'abord.`);
  }
}

/**
 * Collecte les informations pour une nouvelle entrée
 */
async function collectEntryInfo() {
  // Obtenir l'auteur depuis Git si possible
  let defaultAuthor = 'Utilisateur';
  try {
    defaultAuthor = execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch (error) {
    // Pas de configuration Git disponible
  }

  // Date actuelle formatée
  const now = new Date();
  const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

  // Demander les informations à l'utilisateur
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'date',
      message: 'Date et heure de la modification (YYYY-MM-DD HH:MM:SS):',
      default: formattedDate,
      validate: (input) =>
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input) ? true : 'Format de date incorrect',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Auteur de la modification:',
      default: defaultAuthor,
      validate: (input) => (input.trim() !== '' ? true : "L'auteur est requis"),
    },
    {
      type: 'input',
      name: 'sections',
      message: 'Sections concernées (séparées par des virgules):',
      validate: (input) => (input.trim() !== '' ? true : 'Au moins une section est requise'),
      filter: (input) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== ''),
    },
    {
      type: 'list',
      name: 'type',
      message: 'Type de modification:',
      choices: MODIFICATION_TYPES,
    },
    {
      type: 'editor',
      name: 'summary',
      message: 'Résumé de la modification:',
      validate: (input) => (input.trim() !== '' ? true : 'Le résumé est requis'),
    },
    {
      type: 'input',
      name: 'tickets',
      message: 'Tickets associés (séparés par des virgules, laisser vide si aucun):',
      filter: (input) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== ''),
    },
  ]);

  return {
    date: answers.date,
    author: answers.author,
    sections: answers.sections,
    type: answers.type,
    summary: answers.summary.trim(),
    tickets: answers.tickets,
  };
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
