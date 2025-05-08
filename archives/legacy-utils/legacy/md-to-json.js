#!/usr/bin/env node

/**
 * md-to-json.js
 * 
 * Ce script convertit tous les fichiers Markdown en JSON pour faciliter 
 * l'intégration avec des outils d'IA.
 * 
 * Usage: node md-to-json.js [--dir=<directory>] [--output=<output_dir>]
 */

const fs = require(fsstructure-agent');
const path = require(pathstructure-agent');
const { execSync } = require(child_processstructure-agent');
const glob = require(globstructure-agent');

// Vérifier si le module glob est installé, sinon l'installer
try {
  require.resolve('glob');
} catch (e) {
  console.log('Installation du module glob...');
  execSync('npm install glob', { stdio: 'inherit' });
}

// Analyser les arguments
const args = process.argv.slice(2);
let sourceDir = path.resolve(__dirname, '../docs');
let outputDir = path.resolve(__dirname, '../json-docs');

for (const arg of args) {
  if (arg.startsWith('--dir=')) {
    sourceDir = path.resolve(arg.replace('--dir=', ''));
  } else if (arg.startsWith('--output=')) {
    outputDir = path.resolve(arg.replace('--output=', ''));
  }
}

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Extrait les métadonnées d'un fichier Markdown
 * @param {string} content Contenu du fichier Markdown
 * @returns {Object} Métadonnées extraites
 */
function extractMetadata(content) {
  const metadata = {};
  
  // Chercher un bloc YAML fronmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    frontmatter.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(part => part.trim());
      if (key && value) {
        metadata[key] = value;
      }
    });
  }
  
  // Extraire le titre (premier h1)
  const titleMatch = content.match(/^# (.*?)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }
  
  // Extraire la date si elle existe dans le fichier
  const dateMatch = content.match(/Date: (\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    metadata.date = dateMatch[1];
  } else {
    // Utiliser la date actuelle si aucune date n'est trouvée
    metadata.date = new Date().toISOString().split('T')[0];
  }
  
  return metadata;
}

/**
 * Extrait les sections d'un fichier Markdown
 * @param {string} content Contenu du fichier Markdown
 * @returns {Array} Sections extraites avec leur contenu
 */
function extractSections(content) {
  // Retirer le fronmatter si présent
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  const sections = [];
  const lines = contentWithoutFrontmatter.split('\n');
  
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    // Nouveau titre h2
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n')
        });
      }
      currentSection = line.replace(/^## /, '');
      currentContent = [];
    } 
    // Nouveau titre h1 (généralement le titre principal)
    else if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n')
        });
      }
      currentSection = 'introduction';
      currentContent = [];
    }
    // Contenu normal
    else {
      if (currentSection === null && line.trim() !== '') {
        currentSection = 'introduction';
      }
      
      if (currentSection !== null) {
        currentContent.push(line);
      }
    }
  }
  
  // Ajouter la dernière section
  if (currentSection) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n')
    });
  }
  
  return sections;
}

/**
 * Convertit un fichier Markdown en objet JSON
 * @param {string} filePath Chemin du fichier Markdown
 * @returns {Object} Objet JSON représentant le fichier Markdown
 */
function convertMdToJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(sourceDir, filePath);
  const fileName = path.basename(filePath, '.md');
  
  const metadata = extractMetadata(content);
  const sections = extractSections(content);
  
  return {
    id: fileName,
    path: relativePath,
    metadata,
    sections,
    rawContent: content,
    lastUpdated: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
    charCount: content.length
  };
}

/**
 * Fonction principale qui traite tous les fichiers Markdown
 */
function processMarkdownFiles() {
  console.log(`Recherche des fichiers Markdown dans ${sourceDir}...`);
  
  // Trouver tous les fichiers .md récursivement
  const mdFiles = glob.sync('**/*.md', { cwd: sourceDir });
  
  console.log(`${mdFiles.length} fichiers Markdown trouvés.`);
  
  // Convertir chaque fichier et l'enregistrer
  for (const mdFile of mdFiles) {
    const mdFilePath = path.join(sourceDir, mdFile);
    const jsonFilePath = path.join(outputDir, mdFile.replace('.md', '.json'));
    
    // Créer le répertoire de destination si nécessaire
    const jsonFileDir = path.dirname(jsonFilePath);
    if (!fs.existsSync(jsonFileDir)) {
      fs.mkdirSync(jsonFileDir, { recursive: true });
    }
    
    try {
      const jsonContent = convertMdToJson(mdFilePath);
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2), 'utf8');
      console.log(`✅ Converti: ${mdFile}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la conversion de ${mdFile}:`, error.message);
    }
  }
  
  // Créer un fichier index qui liste tous les documents
  const index = mdFiles.map(mdFile => {
    const jsonFilePath = path.join(outputDir, mdFile.replace('.md', '.json'));
    if (fs.existsSync(jsonFilePath)) {
      const content = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      return {
        id: content.id,
        path: content.path,
        title: content.metadata.title || content.id,
        date: content.metadata.date,
        wordCount: content.wordCount
      };
    }
    return null;
  }).filter(Boolean);
  
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  console.log(`✅ Index JSON créé avec ${index.length} documents.`);
}

// Exécution du script
console.log('Début de la conversion des fichiers Markdown en JSON...');
processMarkdownFiles();
console.log(`Conversion terminée. Les fichiers JSON sont disponibles dans: ${outputDir}`);