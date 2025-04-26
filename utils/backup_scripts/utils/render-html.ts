import * as fs from fs/promisesstructure-agent';
import * as path from pathstructure-agent';
import { execSync } from child_processstructure-agent';

/**
 * Charger la configuration
 */
async function getConfig() {
  try {
    const configPath = path.resolve('./cahier_check.config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Erreur lors du chargement de la configuration: ${error.message}`);
    return {
      paths: { 
        cahier: './cahier/',
        htmlOutput: './dist/cahier.html'
      }
    };
  }
}

/**
 * Génère une vue HTML du cahier des charges
 */
async function renderHtml(): Promise<void> {
  console.log('🔍 Démarrage de la génération de la vue HTML...');
  
  try {
    // Charger la configuration
    const config = await getConfig();
    const cahierPath = path.resolve(config.paths.cahier);
    const htmlOutputPath = path.resolve(config.paths.htmlOutput || './dist/cahier.html');
    
    // Vérifier si le répertoire existe
    await fs.access(cahierPath);
    
    // Créer le répertoire de sortie si nécessaire
    await fs.mkdir(path.dirname(htmlOutputPath), { recursive: true });
    
    // Trouver tous les fichiers Markdown
    console.log('📂 Recherche des fichiers Markdown...');
    const mdFiles = await findMarkdownFiles(cahierPath);
    console.log(`📄 Trouvé ${mdFiles.length} fichiers Markdown`);
    
    if (mdFiles.length === 0) {
      console.error('❌ Aucun fichier Markdown trouvé. Impossible de générer le HTML.');
      process.exit(1);
    }
    
    // Générer le HTML
    console.log('🔧 Génération du HTML...');
    const html = await generateHtml(mdFiles);
    
    // Écrire le fichier HTML
    await fs.writeFile(htmlOutputPath, html, 'utf8');
    console.log(`✅ Vue HTML générée: ${htmlOutputPath}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la génération HTML: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Trouve tous les fichiers Markdown
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subDirFiles = await findMarkdownFiles(fullPath);
        result.push(...subDirFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.markdown'))) {
        // Exclure les fichiers .audit.md qui sont générés automatiquement
        if (!entry.name.includes('.audit.md') || entry.name === 'README.md') {
          result.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche de fichiers Markdown: ${error.message}`);
  }
  
  // Trier les fichiers par nom
  return result.sort((a, b) => {
    const nameA = path.basename(a);
    const nameB = path.basename(b);
    
    // Mettre README.md et sommaire.md en premier
    if (nameA === 'README.md' || nameA === '00-sommaire.md') return -1;
    if (nameB === 'README.md' || nameB === '00-sommaire.md') return 1;
    
    // Trier par préfixe numérique si présent
    const numA = nameA.match(/^(\d+)-/);
    const numB = nameB.match(/^(\d+)-/);
    
    if (numA && numB) {
      return parseInt(numA[1]) - parseInt(numB[1]);
    }
    
    // Sinon, trier par ordre alphabétique
    return nameA.localeCompare(nameB);
  });
}

/**
 * Génère le HTML à partir des fichiers Markdown
 */
async function generateHtml(mdFiles: string[]): Promise<string> {
  // Trouver le fichier de sommaire s'il existe
  const summaryFile = mdFiles.find(file => {
    const name = path.basename(file);
    return name === 'README.md' || name === '00-sommaire.md' || name === 'sommaire.md';
  });
  
  // Variables pour le HTML
  let title = 'Cahier des Charges';
  let tocHtml = '<h2>Table des matières</h2>\n<ul>';
  let contentHtml = '';
  
  // Traiter d'abord le sommaire s'il existe
  if (summaryFile) {
    const summaryContent = await fs.readFile(summaryFile, 'utf8');
    const titleMatch = summaryContent.match(/^#\s+(.+)$/m);
    
    if (titleMatch) {
      title = titleMatch[1];
    }
    
    // Convertir le sommaire en HTML
    contentHtml += `<div class="chapter" id="summary">\n${convertMarkdownToHtml(summaryContent)}\n</div>\n\n`;
    
    // Supprimer le sommaire de la liste pour ne pas le traiter deux fois
    mdFiles = mdFiles.filter(file => file !== summaryFile);
  }
  
  // Traiter les autres fichiers
  for (const file of mdFiles) {
    const fileName = path.basename(file);
    const mdContent = await fs.readFile(file, 'utf8');
    
    // Extraire le titre du fichier
    let fileTitle = fileName.replace(/\.md$/, '').replace(/^\d+-/, '');
    const titleMatch = mdContent.match(/^#\s+(.+)$/m);
    
    if (titleMatch) {
      fileTitle = titleMatch[1];
    }
    
    // Ajouter au sommaire
    const fileId = fileName.replace(/\.md$/, '').replace(/\s+/g, '-').toLowerCase();
    tocHtml += `<li><a href="#${fileId}">${fileTitle}</a></li>\n`;
    
    // Ajouter le contenu
    contentHtml += `<div class="chapter" id="${fileId}">\n${convertMarkdownToHtml(mdContent)}\n</div>\n\n`;
  }
  
  // Fermer le sommaire
  tocHtml += '</ul>';
  
  // Construire le HTML complet
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    h3 { color: #2980b9; }
    a { color: #2980b9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      overflow: auto;
    }
    code {
      background-color: #f8f8f8;
      padding: 2px 4px;
      border-radius: 4px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th { background-color: #f2f2f2; }
    .chapter {
      margin-bottom: 40px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    #toc {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    .warning { color: #e74c3c; }
    .success { color: #27ae60; }
    @media print {
      body { max-width: 100%; }
      pre, code { white-space: pre-wrap; }
      a { color: #000; }
    }
  </style>
</head>
<body>
  <div id="toc">
    ${tocHtml}
  </div>
  
  ${contentHtml}
  
  <footer>
    <p>Généré le ${new Date().toLocaleString()}</p>
  </footer>

  <script>
    // Navigation simplifiée
    document.querySelectorAll('#toc a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Conversion simple de Markdown en HTML
 * Note: Pour un projet réel, utilisez une bibliothèque comme marked ou remark
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Titre h1
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Titre h2
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  
  // Titre h3
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  
  // Titre h4
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  
  // Titre h5
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Liens
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  
  // Listes à puces
  html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Listes numérotées
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ol>$&</ol>');
  
  // Blocs de code
  html = html.replace(/```([^`]+)```/gs, '<pre><code>$1</code></pre>');
  
  // Code inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Tableaux (simplifié)
  const tableRegex = /^\|(.+)\|$/gm;
  const tableMatches = html.match(new RegExp(tableRegex.source + '(\\s*\\n\\s*' + tableRegex.source + ')+', 'g'));
  
  if (tableMatches) {
    for (const tableMatch of tableMatches) {
      let tableHtml = '<table>\n<thead>\n<tr>\n';
      const rows = tableMatch.split('\n').filter(row => row.trim() !== '');
      
      // Traitement de l'en-tête
      const headerCells = rows[0].split('|').filter(cell => cell.trim() !== '');
      for (const cell of headerCells) {
        tableHtml += `<th>${cell.trim()}</th>\n`;
      }
      tableHtml += '</tr>\n</thead>\n<tbody>\n';
      
      // Ignorer la ligne de séparation (2e ligne)
      const dataRows = rows.slice(2);
      
      // Traitement des lignes de données
      for (const row of dataRows) {
        tableHtml += '<tr>\n';
        const cells = row.split('|').filter(cell => cell.trim() !== '');
        for (const cell of cells) {
          tableHtml += `<td>${cell.trim()}</td>\n`;
        }
        tableHtml += '</tr>\n';
      }
      
      tableHtml += '</tbody>\n</table>';
      html = html.replace(tableMatch, tableHtml);
    }
  }
  
  // Paragraphes (à faire en dernier pour éviter de perturber les autres remplacements)
  html = html.replace(/^([^<\n].+)$/gm, '<p>$1</p>');
  
  // Supprimer les paragraphes vides
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

// Exécuter la fonction principale si appelé directement
if (require.main === module) {
  renderHtml();
}

export default renderHtml;
