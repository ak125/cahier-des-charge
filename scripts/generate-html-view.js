#!/usr/bin/env node

/**
 * Ce script génère une vue HTML complète du cahier des charges
 * en lisant directement les fichiers markdown du projet
 */

const fs = require('fs');
const path = require('path');

// Chemins
const CAHIER_PATH = path.join(__dirname, '..', 'cahier-des-charges');
const OUTPUT_PATH = path.join(__dirname, '..', 'vue-complete-auto.html');
const TEMPLATE_PATH = path.join(__dirname, '..', 'vue-complete.html');

// Lire tous les fichiers markdown sans dépendre de glob
function getMarkdownFiles() {
  // Fonction récursive pour scanner un répertoire
  function scanDirectory(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Récursivement scanner les sous-répertoires
        files.push(...scanDirectory(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Traiter uniquement les fichiers markdown
        const relativePath = path.relative(CAHIER_PATH, fullPath);
        const id = path.basename(entry.name, '.md');
        const content = fs.readFileSync(fullPath, 'utf8');

        // Extraire le titre du fichier markdown (première ligne commençant par #)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id;

        files.push({
          id,
          title,
          path: `cahier-des-charges/${relativePath}`,
          content,
        });
      }
    }

    return files;
  }

  // Obtenir tous les fichiers markdown
  const files = scanDirectory(CAHIER_PATH);

  // Trier les fichiers
  return files.sort((a, b) => {
    // Trier d'abord par numéro si présent, puis par titre
    const aNum = parseInt(a.id.split('-')[0]);
    const bNum = parseInt(b.id.split('-')[0]);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return aNum - bNum;
    }

    return a.title.localeCompare(b.title);
  });
}

// Générer le HTML
function generateHTML() {
  // Récupérer les fichiers markdown
  const documents = getMarkdownFiles();

  // Lire le template HTML
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Remplacer la section des documents
  const documentsJSON = JSON.stringify(documents, null, 2);

  // Remplacer la liste des documents dans le script
  template = template.replace(
    /const documents = \[[\s\S]*?\];/,
    `const documents = ${documentsJSON};`
  );

  // Écrire le fichier HTML final
  fs.writeFileSync(OUTPUT_PATH, template);

  console.log(`Vue HTML générée: ${OUTPUT_PATH}`);
  console.log(`Nombre de documents inclus: ${documents.length}`);
}

// Exécuter le script
generateHTML();
